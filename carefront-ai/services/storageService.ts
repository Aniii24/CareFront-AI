import { Patient, ClinicalReport, VisitRecord, Appointment } from '../types';
import { encryptData, decryptData, logAudit } from './securityService';

const STORAGE_KEY = 'guardrail_patients_db_encrypted';

const getDatabase = (): Record<string, Patient> => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  
  const decrypted = decryptData(raw);
  return decrypted || {};
};

const saveDatabase = (db: Record<string, Patient>) => {
  const encrypted = encryptData(db);
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const getPatient = (medicalCardId: string): Patient | null => {
  const db = getDatabase();
  const patient = db[medicalCardId] || null;
  
  if (patient) {
    logAudit(medicalCardId, 'ACCESS_RECORD', `Patient record retrieved for ID: ${medicalCardId}`);
  } else {
    logAudit('system', 'ACCESS_ATTEMPT_FAILED', `Failed lookup for ID: ${medicalCardId}`, 'WARNING');
  }
  
  return patient;
};

// Admin helper: Get all patients to scan for appointments
export const getAllPatients = (): Patient[] => {
  // In a real app, this should be paginated and server-side.
  const db = getDatabase();
  logAudit('admin', 'BULK_EXPORT', 'Accessed all patient records for appointment scan');
  return Object.values(db);
};

export const savePatient = (patient: Patient): void => {
  const db = getDatabase();
  db[patient.medicalCardId] = patient;
  saveDatabase(db);
  logAudit(patient.medicalCardId, 'CREATE_UPDATE_USER', `Patient record updated: ${patient.name}`);
};

export const addReportToPatient = (medicalCardId: string, report: ClinicalReport): Patient => {
  const db = getDatabase();
  const patient = db[medicalCardId];
  
  if (!patient) throw new Error("Patient not found");

  const newVisit: VisitRecord = {
    date: new Date().toISOString(),
    report: { ...report, id: Date.now().toString(), date: new Date().toLocaleDateString() }
  };

  const visits = patient.visits || [];
  visits.push(newVisit);
  
  // Update the summary string for the AI context
  const historySummary = generateHistoryString(visits);
  
  const updatedPatient = {
    ...patient,
    visits,
    history: patient.history ? `${patient.history}. ${historySummary}` : historySummary
  };

  db[medicalCardId] = updatedPatient;
  saveDatabase(db);
  
  logAudit(medicalCardId, 'CLINICAL_REPORT_SAVED', `New report generated. Urgency: ${report.urgencyLevel}`);
  
  return updatedPatient;
};

export const addAppointmentToPatient = (medicalCardId: string, appointment: Appointment): Patient => {
  const db = getDatabase();
  const patient = db[medicalCardId];
  if (!patient) throw new Error("Patient not found");

  const appointments = patient.appointments || [];
  appointments.push(appointment);

  const updatedPatient = { ...patient, appointments };
  db[medicalCardId] = updatedPatient;
  saveDatabase(db);
  
  logAudit(medicalCardId, 'APPOINTMENT_REQUEST', `Request for Dr. ${appointment.doctorName}`);
  return updatedPatient;
};

export const updateAppointmentStatus = (medicalCardId: string, appointmentId: string, status: 'Confirmed' | 'Cancelled'): void => {
  const db = getDatabase();
  const patient = db[medicalCardId];
  if (!patient || !patient.appointments) return;

  const updatedAppointments = patient.appointments.map(appt => 
    appt.id === appointmentId ? { ...appt, status } : appt
  );

  db[medicalCardId] = { ...patient, appointments: updatedAppointments };
  saveDatabase(db);
  logAudit('admin', 'APPOINTMENT_STATUS_CHANGE', `Appointment ${status} for Patient ${medicalCardId}`);
};

const generateHistoryString = (visits: VisitRecord[]): string => {
  if (visits.length === 0) return "";
  const lastVisit = visits[visits.length - 1];
  return `Last visit on ${new Date(lastVisit.date).toLocaleDateString()} for ${lastVisit.report.chiefComplaint}. Findings: ${lastVisit.report.urgencyLevel} urgency.`;
};