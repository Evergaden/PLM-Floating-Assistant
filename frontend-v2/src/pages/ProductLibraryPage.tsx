import { LayoutGroup, motion } from 'motion/react'
import { Check, Grid2X2, List, Pin, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { products } from '../data'
import { ProductArtwork } from '../components/ProductArtwork'
import { SectionHeading } from '../components/SectionHeading'
import { StatusBadge } from '../components/StatusBadge'
import type { ProductRecord, ProductViewMode } from '../types'

const PRODUCT_VIEW_STORAGE_KEY = 'plm-frontend-v2-product-view'

function readProductViewMode(): ProductViewMode {
  try {
    const stored = window.localStorage.getItem(PRODUCT_VIEW_STORAGE_KEY)
    if (stored === 'list' || stored === 'waterfall') return stored
  } catch {
    // The default remains useful when storage is unavailable.
  }
  return 'waterfall'
}

export function ProductLibraryPage({ onOpenProduct }: { onOpenProduct: (sku: string) => void }) {
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<ProductViewMode>(readProductViewMode)

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return products
    return products.filter((product) =>
      [product.sku, product.title, product.brand, product.category]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query])

  const updateViewMode = (nextMode: ProductViewMode) => {
    setViewMode(nextMode)
    try {
      window.localStorage.setItem(PRODUCT_VIEW_STORAGE_KEY, nextMode)
    } catch {
      // The view still changes for the current session.
    }
  }

  return (
    <motion.div
      key="product-library-page"
      className="page-stack"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <section className="welcome-row library-welcome">
        <div>
          <span className="eyebrow"><Sparkles size={13} /> PRODUCT LIBRARY</span>
          <h1>产品库</h1>
          <p className="welcome-note">所有 SKU 的素材状态都在这里，继续沿用你熟悉的瀑布流浏览。</p>
        </div>
        <div className="library-summary">
          <strong>{products.length}</strong>
          <span>个产品已同步</span>
        </div>
      </section>

      <section className="product-library-toolbar surface-panel">
        <label className="library-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 SKU、产品名称或品牌" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="library-toolbar-actions">
          <LayoutGroup id="product-library-view-switch">
            <div className="product-view-switch" role="group" aria-label="产品库视图">
              <button type="button" className={viewMode === 'waterfall' ? 'is-active' : ''} onClick={() => updateViewMode('waterfall')}>
                {viewMode === 'waterfall' && <motion.span layoutId="product-view-indicator" className="product-view-indicator" transition={{ type: 'spring', stiffness: 430, damping: 32 }} />}
                <Grid2X2 size={15} /> 瀑布流
              </button>
              <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => updateViewMode('list')}>
                {viewMode === 'list' && <motion.span layoutId="product-view-indicator" className="product-view-indicator" transition={{ type: 'spring', stiffness: 430, damping: 32 }} />}
                <List size={15} /> 列表
              </button>
            </div>
          </LayoutGroup>
          <button type="button" className="filter-button"><SlidersHorizontal size={15} /> 筛选</button>
        </div>
      </section>

      <section className="surface-panel product-library-panel">
        <SectionHeading
          eyebrow={viewMode === 'waterfall' ? 'WATERFALL VIEW' : 'LIST VIEW'}
          title="全部产品"
          note={query ? '找到 ' + visibleProducts.length + ' 个匹配结果' : '按最近更新排序，置顶产品会优先显示。'}
          action={viewMode === 'waterfall' ? '瀑布流已保留' : undefined}
        />
        {visibleProducts.length ? (
          <div className={'product-library-grid is-' + viewMode}>
            {visibleProducts.map((product, index) => (
              <ProductCard key={product.sku} product={product} index={index} viewMode={viewMode} onOpenProduct={onOpenProduct} />
            ))}
          </div>
        ) : (
          <div className="product-library-empty">
            <Search size={22} />
            <strong>没有找到匹配的产品</strong>
            <span>试试 SKU、品牌或产品名称。</span>
          </div>
        )}
      </section>
    </motion.div>
  )
}

function ProductCard({
  product,
  index,
  viewMode,
  onOpenProduct,
}: {
  product: ProductRecord
  index: number
  viewMode: ProductViewMode
  onOpenProduct: (sku: string) => void
}) {
  return (
    <motion.button
      type="button"
      layout
      className={'product-card product-card-' + viewMode + (product.pinned ? ' is-pinned' : '')}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.24), duration: 0.28 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onOpenProduct(product.sku)}
      aria-label={'打开 ' + product.title + ' ' + product.sku}
    >
      <div className={'product-card-media media-' + product.mediaSize}>
        <ProductArtwork variant={product.variant} className="is-library" />
        <span className="product-card-status"><StatusBadge status={product.status} /></span>
        {product.pinned && <span className="product-card-pin" title="已置顶"><Pin size={13} fill="currentColor" /></span>}
      </div>
      <span className="product-card-body">
        <span className="product-card-title-row"><strong>{product.title}</strong><Check size={14} className="product-card-check" /></span>
        <span className="product-card-meta">{product.sku} · {product.brand}</span>
        <span className="product-card-footer"><span>{product.assetCount} 项素材</span><span>{product.completion}% 完整度</span><span>{product.updated}</span></span>
      </span>
    </motion.button>
  )
}
