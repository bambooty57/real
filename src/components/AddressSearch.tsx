'use client';

import { useEffect } from 'react'

interface AddressData {
  zonecode: string;
  roadAddress: string;
  jibunAddress?: string;
  autoJibunAddress?: string;
  buildingName?: string;
}

export interface AddressSearchProps {
  onComplete: (data: AddressData) => void;
}

declare global {
  interface Window {
    daum: {
      Postcode: new (config: {
        oncomplete: (data: AddressData) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

export default function AddressSearch({ onComplete }: AddressSearchProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleClick = () => {
    if (typeof window === 'undefined' || !window.daum?.Postcode) {
      console.error('Daum Postcode script is not loaded');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        onComplete({
          ...data,
          jibunAddress: data.jibunAddress || data.autoJibunAddress || ''
        });
      }
    }).open();
  };

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        주소 검색
      </button>
    </div>
  );
} 