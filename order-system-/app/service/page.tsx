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
 * - Chuông ở góc màn hình hiện số lượng đơn đang chờ xác nhận. Bấm vào
 *   chuông mở MỘT bảng danh sách liệt kê tất cả các bàn đang chờ — thay
 *   vì tự động bung từng sheet riêng cho từng bàn.
 * - MỚI: Khi có đơn gọi món mới, một thông báo (toast) hiện trực tiếp
 *   trên màn hình kèm âm thanh, để nhân viên không bỏ lỡ dù đang thao
 *   tác ở màn hình khác. Bấm "Xem ngay" để nhảy thẳng vào chi tiết đơn.
 * - MỚI: Bàn đang có món chờ xác nhận sẽ có hiệu ứng nhấp nháy/rung nhẹ
 *   để thu hút sự chú ý; nếu bị bỏ quên quá 2 phút, hiệu ứng chuyển
 *   sang màu đỏ và nhịp nhanh hơn để cảnh báo khẩn cấp hơn.
 *
 * Trong bảng đó, nhân viên chọn một bàn trong danh sách để xem chi
 * tiết món khách gọi, có thể thêm/sửa/xóa món, rồi bấm Xác Nhận hoặc
 * Hủy ở góc trên. Sau khi xử lý xong, giao diện tự quay lại danh sách
 * để nhân viên tiếp tục xử lý bàn kế tiếp — không bị gián đoạn hay
 * chồng lấn giữa các bàn.
 *
 * Tối ưu cho điện thoại và máy tính bảng: nút bấm lớn, thao tác một tay,
 * các bảng chi tiết trượt lên từ đáy màn hình thay vì dùng popup giữa
 * màn hình.
 */
 
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { Badge } from "@/components/ui/badge"
import {
  API_BASE_URL,
  getTables,
  getOrders,
  updateOrder,
  updateOrderItem,
  deleteOrderItem,
  confirmOrderItem,
} from "@/lib/api"
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
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
 
// ---------- Kiểu dữ liệu ----------
 
type MenuItem = {
  id: string
  orderId: string
  name: string
  price: number
  quantity: number
  status?: string
}
 
type TableInfo = {
  id: string
  name: string
  occupied: boolean
  items: MenuItem[]
}
 
type PendingOrder = {
  id: string
  tableId: string
  tableName: string
  items: MenuItem[]
  createdAt: number
}
 
// Thông báo nổi (toast) khi có đơn gọi món mới
type ToastNotification = {
  id: string
  orderId: string
  tableId: string
  tableName: string
  itemCount: number
  createdAt: number
  items: MenuItem[]
}
 
type ApiTable = {
  id: string
  name?: string
  number?: string
  status?: string
  qrCode?: string
}
 
type ApiOrderItem = {
  id: string
  name: string
  price: number | string
  quantity: number
  status: string
  note?: string
}
 
type ApiOrder = {
  id: string
  tableId: string
  status: string
  totalAmount: number | string
  createdAt: string
  table?: { id: string; name: string; qrCode?: string }
  items?: ApiOrderItem[]
}
 
const ACTIVE_ORDER_STATUSES = ["pending", "staffConfirmed", "preparing", "ready", "served"]
const POLL_INTERVAL_MS = 15000
const URGENT_AFTER_MS = 2 * 60 * 1000 // Quá 2 phút chưa xác nhận -> cảnh báo khẩn
const TOAST_LIFETIME_MS = 15000
 
function mapOrderItem(item: ApiOrderItem, orderId: string): MenuItem {
  return {
    id: item.id,
    orderId,
    name: item.name,
    price: Number(item.price) || 0,
    quantity: item.quantity || 1,
    status: item.status,
  }
}
 
function getTableName(tableId: string, tables: ApiTable[], order?: ApiOrder): string {
  const fromOrder = order?.table?.name
  if (fromOrder) return fromOrder
  const table = tables.find((t) => t.id === tableId)
  return table?.name ?? table?.number ?? "Bàn"
}
 
