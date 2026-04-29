export interface RegistrationRequest {
  email: string;
  name: string;
  password: string;
  age?: number;
  country?: string;
  interests?: string[];
  budget?: number;
  education?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  firebaseUid?: string;
  email: string;
  name: string;
  age?: number;
  education?: string;
  interests?: string;
  budget?: number;
  country?: string;
  targetLocation?: string;
  targetCareerId?: string;
  gpa?: number;
  achievements?: string;
  annualIncome?: number;
  currentSavings?: number;
  registrationMethod?: "email" | "google" | "firebase";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
  token?: string;
}
