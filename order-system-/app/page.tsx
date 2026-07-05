"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, ChefHat, UserCircle, LayoutDashboard, Shield } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-balance">Hệ Thống Đặt Món QR Code</h1>
          <p className="text-lg text-muted-foreground text-pretty">Giải pháp quản lý nhà hàng thông minh và hiện đại</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/menu/B05" className="group">
            <Card className="h-full transition-all hover:border-primary hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold">Khách Hàng</h2>
                  <p className="text-sm text-muted-foreground">Quét QR để xem menu và đặt món</p>
                </div>
                <Button className="mt-auto w-full bg-transparent" variant="outline">
                  Truy cập menu
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/kitchen" className="group">
            <Card className="h-full transition-all hover:border-primary hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold">Nhân Viên Bếp</h2>
                  <p className="text-sm text-muted-foreground">Nhận và xử lý đơn hàng từ khách</p>
                </div>
                <Button className="mt-auto w-full bg-transparent" variant="outline">
                  Vào bếp
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/service" className="group">
            <Card className="h-full transition-all hover:border-primary hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                  <UserCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold">Nhân Viên Phục Vụ</h2>
                  <p className="text-sm text-muted-foreground">Mang món từ bếp đến bàn khách</p>
                </div>
                <Button className="mt-auto w-full bg-transparent" variant="outline">
                  Vào phục vụ
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/manager" className="group">
            <Card className="h-full transition-all hover:border-primary hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                  <LayoutDashboard className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold">Quản Lý Cửa Hàng</h2>
                  <p className="text-sm text-muted-foreground">Dashboard và quản lý nhà hàng</p>
                </div>
                <Button className="mt-auto w-full bg-transparent" variant="outline">
                  Vào quản lý
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin" className="group">
            <Card className="h-full transition-all hover:border-primary hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold">Quản Trị Hệ Thống</h2>
                  <p className="text-sm text-muted-foreground">Quản lý toàn bộ cửa hàng và chủ quán</p>
                </div>
                <Button className="mt-auto w-full bg-transparent" variant="outline">
                  Vào admin
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
