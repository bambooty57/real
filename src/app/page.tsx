'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { FaFileExcel, FaGoogle } from 'react-icons/fa';
import * as XLSX from 'xlsx-js-style';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { google } from 'googleapis';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface Farmer {
  id: string;
  name: string;
  address: string;
  phone: string;
  ageGroup: string;
  mainCrop: {
    rice: boolean;
    barley: boolean;
    hanwoo: boolean;
    soybean: boolean;
    sweetPotato: boolean;
    persimmon: boolean;
    pear: boolean;
    plum: boolean;
    sorghum: boolean;
    goat: boolean;
    other: boolean;
  };
  equipments: Array<{
    type: string;
    manufacturer: string;
    tradeType?: string;
    saleType?: string;
  }>;
  roadAddress: string;
  jibunAddress: string;
}

const getKoreanEquipmentType = (type: string): string => {
  const types: { [key: string]: string } = {
    'tractor': '트랙터',
    'transplanter': '이앙기',
    'combine': '콤바인',
    'forklift': '지게차',
    'excavator': '굴삭기',
    'skidLoader': '스키로더'
  };
  return types[type] || type;
};

const getMainCropText = (mainCrop: Farmer['mainCrop']) => {
  if (!mainCrop) return '없음';
  
  const selectedCrops = Object.entries(mainCrop)
    .filter(([_, value]) => value)
    .map(([key, _]) => {
      const cropNames = {
        rice: '벼',
        barley: '보리',
        hanwoo: '한우',
        soybean: '콩',
        sweetPotato: '고구마',
        persimmon: '감',
        pear: '배',
        plum: '자두',
        sorghum: '수수',
        goat: '염소',
        other: '기타'
      };
      return cropNames[key];
    });
  
  return selectedCrops.length > 0 ? selectedCrops.join(', ') : '없음';
};

// 드롭다운 옵션 정의
const MAIL_OPTIONS = ['가능', '불가능'] as const;
const FARMING_TYPES = ['논농사', '밭농사', '과수원', '축산업'] as const;
const MAIN_CROPS = ['벼', '보리', '한우', '콩', '고구마', '감', '배', '자두', '수수', '염소', '기타'] as const;
const EQUIPMENT_LIST = [
  '트랙터(대동)',
  '트랙터(국제)',
  '콤바인(국제)',
  '이앙기(대동)',
  '이앙기(국제)',
  '이앙기(구보다)',
  '굴삭기(대동)',
  '굴삭기(국제)',
  '굴삭기(구보다)',
  '스키로더(대동)',
  '스키로더(국제)',
  '스키로더(구보다)'
] as const;

