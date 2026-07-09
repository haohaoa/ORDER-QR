import type { OrderStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, CheckCircle2, Truck } from "lucide-react"

interface StatusBadgeProps {
  status: OrderStatus
}

const statusConfig = {
  pending: {
    label: "Chờ xử lý",
    icon: Clock,
    className: "bg-[var(--status-pending)] text-black",
  },
  staffConfirmed: {
    label: "Đã xác nhận",
    icon: CheckCircle2,
    className: "bg-blue-100 text-blue-700",
  },
  preparing: {
    label: "Đang làm",
    icon: ChefHat,
    className: "bg-[var(--status-preparing)] text-white",
  },
  ready: {
    label: "Sẵn sàng",
    icon: CheckCircle2,
    className: "bg-[var(--status-ready)] text-black",
  },
  served: {
    label: "Đã phục vụ",
    icon: Truck,
    className: "bg-[var(--status-ready)] text-black",
  },
  completed: {
    label: "Đã thanh toán",
    icon: CheckCircle2,
    className: "bg-accent text-accent-foreground",
  },
  cancelled: {
    label: "Đã hủy",
    icon: CheckCircle2,
    className: "bg-red-100 text-red-700",
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge className={`${config.className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
