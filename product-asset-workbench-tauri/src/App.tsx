import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import {
  Archive, Check, ChevronDown, ChevronRight, ChevronUp, CircleAlert, Copy, FileArchive, FileImage, FileSpreadsheet,
  Eye, FolderOpen, Link2, LoaderCircle, Pencil, Play, RefreshCw, RotateCcw, Save, Search, Settings2,
  Sparkles, Trash2, Undo2, Unplug, Upload, X,
} from "lucide-react";
import type { BridgeInfo, FinalizedProduct, ProductPreview, RowJob } from "./types";

const ROOT_KEY = "plm-workbench.asset-root";
const MAP_KEY = "plm-workbench.folder-mappings";
const AUTO_DONE_KEY = "plm-workbench.auto-finalized-done";
const PACK_RULES_KEY = "plm-workbench.pack-rules";
const PHOTOSHOP_PATH_KEY = "plm-workbench.photoshop-path";
const PHOTOSHOP_COMPRESS_KEY = "plm-workbench.photoshop-compress";
const PHOTOSHOP_RECYCLE_KEY = "plm-workbench.photoshop-recycle-originals";
const COMPACT_TOP_KEY = "plm-workbench.compact-top";
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
  const [workspaceView, setWorkspaceView] = useState<"assets" | "packs">("assets");
  const [queueView, setQueueView] = useState<"active" | "complete">("active");
  const [zipPaths, setZipPaths] = useState<string[]>([]);
  const [packRules, setPackRules] = useState(() => localStorage.getItem(PACK_RULES_KEY) || DEFAULT_PACK_RULES);
  const [usePackRules, setUsePackRules] = useState(true);
  const [deleteZip, setDeleteZip] = useState(false);
  const [compressImages, setCompressImages] = useState(() => localStorage.getItem(PHOTOSHOP_COMPRESS_KEY) === "1");
  const [moveOriginalsToRecycle, setMoveOriginalsToRecycle] = useState(() => localStorage.getItem(PHOTOSHOP_RECYCLE_KEY) === "1");
  const [photoshopPath, setPhotoshopPath] = useState(() => localStorage.getItem(PHOTOSHOP_PATH_KEY) || "");
  const [compactTop, setCompactTop] = useState(() => localStorage.getItem(COMPACT_TOP_KEY) === "1");
  const [packBusy, setPackBusy] = useState(false);
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
      if (event.payload.type === "drop") addZipPaths(event.payload.paths);
    }).then((unlisten) => { clean = unlisten; });
    return () => clean?.();
  }, [addZipPaths]);

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

  async function emptyPackRecycle() {
    if (!root) return notify("请先选择产品文件夹根目录");
    if (!window.confirm("将永久删除各产品“套图/回收站”中的原图，且无法恢复。请确认已核对压缩图无误。")) return;
    setPackBusy(true);
    try {
      const result = await invoke<EmptyRecycleResult>("empty_pack_recycle", { root });
      const message = result.deletedFolders
        ? `已清空 ${result.deletedFolders} 个回收站，永久删除 ${result.deletedFiles} 个文件`
        : "没有找到需要清空的“套图/回收站”";
      setPackLogs((current) => [...current, message]);
      notify(message);
    } catch (error) {
      notify(String(error));
    } finally {
      setPackBusy(false);
    }
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

        {workspaceView === "packs" && (
          <section className="pack-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">IMAGE PACK ARCHIVE</span>
                <h2>批量图包处理</h2>
                <p>从 ZIP 文件名识别 SKU，匹配产品目录，解压并按规则重命名到“套图”。</p>
              </div>
              <button className="pack-root" onClick={chooseRoot}><FolderOpen size={16} />{root || "选择产品根目录"}</button>
            </div>
            <div className="pack-grid">
              <div className="pack-card">
                <div className="pack-card-title"><div><strong>待处理 ZIP</strong><span>支持点击添加或直接拖入窗口</span></div><button onClick={chooseZipPacks}><Upload size={15} />添加 ZIP</button></div>
                <div className="zip-drop" onClick={chooseZipPacks}>
                  <FileArchive size={30} />
                  <strong>{zipPaths.length ? `已添加 ${zipPaths.length} 个图包` : "拖入图包 ZIP"}</strong>
                  <span>文件名需要包含 SKU，例如：主图_SKU00044974.zip</span>
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
                  }} /><span />压缩成功后将原图移到“套图/回收站”</label>
                  <small>只在对应 JPG 保存成功后移动；核对完成再永久清空</small>
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
