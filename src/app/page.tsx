'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, query, where, writeBatch, orderBy, deleteDoc } from 'firebase/firestore';
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
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings';
import { Farmer } from '@/types/farmer';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const getFarmingTypeText = (farmingTypes: any) => {
  if (!farmingTypes) return '';
  return Object.entries(farmingTypes)
    .filter(([_, value]) => value)
    .map(([key]) => getFarmingTypeDisplay(key))
    .join(', ');
};

const getMainCropText = (mainCrop: any) => {
  if (!mainCrop) return '';
  return Object.entries(mainCrop)
    .filter(([_, value]) => value)
    .map(([key]) => getMainCropDisplay(key))
    .join(', ');
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
const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 길이에 따라 적절한 형식 적용
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  } else if (numbers.length === 9) {
    return numbers.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  return numbers;
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
  '나주시', '목포시', '순천시', '여수시', '광양시', '담양군', '곡성군', 
  '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', 
  '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'
];

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

interface ExcelRow {
  [key: string]: any;
  이름?: string;
  전화번호?: string;
  주소?: string;
  연령대?: string;
  영농형태?: string;
  주작물?: string;
}

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
        setLoading(true);
        setError(null);
        console.log('Firebase 데이터 로딩 시작...');

        const farmersRef = collection(db, 'farmers');
        const q = query(farmersRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const loadedFarmers: Farmer[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Firebase 문서 데이터:', data); // 각 문서의 데이터 로깅
          loadedFarmers.push({
            id: doc.id,
            ...data
          } as Farmer);
        });

        if (isMounted) {
          console.log('로드된 농민 데이터:', loadedFarmers.length, '명');
          setFarmers(loadedFarmers);
        }
      } catch (err) {
        console.error('Firebase 데이터 로딩 오류:', err);
        if (isMounted) {
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFarmers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExcelDownload = () => {
    const excelData = farmers.map(farmer => ({
      'ID': farmer.id || '',
      '이름': farmer.name || '',
      '전화번호': farmer.phone || '',
      '상호': farmer.businessName || '',
      '영농형태': Object.entries(farmer.farmingTypes || {})
        .filter(([_, value]) => value)
        .map(([key]) => getFarmingTypeDisplay(key))
        .join(', ') || '',
      '주작물': Object.entries(farmer.mainCrop || {})
        .filter(([_, value]) => value)
        .map(([key]) => getMainCropDisplay(key))
        .join(', ') || '',
      '우편번호': farmer.zipCode || '',
      '도로명주소': farmer.roadAddress || '',
      '지번주소': farmer.jibunAddress || '',
      '상세주소': farmer.addressDetail || '',
      '메모': farmer.memo || '',
      '연령대': farmer.ageGroup || '',
      '우편수취가능여부': farmer.canReceiveMail ? '가능' : '불가능',
      '보유농기계': (farmer.equipments || [])
        .map(eq => `${getKoreanEquipmentType(eq.type)}(${getKoreanManufacturer(eq.manufacturer)})`)
        .filter(Boolean)
        .join('; '),
      '생성일': farmer.createdAt && typeof farmer.createdAt === 'object' && 'seconds' in farmer.createdAt ? new Date(farmer.createdAt.seconds * 1000).toLocaleString('ko-KR') : '',
      '수정일': farmer.updatedAt && typeof farmer.updatedAt === 'object' && 'seconds' in farmer.updatedAt ? new Date(farmer.updatedAt.seconds * 1000).toLocaleString('ko-KR') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "농민목록");
    
    // 열 너비 자동 조정
    const colWidths = [
      { wch: 20 },  // ID
      { wch: 15 },  // 이름
      { wch: 15 },  // 전화번호
      { wch: 20 },  // 상호
      { wch: 15 },  // 영농형태
      { wch: 15 },  // 주작물
      { wch: 10 },  // 우편번호
      { wch: 40 },  // 도로명주소
      { wch: 40 },  // 지번주소
      { wch: 30 },  // 상세주소
      { wch: 30 },  // 메모
      { wch: 10 },  // 연령대
      { wch: 15 },  // 우편수취가능여부
      { wch: 30 },  // 보유농기계
      { wch: 20 },  // 생성일
      { wch: 20 },  // 수정일
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
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
          raw: true,  // 원본 데이터 타입 보존
          defval: '',  // 빈 값을 빈 문자열로 처리
          header: 0,  // 첫 번째 행을 헤더로 사용
          blankrows: false  // 빈 행 제외
        });

        console.log('Parsed Excel Data:', jsonData);

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
        } as Farmer));

        // 데이터 유효성 검사 함수
        const validateData = (row: any) => {
          const errors = [];
          
          // 이름 검증 - 공백 제거 후 확인
          const name = (row['이름'] || '').trim();
          if (!name) {
            errors.push('이름이 누락되었습니다');
          }
          
          // 전화번호 검증 - 숫자만 추출하여 확인
          const phone = (row['전화번호'] || '').replace(/[^0-9]/g, '');
          if (!phone) {
            errors.push('전화번호가 누락되었습니다');
          } else if (phone.length < 9 || phone.length > 11) {
            errors.push('올바른 전화번호 형식이 아닙니다');
          }
          
          return errors;
        };

        // 업로드된 각 행에 대해 처리
        for (const row of jsonData) {
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
              phone: formatPhoneNumber(row['전화번호'] || ''),
              zipCode: row['우편번호'] || '',
              jibunAddress: row['지번주소'] || '',
              roadAddress: row['도로명주소'] || '',
              addressDetail: row['상세주소'] || '',
              updatedAt: new Date().toISOString()
            };

            // 기존 데이터 검색 시 전화번호 형식을 맞춰서 비교
            const existingFarmer = existingFarmers.find(f => {
              const existingPhone = formatPhoneNumber(f.phone || '');
              const newPhone = formatPhoneNumber(row['전화번호'] || '');
              const existingPhoneNumbers = existingPhone.replace(/[^0-9]/g, '');
              const newPhoneNumbers = newPhone.replace(/[^0-9]/g, '');
              
              return f.name === farmerData.name && existingPhoneNumbers === newPhoneNumbers;
            });

            if (existingFarmer && existingFarmer.id) {
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
                farmingTypes: [],
                equipments: []
              };
              batch.set(newFarmerRef, newData);
              successCount++;
              resultDetails.push({
                name: farmerData.name || '이름없음',
                phone: farmerData.phone || '',
                status: '성공',
                message: '신규 등록 완료',
                data: farmerData
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
            total: jsonData.length,
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
- 총 ${jsonData.length}건 중\n
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
      ['ID', '이름', '전화번호', '상호', '영농형태', '주작물', '우편번호', '도로명주소', '지번주소', '상세주소', '메모', '연령대', '우편수취가능여부', '보유농기계', '생성일', '수정일'],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    ]);

    // 열 너비 설정
    ws['!cols'] = [
      { wch: 20 },  // ID
      { wch: 15 },  // 이름
      { wch: 15 },  // 전화번호
      { wch: 20 },  // 상호
      { wch: 15 },  // 영농형태
      { wch: 15 },  // 주작물
      { wch: 10 },  // 우편번호
      { wch: 40 },  // 도로명주소
      { wch: 40 },  // 지번주소
      { wch: 30 },  // 상세주소
      { wch: 30 },  // 메모
      { wch: 10 },  // 연령대
      { wch: 15 },  // 우편수취가능여부
      { wch: 30 },  // 보유농기계
      { wch: 20 },  // 생성일
      { wch: 20 },  // 수정일
    ];

    // 필수 입력 셀 스타일 설정 (이름, 전화번호)
    ['B1', 'C1'].forEach(cell => {
      ws[cell] = {
        v: ws[cell].v,
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
    });

    // 선택 입력 셀 스타일 설정
    ['A1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1', 'P1'].forEach(cell => {
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
      setUploadStatus({ 
        status: 'processing', 
        message: '구글 시트 동기화 중...' 
      });
      
      // 데이터 변환
      const syncData = farmers.map(farmer => ({
        ...farmer,
        farmingTypes: Object.entries(farmer.farmingTypes || {})
          .filter(([_, value]) => value)
          .map(([key]) => getFarmingTypeDisplay(key))
          .join(', '),
        mainCrop: Object.entries(farmer.mainCrop || {})
          .filter(([_, value]) => value)
          .map(([key]) => getMainCropDisplay(key))
          .join(', '),
        equipments: (farmer.equipments || [])
          .map(eq => `${getKoreanEquipmentType(eq.type)}(${getKoreanManufacturer(eq.manufacturer)})`)
          .join('; ')
      }));
      
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(syncData)
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus({ 
          status: 'success', 
          message: '구글 시트 동기화가 완료되었습니다.' 
        });
      } else {
        setUploadStatus({ 
          status: 'error', 
          message: '구글 시트 동기화 중 오류가 발생했습니다.' 
        });
        console.error('동기화 오류:', result.error);
      }
    } catch (error) {
      setUploadStatus({ 
        status: 'error', 
        message: '구글 시트 동기화 중 오류가 발생했습니다.' 
      });
      console.error('동기화 오류:', error);
    }

    // 3초 후 상태 메시지 제거
    setTimeout(() => {
      setUploadStatus({ 
        status: 'idle', 
        message: '' 
      });
    }, 3000);
  }, [farmers]);

  // 차트 데이터 업데이트
  useEffect(() => {
    if (!farmers.length) return;

    try {
      console.log('전체 농민 데이터:', farmers.length, '명');
      console.log('첫 번째 농민 데이터 구조:', JSON.stringify(farmers[0], null, 2));
      const locationData = new Map<string, { customers: number; equipments: number }>();

      // 전체 지역일 때는 모든 시/군을 초기화
      if (selectedCity === '전체') {
        CITIES.forEach(city => {
          locationData.set(city, { customers: 0, equipments: 0 });
        });
      }

      // 데이터 집계
      farmers.forEach(farmer => {
        const address = farmer.roadAddress || farmer.jibunAddress;
        if (!address) {
          console.log('주소 없음:', farmer.name);
          return;
        }

        // 시/군 및 읍/면/동 추출
        let foundCity = null;
        let foundTown = null;

        // 시/군 추출
        for (const city of CITIES) {
          if (address.includes(city)) {
            foundCity = city;
            // 읍/면/동 추출
            const townMatch = address.match(/([가-힣]+(?:읍|면|동))/);
            if (townMatch) {
              foundTown = townMatch[1];
            }
            break;
          }
        }

        if (!foundCity) {
          console.log('지역 매칭 실패:', address);
          return;
        }

        const equipmentCount = farmer.equipments?.length || 0;
        console.log('농민 데이터 처리:', {
          name: farmer.name,
          city: foundCity,
          town: foundTown,
          address: address,
          equipments: equipmentCount
        });

        // 전체 보기일 때는 시/군별 통계
        if (selectedCity === '전체') {
          const data = locationData.get(foundCity)!;
          data.customers++;
          data.equipments += equipmentCount;
        } 
        // 특정 시/군 선택시 읍/면/동별 통계
        else if (selectedCity === foundCity && foundTown) {
          if (!locationData.has(foundTown)) {
            locationData.set(foundTown, { customers: 0, equipments: 0 });
          }
          const data = locationData.get(foundTown)!;
          data.customers++;
          data.equipments += equipmentCount;
        }
      });

      // 차트 데이터 생성
      const sortedLocations = Array.from(locationData.entries())
        .sort((a, b) => b[1].customers - a[1].customers);

      // y축 최대값 계산
      const maxCustomers = Math.max(...sortedLocations.map(([, data]) => data.customers));
      const maxEquipments = Math.max(...sortedLocations.map(([, data]) => data.equipments));
      const maxValue = Math.max(maxCustomers, maxEquipments);
      const yAxisMax = Math.ceil(maxValue * 1.2); // 20% 여유 추가
      const stepSize = Math.ceil(yAxisMax / 8); // 8개의 눈금으로 나누기

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right' as const,
            title: {
              display: true,
              text: '지역별 농민/장비 현황',
              padding: {
                bottom: 10
              }
            },
            labels: {
              padding: 20,
              font: {
                size: 14
              }
            }
          },
          title: {
            display: false
          },
          datalabels: {
            anchor: 'end' as const,
            align: 'end' as const,
            formatter: (value: number) => value,
            font: {
              weight: 'bold' as const,
              size: 12
            },
            padding: 6,
            color: '#000000'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: yAxisMax,
            ticks: {
              stepSize: stepSize,
              font: {
                size: 12
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 12
              },
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        layout: {
          padding: {
            right: 50
          }
        }
      };

      setChartData({
        labels: sortedLocations.map(([location]) => location),
        datasets: [
          {
            label: selectedCity === '전체' ? '시/군별 고객 수' : '읍/면/동별 고객 수',
            data: sortedLocations.map(([, data]) => data.customers),
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: selectedCity === '전체' ? '시/군별 장비 수' : '읍/면/동별 장비 수',
            data: sortedLocations.map(([, data]) => data.equipments),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      });

      setOptions(chartOptions);

    } catch (err) {
      console.error('차트 데이터 생성 중 오류:', err);
      toast.error('차트 데이터 생성 중 오류가 발생했습니다.');
    }
  }, [farmers, selectedCity]);

  // 차트 옵션 상태 추가
  const [options, setOptions] = useState({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        title: {
          display: true,
          text: '지역별 농민/장비 현황',
          padding: {
            bottom: 10
          }
        },
        labels: {
          padding: 20,
          font: {
            size: 14
          }
        }
      },
      title: {
        display: false
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'end' as const,
        formatter: (value: number) => value,
        font: {
          weight: 'bold' as const,
          size: 12
        },
        padding: 6,
        color: '#000000'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 0,
        ticks: {
          stepSize: 0,
          font: {
            size: 12
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 12
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    layout: {
      padding: {
        right: 50
      }
    }
  });

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
            {CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div className="h-[600px] pr-8">
          <Bar options={options} data={chartData} />
        </div>
      </div>
    </div>
  );
} 