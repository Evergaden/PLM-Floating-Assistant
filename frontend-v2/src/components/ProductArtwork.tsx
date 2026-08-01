import { Box } from 'lucide-react'

export function ProductArtwork({ variant = 'lavender', compact = false }: { variant?: string; compact?: boolean }) {
  return (
    <div className={'product-artwork product-artwork-' + variant + (compact ? ' is-compact' : '')}>
      <div className="artwork-glow" />
      <div className="artwork-pack">
        <div className="artwork-pack-top" />
        <div className="artwork-pack-face">
          <span className="artwork-brand">W</span>
          <span className="artwork-line" />
          <span className="artwork-name">daily care</span>
        </div>
      </div>
      <div className="artwork-bottle">
        <div className="artwork-bottle-cap" />
        <div className="artwork-bottle-body">
          <Box size={compact ? 16 : 22} strokeWidth={1.7} />
        </div>
      </div>
    </div>
  )
}
