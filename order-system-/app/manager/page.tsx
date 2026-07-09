"use client"
 
import { useEffect, useMemo, useRef, useState } from "react"
import { useRequireRole, useLogout } from "@/lib/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  ShoppingBag,
  QrCode,
  Plus,
  Edit,
  Search,
  Trash2,
  X,
  LayoutDashboard,
  UtensilsCrossed,
  Table2,
  Receipt,
  ImageIcon,
  Users,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { createTable, getImageUrl, getTables, updateTable, deleteTable, createMenuItem, getMenuItems, updateMenuItem, deleteMenuItem, getCategories, createCategory, updateCategory, deleteCategory, uploadMenuImage, deleteMenuItemImage, getStaffAccounts, createStaffAccount, deleteStaffAccount } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/format"
import { getAuthUser, getUserRoleLabel } from "@/lib/auth"
import { useStore } from "@/lib/store"
import { StatusBadge } from "@/components/status-badge"
import { AppHeader } from "@/components/app-header"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Category, MenuItem, Table } from "@/lib/types"
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react"
 
type RevenuePeriod = "day" | "week" | "month"
type ToastItem = { id: number; type: "success" | "error"; message: string }
 
const NAV_ITEMS = [
  { value: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { value: "menu", label: "Món ăn", icon: UtensilsCrossed },
  { value: "tables", label: "Bàn", icon: Table2 },
  { value: "staff", label: "Nhân viên", icon: Users },
  { value: "orders", label: "Đơn hàng", icon: Receipt },
] as const
 
export default function ManagerPage() {
  useRequireRole(["manager", "admin"])
  const logout = useLogout()
  const { orders } = useStore()
  const currentUser = getAuthUser()
  const roleInfo = getUserRoleLabel(currentUser?.role)
 
  const [activeTab, setActiveTab] = useState<(typeof NAV_ITEMS)[number]["value"]>("dashboard")
 
  // ---- Toast notifications (popup that shows then disappears) ----
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const notify = (type: ToastItem["type"], message: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))
 
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)
 
  // Menu item form states
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isEditingItem, setIsEditingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [isSubmittingItem, setIsSubmittingItem] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [isManagingCategories, setIsManagingCategories] = useState(false)
 
  // Menu item form inputs
  const [formItemName, setFormItemName] = useState("")
  const [formItemDescription, setFormItemDescription] = useState("")
  const [formItemPrice, setFormItemPrice] = useState("")
  const [formItemCategory, setFormItemCategory] = useState("")
  const [formItemAvailable, setFormItemAvailable] = useState(true)
  const [formItemOptions, setFormItemOptions] = useState<any[]>([])
  const [formItemImages, setFormItemImages] = useState<any[]>([])
  const [newOptionName, setNewOptionName] = useState("")
  const [newOptionRequired, setNewOptionRequired] = useState(false)
  const [newOptionIsMultiple, setNewOptionIsMultiple] = useState(false)
  const [newOptionPrice, setNewOptionPrice] = useState("")
  const [newOptionChoices, setNewOptionChoices] = useState<{ name: string; price: number }[]>([])
  const [newChoiceName, setNewChoiceName] = useState("")
  const [newChoicePrice, setNewChoicePrice] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
 
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [editingTableId, setEditingTableId] = useState<string | null>(null)
  const [editTableName, setEditTableName] = useState("")
  const [isDeletingTable, setIsDeletingTable] = useState(false)
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Tất cả")
  const [tables, setTables] = useState<Table[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(true)
  const [newTableName, setNewTableName] = useState("")
  const [newTableQrCode, setNewTableQrCode] = useState("")
  const [isSubmittingTable, setIsSubmittingTable] = useState(false)
  const [isDownloadingAllQr, setIsDownloadingAllQr] = useState(false)
 
  // Hidden high-resolution canvases used to export QR codes as PNG files
  const qrCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
 
  const [staffAccounts, setStaffAccounts] = useState<Array<{ id: string; name: string; email?: string | null; phone?: string | null; address?: string | null; role?: string | null; status?: string; createdAt?: string | null; message?: string }>>([])
  const [staffFormName, setStaffFormName] = useState("")
  const [staffFormEmail, setStaffFormEmail] = useState("")
  const [staffFormPassword, setStaffFormPassword] = useState("")
  const [staffFormPhone, setStaffFormPhone] = useState("")
  const [staffFormAddress, setStaffFormAddress] = useState("")
  const [staffFormRole, setStaffFormRole] = useState("service")
  const [isCreatingStaffAccount, setIsCreatingStaffAccount] = useState(false)
  const [isAddingStaff, setIsAddingStaff] = useState(false)
  const [isDeletingStaffAccount, setIsDeletingStaffAccount] = useState(false)
  const [deletingStaffAccountId, setDeletingStaffAccountId] = useState<string | null>(null)
 
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("day")
 
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const categoryName = typeof item.category === "object" ? item.category?.name : item.category
    const matchesCategory = categoryFilter === "Tất cả" || categoryName === categoryFilter
    return matchesSearch && matchesCategory
  })
 
  const getItemImagePath = (item: MenuItem, index = 0) => {
    const value = item.images?.[index]
    if (!value) return ""
    return typeof value === "string" ? value : value.image || ""
  }
 
  const activeMenuCount = menuItems.filter((item) => item.available).length
  const categoryCount = categories.length
  const tableCount = tables.length
  const occupiedTableCount = tables.filter((table) => table.status === "occupied").length
  const latestMenuItems = [...menuItems]
    .sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))
    .slice(0, 4)
 
  // Real revenue data computed from actual orders, grouped by day / week / month
  const revenueChartData = useMemo(() => {
    const now = new Date()
    const sumForRange = (start: Date, end: Date) =>
      orders
        .filter((o) => {
          const od = new Date(o.createdAt)
          return od >= start && od <= end
        })
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
 
    if (revenuePeriod === "day") {
      const days: { name: string; revenue: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
        days.push({ name: d.toLocaleDateString("vi-VN", { weekday: "short" }), revenue: sumForRange(start, end) })
      }
      return days
    }
 
    if (revenuePeriod === "week") {
      const weeks: { name: string; revenue: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const end = new Date(now)
        end.setDate(now.getDate() - i * 7)
        const start = new Date(end)
        start.setDate(end.getDate() - 6)
        start.setHours(0, 0, 0, 0)
        const endOfDay = new Date(end)
        endOfDay.setHours(23, 59, 59, 999)
        weeks.push({ name: `${start.getDate()}/${start.getMonth() + 1}`, revenue: sumForRange(start, endOfDay) })
      }
      return weeks
    }
 
    const months: { name: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      months.push({ name: `Th${d.getMonth() + 1}`, revenue: sumForRange(start, end) })
    }
    return months
  }, [orders, revenuePeriod])
 
  const totalRevenueInRange = revenueChartData.reduce((sum, d) => sum + d.revenue, 0)
 
  useEffect(() => {
    async function loadMenuAndCategories() {
      try {
        setIsLoadingMenu(true)
        const [menuData, categoryData] = await Promise.all([getMenuItems(), getCategories()])
        setMenuItems(Array.isArray(menuData) ? menuData : [])
        setCategories(Array.isArray(categoryData) ? categoryData : [])
      } catch (error: any) {
        notify("error", error?.message || "Không thể tải menu items")
      } finally {
        setIsLoadingMenu(false)
      }
    }
    loadMenuAndCategories()
  }, [])
 
  useEffect(() => {
    async function loadTables() {
      try {
        setIsLoadingTables(true)
        const data = await getTables()
        setTables(Array.isArray(data) ? data : [])
      } catch (error: any) {
        notify("error", error?.message || "Không thể tải danh sách bàn")
      } finally {
        setIsLoadingTables(false)
      }
    }
 
    async function loadStaffAccounts() {
      try {
        const data = await getStaffAccounts()
        setStaffAccounts(Array.isArray(data) ? data : [])
      } catch (error: any) {
        notify("error", error?.message || "Không thể tải danh sách nhân viên")
      }
    }
 
    loadTables()
    loadStaffAccounts()
  }, [])
 
  const handleCreateCategory = async (event?: any) => {
    event?.preventDefault()
    if (!newCategoryName.trim()) {
      notify("error", "Tên loại sản phẩm là bắt buộc")
      return
    }
 
    try {
      setIsCreatingCategory(true)
      const created = await createCategory({
        name: newCategoryName.trim(),
        sortOrder: categories.length,
      })
 
      setCategories((prev) => [...prev, created].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))
      setNewCategoryName("")
      setFormItemCategory(created.id)
      notify("success", "Đã tạo loại sản phẩm")
    } catch (error: any) {
      notify("error", error?.message || "Không thể tạo loại sản phẩm")
    } finally {
      setIsCreatingCategory(false)
    }
  }
 
  const handleEditCategory = async (event?: any) => {
    event?.preventDefault()
    if (!editingCategoryId || !editCategoryName.trim()) {
      notify("error", "Tên loại sản phẩm là bắt buộc")
      return
    }
 
    try {
      setIsSubmittingCategory(true)
      const updated = await updateCategory(editingCategoryId, {
        name: editCategoryName.trim(),
      })
      setCategories((prev) => prev.map((cat) => (cat.id === updated.id ? updated : cat)))
      setEditingCategoryId(null)
      setEditCategoryName("")
      notify("success", "Đã cập nhật loại sản phẩm")
    } catch (error: any) {
      notify("error", error?.message || "Không thể cập nhật loại sản phẩm")
    } finally {
      setIsSubmittingCategory(false)
    }
  }
 
  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return
 
    try {
      setIsDeletingCategory(true)
      await deleteCategory(deletingCategoryId)
      setCategories((prev) => prev.filter((cat) => cat.id !== deletingCategoryId))
      if (formItemCategory === deletingCategoryId) {
        setFormItemCategory("")
      }
      setDeletingCategoryId(null)
      notify("success", "Đã xóa loại sản phẩm")
    } catch (error: any) {
      notify("error", error?.message || "Không thể xóa loại sản phẩm")
    } finally {
      setIsDeletingCategory(false)
    }
  }
 
  const buildTableMenuUrl = (tableCode: string) => {
    const cleanCode = tableCode.startsWith("http")
      ? new URL(tableCode).pathname.replace(/^\/menu\//, "")
      : tableCode.replace(/^\/menu\//, "")
 
    const safeCode = cleanCode.trim()
    if (!safeCode) return ""
    return `${window.location.origin}/menu/${encodeURIComponent(safeCode)}`
  }
 
  const handleCreateStaffAccount = async (event?: any) => {
    event?.preventDefault()
    if (!staffFormName.trim() || !staffFormEmail.trim() || !staffFormPassword.trim()) {
      notify("error", "Vui lòng nhập đầy đủ tên, email và mật khẩu")
      return
    }
 
    try {
      setIsCreatingStaffAccount(true)
      const created = await createStaffAccount({
        name: staffFormName.trim(),
        email: staffFormEmail.trim(),
        password: staffFormPassword,
        phone: staffFormPhone.trim() || undefined,
        address: staffFormAddress.trim() || undefined,
        role: staffFormRole,
      })
      setStaffAccounts((prev) => [created, ...prev])
      notify("success", created.message || "Tài khoản nhân viên đã được tạo thành công")
      setStaffFormName("")
      setStaffFormEmail("")
      setStaffFormPassword("")
      setStaffFormPhone("")
      setStaffFormAddress("")
      setStaffFormRole("service")
      setIsAddingStaff(false)
    } catch (error: any) {
      notify("error", error?.message || "Không thể tạo tài khoản nhân viên")
    } finally {
      setIsCreatingStaffAccount(false)
    }
  }
 
  const handleDeleteStaffAccount = async (accountId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản nhân viên này?")) {
      return
    }
 
    try {
      setIsDeletingStaffAccount(true)
      setDeletingStaffAccountId(accountId)
      const result = await deleteStaffAccount(accountId)
      setStaffAccounts((prev) => prev.filter((account) => account.id !== accountId))
      notify("success", result.message || "Xóa tài khoản nhân viên thành công")
    } catch (error: any) {
      notify("error", error?.message || "Không thể xóa tài khoản nhân viên")
    } finally {
      setIsDeletingStaffAccount(false)
      setDeletingStaffAccountId(null)
    }
  }
 
  const handleCreateTable = async (event: any) => {
    event.preventDefault()
    if (!newTableName.trim()) return
 
    try {
      setIsSubmittingTable(true)
      const created = await createTable({
        name: newTableName.trim(),
        qrCode: newTableQrCode.trim() || undefined,
      })
 
      setTables((prev) => [created, ...prev])
      setNewTableName("")
      setNewTableQrCode("")
      setIsCreatingTable(false)
      notify("success", "Đã tạo bàn mới")
    } catch (error: any) {
      notify("error", error?.message || "Không thể tạo bàn")
    } finally {
      setIsSubmittingTable(false)
    }
  }
 
  const handleEditTable = async (event: any) => {
    event.preventDefault()
    if (!editTableName.trim() || !editingTableId) return
 
    try {
      setIsSubmittingTable(true)
      const updated = await updateTable(editingTableId, {
        name: editTableName.trim(),
      })
 
      setTables((prev) => prev.map((t) => (t.id === editingTableId ? { ...t, name: updated.name } : t)))
      setEditingTableId(null)
      setEditTableName("")
      setIsEditingTable(false)
      notify("success", "Đã cập nhật bàn")
    } catch (error: any) {
      notify("error", error?.message || "Không thể sửa bàn")
    } finally {
      setIsSubmittingTable(false)
    }
  }
 
  const handleDeleteTable = async () => {
    if (!deletingTableId) return
 
    try {
      setIsDeletingTable(true)
      await deleteTable(deletingTableId)
      setTables((prev) => prev.filter((t) => t.id !== deletingTableId))
      setDeletingTableId(null)
      notify("success", "Đã xóa bàn")
    } catch (error: any) {
      notify("error", error?.message || "Không thể xóa bàn")
    } finally {
      setIsDeletingTable(false)
    }
  }
 
  const openEditDialog = (table: Table) => {
    setEditingTableId(table.id)
    setEditTableName(table.name || "")
    setIsEditingTable(true)
  }
 
  // ---- QR download: draws the table's QR (from a hidden high-res canvas)
  // onto a fresh canvas with the table name printed underneath, then saves as PNG ----
  const downloadQrForTable = (table: Table) =>
    new Promise<void>((resolve) => {
      if (!table.qrCode) {
        notify("error", `Bàn "${table.name}" chưa có mã QR`)
        resolve()
        return
      }
      const sourceCanvas = qrCanvasRefs.current[table.id]
      if (!sourceCanvas) {
        notify("error", "Không thể tạo ảnh QR, vui lòng thử lại")
        resolve()
        return
      }
 
      const qrSize = sourceCanvas.width
      const padding = 48
      const nameHeight = 72
      const outputCanvas = document.createElement("canvas")
      outputCanvas.width = qrSize + padding * 2
      outputCanvas.height = qrSize + padding * 2 + nameHeight
      const ctx = outputCanvas.getContext("2d")
      if (!ctx) {
        resolve()
        return
      }
 
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
      ctx.drawImage(sourceCanvas, padding, padding, qrSize, qrSize)
      ctx.fillStyle = "#0f172a"
      ctx.font = "bold 30px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const label = table.name || `Bàn ${table.number || ""}`
      ctx.fillText(label, outputCanvas.width / 2, qrSize + padding * 2 + nameHeight / 2)
 
      const link = document.createElement("a")
      link.download = `QR-${label.replace(/\s+/g, "-")}.png`
      link.href = outputCanvas.toDataURL("image/png")
      link.click()
      resolve()
    })
 
  const handleDownloadAllQr = async () => {
    const validTables = tables.filter((t) => t.qrCode)
    if (validTables.length === 0) {
      notify("error", "Chưa có bàn nào có mã QR để tải")
      return
    }
    setIsDownloadingAllQr(true)
    for (const table of validTables) {
      await downloadQrForTable(table)
      await new Promise((res) => setTimeout(res, 350))
    }
    setIsDownloadingAllQr(false)
    notify("success", `Đã tải ${validTables.length} mã QR`)
  }
 
  const resetMenuItemForm = () => {
    setFormItemName("")
    setFormItemDescription("")
    setFormItemPrice("")
    setFormItemCategory("")
    setFormItemAvailable(true)
    setFormItemOptions([])
    setFormItemImages([])
    setNewOptionName("")
    setNewOptionRequired(false)
    setNewOptionIsMultiple(false)
    setNewOptionPrice("")
    setNewOptionChoices([])
    setImageFiles([])
    setImagePreviews([])
    setEditingItemId(null)
  }
 
  const normalizeOptionsForPayload = (options: any[]) =>
    (options || [])
      .filter((option) => option?.name?.trim())
      .map((option) => ({
        name: option.name.trim(),
        required: Boolean(option.required),
        isMultiple: Boolean(option.isMultiple),
        choices: Array.isArray(option.choices)
          ? option.choices
              .map((choice: any) => ({
                name: String(choice?.name ?? "").trim(),
                price: Number(choice?.price ?? 0),
              }))
              .filter((choice: any) => choice.name)
          : [],
        price: Number(option.price ?? 0),
      }))
 
  const handleCreateMenuItem = async (event: any) => {
    event.preventDefault()
    if (!formItemName.trim() || !formItemPrice) return
    if (categories.length === 0) {
      notify("error", "Bạn cần tạo ít nhất một loại sản phẩm trước khi tạo món")
      return
    }
    if (!formItemCategory) {
      notify("error", "Danh mục là bắt buộc")
      return
    }
 
    try {
      setIsSubmittingItem(true)
      const normalizedOptions = normalizeOptionsForPayload(formItemOptions)
 
      const created = await createMenuItem({
        name: formItemName.trim(),
        description: formItemDescription.trim() || undefined,
        price: parseFloat(formItemPrice),
        available: formItemAvailable,
        categoryId: formItemCategory,
        options: normalizedOptions,
      })
 
      if (imageFiles.length > 0) {
        try {
          for (const file of imageFiles) {
            await uploadMenuImage(created.id, file)
          }
          created.images = imagePreviews.map((preview, idx) => ({
            id: idx + 1,
            menuId: created.id,
            image: preview,
          }))
        } catch (imgErr) {
          console.error("Image upload failed:", imgErr)
          notify("error", "Đã tạo món nhưng tải ảnh lên thất bại")
        }
      }
 
      setMenuItems((prev) => [created, ...prev])
      resetMenuItemForm()
      setIsAddingItem(false)
      notify("success", "Đã tạo món mới")
    } catch (error: any) {
      notify("error", error?.message || "Không thể tạo món")
    } finally {
      setIsSubmittingItem(false)
    }
  }
 
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files)
      setImageFiles((prev) => [...prev, ...newFiles])
 
      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }
 
  const handleRemoveImage = async (imageId: number) => {
    if (!editingItemId) return
    try {
      await deleteMenuItemImage(editingItemId, imageId)
      setFormItemImages((prev) => prev.filter((img) => img.id !== imageId))
    } catch (error: any) {
      notify("error", error?.message || "Không thể xóa ảnh")
    }
  }
 
  const handleRemovePreviewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }
 
  const handleEditMenuItem = async (event: any) => {
    event.preventDefault()
    if (!formItemName.trim() || !editingItemId) return
    if (!formItemCategory) {
      notify("error", "Danh mục là bắt buộc")
      return
    }
 
    try {
      setIsSubmittingItem(true)
      const normalizedOptions = normalizeOptionsForPayload(formItemOptions)
 
      const updated = await updateMenuItem(editingItemId, {
        name: formItemName.trim(),
        description: formItemDescription.trim() || undefined,
        price: parseFloat(formItemPrice),
        available: formItemAvailable,
        categoryId: formItemCategory,
        options: normalizedOptions,
      })
 
      if (imageFiles.length > 0) {
        try {
          for (const file of imageFiles) {
            await uploadMenuImage(editingItemId, file)
          }
          updated.images = [
            ...(formItemImages || []),
            ...imagePreviews.map((preview, idx) => ({
              id: (formItemImages?.length || 0) + idx + 1,
              menuId: editingItemId,
              image: preview,
            })),
          ]
        } catch (imgErr) {
          console.error("Image upload failed:", imgErr)
          notify("error", "Đã cập nhật món nhưng tải ảnh lên thất bại")
        }
      }
 
      setMenuItems((prev) => prev.map((item) => (item.id === editingItemId ? updated : item)))
      resetMenuItemForm()
      setIsEditingItem(false)
      notify("success", "Đã cập nhật món")
    } catch (error: any) {
      notify("error", error?.message || "Không thể sửa món")
    } finally {
      setIsSubmittingItem(false)
    }
  }
 
  const handleDeleteMenuItem = async () => {
    if (!deletingItemId) return
 
    try {
      setIsDeletingItem(true)
      await deleteMenuItem(deletingItemId)
      setMenuItems((prev) => prev.filter((item) => item.id !== deletingItemId))
      setDeletingItemId(null)
      notify("success", "Đã xóa món")
    } catch (error: any) {
      notify("error", error?.message || "Không thể xóa món")
    } finally {
      setIsDeletingItem(false)
    }
  }
 
  const openEditMenuItemDialog = (item: MenuItem) => {
    setEditingItemId(item.id)
    setFormItemName(item.name)
    setFormItemDescription(item.description || "")
    setFormItemPrice(item.price.toString())
    const categoryId = typeof item.category === "object" ? item.category?.id : item.category
    setFormItemCategory(categoryId || "")
    setFormItemAvailable(item.available)
    setFormItemOptions(item.options || [])
    setFormItemImages(item.images || [])
    setImageFiles([])
    setImagePreviews([])
    setIsEditingItem(true)
  }
 
  const handleAddChoice = () => {
    if (!newChoiceName.trim()) return
    const price = parseInt(newChoicePrice) || 0
    setNewOptionChoices((prev) => [...prev, { name: newChoiceName.trim(), price }])
    setNewChoiceName("")
    setNewChoicePrice("")
  }
 
  const handleRemoveChoice = (index: number) => {
    setNewOptionChoices((prev) => prev.filter((_, i) => i !== index))
  }
 
  const handleAddOption = () => {
    if (!newOptionName.trim()) return
    setFormItemOptions((prev) => [
      ...prev,
      {
        name: newOptionName.trim(),
        required: newOptionRequired,
        isMultiple: newOptionIsMultiple,
        price: Number(newOptionPrice || 0),
        choices: [...newOptionChoices],
      },
    ])
    setNewOptionName("")
    setNewOptionRequired(false)
    setNewOptionIsMultiple(false)
    setNewOptionPrice("")
    setNewOptionChoices([])
  }
 
  const handleRemoveOption = (index: number) => {
    setFormItemOptions((prev) => prev.filter((_, i) => i !== index))
  }
 
  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      {/* Toast popups — appear briefly, then disappear on their own */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-in fade-in slide-in-from-top-3 pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border bg-white p-3.5 shadow-lg duration-300 ${
              t.type === "error" ? "border-red-100" : "border-emerald-100"
            }`}
          >
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${t.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              {t.type === "error" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
            <p className="flex-1 pt-0.5 text-sm text-slate-700">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-slate-300 hover:text-slate-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
 
      {/* Hidden high-resolution QR canvases, used only to export PNG downloads */}
      <div className="hidden">
        {tables
          .filter((t) => t.qrCode)
          .map((table) => (
            <QRCodeCanvas
              key={table.id}
              value={buildTableMenuUrl(table.qrCode)}
              size={480}
              level="H"
              ref={(el) => {
                qrCanvasRefs.current[table.id] = el
              }}
            />
          ))}
      </div>
 
      <AppHeader
        title="Quản lý cửa hàng"
        actions={
          <Button
            variant="ghost"
            onClick={logout}
            className="h-9 rounded-full px-4 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            Đăng xuất
          </Button>
        }
      />
 
      {/* Segmented nav — sticky, scrollable on small screens */}
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#F7F8F6]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-3 py-2 sm:px-6">
          <div className="flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.value
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
 
      <div className="mx-auto max-w-4xl px-3 py-5 sm:px-6 sm:py-8">
        {/* ============ DASHBOARD ============ */}
        {activeTab === "dashboard" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">{currentUser?.restaurantId ? `Mã quán: ${currentUser.restaurantId}` : "Tài khoản chưa liên kết với quán"}</p>
              </div>
              <Badge className={`w-fit rounded-full ${roleInfo.badgeClass} hover:${roleInfo.badgeClass}`}>{roleInfo.label}</Badge>
            </div>
 
            {/* Revenue chart with period toggle */}
            <Card className="rounded-3xl border-slate-200 shadow-none">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Doanh thu</p>
                    <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{formatCurrency(totalRevenueInRange)}</p>
                  </div>
                  <div className="flex rounded-full bg-slate-100 p-1">
                    {(["day", "week", "month"] as RevenuePeriod[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setRevenuePeriod(p)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          revenuePeriod === p ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
                        }`}
                      >
                        {p === "day" ? "Ngày" : p === "week" ? "Tuần" : "Tháng"}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(0)}tr` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}
                      contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }}
                    />
                    <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
 
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Món đang bán", value: activeMenuCount, icon: UtensilsCrossed, tint: "bg-emerald-50 text-emerald-600" },
                { label: "Loại sản phẩm", value: categoryCount, icon: ShoppingBag, tint: "bg-blue-50 text-blue-600" },
                { label: "Tổng bàn", value: tableCount, icon: Table2, tint: "bg-purple-50 text-purple-600" },
                { label: "Đang phục vụ", value: occupiedTableCount, icon: QrCode, tint: "bg-orange-50 text-orange-600" },
              ].map((kpi) => (
                <Card key={kpi.label} className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-3.5 sm:p-4">
                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${kpi.tint}`}>
                      <kpi.icon className="h-4 w-4" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 sm:text-2xl">{kpi.value}</div>
                    <p className="mt-0.5 text-xs text-slate-500">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
 
            {/* Latest items */}
            <Card className="rounded-3xl border-slate-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900">Món mới nhất</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {latestMenuItems.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có món nào trong quán này.</p>
                ) : (
                  latestMenuItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm">{index + 1}</span>
                        <div>
                          <span className="block text-sm font-medium text-slate-900">{item.name}</span>
                          <span className="text-xs text-slate-500">{item.available ? "Đang hiển thị" : "Đang ẩn"}</span>
                        </div>
                      </div>
                      <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{formatCurrency(item.price)}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
 
        {/* ============ MENU (Shopee-style adaptive masonry grid) ============ */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Tìm món..."
                className="h-11 rounded-full border-slate-200 bg-white pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
 
            {/* Category chips + manage link */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
                {["Tất cả", ...categories.map((c) => c.name)].map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors ${
                      categoryFilter === category ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsManagingCategories(true)}
                className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500"
              >
                Sửa loại
              </button>
            </div>
 
            <Button
              className="h-11 w-full rounded-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (categories.length === 0) {
                  notify("error", "Bạn cần tạo ít nhất một loại sản phẩm trước khi tạo món")
                  return
                }
                setIsAddingItem(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm món
            </Button>
 
            {isLoadingMenu ? (
              <p className="text-sm text-slate-500">Đang tải danh sách món...</p>
            ) : menuItems.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có món nào. Hãy tạo món đầu tiên.</p>
            ) : (
              // CSS-column masonry: each card's height adapts to its own image's
              // natural proportions, the same "product wall" feel as Shopee listings.
              <div className="columns-2 gap-3 sm:columns-3 md:columns-4">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openEditMenuItemDialog(item)}
                    className={`mb-3 break-inside-avoid cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md ${
                      !item.available ? "opacity-60" : ""
                    }`}
                  >
                    <div className="relative">
                      {item.images && item.images.length > 0 ? (
                        <img src={getImageUrl(getItemImagePath(item, 0))} alt={item.name} className="block w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center bg-slate-100">
                          <UtensilsCrossed className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                      {!item.available && (
                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 py-1 text-center text-[11px] font-medium text-white">Hết hàng</div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingItemId(item.id)
                        }}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1 p-2.5">
                      <h3 className="line-clamp-2 text-xs font-medium leading-snug text-slate-800">{item.name}</h3>
                      <p className="text-sm font-bold text-rose-600">{formatCurrency(item.price)}</p>
                      {item.options && item.options.length > 0 && (
                        <span className="inline-block rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">{item.options.length} tùy chọn</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
 
            {/* Manage categories dialog */}
            <Dialog open={isManagingCategories} onOpenChange={setIsManagingCategories}>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Loại sản phẩm</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Tên loại mới"
                      className="h-11 rounded-xl"
                    />
                    <Button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                      className="h-11 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isCreatingCategory ? "..." : "Thêm"}
                    </Button>
                  </div>
 
                  {categories.length === 0 ? (
                    <p className="text-sm text-amber-600">Bạn chưa có loại sản phẩm nào.</p>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((cat) =>
                        editingCategoryId === cat.id ? (
                          <form key={cat.id} onSubmit={handleEditCategory} className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                            <Input
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="h-9 rounded-lg"
                              required
                            />
                            <Button type="submit" size="sm" disabled={isSubmittingCategory} className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700">
                              Lưu
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-9 rounded-lg"
                              onClick={() => {
                                setEditingCategoryId(null)
                                setEditCategoryName("")
                              }}
                            >
                              Hủy
                            </Button>
                          </form>
                        ) : (
                          <div key={cat.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                            <span className="text-sm text-slate-700">{cat.name}</span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingCategoryId(cat.id)
                                  setEditCategoryName(cat.name || "")
                                }}
                                className="h-8 w-8 rounded-full p-0 text-slate-500"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingCategoryId(cat.id)}
                                className="h-8 w-8 rounded-full p-0"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
 
            <Dialog open={!!deletingCategoryId} onOpenChange={(open) => !open && setDeletingCategoryId(null)}>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Xác nhận xóa loại sản phẩm</DialogTitle>
                </DialogHeader>
                <p className="mb-2 text-sm text-slate-600">
                  Xóa loại "{categories.find((cat) => cat.id === deletingCategoryId)?.name}"? Các món thuộc loại này sẽ mất danh mục.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-full" onClick={() => setDeletingCategoryId(null)} disabled={isDeletingCategory}>
                    Hủy
                  </Button>
                  <Button variant="destructive" className="rounded-full" onClick={handleDeleteCategory} disabled={isDeletingCategory}>
                    {isDeletingCategory ? "Đang xóa..." : "Xóa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
 
            {/* Add item dialog */}
            <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
              <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Thêm món mới</DialogTitle>
                </DialogHeader>
                <MenuItemForm
                  onSubmit={handleCreateMenuItem}
                  submitLabel={isSubmittingItem ? "Đang tạo..." : "Tạo món"}
                  isSubmitting={isSubmittingItem}
                  formItemName={formItemName}
                  setFormItemName={setFormItemName}
                  formItemDescription={formItemDescription}
                  setFormItemDescription={setFormItemDescription}
                  formItemPrice={formItemPrice}
                  setFormItemPrice={setFormItemPrice}
                  formItemCategory={formItemCategory}
                  setFormItemCategory={setFormItemCategory}
                  formItemAvailable={formItemAvailable}
                  setFormItemAvailable={setFormItemAvailable}
                  categories={categories}
                  imagePreviews={imagePreviews}
                  onImageChange={handleImageChange}
                  onRemovePreviewImage={handleRemovePreviewImage}
                  existingImages={[]}
                  onRemoveExistingImage={() => {}}
                  formItemOptions={formItemOptions}
                  onRemoveOption={handleRemoveOption}
                  newOptionName={newOptionName}
                  setNewOptionName={setNewOptionName}
                  newOptionRequired={newOptionRequired}
                  setNewOptionRequired={setNewOptionRequired}
                  newOptionIsMultiple={newOptionIsMultiple}
                  setNewOptionIsMultiple={setNewOptionIsMultiple}
                  newOptionChoices={newOptionChoices}
                  onRemoveChoice={handleRemoveChoice}
                  newChoiceName={newChoiceName}
                  setNewChoiceName={setNewChoiceName}
                  newChoicePrice={newChoicePrice}
                  setNewChoicePrice={setNewChoicePrice}
                  onAddChoice={handleAddChoice}
                  onAddOption={handleAddOption}
                  idPrefix="add"
                />
              </DialogContent>
            </Dialog>
 
            {/* Edit item dialog */}
            <Dialog open={isEditingItem} onOpenChange={setIsEditingItem}>
              <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Sửa món</DialogTitle>
                </DialogHeader>
                <MenuItemForm
                  onSubmit={handleEditMenuItem}
                  submitLabel={isSubmittingItem ? "Đang cập nhật..." : "Cập nhật"}
                  isSubmitting={isSubmittingItem}
                  formItemName={formItemName}
                  setFormItemName={setFormItemName}
                  formItemDescription={formItemDescription}
                  setFormItemDescription={setFormItemDescription}
                  formItemPrice={formItemPrice}
                  setFormItemPrice={setFormItemPrice}
                  formItemCategory={formItemCategory}
                  setFormItemCategory={setFormItemCategory}
                  formItemAvailable={formItemAvailable}
                  setFormItemAvailable={setFormItemAvailable}
                  categories={categories}
                  imagePreviews={imagePreviews}
                  onImageChange={handleImageChange}
                  onRemovePreviewImage={handleRemovePreviewImage}
                  existingImages={formItemImages}
                  onRemoveExistingImage={handleRemoveImage}
                  formItemOptions={formItemOptions}
                  onRemoveOption={handleRemoveOption}
                  newOptionName={newOptionName}
                  setNewOptionName={setNewOptionName}
                  newOptionRequired={newOptionRequired}
                  setNewOptionRequired={setNewOptionRequired}
                  newOptionIsMultiple={newOptionIsMultiple}
                  setNewOptionIsMultiple={setNewOptionIsMultiple}
                  newOptionChoices={newOptionChoices}
                  onRemoveChoice={handleRemoveChoice}
                  newChoiceName={newChoiceName}
                  setNewChoiceName={setNewChoiceName}
                  newChoicePrice={newChoicePrice}
                  setNewChoicePrice={setNewChoicePrice}
                  onAddChoice={handleAddChoice}
                  onAddOption={handleAddOption}
                  idPrefix="edit"
                />
                <button
                  type="button"
                  onClick={() => setDeletingItemId(editingItemId)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa món này
                </button>
              </DialogContent>
            </Dialog>
 
            <Dialog open={!!deletingItemId} onOpenChange={(open) => !open && setDeletingItemId(null)}>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Xác nhận xóa món</DialogTitle>
                </DialogHeader>
                <p className="mb-2 text-sm text-slate-600">
                  Xóa món "{menuItems.find((item) => item.id === deletingItemId)?.name}"? Thao tác này không thể hoàn tác.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-full" onClick={() => setDeletingItemId(null)} disabled={isDeletingItem}>
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-full"
                    onClick={async () => {
                      await handleDeleteMenuItem()
                      setIsEditingItem(false)
                    }}
                    disabled={isDeletingItem}
                  >
                    {isDeletingItem ? "Đang xóa..." : "Xóa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
 
        {/* ============ TABLES ============ */}
        {activeTab === "tables" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Bàn ({tables.length})</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadAllQr}
                  disabled={isDownloadingAllQr || tables.length === 0}
                  className="h-10 shrink-0 rounded-full border-slate-200"
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  {isDownloadingAllQr ? "Đang tải..." : "Tải tất cả QR"}
                </Button>
                <Dialog open={isCreatingTable} onOpenChange={setIsCreatingTable}>
                  <DialogTrigger asChild>
                    <Button className="h-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Thêm bàn
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>Tạo bàn mới</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTable} className="space-y-4">
                      <div>
                        <Label htmlFor="table-name">Tên bàn</Label>
                        <Input
                          id="table-name"
                          value={newTableName}
                          onChange={(e) => setNewTableName(e.target.value)}
                          placeholder="Ví dụ: Bàn 12"
                          className="mt-1.5 h-11 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="table-qr">Mã QR (tuỳ chọn)</Label>
                        <Input
                          id="table-qr"
                          value={newTableQrCode}
                          onChange={(e) => setNewTableQrCode(e.target.value)}
                          placeholder="Để trống để hệ thống tự tạo"
                          className="mt-1.5 h-11 rounded-xl"
                        />
                      </div>
                      <Button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={isSubmittingTable}>
                        {isSubmittingTable ? "Đang tạo..." : "Tạo bàn"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
 
            {isLoadingTables ? (
              <p className="text-sm text-slate-500">Đang tải danh sách bàn...</p>
            ) : tables.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có bàn nào. Hãy tạo bàn đầu tiên.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {tables.map((table) => (
                  <Card key={table.id} className="rounded-2xl border-slate-200 shadow-none">
                    <CardContent className="p-3 text-center">
                      <div className="mb-2 flex justify-center rounded-xl bg-emerald-50 p-2.5">
                        {table.qrCode ? <QRCodeSVG value={buildTableMenuUrl(table.qrCode)} size={72} level="H" /> : <QrCode className="h-10 w-10 text-emerald-600" />}
                      </div>
                      {/* Table name shown under the QR on screen, and burned into the downloaded PNG too */}
                      <h3 className="mb-1 text-sm font-bold text-slate-900">{table.name || `Bàn ${table.number || ""}`}</h3>
                      <Badge
                        variant={table.status === "occupied" ? "default" : "secondary"}
                        className={`mb-2 h-5 rounded-full text-[10px] ${table.status === "occupied" ? "bg-emerald-600" : ""}`}
                      >
                        {table.status === "occupied" ? "Đang dùng" : "Trống"}
                      </Badge>
                      <div className="flex justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(table)} className="h-8 w-8 rounded-full p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadQrForTable(table)}
                          disabled={!table.qrCode}
                          className="h-8 w-8 rounded-full p-0 text-emerald-600 hover:text-emerald-700 disabled:opacity-30"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeletingTableId(table.id)} className="h-8 w-8 rounded-full p-0 text-red-600 hover:text-red-700">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
 
            <Dialog open={isEditingTable} onOpenChange={setIsEditingTable}>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Sửa bàn</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditTable} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-table-name">Tên bàn</Label>
                    <Input
                      id="edit-table-name"
                      value={editTableName}
                      onChange={(e) => setEditTableName(e.target.value)}
                      placeholder="Ví dụ: Bàn 12"
                      className="mt-1.5 h-11 rounded-xl"
                      required
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={isSubmittingTable}>
                    {isSubmittingTable ? "Đang cập nhật..." : "Cập nhật"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
 
            <Dialog open={!!deletingTableId} onOpenChange={(open) => !open && setDeletingTableId(null)}>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Xác nhận xóa bàn</DialogTitle>
                </DialogHeader>
                <p className="mb-2 text-sm text-slate-600">
                  Xóa bàn "{tables.find((t) => t.id === deletingTableId)?.name}"? Thao tác này không thể hoàn tác.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-full" onClick={() => setDeletingTableId(null)} disabled={isDeletingTable}>
                    Hủy
                  </Button>
                  <Button variant="destructive" className="rounded-full" onClick={handleDeleteTable} disabled={isDeletingTable}>
                    {isDeletingTable ? "Đang xóa..." : "Xóa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
 
        {/* ============ STAFF ============ */}
        {activeTab === "staff" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Nhân viên ({staffAccounts.length})</h2>
              <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
                <DialogTrigger asChild>
                  <Button className="h-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Thêm
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Tạo tài khoản nhân viên</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateStaffAccount} className="space-y-3">
                    <div>
                      <Label htmlFor="staff-name">Họ tên</Label>
                      <Input
                        id="staff-name"
                        value={staffFormName}
                        onChange={(e) => setStaffFormName(e.target.value)}
                        placeholder="Nhập họ tên nhân viên"
                        className="mt-1.5 h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-email">Email</Label>
                      <Input
                        id="staff-email"
                        type="email"
                        value={staffFormEmail}
                        onChange={(e) => setStaffFormEmail(e.target.value)}
                        placeholder="email@domain.com"
                        className="mt-1.5 h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-password">Mật khẩu</Label>
                      <Input
                        id="staff-password"
                        type="password"
                        value={staffFormPassword}
                        onChange={(e) => setStaffFormPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="mt-1.5 h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-phone">Số điện thoại</Label>
                      <Input
                        id="staff-phone"
                        value={staffFormPhone}
                        onChange={(e) => setStaffFormPhone(e.target.value)}
                        placeholder="Ví dụ: 0901234567"
                        className="mt-1.5 h-11 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-role">Vai trò</Label>
                      <select
                        id="staff-role"
                        value={staffFormRole}
                        onChange={(e) => setStaffFormRole(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                      >
                        <option value="service">Nhân viên phục vụ</option>
                        <option value="kitchen">Nhân viên bếp</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="staff-address">Địa chỉ</Label>
                      <Textarea
                        id="staff-address"
                        value={staffFormAddress}
                        onChange={(e) => setStaffFormAddress(e.target.value)}
                        placeholder="Nhập địa chỉ nhân viên"
                        rows={2}
                        className="mt-1.5 rounded-xl"
                      />
                    </div>
                    <Button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={isCreatingStaffAccount}>
                      {isCreatingStaffAccount ? "Đang tạo..." : "Tạo tài khoản"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
 
            {staffAccounts.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có tài khoản nhân viên nào.</p>
            ) : (
              <div className="space-y-2">
                {staffAccounts.map((account) => (
                  <Card key={account.id} className="rounded-2xl border-slate-200 shadow-none">
                    <CardContent className="flex items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{account.name}</p>
                        <p className="truncate text-xs text-slate-500">{account.email || "Không có email"}</p>
                        <p className="truncate text-xs text-slate-400">
                          {account.phone || "Chưa có SĐT"}
                          {account.address ? ` • ${account.address}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {account.role === "kitchen" ? "Bếp" : "Phục vụ"}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteStaffAccount(account.id)}
                          disabled={isDeletingStaffAccount && deletingStaffAccountId === account.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
 
        {/* ============ ORDERS ============ */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Lịch sử đơn hàng</h2>
            <div className="space-y-2.5">
              {orders.slice(0, 20).map((order) => (
                <Card key={order.id} className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="rounded-full font-bold">
                            Bàn {order.tableNumber}
                          </Badge>
                          <StatusBadge status={order.status} />
                          <span className="text-xs text-slate-400">#{order.id}</span>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="truncate">• {item.name}</span>
                              <Badge variant="secondary" className="shrink-0 rounded-full text-xs">
                                x{item.quantity}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
 
// Shared form used by both the "add item" and "edit item" dialogs so the
// two flows can never visually drift apart.
function MenuItemForm(props: {
  onSubmit: (e: any) => void
  submitLabel: string
  isSubmitting: boolean
  formItemName: string
  setFormItemName: (v: string) => void
  formItemDescription: string
  setFormItemDescription: (v: string) => void
  formItemPrice: string
  setFormItemPrice: (v: string) => void
  formItemCategory: string
  setFormItemCategory: (v: string) => void
  formItemAvailable: boolean
  setFormItemAvailable: (v: boolean) => void
  categories: Category[]
  imagePreviews: string[]
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePreviewImage: (index: number) => void
  existingImages: any[]
  onRemoveExistingImage: (id: number) => void
  formItemOptions: any[]
  onRemoveOption: (index: number) => void
  newOptionName: string
  setNewOptionName: (v: string) => void
  newOptionRequired: boolean
  setNewOptionRequired: (v: boolean) => void
  newOptionIsMultiple: boolean
  setNewOptionIsMultiple: (v: boolean) => void
  newOptionChoices: { name: string; price: number }[]
  onRemoveChoice: (index: number) => void
  newChoiceName: string
  setNewChoiceName: (v: string) => void
  newChoicePrice: string
  setNewChoicePrice: (v: string) => void
  onAddChoice: () => void
  onAddOption: () => void
  idPrefix: string
}) {
  const {
    onSubmit,
    submitLabel,
    isSubmitting,
    formItemName,
    setFormItemName,
    formItemDescription,
    setFormItemDescription,
    formItemPrice,
    setFormItemPrice,
    formItemCategory,
    setFormItemCategory,
    formItemAvailable,
    setFormItemAvailable,
    categories,
    imagePreviews,
    onImageChange,
    onRemovePreviewImage,
    existingImages,
    onRemoveExistingImage,
    formItemOptions,
    onRemoveOption,
    newOptionName,
    setNewOptionName,
    newOptionRequired,
    setNewOptionRequired,
    newOptionIsMultiple,
    setNewOptionIsMultiple,
    newOptionChoices,
    onRemoveChoice,
    newChoiceName,
    setNewChoiceName,
    newChoicePrice,
    setNewChoicePrice,
    onAddChoice,
    onAddOption,
    idPrefix,
  } = props
 
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-item-name`}>
          Tên món <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${idPrefix}-item-name`}
          value={formItemName}
          onChange={(e) => setFormItemName(e.target.value)}
          placeholder="Nhập tên món"
          className="mt-1.5 h-11 rounded-xl"
          required
        />
      </div>
 
      <div>
        <Label htmlFor={`${idPrefix}-item-description`}>Mô tả</Label>
        <Textarea
          id={`${idPrefix}-item-description`}
          value={formItemDescription}
          onChange={(e) => setFormItemDescription(e.target.value)}
          placeholder="Nhập mô tả"
          rows={2}
          className="mt-1.5 rounded-xl"
        />
      </div>
 
      <div>
        <Label htmlFor={`${idPrefix}-item-price`}>
          Giá <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${idPrefix}-item-price`}
          type="number"
          value={formItemPrice}
          onChange={(e) => setFormItemPrice(e.target.value)}
          placeholder="0"
          className="mt-1.5 h-11 rounded-xl"
          required
        />
      </div>
 
      <div className="rounded-xl border border-slate-200 p-3">
        <Label className="text-sm font-semibold">Hình ảnh món</Label>
        <div className="mt-2 space-y-2">
          {existingImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {existingImages.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                  <img src={getImageUrl(img.image)} alt="menu item" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemoveExistingImage(img.id)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                  <img src={getImageUrl(preview)} alt={`preview-${idx}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemovePreviewImage(idx)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 py-4 text-slate-400 hover:border-emerald-300 hover:text-emerald-600">
            <ImageIcon className="h-5 w-5" />
            <span className="text-xs">Chọn một hoặc nhiều ảnh</span>
            <input type="file" accept="image/*" onChange={onImageChange} multiple className="hidden" />
          </label>
        </div>
      </div>
 
      <div>
        <Label htmlFor={`${idPrefix}-item-category`}>
          Danh mục <span className="text-red-500">*</span>
        </Label>
        <select
          id={`${idPrefix}-item-category`}
          value={formItemCategory}
          onChange={(e) => setFormItemCategory(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
          required
        >
          <option value="">-- Chọn danh mục --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
 
      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
        <Label>Có sẵn</Label>
        <Switch checked={formItemAvailable} onCheckedChange={setFormItemAvailable} />
      </div>
 
      <div className="rounded-xl border border-slate-200 p-3">
        <Label className="text-sm font-semibold">Option</Label>
        <div className="mt-2 space-y-2">
          {formItemOptions.map((option, idx) => (
            <div key={idx} className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-semibold text-slate-800">{option.name}</span>
                  {option.required && <span className="ml-1 text-red-500">*</span>}
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {option.isMultiple ? "Chọn nhiều" : "Chọn 1"}
                  </Badge>
                  {Number(option.price || 0) > 0 && (
                    <span className="ml-2 text-[10px] font-semibold text-emerald-600">+{Number(option.price || 0).toLocaleString()}đ</span>
                  )}
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => onRemoveOption(idx)} className="h-7 w-7 rounded-full p-0 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {option.choices && option.choices.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {option.choices.map((choice: any, cIdx: number) => (
                    <Badge key={cIdx} variant="secondary" className="border border-slate-200 bg-white text-[10px] font-normal">
                      {choice.name} {choice.price ? `(+${choice.price}đ)` : ""}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
 
          <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
            <Input
              type="text"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              placeholder="Tên nhóm option (vd: Size, Topping)"
              className="h-10 rounded-lg"
            />
 
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              <Label className="cursor-pointer text-xs font-medium" htmlFor={`${idPrefix}-req-switch`}>
                Bắt buộc chọn
              </Label>
              <Switch id={`${idPrefix}-req-switch`} checked={newOptionRequired} onCheckedChange={setNewOptionRequired} />
            </div>
 
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              <Label className="cursor-pointer text-xs font-medium" htmlFor={`${idPrefix}-mul-switch`}>
                Loại Option
              </Label>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${!newOptionIsMultiple ? "font-bold text-slate-900" : "text-slate-500"}`}>Chọn 1</span>
                <Switch id={`${idPrefix}-mul-switch`} checked={newOptionIsMultiple} onCheckedChange={setNewOptionIsMultiple} />
                <span className={`text-xs ${newOptionIsMultiple ? "font-bold text-slate-900" : "text-slate-500"}`}>Nhiều</span>
              </div>
            </div>
 
            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5">
              <Label className="text-xs font-semibold text-slate-700">Các lựa chọn con</Label>
              {newOptionChoices.length > 0 && (
                <div className="mb-2 flex flex-col gap-1.5">
                  {newOptionChoices.map((choice, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded bg-slate-50 p-1.5 text-xs border border-slate-100">
                      <span>
                        {choice.name} <span className="ml-1 text-slate-500">(+{choice.price}đ)</span>
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveChoice(idx)} className="h-5 w-5 p-0 text-slate-400 hover:bg-transparent hover:text-red-500">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newChoiceName}
                  onChange={(e) => setNewChoiceName(e.target.value)}
                  placeholder="Tên (vd: L)"
                  className="h-8 flex-1 rounded-md text-xs"
                />
                <Input
                  type="number"
                  value={newChoicePrice}
                  onChange={(e) => setNewChoicePrice(e.target.value)}
                  placeholder="Giá (+)"
                  className="h-8 w-24 rounded-md text-xs"
                />
                <Button type="button" variant="secondary" onClick={onAddChoice} className="h-8 rounded-md px-3 text-xs">
                  Thêm
                </Button>
              </div>
            </div>
 
            <Button
              type="button"
              variant="default"
              onClick={onAddOption}
              className="h-10 w-full rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              disabled={!newOptionName.trim()}
            >
              Hoàn tất Option Này
            </Button>
          </div>
        </div>
      </div>
 
      <Button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  )
}