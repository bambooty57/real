'use client';

import React from 'react';
import { HiChevronLeft, HiChevronRight, HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // 현재 페이지 그룹 계산 (5페이지씩)
  const pageGroupSize = 5;
  const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  
  // 표시할 페이지 번호들 생성
  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <div className="flex justify-center items-center space-x-2">
      {/* 처음으로 버튼 */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
        title="처음으로"
      >
        <HiChevronDoubleLeft className="w-5 h-5" />
      </button>

      {/* 이전 그룹 버튼 */}
      <button
        onClick={() => onPageChange(Math.max(1, startPage - pageGroupSize))}
        disabled={startPage === 1}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
        title="이전 5페이지"
      >
        <HiChevronLeft className="w-5 h-5" />
      </button>

      {/* 페이지 번호들 */}
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded ${
            currentPage === page
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}

      {/* 다음 그룹 버튼 */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, endPage + 1))}
        disabled={endPage === totalPages}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
        title="다음 5페이지"
      >
        <HiChevronRight className="w-5 h-5" />
      </button>

      {/* 끝으로 버튼 */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
        title="끝으로"
      >
        <HiChevronDoubleRight className="w-5 h-5" />
      </button>
    </div>
  );
} 