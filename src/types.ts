export type ChoristerRole = 'Chorister' | 'Organist' | 'Instrument Player';

export type CommitteeRole = 
  | 'President' 
  | 'Vice President'
  | 'Secretary' 
  | 'Vice Secretary'
  | 'Assistant Secretary'
  | 'Treasurer' 
  | 'Vice Treasurer'
  | 'Assistant Treasurer'
  | 'Committee Member'
  | 'Advisor';

export interface CommitteeMember {
  id: string;
  name: string;
  role: CommitteeRole;
  phone: string;
  email: string;
  pin: string;
  avatarColor: string;
  photoUrl?: string;
  choristerId?: string;
  fullName?: string;
}

export interface Chorister {
  id: string;
  name: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  age: number;
  birthdate: string;
  address: string;
  phoneNumber: string;
  parentPhone?: string;
  role: ChoristerRole;
  committeeRole?: CommitteeRole;
  voiceRating?: number; // 1-10 voice rating
  voiceNotes?: string;
  pin?: string; // 4-digit PIN for personal portal login
  photoUrl?: string;
  dateJoined?: string;
  isSchoolStudent?: boolean;
  weeklyMassPreference?: string;
  sundayMassPreference?: string;
  submittedAt?: string;
}

export type HymnCategory = 
  | 'Entrance' 
  | 'Kyrie' 
  | 'Gloria' 
  | 'Responsorial Psalm' 
  | 'Gospel Acclamation' 
  | 'Offertory' 
  | 'Sanctus' 
  | 'Memorial Acclamation' 
  | 'Agnus Dei' 
  | 'Communion' 
  | 'Recessional' 
  | 'Post-Communion'
  | 'Benediction';

export interface Hymn {
  id: string;
  category: HymnCategory;
  title: string;
  hymnNumber?: string;
  keySignature?: string;
  notes?: string;
}

export interface HymnalSong {
  number: number;
  title: string;
  category: string;
  book: 'කිතුනු ගීතිකා 1' | 'කිතුනු ගීතිකා 2';
  liturgicalPart: HymnCategory;
  chorus?: string;
  verses?: string[];
  subTitle?: string;
}

export type TaskDuty = 
  | 'Organist'
  | 'Reading'
  | 'Cantor'
  | 'Choir Director'
  | 'Sound & Mic Setup'
  | 'Robes & Folders'
  | 'Altar & Sanctuary'
  | 'Soloist'
  | 'Printing & Booklets'
  | 'Hospitality & Logistics'
  | 'General';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface TaskAssignment {
  id: string;
  title: string;
  duty: TaskDuty;
  assignedTo: string;
  assignedToPhone?: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
  approvedByPresident?: boolean;
}

export type BudgetType = 'income' | 'expense';
export type BudgetCategory = 
  | 'Music & Scores'
  | 'Musician Honorarium'
  | 'Vestments & Robes'
  | 'Sound & Equipment'
  | 'Printing & Booklets'
  | 'Decorations & Flowers'
  | 'Refreshments & Hospitality'
  | 'Donations & Sponsorship'
  | 'Other';

export interface BudgetItem {
  id: string;
  description: string;
  category: BudgetCategory;
  type: BudgetType;
  budgetedAmount: number;
  actualAmount: number;
  paidDate?: string;
  status: 'Estimated' | 'Approved' | 'Paid' | 'Reimbursed';
  receiptRef?: string;
  notes?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Excused' | 'Late';

export interface AttendanceChangeDetail {
  choristerId: string;
  choristerName: string;
  fromStatus: AttendanceStatus;
  toStatus: AttendanceStatus;
  oldNotes?: string;
  newNotes?: string;
}

export interface AttendanceChangeLogEntry {
  id: string;
  timestamp: string; // ISO string
  formattedDate: string; // e.g. "Sep 26, 2026, 7:15 PM"
  editorName: string; // e.g. "Joshua Peiris"
  editorRole: string; // e.g. "President"
  caption?: string; // custom caption or explanation
  actionType: 'Created' | 'Updated' | 'Retroactive Edit' | 'Bulk Update' | 'Status Changed';
  summary: string;
  changesDetails?: AttendanceChangeDetail[];
}

export interface PracticeAttendanceRecord {
  choristerId: string;
  choristerName: string;
  role: ChoristerRole;
  status: AttendanceStatus;
  notes?: string;
}

export interface PracticeSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "5:00 PM"
  endTime?: string; // e.g. "7:00 PM"
  venue: string; // e.g. "Church Choir Loft"
  focus: string; // e.g. "Feast Mass Hymns & Part Singing"
  eventTitle?: string; // e.g. "Parish Feast & Nine Novenas", "Tuesday Holy Mass", "Sunday Morning Mass 8"
  sessionType?: 'practice' | 'mass';
  notes?: string;
  attendance: PracticeAttendanceRecord[];
  changeLog?: AttendanceChangeLogEntry[];
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  lastChangeCaption?: string;
}

export interface WorkAndBudget {
  hymns: Hymn[];
  tasks: TaskAssignment[];
  practices?: PracticeSession[];
  budget: BudgetItem[];
  targetBudget: number;
  workflowStatus: 'Draft' | 'In Review' | 'President Approved' | 'Published';
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  organist?: string;
  readingPerson?: string;
  psalmPerson?: string;
  acclamationPerson?: string;
  sundayOrdinaryNumber?: string;
}

