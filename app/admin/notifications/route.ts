'use client'

import { useEffect, useState } from 'react'

type Notification = {
  id: string
  type: string
  title: string | null
  message: string | null
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  async function loadNotifications() {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id?: string) {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        id ? { notificationId: id } : {}
      ),
    })

    setNotifications(current =>
      id
        ? current.map(item =>
            item.id === id
              ? { ...item, isRead: true }
              : item
          )
        : current.map(item => ({
            ...item,
            isRead: true,
          }))
    )
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-6 text-white">
        <p>Memuat notifikasi...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Notifications
          </h1>

          {notifications.some(item => !item.isRead) && (
            <button
              onClick={() => markRead()}
              className="text-sm text-blue-400"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-6 text-center text-gray-400">
            Belum ada notifikasi.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() =>
                  !notification.isRead &&
                  markRead(notification.id)
                }
                className={`w-full rounded-xl border p-4 text-left transition ${
                  notification.isRead
                    ? 'border-white/10 bg-white/5'
                    : 'border-blue-500/30 bg-blue-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">
                      {notification.title || 'Notifikasi'}
                    </h2>

                    <p className="mt-1 text-sm text-gray-300">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(
                        notification.createdAt
                      ).toLocaleString('id-ID')}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
