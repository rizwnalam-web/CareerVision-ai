import { RegistrationRequest, LoginRequest, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function registerUser(data: RegistrationRequest): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/users/auth/register`, {
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
    const response = await fetch(`${API_URL}/users/auth/login`, {
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
    const response = await fetch(`${API_URL}/users/auth/password/forgot`, {
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
    const response = await fetch(`${API_URL}/users/auth/password/reset`, {
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
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
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
