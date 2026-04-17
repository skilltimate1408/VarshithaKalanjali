'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  hall_ticket: string
  student_name: string
  branch: string
  room_no: string
  building: string
  seat_no: string
  exam_date: string
  session: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: college } = await supabase
        .from('colleges')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (!college) return

      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('college_id', college.id)
        .order('hall_ticket')

      setStudents(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = students.filter(s =>
    s.hall_ticket?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.room_no?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('Delete this student record?')) return
    await supabase.from('students').delete().eq('id', id)
    setStudents(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Students</h1>
            <p className="text-gray-500 text-sm mt-1">{students.length} total records</p>
          </div>
          <a href="/admin/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </a>
        </div>

        <input
          type="text"
          placeholder="Search by hall ticket, name, or room..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No students found.</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {['Hall Ticket','Name','Branch','Room','Building','Seat','Date','Session',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{s.hall_ticket}</td>
                    <td className="px-4 py-2 font-medium">{s.student_name}</td>
                    <td className="px-4 py-2 text-gray-600">{s.branch}</td>
                    <td className="px-4 py-2 font-bold text-blue-700">{s.room_no}</td>
                    <td className="px-4 py-2">{s.building}</td>
                    <td className="px-4 py-2 font-bold text-green-700">{s.seat_no}</td>
                    <td className="px-4 py-2 text-gray-600 text-xs">{s.exam_date}</td>
                    <td className="px-4 py-2 text-gray-600">{s.session}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
