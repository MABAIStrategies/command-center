import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Command Center | MAB AI Strategies',
  description: 'AI-powered command center with agentic task execution',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-command-bg text-command-text">{children}</body>
    </html>
  )
}
