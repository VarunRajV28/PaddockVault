'use client'

import React, { useEffect, useState } from 'react'
import {
    Lock,
    Key,
    Hash,
    Copy,
    CheckCircle2,
    Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function EncryptionToolsPage() {
    const [publicKey, setPublicKey] = useState<string>('Loading...')
    const [loadingKey, setLoadingKey] = useState(true)
    const [hashInput, setHashInput] = useState('')
    const [hashOutput, setHashOutput] = useState('')
    const [calculating, setCalculating] = useState(false)

    // Fetch user's public key on mount
    useEffect(() => {
        const fetchKey = async () => {
            try {
                const userStr = localStorage.getItem('f1_user')
                const teamStr = localStorage.getItem('f1_team')

                if (!userStr || !teamStr) {
                    setPublicKey('Error: User not logged in')
                    setLoadingKey(false)
                    return
                }

                const response = await fetch('http://localhost:5000/api/user/keys', {
                    headers: {
                        'X-User-Name': userStr,
                        'X-User-Team': teamStr,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    setPublicKey(data.public_key)
                } else {
                    setPublicKey('Failed to retrieve public key')
                }
            } catch (error) {
                console.error('Failed to fetch key:', error)
                setPublicKey('Error fetching public key')
            } finally {
                setLoadingKey(false)
            }
        }

        fetchKey()
    }, [])

    // Handle Hash Calculation
    const handleCalculateHash = async () => {
        if (!hashInput.trim()) {
            toast.error('Please enter some text to hash')
            return
        }

        setCalculating(true)
        try {
            const response = await fetch('http://localhost:5000/api/tools/hash', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: hashInput }),
            })

            if (response.ok) {
                const data = await response.json()
                setHashOutput(data.hash)
                toast.success('SHA-256 Hash Calculated Successfully')
            } else {
                toast.error('Failed to calculate hash')
            }
        } catch (error) {
            console.error('Hash error:', error)
            toast.error('Error connecting to hashing service')
        } finally {
            setCalculating(false)
        }
    }

    // Copy to clipboard helper
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied to clipboard`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-l-4 border-[#E10600] pl-4">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <Lock className="size-8 text-[#E10600]" />
                    Encryption Tools
                </h1>
                <p className="text-sm text-zinc-400 font-semibold mt-1 uppercase tracking-wide">
                    Cryptographic Utilities & Identity
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Card 1: My Digital Identity */}
                <Card className="bg-zinc-950 border-2 border-zinc-800 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white uppercase tracking-wider">
                            <Key className="size-5 text-[#E10600]" />
                            My Digital Identity
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            This is your cryptographic identity. Other teams use this key to encrypt files specifically for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <div className="relative flex-1 min-h-[200px] bg-zinc-900 rounded-md border border-zinc-700 p-4 group">
                            {loadingKey ? (
                                <div className="flex items-center justify-center h-full text-zinc-500 animate-pulse">
                                    Loading Identity...
                                </div>
                            ) : (
                                <>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(publicKey, 'Public Key')}
                                            className="text-zinc-400 hover:text-white"
                                        >
                                            <Copy className="size-4" />
                                        </Button>
                                    </div>
                                    <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all overflow-y-auto max-h-[300px]">
                                        {publicKey}
                                    </pre>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2: Integrity Checker */}
                <Card className="bg-zinc-950 border-2 border-zinc-800 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white uppercase tracking-wider">
                            <Hash className="size-5 text-[#E10600]" />
                            Integrity Checker (SHA-256)
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Verify data integrity by calculating cryptographic hashes. Any change in input results in a completely different hash.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Sensitive Data Input
                            </label>
                            <Textarea
                                placeholder="Enter text to hash..."
                                value={hashInput}
                                onChange={(e) => setHashInput(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 text-white font-mono min-h-[100px] focus-visible:ring-[#E10600]"
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={handleCalculateHash}
                                disabled={calculating || !hashInput}
                                className="bg-[#E10600] hover:bg-red-700 text-white font-black uppercase tracking-wider w-full sm:w-auto"
                            >
                                {calculating ? 'Calculating...' : 'Calculate Hash'}
                            </Button>
                        </div>

                        {hashOutput && (
                            <div className="space-y-2 pt-4 border-t border-zinc-800">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                    <Terminal className="size-3" /> Resulting Hash
                                </label>
                                <div className="bg-black border border-zinc-700 rounded-md p-3 relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(hashOutput, 'Hash')}
                                            className="text-zinc-400 hover:text-white"
                                        >
                                            <Copy className="size-4" />
                                        </Button>
                                    </div>
                                    <code className="text-sm font-mono text-green-400 break-all">
                                        {hashOutput}
                                    </code>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
