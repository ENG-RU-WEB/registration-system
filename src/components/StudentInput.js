import React from 'react'

export default function StudentInput({ stdCode, setStdCode, onFetch, loading }) {
  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        placeholder="กรอกรหัสนักศึกษา"
        className="border px-3 py-2 w-full rounded"
        value={stdCode}
        onChange={e => setStdCode(e.target.value)}
      />
      <button
        onClick={onFetch}
        className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'กำลังโหลด...' : 'ตรวจสอบ'}
      </button>
    </div>
  )
}
