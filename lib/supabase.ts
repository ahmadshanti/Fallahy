import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://izbevyspagyjfbgxygdq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6YmV2eXNwYWd5amZiZ3h5Z2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTE0NjQsImV4cCI6MjA5ODAyNzQ2NH0.5IZ7mjoSs0laMh2FZFEwU3NRmJwdIz_a056QClI9rKU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
