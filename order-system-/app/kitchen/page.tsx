"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireRole } from "@/lib/useAuth"
import { clearAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChefHat, Check, X, LogOut, UtensilsCrossed, Coffee } from "lucide-react"
import { confirmOrderItem, getKitchenQueue, updateOrderItemStatusByApi, getImageUrl } from "@/lib/api"
import Image from "next/image"

type ItemStatus = "pending" | "staffConfirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled"
type FilterTab = "all" | "food" | "drink"

type KitchenOrderItem = {
  id: string
  name: string
  quantity: number
  status?: string | null
  category?: string
  notes?: string | null
  image?: string
  selectedSize?: { name?: string }
  selectedToppings?: Array<{ name: string }>
  selectedOptions?: Array<{ name: string }>
  menuItem?: { images?: Array<{ image?: string }> }
}

type KitchenOrder = {
  id: string
  tableNumber?: string
  table?: { name?: string; number?: string }
  status: string
  createdAt: string | Date
  items: KitchenOrderItem[]
}

const DRINK_CATEGORIES = ["Đồ uống", "Nước"]

function getElapsedMinutes(createdAt: string | Date, now: Date) {
  const created = new Date(createdAt).getTime()
  return Math.max(0, Math.floor((now.getTime() - created) / 60000))
}

