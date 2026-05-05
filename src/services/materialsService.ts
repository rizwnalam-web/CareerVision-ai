import { StudyMaterial } from '../types/career';
import { getCachedStudyMaterialsByCareer, saveCachedStudyMaterials } from './cacheService';

const API_BASE = import.meta.env.VITE_API_URL || 'https://careervision-ai-skn4.onrender.com/api';

interface SearchOptions {
  query: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  limit?: number;
}

/**
 * Frontend Materials Service
 * Fetches curated educational content from multiple providers
 */
class MaterialsService {
  /**
   * Search all external sources for materials
   */
  async searchAllSources(options: SearchOptions): Promise<StudyMaterial[]> {
    try {
      const params = new URLSearchParams({
        query: options.query,
        skillLevel: options.skillLevel || 'Beginner',
      });

      const response = await fetch(`${API_BASE}/materials/search/all?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to search materials');
      return await response.json();
    } catch (error) {
      console.error('Materials search error:', error);
      return [];
    }
  }

  /**
   * Search Boclips (1.7M+ educational videos)
   */
  async searchBoclips(options: SearchOptions): Promise<StudyMaterial[]> {
    try {
      const params = new URLSearchParams({
        query: options.query,
        skillLevel: options.skillLevel || 'Beginner',
        limit: (options.limit || 10).toString(),
      });

      const response = await fetch(`${API_BASE}/materials/search/boclips?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to search Boclips');
      return await response.json();
    } catch (error) {
      console.error('Boclips search error:', error);
      return [];
    }
  }

  /**
   * Search YouTube educational content
   */
  async searchYouTube(options: SearchOptions): Promise<StudyMaterial[]> {
    try {
      const params = new URLSearchParams({
        query: options.query,
        skillLevel: options.skillLevel || 'Beginner',
        limit: (options.limit || 10).toString(),
      });

      const response = await fetch(`${API_BASE}/materials/search/youtube?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to search YouTube');
      return await response.json();
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  /**
   * Search Coursera courses
   */
  async searchCoursera(options: SearchOptions): Promise<StudyMaterial[]> {
    try {
      const params = new URLSearchParams({
        query: options.query,
        skillLevel: options.skillLevel || 'Beginner',
        limit: (options.limit || 5).toString(),
      });

      const response = await fetch(`${API_BASE}/materials/search/coursera?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to search Coursera');
      return await response.json();
    } catch (error) {
      console.error('Coursera search error:', error);
      return [];
    }
  }

  /**
   * Search Udemy courses
   */
  async searchUdemy(options: SearchOptions): Promise<StudyMaterial[]> {
    try {
      const params = new URLSearchParams({
        query: options.query,
        skillLevel: options.skillLevel || 'Beginner',
        limit: (options.limit || 10).toString(),
      });

      const response = await fetch(`${API_BASE}/materials/search/udemy?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to search Udemy');
      return await response.json();
    } catch (error) {
      console.error('Udemy search error:', error);
      return [];
    }
  }

  /**
   * Search MIT OpenCourseWare (Free)
   */
  async searchMITOpenCourseWare(options: SearchOptions): Promise<StudyMaterial[]> {
    try {
      const params = new URLSearchParams({
        query: options.query,
        skillLevel: options.skillLevel || 'Intermediate',
        limit: (options.limit || 5).toString(),
      });

      const response = await fetch(`${API_BASE}/materials/search/mit-ocw?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to search MIT OpenCourseWare');
      return await response.json();
    } catch (error) {
      console.error('MIT OpenCourseWare search error:', error);
      return [];
    }
  }

  /**
   * Get materials for a specific career
   */
  async getMaterialsByCareer(careerId: string): Promise<StudyMaterial[]> {
    try {
      // Check cache first
      const cached = await getCachedStudyMaterialsByCareer(careerId);
      if (cached && cached.length > 0) {
        return cached;
      }

      const response = await fetch(
        `${API_BASE}/materials?careerId=${careerId}&limit=50`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch materials');
      const materials = await response.json();

      // Cache the results
      saveCachedStudyMaterials(materials, careerId);
      return materials;
    } catch (error) {
      console.error('Get materials by career error:', error);
      return [];
    }
  }

  /**
   * Get all study materials
   */
  async getAllMaterials(filters?: {
    type?: string;
    region?: string;
    skillLevel?: string;
    language?: string;
  }): Promise<StudyMaterial[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.region) params.append('region', filters.region);
      if (filters?.skillLevel) params.append('skillLevel', filters.skillLevel);
      if (filters?.language) params.append('language', filters.language);

      const response = await fetch(`${API_BASE}/materials?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch materials');
      return await response.json();
    } catch (error) {
      console.error('Get all materials error:', error);
      return [];
    }
  }

  /**
   * Save a material for later viewing
   */
  async saveMaterial(material: StudyMaterial): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });

      return response.ok;
    } catch (error) {
      console.error('Save material error:', error);
      return false;
    }
  }

  /**
   * Track material view for recently viewed
   */
  trackMaterialView(materialId: string): void {
    try {
      const recentIds = JSON.parse(localStorage.getItem('sparke_recent_materials') || '[]');
      const updated = [materialId, ...recentIds.filter((id: string) => id !== materialId)].slice(
        0,
        10
      );
      localStorage.setItem('sparke_recent_materials', JSON.stringify(updated));
    } catch (error) {
      console.error('Track material view error:', error);
    }
  }
}

export const materialsService = new MaterialsService();
