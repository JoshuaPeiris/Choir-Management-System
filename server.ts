import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  INITIAL_CHORISTERS, 
  INITIAL_COMMITTEE_MEMBERS, 
  INITIAL_FEAST_NOVENAS, 
  INITIAL_WEEKLY_MASSES, 
  INITIAL_MAJOR_EVENTS, 
  INITIAL_CALENDAR_CONFIG,
  INITIAL_AUDIT_LOGS,
  INITIAL_ARCHIVES
} from './src/data/initialData';
import { 
  Chorister, 
  CommitteeMember,
  FeastNovenaEntry, 
  AnnualCalendarConfig, 
  AuditLogEntry, 
  WorkAndBudget,
  PracticeSession,
  ArchiveRecord
} from './src/types';
import { getSupabase, isSupabaseConfigured } from './server/supabase';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy GoogleGenAI client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-memory persistent state (with seed fallback)
let appState = {
  choristers: [...INITIAL_CHORISTERS],
  committeeMembers: [...INITIAL_COMMITTEE_MEMBERS],
  feastNovenas: [...INITIAL_FEAST_NOVENAS],
  weeklyMasses: JSON.parse(JSON.stringify(INITIAL_WEEKLY_MASSES)),
  majorEvents: JSON.parse(JSON.stringify(INITIAL_MAJOR_EVENTS)),
  calendarConfig: { ...INITIAL_CALENDAR_CONFIG },
  auditLogs: [...INITIAL_AUDIT_LOGS],
  practices: [] as PracticeSession[],
  archives: [...INITIAL_ARCHIVES] as ArchiveRecord[],
  branding: {
    logoDriveUrl: 'https://drive.google.com/file/d/1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr/view?usp=sharing',
    logoDirectUrl: 'https://drive.google.com/thumbnail?id=1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr&sz=w800',
    isCentered: false,
    imgScale: 100,
    offsetX: 0,
    offsetY: 0,
    fitMode: 'cover' as 'cover' | 'contain',
    lastUpdatedBy: 'Joshua Peiris (President)',
    updatedAt: new Date().toISOString(),
  },
  notifications: [
    {
      id: 'init-notif-1',
      title: '⛪ Weekly Mass: Try Attend the Mass',
      body: 'Every Weekly Mass: Please try to attend the holy mass and support our choir ministry! Let us worship and praise God together with joyful hearts.',
      category: 'weekly-mass',
      timestamp: new Date().toISOString(),
      read: false,
      sentBy: 'Choir Executive Committee'
    },
    {
      id: 'init-notif-2',
      title: '📋 Choir Committee Member Check-in',
      body: 'Do your part to the choir as a committee member! What should we do next as a Choir ? 🤔 Take a moment to reflect and share your thoughts with the executive team.',
      category: 'committee',
      timestamp: new Date().toISOString(),
      read: false,
      sentBy: 'Executive Committee'
    },
    {
      id: 'init-notif-3',
      title: '🌟 Upcoming Major Celebrations',
      body: 'Main Events Like Feast, Carols, and Easter Are Coming Along! Keep up your practice, check the 100-day countdowns, and review your hymn schedules.',
      category: 'major-events',
      timestamp: new Date().toISOString(),
      read: false,
      sentBy: 'Choir Leadership'
    }
  ] as Array<{
    id: string;
    title: string;
    body: string;
    category: 'weekly-mass' | 'committee' | 'major-events' | 'general';
    timestamp: string;
    read: boolean;
    sentBy?: string;
  }>,
  automatedDispatchHistory: [] as Array<{
    id: string;
    massKey: string;
    massName: string;
    timestamp: string;
    count: number;
    recipients: string[];
    messageSample: string;
  }>,
};

// Helper to verify if actor is Lead Joshua Peiris
export function isJoshuaActor(actor: any): boolean {
  if (!actor) return false;
  const name = String(actor.name || '').trim().toLowerCase();
  const id = String(actor.id || actor.choristerId || '').toLowerCase();
  const email = String(actor.email || '').toLowerCase();
  return (
    name.includes('joshua') ||
    id.includes('joshua') ||
    email.includes('joshua') ||
    email === 'jshpeiris@gmail.com'
  );
}

// Local Disk Persistence to ensure zero data loss on restart
const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'app_state.json');

function saveDiskState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(appState, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DiskState] Failed to save local state cache:', err);
  }
}

function loadDiskState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      if (raw) {
        const loaded = JSON.parse(raw);
        if (loaded && typeof loaded === 'object') {
          if (Array.isArray(loaded.choristers) && loaded.choristers.length > 0) {
            const existingIds = new Set(loaded.choristers.map((c: any) => c.id));
            const mergedChoristers = [...loaded.choristers];
            for (const initC of INITIAL_CHORISTERS) {
              if (!existingIds.has(initC.id)) {
                mergedChoristers.push(initC);
              }
            }
            appState.choristers = mergedChoristers;
          }
          if (Array.isArray(loaded.committeeMembers) && loaded.committeeMembers.length > 0) {
            appState.committeeMembers = loaded.committeeMembers;
          }
          if (loaded.calendarConfig) {
            appState.calendarConfig = { ...appState.calendarConfig, ...loaded.calendarConfig };
          }
          if (loaded.branding) {
            appState.branding = { ...appState.branding, ...loaded.branding };
          }
          if (loaded.majorEvents) {
            appState.majorEvents = { ...appState.majorEvents, ...loaded.majorEvents };
          }
          if (loaded.weeklyMasses) {
            appState.weeklyMasses = { ...appState.weeklyMasses, ...loaded.weeklyMasses };
          }
          if (Array.isArray(loaded.feastNovenas) && loaded.feastNovenas.length > 0) {
            appState.feastNovenas = loaded.feastNovenas;
          }
          if (Array.isArray(loaded.practices)) {
            appState.practices = loaded.practices;
          }
          if (Array.isArray(loaded.archives) && loaded.archives.length > 0) {
            // Merge initial historical archives so concluded 2025 feast is never lost
            const existingIds = new Set(loaded.archives.map((a: any) => a.id));
            const merged = [...loaded.archives];
            for (const initArch of INITIAL_ARCHIVES) {
              if (!existingIds.has(initArch.id)) {
                merged.push(initArch);
              }
            }
            appState.archives = merged;
          } else {
            appState.archives = [...INITIAL_ARCHIVES];
          }
          console.log('[DiskState] Successfully loaded cached application state from local disk.');
        }
      }
    }
  } catch (err) {
    console.warn('[DiskState] Failed to read disk state cache:', err);
  }
  // Ensure all choristers have non-empty birthdates from initial data if missing
  for (const c of appState.choristers) {
    if (!c.birthdate) {
      const match = INITIAL_CHORISTERS.find(ic => ic.id === c.id || ic.name.toLowerCase() === c.name.toLowerCase());
      if (match && match.birthdate) {
        c.birthdate = match.birthdate;
        c.age = match.age;
      }
    }
  }
  saveDiskState();
}
loadDiskState();

// Dynamically compute exact age from birthdate based on reference date
export function computeAgeFromBirthdate(birthdateStr?: string | null, refDate: Date = new Date()): number | null {
  if (!birthdateStr || typeof birthdateStr !== 'string') return null;
  const trimmed = birthdateStr.trim();
  if (!trimmed) return null;

  let birthYear: number | null = null;
  let birthMonth: number | null = null;
  let birthDay: number | null = null;

  const parts = trimmed.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      birthYear = parseInt(parts[0], 10);
      birthMonth = parseInt(parts[1], 10);
      birthDay = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      birthDay = parseInt(parts[0], 10);
      birthMonth = parseInt(parts[1], 10);
      birthYear = parseInt(parts[2], 10);
    }
  }

  if (!birthYear || !birthMonth || !birthDay || isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      birthYear = d.getFullYear();
      birthMonth = d.getMonth() + 1;
      birthDay = d.getDate();
    }
  }

  if (birthYear && birthMonth && birthDay && birthYear > 1900 && birthYear <= refDate.getFullYear()) {
    const curYear = refDate.getFullYear();
    const curMonth = refDate.getMonth() + 1;
    const curDay = refDate.getDate();

    let age = curYear - birthYear;
    if (curMonth < birthMonth || (curMonth === birthMonth && curDay < birthDay)) {
      age--;
    }
    return age >= 0 ? age : null;
  }
  return null;
}

export function syncAllChoristerAges(choristers: Chorister[], refDate: Date = new Date()) {
  if (!Array.isArray(choristers)) return;
  choristers.forEach((c) => {
    if (c.birthdate) {
      const calculatedAge = computeAgeFromBirthdate(c.birthdate, refDate);
      if (calculatedAge !== null && calculatedAge >= 0) {
        c.age = calculatedAge;
      }
    }
  });
}

