const STORAGE_KEY = "ingredient-label-tool-v1";
const SAMPLE_ROWS = [
  { name: "Vitamin B6 (Pyridoxinum hydrochloridum)", amount: "10 mg", dailyValue: "588%", markerAmount: "10" },
  { name: "Vitamin D3 (Cholecalciferol)", amount: "25 mcg", dailyValue: "125%", markerAmount: "0.025" },
  { name: "Zinc (Zincum gluconas)", amount: "15 mg", dailyValue: "136%", markerAmount: "15" },
  { name: "Selenium (Selenium)", amount: "50 mcg", dailyValue: "91%", markerAmount: "0.05" },
  { name: "Boron (Boron)", amount: "3 mg", dailyValue: "**", markerAmount: "3" },
  { name: "Shilajit Extract (Asphaltum punjabianum)", amount: "687 mg", dailyValue: "**", markerAmount: "" },
  { name: "Maca Root Extract (Lepidium meyenii)", amount: "50 mg", dailyValue: "**", markerAmount: "" },
  { name: "Ginseng Extract (Panax ginseng)", amount: "50 mg", dailyValue: "**", markerAmount: "" },
];
const TARGET_DROPS_ROWS = [
  { name: "Vitamin C (Acidum ascorbicum)", amount: "60 mg", dailyValue: "67%", markerAmount: "60" },
  { name: "Zinc (Zincum citras)", amount: "7.5 mg", dailyValue: "68%", markerAmount: "7.5" },
  { name: "Hydrolyzed Collagen Peptides (Bos taurus)", amount: "200 mg", dailyValue: "**", markerAmount: "" },
  { name: "Turmeric Root Extract (Curcuma longa; rhizome; standardized to 95% curcuminoids)", amount: "150 mg", dailyValue: "**", markerAmount: "142.5" },
  { name: "Boswellia Serrata Extract (Boswellia serrata; gum resin; standardized to 65% boswellic acids)", amount: "100 mg", dailyValue: "**", markerAmount: "65" },
  { name: "Hawthorn Berry Extract (Crataegus monogyna; fruit)", amount: "100 mg", dailyValue: "**", markerAmount: "" },
  { name: "Grape Seed Extract (Vitis vinifera; seed; standardized to 95% proanthocyanidins)", amount: "82.5 mg", dailyValue: "**", markerAmount: "78.375" },
];
const SAMPLE_STATE = {
  title: "Supplement Facts",
  servingSize: "2 Capsules",
  servingsPerContainer: "30",
  filename: "supplement-facts.pdf",
  otherIngredients: "",
  activeTargetMg: "",
  standardizedActivePercent: "",
  showFooter: true,
  rows: SAMPLE_ROWS.map((row) => ({ ...row })),
};
const TARGET_DROPS_STATE = {
  title: "Supplement Facts",
  servingSize: "1 mL",
  servingsPerContainer: "60",
  filename: "human-drops-700mg-supplement-facts.pdf",
  otherIngredients: "Purified Water, Vegetable Glycerin, Citric Acid, Potassium Sorbate",
  activeTargetMg: "700",
  standardizedActivePercent: "30",
  showFooter: true,
  rows: TARGET_DROPS_ROWS.map((row) => ({ ...row })),
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

function cloneTargetDrops() {
  return { ...TARGET_DROPS_STATE, rows: TARGET_DROPS_ROWS.map((row) => ({ ...row })) };
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

function amountToMg(value) {
  const text = String(value ?? "").replace(/,/g, "").trim().toLowerCase();
  const match = text.match(/(-?\d+(?:\.\d+)?)\s*(mg|mcg|μg|µg|ug|g|kg)?/);
  if (!match) return NaN;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return NaN;
  const unit = match[2] || "mg";
  if (unit === "kg") return amount * 1000000;
  if (unit === "g") return amount * 1000;
  if (["mcg", "μg", "µg", "ug"].includes(unit)) return amount / 1000;
  return amount;
}

function markerToMg(value) {
  const text = String(value ?? "").replace(/,/g, "").trim();
  return text ? amountToMg(text) : 0;
}

function validateTargetRows() {
  const activeTarget = Number(state.activeTargetMg || 0);
  const standardizedTarget = Number(state.standardizedActivePercent || 0);
  const rows = state.rows.filter((row) => String(row.name || row.amount || "").trim());
  if (!rows.length) throw new Error("请至少填写一行成分信息。");
  rows.forEach((row, index) => {
    if (!/\([^)]*[A-Za-z]{2,}[^)]*\)/.test(String(row.name || ""))) {
      throw new Error(`第 ${index + 1} 行成分必须在括号内写对应 Latin scientific name。`);
    }
    const amount = amountToMg(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error(`第 ${index + 1} 行 Amount Per Serving 必须是有效的 mg、g 或 mcg 数值。`);
    const marker = markerToMg(row.markerAmount);
    if (!Number.isFinite(marker) || marker < 0 || marker > amount + 0.001) {
      throw new Error(`第 ${index + 1} 行标志物 mg 必须是不大于该成分含量的有效数值。`);
    }
  });
  if (!(activeTarget > 0 || standardizedTarget > 0)) return;
  const activeTotal = rows.reduce((sum, row) => sum + amountToMg(row.amount), 0);
  const markerTotal = rows.reduce((sum, row) => sum + markerToMg(row.markerAmount), 0);
  if (activeTarget > 0 && activeTotal + 0.001 < activeTarget) throw new Error(`活性合计 ${activeTotal.toFixed(3)} mg 低于目标 ${activeTarget} mg。`);
  if (standardizedTarget > 0 && (!markerTotal || markerTotal / activeTotal * 100 + 0.001 < standardizedTarget)) {
    throw new Error(`标准化活性标志物比例 ${(markerTotal / activeTotal * 100).toFixed(2)}% 低于目标 ${standardizedTarget}%。`);
  }
  if ((activeTarget > 0 || standardizedTarget > 0) && !String(state.otherIngredients || "").trim()) {
    throw new Error("启用目标模式时必须填写 Other Ingredients。");
  }
}

function visibleRows() {
  return state.rows.length ? state.rows : [{ name: "", amount: "", dailyValue: "**", markerAmount: "" }];
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
      <input data-row-index="${index}" data-row-field="markerAmount" type="text" placeholder="mg" value="${escapeHtml(row.markerAmount || "")}" spellcheck="false">
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
    <div class="label-serving two">Servings Per Container ${escapeHtml(state.servingsPerContainer)}</div>
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
  const otherIngredients = String(state.otherIngredients || "").trim()
    ? `<div class="label-other" style="top:${(BASE_FOOTER + delta + 14 - OUTER_TOP).toFixed(2)}px">Other Ingredients: ${escapeHtml(state.otherIngredients)}</div>`
    : "";
  const otherDelta = otherIngredients ? 30 : 0;
  labelPreview.style.height = `${(height + otherDelta).toFixed(2)}px`;
  labelPreview.innerHTML = `${header}${rowMarkup}${line("label-thick", BASE_FINAL_THICK + delta, 1.8)}${footer}${otherIngredients}`;
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
  if (!state.rows[index]) state.rows[index] = { name: "", amount: "", dailyValue: "**", markerAmount: "" };
  state.rows[index][field] = input.value;
  saveState();
  renderPreview();
});

rowContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-index]");
  if (!button) return;
  const index = Number(button.dataset.removeIndex);
  state.rows.splice(index, 1);
  if (!state.rows.length) state.rows.push({ name: "", amount: "", dailyValue: "**", markerAmount: "" });
  saveState();
  renderRows();
  renderPreview();
});

document.querySelector("#add-row").addEventListener("click", () => {
  if (state.rows.length >= 18) {
    setStatus("单页最多支持 18 行。", "error");
    return;
  }
  state.rows.push({ name: "", amount: "", dailyValue: "**", markerAmount: "" });
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

document.querySelector("#load-target-drops").addEventListener("click", () => {
  state = cloneTargetDrops();
  saveState();
  renderFormValues();
  renderRows();
  renderPreview();
  setStatus("已载入人用 60 mL 滴剂目标：700 mg/份、标准化活性至少 30%。", "success");
});

document.querySelector("#editor-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  generateButton.disabled = true;
  setStatus("正在生成 PDF…");
  try {
    validateTargetRows();
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
    const metrics = Number(result.activeTotalMg) > 0
      ? ` 活性合计 ${Number(result.activeTotalMg).toFixed(3)} mg；标准化活性 ${Number(result.standardizedActivePercent).toFixed(2)}%。`
      : "";
    setStatus(`已生成 ${result.filename}，文件已开始下载。${metrics}`, "success");
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
