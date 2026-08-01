import { motion, type HTMLMotionProps } from 'motion/react'

export function ElasticButton({ className = '', children, ...props }: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      {...props}
      className={className}
      whileHover={props.whileHover ?? { y: -1, scale: 1.015 }}
      whileTap={props.whileTap ?? { scale: 0.95 }}
      transition={props.transition ?? { type: 'spring', stiffness: 460, damping: 24, mass: 0.72 }}
    >
      {children}
    </motion.button>
  )
}
