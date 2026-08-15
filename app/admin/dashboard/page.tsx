import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { StatsCards } from '@/components/admin/StatsCards'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'FOUNDER'].includes(session.user?.role as string)) {
    redirect('/login')
  }

  const [totalUsers, activeUsers, totalSeries, totalChapters, totalViews, pendingPayments, pendingRequests, pendingReports] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.series.count({ where: { published: true } }),
      prisma.chapter.count({ where: { isPublished: true } }),
      prisma.series.aggregate({ _sum: { views: true } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.request.count({ where: { status: 'PENDING' } }),
      prisma.commentReport.count({ where: { status: 'PENDING' } }),
    ])

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: 'Users' },
    { label: 'Active Users', value: activeUsers, icon: 'User' },
    { label: 'Total Series', value: totalSeries, icon: 'Book' },
    { label: 'Total Chapters', value: totalChapters, icon: 'FileText' },
    { label: 'Total Views', value: totalViews._sum.views || 0, icon: 'Eye' },
    { label: 'Pending Payments', value: pendingPayments, icon: 'CreditCard' },
    { label: 'Pending Requests', value: pendingRequests, icon: 'Inbox' },
    { label: 'Pending Reports', value: pendingReports, icon: 'AlertTriangle' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-400">Welcome, {session.user.username}</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="glass-card p-6">
          <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/admin/series" className="block w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
              Manage Series
            </a>
            <a href="/admin/users" className="block w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
              Manage Users
            </a>
            <a href="/admin/payments" className="block w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
              Review Payments
            </a>
            <a href="/admin/settings" className="block w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
              System Settings
            </a>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">New user registered</span>
              <span className="text-xs text-gray-500">2 min ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Payment approved</span>
              <span className="text-xs text-gray-500">10 min ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">New chapter uploaded</span>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
