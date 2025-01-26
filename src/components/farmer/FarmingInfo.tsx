'use client';

import { FormData } from '@/types/farmer';

interface FarmingInfoProps {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
}

export default function FarmingInfo({ formData, setFormData }: FarmingInfoProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">영농 정보</h2>
      
      {/* 영농형태 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">영농형태</label>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.farmingTypes).map(([key, value]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setFormData((prev: FormData) => ({
                  ...prev,
                  farmingTypes: {
                    ...prev.farmingTypes,
                    [key]: e.target.checked
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {key === 'paddyFarming' ? '벼농사' :
                 key === 'fieldFarming' ? '밭농사' :
                 key === 'orchard' ? '과수원' :
                 key === 'livestock' ? '축산업' :
                 key === 'forageCrop' ? '사료작물' : key}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 주작물 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">주작물</label>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(formData.mainCrop).map(([key, value]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setFormData((prev: FormData) => ({
                  ...prev,
                  mainCrop: {
                    ...prev.mainCrop,
                    [key]: e.target.checked
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {key === 'rice' ? '벼' :
                 key === 'barley' ? '보리' :
                 key === 'hanwoo' ? '한우' :
                 key === 'soybean' ? '콩' :
                 key === 'sweetPotato' ? '고구마' :
                 key === 'persimmon' ? '감' :
                 key === 'pear' ? '배' :
                 key === 'plum' ? '매실' :
                 key === 'sorghum' ? '수수' :
                 key === 'goat' ? '염소' :
                 key === 'other' ? '기타' : key}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label htmlFor="memo" className="block text-sm font-medium text-gray-700">메모</label>
        <textarea
          id="memo"
          value={formData.memo}
          onChange={(e) => setFormData((prev: FormData) => ({ ...prev, memo: e.target.value }))}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
} 