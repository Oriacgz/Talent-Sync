/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Chat interface with Gemini-powered bot to build student profile
 *                 conversationally. Sends messages via chatbotService.
 *                 When backend returns profile_complete=true, shows
 *                 "View My Matches" button.
 * DEPENDS ON: chatbotService, profileService, react-router-dom
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatbotService } from '../../services/chatbotService'
import { useToast } from '../shared/useToast'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [history, setHistory] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)

  const sendMessage = async () => {
    const text = message.trim()
    if (!text || loading) {
      return
    }
    setLoading(true)

    const nextHistory = [...history, { role: 'user', content: text }]
    setHistory(nextHistory)
    setMessage('')

    try {
      const response = await chatbotService.sendMessage(text, nextHistory)
      const reply = response?.response || 'No response available.'
      setHistory((prev) => [...prev, { role: 'assistant', content: reply }])
      setProfileComplete(Boolean(response?.profile_complete))
    } catch {
      setHistory((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
      toast.error('Could not send your message. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="stack-base">
      <header>
        <h1 className="text-primary-hero">Profile Onboarding</h1>
        <p className="text-secondary">Answer quick questions to generate a richer profile.</p>
      </header>

      <div className="card-base">
        <div className="mb-4 h-72 space-y-2 overflow-y-auto rounded-[4px] border-2 border-[var(--border)] bg-[var(--bg)] p-4 shadow-[3px_3px_0px_var(--border)]">
          {history.length === 0 ? (
            <div className="surface-muted border-dashed text-sm text-ink/70">
              Start by telling us your name, skills, preferred role, and location. The more context you share, the better your matches.
            </div>
          ) : null}
          {history.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`rounded-[4px] border-2 px-3 py-2 text-sm ${item.role === 'user' ? 'border-[var(--border)] bg-[var(--yellow)]/40 text-ink' : 'border-[var(--border)] bg-[var(--bg-soft)] text-ink/80'}`}
            >
              {item.content}
            </div>
          ))}
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
            className="input-brutal flex-1"
          />
          <button type="button" disabled={loading} onClick={sendMessage} className="btn-primary btn-feedback disabled:opacity-60">
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {profileComplete ? (
        <button type="button" onClick={() => navigate('/student/matches')} className="btn-secondary btn-feedback w-full sm:w-fit">
          View My Matches
        </button>
      ) : null}
    </section>
  )
}