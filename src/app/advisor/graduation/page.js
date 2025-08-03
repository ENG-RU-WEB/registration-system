'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { CourseItem } from '../../../components/CourseItem'
import { GraduationHeader } from '../../../components/GraduationHeader'
import { StudentInfoCard } from '../../../components/StudentInfoCard'

export default function GraduationPage() {
  const [stdCode, setStdCode] = useState('')
  const [studentInfo, setStudentInfo] = useState(null)
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(false)
  const [conditionMap, setConditionMap] = useState({})
  const [passedMap, setPassedMap] = useState({})

  const handleFetch = async () => {
    setLoading(true)
    const curYear = parseInt(stdCode.substring(0, 2)) >= 65 ? 65 : 60

    const { data: student, error: studentError } = await supabase
      .from('student_info')
      .select('STD_CODE, PRENAME_NO, FIRST_NAME_THAI, LAST_NAME_THAI, MAJOR_NO')
      .eq('STD_CODE', stdCode)
      .single()

    const { data: titleData } = await supabase
      .from('title')
      .select('PRENAME_THAI_S')
      .eq('PRENAME_NO', student.PRENAME_NO)
      .single()

    const { data: majorData } = await supabase
      .from('major')
      .select('MAJOR_NAME_THAI')
      .eq('MAJOR_NO', student.MAJOR_NO)
      .single()

    console.log('👀 student result:', student)
    if (studentError || !student) {
      alert('ไม่พบนักศึกษา')
      setLoading(false)
      return
    }

    const majorNo = student.MAJOR_NO

    const { data: curriculum } = await supabase
      .from('curriculum')
      .select('*')
      .eq('CUR_YEAR', curYear)
      .eq('CUR_OWNER', majorNo)

    const curCodes = curriculum.map(row => row.CUR_CODE?.trim()).filter(Boolean)

    const { data: courseList } = await supabase
      .from('curriculum_course')
      .select('*')
      .eq('CUR_YEAR', curYear)
      .in('CUR_CODE', curCodes)

    const { data: grading } = await supabase
      .from('grading')
      .select('COURSE_NO, GRADE')
      .eq('STD_CODE', stdCode)

    const { data: transfer } = await supabase
      .from('credit_transfer')
      .select('COURSE_NO')
      .eq('STD_CODE', stdCode)

    const passedGrades = ['D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'S']
    const passedMap = {}

    grading?.forEach(g => {
      if (passedGrades.includes(g.GRADE)) {
        passedMap[g.COURSE_NO] = { type: 'grade', grade: g.GRADE }
      }
    })

    transfer?.forEach(t => {
      if (!passedMap[t.COURSE_NO]) {
        passedMap[t.COURSE_NO] = { type: 'transfer' }
      }
    })

    const tree = {}
    const codeToPath = {}
    const categoryCredit = {} // CATEGORY_NAME -> credit limit

    curriculum.forEach(row => {
      const {
        CATEGORY_NAME, GROUP_NAME, SUBGROUP_NAME, MODULE_NAME,
        CATEGORY_CREDIT, GROUP_CREDIT, SUBGROUP_CREDIT, MODULE_CREDIT,
        CUR_CODE, CUR_LEVEL
      } = row

      const categoryKey = CATEGORY_NAME?.trim()
      if (!tree[categoryKey]) {
        tree[categoryKey] = {
          credit: Number(CATEGORY_CREDIT) || 0,
          GROUPS: {},
          courses: []
        }
      }
      categoryCredit[categoryKey] = Number(CATEGORY_CREDIT) || 0

      if (GROUP_NAME) {
        const groupKey = GROUP_NAME.trim()
        if (!tree[categoryKey].GROUPS[groupKey]) {
          tree[categoryKey].GROUPS[groupKey] = {
            credit: Number(GROUP_CREDIT) || 0,
            SUBGROUPS: {},
            courses: []
          }
        }

        if (SUBGROUP_NAME) {
          const subgroupKey = SUBGROUP_NAME.trim()
          if (!tree[categoryKey].GROUPS[groupKey].SUBGROUPS[subgroupKey]) {
            tree[categoryKey].GROUPS[groupKey].SUBGROUPS[subgroupKey] = {
              credit: Number(SUBGROUP_CREDIT) || 0,
              MODULES: {},
              courses: []
            }
          }

          if (MODULE_NAME) {
            const moduleKey = MODULE_NAME.trim()
            if (!tree[categoryKey].GROUPS[groupKey].SUBGROUPS[subgroupKey].MODULES[moduleKey]) {
              tree[categoryKey].GROUPS[groupKey].SUBGROUPS[subgroupKey].MODULES[moduleKey] = {
                credit: Number(MODULE_CREDIT) || 0,
                courses: []
              }
            }

            if (CUR_CODE && !CUR_CODE.includes('FREE-ELECTIVE')) {
              codeToPath[CUR_CODE.trim()] = {
                categoryKey, groupKey, subgroupKey, moduleKey
              }
            }
          } else if (CUR_LEVEL === 3 && CUR_CODE && !CUR_CODE.includes('FREE-ELECTIVE')) {
            codeToPath[CUR_CODE.trim()] = {
              categoryKey, groupKey, subgroupKey
            }
          }
        } else if (CUR_LEVEL === 2 && CUR_CODE && !CUR_CODE.includes('FREE-ELECTIVE')) {
          codeToPath[CUR_CODE.trim()] = {
            categoryKey, groupKey
          }
        }
      } else if (CUR_LEVEL === 1 && CUR_CODE && !CUR_CODE.includes('FREE-ELECTIVE')) {
        codeToPath[CUR_CODE.trim()] = {
          categoryKey
        }
      }
    })

    const electiveGrouped = {}
    const courseMap = {}
    courseList.forEach(course => {
      const { CUR_CODE, COURSE_NO } = course
      courseMap[COURSE_NO] = course
      if (course.COURSE_REQUIRE === 'Elective' && passedMap[COURSE_NO]) {
        if (!electiveGrouped[CUR_CODE]) electiveGrouped[CUR_CODE] = []
        electiveGrouped[CUR_CODE].push(course)
      }
    })

    const acceptedElective = {}
    const extraElective = {}

    Object.entries(electiveGrouped).forEach(([curCode, courses]) => {
      const path = codeToPath[curCode?.trim()]
      if (!path) return
      const categoryKey = path.categoryKey
      const limit = categoryCredit[categoryKey] || 0

      const sorted = courses.sort((a, b) => {
        const g1 = passedMap[a.COURSE_NO]?.grade || 'C'
        const g2 = passedMap[b.COURSE_NO]?.grade || 'C'
        return g2.localeCompare(g1)
      })

      let sum = 0
      acceptedElective[curCode] = []
      extraElective[curCode] = []

      for (const course of sorted) {
        const credit = Number(course.CREDIT) || 0
        if (sum + credit <= limit) {
          acceptedElective[curCode].push(course)
          sum += credit
        } else {
          extraElective[curCode].push(course)
        }
      }
    })

    // Add accepted Electives + Compulsory + failed Compulsory
    courseList.forEach(course => {
      const { CUR_CODE, COURSE_NO, COURSE_NAME_THAI, CREDIT, COURSE_REQUIRE } = course
      const curCode = CUR_CODE?.trim()
      const path = codeToPath[curCode]
      if (!path) return

      const { categoryKey, groupKey, subgroupKey, moduleKey } = path
      const courseData = {
        COURSE_NO,
        COURSE_NAME_THAI,
        CREDIT,
        status: passedMap[COURSE_NO] || (COURSE_REQUIRE === 'Compulsory' ? { type: 'fail' } : undefined)
      }

      if (COURSE_REQUIRE === 'Elective' && !acceptedElective[curCode]?.some(c => c.COURSE_NO === COURSE_NO)) return

      let target = moduleKey
        ? tree?.[categoryKey]?.GROUPS?.[groupKey]?.SUBGROUPS?.[subgroupKey]?.MODULES?.[moduleKey]
        : subgroupKey
        ? tree?.[categoryKey]?.GROUPS?.[groupKey]?.SUBGROUPS?.[subgroupKey]
        : groupKey
        ? tree?.[categoryKey]?.GROUPS?.[groupKey]
        : tree?.[categoryKey]

      if (target && courseData.status) {
        target.courses = target.courses || []
        target.courses.push(courseData)
      }
    })

    // !!! WORING ON FREE_ELECTIVE !!!
    const { data: fullCourseList } = await supabase
      .from('curriculum_course')
      .select('*')
      .eq('CUR_YEAR', curYear)
      
    const courseInfoMap = {}
        fullCourseList?.forEach(course => {
          courseInfoMap[course.COURSE_NO] = course
        })  
            
    const creditPerCurCode = {}
    const curCodeLimit = {}

    Object.entries(passedMap).forEach(([courseNo, status]) => {
      if (!courseMap[courseNo]) {
        const course = courseInfoMap[courseNo]
        const courseName = course?.COURSE_NAME_THAI || courseNo
        const credit = Number(course?.CREDIT) || 3

        // ✅ ดึง prefix แล้ว map ไปหา FREE_ELECTIVE จริง
        const freeKey = 'หมวดเลือกเสรี'
        tree[freeKey].courses.push({
            COURSE_NO: courseNo,
            COURSE_NAME_THAI: courseName,
            CREDIT: credit,
            status
          })
      }

      const course = courseMap[courseNo] || courseInfoMap[courseNo]
      if (!course) return // ไม่มีข้อมูลใน curriculum_course ข้ามไป

      const curCode = course.CUR_CODE?.trim()
      const credit = Number(course.CREDIT) || 0
      if (!curCode) return

      if (!creditPerCurCode[curCode]) {
        creditPerCurCode[curCode] = 0
      }

      creditPerCurCode[curCode] += credit

      curriculum.forEach(row => {
        const curCode = row.CUR_CODE?.trim()
        if (!curCode || curCode in curCodeLimit) return

        // เลือก limit ตามระดับ CUR_LEVEL
        let limit = 0
        if (row.CUR_LEVEL === 4) {
          limit = Number(row.MODULE_CREDIT) || 0
        } else if (row.CUR_LEVEL === 3) {
          limit = Number(row.SUBGROUP_CREDIT) || 0
        } else if (row.CUR_LEVEL === 2) {
          limit = Number(row.GROUP_CREDIT) || 0
        } else if (row.CUR_LEVEL === 1) {
          limit = Number(row.CATEGORY_CREDIT) || 0
        }

        curCodeLimit[curCode] = limit
      })
    })
    
    const overLimitCourses = {}

    Object.entries(creditPerCurCode).forEach(([curCode, totalCredit]) => {
      const limit = curCodeLimit[curCode] || 0
      if (totalCredit > limit) {
        // ✅ กรองเฉพาะวิชาที่ผ่านและเป็น Elective หรือ Compulsory_Elective_1
        const courses = courseList
          .filter(course =>
            course.CUR_CODE?.trim() === curCode &&
            passedMap[course.COURSE_NO] &&
            ['Elective', 'Compulsory', 'Compulsory_Elective_1'].includes(course.COURSE_REQUIRE)
          )
          .map(course => course.COURSE_NO) // ✅ map เฉพาะรหัสวิชา

        overLimitCourses[curCode] = courses
      }
    })

    console.log('📌 CUR_CODE ที่เกิน limit พร้อมรายวิชา:', overLimitCourses)

    // ✅ เตรียมหมวดเลือกเสรี
    const freeKey = 'หมวดเลือกเสรี'
    if (!tree[freeKey]) {
      tree[freeKey] = { credit: 0, GROUPS: {}, courses: [] }
    }

    Object.entries(overLimitCourses).forEach(([curCode, courseNos]) => {
      const path = codeToPath[curCode]
      if (!path) return

      const { categoryKey, groupKey, subgroupKey, moduleKey } = path

      // ดึงข้อมูลรายวิชาที่ผ่านใน CUR_CODE นี้
      const courses = courseNos.map(courseNo => {
        const course = courseMap[courseNo] || courseInfoMap[courseNo]
        return {
          COURSE_NO: courseNo,
          COURSE_NAME_THAI: course?.COURSE_NAME_THAI || courseNo,
          CREDIT: Number(course?.CREDIT) || 3,
          status: passedMap[courseNo]
        }
      })

      console.log('📌 courses:', courses)
      // เรียงลำดับเกรดจากดีที่สุด
      courses.sort((a, b) => {
        // 1) Priority by COURSE_REQUIRE: Elective < Other
        const isElective = c => c.COURSE_REQUIRE === 'Elective'
        const priorityA = isElective(a) ? 1 : 0
        const priorityB = isElective(b) ? 1 : 0
        if (priorityA !== priorityB) return priorityA - priorityB

        // 2) CREDIT มาก → น้อย
        const creditA = Number(a.CREDIT) || 0
        const creditB = Number(b.CREDIT) || 0
        const creditCompare = creditB - creditA
        if (creditCompare !== 0) return creditCompare

        // 3) Grade ดี → แย่
        const gradeA = a.status?.grade || 'C'
        const gradeB = b.status?.grade || 'C'
        return gradeA.localeCompare(gradeB) // A > B > C
      })

      // ย้ายเฉพาะวิชาที่เกิน
      let sum = 0
      const overCourses = []

      for (const course of courses) {
        const credit = course.CREDIT
        if (sum + credit <= curCodeLimit[curCode]) {
          sum += credit
        } else {
          overCourses.push(course)
        }
      }
      console.log('📌 overCourses:', overCourses)

      overCourses.forEach(course => {
        // ✅ เพิ่มในหมวดเลือกเสรี
        const already = tree[freeKey].courses.some(c => c.COURSE_NO === course.COURSE_NO)
        if (!already) {
          tree[freeKey].courses.push(course)
        }

        // ✅ ลบจากหมวดเดิม
        const removeFrom = (list) => {
          const index = list.findIndex(c => c.COURSE_NO === course.COURSE_NO)
          if (index !== -1) list.splice(index, 1)
        }

        if (moduleKey) {
          removeFrom(tree?.[categoryKey]?.GROUPS?.[groupKey]?.SUBGROUPS?.[subgroupKey]?.MODULES?.[moduleKey]?.courses || [])
        } else if (subgroupKey) {
          removeFrom(tree?.[categoryKey]?.GROUPS?.[groupKey]?.SUBGROUPS?.[subgroupKey]?.courses || [])
        } else if (groupKey) {
          removeFrom(tree?.[categoryKey]?.GROUPS?.[groupKey]?.courses || [])
        } else {
          removeFrom(tree?.[categoryKey]?.courses || [])
        }
      })
    })

    const { data: courseCondition } = await supabase
      .from('course_condition')
      .select('*')
      .eq('CUR_YEAR', curYear)

    const tempConditionMap = {}
    courseCondition?.forEach(cond => {
      if (!tempConditionMap[cond.COURSE_NO]) tempConditionMap[cond.COURSE_NO] = []
      tempConditionMap[cond.COURSE_NO].push(cond)
    })

    setStudentInfo({
      ...student,
      title: titleData,
      major: majorData
    })
    setPassedMap(passedMap)
    setConditionMap(tempConditionMap)
    setTree(tree)
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 text-gray-800">
      <GraduationHeader
        stdCode={stdCode}
        setStdCode={setStdCode}
        loading={loading}
        handleFetch={handleFetch}
      />
      {studentInfo && <StudentInfoCard student={studentInfo} />}

      <div className="mt-6 space-y-6">
        {tree && Object.entries(tree)
          .filter(([name, cat]) => {
            const totalCourses = [
              ...(cat.courses || []),
              ...Object.values(cat.GROUPS || {}).flatMap(g =>
                (g.courses || []).concat(
                  Object.values(g.SUBGROUPS || {}).flatMap(sg =>
                    (sg.courses || []).concat(
                      Object.values(sg.MODULES || {}).flatMap(m => m.courses || [])
                    )
                  )
                )
              )
            ]

            const visibleCourses = totalCourses.filter(
              c => c.status?.type === 'grade' || c.status?.type === 'transfer' || c.status?.type === 'fail'
            )

            return visibleCourses.length > 0 || !name.includes('FREE_ELECTIVE')
          })
          .map(([categoryName, cat]) => (
            <div key={categoryName} className="rounded-xl shadow-sm" style={{ border: '1px solid #7c0a0a' }}>
              <div className="text-white px-4 py-2 rounded-t-xl font-bold text-lg" style={{ backgroundColor: '#7c0a0a' }}>
                {categoryName} (รวม {cat.credit} หน่วยกิต)
              </div>
              <div className="p-4">
                {cat.courses?.length > 0 && (
                  <ul className="list-disc ml-5">
                    {cat.courses.map(course => (
                      <CourseItem key={course.COURSE_NO} course={course} conditionMap={conditionMap} passedMap={passedMap} />
                    ))}
                  </ul>
                )}

                {Object.entries(cat.GROUPS).map(([g, gData]) => (
                  <div key={g} className="mt-3 ml-2">
                    <div className="font-semibold text-base text-red-800">{g} (รวม {gData.credit} หน่วยกิต)</div>
                    {gData.courses?.length > 0 && (
                      <ul className="list-disc ml-6">
                        {gData.courses.map(course => (
                          <CourseItem key={course.COURSE_NO} course={course} conditionMap={conditionMap} passedMap={passedMap} />
                        ))}
                      </ul>
                    )}

                    {Object.entries(gData.SUBGROUPS).map(([sg, sgData]) => (
                      <div key={sg} className="mt-2 ml-2">
                        <div className="italic text-sm text-red-600">{sg} (รวม {sgData.credit} หน่วยกิต)</div>
                        {sgData.courses?.length > 0 && (
                          <ul className="list-disc ml-6">
                            {sgData.courses.map(course => (
                              <CourseItem key={course.COURSE_NO} course={course} conditionMap={conditionMap} passedMap={passedMap} />
                            ))}
                          </ul>
                        )}

                        {Object.entries(sgData.MODULES).map(([m, mData]) => (
                          <div key={m} className="ml-4">
                            <div className="underline text-sm text-gray-700">{m} ({mData.credit} หน่วยกิต)</div>
                            {mData.courses?.length > 0 && (
                              <ul className="list-disc ml-6">
                                {mData.courses.map(course => (
                                  <CourseItem key={course.COURSE_NO} course={course} conditionMap={conditionMap} passedMap={passedMap} />
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
