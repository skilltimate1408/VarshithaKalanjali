'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface ScanLog {
  id: number
  hall_ticket: string
  student_name: string
  branch: string
  room_no: string
  building: string
  seat_no: string
  exam_date: string
  session: string
  scanned_at: string
}

export default function ScanLogs() {
  const [logs, setLogs] = useState<ScanLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

           const { data } = await supabase
        .from('scan_logs')
        .select('*')
        .order('scanned_at', { ascending: false })

      console.log('scan logs data:', data)


      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Scan Logs</h1>
          <a href="/admin/dashboard"
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm">
            ← Back to Dashboard
          </a>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <p className="text-center py-10 text-gray-400">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-10 text-gray-400">No scans yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Hall Ticket</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Branch</th>
                  <th className="px-4 py-3 text-left">Room</th>
                  <th className="px-4 py-3 text-left">Building</th>
                  <th className="px-4 py-3 text-left">Seat</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Session</th>
                  <th className="px-4 py-3 text-left">Scanned At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{log.hall_ticket}</td>
                    <td className="px-4 py-3 font-semibold">{log.student_name}</td>
                    <td className="px-4 py-3">{log.branch}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">{log.room_no}</td>
                    <td className="px-4 py-3">{log.building}</td>
                    <td className="px-4 py-3 font-bold text-green-600">{log.seat_no}</td>
                    <td className="px-4 py-3">{log.exam_date}</td>
                    <td className="px-4 py-3">{log.session}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(log.scanned_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          Total: {logs.length} scans
        </p>
      </div>
    </div>
  )
}
