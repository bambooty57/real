import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // 함수 실행 시간을 1분으로 줄임

// 농기계 정보를 문자열로 변환하는 함수
const formatEquipments = (equipments: any[] | undefined): string => {
  if (!equipments || !Array.isArray(equipments)) return '';
  
  return equipments.map(eq => {
    if (!eq) return '';
    const base = `${eq.type || ''}(${eq.manufacturer || ''})`;
    
    // attachments가 배열인지 확인하고 안전하게 처리
    const attachments = Array.isArray(eq.attachments) 
      ? eq.attachments
        .filter((att: any) => att && typeof att === 'object')
        .map((att: any) => `${att.type || ''}(${att.manufacturer || ''})`)
        .filter(Boolean)
        .join(', ')
      : '';
    
    return [base, attachments].filter(Boolean).join(' - ');
  }).filter(Boolean).join('; ');
};

// 2D 배열로 변환하는 함수 수정
const convertToSheetData = (farmers: any[]): any[][] => {
  // 헤더 행
  const headers = [
    'ID', '이름', '전화번호', '상호', '영농형태', '주작물',
    '우편번호', '도로명주소', '지번주소', '상세주소',
    '메모', '연령대', '우편수취가능여부', '보유농기계',
    '생성일', '수정일'
  ];

  // 데이터 행
  const rows = farmers.map(farmer => [
    farmer.id || '',
    farmer.name || '',
    farmer.phone || '',
    farmer.businessName || '',
    Object.entries(farmer.farmingTypes || {})
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(', ') || '',
    Object.entries(farmer.mainCrop || {})
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(', ') || '',
    farmer.zipCode || '',
    farmer.roadAddress || '',
    farmer.jibunAddress || '',
    farmer.addressDetail || '',
    farmer.memo || '',
    farmer.ageGroup || '',
    farmer.canReceiveMail ? '가능' : '불가능',
    formatEquipments(farmer.equipments),
    farmer.createdAt ? new Date(farmer.createdAt).toLocaleString() : '',
    farmer.updatedAt ? new Date(farmer.updatedAt).toLocaleString() : ''
  ]);

  return [headers, ...rows];
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('받은 데이터 길이:', data.length);

    // 필수 환경 변수 체크 및 로깅
    const requiredEnvVars = {
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`다음 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}`);
    }

    // 데이터를 2차원 배열로 변환
    const jsonData = convertToSheetData(data);
    console.log('변환된 데이터 행 수:', jsonData.length);

    // Google Auth 설정 및 검증
    const credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, '\n'),
    };

    console.log('인증 정보 확인:', {
      hasClientEmail: !!credentials.client_email,
      privateKeyLength: credentials.private_key.length,
    });

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 시트 존재 여부 확인
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
      });
      console.log('시트 접근 확인 완료');
    } catch (error) {
      console.error('시트 접근 실패:', error);
      throw new Error('구글 시트에 접근할 수 없습니다. 권한을 확인해주세요.');
    }

    // 기존 데이터 삭제
    try {
      const clearResponse = await sheets.spreadsheets.values.clear({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: '시트1!A1:Z10000',
      });
      console.log('기존 데이터 삭제 완료:', clearResponse.status);
    } catch (error: any) {
      console.error('시트 클리어 중 오류:', error?.message);
      throw new Error(`기존 데이터 삭제 중 오류: ${error?.message || '알 수 없는 오류'}`);
    }

    // 새 데이터 추가
    try {
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: '시트1!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: jsonData,
        },
      });
      console.log('새 데이터 추가 완료:', appendResponse.status);
    } catch (error: any) {
      console.error('데이터 추가 중 오류:', error?.message);
      throw new Error(`새 데이터 추가 중 오류: ${error?.message || '알 수 없는 오류'}`);
    }

    return Response.json({ 
      success: true,
      message: `${jsonData.length - 1}건의 데이터가 성공적으로 동기화되었습니다.`
    });

  } catch (error: any) {
    console.error('구글 시트 동기화 에러:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    return Response.json({ 
      success: false,
      error: error?.message || '구글 시트 연동 중 오류가 발생했습니다.',
      details: error?.stack || '',
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
} 