// Live synchronization between Committee Executive Board and Choristers Database
function syncCommitteeAndChoristers() {
  // Ensure Ruwanga Fernando has accurate details and profile photo
  appState.committeeMembers.forEach(m => {
    if (m.name.toLowerCase().includes('ruwanga')) {
      if (!m.fullName) m.fullName = 'Ruwanga Dewmina Subagya Fernando';
      if (!m.phone) m.phone = '+94 71 995 5910';
      if (!m.photoUrl) m.photoUrl = 'https://drive.google.com/open?id=1KPJUUFuHEvVRyFxQramYwULR9HWN0ga1';
    }
  });
  appState.choristers.forEach(c => {
    if (c.name.toLowerCase().includes('ruwanga')) {
      if (!c.fullName) c.fullName = 'Ruwanga Dewmina Subagya Fernando';
      if (!c.address) c.address = 'No.49 Constantine Lane Koralawella Moratuwa';
      if (!c.dateJoined) c.dateJoined = '2021-09-14';
      if (c.isSchoolStudent === undefined) c.isSchoolStudent = false;
      if (!c.phoneNumber) c.phoneNumber = '+94 71 995 5910';
      if (!c.sundayMassPreference) c.sundayMassPreference = 'Sunday - 8.00 am';
      if (!c.birthdate) c.birthdate = '2000-11-18';
      if (!c.photoUrl) c.photoUrl = 'https://drive.google.com/open?id=1KPJUUFuHEvVRyFxQramYwULR9HWN0ga1';
    }
  });

  // Ensure Saheli Perera exists and has accurate details
  const saheliExists = appState.choristers.find(c => c.name.toLowerCase().includes('saheli') || c.id === 'choir-saheli-perera');
  if (!saheliExists) {
    appState.choristers.push({
      id: 'choir-saheli-perera',
      name: 'Saheli Perera',
      firstName: 'Saheli',
      lastName: 'Perera',
      fullName: 'Saheli Akshitha Perera',
      address: "Fairline' No 75, Koralawella, Moratuwa.",
      dateJoined: '2023-06-17',
      photoUrl: 'https://drive.google.com/open?id=1n2RNVh6pU5rsD5jaVRFF3n35M3bsJTsR',
      isSchoolStudent: true,
      phoneNumber: '074 124 7425',
      weeklyMassPreference: 'Thursday Novena & Mass - 6.00 pm',
      sundayMassPreference: 'Saturday - 6.00 pm',
      role: 'Chorister',
      birthdate: '2009-04-29',
      age: 17,
      pin: '1234',
      submittedAt: '9/14/2026 00:00:00',
    });
  } else {
    if (!saheliExists.fullName) saheliExists.fullName = 'Saheli Akshitha Perera';
    if (!saheliExists.address) saheliExists.address = "Fairline' No 75, Koralawella, Moratuwa.";
    if (!saheliExists.dateJoined) saheliExists.dateJoined = '2023-06-17';
    if (!saheliExists.photoUrl) saheliExists.photoUrl = 'https://drive.google.com/open?id=1n2RNVh6pU5rsD5jaVRFF3n35M3bsJTsR';
    if (saheliExists.isSchoolStudent === undefined) saheliExists.isSchoolStudent = true;
    if (!saheliExists.phoneNumber) saheliExists.phoneNumber = '074 124 7425';
    if (!saheliExists.weeklyMassPreference) saheliExists.weeklyMassPreference = 'Thursday Novena & Mass - 6.00 pm';
    if (!saheliExists.sundayMassPreference) saheliExists.sundayMassPreference = 'Saturday - 6.00 pm';
    if (!saheliExists.birthdate) saheliExists.birthdate = '2009-04-29';
  }

  // Ensure Devsith Mortier is synced correctly with name 'Devsith Mortier' and profile picture
  appState.committeeMembers.forEach(m => {
    if (m.name.toLowerCase().includes('devsith')) {
      if (!m.name) m.name = 'Devsith Mortier';
      if (!m.fullName) m.fullName = 'Devsith Mortier';
      if (!m.photoUrl) m.photoUrl = 'https://drive.google.com/open?id=1jNSyx8-QdJQiMvHbgsWPKEZJuiBIyLhi';
    }
  });
  appState.choristers.forEach(c => {
    if (c.name.toLowerCase().includes('devsith')) {
      if (!c.name) c.name = 'Devsith Mortier';
      if (!c.fullName) c.fullName = 'Devsith Mortier';
      if (!c.photoUrl) c.photoUrl = 'https://drive.google.com/open?id=1jNSyx8-QdJQiMvHbgsWPKEZJuiBIyLhi';
    }
  });

  // Ensure Shaveen Silva has accurate contact number and birthdate
  appState.choristers.forEach(c => {
    if (c.name.toLowerCase().includes('shaveen')) {
      if (!c.phoneNumber) c.phoneNumber = '+94 77 703 8620';
      if (!c.birthdate) c.birthdate = '2004-09-14';
    }
  });

  // Ensure Shevin Fernando has accurate full details, role and mass preferences
  appState.choristers.forEach(c => {
    if (c.name.toLowerCase().includes('shevin') || c.id === 'choir-shevin') {
      if (!c.name) c.name = 'Shevin Fernando';
      if (!c.firstName) c.firstName = 'Shevin';
      if (!c.lastName) c.lastName = 'Fernando';
      if (!c.fullName) c.fullName = 'Meemanage Shevin Ashendra Fernando';
      if (!c.address) c.address = '43/1 Sobadam place, Egodauyana, Moratuwa';
      if (!c.dateJoined) c.dateJoined = '2019-06-18';
      if (c.isSchoolStudent === undefined) c.isSchoolStudent = true;
      if (!c.phoneNumber) c.phoneNumber = '0773113012';
      if (!c.weeklyMassPreference) c.weeklyMassPreference = 'Thursday Novena & Mass - 6.00 pm';
      if (!c.sundayMassPreference) c.sundayMassPreference = 'Sunday - 8.00 am';
      if (!c.birthdate) c.birthdate = '2010-02-18';
      if (c.age === undefined) c.age = 16;
      if (!c.role) c.role = 'Organist';
      if (!c.photoUrl) c.photoUrl = 'https://drive.google.com/open?id=1eMUP81mv9NBb88ytmuDC0b3JT6mEqppA';
    }
  });

  // Ensure Crishmal Attanayake exists with accurate details
  const crishmalExists = appState.choristers.find(c => c.name.toLowerCase().includes('crishmal') || c.id === 'choir-crishmal-attanayake');
  if (!crishmalExists) {
    appState.choristers.push({
      id: 'choir-crishmal-attanayake',
      name: 'Crishmal Attanayake',
      firstName: 'Crishmal',
      lastName: 'Attanayake',
      fullName: 'Ellawalage Crishmal Gayath Attanayake',
      address: "No 27/10 , St.Michael's Jubilee Road , Koralawella , Moratuwa",
      dateJoined: '2018-01-01',
      photoUrl: 'https://drive.google.com/open?id=14Bn2gKkAhwQoa7ffkGdmFk4_0-QZbvUD',
      isSchoolStudent: false,
      phoneNumber: '0713752949',
      parentPhone: '',
      weeklyMassPreference: '',
      sundayMassPreference: 'Sunday - 8.00 am',
      role: 'Chorister',
      birthdate: '1996-05-27',
      age: 30,
      pin: '1234',
      submittedAt: '9/16/2026 12:00:00',
    });
  } else {
    if (!crishmalExists.name) crishmalExists.name = 'Crishmal Attanayake';
    if (!crishmalExists.firstName) crishmalExists.firstName = 'Crishmal';
    if (!crishmalExists.lastName) crishmalExists.lastName = 'Attanayake';
    if (!crishmalExists.fullName) crishmalExists.fullName = 'Ellawalage Crishmal Gayath Attanayake';
    if (!crishmalExists.address) crishmalExists.address = "No 27/10 , St.Michael's Jubilee Road , Koralawella , Moratuwa";
    if (!crishmalExists.dateJoined) crishmalExists.dateJoined = '2018-01-01';
    if (crishmalExists.isSchoolStudent === undefined) crishmalExists.isSchoolStudent = false;
    if (!crishmalExists.phoneNumber) crishmalExists.phoneNumber = '0713752949';
    if (!crishmalExists.sundayMassPreference) crishmalExists.sundayMassPreference = 'Sunday - 8.00 am';
    if (!crishmalExists.birthdate) crishmalExists.birthdate = '1996-05-27';
    if (!crishmalExists.photoUrl) crishmalExists.photoUrl = 'https://drive.google.com/open?id=14Bn2gKkAhwQoa7ffkGdmFk4_0-QZbvUD';
  }

  // Ensure Ruwain Mortier exists with accurate details
  const ruwainExists = appState.choristers.find(c => c.name.toLowerCase().includes('ruwain') || c.id === 'choir-ruwain-mortier');
  if (!ruwainExists) {
    appState.choristers.push({
      id: 'choir-ruwain-mortier',
      name: 'Ruwain Mortier',
      firstName: 'Ruwain',
      lastName: 'Mortier',
      fullName: 'Ruwain Devneth Mortier',
      address: '9A vidyala mawatha koralawella moratuwa',
      dateJoined: '2021-06-01',
      photoUrl: 'https://drive.google.com/open?id=12dtv-PwGliYTyzQ2S4VLkmsCz4z3Zcgl',
      isSchoolStudent: true,
      phoneNumber: '0714920656',
      parentPhone: '0714920656',
      weeklyMassPreference: 'Saturday English Mass - 7.00 am',
      sundayMassPreference: 'Sunday - 6.30 am',
      role: 'Chorister',
      birthdate: '2010-09-06',
      age: 16,
      pin: '1234',
      submittedAt: '9/26/2026 12:00:00',
    });
  } else {
    if (!ruwainExists.name) ruwainExists.name = 'Ruwain Mortier';
    if (!ruwainExists.firstName) ruwainExists.firstName = 'Ruwain';
    if (!ruwainExists.lastName) ruwainExists.lastName = 'Mortier';
    if (!ruwainExists.fullName) ruwainExists.fullName = 'Ruwain Devneth Mortier';
    if (!ruwainExists.address) ruwainExists.address = '9A vidyala mawatha koralawella moratuwa';
    if (!ruwainExists.dateJoined) ruwainExists.dateJoined = '2021-06-01';
    if (!ruwainExists.photoUrl) ruwainExists.photoUrl = 'https://drive.google.com/open?id=12dtv-PwGliYTyzQ2S4VLkmsCz4z3Zcgl';
    if (ruwainExists.isSchoolStudent === undefined) ruwainExists.isSchoolStudent = true;
    if (!ruwainExists.phoneNumber) ruwainExists.phoneNumber = '0714920656';
    if (!ruwainExists.weeklyMassPreference) ruwainExists.weeklyMassPreference = 'Saturday English Mass - 7.00 am';
    if (!ruwainExists.sundayMassPreference) ruwainExists.sundayMassPreference = 'Sunday - 6.30 am';
    if (!ruwainExists.birthdate) ruwainExists.birthdate = '2010-09-06';
  }

  // Ensure Aken Peiris has updated details and photo
  const akenExists = appState.choristers.find(c => c.name.toLowerCase().includes('aken') || c.id === 'choir-aken-peiris');
  if (!akenExists) {
    appState.choristers.push({
      id: 'choir-aken-peiris',
      name: 'Aken Peiris',
      firstName: 'Aken',
      lastName: 'Peiris',
      fullName: 'K.H  Aken  Mehash   Peiris',
      address: '68  koralawella  Moratuva',
      dateJoined: '2026-03-08',
      photoUrl: 'https://drive.google.com/open?id=1Aa_2sl6UQweG2qVZJRfpzPrwShNliHUk',
      isSchoolStudent: true,
      phoneNumber: '0778480657',
      parentPhone: '0778480657',
      weeklyMassPreference: 'Thursday Novena & Mass - 6.00 pm',
      sundayMassPreference: 'Sunday - 8.00 am',
      role: 'Chorister',
      birthdate: '',
      age: 0,
      pin: '1234',
      submittedAt: '9/26/2026 12:00:00',
    });
  } else {
    if (!akenExists.fullName) akenExists.fullName = 'K.H  Aken  Mehash   Peiris';
    if (!akenExists.address) akenExists.address = '68  koralawella  Moratuva';
    if (!akenExists.dateJoined) akenExists.dateJoined = '2026-03-08';
    if (!akenExists.photoUrl) akenExists.photoUrl = 'https://drive.google.com/open?id=1Aa_2sl6UQweG2qVZJRfpzPrwShNliHUk';
    if (akenExists.isSchoolStudent === undefined) akenExists.isSchoolStudent = true;
    if (!akenExists.phoneNumber) akenExists.phoneNumber = '0778480657';
    if (!akenExists.parentPhone) akenExists.parentPhone = '0778480657';
    if (!akenExists.weeklyMassPreference) akenExists.weeklyMassPreference = 'Thursday Novena & Mass - 6.00 pm';
    if (!akenExists.sundayMassPreference) akenExists.sundayMassPreference = 'Sunday - 8.00 am';
  }

  // Ensure Deshan Mendis exists with accurate details
  const deshanExists = appState.choristers.find(c => c.name.toLowerCase().includes('deshan') || c.id === 'choir-deshan-mendis');
  if (!deshanExists) {
    appState.choristers.push({
      id: 'choir-deshan-mendis',
      name: 'Deshan Mendis',
      firstName: 'Deshan',
      lastName: 'Mendis',
      fullName: 'Deshan Mendis',
      address: '66/24, 3rd lane, koralawella moratuwa',
      dateJoined: '2023-07-25',
      photoUrl: 'https://drive.google.com/open?id=1GrmhjM7hyG1ZIlikGvRYsg1PvGsWLib3',
      isSchoolStudent: false,
      phoneNumber: '0704547846',
      parentPhone: '',
      weeklyMassPreference: 'Thursday Novena & Mass - 6.00 pm, Saturday English Mass - 7.00 am',
      sundayMassPreference: 'Sunday - 6.30 am',
      role: 'Chorister',
      birthdate: '2006-04-11',
      age: 20,
      pin: '1234',
      submittedAt: '9/26/2026 12:00:00',
    });
  } else {
    if (!deshanExists.name) deshanExists.name = 'Deshan Mendis';
    if (!deshanExists.firstName) deshanExists.firstName = 'Deshan';
    if (!deshanExists.lastName) deshanExists.lastName = 'Mendis';
    if (!deshanExists.fullName) deshanExists.fullName = 'Deshan Mendis';
    if (!deshanExists.address) deshanExists.address = '66/24, 3rd lane, koralawella moratuwa';
    if (!deshanExists.dateJoined) deshanExists.dateJoined = '2023-07-25';
    if (!deshanExists.photoUrl) deshanExists.photoUrl = 'https://drive.google.com/open?id=1GrmhjM7hyG1ZIlikGvRYsg1PvGsWLib3';
    if (deshanExists.isSchoolStudent === undefined) deshanExists.isSchoolStudent = false;
    if (!deshanExists.phoneNumber) deshanExists.phoneNumber = '0704547846';
    if (!deshanExists.weeklyMassPreference) deshanExists.weeklyMassPreference = 'Thursday Novena & Mass - 6.00 pm, Saturday English Mass - 7.00 am';
    if (!deshanExists.sundayMassPreference) deshanExists.sundayMassPreference = 'Sunday - 6.30 am';
    if (!deshanExists.birthdate) deshanExists.birthdate = '2006-04-11';
  }

  // Ensure Senethmi Fernando exists with accurate details
  const senethmiExists = appState.choristers.find(c => c.name.toLowerCase().includes('senethmi') || c.id === 'choir-senethmi-fernando');
  if (!senethmiExists) {
    appState.choristers.push({
      id: 'choir-senethmi-fernando',
      name: 'Senethmi Fernando',
      firstName: 'Senethmi',
      lastName: 'Fernando',
      fullName: 'Meemanage Senethmi Nehansa Fernando',
      address: '43/1, Sobadam Place, Egodauyana, Moratuwa',
      dateJoined: '2026-02-28',
      photoUrl: 'https://drive.google.com/open?id=1dZOiDQOy3COg82PBb8Gz0pO3IJhSecsL',
      isSchoolStudent: true,
      phoneNumber: '0773113012',
      parentPhone: '0773113012',
      weeklyMassPreference: 'Tuesday Mass - 6.00 pm',
      sundayMassPreference: 'Sunday - 8.00 am',
      role: 'Chorister',
      birthdate: '2015-11-01',
      age: 11,
      pin: '1234',
      submittedAt: '9/26/2026 12:00:00',
    });
  } else {
    if (!senethmiExists.name) senethmiExists.name = 'Senethmi Fernando';
    if (!senethmiExists.firstName) senethmiExists.firstName = 'Senethmi';
    if (!senethmiExists.lastName) senethmiExists.lastName = 'Fernando';
    if (!senethmiExists.fullName) senethmiExists.fullName = 'Meemanage Senethmi Nehansa Fernando';
    if (!senethmiExists.address) senethmiExists.address = '43/1, Sobadam Place, Egodauyana, Moratuwa';
    if (!senethmiExists.dateJoined) senethmiExists.dateJoined = '2026-02-28';
    if (!senethmiExists.photoUrl) senethmiExists.photoUrl = 'https://drive.google.com/open?id=1dZOiDQOy3COg82PBb8Gz0pO3IJhSecsL';
    if (senethmiExists.isSchoolStudent === undefined) senethmiExists.isSchoolStudent = true;
    if (!senethmiExists.phoneNumber) senethmiExists.phoneNumber = '0773113012';
    if (!senethmiExists.parentPhone) senethmiExists.parentPhone = '0773113012';
    if (!senethmiExists.weeklyMassPreference) senethmiExists.weeklyMassPreference = 'Tuesday Mass - 6.00 pm';
    if (!senethmiExists.sundayMassPreference) senethmiExists.sundayMassPreference = 'Sunday - 8.00 am';
    if (!senethmiExists.birthdate) senethmiExists.birthdate = '2015-11-01';
  }

  // Ensure Trina Peiris exists with accurate details
  const trinaExists = appState.choristers.find(c => c.name.toLowerCase().includes('trina') || c.id === 'choir-trina-peiris');
  if (!trinaExists) {
    appState.choristers.push({
      id: 'choir-trina-peiris',
      name: 'Trina Peiris',
      firstName: 'Trina',
      lastName: 'Peiris',
      fullName: 'Baminahannadige Trina Sheyana Menushi Peiris',
      address: '3/94 7th lane Koralawella Moratuwa',
      dateJoined: '2026-02-17',
      photoUrl: 'https://drive.google.com/open?id=1Dn18IoPNQrDL2nacZJ5H4HUuM5DnF5dm',
      isSchoolStudent: true,
      phoneNumber: '0776488733',
      weeklyMassPreference: 'Thursday Novena & Mass - 6.00 pm',
      sundayMassPreference: 'Sunday - 8.00 am',
      role: 'Chorister',
      birthdate: '2013-06-26',
      age: 13,
      pin: '1234',
      submittedAt: '2/17/2026 12:00:00',
    });
  } else {
    if (!trinaExists.name) trinaExists.name = 'Trina Peiris';
    if (!trinaExists.firstName) trinaExists.firstName = 'Trina';
    if (!trinaExists.lastName) trinaExists.lastName = 'Peiris';
    if (!trinaExists.fullName) trinaExists.fullName = 'Baminahannadige Trina Sheyana Menushi Peiris';
    if (!trinaExists.address) trinaExists.address = '3/94 7th lane Koralawella Moratuwa';
    if (!trinaExists.dateJoined) trinaExists.dateJoined = '2026-02-17';
    if (!trinaExists.photoUrl) trinaExists.photoUrl = 'https://drive.google.com/open?id=1Dn18IoPNQrDL2nacZJ5H4HUuM5DnF5dm';
    if (trinaExists.isSchoolStudent === undefined) trinaExists.isSchoolStudent = true;
    if (!trinaExists.phoneNumber) trinaExists.phoneNumber = '0776488733';
    if (!trinaExists.weeklyMassPreference) trinaExists.weeklyMassPreference = 'Thursday Novena & Mass - 6.00 pm';
    if (!trinaExists.sundayMassPreference) trinaExists.sundayMassPreference = 'Sunday - 8.00 am';
    if (!trinaExists.birthdate) trinaExists.birthdate = '2013-06-26';
  }

  // Ensure Sanaya Fernando exists
  const sanayaExists = appState.choristers.find(c => c.name.toLowerCase().includes('sanaya') || c.id === 'choir-sanaya-fernando');
  if (!sanayaExists) {
    appState.choristers.push({
      id: 'choir-sanaya-fernando',
      name: 'Sanaya Fernando',
      firstName: 'Sanaya',
      lastName: 'Fernando',
      fullName: 'Sanaya Fernando',
      address: '',
      dateJoined: '',
      photoUrl: '',
      isSchoolStudent: false,
      phoneNumber: '',
      weeklyMassPreference: '',
      sundayMassPreference: '',
      role: 'Chorister',
      birthdate: '',
      age: 0,
      pin: '1234',
    });
  }

  // Ensure Nipuni exists
  const nipuniExists = appState.choristers.find(c => c.name.toLowerCase().includes('nipuni') || c.id === 'choir-nipuni');
  if (!nipuniExists) {
    appState.choristers.push({
      id: 'choir-nipuni',
      name: 'Nipuni',
      firstName: 'Nipuni',
      lastName: '',
      fullName: 'Nipuni',
      address: '',
      dateJoined: '',
      photoUrl: '',
      isSchoolStudent: false,
      phoneNumber: '',
      weeklyMassPreference: '',
      sundayMassPreference: '',
      role: 'Chorister',
      birthdate: '',
      age: 0,
      pin: '1234',
    });
  }

  // Ensure Sheron exists
  const sheronExists = appState.choristers.find(c => c.name.toLowerCase().includes('sheron') || c.id === 'choir-sheron');
  if (!sheronExists) {
    appState.choristers.push({
      id: 'choir-sheron',
      name: 'Sheron',
      firstName: 'Sheron',
      lastName: '',
      fullName: 'Sheron',
      address: '',
      dateJoined: '',
      photoUrl: '',
      isSchoolStudent: false,
      phoneNumber: '',
      weeklyMassPreference: '',
      sundayMassPreference: '',
      role: 'Chorister',
      birthdate: '',
      age: 0,
      pin: '1234',
    });
  }

  // Calculate and synchronize current ages for all choristers with birthdates
  syncAllChoristerAges(appState.choristers);

  // 1. Ensure all core committee members exist in appState.committeeMembers
  INITIAL_COMMITTEE_MEMBERS.forEach((initComm) => {
    const exists = appState.committeeMembers.find(
      (m) => m.id === initComm.id || m.name.toLowerCase().trim() === initComm.name.toLowerCase().trim()
    );
    if (!exists) {
      appState.committeeMembers.push({ ...initComm });
    }
  });

  // 3. Bidirectional sync between appState.committeeMembers and appState.choristers
  appState.committeeMembers.forEach((comm) => {
    // Find matching chorister by ID, choristerId, or name
    const choirMember = appState.choristers.find(
      (c) =>
        c.id === comm.id ||
        c.id === comm.choristerId ||
        c.name.toLowerCase().trim() === comm.name.toLowerCase().trim() ||
        (comm.fullName && c.fullName && c.fullName.toLowerCase().trim() === comm.fullName.toLowerCase().trim())
    );

    if (choirMember) {
      comm.choristerId = choirMember.id;
      // Sync photoUrl both ways: preserve whichever has the valid photo link
      if (comm.photoUrl && !choirMember.photoUrl) {
        choirMember.photoUrl = comm.photoUrl;
      } else if (choirMember.photoUrl && !comm.photoUrl) {
        comm.photoUrl = choirMember.photoUrl;
      } else if (comm.photoUrl && choirMember.photoUrl && comm.photoUrl !== choirMember.photoUrl) {
        comm.photoUrl = choirMember.photoUrl;
      }
      comm.fullName = choirMember.fullName || comm.fullName;
      if (!comm.phone && choirMember.phoneNumber) comm.phone = choirMember.phoneNumber;
      if (!comm.pin && choirMember.pin) comm.pin = choirMember.pin;

      // Ensure chorister has committeeRole and synced credentials
      choirMember.committeeRole = comm.role;
      if (comm.pin && choirMember.pin !== comm.pin) choirMember.pin = comm.pin;
      if (comm.phone && !choirMember.phoneNumber) choirMember.phoneNumber = comm.phone;
    }
  });

  // Also check if any chorister in appState.choristers has a committeeRole set
  appState.choristers.forEach((c) => {
    if (c.committeeRole) {
      const existing = appState.committeeMembers.find(
        (m) => m.id === c.id || m.choristerId === c.id || m.name.toLowerCase().trim() === c.name.toLowerCase().trim()
      );
      if (!existing) {
        appState.committeeMembers.push({
          id: c.id,
          choristerId: c.id,
          name: c.name,
          fullName: c.fullName || c.name,
          role: c.committeeRole,
          phone: c.phoneNumber,
          email: '',
          pin: c.pin || '1234',
          avatarColor: 'bg-indigo-600',
          photoUrl: c.photoUrl,
        });
      } else {
        existing.role = c.committeeRole;
        if (c.photoUrl) existing.photoUrl = c.photoUrl;
        if (c.fullName) existing.fullName = c.fullName;
        if (c.phoneNumber) existing.phone = c.phoneNumber;
        if (c.pin) existing.pin = c.pin;
      }
    }
  });

  // Deduplicate committee members by canonical person
  const uniqueCommittee: CommitteeMember[] = [];
  appState.committeeMembers.forEach((m) => {
    const isDup = uniqueCommittee.some((u) => {
      if (u.id === m.id) return true;
      const n1 = u.name.toLowerCase().trim();
      const n2 = m.name.toLowerCase().trim();
      return n1 === n2 || (n1.startsWith('devsith') && n2.startsWith('devsith'));
    });
    if (!isDup) {
      uniqueCommittee.push(m);
    }
  });
  appState.committeeMembers = uniqueCommittee;
}
syncCommitteeAndChoristers();

// Live synchronization for Appointed Parish Organists: Dinoli, Chamathka, Shevin, Shevon Silva
function syncOrganists() {
  const targetOrganists = [
    { id: 'choir-dinoli-fernando', name: 'Dinoli Fernando', match: 'dinoli' },
    { id: 'choir-chamathka', name: 'Chamathka', match: 'chamathka' },
    { id: 'choir-shevin', name: 'Shevin Fernando', match: 'shevin' },
    { id: 'choir-shevon-silva', name: 'Shevon Silva', match: 'shevon silva' },
  ];

  targetOrganists.forEach((target) => {
    const existing = appState.choristers.find((c) => 
      c.id === target.id ||
      c.name.toLowerCase().trim() === target.name.toLowerCase().trim() ||
      c.name.toLowerCase().includes(target.match)
    );

    if (existing) {
      existing.role = 'Organist';
    } else {
      // If details don't exist yet, insert clean minimal record so user can enter details manually later
      const newOrg: Chorister = {
        id: target.id,
        name: target.name,
        firstName: target.name.split(' ')[0],
        lastName: '',
        fullName: target.name,
        address: '',
        phoneNumber: '',
        parentPhone: '',
        weeklyMassPreference: '',
        sundayMassPreference: '',
        role: 'Organist',
        birthdate: '',
        age: 0,
        pin: '1234',
        submittedAt: new Date().toISOString(),
      };
      appState.choristers.push(newOrg);
    }
  });

  // Ensure Shevon Fernando is not marked as Organist (since 4 organists are Dinoli, Chamathka, Shevin, Shevon Silva)
  const shevonFernando = appState.choristers.find(
    (c) => c.name.toLowerCase().includes('shevon fernando') || c.id === 'choir-shevon-fernando'
  );
  if (shevonFernando && shevonFernando.role === 'Organist') {
    shevonFernando.role = 'Chorister';
  }
}
syncOrganists();

