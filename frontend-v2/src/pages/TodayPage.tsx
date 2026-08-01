import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, CheckCircle2, ChevronRight, Clock3, FileImage, PackageCheck, Plus, Sparkles } from 'lucide-react'
import { activityItems, productMetrics, queueTasks } from '../data'
import { ProductArtwork } from '../components/ProductArtwork'
import { SectionHeading } from '../components/SectionHeading'
import { StatusBadge } from '../components/StatusBadge'
import { TodayWorkbench } from '../components/TodayWorkbench'

export function TodayPage({ onOpenProduct, onOpenQueue }: { onOpenProduct: (sku?: string) => void; onOpenQueue: () => void }) {
  return (
    <motion.div
      key="today-page"
      className="page-stack"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <section className="welcome-row">
        <div>
          <span className="eyebrow">SATURDAY · 01 AUGUST 2026</span>
          <h1>早上好，Violet</h1>
          <p className="welcome-note">今天有 3 个任务等待你的确认，整体进度保持在舒适区。</p>
        </div>
        <motion.button type="button" className="button button-primary" whileTap={{ scale: 0.97 }} onClick={onOpenQueue}>
          <Plus size={17} />
          新建任务
        </motion.button>
      </section>

      <section className="metric-grid">
        {productMetrics.map((metric, index) => (
          <motion.article
            className="metric-card"
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.045, duration: 0.28 }}
          >
            <span>{metric.label}</span>
            <div className="metric-value-row">
              <strong>{metric.value}</strong>
              <em>{metric.delta}</em>
            </div>
            <small>{metric.note}</small>
          </motion.article>
        ))}
      </section>

      <section className="hero-card">
        <div className="hero-card-copy">
          <span className="eyebrow hero-eyebrow"><Sparkles size={13} /> WORKFLOW PULSE</span>
          <h2>把今天的交付，<br /><span>留在节奏里。</span></h2>
          <p>素材、参数和提审状态都在这里汇合。只处理真正需要你判断的事情。</p>
          <button type="button" className="button button-light" onClick={() => onOpenProduct()}>
            查看产品库
            <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-large" />
          <div className="orbit orbit-small" />
          <div className="hero-core"><PackageCheck size={28} /></div>
          <span className="orbit-dot dot-one" />
          <span className="orbit-dot dot-two" />
          <span className="orbit-dot dot-three" />
        </div>
      </section>

      <div className="content-grid content-grid-wide">
        <section className="surface-panel">
          <SectionHeading eyebrow="IN PROGRESS" title="进行中的工作" note="最近更新的任务会优先显示在这里。" action="查看全部" />
          <div className="task-list">
            <AnimatePresence initial={false}>
              {queueTasks.slice(0, 2).map((task, index) => (
                <motion.button
                  type="button"
                  className="task-row"
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ x: 3 }}
                  onClick={onOpenQueue}
                >
                  <span className="task-icon"><FileImage size={17} /></span>
                  <span className="task-copy">
                    <strong>{task.title}</strong>
                    <small>{task.sku} · {task.detail}</small>
                  </span>
                  <span className="task-progress">
                    <b>{task.progress}%</b>
                    <span className="progress-track"><span style={{ width: task.progress + '%' }} /></span>
                  </span>
                  <ChevronRight size={17} className="row-chevron" />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section className="surface-panel activity-panel">
          <SectionHeading eyebrow="RECENT ACTIVITY" title="活动记录" note="你的工作轨迹会被安静地记下来。" />
          <div className="activity-list">
            {activityItems.map((item) => (
              <div className="activity-row" key={item.time + item.title}>
                <span className={'activity-dot dot-' + item.tone} />
                <time>{item.time}</time>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="activity-footer"><CheckCircle2 size={15} /> 所有系统运行正常</div>
        </section>
      </div>

      <TodayWorkbench onOpenProduct={(sku) => onOpenProduct(sku)} />
    </motion.div>
  )
}
