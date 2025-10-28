import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SignUpPageProps {
    navigate: (path: string) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ navigate }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [licenseId, setLicenseId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const result = await signup(name, email, password, licenseId);
        if (result) {
            setSuccess(true);
        } else {
            setError("Un problème est survenu lors de l'inscription. L'email est peut-être déjà utilisé.");
        }
    };

    if (success) {
        return (
             <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full text-center bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Inscription Réussie !</h2>
                    <p className="text-gray-600 mb-6">
                        Votre compte a été créé. Il est maintenant en attente de validation par un administrateur. Vous recevrez une notification une fois votre compte approuvé.
                    </p>
                    <button 
                        onClick={() => navigate('#/login')}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                        Retour à la connexion
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Créer un Compte</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom Complet</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" />
                    </div>
                    <div>
                        <label htmlFor="licenseId" className="block text-sm font-medium text-gray-700">N° de Licence Professionnelle</label>
                        <input id="licenseId" type="text" value={licenseId} onChange={(e) => setLicenseId(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" />
                    </div>
                    <div>
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
                            S'inscrire
                        </button>
                    </div>
                </form>
                 <p className="mt-6 text-center text-sm text-gray-600">
                    Déjà un compte ?{' '}
                    <a onClick={() => navigate('#/login')} className="font-medium text-pink-600 hover:text-pink-500 cursor-pointer">
                        Connectez-vous
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;
