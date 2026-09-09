import React from 'react'

interface PrimaryButtonProps {
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  type = 'button',
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9E1FFF] to-[#2E1FFF] py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#9E1FFF]/30 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}