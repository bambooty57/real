'use client';

import { FormData } from '@/types/farmer';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AddressSearch from '@/components/AddressSearch';

interface Props {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
}

export default function BasicInfo({ formData, setFormData }: Props) {
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [isNameVerified, setIsNameVerified] = useState(false);
  const [isManualAddressMode, setIsManualAddressMode] = useState(false);

  const checkDuplicate = async () => {
    if (!formData.name || !formData.phone) {
      setDuplicateMessage('이름과 전화번호를 모두 입력해주세요.');
      setIsNameVerified(false);
      return;
    }

    setIsDuplicateChecking(true);
    try {
      const farmersRef = collection(db, 'farmers');
      const phoneWithoutHyphen = formData.phone.replace(/-/g, '');
      
      const q = query(
        farmersRef,
        where('name', '==', formData.name.trim()),
        where('phone', '==', phoneWithoutHyphen)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setDuplicateMessage('이미 등록된 농민입니다.');
        setIsNameVerified(false);
      } else {
        setDuplicateMessage('등록 가능한 농민입니다.');
        setIsNameVerified(true);
        // 중복확인 통과 시 폼 데이터 업데이트
        setFormData(prev => ({
          ...prev,
          name: formData.name.trim(),
          phone: phoneWithoutHyphen
        }));
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
      setDuplicateMessage('중복 확인 중 오류가 발생했습니다.');
      setIsNameVerified(false);
    } finally {
      setIsDuplicateChecking(false);
    }
  };

  // 이름이나 전화번호가 변경될 때마다 중복 메시지와 검증 상태 초기화
  useEffect(() => {
    setDuplicateMessage(null);
    setIsNameVerified(false);
  }, [formData.name, formData.phone]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">기본 정보</h2>
      
      {/* 이름 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름 *</label>
        <div className="mt-1">
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData((prev: FormData) => ({ ...prev, name: e.target.value }))}
            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 ${
              isNameVerified ? 'border-green-500' : 'border-gray-300'
            }`}
            required
          />
        </div>
      </div>

      {/* 전화번호 */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">전화번호 *</label>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone ? formData.phone.replace(/^010/, '') : ''}
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-12"
              required
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500">010-</span>
            </div>
          </div>
          <button
            type="button"
            onClick={checkDuplicate}
            disabled={isDuplicateChecking || !formData.name || !formData.phone || formData.phone === '010'}
            className={`px-4 py-2 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 ${
              isNameVerified ? 'bg-green-500' : 'bg-blue-500'
            }`}
          >
            {isDuplicateChecking ? '확인중...' : (isNameVerified ? '확인완료' : '중복확인')}
          </button>
        </div>
        {duplicateMessage && (
          <p className={`mt-1 text-sm ${
            duplicateMessage.includes('등록 가능') ? 'text-green-600' : 'text-red-600'
          }`}>
            {duplicateMessage}
          </p>
        )}
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
                (formData.rating || 0) >= star
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
          value={formData.businessName || ''}
          onChange={(e) => setFormData((prev: FormData) => ({ ...prev, businessName: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* 연령대 */}
      <div>
        <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">연령대</label>
        <select
          id="ageGroup"
          value={formData.ageGroup || ''}
          onChange={(e) => setFormData((prev: FormData) => ({ ...prev, ageGroup: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

      {/* 주소 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">주소</label>
        <div className="flex gap-2">
          <AddressSearch
            onComplete={(data: { zonecode: string; roadAddress: string; jibunAddress?: string; }) => {
              setFormData(prev => ({
                ...prev,
                zipCode: data.zonecode,
                roadAddress: data.roadAddress,
                jibunAddress: data.jibunAddress || '',
              }));
              setIsManualAddressMode(false);
            }}
          />
          <button
            type="button"
            onClick={() => setIsManualAddressMode(!isManualAddressMode)}
            className={`inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
              isManualAddressMode 
                ? 'text-white bg-blue-500 hover:bg-blue-600' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isManualAddressMode ? '수동입력 중' : '수동입력'}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                zipCode: '',
                roadAddress: '',
                jibunAddress: '',
                addressDetail: ''
              }));
              setIsManualAddressMode(false);
            }}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            초기화
          </button>
        </div>
        
        {/* 우편번호 */}
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">우편번호</label>
          <input
            type="text"
            id="zipCode"
            value={formData.zipCode || ''}
            onChange={(e) => isManualAddressMode && setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
            readOnly={!isManualAddressMode}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              !isManualAddressMode ? 'bg-gray-50' : 'bg-white'
            }`}
          />
        </div>

        {/* 도로명 주소 */}
        <div>
          <label htmlFor="roadAddress" className="block text-sm font-medium text-gray-700">도로명 주소</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="roadAddress"
              value={formData.roadAddress || ''}
              onChange={(e) => isManualAddressMode && setFormData(prev => ({ ...prev, roadAddress: e.target.value }))}
              readOnly={!isManualAddressMode}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                !isManualAddressMode ? 'bg-gray-50' : 'bg-white'
              }`}
            />
            {formData.roadAddress && (
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(formData.roadAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                지도보기
              </a>
            )}
          </div>
        </div>

        {/* 지번 주소 */}
        <div>
          <label htmlFor="jibunAddress" className="block text-sm font-medium text-gray-700">지번 주소</label>
          <input
            type="text"
            id="jibunAddress"
            value={formData.jibunAddress || ''}
            onChange={(e) => isManualAddressMode && setFormData(prev => ({ ...prev, jibunAddress: e.target.value }))}
            readOnly={!isManualAddressMode}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              !isManualAddressMode ? 'bg-gray-50' : 'bg-white'
            }`}
          />
        </div>

        {/* 상세주소 */}
        <div>
          <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700">상세주소</label>
          <input
            type="text"
            id="addressDetail"
            value={formData.addressDetail || ''}
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
            checked={formData.canReceiveMail || false}
            onChange={(e) => setFormData((prev: FormData) => ({ ...prev, canReceiveMail: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">우편수취 가능</span>
        </label>
      </div>
    </div>
  );
} 