export interface FeastNovenaEntry {
  dayNumber: number;
  dayLabel: string;
  date: string;
  themeTitle: string;
  themeQuote: string;
  organist: string;
  responsorialPsalmPerson: string;
  alleluiaPerson: string;
  cantor?: string;
  celebrant?: string;
  specialHymn?: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed';
  rosaryTime?: string;
  massTime?: string;
  openingHymn?: string;
  blessingHymn?: string;
  entranceHymn?: string;
  offertory1Hymn?: string;
  offertory2Hymn?: string;
  communion1Hymn?: string;
  communion2Hymn?: string;
  finalHymn?: string;
  customWhatsAppText?: string;
}

export interface WeeklyMassService {
  id: string;
  name: string;
  time: string;
  dayOfWeek: string;
  description?: string;
  workAndBudget: WorkAndBudget;
}

export interface SundayMassGroup {
  id: string;
  title: string;
  services: {
    saturdayVigil: WeeklyMassService;
    sundayEarly: WeeklyMassService;
    sundayMain: WeeklyMassService;
  };
}

export interface WeeklyMassesSchedule {
  tuesday: WeeklyMassService;
  thursday: WeeklyMassService;
  firstFriday: WeeklyMassService;
  saturdayEnglish?: WeeklyMassService;
  sundayMasses: SundayMassGroup;
}

export interface FeastFlagHoisting {
  date: string;
  time: string;
  organist: string;
  notes?: string;
}

export interface FeastVespers {
  date: string;
  time: string;
  tevadharaya: string;
  notes?: string;
}

export interface FeastMassesSchedule {
  date: string;
  mass5Psalm: string;
  mass5Alleluia: string;
  mass630Psalm: string;
  mass630Alleluia: string;
  mass6Psalm: string;
  mass6Alleluia: string;
}

export interface FeastHighMassSchedule {
  date: string;
  time: string;
  organist: string;
  psalm1: string;
  psalm2: string;
  alleluia: string;
  entranceHymn: string;
  offertoryHymn: string;
  communionHymn: string;
  finalHymn: string;
}

export interface MajorEvent {
  id: 'feast' | 'carols' | 'easter' | 'christmas' | 'new-year' | 'christmas-new-year';
  title: string;
  subtitle: string;
  description?: string;
  targetDate: string; // YYYY-MM-DD
  novenaEntries?: FeastNovenaEntry[]; // Specifically for Feast
  flagHoisting?: FeastFlagHoisting;
  vespers?: FeastVespers;
  feastMasses?: FeastMassesSchedule;
  highMass?: FeastHighMassSchedule;
  workAndBudget: WorkAndBudget;
  midnightAlleluia?: string;
  midnightResponse?: string;
  morningAlleluia?: string;
  morningResponse?: string;
  carolsSession1?: Array<{ lessonNumber: number; title: string; lyrics: string }>;
  carolsSession2?: Array<{ id: string; title: string; lyrics: string }>;
}

export interface CustomYearPlanEvent {
  id: string;
  title: string;
  subtitle?: string;
  targetDate: string; // YYYY-MM-DD
  endDate?: string; // Optional end date for multi-day events
  venue?: string;
  description?: string;
  backgroundDriveUrl?: string;
  themeColor?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'teal' | 'cyan';
  themeGradient?: string;
  accentColor?: string;
  isCustom?: boolean;
  addedBy?: string;
  addedAt?: string;
  notes?: string;
  targetBudget?: number;
}

export interface AnnualCalendarConfig {
  feastDate: string;
  carolsDate: string;
  easterDate: string;
  christmasDate?: string;
  newYearDate: string;
  christmasNewYearDate?: string; // legacy fallback
  // Background Google Drive links for the core unchanging events
  feastBackgroundUrl?: string;
  carolsBackgroundUrl?: string;
  easterBackgroundUrl?: string;
  christmasBackgroundUrl?: string;
  newYearBackgroundUrl?: string;
  // Custom events added manually by Lead Joshua
  customEvents?: CustomYearPlanEvent[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  memberName: string;
  role: CommitteeRole;
  action: string;
  details: string;
}

export type HistoryRecordType = 'weekly-mass' | 'major-event' | 'novena' | 'other';

export interface ArchiveRecord {
  id: string;
  year: number;
  eventId: 'feast' | 'carols' | 'easter' | 'christmas-new-year' | 'weekly-mass' | 'other' | string;
  eventTitle: string;
  dateRange: string;
  massDate?: string;
  massType?: string;
  recordType?: HistoryRecordType;
  archivedAt: string;
  archivedBy: string;
  organist?: string;
  readingPerson?: string;
  summary: {
    totalHymns: number;
    totalPractices: number;
    totalBudgeted: number;
    totalActualSpent: number;
    totalIncome: number;
    attendanceAvgPercent?: number;
  };
  novenaEntries?: FeastNovenaEntry[];
  flagHoisting?: {
    date: string;
    time: string;
    organist: string;
    notes?: string;
  };
  vespers?: {
    date: string;
    time: string;
    tevadharaya: string;
    notes?: string;
  };
  feastMasses?: {
    date: string;
    mass5Psalm?: string;
    mass5Alleluia?: string;
    mass630Psalm?: string;
    mass630Alleluia?: string;
    mass6Psalm?: string;
    mass6Alleluia?: string;
  };
  highMass?: {
    date: string;
    time?: string;
    organist?: string;
    psalm1?: string;
    psalm2?: string;
    alleluia?: string;
    entranceHymn?: string;
    offertoryHymn?: string;
    communionHymn?: string;
    finalHymn?: string;
  };
  hymns: Hymn[];
  tasks: TaskAssignment[];
  practices: PracticeSession[];
  budget: BudgetItem[];
  notes?: string;
}

export type HistoryRecord = ArchiveRecord;

