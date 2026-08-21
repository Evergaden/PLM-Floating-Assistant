use std::{
    collections::{HashMap, HashSet},
    fs,
    io::Read,
    path::{Path, PathBuf},
    process::Command,
    sync::{Arc, Mutex},
    time::{Duration, UNIX_EPOCH},
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use futures_util::{SinkExt, StreamExt};
use rand::{Rng, RngCore};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::{net::TcpListener, sync::mpsc};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use uuid::Uuid;
use zip::ZipArchive;

mod parameter_box_analysis;
use parameter_box_analysis::{analyze_parameter_box_annotations, fetch_parameter_rule_package};

const BRIDGE_ADDRESS: &str = "127.0.0.1:37191";
const MAX_EXCEL_BYTES: usize = 40 * 1024 * 1024;
const MAX_UPLOAD_ZIP_BYTES: usize = 100 * 1024 * 1024;
const UPLOAD_CHUNK_BYTES: usize = 512 * 1024;
const DEFAULT_VIDEO_SOURCE: &str = r"E:\WXWork\1688857110932701\Cache\Video\7月";
const PS_BATCH_SCRIPT: &str = r#"#target photoshop
var inputPaths = __INPUT_PATHS__;
var categories = __CATEGORIES__;
var moveOriginalsToRecycle = __MOVE_ORIGINALS__;
var recyclePaths = __RECYCLE_PATHS__;
var maxWidth = 1600;
var maxHeight = 1600;
var jpegQuality = 12;
var originalDialogs = app.displayDialogs;
app.displayDialogs = DialogModes.NO;
var MAIN_FOLDER = String.fromCharCode(0x4E3B, 0x56FE);
var DETAIL_FOLDER = String.fromCharCode(0x8BE6, 0x60C5, 0x56FE);
var OTHER_FOLDER = String.fromCharCode(0x5176, 0x4ED6);

function uniqueRecycleFile(folder, sourceFile) {
    var candidate = File(folder.fsName + "\\" + sourceFile.name);
    if (!candidate.exists) { return candidate; }
    var extensionMatch = sourceFile.name.match(/(\.[^\.]+)$/);
    var extension = extensionMatch ? extensionMatch[1] : "";
    var stem = extension ? sourceFile.name.substring(0, sourceFile.name.length - extension.length) : sourceFile.name;
    var index = 2;
    while (candidate.exists) {
        candidate = File(folder.fsName + "\\" + stem + "_" + index + extension);
        index++;
    }
    return candidate;
}

for (var i = 0; i < inputPaths.length; i++) {
    var doc = null;
    var previousBackground = null;
    try {
        var inputFile = File(inputPaths[i]);
        if (!inputFile.exists) { continue; }
        var baseName = inputFile.name.replace(/\.[^\.]+$/, "");
        var categoryFolder = categories[i] === 1 ? MAIN_FOLDER :
            (categories[i] === 2 ? DETAIL_FOLDER : OTHER_FOLDER);
        var outputFolder = Folder(inputFile.parent.fsName + "\\" + categoryFolder);
        if (!outputFolder.exists && !outputFolder.create()) {
            throw new Error("Unable to create output folder: " + outputFolder.fsName);
        }
        doc = app.open(inputFile);
        var width = doc.width.as("px");
        var height = doc.height.as("px");
        var scale = Math.min(maxWidth / width, maxHeight / height, 1);
        if (scale < 1) {
            doc.resizeImage(UnitValue(Math.round(width * scale), "px"),
                UnitValue(Math.round(height * scale), "px"), undefined,
                ResampleMethod.BICUBICSHARPER);
        }
        if (doc.mode !== DocumentMode.RGB) { doc.changeMode(ChangeMode.RGB); }
        previousBackground = app.backgroundColor;
        var white = new SolidColor();
        white.rgb.red = 255; white.rgb.green = 255; white.rgb.blue = 255;
        app.backgroundColor = white;
        doc.flatten();
        app.backgroundColor = previousBackground;
        var outputFile = File(outputFolder.fsName + "\\" + baseName + ".jpg");
        var options = new JPEGSaveOptions();
        options.quality = jpegQuality;
        options.embedColorProfile = true;
        options.formatOptions = FormatOptions.STANDARDBASELINE;
        doc.saveAs(outputFile, options, true, Extension.LOWERCASE);
        doc.close(SaveOptions.DONOTSAVECHANGES);
        doc = null;
        if (moveOriginalsToRecycle && recyclePaths[i]) {
            var recycleFolder = Folder(recyclePaths[i]);
            if (!recycleFolder.exists && !recycleFolder.create()) {
                throw new Error("Unable to create recycle folder: " + recycleFolder.fsName);
            }
            var recycleFile = uniqueRecycleFile(recycleFolder, inputFile);
            if (!inputFile.copy(recycleFile.fsName)) {
                throw new Error("Unable to copy original into recycle folder: " + inputFile.fsName);
            }
            if (!inputFile.remove()) {
                try { recycleFile.remove(); } catch (ignoredRemove) {}
                throw new Error("Unable to remove original after recycle copy: " + inputFile.fsName);
            }
        }
    } catch (error) {
        if (doc) { try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (ignored) {} }
    } finally {
        if (previousBackground) { app.backgroundColor = previousBackground; }
    }
}
app.displayDialogs = originalDialogs;
"#;

#[derive(Clone)]
struct BridgeState {
    inner: Arc<BridgeInner>,
}

struct BridgeInner {
    token: String,
    snapshot_path: PathBuf,
    clients: Mutex<HashMap<String, BridgeClient>>,
    products: Mutex<Vec<FinalizedProduct>>,
    successful_upload_skus: Mutex<HashSet<String>>,
    pending: Mutex<HashMap<String, PendingAssets>>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum BridgeRole {
    Assistant,
    Photoshop,
}

impl BridgeRole {
    fn from_hello(value: Option<&str>) -> Self {
        match value {
            Some("photoshop") => Self::Photoshop,
            _ => Self::Assistant,
        }
    }
}

#[derive(Clone)]
struct BridgeClient {
    role: BridgeRole,
    sender: mpsc::UnboundedSender<Message>,
    script_version: String,
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
    copywriting: Option<CopywritingSnapshot>,
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
    #[serde(default)]
    box_file_state: String,
    #[serde(default)]
    label_file_state: String,
    #[serde(default)]
    image_pack_state: String,
    #[serde(default)]
    box_file_done: bool,
    #[serde(default)]
    label_file_done: bool,
    #[serde(default)]
    image_pack_done: bool,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct CopywritingSection {
    #[serde(default)]
    key: String,
    #[serde(default)]
    label: String,
    #[serde(default)]
    text: String,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct CopywritingSnapshot {
    #[serde(default)]
    parser_version: String,
    #[serde(default)]
    file_name: String,
    #[serde(default)]
    updated_at: String,
    #[serde(default)]
    full_text: String,
    #[serde(default)]
    missing_sections: Vec<String>,
    #[serde(default)]
    sections: Vec<CopywritingSection>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct BridgeInfo {
    url: String,
    token: String,
    connected: bool,
    script_version: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct UploadPair {
    sku: String,
    xlsx_path: Option<String>,
    zip_path: Option<String>,
    xlsx_name: Option<String>,
    zip_name: Option<String>,
    xlsx_size: u64,
    zip_size: u64,
    xlsx_modified_ms: u128,
    zip_modified_ms: u128,
    status: String,
    message: String,
    signature: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UploadPairRequest {
    sku: String,
    xlsx_path: String,
    zip_path: String,
    signature: String,
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
    match_source: String,
    ambiguous_folders: Vec<String>,
    missing: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ParameterSampleItem {
    sku: String,
    product_name: String,
    product_path: String,
    transparent_path: Option<String>,
    parameter_path: Option<String>,
    excel_path: Option<String>,
    transparent_has_alpha: bool,
    transparent_candidates: usize,
    transparent_placeholders: usize,
    parameter_candidates: usize,
    excel_candidates: usize,
    status: String,
    message: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ParameterSampleScanResult {
    root: String,
    index_path: String,
    items: Vec<ParameterSampleItem>,
    ready: usize,
    incomplete: usize,
    ambiguous: usize,
    logs: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ArchivePacksResult {
    logs: Vec<String>,
    success: usize,
    skipped: usize,
    failed: usize,
    deleted: usize,
    compressed_images: usize,
    photoshop_started: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ComposePackResult {
    logs: Vec<String>,
    output_path: String,
    selected_count: usize,
    missing_slots: Vec<String>,
    photoshop_started: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EmptyRecycleResult {
    deleted_files: usize,
    deleted_folders: usize,
    recycle_root: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FileOrganizeItem {
    kind: String,
    source_path: String,
    target_path: String,
    source_name: String,
    target_name: String,
    sku: String,
    status: String,
    message: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FileOrganizeOperation {
    source_path: String,
    target_path: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FileOrganizeScanResult {
    root: String,
    items: Vec<FileOrganizeItem>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FileOrganizeResult {
    logs: Vec<String>,
    renamed: usize,
    skipped: usize,
    failed: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LabelCheckFile {
    name: String,
    path: String,
    extension: String,
    size: u64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LabelCheckItem {
    sku: String,
    brand: String,
    product_name: String,
    product_path: String,
    source_path: String,
    source_name: String,
    target_path: String,
    preview_images: Vec<LabelCheckFile>,
    upload_files: Vec<LabelCheckFile>,
    psd_files: Vec<LabelCheckFile>,
    other_files: Vec<LabelCheckFile>,
    status: String,
    message: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LabelCheckRecord {
    sku: String,
    #[serde(default)]
    brand: String,
    product_name: String,
    product_path: String,
    source_path: String,
    target_path: String,
    confirmed_at_ms: u64,
    moved_files: Vec<String>,
    moved_psd_files: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LabelCheckScanResult {
    root: String,
    target_folder_name: String,
    history_path: String,
    pending: Vec<LabelCheckItem>,
    confirmed: Vec<LabelCheckRecord>,
    confirmed_items: Vec<LabelCheckItem>,
    logs: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LabelCheckConfirmResult {
    record: LabelCheckRecord,
    logs: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct VideoMatch {
    source_path: String,
    file_name: String,
    product_folder: Option<String>,
    match_source: String,
    ambiguous_folders: Vec<String>,
    status: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VideoScanResult {
    source_dir: String,
    files: Vec<VideoMatch>,
    skipped_processed: usize,
    logs: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VideoProcessResult {
    files: Vec<VideoMatch>,
    converted: usize,
    copied: usize,
    failed: usize,
    logs: Vec<String>,
}

struct RenameRule {
    pattern: Regex,
    target: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum PackSlotFamily {
    Main,
    Detail,
}

struct PackEntryPlan {
    index: usize,
    source_name: String,
    extension: String,
    target_name: Option<String>,
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
            let generated = bytes
                .iter()
                .map(|value| format!("{value:02x}"))
                .collect::<String>();
            fs::write(&token_path, &generated)
                .map_err(|error| format!("无法保存本机连接码：{error}"))?;
            generated
        }
    };
    Ok(BridgeState {
        inner: Arc::new(BridgeInner {
            token,
            snapshot_path: data_dir.join("finalized-products.json"),
            clients: Mutex::new(HashMap::new()),
            products: Mutex::new(
                fs::read(data_dir.join("finalized-products.json"))
                    .ok()
                    .and_then(|bytes| serde_json::from_slice(&bytes).ok())
                    .unwrap_or_default(),
            ),
            successful_upload_skus: Mutex::new(HashSet::new()),
            pending: Mutex::new(HashMap::new()),
        }),
    })
}

fn bridge_info_value(state: &BridgeState) -> BridgeInfo {
    let (connected, script_version) = state
        .inner
        .clients
        .lock()
        .map(|clients| {
            clients
                .values()
                .find(|client| client.role == BridgeRole::Assistant)
                .map(|client| (true, client.script_version.clone()))
                .unwrap_or((false, String::new()))
        })
        .unwrap_or((false, String::new()));
    BridgeInfo {
        url: format!("ws://{BRIDGE_ADDRESS}"),
        token: state.inner.token.clone(),
        connected,
        script_version,
    }
}

fn emit_bridge_status(app: &AppHandle, state: &BridgeState) {
    let _ = app.emit("bridge-status", bridge_info_value(state));
}

async fn run_bridge(app: AppHandle, state: BridgeState) {
    let listener = match TcpListener::bind(BRIDGE_ADDRESS).await {
        Ok(listener) => listener,
        Err(error) => {
            let _ = app.emit(
                "bridge-error",
                format!("本机桥接端口 {BRIDGE_ADDRESS} 无法监听：{error}"),
            );
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
            let first = match tokio::time::timeout(std::time::Duration::from_secs(8), source.next())
                .await
            {
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
                let _ = sink
                    .send(Message::Text(
                        json!({"type":"hello.error","message":"连接码无效"})
                            .to_string()
                            .into(),
                    ))
                    .await;
                return;
            }

            let role = BridgeRole::from_hello(hello.get("role").and_then(Value::as_str));
            let script_version = hello
                .get("version")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let client_id = Uuid::new_v4().to_string();
            let (outgoing, mut outgoing_receiver) = mpsc::unbounded_channel::<Message>();
            if let Ok(mut clients) = state.inner.clients.lock() {
                clients.insert(
                    client_id.clone(),
                    BridgeClient {
                        role,
                        sender: outgoing.clone(),
                        script_version,
                    },
                );
            }
            emit_bridge_status(&app, &state);
            match role {
                // Finalized products are fetched only when the desktop refresh
                // button invokes `request_snapshot`; do not query on connect.
                BridgeRole::Assistant => {}
                BridgeRole::Photoshop => {
                    let _ = outgoing.send(Message::Text(
                        json!({
                            "type": "photoshop.ready",
                            "protocol": "document-query-v1",
                        })
                        .to_string()
                        .into(),
                    ));
                }
            }

            let sink_task = tauri::async_runtime::spawn(async move {
                while let Some(message) = outgoing_receiver.recv().await {
                    if sink.send(message).await.is_err() {
                        break;
                    }
                }
            });

            while let Some(Ok(message)) = source.next().await {
                if let Message::Text(text) = message {
                    handle_bridge_message(&app, &state, text.as_ref(), &client_id, role).await;
                }
            }

            sink_task.abort();
            if let Ok(mut clients) = state.inner.clients.lock() {
                clients.remove(&client_id);
            }
            emit_bridge_status(&app, &state);
        });
    }
}

fn photoshop_product_value(product: &FinalizedProduct) -> Value {
    json!({
        "sku": &product.sku,
        "brand": &product.brand,
        "name": &product.name,
        "englishName": &product.english_name,
        "packageCode": &product.package_code,
        "printCode": &product.print_code,
    })
}

fn photoshop_product_detail_value(product: &FinalizedProduct) -> Value {
    let mut result = photoshop_product_value(product);
    let copywriting = product.copywriting.as_ref().map(|value| {
        json!({
            "parserVersion": &value.parser_version,
            "fileName": &value.file_name,
            "updatedAt": &value.updated_at,
            "missingSections": &value.missing_sections,
            "sections": &value.sections,
        })
    });
    if let Some(object) = result.as_object_mut() {
        object.insert(
            "copywriting".to_string(),
            copywriting.unwrap_or(Value::Null),
        );
    }
    result
}

fn bridge_timestamp() -> String {
    format!(
        "{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|value| value.as_secs())
            .unwrap_or_default()
    )
}

fn send_json_to_client(state: &BridgeState, client_id: &str, value: &Value) -> bool {
    let sender = state
        .inner
        .clients
        .lock()
        .ok()
        .and_then(|clients| clients.get(client_id).map(|client| client.sender.clone()));
    sender
        .map(|sender| sender.send(Message::Text(value.to_string().into())).is_ok())
        .unwrap_or(false)
}

fn send_json_to_role(state: &BridgeState, role: BridgeRole, value: &Value) -> usize {
    let senders = state
        .inner
        .clients
        .lock()
        .map(|clients| {
            clients
                .values()
                .filter(|client| client.role == role)
                .map(|client| client.sender.clone())
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    let payload = value.to_string();
    senders
        .into_iter()
        .filter(|sender| sender.send(Message::Text(payload.clone().into())).is_ok())
        .count()
}

fn request_assistant_snapshot(state: &BridgeState) -> usize {
    send_json_to_role(
        state,
        BridgeRole::Assistant,
        &json!({"type": "snapshot.request"}),
    )
}

#[derive(Clone)]
struct DocumentIdentifier {
    key: &'static str,
    label: &'static str,
    raw: String,
    normalized: String,
    priority: u8,
}

fn normalize_filename_identifier(value: &str) -> String {
    value
        .chars()
        .filter(|character| character.is_ascii_alphanumeric())
        .map(|character| character.to_ascii_uppercase())
        .collect()
}

fn split_filename_identifiers(value: &str) -> Vec<String> {
    value
        .split(|character: char| {
            character.is_whitespace() || matches!(character, ',' | ';' | '，' | '；' | '、')
        })
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
        .collect()
}

fn product_document_identifiers(product: &FinalizedProduct) -> Vec<DocumentIdentifier> {
    [
        ("packageCode", "纸盒编码", product.package_code.as_str(), 0),
        ("printCode", "标签/印刷编码", product.print_code.as_str(), 1),
        ("sku", "SKU", product.sku.as_str(), 2),
    ]
    .into_iter()
    .flat_map(|(key, label, value, priority)| {
        split_filename_identifiers(value)
            .into_iter()
            .filter_map(move |raw| {
                let normalized = normalize_filename_identifier(&raw);
                (normalized.len() >= 5).then_some(DocumentIdentifier {
                    key,
                    label,
                    raw,
                    normalized,
                    priority,
                })
            })
    })
    .collect()
}

fn find_product_by_document_title(
    products: &[FinalizedProduct],
    title: &str,
) -> Option<(usize, DocumentIdentifier)> {
    let normalized_title = normalize_filename_identifier(title);
    if normalized_title.is_empty() {
        return None;
    }
    let mut matches = products
        .iter()
        .enumerate()
        .flat_map(|(product_index, product)| {
            product_document_identifiers(product)
                .into_iter()
                .filter(|identifier| normalized_title.contains(&identifier.normalized))
                .map(move |identifier| (product_index, identifier))
        })
        .collect::<Vec<_>>();
    matches.sort_by(|left, right| {
        left.1
            .priority
            .cmp(&right.1.priority)
            .then_with(|| right.1.normalized.len().cmp(&left.1.normalized.len()))
            .then_with(|| left.0.cmp(&right.0))
    });
    matches.into_iter().next()
}

async fn handle_bridge_message(
    app: &AppHandle,
    state: &BridgeState,
    text: &str,
    client_id: &str,
    role: BridgeRole,
) {
    let value: Value = match serde_json::from_str(text) {
        Ok(value) => value,
        Err(_) => return,
    };
    match value
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or_default()
    {
        "snapshot.response" => {
            if role != BridgeRole::Assistant {
                return;
            }
            let products: Vec<FinalizedProduct> =
                serde_json::from_value(value.get("products").cloned().unwrap_or_else(|| json!([])))
                    .unwrap_or_default();
            let successful_upload_skus = value
                .get("successfulUploadSkus")
                .and_then(Value::as_array)
                .map(|items| {
                    items
                        .iter()
                        .filter_map(Value::as_str)
                        .map(|sku| sku.to_uppercase())
                        .collect::<HashSet<_>>()
                })
                .unwrap_or_default();
            if let Ok(serialized) = serde_json::to_vec_pretty(&products) {
                let _ = fs::write(&state.inner.snapshot_path, serialized);
            }
            if let Ok(mut target) = state.inner.products.lock() {
                *target = products;
            }
            if let Ok(mut target) = state.inner.successful_upload_skus.lock() {
                *target = successful_upload_skus;
            }
            let _ = app.emit(
                "snapshot-updated",
                json!({"count": state.inner.products.lock().map(|items| items.len()).unwrap_or(0)}),
            );
        }
        "snapshot.request" => {
            if role == BridgeRole::Photoshop {
                let _ = send_json_to_client(
                    state,
                    client_id,
                    &json!({
                        "type": "photoshop.ready",
                        "protocol": "document-query-v1",
                    }),
                );
            }
        }
        "document.request" => {
            if role != BridgeRole::Photoshop {
                return;
            }
            let title = value
                .get("title")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let response = state.inner.products.lock().ok().and_then(|items| {
                find_product_by_document_title(&items, &title).map(|(index, identifier)| {
                    let product = &items[index];
                    json!({
                        "type": "document.response",
                        "title": title,
                        "matched": true,
                        "match": {
                            "key": identifier.key,
                            "label": identifier.label,
                            "raw": identifier.raw,
                        },
                        "product": photoshop_product_detail_value(product),
                    })
                })
            });
            let payload = response.unwrap_or_else(|| {
                json!({
                    "type": "document.response",
                    "title": title,
                    "matched": false,
                    "product": Value::Null,
                })
            });
            let _ = send_json_to_client(state, client_id, &payload);
        }
        "product.request" => {
            if role != BridgeRole::Photoshop {
                return;
            }
            let sku = value
                .get("sku")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_uppercase();
            let product = state.inner.products.lock().ok().and_then(|items| {
                items
                    .iter()
                    .find(|item| item.sku.eq_ignore_ascii_case(&sku))
                    .map(photoshop_product_detail_value)
            });
            let _ = send_json_to_client(
                state,
                client_id,
                &json!({
                    "type": "product.response",
                    "sku": sku,
                    "product": product,
                }),
            );
        }
        "asset.bundle" => {
            if role != BridgeRole::Assistant {
                return;
            }
            let job_id = value
                .get("jobId")
                .and_then(Value::as_str)
                .unwrap_or_default();
            let pending = state
                .inner
                .pending
                .lock()
                .ok()
                .and_then(|mut jobs| jobs.remove(job_id));
            let Some(pending) = pending else { return };
            let result = persist_assets(&value, &pending);
            let (job_state, message) = match result {
                Ok(message) => ("done", message),
                Err(error) => ("error", error),
            };
            let _ = app.emit(
                "asset-job",
                json!({"sku": pending.sku, "state": job_state, "message": message}),
            );
        }
        "excel.error" => {
            if role != BridgeRole::Assistant {
                return;
            }
            let job_id = value
                .get("jobId")
                .and_then(Value::as_str)
                .unwrap_or_default();
            let pending = state
                .inner
                .pending
                .lock()
                .ok()
                .and_then(|mut jobs| jobs.remove(job_id));
            if let Some(pending) = pending {
                let message = value
                    .get("message")
                    .and_then(Value::as_str)
                    .unwrap_or("悬浮助手生成 Excel 失败");
                let _ = app.emit(
                    "asset-job",
                    json!({"sku": pending.sku, "state":"error", "message":message}),
                );
            }
        }
        "ping" => {
            let _ = send_json_to_client(
                state,
                client_id,
                &json!({"type": "pong", "at": bridge_timestamp()}),
            );
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
    let bytes = BASE64
        .decode(encoded)
        .map_err(|error| format!("Excel 数据无法解码：{error}"))?;
    if bytes.len() > MAX_EXCEL_BYTES || !bytes.starts_with(b"PK") {
        return Err("悬浮助手返回的 Excel 文件无效".to_string());
    }
    if let Some(parent) = pending.excel_path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("无法创建 Excel 目录：{error}"))?;
    }
    let temporary = pending
        .excel_path
        .with_extension(format!("xlsx.{}.partial", Uuid::new_v4()));
    fs::write(&temporary, bytes).map_err(|error| format!("无法写入 Excel 临时文件：{error}"))?;
    if pending.excel_path.exists() {
        fs::remove_file(&pending.excel_path)
            .map_err(|error| format!("无法覆盖已有 Excel：{error}"))?;
    }
    fs::rename(&temporary, &pending.excel_path)
        .map_err(|error| format!("无法完成 Excel 文件写入：{error}"))?;
    Ok(true)
}

fn persist_jpeg(data_url: &str, path: &Path, overwrite: bool) -> Result<bool, String> {
    if path.exists() && !overwrite {
        return Ok(false);
    }
    if data_url.is_empty() {
        return Ok(false);
    }
    let encoded = data_url
        .split_once(',')
        .map(|(_, data)| data)
        .unwrap_or(data_url);
    let bytes = BASE64
        .decode(encoded)
        .map_err(|error| format!("图片数据无法解码：{error}"))?;
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
        value
            .get("excelBase64")
            .and_then(Value::as_str)
            .unwrap_or_default(),
        pending,
    )?;
    let sku_image_created = persist_jpeg(
        value
            .get("skuImageDataUrl")
            .and_then(Value::as_str)
            .unwrap_or_default(),
        &pending.sku_image_path,
        pending.overwrite,
    )?;
    let english_created = persist_jpeg(
        value
            .get("englishDataUrl")
            .and_then(Value::as_str)
            .unwrap_or_default(),
        &pending.english_path,
        pending.overwrite,
    )?;
    let size_created = persist_jpeg(
        value
            .get("sizeDataUrl")
            .and_then(Value::as_str)
            .unwrap_or_default(),
        &pending.size_path,
        pending.overwrite,
    )?;
    let created = [
        excel_created,
        sku_image_created,
        english_created,
        size_created,
    ]
    .into_iter()
    .filter(|value| *value)
    .count();
    if created == 4 {
        Ok("Excel、SKU 图、英文参数图和尺寸图已由悬浮助手生成".to_string())
    } else if created == 0 {
        Ok("目标文件均已存在，已跳过".to_string())
    } else {
        Ok(format!(
            "悬浮助手已生成 {created} 个文件，其余文件已存在或缺少透明.png"
        ))
    }
}

#[derive(Clone)]
struct UploadCandidate {
    path: PathBuf,
    name: String,
    size: u64,
    modified_ms: u128,
    valid: bool,
    message: String,
}

fn upload_candidate_sku(name: &str) -> Option<String> {
    Regex::new(r"(?i)SKU\d+")
        .ok()?
        .find(name)
        .map(|value| value.as_str().to_uppercase())
}

fn file_modified_ms(path: &Path) -> u128 {
    fs::metadata(path)
        .ok()
        .and_then(|meta| meta.modified().ok())
        .and_then(|value| value.duration_since(UNIX_EPOCH).ok())
        .map(|value| value.as_millis())
        .unwrap_or_default()
}

fn collect_upload_files(folder: &Path, depth: usize, output: &mut Vec<PathBuf>) {
    if depth > 5 {
        return;
    }
    let Ok(entries) = fs::read_dir(folder) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let name = path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or_default();
            if !name.starts_with('.')
                && !matches!(
                    name.to_ascii_lowercase().as_str(),
                    "node_modules" | "target"
                )
            {
                collect_upload_files(&path, depth + 1, output);
            }
        } else if path.is_file() {
            let extension = path
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_ascii_lowercase();
            if matches!(extension.as_str(), "xlsx" | "xls" | "zip") {
                output.push(path);
            }
        }
    }
}

fn inspect_upload_candidate(path: PathBuf) -> Option<(String, UploadCandidate)> {
    let name = path
        .file_name()
        .and_then(|value| value.to_str())?
        .to_string();
    let sku = upload_candidate_sku(&name)?;
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    let size = fs::metadata(&path).ok()?.len();
    let max_size = if extension == "zip" {
        MAX_UPLOAD_ZIP_BYTES as u64
    } else {
        MAX_EXCEL_BYTES as u64
    };
    let mut valid = size > 1 && size <= max_size;
    let mut message = if size == 0 {
        "文件为空".to_string()
    } else if size > max_size {
        "文件超过上传大小限制".to_string()
    } else {
        String::new()
    };
    if valid {
        let header = fs::File::open(&path).ok().and_then(|mut file| {
            let mut bytes = [0_u8; 2];
            std::io::Read::read_exact(&mut file, &mut bytes)
                .ok()
                .map(|_| bytes)
        });
        if header != Some([b'P', b'K']) {
            valid = false;
            message = "不是有效的 ZIP/XLSX 文件".to_string();
        }
    }
    let modified_ms = file_modified_ms(&path);
    Some((
        sku,
        UploadCandidate {
            path,
            name,
            size,
            modified_ms,
            valid,
            message,
        },
    ))
}

#[tauri::command]
fn scan_upload_pairs(
    state: State<'_, BridgeState>,
    root: String,
) -> Result<Vec<UploadPair>, String> {
    let root = PathBuf::from(root);
    if !root.is_dir() {
        return Err("产品文件夹根目录不存在".to_string());
    }
    let mut paths = Vec::new();
    collect_upload_files(&root, 0, &mut paths);
    let successful_upload_skus = state
        .inner
        .successful_upload_skus
        .lock()
        .map(|items| items.clone())
        .unwrap_or_default();
    let mut grouped: HashMap<String, (Vec<UploadCandidate>, Vec<UploadCandidate>)> = HashMap::new();
    for path in paths {
        let Some((sku, candidate)) = inspect_upload_candidate(path) else {
            continue;
        };
        let entry = grouped.entry(sku).or_default();
        if candidate.name.to_ascii_lowercase().ends_with(".zip") {
            entry.1.push(candidate);
        } else {
            entry.0.push(candidate);
        }
    }
    let mut result = grouped
        .into_iter()
        .map(|(sku, (mut excels, mut zips))| {
            excels.sort_by_key(|item| std::cmp::Reverse(item.modified_ms));
            zips.sort_by_key(|item| std::cmp::Reverse(item.modified_ms));
            let excel = excels.into_iter().next();
            let zip = zips.into_iter().next();
            let mut messages = Vec::new();
            if excel.is_none() {
                messages.push("缺少 XLSX".to_string());
            }
            if zip.is_none() {
                messages.push("缺少 ZIP".to_string());
            }
            if let Some(item) = excel.as_ref().filter(|item| !item.valid) {
                messages.push(format!("XLSX：{}", item.message));
            }
            if let Some(item) = zip.as_ref().filter(|item| !item.valid) {
                messages.push(format!("ZIP：{}", item.message));
            }
            let ready = excel.as_ref().map(|item| item.valid).unwrap_or(false)
                && zip.as_ref().map(|item| item.valid).unwrap_or(false);
            let signature = if ready {
                format!(
                    "{}:{}:{}:{}:{}",
                    sku,
                    excel.as_ref().map(|item| item.size).unwrap_or_default(),
                    excel
                        .as_ref()
                        .map(|item| item.modified_ms)
                        .unwrap_or_default(),
                    zip.as_ref().map(|item| item.size).unwrap_or_default(),
                    zip.as_ref()
                        .map(|item| item.modified_ms)
                        .unwrap_or_default()
                )
            } else {
                String::new()
            };
            let uploaded_before = successful_upload_skus.contains(&sku);
            UploadPair {
                sku,
                xlsx_path: excel
                    .as_ref()
                    .filter(|item| item.valid)
                    .map(|item| path_text(&item.path)),
                zip_path: zip
                    .as_ref()
                    .filter(|item| item.valid)
                    .map(|item| path_text(&item.path)),
                xlsx_name: excel.as_ref().map(|item| item.name.clone()),
                zip_name: zip.as_ref().map(|item| item.name.clone()),
                xlsx_size: excel.as_ref().map(|item| item.size).unwrap_or_default(),
                zip_size: zip.as_ref().map(|item| item.size).unwrap_or_default(),
                xlsx_modified_ms: excel
                    .as_ref()
                    .map(|item| item.modified_ms)
                    .unwrap_or_default(),
                zip_modified_ms: zip
                    .as_ref()
                    .map(|item| item.modified_ms)
                    .unwrap_or_default(),
                status: if uploaded_before {
                    "uploaded"
                } else if ready {
                    "ready"
                } else if messages
                    .iter()
                    .any(|item| item.contains("超过") || item.contains("有效"))
                {
                    "invalid"
                } else {
                    "missing"
                }
                .to_string(),
                message: if uploaded_before {
                    "历史记录显示该产品已上传成功，已排除上传队列".to_string()
                } else if messages.is_empty() {
                    "已找到同一 SKU 的 XLSX 和 ZIP".to_string()
                } else {
                    messages.join("；")
                },
                signature,
            }
        })
        .collect::<Vec<_>>();
    result.sort_by(|left, right| left.sku.cmp(&right.sku));
    Ok(result)
}

fn read_upload_file(path: &Path, max_size: usize) -> Result<Vec<u8>, String> {
    let bytes = fs::read(path).map_err(|error| format!("无法读取 {}：{error}", path_text(path)))?;
    if bytes.len() < 2 || bytes.len() > max_size || !bytes.starts_with(b"PK") {
        return Err(format!("文件无效或超过限制：{}", path_text(path)));
    }
    Ok(bytes)
}

#[tauri::command]
fn queue_upload_pairs(
    state: State<'_, BridgeState>,
    pairs: Vec<UploadPairRequest>,
    auto_start: bool,
) -> Result<usize, String> {
    if pairs.is_empty() {
        return Ok(0);
    }
    if send_json_to_role(&state, BridgeRole::Assistant, &json!({"type":"ping"})) == 0 {
        return Err("PLM 悬浮助手尚未连接".to_string());
    }
    let mut sent = 0;
    for pair in pairs {
        let sku = pair.sku.to_uppercase();
        if !Regex::new(r"^SKU\d+$")
            .map(|pattern| pattern.is_match(&sku))
            .unwrap_or(false)
        {
            continue;
        }
        let xlsx_bytes = read_upload_file(Path::new(&pair.xlsx_path), MAX_EXCEL_BYTES)?;
        let zip_bytes = read_upload_file(Path::new(&pair.zip_path), MAX_UPLOAD_ZIP_BYTES)?;
        let request_id = Uuid::new_v4().to_string();
        let xlsx_name = Path::new(&pair.xlsx_path)
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("product.xlsx");
        let zip_name = Path::new(&pair.zip_path)
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("image-pack.zip");
        let xlsx_total = (xlsx_bytes.len() + UPLOAD_CHUNK_BYTES - 1) / UPLOAD_CHUNK_BYTES;
        let zip_total = (zip_bytes.len() + UPLOAD_CHUNK_BYTES - 1) / UPLOAD_CHUNK_BYTES;
        let payload = json!({
            "type": "upload.queue.begin",
            "mode": "magic-package",
            "requestId": request_id,
            "autoStart": auto_start,
            "item": {
                "sku": sku,
                "signature": pair.signature,
                "xlsxName": xlsx_name,
                "zipName": zip_name,
                "xlsxSize": xlsx_bytes.len(),
                "zipSize": zip_bytes.len(),
                "xlsxTotal": xlsx_total,
                "zipTotal": zip_total,
            }
        });
        if send_json_to_role(&state, BridgeRole::Assistant, &payload) == 0 {
            return Err("悬浮助手连接已断开".to_string());
        }
        for (file_kind, bytes, total) in [
            ("xlsx", xlsx_bytes, xlsx_total),
            ("zip", zip_bytes, zip_total),
        ] {
            for index in 0..total {
                let start = index * UPLOAD_CHUNK_BYTES;
                let end = (start + UPLOAD_CHUNK_BYTES).min(bytes.len());
                let chunk = json!({
                    "type": "upload.queue.chunk",
                    "requestId": request_id,
                    "file": file_kind,
                    "index": index,
                    "total": total,
                    "data": BASE64.encode(&bytes[start..end]),
                });
                if send_json_to_role(&state, BridgeRole::Assistant, &chunk) == 0 {
                    return Err("悬浮助手连接已断开".to_string());
                }
            }
        }
        sent += 1;
    }
    Ok(sent)
}

#[tauri::command]
fn bridge_info(state: State<'_, BridgeState>) -> BridgeInfo {
    bridge_info_value(&state)
}

#[tauri::command]
fn get_products(state: State<'_, BridgeState>) -> Vec<FinalizedProduct> {
    state
        .inner
        .products
        .lock()
        .map(|items| items.clone())
        .unwrap_or_default()
}

#[tauri::command]
fn request_snapshot(state: State<'_, BridgeState>) -> Result<(), String> {
    if request_assistant_snapshot(&state) == 0 {
        return Err("PLM 悬浮助手尚未连接".to_string());
    }
    Ok(())
}

#[tauri::command]
fn read_image_data_url(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    if !path.is_file() {
        return Err("图片文件不存在".to_string());
    }
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_lowercase();
    let mime = match extension.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        _ => return Err("不支持的图片格式".to_string()),
    };
    let bytes = fs::read(&path).map_err(|error| format!("无法读取图片：{error}"))?;
    if bytes.len() > 25 * 1024 * 1024 {
        return Err("图片超过 25MB，无法预览".to_string());
    }
    Ok(format!("data:{mime};base64,{}", BASE64.encode(bytes)))
}

#[tauri::command]
fn save_annotated_size_image(path: String, data_url: String) -> Result<bool, String> {
    let path = PathBuf::from(path);
    if path.file_name().and_then(|value| value.to_str()) != Some("尺寸.jpg") {
        return Err("只能覆盖产品参数图中的尺寸.jpg".to_string());
    }
    persist_jpeg(&data_url, &path, true)
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
            Ok(pattern) => rules.push(RenameRule {
                pattern,
                target: target.to_string(),
            }),
            Err(error) => errors.push(format!("第 {} 行正则无效：{}", index + 1, error)),
        }
    }
    if errors.is_empty() {
        Ok(rules)
    } else {
        Err(errors.join("\n"))
    }
}

fn parse_pack_slot(target: &str) -> Option<(PackSlotFamily, usize)> {
    let (family, rest) = if let Some(rest) = target.strip_prefix("主图") {
        (PackSlotFamily::Main, rest)
    } else if let Some(rest) = target.strip_prefix("详情图") {
        (PackSlotFamily::Detail, rest)
    } else {
        return None;
    };
    if rest.is_empty() || !rest.chars().all(|value| value.is_ascii_digit()) {
        return None;
    }
    let index = rest.parse::<usize>().ok()?;
    (index > 0).then_some((family, index))
}

fn pack_slot_family(zip_name: &str, matched_targets: &HashSet<String>) -> Option<PackSlotFamily> {
    let mut matched_family = None;
    for target in matched_targets {
        let Some((family, _)) = parse_pack_slot(target) else {
            continue;
        };
        if let Some(previous) = matched_family {
            if previous != family {
                return None;
            }
        } else {
            matched_family = Some(family);
        }
    }
    if matched_family.is_some() {
        return matched_family;
    }
    let lower_name = zip_name.to_lowercase();
    match (lower_name.contains("主图"), lower_name.contains("详情图")) {
        (true, false) => Some(PackSlotFamily::Main),
        (false, true) => Some(PackSlotFamily::Detail),
        _ => None,
    }
}

fn missing_pack_targets(
    zip_name: &str,
    rules: &[RenameRule],
    matched_targets: &HashSet<String>,
) -> Option<Vec<String>> {
    let family = pack_slot_family(zip_name, matched_targets)?;
    let mut slots = rules
        .iter()
        .filter_map(|rule| {
            parse_pack_slot(&rule.target)
                .map(|(rule_family, index)| (rule_family, index, rule.target.clone()))
        })
        .filter(|(rule_family, _, _)| *rule_family == family)
        .collect::<Vec<_>>();
    slots.sort_by(|left, right| left.1.cmp(&right.1).then_with(|| left.2.cmp(&right.2)));

    let mut seen = HashSet::new();
    Some(
        slots
            .into_iter()
            .filter_map(|(_, _, target)| {
                if !seen.insert(target.clone()) || matched_targets.contains(&target) {
                    None
                } else {
                    Some(target)
                }
            })
            .collect(),
    )
}

fn pack_source_sort_key(name: &str) -> (u8, usize, String) {
    let lower = name.to_lowercase();
    let numeric_suffix = lower
        .strip_prefix("new_product_image_")
        .and_then(|rest| rest.split(['-', '_']).next())
        .and_then(|value| value.parse::<usize>().ok());
    match numeric_suffix {
        Some(number) => (0, number, lower),
        None => (1, usize::MAX, lower),
    }
}

fn pack_target_name(stem: &str, extension: &str) -> String {
    if extension.is_empty() {
        stem.to_string()
    } else {
        format!("{stem}.{extension}")
    }
}

fn extract_pack_sku(filename: &str) -> Option<String> {
    Regex::new(r"(?i)SKU\d{8}")
        .ok()?
        .find(filename)
        .map(|matched| matched.as_str().to_uppercase())
}

fn unique_archive_path(folder: &Path, file_name: &str) -> PathBuf {
    let original = Path::new(file_name);
    let stem = original
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("图包文件");
    let extension = original
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
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

fn is_pack_image(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_lowercase()
            .as_str(),
        "jpg" | "jpeg" | "png" | "tif" | "tiff" | "bmp" | "webp"
    )
}

fn photoshop_image_category(path: &Path) -> u8 {
    let stem = path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
    if stem.starts_with("主图") {
        1
    } else if stem.starts_with("详情图") {
        2
    } else {
        0
    }
}

pub(crate) fn application_data_root() -> PathBuf {
    let base = std::env::var_os("LOCALAPPDATA")
        .or_else(|| std::env::var_os("APPDATA"))
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir);
    base.join("Product Asset Workbench")
}

fn external_recycle_root() -> PathBuf {
    application_data_root().join("图包回收站")
}

fn label_check_history_path() -> PathBuf {
    application_data_root().join("纸盒标签确认记录.json")
}

fn image_recycle_path(path: &Path) -> PathBuf {
    let mut cursor = path.parent();
    let mut product_name = "未识别产品".to_string();
    while let Some(directory) = cursor {
        let directory_name = directory
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default();
        if directory_name == "套图" {
            if let Some(parent) = directory.parent() {
                product_name = parent
                    .file_name()
                    .and_then(|value| value.to_str())
                    .unwrap_or("未识别产品")
                    .to_string();
            }
            break;
        }
        cursor = directory.parent();
    }
    let category = path
        .parent()
        .and_then(|parent| parent.file_name())
        .and_then(|value| value.to_str())
        .unwrap_or("其他");
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("原图");
    external_recycle_root()
        .join(sanitize_component(&product_name))
        .join(sanitize_component(category))
        .join(file_name)
}

fn start_photoshop_compression(
    photoshop_path: &Path,
    image_paths: &[PathBuf],
    move_originals_to_recycle: bool,
) -> Result<PathBuf, String> {
    if !photoshop_path.is_file() {
        return Err("Photoshop.exe 路径无效".to_string());
    }
    if image_paths.is_empty() {
        return Err("没有可交给 Photoshop 压缩的图片".to_string());
    }
    let input_paths = image_paths
        .iter()
        .map(|path| path_text(path))
        .collect::<Vec<_>>();
    let categories = image_paths
        .iter()
        .map(|path| photoshop_image_category(path))
        .collect::<Vec<_>>();
    let recycle_paths = if move_originals_to_recycle {
        image_paths
            .iter()
            .map(|path| path_text(&image_recycle_path(path)))
            .collect::<Vec<_>>()
    } else {
        image_paths
            .iter()
            .map(|_| String::new())
            .collect::<Vec<_>>()
    };
    let script = PS_BATCH_SCRIPT
        .replace(
            "__INPUT_PATHS__",
            &serde_json::to_string(&input_paths)
                .map_err(|error| format!("无法生成 Photoshop 图片清单：{error}"))?,
        )
        .replace(
            "__CATEGORIES__",
            &serde_json::to_string(&categories)
                .map_err(|error| format!("无法生成 Photoshop 分类清单：{error}"))?,
        )
        .replace(
            "__MOVE_ORIGINALS__",
            if move_originals_to_recycle {
                "true"
            } else {
                "false"
            },
        )
        .replace(
            "__RECYCLE_PATHS__",
            &serde_json::to_string(&recycle_paths)
                .map_err(|error| format!("无法生成原图回收路径：{error}"))?,
        );
    let script_path =
        std::env::temp_dir().join(format!("plm-ps-batch-resize-1600-{}.jsx", Uuid::new_v4()));
    let mut encoded = vec![0xef, 0xbb, 0xbf];
    encoded.extend_from_slice(script.as_bytes());
    fs::write(&script_path, encoded)
        .map_err(|error| format!("无法写入 Photoshop 脚本：{error}"))?;
    Command::new(photoshop_path)
        .arg("-r")
        .arg(&script_path)
        .spawn()
        .map_err(|error| format!("启动 Photoshop 失败：{error}"))?;
    Ok(script_path)
}

fn find_photoshop() -> String {
    let mut matches = Vec::new();
    let mut adobe_roots = Vec::new();
    for variable in ["ProgramW6432", "ProgramFiles", "ProgramFiles(x86)"] {
        let Some(root) = std::env::var_os(variable) else {
            continue;
        };
        adobe_roots.push(PathBuf::from(root).join("Adobe"));
    }
    for drive in b'C'..=b'Z' {
        adobe_roots.push(PathBuf::from(format!("{}:\\Adobe", drive as char)));
    }
    adobe_roots.sort();
    adobe_roots.dedup();
    for adobe in adobe_roots {
        let Ok(entries) = fs::read_dir(adobe) else {
            continue;
        };
        for entry in entries.filter_map(Result::ok) {
            let folder = entry.path();
            let name = folder
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or_default();
            if name.to_lowercase().starts_with("adobe photoshop") {
                let executable = folder.join("Photoshop.exe");
                if executable.is_file() {
                    matches.push(executable);
                }
            }
        }
    }
    matches.sort_by_key(|path| path.to_string_lossy().to_lowercase());
    matches
        .last()
        .map(|path| path_text(path))
        .unwrap_or_default()
}

#[tauri::command]
async fn detect_photoshop() -> String {
    tauri::async_runtime::spawn_blocking(find_photoshop)
        .await
        .unwrap_or_default()
}

#[tauri::command]
fn archive_image_packs(
    zip_paths: Vec<String>,
    root: String,
    rules_text: String,
    use_rules: bool,
    delete_zip: bool,
    compress_images: bool,
    photoshop_path: String,
    move_originals_to_recycle: bool,
) -> Result<ArchivePacksResult, String> {
    let root = PathBuf::from(root);
    if !root.is_dir() {
        return Err(format!("产品根目录不存在：{}", path_text(&root)));
    }
    if zip_paths.is_empty() {
        return Err("请先添加至少一个图包 ZIP".to_string());
    }
    let photoshop = PathBuf::from(photoshop_path);
    if compress_images && !photoshop.is_file() {
        return Err("请先选择有效的 Photoshop.exe".to_string());
    }
    let rules = if use_rules {
        parse_pack_rules(&rules_text)?
    } else {
        Vec::new()
    };
    let directories = direct_product_directories(&root);
    let mut extracted_images = Vec::new();
    let mut result = ArchivePacksResult {
        logs: Vec::new(),
        success: 0,
        skipped: 0,
        failed: 0,
        deleted: 0,
        compressed_images: 0,
        photoshop_started: false,
    };
    for raw_path in zip_paths {
        let zip_path = PathBuf::from(&raw_path);
        let zip_name = zip_path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or(&raw_path);
        result.logs.push(format!("━━━ {zip_name} ━━━"));
        let Some(sku) = extract_pack_sku(zip_name) else {
            result.failed += 1;
            result
                .logs
                .push("错误：无法从 ZIP 文件名提取 SKU 编码".to_string());
            continue;
        };
        let matches = directories
            .iter()
            .filter(|path| {
                path.file_name()
                    .map(|value| value.to_string_lossy().to_uppercase().contains(&sku))
                    .unwrap_or(false)
            })
            .collect::<Vec<_>>();
        let Some(product_folder) = matches.first() else {
            result.failed += 1;
            result
                .logs
                .push(format!("错误：在产品根目录下找不到含 {sku} 的文件夹"));
            continue;
        };
        if matches.len() > 1 {
            result.logs.push(format!(
                "警告：找到 {} 个匹配文件夹，使用 {}",
                matches.len(),
                product_folder
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
            ));
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
                result
                    .logs
                    .push(format!("错误：不是有效的 ZIP 文件：{error}"));
                continue;
            }
        };
        let before_failed = result.failed;
        let before_skipped = result.skipped;
        let mut plans = Vec::new();
        let mut matched_targets = HashSet::new();
        let mut unmatched_image_plans = Vec::new();
        for index in 0..archive.len() {
            let entry = match archive.by_index(index) {
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
            let Some(source_name) = Path::new(entry.name())
                .file_name()
                .and_then(|value| value.to_str())
                .map(str::to_string)
            else {
                result.skipped += 1;
                result
                    .logs
                    .push(format!("跳过无效文件名：{}", entry.name()));
                continue;
            };
            let source_path = Path::new(&source_name);
            let stem = source_path
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or_default();
            let extension = source_path
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_string();
            let target_name = if use_rules {
                if let Some((family, index)) = parse_pack_slot(stem) {
                    let target = match family {
                        PackSlotFamily::Main => format!("主图{index}"),
                        PackSlotFamily::Detail => format!("详情图{index}"),
                    };
                    matched_targets.insert(target.clone());
                    Some(pack_target_name(&target, &extension))
                } else if let Some(rule) = rules.iter().find(|rule| rule.pattern.is_match(stem)) {
                    matched_targets.insert(rule.target.clone());
                    Some(pack_target_name(&rule.target, &extension))
                } else if is_pack_image(source_path) {
                    None
                } else {
                    result.skipped += 1;
                    result
                        .logs
                        .push(format!("跳过（无匹配规则）：{source_name}"));
                    continue;
                }
            } else {
                Some(source_name.clone())
            };
            let plan_index = plans.len();
            if target_name.is_none() {
                unmatched_image_plans.push(plan_index);
            }
            plans.push(PackEntryPlan {
                index,
                source_name,
                extension,
                target_name,
            });
        }

        if use_rules && !unmatched_image_plans.is_empty() {
            let missing_targets = missing_pack_targets(zip_name, &rules, &matched_targets);
            let mut unmatched_image_plans = unmatched_image_plans;
            unmatched_image_plans.sort_by(|left, right| {
                pack_source_sort_key(&plans[*left].source_name)
                    .cmp(&pack_source_sort_key(&plans[*right].source_name))
            });
            if let Some(missing_targets) = missing_targets {
                let assign_count = unmatched_image_plans.len().min(missing_targets.len());
                if assign_count > 0 {
                    result.logs.push(format!(
                        "未匹配图片按文件名顺序自动补到缺失槽位：{}",
                        missing_targets[..assign_count].join("、")
                    ));
                    for (plan_index, target_stem) in unmatched_image_plans
                        .iter()
                        .zip(missing_targets.iter())
                        .take(assign_count)
                    {
                        let plan = &mut plans[*plan_index];
                        plan.target_name = Some(pack_target_name(target_stem, &plan.extension));
                        result.logs.push(format!(
                            "自动补名：{} → {}",
                            plan.source_name,
                            plan.target_name.as_deref().unwrap_or_default()
                        ));
                    }
                }
                for plan_index in unmatched_image_plans.iter().skip(assign_count) {
                    result.skipped += 1;
                    result.logs.push(format!(
                        "跳过（缺失槽位已用完）：{}",
                        plans[*plan_index].source_name
                    ));
                }
            } else {
                for plan_index in unmatched_image_plans {
                    result.skipped += 1;
                    result.logs.push(format!(
                        "跳过（无法判断主图/详情图槽位）：{}",
                        plans[plan_index].source_name
                    ));
                }
            }
        }
        drop(archive);
        let file = match fs::File::open(&zip_path) {
            Ok(file) => file,
            Err(error) => {
                result.failed += 1;
                result.logs.push(format!("错误：无法重新打开 ZIP：{error}"));
                continue;
            }
        };
        let mut archive = match ZipArchive::new(file) {
            Ok(archive) => archive,
            Err(error) => {
                result.failed += 1;
                result.logs.push(format!("错误：无法重新读取 ZIP：{error}"));
                continue;
            }
        };
        for plan in plans {
            let Some(target_name) = plan.target_name else {
                continue;
            };
            let mut entry = match archive.by_index(plan.index) {
                Ok(entry) => entry,
                Err(error) => {
                    result.failed += 1;
                    result
                        .logs
                        .push(format!("读取压缩项失败：{} — {error}", plan.source_name));
                    continue;
                }
            };
            let destination = unique_archive_path(&target, &target_name);
            match fs::File::create(&destination)
                .and_then(|mut output| std::io::copy(&mut entry, &mut output).map(|_| ()))
            {
                Ok(()) => {
                    result.success += 1;
                    result.logs.push(format!(
                        "{} → {}",
                        plan.source_name,
                        destination
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                    ));
                    if is_pack_image(&destination) {
                        extracted_images.push(destination);
                    }
                }
                Err(error) => {
                    result.failed += 1;
                    result
                        .logs
                        .push(format!("解压失败：{} — {error}", plan.source_name));
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
    if compress_images {
        if extracted_images.is_empty() {
            result
                .logs
                .push("未找到可压缩的图片，已跳过 Photoshop".to_string());
        } else {
            start_photoshop_compression(&photoshop, &extracted_images, move_originals_to_recycle)?;
            result.compressed_images = extracted_images.len();
            result.photoshop_started = true;
            result.logs.push(format!(
                "已启动 Photoshop：将 {} 张图片压缩到各自的“主图 / 详情图 / 其他”文件夹（最长边 1600px）",
                extracted_images.len()
            ));
            if move_originals_to_recycle {
                result.logs.push(format!(
                    "每张 JPG 保存成功后，原图将移到电脑其他位置的回收站：{}",
                    path_text(&external_recycle_root())
                ));
            }
        }
    }
    Ok(result)
}

struct ComposeImage {
    source_name: String,
    extension: String,
    bytes: Vec<u8>,
}

fn compose_slot(stem: &str) -> Option<(bool, usize)> {
    let lower = stem.to_ascii_lowercase();
    if let Some(rest) = lower.strip_prefix("input-main-prompt-") {
        let index = rest.split('-').next()?.parse::<usize>().ok()?;
        if (1..=6).contains(&index) {
            return Some((true, index));
        }
    }
    if let Some(rest) = lower.strip_prefix("主图") {
        let index = rest.parse::<usize>().ok()?;
        if (1..=6).contains(&index) {
            return Some((true, index));
        }
    }
    let detail_prefixes = [
        ("input-detail-sale-prompt-1-", 1),
        ("input-detail-sale-prompt-2-", 2),
        ("input-detail-component-prompt-", 3),
        ("input-detail-advantage-prompt-1-", 4),
        ("input-detail-advantage-prompt-2-", 5),
        ("input-detail-details-prompt-1-", 6),
        ("input-detail-details-prompt-2-", 7),
        ("input-detail-efficacy-prompt-", 8),
        ("input-detail-use-step-prompt-", 9),
        ("input-detail-scene-prompt-", 10),
    ];
    if let Some((_, index)) = detail_prefixes
        .iter()
        .find(|(prefix, _)| lower.starts_with(prefix))
    {
        return Some((false, *index));
    }
    if let Some(rest) = lower.strip_prefix("详情图") {
        let index = rest.parse::<usize>().ok()?;
        if (1..=10).contains(&index) {
            return Some((false, index));
        }
    }
    None
}

fn wait_for_composed_photoshop_outputs(
    temp: &Path,
    selected: &[(bool, usize, PathBuf)],
) -> Result<(), String> {
    let deadline = std::time::Instant::now() + Duration::from_secs(300);
    loop {
        let complete = selected.iter().all(|(is_main, index, _)| {
            let folder = if *is_main { "主图" } else { "详情图" };
            let name = if *is_main {
                format!("主图{index}.jpg")
            } else {
                format!("详情图{index}.jpg")
            };
            temp.join(folder).join(name).is_file()
        });
        if complete {
            return Ok(());
        }
        if std::time::Instant::now() >= deadline {
            return Err("Photoshop 压缩超时，未生成完整组合".to_string());
        }
        std::thread::sleep(Duration::from_millis(600));
    }
}

#[tauri::command]
fn compose_random_pack(
    zip_paths: Vec<String>,
    output_dir: String,
    main_count: usize,
    detail_count: usize,
    compress_images: bool,
    photoshop_path: String,
) -> Result<ComposePackResult, String> {
    if zip_paths.is_empty() {
        return Err("请先导入至少一个主图或详情图 ZIP".to_string());
    }
    let main_count = main_count.clamp(1, 6);
    let detail_count = detail_count.clamp(1, 10);
    let output_dir = PathBuf::from(output_dir);
    if !output_dir.is_dir() {
        return Err("导出目录不存在".to_string());
    }
    let photoshop = PathBuf::from(photoshop_path);
    if compress_images && !photoshop.is_file() {
        return Err("请先选择有效的 Photoshop.exe".to_string());
    }

    let mut main_candidates: Vec<Vec<ComposeImage>> = (0..main_count).map(|_| Vec::new()).collect();
    let mut detail_candidates: Vec<Vec<ComposeImage>> =
        (0..detail_count).map(|_| Vec::new()).collect();
    let mut logs = Vec::new();
    for raw_path in zip_paths {
        let zip_path = PathBuf::from(&raw_path);
        let zip_name = zip_path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or(&raw_path);
        let file = match fs::File::open(&zip_path) {
            Ok(file) => file,
            Err(error) => {
                logs.push(format!("跳过 {zip_name}：{error}"));
                continue;
            }
        };
        let mut archive = match ZipArchive::new(file) {
            Ok(archive) => archive,
            Err(error) => {
                logs.push(format!("跳过 {zip_name}：不是有效 ZIP（{error}）"));
                continue;
            }
        };
        for index in 0..archive.len() {
            let mut entry = match archive.by_index(index) {
                Ok(entry) => entry,
                Err(_) => continue,
            };
            if entry.is_dir() {
                continue;
            }
            let Some(source_name) = Path::new(entry.name())
                .file_name()
                .and_then(|value| value.to_str())
                .map(str::to_string)
            else {
                continue;
            };
            let source_path = Path::new(&source_name);
            if !is_pack_image(source_path) {
                continue;
            }
            let stem = source_path
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or_default();
            let Some((is_main, slot)) = compose_slot(stem) else {
                continue;
            };
            let mut bytes = Vec::new();
            if entry.read_to_end(&mut bytes).is_err() {
                continue;
            }
            let extension = source_path
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or("png")
                .to_ascii_lowercase();
            let candidate = ComposeImage {
                source_name: format!("{zip_name} / {source_name}"),
                extension,
                bytes,
            };
            if is_main {
                if let Some(items) = main_candidates.get_mut(slot - 1) {
                    items.push(candidate);
                }
            } else if let Some(items) = detail_candidates.get_mut(slot - 1) {
                items.push(candidate);
            }
        }
    }

    let mut missing_slots = Vec::new();
    for index in 1..=main_count {
        if main_candidates[index - 1].is_empty() {
            missing_slots.push(format!("主图{index}"));
        }
    }
    for index in 1..=detail_count {
        if detail_candidates[index - 1].is_empty() {
            missing_slots.push(format!("详情图{index}"));
        }
    }
    if !missing_slots.is_empty() {
        logs.push(format!("缺少素材：{}", missing_slots.join("、")));
        return Ok(ComposePackResult {
            logs,
            output_path: String::new(),
            selected_count: 0,
            missing_slots,
            photoshop_started: false,
        });
    }

    let temp = std::env::temp_dir().join(format!("plm-random-pack-{}", Uuid::new_v4()));
    fs::create_dir_all(&temp).map_err(|error| format!("无法创建临时目录：{error}"))?;
    let mut selected = Vec::new();
    let mut rng = rand::rng();
    for index in 1..=main_count {
        let candidate_index = rng.random_range(0..main_candidates[index - 1].len());
        let candidate = &main_candidates[index - 1][candidate_index];
        let path = temp.join(format!("主图{index}.{}", candidate.extension));
        fs::write(&path, &candidate.bytes)
            .map_err(|error| format!("无法写入主图{index}：{error}"))?;
        logs.push(format!("主图{index} ← {}", candidate.source_name));
        selected.push((true, index, path));
    }
    for index in 1..=detail_count {
        let candidate_index = rng.random_range(0..detail_candidates[index - 1].len());
        let candidate = &detail_candidates[index - 1][candidate_index];
        let path = temp.join(format!("详情图{index}.{}", candidate.extension));
        fs::write(&path, &candidate.bytes)
            .map_err(|error| format!("无法写入详情图{index}：{error}"))?;
        logs.push(format!("详情图{index} ← {}", candidate.source_name));
        selected.push((false, index, path));
    }

    let mut photoshop_started = false;
    if compress_images {
        let paths = selected
            .iter()
            .map(|(_, _, path)| path.clone())
            .collect::<Vec<_>>();
        start_photoshop_compression(&photoshop, &paths, false)?;
        wait_for_composed_photoshop_outputs(&temp, &selected)?;
        photoshop_started = true;
        logs.push(format!("Photoshop 已压缩 {} 张图片", selected.len()));
    }

    let main_output_dir = output_dir.join("主图");
    let detail_output_dir = output_dir.join("详情图");
    fs::create_dir_all(&main_output_dir).map_err(|error| format!("无法创建主图目录：{error}"))?;
    fs::create_dir_all(&detail_output_dir)
        .map_err(|error| format!("无法创建详情图目录：{error}"))?;
    for (is_main, index, original_path) in &selected {
        let (name, source_path) = if compress_images {
            let folder = if *is_main { "主图" } else { "详情图" };
            let name = if *is_main {
                format!("主图{index}.jpg")
            } else {
                format!("详情图{index}.jpg")
            };
            (name.clone(), temp.join(folder).join(name))
        } else {
            (
                original_path
                    .file_name()
                    .and_then(|value| value.to_str())
                    .unwrap_or_default()
                    .to_string(),
                original_path.clone(),
            )
        };
        let destination_dir = if *is_main {
            &main_output_dir
        } else {
            &detail_output_dir
        };
        let destination = destination_dir.join(&name);
        fs::copy(&source_path, &destination)
            .map_err(|error| format!("无法导出组合图片 {name}：{error}"))?;
        logs.push(format!("已导出：{}", path_text(&destination)));
    }
    let _ = fs::remove_dir_all(&temp);
    Ok(ComposePackResult {
        logs,
        output_path: path_text(&output_dir),
        selected_count: selected.len(),
        missing_slots,
        photoshop_started,
    })
}

fn count_recycle_files(folder: &Path) -> Result<usize, String> {
    let mut count = 0;
    for entry in fs::read_dir(folder)
        .map_err(|error| format!("无法读取回收站 {}：{error}", path_text(folder)))?
    {
        let entry = entry.map_err(|error| format!("无法读取回收站项目：{error}"))?;
        let file_type = entry
            .file_type()
            .map_err(|error| format!("无法读取回收站项目类型：{error}"))?;
        if file_type.is_dir() {
            count += count_recycle_files(&entry.path())?;
        } else {
            count += 1;
        }
    }
    Ok(count)
}

fn empty_recycle_at(recycle: &Path) -> Result<EmptyRecycleResult, String> {
    let recycle_root = path_text(recycle);
    let mut result = EmptyRecycleResult {
        deleted_files: 0,
        deleted_folders: 0,
        recycle_root,
    };
    if !recycle.exists() {
        return Ok(result);
    }
    let metadata = fs::symlink_metadata(recycle)
        .map_err(|error| format!("无法检查回收站 {}：{error}", path_text(recycle)))?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err(format!(
            "为安全起见，未清空非普通回收站目录：{}",
            path_text(recycle)
        ));
    }
    for entry in fs::read_dir(recycle)
        .map_err(|error| format!("无法读取回收站 {}：{error}", path_text(recycle)))?
    {
        let entry = entry.map_err(|error| format!("无法读取回收站项目：{error}"))?;
        let path = entry.path();
        let item_metadata = fs::symlink_metadata(&path)
            .map_err(|error| format!("无法检查回收站项目 {}：{error}", path_text(&path)))?;
        if item_metadata.file_type().is_symlink() {
            return Err(format!(
                "为安全起见，未删除回收站中的符号链接：{}",
                path_text(&path)
            ));
        }
        if item_metadata.is_dir() {
            result.deleted_files += count_recycle_files(&path)?;
            fs::remove_dir_all(&path)
                .map_err(|error| format!("无法清空回收站 {}：{error}", path_text(&path)))?;
            result.deleted_folders += 1;
        } else {
            fs::remove_file(&path)
                .map_err(|error| format!("无法删除回收站文件 {}：{error}", path_text(&path)))?;
            result.deleted_files += 1;
        }
    }
    Ok(result)
}

#[tauri::command]
fn empty_pack_recycle(root: String) -> Result<EmptyRecycleResult, String> {
    let root = PathBuf::from(root);
    if !root.is_dir() {
        return Err(format!("产品根目录不存在：{}", path_text(&root)));
    }
    empty_recycle_at(&external_recycle_root())
}

fn is_video_file(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_lowercase()
            .as_str(),
        "mp4" | "mov" | "m4v" | "avi" | "mkv" | "webm"
    )
}

fn is_gif_file(path: &Path) -> bool {
    path.extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case("gif"))
        .unwrap_or(false)
}

fn directory_contains_file(folder: &Path, predicate: fn(&Path) -> bool) -> bool {
    let Ok(entries) = fs::read_dir(folder) else {
        return false;
    };
    entries.filter_map(Result::ok).any(|entry| {
        entry
            .file_type()
            .map(|file_type| file_type.is_file() && predicate(&entry.path()))
            .unwrap_or(false)
    })
}

#[cfg(windows)]
fn suppress_console_window(command: &mut Command) {
    command.creation_flags(0x08000000);
}

#[cfg(not(windows))]
fn suppress_console_window(_command: &mut Command) {}

fn collect_video_files(folder: &Path, files: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(folder) else {
        return;
    };
    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        if file_type.is_dir() {
            collect_video_files(&path, files);
        } else if file_type.is_file() && is_video_file(&path) {
            files.push(path);
        }
    }
}

fn video_product_candidates(
    file_name: &str,
    directories: &[PathBuf],
) -> (Vec<PathBuf>, &'static str) {
    let file_upper = file_name.to_uppercase();
    let sku_pattern = Regex::new(r"(?i)SKU\d{8}").expect("valid SKU regex");
    let sku_matches = directories
        .iter()
        .filter(|path| {
            let folder_name = path
                .file_name()
                .map(|value| value.to_string_lossy())
                .unwrap_or_default();
            sku_pattern
                .find_iter(&folder_name)
                .any(|sku| file_upper.contains(&sku.as_str().to_uppercase()))
        })
        .cloned()
        .collect::<Vec<_>>();
    if !sku_matches.is_empty() {
        return (sku_matches, "sku");
    }
    let file_key = normalize_folder_match_text(
        Path::new(file_name)
            .file_stem()
            .and_then(|value| value.to_str())
            .unwrap_or(file_name),
    );
    if file_key.chars().count() < 3 {
        return (Vec::new(), "");
    }
    let name_matches = directories
        .iter()
        .filter(|path| {
            let folder_key = normalize_folder_match_text(
                &path
                    .file_name()
                    .map(|value| value.to_string_lossy())
                    .unwrap_or_default(),
            );
            folder_key.chars().count() >= 3
                && (file_key.contains(&folder_key) || folder_key.contains(&file_key))
        })
        .cloned()
        .collect::<Vec<_>>();
    let match_source = if name_matches.is_empty() {
        ""
    } else {
        "product-name"
    };
    (name_matches, match_source)
}

fn video_match_for_path(path: &Path, directories: &[PathBuf]) -> VideoMatch {
    let file_name = path
        .file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_default();
    let (matches, match_source) = video_product_candidates(&file_name, directories);
    let ambiguous_folders = matches
        .iter()
        .map(|item| path_text(item))
        .collect::<Vec<_>>();
    let (product_folder, status) = if matches.len() == 1 {
        (Some(path_text(&matches[0])), "待处理")
    } else if matches.len() > 1 {
        (None, "匹配到多个产品")
    } else {
        (None, "未匹配")
    };
    VideoMatch {
        source_path: path_text(path),
        file_name,
        product_folder,
        match_source: match_source.to_string(),
        ambiguous_folders,
        status: status.to_string(),
    }
}

fn video_outputs_exist(item: &VideoMatch) -> bool {
    let Some(product_text) = item.product_folder.as_ref() else {
        return false;
    };
    let product = Path::new(product_text);
    let pack = product.join("套图");
    directory_contains_file(&pack.join("视频"), is_video_file)
        && directory_contains_file(&pack.join("动图"), is_gif_file)
}

#[tauri::command]
fn default_video_source() -> String {
    DEFAULT_VIDEO_SOURCE.to_string()
}

#[tauri::command]
fn scan_video_files(source: String, root: String) -> Result<VideoScanResult, String> {
    let source_dir = PathBuf::from(source);
    let root = PathBuf::from(root);
    if !source_dir.is_dir() {
        return Err(format!("视频目录不存在：{}", path_text(&source_dir)));
    }
    if !root.is_dir() {
        return Err(format!("产品根目录不存在：{}", path_text(&root)));
    }
    let directories = direct_product_directories(&root);
    let mut paths = Vec::new();
    collect_video_files(&source_dir, &mut paths);
    paths.sort_by(|left, right| {
        let left_time = fs::metadata(left)
            .and_then(|metadata| metadata.modified())
            .unwrap_or(UNIX_EPOCH);
        let right_time = fs::metadata(right)
            .and_then(|metadata| metadata.modified())
            .unwrap_or(UNIX_EPOCH);
        right_time.cmp(&left_time).then_with(|| {
            left.to_string_lossy()
                .to_lowercase()
                .cmp(&right.to_string_lossy().to_lowercase())
        })
    });
    let mut skipped_processed = 0;
    let mut files = Vec::new();
    for path in &paths {
        let item = video_match_for_path(path, &directories);
        if video_outputs_exist(&item) {
            skipped_processed += 1;
            continue;
        }
        files.push(item);
    }
    let matched = files
        .iter()
        .filter(|item| item.product_folder.is_some())
        .count();
    let logs = vec![format!(
        "扫描完成：发现 {} 个视频，唯一匹配 {} 个，待人工确认 {} 个，已忽略已处理 {} 个（源文件保留）",
        files.len() + skipped_processed,
        matched,
        files.len().saturating_sub(matched),
        skipped_processed,
    )];
    Ok(VideoScanResult {
        source_dir: path_text(&source_dir),
        files,
        skipped_processed,
        logs,
    })
}

fn resolve_video_tool(configured: &str, command_name: &str) -> Result<PathBuf, String> {
    if !configured.trim().is_empty() {
        let path = PathBuf::from(configured.trim());
        if path.is_file() {
            return Ok(path);
        }
        return Err(format!("找不到可执行文件：{}", path_text(&path)));
    }
    let mut command = Command::new("where.exe");
    suppress_console_window(&mut command);
    let result = command.arg(command_name).output();
    let Ok(result) = result else {
        return Err(format!("未找到 {command_name}，请在设置中选择可执行文件"));
    };
    if !result.status.success() {
        return Err(format!("未找到 {command_name}，请在设置中选择可执行文件"));
    }
    let path = String::from_utf8_lossy(&result.stdout)
        .lines()
        .next()
        .unwrap_or_default()
        .trim()
        .to_string();
    if path.is_empty() {
        Err(format!("未找到 {command_name}，请在设置中选择可执行文件"))
    } else {
        Ok(PathBuf::from(path))
    }
}

#[tauri::command]
fn process_video_files(
    root: String,
    files: Vec<VideoMatch>,
    ffmpeg_path: String,
    gifsicle_path: String,
    fps: u32,
    scale: u32,
    lossy: u32,
    threads: u32,
) -> Result<VideoProcessResult, String> {
    let root = PathBuf::from(root);
    if !root.is_dir() {
        return Err(format!("产品根目录不存在：{}", path_text(&root)));
    }
    if fps == 0 || scale == 0 || threads == 0 {
        return Err("FPS、缩放倍数和线程数必须大于 0".to_string());
    }
    if lossy > 200 {
        return Err("Gifsicle 压缩程度必须在 0 到 200 之间".to_string());
    }
    let ffmpeg = resolve_video_tool(&ffmpeg_path, "ffmpeg")?;
    let gifsicle = resolve_video_tool(&gifsicle_path, "gifsicle")?;
    let mut result = VideoProcessResult {
        files: Vec::new(),
        converted: 0,
        copied: 0,
        failed: 0,
        logs: Vec::new(),
    };
    let filter = format!(
        "fps={fps},scale=iw/{scale}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"
    );
    for mut item in files {
        let source = PathBuf::from(&item.source_path);
        let Some(product_text) = item.product_folder.clone() else {
            item.status = "跳过：未匹配产品".to_string();
            result.failed += 1;
            result
                .logs
                .push(format!("跳过 {}：未匹配唯一产品目录", item.file_name));
            result.files.push(item);
            continue;
        };
        let product = PathBuf::from(product_text);
        if !source.is_file()
            || !is_video_file(&source)
            || !product.is_dir()
            || !product.starts_with(&root)
        {
            item.status = "失败：路径无效".to_string();
            result.failed += 1;
            result
                .logs
                .push(format!("失败 {}：视频或产品目录路径无效", item.file_name));
            result.files.push(item);
            continue;
        }
        if video_outputs_exist(&item) {
            item.status = "跳过：产品已有视频和动图".to_string();
            result.logs.push(format!(
                "跳过 {}：产品目录已有视频和动图文件",
                item.file_name
            ));
            result.files.push(item);
            continue;
        }
        let pack = product.join("套图");
        let video_dir = pack.join("视频");
        let gif_dir = pack.join("动图");
        if let Err(error) =
            fs::create_dir_all(&video_dir).and_then(|_| fs::create_dir_all(&gif_dir))
        {
            item.status = "失败：无法创建输出目录".to_string();
            result.failed += 1;
            result
                .logs
                .push(format!("失败 {}：{error}", item.file_name));
            result.files.push(item);
            continue;
        }
        let video_target = video_dir.join(&item.file_name);
        if let Err(error) = fs::copy(&source, &video_target) {
            item.status = "失败：视频复制失败".to_string();
            result.failed += 1;
            result
                .logs
                .push(format!("失败 {}：复制视频失败：{error}", item.file_name));
            result.files.push(item);
            continue;
        }
        result.copied += 1;
        let stem = source
            .file_stem()
            .and_then(|value| value.to_str())
            .unwrap_or("video");
        let output_gif = gif_dir.join(format!("{stem}.gif"));
        let temporary_gif = std::env::temp_dir().join(format!("plm-video-{}.gif", Uuid::new_v4()));
        let mut ffmpeg_command = Command::new(&ffmpeg);
        suppress_console_window(&mut ffmpeg_command);
        let ffmpeg_status = ffmpeg_command
            .arg("-i")
            .arg(&source)
            .arg("-vf")
            .arg(&filter)
            .arg("-y")
            .arg("-threads")
            .arg(threads.to_string())
            .arg(&temporary_gif)
            .status();
        let ffmpeg_ok = ffmpeg_status
            .map(|status| status.success())
            .unwrap_or(false);
        if !ffmpeg_ok || !temporary_gif.is_file() {
            let _ = fs::remove_file(&temporary_gif);
            item.status = "失败：FFmpeg 转换失败".to_string();
            result.failed += 1;
            result
                .logs
                .push(format!("失败 {}：FFmpeg 转 GIF 失败", item.file_name));
            result.files.push(item);
            continue;
        }
        let mut gifsicle_command = Command::new(&gifsicle);
        suppress_console_window(&mut gifsicle_command);
        let gifsicle_status = gifsicle_command
            .arg("-O2")
            .arg(format!("--lossy={lossy}"))
            .arg(format!("-j{threads}"))
            .arg(&temporary_gif)
            .arg("-o")
            .arg(&output_gif)
            .status();
        let gifsicle_ok = gifsicle_status
            .map(|status| status.success())
            .unwrap_or(false);
        let _ = fs::remove_file(&temporary_gif);
        if !gifsicle_ok || !output_gif.is_file() {
            item.status = "失败：Gifsicle 压缩失败".to_string();
            result.failed += 1;
            result
                .logs
                .push(format!("失败 {}：Gifsicle 压缩 GIF 失败", item.file_name));
            result.files.push(item);
            continue;
        }
        item.status = "已完成".to_string();
        result.converted += 1;
        result.logs.push(format!(
            "完成 {} → 动图/{}.gif，视频已复制到 视频/",
            item.file_name, stem
        ));
        result.files.push(item);
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
    if !overwrite
        && excel_path.exists()
        && sku_image_path.exists()
        && english_path.exists()
        && size_path.exists()
    {
        let _ = app.emit(
            "asset-job",
            json!({"sku":product.sku, "state":"done", "message":"四个目标文件均已存在，已跳过"}),
        );
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
    state
        .inner
        .pending
        .lock()
        .map_err(|_| "无法访问任务队列".to_string())?
        .insert(job_id.clone(), pending);
    let message = json!({
        "type": "excel.generate",
        "jobId": job_id,
        "sku": product.sku,
        "product": product,
        "auto": auto.unwrap_or(false),
        "fileName": excel_path.file_name().and_then(|value| value.to_str()).unwrap_or("PLM产品信息.xlsx"),
        "transparentImageDataUrl": transparent_image_data_url
    });
    let assistant_count = send_json_to_role(&state, BridgeRole::Assistant, &message);
    if assistant_count == 0 {
        state
            .inner
            .pending
            .lock()
            .ok()
            .map(|mut jobs| jobs.remove(&job_id));
        return Err("PLM 悬浮助手尚未连接".to_string());
    }
    let _ = app.emit("asset-job", json!({"sku":product.sku, "state":"queued", "message":"等待悬浮助手生成 Excel、英文参数图和尺寸图"}));
    Ok(job_id)
}

fn organizer_sku(value: &str) -> Option<String> {
    Regex::new(r"(?i)SKU\d+")
        .ok()?
        .find(value)
        .map(|matched| matched.as_str().to_uppercase())
}

fn product_brand_from_name(value: &str) -> String {
    let prefix = Regex::new(r"(?i)SKU\d+")
        .ok()
        .and_then(|pattern| pattern.find(value).map(|matched| &value[..matched.start()]))
        .unwrap_or(value)
        .trim()
        .trim_matches(|character: char| matches!(character, '_' | '-' | '—' | '–'))
        .trim();
    prefix
        .split_whitespace()
        .next()
        .unwrap_or_default()
        .to_string()
}

fn folder_organizer_target(path: &Path) -> Option<(String, PathBuf)> {
    let source_name = path.file_name().and_then(|value| value.to_str())?;
    let pattern = Regex::new(r"(?i)SKU\d+").ok()?;
    let matched = pattern.find(source_name)?;
    let sku = matched.as_str().to_uppercase();
    let prefix = source_name[..matched.start()]
        .trim()
        .trim_matches(|character: char| matches!(character, '_' | '-' | '—' | '–'))
        .trim();
    if prefix.is_empty() {
        return None;
    }
    let target_name = format!("{prefix}-{sku}");
    Some((sku, path.join(target_name)))
}

fn file_organize_item(kind: &str, source: &Path, target: &Path, sku: &str) -> FileOrganizeItem {
    let source_name = source
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_string();
    let target_name = target
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_string();
    let status = if source == target {
        "skipped"
    } else if target.exists() {
        "conflict"
    } else {
        "ready"
    };
    let message = match status {
        "skipped" => "名称已经符合规则".to_string(),
        "conflict" => "目标名称已存在，未加入执行队列".to_string(),
        _ => "等待批量整理".to_string(),
    };
    FileOrganizeItem {
        kind: kind.to_string(),
        source_path: path_text(source),
        target_path: path_text(target),
        source_name,
        target_name,
        sku: sku.to_string(),
        status: status.to_string(),
        message,
    }
}

fn scan_file_organizer_plan(
    root: &Path,
    rename_sku_images: bool,
    rename_product_folders: bool,
) -> Result<FileOrganizeScanResult, String> {
    if !root.is_dir() {
        return Err(format!("工作目录不存在：{}", path_text(root)));
    }
    let mut items = Vec::new();
    for product_folder in direct_product_directories(root) {
        let Some(folder_name) = product_folder.file_name().and_then(|value| value.to_str()) else {
            continue;
        };
        let Some(folder_sku) = organizer_sku(folder_name) else {
            continue;
        };
        if rename_sku_images {
            let source = product_folder.join("SKU.jpg");
            if source.is_file() {
                items.push(file_organize_item(
                    "sku-image",
                    &source,
                    &product_folder.join(format!("{folder_sku}.jpg")),
                    &folder_sku,
                ));
            }
        }
        if rename_product_folders {
            if let Some((sku, target)) = folder_organizer_target(&product_folder) {
                let source = product_folder.join("品牌 产品名-编码");
                if source.is_dir() {
                    items.push(file_organize_item("product-folder", &source, &target, &sku));
                }
            }
        }
    }
    items.sort_by(|left, right| {
        left.source_path
            .to_lowercase()
            .cmp(&right.source_path.to_lowercase())
    });
    Ok(FileOrganizeScanResult {
        root: path_text(root),
        items,
    })
}

#[tauri::command]
fn scan_file_organizer(
    root: String,
    rename_sku_images: bool,
    rename_product_folders: bool,
) -> Result<FileOrganizeScanResult, String> {
    scan_file_organizer_plan(
        &PathBuf::from(root),
        rename_sku_images,
        rename_product_folders,
    )
}

#[tauri::command]
fn organize_files(
    root: String,
    operations: Vec<FileOrganizeOperation>,
) -> Result<FileOrganizeResult, String> {
    let root = PathBuf::from(root);
    if !root.is_dir() {
        return Err(format!("工作目录不存在：{}", path_text(&root)));
    }
    let mut operations = operations;
    operations.sort_by(|left, right| {
        let left_depth = Path::new(&left.source_path).components().count();
        let right_depth = Path::new(&right.source_path).components().count();
        right_depth
            .cmp(&left_depth)
            .then_with(|| left.source_path.cmp(&right.source_path))
    });
    let mut result = FileOrganizeResult {
        logs: Vec::new(),
        renamed: 0,
        skipped: 0,
        failed: 0,
    };
    for operation in operations {
        let source = PathBuf::from(&operation.source_path);
        let target = PathBuf::from(&operation.target_path);
        if !source.starts_with(&root) || !target.starts_with(&root) {
            result.failed += 1;
            result.logs.push(format!(
                "拒绝路径：整理目标必须位于工作目录内（{}）",
                path_text(&source)
            ));
            continue;
        }
        if source == target {
            result.skipped += 1;
            continue;
        }
        let source_metadata = match fs::symlink_metadata(&source) {
            Ok(metadata) => metadata,
            Err(error) => {
                result.failed += 1;
                result.logs.push(format!(
                    "跳过 {}：源文件不存在或无法读取（{error}）",
                    path_text(&source)
                ));
                continue;
            }
        };
        if source_metadata.file_type().is_symlink() {
            result.failed += 1;
            result
                .logs
                .push(format!("跳过 {}：不处理符号链接", path_text(&source)));
            continue;
        }
        if target.exists() {
            result.failed += 1;
            result.logs.push(format!(
                "跳过 {}：目标已存在 {}",
                path_text(&source),
                path_text(&target)
            ));
            continue;
        }
        if target
            .parent()
            .map(|parent| parent.is_dir())
            .unwrap_or(false)
            == false
        {
            result.failed += 1;
            result
                .logs
                .push(format!("跳过 {}：目标目录不存在", path_text(&target)));
            continue;
        }
        match fs::rename(&source, &target) {
            Ok(()) => {
                result.renamed += 1;
                result
                    .logs
                    .push(format!("{} → {}", path_text(&source), path_text(&target)));
            }
            Err(error) => {
                result.failed += 1;
                result
                    .logs
                    .push(format!("重命名失败 {}：{error}", path_text(&source)));
            }
        }
    }
    Ok(result)
}

fn label_check_target_folder_name(value: &str) -> Result<String, String> {
    let name = value.trim();
    if name.is_empty()
        || name == "."
        || name == ".."
        || name
            .chars()
            .any(|character| character == '\\' || character == '/')
    {
        return Err("目标文件夹名称必须是单层目录名，不能包含路径分隔符".to_string());
    }
    Ok(name.to_string())
}

fn label_check_extension(path: &Path) -> String {
    path.extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase()
}

fn label_check_file(path: &Path) -> Option<LabelCheckFile> {
    let metadata = fs::symlink_metadata(path).ok()?;
    if !metadata.is_file() || metadata.file_type().is_symlink() {
        return None;
    }
    let name = path
        .file_name()
        .and_then(|value| value.to_str())?
        .to_string();
    Some(LabelCheckFile {
        name,
        path: path_text(path),
        extension: label_check_extension(path),
        size: metadata.len(),
    })
}

fn is_label_preview_extension(extension: &str) -> bool {
    matches!(extension, "jpg" | "jpeg" | "png")
}

fn is_label_upload_extension(extension: &str) -> bool {
    matches!(
        extension,
        "ai" | "jpg"
            | "jpeg"
            | "png"
            | "psd"
            | "pdf"
            | "cdr"
            | "eps"
            | "svg"
            | "webp"
            | "tif"
            | "tiff"
    )
}

fn is_label_named_file(name: &str) -> bool {
    ["标签", "印刷", "纸盒"]
        .iter()
        .any(|keyword| name.contains(keyword))
}

fn has_paper_box_preview(files: &[LabelCheckFile]) -> bool {
    files
        .iter()
        .any(|file| file.name.contains("纸盒") && is_label_preview_extension(&file.extension))
}

fn collect_label_check_files(
    folder: &Path,
) -> Result<
    (
        Vec<LabelCheckFile>,
        Vec<LabelCheckFile>,
        Vec<LabelCheckFile>,
        Vec<LabelCheckFile>,
    ),
    String,
> {
    let mut preview_images = Vec::new();
    let mut upload_files = Vec::new();
    let mut psd_files = Vec::new();
    let mut other_files = Vec::new();
    let entries = fs::read_dir(folder)
        .map_err(|error| format!("无法读取纸盒标签目录 {}：{error}", path_text(folder)))?;
    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        let Some(file) = label_check_file(&path) else {
            continue;
        };
        // Only files whose names explicitly identify 标签、印刷或纸盒 are part of
        // this workflow. Generic layer exports such as 图层1.png are ignored.
        if !is_label_named_file(&file.name) {
            continue;
        }
        if file.extension == "psd" && file.name.contains("印刷") {
            psd_files.push(file);
        } else if is_label_upload_extension(&file.extension) {
            if is_label_preview_extension(&file.extension) {
                preview_images.push(file.clone());
            }
            upload_files.push(file);
        } else {
            other_files.push(file);
        }
    }
    let file_sort = |left: &LabelCheckFile, right: &LabelCheckFile| {
        left.name.to_lowercase().cmp(&right.name.to_lowercase())
    };
    preview_images.sort_by(file_sort);
    upload_files.sort_by(file_sort);
    psd_files.sort_by(file_sort);
    other_files.sort_by(file_sort);
    Ok((preview_images, upload_files, psd_files, other_files))
}

fn label_staging_folder(
    product_folder: &Path,
    sku: &str,
    target_folder_name: &str,
) -> Option<PathBuf> {
    let expected_name = folder_organizer_target(product_folder).and_then(|(_, path)| {
        path.file_name()
            .and_then(|value| value.to_str())
            .map(str::to_string)
    });
    let mut fallback = Vec::new();
    let entries = fs::read_dir(product_folder).ok()?;
    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        if !file_type.is_dir() || file_type.is_symlink() {
            continue;
        }
        let name = path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default();
        if name.eq_ignore_ascii_case(target_folder_name) {
            continue;
        }
        if expected_name
            .as_deref()
            .is_some_and(|expected| name.eq_ignore_ascii_case(expected))
        {
            return Some(path);
        }
        if organizer_sku(name).as_deref() == Some(sku) {
            fallback.push(path);
        }
    }
    fallback.sort_by_key(|path| {
        path.file_name()
            .map(|value| value.to_string_lossy().to_lowercase())
            .unwrap_or_default()
    });
    fallback.into_iter().next()
}

fn is_label_archive_folder_name(name: &str, requested: &str) -> bool {
    name.eq_ignore_ascii_case(requested)
        || (name.starts_with("03") && name.contains("纸盒") && name.contains("标签"))
}

fn label_archive_folder(source: &Path, requested: &str) -> PathBuf {
    let Ok(entries) = fs::read_dir(source) else {
        return source.join(requested);
    };
    let mut candidates = entries
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let path = entry.path();
            let file_type = entry.file_type().ok()?;
            if !file_type.is_dir() || file_type.is_symlink() {
                return None;
            }
            let name = path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or_default();
            is_label_archive_folder_name(name, requested).then_some(path)
        })
        .collect::<Vec<_>>();
    candidates.sort_by_key(|path| {
        let name = path
            .file_name()
            .map(|value| value.to_string_lossy().to_lowercase())
            .unwrap_or_default();
        (
            if name.eq_ignore_ascii_case(requested) {
                0
            } else {
                1
            },
            name,
        )
    });
    candidates
        .into_iter()
        .next()
        .unwrap_or_else(|| source.join(requested))
}

fn build_label_check_item(
    product_folder: &Path,
    source: &Path,
    target_folder_name: &str,
    sku: &str,
) -> Result<LabelCheckItem, String> {
    let product_name = product_folder
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_string();
    let source_name = source
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_string();
    let target = label_archive_folder(source, target_folder_name);
    let (preview_images, upload_files, psd_files, other_files) = collect_label_check_files(source)?;
    let upload_conflict = upload_files
        .iter()
        .any(|file| target.join(&file.name).exists());
    let psd_conflict = psd_files
        .iter()
        .any(|file| product_folder.join(&file.name).exists());
    let status = if upload_files.is_empty() {
        "missing-upload"
    } else if !has_paper_box_preview(&preview_images) {
        "missing-preview"
    } else if upload_conflict || psd_conflict {
        "conflict"
    } else {
        "ready"
    };
    let message = match status {
        "missing-upload" => "没有识别到可上传文件（AI/JPG/PNG/纸盒 PSD 等）".to_string(),
        "missing-preview" => "缺少纸盒 JPG/PNG 预览图，暂不展示或确认".to_string(),
        "conflict" => "目标位置已有同名文件，确认前请先处理冲突".to_string(),
        _ if !other_files.is_empty() => format!(
            "可确认；有 {} 个未识别文件会留在暂存目录",
            other_files.len()
        ),
        _ => "等待查看预览后确认".to_string(),
    };
    Ok(LabelCheckItem {
        sku: sku.to_string(),
        brand: product_brand_from_name(&product_name),
        product_name,
        product_path: path_text(product_folder),
        source_path: path_text(source),
        source_name,
        target_path: path_text(&target),
        preview_images,
        upload_files,
        psd_files,
        other_files,
        status: status.to_string(),
        message,
    })
}

fn build_confirmed_label_check_item(record: &LabelCheckRecord) -> Option<LabelCheckItem> {
    let product_folder = PathBuf::from(&record.product_path);
    let target = PathBuf::from(&record.target_path);
    if !product_folder.is_dir() || !target.is_dir() {
        return None;
    }
    // The 03 folder is the archive/preview source.  The folder handed to the
    // cloud-drive app must remain the original entry/staging folder so its
    // sibling files and subdirectories travel with it.
    let upload_folder = {
        let recorded_source = PathBuf::from(&record.source_path);
        if recorded_source.is_dir() {
            recorded_source
        } else {
            target.clone()
        }
    };
    let (preview_images, upload_files, mut psd_files, other_files) =
        collect_label_check_files(&target).ok()?;
    if !has_paper_box_preview(&preview_images) {
        return None;
    }
    for file_name in &record.moved_psd_files {
        let path = product_folder.join(file_name);
        if let Some(file) = label_check_file(&path) {
            psd_files.push(file);
        }
    }
    psd_files.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    let product_name = record.product_name.clone();
    let source_name = upload_folder
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_string();
    Some(LabelCheckItem {
        sku: record.sku.clone(),
        brand: if record.brand.trim().is_empty() {
            product_brand_from_name(&product_name)
        } else {
            record.brand.clone()
        },
        product_name,
        product_path: path_text(&product_folder),
        source_path: path_text(&upload_folder),
        source_name,
        target_path: path_text(&target),
        preview_images,
        upload_files,
        psd_files,
        other_files,
        status: "confirmed".to_string(),
        message: format!(
            "已确认并归档于 {}；拖动卡片可直接把入口文件夹及其内部文件交给网盘应用",
            path_text(&target)
        ),
    })
}

fn read_label_check_history(path: &Path) -> Result<Vec<LabelCheckRecord>, String> {
    if !path.is_file() {
        return Ok(Vec::new());
    }
    let bytes = fs::read(path).map_err(|error| format!("无法读取纸盒标签确认记录：{error}"))?;
    serde_json::from_slice(&bytes).map_err(|error| format!("纸盒标签确认记录格式无效：{error}"))
}

fn write_label_check_history(path: &Path, records: &[LabelCheckRecord]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("无法创建确认记录目录：{error}"))?;
    }
    let text = serde_json::to_string_pretty(records)
        .map_err(|error| format!("无法生成确认记录：{error}"))?;
    fs::write(path, text).map_err(|error| format!("无法保存纸盒标签确认记录：{error}"))
}

fn label_check_now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis() as u64)
        .unwrap_or_default()
}

fn sort_label_check_records(records: &mut [LabelCheckRecord]) {
    records.sort_by(|left, right| {
        right
            .confirmed_at_ms
            .cmp(&left.confirmed_at_ms)
            .then_with(|| left.sku.cmp(&right.sku))
    });
}

fn scan_label_check_plan(
    root: &Path,
    target_folder_name: &str,
    history_path: &Path,
) -> Result<LabelCheckScanResult, String> {
    let target_folder_name = label_check_target_folder_name(target_folder_name)?;
    if !root.is_dir() {
        return Err(format!("工作目录不存在：{}", path_text(root)));
    }
    let mut history = read_label_check_history(history_path)?;
    sort_label_check_records(&mut history);
    let mut pending = Vec::new();
    for product_folder in direct_product_directories(root) {
        let Some(folder_name) = product_folder.file_name().and_then(|value| value.to_str()) else {
            continue;
        };
        let Some(sku) = organizer_sku(folder_name) else {
            continue;
        };
        let Some(source) = label_staging_folder(&product_folder, &sku, &target_folder_name) else {
            continue;
        };
        let item = build_label_check_item(&product_folder, &source, &target_folder_name, &sku)?;
        if !has_paper_box_preview(&item.preview_images) {
            continue;
        }
        let already_confirmed = history
            .iter()
            .any(|record| record.product_path == path_text(&product_folder) && record.sku == sku);
        if already_confirmed && item.upload_files.is_empty() && item.psd_files.is_empty() {
            continue;
        }
        if item.upload_files.is_empty() && item.psd_files.is_empty() && item.other_files.is_empty()
        {
            continue;
        }
        pending.push(item);
    }
    pending.sort_by(|left, right| {
        left.sku
            .cmp(&right.sku)
            .then_with(|| left.product_path.cmp(&right.product_path))
    });
    let root_text = path_text(root);
    history.retain(|record| Path::new(&record.product_path).starts_with(root));
    let confirmed_items = history
        .iter()
        .filter_map(build_confirmed_label_check_item)
        .collect::<Vec<_>>();
    let mut logs = vec![format!(
        "扫描完成：待检查 {} 个，已确认 {} 个",
        pending.len(),
        history.len()
    )];
    logs.push(format!("确认记录保存位置：{}", path_text(history_path)));
    Ok(LabelCheckScanResult {
        root: root_text,
        target_folder_name,
        history_path: path_text(history_path),
        pending,
        confirmed: history,
        confirmed_items,
        logs,
    })
}

fn rollback_label_moves(moves: &[(PathBuf, PathBuf)]) {
    for (source, target) in moves.iter().rev() {
        let _ = fs::rename(target, source);
    }
}

fn confirm_label_check_at(
    root: &Path,
    target_folder_name: &str,
    source: &Path,
    sku: &str,
    history_path: &Path,
) -> Result<LabelCheckConfirmResult, String> {
    let target_folder_name = label_check_target_folder_name(target_folder_name)?;
    if !root.is_dir() {
        return Err(format!("工作目录不存在：{}", path_text(root)));
    }
    if !source.is_dir() {
        return Err("纸盒标签暂存目录不存在或不是文件夹".to_string());
    }
    let Some(product_folder) = source.parent() else {
        return Err("无法识别产品目录".to_string());
    };
    if product_folder.parent() != Some(root) || !product_folder.is_dir() {
        return Err("纸盒标签暂存目录必须位于工作目录下的直接产品目录中".to_string());
    }
    let source_name = source
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
    let expected_sku = sku.to_uppercase();
    if source_name.eq_ignore_ascii_case(&target_folder_name)
        || organizer_sku(source_name).as_deref() != Some(expected_sku.as_str())
    {
        return Err("确认请求中的产品目录与 SKU 不匹配".to_string());
    }
    let item = build_label_check_item(product_folder, source, &target_folder_name, &expected_sku)?;
    if item.status != "ready" {
        return Err(item.message);
    }
    let target = label_archive_folder(source, &target_folder_name);
    let target_was_present = target.exists();
    if target_was_present && !target.is_dir() {
        return Err(format!("目标路径不是文件夹：{}", path_text(&target)));
    }
    fs::create_dir_all(&target)
        .map_err(|error| format!("无法创建目标文件夹 {}：{error}", path_text(&target)))?;
    let mut moves = Vec::new();
    let mut moved_files = Vec::new();
    let mut moved_psd_files = Vec::new();
    for file in &item.upload_files {
        let source_file = PathBuf::from(&file.path);
        let target_file = target.join(&file.name);
        if let Err(error) = fs::rename(&source_file, &target_file) {
            rollback_label_moves(&moves);
            if !target_was_present {
                let _ = fs::remove_dir(&target);
            }
            return Err(format!("移动 {} 失败：{error}", file.name));
        }
        moves.push((source_file, target_file));
        moved_files.push(file.name.clone());
    }
    for file in &item.psd_files {
        let source_file = PathBuf::from(&file.path);
        let target_file = product_folder.join(&file.name);
        if let Err(error) = fs::rename(&source_file, &target_file) {
            rollback_label_moves(&moves);
            if !target_was_present {
                let _ = fs::remove_dir(&target);
            }
            return Err(format!("移动 PSD 副产品 {} 失败：{error}", file.name));
        }
        moves.push((source_file, target_file));
        moved_psd_files.push(file.name.clone());
    }
    let record = LabelCheckRecord {
        sku: expected_sku,
        brand: item.brand,
        product_name: item.product_name,
        product_path: item.product_path,
        source_path: item.source_path,
        target_path: item.target_path,
        confirmed_at_ms: label_check_now_ms(),
        moved_files,
        moved_psd_files,
    };
    let mut history = match read_label_check_history(history_path) {
        Ok(history) => history,
        Err(error) => {
            rollback_label_moves(&moves);
            if !target_was_present {
                let _ = fs::remove_dir(&target);
            }
            return Err(error);
        }
    };
    history.retain(|old| !(old.product_path == record.product_path && old.sku == record.sku));
    history.push(record.clone());
    sort_label_check_records(&mut history);
    if let Err(error) = write_label_check_history(history_path, &history) {
        rollback_label_moves(&moves);
        if !target_was_present {
            let _ = fs::remove_dir(&target);
        }
        return Err(error);
    }
    let mut logs = vec![format!(
        "已确认 {}：{} 个文件已移入 {}",
        record.sku,
        record.moved_files.len(),
        path_text(&target)
    )];
    if !record.moved_psd_files.is_empty() {
        logs.push(format!(
            "{} 个 PSD 副产品已移回产品根目录",
            record.moved_psd_files.len()
        ));
    }
    if !item.other_files.is_empty() {
        logs.push(format!(
            "有 {} 个未识别文件留在暂存目录",
            item.other_files.len()
        ));
    }
    Ok(LabelCheckConfirmResult { record, logs })
}

#[tauri::command]
fn scan_label_check(
    root: String,
    target_folder_name: String,
) -> Result<LabelCheckScanResult, String> {
    scan_label_check_plan(
        &PathBuf::from(root),
        &target_folder_name,
        &label_check_history_path(),
    )
}

#[tauri::command]
fn confirm_label_check(
    root: String,
    target_folder_name: String,
    source_path: String,
    sku: String,
) -> Result<LabelCheckConfirmResult, String> {
    confirm_label_check_at(
        &PathBuf::from(root),
        &target_folder_name,
        &PathBuf::from(source_path),
        &sku,
        &label_check_history_path(),
    )
}

#[tauri::command]
fn open_local_folder(path: String) -> Result<(), String> {
    let folder = PathBuf::from(path);
    if !folder.is_dir() {
        return Err(format!("文件夹不存在：{}", path_text(&folder)));
    }
    #[cfg(target_os = "windows")]
    let result = std::process::Command::new("explorer.exe")
        .arg(&folder)
        .spawn();
    #[cfg(target_os = "macos")]
    let result = std::process::Command::new("open").arg(&folder).spawn();
    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    let result = std::process::Command::new("xdg-open").arg(&folder).spawn();
    result
        .map(|_| ())
        .map_err(|error| format!("无法打开文件夹 {}：{error}", path_text(&folder)))
}

#[derive(Clone)]
struct RankedParameterSampleFile {
    path: PathBuf,
    rank: u16,
    modified_ms: u128,
}

fn collect_parameter_product_directories(folder: &Path, depth: usize, output: &mut Vec<PathBuf>) {
    if depth > 3 {
        return;
    }
    let Ok(entries) = fs::read_dir(folder) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(metadata) = fs::symlink_metadata(&path) else {
            continue;
        };
        if !metadata.is_dir() || metadata.file_type().is_symlink() {
            continue;
        }
        let name = path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default();
        if name.starts_with('.')
            || matches!(
                name.to_ascii_lowercase().as_str(),
                "node_modules" | "target"
            )
        {
            continue;
        }
        let mut has_transparent = false;
        let mut has_pack = false;
        let mut has_label_sections = false;
        if let Ok(children) = fs::read_dir(&path) {
            for child in children.flatten() {
                let child_path = child.path();
                let child_name = child_path
                    .file_name()
                    .and_then(|value| value.to_str())
                    .unwrap_or_default();
                if child_path.is_file()
                    && child_path
                        .extension()
                        .and_then(|value| value.to_str())
                        .map(|value| value.eq_ignore_ascii_case("png"))
                        .unwrap_or(false)
                {
                    let stem = child_path
                        .file_stem()
                        .and_then(|value| value.to_str())
                        .unwrap_or_default()
                        .to_lowercase();
                    if stem.contains("透明")
                        || stem.contains("transparent")
                        || stem.contains("抠图")
                    {
                        has_transparent = true;
                    }
                } else if child_path.is_dir() {
                    if child_name == "套图" {
                        has_pack = true;
                    }
                    if child_name.starts_with("03 纸盒标签")
                        || child_name.starts_with("04 主图及详情页")
                    {
                        has_label_sections = true;
                    }
                }
            }
        }
        let name_has_sku = organizer_sku(name).is_some();
        if has_transparent || has_pack || (name_has_sku && !has_label_sections) {
            output.push(path);
        } else if has_label_sections
            || name.starts_with("03 纸盒标签")
            || name.starts_with("04 主图及详情页")
        {
            continue;
        } else {
            collect_parameter_product_directories(&path, depth + 1, output);
        }
    }
}

fn collect_parameter_sample_files(folder: &Path, depth: usize, output: &mut Vec<PathBuf>) {
    if depth > 7 {
        return;
    }
    let Ok(entries) = fs::read_dir(folder) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(metadata) = fs::symlink_metadata(&path) else {
            continue;
        };
        if metadata.file_type().is_symlink() {
            continue;
        }
        if metadata.is_dir() {
            let name = path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or_default();
            if !name.starts_with('.')
                && !matches!(
                    name.to_ascii_lowercase().as_str(),
                    "node_modules" | "target"
                )
            {
                collect_parameter_sample_files(&path, depth + 1, output);
            }
        } else if metadata.is_file() {
            output.push(path);
        }
    }
}

fn png_has_alpha_channel(path: &Path) -> bool {
    let Ok(mut file) = fs::File::open(path) else {
        return false;
    };
    let mut bytes = vec![0_u8; 256 * 1024];
    let Ok(length) = file.read(&mut bytes) else {
        return false;
    };
    bytes.truncate(length);
    if bytes.len() < 26 || bytes[..8] != [137, 80, 78, 71, 13, 10, 26, 10] {
        return false;
    }
    matches!(bytes[25], 4 | 6) || bytes.windows(4).any(|chunk| chunk == b"tRNS")
}

fn is_transparent_placeholder(path: &Path) -> bool {
    if fs::metadata(path).is_ok_and(|metadata| metadata.len() == 90_899) {
        return true;
    }
    let Ok(image) = image::open(path).map(|value| value.to_rgba8()) else {
        return false;
    };
    let (width, height) = image.dimensions();
    if width < 80 || height < 80 {
        return false;
    }
    let mut opaque = 0_usize;
    let mut black = 0_usize;
    let mut orange = 0_usize;
    let mut min_x = width;
    let mut min_y = height;
    let mut max_x = 0_u32;
    let mut max_y = 0_u32;
    for (x, y, pixel) in image.enumerate_pixels() {
        let [red, green, blue, alpha] = pixel.0;
        if alpha <= 32 {
            continue;
        }
        opaque += 1;
        min_x = min_x.min(x);
        min_y = min_y.min(y);
        max_x = max_x.max(x);
        max_y = max_y.max(y);
        if red < 55 && green < 55 && blue < 55 {
            black += 1;
        }
        if red > 180 && green > 100 && green < 230 && blue < 190 {
            orange += 1;
        }
    }
    if opaque == 0 || min_x > max_x || min_y > max_y {
        return false;
    }
    let bounds_area = ((max_x - min_x + 1) as usize) * ((max_y - min_y + 1) as usize);
    let opaque_ratio = opaque as f32 / bounds_area.max(1) as f32;
    let canvas_opaque_ratio = opaque as f32 / (width as usize * height as usize).max(1) as f32;
    let black_ratio = black as f32 / opaque as f32;
    let orange_ratio = orange as f32 / opaque as f32;
    let bounds_width = max_x - min_x + 1;
    let bounds_height = max_y - min_y + 1;
    let bounds_aspect = bounds_width as f32 / bounds_height.max(1) as f32;
    let flat_orange_text = orange_ratio > 0.88
        && (0.025..0.28).contains(&canvas_opaque_ratio)
        && (0.25..0.78).contains(&opaque_ratio)
        && bounds_aspect > 1.45
        && (bounds_width as f32 / width as f32) > 0.35
        && (bounds_height as f32 / height as f32) < 0.62;
    let black_orange_badge = opaque_ratio > 0.72
        && black_ratio > 0.24
        && orange_ratio > 0.12
        && black_ratio + orange_ratio > 0.72;
    flat_orange_text || black_orange_badge
}

fn parameter_sample_relative_text(folder: &Path, path: &Path) -> String {
    path.strip_prefix(folder)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
        .to_lowercase()
}

fn infer_parameter_sample_sku(folder: &Path, files: &[PathBuf]) -> String {
    if let Some(name) = folder.file_name().and_then(|value| value.to_str()) {
        if let Some(sku) = organizer_sku(name) {
            return sku;
        }
    }
    let mut candidates = files
        .iter()
        .filter_map(|path| {
            let relative = parameter_sample_relative_text(folder, path);
            let sku = organizer_sku(&relative)?;
            let extension = path
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_ascii_lowercase();
            let rank = if matches!(extension.as_str(), "xlsx" | "xls") {
                0
            } else if relative.contains("产品参数图/") || relative.contains("尺寸图") {
                1
            } else {
                2
            };
            Some((rank, sku, file_modified_ms(path)))
        })
        .collect::<Vec<_>>();
    candidates.sort_by(|left, right| {
        left.0
            .cmp(&right.0)
            .then_with(|| right.2.cmp(&left.2))
            .then_with(|| left.1.cmp(&right.1))
    });
    candidates
        .first()
        .map(|item| item.1.clone())
        .unwrap_or_default()
}

fn choose_parameter_sample_file(
    mut files: Vec<RankedParameterSampleFile>,
) -> (Option<PathBuf>, bool, usize) {
    let count = files.len();
    files.sort_by(|left, right| {
        left.rank
            .cmp(&right.rank)
            .then_with(|| right.modified_ms.cmp(&left.modified_ms))
            .then_with(|| left.path.cmp(&right.path))
    });
    let ambiguous = files.len() > 1 && files[0].rank == files[1].rank;
    (
        files.first().map(|item| item.path.clone()),
        ambiguous,
        count,
    )
}

fn parameter_sample_candidates(
    folder: &Path,
    sku: &str,
    files: &[PathBuf],
) -> (
    Vec<RankedParameterSampleFile>,
    Vec<RankedParameterSampleFile>,
    Vec<RankedParameterSampleFile>,
    usize,
) {
    let mut transparent = Vec::new();
    let mut parameter = Vec::new();
    let mut excel = Vec::new();
    let mut transparent_placeholders = 0_usize;
    for path in files {
        let extension = path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_ascii_lowercase();
        let stem = path
            .file_stem()
            .and_then(|value| value.to_str())
            .unwrap_or_default();
        let stem_lower = stem.to_lowercase();
        let relative = parameter_sample_relative_text(folder, path);
        let modified_ms = file_modified_ms(path);
        if extension == "png" {
            let alpha_penalty = if png_has_alpha_channel(path) { 0 } else { 20 };
            let name_rank = if stem == "透明" {
                Some(0)
            } else if stem.starts_with("透明") {
                Some(1)
            } else if stem.contains("透明") {
                Some(2)
            } else if stem_lower.contains("transparent") {
                Some(3)
            } else if stem.contains("抠图") {
                Some(4)
            } else {
                None
            };
            if let Some(rank) = name_rank {
                if is_transparent_placeholder(path) {
                    transparent_placeholders += 1;
                } else {
                    transparent.push(RankedParameterSampleFile {
                        path: path.clone(),
                        rank: rank + alpha_penalty,
                        modified_ms,
                    });
                }
            }
        }
        if matches!(extension.as_str(), "jpg" | "jpeg" | "png" | "webp")
            && !relative.contains("英文参数图")
        {
            let rank = if relative.contains("/产品参数图/") && stem == "尺寸" {
                Some(0)
            } else if relative.contains("/产品参数图/") && stem.contains("尺寸") {
                Some(1)
            } else if stem == "尺寸" {
                Some(2)
            } else if stem.contains("尺寸图") || stem.contains("尺寸") {
                Some(3)
            } else if stem.contains("产品参数") {
                Some(4)
            } else {
                None
            };
            if let Some(rank) = rank {
                parameter.push(RankedParameterSampleFile {
                    path: path.clone(),
                    rank,
                    modified_ms,
                });
            }
        }
        if matches!(extension.as_str(), "xlsx" | "xls") && !stem.starts_with("~$") {
            let has_sku = !sku.is_empty() && stem.to_ascii_uppercase().contains(sku);
            let in_pack = relative.contains("套图/") || relative.starts_with("套图/");
            let rank = match (has_sku, in_pack, extension.as_str()) {
                (true, true, "xlsx") => 0,
                (true, _, "xlsx") => 1,
                (_, true, "xlsx") => 2,
                (_, _, "xlsx") => 3,
                _ => 4,
            };
            excel.push(RankedParameterSampleFile {
                path: path.clone(),
                rank,
                modified_ms,
            });
        }
    }
    (transparent, parameter, excel, transparent_placeholders)
}

fn scan_parameter_samples_plan(root: &Path) -> Result<ParameterSampleScanResult, String> {
    if !root.is_dir() {
        return Err(format!("工作目录不存在：{}", path_text(root)));
    }
    let mut product_folders = Vec::new();
    collect_parameter_product_directories(root, 0, &mut product_folders);
    product_folders.sort();
    product_folders.dedup();
    let mut items = Vec::new();
    let mut logs = vec![format!("扫描到 {} 个产品根目录", product_folders.len())];
    for folder in product_folders {
        let product_name = folder
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_string();
        let mut files = Vec::new();
        collect_parameter_sample_files(&folder, 0, &mut files);
        let sku = infer_parameter_sample_sku(&folder, &files);
        let (transparent_files, parameter_files, excel_files, transparent_placeholders) =
            parameter_sample_candidates(&folder, &sku, &files);
        let (transparent_path, transparent_ambiguous, transparent_candidates) =
            choose_parameter_sample_file(transparent_files);
        let (parameter_path, parameter_ambiguous, parameter_candidates) =
            choose_parameter_sample_file(parameter_files);
        let (excel_path, excel_ambiguous, excel_candidates) =
            choose_parameter_sample_file(excel_files);
        let transparent_has_alpha = transparent_path
            .as_ref()
            .map(|path| png_has_alpha_channel(path))
            .unwrap_or(false);
        let mut missing = Vec::new();
        if sku.is_empty() {
            missing.push("SKU");
        }
        if transparent_path.is_none() {
            missing.push(if transparent_placeholders > 0 {
                "透明 PNG（已排除占位图）"
            } else {
                "透明 PNG"
            });
        }
        if parameter_path.is_none() {
            missing.push("正确尺寸图");
        }
        if excel_path.is_none() {
            missing.push("Excel");
        }
        if transparent_path.is_some() && !transparent_has_alpha {
            missing.push("透明通道");
        }
        let ambiguous = transparent_ambiguous || parameter_ambiguous || excel_ambiguous;
        let status = if ambiguous {
            "ambiguous"
        } else if missing.is_empty() {
            "ready"
        } else {
            "missing"
        };
        let message = if ambiguous {
            "存在同优先级候选，已暂选最新文件，请核对".to_string()
        } else if missing.is_empty() {
            "透明图、正确尺寸图和 Excel 已自动配对".to_string()
        } else {
            format!("缺少：{}", missing.join("、"))
        };
        if status != "ready" {
            logs.push(format!(
                "{} {}：{}",
                if sku.is_empty() {
                    "未识别 SKU"
                } else {
                    &sku
                },
                product_name,
                message
            ));
        }
        if transparent_placeholders > 0 {
            logs.push(format!(
                "{} {}：已排除 {} 个“透明”占位图",
                if sku.is_empty() {
                    "未识别 SKU"
                } else {
                    &sku
                },
                product_name,
                transparent_placeholders
            ));
        }
        items.push(ParameterSampleItem {
            sku,
            product_name,
            product_path: path_text(&folder),
            transparent_path: transparent_path.as_ref().map(|path| path_text(path)),
            parameter_path: parameter_path.as_ref().map(|path| path_text(path)),
            excel_path: excel_path.as_ref().map(|path| path_text(path)),
            transparent_has_alpha,
            transparent_candidates,
            transparent_placeholders,
            parameter_candidates,
            excel_candidates,
            status: status.to_string(),
            message,
        });
    }
    items.sort_by(|left, right| {
        left.sku
            .cmp(&right.sku)
            .then_with(|| left.product_path.cmp(&right.product_path))
    });
    let ready = items.iter().filter(|item| item.status == "ready").count();
    let ambiguous = items
        .iter()
        .filter(|item| item.status == "ambiguous")
        .count();
    let incomplete = items.len().saturating_sub(ready + ambiguous);
    let index_path = root.join("参数图学习样本索引.json");
    let generated_at_ms = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or_default();
    let index = json!({
        "schemaVersion": 1,
        "generatedAtMs": generated_at_ms,
        "root": path_text(root),
        "matching": "product-folder-sku",
        "categoryUsed": false,
        "samples": &items,
    });
    let bytes = serde_json::to_vec_pretty(&index)
        .map_err(|error| format!("无法生成参数图样本索引：{error}"))?;
    fs::write(&index_path, bytes)
        .map_err(|error| format!("无法保存参数图样本索引 {}：{error}", path_text(&index_path)))?;
    logs.insert(
        1,
        format!(
            "完整样本 {} 组；待补全 {} 组；需核对 {} 组",
            ready, incomplete, ambiguous
        ),
    );
    logs.push(format!("样本索引已保存：{}", path_text(&index_path)));
    Ok(ParameterSampleScanResult {
        root: path_text(root),
        index_path: path_text(&index_path),
        items,
        ready,
        incomplete,
        ambiguous,
        logs,
    })
}

#[tauri::command]
fn scan_parameter_samples(root: String) -> Result<ParameterSampleScanResult, String> {
    scan_parameter_samples_plan(&PathBuf::from(root))
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
    items.sort_by_key(|path| {
        path.file_name()
            .map(|value| value.to_string_lossy().to_lowercase())
            .unwrap_or_default()
    });
    items
}

fn build_preview(
    directories: &[PathBuf],
    mappings: &HashMap<String, String>,
    product: FinalizedProduct,
) -> ProductPreview {
    let sku = product.sku.to_uppercase();
    let sku_matches = directories
        .iter()
        .filter(|path| {
            path.file_name()
                .map(|value| value.to_string_lossy().to_uppercase().contains(&sku))
                .unwrap_or(false)
        })
        .cloned()
        .collect::<Vec<_>>();
    let product_name_key = normalize_folder_match_text(&product.name);
    let name_matches = if sku_matches.is_empty() && product_name_key.chars().count() >= 3 {
        directories
            .iter()
            .filter(|path| {
                path.file_name()
                    .map(|value| {
                        normalize_folder_match_text(&value.to_string_lossy())
                            .contains(&product_name_key)
                    })
                    .unwrap_or(false)
            })
            .cloned()
            .collect::<Vec<_>>()
    } else {
        Vec::new()
    };
    let (matches, match_source) = if !sku_matches.is_empty() {
        (sku_matches, "sku")
    } else if !name_matches.is_empty() {
        (name_matches, "product-name")
    } else {
        (Vec::new(), "")
    };
    let mapped = mappings
        .get(&product.sku)
        .map(PathBuf::from)
        .filter(|path| path.is_dir());
    let folder = mapped.clone().or_else(|| {
        if matches.len() == 1 {
            matches.first().cloned()
        } else {
            None
        }
    });
    let transparent = folder
        .as_ref()
        .and_then(|path| find_transparent_image(path));
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
        match_source: if mapped.is_some() {
            "manual".to_string()
        } else {
            match_source.to_string()
        },
        excel_path: folder.as_ref().map(|_| path_text(&excel_path)),
        sku_image_path: folder.as_ref().map(|_| path_text(&sku_image_path)),
        english_path: folder.as_ref().map(|_| path_text(&english_path)),
        size_path: folder.as_ref().map(|_| path_text(&size_path)),
        ambiguous_folders: matches.iter().map(|path| path_text(path)).collect(),
        missing,
    }
}

fn normalize_folder_match_text(value: &str) -> String {
    let sku_pattern = Regex::new(r"(?i)SKU\d{8}").expect("valid SKU regex");
    sku_pattern
        .replace_all(value, "")
        .chars()
        .filter(|character| character.is_alphanumeric())
        .flat_map(char::to_lowercase)
        .collect()
}

fn output_paths(folder: &Path, product: &FinalizedProduct) -> (PathBuf, PathBuf, PathBuf) {
    if folder.as_os_str().is_empty() {
        return (PathBuf::new(), PathBuf::new(), PathBuf::new());
    }
    let base_name = sanitize_component(&format!(
        "{} {} {}",
        product.brand, product.name, product.sku
    ));
    let pack = folder.join("套图");
    (
        pack.join(format!("{base_name}.xlsx")),
        pack.join("英文参数图").join("英文参数图.jpg"),
        pack.join("产品参数图").join("尺寸.jpg"),
    )
}

fn output_sku_image_path(folder: &Path, product: &FinalizedProduct) -> PathBuf {
    if folder.as_os_str().is_empty() {
        return PathBuf::new();
    }
    folder
        .join("套图")
        .join("SKU图")
        .join(format!("{}.jpg", sanitize_component(&product.sku)))
}

fn sanitize_component(value: &str) -> String {
    let invalid = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];
    let replaced = value
        .chars()
        .map(|character| {
            if invalid.contains(&character) || character.is_control() {
                ' '
            } else {
                character
            }
        })
        .collect::<String>();
    let normalized = replaced.split_whitespace().collect::<Vec<_>>().join(" ");
    if normalized.is_empty() {
        "未命名产品".to_string()
    } else {
        normalized
    }
}

fn find_transparent_image(folder: &Path) -> Option<PathBuf> {
    let exact = folder.join("透明.png");
    if exact.is_file() {
        return Some(exact);
    }
    fs::read_dir(folder)
        .ok()?
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .find(|path| {
            path.is_file()
                && path
                    .file_stem()
                    .map(|value| value.to_string_lossy().starts_with("透明"))
                    .unwrap_or(false)
                && matches!(
                    path.extension()
                        .and_then(|value| value.to_str())
                        .unwrap_or_default()
                        .to_lowercase()
                        .as_str(),
                    "png" | "jpg" | "jpeg" | "webp"
                )
        })
}

fn path_text(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_legacy_bridge_clients_as_assistants() {
        assert_eq!(BridgeRole::from_hello(None), BridgeRole::Assistant);
        assert_eq!(
            BridgeRole::from_hello(Some("assistant")),
            BridgeRole::Assistant
        );
        assert_eq!(
            BridgeRole::from_hello(Some("photoshop")),
            BridgeRole::Photoshop
        );
    }

    #[test]
    fn matches_one_product_from_psd_title_without_building_a_snapshot() {
        let products = vec![
            FinalizedProduct {
                sku: "SKU00045440".into(),
                package_code: "MTL00045440".into(),
                ..Default::default()
            },
            FinalizedProduct {
                sku: "SKU00057740".into(),
                package_code: "MTL00057740".into(),
                ..Default::default()
            },
        ];
        let (index, identifier) =
            find_product_by_document_title(&products, "纸盒 3.2x3.2x10cm MTL00057740 AMZ.psd")
                .unwrap();
        assert_eq!(index, 1);
        assert_eq!(identifier.key, "packageCode");
        assert_eq!(identifier.raw, "MTL00057740");
    }

    #[test]
    fn round_trips_copywriting_sections_in_product_snapshot() {
        let product = FinalizedProduct {
            sku: "SKU00045440".into(),
            copywriting: Some(CopywritingSnapshot {
                sections: vec![CopywritingSection {
                    key: "productName".into(),
                    label: "产品名称".into(),
                    text: "PRODUCT NAME:\nRose Nourishing Hand Cream".into(),
                }],
                ..Default::default()
            }),
            ..Default::default()
        };
        let value = serde_json::to_value(&product).unwrap();
        assert_eq!(value["copywriting"]["sections"][0]["key"], "productName");
        assert_eq!(
            value["copywriting"]["sections"][0]["text"],
            "PRODUCT NAME:\nRose Nourishing Hand Cream"
        );
    }

    #[test]
    fn sanitizes_windows_file_name() {
        assert_eq!(
            sanitize_component("West/Month: Cream SKU00000001"),
            "West Month Cream SKU00000001"
        );
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
        assert!(english.ends_with(r"套图\英文参数图\英文参数图.jpg"));
        assert!(size.ends_with(r"套图\产品参数图\尺寸.jpg"));
    }

    #[test]
    fn parses_pack_rules_and_sku() {
        let rules =
            parse_pack_rules("^input-main-prompt-1-.+$|主图1\n^detail-.+$|详情图1").unwrap();
        assert_eq!(rules.len(), 2);
        assert!(rules[0].pattern.is_match("input-main-prompt-1-abc12345"));
        assert_eq!(
            extract_pack_sku("主图_SKU00044974_001.zip").as_deref(),
            Some("SKU00044974")
        );
    }

    #[test]
    fn identifies_missing_detail_slots_for_unmatched_images() {
        let rules = parse_pack_rules(
            "^sale-1-.+$|详情图1\n^sale-2-.+$|详情图2\n^component-.+$|详情图3\n^advantage-1-.+$|详情图4\n^advantage-2-.+$|详情图5\n^details-1-.+$|详情图6\n^details-2-.+$|详情图7\n^efficacy-.+$|详情图8\n^use-.+$|详情图9\n^scene-.+$|详情图10",
        )
        .unwrap();
        let matched = ["详情图3", "详情图5", "详情图10"]
            .into_iter()
            .map(str::to_string)
            .collect::<HashSet<_>>();
        assert_eq!(
            missing_pack_targets("详情图_SKU00000001_001.zip", &rules, &matched),
            Some(
                vec![
                    "详情图1",
                    "详情图2",
                    "详情图4",
                    "详情图6",
                    "详情图7",
                    "详情图8",
                    "详情图9"
                ]
                .into_iter()
                .map(str::to_string)
                .collect()
            ),
        );
    }

    #[test]
    fn matches_legacy_folder_by_unique_product_name_and_stops_on_duplicates() {
        let root = std::env::temp_dir().join(format!("plm-folder-match-test-{}", Uuid::new_v4()));
        let first = root.join("AMZ 紧致提拉精华液");
        fs::create_dir_all(&first).unwrap();
        let product = FinalizedProduct {
            sku: "SKU00045419".into(),
            brand: "AMZ".into(),
            name: "紧致提拉精华液".into(),
            ..Default::default()
        };
        let preview = build_preview(
            &direct_product_directories(&root),
            &HashMap::new(),
            product.clone(),
        );
        let first_path = path_text(&first);
        assert_eq!(preview.folder.as_deref(), Some(first_path.as_str()));
        assert_eq!(preview.match_source, "product-name");

        let second = root.join("旧款 紧致提拉精华液");
        fs::create_dir_all(&second).unwrap();
        let ambiguous = build_preview(&direct_product_directories(&root), &HashMap::new(), product);
        assert!(ambiguous.folder.is_none());
        assert_eq!(ambiguous.ambiguous_folders.len(), 2);
        fs::remove_dir_all(&root).unwrap();
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
        writer
            .start_file(
                "nested/input-main-prompt-1-abc12345.png",
                SimpleFileOptions::default(),
            )
            .unwrap();
        writer.write_all(b"fake-png").unwrap();
        writer
            .start_file(
                "nested/new_product_image_7.png",
                SimpleFileOptions::default(),
            )
            .unwrap();
        writer.write_all(b"fallback-png").unwrap();
        writer.finish().unwrap();

        let result = archive_image_packs(
            vec![path_text(&zip_path)],
            path_text(&root),
            "^input-main-prompt-1-[a-zA-Z0-9]{8}$|主图1\n^input-main-prompt-2-[a-zA-Z0-9]{8}$|主图2".to_string(),
            true,
            false,
            false,
            String::new(),
            false,
        )
        .unwrap();

        assert_eq!(result.success, 2);
        assert_eq!(result.skipped, 0);
        assert_eq!(result.failed, 0);
        assert_eq!(photoshop_image_category(Path::new("主图1.png")), 1);
        assert_eq!(photoshop_image_category(Path::new("详情图3.webp")), 2);
        assert_eq!(photoshop_image_category(Path::new("附件.bmp")), 0);
        assert!(product.join("套图").join("主图1.png").is_file());
        assert!(product.join("套图").join("主图2.png").is_file());
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn archives_already_renamed_main_pack_without_reordering_slots() {
        use std::io::Write;
        use zip::{ZipWriter, write::SimpleFileOptions};

        let root = std::env::temp_dir().join(format!("plm-renamed-pack-test-{}", Uuid::new_v4()));
        let product = root.join("AMZ 身体乳 SKU00049398");
        fs::create_dir_all(&product).unwrap();
        let zip_path = root.join("SKU00049398-主图.zip");
        let zip_file = fs::File::create(&zip_path).unwrap();
        let mut writer = ZipWriter::new(zip_file);
        for index in 1..=6 {
            writer
                .start_file(format!("主图{index}.png"), SimpleFileOptions::default())
                .unwrap();
            writer
                .write_all(format!("fake-main-{index}").as_bytes())
                .unwrap();
        }
        writer.finish().unwrap();

        let result = archive_image_packs(
            vec![path_text(&zip_path)],
            path_text(&root),
            "^input-main-prompt-1-[a-zA-Z0-9]{8}$|主图1\n^input-main-prompt-2-[a-zA-Z0-9]{8}$|主图2".to_string(),
            true,
            false,
            false,
            String::new(),
            false,
        )
        .unwrap();

        assert_eq!(result.success, 6);
        assert_eq!(result.skipped, 0);
        assert_eq!(result.failed, 0);
        for index in 1..=6 {
            assert!(
                product
                    .join("套图")
                    .join(format!("主图{index}.png"))
                    .is_file()
            );
        }
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn empties_external_recycle_without_touching_product_folders() {
        let root = std::env::temp_dir().join(format!("plm-recycle-test-{}", Uuid::new_v4()));
        let recycle = root
            .join("图包回收站")
            .join("AMZ 产品 SKU00044974")
            .join("主图");
        let keep = root.join("AMZ 产品 SKU00044974").join("套图").join("主图");
        fs::create_dir_all(&recycle).unwrap();
        fs::create_dir_all(&keep).unwrap();
        fs::write(recycle.join("主图1.png"), b"original").unwrap();
        fs::write(keep.join("主图1.jpg"), b"compressed").unwrap();

        let result = empty_recycle_at(&root.join("图包回收站")).unwrap();

        assert_eq!(result.deleted_files, 1);
        assert_eq!(result.deleted_folders, 1);
        assert!(!recycle.parent().unwrap().exists());
        assert!(keep.join("主图1.jpg").is_file());
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn plans_and_applies_file_organizer_names() {
        let root = std::env::temp_dir().join(format!("plm-organizer-test-{}", Uuid::new_v4()));
        let product_name = "Feimuko 夜间睡眠牙套 SKU00049129";
        let product = root.join(product_name);
        fs::create_dir_all(&product).unwrap();
        fs::write(product.join("SKU.jpg"), b"sku").unwrap();
        fs::create_dir(product.join("品牌 产品名-编码")).unwrap();

        let scan = scan_file_organizer_plan(&root, true, true).unwrap();
        assert_eq!(scan.items.len(), 2);
        assert!(
            scan.items
                .iter()
                .any(|item| item.target_name == "SKU00049129.jpg")
        );
        assert!(
            scan.items
                .iter()
                .any(|item| item.source_name == "品牌 产品名-编码"
                    && item.target_name == "Feimuko 夜间睡眠牙套-SKU00049129")
        );
        let operations = scan
            .items
            .iter()
            .filter(|item| item.status == "ready")
            .map(|item| FileOrganizeOperation {
                source_path: item.source_path.clone(),
                target_path: item.target_path.clone(),
            })
            .collect();
        let result = organize_files(path_text(&root), operations).unwrap();
        assert_eq!(result.renamed, 2);
        assert!(product.is_dir());
        assert!(product.join("SKU00049129.jpg").is_file());
        assert!(product.join("Feimuko 夜间睡眠牙套-SKU00049129").is_dir());
        assert!(!product.join("品牌 产品名-编码").exists());
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn scans_and_confirms_label_check_files_with_print_psd_as_byproduct() {
        let root = std::env::temp_dir().join(format!("plm-label-check-test-{}", Uuid::new_v4()));
        let product = root.join("AMZ 强健清新牙膏 SKU00047381");
        let staging = product.join("AMZ 强健清新牙膏-SKU00047381");
        let print_psd = "印刷（11.5x15.4cm）MTL00064836 AMZ强健清新牙膏.psd";
        let box_psd = "纸盒（4x4x18.2cm）MTL00065155 AMZ强健清新牙膏.psd";
        fs::create_dir_all(&staging).unwrap();
        fs::write(staging.join("印刷MTL00064836.jpg"), b"preview").unwrap();
        fs::write(staging.join("纸盒MTL00065155.jpg"), b"box-preview").unwrap();
        fs::write(
            staging.join("印刷（11.5x15.4cm）MTL00064836 AMZ强健清新牙膏.ai"),
            b"ai",
        )
        .unwrap();
        fs::write(staging.join(print_psd), b"print-psd").unwrap();
        fs::write(staging.join(box_psd), b"box-psd").unwrap();
        fs::write(staging.join("标签说明.txt"), b"keep").unwrap();
        fs::write(staging.join("图层1.png"), b"ignore").unwrap();

        let history = root.join("state").join("label-check.json");
        let scan = scan_label_check_plan(&root, "03 纸盒标签", &history).unwrap();
        assert_eq!(scan.pending.len(), 1);
        let item = &scan.pending[0];
        assert_eq!(item.preview_images.len(), 2);
        assert_eq!(item.upload_files.len(), 4);
        assert_eq!(item.psd_files.len(), 1);
        assert_eq!(item.other_files.len(), 1);
        assert_eq!(item.other_files[0].name, "标签说明.txt");
        assert!(
            !item
                .preview_images
                .iter()
                .any(|file| file.name == "图层1.png")
        );
        assert_eq!(item.status, "ready");

        let confirmed =
            confirm_label_check_at(&root, "03 纸盒标签", &staging, "SKU00047381", &history)
                .unwrap();
        assert_eq!(confirmed.record.sku, "SKU00047381");
        let target = staging.join("03 纸盒标签");
        assert!(target.join("印刷MTL00064836.jpg").is_file());
        assert!(target.join("纸盒MTL00065155.jpg").is_file());
        assert!(
            target
                .join("印刷（11.5x15.4cm）MTL00064836 AMZ强健清新牙膏.ai")
                .is_file()
        );
        assert!(target.join(box_psd).is_file());
        assert!(product.join(print_psd).is_file());
        assert!(staging.join("标签说明.txt").is_file());
        assert!(staging.join("图层1.png").is_file());

        let rescanned = scan_label_check_plan(&root, "03 纸盒标签", &history).unwrap();
        assert!(rescanned.pending.is_empty());
        assert_eq!(rescanned.confirmed.len(), 1);
        assert_eq!(rescanned.confirmed_items.len(), 1);
        assert_eq!(
            rescanned.confirmed_items[0].source_path,
            path_text(&staging)
        );
        assert_eq!(
            rescanned.confirmed_items[0].source_name,
            "AMZ 强健清新牙膏-SKU00047381"
        );
        assert!(
            rescanned.confirmed_items[0]
                .preview_images
                .iter()
                .any(|file| file.name == "印刷MTL00064836.jpg")
        );
        assert!(
            rescanned.confirmed_items[0]
                .preview_images
                .iter()
                .all(|file| file.name != "图层1.png")
        );
        assert!(history.is_file());
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn skips_label_check_products_without_paper_box_preview() {
        let root = std::env::temp_dir().join(format!("plm-label-check-no-box-{}", Uuid::new_v4()));
        let product = root.join("AMZ 无纸盒预览 SKU00047382");
        let staging = product.join("AMZ 无纸盒预览-SKU00047382");
        fs::create_dir_all(&staging).unwrap();
        fs::write(staging.join("印刷MTL00064837.jpg"), b"preview").unwrap();
        fs::write(staging.join("印刷MTL00064837.ai"), b"ai").unwrap();
        let history = root.join("state").join("label-check.json");

        let scan = scan_label_check_plan(&root, "03 纸盒标签", &history).unwrap();
        assert!(scan.pending.is_empty());
        assert!(scan.confirmed_items.is_empty());
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn scans_parameter_samples_by_product_folder_without_category() {
        let root = std::env::temp_dir().join(format!("plm-parameter-samples-{}", Uuid::new_v4()));
        let product = root.join("2026新品").join("AMZ 亮肤精华-SKU00047382");
        let pack = product.join("套图");
        fs::create_dir_all(pack.join("产品参数图")).unwrap();
        let mut png = vec![0_u8; 32];
        png[..8].copy_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);
        png[25] = 6;
        fs::write(product.join("透明.png"), png).unwrap();
        fs::write(pack.join("产品参数图").join("尺寸.jpg"), b"size").unwrap();
        fs::write(pack.join("AMZ 亮肤精华 SKU00047382.xlsx"), b"excel").unwrap();

        let result = scan_parameter_samples_plan(&root).unwrap();
        assert_eq!(result.items.len(), 1);
        assert_eq!(result.ready, 1);
        assert_eq!(result.items[0].sku, "SKU00047382");
        assert!(result.items[0].transparent_has_alpha);
        assert!(result.index_path.ends_with("参数图学习样本索引.json"));
        assert!(Path::new(&result.index_path).is_file());
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn scans_legacy_product_root_once_and_infers_sku_from_excel() {
        let root =
            std::env::temp_dir().join(format!("plm-legacy-parameter-samples-{}", Uuid::new_v4()));
        let product = root.join("AMZ 滋润指甲笔");
        let label_wrapper = product.join("AMZ 滋润指甲笔-SKU00043380");
        let pack = product.join("套图");
        let pack_product = pack.join("AMZ 滋润指甲笔 SKU00043380");
        fs::create_dir_all(label_wrapper.join("03 纸盒标签")).unwrap();
        fs::create_dir_all(label_wrapper.join("04 主图及详情页")).unwrap();
        fs::create_dir_all(pack_product.join("产品参数图")).unwrap();
        let mut png = vec![0_u8; 32];
        png[..8].copy_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);
        png[25] = 6;
        fs::write(product.join("透明.png"), png).unwrap();
        fs::write(pack.join("AMZ 滋润指甲笔 SKU00043380.xlsx"), b"excel").unwrap();
        fs::write(
            pack_product
                .join("产品参数图")
                .join("SKU00043380-产品尺寸图.jpg"),
            b"size",
        )
        .unwrap();

        let result = scan_parameter_samples_plan(&root).unwrap();
        assert_eq!(result.items.len(), 1);
        assert_eq!(result.ready, 1);
        assert_eq!(result.items[0].sku, "SKU00043380");
        assert_eq!(result.items[0].product_path, path_text(&product));
        assert!(
            result.items[0]
                .transparent_path
                .as_deref()
                .unwrap()
                .ends_with("透明.png")
        );
        assert!(
            result.items[0]
                .parameter_path
                .as_deref()
                .unwrap()
                .ends_with("SKU00043380-产品尺寸图.jpg")
        );
        assert!(
            result.items[0]
                .excel_path
                .as_deref()
                .unwrap()
                .ends_with("AMZ 滋润指甲笔 SKU00043380.xlsx")
        );
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn excludes_transparent_placeholder_from_parameter_samples() {
        let root =
            std::env::temp_dir().join(format!("plm-parameter-placeholder-{}", Uuid::new_v4()));
        let product = root.join("DOWMOO 毛绒小象彩粉");
        let pack = product.join("套图").join("DOWMOO 毛绒小象彩粉 SKU00037758");
        fs::create_dir_all(pack.join("产品参数图")).unwrap();
        let mut placeholder = image::RgbaImage::from_pixel(184, 184, image::Rgba([0, 0, 0, 0]));
        for y in 58..138 {
            for x in 28..158 {
                if (x / 8 + y / 8) % 2 == 0 {
                    placeholder.put_pixel(x, y, image::Rgba([255, 198, 132, 255]));
                }
            }
        }
        placeholder.save(product.join("透明.png")).unwrap();
        fs::write(pack.join("产品参数图").join("尺寸.jpg"), b"size").unwrap();
        fs::write(
            product
                .join("套图")
                .join("DOWMOO 毛绒小象彩粉 SKU00037758.xlsx"),
            b"excel",
        )
        .unwrap();

        let result = scan_parameter_samples_plan(&root).unwrap();
        assert_eq!(result.items.len(), 1);
        assert_eq!(result.ready, 0);
        assert_eq!(result.items[0].transparent_path, None);
        assert_eq!(result.items[0].transparent_candidates, 0);
        assert_eq!(result.items[0].transparent_placeholders, 1);
        assert!(result.items[0].message.contains("已排除占位图"));
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn scans_configured_parameter_sample_root() {
        let Ok(root) = std::env::var("PLM_PARAMETER_SCAN_ROOT") else {
            return;
        };
        let result = scan_parameter_samples_plan(Path::new(&root)).unwrap();
        println!(
            "parameter sample scan: products={}, ready={}, incomplete={}, ambiguous={}",
            result.items.len(),
            result.ready,
            result.incomplete,
            result.ambiguous
        );
        assert!(Path::new(&result.index_path).is_file());
    }

    #[test]
    fn matches_video_by_sku_before_product_name() {
        let directories = vec![
            PathBuf::from(r"E:\产品\AMZ 紧致提拉精华液 SKU00045826"),
            PathBuf::from(r"E:\产品\AMZ 紧致提拉精华液 SKU00045827"),
        ];
        let (matches, source) =
            video_product_candidates("检测视频_惊喜_SKU00045827.mp4", &directories);
        assert_eq!(source, "sku");
        assert_eq!(matches, vec![directories[1].clone()]);
    }

    #[test]
    fn skips_video_task_when_product_has_any_video_and_gif_outputs() {
        let root = std::env::temp_dir().join(format!("plm-video-output-test-{}", Uuid::new_v4()));
        let product = root.join("AMZ 产品 SKU00045827");
        let video_dir = product.join("套图").join("视频");
        let gif_dir = product.join("套图").join("动图");
        fs::create_dir_all(&video_dir).unwrap();
        fs::create_dir_all(&gif_dir).unwrap();
        fs::write(video_dir.join("已有的其他视频.mp4"), b"video").unwrap();
        fs::write(gif_dir.join("已有的其他动图.GIF"), b"gif").unwrap();

        let item = VideoMatch {
            source_path: path_text(&root.join("检测视频_SKU00045827.mp4")),
            file_name: "检测视频_SKU00045827.mp4".to_string(),
            product_folder: Some(path_text(&product)),
            match_source: "sku".to_string(),
            ambiguous_folders: Vec::new(),
            status: "待处理".to_string(),
        };

        assert!(video_outputs_exist(&item));
        fs::remove_dir_all(&root).unwrap();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_drag::init())
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
            read_image_data_url,
            save_annotated_size_image,
            preview_products,
            detect_photoshop,
            archive_image_packs,
            compose_random_pack,
            empty_pack_recycle,
            default_video_source,
            scan_video_files,
            process_video_files,
            request_excel,
            scan_upload_pairs,
            queue_upload_pairs,
            scan_file_organizer,
            organize_files,
            scan_parameter_samples,
            analyze_parameter_box_annotations,
            fetch_parameter_rule_package,
            scan_label_check,
            confirm_label_check,
            open_local_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PLM product asset workbench");
}
