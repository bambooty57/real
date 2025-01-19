'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AddressSearch from '@/components/AddressSearch'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export default function NewFarmer({ mode = 'new', farmerId = '', initialData = null }) {
  const router = useRouter()
  const [formData, setFormData] = useState(initialData || {
    name: '',
    companyName: '',
    zipCode: '',
    roadAddress: '',
    roadAddressDetail: '',
    jibunAddress: '',
    jibunAddressDetail: '',
    canReceiveMail: false,
    phone: '',
    ageGroup: '',
    memo: '',
    farmerImages: [],
    mainImages: [],
    attachmentImages: {
      loader: [],
      rotary: [],
      frontWheel: [],
      rearWheel: [],
      cutter: [],
      rows: [],
      tonnage: [],
      size: [],
      bucketSize: []
    },
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
    equipments: []
  })

  const handleAddressSelect = (data: {
    zipCode: string;
    roadAddress: string;
    roadAddressDetail: string;
    jibunAddress: string;
    jibunAddressDetail: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }))
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.length <= 13) {
      setFormData({...formData, phone: formatted});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'edit') {
        const docRef = doc(db, 'farmers', farmerId)
        await updateDoc(docRef, formData)
        router.push(`/farmers/${farmerId}`)
      } else {
        await addDoc(collection(db, 'farmers'), formData)
        router.push('/')
      }
    } catch (error) {
      console.error('Error saving farmer:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string, subType?: string) => {
    const files = e.target.files;
    if (!files) return;

    const maxFiles = 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    // 파일 개수 체크
    if (files.length > maxFiles) {
      alert(`최대 ${maxFiles}장까지 업로드 가능합니다.`);
      return;
    }

    // 각 파일 처리
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 파일 타입 체크
      if (!allowedTypes.includes(file.type)) {
        alert('JPG, PNG 파일만 업로드 가능합니다.');
        continue;
      }

      // 파일 크기 체크
      if (file.size > maxSize) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        continue;
      }

      try {
        // Firebase Storage에 업로드
        const storageRef = ref(storage, `farmers/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // 상태 업데이트
        setFormData(prev => {
          if (type === 'farmer') {
            return {
              ...prev,
              farmerImages: [...prev.farmerImages, url].slice(0, 4)
            };
          } else if (type === 'main') {
            return {
              ...prev,
              mainImages: [...prev.mainImages, url].slice(0, 4)
            };
          } else if (type === 'attachment' && subType) {
            return {
              ...prev,
              attachmentImages: {
                ...prev.attachmentImages,
                [subType]: [...prev.attachmentImages[subType], url].slice(0, 4)
              }
            };
          } else if (type === 'equipment' && subType) {
            return {
              ...prev,
              equipments: prev.equipments.map(eq => {
                if (eq.id === subType) {
                  return {
                    ...eq,
                    images: [...(eq.images || []), url].slice(0, 4)
                  };
                }
                return eq;
              })
            };
          }
          return prev;
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('이미지 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  const handleImageDelete = (type: string, index: number, subType?: string) => {
    setFormData(prev => {
      if (type === 'farmer') {
        const newImages = [...prev.farmerImages];
        newImages.splice(index, 1);
        return { ...prev, farmerImages: newImages };
      } else if (type === 'main') {
        const newImages = [...prev.mainImages];
        newImages.splice(index, 1);
        return { ...prev, mainImages: newImages };
      } else if (type === 'attachment' && subType) {
        const newImages = [...prev.attachmentImages[subType]];
        newImages.splice(index, 1);
        return {
          ...prev,
          attachmentImages: {
            ...prev.attachmentImages,
            [subType]: newImages
          }
        };
      } else if (type === 'equipment' && subType) {
        const newImages = [...prev.equipments.find(eq => eq.id === subType)?.images || []];
        newImages.splice(index, 1);
        return {
          ...prev,
          equipments: prev.equipments.map(eq => {
            if (eq.id === subType) {
              return {
                ...eq,
                images: newImages
              };
            }
            return eq;
          })
        };
      }
      return prev;
    });
  };

  const addNewEquipment = () => {
    const newEquipment = {
      id: Date.now().toString(),
      type: '',
      manufacturer: '',
      model: '',
      year: '',
      usageHours: '',
      rating: '',
      forSale: false,
      desiredPrice: '',
      saleStatus: '',
      saleDate: '',
      forPurchase: false,
      purchasePrice: '',
      purchaseStatus: '',
      purchaseDate: '',
      images: [],
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
        rows: '',
        rowsModel: '',
        rowsRating: '',
        tonnage: '',
        tonnageModel: '',
        tonnageRating: ''
      },
      memo: ''
    }
    setFormData(prev => ({
      ...prev,
      equipments: [...prev.equipments, newEquipment]
    }))
  }

  const removeEquipment = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.filter(eq => eq.id !== equipmentId)
    }))
  }

  const updateEquipment = (equipmentId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.map(eq => {
        if (eq.id === equipmentId) {
          if (field.includes('.')) {
            const [parent, child] = field.split('.')
            return {
              ...eq,
              [parent]: {
                ...eq[parent],
                [child]: value
              }
            }
          }
          return {
            ...eq,
            [field]: value
          }
        }
        return eq
      })
    }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{mode === 'edit' ? '농민 정보 수정' : '새 농민 등록'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">이름</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">우편번호</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.zipCode}
              className="w-1/3 p-2 border rounded"
              readOnly
              required
            />
            <AddressSearch onAddressSelect={handleAddressSelect} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="canReceiveMail"
            checked={formData.canReceiveMail}
            onChange={(e) => setFormData({...formData, canReceiveMail: e.target.checked})}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="canReceiveMail" className="text-sm text-gray-700">
            우편수취 가능
          </label>
        </div>

        <div>
          <label className="block mb-2">도로명 주소</label>
          <input
            type="text"
            value={formData.roadAddress}
            className="w-full p-2 border rounded"
            readOnly
            required
          />
        </div>

        <div>
          <label className="block mb-2">도로명 상세주소</label>
          <input
            type="text"
            value={formData.roadAddressDetail}
            onChange={(e) => setFormData({...formData, roadAddressDetail: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="상세주소를 입력하세요"
          />
        </div>

        <div>
          <label className="block mb-2">지번 주소</label>
          <input
            type="text"
            value={formData.jibunAddress}
            className="w-full p-2 border rounded"
            readOnly
          />
        </div>

        <div>
          <label className="block mb-2">지번 상세주소</label>
          <input
            type="text"
            value={formData.jibunAddressDetail}
            onChange={(e) => setFormData({...formData, jibunAddressDetail: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="상세주소를 입력하세요"
          />
        </div>

        <div>
          <label className="block mb-2">전화번호</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="000-0000-0000"
            className="w-full p-2 border rounded"
            required
            maxLength={13}
          />
        </div>

        <div>
          <label className="block mb-2">연령대</label>
          <select
            value={formData.ageGroup}
            onChange={(e) => setFormData({...formData, ageGroup: e.target.value})}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">선택하세요</option>
            <option value="30대">30대</option>
            <option value="40대">40대</option>
            <option value="50대">50대</option>
            <option value="60대">60대</option>
            <option value="70대">70대</option>
          </select>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold mb-2">농민 사진</h3>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e, 'farmer')}
              className="hidden"
              id="farmerImages"
            />
            <label
              htmlFor="farmerImages"
              className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
            >
              사진 업로드 (최대 4장)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {formData.farmerImages.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`농민 사진 ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    onClick={() => handleImageDelete('farmer', index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold mb-2">메모</h3>
          <textarea
            value={formData.memo}
            onChange={(e) => setFormData({...formData, memo: e.target.value})}
            className="w-full p-2 border rounded h-32 resize-none"
            placeholder="농민에 대한 특이사항이나 참고사항을 입력하세요"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-bold mb-2">농업 형태</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="paddyFarming"
              checked={formData.farmingTypes.paddyFarming}
              onChange={(e) => setFormData({
                ...formData,
                farmingTypes: {
                  ...formData.farmingTypes,
                  paddyFarming: e.target.checked
                }
              })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="paddyFarming" className="text-sm text-gray-700">
              논농사
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fieldFarming"
              checked={formData.farmingTypes.fieldFarming}
              onChange={(e) => setFormData({
                ...formData,
                farmingTypes: {
                  ...formData.farmingTypes,
                  fieldFarming: e.target.checked
                }
              })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="fieldFarming" className="text-sm text-gray-700">
              밭농사
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="livestock"
              checked={formData.farmingTypes.livestock}
              onChange={(e) => setFormData({
                ...formData,
                farmingTypes: {
                  ...formData.farmingTypes,
                  livestock: e.target.checked
                }
              })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="livestock" className="text-sm text-gray-700">
              축산업
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="orchard"
              checked={formData.farmingTypes.orchard}
              onChange={(e) => setFormData({
                ...formData,
                farmingTypes: {
                  ...formData.farmingTypes,
                  orchard: e.target.checked
                }
              })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="orchard" className="text-sm text-gray-700">
              과수원
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="forageCrop"
              checked={formData.farmingTypes.forageCrop}
              onChange={(e) => setFormData({
                ...formData,
                farmingTypes: {
                  ...formData.farmingTypes,
                  forageCrop: e.target.checked
                }
              })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="forageCrop" className="text-sm text-gray-700">
              조사료
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold mb-2">주요 작물</h3>
          
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600">식량작물</p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rice"
                checked={formData.mainCrop.rice}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    rice: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="rice" className="text-sm text-gray-700">
                벼
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="barley"
                checked={formData.mainCrop.barley}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    barley: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="barley" className="text-sm text-gray-700">
                보리
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="soybean"
                checked={formData.mainCrop.soybean}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    soybean: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="soybean" className="text-sm text-gray-700">
                콩
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sorghum"
                checked={formData.mainCrop.sorghum}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    sorghum: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="sorghum" className="text-sm text-gray-700">
                수수
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sweetPotato"
                checked={formData.mainCrop.sweetPotato}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    sweetPotato: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="sweetPotato" className="text-sm text-gray-700">
                고구마
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600">과수</p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pear"
                checked={formData.mainCrop.pear}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    pear: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="pear" className="text-sm text-gray-700">
                배
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="persimmon"
                checked={formData.mainCrop.persimmon}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    persimmon: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="persimmon" className="text-sm text-gray-700">
                감
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="plum"
                checked={formData.mainCrop.plum}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    plum: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="plum" className="text-sm text-gray-700">
                자두
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600">축산</p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hanwoo"
                checked={formData.mainCrop.hanwoo}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    hanwoo: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hanwoo" className="text-sm text-gray-700">
                한우
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="goat"
                checked={formData.mainCrop.goat}
                onChange={(e) => setFormData({
                  ...formData,
                  mainCrop: {
                    ...formData.mainCrop,
                    goat: e.target.checked
                  }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="goat" className="text-sm text-gray-700">
                염소
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="other"
              checked={formData.mainCrop.other}
              onChange={(e) => setFormData({
                ...formData,
                mainCrop: {
                  ...formData.mainCrop,
                  other: e.target.checked
                }
              })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="other" className="text-sm text-gray-700">
              기타
            </label>
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">보유 농기계</h2>
            <button
              type="button"
              onClick={addNewEquipment}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              농기계 추가
            </button>
          </div>

          {formData.equipments.map((equipment, index) => (
            <div key={equipment.id} className="border p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">농기계 #{index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeEquipment(equipment.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">농기계 사진</h4>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, 'equipment', equipment.id)}
                    className="hidden"
                    id={`equipmentImages-${equipment.id}`}
                  />
                  <label
                    htmlFor={`equipmentImages-${equipment.id}`}
                    className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
                  >
                    사진 업로드 (최대 4장)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {equipment.images?.map((url, imgIndex) => (
                      <div key={imgIndex} className="relative">
                        <img
                          src={url}
                          alt={`농기계 ${index + 1} 사진 ${imgIndex + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <button
                          onClick={() => handleImageDelete('equipment', imgIndex, equipment.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">기종</label>
                  <select
                    value={equipment.type}
                    onChange={(e) => updateEquipment(equipment.id, 'type', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">선택하세요</option>
                    <option value="tractor">트랙터</option>
                    <option value="combine">콤바인</option>
                    <option value="rice_transplanter">이앙기</option>
                    <option value="forklift">지게차</option>
                    <option value="excavator">굴삭기</option>
                    <option value="skid_loader">스키로더</option>
                    <option value="dryer">건조기</option>
                    <option value="silo">싸일론</option>
                    <option value="claas">클라스</option>
                    <option value="drone">드론</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2">제조사</label>
                  <select
                    value={equipment.manufacturer}
                    onChange={(e) => updateEquipment(equipment.id, 'manufacturer', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">선택하세요</option>
                    <option value="daedong">대동</option>
                    <option value="kukje">국제</option>
                    <option value="ls">LS</option>
                    <option value="dongyang">동양</option>
                    <option value="asia">아세아</option>
                    <option value="yanmar">얀마</option>
                    <option value="iseki">이세키</option>
                    <option value="john_deere">존디어</option>
                    <option value="kubota">구보다</option>
                    <option value="fendt">펜트</option>
                    <option value="case">케이스</option>
                    <option value="new_holland">뉴홀랜드</option>
                    <option value="mf">MF</option>
                    <option value="kumsung">금성</option>
                    <option value="fiat">피아트</option>
                    <option value="hyundai">현대</option>
                    <option value="doosan">두산</option>
                    <option value="volvo">볼보</option>
                    <option value="samsung">삼성</option>
                    <option value="daewoo">대우</option>
                    <option value="hitachi">히타츠</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2">모델명</label>
                  <input
                    type="text"
                    value={equipment.model}
                    onChange={(e) => updateEquipment(equipment.id, 'model', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2">연식</label>
                  <select
                    value={equipment.year}
                    onChange={(e) => updateEquipment(equipment.id, 'year', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">선택하세요</option>
                    {Array.from({ length: 36 }, (_, i) => 2025 - i).map(year => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2">사용시간</label>
                  <input
                    type="text"
                    value={equipment.usageHours}
                    onChange={(e) => updateEquipment(equipment.id, 'usageHours', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2">상태등급</label>
                  <select
                    value={equipment.rating}
                    onChange={(e) => updateEquipment(equipment.id, 'rating', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">선택하세요</option>
                    <option value="5">★★★★★ (최상)</option>
                    <option value="4">★★★★☆ (상)</option>
                    <option value="3">★★★☆☆ (중상)</option>
                    <option value="2">★★☆☆☆ (중)</option>
                    <option value="1">★☆☆☆☆ (하)</option>
                  </select>
                </div>

                {/* Transaction Information */}
                <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-4 mt-4">
                  <div>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={equipment.forSale}
                        onChange={(e) => updateEquipment(equipment.id, 'forSale', e.target.checked)}
                        className="mr-2"
                      />
                      판매여부
                    </label>
                    {equipment.forSale && (
                      <>
                        <input
                          type="text"
                          value={equipment.desiredPrice}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            updateEquipment(equipment.id, 'desiredPrice', value);
                          }}
                          placeholder="희망가격 (만원)"
                          className="w-full p-2 border rounded mb-2"
                        />
                        <select
                          value={equipment.saleStatus}
                          onChange={(e) => updateEquipment(equipment.id, 'saleStatus', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">판매상태 선택</option>
                          <option value="available">판매가능</option>
                          <option value="reserved">예약중</option>
                          <option value="sold">판매완료</option>
                        </select>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={equipment.forPurchase}
                        onChange={(e) => updateEquipment(equipment.id, 'forPurchase', e.target.checked)}
                        className="mr-2"
                      />
                      구매여부
                    </label>
                    {equipment.forPurchase && (
                      <>
                        <input
                          type="text"
                          value={equipment.purchasePrice}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            updateEquipment(equipment.id, 'purchasePrice', value);
                          }}
                          placeholder="구매가격 (만원)"
                          className="w-full p-2 border rounded mb-2"
                        />
                        <select
                          value={equipment.purchaseStatus}
                          onChange={(e) => updateEquipment(equipment.id, 'purchaseStatus', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">구매상태 선택</option>
                          <option value="searching">구매중</option>
                          <option value="completed">구매완료</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>

                {/* Equipment Memo Section */}
                <div className="col-span-2 border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-2">메모</h4>
                  <textarea
                    value={equipment.memo || ''}
                    onChange={(e) => updateEquipment(equipment.id, 'memo', e.target.value)}
                    className="w-full p-2 border rounded h-24 resize-none"
                    placeholder="농기계에 대한 특이사항이나 참고사항을 입력하세요"
                  />
                </div>

                {/* Attachments Section */}
                <div className="col-span-2 border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-4">부착장비 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {equipment.type === 'tractor' && (
                      <>
                        {['loader', 'rotary', 'frontWheel', 'rearWheel'].map((key) => {
                          const labels = {
                            loader: '로더',
                            rotary: '로터리',
                            frontWheel: '전륜',
                            rearWheel: '후륜'
                          };
                          const options = {
                            loader: ['없음', '한일', '태성', '안성', '희망', '장수', '본사', '기타'],
                            rotary: ['없음', '웅진', '삼원', '삼농', '위켄', '영진', '중앙', '첼리', '마스키오', '폴더', '기타'],
                            frontWheel: ['없음', '흥아', 'BKT', '미셀린', '수입', '국산', '중국', '기타'],
                            rearWheel: ['없음', '흥아', 'BKT', '미셀린', '수입', '국산', '중국', '기타']
                          };
                          return (
                            <div key={key} className="mb-4">
                              <label className="block mb-2">{labels[key]}</label>
                              <select
                                value={equipment.attachments[key]}
                                onChange={(e) => updateEquipment(equipment.id, `attachments.${key}`, e.target.value)}
                                className="w-full p-2 border rounded mb-2"
                              >
                                <option value="">선택하세요</option>
                                {options[key].map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                              {key !== 'loader' && (
                                <div className="space-y-2 mb-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleImageUpload(e, 'attachment', `${key}-${equipment.id}`)}
                                    className="hidden"
                                    id={`${key}Images-${equipment.id}`}
                                  />
                                  <label
                                    htmlFor={`${key}Images-${equipment.id}`}
                                    className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
                                  >
                                    {labels[key]} 사진 업로드 (최대 4장)
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {formData.attachmentImages[key]?.map((url, imgIndex) => (
                                      <div key={imgIndex} className="relative">
                                        <img
                                          src={url}
                                          alt={`${labels[key]} 사진 ${imgIndex + 1}`}
                                          className="w-full h-24 object-cover rounded"
                                        />
                                        <button
                                          onClick={() => handleImageDelete('attachment', imgIndex, key)}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <input
                                type="text"
                                value={equipment.attachments[`${key}Model`]}
                                onChange={(e) => updateEquipment(equipment.id, `attachments.${key}Model`, e.target.value)}
                                className="w-full p-2 border rounded mb-2"
                                placeholder="모델명"
                              />
                              <select
                                value={equipment.attachments[`${key}Rating`]}
                                onChange={(e) => updateEquipment(equipment.id, `attachments.${key}Rating`, e.target.value)}
                                className="w-full p-2 border rounded"
                              >
                                <option value="">상태등급 선택</option>
                                <option value="5">★★★★★ (최상)</option>
                                <option value="4">★★★★☆ (상)</option>
                                <option value="3">★★★☆☆ (중상)</option>
                                <option value="2">★★☆☆☆ (중)</option>
                                <option value="1">★☆☆☆☆ (하)</option>
                              </select>
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {(equipment.type === 'combine' || equipment.type === 'rice_transplanter') && (
                      <div className="mb-4">
                        <label className="block mb-2">조</label>
                        <select
                          value={equipment.attachments.rows}
                          onChange={(e) => updateEquipment(equipment.id, 'attachments.rows', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">선택하세요</option>
                          <option value="4">4조</option>
                          <option value="5">5조</option>
                          <option value="6">6조</option>
                          <option value="7">7조</option>
                          <option value="8">8조</option>
                          <option value="9">9조</option>
                          <option value="10">10조</option>
                        </select>
                      </div>
                    )}
                    
                    {(equipment.type === 'forklift' || equipment.type === 'excavator') && (
                      <div className="mb-4">
                        <label className="block mb-2">톤수</label>
                        <select
                          value={equipment.attachments.tonnage}
                          onChange={(e) => updateEquipment(equipment.id, 'attachments.tonnage', e.target.value)}
                          className="w-full p-2 border rounded mb-2"
                        >
                          <option value="">선택하세요</option>
                          <option value="1.0">1.0톤</option>
                          <option value="1.5">1.5톤</option>
                          <option value="2.0">2.0톤</option>
                          <option value="2.5">2.5톤</option>
                          <option value="3.0">3.0톤</option>
                          <option value="3.5">3.5톤</option>
                          <option value="4.0">4.0톤</option>
                          <option value="4.5">4.5톤</option>
                          <option value="5.0">5.0톤</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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