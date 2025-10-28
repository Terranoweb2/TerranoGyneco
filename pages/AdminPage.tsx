import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

interface AdminPageProps {
    navigate: (path: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
    const { user, allUsers, grantAdmin, revokeAdmin } = useAuth();

    useEffect(() => {
        if (!user?.isAdmin) {
            navigate('#/app');
        }
    }, [user, navigate]);
    
    const handleGrantAdmin = (userId: string, userName: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir promouvoir ${userName} au statut d'administrateur ?`)) {
            grantAdmin(userId);
        }
    };

    const handleRevokeAdmin = (userId: string, userName: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir révoquer le statut d'administrateur pour ${userName} ?`)) {
            revokeAdmin(userId);
        }
    };
    
    if (!user?.isAdmin) {
        return null;
    }
    
    return (
        <div className="flex-1 bg-gray-100 p-2 sm:p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Tableau de Bord Administrateur</h2>
                        <p className="mt-1 text-gray-600">Gérez les rôles des médecins sur l'application.</p>
                    </div>
                </div>


                {/* Table for medium screens and up */}
                <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Licence</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allUsers.map((doc) => (
                                <tr key={doc.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.licenseId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {doc.status === 'approved' ? 'Approuvé' : 'En attente'}
                                        </span>
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`font-semibold ${doc.isAdmin ? 'text-indigo-600' : 'text-gray-600'}`}>
                                            {doc.isAdmin ? 'Admin' : 'Utilisateur'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            {doc.id !== user.id && (
                                                doc.isAdmin ? (
                                                    <button onClick={() => handleRevokeAdmin(doc.id, doc.name)} className="text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-md transition-colors">
                                                        Révoquer Admin
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleGrantAdmin(doc.id, doc.name)} className="text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded-md transition-colors">
                                                        Promouvoir Admin
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Cards for small screens */}
                <div className="md:hidden space-y-4">
                    {allUsers.length > 0 ? (
                        allUsers.map((doc) => (
                             <div key={doc.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-lg font-bold text-gray-800 break-words">{doc.name}</p>
                                        <p className={`text-xs font-semibold uppercase tracking-wider ${doc.isAdmin ? 'text-indigo-600' : 'text-gray-500'}`}>
                                            {doc.isAdmin ? 'Administrateur' : 'Utilisateur'}
                                        </p>
                                    </div>
                                    <span className={`flex-shrink-0 ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full text-center ${doc.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {doc.status === 'approved' ? 'Approuvé' : 'En attente'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1 break-words">
                                    <p><span className="font-semibold">Email:</span> {doc.email}</p>
                                    <p><span className="font-semibold">Licence:</span> {doc.licenseId}</p>
                                </div>
                                <div className="mt-4 flex flex-wrap justify-end items-center gap-2">
                                     {doc.id !== user.id && (
                                        doc.isAdmin ? (
                                            <button onClick={() => handleRevokeAdmin(doc.id, doc.name)} className="text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-md transition-colors text-sm font-medium">
                                                Révoquer Admin
                                            </button>
                                        ) : (
                                            <button onClick={() => handleGrantAdmin(doc.id, doc.name)} className="text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded-md transition-colors text-sm font-medium">
                                                Promouvoir Admin
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">Aucun utilisateur à afficher.</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminPage;