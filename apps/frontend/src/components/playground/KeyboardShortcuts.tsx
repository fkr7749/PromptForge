'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SHORTCUTS = [
  { keys: ['⌘', '↵'], description: 'Run prompt', category: 'Execution' },
  { keys: ['⌘', 'K'], description: 'Clear prompt', category: 'Editing' },
  { keys: ['⌘', 'S'], description: 'Save session', category: 'Session' },
  { keys: ['⌘', 'H'], description: 'Toggle history panel', category: 'Session' },
  { keys: ['⌘', 'O'], description: 'Optimize prompt', category: 'AI Tools' },
  { keys: ['⌘', 'G'], description: 'Safety check', category: 'AI Tools' },
  { keys: ['⌘', 'T'], description: 'Translate prompt', category: 'AI Tools' },
  { keys: ['⌘', 'M'], description: 'Toggle compare mode', category: 'Models' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Help' },
]

const CATEGORIES = Array.from(new Set(SHORTCUTS.map((s) => s.category)))

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handler)
    }
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-forge-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-2xl border-2 border-forge-border bg-forge-black shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-forge-border px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-black uppercase tracking-widest text-white">
                    Keyboard Shortcuts
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-forge-muted hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Shortcuts by category */}
              <div className="max-h-[60vh] overflow-y-auto p-6 space-y-5">
                {CATEGORIES.map((category) => (
                  <div key={category}>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-forge-muted">
                      {category}
                    </p>
                    <div className="space-y-1.5">
                      {SHORTCUTS.filter((s) => s.category === category).map((shortcut) => (
                        <div
                          key={shortcut.description}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                        >
                          <span className="text-xs text-white/80">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, i) => (
                              <kbd
                                key={i}
                                className="inline-flex items-center justify-center rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white min-w-[22px]"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t-2 border-forge-border px-6 py-3">
                <p className="text-center text-[10px] text-forge-muted">
                  Press <kbd className="rounded border border-white/20 bg-white/10 px-1 font-mono text-[10px] text-white">Esc</kbd> to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
