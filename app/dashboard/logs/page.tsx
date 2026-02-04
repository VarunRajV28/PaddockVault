'use client'

import React, { useEffect, useState } from 'react'
import {
    Search,
    Download,
    ShieldAlert,
    Calendar,
    User,
    Activity,
    Filter,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface AuditLog {
    id: number
    timestamp: string
    user: string
    action: string
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
    }, [])

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredLogs(logs)
        } else {
            const query = searchQuery.toLowerCase()
            const filtered = logs.filter(
                (log) =>
                    log.user.toLowerCase().includes(query) ||
                    log.action.toLowerCase().includes(query)
            )
            setFilteredLogs(filtered)
        }
    }, [searchQuery, logs])

    const fetchLogs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/audit-logs')
            if (response.ok) {
                const data = await response.json()
                setLogs(data)
                setFilteredLogs(data)
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error)
        } finally {
            setLoading(false)
        }
    }

    // Format UTC timestamp to user's local time
    const formatLocalTime = (utcString: string) => {
        const isoString = utcString.endsWith('Z') ? utcString : utcString + 'Z'
        const date = new Date(isoString)
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const getStatusColor = (action: string) => {
        const lowerAction = action.toLowerCase()
        if (lowerAction.includes('failed') || lowerAction.includes('unauthorized')) {
            return 'bg-red-500'
        }
        if (lowerAction.includes('warning') || lowerAction.includes('alert')) {
            return 'bg-yellow-500'
        }
        return 'bg-green-500'
    }

    const handleExportCSV = () => {
        // CSV Header
        const headers = ['Timestamp', 'User', 'Action']

        // CSV Rows
        const rows = filteredLogs.map(log => [
            // Ensure timestamp is properly formatted for Excel/Sheets
            `"${formatLocalTime(log.timestamp)}"`,
            `"${log.user}"`,
            `"${log.action}"`
        ])

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n')

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-[#E10600] pl-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <ShieldAlert className="size-8 text-[#E10600]" />
                        System Audit Logs
                    </h1>
                    <p className="text-sm text-zinc-400 font-semibold mt-1 uppercase tracking-wide">
                        Immutable Security Records
                    </p>
                </div>
                <Button
                    onClick={handleExportCSV}
                    className="bg-zinc-100 text-zinc-900 hover:bg-white font-bold uppercase tracking-wide gap-2 self-start md:self-auto"
                >
                    <Download className="size-4" />
                    Export CSV
                </Button>
            </div>

            {/* Controls */}
            <Card className="bg-zinc-950 border-2 border-zinc-800">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <Input
                            placeholder="Search by User or Action..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#E10600]"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="bg-zinc-950 border-2 border-zinc-800 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]" />
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-900">
                            <TableRow className="border-zinc-800 hover:bg-zinc-900">
                                <TableHead className="w-[250px] font-bold text-zinc-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="size-4" /> Time
                                    </div>
                                </TableHead>
                                <TableHead className="w-[200px] font-bold text-zinc-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <User className="size-4" /> User
                                    </div>
                                </TableHead>
                                <TableHead className="font-bold text-zinc-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Activity className="size-4" /> Action
                                    </div>
                                </TableHead>
                                <TableHead className="w-[100px] font-bold text-zinc-400 uppercase tracking-wider text-right">
                                    Status
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                                        Loading audit logs...
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                                        No logs found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors group">
                                        <TableCell className="font-mono text-zinc-400 group-hover:text-white transition-colors">
                                            {formatLocalTime(log.timestamp)}
                                        </TableCell>
                                        <TableCell className="font-bold text-white uppercase tracking-wide">
                                            {log.user}
                                        </TableCell>
                                        <TableCell className="text-zinc-300">
                                            {log.action}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`inline-block size-3 rounded-full ${getStatusColor(log.action)} shadow-[0_0_8px] shadow-${getStatusColor(log.action).replace('bg-', '')}/50`} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-zinc-500 uppercase tracking-widest font-mono">
                System Security Level: Maximum
            </div>
        </div>
    )
}
