import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // 함수 실행 시간을 60초로 설정

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  let retries = 0;
  let jsonData;

  try {
    const data = await req.json();
    console.log('받은 데이터 길이:', data.length);

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

    jsonData = [headers];
    data.forEach((item: any) => {
      const row = headers.map(header => {
        if (header === 'farmingTypes' || header === 'mainCrop') {
          return item[header] ? JSON.stringify(item[header]) : '';
        }
        return item[header]?.toString() || '';
      });
      jsonData.push(row);
    });

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_SHEET_ID) {
      throw new Error('필수 환경 변수가 설정되지 않았습니다.');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 기존 데이터 삭제
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: '시트1!A1:Z10000',
    });

    // 새 데이터 추가
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: '시트1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: jsonData,
      },
    });

    return Response.json({ 
      success: true,
      message: `${jsonData.length - 1}건의 데이터가 성공적으로 동기화되었습니다.`
    });

  } catch (error) {
    console.error('구글 시트 동기화 에러:', error);
    
    if (error instanceof Error) {
      return Response.json({ 
        success: false,
        error: error.message,
        details: '구글 시트 연동 중 오류가 발생했습니다.'
      }, { status: 500 });
    }
    
    return Response.json({ 
      success: false,
      error: '알 수 없는 오류가 발생했습니다.',
      details: '구글 시트 연동 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 