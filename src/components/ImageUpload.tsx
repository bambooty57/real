'use client'

import { useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import Image from 'next/image'

interface ImageUploadProps {
  farmerId: string
  category: 'basic' | 'equipment' | 'attachment'
  onUploadComplete: (url: string) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function ImageUpload({ farmerId, category, onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크
    if (file.size > MAX_FILE_SIZE) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.')
      return
    }

    try {
      setUploading(true)
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Firebase Storage에 직접 업로드
      const timestamp = Date.now()
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
      const storageRef = ref(storage, `farmers/${farmerId}/${category}/${timestamp}-${cleanFileName}`)
      
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      onUploadComplete(downloadURL)
      
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
          {uploading ? '업로드 중...' : '사진 선택'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <span className="text-sm text-gray-500">최대 10MB</span>
      </div>

      {preview && (
        <div className="relative w-40 h-40">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover rounded"
          />
        </div>
      )}
    </div>
  )
} 