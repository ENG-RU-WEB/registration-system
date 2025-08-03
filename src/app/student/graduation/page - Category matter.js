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

  const { data: curriculumList = [] } = await supabase
    .from('curriculum')
    .select('CATEGORY_CODE, CATEGORY_NAME, GROUP_NAME, SUBGROUP_NAME, MODULE, CATEGORY_CREDIT')
    .eq('CUR_YEAR', CUR_YEAR)
    .eq('CUR_OWNER', CUR_OWNER)

  const requiredCredit = curriculumList.reduce((sum, c) => sum + (c.CATEGORY_CREDIT || 0), 0)
  setRequiredCredit(requiredCredit)

  const { data: courseData = [] } = await supabase
    .from('curriculum_course')
    .select('COURSE_NO, COURSE_NAME_THAI, CREDIT, CATEGORY_CODE, COURSE_REQUIRE')
    .eq('CUR_YEAR', CUR_YEAR)
    .in('MAJOR_NO', [CUR_OWNER, 0])
    .in('COURSE_REQUIRE', ['Compulsory', 'Compulsory_Elective', 'Elective'])

  const { data: gradingData = [] } = await supabase
    .from('grading')
    .select('COURSE_NO, GRADE')
    .eq('STD_CODE', stdCode)

  const { data: transferData = [] } = await supabase
    .from('credit_transfer')
    .select('COURSE_NO')
    .eq('STD_CODE', stdCode)

  const passedMap = {}
  const gradeMap = {}
  gradingData.forEach(g => {
    gradeMap[g.COURSE_NO] = g.GRADE
    if (!['F', 'W', 'I', 'U'].includes(g.GRADE)) {
      passedMap[g.COURSE_NO] = g.GRADE
    }
  })
  transferData.forEach(t => {
    passedMap[t.COURSE_NO] = 'T'
    gradeMap[t.COURSE_NO] = 'T'
  })

  setPassedMap(passedMap)
  setGradeMap(gradeMap)

  // ✅ แยกวิชา Elective ที่เกิน quota
  const electiveUsed = {}
  const acceptedElectives = []
  const overflowCourses = []

  courseData
    .filter(c => c.COURSE_REQUIRE === 'Elective' && passedMap[c.COURSE_NO])
    .forEach(course => {
      const required = curriculumList.find(c => c.CATEGORY_CODE === course.CATEGORY_CODE)?.CATEGORY_CREDIT || 0
      const used = electiveUsed[course.CATEGORY_CODE] || 0
      const credit = course.CREDIT || 0

      if (used + credit <= required) {
        acceptedElectives.push(course)
        electiveUsed[course.CATEGORY_CODE] = used + credit
      } else {
        const remain = required - used
        if (remain > 0) {
          acceptedElectives.push({ ...course, CREDIT: remain })
          overflowCourses.push({ ...course, CREDIT: credit - remain })
        } else {
          overflowCourses.push(course)
        }
      }
    })

  // ✅ กรณี FIELD_PRACTICE → SPEC_ELECTIVE
  const specElectives = courseData.filter(c =>
    c.CATEGORY_CODE.includes('_FIELD_PRACTICE') &&
    passedMap[c.COURSE_NO] &&
    (c.CREDIT || 0) > 0
  )
  specElectives.forEach(course => {
    const target = curriculumList.find(c =>
      c.CATEGORY_CODE.includes('_SPEC_ELECTIVE')
    )
    if (target) {
      const catCode = target.CATEGORY_CODE
      const used = electiveUsed[catCode] || 0
      const required = target.CATEGORY_CREDIT || 0
      const credit = course.CREDIT || 0

      if (used + credit <= required) {
        acceptedElectives.push({ ...course, CATEGORY_CODE: catCode })
        electiveUsed[catCode] = used + credit
      } else {
        const remain = required - used
        if (remain > 0) {
          acceptedElectives.push({ ...course, CATEGORY_CODE: catCode, CREDIT: remain })
          overflowCourses.push({ ...course, CREDIT: credit - remain })
        } else {
          overflowCourses.push(course)
        }
      }
    }
  })

  // ✅ จัด courseMap (ไม่รวม Compulsory_Elective ที่ยังไม่เรียน)
  const courseMap = {}
  courseData.forEach(course => {
    const showThis =
      course.COURSE_REQUIRE === 'Compulsory' ||
      (course.COURSE_REQUIRE === 'Compulsory_Elective' && passedMap[course.COURSE_NO]) ||
      (course.COURSE_REQUIRE === 'Elective' && acceptedElectives.find(e => e.COURSE_NO === course.COURSE_NO))

    if (showThis) {
      if (!courseMap[course.CATEGORY_CODE]) courseMap[course.CATEGORY_CODE] = []
      courseMap[course.CATEGORY_CODE].push(course)
    }
  })

  // ✅ ดึงรายวิชาที่ไม่มีใน CUR_OWNER → จัดให้เป็น FREE_ELECTIVE
  const allPassed = [...gradingData.map(g => g.COURSE_NO), ...transferData.map(t => t.COURSE_NO)]
  const knownCourses = new Set(courseData.map(c => c.COURSE_NO))
  const freeExtra = []

  for (const courseNo of allPassed) {
    if (!knownCourses.has(courseNo)) {
      const { data: extraInfo } = await supabase
        .from('curriculum_course')
        .select('COURSE_NAME_THAI, CREDIT')
        .eq('COURSE_NO', courseNo)
        .order('CUR_YEAR', { ascending: false })
        .limit(1)
        .single()

      freeExtra.push({
        COURSE_NO: courseNo,
        COURSE_NAME_THAI: extraInfo?.COURSE_NAME_THAI || 'วิชาเลือกเสรี',
        CREDIT: extraInfo?.CREDIT || 3,
        GRADE: gradeMap[courseNo] || 'T'
      })
    }
  }

  // ✅ โยก overflow → FREE_ELECTIVE
  const freeElectiveCourses = [...overflowCourses, ...freeExtra].map(course => ({
    COURSE_NO: course.COURSE_NO,
    COURSE_NAME_THAI: course.COURSE_NAME_THAI,
    CREDIT: course.CREDIT,
    GRADE: gradeMap[course.COURSE_NO] || 'T'
  }))

  // ✅ สร้าง Tree
  const tree = {}
  const creditTree = {}

  curriculumList.forEach(item => {
    const cat = item.CATEGORY_NAME || 'หมวดไม่ระบุ'
    const group = item.GROUP_NAME || '__noGroup__'
    const sub = item.SUBGROUP_NAME || '__noSub__'
    const module = item.MODULE || null
    const catCode = item.CATEGORY_CODE

    if (!tree[cat]) {
      tree[cat] = {}
      creditTree[cat] = 0
    }
    if (!tree[cat][group]) {
      tree[cat][group] = {}
      creditTree[`${cat}::${group}`] = 0
    }
    if (!tree[cat][group][sub]) {
      tree[cat][group][sub] = { modules: {}, courses: [] }
      creditTree[`${cat}::${group}::${sub}`] = 0
    }

    if (module) tree[cat][group][sub].modules[module] = true
    tree[cat][group][sub].courses = courseMap[catCode] || []
    creditTree[cat] += item.CATEGORY_CREDIT || 0
    creditTree[`${cat}::${group}`] += item.CATEGORY_CREDIT || 0
    creditTree[`${cat}::${group}::${sub}`] += item.CATEGORY_CREDIT || 0
  })

  // ✅ เพิ่มหมวดเลือกเสรี
  if (freeElectiveCourses.length > 0) {
    const cat = 'หมวดเลือกเสรี'
    if (!tree[cat]) {
      tree[cat] = { '__noGroup__': { '__noSub__': { modules: {}, courses: [] } } }
      creditTree[cat] = 0
    }
    const sub = tree[cat]['__noGroup__']['__noSub__']
    sub.courses = [...sub.courses, ...freeElectiveCourses]
  }

  // ✅ รวมหน่วยกิตที่ได้
  const earned = Object.keys(passedMap).reduce((sum, courseNo) => {
    const course = courseData.find(c => c.COURSE_NO === courseNo)
    if (course) return sum + (course.CREDIT || 0)
    const free = freeElectiveCourses.find(f => f.COURSE_NO === courseNo)
    return free ? sum + (free.CREDIT || 0) : sum
  }, 0)
  setEarnedCredit(earned)

  setCurriculumTree(tree)
  setCreditTree(creditTree)
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
