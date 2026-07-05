"use client"

import { useState } from "react"
import { useRequireRole } from "@/lib/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Store, Users, DollarSign, TrendingUp, Plus, Lock, Unlock, Edit, Search } from "lucide-react"
import { mockStores, mockMenuItems } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/format"
import { AppHeader } from "@/components/app-header"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

export default function AdminPage() {
  useRequireRole(["admin"])
  const [stores, setStores] = useState(mockStores)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingStore, setIsAddingStore] = useState(false)

  const activeStores = stores.filter((s) => s.active).length
  const totalRevenue = 1823000000 + 987000000 + 456000000

  const growthData = [
    { month: "T1", revenue: 120 },
    { month: "T2", revenue: 145 },
    { month: "T3", revenue: 132 },
    { month: "T4", revenue: 168 },
    { month: "T5", revenue: 180 },
    { month: "T6", revenue: 195 },
  ]

  const storeRevenueData = [
    { name: "Nhà hàng Phố", revenue: 1823 },
    { name: "Quán Ăn Sài Gòn", revenue: 987 },
    { name: "Bún Chả Hà Nội", revenue: 456 },
  ]

  const toggleStoreStatus = (storeId: string) => {
    setStores((prev) => prev.map((store) => (store.id === storeId ? { ...store, active: !store.active } : store)))
  }

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Quản Trị Hệ Thống" subtitle="Quản lý toàn bộ cửa hàng" />

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-white border rounded-lg h-auto p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-100">
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="stores" className="data-[state=active]:bg-emerald-100">
              Cửa hàng
            </TabsTrigger>
            <TabsTrigger value="accounts" className="data-[state=active]:bg-emerald-100">
              Tài khoản
            </TabsTrigger>
            <TabsTrigger value="menu-overview" className="data-[state=active]:bg-emerald-100">
              Toàn bộ món
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-emerald-100">
              Gói dịch vụ
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Tổng cửa hàng</CardTitle>
                  <Store className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stores.length}</div>
                  <p className="text-xs text-emerald-600 mt-1">{activeStores} đang hoạt động</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Tổng chủ quán</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stores.length}</div>
                  <p className="text-xs text-blue-600 mt-1">+3 tháng này</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Doanh thu tổng</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
                  <p className="text-xs text-gray-500 mt-1">Tất cả cửa hàng</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Tăng trưởng</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">+23%</div>
                  <p className="text-xs text-orange-600 mt-1">So với tháng trước</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Tăng trưởng doanh thu</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Doanh thu theo cửa hàng (triệu)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={storeRevenueData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis dataKey="name" type="category" stroke="#6b7280" width={150} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 max-w-md min-w-[250px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Tìm cửa hàng..."
                  className="pl-10 bg-gray-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog open={isAddingStore} onOpenChange={setIsAddingStore}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm cửa hàng
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm cửa hàng mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Tên cửa hàng</Label>
                      <Input placeholder="Nhập tên cửa hàng" className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Địa chỉ</Label>
                      <Input placeholder="Nhập địa chỉ" className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Email chủ quán</Label>
                      <Input type="email" placeholder="email@example.com" className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Gói dịch vụ</Label>
                      <Input placeholder="Cơ bản / Nâng cao / Premium" className="bg-gray-50" />
                    </div>
                    <Button className="w-full">Tạo cửa hàng</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Tên cửa hàng</TableHead>
                      <TableHead className="font-semibold">Địa chỉ</TableHead>
                      <TableHead className="font-semibold">Trạng thái</TableHead>
                      <TableHead className="font-semibold">Hạn sử dụng</TableHead>
                      <TableHead className="font-semibold">Doanh thu</TableHead>
                      <TableHead className="text-right font-semibold">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium text-gray-900">{store.name}</TableCell>
                        <TableCell className="text-gray-600">{store.address}</TableCell>
                        <TableCell>
                          <Badge variant={store.active ? "default" : "secondary"}>
                            {store.active ? "Hoạt động" : "Tạm khóa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              store.subscriptionExpiry > new Date() ? "text-gray-900" : "text-red-600 font-medium"
                            }
                          >
                            {formatDate(store.subscriptionExpiry)}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {store.id === "store1"
                            ? formatCurrency(1823000000)
                            : store.id === "store2"
                              ? formatCurrency(987000000)
                              : formatCurrency(456000000)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => toggleStoreStatus(store.id)}
                            >
                              {store.active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách tài khoản chủ quán</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tạo tài khoản
              </Button>
            </div>

            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Tên chủ quán</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Cửa hàng</TableHead>
                      <TableHead className="font-semibold">Ngày tạo</TableHead>
                      <TableHead className="text-right font-semibold">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores.map((store) => (
                      <TableRow key={store.ownerId}>
                        <TableCell className="font-mono text-xs text-gray-600">{store.ownerId}</TableCell>
                        <TableCell className="font-medium text-gray-900">Chủ quán {store.id}</TableCell>
                        <TableCell className="text-gray-600">owner@{store.id}.com</TableCell>
                        <TableCell className="text-gray-900">{store.name}</TableCell>
                        <TableCell className="text-gray-600">{formatDate(new Date(2024, 0, 15))}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Menu Overview Tab */}
          <TabsContent value="menu-overview" className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Toàn bộ món ăn ({stores.length * mockMenuItems.length} món)
            </h2>

            <div className="space-y-4">
              {stores.map((store) => (
                <Card key={store.id} className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-gray-900">
                      <span>{store.name}</span>
                      <Badge variant="outline">{mockMenuItems.length} món</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {mockMenuItems.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                            </div>
                            <p className="text-sm font-semibold text-emerald-600">{formatCurrency(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Quản lý gói dịch vụ</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Gói Cơ Bản</CardTitle>
                  <p className="text-3xl font-bold mt-2 text-gray-900">299.000đ</p>
                  <p className="text-sm text-gray-500">/ tháng</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-700">✓ Tối đa 10 bàn</div>
                  <div className="text-sm text-gray-700">✓ 50 món ăn</div>
                  <div className="text-sm text-gray-700">✓ Báo cáo cơ bản</div>
                  <div className="text-sm text-gray-400">✗ Tích hợp thanh toán</div>
                  <Badge className="mt-4 bg-blue-100 text-blue-700">3 cửa hàng đang dùng</Badge>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-500 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-gray-900">Gói Nâng Cao</CardTitle>
                    <Badge className="bg-emerald-500">Phổ biến</Badge>
                  </div>
                  <p className="text-3xl font-bold mt-2 text-gray-900">599.000đ</p>
                  <p className="text-sm text-gray-500">/ tháng</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-700">✓ Tối đa 30 bàn</div>
                  <div className="text-sm text-gray-700">✓ Không giới hạn món</div>
                  <div className="text-sm text-gray-700">✓ Báo cáo chi tiết</div>
                  <div className="text-sm text-gray-700">✓ Tích hợp thanh toán</div>
                  <Badge className="mt-4 bg-emerald-100 text-emerald-700">1 cửa hàng đang dùng</Badge>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Gói Premium</CardTitle>
                  <p className="text-3xl font-bold mt-2 text-gray-900">999.000đ</p>
                  <p className="text-sm text-gray-500">/ tháng</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-700">✓ Không giới hạn bàn</div>
                  <div className="text-sm text-gray-700">✓ Không giới hạn món</div>
                  <div className="text-sm text-gray-700">✓ Báo cáo nâng cao + AI</div>
                  <div className="text-sm text-gray-700">✓ Tích hợp đa nền tảng</div>
                  <Badge className="mt-4 bg-purple-100 text-purple-700">0 cửa hàng đang dùng</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
