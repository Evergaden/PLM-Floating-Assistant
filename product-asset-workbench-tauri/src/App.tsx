import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import { startDrag } from "@crabnebula/tauri-plugin-drag";
import {
  Archive, Check, ChevronDown, ChevronRight, ChevronUp, CircleAlert, Copy, FileArchive, FileImage, FileSpreadsheet, Film,
  Eye, FolderOpen, GripVertical, Link2, LoaderCircle, Pencil, Play, RefreshCw, RotateCcw, Save, Search, Settings2,
  ScanLine, Sparkles, Trash2, Undo2, Unplug, Upload, RotateCw, X,
} from "lucide-react";
import type { BridgeInfo, FinalizedProduct, ProductPreview, RowJob, UploadPair } from "./types";

const APP_VERSION = "0.1.13";

const ROOT_KEY = "plm-workbench.asset-root";
const MAP_KEY = "plm-workbench.folder-mappings";
const AUTO_DONE_KEY = "plm-workbench.auto-finalized-done";
const PACK_RULES_KEY = "plm-workbench.pack-rules";
const PHOTOSHOP_PATH_KEY = "plm-workbench.photoshop-path";
const PHOTOSHOP_COMPRESS_KEY = "plm-workbench.photoshop-compress";
const PHOTOSHOP_RECYCLE_KEY = "plm-workbench.photoshop-recycle-originals";
const VIDEO_SOURCE_KEY = "plm-workbench.video-source";
const VIDEO_FFMPEG_KEY = "plm-workbench.video-ffmpeg-path";
const VIDEO_GIFSICLE_KEY = "plm-workbench.video-gifsicle-path";
const VIDEO_FPS_KEY = "plm-workbench.video-fps";
const VIDEO_SCALE_KEY = "plm-workbench.video-scale";
const VIDEO_LOSSY_KEY = "plm-workbench.video-lossy";
const VIDEO_THREADS_KEY = "plm-workbench.video-threads";
const COMPACT_TOP_KEY = "plm-workbench.compact-top";
const RANDOM_OUTPUT_KEY = "plm-workbench.random-output-dir";
const LABEL_CHECK_TARGET_KEY = "plm-workbench.label-check-target-folder";
const DEFAULT_LABEL_CHECK_TARGET = "03 纸盒标签";
const LEGACY_LABEL_CHECK_TARGET = "03 纸盒标签文件夹";
const DEFAULT_PACK_RULES = `# 图包重命名规则：正则 | 新名称
^input-main-prompt-1-[a-zA-Z0-9]{8}$|主图1
^input-main-prompt-2-[a-zA-Z0-9]{8}$|主图2
^input-main-prompt-3-[a-zA-Z0-9]{8}$|主图3
^input-main-prompt-4-[a-zA-Z0-9]{8}$|主图4
^input-main-prompt-5-[a-zA-Z0-9]{8}$|主图5
^input-main-prompt-6-[a-zA-Z0-9]{8}$|主图6
^input-main-prompt-7-[a-zA-Z0-9]{8}$|主图7
^input-detail-sale-prompt-1-.+$|详情图1
^input-detail-sale-prompt-2-.+$|详情图2
^input-detail-component-prompt-.+$|详情图3
^input-detail-advantage-prompt-1-.+$|详情图4
^input-detail-advantage-prompt-2-.+$|详情图5
^input-detail-details-prompt-1-.+$|详情图6
^input-detail-details-prompt-2-.+$|详情图7
^input-detail-efficacy-prompt-.+$|详情图8
^input-detail-use-step-prompt-.+$|详情图9
^input-detail-scene-prompt-.+$|详情图10`;

interface ArchivePacksResult {
  logs: string[];
  success: number;
  skipped: number;
  failed: number;
  deleted: number;
  compressedImages: number;
  photoshopStarted: boolean;
}

interface EmptyRecycleResult {
  deletedFiles: number;
  deletedFolders: number;
  recycleRoot: string;
}

interface FileOrganizeItem {
  kind: "sku-image" | "product-folder" | string;
  sourcePath: string;
  targetPath: string;
  sourceName: string;
  targetName: string;
  sku: string;
  status: "ready" | "conflict" | "skipped" | string;
  message: string;
}

interface FileOrganizeScanResult {
  root: string;
  items: FileOrganizeItem[];
}

interface FileOrganizeResult {
  logs: string[];
  renamed: number;
  skipped: number;
  failed: number;
}

interface ParameterSampleItem {
  sku: string;
  productName: string;
  productPath: string;
  transparentPath: string | null;
  parameterPath: string | null;
  excelPath: string | null;
  transparentHasAlpha: boolean;
  transparentCandidates: number;
  parameterCandidates: number;
  excelCandidates: number;
  status: "ready" | "missing" | "ambiguous" | string;
  message: string;
}

interface ParameterSampleScanResult {
  root: string;
  indexPath: string;
  items: ParameterSampleItem[];
  ready: number;
  incomplete: number;
  ambiguous: number;
  logs: string[];
}

interface LabelCheckFile {
  name: string;
  path: string;
  extension: string;
  size: number;
}

interface LabelCheckItem {
  sku: string;
  brand: string;
  productName: string;
  productPath: string;
  sourcePath: string;
  sourceName: string;
  targetPath: string;
  previewImages: LabelCheckFile[];
  uploadFiles: LabelCheckFile[];
  psdFiles: LabelCheckFile[];
  otherFiles: LabelCheckFile[];
  status: "ready" | "missing-upload" | "missing-preview" | "conflict" | string;
  message: string;
}

interface LabelCheckRecord {
  sku: string;
  brand: string;
  productName: string;
  productPath: string;
  sourcePath: string;
  targetPath: string;
  confirmedAtMs: number;
  movedFiles: string[];
  movedPsdFiles: string[];
}

interface LabelCheckScanResult {
  root: string;
  targetFolderName: string;
  historyPath: string;
  pending: LabelCheckItem[];
  confirmed: LabelCheckRecord[];
  confirmedItems: LabelCheckItem[];
  logs: string[];
}

interface LabelCheckConfirmResult {
  record: LabelCheckRecord;
  logs: string[];
}

interface ComposePackResult {
  logs: string[];
  outputPath: string;
  selectedCount: number;
  missingSlots: string[];
  photoshopStarted: boolean;
}

interface VideoMatch {
  sourcePath: string;
  fileName: string;
  productFolder: string | null;
  matchSource: string;
  ambiguousFolders: string[];
  status: string;
}

interface VideoScanResult {
  sourceDir: string;
  files: VideoMatch[];
  skippedProcessed: number;
  logs: string[];
}

interface VideoProcessResult {
  files: VideoMatch[];
  converted: number;
  copied: number;
  failed: number;
  logs: string[];
}

function isWorktableOperationDone(state: string, done: boolean) {
  return done || state === "done";
}

function isWorktableComplete(row: ProductPreview) {
  const product = row.product;
  return isWorktableOperationDone(product.boxFileState, product.boxFileDone)
    && isWorktableOperationDone(product.labelFileState, product.labelFileDone)
    && isWorktableOperationDone(product.imagePackState, product.imagePackDone);
}

function readMappings(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || "{}");
  } catch {
    return {};
  }
}

function statusFor(row: ProductPreview, job?: RowJob) {
  if (job?.state === "running" || job?.state === "queued") return { label: job.message || "生成中", tone: "working" };
  if (job?.state === "done") return { label: "生成完成", tone: "success" };
  if (job?.state === "error") return { label: job.message || "生成失败", tone: "danger" };
  if (row.ambiguousFolders.length > 1) return { label: `同名目录 ${row.ambiguousFolders.length} 个，请手动选择`, tone: "warning" };
  if (!row.folder) return { label: "待指定目录", tone: "danger" };
  if (row.missing.length) return { label: `缺少 ${row.missing.join("、")}`, tone: "warning" };
  if (isWorktableComplete(row)) return { label: "三项操作完成，已收纳", tone: "neutral" };
  return { label: "可以生成", tone: "success" };
}

function labelCheckStatusLabel(status: string) {
  if (status === "ready") return "可确认";
  if (status === "missing-upload") return "缺少可上传文件";
  if (status === "missing-preview") return "缺少 JPG/PNG 预览";
  if (status === "conflict") return "目标文件冲突";
  return status;
}

function formatLabelCheckTime(value: number) {
  if (!value) return "未知时间";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function localFileName(path: string | null) {
  return path ? path.split(/[\\/]/).filter(Boolean).pop() || path : "未找到";
}

function ProductThumbnail({ row }: { row: ProductPreview }) {
  const sources = useMemo(() => [...new Set([
    row.skuImageExists && row.skuImagePath ? convertFileSrc(row.skuImagePath) : "",
    row.product.skuImageUrl,
    row.product.skuImageFallbackUrl,
    row.product.benchmarkImageUrl,
    row.product.benchmarkImageFallbackUrl,
  ].filter(Boolean))], [row]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => setSourceIndex(0), [sources.join("|")]);

  return (
    <div className="product-thumb" title={sources.length ? "SKU 图；缺少时显示对标图" : "暂无 SKU 图或对标图"}>
      {sources[sourceIndex]
        ? <img src={sources[sourceIndex]} alt="" onError={() => setSourceIndex((current) => current + 1)} />
        : <FileImage size={20} />}
    </div>
  );
}

type PreviewKind = "english" | "size";
type AnnotationLine = { x1: number; y1: number; x2: number; y2: number; label: string };

function annotationOptions(product: FinalizedProduct) {
  return [
    ["包装长", product.packageLength],
    ["包装宽", product.packageWidth],
    ["包装高", product.packageHeight],
    ["产品长", product.productLength],
    ["产品宽", product.productWidth],
    ["产品高", product.productHeight],
  ].filter((item) => item[1]).map(([label, value]) => {
    const text = String(value).trim();
    return `${label} ${text}${/cm|厘米|公分/i.test(text) ? "" : "cm"}`;
  });
}

function ManualAnnotationCanvas({ dataUrl, row, onSaved, notify }: {
  dataUrl: string;
  row: ProductPreview;
  onSaved: (dataUrl: string) => void;
  notify: (message: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [lines, setLines] = useState<AnnotationLine[]>([]);
  const [draft, setDraft] = useState<AnnotationLine | null>(null);
  const [imageReady, setImageReady] = useState(0);
  const options = useMemo(() => annotationOptions(row.product), [row.product]);
  const [label, setLabel] = useState(options[0] || "尺寸");
  const [saving, setSaving] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const scale = Math.max(1, canvas.width / 1200);
    [...lines, ...(draft ? [draft] : [])].forEach((line) => {
      const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
      const arrow = 13 * scale;
      ctx.save();
      ctx.strokeStyle = "#6c4df6";
      ctx.fillStyle = "#6c4df6";
      ctx.lineWidth = 4 * scale;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
      [0, Math.PI].forEach((offset, index) => {
        const x = index ? line.x1 : line.x2;
        const y = index ? line.y1 : line.y2;
        const direction = angle + offset;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - arrow * Math.cos(direction - Math.PI / 6), y - arrow * Math.sin(direction - Math.PI / 6));
        ctx.lineTo(x - arrow * Math.cos(direction + Math.PI / 6), y - arrow * Math.sin(direction + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      });
      ctx.font = `700 ${22 * scale}px "Microsoft YaHei UI", sans-serif`;
      const width = ctx.measureText(line.label).width;
      const centerX = (line.x1 + line.x2) / 2;
      const centerY = (line.y1 + line.y2) / 2;
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.fillRect(centerX - width / 2 - 10 * scale, centerY - 36 * scale, width + 20 * scale, 31 * scale);
      ctx.fillStyle = "#5034d8";
      ctx.textAlign = "center";
      ctx.fillText(line.label, centerX, centerY - 12 * scale);
      ctx.restore();
    });
  }, [draft, lines]);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      setImageReady((current) => current + 1);
    };
    image.src = dataUrl;
  }, [dataUrl]);

  useEffect(() => draw(), [draw, imageReady]);

  function pointFromEvent(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height,
    };
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas || !row.sizePath) return;
    setSaving(true);
    try {
      const nextDataUrl = canvas.toDataURL("image/jpeg", .95);
      await invoke("save_annotated_size_image", { path: row.sizePath, dataUrl: nextDataUrl });
      onSaved(nextDataUrl);
      notify("手动标注已保存到尺寸.jpg");
    } catch (error) {
      notify(String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="annotation-workspace">
      <div className="annotation-toolbar">
        <label>当前尺寸<select value={label} onChange={(event) => setLabel(event.target.value)}>
          {(options.length ? options : ["尺寸"]).map((option) => <option key={option}>{option}</option>)}
        </select></label>
        <span>在画布上按住拖动，画出尺寸线</span>
        <button onClick={() => setLines((current) => current.slice(0, -1))} disabled={!lines.length}><Undo2 size={15} />撤销</button>
        <button onClick={() => setLines([])} disabled={!lines.length}><RotateCcw size={15} />重画</button>
        <button className="save-annotation" onClick={save} disabled={saving || !lines.length}>{saving ? <LoaderCircle size={15} className="spin" /> : <Save size={15} />}保存尺寸图</button>
      </div>
      <div className="annotation-stage">
        <canvas
          ref={canvasRef}
          onMouseDown={(event) => {
            const point = pointFromEvent(event);
            setDraft({ x1: point.x, y1: point.y, x2: point.x, y2: point.y, label });
          }}
          onMouseMove={(event) => {
            if (!draft) return;
            const point = pointFromEvent(event);
            setDraft({ ...draft, x2: point.x, y2: point.y });
          }}
          onMouseUp={() => {
            if (!draft) return;
            if (Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > 12) setLines((current) => [...current, draft]);
            setDraft(null);
          }}
          onMouseLeave={() => setDraft(null)}
        />
      </div>
    </div>
  );
}

