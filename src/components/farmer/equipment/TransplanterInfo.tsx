'use client';

import { Equipment } from '@/types/farmer';
import { TRANSPLANTER_ROWS, TRANSPLANTER_TYPES } from '@/constants/manufacturers';

interface TransplanterInfoProps {
  equipment: Equipment;
  onEquipmentChange: (equipment: Equipment) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function TransplanterInfo({ equipment, onEquipmentChange }: TransplanterInfoProps) {
  return (
    <div className="space-y-4 border-b pb-4">
      <h4 className="font-medium">이앙기 정보</h4>
      
      {/* 작업 조 수 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">작업 조 수</label>
        <select
          value={equipment.rows || ''}
          onChange={(e) => {
            onEquipmentChange({
              ...equipment,
              rows: e.target.value as '4' | '5' | '6' | '7' | '8' | '9' | '10'
            });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">선택하세요</option>
          {TRANSPLANTER_ROWS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 승용/보행 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">승용/보행</label>
        <select
          value={equipment.transplanterType || ''}
          onChange={(e) => {
            onEquipmentChange({
              ...equipment,
              transplanterType: e.target.value as 'riding' | 'walking'
            });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">선택하세요</option>
          {TRANSPLANTER_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 모판 탑재량 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">모판 탑재량</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            value={equipment.seedlingCapacity || ''}
            onChange={(e) => {
              onEquipmentChange({
                ...equipment,
                seedlingCapacity: e.target.value
              });
            }}
            className="block w-full rounded-md border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500"
            placeholder="0"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">매</span>
          </div>
        </div>
      </div>

      {/* 시비기 유무 */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={equipment.hasFertilizer || false}
            onChange={(e) => {
              onEquipmentChange({
                ...equipment,
                hasFertilizer: e.target.checked
              });
            }}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">시비기 있음</span>
        </label>
      </div>

      {/* 측조시비기 유무 */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={equipment.hasSideFertilizer || false}
            onChange={(e) => {
              onEquipmentChange({
                ...equipment,
                hasSideFertilizer: e.target.checked
              });
            }}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">측조시비기 있음</span>
        </label>
      </div>
    </div>
  );
} 