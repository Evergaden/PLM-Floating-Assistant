import { ArrowUpRight } from 'lucide-react'

export function SectionHeading({
  eyebrow,
  title,
  note,
  action,
}: {
  eyebrow?: string
  title: string
  note?: string
  action?: string
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
      {action && (
        <button type="button" className="text-button">
          {action}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  )
}
