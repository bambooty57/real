import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer, cropDisplayNames } from '@/utils/mappings';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1분으로 수정

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
        private_key: GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 4. 데이터 포맷팅
    const values = formatFarmerData(farmers);

    // 5. API 호출 작업을 청크로 나누어 처리
    const CHUNK_SIZE = 500;
    const totalChunks = Math.ceil(values.length / CHUNK_SIZE);
    
    try {
      // 기존 데이터 삭제
      await sheets.spreadsheets.values.clear({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: '시트1!A1:Q10000',
      });

      // 청크 단위로 데이터 업로드
      for (let i = 0; i < values.length; i += CHUNK_SIZE) {
        const chunk = values.slice(i, i + CHUNK_SIZE);
        const currentChunk = Math.floor(i / CHUNK_SIZE) + 1;
        
        console.log(`청크 처리 중: ${currentChunk}/${totalChunks}`);
        
        // 각 청크마다 타임아웃 설정
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('청크 처리 시간 초과')), 55000);
        });

        try {
          await Promise.race([
            sheets.spreadsheets.values.update({
              spreadsheetId: GOOGLE_SHEET_ID,
              range: `시트1!A${i + 1}`,
              valueInputOption: 'RAW',
              requestBody: { values: chunk },
            }),
            timeoutPromise
          ]);
        } catch (error: any) {
          if (error.message === '청크 처리 시간 초과') {
            return NextResponse.json({
              success: false,
              error: '데이터 처리 시간이 초과되었습니다. 더 작은 데이터로 나누어 시도해주세요.',
              processedChunks: currentChunk - 1,
              totalChunks
            }, { status: 408 });
          }
          throw error;
        }
      }

      return NextResponse.json({
        success: true,
        message: `${values.length - 1}개의 데이터가 성공적으로 동기화되었습니다.`,
      });

    } catch (error: any) {
      console.error('Google Sheets API 호출 중 오류:', error);
      
      let errorMessage = '구글 시트 API 호출 중 오류가 발생했습니다.';
      let statusCode = 500;

      if (error.code === 401) {
        errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        statusCode = 401;
      } else if (error.code === 403) {
        errorMessage = '구글 시트 접근 권한이 없습니다. 권한을 확인해주세요.';
        statusCode = 403;
      } else if (error.code === 404) {
        errorMessage = '구글 시트를 찾을 수 없습니다. 시트 ID를 확인해주세요.';
        statusCode = 404;
      } else if (error.code === 429) {
        errorMessage = 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        statusCode = 429;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: error.message
      }, { status: statusCode });
    }

  } catch (error: any) {
    console.error('예상치 못한 오류:', error);
    return NextResponse.json({
      success: false,
      error: '예상치 못한 오류가 발생했습니다.',
      details: error.message
    }, { status: 500 });
  }
} 