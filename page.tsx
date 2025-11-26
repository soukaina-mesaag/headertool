"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Page() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [pastedText, setPastedText] = useState("")
  const [fromName, setFromName] = useState("")
  const [subject, setSubject] = useState("")
  const [removeReturnPath, setRemoveReturnPath] = useState(true)
  const [getFileNumber, setGetFileNumber] = useState("")
  const [processedContent, setProcessedContent] = useState("")
  const [batchProcessedFiles, setBatchProcessedFiles] = useState([])

  const processHeader = (content) => {
    let result = content

    if (removeReturnPath) {
      const deliveredToIndex = result.indexOf("Delivered-To:")
      const returnPathIndex = result.indexOf("Return-Path:")
      if (deliveredToIndex !== -1 && returnPathIndex !== -1) {
        const endIndex = result.indexOf("\n", returnPathIndex) + 1
        result = result.substring(0, deliveredToIndex) + result.substring(endIndex)
      }
    }

    if (fromName) {
      result = result.replace(/From:.*?<.*?@.*?>/g, (match) => {
        const emailPart = match.match(/<(.*?)>/)?.[1]
        if (emailPart) {
          const emailBefore = emailPart.split("@")[0]
          return `From: ${fromName}<${emailBefore}@[P_RPATH]>`
        }
        return match
      })
    } else {
      // If no custom name, just replace domain
      result = result.replace(/From:.*?<(.*?)@.*?>/g, (match) => {
        const emailPart = match.match(/<(.*?)>/)?.[1]
        if (emailPart) {
          const emailBefore = emailPart.split("@")[0]
          const displayName = match.match(/From:\s*(.*?)\s*</)?.[1] || ""
          return `From: ${displayName}<${emailBefore}@[P_RPATH]>`
        }
        return match
      })
    }

    if (subject) {
      result = result.replace(/Subject:.*/g, `Subject: ${subject}`)
    }

    // Replace Message-ID with [EID] before @
    result = result.replace(/Message-ID:\s*<(.*?)@(.*?)>/g, `Message-ID: <$1[EID]@$2>`)

    return result
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    processFiles(files)
  }

  const processFiles = async (files) => {
    const newFiles = await Promise.all(
      files.map(async (file) => {
        const text = await file.text()
        return { name: file.name, content: text }
      }),
    )
    setUploadedFiles([...uploadedFiles, ...newFiles])
  }

  const handleCombine = () => {
    if (uploadedFiles.length === 0) return
    const combined = uploadedFiles.map((f) => processHeader(f.content)).join("\n__SEP__\n")
    setProcessedContent(combined)
  }

  const handleBatchProcess = () => {
    if (uploadedFiles.length === 0) return
    const processed = uploadedFiles.map((f, index) => ({
      number: index + 1,
      name: f.name,
      content: processHeader(f.content),
    }))
    setBatchProcessedFiles(processed)
  }

  const handleProcessPasted = () => {
    if (!pastedText.trim()) return
    const processed = processHeader(pastedText)
    setProcessedContent(processed)
  }

  const handleGetFile = () => {
    const fileNum = Number.parseInt(getFileNumber)
    if (fileNum > 0 && fileNum <= uploadedFiles.length) {
      const file = uploadedFiles[fileNum - 1]
      const processed = processHeader(file.content)
      setProcessedContent(processed)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(processedContent)
    alert("Copied to clipboard!")
  }

  const handleDownload = (content, fileName) => {
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content))
    element.setAttribute("download", fileName)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleClean = () => {
    setUploadedFiles([])
    setPastedText("")
    setProcessedContent("")
    setBatchProcessedFiles([])
    setFromName("")
    setSubject("")
    setGetFileNumber("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Email Header Processor</h1>
        <p className="text-muted-foreground mb-8">Process and modify email headers with ease</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Text Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Files */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Files (multiple files)</h2>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition"
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".txt,.eml,.msg"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <p className="text-muted-foreground">Drag and drop files here or click to select</p>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="font-medium text-foreground">Uploaded Files ({uploadedFiles.length})</p>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">{index + 1}</span>
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{file.content.length} characters</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {uploadedFiles.length > 0 && (
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCombine} className="flex-1 bg-primary hover:bg-primary/90">
                    Combine
                  </Button>
                  <Button onClick={handleBatchProcess} className="flex-1 bg-primary hover:bg-primary/90">
                    Batch Process
                  </Button>
                  <Button onClick={() => setUploadedFiles([])} variant="outline" className="flex-1 bg-transparent">
                    Clean
                  </Button>
                </div>
              )}
            </Card>

            {/* Paste Text Headers */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Paste Text Headers</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Or paste email headers directly without uploading files
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste email headers here..."
                className="w-full h-32 p-3 border border-input rounded-lg bg-background text-foreground"
              />
              <Button
                onClick={handleProcessPasted}
                className="mt-3 bg-primary hover:bg-primary/90"
                disabled={!pastedText.trim()}
              >
                Process
              </Button>
            </Card>

            {/* Get File by Number */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Get File</h2>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={getFileNumber}
                  onChange={(e) => {
                    setGetFileNumber(e.target.value)
                    if (e.target.value) {
                      const fileNum = Number.parseInt(e.target.value)
                      if (fileNum > 0 && fileNum <= uploadedFiles.length) {
                        const file = uploadedFiles[fileNum - 1]
                        const processed = processHeader(file.content)
                        setProcessedContent(processed)
                      }
                    }
                  }}
                  placeholder="Enter file number (1, 2, 3...)"
                  className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  min="1"
                />
              </div>
            </Card>
          </div>

          {/* Right Column - Manual Edits */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Manual Edits</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">From Name</label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="e.g., soso"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Changes: From: Your Name &lt;email@[P_RPATH]&gt;</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., amsaa"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Changes: Subject: Your Subject</p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium text-foreground mb-2 text-sm">Preview Changes</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>
                      <strong>From:</strong> {fromName ? `${fromName} <email@[P_RPATH]>` : "No changes"}
                    </p>
                    <p>
                      <strong>Subject:</strong> {subject ? subject : "No changes"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="removeReturnPath"
                    checked={removeReturnPath}
                    onChange={(e) => setRemoveReturnPath(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="removeReturnPath" className="text-sm text-foreground">
                    Remove Return-Path section
                  </label>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Processed Content */}
        {processedContent && (
          <Card className="mt-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Processed Content</h2>
            <div className="bg-muted p-4 rounded-lg mb-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
                {processedContent}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopy} className="flex-1 bg-primary hover:bg-primary/90">
                Copy
              </Button>
              <Button onClick={handleClean} variant="outline" className="flex-1 bg-transparent">
                Clean
              </Button>
            </div>
          </Card>
        )}

        {/* Batch Processed Files */}
        {batchProcessedFiles.length > 0 && (
          <Card className="mt-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Batch Processed Files</h2>
            <div className="space-y-4">
              {batchProcessedFiles.map((file) => (
                <div key={file.number} className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">
                        File {file.number}: {file.name}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDownload(file.content, `processed_${file.number}_${file.name}`)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Download
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-background p-2 rounded text-xs text-foreground font-mono">
                    {file.content.substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
