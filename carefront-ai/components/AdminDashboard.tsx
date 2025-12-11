import React, { useState, useEffect } from 'react';
import { Doctor, Appointment, Patient } from '../types';
import { Button } from './Button';
import { Trash2, UserPlus, Briefcase, Award, CheckCircle, XCircle, Calendar, Users, Clock } from 'lucide-react';
import { getAllPatients, updateAppointmentStatus } from '../services/storageService';

interface AdminDashboardProps {
  doctors: Doctor[];
  onAddDoctor: (doctor: Doctor) => void;
  onRemoveDoctor: (id: string) => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  doctors, 
  onAddDoctor, 
  onRemoveDoctor,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'appointments'>('staff');
  const [newDoc, setNewDoc] = useState({ name: '', specialty: '', experience: '' });
  
  // State for appointments aggregation
  const [pendingAppointments, setPendingAppointments] = useState<{patient: Patient, appt: Appointment}[]>([]);

  useEffect(() => {
    refreshAppointments();
  }, []);

  const refreshAppointments = () => {
    const patients = getAllPatients();
    const pending: {patient: Patient, appt: Appointment}[] = [];
    
    patients.forEach(p => {
      if (p.appointments) {
        p.appointments.forEach(a => {
          if (a.status === 'Pending') {
            pending.push({ patient: p, appt: a });
          }
        });
      }
    });
    setPendingAppointments(pending);
  };

  const handleApprove = (patientId: string, apptId: string) => {
    updateAppointmentStatus(patientId, apptId, 'Confirmed');
    refreshAppointments();
  };

  const handleReject = (patientId: string, apptId: string) => {
    updateAppointmentStatus(patientId, apptId, 'Cancelled');
    refreshAppointments();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.specialty) return;

    onAddDoctor({
      id: Math.random().toString(36).substr(2, 9),
      name: newDoc.name,
      specialty: newDoc.specialty,
      experience: newDoc.experience || '1 year',
      status: 'Available'
    });
    setNewDoc({ name: '', specialty: '', experience: '' });
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Hospital Administration</h2>
           <p className="text-slate-500">Manage medical staff and patient requests</p>
        </div>
        <Button variant="secondary" onClick={onClose}>Exit Admin</Button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-8">
        <button 
          onClick={() => setActiveTab('staff')}
          className={`pb-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'staff' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={18} /> Staff Management
        </button>
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'appointments' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Calendar size={18} /> 
          Appointment Requests
          {pendingAppointments.length > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pendingAppointments.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add Doctor Form */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-teal-700">
              <UserPlus size={20} /> Add New Staff
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Dr. Jane Doe"
                  value={newDoc.name}
                  onChange={e => setNewDoc({...newDoc, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Cardiology"
                  value={newDoc.specialty}
                  onChange={e => setNewDoc({...newDoc, specialty: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="10 years"
                  value={newDoc.experience}
                  onChange={e => setNewDoc({...newDoc, experience: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full">Add Staff</Button>
            </form>
          </div>

          {/* Staff List */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-slate-700">Current Medical Staff ({doctors.length})</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Specialty</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Exp</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{doc.name}</td>
                      <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                        <Briefcase size={14} className="text-slate-400"/> {doc.specialty}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        <div className="flex items-center gap-1">
                           <Award size={14} className="text-orange-400"/> {doc.experience}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onRemoveDoctor(doc.id)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                          title="Remove Staff"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        No medical staff configured. Add one to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
         <div className="space-y-6">
           <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-2 text-blue-800 text-sm">
              <CheckCircle size={20} />
              <p>Doctors must approve meeting requests based on their surgical and on-call schedules.</p>
           </div>
           
           <h3 className="font-bold text-lg text-slate-700">Pending Requests ({pendingAppointments.length})</h3>
           
           {pendingAppointments.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
               <Calendar size={48} className="mx-auto text-slate-300 mb-2" />
               <p className="text-slate-500">No pending appointment requests at this time.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-4">
               {pendingAppointments.map(({patient, appt}) => (
                 <div key={`${patient.medicalCardId}-${appt.id}`} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h4 className="font-bold text-slate-800">{patient.name}</h4>
                       <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">ID: {patient.medicalCardId}</span>
                     </div>
                     <p className="text-slate-600">
                       Requesting <span className="font-semibold text-teal-700">{appt.doctorName}</span>
                     </p>
                     <p className="text-sm text-slate-500 flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {appt.date}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {appt.time}</span>
                     </p>
                   </div>
                   <div className="flex items-center gap-2 w-full md:w-auto">
                     <Button 
                       variant="secondary" 
                       onClick={() => handleReject(patient.medicalCardId, appt.id)}
                       className="border-red-200 text-red-700 hover:bg-red-50 w-full md:w-auto"
                     >
                       <XCircle size={18} /> Reject
                     </Button>
                     <Button 
                       onClick={() => handleApprove(patient.medicalCardId, appt.id)}
                       className="bg-teal-600 hover:bg-teal-700 w-full md:w-auto"
                     >
                       <CheckCircle size={18} /> Approve
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
      )}
    </div>
  );
};