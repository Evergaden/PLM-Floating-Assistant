use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};

use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use futures_util::{SinkExt, StreamExt};
use rand::RngCore;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::{net::TcpListener, sync::mpsc};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use uuid::Uuid;
use zip::ZipArchive;

const BRIDGE_ADDRESS: &str = "127.0.0.1:37191";
const MAX_EXCEL_BYTES: usize = 40 * 1024 * 1024;

#[derive(Clone)]
struct BridgeState {
    inner: Arc<BridgeInner>,
}

struct BridgeInner {
    token: String,
    snapshot_path: PathBuf,
    sender: Mutex<Option<mpsc::UnboundedSender<Message>>>,
    products: Mutex<Vec<FinalizedProduct>>,
    pending: Mutex<HashMap<String, PendingAssets>>,
    script_version: Mutex<String>,
}

#[derive(Clone)]
struct PendingAssets {
    sku: String,
    excel_path: PathBuf,
    sku_image_path: PathBuf,
    english_path: PathBuf,
    size_path: PathBuf,
    overwrite: bool,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct FinalizedProduct {
    sku: String,
    #[serde(default)]
    brand: String,
    #[serde(default)]
    name: String,
    #[serde(default)]
    english_name: String,
    #[serde(default)]
    finalized_at: String,
    #[serde(default)]
    finalized_date: String,
    #[serde(default)]
    cache_updated_at_ms: u64,
    #[serde(default)]
    package_size_text: String,
    #[serde(default)]
    package_size_label: String,
    #[serde(default)]
    package_nums: Vec<f64>,
    #[serde(default)]
    package_length: String,
    #[serde(default)]
    package_width: String,
    #[serde(default)]
    package_height: String,
    #[serde(default)]
    product_nums: Vec<f64>,
    #[serde(default)]
    plm_product_nums: Vec<f64>,
    #[serde(default)]
    product_length: String,
    #[serde(default)]
    product_width: String,
    #[serde(default)]
    product_height: String,
    #[serde(default)]
    single_bottle: bool,
    #[serde(default)]
    has_inner_card: bool,
    #[serde(default)]
    net_content: String,
    #[serde(default)]
    gross_weight: String,
    #[serde(default)]
    ingredients: String,
    #[serde(default)]
    reference_url: String,
    #[serde(default)]
    sku_image_url: String,
    #[serde(default)]
    sku_image_fallback_url: String,
    #[serde(default)]
    benchmark_image_url: String,
    #[serde(default)]
    benchmark_image_fallback_url: String,
    #[serde(default)]
    package_code: String,
    #[serde(default)]
    print_code: String,
    #[serde(default)]
    purchase_price: String,
    #[serde(default)]
    pack_qty: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct BridgeInfo {
    url: String,
    token: String,
    connected: bool,
    script_version: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProductPreview {
    product: FinalizedProduct,
    folder: Option<String>,
    transparent_image: Option<String>,
    excel_path: Option<String>,
    sku_image_path: Option<String>,
    english_path: Option<String>,
    size_path: Option<String>,
    excel_exists: bool,
    sku_image_exists: bool,
    english_exists: bool,
    size_exists: bool,
    ambiguous_folders: Vec<String>,
    missing: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ArchivePacksResult {
    logs: Vec<String>,
    success: usize,
    skipped: usize,
    failed: usize,
    deleted: usize,
}

struct RenameRule {
    pattern: Regex,
    target: String,
}

fn new_bridge_state(app: &AppHandle) -> Result<BridgeState, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("无法确定应用数据目录：{error}"))?;
    fs::create_dir_all(&data_dir).map_err(|error| format!("无法创建应用数据目录：{error}"))?;
    let token_path = data_dir.join("bridge-token.txt");
    let token = match fs::read_to_string(&token_path) {
        Ok(value) if value.trim().len() >= 32 => value.trim().to_string(),
        _ => {
            let mut bytes = [0_u8; 32];
            rand::rng().fill_bytes(&mut bytes);
            let generated = bytes.iter().map(|value| format!("{value:02x}")).collect::<String>();
            fs::write(&token_path, &generated).map_err(|error| format!("无法保存本机连接码：{error}"))?;
            generated
        }
    };
    Ok(BridgeState {
        inner: Arc::new(BridgeInner {
            token,
            snapshot_path: data_dir.join("finalized-products.json"),
            sender: Mutex::new(None),
            products: Mutex::new(
                fs::read(data_dir.join("finalized-products.json"))
                    .ok()
                    .and_then(|bytes| serde_json::from_slice(&bytes).ok())
                    .unwrap_or_default(),
            ),
            pending: Mutex::new(HashMap::new()),
            script_version: Mutex::new(String::new()),
        }),
    })
}

fn bridge_info_value(state: &BridgeState) -> BridgeInfo {
    BridgeInfo {
        url: format!("ws://{BRIDGE_ADDRESS}"),
        token: state.inner.token.clone(),
        connected: state.inner.sender.lock().map(|sender| sender.is_some()).unwrap_or(false),
        script_version: state.inner.script_version.lock().map(|value| value.clone()).unwrap_or_default(),
    }
}

fn emit_bridge_status(app: &AppHandle, state: &BridgeState) {
    let _ = app.emit("bridge-status", bridge_info_value(state));
}

async fn run_bridge(app: AppHandle, state: BridgeState) {
    let listener = match TcpListener::bind(BRIDGE_ADDRESS).await {
        Ok(listener) => listener,
        Err(error) => {
            let _ = app.emit("bridge-error", format!("本机桥接端口 {BRIDGE_ADDRESS} 无法监听：{error}"));
            return;
        }
    };

    while let Ok((stream, _)) = listener.accept().await {
        let app = app.clone();
        let state = state.clone();
        tauri::async_runtime::spawn(async move {
            let websocket = match accept_async(stream).await {
                Ok(socket) => socket,
                Err(_) => return,
            };
            let (mut sink, mut source) = websocket.split();
            let first = match tokio::time::timeout(std::time::Duration::from_secs(8), source.next()).await {
                Ok(Some(Ok(Message::Text(text)))) => text,
                _ => return,
            };
            let hello: Value = match serde_json::from_str(&first) {
                Ok(value) => value,
                Err(_) => return,
            };
            if hello.get("type").and_then(Value::as_str) != Some("hello")
                || hello.get("token").and_then(Value::as_str) != Some(state.inner.token.as_str())
            {
                let _ = sink.send(Message::Text(json!({"type":"hello.error","message":"连接码无效"}).to_string().into())).await;
                return;
            }

            let script_version = hello.get("version").and_then(Value::as_str).unwrap_or_default().to_string();
            if let Ok(mut version) = state.inner.script_version.lock() {
                *version = script_version;
            }
            let (outgoing, mut outgoing_receiver) = mpsc::unbounded_channel::<Message>();
            if let Ok(mut sender) = state.inner.sender.lock() {
                *sender = Some(outgoing.clone());
            }
            emit_bridge_status(&app, &state);
            let _ = outgoing.send(Message::Text(json!({"type":"snapshot.request"}).to_string().into()));

            let sink_task = tauri::async_runtime::spawn(async move {
                while let Some(message) = outgoing_receiver.recv().await {
                    if sink.send(message).await.is_err() {
                        break;
                    }
                }
            });

            while let Some(Ok(message)) = source.next().await {
                if let Message::Text(text) = message {
                    handle_bridge_message(&app, &state, text.as_ref()).await;
                }
            }

            sink_task.abort();
            if let Ok(mut sender) = state.inner.sender.lock() {
                *sender = None;
            }
            emit_bridge_status(&app, &state);
        });
    }
}

async fn handle_bridge_message(app: &AppHandle, state: &BridgeState, text: &str) {
    let value: Value = match serde_json::from_str(text) {
        Ok(value) => value,
        Err(_) => return,
    };
    match value.get("type").and_then(Value::as_str).unwrap_or_default() {
        "snapshot.response" => {
            let products: Vec<FinalizedProduct> = serde_json::from_value(value.get("products").cloned().unwrap_or_else(|| json!([]))).unwrap_or_default();
            if let Ok(serialized) = serde_json::to_vec_pretty(&products) {
                let _ = fs::write(&state.inner.snapshot_path, serialized);
            }
            if let Ok(mut target) = state.inner.products.lock() {
                *target = products;
            }
            let _ = app.emit("snapshot-updated", json!({"count": state.inner.products.lock().map(|items| items.len()).unwrap_or(0)}));
        }
        "asset.bundle" => {
            let job_id = value.get("jobId").and_then(Value::as_str).unwrap_or_default();
            let pending = state.inner.pending.lock().ok().and_then(|mut jobs| jobs.remove(job_id));
            let Some(pending) = pending else { return };
            let result = persist_assets(&value, &pending);
            let (job_state, message) = match result {
                Ok(message) => ("done", message),
                Err(error) => ("error", error),
            };
            let _ = app.emit("asset-job", json!({"sku": pending.sku, "state": job_state, "message": message}));
        }
        "excel.error" => {
            let job_id = value.get("jobId").and_then(Value::as_str).unwrap_or_default();
            let pending = state.inner.pending.lock().ok().and_then(|mut jobs| jobs.remove(job_id));
            if let Some(pending) = pending {
                let message = value.get("message").and_then(Value::as_str).unwrap_or("悬浮助手生成 Excel 失败");
                let _ = app.emit("asset-job", json!({"sku": pending.sku, "state":"error", "message":message}));
            }
        }
        "pong" => {}
        _ => {}
    }
}

fn persist_excel(encoded: &str, pending: &PendingAssets) -> Result<bool, String> {
    if pending.excel_path.exists() && !pending.overwrite {
        return Ok(false);
    }
    if encoded.len() > MAX_EXCEL_BYTES * 2 {
        return Err("Excel 文件超过允许大小".to_string());
    }
    let bytes = BASE64.decode(encoded).map_err(|error| format!("Excel 数据无法解码：{error}"))?;
    if bytes.len() > MAX_EXCEL_BYTES || !bytes.starts_with(b"PK") {
        return Err("悬浮助手返回的 Excel 文件无效".to_string());
    }
    if let Some(parent) = pending.excel_path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("无法创建 Excel 目录：{error}"))?;
    }
    let temporary = pending.excel_path.with_extension(format!("xlsx.{}.partial", Uuid::new_v4()));
    fs::write(&temporary, bytes).map_err(|error| format!("无法写入 Excel 临时文件：{error}"))?;
    if pending.excel_path.exists() {
        fs::remove_file(&pending.excel_path).map_err(|error| format!("无法覆盖已有 Excel：{error}"))?;
    }
    fs::rename(&temporary, &pending.excel_path).map_err(|error| format!("无法完成 Excel 文件写入：{error}"))?;
    Ok(true)
}