function AssetPreviewModal({ initialKind, row, onClose, notify }: {
  initialKind: PreviewKind;
  row: ProductPreview;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const [kind, setKind] = useState<PreviewKind>(initialKind);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const [annotating, setAnnotating] = useState(false);
  const path = kind === "english" ? row.englishPath : (row.sizeExists ? row.sizePath : row.transparentImage);
  const exists = kind === "english" ? row.englishExists : Boolean(path);

  useEffect(() => {
    setAnnotating(false);
    setDataUrl("");
    setError("");
    if (!exists || !path) {
      setError(kind === "english" ? "英文参数图尚未生成" : "尺寸图尚未生成，并且没有透明图可供手动标注");
      return;
    }
    invoke<string>("read_image_data_url", { path }).then(setDataUrl).catch((reason) => setError(String(reason)));
  }, [exists, kind, path]);

  return (
    <div className="modal-backdrop asset-preview-backdrop" onMouseDown={onClose}>
      <section className="asset-preview-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><strong>{row.product.sku}</strong><span>{row.product.brand} {row.product.name}</span></div>
          <nav>
            <button className={kind === "english" ? "active" : ""} onClick={() => setKind("english")}>英文参数图</button>
            <button className={kind === "size" ? "active" : ""} onClick={() => setKind("size")}>尺寸图</button>
          </nav>
          {kind === "size" && dataUrl && <button className={`annotation-toggle ${annotating ? "active" : ""}`} onClick={() => setAnnotating((current) => !current)}><Pencil size={15} />{annotating ? "返回预览" : "手动标注"}</button>}
          <button className="modal-close" onClick={onClose}><X size={19} /></button>
        </header>
        <div className="asset-preview-body">
          {error && <div className="preview-error"><CircleAlert size={28} /><strong>{error}</strong></div>}
          {!error && !dataUrl && <LoaderCircle size={28} className="spin preview-loader" />}
          {dataUrl && (annotating
            ? <ManualAnnotationCanvas dataUrl={dataUrl} row={row} onSaved={setDataUrl} notify={notify} />
            : <img src={dataUrl} alt={kind === "english" ? "英文参数图" : "尺寸图"} />)}
        </div>
      </section>
    </div>
  );
}

function labelPreviewGroups(item: LabelCheckItem) {
  const box = item.previewImages.filter((file) => file.name.includes("纸盒"));
  const label = item.previewImages.filter((file) => !file.name.includes("纸盒") && (file.name.includes("标签") || file.name.includes("印刷")));
  return { box, label };
}

function labelCheckProductFolder(item: LabelCheckItem) {
  const sourcePath = item.sourcePath.replace(/[\\/]+$/, "");
  const separatorIndex = Math.max(sourcePath.lastIndexOf("\\"), sourcePath.lastIndexOf("/"));
  return separatorIndex > 0 ? sourcePath.slice(0, separatorIndex) : item.productPath;
}

function ZoomableLabelImage({ dataUrl, fileName }: { dataUrl: string; fileName: string }) {
  const [scale, setScale] = useState(1);
  const [maxScale, setMaxScale] = useState(8);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  function reset() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    const factor = event.deltaY < 0 ? 1.16 : 1 / 1.16;
    setScale((current) => Math.min(maxScale, Math.max(1, current * factor)));
  }

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const viewport = viewportRef.current?.getBoundingClientRect();
    const image = event.currentTarget;
    if (!viewport || !image.naturalWidth || !image.naturalHeight) return;
    const fitScale = Math.min(viewport.width / image.naturalWidth, viewport.height / image.naturalHeight);
    setMaxScale(Math.max(1, Math.min(12, 1 / fitScale)));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset((current) => ({ x: current.x + event.clientX - drag.x, y: current.y + event.clientY - drag.y }));
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      ref={viewportRef}
      className={`label-check-zoom-viewport ${scale > 1 ? "is-zoomed" : ""}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={reset}
      title="滚轮放大/缩小；按住鼠标抓手移动；双击复位"
    >
      <img
        src={dataUrl}
        alt={fileName}
        draggable={false}
        onLoad={handleImageLoad}
        style={{
          width: `${scale * 100}%`,
          height: `${scale * 100}%`,
          left: `calc(50% + ${offset.x}px)`,
          top: `calc(50% + ${offset.y}px)`,
        }}
      />
      <span>{scale > 1 ? `${Math.round(scale * 100)}% · 抓手移动 · 双击复位` : "滚轮放大 · 抓手移动"}</span>
    </div>
  );
}

function LabelCheckPreviewModal({ item, onClose }: { item: LabelCheckItem; onClose: () => void }) {
  const groups = useMemo(() => labelPreviewGroups(item), [item]);
  const files = useMemo(() => [...groups.box, ...groups.label], [groups]);
  const [dataUrls, setDataUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setDataUrls({});
    setError("");
    Promise.all(files.map(async (file) => [file.path, await invoke<string>("read_image_data_url", { path: file.path })] as const))
      .then((entries) => {
        if (!active) return;
        setDataUrls(Object.fromEntries(entries));
      })
      .catch((reason) => {
        if (active) setError(String(reason));
      });
    return () => { active = false; };
  }, [files]);

  function renderSide(title: string, sideFiles: LabelCheckFile[]) {
    return (
      <section className="label-check-preview-pane">
        <header><strong>{title}</strong><span>{sideFiles.length} 张预览</span></header>
        <div className="label-check-preview-grid">
          {sideFiles.map((file) => (
            <div className="label-check-preview-item" key={file.path}>
              {dataUrls[file.path] ? <ZoomableLabelImage dataUrl={dataUrls[file.path]} fileName={file.name} /> : <div className="label-check-image-loading"><LoaderCircle size={22} className="spin" /></div>}
              <span title={file.name}>{file.name}</span>
            </div>
          ))}
          {!sideFiles.length && <div className="label-check-preview-empty"><FileImage size={22} /><span>没有识别到此类 JPG/PNG</span></div>}
        </div>
      </section>
    );
  }

  return (
    <div className="modal-backdrop asset-preview-backdrop" onMouseDown={onClose}>
      <section className="asset-preview-modal label-check-preview-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><strong>纸盒 / 标签 / 印刷并列核对</strong><span title={item.productPath}>{item.sku} · {item.productName}</span></div>
          <button className="modal-close" onClick={onClose}><X size={19} /></button>
        </header>
        {error && <div className="preview-error label-check-preview-error"><CircleAlert size={22} /><strong>{error}</strong></div>}
        <div className="label-check-preview-split">
          {renderSide("纸盒", groups.box)}
          {renderSide("标签 / 印刷", groups.label)}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [bridge, setBridge] = useState<BridgeInfo>({ url: "ws://127.0.0.1:37191", token: "", connected: false, scriptVersion: "" });
  const [products, setProducts] = useState<FinalizedProduct[]>([]);
  const [rows, setRows] = useState<ProductPreview[]>([]);
  const [root, setRoot] = useState(() => localStorage.getItem(ROOT_KEY) || "");
  const [mappings, setMappings] = useState<Record<string, string>>(readMappings);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Record<string, RowJob>>({});
  const [syncing, setSyncing] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [toast, setToast] = useState("");
  const [workspaceView, setWorkspaceView] = useState<"assets" | "packs" | "videos" | "upload" | "random" | "organize" | "parameter-samples" | "label-check">("assets");
  const [queueView, setQueueView] = useState<"active" | "complete">("active");
  const [zipPaths, setZipPaths] = useState<string[]>([]);
  const [packRules, setPackRules] = useState(() => localStorage.getItem(PACK_RULES_KEY) || DEFAULT_PACK_RULES);
  const [usePackRules, setUsePackRules] = useState(true);
  const [deleteZip, setDeleteZip] = useState(false);
  const [compressImages, setCompressImages] = useState(() => localStorage.getItem(PHOTOSHOP_COMPRESS_KEY) === "1");
  const [moveOriginalsToRecycle, setMoveOriginalsToRecycle] = useState(() => localStorage.getItem(PHOTOSHOP_RECYCLE_KEY) === "1");
  const [photoshopPath, setPhotoshopPath] = useState(() => localStorage.getItem(PHOTOSHOP_PATH_KEY) || "");
  const [videoSource, setVideoSource] = useState(() => localStorage.getItem(VIDEO_SOURCE_KEY) || "E:/WXWork/1688857110932701/Cache/Video/7月");
  const [ffmpegPath, setFfmpegPath] = useState(() => localStorage.getItem(VIDEO_FFMPEG_KEY) || "");
  const [gifsiclePath, setGifsiclePath] = useState(() => localStorage.getItem(VIDEO_GIFSICLE_KEY) || "");
  const [videoFps, setVideoFps] = useState(() => localStorage.getItem(VIDEO_FPS_KEY) || "18");
  const [videoScale, setVideoScale] = useState(() => localStorage.getItem(VIDEO_SCALE_KEY) || "6");
  const [videoLossy, setVideoLossy] = useState(() => localStorage.getItem(VIDEO_LOSSY_KEY) || "40");
  const [videoThreads, setVideoThreads] = useState(() => localStorage.getItem(VIDEO_THREADS_KEY) || "8");
  const [videoFiles, setVideoFiles] = useState<VideoMatch[]>([]);
  const [selectedVideoPaths, setSelectedVideoPaths] = useState<Set<string>>(new Set());
  const [videoLogs, setVideoLogs] = useState<string[]>(["等待扫描视频目录。"]);
  const [videoBusy, setVideoBusy] = useState(false);
  const [compactTop, setCompactTop] = useState(() => localStorage.getItem(COMPACT_TOP_KEY) === "1");
  const [packBusy, setPackBusy] = useState(false);
  const [uploadPairs, setUploadPairs] = useState<UploadPair[]>([]);
  const [selectedUploadSkus, setSelectedUploadSkus] = useState<Set<string>>(new Set());
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadAutoStart, setUploadAutoStart] = useState(true);
  const [randomZipPaths, setRandomZipPaths] = useState<string[]>([]);
  const [randomMainCount, setRandomMainCount] = useState("6");
  const [randomDetailCount, setRandomDetailCount] = useState("10");
  const [randomOutputDir, setRandomOutputDir] = useState(() => localStorage.getItem(RANDOM_OUTPUT_KEY) || "");
  const [randomCompress, setRandomCompress] = useState(true);
  const [randomBusy, setRandomBusy] = useState(false);
  const [randomLogs, setRandomLogs] = useState<string[]>(["等待导入主图或详情图 ZIP。"]);
  const [organizeItems, setOrganizeItems] = useState<FileOrganizeItem[]>([]);
  const [organizeRenameImages, setOrganizeRenameImages] = useState(true);
  const [organizeRenameFolders, setOrganizeRenameFolders] = useState(true);
  const [organizeBusy, setOrganizeBusy] = useState(false);
  const [organizeLogs, setOrganizeLogs] = useState<string[]>(["请选择工作目录并扫描待整理文件。"]);
  const [parameterSamples, setParameterSamples] = useState<ParameterSampleItem[]>([]);
  const [parameterSampleIndexPath, setParameterSampleIndexPath] = useState("");
  const [parameterSampleBusy, setParameterSampleBusy] = useState(false);
  const [parameterSampleLogs, setParameterSampleLogs] = useState<string[]>(["请选择工作目录，工作台会自动配对透明图、正确尺寸图和 Excel。"]);
  const [labelCheckItems, setLabelCheckItems] = useState<LabelCheckItem[]>([]);
  const [labelCheckRecords, setLabelCheckRecords] = useState<LabelCheckRecord[]>([]);
  const [labelCheckConfirmedItems, setLabelCheckConfirmedItems] = useState<LabelCheckItem[]>([]);
  const [labelCheckFilter, setLabelCheckFilter] = useState<"pending" | "confirmed" | "all">("pending");
  const [labelCheckTargetFolder, setLabelCheckTargetFolder] = useState(() => {
    const saved = localStorage.getItem(LABEL_CHECK_TARGET_KEY);
    return !saved || saved === LEGACY_LABEL_CHECK_TARGET ? DEFAULT_LABEL_CHECK_TARGET : saved;
  });
  const [labelCheckHistoryPath, setLabelCheckHistoryPath] = useState("");
  const [labelCheckBusy, setLabelCheckBusy] = useState(false);
  const [labelCheckDraggingSku, setLabelCheckDraggingSku] = useState("");
  const [labelCheckLogs, setLabelCheckLogs] = useState<string[]>(["请选择工作目录并扫描待检查的纸盒标签文件。"]);
  const [labelCheckPreviewItem, setLabelCheckPreviewItem] = useState<LabelCheckItem | null>(null);
  const [assetPreview, setAssetPreview] = useState<{ row: ProductPreview; kind: PreviewKind } | null>(null);
  const [packLogs, setPackLogs] = useState<string[]>(["等待添加图包 ZIP。"]);
  const autoRunning = useRef(new Set<string>());
  const autoAttempts = useRef(new Map<string, string>());
  const bridgeRef = useRef(bridge);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  const addZipPaths = useCallback((paths: string[]) => {
    setZipPaths((current) => [...new Set([...current, ...paths.filter((path) => path.toLowerCase().endsWith(".zip"))])]);
  }, []);

  const addRandomZipPaths = useCallback((paths: string[]) => {
    setRandomZipPaths((current) => [...new Set([...current, ...paths.filter((path) => path.toLowerCase().endsWith(".zip"))])]);
  }, []);

  const refreshPreview = useCallback(async (
    nextProducts: FinalizedProduct[],
    nextRoot: string,
    nextMappings: Record<string, string>,
  ) => {
    if (!nextRoot || !nextProducts.length) {
      setRows([]);
      return;
    }
    const result = await invoke<ProductPreview[]>("preview_products", {
      root: nextRoot,
      products: nextProducts,
      manualMappings: nextMappings,
    });
    setRows(result);
    if (bridgeRef.current.connected) {
      let completed: Record<string, string> = {};
      try {
        completed = JSON.parse(localStorage.getItem(AUTO_DONE_KEY) || "{}");
      } catch {
        completed = {};
      }
      const now = new Date();
      const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
      result.filter((row) =>
        row.product.finalizedDate === today
        && row.folder
        && !row.missing.length
        && !(row.excelExists && row.skuImageExists)
        && completed[row.product.sku] !== `${row.product.finalizedAt}|${row.product.cacheUpdatedAtMs}`
        && !autoRunning.current.has(row.product.sku)
        && autoAttempts.current.get(row.product.sku) !== `${row.product.finalizedAt}|${row.product.cacheUpdatedAtMs}`
      ).forEach((row) => {
        autoAttempts.current.set(row.product.sku, `${row.product.finalizedAt}|${row.product.cacheUpdatedAtMs}`);
        autoRunning.current.add(row.product.sku);
        setJobs((current) => ({ ...current, [row.product.sku]: { state: "queued", message: "定稿资料完整，自动归档 SKU 图并生成 Excel" } }));
        invoke("request_excel", { product: row.product, folder: row.folder, overwrite: false, auto: true }).catch((error) => {
          autoRunning.current.delete(row.product.sku);
          setJobs((current) => ({ ...current, [row.product.sku]: { state: "error", message: String(error) } }));
        });
      });
    }
    setSelected((current) => {
      const valid = new Set(result.filter((item) => !isWorktableComplete(item)).map((item) => item.product.sku));
      return new Set([...current].filter((sku) => valid.has(sku)));
    });
  }, []);

  const loadProducts = useCallback(async () => {
    const latest = await invoke<FinalizedProduct[]>("get_products");
    setProducts(latest);
  }, []);

  useEffect(() => {
    bridgeRef.current = bridge;
  }, [bridge]);

  useEffect(() => {
    if (photoshopPath) return;
    invoke<string>("detect_photoshop").then((path) => {
      if (!path) return;
      setPhotoshopPath(path);
      localStorage.setItem(PHOTOSHOP_PATH_KEY, path);
    }).catch(console.error);
  }, [photoshopPath]);

  useEffect(() => {
    invoke<BridgeInfo>("bridge_info").then(setBridge).catch(console.error);
    loadProducts().catch(console.error);
    const cleaners: Array<() => void> = [];
    Promise.all([
      listen<BridgeInfo>("bridge-status", (event) => {
        setBridge(event.payload);
        if (event.payload.connected) notify("PLM 悬浮助手已连接");
      }),
      listen("snapshot-updated", () => loadProducts()),
      listen<{ sku: string; state: string; message: string }>("asset-job", (event) => {
        const { sku, state, message } = event.payload;
        setJobs((current) => ({ ...current, [sku]: { state: state as RowJob["state"], message } }));
        if (state === "done") {
          const wasAuto = autoRunning.current.has(sku);
          const completedSignature = autoAttempts.current.get(sku);
          autoRunning.current.delete(sku);
          if (wasAuto && completedSignature) {
            let completed: Record<string, string> = {};
            try {
              completed = JSON.parse(localStorage.getItem(AUTO_DONE_KEY) || "{}");
            } catch {
              completed = {};
            }
            completed[sku] = completedSignature;
            localStorage.setItem(AUTO_DONE_KEY, JSON.stringify(completed));
          }
          loadProducts().catch(console.error);
        } else if (state === "error") {
          autoRunning.current.delete(sku);
          loadProducts().catch(console.error);
        }
      }),
    ]).then((items) => cleaners.push(...items));
    return () => cleaners.forEach((clean) => clean());
  }, [loadProducts, notify]);

  useEffect(() => {
    let clean: (() => void) | undefined;
    getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type !== "drop") return;
      if (workspaceView === "random") addRandomZipPaths(event.payload.paths);
      else if (workspaceView === "packs") addZipPaths(event.payload.paths);
    }).then((unlisten) => { clean = unlisten; });
    return () => clean?.();
  }, [addRandomZipPaths, addZipPaths, workspaceView]);

  useEffect(() => {
    refreshPreview(products, root, mappings).catch(console.error);
  }, [bridge.connected, mappings, products, refreshPreview, root]);

  const matchingRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => !keyword || [row.product.sku, row.product.brand, row.product.name, row.product.englishName]
      .join(" ").toLowerCase().includes(keyword));
  }, [query, rows]);

  const activeRows = useMemo(() => matchingRows.filter((row) => !isWorktableComplete(row)), [matchingRows]);
  const completedRows = useMemo(() => matchingRows.filter(isWorktableComplete), [matchingRows]);
  const visible = queueView === "complete" ? completedRows : activeRows;

  const counts = useMemo(() => ({
    ready: rows.filter((row) => !isWorktableComplete(row) && row.folder && !row.missing.length).length,
    missing: rows.filter((row) => !isWorktableComplete(row) && (!row.folder || row.missing.length)).length,
    complete: rows.filter(isWorktableComplete).length,
  }), [rows]);

  const visibleLabelCheckItems = useMemo(() => {
    if (labelCheckFilter === "confirmed") return labelCheckConfirmedItems;
    if (labelCheckFilter === "all") return [...labelCheckItems, ...labelCheckConfirmedItems];
    return labelCheckItems;
  }, [labelCheckConfirmedItems, labelCheckFilter, labelCheckItems]);

  async function chooseRoot() {
    const value = await open({ directory: true, multiple: false, title: "选择产品文件夹根目录" });
    if (typeof value !== "string") return;
    setRoot(value);
    localStorage.setItem(ROOT_KEY, value);
  }

  async function chooseZipPacks() {
    const value = await open({
      multiple: true,
      directory: false,
      title: "选择图包 ZIP",
      filters: [{ name: "ZIP 图包", extensions: ["zip"] }],
    });
    if (Array.isArray(value)) addZipPaths(value);
    else if (typeof value === "string") addZipPaths([value]);
  }

  async function chooseRandomZipPacks() {
    const value = await open({
      multiple: true,
      directory: false,
      title: "选择随机组合 ZIP",
      filters: [{ name: "ZIP 图包", extensions: ["zip"] }],
    });
    const paths = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
    addRandomZipPaths(paths);
  }

  async function chooseRandomOutputDir() {
    const value = await open({ directory: true, multiple: false, defaultPath: randomOutputDir || root || undefined, title: "选择随机组合导出目录" });
    if (typeof value !== "string") return;
    setRandomOutputDir(value);
    localStorage.setItem(RANDOM_OUTPUT_KEY, value);
  }

  async function choosePhotoshop() {
    const value = await open({
      multiple: false,
      directory: false,
      title: "选择 Photoshop.exe",
      defaultPath: photoshopPath || undefined,
      filters: [{ name: "Adobe Photoshop", extensions: ["exe"] }],
    });
    if (typeof value !== "string") return;
    setPhotoshopPath(value);
    localStorage.setItem(PHOTOSHOP_PATH_KEY, value);
  }

  async function chooseVideoSource() {
    const value = await open({ directory: true, multiple: false, defaultPath: videoSource || undefined, title: "选择视频目录" });
    if (typeof value !== "string") return;
    setVideoSource(value);
    localStorage.setItem(VIDEO_SOURCE_KEY, value);
  }

  async function chooseVideoTool(kind: "ffmpeg" | "gifsicle") {
    const value = await open({
      multiple: false,
      directory: false,
      title: kind === "ffmpeg" ? "选择 ffmpeg.exe" : "选择 gifsicle.exe",
      filters: [{ name: "可执行文件", extensions: ["exe"] }],
    });
    if (typeof value !== "string") return;
    if (kind === "ffmpeg") {
      setFfmpegPath(value);
      localStorage.setItem(VIDEO_FFMPEG_KEY, value);
    } else {
      setGifsiclePath(value);
      localStorage.setItem(VIDEO_GIFSICLE_KEY, value);
    }
  }

  async function assignVideoFolder(sourcePath: string) {
    const value = await open({ directory: true, multiple: false, defaultPath: root || undefined, title: "为视频指定产品目录" });
    if (typeof value !== "string") return;
    setVideoFiles((current) => current.map((item) => item.sourcePath === sourcePath
      ? { ...item, productFolder: value, matchSource: "manual", ambiguousFolders: [], status: "待处理" }
      : item));
  }

  function saveVideoSettings() {
    localStorage.setItem(VIDEO_SOURCE_KEY, videoSource);
    localStorage.setItem(VIDEO_FFMPEG_KEY, ffmpegPath);
    localStorage.setItem(VIDEO_GIFSICLE_KEY, gifsiclePath);
    localStorage.setItem(VIDEO_FPS_KEY, videoFps);
    localStorage.setItem(VIDEO_SCALE_KEY, videoScale);
    localStorage.setItem(VIDEO_LOSSY_KEY, videoLossy);
    localStorage.setItem(VIDEO_THREADS_KEY, videoThreads);
  }

  async function scanVideos() {
    if (!root) return notify("请先选择产品文件夹根目录");
    if (!videoSource.trim()) return notify("请先填写视频目录");
    saveVideoSettings();
    setVideoBusy(true);
    try {
      const result = await invoke<VideoScanResult>("scan_video_files", { source: videoSource, root });
      setVideoFiles(result.files);
      setSelectedVideoPaths(new Set(result.files.filter((item) => item.productFolder).map((item) => item.sourcePath)));
      setVideoLogs(result.logs);
      notify(`扫描完成：发现 ${result.files.length} 个待处理视频，已忽略 ${result.skippedProcessed} 个已处理视频`);
    } catch (error) {
      setVideoLogs((current) => [...current, `错误：${String(error)}`]);
      notify(String(error));
    } finally {
      setVideoBusy(false);
    }
  }

  async function processVideos() {
    if (!root) return notify("请先选择产品文件夹根目录");
    const matched = videoFiles.filter((item) => item.productFolder && selectedVideoPaths.has(item.sourcePath));
    if (!matched.length) return notify("请先勾选至少一个匹配产品的视频");
    saveVideoSettings();
    setVideoBusy(true);
    try {
      const result = await invoke<VideoProcessResult>("process_video_files", {
        root,
        files: matched,
        ffmpegPath,
        gifsiclePath,
        fps: Number(videoFps),
        scale: Number(videoScale),
        lossy: Number(videoLossy),
        threads: Number(videoThreads),
      });
      const completedPaths = new Set(result.files.filter((item) => item.status === "已完成").map((item) => item.sourcePath));
      setVideoFiles((current) => current
        .map((item) => result.files.find((processed) => processed.sourcePath === item.sourcePath) || item)
        .filter((item) => !completedPaths.has(item.sourcePath)));
      setSelectedVideoPaths((current) => new Set([...current].filter((path) => !completedPaths.has(path))));
      setVideoLogs(result.logs);
      notify(`视频处理完成：GIF ${result.converted} 个，视频复制 ${result.copied} 个，失败 ${result.failed} 个`);
    } catch (error) {
      setVideoLogs((current) => [...current, `错误：${String(error)}`]);
      notify(String(error));
    } finally {
      setVideoBusy(false);
    }
  }

  function toggleVideoSelection(sourcePath: string) {
    setSelectedVideoPaths((current) => {
      const next = new Set(current);
      if (next.has(sourcePath)) next.delete(sourcePath);
      else next.add(sourcePath);
      return next;
    });
  }

  async function archivePacks() {
    if (!root) return notify("请先选择产品文件夹根目录");
    if (!zipPaths.length) return notify("请先添加图包 ZIP");
    if (compressImages && !photoshopPath) return notify("请先选择 Photoshop.exe");
    localStorage.setItem(PACK_RULES_KEY, packRules);
    localStorage.setItem(PHOTOSHOP_COMPRESS_KEY, compressImages ? "1" : "0");
    localStorage.setItem(PHOTOSHOP_RECYCLE_KEY, moveOriginalsToRecycle ? "1" : "0");
    if (photoshopPath) localStorage.setItem(PHOTOSHOP_PATH_KEY, photoshopPath);
    setPackBusy(true);
    setPackLogs(["开始处理图包…"]);
    try {
      const result = await invoke<ArchivePacksResult>("archive_image_packs", {
        zipPaths,
        root,
        rulesText: packRules,
        useRules: usePackRules,
        deleteZip,
        compressImages,
        photoshopPath,
        moveOriginalsToRecycle,
      });
      setPackLogs(result.logs);
      if (deleteZip && result.deleted === zipPaths.length) setZipPaths([]);
      notify(`图包完成：成功 ${result.success}，跳过 ${result.skipped}，失败 ${result.failed}${result.photoshopStarted ? `；PS 压缩 ${result.compressedImages} 张` : ""}`);
    } catch (error) {
      setPackLogs((current) => [...current, `错误：${String(error)}`]);
      notify(String(error));
    } finally {
      setPackBusy(false);
    }
  }

  async function scanUploadPairs() {
    if (!root) return notify("请先选择产品文件夹根目录");
    setUploadBusy(true);
    try {
      const result = await invoke<UploadPair[]>("scan_upload_pairs", { root });
      setUploadPairs(result);
      setSelectedUploadSkus(new Set(result.filter((item) => item.status === "ready").map((item) => item.sku)));
      notify(`检查完成：${result.filter((item) => item.status === "ready").length} 个可上传，${result.filter((item) => item.status === "uploaded").length} 个历史已上传`);
    } catch (error) {
      notify(String(error));
    } finally {
      setUploadBusy(false);
    }
  }

  async function composeRandomPack() {
    if (!randomZipPaths.length) return notify("请先导入至少一个主图或详情图 ZIP");
    if (!randomOutputDir) return notify("请先选择导出目录");
    if (randomCompress && !photoshopPath) return notify("请先选择 Photoshop.exe");
    setRandomBusy(true);
    setRandomLogs(["开始随机抽取并组合…"]);
    try {
      const result = await invoke<ComposePackResult>("compose_random_pack", {
        zipPaths: randomZipPaths,
        outputDir: randomOutputDir,
        mainCount: Number(randomMainCount),
        detailCount: Number(randomDetailCount),
        compressImages: randomCompress,
        photoshopPath,
      });
      setRandomLogs(result.logs);
      if (result.missingSlots.length) {
        notify(`素材不完整，缺少：${result.missingSlots.join("、")}`);
      } else {
        setRandomZipPaths([]);
        notify(`随机组合完成：${result.selectedCount} 张${result.photoshopStarted ? "，Photoshop 已压缩" : ""}`);
      }
    } catch (error) {
      setRandomLogs((current) => [...current, String(error)]);
      notify(String(error));
    } finally {
      setRandomBusy(false);
    }
  }

  async function queueUploadPairs() {
    const targets = uploadPairs.filter((item) => item.status === "ready" && selectedUploadSkus.has(item.sku) && item.xlsxPath && item.zipPath);
    if (!targets.length) return notify("请先勾选完整的 XLSX + ZIP");
    if (!bridge.connected) {
      setShowConnect(true);
      return notify("请先连接 PLM 悬浮助手");
    }
    setUploadBusy(true);
    try {
      const count = await invoke<number>("queue_upload_pairs", {
        pairs: targets.map((item) => ({ sku: item.sku, xlsxPath: item.xlsxPath, zipPath: item.zipPath, signature: item.signature })),
        autoStart: uploadAutoStart,
      });
      setSelectedUploadSkus(new Set());
      notify(`已提交 ${count} 个魔法上传图包任务${uploadAutoStart ? "，已请求自动开始" : "，请在悬浮助手中开始"}`);
    } catch (error) {
      notify(String(error));
    } finally {
      setUploadBusy(false);
    }
  }

  async function emptyPackRecycle() {
    if (!root) return notify("请先选择产品文件夹根目录");
    if (!window.confirm("将永久删除各产品“套图/回收站”中的原图，且无法恢复。请确认已核对压缩图无误。")) return;
    setPackBusy(true);
    try {
      const result = await invoke<EmptyRecycleResult>("empty_pack_recycle", { root });
      const message = result.deletedFolders
        ? `已清空外部回收站，永久删除 ${result.deletedFiles} 个文件（位置：${result.recycleRoot}）`
        : `外部回收站没有待清理文件（位置：${result.recycleRoot}）`;
      setPackLogs((current) => [...current, message]);
      notify(message);
    } catch (error) {
      notify(String(error));
    } finally {
      setPackBusy(false);
    }
  }

  async function scanOrganizer() {
    if (!root) return notify("请先选择工作目录");
    if (!organizeRenameImages && !organizeRenameFolders) return notify("请至少选择一种整理规则");
    setOrganizeBusy(true);
    try {
      const result = await invoke<FileOrganizeScanResult>("scan_file_organizer", {
        root,
        renameSkuImages: organizeRenameImages,
        renameProductFolders: organizeRenameFolders,
      });
      setOrganizeItems(result.items);
      setOrganizeLogs([
        `扫描完成：发现 ${result.items.length} 项；可执行 ${result.items.filter((item) => item.status === "ready").length} 项`,
        ...result.items.filter((item) => item.status !== "ready").map((item) => `${item.status === "conflict" ? "冲突" : "跳过"}：${item.sourcePath} · ${item.message}`),
      ]);
      notify(`扫描完成：${result.items.filter((item) => item.status === "ready").length} 项可整理`);
    } catch (error) {
      setOrganizeLogs((current) => [...current, `错误：${String(error)}`]);
      notify(String(error));
    } finally {
      setOrganizeBusy(false);
    }
  }

  async function applyOrganizer() {
    if (!root) return notify("请先选择工作目录");
    const targets = organizeItems.filter((item) => item.status === "ready");
    if (!targets.length) return notify("请先扫描出可整理项目");
    if (!window.confirm(`将批量重命名 ${targets.length} 项文件/目录，目标已存在的项目会跳过。是否继续？`)) return;
    setOrganizeBusy(true);
    try {
      const result = await invoke<FileOrganizeResult>("organize_files", {
        root,
        operations: targets.map((item) => ({ sourcePath: item.sourcePath, targetPath: item.targetPath })),
      });
      setOrganizeLogs(result.logs);
      notify(`文件整理完成：成功 ${result.renamed}，跳过 ${result.skipped}，失败 ${result.failed}`);
      const refreshed = await invoke<FileOrganizeScanResult>("scan_file_organizer", {
        root,
        renameSkuImages: organizeRenameImages,
        renameProductFolders: organizeRenameFolders,
      });
      setOrganizeItems(refreshed.items);
    } catch (error) {
      setOrganizeLogs((current) => [...current, `错误：${String(error)}`]);
      notify(String(error));
    } finally {
      setOrganizeBusy(false);
    }
  }

  async function scanParameterSamples() {
    if (!root) return notify("请先选择工作目录");
    setParameterSampleBusy(true);
    setParameterSampleLogs(["正在递归扫描产品目录并自动配对样本…"]);
    try {
      const result = await invoke<ParameterSampleScanResult>("scan_parameter_samples", { root });
      setParameterSamples(result.items);
      setParameterSampleIndexPath(result.indexPath);
      setParameterSampleLogs(result.logs);
      notify(`样本整理完成：完整 ${result.ready} 组，待补全 ${result.incomplete} 组，需核对 ${result.ambiguous} 组`);
    } catch (error) {
      setParameterSampleLogs((current) => [...current, `错误：${String(error)}`]);
      notify(String(error));
    } finally {
      setParameterSampleBusy(false);
    }
  }

  async function scanLabelCheck() {
    if (!root) return notify("请先选择工作目录");
    const targetFolderName = labelCheckTargetFolder.trim();
    if (!targetFolderName) return notify("请输入 03 纸盒标签名称");
    localStorage.setItem(LABEL_CHECK_TARGET_KEY, targetFolderName);
    setLabelCheckTargetFolder(targetFolderName);
    setLabelCheckBusy(true);
    try {
      const result = await invoke<LabelCheckScanResult>("scan_label_check", { root, targetFolderName });
      setLabelCheckItems(result.pending);
      setLabelCheckRecords(result.confirmed);
      setLabelCheckConfirmedItems(result.confirmedItems);
      setLabelCheckHistoryPath(result.historyPath);
      setLabelCheckLogs(result.logs);
      notify(`扫描完成：待检查 ${result.pending.length} 个，已确认 ${result.confirmed.length} 个`);
    } catch (error) {
      setLabelCheckLogs((current) => [...current, `错误：${String(error)}`]);
      notify(String(error));
    } finally {
      setLabelCheckBusy(false);
    }
  }

  async function confirmLabelCheck(item: LabelCheckItem) {
    if (item.status !== "ready") return notify(item.message);
    const targetFolderName = labelCheckTargetFolder.trim();
    if (!targetFolderName) return notify("请输入 03 纸盒标签名称");
    if (!window.confirm(`确认 ${item.sku} 的纸盒标签文件？\n\nJPG/PNG 仅用于检查预览；印刷 PSD 会移到产品根目录，其余正确文件会移入“${targetFolderName}”。`)) return;
    setLabelCheckBusy(true);
    try {
      const result = await invoke<LabelCheckConfirmResult>("confirm_label_check", {
        root,
        targetFolderName,
        sourcePath: item.sourcePath,
        sku: item.sku,
      });
      const refreshed = await invoke<LabelCheckScanResult>("scan_label_check", { root, targetFolderName });
      setLabelCheckItems(refreshed.pending);
      setLabelCheckRecords(refreshed.confirmed);
      setLabelCheckConfirmedItems(refreshed.confirmedItems);
      setLabelCheckHistoryPath(refreshed.historyPath);
      setLabelCheckLogs([...result.logs, ...refreshed.logs]);
      notify(`已确认 ${result.record.sku}，正确文件已移入 ${targetFolderName}`);
    } catch (error) {
      setLabelCheckLogs((current) => [...current, `错误：${String(error)}`]);
      notify(String(error));
    } finally {
      setLabelCheckBusy(false);
    }
  }

  async function dragLabelCheckProduct(item: LabelCheckItem, iconPath: string) {
    if (labelCheckDraggingSku) return;
    const uploadFolder = item.sourcePath;
    setLabelCheckDraggingSku(item.sku);
    setLabelCheckLogs((current) => [...current, `开始拖动待上传文件夹：${uploadFolder}`]);
    try {
      await startDrag({ item: [uploadFolder], icon: iconPath, mode: "copy" }, (payload) => {
        const message = payload.result === "Dropped"
          ? `已把 ${item.sku} 交给目标应用`
          : `已取消拖动 ${item.sku}`;
        setLabelCheckLogs((current) => [...current, message]);
      });
    } catch (error) {
      const message = `拖动失败：${String(error)}`;
      setLabelCheckLogs((current) => [...current, message]);
      notify(message);
    } finally {
      setLabelCheckDraggingSku("");
    }
  }

  async function openLabelCheckFolder(path: string, label: string) {
    try {
      await invoke("open_local_folder", { path });
      setLabelCheckLogs((current) => [...current, `已打开${label}：${path}`]);
    } catch (error) {
      const message = `无法打开${label}：${String(error)}`;
      setLabelCheckLogs((current) => [...current, message]);
      notify(message);
    }
  }

  async function copyLabelCheckCodes() {
    if (!labelCheckRecords.length) return notify("还没有已确认的产品编码");
    await navigator.clipboard.writeText(labelCheckRecords.map((record) => record.sku).join("\n"));
    notify(`已复制 ${labelCheckRecords.length} 个已确认编码`);
  }

  async function assignFolder(row: ProductPreview) {
    const value = await open({ directory: true, multiple: false, defaultPath: root || undefined, title: `为 ${row.product.sku} 指定产品目录` });
    if (typeof value !== "string") return;
    const next = { ...mappings, [row.product.sku]: value };
    setMappings(next);
    localStorage.setItem(MAP_KEY, JSON.stringify(next));
  }

  async function requestSnapshot() {
    if (!bridge.connected) {
      setShowConnect(true);
      notify("请先连接 PLM 悬浮助手");
      return;
    }
    setSyncing(true);
    try {
      await invoke("request_snapshot");
      notify("已向悬浮助手请求最新定稿数据");
    } finally {
      window.setTimeout(() => setSyncing(false), 800);
    }
  }

  function toggle(sku: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }

  async function generateSelected() {
    const targets = rows.filter((row) => selected.has(row.product.sku));
    if (!targets.length) return notify("请先选择至少一个 SKU");
    if (!bridge.connected) {
      setShowConnect(true);
      return notify("生成资产前需要连接悬浮助手");
    }
    const unresolved = targets.filter((row) => !row.folder);
    if (unresolved.length) {
      notify(`还有 ${unresolved.length} 个 SKU 未指定目录`);
      await assignFolder(unresolved[0]);
      return;
    }
    for (const row of targets) {
      setJobs((current) => ({ ...current, [row.product.sku]: { state: "queued", message: "等待悬浮助手生成三类资产" } }));
      try {
        await invoke("request_excel", { product: row.product, folder: row.folder, overwrite, auto: false });
      } catch (error) {
        setJobs((current) => ({ ...current, [row.product.sku]: { state: "error", message: String(error) } }));
      }
    }
    notify(`已提交 ${targets.length} 个产品`);
  }

  async function copyToken() {
    await navigator.clipboard.writeText(bridge.token);
    notify("连接码已复制");
  }

  function toggleCompactTop() {
    setCompactTop((current) => {
      const next = !current;
      localStorage.setItem(COMPACT_TOP_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className={`app-shell ${compactTop ? "top-collapsed" : ""}`}>
      <header className="topbar">
        <div className="brand-mark"><Sparkles size={20} /></div>
        <div className="brand-copy">
          <small className="app-version">v{APP_VERSION}</small>
          <strong>PLM 产品资产工作台</strong>
          <span>定稿资料一站式生成与归档</span>
        </div>
        <div className="top-actions">
          <button className={`connection-pill ${bridge.connected ? "online" : ""}`} onClick={() => setShowConnect(true)}>
            {bridge.connected ? <Link2 size={15} /> : <Unplug size={15} />}
            {bridge.connected ? `助手已连接 ${bridge.scriptVersion || ""}` : "连接悬浮助手"}
          </button>
          <button className="icon-button" onClick={() => setShowConnect(true)} aria-label="连接设置"><Settings2 size={19} /></button>
        </div>
      </header>

      <main>
        {!compactTop && <section className="hero-panel">
          <div>
            <span className="eyebrow">LOCAL PRODUCTION DESK</span>
            <h1>把已定稿产品，整理成可交付成品</h1>
            <p>扫描本地产品目录，核对全部 SKU，一次生成 Excel、英文参数图和尺寸图。</p>
          </div>
          <div className="hero-actions">
            <button className="secondary" onClick={chooseRoot}><FolderOpen size={17} />{root ? "更换产品根目录" : "选择产品根目录"}</button>
            <button className="primary" onClick={requestSnapshot} disabled={syncing}>
              <RefreshCw size={17} className={syncing ? "spin" : ""} />同步已定稿产品
            </button>
          </div>
          {root && <button className="path-chip" onClick={() => openPath(root)} title={root}><FolderOpen size={14} />{root}</button>}
        </section>}

        <nav className="workspace-tabs">
          <button className={workspaceView === "assets" ? "active" : ""} onClick={() => setWorkspaceView("assets")}><FileSpreadsheet size={16} />定稿资产</button>
          <button className={workspaceView === "packs" ? "active" : ""} onClick={() => setWorkspaceView("packs")}><Archive size={16} />图包归档</button>
          <button className={workspaceView === "random" ? "active" : ""} onClick={() => setWorkspaceView("random")}><RotateCw size={16} />随机组合</button>
          <button className={workspaceView === "organize" ? "active" : ""} onClick={() => setWorkspaceView("organize")}><Pencil size={16} />文件整理</button>
          <button className={workspaceView === "parameter-samples" ? "active" : ""} onClick={() => setWorkspaceView("parameter-samples")}><FileImage size={16} />参数样本</button>
          <button className={workspaceView === "label-check" ? "active" : ""} onClick={() => setWorkspaceView("label-check")}><Eye size={16} />纸盒标签检查</button>
          <button className={workspaceView === "upload" ? "active" : ""} onClick={() => setWorkspaceView("upload")}><Upload size={16} />检查上传</button>
          <button className={workspaceView === "videos" ? "active" : ""} onClick={() => setWorkspaceView("videos")}><Film size={16} />视频转动图</button>
          <button className="collapse-top" onClick={toggleCompactTop} title={compactTop ? "展开顶部概览" : "收起顶部概览"}>
            {compactTop ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            {compactTop ? "展开概览" : "收起概览"}
          </button>
        </nav>

        <section className={`metrics ${workspaceView !== "assets" || compactTop ? "is-hidden" : ""}`}>
          <article><span>全部定稿</span><strong>{rows.length}</strong><small>来自悬浮助手</small></article>
          <article className="green"><span>可以生成</span><strong>{counts.ready}</strong><small>资料与目录已就绪</small></article>
          <article className="amber"><span>需要确认</span><strong>{counts.missing}</strong><small>缺图、参数或目录</small></article>
          <article className="violet"><span>已完成收纳</span><strong>{counts.complete}</strong><small>纸盒、标签、图包均已操作</small></article>
        </section>

        <section className={`work-panel ${workspaceView !== "assets" ? "is-hidden" : ""}`}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">FINALIZED QUEUE</span>
              <h2>定稿生产队列</h2>
              <p>先预览目录与缺失项，再选择本次需要生成的产品。</p>
            </div>
            <div className="panel-controls">
              <label className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 SKU、品牌或产品名" /></label>
              <label className="toggle"><input type="checkbox" checked={overwrite} onChange={(event) => setOverwrite(event.target.checked)} /><span />覆盖已有文件</label>
            </div>
          </div>

          <div className="table-tools">
            <div className="queue-view-tabs">
              <button className={queueView === "active" ? "active" : ""} onClick={() => { setQueueView("active"); setSelected(new Set()); }}>待处理 <b>{rows.length - counts.complete}</b></button>
              <button className={queueView === "complete" ? "active" : ""} onClick={() => { setQueueView("complete"); setSelected(new Set()); }}>已完成收纳 <b>{counts.complete}</b></button>
            </div>
            <button onClick={() => setSelected(new Set(visible.map((row) => row.product.sku)))}>全选当前</button>
            <button onClick={() => setSelected(new Set())}>取消选择</button>
            <span>已选择 <b>{selected.size}</b> 个产品</span>
          </div>

          <div className={`product-table ${queueView === "complete" ? "no-batch" : ""}`}>
            <div className="table-row table-header">
              <span />
              <span>SKU / 产品</span>
              <span>本地素材</span>
              <span>目标成品</span>
              <span>状态</span>
              <span />
            </div>
            {visible.map((row) => {
              const status = statusFor(row, jobs[row.product.sku]);
              return (
                <div className={`table-row ${selected.has(row.product.sku) ? "selected" : ""}`} key={row.product.sku}>
                  <button className={`check-button ${selected.has(row.product.sku) ? "checked" : ""}`} onClick={() => toggle(row.product.sku)}>
                    {selected.has(row.product.sku) && <Check size={14} />}
                  </button>
                  <div className="product-cell">
                    <ProductThumbnail row={row} />
                    <div className="product-copy">
                      <strong>{row.product.sku}</strong>
                      <span>{[row.product.brand, row.product.name].filter(Boolean).join(" · ") || "未命名产品"}</span>
                      <small>{row.product.finalizedAt || "已定稿"}</small>
                    </div>
                  </div>
                  <div className="asset-cell">
                    <span className={row.transparentImage ? "ok" : "missing"}><FileImage size={16} />{row.transparentImage ? "透明.png" : "缺少透明.png"}</span>
                    <small>{row.folder ? `${row.folder}${row.matchSource === "product-name" ? "（按产品名匹配）" : ""}` : (row.ambiguousFolders.length > 1 ? `发现 ${row.ambiguousFolders.length} 个同名目录，请手动指定` : "尚未匹配产品目录")}</small>
                  </div>
                  <div className="deliverables">
                    <span className={row.excelExists ? "complete" : ""}><FileSpreadsheet size={15} />Excel</span>
                    <span className={row.skuImageExists ? "complete" : ""}><FileImage size={15} />SKU图</span>
                    <button className={row.englishExists ? "complete" : ""} disabled={!row.englishExists} onClick={() => setAssetPreview({ row, kind: "english" })}><Eye size={15} />英文参数图</button>
                    <button className={row.sizeExists ? "complete" : ""} disabled={!row.sizeExists && !row.transparentImage} onClick={() => setAssetPreview({ row, kind: "size" })}>{row.sizeExists ? <Eye size={15} /> : <Pencil size={15} />}尺寸图</button>
                  </div>
                  <div><span className={`status ${status.tone}`}>{status.tone === "working" && <LoaderCircle size={13} className="spin" />}{status.label}</span></div>
                  <button className="row-action" onClick={() => row.folder ? openPath(row.folder) : assignFolder(row)} title={row.folder ? "打开目录" : "指定目录"}>
                    {row.folder ? <ChevronRight size={18} /> : <FolderOpen size={18} />}
                  </button>
                </div>
              );
            })}
            {!visible.length && (
              <div className="empty-state">
                {queueView === "complete" ? <Check size={28} /> : <CircleAlert size={28} />}
                <strong>{queueView === "complete" ? "还没有已完成产品" : (root ? "待处理队列已清空" : "请先选择产品文件夹根目录")}</strong>
                <span>{queueView === "complete" ? "今日工作台中的纸盒、标签和图包都操作过后会自动收纳到这里" : (root ? "纸盒、标签、图包三项都完成的产品已移入“已完成收纳”" : "工作台会扫描其中的 SKU 产品文件夹")}</span>
              </div>
            )}
          </div>

          {queueView === "active" && <div className="batch-bar">
            <div>
              <strong>{selected.size ? `准备处理 ${selected.size} 个产品` : "选择产品后开始批量生成"}</strong>
              <span>已有文件默认跳过；缺少透明图时仍可生成 Excel。</span>
            </div>
            <button className="primary large" onClick={generateSelected}><Play size={18} fill="currentColor" />批量生成所选资产</button>
          </div>}
        </section>

        {workspaceView === "random" && (
          <section className="random-pack-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">RANDOM PACK COMPOSER</span>
                <h2>随机组合图包</h2>
                <p>导入多个主图/详情图 ZIP，标准化命名后每个编号随机抽取一张，直接导出到所选目录的主图、详情图文件夹。</p>
              </div>
              <button className="pack-root" onClick={chooseRandomOutputDir}><FolderOpen size={16} />{randomOutputDir || "选择导出目录"}</button>
            </div>
            <div className="random-pack-toolbar">
              <button className="secondary" onClick={chooseRandomZipPacks} disabled={randomBusy}><Upload size={16} />导入 ZIP</button>
              <label><span>主图数量</span><input type="number" min="1" max="6" value={randomMainCount} onChange={(event) => setRandomMainCount(event.target.value)} /></label>
              <label><span>详情图数量</span><input type="number" min="1" max="10" value={randomDetailCount} onChange={(event) => setRandomDetailCount(event.target.value)} /></label>
              <label className="toggle"><input type="checkbox" checked={randomCompress} onChange={(event) => setRandomCompress(event.target.checked)} /><span />组合后用 Photoshop 压缩</label>
              <button className="primary" onClick={composeRandomPack} disabled={randomBusy || !randomZipPaths.length}>{randomBusy ? <LoaderCircle size={16} className="spin" /> : <RotateCw size={16} />}开始随机组合</button>
            </div>
            <div className="random-pack-drop" onClick={chooseRandomZipPacks} role="button" tabIndex={0}>
              <Archive size={25} />
              <strong>{randomZipPaths.length ? `已添加 ${randomZipPaths.length} 个 ZIP，可继续拖入` : "拖入主图或详情图 ZIP"}</strong>
              <span>支持从资源管理器直接拖入；文件名或 ZIP 内部文件名需要能识别主图/详情图编号</span>
            </div>
            {randomCompress && <div className="random-pack-photoshop"><span>Photoshop</span><input value={photoshopPath} onChange={(event) => setPhotoshopPath(event.target.value)} placeholder="Photoshop.exe 路径" /><button onClick={choosePhotoshop}>选择 Photoshop</button><small>压缩后直接写入主图、详情图文件夹，原始 ZIP 不会删除。</small></div>}
            <div className="random-pack-list">
              {!randomZipPaths.length && <div className="empty-state"><Archive size={28} /><strong>还没有导入 ZIP</strong><span>主图 ZIP 和详情图 ZIP 可以混合导入。</span></div>}
              {randomZipPaths.map((path) => <div key={path}><Archive size={15} /><span title={path}>{path}</span><button onClick={() => setRandomZipPaths((current) => current.filter((item) => item !== path))}><X size={14} /></button></div>)}
            </div>
            <div className="random-pack-console"><div><strong>抽取日志</strong><span>{randomLogs.length} 条</span></div><pre>{randomLogs.join("\n")}</pre></div>
          </section>
        )}

        {workspaceView === "organize" && (
          <section className="organize-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">FILE ORGANIZER</span>
                <h2>文件整理</h2>
                <p>扫描工作目录下的产品文件夹，预览并批量规范 SKU 图片与产品目录名称。</p>
              </div>
              <button className="pack-root" onClick={chooseRoot}><FolderOpen size={16} />{root || "选择工作目录"}</button>
            </div>
            <div className="organize-toolbar">
              <label className="toggle"><input type="checkbox" checked={organizeRenameImages} onChange={(event) => setOrganizeRenameImages(event.target.checked)} /><span />SKU.jpg → 编码.jpg</label>
              <label className="toggle"><input type="checkbox" checked={organizeRenameFolders} onChange={(event) => setOrganizeRenameFolders(event.target.checked)} /><span />填充产品子目录名称</label>
              <button className="secondary" onClick={scanOrganizer} disabled={organizeBusy}><ScanLine size={16} />{organizeBusy ? "处理中…" : "扫描预览"}</button>
              <button className="primary" onClick={applyOrganizer} disabled={organizeBusy || !organizeItems.some((item) => item.status === "ready")}><Pencil size={16} />执行批量整理</button>
            </div>
            <div className="organize-examples">
              <div><strong>SKU 图片</strong><span><code>Feimuko 舒适义齿套装 SKU00047352\SKU.jpg</code> → <code>SKU00047352.jpg</code></span></div>
              <div><strong>产品子目录</strong><span><code>Feimuko 夜间睡眠牙套 SKU00049129\品牌 产品名-编码</code> → <code>Feimuko 夜间睡眠牙套-SKU00049129</code></span></div>
            </div>
            <div className="organize-summary"><span>扫描到 {organizeItems.length} 项</span><span>可执行 {organizeItems.filter((item) => item.status === "ready").length} 项</span><span>冲突/跳过 {organizeItems.filter((item) => item.status !== "ready").length} 项</span></div>
            <div className="organize-list">
              {!organizeItems.length && <div className="empty-state"><Pencil size={28} /><strong>点击“扫描预览”开始</strong><span>工作台只会在当前工作目录内操作，不覆盖已存在的目标名称。</span></div>}
              {organizeItems.map((item) => (
                <div className={`organize-row ${item.status}`} key={`${item.kind}:${item.sourcePath}`}>
                  <span className="organize-kind">{item.kind === "sku-image" ? "SKU 图片" : "产品子目录"}</span>
                  <div><strong title={item.sourcePath}>{item.sourceName}</strong><small title={item.sourcePath}>{item.sourcePath}</small></div>
                  <div><strong title={item.targetPath}>{item.targetName}</strong><small title={item.targetPath}>{item.targetPath}</small></div>
                  <span className={`status ${item.status === "ready" ? "success" : item.status === "conflict" ? "danger" : "neutral"}`}>{item.status === "ready" ? "待整理" : item.status === "conflict" ? "目标冲突" : "已符合"}</span>
                </div>
              ))}
            </div>
            <div className="organize-console"><strong>整理日志</strong><pre>{organizeLogs.join("\n")}</pre></div>
          </section>
        )}

        {workspaceView === "parameter-samples" && (
          <section className="parameter-sample-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PARAMETER SAMPLE INDEX</span>
                <h2>参数图学习样本</h2>
                <p>按产品根目录自动配对透明 PNG、正确尺寸图和 Excel；旧目录可从内部文件推断 SKU，不使用品类，也不会移动原文件。</p>
              </div>
              <button className="pack-root" onClick={chooseRoot}><FolderOpen size={16} />{root || "选择工作目录"}</button>
            </div>
            <div className="parameter-sample-toolbar">
              <button className="primary" onClick={scanParameterSamples} disabled={parameterSampleBusy}>
                {parameterSampleBusy ? <LoaderCircle size={16} className="spin" /> : <ScanLine size={16} />}
                {parameterSampleBusy ? "正在整理…" : "扫描并整理样本"}
              </button>
              <span>优先匹配 <code>透明.png</code>、<code>套图/产品参数图/尺寸.jpg</code> 和带 SKU 的 XLSX</span>
              {parameterSampleIndexPath && <button onClick={() => openPath(parameterSampleIndexPath)}><FileSpreadsheet size={15} />打开样本索引</button>}
            </div>
            <div className="parameter-sample-summary">
              <span>产品目录 {parameterSamples.length}</span>
              <span>完整样本 {parameterSamples.filter((item) => item.status === "ready").length}</span>
              <span>待补全 {parameterSamples.filter((item) => item.status === "missing").length}</span>
              <span>需核对 {parameterSamples.filter((item) => item.status === "ambiguous").length}</span>
              <small title={parameterSampleIndexPath}>{parameterSampleIndexPath || "扫描后会在工作目录生成“参数图学习样本索引.json”"}</small>
            </div>
            <div className="parameter-sample-list">
              {!parameterSamples.length && <div className="empty-state"><FileImage size={28} /><strong>点击“扫描并整理样本”开始</strong><span>文件保持原位，工作台只建立配对索引。</span></div>}
              {parameterSamples.map((item) => (
                <article className={`parameter-sample-row ${item.status}`} key={`${item.sku}:${item.productPath}`}>
                  <div className="parameter-sample-product">
                    <strong>{item.sku || "未识别 SKU"}</strong>
                    <span title={item.productName}>{item.productName}</span>
                    <small title={item.productPath}>{item.productPath}</small>
                  </div>
                  <div className={`parameter-sample-file ${item.transparentPath ? "found" : "missing"}`}>
                    {item.transparentPath ? <img src={convertFileSrc(item.transparentPath)} alt="透明原图" /> : <FileImage size={24} />}
                    <div><strong>透明原图</strong><span title={item.transparentPath || ""}>{localFileName(item.transparentPath)}</span><small>{item.transparentCandidates} 个候选 · {item.transparentPath ? (item.transparentHasAlpha ? "有透明通道" : "未检测到透明通道") : "未找到"}</small></div>
                  </div>
                  <div className={`parameter-sample-file ${item.parameterPath ? "found" : "missing"}`}>
                    {item.parameterPath ? <img src={convertFileSrc(item.parameterPath)} alt="正确尺寸图" /> : <FileImage size={24} />}
                    <div><strong>正确尺寸图</strong><span title={item.parameterPath || ""}>{localFileName(item.parameterPath)}</span><small>{item.parameterCandidates} 个候选</small></div>
                  </div>
                  <div className={`parameter-sample-file excel ${item.excelPath ? "found" : "missing"}`}>
                    <FileSpreadsheet size={24} />
                    <div><strong>尺寸 Excel</strong><span title={item.excelPath || ""}>{localFileName(item.excelPath)}</span><small>{item.excelCandidates} 个候选</small></div>
                  </div>
                  <div className="parameter-sample-result">
                    <span className={`status ${item.status === "ready" ? "success" : item.status === "ambiguous" ? "warning" : "danger"}`}>{item.status === "ready" ? "已配对" : item.status === "ambiguous" ? "需核对" : "待补全"}</span>
                    <small>{item.message}</small>
                    <button onClick={() => openPath(item.productPath)}><FolderOpen size={14} />打开目录</button>
                  </div>
                </article>
              ))}
            </div>
            <div className="parameter-sample-console"><strong>样本整理日志</strong><pre>{parameterSampleLogs.join("\n")}</pre></div>
          </section>
        )}

        {workspaceView === "label-check" && (
          <section className="label-check-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">BOX LABEL CHECK</span>
                <h2>纸盒标签文件检查</h2>
                <p>逐个查看暂存目录里的印刷预览图，确认后将正确文件归档到 03 文件夹，并把印刷 PSD 单独移回产品根目录。</p>
              </div>
              <button className="pack-root" onClick={chooseRoot}><FolderOpen size={16} />{root || "选择工作目录"}</button>
            </div>
            <div className="label-check-toolbar">
              <label className="label-check-target"><span>归档目标文件夹</span><input value={labelCheckTargetFolder} onChange={(event) => setLabelCheckTargetFolder(event.target.value)} onBlur={() => localStorage.setItem(LABEL_CHECK_TARGET_KEY, labelCheckTargetFolder.trim() || DEFAULT_LABEL_CHECK_TARGET)} /></label>
              <button className="secondary" onClick={scanLabelCheck} disabled={labelCheckBusy}><ScanLine size={16} />{labelCheckBusy ? "处理中…" : "扫描待检查产品"}</button>
              <button className="primary" onClick={copyLabelCheckCodes} disabled={labelCheckBusy || !labelCheckRecords.length}><Copy size={16} />复制全部已确认编码</button>
            </div>
            <div className="label-check-summary"><span>待检查 {labelCheckItems.length} 个</span><span>已确认 {labelCheckRecords.length} 个</span><span>左右展示纸盒与标签/印刷 JPG/PNG</span><span>印刷 PSD 为副产品；纸盒 PSD 是正确文件</span></div>
            <div className="label-check-filter-bar">
              <span className="label-check-filter-title">显示卡片</span>
              <div className="label-check-filter-buttons">
                <button className={labelCheckFilter === "pending" ? "active" : ""} onClick={() => setLabelCheckFilter("pending")}>待检查 ({labelCheckItems.length})</button>
                <button className={labelCheckFilter === "confirmed" ? "active" : ""} onClick={() => setLabelCheckFilter("confirmed")}>已确定 ({labelCheckConfirmedItems.length})</button>
                <button className={labelCheckFilter === "all" ? "active" : ""} onClick={() => setLabelCheckFilter("all")}>全部 ({labelCheckItems.length + labelCheckConfirmedItems.length})</button>
              </div>
              <span className="label-check-drag-note">按住卡片底部的“拖到网盘”把手，拖动当前暂存/入口文件夹；普通卡片区域不会触发拖动。</span>
            </div>
            <div className="label-check-list">
              {!visibleLabelCheckItems.length && <div className="empty-state"><Eye size={28} /><strong>{labelCheckFilter === "confirmed" ? "还没有已确定卡片" : "点击“扫描待检查产品”开始"}</strong><span>{labelCheckFilter === "confirmed" ? "确认并移动后，卡片会保留在“已确定”筛选中。" : "工作台会查找产品目录中尚未归档的纸盒标签暂存文件，并保留历史确认记录。"}</span></div>}
              {visibleLabelCheckItems.map((item) => {
                const previewGroups = labelPreviewGroups(item);
                return (
                <article
                  className={`label-check-card ${item.status}`}
                  key={`${item.status}:${item.sku}:${item.sourcePath}`}
                >
                  <header>
                    <div><span className="eyebrow">{item.sku}</span><strong>{item.productName}</strong><small title={item.sourcePath}>品牌：{item.brand || "未识别"} · {item.sourceName}</small></div>
                    <span className={`status ${item.status === "ready" ? "success" : item.status === "confirmed" ? "success" : item.status === "conflict" ? "danger" : "warning"}`}>{item.status === "confirmed" ? "已确定" : labelCheckStatusLabel(item.status)}</span>
                  </header>
                  <div className="label-check-sides">
                    {[{ title: "纸盒", files: previewGroups.box }, { title: "标签 / 印刷", files: previewGroups.label }].map((side) => (
                      <div className="label-check-side" key={side.title}>
                        <strong>{side.title}</strong>
                        <div className="label-check-side-images">
                          {side.files.map((file) => (
                            <button className="label-check-image" key={file.path} onClick={() => setLabelCheckPreviewItem(item)} title="点击打开左右视图并放大查看细节">
                              <img src={convertFileSrc(file.path)} alt={file.name} />
                              <span title={file.name}>{file.name}</span>
                            </button>
                          ))}
                          {!side.files.length && <div className="label-check-no-image"><FileImage size={19} /><span>无 JPG/PNG</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="label-check-file-groups">
                    <div><strong>正确文件 → {item.targetPath}</strong><span>{item.uploadFiles.length ? item.uploadFiles.map((file) => file.name).join(" · ") : "没有识别到可归档文件"}</span></div>
                    <div><strong>印刷 PSD 副产品 → 产品根目录</strong><span>{item.psdFiles.length ? item.psdFiles.map((file) => file.name).join(" · ") : "无印刷 PSD"}</span></div>
                    {item.otherFiles.length > 0 && <div className="label-check-warning"><strong>未识别文件（确认后会留在暂存目录）</strong><span>{item.otherFiles.map((file) => file.name).join(" · ")}</span></div>}
                  </div>
                  <p className="label-check-message">{item.message}</p>
                  <div className="label-check-card-actions"><button className="secondary" onClick={() => void openLabelCheckFolder(item.status === "confirmed" ? item.targetPath : item.sourcePath, item.status === "confirmed" ? " 03 文件夹" : "暂存目录")}><FolderOpen size={15} />{item.status === "confirmed" ? "打开 03 文件夹" : "打开暂存目录"}</button><button className="secondary" onClick={() => void openLabelCheckFolder(labelCheckProductFolder(item), "完整产品文件夹")}><FolderOpen size={15} />打开完整产品文件夹</button><button
                    className={`label-check-drag-handle ${labelCheckDraggingSku === item.sku ? "dragging" : ""}`}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      event.preventDefault();
                      event.stopPropagation();
                      const iconPath = previewGroups.box[0]?.path || previewGroups.label[0]?.path;
                      if (!iconPath) return notify("没有可用的拖动预览图");
                      void dragLabelCheckProduct(item, iconPath);
                    }}
                    disabled={Boolean(labelCheckDraggingSku)}
                    title="按住并拖到网盘应用，传递当前暂存/入口文件夹"
                  ><GripVertical size={15} />{labelCheckDraggingSku === item.sku ? "拖动中…" : "拖到网盘"}</button>{item.status === "confirmed" ? <span className="label-check-confirmed-note"><Check size={14} />正确文件已归档</span> : <button className="primary" onClick={() => confirmLabelCheck(item)} disabled={labelCheckBusy || item.status !== "ready"}><Check size={15} />确认并移动</button>}</div>
                </article>
                );
              })}
            </div>
            <section className="label-check-history">
              <div className="label-check-history-heading"><div><strong>已确认记录</strong><span>记录会保存在本机应用数据中，重新扫描或重启后仍会保留。</span></div><button className="secondary" onClick={copyLabelCheckCodes} disabled={!labelCheckRecords.length}><Copy size={15} />复制编码</button></div>
              <textarea readOnly value={labelCheckRecords.map((record) => record.sku).join("\n")} onFocus={(event) => event.currentTarget.select()} placeholder="扫描并确认产品后，这里会生成可全选复制的编码列表" />
              <small>记录文件：{labelCheckHistoryPath || "扫描后显示"}</small>
              <div className="label-check-history-list">
                {labelCheckRecords.map((record) => <div key={`${record.sku}:${record.productPath}`}><strong>{record.sku}</strong><span>{record.productName}</span><small>{formatLabelCheckTime(record.confirmedAtMs)} · 归档 {record.movedFiles.length} 个 · 印刷 PSD {record.movedPsdFiles.length} 个</small></div>)}
              </div>
            </section>
            <div className="label-check-console"><strong>检查日志</strong><pre>{labelCheckLogs.join("\n")}</pre></div>
          </section>
        )}
        {labelCheckPreviewItem && <LabelCheckPreviewModal item={labelCheckPreviewItem} onClose={() => setLabelCheckPreviewItem(null)} />}

        {workspaceView === "packs" && (
          <section className="pack-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">IMAGE PACK ARCHIVE</span>
                <h2>批量图包处理</h2>
                <p>从 ZIP 文件名识别 SKU，匹配产品目录，解压并按规则重命名到“套图”；未匹配图片会按文件名顺序补到缺失编号。</p>
              </div>
              <button className="pack-root" onClick={chooseRoot}><FolderOpen size={16} />{root || "选择产品根目录"}</button>
            </div>
            <div className="pack-grid">
              <div className="pack-card">
                <div className="pack-card-title"><div><strong>待处理 ZIP</strong><span>支持点击添加或直接拖入窗口</span></div><button onClick={chooseZipPacks}><Upload size={15} />添加 ZIP</button></div>
                <div className="zip-drop" onClick={chooseZipPacks}>
                  <FileArchive size={30} />
                  <strong>{zipPaths.length ? `已添加 ${zipPaths.length} 个图包` : "拖入图包 ZIP"}</strong>
                  <span>文件名需要包含 SKU，例如：主图_SKU00044974.zip；未匹配图片会自动补到缺失的主图/详情图编号</span>
                </div>
                <div className="zip-list">
                  {zipPaths.map((path) => (
                    <div key={path}><FileArchive size={15} /><span title={path}>{path}</span><button onClick={() => setZipPaths((current) => current.filter((item) => item !== path))}><X size={14} /></button></div>
                  ))}
                  {!zipPaths.length && <small>还没有添加 ZIP</small>}
                </div>
                <div className="pack-options">
                  <label className="toggle"><input type="checkbox" checked={usePackRules} onChange={(event) => setUsePackRules(event.target.checked)} /><span />应用重命名规则</label>
                  <label className="toggle"><input type="checkbox" checked={deleteZip} onChange={(event) => setDeleteZip(event.target.checked)} /><span />全部成功后删除原 ZIP</label>
                  <button className="clear-zips" onClick={() => setZipPaths([])}><Trash2 size={14} />清空</button>
                </div>
                <div className="photoshop-option">
                  <label className="toggle"><input type="checkbox" checked={compressImages} onChange={(event) => {
                    setCompressImages(event.target.checked);
                    localStorage.setItem(PHOTOSHOP_COMPRESS_KEY, event.target.checked ? "1" : "0");
                  }} /><span />重命名后用 Photoshop 压缩</label>
                  <small>最长边 1600px，输出到“主图 / 详情图 / 其他”</small>
                  <label className="toggle recycle-toggle"><input type="checkbox" checked={moveOriginalsToRecycle} disabled={!compressImages} onChange={(event) => {
                    setMoveOriginalsToRecycle(event.target.checked);
                    localStorage.setItem(PHOTOSHOP_RECYCLE_KEY, event.target.checked ? "1" : "0");
                  }} /><span />压缩成功后将原图移到外部回收站</label>
                  <small>只在对应 JPG 保存成功后移动；回收站位于电脑应用数据目录，不写入原产品目录</small>
                  <div>
                    <input value={photoshopPath} onChange={(event) => setPhotoshopPath(event.target.value)} disabled={!compressImages} placeholder="Photoshop.exe 路径" />
                    <button onClick={choosePhotoshop} disabled={!compressImages}>选择 Photoshop</button>
                  </div>
                  <button className="empty-recycle" onClick={emptyPackRecycle} disabled={packBusy || !root}><Trash2 size={14} />核对后批量清空回收站</button>
                </div>
              </div>
              <div className="pack-card rules-card">
                <div className="pack-card-title"><div><strong>重命名规则</strong><span>每行：正则表达式 | 新名称</span></div><button onClick={() => { setPackRules(DEFAULT_PACK_RULES); localStorage.setItem(PACK_RULES_KEY, DEFAULT_PACK_RULES); }}>恢复默认</button></div>
                <textarea value={packRules} onChange={(event) => setPackRules(event.target.value)} spellCheck={false} />
              </div>
            </div>
            <div className="pack-console">
              <div><strong>处理日志</strong><span>{packLogs.length} 条</span></div>
              <pre>{packLogs.join("\n")}</pre>
            </div>
            <div className="pack-actions">
              <div><strong>输出目录</strong><span>{root ? `${root}/产品文件夹/套图` : "请先选择产品根目录"}</span></div>
              <button className="primary large" onClick={archivePacks} disabled={packBusy}>{packBusy ? <LoaderCircle size={17} className="spin" /> : <Play size={17} fill="currentColor" />}开始归档</button>
            </div>
          </section>
        )}

        {workspaceView === "upload" && (
          <section className="upload-check-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">UPLOAD CHECK</span>
                <h2>检查并提交魔法上传图包</h2>
                <p>按 SKU 扫描本地 XLSX 与 ZIP，检查后交给悬浮助手的魔法上传 API；不再点击旧的脚本上传页面。</p>
              </div>
              <button className="pack-root" onClick={chooseRoot}><FolderOpen size={16} />{root || "选择产品根目录"}</button>
            </div>
            <div className="upload-check-toolbar">
              <button className="secondary" onClick={scanUploadPairs} disabled={uploadBusy}><ScanLine size={16} />{uploadBusy ? "检查中…" : "检查新文件"}</button>
              <button className="primary" onClick={queueUploadPairs} disabled={uploadBusy || !selectedUploadSkus.size}><Upload size={16} />加入魔法上传队列</button>
              <label className="toggle"><input type="checkbox" checked={uploadAutoStart} onChange={(event) => setUploadAutoStart(event.target.checked)} /><span />加入后自动开始魔法上传</label>
              <button onClick={() => setSelectedUploadSkus(new Set(uploadPairs.filter((item) => item.status === "ready").map((item) => item.sku)))}>全选可上传</button>
              <button onClick={() => setSelectedUploadSkus(new Set())}>取消选择</button>
            </div>
            <div className="upload-check-summary"><span>共 {uploadPairs.length} 个 SKU</span><span>可上传 {uploadPairs.filter((item) => item.status === "ready").length}</span><span>历史已上传 {uploadPairs.filter((item) => item.status === "uploaded").length}</span><span>已选择 {selectedUploadSkus.size}</span></div>
            <div className="upload-check-list">
              {!uploadPairs.length && <div className="empty-state"><ScanLine size={28} /><strong>点击“检查新文件”开始扫描</strong><span>工作台会在产品根目录内寻找带 SKU 的 XLSX 和 ZIP，提交后由魔法上传处理。</span></div>}
              {uploadPairs.map((item) => (
                <div className={`upload-check-row ${item.status}`} key={item.sku}>
                  <button className={`check-button ${selectedUploadSkus.has(item.sku) ? "checked" : ""}`} disabled={item.status !== "ready"} onClick={() => setSelectedUploadSkus((current) => { const next = new Set(current); if (next.has(item.sku)) next.delete(item.sku); else next.add(item.sku); return next; })}>{selectedUploadSkus.has(item.sku) && <Check size={14} />}</button>
                  <strong>{item.sku}</strong>
                  <div><span>{item.xlsxName || "缺少 XLSX"}</span><small>{item.xlsxPath || "未找到有效表格"}</small></div>
                  <div><span>{item.zipName || "缺少 ZIP"}</span><small>{item.zipPath || "未找到有效图包"}</small></div>
                  <span className={`status ${item.status === "ready" || item.status === "uploaded" ? "success" : item.status === "invalid" ? "danger" : "warning"}`}>{item.status === "ready" ? "可上传" : item.status === "uploaded" ? "历史已上传" : item.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {workspaceView === "videos" && (
          <section className="video-panel">
            <div className="panel-heading video-heading">
              <div>
                <span className="eyebrow">VIDEO TO GIF</span>
                <h2>视频转动图</h2>
                <p>扫描 7 月检测视频文件名，匹配产品后复制视频并生成 GIF。</p>
              </div>
              <button className="pack-root" onClick={chooseRoot}><FolderOpen size={16} />{root || "选择产品根目录"}</button>
            </div>
            <div className="video-toolbar">
              <div className="video-source-field">
                <label>检测视频目录</label>
                <input value={videoSource} onChange={(event) => setVideoSource(event.target.value)} placeholder="E:/WXWork/.../7月" />
              </div>
              <button className="secondary video-browse" onClick={chooseVideoSource}><FolderOpen size={15} />选择目录</button>
              <button className="primary" onClick={scanVideos} disabled={videoBusy}><ScanLine size={16} />{videoBusy ? "扫描中…" : "扫描并匹配"}</button>
            </div>
            <div className="video-settings">
              <div className="video-settings-title"><strong>转换设置</strong><span>参数会保存在本机，下次打开自动恢复</span></div>
              <div className="video-setting-grid">
                <label><span>FFmpeg</span><div><input value={ffmpegPath} onChange={(event) => setFfmpegPath(event.target.value)} placeholder="自动从 PATH 查找" /><button onClick={() => chooseVideoTool("ffmpeg")}>选择</button></div></label>
                <label><span>Gifsicle</span><div><input value={gifsiclePath} onChange={(event) => setGifsiclePath(event.target.value)} placeholder="自动从 PATH 查找" /><button onClick={() => chooseVideoTool("gifsicle")}>选择</button></div></label>
                <label><span>FPS</span><input type="number" min="1" value={videoFps} onChange={(event) => setVideoFps(event.target.value)} /></label>
                <label><span>缩放倍数</span><input type="number" min="1" value={videoScale} onChange={(event) => setVideoScale(event.target.value)} /></label>
                <label><span>压缩程度</span><input type="number" min="0" max="200" value={videoLossy} onChange={(event) => setVideoLossy(event.target.value)} /></label>
                <label><span>线程</span><input type="number" min="1" value={videoThreads} onChange={(event) => setVideoThreads(event.target.value)} /></label>
              </div>
              <small>当前默认：FPS 18、缩放 6、Gifsicle lossy 40、8 线程；GIF 写入产品的 套图/动图，MP4 复制到 套图/视频。</small>
            </div>
            <div className="video-console">
              <div className="video-console-heading"><strong>匹配结果</strong><span>{videoFiles.length} 个待处理 · 已勾选 {selectedVideoPaths.size} 个</span><button onClick={() => setSelectedVideoPaths(new Set(videoFiles.filter((item) => item.productFolder).map((item) => item.sourcePath)))}>全选匹配</button><button onClick={() => setSelectedVideoPaths(new Set())}>取消全选</button></div>
              <div className="video-list">
                {!videoFiles.length && <div className="video-empty"><Film size={28} /><span>点击“扫描并匹配”检查视频文件名</span></div>}
                {videoFiles.map((item) => (
                  <div className="video-row" key={item.sourcePath}>
                    <button className={`video-check ${selectedVideoPaths.has(item.sourcePath) ? "checked" : ""}`} disabled={!item.productFolder} onClick={() => toggleVideoSelection(item.sourcePath)}>{selectedVideoPaths.has(item.sourcePath) && <Check size={13} />}</button>
                    <Film size={17} className="video-row-icon" />
                    <div className="video-file-copy"><strong title={item.fileName}>{item.fileName}</strong><small title={item.sourcePath}>{item.sourcePath}</small></div>
                    <div className="video-match-copy">
                      {item.productFolder ? <><strong>{item.productFolder.split(/[\\/]/).pop()}</strong><small>{item.matchSource === "sku" ? "按 SKU 匹配" : item.matchSource === "manual" ? "手动指定" : "按产品名匹配"}</small></> : <><strong>{item.status}</strong><small>{item.ambiguousFolders.length ? item.ambiguousFolders.join("；") : "请检查文件名与产品目录"}</small></>}
                    </div>
                    {item.productFolder ? <span className={`status ${item.status === "已完成" ? "success" : "warning"}`}>{item.status}</span> : <button className="video-assign" onClick={() => assignVideoFolder(item.sourcePath)}>指定目录</button>}
                  </div>
                ))}
              </div>
            </div>
            <div className="video-actions">
              <div><strong>输出位置</strong><span>{root ? `${root}/各产品目录/套图/动图 + 套图/视频` : "请先选择产品根目录"}</span></div>
              <button className="primary large" onClick={processVideos} disabled={videoBusy || !selectedVideoPaths.size}>{videoBusy ? <LoaderCircle size={17} className="spin" /> : <Play size={17} fill="currentColor" />}处理已勾选视频</button>
            </div>
            <div className="video-log"><strong>处理日志</strong><pre>{videoLogs.join("\n")}</pre></div>
          </section>
        )}
      </main>

      {showConnect && (
        <div className="modal-backdrop" onMouseDown={() => setShowConnect(false)}>
          <section className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowConnect(false)}><X size={19} /></button>
            <div className="modal-icon"><Link2 size={24} /></div>
            <span className="eyebrow">LOCAL BRIDGE</span>
            <h2>连接 PLM 悬浮助手</h2>
            <p>复制下面的连接码，打开悬浮助手“设置 → 桌面工作台”，粘贴并连接。</p>
            <label className="token-box">
              <span>一次配对连接码</span>
              <div><code>{bridge.token || "正在准备…"}</code><button onClick={copyToken}><Copy size={17} /></button></div>
            </label>
            <div className={`connection-summary ${bridge.connected ? "online" : ""}`}>
              {bridge.connected ? <Check size={18} /> : <Unplug size={18} />}
              <div><strong>{bridge.connected ? "已建立安全连接" : "等待悬浮助手连接"}</strong><span>{bridge.url}</span></div>
            </div>
            <small className="privacy-note">连接仅监听本机 127.0.0.1，不读取 PLM 密码、Cookie 或云备份密钥。</small>
          </section>
        </div>
      )}
      {assetPreview && <AssetPreviewModal initialKind={assetPreview.kind} row={assetPreview.row} onClose={() => setAssetPreview(null)} notify={notify} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
