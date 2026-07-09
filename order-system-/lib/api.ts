import { getAuthToken } from './auth'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

function getAuthHeaders(extra: Record<string, string> = {}) {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

export const getImageUrl = (image?: string) => {
  if (!image) return ""
  if (image.startsWith("data:") || image.startsWith("blob:") || image.startsWith("http")) {
    return image
  }
  return `${API_BASE_URL}/uploads/${image}`
}

export function getFullImageUrl(path?: string) {
  return getImageUrl(path)
}

export async function getMenuItems() {
  const res = await fetch(`${API_BASE_URL}/menu-items`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`Get menu items failed: ${res.status}`)
  return res.json()
}

export async function createMenuItem(payload: { name: string; description?: string; price: number; available: boolean; categoryId?: string; options?: Array<{ name: string; required?: boolean; isMultiple?: boolean; choices?: Array<{ name: string; price?: number }>; price?: number }> }) {
  const res = await fetch(`${API_BASE_URL}/menu-items`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Create menu item failed: ${res.status}`)
  }
  return res.json()
}

export async function updateMenuItem(id: string, payload: { name?: string; description?: string; price?: number; available?: boolean; categoryId?: string; options?: Array<{ name: string; required?: boolean; isMultiple?: boolean; choices?: Array<{ name: string; price?: number }>; price?: number }> }) {
  const res = await fetch(`${API_BASE_URL}/menu-items/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Update menu item failed: ${res.status}`)
  }
  return res.json()
}

export async function deleteMenuItem(id: string) {
  const res = await fetch(`${API_BASE_URL}/menu-items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Delete menu item failed: ${res.status}`)
  }
  return res.json()
}

export async function addMenuItemOption(menuId: string, payload: { name: string; required: boolean }) {
  const res = await fetch(`${API_BASE_URL}/menu-items/${menuId}/options`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Add menu item option failed: ${res.status}`)
  }
  return res.json()
}

export async function getCategories() {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`Get categories failed: ${res.status}`)
  return res.json()
}

export async function createCategory(payload: { name: string; sortOrder?: number }) {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Create category failed: ${res.status}`)
  }
  return res.json()
}

export async function updateCategory(id: string, payload: { name?: string; sortOrder?: number }) {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Update category failed: ${res.status}`)
  }
  return res.json()
}

export async function createOrderByQrCode(qrCode: string, payload: {
  status: 'pending' | 'staffConfirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  totalAmount: number
  items?: Array<{
    menuItemId: string
    name: string
    price: number
    quantity: number
    note?: string
    details?: any
    status: 'pending' | 'staffConfirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'
  }>
}) {
  const res = await fetch(`${API_BASE_URL}/orders/by-qrcode/${encodeURIComponent(qrCode)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Create order failed: ${res.status}`)
  }
  return res.json()
}

export async function getOrdersByQrCode(qrCode: string) {
  const res = await fetch(`${API_BASE_URL}/orders/by-qrcode/${encodeURIComponent(qrCode)}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Get orders failed: ${res.status}`)
  }
  return res.json()
}

export async function getOrders() {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Get orders failed: ${res.status}`)
  }
  return res.json()
}

export async function getKitchenQueue() {
  const res = await fetch(`${API_BASE_URL}/orders/kitchen-queue`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Get kitchen queue failed: ${res.status}`)
  }
  return res.json()
}

export async function updateOrder(id: string, payload: {
  status?: 'pending' | 'staffConfirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  totalAmount?: number
  tableId?: string
}) {
  const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Update order failed: ${res.status}`)
  }
  return res.json()
}

export async function updateOrderItem(orderId: string, itemId: string, payload: { quantity?: number; note?: string; details?: any }) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Update order item failed: ${res.status}`)
  }
  return res.json()
}

export async function deleteOrderItem(orderId: string, itemId: string) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Delete order item failed: ${res.status}`)
  }
  return res.json()
}

export async function confirmOrderItem(orderId: string, itemId: string) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}/confirm`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Confirm order item failed: ${res.status}`)
  }
  return res.json()
}

export async function updateOrderItemStatusByApi(orderId: string, itemId: string, status: 'staffConfirmed' | 'preparing' | 'ready' | 'served' | 'cancelled') {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Update order item status failed: ${res.status}`)
  }
  return res.json()
}

export async function deleteCategory(id: string) {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Delete category failed: ${res.status}`)
  }
  return res.json()
}

export async function uploadMenuImage(menuId: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API_BASE_URL}/menu-items/${menuId}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: fd,
  })
  if (!res.ok) throw new Error(`Upload image failed: ${res.status}`)
  return res.json()
}

export async function deleteMenuItemImage(menuId: string, imageId: number) {
  const res = await fetch(`${API_BASE_URL}/menu-items/${menuId}/images/${imageId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Delete image failed: ${res.status}`)
  }
  return res.json()
}

export async function getStaffAccounts() {
  const res = await fetch(`${API_BASE_URL}/staff-accounts`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Get staff accounts failed: ${res.status}`)
  }
  return res.json()
}

export async function createStaffAccount(payload: { name: string; email: string; password: string; phone?: string; address?: string; role?: string }) {
  const res = await fetch(`${API_BASE_URL}/staff-accounts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Create staff account failed: ${res.status}`)
  }
  return res.json()
}

export async function deleteStaffAccount(id: string) {
  const res = await fetch(`${API_BASE_URL}/staff-accounts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Delete staff account failed: ${res.status}`)
  }
  return res.json()
}

export async function getTables() {
  const res = await fetch(`${API_BASE_URL}/tables`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`Get tables failed: ${res.status}`)
  return res.json()
}

export async function createTable(payload: { name: string; qrCode?: string; status?: string }) {
  const res = await fetch(`${API_BASE_URL}/tables`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Create table failed: ${res.status}`)
  }
  return res.json()
}

export async function updateTable(id: string, payload: { name?: string; qrCode?: string; status?: string }) {
  const res = await fetch(`${API_BASE_URL}/tables/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Update table failed: ${res.status}`)
  }
  return res.json()
}

export async function deleteTable(id: string) {
  const res = await fetch(`${API_BASE_URL}/tables/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Delete table failed: ${res.status}`)
  }
  return res.json()
}
