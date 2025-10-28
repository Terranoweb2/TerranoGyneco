import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UterusIcon = () => (
  <img
    src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1760883038/logo_Dr-T_sqgqy5.png"
    alt="TerranoGyneco Logo"
    className="w-8 h-8 object-contain"
  />
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


interface HeaderProps {
    onSettingsClick?: () => void;
    onHistoryClick?: () => void;
    navigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onHistoryClick, navigate }) => {
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                Terrano<span className="text-pink-600 hidden sm:inline">Gyneco</span>
            </h1>
        </div>
        <div className="flex items-center gap-2">
             {onHistoryClick && (
                <button 
                    onClick={onHistoryClick} 
                    className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                    aria-label="Voir l'historique"
                >
                    <HistoryIcon />
                </button>
            )}
            {onSettingsClick && (
                <button 
                    onClick={onSettingsClick} 
                    className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                    aria-label="Ouvrir les paramètres"
                >
                    <SettingsIcon />
                </button>
            )}
            {user ? (
                 <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                        aria-label="Ouvrir le menu utilisateur"
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