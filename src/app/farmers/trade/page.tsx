'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { Equipment as BaseEquipment } from '@/types/farmer'
import { MANUFACTURERS } from '@/constants/manufacturers'

interface Equipment extends BaseEquipment {
  tradeStatus?: string;
}

interface Farmer {
  id: string;
  name: string;
  phone: string;
  address: string;
  equipments: Equipment[];
}

interface AttachmentInfo {
  manufacturer: string;
  model: string;
  condition: number;
  memo: string;
  images: string[];
}

function isAttachmentInfo(value: any): value is AttachmentInfo {
  return value !== null && 
         typeof value === 'object' && 
         typeof value.manufacturer === 'string' &&
         typeof value.model === 'string' &&
         typeof value.condition === 'number' &&
         typeof value.memo === 'string' &&
         Array.isArray(value.images);
}

export default function TradePage() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    tradeType: 'all', // 'all', 'sale', 'purchase'
    status: 'all', // 'all', '가능', '계약중', '완료'
    equipmentType: '',
    manufacturer: '',
    saleType: 'all' // 'all', 'new', 'used'
  })

  // 농기계 종류 매핑
  const equipmentTypeMap = {
    'tractor': '트랙터',
    'combine': '콤바인',
    'rice_transplanter': '이앙기',
    'forklift': '지게차',
    'excavator': '굴삭기',
    'skid_loader': '스키로더',
    'dryer': '건조기',
    'silo': '싸일론',
    'claas': '클라스',
    'drone': '드론'
  };

  // 제조사 매핑
  const manufacturerMap: { [key: string]: string } = {
    daedong: '대동',
    kukje: '국제',
    ls: '엘에스',
    dongyang: '동양',
    asia: '아시아',
    yanmar: '얀마',
    iseki: '이세키',
    john_deere: '존디어',
    kubota: '구보다',
    fendt: '펜트',
    case: '케이스',
    new_holland: '뉴홀랜드',
    mf: '엠에프',
    deutz: '도이츠',
    same: '세임',
    landini: '란디니',
    valtra: '발트라',
    zetor: '제토',
    kioti: '키오티',
    tong_yang: '동양',
    claas: '클라스'
  };

  // 제조사 한글명 변환 함수
  const getKoreanManufacturer = (manufacturer: string): string => {
    return manufacturerMap[manufacturer] || manufacturer;
  };

  // 영문 코드로 변환하는 함수
  const getEquipmentTypeCode = (koreanType: string): string => {
    return Object.entries(equipmentTypeMap).find(([code, korean]) => korean === koreanType)?.[0] || '';
  };

  // 작업기 한글명 매핑 추가
  const attachmentDisplayNames: { [key: string]: string } = {
    loader: '로더',
    rotary: '로터리',
    frontWheel: '전륜',
    rearWheel: '후륜'
  };

  // 부착작업기 정보 가져오는 함수 추가
  const getAttachmentInfo = (equipment: Equipment) => {
    if (!equipment || !Array.isArray(equipment.attachments)) {
      return {
        loader: null,
        rotary: null,
        frontWheel: null,
        rearWheel: null
      };
    }

    const attachments = equipment.attachments;
    const loader = attachments.find(a => a && a.type === 'loader');
    const rotary = attachments.find(a => a && a.type === 'rotary');
    const frontWheel = attachments.find(a => a && a.type === 'frontWheel');
    const rearWheel = attachments.find(a => a && a.type === 'rearWheel');

    return {
      loader: loader ? {
        manufacturer: loader.manufacturer,
        model: loader.model,
        condition: loader.condition || 0,
        memo: loader.memo || '',
        images: Array.isArray(loader.images) ? loader.images.filter((img): img is string => typeof img === 'string') : []
      } : null,
      rotary: rotary ? {
        manufacturer: rotary.manufacturer,
        model: rotary.model,
        condition: rotary.condition || 0,
        memo: rotary.memo || '',
        images: Array.isArray(rotary.images) ? rotary.images.filter((img): img is string => typeof img === 'string') : []
      } : null,
      frontWheel: frontWheel ? {
        manufacturer: frontWheel.manufacturer,
        model: frontWheel.model,
        condition: frontWheel.condition || 0,
        memo: frontWheel.memo || '',
        images: Array.isArray(frontWheel.images) ? frontWheel.images.filter((img): img is string => typeof img === 'string') : []
      } : null,
      rearWheel: rearWheel ? {
        manufacturer: rearWheel.manufacturer,
        model: rearWheel.model,
        condition: rearWheel.condition || 0,
        memo: rearWheel.memo || '',
        images: Array.isArray(rearWheel.images) ? rearWheel.images.filter((img): img is string => typeof img === 'string') : []
      } : null
    };
  };

  useEffect(() => {
    fetchFarmers()
  }, [])

  const fetchFarmers = async () => {
    try {
      const farmersRef = collection(db, 'farmers')
      const querySnapshot = await getDocs(farmersRef)
      
      const manufacturers = new Set();
      
      const farmersData = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('Farmer raw data:', data); // 원본 데이터 로깅
          
          const farmer = {
            id: doc.id,
            name: data.name || '',
            phone: data.phone || '',
            address: data.jibunAddress || '', // jibunAddress 필드로 수정
            equipments: data.equipments || []
          } as Farmer;
          
          console.log('Processed farmer:', farmer); // 가공된 데이터 로깅
          
          farmer.equipments?.forEach(eq => {
            if (eq.manufacturer) {
              manufacturers.add(eq.manufacturer);
            }
          });
          return farmer;
        })
        .filter(farmer => farmer.equipments?.some(eq => eq.tradeType === 'sale' || eq.tradeType === 'purchase'))
      
      console.log('\n=== 농민 데이터 ===\n', farmersData);
      setFarmers(farmersData)
    } catch (error) {
      console.error('Error fetching farmers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEquipments = () => {
    const result: Array<{ farmer: Farmer; equipment: Equipment }> = [];
    
    if (!Array.isArray(farmers)) return result;
    
    farmers.forEach(farmer => {
      if (!farmer || !Array.isArray(farmer.equipments)) return;
      
      farmer.equipments.forEach(equipment => {
        if (!equipment) return;
        
        // 거래 유형 필터
        if (filters.tradeType === 'sale') {
          if (equipment.tradeType !== 'sale') return;
        } else if (filters.tradeType === 'purchase') {
          if (equipment.tradeType !== 'purchase') return;
        } else if (filters.tradeType === 'all') {
          if (!equipment.tradeType) return;
        }

        // 거래 상태 필터
        if (filters.status !== 'all') {
          const status = equipment.saleStatus || 'available';
          if (status !== filters.status) {
            return;
          }
        }

        // 농기계 종류 필터
        if (filters.equipmentType) {
          const equipmentTypeCode = getEquipmentTypeCode(filters.equipmentType);
          if (equipment.type !== equipmentTypeCode) return;
        }

        // 제조사 필터
        if (filters.manufacturer) {
          if (!equipment.manufacturer || 
              equipment.manufacturer.toLowerCase() !== filters.manufacturer.toLowerCase()) return;
        }

        result.push({ farmer, equipment });
      });
    });

    return result;
  };

  const filteredEquipments = filterEquipments();

  const getAttachmentText = (attachments: Array<{
    type: 'loader' | 'rotary' | 'frontWheel' | 'rearWheel';
    manufacturer: string;
    model: string;
    condition?: number;
    memo?: string;
    images?: (string | File | null)[];
  }> | undefined) => {
    if (!attachments) return '';
    
    const texts = [];
    const loader = attachments.find(a => a.type === 'loader');
    const rotary = attachments.find(a => a.type === 'rotary');
    const frontWheel = attachments.find(a => a.type === 'frontWheel');
    const rearWheel = attachments.find(a => a.type === 'rearWheel');

    if (loader) {
      texts.push(`로더: ${loader.manufacturer} ${loader.model}`);
    }
    if (rotary) {
      texts.push(`로터리: ${rotary.manufacturer} ${rotary.model}`);
    }
    if (frontWheel) {
      texts.push(`전륜: ${frontWheel.manufacturer} ${frontWheel.model}`);
    }
    if (rearWheel) {
      texts.push(`후륜: ${rearWheel.manufacturer} ${rearWheel.model}`);
    }
    return texts.join(', ');
  };

  const generateExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('농기계 매매');

    worksheet.columns = [
      { header: '이름', key: 'name', width: 10 },
      { header: '연락처', key: 'phone', width: 15 },
      { header: '주소', key: 'address', width: 30 },
      { header: '기종', key: 'type', width: 10 },
      { header: '제조사', key: 'manufacturer', width: 10 },
      { header: '모델명', key: 'model', width: 15 },
      { header: '마력', key: 'horsepower', width: 10 },
      { header: '연식', key: 'year', width: 10 },
      { header: '사용시간', key: 'usageHours', width: 10 },
      { header: '부착물', key: 'attachments', width: 30 },
      { header: '매매유형', key: 'tradeType', width: 10 },
      { header: '희망가격', key: 'desiredPrice', width: 15 },
      { header: '상태', key: 'tradeStatus', width: 10 },
    ];

    farmers.forEach((farmer) => {
      farmer.equipments.forEach((eq) => {
        worksheet.addRow({
          name: farmer.name,
          phone: farmer.phone,
          address: farmer.address,
          type: eq.type,
          manufacturer: eq.manufacturer,
          model: eq.model,
          horsepower: eq.horsepower,
          year: eq.year,
          usageHours: eq.usageHours,
          attachments: getAttachmentText(eq.attachments),
          tradeType: eq.tradeType,
          desiredPrice: eq.desiredPrice,
          tradeStatus: eq.tradeStatus,
        });
      });
    });

    // 엑셀 파일 생성 및 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, '농기계_거래_목록.xlsx');
  };

  // 별점 표시 함수 추가
  const getRatingStars = (rating: number | undefined) => {
    const numRating = rating || 0;
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${star <= numRating ? 'text-yellow-400' : 'text-gray-300'}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({numRating}점)</span>
      </div>
    );
  };

  if (loading) return <div className="p-8">로딩중...</div>

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">농기계 거래 관리</h1>
        <button
          onClick={generateExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          엑셀 다운로드
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">검색 필터</h2>
          <button
            onClick={() => setFilters({
              tradeType: 'all',
              status: 'all',
              equipmentType: '',
              manufacturer: '',
              saleType: 'all'
            })}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            필터 초기화
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">거래 유형</label>
            <div className="relative">
              <select
                value={filters.tradeType}
                onChange={(e) => setFilters({...filters, tradeType: e.target.value})}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">전체</option>
                <option value="sale">판매</option>
                <option value="purchase">구매</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">거래 상태</label>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">전체</option>
                <option value="available">거래가능</option>
                <option value="reserved">예약중</option>
                <option value="completed">거래완료</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">농기계 종류</label>
            <div className="relative">
              <select
                value={filters.equipmentType}
                onChange={(e) => setFilters({...filters, equipmentType: e.target.value})}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">전체</option>
                <option value="트랙터">트랙터</option>
                <option value="콤바인">콤바인</option>
                <option value="이앙기">이앙기</option>
                <option value="지게차">지게차</option>
                <option value="굴삭기">굴삭기</option>
                <option value="스키로더">스키로더</option>
                <option value="건조기">건조기</option>
                <option value="싸일론">싸일론</option>
                <option value="클라스">클라스</option>
                <option value="드론">드론</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">제조사</label>
            <div className="relative">
              <select
                value={filters.manufacturer}
                onChange={(e) => setFilters({...filters, manufacturer: e.target.value})}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">전체</option>
                {MANUFACTURERS.MAIN.map(({ value, label }) => (
                  <option key={value} value={value.toLowerCase()}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 결과 목록 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">검색 결과 ({filteredEquipments.length}건)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(filteredEquipments) && filteredEquipments.map(({ farmer, equipment }, index) => {
            if (!farmer || !equipment) return null;
            
            const equipmentType = Object.entries(equipmentTypeMap).find(([code, _]) => code === equipment.type)?.[1] || equipment.type;
            const manufacturer = getKoreanManufacturer(equipment.manufacturer || '');
            
            return (
              <div key={`${farmer.id}-${index}`} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{equipmentType}</h3>
                    <p className="text-sm text-gray-600">{manufacturer && `${manufacturer} ${equipment.model}`}</p>
                  </div>
                  <div className="flex gap-1">
                    {equipment.tradeType === 'sale' && (
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        판매
                      </span>
                    )}
                    {equipment.tradeType === 'purchase' && (
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        구매
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">농민:</span> {farmer.name}
                  </p>
                  <p>
                    <span className="font-medium">연락처:</span> {farmer.phone}
                  </p>
                  <p>
                    <span className="font-medium">주소:</span> {farmer.address || '주소 없음'}
                  </p>
                  <p>
                    <span className="font-medium">연식:</span> {equipment.year}
                  </p>
                  <p>
                    <span className="font-medium">사용시간:</span> {equipment.usageHours}시간
                  </p>
                  <div>
                    <span className="font-medium">상태:</span> {getRatingStars(equipment.condition)}
                  </div>
                  {equipment.tradeType === 'sale' && (
                    <>
                      <p>
                        <span className="font-medium">판매가:</span> {Number(equipment.desiredPrice || 0).toLocaleString()}만원
                      </p>
                      <p>
                        <span className="font-medium">진행상태:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${
                          equipment.saleStatus === 'available' ? 'bg-green-100 text-green-800' :
                          equipment.saleStatus === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                          equipment.saleStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {equipment.saleStatus === 'available' ? '거래가능' :
                           equipment.saleStatus === 'reserved' ? '예약중' :
                           equipment.saleStatus === 'completed' ? '거래완료' :
                           '거래가능'}
                        </span>
                      </p>
                    </>
                  )}
                  {equipment.tradeType === 'purchase' && (
                    <>
                      <p>
                        <span className="font-medium">구매희망가:</span> {Number(equipment.desiredPrice || 0).toLocaleString()}만원
                      </p>
                      <p>
                        <span className="font-medium">진행상태:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${
                          equipment.saleStatus === 'available' ? 'bg-green-100 text-green-800' :
                          equipment.saleStatus === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                          equipment.saleStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {equipment.saleStatus === 'available' ? '거래가능' :
                           equipment.saleStatus === 'reserved' ? '예약중' :
                           equipment.saleStatus === 'completed' ? '거래완료' :
                           '거래가능'}
                        </span>
                      </p>
                    </>
                  )}
                  
                  {/* 부착작업기 정보 */}
                  {Object.values(getAttachmentInfo(equipment)).some(v => v !== null) && (
                    <div className="mt-3 border-t pt-3">
                      <p className="font-medium mb-2">부착작업기</p>
                      <div className="space-y-2">
                        {Object.entries(getAttachmentInfo(equipment))
                          .filter(([_, value]) => isAttachmentInfo(value))
                          .map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-2 rounded">
                              <p className="font-medium text-gray-700">{
                                key === 'loader' ? '로더' :
                                key === 'rotary' ? '로터리' :
                                key === 'frontWheel' ? '전륜' :
                                key === 'rearWheel' ? '후륜' : key
                              }</p>
                              <div className="ml-2">
                                <p>제조사: {getKoreanManufacturer(value?.manufacturer ?? '')}</p>
                                {value?.model && <p>모델: {value.model ?? ''}</p>}
                                <div>
                                  <span className="font-medium">상태: </span>
                                  {getRatingStars(value?.condition ?? 0)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    href={`/farmers/${farmer.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    상세보기 →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
