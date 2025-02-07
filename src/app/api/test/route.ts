import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. 환경변수 검증
    const { GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID } = process.env;
    
    if (!GOOGLE_SERVICE_ACCOUNT_KEY || !GOOGLE_SHEET_ID) {
      return NextResponse.json({
        success: false,
        error: '환경변수가 설정되지 않았습니다.'
      }, { status: 500 });
    }

    // 2. 서비스 계정 키 파싱 (Base64 디코딩 후 JSON 파싱)
    const decodedKey = Buffer.from(GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
    const credentials = JSON.parse(decodedKey);

    // 디버깅을 위한 로그 출력
    console.log('Decoded Service Account Key:', decodedKey);
    console.log('Parsed Credentials:', credentials);
    console.log('Private Key:', credentials.private_key);

    // 3. private_key 형식 확인 및 수정
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      console.log('Modified Private Key:', credentials.private_key);
    }

    // 4. 서비스 계정 인증 설정
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // 5. 시트 정보 읽기 시도
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID,
    });

    return NextResponse.json({
      success: true,
      message: '구글 시트 연결 성공',
      sheetTitle: response.data.properties?.title
    });

  } catch (error: any) {
    console.error('구글 시트 연결 테스트 오류:', error);
    return NextResponse.json({
      success: false,
      error: '구글 시트 연결 실패',
      details: error.message
    }, { status: 500 });
  }
} 