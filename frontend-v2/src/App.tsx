import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Bell, Command, Home, LayoutDashboard, PackageOpen, PanelLeftClose, Search, Settings2, Sparkles, UploadCloud, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { navItems, products } from './data'
import type { ProductDetailTab, ViewId } from './types'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { TodayPage } from './pages/TodayPage'
import { ProductPage } from './pages/ProductPage'
import { ProductLibraryPage } from './pages/ProductLibraryPage'
import { QueuePage } from './pages/QueuePage'

const navIcons = {
  today: LayoutDashboard,
  product: PackageOpen,
  queue: UploadCloud,
} satisfies Record<ViewId, typeof LayoutDashboard>

function App() {
  const [activeView, setActiveView] = useState<ViewId>('today')
  const [selectedProductSku, setSelectedProductSku] = useState<string | null>(null)
  const [productTab, setProductTab] = useState<ProductDetailTab>('详情')
  const [panelOpen, setPanelOpen] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const activeNav = useMemo(() => navItems.find((item) => item.id === activeView) ?? navItems[0], [activeView])
  const selectedProduct = products.find((product) => product.sku === selectedProductSku) ?? products[0]

  const openProductBrowser = () => {
    setSelectedProductSku(products[0].sku)
    setProductTab('详情')
    setActiveView('product')
  }

  const openFullProductLibrary = () => {
    setSelectedProductSku(null)
    setProductTab('详情')
    setActiveView('product')
  }

  const openProduct = (sku?: string, tab: ProductDetailTab = '详情') => {
    setSelectedProductSku(sku ?? products[0].sku)
    setProductTab(tab)
    setActiveView('product')
  }

  const handleNavChange = (view: ViewId) => {
    setActiveView(view)
    if (view === 'product') {
      setSelectedProductSku(products[0].sku)
      setProductTab('详情')
    }
  }

  if (!panelOpen) {
    return (
      <main className="preview-stage is-collapsed">
        <motion.button type="button" className="reopen-button" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.95 }} onClick={() => setPanelOpen(true)}>
          <Sparkles size={17} /> 打开工作台
        </motion.button>
      </main>
    )
  }

  return (
    <main className="preview-stage">
      <motion.section className="workbench-shell" initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>
        <aside className="app-sidebar">
          <div className="brand-lockup"><div className="brand-mark"><Sparkles size={17} /></div><div><strong>PLM</strong><span>WORKBENCH</span></div></div>
          <div className="sidebar-label">WORKSPACE</div>
          <LayoutGroup id="main-navigation">
            <nav className="main-nav">
              {navItems.map((item) => {
                const Icon = navIcons[item.id]
                const isActive = item.id === activeView
                return (
                  <button type="button" key={item.id} className={'nav-item' + (isActive ? ' is-active' : '')} onClick={() => handleNavChange(item.id)}>
                    {isActive && <motion.span layoutId="active-nav" className="nav-active-indicator" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
                    <Icon size={17} strokeWidth={isActive ? 2.25 : 1.8} />
                    <span>{item.label}</span>
                    {item.badge && <em>{item.badge}</em>}
                  </button>
                )
              })}
            </nav>
          </LayoutGroup>
          <div className="sidebar-spacer" />
          <div className="sidebar-tip"><Sparkles size={15} /><span>工作节奏<br /><strong>保持得很好</strong></span></div>
          <button type="button" className="sidebar-bottom-button"><Wrench size={17} /><span>工具箱</span></button>
          <button type="button" className="sidebar-bottom-button"><Settings2 size={17} /><span>设置</span></button>
          <div className="user-chip"><span className="avatar">V</span><span><strong>Violet</strong><small>产品运营</small></span><PanelLeftClose size={15} /></div>
        </aside>

        <div className="app-main">
          <header className="app-header">
            <div className="breadcrumb"><Home size={14} /><span>/</span><strong>{activeNav.label}</strong></div>
            <div className="header-actions">
              <label className="global-search"><Search size={15} /><input placeholder="搜索 SKU 或功能" /><kbd><Command size={11} /> K</kbd></label>
              <ThemeSwitcher />
              <button type="button" className="icon-button header-icon-button" aria-label="通知" onClick={() => setShowNotifications((value) => !value)}><Bell size={17} /><span className="notification-dot" /></button>
              <button type="button" className="icon-button header-icon-button" aria-label="关闭工作台" onClick={() => setPanelOpen(false)}><PanelLeftClose size={17} /></button>
            </div>
            <AnimatePresence>
              {showNotifications && (
                <motion.div className="notification-popover" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.18 }}>
                  <span className="eyebrow">NOTIFICATIONS</span><strong>3 个任务需要关注</strong><p>有一项产品资料缺少透明底图片。</p><button type="button" className="text-button" onClick={() => { setShowNotifications(false); setActiveView('queue') }}>打开提审队列</button>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <div className="page-viewport">
            <AnimatePresence mode="wait" initial={false}>
              {activeView === 'today' && <TodayPage key="today" onOpenProduct={openProductBrowser} onOpenQueue={() => setActiveView('queue')} />}
              {activeView === 'product' && !selectedProductSku && <ProductLibraryPage key="product-library" onOpenProduct={openProduct} />}
              {activeView === 'product' && selectedProductSku && <ProductPage key="product-detail" product={selectedProduct} productCatalog={products} activeTab={productTab} onChangeTab={setProductTab} onSelectProduct={openProduct} onOpenFullLibrary={openFullProductLibrary} onBackToQueue={() => setActiveView('queue')} />}
              {activeView === 'queue' && <QueuePage key="queue" onOpenProduct={openProduct} />}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>
      <div className="preview-caption"><span><span className="caption-pulse" /> Frontend v2 preview</span><span>React · Motion · Lucide</span></div>
    </main>
  )
}

export default App
