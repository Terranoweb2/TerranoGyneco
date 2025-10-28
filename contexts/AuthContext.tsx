import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { userService } from '../services/user';

interface AuthContextType {
    user: User | null;
    allUsers: User[];
    loading: boolean;
    login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
    loginWithGoogle: () => Promise<void>;
    signup: (name: string, email: string, pass: string, licenseId: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    grantAdmin: (userId: string) => Promise<void>;
    revokeAdmin: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const handleUserSession = async (session: Session | null) => {
        if (session?.user) {
            let userProfile = await userService.getUserProfile(session.user.id);
            const isSuperAdminByCredentials = 
                session.user.id === '74b00408-2ab8-4f88-9220-1e1614e50afe' || 
                session.user.email === 'lycoshoster@gmail.com';

            // If profile doesn't exist, create it.
            if (!userProfile && session.user.email) {
                const provider = session.user.app_metadata.provider || 'email';

                const newUserProfileData: User = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
                    licenseId: session.user.user_metadata?.license_id || (provider === 'google' ? 'N/A (Google Sign-In)' : 'N/A'),
                    status: 'approved',
                    isAdmin: isSuperAdminByCredentials,
                    authMethod: provider === 'google' ? 'google' : 'email',
                };
                
                const createdProfile = await userService.createUserProfile(newUserProfileData);

                if (createdProfile) {
                    userProfile = createdProfile;
                } else {
                    // Creation failed, possibly due to a race condition.
                    // Re-fetch the profile, as it was likely created by the other concurrent process.
                    console.log("Profile creation failed, re-fetching profile.");
                    userProfile = await userService.getUserProfile(session.user.id);
                }
            }
            
            // If profile exists, ensure Super Admin rights are correctly set.
            // This syncs the DB with the hardcoded super admin list on every login.
            if (userProfile && isSuperAdminByCredentials && (!userProfile.isAdmin || userProfile.status !== 'approved')) {
                const updates: Partial<User> = {};
                if (!userProfile.isAdmin) updates.isAdmin = true;
                if (userProfile.status !== 'approved') updates.status = 'approved';
                
                if (Object.keys(updates).length > 0) {
                    const updatedProfile = await userService.updateUser(userProfile.id, updates);
                    if (updatedProfile) userProfile = updatedProfile;
                }
            }

            setUser(userProfile);
            if (userProfile?.isAdmin) {
                const users = await userService.getAllUsers();
                setAllUsers(users);
            }
        } else {
            setUser(null);
            setAllUsers([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                handleUserSession(session);
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);
    
    const fetchAllUsersForAdmin = async () => {
        if (user?.isAdmin) {
            const users = await userService.getAllUsers();
            setAllUsers(users);
        }
    };


    const login = async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) return { success: false, error: error.message };
        return { success: true };
    };

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    const signup = async (name: string, email: string, pass: string, licenseId: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
                data: {
                    full_name: name,
                    license_id: licenseId,
                }
            }
        });

        if (error) return { success: false, error: error.message };
        if (!data.user) return { success: false, error: "L'utilisateur n'a pas été créé." };
        
        // Profile creation is now handled by the onAuthStateChange listener
        // via handleUserSession once the user confirms their email. This ensures
        // the user has an active session, which is required for RLS policies
        // to allow the insert on the public.users table.
        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setAllUsers([]);
    };
    
    const grantAdmin = async (userId: string) => {
        if (user?.id === userId) {
            console.warn("Admin cannot change their own role.");
            return;
        }
        await userService.updateUser(userId, { isAdmin: true });
        await fetchAllUsersForAdmin();
    };

    const revokeAdmin = async (userId: string) => {
        if (user?.id === userId) {
            console.warn("Admin cannot change their own role.");
            return;
        }
        await userService.updateUser(userId, { isAdmin: false });
        await fetchAllUsersForAdmin();
    };

    return (
        <AuthContext.Provider value={{ user, allUsers, loading, login, loginWithGoogle, signup, logout, grantAdmin, revokeAdmin }}>
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