// Asynchronous hydration from Supabase if configured
async function hydrateFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // 1. Choristers: Merge into current appState (loaded from disk)
    const { data: choirData, error: choirErr } = await supabase.from('choristers').select('*');
    if (!choirErr && choirData && choirData.length > 0) {
      const dbMap = new Map(choirData.map((c: any) => [c.id, c]));
      const nameMap = new Map(choirData.map((c: any) => [c.name?.toLowerCase().trim(), c]));

      // Merge on top of appState.choristers so local disk changes aren't wiped
      const currentList: Chorister[] = [...INITIAL_CHORISTERS];
      const mergedList: Chorister[] = currentList.map((curr) => {
        const fromDb = dbMap.get(curr.id) || nameMap.get(curr.name.toLowerCase().trim());
        if (!fromDb) {
          // New member not in DB yet! Let's upsert them to Supabase
          syncChoristerUpsert(curr);
          return curr;
        }

        // Check if our local initial entry has a birthdate, and either fromDb has no birthdate, or they differ
        let finalBirthdate = fromDb.birthdate || curr.birthdate;
        let finalAge = fromDb.age !== undefined && fromDb.age !== null ? Number(fromDb.age) : curr.age;
        let finalPhotoUrl = fromDb.photo_url || curr.photoUrl || '';

        // If local has a non-empty birthdate and DB is empty OR local has the newly specified user birthdays:
        if (curr.birthdate && curr.birthdate !== fromDb.birthdate) {
          finalBirthdate = curr.birthdate;
          finalAge = curr.age;
        }

        // If local has a newer photoUrl (like Shevin and Siheli new profile pictures):
        if (curr.photoUrl && curr.photoUrl !== fromDb.photo_url) {
          finalPhotoUrl = curr.photoUrl;
        }

        const merged = {
          ...curr,
          name: fromDb.name || curr.name,
          age: finalAge,
          birthdate: finalBirthdate,
          address: fromDb.address ? fromDb.address : curr.address,
          phoneNumber: fromDb.phone_number ? fromDb.phone_number : curr.phoneNumber,
          role: fromDb.role ? fromDb.role : curr.role,
          voiceRating: fromDb.voice_rating !== undefined && fromDb.voice_rating !== null ? Number(fromDb.voice_rating) : curr.voiceRating,
          voiceNotes: fromDb.voice_notes ? fromDb.voice_notes : curr.voiceNotes,
          pin: fromDb.pin ? fromDb.pin : curr.pin,
          photoUrl: finalPhotoUrl,
        };

        // If something changed (birthdate or photoUrl), write back to Supabase to keep it in sync!
        if (finalBirthdate !== fromDb.birthdate || finalPhotoUrl !== fromDb.photo_url) {
          console.log(`[Supabase] Automatically syncing updated details for ${curr.name} to database...`);
          syncChoristerUpsert(merged);
        }

        return merged;
      });

      // Add any additional choristers from Supabase not in current list
      choirData.forEach((c: any) => {
        const found = mergedList.some((m) => m.id === c.id || m.name.toLowerCase().trim() === c.name?.toLowerCase().trim());
        if (!found) {
          mergedList.push({
            id: c.id,
            name: c.name,
            age: Number(c.age) || 0,
            birthdate: c.birthdate || '',
            address: c.address || '',
            phoneNumber: c.phone_number || '',
            role: c.role || 'Chorister',
            voiceRating: c.voice_rating !== undefined ? Number(c.voice_rating) : undefined,
            voiceNotes: c.voice_notes || '',
            pin: c.pin || '1234',
            photoUrl: c.photo_url || '',
          });
        }
      });

      appState.choristers = mergedList;
      console.log(`[Supabase] Hydrated and merged ${appState.choristers.length} choristers with live PostgreSQL database.`);
    }

    // 2. Committee Members: Merge into current appState
    const { data: commData, error: commErr } = await supabase.from('committee_members').select('*');
    if (!commErr && commData && commData.length > 0) {
      const dbCommMap = new Map(commData.map((m: any) => [m.id, m]));
      const nameCommMap = new Map(commData.map((m: any) => [m.name?.toLowerCase().trim(), m]));

      const baseList = appState.committeeMembers.length > 0 ? appState.committeeMembers : INITIAL_COMMITTEE_MEMBERS;
      appState.committeeMembers = baseList.map((curr) => {
        const fromDb = dbCommMap.get(curr.id) || nameCommMap.get(curr.name.toLowerCase().trim());
        if (!fromDb) return curr;
        return {
          ...curr,
          name: fromDb.name || curr.name,
          fullName: fromDb.full_name || curr.fullName || fromDb.name,
          role: fromDb.role || curr.role,
          phone: fromDb.phone || curr.phone,
          email: fromDb.email || curr.email,
          pin: fromDb.pin || curr.pin,
          avatarColor: fromDb.avatar_color || curr.avatarColor,
          photoUrl: fromDb.photo_url || curr.photoUrl || '',
        };
      });
      console.log(`[Supabase] Hydrated ${appState.committeeMembers.length} committee members from live PostgreSQL database.`);
    }
    syncCommitteeAndChoristers();

    // 3. Feast Novenas
    const { data: novenaData, error: novErr } = await supabase.from('feast_novenas').select('*');
    if (!novErr && novenaData && novenaData.length > 0) {
      appState.feastNovenas = novenaData.map((n: any) => {
        const init = INITIAL_FEAST_NOVENAS.find((item) => item.dayNumber === n.day_number);
        return {
          dayNumber: n.day_number,
          dayLabel: n.work_and_budget?.dayLabel || init?.dayLabel || `Novena Day ${n.day_number}`,
          date: n.date || init?.date || `September ${19 + n.day_number}, 2026`,
          themeTitle: n.theme || init?.themeTitle || `Novena Day ${n.day_number}`,
          themeQuote: n.work_and_budget?.themeQuote || init?.themeQuote || '',
          organist: n.work_and_budget?.organist || init?.organist || 'CHAMATHKA',
          responsorialPsalmPerson: n.work_and_budget?.responsorialPsalmPerson || init?.responsorialPsalmPerson || 'SHAVEEN S',
          alleluiaPerson: n.work_and_budget?.alleluiaPerson || init?.alleluiaPerson || 'METHUSHI',
          cantor: n.work_and_budget?.cantor || init?.cantor || '',
          celebrant: n.work_and_budget?.celebrant || init?.celebrant || '',
          specialHymn: n.work_and_budget?.specialHymn || init?.specialHymn || '',
          status: n.work_and_budget?.status || init?.status || 'Scheduled',
          rosaryTime: n.work_and_budget?.rosaryTime || init?.rosaryTime || '@6.30pm',
          massTime: n.work_and_budget?.massTime || init?.massTime || '@7.00pm',
          openingHymn: n.work_and_budget?.openingHymn || init?.openingHymn || 'සව්බල සුරිදුගේ 07',
          blessingHymn: n.work_and_budget?.blessingHymn || init?.blessingHymn || '',
          entranceHymn: n.work_and_budget?.entranceHymn || init?.entranceHymn || 'එක් වී බැදී 502',
          offertory1Hymn: n.work_and_budget?.offertory1Hymn || init?.offertory1Hymn || 'තෙල් මල් සුවද 146',
          offertory2Hymn: n.work_and_budget?.offertory2Hymn || init?.offertory2Hymn || 'හදබැති තුති මල් 134',
          communion1Hymn: n.work_and_budget?.communion1Hymn || init?.communion1Hymn || 'අප ගැනැ මදකුත් 167',
          communion2Hymn: n.work_and_budget?.communion2Hymn || init?.communion2Hymn || 'ආලෝකයේ දරුවෝ 367',
          finalHymn: n.work_and_budget?.finalHymn || init?.finalHymn || 'දෙවිදුන් තෙද බල 08',
          customWhatsAppText: n.work_and_budget?.customWhatsAppText,
        };
      }).sort((a: any, b: any) => a.dayNumber - b.dayNumber);
      console.log(`[Supabase] Hydrated ${novenaData.length} feast novenas from live PostgreSQL database.`);
    }

    // 4. Weekly Masses
    const { data: massData, error: massErr } = await supabase.from('weekly_masses').select('*');
    if (!massErr && massData && massData.length > 0) {
      for (const m of massData) {
        if (m.id === 'tuesday' && m.work_and_budget) {
          appState.weeklyMasses.tuesday.workAndBudget = m.work_and_budget;
        } else if (m.id === 'thursday' && m.work_and_budget) {
          appState.weeklyMasses.thursday.workAndBudget = m.work_and_budget;
        } else if (m.id === 'firstFriday' && m.work_and_budget) {
          appState.weeklyMasses.firstFriday.workAndBudget = m.work_and_budget;
        } else if (m.id === 'saturdayEnglish' && m.work_and_budget) {
          if (appState.weeklyMasses.saturdayEnglish) {
            appState.weeklyMasses.saturdayEnglish.workAndBudget = m.work_and_budget;
          }
        } else if (m.id.startsWith('sunday-') && m.work_and_budget) {
          const subKey = m.id.replace('sunday-', '');
          if ((appState.weeklyMasses.sundayMasses.services as any)[subKey]) {
            (appState.weeklyMasses.sundayMasses.services as any)[subKey].workAndBudget = m.work_and_budget;
          }
        }
      }
      console.log(`[Supabase] Hydrated ${massData.length} weekly mass services from live PostgreSQL database.`);
    }

    // 5. Major Events & System Registries (Calendar, Practices, Archives)
    const { data: eventData, error: eventErr } = await supabase.from('major_events').select('*');
    if (!eventErr && eventData && eventData.length > 0) {
      for (const ev of eventData) {
        if (ev.id === 'calendar_config' && ev.work_and_budget) {
          const rawCal = ev.work_and_budget || {};
          appState.calendarConfig = {
            feastDate: rawCal.feastDate || rawCal.feastTargetDate || appState.calendarConfig.feastDate || '2026-09-29',
            carolsDate: rawCal.carolsDate || rawCal.carolsTargetDate || appState.calendarConfig.carolsDate || '2026-12-20',
            christmasNewYearDate: rawCal.christmasNewYearDate || rawCal.christmasTargetDate || appState.calendarConfig.christmasNewYearDate || '2026-12-25',
            newYearDate: rawCal.newYearDate || rawCal.newYearTargetDate || appState.calendarConfig.newYearDate || '2027-01-01',
            easterDate: rawCal.easterDate || rawCal.easterTargetDate || appState.calendarConfig.easterDate || '2027-03-28',
            feastBackgroundUrl: rawCal.feastBackgroundUrl || appState.calendarConfig.feastBackgroundUrl,
            carolsBackgroundUrl: rawCal.carolsBackgroundUrl || appState.calendarConfig.carolsBackgroundUrl,
            christmasBackgroundUrl: rawCal.christmasBackgroundUrl || appState.calendarConfig.christmasBackgroundUrl,
            newYearBackgroundUrl: rawCal.newYearBackgroundUrl || appState.calendarConfig.newYearBackgroundUrl,
            easterBackgroundUrl: rawCal.easterBackgroundUrl || appState.calendarConfig.easterBackgroundUrl,
            customEvents: Array.isArray(rawCal.customEvents) ? rawCal.customEvents : appState.calendarConfig.customEvents || [],
          };
        } else if (ev.id === 'system_practices' && Array.isArray(ev.work_and_budget)) {
          appState.practices = ev.work_and_budget;
        } else if (ev.id === 'system_archives' && Array.isArray(ev.work_and_budget)) {
          appState.archives = ev.work_and_budget;
        } else if (ev.id === 'branding_config' && ev.work_and_budget) {
          appState.branding = {
            ...appState.branding,
            ...ev.work_and_budget,
          };
        } else if ((appState.majorEvents as any)[ev.id] && ev.work_and_budget) {
          (appState.majorEvents as any)[ev.id].workAndBudget = ev.work_and_budget;
          if (ev.date) (appState.majorEvents as any)[ev.id].targetDate = ev.date;
        }
      }
      console.log(`[Supabase] Hydrated ${eventData.length} major events and system records from live PostgreSQL database.`);
    }

    // 6. Audit Logs
    const { data: logData, error: logErr } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (!logErr && logData && logData.length > 0) {
      appState.auditLogs = logData.map((l: any) => ({
        id: l.id,
        timestamp: l.timestamp || l.created_at,
        memberName: l.member_name,
        role: l.role,
        action: l.action,
        details: l.details,
      }));
      console.log(`[Supabase] Hydrated ${logData.length} audit logs from live PostgreSQL database.`);
    }

    // Strict validation: check if any legacy dummy sample data exists in DB or memory and clean it out
    const hasSampleChoristers = appState.choristers.some((c: any) =>
      c.id.startsWith('ch-mock-') || c.id === 'sample-chorister-1'
    );
    const hasSamplePractices = appState.practices.some((p: any) => p.id === 'test-1');
    const hasSampleArchives = appState.archives.some((a: any) => a.id === 'arch-feast-2025');

    if (hasSampleChoristers || hasSamplePractices || hasSampleArchives) {
      console.log('[Supabase] Detected leftover mock sample data in database. Triggering automatic purge...');
      await purgeAllSampleData();
    } else {
      synchronizePracticesAcrossAllTabs();
    }
    syncOrganists();
    syncCommitteeAndChoristers();
  } catch (err) {
    console.error('[Supabase] Initial sync failed:', err);
    syncOrganists();
    syncCommitteeAndChoristers();
  }
}
hydrateFromSupabase();

// Sync write-through helpers to Supabase PostgreSQL
async function syncNovenaUpsert(n: FeastNovenaEntry) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('feast_novenas').upsert({
      id: `novena-${n.dayNumber}`,
      day_number: n.dayNumber,
      date: n.date,
      time: '7:00 PM',
      theme: n.themeTitle || `Novena Day ${n.dayNumber}`,
      novena_type: 'Feast of St. Michael',
      work_and_budget: {
        dayLabel: n.dayLabel,
        themeTitle: n.themeTitle,
        themeQuote: n.themeQuote,
        organist: n.organist,
        responsorialPsalmPerson: n.responsorialPsalmPerson,
        alleluiaPerson: n.alleluiaPerson,
        cantor: n.cantor,
        celebrant: n.celebrant,
        specialHymn: n.specialHymn,
        status: n.status,
        rosaryTime: n.rosaryTime,
        massTime: n.massTime,
        openingHymn: n.openingHymn,
        blessingHymn: n.blessingHymn,
        entranceHymn: n.entranceHymn,
        offertory1Hymn: n.offertory1Hymn,
        offertory2Hymn: n.offertory2Hymn,
        communion1Hymn: n.communion1Hymn,
        communion2Hymn: n.communion2Hymn,
        finalHymn: n.finalHymn,
        customWhatsAppText: n.customWhatsAppText,
      },
    });
  } catch (err) {
    console.error('[Supabase] Failed to sync novena:', err);
  }
}

async function syncMajorEventUpsert(eventId: string, event: any) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('major_events').upsert({
      id: eventId,
      title: event.title,
      liturgy_type: event.liturgyType || 'Solemn Liturgy',
      date: event.targetDate,
      time: event.time || '08:30',
      description: event.description || '',
      work_and_budget: event.workAndBudget,
    });
  } catch (err) {
    console.error('[Supabase] Failed to sync major event:', err);
  }
}

async function syncWeeklyMassUpsert(serviceId: string, name: string, day: string, time: string, language: string, workAndBudget: any) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('weekly_masses').upsert({
      id: serviceId,
      name,
      day,
      time,
      language,
      work_and_budget: workAndBudget,
    });
  } catch (err) {
    console.error('[Supabase] Failed to sync weekly mass:', err);
  }
}

async function syncCalendarConfig() {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('major_events').upsert({
      id: 'calendar_config',
      title: 'Calendar Configuration',
      liturgy_type: 'System',
      date: new Date().toISOString().substring(0, 10),
      time: '00:00',
      description: 'Annual liturgical dates and countdown parameters',
      work_and_budget: appState.calendarConfig as any,
    });
  } catch (err) {
    console.error('[Supabase] Failed to sync calendar config:', err);
  }
}

async function syncBrandingUpsert(branding: any) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('major_events').upsert({
      id: 'branding_config',
      title: 'Choir Branding & Crest Configuration',
      liturgy_type: 'System',
      date: new Date().toISOString().substring(0, 10),
      time: '00:00',
      description: 'Choir logo Google Drive URL, centering, scale and offset coordinates',
      work_and_budget: branding,
    });
  } catch (err) {
    console.error('[Supabase] Failed to sync branding config:', err);
  }
}

async function syncPractices() {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('major_events').upsert({
      id: 'system_practices',
      title: 'Practices Registry',
      liturgy_type: 'System',
      date: new Date().toISOString().substring(0, 10),
      time: '00:00',
      description: 'Choir rehearsals and attendance records',
      work_and_budget: appState.practices as any,
    });
  } catch (err) {
    console.error('[Supabase] Failed to sync practices:', err);
  }
}

// Utility to detect if a session belongs to a weekly or Sunday Mass
function getTargetMassKeyServer(target: string): string | null {
  const t = target.toLowerCase();
  if (t.includes('tuesday') || t.includes('අඟහරුවාදා')) return 'tuesday';
  if (t.includes('thursday') || t.includes('නුවානය') || t.includes('novena and holy mass') || t.includes('perpetual')) return 'thursday';
  if (t.includes('first friday') || t.includes('පළමු සිකුරාදා')) return 'firstFriday';
  if (t.includes('saturday english') || (t.includes('saturday') && (t.includes('7.00') || t.includes('7:00') || t.includes('english')))) return 'saturdayEnglish';
  if (t.includes('saturday sunday mass 6') || t.includes('saturday 6') || t.includes('vigil') || t.includes('සෙනසුරාදා')) return 'saturdayVigil';
  if (t.includes('sunday morning mass 6.30') || (t.includes('sunday') && (t.includes('6.30') || t.includes('6:30')))) return 'sundayEarly';
  if (t.includes('sunday morning mass 8') || (t.includes('sunday') && (t.includes('8') || t.includes('main')))) return 'sundayMain';
  return null;
}

function getMassKeyFromSessionServer(session: any): string | null {
  const title = (session?.eventTitle || '').toLowerCase().trim();
  const focus = (session?.focus || '').toLowerCase().trim();
  const notes = (session?.notes || '').toLowerCase().trim();
  const combined = `${title} ${focus} ${notes}`;

  if (combined.includes('tuesday') || combined.includes('අඟහරුවාදා')) return 'tuesday';
  if (combined.includes('thursday') || combined.includes('නුවානය') || combined.includes('novena and holy mass')) return 'thursday';
  if (combined.includes('first friday') || combined.includes('පළමු සිකුරාදා')) return 'firstFriday';
  if (combined.includes('saturday english') || combined.includes('7.00') || combined.includes('7:00 am')) return 'saturdayEnglish';
  if (combined.includes('saturday sunday mass 6') || combined.includes('saturday 6') || combined.includes('vigil') || combined.includes('සෙනසුරාදා')) return 'saturdayVigil';
  if (combined.includes('sunday morning mass 6.30') || combined.includes('6.30') || combined.includes('6:30')) return 'sundayEarly';
  if (combined.includes('sunday morning mass 8') || combined.includes('sunday morning mass') || combined.includes('sunday 8') || combined.includes('8.00') || combined.includes('8:00')) return 'sundayMain';

  if (session?.sessionType === 'mass') {
    if (combined.includes('saturday')) return 'saturdayVigil';
    if (combined.includes('sunday')) return 'sundayMain';
    if (combined.includes('friday')) return 'firstFriday';
  }

  return null;
}

// Utility to match a practice session strictly to its relevant event or weekly mass
function isPracticeForEvent(practice: any, eventTitle: string): boolean {
  if (!practice || !eventTitle) return false;
  const pEvent = (practice.eventTitle || '').toLowerCase().trim();
  const target = eventTitle.toLowerCase().trim();

  // Determine if the practice is a Weekly Mass attendance session
  const massKey = getMassKeyFromSessionServer(practice);
  const isWeeklyMassSession = Boolean(massKey) || (
    practice.sessionType === 'mass' && !pEvent.includes('feast') && !pEvent.includes('michael')
  );

  // Determine target category
  const isTargetFeast = target.includes('feast') || target.includes('michael') || target.includes('patronal');
  const isTargetCarols = target.includes('carol') || target.includes('nine lessons');
  const isTargetChristmas = target.includes('christmas') || target.includes('nativity') || target.includes('new year');
  const isTargetEaster = target.includes('easter') || target.includes('holy week') || target.includes('paschal') || target.includes('triduum');
  const isTargetMajorEvent = isTargetFeast || isTargetCarols || isTargetChristmas || isTargetEaster;

  // RULE 1: Weekly Mass attendance sessions MUST NEVER leak into Feast or any Major Event tab
  if (isWeeklyMassSession && isTargetMajorEvent) {
    return false;
  }

  // RULE 2: Feast Tab strictly receives Feast rehearsals only
  if (isTargetFeast) {
    if (
      pEvent.includes('thursday') ||
      pEvent.includes('tuesday') ||
      pEvent.includes('first friday') ||
      pEvent.includes('sunday morning') ||
      pEvent.includes('saturday english') ||
      pEvent.includes('saturday sunday mass')
    ) {
      return false;
    }
    if (pEvent === target) return true;
    if (pEvent.includes('feast') || pEvent.includes('michael') || pEvent.includes('patronal')) return true;
    if (pEvent.includes('novena') && !pEvent.includes('thursday') && !pEvent.includes('perpetual')) return true;
    return false;
  }

  // RULE 3: Other Major Events
  if (isTargetCarols) {
    if (isWeeklyMassSession) return false;
    if (pEvent === target) return true;
    return pEvent.includes('carol') || pEvent.includes('nine lessons');
  }

  if (isTargetChristmas) {
    if (isWeeklyMassSession) return false;
    if (pEvent === target) return true;
    return pEvent.includes('christmas') || pEvent.includes('nativity') || pEvent.includes('new year');
  }

  if (isTargetEaster) {
    if (isWeeklyMassSession) return false;
    if (pEvent === target) return true;
    return pEvent.includes('easter') || pEvent.includes('holy week') || pEvent.includes('paschal') || pEvent.includes('triduum');
  }

  // RULE 4: Weekly Mass target
  const targetMassKey = getTargetMassKeyServer(target);
  if (targetMassKey) {
    if (massKey) {
      return massKey === targetMassKey;
    }
    if (pEvent === target) return true;
    return false;
  }

  if (pEvent === target) return true;
  return false;
}

