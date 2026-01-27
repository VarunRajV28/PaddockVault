'use client'

import * as React from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  MoreHorizontal,
  Key,
  Unlock,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface TelemetryPacket {
  id: string
  packetId: string
  timestamp: string
  classification: 'Top Secret' | 'Secret' | 'Confidential'
  integrityHash: string
  status: 'verified' | 'warning' | 'unknown'
}

const packets: TelemetryPacket[] = [
  {
    id: '1',
    packetId: 'PKT-0xFA7821',
    timestamp: '2026-01-27T14:32:01Z',
    classification: 'Top Secret',
    integrityHash: 'a7f3b2c9d8e1f0a4b5c6d7e8f9a0b1c2d3e4f5a6',
    status: 'verified',
  },
  {
    id: '2',
    packetId: 'PKT-0xCB1247',
    timestamp: '2026-01-27T14:31:45Z',
    classification: 'Secret',
    integrityHash: 'b8g4c3d0e9f2g1b5c7d8e9f0a1b2c3d4e5f6a7b8',
    status: 'warning',
  },
  {
    id: '3',
    packetId: 'PKT-0xDE9903',
    timestamp: '2026-01-27T14:31:22Z',
    classification: 'Top Secret',
    integrityHash: 'c9h5d4e1f0g3h2c6d9e0f1a2b3c4d5e6f7a8b9c0',
    status: 'verified',
  },
  {
    id: '4',
    packetId: 'PKT-0xAF5521',
    timestamp: '2026-01-27T14:30:58Z',
    classification: 'Confidential',
    integrityHash: 'd0i6e5f2g1h4i3d7e1f2a3b4c5d6e7f8a9b0c1d2',
    status: 'unknown',
  },
  {
    id: '5',
    packetId: 'PKT-0xBE7734',
    timestamp: '2026-01-27T14:30:41Z',
    classification: 'Top Secret',
    integrityHash: 'e1j7f6g3h2i5j4e8f3a4b5c6d7e8f9a0b1c2d3e4',
    status: 'verified',
  },
  {
    id: '6',
    packetId: 'PKT-0xCD8845',
    timestamp: '2026-01-27T14:30:15Z',
    classification: 'Secret',
    integrityHash: 'f2k8g7h4i3j6k5f9g4a5b6c7d8e9f0a1b2c3d4e5',
    status: 'verified',
  },
]

const decryptionSteps = [
  { label: 'Verifying Digital Signature...', duration: 800 },
  { label: 'Authenticating RSA-4096 Certificate...', duration: 1200 },
  { label: 'Deriving AES-256 Session Key...', duration: 1000 },
  { label: 'Decrypting Packet Payload...', duration: 600 },
  { label: 'Validating Integrity Hash...', duration: 400 },
]

function StatusIcon({ status }: { status: TelemetryPacket['status'] }) {
  switch (status) {
    case 'verified':
      return <ShieldCheck className="size-5 text-success" />
    case 'warning':
      return <ShieldAlert className="size-5 text-primary" />
    case 'unknown':
      return <ShieldQuestion className="size-5 text-muted-foreground" />
  }
}

