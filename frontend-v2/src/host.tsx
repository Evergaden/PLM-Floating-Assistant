import { Component, StrictMode, type ErrorInfo, type ReactNode, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import App, { type AppHostActions } from './App'
import { ProductSkuRail } from './components/ProductSkuRail'
import { TodayWorkbench } from './components/TodayWorkbench'
import { configureLedgerBridge, type LedgerBridgeHost } from './dataBridge'
import type { LedgerView } from './types'
import { ThemeProvider } from './theme/ThemeProvider'
import { ToastProvider } from './components/ToastProvider'
import tokensCss from './theme/tokens.css?inline'
import stylesCss from './styles.css?inline'

export type FrontendV2MountOptions = AppHostActions & {
  storage?: LedgerBridgeHost | null
  shadow?: boolean
  mode?: 'full' | 'legacy-today' | 'legacy-sku-rail'
}

type FrontendV2Runtime = {
  mount: (container: HTMLElement, options?: FrontendV2MountOptions) => () => void
}

type RuntimeGlobal = typeof globalThis & {
  PLMWorkbenchV2?: FrontendV2Runtime
}

const activeMounts = new WeakMap<HTMLElement, () => void>()

const HOST_OVERRIDES = `
:host{display:block!important;width:100%;height:100%;min-width:0;overflow:hidden;border-radius:inherit;background:transparent;color:var(--pfh-ink);}
.plm-v2-shadow-root{width:100%;height:100%;min-width:0;overflow:hidden;}
.plm-v2-render-error{display:grid;place-items:center;width:100%;height:100%;padding:24px;color:#344054;background:linear-gradient(145deg,#f7f5ff,#ffffff 58%,#eef8ff);font:13px/1.5 Arial,"Microsoft YaHei",sans-serif;text-align:center;}
.plm-v2-render-error strong{display:block;color:#372b63;font-size:16px;}
.plm-v2-render-error span{display:block;margin-top:6px;color:#667085;}
.preview-stage{width:100%;min-width:0;min-height:100%;height:100%;padding:14px;overflow:auto;}
.workbench-shell{width:100%;min-width:0;min-height:calc(100% - 28px);height:auto;margin:0;}
.app-sidebar{width:170px;flex-basis:170px;padding:22px 12px 14px;}
.brand-lockup{padding-left:9px;padding-right:9px;padding-bottom:27px;}
.sidebar-label{padding-left:9px;padding-right:9px;}
.app-header{min-height:64px;padding:0 18px;}
.global-search{width:154px;}
.page-stack{padding:22px 20px 30px;}
.preview-caption{display:none;}
`

type RenderErrorBoundaryProps = {
  children: ReactNode
  onError?: (error: Error) => void
}

type RenderErrorBoundaryState = {
  error: Error | null
}

class RenderErrorBoundary extends Component<RenderErrorBoundaryProps, RenderErrorBoundaryState> {
  state: RenderErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): RenderErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError?.(error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="plm-v2-render-error" role="alert">
          <div>
            <strong>新版界面加载失败</strong>
            <span>正在恢复旧版界面，请稍候。</span>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function shadowCss() {
  return `${tokensCss.replace(/:root/g, ':host')}\n${stylesCss}\n${HOST_OVERRIDES}`
}

function renderApp(mountNode: HTMLElement, options: FrontendV2MountOptions) {
  const root: Root = createRoot(mountNode)
  flushSync(() => {
    root.render(
      <StrictMode>
        <RenderErrorBoundary onError={options.onRenderError}>
          <MotionConfig reducedMotion="user">
            <ThemeProvider>
              <ToastProvider>
                {options.mode === 'legacy-today'
                  ? <LegacyTodaySurface host={options} />
                  : options.mode === 'legacy-sku-rail'
                    ? <LegacySkuRailSurface host={options} />
                    : <App host={options} />}
              </ToastProvider>
            </ThemeProvider>
          </MotionConfig>
        </RenderErrorBoundary>
      </StrictMode>,
    )
  })
  return root
}

function LegacyTodaySurface({ host }: { host: FrontendV2MountOptions }) {
  const [ledgerView, setLedgerView] = useState<LedgerView>(() => host.legacy?.getLedgerView?.() ?? 'design')

  useEffect(() => {
    const unsubscribe = host.legacy?.subscribeLedgerView?.((nextView) => setLedgerView(nextView))
    return unsubscribe
  }, [host.legacy])

  const openProduct = (sku: string) => {
    if (host.legacy?.openProduct) {
      host.legacy.openProduct(sku, { tab: '详情', preserveView: true })
      return
    }
    host.onOpenProduct?.(sku)
  }

  return (
    <div className="plm-v2-legacy-today-root">
      <TodayWorkbench onOpenProduct={openProduct} contentOnly externalView={ledgerView} />
    </div>
  )
}

function LegacySkuRailSurface({ host }: { host: FrontendV2MountOptions }) {
  const catalogReader = host.getCatalog ?? host.legacy?.getCatalog
  const [liveCatalog, setLiveCatalog] = useState(() => host.catalog ?? catalogReader?.() ?? [])
  const selectedSku = host.legacy?.getSelectedSku?.() ?? ''
  const preferences = host.legacy?.getProductListPreferences?.()
  const pinnedSkus = useMemo(() => liveCatalog.filter((product) => product.pinned).map((product) => product.sku), [liveCatalog])

  useEffect(() => {
    if (!catalogReader) return
    const refreshCatalog = () => setLiveCatalog(catalogReader() ?? [])
    window.addEventListener('plm-frontend-v2-catalog-change', refreshCatalog)
    refreshCatalog()
    return () => window.removeEventListener('plm-frontend-v2-catalog-change', refreshCatalog)
  }, [catalogReader])

  const openProduct = (sku: string, tab: '详情' | '文案' | '参数图' | '尺寸图' = '详情') => {
    if (host.legacy?.openProduct) {
      host.legacy.openProduct(sku, { tab, preserveView: true })
      return
    }
    host.onOpenProduct?.(sku)
  }

  return (
    <div className="plm-v2-legacy-sku-root">
      <ProductSkuRail
        productCatalog={liveCatalog}
        selectedSku={selectedSku}
        activeTab="详情"
        initialViewMode={preferences?.viewMode}
        initialSort={preferences?.sort}
        initialPinnedSkus={pinnedSkus}
        onChangePreferences={(next) => host.legacy?.setProductListPreferences?.(next)}
        onTogglePin={(sku) => host.legacy?.toggleProductPin?.(sku)}
        onRemoveProduct={(sku) => host.legacy?.removeProduct?.(sku)}
        onSelectProduct={openProduct}
        onOpenFullLibrary={() => host.legacy?.setView?.('home')}
      />
    </div>
  )
}

export function mount(container: HTMLElement, options: FrontendV2MountOptions = {}) {
  activeMounts.get(container)?.()
  configureLedgerBridge(options.storage ?? null)

  if (options.shadow) {
    container.setAttribute('data-plm-v2-theme-host', '')
    const shadow = container.shadowRoot ?? container.attachShadow({ mode: 'open' })
    shadow.innerHTML = `<style>${shadowCss()}</style><div class="plm-v2-shadow-root"></div>`
    const mountNode = shadow.querySelector<HTMLElement>('.plm-v2-shadow-root')
    if (!mountNode) throw new Error('PLM v2 mount root was not created')
    const root = renderApp(mountNode, options)
    const unmount = () => {
      root.unmount()
      shadow.innerHTML = ''
      container.removeAttribute('data-plm-v2-theme-host')
      activeMounts.delete(container)
      configureLedgerBridge(null)
    }
    activeMounts.set(container, unmount)
    return unmount
  }

  const root = renderApp(container, options)
  const unmount = () => {
    root.unmount()
    activeMounts.delete(container)
    configureLedgerBridge(null)
  }
  activeMounts.set(container, unmount)
  return unmount
}

const runtime = globalThis as RuntimeGlobal
runtime.PLMWorkbenchV2 = { mount }