fn persist_jpeg(data_url: &str, path: &Path, overwrite: bool) -> Result<bool, String> {
    if path.exists() && !overwrite {
        return Ok(false);
    }
    if data_url.is_empty() {
        return Ok(false);
    }
    let encoded = data_url.split_once(',').map(|(_, data)| data).unwrap_or(data_url);
    let bytes = BASE64.decode(encoded).map_err(|error| format!("图片数据无法解码：{error}"))?;
    if bytes.len() < 4 || !bytes.starts_with(&[0xff, 0xd8, 0xff]) {
        return Err("悬浮助手返回的 JPG 图片无效".to_string());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("无法创建图片目录：{error}"))?;
    }
    let temporary = path.with_extension(format!("jpg.{}.partial", Uuid::new_v4()));
    fs::write(&temporary, bytes).map_err(|error| format!("无法写入图片临时文件：{error}"))?;
    if path.exists() {
        fs::remove_file(path).map_err(|error| format!("无法覆盖已有图片：{error}"))?;
    }
    fs::rename(&temporary, path).map_err(|error| format!("无法完成图片文件写入：{error}"))?;
    Ok(true)
}

fn persist_assets(value: &Value, pending: &PendingAssets) -> Result<String, String> {
    let excel_created = persist_excel(
        value.get("excelBase64").and_then(Value::as_str).unwrap_or_default(),
        pending,
    )?;
    let sku_image_created = persist_jpeg(
        value.get("skuImageDataUrl").and_then(Value::as_str).unwrap_or_default(),
        &pending.sku_image_path,
        pending.overwrite,
    )?;
    let english_created = persist_jpeg(
        value.get("englishDataUrl").and_then(Value::as_str).unwrap_or_default(),
        &pending.english_path,
        pending.overwrite,
    )?;
    let size_created = persist_jpeg(
        value.get("sizeDataUrl").and_then(Value::as_str).unwrap_or_default(),
        &pending.size_path,
        pending.overwrite,
    )?;
    let created = [excel_created, sku_image_created, english_created, size_created].into_iter().filter(|value| *value).count();
    if created == 4 {
        Ok("Excel、SKU 图、英文参数图和尺寸图已由悬浮助手生成".to_string())
    } else if created == 0 {
        Ok("目标文件均已存在，已跳过".to_string())
    } else {
        Ok(format!("悬浮助手已生成 {created} 个文件，其余文件已存在或缺少透明.png"))
    }
}

