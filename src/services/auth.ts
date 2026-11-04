import { UserProfile } from '../types';

const AUTH_STORAGE_KEY = 'imch_auth_user';

type AuthListener = (user: UserProfile | null) => void;

class AuthService {
  private currentUser: UserProfile | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      } else {
        // Default guest user profile
        this.currentUser = {
          id: 'dev_default',
          name: 'Desenvolvedor IMCH',
          email: 'dev@imch.ao',
          plan: 'pro',
          credits: 50,
          createdAt: new Date().toISOString(),
        };
        this.saveToStorage();
      }
    } catch {
      this.currentUser = null;
    }
  }

  private saveToStorage() {
    try {
      if (this.currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {}
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  subscribe(callback: AuthListener): () => void {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async login(email: string, password?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const namePart = cleanEmail.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      name: formattedName || 'Utilizador IMCH',
      email: cleanEmail,
      plan: 'pro',
      credits: 100,
      createdAt: new Date().toISOString(),
    };

    this.currentUser = user;
    this.saveToStorage();
    return user;
  }

  async register(name: string, email: string, password?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      name: cleanName || 'Utilizador IMCH',
      email: cleanEmail,
      plan: 'pro',
      credits: 100,
      createdAt: new Date().toISOString(),
    };

    this.currentUser = user;
    this.saveToStorage();
    return user;
  }

  logout(): void {
    this.currentUser = null;
    this.saveToStorage();
  }

  consumeCredit(): { allowed: boolean; reason?: string } {
    if (!this.currentUser) {
      return { allowed: false, reason: 'Inicie sessão para utilizar os recursos de IA.' };
    }

    if (this.currentUser.plan === 'enterprise' || this.currentUser.plan === 'pro') {
      return { allowed: true };
    }

    if (this.currentUser.credits <= 0) {
      return {
        allowed: false,
        reason: 'Esgotou os seus créditos de IA. Por favor, atualize para o plano PRO ou recarregue créditos.'
      };
    }

    this.currentUser.credits -= 1;
    this.saveToStorage();
    return { allowed: true };
  }

  upgradePlan(plan: 'pro' | 'enterprise'): UserProfile {
    if (!this.currentUser) {
      throw new Error('Utilizador não autenticado.');
    }

    this.currentUser = {
      ...this.currentUser,
      plan,
      credits: plan === 'enterprise' ? 999999 : 500,
    };

    this.saveToStorage();
    return this.currentUser;
  }

  addCredits(amount: number): UserProfile {
    if (!this.currentUser) {
      throw new Error('Utilizador não autenticado.');
    }

    this.currentUser = {
      ...this.currentUser,
      credits: (this.currentUser.credits || 0) + amount,
    };

    this.saveToStorage();
    return this.currentUser;
  }
}

export const authService = new AuthService();
