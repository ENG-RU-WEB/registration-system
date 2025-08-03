'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcryptjs'
import Image from 'next/image'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('⏳ กำลังตรวจสอบ...')

    const cleanedUsername = username.trim()
    const cleanedPassword = password.trim()

    // 1️⃣ ดึงข้อมูลจาก Supabase ด้วย username
    const { data, error } = await supabase
      .from('authentication')
      .select('*')
      .eq('username', cleanedUsername)
      .maybeSingle()

    if (error || !data) {
      setMessage('❌ ไม่พบผู้ใช้งานนี้')
      return
    }

    // 2️⃣ เปรียบเทียบรหัสผ่านที่กรอกกับ hashed password
    const isValid = await bcrypt.compare(cleanedPassword, data.password)

    if (!isValid) {
      setMessage('❌ รหัสผ่านไม่ถูกต้อง')
      return
    }

    // 3️⃣ สำเร็จ: บันทึกข้อมูลและเปลี่ยนหน้า
    localStorage.setItem('username', data.username)
    localStorage.setItem('role', data.role)

    if (data.role === 'student') {
      router.push('/student')
    } else if (data.role === 'finance') {
      router.push('/finance')
    } else if (data.role === 'service') {
      router.push('/service')
    } else if (data.role === 'advisor') {
      router.push('/advisor/graduation')  
    } else if (data.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="Logo" width={120} height={120} />
        </div>
        <h2 className="text-center text-2xl font-bold text-[#7c0a0a] mb-6">ระบบลงทะเบียน</h2>

        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
              <input
                type="text"
                className="mt-1 w-full border-0 border-b-2 border-gray-300 focus:border-[#7c0a0a] focus:outline-none focus:ring-0 px-0 py-1 bg-transparent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <input
                type="password"
                className="mt-1 w-full border-0 border-b-2 border-gray-300 focus:border-[#7c0a0a] focus:outline-none focus:ring-0 px-0 py-1 bg-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-center items-center text-sm text-gray-500 mt-4 gap-4">
            <button type="button" className="hover:text-[#7c0a0a] transition-colors">เปลี่ยนรหัส</button>
            <span className="text-gray-400">|</span>
            <button type="button" className="hover:text-[#7c0a0a] transition-colors">ลืมรหัสผ่าน</button>
          </div>

          <button
            type="submit"
            className="mt-6 w-full bg-[#b06b6b] hover:bg-[#7c0a0a] text-white font-bold py-2 rounded-md transition-colors"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-red-600">{message}</p>
        )}
      </div>
    </div>
  )
}
