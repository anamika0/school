// src/store/useAuthStore.ts
import { create } from 'zustand';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: 'super_admin' | 'principal' | 'teacher' | 'accountant' | 'student' | 'parent';
  permissions: Record<string, boolean>;
}

interface AuthState {
  session: Session | null;
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean; 
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false, 

  initialize: async () => {
    // 🛡️ সুপার-ফাস্ট সিঙ্ক্রোনাস লক! (এটিই হ্যাং হওয়া বন্ধ করবে)
    // ফাংশন কল হওয়ামাত্রই চেক করে সাথে সাথে true করে দিচ্ছি, যাতে কোনোভাবেই দ্বিতীয় রিকোয়েস্ট ঢুকতে না পারে।
    if (get().isInitialized) return;
    set({ isInitialized: true }); 

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) console.error('Error fetching profile:', error);
        
        set({ session, user: profile, isLoading: false });
      } else {
        set({ session: null, user: null, isLoading: false });
      }

      // 🚀 স্মার্ট লিসেনার: শুধুমাত্র দরকার হলেই ডেটাবেসে হিট করবে!
      supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (newSession?.user) {
            // যদি আগে থেকেই ওই ইউজারের ডেটা স্টোরে থাকে, তবে অকারণে আবার ডেটাবেস থেকে ফেচ করবে না
            const currentUser = get().user;
            
            if (!currentUser || currentUser.id !== newSession.user.id) {
              const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', newSession.user.id)
                .maybeSingle();
                
              if (error) console.error('Error fetching profile on auth change:', error);
              set({ session: newSession, user: profile, isLoading: false });
            } else {
              // শুধু সেশন আপডেট, অহেতুক প্রোফাইল লোড নয়
              set({ session: newSession, isLoading: false });
            }
          }
        } else if (event === 'SIGNED_OUT') {
          set({ session: null, user: null, isLoading: false });
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false }); // এরর হলেও যেন লোডিং স্ক্রিনে আটকে না থাকে
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ session: null, user: null });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },
}));