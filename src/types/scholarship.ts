// ── Scholarship & Opportunity Types ──────────────────────────────────────────

export type OpportunityType = "scholarship" | "grant" | "fellowship" | "bursary" | "award";
export type OpportunityStatus = "active" | "closed" | "draft" | "archived";
export type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected" | "waitlisted";
export type NotificationStatus = "draft" | "scheduled" | "sent" | "failed";
export type NotificationType = "new_match" | "deadline_reminder" | "status_update" | "announcement" | "direct_message";
export type UserRole = "student" | "admin" | "super_admin";

// ── Scholarship ───────────────────────────────────────────────────────────────
export interface EligibilityCriteria {
  minGpa?: number;
  maxAge?: number;
  minAge?: number;
  countries?: string[];
  educationLevels?: string[];   // e.g. ["undergraduate", "postgraduate"]
  fieldOfStudy?: string[];
  incomeThreshold?: number;     // max annual family income
  citizenshipRequired?: string[];
  otherRequirements?: string;
}

export interface ScholarshipBenefit {
  type: "full_tuition" | "partial_tuition" | "living_stipend" | "travel" | "books" | "cash_award" | "other";
  amount?: number;
  currency?: string;
  description?: string;
}

export interface Scholarship {
  id: string;
  type: OpportunityType;
  title: string;
  provider: string;
  providerLogoUrl?: string;
  description: string;
  eligibility: EligibilityCriteria;
  benefits: ScholarshipBenefit[];
  totalValue?: number;
  currency: string;
  deadline: string;           // ISO date string
  applicationOpenDate?: string;
  applicationUrl?: string;
  tags: string[];
  status: OpportunityStatus;
  featured: boolean;
  totalSlots?: number;
  filledSlots?: number;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;          // admin email
}

// ── Application ───────────────────────────────────────────────────────────────
export interface ApplicationDocument {
  id: string;
  name: string;
  type: "transcript" | "essay" | "recommendation" | "cv" | "portfolio" | "other";
  url: string;
  uploadedAt: string;
}

export interface Application {
  id: string;
  scholarshipId: string;
  scholarshipTitle: string;
  scholarshipType: OpportunityType;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantCountry?: string;
  applicantEducation?: string;
  applicantGpa?: number;
  applicantAge?: number;
  status: ApplicationStatus;
  documents: ApplicationDocument[];
  personalStatement?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  decisionReason?: string;
  submittedAt: string;
  updatedAt: string;
}

// ── Platform User (admin-facing) ──────────────────────────────────────────────
export interface PlatformUser {
  id: string;
  firebaseUid?: string;
  email: string;
  name: string;
  role: UserRole;
  age?: number;
  education?: string;
  country?: string;
  targetLocation?: string;
  subscriptionPlan?: string;
  gpa?: number;
  interests?: string[];
  applicationCount?: number;
  lastActiveAt?: string;
  createdAt?: string;
  isActive: boolean;
  isBanned: boolean;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface ScholarshipAnalyticEntry {
  scholarshipId: string;
  scholarshipTitle: string;
  applicantCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  viewCount: number;
  conversionRate: number;   // applications / views
}

export interface ApplicationTrend {
  date: string;
  applications: number;
  approvals: number;
  rejections: number;
}

export interface DemographicBreakdown {
  label: string;
  value: number;
  percentage: number;
}

export interface ScholarshipGap {
  fieldOfStudy: string;
  studentDemand: number;
  availableScholarships: number;
  gapScore: number;   // higher = more underserved
}

export interface PlatformAnalytics {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalScholarships: number;
  activeScholarships: number;
  totalScholarshipValue: number;
  applicationTrends: ApplicationTrend[];
  topScholarships: ScholarshipAnalyticEntry[];
  countryBreakdown: DemographicBreakdown[];
  educationBreakdown: DemographicBreakdown[];
  scholarshipGaps: ScholarshipGap[];
  matchingAlgorithmStats: {
    totalMatches: number;
    successfulMatches: number;    // led to application
    averageMatchScore: number;
  };
}

// ── Notifications ─────────────────────────────────────────────────────────────
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject: string;
  body: string;
  variables: string[];          // e.g. ["{{applicant_name}}", "{{scholarship_title}}"]
  isDefault: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  subject: string;
  body: string;
  recipientType: "all_users" | "applicants" | "specific_users" | "scholarship_applicants";
  recipientIds?: string[];
  scholarshipId?: string;
  status: NotificationStatus;
  scheduledAt?: string;
  sentAt?: string;
  sentCount?: number;
  failedCount?: number;
  createdBy: string;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  fromAdminEmail: string;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
  subject: string;
  body: string;
  isRead: boolean;
  sentAt: string;
}
