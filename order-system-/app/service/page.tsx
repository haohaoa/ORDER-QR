"use client"
 
/**
 * GIAO DIỆN BÀN (Table Overview)
 * ------------------------------------------------------------------
 * Hiển thị danh sách tất cả bàn của quán với thông tin:
 * - Tên bàn
 * - Trạng thái (Trống / Có khách)
 * - Số lượng món đang có (nếu bàn được chiếm)
 *
 * Chạm vào một bàn sẽ mở bảng chi tiết (bottom sheet) hiển thị các món
 * đang gọi, cho phép thêm / sửa số lượng / xóa từng món, và có nút
 * Thanh Toán để chốt đơn.
 *
 * THÔNG BÁO GỌI MÓN:
 * Khi khách gọi món (mô phỏng qua addPendingOrder — thực tế sẽ được gọi
 * từ socket/API khi có đơn mới), một chuông thông báo ở góc màn hình sẽ
 * hiện số lượng đơn đang chờ xác nhận. Cửa sổ xác nhận sẽ tự mở ra để
 * nhân viên xem món khách gọi, có thể thêm / sửa / xóa món trước khi
 * bấm Xác Nhận (đưa vào bàn) hoặc Hủy (bỏ qua đơn).
 *
 * Tối ưu cho điện thoại và máy tính bảng: nút bấm lớn, thao tác một tay,
 * các bảng chi tiết trượt lên từ đáy màn hình thay vì dùng popup giữa
 * màn hình.
 */
 
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { AppNavigation } from "@/components/app-navigation-service"
import {
  Check,
  Users,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Wallet,
  Bell,
  ClipboardList,
} from "lucide-react"
 
// ---------- Kiểu dữ liệu ----------
 
type MenuItem = {
  id: string
  name: string
  price: number
  quantity: number
}
 
type TableInfo = {
  id: string
  name: string
  occupied: boolean
  items: MenuItem[]
}
 
type QuickMenuItem = {
  name: string
  price: number
}
 
type PendingOrder = {
  id: string
  tableId: string
  tableName: string
  items: MenuItem[]
  createdAt: number
}
 
// ---------- Thực đơn nhanh dùng để thêm món ----------
 
const QUICK_MENU: QuickMenuItem[] = [
  { name: "Cà phê sữa", price: 25000 },
  { name: "Cà phê đen", price: 20000 },
  { name: "Trà đào cam sả", price: 35000 },
  { name: "Trà tắc", price: 20000 },
  { name: "Nước suối", price: 10000 },
  { name: "Bún bò", price: 45000 },
  { name: "Cơm gà", price: 40000 },
  { name: "Bánh mì", price: 20000 },
]
 
// ---------- Dữ liệu mẫu (thay bằng dữ liệu thật) ----------
 
function randomMenuItems(): MenuItem[] {
  const count = Math.floor(Math.random() * 3) + 1
  const shuffled = [...QUICK_MENU].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((m, idx) => ({
    id: `${m.name}-${idx}-${Date.now()}`,
    name: m.name,
    price: m.price,
    quantity: Math.floor(Math.random() * 3) + 1,
  }))
}
 
const MOCK_TABLES: TableInfo[] = Array.from({ length: 10 }).map((_, i) => {
  const n = i + 1
  const occupied = [1, 2, 4, 7, 9].includes(n)
  return {
    id: `B${String(n).padStart(2, "0")}`,
    name: `${n}`,
    occupied,
    items: occupied ? randomMenuItems() : [],
  }
})
 
// ---------- Tiện ích ----------
 
function formatVND(value: number) {
  return value.toLocaleString("vi-VN") + "đ"
}
 
function itemCountOf(items: MenuItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}
 
function totalOf(items: MenuItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}
 
function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "vừa xong"
  const minutes = Math.floor(seconds / 60)
  return `${minutes} phút trước`
}
 
// ---------- Component chính ----------
 
