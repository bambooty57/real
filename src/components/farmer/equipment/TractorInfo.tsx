'use client';

import { Equipment, Attachment } from '@/types/farmer';
import { ATTACHMENT_TYPES, MANUFACTURERS } from '@/constants/manufacturers';
import { createInitialAttachment } from '@/utils/equipment';

interface TractorInfoProps {
  equipment: Equipment;
  onEquipmentChange: (equipment: Equipment) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function TractorInfo({ equipment, onEquipmentChange }: TractorInfoProps) {
  const handleAttachmentChange = (value: string, changes: Partial<Attachment>) => {
    onEquipmentChange({
      ...equipment,
      attachments: (equipment.attachments || []).map(a =>
        a.type === value
          ? { ...a, ...changes }
          : a
      )
    });
  };

  const handleImageUpload = async (value: string, file: File, index: number) => {
    try {
      if (file.size > MAX_FILE_SIZE) {
        alert('이미지 크기는 10MB를 초과할 수 없습니다.');
        return;
      }

      const attachment = equipment.attachments?.find(a => a.type === value);
      if (attachment) {
        onEquipmentChange({
          ...equipment,
          attachments: (equipment.attachments || []).map(a =>
            a.type === value
              ? {
                  ...a,
                  images: [
                    ...(a.images || []).slice(0, index),
                    file,
                    ...(a.images || []).slice(index + 1)
                  ]
                }
              : a
          )
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">부착작업기 정보</h4>
      
      {ATTACHMENT_TYPES.map(({ value, label }) => {
        const attachment = equipment.attachments?.find(a => a.type === value) || null;
        
        return (
          <div key={value} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="font-medium">{label}</h5>
              {attachment ? (
                <button
                  type="button"
                  onClick={() => {
                    onEquipmentChange({
                      ...equipment,
                      attachments: (equipment.attachments || []).filter(a => a.type !== value)
                    });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onEquipmentChange({
                      ...equipment,
                      attachments: [
                        ...(equipment.attachments || []),
                        createInitialAttachment(value as 'loader' | 'rotary' | 'frontWheel' | 'rearWheel')
                      ]
                    });
                  }}
                  className="text-blue-500 hover:text-blue-700"
                >
                  추가
                </button>
              )}
            </div>

            {attachment && (
              <div className="space-y-4">
                {/* 제조사 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">제조사 *</label>
                  <select
                    value={attachment.manufacturer}
                    onChange={(e) => handleAttachmentChange(value, { manufacturer: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">선택하세요</option>
                    {(value === 'loader' ? MANUFACTURERS.LOADER :
                      value === 'rotary' ? MANUFACTURERS.ROTARY :
                      value === 'frontWheel' || value === 'rearWheel' ? MANUFACTURERS.WHEEL :
                      []).map(({ value: mValue, label }) => (
                      <option key={mValue} value={mValue}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 모델명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">모델명 *</label>
                  <input
                    type="text"
                    value={attachment.model || ''}
                    onChange={(e) => handleAttachmentChange(value, { model: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    placeholder="모델명을 입력하세요"
                  />
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
                          handleAttachmentChange(value, { condition: star });
                        }}
                        className={`p-1 ${
                          (attachment.condition || 0) >= star
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">메모</label>
                  <textarea
                    value={attachment.memo || ''}
                    onChange={(e) => handleAttachmentChange(value, { memo: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="메모를 입력하세요"
                  />
                </div>

                {/* 이미지 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이미지 (최대 4장, 각 10MB 이하)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(value, file, index);
                            }
                          }}
                          className="hidden"
                          id={`attachment-image-${equipment.id}-${value}-${index}`}
                        />
                        <label
                          htmlFor={`attachment-image-${equipment.id}-${value}-${index}`}
                          className="block w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-blue-500 cursor-pointer"
                        >
                          {attachment.images?.[index] ? (
                            <img
                              src={
                                attachment.images[index] instanceof File
                                  ? URL.createObjectURL(attachment.images[index] as File)
                                  : attachment.images[index] as string
                              }
                              alt={`${label} 이미지 ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <span>이미지 추가</span>
                            </div>
                          )}
                        </label>
                        {attachment.images?.[index] && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAttachmentChange(value, {
                                images: [
                                  ...(attachment.images || []).slice(0, index),
                                  ...(attachment.images || []).slice(index + 1).filter(Boolean)
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
            )}
          </div>
        );
      })}
    </div>
  );
}
