"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { CartItem, Order, OrderStatus } from "./types"
import { mockOrders } from "./mock-data"

interface StoreContextType {
  cart: CartItem[]
  orders: Order[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void
  clearCart: () => void
  submitOrder: (tableNumber: string) => string // Return order ID
  updateOrderStatus: (orderId: string, status: OrderStatus, assignedTo?: string, cancelReason?: string) => void // Added cancelReason
  updateOrderItemStatus: (orderId: string, itemIndex: number, status: OrderStatus, cancelReason?: string) => void // Added function to update individual order item status
  getOrdersByStatus: (status: OrderStatus) => Order[]
  getOrdersByTable: (tableNumber: string) => Order[] // Added
  markOrderAsPaid: (orderId: string) => void // Added payment tracking
  removeItemFromOrder: (orderId: string, itemIndex: number) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>(mockOrders)

  const getCartItemKey = (item: CartItem) =>
    JSON.stringify({
      id: item.id,
      selectedOptions: item.selectedOptions ?? [],
      selectedToppings: item.selectedToppings ?? [],
      selectedSize: item.selectedSize
        ? { id: item.selectedSize.id, name: item.selectedSize.name, price: item.selectedSize.price }
        : null,
      notes: item.notes || "",
    })

  const getCartItemId = (item: CartItem) =>
    item.cartItemId ||
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const itemKey = getCartItemKey(item)
      const existingIndex = prev.findIndex((i) => getCartItemKey(i) === itemKey)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex].quantity += item.quantity
        return updated
      }
      return [
        ...prev,
        {
          ...item,
          cartItemId: item.cartItemId || getCartItemId(item),
        },
      ]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          item.cartItemId !== itemId && (item.cartItemId !== undefined || item.id !== itemId),
      ),
    )
  }

  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) => {
        const matchesCartId = item.cartItemId !== undefined && item.cartItemId === itemId
        const matchesFallbackId = item.cartItemId === undefined && item.id === itemId
        return matchesCartId || matchesFallbackId ? { ...item, ...updates } : item
      }),
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const submitOrder = (tableNumber: string) => {
    const persistedItems = cart.map((item) => ({
      ...item,
      cartItemId: item.cartItemId || getCartItemId(item),
      status: item.status ?? "pending",
    }))

    const newOrder: Order = {
      id: `ORD${String(orders.length + 1).padStart(3, "0")}`,
      storeId: "store1",
      storeName: "Nhà hàng Phố",
      tableNumber,
      items: persistedItems,
      status: "pending",
      totalAmount: cart.reduce((sum, item) => {
        const toppingTotal = item.selectedToppings.reduce((t, topping) => t + topping.price, 0)
        const sizePrice = item.selectedSize?.price || 0
        return sum + (item.price + toppingTotal + sizePrice) * item.quantity
      }, 0),
      createdAt: new Date(),
      updatedAt: new Date(),
      isPaid: false, // Initialize as unpaid
    }
    setOrders((prev) => [newOrder, ...prev])
    clearCart()
    return newOrder.id // Return order ID
  }

  const updateOrderStatus = (orderId: string, status: OrderStatus, assignedTo?: string, cancelReason?: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date(), assignedTo, cancelReason } // Added cancelReason
          : order,
      ),
    )
  }

  const updateOrderItemStatus = (orderId: string, itemIndex: number, status: OrderStatus, cancelReason?: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updatedItems = [...order.items]
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            status,
            cancelReason,
          }

          // Determine overall order status based on items
          const allItemsCancelled = updatedItems.every((item) => item.status === "cancelled")
          const allItemsReady = updatedItems.every((item) => item.status === "ready" || item.status === "cancelled")
          const anyItemPreparing = updatedItems.some((item) => item.status === "preparing")

          let orderStatus: OrderStatus = order.status
          if (allItemsCancelled) {
            orderStatus = "cancelled"
          } else if (allItemsReady) {
            orderStatus = "ready"
          } else if (anyItemPreparing) {
            orderStatus = "preparing"
          }

          return {
            ...order,
            items: updatedItems,
            status: orderStatus,
            updatedAt: new Date(),
          }
        }
        return order
      }),
    )
  }

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status)
  }

  const getOrdersByTable = (tableNumber: string) => {
    return orders.filter((order) => order.tableNumber === tableNumber && !order.isPaid)
  }

  const markOrderAsPaid = (orderId: string) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, isPaid: true } : order)))
  }
  const removeItemFromOrder = (orderId: string, itemIndex: number) => {
  setOrders((prev) =>
    prev.map((order) => {
      if (order.id !== orderId) return order

      const updatedItems = order.items.filter((_, idx) => idx !== itemIndex)

      // Nếu xóa hết món → hủy đơn
      const newStatus: OrderStatus =
        updatedItems.length === 0 ? "cancelled" : order.status

      return {
        ...order,
        items: updatedItems,
        status: newStatus,
        updatedAt: new Date(),
      }
    }),
  )
}

  return (
    <StoreContext.Provider
      value={{
        cart,
        orders,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        submitOrder,
        updateOrderStatus,
        updateOrderItemStatus,
        getOrdersByStatus,
        getOrdersByTable,
        markOrderAsPaid,
        removeItemFromOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used within StoreProvider")
  }
  return context
}
