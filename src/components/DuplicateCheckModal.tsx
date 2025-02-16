import { Dialog } from '@headlessui/react';

interface DuplicateCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onNewRegister: () => void;
  farmerName: string;
}

export default function DuplicateCheckModal({
  isOpen,
  onClose,
  onEdit,
  onNewRegister,
  farmerName
}: DuplicateCheckModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-lg p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            이미 등록된 농민입니다
          </Dialog.Title>
          <p className="text-gray-600 mb-6">
            '{farmerName}' 농민이 이미 등록되어 있습니다.<br/>
            어떻게 진행하시겠습니까?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              수정하기
            </button>
            <button
              onClick={onNewRegister}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              새로 등록하기
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 