'use client'

interface Props {
  stdCode: string
  setStdCode: (value: string) => void
  loading: boolean
  handleFetch: () => void
}

export function GraduationHeader({ stdCode, setStdCode, loading, handleFetch }: Props) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #7c0a0a' }}>
      <h1 className="text-xl font-bold text-red-800 mb-3">ระบบตรวจสอบการจบการศึกษาของนักศึกษา</h1>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="กรอกรหัสนักศึกษา"
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-700"
          value={stdCode}
          onChange={(e) => setStdCode(e.target.value)}
        />
        <button
          onClick={handleFetch}
          disabled={loading}
          className="text-white px-4 py-2 rounded"
            style={{ backgroundColor: '#7c0a0a' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c43636ff'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#7c0a0a'}
          >
          {loading ? 'กำลังโหลด...' : 'ตรวจสอบ'}
        </button>
      </div>
    </div>
  )
}
