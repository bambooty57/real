import { Farmer } from '@/types/farmer';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';
import { MAIN_CROPS } from '@/constants';
import Link from 'next/link';
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings';
import { formatPhoneNumber } from '@/utils/format';

interface FarmerDetailModalProps {
  farmer: Farmer | null;
  isOpen: boolean;
  onClose: () => void;
}

// 별점 표시 함수
const getRatingStars = (rating: number) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600">({rating}점)</span>
    </div>
  );
};

export default function FarmerDetailModal({ farmer, isOpen, onClose }: FarmerDetailModalProps) {
  if (!farmer) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold">
                    {farmer.name} 상세 정보
                  </Dialog.Title>
                  <div className="flex gap-2">
                    <Link
                      href={`/farmers/${farmer.id}/edit`}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      수정하기
                    </Link>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                      onClick={onClose}
                    >
                      닫기
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 기본 정보 */}
                  <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">기본 정보</h4>
                      <dl className="space-y-4">
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
                          <dd className="font-medium">{farmer.canReceiveMail ? '가능' : '불가능'}</dd>
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

                    {/* 영농 정보 */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">영농 정보</h4>
                      <div className="space-y-4">
                        {/* 영농 형태 */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">영농 형태</h5>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(farmer.farmingTypes).map(([key, value]) => {
                              if (!value) return null;
                              const labels = {
                                waterPaddy: '수도작',
                                fieldFarming: '밭농사',
                                orchard: '과수원',
                                livestock: '축산업',
                                forageCrop: '조사료'
                              };
                              return (
                                <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                  {labels[key as keyof typeof labels]}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* 영농정보메모 */}
                        {farmer.farmingMemo && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-600 mb-2">영농정보메모</h5>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-gray-700 whitespace-pre-wrap">{farmer.farmingMemo}</p>
                            </div>
                          </div>
                        )}

                        {/* 주요 작물 */}
                        <div className="space-y-4">
                          {Object.entries(MAIN_CROPS).map(([mainType, { label, subTypes }]) => {
                            const cropType = mainType as keyof typeof farmer.mainCrop;
                            const detailsKey = `${cropType}Details` as keyof typeof farmer.mainCrop;
                            const details = farmer.mainCrop?.[detailsKey] as string[] | undefined;
                            
                            if (!farmer.mainCrop?.[cropType]) return null;
                            
                            return (
                              <div key={mainType}>
                                <h5 className="text-sm font-medium text-gray-600 mb-2">{label}</h5>
                                {details && details.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {details.map(detail => {
                                      const subType = subTypes.find(st => st.value === detail);
                                      return (
                                        <span key={detail} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                          {subType?.label || detail}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 농기계 정보 */}
                  <div className="space-y-6">
                    {farmer.equipments && farmer.equipments.length > 0 && (
                      <div className="bg-white shadow rounded-lg p-6">
                        <h4 className="text-lg font-semibold mb-4">보유 농기계</h4>
                        <div className="space-y-6">
                          {farmer.equipments.map((equipment, index) => (
                            <div key={equipment.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                              <h5 className="font-semibold mb-2">농기계 #{index + 1}</h5>
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
                                  <dt className="text-gray-600">연식</dt>
                                  <dd className="font-medium">{equipment.year}년</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-600">사용시간</dt>
                                  <dd className="font-medium">{equipment.usageHours}시간</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-600">상태</dt>
                                  <dd>{getRatingStars(equipment.condition || 0)}</dd>
                                </div>
                                {equipment.tradeType && (
                                  <>
                                    <div>
                                      <dt className="text-gray-600">거래유형</dt>
                                      <dd className="font-medium">
                                        <span className={`inline-block px-2 py-1 rounded text-sm ${
                                          equipment.tradeType === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                          {equipment.tradeType === 'sale' ? '판매' : '구매'}
                                        </span>
                                      </dd>
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
                                  </>
                                )}

                                {/* 부착작업기 정보 */}
                                {equipment.attachments && equipment.attachments.length > 0 && (
                                  <div className="col-span-2">
                                    <dt className="text-gray-600 mb-2">부착작업기</dt>
                                    <dd className="grid grid-cols-1 gap-4">
                                      {equipment.attachments.map((attachment, attIndex) => (
                                        <div key={attIndex} className="bg-gray-50 p-4 rounded-lg">
                                          <h6 className="font-medium mb-2">
                                            {attachment.type === 'loader' ? '로더' :
                                             attachment.type === 'rotary' ? '로터리' :
                                             attachment.type === 'frontWheel' ? '전륜' :
                                             attachment.type === 'rearWheel' ? '후륜' :
                                             attachment.type}
                                          </h6>
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

                                {/* 이미지 */}
                                {equipment.images && equipment.images.length > 0 && (
                                  <div className="col-span-2">
                                    <dt className="text-gray-600 mb-2">이미지</dt>
                                    <dd className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {equipment.images.map((image, index) => (
                                        <div key={index} className="relative aspect-square">
                                          <img
                                            src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                                            alt={`농기계 이미지 ${index + 1}`}
                                            className="object-cover rounded-lg w-full h-full"
                                          />
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
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 
