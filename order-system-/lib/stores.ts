import { create } from "zustand"

export type OrderStatus = "pending" | "ready" | "delivered" | "completed" | "payment_requested"

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

export interface OrderItem {
  id: string
  name: string
  image: string
  quantity: number
  basePrice: number
  selectedSize?: Size
  selectedToppings: Topping[]
  notes?: string
}

export interface Order {
  id: string
  tableNumber: number
  items: OrderItem[]
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
  assignedTo?: string
  paymentRequested?: boolean
  paymentCompletedAt?: Date
}

interface StoreState {
  orders: Order[]
  updateOrderStatus: (orderId: string, status: OrderStatus, assignedTo?: string) => void
  getOrdersByStatus: (status: OrderStatus) => Order[]
  getOrdersByTable: (tableNumber: number) => Order[]
  requestPayment: (tableNumber: number) => void
  completePayment: (tableNumber: number) => void
  getTables: () => number[]
  getTableStatus: (tableNumber: number) => {
    hasOrders: boolean
    paymentRequested: boolean
    totalAmount: number
    orders: Order[]
  }
}

// Mock data
const mockOrders: Order[] = [
  {
    id: "1",
    tableNumber: 5,
    items: [
      {
        id: "item1",
        name: "Cà phê sữa đá",
        image: "/vietnamese-iced-coffee.png",
        quantity: 2,
        basePrice: 25000,
        selectedSize: { id: "l", name: "Lớn", price: 5000 },
        selectedToppings: [{ id: "t1", name: "Thạch", price: 5000 }],
      },
      {
        id: "item2",
        name: "Bánh mì thịt",
        image: "/vietnamese-banh-mi-sandwich.jpg",
        quantity: 1,
        basePrice: 30000,
        selectedToppings: [],
      },
    ],
    status: "ready",
    createdAt: new Date(Date.now() - 15 * 60000),
    updatedAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "2",
    tableNumber: 3,
    items: [
      {
        id: "item3",
        name: "Phở bò",
        image: "/vietnamese-pho-beef-noodle-soup.jpg",
        quantity: 2,
        basePrice: 50000,
        selectedSize: { id: "l", name: "Lớn", price: 10000 },
        selectedToppings: [{ id: "t2", name: "Thêm thịt", price: 15000 }],
      },
    ],
    status: "delivered",
    createdAt: new Date(Date.now() - 25 * 60000),
    updatedAt: new Date(Date.now() - 10 * 60000),
    assignedTo: "NV01",
  },
  {
    id: "3",
    tableNumber: 8,
    items: [
      {
        id: "item4",
        name: "Trà sữa trân châu",
        image: "/bubble-milk-tea-with-boba.jpg",
        quantity: 3,
        basePrice: 35000,
        selectedSize: { id: "m", name: "Vừa", price: 0 },
        selectedToppings: [
          { id: "t3", name: "Trân châu", price: 5000 },
          { id: "t4", name: "Thạch dừa", price: 5000 },
        ],
      },
    ],
    status: "payment_requested",
    createdAt: new Date(Date.now() - 45 * 60000),
    updatedAt: new Date(Date.now() - 2 * 60000),
    paymentRequested: true,
  },
]

export const useStore = create<StoreState>((set, get) => ({
  orders: mockOrders,

  updateOrderStatus: (orderId, status, assignedTo) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              updatedAt: new Date(),
              ...(assignedTo && { assignedTo }),
            }
          : order,
      ),
    })),

  getOrdersByStatus: (status) => get().orders.filter((order) => order.status === status),

  getOrdersByTable: (tableNumber) => get().orders.filter((order) => order.tableNumber === tableNumber),

  requestPayment: (tableNumber) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.tableNumber === tableNumber && order.status !== "completed"
          ? {
              ...order,
              status: "payment_requested" as OrderStatus,
              paymentRequested: true,
              updatedAt: new Date(),
            }
          : order,
      ),
    })),

  completePayment: (tableNumber) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.tableNumber === tableNumber && order.paymentRequested
          ? {
              ...order,
              status: "completed" as OrderStatus,
              paymentCompletedAt: new Date(),
              updatedAt: new Date(),
            }
          : order,
      ),
    })),

  getTables: () => {
    const tables = new Set<number>()
    get().orders.forEach((order) => {
      if (order.status !== "completed") {
        tables.add(order.tableNumber)
      }
    })
    return Array.from(tables).sort((a, b) => a - b)
  },

  getTableStatus: (tableNumber) => {
    const orders = get().orders.filter((order) => order.tableNumber === tableNumber && order.status !== "completed")

    const hasOrders = orders.length > 0
    const paymentRequested = orders.some((order) => order.paymentRequested)

    const totalAmount = orders.reduce((total, order) => {
      const orderTotal = order.items.reduce((sum, item) => {
        const sizePrice = item.selectedSize?.price || 0
        const toppingsPrice = item.selectedToppings.reduce((t, topping) => t + topping.price, 0)
        return sum + (item.basePrice + sizePrice + toppingsPrice) * item.quantity
      }, 0)
      return total + orderTotal
    }, 0)

    return { hasOrders, paymentRequested, totalAmount, orders }
  },
}))