// Function to keep all event and weekly mass practice arrays in sync with appState.practices
function synchronizePracticesAcrossAllTabs() {
  const all = appState.practices || [];

  // 1. Sync strictly into major events
  const majorKeys = ['feast', 'carols', 'easter', 'christmas-new-year'] as const;
  for (const key of majorKeys) {
    const ev = appState.majorEvents[key];
    if (ev && ev.workAndBudget) {
      ev.workAndBudget.practices = all.filter(p => isPracticeForEvent(p, ev.title));
      syncMajorEventUpsert(key, ev);
    }
  }

  // 2. Sync strictly into weekly masses
  if (appState.weeklyMasses.tuesday?.workAndBudget) {
    appState.weeklyMasses.tuesday.workAndBudget.practices = all.filter(p => isPracticeForEvent(p, appState.weeklyMasses.tuesday.name));
    syncWeeklyMassUpsert('tuesday', appState.weeklyMasses.tuesday.name, appState.weeklyMasses.tuesday.dayOfWeek, appState.weeklyMasses.tuesday.time, 'Sinhala', appState.weeklyMasses.tuesday.workAndBudget);
  }
  if (appState.weeklyMasses.thursday?.workAndBudget) {
    appState.weeklyMasses.thursday.workAndBudget.practices = all.filter(p => isPracticeForEvent(p, appState.weeklyMasses.thursday.name));
    syncWeeklyMassUpsert('thursday', appState.weeklyMasses.thursday.name, appState.weeklyMasses.thursday.dayOfWeek, appState.weeklyMasses.thursday.time, 'Sinhala', appState.weeklyMasses.thursday.workAndBudget);
  }
  if (appState.weeklyMasses.firstFriday?.workAndBudget) {
    appState.weeklyMasses.firstFriday.workAndBudget.practices = all.filter(p => isPracticeForEvent(p, appState.weeklyMasses.firstFriday.name));
    syncWeeklyMassUpsert('firstFriday', appState.weeklyMasses.firstFriday.name, appState.weeklyMasses.firstFriday.dayOfWeek, appState.weeklyMasses.firstFriday.time, 'Sinhala', appState.weeklyMasses.firstFriday.workAndBudget);
  }
  if (appState.weeklyMasses.saturdayEnglish?.workAndBudget) {
    appState.weeklyMasses.saturdayEnglish.workAndBudget.practices = all.filter(p => isPracticeForEvent(p, appState.weeklyMasses.saturdayEnglish.name));
    syncWeeklyMassUpsert('saturdayEnglish', appState.weeklyMasses.saturdayEnglish.name, appState.weeklyMasses.saturdayEnglish.dayOfWeek, appState.weeklyMasses.saturdayEnglish.time, 'English', appState.weeklyMasses.saturdayEnglish.workAndBudget);
  }
  if (appState.weeklyMasses.sundayMasses?.services) {
    for (const [subKey, srv] of Object.entries(appState.weeklyMasses.sundayMasses.services as Record<string, any>)) {
      if (srv?.workAndBudget) {
        srv.workAndBudget.practices = all.filter(p => isPracticeForEvent(p, srv.name || subKey));
        syncWeeklyMassUpsert(`sunday-${subKey}`, srv.name || subKey, srv.dayOfWeek || 'Sunday', srv.time || '', 'Sinhala / English', srv.workAndBudget);
      }
    }
  }
  saveDiskState();
}

// Complete purge of any sample/demo data to ensure a pure live database
async function purgeAllSampleData() {
  console.log('[Purge] Starting complete purge of sample data from database and memory...');
  const supabase = getSupabase();

  // Reset in-memory choristers, practices, archives
  appState.choristers = [];
  appState.practices = [];
  appState.archives = [];

  // Reset feast novena duties and hymns
  appState.feastNovenas = appState.feastNovenas.map((n) => ({
    ...n,
    organist: '',
    responsorialPsalmPerson: '',
    alleluiaPerson: '',
    cantor: '',
    celebrant: '',
    specialHymn: '',
    status: 'Scheduled' as const,
  }));

  // Reset workAndBudget for all major events
  const majorKeys = ['feast', 'carols', 'easter', 'christmas-new-year'] as const;
  for (const key of majorKeys) {
    const ev = appState.majorEvents[key];
    if (ev) {
      ev.workAndBudget = {
        hymns: [],
        tasks: [],
        practices: [],
        budget: [],
        targetBudget: 0,
        workflowStatus: 'Draft',
        lastUpdatedBy: 'Joshua Peiris (President)',
        lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }
  }

  // Reset workAndBudget for all weekly masses
  if (appState.weeklyMasses.tuesday) {
    appState.weeklyMasses.tuesday.workAndBudget = { hymns: [], tasks: [], practices: [], budget: [], targetBudget: 0, workflowStatus: 'Draft' };
  }
  if (appState.weeklyMasses.thursday) {
    appState.weeklyMasses.thursday.workAndBudget = { hymns: [], tasks: [], practices: [], budget: [], targetBudget: 0, workflowStatus: 'Draft' };
  }
  if (appState.weeklyMasses.firstFriday) {
    appState.weeklyMasses.firstFriday.workAndBudget = { hymns: [], tasks: [], practices: [], budget: [], targetBudget: 0, workflowStatus: 'Draft' };
  }
  if (appState.weeklyMasses.sundayMasses?.services) {
    for (const srv of Object.values(appState.weeklyMasses.sundayMasses.services as Record<string, any>)) {
      srv.workAndBudget = { hymns: [], tasks: [], practices: [], budget: [], targetBudget: 0, workflowStatus: 'Draft' };
    }
  }

  // Clear from PostgreSQL live database
  if (supabase) {
    try {
      // 1. Delete choristers
      await supabase.from('choristers').delete().neq('id', 'keep_none');

      // 2. Reset novenas
      for (const n of appState.feastNovenas) {
        await syncNovenaUpsert(n);
      }

      // 3. Reset major events & system registries
      for (const key of majorKeys) {
        await syncMajorEventUpsert(key, appState.majorEvents[key]);
      }
      await syncPractices();
      await syncArchives();

      // 4. Reset weekly masses
      if (appState.weeklyMasses.tuesday) {
        await syncWeeklyMassUpsert('tuesday', appState.weeklyMasses.tuesday.name, appState.weeklyMasses.tuesday.dayOfWeek, appState.weeklyMasses.tuesday.time, 'Sinhala', appState.weeklyMasses.tuesday.workAndBudget);
      }
      if (appState.weeklyMasses.thursday) {
        await syncWeeklyMassUpsert('thursday', appState.weeklyMasses.thursday.name, appState.weeklyMasses.thursday.dayOfWeek, appState.weeklyMasses.thursday.time, 'Sinhala', appState.weeklyMasses.thursday.workAndBudget);
      }
      if (appState.weeklyMasses.firstFriday) {
        await syncWeeklyMassUpsert('firstFriday', appState.weeklyMasses.firstFriday.name, appState.weeklyMasses.firstFriday.dayOfWeek, appState.weeklyMasses.firstFriday.time, 'Sinhala', appState.weeklyMasses.firstFriday.workAndBudget);
      }
      if (appState.weeklyMasses.sundayMasses?.services) {
        for (const [subKey, srv] of Object.entries(appState.weeklyMasses.sundayMasses.services as Record<string, any>)) {
          await syncWeeklyMassUpsert(`sunday-${subKey}`, srv.name || subKey, srv.dayOfWeek || 'Sunday', srv.time || '', 'Sinhala / English', srv.workAndBudget);
        }
      }
      console.log('[Supabase] All sample data successfully cleared from Supabase live database.');
    } catch (dbErr) {
      console.error('[Supabase] Purge error:', dbErr);
    }
  }

  broadcastUpdate('STATE_RESET', null);
}

async function syncArchives() {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('major_events').upsert({
      id: 'system_archives',
      title: 'Historical Archives',
      liturgy_type: 'System',
      date: new Date().toISOString().substring(0, 10),
      time: '00:00',
      description: 'Permanent archive records',
      work_and_budget: appState.archives as any,
    });
  } catch (err) {
    console.error('[Supabase] Failed to sync archives:', err);
  }
}

async function syncAuditLog(log: AuditLogEntry) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('audit_logs').upsert({
      id: log.id,
      timestamp: log.timestamp,
      member_name: log.memberName,
      role: log.role,
      action: log.action,
      details: log.details,
    });
  } catch (err) {
    console.error('[Supabase] Failed to sync audit log:', err);
  }
}

// Push entire application state to Supabase PostgreSQL
async function pushAllToSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not configured');

  // Choristers
  for (const c of appState.choristers) {
    await syncChoristerUpsert(c);
  }
  // Committee
  for (const m of appState.committeeMembers) {
    await supabase.from('committee_members').upsert({
      id: m.id,
      name: m.name,
      role: m.role,
      phone: m.phone || '',
      email: m.email || '',
      pin: m.pin,
      avatar_color: m.avatarColor,
      created_at: new Date().toISOString(),
    });
  }
  // Novenas
  for (const n of appState.feastNovenas) {
    await syncNovenaUpsert(n);
  }
  // Weekly Masses
  if (appState.weeklyMasses?.tuesday) {
    await syncWeeklyMassUpsert('tuesday', appState.weeklyMasses.tuesday.name, appState.weeklyMasses.tuesday.dayOfWeek, appState.weeklyMasses.tuesday.time, 'Sinhala', appState.weeklyMasses.tuesday.workAndBudget);
  }
  if (appState.weeklyMasses?.thursday) {
    await syncWeeklyMassUpsert('thursday', appState.weeklyMasses.thursday.name, appState.weeklyMasses.thursday.dayOfWeek, appState.weeklyMasses.thursday.time, 'Sinhala', appState.weeklyMasses.thursday.workAndBudget);
  }
  if (appState.weeklyMasses?.firstFriday) {
    await syncWeeklyMassUpsert('firstFriday', appState.weeklyMasses.firstFriday.name, appState.weeklyMasses.firstFriday.dayOfWeek, appState.weeklyMasses.firstFriday.time, 'Sinhala', appState.weeklyMasses.firstFriday.workAndBudget);
  }
  if (appState.weeklyMasses?.saturdayEnglish) {
    await syncWeeklyMassUpsert('saturdayEnglish', appState.weeklyMasses.saturdayEnglish.name, appState.weeklyMasses.saturdayEnglish.dayOfWeek, appState.weeklyMasses.saturdayEnglish.time, 'English', appState.weeklyMasses.saturdayEnglish.workAndBudget);
  }
  if (appState.weeklyMasses?.sundayMasses?.services) {
    for (const [subKey, srv] of Object.entries(appState.weeklyMasses.sundayMasses.services as Record<string, any>)) {
      await syncWeeklyMassUpsert(`sunday-${subKey}`, srv.name || subKey, srv.dayOfWeek || 'Sunday', srv.time || '', 'Sinhala / English', srv.workAndBudget);
    }
  }

  // Major Events
  await syncMajorEventUpsert('feast', appState.majorEvents.feast);
  await syncMajorEventUpsert('carols', appState.majorEvents.carols);
  await syncMajorEventUpsert('easter', appState.majorEvents.easter);
  await syncMajorEventUpsert('christmas-new-year', appState.majorEvents['christmas-new-year']);

  // Registries
  await syncCalendarConfig();
  await syncPractices();
  await syncArchives();
}

// SSE connected clients list for real-time synchronization
const sseClients: Response[] = [];

function broadcastUpdate(type: string, payload: unknown) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      // Client disconnected
    }
  });
}

function addAuditLog(memberName: string, role: string, action: string, details: string) {
  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    memberName,
    role: role as any,
    action,
    details,
  };
  appState.auditLogs.unshift(newLog);
  if (appState.auditLogs.length > 50) {
    appState.auditLogs.pop();
  }
  syncAuditLog(newLog);
  broadcastUpdate('AUDIT_LOG_ADDED', newLog);
  return newLog;
}

// --- API ROUTES FIRST ---

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Supabase Connection Status
app.get('/api/supabase/status', async (req: Request, res: Response) => {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return res.json({
      connected: false,
      configured: false,
      message: 'Supabase environment variables (SUPABASE_URL and SUPABASE_ANON_KEY) are not set yet. Running in local server memory mode.',
    });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.json({
      connected: false,
      configured: true,
      message: 'Failed to initialize Supabase client. Please check SUPABASE_URL and key formatting.',
    });
  }

  try {
    const { data, error } = await supabase.from('choristers').select('id').limit(1);
    if (error) {
      const isMissingTable = error.code === 'PGRST205' || error.message.includes('Could not find the table');
      return res.json({
        connected: false,
        configured: true,
        tablesCreated: false,
        error: error.message,
        message: isMissingTable
          ? 'Supabase connection verified! However, tables are not created yet. Please copy the SQL script from the Supabase modal and run it in your Supabase SQL Editor.'
          : `Connected to Supabase, but encountered error: ${error.message}.`,
      });
    }

    const [
      { count: choirCount },
      { count: commCount },
      { count: novenaCount },
      { count: massCount },
      { count: eventCount }
    ] = await Promise.all([
      supabase.from('choristers').select('*', { count: 'exact', head: true }),
      supabase.from('committee_members').select('*', { count: 'exact', head: true }),
      supabase.from('feast_novenas').select('*', { count: 'exact', head: true }),
      supabase.from('weekly_masses').select('*', { count: 'exact', head: true }),
      supabase.from('major_events').select('*', { count: 'exact', head: true })
    ]);

    return res.json({
      connected: true,
      configured: true,
      tablesCreated: true,
      choristersCount: choirCount || 0,
      committeeCount: commCount || 0,
      novenasCount: novenaCount || 0,
      massesCount: massCount || 0,
      eventsCount: eventCount || 0,
      message: 'Successfully connected to live Supabase PostgreSQL database! All tables synced and active.',
    });
  } catch (err: any) {
    return res.json({
      connected: false,
      configured: true,
      error: err.message,
      message: 'Failed to connect to Supabase database.',
    });
  }
});

// SSE endpoint for live real-time sync between web & mobile
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connected ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Sync stream connected' })}\n\n`);

  sseClients.push(res);

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// Full state fetch with live Supabase PIN sync
app.get('/api/state', async (req: Request, res: Response) => {
  await syncPinsFromSupabaseIfAvailable();
  syncAllChoristerAges(appState.choristers);
  res.json(appState);
});

// Notifications Endpoints
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(appState.notifications || []);
});

