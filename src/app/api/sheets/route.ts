import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings';

export const runtime = 'nodejs';

// 농기계 타입 정의
interface Equipment {
  type: string;
  manufacturer: string;
  attachments?: Array<{
    type: string;
    manufacturer: string;
  }>;
}

// Firebase Timestamp를 Date 객체로 변환
function convertTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  // Firestore Timestamp 객체인 경우
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  
  // 이미 Date 객체인 경우
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // 숫자(Unix timestamp)인 경우
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // 문자열인 경우
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

// 날짜 포맷팅 함수
function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// 데이터를 시트에 맞는 형식으로 변환
function formatFarmerData(farmers: any[]) {
  // 헤더 행
  const headers = [
    'ID', '이름', '전화번호', '상호', '영농형태', '주작물',
    '우편번호', '도로명주소', '지번주소', '상세주소',
    '메모', '연령대', '우편수취가능여부', '보유농기계',
    '생성일', '수정일'
  ];

  // 농기계 정보 포맷팅
  function formatEquipment(equipment: any) {
    try {
      if (!equipment || typeof equipment !== 'object') return '';
      const type = equipment.type || '';
      const manufacturer = equipment.manufacturer || '';
      if (!type || !manufacturer) return '';
      
      const mainInfo = `${type}(${manufacturer})`;
      if (!Array.isArray(equipment.attachments)) return mainInfo;
      
      const attachments = equipment.attachments
        .map((att: any) => {
          if (!att || typeof att !== 'object') return '';
          return `${att.type || ''}(${att.manufacturer || ''})`;
        })
        .filter(Boolean)
        .join(', ');
      
      return attachments ? `${mainInfo} - ${attachments}` : mainInfo;
    } catch (error) {
      console.error('농기계 정보 포맷팅 오류:', error);
      return '';
    }
  }

  // 데이터 행 변환
  const rows = farmers.map(farmer => {
    try {
      return [
        farmer.id || '',
        farmer.name || '',
        farmer.phone || '',
        farmer.businessName || '',
        (farmer.farmingTypes && typeof farmer.farmingTypes === 'object' 
          ? Object.entries(farmer.farmingTypes)
              .filter(([_, value]) => value)
              .map(([key]) => getFarmingTypeDisplay(key))
              .join(', ') 
          : ''),
        (farmer.mainCrop && typeof farmer.mainCrop === 'object'
          ? Object.entries(farmer.mainCrop)
              .filter(([_, value]) => value)
              .map(([key]) => getMainCropDisplay(key))
              .join(', ')
          : ''),
        farmer.zipCode || '',
        farmer.roadAddress || '',
        farmer.jibunAddress || '',
        farmer.addressDetail || '',
        farmer.memo || '',
        farmer.ageGroup || '',
        farmer.canReceiveMail ? '가능' : '불가능',
        Array.isArray(farmer.equipments) 
          ? farmer.equipments.map((eq: Equipment) => 
              eq ? `${getKoreanEquipmentType(eq.type)}(${getKoreanManufacturer(eq.manufacturer)})` : ''
            ).filter(Boolean).join('; ')
          : '',
        formatDate(convertTimestamp(farmer.createdAt)),
        formatDate(convertTimestamp(farmer.updatedAt))
      ];
    } catch (error) {
      console.error('농민 데이터 변환 오류:', error);
      return Array(16).fill(''); // 빈 데이터로 채움
    }
  });

  return [headers, ...rows];
}

export async function POST(req: Request) {
  try {
    // 1. 환경변수 검증
    const { GOOGLE_CLIENT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID } = process.env;
    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_KEY || !GOOGLE_SHEET_ID) {
      throw new Error('필수 환경변수가 설정되지 않았습니다.');
    }

    // 2. 요청 데이터 파싱
    const farmers = await req.json();
    if (!Array.isArray(farmers)) {
      throw new Error('올바른 데이터 형식이 아닙니다.');
    }

    // 3. Google Sheets API 인증
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 4. 데이터 포맷팅
    const values = formatFarmerData(farmers);

    // 5. 기존 데이터 삭제
    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: '시트1!A1:P10000',
    });

    // 6. 새 데이터 추가
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: '시트1!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return NextResponse.json({
      success: true,
      message: `${values.length - 1}개의 데이터가 성공적으로 동기화되었습니다.`,
    });

  } catch (error: any) {
    console.error('Google Sheets 동기화 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || '동기화 중 오류가 발생했습니다.',
    }, { status: 500 });
  }
} 