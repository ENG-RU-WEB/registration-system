'use client'

import {
  Menu,
  User,
  LogOut,
  FileText,
  BookOpen,
  ClipboardList,
  Calendar,
  UserSearch,
  GraduationCap
} from 'lucide-react'



import Link from 'next/link'
import Image from 'next/image'

import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useState, useEffect } from 'react'

export default function ServiceLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const handleLogout = () => {
    localStorage.clear() // หรือใช้ localStorage.removeItem('student_id') เฉพาะรายการก็ได้
    router.push('/login') // กลับไปหน้า login
  }

  const isActive = (path) => pathname === path

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full bg-white px-4 py-6 border-b-4 border-[#7c0a0a] flex items-center justify-between shadow-md z-50">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Logo" width={100} height={100} className="object-contain" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#7c0a0a] whitespace-nowrap">
            ระบบลงทะเบียน
          </h1>
        </div>

        <div className="absolute left-1/2 top-24 transform -translate-x-1/2 text-2xl text-black">
            เจ้าหน้าที่บริการการศึกษา
        </div>

        <div className="hidden md:block text-sm text-right leading-tight text-black">
          คณะวิศวกรรมศาสตร์<br />มหาวิทยาลัยรามคำแหง
        </div>
        <button
          className="md:hidden text-[#7c0a0a] focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="w-8 h-8" />
        </button>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar (Mobile) */}
        <aside
          className={`fixed md:hidden top-[176px] left-0 z-40 bg-[#7c0a0a] text-white rounded-r-xl p-4 shadow-lg transform transition-transform duration-300 ease-in-out
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
          style={{ width: '240px', maxHeight: 'calc(100vh - 96px)' }}
        >
          <nav className="flex flex-col gap-2">
          <Link href="/service" className={`flex items-center gap-2 p-2 rounded shadow
                    ${isActive('/service') ? 'bg-white text-[#7c0a0a]' : 'hover:bg-red-800'}`}>
              <User className="w-5 h-5" /> ตรวจสอบผลการเรียน
          </Link>
            <button className="flex items-center gap-2 bg-black text-white mt-4 p-2 rounded shadow w-full">
              <LogOut className="w-5 h-5" /> ออกจากระบบ
            </button>
          </nav>
        </aside>

        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col gap-2 bg-[#7c0a0a] text-white p-4 rounded-xl shadow-lg ml-6 mt-6 md:w-64 max-w-xs md:h-fit">
          <nav className="flex flex-col gap-2">
          <Link href="/service" className={`flex items-center gap-2 p-2 rounded shadow
                    ${isActive('/service') ? 'bg-white text-[#7c0a0a]' : 'hover:bg-red-800'}`}>
              <UserSearch className="w-5 h-5" /> ตรวจสอบผลการเรียน
          </Link>
            <button className="flex items-center gap-2 bg-black text-white mt-4 p-2 rounded shadow w-full"
              onClick={handleLogout}>
              <LogOut className="w-5 h-5" /> ออกจากระบบ
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:ml-6 md:mt-6">{children}</main>
      </div>
    </div>
  )
}
