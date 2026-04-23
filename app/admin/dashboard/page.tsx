'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const [collegeName, setCollegeName] = useState('')
  const [studentCount, setStudentCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: college } = await supabase
        .from('colleges')
        .select('id, college_name')
        .eq('user_id', session.user.id)
        .single()

      if (college) {
        setCollegeName(college.college_name)
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('college_id', college.id)
        setStudentCount(count || 0)
      }
    }
    load()
  }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setStatus('Uploading and parsing...')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setStatus('Not logged in'); return }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('token', session.access_token)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const result = await res.json()

    if (result.success) {
      setStatus(`✓ ${result.count} students uploaded successfully!`)
      setStudentCount(prev => prev + result.count)
    } else {
      setStatus(`Error: ${result.error}`)
    }
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            {collegeName && (
              <p className="text-gray-500 mt-1 font-medium">{collegeName}</p>
            )}
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/auth/login'))}
            className="border border-red-300 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 text-sm"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-4xl font-black text-blue-600">{studentCount}</p>
            <p className="text-gray-500 text-sm mt-1">Total Students</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <a href="/student" target="_blank"
              className="text-green-600 font-semibold hover:underline text-sm">
              Open Kiosk Page ↗
            </a>
            <p className="text-gray-500 text-xs mt-1">Student-facing screen</p>
          </div>
        </div>

        {/* Excel Format Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">Excel Column Headers (Row 1 — exact names):</h2>
          <code className="text-xs text-blue-700 block bg-blue-100 p-2 rounded">
            hall_ticket | student_name | branch | room_no | building | seat_no | exam_date | session
          </code>
          <p className="text-xs text-blue-600 mt-2">
            Date format: <strong>YYYY-MM-DD</strong> &nbsp;|&nbsp; Session: <strong>FN</strong> or <strong>AN</strong>
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Upload Student Data</h2>
          <label className="block">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4 file:rounded-lg
                file:border-0 file:bg-blue-600 file:text-white
                file:cursor-pointer hover:file:bg-blue-700"
            />
          </label>
          {file && (
            <p className="text-sm text-gray-600">Selected: <strong>{file.name}</strong></p>
          )}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? 'Processing...' : 'Upload & Parse Excel'}
          </button>
          {status && (
            <p className={`text-center font-medium text-sm p-2 rounded ${
              status.startsWith('✓') ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'
            }`}>
              {status}
            </p>
          )}
        </form>
        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          <a href="/admin/students"
            className="inline-block bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-800 text-sm">
            View All Students →
          </a>
          <a href="/admin/scanlogs"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
            View Scan Logs →
          </a>
        </div>

      </div>
    </div>
  )
}
