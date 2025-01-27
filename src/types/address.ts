export interface AddressStructure {
  시도: string;      // 예: 전남
  시군구: string;    // 예: 영암군
  읍면: string;      // 예: 영암읍
  리: string;        // 예: 회문리
  번지: string;      // 예: 186
}

// 전라남도 시군구 목록
export const 전라남도_시군구 = [
  '목포시',
  '여수시',
  '순천시',
  '나주시',
  '광양시',
  '담양군',
  '곡성군',
  '구례군',
  '고흥군',
  '보성군',
  '화순군',
  '장흥군',
  '강진군',
  '해남군',
  '영암군',
  '무안군',
  '함평군',
  '영광군',
  '장성군',
  '완도군',
  '진도군',
  '신안군'
] as const;

// 영암군 읍면 목록
export const 영암군_읍면 = [
  '영암읍',
  '삼호읍',
  '덕진면',
  '금정면',
  '신북면',
  '시종면',
  '도포면',
  '군서면',
  '서호면',
  '학산면',
  '미암면'
] as const;

// 영암읍 리 목록
export const 영암읍_리 = [
  '동무리',
  '서무리',
  '남풍리',
  '북풍리',
  '회문리',
  '교동리',
  '춘양리',
  '망호리',
  '개신리',
  '장암리',
  '송평리',
  '용흥리',
  '청소리',
  '역리',
  '서남리',
  '동무리',
  '서무리'
] as const; 