import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const token = formData.get('token') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!token) return NextResponse.json({ error: 'No auth token' }, { status: 401 })

    // Use service role to bypass RLS issues
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: ' + userError?.message }, { status: 401 })
    }

    // Get college using the verified user id
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (collegeError || !college) {
      return NextResponse.json({ 
        error: `College not found for user ${user.id}. Error: ${collegeError?.message}` 
      }, { status: 404 })
    }

    // Parse Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 })
    }

    const students = rows.map(row => {
      const get = (...keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== '') return String(row[k]).trim()
        }
        return ''
      }

      const examDateRaw = get('exam_date', 'Exam Date', 'EXAM_DATE', 'DATE', 'date')
      let examDate: string | null = null
      if (examDateRaw) {
        const d = new Date(examDateRaw)
        if (!isNaN(d.getTime())) {
          examDate = d.toISOString().split('T')[0]
        } else {
          examDate = examDateRaw
        }
      }

      return {
        college_id: college.id,
        hall_ticket: get('hall_ticket', 'Hall Ticket', 'HALL_TICKET', 'hallticket').toUpperCase(),
        student_name: get('student_name', 'Student Name', 'NAME', 'name'),
        branch: get('branch', 'Branch', 'BRANCH', 'dept', 'Department'),
        room_no: get('room_no', 'Room No', 'ROOM_NO', 'Room', 'ROOM', 'room'),
        building: get('building', 'Building', 'BUILDING', 'Block', 'BLOCK'),
        seat_no: get('seat_no', 'Seat No', 'SEAT_NO', 'Seat', 'SEAT', 'seat'),
        exam_date: examDate,
        session: get('session', 'Session', 'SESSION'),
      }
    }).filter(s => s.hall_ticket !== '')

    if (students.length === 0) {
      return NextResponse.json({ error: 'No valid rows found. Check column headers.' }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from('students')
      .upsert(students, { onConflict: 'college_id,hall_ticket,exam_date' })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: students.length })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
