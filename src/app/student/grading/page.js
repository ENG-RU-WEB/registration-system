'use client'

import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function GradingPage() {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const studentId = localStorage.getItem('username')
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
        setGrades(data)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        ⏳ กำลังโหลดข้อมูล...
      </div>
    )
  }

  if (!grades || grades.length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        ❗️ไม่มีข้อมูลผลการเรียน
      </div>
    )
  }

  const grouped = new Map()
  grades.forEach(g => {
    const key = `${g.REGIS_YEAR}/${g.REGIS_SEMESTER}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(g)
  })

  const allTerms = (() => {
    const termPairs = grades.map(g => ({
      year: parseInt(g.REGIS_YEAR),
      sem: parseInt(g.REGIS_SEMESTER)
    }))

    const sorted = termPairs.sort((a, b) =>
      a.year - b.year || a.sem - b.sem
    )

    const first = sorted[0]
    const last = sorted[sorted.length - 1]

    const terms = []
    let y = first.year
    let s = first.sem

    while (y < last.year || (y === last.year && s <= last.sem)) {
      terms.push(`${y}/${s}`)
      s++
      if (s > 3) {
        s = 1
        y++
      }
    }

    return terms.reverse()
  })()

  const firstExpectedTerm = allTerms[allTerms.length - 1]

  const gradePoint = grade => {
    const mapping = {
      'A': 4.0, 'B+': 3.5, 'B': 3.0,
      'C+': 2.5, 'C': 2.0,
      'D+': 1.5, 'D': 1.0
    }
    return mapping[grade] ?? null
  }

  const termStats = {}
  let totalCredits = 0
  let totalGradePoints = 0

  const sortedTerms = [...allTerms].sort((a, b) => {
    const [ya, sa] = a.split('/').map(Number)
    const [yb, sb] = b.split('/').map(Number)
    return ya - yb || sa - sb
  })

  sortedTerms.forEach(term => {
    const termGrades = grouped.get(term) || []
    let termCredits = 0
    let termPoints = 0

    termGrades.forEach(item => {
      const point = gradePoint(item.GRADE)
      const credit = item.CREDIT
      if (point !== null && typeof credit === 'number') {
        termCredits += credit
        termPoints += credit * point
      }
    })

    totalCredits += termCredits
    totalGradePoints += termPoints

    const gpa = termCredits > 0 ? (termPoints / termCredits).toFixed(2) : '-'
    const gpax = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '-'
    termStats[term] = { gpa, gpax }
  })

    const getGpaColor = (score) => {
      if (isNaN(score)) return 'text-gray-700'
      if (score < 1.5) return 'text-red-600 font-bold'
      if (score < 2.0) return 'text-orange-500 font-semibold'
      if (score < 2.5) return 'text-gray-700'
      if (score < 3.0) return 'text-green-400'
      if (score < 3.5) return 'text-green-600 font-semibold'
      return 'text-green-600 font-bold'
    }

  return (
    <div className="mt-4">
      <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-[#7c0a0a] mb-4">
        <BookOpen className="w-5 h-5" />
        ผลการเรียน
      </h2>

      {allTerms
        .filter(term => {
          const termGrades = grouped.get(term)
          const sem = parseInt(term.split('/')[1])
          const hasGrades = termGrades && termGrades.length > 0
          if (sem === 3 && !hasGrades) return false
          if (term === firstExpectedTerm && !hasGrades) return false
          return true
        })
        .map(term => {
          const termGrades = grouped.get(term)
          const { gpa, gpax } = termStats[term] || { gpa: '-', gpax: '-' }
          const [year, sem] = term.split('/')

          return (
            <div key={term} className="mb-6">
              <h3 className="text-lg font-semibold text-[#7c0a0a] mb-2">
                ภาคการศึกษา {sem}/{year}
              </h3>

              {termGrades && termGrades.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-xl shadow-md">
                    <table className="w-full text-sm md:text-base border border-gray-300 rounded-lg overflow-hidden">
                      <thead className="bg-[#7c0a0a] text-white">
                        <tr>
                          <th className="p-3 text-left">รหัสวิชา</th>
                          <th className="p-3 text-center">กลุ่มเรียน</th>
                          <th className="p-3 text-center">หน่วยกิต</th>
                          <th className="p-3 text-center">ผลการเรียน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {termGrades.map((item, idx) => {
                          const grade = item.GRADE || '-'
                          const gradeColor = {
                            'A': 'text-green-600 font-bold',
                            'B+': 'text-green-400 font-semibold',
                            'B': 'text-green-400 font-semibold',
                            'C+': 'text-gray-700',
                            'C': 'text-gray-700',
                            'D+': 'text-orange-500 font-semibold',
                            'D': 'text-orange-500 font-semibold',
                            'F': 'text-red-600 font-bold',
                            'S': 'text-green-600 font-bold',
                            'U': 'text-red-600 font-bold',
                            'W': 'text-blue-600',
                            'I': 'text-gray-700',
                          }[grade] || 'text-gray-700'

                          return (
                            <tr key={idx} className="hover:bg-gray-50 transition">
                              <td className="p-3 border-t">{item.COURSE_NO}</td>
                              <td className="p-3 border-t text-center">{item.SECTION_NO || '-'}</td>
                              <td className="p-3 border-t text-center">{item.CREDIT || '-'}</td>
                              <td className={`p-3 border-t text-center ${gradeColor}`}>{grade}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right text-lg mt-2">
                    GPA: <span className={`font-semibold ${getGpaColor(parseFloat(gpa))}`}>{gpa}</span>
                    {' '}| GPAX: <span className={`font-semibold ${getGpaColor(parseFloat(gpax))}`}>{gpax}</span>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 italic border-l-4 border-gray-300 pl-4">
                  ลาพักการศึกษา
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}
