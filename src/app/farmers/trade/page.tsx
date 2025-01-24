'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface Equipment {
  type: string
  manufacturer: string
  model: string
  year: string
  usageHours: string
  rating: string
  forSale?: boolean
  forPurchase?: boolean
  desiredPrice?: string
  purchasePrice?: string
  saleStatus?: string
  purchaseStatus?: string
  saleDate?: string
  purchaseDate?: string
  saleType?: string
  tradeType?: string
  tradeStatus?: string
  attachments?: {
    loader?: string
    loaderModel?: string
    loaderRating?: string
    rotary?: string
    rotaryModel?: string
    rotaryRating?: string
    frontWheel?: string
    frontWheelModel?: string
    frontWheelRating?: string
    rearWheel?: string
    rearWheelModel?: string
    rearWheelRating?: string
  }
}

interface Farmer {
  id: string
  name: string
  phone: string
  address: string
  equipments: Equipment[]
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
    const attachments = equipment.attachments || {};
    const result = [];

    // 로더
    if (attachments.loader) {
      result.push({
        name: '로더',
        manufacturer: attachments.loader,
        model: attachments.loaderModel,
        rating: attachments.loaderRating
      });
    }

    // 로터리
    if (attachments.rotary) {
      result.push({
        name: '로터리',
        manufacturer: attachments.rotary,
        model: attachments.rotaryModel,
        rating: attachments.rotaryRating
      });
    }

    // 전륜
    if (attachments.frontWheel) {
      result.push({
        name: '전륜',
        manufacturer: attachments.frontWheel,
        model: attachments.frontWheelModel,
        rating: attachments.frontWheelRating
      });
    }

    // 후륜
    if (attachments.rearWheel) {
      result.push({
        name: '후륜',
        manufacturer: attachments.rearWheel,
        model: attachments.rearWheelModel,
        rating: attachments.rearWheelRating
      });
    }

    return result;
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
    
