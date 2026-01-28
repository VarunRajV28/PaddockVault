'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const getTeamConfig = (team: string) => {
  const teamConfigs: Record<string, { bg: string; text: string; initial: string }> = {
    'ferrari': { bg: 'bg-red-600', text: 'text-white', initial: 'F' },
    'mercedes': { bg: 'bg-teal-400', text: 'text-black', initial: 'M' },
    'redbull': { bg: 'bg-blue-900', text: 'text-yellow-400', initial: 'R' },
    'mclaren': { bg: 'bg-orange-500', text: 'text-white', initial: 'M' },
    'alpine': { bg: 'bg-blue-500', text: 'text-white', initial: 'A' },
    'astonmartin': { bg: 'bg-green-600', text: 'text-white', initial: 'A' },
    'alphatauri': { bg: 'bg-slate-700', text: 'text-white', initial: 'A' },
    'alfaromeo': { bg: 'bg-red-800', text: 'text-white', initial: 'A' },
    'haas': { bg: 'bg-gray-200', text: 'text-red-600', initial: 'H' },
    'williams': { bg: 'bg-blue-400', text: 'text-white', initial: 'W' },
  }
  
  const normalized = team.toLowerCase().replace(/[^a-z]/g, '')
  return teamConfigs[normalized] || { bg: 'bg-zinc-900', text: 'text-white', initial: 'F' }
}

export function UserNav() {
  const router = useRouter()
  const [user, setUser] = React.useState<{ username: string; team: string }>({
    username: 'Guest',
    team: 'FIA',
  })

  React.useEffect(() => {
    // Read from localStorage
    const storedUser = localStorage.getItem('f1_user')
    const storedTeam = localStorage.getItem('f1_team')
    
    if (storedUser && storedTeam) {
      setUser({
        username: storedUser,
        team: storedTeam,
      })
    }
  }, [])

  const handleLogout = () => {
    // Clear all storage
    localStorage.clear()
    sessionStorage.clear()
    
    // Redirect to login
    router.push('/login')
  }

  const teamConfig = getTeamConfig(user.team)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 hover:bg-zinc-900 px-3 py-2 transition-colors group outline-none">
          <div className="text-right">
            <p className="text-sm font-black text-white uppercase tracking-wide font-mono">
              {user.team}
            </p>
            <p className="text-xs font-medium text-zinc-500">{user.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'size-10 flex items-center justify-center border-2 border-zinc-800',
                teamConfig.bg
              )}
            >
              <span className={cn('text-sm font-black', teamConfig.text)}>
                {teamConfig.initial}
              </span>
            </div>
            <ChevronDown className="size-4 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-2 border-zinc-800">
        <DropdownMenuLabel className="font-mono">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-black text-white uppercase tracking-wider">
              Signed in as
            </p>
            <p className="text-xs font-medium text-zinc-400">{user.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="font-bold text-red-500 hover:text-red-400 hover:bg-zinc-900 cursor-pointer uppercase tracking-wide focus:text-red-400 focus:bg-zinc-900"
        >
          <LogOut className="size-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
