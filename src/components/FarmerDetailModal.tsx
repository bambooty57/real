import { Farmer } from '@/types/farmer';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import Image from 'next/image';
import { MAIN_CROPS } from '@/constants';
import { useRouter } from 'next/navigation';
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings';
import { formatPhoneNumber } from '@/utils/format';
import React from 'react';
import { FaPrint } from 'react-icons/fa';

interface FarmerDetailModalProps {
  farmer: Farmer | null;
  isOpen: boolean;
  onClose: () => void;
}

// 별점 표시 함수
const getRatingStars = (rating: number) => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};

export default function FarmerDetailModal({ farmer, isOpen, onClose }: FarmerDetailModalProps) {
  if (!farmer) return null;

  const router = useRouter();

  const handleEdit = () => {
    router.push(`/farmers/${farmer.id}/edit`);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 print:hidden" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          <div className="p-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-6 print:hidden">
              <Dialog.Title className="text-2xl font-bold">{farmer.name} 상세 정보</Dialog.Title>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  <FaPrint className="inline-block mr-2" />
                  인쇄
                </button>
                <button
                  onClick={handleEdit}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  수정
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  닫기
                </button>
              </div>
            </div>

            {/* 1페이지: 기본 정보 */}
            <div className="print:page">
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-gray-600">이름</dt>
                    <dd className="font-medium">{farmer.name}</dd>
                  </div>
                  {farmer.businessName && (
                    <div>
                      <dt className="text-gray-600">상호명</dt>
                      <dd className="font-medium">{farmer.businessName}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-600">전화번호</dt>
                    <dd className="font-medium">
                      <a 
                        href={`tel:${farmer.phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {formatPhoneNumber(farmer.phone)}
                      </a>
                    </dd>
                  </div>
                  {farmer.roadAddress && (
                    <div>
                      <dt className="text-gray-600">주소</dt>
                      <dd className="font-medium">{farmer.roadAddress} {farmer.addressDetail}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-600">우편수취</dt>
                    <dd className="font-medium">
                      <span className={`inline-block px-2 py-1 rounded text-sm ${
                        farmer.canReceiveMail ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {farmer.canReceiveMail ? '가능' : '불가능'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">연령대</dt>
                    <dd className="font-medium">{farmer.ageGroup}</dd>
                  </div>
                  {farmer.memo && (
                    <div>
                      <dt className="text-gray-600">메모</dt>
                      <dd className="font-medium whitespace-pre-wrap">{farmer.memo}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* 2페이지: 보유 장비 */}
            <div className="print:page-break">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">보유 장비</h2>
                <div className="space-y-6">
                  {farmer.equipments.map((equipment, index) => (
                    <div key={equipment.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                      <h3 className="font-semibold mb-2">농기계 #{index + 1}</h3>
                      <dl className="grid grid-cols-1 gap-4">
                        <div>
                          <dt className="text-gray-600">기종</dt>
                          <dd className="font-medium">{getKoreanEquipmentType(equipment.type)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">제조사</dt>
                          <dd className="font-medium">{equipment.manufacturer}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">모델명</dt>
                          <dd className="font-medium">{equipment.model}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">거래방식</dt>
                          <dd className="font-medium">
                            {equipment.saleType ? (equipment.saleType === 'new' ? '신규' : '중고') : '없음'}
                          </dd>
                        </div>
                        {equipment.desiredPrice && (
                          <div>
                            <dt className="text-gray-600">희망가격</dt>
                            <dd className="font-medium">
                              {Number(equipment.desiredPrice).toLocaleString()}만원
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-gray-600">거래상태</dt>
                          <dd className="font-medium">
                            <span className={`inline-block px-2 py-1 rounded text-sm ${
                              equipment.saleStatus === 'available' ? 'bg-green-100 text-green-800' :
                              equipment.saleStatus === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                              equipment.saleStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {equipment.saleStatus === 'available' ? '거래가능' :
                               equipment.saleStatus === 'reserved' ? '예약중' :
                               equipment.saleStatus === 'completed' ? '거래완료' : '없음'}
                            </span>
                          </dd>
                        </div>

                        {equipment.memo && (
                          <div>
                            <dt className="text-gray-600">메모</dt>
                            <dd className="font-medium whitespace-pre-wrap">{equipment.memo}</dd>
                          </div>
                        )}

                        {/* 부착작업기 정보 */}
                        {equipment.attachments && equipment.attachments.length > 0 && (
                          <div>
                            <dt className="text-gray-600 mb-2">부착작업기</dt>
                            <dd className="grid grid-cols-1 gap-4">
                              {equipment.attachments.map((attachment, attIndex) => (
                                <div key={attIndex} className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2">
                                    {attachment.type === 'loader' ? '로더' :
                                     attachment.type === 'rotary' ? '로터리' :
                                     attachment.type === 'frontWheel' ? '전륜' :
                                     attachment.type === 'rearWheel' ? '후륜' :
                                     attachment.type}
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">제조사:</span>{' '}
                                      {attachment.manufacturer}
                                    </div>
                                    <div>
                                      <span className="text-gray-600">모델명:</span>{' '}
                                      {attachment.model}
                                    </div>
                                    <div>
                                      <span className="text-gray-600">상태:</span>{' '}
                                      {getRatingStars(Number(attachment.condition || 0))}
                                    </div>
                                    {attachment.memo && (
                                      <div>
                                        <span className="text-gray-600">메모:</span>{' '}
                                        <span className="whitespace-pre-wrap">{attachment.memo}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3페이지: 이미지 갤러리 */}
            <div className="print:page-break">
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">이미지 갤러리</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 farmer-image-gallery">
                  {/* 농민 이미지 */}
                  {farmer.farmerImages?.map((image, index) => (
                    <div key={`farmer-${index}`} className="farmer-image aspect-[4/3]">
                      <Image
                        src={image.toString()}
                        alt={`농민 이미지 ${index + 1}`}
                        width={400}
                        height={300}
                        className="rounded-lg object-cover w-full h-full"
                      />
                      <p className="text-sm text-gray-600 mt-1">농민 이미지 {index + 1}</p>
                    </div>
                  ))}

                  {/* 농기계 이미지 */}
                  {farmer.equipments?.map((equipment, eqIndex) => (
                    <React.Fragment key={`eq-${eqIndex}`}>
                      {equipment.images?.map((image, imgIndex) => (
                        <div key={`eq-${eqIndex}-${imgIndex}`} className="farmer-image aspect-[4/3]">
                          <Image
                            src={image.toString()}
                            alt={`${getKoreanEquipmentType(equipment.type)} 이미지 ${imgIndex + 1}`}
                            width={400}
                            height={300}
                            className="rounded-lg object-cover w-full h-full"
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            {equipment.manufacturer} {equipment.model} {getKoreanEquipmentType(equipment.type)}
                          </p>
                        </div>
                      ))}

                      {/* 부착장비 이미지 */}
                      {equipment.attachments?.map((attachment, attIndex) =>
                        attachment.images?.map((image, imgIndex) => (
                          <div key={`att-${eqIndex}-${attIndex}-${imgIndex}`} className="farmer-image aspect-[4/3]">
                            <Image
                              src={image.toString()}
                              alt={`${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 이미지 ${imgIndex + 1}`}
                              width={400}
                              height={300}
                              className="rounded-lg object-cover w-full h-full"
                            />
                            <p className="text-sm text-gray-600 mt-1">
                              {getKoreanEquipmentType(equipment.type)}의 
                              {attachment.type === 'loader' ? ' 로더' :
                               attachment.type === 'rotary' ? ' 로터리' :
                               attachment.type === 'frontWheel' ? ' 전륜' :
                               attachment.type === 'rearWheel' ? ' 후륜' : 
                               ` ${attachment.type}`}
                            </p>
                          </div>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 
