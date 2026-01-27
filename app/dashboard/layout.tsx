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
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300',
        expanded ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {expanded && (
          <div className="flex items-center gap-2">
            <div className="size-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F1</span>
            </div>
            <span className="font-mono text-sm font-semibold text-foreground">
              GATEWAY
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('size-8', !expanded && 'mx-auto')}
        >
          {expanded ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-mono transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
          <div className="rounded-md bg-background p-3 border border-border">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-success" />
              </span>
              <span className="text-xs font-mono text-success">
                System Secure
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
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
  const router = useRouter()

  const handleLogout = () => {
    router.push('/login')
  }

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
        'fixed top-0 right-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-6 transition-all duration-300',
        sidebarExpanded ? 'left-60' : 'left-16'
      )}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm font-mono">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb}>
            {index > 0 && <ChevronRight className="size-4 text-muted-foreground" />}
            <span
              className={
                index === breadcrumbs.length - 1
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* User Badge */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 font-mono text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          Logout
        </Button>
        <div className="text-right">
          <p className="text-sm font-mono text-foreground">Varun</p>
          <p className="text-xs font-mono text-muted-foreground">
            Principal Engineer
          </p>
        </div>
        <div className="relative">
          <div className="size-10 rounded-full bg-secondary flex items-center justify-center border border-border">
            <span className="text-sm font-semibold text-foreground">VP</span>
          </div>
          <span className="absolute bottom-0 right-0 block size-3 rounded-full bg-success ring-2 ring-card" />
        </div>
      </div>
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
    <div className="min-h-screen bg-background scanlines">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />
      <TopBar sidebarExpanded={sidebarExpanded} />

      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarExpanded ? 'pl-60' : 'pl-16'
        )}
      >
        <div className="p-6">{children}</div>
      </main>

      <Toaster position="bottom-right" />
    </div>
  )
}
