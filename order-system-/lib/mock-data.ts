import type { MenuItem, Order, Table, Store, DashboardStats } from "./types"

export const mockMenuItems: MenuItem[] = [
  {
    id: "1",
    name: "Phở Bò Đặc Biệt",
    description: "Phở bò truyền thống với thịt bò tái, nạm, gầu, gân",
    price: 65000,
    category: "Món chính",
    image: "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
    images: [
      "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
      "/pho-bo-bowl-top-view.jpg",
      "/pho-bo-ingredients.jpg",
    ],
    available: true,
    toppings: [
      { id: "t1", name: "Thêm thịt bò", price: 20000 },
      { id: "t2", name: "Thêm trứng", price: 10000 },
    ],
  },
  {
    id: "2",
    name: "Bún Chả Hà Nội",
    description: "Bún chả với thịt nướng than hoa, chả viên",
    price: 55000,
    category: "Món chính",
    image: "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
    images: [
      "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
      "/bun-cha-hanoi-grilled-pork.jpg",
    ],
    available: true,
  },
  {
    id: "3",
    name: "Cơm Tấm Sườn Bì",
    description: "Cơm tấm với sườn nướng, bì, chả trứng",
    price: 50000,
    category: "Món chính",
    image: "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
    images: [
      "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
      "/com-tam-broken-rice.jpg",
    ],
    available: true,
  },
  {
    id: "4",
    name: "Gỏi Cuốn Tôm Thịt",
    description: "Gỏi cuốn tươi với tôm, thịt, rau sống",
    price: 35000,
    category: "Khai vị",
    image: "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
    images: [
      "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
      "/fresh-spring-rolls-vietnamese.jpg",
    ],
    available: true,
  },
  {
    id: "5",
    name: "Chả Giò Rế",
    description: "Chả giò chiên giòn nhân thịt, rau củ",
    price: 40000,
    category: "Khai vị",
    image: "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
    images: [
      "https://cellphones.com.vn/sforum/wp-content/uploads/2023/08/mon-ngon-voi-muc-2.jpg",
      "/fried-spring-rolls.jpg",
    ],
    available: true,
  },
  {
    id: "6",
    name: "Trà Đá",
    description: "Trà đá mát lạnh",
    price: 5000,
    category: "Đồ uống",
    image: "/vietnamese-iced-tea.jpg",
    images: ["/vietnamese-iced-tea-glass.jpg"],
    available: true,
    sizes: [
      { id: "s1", name: "Nhỏ", price: 0 },
      { id: "s2", name: "Vừa", price: 5000 },
      { id: "s3", name: "Lớn", price: 10000 },
    ],
  },
  {
    id: "7",
    name: "Cà Phê Sữa Đá",
    description: "Cà phê phin truyền thống pha sữa đá",
    price: 25000,
    category: "Đồ uống",
    image: "/vietnamese-iced-coffee.jpg",
    images: ["/vietnamese-iced-coffee-glass.jpg", "/vietnamese-coffee-phin-filter.jpg"],
    available: true,
    sizes: [
      { id: "s1", name: "Nhỏ", price: 0 },
      { id: "s2", name: "Vừa", price: 5000 },
      { id: "s3", name: "Lớn", price: 10000 },
    ],
  },
  {
    id: "8",
    name: "Nước Dừa Tươi",
    description: "Nước dừa tươi mát lạnh",
    price: 20000,
    category: "Đồ uống",
    image: "/fresh-coconut-water.jpg",
    images: ["/fresh-coconut-drink.jpg"],
    available: true,
    sizes: [
      { id: "s1", name: "Nhỏ", price: 0 },
      { id: "s2", name: "Vừa", price: 5000 },
    ],
  },
  {
    id: "9",
    name: "Trà Sữa Trân Châu",
    description: "Trà sữa Đài Loan với trân châu đen",
    price: 35000,
    category: "Đồ uống",
    image: "/bubble-tea-boba.jpg",
    images: ["/bubble-tea-with-tapioca-pearls.jpg", "/placeholder.svg?height=300&width=400"],
    available: true,
    sizes: [
      { id: "s1", name: "Vừa", price: 0 },
      { id: "s2", name: "Lớn", price: 10000 },
    ],
    toppings: [
      { id: "t3", name: "Thêm trân châu", price: 5000 },
      { id: "t4", name: "Thạch dừa", price: 5000 },
      { id: "t5", name: "Thạch cà phê", price: 5000 },
    ],
  },
]

export const mockOrders: Order[] = [
  {
    id: "ORD001",
    storeId: "store1",
    storeName: "Nhà hàng Phố",
    tableNumber: "B05",
    items: [
      {
        ...mockMenuItems[0],
        quantity: 2,
        selectedToppings: [{ id: "t1", name: "Thêm thịt bò", price: 20000 }],
        notes: "Ít hành",
      },
      {
        ...mockMenuItems[6],
        quantity: 2,
        selectedToppings: [],
        notes: "",
      },
    ],
    status: "pending",
    totalAmount: 210000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "ORD002",
    storeId: "store1",
    storeName: "Nhà hàng Phố",
    tableNumber: "B03",
    items: [
      {
        ...mockMenuItems[1],
        quantity: 1,
        selectedToppings: [],
        notes: "",
      },
    ],
    status: "preparing",
    totalAmount: 55000,
    createdAt: new Date(Date.now() - 600000),
    updatedAt: new Date(),
  },
  {
    id: "ORD003",
    storeId: "store1",
    storeName: "Nhà hàng Phố",
    tableNumber: "B12",
    items: [
      {
        ...mockMenuItems[2],
        quantity: 3,
        selectedToppings: [],
        notes: "",
      },
      {
        ...mockMenuItems[7],
        quantity: 3,
        selectedToppings: [],
        notes: "",
      },
    ],
    status: "ready",
    totalAmount: 210000,
    createdAt: new Date(Date.now() - 1200000),
    updatedAt: new Date(),
  },
]

export const mockTables: Table[] = Array.from({ length: 20 }, (_, i) => ({
  id: `table-${i + 1}`,
  number: `B${String(i + 1).padStart(2, "0")}`,
  qrCode: `QR-TABLE-${i + 1}`,
  storeId: "store1",
  active: true,
}))

export const mockStores: Store[] = [
  {
    id: "store1",
    name: "Nhà hàng Phố Cổ",
    ownerId: "owner1",
    address: "123 Phố Huế, Hà Nội",
    active: true,
    subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "store2",
    name: "Quán Ăn Sài Gòn",
    ownerId: "owner2",
    address: "456 Nguyễn Huệ, TP.HCM",
    active: true,
    subscriptionExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: "store3",
    name: "Bún Chả Hà Nội",
    ownerId: "owner3",
    address: "789 Bà Triệu, Hà Nội",
    active: false,
    subscriptionExpiry: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
]

export const mockDashboardStats: DashboardStats = {
  todayRevenue: 5420000,
  monthRevenue: 145300000,
  yearRevenue: 1823000000,
  todayOrders: 47,
  popularItems: [
    { name: "Phở Bò Đặc Biệt", count: 123 },
    { name: "Bún Chả Hà Nội", count: 98 },
    { name: "Cơm Tấm Sườn Bì", count: 87 },
    { name: "Cà Phê Sữa Đá", count: 156 },
    { name: "Gỏi Cuốn Tôm Thịt", count: 65 },
  ],
}
