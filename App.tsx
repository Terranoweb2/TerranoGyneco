import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import { User } from './types';

const AppRouter: React.FC = () => {
    const [route, setRoute] = useState(window.location.hash);
    const { user, loading } = useAuth();

    useEffect(() => {
        const handleHashChange = () => {
            setRoute(window.location.hash);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const navigate = (path: string) => {
        window.location.hash = path;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">Chargement...</div>
            </div>
        );
    }
    
    const isApproved = (user: User | null): user is User => {
        return user?.status === 'approved';
    }

    const renderContent = () => {
        // Public routes
        if (!user) {
            switch (route) {
                case '#/login':
                    return <LoginPage navigate={navigate} />;
                case '#/signup':
                    return <SignUpPage navigate={navigate} />;
                case '#/':
                case '':
                default:
                    return <HomePage navigate={navigate} />;
            }
        }
        
        // Protected Routes
        switch (route) {
            case '#/app':
                 if (isApproved(user)) {
                    return <ChatPage />;
                }
                 return <ProfilePage navigate={navigate} />;
            case '#/profile':
                return <ProfilePage navigate={navigate} />;
            case '#/admin':
                if (user.isAdmin) {
                    return <AdminPage navigate={navigate} />;
                }
                 // Redirect non-admin users
                navigate('#/app');
                return <ChatPage />;
            case '#/login':
            case '#/signup':
                 navigate('#/app');
                 return <ChatPage />;
            default:
                 navigate('#/app');
                 return <ChatPage />;
        }
    };
    
    const showHeader = route !== '#/' && route !== '' && route !== '#/login' && route !== '#/signup';

    return (
        <div className="flex flex-col h-screen font-sans bg-gray-50">
            {showHeader && <Header navigate={navigate} />}
            {renderContent()}
        </div>
    );
};


const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
};

export default App;
