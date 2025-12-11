import React from 'react';
import { Patient, VisitRecord, Appointment } from '../types';
import { Button } from './Button';
import { Calendar, Clock, FileText, Activity, User, Home } from 'lucide-react';

interface PatientDashboardProps {
  patient: Patient;
  onClose: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient, onClose }) => {
  const visits = patient.visits || [];
  const appointments = patient.appointments || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-4 md:p-8 animate-fade-in space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
               <User size={32} />
            </div>
            {patient.name}
          </h2>
          <p className="text-slate-500 mt-1">Medical Card ID: {patient.medicalCardId}</p>
        </div>
        <Button variant="secondary" onClick={onClose}>
          <Home size={18} /> Back to Home
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Appointments Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Calendar size={20} className="text-teal-600" /> My Appointments
            </h3>
          </div>
          <div className="p-6">
            {appointments.length === 0 ? (
              <p className="text-slate-400 italic text-center py-4">No scheduled appointments.</p>
            ) : (
              <div className="space-y-4">
                {appointments.slice().reverse().map(appt => (
                  <div key={appt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:border-teal-100 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{appt.doctorName}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {appt.date}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {appt.time}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(appt.status)}`}>
                      {appt.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Medical History Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-teal-600" /> Intake History
            </h3>
          </div>
          <div className="p-6">
            {visits.length === 0 ? (
              <p className="text-slate-400 italic text-center py-4">No visit history recorded.</p>
            ) : (
              <div className="space-y-4">
                {visits.slice().reverse().map((visit, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:border-cyan-200 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-slate-500">{visit.date}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        visit.report.urgencyLevel === 'Emergency' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {visit.report.urgencyLevel}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1">{visit.report.chiefComplaint}</h4>
                    <p className="text-sm text-slate-600 line-clamp-2">{visit.report.patientSummary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};