function orderToPending(order: ApiOrder, tables: ApiTable[]): PendingOrder {
  return {
    id: order.id,
    tableId: order.tableId,
    tableName: getTableName(order.tableId, tables, order),
    items: (order.items ?? [])
      .filter((item) => item.status !== "cancelled")
      .map((item) => mapOrderItem(item, order.id)),
    createdAt: new Date(order.createdAt).getTime(),
  }
}
 
function buildTablesWithOrders(apiTables: ApiTable[], orders: ApiOrder[]): TableInfo[] {
  return apiTables.map((table) => {
    const tableOrders = orders.filter(
      (order) =>
        order.tableId === table.id && ACTIVE_ORDER_STATUSES.includes(order.status),
    )
    const items: MenuItem[] = []
    tableOrders.forEach((order) => {
      ;(order.items ?? []).forEach((item) => {
        if (item.status !== "cancelled") {
          items.push(mapOrderItem(item, order.id))
        }
      })
    })
    const hasActiveOrders = tableOrders.length > 0
    return {
      id: table.id,
      name: table.name ?? table.number ?? "Bàn",
      occupied: hasActiveOrders || (table.status ?? "empty") === "occupied",
      items,
    }
  })
}
 
function mapTableFromApi(table: ApiTable): TableInfo {
  return {
    id: table.id,
    name: table.name ?? table.number ?? "Bàn",
    occupied: (table.status ?? "empty") === "occupied",
    items: [],
  }
}
 
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
 
function canEditItem(item: MenuItem) {
  return item.status === "pending"
}
 
function itemStatusLabel(status?: string) {
  switch (status) {
    case "pending":
      return "Chờ xác nhận"
    case "preparing":
      return "Đang làm"
    case "staffConfirmed":
      return "Đã xác nhận"
    case "preparing":
      return "Đang làm"
    case "ready":
      return "Sẵn sàng"
    case "served":
      return "Đã phục vụ"
    case "completed":
      return "Đã thanh toán"
    case "cancelled":
      return "Đã hủy"
    default:
      return status ?? ""
  }
}
 
// Tuổi (ms) của đơn chờ lâu nhất tại một bàn
function oldestPendingAgeMs(tableId: string, pendingOrders: PendingOrder[], now: number) {
  const related = pendingOrders.filter((o) => o.tableId === tableId)
  if (related.length === 0) return 0
  const oldest = Math.min(...related.map((o) => o.createdAt))
  return now - oldest
}
 
// ---------- Component chính ----------
 
