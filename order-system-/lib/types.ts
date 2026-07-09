export type OrderStatus = "pending" | "staffConfirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled"


export type UserRole = "customer" | "kitchen" | "service" | "manager" | "admin"

export interface MenuOption {
  id?: string
  name: string
  required?: boolean
  isMultiple?: boolean
  price?: number
  choices?: Array<{ name: string; price?: number }>
}

export interface MenuItemImage {
  id?: number | string
  menuId?: string
  image: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string | { id?: string; name?: string }
  image: string
  images?: Array<MenuItemImage | string>
  available: boolean
  createdAt?: string
  options?: MenuOption[]
  selectedOptions?: MenuOption[]
  toppings?: Topping[]
  sizes?: Size[]
}

export interface Topping {
  id: string
  name: string
  price: number
}

export interface Size {
  id: string
  name: string
  price: number
}

export interface Category {
  id: string
  name: string
  sortOrder?: number
  userId?: string | null
}

export interface CartItem extends MenuItem {
  cartItemId?: string
  quantity: number
  selectedToppings: Topping[]
  selectedSize?: Size // Added selected size
  notes: string
  details?: any
  status?: OrderStatus // Added status field for individual item tracking in orders
  cancelReason?: string // Added cancel reason
}

export interface Order {
  id: string
  storeId: string
  storeName: string
  tableNumber: string
  items: CartItem[] // Keep CartItem for consistency
  status: OrderStatus
  totalAmount: number
  createdAt: Date
  updatedAt: Date
  assignedTo?: string
  cancelReason?: string // Added cancel reason
  isPaid?: boolean // Added payment status
}


// export interface OrderItem {
//   menuItem: MenuItem
//   quantity: number
//   selectedToppings: Topping[]
//   selectedSize?: Size // Added selected size to order item
//   notes: string
// }

export interface Table {
  id: string
  number?: string
  name?: string
  qrCode: string
  storeId?: string
  active?: boolean
  status?: string
}

export interface Store {
  id: string
  name: string
  ownerId: string
  address: string
  active: boolean
  subscriptionExpiry: Date
}

export interface DashboardStats {
  todayRevenue: number
  monthRevenue: number
  yearRevenue: number
  todayOrders: number
  popularItems: { name: string; count: number }[]
}
