import React from 'react'

interface InputFieldProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
}) => {
  const baseClass = error ? 'border-red-300 focus:border-red-400' : 'border-neutral-200 focus:border-[#9E1FFF] focus:ring-[#9E1FFF]/20'

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={id} className="text-sm font-medium text-neutral-600">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:ring-2 ${baseClass} disabled:cursor-not-allowed disabled:opacity-60`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}