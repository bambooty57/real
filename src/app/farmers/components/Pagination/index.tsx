'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex
}: PaginationProps) {
  return (
    <div className="mt-6">
      {/* 페이지 정보 */}
      <div className="text-center mb-4 text-gray-600">
        전체 {totalItems}개 중 {startIndex + 1}-{Math.min(endIndex, totalItems)}
        <span className="mx-2">|</span>
        페이지 {currentPage}/{totalPages}
      </div>
      
      {/* 페이지 버튼 */}
      <div className="flex justify-center items-center space-x-1">
        {/* 처음으로 */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          &#171;
        </button>

        {/* 이전 */}
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          &#8249;
        </button>

        {/* 페이지 번호들 */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(pageNum => {
            if (totalPages <= 7) return true;
            if (pageNum === 1 || pageNum === totalPages) return true;
            if (pageNum >= currentPage - 2 && pageNum <= currentPage + 2) return true;
            return false;
          })
          .map((pageNum, index, array) => {
            // 줄임표 표시 로직
            if (index > 0 && pageNum > array[index - 1] + 1) {
              return (
                <React.Fragment key={`ellipsis-${pageNum}`}>
                  <span className="px-2 py-1">...</span>
                  <button
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      currentPage === pageNum
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
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded border ${
                  currentPage === pageNum
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
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          &#8250;
        </button>

        {/* 끝으로 */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          &#187;
        </button>
      </div>
    </div>
  );
} 