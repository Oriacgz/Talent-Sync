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
    <section className="stack-base">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-primary-hero">Profile Onboarding</h1>
          <p className="text-secondary">Answer quick questions to generate a richer profile.</p>
        </div>
        <button
          onClick={handleReset}
          className="btn-secondary whitespace-nowrap px-3 py-1.5 text-[13px]"
          title="Restart Onboarding Session"
          type="button"
        >
          <RefreshCw className="mr-2 inline h-[14px] w-[14px]" /> Restart
        </button>
      </header>

      <div className="card-base">
        <div className="mb-4 h-72 space-y-2 overflow-y-auto rounded-[4px] border-2 border-[var(--border)] bg-[var(--bg)] p-4 shadow-[3px_3px_0px_var(--border)]">
          {messages.length === 0 ? (
            <div className="surface-muted border-dashed text-sm text-ink/70">
              Starting your onboarding session...
            </div>
          ) : null}
          {messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`rounded-[4px] border-2 px-3 py-2 text-sm ${
                item.role === 'user'
                  ? 'border-[var(--border)] bg-[var(--yellow)]/40 text-ink'
                  : 'border-[var(--border)] bg-[var(--bg-soft)] text-ink/80'
              }`}
            >
              {item.content}
            </div>
          ))}
          {assistantTyping ? (
            <div className="rounded-[4px] border-2 border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-sm text-ink/80">
              TalentSync is typing
              <span className="ml-1 inline-block animate-pulse">.</span>
              <span className="inline-block animate-pulse [animation-delay:150ms]">.</span>
              <span className="inline-block animate-pulse [animation-delay:300ms]">.</span>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Type your message..."
            disabled={loading || assistantTyping}
            className="input-brutal flex-1"
          />
          <button
            type="button"
            disabled={loading || assistantTyping}
            onClick={sendMessage}
            className="btn-primary btn-feedback disabled:opacity-60"
          >
            {loading || assistantTyping ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {profileComplete ? (
        <button
          type="button"
          onClick={() => navigate('/student/matches')}
          className="btn-secondary btn-feedback w-full sm:w-fit"
        >
          View My Matches
        </button>
      ) : null}
    </section>
  )
}