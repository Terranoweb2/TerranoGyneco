import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
    navigate: (path: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loginWithGoogle } = useAuth();

    const handleGoogleSignIn = async () => {
        setError('');
        await loginWithGoogle();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const { success, error: loginError } = await login(email, password);
        if (success) {
            navigate('#/app');
        } else {
             let frenchError = "L'email ou le mot de passe est incorrect.";
            if (loginError?.includes('Email not confirmed')) {
                frenchError = "Veuillez confirmer votre adresse e-mail avant de vous connecter.";
            }
            setError(frenchError);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Connexion</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                           Adresse e-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-700">
                           Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                             className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                        >
                            Se connecter
                        </button>
                    </div>
                </form>

                <div className="my-6 flex items-center justify-center">
                  <div className="h-px bg-gray-300 flex-grow"></div>
                  <span className="mx-4 text-sm font-medium text-gray-500">OU</span>
                  <div className="h-px bg-gray-300 flex-grow"></div>
                </div>
                
                 <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#4285F4" d="M24 9.5c3.21 0 6.13 1.11 8.4 3.29l6.31-6.31C34.93 2.76 29.83 0 24 0 14.89 0 7.21 5.36 4.38 12.91l7.63 5.92C13.59 13.5 18.42 9.5 24 9.5z"></path>
                        <path fill="#34A853" d="M46.12 25.13c0-1.66-.15-3.27-.42-4.82H24v9.1h12.44c-.54 2.92-2.19 5.43-4.63 7.15l7.28 5.67C43.43 38.63 46.12 32.44 46.12 25.13z"></path>
                        <path fill="#FBBC05" d="M12.01 21.03c-.34-.98-.53-2.02-.53-3.1s.19-2.12.53-3.1L4.38 12.91C2.86 15.99 2 19.42 2 23.03s.86 7.04 2.38 10.12l7.63-5.92z"></path>
                        <path fill="#EA4335" d="M24 48c6.49 0 11.97-2.14 15.95-5.8l-7.28-5.67c-2.11 1.42-4.82 2.27-7.67 2.27-5.58 0-10.41-3.99-12.01-9.39l-7.63 5.92C7.21 42.64 14.89 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    Continuer avec Google
                </button>


                <p className="mt-6 text-center text-sm text-gray-600">
                    Pas encore de compte ?{' '}
                    <a onClick={() => navigate('#/signup')} className="font-medium text-pink-600 hover:text-pink-500 cursor-pointer">
                        Inscrivez-vous
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;