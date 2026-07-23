import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import {
  Check, ChevronRight, CircleAlert, Copy, FileImage, FileSpreadsheet,
  FolderOpen, Link2, LoaderCircle, Play, RefreshCw, Search, Settings2,
  Sparkles, Unplug, X,
} from "lucide-react";
import type { BridgeInfo, FinalizedProduct, ProductPreview, RowJob } from "./types";

const ROOT_KEY = "plm-workbench.asset-root";
const MAP_KEY = "plm-workbench.folder-mappings";
const AUTO_DONE_KEY = "plm-workbench.auto-finalized-done";

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
  if (!row.folder) return { label: "待指定目录", tone: "danger" };
  if (row.missing.length) return { label: `缺少 ${row.missing.join("、")}`, tone: "warning" };
  if (row.excelExists && row.skuImageExists && row.englishExists && row.sizeExists) return { label: "成品已存在", tone: "neutral" };
  if (row.ambiguousFolders.length > 1) return { label: `SKU 命中 ${row.ambiguousFolders.length} 个目录`, tone: "warning" };
  return { label: "可以生成", tone: "success" };
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
  const autoRunning = useRef(new Set<string>());
  const autoAttempts = useRef(new Map<string, string>());
  const bridgeRef = useRef(bridge);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
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
      const valid = new Set(result.map((item) => item.product.sku));
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
    refreshPreview(products, root, mappings).catch(console.error);
  }, [bridge.connected, mappings, products, refreshPreview, root]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => !keyword || [row.product.sku, row.product.brand, row.product.name, row.product.englishName]
      .join(" ").toLowerCase().includes(keyword));
  }, [query, rows]);

  const counts = useMemo(() => ({
    ready: rows.filter((row) => row.folder && !row.missing.length && !(row.excelExists && row.skuImageExists && row.englishExists && row.sizeExists)).length,
    missing: rows.filter((row) => !row.folder || row.missing.length).length,
    complete: rows.filter((row) => row.excelExists && row.skuImageExists && row.englishExists && row.sizeExists).length,
  }), [rows]);

  async function chooseRoot() {
    const value = await open({ directory: true, multiple: false, title: "选择产品文件夹根目录" });
    if (typeof value !== "string") return;
    setRoot(value);
    localStorage.setItem(ROOT_KEY, value);
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

  return (
    <div className="app-shell">
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
        <section className="hero-panel">
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
        </section>

        <section className="metrics">
          <article><span>全部定稿</span><strong>{rows.length}</strong><small>来自悬浮助手</small></article>
          <article className="green"><span>可以生成</span><strong>{counts.ready}</strong><small>资料与目录已就绪</small></article>
          <article className="amber"><span>需要确认</span><strong>{counts.missing}</strong><small>缺图、参数或目录</small></article>
          <article className="violet"><span>完整成品</span><strong>{counts.complete}</strong><small>三类文件均已存在</small></article>
        </section>

        <section className="work-panel">
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
            <button onClick={() => setSelected(new Set(visible.map((row) => row.product.sku)))}>全选当前</button>
            <button onClick={() => setSelected(new Set())}>取消选择</button>
            <span>已选择 <b>{selected.size}</b> 个产品</span>
          </div>

          <div className="product-table">
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
                    <strong>{row.product.sku}</strong>
                    <span>{[row.product.brand, row.product.name].filter(Boolean).join(" · ") || "未命名产品"}</span>
                    <small>{row.product.finalizedAt || "已定稿"}</small>
                  </div>
                  <div className="asset-cell">
                    <span className={row.transparentImage ? "ok" : "missing"}><FileImage size={16} />{row.transparentImage ? "透明.png" : "缺少透明.png"}</span>
                    <small>{row.folder ? row.folder : "尚未匹配产品目录"}</small>
                  </div>
                  <div className="deliverables">
                    <span className={row.excelExists ? "complete" : ""}><FileSpreadsheet size={15} />Excel</span>
                    <span className={row.skuImageExists ? "complete" : ""}><FileImage size={15} />SKU图</span>
                    <span className={row.englishExists ? "complete" : ""}><FileImage size={15} />英文参数图</span>
                    <span className={row.sizeExists ? "complete" : ""}><FileImage size={15} />尺寸图</span>
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
                <CircleAlert size={28} />
                <strong>{root ? "还没有同步到已定稿产品" : "请先选择产品文件夹根目录"}</strong>
                <span>{root ? "连接悬浮助手后点击“同步已定稿产品”" : "工作台会扫描其中的 SKU 产品文件夹"}</span>
              </div>
            )}
          </div>

          <div className="batch-bar">
            <div>
              <strong>{selected.size ? `准备处理 ${selected.size} 个产品` : "选择产品后开始批量生成"}</strong>
              <span>已有文件默认跳过；缺少透明图时仍可生成 Excel。</span>
            </div>
            <button className="primary large" onClick={generateSelected}><Play size={18} fill="currentColor" />批量生成所选资产</button>
          </div>
        </section>
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
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
