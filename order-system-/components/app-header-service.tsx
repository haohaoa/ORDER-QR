"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/stores"
import { Utensils, Wallet } from 'lucide-react'

interface AppHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  const pathname = usePathname()
  const { getOrdersByStatus, getTables, getTableStatus } = useStore()

  // Calculate notifications
  const readyCount = getOrdersByStatus("ready").length
  const servedCount = getOrdersByStatus("served").length
  const serviceNotifications = readyCount + servedCount

  const tables = getTables()
  const paymentNotifications = tables.filter((tableNumber:any) => {
    const status = getTableStatus(tableNumber)
    return status.paymentRequested
  }).length

  return (
    <div className="border-b bg-white sticky top-0 z-10 shadow-sm">
      {/* Navigation Tabs */}
      <div className="container mx-auto px-4">
        <div className="flex gap-2 border-b border-gray-200">
          <Link href="/service/service" className="flex-1">
            <Button
              variant="ghost"
              className={`w-full h-14 rounded-none border-b-2 transition-colors relative ${
                pathname === "/service"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <Utensils className="h-5 w-5 mr-2" />
              <span className="font-semibold">Phục vụ</span>
              {serviceNotifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-6 min-w-6 flex items-center justify-center p-1 text-xs"
                >
                  {serviceNotifications}
                </Badge>
              )}
            </Button>
          </Link>

          <Link href="/service/payment" className="flex-1">
            <Button
              variant="ghost"
              className={`w-full h-14 rounded-none border-b-2 transition-colors relative ${
                pathname === "/payment"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <Wallet className="h-5 w-5 mr-2" />
              <span className="font-semibold">Thanh toán</span>
              {paymentNotifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-6 min-w-6 flex items-center justify-center p-1 text-xs"
                >
                  {paymentNotifications}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Page Title Section */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
