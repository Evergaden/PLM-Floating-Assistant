import { motion } from 'motion/react'
import { AlertTriangle, ArrowDownToLine, CheckCircle2, ChevronRight, FileArchive, Filter, MoreHorizontal, Pause, Play, Plus, RefreshCw, Search, Trash2, UploadCloud } from 'lucide-react'
import { queueTasks } from '../data'
import { SectionHeading } from '../components/SectionHeading'
import { StatusBadge } from '../components/StatusBadge'
import { ProductArtwork } from '../components/ProductArtwork'

export function QueuePage({ onOpenProduct }: { onOpenProduct: (sku?: string) => void }) {
  return (
    <motion.div
      key="queue-page"
      className="page-stack"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <section className="welcome-row queue-welcome">
        <div>
          <span className="eyebrow">SUBMISSION CENTER</span>
          <h1>提审队列</h1>
          <p className="welcome-note">任务会在后台安静地推进，有需要时再提醒你。</p>
        </div>
        <div className="queue-top-actions">
          <button type="button" className="button button-ghost"><Pause size={16} /> 暂停全部</button>
          <button type="button" className="button button-primary"><Plus size={17} /> 添加任务</button>
        </div>
      </section>

      <section className="queue-toolbar surface-panel">
        <div className="queue-search"><Search size={16} /><input placeholder="搜索 SKU、产品名称或文件" /><kbd>⌘ K</kbd></div>
        <div className="toolbar-actions"><button type="button" className="filter-button"><Filter size={15} /> 全部状态 <ChevronRight size={14} /></button><button type="button" className="icon-button icon-button-light"><MoreHorizontal size={17} /></button></div>
      </section>

      <div className="content-grid queue-grid">
        <section className="surface-panel queue-main-panel">
          <SectionHeading eyebrow="ACTIVE QUEUE · 3 TASKS" title="正在处理" note="最近加入的任务会保持在队列上方。" />
          <div className="queue-list">
            {queueTasks.map((task, index) => (
              <motion.article className={'queue-card queue-card-' + task.status} key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                <ProductArtwork variant={index === 1 ? 'peach' : index === 2 ? 'mint' : 'lavender'} compact />
                <div className="queue-card-main">
                  <div className="queue-card-head"><div><strong>{task.title}</strong><span>{task.sku} · {task.category}</span></div><StatusBadge status={task.status} /></div>
                  <p>{task.detail}</p>
                  <div className="queue-progress-row"><span className="progress-track"><span style={{ width: task.progress + '%' }} /></span><b>{task.progress}%</b></div>
                  <div className="queue-card-foot"><span>{task.eta || '已准备好'}</span><div><button type="button" className="queue-inline-button" onClick={() => onOpenProduct(task.sku)}>查看详情 <ChevronRight size={14} /></button><button type="button" className="icon-button icon-button-mini"><MoreHorizontal size={15} /></button></div></div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <aside className="surface-panel queue-side-panel">
          <div className="queue-side-icon"><UploadCloud size={20} /></div>
          <span className="eyebrow">DROP ZONE</span>
          <h3>把文件放在这里</h3>
          <p>支持 XLSX、ZIP、PNG 和 JPG。脚本会根据 SKU 自动匹配任务。</p>
          <button type="button" className="drop-zone-button"><FileArchive size={17} /> 选择文件</button>
          <div className="queue-side-note"><CheckCircle2 size={15} /> 可安全离开页面，队列会继续运行</div>
        </aside>
      </div>

      <section className="surface-panel history-strip">
        <div className="history-title"><span className="icon-box icon-box-green"><CheckCircle2 size={17} /></span><div><strong>最近完成</strong><small>过去 24 小时完成 8 个任务</small></div></div>
        <div className="history-products">
          {['SKU00044721', 'SKU00044602', 'SKU00044573'].map((sku, index) => <button type="button" key={sku} onClick={() => onOpenProduct(sku)}><ProductArtwork variant={index === 1 ? 'peach' : 'mint'} compact /><span>{sku}</span><CheckCircle2 size={14} /></button>)}
        </div>
        <button type="button" className="text-button">查看历史 <ArrowDownToLine size={15} /></button>
      </section>
    </motion.div>
  )
}
