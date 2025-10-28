import React from 'react';

const UterusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-8 h-8 text-pink-500"
  >
    <path
      fillRule="evenodd"
      d="M12.963 2.286a.75.75 0 00-1.927 0l-7.5 4.5A.75.75 0 003 7.5v6.19l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06L5.25 13.69V7.5L12 3.75l6.75 3.75v6.19l-1.03-1.03a.75.75 0 10-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06L18.75 13.69V7.5a.75.75 0 00-.537-.714l-7.5-4.5zM12 15.75a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5a.75.75 0 01.75-.75z"
      clipRule="evenodd"
    />
    <path d="M7.72 9.3l-2.47 2.47a.75.75 0 101.06 1.06L9 10.36v3.33a.75.75 0 001.5 0V9.75a.75.75 0 00-.75-.75h-2.03zM15 9.75a.75.75 0 00-.75.75v3.84l2.47-2.47a.75.75 0 111.06 1.06L15 15.68V9.75a.75.75 0 00-.75-.75h-2.03a.75.75 0 000 1.5H15z" />
  </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.48.398.668 1.03.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


interface HeaderProps {
    onSettingsClick: () => void;
    onHistoryClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onHistoryClick }) => {
  return (
    <header className="w-full bg-white/80 backdrop-blur-sm p-4 shadow-md sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
         <div className="flex items-center gap-3">
            <UterusIcon />
            <h1 className="text-2xl font-bold text-gray-800">
                Terrano<span className="text-pink-600">Gyneco</span>
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onHistoryClick}
                className="text-gray-600 hover:text-pink-600 p-2 rounded-full transition-colors hover:bg-gray-200"
                aria-label="Ouvrir l'historique"
            >
                <HistoryIcon />
            </button>
            <button 
                onClick={onSettingsClick}
                className="text-gray-600 hover:text-pink-600 p-2 rounded-full transition-colors hover:bg-gray-200"
                aria-label="Ouvrir les paramètres"
            >
                <SettingsIcon />
            </button>
        </div>
      </div>
    </header>
  );
};