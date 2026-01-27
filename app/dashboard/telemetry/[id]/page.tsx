'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import {
  Lock,
  Unlock,
  ShieldCheck,
  User,
  Calendar,
  Hash,
  QrCode,
  FileJson,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Mock data for packets
const packetData: Record<
  string,
  {
    id: string
    filename: string
    owner: string
    uploadedAt: string
    classification: string
    payload: object
  }
> = {
  'PKT-001': {
    id: 'PKT-001',
    filename: 'monza_aero_setup.json',
    owner: 'Scuderia Ferrari',
    uploadedAt: '2026-01-27T14:32:00Z',
    classification: 'Top Secret',
    payload: {
      tyre_pressure: '22.5psi',
      fuel_load: '10kg',
      front_wing_angle: '12.5deg',
      rear_wing_drs_gap: '65mm',
      brake_bias: '56.2%',
    },
  },
  'PKT-002': {
    id: 'PKT-002',
    filename: 'silverstone_suspension.json',
    owner: 'Mercedes-AMG',
    uploadedAt: '2026-01-26T09:15:00Z',
    classification: 'Restricted',
    payload: {
      front_ride_height: '32mm',
      rear_ride_height: '78mm',
      spring_rate_front: '180N/mm',
      spring_rate_rear: '145N/mm',
      anti_roll_bar: 'Stiff',
    },
  },
  'PKT-003': {
    id: 'PKT-003',
    filename: 'spa_engine_map.json',
    owner: 'Red Bull Racing',
    uploadedAt: '2026-01-25T18:45:00Z',
    classification: 'Top Secret',
    payload: {
      power_mode: 'Overtake',
      ers_deployment: '4MJ',
      fuel_mixture: 'Rich',
      rev_limit: '15000rpm',
      turbo_boost: '3.8bar',
    },
  },
}

const decryptSteps = [
  'Initializing secure channel...',
  'Deriving AES-256-GCM key...',
  'Verifying RSA-4096 signature...',
  'Decrypting payload blocks...',
  'Validating checksum...',
  'Access granted.',
]

