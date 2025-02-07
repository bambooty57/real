'use client';

import { Equipment } from '@/types/farmer';
import {
  COMBINE_ROWS,
  COMBINE_CUTTING_TYPES
} from '@/constants/manufacturers';

interface CombineInfoProps {
  equipment: Equipment;
  onEquipmentChange: (equipment: Equipment) => void;
}

export default function CombineInfo({ equipment, onEquipmentChange }: CombineInfoProps) {
  return (
    <div className="space-y-4 border-b pb-4">
      <h4 className="font-medium">콤바인 정보</h4>
      
      {/* 작업 조 수 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">작업 조 수</label>
        <select
          value={equipment.rows || ''}
          onChange={(e) => {
            onEquipmentChange({
              ...equipment,
              rows: e.target.value as '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
            });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-gray-700">예취 방식</label>
        <select
          value={equipment.cuttingType || ''}
          onChange={(e) => {
            onEquipmentChange({
              ...equipment,
              cuttingType: e.target.value as 'binding' | 'spreading'
            });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">선택하세요</option>
          {COMBINE_CUTTING_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 