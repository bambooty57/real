import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer, cropDisplayNames } from '@/utils/mappings';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
    'ID', '이름', '전화번호', '상호', '영농형태', '주작물', '세부작물',
    '우편번호', '도로명주소', '지번주소', '상세주소',
    '메모', '연령대', '우편수취가능여부', '보유농기계',
    '생성일', '수정일'
  ];

  // 데이터 행 변환
  const rows = farmers.map(farmer => {
    try {
      // 영농형태 변환
      const farmingTypes = Object.entries(farmer.farmingTypes || {})
        .filter(([_, value]) => value)
        .map(([key]) => getFarmingTypeDisplay(key))
        .join(', ');

      // 주작물 변환
      const mainCrops = Object.entries(farmer.mainCrop || {})
        .filter(([key, value]) => value && !key.endsWith('Details'))
        .map(([key]) => getMainCropDisplay(key))
        .join(', ');

      // 세부작물 변환
      const detailCrops = farmer.mainCrop && typeof farmer.mainCrop === 'object'
        ? Object.entries(farmer.mainCrop)
            .filter(([key]) => key.endsWith('Details'))
            .flatMap(([_, values]) => Array.isArray(values) ? values : [])
            .map(value => cropDisplayNames[value as keyof typeof cropDisplayNames] || value)
            .filter(Boolean)
            .join(', ')
        : '';

      // 농기계 정보 변환
      const equipments = (farmer.equipments || [])
        .map((eq: any) => {
          if (!eq) return '';
          return `${getKoreanEquipmentType(eq.type)} (${getKoreanManufacturer(eq.manufacturer)} ${eq.model})`;
        })
        .join(', ');

      // 날짜 변환
      const createdAt = farmer.createdAt ? new Date(farmer.createdAt.seconds * 1000).toLocaleString('ko-KR') : '';
      const updatedAt = farmer.updatedAt ? new Date(farmer.updatedAt.seconds * 1000).toLocaleString('ko-KR') : '';

      const row = [
        farmer.id || '',
        farmer.name || '',
        farmer.phone || '',
        farmer.businessName || '',
        farmingTypes,
        mainCrops,
        detailCrops,
        farmer.zipCode || '',
        farmer.roadAddress || '',
        farmer.jibunAddress || '',
        farmer.addressDetail || '',
        farmer.memo || '',
        farmer.ageGroup || '',
        farmer.canReceiveMail ? '가능' : '불가능',
        equipments,
        createdAt,
        updatedAt
      ];

      return row;

    } catch (error) {
      console.error('농민 데이터 변환 오류:', error);
      return Array(17).fill(''); // 17개 열에 맞춰 수정
    }
  });

  return [headers, ...rows];
}

export async function POST(req: Request) {
  try {
    // 1. 환경변수 검증
    const { GOOGLE_CLIENT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID } = process.env;
    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_KEY || !GOOGLE_SHEET_ID) {
      console.error('Missing required environment variables:', {
        hasClientEmail: !!GOOGLE_CLIENT_EMAIL,
        hasServiceKey: !!GOOGLE_SERVICE_ACCOUNT_KEY,
        hasSheetId: !!GOOGLE_SHEET_ID
      });
      return NextResponse.json({
        success: false,
        error: '필수 환경변수가 설정되지 않았습니다.'
      }, { status: 500 });
    }

    // 2. 요청 데이터 파싱
    const farmers = await req.json();

    if (!Array.isArray(farmers)) {
      return NextResponse.json({
        success: false,
        error: '올바른 데이터 형식이 아닙니다.'
      }, { status: 400 });
    }

    // 3. 서비스 계정 인증 설정
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_SERVICE_ACCOUNT_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 4. 데이터 포맷팅
    const values = formatFarmerData(farmers);

    // 5. 시트 초기화
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: '시트1!A1:Q10000',
      });
    } catch (error: any) {
      console.error('시트 초기화 중 오류:', error);
      if (error.code === 403) {
        return NextResponse.json({
          success: false,
          error: '구글 시트 접근 권한이 없습니다. 권한을 확인해주세요.',
          details: error.message
        }, { status: 403 });
      }
      throw error;
    }

    // 6. 데이터 업로드
    const CHUNK_SIZE = 500;
    const totalChunks = Math.ceil(values.length / CHUNK_SIZE);
    
    for (let i = 0; i < values.length; i += CHUNK_SIZE) {
      const chunk = values.slice(i, i + CHUNK_SIZE);
      const currentChunk = Math.floor(i / CHUNK_SIZE) + 1;
      
      console.log(`청크 처리 중: ${currentChunk}/${totalChunks}`);
      
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: `시트1!A${i + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: chunk },
        });

        // 청크 처리 후 대기 시간 복구
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error('청크 처리 중 오류:', error);
        return NextResponse.json({
          success: false,
          error: '데이터 업로드 중 오류가 발생했습니다.',
          details: error.message,
          processedChunks: currentChunk - 1,
          totalChunks
        }, { status: error.code || 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${values.length - 1}개의 데이터가 성공적으로 동기화되었습니다.`,
    });

  } catch (error: any) {
    console.error('예상치 못한 오류:', error);
    return NextResponse.json({
      success: false,
      error: '예상치 못한 오류가 발생했습니다.',
      details: error.message
    }, { status: 500 });
  }
} 