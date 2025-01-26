'use client';

import { FormData } from '@/types/farmer';
import AddressSearch from '@/components/AddressSearch';

interface BasicInfoProps {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
}

export default function BasicInfo({ formData, setFormData }: BasicInfoProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">기본 정보</h2>
      
      {/* 이름 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름 *</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev: FormData) => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      {/* 별점 평가 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">별점 평가</label>
        <div className="flex gap-2 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                setFormData((prev: FormData) => ({
                  ...prev,
                  rating: star
                }))
              }}
              className={`p-1 ${
                formData.rating >= star
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* 상호명 */}
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">상호명</label>
        <input
          type="text"
          id="businessName"
          value={formData.businessName}
          onChange={(e) => setFormData((prev: FormData) => ({ ...prev, businessName: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* 주소 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">주소 *</label>
        <AddressSearch
          onComplete={(data: { zonecode: string; roadAddress: string; jibunAddress?: string; }) => {
            setFormData(prev => ({
              ...prev,
              zipCode: data.zonecode,
              roadAddress: data.roadAddress,
              jibunAddress: data.jibunAddress || '',
            }))
          }}
        />
        
        {/* 우편번호 */}
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">우편번호</label>
          <input
            type="text"
            id="zipCode"
            value={formData.zipCode}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
          />
        </div>

        {/* 도로명 주소 */}
        <div>
          <label htmlFor="roadAddress" className="block text-sm font-medium text-gray-700">도로명 주소</label>
          <input
            type="text"
            id="roadAddress"
            value={formData.roadAddress}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
          />
        </div>

        {/* 지번 주소 */}
        <div>
          <label htmlFor="jibunAddress" className="block text-sm font-medium text-gray-700">지번 주소</label>
          <input
            type="text"
            id="jibunAddress"
            value={formData.jibunAddress}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
          />
        </div>

        {/* 상세주소 */}
        <div>
          <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700">상세주소</label>
          <input
            type="text"
            id="addressDetail"
            value={formData.addressDetail}
            onChange={(e) => setFormData((prev: FormData) => ({ ...prev, addressDetail: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 우편수취가능여부 */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.canReceiveMail}
            onChange={(e) => setFormData((prev: FormData) => ({ ...prev, canReceiveMail: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">우편수취 가능</span>
        </label>
      </div>

      {/* 전화번호 */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">전화번호 *</label>
        <div className="flex items-center">
          <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            010
          </span>
          <input
            type="text"
            id="phone"
            value={formData.phone.replace(/^010/, '')}
            onChange={(e) => {
              let value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length > 8) value = value.slice(0, 8);
              if (value.length >= 4) {
                value = value.slice(0, 4) + '-' + value.slice(4);
              }
              setFormData((prev: FormData) => ({ ...prev, phone: '010' + value }));
            }}
            placeholder="0000-0000"
            maxLength={9}
            className="mt-1 block w-full rounded-r-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* 연령대 */}
      <div>
        <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">연령대 *</label>
        <select
          id="ageGroup"
          value={formData.ageGroup}
          onChange={(e) => setFormData((prev: FormData) => ({ ...prev, ageGroup: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">선택하세요</option>
          <option value="20대">20대</option>
          <option value="30대">30대</option>
          <option value="40대">40대</option>
          <option value="50대">50대</option>
          <option value="60대">60대</option>
          <option value="70대 이상">70대 이상</option>
        </select>
      </div>
    </div>
  );
} 