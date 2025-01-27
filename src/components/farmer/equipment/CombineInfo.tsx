'use client';

import { Equipment } from '@/types/farmer';
import {
  COMBINE_ROWS,
  COMBINE_CUTTING_TYPES,
  COMBINE_THRESHING_TYPES
} from '@/constants/manufacturers';

interface CombineInfoProps {
  equipment: Equipment;
  onEquipmentChange: (equipment: Equipment) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function CombineInfo({ equipment, onEquipmentChange }: CombineInfoProps) {
  return (
    <div className="space-y-4 border-b pb-4">
      <h4 className="font-medium">콤바인 정보</h4>
      
      {/* 작업 조 수 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">작업 조 수 *</label>
        <select
          value={equipment.rows || ''}
          onChange={(e) => {
            onEquipmentChange({
              ...equipment,
              rows: e.target.value as '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
            });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">선택하세요</option>
          {COMBINE_ROWS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 예취 방식 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">예취 방식 *</label>
        <select
          value={equipment.cuttingType || ''}
          onChange={(e) => {
            onEquipmentChange({
              ...equipment,
              cuttingType: e.target.value as 'binding' | 'spreading'
            });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">선택하세요</option>
          {COMBINE_CUTTING_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 탈곡 방식 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">탈곡 방식 *</label>
        <select
          value={equipment.threshingType || ''}
          onChange={(e) => {
            onEquipmentChange({
              ...equipment,
              threshingType: e.target.value as 'axial' | 'mixed'
            });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">선택하세요</option>
          {COMBINE_THRESHING_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 곡물 탱크 용량 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">곡물 탱크 용량</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            value={equipment.grainTankCapacity || ''}
            onChange={(e) => {
              onEquipmentChange({
                ...equipment,
                grainTankCapacity: e.target.value
              });
            }}
            className="block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500"
            placeholder="0"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">kg</span>
          </div>
        </div>
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
                    // 파일 크기 체크
                    if (file.size > MAX_FILE_SIZE) {
                      alert('이미지 크기는 10MB를 초과할 수 없습니다.');
                      return;
                    }
                    
                    onEquipmentChange({
                      ...equipment,
                      images: [
                        ...(equipment.images || []).slice(0, index),
                        file,
                        ...(equipment.images || []).slice(index + 1)
                      ]
                    });
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 