    farmers.forEach(farmer => {
      farmer.equipments?.forEach(equipment => {
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
          if (!equipment.tradeStatus || equipment.tradeStatus !== filters.status) return;
        }

        // 농기계 종류 필터
        if (filters.equipmentType) {
          const equipmentTypeCode = getEquipmentTypeCode(filters.equipmentType);
          if (equipment.type !== equipmentTypeCode) return;
        }

        // 제조사 필터
        if (filters.manufacturer) {
          if (equipment.manufacturer !== filters.manufacturer) return;
        }

        result.push({ farmer, equipment });
      });
    });

    return result;
  };

  const filteredEquipments = filterEquipments();

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('농기계 거래 목록');

    // 헤더 설정
    worksheet.columns = [
      { header: '거래유형', key: 'tradeType', width: 10 },
      { header: '농기계종류', key: 'equipmentType', width: 15 },
      { header: '제조사', key: 'manufacturer', width: 15 },
      { header: '모델명', key: 'model', width: 20 },
      { header: '연식', key: 'year', width: 10 },
      { header: '사용시간', key: 'usageHours', width: 12 },
      { header: '상태', key: 'rating', width: 10 },
      { header: '가격', key: 'price', width: 15 },
      { header: '진행상태', key: 'tradeStatus', width: 12 },
      { header: '농민', key: 'farmerName', width: 15 },
      { header: '연락처', key: 'phone', width: 15 },
      { header: '주소', key: 'address', width: 30 },
      // 부착작업기 컬럼 추가
      { header: '로더', key: 'loader', width: 30 },
      { header: '로터리', key: 'rotary', width: 30 },
      { header: '전륜', key: 'frontWheel', width: 30 },
      { header: '후륜', key: 'rearWheel', width: 30 }
    ];

    // 스타일 설정
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 데이터 추가
    filteredEquipments.forEach(({ farmer, equipment }) => {
      const tradeTypeText = equipment.tradeType === 'sale' ? '판매' : '구매';
      const equipmentTypeText = Object.entries(equipmentTypeMap).find(([code, _]) => code === equipment.type)?.[1] || equipment.type;
      const manufacturerText = getKoreanManufacturer(equipment.manufacturer || '');
      const price = equipment.tradeType === 'sale' 
        ? Number(equipment.desiredPrice || 0).toLocaleString() + '만원'
        : Number(equipment.purchasePrice || 0).toLocaleString() + '만원';

      // 부착작업기 정보 가져오기
      const attachments = equipment.attachments || {};
      const getAttachmentText = (type: string, manufacturer?: string, model?: string, rating?: string) => {
        if (!manufacturer) return '';
        const mfg = manufacturerMap[manufacturer] || manufacturer;
        return `${mfg}${model ? ` ${model}` : ''}${rating ? ` (${rating}점)` : ''}`;
      };

      worksheet.addRow({
        tradeType: tradeTypeText,
        equipmentType: equipmentTypeText,
        manufacturer: manufacturerText,
        model: equipment.model,
        year: equipment.year,
        usageHours: equipment.usageHours + '시간',
        rating: equipment.rating + '점',
        price: price,
        tradeStatus: equipment.tradeStatus || '상담 전',
        farmerName: farmer.name,
        phone: farmer.phone,
        address: farmer.address || '',
        // 부착작업기 정보 추가
        loader: getAttachmentText('loader', attachments.loader, attachments.loaderModel, attachments.loaderRating),
        rotary: getAttachmentText('rotary', attachments.rotary, attachments.rotaryModel, attachments.rotaryRating),
        frontWheel: getAttachmentText('frontWheel', attachments.frontWheel, attachments.frontWheelModel, attachments.frontWheelRating),
        rearWheel: getAttachmentText('rearWheel', attachments.rearWheel, attachments.rearWheelModel, attachments.rearWheelRating)
      });
    });

    // 엑셀 파일 생성 및 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, '농기계_거래_목록.xlsx');
  };

  // 별점 표시 함수 추가
  const getRatingStars = (rating: string) => {
    const numRating = parseInt(rating);
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${star <= numRating ? 'text-yellow-400' : 'text-gray-300'}`}
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

  if (loading) return <div className="p-8">로딩중...</div>

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">농기계 거래 관리</h1>
        <button
          onClick={exportToExcel}
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
                <option value="가능">가능</option>
                <option value="계약중">계약중</option>
                <option value="완료">완료</option>
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
                <option value="daedong">대동</option>
                <option value="kukje">국제</option>
                <option value="ls">LS</option>
                <option value="dongyang">동양</option>
                <option value="asia">아세아</option>
                <option value="yanmar">얀마</option>
                <option value="iseki">이세키</option>
                <option value="john_deere">존디어</option>
                <option value="kubota">구보다</option>
                <option value="fendt">펜트</option>
                <option value="case">케이스</option>
                <option value="new_holland">뉴홀랜드</option>
                <option value="mf">MF</option>
                <option value="kumsung">금성</option>
                <option value="fiat">피아트</option>
                <option value="hyundai">현대</option>
                <option value="doosan">두산</option>
                <option value="volvo">볼보</option>
                <option value="samsung">삼성</option>
                <option value="daewoo">대우</option>
                <option value="hitachi">히타치</option>
                <option value="claas">클라스</option>
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
          {filteredEquipments.map(({ farmer, equipment }, index) => {
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
                    <span className="font-medium">상태:</span> {getRatingStars(equipment.rating || '0')}
                  </div>
                  {equipment.tradeType === 'sale' && (
                    <>
                      <p>
                        <span className="font-medium">판매가:</span> {Number(equipment.desiredPrice || 0).toLocaleString()}만원
                      </p>
                      <p>
                        <span className="font-medium">진행상태:</span> {equipment.tradeStatus || '상담 전'}
                      </p>
                    </>
                  )}
                  {equipment.tradeType === 'purchase' && (
                    <>
                      <p>
                        <span className="font-medium">구매희망가:</span> {Number(equipment.purchasePrice || 0).toLocaleString()}만원
                      </p>
                      <p>
                        <span className="font-medium">진행상태:</span> {equipment.tradeStatus || '상담 전'}
                      </p>
                    </>
                  )}
                  
                  {/* 부착작업기 정보 */}
                  {getAttachmentInfo(equipment).length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="font-medium mb-2">부착작업기</p>
                      <div className="space-y-2">
                        {getAttachmentInfo(equipment).map((attachment, idx) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded">
                            <p className="font-medium text-gray-700">{attachment.name}</p>
                            <div className="ml-2">
                              <p>제조사: {manufacturerMap[attachment.manufacturer] || attachment.manufacturer}</p>
                              {attachment.model && <p>모델: {attachment.model}</p>}
                              {attachment.rating && (
                                <div className="flex items-center">
                                  <span>상태: </span>
                                  {getRatingStars(attachment.rating)}
                                </div>
                              )}
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