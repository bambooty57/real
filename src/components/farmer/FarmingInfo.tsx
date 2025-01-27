'use client';

import { FormData, MainCropType } from '@/types/farmer';
import { MAIN_CROPS } from '@/constants';

interface Props {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
}

type FarmingTypes = {
  waterPaddy: boolean;
  fieldFarming: boolean;
  livestock: boolean;
  orchard: boolean;
  forageCrop: boolean;
};

export default function FarmingInfo({ formData, setFormData }: Props) {
  // 기본 영농형태 타입 정의
  const defaultFarmingTypes: FarmingTypes = {
    waterPaddy: false,
    fieldFarming: false,
    livestock: false,
    orchard: false,
    forageCrop: false
  };

  // 현재 영농형태 상태 (없으면 기본값 사용)
  const currentFarmingTypes = formData.farmingTypes || defaultFarmingTypes;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">영농 정보</h2>
      
      {/* 영농형태 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">영농형태</label>
        <div className="grid grid-cols-2 gap-4">
          {(Object.entries(defaultFarmingTypes) as [keyof FarmingTypes, boolean][]).map(([key]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={currentFarmingTypes[key] || false}
                onChange={(e) => setFormData((prev: FormData) => ({
                  ...prev,
                  farmingTypes: {
                    ...currentFarmingTypes,
                    [key]: e.target.checked
                  }
                }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {key === 'waterPaddy' ? '수도작' :
                 key === 'fieldFarming' ? '밭농사' :
                 key === 'orchard' ? '과수원' :
                 key === 'livestock' ? '축산업' :
                 key === 'forageCrop' ? '사료작물' : key}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 영농정보메모 */}
      <div>
        <label htmlFor="farmingMemo" className="block text-sm font-medium text-gray-700 mb-2">영농정보메모</label>
        <textarea
          id="farmingMemo"
          value={formData.farmingMemo || ''}
          onChange={(e) => setFormData((prev: FormData) => ({
            ...prev,
            farmingMemo: e.target.value
          }))}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="영농 관련 특이사항이나 메모를 입력하세요."
        />
      </div>

      {/* 주작물 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">주작물</label>
        <div className="space-y-6">
          {Object.entries(MAIN_CROPS).map(([mainType, { label, subTypes }]) => {
            const cropType = mainType as MainCropType;
            const detailsKey = `${cropType}Details` as const;
            
            return (
              <div key={mainType} className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={typeof formData.mainCrop?.[cropType] === 'boolean' 
                      ? formData.mainCrop[cropType] 
                      : false}
                    onChange={(e) => setFormData((prev: FormData) => ({
                      ...prev,
                      mainCrop: {
                        ...(prev.mainCrop || {}),
                        [cropType]: e.target.checked,
                        // 체크 해제시 하위 작물도 모두 해제
                        ...(!e.target.checked && {
                          [detailsKey]: []
                        })
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
                </div>
                
                {/* 세부 작물 선택 */}
                {formData.mainCrop?.[cropType] && (
                  <div className="ml-6 grid grid-cols-3 gap-2">
                    {subTypes.map(({ value, label: subLabel }) => {
                      const details = formData.mainCrop?.[detailsKey];
                      const isChecked = Array.isArray(details) && details.includes(value);
                      
                      return (
                        <label key={value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setFormData((prev: FormData) => ({
                              ...prev,
                              mainCrop: {
                                ...(prev.mainCrop || {}),
                                [detailsKey]: e.target.checked
                                  ? [...(Array.isArray(prev.mainCrop?.[detailsKey]) 
                                      ? prev.mainCrop[detailsKey] 
                                      : []), value]
                                  : (Array.isArray(prev.mainCrop?.[detailsKey])
                                      ? prev.mainCrop[detailsKey].filter(v => v !== value)
                                      : [])
                              }
                            }))}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{subLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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