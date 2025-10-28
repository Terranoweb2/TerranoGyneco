import React from 'react';

const UterusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-pink-500">
        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.927 0l-7.5 4.5A.75.75 0 003 7.5v6.19l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06L5.25 13.69V7.5L12 3.75l6.75 3.75v6.19l-1.03-1.03a.75.75 0 10-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06L18.75 13.69V7.5a.75.75 0 00-.537-.714l-7.5-4.5zM12 15.75a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        <path d="M7.72 9.3l-2.47 2.47a.75.75 0 101.06 1.06L9 10.36v3.33a.75.75 0 001.5 0V9.75a.75.75 0 00-.75-.75h-2.03zM15 9.75a.75.75 0 00-.75.75v3.84l2.47-2.47a.75.75 0 111.06 1.06L15 15.68V9.75a.75.75 0 00-.75-.75h-2.03a.75.75 0 000 1.5H15z" />
    </svg>
);


interface HomePageProps {
    navigate: (path: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
    return (
         <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-2xl">
                <div className="flex justify-center mb-6">
                    <UterusIcon />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
                    Bienvenue sur Terrano<span className="text-pink-600">Gyneco</span>
                </h1>
                <p className="mt-4 text-lg md:text-xl text-gray-600">
                    L'assistant IA de pointe, réservé aux gynécologues. Dialoguez avec une intelligence artificielle spécialisée pour des réponses précises et illustrées à vos questions cliniques.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-xs sm:max-w-none mx-auto">
                    <button 
                        onClick={() => navigate('#/login')}
                        className="w-full sm:w-auto px-8 py-3 bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
                    >
                        Se Connecter
                    </button>
                    <button 
                         onClick={() => navigate('#/signup')}
                         className="w-full sm:w-auto px-8 py-3 bg-white text-pink-500 font-semibold rounded-lg shadow-md border border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
                    >
                        Créer un compte
                    </button>
                </div>
                 <p className="mt-8 text-sm text-gray-500">
                    L'accès est réservé aux professionnels de la santé. Chaque inscription est soumise à une validation.
                </p>
            </div>
        </div>
    );
};

export default HomePage;
