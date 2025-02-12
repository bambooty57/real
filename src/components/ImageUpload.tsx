'use client'

import { useState, useEffect } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage, auth } from '@/lib/firebase'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { onAuthStateChanged, getAuth, sendEmailVerification } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'

interface ImageUploadProps {
  farmerId: string
  category: 'basic' | 'equipment' | 'attachment'
  onUploadComplete: (url: string) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function ImageUpload({ farmerId, category, onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const { user } = useAuth();

  useEffect(() => {
    console.log('[Auth Debug] Component Mount:', {
      user: user?.email,
      isAuthenticated: !!user,
      emailVerified: user?.emailVerified,
      uid: user?.uid
    });

    if (user) {
      user.getIdToken(true)
        .then(token => {
          console.log('[Auth Debug] Token refreshed successfully:', {
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 10),
            user: user.email,
            emailVerified: user.emailVerified
          });
        });
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    console.log('[Upload Debug] Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      user: user?.email,
      emailVerified: user?.emailVerified
    });
    
    if (!user) {
      console.log('[Auth Debug] No user found');
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (!user.emailVerified) {
      console.log('[Auth Debug] Email not verified');
      toast.error('이메일 인증이 필요합니다. 인증 메일을 확인해주세요.');
      try {
        await sendEmailVerification(user);
        toast.success('인증 메일이 재전송되었습니다.');
      } catch (error) {
        console.error('[Auth Debug] Verification email failed:', error);
      }
      return;
    }

    // 파일 크기 체크
    if (file.size > MAX_FILE_SIZE) {
      toast.error('파일 크기는 10MB를 초과할 수 없습니다.')
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
      const timestamp = Date.now();
      const fileName = `${farmerId}/${category}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // 파일 업로드
      await uploadBytes(storageRef, file);
      
      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log('Upload Success:', { downloadURL });
      onUploadComplete(downloadURL);
      toast.success('이미지가 업로드되었습니다.');
      
    } catch (error: any) {
      console.error('Upload Error:', error)
      toast.error('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
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
            disabled={uploading || !user}
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