import React, { useState, useEffect } from 'react';

interface ImageZoomModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const MinusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.25;

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    // Reset scale when a new image is opened
    setScale(1);
  }, [imageUrl]);

  if (!imageUrl) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prevScale => prevScale + ZOOM_STEP);
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prevScale => Math.max(MIN_ZOOM, prevScale - ZOOM_STEP));
  };


  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 cursor-zoom-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-20"
        aria-label="Fermer l'image zoomée"
      >
        <CloseIcon />
      </button>

      {/* Zoom Controls */}
      <div 
        className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/50 rounded-full p-2 flex items-center gap-2 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
            onClick={handleZoomOut}
            disabled={scale <= MIN_ZOOM}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Réduire"
        >
            <MinusIcon/>
        </button>
         <button 
            onClick={handleZoomIn}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            aria-label="Agrandir"
        >
            <PlusIcon/>
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center p-4 overflow-auto">
        <img
          src={imageUrl}
          alt="Illustration Médicale Zoomée"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl transition-transform duration-200 ease-in-out cursor-grab"
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking on the image
        />
      </div>
    </div>
  );
};
