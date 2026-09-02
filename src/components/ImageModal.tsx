import React, { useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, title, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div
      id="image-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="image-modal-container"
        className="relative max-w-3xl w-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-100 text-slate-900">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span>{title || 'Evidence Attachment'}</span>
          </div>
          <button
            id="close-image-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1 text-slate-900 hover:text-indigo-600 cursor-pointer font-mono font-bold"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-slate-900 flex items-center justify-center max-h-[75vh] overflow-auto">
          <img
            src={imageUrl}
            alt={title || 'Complaint Evidence'}
            className="max-h-[70vh] w-auto max-w-full object-contain border border-white/20"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};
