'use client';

import { FormData, Equipment } from '@/types/farmer';
import { v4 as uuidv4 } from 'uuid';
import { createInitialEquipment } from '@/utils/equipment';
import {
  MANUFACTURERS,
  TRADE_TYPES,
  TRADE_METHODS,
  TRADE_STATUS
} from '@/constants/manufacturers';
import TractorInfo from './equipment/TractorInfo';
import TransplanterInfo from './equipment/TransplanterInfo';
import CombineInfo from './equipment/CombineInfo';
import ForkliftInfo from './equipment/ForkliftInfo';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface EquipmentInfoProps {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function EquipmentInfo({ formData, setFormData }: EquipmentInfoProps) {
  const handleEquipmentChange = (index: number, equipment: Equipment) => {
    setFormData((prev: FormData) => ({
      ...prev,
      equipments: (prev.equipments || []).map((eq, i) => i === index ? equipment : eq)
    }));
  };

  const handleImageUpload = async (index: number, equipment: Equipment) => {
    try {
      // 이미지 파일 체크 및 업로드
      if (equipment.images) {
        const uploadPromises = equipment.images.map(async (img) => {
          if (img instanceof File) {
            if (img.size > MAX_FILE_SIZE) {
              alert('이미지 크기는 10MB를 초과할 수 없습니다.');
              return undefined;
            }
            
            try {
              // Firebase Storage에 업로드
              const timestamp = Date.now();
              const cleanFileName = img.name.replace(/[^a-zA-Z0-9.]/g, '_');
              const storageRef = ref(storage, `farmers/${equipment.id}/equipment/${timestamp}-${cleanFileName}`);
              
              const snapshot = await uploadBytes(storageRef, img);
              const downloadURL = await getDownloadURL(snapshot.ref);
              
              return downloadURL;
            } catch (error) {
              console.error('Image upload error:', error);
              alert('이미지 업로드 중 오류가 발생했습니다.');
              return undefined;
            }
          }
          return img;
        });

        const uploadedImages = await Promise.all(uploadPromises);
        equipment.images = uploadedImages.filter((img): img is string => img !== undefined);
        handleEquipmentChange(index, equipment);
      }
    } catch (error) {
      console.error('Equipment change error:', error);
      alert('농기계 정보 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">농기계 정보</h2>
      
      {/* 농기계 목록 */}
      <div className="space-y-4">
        {(formData.equipments || []).map((equipment, index) => (
          <div key={equipment.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">농기계 {index + 1}</h3>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev: FormData) => ({
                    ...prev,
                    equipments: (prev.equipments || []).filter(eq => eq.id !== equipment.id)
                  }))
                }}
                className="text-red-500 hover:text-red-700"
              >
                삭제
              </button>
            </div>

            {/* 1. 기본 정보 */}
            <div className="space-y-4 border-b pb-4">
              <h4 className="font-medium">기본 정보</h4>
              
              {/* 농기계 종류 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">농기계 종류</label>
                <select
                  value={equipment.type}
                  onChange={(e) => {
                    handleEquipmentChange(index, {
                      ...equipment,
                      type: e.target.value
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {MANUFACTURERS.EQUIPMENT.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제조회사 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">제조회사</label>
                <select
                  value={equipment.manufacturer || ''}
                  onChange={(e) => handleEquipmentChange(index, {
                    ...equipment,
                    manufacturer: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {MANUFACTURERS.MAIN.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 모델명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">모델명</label>
                <input
                  type="text"
                  value={equipment.model || ''}
                  onChange={(e) => {
                    handleEquipmentChange(index, {
                      ...equipment,
                      model: e.target.value
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="모델명을 입력하세요"
                />
              </div>

              {/* 연식 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">연식</label>
                <select
                  value={equipment.year}
                  onChange={(e) => {
                    handleEquipmentChange(index, {
                      ...equipment,
                      year: e.target.value
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
              </div>

              {/* 사용시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">사용시간</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    value={equipment.usageHours}
                    onChange={(e) => {
                      handleEquipmentChange(index, {
                        ...equipment,
                        usageHours: e.target.value
                      });
                    }}
                    className="block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">시간</span>
                  </div>
                </div>
              </div>

              {/* 상태평가 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">상태평가</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        handleEquipmentChange(index, {
                          ...equipment,
                          condition: star
                        });
                      }}
                      className={`p-1 ${
                        (equipment.condition || 0) >= star
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이미지 (최대 4장, 각 10MB 이하)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, imageIndex) => (
                    <div key={imageIndex} className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          try {
                            const file = e.target.files?.[0];
                            if (file) {
                              const updatedEquipment = {
                                ...equipment,
                                images: [
                                  ...(equipment.images || []).slice(0, imageIndex),
                                  file,
                                  ...(equipment.images || []).slice(imageIndex + 1)
                                ]
                              };
                              await handleImageUpload(index, updatedEquipment);
                            }
                          } catch (error) {
                            console.error('Image upload error:', error);
                            alert('이미지 업로드 중 오류가 발생했습니다.');
                          }
                        }}
                        className="hidden"
                        id={`equipment-image-${equipment.id}-${imageIndex}`}
                      />
                      <label
                        htmlFor={`equipment-image-${equipment.id}-${imageIndex}`}
                        className="block w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-blue-500 cursor-pointer"
                      >
                        {equipment.images?.[imageIndex] ? (
                          <img
                            src={
                              equipment.images[imageIndex] instanceof File
                                ? URL.createObjectURL(equipment.images[imageIndex] as File)
                                : equipment.images[imageIndex] as string
                            }
                            alt={`농기계 이미지 ${imageIndex + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <span>이미지 추가</span>
                          </div>
                        )}
                      </label>
                      {equipment.images?.[imageIndex] && (
                        <button
                          type="button"
                          onClick={() => {
                            handleEquipmentChange(index, {
                              ...equipment,
                              images: [
                                ...(equipment.images || []).slice(0, imageIndex),
                                ...(equipment.images || []).slice(imageIndex + 1)
                              ]
                            });
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. 거래 정보 */}
            <div className="space-y-4 border-b pb-4">
              <h4 className="font-medium">거래 정보</h4>
              
              {/* 거래 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">거래 유형</label>
                <select
                  value={equipment.saleType || ''}
                  onChange={(e) => {
                    handleEquipmentChange(index, {
                      ...equipment,
                      saleType: e.target.value as 'new' | 'used' | null
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {TRADE_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 거래 방식 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">거래 방식</label>
                <select
                  value={equipment.tradeType || ''}
                  onChange={(e) => {
                    handleEquipmentChange(index, {
                      ...equipment,
                      tradeType: e.target.value
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {TRADE_METHODS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 희망가격 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">희망가격</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    value={equipment.desiredPrice}
                    onChange={(e) => {
                      handleEquipmentChange(index, {
                        ...equipment,
                        desiredPrice: e.target.value
                      });
                    }}
                    className="block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">만원</span>
                  </div>
                </div>
              </div>

              {/* 거래 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">거래 상태</label>
                <select
                  value={equipment.saleStatus || ''}
                  onChange={(e) => {
                    handleEquipmentChange(index, {
                      ...equipment,
                      saleStatus: e.target.value as 'available' | 'reserved' | 'completed'
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  <option value="available">거래가능</option>
                  <option value="reserved">예약중</option>
                  <option value="completed">거래완료</option>
                </select>
              </div>
            </div>

            {/* 3. 농기계별 추가 정보 */}
            {equipment.type === 'tractor' && (
              <TractorInfo
                equipment={equipment}
                onEquipmentChange={(updatedEquipment) => handleEquipmentChange(index, updatedEquipment)}
              />
            )}

            {equipment.type === 'transplanter' && (
              <TransplanterInfo
                equipment={equipment}
                onEquipmentChange={(updatedEquipment) => handleEquipmentChange(index, updatedEquipment)}
              />
            )}

            {equipment.type === 'combine' && (
              <CombineInfo
                equipment={equipment}
                onEquipmentChange={(updatedEquipment) => handleEquipmentChange(index, updatedEquipment)}
              />
            )}

            {equipment.type === 'forklift' && (
              <ForkliftInfo
                equipment={equipment}
                onEquipmentChange={(updatedEquipment) => handleEquipmentChange(index, updatedEquipment)}
              />
            )}
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
              ...(prev.equipments || []),
              createInitialEquipment()
            ]
          }))
        }}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        농기계 추가
      </button>
    </div>
  );
} 