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

  const handleUpload = () => {
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

    toast.success('Encryption Sequence Started', {
      description: `Encrypting ${file.name} with AES-256-GCM...`,
    })

    // Reset form after "upload"
    setTimeout(() => {
      toast.success('Upload Complete', {
        description: 'Packet encrypted and stored securely.',
      })
      setFile(null)
      setClassification('')
      setTargetTeam('')
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-mono">
          Secure Upload
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          Encrypt and transmit telemetry data to the gateway
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
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
                  relative border-2 border-dashed rounded-lg p-12
                  flex flex-col items-center justify-center gap-4
                  transition-all duration-200 cursor-pointer
                  ${
                    isDragging
                      ? 'border-primary bg-primary/10'
                      : file
                        ? 'border-success bg-success/5'
                        : 'border-border hover:border-muted-foreground'
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
                    <div className="size-16 rounded-full bg-success/20 flex items-center justify-center">
                      <FileUp className="size-8 text-success" />
                    </div>
                    <div className="text-center">
                      <p className="text-foreground font-mono">{file.name}</p>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
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
                      className="font-mono text-xs"
                    >
                      Remove File
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="size-16 rounded-full bg-secondary flex items-center justify-center">
                      <Upload className="size-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-foreground font-mono">
                        Drag & Drop Telemetry File
                      </p>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        or click to browse
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
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
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                <Shield className="size-5" />
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="classification" className="font-mono text-xs text-muted-foreground">
                  Classification Level
                </Label>
                <Select value={classification} onValueChange={setClassification}>
                  <SelectTrigger className="w-full font-mono">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public" className="font-mono">
                      Public
                    </SelectItem>
                    <SelectItem value="restricted" className="font-mono">
                      Restricted
                    </SelectItem>
                    <SelectItem value="top-secret" className="font-mono">
                      Top Secret
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                <Users className="size-5" />
                Target Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team" className="font-mono text-xs text-muted-foreground">
                  Destination Team
                </Label>
                <Input
                  id="team"
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(e.target.value)}
                  placeholder="e.g., Scuderia Ferrari"
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleUpload}
            className="w-full font-mono"
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
