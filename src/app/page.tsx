'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { FaFileExcel, FaGoogle } from 'react-icons/fa';
import * as XLSX from 'xlsx-js-style';

interface Farmer {
  id: string;
  name: string;
  address: string;
  phone: string;
  ageGroup: string;
  mainCrop: {
    rice: boolean;
    barley: boolean;
    hanwoo: boolean;
    soybean: boolean;
    sweetPotato: boolean;
    persimmon: boolean;
    pear: boolean;
    plum: boolean;
    sorghum: boolean;
    goat: boolean;
    other: boolean;
  };
  equipments: Array<{
    type: string;
    manufacturer: string;
  }>;
}

const getKoreanEquipmentType = (type: string): string => {
  const types: { [key: string]: string } = {
    'tractor': '트랙터',
    'transplanter': '이앙기',
    'combine': '콤바인',
    'forklift': '지게차',
    'excavator': '굴삭기',
    'skidLoader': '스키로더'
  };
  return types[type] || type;
};

const getMainCropText = (mainCrop: Farmer['mainCrop']) => {
  if (!mainCrop) return '없음';
  
  const selectedCrops = Object.entries(mainCrop)
    .filter(([_, value]) => value)
    .map(([key, _]) => {
      const cropNames = {
        rice: '벼',
        barley: '보리',
        hanwoo: '한우',
        soybean: '콩',
        sweetPotato: '고구마',
        persimmon: '감',
        pear: '배',
        plum: '자두',
        sorghum: '수수',
        goat: '염소',
        other: '기타'
      };
      return cropNames[key];
    });
  
  return selectedCrops.length > 0 ? selectedCrops.join(', ') : '없음';
};

// 드롭다운 옵션 정의
const MAIL_OPTIONS = ['가능', '불가능'] as const;
const FARMING_TYPES = ['논농사', '밭농사', '과수원', '축산업'] as const;
const MAIN_CROPS = ['벼', '보리', '한우', '콩', '고구마', '감', '배', '자두', '수수', '염소', '기타'] as const;
const EQUIPMENT_LIST = [
  '트랙터(대동)',
  '트랙터(국제)',
  '콤바인(국제)',
  '이앙기(대동)',
  '이앙기(국제)',
  '이앙기(구보다)',
  '굴삭기(대동)',
  '굴삭기(국제)',
  '굴삭기(구보다)',
  '스키로더(대동)',
  '스키로더(국제)',
  '스키로더(구보다)'
] as const;

