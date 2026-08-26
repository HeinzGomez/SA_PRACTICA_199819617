import React from 'react'

interface SelectFieldProps {
  id: string
  label: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { label: string; value: string | number }[]
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccione una opción',
  error,
  disabled = false,
  required = false,
}) => {
  const baseClass = error
    ? 'border-red-400 focus:border-red-400'
    : 'border-neutral-200 focus:border-[#9E1FFF] focus:ring-[#9E1FFF]/20';

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={id} className="text-sm font-medium text-neutral-600">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full appearance-none rounded-xl border bg-white px-4 py-2.5 text-[15px] text-neutral-800 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${baseClass}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}