const STORAGE_KEY = "ingredient-label-tool-v1";
const SAMPLE_ROWS = [
  { name: "Vitamin B6 (as Pyridoxine Hydrochloride)", amount: "10 mg", dailyValue: "588%" },
  { name: "Vitamin D3 (Cholecalciferol)", amount: "25 mcg", dailyValue: "125%" },
  { name: "Zinc (as Zinc Gluconate)", amount: "15 mg", dailyValue: "136%" },
  { name: "Selenium (as Selenium Yeast)", amount: "50 mcg", dailyValue: "91%" },
  { name: "Boron (as Boron Citrate)", amount: "3 mg", dailyValue: "**" },
  { name: "Shilajit Extract (Asphaltum punjabianum)", amount: "687 mg", dailyValue: "**" },
  { name: "Maca Root Extract (Lepidium meyenii Root Extract)", amount: "50 mg", dailyValue: "**" },
  { name: "Ginseng Extract (Panax ginseng Root Extract)", amount: "50 mg", dailyValue: "**" },
];
const SAMPLE_STATE = {
  title: "Supplement Facts",
  servingSize: "2 Capsules",
  servingsPerContainer: "30",
  filename: "supplement-facts.pdf",
  showFooter: true,
  rows: SAMPLE_ROWS.map((row) => ({ ...row })),
};
const OUTER_TOP = 71.88;
const BASE_HEIGHT = 361.08;
const ROW_HEIGHT = 30.84;
const BASE_FINAL_THICK = 400.08;
const BASE_FOOTER = 413.22;

let state = loadState();
const rowContainer = document.querySelector("#ingredient-rows");
const labelPreview = document.querySelector("#label-preview");
const paper = document.querySelector("#paper");
const paperWrap = document.querySelector("#paper-wrap");
const previewStage = document.querySelector("#preview-stage");
const statusMessage = document.querySelector("#status");
const generateButton = document.querySelector("#generate-button");

function cloneSample() {
  return { ...SAMPLE_STATE, rows: SAMPLE_ROWS.map((row) => ({ ...row })) };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Array.isArray(saved.rows)) {
      return { ...cloneSample(), ...saved, rows: saved.rows.map((row) => ({ ...row })) };
    }
  } catch {
    // Use the reference sample when local storage is unavailable or invalid.
  }
  return cloneSample();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function visibleRows() {
  return state.rows.length ? state.rows : [{ name: "", amount: "", dailyValue: "**" }];
}

function renderFormValues() {
  document.querySelectorAll("[data-state]").forEach((input) => {
    const key = input.dataset.state;
    if (!(key in state)) return;
    if (input.type === "checkbox") input.checked = Boolean(state[key]);
    else input.value = state[key];
  });
}

function renderRows() {
  rowContainer.replaceChildren();
  visibleRows().forEach((row, index) => {
    const line = document.createElement("div");
    line.className = "ingredient-row";
    line.innerHTML = `
      <input data-row-index="${index}" data-row-field="name" type="text" placeholder="例如 Vitamin B6 (as ...)" value="${escapeHtml(row.name)}" spellcheck="false">
      <input data-row-index="${index}" data-row-field="amount" type="text" placeholder="10 mg" value="${escapeHtml(row.amount)}" spellcheck="false">
      <input data-row-index="${index}" data-row-field="dailyValue" type="text" placeholder="**" value="${escapeHtml(row.dailyValue)}" spellcheck="false">
      <button type="button" class="remove-row" data-remove-index="${index}" aria-label="删除这一行">×</button>
    `;
    rowContainer.append(line);
  });
}

function labelHeight() {
  return BASE_HEIGHT + (visibleRows().length - 8) * ROW_HEIGHT;
}