export default function TablesPage() {
  const [tables, setTables] = useState<TableInfo[]>(MOCK_TABLES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showQuickMenu, setShowQuickMenu] = useState(false)
 
  // ----- Thông báo gọi món -----
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [reviewQuickMenu, setReviewQuickMenu] = useState(false)
 
  const occupiedCount = tables.filter((t) => t.occupied).length
  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedId) ?? null,
    [tables, selectedId]
  )
  const reviewOrder = useMemo(
    () => pendingOrders.find((o) => o.id === reviewId) ?? null,
    [pendingOrders, reviewId]
  )
 
  // ----- Bàn: mở / đóng -----
 
  function openTable(id: string) {
    setSelectedId(id)
    setShowQuickMenu(false)
  }
 
  function closeSheet() {
    setSelectedId(null)
    setShowQuickMenu(false)
  }
 
  function updateTable(id: string, updater: (t: TableInfo) => TableInfo) {
    setTables((prev) => prev.map((t) => (t.id === id ? updater(t) : t)))
  }
 
  function addItem(tableId: string, menuItem: QuickMenuItem) {
    updateTable(tableId, (t) => {
      const existing = t.items.find((i) => i.name === menuItem.name)
      const items = existing
        ? t.items.map((i) =>
            i.name === menuItem.name ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [
            ...t.items,
            {
              id: `${menuItem.name}-${Date.now()}`,
              name: menuItem.name,
              price: menuItem.price,
              quantity: 1,
            },
          ]
      return { ...t, occupied: true, items }
    })
  }
 
  function changeQuantity(tableId: string, itemId: string, delta: number) {
    updateTable(tableId, (t) => {
      const items = t.items
        .map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
      return { ...t, items }
    })
  }
 
  function removeItem(tableId: string, itemId: string) {
    updateTable(tableId, (t) => ({
      ...t,
      items: t.items.filter((i) => i.id !== itemId),
    }))
  }
 
  function checkout(tableId: string) {
    updateTable(tableId, (t) => ({ ...t, occupied: false, items: [] }))
    closeSheet()
  }
 
  // ----- Đơn chờ xác nhận: nhận đơn mới -----
  // Trong thực tế hàm này sẽ được gọi khi socket/API báo có đơn mới từ
  // khách hàng, thay vì bấm nút mô phỏng như demo dưới đây.
  function addPendingOrder(tableId: string, tableName: string) {
    const order: PendingOrder = {
      id: `PO-${Date.now()}`,
      tableId,
      tableName,
      items: randomMenuItems(),
      createdAt: Date.now(),
    }
    setPendingOrders((prev) => [order, ...prev])
    // Tự động mở cửa sổ xác nhận nếu nhân viên chưa xem đơn nào khác
    setReviewId((current) => current ?? order.id)
    setReviewQuickMenu(false)
  }
 
  function simulateIncomingOrder() {
    const candidates = tables.filter((t) => !pendingOrders.some((o) => o.tableId === t.id))
    const target = candidates[Math.floor(Math.random() * candidates.length)] ?? tables[0]
    addPendingOrder(target.id, target.name)
  }
 
  function updatePendingOrder(id: string, updater: (o: PendingOrder) => PendingOrder) {
    setPendingOrders((prev) => prev.map((o) => (o.id === id ? updater(o) : o)))
  }
 
  function addItemToPending(orderId: string, menuItem: QuickMenuItem) {
    updatePendingOrder(orderId, (o) => {
      const existing = o.items.find((i) => i.name === menuItem.name)
      const items = existing
        ? o.items.map((i) =>
            i.name === menuItem.name ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [
            ...o.items,
            {
              id: `${menuItem.name}-${Date.now()}`,
              name: menuItem.name,
              price: menuItem.price,
              quantity: 1,
            },
          ]
      return { ...o, items }
    })
  }
 
  function changePendingQuantity(orderId: string, itemId: string, delta: number) {
    updatePendingOrder(orderId, (o) => ({
      ...o,
      items: o.items
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    }))
  }
 
  function removePendingItem(orderId: string, itemId: string) {
    updatePendingOrder(orderId, (o) => ({
      ...o,
      items: o.items.filter((i) => i.id !== itemId),
    }))
  }
 
  function closeReview() {
    setReviewId(null)
    setReviewQuickMenu(false)
  }
 
  function confirmOrder(order: PendingOrder) {
    // Gộp món khách gọi vào đơn hiện tại của bàn
    updateTable(order.tableId, (t) => {
      const items = [...t.items]
      order.items.forEach((newItem) => {
        const existing = items.find((i) => i.name === newItem.name)
        if (existing) {
          existing.quantity += newItem.quantity
        } else {
          items.push({ ...newItem, id: `${newItem.name}-${Date.now()}` })
        }
      })
      return { ...t, occupied: true, items }
    })
    setPendingOrders((prev) => prev.filter((o) => o.id !== order.id))
    closeReview()
  }
 
  function cancelOrder(orderId: string) {
    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId))
    closeReview()
  }
 
  // Khi đóng cửa sổ xác nhận, nếu vẫn còn đơn khác đang chờ thì tự mở tiếp
  useEffect(() => {
    if (!reviewId && pendingOrders.length > 0) {
      setReviewId(pendingOrders[0].id)
    }
  }, [reviewId, pendingOrders])
 
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---------- Chuông thông báo (góc màn hình) ---------- */}
      <div className="fixed right-3 top-3 z-40 sm:right-5 sm:top-5">
        <button
          type="button"
          onClick={() => setNotifOpen((v) => !v)}
          className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 active:scale-95 ${
            pendingOrders.length > 0 ? "text-amber-600" : "text-gray-500"
          }`}
          aria-label="Thông báo gọi món"
        >
          <Bell
            className={`h-5 w-5 ${pendingOrders.length > 0 ? "animate-bounce" : ""}`}
          />
          {pendingOrders.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
              {pendingOrders.length}
            </span>
          )}
        </button>
 
        {/* Danh sách đơn đang chờ */}
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5">
            <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Món khách gọi
            </p>
            {pendingOrders.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-gray-400">
                Không có thông báo mới
              </p>
            ) : (
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {pendingOrders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewId(o.id)
                        setReviewQuickMenu(false)
                        setNotifOpen(false)
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left active:bg-amber-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          Bàn {o.tableName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {itemCountOf(o.items)} món · {timeAgo(o.createdAt)}
                        </p>
                      </div>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
 
            {/* Nút demo: mô phỏng khách gọi món (thay bằng sự kiện socket/API thật) */}
            <button
              type="button"
              onClick={simulateIncomingOrder}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 active:bg-gray-50"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Mô phỏng khách gọi món (demo)
            </button>
          </div>
        )}
      </div>
 
      <div className="container mx-auto px-3 py-4 max-w-6xl sm:px-4 sm:py-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              <Users className="h-7 w-7 text-blue-600 sm:h-8 sm:w-8" />
              Sơ Đồ Bàn
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Chạm vào bàn để xem và quản lý món
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm sm:gap-6">
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-gray-600">
                Trống ({tables.filter((t) => !t.occupied).length})
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-gray-600">Có khách ({occupiedCount})</span>
            </span>
          </div>
        </div>
 
        {/* Tables Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {tables.map((table) => {
            const count = itemCountOf(table.items)
            const hasPending = pendingOrders.some((o) => o.tableId === table.id)
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => openTable(table.id)}
                className={`relative rounded-xl border-2 p-5 text-center transition-all active:scale-95 sm:p-6 ${
                  table.occupied
                    ? "border-amber-400 bg-amber-50 shadow-md"
                    : "border-emerald-300 bg-emerald-50 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Status Dot */}
                <div
                  className={`absolute right-2 top-2 h-3 w-3 rounded-full ${
                    table.occupied ? "animate-pulse bg-amber-500" : "bg-emerald-500"
                  }`}
                />
 
                {/* Chấm báo có đơn chờ xác nhận */}
                {hasPending && (
                  <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
                    <Bell className="h-3 w-3" />
                  </div>
                )}
 
                {/* Table Name */}
                <p className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                  Bàn {table.name}
                </p>
 
                {/* Status Badge */}
                <Badge
                  className={`mb-3 px-2 py-1 text-xs font-semibold ${
                    table.occupied
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {table.occupied ? "Có khách" : "Trống"}
                </Badge>
 
                {/* Item Count */}
                {table.occupied && (
                  <div className="mt-3 rounded-md bg-white bg-opacity-60 p-2">
                    <p className="text-xs font-medium text-gray-600">
                      {count} {count === 1 ? "món" : "món"}
                    </p>
                  </div>
                )}
 
                {/* Checkmark for empty tables */}
                {!table.occupied && (
                  <Check className="mx-auto mt-2 h-6 w-6 text-emerald-500 opacity-70" />
                )}
              </button>
            )
          })}
        </div>
      </div>
 
      {/* ---------- Bottom Sheet: chi tiết bàn ---------- */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeSheet} />
 
          <div className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl">
            <div className="flex justify-center pt-2 sm:hidden">
              <span className="h-1.5 w-10 rounded-full bg-gray-300" />
            </div>
 
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-xl font-bold text-gray-900">
                  Bàn {selectedTable.name}
                </p>
                <Badge
                  className={`mt-1 text-xs font-semibold ${
                    selectedTable.occupied
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {selectedTable.occupied ? "Có khách" : "Trống"}
                </Badge>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="rounded-full p-2 text-gray-500 active:bg-gray-100"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
 
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {selectedTable.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
                  <ShoppingBag className="h-10 w-10" />
                  <p className="text-sm">Chưa có món nào. Thêm món để bắt đầu.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {selectedTable.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{formatVND(item.price)} / món</p>
                      </div>
 
                      <div className="flex items-center gap-2 rounded-full bg-gray-100 px-1 py-1">
                        <button
                          type="button"
                          onClick={() => changeQuantity(selectedTable.id, item.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm active:scale-90"
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(selectedTable.id, item.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm active:scale-90"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
 
                      <button
                        type="button"
                        onClick={() => removeItem(selectedTable.id, item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-red-50"
                        aria-label={`Xóa ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
 
              {!showQuickMenu ? (
                <button
                  type="button"
                  onClick={() => setShowQuickMenu(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-semibold text-gray-600 active:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  Thêm món
                </button>
              ) : (
                <div className="mt-3 rounded-xl border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Chọn món để thêm</p>
                    <button
                      type="button"
                      onClick={() => setShowQuickMenu(false)}
                      className="text-xs text-gray-400 active:text-gray-600"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_MENU.map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => addItem(selectedTable.id, m)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-left active:bg-gray-50"
                      >
                        <p className="truncate text-sm font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{formatVND(m.price)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
 
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Tổng cộng</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatVND(totalOf(selectedTable.items))}
                </span>
              </div>
              <button
                type="button"
                disabled={selectedTable.items.length === 0}
                onClick={() => checkout(selectedTable.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Wallet className="h-5 w-5" />
                Thanh Toán
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* ---------- Bottom Sheet: xác nhận món khách gọi ---------- */}
      {reviewOrder && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/40" />
 
          <div className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl">
            <div className="flex justify-center pt-2 sm:hidden">
              <span className="h-1.5 w-10 rounded-full bg-gray-300" />
            </div>
 
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Khách gọi món · Bàn {reviewOrder.tableName}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {timeAgo(reviewOrder.createdAt)}
                </p>
              </div>
            </div>
 
            {/* Danh sách món khách gọi */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {reviewOrder.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
                  <ShoppingBag className="h-10 w-10" />
                  <p className="text-sm">Không còn món nào trong đơn này.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {reviewOrder.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{formatVND(item.price)} / món</p>
                      </div>
 
                      <div className="flex items-center gap-2 rounded-full bg-gray-100 px-1 py-1">
                        <button
                          type="button"
                          onClick={() => changePendingQuantity(reviewOrder.id, item.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm active:scale-90"
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changePendingQuantity(reviewOrder.id, item.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm active:scale-90"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
 
                      <button
                        type="button"
                        onClick={() => removePendingItem(reviewOrder.id, item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-red-50"
                        aria-label={`Xóa ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
 
              {!reviewQuickMenu ? (
                <button
                  type="button"
                  onClick={() => setReviewQuickMenu(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-semibold text-gray-600 active:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  Thêm món
                </button>
              ) : (
                <div className="mt-3 rounded-xl border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Chọn món để thêm</p>
                    <button
                      type="button"
                      onClick={() => setReviewQuickMenu(false)}
                      className="text-xs text-gray-400 active:text-gray-600"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_MENU.map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => addItemToPending(reviewOrder.id, m)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-left active:bg-gray-50"
                      >
                        <p className="truncate text-sm font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{formatVND(m.price)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
 
            {/* Footer: Hủy / Xác nhận */}
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Tổng cộng</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatVND(totalOf(reviewOrder.items))}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => cancelOrder(reviewOrder.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 py-3.5 text-base font-semibold text-gray-600 active:bg-gray-50"
                >
                  <X className="h-5 w-5" />
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={reviewOrder.items.length === 0}
                  onClick={() => confirmOrder(reviewOrder)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm active:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <Check className="h-5 w-5" />
                  Xác Nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 