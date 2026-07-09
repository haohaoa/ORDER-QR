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
  staffConfirmed: { label: "Đã xác nhận", variant: "default" },
  preparing: { label: "Đang làm", variant: "outline" },
  ready: { label: "Sẵn sàng", variant: "default" },
  served: { label: "Đã phục vụ", variant: "outline" },
  completed: { label: "Đã thanh toán", variant: "secondary" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
  payment_requested: { label: "Chờ thanh toán", variant: "destructive" },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
