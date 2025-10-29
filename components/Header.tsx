import React from 'react';

const UterusIcon = () => (
  <img
    src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1760883038/logo_Dr-T_sqgqy5.png"
    alt="TerranoGyneco Logo"
    className="w-8 h-8 object-contain"
  />
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
);

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const BookmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
);


interface HeaderProps {
    onSettingsClick: () => void;
    onHistoryClick: () => void;
    onSourcesClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onHistoryClick, onSourcesClick }) => {
  
    return (
    <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
         <div className="flex items-center gap-3">
            <UterusIcon />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
                Terrano<span className="text-pink-600 hidden sm:inline">Gyneco</span>
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onSourcesClick} 
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                aria-label="Voir la bibliothèque de sources"
            >
                <BookmarkIcon />
            </button>
            <button 
                onClick={onHistoryClick} 
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                aria-label="Voir l'historique"
            >
                <HistoryIcon />
            </button>
            <button 
                onClick={onSettingsClick} 
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                aria-label="Ouvrir les paramètres"
            >
                <SettingsIcon />
            </button>
        </div>
      </div>
    </header>
  );
};