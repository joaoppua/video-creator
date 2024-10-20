"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, RefreshCw } from "lucide-react"
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

const ffmpeg = new FFmpeg()

export default function Home() {
  const [images, setImages] = useState<File[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ffmpeg.load()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleCreateVideo = async () => {
    setIsLoading(true)
    setProgress(0)

    try {
      await ffmpeg.load()

      // Write images to FFmpeg virtual file system
      for (let i = 0; i < images.length; i++) {
        const imageName = `image${i}.jpg`
        await ffmpeg.writeFile(imageName, await fetchFile(images[i]))
      }

      // Create a text file for the title and subtitle
      await ffmpeg.writeFile('title.txt', 'ENSAIO GESTANTE')
      await ffmpeg.writeFile('subtitle.txt', 'ETERNIZE ESSE MOMENTO ESPECIAL')

      // Create video from images with effects
      await ffmpeg.exec([
        '-framerate', '1/3',
        '-i', 'image%d.jpg',
        '-vf', `
          zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=125,
          drawtext=fontfile=/font.ttf:fontsize=30:fontcolor=white:x=(w-tw)/2:y=(h-th)/2:textfile=title.txt:enable='between(t,0,3)',
          drawtext=fontfile=/font.ttf:fontsize=20:fontcolor=white:x=(w-tw)/2:y=h-th-20:textfile=subtitle.txt:enable='between(t,0,3)',
          fade=t=in:st=0:d=1,fade=t=out:st=2:d=1
        `,
        '-c:v', 'libx264',
        
