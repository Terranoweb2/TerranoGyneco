import React from 'react';

const UterusIcon = () => (
  <img
    src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1760883038/logo_Dr-T_sqgqy5.png"
    alt="TerranoGyneco Logo"
    className="w-16 h-16 object-contain"
  />
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