import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jgawetjrwwdlxxttetnw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYXdldGpyd3dkbHh4dHRldG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzIzODEsImV4cCI6MjA3NzI0ODM4MX0.O3bH3WHyvpUf3arkgqKY_qQqwk2Y6cG3-czTvlg1pRc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
