export type ViewId = 'today' | 'product' | 'queue'

export type ThemeId = 'violet' | 'ocean' | 'mint' | 'rose'

export type ProductViewMode = 'waterfall' | 'list'

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
