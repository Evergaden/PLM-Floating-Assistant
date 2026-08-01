import type { NavItem, QueueTask } from './types'

export const navItems: NavItem[] = [
  { id: 'today', label: '今日工作台', hint: 'Overview' },
  { id: 'product', label: '产品库', hint: 'Products', badge: '24' },
  { id: 'queue', label: '提审队列', hint: 'Submission', badge: '3' },
]

export const queueTasks: QueueTask[] = [
  {
    id: 'task-1',
    sku: 'SKU00044974',
    title: '焕亮修护精华套装',
    category: '图包表格',
    progress: 78,
    status: 'running',
    detail: '正在匹配产品参数图与详情图',
    eta: '约 2 分钟',
  },
  {
    id: 'task-2',
    sku: 'SKU00044721',
    title: '柔润护手霜礼盒',
    category: '英文参数图',
    progress: 100,
    status: 'ready',
    detail: '资产已生成，等待提审',
  },
  {
    id: 'task-3',
    sku: 'SKU00044518',
    title: '便携式积木拼图',
    category: '产品资料',
    progress: 46,
    status: 'attention',
    detail: '缺少一张透明底产品图',
  },
]

export const activityItems = [
  { time: '09:42', title: '完成 SKU00044721 的参数图', meta: '自动生成 · 英文版', tone: 'success' },
  { time: '09:18', title: '同步 12 个已定稿 SKU', meta: '来自云备份 · 2 分钟前', tone: 'neutral' },
  { time: '08:56', title: '发现 3 个待处理任务', meta: '提审队列 · 需要关注', tone: 'warning' },
]

export const productMetrics = [
  { label: '待处理 SKU', value: '24', delta: '+6', note: '较昨日' },
  { label: '本周已完成', value: '86', delta: '+18%', note: '完成率提升' },
  { label: '素材完整度', value: '92%', delta: '+4.2%', note: '近 7 日' },
]
