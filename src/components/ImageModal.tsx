import React, { useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, title, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div id="image-modal-backdrop" className="fixed inset-0 z-50 modal-depth-backdrop flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div id="image-modal-container" className="relative max-w-3xl w-full sm:border sm:border-[#2A2F3E] bg-[#1D2130] overflow-hidden max-sm:w-full max-sm:h-full max-sm:min-h-dvh max-sm:border-0" style={{ boxShadow: '0 12px 28px rgba(11,12,15,0.28), 0 4px 10px rgba(11,12,15,0.14)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2A2F3E] bg-[#0B0C0F] text-[#EBE3D0]">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
            <ImageIcon className="w-4 h-4 text-[#B59340]" />
            <span>{title || 'Evidence Attachment'}</span>
          </div>
          <button id="close-image-modal-btn" type="button" onClick={onClose} className="p-1 text-[#EBE3D0] hover:text-[#B59340] cursor-pointer font-mono font-bold" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="sm:p-4 p-2 bg-[#0B0C0F] flex items-center justify-center max-h-[85vh] sm:max-h-[75vh] overflow-auto">
          <img src={imageUrl} alt={title || 'Complaint Evidence'} className="max-h-[78vh] sm:max-h-[70vh] w-auto max-w-full object-contain" referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
  );
};
