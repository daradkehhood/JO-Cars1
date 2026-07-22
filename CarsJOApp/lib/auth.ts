import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = 'jocars_auth';

export interface AuthData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isAdmin?: boolean;
    image?: string;
    phone?: string;
    whatsapp?: string;
    dealerName?: string;
    rating?: number;
    badges?: string[];
  };
}

export async function getToken(): Promise<string | null> {
  try {
    const data = await AsyncStorage.getItem(AUTH_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.token || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAuthData(): Promise<AuthData | null> {
  try {
    const data = await AsyncStorage.getItem(AUTH_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch {
    return null;
  }
}

export async function setAuthData(data: AuthData): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export async function clearAuthData(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}

export async function updateUserInStorage(userData: Partial<AuthData['user']>): Promise<void> {
  const data = await getAuthData();
  if (data) {
    data.user = { ...data.user, ...userData };
    await setAuthData(data);
  }
}
