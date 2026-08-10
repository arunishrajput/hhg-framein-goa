/**
 * docs/02 §5: cream-2 fill, 2px rule border, radius md, mono 15px. Label is an eyebrow above, not
 * a placeholder. Shared by the Builder ID and Crew forms.
 */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs font-bold tracking-[0.22em] text-hhg-ink-soft uppercase">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-md border-2 border-hhg-rule bg-hhg-cream-2 px-3.5 py-3 font-mono text-[15px] text-hhg-ink outline-none focus-visible:border-hhg-green focus-visible:outline focus-visible:outline-3 focus-visible:outline-hhg-yellow focus-visible:outline-offset-2"
      />
    </label>
  )
}
