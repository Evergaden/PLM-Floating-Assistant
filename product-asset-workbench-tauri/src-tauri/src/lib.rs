use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};

use ab_glyph::{FontArc, PxScale};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use futures_util::{SinkExt, StreamExt};
use image::{
    DynamicImage, GenericImageView, ImageReader, Rgba, RgbaImage,
    codecs::jpeg::JpegEncoder, imageops,
};
use imageproc::{
    drawing::{draw_line_segment_mut, draw_text_mut},
    rect::Rect,
};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::{net::TcpListener, sync::mpsc};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use uuid::Uuid;

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
    pending: Mutex<HashMap<String, PendingExcel>>,
    script_version: Mutex<String>,
}

#[derive(Clone)]
struct PendingExcel {
    sku: String,
    path: PathBuf,
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
    package_length: String,
    #[serde(default)]
    package_width: String,
    #[serde(default)]
    package_height: String,
    #[serde(default)]
    product_length: String,
    #[serde(default)]
    product_width: String,
    #[serde(default)]
    product_height: String,
    #[serde(default)]
    net_content: String,
    #[serde(default)]
    gross_weight: String,
    #[serde(default)]
    ingredients: String,
    #[serde(default)]
    reference_url: String,
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
    english_path: Option<String>,
    size_path: Option<String>,
    excel_exists: bool,
    english_exists: bool,
    size_exists: bool,
    ambiguous_folders: Vec<String>,
    missing: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ImageGenerationResult {
    created: Vec<String>,
    skipped: Vec<String>,
    warnings: Vec<String>,
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
        "excel.file" => {
            let job_id = value.get("jobId").and_then(Value::as_str).unwrap_or_default();
            let encoded = value.get("base64").and_then(Value::as_str).unwrap_or_default();
            let pending = state.inner.pending.lock().ok().and_then(|mut jobs| jobs.remove(job_id));
            let Some(pending) = pending else { return };
            let result = persist_excel(encoded, &pending);
            let (job_state, message) = match result {
                Ok(()) => ("done", "Excel 与图片已生成".to_string()),
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

fn persist_excel(encoded: &str, pending: &PendingExcel) -> Result<(), String> {
    if encoded.len() > MAX_EXCEL_BYTES * 2 {
        return Err("Excel 文件超过允许大小".to_string());
    }
    let bytes = BASE64.decode(encoded).map_err(|error| format!("Excel 数据无法解码：{error}"))?;
    if bytes.len() > MAX_EXCEL_BYTES || !bytes.starts_with(b"PK") {
        return Err("悬浮助手返回的 Excel 文件无效".to_string());
    }
    if pending.path.exists() && !pending.overwrite {
        return Ok(());
    }
    if let Some(parent) = pending.path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("无法创建 Excel 目录：{error}"))?;
    }
    let temporary = pending.path.with_extension(format!("xlsx.{}.partial", Uuid::new_v4()));
    fs::write(&temporary, bytes).map_err(|error| format!("无法写入 Excel 临时文件：{error}"))?;
    if pending.path.exists() {
        fs::remove_file(&pending.path).map_err(|error| format!("无法覆盖已有 Excel：{error}"))?;
    }
    fs::rename(&temporary, &pending.path).map_err(|error| format!("无法完成 Excel 文件写入：{error}"))?;
    Ok(())
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

#[tauri::command]
fn generate_images(
    product: FinalizedProduct,
    folder: String,
    overwrite: bool,
) -> Result<ImageGenerationResult, String> {
    let folder = PathBuf::from(folder);
    if !folder.is_dir() {
        return Err("产品目录不存在".to_string());
    }
    let (_, english_path, size_path) = output_paths(&folder, &product);
    let transparent = find_transparent_image(&folder);
    let mut result = ImageGenerationResult { created: Vec::new(), skipped: Vec::new(), warnings: Vec::new() };
    let Some(source) = transparent else {
        result.warnings.push("缺少透明.png，英文参数图和尺寸图未生成".to_string());
        return Ok(result);
    };

    if english_path.exists() && !overwrite {
        result.skipped.push(path_text(&english_path));
    } else {
        render_english_parameter_image(&source, &english_path, &product)?;
        result.created.push(path_text(&english_path));
    }
    if size_path.exists() && !overwrite {
        result.skipped.push(path_text(&size_path));
    } else {
        render_size_image(&source, &size_path, &product)?;
        result.created.push(path_text(&size_path));
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
) -> Result<String, String> {
    let folder = PathBuf::from(folder);
    if !folder.is_dir() {
        return Err("产品目录不存在".to_string());
    }
    let (excel_path, _, _) = output_paths(&folder, &product);
    if excel_path.exists() && !overwrite {
        let _ = app.emit("asset-job", json!({"sku":product.sku, "state":"done", "message":"已有 Excel，已跳过"}));
        return Ok(String::new());
    }
    let job_id = Uuid::new_v4().to_string();
    let pending = PendingExcel { sku: product.sku.clone(), path: excel_path.clone(), overwrite };
    state.inner.pending.lock().map_err(|_| "无法访问任务队列".to_string())?.insert(job_id.clone(), pending);
    let message = json!({
        "type": "excel.generate",
        "jobId": job_id,
        "sku": product.sku,
        "fileName": excel_path.file_name().and_then(|value| value.to_str()).unwrap_or("PLM产品信息.xlsx")
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
    let _ = app.emit("asset-job", json!({"sku":product.sku, "state":"queued", "message":"等待悬浮助手生成 Excel"}));
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
        english_exists: english_path.exists(),
        size_exists: size_path.exists(),
        excel_path: folder.as_ref().map(|_| path_text(&excel_path)),
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

fn load_font() -> Result<FontArc, String> {
    let candidates = [
        PathBuf::from(r"C:\Windows\Fonts\msyh.ttc"),
        PathBuf::from(r"C:\Windows\Fonts\Deng.ttf"),
        PathBuf::from(r"C:\Windows\Fonts\simhei.ttf"),
        PathBuf::from(r"C:\Windows\Fonts\arial.ttf"),
    ];
    candidates
        .iter()
        .find_map(|path| fs::read(path).ok().and_then(|bytes| FontArc::try_from_vec(bytes).ok()))
        .ok_or_else(|| "无法加载系统字体".to_string())
}

fn open_product_image(path: &Path) -> Result<DynamicImage, String> {
    ImageReader::open(path)
        .map_err(|error| format!("无法读取透明图：{error}"))?
        .with_guessed_format()
        .map_err(|error| format!("无法识别透明图格式：{error}"))?
        .decode()
        .map_err(|error| format!("透明图无法解码：{error}"))
}

fn place_product(canvas: &mut RgbaImage, source: &DynamicImage, bounds: Rect) {
    let (source_width, source_height) = source.dimensions();
    let scale = (bounds.width() as f32 / source_width as f32).min(bounds.height() as f32 / source_height as f32);
    let width = (source_width as f32 * scale).round().max(1.0) as u32;
    let height = (source_height as f32 * scale).round().max(1.0) as u32;
    let resized = source.resize(width, height, image::imageops::FilterType::Lanczos3).to_rgba8();
    let x = bounds.left() as i64 + ((bounds.width().saturating_sub(width)) / 2) as i64;
    let y = bounds.top() as i64 + ((bounds.height().saturating_sub(height)) / 2) as i64;
    imageops::overlay(canvas, &resized, x, y);
}

fn save_jpeg(canvas: &RgbaImage, output: &Path) -> Result<(), String> {
    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("无法创建图片目录：{error}"))?;
    }
    let file = fs::File::create(output).map_err(|error| format!("无法创建图片：{error}"))?;
    JpegEncoder::new_with_quality(file, 96)
        .encode_image(&DynamicImage::ImageRgba8(canvas.clone()))
        .map_err(|error| format!("无法保存 JPG：{error}"))
}

fn dim_text(a: &str, b: &str, c: &str) -> String {
    let values = [a.trim(), b.trim(), c.trim()].into_iter().filter(|value| !value.is_empty()).collect::<Vec<_>>();
    if values.is_empty() { "—".to_string() } else { format!("{} cm", values.join(" × ")) }
}

fn render_english_parameter_image(source: &Path, output: &Path, product: &FinalizedProduct) -> Result<(), String> {
    let source = open_product_image(source)?;
    let font = load_font()?;
    let mut canvas = RgbaImage::from_pixel(1600, 1600, Rgba([255, 255, 255, 255]));
    draw_text_mut(&mut canvas, Rgba([63, 72, 96, 255]), 92, 74, PxScale::from(34.0), &font, &product.brand);
    draw_text_mut(&mut canvas, Rgba([19, 32, 51, 255]), 92, 142, PxScale::from(57.0), &font, &product.english_name);
    draw_text_mut(&mut canvas, Rgba([101, 71, 245, 255]), 94, 246, PxScale::from(27.0), &font, &format!("SKU  {}", product.sku));
    let lines = [
        ("NET CONTENT", product.net_content.clone()),
        ("GROSS WEIGHT", product.gross_weight.clone()),
        ("PACKAGE SIZE", dim_text(&product.package_length, &product.package_width, &product.package_height)),
        ("PRODUCT SIZE", dim_text(&product.product_length, &product.product_width, &product.product_height)),
    ];
    for (index, (label, value)) in lines.iter().enumerate() {
        let y = 440 + index as i32 * 175;
        draw_text_mut(&mut canvas, Rgba([126, 136, 153, 255]), 96, y, PxScale::from(24.0), &font, label);
        draw_text_mut(&mut canvas, Rgba([24, 40, 62, 255]), 96, y + 45, PxScale::from(39.0), &font, value);
        draw_line_segment_mut(&mut canvas, (96.0, (y + 119) as f32), (650.0, (y + 119) as f32), Rgba([230, 233, 239, 255]));
    }
    place_product(&mut canvas, &source, Rect::at(760, 320).of_size(760, 1120));
    save_jpeg(&canvas, output)
}

fn render_size_image(source: &Path, output: &Path, product: &FinalizedProduct) -> Result<(), String> {
    let source = open_product_image(source)?;
    let font = load_font()?;
    let mut canvas = RgbaImage::from_pixel(1600, 1600, Rgba([255, 255, 255, 255]));
    draw_text_mut(&mut canvas, Rgba([63, 72, 96, 255]), 88, 70, PxScale::from(32.0), &font, &product.brand);
    draw_text_mut(&mut canvas, Rgba([19, 32, 51, 255]), 88, 132, PxScale::from(49.0), &font, &product.english_name);
    place_product(&mut canvas, &source, Rect::at(260, 275).of_size(1000, 960));
    let accent = Rgba([101, 71, 245, 255]);
    draw_line_segment_mut(&mut canvas, (280.0, 1300.0), (1260.0, 1300.0), accent);
    draw_line_segment_mut(&mut canvas, (280.0, 1285.0), (280.0, 1315.0), accent);
    draw_line_segment_mut(&mut canvas, (1260.0, 1285.0), (1260.0, 1315.0), accent);
    draw_line_segment_mut(&mut canvas, (1330.0, 300.0), (1330.0, 1230.0), accent);
    draw_line_segment_mut(&mut canvas, (1315.0, 300.0), (1345.0, 300.0), accent);
    draw_line_segment_mut(&mut canvas, (1315.0, 1230.0), (1345.0, 1230.0), accent);
    let width = if product.product_width.trim().is_empty() { &product.package_width } else { &product.product_width };
    let height = if product.product_height.trim().is_empty() { &product.package_height } else { &product.product_height };
    draw_text_mut(&mut canvas, accent, 660, 1325, PxScale::from(34.0), &font, &format!("{} cm", width));
    draw_text_mut(&mut canvas, accent, 1360, 720, PxScale::from(34.0), &font, &format!("{} cm", height));
    draw_text_mut(&mut canvas, Rgba([128, 138, 155, 255]), 88, 1480, PxScale::from(22.0), &font, "Measurements are approximate.");
    save_jpeg(&canvas, output)
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
        assert!(english.ends_with(r"套图\WESTMONTH 面霜 SKU00000001\英文参数图\英文参数图.jpg"));
        assert!(size.ends_with(r"套图\WESTMONTH 面霜 SKU00000001\产品参数图\尺寸.jpg"));
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
            generate_images,
            request_excel,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PLM product asset workbench");
}
