'use client'

import * as React from 'react'
import { Upload, FileUp, Shield, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function UploadPage() {
  const [classification, setClassification] = React.useState('')
  const [targetTeam, setTargetTeam] = React.useState('')
  const [isDragging, setIsDragging] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('No file selected', {
        description: 'Please select a telemetry file to upload.',
      })
      return
    }

    if (!classification) {
      toast.error('Classification required', {
        description: 'Please select a classification level.',
      })
      return
    }

    const userStr = localStorage.getItem('f1_user')
    const teamStr = localStorage.getItem('f1_team')

    if (!userStr || !teamStr) {
      toast.error('Authentication Error', { description: 'Please log in again.' })
      return
    }

    try {
      toast.message('Encryption Sequence Started', {
        description: `Reading ${file.name} for encryption...`,
      })

      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = (e) => reject(e)
        reader.readAsText(file)
      })

      toast.loading('Transmitting Encrypted Data...', {
        description: 'Signing and uploading securely...',
        duration: 20000, // Long duration, will be dismissed manually
        id: 'upload-toast'
      })

      // Send to backend
      const response = await fetch('http://localhost:5000/api/telemetry/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': userStr,
          'X-User-Team': teamStr
        },
        body: JSON.stringify({
          filename: file.name,
          content: content,
          classification: classification,
          target_team: targetTeam
        })
      })

      toast.dismiss('upload-toast')

      if (response.ok) {
        const data = await response.json()
        toast.success('Upload Complete', {
          description: data.message || 'Packet encrypted and stored securely.',
        })
        // Reset form
        setFile(null)
        setClassification('')
        setTargetTeam('')
      } else {
        const errorData = await response.json()
        toast.error('Upload Failed', {
          description: errorData.error || 'Server rejected the transmission.',
        })
      }
    } catch (error) {
      toast.dismiss('upload-toast')
      console.error('Upload error:', error)
      toast.error('Transmission Error', { description: 'Network connection failed.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-[#E10600] pl-4">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          Secure Upload
        </h1>
        <p className="text-sm text-zinc-400 font-medium mt-1 uppercase tracking-wider">
          Encrypt and transmit telemetry data to the gateway
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-950 border-2 border-zinc-800">
            <div className="h-1 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]"></div>
            <CardHeader>
              <CardTitle className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileUp className="size-5" />
                Telemetry File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed p-12
                  flex flex-col items-center justify-center gap-4
                  transition-all duration-200 cursor-pointer
                  ${isDragging
                    ? 'border-[#E10600] bg-[#E10600]/10'
                    : file
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-zinc-800 hover:border-[#E10600]'
                  }
                `}
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".json,.xml,.csv"
                />

                {file ? (
                  <>
                    <div className="size-16 bg-green-500/20 flex items-center justify-center">
                      <FileUp className="size-8 text-green-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">{file.name}</p>
                      <p className="text-sm text-zinc-400 font-medium mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                      className="font-black uppercase tracking-wider text-xs hover:bg-zinc-800 hover:text-[#E10600]"
                    >
                      Remove File
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="size-16 bg-zinc-800 flex items-center justify-center">
                      <Upload className="size-8 text-zinc-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold uppercase tracking-wider">
                        Drag & Drop Telemetry File
                      </p>
                      <p className="text-sm text-zinc-400 font-medium mt-1">
                        or click to browse
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                      Supported: .json, .xml, .csv
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-zinc-950 border-2 border-zinc-800">
            <div className="h-1 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]"></div>
            <CardHeader>
              <CardTitle className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="size-5" />
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="classification" className="font-black text-xs text-zinc-400 uppercase tracking-wider">
                  Classification Level
                </Label>
                <Select value={classification} onValueChange={setClassification}>
                  <SelectTrigger className="w-full font-bold bg-black border-2 border-zinc-800 text-white focus:border-[#E10600]">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public" className="font-bold">
                      Public
                    </SelectItem>
                    <SelectItem value="restricted" className="font-bold">
                      Restricted
                    </SelectItem>
                    <SelectItem value="top-secret" className="font-bold">
                      Top Secret
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-2 border-zinc-800">
            <div className="h-1 bg-gradient-to-r from-[#E10600] via-red-600 to-[#E10600]"></div>
            <CardHeader>
              <CardTitle className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="size-5" />
                Target Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team" className="font-black text-xs text-zinc-400 uppercase tracking-wider">
                  Destination Team
                </Label>
                <Input
                  id="team"
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(e.target.value)}
                  placeholder="e.g., Scuderia Ferrari"
                  className="font-bold bg-black border-2 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E10600]"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleUpload}
            className="w-full bg-[#E10600] hover:bg-red-700 text-white font-black uppercase tracking-wider shadow-lg shadow-red-900/50"
            size="lg"
          >
            <Upload className="size-4 mr-2" />
            ENCRYPT & UPLOAD
          </Button>
        </div>
      </div>
    </div>
  )
}
