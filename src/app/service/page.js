'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Search } from 'lucide-react'

export default function FinanceGradesPage() {
  const [studentId, setStudentId] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!studentId.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('grading')
      .select('COURSE_NO, GRADE, REGIS_YEAR, REGIS_SEMESTER')
      .eq('STD_CODE', studentId.trim())
      .order('COURSE_NO', { ascending: true })
      .order('REGIS_YEAR', { ascending: true })
      .order('REGIS_SEMESTER', { ascending: true })

    if (error) {
      console.error('❌ Error fetching data:', error)
      setResults([])
      setLoading(false)
      return
    }

    // 🔍 จัดกลุ่มโดย COURSE_NO
    const grouped = {}
    data.forEach(item => {
      if (!grouped[item.COURSE_NO]) grouped[item.COURSE_NO] = []
      grouped[item.COURSE_NO].push(item)
    })

    // 🎯 เงื่อนไข: วิชาที่ลงซ้ำ ≥ 2 ครั้ง และเกรดตก ≥ 2 ครั้ง
    const badGrades = ['U', 'D+', 'D', 'F']
    const filtered = Object.entries(grouped)
      .filter(([_, attempts]) => {
        const totalAttempts = attempts.length
        const failCount = attempts.filter(a => badGrades.includes(a.GRADE)).length
        return totalAttempts >= 2 && failCount >= 2
      })
      .map(([course, attempts]) => ({ course, attempts }))

    setResults(filtered)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#7c0a0a] mb-4">ตรวจสอบผลการเรียนซ้ำ</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="กรอกรหัสนักศึกษา"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-[#7c0a0a]"
        />
        <button
          onClick={handleSearch}
          className="bg-[#7c0a0a] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-800 transition"
        >
          <Search className="w-4 h-4" /> ค้นหา
        </button>
      </div>

      {loading && <p className="text-gray-500">⏳ กำลังโหลดข้อมูล...</p>}

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map(({ course, attempts }, index) => (
            <div key={index} className="border border-gray-300 rounded p-4 shadow-sm">
              <h2 className="font-semibold text-[#7c0a0a]">รหัสวิชา: {course}</h2>
              <ul className="mt-2 text-sm">
                {attempts.map((a, i) => (
                  <li key={i}>
                    ปีการศึกษา/ภาคการศึกษา:   <b>{a.REGIS_YEAR}/{a.REGIS_SEMESTER}</b> – ผลการเรียน:   <span className="font-bold">{a.GRADE || '-'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : !loading && (
        <p className="text-gray-500">ไม่พบวิชาที่ลงทะเบียนเกิน 2 ครั้ง</p>
      )}
    </div>
  )
}
