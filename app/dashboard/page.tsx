import React from "react"
import {
  ShieldCheck,
  Server,
  Lock,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  {
    title: 'System Integrity',
    value: '100%',
    icon: ShieldCheck,
    color: 'text-emerald-500',
  },
  {
    title: 'Active Nodes',
    value: '14',
    icon: Server,
    color: 'text-foreground',
  },
  {
    title: 'Encryption Protocol',
    value: 'AES-256-GCM',
    icon: Lock,
    color: 'text-blue-500',
  },
  {
    title: 'Threats Blocked',
    value: '3',
    icon: AlertTriangle,
    color: 'text-red-500',
  },
]

const recentEvents = [
  { time: '14:32:01', message: 'User Varun accessed Telemetry Repository' },
  { time: '14:31:45', message: 'Key Exchange initiated with Node-07' },
  { time: '14:30:22', message: 'Encrypted packet PKT-0847 verified' },
  { time: '14:29:58', message: 'System integrity check completed' },
  { time: '14:28:12', message: 'New session established: AES-256-GCM' },
  { time: '14:27:44', message: 'Threat blocked: Unauthorized access attempt' },
  { time: '14:26:33', message: 'Telemetry sync completed for Monza circuit' },
]

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
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground font-mono">
          {title}
        </CardTitle>
        <Icon className={`size-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-mono">
          Mission Control
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          F1 Secure Gateway Dashboard
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Live System Feed */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-mono text-foreground">
              Live System Feed
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-success" />
              </span>
              <span className="text-xs font-mono text-success">LIVE</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 rounded-md bg-background border border-border"
              >
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {event.time}
                </span>
                <span className="text-sm font-mono text-foreground">
                  {event.message}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
