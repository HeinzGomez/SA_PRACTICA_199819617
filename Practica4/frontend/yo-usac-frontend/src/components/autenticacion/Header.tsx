import React from 'react'

interface HeaderProps {
  appName?: string
}

export const Header: React.FC<HeaderProps> = ({ appName = 'YoUsac' }) => {
  return (
    <header className="w-full bg-white px-8 py-6 sm:px-12 sm:py-7">
      <h1 className="inline-flex items-center gap-3 text-2xl font-bold text-neutral-800 sm:text-3xl">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#9E1FFF] to-[#2E1FFF] text-base font-extrabold text-white">
          U
        </span>
        {appName}
      </h1>
    </header>
  )
}