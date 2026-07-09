"use client"
 
import { useEffect, useState } from "react"
import { useRequireRole, useLogout } from "@/lib/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  QrCode,
  Plus,
  Edit,
  Search,
  Trash2,
  X,
  Upload,
  LayoutDashboard,
  UtensilsCrossed,
  Table2,
  Receipt,
  ImageIcon,
  Users,
} from "lucide-react"
import { createTable, getImageUrl, getTables, updateTable, deleteTable, createMenuItem, getMenuItems, updateMenuItem, deleteMenuItem, getCategories, createCategory, updateCategory, deleteCategory, addMenuItemOption, uploadMenuImage, deleteMenuItemImage, getStaffAccounts, createStaffAccount, deleteStaffAccount } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/format"
import { getAuthUser, getUserRoleLabel } from "@/lib/auth"
import { useStore } from "@/lib/store"
import { StatusBadge } from "@/components/status-badge"
import { AppHeader } from "@/components/app-header"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import type { Category, MenuItem, Table } from "@/lib/types"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
 
export default function ManagerPage() {
  useRequireRole(["manager", "admin"])
  const logout = useLogout()
  const { orders } = useStore()
  const currentUser = getAuthUser()
  const roleInfo = getUserRoleLabel(currentUser?.role)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)
  const [menuError, setMenuError] = useState<string | null>(null)
 
  // Menu item form states
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isEditingItem, setIsEditingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [isSubmittingItem, setIsSubmittingItem] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
 
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
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)
 
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
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
  const [tableError, setTableError] = useState<string | null>(null)
  const [newTableName, setNewTableName] = useState("")
  const [newTableQrCode, setNewTableQrCode] = useState("")
  const [isSubmittingTable, setIsSubmittingTable] = useState(false)
  const [staffAccounts, setStaffAccounts] = useState<Array<{ id: string; name: string; email?: string | null; phone?: string | null; address?: string | null; role?: string | null; status?: string; createdAt?: string | null; message?: string }>>([])
  const [staffFormName, setStaffFormName] = useState("")
  const [staffFormEmail, setStaffFormEmail] = useState("")
  const [staffFormPassword, setStaffFormPassword] = useState("")
  const [staffFormPhone, setStaffFormPhone] = useState("")
  const [staffFormAddress, setStaffFormAddress] = useState("")
  const [staffFormRole, setStaffFormRole] = useState("service")
  const [isCreatingStaffAccount, setIsCreatingStaffAccount] = useState(false)
  const [isDeletingStaffAccount, setIsDeletingStaffAccount] = useState(false)
  const [deletingStaffAccountId, setDeletingStaffAccountId] = useState<string | null>(null)
  const [staffAccountError, setStaffAccountError] = useState<string | null>(null)
  const [staffAccountSuccess, setStaffAccountSuccess] = useState<string | null>(null)
 
  const categoryOptions = categories.map(cat => ({ id: cat.id, name: cat.name }))
  const filteredCategoryOptions = categoryFilter === "Tất cả" ? categoryOptions : categoryOptions.filter(c => c.name === categoryFilter)
 
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const categoryName = typeof item.category === 'object' ? item.category?.name : item.category
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
  const latestMenuItems = [...menuItems].sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)).slice(0, 4)
 
  const orderChartData = [
    { name: "T2", orders: 45 },
    { name: "T3", orders: 52 },
    { name: "T4", orders: 48 },
    { name: "T5", orders: 61 },
    { name: "T6", orders: 55 },
    { name: "T7", orders: 67 },
    { name: "CN", orders: 73 },
  ]
 
  const categoryData = [
    { name: "Món chính", value: 45, color: "#10b981" },
    { name: "Khai vị", value: 30, color: "#3b82f6" },
    { name: "Đồ uống", value: 25, color: "#f59e0b" },
  ]
 
  useEffect(() => {
    async function loadMenuAndCategories() {
      try {
        setIsLoadingMenu(true)
        setMenuError(null)
        const [menuData, categoryData] = await Promise.all([
          getMenuItems(),
          getCategories(),
        ])
        setMenuItems(Array.isArray(menuData) ? menuData : [])
        setCategories(Array.isArray(categoryData) ? categoryData : [])
      } catch (error: any) {
        setMenuError(error?.message || "Không thể tải menu items")
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
        setTableError(null)
        const data = await getTables()
        setTables(Array.isArray(data) ? data : [])
      } catch (error: any) {
        setTableError(error?.message || "Không thể tải danh sách bàn")
      } finally {
        setIsLoadingTables(false)
      }
    }

    async function loadStaffAccounts() {
      try {
        const data = await getStaffAccounts()
        setStaffAccounts(Array.isArray(data) ? data : [])
      } catch (error: any) {
        setStaffAccountError(error?.message || "Không thể tải danh sách nhân viên")
      }
    }
 
    loadTables()
    loadStaffAccounts()
  }, [])
 
  const toggleItemAvailability = (itemId: string) => {
    // This function is no longer needed - use edit dialog instead
  }
 
  const handleCreateCategory = async (event?: any) => {
    event?.preventDefault()
    if (!newCategoryName.trim()) {
      setMenuError("Tên loại sản phẩm là bắt buộc")
      return
    }
 
    try {
      setIsCreatingCategory(true)
      setMenuError(null)
      const created = await createCategory({
        name: newCategoryName.trim(),
        sortOrder: categories.length,
      })
 
      setCategories((prev) => [...prev, created].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))
      setNewCategoryName("")
      setFormItemCategory(created.id)
    } catch (error: any) {
      setMenuError(error?.message || "Không thể tạo loại sản phẩm")
    } finally {
      setIsCreatingCategory(false)
    }
  }
 
  const handleEditCategory = async (event?: any) => {
    event?.preventDefault()
    if (!editingCategoryId || !editCategoryName.trim()) {
      setMenuError("Tên loại sản phẩm là bắt buộc")
      return
    }
 
    try {
      setIsSubmittingCategory(true)
      setMenuError(null)
      const updated = await updateCategory(editingCategoryId, {
        name: editCategoryName.trim(),
      })
      setCategories((prev) => prev.map((cat) => (cat.id === updated.id ? updated : cat)))
      setEditingCategoryId(null)
      setEditCategoryName("")
    } catch (error: any) {
      setMenuError(error?.message || "Không thể cập nhật loại sản phẩm")
    } finally {
      setIsSubmittingCategory(false)
    }
  }
 
  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return
 
    try {
      setIsDeletingCategory(true)
      setMenuError(null)
      await deleteCategory(deletingCategoryId)
      setCategories((prev) => prev.filter((cat) => cat.id !== deletingCategoryId))
      if (formItemCategory === deletingCategoryId) {
        setFormItemCategory("")
      }
      setDeletingCategoryId(null)
    } catch (error: any) {
      setMenuError(error?.message || "Không thể xóa loại sản phẩm")
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
      setStaffAccountError("Vui lòng nhập đầy đủ tên, email và mật khẩu")
      return
    }
 
    try {
      setIsCreatingStaffAccount(true)
      setStaffAccountError(null)
      setStaffAccountSuccess(null)
      const created = await createStaffAccount({
        name: staffFormName.trim(),
        email: staffFormEmail.trim(),
        password: staffFormPassword,
        phone: staffFormPhone.trim() || undefined,
        address: staffFormAddress.trim() || undefined,
        role: staffFormRole,
      })
      setStaffAccounts((prev) => [created, ...prev])
      setStaffAccountSuccess(created.message || "Tài khoản nhân viên đã được tạo thành công")
      setStaffFormName("")
      setStaffFormEmail("")
      setStaffFormPassword("")
      setStaffFormPhone("")
      setStaffFormAddress("")
      setStaffFormRole("service")
    } catch (error: any) {
      setStaffAccountError(error?.message || "Không thể tạo tài khoản nhân viên")
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
      setStaffAccountError(null)
      setStaffAccountSuccess(null)
      const result = await deleteStaffAccount(accountId)
      setStaffAccounts((prev) => prev.filter((account) => account.id !== accountId))
      setStaffAccountSuccess(result.message || "Xóa tài khoản nhân viên thành công")
    } catch (error: any) {
      setStaffAccountError(error?.message || "Không thể xóa tài khoản nhân viên")
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
      setTableError(null)
      const created = await createTable({
        name: newTableName.trim(),
        qrCode: newTableQrCode.trim() || undefined,
      })

      setTables((prev) => [created, ...prev])
      setNewTableName("")
      setNewTableQrCode("")
    } catch (error: any) {
      setTableError(error?.message || "Không thể tạo bàn")
    } finally {
      setIsSubmittingTable(false)
    }
  }
 
  const handleEditTable = async (event: any) => {
    event.preventDefault()
    if (!editTableName.trim() || !editingTableId) return
 
    try {
      setIsSubmittingTable(true)
      setTableError(null)
      const updated = await updateTable(editingTableId, {
        name: editTableName.trim(),
      })
 
      setTables((prev) =>
        prev.map((t) =>
          t.id === editingTableId
            ? { ...t, name: updated.name }
            : t
        )
      )
      setEditingTableId(null)
      setEditTableName("")
      setIsEditingTable(false)
    } catch (error: any) {
      setTableError(error?.message || "Không thể sửa bàn")
    } finally {
      setIsSubmittingTable(false)
    }
  }
 
  const handleDeleteTable = async () => {
    if (!deletingTableId) return
 
    try {
      setIsDeletingTable(true)
      setTableError(null)
      await deleteTable(deletingTableId)
      setTables((prev) => prev.filter((t) => t.id !== deletingTableId))
      setDeletingTableId(null)
    } catch (error: any) {
      setTableError(error?.message || "Không thể xóa bàn")
    } finally {
      setIsDeletingTable(false)
    }
  }
 
  const openEditDialog = (table: Table) => {
    setEditingTableId(table.id)
    setEditTableName(table.name || "")
    setIsEditingTable(true)
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
    setImageFiles([])
    setImagePreviews([])
    setEditingItemId(null)
  }
 
  const handleCreateMenuItem = async (event: any) => {
    event.preventDefault()
    if (!formItemName.trim() || !formItemPrice) return
    if (categories.length === 0) {
      setMenuError("Bạn cần tạo ít nhất một loại sản phẩm trước khi tạo món")
      return
    }
    if (!formItemCategory) {
      setMenuError("Danh mục là bắt buộc")
      return
    }
 
    try {
      setIsSubmittingItem(true)
      setMenuError(null)
      const normalizedOptions = formItemOptions
        .filter((option) => option?.name?.trim())
        .map((option) => ({
          name: option.name.trim(),
          required: Boolean(option.required),
        }))
 
      const created = await createMenuItem({
        name: formItemName.trim(),
        description: formItemDescription.trim() || undefined,
        price: parseFloat(formItemPrice),
        available: formItemAvailable,
        categoryId: formItemCategory,
        options: normalizedOptions,
      })
 
      // Upload all images if provided
      if (imageFiles.length > 0) {
        try {
          for (const file of imageFiles) {
            await uploadMenuImage(created.id, file)
          }
          // Reload images
          created.images = imagePreviews.map((preview, idx) => ({
            id: idx + 1,
            menuId: created.id,
            image: preview,
          }))
        } catch (imgErr) {
          console.error("Image upload failed:", imgErr)
        }
      }
 
      setMenuItems((prev) => [created, ...prev])
      resetMenuItemForm()
      setIsAddingItem(false)
    } catch (error: any) {
      setMenuError(error?.message || "Không thể tạo món")
    } finally {
      setIsSubmittingItem(false)
    }
  }
 
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files)
      setImageFiles((prev) => [...prev, ...newFiles])
 
      // Create previews for new files
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
      setMenuError(error?.message || "Không thể xóa ảnh")
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
      setMenuError("Danh mục là bắt buộc")
      return
    }
 
    try {
      setIsSubmittingItem(true)
      setMenuError(null)
      const normalizedOptions = formItemOptions
        .filter((option) => option?.name?.trim())
        .map((option) => ({
          name: option.name.trim(),
          required: Boolean(option.required),
        }))
 
      const updated = await updateMenuItem(editingItemId, {
        name: formItemName.trim(),
        description: formItemDescription.trim() || undefined,
        price: parseFloat(formItemPrice),
        available: formItemAvailable,
        categoryId: formItemCategory,
        options: normalizedOptions,
      })
 
      // Upload new images if provided
      if (imageFiles.length > 0) {
        try {
          for (const file of imageFiles) {
            await uploadMenuImage(editingItemId, file)
          }
          updated.images = [...(formItemImages || []), ...imagePreviews.map((preview, idx) => ({
            id: (formItemImages?.length || 0) + idx + 1,
            menuId: editingItemId,
            image: preview,
          }))]
        } catch (imgErr) {
          console.error("Image upload failed:", imgErr)
        }
      }
 
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId ? updated : item
        )
      )
      resetMenuItemForm()
      setIsEditingItem(false)
    } catch (error: any) {
      setMenuError(error?.message || "Không thể sửa món")
    } finally {
      setIsSubmittingItem(false)
    }
  }
 
  const handleDeleteMenuItem = async () => {
    if (!deletingItemId) return
 
    try {
      setIsDeletingItem(true)
      setMenuError(null)
      await deleteMenuItem(deletingItemId)
      setMenuItems((prev) => prev.filter((item) => item.id !== deletingItemId))
      setDeletingItemId(null)
    } catch (error: any) {
      setMenuError(error?.message || "Không thể xóa món")
    } finally {
      setIsDeletingItem(false)
    }
  }
 
  const openEditMenuItemDialog = (item: MenuItem) => {
    setEditingItemId(item.id)
    setFormItemName(item.name)
    setFormItemDescription(item.description || "")
    setFormItemPrice(item.price.toString())
    const categoryId = typeof item.category === 'object' ? item.category?.id : item.category
    setFormItemCategory(categoryId || "")
    setFormItemAvailable(item.available)
    setFormItemOptions(item.options || [])
    setFormItemImages(item.images || [])
    setImageFiles([])
    setImagePreviews([])
    setIsEditingItem(true)
  }
 
  const handleAddOption = () => {
    if (!newOptionName.trim()) return
    setFormItemOptions((prev) => [
      ...prev,
      { name: newOptionName.trim(), required: newOptionRequired },
    ])
    setNewOptionName("")
    setNewOptionRequired(false)
  }
 
  const handleRemoveOption = (index: number) => {
    setFormItemOptions((prev) => prev.filter((_, i) => i !== index))
  }
 
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        title="Quản Lý Cửa Hàng"
        actions={
          <Button
            variant="outline"
            onClick={logout}
            className="h-9 rounded-full border-red-200 px-4 text-sm text-red-600 hover:bg-red-50"
          >
            Đăng xuất
          </Button>
        }
      />
 
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="sticky top-0 z-10 h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger
              value="menu"
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              <UtensilsCrossed className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Món ăn</span>
            </TabsTrigger>
            <TabsTrigger
              value="tables"
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              <Table2 className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Bàn</span>
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              <Users className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Nhân viên</span>
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              <Receipt className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Đơn hàng</span>
            </TabsTrigger>
          </TabsList>
 
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Đang quản lý dữ liệu của cửa hàng hiện tại</p>
                    <p className="text-sm text-slate-500">{currentUser?.restaurantId ? `Mã quán: ${currentUser.restaurantId}` : "Tài khoản chưa liên kết với quán"}</p>
                  </div>
                  <Badge className={`w-fit rounded-full ${roleInfo.badgeClass} hover:${roleInfo.badgeClass}`}>
                    {roleInfo.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                      <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">Món đang bán</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 sm:text-2xl">{activeMenuCount}</div>
                  <p className="mt-1 text-xs text-emerald-600">Từ menu của quán bạn</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">Loại sản phẩm</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 sm:text-2xl">{categoryCount}</div>
                  <p className="mt-1 text-xs text-blue-600">Danh mục đang dùng</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50">
                      <Table2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">Tổng bàn</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 sm:text-2xl">{tableCount}</div>
                  <p className="mt-1 text-xs text-purple-600">Đã tạo cho quán</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50">
                      <QrCode className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">Bàn đang phục vụ</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 sm:text-2xl">{occupiedTableCount}</div>
                  <p className="mt-1 text-xs text-slate-400">Theo trạng thái bàn</p>
                </CardContent>
              </Card>
            </div>
 
            {/* Charts */}
            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-900">Đơn hàng theo ngày</CardTitle>
                </CardHeader>
                <CardContent className="pl-0">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={orderChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={30} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
 
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-900">Phân loại món ăn</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#10b981"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
                <CardContent className="flex flex-wrap justify-center gap-3 pt-0">
                  {categoryData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.name}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
 
            {/* Popular Items */}
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900">Món mới nhất</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {latestMenuItems.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có món nào trong quán này.</p>
                ) : latestMenuItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm">
                        {index + 1}
                      </span>
                      <div>
                        <span className="block text-sm font-medium text-slate-900">{item.name}</span>
                        <span className="text-xs text-slate-500">{item.available ? "Đang hiển thị" : "Đang ẩn"}</span>
                      </div>
                    </div>
                    <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{formatCurrency(item.price)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
 
          {/* Menu Management Tab */}
          <TabsContent value="menu" className="space-y-4">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900">Loại sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nhập tên loại sản phẩm"
                    className="h-11 rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    className="h-11 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
                  >
                    {isCreatingCategory ? "Đang tạo..." : "Tạo loại"}
                  </Button>
                </div>
                {categories.length === 0 ? (
                  <p className="text-sm text-amber-600">Bạn chưa có loại sản phẩm nào. Hãy tạo loại trước khi thêm món.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1.5">
                          <span className="text-sm text-slate-700">{cat.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCategoryId(cat.id)
                              setEditCategoryName(cat.name || "")
                            }}
                            className="h-7 w-7 rounded-full p-0 text-slate-500"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingCategoryId(cat.id)}
                            className="h-7 w-7 rounded-full p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {editingCategoryId && (
                      <form onSubmit={handleEditCategory} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row">
                        <Input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          placeholder="Sửa tên loại sản phẩm"
                          className="h-10 rounded-lg"
                          required
                        />
                        <div className="flex gap-2">
                          <Button type="submit" disabled={isSubmittingCategory || !editCategoryName.trim()} className="h-10 flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 sm:flex-none">
                            {isSubmittingCategory ? "Đang lưu..." : "Lưu"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 flex-1 rounded-lg sm:flex-none"
                            onClick={() => {
                              setEditingCategoryId(null)
                              setEditCategoryName("")
                            }}
                          >
                            Hủy
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
 
            <Dialog open={!!deletingCategoryId} onOpenChange={(open) => !open && setDeletingCategoryId(null)}>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Xác nhận xóa loại sản phẩm</DialogTitle>
                </DialogHeader>
                <p className="mb-2 text-sm text-slate-600">
                  Bạn có chắc muốn xóa loại sản phẩm "{categories.find((cat) => cat.id === deletingCategoryId)?.name}"? Sau khi xóa, các món thuộc loại này sẽ không còn danh mục.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setDeletingCategoryId(null)} disabled={isDeletingCategory}>
                    Hủy
                  </Button>
                  <Button variant="destructive" className="rounded-xl" onClick={handleDeleteCategory} disabled={isDeletingCategory}>
                    {isDeletingCategory ? "Đang xóa..." : "Xóa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
 
            {/* Search + filter + add */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Tìm món..."
                  className="h-11 rounded-xl bg-white pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["Tất cả", ...categories.map(c => c.name)].map((category) => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? "default" : "outline"}
                    size="sm"
                    className={`h-9 shrink-0 whitespace-nowrap rounded-full text-xs ${categoryFilter === category ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white"}`}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              <Button
                className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  if (categories.length === 0) {
                    setMenuError("Bạn cần tạo ít nhất một loại sản phẩm trước khi tạo món")
                    return
                  }
                  setIsAddingItem(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm món
              </Button>
 
              <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Thêm món mới</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateMenuItem} className="space-y-4">
                    <div>
                      <Label htmlFor="item-name">Tên món <span className="text-red-500">*</span></Label>
                      <Input
                        id="item-name"
                        value={formItemName}
                        onChange={(e) => setFormItemName(e.target.value)}
                        placeholder="Nhập tên món"
                        className="mt-1.5 h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-description">Mô tả</Label>
                      <Textarea
                        id="item-description"
                        value={formItemDescription}
                        onChange={(e) => setFormItemDescription(e.target.value)}
                        placeholder="Nhập mô tả"
                        rows={3}
                        className="mt-1.5 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-price">Giá <span className="text-red-500">*</span></Label>
                      <Input
                        id="item-price"
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
                        {imagePreviews.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {imagePreviews.map((preview, idx) => (
                              <div key={idx} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                                <img src={getImageUrl(preview)} alt={`preview-${idx}`} className="h-full w-full object-cover" />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemovePreviewImage(idx)}
                                  className="absolute right-1 top-1 h-6 w-6 rounded-full p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 py-4 text-slate-400 hover:border-emerald-300 hover:text-emerald-600">
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-xs">Chọn một hoặc nhiều ảnh</span>
                          <input type="file" accept="image/*" onChange={handleImageChange} multiple className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="item-category">Danh mục <span className="text-red-500">*</span></Label>
                      <select
                        id="item-category"
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
                      <Switch
                        checked={formItemAvailable}
                        onCheckedChange={setFormItemAvailable}
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <Label className="text-sm font-semibold">Option</Label>
                      <div className="mt-2 space-y-2">
                        <div className="space-y-2">
                          {formItemOptions.map((option, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                              <div className="text-sm">
                                <span className="font-medium">{option.name}</span>
                                {option.required && <span className="ml-1 text-red-500">*</span>}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveOption(idx)}
                                className="h-7 w-7 rounded-full p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2 border-t border-slate-100 pt-2">
                          <Input
                            type="text"
                            value={newOptionName}
                            onChange={(e) => setNewOptionName(e.target.value)}
                            placeholder="Tên option (vd: Size, Topping)"
                            className="h-10 rounded-lg"
                          />
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Bắt buộc chọn</Label>
                            <Switch
                              checked={newOptionRequired}
                              onCheckedChange={setNewOptionRequired}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddOption}
                            className="h-10 w-full rounded-lg"
                          >
                            Thêm Option
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={isSubmittingItem}>
                      {isSubmittingItem ? "Đang tạo..." : "Tạo món"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
 
            {isLoadingMenu ? (
              <p className="text-sm text-slate-500">Đang tải danh sách món...</p>
            ) : menuItems.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có món nào. Hãy tạo món đầu tiên.</p>
            ) : (
              <div>
                {menuError && <p className="mb-3 text-sm text-red-600">{menuError}</p>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredMenuItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`cursor-pointer overflow-hidden rounded-2xl border-slate-200 shadow-sm transition-shadow hover:shadow-md ${!item.available ? "opacity-60" : ""}`}
                      onClick={() => openEditMenuItemDialog(item)}
                    >
                      {item.images && item.images.length > 0 ? (
                        <div className="relative aspect-square w-full bg-slate-100">
                          <img
                            src={getImageUrl(getItemImagePath(item, 0))}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center bg-slate-100">
                          <UtensilsCrossed className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                      <CardContent className="space-y-1.5 p-2.5">
                        <h3 className="line-clamp-2 text-xs font-semibold text-slate-900">{item.name}</h3>
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-emerald-600">{formatCurrency(item.price)}</p>
                          <Badge
                            variant={item.available ? "secondary" : "destructive"}
                            className="h-4 rounded-full px-1.5 text-[10px]"
                          >
                            {item.available ? "Có sẵn" : "Hết"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          {item.options && item.options.length > 0 ? (
                            <span className="text-[10px] text-slate-400">{item.options.length} option</span>
                          ) : <span />}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingItemId(item.id)
                            }}
                            className="h-6 w-6 rounded-full p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
 
            {/* Edit Menu Item Dialog */}
            <Dialog open={isEditingItem} onOpenChange={setIsEditingItem}>
              <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Sửa món</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditMenuItem} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-item-name">Tên món <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-item-name"
                      value={formItemName}
                      onChange={(e) => setFormItemName(e.target.value)}
                      placeholder="Nhập tên món"
                      className="mt-1.5 h-11 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-item-description">Mô tả</Label>
                    <Textarea
                      id="edit-item-description"
                      value={formItemDescription}
                      onChange={(e) => setFormItemDescription(e.target.value)}
                      placeholder="Nhập mô tả"
                      rows={3}
                      className="mt-1.5 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-item-price">Giá <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-item-price"
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
                    <div className="mt-2 space-y-3">
                      {formItemImages.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs text-slate-500">Ảnh hiện tại:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {formItemImages.map((img) => (
                              <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                                <img
                                  src={getImageUrl(img.image)}
                                  alt="menu item"
                                  className="h-full w-full object-cover"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveImage(img.id)}
                                  className="absolute right-1 top-1 h-6 w-6 rounded-full p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {imagePreviews.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs text-slate-500">Ảnh mới:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {imagePreviews.map((preview, idx) => (
                              <div key={idx} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                                <img src={getImageUrl(preview)} alt={`new-${idx}`} className="h-full w-full object-cover" />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemovePreviewImage(idx)}
                                  className="absolute right-1 top-1 h-6 w-6 rounded-full p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 py-4 text-slate-400 hover:border-emerald-300 hover:text-emerald-600">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-xs">Chọn một hoặc nhiều ảnh để thêm</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} multiple className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-item-category">Danh mục <span className="text-red-500">*</span></Label>
                    <select
                      id="edit-item-category"
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
                    <Switch
                      checked={formItemAvailable}
                      onCheckedChange={setFormItemAvailable}
                    />
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <Label className="text-sm font-semibold">Option</Label>
                    <div className="mt-2 space-y-2">
                      <div className="space-y-2">
                        {formItemOptions.map((option, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                            <div className="text-sm">
                              <span className="font-medium">{option.name}</span>
                              {option.required && <span className="ml-1 text-red-500">*</span>}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveOption(idx)}
                              className="h-7 w-7 rounded-full p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 border-t border-slate-100 pt-2">
                        <Input
                          type="text"
                          value={newOptionName}
                          onChange={(e) => setNewOptionName(e.target.value)}
                          placeholder="Tên option"
                          className="h-10 rounded-lg"
                        />
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Bắt buộc chọn</Label>
                          <Switch
                            checked={newOptionRequired}
                            onCheckedChange={setNewOptionRequired}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddOption}
                          className="h-10 w-full rounded-lg"
                        >
                          Thêm Option
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={isSubmittingItem}>
                    {isSubmittingItem ? "Đang cập nhật..." : "Cập nhật"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
 
            {/* Delete Menu Item Confirmation Dialog */}
            <Dialog open={!!deletingItemId} onOpenChange={(open) => !open && setDeletingItemId(null)}>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Xác nhận xóa món</DialogTitle>
                </DialogHeader>
                <p className="mb-2 text-sm text-slate-600">
                  Bạn có chắc chắn muốn xóa món "{menuItems.find((item) => item.id === deletingItemId)?.name}"? Thao tác này không thể hoàn tác.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setDeletingItemId(null)} disabled={isDeletingItem}>
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={handleDeleteMenuItem}
                    disabled={isDeletingItem}
                  >
                    {isDeletingItem ? "Đang xóa..." : "Xóa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
 
          {/* Tables Management Tab */}
          <TabsContent value="tables" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Danh sách bàn ({tables.length})</h2>
                {tableError ? <p className="text-sm text-red-600">{tableError}</p> : null}
              </div>
              <Dialog open={isCreatingTable} onOpenChange={setIsCreatingTable}>
                <DialogTrigger asChild>
                  <Button className="h-10 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Thêm bàn
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
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
 
            {isLoadingTables ? (
              <p className="text-sm text-slate-500">Đang tải danh sách bàn...</p>
            ) : tables.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có bàn nào. Hãy tạo bàn đầu tiên.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {tables.map((table) => (
                  <Card key={table.id} className="rounded-2xl border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                    <CardContent className="p-3 text-center">
                      <div className="mb-2 flex justify-center rounded-xl bg-emerald-50 p-2.5">
                        {table.qrCode ? (
                          <QRCodeSVG value={buildTableMenuUrl(table.qrCode)} size={76} level="H" />
                        ) : (
                          <QrCode className="h-10 w-10 text-emerald-600" />
                        )}
                      </div>
                      <h3 className="mb-1 text-sm font-bold text-slate-900">{table.name || `Bàn ${table.number || ""}`}</h3>
                      <Badge
                        variant={table.status === "occupied" ? "default" : "secondary"}
                        className={`mb-2 h-5 rounded-full text-[10px] ${table.status === "occupied" ? "bg-emerald-600" : ""}`}
                      >
                        {table.status === "occupied" ? "Đang dùng" : "Trống"}
                      </Badge>
                      <p className="truncate text-[11px] text-slate-400">Mã: {table.qrCode}</p>
                      <div className="mt-2 flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(table)}
                          className="h-8 w-8 rounded-full p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingTableId(table.id)}
                          className="h-8 w-8 rounded-full p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
 
            {/* Edit Table Dialog */}
            <Dialog open={isEditingTable} onOpenChange={setIsEditingTable}>
              <DialogContent className="rounded-2xl">
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
 
            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingTableId} onOpenChange={(open) => !open && setDeletingTableId(null)}>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Xác nhận xóa bàn</DialogTitle>
                </DialogHeader>
                <p className="mb-2 text-sm text-slate-600">
                  Bạn có chắc chắn muốn xóa bàn "{tables.find((t) => t.id === deletingTableId)?.name}"? Thao tác này không thể hoàn tác.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setDeletingTableId(null)} disabled={isDeletingTable}>
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={handleDeleteTable}
                    disabled={isDeletingTable}
                  >
                    {isDeletingTable ? "Đang xóa..." : "Xóa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
 
          {/* Staff Accounts Tab */}
          <TabsContent value="staff" className="space-y-4">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900">Tạo tài khoản nhân viên</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStaffAccount} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="staff-name">Họ tên</Label>
                    <Input
                      id="staff-name"
                      value={staffFormName}
                      onChange={(e) => setStaffFormName(e.target.value)}
                      placeholder="Nhập họ tên nhân viên"
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Email</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      value={staffFormEmail}
                      onChange={(e) => setStaffFormEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Mật khẩu</Label>
                    <Input
                      id="staff-password"
                      type="password"
                      value={staffFormPassword}
                      onChange={(e) => setStaffFormPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-phone">Số điện thoại</Label>
                    <Input
                      id="staff-phone"
                      value={staffFormPhone}
                      onChange={(e) => setStaffFormPhone(e.target.value)}
                      placeholder="Ví dụ: 0901234567"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-role">Vai trò</Label>
                    <select
                      id="staff-role"
                      value={staffFormRole}
                      onChange={(e) => setStaffFormRole(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                    >
                      <option value="service">Nhân viên phục vụ</option>
                      <option value="kitchen">Nhân viên bếp</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="staff-address">Địa chỉ</Label>
                    <Textarea
                      id="staff-address"
                      value={staffFormAddress}
                      onChange={(e) => setStaffFormAddress(e.target.value)}
                      placeholder="Nhập địa chỉ nhân viên"
                      rows={3}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <Button type="submit" className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={isCreatingStaffAccount}>
                      {isCreatingStaffAccount ? "Đang tạo..." : "Tạo tài khoản nhân viên"}
                    </Button>
                    {staffAccountError ? <p className="text-sm text-red-600">{staffAccountError}</p> : null}
                    {staffAccountSuccess ? <p className="text-sm text-emerald-600">{staffAccountSuccess}</p> : null}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900">Danh sách nhân viên</CardTitle>
              </CardHeader>
              <CardContent>
                {staffAccounts.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có tài khoản nhân viên nào.</p>
                ) : (
                  <div className="space-y-2">
                    {staffAccounts.map((account) => (
                      <div key={account.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{account.name}</p>
                          <p className="text-xs text-slate-500">{account.email || "Không có email"}</p>
                          <p className="text-xs text-slate-500">
                            {account.phone || "Chưa có số điện thoại"}
                            {account.address ? ` • ${account.address}` : ""}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                        <div className="flex items-center gap-2 md:justify-end">
                          <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            {account.role === "kitchen" ? "bếp" : "phục vụ"}
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
                        <p className="mt-1 text-xs text-slate-500">{account.status || "active"}</p>
                        {account.createdAt ? <p className="mt-1 text-xs text-slate-400">{new Date(account.createdAt).toLocaleDateString("vi-VN")}</p> : null}
                      </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="orders" className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Lịch sử đơn hàng</h2>
            <div className="space-y-2.5">
              {orders.slice(0, 20).map((order) => (
                <Card key={order.id} className="rounded-2xl border-slate-200 shadow-sm">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}