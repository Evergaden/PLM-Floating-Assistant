import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy, Download, FileImage, Info, MoreHorizontal, RefreshCw, ScanLine, Sparkles } from 'lucide-react'
import { type ReactNode } from 'react'
import { products } from '../data'
import { ProductArtwork } from '../components/ProductArtwork'
import { ProductSkuRail } from '../components/ProductSkuRail'
import { SectionHeading } from '../components/SectionHeading'
import { StatusBadge } from '../components/StatusBadge'
import type { ProductDetailTab, ProductRecord } from '../types'

const detailTabs: ProductDetailTab[] = ['详情', '文案', '参数图', '尺寸图']

export function ProductPage({
  product = products[0],
  productCatalog = products,
  activeTab = '详情',
  onChangeTab,
  onSelectProduct,
  onOpenFullLibrary,
  onBackToQueue,
}: {
  product?: ProductRecord
  productCatalog?: ProductRecord[]
  activeTab?: ProductDetailTab
  onChangeTab: (tab: ProductDetailTab) => void
  onSelectProduct: (sku: string, tab?: ProductDetailTab) => void
  onOpenFullLibrary: () => void
  onBackToQueue: () => void
}) {
  const improvementCount = Math.max(1, Math.ceil((100 - product.completion) / 10))

  return (
    <motion.div
      key="product-page"
      className="page-stack product-detail-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="product-detail-workspace">
        <ProductSkuRail productCatalog={productCatalog} selectedSku={product.sku} activeTab={activeTab} onSelectProduct={onSelectProduct} onOpenFullLibrary={onOpenFullLibrary} />
        <div className="product-detail-main">
          <motion.section key={product.sku} className="product-hero" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
            <ProductArtwork variant={product.variant} imageUrl={product.imageUrl} />
            <div className="product-hero-copy">
              <div className="product-meta-line"><StatusBadge status={product.status} /><span>最近同步 · {product.updated}</span></div>
              <h1>{product.title}</h1>
              <p>{product.sku} · {product.brand} · {product.category}</p>
              <div className="product-actions">
                <button type="button" className="button button-primary"><Download size={16} /> 导出资料</button>
                <button type="button" className="icon-button icon-button-light" aria-label="复制 SKU"><Copy size={17} /></button>
                <button type="button" className="icon-button icon-button-light" aria-label="更多操作"><MoreHorizontal size={17} /></button>
              </div>
            </div>
            <div className="product-readiness">
              <div className="readiness-ring"><span>{product.completion}<small>%</small></span></div>
              <span>资料完整度</span>
              <small>还有 {improvementCount} 项可优化</small>
            </div>
          </motion.section>

          <nav className="detail-tabs" aria-label="产品详情视图">
            {detailTabs.map((tab) => (
              <button type="button" key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => onChangeTab(tab)}>
                {activeTab === tab && <motion.span layoutId="product-tab-indicator" className="detail-tab-indicator" transition={{ type: 'spring', stiffness: 430, damping: 32 }} />}
                <span>{tab}</span>
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            {activeTab === '详情' && <DetailOverview key="overview" product={product} onOpenQueue={onBackToQueue} />}
            {activeTab === '文案' && <CopywritingView key="copywriting" />}
            {activeTab === '参数图' && <AssetView key="parameter" title="英文参数图" icon={<FileImage size={20} />} onAction={onBackToQueue} />}
            {activeTab === '尺寸图' && <AssetView key="size" title="产品尺寸图" icon={<ScanLine size={20} />} onAction={onBackToQueue} />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

function DetailOverview({ product, onOpenQueue }: { product: ProductRecord; onOpenQueue: () => void }) {
  return (
    <motion.div className="product-content-grid" initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: 0.2 }}>
      <section className="surface-panel">
        <SectionHeading eyebrow="PRODUCT SNAPSHOT" title="产品信息" note="来自 PLM 的标准化数据。" />
        <div className="detail-table">
          {[
            ['品牌', product.brand],
            ['产品类型', product.category],
            ['素材数量', product.assetCount + ' 项'],
            ['资料完整度', product.completion + '%'],
            ['最近更新', product.updated],
          ].map(([label, value]) => (
            <div key={label}><span>{label}</span><strong>{value}</strong></div>
          ))}
        </div>
      </section>
      <section className="surface-panel insight-panel">
        <div className="insight-mark"><Sparkles size={18} /></div>
        <span className="eyebrow">WORKBENCH INSIGHT</span>
        <h3>这件产品已经接近可以交付的状态。</h3>
        <p>透明底产品图和英文参数图已准备完成。建议先检查资料完整度，再加入提审队列。</p>
        <button type="button" className="button button-secondary" onClick={onOpenQueue}>加入提审队列 <RefreshCw size={15} /></button>
      </section>
      <section className="surface-panel asset-summary">
        <SectionHeading eyebrow="ASSETS" title="资产概览" note={product.assetCount + ' 类核心素材已同步。'} action="打开资产中心" />
        <div className="asset-chips">
          {['主图', '详情图', '英文参数图', '透明 PNG'].map((asset) => <span key={asset}><Check size={14} />{asset}</span>)}
        </div>
      </section>
    </motion.div>
  )
}

function CopywritingView() {
  return (
    <motion.div className="copywriting-view surface-panel" initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: 0.2 }}>
      <SectionHeading eyebrow="COPYWRITING" title="产品文案" note="选择一个内容区块进行复制或编辑。" />
      {['产品卖点', '英文短标题', '详情页描述'].map((label, index) => (
        <article className="copy-block" key={label}>
          <div><span>{label}</span><small>{index === 0 ? '已从 PLM 内容中提取' : '建议内容'}</small></div>
          <p>{index === 0 ? 'A lightweight daily serum set designed to brighten, smooth and refresh the skin.' : 'Radiance Repair Serum Duo'}</p>
          <button type="button" className="icon-button icon-button-light" aria-label="复制内容"><Copy size={15} /></button>
        </article>
      ))}
    </motion.div>
  )
}

function AssetView({ title, icon, onAction }: { title: string; icon: ReactNode; onAction: () => void }) {
  return (
    <motion.div className="asset-view" initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: 0.2 }}>
      <section className="surface-panel asset-preview-panel">
        <div className="asset-preview-top"><div className="asset-preview-title"><span className="icon-box icon-box-purple">{icon}</span><div><span className="eyebrow">GENERATED ASSET</span><h2>{title}</h2></div></div><span className="status-badge status-ready"><Check size={14} /> 已生成</span></div>
        <div className="asset-preview-canvas"><div className="preview-card"><span>WESTMONTH</span><strong>Radiance<br />Repair</strong><small>30 ml · Serum Duo</small><div className="preview-line" /></div></div>
        <div className="asset-preview-actions"><button type="button" className="button button-primary"><Download size={16} /> 保存图片</button><button type="button" className="button button-ghost" onClick={onAction}><RefreshCw size={16} /> 重新生成</button></div>
      </section>
      <section className="surface-panel asset-note-panel"><Info size={18} /><div><strong>生成说明</strong><p>当前预览使用统一的品牌参数图模板，尺寸和字段会在接入真实数据后自动填充。</p></div></section>
    </motion.div>
  )
}
