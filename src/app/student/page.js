'use client'

import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function StudentPage() {
  const [student, setStudent] = useState(null)

  useEffect(() => {
    const fetchStudentInfo = async () => {
      const studentId = localStorage.getItem('username')

      if (!studentId) return

      const { data, error } = await supabase
        .from('student_info')
        .select('*, title(PRENAME_THAI_S), major(MAJOR_NAME_THAI)')
        .eq('STD_CODE', studentId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching student info:', error)
        return
      }

      if (data) {
        setStudent(data)
        localStorage.setItem('majorNo', data.MAJOR_NO)  // สำคัญมากสำหรับ CUR_YEAR ต่อไป
      }
    }

    fetchStudentInfo()
  }, [])

  if (!student) return <p className="text-center p-4">⏳ กำลังโหลดข้อมูล...</p>

  function formatThaiDate(isoDate) {
  if (!isoDate) return 'ไม่ระบุ'

  const monthsThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  const [month, day, year] = isoDate.split('/')
  const thaiYear = parseInt(year) + 543
  const monthName = monthsThai[parseInt(month) - 1]

  return `${parseInt(day)} ${monthName} พ.ศ. ${thaiYear}`
  }

  return (
  <div className="p-4 max-w-3xl mx-auto bg-white shadow-md rounded-md border border-gray-200">
    <div className="flex items-center gap-2 text-xl font-bold text-[#7c0a0a] mb-4">
      <User className="w-5 h-5" />
      <span>ข้อมูลนักศึกษา</span>
    </div>

    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-base text-gray-700">
      <div>
        <p className="text-base font-normal text-gray-800">ชื่อ–นามสกุล:</p>
        <p className="text-base font-bold text-gray-900">
          {student.title?.PRENAME_THAI_S}{student.FIRST_NAME_THAI} {student.LAST_NAME_THAI}
        </p>
      </div>
      <div>
        <p className="text-base font-normal text-gray-800">เลขบัตรประชาชน:</p>
        <p className="text-base font-bold text-gray-900">{student.CITIZEN_ID || 'ไม่ระบุ'}</p>
      </div>

    <div>
      <p className="text-base font-normal text-gray-800">รหัสนักศึกษา:</p>
      <p className="text-base font-bold text-gray-900">{student.STD_CODE}</p>
    </div>
    <div>
      <p className="text-base font-normal text-gray-800">วันเกิด:</p>
      <p className="text-base font-bold text-gray-900">{formatThaiDate(student.BIRTH_DATE) || 'ไม่ระบุ'}</p>
    </div>

    <div>
      <p className="text-base font-normal text-gray-800">สาขา:</p>
      <p className="text-base font-bold text-gray-900">{student.major?.MAJOR_NAME_THAI || 'ไม่ระบุ'}</p>
    </div>
    <div>
      <p className="text-base font-normal text-gray-800">กลุ่มเรียน:</p>
      <p className="text-base font-bold text-gray-900">{student.CLASS_GROUP || 'ไม่ระบุ'}</p>
    </div>
  </div>

  </div>
  )
}
