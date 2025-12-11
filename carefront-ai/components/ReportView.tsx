import React, { useState } from 'react';
import { ClinicalReport, Doctor } from '../types';
import { Button } from './Button';
import { AlertTriangle, Printer, Activity, CheckCircle, ShieldAlert, Stethoscope, Calendar, ArrowLeft } from 'lucide-react';
import { BookingModal } from './BookingModal';

interface ReportViewProps {
  report: ClinicalReport;
  assignedDoctor?: Doctor;
  onReset: () => void;
  onBookingConfirm?: (date: string, time: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, assignedDoctor, onReset, onBookingConfirm }) => {
  const [activeTab, setActiveTab] = useState<'clinician' | 'patient'>('clinician');
  const [showBooking, setShowBooking] = useState(false);

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'Emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'Urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Non-Urgent': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBookingConfirm = (date: string, time: string) => {
    setShowBooking(false);
    if (onBookingConfirm) {
      onBookingConfirm(date, time);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      
      {/* Booking Modal */}
      {showBooking && assignedDoctor && (
        <BookingModal 
          doctor={assignedDoctor} 
          onClose={() => setShowBooking(false)} 
          onConfirm={handleBookingConfirm} 
        />
      )}

      {/* --- PRINT ONLY VIEW --- */}
      <div className="print-container hidden print:block font-serif text-black p-8 max-w-4xl mx-auto bg-white">
        <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-widest">Medical Report</h1>
              <p className="text-lg mt-2 text-gray-600">Confidential Patient Record</p>
            </div>
            <div className="text-right text-sm">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>ID: {report.id || Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
        </div>

        {/* Core Summary Section - Requested Feature */}
        <div className="bg-gray-50 p-6 border border-gray-200 mb-8 rounded-lg">
          <h3 className="font-bold text-lg border-b border-gray-300 pb-2 mb-3 uppercase flex items-center gap-2">
            <Activity size={20} /> Chat Summary & Condition Report
          </h3>
          <p className="text-lg leading-relaxed text-gray-800 text-justify">
            {report.patientSummary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-8">
          <div>
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2">Triage Assessment</h3>
            <div className="text-xl font-bold border-l-4 border-black pl-3">{report.urgencyLevel.toUpperCase()}</div>
          </div>
          <div>
             <h3 className="font-bold text-sm uppercase text-gray-500 mb-2">Referred To</h3>
             <div className="text-xl font-bold border-l-4 border-black pl-3">
               {assignedDoctor ? assignedDoctor.name : "General Practice"}
               <span className="block text-sm font-normal text-gray-600">{assignedDoctor?.specialty}</span>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="mb-6">
            <h3 className="font-bold text-md uppercase border-b border-gray-300 mb-2">Clinical Details</h3>
            <div className="grid grid-cols-1 gap-4">
               <div><span className="font-bold">Chief Complaint:</span> {report.chiefComplaint}</div>
               <div><span className="font-bold">HPI:</span> {report.hpi}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div>
               <h3 className="font-bold text-md uppercase border-b border-gray-300 mb-2">Medications</h3>
               <ul className="list-disc list-inside">
                 {report.medications.length ? report.medications.map(m => <li key={m}>{m}</li>) : <li>None Reported</li>}
               </ul>
             </div>
             <div>
               <h3 className="font-bold text-md uppercase border-b border-gray-300 mb-2">Allergies</h3>
               <ul className="list-disc list-inside">
                 {report.allergies.length ? report.allergies.map(m => <li key={m}>{m}</li>) : <li>NKA</li>}
               </ul>
             </div>
          </div>

          {report.redFlags.length > 0 && (
            <div className="border-2 border-black p-4 mt-6">
              <h3 className="font-bold text-sm uppercase mb-2 text-red-600">⚠ CRITICAL ALERTS</h3>
              <ul className="list-disc list-inside font-bold">
                 {report.redFlags.map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
           <p>This report was generated by GuardRail AI Intake System. It summarizes the patient's reported symptoms and history.</p>
           <p>Not a final diagnosis. Please review with attending physician.</p>
        </div>
      </div>
      {/* --- END PRINT ONLY VIEW --- */}


      {/* --- INTERACTIVE WEB VIEW (Hidden on Print) --- */}
      <div className="print:hidden flex flex-col h-full overflow-hidden">
        
        {/* Header Actions */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={onReset} className="text-slate-500 hover:text-slate-800">
               <ArrowLeft size={18} /> Back
             </Button>
             <div>
               <h2 className="text-xl font-bold text-slate-900">Clinical Report Generated</h2>
               <p className="text-xs text-slate-500">ID: {report.id?.substring(0,8)}</p>
             </div>
          </div>
          <div className="flex gap-3">
             <Button onClick={handlePrint} variant="secondary">
                <Printer size={18} /> Print Full Report
             </Button>
             <Button onClick={onReset}>
                New Intake
             </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
          
            {/* Doctor Assignment Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-teal-500"></div>
              
              <div className="bg-teal-50 p-4 rounded-full text-teal-600 shrink-0">
                <Stethoscope size={32} />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Recommended Specialist</h3>
                {assignedDoctor ? (
                  <>
                    <p className="text-2xl font-bold text-slate-900">{assignedDoctor.name}</p>
                    <p className="text-slate-600 font-medium">{assignedDoctor.specialty}</p>
                    <p className="text-sm text-slate-400 mt-1">{assignedDoctor.experience} Experience</p>
                  </>
                ) : (
                  <p className="text-slate-500 italic">No specific doctor assigned</p>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-3 min-w-[200px]">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${getUrgencyColor(report.urgencyLevel)}`}>
                    <Activity size={16} />
                    {report.urgencyLevel.toUpperCase()}
                  </span>
                  <Button size="md" onClick={() => setShowBooking(true)} className="w-full bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200">
                    <Calendar size={18} /> Book Appointment
                  </Button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('clinician')}
                  className={`flex-1 py-4 font-bold text-sm transition-colors text-center ${
                    activeTab === 'clinician' ? 'bg-slate-50 text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Clinician View
                </button>
                <button
                  onClick={() => setActiveTab('patient')}
                  className={`flex-1 py-4 font-bold text-sm transition-colors text-center ${
                    activeTab === 'patient' ? 'bg-slate-50 text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Patient Summary
                </button>
              </div>

              <div className="p-8">
                {/* Clinician View */}
                {activeTab === 'clinician' && (
                  <div className="animate-fade-in space-y-8">
                     {report.redFlags.length > 0 && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                          <div>
                            <h4 className="font-bold text-red-800 text-sm">Red Flags Detected</h4>
                            <ul className="list-disc list-inside text-red-700 text-sm mt-1">
                              {report.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Chief Complaint</h4>
                          <p className="text-slate-900 font-medium text-lg">{report.chiefComplaint}</p>
                        </div>
                        <div>
                           <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Known Allergies</h4>
                           <div className="flex flex-wrap gap-2">
                             {report.allergies.length > 0 
                               ? report.allergies.map(a => <span key={a} className="bg-slate-100 px-3 py-1 rounded-lg text-sm text-slate-700">{a}</span>)
                               : <span className="text-slate-400 italic">None</span>
                             }
                           </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">History of Present Illness (HPI)</h4>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {report.hpi}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Current Medications</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           {report.medications.length > 0 
                             ? report.medications.map(m => <div key={m} className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm">{m}</div>)
                             : <p className="text-slate-400 italic">None Reported</p>
                           }
                        </div>
                      </div>
                  </div>
                )}

                {/* Patient View */}
                {activeTab === 'patient' && (
                  <div className="animate-fade-in space-y-8">
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 rounded-2xl border border-teal-100">
                      <h4 className="font-bold text-teal-900 mb-4 flex items-center gap-2 text-lg">
                        <Activity size={24} />
                        Summary of Your Condition
                      </h4>
                      <p className="text-teal-800 text-lg leading-relaxed">
                        {report.patientSummary}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 mb-4">Recommended Questions for your Doctor</h4>
                      <div className="grid gap-4">
                        {report.suggestedQuestions.map((q, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-200 transition-colors cursor-default">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <p className="text-slate-700 font-medium pt-1">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};