app.post('/api/notifications', (req: Request, res: Response) => {
  const { notification, actor } = req.body;
  if (!notification || !notification.title || !notification.body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  const notif = {
    id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: notification.title,
    body: notification.body,
    emoji: notification.emoji || '🔔',
    category: notification.category || 'general',
    timestamp: notification.timestamp || new Date().toISOString(),
    read: false,
    sentBy: notification.sentBy || actor?.name || 'Lead Joshua Peiris',
    targetMemberId: notification.targetMemberId,
    targetMemberName: notification.targetMemberName,
    targetMassKey: notification.targetMassKey,
  };

  if (!appState.notifications) appState.notifications = [];
  appState.notifications.unshift(notif);
  if (appState.notifications.length > 60) {
    appState.notifications.pop();
  }

  // Broadcast to all active clients (mobile phones, tablets, desktops)
  broadcastUpdate('NOTIFICATION_SENT', notif);

  addAuditLog(
    actor?.name || notif.sentBy || 'Admin',
    actor?.role || 'Officer',
    'Broadcast Notification',
    `Sent notification "${notif.title}" to choir devices.`
  );

  res.json({ success: true, notification: notif });
});

// Automated Mass Attendance Notification Dispatcher (Dispatches to all committee members)
app.post('/api/notifications/automated-mass-dispatch', (req: Request, res: Response) => {
  const { massKey, massName, customMessage, targetScope } = req.body;
  const name = massName || 'Weekly Holy Mass';
  
  // Target members: all committee members
  const targets = (appState.committeeMembers && appState.committeeMembers.length > 0)
    ? appState.committeeMembers
    : INITIAL_COMMITTEE_MEMBERS;

  const dispatched = [];
  for (const m of targets) {
    const firstName = m.name.split(' ')[0] || m.name;
    const bodyText = customMessage
      ? customMessage.replace(/{name}/g, firstName).replace(/{massName}/g, name)
      : `Dear ${firstName}, holy mass reminder for ${name}: Please try to come for the mass that you agreed to attend! The choir loft counts on every committee member's presence.`;

    const notif = {
      id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `⛪ Mass Reminder: ${name}`,
      body: bodyText,
      category: 'weekly-mass' as const,
      timestamp: new Date().toISOString(),
      read: false,
      sentBy: 'Choir Liturgy Office',
      targetMemberId: m.id,
      targetMemberName: m.name,
      targetMassKey: massKey,
    };

    if (!appState.notifications) appState.notifications = [];
    appState.notifications.unshift(notif);
    broadcastUpdate('NOTIFICATION_SENT', notif);
    dispatched.push(notif);
  }

  while (appState.notifications.length > 80) {
    appState.notifications.pop();
  }

  addAuditLog(
    'Automated Notification System',
    'Liturgy Office',
    'Automated Mass Reminders Dispatched',
    `Automated mass attendance reminders dispatched to all ${dispatched.length} committee members for ${name}.`
  );

  res.json({ success: true, count: dispatched.length, dispatched });
});

// Automated Mass Attendance Notification Dispatcher for ALL Masses to ALL Committee Members
app.post('/api/notifications/automated-dispatch-all-masses', (req: Request, res: Response) => {
  const weeklyMassesList = [
    { key: 'tuesday', name: 'Tuesday Holy Mass', time: '6.00 PM', template: "Dear {name}, Try to Come for the mass that you told ur gonna come - Tuesday Holy Mass!" },
    { key: 'thursday', name: 'Thursday - Novena And Holy Mass', time: '6.00 PM', template: "Dear {name}, Try to Come for the mass that you told ur gonna come - Thursday - Novena And Holy Mass!" },
    { key: 'firstFriday', name: 'First Friday Holy Mass', time: '6.00 PM', template: "Dear {name}, Try to Come for the mass that you told ur gonna come - First Friday Holy Mass!" },
    { key: 'saturdaySundayMass6', name: 'Saturday Sunday Mass 6', time: '6.00 PM', template: "Dear {name}, Try to Come for the mass that you told ur gonna come - Saturday Sunday Mass 6!" },
    { key: 'sundayMorningMass630', name: 'Sunday Morning Mass 6.30', time: '6.30 AM', template: "Dear {name}, Try to Come for the mass that you told ur gonna come - Sunday Morning Mass 6.30!" },
    { key: 'sundayMorningMass8', name: 'Sunday Morning Mass 8', time: '8.00 AM', template: "Dear {name}, Try to Come for the mass that you told ur gonna come - Sunday Morning Mass 8!" }
  ];

  const targets = (appState.committeeMembers && appState.committeeMembers.length > 0)
    ? appState.committeeMembers
    : INITIAL_COMMITTEE_MEMBERS;

  const totalDispatched = [];

  for (const mass of weeklyMassesList) {
    for (const m of targets) {
      const firstName = m.name.split(' ')[0] || m.name;
      const bodyText = mass.template.replace(/{name}/g, firstName);

      const notif = {
        id: `auto-all-${mass.key}-${m.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: `⛪ Mass Reminder: ${mass.name}`,
        body: bodyText,
        category: 'weekly-mass' as const,
        timestamp: new Date().toISOString(),
        read: false,
        sentBy: 'Choir Liturgy Office',
        targetMemberId: m.id,
        targetMemberName: m.name,
        targetMassKey: mass.key,
      };

      if (!appState.notifications) appState.notifications = [];
      appState.notifications.unshift(notif);
      broadcastUpdate('NOTIFICATION_SENT', notif);
      totalDispatched.push(notif);
    }
  }

  while (appState.notifications.length > 120) {
    appState.notifications.pop();
  }

  const logEntry = {
    id: `dispatch-${Date.now()}`,
    massKey: 'all',
    massName: 'All 6 Weekly Masses',
    timestamp: new Date().toISOString(),
    count: totalDispatched.length,
    recipients: targets.map(t => t.name),
    messageSample: "Try to Come for the mass that you told ur gonna come"
  };

  if (!appState.automatedDispatchHistory) appState.automatedDispatchHistory = [];
  appState.automatedDispatchHistory.unshift(logEntry);

  addAuditLog(
    'Automated Notification System',
    'Liturgy Office',
    'Full Automated Mass Notifications Run',
    `Automated mass attendance notifications dispatched across all ${weeklyMassesList.length} masses to all ${targets.length} committee members (${totalDispatched.length} notifications generated).`
  );

  res.json({
    success: true,
    massesCount: weeklyMassesList.length,
    membersCount: targets.length,
    totalDispatched: totalDispatched.length,
    log: logEntry
  });
});

app.get('/api/notifications/automated-history', (req: Request, res: Response) => {
  res.json(appState.automatedDispatchHistory || []);
});

// Custom Notification Dispatcher (Custom Emoji logo, Text, and Recipient selection: each one or all together)
app.post('/api/notifications/custom', (req: Request, res: Response) => {
  const { title, body, emoji, recipients, sentBy } = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Notification message text is required' });
  }

  const customEmoji = (emoji && emoji.trim()) || '🔔';
  const notifTitle = title && title.trim() ? `${customEmoji} ${title.trim()}` : `${customEmoji} Choir Notification`;
  const senderName = sentBy || 'Lead Joshua Peiris';

  const targets = (appState.committeeMembers && appState.committeeMembers.length > 0)
    ? appState.committeeMembers
    : INITIAL_COMMITTEE_MEMBERS;

  const dispatched = [];

  if (!recipients || recipients === 'all' || !Array.isArray(recipients) || recipients.length === 0) {
    // Send to all committee members together
    for (const m of targets) {
      const notif = {
        id: `custom-all-${Date.now()}-${m.id}-${Math.random().toString(36).substr(2, 4)}`,
        title: notifTitle,
        body: body.trim(),
        emoji: customEmoji,
        category: 'committee' as const,
        timestamp: new Date().toISOString(),
        read: false,
        sentBy: senderName,
        targetMemberId: m.id,
        targetMemberName: m.name,
      };

      if (!appState.notifications) appState.notifications = [];
      appState.notifications.unshift(notif);
      broadcastUpdate('NOTIFICATION_SENT', notif);
      dispatched.push(notif);
    }
  } else {
    // Send to chosen specific recipient(s) - each one
    for (const rec of recipients) {
      const recId = typeof rec === 'string' ? rec : rec.id;
      const recName = typeof rec === 'string' ? (targets.find(t => t.id === rec)?.name || rec) : rec.name;

      const notif = {
        id: `custom-one-${Date.now()}-${recId}-${Math.random().toString(36).substr(2, 4)}`,
        title: notifTitle,
        body: body.trim(),
        emoji: customEmoji,
        category: 'committee' as const,
        timestamp: new Date().toISOString(),
        read: false,
        sentBy: senderName,
        targetMemberId: recId,
        targetMemberName: recName,
      };

      if (!appState.notifications) appState.notifications = [];
      appState.notifications.unshift(notif);
      broadcastUpdate('NOTIFICATION_SENT', notif);
      dispatched.push(notif);
    }
  }

  while (appState.notifications && appState.notifications.length > 100) {
    appState.notifications.pop();
  }

  addAuditLog(
    senderName,
    'Lead President',
    'Custom Notification Dispatched',
    `Custom notification with logo "${customEmoji}" dispatched to ${dispatched.length} recipient(s): "${notifTitle}".`
  );

  res.json({ success: true, count: dispatched.length, dispatched });
});

// Pledged Mass Attendance Reminders Dispatcher
// Dispatches to every committee member for the mass they told they would come
app.post('/api/notifications/dispatch-pledged-masses', (req: Request, res: Response) => {
  const { pledges, sentBy } = req.body;
  // pledges is an array of: { massKey: string, massName: string, memberId: string, memberName: string, phone?: string }
  if (!Array.isArray(pledges) || pledges.length === 0) {
    return res.status(400).json({ error: 'No pledged members provided' });
  }

  const senderName = sentBy || 'Lead Joshua Peiris';
  const dispatched = [];

  for (const item of pledges) {
    const firstName = item.memberName.split(' ')[0] || item.memberName;
    const bodyText = `Dear ${firstName}, Try to Come for the mass that you told ur gonna come - ${item.massName}!`;

    const notif = {
      id: `pledge-${item.massKey}-${item.memberId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `⛪ Mass Reminder: ${item.massName}`,
      body: bodyText,
      emoji: '⛪',
      category: 'weekly-mass' as const,
      timestamp: new Date().toISOString(),
      read: false,
      sentBy: senderName,
      targetMemberId: item.memberId,
      targetMemberName: item.memberName,
      targetMassKey: item.massKey,
    };

    if (!appState.notifications) appState.notifications = [];
    appState.notifications.unshift(notif);
    broadcastUpdate('NOTIFICATION_SENT', notif);
    dispatched.push(notif);
  }

  while (appState.notifications && appState.notifications.length > 120) {
    appState.notifications.pop();
  }

  addAuditLog(
    senderName,
    'Lead President',
    'Mass Pledges Reminders Dispatched',
    `Attendance reminders dispatched to ${dispatched.length} committee members for masses they told they would come.`
  );

  res.json({ success: true, count: dispatched.length, dispatched });
});

// --- REAL-TIME PRESENCE & ONLINE COMMITTEE TRACKER ---
interface OnlinePresenceSession {
  sessionId: string;
  memberId: string;
  memberName: string;
  role: string;
  avatarColor: string;
  photoUrl?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  platform?: string;
  lastSeen: number;
  ip?: string;
}

const activePresenceSessions = new Map<string, OnlinePresenceSession>();

function getActiveOnlineUsers(): OnlinePresenceSession[] {
  const now = Date.now();
  // Filter out inactive sessions older than 25 seconds
  for (const [key, session] of activePresenceSessions.entries()) {
    if (now - session.lastSeen > 25000) {
      activePresenceSessions.delete(key);
    }
  }
  // Deduplicate by memberId (if multiple tabs, keep newest)
  const byMember = new Map<string, OnlinePresenceSession>();
  for (const s of activePresenceSessions.values()) {
    const existing = byMember.get(s.memberId);
    if (!existing || s.lastSeen > existing.lastSeen) {
      byMember.set(s.memberId, s);
    }
  }
  return Array.from(byMember.values());
}

// Presence Heartbeat endpoint
app.post('/api/presence/heartbeat', (req: Request, res: Response) => {
  const { memberId, memberName, role, avatarColor, photoUrl, deviceType, platform, sessionId } = req.body;
  if (!memberId || !memberName) {
    return res.status(400).json({ error: 'memberId and memberName are required' });
  }

  const sId = sessionId || `${memberId}-${req.ip || 'client'}`;
  const session: OnlinePresenceSession = {
    sessionId: sId,
    memberId,
    memberName,
    role: role || 'Committee Member',
    avatarColor: avatarColor || 'bg-amber-600',
    photoUrl,
    deviceType: deviceType || 'mobile',
    platform: platform || 'Web/PWA',
    lastSeen: Date.now(),
    ip: req.ip,
  };

  const wasEmpty = activePresenceSessions.size === 0;
  activePresenceSessions.set(sId, session);
  const onlineList = getActiveOnlineUsers();

  // Broadcast presence update if changed or new
  broadcastUpdate('PRESENCE_UPDATED', onlineList);

  res.json({ success: true, onlineUsers: onlineList, count: onlineList.length });
});

// Get Online Users (Lead Joshua & system status)
app.get('/api/presence/online', (req: Request, res: Response) => {
  const onlineList = getActiveOnlineUsers();
  res.json({ onlineUsers: onlineList, count: onlineList.length });
});

// User Leave / Logout presence endpoint
app.post('/api/presence/leave', (req: Request, res: Response) => {
  const { memberId, sessionId } = req.body;
  if (sessionId && activePresenceSessions.has(sessionId)) {
    activePresenceSessions.delete(sessionId);
  } else if (memberId) {
    for (const [key, val] of activePresenceSessions.entries()) {
      if (val.memberId === memberId) {
        activePresenceSessions.delete(key);
      }
    }
  }
  const onlineList = getActiveOnlineUsers();
  broadcastUpdate('PRESENCE_UPDATED', onlineList);
  res.json({ success: true, count: onlineList.length });
});

// Real-Time Background & On-Demand Supabase PIN Synchronizer
async function syncPinsFromSupabaseIfAvailable(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { data: dbComms, error: commErr } = await supabase.from('committee_members').select('id, name, pin');
    if (!commErr && Array.isArray(dbComms) && dbComms.length > 0) {
      let changed = false;
      for (const dbM of dbComms) {
        if (!dbM.pin) continue;
        const cleanDbPin = String(dbM.pin).trim();
        const local = appState.committeeMembers.find(
          (m) => m.id === dbM.id || m.name.toLowerCase().trim() === dbM.name?.toLowerCase().trim()
        );
        if (local && local.pin !== cleanDbPin) {
          console.log(`[Supabase Auto-Sync] Updated PIN for committee member ${local.name}: ${local.pin} -> ${cleanDbPin}`);
          local.pin = cleanDbPin;
          changed = true;
          // Also sync matching chorister
          const choir = appState.choristers.find(
            (c) => c.id === local.id || c.name.toLowerCase().trim() === local.name.toLowerCase().trim()
          );
          if (choir) choir.pin = cleanDbPin;
        }
      }
      if (changed) {
        saveDiskState();
        broadcastUpdate('COMMITTEE_UPDATED', appState.committeeMembers);
        broadcastUpdate('CHORISTERS_UPDATED', appState.choristers);
      }
    }
  } catch (err) {
    // Non-blocking sync
  }
}

// Periodic auto-sync every 15 seconds to ensure changes made in Supabase are pulled instantly
setInterval(() => {
  syncPinsFromSupabaseIfAvailable().catch(() => {});
}, 15000);

// Authenticate committee member or organist/chorister with PIN
app.post('/api/auth/verify', async (req: Request, res: Response) => {
  const { memberId, pin } = req.body;
  if (!memberId || !pin) {
    return res.status(400).json({ error: 'memberId and pin are required' });
  }

  const cleanPin = String(pin || '').trim();

  // Find target local member first
  const member = appState.committeeMembers.find(
    (m) => m.id === memberId || m.choristerId === memberId || m.name.toLowerCase().trim() === String(memberId).toLowerCase().trim()
  );

  // If Supabase is connected, check live Supabase in case PIN was changed directly in Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      // 1. Check committee_members in Supabase by ID or Name
      let query = supabase.from('committee_members').select('id, name, pin');
      if (member) {
        query = query.or(`id.eq.${member.id},name.ilike.${member.name.trim()}`);
      } else {
        query = query.eq('id', memberId);
      }
      const { data: dbComms } = await query;
      const dbComm = dbComms && dbComms[0];

      if (dbComm && dbComm.pin) {
        const cleanDbPin = String(dbComm.pin).trim();
        if (member && member.pin !== cleanDbPin) {
          console.log(`[Supabase Auth] Syncing live PIN from Supabase for ${member.name}: ${member.pin} -> ${cleanDbPin}`);
          member.pin = cleanDbPin;
          saveDiskState();
          broadcastUpdate('COMMITTEE_UPDATED', appState.committeeMembers);
        }
      }

      // 2. Also check choristers in Supabase by ID or Name
      let choirQuery = supabase.from('choristers').select('id, name, pin');
      if (member) {
        choirQuery = choirQuery.or(`id.eq.${member.id},name.ilike.${member.name.trim()}`);
      } else {
        choirQuery = choirQuery.eq('id', memberId);
      }
      const { data: dbChoirs } = await choirQuery;
      const dbChoir = dbChoirs && dbChoirs[0];

      if (dbChoir && dbChoir.pin) {
        const cleanChoirPin = String(dbChoir.pin).trim();
        // If user changed the PIN in choristers table to cleanPin, sync to member as well
        if (cleanChoirPin === cleanPin && member && member.pin !== cleanPin) {
          console.log(`[Supabase Auth] Syncing live PIN from Supabase choristers for ${member.name}: ${cleanChoirPin}`);
          member.pin = cleanChoirPin;
          await supabase.from('committee_members').update({ pin: cleanChoirPin }).or(`id.eq.${member.id},name.ilike.${member.name.trim()}`);
          saveDiskState();
          broadcastUpdate('COMMITTEE_UPDATED', appState.committeeMembers);
        }
      }
    } catch (err) {
      console.error('[Supabase Auth] Live PIN check error:', err);
    }
  }

  // Check committee members
  if (member) {
    if (member.pin !== cleanPin) {
      return res.status(401).json({ error: 'Invalid PIN for committee member' });
    }
    const chorister = appState.choristers.find(
      (c) => c.id === member.id || c.id === member.choristerId || c.name.toLowerCase().trim() === member.name.toLowerCase().trim()
    );
    return res.json({ success: true, member, chorister, isCommittee: true });
  }

  // Also check chorister / organist by ID or name
  const chorister = appState.choristers.find(
    (c) => c.id === memberId || c.name.toLowerCase().trim() === String(memberId).toLowerCase().trim()
  );
  if (chorister) {
    if (supabase) {
      try {
        const { data: liveCh } = await supabase.from('choristers').select('id, pin').or(`id.eq.${chorister.id},name.ilike.${chorister.name.trim()}`);
        if (liveCh && liveCh[0] && liveCh[0].pin) {
          chorister.pin = String(liveCh[0].pin).trim();
        }
      } catch {}
    }
    const choristerPin = chorister.pin || '1234';
    if (choristerPin !== cleanPin) {
      return res.status(401).json({ error: 'Invalid PIN for member' });
    }
    const organistMember: CommitteeMember = {
      id: chorister.id,
      choristerId: chorister.id,
      name: chorister.name,
      fullName: chorister.fullName || chorister.name,
      role: (chorister.role === 'Organist' ? 'Organist' : 'Chorister') as any,
      phone: chorister.phoneNumber,
      email: '',
      pin: choristerPin,
      avatarColor: chorister.role === 'Organist' ? 'bg-amber-600' : 'bg-indigo-600',
      photoUrl: chorister.photoUrl,
    };
    return res.json({ success: true, member: organistMember, chorister, isCommittee: false });
  }

  return res.status(404).json({ error: 'Member not found' });
});

// Dedicated Real-Time PIN Update Endpoint with Direct Supabase Sync
app.post('/api/auth/change-pin', async (req: Request, res: Response) => {
  const { memberId, newPin } = req.body;
  if (!memberId || !newPin || String(newPin).trim().length < 4) {
    return res.status(400).json({ error: 'Valid memberId and at least 4-digit PIN required' });
  }

  const cleanPin = String(newPin).trim();
  let updatedMember: CommitteeMember | null = null;
  let updatedChorister: Chorister | null = null;

  // 1. Update Committee Member
  const commIdx = appState.committeeMembers.findIndex(
    (m) => m.id === memberId || m.choristerId === memberId || m.name.toLowerCase().trim() === String(memberId).toLowerCase().trim()
  );
  if (commIdx !== -1) {
    appState.committeeMembers[commIdx].pin = cleanPin;
    updatedMember = appState.committeeMembers[commIdx];
  }

  // 2. Update Chorister
  const choirIdx = appState.choristers.findIndex(
    (c) => c.id === memberId || (updatedMember && (c.id === updatedMember.choristerId || c.name.toLowerCase().trim() === updatedMember.name.toLowerCase().trim()))
  );
  if (choirIdx !== -1) {
    appState.choristers[choirIdx].pin = cleanPin;
    updatedChorister = appState.choristers[choirIdx];
  }

  // 3. Directly sync with Supabase PostgreSQL
  const supabase = getSupabase();
  let supabaseSynced = false;
  let supabaseError: string | null = null;
  if (supabase) {
    try {
      if (updatedMember) {
        const { error: commErr } = await supabase
          .from('committee_members')
          .update({ pin: cleanPin })
          .or(`id.eq.${updatedMember.id},name.ilike.${updatedMember.name.trim()}`);
        if (commErr) {
          console.error('[Supabase] change-pin committee_members error:', commErr.message);
          supabaseError = commErr.message;
        } else {
          console.log(`[Supabase] Live PIN successfully updated in committee_members for ${updatedMember.name} -> ${cleanPin}`);
        }
      }

      if (updatedChorister) {
        const { error: choirErr } = await supabase
          .from('choristers')
          .update({ pin: cleanPin, updated_at: new Date().toISOString() })
          .or(`id.eq.${updatedChorister.id},name.ilike.${updatedChorister.name.trim()}`);
        if (choirErr) {
          console.error('[Supabase] change-pin choristers error:', choirErr.message);
        } else {
          console.log(`[Supabase] Live PIN successfully updated in choristers for ${updatedChorister.name} -> ${cleanPin}`);
        }
      }
      supabaseSynced = !supabaseError;
    } catch (err: any) {
      console.error('[Supabase] change-pin sync error:', err);
      supabaseError = err?.message;
    }
  }

  saveDiskState();
  broadcastUpdate('COMMITTEE_UPDATED', appState.committeeMembers);
  broadcastUpdate('CHORISTERS_UPDATED', appState.choristers);

  res.json({
    success: true,
    message: 'PIN successfully updated and synced with Supabase PostgreSQL.',
    pin: cleanPin,
    supabaseSynced,
    supabaseError,
    member: updatedMember,
    chorister: updatedChorister,
  });
});

async function syncCommitteeMemberUpsert(m: CommitteeMember) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const cleanPin = String(m.pin || '2026').trim();
    const { error } = await supabase.from('committee_members').upsert({
      id: m.id,
      name: m.name,
      role: m.role,
      phone: m.phone || '',
      email: m.email || '',
      pin: cleanPin,
      avatar_color: m.avatarColor,
      created_at: new Date().toISOString(),
    });
    // Also explicitly execute update to ensure existing row PIN is 100% updated
    const { error: updErr } = await supabase
      .from('committee_members')
      .update({ pin: cleanPin })
      .or(`id.eq.${m.id},name.ilike.${m.name.trim()}`);

    if (error && updErr) {
      console.error(`[Supabase] committee_members upsert error for ${m.name}:`, error?.message || updErr?.message);
    } else {
      console.log(`[Supabase] Successfully synced PIN (${cleanPin}) for committee member: ${m.name}`);
    }
  } catch (err) {
    console.error('[Supabase] committee_members upsert failed:', err);
  }
}

// Committee Members Endpoints
app.get('/api/committee-members', async (req: Request, res: Response) => {
  await syncPinsFromSupabaseIfAvailable();
  // Always ensure committee list is synced and exclude Ruwanga
  syncCommitteeAndChoristers();
  res.json(appState.committeeMembers);
});

app.put('/api/committee-members/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { member, actor } = req.body;
  const index = appState.committeeMembers.findIndex((m) => m.id === id || m.choristerId === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Committee member not found' });
  }

  const existing = appState.committeeMembers[index];
  const updated: CommitteeMember = {
    ...existing,
    name: member.name?.trim() || existing.name,
    fullName: member.fullName?.trim() || existing.fullName,
    phone: member.phone !== undefined ? member.phone.trim() : existing.phone,
    email: member.email !== undefined ? member.email.trim() : existing.email,
    pin: member.pin ? String(member.pin).trim() : existing.pin,
    avatarColor: member.avatarColor || existing.avatarColor,
    role: member.role || existing.role,
    photoUrl: member.photoUrl !== undefined ? member.photoUrl : existing.photoUrl,
  };

  appState.committeeMembers[index] = updated;
  await syncCommitteeMemberUpsert(updated);

  // If a chorister record matches this member (by id, choristerId or name), sync contact details and credentials
  const choristerIdx = appState.choristers.findIndex(
    (c) => c.id === id || c.id === existing.choristerId || c.name.toLowerCase() === existing.name.toLowerCase()
  );
  if (choristerIdx !== -1) {
    appState.choristers[choristerIdx].name = updated.name;
    if (updated.fullName) appState.choristers[choristerIdx].fullName = updated.fullName;
    if (updated.phone) appState.choristers[choristerIdx].phoneNumber = updated.phone;
    if (updated.pin) appState.choristers[choristerIdx].pin = updated.pin;
    if (updated.photoUrl) appState.choristers[choristerIdx].photoUrl = updated.photoUrl;
    appState.choristers[choristerIdx].committeeRole = updated.role;
    await syncChoristerUpsert(appState.choristers[choristerIdx]);
    broadcastUpdate('CHORISTERS_UPDATED', appState.choristers);
  }

  addAuditLog(
    actor?.name || updated.name,
    actor?.role || updated.role,
    'Updated Profile Details',
    `${updated.name} (${updated.role}) updated their personal profile credentials.`
  );

  syncCommitteeAndChoristers();
  saveDiskState();
  broadcastUpdate('COMMITTEE_UPDATED', appState.committeeMembers);
  res.json(updated);
});

