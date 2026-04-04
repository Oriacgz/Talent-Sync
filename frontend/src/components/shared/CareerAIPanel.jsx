import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Send, X, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react'
import { chatbotService } from '../../services/chatbotService'
import { useUIStore } from '../../store/uiStore'

const DEFAULT_PROMPTS = [
  'How can I improve my match score?',
  'What should I learn next?',
  'How do I get shortlisted faster?',
  'Profile improvement tips?',
]

const PANEL_STORAGE_KEY = 'talentsync:aipanel:width'
const PANEL_MIN_WIDTH = 280
const PANEL_MAX_WIDTH = 500
const DEFAULT_PANEL_WIDTH = 360

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function getStoredPanelWidth() {
  if (typeof window === 'undefined') return DEFAULT_PANEL_WIDTH
  try {
    const rawValue = window.localStorage.getItem(PANEL_STORAGE_KEY)
    if (!rawValue) return DEFAULT_PANEL_WIDTH
    return clamp(Number(rawValue), PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)
  } catch {
    return DEFAULT_PANEL_WIDTH
  }
}

const ASSISTANT_SESSION_KEY = 'talentsync:assistant:session'

export default function CareerAIPanel() {
  const { aiPanelOpen, toggleAIPanel } = useUIStore()
  const [panelWidth, setPanelWidth] = useState(getStoredPanelWidth())
  const [sessionId, setSessionId] = useState(() => {
    try { return window.localStorage.getItem(ASSISTANT_SESSION_KEY) || null } catch { return null }
  })
  
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [requestError, setRequestError] = useState('')
  
  const messagesContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const resizeStartRef = useRef(null)

  const onResizeMove = useCallback((event) => {
    const start = resizeStartRef.current
    if (!start) return
    const nextWidth = start.width + (start.x - event.clientX)
    setPanelWidth(clamp(nextWidth, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH))
  }, [])

  const stopResizing = useCallback(() => {
    if (!resizeStartRef.current) return
    resizeStartRef.current = null
    window.removeEventListener('pointermove', onResizeMove)
    window.removeEventListener('pointerup', stopResizing)
    document.body.style.userSelect = ''
  }, [onResizeMove])

  const startResizing = useCallback((event) => {
    event.preventDefault()
    resizeStartRef.current = {
      x: event.clientX,
      width: panelWidth,
    }
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onResizeMove)
    window.addEventListener('pointerup', stopResizing)
  }, [onResizeMove, panelWidth, stopResizing])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PANEL_STORAGE_KEY, panelWidth.toString())
    }
  }, [panelWidth])

  useEffect(() => () => stopResizing(), [stopResizing])

  useEffect(() => {
    const node = messagesContainerRef.current
    if (!node || !aiPanelOpen) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [aiPanelOpen, messages])

  useEffect(() => {
    const node = textareaRef.current
    if (node) {
      node.style.height = '44px'
      node.style.height = `${Math.min(120, node.scrollHeight)}px`
    }
  }, [input, aiPanelOpen])

  useEffect(() => {
    if (!aiPanelOpen) return
    let active = true
    const loadSession = async () => {
      if (!sessionId) return
      try {
        const history = await chatbotService.getHistory(sessionId)
        if (active && history?.messages?.length) {
          setMessages(history.messages.map((m) => ({ role: m.role, content: m.content })))
        }
      } catch { /* ignore */ }
    }
    loadSession()
    return () => { active = false }
  }, [aiPanelOpen, sessionId])

  useEffect(() => {
    if (sessionId) {
      try { window.localStorage.setItem(ASSISTANT_SESSION_KEY, sessionId) } catch {}
    }
  }, [sessionId])

  const sendMessage = async (rawMessage) => {
    const text = String(rawMessage || '').trim()
    if (!text || isSending) return
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setRequestError('')
    setIsSending(true)

    try {
      const response = await chatbotService.sendMessage(text, sessionId, { forceAssistant: true })
      if (response?.session_id) setSessionId(response.session_id)
      const responseText = String(response?.response || '').trim() || 'I could not generate a response. Try rephrasing.'
      setMessages((prev) => [...prev, { role: 'assistant', content: responseText }])
    } catch {
      setRequestError('offline')
    } finally {
      setIsSending(false)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    await sendMessage(input)
  }

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 z-30 flex flex-col bg-(--bg-card) border-l border-(--border) shadow-2xl transition-transform duration-500 ease-in-out ${
        aiPanelOpen ? 'translate-x-0' : 'translate-x-full'
      } md:relative md:z-0 md:translate-x-0`}
      style={{
        width: `${panelWidth}px`,
        marginRight: aiPanelOpen ? 0 : `-${panelWidth}px`,
        display: !aiPanelOpen && typeof window !== 'undefined' && window.innerWidth < 768 ? 'none' : 'flex'
      }}
    >
      {/* Resizer Handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize group z-10"
        onPointerDown={startResizing}
      >
        <div className="absolute inset-y-0 left-0 w-px bg-transparent group-hover:bg-(--accent-yellow) transition-colors" />
      </div>

      <header className="flex h-16 items-center justify-between border-b border-(--border) bg-(--bg-card)/80 backdrop-blur-md px-5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--bg-subtle) text-(--accent-yellow)">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-[15px] font-bold tracking-tight text-(--text-primary)">Career AI</h2>
            <p className="font-sans text-[11px] text-(--text-muted) truncate">Expert guidance & matching insights</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(ASSISTANT_SESSION_KEY)
              setSessionId(null)
              setMessages([])
            }}
            className="flex h-8 w-8 items-center justify-center rounded border border-transparent text-(--text-muted) hover:border-(--border) hover:bg-(--bg-card) transition-colors"
            title="Clear context"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={toggleAIPanel}
            className="flex h-8 w-8 items-center justify-center rounded border border-transparent text-(--text-secondary) hover:border-(--border) hover:bg-(--bg-card) transition-colors md:hidden"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-(--border) bg-(--bg-subtle) text-(--accent-yellow) mb-4">
              <MessageSquare size={24} />
            </div>
            <p className="font-heading text-[15px] font-bold text-(--text-primary)">How can I help you today?</p>
            <p className="mt-2 text-[13px] text-(--text-muted) leading-relaxed">
              Ask about match scores, skill improvements, or application status.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-bottom-2'}`}>
              {message.role === 'assistant' && (
                <div className="mr-2 mt-1 shrink-0 flex h-7 w-7 items-center justify-center rounded-md border border-(--border) bg-(--text-primary) font-heading text-[10px] font-bold text-(--accent-yellow)">
                  TS
                </div>
              )}
              <div
                className={`max-w-[88%] rounded-xl px-4 py-3 text-[13.5px] leading-relaxed shadow-sm transition-all ${
                  message.role === 'assistant'
                    ? 'bg-(--bg-subtle) border border-(--border) rounded-tl-none text-(--text-primary)'
                    : 'bg-(--accent-yellow) border-transparent rounded-tr-none text-(--text-on-accent) font-medium'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-(--border) bg-(--bg-base) p-3 shrink-0">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {DEFAULT_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="shrink-0 rounded-md border border-(--border) bg-(--bg-subtle) px-3 py-1.5 text-xs text-(--text-secondary) hover:border-(--border-strong) hover:text-(--text-primary) transition-colors"
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex items-end gap-2 px-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void sendMessage(input)
              }
            }}
            placeholder="Type a message..."
            className="min-h-12 w-full resize-none rounded-[10px] border border-(--border) bg-(--bg-card) px-4 py-3 text-[13.5px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent-yellow) focus:ring-1 focus:ring-(--accent-yellow)/20 focus:outline-none transition-all shadow-inner"
            rows={1}
          />
          <button
            type="submit"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-(--accent-yellow) text-(--text-on-accent) hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={isSending || !input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
        {requestError && (
          <div className="mt-2 rounded-md border border-(--border) bg-(--bg-subtle) p-3 flex items-start gap-2">
            <span className="text-[--warning] mt-px shrink-0"><AlertTriangle size={14} /></span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-(--text-primary)">Career AI is offline</p>
              <p className="text-[11px] text-(--text-muted) mt-0.5">Start the backend server to enable this feature.</p>
              <button
                type="button"
                onClick={() => { setRequestError(''); setMessages([]) }}
                className="mt-1.5 text-[11px] font-medium text-(--accent-cyan) hover:underline"
              >
                Clear &amp; retry →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
