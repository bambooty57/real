import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer, cropDisplayNames } from '@/utils/mappings';

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
    second: '2-digit',
    hour12: false
  }).replace(/\b(\d)\b/g, '0$1'); // 한 자리 숫자를 두 자리로 패딩
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

  // 데이터 행 변환
  const rows = farmers.map(farmer => {
    try {
      // 영농형태 변환
      const farmingTypes = farmer.farmingTypes && typeof farmer.farmingTypes === 'object'
        ? Object.entries(farmer.farmingTypes)
            .filter(([_, value]) => value)
            .map(([key]) => getFarmingTypeDisplay(key))
            .join(', ')
        : '';

      // 주작물 변환 (상세 작물 포함)
      const mainCrops = farmer.mainCrop && typeof farmer.mainCrop === 'object'
        ? Object.entries(farmer.mainCrop)
            .filter(([key, value]) => value === true && !key.endsWith('Details'))
            .map(([key]) => getMainCropDisplay(key))
            .join(', ')
        : '';

      // 농기계 정보 변환
      const equipments = Array.isArray(farmer.equipments)
        ? farmer.equipments
            .map((eq: Equipment) => {
              if (!eq) return '';
              const mainEquipment = `${getKoreanEquipmentType(eq.type)}(${getKoreanManufacturer(eq.manufacturer)})`;
              
              // 작업기 정보 추가
              const attachments = eq.attachments
                ? eq.attachments
                    .map(att => `${getKoreanEquipmentType(att.type)}(${getKoreanManufacturer(att.manufacturer)})`)
                    .join(', ')
                : '';
              
              return attachments ? `${mainEquipment} - ${attachments}` : mainEquipment;
            })
            .filter(Boolean)
            .join('; ')
        : '';

      return [
        farmer.id || '',
        farmer.name || '',
        farmer.phone || '',
        farmer.businessName || '',
        farmingTypes,
        mainCrops,
        farmer.zipCode || '',
        farmer.roadAddress || '',
        farmer.jibunAddress || '',
        farmer.addressDetail || '',
        farmer.memo || '',
        farmer.ageGroup || '',
        farmer.canReceiveMail ? '가능' : '불가능',
        equipments,
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