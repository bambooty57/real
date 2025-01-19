'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { ref, deleteObject, listAll } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import Link from 'next/link'

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
    "읍면": ["영암읍", "삼호읍", "덕진면", "금정면", "신북면", "시종면", "도포면", "군서면", "서호면", "학산면", "미암면"]
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
  year?: string         // 연식 (파이어베이스의 필드명과 일치)
  model?: string        // 모델명
  usageHours?: string   // 사용시간
  forSale?: boolean
  forPurchase?: boolean
  desiredPrice?: string
  purchasePrice?: string
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

interface Farmer {
  id: string
  name: string
  businessName?: string
  roadAddress: string      // 도로명 주소
  jibunAddress: string     // 지번 주소
  addressDetail?: string   // 상세 주소
  phone: string
  mainCrop: string
  ageGroup: string
  equipments: Equipment[]
  farmerImages?: string[]
  attachmentImages?: AttachmentImages
  memo?: string
}

// 농기계 타입 매핑
const equipmentTypeMap: { [key: string]: string } = {
  'tractor': '트랙터',
  'combine': '콤바인',
  'rice_transplanter': '이앙기',
  'forklift': '지게차',
  'excavator': '굴삭기',
  'skid_loader': '스키로더'
}

// 제조사 매핑
const manufacturerMap: { [key: string]: string } = {
  'john_deere': '존디어',
  'kubota': '구보다',
  'daedong': '대동',
  'kukje': '국제',
  'ls': '엘에스',
  'yanmar': '얀마',
  'newholland': '뉴홀랜드',
  'mf': '엠에프',
  'case': '케이스',
  'hyundai': '현대',
  'samsung': '삼성',
  'volvo': '볼보',
  'hitachi': '히타치',
  'doosan': '두산',
  'claas': '클라스',
  'agrico': '아그리코',
  'star': '스타',
  'chevrolet': '시보레',
  'valmet': '발메트'
}

// 한글 변환 함수
const getKoreanEquipmentType = (type: string): string => {
  return equipmentTypeMap[type.toLowerCase()] || type
}

const getKoreanManufacturer = (manufacturer: string): string => {
  return manufacturerMap[manufacturer.toLowerCase()] || manufacturer
}