#[tauri::command]
fn bridge_info(state: State<'_, BridgeState>) -> BridgeInfo {
    bridge_info_value(&state)
}

#[tauri::command]
fn get_products(state: State<'_, BridgeState>) -> Vec<FinalizedProduct> {
    state.inner.products.lock().map(|items| items.clone()).unwrap_or_default()
}

#[tauri::command]
fn request_snapshot(state: State<'_, BridgeState>) -> Result<(), String> {
    let sender = state.inner.sender.lock().map_err(|_| "无法访问桥接状态".to_string())?;
    let sender = sender.as_ref().ok_or_else(|| "PLM 悬浮助手尚未连接".to_string())?;
    sender.send(Message::Text(json!({"type":"snapshot.request"}).to_string().into())).map_err(|_| "无法发送同步请求".to_string())
}

#[tauri::command]
fn preview_products(
    root: String,
    products: Vec<FinalizedProduct>,
    manual_mappings: HashMap<String, String>,
) -> Vec<ProductPreview> {
    let root = PathBuf::from(root);
    let directories = direct_product_directories(&root);
    products
        .into_iter()
        .map(|product| build_preview(&directories, &manual_mappings, product))
        .collect()
}

fn parse_pack_rules(text: &str) -> Result<Vec<RenameRule>, String> {
    let mut rules = Vec::new();
    let mut errors = Vec::new();
    for (index, raw) in text.lines().enumerate() {
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let Some((pattern, target)) = line.split_once('|') else {
            errors.push(format!("第 {} 行缺少 | 分隔符：{}", index + 1, raw));
            continue;
        };
        let pattern = pattern.trim();
        let target = target.trim();
        if pattern.is_empty() || target.is_empty() {
            errors.push(format!("第 {} 行包含空值：{}", index + 1, raw));
            continue;
        }
        match Regex::new(&format!("^(?:{pattern})$")) {
            Ok(pattern) => rules.push(RenameRule { pattern, target: target.to_string() }),
            Err(error) => errors.push(format!("第 {} 行正则无效：{}", index + 1, error)),
        }
    }
    if errors.is_empty() { Ok(rules) } else { Err(errors.join("\n")) }
}

