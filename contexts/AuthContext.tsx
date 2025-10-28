import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

// Simple password check (DO NOT USE IN PRODUCTION)
const ADMIN_PASSWORD = "TohTibla2026";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    signup: (name: string, email: string, pass: string, licenseId: string) => Promise<boolean>;
    logout: () => void;
    approveUser: (userId: string) => void;
    getAllUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'terrano-gyneco-users';
const SESSION_KEY = 'terrano-gyneco-session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize admin user if not exists
        const allUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as User[];
        const adminExists = allUsers.some(u => u.isAdmin);
        if (!adminExists) {
            const adminUser: User = {
                id: `user-${Date.now()}`,
                name: 'Dr. T Delphine',
                email: 'lycoshoster@gmail.com',
                passwordHash: ADMIN_PASSWORD, // Plain text for prototype
                licenseId: 'ADMIN-001',
                status: 'approved',
                isAdmin: true,
            };
            allUsers.push(adminUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
        }

        // Check for active session
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
            const loggedInUser = allUsers.find(u => u.id === session);
            if(loggedInUser) setUser(loggedInUser);
        }
        setLoading(false);

    }, []);
    
    const getAllUsers = (): User[] => {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as User[];
    };

    const login = async (email: string, pass: string): Promise<boolean> => {
        const allUsers = getAllUsers();
        const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === pass);

        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem(SESSION_KEY, foundUser.id);
            return true;
        }
        return false;
    };

    const signup = async (name: string, email: string, pass: string, licenseId: string): Promise<boolean> => {
        const allUsers = getAllUsers();
        const emailExists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());

        if (emailExists) {
            alert("Cet email est déjà utilisé.");
            return false;
        }

        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            passwordHash: pass,
            licenseId,
            status: 'pending',
            isAdmin: false
        };

        allUsers.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
    };
    
    const approveUser = (userId: string) => {
        const allUsers = getAllUsers();
        const userIndex = allUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            allUsers[userIndex].status = 'approved';
            localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
        }
    };


    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, approveUser, getAllUsers }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};