import React from 'react';

interface HomePageProps {
  onStart: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center text-white p-4" style={{backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1587327901593-3701363675a8')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
      <div className="bg-black/40 backdrop-blur-md p-8 sm:p-12 rounded-2xl shadow-2xl max-w-2xl w-full">
        <img src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1760883038/logo_Dr-T_sqgqy5.png" alt="Logo TerranoGyneco" className="w-28 h-28 mb-6 mx-auto" />
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Terrano<span className="text-pink-400">Gyneco</span>
        </h1>
        <p className="text-lg sm:text-xl text-white/90 mt-2 max-w-lg mx-auto">
          Votre assistant IA spécialisé en gynécologie. Prêt à répondre à vos questions les plus complexes avec précision et rapidité.
        </p>
        <button
          onClick={onStart}
          className="mt-8 px-8 py-4 bg-pink-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-500/50 transform hover:scale-105 transition-all duration-300 ease-in-out"
        >
          Commencer la conversation
        </button>
      </div>
    </main>
  );
};

export default HomePage;