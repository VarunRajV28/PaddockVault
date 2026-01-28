'use client'

import Link from 'next/link'
import { Share2 } from 'lucide-react'
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

const telemetryData = [
  {
    id: 'PKT-001',
    filename: 'monza_aero_setup.json',
    owner: 'Scuderia Ferrari',
    classification: 'Top Secret',
    hash: 'a1b2c3d4e5f6...9g8h7i6j',
  },
  {
    id: 'PKT-002',
    filename: 'silverstone_suspension.json',
    owner: 'Mercedes-AMG',
    classification: 'Restricted',
    hash: 'b2c3d4e5f6g7...h8i9j0k1',
  },
  {
    id: 'PKT-003',
    filename: 'spa_engine_map.json',
    owner: 'Red Bull Racing',
    classification: 'Top Secret',
    hash: 'c3d4e5f6g7h8...i9j0k1l2',
  },
  {
    id: 'PKT-004',
    filename: 'monaco_brake_bias.json',
    owner: 'McLaren F1',
    classification: 'Restricted',
    hash: 'd4e5f6g7h8i9...j0k1l2m3',
  },
  {
    id: 'PKT-005',
    filename: 'bahrain_tire_strategy.json',
    owner: 'Scuderia Ferrari',
    classification: 'Top Secret',
    hash: 'e5f6g7h8i9j0...k1l2m3n4',
  },
]

function ClassificationBadge({ classification }: { classification: string }) {
  if (classification === 'Top Secret') {
    return (
      <Badge className="bg-[#E10600] text-white hover:bg-red-700 border-2 border-[#E10600] font-black uppercase tracking-wider">
        {classification}
      </Badge>
    )
  }
  return (
    <Badge className="bg-zinc-800 text-yellow-500 hover:bg-zinc-700 border-2 border-yellow-500 font-black uppercase tracking-wider">
      {classification}
    </Badge>
  )
}

export default function TelemetryPage() {
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

      {/* Telemetry Table */}
      <div className="bg-zinc-950 border-2 border-zinc-800 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]"></div>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="font-black text-zinc-400 uppercase tracking-wider">ID</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-wider">Filename</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-wider">Owner</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-wider">Classification</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-wider">Hash</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {telemetryData.map((item) => (
              <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900 transition-colors">
                <TableCell className="font-bold text-white">{item.id}</TableCell>
                <TableCell className="font-bold text-white">{item.filename}</TableCell>
                <TableCell className="font-medium text-zinc-400">{item.owner}</TableCell>
                <TableCell>
                  <ClassificationBadge classification={item.classification} />
                </TableCell>
                <TableCell className="font-mono text-zinc-500 text-xs">
                  {item.hash}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" className="bg-[#E10600] hover:bg-red-700 text-white font-black uppercase tracking-wider shadow-lg shadow-red-900/50" asChild>
                      <Link href={`/dashboard/telemetry/${item.id}`}>
                        Decrypt
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 hover:bg-zinc-800 hover:text-[#E10600] transition-colors">
                      <Share2 className="size-4" />
                      <span className="sr-only">Share</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
