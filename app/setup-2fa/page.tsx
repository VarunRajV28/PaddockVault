'use client'

import * as React from 'react'
import { QrCode, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const teams = [
  { value: 'fia', label: 'FIA' },
  { value: 'ferrari', label: 'Ferrari' },
  { value: 'redbull', label: 'Red Bull' },
  { value: 'mclaren', label: 'McLaren' },
  { value: 'mercedes', label: 'Mercedes' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function SetupPage() {
  const [team, setTeam] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [qrCode, setQrCode] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [isVerified, setIsVerified] = React.useState(false)

  const handleGetQRCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setQrCode('')
    setIsLoading(true)

    try {
      // First verify the password
      const loginResponse = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: team, password }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        setError(loginData.error || 'Invalid team or password')
        toast.error(loginData.error || 'Invalid team or password')
        setIsLoading(false)
        return
      }

      // If password is correct, set verified and get QR code
      setIsVerified(true)
      toast.success('Password verified! Generating QR code...')

      const qrResponse = await fetch(`${API_URL}/api/get-qr-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team }),
      })

      const qrData = await qrResponse.json()

      if (!qrResponse.ok) {
        setError(qrData.error || 'Failed to get QR code')
        toast.error(qrData.error || 'Failed to get QR code')
        setIsLoading(false)
        return
      }

      setQrCode(qrData.qr_code)
      toast.success('QR Code generated successfully!')
      setIsLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to connect to server')
      toast.error('Failed to connect to server')
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

      {/* Back to Login */}
      <Link
        href="/login"
        className="absolute top-6 left-6 z-20 text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-wide transition-colors"
      >
        ← Back
      </Link>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-zinc-950 border-2 border-zinc-800 shadow-2xl overflow-hidden">
          {/* Red accent bar */}
          <div className="h-2 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]" />
          
          <div className="p-10">
            {/* Header */}
            <div className="flex flex-col items-center gap-4 mb-10">
              <div className="w-16 h-16 bg-[#E10600] flex items-center justify-center">
                <QrCode className="size-9 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                  2FA Setup
                </h1>
                <div className="h-0.5 w-16 bg-[#E10600] mx-auto mt-2" />
                <p className="text-sm font-semibold text-zinc-400 mt-3">
                  {isVerified ? 'Scan QR code with Google Authenticator' : 'Verify password to generate QR code'}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleGetQRCode} className="space-y-6 mb-8">
              {error && (
                <div className="p-3 bg-destructive/20 border border-destructive/50 rounded text-destructive text-sm font-mono text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team" className="text-sm font-mono text-muted-foreground">
                    TEAM NAME
                  </Label>
                  <Select required value={team} onValueChange={setTeam}>
                    <SelectTrigger 
                      id="team"
                      className="h-11 bg-black/30 border border-border font-mono"
                    >
                      <SelectValue placeholder="Select your team..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border font-mono">
                      {teams.map((t) => (
                        <SelectItem 
                          key={t.value} 
                          value={t.value}
                          className="font-mono"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-mono text-muted-foreground">
                    PASSWORD
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your team password..."
                    className="h-11 bg-black/30 border border-border font-mono"
                  />
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                <p className="text-xs font-mono text-yellow-500 text-center">
                  <strong>🔒 SECURITY:</strong> You must enter your current team password to regenerate the QR code.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !team || !password}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-mono font-bold tracking-wider disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    VERIFYING...
                  </span>
                ) : (
                  <>
                    <Shield className="size-5 mr-2" />
                    VERIFY & GENERATE QR
                  </>
                )}
              </Button>
            </form>

            {/* QR Code Display */}
            {qrCode && isVerified && (
              <div className="space-y-4 border-t border-border pt-8">
                <div className="text-center">
                  <h2 className="text-lg font-mono font-bold text-foreground mb-4">
                    Scan this QR Code with Google Authenticator
                  </h2>
                </div>

                <div className="flex justify-center">
                  <div className="p-6 bg-white rounded-lg border-4 border-white">
                    <img 
                      src={qrCode} 
                      alt="QR Code for 2FA setup" 
                      className="w-64 h-64"
                    />
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded border border-border">
                  <p className="text-sm font-mono text-foreground font-bold mb-2">Setup Instructions:</p>
                  <ol className="space-y-1 text-xs font-mono text-muted-foreground list-decimal list-inside">
                    <li>Open Google Authenticator on your mobile device</li>
                    <li>Tap the "+" icon to add a new account</li>
                    <li>Select "Scan a QR code"</li>
                    <li>Point your camera at the QR code above</li>
                    <li>Your account will be added and display a 6-digit code</li>
                  </ol>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                  <p className="text-xs font-mono text-red-500 text-center">
                    <strong>IMPORTANT:</strong> Save this QR code. You'll need the 6-digit code from your authenticator app to login.
                  </p>
                </div>
              </div>
            )}

            {/* Default Users Info */}
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-sm font-mono font-bold text-foreground mb-3">Default Teams:</h3>
              <div className="space-y-2 text-xs font-mono text-muted-foreground bg-black/30 p-4 rounded border border-border">
                <p>• Team: <span className="text-foreground">fia</span> | Password: <span className="text-foreground">fia123</span></p>
                <p>• Team: <span className="text-foreground">ferrari</span> | Password: <span className="text-foreground">ferrari123</span></p>
                <p>• Team: <span className="text-foreground">mclaren</span> | Password: <span className="text-foreground">mclaren123</span></p>
                <p>• Team: <span className="text-foreground">redbull</span> | Password: <span className="text-foreground">redbull123</span></p>
                <p>• Team: <span className="text-foreground">mercedes</span> | Password: <span className="text-foreground">mercedes123</span></p>
              </div>
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
