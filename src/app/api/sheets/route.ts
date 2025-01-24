import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // 함수 실행 시간을 60초로 설정

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  const MAX_RETRIES = 3;
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
      'equipments',
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
        if (header === 'equipments') {
          return Array.isArray(item[header]) ? item[header].join(', ') : '';
        }
        return item[header]?.toString() || '';
      });
      jsonData.push(row);
    });

  } catch (error) {
    return Response.json({ error: '데이터 파싱 오류' }, { status: 400 });
  }

  while (retries < MAX_RETRIES) {
    try {
      if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
        throw new Error('필수 환경 변수가 설정되지 않았습니다.');
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY,
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
      const response = await sheets.spreadsheets.values.append({
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
      console.error(`시도 ${retries + 1}회 실패:`, error);
      retries++;
      
      if (retries === MAX_RETRIES) {
        return Response.json({ 
          error: '구글 시트 업데이트 실패',
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
      
      // 재시도 전 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
} 