export default function KitchenPage() {
  useRequireRole(["kitchen", "manager", "admin"])
  const router = useRouter()
  const [now, setNow] = useState(new Date())
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([])
  const [cancelingItem, setCancelingItem] = useState<{ order: KitchenOrder; item: KitchenOrderItem } | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [filterTab, setFilterTab] = useState<FilterTab>("all")

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(interval)
  }, [])

  const loadKitchenQueue = async () => {
    try {
      const data = await getKitchenQueue()
      const mappedOrders = (data || []).map((order: any) => ({
        id: order.id,
        table: order.table,
        tableNumber: order.table?.name || order.table?.number || order.tableNumber,
        status: order.status,
        createdAt: order.createdAt,
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 1,
          status: item.status,
          category: item.menuItem?.category?.name || item.category,
          notes: item.note,
          image: getImageUrl(item.menuItem?.images?.[0]?.image || item.details?.image || item.image),
          selectedSize: item.details?.selectedSize || item.selectedSize || null,
          selectedToppings: item.details?.selectedToppings || item.selectedToppings || [],
          selectedOptions: item.details?.selectedOptions || item.selectedOptions || [],
          menuItem: item.menuItem,
        })),
      }))
      setKitchenOrders(mappedOrders)
    } catch (error) {
      console.error("Failed to load kitchen queue", error)
      setKitchenOrders([])
    }
  }

  useEffect(() => {
    void loadKitchenQueue()
  }, [])

  const activeOrders = useMemo(() => {
    return [...kitchenOrders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }, [kitchenOrders])

  const matchesFilter = (category: string) => {
    if (filterTab === "all") return true
    const isDrink = DRINK_CATEGORIES.includes(category)
    return filterTab === "drink" ? isDrink : !isDrink
  }

  // A table only disappears once every item in it is ready/served/completed or cancelled.
  const visibleOrders = activeOrders.filter((order) =>
    order.items.some((item) => {
      const status = (item.status || order.status) as ItemStatus
      return status !== "cancelled" && status !== "ready" && status !== "served" && status !== "completed" && matchesFilter(item.category || "")
    }),
  )

  // Tapping an item only ever changes THAT item. Everything else in the
  // table stays exactly as it was.
  const handleConfirm = async (orderId: string, itemId: string) => {
    await confirmOrderItem(orderId, itemId)
    await loadKitchenQueue()
  }

  const handleStartPreparing = async (orderId: string, itemId: string) => {
    await updateOrderItemStatusByApi(orderId, itemId, "preparing")
    await loadKitchenQueue()
  }

  const handleComplete = async (orderId: string, itemId: string) => {
    await updateOrderItemStatusByApi(orderId, itemId, "ready")
    await loadKitchenQueue()
  }

  const handleCancelItem = async () => {
    if (cancelingItem && cancelReason) {
      await updateOrderItemStatusByApi(cancelingItem.order.id, cancelingItem.item.id, "cancelled")
      setCancelingItem(null)
      setCancelReason("")
      await loadKitchenQueue()
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push("/auth/login")
  }

  const TableCard = ({ order }: { order: KitchenOrder }) => {
    const items: Array<{ item: KitchenOrderItem; index: number; status: ItemStatus }> = order.items
      .map((item, index) => ({ item, index, status: (item.status || order.status) as ItemStatus }))
      .filter(({ status, item }) => status !== "cancelled" && status !== "ready" && status !== "served" && status !== "completed" && matchesFilter(item.category || ""))

    const minutes = getElapsedMinutes(order.createdAt, now)

    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        {/* Quiet header: table name (small) + time only */}
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <span className="text-sm font-medium text-gray-600">Bàn {order.tableNumber || order.table?.name || order.table?.number}</span>
          <span className="text-xs text-gray-400">{minutes} phút</span>
        </div>

        <div className="space-y-2 p-2">
          {items.map(({ item, index, status }) => (
            <div key={index} className="flex items-stretch gap-2">
              {status === "ready" || status === "served" || status === "completed" ? (
                // Completed: quiet, low-emphasis, non-interactive
                <div className="flex flex-1 items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-2 opacity-50">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-500 line-through">{item.name}</p>
                  </div>
                  <Check className="h-4 w-4 shrink-0 text-gray-400" />
                </div>
              ) : (
                <>
                  <button
                    onClick={() => status === "pending" && handleConfirm(order.id, item.id)}
                    className={`flex flex-1 items-center gap-3 rounded-md border p-2 text-left transition-colors ${status === "preparing"
                      ? "border-2 border-amber-400 bg-white"
                      : "border-gray-200 bg-white active:bg-gray-50"
                      }`}
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md">
                      <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                        <span className="shrink-0 text-xs font-bold text-gray-500">x{item.quantity}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status === "preparing"
                            ? "bg-amber-100 text-amber-700"
                            : status === "staffConfirmed"
                              ? "bg-blue-100 text-blue-700"
                              : status === "pending"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-green-100 text-green-700"
                            }`}
                        >
                          {status === "preparing"
                            ? "Đang làm"
                            : status === "staffConfirmed"
                              ? "Đã xác nhận"
                              : status === "pending"
                                ? "Chờ xác nhận"
                                : "Đã hoàn tất"}
                        </span>
                      </div>
                      {(item.selectedSize || (item.selectedToppings?.length ?? 0) > 0 || (item.selectedOptions?.length ?? 0) > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {item.selectedSize && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200">
                              📐 {item.selectedSize.name}
                            </span>
                          )}
                          {(item.selectedOptions ?? []).map((opt: any, i: number) => (
                            <span key={`opt-${i}`} className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                              ✓ {opt.groupName ? `${opt.groupName}: ${opt.name}` : opt.name}
                            </span>
                          ))}
                          {(item.selectedToppings ?? []).map((t: any, i: number) => (
                            <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 ring-1 ring-purple-200">
                              + {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <div className="mt-1.5 flex items-start gap-1 rounded-md border-l-2 border-orange-400 bg-orange-50 px-2 py-1">
                          <span className="text-[10px] font-black uppercase tracking-wide text-orange-500">YC:</span>
                          <span className="text-[10px] font-semibold leading-tight text-orange-700">{item.notes}</span>
                        </div>
                      )}
                    </div>
                  </button>

                  {status === "pending" ? (
                    <Button
                      size="sm"
                      className="h-auto shrink-0 bg-slate-600 px-3 text-xs font-semibold hover:bg-slate-700 text-white"
                      onClick={() => handleConfirm(order.id, item.id)}
                    >
                      Xác nhận
                    </Button>
                  ) : status === "staffConfirmed" ? (
                    <Button
                      size="sm"
                      className="h-auto shrink-0 bg-blue-600 px-3 text-xs font-semibold hover:bg-blue-700"
                      onClick={() => handleStartPreparing(order.id, item.id)}
                    >
                      Nhận món
                    </Button>
                  ) : status === "preparing" ? (
                    <Button
                      size="sm"
                      className="h-auto shrink-0 bg-amber-500 px-3 text-xs font-semibold hover:bg-amber-600"
                      onClick={() => handleComplete(order.id, item.id)}
                    >
                      Xong món
                    </Button>
                  ) : null}

                  <button
                    onClick={() => setCancelingItem({ order, item })}
                    className="flex w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-400 active:bg-gray-50"
                    aria-label="Hủy món"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Minimal top bar: just "Bếp" and logout */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3">
        <span className="text-base font-semibold text-gray-900">Bếp</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-500 active:bg-gray-100"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>

      {/* Filter switch */}
      <div className="sticky top-[52px] z-30 border-b bg-white px-3 py-2">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">
          {(
            [
              { key: "all", label: "Tất cả", icon: UtensilsCrossed },
              { key: "food", label: "Món ăn", icon: ChefHat },
              { key: "drink", label: "Đồ uống", icon: Coffee },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${filterTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-3">
        {visibleOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white py-16">
            <ChefHat className="mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">Không có món nào đang chờ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleOrders.map((order) => (
              <TableCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={cancelingItem !== null} onOpenChange={(open) => !open && setCancelingItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Hủy món: {cancelingItem?.item.name}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="mb-3 text-xs text-gray-600">Vui lòng chọn lý do hủy:</p>
            <RadioGroup value={cancelReason} onValueChange={setCancelReason}>
              <div className="space-y-2">
                {["Hết món", "Nguyên liệu không đủ", "Lỗi hệ thống"].map((reason) => (
                  <div key={reason} className="flex items-center space-x-2 rounded-lg border bg-gray-50 p-3">
                    <RadioGroupItem value={reason} id={reason} />
                    <Label htmlFor={reason} className="flex-1 cursor-pointer text-sm">
                      {reason}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelingItem(null)}>
              Đóng
            </Button>
            <Button variant="destructive" size="sm" onClick={handleCancelItem} disabled={!cancelReason}>
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}