fn extract_pack_sku(filename: &str) -> Option<String> {
    Regex::new(r"(?i)SKU\d{8}")
        .ok()?
        .find(filename)
        .map(|matched| matched.as_str().to_uppercase())
}

fn unique_archive_path(folder: &Path, file_name: &str) -> PathBuf {
    let original = Path::new(file_name);
    let stem = original.file_stem().and_then(|value| value.to_str()).unwrap_or("图包文件");
    let extension = original.extension().and_then(|value| value.to_str()).unwrap_or_default();
    let mut candidate = folder.join(file_name);
    let mut index = 2;
    while candidate.exists() {
        let name = if extension.is_empty() {
            format!("{stem}_{index}")
        } else {
            format!("{stem}_{index}.{extension}")
        };
        candidate = folder.join(name);
        index += 1;
    }
    candidate
}

#[tauri::command]
fn archive_image_packs(
    zip_paths: Vec<String>,
    root: String,
    rules_text: String,
    use_rules: bool,
    delete_zip: bool,
) -> Result<ArchivePacksResult, String> {
    let root = PathBuf::from(root);
    if !root.is_dir() {
        return Err(format!("产品根目录不存在：{}", path_text(&root)));
    }
    if zip_paths.is_empty() {
        return Err("请先添加至少一个图包 ZIP".to_string());
    }
    let rules = if use_rules { parse_pack_rules(&rules_text)? } else { Vec::new() };
    let directories = direct_product_directories(&root);
    let mut result = ArchivePacksResult {
        logs: Vec::new(),
        success: 0,
        skipped: 0,
        failed: 0,
        deleted: 0,
    };
    for raw_path in zip_paths {
        let zip_path = PathBuf::from(&raw_path);
        let zip_name = zip_path.file_name().and_then(|value| value.to_str()).unwrap_or(&raw_path);
        result.logs.push(format!("━━━ {zip_name} ━━━"));
        let Some(sku) = extract_pack_sku(zip_name) else {
            result.failed += 1;
            result.logs.push("错误：无法从 ZIP 文件名提取 SKU 编码".to_string());
            continue;
        };
        let matches = directories
            .iter()
            .filter(|path| path.file_name().map(|value| value.to_string_lossy().to_uppercase().contains(&sku)).unwrap_or(false))
            .collect::<Vec<_>>();
        let Some(product_folder) = matches.first() else {
            result.failed += 1;
            result.logs.push(format!("错误：在产品根目录下找不到含 {sku} 的文件夹"));
            continue;
        };
        if matches.len() > 1 {
            result.logs.push(format!("警告：找到 {} 个匹配文件夹，使用 {}", matches.len(), product_folder.file_name().unwrap_or_default().to_string_lossy()));
        }
        let target = product_folder.join("套图");
        fs::create_dir_all(&target).map_err(|error| format!("无法创建套图目录：{error}"))?;
        let file = match fs::File::open(&zip_path) {
            Ok(file) => file,
            Err(error) => {
                result.failed += 1;
                result.logs.push(format!("错误：无法打开 ZIP：{error}"));
                continue;
            }
        };
        let mut archive = match ZipArchive::new(file) {
            Ok(archive) => archive,
            Err(error) => {
                result.failed += 1;
                result.logs.push(format!("错误：不是有效的 ZIP 文件：{error}"));
                continue;
            }
        };
        let before_failed = result.failed;
        let before_skipped = result.skipped;
        for index in 0..archive.len() {
            let mut entry = match archive.by_index(index) {
                Ok(entry) => entry,
                Err(error) => {
                    result.failed += 1;
                    result.logs.push(format!("读取压缩项失败：{error}"));
                    continue;
                }
            };
            if entry.is_dir() {
                continue;
            }
            let Some(source_name) = Path::new(entry.name()).file_name().and_then(|value| value.to_str()).map(str::to_string) else {
                result.skipped += 1;
                result.logs.push(format!("跳过无效文件名：{}", entry.name()));
                continue;
            };
            let source_path = Path::new(&source_name);
            let stem = source_path.file_stem().and_then(|value| value.to_str()).unwrap_or_default();
            let extension = source_path.extension().and_then(|value| value.to_str()).unwrap_or_default();
            let target_name = if use_rules {
                let Some(rule) = rules.iter().find(|rule| rule.pattern.is_match(stem)) else {
                    result.skipped += 1;
                    result.logs.push(format!("跳过（无匹配规则）：{source_name}"));
                    continue;
                };
                if extension.is_empty() { rule.target.clone() } else { format!("{}.{}", rule.target, extension) }
            } else {
                source_name.clone()
            };
            let destination = unique_archive_path(&target, &target_name);
            match fs::File::create(&destination).and_then(|mut output| std::io::copy(&mut entry, &mut output).map(|_| ())) {
                Ok(()) => {
                    result.success += 1;
                    result.logs.push(format!("{source_name} → {}", destination.file_name().unwrap_or_default().to_string_lossy()));
                }
                Err(error) => {
                    result.failed += 1;
                    result.logs.push(format!("解压失败：{source_name} — {error}"));
                }
            }
        }
        let zip_failed = result.failed > before_failed;
        let zip_skipped = result.skipped > before_skipped;
        if delete_zip && !zip_failed && !zip_skipped {
            match fs::remove_file(&zip_path) {
                Ok(()) => {
                    result.deleted += 1;
                    result.logs.push("已删除原 ZIP".to_string());
                }
                Err(error) => {
                    result.failed += 1;
                    result.logs.push(format!("删除 ZIP 失败：{error}"));
                }
            }
        }
    }
    Ok(result)
}

