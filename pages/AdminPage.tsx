import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

interface AdminPageProps {
    navigate: (path: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
    const { user, approveUser, getAllUsers } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [notificationMessage, setNotificationMessage] = useState('');


    useEffect(() => {
        if (user?.isAdmin) {
            setUsers(getAllUsers());
        } else {
            navigate('#/app');
        }
    }, [user, navigate, getAllUsers]);
    
    const handleApprove = (userId: string) => {
        approveUser(userId);
        // Refresh the list
        setUsers(getAllUsers());
    };

    const handleSendNotification = () => {
        const pendingUsers = users.filter(u => u.status === 'pending');
        if (pendingUsers.length === 0) {
            alert("Il n'y a aucun utilisateur en attente.");
            return;
        }

        // Simulate sending the notification
        alert(`Le message suivant a été envoyé à ${pendingUsers.length} utilisateur(s) en attente :\n\n"${notificationMessage}"`);

        setNotificationMessage('');
    };

    if (!user?.isAdmin) {
        return null;
    }
    
    const pendingUsersCount = users.filter(u => u.status === 'pending').length;
    const nonAdminUsers = users.filter(u => !u.isAdmin);

    return (
        <div className="flex-1 bg-gray-100 p-2 sm:p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Tableau de Bord Administrateur</h2>
                <p className="mb-8 text-gray-600">Gérez les inscriptions des médecins et validez leur accès à l'application.</p>

                {/* Table for medium screens and up */}
                <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Licence</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {nonAdminUsers.map((doc) => (
                                <tr key={doc.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.licenseId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {doc.status === 'approved' ? 'Approuvé' : 'En attente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {doc.status === 'pending' && (
                                            <button
                                                onClick={() => handleApprove(doc.id)}
                                                className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-md transition-colors"
                                            >
                                                Approuver
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Cards for small screens */}
                <div className="md:hidden space-y-4">
                    {nonAdminUsers.length > 0 ? (
                        nonAdminUsers.map((doc) => (
                             <div key={doc.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-lg font-bold text-gray-800 break-words">{doc.name}</p>
                                    <span className={`flex-shrink-0 ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full text-center ${doc.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {doc.status === 'approved' ? 'Approuvé' : 'En attente'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1 break-words">
                                    <p><span className="font-semibold">Email:</span> {doc.email}</p>
                                    <p><span className="font-semibold">Licence:</span> {doc.licenseId}</p>
                                </div>
                                {doc.status === 'pending' && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={() => handleApprove(doc.id)}
                                            className="text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-md transition-colors text-sm font-medium"
                                        >
                                            Approuver
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">Aucun utilisateur à afficher.</p>
                    )}
                </div>

                <div className="mt-10 pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Notifier les utilisateurs en attente</h3>
                    <p className="mb-4 text-gray-600">Envoyez un message à tous les médecins dont le compte est en attente de validation ({pendingUsersCount} en attente).</p>
                    <textarea
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-50"
                        placeholder="Ex: Le processus de validation peut prendre jusqu'à 48 heures..."
                        disabled={pendingUsersCount === 0}
                    />
                    <button
                        onClick={handleSendNotification}
                        disabled={!notificationMessage.trim() || pendingUsersCount === 0}
                        className="mt-4 px-4 py-2 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Envoyer le message
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AdminPage;
