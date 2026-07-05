"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Truck, Receipt } from "lucide-react"

interface AppNavigationProps {
  serviceCount: number
  paymentCount: number
}

export function AppNavigation({
  serviceCount,
  paymentCount,
}: AppNavigationProps) {
  const pathname = usePathname()

  const isService = pathname.startsWith("/service/service")
  const isPayment = pathname.startsWith("/service/payment")

  const navItemClass = (active: boolean) =>
    `relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2
     py-3 sm:py-4 px-2 sm:px-4
     font-medium sm:font-semibold text-sm sm:text-base
     transition-all
     ${
       active
         ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-blue-600"
         : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
     }`

  return (
    <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <div className="flex">
          {/* PHỤC VỤ */}
          <Link href="/service/service" className="flex-1">
            <div className={navItemClass(isService)}>
              <Truck className="w-5 h-5" />
              <span>Phục vụ</span>

              {serviceCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-1 right-4 sm:static sm:ml-1
                             min-w-[22px] h-5 px-1 text-xs flex items-center justify-center"
                >
                  {serviceCount}
                </Badge>
              )}
            </div>
          </Link>

          {/* THANH TOÁN */}
          <Link href="/service/payment" className="flex-1">
            <div className={navItemClass(isPayment)}>
              <Receipt className="w-5 h-5" />
              <span>Thanh toán</span>

              {paymentCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-1 right-4 sm:static sm:ml-1
                             min-w-[22px] h-5 px-1 text-xs flex items-center justify-center"
                >
                  {paymentCount}
                </Badge>
              )}
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