// 전화번호 형식 변환 함수 개선
const formatPhoneNumber = (phone: string): string => {
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 11자리가 아닌 경우 처리
  if (numbers.length !== 11) {
    // 10자리인 경우 (01012345678 -> 010-1234-5678)
    if (numbers.length === 10 && numbers.startsWith('01')) {
      return `010-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    // 8자리인 경우 (12345678 -> 010-1234-5678)
    if (numbers.length === 8) {
      return `010-${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    }
    // 7자리인 경우 (1234567 -> 010-123-4567)
    if (numbers.length === 7) {
      return `010-${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    // 그 외의 경우는 원본 반환
    return phone;
  }
  
  // 11자리인 경우 010-0000-0000 형식으로 변환
  return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
};

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

// 전체 시/군 목록 정의
const CITIES = [
  '강진군', '고흥군', '곡성군', '광양시', '구례군',
  '나주시', '담양군', '목포시', '무안군', '보성군',
  '순천시', '신안군', '여수시', '영광군', '영암군',
  '완도군', '장성군', '장흥군', '진도군', '함평군',
  '해남군', '화순군'
] as const;

// 각 시/군의 읍/면/동 목록 정의
const REGIONS = {
  '강진군': [
    '강진읍', '군동면', '칠량면', '대구면', '도암면', '신전면', 
    '성전면', '작천면', '병영면', '옴천면', '마량면'
  ],
  '고흥군': [
    '고흥읍', '도양읍', '풍양면', '도덕면', '금산면', '도화면', 
    '포두면', '봉래면', '동일면', '점암면', '영남면', '과역면', 
    '남양면', '동강면', '대서면', '두원면'
  ],
  '곡성군': [
    '곡성읍', '오곡면', '삼기면', '석곡면', '목사동면', '죽곡면', 
    '고달면', '옥과면', '입면', '겸면', '오산면'
  ],
  '광양시': [
    '광양읍', '봉강면', '옥룡면', '옥곡면', '진상면', '진월면', 
    '다압면', '골약동', '중마동', '광영동', '태인동', '금호동'
  ],
  '구례군': [
    '구례읍', '문척면', '간전면', '토지면', '마산면', '광의면', 
    '용방면', '산동면'
  ],
  '나주시': [
    '남평읍', '세지면', '왕곡면', '반남면', '공산면', '동강면', 
    '다시면', '문평면', '노안면', '금천면', '산포면', '다도면', 
    '송월동', '영강동', '금남동', '성북동', '영산동'
  ],
  '담양군': [
    '담양읍', '봉산면', '고서면', '남면', '창평면', '대덕면', 
    '무정면', '금성면', '용면', '월산면', '수북면', '대전면'
  ],
  '목포시': [
    '용당1동', '용당2동', '연동', '산정동', '연산동', '원산동', 
    '대성동', '목원동', '동명동', '삼학동', '만호동', '유달동', 
    '죽교동', '북항동', '용해동', '이로동', '상동', '하당동', 
    '신흥동', '삼향동', '옥암동', '부주동'
  ],
  '무안군': [
    '무안읍', '일로읍', '삼향읍', '몽탄면', '청계면', '현경면', 
    '망운면', '해제면', '운남면'
  ],
  '보성군': [
    '보성읍', '벌교읍', '노동면', '미력면', '겸백면', '율어면', 
    '복내면', '문덕면', '조성면', '득량면', '회천면', '웅치면'
  ],
  '순천시': [
    '승주읍', '해룡면', '서면', '황전면', '월등면', '주암면', 
    '송광면', '외서면', '낙안면', '별량면', '상사면', '중앙동', 
    '향동', '매곡동', '삼산동', '조곡동', '덕연동', '풍덕동', 
    '남제동', '저전동', '장천동', '도사동', '왕조1동', '왕조2동'
  ],
  '신안군': [
    '지도읍', '압해읍', '증도면', '임자면', '자은면', '비금면', 
    '도초면', '흑산면', '하의면', '신의면', '장산면', '안좌면', 
    '팔금면', '암태면'
  ],
  '여수시': [
    '돌산읍', '소라면', '율촌면', '화양면', '남면', '화정면', 
    '삼산면', '동문동', '한려동', '중앙동', '충무동', '광림동', 
    '서강동', '대교동', '국동', '월호동', '여서동', '문수동', 
    '미평동', '둔덕동', '만덕동', '쌍봉동', '시전동', '여천동', 
    '주삼동', '삼일동', '묘도동'
  ],
  '영광군': [
    '영광읍', '백수읍', '홍농읍', '대마면', '묘량면', '불갑면', 
    '군서면', '군남면', '염산면', '법성면', '낙월면'
  ],
  '영암군': [
    '영암읍', '삼호읍', '덕진면', '금정면', '신북면', '시종면', 
    '도포면', '군서면', '서호면', '학산면', '미암면'
  ],
  '완도군': [
    '완도읍', '금일읍', '노화읍', '군외면', '신지면', '고금면', 
    '약산면', '청산면', '소안면', '금당면', '보길면', '생일면'
  ],
  '장성군': [
    '장성읍', '진원면', '남면', '동화면', '삼서면', '삼계면', 
    '황룡면', '서삼면', '북일면', '북이면', '북하면'
  ],
  '장흥군': [
    '장흥읍', '관산읍', '대덕읍', '용산면', '안양면', '장동면', 
    '장평면', '유치면', '부산면', '회진면'
  ],
  '진도군': [
    '진도읍', '군내면', '고군면', '의신면', '임회면', '지산면', 
    '조도면'
  ],
  '함평군': [
    '함평읍', '손불면', '신광면', '학교면', '엄다면', '대동면', 
    '나산면', '해보면', '월야면'
  ],
  '해남군': [
    '해남읍', '삼산면', '화산면', '현산면', '송지면', '북평면', 
    '북일면', '옥천면', '계곡면', '마산면', '황산면', '산이면', 
    '문내면', '화원면'
  ],
  '화순군': [
    '화순읍', '한천면', '춘양면', '청풍면', '이양면', '능주면', 
    '도곡면', '도암면', '이서면', '북면', '동복면', '남면', 
    '동면'
  ]
} as const;

export default function Dashboard() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    total: number;
    success: number;
    update: number;
    error: number;
    details: Array<{
      name: string;
      phone: string;
      status: '성공' | '수정' | '실패';
      message: string;
      errorReason?: string;
      data?: any;
    }>;
  } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [selectedCity, setSelectedCity] = useState<string>('전체');
  const [selectedMetric, setSelectedMetric] = useState<'customers' | 'equipments'>('customers');
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: []
  });

  // Firebase 데이터 로드
  useEffect(() => {
    let isMounted = true;
    
    const loadFarmers = async () => {
      try {
        console.log('Firebase 데이터 로딩 시작...');
        
        // Firebase 연결 테스트
        if (!db) {
          throw new Error('Firestore 인스턴스가 초기화되지 않았습니다.');
        }
        
        console.log('Firebase 설정:', {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '설정됨' : '미설정'
        });
        
        const farmersRef = collection(db, 'farmers');
        console.log('farmers 컬렉션 참조 생성');
        
        const snapshot = await getDocs(farmersRef);
        console.log('farmers 컬렉션 조회 완료, 문서 수:', snapshot.size);
        
        if (isMounted) {
          const farmersData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('농민 데이터:', doc.id, data);
            return {
              id: doc.id,
              ...data
            };
          });
          
          if (farmersData.length === 0) {
            console.warn('Firebase에서 가져온 데이터가 없습니다.');
          }
          
          setFarmers(farmersData as Farmer[]);
          setLoading(false);
          console.log('총 농민 수:', farmersData.length);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Firebase 데이터 로딩 에러:', err);
          setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다');
          setLoading(false);
        }
      }
    };
    
    loadFarmers();
    
    return () => {
      isMounted = false;
    };
  }, []); // 빈 의존성 배열로 한 번만 실행되도록 설정

  const handleExcelDownload = () => {
    const excelData = farmers.map(farmer => {
      // 기본 정보
      const baseData = {
        'ID': farmer.id,
        '이름': farmer.name,
        '상호': farmer.businessName || '',
        '연령대': farmer.ageGroup || '',
        '전화번호': farmer.phone || '',
        '우편번호': farmer.zipCode || '',
        '지번주소': farmer.jibunAddress || '',
        '도로명주소': farmer.roadAddress || '',
        '상세주소': farmer.addressDetail || '',
        '우편수취가능여부': farmer.canReceiveMail ? '가능' : '불가능',
        '영농형태': farmer.farmingType || '',
        '주작물': getMainCropText(farmer.mainCrop),
      };

      // 농기계 정보를 종류별로 분리하고 여러 대일 경우 처리
      const equipmentTypes = ['tractor', 'transplanter', 'combine', 'forklift', 'excavator', 'skidLoader'];
      const equipmentData: { [key: string]: string } = {};

      equipmentTypes.forEach(type => {
        // 해당 종류의 모든 장비 찾기
        const equipments = farmer.equipments?.filter(eq => eq.type === type) || [];
        const koreanType = getKoreanEquipmentType(type);
        
        // 장비가 없는 경우 빈 값으로 설정
        if (equipments.length === 0) {
          equipmentData[`${koreanType}1 제조사`] = '';
          equipmentData[`${koreanType}1 거래유형`] = '';
          equipmentData[`${koreanType}1 판매구분`] = '';
        } else {
          // 각 장비별로 정보 추가
          equipments.forEach((equipment, index) => {
            const num = index + 1;
            equipmentData[`${koreanType}${num} 제조사`] = equipment.manufacturer || '';
            equipmentData[`${koreanType}${num} 거래유형`] = equipment.tradeType === 'sale' ? '판매' : 
                                                         equipment.tradeType === 'purchase' ? '구매' : '';
            equipmentData[`${koreanType}${num} 판매구분`] = equipment.saleType === 'new' ? '신규' : 
                                                         equipment.saleType === 'used' ? '중고' : '';
          });
        }
      });

      return {
        ...baseData,
        ...equipmentData,
        '농민정보메모': farmer.memo || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "농민목록");
    
    // 열 너비 자동 조정 (각 농기계 종류별로 최대 3대까지 표시)
    const colWidths = [
      { wch: 20 },  // ID
      { wch: 10 },  // 이름
      { wch: 15 },  // 상호
      { wch: 10 },  // 연령대
      { wch: 15 },  // 전화번호
      { wch: 10 },  // 우편번호
      { wch: 30 },  // 지번주소
      { wch: 30 },  // 도로명주소
      { wch: 20 },  // 상세주소
      { wch: 15 },  // 우편수취가능여부
      { wch: 15 },  // 영농형태
      { wch: 20 },  // 주작물
      ...Array(54).fill({ wch: 15 }),  // 농기계 정보 (6개 종류 x 3대 x 3개 열)
      { wch: 50 },  // 농민정보메모
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, "농민목록.xlsx");
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus({ status: 'processing', message: '엑셀 파일을 처리중입니다...' });
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // 엑셀 파일 읽기 설정 개선
        const parsedData = XLSX.utils.sheet_to_json(sheet, { 
          raw: true,  // 원본 데이터 타입 보존
          defval: null,  // 빈 값을 null로 처리
          header: true,  // 헤더 자동 인식
          blankrows: false  // 빈 행 제외
        });

        console.log('Parsed Excel Data:', parsedData);

        let successCount = 0;
        let updateCount = 0;
        let errorCount = 0;
        let resultDetails: Array<{
          name: string;
          phone: string;
          status: '성공' | '수정' | '실패';
          message: string;
          errorReason?: string;
          data?: any;
        }> = [];

        // Firebase 트랜잭션 시작
        const batch = writeBatch(db);
        const farmersRef = collection(db, 'farmers');
        const snapshot = await getDocs(farmersRef);
        const existingFarmers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 데이터 유효성 검사 함수
        const validateData = (row: any) => {
          const errors = [];
          if (!row['이름']) errors.push('이름이 누락되었습니다');
          if (!row['전화번호']) errors.push('전화번호가 누락되었습니다');
          
          // 전화번호 형식 검증
          if (row['전화번호']) {
            const phoneRegex = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/;
            if (!phoneRegex.test(row['전화번호'].replace(/[-\s]/g, ''))) {
              errors.push('올바른 전화번호 형식이 아닙니다');
            }
          }
          
          return errors;
        };

        // 업로드된 각 행에 대해 처리
        for (const row of parsedData) {
          try {
            setUploadStatus({ 
              status: 'processing', 
              message: `${row['이름'] || '알 수 없음'} 데이터 처리 중...` 
            });

            // 데이터 유효성 검사
            const validationErrors = validateData(row);
            if (validationErrors.length > 0) {
              errorCount++;
              resultDetails.push({
                name: row['이름'] || '이름없음',
                phone: row['전화번호'] || '',
                status: '실패',
                message: '유효성 검사 실패',
                errorReason: validationErrors.join(', '),
                data: row
              });
              continue;
            }

            const farmerData = {
              name: row['이름'],
              businessName: row['상호'] || '',
              ageGroup: row['연령대'] || '',
              phone: formatPhoneNumber(row['전화번호']),
              zipCode: row['우편번호'] || '',
              jibunAddress: row['지번주소'] || '',
              roadAddress: row['도로명주소'] || '',
              addressDetail: row['상세주소'] || '',
              updatedAt: new Date().toISOString()
            };

            // 기존 데이터 검색 시 전화번호 형식을 맞춰서 비교
            const existingFarmer = existingFarmers.find(f => {
              const existingPhone = formatPhoneNumber(f.phone);
              const newPhone = formatPhoneNumber(row['전화번호']);
              const existingPhoneNumbers = existingPhone.replace(/[^0-9]/g, '');
              const newPhoneNumbers = newPhone.replace(/[^0-9]/g, '');
              
              return f.name === farmerData.name && existingPhoneNumbers === newPhoneNumbers;
            });

            if (existingFarmer) {
              // 기존 데이터 업데이트
              const farmerRef = doc(db, 'farmers', existingFarmer.id);
              const updateData = {
                ...farmerData,
                updatedAt: new Date().toISOString()
              };
              batch.update(farmerRef, updateData);
              updateCount++;
              resultDetails.push({
                name: existingFarmer.name,
                phone: existingFarmer.phone,
                status: '수정',
                message: '기존 정보 업데이트 완료',
                data: updateData
              });
            } else {
              // 신규 데이터 등록
              const newFarmerRef = doc(collection(db, 'farmers'));
              const newData = {
                ...farmerData,
                createdAt: new Date().toISOString(),
                memo: '',
                canReceiveMail: false,
                farmingType: '',
                mainCrop: {},
                equipments: []
              };
              batch.set(newFarmerRef, newData);
              successCount++;
              resultDetails.push({
                name: farmerData.name,
                phone: farmerData.phone,
                status: '성공',
                message: '신규 등록 완료',
                data: newData
              });
            }
          } catch (err) {
            errorCount++;
            resultDetails.push({
              name: row['이름'] || '이름없음',
              phone: row['전화번호'] || '',
              status: '실패',
              message: '처리 실패',
              errorReason: err instanceof Error ? err.message : '알 수 없는 오류',
              data: row
            });
          }
        }

        try {
          // 트랜잭션 커밋
          await batch.commit();
          
          // 업로드 결과 상태 업데이트
          setUploadResult({
            total: parsedData.length,
            success: successCount,
            update: updateCount,
            error: errorCount,
            details: resultDetails
          });

          // 데이터 리로드
          const updatedSnapshot = await getDocs(farmersRef);
          const updatedFarmers = updatedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setFarmers(updatedFarmers as Farmer[]);

          setUploadStatus({ 
            status: 'success', 
            message: '업로드가 완료되었습니다.' 
          });

          // 상세 결과 메시지 생성
          const resultMessage = `처리 완료:\n
- 총 ${parsedData.length}건 중\n
- 신규 등록: ${successCount}건\n
- 정보 업데이트: ${updateCount}건\n
- 처리 실패: ${errorCount}건\n\n
${errorCount > 0 ? '실패한 항목들의 상세 내역은 아래에서 확인할 수 있습니다.' : ''}`;

          alert(resultMessage);
        } catch (error) {
          setUploadStatus({ 
            status: 'error', 
            message: '데이터 저장 중 오류가 발생했습니다.' 
          });
          console.error('트랜잭션 커밋 중 오류:', error);
          alert('데이터 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      setUploadStatus({ 
        status: 'error', 
        message: '엑셀 파일 처리 중 오류가 발생했습니다.' 
      });
      console.error('엑셀 업로드 중 오류:', error);
      alert('엑셀 파일 처리 중 오류가 발생했습니다.');
    }
  };

  const handleTemplateDownload = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['이름', '상호', '연령대', '전화번호', '우편번호', '지번주소', '도로명주소', '상세주소'],
      ['', '', '', '', '', '', '', '']
    ]);

    // 열 너비 설정
    ws['!cols'] = [
      { wch: 15 },  // 이름
      { wch: 20 },  // 상호
      { wch: 10 },  // 연령대
      { wch: 15 },  // 전화번호
      { wch: 10 },  // 우편번호
      { wch: 40 },  // 지번주소
      { wch: 40 },  // 도로명주소
      { wch: 30 },  // 상세주소
    ];

    // 필수 입력 셀 스타일 설정 (이름, 전화번호)
    ws['A1'] = {
      v: '이름',
      t: 's',
      s: {
        fill: { 
          patternType: "solid", 
          fgColor: { rgb: "FFFFE0E0" }  // 연한 빨간색 배경
        },
        font: { 
          bold: true,
          color: { rgb: "FFFF0000" },  // 빨간색 글자
          sz: 12
        },
        border: {
          top: { style: 'thin', color: { rgb: "FFFF0000" } },
          bottom: { style: 'thin', color: { rgb: "FFFF0000" } },
          left: { style: 'thin', color: { rgb: "FFFF0000" } },
          right: { style: 'thin', color: { rgb: "FFFF0000" } }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      }
    };

    ws['D1'] = {
      v: '전화번호',
      t: 's',
      s: {
        fill: { 
          patternType: "solid", 
          fgColor: { rgb: "FFFFE0E0" }  // 연한 빨간색 배경
        },
        font: { 
          bold: true,
          color: { rgb: "FFFF0000" },  // 빨간색 글자
          sz: 12
        },
        border: {
          top: { style: 'thin', color: { rgb: "FFFF0000" } },
          bottom: { style: 'thin', color: { rgb: "FFFF0000" } },
          left: { style: 'thin', color: { rgb: "FFFF0000" } },
          right: { style: 'thin', color: { rgb: "FFFF0000" } }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      }
    };

    // 선택 입력 셀 스타일 설정
    ['B1', 'C1', 'E1', 'F1', 'G1', 'H1'].forEach(cell => {
      ws[cell] = {
        v: ws[cell].v,
        t: 's',
        s: {
          fill: {
            patternType: "solid",
            fgColor: { rgb: "FFF0F0F0" }  // 연한 회색 배경
          },
          font: { 
            bold: true,
            color: { rgb: "FF333333" },  // 진한 회색 글자
            sz: 12
          },
          border: {
            top: { style: 'thin', color: { rgb: "FF999999" } },
            bottom: { style: 'thin', color: { rgb: "FF999999" } },
            left: { style: 'thin', color: { rgb: "FF999999" } },
            right: { style: 'thin', color: { rgb: "FF999999" } }
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          }
        }
      };
    });

    XLSX.utils.book_append_sheet(wb, ws, "업로드양식");
    XLSX.writeFile(wb, "농민등록_양식.xlsx");
  };

  const handleGoogleSheetSync = useCallback(async () => {
    try {
      setUploadStatus('구글 시트 동기화 중...');
      
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(farmers)
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('구글 시트 동기화가 완료되었습니다.');
      } else {
        setUploadStatus('구글 시트 동기화 중 오류가 발생했습니다.');
        console.error('동기화 오류:', result.error);
      }
    } catch (error) {
      setUploadStatus('구글 시트 동기화 중 오류가 발생했습니다.');
      console.error('동기화 오류:', error);
    }

    // 3초 후 상태 메시지 제거
    setTimeout(() => {
      setUploadStatus('');
    }, 3000);
  }, [farmers]);

  // 차트 데이터 생성 로직을 useEffect로 이동
  useEffect(() => {
    if (!farmers.length) return;

    const locationData = new Map<string, { customers: number; equipments: number }>();

    // 전체 지역일 때는 모든 시/군을 초기화
    if (selectedCity === '전체') {
      CITIES.forEach(city => {
        locationData.set(city, { customers: 0, equipments: 0 });
      });
    } else {
      // 특정 시/군이 선택된 경우, 해당 지역의 모든 읍/면/동을 초기화
      const selectedRegions = REGIONS[selectedCity as keyof typeof REGIONS];
      if (selectedRegions) {
        selectedRegions.forEach(region => {
          locationData.set(region, { customers: 0, equipments: 0 });
        });
      }
    }

    // 데이터 집계
    console.log('전체 농민 수:', farmers.length);
    
    // 담양군 데이터 확인
    const damyangFarmers = farmers.filter(farmer => {
      const address = farmer.jibunAddress;
      return address && address.includes('담양군');
    });
    console.log('담양군 농민 목록:', damyangFarmers.map(farmer => ({
      name: farmer.name,
      address: farmer.jibunAddress,
      equipments: farmer.equipments?.length || 0
    })));

    farmers.forEach(farmer => {
      const address = farmer.jibunAddress;  // 지번주소만 사용
      if (!address) {
        console.log('지번주소 없음:', farmer.name);
        return;
      }

      // 주소에서 시군 추출
      let city = '';
      let town = '';

      // 모든 시군구에 대해 처리
      for (const cityName of CITIES) {
        if (address.includes(cityName)) {
          city = cityName;
          const addressParts = address.split(cityName);
          if (addressParts.length > 1) {
            // 시군구 이후의 첫 번째 읍/면/동 찾기
            const matches = addressParts[1].trim().match(/^[가-힣]+(읍|면|동)/);
            if (matches) {
              town = matches[0];
            }
          }
          break;  // 시군구를 찾았으면 반복 중단
        }
      }

      if (!city) {
        console.log('시군구 파싱 실패:', address);
        return;
      }

      // 장비 수 계산
      const equipmentCount = farmer.equipments?.length || 0;
      console.log('데이터 처리:', {
        name: farmer.name,
        address,
        city,
        town,
        equipments: equipmentCount
      });

      if (selectedCity === '전체') {
        if (locationData.has(city)) {
          const data = locationData.get(city)!;
          data.customers++;
          data.equipments += equipmentCount;
          console.log('시/군 집계:', city, '누적 장비 수:', data.equipments);
        }
      } else if (city === selectedCity && locationData.has(town)) {
        const data = locationData.get(town)!;
        data.customers++;
        data.equipments += equipmentCount;
        console.log('읍/면/동 집계:', town, '누적 장비 수:', data.equipments);
      }
    });

    // 최종 집계 결과 출력
    console.log('최종 집계 결과:', Array.from(locationData.entries()));

    let sortedLocations: [string, { customers: number; equipments: number }][];
    
    if (selectedCity === '전체') {
      // 전체 지역일 때는 CITIES 배열의 순서대로 정렬
      sortedLocations = CITIES.map(city => [
        city,
        locationData.get(city) || { customers: 0, equipments: 0 }
      ]);
    } else {
      // 특정 시/군이 선택된 경우, 해당 지역의 읍/면/동 순서대로 정렬
      const selectedRegions = REGIONS[selectedCity as keyof typeof REGIONS];
      if (selectedRegions) {
        sortedLocations = selectedRegions.map(region => [
          region,
          locationData.get(region) || { customers: 0, equipments: 0 }
        ]);
      } else {
        sortedLocations = Array.from(locationData.entries())
          .sort((a, b) => a[0].localeCompare(b[0]));
      }
    }

    setChartData({
      labels: sortedLocations.map(([location]) => location),
      datasets: [
        {
          label: '고객 수',
          data: sortedLocations.map(([, data]) => data.customers),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgba(53, 162, 235, 1)',
          borderWidth: 1,
          order: 2
        },
        {
          label: '장비 수',
          data: sortedLocations.map(([, data]) => data.equipments),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          order: 1
        }
      ]
    });
  }, [farmers, selectedCity]); // farmers와 selectedCity가 변경될 때만 차트 업데이트

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedCity} 지역 통계`,
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        formatter: (value: number) => value,
        font: {
          weight: 'bold'
        },
        color: '#333'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (loading) {
    return <div className="text-center py-10">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* 통계 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-6 bg-blue-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">총 고객수</h3>
          <p className="text-3xl font-bold text-blue-600">{farmers.length}명</p>
        </div>
        <div className="p-6 bg-green-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-green-900">총 농기계수</h3>
          <p className="text-3xl font-bold text-green-600">
            {farmers.reduce((acc, farmer) => acc + (farmer.equipments?.length || 0), 0)}대
          </p>
        </div>
      </div>

      {/* 엑셀 관련 버튼들 */}
      <div className="mb-4 flex items-center gap-4">
        {/* 엑셀 업로드 버튼 */}
        <div className="relative">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleExcelUpload}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
          >
            <FaFileExcel />
            엑셀 업로드
          </label>
          {/* 업로드 상태 표시 */}
          {uploadStatus.status !== 'idle' && (
            <div className={`absolute top-full left-0 mt-2 p-2 rounded shadow-lg w-64 ${
              uploadStatus.status === 'processing' ? 'bg-blue-100' :
              uploadStatus.status === 'success' ? 'bg-green-100' :
              'bg-red-100'
            }`}>
              <p className={`text-sm ${
                uploadStatus.status === 'processing' ? 'text-blue-700' :
                uploadStatus.status === 'success' ? 'text-green-700' :
                'text-red-700'
              }`}>
                {uploadStatus.message}
              </p>
            </div>
          )}
        </div>

        {/* 템플릿 다운로드 버튼 */}
        <button
          onClick={handleTemplateDownload}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          <FaFileExcel />
          템플릿 다운로드
        </button>

        {/* 엑셀 다운로드 버튼 */}
        <button
          onClick={handleExcelDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <FaFileExcel />
          엑셀 다운로드
        </button>

        {/* 구글 시트 동기화 버튼 */}
        <button
          onClick={handleGoogleSheetSync}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          <FaGoogle />
          구글 시트 동기화
        </button>
      </div>

      {/* 업로드 결과 표시 */}
      {uploadResult && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="text-lg font-bold mb-2">업로드 결과</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-2 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">총 처리</p>
              <p className="text-xl font-bold">{uploadResult.total}건</p>
            </div>
            <div className="p-2 bg-green-100 rounded">
              <p className="text-sm text-green-600">신규 등록</p>
              <p className="text-xl font-bold">{uploadResult.success}건</p>
            </div>
            <div className="p-2 bg-blue-100 rounded">
              <p className="text-sm text-blue-600">정보 수정</p>
              <p className="text-xl font-bold">{uploadResult.update}건</p>
            </div>
            <div className="p-2 bg-red-100 rounded">
              <p className="text-sm text-red-600">처리 실패</p>
              <p className="text-xl font-bold">{uploadResult.error}건</p>
            </div>
          </div>

          {/* 실패 항목 상세 내역 */}
          {uploadResult.error > 0 && (
            <div className="mt-4">
              <h4 className="font-bold mb-2">실패 항목 상세</h4>
              <div className="max-h-60 overflow-y-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2">이름</th>
                      <th className="px-4 py-2">전화번호</th>
                      <th className="px-4 py-2">실패 사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.details
                      .filter(detail => detail.status === '실패')
                      .map((detail, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{detail.name}</td>
                          <td className="px-4 py-2">{detail.phone}</td>
                          <td className="px-4 py-2 text-red-600">{detail.errorReason}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 차트 섹션 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">지역별 통계</h1>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="전체">전체 지역</option>
            <option value="강진군">강진군</option>
            <option value="고흥군">고흥군</option>
            <option value="곡성군">곡성군</option>
            <option value="광양시">광양시</option>
            <option value="구례군">구례군</option>
            <option value="나주시">나주시</option>
            <option value="담양군">담양군</option>
            <option value="목포시">목포시</option>
            <option value="무안군">무안군</option>
            <option value="보성군">보성군</option>
            <option value="순천시">순천시</option>
            <option value="신안군">신안군</option>
            <option value="여수시">여수시</option>
            <option value="영광군">영광군</option>
            <option value="영암군">영암군</option>
            <option value="완도군">완도군</option>
            <option value="장성군">장성군</option>
            <option value="장흥군">장흥군</option>
            <option value="진도군">진도군</option>
            <option value="함평군">함평군</option>
            <option value="해남군">해남군</option>
            <option value="화순군">화순군</option>
          </select>
        </div>
        <div className="h-[600px]">
          <Bar options={options} data={chartData} />
        </div>
      </div>
    </div>
  );
} 