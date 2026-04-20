'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

interface StudentData {
  student_name: string
  branch: string
  room_no: string
  building: string
  seat_no: string
  exam_date: string
  session: string
}

export default function StudentKiosk() {
  const [results, setResults] = useState<StudentData[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const bufferRef = useRef('')
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clearInputRef = useRef<NodeJS.Timeout | null>(null)
  const lockRef = useRef(false)
  const hasResultRef = useRef(false)

  const lookup = useCallback(async (ticket: string) => {
    const clean = ticket.replace(/\s/g, '').toUpperCase()
    if (!clean || clean.length < 3) return
    if (lockRef.current) return
    lockRef.current = true

    if (clearInputRef.current) clearTimeout(clearInputRef.current)

    setResults([])
    setError('')
    setInputValue(clean)
    setLoading(true)
    hasResultRef.current = false

    try {
      const res = await fetch(`/api/lookup?hall_ticket=${encodeURIComponent(clean)}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error === 'Student not found'
          ? 'Hall ticket not found. Contact exam cell.'
          : data.error)
      } else {
        setResults(data.students.slice(0, 1)) // only 1 result
        hasResultRef.current = true
      }
    } catch {
      setError('Network error. Try again.')
    }

    setLoading(false)
    bufferRef.current = ''
    lockRef.current = false

    // Clear input after 5 seconds
    clearInputRef.current = setTimeout(() => {
      setInputValue('')
    }, 5000)
  }, [])

  useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      // If user is typing manually in the input box, skip global handler
      if (document.activeElement?.tagName === 'INPUT') return


      if (e.key === 'Enter') {
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
        const val = bufferRef.current.trim()
        bufferRef.current = ''
        if (val.length >= 3) lookup(val)
        return
      }

      if (e.key === 'Backspace') {
        bufferRef.current = bufferRef.current.slice(0, -1)
        setInputValue(bufferRef.current)
        return
      }

      if (e.key.length === 1) {
        if (hasResultRef.current) {
          setResults([])
          setError('')
          hasResultRef.current = false
          if (clearInputRef.current) clearTimeout(clearInputRef.current)
        }
        bufferRef.current += e.key.toUpperCase()
        setInputValue(bufferRef.current)

        if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
        scanTimerRef.current = setTimeout(() => {
          const val = bufferRef.current.trim()
          bufferRef.current = ''
          if (val.length >= 3) lookup(val)
        }, 300)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lookup])

  useEffect(() => {
    return () => {
     if (clearInputRef.current) clearTimeout(clearInputRef.current)
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
    }
  }, [])

  const hasResult = results.length > 0

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col text-white">

      {/* ── TOP BAR: logo + title + input ── */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-blue-700/40 bg-blue-900/50 shrink-0 justify-between relative">

        {/* Logo + title stacked on left */}
                <div className="flex items-center gap-2 shrink-0">

          <Image
            src="/logo.png"
            alt="Varshi Innovations"
            width={80}
            height={80}
            className="rounded-full object-contain w-20 h-20"
          />
                              <h1 className="font-black text-3xl leading-tight text-center mt-1">Exam Room Finder</h1>


        </div>
        {/* Input stretches to fill remaining space */}
                <div className="flex gap-1 w-100 absolute left-1/2 -translate-x-1/2">


          <input
            type="text"
            value={inputValue}
            onChange={e => {
              const val = e.target.value.toUpperCase()
              setInputValue(val)
              bufferRef.current = val
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && inputValue.trim()) {
                if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
                const val = inputValue.trim()
                bufferRef.current = ''
                lookup(val)
              }
            }}
            placeholder="Scan or Enter Hall Ticket No."
            //className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg text-gray-900 bg-white border-2 border-yellow-400 focus:outline-none focus:border-yellow-300 font-mono tracking-widest"
            className="flex-1 min-w-0 text-lg px-4 py-3 rounded-lg text-gray-900 bg-white border-2 border-yellow-400 focus:outline-none focus:border-yellow-300 font-mono tracking-widest"

            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={() => {
              if (inputValue.trim()) {
                if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
                lookup(inputValue.trim())
              }
            }}
            disabled={loading}
            //className="bg-yellow-400 text-blue-900 px-3 py-2 rounded-lg font-black text-sm hover:bg-yellow-300 disabled:opacity-40 transition-colors shrink-0"
                  className="bg-yellow-400 text-blue-900 px-5 py-3 rounded-lg font-black text-lg hover:bg-yellow-300 disabled:opacity-40 transition-colors shrink-0"

          >
            {loading ? '…' : 'GO'}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-3 py-3 gap-3">

        {/* Status messages */}
        {loading && (
          <p className="text-yellow-300 animate-pulse text-sm font-semibold">Searching...</p>
        )}

        {error && (
          <div className="w-full max-w-md bg-red-500 text-white px-4 py-3 rounded-xl text-sm font-semibold text-center">
            ❌ {error}
          </div>
        )}

        {/* Idle state */}
        {!loading && !error && !hasResult && !inputValue && (
          <div className="text-center text-blue-300">
            <div className="text-4xl mb-2"></div>
                        <p className="text-3xl font-semibold">Ready to Scan</p>
            <p className="text-lg mt-1 text-blue-400">Scan barcode or type hall ticket number</p>

          </div>
        )}

        {/* Result card */}
        {hasResult && results.map((s, i) => (
          <div key={i} className="w-full max-w-md bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden">

            <div className="bg-green-500 text-white text-center py-2 px-4">
              <p className="text-sm font-bold">✓ Seat Details Found</p>
            </div>

            <div className="p-3">
              <h2 className="text-3xl font-black text-blue-900 text-center border-b pb-2 mb-3">

                {s.student_name}
              </h2>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-blue-50 rounded-xl p-2 text-center border-2 border-blue-200">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Room</p>
                                    <p className="text-5xl font-black text-blue-700 leading-none">{s.room_no}</p>

                </div>
                <div className="bg-purple-50 rounded-xl p-2 text-center border-2 border-purple-200">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Building</p>
                                    <p className="text-2xl font-black text-purple-700 leading-none break-words">{s.building}</p>

                </div>
                <div className="bg-green-50 rounded-xl p-2 text-center border-2 border-green-200">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Seat</p>
                                    <p className="text-5xl font-black text-green-700 leading-none">{s.seat_no}</p>

                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-xl p-2 text-center">
                  <p className="text-gray-400 text-[10px] uppercase">Branch</p>
                                   <p className="font-bold text-gray-700 text-xl">{s.branch}</p>

                </div>
                {s.exam_date && (
                  <div className="bg-yellow-50 rounded-xl p-2 text-center">
                    <p className="text-gray-400 text-[10px] uppercase">Date & Session</p>
                                        <p className="font-bold text-gray-700 text-lg">{s.exam_date} — {s.session}</p>

                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 text-center py-1.5 border-t">
              <p className="text-[10px] text-gray-400">Scan next barcode to continue · clears in 5s</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 text-center py-1 bg-blue-950/40 border-t border-blue-700/30">
        <p className="text-blue-400 text-[10px]">© All Rights Reserved · Dumpala Varshitha Reddy</p>
      </div>

    </div>
  )
}