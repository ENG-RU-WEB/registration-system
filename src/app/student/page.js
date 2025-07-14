'use client'
import { User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function StudentPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const studentId = localStorage.getItem('student_id')
      if (!studentId) return

      const { data, error } = await supabase
        .from('student_info')
        .select('*, title(PRENAME_THAI_S), major(MAJOR_NAME_THAI)')
        .eq('STD_CODE', studentId)
        .maybeSingle()

      if (error) {
        console.error('❌ error fetching student data:', error)
      } else {
        setData(data)
      }
    }

    fetchData()
  }, [])

  if (!data) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        ⏳ กำลังโหลดข้อมูล...
      </div>
    )
  }

  const fullName = [
    data.title?.PRENAME_THAI_S,
    data.FIRST_NAME_THAI,
    data.MIDDLE_NAME_THAI,
    data.LAST_NAME_THAI,
  ].filter(Boolean).join(' ')

  const major = data.major?.MAJOR_NAME_THAI || 'ไม่ระบุ'

  return (
    <div className="flex justify-center px-4 py-8">
      <div className="bg-white p-6 rounded border-2 border-[#7c0a0a] shadow-md w-full max-w-4xl">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-[#7c0a0a]" />
        <h2 className="text-xl font-bold text-[#7c0a0a]">ข้อมูลนักศึกษา</h2>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm md:text-base">
          <div>
            <p><span className="font-bold">ชื่อ–นามสกุล:</span><br />{fullName}</p>
            <p className="mt-2"><span className="font-bold">รหัสนักศึกษา:</span><br />{data.STD_CODE}</p>
            <p className="mt-2"><span className="font-bold">สาขา:</span><br />{major}</p>
          </div>
          <div>
            <p><span className="font-bold">เลขบัตรประชาชน:</span><br />{data.CITIZEN_ID}</p>
            <p className="mt-2"><span className="font-bold">วันเกิด:</span><br />{data.BIRTHDATE || 'ไม่ระบุ'}</p>
            <p className="mt-2"><span className="font-bold">กลุ่มเรียน:</span><br />{data.CLASS_GROUP || 'ไม่ระบุ'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
