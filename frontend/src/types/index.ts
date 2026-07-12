// ─── Auth ─────────────────────────────────────────────────────────────────────
export type CareerLevel = 'STUDENT' | 'NSS_APPLICANT' | 'GRADUATE' | 'PROFESSIONAL'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  university?: string
  careerLevel?: CareerLevel
  bio?: string
  emailVerified: boolean
  createdAt: string
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'

export interface Job {
  id: string
  jobTitle: string
  company: string
  location?: string
  jobUrl?: string
  description?: string
  salary?: string
  status: ApplicationStatus
  deadline?: string
  appliedAt?: string
  source?: string
  notesCount: number
  createdAt: string
  updatedAt: string
}

export interface ApplicationNote {
  id: string
  jobId: string
  content: string
  createdAt: string
}

// ─── Resume ───────────────────────────────────────────────────────────────────
export interface Resume {
  id: string
  filename: string
  fileSize: number
  active: boolean
  uploadedAt: string
}

export interface ResumeAnalysis {
  id: string
  resumeId: string
  overallScore: number
  summary: string
  skills: string[]
  strengths: string[]
  improvements: string[]
  analysisDate: string
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export interface JobMatch {
  id: string
  jobId: string
  resumeId: string
  matchScore: number
  summary: string
  matchingSkills: string[]
  missingSkills: string[]
  recommendations: string[]
  analysisDate: string
}

// ─── Email ────────────────────────────────────────────────────────────────────
export interface GmailConnection {
  connected: boolean
  gmailAddress?: string
  lastSyncAt?: string
}

export type ScanConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface EmailScanResult {
  id: string
  gmailMessageId: string
  subject: string
  fromAddress: string
  receivedAt: string
  inferredStatus: ApplicationStatus
  confidence: ScanConfidence
  statusApplied: boolean
  scannedAt: string
  jobId?: string
  jobTitle?: string
  company?: string
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType =
  | 'DEADLINE_REMINDER'
  | 'FOLLOW_UP_REMINDER'
  | 'STATUS_CHANGE'
  | 'AI_ANALYSIS_READY'
  | 'SYSTEM'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  relatedJobId?: string
  read: boolean
  readAt?: string
  createdAt: string
}

export interface NotificationPreference {
  deadlineRemindersEnabled: boolean
  deadlineReminderDaysBefore: number
  followUpRemindersEnabled: boolean
  followUpReminderDaysAfterApply: number
  statusChangeAlertsEnabled: boolean
  aiAnalysisAlertsEnabled: boolean
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface AnalyticsOverview {
  total: number
  active: number
  saved: number
  applied: number
  assessment: number
  interview: number
  offer: number
  rejected: number
  responseRate: number
  interviewRate: number
  offerRate: number
  avgDaysToResponse?: number
  topSource?: string
}

export interface ApplicationTrend {
  period: string
  periodStart: string
  count: number
}

export interface SourcePerformance {
  source: string
  total: number
  interviews: number
  offers: number
  interviewRate: number
  offerRate: number
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}
