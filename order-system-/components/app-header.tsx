import type React from "react"
import Image from "next/image"

interface AppHeaderProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  return (
    <div className="sticky top-0 z-20 border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0">
              <Image src="/logo.svg" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nhà hàng Phố</h1>
              {(title || subtitle) && (
                <div className="flex items-center gap-2 text-sm">
                  {title && <span className="font-medium text-gray-700">{title}</span>}
                  {subtitle && <span className="text-gray-500">{subtitle}</span>}
                </div>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
