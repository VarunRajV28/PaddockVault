'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Database,
  KeyRound,
  FileText,
  ChevronRight,
  Menu,
  X,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserNav } from '@/components/user-nav'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Database, label: 'Telemetry', href: '/dashboard/telemetry' },
  { icon: Upload, label: 'Upload', href: '/dashboard/upload' },
  { icon: KeyRound, label: 'Encryption Tools', href: '/dashboard/encryption' },
  { icon: FileText, label: 'Audit Logs', href: '/dashboard/logs' },
]

function Sidebar({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-zinc-950 border-r-2 border-zinc-800 transition-all duration-300',
        expanded ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b-2 border-zinc-800 bg-black">
        {expanded && (
          <div className="flex items-center gap-2">
            <div className="size-8 bg-[#E10600] flex items-center justify-center">
              <span className="text-white font-black text-sm">F1</span>
            </div>
            <span className="text-sm font-black text-white uppercase tracking-wider">
              Gateway
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('size-8 hover:bg-zinc-800 hover:text-white', !expanded && 'mx-auto')}
        >
          {expanded ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>

      {/* Red accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#E10600] to-transparent" />

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-3 text-sm font-bold uppercase tracking-wide transition-all',
                isActive
                  ? 'bg-[#E10600] text-white border-l-4 border-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-l-4 hover:border-[#E10600]'
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {expanded && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* System Status */}
      {expanded && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black p-4 border-2 border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E10600] opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-[#E10600]" />
              </span>
              <span className="text-xs font-black text-[#E10600] uppercase tracking-wide">
                System Secure
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-semibold">
              All protocols nominal
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}

function TopBar({ sidebarExpanded }: { sidebarExpanded: boolean }) {
  const pathname = usePathname()

  const getBreadcrumbs = () => {
    if (pathname === '/dashboard') {
      return ['Dashboard', 'Overview']
    }
    if (pathname === '/dashboard/telemetry') {
      return ['Dashboard', 'Telemetry', 'Repository']
    }
    if (pathname.startsWith('/dashboard/telemetry/')) {
      const id = pathname.split('/').pop()
      return ['Dashboard', 'Telemetry', id || 'Detail']
    }
    if (pathname === '/dashboard/upload') {
      return ['Dashboard', 'Secure Upload']
    }
    return ['Dashboard']
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-zinc-950 border-b-2 border-zinc-800 flex items-center justify-between px-6 transition-all duration-300',
        sidebarExpanded ? 'left-60' : 'left-16'
      )}
    >
      {/* Red accent bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#E10600] to-transparent" />
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm font-bold">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb}>
            {index > 0 && <ChevronRight className="size-4 text-zinc-600" />}
            <span
              className={
                index === breadcrumbs.length - 1
                  ? 'text-white uppercase tracking-wide'
                  : 'text-zinc-500 uppercase tracking-wide'
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* User Navigation */}
      <UserNav />
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarExpanded, setSidebarExpanded] = React.useState(true)

  return (
    <div className="min-h-screen bg-black">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />
      <TopBar sidebarExpanded={sidebarExpanded} />

      <main
        className={cn(
          'pt-16 transition-all duration-300 min-h-screen',
          sidebarExpanded ? 'pl-60' : 'pl-16'
        )}
      >
        {/* F1-style background pattern */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(45deg, transparent 49%, #E10600 49%, #E10600 51%, transparent 51%),
                             linear-gradient(-45deg, transparent 49%, #E10600 49%, #E10600 51%, transparent 51%)`,
            backgroundSize: '60px 60px',
          }} />
        </div>
        <div className="p-6">{children}</div>
      </main>

      <Toaster position="bottom-right" />
    </div>
  )
}