function TerminalAnimation({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [displayedText, setDisplayedText] = React.useState('')

  React.useEffect(() => {
    if (currentStep >= decryptSteps.length) {
      setTimeout(onComplete, 300)
      return
    }

    const step = decryptSteps[currentStep]
    let charIndex = 0

    const typeInterval = setInterval(() => {
      if (charIndex <= step.length) {
        setDisplayedText(step.slice(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setTimeout(() => {
          setCurrentStep((prev) => prev + 1)
        }, 200)
      }
    }, 30)

    return () => clearInterval(typeInterval)
  }, [currentStep, onComplete])

  return (
    <div className="font-mono text-sm space-y-1">
      {decryptSteps.slice(0, currentStep).map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-success">[OK]</span>
          <span className="text-muted-foreground">{step}</span>
        </div>
      ))}
      {currentStep < decryptSteps.length && (
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 animate-pulse">[..]</span>
          <span className="text-foreground">{displayedText}</span>
          <span className="animate-pulse">_</span>
        </div>
      )}
    </div>
  )
}

function MetadataPanel({
  packet,
}: {
  packet: (typeof packetData)[string]
}) {
  return (
    <Card className="bg-card border-border h-full">
      <CardHeader>
        <CardTitle className="text-lg font-mono text-foreground">
          Packet Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Hash className="size-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-mono">Packet ID</p>
              <p className="text-sm text-foreground font-mono">{packet.id}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="size-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-mono">Owner</p>
              <p className="text-sm text-foreground font-mono">{packet.owner}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="size-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-mono">
                Upload Timestamp
              </p>
              <p className="text-sm text-foreground font-mono">
                {new Date(packet.uploadedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-success" />
            <span className="text-xs text-muted-foreground font-mono">
              Verification Status
            </span>
          </div>
          <Badge className="mt-2 bg-success/20 text-success hover:bg-success/30 border-success/50 font-mono">
            VERIFIED
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function PayloadPanel({
  packet,
  isDecrypted,
  isDecrypting,
  onDecrypt,
}: {
  packet: (typeof packetData)[string]
  isDecrypted: boolean
  isDecrypting: boolean
  onDecrypt: () => void
}) {
  return (
    <Card className="bg-card border-border h-full">
      <CardHeader>
        <CardTitle className="text-lg font-mono text-foreground">
          Encrypted Payload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="raw" className="w-full">
          <TabsList className="mb-4 bg-secondary">
            <TabsTrigger value="raw" className="font-mono text-xs gap-2">
              <FileJson className="size-3" />
              Raw Data
            </TabsTrigger>
            <TabsTrigger value="driver" className="font-mono text-xs gap-2">
              <QrCode className="size-3" />
              Driver View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="raw" className="mt-0">
            {isDecrypting ? (
              <div className="rounded-lg border border-border bg-background p-6 min-h-[300px]">
                <TerminalAnimation onComplete={onDecrypt} />
              </div>
            ) : isDecrypted ? (
              <div className="rounded-lg border border-success/50 bg-background p-4 min-h-[300px] glow-border">
                <div className="flex items-center gap-2 mb-4">
                  <Unlock className="size-4 text-success" />
                  <span className="text-xs font-mono text-success">
                    DECRYPTED // CLEARTEXT
                  </span>
                </div>
                <pre className="text-sm font-mono text-foreground overflow-x-auto">
                  {JSON.stringify(packet.payload, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="relative rounded-lg border border-border bg-background p-4 min-h-[300px] overflow-hidden">
                {/* Blurred encrypted content */}
                <div className="blur-sm select-none pointer-events-none">
                  <pre className="text-sm font-mono text-muted-foreground">
{`{
  "██████████": "██.█psi",
  "█████████": "██kg",
  "████████████████": "██.█deg",
  "█████████████████": "██mm",
  "███████████": "██.█%"
}`}
                  </pre>
                </div>

                {/* Locked overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <Lock className="size-12 text-primary mb-4" />
                  <p className="text-lg font-mono text-foreground mb-2">
                    LOCKED // ENCRYPTED
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mb-6">
                    AES-256-GCM Protected Payload
                  </p>
                  <Button
                    variant="destructive"
                    onClick={onDecrypt}
                    className="font-mono"
                  >
                    <Unlock className="size-4 mr-2" />
                    DECRYPT PACKET
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="driver" className="mt-0">
            <div className="rounded-lg border border-border bg-background p-6 min-h-[300px] flex flex-col items-center justify-center">
              <div className="size-48 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center mb-4">
                <QrCode className="size-24 text-muted-foreground" />
              </div>
              <p className="text-sm font-mono text-muted-foreground">
                Driver Authentication QR Code
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Scan with team-issued device
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default function DecryptPage() {
  const params = useParams()
  const id = params.id as string

  const [isDecrypted, setIsDecrypted] = React.useState(false)
  const [isDecrypting, setIsDecrypting] = React.useState(false)

  const packet = packetData[id] || packetData['PKT-001']

  const handleDecrypt = () => {
    if (isDecrypting) {
      setIsDecrypting(false)
      setIsDecrypted(true)
    } else {
      setIsDecrypting(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-mono">
            {packet.filename}
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Packet Detail View
          </p>
        </div>
        <Badge
          className={
            packet.classification === 'Top Secret'
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50 font-mono'
              : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/50 font-mono'
          }
        >
          {packet.classification}
        </Badge>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MetadataPanel packet={packet} />
        </div>
        <div className="lg:col-span-2">
          <PayloadPanel
            packet={packet}
            isDecrypted={isDecrypted}
            isDecrypting={isDecrypting}
            onDecrypt={handleDecrypt}
          />
        </div>
      </div>
    </div>
  )
}
