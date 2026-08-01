import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, FileImage, Maximize2, Minimize2, MoreHorizontal, RotateCcw, Search, Sparkles, Trash2, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ledgerRecords as defaultLedgerRecords } from '../data'
import { ProductArtwork } from './ProductArtwork'
import { ElasticButton } from './ElasticButton'
import { useToast } from './ToastProvider'
import type { LedgerRecord, LedgerView } from '../types'

const LEDGER_STORAGE_KEY = 'plm-frontend-v2-ledger-records'
const DEFAULT_LEDGER_MONTH = '2026-08'

const ledgerTabs: Array<{ id: LedgerView; label: string }> = [
  { id: 'design', label: '待定稿' },
  { id: 'finalized', label: '已定稿' },
  { id: 'trash', label: '垃圾篓' },
]

function readLedgerRecords() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LEDGER_STORAGE_KEY) || 'null')
    if (Array.isArray(stored) && stored.every((item) => item && typeof item.id === 'string' && typeof item.sku === 'string' && typeof item.date === 'string')) {
      return stored as LedgerRecord[]
    }
  } catch {
    // Keep the preview usable when browser storage is unavailable or invalid.
  }
  return defaultLedgerRecords
}

function monthKey(date: string) {
  return date.slice(0, 7)
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-')
  return `${year}年${Number(monthNumber)}月`
}

function shiftMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  const next = new Date(Date.UTC(year, monthNumber - 1 + amount, 1))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`
}

function dateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`)
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  return `${date.getMonth() + 1}月${date.getDate()}日 · ${weekday}`
}

function formatRecordDate(record: LedgerRecord, view: LedgerView) {
  return view === 'finalized' && record.finalizedAt ? `定稿 ${record.finalizedAt}` : `分配 ${record.date}`
}

function stageClass(stage: LedgerRecord['stage']) {
  if (stage === '已定稿') return 'is-finalized'
  if (stage === '垃圾篓') return 'is-trash'
  if (stage === '待出图') return 'is-pending'
  return 'is-design'
}

async function copyToClipboard(text: string) {
  if (!navigator.clipboard?.writeText) throw new Error('clipboard-unavailable')
  await navigator.clipboard.writeText(text)
}

type ConfirmState = {
  title: string
  description: string
  confirmLabel: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
}