#[tauri::command]
fn request_excel(
    app: AppHandle,
    state: State<'_, BridgeState>,
    product: FinalizedProduct,
    folder: String,
    overwrite: bool,
    auto: Option<bool>,
) -> Result<String, String> {
    let folder = PathBuf::from(folder);
    if !folder.is_dir() {
        return Err("产品目录不存在".to_string());
    }
    let (excel_path, english_path, size_path) = output_paths(&folder, &product);
    let sku_image_path = output_sku_image_path(&folder, &product);
    if !overwrite && excel_path.exists() && sku_image_path.exists() && english_path.exists() && size_path.exists() {
        let _ = app.emit("asset-job", json!({"sku":product.sku, "state":"done", "message":"四个目标文件均已存在，已跳过"}));
        return Ok(String::new());
    }
    let transparent_image_data_url = if overwrite || !english_path.exists() || !size_path.exists() {
        find_transparent_image(&folder)
            .and_then(|path| fs::read(path).ok())
            .map(|bytes| format!("data:image/png;base64,{}", BASE64.encode(bytes)))
            .unwrap_or_default()
    } else {
        String::new()
    };
    let job_id = Uuid::new_v4().to_string();
    let pending = PendingAssets {
        sku: product.sku.clone(),
        excel_path: excel_path.clone(),
        sku_image_path,
        english_path,
        size_path,
        overwrite,
    };
    state.inner.pending.lock().map_err(|_| "无法访问任务队列".to_string())?.insert(job_id.clone(), pending);
    let message = json!({
        "type": "excel.generate",
        "jobId": job_id,
        "sku": product.sku,
        "product": product,
        "auto": auto.unwrap_or(false),
        "fileName": excel_path.file_name().and_then(|value| value.to_str()).unwrap_or("PLM产品信息.xlsx"),
        "transparentImageDataUrl": transparent_image_data_url
    });
    let send_result = state.inner.sender.lock()
        .map_err(|_| "无法访问桥接状态".to_string())?
        .as_ref()
        .ok_or_else(|| "PLM 悬浮助手尚未连接".to_string())?
        .send(Message::Text(message.to_string().into()));
    if send_result.is_err() {
        state.inner.pending.lock().ok().map(|mut jobs| jobs.remove(&job_id));
        return Err("Excel 任务发送失败".to_string());
    }
    let _ = app.emit("asset-job", json!({"sku":product.sku, "state":"queued", "message":"等待悬浮助手生成 Excel、英文参数图和尺寸图"}));
    Ok(job_id)
}

