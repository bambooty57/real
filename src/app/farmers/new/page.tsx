'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AddressSearch from '@/components/AddressSearch'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export default function NewFarmer() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    zipCode: '',
    roadAddress: '',
    roadAddressDetail: '',
    jibunAddress: '',
    jibunAddressDetail: '',
    canReceiveMail: false,
    phone: '',
    ageGroup: '',
    memo: '',
    farmerImages: [] as string[],
    mainImages: [] as string[],
    attachmentImages: {
      loader: [] as string[],
      rotary: [] as string[],
      frontWheel: [] as string[],
      rearWheel: [] as string[],
      cutter: [] as string[],
      rows: [] as string[],
      tonnage: [] as string[],
      size: [] as string[],
      bucketSize: [] as string[]
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
    equipment: {
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
      await addDoc(collection(db, 'farmers'), formData)
      router.push('/')
    } catch (error) {
      console.error('Error adding farmer:', error)
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
      }
      return prev;
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">새 농민 등록</h1>
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
        
        <div className="space-y-4">
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

        <div>
          <h3 className="font-bold mb-2">농기계 정보</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">본기 종류</label>
              <select
                value={formData.equipment.type}
                onChange={(e) => setFormData({
                  ...formData,
                  equipment: {...formData.equipment, type: e.target.value}
                })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">선택하세요</option>
                <option value="트랙터">트랙터</option>
                <option value="콤바인">콤바인</option>
                <option value="이앙기">이앙기</option>
                <option value="지게차">지게차</option>
                <option value="굴삭기">굴삭기</option>
                <option value="스키로더">스키로더</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">연식</label>
              <select
                value={formData.equipment.year}
                onChange={(e) => setFormData({
                  ...formData,
                  equipment: {...formData.equipment, year: e.target.value}
                })}
                className="w-full p-2 border rounded"
                required
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
                value={formData.equipment.usageHours}
                onChange={(e) => setFormData({
                  ...formData,
                  equipment: {...formData.equipment, usageHours: e.target.value}
                })}
                className="w-full p-2 border rounded"
                placeholder="시간 단위로 입력"
                required
              />
            </div>

            <div className="flex items-center gap-2 my-4">
              <input
                type="checkbox"
                id="forSale"
                checked={formData.equipment.forSale}
                onChange={(e) => setFormData({
                  ...formData,
                  equipment: {...formData.equipment, forSale: e.target.checked}
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="forSale" className="text-sm text-gray-700">
                판매 희망
              </label>
            </div>

            {formData.equipment.forSale && (
              <>
                <div>
                  <label className="block mb-2">판매 희망가격</label>
                  <input
                    type="text"
                    value={formData.equipment.desiredPrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const formattedValue = value ? Number(value).toLocaleString() : '';
                      setFormData({
                        ...formData,
                        equipment: {...formData.equipment, desiredPrice: formattedValue}
                      });
                    }}
                    className="w-full p-2 border rounded"
                    placeholder="판매 희망가격을 입력하세요"
                  />
                  <p className="text-sm text-gray-500 mt-1">단위: 원</p>
                </div>

                <div>
                  <label className="block mb-2">판매 상태</label>
                  <select
                    value={formData.equipment.saleStatus}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {...formData.equipment, saleStatus: e.target.value}
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    <option value="상담중">상담중</option>
                    <option value="계약진행">계약진행</option>
                    <option value="계약완료">계약완료</option>
                  </select>
                </div>

                {formData.equipment.saleStatus === '계약완료' && (
                  <div>
                    <label className="block mb-2">거래 완료일</label>
                    <input
                      type="date"
                      value={formData.equipment.saleDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        equipment: {...formData.equipment, saleDate: e.target.value}
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 my-4">
              <input
                type="checkbox"
                id="forPurchase"
                checked={formData.equipment.forPurchase}
                onChange={(e) => setFormData({
                  ...formData,
                  equipment: {...formData.equipment, forPurchase: e.target.checked}
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="forPurchase" className="text-sm text-gray-700">
                구입 희망
              </label>
            </div>

            {formData.equipment.forPurchase && (
              <>
                <div>
                  <label className="block mb-2">구입 희망가격</label>
                  <input
                    type="text"
                    value={formData.equipment.purchasePrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const formattedValue = value ? Number(value).toLocaleString() : '';
                      setFormData({
                        ...formData,
                        equipment: {...formData.equipment, purchasePrice: formattedValue}
                      });
                    }}
                    className="w-full p-2 border rounded"
                    placeholder="구입 희망가격을 입력하세요"
                  />
                  <p className="text-sm text-gray-500 mt-1">단위: 원</p>
                </div>

                <div>
                  <label className="block mb-2">구입 상태</label>
                  <select
                    value={formData.equipment.purchaseStatus}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {...formData.equipment, purchaseStatus: e.target.value}
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    <option value="상담중">상담중</option>
                    <option value="계약진행">계약진행</option>
                    <option value="계약완료">계약완료</option>
                  </select>
                </div>

                {formData.equipment.purchaseStatus === '계약완료' && (
                  <div>
                    <label className="block mb-2">거래 완료일</label>
                    <input
                      type="date"
                      value={formData.equipment.purchaseDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        equipment: {...formData.equipment, purchaseDate: e.target.value}
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block mb-2">상태 평가</label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value={star}
                      checked={formData.equipment.rating === star.toString()}
                      onChange={(e) => setFormData({
                        ...formData,
                        equipment: {...formData.equipment, rating: e.target.value}
                      })}
                      className="mr-1"
                    />
                    {star}점
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2">제조사</label>
              <select
                value={formData.equipment.manufacturer}
                onChange={(e) => setFormData({
                  ...formData,
                  equipment: {...formData.equipment, manufacturer: e.target.value}
                })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">선택하세요</option>
                <option value="대동">대동</option>
                <option value="국제">국제</option>
                <option value="엘에스">엘에스</option>
                <option value="얀마">얀마</option>
                <option value="구보다">구보다</option>
                <option value="존디어">존디어</option>
                <option value="뉴홀랜드">뉴홀랜드</option>
                <option value="엠에프">엠에프</option>
                <option value="케이스">케이스</option>
                <option value="현대">현대</option>
                <option value="삼성">삼성</option>
                <option value="볼보">볼보</option>
                <option value="히타치">히타치</option>
                <option value="두산">두산</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">모델</label>
              <input
                type="text"
                value={formData.equipment.model}
                onChange={(e) => setFormData({
                  ...formData,
                  equipment: {...formData.equipment, model: e.target.value}
                })}
                className="w-full p-2 border rounded"
                placeholder="모델명을 입력하세요"
                required
              />
            </div>

            {formData.equipment.type === '트랙터' && (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">로더</label>
                  <select
                    value={formData.equipment.attachments.loader}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          loader: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    <option value="본사">본사</option>
                    <option value="안성">안성</option>
                    <option value="태성">태성</option>
                    <option value="희망">희망</option>
                    <option value="장수">장수</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2">로더 모델</label>
                  <input
                    type="text"
                    value={formData.equipment.attachments.loaderModel}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          loaderModel: e.target.value
                        }
                      }
                    })}
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
                          name="loaderRating"
                          value={star}
                          checked={formData.equipment.attachments.loaderRating === star.toString()}
                          onChange={(e) => setFormData({
                            ...formData,
                            equipment: {
                              ...formData.equipment,
                              attachments: {
                                ...formData.equipment.attachments,
                                loaderRating: e.target.value
                              }
                            }
                          })}
                          className="mr-1"
                        />
                        {star}점
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-2">로타리</label>
                  <select
                    value={formData.equipment.attachments.rotary}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          rotary: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    <option value="삼원">삼원</option>
                    <option value="웅진">웅진</option>
                    <option value="삼농">삼농</option>
                    <option value="위켄">위켄</option>
                    <option value="첼리">첼리</option>
                    <option value="영진">영진</option>
                    <option value="중앙">중앙</option>
                    <option value="아그로스">아그로스</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2">로타리 모델</label>
                  <input
                    type="text"
                    value={formData.equipment.attachments.rotaryModel}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          rotaryModel: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2 border rounded"
                    placeholder="모델명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block mb-2">로타리 상태 평가</label>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <label key={star} className="flex items-center">
                        <input
                          type="radio"
                          name="rotaryRating"
                          value={star}
                          checked={formData.equipment.attachments.rotaryRating === star.toString()}
                          onChange={(e) => setFormData({
                            ...formData,
                            equipment: {
                              ...formData.equipment,
                              attachments: {
                                ...formData.equipment.attachments,
                                rotaryRating: e.target.value
                              }
                            }
                          })}
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
                    value={formData.equipment.attachments.frontWheel}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          frontWheel: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    <option value="흥아">흥아</option>
                    <option value="BKT">BKT</option>
                    <option value="미쉐린">미쉐린</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2">전륜 모델</label>
                  <input
                    type="text"
                    value={formData.equipment.attachments.frontWheelModel}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          frontWheelModel: e.target.value
                        }
                      }
                    })}
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
                          name="frontWheelRating"
                          value={star}
                          checked={formData.equipment.attachments.frontWheelRating === star.toString()}
                          onChange={(e) => setFormData({
                            ...formData,
                            equipment: {
                              ...formData.equipment,
                              attachments: {
                                ...formData.equipment.attachments,
                                frontWheelRating: e.target.value
                              }
                            }
                          })}
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
                    value={formData.equipment.attachments.rearWheel}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          rearWheel: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    <option value="흥아">흥아</option>
                    <option value="BKT">BKT</option>
                    <option value="미쉐린">미쉐린</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2">후륜 모델</label>
                  <input
                    type="text"
                    value={formData.equipment.attachments.rearWheelModel}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          rearWheelModel: e.target.value
                        }
                      }
                    })}
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
                          name="rearWheelRating"
                          value={star}
                          checked={formData.equipment.attachments.rearWheelRating === star.toString()}
                          onChange={(e) => setFormData({
                            ...formData,
                            equipment: {
                              ...formData.equipment,
                              attachments: {
                                ...formData.equipment.attachments,
                                rearWheelRating: e.target.value
                              }
                            }
                          })}
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
                <div>
                  <label className="block mb-2">예취부</label>
                  <select
                    value={formData.equipment.attachments?.cutter || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          cutter: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    <option value="4조">4조</option>
                    <option value="5조">5조</option>
                    <option value="6조">6조</option>
                    <option value="7조">7조</option>
                    <option value="8조">8조</option>
                  </select>
                </div>
              </div>
            )}

            {formData.equipment.type === '이앙기' && (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">작업열</label>
                  <select
                    value={formData.equipment.attachments?.rows || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          rows: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    <option value="4열">4열</option>
                    <option value="5열">5열</option>
                    <option value="6열">6열</option>
                    <option value="7열">7열</option>
                    <option value="8열">8열</option>
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
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          tonnage: e.target.value
                        }
                      }
                    })}
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
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          size: e.target.value
                        }
                      }
                    })}
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
                <div>
                  <label className="block mb-2">버켓용량</label>
                  <select
                    value={formData.equipment.attachments?.bucketSize || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          bucketSize: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    <option value="0.3㎥">0.3㎥</option>
                    <option value="0.4㎥">0.4㎥</option>
                    <option value="0.5㎥">0.5㎥</option>
                    <option value="0.6㎥">0.6㎥</option>
                  </select>
                </div>
              </div>
            )}
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
          <h3 className="font-bold mb-2">본기 사진</h3>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e, 'main')}
              className="hidden"
              id="mainImages"
            />
            <label
              htmlFor="mainImages"
              className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
            >
              사진 업로드 (최대 4장)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {formData.mainImages.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`본기 사진 ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    onClick={() => handleImageDelete('main', index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {formData.equipment.type === '트랙터' && (
          <>
            {/* 로더 사진 */}
            <div className="space-y-4">
              <h3 className="font-bold mb-2">로더 사진</h3>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'attachment', 'loader')}
                  className="hidden"
                  id="loaderImages"
                />
                <label
                  htmlFor="loaderImages"
                  className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
                >
                  사진 업로드 (최대 4장)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {formData.attachmentImages.loader.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`로더 사진 ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        onClick={() => handleImageDelete('attachment', index, 'loader')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 로타리 사진 */}
            <div className="space-y-4">
              <h3 className="font-bold mb-2">로타리 사진</h3>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'attachment', 'rotary')}
                  className="hidden"
                  id="rotaryImages"
                />
                <label
                  htmlFor="rotaryImages"
                  className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
                >
                  사진 업로드 (최대 4장)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {formData.attachmentImages.rotary.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`로타리 사진 ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        onClick={() => handleImageDelete('attachment', index, 'rotary')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 전륜 사진 */}
            <div className="space-y-4">
              <h3 className="font-bold mb-2">전륜 사진</h3>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'attachment', 'frontWheel')}
                  className="hidden"
                  id="frontWheelImages"
                />
                <label
                  htmlFor="frontWheelImages"
                  className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
                >
                  사진 업로드 (최대 4장)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {formData.attachmentImages.frontWheel.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`전륜 사진 ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        onClick={() => handleImageDelete('attachment', index, 'frontWheel')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 후륜 사진 */}
            <div className="space-y-4">
              <h3 className="font-bold mb-2">후륜 사진</h3>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'attachment', 'rearWheel')}
                  className="hidden"
                  id="rearWheelImages"
                />
                <label
                  htmlFor="rearWheelImages"
                  className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
                >
                  사진 업로드 (최대 4장)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {formData.attachmentImages.rearWheel.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`후륜 사진 ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        onClick={() => handleImageDelete('attachment', index, 'rearWheel')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {formData.equipment.type === '콤바인' && (
          <div className="space-y-4">
            <h3 className="font-bold mb-2">예취부 사진</h3>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, 'attachment', 'cutter')}
                className="hidden"
                id="cutterImages"
              />
              <label
                htmlFor="cutterImages"
                className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
              >
                사진 업로드 (최대 4장)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.attachmentImages.cutter.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`예취부 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => handleImageDelete('attachment', index, 'cutter')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {formData.equipment.type === '이앙기' && (
          <div className="space-y-4">
            <h3 className="font-bold mb-2">작업열 사진</h3>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, 'attachment', 'rows')}
                className="hidden"
                id="rowsImages"
              />
              <label
                htmlFor="rowsImages"
                className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
              >
                사진 업로드 (최대 4장)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.attachmentImages.rows.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`작업열 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => handleImageDelete('attachment', index, 'rows')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {formData.equipment.type === '지게차' && (
          <div className="space-y-4">
            <h3 className="font-bold mb-2">톤수 사진</h3>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, 'attachment', 'tonnage')}
                className="hidden"
                id="tonnageImages"
              />
              <label
                htmlFor="tonnageImages"
                className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
              >
                사진 업로드 (최대 4장)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.attachmentImages.tonnage.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`톤수 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => handleImageDelete('attachment', index, 'tonnage')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {formData.equipment.type === '굴삭기' && (
          <div className="space-y-4">
            <h3 className="font-bold mb-2">규격 사진</h3>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, 'attachment', 'size')}
                className="hidden"
                id="sizeImages"
              />
              <label
                htmlFor="sizeImages"
                className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
              >
                사진 업로드 (최대 4장)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.attachmentImages.size.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`규격 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => handleImageDelete('attachment', index, 'size')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {formData.equipment.type === '스키로더' && (
          <div className="space-y-4">
            <h3 className="font-bold mb-2">버켓용량 사진</h3>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, 'attachment', 'bucketSize')}
                className="hidden"
                id="bucketSizeImages"
              />
              <label
                htmlFor="bucketSizeImages"
                className="block w-full p-2 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
              >
                사진 업로드 (최대 4장)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.attachmentImages.bucketSize.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`버켓용량 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => handleImageDelete('attachment', index, 'bucketSize')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-bold mb-2">메모</h3>
          <textarea
            value={formData.memo}
            onChange={(e) => setFormData({...formData, memo: e.target.value})}
            className="w-full p-2 border rounded h-32 resize-none"
            placeholder="농민에 대한 특이사항이나 참고사항을 입력하세요"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          등록하기
        </button>
      </form>
    </div>
  )
} 