export default function TablesPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [apiTables, setApiTables] = useState<ApiTable[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoadingTables, setIsLoadingTables] = useState(true)
  const [tableError, setTableError] = useState<string | null>(null)
  const [isSyncingOrders, setIsSyncingOrders] = useState(false)
  const router = useRouter()
 
  // ----- Thông báo gọi món (dạng danh sách, không tự bung sheet) -----
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
  const [reviewId, setReviewId] = useState<string | null>(null) // null = đang ở màn danh sách
  const [actionLoading, setActionLoading] = useState(false)
  const knownPendingIdsRef = useRef<Set<string>>(new Set())
  const hasLoadedOnceRef = useRef(false)
  const apiTablesRef = useRef<ApiTable[]>([])
  const socketRef = useRef<Socket | null>(null)
 
  // ----- Thông báo nổi (toast) khi có món mới -----
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
 
  // ----- Đồng hồ nội bộ để tính thời gian bàn chờ xác nhận -----
  const [nowTick, setNowTick] = useState(() => Date.now())
 
  // ----- Xác nhận trước khi xóa món -----
  const [deleteTarget, setDeleteTarget] = useState<{
    item: MenuItem
    kind: "table" | "pending"
  } | null>(null)
 
  const occupiedCount = tables.filter((t) => t.occupied).length
  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedId) ?? null,
    [tables, selectedId]
  )
  const selectedTableSafe = selectedTable ?? {
    id: "",
    name: "",
    occupied: false,
    items: [],
  }
  const reviewOrder = useMemo(
    () => pendingOrders.find((o) => o.id === reviewId) ?? null,
    [pendingOrders, reviewId]
  )
  const reviewOrderSafe = reviewOrder ?? {
    id: "",
    tableId: "",
    tableName: "",
    items: [],
    createdAt: 0,
  }
  const visibleToasts = useMemo(
    () => [...toasts].sort((a, b) => a.createdAt - b.createdAt),
    [toasts],
  )
  // Vị trí bàn hiện tại trong hàng đợi, để hiển thị "Bàn tiếp theo"
  const reviewIndex = useMemo(
    () => (reviewId ? pendingOrders.findIndex((o) => o.id === reviewId) : -1),
    [pendingOrders, reviewId]
  )
  // Có bàn nào đang chờ quá lâu (khẩn cấp) không — dùng để nhấn mạnh chuông
  const hasUrgentTable = useMemo(() => {
    const tableIds = new Set(pendingOrders.map((o) => o.tableId))
    return Array.from(tableIds).some(
      (tableId) => oldestPendingAgeMs(tableId, pendingOrders, nowTick) > URGENT_AFTER_MS
    )
  }, [pendingOrders, nowTick])
 
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "default") {
      await Notification.requestPermission()
    }
  }, [])

  const showBrowserNotification = useCallback((toast: ToastNotification) => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return

    const messageBody =
      toast.items.length > 0
        ? toast.items.map((item) => `${item.name} x${item.quantity}`).join(", ")
        : `${toast.itemCount} món mới`

    new Notification("Có món mới", {
      body: `Bàn ${toast.tableName}: ${messageBody}`,
      tag: toast.orderId,
      renotify: true,
    })
  }, [])

  // Phát âm thanh chuông dài, rõ ràng để báo có món mới
  const playNotifySound = useCallback(() => {
    try {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtxClass) return
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {})
      }

      const now = ctx.currentTime
      const notes = [
        { freq: 880, duration: 0.28, type: "triangle" },
        { freq: 1046.5, duration: 0.22, type: "sine" },
        { freq: 1318.5, duration: 0.35, type: "sine" },
      ] as const

      notes.forEach((note, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const offset = index * 0.24

        osc.type = note.type
        osc.frequency.value = note.freq
        gain.gain.setValueAtTime(0.0001, now + offset)
        gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + note.duration)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + offset)
        osc.stop(now + offset + note.duration + 0.02)
      })
    } catch (error) {
      // Trình duyệt có thể chặn audio tự động — bỏ qua, không ảnh hưởng luồng chính
    }
  }, [])
 
  const syncOrders = useCallback(async () => {
    const tableSource = apiTablesRef.current
    if (tableSource.length === 0) return
 
    try {
      setIsSyncingOrders(true)
      const data = await getOrders()
      const orders: ApiOrder[] = Array.isArray(data) ? data : []
 
      const pending = orders
        .filter((order) => order.status === "pending")
        .map((order) => orderToPending(order, tableSource))
 
      const previousIds = new Set(knownPendingIdsRef.current)
      const newlyArrived = pending.filter((order) => !previousIds.has(order.id))
 
      knownPendingIdsRef.current = new Set(pending.map((order) => order.id))
 
      setPendingOrders(pending)
      setTables(buildTablesWithOrders(tableSource, orders))
 
      const shouldNotify = hasLoadedOnceRef.current && newlyArrived.length > 0
      hasLoadedOnceRef.current = true

      if (shouldNotify) {
        playNotifySound()
        const notifications = newlyArrived.map((order) => ({
          id: `${order.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          orderId: order.id,
          tableId: order.tableId,
          tableName: order.tableName,
          itemCount: itemCountOf(order.items),
          createdAt: Date.now(),
          items: order.items,
        }))

        notifications.forEach((notification) => showBrowserNotification(notification))

        setToasts((prev) =>
          [...prev, ...notifications]
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-8),
        )
      }
    } catch (error) {
      console.error("Failed to load orders", error)
    } finally {
      setIsSyncingOrders(false)
    }
  }, [playNotifySound, showBrowserNotification])
 
  useEffect(() => {
    let isMounted = true
 
    async function loadTables() {
      try {
        setIsLoadingTables(true)
        setTableError(null)
        const data = await getTables()
        if (!isMounted) return
 
        const nextApiTables = Array.isArray(data) ? (data as ApiTable[]) : []
        apiTablesRef.current = nextApiTables
        setApiTables(nextApiTables)
        setTables(nextApiTables.map((table) => mapTableFromApi(table)))
      } catch (error) {
        if (!isMounted) return
        console.error("Failed to load tables", error)
        setTableError("Không thể tải danh sách bàn từ hệ thống")
        setTables([])
        setApiTables([])
        apiTablesRef.current = []
      } finally {
        if (isMounted) {
          setIsLoadingTables(false)
        }
      }
    }
 
    loadTables()
 
    return () => {
      isMounted = false
    }
  }, [])
 
  useEffect(() => {
    if (apiTables.length === 0) return
 
    syncOrders()
 
    const socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket
 
    socket.on("connect", () => {
      console.info("Socket connected for order notifications")
    })
 
    socket.on("new-order", () => {
      syncOrders()
    })
 
    socket.on("order-updated", () => {
      syncOrders()
    })
 
    const interval = setInterval(() => {
      syncOrders()
    }, POLL_INTERVAL_MS)
 
    return () => {
      clearInterval(interval)
      socket.off("new-order")
      socket.off("order-updated")
      socket.disconnect()
      socketRef.current = null
    }
  }, [apiTables.length, syncOrders])
 
  useEffect(() => {
    if (reviewId && !pendingOrders.some((o) => o.id === reviewId)) {
      setReviewId(null)
    }
  }, [pendingOrders, reviewId])
 
  // Dọn các toast của những đơn đã được xử lý xong (xác nhận/hủy/xóa hết món)
  useEffect(() => {
    setToasts((prev) => prev.filter((t) => pendingOrders.some((o) => o.id === t.orderId)))
  }, [pendingOrders])
 
  // Đồng hồ nội bộ mỗi 15 giây để cập nhật hiển thị "chờ bao lâu" và hiệu ứng khẩn cấp
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])
 
  // Tự động ẩn toast cũ nhất sau một khoảng thời gian, không cần thao tác
  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, TOAST_LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [toasts])
 
  // ----- Bàn: mở / đóng -----
 
  function openTable(id: string) {
    setSelectedId(id)
  }
 
  function closeSheet() {
    setSelectedId(null)
  }
 
  async function changeQuantity(item: MenuItem, delta: number) {
    const newQty = item.quantity + delta
    try {
      setActionLoading(true)
      if (newQty <= 0) {
        await deleteOrderItem(item.orderId, item.id)
      } else {
        await updateOrderItem(item.orderId, item.id, { quantity: newQty })
      }
      await syncOrders()
    } catch (error) {
      console.error("Failed to update item quantity", error)
    } finally {
      setActionLoading(false)
    }
  }
 
  async function removeItem(item: MenuItem) {
    try {
      setActionLoading(true)
      await deleteOrderItem(item.orderId, item.id)
      await syncOrders()
    } catch (error) {
      console.error("Failed to remove item", error)
    } finally {
      setActionLoading(false)
    }
  }
 
  async function checkout(tableId: string) {
    try {
      setActionLoading(true)
      const data = await getOrders()
      const orders: ApiOrder[] = Array.isArray(data) ? data : []
      const tableOrders = orders.filter(
        (order) =>
          order.tableId === tableId && ACTIVE_ORDER_STATUSES.includes(order.status),
      )
 
      await Promise.all(
        tableOrders.map((order) => updateOrder(order.id, { status: "completed" })),
      )
      await syncOrders()
      closeSheet()
    } catch (error) {
      console.error("Failed to checkout table", error)
    } finally {
      setActionLoading(false)
    }
  }
 
  // Đóng hẳn bảng thông báo (quay về màn hình bàn)
  function closeReviewPanel() {
    setReviewPanelOpen(false)
    setReviewId(null)
  }
 
  // Quay lại danh sách (không đóng bảng) — dùng khi bấm mũi tên "quay lại"
  function backToList() {
    setReviewId(null)
  }

  // Đăng xuất
  function handleLogout() {
    const { clearAuth } = require("@/lib/auth")
    clearAuth()
    router.push("/auth/login")
  }
  async function changePendingQuantity(item: MenuItem, delta: number) {
    const newQty = item.quantity + delta
    try {
      setActionLoading(true)
      if (newQty <= 0) {
        await deleteOrderItem(item.orderId, item.id)
      } else {
        await updateOrderItem(item.orderId, item.id, { quantity: newQty })
      }
      await syncOrders()
    } catch (error) {
      console.error("Failed to update pending item", error)
    } finally {
      setActionLoading(false)
    }
  }
 
  async function removePendingItem(item: MenuItem) {
    try {
      setActionLoading(true)
      await deleteOrderItem(item.orderId, item.id)
      await syncOrders()
    } catch (error) {
      console.error("Failed to remove pending item", error)
    } finally {
      setActionLoading(false)
    }
  }

  async function confirmItem(item: MenuItem) {
    try {
      setActionLoading(true)
      await confirmOrderItem(item.orderId, item.id)
      await syncOrders()
    } catch (error) {
      console.error("Failed to confirm item", error)
    } finally {
      setActionLoading(false)
    }
  }
 
  // Mở hộp thoại hỏi xác nhận trước khi xóa (dùng chung cho cả 2 sheet)
  function requestDeleteItem(item: MenuItem, kind: "table" | "pending") {
    setDeleteTarget({ item, kind })
  }
 
  function cancelDeleteItem() {
    setDeleteTarget(null)
  }
 
  async function confirmDeleteItem() {
    if (!deleteTarget) return
    const { item, kind } = deleteTarget
    setDeleteTarget(null)
    if (kind === "table") {
      await removeItem(item)
    } else {
      await removePendingItem(item)
    }
  }
 
  // Sau khi xác nhận / hủy: quay về danh sách để xử lý bàn tiếp theo.
  // Nếu không còn bàn nào chờ nữa thì tự đóng bảng.
  async function confirmOrder(order: PendingOrder) {
    try {
      setActionLoading(true)
      await updateOrder(order.id, { status: "preparing" })
      await syncOrders()
      setReviewId(null)
    } catch (error) {
      console.error("Failed to confirm order", error)
    } finally {
      setActionLoading(false)
    }
  }
 
  async function cancelOrder(orderId: string) {
    try {
      setActionLoading(true)
      await updateOrder(orderId, { status: "cancelled" })
      await syncOrders()
      setReviewId(null)
    } catch (error) {
      console.error("Failed to cancel order", error)
    } finally {
      setActionLoading(false)
    }
  }
 
  // Tự đóng bảng khi danh sách chờ đã hết (xử lý xong tất cả)
  useEffect(() => {
    if (reviewPanelOpen && !reviewId && pendingOrders.length === 0) {
      setReviewPanelOpen(false)
    }
  }, [reviewPanelOpen, reviewId, pendingOrders.length])
 
  // Bấm "Xem ngay" trên toast: nhảy thẳng vào chi tiết đơn đó
  function openToastOrder(toast: ToastNotification) {
    setReviewPanelOpen(true)
    setReviewId(toast.orderId)
    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
  }
 
  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }
 
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hiệu ứng dùng chung: nhấp nháy cảnh báo cho bàn có món chờ + toast trượt vào */}
      <style>{`
        @keyframes orderAlertPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245,158,11,0.35); }
          50% { transform: scale(1.025); box-shadow: 0 0 0 9px rgba(245,158,11,0); }
        }
        @keyframes orderUrgentPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.45); }
          50% { transform: scale(1.045); box-shadow: 0 0 0 11px rgba(239,68,68,0); }
        }
        .animate-order-alert { animation: orderAlertPulse 1.8s ease-in-out infinite; }
        .animate-order-urgent { animation: orderUrgentPulse 0.85s ease-in-out infinite; }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-toast-in { animation: toastSlideIn 0.25s ease-out; }
      `}</style>
 
      {/* ---------- Chuông thông báo (góc màn hình) + Đăng xuất ---------- */}
      <div className="fixed right-3 top-3 z-40 flex gap-2 sm:right-5 sm:top-5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 active:scale-95 text-gray-600 hover:text-red-600"
          aria-label="Đăng xuất"
          title="Đăng xuất"
        >
          <LogOut className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={async () => {
            if (pendingOrders.length > 0) {
              await requestNotificationPermission()
              setReviewPanelOpen(true)
            }
          }}
          className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 active:scale-95 ${
            pendingOrders.length > 0
              ? hasUrgentTable
                ? "text-red-600 animate-order-urgent"
                : "text-amber-600 animate-order-alert"
              : "text-gray-500"
          }`}
          aria-label="Thông báo gọi món"
        >
          <Bell
            className={`h-5 w-5 ${pendingOrders.length > 0 ? "animate-bounce" : ""}`}
          />
          {pendingOrders.length > 0 && (
            <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
      </div>
 
      {/* ---------- Thông báo nổi (danh sách món mới) ---------- */}
      {visibleToasts.length > 0 && (
        <div className="fixed left-1/2 top-3 z-[70] w-[94%] max-w-lg -translate-x-1/2 sm:left-auto sm:right-5 sm:top-20 sm:w-[420px] sm:translate-x-0">
          <div className="animate-toast-in rounded-2xl border border-amber-200 bg-white/95 p-3 shadow-2xl ring-1 ring-black/5 backdrop-blur">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-amber-700">Món mới đang chờ xác nhận</p>
                <p className="text-xs text-gray-500">Khách gọi trước sẽ xuất hiện ở trên cùng</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                {visibleToasts.length} mới
              </span>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
              {visibleToasts.map((toast) => (
                <div key={toast.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">Bàn {toast.tableName}</p>
                      <p className="text-xs text-gray-500">{timeAgo(toast.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openToastOrder(toast)}
                        className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white active:bg-amber-600"
                      >
                        Xem ngay
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissToast(toast.id)}
                        className="rounded-full p-1.5 text-gray-400 active:bg-gray-100"
                        aria-label="Đóng thông báo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {toast.items.slice(0, 4).map((item) => (
                      <li key={item.id} className="flex items-center justify-between text-sm text-gray-700">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className="shrink-0 font-semibold text-gray-900">x{item.quantity}</span>
                      </li>
                    ))}
                    {toast.items.length > 4 && (
                      <li className="text-xs font-medium text-gray-500">
                        ... và {toast.items.length - 4} món khác
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
 
      <div className="container mx-auto px-3 py-4 max-w-6xl sm:px-4 sm:py-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              <Users className="h-7 w-7 text-blue-600 sm:h-8 sm:w-8" />
              Sơ Đồ Bàn
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Chạm vào bàn để xem món khách đã đặt
              {isSyncingOrders ? " · Đang cập nhật..." : ""}
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
        {isLoadingTables ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
            Đang tải danh sách bàn...
          </div>
        ) : tableError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
            {tableError}
          </div>
        ) : tables.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
            Chưa có bàn nào trong hệ thống.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {tables.map((table) => {
              const count = itemCountOf(table.items)
              const hasPending = pendingOrders.some((o) => o.tableId === table.id)
              const pendingAgeMs = hasPending
                ? oldestPendingAgeMs(table.id, pendingOrders, nowTick)
                : 0
              const isUrgent = hasPending && pendingAgeMs > URGENT_AFTER_MS
              const waitedMinutes = Math.max(1, Math.floor(pendingAgeMs / 60000))
 
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => openTable(table.id)}
                  className={`relative flex h-[152px] flex-col rounded-xl border-2 p-3.5 text-center transition-all active:scale-95 sm:h-[168px] sm:p-4 ${
                    hasPending
                      ? isUrgent
                        ? "border-red-500 bg-red-50 shadow-lg ring-4 ring-red-200 animate-order-urgent"
                        : "border-amber-400 bg-amber-50 shadow-lg ring-4 ring-amber-200 animate-order-alert"
                      : table.occupied
                      ? "border-amber-400 bg-amber-50 shadow-md"
                      : "border-emerald-300 bg-emerald-50 shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Status Dot */}
                  <div
                    className={`absolute right-2.5 top-2.5 h-3 w-3 rounded-full ${
                      table.occupied ? "animate-pulse bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
 
                  {/* Chấm báo có đơn chờ xác nhận */}
                  {hasPending && (
                    <div
                      className={`absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm ${
                        isUrgent ? "bg-red-600 animate-bounce" : "bg-red-500 animate-pulse"
                      }`}
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                  )}
 
                  {/* Nhãn nhỏ "Bàn" ở góc trên, chừa khoảng trống bên dưới */}
                  <p className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Bàn
                  </p>
 
                  {/* Tên / số bàn — to, canh giữa phần còn lại */}
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-2xl font-bold leading-none text-gray-900 sm:text-[1.75rem]">
                      {table.name}
                    </p>
                  </div>
 
                  {/* Khu vực dưới — luôn cùng chiều cao cho mọi bàn */}
                  <div className="flex h-[46px] flex-col items-center justify-end gap-1.5">
                    {hasPending ? (
                      <>
                        <Badge
                          className={`px-2 py-0.5 text-[11px] font-semibold ${
                            isUrgent ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                          }`}
                        >
                          Món mới chờ xác nhận
                        </Badge>
                        <p
                          className={`text-[10px] font-semibold ${
                            isUrgent ? "text-red-600" : "text-amber-600"
                          }`}
                        >
                          {isUrgent ? "Đã chờ" : "Chờ"} {waitedMinutes} phút
                        </p>
                      </>
                    ) : (
                      <>
                        <Badge
                          className={`px-2 py-0.5 text-[11px] font-semibold ${
                            table.occupied
                              ? "bg-amber-500 text-white"
                              : "bg-emerald-500 text-white"
                          }`}
                        >
                          {table.occupied ? "Có khách" : "Trống"}
                        </Badge>
                        {table.occupied ? (
                          <p className="text-xs font-medium text-gray-500">
                            {count} {count === 1 ? "món" : "món"}
                          </p>
                        ) : (
                          <Check className="h-4 w-4 text-emerald-500 opacity-70" />
                        )}
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
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
                    selectedTableSafe.occupied
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {selectedTableSafe.occupied ? "Có khách" : "Trống"}
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
              {selectedTableSafe.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
                  <ShoppingBag className="h-10 w-10" />
                  <p className="text-sm">Chưa có món nào từ khách.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {selectedTableSafe.items.map((item) => {
                    const editable = canEditItem(item)
                    return (
                      <li key={`${item.orderId}-${item.id}`} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{formatVND(item.price)} / món</p>
                          {item.status && (
                            <Badge variant="secondary" className="mt-1 text-[10px]">
                              {itemStatusLabel(item.status)}
                            </Badge>
                          )}
                        </div>
 
                        {editable ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => confirmItem(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm active:scale-90 disabled:opacity-50"
                                aria-label="Xác nhận món"
                                title="Xác nhận"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => changeQuantity(item, -1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 shadow-sm active:scale-90 disabled:opacity-50"
                                aria-label="Giảm số lượng"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-5 text-center text-sm font-semibold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => changeQuantity(item, 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 shadow-sm active:scale-90 disabled:opacity-50"
                                aria-label="Tăng số lượng"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
 
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => requestDeleteItem(item, "table")}
                              className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-red-50 disabled:opacity-50"
                              aria-label={`Xóa ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <Badge variant="secondary" className="shrink-0 rounded-full text-sm font-bold">
                            x{item.quantity}
                          </Badge>
                        )}
                      </li>
                    )
                  })}
                </ul>
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
                disabled={selectedTableSafe.items.length === 0 || actionLoading}
                onClick={() => checkout(selectedTableSafe.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Wallet className="h-5 w-5" />
                Thanh Toán
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* ---------- Bottom Sheet: DANH SÁCH xác nhận món khách gọi ---------- */}
      {reviewPanelOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeReviewPanel} />
 
          <div className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl">
            <div className="flex justify-center pt-2 sm:hidden">
              <span className="h-1.5 w-10 rounded-full bg-gray-300" />
            </div>
 
            {/* ===== Header ===== */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              {reviewOrder ? (
                <>
                  <button
                    type="button"
                    onClick={backToList}
                    className="flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium text-gray-600 active:bg-gray-100"
                    aria-label="Quay lại danh sách"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Danh sách
                  </button>
 
                  {/* ---- Nút Xác Nhận / Hủy ở góc ---- */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => cancelOrder(reviewOrderSafe.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200 disabled:opacity-50"
                      aria-label="Hủy đơn"
                      title="Hủy"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={reviewOrderSafe.items.length === 0 || actionLoading}
                      onClick={() => confirmOrder(reviewOrderSafe)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm active:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      aria-label="Xác nhận đơn"
                      title="Xác nhận"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <Bell className="h-5 w-5 text-amber-500" />
                    Bàn đang chờ xác nhận
                    <Badge className="bg-red-500 text-white">{pendingOrders.length}</Badge>
                  </p>
                  <button
                    type="button"
                    onClick={closeReviewPanel}
                    className="rounded-full p-2 text-gray-500 active:bg-gray-100"
                    aria-label="Đóng"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
 
            {/* ===== Nội dung ===== */}
            {!reviewOrder ? (
              // ---- Màn danh sách các bàn đang chờ ----
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {pendingOrders.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
                    <ShoppingBag className="h-10 w-10" />
                    <p className="text-sm">Không còn bàn nào chờ xác nhận.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {pendingOrders.map((o) => {
                      const age = oldestPendingAgeMs(o.tableId, pendingOrders, nowTick)
                      const urgent = age > URGENT_AFTER_MS
                      return (
                        <li key={o.id}>
                          <button
                            type="button"
                            onClick={() => setReviewId(o.id)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left active:bg-amber-100 ${
                              urgent
                                ? "border-red-200 bg-red-50 active:bg-red-100"
                                : "border-amber-100 bg-amber-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-base font-bold text-gray-900">
                                Bàn {o.tableName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {itemCountOf(o.items)} món · {formatVND(totalOf(o.items))} · {timeAgo(o.createdAt)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  urgent ? "animate-pulse bg-red-500" : "bg-amber-500"
                                }`}
                              />
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ) : (
              // ---- Màn chi tiết một bàn ----
              <>
                <div className="border-b border-gray-100 px-5 py-2.5">
                  <p className="text-base font-bold text-gray-900">
                    Bàn {reviewOrderSafe.tableName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {timeAgo(reviewOrderSafe.createdAt)}
                    {pendingOrders.length > 1 &&
                      ` · Bàn ${reviewIndex + 1}/${pendingOrders.length} trong hàng đợi`}
                  </p>
                </div>
 
                <div className="flex-1 overflow-y-auto px-5 py-3">
                  {reviewOrderSafe.items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
                      <ShoppingBag className="h-10 w-10" />
                      <p className="text-sm">Không còn món nào trong đơn này.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {reviewOrderSafe.items.map((item) => (
                        <li key={`${item.orderId}-${item.id}`} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{formatVND(item.price)} / món</p>
                            {item.status && (
                              <Badge variant="secondary" className="mt-1 text-[10px]">
                                {itemStatusLabel(item.status)}
                              </Badge>
                            )}
                          </div>
 
                          {item.status === "pending" ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => confirmItem(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm active:scale-90 disabled:opacity-50"
                                aria-label="Xác nhận món"
                                title="Xác nhận"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-1 py-1">
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => changePendingQuantity(item, -1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm active:scale-90 disabled:opacity-50"
                                  aria-label="Giảm số lượng"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-5 text-center text-sm font-semibold text-gray-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => changePendingQuantity(item, 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm active:scale-90 disabled:opacity-50"
                                  aria-label="Tăng số lượng"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => requestDeleteItem(item, "pending")}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-red-50 disabled:opacity-50"
                                aria-label={`Xóa ${item.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <Badge className="shrink-0 rounded-full text-sm font-bold bg-green-600 text-white">
                              x{item.quantity}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
 
                <div className="border-t border-gray-100 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Tổng cộng</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatVND(totalOf(reviewOrderSafe.items))}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
 
      {/* ---------- Modal: xác nhận xóa món ---------- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" onClick={cancelDeleteItem} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-base font-bold text-gray-900">Xóa món này?</p>
              <p className="mt-1 text-sm text-gray-500">
                Bạn có chắc chắn muốn xóa{" "}
                <span className="font-semibold text-gray-700">{deleteTarget.item.name}</span>{" "}
                khỏi đơn không? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelDeleteItem}
                className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 active:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white shadow-sm active:bg-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}