// Unified Profile Update Endpoint (supports committee members and organist/choristers)
app.put('/api/profile/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { profileData, actor } = req.body;

  // 1. Check if committee member
  const commIdx = appState.committeeMembers.findIndex((m) => m.id === id);
  if (commIdx !== -1) {
    const existing = appState.committeeMembers[commIdx];
    const updated: CommitteeMember = {
      ...existing,
      name: profileData.name?.trim() || existing.name,
      fullName: profileData.fullName !== undefined ? profileData.fullName.trim() : existing.fullName,
      phone: profileData.phone !== undefined ? profileData.phone.trim() : existing.phone,
      email: profileData.email !== undefined ? profileData.email.trim() : existing.email,
      pin: profileData.pin ? String(profileData.pin).trim() : existing.pin,
      avatarColor: profileData.avatarColor || existing.avatarColor,
      role: profileData.role || existing.role,
      photoUrl: profileData.photoUrl !== undefined ? profileData.photoUrl.trim() : existing.photoUrl,
    };
    appState.committeeMembers[commIdx] = updated;
    await syncCommitteeMemberUpsert(updated);

    // Sync matching chorister if present
    const choristerIdx = appState.choristers.findIndex(
      (c) => c.id === id || c.id === existing.choristerId || c.name.toLowerCase() === existing.name.toLowerCase()
    );
    if (choristerIdx !== -1) {
      const c = appState.choristers[choristerIdx];
      c.name = updated.name;
      if (updated.fullName) c.fullName = updated.fullName;
      if (updated.phone) c.phoneNumber = updated.phone;
      if (updated.pin) c.pin = updated.pin;
      if (profileData.address !== undefined) c.address = profileData.address;
      if (profileData.birthdate !== undefined) {
        c.birthdate = profileData.birthdate;
        const calcAge = computeAgeFromBirthdate(profileData.birthdate);
        if (calcAge !== null && calcAge >= 0) c.age = calcAge;
      }
      if (profileData.age !== undefined && profileData.birthdate === undefined) c.age = Number(profileData.age) || c.age;
      if (profileData.photoUrl !== undefined) c.photoUrl = profileData.photoUrl.trim();
      if (profileData.sundayMassPreference !== undefined) c.sundayMassPreference = profileData.sundayMassPreference;
      if (profileData.weeklyMassPreference !== undefined) c.weeklyMassPreference = profileData.weeklyMassPreference;
      await syncChoristerUpsert(c);
      broadcastUpdate('CHORISTERS_UPDATED', appState.choristers);
    }

    addAuditLog(
      actor?.name || updated.name,
      actor?.role || updated.role,
      'Updated Profile Details',
      `${updated.name} (${updated.role}) updated their personal profile credentials.`
    );
    saveDiskState();
    broadcastUpdate('COMMITTEE_UPDATED', appState.committeeMembers);
    return res.json({ member: updated });
  }

  // 2. Check if chorister/organist
  const choirIdx = appState.choristers.findIndex((c) => c.id === id);
  if (choirIdx !== -1) {
    const existing = appState.choristers[choirIdx];
    const newBirthdate = profileData.birthdate !== undefined ? profileData.birthdate : existing.birthdate;
    let newAge = existing.age;
    if (profileData.birthdate !== undefined) {
      const calcAge = computeAgeFromBirthdate(newBirthdate);
      if (calcAge !== null && calcAge >= 0) newAge = calcAge;
    } else if (profileData.age !== undefined) {
      newAge = Number(profileData.age) || existing.age;
    }

    const updatedChorister: Chorister = {
      ...existing,
      name: profileData.name?.trim() || existing.name,
      fullName: profileData.fullName !== undefined ? profileData.fullName.trim() : existing.fullName,
      phoneNumber: profileData.phone !== undefined ? profileData.phone.trim() : existing.phoneNumber,
      address: profileData.address !== undefined ? profileData.address.trim() : existing.address,
      birthdate: newBirthdate,
      age: newAge,
      pin: profileData.pin ? String(profileData.pin).trim() : existing.pin,
      voiceNotes: profileData.voiceNotes !== undefined ? profileData.voiceNotes : existing.voiceNotes,
      photoUrl: profileData.photoUrl !== undefined ? profileData.photoUrl.trim() : existing.photoUrl,
      sundayMassPreference: profileData.sundayMassPreference !== undefined ? profileData.sundayMassPreference : existing.sundayMassPreference,
      weeklyMassPreference: profileData.weeklyMassPreference !== undefined ? profileData.weeklyMassPreference : existing.weeklyMassPreference,
    };
    appState.choristers[choirIdx] = updatedChorister;
    await syncChoristerUpsert(updatedChorister);

    // Sync matching committee member if exists
    const matchingCommIdx = appState.committeeMembers.findIndex(
      (m) => m.id === id || m.choristerId === id || m.name.toLowerCase().trim() === updatedChorister.name.toLowerCase().trim()
    );
    if (matchingCommIdx !== -1) {
      appState.committeeMembers[matchingCommIdx].name = updatedChorister.name;
      if (updatedChorister.fullName) appState.committeeMembers[matchingCommIdx].fullName = updatedChorister.fullName;
      if (updatedChorister.phoneNumber) appState.committeeMembers[matchingCommIdx].phone = updatedChorister.phoneNumber;
      if (updatedChorister.pin) appState.committeeMembers[matchingCommIdx].pin = updatedChorister.pin;
      if (updatedChorister.photoUrl) appState.committeeMembers[matchingCommIdx].photoUrl = updatedChorister.photoUrl;
      await syncCommitteeMemberUpsert(appState.committeeMembers[matchingCommIdx]);
      broadcastUpdate('COMMITTEE_UPDATED', appState.committeeMembers);
    }

    const syntheticMember: CommitteeMember = {
      id: updatedChorister.id,
      choristerId: updatedChorister.id,
      name: updatedChorister.name,
      fullName: updatedChorister.fullName || updatedChorister.name,
      role: (updatedChorister.role === 'Organist' ? 'Organist' : 'Chorister') as any,
      phone: updatedChorister.phoneNumber,
      email: '',
      pin: updatedChorister.pin || '1234',
      avatarColor: profileData.avatarColor || (updatedChorister.role === 'Organist' ? 'bg-amber-600' : 'bg-indigo-600'),
      photoUrl: updatedChorister.photoUrl,
    };

    addAuditLog(
      actor?.name || updatedChorister.name,
      actor?.role || updatedChorister.role,
      'Updated Profile Details',
      `${updatedChorister.name} (${updatedChorister.role}) updated their personal profile details.`
    );
    saveDiskState();
    broadcastUpdate('CHORISTERS_UPDATED', appState.choristers);
    return res.json({ member: matchingCommIdx !== -1 ? appState.committeeMembers[matchingCommIdx] : syntheticMember, chorister: updatedChorister });
  }

  return res.status(404).json({ error: 'Profile not found' });
});

// Choristers Endpoints
app.get('/api/choristers', (req: Request, res: Response) => {
  syncAllChoristerAges(appState.choristers);
  res.json(appState.choristers);
});

async function syncChoristerUpsert(c: Chorister) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const cleanPin = String(c.pin || '1234').trim();
    const { error } = await supabase.from('choristers').upsert({
      id: c.id,
      name: c.name,
      age: c.age !== undefined && c.age !== null ? Number(c.age) : null,
      birthdate: c.birthdate || '',
      address: c.address || '',
      phone_number: c.phoneNumber || '',
      role: c.role || 'Chorister',
      voice_rating: c.voiceRating ?? null,
      voice_notes: c.voiceNotes ?? '',
      pin: cleanPin,
      updated_at: new Date().toISOString(),
    });
    // Explicit update to guarantee PIN is synced on existing rows
    const { error: updErr } = await supabase
      .from('choristers')
      .update({ pin: cleanPin, updated_at: new Date().toISOString() })
      .or(`id.eq.${c.id},name.ilike.${c.name.trim()}`);

    if (error && updErr) {
      console.error(`[Supabase] choristers upsert error for ${c.name}:`, error?.message || updErr?.message);
    } else {
      console.log(`[Supabase] Successfully synced PIN (${cleanPin}) for chorister: ${c.name}`);
    }
  } catch (err) {
    console.error('[Supabase] Failed to upsert chorister:', err);
  }
}

async function syncChoristerDelete(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('choristers').delete().eq('id', id);
  } catch (err) {
    console.error('[Supabase] Failed to delete chorister:', err);
  }
}

app.post('/api/choristers', (req: Request, res: Response) => {
  const { chorister, actor } = req.body;
  if (!chorister || !chorister.name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const newChorister: Chorister = {
    id: chorister.id || `choir-${Date.now()}`,
    name: chorister.name,
    fullName: chorister.fullName || chorister.name,
    firstName: chorister.firstName || '',
    lastName: chorister.lastName || '',
    age: Number(chorister.age) || 0,
    birthdate: chorister.birthdate || '',
    address: chorister.address || '',
    phoneNumber: chorister.phoneNumber || '',
    parentPhone: chorister.parentPhone || '',
    role: chorister.role === 'Organist' ? 'Organist' : chorister.role === 'Instrument Player' ? 'Instrument Player' : 'Chorister',
    committeeRole: chorister.committeeRole,
    voiceRating: chorister.voiceRating !== undefined && chorister.voiceRating !== null ? Number(chorister.voiceRating) : undefined,
    voiceNotes: chorister.voiceNotes || '',
    pin: chorister.pin || '1234',
    photoUrl: chorister.photoUrl || '',
    dateJoined: chorister.dateJoined || '',
    isSchoolStudent: Boolean(chorister.isSchoolStudent),
    weeklyMassPreference: chorister.weeklyMassPreference || '',
    sundayMassPreference: chorister.sundayMassPreference || '',
    submittedAt: chorister.submittedAt || new Date().toISOString(),
  };

  appState.choristers.unshift(newChorister);
  syncChoristerUpsert(newChorister);
  syncCommitteeAndChoristers();
  saveDiskState();
  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    'Registered Member',
    `Registered ${newChorister.name} as ${newChorister.role}.`
  );
  broadcastUpdate('CHORISTERS_UPDATED', appState.choristers);
  broadcastUpdate('COMMITTEE_UPDATED', appState.committeeMembers);
  res.status(201).json(newChorister);
});

app.put('/api/choristers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { chorister, actor } = req.body;
  const index = appState.choristers.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Chorister not found' });
  }

  const newBirthdate = chorister.birthdate ?? appState.choristers[index].birthdate;
  let newAge = appState.choristers[index].age;
  if (chorister.birthdate !== undefined) {
    const calcAge = computeAgeFromBirthdate(newBirthdate);
    if (calcAge !== null && calcAge >= 0) newAge = calcAge;
  } else if (chorister.age !== undefined) {
    newAge = Number(chorister.age) || appState.choristers[index].age;
  }

  appState.choristers[index] = {
    ...appState.choristers[index],
    name: chorister.name ?? appState.choristers[index].name,
    fullName: chorister.fullName ?? appState.choristers[index].fullName,
    firstName: chorister.firstName ?? appState.choristers[index].firstName,
    lastName: chorister.lastName ?? appState.choristers[index].lastName,
    age: newAge,
    birthdate: newBirthdate,
    address: chorister.address ?? appState.choristers[index].address,
    phoneNumber: chorister.phoneNumber ?? appState.choristers[index].phoneNumber,
    parentPhone: chorister.parentPhone ?? appState.choristers[index].parentPhone,
    role: chorister.role ?? appState.choristers[index].role,
    committeeRole: chorister.committeeRole !== undefined ? chorister.committeeRole : appState.choristers[index].committeeRole,
    voiceRating: chorister.voiceRating !== undefined ? (chorister.voiceRating === null ? undefined : Number(chorister.voiceRating)) : appState.choristers[index].voiceRating,
    voiceNotes: chorister.voiceNotes !== undefined ? chorister.voiceNotes : appState.choristers[index].voiceNotes,
    pin: chorister.pin ?? appState.choristers[index].pin,
    photoUrl: chorister.photoUrl !== undefined ? chorister.photoUrl.trim() : appState.choristers[index].photoUrl,
    dateJoined: chorister.dateJoined ?? appState.choristers[index].dateJoined,
    isSchoolStudent: chorister.isSchoolStudent !== undefined ? Boolean(chorister.isSchoolStudent) : appState.choristers[index].isSchoolStudent,
    weeklyMassPreference: chorister.weeklyMassPreference ?? appState.choristers[index].weeklyMassPreference,
    sundayMassPreference: chorister.sundayMassPreference ?? appState.choristers[index].sundayMassPreference,
    id,
  };

  // Sync to matching committee member
  const commIdx = appState.committeeMembers.findIndex(
    (m) => m.id === id || m.choristerId === id || m.name.toLowerCase().trim() === appState.choristers[index].name.toLowerCase().trim()
  );
  if (commIdx !== -1) {
    appState.committeeMembers[commIdx].name = appState.choristers[index].name;
    if (appState.choristers[index].fullName) appState.committeeMembers[commIdx].fullName = appState.choristers[index].fullName;
    if (appState.choristers[index].phoneNumber) appState.committeeMembers[commIdx].phone = appState.choristers[index].phoneNumber;
    if (appState.choristers[index].pin) appState.committeeMembers[commIdx].pin = appState.choristers[index].pin;
    if (appState.choristers[index].photoUrl) appState.committeeMembers[commIdx].photoUrl = appState.choristers[index].photoUrl;
    syncCommitteeMemberUpsert(appState.committeeMembers[commIdx]);
  }

  syncChoristerUpsert(appState.choristers[index]);
  syncCommitteeAndChoristers();
  saveDiskState();
  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    'Updated Member Details',
    `Updated details for ${appState.choristers[index].name} (${appState.choristers[index].role}).`
  );
  broadcastUpdate('CHORISTERS_UPDATED', appState.choristers);
  broadcastUpdate('COMMITTEE_UPDATED', appState.committeeMembers);
  res.json(appState.choristers[index]);
});

app.delete('/api/choristers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor } = req.body;
  const index = appState.choristers.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Chorister not found' });
  }

  const removed = appState.choristers.splice(index, 1)[0];
  syncChoristerDelete(id);
  saveDiskState();
  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    'Removed Member',
    `Removed ${removed.name} from choir registry.`
  );
  broadcastUpdate('CHORISTERS_UPDATED', appState.choristers);
  res.json({ success: true, removedId: id });
});

// Feast Novenas Endpoints (9 entries)
app.get('/api/novenas', (req: Request, res: Response) => {
  res.json(appState.feastNovenas);
});

app.put('/api/novenas/:dayNumber', (req: Request, res: Response) => {
  const dayNumber = Number(req.params.dayNumber);
  const { entry, actor } = req.body;
  const index = appState.feastNovenas.findIndex((n) => n.dayNumber === dayNumber);
  if (index === -1) {
    return res.status(404).json({ error: 'Novena day not found' });
  }

  appState.feastNovenas[index] = {
    ...appState.feastNovenas[index],
    ...entry,
    dayNumber,
  };

  syncNovenaUpsert(appState.feastNovenas[index]);

  addAuditLog(
    actor?.name || 'Committee Member',
    actor?.role || 'President',
    `Updated Feast Novena Day ${dayNumber}`,
    `Assigned Organist: ${entry.organist}, Psalm: ${entry.responsorialPsalmPerson}, Alleluia: ${entry.alleluiaPerson}`
  );
  broadcastUpdate('NOVENAS_UPDATED', appState.feastNovenas);
  res.json(appState.feastNovenas[index]);
});

app.put('/api/novenas-sync-fixed', async (req: Request, res: Response) => {
  const { rosaryTime, massTime, blessingHymn, entranceHymn, offertory1Hymn, communion1Hymn, finalHymn, actor } = req.body;
  
  for (let i = 0; i < appState.feastNovenas.length; i++) {
    appState.feastNovenas[i] = {
      ...appState.feastNovenas[i],
      rosaryTime,
      massTime,
      blessingHymn: blessingHymn !== undefined ? blessingHymn : appState.feastNovenas[i].blessingHymn,
      entranceHymn,
      offertory1Hymn,
      communion1Hymn,
      finalHymn,
    };
    await syncNovenaUpsert(appState.feastNovenas[i]);
  }

  addAuditLog(
    actor?.name || 'Committee Member',
    actor?.role || 'President',
    'Synced Fixed Fields Across All 9 Feast Novenas',
    `Updated Rosary: ${rosaryTime}, Mass: ${massTime}, Hymns: B=${blessingHymn || ''}, E=${entranceHymn}, O=${offertory1Hymn}, C=${communion1Hymn}, F=${finalHymn}`
  );
  broadcastUpdate('NOVENAS_UPDATED', appState.feastNovenas);
  res.json({ success: true, feastNovenas: appState.feastNovenas });
});

