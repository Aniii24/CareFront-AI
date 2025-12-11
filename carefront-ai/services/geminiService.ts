import { GoogleGenAI, Chat, Type, Schema, Part } from "@google/genai";
import { ChatMessage, ClinicalReport, Doctor, Patient } from "../types";
import { sanitizeString, logAudit } from "./securityService";

const BASE_SYSTEM_INSTRUCTION = `
You are an efficient, direct AI Intake Nurse.
1. **GOAL**: Gather concise medical info (Chief Complaint, HPI, Meds, Allergies).
2. **STYLE**: Be extremely brief. No pleasantries. No "I understand". Just ask the next question.
3. **PROTOCOL**:
   - Ask only ONE question at a time.
   - If emergency symptoms appear (chest pain, severe bleeding, difficulty breathing), STOP and say "CALL 911".
   - CRITICAL: Once you have gathered the Chief Complaint, History of Present Illness (HPI), Medications, and Allergies, you MUST end the interview.
   - TO END: Append the exact token "[INTAKE_COMPLETE]" to the end of your final response. Example: "Thank you. I have all the info. [INTAKE_COMPLETE]"
4. **ROLE**: Info gathering only. NEVER diagnose.
`;

// Schema for the final structured report
const REPORT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    chiefComplaint: { type: Type.STRING, description: "Primary reason for visit" },
    hpi: { type: Type.STRING, description: "Medical summary of History of Present Illness" },
    medications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of medications" },
    allergies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of allergies" },
    redFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "CRITICAL ALERTS ONLY (e.g. Chest Pain, Stroke, severe distress). Leave empty if routine." },
    ros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Review of Systems highlights" },
    patientSummary: { type: Type.STRING, description: "6th-grade level summary for patient" },
    suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 questions for the doctor" },
    urgencyLevel: { type: Type.STRING, enum: ['Routine', 'Non-Urgent', 'Urgent', 'Emergency'] },
    assignedDoctorId: { type: Type.STRING, description: "The ID of the best matching doctor from the provided list" },
    assignmentReason: { type: Type.STRING, description: "Brief reason why this doctor was selected based on specialty" }
  },
  required: ["chiefComplaint", "hpi", "redFlags", "patientSummary", "urgencyLevel", "assignedDoctorId"]
};

let chatSession: Chat | null = null;

// Helper for error handling
const handleGeminiError = (error: any, defaultMsg: string): string => {
  let errorStr = '';
  
  if (error instanceof Error) {
    errorStr = error.message;
    // Check if the error message itself is a JSON string (sometimes happens with SDKs)
    try {
        const parsed = JSON.parse(errorStr);
        errorStr += JSON.stringify(parsed);
    } catch {}
  } else if (typeof error === 'object' && error !== null) {
    // If it's a raw object like { error: { code: 429 ... } }
    errorStr = JSON.stringify(error);
  } else {
    errorStr = String(error);
  }

  if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota')) {
    return "⚠️ System Traffic High (Quota Exceeded). Please wait 1 minute and try again.";
  }
  return defaultMsg;
};

// Validate API Key existence (Security Check)
const checkApiKey = () => {
  if (!process.env.API_KEY) {
    console.error("CRITICAL: Missing API Key");
    throw new Error("Configuration Error: Secure connection cannot be established.");
  }
};

