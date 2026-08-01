import type { LedgerView, ProductDetailTab, ProductRecord, ViewId } from './types'

export const LEGACY_SELECTORS = {
  panel: '#plm-floating-helper',
  full: '.pfh-full',
  header: '.pfh-header',
  main: '.pfh-main',
  list: '.pfh-list',
  detail: '.pfh-detail',
  ledger: '.pfh-ledger',
  ledgerTabs: '.pfh-ledger-tabs',
  ledgerIndicator: '.pfh-ledger-tab-indicator',
  upload: '.pfh-upload',
} as const

export type LegacyViewId = ViewId | 'home' | 'ledger' | 'upload' | 'detail' | 'settings'

export type LegacyActionPayload = Record<string, unknown>

export type LegacyToastOptions = {
  tone?: 'info' | 'success' | 'warning' | 'error'
  durationMs?: number
}

export type LegacyOpenProductOptions = {
  tab?: ProductDetailTab
  preserveView?: boolean
}

export type LegacyHostAdapter = {
  /** Read the view that the legacy shell currently owns. */
  getView?: () => LegacyViewId
  /** Ask the legacy shell to change view without changing its DOM contract. */
  setView?: (view: LegacyViewId) => void
  /** Read the selected SKU from the legacy state object. */
  getSelectedSku?: () => string | null
  /** Read the active legacy Today Workbench tab. */
  getLedgerView?: () => LedgerView
  /** Subscribe to legacy tab changes without replacing the tab DOM nodes. */
  subscribeLedgerView?: (listener: (view: LedgerView) => void) => () => void
  /** Return the normalized catalog already maintained by the userscript. */
  getCatalog?: () => ProductRecord[]
  /** Return one legacy cached record without changing its fields. */
  getProductData?: (sku: string) => Record<string, unknown> | null
  /** Route an action through the existing data-action/event-delegation path. */
  dispatchAction?: (action: string, payload?: LegacyActionPayload) => void
  /** Use the existing PLM detail/scan boundary. */
  openProduct?: (sku: string, options?: LegacyOpenProductOptions) => void
  /** Reuse the legacy notification surface. */
  showToast?: (message: string, options?: LegacyToastOptions) => void
  /** Request the host to render its current content slot again. */
  requestRefresh?: (reason?: string) => void
}

export type LegacySurface = {
  panel: HTMLElement
  full: HTMLElement
  header: HTMLElement | null
  main: HTMLElement | null
  list: HTMLElement | null
  detail: HTMLElement | null
  ledger: HTMLElement | null
  ledgerTabs: HTMLElement | null
  ledgerIndicator: HTMLElement | null
  upload: HTMLElement | null
}

function findElement<T extends HTMLElement>(root: ParentNode, selector: string, selfSelector?: string) {
  if (root instanceof HTMLElement && selfSelector && root.matches(selfSelector)) return root as T
  return root.querySelector<T>(selector)
}

/**
 * Locate the old shell without creating or replacing any node. This is used by
 * the incremental renderer before it mounts React into a specific content slot.
 */
export function findLegacySurface(root: ParentNode = document): LegacySurface | null {
  const panel = findElement<HTMLElement>(root, LEGACY_SELECTORS.panel, LEGACY_SELECTORS.panel)
  if (!panel) return null
  const full = findElement<HTMLElement>(panel, LEGACY_SELECTORS.full, LEGACY_SELECTORS.full)
  if (!full) return null
  return {
    panel,
    full,
    header: findElement(full, LEGACY_SELECTORS.header),
    main: findElement(full, LEGACY_SELECTORS.main),
    list: findElement(full, LEGACY_SELECTORS.list),
    detail: findElement(full, LEGACY_SELECTORS.detail),
    ledger: findElement(full, LEGACY_SELECTORS.ledger),
    ledgerTabs: findElement(full, LEGACY_SELECTORS.ledgerTabs),
    ledgerIndicator: findElement(full, LEGACY_SELECTORS.ledgerIndicator),
    upload: findElement(full, LEGACY_SELECTORS.upload),
  }
}

export function invokeLegacyAction(adapter: LegacyHostAdapter | undefined, action: string, payload?: LegacyActionPayload) {
  if (!adapter?.dispatchAction) return false
  adapter.dispatchAction(action, payload)
  return true
}

export function openLegacyProduct(adapter: LegacyHostAdapter | undefined, sku: string, options?: LegacyOpenProductOptions) {
  if (!adapter?.openProduct) return false
  adapter.openProduct(sku, options)
  return true
}
