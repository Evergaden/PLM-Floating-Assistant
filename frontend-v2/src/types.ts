export type ViewId = 'today' | 'product' | 'queue'

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
