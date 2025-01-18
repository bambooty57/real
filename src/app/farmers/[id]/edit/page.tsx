'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function EditFarmer({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    ageGroup: '',
    mainCrop: '',
    equipment: {
      type: '',
      manufacturer: '',
      attachments: {
        loader: '',
        rotary: '',
        wheels: ''
      }
    }
  })

  const manufacturers = ['대동', '국제', '엘에스', '얀마', '구보다', '존디어', '뉴홀랜드', '엠에프', '케이스', '현대', '삼성', '볼보', '히타치', '두산']
  const equipmentTypes = ['트랙터', '이앙기', '콤바인', '지게차', '굴삭기', '스키로더', '기타']
  const loaderTypes = ['본사', '안성', '태성', '희망', '장수', '기타']
  const rotaryTypes = ['삼원', '웅진', '삼농', '위켄', '첼리', '영진', '중앙', '아그로스', '기타']
  const wheelTypes = ['흥아', 'BKT', '미쉐린', '기타']

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const docRef = doc(db, 'farmers', params.id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          setFormData({
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            ageGroup: data.ageGroup || '',
            mainCrop: data.mainCrop || '',
            equipment: {
              type: data.equipment?.type || '',
              manufacturer: data.equipment?.manufacturer || '',
              attachments: {
                loader: data.equipment?.attachments?.loader || '',
                rotary: data.equipment?.attachments?.rotary || '',
                wheels: data.equipment?.attachments?.wheels || ''
              }
            }
          })
        } else {
          alert('농민 정보를 찾을 수 없습니다.')
          router.push('/farmers')
        }
      } catch (error) {
        console.error('Error fetching farmer:', error)
        alert('정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchFarmer()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const docRef = doc(db, 'farmers', params.id)
      await updateDoc(docRef, formData)
      alert('수정되었습니다.')
      router.push(`/farmers/${params.id}`)
    } catch (error) {
      console.error('Error updating farmer:', error)
      alert('수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.')
      if (grandchild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            attachments: {
              ...prev[parent].attachments,
              [grandchild]: value
            }
          }
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  if (loading) return <div className="p-8">로딩중...</div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">기본 정보</h2>
          
          <div>
            <label className="block mb-2">이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-2">주소</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-2">전화번호</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-2">연령대</label>
            <select
              name="ageGroup"
              value={formData.ageGroup}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">선택하세요</option>
              {['30대', '40대', '50대', '60대', '70대'].map(age => (
                <option key={age} value={age}>{age}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">주요 농작물</label>
            <input
              type="text"
              name="mainCrop"
              value={formData.mainCrop}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">농기계 정보</h2>
          
          <div>
            <label className="block mb-2">농기계 종류</label>
            <select
              name="equipment.type"
              value={formData.equipment.type}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">선택하세요</option>
              {equipmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">제조회사</label>
            <select
              name="equipment.manufacturer"
              value={formData.equipment.manufacturer}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">선택하세요</option>
              {manufacturers.map(manufacturer => (
                <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
              ))}
            </select>
          </div>

          {formData.equipment.type === '트랙터' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">작업기 정보</h3>
              
              <div>
                <label className="block mb-2">로더</label>
                <select
                  name="equipment.attachments.loader"
                  value={formData.equipment.attachments.loader}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {loaderTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">로터리</label>
                <select
                  name="equipment.attachments.rotary"
                  value={formData.equipment.attachments.rotary}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {rotaryTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">바퀴</label>
                <select
                  name="equipment.attachments.wheels"
                  value={formData.equipment.attachments.wheels}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {wheelTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
} 