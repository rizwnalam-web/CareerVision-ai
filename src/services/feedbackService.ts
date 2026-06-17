const VITE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Normalize API_URL to ensure it always includes /api but only once
const API_URL = VITE_URL.endsWith('/api') ? VITE_URL : `${VITE_URL}/api`;

export interface Feedback {
  id: string;
  user_id?: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const getTopFeedbacks = async (): Promise<Feedback[]> => {
  try {
    const response = await fetch(`${API_URL}/feedbacks/top`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch top feedbacks:', error);
    return [];
  }
};

export const submitFeedback = async (feedbackData: {
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
}) => {
  const response = await fetch(`${API_URL}/feedbacks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedbackData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit feedback');
  }
  return await response.json();
};