function renderPreview() {
  const rows = visibleRows();
  const height = labelHeight();
  const delta = (rows.length - 8) * ROW_HEIGHT;
  const line = (className, top, heightPx) => `<div class="${className}" style="top:${(top - OUTER_TOP).toFixed(2)}px;height:${heightPx}px"></div>`;
  const header = `
    <div class="label-title">${escapeHtml(state.title || "Supplement Facts")}</div>
    <div class="label-serving one">Serving Size ${escapeHtml(state.servingSize)}</div>
    <div class="label-serving two">Serving Per Container ${escapeHtml(state.servingsPerContainer)}</div>
    ${line("label-thick", 129.84, 1.8)}
    <div class="label-header"><span>Amount Per Serving</span><span>% Daily Value</span></div>
    ${line("label-thin", 153.96, .6)}
  `;
  const rowMarkup = rows.map((row, index) => {
    const top = 166.02 + index * ROW_HEIGHT;
    const nameLength = String(row.name || "").length;
    const fontSize = nameLength > 48 ? Math.max(6.6, 10.812 - (nameLength - 48) * .08) : 10.812;
    const separator = index < rows.length - 1 ? line("label-thin", 184.8 + index * ROW_HEIGHT, .6) : "";
    return `${separator}<div class="label-row" style="top:${(top - OUTER_TOP).toFixed(2)}px;font-size:${fontSize.toFixed(2)}px"><span class="name">${escapeHtml(row.name || "")}</span><span class="amount">${escapeHtml(row.amount || "")}</span><span class="daily-value">${escapeHtml(row.dailyValue || "**")}</span></div>`;
  }).join("");
  const footer = state.showFooter ? `<div class="label-footer" style="top:${(BASE_FOOTER + delta - OUTER_TOP).toFixed(2)}px">**Daily Value not established.</div>` : "";
  labelPreview.style.height = `${height.toFixed(2)}px`;
  labelPreview.innerHTML = `${header}${rowMarkup}${line("label-thick", BASE_FINAL_THICK + delta, 1.8)}${footer}`;
  requestPaperScale();
}

function requestPaperScale() {
  const availableWidth = Math.max(280, previewStage.clientWidth - 36);
  const scale = Math.min(1, availableWidth / 595.25);
  paper.style.transform = `scale(${scale})`;
  paperWrap.style.width = `${595.25 * scale}px`;
  paperWrap.style.height = `${841.85 * scale}px`;
}

function setStatus(message, tone = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${tone}`.trim();
}

document.querySelectorAll("[data-state]").forEach((input) => {
  input.addEventListener("input", () => {
    const key = input.dataset.state;
    state[key] = input.type === "checkbox" ? input.checked : input.value;
    saveState();
    renderPreview();
  });
});

rowContainer.addEventListener("input", (event) => {
  const input = event.target.closest("[data-row-index]");
  if (!input) return;
  const index = Number(input.dataset.rowIndex);
  const field = input.dataset.rowField;
  if (!state.rows[index]) state.rows[index] = { name: "", amount: "", dailyValue: "**" };
  state.rows[index][field] = input.value;
  saveState();
  renderPreview();
});

rowContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-index]");
  if (!button) return;
  const index = Number(button.dataset.removeIndex);
  state.rows.splice(index, 1);
  if (!state.rows.length) state.rows.push({ name: "", amount: "", dailyValue: "**" });
  saveState();
  renderRows();
  renderPreview();
});

document.querySelector("#add-row").addEventListener("click", () => {
  if (state.rows.length >= 18) {
    setStatus("单页最多支持 18 行。", "error");
    return;
  }
  state.rows.push({ name: "", amount: "", dailyValue: "**" });
  saveState();
  renderRows();
  renderPreview();
  rowContainer.lastElementChild?.querySelector("input")?.focus();
});

document.querySelector("#load-sample").addEventListener("click", () => {
  state = cloneSample();
  saveState();
  renderFormValues();
  renderRows();
  renderPreview();
  setStatus("已载入参考 PDF 的示例数据。", "success");
});

document.querySelector("#editor-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  generateButton.disabled = true;
  setStatus("正在生成 PDF…");
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "生成失败。");
    const link = document.createElement("a");
    link.href = result.downloadUrl;
    link.download = result.filename;
    document.body.append(link);
    link.click();
    link.remove();
    setStatus(`已生成 ${result.filename}，文件已开始下载。`, "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "生成失败，请检查输入。", "error");
  } finally {
    generateButton.disabled = false;
  }
});

new ResizeObserver(requestPaperScale).observe(previewStage);
renderFormValues();
renderRows();
renderPreview();
