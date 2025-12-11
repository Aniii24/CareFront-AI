import React, { useState, useEffect, useRef } from 'react';
import { Send, Stethoscope, PhoneCall, Image as ImageIcon, X, Bell } from 'lucide-react';
import { ChatMessage, ClinicalReport, Sender, ViewState, Doctor, Patient, Appointment } from './types';
import { startIntakeChat, sendMessageToGemini, generateClinicalReport } from './services/geminiService';
import { getPatient, savePatient, addReportToPatient, addAppointmentToPatient, getPatient as refreshPatientData } from './services/storageService';
import { ChatMessageSchema, logAudit } from './services/securityService';
import { Button } from './components/Button';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { ReportView } from './components/ReportView';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginView } from './components/LoginView';
import { PatientDashboard } from './components/PatientDashboard';
import { Sidebar } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';

const INITIAL_DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Sarah Chen', specialty: 'Cardiology', experience: '12 years', status: 'Available' },
  { id: 'd2', name: 'Dr. James Wilson', specialty: 'General Practice', experience: '8 years', status: 'Available' },
  { id: 'd3', name: 'Dr. Emily Carter', specialty: 'Dermatology', experience: '15 years', status: 'Available' },
  { id: 'd4', name: 'Dr. Michael Ross', specialty: 'Orthopedics', experience: '20 years', status: 'In Surgery' },
  { id: 'd5', name: 'Dr. Alan Grant', specialty: 'Psychiatry', experience: '14 years', status: 'Available' },
  { id: 'd6', name: 'Dr. Lisa Ray', specialty: 'Physiotherapy', experience: '6 years', status: 'On Call' },
  { id: 'd7', name: 'Dr. Raj Patel', specialty: 'Neurology', experience: '18 years', status: 'Available' },
  { id: 'd8', name: 'Dr. Sofia Vergara', specialty: 'Pediatrics', experience: '10 years', status: 'Available' },
];

