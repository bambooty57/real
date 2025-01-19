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
      model: '',
      year: '',
      usageHours: '',
      rating: '',
      attachments: {
        loader: '',
        loaderModel: '',
        loaderRating: '',
        rotary: '',
        rotaryModel: '',
        rotaryRating: '',
        frontWheel: '',
        frontWheelModel: '',
        frontWheelRating: '',
        rearWheel: '',
        rearWheelModel: '',
        rearWheelRating: '',
        cutter: '',
        cutterModel: '',
        cutterRating: '',
        rows: '',
        rowsModel: '',
        rowsRating: '',
        tonnage: '',
        tonnageModel: '',
        tonnageRating: '',
        size: '',
        sizeModel: '',
        sizeRating: '',
        bucketSize: '',
        bucketModel: '',
        bucketRating: ''
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
              model: data.equipment?.model || '',
              year: data.equipment?.year || '',
              usageHours: data.equipment?.usageHours || '',
              rating: data.equipment?.rating || '',
              attachments: {
                loader: data.equipment?.attachments?.loader || '',
                loaderModel: data.equipment?.attachments?.loaderModel || '',
                loaderRating: data.equipment?.attachments?.loaderRating || '',
                rotary: data.equipment?.attachments?.rotary || '',
                rotaryModel: data.equipment?.attachments?.rotaryModel || '',
                rotaryRating: data.equipment?.attachments?.rotaryRating || '',
                frontWheel: data.equipment?.attachments?.frontWheel || '',
                frontWheelModel: data.equipment?.attachments?.frontWheelModel || '',
                frontWheelRating: data.equipment?.attachments?.frontWheelRating || '',
                rearWheel: data.equipment?.attachments?.rearWheel || '',
                rearWheelModel: data.equipment?.attachments?.rearWheelModel || '',
                rearWheelRating: data.equipment?.attachments?.rearWheelRating || '',
                cutter: data.equipment?.attachments?.cutter || '',
                cutterModel: data.equipment?.attachments?.cutterModel || '',
                cutterRating: data.equipment?.attachments?.cutterRating || '',
                rows: data.equipment?.attachments?.rows || '',
                rowsModel: data.equipment?.attachments?.rowsModel || '',
                rowsRating: data.equipment?.attachments?.rowsRating || '',
                tonnage: data.equipment?.attachments?.tonnage || '',
                tonnageModel: data.equipment?.attachments?.tonnageModel || '',
                tonnageRating: data.equipment?.attachments?.tonnageRating || '',
                size: data.equipment?.attachments?.size || '',
                sizeModel: data.equipment?.attachments?.sizeModel || '',
                sizeRating: data.equipment?.attachments?.sizeRating || '',
                bucketSize: data.equipment?.attachments?.bucketSize || '',
                bucketModel: data.equipment?.attachments?.bucketModel || '',
                bucketRating: data.equipment?.attachments?.bucketRating || ''
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
            <label className="block mb-2">본기 종류</label>
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

          <div>
            <label className="block mb-2">모델</label>
            <input
              type="text"
              name="equipment.model"
              value={formData.equipment.model}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="모델명을 입력하세요"
            />
          </div>

          <div>
            <label className="block mb-2">연식</label>
            <select
              name="equipment.year"
              value={formData.equipment.year}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">선택하세요</option>
              {Array.from({length: 24}, (_, i) => {
                const year = 2024 - i;
                return (
                  <option key={year} value={year}>{year}년식</option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block mb-2">사용시간</label>
            <input
              type="number"
              name="equipment.usageHours"
              value={formData.equipment.usageHours}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="시간 단위로 입력"
            />
          </div>

          <div>
            <label className="block mb-2">상태 평가</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star} className="flex items-center">
                  <input
                    type="radio"
                    name="equipment.rating"
                    value={star}
                    checked={formData.equipment.rating === star.toString()}
                    onChange={handleChange}
                    className="mr-1"
                  />
                  {star}점
                </label>
              ))}
            </div>
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
                <label className="block mb-2">로더 모델</label>
                <input
                  type="text"
                  name="equipment.attachments.loaderModel"
                  value={formData.equipment.attachments.loaderModel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="모델명을 입력하세요"
                />
              </div>

              <div>
                <label className="block mb-2">로더 상태 평가</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <label key={star} className="flex items-center">
                      <input
                        type="radio"
                        name="equipment.attachments.loaderRating"
                        value={star}
                        checked={formData.equipment.attachments.loaderRating === star.toString()}
                        onChange={handleChange}
                        className="mr-1"
                      />
                      {star}점
                    </label>
                  ))}
                </div>
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
                <label className="block mb-2">로터리 모델</label>
                <input
                  type="text"
                  name="equipment.attachments.rotaryModel"
                  value={formData.equipment.attachments.rotaryModel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="모델명을 입력하세요"
                />
              </div>

              <div>
                <label className="block mb-2">로터리 상태 평가</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <label key={star} className="flex items-center">
                      <input
                        type="radio"
                        name="equipment.attachments.rotaryRating"
                        value={star}
                        checked={formData.equipment.attachments.rotaryRating === star.toString()}
                        onChange={handleChange}
                        className="mr-1"
                      />
                      {star}점
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2">전륜</label>
                <select
                  name="equipment.attachments.frontWheel"
                  value={formData.equipment.attachments.frontWheel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {wheelTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">전륜 모델</label>
                <input
                  type="text"
                  name="equipment.attachments.frontWheelModel"
                  value={formData.equipment.attachments.frontWheelModel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="모델명을 입력하세요"
                />
              </div>

              <div>
                <label className="block mb-2">전륜 상태 평가</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <label key={star} className="flex items-center">
                      <input
                        type="radio"
                        name="equipment.attachments.frontWheelRating"
                        value={star}
                        checked={formData.equipment.attachments.frontWheelRating === star.toString()}
                        onChange={handleChange}
                        className="mr-1"
                      />
                      {star}점
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2">후륜</label>
                <select
                  name="equipment.attachments.rearWheel"
                  value={formData.equipment.attachments.rearWheel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {wheelTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">후륜 모델</label>
                <input
                  type="text"
                  name="equipment.attachments.rearWheelModel"
                  value={formData.equipment.attachments.rearWheelModel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="모델명을 입력하세요"
                />
              </div>

              <div>
                <label className="block mb-2">후륜 상태 평가</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <label key={star} className="flex items-center">
                      <input
                        type="radio"
                        name="equipment.attachments.rearWheelRating"
                        value={star}
                        checked={formData.equipment.attachments.rearWheelRating === star.toString()}
                        onChange={handleChange}
                        className="mr-1"
                      />
                      {star}점
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formData.equipment.type === '콤바인' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">작업기 정보</h3>
              <div>
                <label className="block mb-2">예취부</label>
                <select
                  name="equipment.attachments.cutter"
                  value={formData.equipment.attachments?.cutter || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {['4조', '5조', '6조', '7조', '8조'].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.equipment.type === '이앙기' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">작업기 정보</h3>
              <div>
                <label className="block mb-2">작업열</label>
                <select
                  name="equipment.attachments.rows"
                  value={formData.equipment.attachments?.rows || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {['4열', '5열', '6열', '7열', '8열'].map(rows => (
                    <option key={rows} value={rows}>{rows}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.equipment.type === '지게차' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">작업기 정보</h3>
              <div>
                <label className="block mb-2">톤수</label>
                <select
                  name="equipment.attachments.tonnage"
                  value={formData.equipment.attachments?.tonnage || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {['2.0톤', '2.5톤', '3.0톤', '3.5톤', '4.0톤', '4.5톤', '5.0톤'].map(tonnage => (
                    <option key={tonnage} value={tonnage}>{tonnage}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.equipment.type === '굴삭기' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">작업기 정보</h3>
              <div>
                <label className="block mb-2">규격</label>
                <select
                  name="equipment.attachments.size"
                  value={formData.equipment.attachments?.size || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {['1.0톤', '1.5톤', '2.0톤', '2.5톤', '3.0톤', '3.5톤', '4.0톤', '4.5톤', '5.0톤'].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.equipment.type === '스키로더' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">작업기 정보</h3>
              <div>
                <label className="block mb-2">버켓용량</label>
                <select
                  name="equipment.attachments.bucketSize"
                  value={formData.equipment.attachments?.bucketSize || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">선택하세요</option>
                  {['0.3㎥', '0.4㎥', '0.5㎥', '0.6㎥'].map(size => (
                    <option key={size} value={size}>{size}</option>
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