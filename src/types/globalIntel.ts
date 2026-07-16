export type InsightColor = 'emerald' | 'indigo' | 'amber' | 'rose' | 'purple';
export type InsightCategory = 'ai-hiring' | 'entry-level' | 'ats-success';
export type InsightRegion = 'global' | 'americas' | 'europe' | 'asia' | 'africa' | 'oceania';
export type InsightTimeWindow = 'morning' | 'day' | 'evening' | 'night';

export interface GlobalIntelFeedItem {
  flag?: string;
  city?: string;
  stat?: string;
  color?: InsightColor;
  regions?: InsightRegion[];
  timeWindows?: InsightTimeWindow[];
  priority?: number;
}

export interface GlobalIntelScheduling {
  useRegionScheduling?: boolean;
  useTimeScheduling?: boolean;
}

export interface GlobalIntelFeed {
  version?: number;
  label?: string;
  rotationMs?: number;
  scheduling?: GlobalIntelScheduling;
  categories?: Partial<Record<InsightCategory, GlobalIntelFeedItem[]>>;
}

export interface CuratedInsight {
  flag: string;
  city: string;
  stat: string;
  category: InsightCategory;
  color: InsightColor;
  regions?: InsightRegion[];
  timeWindows?: InsightTimeWindow[];
  priority?: number;
}