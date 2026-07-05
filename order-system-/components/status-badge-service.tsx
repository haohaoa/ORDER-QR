import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/lib/stores"

interface StatusBadgeProps {
  status: OrderStatus
}

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Đang chờ", variant: "secondary" },
  ready: { label: "Sẵn sàng", variant: "default" },
  delivered: { label: "Đang giao", variant: "outline" },
  completed: { label: "Hoàn thành", variant: "secondary" },
  payment_requested: { label: "Chờ thanh toán", variant: "destructive" },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
