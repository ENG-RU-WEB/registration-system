'use client'

export function StudentInfoCard({ student }: StudentInfoProps) {
  return (
    <div
      className="rounded-md p-4 mt-4 text-white text-[20px] shadow-sm text-center"
      style={{
        backgroundColor: '#7c0a0a'
      }}
    >
      <div>
        {student.title?.PRENAME_THAI_S}{student.FIRST_NAME_THAI} {student.LAST_NAME_THAI} ({student.major?.MAJOR_NAME_THAI})
      </div>
    </div>
  )
}
