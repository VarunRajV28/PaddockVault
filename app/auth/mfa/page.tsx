'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function MFAPage() {
  const router = useRouter()
  const [value, setValue] = React.useState('')
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [error, setError] = React.useState('')
  const [userInfo, setUserInfo] = React.useState<{
    user_id: number
    username: string
    team: string
  } | null>(null)

  React.useEffect(() => {
    // Get user info from sessionStorage
    const storedUser = sessionStorage.getItem('mfa_user')
    if (!storedUser) {
      // No user info, redirect to login
      router.push('/login')
      return
    }
    setUserInfo(JSON.parse(storedUser))
  }, [router])

  React.useEffect(() => {
    // Auto-verify when 6 digits are entered
    if (value.length === 6 && !isVerifying) {
      handleVerify()
    }
  }, [value])

  const handleVerify = async () => {
    if (value.length !== 6 || !userInfo) return
    
    setIsVerifying(true)
    setError('')
    
    try {
      const response = await fetch(`${API_URL}/api/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userInfo.user_id,
          username: userInfo.username,
          team: userInfo.team,
          code: value,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Verification failed')
        setValue('') // Clear the input
        setIsVerifying(false)
        toast.error('Invalid verification code')
        return
      }

      // Store token
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      // Store user session data for dashboard
      sessionStorage.setItem('team', userInfo.team)
      sessionStorage.setItem('username', userInfo.username)

      // Clear session storage
      sessionStorage.removeItem('mfa_user')

      // Success - redirect to dashboard
      toast.success('Authentication successful!')
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (err) {
      console.error('Verification error:', err)
      setError('Failed to connect to server')
      setValue('')
      setIsVerifying(false)
      toast.error('Connection failed')
    }
  }

  const handleBack = () => {
    sessionStorage.removeItem('mfa_user')
    router.push('/login')
  }

  if (!userInfo) {
    return null // Will redirect in useEffect
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

      {/* Back Button */}
      <Button
        onClick={handleBack}
        variant="ghost"
        className="absolute top-6 left-6 z-20 gap-2 font-bold text-zinc-400 hover:text-white uppercase tracking-wide"
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-zinc-950 border-2 border-zinc-800 shadow-2xl overflow-hidden">
          {/* Red accent bar */}
          <div className="h-2 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]" />
          
          <div className="p-10">
            {/* Header */}
            <div className="flex flex-col items-center gap-4 mb-10">
              <div className="relative w-32 h-16 flex items-center justify-center">
                <img
                  src="/fia-logo.svg"
                  alt="FIA Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                  2FA Verification
                </h1>
                <div className="h-0.5 w-16 bg-[#E10600] mx-auto mt-2" />
                <p className="text-sm font-semibold text-zinc-400 mt-3">
                  Enter 6-digit code from Google Authenticator
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-950 border-l-4 border-[#E10600] text-red-200 text-sm font-semibold">
                {error}
              </div>
            )}

            {/* OTP Input */}
            <div className="flex flex-col items-center gap-8">
              <InputOTP
                maxLength={6}
                value={value}
                onChange={(value) => setValue(value)}
                disabled={isVerifying}
                className="gap-2"
              >
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="size-16 text-3xl font-black bg-black border-2 border-zinc-700 text-white data-[active=true]:border-[#E10600] transition-all"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {/* Status */}
              {isVerifying && (
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-wide">
                  <span className="size-4 border-2 border-[#E10600]/30 border-t-[#E10600] rounded-full animate-spin" />
                  Verifying...
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center space-y-3">
              <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Code refreshes every 30 seconds
              </p>
              <p className="text-sm font-semibold text-zinc-400">
                User: <span className="text-white">{userInfo.username}</span> | Team: <span className="text-[#E10600]">{userInfo.team.toUpperCase()}</span>
              </p>
              <p className="text-sm">
                <a href="/setup-2fa" className="font-bold text-[#E10600] hover:text-red-500 transition-colors uppercase tracking-wide">
                  Lost Authenticator?
                </a>
              </p>
            </div>
          </div>
          
          {/* Bottom red accent bar */}
          <div className="h-2 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]" />
        </div>
        
        {/* Red accent bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E10600] to-transparent" />
      </div>
    </div>
  )
}
