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
      <div id="image-modal-container" className="relative max-w-3xl w-full sm:border sm:border-line-strong bg-surface overflow-hidden rounded-2xl shadow-lift max-sm:w-full max-sm:h-full max-sm:min-h-dvh max-sm:border-0 max-sm:rounded-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-ink text-surface">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
            <ImageIcon className="w-4 h-4 text-bronze" />
            <span>{title || 'Evidence Attachment'}</span>
          </div>
          <button id="close-image-modal-btn" type="button" onClick={onClose} className="p-1 text-surface/80 hover:text-bronze cursor-pointer font-mono font-bold transition-colors" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="sm:p-4 p-2 bg-ink flex items-center justify-center max-h-[85vh] sm:max-h-[75vh] overflow-auto">
          <img src={imageUrl} alt={title || 'Complaint Evidence'} className="max-h-[78vh] sm:max-h-[70vh] w-auto max-w-full object-contain" referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
  );
};
