import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'
import type { QueueStatus } from '../types'

const statusMap: Record<QueueStatus, { label: string; icon: typeof CheckCircle2 }> = {
  running: { label: '处理中', icon: LoaderCircle },
  ready: { label: '可提审', icon: CheckCircle2 },
  attention: { label: '需关注', icon: AlertCircle },
}

export function StatusBadge({ status }: { status: QueueStatus }) {
  const item = statusMap[status]
  const Icon = item.icon

  return (
    <span className={'status-badge status-' + status}>
      <Icon size={14} strokeWidth={2.2} className={status === 'running' ? 'spin-slow' : undefined} />
      {item.label}
    </span>
  )
}
