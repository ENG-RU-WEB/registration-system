'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function CurriculumStructurePage() {
  const [curriculumTree, setCurriculumTree] = useState({})
  const [loading, setLoading] = useState(true)
  const [passedMap, setPassedMap] = useState({})
  const [gradeMap, setGradeMap] = useState({})
  const [requiredCredit, setRequiredCredit] = useState(0)
  const [earnedCredit, setEarnedCredit] = useState(0)
  const [conditionMap, setConditionMap] = useState({})
  const [creditTree, setCreditTree] = useState({})
  const [courseData, setCourseData] = useState([])

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

      const totalRequired = curriculumData?.reduce((sum, c) => sum + (c.CATEGORY_CREDIT || 0), 0)
      setRequiredCredit(totalRequired)

      const { data: courseSet } = await supabase
        .from('curriculum_course')
        .select('COURSE_NO, COURSE_NAME_THAI, CREDIT, CATEGORY_CODE, COURSE_REQUIRE')
        .eq('CUR_YEAR', CUR_YEAR)
        .in('MAJOR_NO', [CUR_OWNER, 0])
        .in('COURSE_REQUIRE', ['Compulsory', 'Compulsory_Elective', 'Elective'])
      setCourseData(courseSet || [])

      const { data: gradingData } = await supabase
        .from('grading')
        .select('COURSE_NO, GRADE')
        .eq('STD_CODE', stdCode)

      const { data: transferData } = await supabase
        .from('credit_transfer')
        .select('COURSE_NO')
        .eq('STD_CODE', stdCode)

      const { data: conditionData } = await supabase
        .from('course_condition')
        .select('COURSE_NO, CONDITION_COURSE_NO, CONDITION_TYPE')
        .eq('CUR_YEAR', CUR_YEAR)

      const conditionMap = {}
      conditionData?.forEach(row => {
        const type = row.CONDITION_TYPE.toLowerCase()
        const key = type === 'prerequisite' ? 'PR' : type === 'corequisite' ? 'CR' : null
        if (!key) return
        if (!conditionMap[row.COURSE_NO]) conditionMap[row.COURSE_NO] = { PR: [], CR: [] }
        conditionMap[row.COURSE_NO][key].push(row.CONDITION_COURSE_NO)
      })
      setConditionMap(conditionMap)

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
      setPassedMap(passedMap)
      setGradeMap(gradeMap)

      const filteredCourses = courseSet?.filter(c => {
        const isElective = c.COURSE_REQUIRE === 'Elective'
        const hasGrade = passedMap[c.COURSE_NO]
        return (
          c.COURSE_REQUIRE === 'Compulsory' ||
          c.COURSE_REQUIRE === 'Compulsory_Elective' ||
          (isElective && hasGrade)
        )
      })

      const courseMap = {}
      filteredCourses?.forEach(c => {
        if (!courseMap[c.CATEGORY_CODE]) courseMap[c.CATEGORY_CODE] = []
        courseMap[c.CATEGORY_CODE].push(c)
      })

      const allPassedCourses = gradingData?.map(g => g.COURSE_NO).concat(transferData?.map(t => t.COURSE_NO) || [])
      const allCourseNos = new Set(courseSet.map(c => c.COURSE_NO))
      const freeElectives = allPassedCourses?.filter(c => !allCourseNos.has(c))

      // ดึงชื่อวิชาจาก curriculum_course ด้วย COURSE_NO และ CUR_YEAR
      const freeElectiveCourses = await Promise.all(
        freeElectives?.map(async (courseNo) => {
          const { data: courseInfo } = await supabase
            .from('curriculum_course')
            .select('COURSE_NAME_THAI, CREDIT')
            .eq('COURSE_NO', courseNo)
            .eq('CUR_YEAR', CUR_YEAR)
            .limit(1)
            .single()

          const grade = gradeMap[courseNo] || 'T'
          return {
            COURSE_NO: courseNo,
            COURSE_NAME_THAI: courseInfo?.COURSE_NAME_THAI || 'วิชาเลือกเสรี',
            CREDIT: courseInfo?.CREDIT || 3, // fallback = 3
            GRADE: grade
          }
        }) || []
      )


      const tree = {}
      const creditTree = {}

      curriculumData.forEach(item => {
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

      if (freeElectiveCourses?.length) {
        if (!tree['หมวดเลือกเสรี']) tree['หมวดเลือกเสรี'] = { '__noGroup__': { '__noSub__': { modules: {}, courses: [] } } }
        tree['หมวดเลือกเสรี']['__noGroup__']['__noSub__'].courses = freeElectiveCourses
      }

      const creditEarned = Object.entries(passedMap).reduce((sum, [courseNo]) => {
        const course = courseSet?.find(c => c.COURSE_NO === courseNo)
        if (course) return sum + (course.CREDIT || 0)
        if (freeElectives.includes(courseNo)) return sum + 3
        return sum
      }, 0)
      setEarnedCredit(creditEarned)
      setCurriculumTree(tree)
      setCreditTree(creditTree)
      setLoading(false)
    }

    fetchData()
  }, [])

  const renderTree = (tree) =>
    Object.entries(tree).map(([category, groups]) => {
      const categoryEarned = courseData
        .filter(c => c.CATEGORY_CODE && passedMap[c.COURSE_NO])
        .reduce((sum, c) => sum + (c.CREDIT || 0), 0)

      return (
        <Card key={category} className="mb-6 border border-red-300 shadow">
          <CardContent className="p-4">
            <h2 className="text-xl font-bold text-red-800 mb-1">
              {category} (รวม {creditTree[category] || 0} หน่วยกิต)
            </h2>

            {/* ✅ คำนวณเฉพาะหน่วยกิตในหมวดนี้ */}
            <p className="text-sm text-gray-600 mb-3">
              ✅ หน่วยกิตที่ได้แล้วในหมวดนี้: {
                Object.values(groups)
                  .flatMap(subgroups => Object.values(subgroups)
                    .flatMap(info => info.courses || []))
                  .reduce((sum, c) => passedMap[c.COURSE_NO] ? sum + (c.CREDIT || 0) : sum, 0)
              } / {creditTree[category] || 0} หน่วยกิต
            </p>

            <Accordion type="multiple" defaultValue={Object.keys(groups)}>
              {Object.entries(groups).map(([group, subgroups]) => (
                <AccordionItem value={group} key={group}>
                  <AccordionTrigger>
                    {group !== '__noGroup__'
                      ? `${group} (รวม ${creditTree[category + '::' + group] || 0} หน่วยกิต)`
                      : 'ไม่ระบุกลุ่ม'}
                  </AccordionTrigger>
                  <AccordionContent>
                    {Object.entries(subgroups).map(([sub, info]) => (
                      <div key={sub} className="mb-3">
                        {sub !== '__noSub__' && (
                          <h4 className="text-sm font-medium text-red-600 mb-2">
                            {sub} (รวม {creditTree[category + '::' + group + '::' + sub] || 0} หน่วยกิต)
                          </h4>
                        )}
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm border table-fixed">
                            <thead className="bg-red-100 text-gray-700">
                              <tr>
                                <th className="w-1/6 p-2 text-left">รหัสวิชา</th>
                                <th className="w-3/6 p-2 text-left">ชื่อวิชา</th>
                                <th className="w-1/6 p-2 text-center">หน่วยกิต</th>
                                <th className="w-1/6 p-2 text-center">สถานะ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {info.courses.map((course, idx) => {
                                const grade = gradeMap[course.COURSE_NO]
                                let status = ''
                                let color = 'text-gray-600'

                                if (grade && !['F', 'W', 'I', 'U'].includes(grade)) {
                                  if (grade === 'T') {
                                    status = `💠 เทียบโอน`
                                    color = 'text-blue-700'
                                  } else {
                                    status = `✅ ผ่านแล้ว (${grade})`
                                    color = 'text-green-700'
                                  }
                                } else {
                                  status = `⏳ ยังไม่ผ่าน`
                                  color = 'text-yellow-700'
                                  const conditions = conditionMap[course.COURSE_NO]
                                  const unmetPR = conditions?.PR?.filter(code => !passedMap[code]) || []
                                  const unmetCR = conditions?.CR?.filter(code => !passedMap[code]) || []
                                  const prText = unmetPR.length ? `PR: ${unmetPR.join(', ')}` : ''
                                  const crText = unmetCR.length ? `CR: ${unmetCR.join(', ')}` : ''
                                  const conditionText = [prText, crText].filter(Boolean).join(', ')
                                  if (conditionText) status += ` [${conditionText}]`
                                }

                                const bgColor =
                                  grade === 'T' ? 'bg-blue-50'
                                    : grade && !['F', 'W', 'I', 'U'].includes(grade) ? 'bg-green-50'
                                    : 'bg-yellow-50'

                                return (
                                  <tr key={idx} className={`border-t ${bgColor}`}>
                                    <td className="p-2">{course.COURSE_NO}</td>
                                    <td className="p-2">{course.COURSE_NAME_THAI}</td>
                                    <td className="p-2 text-center">{course.CREDIT}</td>
                                    <td className={`p-2 text-center ${color}`}>{status}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

      )
    })

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
