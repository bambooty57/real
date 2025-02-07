import { google } from 'googleapis';

export async function getGoogleAuth() {
  const { GOOGLE_CLIENT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;
  
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Google 서비스 계정 설정이 누락되었습니다.');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
} 