// 전화번호 형식 변환 함수 개선
const formatPhoneNumber = (phone: string): string => {
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 11자리가 아닌 경우 처리
  if (numbers.length !== 11) {
    // 10자리인 경우 (01012345678 -> 010-1234-5678)
    if (numbers.length === 10 && numbers.startsWith('01')) {
      return `010-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    // 8자리인 경우 (12345678 -> 010-1234-5678)
    if (numbers.length === 8) {
      return `010-${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    }
    // 7자리인 경우 (1234567 -> 010-123-4567)
    if (numbers.length === 7) {
      return `010-${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    // 그 외의 경우는 원본 반환
    return phone;
  }
  
  // 11자리인 경우 010-0000-0000 형식으로 변환
  return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
};

export default function Home() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    total: number;
    success: number;
    update: number;
    error: number;
    details: Array<{
      name: string;
      phone: string;
      status: '성공' | '수정' | '실패';
      message: string;
      errorReason?: string;
      data?: any;
    }>;
  } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [farmerCount, setFarmerCount] = useState<number>(0);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        console.log('Fetching farmers...');  // 디버깅용 로그
        const farmersRef = collection(db, 'farmers');
        const snapshot = await getDocs(farmersRef);
        const farmersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Farmer));
        console.log('Farmers data:', farmersData);  // 디버깅용 로그
        setFarmers(farmersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching farmers:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다');
        setLoading(false);
      }
    };

    async function getFarmerCount() {
      try {
        const querySnapshot = await getDocs(collection(db, 'farmers'));
        setFarmerCount(querySnapshot.size);
      } catch (error) {
        console.error('농민 수 조회 오류:', error);
      }
    }

    fetchFarmers();
    getFarmerCount();
  }, []);

  const handleExcelDownload = () => {
    const excelData = farmers.map(farmer => ({
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
      '영농형태': farmer.farmingType || '',
      '주작물': getMainCropText(farmer.mainCrop),
      '보유농기계': farmer.equipments?.map(eq => 
        `${getKoreanEquipmentType(eq.type)}(${eq.manufacturer || ''})`
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

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus({ status: 'processing', message: '엑셀 파일을 처리중입니다...' });
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // 엑셀 파일 읽기 설정 개선
        const parsedData = XLSX.utils.sheet_to_json(sheet, { 
          raw: true,  // 원본 데이터 타입 보존
          defval: null,  // 빈 값을 null로 처리
          header: true,  // 헤더 자동 인식
          blankrows: false  // 빈 행 제외
        });

        console.log('Parsed Excel Data:', parsedData);

        let successCount = 0;
        let updateCount = 0;
        let errorCount = 0;
        let resultDetails: Array<{
          name: string;
          phone: string;
          status: '성공' | '수정' | '실패';
          message: string;
          errorReason?: string;
          data?: any;
        }> = [];

        // Firebase 트랜잭션 시작
        const batch = writeBatch(db);
        const farmersRef = collection(db, 'farmers');
        const snapshot = await getDocs(farmersRef);
        const existingFarmers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 데이터 유효성 검사 함수
        const validateData = (row: any) => {
          const errors = [];
          if (!row['이름']) errors.push('이름이 누락되었습니다');
          if (!row['전화번호']) errors.push('전화번호가 누락되었습니다');
          
          // 전화번호 형식 검증
          if (row['전화번호']) {
            const phoneRegex = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/;
            if (!phoneRegex.test(row['전화번호'].replace(/[-\s]/g, ''))) {
              errors.push('올바른 전화번호 형식이 아닙니다');
            }
          }
          
          return errors;
        };

        // 업로드된 각 행에 대해 처리
        for (const row of parsedData) {
          try {
            setUploadStatus({ 
              status: 'processing', 
              message: `${row['이름'] || '알 수 없음'} 데이터 처리 중...` 
            });

            // 데이터 유효성 검사
            const validationErrors = validateData(row);
            if (validationErrors.length > 0) {
              errorCount++;
              resultDetails.push({
                name: row['이름'] || '이름없음',
                phone: row['전화번호'] || '',
                status: '실패',
                message: '유효성 검사 실패',
                errorReason: validationErrors.join(', '),
                data: row
              });
              continue;
            }

            const farmerData = {
              name: row['이름'],
              businessName: row['상호'] || '',
              ageGroup: row['연령대'] || '',
              phone: formatPhoneNumber(row['전화번호']),
              zipCode: row['우편번호'] || '',
              jibunAddress: row['지번주소'] || '',
              roadAddress: row['도로명주소'] || '',
              addressDetail: row['상세주소'] || '',
              updatedAt: new Date().toISOString()
            };

            // 기존 데이터 검색 시 전화번호 형식을 맞춰서 비교
            const existingFarmer = existingFarmers.find(f => {
              const existingPhone = formatPhoneNumber(f.phone);
              const newPhone = formatPhoneNumber(row['전화번호']);
              const existingPhoneNumbers = existingPhone.replace(/[^0-9]/g, '');
              const newPhoneNumbers = newPhone.replace(/[^0-9]/g, '');
              
              return f.name === farmerData.name && existingPhoneNumbers === newPhoneNumbers;
            });

            if (existingFarmer) {
              // 기존 데이터 업데이트
              const farmerRef = doc(db, 'farmers', existingFarmer.id);
              const updateData = {
                ...farmerData,
                updatedAt: new Date().toISOString()
              };
              batch.update(farmerRef, updateData);
              updateCount++;
              resultDetails.push({
                name: existingFarmer.name,
                phone: existingFarmer.phone,
                status: '수정',
                message: '기존 정보 업데이트 완료',
                data: updateData
              });
            } else {
              // 신규 데이터 등록
              const newFarmerRef = doc(collection(db, 'farmers'));
              const newData = {
                ...farmerData,
                createdAt: new Date().toISOString(),
                memo: '',
                canReceiveMail: false,
                farmingType: '',
                mainCrop: {},
                equipments: []
              };
              batch.set(newFarmerRef, newData);
              successCount++;
              resultDetails.push({
                name: farmerData.name,
                phone: farmerData.phone,
                status: '성공',
                message: '신규 등록 완료',
                data: newData
              });
            }
          } catch (err) {
            errorCount++;
            resultDetails.push({
              name: row['이름'] || '이름없음',
              phone: row['전화번호'] || '',
              status: '실패',
              message: '처리 실패',
              errorReason: err instanceof Error ? err.message : '알 수 없는 오류',
              data: row
            });
          }
        }

        try {
          // 트랜잭션 커밋
          await batch.commit();
          
          // 업로드 결과 상태 업데이트
          setUploadResult({
            total: parsedData.length,
            success: successCount,
            update: updateCount,
            error: errorCount,
            details: resultDetails
          });

          // 데이터 리로드
          const updatedSnapshot = await getDocs(farmersRef);
          const updatedFarmers = updatedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setFarmers(updatedFarmers as Farmer[]);

          setUploadStatus({ 
            status: 'success', 
            message: '업로드가 완료되었습니다.' 
          });

          // 상세 결과 메시지 생성
          const resultMessage = `처리 완료:\n
- 총 ${parsedData.length}건 중\n
- 신규 등록: ${successCount}건\n
- 정보 업데이트: ${updateCount}건\n
- 처리 실패: ${errorCount}건\n\n
${errorCount > 0 ? '실패한 항목들의 상세 내역은 아래에서 확인할 수 있습니다.' : ''}`;

          alert(resultMessage);
        } catch (error) {
          setUploadStatus({ 
            status: 'error', 
            message: '데이터 저장 중 오류가 발생했습니다.' 
          });
          console.error('트랜잭션 커밋 중 오류:', error);
          alert('데이터 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      setUploadStatus({ 
        status: 'error', 
        message: '엑셀 파일 처리 중 오류가 발생했습니다.' 
      });
      console.error('엑셀 업로드 중 오류:', error);
      alert('엑셀 파일 처리 중 오류가 발생했습니다.');
    }
  };

  const handleTemplateDownload = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['이름', '상호', '연령대', '전화번호', '우편번호', '지번주소', '도로명주소', '상세주소'],
      ['', '', '', '', '', '', '', '']
    ]);

    // 열 너비 설정
    ws['!cols'] = [
      { wch: 15 },  // 이름
      { wch: 20 },  // 상호
      { wch: 10 },  // 연령대
      { wch: 15 },  // 전화번호
      { wch: 10 },  // 우편번호
      { wch: 40 },  // 지번주소
      { wch: 40 },  // 도로명주소
      { wch: 30 },  // 상세주소
    ];

    // 필수 입력 셀 스타일 설정 (이름, 전화번호)
    ws['A1'] = {
      v: '이름',
      t: 's',
      s: {
        fill: { 
          patternType: "solid", 
          fgColor: { rgb: "FFFFE0E0" }  // 연한 빨간색 배경
        },
        font: { 
          bold: true,
          color: { rgb: "FFFF0000" },  // 빨간색 글자
          sz: 12
        },
        border: {
          top: { style: 'thin', color: { rgb: "FFFF0000" } },
          bottom: { style: 'thin', color: { rgb: "FFFF0000" } },
          left: { style: 'thin', color: { rgb: "FFFF0000" } },
          right: { style: 'thin', color: { rgb: "FFFF0000" } }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      }
    };

    ws['D1'] = {
      v: '전화번호',
      t: 's',
      s: {
        fill: { 
          patternType: "solid", 
          fgColor: { rgb: "FFFFE0E0" }  // 연한 빨간색 배경
        },
        font: { 
          bold: true,
          color: { rgb: "FFFF0000" },  // 빨간색 글자
          sz: 12
        },
        border: {
          top: { style: 'thin', color: { rgb: "FFFF0000" } },
          bottom: { style: 'thin', color: { rgb: "FFFF0000" } },
          left: { style: 'thin', color: { rgb: "FFFF0000" } },
          right: { style: 'thin', color: { rgb: "FFFF0000" } }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      }
    };

    // 선택 입력 셀 스타일 설정
    ['B1', 'C1', 'E1', 'F1', 'G1', 'H1'].forEach(cell => {
      ws[cell] = {
        v: ws[cell].v,
        t: 's',
        s: {
          fill: {
            patternType: "solid",
            fgColor: { rgb: "FFF0F0F0" }  // 연한 회색 배경
          },
          font: { 
            bold: true,
            color: { rgb: "FF333333" },  // 진한 회색 글자
            sz: 12
          },
          border: {
            top: { style: 'thin', color: { rgb: "FF999999" } },
            bottom: { style: 'thin', color: { rgb: "FF999999" } },
            left: { style: 'thin', color: { rgb: "FF999999" } },
            right: { style: 'thin', color: { rgb: "FF999999" } }
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          }
        }
      };
    });

    XLSX.utils.book_append_sheet(wb, ws, "업로드양식");
    XLSX.writeFile(wb, "농민등록_양식.xlsx");
  };

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (loading) {
    return <div className="text-center py-10">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 엑셀 업로드 버튼 */}
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
            >
              <FaFileExcel />
              엑셀 업로드
            </label>
            {/* 업로드 상태 표시 */}
            {uploadStatus.status !== 'idle' && (
              <div className={`absolute top-full left-0 mt-2 p-2 rounded shadow-lg w-64 ${
                uploadStatus.status === 'processing' ? 'bg-blue-100' :
                uploadStatus.status === 'success' ? 'bg-green-100' :
                'bg-red-100'
              }`}>
                <p className={`text-sm ${
                  uploadStatus.status === 'processing' ? 'text-blue-700' :
                  uploadStatus.status === 'success' ? 'text-green-700' :
                  'text-red-700'
                }`}>
                  {uploadStatus.message}
                </p>
              </div>
            )}
          </div>

          {/* 템플릿 다운로드 버튼 */}
          <button
            onClick={handleTemplateDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <FaFileExcel />
            템플릿 다운로드
          </button>

          {/* 엑셀 다운로드 버튼 */}
          <button
            onClick={handleExcelDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaFileExcel />
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 업로드 결과 표시 */}
      {uploadResult && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="text-lg font-bold mb-2">업로드 결과</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-2 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">총 처리</p>
              <p className="text-xl font-bold">{uploadResult.total}건</p>
            </div>
            <div className="p-2 bg-green-100 rounded">
              <p className="text-sm text-green-600">신규 등록</p>
              <p className="text-xl font-bold">{uploadResult.success}건</p>
            </div>
            <div className="p-2 bg-blue-100 rounded">
              <p className="text-sm text-blue-600">정보 수정</p>
              <p className="text-xl font-bold">{uploadResult.update}건</p>
            </div>
            <div className="p-2 bg-red-100 rounded">
              <p className="text-sm text-red-600">처리 실패</p>
              <p className="text-xl font-bold">{uploadResult.error}건</p>
            </div>
          </div>

          {/* 실패 항목 상세 내역 */}
          {uploadResult.error > 0 && (
            <div className="mt-4">
              <h4 className="font-bold mb-2">실패 항목 상세</h4>
              <div className="max-h-60 overflow-y-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2">이름</th>
                      <th className="px-4 py-2">전화번호</th>
                      <th className="px-4 py-2">실패 사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.details
                      .filter(detail => detail.status === '실패')
                      .map((detail, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{detail.name}</td>
                          <td className="px-4 py-2">{detail.phone}</td>
                          <td className="px-4 py-2 text-red-600">{detail.errorReason}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 통계 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-6 bg-blue-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">총 고객수</h3>
          <p className="text-3xl font-bold text-blue-600">{farmerCount}명</p>
        </div>
        <div className="p-6 bg-green-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-green-900">총 농기계수</h3>
          <p className="text-3xl font-bold text-green-600">
            {farmers.reduce((acc, farmer) => acc + (farmer.equipments?.length || 0), 0)}대
          </p>
        </div>
      </div>
    </div>
  );
} 