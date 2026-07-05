"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAuthUser, clearAuth } from "./auth"

export function useRequireRole(allowedRoles: string[]) {
  const router = useRouter()
  useEffect(() => {
    const user = getAuthUser()
    if (!user) {
      router.replace("/auth/login")
      return
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // redirect to a proper landing based on role
      const role = user.role
      const mapping: Record<string, string> = {
        admin: "/admin",
        manager: "/manager",
        service: "/service",
        kitchen: "/kitchen",
        customer: "/",
      }
      const dest = mapping[role] || "/"
      // if current path already equals dest do nothing, else redirect
      router.replace(dest)
    }
  }, [allowedRoles, router])
}

export function useLogout() {
  const router = useRouter()
  return () => {
    clearAuth()
    router.replace("/auth/login")
  }
}