fn direct_product_directories(root: &Path) -> Vec<PathBuf> {
    let mut items = fs::read_dir(root)
        .ok()
        .into_iter()
        .flatten()
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.is_dir())
        .collect::<Vec<_>>();
    items.sort_by_key(|path| path.file_name().map(|value| value.to_string_lossy().to_lowercase()).unwrap_or_default());
    items
}

fn build_preview(
    directories: &[PathBuf],
    mappings: &HashMap<String, String>,
    product: FinalizedProduct,
) -> ProductPreview {
    let sku = product.sku.to_uppercase();
    let matches = directories
        .iter()
        .filter(|path| path.file_name().map(|value| value.to_string_lossy().to_uppercase().contains(&sku)).unwrap_or(false))
        .cloned()
        .collect::<Vec<_>>();
    let mapped = mappings.get(&product.sku).map(PathBuf::from).filter(|path| path.is_dir());
    let folder = mapped.or_else(|| matches.first().cloned());
    let transparent = folder.as_ref().and_then(|path| find_transparent_image(path));
    let (excel_path, english_path, size_path) = folder
        .as_ref()
        .map(|path| output_paths(path, &product))
        .unwrap_or_default();
    let sku_image_path = folder
        .as_ref()
        .map(|path| output_sku_image_path(path, &product))
        .unwrap_or_default();
    let mut missing = Vec::new();
    if folder.is_some() && transparent.is_none() {
        missing.push("透明.png".to_string());
    }
    if product.english_name.trim().is_empty() {
        missing.push("英文名称".to_string());
    }
    if product.net_content.trim().is_empty() {
        missing.push("净含量".to_string());
    }
    if product.gross_weight.trim().is_empty() {
        missing.push("毛重".to_string());
    }
    ProductPreview {
        product,
        folder: folder.as_ref().map(|path| path_text(path)),
        transparent_image: transparent.as_ref().map(|path| path_text(path)),
        excel_exists: excel_path.exists(),
        sku_image_exists: sku_image_path.exists(),
        english_exists: english_path.exists(),
        size_exists: size_path.exists(),
        excel_path: folder.as_ref().map(|_| path_text(&excel_path)),
        sku_image_path: folder.as_ref().map(|_| path_text(&sku_image_path)),
        english_path: folder.as_ref().map(|_| path_text(&english_path)),
        size_path: folder.as_ref().map(|_| path_text(&size_path)),
        ambiguous_folders: matches.iter().map(|path| path_text(path)).collect(),
        missing,
    }
}

