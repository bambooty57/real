'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore'
import { ref, deleteObject, listAll } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import Link from 'next/link'
import { FaFileExcel } from 'react-icons/fa'
import * as XLSX from 'xlsx-js-style'
import { Farmer } from '@/types/farmer'
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings'

interface AddressData {
  읍면동: string[];
  읍면: string[];
  동리: string[];
  시군구: string[];
  시도: string[];
}

const displayNames = {
  읍면동: '읍/면/동',
  읍면: '읍/면',
  동리: '동/리',
  시군구: '시/군/구',
  시도: '시/도'
} as const;

interface RegionData {
  읍면동?: string[] | { [key: string]: string[] };
  읍면?: { [key: string]: string[] } | string[];
}

interface JeonnamRegions {
  [city: string]: RegionData;
}

const JEONNAM_REGIONS: JeonnamRegions = {
  "목포시": {
    "읍면동": ["용당1동", "용당2동", "연동", "산정동", "연산동", "원산동", "대성동", "목원동", "동명동", "삼학동", "만호동", "유달동", "죽교동", "북항동", "용해동", "이로동", "상동", "하당동", "신흥동", "삼향동", "옥암동", "부주동"]
  },
  "여수시": {
    "읍면동": ["돌산읍", "소라면", "율촌면", "화양면", "남면", "화정면", "삼산면", "동문동", "한려동", "중앙동", "충무동", "광림동", "서강동", "대교동", "국동", "월호동", "여서동", "문수동", "미평동", "둔덕동", "만덕동", "쌍봉동", "시전동", "여천동", "주삼동", "삼일동", "묘도동"]
  },
  "순천시": {
    "읍면동": ["승주읍", "해룡면", "서면", "황전면", "월등면", "주암면", "송광면", "외서면", "낙안면", "별량면", "상사면", "중앙동", "향동", "매곡동", "삼산동", "조곡동", "덕연동", "풍덕동", "남제동", "저전동", "장천동", "도사동", "왕조1동", "왕조2동"]
  },
  "나주시": {
    "읍면동": {
      "남평읍": ["남평리", "교원리", "오계리", "서산리", "대교리", "광촌리", "평산리", "동산리", "상곡리", "삼영리", "우산리", "양산리"],
      "세지면": ["대산리", "내정리", "성산리", "벽산리", "송제리", "동곡리", "죽동리", "덕산리", "신정리", "내화리"],
      "왕곡면": ["덕산리", "신원리", "월천리", "본양리", "옥곡리", "신가리", "송죽리", "장산리", "화정리", "대곡리"],
      "반남면": ["흥덕리", "대안리", "청송리", "덕산리", "신촌리", "성계리", "석천리", "하촌리", "동촌리", "가운리"],
      "공산면": ["동촌리", "신곡리", "백사리", "화성리", "동산리", "신영리", "용두리", "복룡리", "중포리", "금곡리"],
      "동강면": ["인동리", "월송리", "대전리", "장동리", "옥정리", "진천리", "곡천리", "양지리", "대지리", "운산리"],
      "다시면": ["복암리", "신석리", "동곡리", "가운리", "죽산리", "문동리", "영동리", "월태리", "신광리", "송촌리"],
      "문평면": ["안곡리", "학교리", "산호리", "대도리", "신창리", "옥당리", "산정리", "북동리", "동원리", "청송리"],
      "노안면": ["금안리", "금천리", "양천리", "장동리", "금동리", "용산리", "영평리", "유곡리", "구정리", "계림리"],
      "금천면": ["오강리", "신천리", "동악리", "석전리", "광암리", "월산리", "신가리", "촌곡리", "고동리", "원곡리"],
      "산포면": ["등수리", "화지리", "신도리", "산제리", "매곡리", "송림리", "산음리", "덕례리", "내기리", "용산리"],
      "다도면": ["신동리", "덕동리", "궁원리", "방산리", "암정리", "판촌리", "도동리", "마산리", "덕림리", "복암리"],
      "봉황면": ["옥산리", "철천리", "죽석리", "용전리", "황용리", "유곡리", "장성리", "욱곡리", "오림리", "덕림리"]
    }
  },
  "광양시": {
    "읍면동": ["광양읍", "봉강면", "옥룡면", "옥곡면", "진상면", "진월면", "다압면", "골약동", "중마동", "광영동", "태인동", "금호동"]
  },
  "담양군": {
    "읍면": {
      "담양읍": ["담주리", "천변리", "객사리", "지침리", "양각리", "백동리", "만성리", "향교리", "강쟁리", "삼만리"],
      "봉산면": ["유산리", "대봉리", "신학리", "삼지리", "기곡리", "와우리", "봉산리", "송강리", "양지리", "제월리"],
      "고서면": ["성월리", "주산리", "동운리", "석현리", "덕수리", "고읍리", "보촌리", "원강리", "분향리", "덕촌리"],
      "남면": ["정곡리", "풍암리", "연천리", "학선리", "운교리", "지곡리", "삼지리", "양지리", "가암리", "무동리"],
      "창평면": ["유천리", "장화리", "용수리", "오강리", "서옥리", "도곡리", "삼천리", "정평리", "외동리", "마산리"],
      "대덕면": ["운산리", "매산리", "문학리", "장산리", "갈전리", "입석리", "대치리", "용대리", "신남리", "문봉리"],
      "무정면": ["봉안리", "오례리", "영천리", "동산리", "오방리", "덕곡리", "무정리", "성도리", "금성리", "청계리"],
      "금성면": ["금성리", "대곡리", "석현리", "원천리", "외추리", "봉황리", "삼오리", "대성리", "덕성리", "용대리"],
      "용면": ["용치리", "용연리", "월계리", "도림리", "두장리", "추성리", "서옥리", "정양리", "장찬리", "구산리"],
      "월산면": ["월계리", "화방리", "중월리", "용흥리", "신계리", "대방리", "삼거리", "월산리", "광암리", "오성리"],
      "수북면": ["대방리", "주평리", "개동리", "황금리", "소치리", "두정리", "대포리", "쌍봉리", "풍수리", "노동리"],
      "대전면": ["대치리", "평장리", "응용리", "만덕리", "행성리", "병풍리", "강의리", "서옥리", "운암리", "신율리"]
    }
  },
  "곡성군": {
    "읍면": ["곡성읍", "오곡면", "삼기면", "석곡면", "목사동면", "죽곡면", "고달면", "옥과면", "입면", "겸면", "오산면"]
  },
  "구례군": {
    "읍면": ["구례읍", "문척면", "간전면", "토지면", "마산면", "광의면", "용방면", "산동면"]
  },
  "고흥군": {
    "읍면": ["고흥읍", "도양읍", "풍양면", "도덕면", "금산면", "도화면", "포두면", "봉래면", "동일면", "점암면", "영남면", "과역면", "남양면", "동강면", "대서면", "두원면"]
  },
  "보성군": {
    "읍면": ["보성읍", "벌교읍", "노동면", "미력면", "겸백면", "율어면", "복내면", "문덕면", "조성면", "득량면", "회천면", "웅치면"]
  },
  "화순군": {
    "읍면": ["화순읍", "한천면", "춘양면", "청풍면", "이양면", "능주면", "도곡면", "도암면", "이서면", "북면", "동복면", "남면", "동면"]
  },
  "장흥군": {
    "읍면": ["장흥읍", "관산읍", "대덕읍", "용산면", "안양면", "장동면", "장평면", "유치면", "부산면", "회진면"]
  },
  "강진군": {
    "읍면": ["강진읍", "군동면", "칠량면", "대구면", "도암면", "신전면", "성전면", "작천면", "병영면", "옴천면", "마량면"]
  },
  "해남군": {
    "읍면": ["해남읍", "삼산면", "화산면", "현산면", "송지면", "북평면", "북일면", "옥천면", "계곡면", "마산면", "황산면", "산이면", "문내면", "화원면"]
  },
  "영암군": {
    "읍면": {
      "영암읍": ["동무리", "서무리", "남풍리", "북풍리", "회문리", "교동리", "춘양리", "망호리", "개신리", "장암리", "송평리", "용흥리", "청소리", "역리", "서남리", "대신리", "학정리", "내동리", "외동리"],
      "삼호읍": ["난전리", "산호리", "용당리", "서호리", "나불리", "삼포리", "동호리", "망산리", "방아리", "백야리", "호텍리", "세지리", "서창리", "대불리"],
      "덕진면": ["덕진리", "금강리", "영보리", "백계리", "용산리", "덕곡리", "월지리", "노송리", "장선리", "흥룡리"],
      "금정면": ["금정리", "연소리", "와운리", "청룡리", "세류리", "월평리", "아천리", "도갑리", "남송리", "용흥리", "구림리", "오룡리"],
      "신북면": ["월평리", "갈곡리", "장산리", "학동리", "금석리", "이천리", "철천리", "양계리", "모산리", "행정리", "대창리"],
      "시종면": ["신연리", "구산리", "금지리", "봉소리", "옥야리", "신학리", "태간리", "월악리", "송평리", "내동리", "가좌리", "원포리"],
      "도포면": ["도포리", "봉호리", "수산리", "영호리", "군서리", "구학리", "마산리", "덕화리", "원항리", "길성리"],
      "군서면": ["군서리", "해창리", "동구림리", "서구림리", "도장리", "월곡리", "성산리", "양장리", "마산리", "월암리"],
      "서호면": ["엄길리", "화송리", "쌍풍리", "태백리", "신호리", "청용리", "몽해리", "서호리", "장천리", "서호리"],
      "학산면": ["상월리", "용산리", "독천리", "매월리", "금계리", "학계리", "용소리", "영계리", "은곡리", "묵동리"],
      "미암면": ["미암리", "신한리", "채지리", "두억리", "호포리", "남산리", "덕계리", "선황리", "청천리", "미암리"]
    }
  },
  "무안군": {
    "읍면": ["무안읍", "일로읍", "삼향읍", "몽탄면", "청계면", "현경면", "망운면", "해제면", "운남면"]
  },
  "함평군": {
    "읍면": ["함평읍", "손불면", "신광면", "학교면", "엄다면", "대동면", "나산면", "해보면", "월야면"]
  },
  "영광군": {
    "읍면": ["영광읍", "백수읍", "홍농읍", "대마면", "묘량면", "불갑면", "군서면", "군남면", "염산면", "법성면", "낙월면"]
  },
  "장성군": {
    "읍면": ["장성읍", "진원면", "남면", "동화면", "삼서면", "삼계면", "황룡면", "서삼면", "북일면", "북이면", "북하면"]
  },
  "완도군": {
    "읍면": ["완도읍", "금일읍", "노화읍", "군외면", "신지면", "고금면", "약산면", "청산면", "소안면", "금당면", "보길면", "생일면"]
  },
  "진도군": {
    "읍면": ["진도읍", "군내면", "고군면", "의신면", "임회면", "지산면", "조도면"]
  },
  "신안군": {
    "읍면": ["지도읍", "압해읍", "증도면", "임자면", "자은면", "비금면", "도초면", "흑산면", "하의면", "신의면", "장산면", "안좌면", "팔금면", "암태면"]
  }
}

