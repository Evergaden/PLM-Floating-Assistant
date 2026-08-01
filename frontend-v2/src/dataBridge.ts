import { ledgerRecords as defaultLedgerRecords, products } from './data'
import type { ArtworkVariant, LedgerRecord, LedgerStage } from './types'

export const LEGACY_LEDGER_KEY = 'plm-floating-helper:daily-ledger'
export const LEGACY_LEDGER_TRASH_KEY = 'plm-floating-helper:daily-ledger-trash'
export const FRONTEND_LEDGER_KEY = 'plm-frontend-v2-ledger-records'

export type LedgerBridgeSource = 'legacy-gm' | 'legacy-local' | 'frontend-local' | 'demo'
export type LedgerBridgeStorage = 'gm' | 'local'

export type LedgerBridgeSnapshot = {
  records: LedgerRecord[]
  source: LedgerBridgeSource
  storage: LedgerBridgeStorage
}

type LegacyRecord = Record<string, unknown>
type GMListener = (name: string, oldValue: unknown, newValue: unknown, remote: boolean) => void
type UserscriptApi = {
  GM_getValue?: (key: string, defaultValue?: unknown) => unknown
  GM_setValue?: (key: string, value: unknown) => void
  GM_addValueChangeListener?: (key: string, listener: GMListener) => number
  GM_removeValueChangeListener?: (listenerId: number) => void
}

const STAGE_PENDING_IMAGE = '\u5f85\u51fa\u56fe' as LedgerStage
const STAGE_PENDING_FINAL = '\u5f85\u5b9a\u7a3f' as LedgerStage
const STAGE_FINALIZED = '\u5df2\u5b9a\u7a3f' as LedgerStage
const STAGE_TRASH = '\u5783\u573e\u7be1' as LedgerStage
const STATUS_COMPLETED = '\u5df2\u5b8c\u6210'
const STATUS_VOID = '\u4f5c\u5e9f'
const DEFAULT_DESIGN_TYPE = '\u4ea7\u54c1\u8d44\u6599'

function userscriptApi() {
  return globalThis as unknown as UserscriptApi
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value).trim()
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function isRecord(value: unknown): value is LegacyRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseArray(value: unknown): LegacyRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord)
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(isRecord) : []
  } catch {
    return []
  }
}

function normalizeDate(value: unknown) {
  const match = text(value).match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (!match) return new Date().toISOString().slice(0, 10)
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
}

function productForSku(sku: string) {
  return products.find((product) => product.sku.toUpperCase() === sku.toUpperCase())
}

function fallbackArtwork(sku: string) {
  const product = productForSku(sku)
  if (product) return { variant: product.variant, mediaSize: product.mediaSize }
  const hash = Array.from(sku).reduce((total, character) => total + character.charCodeAt(0), 0)
  const variants: ArtworkVariant[] = ['lavender', 'peach', 'mint']
  const sizes: LedgerRecord['mediaSize'][] = ['short', 'medium', 'tall']
  return { variant: variants[hash % variants.length], mediaSize: sizes[hash % sizes.length] }
}

function isFinalized(item: LegacyRecord) {
  const status = text(item.status)
  const stage = text(item.stage)
  return Boolean(
    text(item.finalizedAt) ||
    text(item.finalizedDate) ||
    status === STAGE_FINALIZED ||
    status === STATUS_COMPLETED ||
    status === STATUS_VOID ||
    stage === STAGE_FINALIZED ||
    stage === STATUS_COMPLETED,
  )
}

function hasGeneratedImage(item: LegacyRecord) {
  return Boolean(text(item.imageGeneratedAt) || text(item.skuImageUrl) || text(item.skuImageFallbackUrl) || text(item.artworkState) === 'done')
}

