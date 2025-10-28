import { supabase } from '../lib/supabase';
import { User } from '../types';

// NOTE: The following functions assume you have a 'users' table in Supabase
// with appropriate Row Level Security (RLS) policies enabled.

const logSupabaseError = (context: string, error: any) => {
    if (!error) return;
    console.error(
        `-- Supabase Error in ${context} --\n` +
        `Message: ${error.message}\n` +
        `Details: ${error.details}\n` +
        `Code: ${error.code}\n` +
        `---------------------------------`
    );
};


export const userService = {
    /**
     * Retrieves a user's profile from the 'users' table.
     * @param userId The UUID of the user.
     * @returns A promise that resolves to the user's profile.
     */
    getUserProfile: async (userId: string): Promise<User | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        // With .single(), an error is expected if no user is found (code PGRST116).
        // We should only log other, unexpected errors.
        if (error && error.code !== 'PGRST116') {
            logSupabaseError('getUserProfile', error);
        }
        return data;
    },

    /**
     * Retrieves all users. (Should be admin-only via RLS)
     * @returns A promise that resolves to the list of all users.
     */
    getAllUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            logSupabaseError('getAllUsers', error);
            return [];
        }
        return data || [];
    },

    /**
     * Creates a user profile in the 'users' table. This is usually called after signup.
     * @param userProfile The user profile data to insert.
     * @returns A promise that resolves to the newly created user profile.
     */
    createUserProfile: async (userProfile: User): Promise<User | null> => {
        const { data, error } = await supabase
            .from('users')
            .insert(userProfile)
            .select()
            .single();
        
        if (error) {
            logSupabaseError('createUserProfile', error);
            return null;
        }
        return data;
    },

    /**
     * Updates a single user by their ID. (Should be admin-only via RLS)
     * @param userId The ID of the user to update.
     * @param updates An object with the fields to update.
     * @returns A promise that resolves to the updated user.
     */
    updateUser: async (userId: string, updates: Partial<User>): Promise<User | null> => {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) {
            logSupabaseError('updateUser', error);
            return null;
        }
        return data;
    },
    
    /**
     * Updates multiple users based on their IDs. (Should be admin-only via RLS)
     * @param userIds An array of user IDs to update.
     * @param updates An object with the fields to update.
     * @returns A promise that resolves to an array of the updated users.
     */
    updateMultipleUsers: async (userIds: string[], updates: Partial<User>): Promise<User[]> => {
        if (userIds.length === 0) return [];
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .in('id', userIds)
            .select();

        if (error) {
            logSupabaseError('updateMultipleUsers', error);
            return [];
        }
        return data || [];
    }
};