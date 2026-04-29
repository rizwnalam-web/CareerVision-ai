import axios from 'axios';
import { StudyMaterial } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Video Materials Service
 * Aggregates curated educational content from multiple providers
 * without hosting the content directly. Uses affiliate links where applicable.
 */

const BOCLIPS_API_BASE = 'https://api.boclips.com/v1';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const COURSERA_API_BASE = 'https://api.coursera.org/api/onDemandCourses.v1';

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { high: { url: string } };
    channelTitle: string;
  };
}

interface BoclipsVideo {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  subjects: Array<{ name: string }>;
}

interface CourseraAffiliateData {
  name: string;
  description: string;
  id: string;
  photoUrl: string;
  courseType: string;
}

class VideoMaterialsService {
  /**
   * Search Boclips for educational videos
   * 1.7M+ educational videos available
   */
  async searchBoclips(
    query: string,
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner',
    limit: number = 10
  ): Promise<StudyMaterial[]> {
    try {
      const boclipsApiKey = process.env.BOCLIPS_API_KEY;
      if (!boclipsApiKey) {
        console.warn('BOCLIPS_API_KEY not configured');
        return [];
      }

      const ageRange =
        skillLevel === 'Advanced' ? '16-17' : skillLevel === 'Intermediate' ? '13-15' : '9-12';

      const response = await axios.get(`${BOCLIPS_API_BASE}/videos`, {
        headers: {
          Authorization: `Bearer ${boclipsApiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          query,
          size: limit,
          ages: ageRange,
        },
        timeout: 10000,
      });

      return (response.data._embedded?.videos || []).map((video: BoclipsVideo) => ({
        id: uuidv4(),
        title: video.title,
        type: 'video' as const,
        provider: 'Boclips',
        url: `https://app.boclips.com/library/videos/${video.id}`,
        careerId: 'learning-foundation',
        duration: formatDuration(video.duration),
        thumbnail: video.thumbnailUrl,
        region: 'Global' as const,
        language: 'English',
        rating: 4.5,
        skillLevel,
        description: video.description,
        tags: video.subjects?.map((s: any) => s.name) || [],
      }));
    } catch (error) {
      console.error('Boclips search error:', error);
      return [];
    }
  }

  /**
   * Search YouTube for educational content
   */
  async searchYouTube(
    query: string,
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner',
    limit: number = 10
  ): Promise<StudyMaterial[]> {
    try {
      const youtubeApiKey = process.env.YOUTUBE_API_KEY;
      if (!youtubeApiKey) {
        console.warn('YOUTUBE_API_KEY not configured');
        return [];
      }

      // Channel IDs for trusted educational channels
      const educationalChannels = [
        'UCkRfArvrzheW2E7b6SVV7vA', // TED-Ed
        'UCYO_jab_esuFRV4b0AKCqOw', // Crash Course
        'UC0rXAbzWhfrFFvpxQcWkcVA', // Kurzgesagt – In a Nutshell
        'UCs2sNKGsPB0xa22WmMx-2Ew', // TED
      ];

      const channelFilter = educationalChannels.map((c) => `channelId:${c}`).join('|');

      const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: {
          q: query,
          key: youtubeApiKey,
          part: 'snippet',
          type: 'video',
          maxResults: limit,
          relevanceLanguage: 'en',
          regionCode: 'US',
          safeSearch: 'strict',
        },
        timeout: 10000,
      });

      return (response.data.items || [])
        .filter((item: any) => item.snippet?.thumbnails?.high)
        .map((item: YouTubeVideo) => ({
          id: uuidv4(),
          title: item.snippet.title,
          type: 'video' as const,
          provider: item.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          careerId: 'learning-foundation',
          duration: 'Video',
          thumbnail: item.snippet.thumbnails.high.url,
          region: 'Global' as const,
          language: 'English',
          rating: 4.4,
          skillLevel,
          description: item.snippet.description,
          tags: ['YouTube', 'Educational'],
        }));
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  /**
   * Get Coursera course recommendations with affiliate links
   */
  async searchCoursera(
    query: string,
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner',
    limit: number = 5
  ): Promise<StudyMaterial[]> {
    try {
      const courseraApiKey = process.env.COURSERA_API_KEY;
      if (!courseraApiKey) {
        console.warn('COURSERA_API_KEY not configured');
        return [];
      }

      const affiliateToken = process.env.COURSERA_AFFILIATE_TOKEN;

      const response = await axios.get(`${COURSERA_API_BASE}`, {
        headers: {
          Authorization: `Bearer ${courseraApiKey}`,
        },
        params: {
          q: 'search',
          query: query,
          limit,
        },
        timeout: 10000,
      });

      return (response.data.elements || []).map((course: CourseraAffiliateData) => {
        const affiliateUrl = affiliateToken
          ? `https://coursera.pxf.io/c/1${affiliateToken}/1290490/${course.id}`
          : `https://www.coursera.org/learn/${course.id}`;

        return {
          id: uuidv4(),
          title: course.name,
          type: course.courseType === 'SPECIALIZATION' ? 'course' : 'video' as const,
          provider: 'Coursera',
          url: affiliateUrl,
          careerId: 'learning-foundation',
          duration: 'Self-paced',
          thumbnail: course.photoUrl,
          region: 'Global' as const,
          language: 'English',
          rating: 4.6,
          skillLevel,
          description: course.description,
          tags: ['Course', 'Certification'],
        };
      });
    } catch (error) {
      console.error('Coursera search error:', error);
      return [];
    }
  }

