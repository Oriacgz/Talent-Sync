/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Chat interface for student onboarding. Uses the unified
 *                 /api/chat endpoint with session tracking. When backend
 *                 returns profile_complete=true, shows "View My Matches" button.
 * DEPENDS ON: chatbotService, react-router-dom
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { chatbotService } from '../../services/chatbotService'
import { useToast } from '../shared/useToast'

const ASSISTANT_TYPING_DELAY_MS = 2000

const splitAssistantResponse = (text) => {
  if (!text || typeof text !== 'string') return []
  return text
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function OnboardingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [assistantTyping, setAssistantTyping] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null)
  const isMountedRef = useRef(true)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const pushAssistantMessages = async (reply, replace = false) => {
    const parts = splitAssistantResponse(reply)
    const assistantParts = parts.length ? parts : [reply || 'No response available.']

    if (replace && isMountedRef.current) {
      setMessages([])
    }

    for (let index = 0; index < assistantParts.length; index += 1) {
      if (!isMountedRef.current) return
      setAssistantTyping(true)
      await wait(ASSISTANT_TYPING_DELAY_MS)
      if (!isMountedRef.current) return

      const nextMessage = { role: 'assistant', content: assistantParts[index] }
      if (replace && index === 0) {
        setMessages([nextMessage])
      } else {
        setMessages((prev) => [...prev, nextMessage])
      }
      setAssistantTyping(false)
    }
  }

  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    const initializeOnboarding = async () => {
      try {
        if (isMountedRef.current) {
          setMessages([])
        }
        const result = await chatbotService.resetSession()
        if (result?.session_id && isMountedRef.current) {
          setSessionId(result.session_id)
        }

        const fallbackResponse =
          '👋 Welcome to TalentSync! I\'m your AI career assistant. Let\'s build your profile to find the best job matches for you.\n\nNow let\'s talk about your skills.\n\nList your technical skills separated by commas (e.g., Python, React, SQL, Machine Learning).'
        const reply = result?.response || fallbackResponse
        await pushAssistantMessages(reply, true)
        if (isMountedRef.current) {
          setProfileComplete(Boolean(result?.profile_complete))
        }
      } catch {
        const fallbackResponse =
          '👋 Welcome to TalentSync! I\'m your AI career assistant. Let\'s build your profile to find the best job matches for you.\n\nNow let\'s talk about your skills.\n\nList your technical skills separated by commas (e.g., Python, React, SQL, Machine Learning).'
        await pushAssistantMessages(fallbackResponse, true)
      }
    }

    initializeOnboarding()
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = message.trim()
    if (!text || loading || assistantTyping) return

    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setMessage('')

    try {
      const response = await chatbotService.sendMessage(text, sessionId)
      const reply = response?.response || 'No response available.'
      if (response?.session_id) {
        setSessionId(response.session_id)
      }

      await pushAssistantMessages(reply)
      setProfileComplete(Boolean(response?.profile_complete))
    } catch {
      await pushAssistantMessages('Something went wrong. Please try again.')
      toast.error('Could not send your message. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (loading || assistantTyping) return

    setLoading(true)
    try {
      setMessages([])
      const result = await chatbotService.resetSession()
      if (result?.session_id) {
        setSessionId(result.session_id)
      }

      setProfileComplete(Boolean(result?.profile_complete))
      const fallbackResponse =
        '👋 Welcome to TalentSync! I\'m your AI career assistant. Let\'s build your profile to find the best job matches for you.\n\nNow let\'s talk about your skills.\n\nList your technical skills separated by commas (e.g., Python, React, SQL, Machine Learning).'
      const reply = result?.response || fallbackResponse

      await pushAssistantMessages(reply, true)
      toast.success('Started a fresh onboarding session.')
    } catch {
      setAssistantTyping(false)
      toast.error('Could not reset onboarding. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-12 w-full max-w-none">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-[26px] font-bold text-(--text-primary)">Profile Onboarding</h1>
          <p className="font-sans text-[14px] text-(--text-secondary)">Answer quick questions to generate a richer profile.</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-[6px] bg-(--bg-subtle) px-3 py-1.5 font-heading text-[13px] font-medium text-(--text-primary) border border-(--border) hover:bg-(--bg-card) transition-colors"
          title="Restart Onboarding Session"
          type="button"
        >
          <RefreshCw size={14} className="inline-block" />
          <span>Restart</span>
        </button>
      </header>

      <div className="flex flex-col gap-4 rounded-[8px] border border-(--border) bg-(--bg-card) p-6">
        <div className="mb-4 h-[400px] space-y-4 overflow-y-auto rounded-[8px] bg-(--bg-subtle)/50 p-6 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-(--border) bg-(--bg-subtle) text-(--accent-yellow) font-heading text-xs font-bold">TS</span>
              <p className="mt-4 text-[13px] text-(--text-muted)">Starting your onboarding session...</p>
            </div>
          ) : null}
          {messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`flex ${item.role === 'user' ? 'justify-end animate-in fade-in slide-in-from-bottom-2' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-[12px] px-4 py-2.5 text-[13.5px] leading-relaxed border ${
                  item.role === 'user'
                    ? 'bg-(--accent-yellow) border-transparent rounded-tr-none text-[#09090B] font-medium'
                    : 'bg-(--bg-card) border-(--border) rounded-tl-none text-(--text-primary)'
                }`}
              >
                {item.content}
              </div>
            </div>
          ))}
          {assistantTyping ? (
            <div className="flex justify-start">
              <div className="rounded-[12px] rounded-tl-none border border-(--border) bg-(--bg-card) px-4 py-2.5 text-[13px] text-(--text-primary)">
                TalentSync is typing...
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row border-t border-(--border) pt-6">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Type your response..."
            disabled={loading || assistantTyping}
            className="flex-1 rounded-[8px] border border-(--border) bg-(--bg-card) px-4 py-2.5 text-[14px] text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent-yellow) focus:outline-none transition-all"
          />
          <button
            type="button"
            disabled={loading || assistantTyping}
            onClick={sendMessage}
            className="rounded-[8px] bg-(--accent-yellow) px-6 py-2.5 font-heading text-[13.5px] font-bold uppercase text-[#09090B] transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading || assistantTyping ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {profileComplete ? (
        <button
          type="button"
          onClick={() => navigate('/student/matches')}
          className="rounded-[8px] bg-(--text-primary) px-6 py-3 font-heading text-[14px] font-bold uppercase tracking-wider text-(--bg-base) transition-all hover:opacity-90 w-full sm:w-fit"
        >
          View My Matches
        </button>
      ) : null}

      <div className="hidden" aria-hidden="true">
        <title>Identity Onboarding | TalentSync</title>
      </div>
    </div>
  )
}