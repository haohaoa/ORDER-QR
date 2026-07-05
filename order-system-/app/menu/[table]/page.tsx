"use client"

import { use, useState, useEffect, useRef } from "react"
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
    options: Array.isArray(item.options)
      ? item.options.map((option: any) => ({
          id: option.id,
          name: option.name || "",
          required: Boolean(option.required),
        }))
      : [],
  }
}

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

  // delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean
    orderId: string
    itemIndex: number
  } | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMenuItems() {
      // Don't fetch if table is undefined
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
              .map((item) => (typeof item.category === "string" ? item.category : item.category?.name))
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

  // totals
  const cartTotal = cart.reduce((sum, item) => {
    const toppingTotal = item.selectedToppings?.reduce((t: number, topping: any) => t + (topping.price || 0), 0) || 0
    const sizePrice = item.selectedSize?.price || 0
    return sum + (item.price + toppingTotal + sizePrice) * item.quantity
  }, 0)

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
        } catch (error) {
          console.error("Không thể cập nhật món trong đơn hàng:", error)
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
      } else {
        addToCart({
          ...selectedItem,
          quantity,
          selectedToppings,
          selectedOptions,
          selectedSize,
          notes,
        })
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
    } catch (error) {
      console.error("Lỗi khi gửi đơn hàng:", error)
    } finally {
      submittingOrderRef.current = false
      setPendingSubmit(false)
    }
  }

  const handlePaymentComplete = () => {
    // Logic to mark orders as paid
    setShowPaymentQR(false)
    setShowOrderMenu(false)
    // Optional: Add toast notification
  }

  const handlePaymentCancel = () => {
    setShowPaymentQR(false)
  }

  const getDefaultSelectedOptions = (item?: MenuItem | null) => {
    if (!item?.options?.length) return []
    return item.options.filter((option) => option.required).map((option) => ({ ...option }))
  }

  const handleToggleOption = (option: MenuOption, checked: boolean | "indeterminate") => {
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
    } catch (error) {
      console.error("Không thể xóa món khỏi đơn hàng:", error)
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
      case "delivered":
        return <Truck className="h-4 w-4" />
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-32">
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
              <Receipt className="h-5 w-5 text-orange-600" />
              {totalOrderedItems > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full text-[10px] bg-red-500 border-2 border-white px-1.5">
                  {totalOrderedItems}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3">
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

      <div className="container mx-auto px-3 py-4">
        {menuLoading ? (
          <div className="text-center py-16 text-gray-500">Đang tải thực đơn...</div>
        ) : menuError ? (
          <div className="text-center py-16 text-red-500">Lỗi tải menu: {menuError}</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500">Không có món nào phù hợp.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
               border-0 rounded-2xl overflow-hidden bg-white shadow-md"
              onClick={() => handleOpenItemDetail(item)}
            >
              {/* Image */}
              <div className="relative w-full pt-[100%] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <Image
                  src={getImageSrc(item.image)}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-110"
                />

                {/* Size badge */}
                {item.sizes && item.sizes.length > 0 && (
                  <Badge className="absolute top-2 right-2 text-[10px] h-6 px-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-lg border-0">
                    S/M/L
                  </Badge>
                )}
              </div>

              {/* Content */}
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
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 shadow-2xl z-50 rounded-t-3xl">
          <div className="container mx-auto px-4 py-4">
            {/* Cart items */}
            <div className="max-h-[180px] overflow-y-auto space-y-2 mb-3 scrollbar-thin">
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
                <Receipt className="h-4 w-4" />
                <span>Gửi đơn</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showOrderConfirm} onOpenChange={setShowOrderConfirm}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col rounded-2xl p-0">
          <DialogHeader className="p-4 pb-3 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-lg font-bold text-gray-900">Xác nhận gửi đơn</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Bạn có muốn tiếp tục tạo đơn và gửi tất cả thông tin xuống Order chưa xác nhận?
              Nếu muốn thêm món nữa, chọn Order thêm.
            </p>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-semibold text-orange-700">Thông tin sẽ được lưu:</p>
              <ul className="mt-2 space-y-1 text-xs text-gray-700 list-disc list-inside">
                <li>Tên món</li>
                <li>Ghi chú / mô tả</li>
                <li>Option đã chọn</li>
                <li>Size nếu có</li>
                <li>Số lượng và tổng tiền</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="p-4 gap-2">
            <Button variant="outline" onClick={() => setShowOrderConfirm(false)}>
              Order thêm
            </Button>
            <Button onClick={confirmSubmitOrder} disabled={pendingSubmit}>
              {pendingSubmit ? "Đang gửi..." : "Tiếp tục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderMenu} onOpenChange={setShowOrderMenu}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col rounded-2xl p-0">
          <DialogHeader className="p-4 pb-3 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-lg font-bold text-gray-900">Đơn hàng của bạn</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {ordersLoading ? (
              <div className="text-center py-8 text-gray-400">
                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Đang tải đơn hàng...</p>
              </div>
            ) : tableOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              tableOrders.map((order) => (
                <Card key={order.id} className="border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-gray-50 to-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      {/* <span className="text-xs font-mono text-gray-500">#{order.id}</span> */}
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

          {/* {tableOrders.length > 0 && (
            <div className="border-t-2 border-gray-100 p-4 bg-gray-50 space-y-3 sticky bottom-0">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Tổng cộng:</span>
                <span className="text-2xl font-bold text-orange-600">{formatCurrency(allOrdersTotal)}</span>
              </div>
              <Button
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg rounded-xl font-semibold text-base"
                onClick={() => setShowPaymentQR(true)}
              >
                <QrCode className="h-5 w-5 mr-2" />
                Thanh toán
              </Button>
            </div>
          )} */}
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

      {/* Item Detail Dialog */}
      <Dialog
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null)
            setSelectedOptions([])
          }
        }}
      >
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden flex flex-col rounded-2xl p-0">
          <DialogHeader className="border-b pb-3 px-4 pt-4 sticky top-0 bg-white z-10 shadow-sm">
            <DialogTitle className="text-lg font-bold text-gray-900 pr-8">{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 pb-24 px-4">
                {/* Image carousel */}
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg -mx-4 mt-0">
                  <Image
                    src={currentImages[currentImageIndex] || "/placeholder.svg"}
                    alt={selectedItem.name}
                    fill
                    className="object-cover"
                  />
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
                            className={`h-2 rounded-full transition-all ${
                              idx === currentImageIndex ? "bg-white w-6" : "bg-white/60 w-2"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedItem.description}</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedItem.price)}</p>
                </div>

                {/* Size selection */}
                {selectedItem.sizes && selectedItem.sizes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">Chọn size</h4>
                    <RadioGroup
                      value={selectedSize?.id}
                      onValueChange={(value) => {
                        const size = selectedItem.sizes?.find((s) => s.id === value)
                        setSelectedSize(size)
                      }}
                    >
                      <div className="grid gap-2">
                        {selectedItem.sizes.map((size) => (
                          <Label
                            key={size.id}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedSize?.id === size.id
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-orange-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={size.id} />
                              <span className="font-medium text-sm">{size.name}</span>
                            </div>
                            <span className="font-bold text-sm text-orange-600">+{formatCurrency(size.price)}</span>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Options */}
                {selectedItem.options && selectedItem.options.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">Lựa chọn</h4>
                    <div className="grid gap-2">
                      {selectedItem.options.map((option) => {
                        const isSelected = selectedOptions.some(
                          (selected) => (selected.id ?? selected.name) === (option.id ?? option.name),
                        )

                        return (
                          <Label
                            key={option.id ?? option.name}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleToggleOption(option, checked)}
                              />
                              <span className="font-medium text-sm">{option.name}</span>
                            </div>
                            {option.required && <span className="text-xs font-semibold text-orange-600">Bắt buộc</span>}
                          </Label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Toppings */}
                {selectedItem.toppings && selectedItem.toppings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">Thêm topping</h4>
                    <div className="grid gap-2">
                      {selectedItem.toppings.map((topping) => (
                        <Label
                          key={topping.id}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedToppings.some((t) => t.id === topping.id)
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 hover:border-orange-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedToppings.some((t) => t.id === topping.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedToppings([...selectedToppings, topping])
                                } else {
                                  setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id))
                                }
                              }}
                            />
                            <span className="font-medium text-sm">{topping.name}</span>
                          </div>
                          <span className="font-bold text-sm text-orange-600">+{formatCurrency(topping.price)}</span>
                        </Label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-900">Ghi chú</h4>
                  <Textarea
                    placeholder="Thêm ghi chú cho món ăn (không bắt buộc)"
                    className="min-h-[80px] resize-none rounded-xl border-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 hover:bg-white"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-bold w-10 text-center">{quantity}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 hover:bg-white"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg rounded-xl font-semibold text-base"
                  >
                    {editingCartItem ? "Cập nhật" : "Thêm"} -{" "}
                    {formatCurrency(
                      (selectedItem.price +
                        selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0) +
                        (selectedSize?.price || 0)) *
                        quantity,
                    )}
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
