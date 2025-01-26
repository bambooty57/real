import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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
    if (!equipment) return '';
    const mainInfo = `${equipment.type || ''}(${equipment.manufacturer || ''})`;
    if (!equipment.attachments?.length) return mainInfo;
    
    const attachments = equipment.attachments
      .map((att: any) => `${att.type || ''}(${att.manufacturer || ''})`)
      .filter(Boolean)
      .join(', ');
    
    return attachments ? `${mainInfo} - ${attachments}` : mainInfo;
  }

  // 데이터 행 변환
  const rows = farmers.map(farmer => [
    farmer.id || '',
    farmer.name || '',
    farmer.phone || '',
    farmer.businessName || '',
    (farmer.farmingTypes && typeof farmer.farmingTypes === 'object' 
      ? Object.entries(farmer.farmingTypes)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(', ') 
      : ''),
    (farmer.mainCrop && typeof farmer.mainCrop === 'object'
      ? Object.entries(farmer.mainCrop)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(', ')
      : ''),
    farmer.zipCode || '',
    farmer.roadAddress || '',
    farmer.jibunAddress || '',
    farmer.addressDetail || '',
    farmer.memo || '',
    farmer.ageGroup || '',
    farmer.canReceiveMail ? '가능' : '불가능',
    (farmer.equipments || []).map(formatEquipment).filter(Boolean).join('; '),
    farmer.createdAt ? new Date(farmer.createdAt).toLocaleString('ko-KR') : '',
    farmer.updatedAt ? new Date(farmer.updatedAt).toLocaleString('ko-KR') : ''
  ]);

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