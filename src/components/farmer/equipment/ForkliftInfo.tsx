'use client';

import { Equipment } from '@/types/farmer';
import { FORKLIFT_MAST_TYPES, FORKLIFT_TIRE_TYPES } from '@/constants/manufacturers';

interface ForkliftInfoProps {
  equipment: Equipment;
  onEquipmentChange: (equipment: Equipment) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function ForkliftInfo({ equipment, onEquipmentChange }: ForkliftInfoProps) {
  return (
    <div className="space-y-4 border-b pb-4">
      <h4 className="font-medium">지게차 정보</h4>
      
      {/* 최대 인상 높이 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">최대 인상 높이</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            value={equipment.maxLiftHeight || ''}
            onChange={(e) => {
              onEquipmentChange({
                ...equipment,
                maxLiftHeight: e.target.value
              });
            }}
            className="block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500"
            placeholder="0"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">m</span>
          </div>
        </div>
      </div>

      {/* 최대 적재 하중 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">최대 적재 하중</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            value={equipment.maxLoadWeight || ''}
            onChange={(e) => {
              onEquipmentChange({
                ...equipment,
                maxLoadWeight: e.target.value
              });
            }}
            className="block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500"
            placeholder="0"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">톤</span>
          </div>
        </div>
      </div>

      {/* 마스트 타입 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">마스트 타입 *</label>
        <select
          value={equipment.mastType || ''}
          onChange={(e) => {
            onEquipmentChange({
              ...equipment,
              mastType: e.target.value as '2stage' | '3stage' | '4stage'
            });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">선택하세요</option>
          {FORKLIFT_MAST_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 타이어 타입 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">타이어 타입 *</label>
        <select
          value={equipment.tireType || ''}
          onChange={(e) => {
            onEquipmentChange({
              ...equipment,
              tireType: e.target.value as 'solid' | 'pneumatic'
            });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">선택하세요</option>
          {FORKLIFT_TIRE_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 사이드 시프트 유무 */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={equipment.hasSideShift || false}
            onChange={(e) => {
              onEquipmentChange({
                ...equipment,
                hasSideShift: e.target.checked
              });
            }}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">사이드 시프트 있음</span>
        </label>
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
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 