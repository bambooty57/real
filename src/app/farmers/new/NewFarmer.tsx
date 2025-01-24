'use client';

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AddressSearch from '@/components/AddressSearch'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { v4 as uuidv4 } from 'uuid'
import { Equipment } from '@/types/farmer'

interface FormData {
  name: string;
  businessName: string;
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
  canReceiveMail: boolean;
  phone: string;
  ageGroup: string;
  memo: string;
  farmerImages: string[];
  mainCrop: {
    rice: boolean;
    barley: boolean;
    hanwoo: boolean;
    soybean: boolean;
    sweetPotato: boolean;
    persimmon: boolean;
    pear: boolean;
    plum: boolean;
    sorghum: boolean;
    goat: boolean;
    other: boolean;
  };
  farmingTypes: {
    paddyFarming: boolean;
    fieldFarming: boolean;
    orchard: boolean;
    livestock: boolean;
    forageCrop: boolean;
  };
  equipments: Equipment[];
  rating: number;
}

interface Props {
  mode?: string;
  farmerId?: string;
  initialData?: FormData | null;
}

export default function NewFarmer({ mode = 'new', farmerId = '', initialData = null }: Props) {
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      return {
        ...initialData,
        equipments: initialData.equipments?.map((eq: Equipment) => ({
          ...eq,
          id: eq.id || uuidv4()  // 기존 id가 없으면 새로 생성
        })) || []
      };
    }
    return {
      name: '',
      businessName: '',
      zipCode: '',
      roadAddress: '',
      jibunAddress: '',
      addressDetail: '',
      canReceiveMail: false,
      phone: '',
      ageGroup: '',
      memo: '',
      farmerImages: [],
      mainCrop: {
        rice: false,
        barley: false,
        hanwoo: false,
        soybean: false,
        sweetPotato: false,
        persimmon: false,
        pear: false,
        plum: false,
        sorghum: false,
        goat: false,
        other: false
      },
      farmingTypes: {
        paddyFarming: false,
        fieldFarming: false,
        orchard: false,
        livestock: false,
        forageCrop: false,
      },
      equipments: [],  // 빈 배열로 초기화
      rating: 0
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Firebase에 저장할 데이터 준비
      const saveData = {
        name: formData.name,
        businessName: formData.businessName,
        zipCode: formData.zipCode,
        roadAddress: formData.roadAddress,
        jibunAddress: formData.jibunAddress,
        addressDetail: formData.addressDetail,
        canReceiveMail: formData.canReceiveMail,
        phone: formData.phone,
        ageGroup: formData.ageGroup,
        memo: formData.memo,
        farmerImages: formData.farmerImages,
        mainCrop: formData.mainCrop,
        farmingTypes: formData.farmingTypes,
        equipments: formData.equipments,
        rating: formData.rating
      }

      if (mode === 'edit' && farmerId) {
        // 수정 모드
        const docRef = doc(db, 'farmers', farmerId)
        await updateDoc(docRef, saveData)
        router.push('/farmers')  // 수정 후 목록 페이지로 이동
      } else {
        // 새로운 등록 모드
        const docRef = collection(db, 'farmers')
        const newFarmerRef = await addDoc(docRef, saveData)
        router.push(`/farmers/${newFarmerRef.id}`)  // 등록 후 상세 페이지로 이동
      }
    } catch (error) {
      console.error('Error saving farmer:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{mode === 'edit' ? '농민 정보 수정' : '새 농민 등록'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">기본 정보</h2>
          
          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름 *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* 별점 평가 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">별점 평가</label>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setFormData((prev: FormData) => ({
                      ...prev,
                      rating: star
                    }))
                  }}
                  className={`p-1 ${
                    formData.rating >= star
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* 상호명 */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">상호명</label>
            <input
              type="text"
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, businessName: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">주소 *</label>
            <AddressSearch
              onComplete={(data: { zonecode: string; roadAddress: string; jibunAddress?: string; }) => {
                setFormData(prev => ({
                  ...prev,
                  zipCode: data.zonecode,
                  roadAddress: data.roadAddress,
                  jibunAddress: data.jibunAddress || '',
                }))
              }}
            />
            
            {/* 우편번호 */}
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">우편번호</label>
              <input
                type="text"
                id="zipCode"
                value={formData.zipCode}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>

            {/* 도로명 주소 */}
            <div>
              <label htmlFor="roadAddress" className="block text-sm font-medium text-gray-700">도로명 주소</label>
              <input
                type="text"
                id="roadAddress"
                value={formData.roadAddress}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>

            {/* 지번 주소 */}
            <div>
              <label htmlFor="jibunAddress" className="block text-sm font-medium text-gray-700">지번 주소</label>
              <input
                type="text"
                id="jibunAddress"
                value={formData.jibunAddress}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>
          </div>

          {/* 상세주소 */}
          <div>
            <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700">상세주소</label>
            <input
              type="text"
              id="addressDetail"
              value={formData.addressDetail}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, addressDetail: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* 우편수취가능여부 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.canReceiveMail}
                onChange={(e) => setFormData((prev: FormData) => ({ ...prev, canReceiveMail: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">우편수취 가능</span>
            </label>
          </div>

          {/* 전화번호 */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">전화번호 *</label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                010
              </span>
              <input
                type="text"
                id="phone"
                value={formData.phone.replace(/^010/, '')}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length > 8) value = value.slice(0, 8);
                  if (value.length >= 4) {
                    value = value.slice(0, 4) + '-' + value.slice(4);
                  }
                  setFormData((prev: FormData) => ({ ...prev, phone: '010' + value }));
                }}
                placeholder="0000-0000"
                maxLength={9}
                className="mt-1 block w-full rounded-r-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* 연령대 */}
          <div>
            <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">연령대 *</label>
            <select
              id="ageGroup"
              value={formData.ageGroup}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, ageGroup: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">선택하세요</option>
              <option value="20대">20대</option>
              <option value="30대">30대</option>
              <option value="40대">40대</option>
              <option value="50대">50대</option>
              <option value="60대">60대</option>
              <option value="70대 이상">70대 이상</option>
            </select>
          </div>
        </div>

        {/* 영농 정보 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">영농 정보</h2>
          
          {/* 영농형태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">영농형태</label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData.farmingTypes).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData((prev: FormData) => ({
                      ...prev,
                      farmingTypes: {
                        ...prev.farmingTypes,
                        [key]: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {key === 'paddyFarming' ? '벼농사' :
                     key === 'fieldFarming' ? '밭농사' :
                     key === 'orchard' ? '과수원' :
                     key === 'livestock' ? '축산업' :
                     key === 'forageCrop' ? '사료작물' : key}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 주작물 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">주작물</label>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(formData.mainCrop).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData((prev: FormData) => ({
                      ...prev,
                      mainCrop: {
                        ...prev.mainCrop,
                        [key]: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {key === 'rice' ? '벼' :
                     key === 'barley' ? '보리' :
                     key === 'hanwoo' ? '한우' :
                     key === 'soybean' ? '콩' :
                     key === 'sweetPotato' ? '고구마' :
                     key === 'persimmon' ? '감' :
                     key === 'pear' ? '배' :
                     key === 'plum' ? '매실' :
                     key === 'sorghum' ? '수수' :
                     key === 'goat' ? '염소' :
                     key === 'other' ? '기타' : key}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label htmlFor="memo" className="block text-sm font-medium text-gray-700">메모</label>
            <textarea
              id="memo"
              value={formData.memo}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, memo: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 농민 이미지 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">농민 이미지</h2>
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const uploadedUrls = await Promise.all(
                  files.map(async (file) => {
                    const storageRef = ref(storage, `farmers/${uuidv4()}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    return getDownloadURL(snapshot.ref);
                  })
                );
                setFormData((prev: FormData) => ({
                  ...prev,
                  farmerImages: [...prev.farmerImages, ...uploadedUrls]
                }));
              }}
              className="mt-1 block w-full"
            />
            <div className="mt-2 grid grid-cols-4 gap-2">
              {formData.farmerImages.map((url, index) => (
                <div key={url} className="relative">
                  <img src={url} alt={`농민 이미지 ${index + 1}`} className="w-full h-32 object-cover rounded" />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const imageRef = ref(storage, url);
                        await deleteObject(imageRef);
                        setFormData((prev: FormData) => ({
                          ...prev,
                          farmerImages: prev.farmerImages.filter(u => u !== url)
                        }));
                      } catch (error) {
                        console.error('Error deleting image:', error);
                      }
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 농기계 정보 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">농기계 정보</h2>
          
          {/* 농기계 목록 */}
          <div className="space-y-4">
            {formData.equipments.map((equipment, index) => (
              <div key={equipment.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">농기계 {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.filter(eq => eq.id !== equipment.id)
                      }))
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>

                {/* 농기계 종류 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">농기계 종류</label>
                  <select
                    value={equipment.type}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? { ...eq, type: e.target.value }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="트랙터">트랙터</option>
                    <option value="이앙기">이앙기</option>
                    <option value="콤바인">콤바인</option>
                    <option value="지게차">지게차</option>
                    <option value="굴삭기">굴삭기</option>
                    <option value="스키로더">스키로더</option>
                    <option value="건조기">건조기</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                {/* 로터리 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">모델명</label>
                  <input
                    type="text"
                    value={equipment.attachments?.rotary?.model || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? {
                                ...eq,
                                attachments: {
                                  ...eq.attachments,
                                  rotary: { ...eq.attachments?.rotary, model: e.target.value }
                                }
                              }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="모델명을 입력하세요"
                  />
                </div>

                {/* 제조사 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">제조사</label>
                  <select
                    value={equipment.attachments?.rotary?.manufacturer || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? {
                                ...eq,
                                attachments: {
                                  ...eq.attachments,
                                  rotary: { ...eq.attachments?.rotary, manufacturer: e.target.value }
                                }
                              }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="woongjin">웅진</option>
                    <option value="samwon">삼원</option>
                    <option value="weeken">위켄</option>
                    <option value="youngjin">영진</option>
                    <option value="agros">아그로스</option>
                    <option value="chelli">첼리</option>
                    <option value="jungang">중앙</option>
                    <option value="folder">폴더</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                {/* 전륜 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">모델명</label>
                  <input
                    type="text"
                    value={equipment.attachments?.frontWheel?.model || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? {
                                ...eq,
                                attachments: {
                                  ...eq.attachments,
                                  frontWheel: { ...eq.attachments?.frontWheel, model: e.target.value }
                                }
                              }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="모델명을 입력하세요"
                  />
                </div>

                {/* 제조사 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">제조사</label>
                  <select
                    value={equipment.attachments?.frontWheel?.manufacturer || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? {
                                ...eq,
                                attachments: {
                                  ...eq.attachments,
                                  frontWheel: { ...eq.attachments?.frontWheel, manufacturer: e.target.value }
                                }
                              }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="heungah">흥아</option>
                    <option value="bkt">bkt</option>
                    <option value="michelin">미셀린</option>
                    <option value="india">인도</option>
                    <option value="china">중국</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                {/* 후륜 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">모델명</label>
                  <input
                    type="text"
                    value={equipment.attachments?.rearWheel?.model || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? {
                                ...eq,
                                attachments: {
                                  ...eq.attachments,
                                  rearWheel: { ...eq.attachments?.rearWheel, model: e.target.value }
                                }
                              }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="모델명을 입력하세요"
                  />
                </div>

                {/* 제조사 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">제조사</label>
                  <select
                    value={equipment.attachments?.rearWheel?.manufacturer || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? {
                                ...eq,
                                attachments: {
                                  ...eq.attachments,
                                  rearWheel: { ...eq.attachments?.rearWheel, manufacturer: e.target.value }
                                }
                              }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="heungah">흥아</option>
                    <option value="bkt">bkt</option>
                    <option value="michelin">미셀린</option>
                    <option value="india">인도</option>
                    <option value="china">중국</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                {/* 마력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">마력</label>
                  <input
                    type="number"
                    value={equipment.horsepower}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? { ...eq, horsepower: e.target.value }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="마력을 입력하세요"
                  />
                </div>

                {/* 연식 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">연식</label>
                  <select
                    value={equipment.year}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? { ...eq, year: e.target.value }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    {Array.from({ length: 36 }, (_, i) => 1990 + i).map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                </div>

                {/* 사용시간 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">사용시간</label>
                  <input
                    type="text"
                    value={equipment.usageHours}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? { ...eq, usageHours: e.target.value }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="사용시간을 입력하세요"
                  />
                </div>

                {/* 상태 평가 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태 평가</label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setFormData((prev: FormData) => ({
                            ...prev,
                            equipments: prev.equipments.map(eq =>
                              eq.id === equipment.id
                                ? { ...eq, condition: star }
                                : eq
                            )
                          }))
                        }}
                        className={`p-1 ${
                          (equipment.condition ?? 0) >= star
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* 거래 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">거래 유형</label>
                  <select
                    value={equipment.saleType || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? { ...eq, saleType: e.target.value as 'new' | 'used' | null }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="new">신규</option>
                    <option value="used">중고</option>
                  </select>
                </div>

                {/* 거래 방식 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">거래 방식</label>
                  <select
                    value={equipment.tradeType || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? { ...eq, tradeType: e.target.value }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="판매희망">판매희망</option>
                    <option value="구매희망">구매희망</option>
                  </select>
                </div>

                {/* 거래 상황 */}
                <div className="space-y-4">
                {/* 판매 상태 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">판매 상태</label>
                  <select
                    value={equipment.saleStatus || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? { ...eq, saleStatus: e.target.value }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="가능">가능</option>
                    <option value="완료">완료</option>
                  </select>
                </div>

                {/* 구매 상태 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">구매 상태</label>
                  <select
                    value={equipment.purchaseStatus || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? { ...eq, purchaseStatus: e.target.value }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="가능">가능</option>
                    <option value="완료">완료</option>
                  </select>
                </div>
                    </div>
                    
                {/* 희망가격 */}
                    <div>
                  <label className="block text-sm font-medium text-gray-700">희망가격</label>
                      <input
                        type="text"
                    value={equipment.desiredPrice}
                        onChange={(e) => {
                          setFormData((prev: FormData) => ({
                            ...prev,
                            equipments: prev.equipments.map(eq =>
                              eq.id === equipment.id
                            ? { ...eq, desiredPrice: e.target.value }
                                : eq
                            )
                          }))
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="희망가격을 입력하세요"
                  />
                </div>

                {/* 농기계 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">농기계 이미지 (최대 4장)</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            setFormData((prev: FormData) => ({
                              ...prev,
                              equipments: prev.equipments.map(eq =>
                                eq.id === equipment.id
                                  ? { 
                                      ...eq, 
                                      images: eq.images ? 
                                        [...eq.images.slice(0, index), e.target.files?.[0] || null, ...eq.images.slice(index + 1)] 
                                        : Array(4).fill(null).map((_, i) => i === index ? e.target.files?.[0] || null : null)
                                    }
                                  : eq
                              )
                            }))
                          }}
                          className="hidden"
                          id={`equipment-image-${equipment.id}-${index}`}
                        />
                        <label
                          htmlFor={`equipment-image-${equipment.id}-${index}`}
                          className="block w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-blue-500 cursor-pointer"
                        >
                          {equipment.images?.[index] ? (
                            <img
                              src={
                                typeof equipment.images[index] === 'string'
                                  ? equipment.images[index] as string
                                  : equipment.images[index] instanceof File
                                    ? URL.createObjectURL(equipment.images[index] as File)
                                    : ''
                              }
                              alt={`농기계 이미지 ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <span>이미지 추가</span>
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 로더 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">제조사</label>
                  <select
                    value={equipment.attachments?.loader?.manufacturer || ''}
                    onChange={(e) => {
                      setFormData((prev: FormData) => ({
                        ...prev,
                        equipments: prev.equipments.map(eq =>
                          eq.id === equipment.id
                            ? {
                                ...eq,
                                attachments: {
                                  ...eq.attachments,
                                  loader: { ...eq.attachments?.loader, manufacturer: e.target.value }
                                }
                              }
                            : eq
                        )
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="hanil">한일</option>
                    <option value="taesung">태성</option>
                    <option value="ansung">안성</option>
                    <option value="heemang">희망</option>
                    <option value="jangsu">장수</option>
                    <option value="bonsa">본사</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* 농기계 추가 버튼 */}
          <button
            type="button"
            onClick={() => {
              setFormData((prev: FormData) => ({
                ...prev,
                equipments: [
                  ...prev.equipments,
                  {
                    id: uuidv4(),
                    type: '',
                    manufacturer: '',
                    model: '',
                    horsepower: '',
                    year: '',
                    usageHours: '',
                    condition: 0,
                    rating: 0,
                    attachments: {
                      loader: {
                        model: '',
                        manufacturer: '',
                        condition: 0,
                        memo: '',
                        images: []
                      },
                      rotary: {
                        model: '',
                        manufacturer: '',
                        condition: 0,
                        memo: '',
                        images: []
                      },
                      frontWheel: {
                        model: '',
                        manufacturer: '',
                        condition: 0,
                        memo: '',
                        images: []
                      },
                      rearWheel: {
                        model: '',
                        manufacturer: '',
                        condition: 0,
                        memo: '',
                        images: []
                      }
                    },
                    saleType: null,
                    tradeType: '',
                    saleStatus: '',
                    purchaseStatus: '',
                    desiredPrice: '',
                    memo: '',
                    images: []
                  } as Equipment
                ]
              }))
            }}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            농기계 추가
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          {mode === 'edit' ? '수정하기' : '등록하기'}
        </button>
      </form>
    </div>
  )
} 