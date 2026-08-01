export type ViewId = 'today' | 'product' | 'queue'

export type ThemeId = 'violet' | 'ocean' | 'mint' | 'rose'

export type ProductViewMode = 'waterfall' | 'list'

export type ProductDetailTab = '详情' | '文案' | '参数图' | '尺寸图'

export type LedgerView = 'design' | 'finalized' | 'trash'

export type LedgerStage = '待出图' | '待定稿' | '已定稿' | '垃圾篓'

export type LedgerRecordBridgeMeta = {
  raw?: Record<string, unknown>
  isTrash?: boolean
  removedAt?: string
  removedAtMs?: number
}

export type ArtworkVariant = 'lavender' | 'peach' | 'mint'

export type NavItem = {
  id: ViewId
  label: string
  hint: string
  badge?: string
}

export type QueueStatus = 'running' | 'ready' | 'attention'

export type QueueTask = {
  id: string
  sku: string
  title: string
  category: string
  progress: number
  status: QueueStatus
  detail: string
  eta?: string
}

export type ProductRecord = {
  sku: string
  title: string
  brand: string
  category: string
  updated: string
  completion: number
  assetCount: number
  status: QueueStatus
  variant: ArtworkVariant
  mediaSize: 'short' | 'medium' | 'tall'
  pinned?: boolean
}

export type LedgerRecord = {
  id: string
  sku: string
  title: string
  brand: string
  date: string
  designType: string
  priority?: string
  stage: LedgerStage
  imageGenerated?: boolean
  finalizedAt?: string
  performanceType?: 'standard' | 'extension'
  variant: ArtworkVariant
  mediaSize: 'short' | 'medium' | 'tall'
  bridge?: LedgerRecordBridgeMeta
}
