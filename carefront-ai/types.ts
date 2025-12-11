export enum Sender {
  USER = 'user',
  BOT = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  text: string;
  image?: string; // Base64 Data URL
  sender: Sender;
  timestamp: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  status: 'Available' | 'In Surgery' | 'On Call';
}

export interface ClinicalReport {
  id?: string;
  date?: string;
  chiefComplaint: string;
  hpi: string; // History of Present Illness
  medications: string[];
  allergies: string[];
  redFlags: string[]; // Detected risks
  ros: string[]; // Review of Systems highlights
  patientSummary: string; // Plain English for patient
  suggestedQuestions: string[]; // For the patient to ask the doctor
  urgencyLevel: 'Routine' | 'Non-Urgent' | 'Urgent' | 'Emergency';
  assignedDoctorId?: string; // ID of the matched doctor
  assignmentReason?: string; // Reason for assignment
}

export interface VisitRecord {
  date: string;
  report: ClinicalReport;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
}

export interface Patient {
  name: string;
  medicalCardId: string;
  history?: string; // Brief medical history context string for the AI
  visits?: VisitRecord[]; // Structured past visits
  appointments?: Appointment[]; // Scheduled meetings
}

export type ViewState = 'dashboard' | 'chat' | 'staff' | 'patients' | 'generating' | 'report' | 'login';