fn output_paths(folder: &Path, product: &FinalizedProduct) -> (PathBuf, PathBuf, PathBuf) {
    if folder.as_os_str().is_empty() {
        return (PathBuf::new(), PathBuf::new(), PathBuf::new());
    }
    let base_name = sanitize_component(&format!("{} {} {}", product.brand, product.name, product.sku));
    let pack = folder.join("套图");
    let asset_folder = pack.join(&base_name);
    (
        pack.join(format!("{base_name}.xlsx")),
        asset_folder.join("英文参数图").join("英文参数图.jpg"),
        asset_folder.join("产品参数图").join("尺寸.jpg"),
    )
}

fn output_sku_image_path(folder: &Path, product: &FinalizedProduct) -> PathBuf {
    if folder.as_os_str().is_empty() {
        return PathBuf::new();
    }
    folder.join("套图").join("SKU图").join(format!("{}.jpg", sanitize_component(&product.sku)))
}

fn sanitize_component(value: &str) -> String {
    let invalid = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];
    let replaced = value.chars().map(|character| if invalid.contains(&character) || character.is_control() { ' ' } else { character }).collect::<String>();
    let normalized = replaced.split_whitespace().collect::<Vec<_>>().join(" ");
    if normalized.is_empty() { "未命名产品".to_string() } else { normalized }
}

