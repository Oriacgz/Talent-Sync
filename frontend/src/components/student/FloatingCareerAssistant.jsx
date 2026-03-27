import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GripHorizontal, MessageSquare, Send, X } from 'lucide-react'
import { applicationService } from '../../services/applicationService'
import { chatbotService } from '../../services/chatbotService'
import { matchService } from '../../services/matchService'
import { profileService } from '../../services/profileService'
import { useMatchStore } from '../../store/matchStore'
import { getSkillGapInsight } from '../../utils/formatters'

const DEFAULT_PROMPTS = [
  'How can I improve my match score?',
  'What should I learn next for my target jobs?',
  'How do I get shortlisted faster?',
  'What projects should I add to improve my profile?',
]

const MAX_QUICK_ACTIONS = 4
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'
const PANEL_STORAGE_KEY = 'talentsync:assistant:size'
const PANEL_MIN_WIDTH = 340
const PANEL_MIN_HEIGHT = 420
const PANEL_MAX_WIDTH = 560
const PANEL_MAX_HEIGHT = 760
const DEFAULT_PANEL_SIZE = {
  width: 392,
  height: 560,
}
const MotionSection = motion.section

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function getMaxPanelBounds() {
  if (typeof window === 'undefined') {
    return {
      width: PANEL_MAX_WIDTH,
      height: PANEL_MAX_HEIGHT,
    }
  }

  return {
    width: Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, window.innerWidth - 24)),
    height: Math.max(PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, window.innerHeight - 32)),
  }
}

function clampPanelSize(size) {
  const bounds = getMaxPanelBounds()
  return {
    width: clamp(Number(size?.width) || DEFAULT_PANEL_SIZE.width, PANEL_MIN_WIDTH, bounds.width),
    height: clamp(Number(size?.height) || DEFAULT_PANEL_SIZE.height, PANEL_MIN_HEIGHT, bounds.height),
  }
}

function getStoredPanelSize() {
  if (typeof window === 'undefined') {
    return DEFAULT_PANEL_SIZE
  }

  try {
    const rawValue = window.localStorage.getItem(PANEL_STORAGE_KEY)
    if (!rawValue) {
      return DEFAULT_PANEL_SIZE
    }
    const parsed = JSON.parse(rawValue)
    return clampPanelSize(parsed)
  } catch {
    return DEFAULT_PANEL_SIZE
  }
}

function normalizeSkills(skills) {
  return Array.isArray(skills) ? skills.map((item) => String(item || '').trim()).filter(Boolean) : []
}

function buildPromptSuggestions({ profile, matches, applications, skillGap }) {
  const prompts = [...DEFAULT_PROMPTS]
  const profileSkills = normalizeSkills(profile?.skills)
  const preferredRoles = Array.isArray(profile?.preferredRoles) ? profile.preferredRoles : []
  const shortlistedCount = (applications || []).filter((item) => String(item?.status || '').toUpperCase() === 'SHORTLISTED').length

  if (skillGap?.skill) {
    prompts.unshift(`How do I close the ${skillGap.skill} skill gap?`)
  }

  if (profileSkills.includes('React') && !profileSkills.includes('TypeScript')) {
    prompts.push('How should I learn TypeScript for frontend roles?')
  }

  if (profileSkills.includes('Python') && !profileSkills.includes('Java')) {
    prompts.push('Where can I study Java for backend readiness?')
  }

  if (preferredRoles.some((role) => String(role).toLowerCase().includes('ml'))) {
    prompts.push('What should I focus on this month for ML roles?')
  }

  if (shortlistedCount === 0 && applications?.length) {
    prompts.push('Why am I not getting shortlisted yet?')
  }

  if (matches?.length) {
    prompts.push('Which skills are missing for my top match?')
  }

  return Array.from(new Set(prompts)).slice(0, MAX_QUICK_ACTIONS)
}

function formatAssistantContent(content) {
  const raw = String(content || '').trim()
  if (!raw) {
    return []
  }

  const hasExplicitBullets = /(^|\n)\s*[-*•]\s+/.test(raw) || /(^|\n)\s*\d+\.\s+/.test(raw)

  if (hasExplicitBullets) {
    const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean)
    const intro = []
    const bullets = []

    lines.forEach((line) => {
      if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
        bullets.push(line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, ''))
      } else {
        intro.push(line)
      }
    })

    return [{ paragraphs: intro, bullets }]
  }

  // Auto-format long dense responses into short paragraphs and bullets when useful.
  const sections = raw.split('\n\n').map((part) => part.trim()).filter(Boolean)

  return sections.map((section) => {
    if (section.includes(':') && section.length > 120) {
      const [head, tail] = section.split(':', 2)
      const bulletCandidates = tail
        .split(/[;,]|\band\b/gi)
        .map((item) => item.trim())
        .filter((item) => item.length > 2)

      if (bulletCandidates.length >= 3) {
        return {
          paragraphs: [`${head.trim()}:`],
          bullets: bulletCandidates.slice(0, 6),
        }
      }
    }

    const sentences = section
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)

    const paragraphs = []
    for (let index = 0; index < sentences.length; index += 2) {
      paragraphs.push(sentences.slice(index, index + 2).join(' '))
    }

    return { paragraphs, bullets: [] }
  })
}

