import React from 'react'
import type { CuentaTab } from '../../types/cuenta.types'

interface CuentaSidebarProps {
  activeTab: CuentaTab
  onSelectTab: (tab: CuentaTab) => void
}

export const CuentaSidebar: React.FC<CuentaSidebarProps> = ({ activeTab, onSelectTab }) => {
  const menuItems: { key: CuentaTab; label: string }[] = [
    { key: 'informacion', label: 'Información Personal' },
    { key: 'seguridad', label: 'Seguridad y Acceso' },
  ]

  return (
    <nav className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key
        return (
          <button
            key={item.key}
            type="button"
            className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
              isActive
                ? 'bg-[#9E1FFF]/10 font-semibold text-[#7a00c9]'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
            onClick={() => onSelectTab(item.key)}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}