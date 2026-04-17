import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Exam Room Finder',
  description: 'Find your exam room instantly by scanning your ID card',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
