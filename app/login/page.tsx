'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const teams = [
  { value: 'fia', label: 'FIA' },
  { value: 'ferrari', label: 'Ferrari' },
  { value: 'redbull', label: 'Red Bull' },
  { value: 'mclaren', label: 'McLaren' },
]

// Hardcoded credentials for each team
const credentials = {
  fia: { username: 'admin', password: 'fia123' },
  ferrari: { username: 'admin', password: 'ferrari123' },
  mclaren: { username: 'admin', password: 'mclaren123' },
  redbull: { username: 'admin', password: 'redbull123' },
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [team, setTeam] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    // Validate credentials
    const teamCreds = credentials[team as keyof typeof credentials]
    if (!teamCreds || username !== teamCreds.username || password !== teamCreds.password) {
      setIsLoading(false)
      setError('Invalid credentials. Please check your username, password, and team selection.')
      return
    }
    
    // Simulate handshake delay
    setTimeout(() => {
      router.push('/auth/mfa')
    }, 1500)
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1541443131876-44b03de101c5?q=80&w=2070&auto=format&fit=crop)',
        }}
      />
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-md bg-black/50 border border-border rounded-lg p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
              <Shield className="size-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold font-mono text-foreground tracking-wider">
              FIA TELEMETRY ACCESS
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/20 border border-destructive/50 rounded text-destructive text-sm font-mono">
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-mono text-muted-foreground">
                USERNAME / TEAM ID
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter credentials..."
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 bg-black/30 border-0 border-b-2 border-muted rounded-none font-mono text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary transition-colors"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-mono text-muted-foreground">
                PASSWORD
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-black/30 border-0 border-b-2 border-muted rounded-none font-mono text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary transition-colors"
              />
            </div>

            {/* Team Select */}
            <div className="space-y-2">
              <Label htmlFor="team" className="text-sm font-mono text-muted-foreground">
                TEAM IDENTITY
              </Label>
              <Select required value={team} onValueChange={setTeam}>
                <SelectTrigger 
                  id="team"
                  className="h-12 bg-black/30 border-0 border-b-2 border-muted rounded-none font-mono text-foreground focus:ring-0 focus:border-primary transition-colors"
                >
                  <SelectValue placeholder="Select team..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border font-mono">
                  {teams.map((team) => (
                    <SelectItem 
                      key={team.value} 
                      value={team.value}
                      className="font-mono"
                    >
                      {team.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold tracking-wider text-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  INITIATING...
                </span>
              ) : (
                'INITIATE HANDSHAKE'
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs font-mono text-muted-foreground mt-6">
            Authorized personnel only. All access is logged.
          </p>
        </div>
      </div>
    </div>
  )
}