const EQUIPMENT_TYPES = ['트랙터', '이앙기', '콤바인', '지게차', '굴삭기', '스키로더'] as const
type EquipmentType = typeof EQUIPMENT_TYPES[number]

interface Equipment {
  type: EquipmentType
  manufacturer: string
  forSale?: boolean
  forPurchase?: boolean
  desiredPrice?: string
  purchasePrice?: string
  saleType?: 'new' | 'used'
  attachments?: {
    loader?: string
    rotary?: string
    frontWheel?: string
    rearWheel?: string
    cutter?: string
    rows?: string
    tonnage?: string
    size?: string
    bucketSize?: string
  }
  images?: string[]
}

interface AttachmentImages {
  loader?: string[]
  rotary?: string[]
  cutter?: string[]
  rows?: string[]
  tonnage?: string[]
  size?: string[]
  bucketSize?: string[]
  frontWheel?: string[]
  rearWheel?: string[]
}

interface Filter {
  name?: string
  phone?: string
  address?: string
  zipCode?: string
  canReceiveMail?: boolean
  equipmentType?: string
}

export default function FarmerList() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const [filter, setFilter] = useState({
    equipmentType: '',
    manufacturer: '',
    city: '',
    town: '',
    ri: '',
    saleType: '',
    farmingType: '',
    mainCrop: ''
  })
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{[key: string]: number}>({})
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // 지역 데이터
  const [cities] = useState<string[]>(Object.keys(JEONNAM_REGIONS))
  const [towns, setTowns] = useState<string[]>([])
  const [ris, setRis] = useState<string[]>([])

  const [farmingTypeFilters, setFarmingTypeFilters] = useState<{[key: string]: boolean}>({
    '수도작': false,
    '밭농사': false,
    '과수원': false,
    '축산업': false,
    '시설원예': false,
    '복합영농': false,
    '특용작물': false,
    '기타': false
  })

  // 필터 초기화 함수
  const resetFilters = () => {
    setFilter({
      equipmentType: '',
      manufacturer: '',
      city: '',
      town: '',
      ri: '',
      saleType: '',
      farmingType: '',
      mainCrop: ''
    })
    setFarmingTypeFilters({
      '수도작': false,
      '밭농사': false,
      '과수원': false,
      '축산업': false,
      '시설원예': false,
      '복합영농': false,
      '특용작물': false,
      '기타': false
    })
    setSearchTerm('')
  }

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'farmers'))
        const farmerList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Farmer[]
        setFarmers(farmerList)

        // 선택된 시/군/읍/면/동에 해당하는 모든 리 데이터 수집
        if (filter.city && filter.town) {
          const uniqueRis = new Set<string>()
          farmerList.forEach(farmer => {
            if (farmer.roadAddress?.includes(filter.city) && farmer.roadAddress?.includes(filter.town)) {
              const addressParts = farmer.roadAddress.split(' ')
              const riPart = addressParts.find(part => part.endsWith('리'))
              if (riPart) uniqueRis.add(riPart)
            }
            if (farmer.jibunAddress?.includes(filter.city) && farmer.jibunAddress?.includes(filter.town)) {
              const addressParts = farmer.jibunAddress.split(' ')
              const riPart = addressParts.find(part => part.endsWith('리'))
              if (riPart) uniqueRis.add(riPart)
            }
          })
          setRis(Array.from(uniqueRis).sort())
        }
      } catch (error) {
        console.error('Error fetching farmers:', error)
        alert('농민 목록을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchFarmers()
  }, [filter.city, filter.town])

  // 시/군 선택 시 읍/면/동 목록 업데이트
  useEffect(() => {
    if (filter.city) {
      const cityData = JEONNAM_REGIONS[filter.city]
      if (cityData) {
        const townData = cityData["읍면동"] || cityData["읍면"]
        if (townData) {
          const townList = Array.isArray(townData) ? townData : Object.keys(townData)
          setTowns(townList)
        } else {
          setTowns([])
        }
      }
      setFilter(prev => ({ ...prev, town: '', ri: '' }))
      setRis([])
    } else {
      setTowns([])
      setRis([])
    }
  }, [filter.city])

  // 읍/면/동 선택 시 리 목록 업데이트
  useEffect(() => {
    if (filter.city && filter.town) {
      const cityData = JEONNAM_REGIONS[filter.city]
      if (cityData) {
        const townData = cityData["읍면동"] || cityData["읍면"]
        if (townData && !Array.isArray(townData)) {
          const riList = townData[filter.town] || []
          setRis(riList)
        } else {
          setRis([])
        }
      }
      setFilter(prev => ({ ...prev, ri: '' }))
    } else {
      setRis([])
    }
  }, [filter.city, filter.town])

  const filteredFarmers = farmers.filter(farmer => {
    // 검색어 필터링
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const searchFields = [
        farmer.name || '',
        farmer.businessName || '',
        farmer.roadAddress || '',
        farmer.jibunAddress || '',
        farmer.phone || '',
        farmer.memo || '',
        // 농기계 정보 검색
        ...(Array.isArray(farmer.equipments) ? farmer.equipments.map(eq => [
          eq?.type ? getKoreanEquipmentType(eq.type) : '',
          eq?.manufacturer ? getKoreanManufacturer(eq.manufacturer) : '',
          eq?.model || '',
          ...(Array.isArray(eq?.attachments) ? eq.attachments.map(a => [
            a?.manufacturer ? getKoreanManufacturer(a.manufacturer) : '',
            a?.model || ''
          ]).flat() : [])
        ]).flat() : [])
      ].filter(Boolean).map(field => field.toLowerCase());

      if (!searchFields.some(field => field.includes(searchLower))) {
        return false;
      }
    }

    // 영농형태 필터링
    const selectedFarmingTypes = Object.entries(farmingTypeFilters)
      .filter(([_, isSelected]) => isSelected)
      .map(([type]) => type.toLowerCase());

    if (selectedFarmingTypes.length > 0) {
      if (!farmer.farmingTypes || !selectedFarmingTypes.some(type => 
        farmer.farmingTypes[type as keyof typeof farmer.farmingTypes]
      )) {
        return false;
      }
    }

    // 지역 필터링
    if (filter.city) {
      const cityMatch = (farmer.roadAddress && farmer.roadAddress.includes(filter.city)) ||
                       (farmer.jibunAddress && farmer.jibunAddress.includes(filter.city));
      if (!cityMatch) return false;
    }
    if (filter.town) {
      const townMatch = (farmer.roadAddress && farmer.roadAddress.includes(filter.town)) ||
                       (farmer.jibunAddress && farmer.jibunAddress.includes(filter.town));
      if (!townMatch) return false;
    }
    if (filter.ri) {
      const riMatch = (farmer.roadAddress && farmer.roadAddress.includes(filter.ri)) ||
                     (farmer.jibunAddress && farmer.jibunAddress.includes(filter.ri));
      if (!riMatch) return false;
    }

    // 농기계 종류 필터링
    if (filter.equipmentType && (!farmer.equipments || !farmer.equipments.some(eq => 
      getKoreanEquipmentType(eq.type).toLowerCase() === filter.equipmentType.toLowerCase()
    ))) {
      return false;
    }

    // 제조사 필터링
    if (filter.manufacturer && (!farmer.equipments || !farmer.equipments.some(eq => 
      getKoreanManufacturer(eq.manufacturer).toLowerCase() === filter.manufacturer.toLowerCase()
    ))) {
      return false;
    }

    // 판매구분 필터링
    if (filter.saleType && filter.saleType !== '전체') {
      const hasMatchingSaleType = farmer.equipments && farmer.equipments.some(eq => 
        eq.saleType === filter.saleType
      );
      if (!hasMatchingSaleType) return false;
    }

    // 주작물 필터링
    if (filter.mainCrop && filter.mainCrop !== '전체' && !farmer.mainCrop[filter.mainCrop.toLowerCase() as keyof typeof farmer.mainCrop]) {
      return false;
    }

    return true;
  });

  // 이미지 슬라이더 함수
  const nextImage = (farmerId: string, imageType: string, maxLength: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [`${farmerId}-${imageType}`]: ((prev[`${farmerId}-${imageType}`] || 0) + 1) % maxLength
    }))
  }

  const prevImage = (farmerId: string, imageType: string, maxLength: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [`${farmerId}-${imageType}`]: ((prev[`${farmerId}-${imageType}`] || 0) - 1 + maxLength) % maxLength
    }))
  }

  // 통합 이미지 배열 생성 함수
  const getAllImages = (farmer: Farmer) => {
    const images: {url: string, type: string}[] = []
    
    // 농민 사진 (가장 먼저 표시)
    if (farmer.farmerImages && Array.isArray(farmer.farmerImages) && farmer.farmerImages.length > 0) {
      farmer.farmerImages.forEach(url => {
        if (url && typeof url === 'string' && url.trim() !== '') {
          images.push({ url, type: '농민사진' })
        }
      })
    }
    
    // 장비 사진
    if (farmer.equipments && Array.isArray(farmer.equipments)) {
      farmer.equipments.forEach((equipment, index) => {
        if (equipment.images && Array.isArray(equipment.images)) {
          equipment.images.forEach(url => {
            if (url && typeof url === 'string' && url.trim() !== '') {
              images.push({ 
                url, 
                type: `${getKoreanEquipmentType(equipment.type)} ${index + 1}`
              })
            }
          })
        }
      })
    }
    
    // 부착물 사진
    if (farmer.attachmentImages) {
      const displayNames: {[key: string]: string} = {
        loader: '로더',
        rotary: '로타리',
        frontWheel: '전륜',
        rearWheel: '후륜',
        cutter: '커터',
        rows: '열수',
        tonnage: '톤수',
        size: '규격',
        bucketSize: '버켓용량'
      }

      Object.entries(farmer.attachmentImages).forEach(([key, urls]) => {
        if (Array.isArray(urls)) {
          urls.forEach(url => {
            if (url && typeof url === 'string' && url.trim() !== '') {
              images.push({ 
                url, 
                type: `${displayNames[key] || key}`
              })
            }
          })
        }
      })
    }
    
    return images
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedFarmers(filteredFarmers.filter(farmer => farmer.id).map(farmer => farmer.id as string))
    } else {
      setSelectedFarmers([])
    }
  }

  const handleSelectFarmer = (id: string) => {
    setSelectedFarmers(prev => {
      if (prev.includes(id)) {
        return prev.filter(farmerId => farmerId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedFarmers.map(async (id) => {
        // Storage에서 농민 관련 모든 이미지 삭제
        const storageRef = ref(storage, `farmers/${id}`)
        const fileList = await listAll(storageRef)
        
        // 모든 파일과 하위 폴더의 파일들 삭제
        const deletePromises = [
          ...fileList.items.map(fileRef => deleteObject(fileRef)),
          ...await Promise.all(fileList.prefixes.map(async (folderRef) => {
            const subFiles = await listAll(folderRef)
            return Promise.all(subFiles.items.map(fileRef => deleteObject(fileRef)))
          }))
        ]
        
        await Promise.all(deletePromises)
        
        // Firestore 문서 삭제
        await deleteDoc(doc(db, 'farmers', id))
      }))
      
      setFarmers(prev => prev.filter(farmer => farmer.id && !selectedFarmers.includes(farmer.id)))
    } catch (error) {
      console.error('Error deleting farmers:', error)
      alert('농민 정보 삭제 중 오류가 발생했습니다.')
    }
    setDeleteModalOpen(false)
    setSelectedFarmers([])
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      // Storage에서 농민 관련 모든 이미지 삭제
      const storageRef = ref(storage, `farmers/${id}`)
      const fileList = await listAll(storageRef)
      
      // 모든 파일 삭제
      await Promise.all([
        ...fileList.items.map(fileRef => deleteObject(fileRef)),
        ...fileList.prefixes.map(async (folderRef) => {
          const subFiles = await listAll(folderRef)
          return Promise.all(subFiles.items.map(fileRef => deleteObject(fileRef)))
        })
      ])

      // Firestore 문서 삭제
      await deleteDoc(doc(db, 'farmers', id))
      
      setFarmers(prev => prev.filter(farmer => farmer.id !== id))
      alert('삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting farmer:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // 엑셀 다운로드 함수 추가
  const handleExcelDownload = () => {
    const excelData = filteredFarmers.map(farmer => ({
      'ID': farmer.id,
      '이름': farmer.name,
      '상호': farmer.businessName || '',
      '연령대': farmer.ageGroup || '',
      '전화번호': farmer.phone || '',
      '우편번호': farmer.zipCode || '',
      '지번주소': farmer.jibunAddress || '',
      '도로명주소': farmer.roadAddress || '',
      '상세주소': farmer.addressDetail || '',
      '우편수취가능여부': farmer.canReceiveMail ? '가능' : '불가능',
      '영농형태': getFarmingTypeDisplay(farmer.farmingTypes) || '',
      '주작물': getMainCropDisplay(farmer.mainCrop) || '',
      '보유농기계': farmer.equipments?.map(eq => 
        `${getKoreanEquipmentType(eq.type)}(${getKoreanManufacturer(eq.manufacturer)})`
      ).join(', ') || '',
      '농민정보메모': farmer.memo || ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "농민목록");
    
    // 열 너비 자동 조정
    const colWidths = [
      { wch: 20 },  // ID
      { wch: 10 },  // 이름
      { wch: 15 },  // 상호
      { wch: 10 },  // 연령대
      { wch: 15 },  // 전화번호
      { wch: 10 },  // 우편번호
      { wch: 30 },  // 지번주소
      { wch: 30 },  // 도로명주소
      { wch: 20 },  // 상세주소
      { wch: 15 },  // 우편수취가능여부
      { wch: 15 },  // 영농형태
      { wch: 20 },  // 주작물
      { wch: 40 },  // 보유농기계
      { wch: 50 },  // 농민정보메모
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, "농민목록.xlsx");
  };

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse text-center">데이터를 불러오는 중...</div>
    </div>
  )

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">농민 목록</h1>
          <span className="text-gray-600">
            검색 {filteredFarmers.length}명 / 총 {farmers.length}명
          </span>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedFarmers.length === filteredFarmers.length && filteredFarmers.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4"
            />
            <span>전체 선택</span>
          </div>
          {selectedFarmers.length > 0 && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              선택 삭제 ({selectedFarmers.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
          <button
            onClick={handleExcelDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaFileExcel />
            엑셀 다운로드
          </button>
          <Link href="/farmers/new" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            농민 등록
          </Link>
        </div>
      </div>

      {/* 통합검색란 추가 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="이름, 상호명, 주소, 전화번호, 메모, 농기계 정보 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">검색 필터</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 시/군 필터 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">시/군</label>
            <div className="relative">
              <select
                value={filter.city}
                onChange={(e) => setFilter(prev => ({ ...prev, city: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="전체">전체</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 읍/면/동 필터 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">읍/면/동</label>
            <div className="relative">
              <select
                value={filter.town}
                onChange={(e) => setFilter(prev => ({ ...prev, town: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                disabled={!filter.city}
              >
                <option value="전체">전체</option>
                {towns.map(town => (
                  <option key={town} value={town}>{town}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 리 필터 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">리</label>
            <div className="relative">
              <select
                value={filter.ri}
                onChange={(e) => setFilter(prev => ({ ...prev, ri: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                disabled={!filter.town}
              >
                <option value="전체">전체</option>
                {ris.map(ri => (
                  <option key={ri} value={ri}>{ri}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 영농형태 필터 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">영농형태</label>
            <div className="grid grid-cols-2 gap-2 p-2 border rounded-lg bg-white">
              {Object.keys(farmingTypeFilters).map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={farmingTypeFilters[type]}
                    onChange={(e) => {
                      setFarmingTypeFilters(prev => ({
                        ...prev,
                        [type]: e.target.checked
                      }))
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 주작물 필터 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">주작물</label>
            <div className="relative">
              <select
                value={filter.mainCrop}
                onChange={(e) => setFilter(prev => ({ ...prev, mainCrop: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="전체">전체</option>
                <option value="벼">벼</option>
                <option value="보리">보리</option>
                <option value="밀">밀</option>
                <option value="콩">콩</option>
                <option value="고추">고추</option>
                <option value="마늘">마늘</option>
                <option value="양파">양파</option>
                <option value="감자">감자</option>
                <option value="고구마">고구마</option>
                <option value="배추">배추</option>
                <option value="무">무</option>
                <option value="참깨">참깨</option>
                <option value="들깨">들깨</option>
                <option value="땅콩">땅콩</option>
                <option value="인삼">인삼</option>
                <option value="버섯">버섯</option>
                <option value="파">파</option>
                <option value="생강">생강</option>
                <option value="당근">당근</option>
                <option value="상추">상추</option>
                <option value="시금치">시금치</option>
                <option value="호박">호박</option>
                <option value="오이">오이</option>
                <option value="가지">가지</option>
                <option value="토마토">토마토</option>
                <option value="딸기">딸기</option>
                <option value="포도">포도</option>
                <option value="사과">사과</option>
                <option value="배">배</option>
                <option value="복숭아">복숭아</option>
                <option value="감귤">감귤</option>
                <option value="자두">자두</option>
                <option value="매실">매실</option>
                <option value="블루베리">블루베리</option>
                <option value="한우">한우</option>
                <option value="젖소">젖소</option>
                <option value="돼지">돼지</option>
                <option value="닭">닭</option>
                <option value="오리">오리</option>
                <option value="염소">염소</option>
                <option value="양봉">양봉</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 농기계 종류 필터 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">농기계 종류</label>
            <div className="relative">
              <select
                value={filter.equipmentType}
                onChange={(e) => setFilter(prev => ({ ...prev, equipmentType: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="전체">전체</option>
                {EQUIPMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 제조사 필터 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">제조사</label>
            <div className="relative">
              <select
                value={filter.manufacturer}
                onChange={(e) => setFilter(prev => ({ ...prev, manufacturer: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="전체">전체</option>
                {[
                  '대동', '국제', '엘에스', '얀마', '구보다', '존디어', '뉴홀랜드', 
                  '엠에프', '케이스', '현대', '삼성', '볼보', '히타치', '두산', 
                  '클라스', '아그리코', '스타', '시보레', '발메트', '동양', '아세아',
                  '이세키', '펜트', '도이츠', '세임', '란디니', '발트라', '제토',
                  '키오티', '금성', '피아트', '대우', '텍스트론', '맥코믹', '시바우마',
                  'TYM', '마힌드라'
                ].map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 판매구분 필터 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">판매구분</label>
            <div className="relative">
              <select
                value={filter.saleType}
                onChange={(e) => setFilter(prev => ({ ...prev, saleType: e.target.value }))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="전체">전체</option>
                <option value="new">신규</option>
                <option value="used">중고</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFarmers
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map(farmer => (
          <div key={farmer.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={farmer.id ? selectedFarmers.includes(farmer.id) : false}
                  onChange={() => farmer.id && handleSelectFarmer(farmer.id)}
                  className="w-4 h-4"
                />
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{farmer.name}</h2>
                  {farmer.businessName && (
                    <span className="text-gray-600">({farmer.businessName})</span>
                  )}
                </div>
              </div>
              <div className="space-x-2">
                {farmer.equipments.some(equipment => equipment.forSale) && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    판매
                  </span>
                )}
                {farmer.equipments.some(equipment => equipment.forPurchase) && (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    구매
                  </span>
                )}
              </div>
            </div>

            <Link href={`/farmers/${farmer.id}`} className="block">
              <div className="relative h-48">
                {(() => {
                  const allImages = getAllImages(farmer)
                  const currentIndex = currentImageIndexes[`${farmer.id}-all`] || 0
                  
                  if (allImages.length > 0) {
                    const currentImage = allImages[currentIndex]
                    return (
                      <>
                        <div className="relative h-48">
                          <img
                            src={currentImage.url}
                            alt={`${currentImage.type}`}
                            className="w-full h-full object-cover rounded"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = '/placeholder.jpg';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            {currentImage.type} - {currentIndex + 1} / {allImages.length}
                          </div>
                        </div>
                        {allImages.length > 1 && (
                          <div className="absolute inset-0 flex items-center justify-between px-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (farmer.id) {
                                  prevImage(farmer.id, 'all', allImages.length)
                                }
                              }}
                              className="bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
                            >
                              ←
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (farmer.id) {
                                  nextImage(farmer.id, 'all', allImages.length)
                                }
                              }}
                              className="bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
                            >
                              →
                            </button>
                          </div>
                        )}
                      </>
                    )
                  }
                  return (
                    <div className="w-full h-full rounded bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-400">등록된 사진이 없습니다</p>
                    </div>
                  )
                })()}
              </div>
            </Link>

            <div className="space-y-1 text-sm">
              {/* 전화번호 */}
              <div className="flex items-center">
                <span className="font-medium min-w-[80px]">전화번호:</span>
                <a 
                  href={`tel:${farmer.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {farmer.phone}
                </a>
              </div>

              {/* 우편번호 */}
              {farmer.zipCode && (
                <div className="flex items-center">
                  <span className="font-medium min-w-[80px]">우편번호:</span>
                  <span>{farmer.zipCode}</span>
                </div>
              )}

              {/* 도로명주소 */}
              {farmer.roadAddress && (
                <div className="flex items-center">
                  <span className="font-medium min-w-[80px]">도로명:</span>
                  <a 
                    href={`https://map.kakao.com/link/search/${farmer.roadAddress}${farmer.addressDetail ? ` ${farmer.addressDetail}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {farmer.roadAddress}
                  </a>
                </div>
              )}

              {/* 지번주소 */}
              {farmer.jibunAddress && (
                <div className="flex items-center">
                  <span className="font-medium min-w-[80px]">지번:</span>
                  <a 
                    href={`https://map.kakao.com/link/search/${farmer.jibunAddress}${farmer.addressDetail ? ` ${farmer.addressDetail}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {farmer.jibunAddress}
                  </a>
                </div>
              )}

              {/* 상세주소 */}
              {farmer.addressDetail && (
                <div className="flex items-center">
                  <span className="font-medium min-w-[80px]">상세주소:</span>
                  <span>{farmer.addressDetail}</span>
                </div>
              )}

              {/* 우편수취가능여부 */}
              <div className="flex items-center">
                <span className="font-medium min-w-[80px]">우편수취:</span>
                <span className={farmer.canReceiveMail ? "text-blue-600" : "text-red-600"}>
                  {farmer.canReceiveMail ? "가능" : "불가능"}
                </span>
              </div>

              {/* 농기계 */}
              <div className="flex items-start">
                <span className="font-medium min-w-[80px]">농기계:</span>
                <div className="flex-1">
                  {farmer.equipments && farmer.equipments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {farmer.equipments.map((equipment, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span>{getKoreanEquipmentType(equipment.type)} ({getKoreanManufacturer(equipment.manufacturer)})</span>
                          {equipment.saleType && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              equipment.saleType === 'new' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {equipment.saleType === 'new' ? '신규' : '중고'}
                            </span>
                          )}
                          {equipment.forSale && 
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 rounded">
                              판매가: {equipment.desiredPrice}만원
                            </span>
                          }
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">미등록</span>
                  )}
                </div>
              </div>

              {/* 메모 */}
              {farmer.memo && (
                <div className="flex items-start">
                  <span className="font-medium min-w-[80px]">메모:</span>
                  <div className="flex-1 max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <span className="text-gray-600 block">{farmer.memo}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Link 
                href={`/farmers/${farmer.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                상세보기
                <span className="ml-1">→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 UI */}
      <div className="mt-6 flex justify-center items-center space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          이전
        </button>
        {Array.from({ length: Math.ceil(filteredFarmers.length / itemsPerPage) }, (_, i) => i + 1)
          .filter(pageNum => {
            const currentPageRange = 2;
            return (
              pageNum === 1 ||
              pageNum === Math.ceil(filteredFarmers.length / itemsPerPage) ||
              (pageNum >= currentPage - currentPageRange && pageNum <= currentPage + currentPageRange)
            );
          })
          .map((pageNum, index, array) => (
            <React.Fragment key={pageNum}>
              {index > 0 && array[index - 1] !== pageNum - 1 && (
                <span className="px-2">...</span>
              )}
              <button
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 border rounded-lg ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            </React.Fragment>
          ))}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredFarmers.length / itemsPerPage)))}
          disabled={currentPage === Math.ceil(filteredFarmers.length / itemsPerPage)}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          다음
        </button>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">농민 정보 삭제</h3>
            <p>{selectedFarmers.length}명의 농민 정보를 삭제하시겠습니까?</p>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                삭제
              </button>
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 