// Major Events (Feast, Carols, Easter, Christmas & New Year)
app.get('/api/events/:eventId', (req: Request, res: Response) => {
  const { eventId } = req.params;
  const event = (appState.majorEvents as any)[eventId];
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

app.put('/api/events/:eventId/work-budget', (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { workAndBudget, actor } = req.body;
  const event = (appState.majorEvents as any)[eventId];
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  event.workAndBudget = {
    ...event.workAndBudget,
    ...workAndBudget,
    lastUpdatedBy: actor ? `${actor.name} (${actor.role})` : 'Joshua Peiris (President)',
    lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  // Sync practice sessions if included
  if (Array.isArray(workAndBudget.practices)) {
    const eventPractices = workAndBudget.practices.map((p: any) => ({
      ...p,
      eventTitle: p.eventTitle || event.title,
    }));
    const otherPractices = (appState.practices || []).filter(
      (p) => !isPracticeForEvent(p, event.title)
    );
    appState.practices = [...eventPractices, ...otherPractices];
    syncPractices();
    broadcastUpdate('PRACTICES_UPDATED', appState.practices);
  }

  syncMajorEventUpsert(eventId, event);

  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    `Updated ${event.title} Work & Budget`,
    `Workflow status: ${event.workAndBudget.workflowStatus}. Hymns: ${event.workAndBudget.hymns.length}, Tasks: ${event.workAndBudget.tasks.length}, Practices: ${event.workAndBudget.practices?.length || 0}`
  );

  broadcastUpdate('EVENT_UPDATED', { eventId, event });
  res.json(event);
});

// Weekly Masses updates
app.put('/api/weekly-masses/:serviceKey', (req: Request, res: Response) => {
  const { serviceKey } = req.params;
  const { workAndBudget, actor, subKey } = req.body;

  let serviceTarget: any = null;
  let serviceName = '';
  let serviceDay = '';
  let serviceTime = '';
  let serviceLang = '';
  let targetId = serviceKey;

  if (serviceKey === 'tuesday') {
    serviceTarget = appState.weeklyMasses.tuesday;
    serviceName = 'Tuesday Novena & Mass';
    serviceDay = 'Tuesday';
    serviceTime = '6:30 PM';
    serviceLang = 'Sinhala';
  } else if (serviceKey === 'thursday') {
    serviceTarget = appState.weeklyMasses.thursday;
    serviceName = 'Thursday Healing Service & Mass';
    serviceDay = 'Thursday';
    serviceTime = '6:30 PM';
    serviceLang = 'Sinhala';
  } else if (serviceKey === 'firstFriday') {
    serviceTarget = appState.weeklyMasses.firstFriday;
    serviceName = 'First Friday Sacred Heart Devotion';
    serviceDay = 'First Friday';
    serviceTime = '5:45 PM';
    serviceLang = 'Sinhala';
  } else if (serviceKey === 'saturdayEnglish') {
    serviceTarget = appState.weeklyMasses.saturdayEnglish;
    serviceName = 'Saturday English Mass';
    serviceDay = 'Saturday';
    serviceTime = '7:00 AM';
    serviceLang = 'English';
  } else if (serviceKey === 'sundayMasses' && subKey) {
    serviceTarget = (appState.weeklyMasses.sundayMasses.services as any)[subKey];
    targetId = `sunday-${subKey}`;
    serviceName = serviceTarget?.name || 'Sunday Mass';
    serviceDay = 'Sunday';
    serviceTime = serviceTarget?.time || 'Morning';
    serviceLang = serviceTarget?.language || 'Sinhala';
  }

  if (!serviceTarget) {
    return res.status(404).json({ error: 'Mass service not found' });
  }

  serviceTarget.workAndBudget = {
    ...serviceTarget.workAndBudget,
    ...workAndBudget,
    lastUpdatedBy: actor ? `${actor.name} (${actor.role})` : 'Joshua Peiris (President)',
    lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  // Sync practice sessions if included
  if (Array.isArray(workAndBudget.practices)) {
    const massTitle = serviceTarget.name || serviceName;
    const massPractices = workAndBudget.practices.map((p: any) => ({
      ...p,
      eventTitle: p.eventTitle || massTitle,
    }));
    const otherPractices = (appState.practices || []).filter(
      (p) => !isPracticeForEvent(p, massTitle)
    );
    appState.practices = [...massPractices, ...otherPractices];
    syncPractices();
    broadcastUpdate('PRACTICES_UPDATED', appState.practices);
  }

  syncWeeklyMassUpsert(targetId, serviceName, serviceDay, serviceTime, serviceLang, serviceTarget.workAndBudget);

  // Automatically save to History archives so every saved weekly mass is recorded with date and all hymns
  const currentDateStr = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const massDisplayName = serviceTarget.name || serviceName;
  const massOrganist = serviceTarget.workAndBudget.organist || (serviceTarget.workAndBudget.tasks || []).find((t: any) => t.duty === 'Organist')?.assignedTo || '';
  const massReader = serviceTarget.workAndBudget.readingPerson || (serviceTarget.workAndBudget.tasks || []).find((t: any) => t.duty === 'Reading')?.assignedTo || '';

  const historyRecord: ArchiveRecord = {
    id: `hist-mass-${targetId}-${Date.now()}`,
    year: currentYear,
    eventId: 'weekly-mass',
    eventTitle: `${massDisplayName} (${serviceTime})`,
    massType: massDisplayName,
    massDate: currentDateStr,
    recordType: 'weekly-mass',
    dateRange: `${serviceDay} • ${serviceTime} • ${currentDateStr}`,
    archivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    archivedBy: actor ? `${actor.name} (${actor.role})` : 'Joshua Peiris (President)',
    organist: massOrganist,
    readingPerson: massReader,
    summary: {
      totalHymns: serviceTarget.workAndBudget.hymns?.length || 0,
      totalPractices: serviceTarget.workAndBudget.practices?.length || 0,
      totalBudgeted: serviceTarget.workAndBudget.targetBudget || 0,
      totalActualSpent: 0,
      totalIncome: 0,
    },
    hymns: JSON.parse(JSON.stringify(serviceTarget.workAndBudget.hymns || [])),
    tasks: JSON.parse(JSON.stringify(serviceTarget.workAndBudget.tasks || [])),
    practices: JSON.parse(JSON.stringify(serviceTarget.workAndBudget.practices || [])),
    budget: JSON.parse(JSON.stringify(serviceTarget.workAndBudget.budget || [])),
    notes: `Saved liturgical lineup for ${massDisplayName} on ${currentDateStr}. Organist: ${massOrganist || 'N/A'}, Reader: ${massReader || 'N/A'}.`,
  };

  appState.archives.unshift(historyRecord);
  syncArchives();
  broadcastUpdate('ARCHIVES_UPDATED', appState.archives);

  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    `Saved Mass Service & History: ${serviceTarget.name || serviceName}`,
    `Hymns: ${serviceTarget.workAndBudget.hymns?.length || 0}, Tasks: ${serviceTarget.workAndBudget.tasks?.length || 0}, Practices: ${serviceTarget.workAndBudget.practices?.length || 0}`
  );

  broadcastUpdate('WEEKLY_MASSES_UPDATED', appState.weeklyMasses);
  res.json({ weeklyMasses: appState.weeklyMasses, archives: appState.archives, historyRecord });
});

function normalizeDriveLink(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const fileIdMatch = trimmed.match(/\/(?:file(?:\/u\/\d+)?\/d|d)\/([a-zA-Z0-9_-]{20,})/i) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/view?usp=sharing`;
  }
  return trimmed;
}

// Calendar Configuration (driving 100-day countdowns)
app.get('/api/calendar', (req: Request, res: Response) => {
  res.json(appState.calendarConfig);
});

app.put('/api/calendar', (req: Request, res: Response) => {
  const { calendarConfig, actor } = req.body;
  const isJoshua = isJoshuaActor(actor);

  // Check if dates of the 5 never-changing core events are being edited
  const prev: any = appState.calendarConfig || {};
  const isModifyingCoreDates = Boolean(
    (calendarConfig?.feastDate && calendarConfig.feastDate !== prev.feastDate) ||
    (calendarConfig?.carolsDate && calendarConfig.carolsDate !== prev.carolsDate) ||
    (calendarConfig?.easterDate && calendarConfig.easterDate !== prev.easterDate) ||
    (calendarConfig?.christmasNewYearDate && calendarConfig.christmasNewYearDate !== prev.christmasNewYearDate) ||
    (calendarConfig?.newYearDate && calendarConfig.newYearDate !== prev.newYearDate)
  );

  if (isModifyingCoreDates && !isJoshua) {
    return res.status(403).json({
      error: 'Permission Denied: Only Lead Joshua Peiris is authorized to edit the dates of never-changing calendar events.',
    });
  }

  const normalized = { ...(calendarConfig || {}) };
  if (normalized.feastBackgroundUrl) normalized.feastBackgroundUrl = normalizeDriveLink(normalized.feastBackgroundUrl);
  if (normalized.carolsBackgroundUrl) normalized.carolsBackgroundUrl = normalizeDriveLink(normalized.carolsBackgroundUrl);
  if (normalized.christmasBackgroundUrl) normalized.christmasBackgroundUrl = normalizeDriveLink(normalized.christmasBackgroundUrl);
  if (normalized.newYearBackgroundUrl) normalized.newYearBackgroundUrl = normalizeDriveLink(normalized.newYearBackgroundUrl);
  if (normalized.easterBackgroundUrl) normalized.easterBackgroundUrl = normalizeDriveLink(normalized.easterBackgroundUrl);
  if (Array.isArray(normalized.customEvents)) {
    normalized.customEvents = normalized.customEvents.map((ev: any) => ({
      ...ev,
      backgroundDriveUrl: ev.backgroundDriveUrl ? normalizeDriveLink(ev.backgroundDriveUrl) : ev.backgroundDriveUrl,
    }));
  }

  appState.calendarConfig = {
    ...appState.calendarConfig,
    ...normalized,
  };

  // Sync event target dates with calendar config
  if (appState.calendarConfig.feastDate) {
    appState.majorEvents.feast.targetDate = appState.calendarConfig.feastDate;
    syncMajorEventUpsert('feast', appState.majorEvents.feast);
  }
  if (appState.calendarConfig.carolsDate) {
    appState.majorEvents.carols.targetDate = appState.calendarConfig.carolsDate;
    syncMajorEventUpsert('carols', appState.majorEvents.carols);
  }
  if (appState.calendarConfig.easterDate) {
    appState.majorEvents.easter.targetDate = appState.calendarConfig.easterDate;
    syncMajorEventUpsert('easter', appState.majorEvents.easter);
  }
  if (appState.calendarConfig.christmasNewYearDate) {
    appState.majorEvents['christmas-new-year'].targetDate = appState.calendarConfig.christmasNewYearDate;
    syncMajorEventUpsert('christmas-new-year', appState.majorEvents['christmas-new-year']);
  }

  syncCalendarConfig();
  saveDiskState();

  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    'Updated Annual Calendar Dates',
    `Feast: ${appState.calendarConfig.feastDate}, Carols: ${appState.calendarConfig.carolsDate}, Easter: ${appState.calendarConfig.easterDate}, Christmas & New Year: ${appState.calendarConfig.christmasNewYearDate}`
  );

  broadcastUpdate('CALENDAR_UPDATED', {
    calendarConfig: appState.calendarConfig,
    majorEvents: appState.majorEvents,
  });

  res.json({
    calendarConfig: appState.calendarConfig,
    majorEvents: appState.majorEvents,
  });
});

// Branding & Choir Crest Endpoints (Synchronized with Supabase Backend)
app.get('/api/branding', (_req: Request, res: Response) => {
  res.json(appState.branding || {
    logoDriveUrl: 'https://drive.google.com/file/d/1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr/view?usp=sharing',
    logoDirectUrl: 'https://drive.google.com/thumbnail?id=1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr&sz=w800',
    isCentered: false,
    imgScale: 100,
    offsetX: 0,
    offsetY: 0,
    fitMode: 'cover',
  });
});

app.put('/api/branding', async (req: Request, res: Response) => {
  const { branding, actor } = req.body;
  if (!branding) {
    return res.status(400).json({ error: 'Branding configuration is required' });
  }

  let logoDriveUrl = branding.logoDriveUrl || appState.branding.logoDriveUrl;
  let logoDirectUrl = branding.logoDirectUrl;

  // Force Google Drive URL validation & canonicalization
  if (logoDriveUrl && typeof logoDriveUrl === 'string') {
    const fileId = extractDriveFileId(logoDriveUrl);
    if (fileId) {
      logoDriveUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
      logoDirectUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }
  }

  appState.branding = {
    ...appState.branding,
    ...branding,
    logoDriveUrl,
    logoDirectUrl: logoDirectUrl || getDriveDirectImageUrl(logoDriveUrl) || appState.branding.logoDirectUrl,
    isCentered: Boolean(branding.isCentered),
    imgScale: Number(branding.imgScale) || 100,
    offsetX: Number(branding.offsetX) || 0,
    offsetY: Number(branding.offsetY) || 0,
    fitMode: branding.fitMode === 'contain' ? 'contain' : 'cover',
    lastUpdatedBy: actor ? `${actor.name} (${actor.role})` : 'Joshua Peiris (President)',
    updatedAt: new Date().toISOString(),
  };

  await syncBrandingUpsert(appState.branding);
  saveDiskState();

  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    'Updated Choir Logo & Branding',
    `Updated choir crest logo and position in Supabase database. Center: ${appState.branding.isCentered}, Scale: ${appState.branding.imgScale}%, Mode: ${appState.branding.fitMode}.`
  );

  broadcastUpdate('BRANDING_UPDATED', appState.branding);
  res.json(appState.branding);
});

// Google Drive URL Server-Side Validation Endpoint
app.post('/api/drive/validate', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.json({
      isValid: false,
      isDriveUrl: false,
      fileId: null,
      error: 'Empty URL provided',
    });
  }

  const trimmed = url.trim();
  const fileId = extractDriveFileId(trimmed);

  if (fileId) {
    const cleanUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    const directThumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    const highResThumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return res.json({
      isValid: true,
      isDriveUrl: true,
      fileId,
      cleanUrl,
      directThumbnailUrl,
      highResThumbnailUrl,
      downloadUrl,
      status: 'valid_drive_file',
    });
  }

  return res.json({
    isValid: false,
    isDriveUrl: false,
    fileId: null,
    cleanUrl: trimmed,
    error: 'Could not extract a valid Google Drive File ID.',
    status: 'invalid_format',
  });
});

// Practices & Attendance Endpoints
app.get('/api/practices', (req: Request, res: Response) => {
  res.json(appState.practices || []);
});

app.post('/api/practices', (req: Request, res: Response) => {
  const { practices, actor, actionDescription } = req.body;
  if (Array.isArray(practices)) {
    appState.practices = practices;
    syncPractices();
    synchronizePracticesAcrossAllTabs();
  }
  if (actionDescription) {
    addAuditLog(
      actor?.name || 'Joshua Peiris',
      actor?.role || 'President',
      'Updated Practices',
      actionDescription
    );
  }
  broadcastUpdate('PRACTICES_UPDATED', appState.practices);
  broadcastUpdate('EVENT_UPDATED', { eventId: 'all', majorEvents: appState.majorEvents });
  broadcastUpdate('WEEKLY_MASSES_UPDATED', appState.weeklyMasses);
  res.json(appState.practices);
});

app.delete('/api/practices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor } = req.body || {};

  // 1. Remove from global practices array
  appState.practices = (appState.practices || []).filter((p) => p.id !== id);
  syncPractices();

  // 2. Synchronize removal across all major events
  const majorKeys = ['feast', 'carols', 'easter', 'christmas-new-year'] as const;
  for (const key of majorKeys) {
    const ev = appState.majorEvents[key];
    if (ev && ev.workAndBudget && Array.isArray(ev.workAndBudget.practices)) {
      ev.workAndBudget.practices = ev.workAndBudget.practices.filter((p) => p.id !== id);
      syncMajorEventUpsert(key, ev);
    }
  }

  // 3. Synchronize removal across all weekly masses
  if (appState.weeklyMasses.tuesday?.workAndBudget?.practices) {
    appState.weeklyMasses.tuesday.workAndBudget.practices = appState.weeklyMasses.tuesday.workAndBudget.practices.filter((p) => p.id !== id);
    syncWeeklyMassUpsert('tuesday', appState.weeklyMasses.tuesday.name, appState.weeklyMasses.tuesday.dayOfWeek, appState.weeklyMasses.tuesday.time, 'Sinhala', appState.weeklyMasses.tuesday.workAndBudget);
  }
  if (appState.weeklyMasses.thursday?.workAndBudget?.practices) {
    appState.weeklyMasses.thursday.workAndBudget.practices = appState.weeklyMasses.thursday.workAndBudget.practices.filter((p) => p.id !== id);
    syncWeeklyMassUpsert('thursday', appState.weeklyMasses.thursday.name, appState.weeklyMasses.thursday.dayOfWeek, appState.weeklyMasses.thursday.time, 'Sinhala', appState.weeklyMasses.thursday.workAndBudget);
  }
  if (appState.weeklyMasses.firstFriday?.workAndBudget?.practices) {
    appState.weeklyMasses.firstFriday.workAndBudget.practices = appState.weeklyMasses.firstFriday.workAndBudget.practices.filter((p) => p.id !== id);
    syncWeeklyMassUpsert('firstFriday', appState.weeklyMasses.firstFriday.name, appState.weeklyMasses.firstFriday.dayOfWeek, appState.weeklyMasses.firstFriday.time, 'Sinhala', appState.weeklyMasses.firstFriday.workAndBudget);
  }
  if (appState.weeklyMasses.sundayMasses?.services) {
    for (const [subKey, srv] of Object.entries(appState.weeklyMasses.sundayMasses.services as Record<string, any>)) {
      if (srv?.workAndBudget?.practices) {
        srv.workAndBudget.practices = srv.workAndBudget.practices.filter((p: any) => p.id !== id);
        syncWeeklyMassUpsert(`sunday-${subKey}`, srv.name || subKey, srv.dayOfWeek || 'Sunday', srv.time || '', 'Sinhala / English', srv.workAndBudget);
      }
    }
  }

  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    'Deleted Practice Session',
    `Removed practice session ${id} and attendance records`
  );

  broadcastUpdate('PRACTICES_UPDATED', appState.practices);
  broadcastUpdate('EVENT_UPDATED', { eventId: 'all', majorEvents: appState.majorEvents });
  broadcastUpdate('WEEKLY_MASSES_UPDATED', appState.weeklyMasses);
  res.json({ success: true, practices: appState.practices });
});

// System Endpoint: Purge All Sample Data & Clear Database
app.post('/api/system/purge-sample-data', async (req: Request, res: Response) => {
  try {
    await purgeAllSampleData();
    res.json({ success: true, message: 'All sample data removed successfully from live database and application state.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to purge sample data' });
  }
});

// Archives Endpoints
app.get('/api/archives', (req: Request, res: Response) => {
  if (!appState.archives || appState.archives.length === 0) {
    appState.archives = [...INITIAL_ARCHIVES];
    saveDiskState();
  } else {
    // Ensure 2025 concluded feast is present
    const has2025Feast = appState.archives.some((a) => a.id === 'arch-feast-2025-concluded');
    if (!has2025Feast) {
      const init2025 = INITIAL_ARCHIVES.find((a) => a.id === 'arch-feast-2025-concluded');
      if (init2025) {
        appState.archives.push(init2025);
        saveDiskState();
      }
    }
  }
  res.json(appState.archives || []);
});

app.post('/api/archives', (req: Request, res: Response) => {
  const { archiveRecord, actor } = req.body;
  if (!archiveRecord) return res.status(400).json({ error: 'Archive record required' });
  appState.archives.unshift(archiveRecord);
  syncArchives();
  saveDiskState();
  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    'Saved to History',
    `Recorded history for ${archiveRecord.eventTitle} (${archiveRecord.year})`
  );
  broadcastUpdate('ARCHIVES_UPDATED', appState.archives);
  res.status(201).json(archiveRecord);
});

app.delete('/api/archives/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor } = req.body || {};
  const found = appState.archives.find((a) => a.id === id);
  appState.archives = appState.archives.filter((a) => a.id !== id);
  syncArchives();
  saveDiskState();
  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    'Removed History Entry',
    `Deleted history record: ${found?.eventTitle || id}`
  );
  broadcastUpdate('ARCHIVES_UPDATED', appState.archives);
  res.json({ success: true, archives: appState.archives });
});

// Event Rollover (e.g. Concluding Feast and advancing to next year)
app.post('/api/events/rollover', (req: Request, res: Response) => {
  const { eventId, notes, actor } = req.body;
  const event = appState.majorEvents[eventId as 'feast' | 'carols' | 'easter' | 'christmas-new-year'];
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const currentYear = new Date(event.targetDate).getFullYear() || new Date().getFullYear();
  const nextYear = currentYear + 1;

  // Gather practices for this event (including attendance records)
  const eventPractices = (event.workAndBudget?.practices || []).map((p: any) => ({
    ...p,
    attendance: p.attendance || [],
  }));
  const centralPracticesForEvent = (appState.practices || [])
    .filter((p: any) => isPracticeForEvent(p, event.title))
    .map((p: any) => ({ ...p, attendance: p.attendance || [] }));

  const mergedPracticesMap = new Map();
  for (const p of [...eventPractices, ...centralPracticesForEvent]) {
    mergedPracticesMap.set(p.id, p);
  }
  const allEventPractices = Array.from(mergedPracticesMap.values());

  // Calculate attendance stats
  let totalAttendances = 0;
  let presentAttendances = 0;
  for (const p of allEventPractices) {
    if (Array.isArray(p.attendance)) {
      for (const att of p.attendance) {
        totalAttendances++;
        if (att.status === 'Present' || att.status === 'Late') {
          presentAttendances++;
        }
      }
    }
  }
  const attendanceAvgPercent = totalAttendances > 0 
    ? Math.round((presentAttendances / totalAttendances) * 100) 
    : 96;

  // 1. Create Comprehensive Archive Snapshot containing everything from the last saved event
  const archiveRecord: ArchiveRecord = {
    id: `arch-${eventId}-${currentYear}-${Date.now()}`,
    year: currentYear,
    eventId: eventId,
    eventTitle: `${event.title} (${currentYear})`,
    dateRange: `${event.targetDate}`,
    archivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    archivedBy: actor ? `${actor.name} (${actor.role})` : 'Joshua Peiris (President)',
    organist: 'CHAMATHKA',
    summary: {
      totalHymns: event.workAndBudget?.hymns?.length || 0,
      totalPractices: allEventPractices.length,
      totalBudgeted: event.workAndBudget?.targetBudget || 0,
      totalActualSpent: (event.workAndBudget?.budget || []).filter((b: any) => b.type === 'expense').reduce((a: number, b: any) => a + (b.actualAmount || 0), 0),
      totalIncome: (event.workAndBudget?.budget || []).filter((b: any) => b.type === 'income').reduce((a: number, b: any) => a + (b.actualAmount || 0), 0),
      attendanceAvgPercent,
    },
    flagHoisting: eventId === 'feast' ? {
      date: `19.09.${currentYear % 100}`,
      time: '@3.45 PM',
      organist: 'CHAMATHKA',
      notes: "⭕️ Choristers who're available at that time, Please make sure to be in the church and be there at least 15 minutes before the litany begins.",
    } : undefined,
    vespers: eventId === 'feast' ? {
      date: `Sunday, September 28, ${currentYear}`,
      time: '7.00 PM',
      tevadharaya: 'K. D. D. Peiris',
      notes: 'සවස 6.30 වන විට පැමිණ සිටින්න. Full choir attendance required.',
    } : undefined,
    feastMasses: eventId === 'feast' ? {
      date: `Monday, September 29, ${currentYear}`,
      mass5Psalm: 'SHAVEEN S',
      mass5Alleluia: 'METHUSHI',
      mass630Psalm: 'MELANI',
      mass630Alleluia: 'VINDYA',
      mass6Psalm: 'CRISHMAL',
      mass6Alleluia: 'CHAMATHKA',
    } : undefined,
    highMass: eventId === 'feast' ? {
      date: `Monday, September 29, ${currentYear}`,
      time: '8.00 AM',
      organist: 'CHAMATHKA',
      psalm1: 'SHAVEEN S',
      psalm2: 'METHUSHI',
      alleluia: 'MELANI',
      entranceHymn: 'මංගල ගීතිකා 04',
      offertoryHymn: 'පුදසුන වෙත එමු 120',
      communionHymn: 'දෙව් සමිඳුන්ගේ 180',
      finalHymn: 'මරිය මව්නි රැකවරණේ 258',
    } : undefined,
    novenaEntries: eventId === 'feast' ? JSON.parse(JSON.stringify(appState.feastNovenas)) : undefined,
    hymns: JSON.parse(JSON.stringify(event.workAndBudget?.hymns || [])),
    tasks: JSON.parse(JSON.stringify(event.workAndBudget?.tasks || [])),
    practices: allEventPractices,
    budget: JSON.parse(JSON.stringify(event.workAndBudget?.budget || [])),
    notes: notes || `Successfully concluded ${event.title} for ${currentYear}. All novenas, choir attendance, liturgies, hymns, and budget permanently backed up to history archives.`,
  };

  appState.archives.unshift(archiveRecord);
  syncArchives();

  // 2. Advance target date by 1 year
  const dateParts = event.targetDate.split('-');
  if (dateParts.length === 3) {
    dateParts[0] = nextYear.toString();
    event.targetDate = dateParts.join('-');
  }

  // Update calendarConfig
  if (eventId === 'feast') {
    appState.calendarConfig.feastDate = event.targetDate;
    // Reset Novenas to clean state for next year
    appState.feastNovenas = appState.feastNovenas.map(n => ({
      ...n,
      organist: '',
      responsorialPsalmPerson: '',
      alleluiaPerson: '',
      cantor: '',
      celebrant: '',
      specialHymn: '',
      status: 'Scheduled',
    }));
    for (const n of appState.feastNovenas) {
      syncNovenaUpsert(n);
    }
  } else if (eventId === 'carols') {
    appState.calendarConfig.carolsDate = event.targetDate;
  } else if (eventId === 'easter') {
    appState.calendarConfig.easterDate = event.targetDate;
  } else if (eventId === 'christmas-new-year') {
    appState.calendarConfig.christmasNewYearDate = event.targetDate;
  }

  // Clear active hymns, tasks, budget for the fresh year
  event.workAndBudget = {
    hymns: [],
    tasks: [],
    practices: [],
    budget: [],
    targetBudget: 0,
    workflowStatus: 'Draft',
    lastUpdatedBy: actor ? `${actor.name} (${actor.role})` : 'Joshua Peiris',
    lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  syncMajorEventUpsert(eventId, event);
  syncCalendarConfig();

  addAuditLog(
    actor?.name || 'Joshua Peiris',
    actor?.role || 'President',
    `Archived & Rolled Over ${event.title}`,
    `Program for ${currentYear} backed up to database. Next year preparations target date advanced to ${event.targetDate}.`
  );

  broadcastUpdate('EVENT_ROLLED_OVER', {
    archives: appState.archives,
    majorEvents: appState.majorEvents,
    calendarConfig: appState.calendarConfig,
    feastNovenas: appState.feastNovenas,
  });

  res.json({
    success: true,
    archiveRecord,
    updatedEvent: event,
    calendarConfig: appState.calendarConfig,
    archives: appState.archives,
    majorEvents: appState.majorEvents,
  });
});

// Manual force push all state to Supabase PostgreSQL
app.post('/api/supabase/push-all', async (req: Request, res: Response) => {
  try {
    await pushAllToSupabase();
    res.json({ success: true, message: 'All choir records pushed to live Supabase PostgreSQL!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual pull latest state from Supabase PostgreSQL
app.post('/api/supabase/pull-all', async (req: Request, res: Response) => {
  try {
    await hydrateFromSupabase();
    broadcastUpdate('STATE_RESET', appState);
    res.json({ success: true, message: 'Hydrated live state from Supabase PostgreSQL!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- BIRTHDAY FLYER & IMAGE COMPOSITING ENDPOINTS ---

function extractDriveFileId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const fileMatch = trimmed.match(/\/(?:file(?:\/u\/\d+)?\/d|d)\/([a-zA-Z0-9_-]{20,})/i);
  if (fileMatch && fileMatch[1]) return fileMatch[1];

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (idMatch && idMatch[1]) return idMatch[1];

  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (lh3Match && lh3Match[1]) return lh3Match[1];

  if (/^[a-zA-Z0-9_-]{20,60}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function getDriveDirectImageUrl(driveUrl?: string, size: number = 1200): string | undefined {
  if (!driveUrl) return undefined;
  const trimmed = driveUrl.trim();
  if (!trimmed) return undefined;

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }
  return trimmed;
}

// Proxy external images to avoid HTML5 canvas CORS tainting
app.get('/api/image-proxy', async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const directUrl = getDriveDirectImageUrl(rawUrl, 1600) || rawUrl;
    const response = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      // Verify content-type is actually an image (not an HTML error page)
      if (contentType.startsWith('image/')) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }
    }

    // If Google Drive thumbnail endpoint returned HTML or non-200, try fallback to public choir logo
    const fallbackPath = path.join(process.cwd(), 'public', 'choir_logo.jpg');
    if (fs.existsSync(fallbackPath)) {
      const fallbackBuffer = fs.readFileSync(fallbackPath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(fallbackBuffer);
    }

    return res.status(404).send('Image not found');
  } catch (err: any) {
    // If network error, fallback gracefully to public logo
    const fallbackPath = path.join(process.cwd(), 'public', 'choir_logo.jpg');
    if (fs.existsSync(fallbackPath)) {
      const fallbackBuffer = fs.readFileSync(fallbackPath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(fallbackBuffer);
    }
    return res.status(500).send(`Image proxy error: ${err.message}`);
  }
});

// Automatic face detection for face-centered portrait cropping
app.post('/api/detect-face', async (req: Request, res: Response) => {
  try {
    const { imageUrl, imageBase64 } = req.body;
    const gemini = getGemini();

    if (!gemini) {
      return res.json({
        success: true,
        detected: false,
        faceCenter: { x: 0.5, y: 0.36 },
        faceHeight: 0.45,
        message: 'Default portrait centering applied (No Gemini API key)',
      });
    }

    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = imageBase64;
      }
    } else if (imageUrl) {
      const directUrl = getDriveDirectImageUrl(imageUrl) || imageUrl;
      const imgRes = await fetch(directUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      if (imgRes.ok) {
        mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        const arrBuf = await imgRes.arrayBuffer();
        base64Data = Buffer.from(arrBuf).toString('base64');
      }
    }

    if (!base64Data) {
      return res.json({
        success: true,
        detected: false,
        faceCenter: { x: 0.5, y: 0.36 },
        faceHeight: 0.45,
        message: 'No image data available, using default portrait centering',
      });
    }

    let parsed: any = null;
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              },
              {
                text: `Detect the primary person's face in this portrait. Return ONLY a single JSON object with bounding box coordinates normalized to 0-1000:
                {
                  "detected": true,
                  "ymin": number,
                  "xmin": number,
                  "ymax": number,
                  "xmax": number
                }
                If no human face is clearly visible, return {"detected": false}. Do NOT output markdown code blocks or any other text.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      // Fallback without throwing if model is unavailable or rate limited
      parsed = { detected: false };
    }

    if (parsed && parsed.detected && typeof parsed.ymin === 'number' && typeof parsed.ymax === 'number') {
      const faceCenter = {
        x: ((parsed.xmin + parsed.xmax) / 2) / 1000,
        y: ((parsed.ymin + parsed.ymax) / 2) / 1000,
      };
      const faceHeight = Math.abs(parsed.ymax - parsed.ymin) / 1000;
      return res.json({
        success: true,
        detected: true,
        faceCenter,
        faceHeight,
        box: parsed,
      });
    }

    return res.json({
      success: true,
      detected: false,
      faceCenter: { x: 0.5, y: 0.36 },
      faceHeight: 0.45,
      message: 'Face not found, default centering applied',
    });
  } catch (err: any) {
    return res.json({
      success: true,
      detected: false,
      faceCenter: { x: 0.5, y: 0.36 },
      faceHeight: 0.45,
      message: 'Default centering applied',
    });
  }
});

