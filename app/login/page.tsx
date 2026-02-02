'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // In our backend, username === team (e.g., 'ferrari', 'redbull', 'fia')
      const team = username.toLowerCase()

      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          team // Include team field as required by backend
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle 401/403 errors with backend error messages
        setError(data.error || 'Invalid credentials')
        setIsLoading(false)
        return
      }

      // Handle 200 response
      if (data.mfa_required) {
        // Store user info in sessionStorage for MFA verification
        sessionStorage.setItem('mfa_user', JSON.stringify({
          user_id: data.user_id,
          username: data.username,
          team: data.team,
        }))
        // Save to localStorage (keys: 'f1_user', 'f1_team')
        localStorage.setItem('f1_user', data.username)
        localStorage.setItem('f1_team', data.team)
        // Redirect to /auth/mfa
        router.push('/auth/mfa')
      } else {
        // Direct login without MFA (shouldn't happen with our setup)
        localStorage.setItem('f1_user', data.username)
        localStorage.setItem('f1_team', data.team)
        // Redirect to /dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      // Network error handling
      setError('Backend Offline - Failed to connect to server. Please ensure the backend is running.')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* F1-style Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `linear-gradient(45deg, transparent 49%, #E10600 49%, #E10600 51%, transparent 51%),
                           linear-gradient(-45deg, transparent 49%, #E10600 49%, #E10600 51%, transparent 51%)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Red accent bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E10600] to-transparent" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-zinc-950 border-2 border-zinc-800 shadow-2xl overflow-hidden">
          {/* Red accent bar */}
          <div className="h-2 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]" />

          <div className="p-10">
            {/* Header */}
            <div className="flex flex-col items-center gap-4 mb-10">
              <div className="relative w-48 h-24 flex items-center justify-center">
                <img
                  src="/fia-logo.svg"
                  alt="FIA Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                  Telemetry Access
                </h1>
                <div className="h-0.5 w-16 bg-[#E10600] mx-auto mt-2" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-950 border-l-4 border-[#E10600] text-red-200 text-sm font-semibold">
                  {error}
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Team Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter team username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="h-14 bg-black border-2 border-zinc-800 text-white text-lg font-medium placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-[#E10600] transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-black border-2 border-zinc-800 text-white text-lg font-medium placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-[#E10600] transition-all"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-[#E10600] hover:bg-red-700 text-white font-black tracking-wide text-base uppercase shadow-lg shadow-red-900/50 transition-all hover:shadow-xl hover:shadow-red-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating
                  </span>
                ) : (
                  'Access System'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 space-y-4">
              <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
              <p className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Authorized Access Only
              </p>
              <div className="flex justify-center gap-6 text-sm font-bold">
                <Link href="/register" className="text-[#E10600] hover:text-red-500 transition-colors uppercase tracking-wide">
                  Register
                </Link>
                <span className="text-zinc-700">•</span>
                <Link href="/setup-2fa" className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wide">
                  Setup 2FA
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom red accent bar */}
          <div className="h-2 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]" />
        </div>
      </div>

      {/* Red accent bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E10600] to-transparent" />
    </div>
  )
}
