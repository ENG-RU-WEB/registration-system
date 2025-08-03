'use client'

interface CourseItemProps {
  course: any
  conditionMap: Record<string, any[]>
  passedMap: Record<string, any>
}

export function CourseItem({ course, conditionMap, passedMap }: CourseItemProps) {
  const conds = conditionMap[course.COURSE_NO] || []
  const unpassedConds = conds.filter(c => !passedMap[c.CONDITION_COURSE_NO])
  const prereqs = unpassedConds
    .filter(c => c.CONDITION_TYPE.toLowerCase() === 'prerequisite')
    .map(c => c.CONDITION_COURSE_NO)
  const coreqs = unpassedConds
    .filter(c => c.CONDITION_TYPE.toLowerCase() === 'corequisite')
    .map(c => c.CONDITION_COURSE_NO)

  return (
    <li className="mb-1 text-sm">
      <span className="font-medium text-gray-900">{course.COURSE_NO}</span>{' '}
      {course.COURSE_NAME_THAI} ({course.CREDIT} หน่วยกิต)
      {course.status?.type === 'grade' && (
        <span className="text-green-600 font-semibold ml-2">✔️ เกรด {course.status.grade}</span>
      )}
      {course.status?.type === 'transfer' && (
        <span className="text-blue-600 font-semibold ml-2">💠 เทียบโอน</span>
      )}
      {course.status?.type === 'fail' && (prereqs.length || coreqs.length) > 0 && (
        <span className="text-xs text-red-500 ml-2">
          ❌ ไม่ผ่าน{' '}
          {[prereqs.length > 0 ? `PR: ${prereqs.join(', ')}` : null,
            coreqs.length > 0 ? `CR: ${coreqs.join(', ')}` : null
          ].filter(Boolean).join(' | ')}
        </span>
      )}
    </li>
  )
}