export const startIntakeChat = async (patient?: Patient): Promise<string> => {
  checkApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let instructions = BASE_SYSTEM_INSTRUCTION;

  // Personalize instructions if patient is logged in
  if (patient) {
    instructions += `
    5. **CONTEXT**: You are speaking to ${patient.name}. 
       - Do NOT ask for their name. You already know it.
       - KNOWN HISTORY: ${patient.history || "None provided"}.
       - Start by confirming if the visit is related to their history or something new, but keep it brief.
       - First message example: "Hello ${patient.name}. I see your history of ${patient.history || 'medical records'}. What brings you in today?"
    `;
  } else {
    instructions += `
    5. **CONTEXT**: Unknown patient.
       - Start with: "Name and main reason for visit?"
    `;
  }

  // Using 'gemini-3-pro-preview' as requested for image understanding capabilities
  chatSession = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: instructions,
      temperature: 0.5,
    }
  });

  try {
    const response = await chatSession.sendMessage({ 
      message: "Start intake. Brief." 
    });
    
    logAudit(patient?.medicalCardId || 'anonymous', 'CHAT_SESSION_START', 'Intake session initiated');
    return response.text || (patient ? `Hello ${patient.name}. What brings you in today?` : "Name and main reason for visit?");
  } catch (error) {
    console.error("Failed to start chat:", error);
    return handleGeminiError(error, "System Error. Please refresh.");
  }
};

export const sendMessageToGemini = async (message: string, imageBase64?: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  // SECURITY: Sanitize Input before sending to LLM to prevent prompt injection
  const safeMessage = sanitizeString(message);

  try {
    let result;
    if (imageBase64) {
      // Parse data URL: data:image/png;base64,....
      const match = imageBase64.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const data = match[2];
        
        // Pass parts to the message parameter
        result = await chatSession.sendMessage({
          message: [
            { text: safeMessage || "Analyze this image." },
            { inlineData: { mimeType, data } }
          ]
        });
      } else {
         // Fallback if parsing fails, though UI should ensure it's a data URL
         result = await chatSession.sendMessage({ message: safeMessage });
      }
    } else {
      result = await chatSession.sendMessage({ message: safeMessage });
    }
    return result.text || "Repeat that?";
  } catch (error) {
    console.error("Error sending message:", error);
    return handleGeminiError(error, "Connection error. Please try again.");
  }
};

export const generateClinicalReport = async (history: ChatMessage[], availableDoctors: Doctor[]): Promise<ClinicalReport> => {
  checkApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // SECURITY: Sanitize entire history before processing report
  const conversationText = history
    .map(m => `${m.sender.toUpperCase()}: ${sanitizeString(m.text)} ${m.image ? '[Image Uploaded]' : ''}`)
    .join('\n');

  const doctorListString = availableDoctors.map(d => 
    `ID: ${d.id}, Name: ${d.name}, Specialty: ${d.specialty}, Experience: ${d.experience}, Status: ${d.status}`
  ).join('\n');

  const prompt = `
    Analyze this patient intake. Extract clinical data.
    
    CRITICAL INSTRUCTION ON RED FLAGS:
    - Only include symptoms in 'redFlags' if they indicate IMMEDIATE DANGER or URGENT care needs (e.g., chest pain, difficulty breathing, severe bleeding, suicidal ideation, signs of stroke).
    - Do NOT list chronic conditions, mild pain, common colds, or routine symptoms as red flags.
    - If there are no dangerous symptoms, return an empty list for redFlags.
    
    Then, select the MOST APPROPRIATE doctor from the list below based on the patient's symptoms.
    Prioritize doctors who are 'Available'.
    
    AVAILABLE DOCTORS:
    ${doctorListString}

    TRANSCRIPT:
    ${conversationText}
  `;

  try {
    logAudit('system', 'REPORT_GENERATION', 'Generating clinical report from chat history');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: REPORT_SCHEMA
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response");

    return JSON.parse(jsonText) as ClinicalReport;
  } catch (error) {
    console.error("Report generation failed:", error);
    logAudit('system', 'REPORT_FAILURE', 'Failed to generate clinical report', 'FAILURE');
    
    let errorStr = '';
    if (error instanceof Error) {
        errorStr = error.message;
    } else if (typeof error === 'object' && error !== null) {
        errorStr = JSON.stringify(error);
    } else {
        errorStr = String(error);
    }

    if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota')) {
        throw new Error("Quota exceeded. Please wait 1 minute and try again.");
    }
    throw new Error("Failed to generate report.");
  }
};