export function TodayWorkbench({ onOpenProduct }: { onOpenProduct: (sku: string) => void }) {
  const { pushToast } = useToast()
  const [records, setRecords] = useState<LedgerRecord[]>(readLedgerRecords)
  const [view, setView] = useState<LedgerView>('design')
  const [month, setMonth] = useState(DEFAULT_LEDGER_MONTH)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [menuId, setMenuId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const tabRefs = useRef<Partial<Record<LedgerView, HTMLButtonElement | null>>>({})
  const tabsRef = useRef<HTMLDivElement | null>(null)
  const [indicator, setIndicator] = useState({ left: 4, width: 0 })

  useEffect(() => {
    try {
      window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(records))
    } catch {
      // The workbench remains interactive for the current session.
    }
  }, [records])

  useEffect(() => {
    if (!menuId) return
    const closeMenu = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && !target.closest('.ledger-record-card')) setMenuId(null)
    }
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [menuId])

  const syncTabIndicator = () => {
    const activeButton = tabRefs.current[view]
    const tabs = tabsRef.current
    if (!activeButton || !tabs) return
    setIndicator({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
  }

  useLayoutEffect(() => {
    syncTabIndicator()
    window.addEventListener('resize', syncTabIndicator)
    return () => window.removeEventListener('resize', syncTabIndicator)
  }, [view])

  const monthRecords = useMemo(() => records.filter((record) => monthKey(record.date) === month), [month, records])
  const counts = useMemo(() => ({
    design: monthRecords.filter((record) => record.stage !== '已定稿' && record.stage !== '垃圾篓').length,
    finalized: monthRecords.filter((record) => record.stage === '已定稿').length,
    trash: monthRecords.filter((record) => record.stage === '垃圾篓').length,
  }), [monthRecords])

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return monthRecords
      .filter((record) => {
        if (view === 'finalized' && record.stage !== '已定稿') return false
        if (view === 'trash' && record.stage !== '垃圾篓') return false
        if (view === 'design' && (record.stage === '已定稿' || record.stage === '垃圾篓')) return false
        if (!normalizedQuery) return true
        return [record.sku, record.title, record.brand, record.designType].join(' ').toLowerCase().includes(normalizedQuery)
      })
      .sort((left, right) => right.date.localeCompare(left.date) || left.sku.localeCompare(right.sku))
  }, [monthRecords, query, view])

  const groups = useMemo(() => {
    const grouped = new Map<string, LedgerRecord[]>()
    visibleRecords.forEach((record) => {
      const current = grouped.get(record.date) || []
      current.push(record)
      grouped.set(record.date, current)
    })
    return [...grouped.entries()]
  }, [visibleRecords])

  const updateRecord = (id: string, update: Partial<LedgerRecord>) => {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...update } : record))
  }

  const notifyCopy = async (text: string, title: string, message: string) => {
    try {
      await copyToClipboard(text)
      pushToast({ title, message, tone: 'success' })
    } catch {
      pushToast({ title: '内容已准备好', message: '当前浏览器未授权剪贴板，请手动复制。', tone: 'info' })
    }
  }

  const copySku = (sku: string) => notifyCopy(sku, 'SKU 已复制', sku)

  const finalizeRecord = (record: LedgerRecord) => {
    updateRecord(record.id, { stage: '已定稿', finalizedAt: `${record.date} 现在` })
    pushToast({ title: '已定稿', message: `${record.sku} 已进入已定稿` })
  }

  const markImageGenerated = (record: LedgerRecord) => {
    updateRecord(record.id, { imageGenerated: true, stage: '待定稿' })
    pushToast({ title: '已标记出图', message: '下一步可以确认定稿。' })
  }

  const moveToTrash = (record: LedgerRecord) => {
    updateRecord(record.id, { stage: '垃圾篓' })
    setMenuId(null)
    pushToast({ title: '已移入垃圾篓', message: `${record.sku} 可在垃圾篓中恢复。`, tone: 'warning' })
  }

  const restoreRecord = (record: LedgerRecord) => {
    updateRecord(record.id, { stage: record.imageGenerated ? '待定稿' : '待出图' })
    pushToast({ title: '已恢复到工作台', message: record.sku })
  }

  const requestMoveToTrash = (record: LedgerRecord) => {
    setConfirm({
      title: '移入垃圾篓？',
      description: `${record.sku} 会从当前工作台隐藏，但之后仍可以恢复。`,
      confirmLabel: '移入垃圾篓',
      tone: 'danger',
      onConfirm: () => moveToTrash(record),
    })
  }

  const requestClearRecord = (record: LedgerRecord) => {
    setConfirm({
      title: '永久清除这条记录？',
      description: `${record.sku} 将从本地演示工作台中移除，之后无法恢复。`,
      confirmLabel: '永久清除',
      tone: 'danger',
      onConfirm: () => {
        setRecords((current) => current.filter((item) => item.id !== record.id))
        pushToast({ title: '记录已清除', message: record.sku, tone: 'warning' })
      },
    })
  }

  const requestClearMonth = () => {
    if (!counts.trash) return
    setConfirm({
      title: '清空本月垃圾篓？',
      description: `本月 ${counts.trash} 条垃圾篓记录将永久移除。`,
      confirmLabel: '清空垃圾篓',
      tone: 'danger',
      onConfirm: () => {
        setRecords((current) => current.filter((record) => !(monthKey(record.date) === month && record.stage === '垃圾篓')))
        pushToast({ title: '垃圾篓已清空', message: monthLabel(month), tone: 'warning' })
      },
    })
  }

  const toggleSelection = (recordId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(recordId)) next.delete(recordId)
      else next.add(recordId)
      return next
    })
  }

  const copySelected = () => {
    const selected = monthRecords.filter((record) => selectedIds.has(record.id) && record.stage === '已定稿')
    if (!selected.length) {
      pushToast({ title: '还没有选择产品', message: '先勾选需要复制的已定稿 SKU。', tone: 'info' })
      return
    }
    notifyCopy(selected.map((record) => record.sku).join('\n'), '已复制选中编码', `${selected.length} 个 SKU`)
  }

  const exportToLedger = () => {
    const finalized = monthRecords.filter((record) => record.stage === '已定稿')
    if (!finalized.length) {
      pushToast({ title: '暂无已定稿记录', message: '本月还没有可以导出的内容。', tone: 'info' })
      return
    }
    const tsv = ['SKU\t品牌\t产品\t设计类型\t定稿时间', ...finalized.map((record) => [record.sku, record.brand, record.title, record.designType, record.finalizedAt || record.date].join('\t'))].join('\n')
    notifyCopy(tsv, '登记表内容已复制', `${finalized.length} 条记录，可直接粘贴到月登记表。`)
  }

  const switchView = (nextView: LedgerView) => {
    setView(nextView)
    setSelectedIds(new Set())
    setMenuId(null)
  }

  return (
    <section className={'ledger-board surface-panel' + (isFullscreen ? ' is-fullscreen' : '')}>
      <div className="ledger-hero">
        <div className="ledger-hero-icon"><Sparkles size={19} /></div>
        <div className="ledger-hero-copy">
          <span className="eyebrow">TODAY WORKBENCH</span>
          <h2>今日工作台</h2>
          <p>{view === 'trash' ? '移除的记录会暂时留在垃圾篓，恢复后重新回到工作节奏。' : '按设计分配日期整理出图，定稿后继续跟纸盒、标签和图包。'}</p>
        </div>
        <div className="ledger-hero-actions">
          <span>{visibleRecords.length} 条 / {monthLabel(month)}</span>
          <ElasticButton type="button" className="button button-ghost ledger-fullscreen-button" onClick={() => setIsFullscreen((current) => !current)}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? '退出全屏' : '全屏'}
          </ElasticButton>
        </div>
      </div>

      <div className="pfh-ledger-tabs" ref={tabsRef} data-active-tab={view} role="tablist" aria-label="工作台状态">
        <span className="pfh-ledger-tab-indicator" aria-hidden="true" style={{ left: indicator.left, width: indicator.width }} />
        {ledgerTabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            ref={(node) => { tabRefs.current[tab.id] = node }}
            className={'ledger-tab' + (view === tab.id ? ' is-active active' : '')}
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => switchView(tab.id)}
          >
            <span>{tab.label}</span>
            <em>{counts[tab.id]}</em>
          </button>
        ))}
      </div>

      <div className="ledger-toolbar">
        <div className="ledger-month-controls">
          <ElasticButton type="button" className="icon-button icon-button-light icon-button-mini" aria-label="上个月" onClick={() => setMonth((current) => shiftMonth(current, -1))}><ChevronLeft size={14} /></ElasticButton>
          <ElasticButton type="button" className="ledger-month-label" onClick={() => setMonth(DEFAULT_LEDGER_MONTH)}><CalendarDays size={14} />{monthLabel(month)}</ElasticButton>
          <ElasticButton type="button" className="icon-button icon-button-light icon-button-mini" aria-label="下个月" onClick={() => setMonth((current) => shiftMonth(current, 1))}><ChevronRight size={14} /></ElasticButton>
          <ElasticButton type="button" className="ledger-toolbar-button" onClick={() => setMonth(DEFAULT_LEDGER_MONTH)}>本月</ElasticButton>
        </div>
        <label className="ledger-filter"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="筛选 SKU、品牌或设计类型" aria-label="筛选工作台记录" />{query && <button type="button" aria-label="清除筛选" onClick={() => setQuery('')}><X size={13} /></button>}</label>
        <div className="ledger-toolbar-actions">
          {view === 'finalized' && <>
            <ElasticButton type="button" className="ledger-toolbar-button" onClick={copySelected}><Copy size={13} />复制选中编码</ElasticButton>
            <ElasticButton type="button" className="ledger-toolbar-button is-primary" onClick={exportToLedger}><ClipboardIcon />导出到登记</ElasticButton>
          </>}
          {view === 'trash' && <ElasticButton type="button" className="ledger-toolbar-button is-danger" disabled={!counts.trash} onClick={requestClearMonth}><Trash2 size={13} />清空本月垃圾篓</ElasticButton>}
        </div>
      </div>

      <div className="ledger-list-scroll">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view + month + query} className="ledger-content" initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
            {groups.length ? groups.map(([date, dateRecords]) => (
              <section className="ledger-day" key={date}>
                <div className="ledger-day-heading"><span>{dateLabel(date)}</span><em>{dateRecords.length} 条</em></div>
                <div className="ledger-day-list">
                  {dateRecords.map((record, index) => (
                    <LedgerRecordCard
                      key={record.id}
                      record={record}
                      view={view}
                      index={index}
                      selected={selectedIds.has(record.id)}
                      menuOpen={menuId === record.id}
                      onOpenProduct={onOpenProduct}
                      onCopySku={copySku}
                      onToggleSelection={toggleSelection}
                      onToggleMenu={() => setMenuId((current) => current === record.id ? null : record.id)}
                      onMarkImageGenerated={markImageGenerated}
                      onFinalize={finalizeRecord}
                      onRestore={restoreRecord}
                      onRequestMoveToTrash={requestMoveToTrash}
                      onRequestClear={requestClearRecord}
                    />
                  ))}
                </div>
              </section>
            )) : (
              <div className="ledger-empty"><Sparkles size={20} /><strong>{query ? '没有匹配的记录' : view === 'trash' ? '本月垃圾篓是空的' : view === 'finalized' ? '本月还没有已定稿记录' : '本月还没有出图记录'}</strong><span>{query ? '换个关键词试试。' : '切换月份或回到产品列表继续工作。'}</span></div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {isFullscreen && <div className="ledger-fullscreen-hint"><CheckCircle2 size={13} /> 全屏工作区 · 按全屏按钮退出</div>}

      <AnimatePresence>
        {confirm && (
          <motion.div className="confirm-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setConfirm(null)}>
            <motion.div className="confirm-card" role="dialog" aria-modal="true" aria-label={confirm.title} initial={{ opacity: 0, y: 12, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .97 }} onMouseDown={(event) => event.stopPropagation()}>
              <button type="button" className="confirm-close" aria-label="关闭确认框" onClick={() => setConfirm(null)}><X size={15} /></button>
              <span className={'confirm-icon' + (confirm.tone === 'danger' ? ' is-danger' : '')}>{confirm.tone === 'danger' ? <Trash2 size={18} /> : <Check size={18} />}</span>
              <h3>{confirm.title}</h3>
              <p>{confirm.description}</p>
              <div className="confirm-actions"><ElasticButton type="button" className="button button-ghost" onClick={() => setConfirm(null)}>取消</ElasticButton><ElasticButton type="button" className={'button ' + (confirm.tone === 'danger' ? 'button-danger' : 'button-primary')} onClick={() => { confirm.onConfirm(); setConfirm(null) }}>{confirm.confirmLabel}</ElasticButton></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function ClipboardIcon() {
  return <Copy size={13} />
}

function LedgerRecordCard({
  record,
  view,
  index,
  selected,
  menuOpen,
  onOpenProduct,
  onCopySku,
  onToggleSelection,
  onToggleMenu,
  onMarkImageGenerated,
  onFinalize,
  onRestore,
  onRequestMoveToTrash,
  onRequestClear,
}: {
  record: LedgerRecord
  view: LedgerView
  index: number
  selected: boolean
  menuOpen: boolean
  onOpenProduct: (sku: string) => void
  onCopySku: (sku: string) => void
  onToggleSelection: (id: string) => void
  onToggleMenu: () => void
  onMarkImageGenerated: (record: LedgerRecord) => void
  onFinalize: (record: LedgerRecord) => void
  onRestore: (record: LedgerRecord) => void
  onRequestMoveToTrash: (record: LedgerRecord) => void
  onRequestClear: (record: LedgerRecord) => void
}) {
  const openProduct = () => onOpenProduct(record.sku)

  return (
    <motion.article
      className={'ledger-record-card is-' + view + (selected ? ' is-selected' : '') + (menuOpen ? ' is-menu-open' : '')}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * .035, .14), duration: .24 }}
      role="button"
      tabIndex={0}
      onClick={(event) => { if (!(event.target instanceof Element && event.target.closest('button,input'))) openProduct() }}
      onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) { event.preventDefault(); openProduct() } }}
    >
      {view === 'finalized' && <button type="button" className={'ledger-select' + (selected ? ' is-selected' : '')} aria-label={selected ? '取消选择 ' + record.sku : '选择 ' + record.sku} onClick={(event) => { event.stopPropagation(); onToggleSelection(record.id) }}>{selected && <Check size={12} />}</button>}
      <button type="button" className="ledger-record-thumb" aria-label={'打开 ' + record.sku} onClick={openProduct}><ProductArtwork variant={record.variant} className="is-ledger" /><span className={'ledger-thumb-badge ' + stageClass(record.stage)}>{record.stage}</span></button>
      <div className="ledger-record-main">
        <div className="ledger-record-title-row">
          <div className="ledger-record-heading"><button type="button" className="ledger-record-title" onClick={openProduct}><strong>{record.brand} · {record.title}</strong><small>{record.sku}</small></button><span className={'ledger-status ' + stageClass(record.stage)}>{record.stage}</span></div>
          <button type="button" className="ledger-record-more" aria-label="更多记录操作" aria-expanded={menuOpen} onClick={(event) => { event.stopPropagation(); onToggleMenu() }}><MoreHorizontal size={16} /></button>
          {menuOpen && <motion.div className="ledger-record-menu" initial={{ opacity: 0, y: -4, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            {view === 'trash' ? <><button type="button" onClick={() => onRestore(record)}><RotateCcw size={12} />恢复到工作台</button><button type="button" className="is-danger" onClick={() => onRequestClear(record)}><Trash2 size={12} />永久清除</button></> : <><button type="button" onClick={openProduct}><FileImage size={12} />打开产品详情</button>{view === 'finalized' && <button type="button" onClick={() => onCopySku(record.sku)}><Copy size={12} />复制 SKU</button>}<button type="button" className="is-danger" onClick={() => onRequestMoveToTrash(record)}><Trash2 size={12} />移入垃圾篓</button></>}
          </motion.div>}
        </div>
        <div className="ledger-record-tags"><button type="button" className="ledger-sku-tag" onClick={() => onCopySku(record.sku)}><Copy size={11} />{record.sku}</button><span>{record.designType}</span>{record.priority && <span className="is-priority">{record.priority}</span>}{record.performanceType === 'extension' && <span className="is-extension">延伸 · 0.3</span>}</div>
        <div className="ledger-record-assignment"><CalendarDays size={12} />{formatRecordDate(record, view)}</div>
        <div className="ledger-record-bottom">
          <div className={'ledger-flow is-step-' + (record.stage === '已定稿' ? 3 : record.imageGenerated ? 2 : 1)}><span className={record.imageGenerated ? 'is-done' : ''}><i />出图</span><em /><span className={record.stage === '已定稿' ? 'is-done' : ''}><i />定稿</span><em /><span className={record.stage === '已定稿' ? 'is-done' : ''}><i />文件</span></div>
          <div className="ledger-record-actions">
            {view === 'design' && (!record.imageGenerated ? <ElasticButton type="button" className="ledger-action ledger-action-primary" onClick={(event) => { event.stopPropagation(); onMarkImageGenerated(record) }}><FileImage size={12} />出图</ElasticButton> : <ElasticButton type="button" className="ledger-action ledger-action-primary" onClick={(event) => { event.stopPropagation(); onFinalize(record) }}><CheckCircle2 size={12} />定稿</ElasticButton>)}
            {view === 'finalized' && <ElasticButton type="button" className="ledger-action ledger-action-soft" onClick={(event) => { event.stopPropagation(); onCopySku(record.sku) }}><Copy size={12} />复制 SKU</ElasticButton>}
            {view === 'trash' && <ElasticButton type="button" className="ledger-action ledger-action-soft" onClick={(event) => { event.stopPropagation(); onRestore(record) }}><RotateCcw size={12} />恢复</ElasticButton>}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
