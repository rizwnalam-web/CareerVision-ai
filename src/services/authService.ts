import { RegistrationRequest, LoginRequest, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest } from '../types/auth';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://careervision-ai-skn4.onrender.com/api';

function normalizeApiUrl(url: string) {
  return url.replace(/\/+$/, '').replace(/\/api\/api(\/|$)/g, '/api$1');
}

function buildApiPath(path: string) {
  const baseUrl = normalizeApiUrl(RAW_API_URL);
  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
}

export async function registerUser(data: RegistrationRequest): Promise<any> {
  try {
    const response = await fetch(buildApiPath('users/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Registration failed');
    }

    return result;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function loginUser(data: LoginRequest): Promise<any> {
  try {
    const response = await fetch(buildApiPath('users/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }

    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(buildApiPath('users/auth/password/forgot'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Password reset request failed');
    }

    return result;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
}

export async function resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(buildApiPath('users/auth/password/reset'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Password reset failed');
    }

    return result;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<any> {
  try {
    const response = await fetch(buildApiPath(`users/${userId}`), {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  } catch (error) {
    console.error('Fetch user error:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, data: {
  name?: string;
  age?: number;
  education?: string;
  country?: string;
  targetLocation?: string;
  budget?: number;
  interests?: string[];
  gpa?: number;
  achievements?: string;
}): Promise<any> {
  try {
    const response = await fetch(buildApiPath(`users/${userId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Profile update failed');
    }

    return result;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}
