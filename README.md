# Exam Room Finder

## Setup Steps

### 1. Install dependencies
```
npm install
```

### 2. Create .env.local
Copy `.env.local.example` → rename to `.env.local` → fill in your Supabase keys.

### 3. Setup Supabase
- Go to supabase.com → your project → SQL Editor
- Paste and run the contents of `SUPABASE_SETUP.sql`

### 4. Run
```
npm run dev
```

Open http://localhost:3000

## Pages
- `/auth/signup` — College registration
- `/auth/login` — College login
- `/admin/dashboard` — Upload Excel
- `/admin/students` — View all students
- `/student` — Kiosk page (open on Raspberry Pi)

## Excel Format
Row 1 must have these exact headers:
```
hall_ticket | student_name | branch | room_no | building | seat_no | exam_date | session
```
