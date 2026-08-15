'use client'

import { Users, User, Book, FileText, Eye, CreditCard, Inbox, AlertTriangle } from 'lucide-react'

const iconMap = {
  Users,
  User,
  Book,
  FileText,
  Eye,
  CreditCard,
  Inbox,
  AlertTriangle,
}

interface StatsCardProps {
  stats: Array<{
    label: string
    value: number
    icon: keyof typeof iconMap
  }>
}

export function StatsCards({ stats }: StatsCardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon]
        return (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/20">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
