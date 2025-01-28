'use client';

import React from 'react';
import Image from 'next/image';
import { Farmer } from '@/types/farmer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { getKoreanEquipmentType } from '@/utils/mappings';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface FarmerCardProps {
  farmer: Farmer;
  onSelect: (id: string, checked: boolean) => void;
  isSelected: boolean;
  onViewDetail: (farmer: Farmer) => void;
}

const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
};

export default function FarmerCard({ farmer, onSelect, isSelected, onViewDetail }: FarmerCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow relative">
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(farmer.id, e.target.checked)}
          className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300"
        />
      </div>

      <div className="relative aspect-[4/3] rounded-t-lg overflow-hidden farmer-image-gallery">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          className="h-full"
        >
          {farmer.farmerImages && farmer.farmerImages.length > 0 ? (
            farmer.farmerImages.map((image, index) => (
              image && (
                <SwiperSlide key={`farmer-${index}`}>
                  <div className="relative w-full h-full">
                    <Image
                      src={image.toString()}
                      alt={`${farmer.name}의 사진 ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e: any) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                      <span>농민 사진 {index + 1}/{farmer.farmerImages.length}</span>
                    </div>
                  </div>
                </SwiperSlide>
              )
            ))
          ) : (
            <SwiperSlide>
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">이미지 없음</span>
              </div>
            </SwiperSlide>
          )}

          {farmer.equipments?.map((equipment, eqIndex) => (
            <React.Fragment key={`eq-fragment-${eqIndex}`}>
              {equipment.images?.filter(Boolean).map((image, imgIndex) => (
                <SwiperSlide key={`eq-${eqIndex}-${imgIndex}`}>
                  <div className="relative w-full h-full">
                    <Image
                      src={image.toString()}
                      alt={`${getKoreanEquipmentType(equipment.type)} 사진 ${imgIndex + 1}`}
                      fill
                      className="object-cover"
                      onError={(e: any) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                      <span>
                        {equipment.manufacturer} {equipment.model} {getKoreanEquipmentType(equipment.type)}
                        {' '}({imgIndex + 1}/{equipment.images?.filter(Boolean).length})
                      </span>
                    </div>
                  </div>
                </SwiperSlide>
              ))}

              {equipment.attachments?.map((attachment, attIndex) => 
                attachment.images?.filter(Boolean).map((image, imgIndex) => (
                  <SwiperSlide key={`att-${eqIndex}-${attIndex}-${imgIndex}`}>
                    <div className="relative w-full h-full">
                      <Image
                        src={image.toString()}
                        alt={`${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 사진 ${imgIndex + 1}`}
                        fill
                        className="object-cover"
                        onError={(e: any) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                        <span>
                          {getKoreanEquipmentType(equipment.type)}의 
                          {attachment.type === 'loader' ? ' 로더' :
                           attachment.type === 'rotary' ? ' 로터리' :
                           attachment.type === 'frontWheel' ? ' 전륜' :
                           attachment.type === 'rearWheel' ? ' 후륜' : 
                           ` ${attachment.type}`}
                          {' '}({imgIndex + 1}/{attachment.images?.filter(Boolean).length})
                        </span>
                      </div>
                    </div>
                  </SwiperSlide>
                ))
              )}
            </React.Fragment>
          ))}
        </Swiper>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{farmer.name}</h3>
          <button
            onClick={() => onViewDetail(farmer)}
            className="text-blue-600 hover:text-blue-800"
          >
            상세보기
          </button>
        </div>

        <div className="space-y-2">
          <p className="flex items-center">
            <span className="font-medium mr-2">전화:</span>
            <a 
              href={`tel:${farmer.phone}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {formatPhoneNumber(farmer.phone)}
            </a>
          </p>

          <div className="space-y-1">
            {farmer.zipCode && (
              <p>
                <span className="font-medium">우편번호:</span> {farmer.zipCode}
              </p>
            )}
            {farmer.roadAddress && (
              <p className="flex items-center">
                <span className="font-medium mr-2">도로명:</span>
                <a 
                  href={`https://map.kakao.com/link/search/${farmer.roadAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {farmer.roadAddress}
                </a>
              </p>
            )}
            {farmer.jibunAddress && (
              <p className="flex items-center">
                <span className="font-medium mr-2">지번:</span>
                <a 
                  href={`https://map.kakao.com/link/search/${farmer.jibunAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {farmer.jibunAddress}
                </a>
              </p>
            )}
            {farmer.addressDetail && (
              <p>
                <span className="font-medium">상세주소:</span> {farmer.addressDetail}
              </p>
            )}
          </div>

          {farmer.businessName && (
            <p>
              <span className="font-medium">상호:</span> {farmer.businessName}
            </p>
          )}

          <p>
            <span className="font-medium">우편수취:</span>
            <span className={`ml-2 px-2 py-0.5 text-sm rounded ${
              farmer.canReceiveMail ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {farmer.canReceiveMail ? '가능' : '불가능'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
} 