fn find_transparent_image(folder: &Path) -> Option<PathBuf> {
    let exact = folder.join("透明.png");
    if exact.is_file() {
        return Some(exact);
    }
    fs::read_dir(folder).ok()?.filter_map(Result::ok).map(|entry| entry.path()).find(|path| {
        path.is_file()
            && path.file_stem().map(|value| value.to_string_lossy().starts_with("透明")).unwrap_or(false)
            && matches!(path.extension().and_then(|value| value.to_str()).unwrap_or_default().to_lowercase().as_str(), "png" | "jpg" | "jpeg" | "webp")
    })
}

fn path_text(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitizes_windows_file_name() {
        assert_eq!(sanitize_component("West/Month: Cream SKU00000001"), "West Month Cream SKU00000001");
    }

    #[test]
    fn creates_requested_output_structure() {
        let product = FinalizedProduct {
            sku: "SKU00000001".into(),
            brand: "WESTMONTH".into(),
            name: "面霜".into(),
            ..Default::default()
        };
        let folder = PathBuf::from(r"D:\产品");
        let (excel, english, size) = output_paths(&folder, &product);
        assert!(excel.ends_with(r"套图\WESTMONTH 面霜 SKU00000001.xlsx"));
        assert!(output_sku_image_path(&folder, &product).ends_with(r"套图\SKU图\SKU00000001.jpg"));
        assert!(english.ends_with(r"套图\WESTMONTH 面霜 SKU00000001\英文参数图\英文参数图.jpg"));
        assert!(size.ends_with(r"套图\WESTMONTH 面霜 SKU00000001\产品参数图\尺寸.jpg"));
    }

    #[test]
    fn parses_pack_rules_and_sku() {
        let rules = parse_pack_rules("^input-main-prompt-1-.+$|主图1\n^detail-.+$|详情图1").unwrap();
        assert_eq!(rules.len(), 2);
        assert!(rules[0].pattern.is_match("input-main-prompt-1-abc12345"));
        assert_eq!(extract_pack_sku("主图_SKU00044974_001.zip").as_deref(), Some("SKU00044974"));
    }

    #[test]
    fn archives_and_renames_image_pack() {
        use std::io::Write;
        use zip::{ZipWriter, write::SimpleFileOptions};

        let root = std::env::temp_dir().join(format!("plm-pack-test-{}", Uuid::new_v4()));
        let product = root.join("AMZ 身体乳 SKU00044974");
        fs::create_dir_all(&product).unwrap();
        let zip_path = root.join("主图_SKU00044974_001.zip");
        let zip_file = fs::File::create(&zip_path).unwrap();
        let mut writer = ZipWriter::new(zip_file);
        writer.start_file("nested/input-main-prompt-1-abc12345.png", SimpleFileOptions::default()).unwrap();
        writer.write_all(b"fake-png").unwrap();
        writer.finish().unwrap();

        let result = archive_image_packs(
            vec![path_text(&zip_path)],
            path_text(&root),
            "^input-main-prompt-1-[a-zA-Z0-9]{8}$|主图1".to_string(),
            true,
            false,
        ).unwrap();

        assert_eq!(result.success, 1);
        assert_eq!(result.failed, 0);
        assert!(product.join("套图").join("主图1.png").is_file());
        fs::remove_dir_all(&root).unwrap();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let state = new_bridge_state(app.handle())?;
            app.manage(state.clone());
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(run_bridge(app_handle, state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            bridge_info,
            get_products,
            request_snapshot,
            preview_products,
            archive_image_packs,
            request_excel,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PLM product asset workbench");
}
