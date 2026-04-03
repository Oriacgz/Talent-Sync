export default function PillSelect({
  options = [],
  value,
  onChange,
  multiple = false,
  id,
}) {
  const handleClick = (option) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : []
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option]
      onChange(next)
    } else {
      onChange(value === option ? '' : option)
    }
  }

  const isSelected = (option) =>
    multiple
      ? Array.isArray(value) && value.includes(option)
      : value === option

  return (
    <div id={id} className="flex flex-wrap gap-2" role="group">
      {options.map((option) => {
        const selected = isSelected(option.value ?? option)
        const label = option.label ?? option
        const val = option.value ?? option

        return (
          <button
            key={val}
            type="button"
            onClick={() => handleClick(val)}
            className={`
              px-3 py-1.5 text-[12px] font-medium uppercase tracking-wider rounded-full transition-colors cursor-pointer select-none border border-(--border)
              ${selected
                ? 'bg-(--accent-yellow) text-[#09090B] border-(--border-strong)'
                : 'bg-(--bg-subtle) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-strong)'
              }
            `}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
