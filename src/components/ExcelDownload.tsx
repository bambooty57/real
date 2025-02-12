'use client'

import { useState, useEffect } from 'react'
import { Equipment, Farmer } from '@/types/farmer'

interface ExcelDownloadProps {
  farmers: Farmer[];
  filteredEquipments: Array<{
    farmer: Farmer;
    equipment: Equipment;
  }>;
}

export default function ExcelDownload({ farmers, filteredEquipments }: ExcelDownloadProps) {
  const [excelModule, setExcelModule] = useState<{ Workbook: typeof import('exceljs').Workbook }>();
  const [fileSaver, setFileSaver] = useState<{ saveAs: typeof import('file-saver').saveAs }>();

  useEffect(() => {
    // ExcelJS와 FileSaver를 동적으로 로드
    const loadModules = async () => {
      const [{ Workbook }, { saveAs }] = await Promise.all([
        import('exceljs'),
        import('file-saver')
      ]);
      setExcelModule({ Workbook });
      setFileSaver({ saveAs });
    };
    loadModules();
  }, []);

  const getAttachmentText = (attachments: Array<{
    type: 'loader' | 'rotary' | 'frontWheel' | 'rearWheel';
    manufacturer: string;
    model: string;
    condition?: number;
    memo?: string;
    images?: (string | File | null)[];
  }> | undefined) => {
    if (!attachments) return '';
    
    const texts = [];
    const loader = attachments.find(a => a.type === 'loader');
    const rotary = attachments.find(a => a.type === 'rotary');
    const frontWheel = attachments.find(a => a.type === 'frontWheel');
    const rearWheel = attachments.find(a => a.type === 'rearWheel');

    if (loader) {
      texts.push(`로더: ${loader.manufacturer} ${loader.model}`);
    }
    if (rotary) {
      texts.push(`로터리: ${rotary.manufacturer} ${rotary.model}`);
    }
    if (frontWheel) {
      texts.push(`전륜: ${frontWheel.manufacturer} ${frontWheel.model}`);
    }
    if (rearWheel) {
      texts.push(`후륜: ${rearWheel.manufacturer} ${rearWheel.model}`);
    }
    return texts.join(', ');
  };

  const generateExcel = async () => {
    if (!excelModule || !fileSaver) {
      console.error('Required modules not loaded');
      return;
    }

    try {
      const workbook = new excelModule.Workbook();
      const worksheet = workbook.addWorksheet('농기계 매매');

      worksheet.columns = [
        { header: '이름', key: 'name', width: 10 },
        { header: '연락처', key: 'phone', width: 15 },
        { header: '주소', key: 'address', width: 30 },
        { header: '기종', key: 'type', width: 10 },
        { header: '제조사', key: 'manufacturer', width: 10 },
        { header: '모델명', key: 'model', width: 15 },
        { header: '마력', key: 'horsepower', width: 10 },
        { header: '연식', key: 'year', width: 10 },
        { header: '사용시간', key: 'usageHours', width: 10 },
        { header: '부착물', key: 'attachments', width: 30 },
        { header: '매매유형', key: 'tradeType', width: 10 },
        { header: '희망가격', key: 'desiredPrice', width: 15 },
        { header: '상태', key: 'saleStatus', width: 10 },
      ];

      filteredEquipments.forEach(({ farmer, equipment }) => {
        worksheet.addRow({
          name: farmer.name,
          phone: farmer.phone,
          address: farmer.jibunAddress || farmer.roadAddress || '',
          type: equipment.type,
          manufacturer: equipment.manufacturer,
          model: equipment.model,
          horsepower: equipment.horsepower,
          year: equipment.year,
          usageHours: equipment.usageHours,
          attachments: getAttachmentText(equipment.attachments),
          tradeType: equipment.tradeType,
          desiredPrice: equipment.desiredPrice,
          saleStatus: equipment.saleStatus,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fileSaver.saveAs(blob, '농기계_거래_목록.xlsx');
    } catch (error) {
      console.error('Error generating Excel:', error);
    }
  };

  return (
    <button
      onClick={generateExcel}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      엑셀 다운로드
    </button>
  );
} 