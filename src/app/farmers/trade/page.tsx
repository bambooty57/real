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

  // 제조사 매핑 수정
  const manufacturerMap = {
    'daedong': '대동',
    'kukje': '국제',
    'ls': 'LS',
    'dongyang': '동양',
    'asia': '아세아',
    'yanmar': '얀마',
    'iseki': '이세키',
    'john_deere': '존디어',
    'kubota': '구보다',
    'fendt': '펜트',
    'case': '케이스',
    'new_holland': '뉴홀랜드',
    'mf': 'MF',
    'kumsung': '금성',
    'fiat': '피아트',
    'hyundai': '현대',
    'doosan': '두산',
    'volvo': '볼보',
    'samsung': '삼성',
    'daewoo': '대우',
    'hitachi': '히타치',
    'claas': '클라스'
  };

  // 제조사 한글명 변환 함수
  const getKoreanManufacturer = (manufacturer: string): string => {
    return manufacturerMap[manufacturer] || manufacturer;
  };

  // 영문 코드로 변환하는 함수
  const getEquipmentTypeCode = (koreanType: string): string => {
    return Object.entries(equipmentTypeMap).find(([code, korean]) => korean === koreanType)?.[0] || '';
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
      { header: '주소', key: 'address', width: 30 }
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
        address: farmer.address || ''
      });
    });

    // 엑셀 파일 생성 및 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, '농기계_거래_목록.xlsx');
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
        <h2 className="text-lg font-semibold mb-4">검색 필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block mb-2">거래 유형</label>
            <select
              value={filters.tradeType}
              onChange={(e) => setFilters({...filters, tradeType: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="all">전체</option>
              <option value="sale">판매</option>
              <option value="purchase">구매</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">거래 상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="all">전체</option>
              <option value="가능">가능</option>
              <option value="계약중">계약중</option>
              <option value="완료">완료</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">농기계 종류</label>
            <select
              value={filters.equipmentType}
              onChange={(e) => setFilters({...filters, equipmentType: e.target.value})}
              className="w-full p-2 border rounded"
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
          </div>

          <div>
            <label className="block mb-2">제조사</label>
            <select
              value={filters.manufacturer}
              onChange={(e) => setFilters({...filters, manufacturer: e.target.value})}
              className="w-full p-2 border rounded"
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
                  <p>
                    <span className="font-medium">상태:</span> {equipment.rating}점
                  </p>
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