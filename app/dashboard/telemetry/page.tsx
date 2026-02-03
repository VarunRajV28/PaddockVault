'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, AlertTriangle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface TelemetryFile {
  id: number
  filename: string
  owner_team: string
  classification: string
  content: string
  created_at: string
}

function getTeamBadgeStyle(team: string) {
  const teamStyles: Record<string, string> = {
    ferrari: 'bg-[#E10600] text-white hover:bg-red-700 border-2 border-[#E10600]',
    redbull: 'bg-[#0600EF] text-white hover:bg-blue-700 border-2 border-[#0600EF]',
    mercedes: 'bg-[#00D2BE] text-white hover:bg-teal-600 border-2 border-[#00D2BE]',
    mclaren: 'bg-[#FF8700] text-white hover:bg-orange-600 border-2 border-[#FF8700]',
    fia: 'bg-[#FFD700] text-black hover:bg-yellow-500 border-2 border-[#FFD700]',
  }
  return teamStyles[team.toLowerCase()] || 'bg-zinc-700 text-white hover:bg-zinc-600 border-2 border-zinc-700'
}

function ClassificationBadge({ classification }: { classification: string }) {
  if (classification === 'Confidential') {
    return (
      <Badge className="bg-[#E10600] text-white hover:bg-red-700 border-2 border-[#E10600] font-black uppercase tracking-wider">
        🔒 {classification}
      </Badge>
    )
  }
  return (
    <Badge className="bg-green-600 text-white hover:bg-green-700 border-2 border-green-600 font-black uppercase tracking-wider">
      🌐 {classification}
    </Badge>
  )
}

function TeamBadge({ team }: { team: string }) {
  return (
    <Badge className={`${getTeamBadgeStyle(team)} font-black uppercase tracking-wider`}>
      {team}
    </Badge>
  )
}