function ClassificationBadge({
  classification,
}: {
  classification: TelemetryPacket['classification']
}) {
  const variant =
    classification === 'Top Secret'
      ? 'destructive'
      : classification === 'Secret'
        ? 'default'
        : 'secondary'

  return (
    <Badge variant={variant} className="font-mono text-xs uppercase">
      {classification}
    </Badge>
  )
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`
}

export function TelemetryTable() {
  const [selectedPacket, setSelectedPacket] =
    React.useState<TelemetryPacket | null>(null)
  const [decryptDialogOpen, setDecryptDialogOpen] = React.useState(false)
  const [decryptStep, setDecryptStep] = React.useState(0)
  const [decryptProgress, setDecryptProgress] = React.useState(0)
  const [decryptComplete, setDecryptComplete] = React.useState(false)
  const [focusedRow, setFocusedRow] = React.useState<string | null>(null)

  const startDecryption = (packet: TelemetryPacket) => {
    setSelectedPacket(packet)
    setDecryptDialogOpen(true)
    setDecryptStep(0)
    setDecryptProgress(0)
    setDecryptComplete(false)

    // Simulate decryption process
    let currentStep = 0
    let currentProgress = 0

    const runStep = () => {
      if (currentStep >= decryptionSteps.length) {
        setDecryptComplete(true)
        return
      }

      setDecryptStep(currentStep)
      const stepDuration = decryptionSteps[currentStep].duration
      const progressPerStep = 100 / decryptionSteps.length
      const targetProgress = (currentStep + 1) * progressPerStep

      const progressInterval = setInterval(() => {
        currentProgress += 2
        setDecryptProgress(Math.min(currentProgress, targetProgress))
        if (currentProgress >= targetProgress) {
          clearInterval(progressInterval)
          currentStep++
          setTimeout(runStep, 200)
        }
      }, stepDuration / (progressPerStep / 2))
    }

    setTimeout(runStep, 500)
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Packet ID</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Integrity Hash</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packets.map((packet) => (
              <TableRow
                key={packet.id}
                className={cn(
                  'border-border transition-all duration-200 cursor-pointer',
                  focusedRow === packet.id && 'glow-border bg-secondary/50'
                )}
                onClick={() =>
                  setFocusedRow(focusedRow === packet.id ? null : packet.id)
                }
              >
                <TableCell>
                  <StatusIcon status={packet.status} />
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">
                  {packet.packetId}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {formatTimestamp(packet.timestamp)}
                </TableCell>
                <TableCell>
                  <ClassificationBadge classification={packet.classification} />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {truncateHash(packet.integrityHash)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:bg-secondary"
                      >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-card border-border"
                    >
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        className="font-mono text-xs"
                      >
                        <Key className="mr-2 size-4" />
                        Initiate Handshake (RSA)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          startDecryption(packet)
                        }}
                        className="font-mono text-xs"
                      >
                        <Unlock className="mr-2 size-4" />
                        Decrypt Packet (AES)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-xs"
                      >
                        <FileText className="mr-2 size-4" />
                        View Metadata
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Decryption Dialog */}
      <Dialog open={decryptDialogOpen} onOpenChange={setDecryptDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-lg flex items-center gap-2">
              {decryptComplete ? (
                <CheckCircle2 className="size-5 text-success" />
              ) : (
                <Loader2 className="size-5 animate-spin text-primary" />
              )}
              {decryptComplete
                ? 'Decryption Complete'
                : 'Decrypting Packet...'}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-muted-foreground">
              {selectedPacket?.packetId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Progress
                value={decryptProgress}
                className={cn(
                  'h-2',
                  decryptComplete ? '[&>div]:bg-success' : '[&>div]:bg-primary'
                )}
              />
              <p className="text-xs font-mono text-muted-foreground">
                {decryptProgress.toFixed(0)}% Complete
              </p>
            </div>

            <div className="space-y-2 rounded-md bg-background p-4 border border-border">
              {decryptionSteps.map((step, index) => (
                <div
                  key={step.label}
                  className={cn(
                    'flex items-center gap-2 font-mono text-xs transition-all duration-300',
                    index < decryptStep && 'text-success',
                    index === decryptStep && !decryptComplete && 'text-primary',
                    index > decryptStep && !decryptComplete && 'text-muted-foreground/50',
                    decryptComplete && 'text-success'
                  )}
                >
                  {index < decryptStep || decryptComplete ? (
                    <CheckCircle2 className="size-3" />
                  ) : index === decryptStep ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <div className="size-3 rounded-full border border-current" />
                  )}
                  <span
                    className={cn(
                      (index <= decryptStep || decryptComplete) && 'terminal-text'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {decryptComplete && (
              <div className="rounded-md bg-success/10 border border-success/30 p-4 space-y-2">
                <p className="font-mono text-xs text-success font-semibold">
                  DATA UNLOCKED
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  Packet payload decrypted successfully. Integrity verified.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
