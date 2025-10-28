import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
    navigate: (path: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
    const { user, logout } = useAuth();

    if (!user) {
        navigate('#/login');
        return null;
    }

    const StatusBadge: React.FC<{ status: 'pending' | 'approved' }> = ({ status }) => {
        const isPending = status === 'pending';
        return (
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${isPending ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                {isPending ? 'En attente de validation' : 'Approuvé'}
            </span>
        );
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Mon Profil</h2>
                
                {user.status === 'pending' && (
                     <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
                        <p className="font-bold">Compte non validé</p>
                        <p>Votre compte est en cours de vérification par nos administrateurs. Vous aurez accès à l'assistant conversationnel une fois votre compte approuvé.</p>
                    </div>
                )}
                
                <div className="space-y-4 text-gray-700">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Nom :</span>
                        <span>{user.name}</span>
                    </div>
                    <hr/>
                     <div className="flex justify-between items-center">
                        <span className="font-medium">Email :</span>
                        <span>{user.email}</span>
                    </div>
                    <hr/>
                     <div className="flex justify-between items-center">
                        <span className="font-medium">N° de Licence :</span>
                        <span>{user.licenseId}</span>
                    </div>
                    <hr/>
                     <div className="flex justify-between items-center">
                        <span className="font-medium">Statut du compte :</span>
                        <StatusBadge status={user.status} />
                    </div>
                </div>

                <div className="mt-10 flex gap-4">
                     <button
                        onClick={() => logout()}
                        className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        Déconnexion
                    </button>
                    {user.status === 'approved' && (
                        <button
                            onClick={() => navigate('#/app')}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 focus:outline-none"
                        >
                            Accéder à l'IA
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
