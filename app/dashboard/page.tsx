'use client'

import React, { useEffect, useState } from "react"
import {
  ShieldCheck,
  Server,
  Lock,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
  nodes: number
  files: number
  logs: Array<{
    id: number
    timestamp: string
    user: string
    action: string
  }>
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="bg-zinc-950 border-2 border-zinc-800 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          {title}
        </CardTitle>
        <Icon className={`size-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ nodes: 0, files: 0, logs: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard data from backend
    fetch('http://localhost:5000/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch dashboard stats:', err)
        setLoading(false)
      })
  }, [])

  // Format UTC timestamp to user's local time
  const formatLocalTime = (utcString: string) => {
    // Append 'Z' to force UTC parsing if not already present
    const isoString = utcString.endsWith('Z') ? utcString : utcString + 'Z'
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour12: false })
  }

  const statsCards = [
    {
      title: 'System Integrity',
      value: '100%',
      icon: ShieldCheck,
      color: 'text-[#E10600]',
    },
    {
      title: 'Active Nodes',
      value: loading ? '...' : stats.nodes.toString(),
      icon: Server,
      color: 'text-white',
    },
    {
      title: 'Encryption Protocol',
      value: 'AES-256-GCM',
      icon: Lock,
      color: 'text-white',
    },
    {
      title: 'Encrypted Files',
      value: loading ? '...' : stats.files.toString(),
      icon: AlertTriangle,
      color: 'text-[#E10600]',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-[#E10600] pl-4">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Mission Control
        </h1>
        <p className="text-sm text-zinc-400 font-semibold mt-1 uppercase tracking-wide">
          F1 Secure Gateway Dashboard
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Live System Feed */}
      <Card className="bg-zinc-950 border-2 border-zinc-800 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black text-white uppercase tracking-wide">
              Live System Feed
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E10600] opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-[#E10600]" />
              </span>
              <span className="text-xs font-black text-[#E10600] uppercase tracking-wider">LIVE</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-zinc-400 py-8">Loading activity logs...</div>
            ) : stats.logs.length === 0 ? (
              <div className="text-center text-zinc-400 py-8">No recent activity</div>
            ) : (
              stats.logs.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-3 bg-black border-l-2 border-zinc-800 hover:border-[#E10600] transition-all"
                >
                  <span className="text-xs font-bold text-[#E10600] shrink-0 uppercase tracking-wider">
                    {formatLocalTime(event.timestamp)}
                  </span>
                  <span className="text-sm font-semibold text-zinc-300">
                    {event.user}: {event.action}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
