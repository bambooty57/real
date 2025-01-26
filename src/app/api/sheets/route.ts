import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const maxDuration = 300; // 함수 실행 시간을 5분으로 연장

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('받은 데이터 길이:', data.length);

    // 필수 환경 변수 체크
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_SHEET_ID) {
      throw new Error('필수 환경 변수가 설정되지 않았습니다.');
    }

    // 데이터를 2차원 배열로 변환
    const headers = [
      'id',
      'name',
      'phone',
      'businessName',
      'farmingTypes',
      'mainCrop',
      'zipCode',
      'roadAddress',
      'jibunAddress',
      'addressDetail',
      'memo',
      'ageGroup',
      'canReceiveMail',
      'createdAt',
      'updatedAt'
    ];

    const jsonData = [headers];

    // 데이터 변환 및 유효성 검사
    for (const item of data) {
      try {
        const row = headers.map(header => {
          const value = item[header];
          
          if (header === 'farmingTypes' || header === 'mainCrop') {
            return value ? JSON.stringify(value) : '';
          }
          
          if (header === 'canReceiveMail') {
            return value ? '가능' : '불가능';
          }
          
          if (header === 'createdAt' || header === 'updatedAt') {
            if (!value) return '';
            try {
              const date = new Date(value);
              return date.toLocaleString('ko-KR');
            } catch {
              return value?.toString() || '';
            }
          }
          
          return value?.toString() || '';
        });
        jsonData.push(row);
      } catch (error) {
        console.error('데이터 변환 중 오류:', error, item);
        continue; // 오류가 있는 항목은 건너뛰고 계속 진행
      }
    }

    // Google Auth 설정
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 기존 데이터 삭제
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: '시트1!A1:Z10000',
      });
    } catch (error) {
      console.error('시트 클리어 중 오류:', error);
      throw new Error('기존 데이터 삭제 중 오류가 발생했습니다.');
    }

    // 새 데이터 추가
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: '시트1!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: jsonData,
        },
      });
    } catch (error) {
      console.error('데이터 추가 중 오류:', error);
      throw new Error('새 데이터 추가 중 오류가 발생했습니다.');
    }

    return Response.json({ 
      success: true,
      message: `${jsonData.length - 1}건의 데이터가 성공적으로 동기화되었습니다.`
    });

  } catch (error) {
    console.error('구글 시트 동기화 에러:', error);
    
    let errorMessage = '구글 시트 연동 중 오류가 발생했습니다.';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    return Response.json({ 
      success: false,
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
} 