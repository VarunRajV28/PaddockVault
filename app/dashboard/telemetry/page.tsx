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
      <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50 font-mono">
        {classification}
      </Badge>
    )
  }
  return (
    <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/50 font-mono">
      {classification}
    </Badge>
  )
}

export default function TelemetryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-mono">
          Telemetry Repository
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          Secure data packets from all connected teams
        </p>
      </div>

      {/* Telemetry Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-mono text-muted-foreground">ID</TableHead>
              <TableHead className="font-mono text-muted-foreground">Filename</TableHead>
              <TableHead className="font-mono text-muted-foreground">Owner</TableHead>
              <TableHead className="font-mono text-muted-foreground">Classification</TableHead>
              <TableHead className="font-mono text-muted-foreground">Hash</TableHead>
              <TableHead className="font-mono text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {telemetryData.map((item) => (
              <TableRow key={item.id} className="border-border hover:bg-secondary/50">
                <TableCell className="font-mono text-foreground">{item.id}</TableCell>
                <TableCell className="font-mono text-foreground">{item.filename}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{item.owner}</TableCell>
                <TableCell>
                  <ClassificationBadge classification={item.classification} />
                </TableCell>
                <TableCell className="font-mono text-muted-foreground text-xs">
                  {item.hash}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="destructive" size="sm" className="font-mono" asChild>
                      <Link href={`/dashboard/telemetry/${item.id}`}>
                        Decrypt
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8">
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