function normalizeStage(item: LegacyRecord, trash: boolean): LedgerStage {
  if (trash) return STAGE_TRASH
  const stage = text(item.stage)
  if (stage === STAGE_PENDING_IMAGE || stage === STAGE_PENDING_FINAL || stage === STAGE_FINALIZED) return stage as LedgerStage
  if (isFinalized(item)) return STAGE_FINALIZED
  if (text(item.status) === STAGE_PENDING_IMAGE) return STAGE_PENDING_IMAGE
  return hasGeneratedImage(item) ? STAGE_PENDING_FINAL : STAGE_PENDING_IMAGE
}

function toLedgerRecord(item: LegacyRecord, trash: boolean): LedgerRecord | null {
  const sku = text(item.sku).slice(0, 80)
  if (!sku) return null
  const product = productForSku(sku)
  const date = normalizeDate(item.date || item.designAssignedAt || item.finalizedDate)
  const artwork = fallbackArtwork(sku)
  const finalDate = text(item.finalizedAt) || text(item.finalizedDate)
  return {
    id: `${trash ? 'trash:' : ''}${date}:${sku}`,
    sku,
    title: text(item.name) || product?.title || sku,
    brand: text(item.brand) || product?.brand || 'PLM',
    date,
    designType: text(item.designType) || product?.category || DEFAULT_DESIGN_TYPE,
    priority: text(item.artPriority) || undefined,
    stage: normalizeStage(item, trash),
    imageGenerated: hasGeneratedImage(item),
    finalizedAt: finalDate || undefined,
    performanceType: text(item.performanceType) === 'extension' ? 'extension' : 'standard',
    variant: artwork.variant,
    mediaSize: artwork.mediaSize,
    bridge: {
      raw: { ...item },
      isTrash: trash,
      removedAt: text(item.removedAt) || undefined,
      removedAtMs: number(item.removedAtMs || item.updatedAtMs) || undefined,
    },
  }
}

function readStoredValue(key: string) {
  const api = userscriptApi()
  if (typeof api.GM_getValue === 'function') {
    try {
      const value = api.GM_getValue(key, null)
      return { value, storage: 'gm' as LedgerBridgeStorage, exists: value !== null && value !== undefined }
    } catch {
      return { value: null, storage: 'gm' as LedgerBridgeStorage, exists: false }
    }
  }
  try {
    const raw = window.localStorage.getItem(key)
    return { value: raw, storage: 'local' as LedgerBridgeStorage, exists: raw !== null }
  } catch {
    return { value: null, storage: 'local' as LedgerBridgeStorage, exists: false }
  }
}

function writeStoredValue(key: string, value: unknown, storage: LedgerBridgeStorage) {
  const api = userscriptApi()
  if (storage === 'gm' && typeof api.GM_setValue === 'function') {
    api.GM_setValue(key, value)
    return
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // The caller still keeps the updated in-memory state.
  }
}

function legacyPayload(record: LedgerRecord, trash: boolean): LegacyRecord {
  const raw = isRecord(record.bridge?.raw) ? record.bridge.raw : {}
  const rawStage = text(raw.stage) || (record.imageGenerated ? STAGE_PENDING_FINAL : STAGE_PENDING_IMAGE)
  const rawStatus = text(raw.status) || rawStage
  const finalized = record.stage === STAGE_FINALIZED
  const payload: LegacyRecord = {
    ...raw,
    date: record.date,
    sku: record.sku,
    brand: record.brand,
    name: record.title,
    designType: record.designType,
    artPriority: record.priority || '',
    stage: trash ? rawStage : record.stage,
    status: trash ? rawStatus : finalized ? STAGE_FINALIZED : record.stage,
    imageGeneratedAt: record.imageGenerated ? text(raw.imageGeneratedAt) || new Date().toISOString() : '',
    finalizedAt: record.finalizedAt || (trash ? text(raw.finalizedAt) : ''),
    finalizedDate: record.finalizedAt ? normalizeDate(record.finalizedAt) : text(raw.finalizedDate),
    performanceType: record.performanceType === 'extension' ? 'extension' : text(raw.performanceType),
  }
  if (trash) {
    payload.removedAt = record.bridge?.removedAt || new Date().toLocaleString()
    payload.removedAtMs = record.bridge?.removedAtMs || Date.now()
    payload.purged = false
  }
  return payload
}

