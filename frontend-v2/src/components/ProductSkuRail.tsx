import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, Grid2X2, List, Maximize2, MoreHorizontal, Pin, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { products as defaultProducts } from '../data'
import { ProductArtwork } from './ProductArtwork'
import { StatusBadge } from './StatusBadge'
import type { ProductDetailTab, ProductRecord, ProductViewMode } from '../types'

type ProductListSort = 'assigned' | 'acquired'

const PRODUCT_VIEW_STORAGE_KEY = 'plm-frontend-v2-product-view'
const PRODUCT_SORT_STORAGE_KEY = 'plm-frontend-v2-product-sort'
const PRODUCT_PIN_STORAGE_KEY = 'plm-frontend-v2-product-pins'
const PRODUCT_HIDDEN_STORAGE_KEY = 'plm-frontend-v2-product-hidden'

function readStoredSkuSet(key: string, fallback: string[] = []) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || 'null')
    if (Array.isArray(stored)) return new Set(stored.filter((value): value is string => typeof value === 'string'))
  } catch {
    // Use the supplied defaults when browser storage is unavailable or invalid.
  }
  return new Set(fallback)
}

function readProductListSort(): ProductListSort {
  try {
    return window.localStorage.getItem(PRODUCT_SORT_STORAGE_KEY) === 'acquired' ? 'acquired' : 'assigned'
  } catch {
    return 'assigned'
  }
}

function readProductViewMode(): ProductViewMode {
  try {
    const stored = window.localStorage.getItem(PRODUCT_VIEW_STORAGE_KEY)
    if (stored === 'list' || stored === 'waterfall') return stored
  } catch {
    // Keep the visual default when browser storage is unavailable.
  }
  return 'waterfall'
}

