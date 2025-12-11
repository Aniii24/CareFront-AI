import React, { useState } from 'react';
import { Button } from './Button';
import { CreditCard, User, LogIn, AlertCircle, Lock, Key, ShieldCheck } from 'lucide-react';
import { PatientLoginSchema, AdminLoginSchema, validateAdminCredentials } from '../services/securityService';

interface LoginViewProps {
  onLogin: (name: string, medicalCardId: string) => void;
  onAdminLogin: () => void;
  onCancel: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onAdminLogin, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'patient' | 'admin'>('patient');
  
  // Patient State
  const [name, setName] = useState('');
  const [medicalCardId, setMedicalCardId] = useState('');
  
  // Admin State
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  // Path to logo (static asset relative to index.html)
  const logoPath = "assets/images/logo.png";

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const result = PatientLoginSchema.safeParse({ name, medicalCardId });
    if (!result.success) {
      setError(result.error.errors[0]?.message || "Invalid input");
      return;
    }
    onLogin(name, medicalCardId);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = AdminLoginSchema.safeParse({ username: adminUser, password: adminPass });
    if (!result.success) {
      setError(result.error.errors[0]?.message || "Invalid input");
      return;
    }

    if (validateAdminCredentials(adminUser, adminPass)) {
      onAdminLogin();
    } else {
      setError("Invalid administrator credentials.");
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/[^\d-]/g, '');
    if (val.length > 11) return;
    setMedicalCardId(val);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={logoPath} 
              alt="CareFront AI Logo" 
              className="w-20 h-20 object-contain drop-shadow-md"
              onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback Icon */}
            <ShieldCheck size={80} className="text-teal-600 hidden mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">CareFront AI</h2>
          <p className="text-slate-500 text-sm mt-1">Secure Access Portal</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button 
            onClick={() => { setActiveTab('patient'); setError(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'patient' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Patient Login
          </button>
          <button 
             onClick={() => { setActiveTab('admin'); setError(null); }}
             className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'admin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Admin Login
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm mb-6 animate-fade-in">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Patient Form */}
        {activeTab === 'patient' && (
          <form onSubmit={handlePatientSubmit} className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Ex. Sarah Connor"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Medical Card ID</label>
              <div className="relative group">
                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <CreditCard size={18} />
                </div>
                <input
                  type="text"
                  value={medicalCardId}
                  onChange={handleIdChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="000-000-000"
                />
              </div>
            </div>

            <Button type="submit" className="w-full justify-center py-3 text-base shadow-lg shadow-teal-500/20">
              <LogIn size={20} /> Access Patient Portal
            </Button>
          </form>
        )}

        {/* Admin Form */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-6 animate-fade-in">
             <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Administrator ID</label>
              <div className="relative group">
                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Secure Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" className="w-full justify-center py-3 text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
              <Lock size={20} /> Authenticate Staff
            </Button>
          </form>
        )}

        <div className="mt-6">
          <Button type="button" variant="ghost" className="w-full text-slate-500 hover:text-slate-700" onClick={onCancel}>
             Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};