const SESSION_TIMEOUT_MS = 1000 * 60 * 15; // 15 Minute idle timeout

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('dashboard');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [report, setReport] = useState<ClinicalReport | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  
  // Auth State
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- SECURITY: Session Management (Idle Timeout) ---
  useEffect(() => {
    let timeout: number;

    const resetTimer = () => {
      clearTimeout(timeout);
      if (patient || isAdmin) {
        timeout = window.setTimeout(handleLogout, SESSION_TIMEOUT_MS);
      }
    };

    // Events to track activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    if (patient || isAdmin) {
      resetTimer(); // Start timer on login
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [patient, isAdmin]);

  const handleLogout = () => {
    if (patient) logAudit(patient.medicalCardId, 'LOGOUT', 'User logout/timeout');
    if (isAdmin) logAudit('admin', 'LOGOUT', 'Admin logout/timeout');
    
    setPatient(null);
    setIsAdmin(false);
    setViewState('dashboard');
    // alert("Logged out."); // Optional UI feedback
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle View Transitions
  const handleViewChange = async (view: ViewState) => {
    // --- SECURITY: RBAC Enforcement ---
    if (view === 'staff' && !isAdmin) {
      logAudit(patient?.medicalCardId || 'guest', 'UNAUTHORIZED_ACCESS_ATTEMPT', 'Attempted to access Admin Staff view', 'WARNING');
      alert("Access Restricted: Administrators Only.");
      return; 
    }

    if (view === 'patients' && !patient && !isAdmin) {
       // Only allow patients (or maybe admins) to view records
       if (!patient) return;
    }

    if (view === 'chat' && messages.length === 0) {
      handleStartIntake();
    }
    setViewState(view);
  };

  const handleStartIntake = async () => {
    setViewState('chat');
    setIsTyping(true);
    const initialGreeting = await startIntakeChat(patient || undefined);
    
    setMessages([
      {
        id: 'system-start',
        text: patient ? `Welcome, ${patient.name}. History Loaded.` : 'Secure session established.',
        sender: Sender.SYSTEM,
        timestamp: Date.now()
      },
      {
        id: 'bot-start',
        text: initialGreeting,
        sender: Sender.BOT,
        timestamp: Date.now()
      }
    ]);
    setIsTyping(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Invalid file type.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    // --- SECURITY: Input Validation ---
    const validation = ChatMessageSchema.safeParse(inputValue);
    if (!validation.success) {
      alert("Invalid input: " + validation.error.errors[0]?.message);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      image: selectedImage || undefined,
      sender: Sender.USER,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsTyping(true);

    const rawResponse = await sendMessageToGemini(userMsg.text, imageToSend || undefined);
    const isComplete = rawResponse.includes('[INTAKE_COMPLETE]');
    const cleanResponse = rawResponse.replace('[INTAKE_COMPLETE]', '').trim();

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      text: cleanResponse,
      sender: Sender.BOT,
      timestamp: Date.now()
    }]);
    setIsTyping(false);

    if (isComplete) {
      setTimeout(() => {
        handleGenerateReport(true);
      }, 1500);
    }
  };

  const handleGenerateReport = async (auto = false) => {
    if (messages.length < 2 && !auto) {
      alert("Please provide some information first.");
      return;
    }
    
    setViewState('generating');
    try {
      const generatedReport = await generateClinicalReport(messages, doctors);
      setReport(generatedReport);
      
      if (patient) {
        const updatedPatient = addReportToPatient(patient.medicalCardId, generatedReport);
        setPatient(updatedPatient);
      }

      setViewState('report');
    } catch (e) {
      console.error(e);
      setViewState('chat'); 
      const msg = e instanceof Error ? e.message : "Failed to generate report.";
      alert(msg);
    }
  };

  const handleLogin = (name: string, medicalCardId: string) => {
    // Ensure admin is logged out if patient logs in (mutually exclusive for this demo)
    setIsAdmin(false);

    const existingPatient = refreshPatientData(medicalCardId);
    if (existingPatient) {
      setPatient(existingPatient);
      logAudit(medicalCardId, 'LOGIN', 'Successful user login');
    } else {
      const newPatient: Patient = {
        name,
        medicalCardId,
        history: "No previous records in this system.",
        visits: [],
        appointments: []
      };
      savePatient(newPatient);
      setPatient(newPatient);
      logAudit(medicalCardId, 'REGISTER', 'New patient registration');
    }
    setViewState('dashboard');
  };

  const handleAdminLogin = () => {
    setPatient(null);
    setIsAdmin(true);
    logAudit('admin', 'LOGIN_ADMIN', 'Administrator authenticated');
    setViewState('dashboard');
  };

  const handleBookingRequest = (doctor: Doctor, date: string, time: string) => {
    if (!patient) return;
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      date,
      time,
      status: 'Pending'
    };
    const updatedPatient = addAppointmentToPatient(patient.medicalCardId, newAppointment);
    setPatient(updatedPatient);
    alert(`Request Sent!`);
    setViewState('patients');
  };

  const getAssignedDoctor = (): Doctor | undefined => {
    if (!report || !report.assignedDoctorId) return undefined;
    return doctors.find(d => d.id === report.assignedDoctorId);
  };

  // Determine label for header
  const getUserLabel = () => {
    if (isAdmin) return 'Administrator Mode';
    if (patient) return `${patient.name} (Patient)`;
    return 'Guest Access';
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 1. Sidebar */}
      <Sidebar 
        activeView={viewState} 
        onChangeView={handleViewChange} 
        isLoggedIn={!!patient || isAdmin}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-8 shrink-0 print:hidden">
          <h1 className="text-xl font-bold text-slate-800 capitalize">
            {viewState === 'generating' ? 'Processing' : viewState}
          </h1>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border ${isAdmin ? 'bg-blue-50 text-blue-700 border-blue-200' : (patient ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200')}`}>
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-blue-600' : (patient ? 'bg-emerald-500' : 'bg-slate-400')}`}></div>
              {getUserLabel()}
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => alert("Calling Emergency Services...")}>
               <PhoneCall size={14} /> 911
            </div>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-auto bg-slate-50/50 relative">
          
          {/* Dashboard Overview */}
          {viewState === 'dashboard' && (
             <DashboardStats 
               doctors={doctors} 
               onQuickAction={handleViewChange} 
               isAdmin={isAdmin}
             />
          )}

          {/* Login View */}
          {viewState === 'login' && (
            <div className="h-full flex items-center justify-center">
              <LoginView 
                onLogin={handleLogin} 
                onAdminLogin={handleAdminLogin}
                onCancel={() => setViewState('dashboard')} 
              />
            </div>
          )}

          {/* Chat Interface */}
          {viewState === 'chat' && (
             <div className="h-full flex flex-col max-w-5xl mx-auto bg-white shadow-xl border-x border-slate-200">
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {messages.length === 0 && (
                   <div className="text-center mt-20 text-slate-400">
                     <Stethoscope size={48} className="mx-auto mb-4 opacity-50" />
                     <p>Starting secure session...</p>
                   </div>
                 )}
                 {messages.map(msg => <ChatMessageBubble key={msg.id} message={msg} />)}
                 {isTyping && (
                   <div className="flex w-full mb-4 justify-start animate-pulse">
                     <div className="flex items-center gap-2 bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none ml-10">
                       <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full delay-75"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full delay-150"></span>
                     </div>
                   </div>
                 )}
                 <div ref={messagesEndRef} />
               </div>

               <div className="p-6 bg-white border-t border-slate-100">
                  {selectedImage && (
                    <div className="relative inline-block mb-3 animate-fade-in-up">
                      <img src={selectedImage} alt="Preview" className="h-24 rounded-xl border border-slate-200 shadow-md" />
                      <button onClick={removeSelectedImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="px-3 rounded-xl border-slate-200" title="Upload Image">
                      <ImageIcon size={20} className="text-slate-500" />
                    </Button>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder={selectedImage ? "Describe the image..." : "Describe symptoms..."}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all text-slate-800"
                      disabled={isTyping}
                      autoFocus
                    />
                    <Button onClick={handleSendMessage} disabled={(!inputValue.trim() && !selectedImage) || isTyping} className="rounded-xl px-6 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-900/20">
                      <Send size={20} />
                    </Button>
                  </div>
                  <div className="text-center mt-3">
                    <button onClick={() => handleGenerateReport(false)} className="text-xs text-red-400 hover:text-red-600 font-medium">End Assessment & Generate Report</button>
                  </div>
               </div>
             </div>
          )}

          {/* Loading View */}
          {viewState === 'generating' && (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 border-4 border-slate-100 border-t-teal-500 rounded-full animate-spin mb-8"></div>
              <h2 className="text-2xl font-bold text-slate-800">Analyzing Clinical Data</h2>
              <p className="text-slate-500 mt-2">Generating comprehensive report and matching specialist...</p>
            </div>
          )}

          {/* Report View */}
          {viewState === 'report' && report && (
            <ReportView 
              report={report} 
              assignedDoctor={getAssignedDoctor()}
              onReset={() => { setMessages([]); setReport(null); setViewState('dashboard'); }} 
              onBookingConfirm={(d, t) => {
                 if (report.assignedDoctorId && getAssignedDoctor()) {
                   handleBookingRequest(getAssignedDoctor()!, d, t);
                 }
              }}
            />
          )}

          {/* Staff View (Admin) - RESTRICTED TO ADMIN */}
          {viewState === 'staff' && isAdmin && (
             <AdminDashboard 
               doctors={doctors}
               onAddDoctor={(doc) => setDoctors([...doctors, doc])}
               onRemoveDoctor={(id) => setDoctors(doctors.filter(d => d.id !== id))}
               onClose={() => setViewState('dashboard')}
             />
          )}

          {/* Patient Records View */}
          {viewState === 'patients' && patient && (
             <PatientDashboard patient={patient} onClose={() => setViewState('dashboard')} />
          )}

        </main>
      </div>
    </div>
  );
};

export default App;