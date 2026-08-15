'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AnnouncementProps {
  content: string
}

export function Announcement({ content }: AnnouncementProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="glass mb-4 p-3 rounded-lg flex items-center justify-between">
      <p className="text-sm text-primary">{content}</p>
      <button
        onClick={() => setVisible(false)}
        className="p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