export default function FarmerList() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({
    ageGroup: '',
    equipmentType: '',
    manufacturer: '',
    city: '',
    town: '',
    ri: '',
    tradeType: '',
    attachment: ''
  })
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{[key: string]: number}>({})
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // 지역 데이터
  const [cities] = useState<string[]>(Object.keys(JEONNAM_REGIONS))
  const [towns, setTowns] = useState<string[]>([])
  const [ris, setRis] = useState<string[]>([])

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'farmers'))
        const farmerList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Farmer[]
        setFarmers(farmerList)
      } catch (error) {
        console.error('Error fetching farmers:', error)
        alert('농민 목록을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchFarmers()
  }, [])

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
    const matchesSearch = 
      farmer.name.includes(searchTerm) ||
      farmer.phone.includes(searchTerm) ||
      farmer.mainCrop.includes(searchTerm)

    const matchesAge = !filter.ageGroup || farmer.ageGroup === filter.ageGroup
    const matchesEquipment = !filter.equipmentType || farmer.equipments.some(equipment => equipment.type === filter.equipmentType)
    const matchesManufacturer = !filter.manufacturer || farmer.equipments.some(equipment => equipment.manufacturer === filter.manufacturer)
    
    // 지역 필터링
    const matchesCity = !filter.city || (
      (farmer.addressDetail && farmer.addressDetail.includes(filter.city))
    )
    const matchesTown = !filter.town || (
      (farmer.addressDetail && farmer.addressDetail.includes(filter.town))
    )
    const matchesRi = !filter.ri || (
      (farmer.addressDetail && farmer.addressDetail.includes(filter.ri))
    )

    // 거래 유형 필터링
    const matchesTradeType = !filter.tradeType || 
      (filter.tradeType === 'sale' && farmer.equipments.some(equipment => equipment.forSale)) ||
      (filter.tradeType === 'purchase' && farmer.equipments.some(equipment => equipment.forPurchase))

    // 작업기 필터링
    const matchesAttachment = !filter.attachment || (farmer.attachmentImages && (
      (filter.attachment === 'loader' && farmer.attachmentImages.loader) ||
      (filter.attachment === 'rotary' && farmer.attachmentImages.rotary) ||
      (filter.attachment === 'frontWheel' && farmer.attachmentImages.frontWheel) ||
      (filter.attachment === 'rearWheel' && farmer.attachmentImages.rearWheel) ||
      (filter.attachment === 'cutter' && farmer.attachmentImages.cutter) ||
      (filter.attachment === 'rows' && farmer.attachmentImages.rows) ||
      (filter.attachment === 'tonnage' && farmer.attachmentImages.tonnage) ||
      (filter.attachment === 'size' && farmer.attachmentImages.size) ||
      (filter.attachment === 'bucketSize' && farmer.attachmentImages.bucketSize)
    ))

    return matchesSearch && matchesAge && matchesEquipment && 
           matchesManufacturer && matchesCity && matchesTown && 
           matchesRi && matchesTradeType && matchesAttachment
  })

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
      setSelectedFarmers(filteredFarmers.map(farmer => farmer.id))
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
      
      setFarmers(prev => prev.filter(farmer => !selectedFarmers.includes(farmer.id)))
      alert('선택한 농민 정보가 삭제되었습니다.')
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
      </div>

      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="이름, 주소, 전화번호, 농작물로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 지역 필터 */}
          <select
            value={filter.city}
            onChange={(e) => setFilter(prev => ({ ...prev, city: e.target.value }))}
            className="p-2 border rounded"
          >
            <option value="">시/군 전체</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={filter.town}
            onChange={(e) => setFilter(prev => ({ ...prev, town: e.target.value }))}
            className="p-2 border rounded"
            disabled={!filter.city}
          >
            <option value="">읍/면/동 전체</option>
            {towns.map(town => (
              <option key={town} value={town}>{town}</option>
            ))}
          </select>

          <select
            value={filter.ri}
            onChange={(e) => setFilter(prev => ({ ...prev, ri: e.target.value }))}
            className="p-2 border rounded"
            disabled={!filter.town}
          >
            <option value="">리 전체</option>
            {ris.map(ri => (
              <option key={ri} value={ri}>{ri}</option>
            ))}
          </select>

          {/* 기존 필터 */}
          <select
            value={filter.ageGroup}
            onChange={(e) => setFilter(prev => ({ ...prev, ageGroup: e.target.value }))}
            className="p-2 border rounded"
          >
            <option value="">연령대 전체</option>
            {['20대', '30대', '40대', '50대', '60대', '70대', '80대'].map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>

          <select
            value={filter.equipmentType}
            onChange={(e) => setFilter(prev => ({ ...prev, equipmentType: e.target.value }))}
            className="p-2 border rounded"
          >
            <option value="">농기계 종류 전체</option>
            {EQUIPMENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filter.manufacturer}
            onChange={(e) => setFilter(prev => ({ ...prev, manufacturer: e.target.value }))}
            className="p-2 border rounded"
          >
            <option value="">제조사 전체</option>
            {[
              '대동', '국제', '엘에스', '얀마', '구보다', '존디어', '뉴홀랜드', 
              '엠에프', '케이스', '현대', '삼성', '볼보', '히타치', '두산', 
              '클라스', '아그리코', '스타', '시보레', '발메트'
            ].map(manufacturer => (
              <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
            ))}
          </select>

          {/* 거래 유형 필터 */}
          <select
            value={filter.tradeType}
            onChange={(e) => setFilter(prev => ({ ...prev, tradeType: e.target.value }))}
            className="p-2 border rounded"
          >
            <option value="">거래 유형 전체</option>
            <option value="sale">판매 희망</option>
            <option value="purchase">구매 희망</option>
          </select>

          {/* 작업기 필터 */}
          <select
            value={filter.attachment}
            onChange={(e) => setFilter(prev => ({ ...prev, attachment: e.target.value }))}
            className="p-2 border rounded"
          >
            <option value="">작업기 전체</option>
            <optgroup label="트랙터">
              <option value="loader">로더</option>
              <option value="rotary">로타리</option>
              <option value="frontWheel">전륜</option>
              <option value="rearWheel">후륜</option>
            </optgroup>
            <optgroup label="콤바인">
              <option value="cutter">예취부</option>
            </optgroup>
            <optgroup label="이앙기">
              <option value="rows">작업열</option>
            </optgroup>
            <optgroup label="지게차">
              <option value="tonnage">톤수</option>
            </optgroup>
            <optgroup label="굴삭기">
              <option value="size">규격</option>
            </optgroup>
            <optgroup label="스키로더">
              <option value="bucketSize">버켓용량</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFarmers.map(farmer => (
          <div key={farmer.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFarmers.includes(farmer.id)}
                  onChange={() => handleSelectFarmer(farmer.id)}
                  className="w-4 h-4"
                />
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{farmer.name}</h2>
                  {farmer.businessName && (
                    <span className="text-gray-600">({farmer.businessName})</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {farmer.equipments.some(equipment => equipment.forSale) && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      판매
                    </span>
                    {farmer.equipments.map((equipment, index) => (
                      equipment.forSale && (
                        <span key={index} className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded">
                          {equipment.desiredPrice}만원
                        </span>
                      )
                    ))}
                  </div>
                )}
                {farmer.equipments.some(equipment => equipment.forPurchase) && (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    구매
                  </span>
                )}
              </div>
            </div>

            {/* 통합 이미지 갤러리 */}
            <Link href={`/farmers/${farmer.id}`} className="block mb-6">
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
                                prevImage(farmer.id, 'all', allImages.length)
                              }}
                              className="bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center"
                            >
                              ←
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                nextImage(farmer.id, 'all', allImages.length)
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

            {/* 농민 정보 */}
            <div className="space-y-2 text-sm">
              {/* 주소 정보 */}
              <div className="flex flex-col space-y-1">
                {(farmer.roadAddress || farmer.jibunAddress) && (
                  <>
                    {farmer.roadAddress && (
                      <div className="truncate">
                        <a 
                          href={`https://map.kakao.com/link/search/${farmer.roadAddress}${farmer.addressDetail ? ` ${farmer.addressDetail}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {farmer.roadAddress}
                          {farmer.addressDetail && <span className="ml-1">({farmer.addressDetail})</span>}
                        </a>
                      </div>
                    )}
                    {farmer.jibunAddress && (
                      <div className="truncate">
                        <a 
                          href={`https://map.kakao.com/link/search/${farmer.jibunAddress}${farmer.addressDetail ? ` ${farmer.addressDetail}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {farmer.jibunAddress}
                          {farmer.addressDetail && <span className="ml-1">({farmer.addressDetail})</span>}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 연락처 */}
              <div className="flex items-center">
                <a 
                  href={`tel:${farmer.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {farmer.phone}
                </a>
              </div>

              {/* 보유농기계 */}
              <div className="flex items-start">
                <span className="font-medium min-w-[60px]">농기계:</span>
                <span className="flex-1">
                  {farmer.equipments && farmer.equipments.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {farmer.equipments.map((equipment, index) => (
                        <div key={index} className="flex flex-col gap-1">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span>{getKoreanEquipmentType(equipment.type)} ({getKoreanManufacturer(equipment.manufacturer)})</span>
                            {equipment.year && (
                              <span className="text-sm text-gray-600">
                                {equipment.year}년식
                              </span>
                            )}
                            {equipment.model && (
                              <span className="text-sm text-gray-600">
                                {equipment.model}
                              </span>
                            )}
                            {equipment.usageHours && (
                              <span className="text-sm text-gray-600">
                                {equipment.usageHours}시간 사용
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 ml-2">
                            {equipment.forPurchase && 
                              <span className="text-sm bg-green-100 text-green-800 px-2 rounded">
                                구매희망가: {equipment.purchasePrice}만원
                              </span>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">미등록</span>
                  )}
                </span>
              </div>

              {/* 메모 */}
              {farmer.memo && (
                <div className="flex items-start">
                  <div className="flex-1 border rounded p-2">
                    <div className="font-medium mb-1">메모</div>
                    <div className="max-h-24 overflow-y-auto">
                      <span className="text-gray-600 block whitespace-pre-wrap">{farmer.memo}</span>
                    </div>
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

      {/* Delete Confirmation Modal */}
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