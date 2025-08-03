'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function CurriculumStructurePage() {
  const [curriculumTree, setCurriculumTree] = useState({})
  const [loading, setLoading] = useState(true)
  const [passedMap, setPassedMap] = useState({})
  const [gradeMap, setGradeMap] = useState({})
  const [requiredCredit, setRequiredCredit] = useState(0)
  const [earnedCredit, setEarnedCredit] = useState(0)
  const [curriculumList, setCurriculumList] = useState([])
  const [creditTree, setCreditTree] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const stdCode = localStorage.getItem('username') || ''
      const yearPrefix = parseInt(stdCode.slice(0, 2))
      const CUR_YEAR = yearPrefix >= 65 ? 65 : 60

      const { data: student } = await supabase
        .from('student_info')
        .select('MAJOR_NO')
        .eq('STD_CODE', stdCode)
        .single()

      if (!student) return
      const CUR_OWNER = student.MAJOR_NO

      const { data: curriculumData } = await supabase
        .from('curriculum')
        .select('CATEGORY_CODE, CATEGORY_NAME, GROUP_NAME, SUBGROUP_NAME, MODULE, CATEGORY_CREDIT')
        .eq('CUR_YEAR', CUR_YEAR)
        .eq('CUR_OWNER', CUR_OWNER)

      const { data: courseData } = await supabase
        .from('curriculum_course')
        .select('COURSE_NO, COURSE_NAME_THAI, CREDIT, CATEGORY_CODE, COURSE_REQUIRE, MAJOR_NO')
        .eq('CUR_YEAR', CUR_YEAR)
        .in('MAJOR_NO', [CUR_OWNER, 0])

      const { data: gradingData } = await supabase
        .from('grading')
        .select('COURSE_NO, GRADE')
        .eq('STD_CODE', stdCode)

      const { data: transferData } = await supabase
        .from('credit_transfer')
        .select('COURSE_NO')
        .eq('STD_CODE', stdCode)

      const passedMap = {}
      const gradeMap = {}
      gradingData?.forEach(g => {
        gradeMap[g.COURSE_NO] = g.GRADE
        if (!['F', 'W', 'I', 'U'].includes(g.GRADE)) passedMap[g.COURSE_NO] = g.GRADE
      })
      transferData?.forEach(t => {
        passedMap[t.COURSE_NO] = 'T'
        gradeMap[t.COURSE_NO] = 'T'
      })

      const electiveUsed = {}
      const acceptedCourses = []
      const overflowCourses = []

      const specElectives = courseData.filter(c =>
        c.COURSE_REQUIRE === 'Elective' && c.CATEGORY_CODE.includes('_SPEC_ELECTIVE') && passedMap[c.COURSE_NO]
      )
      const fieldPractice = courseData.filter(c =>
        c.CATEGORY_CODE.includes('_FIELD_PRACTICE') && passedMap[c.COURSE_NO]
      )

      const mergedSpecElectives = [...specElectives, ...fieldPractice.filter(f => (f.CREDIT || 0) > 0)]

      mergedSpecElectives.forEach(course => {
        const target = curriculumData.find(c => c.CATEGORY_CODE.includes('_SPEC_ELECTIVE'))
        if (target) {
          const catCode = target.CATEGORY_CODE
          const used = electiveUsed[catCode] || 0
          const required = target.CATEGORY_CREDIT || 0
          const credit = course.CREDIT || 0

          if (used + credit <= required) {
            acceptedCourses.push({ ...course, CATEGORY_CODE: catCode })
            electiveUsed[catCode] = used + credit
          } else {
            const remain = required - used
            if (remain > 0) {
              acceptedCourses.push({ ...course, CATEGORY_CODE: catCode, CREDIT: remain })
              overflowCourses.push({ ...course, CREDIT: credit - remain })
            } else {
              overflowCourses.push(course)
            }
          }
        }
      })

      // ✅ Accept เฉพาะ Compulsory และ Compulsory_Elective ที่ผ่านแล้ว
      const compulsoryCourses = courseData.filter(c => {
        if (c.COURSE_REQUIRE === 'Compulsory') return true
        if (c.COURSE_REQUIRE === 'Compulsory_Elective') return !!passedMap[c.COURSE_NO]
        return false
      })

      // รวมทั้งหมดที่ผ่านแล้ว
      const finalAccepted = [...acceptedCourses, ...compulsoryCourses]

      // ✅ หา courseMap จาก accepted เท่านั้น
      const courseMap = {}

      acceptedCourses.forEach(c => {
        if (!courseMap[c.CATEGORY_CODE]) courseMap[c.CATEGORY_CODE] = []
        courseMap[c.CATEGORY_CODE].push(c)
      })

      // 🧠 เพิ่ม block นี้ตามด้านบน เพื่อเติม Elective ที่หลุดจาก map
      const missingElectives = courseData.filter(c =>
        c.COURSE_REQUIRE === 'Elective' &&
        passedMap[c.COURSE_NO] &&
        !Object.values(courseMap).some(courseList =>
          courseList.some(x => x.COURSE_NO === c.COURSE_NO)
        )
      )

      missingElectives.forEach(c => {
        if (!courseMap[c.CATEGORY_CODE]) courseMap[c.CATEGORY_CODE] = []
        courseMap[c.CATEGORY_CODE].push(c)
      })

      finalAccepted.forEach(c => {
        if (!courseMap[c.CATEGORY_CODE]) courseMap[c.CATEGORY_CODE] = []
        courseMap[c.CATEGORY_CODE].push(c)
      })

      // ✅ หา external courses (ไม่มีใน courseData)
      const allStudied = [...new Set([
        ...(gradingData?.map(g => g.COURSE_NO) || []),
        ...(transferData?.map(t => t.COURSE_NO) || [])
      ])]
      const knownCourses = new Set(courseData.map(c => c.COURSE_NO))
      const externalCourses = allStudied.filter(c => !knownCourses.has(c))

      const extraFreeCourses = []

      for (const courseNo of externalCourses) {
        const { data: info } = await supabase
          .from('curriculum_course')
          .select('COURSE_NAME_THAI, CREDIT')
          .eq('COURSE_NO', courseNo)
          .eq('CUR_YEAR', CUR_YEAR)
          .single()

        extraFreeCourses.push({
          COURSE_NO: courseNo,
          COURSE_NAME_THAI: info?.COURSE_NAME_THAI || 'วิชาเลือกเสรี',
          CREDIT: info?.CREDIT || 3,
          GRADE: gradeMap[courseNo] || 'T'
        })
      }

      // ✅ overflow → Free Elective
      overflowCourses.forEach(c => {
        extraFreeCourses.push({
          COURSE_NO: c.COURSE_NO,
          COURSE_NAME_THAI: c.COURSE_NAME_THAI || 'วิชาเลือกเสรี',
          CREDIT: c.CREDIT || 3,
          GRADE: gradeMap[c.COURSE_NO] || 'T'
        })
      })

      // ✅ Tree structure
      const tree = {}
      const creditTree = {}

      curriculumData.forEach(item => {
        const code = item.CATEGORY_CODE
        const cat = code.includes('FIELD_PRACTICE') ? 'สหกิจศึกษา' : (item.CATEGORY_NAME || 'หมวดไม่ระบุ')
        const group = item.GROUP_NAME || '__noGroup__'
        const sub = item.SUBGROUP_NAME || '__noSub__'
        const mod = item.MODULE || null

        if (!tree[cat]) tree[cat] = {}
        if (!tree[cat][group]) tree[cat][group] = {}
        if (!tree[cat][group][sub]) tree[cat][group][sub] = { modules: {}, courses: [] }
        if (mod) tree[cat][group][sub].modules[mod] = true
        tree[cat][group][sub].courses = courseMap[code] || []
      })

      // ✅ เพิ่ม Free Elective
      if (extraFreeCourses.length > 0) {
        tree['หมวดเลือกเสรี'] = {
          '__noGroup__': {
            '__noSub__': {
              modules: {},
              courses: extraFreeCourses
            }
          }
        }
      }

      // ✅ สรุปเครดิต
      const totalCredit = [...finalAccepted, ...extraFreeCourses].reduce((sum, c) => sum + (c.CREDIT || 0), 0)
      const required = curriculumData.reduce((sum, c) => sum + (c.CATEGORY_CREDIT || 0), 0)

      setCurriculumTree(tree)
      setCreditTree(creditTree)
      setPassedMap(passedMap)
      setGradeMap(gradeMap)
      setEarnedCredit(totalCredit)
      setRequiredCredit(required)
      setLoading(false)
    }

    fetchData()
  }, [])

  const renderTree = (tree) =>
    Object.entries(tree).map(([category, groups]) => (
      <div key={category} className="mb-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">{category}</h2>
        {Object.entries(groups).map(([group, subgroups]) => (
          <div key={group} className="ml-4 mb-2">
            {group !== '__noGroup__' && <h3 className="text-lg text-red-700 font-semibold">{group}</h3>}
            {Object.entries(subgroups).map(([sub, info]) => (
              <div key={sub} className="ml-4 mb-3">
                {sub !== '__noSub__' && <h4 className="text-sm font-medium text-red-600">{sub}</h4>}
                {info.courses.map((course, idx) => {
                  const grade = passedMap[course.COURSE_NO]
                  let status = '⏳ ยังไม่เรียน'
                  let color = 'text-gray-500'

                  if (grade) {
                    if (['F', 'W', 'I', 'U'].includes(grade)) {
                      status = `❌ ไม่ผ่าน (${grade})`
                      color = 'text-yellow-700'
                    } else if (grade === 'T') {
                      status = `💠 เทียบโอน`
                      color = 'text-blue-700'
                    } else {
                      status = `✅ ผ่านแล้ว (${grade})`
                      color = 'text-green-700'
                    }
                  }

                  return (
                    <p key={idx} className={`ml-6 text-sm ${color}`}>
                      • {course.COURSE_NO} {course.COURSE_NAME_THAI} ({course.CREDIT} หน่วยกิต) – {status}
                    </p>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    ))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">แผนโครงสร้างหลักสูตรและสถานะการเรียน</h1>
      {loading ? <p>กำลังโหลด...</p> : (
        <>
          {renderTree(curriculumTree)}
          <div className="mt-8 text-md text-gray-800">
            <p>✅ หน่วยกิตที่เรียนหรือเทียบโอนแล้ว: <strong>{earnedCredit}</strong> / {requiredCredit}</p>
            {earnedCredit >= requiredCredit ? (
              <p className="text-green-700 mt-1">🎓 นักศึกษาผ่านเกณฑ์ครบหน่วยกิตแล้ว</p>
            ) : (
              <p className="text-yellow-700 mt-1">⚠️ ยังขาดหน่วยกิตอีก {requiredCredit - earnedCredit} หน่วยกิต</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
