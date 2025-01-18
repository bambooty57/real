'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AddressSearch from '@/components/AddressSearch'

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
      attachments: {
        loader: '',
        rotary: '',
        wheels: ''
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

        <div>
          <label className="block mb-2 font-bold">주요 작물</label>
          <div className="grid grid-cols-3 gap-2">
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
              <label htmlFor="rice" className="text-sm text-gray-700">벼</label>
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
              <label htmlFor="barley" className="text-sm text-gray-700">보리</label>
            </div>

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
              <label htmlFor="hanwoo" className="text-sm text-gray-700">한우</label>
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
              <label htmlFor="soybean" className="text-sm text-gray-700">콩</label>
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
              <label htmlFor="sweetPotato" className="text-sm text-gray-700">고구마</label>
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
              <label htmlFor="persimmon" className="text-sm text-gray-700">단감</label>
            </div>

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
              <label htmlFor="pear" className="text-sm text-gray-700">배</label>
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
              <label htmlFor="plum" className="text-sm text-gray-700">매실</label>
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
              <label htmlFor="sorghum" className="text-sm text-gray-700">수수</label>
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
              <label htmlFor="goat" className="text-sm text-gray-700">염소</label>
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
              <label htmlFor="other" className="text-sm text-gray-700">기타</label>
            </div>
          </div>
        </div>

        <div>
          <label className="block mb-2 font-bold">농업형태</label>
          <div className="grid grid-cols-2 gap-2">
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
                수도작
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
        </div>

        <div>
          <h3 className="font-bold mb-2">농기계 정보</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">종류</label>
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
              </select>
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
                <option value="얀마">얀마</option>
              </select>
            </div>

            {formData.equipment.type === '트랙터' && (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">로더</label>
                  <input
                    type="text"
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
                  />
                </div>

                <div>
                  <label className="block mb-2">로타리</label>
                  <input
                    type="text"
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
                  />
                </div>

                <div>
                  <label className="block mb-2">휠</label>
                  <input
                    type="text"
                    value={formData.equipment.attachments.wheels}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        attachments: {
                          ...formData.equipment.attachments,
                          wheels: e.target.value
                        }
                      }
                    })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}
          </div>
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