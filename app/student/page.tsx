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

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col text-white">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-blue-950/60 border-b border-blue-700/40 shrink-0">
      
        {/* Logo + Title together */}
        <div className="flex items-center gap-3 justify-center w-full">
         
          <Image
            src="/logo.png"
            alt="Varshi Innovations"
            width={170}
            height={170}
            className="rounded-full object-contain"
          />
           <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Exam Room Finder
            </h1>
         

            <p className="text-blue-200 text-sm sm:text-base mt-1">Scan your ID card barcode</p>
            

          </div>
        </div>

        {/* Status indicator */}
        
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 gap-3 sm:gap-4 min-h-0">

        {/* Input box */}
        <div className="w-full max-w-lg shrink-0">
          <div className="flex gap-2">
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
              placeholder="Scan or type hall ticket..."
              className="flex-1 text-base sm:text-xl px-4 py-3 rounded-xl text-gray-900 bg-white border-4 border-yellow-400 focus:outline-none focus:border-yellow-300 font-mono tracking-widest"
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
              className="bg-yellow-400 text-blue-900 px-5 py-3 rounded-xl text-base sm:text-lg font-black hover:bg-yellow-300 disabled:opacity-40 transition-colors shrink-0"
            >
              {loading ? '...' : 'GO'}
            </button>
          </div>
          <div className="mt-1 text-center text-xs min-h-[16px]">
            {!loading && inputValue && results.length > 0 && (
              <span className="text-blue-300">Hall ticket clears in 5s</span>
            )}
            {!loading && !inputValue && results.length === 0 && !error && (
              <span className="text-blue-400">Scan barcode or type hall ticket above</span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="w-full max-w-lg bg-red-500 text-white px-4 py-3 rounded-xl text-sm sm:text-base font-semibold text-center shrink-0">
            ❌ {error}
          </div>
        )}

        {/* Idle */}
        {!loading && !error && results.length === 0 && !inputValue && (
          <div className="text-center text-blue-300 shrink-0">
            <div className="text-4xl sm:text-5xl mb-2">📷</div>
            <p className="text-base sm:text-lg font-semibold">Ready to Scan</p>
            <p className="text-xs sm:text-sm mt-1">Point scanner at barcode on ID card</p>
          </div>
        )}

        {/* Result — fits in screen, no scroll */}
        {results.length > 0 && results.map((s, i) => (
          <div key={i} className="w-full max-w-lg bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden shrink-0">

            {/* Green header */}
            <div className="bg-green-500 text-white text-center py-2 px-4">
              <p className="text-sm sm:text-base font-bold">✓ Seat Details Found</p>
            </div>

            <div className="p-3 sm:p-4">
              {/* Name */}
              <h2 className="text-lg sm:text-2xl font-black text-blue-900 text-center border-b pb-2 mb-3">
                {s.student_name}
              </h2>

              {/* Room / Building / Seat — 3 cols */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-blue-50 rounded-xl p-2 sm:p-3 text-center border-2 border-blue-200">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Room</p>
                  <p className="text-3xl sm:text-4xl font-black text-blue-700 leading-none">{s.room_no}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-2 sm:p-3 text-center border-2 border-purple-200">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Building</p>
                  <p className="text-xl sm:text-2xl font-black text-purple-700 leading-none break-words">{s.building}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-2 sm:p-3 text-center border-2 border-green-200">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Seat</p>
                  <p className="text-3xl sm:text-4xl font-black text-green-700 leading-none">{s.seat_no}</p>
                </div>
              </div>

              {/* Branch + Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-xl p-2 text-center">
                  <p className="text-gray-400 text-xs uppercase">Branch</p>
                  <p className="font-bold text-gray-700 text-sm sm:text-base">{s.branch}</p>
                </div>
                {s.exam_date && (
                  <div className="bg-yellow-50 rounded-xl p-2 text-center">
                    <p className="text-gray-400 text-xs uppercase">Date & Session</p>
                    <p className="font-bold text-gray-700 text-xs sm:text-sm">{s.exam_date} — {s.session}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 text-center py-2 border-t">
              <p className="text-xs text-gray-400">Scan next barcode to continue</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 text-center py-2 bg-blue-950/40 border-t border-blue-700/30">
        <p className="text-blue-300 text-sm sm:text-base font-semibold">© All Rights Reserved · Dumpala Varshitha Reddy</p>

      </div>

    </div>
  )
}