export function readLedgerSnapshot(fallback: LedgerRecord[] = defaultLedgerRecords): LedgerBridgeSnapshot {
  const activeStored = readStoredValue(LEGACY_LEDGER_KEY)
  const trashStored = readStoredValue(LEGACY_LEDGER_TRASH_KEY)
  const activeLegacy = parseArray(activeStored.value)
    .map((item) => toLedgerRecord(item, false))
    .filter((item): item is LedgerRecord => Boolean(item))
  const trashLegacy = parseArray(trashStored.value)
    .filter((item) => item.purged !== true)
    .map((item) => toLedgerRecord(item, true))
    .filter((item): item is LedgerRecord => Boolean(item))

  if (activeStored.exists || trashStored.exists) {
    return {
      records: [...activeLegacy, ...trashLegacy],
      source: activeStored.storage === 'gm' || trashStored.storage === 'gm' ? 'legacy-gm' : 'legacy-local',
      storage: activeStored.storage,
    }
  }

  const frontendStored = readStoredValue(FRONTEND_LEDGER_KEY)
  const frontendRecords = parseArray(frontendStored.value)
    .filter((item) => text(item.id) && text(item.sku) && text(item.date)) as unknown as LedgerRecord[]
  if (frontendRecords.length || frontendStored.exists) {
    return { records: frontendRecords, source: 'frontend-local', storage: 'local' }
  }

  return { records: fallback, source: 'demo', storage: 'local' }
}

export function persistLedgerSnapshot(snapshot: LedgerBridgeSnapshot) {
  const active = snapshot.records.filter((record) => record.stage !== STAGE_TRASH).map((record) => legacyPayload(record, false))
  const trash = snapshot.records.filter((record) => record.stage === STAGE_TRASH).map((record) => legacyPayload(record, true))

  if (snapshot.source === 'legacy-gm' || snapshot.source === 'legacy-local') {
    writeStoredValue(LEGACY_LEDGER_KEY, active, snapshot.storage)
    writeStoredValue(LEGACY_LEDGER_TRASH_KEY, trash, snapshot.storage)
    return
  }

  writeStoredValue(FRONTEND_LEDGER_KEY, snapshot.records, 'local')
}

export function sourceLabel(source: LedgerBridgeSource) {
  if (source === 'legacy-gm') return '\u0050\u004c\u004d \u540c\u6b65\u6570\u636e'
  if (source === 'legacy-local') return '\u672c\u5730 PLM \u6570\u636e'
  if (source === 'frontend-local') return '\u672c\u5730\u5de5\u4f5c\u53f0'
  return '\u6f14\u793a\u6570\u636e'
}

export function subscribeLedgerSnapshot(fallback: LedgerRecord[], onChange: (snapshot: LedgerBridgeSnapshot) => void) {
  const api = userscriptApi()
  const listenerIds: number[] = []
  const keys = [LEGACY_LEDGER_KEY, LEGACY_LEDGER_TRASH_KEY, FRONTEND_LEDGER_KEY]
  const addValueChangeListener = api.GM_addValueChangeListener
  if (typeof addValueChangeListener === 'function') {
    keys.slice(0, 2).forEach((key) => {
      try {
        const id = addValueChangeListener(key, (_name, _oldValue, _newValue, remote) => {
          if (remote) onChange(readLedgerSnapshot(fallback))
        })
        listenerIds.push(id)
      } catch {
        // The preview remains usable without cross-tab GM listeners.
      }
    })
    return () => {
      if (typeof api.GM_removeValueChangeListener !== 'function') return
      listenerIds.forEach((id) => api.GM_removeValueChangeListener?.(id))
    }
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key && keys.includes(event.key)) onChange(readLedgerSnapshot(fallback))
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
