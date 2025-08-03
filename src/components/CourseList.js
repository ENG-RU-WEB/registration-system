'use client'

import CourseStatusTag from './CourseStatusTag'

export default function CourseList({ courses }) {
  if (!courses || courses.length === 0) return null

  return (
    <ul className="ml-4 list-disc text-sm">
      {courses.map(course => (
        <li key={course.COURSE_NO}>
          {course.COURSE_NO} {course.COURSE_NAME_THAI} ({course.CREDIT} หน่วยกิต)
          <CourseStatusTag status={course.status} />
        </li>
      ))}
    </ul>
  )
}
