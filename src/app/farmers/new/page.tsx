'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AddressSearch from '@/components/AddressSearch'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export default function NewFarmer({ mode = 'new', farmerId = '', initialData = null }) {
  const router = useRouter()
  const [formData, setFormData] = useState(initialData || {
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
    mainImages: [],
    attachmentImages: {
      loader: [],
      rotary: [],
      frontWheel: [],
      rearWheel: []
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
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '').slice(0, 8);
    
    if (numbers.length === 0) return "010-";
    if (numbers.length <= 4) {
      return `010-${numbers}`;
    }
    return `010-${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 입력된 값에서 숫자만 추출
    const numbers = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
    
    // 숫자가 없으면 빈 값으로
    if (numbers.length === 0) {
      setFormData({...formData, phone: ''});
      return;
    }
    
    // 4자리 이상이면 하이픈 추가
    if (numbers.length > 4) {
      setFormData({...formData, phone: `010-${numbers.slice(0, 4)}-${numbers.slice(4)}`});
    } else {
      setFormData({...formData, phone: `010-${numbers}`});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dataToSave = {
        ...formData,
        farmerImages: formData.farmerImages || [],
        mainImages: formData.mainImages || [],
        attachmentImages: {
          loader: formData.attachmentImages?.loader || [],
          rotary: formData.attachmentImages?.rotary || [],
          frontWheel: formData.attachmentImages?.frontWheel || [],
          rearWheel: formData.attachmentImages?.rearWheel || []
        },
        equipments: formData.equipments.map(eq => ({
          ...eq,
          images: eq.images || []
        }))
      }

      if (mode === 'edit') {
        const docRef = doc(db, 'farmers', farmerId)
        await updateDoc(docRef, dataToSave)
        router.push(`/farmers/${farmerId}`)
      } else {
        await addDoc(collection(db, 'farmers'), dataToSave)
        router.push('/')
      }
    } catch (error) {
      console.error('Error saving farmer:', error)
      alert('저장 중 오류가 발생했습니다.')
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
        // FormData 생성
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (subType) {
          formData.append('subType', subType);
        }

        // 서버에 파일 업로드
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Upload failed');
        }

        const { url } = await response.json();

        // UI 상태 업데이트
        setFormData(prev => {
          let updatedData;
          if (type === 'farmer') {
            const currentImages = prev.farmerImages || [];
            const newImages = [...currentImages, url].slice(0, 4);
            updatedData = { ...prev, farmerImages: newImages };
          } else if (type === 'main') {
            updatedData = {
              ...prev,
              mainImages: [...prev.mainImages, url].slice(0, 4)
            };
          } else if (type === 'attachment' && subType) {
            const key = subType.split('-')[0];
            updatedData = {
              ...prev,
              attachmentImages: {
                ...prev.attachmentImages,
                [key]: [...(prev.attachmentImages[key] || []), url].slice(0, 4)
              }
            };
          } else if (type === 'equipment' && subType) {
            updatedData = {
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
          return updatedData || prev;
        });

      } catch (error) {
        console.error('Error uploading image:', error);
        alert(error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  const handleImageDelete = async (type: string, index: number, subType?: string) => {
    try {
      let imageUrl = '';
      let updatedData;
      
      // 삭제할 이미지 URL 가져오기
      if (type === 'farmer') {
        imageUrl = formData.farmerImages[index];
      } else if (type === 'main') {
        imageUrl = formData.mainImages[index];
      } else if (type === 'attachment' && subType) {
        const key = subType.split('-')[0];
        imageUrl = formData.attachmentImages[key][index];
      } else if (type === 'equipment' && subType) {
        const equipment = formData.equipments.find(eq => eq.id === subType);
        if (equipment && equipment.images) {
          imageUrl = equipment.images[index];
        }
      }

      if (imageUrl) {
        // Firebase Storage에서 이미지 삭제
        try {
          const urlParts = imageUrl.split('?')[0].split('/o/')[1];
          if (!urlParts) throw new Error('Invalid image URL format');
          
          const decodedPath = decodeURIComponent(urlParts);
          const storageRef = ref(storage, decodedPath);
          await deleteObject(storageRef);

          // UI 상태 업데이트
          setFormData(prev => {
            if (type === 'farmer') {
              const newImages = [...(prev.farmerImages || [])];
              newImages.splice(index, 1);
              updatedData = { ...prev, farmerImages: newImages };
            } else if (type === 'main') {
              const newImages = [...prev.mainImages];
              newImages.splice(index, 1);
              updatedData = { ...prev, mainImages: newImages };
            } else if (type === 'attachment' && subType) {
              const key = subType.split('-')[0];
              const newImages = [...(prev.attachmentImages[key] || [])];
              newImages.splice(index, 1);
              updatedData = {
                ...prev,
                attachmentImages: {
                  ...prev.attachmentImages,
                  [key]: newImages
                }
              };
            } else if (type === 'equipment' && subType) {
              const newEquipments = prev.equipments.map(eq => {
                if (eq.id === subType) {
                  const newImages = [...(eq.images || [])];
                  newImages.splice(index, 1);
                  return {
                    ...eq,
                    images: newImages
                  };
                }
                return eq;
              });
              updatedData = { ...prev, equipments: newEquipments };
            }
            return updatedData;
          });

          // 수정 모드일 때만 Firestore 업데이트
          if (mode === 'edit' && updatedData) {
            const docRef = doc(db, 'farmers', farmerId);
            if (type === 'farmer') {
              await updateDoc(docRef, {
                farmerImages: updatedData.farmerImages
              });
            } else if (type === 'main') {
              await updateDoc(docRef, {
                mainImages: updatedData.mainImages
              });
            } else if (type === 'attachment' && subType) {
              await updateDoc(docRef, {
                [`attachmentImages.${subType.split('-')[0]}`]: updatedData.attachmentImages[subType.split('-')[0]]
              });
            } else if (type === 'equipment' && subType) {
              await updateDoc(docRef, {
                equipments: updatedData.equipments
              });
            }
          }
        } catch (error) {
          console.error('Error deleting image from storage:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            이름 *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
            상호명
          </label>
          <input
            type="text"
            id="businessName"
            value={formData.businessName || ''}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            />
            <AddressSearch onAddressSelect={handleAddressSelect} />
          </div>
        </div>

        <div>
          <label className="block mb-2">도로명 주소</label>
          <input
            type="text"
            value={formData.roadAddress}
            className="w-full p-2 border rounded"
            readOnly
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
          <label className="block mb-2">상세주소</label>
          <input
            type="text"
            value={formData.addressDetail}
            onChange={(e) => setFormData({...formData, addressDetail: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="상세주소를 입력하세요"
          />
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
          <label className="block mb-2">전화번호</label>
          <div className="flex items-center">
            <span className="bg-gray-100 px-3 py-2 rounded-l border border-r-0">010-</span>
            <input
              type="text"
              value={formData.phone ? formData.phone.replace(/^010-/, '') : ''}
              onChange={handlePhoneChange}
              placeholder="0000-0000"
              className="w-full p-2 border rounded-r"
              maxLength={9}
            />
          </div>
        </div>

        <div>
          <label className="block mb-2">연령대</label>
          <select
            value={formData.ageGroup}
            onChange={(e) => setFormData({...formData, ageGroup: e.target.value})}
            className="w-full p-2 border rounded"
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
              {(formData.farmerImages || []).map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`농민 사진 ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleImageDelete('farmer', index);
                    }}
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
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleImageDelete('equipment', imgIndex, equipment.id);
                          }}
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
                  />
                </div>

                <div>
                  <label className="block mb-2">연식</label>
                  <select
                    value={equipment.year}
                    onChange={(e) => updateEquipment(equipment.id, 'year', e.target.value)}
                    className="w-full p-2 border rounded"
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
                  >
                  </input>
                </div>

                <div>
                  <label className="block mb-2">상태등급</label>
                  <select
                    value={equipment.rating}
                    onChange={(e) => updateEquipment(equipment.id, 'rating', e.target.value)}
                    className="w-full p-2 border rounded"
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
                                    {(formData.attachmentImages[key] || []).map((url, imgIndex) => (
                                      <div key={imgIndex} className="relative">
                                        <img
                                          src={url}
                                          alt={`${labels[key]} 사진 ${imgIndex + 1}`}
                                          className="w-full h-24 object-cover rounded"
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleImageDelete('attachment', imgIndex, `${key}-${equipment.id}`);
                                          }}
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