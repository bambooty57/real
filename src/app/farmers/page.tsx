'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Farmer } from '@/types/farmer';
import { getFarmingTypeDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { BiRefresh } from 'react-icons/bi';

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedFarmingType, setSelectedFarmingType] = useState('');
  const [selectedMainCrop, setSelectedMainCrop] = useState('');
  const [selectedMailOption, setSelectedMailOption] = useState('all');
  const [selectedSaleType, setSelectedSaleType] = useState('all');
  const [villages, setVillages] = useState<Array<{ value: string, label: string }>>([]);
  const farmersPerPage = 15;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]);

  // 시/군/구 목록
  const cities = [
    { value: '나주시', label: '나주시' },
    { value: '목포시', label: '목포시' },
    { value: '순천시', label: '순천시' },
    { value: '여수시', label: '여수시' },
    { value: '광양시', label: '광양시' },
    { value: '담양군', label: '담양군' },
    { value: '곡성군', label: '곡성군' },
    { value: '구례군', label: '구례군' },
    { value: '고흥군', label: '고흥군' },
    { value: '보성군', label: '보성군' },
    { value: '화순군', label: '화순군' },
    { value: '장흥군', label: '장흥군' },
    { value: '강진군', label: '강진군' },
    { value: '해남군', label: '해남군' },
    { value: '영암군', label: '영암군' },
    { value: '무안군', label: '무안군' },
    { value: '함평군', label: '함평군' },
    { value: '영광군', label: '영광군' },
    { value: '장성군', label: '장성군' },
    { value: '완도군', label: '완도군' },
    { value: '진도군', label: '진도군' },
    { value: '신안군', label: '신안군' }
  ];

  // 선택된 시/군/구에 따른 읍/면/동 목록
  const getDistricts = (city: string) => {
    const districtMap: { [key: string]: Array<{ value: string, label: string }> } = {
      '나주시': [
        { value: '남평읍', label: '남평읍' },
        { value: '세지면', label: '세지면' },
        { value: '왕곡면', label: '왕곡면' },
        { value: '반남면', label: '반남면' },
        { value: '공산면', label: '공산면' },
        { value: '동강면', label: '동강면' },
        { value: '다시면', label: '다시면' },
        { value: '문평면', label: '문평면' },
        { value: '노안면', label: '노안면' },
        { value: '금천면', label: '금천면' },
        { value: '산포면', label: '산포면' },
        { value: '다도면', label: '다도면' },
        { value: '봉황면', label: '봉황면' },
        { value: '송월동', label: '송월동' },
        { value: '영강동', label: '영강동' },
        { value: '금남동', label: '금남동' },
        { value: '성북동', label: '성북동' },
        { value: '영산동', label: '영산동' }
      ],
      '담양군': [
        { value: '담양읍', label: '담양읍' },
        { value: '고서면', label: '고서면' },
        { value: '창평면', label: '창평면' },
        { value: '대덕면', label: '대덕면' },
        { value: '무정면', label: '무정면' },
        { value: '금성면', label: '금성면' },
        { value: '용면', label: '용면' },
        { value: '월산면', label: '월산면' },
        { value: '수북면', label: '수북면' },
        { value: '대전면', label: '대전면' },
        { value: '봉산면', label: '봉산면' },
        { value: '가사문학면', label: '가사문학면' }
      ],
      '장성군': [
        { value: '장성읍', label: '장성읍' },
        { value: '진원면', label: '진원면' },
        { value: '남면', label: '남면' },
        { value: '동화면', label: '동화면' },
        { value: '삼서면', label: '삼서면' },
        { value: '삼계면', label: '삼계면' },
        { value: '황룡면', label: '황룡면' },
        { value: '서삼면', label: '서삼면' },
        { value: '북일면', label: '북일면' },
        { value: '북이면', label: '북이면' },
        { value: '북하면', label: '북하면' }
      ],
      '목포시': [
        { value: '용당1동', label: '용당1동' },
        { value: '용당2동', label: '용당2동' },
        { value: '연동', label: '연동' },
        { value: '산정동', label: '산정동' },
        { value: '연산동', label: '연산동' },
        { value: '원산동', label: '원산동' },
        { value: '대성동', label: '대성동' },
        { value: '목원동', label: '목원동' },
        { value: '동명동', label: '동명동' },
        { value: '삼학동', label: '삼학동' },
        { value: '만호동', label: '만호동' },
        { value: '유달동', label: '유달동' },
        { value: '죽교동', label: '죽교동' },
        { value: '북항동', label: '북항동' },
        { value: '용해동', label: '용해동' },
        { value: '이로동', label: '이로동' },
        { value: '상동', label: '상동' },
        { value: '하당동', label: '하당동' },
        { value: '신흥동', label: '신흥동' }
      ],
      '순천시': [
        { value: '승주읍', label: '승주읍' },
        { value: '해룡면', label: '해룡면' },
        { value: '서면', label: '서면' },
        { value: '황전면', label: '황전면' },
        { value: '월등면', label: '월등면' },
        { value: '주암면', label: '주암면' },
        { value: '송광면', label: '송광면' },
        { value: '외서면', label: '외서면' },
        { value: '낙안면', label: '낙안면' },
        { value: '별량면', label: '별량면' }
      ],
      '여수시': [
        { value: '돌산읍', label: '돌산읍' },
        { value: '소라면', label: '소라면' },
        { value: '율촌면', label: '율촌면' },
        { value: '화양면', label: '화양면' },
        { value: '남면', label: '남면' },
        { value: '화정면', label: '화정면' }
      ],
      '광양시': [
        { value: '광양읍', label: '광양읍' },
        { value: '봉강면', label: '봉강면' },
        { value: '옥룡면', label: '옥룡면' },
        { value: '옥곡면', label: '옥곡면' },
        { value: '진상면', label: '진상면' },
        { value: '진월면', label: '진월면' },
        { value: '다압면', label: '다압면' }
      ],
      '곡성군': [
        { value: '곡성읍', label: '곡성읍' },
        { value: '오곡면', label: '오곡면' },
        { value: '삼기면', label: '삼기면' },
        { value: '석곡면', label: '석곡면' },
        { value: '목사동면', label: '목사동면' },
        { value: '죽곡면', label: '죽곡면' },
        { value: '고달면', label: '고달면' },
        { value: '옥과면', label: '옥과면' },
        { value: '입면', label: '입면' },
        { value: '겸면', label: '겸면' },
        { value: '오산면', label: '오산면' }
      ],
      '구례군': [
        { value: '구례읍', label: '구례읍' },
        { value: '문척면', label: '문척면' },
        { value: '간전면', label: '간전면' },
        { value: '토지면', label: '토지면' },
        { value: '마산면', label: '마산면' },
        { value: '광의면', label: '광의면' },
        { value: '용방면', label: '용방면' },
        { value: '산동면', label: '산동면' }
      ],
      '고흥군': [
        { value: '고흥읍', label: '고흥읍' },
        { value: '도양읍', label: '도양읍' },
        { value: '풍양면', label: '풍양면' },
        { value: '도덕면', label: '도덕면' },
        { value: '금산면', label: '금산면' },
        { value: '도화면', label: '도화면' },
        { value: '포두면', label: '포두면' },
        { value: '봉래면', label: '봉래면' },
        { value: '동일면', label: '동일면' },
        { value: '점암면', label: '점암면' },
        { value: '영남면', label: '영남면' },
        { value: '과역면', label: '과역면' },
        { value: '남양면', label: '남양면' },
        { value: '동강면', label: '동강면' },
        { value: '대서면', label: '대서면' },
        { value: '두원면', label: '두원면' }
      ],
      '보성군': [
        { value: '보성읍', label: '보성읍' },
        { value: '벌교읍', label: '벌교읍' },
        { value: '노동면', label: '노동면' },
        { value: '미력면', label: '미력면' },
        { value: '겸백면', label: '겸백면' },
        { value: '율어면', label: '율어면' },
        { value: '복내면', label: '복내면' },
        { value: '문덕면', label: '문덕면' },
        { value: '조성면', label: '조성면' },
        { value: '득량면', label: '득량면' },
        { value: '회천면', label: '회천면' },
        { value: '웅치면', label: '웅치면' }
      ],
      '화순군': [
        { value: '화순읍', label: '화순읍' },
        { value: '한천면', label: '한천면' },
        { value: '춘양면', label: '춘양면' },
        { value: '청풍면', label: '청풍면' },
        { value: '이양면', label: '이양면' },
        { value: '능주면', label: '능주면' },
        { value: '도곡면', label: '도곡면' },
        { value: '도암면', label: '도암면' },
        { value: '이서면', label: '이서면' },
        { value: '북면', label: '북면' },
        { value: '동복면', label: '동복면' },
        { value: '남면', label: '남면' },
        { value: '동면', label: '동면' }
      ],
      '장흥군': [
        { value: '장흥읍', label: '장흥읍' },
        { value: '관산읍', label: '관산읍' },
        { value: '대덕읍', label: '대덕읍' },
        { value: '용산면', label: '용산면' },
        { value: '안양면', label: '안양면' },
        { value: '장동면', label: '장동면' },
        { value: '장평면', label: '장평면' },
        { value: '유치면', label: '유치면' },
        { value: '부산면', label: '부산면' },
        { value: '회진면', label: '회진면' }
      ],
      '강진군': [
        { value: '강진읍', label: '강진읍' },
        { value: '군동면', label: '군동면' },
        { value: '칠량면', label: '칠량면' },
        { value: '대구면', label: '대구면' },
        { value: '도암면', label: '도암면' },
        { value: '신전면', label: '신전면' },
        { value: '성전면', label: '성전면' },
        { value: '작천면', label: '작천면' },
        { value: '병영면', label: '병영면' },
        { value: '옴천면', label: '옴천면' },
        { value: '마량면', label: '마량면' }
      ],
      '해남군': [
        { value: '해남읍', label: '해남읍' },
        { value: '삼산면', label: '삼산면' },
        { value: '화산면', label: '화산면' },
        { value: '현산면', label: '현산면' },
        { value: '송지면', label: '송지면' },
        { value: '북평면', label: '북평면' },
        { value: '북일면', label: '북일면' },
        { value: '옥천면', label: '옥천면' },
        { value: '계곡면', label: '계곡면' },
        { value: '마산면', label: '마산면' },
        { value: '황산면', label: '황산면' },
        { value: '산이면', label: '산이면' },
        { value: '문내면', label: '문내면' },
        { value: '화원면', label: '화원면' }
      ],
      '영암군': [
        { value: '영암읍', label: '영암읍' },
        { value: '삼호읍', label: '삼호읍' },
        { value: '덕진면', label: '덕진면' },
        { value: '금정면', label: '금정면' },
        { value: '신북면', label: '신북면' },
        { value: '시종면', label: '시종면' },
        { value: '도포면', label: '도포면' },
        { value: '군서면', label: '군서면' },
        { value: '서호면', label: '서호면' },
        { value: '학산면', label: '학산면' },
        { value: '미암면', label: '미암면' }
      ],
      '무안군': [
        { value: '무안읍', label: '무안읍' },
        { value: '일로읍', label: '일로읍' },
        { value: '삼향읍', label: '삼향읍' },
        { value: '몽탄면', label: '몽탄면' },
        { value: '청계면', label: '청계면' },
        { value: '현경면', label: '현경면' },
        { value: '망운면', label: '망운면' },
        { value: '해제면', label: '해제면' },
        { value: '운남면', label: '운남면' }
      ],
      '함평군': [
        { value: '함평읍', label: '함평읍' },
        { value: '손불면', label: '손불면' },
        { value: '신광면', label: '신광면' },
        { value: '학교면', label: '학교면' },
        { value: '엄다면', label: '엄다면' },
        { value: '대동면', label: '대동면' },
        { value: '나산면', label: '나산면' },
        { value: '해보면', label: '해보면' },
        { value: '월야면', label: '월야면' }
      ],
      '영광군': [
        { value: '영광읍', label: '영광읍' },
        { value: '백수읍', label: '백수읍' },
        { value: '홍농읍', label: '홍농읍' },
        { value: '대마면', label: '대마면' },
        { value: '묘량면', label: '묘량면' },
        { value: '불갑면', label: '불갑면' },
        { value: '군서면', label: '군서면' },
        { value: '군남면', label: '군남면' },
        { value: '염산면', label: '염산면' },
        { value: '법성면', label: '법성면' },
        { value: '낙월면', label: '낙월면' }
      ],
      '완도군': [
        { value: '완도읍', label: '완도읍' },
        { value: '금일읍', label: '금일읍' },
        { value: '노화읍', label: '노화읍' },
        { value: '군외면', label: '군외면' },
        { value: '신지면', label: '신지면' },
        { value: '고금면', label: '고금면' },
        { value: '약산면', label: '약산면' },
        { value: '청산면', label: '청산면' },
        { value: '소안면', label: '소안면' },
        { value: '금당면', label: '금당면' },
        { value: '보길면', label: '보길면' },
        { value: '생일면', label: '생일면' }
      ],
      '진도군': [
        { value: '진도읍', label: '진도읍' },
        { value: '군내면', label: '군내면' },
        { value: '고군면', label: '고군면' },
        { value: '의신면', label: '의신면' },
        { value: '임회면', label: '임회면' },
        { value: '지산면', label: '지산면' },
        { value: '조도면', label: '조도면' }
      ],
      '신안군': [
        { value: '지도읍', label: '지도읍' },
        { value: '압해읍', label: '압해읍' },
        { value: '증도면', label: '증도면' },
        { value: '임자면', label: '임자면' },
        { value: '자은면', label: '자은면' },
        { value: '비금면', label: '비금면' },
        { value: '도초면', label: '도초면' },
        { value: '흑산면', label: '흑산면' },
        { value: '하의면', label: '하의면' },
        { value: '신의면', label: '신의면' },
        { value: '장산면', label: '장산면' },
        { value: '안좌면', label: '안좌면' },
        { value: '팔금면', label: '팔금면' },
        { value: '암태면', label: '암태면' }
      ]
    };
    return districtMap[city] || [];
  };

  // 선택된 읍/면/동에 따른 리 목록
  const getVillages = (city: string, district: string) => {
    const villageMap: { [key: string]: { [key: string]: Array<{ value: string, label: string }> } } = {
      '나주시': {
        '남평읍': [
          { value: '남석리', label: '남석리' },
          { value: '대교리', label: '대교리' },
          { value: '교원리', label: '교원리' },
          { value: '오계리', label: '오계리' },
          { value: '서산리', label: '서산리' },
          { value: '동사리', label: '동사리' },
          { value: '광촌리', label: '광촌리' }
        ],
        '세지면': [
          { value: '내정리', label: '내정리' },
          { value: '동신리', label: '동신리' },
          { value: '대산리', label: '대산리' },
          { value: '성산리', label: '성산리' },
          { value: '덕산리', label: '덕산리' }
        ],
        '왕곡면': [
          { value: '신원리', label: '신원리' },
          { value: '월천리', label: '월천리' },
          { value: '옥곡리', label: '옥곡리' },
          { value: '장산리', label: '장산리' },
          { value: '본양리', label: '본양리' }
        ]
      },
      '담양군': {
        '담양읍': [
          { value: '백동리', label: '백동리' },
          { value: '천변리', label: '천변리' },
          { value: '양각리', label: '양각리' },
          { value: '가산리', label: '가산리' },
          { value: '운교리', label: '운교리' }
        ],
        '고서면': [
          { value: '성월리', label: '성월리' },
          { value: '주산리', label: '주산리' },
          { value: '원강리', label: '원강리' },
          { value: '덕촌리', label: '덕촌리' }
        ],
        '창평면': [
          { value: '유곡리', label: '유곡리' },
          { value: '장화리', label: '장화리' },
          { value: '도곡리', label: '도곡리' },
          { value: '용수리', label: '용수리' }
        ]
      },
      '영암군': {
        '영암읍': [
          { value: '동무리', label: '동무리' },
          { value: '서무리', label: '서무리' },
          { value: '남풍리', label: '남풍리' },
          { value: '북풍리', label: '북풍리' },
          { value: '회문리', label: '회문리' },
          { value: '교동리', label: '교동리' },
          { value: '춘양리', label: '춘양리' },
          { value: '망호리', label: '망호리' }
        ],
        '삼호읍': [
          { value: '난전리', label: '난전리' },
          { value: '용당리', label: '용당리' },
          { value: '서호리', label: '서호리' },
          { value: '나불리', label: '나불리' },
          { value: '삼포리', label: '삼포리' }
        ]
      }
    };
    return villageMap[city]?.[district] || [];
  };

  // 지역 선택 변경 핸들러들
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    setSelectedDistrict('');
    setSelectedVillage('');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setSelectedVillage('');
    if (selectedCity && district) {
      const villageList = getVillages(selectedCity, district);
      setVillages(villageList);
    } else {
      setVillages([]);
    }
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVillage(e.target.value);
  };

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const q = query(collection(db, 'farmers'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const farmersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Farmer[];
        setFarmers(farmersData);
      } catch (error) {
        console.error('Error fetching farmers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmers();
  }, []);

  // 주소에서 지역 정보 추출 함수 개선
  const parseAddress = (address: string | undefined) => {
    if (!address) return { city: '', district: '', village: '' };

    // 전라남도로 시작하는지 확인
    if (!address.startsWith('전라남도')) {
      return { city: '', district: '', village: '' };
    }

    let city = '';
    let district = '';
    let village = '';

    // 시/군 추출 - 정확한 매칭을 위해 패턴 사용
    for (const cityOption of cities) {
      const cityPattern = new RegExp(`전라남도\\s+${cityOption.value}\\b`);
      if (cityPattern.test(address)) {
        city = cityOption.value;
        break;
      }
    }

    // 읍/면/동 추출 - 정확한 매칭을 위해 패턴 사용
    if (city) {
      const districts = getDistricts(city);
      for (const districtOption of districts) {
        const districtPattern = new RegExp(`${districtOption.value}\\b`);
        if (districtPattern.test(address)) {
          district = districtOption.value;
          break;
        }
      }
    }

    // 리 추출 - 정확한 매칭을 위해 패턴 사용
    if (city && district) {
      const villages = getVillages(city, district);
      for (const villageOption of villages) {
        const villagePattern = new RegExp(`${villageOption.value}(리)?\\b`);
        if (villagePattern.test(address)) {
          village = villageOption.value;
          break;
        }
      }
    }

    return { city, district, village };
  };

  // 필터링 로직 개선
  const filteredFarmers = farmers.filter(farmer => {
    // 검색어 필터링
    const searchFields = [
      farmer.name || '',
      farmer.phone || '',
      farmer.businessName || '',
      farmer.roadAddress || '',
      farmer.jibunAddress || ''
    ];
    
    const matchesSearch = searchTerm === '' || searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 주소 파싱
    const roadAddressParts = parseAddress(farmer.roadAddress);
    const jibunAddressParts = parseAddress(farmer.jibunAddress);
    
    // 지역 필터링 - 도로명주소나 지번주소 중 하나라도 매칭되면 통과
    const matchesCity = !selectedCity || 
      roadAddressParts.city === selectedCity || 
      jibunAddressParts.city === selectedCity;

    const matchesDistrict = !selectedDistrict || 
      roadAddressParts.district === selectedDistrict || 
      jibunAddressParts.district === selectedDistrict;

    const matchesVillage = !selectedVillage || 
      roadAddressParts.village === selectedVillage || 
      jibunAddressParts.village === selectedVillage;

    const matchesRegion = matchesCity && matchesDistrict && matchesVillage;

    const matchesFarmingType = !selectedFarmingType || 
      (farmer.farmingTypes && farmer.farmingTypes[selectedFarmingType as keyof typeof farmer.farmingTypes]);

    const matchesMailOption = selectedMailOption === 'all' || 
      (selectedMailOption === 'yes' ? farmer.canReceiveMail : !farmer.canReceiveMail);

    const matchesSaleType = selectedSaleType === 'all' || 
      (farmer.equipments && farmer.equipments.some(eq => eq?.saleType === selectedSaleType));

    return matchesSearch && matchesRegion && matchesFarmingType && 
           matchesMailOption && matchesSaleType;
  });

  // 페이지네이션 로직
  const totalPages = Math.max(1, Math.ceil(filteredFarmers.length / farmersPerPage));
  // 현재 페이지가 총 페이지 수를 초과하지 않도록 보정
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const safeIndexOfLastFarmer = safeCurrentPage * farmersPerPage;
  const safeIndexOfFirstFarmer = safeIndexOfLastFarmer - farmersPerPage;
  const currentFarmers = filteredFarmers.slice(safeIndexOfFirstFarmer, safeIndexOfLastFarmer);

  const handleDelete = async (farmerId: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'farmers', farmerId));
        setFarmers(prev => prev.filter(farmer => farmer.id !== farmerId));
        toast.success('삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting farmer:', error);
        toast.error('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const q = query(collection(db, 'farmers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const farmersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Farmer[];
      setFarmers(farmersData);
      toast.success('목록이 새로고침되었습니다.');
    } catch (error) {
      console.error('Error refreshing farmers:', error);
      toast.error('새로고침 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 전체 선택/해제 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFarmers(currentFarmers.map(farmer => farmer.id));
    } else {
      setSelectedFarmers([]);
    }
  };

  // 개별 선택/해제 핸들러
  const handleSelectFarmer = (farmerId: string, checked: boolean) => {
    if (checked) {
      setSelectedFarmers(prev => [...prev, farmerId]);
    } else {
      setSelectedFarmers(prev => prev.filter(id => id !== farmerId));
    }
  };

  // 선택된 농민 삭제 핸들러
  const handleDeleteSelected = async () => {
    if (!selectedFarmers.length) return;
    
    if (window.confirm(`선택한 ${selectedFarmers.length}명의 농민을 삭제하시겠습니까?`)) {
      try {
        await Promise.all(selectedFarmers.map(id => deleteDoc(doc(db, 'farmers', id))));
        setFarmers(prev => prev.filter(farmer => !selectedFarmers.includes(farmer.id)));
        setSelectedFarmers([]);
        toast.success('선택한 농민들이 삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting farmers:', error);
        toast.error('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">농민 목록</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full hover:bg-gray-100 transition-all ${
              isRefreshing ? 'opacity-50' : ''
            }`}
          >
            <BiRefresh 
              className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>
        <div className="flex items-center gap-4">
          {selectedFarmers.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              선택 삭제 ({selectedFarmers.length})
            </button>
          )}
          <Link 
            href="/farmers/new" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            새 농민 등록
          </Link>
        </div>
      </div>

      {/* 필터 섹션 위에 전체 선택 체크박스 추가 */}
      <div className="mb-4 flex items-center">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedFarmers.length === currentFarmers.length && currentFarmers.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="text-gray-700">전체 선택</span>
        </label>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 검색어 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              검색
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 전화번호, 상호로 검색"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* 지역 필터 - 시/군/구 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시/군/구
            </label>
            <select
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              {cities.map(city => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>

          {/* 지역 필터 - 읍/면/동 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              읍/면/동
            </label>
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="w-full p-2 border rounded"
              disabled={!selectedCity}
            >
              <option value="">전체</option>
              {getDistricts(selectedCity).map(district => (
                <option key={district.value} value={district.value}>
                  {district.label}
                </option>
              ))}
            </select>
          </div>

          {/* 지역 필터 - 리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              리
            </label>
            <select
              value={selectedVillage}
              onChange={handleVillageChange}
              className="w-full p-2 border rounded"
              disabled={!selectedDistrict}
            >
              <option value="">전체</option>
              {villages.map(village => (
                <option key={village.value} value={village.value}>
                  {village.label}
                </option>
              ))}
            </select>
          </div>

          {/* 영농형태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              영농형태
            </label>
            <select
              value={selectedFarmingType}
              onChange={(e) => setSelectedFarmingType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="waterPaddy">수도작</option>
              <option value="fieldFarming">밭농사</option>
              <option value="orchard">과수원</option>
              <option value="livestock">축산업</option>
              <option value="forageCrop">사료작물</option>
            </select>
          </div>

          {/* 판매유형 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              판매유형
            </label>
            <select
              value={selectedSaleType}
              onChange={(e) => setSelectedSaleType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">전체</option>
              <option value="new">신규</option>
              <option value="used">중고</option>
            </select>
          </div>

          {/* 우편수취여부 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              우편수취여부
            </label>
            <select
              value={selectedMailOption}
              onChange={(e) => setSelectedMailOption(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">전체</option>
              <option value="yes">가능</option>
              <option value="no">불가능</option>
            </select>
          </div>
        </div>
      </div>

      {/* 농민 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentFarmers.map((farmer) => (
          <div key={farmer.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow relative">
            {/* 체크박스 추가 */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedFarmers.includes(farmer.id)}
                onChange={(e) => handleSelectFarmer(farmer.id, e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300"
              />
            </div>

            {/* 이미지 갤러리 */}
            <div className="relative h-48 rounded-t-lg overflow-hidden farmer-image-gallery">
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="h-full"
              >
                {/* 기본 사진들 */}
                {farmer.farmerImages && farmer.farmerImages.length > 0 ? (
                  farmer.farmerImages.map((image, index) => (
                    image && (
                      <SwiperSlide key={`farmer-${index}`}>
                        <div className="relative w-full h-full">
                          <Image
                            src={image.toString()}
                            alt={`${farmer.name}의 사진 ${index + 1}`}
                            fill
                            className="object-cover"
                            onError={(e: any) => {
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    )
                  ))
                ) : (
                  <SwiperSlide>
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">이미지 없음</span>
                    </div>
                  </SwiperSlide>
                )}

                {/* 농기계 및 부착장비 사진들 */}
                {farmer.equipments?.map((equipment, eqIndex) => (
                  <React.Fragment key={`eq-fragment-${eqIndex}`}>
                    {/* 농기계 이미지 */}
                    {equipment.images?.filter(Boolean).map((image, imgIndex) => (
                      <SwiperSlide key={`eq-${eqIndex}-${imgIndex}`}>
                        <div className="relative w-full h-full">
                          <Image
                            src={image.toString()}
                            alt={`${getKoreanEquipmentType(equipment.type)} 사진 ${imgIndex + 1}`}
                            fill
                            className="object-cover"
                            onError={(e: any) => {
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    ))}

                    {/* 부착장비 이미지 */}
                    {equipment.attachments?.map((attachment, attIndex) => 
                      attachment.images?.filter(Boolean).map((image, imgIndex) => (
                        <SwiperSlide key={`att-${eqIndex}-${attIndex}-${imgIndex}`}>
                          <div className="relative w-full h-full">
                            <Image
                              src={image.toString()}
                              alt={`${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 사진 ${imgIndex + 1}`}
                              fill
                              className="object-cover"
                              onError={(e: any) => {
                                e.target.src = '/placeholder-image.jpg';
                              }}
                            />
                          </div>
                        </SwiperSlide>
                      ))
                    )}
                  </React.Fragment>
                ))}
              </Swiper>
            </div>

            {/* 농민 정보 */}
            <div className="p-4">
              <div className="font-bold text-lg mb-2">{farmer.name}</div>
              <div className="text-gray-600 mb-1">{farmer.phone}</div>
              {farmer.businessName && (
                <div className="text-gray-600 mb-1">{farmer.businessName}</div>
              )}
              <div className="text-gray-500 text-sm mb-2">
                {farmer.roadAddress || farmer.jibunAddress}
              </div>
              
              {/* 영농형태 */}
              <div className="mb-2">
                <span className="font-medium">영농형태: </span>
                <span className="text-sm">
                  {Object.entries(farmer.farmingTypes || {})
                    .filter(([_, value]) => value)
                    .map(([key]) => getFarmingTypeDisplay(key))
                    .join(', ')}
                </span>
              </div>

              {/* 우편수취여부 */}
              <div className="mb-4">
                <span className="font-medium">우편수취: </span>
                <span className={`text-sm ${farmer.canReceiveMail ? 'text-green-600' : 'text-red-600'}`}>
                  {farmer.canReceiveMail ? 'O' : 'X'}
                </span>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-between mt-4">
                <Link
                  href={`/farmers/${farmer.id}`}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  상세보기
                </Link>
                <button
                  onClick={() => handleDelete(farmer.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {filteredFarmers.length > 0 && (
        <div className="mt-6">
          {/* 페이지 정보 */}
          <div className="text-center mb-4 text-gray-600">
            전체 {filteredFarmers.length}개 중 {safeIndexOfFirstFarmer + 1}-{Math.min(safeIndexOfLastFarmer, filteredFarmers.length)}
            <span className="mx-2">|</span>
            페이지 {safeCurrentPage}/{totalPages}
          </div>
          
          {/* 페이지 버튼 */}
          <div className="flex justify-center items-center space-x-1">
            {/* 처음으로 */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              &#171;
            </button>

            {/* 이전 */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              &#8249;
            </button>

            {/* 페이지 번호들 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(pageNum => {
                if (totalPages <= 7) return true;
                if (pageNum === 1 || pageNum === totalPages) return true;
                if (pageNum >= safeCurrentPage - 2 && pageNum <= safeCurrentPage + 2) return true;
                return false;
              })
              .map((pageNum, index, array) => {
                // 줄임표 표시 로직
                if (index > 0 && pageNum > array[index - 1] + 1) {
                  return (
                    <React.Fragment key={`ellipsis-${pageNum}`}>
                      <span className="px-2 py-1">...</span>
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded border ${
                          safeCurrentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      safeCurrentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

            {/* 다음 */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              &#8250;
            </button>

            {/* 끝으로 */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              &#187;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}