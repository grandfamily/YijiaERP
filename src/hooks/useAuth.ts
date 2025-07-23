import { useState, useEffect } from 'react';
import { User } from '../types';
import { authStore } from '../store/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(authStore.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authStore.subscribe(setUser);
    return unsubscribe;
  }, []);

  return {
    user,
    login: authStore.login.bind(authStore),
    logout: authStore.logout.bind(authStore),
    switchUser: authStore.switchUser.bind(authStore),
    hasPermission: authStore.hasPermission.bind(authStore)
  };
};