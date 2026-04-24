'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Upload {
  id: string
  file_name: string
  record_count: number
  uploaded_at: string
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const [collegeName, setCollegeName] = useState('')
  const [studentCount, setStudentCount] = useState(0)
  const [collegeId, setCollegeId] = useState<string | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function loadData(cid: string) {
    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', cid)
    setStudentCount(count || 0)

    const { data: uploadData } = await supabase
      .from('uploads')
      .select('*')
      .eq('college_id', cid)
      .order('uploaded_at', { ascending: false })
    setUploads(uploadData || [])
  }

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
        setCollegeId(college.id)
        await loadData(college.id)
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
      setFile(null)
      setShowUploadForm(false)
      if (collegeId) await loadData(collegeId)
    } else {
      setStatus(`Error: ${result.error}`)
    }
    setUploading(false)
  }

  async function handleDeleteUpload(uploadId: string) {
    const confirm = window.confirm('Delete this upload record?')
    if (!confirm) return

    await supabase.from('uploads').delete().eq('id', uploadId)
    if (collegeId) await loadData(collegeId)
    setStatus('✓ Upload record deleted.')
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

        {/* Uploaded Sheets */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700 text-lg">📂 Uploaded Sheets</h2>
            <button
              onClick={() => { setShowUploadForm(!showUploadForm); setStatus('') }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              + Add New Sheet
            </button>
          </div>

          {uploads.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No sheets uploaded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-500 font-medium">File Name</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Records</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Uploaded On</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-700">📄 {u.file_name}</td>
                    <td className="py-3 text-blue-600 font-bold">{u.record_count}</td>
                    <td className="py-3 text-gray-500">
                      {new Date(u.uploaded_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDeleteUpload(u.id)}
                        className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <form onSubmit={handleUpload} className="bg-white rounded-xl shadow p-6 space-y-4 mb-6">
            <h2 className="font-semibold text-gray-700">Upload New Sheet</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2 text-sm">Excel Column Headers (Row 1):</h3>
              <code className="text-xs text-blue-700 block bg-blue-100 p-2 rounded">
                hall_ticket | student_name | branch | room_no | building | seat_no | exam_date | session
              </code>
              <p className="text-xs text-blue-600 mt-2">
                Date format: <strong>YYYY-MM-DD</strong> &nbsp;|&nbsp; Session: <strong>FN</strong> or <strong>AN</strong>
              </p>
            </div>
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
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading || !file}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? 'Processing...' : 'Upload & Parse Excel'}
              </button>
              <button
                type="button"
                onClick={() => { setShowUploadForm(false); setStatus('') }}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
            {status && (
              <p className={`text-center font-medium text-sm p-2 rounded ${
                status.startsWith('✓') ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'
              }`}>
                {status}
              </p>
            )}
          </form>
        )}

        {/* Status outside form */}
        {status && !showUploadForm && (
          <p className={`text-center font-medium text-sm p-2 rounded mb-4 ${
            status.startsWith('✓') ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'
          }`}>
            {status}
          </p>
        )}

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
