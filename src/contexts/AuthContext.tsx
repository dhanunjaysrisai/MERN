import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'principal' | 'guide' | 'team_lead' | 'student';
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    auth.getCurrentUser().then(({ user: authUser }) => {
      if (authUser) {
        fetchUserProfile(authUser.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await db.getProfile(userId);
      if (error) throw error;

      if (profile) {
        let roleProfile = null;
        
        // Get role-specific profile data
        if (profile.role === 'student' || profile.role === 'team_lead') {
          const { data } = await db.getStudentByUserId(userId);
          roleProfile = data;
        } else if (profile.role === 'guide') {
          const { data } = await db.getGuideByUserId(userId);
          roleProfile = data;
        }

        setUser({
          id: profile.id,
          name: profile.full_name,
          email: profile.email,
          role: profile.role,
          profile: roleProfile
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;
      
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: any) => {
    try {
      const { name, email, password, role, ...profileData } = userData;
      
      // Sign up user with metadata
      const { data: authData, error: authError } = await auth.signUp(email, password, {
        data: {
          full_name: name,
          role: role
        }
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      // Wait for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create role-specific profile
      if (role === 'student' || role === 'team_lead') {
        const { error: studentError } = await db.createStudent({
          user_id: authData.user.id,
          roll_number: profileData.rollNumber,
          percentage: profileData.backlogs > 0 ? 0 : profileData.percentage,
          domain: profileData.domain,
          backlogs: profileData.backlogs,
          skills: profileData.skills || [],
          academic_year: profileData.academicYear,
          department: profileData.department
        });
        if (studentError) throw studentError;
      } else if (role === 'guide') {
        const { error: guideError } = await db.createGuide({
          user_id: authData.user.id,
          department: profileData.department,
          expertise: profileData.expertise || [],
          max_teams: profileData.maxTeams || 3,
          qualification: profileData.qualification,
          experience: profileData.experience || 0
        });
        if (guideError) throw guideError;
      }

      // Fetch complete profile
      await fetchUserProfile(authData.user.id);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};