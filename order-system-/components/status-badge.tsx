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
  preparing: {
    label: "Đang làm",
    icon: ChefHat,
    className: "bg-[var(--status-preparing)] text-white",
  },
  ready: {
    label: "Đã xong",
    icon: CheckCircle2,
    className: "bg-[var(--status-ready)] text-black",
  },
  delivered: {
    label: "Đã mang",
    icon: Truck,
    className: "bg-[var(--status-delivered)] text-black",
  },
  completed: {
    label: "Hoàn thành",
    icon: CheckCircle2,
    className: "bg-accent text-accent-foreground",
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
