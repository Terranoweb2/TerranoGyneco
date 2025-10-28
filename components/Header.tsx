import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

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

const UserCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
    </svg>
);


interface HeaderProps {
    onSettingsClick?: () => void;
    onHistoryClick?: () => void;
    navigate: (path: string) => void;
    isChatPage?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onHistoryClick, navigate, isChatPage }) => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
  
    return (
    <header className="w-full bg-white/80 backdrop-blur-sm p-4 shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
         <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(user ? '#/app' : '#/')}
        >
            <UterusIcon />
            <h1 className="text-2xl font-bold text-gray-800">
                Terrano<span className="text-pink-600">Gyneco</span>
            </h1>
        </div>
        <div className="flex items-center gap-2">
            {user ? (
                 <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                       <UserCircleIcon />
                    </button>
                    {isMenuOpen && (
                         <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                             <button
                                 onClick={() => { navigate('#/profile'); setIsMenuOpen(false); }}
                                 className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                             >
                                 <UserCircleIcon /> Mon Profil
                             </button>
                              {user.isAdmin && (
                                 <button
                                     onClick={() => { navigate('#/admin'); setIsMenuOpen(false); }}
                                     className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                 >
                                    <AdminIcon /> Admin
                                 </button>
                             )}
                             <button
                                 onClick={() => { logout(); navigate('#/'); setIsMenuOpen(false); }}
                                 className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                             >
                                 <LogoutIcon /> Déconnexion
                             </button>
                         </div>
                     )}
                 </div>

            ) : (
                <>
                    <button onClick={() => navigate('#/login')} className="font-semibold text-gray-600 hover:text-pink-600 transition-colors px-4 py-2 rounded-md">
                        Connexion
                    </button>
                    <button onClick={() => navigate('#/signup')} className="font-semibold text-white bg-pink-500 hover:bg-pink-600 transition-colors px-4 py-2 rounded-md shadow-sm">
                        Inscription
                    </button>
                </>
            )}
        </div>
      </div>
    </header>
  );
};