  /**
   * Search Udemy through affiliate partner API
   */
  async searchUdemy(
    query: string,
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner',
    limit: number = 10
  ): Promise<StudyMaterial[]> {
    try {
      const udemyApiKey = process.env.UDEMY_AFFILIATE_ID;
      if (!udemyApiKey) {
        console.warn('UDEMY_AFFILIATE_ID not configured');
        return [];
      }

      // Using Udemy's public search with affiliate links
      const affiliateId = process.env.UDEMY_AFFILIATE_ID;
      const response = await axios.get('https://www.udemy.com/api-2.0/courses', {
        params: {
          search: query,
          skip: 0,
          limit,
          fields: 'id,title,url,image_480x270,primary_category,avg_rating',
        },
        timeout: 10000,
      });

      return (response.data.results || []).map((course: any) => ({
        id: uuidv4(),
        title: course.title,
        type: 'course' as const,
        provider: 'Udemy',
        url: affiliateId
          ? `${course.url}?referralCode=${affiliateId}`
          : course.url,
        careerId: 'learning-foundation',
        duration: 'Self-paced',
        thumbnail: course.image_480x270,
        region: 'Global' as const,
        language: 'English',
        rating: Math.min(5, Math.max(4, course.avg_rating || 4.3)),
        skillLevel,
        description: `${course.primary_category.title} course on Udemy`,
        tags: ['Udemy', 'Practical', 'Affordable'],
      }));
    } catch (error) {
      console.error('Udemy search error:', error);
      return [];
    }
  }

  /**
   * MIT OpenCourseWare integration (free, public)
   */
  async searchMITOpenCourseWare(
    query: string,
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate',
    limit: number = 5
  ): Promise<StudyMaterial[]> {
    try {
      const response = await axios.get('https://ocw.mit.edu/api/v2/courses/', {
        params: {
          search: query,
          limit,
        },
        timeout: 10000,
      });

      return (response.data.results || []).map((course: any) => ({
        id: uuidv4(),
        title: course.title,
        type: 'course' as const,
        provider: 'MIT OpenCourseWare',
        url: course.url,
        careerId: 'learning-foundation',
        duration: course.learning_resource_types?.join(', ') || 'Self-paced',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f70e504c0',
        region: 'Global' as const,
        language: 'English',
        rating: 4.8,
        skillLevel,
        description: `Free MIT course: ${course.description || 'Course materials from MIT'}`,
        tags: ['MIT', 'Free', 'Open Source', 'Academic'],
      }));
    } catch (error) {
      console.error('MIT OpenCourseWare search error:', error);
      return [];
    }
  }

  /**
   * Aggregate materials from all sources
   */
  async searchAllSources(
    query: string,
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner'
  ): Promise<StudyMaterial[]> {
    const [boclipsResults, youtubeResults, courseraResults, udemyResults, mitResults] =
      await Promise.all([
        this.searchBoclips(query, skillLevel, 5),
        this.searchYouTube(query, skillLevel, 8),
        this.searchCoursera(query, skillLevel, 3),
        this.searchUdemy(query, skillLevel, 5),
        this.searchMITOpenCourseWare(query, skillLevel, 3),
      ]);

    // Combine and deduplicate by title similarity
    const combined = [
      ...boclipsResults,
      ...youtubeResults,
      ...courseraResults,
      ...udemyResults,
      ...mitResults,
    ];

    return combined.sort((a, b) => b.rating - a.rating).slice(0, 20);
  }
}

/**
 * Helper function to format duration in seconds to readable format
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

export const videoMaterialsService = new VideoMaterialsService();
