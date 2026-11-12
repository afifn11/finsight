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
      text: 'Halo! Saya **FinSight Copilot**, asisten keuangan analisamu. Saya terhubung langsung dengan saldo akun, alokasi anggaran, dan histori transaksimu secara real-time. Apa yang ingin kamu analisis atau rencanakan hari ini?',
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

      const data = (await res.json()) as { reply?: string; suggestions?: string[] }
      const replyText =
        data.reply ??
        'Maaf, AI Copilot sedang mengalami sedikit kendala koneksi. Silakan coba beberapa saat lagi.'

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, modelMsg])
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions)
      }
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memproses jawaban'
      setError(errMsg)
      toast.error(errMsg)

      // Graceful fallback bubble so user is not stuck
      const fallbackMsg: ChatMessage = {
        id: `model-err-${Date.now()}`,
        role: 'model',
        text: 'Maaf, AI Copilot sedang mengalami sedikit kendala koneksi atau batasan kuota. Silakan coba tanyakan kembali beberapa saat lagi.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, fallbackMsg])
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
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
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
                <strong key={pIdx} className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return <span key={pIdx}>{part}</span>
          })

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-lime-600 dark:text-lime-400 font-bold">•</span>
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
      {/* Floating Trigger Button: Clean Slate & Emerald Accent */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-20 md:bottom-8 right-5 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-md text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800/80 bg-zinc-900 text-white dark:bg-zinc-800 transition-all duration-200"
        aria-label="Buka FinSight Copilot"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500" />
        </span>
        <Sparkles className="w-3.5 h-3.5 text-lime-400" />
        <span className="font-medium tracking-tight">AI Copilot</span>
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
              className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-50 flex flex-col shadow-2xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800/80"
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-lime-50 dark:bg-lime-950/40 text-lime-600 dark:text-lime-400 border border-lime-200 dark:border-lime-800">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        FinSight Copilot
                      </h3>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-lime-50 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300 border border-lime-200 dark:border-lime-800">
                        Gemini 2.5 Flash
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Asisten Keuangan Real-Time
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleResetChat}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Mulai percakapan baru"
                    aria-label="Mulai percakapan baru"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Tutup drawer"
                    aria-label="Tutup drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'model' && (
                      <div className="w-6 h-6 rounded-md flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5 border border-zinc-200 dark:border-zinc-700">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm ${
                        msg.role === 'user'
                          ? 'bg-lime-600 dark:bg-lime-400 text-white dark:text-zinc-950 font-normal'
                          : 'bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {msg.role === 'model' ? (
                        renderFormattedText(msg.text)
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                      <div
                        className={`text-[10px] mt-1.5 ${
                          msg.role === 'user'
                            ? 'text-lime-100 text-right'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {new Intl.DateTimeFormat('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(msg.timestamp)}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-md flex items-center justify-center bg-lime-50 dark:bg-lime-950/40 text-lime-600 dark:text-lime-400 shrink-0 mt-0.5 border border-lime-200 dark:border-lime-800">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 items-center text-xs text-zinc-500 pl-1">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 border border-zinc-200 dark:border-zinc-700">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-lime-500" />
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700/80 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse [animation-delay:0.4s]" />
                      <span className="ml-1 text-zinc-500 dark:text-zinc-400">
                        Menganalisis data keuangan...
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Quick Chips */}
              <div className="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-wrap gap-1.5 overflow-x-auto max-h-28">
                <div className="w-full flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">
                  <TrendingUp className="w-3 h-3 text-lime-600 dark:text-lime-400" />
                  <span>Saran pertanyaan:</span>
                </div>
                {suggestions.map((suggestion, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-800 hover:border-lime-500 hover:text-lime-600 dark:hover:text-lime-400 text-zinc-600 dark:text-zinc-300 transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>{suggestion}</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSendMessage()
                }}
                className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanyakan analisis atau saran keuangan..."
                  disabled={isLoading}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-hidden focus:border-lime-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 rounded-xl bg-lime-600 dark:bg-lime-400 hover:bg-lime-700 dark:hover:bg-lime-300 text-white dark:text-zinc-950 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
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
