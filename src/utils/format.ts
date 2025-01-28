export function formatPhoneNumber(phone: string): string {
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 11자리 전화번호 (01012345678 -> 010-1234-5678)
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  // 10자리 전화번호 (0101234567 -> 010-123-4567)
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }
  
  // 8자리 전화번호 (12345678 -> 1234-5678)
  if (numbers.length === 8) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  }
  
  // 그 외의 경우 원본 반환
  return phone;
} 