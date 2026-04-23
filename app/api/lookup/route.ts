import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hallTicket = searchParams.get('hall_ticket')?.trim().toUpperCase()

  if (!hallTicket) {
    return NextResponse.json({ error: 'Hall ticket required' }, { status: 400 })
  }

  // Use service role key — bypasses RLS for public kiosk reads
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('students')
    .select('student_name, branch, room_no, building, seat_no, exam_date, session')
    .ilike('hall_ticket', hallTicket)
    .order('exam_date', { ascending: true })
    .limit(1)  // always return only 1 result


  if (error) {
    console.error('Lookup error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

 // Save scan log
// Get college_id from students table
const { data: studentFull } = await supabase
  .from('students')
  .select('college_id')
  .ilike('hall_ticket', hallTicket)
  .limit(1)
  .single()

await supabase.from('scan_logs').insert({
  hall_ticket: hallTicket,
  student_name: data[0].student_name,
  branch: data[0].branch,
  room_no: data[0].room_no,
  building: data[0].building,
  seat_no: data[0].seat_no,
  exam_date: data[0].exam_date,
  session: data[0].session,
  college_id: studentFull?.college_id ?? null,
})

return NextResponse.json({ students: data })

}
