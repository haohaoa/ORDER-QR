"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { login as apiLogin } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiLogin(email, password)
      const role = data.user?.role
      if (role === 'admin') {
        router.push('/admin')
      } else if (role === 'manager') {
        router.push('/manager')
      } else if (role === 'service') {
        router.push('/service')
      } else if (role === 'kitchen') {
        router.push('/kitchen')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-bold mb-4">Đăng nhập</h2>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <div className="mb-3">
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="mb-4">
          <Label>Mật khẩu</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  )
}
