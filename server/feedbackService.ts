const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Feedback {
  id?: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at?: string;
}

export const getTopFeedbacks = async (): Promise<Feedback[]> => {
  const response = await fetch(`${API_URL}/api/feedbacks/top`);
  if (!response.ok) throw new Error('Failed to fetch testimonials');
  return response.json();
};

export const submitFeedback = async (data: { userId?: string; userName: string; rating: number; comment: string }) => {
  const response = await fetch(`${API_URL}/api/feedbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to submit feedback');
  
  return result;
};