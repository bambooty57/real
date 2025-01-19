'use client';

interface AddressData {
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
}

interface AddressSearchProps {
  onAddressSelect: (data: AddressData) => void;
}

export default function AddressSearch({ onAddressSelect }: AddressSearchProps) {
  const handleClick = () => {
    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        // 건물명이 있는 경우 상세주소로 설정
        const detail = data.buildingName ? `(${data.buildingName})` : '';
        
        onAddressSelect({
          zipCode: data.zonecode,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress || data.autoJibunAddress || '',
          addressDetail: detail
        });
      }
    }).open();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
    >
      주소 검색
    </button>
  );
} 