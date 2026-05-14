export const RECORD_TYPES = [
  "일반메모",
  "오답",
  "헷갈림",
  "암기사항",
  "GPT링크",
  "주의사항",
  "시험팁",
] as const;

export const STUDY_STATES = ["미확인", "앎", "모름", "재확인필요", "완료"] as const;

export const PROGRESS_STATUSES = ["not-started", "in-progress", "done"] as const;

export const MATERIAL_CATEGORIES = ["인강", "이론", "문제", "기타"] as const;

export type RecordType = (typeof RECORD_TYPES)[number];
export type StudyState = (typeof STUDY_STATES)[number];
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export interface Subject {
  id: string;
  name: string;
  showOnDashboard?: boolean;
  isDefault?: boolean;
}

export interface Material {
  id: string;
  subjectIds: string[];
  subjectId?: string;
  title: string;
  statusLabel: string;
  materialType?: "book" | "lecture" | "summary" | "workbook";
  progressMode?: "topic" | "lecture";
  category?: MaterialCategory;
  showInSubjectView: boolean;
  isDefault?: boolean;
}

export interface SubjectMaterialSetting {
  subjectId: string;
  materialId: string;
  visible: boolean;
  order: number;
}

export interface MaterialTopic {
  id: string;
  materialId: string;
  title: string;
  order: number;
  progress: ProgressStatus;
  updatedAt?: string;
  completedAt?: string;
  isDefault?: boolean;
}

export interface StandardTopic {
  id: string;
  subjectId: string;
  group: string;
  title: string;
  order: number;
  isDefault?: boolean;
}

export interface Subtopic {
  id: string;
  standardTopicId: string;
  title: string;
  order: number;
  isDefault?: boolean;
}

export interface TopicMapping {
  id: string;
  materialTopicId: string;
  standardTopicId: string;
  isDefault?: boolean;
}

export interface StudyRecord {
  id: string;
  title: string;
  content: string;
  type: RecordType;
  subjectId?: string;
  standardTopicId?: string;
  subtopicId?: string;
  materialId?: string;
  materialTopicId?: string;
  link?: string;
  tags?: string[];
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  useReviewCard: boolean;
  studyState: StudyState;
  lastReviewedAt?: string;
  knownCount: number;
  unknownCount: number;
}

export interface DDayEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  isPrimary: boolean;
  hidden: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodayCompletionLog {
  id: string;
  date: string;
  subjectId?: string;
  resourceId: string;
  resourceChapterId: string;
  resourceTypeCategory: MaterialCategory;
  completedAt: string;
}

export interface AppSettings {
  reviewGapDays: number;
}

export interface StudyData {
  version: number;
  initializedAt: string;
  subjects: Subject[];
  materials: Material[];
  subjectMaterialSettings: SubjectMaterialSetting[];
  materialTopics: MaterialTopic[];
  standardTopics: StandardTopic[];
  subtopics: Subtopic[];
  mappings: TopicMapping[];
  records: StudyRecord[];
  dDays: DDayEvent[];
  todayCompletions: TodayCompletionLog[];
  settings: AppSettings;
}

export interface ParsedOutlineRow {
  group?: string;
  title: string;
}
