'use client';

import { useModalStore } from '@/store/store';
import { X, AlertTriangle } from 'lucide-react';

export function GlobalModal() {
  const { isOpen, type, title, content, onConfirm, onCancel, closeModal } =
    useModalStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity">
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100 p-6">
        
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {type === 'confirm' && (
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          <p className="text-gray-600 leading-relaxed">
            {content}
          </p>
        </div>

        {/* Footer / Actions */}
        <div className="flex gap-3 justify-end">
          {type === 'confirm' && (
            <button
              onClick={() => {
                onCancel?.();
                closeModal();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
          )}

          {type === 'confirm' && (
            <button
              onClick={() => {
                onConfirm?.();
                closeModal();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition-colors"
            >
              ยืนยัน
            </button>
          )}

          {type === 'alert' && (
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              ตกลง
            </button>
          )}
        </div>
      </div>
    </div>
  );
}