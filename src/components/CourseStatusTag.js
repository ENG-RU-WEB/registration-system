export default function CourseStatusTag({ status }) {
  if (!status) return null

  if (status.type === 'grade') {
    return (
      <span className="text-green-600 font-semibold ml-2">
        ✔️ เกรด {status.grade}
      </span>
    )
  }

  if (status.type === 'transfer') {
    return (
      <span className="text-blue-600 font-semibold ml-2">
        🔠 เทียบโอน
      </span>
    )
  }

  if (status.type === 'fail') {
    return (
      <span className="text-red-600 font-semibold ml-2">
        ❌ ยังไม่ผ่าน
      </span>
    )
  }

  return null
}
