import { Farmer, MainCrop } from '@/types/farmer';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MAIN_CROPS } from '@/constants';
import { useRouter } from 'next/navigation';
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings';
import { formatPhoneNumber } from '@/utils/format';
import React from 'react';
import { FaDownload } from 'react-icons/fa';
import { cropDisplayNames } from '@/utils/mappings';
import html2pdf from 'html2pdf.js';
import { storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

interface FarmerDetailModalProps {
  farmer: Farmer | null;
  isOpen: boolean;
  onClose: () => void;
}

// 별점 표시 함수 개선
const getRatingStars = (rating: number) => {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  return (
    <span className="text-yellow-400 text-xl print:text-base">
      {stars}
      <span className="text-gray-600 text-sm ml-2">({rating}/5)</span>
    </span>
  );
};

// ImageDownloadModal 컴포넌트 수정
interface ImageDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

const ImageDownloadModal = ({ isOpen, onClose, imageUrl, title }: ImageDownloadModalProps) => {
  const [downloadURL, setDownloadURL] = useState<string>('');

  useEffect(() => {
    const getImageUrl = async () => {
      try {
        const imageRef = ref(storage, imageUrl);
        const url = await getDownloadURL(imageRef);
        setDownloadURL(url);
      } catch (error) {
        console.error('이미지 URL 가져오기 실패:', error);
      }
    };
    
    if (imageUrl) {
      getImageUrl();
    }
  }, [imageUrl]);

  const handleDownload = async () => {
    try {
      if (!downloadURL) {
        const imageRef = ref(storage, imageUrl);
        const url = await getDownloadURL(imageRef);
        window.open(url, '_blank');
      } else {
        window.open(downloadURL, '_blank');
      }
      onClose();
    } catch (error) {
      console.error('이미지 다운로드 중 오류 발생:', error);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl bg-white rounded-lg shadow-xl">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="sr-only">닫기</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative aspect-[4/3] w-full mb-4">
              {downloadURL ? (
                <Image
                  src={downloadURL}
                  alt={title}
                  fill
                  className="object-contain rounded-lg"
                  unoptimized={true}
                  priority={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                  <span className="text-gray-400">이미지 로딩중...</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <FaDownload className="w-4 h-4" />
                <span>다운로드</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default function FarmerDetailModal({ farmer, isOpen, onClose }: FarmerDetailModalProps) {
  if (!farmer) return null;

  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [imageURLs, setImageURLs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadImages = async () => {
      if (!farmer) return;

      const urls: { [key: string]: string } = {};

      // 농민 이미지 URL 가져오기
      for (const image of farmer.farmerImages || []) {
        try {
          const imageRef = ref(storage, image.toString());
          const url = await getDownloadURL(imageRef);
          urls[image.toString()] = url;
        } catch (error) {
          console.error('이미지 URL 가져오기 실패:', error);
        }
      }

      // 장비 이미지 URL 가져오기
      for (const equipment of farmer.equipments || []) {
        for (const image of equipment.images || []) {
          try {
            const imageRef = ref(storage, image.toString());
            const url = await getDownloadURL(imageRef);
            urls[image.toString()] = url;
          } catch (error) {
            console.error('이미지 URL 가져오기 실패:', error);
          }
        }

        // 부착장비 이미지 URL 가져오기
        for (const attachment of equipment.attachments || []) {
          for (const image of attachment.images || []) {
            try {
              const imageRef = ref(storage, image.toString());
              const url = await getDownloadURL(imageRef);
              urls[image.toString()] = url;
            } catch (error) {
              console.error('이미지 URL 가져오기 실패:', error);
            }
          }
        }
      }

      setImageURLs(urls);
    };

    if (isOpen && farmer) {
      loadImages();
    }
  }, [isOpen, farmer]);

  // PDF 다운로드 함수 수정
  const handlePDFDownload = async () => {
    if (!contentRef.current) return;

    try {
      const element = contentRef.current;
      const opt = {
        margin: 10,
        filename: `${farmer.name}_상세정보.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
          imageTimeout: 0,
          onclone: function(clonedDoc: Document) {
            // 복제된 문서의 이미지들을 이미 변환된 URL로 교체
            const images = clonedDoc.getElementsByTagName('img');
            for (let i = 0; i < images.length; i++) {
              const img = images[i];
              const originalSrc = img.getAttribute('data-original-src') || img.getAttribute('src');
              if (originalSrc && imageURLs[originalSrc]) {
                img.src = imageURLs[originalSrc];
              }
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.crossOrigin = 'anonymous';
            }
          }
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait'
        },
        pagebreak: { 
          mode: ['css', 'legacy'],
          before: '.page-break'
        }
      };

      // 원본 이미지 URL을 data-original-src 속성으로 저장
      const originalImages = element.getElementsByTagName('img');
      for (let i = 0; i < originalImages.length; i++) {
        const img = originalImages[i];
        const src = img.getAttribute('src');
        if (src) {
          img.setAttribute('data-original-src', src);
        }
      }

      // 인쇄용 스타일을 적용
      element.classList.add('print-mode');

      await html2pdf().set(opt).from(element).save();
      
      // PDF 생성 후 인쇄용 스타일 제거
      element.classList.remove('print-mode');

      // data-original-src 속성 제거
      for (let i = 0; i < originalImages.length; i++) {
        originalImages[i].removeAttribute('data-original-src');
      }
    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  // 이미지 선택 함수
  const handleImageClick = (imageUrl: string, title: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageTitle(title);
    setDownloadModalOpen(true);
  };

  const handleEdit = () => {
    router.push(`/farmers/${farmer.id}/edit`);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 print:hidden" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl print:max-h-none print:overflow-visible">
            <div className="p-6 print:p-0">
              {/* 화면용 헤더 - 인쇄 시 숨김 */}
              <div className="flex justify-between items-center mb-6 print:hidden">
                <Dialog.Title className="text-2xl font-bold">{farmer.name} 상세 정보</Dialog.Title>
                <div className="flex gap-2">
                  <button
                    onClick={handlePDFDownload}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    <FaDownload className="inline-block mr-2" />
                    PDF 다운로드
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

              {/* 인쇄용 헤더 */}
              <div className="hidden print:block print:mb-6">
                <h1 className="text-3xl font-bold text-center">{farmer.name} 상세 정보</h1>
                <p className="text-center text-gray-500 mt-2">작성일: {new Date().toLocaleDateString()}</p>
              </div>

              {/* 내용 영역 - PDF 변환 대상 */}
              <div ref={contentRef}>
                {/* 첫 페이지: 기본 정보, 영농 정보, 메모 */}
                <div className="first-page space-y-6">
                  {/* 기본 정보 */}
                  <div className="bg-white shadow rounded-lg p-6 print:p-2 print:shadow-none print:break-inside-avoid mb-6">
                    <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-2">
                      <div>
                        <dt className="text-gray-600">이름</dt>
                        <dd className="font-medium">{farmer.name}</dd>
                      </div>
                      {/* 농민 평가 */}
                      <div>
                        <dt className="text-gray-600">농민 평가</dt>
                        <dd className="font-medium">
                          <div className="flex items-center gap-2">
                            {getRatingStars(farmer.rating || 0)}
                          </div>
                        </dd>
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
                            className="text-blue-600 hover:text-blue-800 hover:underline print:text-black print:no-underline"
                          >
                            {formatPhoneNumber(farmer.phone)}
                          </a>
                        </dd>
                      </div>
                      {farmer.roadAddress && (
                        <div className="col-span-2">
                          <dt className="text-gray-600">주소</dt>
                          <dd className="font-medium">
                            {farmer.zipCode && <div>({farmer.zipCode})</div>}
                            <div>
                              <a 
                                href={`https://map.kakao.com/link/search/${encodeURIComponent(farmer.roadAddress)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline print:text-black print:no-underline flex items-center gap-1"
                              >
                                {farmer.roadAddress}
                                <span role="img" aria-label="지도" className="print:hidden">🗺️</span>
                              </a>
                            </div>
                            {farmer.jibunAddress && (
                              <div>
                                <a 
                                  href={`https://map.kakao.com/link/search/${encodeURIComponent(farmer.jibunAddress)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline print:text-black print:no-underline flex items-center gap-1"
                                >
                                  [지번] {farmer.jibunAddress}
                                  <span role="img" aria-label="지도" className="print:hidden">🗺️</span>
                                </a>
                              </div>
                            )}
                            {farmer.addressDetail && <div>{farmer.addressDetail}</div>}
                          </dd>
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
                    </dl>
                  </div>

                  {/* 영농 정보 */}
                  <div className="bg-white shadow rounded-lg p-6 print:p-2 print:shadow-none print:break-inside-avoid mb-6">
                    <h2 className="text-lg font-semibold mb-4">영농 정보</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-2">
                      {/* 영농형태 */}
                      {farmer.farmingTypes && Object.entries(farmer.farmingTypes).some(([_, value]) => value) && (
                        <div className="col-span-2">
                          <dt className="text-gray-600 mb-2">영농형태</dt>
                          <dd className="flex flex-wrap gap-2">
                            {Object.entries(farmer.farmingTypes)
                              .filter(([_, value]) => value)
                              .map(([type], index) => (
                                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                  {getFarmingTypeDisplay(type)}
                                </span>
                              ))}
                          </dd>
                        </div>
                      )}

                      {/* 주작물 */}
                      {farmer.mainCrop && (
                        <div className="col-span-2">
                          <dt className="text-gray-600 mb-2">주작물</dt>
                          <dd className="flex flex-wrap gap-2">
                            {Object.entries(farmer.mainCrop)
                              .filter(([key, value]) => value && !key.endsWith('Details'))
                              .map(([type], index) => {
                                const detailsKey = `${type}Details` as keyof MainCrop;
                                const details = farmer.mainCrop?.[detailsKey];
                                
                                return (
                                  <div key={index} className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                                      {getMainCropDisplay(type)}
                                    </span>
                                    {Array.isArray(details) && details.length > 0 && (
                                      details.map((detail, detailIndex) => (
                                        <span key={`${index}-${detailIndex}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                                          {cropDisplayNames[detail] || detail}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                );
                              })}
                          </dd>
                        </div>
                      )}

                      {/* 메모 */}
                      {farmer.memo && (
                        <div className="col-span-2">
                          <dt className="text-gray-600 mb-2">메모</dt>
                          <dd className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg text-gray-700">
                            {farmer.memo}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* 두 번째 페이지: 보유 장비 */}
                <div className="page-break" />
                <div className="second-page space-y-6">
                  <h1 className="text-3xl font-bold text-center mb-6">{farmer.name} 보유 장비</h1>
                  <div className="bg-white shadow rounded-lg p-6 print:p-2 print:shadow-none print:break-inside-avoid">
                    <h2 className="text-lg font-semibold mb-4">보유 장비</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4">
                      {farmer.equipments.map((equipment, index) => (
                        <div key={equipment.id} className="border rounded-lg p-4 print:break-inside-avoid">
                          <h3 className="font-semibold mb-2">
                            {getKoreanEquipmentType(equipment.type)} #{index + 1}
                          </h3>
                          <dl className="space-y-2">
                            <div>
                              <dt className="text-gray-600">장비 상태</dt>
                              <dd className="font-medium">
                                {getRatingStars(equipment.condition || 0)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-600">제조사</dt>
                              <dd className="font-medium">{getKoreanManufacturer(equipment.manufacturer)}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-600">모델명</dt>
                              <dd className="font-medium">{equipment.model}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-600">거래유형</dt>
                              <dd className="font-medium">
                                {equipment.saleType ? (equipment.saleType === 'new' ? '신규' : '중고') : '없음'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-600">거래방식</dt>
                              <dd className="font-medium">
                                {equipment.tradeType === 'sale' ? '판매' : 
                                 equipment.tradeType === 'purchase' ? '구매' : '없음'}
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
                                <dd className="font-medium whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                                  {equipment.memo}
                                </dd>
                              </div>
                            )}

                            {/* 부착작업기 정보 */}
                            {equipment.attachments && equipment.attachments.length > 0 && (
                              <div>
                                <dt className="text-gray-600 mt-4 mb-2">부착작업기</dt>
                                <dd className="space-y-3">
                                  {equipment.attachments.map((attachment, attIndex) => (
                                    <div key={attIndex} className="bg-gray-50 p-3 rounded-lg">
                                      <h4 className="font-medium mb-2">
                                        {attachment.type === 'loader' ? '로더' :
                                         attachment.type === 'rotary' ? '로터리' :
                                         attachment.type === 'frontWheel' ? '전륜' :
                                         attachment.type === 'rearWheel' ? '후륜' :
                                         attachment.type}
                                      </h4>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <span className="text-gray-600">제조사:</span>{' '}
                                          {getKoreanManufacturer(attachment.manufacturer)}
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

                {/* 세 번째 페이지: 이미지 갤러리 */}
                <div className="page-break" />
                <div className="third-page space-y-6">
                  <h1 className="text-3xl font-bold text-center mb-6">{farmer.name} 이미지 갤러리</h1>
                  <div className="bg-white shadow rounded-lg p-6 print:p-2 print:shadow-none">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">이미지 갤러리</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                      {/* 농민 이미지 */}
                      {farmer.farmerImages?.map((image, index) => (
                        <div 
                          key={`farmer-${index}`} 
                          className="farmer-image aspect-[4/3] relative group cursor-pointer"
                          onClick={() => handleImageClick(
                            image.toString(),
                            `농민 이미지 ${index + 1}`
                          )}
                        >
                          {imageURLs[image.toString()] ? (
                            <Image
                              src={imageURLs[image.toString()]}
                              alt={`농민 이미지 ${index + 1}`}
                              width={400}
                              height={300}
                              className="rounded-lg object-cover w-full h-full"
                              unoptimized={true}
                              priority={true}
                              loading="eager"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                              <span className="text-gray-400">이미지 로딩중...</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity" />
                          <p className="text-sm text-gray-600 mt-1">농민 이미지 {index + 1}</p>
                        </div>
                      ))}

                      {/* 농기계 이미지 */}
                      {farmer.equipments?.map((equipment, eqIndex) => (
                        <React.Fragment key={`eq-${eqIndex}`}>
                          {equipment.images?.map((image, imgIndex) => (
                            <div 
                              key={`eq-${eqIndex}-${imgIndex}`} 
                              className="farmer-image aspect-[4/3] relative group cursor-pointer"
                              onClick={() => handleImageClick(
                                image.toString(),
                                `${getKoreanManufacturer(equipment.manufacturer)} ${equipment.model} ${getKoreanEquipmentType(equipment.type)}`
                              )}
                            >
                              {imageURLs[image.toString()] ? (
                                <Image
                                  src={imageURLs[image.toString()]}
                                  alt={`${getKoreanEquipmentType(equipment.type)} 이미지 ${imgIndex + 1}`}
                                  width={400}
                                  height={300}
                                  className="rounded-lg object-cover w-full h-full"
                                  unoptimized={true}
                                  priority={true}
                                  loading="eager"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                                  <span className="text-gray-400">이미지 로딩중...</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity" />
                              <p className="text-sm text-gray-600 mt-1">
                                {getKoreanManufacturer(equipment.manufacturer)} {equipment.model} {getKoreanEquipmentType(equipment.type)}
                              </p>
                            </div>
                          ))}

                          {/* 부착장비 이미지 */}
                          {equipment.attachments?.map((attachment, attIndex) =>
                            attachment.images?.map((image, imgIndex) => (
                              <div 
                                key={`att-${eqIndex}-${attIndex}-${imgIndex}`} 
                                className="farmer-image aspect-[4/3] relative group cursor-pointer"
                                onClick={() => handleImageClick(
                                  image.toString(),
                                  `${getKoreanEquipmentType(equipment.type)}의 ${
                                    attachment.type === 'loader' ? '로더' :
                                    attachment.type === 'rotary' ? '로터리' :
                                    attachment.type === 'frontWheel' ? '전륜' :
                                    attachment.type === 'rearWheel' ? '후륜' : 
                                    attachment.type
                                  }`
                                )}
                              >
                                {imageURLs[image.toString()] ? (
                                  <Image
                                    src={imageURLs[image.toString()]}
                                    alt={`${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 이미지 ${imgIndex + 1}`}
                                    width={400}
                                    height={300}
                                    className="rounded-lg object-cover w-full h-full"
                                    unoptimized={true}
                                    priority={true}
                                    loading="eager"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                                    <span className="text-gray-400">이미지 로딩중...</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity" />
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
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* 이미지 다운로드 모달 */}
      {selectedImage && (
        <ImageDownloadModal
          isOpen={downloadModalOpen}
          onClose={() => setDownloadModalOpen(false)}
          imageUrl={selectedImage}
          title={selectedImageTitle}
        />
      )}
    </>
  );
} 