function buildContextPayload({ profile, matches, applications, skillGap }) {
  return {
    student_profile: {
      full_name: profile?.fullName || profile?.name || null,
      college: profile?.college || null,
      gpa: profile?.gpa || profile?.cgpa || null,
      skills: normalizeSkills(profile?.skills),
      preferred_roles: Array.isArray(profile?.preferredRoles) ? profile.preferredRoles : [],
      preferred_locations: Array.isArray(profile?.preferredLocations) ? profile.preferredLocations : [],
    },
    applications: {
      total: applications.length,
      shortlisted: applications.filter((item) => String(item?.status || '').toUpperCase() === 'SHORTLISTED').length,
      selected: applications.filter((item) => String(item?.status || '').toUpperCase() === 'SELECTED').length,
    },
    top_matches: (matches || []).slice(0, 3).map((match) => ({
      id: match?.id,
      title: match?.title || match?.roleTitle || null,
      score: match?.score || match?.finalScore || 0,
      required_skills: normalizeSkills(match?.requiredSkills),
      missing_skills: normalizeSkills(match?.missingSkills),
    })),
    skill_gap: skillGap
      ? {
          skill: skillGap.skill,
          prevalence_percent: skillGap.prevalencePercent,
        }
      : null,
  }
}

export default function FloatingCareerAssistant() {
  const matchStoreMatches = useMatchStore((state) => state.matches)
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : false
  ))
  const [panelSize, setPanelSize] = useState(() => getStoredPanelSize())
  const [loadingContext, setLoadingContext] = useState(false)
  const [contextData, setContextData] = useState({
    profile: null,
    matches: [],
    applications: [],
    skillGap: null,
  })
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Career Assistant is ready. Ask about skill gaps, shortlist strategy, or what to learn next based on your profile.',
    },
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [requestError, setRequestError] = useState('')
  const messagesContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const resizeStartRef = useRef(null)

  const onResizeMove = useCallback((event) => {
    const start = resizeStartRef.current
    if (!start) {
      return
    }

    const nextWidth = start.width - (event.clientX - start.x)
    const nextHeight = start.height - (event.clientY - start.y)
    setPanelSize(clampPanelSize({ width: nextWidth, height: nextHeight }))
  }, [])

  const stopResizing = useCallback(() => {
    if (!resizeStartRef.current) {
      return
    }

    resizeStartRef.current = null
    window.removeEventListener('pointermove', onResizeMove)
    window.removeEventListener('pointerup', stopResizing)
    document.body.style.userSelect = ''
  }, [onResizeMove])

  const startResizing = useCallback((event) => {
    if (!isDesktop) {
      return
    }

    event.preventDefault()
    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: panelSize.width,
      height: panelSize.height,
    }
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onResizeMove)
    window.addEventListener('pointerup', stopResizing)
  }, [isDesktop, onResizeMove, panelSize.height, panelSize.width, stopResizing])

  const syncTextareaHeight = useCallback(() => {
    const node = textareaRef.current
    if (!node) {
      return
    }

    node.style.height = '44px'
    node.style.height = `${Math.min(120, node.scrollHeight)}px`
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const updateDesktopState = (event) => {
      setIsDesktop(event.matches)
    }

    setIsDesktop(mediaQuery.matches)
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateDesktopState)
      return () => mediaQuery.removeEventListener('change', updateDesktopState)
    }

    mediaQuery.addListener(updateDesktopState)
    return () => mediaQuery.removeListener(updateDesktopState)
  }, [])

  useEffect(() => {
    if (!isDesktop || typeof window === 'undefined') {
      return
    }

    const syncBounds = () => {
      setPanelSize((previous) => clampPanelSize(previous))
    }

    window.addEventListener('resize', syncBounds)
    return () => window.removeEventListener('resize', syncBounds)
  }, [isDesktop])

  useEffect(() => {
    if (!isDesktop || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(panelSize))
  }, [isDesktop, panelSize])

  useEffect(() => () => {
    stopResizing()
  }, [stopResizing])

  useEffect(() => {
    const node = messagesContainerRef.current
    if (!node || !isOpen) {
      return
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior: 'smooth',
    })
  }, [isOpen, messages])

  useEffect(() => {
    syncTextareaHeight()
  }, [input, isOpen, syncTextareaHeight])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let active = true
    const loadContext = async () => {
      setLoadingContext(true)
      const [profileResult, applicationsResult, matchesResult] = await Promise.allSettled([
        profileService.getMyProfile(),
        applicationService.getMyApplications(),
        matchStoreMatches?.length ? Promise.resolve(matchStoreMatches) : matchService.getMyMatches(20),
      ])

      if (!active) {
        return
      }

      const profile = profileResult.status === 'fulfilled' ? profileResult.value : null
      const applications = applicationsResult.status === 'fulfilled' && Array.isArray(applicationsResult.value)
        ? applicationsResult.value
        : []
      const matches = matchesResult.status === 'fulfilled' && Array.isArray(matchesResult.value)
        ? matchesResult.value
        : []
      const skillGap = getSkillGapInsight(matches.slice(0, 3), [])

      setContextData({
        profile,
        applications,
        matches,
        skillGap,
      })
      setLoadingContext(false)
    }

    loadContext().catch(() => {
      if (!active) {
        return
      }
      setLoadingContext(false)
    })

    return () => {
      active = false
    }
  }, [isOpen, matchStoreMatches])

  const suggestions = useMemo(
    () => buildPromptSuggestions(contextData),
    [contextData],
  )

  const sendMessage = async (rawMessage) => {
    const text = String(rawMessage || '').trim()
    if (!text || isSending) {
      return
    }

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setRequestError('')
    setIsSending(true)

    try {
      const payloadContext = buildContextPayload(contextData)
      const response = await chatbotService.sendMessageContextual(
        text,
        nextMessages,
        payloadContext,
      )

      const responseText = String(response?.response || '').trim() || 'I could not generate a response right now. Try rephrasing your question.'
      setMessages((prev) => [...prev, { role: 'assistant', content: responseText }])
    } catch {
      setRequestError('Assistant is temporarily unavailable. You can still improve your profile and retry shortly.')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not reach the assistant service. Focus on your top missing skill and retry in a moment.',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    await sendMessage(input)
  }

  const panelStyle = isDesktop
    ? {
        width: `${panelSize.width}px`,
        height: `${panelSize.height}px`,
      }
    : undefined

  return (
    <div className="fixed bottom-3 right-3 z-50 md:bottom-6 md:right-6" aria-live="polite">
      <AnimatePresence>
        {isOpen ? (
          <MotionSection
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.985 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={panelStyle}
            className="assistant-panel relative flex max-h-[72dvh] w-[min(96vw,390px)] max-w-[96vw] flex-col overflow-hidden rounded-sm border-2 border-(--border) bg-(--bg) shadow-[6px_6px_0_var(--border)] md:max-h-[calc(100dvh-72px)] md:max-w-none"
          >
            <header className="flex items-center justify-between border-b-2 border-(--border) bg-(--yellow) px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-mono text-[11px] uppercase tracking-widest text-ink">TalentSync Assistant</p>
                <p className="truncate text-[11px] text-ink/75">Personalized career guidance</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="icon-btn"
                aria-label="Close assistant"
              >
                <X size={16} />
              </button>
            </header>

            <div
              ref={messagesContainerRef}
              className="assistant-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f9f7f2] p-3"
            >
              {loadingContext ? (
                <p className="text-xs text-ink/65">Preparing your profile context...</p>
              ) : null}

              {messages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[84%] rounded-xl px-3 py-2.5 text-xs leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.08)] ${
                      message.role === 'assistant'
                        ? 'bg-white text-ink'
                        : 'bg-[#fff1b8] text-ink'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="space-y-2">
                        {formatAssistantContent(message.content).map((block, blockIndex) => (
                          <div key={`${index}-block-${blockIndex}`} className="space-y-2">
                            {block.paragraphs.map((paragraph, paragraphIndex) => (
                              <p key={`${index}-p-${paragraphIndex}`} className="text-[12px] leading-5 text-ink/90">
                                {paragraph}
                              </p>
                            ))}
                            {block.bullets.length ? (
                              <ul className="list-disc space-y-1 pl-4 text-[12px] leading-5 text-ink/90">
                                {block.bullets.map((bullet, bulletIndex) => (
                                  <li key={`${index}-b-${bulletIndex}`}>{bullet}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] leading-5 text-ink/95">{message.content}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t-2 border-(--border) bg-(--bg) px-3 pb-3 pt-2.5">
              <div className="assistant-scrollbar mb-2.5 flex gap-2 overflow-x-auto pb-1">
                {suggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="shrink-0 rounded-full border border-ink/20 bg-white px-3 py-1.5 text-[11px] text-ink/85 transition-colors duration-150 hover:bg-[#f2f0ea]"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="flex items-end gap-2">
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
                  placeholder="Ask how to improve your profile and match outcomes"
                  className="min-h-11 w-full resize-none rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none transition-colors duration-150 placeholder:text-ink/45 focus:border-ink/40"
                  rows={1}
                />
                <button
                  type="submit"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-(--border) bg-(--yellow) text-ink shadow-[3px_3px_0_var(--border)] transition-transform duration-100 hover:-translate-x-px hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-65"
                  disabled={isSending || !input.trim()}
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </form>

              {requestError ? <p className="mt-2 text-[11px] text-ink/65">{requestError}</p> : null}
            </div>

            {isDesktop ? (
              <button
                type="button"
                className="assistant-resize-handle"
                onPointerDown={startResizing}
                aria-label="Resize assistant panel"
              >
                <GripHorizontal size={12} />
              </button>
            ) : null}
          </MotionSection>
        ) : null}
      </AnimatePresence>

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn-primary btn-feedback h-14 w-14 rounded-sm p-0"
          aria-label="Open career assistant"
        >
          <MessageSquare size={18} />
        </button>
      ) : null}
    </div>
  )
}
