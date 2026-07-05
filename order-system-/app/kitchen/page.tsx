"use client"

import { useEffect, useState } from "react"
import { useRequireRole } from "@/lib/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChefHat, Clock, CheckCircle2, XCircle, Coffee, UtensilsCrossed } from "lucide-react"
import { useStore } from "@/lib/store"
import { getTimeSince } from "@/lib/format"
import { AppHeader } from "@/components/app-header"
import type { Order } from "@/lib/types"
import { StatusBadge } from "@/components/status-badge"
import Image from "next/image"

export default function KitchenPage() {
  useRequireRole(["kitchen", "manager", "admin"])
  const { updateOrderItemStatus, getOrdersByStatus } = useStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [cancelingItem, setCancelingItem] = useState<{ order: Order; item:any; itemIndex: number } | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [filterTab, setFilterTab] = useState<"all" | "food" | "drink">("all")

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const pendingOrders = getOrdersByStatus("pending")
  const preparingOrders = getOrdersByStatus("preparing")

  const filterOrderItems = (orders: Order[]) => {
    if (filterTab === "all") return orders

    return orders
      .map((order) => ({
        ...order,
        items: order.items.filter((item) => {
          if (filterTab === "food") {
            return item.category !== "Đồ uống" && item.category !== "Nước"
          } else {
            return item.category === "Đồ uống" || item.category === "Nước"
          }
        }),
      }))
      .filter((order) => order.items.length > 0)
  }

  const filteredPending = filterOrderItems(pendingOrders)
  const filteredPreparing = filterOrderItems(preparingOrders)

  const handleAcceptItem = (orderId: string, itemIndex: number) => {
    updateOrderItemStatus(orderId, itemIndex, "preparing")
  }

  const handleCompleteItem = (orderId: string, itemIndex: number) => {
    updateOrderItemStatus(orderId, itemIndex, "ready")
  }

  const handleCancelItem = () => {
    if (cancelingItem && cancelReason) {
      updateOrderItemStatus(cancelingItem.order.id, cancelingItem.itemIndex, "cancelled", cancelReason)
      setCancelingItem(null)
      setCancelReason("")
    }
  }

  const OrderCard = ({ order, showAccept }: { order: Order; showAccept: boolean }) => (
    <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-sm font-bold">
                Bàn {order.tableNumber}
              </Badge>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeSince(order.createdAt)}
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400">#{order.id}</span>
        </div>

        <div className="space-y-2">
          {order.items.map((item, index) => {
            const itemStatus = item.status || order.status
            if (itemStatus === "cancelled") return null

            return (
              <div key={index} className="rounded-lg border-2 border-gray-200 bg-white p-2 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                      <Badge variant="secondary" className="text-sm font-bold shrink-0">
                        x{item.quantity}
                      </Badge>
                    </div>
                    {item.selectedSize && (
                      <p className="text-xs text-gray-600 mt-0.5">Size: {item.selectedSize.name}</p>
                    )}
                    {item.selectedToppings.length > 0 && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        + {item.selectedToppings.map((t) => t.name).join(", ")}
                      </p>
                    )}
                    {item.notes && <p className="text-xs text-amber-600 mt-0.5 font-medium">📝 {item.notes}</p>}
                  </div>
                </div>

                <div className="flex gap-2">
                  {itemStatus === "pending" ? (
                    <>
                      <Button
                        className="flex-1 h-8 text-xs"
                        size="sm"
                        onClick={() => handleAcceptItem(order.id, index)}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Nhận
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                        onClick={() => setCancelingItem({ order, item, itemIndex: index })}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </>
                  ) : itemStatus === "preparing" ? (
                    <Button
                      className="w-full h-8 text-xs"
                      size="sm"
                      onClick={() => handleCompleteItem(order.id, index)}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Hoàn thành
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        title="Bếp"
        subtitle={`${filteredPending.reduce((s, o) => s + o.items.length, 0)} món chờ • ${filteredPreparing.reduce((s, o) => s + o.items.length, 0)} đang làm`}
        actions={
          <Badge variant="outline" className="text-xs">
            {currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </Badge>
        }
      />

      <div className="border-b bg-white shadow-sm sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as any)} className="w-full">
            <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0">
              <TabsTrigger
                value="all"
                className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 gap-2"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Tất cả
              </TabsTrigger>
              <TabsTrigger
                value="food"
                className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 gap-2"
              >
                <ChefHat className="h-4 w-4" />
                Món ăn
              </TabsTrigger>
              <TabsTrigger
                value="drink"
                className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-12 gap-2"
              >
                <Coffee className="h-4 w-4" />
                Đồ uống
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Pending Orders */}
          <div>
            <h2 className="mb-3 text-sm font-semibold flex items-center gap-2 text-gray-900">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              Đơn mới ({filteredPending.reduce((sum, o) => sum + o.items.length, 0)} món)
            </h2>
            <div className="space-y-3">
              {filteredPending.length === 0 ? (
                <Card className="border-gray-200">
                  <CardContent className="p-6 text-center">
                    <ChefHat className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Không có món mới</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPending.map((order) => <OrderCard key={order.id} order={order} showAccept={true} />)
              )}
            </div>
          </div>

          {/* Preparing Orders */}
          <div>
            <h2 className="mb-3 text-sm font-semibold flex items-center gap-2 text-gray-900">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Đang làm ({filteredPreparing.reduce((sum, o) => sum + o.items.length, 0)} món)
            </h2>
            <div className="space-y-3">
              {filteredPreparing.length === 0 ? (
                <Card className="border-gray-200">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Chưa có món đang làm</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPreparing.map((order) => <OrderCard key={order.id} order={order} showAccept={false} />)
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={cancelingItem !== null} onOpenChange={(open) => !open && setCancelingItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Hủy món: {cancelingItem?.item.name}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-xs text-gray-600 mb-3">Vui lòng chọn lý do hủy:</p>
            <RadioGroup value={cancelReason} onValueChange={setCancelReason}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 border rounded-lg p-2 bg-gray-50">
                  <RadioGroupItem value="Hết món" id="out-of-stock" />
                  <Label htmlFor="out-of-stock" className="cursor-pointer flex-1 text-sm">
                    Hết món
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-2 bg-gray-50">
                  <RadioGroupItem value="Nguyên liệu không đủ" id="no-ingredients" />
                  <Label htmlFor="no-ingredients" className="cursor-pointer flex-1 text-sm">
                    Nguyên liệu không đủ
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-2 bg-gray-50">
                  <RadioGroupItem value="Lỗi hệ thống" id="system-error" />
                  <Label htmlFor="system-error" className="cursor-pointer flex-1 text-sm">
                    Lỗi hệ thống
                  </Label>
                </div>
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
