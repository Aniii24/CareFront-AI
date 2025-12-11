import { z } from 'zod';

// --- AUDIT LOGGING ---
export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

const AUDIT_KEY = 'guardrail_audit_trail_enc';

export const logAudit = (user: string, action: string, resource: string, status: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS') => {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    user,
    action,
    resource,
    status
  };

  // In a real app, send this to a backend log aggregator (Splunk, Datadog).
  // For this client-side demo, we store it encrypted.
  const currentLogs = getAuditLogs();
  currentLogs.push(log);
  
  // Rotate logs if too large (client-side limit)
  if (currentLogs.length > 1000) currentLogs.shift();
  
  try {
    const encrypted = encryptData(currentLogs);
    localStorage.setItem(AUDIT_KEY, encrypted);
  } catch (e) {
    console.error("Audit log failure");
  }
};

const getAuditLogs = (): AuditLog[] => {
  const raw = localStorage.getItem(AUDIT_KEY);
  if (!raw) return [];
  try {
    return decryptData(raw) as AuditLog[];
  } catch {
    return [];
  }
};


// --- ENCRYPTION SIMULATION ---
// In a real environment, use Web Crypto API (AES-GCM) with a key derived from a backend session.
// For this demo, we use a simulation to demonstrate "Data at Rest" protection patterns.

const SECRET_SALT = "GUARDRAIL_SALT_V1_"; // In prod, never hardcode.

export const encryptData = (data: any): string => {
  try {
    const jsonStr = JSON.stringify(data);
    // Simulation: Base64 encode with a salt to prevent plain-text reading in DevTools
    return btoa(SECRET_SALT + encodeURIComponent(jsonStr));
  } catch (e) {
    console.error("Encryption failed", e);
    throw new Error("Data protection failure");
  }
};

export const decryptData = (ciphertext: string): any => {
  try {
    const decoded = decodeURIComponent(atob(ciphertext));
    if (!decoded.startsWith(SECRET_SALT)) {
      throw new Error("Integrity check failed");
    }
    const jsonStr = decoded.replace(SECRET_SALT, '');
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Decryption failed / Data tampering detected", e);
    return null;
  }
};


// --- INPUT VALIDATION SCHEMAS (ZOD) ---

export const PatientLoginSchema = z.object({
  name: z.string()
    .min(2, "Name too short")
    .max(50, "Name too long")
    .regex(/^[a-zA-Z\s\-\.]+$/, "Name contains invalid characters (letters only)"),
  medicalCardId: z.string()
    .regex(/^\d{3}-\d{3}-\d{3}$/, "Invalid ID format. Required: 000-000-000")
});

export const AdminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export const validateAdminCredentials = (u: string, p: string) => {
  // In a real app, verify against a hashed password in a secure DB.
  // Demo credentials:
  return u === 'admin' && p === 'carefront2024';
};

export const ChatMessageSchema = z.string()
  .min(1, "Message cannot be empty")
  .max(1000, "Message too long")
  .refine(val => !/<script>|javascript:/i.test(val), "Malicious content detected");

export const sanitizeString = (input: string): string => {
  // Basic XSS sanitization simulation
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};