export default function TelemetryPage() {
  const [telemetryData, setTelemetryData] = useState<TelemetryFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserTeam, setCurrentUserTeam] = useState<string>('')

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [sharing, setSharing] = useState(false)

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewContent, setViewContent] = useState<string>('')
  const [viewLoading, setViewLoading] = useState(false)

  const availableTeams = ['ferrari', 'redbull', 'mclaren', 'mercedes', 'fia']

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        // Get user credentials from localStorage
        const f1_user = localStorage.getItem('f1_user') || ''
        const f1_team = localStorage.getItem('f1_team') || ''
        setCurrentUserTeam(f1_team.toLowerCase())

        if (!f1_team) {
          toast.error('⚠️ Authentication Required', {
            description: 'Please log in to access telemetry data'
          })
          setError('Not authenticated')
          setLoading(false)
          return
        }

        // Fetch telemetry data with user credentials
        const response = await fetch('http://localhost:5000/api/telemetry', {
          method: 'GET',
          headers: {
            'X-User-Team': f1_team,
            'X-User-Name': f1_user,
            'Content-Type': 'application/json',
          },
        })

        if (response.status === 403) {
          toast.error('⚠️ ACCESS DENIED: RESTRICTED PROTOCOL', {
            description: 'You do not have permission to access this data'
          })
          setError('Access denied')
          setLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch telemetry data')
        }

        const data = await response.json()
        setTelemetryData(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching telemetry:', err)
        toast.error('⚠️ CONNECTION ERROR', {
          description: 'Failed to connect to telemetry server'
        })
        setError('Failed to load data')
        setLoading(false)
      }
    }

    fetchTelemetry()
  }, [])

  const handleShareClick = (fileId: number) => {
    setSelectedFileId(fileId)
    setSelectedTeam('')
    setShareDialogOpen(true)
  }

  const handleShare = async () => {
    if (!selectedFileId || !selectedTeam) {
      toast.error('⚠️ Missing Information', {
        description: 'Please select a team to share with'
      })
      return
    }

    setSharing(true)

    try {
      const f1_user = localStorage.getItem('f1_user') || ''

      const response = await fetch('http://localhost:5000/api/telemetry/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: selectedFileId,
          recipient_team: selectedTeam,
          sender_username: f1_user,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share file')
      }

      // Success! Show prominent toast
      toast.success('🔐 ENCRYPTION KEY TRANSMITTED SECURELY', {
        description: `File shared with ${selectedTeam.toUpperCase()} using RSA-2048 encryption`,
        duration: 5000,
        className: 'bg-[#E10600] text-white border-2 border-white font-black',
      })

      setShareDialogOpen(false)
      setSelectedFileId(null)
      setSelectedTeam('')
    } catch (err: any) {
      console.error('Error sharing file:', err)
      toast.error('⚠️ SHARE FAILED', {
        description: err.message || 'Failed to share file'
      })
    } finally {
      setSharing(false)
    }
  }

  const handleViewClick = async (fileId: number) => {
    setViewLoading(true)
    setSelectedFileId(fileId)

    try {
      const f1_user = localStorage.getItem('f1_user') || ''

      const response = await fetch('http://localhost:5000/api/telemetry/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          username: f1_user,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Decryption failed')
      }

      // Success! Show decrypted content
      setViewContent(data.content)
      setViewDialogOpen(true)
    } catch (err: any) {
      console.error('Error decrypting file:', err)
      toast.error('⚠️ DECRYPTION FAILED: INVALID KEY', {
        description: err.message || 'Unable to decrypt file content',
        className: 'bg-red-600 text-white border-2 border-white font-black',
      })
    } finally {
      setViewLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-[#E10600] pl-4">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          Telemetry Repository
        </h1>
        <p className="text-sm text-zinc-400 font-medium mt-1 uppercase tracking-wider">
          Secure data packets from all connected teams
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-zinc-950 border-2 border-zinc-800 p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#E10600] border-r-transparent"></div>
          <p className="mt-4 text-zinc-400 font-medium uppercase tracking-wider">Loading Telemetry Data...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-zinc-950 border-2 border-red-600 p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <p className="text-red-500 font-black uppercase tracking-wider">{error}</p>
        </div>
      )}

      {/* Telemetry Table */}
      {!loading && !error && (
        <div className="bg-zinc-950 border-2 border-zinc-800 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]"></div>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="font-black text-zinc-400 uppercase tracking-wider">Filename</TableHead>
                <TableHead className="font-black text-zinc-400 uppercase tracking-wider">Owner</TableHead>
                <TableHead className="font-black text-zinc-400 uppercase tracking-wider">Classification</TableHead>
                <TableHead className="font-black text-zinc-400 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {telemetryData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-zinc-500 font-medium uppercase tracking-wider">
                    No telemetry data available
                  </TableCell>
                </TableRow>
              ) : (
                telemetryData.map((item) => (
                  <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900 transition-colors">
                    <TableCell className="font-bold text-white">{item.filename}</TableCell>
                    <TableCell>
                      <TeamBadge team={item.owner_team} />
                    </TableCell>
                    <TableCell>
                      <ClassificationBadge classification={item.classification} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewClick(item.id)}
                          disabled={viewLoading && selectedFileId === item.id}
                          className="bg-[#E10600] hover:bg-red-700 text-white font-black uppercase tracking-wider shadow-lg shadow-red-900/50"
                        >
                          <Eye className="size-4 mr-1" />
                          {viewLoading && selectedFileId === item.id ? 'Decrypting...' : 'View'}
                        </Button>
                        {/* Show Share button only for files owned by current user */}
                        {item.owner_team.toLowerCase() === currentUserTeam && (
                          <Button
                            size="sm"
                            onClick={() => handleShareClick(item.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider shadow-lg shadow-blue-900/50"
                          >
                            <Share2 className="size-4 mr-1" />
                            Share
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-zinc-950 border-2 border-[#E10600] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-wider text-[#E10600]">
              🔐 SECURE KEY EXCHANGE
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Transmit encrypted file access using RSA-2048 public key cryptography
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-wider text-zinc-300">
                Target Team
              </label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white font-bold">
                  <SelectValue placeholder="Select recipient team..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {availableTeams
                    .filter(team => team !== currentUserTeam)
                    .map(team => (
                      <SelectItem
                        key={team}
                        value={team}
                        className="text-white font-bold uppercase hover:bg-zinc-800"
                      >
                        {team}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 font-black uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={!selectedTeam || sharing}
              className="bg-[#E10600] hover:bg-red-700 text-white font-black uppercase tracking-wider shadow-lg shadow-red-900/50"
            >
              {sharing ? 'Transmitting...' : '🔐 Transmit Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-zinc-950 border-2 border-[#E10600] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-wider text-[#E10600]">
              🔓 DECRYPTED CONTENT
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              File content decrypted using AES-GCM with RSA key unwrapping
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-md p-4 max-h-96 overflow-auto">
              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
                {viewContent}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setViewDialogOpen(false)}
              className="bg-[#E10600] hover:bg-red-700 text-white font-black uppercase tracking-wider shadow-lg shadow-red-900/50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
