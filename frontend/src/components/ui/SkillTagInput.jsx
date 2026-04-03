import { useState, useRef } from 'react'
import { X } from 'lucide-react'

export default function SkillTagInput({
  tags = [],
  onChange,
  placeholder = 'Type and press Enter...',
  maxTags = 15,
  id,
}) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const addTag = (raw) => {
    const value = raw.trim()
    if (!value) return
    if (tags.length >= maxTags) return
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) return
    onChange([...tags, value])
    setInput('')
  }

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  return (
    <div
      id={id}
      className="flex flex-wrap items-center gap-2 rounded-[6px] border border-(--border) bg-(--bg-base) p-2 transition-colors focus-within:border-(--border-strong) min-h-[44px] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-[4px] border border-(--border) bg-(--bg-subtle) px-2 py-1 text-[12px] font-medium text-(--text-primary) select-none"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(i) }}
            className="ml-0.5 text-(--text-muted) hover:text-(--text-primary) transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <X size={12} strokeWidth={2} />
          </button>
        </span>
      ))}

      {tags.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-[13px] text-(--text-primary) placeholder:text-(--text-muted) border-none p-0 m-0"
          style={{ boxShadow: 'none' }}
        />
      )}

      {maxTags && (
        <span className="ml-auto text-[10px] font-mono text-(--text-muted) select-none">
          {tags.length}/{maxTags}
        </span>
      )}
    </div>
  )
}
