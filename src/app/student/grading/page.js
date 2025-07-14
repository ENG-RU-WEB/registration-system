'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function GradingPage() {
  const [grades, setGrades] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const studentId = localStorage.getItem('student_id')
      if (!studentId) return

      const { data, error } = await supabase
        .from('grading')
        .select('*')
        .eq('STD_CODE', studentId.toString())
        .order('REGIS_YEAR', { ascending: false })
        .order('REGIS_SEMESTER', { ascending: false })

      if (error) {
        console.error('❌ Error fetching grading data:', error)
      } else {
        console.log('✅ Grading data:', data)
        setGrades(data)
      }
    }

    fetchData()
  }, [])

  if (!grades || grades.length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        ⏳ กำลังโหลดข้อมูล หรือไม่มีข้อมูลผลการเรียน
      </div>
    )
  }

  return (
    <div className="overflow-x-auto mt-4">
      <h2 className="flex items-center gap-2 text-xl font-bold text-[#7c0a0a] mb-2">
        <FileText className="w-6 h-6" />
        ผลการเรียน
      </h2>
      <table className="w-full border text-sm md:text-base">
        <thead className="bg-[#7c0a0a] text-white">
          <tr>
            <th className="p-2 border">รหัสวิชา</th>
            <th className="p-2 border">หน่วยกิต</th>
            <th className="p-2 border">ปี/เทอม</th>
            <th className="p-2 border">เกรด</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((item, index) => (
            <tr key={index} className="even:bg-gray-50">
              <td className="p-2 border">{item.COURSE_NO}</td>
              <td className="p-2 border text-center">{item.CREDIT || '-'}</td>
              <td className="p-2 border text-center">{item.REGIS_YEAR}/{item.REGIS_SEMESTER}</td>
              <td className="p-2 border text-center">{item.GRADE || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
