import { Check, Palette } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useTheme } from '../theme/ThemeProvider'

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme, options } = useTheme()
  const activeTheme = options.find((option) => option.id === theme) ?? options[0]

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className="theme-switcher-trigger"
        aria-label="切换主题"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Palette size={16} />
        <span className="theme-switcher-label">{activeTheme.label}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="theme-menu"
            initial={{ opacity: 0, y: -7, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -7, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <span className="theme-menu-eyebrow">WORKBENCH THEME</span>
            {options.map((option) => (
              <button
                type="button"
                key={option.id}
                className={'theme-option' + (option.id === theme ? ' is-active' : '')}
                onClick={() => {
                  setTheme(option.id)
                  setOpen(false)
                }}
              >
                <span className="theme-swatch" style={{ background: option.swatch }} />
                <span className="theme-option-copy"><strong>{option.label}</strong><small>{option.description}</small></span>
                {option.id === theme && <Check size={15} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
