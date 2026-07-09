"use client"
 
import { use, useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  X,
  Trash2,
  QrCode,
  Edit2,
  XCircle,
  ShoppingBasket,
  Flame,
  Check,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { createOrderByQrCode, deleteOrderItem, getOrdersByQrCode, updateOrderItem } from "@/lib/api"
import { useStore } from "@/lib/store"
import { StatusBadge } from "@/components/status-badge"
import type { MenuItem, MenuOption } from "@/lib/types"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
 
function getImageSrc(path?: string) {
  if (!path || typeof path !== "string") return "/placeholder.svg"
  const trimmed = path.trim()
  if (trimmed === "") return "/placeholder.svg"
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return encodeURI(trimmed)
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  const uploadPath = normalized.startsWith("/uploads") ? normalized : `/uploads${normalized}`
  return `${API_BASE_URL}${encodeURI(uploadPath)}`
}
 
function mapBackendMenuItem(item: any): MenuItem {
  return {
    id: item.id,
    name: item.name || "Không tên",
    description: item.description || "",
    price: Number(item.price ?? 0),
    category: item.category?.name || "Khác",
    image: getImageSrc(item.images?.[0]?.image),
    images: Array.isArray(item.images)
      ? item.images.map((img: any) => getImageSrc(img.image)).filter(Boolean)
      : [],
    available: item.available ?? true,
    createdAt: item.createdAt,
    // best-effort detection of "signature / đặc sản" flags coming from backend
    isSpecial: Boolean(item.isSpecial ?? item.featured ?? item.isFeatured ?? item.hot ?? false),
    options: Array.isArray(item.options)
      ? item.options.map((option: any) => ({
          id: option.id,
          name: option.name || "",
          required: Boolean(option.required),
          isMultiple: Boolean(option.isMultiple),
          price: Number(option.price ?? 0),
          choices: typeof option.choices === 'string' ? JSON.parse(option.choices) : (option.choices || [])
        }))
      : [],
  } as MenuItem
}
 
// Heuristic: an item counts as "đặc sản" (signature dish) either via an explicit
// backend flag, or via its category name mentioning "đặc sản" / "hot" / "signature".
function isSpecialtyItem(item: MenuItem): boolean {
  if ((item as any).isSpecial) return true
  const cat = (typeof item.category === "string" ? item.category : (item.category as any)?.name || "").toLowerCase()
  return cat.includes("đặc sản") || cat.includes("dac san") || cat.includes("signature") || cat.includes("hot")
}
 
type ToastState = { id: number; message: string; variant?: "success" | "error" | "info" }
 
type Props = {
  params: Promise<{ table: string }> | { table: string }
}
 
export default function MenuPage({ params }: Props) {
  const resolvedParams = use(params as Promise<{ table: string }>)
  const table = resolvedParams?.table ?? ""
 
  // menu API states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>(["Tất cả"])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState<string | null>(null)
 
  // search + UI states
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
 
  // filters & categories
  const [selectedCategory, setSelectedCategory] = useState("Tất cả")
 
  // item detail states
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedToppings, setSelectedToppings] = useState<any[]>([])
  const [selectedOptions, setSelectedOptions] = useState<MenuOption[]>([])
  const [selectedSize, setSelectedSize] = useState<any>()
  const [notes, setNotes] = useState("")
 
  // UI dialogs
  const [showOrderMenu, setShowOrderMenu] = useState(false)
  const [showOrderConfirm, setShowOrderConfirm] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [showPaymentQR, setShowPaymentQR] = useState(false)
  const submittingOrderRef = useRef(false)
  const [showLogo, setShowLogo] = useState(true)
  const [tableOrders, setTableOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
 
  const [editingCartItem, setEditingCartItem] = useState<any | null>(null)
  const [orderItemActionLoading, setOrderItemActionLoading] = useState<string | null>(null)
 
  // toast notifications (small, non-blocking)
  const [toasts, setToasts] = useState<ToastState[]>([])
  const toastIdRef = useRef(0)
  const showToast = useCallback((message: string, variant: ToastState["variant"] = "success") => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2200)
  }, [])
 
  // delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean
    orderId: string
    itemIndex: number
  } | null>(null)
 
  useEffect(() => {
    const controller = new AbortController()
 
    async function loadMenuItems() {
      if (!table || table === "undefined") {
        setMenuError("QR code không hợp lệ")
        setMenuLoading(false)
        return
      }
 
      setMenuLoading(true)
      setMenuError(null)
 
      try {
        let backendCategories: string[] = []
        try {
          const categoriesResponse = await fetch(`${API_BASE_URL}/categories/by-qrcode/${encodeURIComponent(table)}`, {
            signal: controller.signal,
          })
          if (categoriesResponse.ok) {
            const categoryData = await categoriesResponse.json()
            if (Array.isArray(categoryData)) {
              backendCategories = categoryData
                .map((category: any) => category?.name?.trim())
                .filter(Boolean) as string[]
            }
          }
        } catch {
          // ignore category fetch failure and fall back to menu item categories
        }
 
        const response = await fetch(`${API_BASE_URL}/menu-items/by-qrcode/${encodeURIComponent(table)}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`API lỗi: ${response.status}`)
        }
 
        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu không hợp lệ từ API menu-items")
        }
 
        const mappedItems = data.map(mapBackendMenuItem)
        const sortedItems = [...mappedItems].sort((a, b) => {
          const aTime = new Date(a.createdAt ?? 0).getTime()
          const bTime = new Date(b.createdAt ?? 0).getTime()
          return bTime - aTime
        })
 
        const derivedCategories = Array.from(
          new Set([
            ...(backendCategories || []),
            ...sortedItems
              .map((item) => (typeof item.category === "string" ? item.category : (item.category as any)?.name))
              .filter((value): value is string => Boolean(value)),
          ]),
        )
 
        setCategories(["Tất cả", ...derivedCategories])
        setMenuItems(sortedItems)
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Không thể tải menu-items:", error)
          setMenuError(error?.message ?? "Lỗi tải menu")
        }
      } finally {
        setMenuLoading(false)
      }
    }
 
    loadMenuItems()
    return () => controller.abort()
  }, [table])
 
  const refreshTableOrders = async () => {
    if (!table || table === "undefined") {
      setTableOrders([])
      return
    }
 
    try {
      setOrdersLoading(true)
      const data = await getOrdersByQrCode(table)
      setTableOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Không thể tải đơn hàng theo bàn:", error)
      setTableOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }
 
  useEffect(() => {
    refreshTableOrders()
  }, [table])
 
  // store
  const { cart, addToCart, removeFromCart, updateCartItem, submitOrder, removeItemFromOrder } = useStore()
 
  // derived
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
 
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = searchQuery.trim() === "" || item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "Tất cả" || item.category === selectedCategory
    return matchesSearch && matchesCategory && item.available
  })
 
  // split into signature (đặc sản) items shown first in a horizontal rail, and regular items in a vertical grid
  const specialtyItems = filteredItems.filter(isSpecialtyItem)
  const regularItems = specialtyItems.length > 0 ? filteredItems.filter((item) => !isSpecialtyItem(item)) : filteredItems
 
  // totals
  const calculateItemTotal = (item: any) => {
    const optionPrice = (item.selectedOptions || []).reduce((sum: number, option: any) => sum + Number(option?.price ?? 0), 0)
    const toppingTotal = item.selectedToppings?.reduce((t: number, topping: any) => t + Number(topping?.price ?? 0), 0) || 0
    const sizePrice = Number(item.selectedSize?.price ?? 0)
    return (Number(item.price ?? 0) + optionPrice + toppingTotal + sizePrice) * Number(item.quantity || 1)
  }
 
  const cartTotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
 
  const allOrdersTotal = tableOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalOrderedItems = tableOrders.reduce(
    (sum, order) =>
      sum +
      (Array.isArray(order.items)
        ? order.items.reduce((itemSum: number, item: any) => {
            if (item.status === "cancelled") return itemSum
            return itemSum + Number(item.quantity || 1)
          }, 0)
        : 0),
    0,
  )
 
  // handlers
  const handleAddToCart = async () => {
    if (selectedItem) {
      if (editingCartItem?.isOrderItem && editingCartItem?.orderId && editingCartItem?.id) {
        try {
          setOrderItemActionLoading(editingCartItem.id)
          await updateOrderItem(editingCartItem.orderId, editingCartItem.id, {
            quantity,
            note: notes,
            details: {
              selectedOptions,
              selectedSize,
              selectedToppings,
            },
          })
          await refreshTableOrders()
          showToast("Đã cập nhật món")
        } catch (error) {
          console.error("Không thể cập nhật món trong đơn hàng:", error)
          showToast("Cập nhật thất bại", "error")
        } finally {
          setOrderItemActionLoading(null)
        }
      } else if (editingCartItem) {
        updateCartItem(editingCartItem.cartItemId ?? editingCartItem.id, {
          quantity,
          selectedToppings,
          selectedOptions,
          selectedSize,
          notes,
        })
        showToast("Đã cập nhật món")
      } else {
        addToCart({
          ...selectedItem,
          quantity,
          selectedToppings,
          selectedOptions,
          selectedSize,
          notes,
        })
        showToast("Đã thêm vào giỏ")
      }
      // reset
      setSelectedItem(null)
      setQuantity(1)
      setSelectedToppings([])
      setSelectedOptions([])
      setSelectedSize(undefined)
      setNotes("")
      setCurrentImageIndex(0)
      setEditingCartItem(null)
    }
  }
 
  const handleSubmitOrder = () => {
    if (cart.length === 0 || pendingSubmit || submittingOrderRef.current) {
      return
    }
    setShowOrderConfirm(true)
  }
 
  const confirmSubmitOrder = async () => {
    if (!table || cart.length === 0 || pendingSubmit || submittingOrderRef.current) {
      return
    }
 
    submittingOrderRef.current = true
    setPendingSubmit(true)
    try {
      await createOrderByQrCode(table, {
        status: "pending",
        totalAmount: cartTotal,
        items: cart.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          note: item.notes,
          details: {
            selectedOptions: item.selectedOptions,
            selectedSize: item.selectedSize,
            selectedToppings: item.selectedToppings,
          },
          status: "pending",
        })),
      })
 
      submitOrder(table)
      await refreshTableOrders()
      setShowOrderConfirm(false)
      setShowOrderMenu(true)
      showToast("Gửi đơn thành công")
    } catch (error) {
      console.error("Lỗi khi gửi đơn hàng:", error)
      showToast("Gửi đơn thất bại", "error")
    } finally {
      submittingOrderRef.current = false
      setPendingSubmit(false)
    }
  }
 
  const handlePaymentComplete = () => {
    setShowPaymentQR(false)
    setShowOrderMenu(false)
  }
 
  const handlePaymentCancel = () => {
    setShowPaymentQR(false)
  }
 
  const getDefaultSelectedOptions = (item?: MenuItem | null) => {
    if (!item?.options?.length) return []
    const defaults: any[] = []
    item.options.forEach((option) => {
      if (option.required) {
        if (option.choices && option.choices.length > 0) {
          defaults.push({
            groupId: option.id || option.name,
            groupName: option.name,
            name: option.choices[0].name,
            price: option.choices[0].price || 0
          })
        } else {
          defaults.push({ name: option.name, price: 0 })
        }
      }
    })
    return defaults
  }
 
  const handleChoiceSelect = (option: any, choiceName: string) => {
    const choice = option.choices?.find((c: any) => c.name === choiceName)
    if (!choice) return
 
    setSelectedOptions((prev) => {
      const filtered = prev.filter(o => o.groupId !== (option.id || option.name))
      return [...filtered, {
        groupId: option.id || option.name,
        groupName: option.name,
        name: choice.name,
        price: choice.price || 0
      }]
    })
  }
 
  const handleChoiceToggle = (option: any, choice: any, checked: boolean) => {
    setSelectedOptions((prev) => {
      if (checked) {
        return [...prev, {
          groupId: option.id || option.name,
          groupName: option.name,
          name: choice.name,
          price: choice.price || 0
        }]
      }
      return prev.filter(o => !(o.groupId === (option.id || option.name) && o.name === choice.name))
    })
  }
 
  const handleToggleLegacyOption = (option: MenuOption, checked: boolean) => {
    const isChecked = checked === true
 
    if (!isChecked && option.required) {
      return
    }
 
    setSelectedOptions((prev) => {
      const optionKey = option.id ?? option.name
      const exists = prev.some((item) => (item.id ?? item.name) === optionKey)
 
      if (isChecked) {
        return exists ? prev : [...prev, { ...option }]
      }
 
      return prev.filter((item) => (item.id ?? item.name) !== optionKey)
    })
  }
 
  const handleOpenItemDetail = (item: MenuItem) => {
    setSelectedItem(item)
    setCurrentImageIndex(0)
    setQuantity(1)
    setSelectedToppings([])
    setSelectedOptions(getDefaultSelectedOptions(item))
    setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] : undefined)
    setNotes("")
    setEditingCartItem(null)
  }
 
  const handleEditCartItem = (item: any) => {
    const menuItem = menuItems.find((mi) => mi.id === item.id)
    if (menuItem) {
      setSelectedItem(menuItem)
      setQuantity(item.quantity)
      setSelectedToppings(item.selectedToppings || [])
      setSelectedOptions(item.selectedOptions || getDefaultSelectedOptions(menuItem))
      setSelectedSize(item.selectedSize)
      setNotes(item.notes || "")
      setCurrentImageIndex(0)
      setEditingCartItem(item)
    }
  }
 
  const handleDeleteOrderItem = (orderId: string, itemIndex: number) => {
    setDeleteConfirmation({ open: true, orderId, itemIndex })
  }
 
  const confirmDeleteOrderItem = async () => {
    if (!deleteConfirmation) return
 
    try {
      const item = tableOrders.find((order) => order.id === deleteConfirmation.orderId)?.items?.[deleteConfirmation.itemIndex]
      const actionKey = item?.id ?? `${deleteConfirmation.orderId}:${deleteConfirmation.itemIndex}`
      setOrderItemActionLoading(actionKey)
      if (item?.id) {
        await deleteOrderItem(deleteConfirmation.orderId, item.id)
      }
      await refreshTableOrders()
      setDeleteConfirmation(null)
      showToast("Đã xóa món")
    } catch (error) {
      console.error("Không thể xóa món khỏi đơn hàng:", error)
      showToast("Xóa món thất bại", "error")
    } finally {
      setOrderItemActionLoading(null)
    }
  }
 
  const handleEditOrderItem = (item: any) => {
    const menuItem = menuItems.find((mi) => mi.id === item.menuItemId || mi.id === item.id)
    if (menuItem) {
      setSelectedItem(menuItem)
      setEditingCartItem({ ...item, isOrderItem: true })
      setSelectedSize(item.details?.selectedSize || null)
      setSelectedToppings(item.details?.selectedToppings || [])
      setSelectedOptions(item.details?.selectedOptions || getDefaultSelectedOptions(menuItem))
      setNotes(item.note || "")
      setQuantity(item.quantity)
    }
  }
 
  // image navigation
  const currentImages = selectedItem?.images || (selectedItem?.image ? [selectedItem.image] : ["/placeholder.svg"])
  const hasMultipleImages = currentImages.length > 1
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
 
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "preparing":
        return <ChefHat className="h-4 w-4" />
      case "ready":
        return <CheckCircle2 className="h-4 w-4" />
      case "served":
        return <Truck className="h-4 w-4" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }
 
  // auto hide header logo short time
  useEffect(() => {
    const timer = setTimeout(() => setShowLogo(false), 2000)
    return () => clearTimeout(timer)
  }, [])
 
  const detailTotal = selectedItem
    ? (selectedItem.price +
        selectedOptions.reduce((sum, o: any) => sum + (o.price || 0), 0) +
        selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0) +
        (selectedSize?.price || 0)) *
      quantity
    : 0
 
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-32 no-scrollbar">
      {/* global scrollbar-hiding + toast styles */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar,
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        .no-scrollbar,
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
 
      {/* Toast notifications */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none w-[calc(100vw-2rem)] max-w-xs">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ animation: "toast-in 0.15s ease-out" }}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold text-white ${
              t.variant === "error" ? "bg-red-500" : t.variant === "info" ? "bg-gray-800" : "bg-emerald-500"
            }`}
          >
            {t.variant === "error" ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
            <span className="truncate">{t.message}</span>
          </div>
        ))}
      </div>
 
      {showLogo && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">Bàn {table}</h1>
                  <p className="text-white/80 text-xs">Chọn món và đặt hàng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
 
      <div
        className={`border-b bg-white shadow-md sticky ${showLogo ? "top-[74px]" : "top-0"} z-40 transition-all duration-300`}
      >
        <div className="container mx-auto px-3 py-3">
          {/* Search bar */}
          <div className="flex items-center gap-2 mb-3">
            {!showSearch ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearch(true)}
                className="flex-1 justify-start gap-2 h-11 text-gray-500 border-gray-300"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Tìm kiếm món ăn...</span>
              </Button>
            ) : (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  autoFocus
                  type="text"
                  placeholder="Nhập tên món..."
                  className="pl-10 pr-10 h-11 text-sm bg-gray-50 border-gray-300 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery("")
                  }}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            )}
 
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowOrderMenu(true)}
              className="h-11 px-3 border-orange-200 bg-orange-50 hover:bg-orange-100 relative"
            >
              <ShoppingBasket className="h-5 w-5 text-orange-600" />
              {totalOrderedItems > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full text-[10px] bg-red-500 border-2 border-white px-1.5">
                  {totalOrderedItems}
                </Badge>
              )}
            </Button>
          </div>
 
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-3 px-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={`whitespace-nowrap h-9 text-xs px-4 rounded-full transition-all ${
                  selectedCategory === category
                    ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                    : "border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>
 
      <div className="container mx-auto px-3 py-4 space-y-5">
        {menuLoading ? (
          <div className="text-center py-16 text-gray-500">Đang tải thực đơn...</div>
        ) : menuError ? (
          <div className="text-center py-16 text-red-500">Lỗi tải menu: {menuError}</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500">Không có món nào phù hợp.</div>
        ) : (
          <>
            {/* Signature / đặc sản items — horizontal swipe rail, only shown if any exist */}
            {specialtyItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-0.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <h2 className="text-sm font-bold text-gray-900">Món đặc sản của quán</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-3 px-3">
                  {specialtyItems.map((item) => (
                    <Card
                      key={item.id}
                      className="snap-start shrink-0 w-[150px] cursor-pointer border-0 rounded-2xl overflow-hidden bg-white shadow-md active:scale-[0.98] transition-transform"
                      onClick={() => handleOpenItemDetail(item)}
                    >
                      <div className="relative w-full pt-[100%] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        <Image src={getImageSrc(item.image)} alt={item.name} fill className="object-cover" />
                        <Badge className="absolute top-1.5 left-1.5 text-[9px] h-5 px-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg border-0 gap-0.5">
                          <Flame className="h-2.5 w-2.5" /> HOT
                        </Badge>
                      </div>
                      <div className="p-2 flex flex-col gap-0.5">
                        <h3 className="font-semibold text-xs text-gray-900 leading-snug line-clamp-2 min-h-[2rem]">
                          {item.name}
                        </h3>
                        <p className="font-bold text-sm text-orange-600">{formatCurrency(item.price)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
 
            {/* Regular menu — vertical grid */}
            <div className="space-y-2">
              {specialtyItems.length > 0 && (
                <h2 className="text-sm font-bold text-gray-900 px-0.5">Thực đơn</h2>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {regularItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
               border-0 rounded-2xl overflow-hidden bg-white shadow-md active:scale-[0.98]"
                    onClick={() => handleOpenItemDetail(item)}
                  >
                    <div className="relative w-full pt-[100%] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      <Image
                        src={getImageSrc(item.image)}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-110"
                      />
                      {item.sizes && item.sizes.length > 0 && (
                        <Badge className="absolute top-2 right-2 text-[10px] h-6 px-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-lg border-0">
                          S/M/L
                        </Badge>
                      )}
                    </div>
 
                    <div className="p-3 flex flex-col gap-1.5">
                      <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
                        {item.name}
                      </h3>
 
                      {item.description && <p className="text-[11px] text-gray-500 line-clamp-1">{item.description}</p>}
 
                      <div className="flex items-center justify-between mt-1">
                        <p className="font-bold text-base text-orange-600">{formatCurrency(item.price)}</p>
                        <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-orange-600" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
 
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 shadow-2xl z-50 rounded-t-3xl">
          <div className="container mx-auto px-4 py-4">
            {/* Cart items */}
            <div className="max-h-[180px] overflow-y-auto space-y-2 mb-3 no-scrollbar">
              {cart.map((item) => (
                <div key={item.cartItemId ?? item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2 border border-gray-100">
                  <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden shadow-sm">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                    {item.selectedSize && <p className="text-[10px] text-gray-500">Size: {item.selectedSize.name}</p>}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="text-[10px] text-gray-500 truncate">
                        Lựa chọn: {item.selectedOptions.map((option) => option.name).join(", ")}
                      </p>
                    )}
                    <p className="text-sm font-bold text-orange-600 mt-0.5">
                      {formatCurrency(
                        (item.price +
                          (item.selectedToppings?.reduce((s: number, t: any) => s + (t.price || 0), 0) || 0) +
                          (item.selectedSize?.price || 0)) *
                          item.quantity,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 hover:bg-gray-100"
                      onClick={() => updateCartItem(item.cartItemId ?? item.id, { quantity: Math.max(1, item.quantity - 1) })}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-bold w-7 text-center">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 hover:bg-gray-100"
                      onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                    onClick={() => handleEditCartItem(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => removeFromCart(item.cartItemId ?? item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
 
            {/* Order summary and button */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-medium">{cartItemCount} món</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(cartTotal)}</p>
              </div>
              <Button
                size="lg"
                onClick={handleSubmitOrder}
                disabled={pendingSubmit}
                className="gap-2 h-12 px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg rounded-xl font-semibold disabled:opacity-70"
              >
                <ShoppingBasket className="h-4 w-4" />
                <span>Gửi đơn</span>
              </Button>
            </div>
          </div>
        </div>
      )}
 
      {/* Simplified order-confirm dialog: just "continue" or "order more" */}
      <Dialog open={showOrderConfirm} onOpenChange={setShowOrderConfirm}>
        <DialogContent className="max-w-xs w-[calc(100vw-3rem)] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 text-center">Gửi đơn hàng?</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 pt-3">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setShowOrderConfirm(false)}>
              Gọi thêm
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              onClick={confirmSubmitOrder}
              disabled={pendingSubmit}
            >
              {pendingSubmit ? "Đang gửi..." : "Tiếp tục"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
 
      <Dialog open={showOrderMenu} onOpenChange={setShowOrderMenu}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col rounded-2xl p-0">
          <DialogHeader className="p-4 pb-3 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-lg font-bold text-gray-900">Đơn hàng của bạn</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            {ordersLoading ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingBasket className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Đang tải đơn hàng...</p>
              </div>
            ) : tableOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingBasket className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              tableOrders.map((order) => (
                <Card key={order.id} className="border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-gray-50 to-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${order.status === "pending" ? "bg-amber-100 text-amber-700" : order.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {order.status === "pending"
                          ? "Chưa xác nhận"
                          : order.status === "cancelled"
                          ? "Đã hủy"
                          : "Đã xác nhận"}
                      </span>
                    </div>
 
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs bg-white p-2 rounded-lg">
                        <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden shadow-sm">
                          <Image
                            src={getImageSrc(item.menuItem?.images?.[0]?.image || item.details?.image || item.image) || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                          {item.status === "cancelled" && (
                            <p className="text-[10px] font-semibold text-red-600 mt-0.5">Đã hủy</p>
                          )}
                          {item.details?.selectedSize && (
                            <p className="text-[10px] text-gray-500 mt-0.5">Size: {item.details.selectedSize.name}</p>
                          )}
                          {item.details?.selectedToppings && item.details.selectedToppings.length > 0 && (
                            <p className="text-[10px] text-gray-500">
                              Topping: {item.details.selectedToppings.map((t: any) => t.name).join(", ")}
                            </p>
                          )}
                          {item.note && <p className="text-[10px] text-amber-600 mt-0.5">Ghi chú: {item.note}</p>}
                          <p className="text-xs font-bold text-orange-600 mt-1">
                            {formatCurrency(
                              (Number(item.price ?? 0) +
                                (item.details?.selectedToppings?.reduce((s: number, t: any) => s + Number(t.price || 0), 0) || 0) +
                                Number(item.details?.selectedSize?.price || 0)) *
                                Number(item.quantity || 1),
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {getStatusIcon(order.status)}
                          <span className="font-bold text-sm whitespace-nowrap">x{item.quantity}</span>
                          {order.status === "pending" && item.status !== "cancelled" && (
                            <div className="flex gap-1 ml-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-blue-500 hover:bg-blue-50 rounded-full"
                                onClick={() => handleEditOrderItem({ ...item, orderId: order.id })}
                                disabled={orderItemActionLoading === (item.id ?? `${order.id}:${idx}`)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 hover:bg-red-50 rounded-full"
                                onClick={() => handleDeleteOrderItem(order.id, idx)}
                                disabled={orderItemActionLoading === (item.id ?? `${order.id}:${idx}`)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
 
                    <div className="flex justify-between items-center pt-2 border-t-2 border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Tổng món:</span>
                      <span className="font-bold text-base text-gray-900">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
 
      <Dialog open={deleteConfirmation?.open || false} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Xác nhận xóa món</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-4">Bạn có chắc chắn muốn xóa món này khỏi đơn hàng không?</p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl border-2 bg-transparent"
              onClick={() => setDeleteConfirmation(null)}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-xl"
              onClick={confirmDeleteOrderItem}
            >
              Xóa món
            </Button>
          </div>
        </DialogContent>
      </Dialog>
 
      {/* Item Detail Dialog — image-first, compact chip-based options (Shopee-style) */}
      <Dialog
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null)
            setSelectedOptions([])
          }
        }}
      >
        <DialogContent className="max-w-lg w-[calc(100vw-1.5rem)] max-h-[92vh] overflow-hidden flex flex-col rounded-2xl p-0 gap-0 [&>button]:hidden">
          {selectedItem && (
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* Image takes the majority of the visible space; name sits as a compact
                  overlay chip in the bottom-left corner instead of a full-width header */}
              <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                <Image
                  src={currentImages[currentImageIndex] || "/placeholder.svg"}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                  priority
                />
 
                {/* explicit close button, always visible over the image */}
                <button
                  onClick={() => {
                    setSelectedItem(null)
                    setSelectedOptions([])
                  }}
                  className="absolute right-3 top-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
 
                {hasMultipleImages && (
                  <>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-lg bg-white/90 hover:bg-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-lg bg-white/90 hover:bg-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {currentImages.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === currentImageIndex ? "bg-white w-5" : "bg-white/60 w-1.5"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
 
                {/* compact name + price overlay chip, bottom-left corner only */}
                <div className="absolute bottom-3 left-3 max-w-[75%] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
                  <h3 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2">{selectedItem.name}</h3>
                  <p className="text-orange-600 font-bold text-sm mt-0.5">{formatCurrency(selectedItem.price)}</p>
                </div>
              </div>
 
              <div className="px-4 pt-3 pb-24 space-y-4">
                {selectedItem.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{selectedItem.description}</p>
                )}
 
                {/* Size selection — compact chip row */}
                {selectedItem.sizes && selectedItem.sizes.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wide">Chọn size</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.sizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                            selectedSize?.id === size.id
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 text-gray-700 hover:border-orange-300"
                          }`}
                        >
                          {size.name}
                          {size.price > 0 && <span className="ml-1 text-orange-600">+{formatCurrency(size.price)}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
 
                {/* Options — compact chip-wrap groups, Shopee-style variant picker */}
                {selectedItem.options && selectedItem.options.length > 0 && (
                  <div className="space-y-4">
                    {selectedItem.options.map((option) => (
                      <div key={option.id ?? option.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wide">{option.name}</h4>
                          {option.required && <span className="text-[10px] font-semibold text-orange-600">Bắt buộc</span>}
                        </div>
 
                        {option.choices && option.choices.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {option.choices.map((choice: any) => {
                              const isSelected = !option.isMultiple
                                ? selectedOptions.find((o: any) => o.groupId === (option.id || option.name))?.name === choice.name
                                : selectedOptions.some((o: any) => o.groupId === (option.id || option.name) && o.name === choice.name)
                              return (
                                <button
                                  key={choice.name}
                                  onClick={() =>
                                    option.isMultiple
                                      ? handleChoiceToggle(option, choice, !isSelected)
                                      : handleChoiceSelect(option, choice.name)
                                  }
                                  className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all flex items-center gap-1 ${
                                    isSelected
                                      ? "border-orange-500 bg-orange-50 text-orange-700"
                                      : "border-gray-200 text-gray-700 hover:border-orange-300"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                  {choice.name}
                                  {choice.price > 0 && <span className="text-orange-600">+{formatCurrency(choice.price)}</span>}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleLegacyOption(option, !selectedOptions.some((o) => o.name === option.name))}
                            className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all flex items-center gap-1 ${
                              selectedOptions.some((o) => o.name === option.name)
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-gray-200 text-gray-700 hover:border-orange-300"
                            }`}
                          >
                            {selectedOptions.some((o) => o.name === option.name) && <Check className="h-3 w-3" />}
                            {option.name}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
 
                {/* Notes — compact single-line-ish textarea */}
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wide">Ghi chú</h4>
                  <Textarea
                    placeholder="Ghi chú cho món (không bắt buộc)"
                    className="min-h-[52px] resize-none rounded-xl border-2 text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
 
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 hover:bg-white"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-base font-bold w-8 text-center">{quantity}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 hover:bg-white"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg rounded-xl font-semibold text-sm"
                  >
                    {editingCartItem ? "Cập nhật" : "Thêm"} - {formatCurrency(detailTotal)}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
 
      <Dialog open={showPaymentQR} onOpenChange={setShowPaymentQR}>
        <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 bg-gradient-to-r from-orange-500 to-orange-600">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Quét mã thanh toán
            </DialogTitle>
          </DialogHeader>
 
          <div className="flex flex-col items-center gap-4 p-6">
            <div className="bg-white p-4 rounded-2xl border-4 border-orange-100 shadow-xl">
              <QRCodeSVG value={`PAY_TABLE_${table}_${allOrdersTotal}`} size={200} level="H" includeMargin={true} />
            </div>
 
            <div className="text-center w-full bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Số tiền thanh toán</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(allOrdersTotal)}</p>
              <p className="text-sm text-gray-500 mt-2 font-medium">Bàn {table}</p>
            </div>
 
            <p className="text-xs text-center text-gray-500 px-2 leading-relaxed">
              Quét mã QR bằng ứng dụng ngân hàng để thanh toán nhanh chóng và an toàn
            </p>
          </div>
 
          <div className="p-4 bg-gray-50 border-t-2 border-gray-100 space-y-2">
            <Button
              className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg rounded-xl font-semibold"
              onClick={handlePaymentComplete}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Đã thanh toán
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-2 border-gray-300 hover:bg-gray-100 rounded-xl font-semibold bg-transparent"
              onClick={handlePaymentCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}