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
        ffmpeg.writeFile(imageName, await fetchFile(images[i]))
      }

      // Create a text file for the title and subtitle
      ffmpeg.writeFile('title.txt', 'ENSAIO GESTANTE')
      ffmpeg.writeFile('subtitle.txt', 'ETERNIZE ESSE MOMENTO ESPECIAL')

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
        '-pix_fmt', 'yuv420p',
        'output.mp4'
      ])

      // Read the resulting video
      const data = await ffmpeg.readFile('output.mp4')

      // Create a URL for the video
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' })
      const videoUrl = URL.createObjectURL(videoBlob)
      setVideoUrl(videoUrl)
    } catch (error) {
      console.error('Error creating video:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement('a')
      a.href = videoUrl
      a.download = 'ensaio_gestante.mp4'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleReset = () => {
    setImages([])
    setVideoUrl(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Criador de Vídeo de Imagens</h1>
      {!videoUrl ? (
        <>
          <div className="mb-4">
            <Label htmlFor="image-upload">Carregar Imagens</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>
          <p className="mb-2">Imagens selecionadas: {images.length}</p>
          <Button
            onClick={handleCreateVideo}
            disabled={images.length === 0 || isLoading}
            className="w-full mb-2"
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Criando vídeo...' : 'Criar Vídeo'}
          </Button>
          {isLoading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
            </div>
          )}
        </>
      ) : (
        <>
          <video className="w-full mb-4" controls src={videoUrl}>
            Seu navegador não suporta o elemento de vídeo.
          </video>
          <Button onClick={handleDownload} className="w-full mb-2">
            <Download className="mr-2 h-4 w-4" />
            Download do Vídeo
          </Button>
          <Button onClick={handleReset} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
        </>
      )}
    </div>
  )
}
