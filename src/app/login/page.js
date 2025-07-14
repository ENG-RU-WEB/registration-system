'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image';

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

    const { data, error } = await supabase
      .from('student_info')
      .select('*')
      .eq('STD_CODE', cleanedUsername)
      .eq('password', cleanedPassword)
      .maybeSingle()

    console.log("✅ data:", data)
    console.log("❌ error:", error)

    if (error || !data) {
      console.error("❌ ไม่พบข้อมูลผู้ใช้หรือรหัสผ่านผิด:", error)
      setMessage('❌ รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง')
    } else {
      console.log("✅ พบข้อมูลผู้ใช้:", data)

      // ✅ เซฟ student_id ที่ได้จริงจากฐานข้อมูล
      localStorage.setItem('student_id', data.STD_CODE)

      // เปลี่ยนหน้า
      router.push('/student')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="Logo" width={120} height={120} className="object-contain" />
        </div>
        <h2 className="text-center text-2xl font-bold text-[#7c0a0a] mb-6">ระบบลงทะเบียน</h2>

        {/* ✅ ใส่ form และ onSubmit */}
        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">รหัสประจำตัวนักศึกษา</label>
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

          {/* ✅ ปุ่ม submit อยู่ใน form */}
          <button
            type="submit"
            className="mt-6 w-full bg-[#b06b6b] hover:bg-[#7c0a0a] text-white font-bold py-2 rounded-md transition-colors"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        {/* แสดงข้อความผิดพลาด */}
        {message && (
          <p className="mt-4 text-center text-sm text-red-600">{message}</p>
        )}
      </div>
    </div>
  );
}
