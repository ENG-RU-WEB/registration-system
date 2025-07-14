'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  User,
  LogOut,
  FileText,
  BookOpen,
  ClipboardList,
  Calendar,
  GraduationCap
} from 'lucide-react'
import Image from 'next/image'

export default function StudentLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)

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
            <Link href="/student" className="flex items-center gap-2 bg-white text-[#7c0a0a] p-2 rounded shadow">
              <User className="w-5 h-5" /> ข้อมูลนักศึกษา
            </Link>
            <Link href="/student/grading" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <BookOpen className="w-5 h-5" /> ผลการเรียน
            </Link>
            <Link href="/student/registration" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <ClipboardList className="w-5 h-5" /> การลงทะเบียน
            </Link>
            <Link href="/student/payment" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <FileText className="w-5 h-5" /> ประวัติการชำระเงิน
            </Link>
            <Link href="/student/schedule" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <Calendar className="w-5 h-5" /> ตารางเรียน
            </Link>
            <Link href="/student/graduation" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <GraduationCap className="w-5 h-5" /> จบการศึกษา
            </Link>
            <button className="flex items-center gap-2 bg-black text-white mt-4 p-2 rounded shadow w-full">
              <LogOut className="w-5 h-5" /> ออกจากระบบ
            </button>
          </nav>
        </aside>

        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col gap-2 bg-[#7c0a0a] text-white p-4 rounded-xl shadow-lg ml-6 mt-6 md:w-64 max-w-xs md:h-fit">
          <nav className="flex flex-col gap-2">
            <Link href="/student" className="flex items-center gap-2 bg-white text-[#7c0a0a] p-2 rounded shadow">
              <User className="w-5 h-5" /> ข้อมูลนักศึกษา
            </Link>
            <Link href="/student/grading" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <BookOpen className="w-5 h-5" /> ผลการเรียน
            </Link>
            <Link href="/student/registration" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <ClipboardList className="w-5 h-5" /> การลงทะเบียน
            </Link>
            <Link href="/student/payment" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <FileText className="w-5 h-5" /> ประวัติการชำระเงิน
            </Link>
            <Link href="/student/schedule" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <Calendar className="w-5 h-5" /> ตารางเรียน
            </Link>
            <Link href="/student/graduation" className="flex items-center gap-2 p-2 rounded hover:bg-red-800">
              <GraduationCap className="w-5 h-5" /> จบการศึกษา
            </Link>
            <button className="flex items-center gap-2 bg-black text-white mt-4 p-2 rounded shadow w-full">
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
