import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, X, RefreshCw, Sparkles, AlertTriangle, Bot, ArrowDown, TrendingUp, Target, Zap, UserCheck } from 'lucide-react'
import { chatbotService } from '../../services/chatbotService'
import { useUIStore } from '../../store/uiStore'

const DEFAULT_PROMPTS = [
  { text: 'How can I improve my match score?', icon: TrendingUp, color: '#A78BFA' },
  { text: 'What should I learn next?', icon: Target, color: '#F472B6' },
  { text: 'How do I get shortlisted faster?', icon: Zap, color: '#FB923C' },
  { text: 'Profile improvement tips?', icon: UserCheck, color: '#FFE135' },
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

function normalizeAssistantText(rawText) {
  if (!rawText) return ''

  let text = String(rawText)

  // Convert common markdown syntax into plain readable text.
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/`([^`]+)`/g, '$1')
  text = text.replace(/^\s*>\s?/gm, '')

  // Remove simple italic markers while keeping surrounding punctuation.
  text = text.replace(/(^|[\s(])_([^_\n]+)_([.,!?;:)]?)(?=\s|$)/g, '$1$2$3')
  text = text.replace(/(^|[\s(])\*([^*\n]+)\*([.,!?;:)]?)(?=\s|$)/g, '$1$2$3')

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

/* ── Typing Indicator ── */
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="mr-2 mt-1 shrink-0" style={{ width: 28, height: 28 }}>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #FFE135, #FFB800)',
          }}
        >
          <Bot size={14} color="#09090B" />
        </div>
      </div>
      <div
        className="flex items-center gap-1.5 rounded-2xl rounded-tl-md px-4 py-3"
        style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
        }}
      >
        <span className="ai-typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="ai-typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="ai-typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

/* ── Time stamp ── */
function getTimeStamp() {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())
}

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
  const [showScrollBtn, setShowScrollBtn] = useState(false)

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

  const scrollToBottom = useCallback(() => {
    const node = messagesContainerRef.current
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (aiPanelOpen) scrollToBottom()
  }, [aiPanelOpen, messages, scrollToBottom])

  // Scroll detection for "scroll to bottom" button
  useEffect(() => {
    const node = messagesContainerRef.current
    if (!node) return
    const onScroll = () => {
      const distFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight
      setShowScrollBtn(distFromBottom > 100)
    }
    node.addEventListener('scroll', onScroll)
    return () => node.removeEventListener('scroll', onScroll)
  }, [])

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
          setMessages(
            history.messages.map((m) => ({
              role: m.role,
              content: m.role === 'assistant' ? normalizeAssistantText(m.content) : String(m.content || ''),
            }))
          )
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
    setMessages((prev) => [...prev, { role: 'user', content: text, time: getTimeStamp() }])
    setInput('')
    setRequestError('')
    setIsSending(true)

    try {
      const response = await chatbotService.sendMessage(text, sessionId, { forceAssistant: true })
      if (response?.session_id) setSessionId(response.session_id)
      const responseText = normalizeAssistantText(response?.response) || 'I could not generate a response. Try rephrasing.'
      setMessages((prev) => [...prev, { role: 'assistant', content: responseText, time: getTimeStamp() }])
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

  const clearSession = () => {
    window.localStorage.removeItem(ASSISTANT_SESSION_KEY)
    setSessionId(null)
    setMessages([])
  }

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 z-30 flex flex-col border-l shadow-2xl transition-transform duration-500 ease-in-out ${
        aiPanelOpen ? 'translate-x-0' : 'translate-x-full'
      } md:relative md:z-0 md:translate-x-0`}
      style={{
        width: `${panelWidth}px`,
        marginRight: aiPanelOpen ? 0 : `-${panelWidth}px`,
        display: !aiPanelOpen && typeof window !== 'undefined' && window.innerWidth < 768 ? 'none' : 'flex',
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Resizer Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize group z-10"
        onPointerDown={startResizing}
      >
        <div
          className="absolute inset-y-0 left-0 w-px transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-yellow)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        />
      </div>

      {/* ── HEADER ── */}
      <header
        className="flex items-center justify-between shrink-0 px-5"
        style={{
          height: 64,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(24, 24, 27, 0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #FFE135, #FFB800)',
              boxShadow: '0 2px 8px rgba(255, 225, 53, 0.3)',
            }}
          >
            <Sparkles size={18} color="#09090B" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Career AI
            </h2>
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: requestError ? 'var(--danger)' : 'var(--success)' }}
              />
              <p className="font-sans text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                {requestError ? 'Offline' : 'Online • Ready to help'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearSession}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
            style={{
              color: 'var(--text-muted)',
              border: '1px solid transparent',
            }}
            title="New conversation"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--bg-subtle)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={toggleAIPanel}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all md:hidden"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid transparent',
            }}
            aria-label="Close panel"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--bg-subtle)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* ── MESSAGES AREA ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth relative"
        style={{ scrollbarWidth: 'none' }}
      >
        {messages.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            {/* Animated icon */}
            <div
              className="relative mb-5"
              style={{ animation: 'chatbotFloat 3s ease-in-out infinite' }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 225, 53, 0.15), rgba(255, 184, 0, 0.08))',
                  border: '1px solid rgba(255, 225, 53, 0.2)',
                }}
              >
                <Sparkles size={28} style={{ color: 'var(--accent-yellow)' }} />
              </div>
              {/* Sparkle dots */}
              <div
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full"
                style={{
                  background: 'var(--accent-yellow)',
                  animation: 'chatbotPulse 2s ease-in-out infinite',
                }}
              />
              <div
                className="absolute -bottom-0.5 -left-1 h-1.5 w-1.5 rounded-full"
                style={{
                  background: 'var(--accent-cyan)',
                  animation: 'chatbotPulse 2s ease-in-out 0.5s infinite',
                }}
              />
            </div>

            <p className="font-heading text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
              How can I help you today?
            </p>
            <p className="mt-2 text-[13px] leading-relaxed max-w-[260px]" style={{ color: 'var(--text-muted)' }}>
              Ask about match scores, skill improvements, or application strategies.
            </p>

            {/* Quick action grid */}
            <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-[300px]">
              {DEFAULT_PROMPTS.map((prompt) => {
                const IconComp = prompt.icon
                return (
                  <button
                    key={prompt.text}
                    type="button"
                    className="ai-quick-action"
                    onClick={() => sendMessage(prompt.text)}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: `${prompt.color}18`,
                        color: prompt.color,
                      }}
                    >
                      <IconComp size={18} />
                    </span>
                    <span className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
                      {prompt.text}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* ── MESSAGE LIST ── */
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                style={{
                  animation: 'chatMsgIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                  animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
                }}
              >
                {message.role === 'assistant' && (
                  <div className="mr-2 mt-1 shrink-0">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, #FFE135, #FFB800)',
                      }}
                    >
                      <Bot size={14} color="#09090B" />
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1" style={{ maxWidth: '85%' }}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                      message.role === 'assistant' ? 'rounded-tl-md' : 'rounded-tr-md'
                    }`}
                    style={
                      message.role === 'assistant'
                        ? {
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            whiteSpace: 'pre-wrap',
                          }
                        : {
                            background: 'linear-gradient(135deg, #FFE135, #FFB800)',
                            color: '#09090B',
                            fontWeight: 500,
                            whiteSpace: 'pre-wrap',
                          }
                    }
                  >
                    {message.content}
                  </div>
                  {message.time && (
                    <span
                      className={`text-[10px] px-1 ${message.role === 'assistant' ? '' : 'text-right'}`}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {message.time}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isSending && <TypingIndicator />}
          </>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && messages.length > 0 && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute left-1/2 -translate-x-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all"
          style={{
            bottom: 140,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowDown size={14} />
        </button>
      )}

      {/* ── INPUT AREA ── */}
      <div
        className="shrink-0"
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-base)',
          padding: '12px',
        }}
      >
        {/* Quick prompts row (only show when there are messages) */}
        {messages.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {DEFAULT_PROMPTS.map((prompt) => {
              const IconComp = prompt.icon
              return (
                <button
                  key={prompt.text}
                  type="button"
                  className="ai-prompt-chip"
                  onClick={() => sendMessage(prompt.text)}
                >
                  <IconComp size={12} style={{ color: prompt.color }} /> {prompt.text}
                </button>
              )
            })}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <div className="relative flex-1">
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
              className="ai-chat-input"
              rows={1}
            />
          </div>
          <button
            type="submit"
            className="ai-send-btn"
            disabled={isSending || !input.trim()}
          >
            <Send size={16} />
          </button>
        </form>

        {requestError && (
          <div
            className="mt-3 rounded-xl p-3 flex items-start gap-2.5"
            style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}
          >
            <span className="mt-px shrink-0" style={{ color: 'var(--danger)' }}>
              <AlertTriangle size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Career AI is offline</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Start the backend server to enable this feature.</p>
              <button
                type="button"
                onClick={() => { setRequestError(''); setMessages([]) }}
                className="mt-1.5 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--accent-cyan)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
