import { Farmer, MainCrop } from '@/types/farmer';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
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
  handleImageDownload: (imageUrl: string, fileName: string) => Promise<void>;
}

const ImageDownloadModal = ({ isOpen, onClose, imageUrl, title, handleImageDownload }: ImageDownloadModalProps) => {
  const [downloadURL, setDownloadURL] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

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
      setIsDownloading(true);
      if (!downloadURL) {
        const imageRef = ref(storage, imageUrl);
        const url = await getDownloadURL(imageRef);
        await handleImageDownload(url, title);
      } else {
        await handleImageDownload(downloadURL, title);
      }
      onClose();
    } catch (error) {
      console.error('이미지 다운로드 중 오류 발생:', error);
      alert('이미지 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
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
                <NextImage
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
                disabled={isDownloading}
                className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                  isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FaDownload className="w-4 h-4" />
                <span>{isDownloading ? '다운로드 중...' : '다운로드'}</span>
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
  const [selectedImages, setSelectedImages] = useState<{ url: string; title: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [imageURLs, setImageURLs] = useState<{ [key: string]: string }>({});
  const [base64Images, setBase64Images] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  // 이미지 프리로딩 함수
  const preloadImage = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  };

  // Base64로 이미지 변환
  const convertToBase64 = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        try {
          const base64 = canvas.toDataURL('image/jpeg', 0.95);
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = url;
    });
  };

  useEffect(() => {
    const loadImages = async () => {
      if (!farmer) return;
      setIsLoading(true);

      try {
        const urls: { [key: string]: string } = {};
        const base64s: { [key: string]: string } = {};
        const loadPromises: Promise<void>[] = [];

        // 이미지 URL과 Base64 데이터 로딩 함수
        const loadImageData = async (image: string) => {
          try {
            const imageRef = ref(storage, image.toString());
            const url = await getDownloadURL(imageRef);
            urls[image.toString()] = url;
            
            // 이미지 프리로딩 및 Base64 변환
            await preloadImage(url);
            const base64 = await convertToBase64(url);
            base64s[url] = base64;
          } catch (error) {
            console.error('이미지 로딩 실패:', error);
          }
        };

        // 농민 이미지 로딩
        if (farmer.farmerImages) {
          farmer.farmerImages.forEach(image => {
            loadPromises.push(loadImageData(image.toString()));
          });
        }

        // 장비 이미지 로딩
        if (farmer.equipments) {
          farmer.equipments.forEach(equipment => {
            if (equipment.images) {
              equipment.images.forEach(image => {
                loadPromises.push(loadImageData(image.toString()));
              });
            }

            // 부착장비 이미지 로딩
            if (equipment.attachments) {
              equipment.attachments.forEach(attachment => {
                if (attachment.images) {
                  attachment.images.forEach(image => {
                    loadPromises.push(loadImageData(image.toString()));
                  });
                }
              });
            }
          });
        }

        // 모든 이미지 로딩 완료 대기
        await Promise.all(loadPromises);
        
        setImageURLs(urls);
        setBase64Images(base64s);
      } catch (error) {
        console.error('이미지 로딩 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
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
          logging: false,
          imageTimeout: 15000,
          onclone: function(clonedDoc: Document) {
            const images = clonedDoc.getElementsByTagName('img');
            for (let i = 0; i < images.length; i++) {
              const img = images[i];
              const src = img.getAttribute('src');
              if (src && base64Images[src]) {
                img.src = base64Images[src];
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.removeAttribute('crossorigin');
              }
            }

            // PDF 출력 시 줄 간격 조정을 위한 스타일 추가
            const style = clonedDoc.createElement('style');
            style.textContent = `
              @media print {
                dl.space-y-2 { margin: 1.5rem 0 !important; }
                dt { margin-top: 1rem !important; }
                dd { margin-bottom: 1rem !important; line-height: 1.8 !important; }
                .grid { row-gap: 1.5rem !important; }
                .space-y-4 > * { margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
                .space-y-6 > * { margin-top: 2rem !important; margin-bottom: 2rem !important; }
                h2 { margin-top: 2rem !important; margin-bottom: 1.5rem !important; }
                .print-spacing > * { margin-top: 1rem !important; margin-bottom: 1rem !important; }
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['css', 'legacy'],
          before: '.page-break'
        }
      };

      await html2pdf().set(opt).from(element).save();

    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      alert('PDF 생성에 실패했습니다. 이미지 로딩이 완료된 후 다시 시도해주세요.');
    }
  };

  // 이미지를 JPG로 변환하는 함수
  const convertToJPG = async (url: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Blob conversion failed'));
            }
          },
          'image/jpeg',
          0.95
        );
      };
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = url;
    });
  };

  // 이미지 다운로드 핸들러
  const handleImageDownload = async (imageUrl: string, fileName: string) => {
    try {
      const url = imageURLs[imageUrl] || imageUrl;
      const jpgBlob = await convertToJPG(url);
      const downloadUrl = URL.createObjectURL(jpgBlob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${fileName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      // 다운로드 완료 후 상태 초기화
      setDownloadModalOpen(false);
      setSelectedImage(null);
      setSelectedImageTitle('');
    } catch (error) {
      console.error('이미지 다운로드 중 오류 발생:', error);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  // 이미지 클릭 핸들러 수정
  const handleImageClick = (imageUrl: string, title: string) => {
    const width = 800;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // 팝업 창 열기
    const popup = window.open('', '_blank', 
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    if (popup) {
      popup.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                background: #f3f4f6;
                font-family: Arial, sans-serif;
              }
              .image-container {
                max-width: 100%;
                margin-bottom: 20px;
                background: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              img {
                max-width: 100%;
                height: auto;
                border-radius: 4px;
              }
              .download-button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 16px;
              }
              .download-button:hover {
                background: #2563eb;
              }
              .download-button:disabled {
                background: #93c5fd;
                cursor: not-allowed;
              }
            </style>
          </head>
          <body>
            <div class="image-container">
              <img src="${imageURLs[imageUrl] || imageUrl}" alt="${title}" />
            </div>
            <button 
              class="download-button" 
              onclick="window.opener.postMessage({ type: 'downloadImage', imageUrl: '${imageUrl}', title: '${title}' }, '*')"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12l-4-4h2.5V3h3v5H12L8 12z"/>
                <path d="M14 13v1H2v-1h12z"/>
              </svg>
              다운로드
            </button>
          </body>
        </html>
      `);
      popup.document.close();
    }
  };

  // 팝업 창에서의 메시지 수신 처리
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'downloadImage') {
        const { imageUrl, title } = event.data;
        try {
          const url = imageURLs[imageUrl] || imageUrl;
          await handleImageDownload(url, title);
        } catch (error) {
          console.error('이미지 다운로드 중 오류 발생:', error);
          alert('이미지 다운로드에 실패했습니다.');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [imageURLs, handleImageDownload]);

  // 이미지 선택 핸들러 추가
  const handleImageSelect = (imageUrl: string, title: string) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.url === imageUrl);
      if (isSelected) {
        return prev.filter(img => img.url !== imageUrl);
      } else {
        return [...prev, { url: imageUrl, title }];
      }
    });
  };

  // 선택된 이미지 일괄 다운로드
  const handleBulkDownload = async () => {
    try {
      for (const image of selectedImages) {
        const url = imageURLs[image.url] || image.url;
        const jpgBlob = await convertToJPG(url);
        const downloadUrl = URL.createObjectURL(jpgBlob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${image.title}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 즉시 URL 객체 해제
        URL.revokeObjectURL(downloadUrl);
        
        // 다운로드 간 약간의 딜레이를 줘서 브라우저 부하 방지
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 다운로드 완료 후 상태 초기화
      setSelectedImages([]);
      setDownloadModalOpen(false);
      setSelectedImage(null);
      setSelectedImageTitle('');
    } catch (error) {
      console.error('이미지 다운로드 중 오류 발생:', error);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  const handleEdit = async () => {
    router.push(`/farmers/new?id=${farmer.id}`);
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
                    <dl className="grid grid-cols-1 gap-4">
                      <div>
                        <dt className="text-gray-600">이름</dt>
                        <dd className="font-medium">{farmer.name}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">전화번호</dt>
                        <dd className="font-medium">{formatPhoneNumber(farmer.phone)}</dd>
                      </div>
                      {farmer.roadAddress && (
                        <div>
                          <dt className="text-gray-600">도로명주소</dt>
                          <dd className="font-medium">
                            <a
                              href={`https://map.kakao.com/link/search/${encodeURIComponent(farmer.roadAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {farmer.roadAddress}
                            </a>
                          </dd>
                        </div>
                      )}
                      {farmer.jibunAddress && (
                        <div>
                          <dt className="text-gray-600">지번주소</dt>
                          <dd className="font-medium">
                            <a
                              href={`https://map.kakao.com/link/search/${encodeURIComponent(farmer.jibunAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              [지번] {farmer.jibunAddress}
                            </a>
                          </dd>
                        </div>
                      )}
                      {farmer.addressDetail && (
                        <div>
                          <dt className="text-gray-600">상세주소</dt>
                          <dd className="font-medium">{farmer.addressDetail}</dd>
                        </div>
                      )}
                      {farmer.zipCode && (
                        <div>
                          <dt className="text-gray-600">우편번호</dt>
                          <dd className="font-medium">{farmer.zipCode}</dd>
                        </div>
                      )}
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
                      {selectedImages.length > 0 && (
                        <button
                          onClick={handleBulkDownload}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <FaDownload className="w-4 h-4" />
                          선택한 이미지 다운로드 ({selectedImages.length}개)
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:block print:space-y-4">
                      {/* 농민 이미지 */}
                      {farmer.farmerImages?.map((image, index) => (
                        <div 
                          key={`farmer-${index}`} 
                          className="farmer-image print:mb-4 relative group"
                        >
                          <div className="aspect-[4/3] relative">
                            {imageURLs[image.toString()] ? (
                              <>
                                <div className="absolute top-2 left-2 z-10">
                                  <input
                                    type="checkbox"
                                    checked={selectedImages.some(img => img.url === image.toString())}
                                    onChange={() => handleImageSelect(image.toString(), `농민 이미지 ${index + 1}`)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </div>
                                <img
                                  src={imageURLs[image.toString()]}
                                  alt={`농민 이미지 ${index + 1}`}
                                  className="rounded-lg object-cover w-full h-full hover:opacity-90 transition-opacity cursor-pointer"
                                  onClick={() => handleImageClick(image.toString(), `농민 이미지 ${index + 1}`)}
                                />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                                <span className="text-gray-400">이미지 로딩중...</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">농민 이미지 {index + 1}</p>
                        </div>
                      ))}

                      {/* 농기계 이미지 */}
                      {farmer.equipments?.map((equipment, eqIndex) => (
                        <React.Fragment key={`eq-${eqIndex}`}>
                          {equipment.images?.map((image, imgIndex) => (
                            <div 
                              key={`eq-${eqIndex}-${imgIndex}`} 
                              className="farmer-image print:mb-4 relative group"
                            >
                              <div className="aspect-[4/3] relative">
                                {imageURLs[image.toString()] ? (
                                  <>
                                    <div className="absolute top-2 left-2 z-10">
                                      <input
                                        type="checkbox"
                                        checked={selectedImages.some(img => img.url === image.toString())}
                                        onChange={() => handleImageSelect(
                                          image.toString(),
                                          `${getKoreanEquipmentType(equipment.type)} 이미지 ${imgIndex + 1}`
                                        )}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                    </div>
                                    <img
                                      src={imageURLs[image.toString()]}
                                      alt={`${getKoreanEquipmentType(equipment.type)} 이미지 ${imgIndex + 1}`}
                                      className="rounded-lg object-cover w-full h-full hover:opacity-90 transition-opacity cursor-pointer"
                                      onClick={() => handleImageClick(
                                        image.toString(),
                                        `${getKoreanEquipmentType(equipment.type)} 이미지 ${imgIndex + 1}`
                                      )}
                                    />
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                                    <span className="text-gray-400">이미지 로딩중...</span>
                                  </div>
                                )}
                              </div>
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
                                className="farmer-image print:mb-4 relative group"
                              >
                                <div className="aspect-[4/3] relative">
                                  {imageURLs[image.toString()] ? (
                                    <>
                                      <div className="absolute top-2 left-2 z-10">
                                        <input
                                          type="checkbox"
                                          checked={selectedImages.some(img => img.url === image.toString())}
                                          onChange={() => handleImageSelect(
                                            image.toString(),
                                            `${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 이미지 ${imgIndex + 1}`
                                          )}
                                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                      </div>
                                      <img
                                        src={imageURLs[image.toString()]}
                                        alt={`${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 이미지 ${imgIndex + 1}`}
                                        className="rounded-lg object-cover w-full h-full hover:opacity-90 transition-opacity cursor-pointer"
                                        onClick={() => handleImageClick(
                                          image.toString(),
                                          `${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 이미지 ${imgIndex + 1}`
                                        )}
                                      />
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                                      <span className="text-gray-400">이미지 로딩중...</span>
                                    </div>
                                  )}
                                </div>
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
          handleImageDownload={handleImageDownload}
        />
      )}
    </>
  );
} 
