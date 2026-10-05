import { useEffect, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import { FileSpreadsheet, FolderOpen, Search } from "lucide-react";

interface MainImageRow {
  code: string;
  status: string;
  candidates: string[];
  selectedPath: string | null;
}

// Paste one Excel column without collapsing empty rows or duplicate codes.
export function parseCodeColumn(text: string): string[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines.map((line) => line.split("\t")[0].trim());
}

export default function MainImageLookup({ root, chooseRoot }: { root: string; chooseRoot: () => Promise<void> }) {
  const [text, setText] = useState(() => localStorage.getItem("plm-workbench.main-image-codes") || "");
  const [rows, setRows] = useState<MainImageRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState({ root: "", text: "" });
  const stale = snapshot.root !== root || snapshot.text !== text;
  useEffect(() => { localStorage.setItem("plm-workbench.main-image-codes", text); }, [text]);

  async function search() {
    setBusy(true); setMessage("");
    try {
      const result = await invoke<MainImageRow[]>("scan_main_images", { root, codes: parseCodeColumn(text) });
      setRows(result); setSnapshot({ root, text });
      setMessage(`共 ${result.length} 行，找到 ${result.filter((row) => row.selectedPath).length} 张；缺图 ${result.filter((row) => row.status === "missing").length} 行，待选择 ${result.filter((row) => row.status === "ambiguous").length} 行。`);
    } catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }

  async function exportExcel() {
    setBusy(true);
    try {
      const path = await save({ title: "导出主图填表（请选择新文件名）", defaultPath: "主图填表.xlsx", filters: [{ name: "Excel", extensions: ["xlsx"] }] });
      if (!path) return;
      await invoke("export_main_images", { path, rows });
      setMessage(`已导出：${path}`);
    } catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }

  return <section className="work-panel main-image-panel">
    <div className="panel-heading"><div><h2>主图填表</h2><p>按编码原顺序查找主图1，重复编码、空行和 / 保留原位置。</p></div></div>
    <div className="main-image-input">
      <div><label htmlFor="main-image-codes">粘贴 Excel 编码列（一行一个）</label><textarea id="main-image-codes" value={text} onChange={(event) => setText(event.target.value)} placeholder={"SKU00050716\nSKU00050722\n/\nSKU00044978"} disabled={busy} /></div>
      <div className="main-image-actions">
        <button className="secondary" disabled={busy} onClick={chooseRoot}><FolderOpen size={16} />{root || "选择图片搜索目录"}</button>
        <p>选择所有产品所在的根目录（如 D:\工作\7月），一次遍历下级文件夹，查找主图1.jpg / png / webp。多张匹配图需手动选择。</p>
        <button disabled={busy || !root || !text.trim()} onClick={search}><Search size={16} />{busy ? "处理中…" : "按编码查找主图1"}</button>
        <button className="secondary" disabled={busy || stale || !rows.length || rows.some((row) => row.status === "ambiguous" && !row.selectedPath)} onClick={exportExcel}><FileSpreadsheet size={16} />导出带图片的 Excel</button>
        <p>导出 A 列编码、B 列嵌入图片、C 列缺图提示，无表头，便于对齐原表。图片随单元格移动，保持比例。</p>
      </div>
    </div>
    <p role="status">{message}</p>
    {rows.length > 0 && stale && <p className="main-image-warning">编码或目录已更改，请重新查找。</p>}
    {!stale && rows.length > 0 && <div className="main-image-results"><table><thead><tr><th>行</th><th>编码</th><th>主图1</th><th>匹配文件</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}>
      <td>{index + 1}</td><td>{row.code || "（空行）"}</td>
      <td>{row.selectedPath ? <img key={row.selectedPath} loading="lazy" src={convertFileSrc(row.selectedPath)} alt={`${row.code} 主图1`} onError={(event) => { event.currentTarget.alt = "图片读取失败，请检查文件"; }} /> : <span>{({ placeholder: "保留位置", missing: "未找到主图1", invalid: "编码格式无效", ambiguous: "请选择图片" } as Record<string, string>)[row.status]}</span>}</td>
      <td>{row.candidates.length > 1 && <select aria-label={`第 ${index + 1} 行图片`} value={row.selectedPath || ""} onChange={(event) => setRows((current) => current.map((item, i) => i === index ? { ...item, selectedPath: event.target.value || null } : item))}><option value="">找到多张主图1，请选择</option>{row.candidates.map((path) => <option key={path} value={path}>{path}</option>)}</select>}
      {row.selectedPath && <button className="secondary" title={row.selectedPath} onClick={() => openPath(row.selectedPath!)}><FolderOpen size={14} />打开原图</button>}
      <small>{row.selectedPath}</small></td>
    </tr>)}</tbody></table></div>}
  </section>;
}
