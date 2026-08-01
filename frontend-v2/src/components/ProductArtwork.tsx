import { Box } from 'lucide-react'

export function ProductArtwork({ variant = 'lavender', compact = false, className = '', imageUrl }: { variant?: string; compact?: boolean; className?: string; imageUrl?: string }) {
  return (
    <div className={('product-artwork product-artwork-' + variant + (compact ? ' is-compact' : '') + (imageUrl ? ' has-real-image' : '') + ' ' + className).trim()}>
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
      {imageUrl && <img className="artwork-real-image" src={imageUrl} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
    </div>
  )
}