export function ProductSkuRail({
  productCatalog = defaultProducts,
  selectedSku,
  activeTab,
  onOpenFullLibrary,
  onSelectProduct,
}: {
  productCatalog?: ProductRecord[]
  selectedSku: string
  activeTab: ProductDetailTab
  onOpenFullLibrary?: () => void
  onSelectProduct: (sku: string, tab?: ProductDetailTab) => void
}) {
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<ProductViewMode>(readProductViewMode)
  const [sort, setSort] = useState<ProductListSort>(readProductListSort)
  const [page, setPage] = useState(1)
  const [menuSku, setMenuSku] = useState<string | null>(null)
  const [pinnedSkus, setPinnedSkus] = useState<Set<string>>(() => readStoredSkuSet(PRODUCT_PIN_STORAGE_KEY, productCatalog.filter((product) => product.pinned).map((product) => product.sku)))
  const [hiddenSkus, setHiddenSkus] = useState<Set<string>>(() => readStoredSkuSet(PRODUCT_HIDDEN_STORAGE_KEY))

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matches = productCatalog.filter((product) => (
      !hiddenSkus.has(product.sku)
      && (
        !normalizedQuery
        || [product.sku, product.title, product.brand, product.category].join(' ').toLowerCase().includes(normalizedQuery)
      )
    ))
    return matches
      .map((product, index) => ({ product, index }))
      .sort((left, right) => {
        const leftPinned = pinnedSkus.has(left.product.sku)
        const rightPinned = pinnedSkus.has(right.product.sku)
        if (leftPinned !== rightPinned) return leftPinned ? -1 : 1
        if (sort === 'acquired') return right.index - left.index
        return left.index - right.index
      })
      .map(({ product }) => product)
  }, [hiddenSkus, pinnedSkus, productCatalog, query, sort])

  const pageSize = viewMode === 'waterfall' ? 8 : 6
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageProducts = visibleProducts.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [hiddenSkus, query, sort, viewMode])

  useEffect(() => {
    try {
      window.localStorage.setItem(PRODUCT_SORT_STORAGE_KEY, sort)
      window.localStorage.setItem(PRODUCT_PIN_STORAGE_KEY, JSON.stringify([...pinnedSkus]))
      window.localStorage.setItem(PRODUCT_HIDDEN_STORAGE_KEY, JSON.stringify([...hiddenSkus]))
    } catch {
      // The controls remain usable for the current session.
    }
  }, [hiddenSkus, pinnedSkus, sort])

  useEffect(() => {
    if (!menuSku) return
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && !target.closest('.product-sku-card')) setMenuSku(null)
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [menuSku])

  useEffect(() => {
    const selectedIndex = visibleProducts.findIndex((product) => product.sku === selectedSku)
    if (selectedIndex >= 0) setPage(Math.floor(selectedIndex / pageSize) + 1)
  }, [pageSize, selectedSku, visibleProducts])

  const updateViewMode = (nextMode: ProductViewMode) => {
    setViewMode(nextMode)
    try {
      window.localStorage.setItem(PRODUCT_VIEW_STORAGE_KEY, nextMode)
    } catch {
      // The view still changes for the current session.
    }
  }

  const togglePin = (sku: string) => {
    setPinnedSkus((current) => {
      const next = new Set(current)
      if (next.has(sku)) next.delete(sku)
      else next.add(sku)
      return next
    })
    setMenuSku(null)
  }

  const removeFromList = (sku: string) => {
    const nextVisibleProduct = visibleProducts.find((product) => product.sku !== sku)
    if (!nextVisibleProduct) return
    setHiddenSkus((current) => new Set([...current, sku]))
    setMenuSku(null)
    setPage(1)
    if (sku === selectedSku) onSelectProduct(nextVisibleProduct.sku, activeTab)
  }

  return (
    <aside className="product-sku-rail" aria-label="SKU 产品列表">
      <header className="product-sku-rail-head">
        <div>
          <span className="eyebrow">SKU BROWSER</span>
          <strong>产品列表</strong>
          <small>共 {productCatalog.length - hiddenSkus.size} 个 · 当前 {selectedSku}</small>
        </div>
        {onOpenFullLibrary ? <button type="button" className="product-sku-rail-mark" aria-label="打开完整产品库" onClick={onOpenFullLibrary}><Maximize2 size={14} /></button> : <span className="product-sku-rail-mark"><Check size={15} /></span>}
      </header>

      <div className="product-sku-rail-tools">
        <label className="product-sku-search">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 SKU 或产品" aria-label="搜索 SKU 或产品" />
          {query && <button type="button" aria-label="清除 SKU 搜索" onClick={() => setQuery('')}>×</button>}
        </label>
        <div className="product-sku-rail-toolbar">
          <LayoutGroup id="product-sku-rail-view-switch">
            <div className="product-sku-view-switch" role="group" aria-label="SKU 列表视图">
              <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => updateViewMode('list')}>
                {viewMode === 'list' && <motion.span layoutId="product-sku-view-indicator" className="product-sku-view-indicator" />}
                <List size={13} /> 列表
              </button>
              <button type="button" className={viewMode === 'waterfall' ? 'is-active' : ''} onClick={() => updateViewMode('waterfall')}>
                {viewMode === 'waterfall' && <motion.span layoutId="product-sku-view-indicator" className="product-sku-view-indicator" />}
                <Grid2X2 size={13} /> 瀑布流
              </button>
            </div>
          </LayoutGroup>
          <select value={sort} onChange={(event) => setSort(event.target.value as ProductListSort)} aria-label="SKU 排序">
            <option value="assigned">分配时间</option>
            <option value="acquired">获取时间</option>
          </select>
        </div>
      </div>

      {query && (
        <div className="product-sku-result-bar">
          <span>找到 {visibleProducts.length} 个结果</span>
          {visibleProducts.length > 0 && <button type="button" onClick={() => setPinnedSkus((current) => new Set([...current, ...visibleProducts.map((product) => product.sku)]))}>全部置顶</button>}
        </div>
      )}

      <div className="product-sku-rail-scroll">
        {pageProducts.length ? (
          <div className={'product-sku-grid is-' + viewMode}>
            {pageProducts.map((product, index) => (
              <SkuRailCard
                key={product.sku}
                product={product}
                index={index}
                viewMode={viewMode}
                selected={product.sku === selectedSku}
                pinned={pinnedSkus.has(product.sku)}
                menuOpen={menuSku === product.sku}
                activeTab={activeTab}
                onSelectProduct={onSelectProduct}
                onTogglePin={togglePin}
                onToggleMenu={() => setMenuSku((current) => current === product.sku ? null : product.sku)}
                onCloseMenu={() => setMenuSku(null)}
                onRemoveFromList={removeFromList}
              />
            ))}
          </div>
        ) : (
          <div className="product-sku-empty"><Search size={19} /><strong>没有匹配的 SKU</strong><span>清除搜索后继续浏览。</span></div>
        )}
      </div>

      <footer className="product-sku-rail-footer">
        <span>第 {safePage} / {totalPages} 页</span>
        <div>
          <button type="button" aria-label="上一页" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14} /></button>
          <button type="button" aria-label="下一页" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={14} /></button>
        </div>
      </footer>
    </aside>
  )
}

