'use client'

import { useState, useEffect } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage, auth } from '@/lib/firebase'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { onAuthStateChanged, getAuth } from 'firebase/auth'

interface ImageUploadProps {
  farmerId: string
  category: 'basic' | 'equipment' | 'attachment'
  onUploadComplete: (url: string) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function ImageUpload({ farmerId, category, onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // 인증 상태 변경 감지
    const auth = getAuth();
    console.log('Current Auth State:', {
      currentUser: auth.currentUser,
      uid: auth.currentUser?.uid,
      isAuthenticated: !!auth.currentUser
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      console.log('Auth State Changed:', {
        user: !!user,
        uid: user?.uid,
        email: user?.email
      });
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const auth = getAuth();
    // 인증 상태 체크 및 토큰 갱신
    if (!auth.currentUser) {
      console.log('Auth Check Failed:', {
        currentUser: auth.currentUser,
        isAuthenticated
      });
      toast.error('로그인이 필요합니다.');
      return;
    }

    // 파일 크기 체크
    if (file.size > MAX_FILE_SIZE) {
      toast.error('파일 크기는 10MB를 초과할 수 없습니다.')
      return
    }

    try {
      // 토큰 갱신
      const token = await auth.currentUser.getIdToken(true);
      console.log('Token refreshed:', !!token);

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
      const path = `farmers/${farmerId}/${category}/${timestamp}-${cleanFileName}`
      const storageRef = ref(storage, path)
      
      console.log('Upload Attempt:', {
        path,
        farmerId,
        category,
        fileName: cleanFileName,
        authState: {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
          token: token.substring(0, 10) + '...'
        }
      })
      
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      console.log('Upload Success:', {
        path: snapshot.ref.fullPath,
        downloadUrl: downloadURL
      })
      
      onUploadComplete(downloadURL)
      toast.success('이미지가 업로드되었습니다.')
      
    } catch (error: any) {
      console.error('Upload Error:', {
        code: error.code,
        message: error.message,
        serverResponse: error.serverResponse,
        name: error.name
      })
      if (error.code === 'storage/unauthorized') {
        toast.error('이메일 인증이 필요합니다. 이메일을 확인해주세요.')
      } else {
        toast.error(error?.message || '이미지 업로드 중 오류가 발생했습니다.')
      }
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
            disabled={uploading || !isAuthenticated}
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