// Default golden frame settings (persistent on server)
let flyerFrameSettings = {
  circleXRatio: 0.50,
  circleYRatio: 0.304,
  circleRadiusRatio: 0.168,
  showGoldRim: true,
};

// Get current default frame settings
app.get('/api/flyer-frame-settings', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    settings: flyerFrameSettings,
  });
});

// Save new default frame settings (configured by user/admin)
app.post('/api/flyer-frame-settings', (req: Request, res: Response) => {
  try {
    const { circleXRatio, circleYRatio, circleRadiusRatio, showGoldRim } = req.body;
    if (typeof circleXRatio === 'number') flyerFrameSettings.circleXRatio = circleXRatio;
    if (typeof circleYRatio === 'number') flyerFrameSettings.circleYRatio = circleYRatio;
    if (typeof circleRadiusRatio === 'number') flyerFrameSettings.circleRadiusRatio = circleRadiusRatio;
    if (typeof showGoldRim === 'boolean') flyerFrameSettings.showGoldRim = showGoldRim;

    return res.json({
      success: true,
      settings: flyerFrameSettings,
      message: 'Default golden frame position saved successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Upload custom flyer template (PNG/JPG)
app.post('/api/upload-custom-template', (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,(.+)$/);
    const base64Data = match ? match[2] : imageBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Save as both custom_template.png AND template.png so it is the first-priority default
    fs.writeFileSync(path.join(publicDir, 'custom_template.png'), buffer);
    fs.writeFileSync(path.join(publicDir, 'template.png'), buffer);

    const distDir = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'template.png'), buffer);
    }

    return res.json({
      success: true,
      url: `/template.png?v=${Date.now()}`,
      message: 'Default template saved successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AI-based compositing & enhancement endpoint (optional generative touch-up)
app.post('/api/generate-flyer-ai', async (req: Request, res: Response) => {
  try {
    const { templateBase64, photoBase64, prompt } = req.body;
    const gemini = getGemini();

    if (!gemini) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API is not configured on the server.',
      });
    }

    if (!templateBase64 || !photoBase64) {
      return res.status(400).json({
        success: false,
        error: 'Both templateBase64 and photoBase64 are required.',
      });
    }

    const cleanTemplate = templateBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const cleanPhoto = photoBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const compositePrompt = prompt || 
      'Please composite the person photo into the central circular gold frame of the birthday template. Preserve all text, balloons, choir members, and logo in the template completely intact. Center the face in the circle with natural lighting and proportions. Keep the original facial details 100% unaltered.';

    const response = await gemini.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanTemplate,
                mimeType: 'image/png',
              },
            },
            {
              inlineData: {
                data: cleanPhoto,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: compositePrompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'image/png',
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return res.json({
          success: true,
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'No image returned by AI model',
    });
  } catch (err: any) {
    console.error('AI flyer generation error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Reset demo state
app.post('/api/reset-demo', (req: Request, res: Response) => {
  appState = {
    choristers: [...INITIAL_CHORISTERS],
    committeeMembers: [...INITIAL_COMMITTEE_MEMBERS],
    feastNovenas: [...INITIAL_FEAST_NOVENAS],
    weeklyMasses: JSON.parse(JSON.stringify(INITIAL_WEEKLY_MASSES)),
    majorEvents: JSON.parse(JSON.stringify(INITIAL_MAJOR_EVENTS)),
    calendarConfig: { ...INITIAL_CALENDAR_CONFIG },
    auditLogs: [...INITIAL_AUDIT_LOGS],
    practices: [],
    archives: [...INITIAL_ARCHIVES],
    branding: {
      logoDriveUrl: 'https://drive.google.com/file/d/1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr/view?usp=sharing',
      logoDirectUrl: 'https://drive.google.com/thumbnail?id=1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr&sz=w800',
      isCentered: false,
      imgScale: 100,
      offsetX: 0,
      offsetY: 0,
      fitMode: 'cover' as 'cover' | 'contain',
      lastUpdatedBy: 'Joshua Peiris (President)',
      updatedAt: new Date().toISOString(),
    },
    notifications: [
      {
        id: 'init-notif-1',
        title: '⛪ Weekly Mass: Try Attend the Mass',
        body: 'Every Weekly Mass: Please try to attend the holy mass and support our choir ministry! Let us worship and praise God together with joyful hearts.',
        category: 'weekly-mass',
        timestamp: new Date().toISOString(),
        read: false,
        sentBy: 'Choir Executive Committee'
      },
      {
        id: 'init-notif-2',
        title: '📋 Choir Committee Member Check-in',
        body: 'Do your part to the choir as a committee member! What should we do next as a Choir ? 🤔 Take a moment to reflect and share your thoughts with the executive team.',
        category: 'committee',
        timestamp: new Date().toISOString(),
        read: false,
        sentBy: 'Executive Committee'
      },
      {
        id: 'init-notif-3',
        title: '🌟 Upcoming Major Celebrations',
        body: 'Main Events Like Feast, Carols, and Easter Are Coming Along! Keep up your practice, check the 100-day countdowns, and review your hymn schedules.',
        category: 'major-events',
        timestamp: new Date().toISOString(),
        read: false,
        sentBy: 'Choir Leadership'
      }
    ],
    automatedDispatchHistory: [],
  };
  broadcastUpdate('STATE_RESET', appState);
  res.json({ success: true, message: 'App state reset to clean seed' });
});

// --- AUTOMATED MASS NOTIFICATIONS BACKGROUND SCHEDULER ---
const automatedDispatchCache: Record<string, string> = {};

function triggerScheduledAutomatedMassReminders() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 2 = Tuesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  const hour = now.getHours();
  const dateStr = now.toISOString().slice(0, 10);

  // Tuesday Holy Mass (6.00 PM) -> dispatch afternoon
  if (day === 2 && hour >= 12 && hour < 18) {
    autoDispatchForMassKey('tuesday', 'Tuesday Holy Mass', dateStr + '-tuesday', 'Dear {name}, Try to Come for the mass that you told ur gonna come - Tuesday Holy Mass!');
  }
  // Thursday - Novena And Holy Mass (6.00 PM) -> dispatch afternoon
  if (day === 4 && hour >= 12 && hour < 18) {
    autoDispatchForMassKey('thursday', 'Thursday - Novena And Holy Mass', dateStr + '-thursday', 'Dear {name}, Try to Come for the mass that you told ur gonna come - Thursday - Novena And Holy Mass!');
  }
  // First Friday Holy Mass (6.00 PM) -> if 1st Friday of month
  if (day === 5 && now.getDate() <= 7 && hour >= 12 && hour < 18) {
    autoDispatchForMassKey('firstFriday', 'First Friday Holy Mass', dateStr + '-firstFriday', 'Dear {name}, Try to Come for the mass that you told ur gonna come - First Friday Holy Mass!');
  }
  // Saturday Sunday Mass 6 (6.00 PM) -> afternoon
  if (day === 6 && hour >= 12 && hour < 18) {
    autoDispatchForMassKey('saturdaySundayMass6', 'Saturday Sunday Mass 6', dateStr + '-saturday-6', 'Dear {name}, Try to Come for the mass that you told ur gonna come - Saturday Sunday Mass 6!');
  }
  // Sunday Morning Mass 6.30 (6.30 AM) -> morning
  if (day === 0 && hour >= 5 && hour < 8) {
    autoDispatchForMassKey('sundayMorningMass630', 'Sunday Morning Mass 6.30', dateStr + '-sunday-630', 'Dear {name}, Try to Come for the mass that you told ur gonna come - Sunday Morning Mass 6.30!');
  }
  // Sunday Morning Mass 8 (8.00 AM) -> morning
  if (day === 0 && hour >= 6 && hour < 10) {
    autoDispatchForMassKey('sundayMorningMass8', 'Sunday Morning Mass 8', dateStr + '-sunday-8', 'Dear {name}, Try to Come for the mass that you told ur gonna come - Sunday Morning Mass 8!');
  }
}

function autoDispatchForMassKey(massKey: string, massName: string, lockKey: string, template: string) {
  if (automatedDispatchCache[lockKey]) return;
  automatedDispatchCache[lockKey] = new Date().toISOString();

  const targets = (appState.committeeMembers && appState.committeeMembers.length > 0)
    ? appState.committeeMembers
    : INITIAL_COMMITTEE_MEMBERS;

  for (const m of targets) {
    const firstName = m.name.split(' ')[0] || m.name;
    const bodyText = template.replace(/{name}/g, firstName).replace(/{massName}/g, massName);

    const notif = {
      id: `cron-${massKey}-${m.id}-${Date.now()}`,
      title: `⛪ Mass Reminder: ${massName}`,
      body: bodyText,
      category: 'weekly-mass' as const,
      timestamp: new Date().toISOString(),
      read: false,
      sentBy: 'Choir Liturgy Office',
      targetMemberId: m.id,
      targetMemberName: m.name,
      targetMassKey: massKey,
    };

    if (!appState.notifications) appState.notifications = [];
    appState.notifications.unshift(notif);
    broadcastUpdate('NOTIFICATION_SENT', notif);
  }

  while (appState.notifications.length > 100) {
    appState.notifications.pop();
  }

  addAuditLog(
    'Automated Notification System',
    'Liturgy Office',
    'Scheduled Automated Mass Reminders Sent',
    `Automatic background scheduler sent reminders to all ${targets.length} committee members for ${massName}.`
  );
}

// Start background automated timer (runs every 60 seconds)
setInterval(() => {
  try {
    triggerScheduledAutomatedMassReminders();
  } catch (err) {
    console.error('Error in automated mass notification scheduler:', err);
  }
}, 60000);

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Choir Management System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