function SkuRailCard({
  product,
  index,
  viewMode,
  selected,
  pinned,
  menuOpen,
  activeTab,
  onSelectProduct,
  onTogglePin,
  onToggleMenu,
  onCloseMenu,
  onRemoveFromList,
}: {
  product: ProductRecord
  index: number
  viewMode: ProductViewMode
  selected: boolean
  pinned: boolean
  menuOpen: boolean
  activeTab: ProductDetailTab
  onSelectProduct: (sku: string, tab?: ProductDetailTab) => void
  onTogglePin: (sku: string) => void
  onToggleMenu: () => void
  onCloseMenu: () => void
  onRemoveFromList: (sku: string) => void
}) {
  return (
    <motion.article
      layout
      className={'product-sku-card product-sku-card-' + viewMode + (selected ? ' is-active' : '') + (pinned ? ' is-pinned' : '')}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.16), duration: 0.2 }}
    >
      <button type="button" className="product-sku-card-main" onClick={() => { onCloseMenu(); onSelectProduct(product.sku, activeTab) }} aria-current={selected ? 'true' : undefined}>
        <div className={'product-sku-thumb media-' + product.mediaSize}>
          <ProductArtwork variant={product.variant} className="is-rail" />
          <span className="product-sku-status"><StatusBadge status={product.status} /></span>
        </div>
        <span className="product-sku-card-meta">
          <strong>{product.title}</strong>
          <small>{product.sku}</small>
          <em>{product.completion}% · {product.assetCount} 项</em>
        </span>
      </button>
      <div className="product-sku-card-actions">
        <button type="button" className={'product-sku-pin' + (pinned ? ' is-on' : '')} aria-label={pinned ? '取消置顶 ' + product.sku : '置顶 ' + product.sku} onClick={() => onTogglePin(product.sku)}><Pin size={12} fill={pinned ? 'currentColor' : 'none'} /></button>
        <button type="button" className="product-sku-more" aria-label="更多 SKU 操作" onClick={onToggleMenu}><MoreHorizontal size={14} /></button>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="product-sku-card-menu" initial={{ opacity: 0, y: -4, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .97 }}>
            <button type="button" onClick={() => { onCloseMenu(); onSelectProduct(product.sku, '详情') }}>打开详情</button>
            <button type="button" onClick={() => { onCloseMenu(); onSelectProduct(product.sku, '参数图') }}>打开参数图</button>
            <button type="button" onClick={() => { onCloseMenu(); onSelectProduct(product.sku, '尺寸图') }}>打开尺寸图</button>
            <button type="button" onClick={() => onTogglePin(product.sku)}>{pinned ? '取消置顶' : '置顶 SKU'}</button>
            <button type="button" onClick={() => onRemoveFromList(product.sku)}>从列表移除</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
