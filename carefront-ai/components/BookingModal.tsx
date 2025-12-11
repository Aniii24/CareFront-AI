import React, { useState } from 'react';
import { Doctor } from '../types';
import { Button } from './Button';
import { Calendar, Clock, CheckCircle, X, ShieldAlert } from 'lucide-react';

interface BookingModalProps {
  doctor: Doctor;
  onConfirm: (date: string, time: string) => void;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ doctor, onConfirm, onClose }) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Generate some dummy slots
  const slots = [
    { id: '1', label: 'Tomorrow, 9:00 AM' },
    { id: '2', label: 'Tomorrow, 2:30 PM' },
    { id: '3', label: 'Friday, 10:15 AM' },
    { id: '4', label: 'Friday, 4:00 PM' },
  ];

  const handleConfirm = () => {
    if (selectedSlot) {
      const slot = slots.find(s => s.id === selectedSlot);
      if (slot) onConfirm(slot.label.split(',')[0], slot.label.split(',')[1]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-teal-600 p-6 text-white flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">Request Appointment</h3>
            <p className="text-teal-100 text-sm mt-1">with {doctor.name}</p>
          </div>
          <button onClick={onClose} className="text-teal-100 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
             <div className="bg-white p-2 rounded-full shadow-sm text-teal-600">
               <Calendar size={20} />
             </div>
             <div>
               <p className="text-xs font-bold uppercase text-slate-400">Specialty</p>
               <p className="font-semibold">{doctor.specialty}</p>
             </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-2">
            <ShieldAlert size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              Note: This is a request. You will receive a confirmation once the doctor's office reviews your case status.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Available Time Slots</label>
            <div className="grid grid-cols-1 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group ${
                    selectedSlot === slot.id 
                      ? 'border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500' 
                      : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock size={16} className={selectedSlot === slot.id ? 'text-teal-600' : 'text-slate-400'} />
                    <span className="font-medium">{slot.label}</span>
                  </div>
                  {selectedSlot === slot.id && <CheckCircle size={18} className="text-teal-600" />}
                </button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleConfirm} 
            disabled={!selectedSlot} 
            className="w-full justify-center py-3"
          >
            Send Request
          </Button>
        </div>
      </div>
    </div>
  );
};