'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, QrCode, CheckCircle2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const teams = [
  { value: 'fia', label: 'FIA' },
  { value: 'ferrari', label: 'Ferrari' },
  { value: 'redbull', label: 'Red Bull' },
  { value: 'mclaren', label: 'McLaren' },
  { value: 'mercedes', label: 'Mercedes' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [team, setTeam] = React.useState('')
  const [showQRModal, setShowQRModal] = React.useState(false)
  const [qrCode, setQrCode] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!team) {
      setError('Please select a team')
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setIsLoading(false)
        return
      }

      // Registration successful - show QR code modal
      setQrCode(data.qr_code)
      setShowQRModal(true)
      setIsLoading(false)
      toast.success('Account created successfully!')
    } catch (err) {
      console.error('Registration error:', err)
      setError('Failed to connect to server. Please ensure the backend is running.')
      setIsLoading(false)
    }
  }

  const handleQRConfirm = () => {
    setShowQRModal(false)
    router.push('/login')
  }

  return (
    <>
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
                <div className="w-16 h-16 bg-[#E10600] flex items-center justify-center">
                  <Shield className="size-9 text-white" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                    Register Access
                  </h1>
                  <div className="h-0.5 w-16 bg-[#E10600] mx-auto mt-2" />
                  <p className="text-sm font-semibold text-zinc-400 mt-3">
                    Create secure account with 2FA protection
                  </p>
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

              {/* Team Select */}
              <div className="space-y-2">
                <Label htmlFor="team" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Select Team
                </Label>
                <Select required value={team} onValueChange={setTeam}>
                  <SelectTrigger 
                    id="team"
                    className="h-14 bg-black border-2 border-zinc-800 text-white text-lg font-medium focus:ring-0 focus:border-[#E10600] transition-all"
                  >
                    <SelectValue placeholder="Choose your team..." />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-2 border-zinc-800">
                    {teams.map((t) => (
                      <SelectItem 
                        key={t.value} 
                        value={t.value}
                        className="text-white font-medium"
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs font-semibold text-zinc-500">
                  Team name will be your username
                </p>
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

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 bg-black border-2 border-zinc-800 text-white text-lg font-medium placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-[#E10600] transition-all"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-[#E10600] hover:bg-red-700 text-white font-black tracking-wide text-base uppercase shadow-lg shadow-red-900/50 transition-all hover:shadow-xl hover:shadow-red-900/70 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 space-y-4">
              <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
              <p className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Protected by Two-Factor Authentication
              </p>
              <p className="text-center text-sm">
                <span className="text-zinc-400 font-semibold">Already registered? </span>
                <Link href="/login" className="font-bold text-[#E10600] hover:text-red-500 transition-colors uppercase tracking-wide">
                  Login
                </Link>
              </p>
            </div>
          </div>
          
          {/* Bottom red accent bar */}
          <div className="h-2 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]" />
        </div>
      </div>
      
      {/* Red accent bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E10600] to-transparent" />
    </div>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-2 border-[#E10600]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-white uppercase">
              <QrCode className="size-6 text-[#E10600]" />
              Setup 2FA
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold text-zinc-400">
              Scan QR code with Google Authenticator
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* QR Code Display */}
            <div className="flex justify-center">
              <div className="p-4 bg-white border-4 border-white">
                {qrCode && (
                  <img 
                    src={qrCode} 
                    alt="QR Code for 2FA setup" 
                    className="w-64 h-64"
                  />
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3 bg-black p-4 border-2 border-zinc-800">
              <p className="text-sm font-black text-white uppercase">Instructions:</p>
              <ol className="space-y-2 text-xs font-semibold text-zinc-400 list-decimal list-inside">
                <li>Open Google Authenticator</li>
                <li>Tap "+" to add account</li>
                <li>Select "Scan QR code"</li>
                <li>Scan the code above</li>
                <li>Account added automatically</li>
              </ol>
            </div>

            {/* Warning */}
            <div className="bg-red-950 border-l-4 border-[#E10600] p-3">
              <p className="text-xs font-bold text-red-200">
                <strong>IMPORTANT:</strong> Save this QR code. You'll need the 6-digit code to login.
              </p>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleQRConfirm}
              className="w-full h-14 bg-[#E10600] hover:bg-red-700 text-white font-black tracking-wide text-base uppercase shadow-lg shadow-red-900/50"
            >
              <CheckCircle2 className="size-5 mr-2" />
              I Have Scanned It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
