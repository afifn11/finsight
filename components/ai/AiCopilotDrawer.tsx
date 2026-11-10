// components/ai/AiCopilotDrawer.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'model'
  text: string
  timestamp: Date
}

const DEFAULT_SUGGESTIONS = [
  'Apakah budget bulan ini aman?',
  'Berapa total tagihan berulang saya?',
  'Di mana pengeluaran terbesar saya?',
  'Apakah saya bisa belanja ekstra minggu ini?',
]

export function AiCopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Halo! Saya **FinSight Copilot**, penasihat keuangan pintarmu. Saya terhubung langsung dengan saldo dompet, anggaran, dan riwayat transaksimu secara real-time. Apa yang ingin kamu ketahui atau rencanakan hari ini?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, messages, isLoading])

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim()
    if (!query || isLoading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }))

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      })

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(errJson.error ?? 'Gagal menghubungi Copilot')
      }

      const data = (await res.json()) as { reply: string; suggestions?: string[] }

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, modelMsg])
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses jawaban'
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: 'Riwayat percakapan telah direset. Ada hal lain yang ingin kita diskusikan mengenai keuanganmu?',
        timestamp: new Date(),
      },
    ])
    setSuggestions(DEFAULT_SUGGESTIONS)
    setError(null)
  }

  // Format markdown helper for bullet lists and bold text
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n')
    return (
      <div className="space-y-1 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />

          // Bullet points
          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ')
          const cleanLine = isBullet ? line.trim().replace(/^[-•]\s*/, '') : line

          // Parse bold markers **...**
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g)

          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-[var(--text-primary)]">
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return <span key={pIdx}>{part}</span>
          })

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-violet-500 font-bold">•</span>
                <span className="flex-1">{renderedLine}</span>
              </div>
            )
          }

          return <p key={idx}>{renderedLine}</p>
        })}
      </div>
    )
  }

  return (
    <>
      {/* Floating Trigger Button on Bottom-Right */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 md:bottom-8 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl text-white font-medium text-sm transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          boxShadow: '0 8px 24px -4px rgba(124, 58, 237, 0.45)',
        }}
        aria-label="Buka FinSight Copilot"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <Sparkles className="w-4 h-4 text-violet-200" />
        <span className="hidden sm:inline font-semibold tracking-wide">Tanya Copilot AI</span>
      </motion.button>

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-50 flex flex-col shadow-2xl"
              style={{
                background: 'var(--bg-card)',
                borderLeft: '1px solid var(--border-subtle)',
              }}
            >
              {/* Drawer Header */}
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        FinSight Copilot
                      </h3>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                        Gemini 2.5 Flash
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Real-time Personal Financial Advisor
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleResetChat}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
                    title="Mulai percakapan baru"
                    aria-label="Mulai percakapan baru"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
                    title="Tutup drawer"
                    aria-label="Tutup drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'model' && (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                      >
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white rounded-tr-xs'
                          : 'glass-card border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-xs'
                      }`}
                    >
                      {msg.role === 'model' ? (
                        renderFormattedText(msg.text)
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                      <div
                        className={`text-[10px] mt-1.5 ${
                          msg.role === 'user' ? 'text-violet-200 text-right' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {new Intl.DateTimeFormat('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(msg.timestamp)}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--border-subtle)] text-[var(--text-secondary)] shrink-0 mt-0.5"
                      >
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 items-center text-[var(--text-muted)] text-xs pl-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                    >
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="glass-card px-4 py-2.5 rounded-2xl border border-[var(--border-subtle)] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse [animation-delay:0.4s]" />
                      <span className="ml-1 text-[var(--text-secondary)]">Menganalisis data keuangan...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Quick Chips */}
              <div
                className="px-4 py-2 border-t flex flex-wrap gap-1.5 overflow-x-auto max-h-28"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
              >
                <div className="w-full flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mb-0.5">
                  <TrendingUp className="w-3 h-3 text-violet-500" />
                  <span>Saran topik cepat:</span>
                </div>
                {suggestions.map((suggestion, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-xs px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300 text-[var(--text-secondary)] transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>{suggestion}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSendMessage()
                }}
                className="p-3 border-t flex items-center gap-2"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanyakan analisis atau saran keuangan..."
                  disabled={isLoading}
                  className="flex-1 bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] focus:outline-hidden focus:border-violet-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                  aria-label="Kirim pesan"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
