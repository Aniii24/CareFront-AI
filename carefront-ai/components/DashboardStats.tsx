import React from 'react';
import { Users, Activity, Clock, Calendar, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';
import { Doctor } from '../types';

interface DashboardStatsProps {
  doctors: Doctor[];
  onQuickAction: (action: string) => void;
  isAdmin: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ doctors, onQuickAction, isAdmin }) => {
  const availableDocs = doctors.filter(d => d.status === 'Available').length;
  
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hospital Overview</h2>
          <p className="text-slate-500">Real-time capacity and activity monitoring</p>
        </div>
        <div className="flex gap-2 text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
           <span className="w-2 h-2 bg-green-500 rounded-full my-auto animate-pulse"></span>
           System Operational
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
               <TrendingUp size={10} /> +12%
             </span>
           </div>
           <div>
             <h3 className="text-3xl font-bold text-slate-800">1,284</h3>
             <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Total Patients</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start">
             <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Activity size={20} /></div>
           </div>
           <div>
             <h3 className="text-3xl font-bold text-slate-800">{availableDocs} / {doctors.length}</h3>
             <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Doctors Available</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start">
             <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20} /></div>
             <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">High Traffic</span>
           </div>
           <div>
             <h3 className="text-3xl font-bold text-slate-800">14m</h3>
             <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Avg Wait Time</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={20} /></div>
           </div>
           <div>
             <h3 className="text-3xl font-bold text-slate-800">28</h3>
             <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Surgeries Today</p>
           </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        
        {/* Charts Section (Mocked visually) */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-lg text-slate-800">Patients Managed Today</h3>
             <div className="flex gap-2">
               <button className="text-xs font-medium text-slate-500 hover:text-slate-900">This Week</button>
             </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-4 px-2">
            {[65, 45, 75, 55, 85, 40, 60, 70, 90, 50, 65, 80].map((h, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden group-hover:bg-teal-50 transition-colors"
                  style={{ height: '200px' }}
                >
                  <div 
                    className="absolute bottom-0 w-full bg-teal-500 rounded-t-lg transition-all duration-500 ease-out group-hover:bg-teal-400"
                    style={{ height: `${h}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">0{i+8}:00</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-slate-900 text-white rounded-3xl shadow-lg p-6 flex flex-col">
          <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
          <p className="text-slate-400 text-sm mb-6">Manage triage and patient flow.</p>
          
          <div className="space-y-3">
             <button 
               onClick={() => onQuickAction('chat')}
               className="w-full flex items-center gap-4 bg-teal-600 hover:bg-teal-500 text-white p-4 rounded-xl transition-all shadow-lg shadow-teal-900/50 group"
             >
               <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors"><Activity size={20}/></div>
               <div className="text-left">
                 <span className="block font-bold">New Intake</span>
                 <span className="text-xs text-teal-100">Start AI Triage</span>
               </div>
             </button>

             {/* Only Administrators can access Staff Management */}
             {isAdmin ? (
               <button 
                 onClick={() => onQuickAction('staff')}
                 className="w-full flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition-all shadow-lg shadow-blue-900/30"
               >
                 <div className="bg-white/10 p-2 rounded-lg"><Users size={20}/></div>
                 <div className="text-left">
                   <span className="block font-bold">Manage Staff</span>
                   <span className="text-xs text-blue-100">View Roster & Schedules</span>
                 </div>
               </button>
             ) : (
                <div className="w-full flex items-center gap-4 bg-slate-800/50 text-slate-500 p-4 rounded-xl border border-slate-700/50 cursor-not-allowed">
                   <div className="bg-slate-800 p-2 rounded-lg"><ShieldAlert size={20}/></div>
                   <div className="text-left">
                     <span className="block font-bold text-sm">Staff Access Restricted</span>
                     <span className="text-xs text-slate-600">Admin login required</span>
                   </div>
                </div>
             )}
             
             <div className="mt-auto pt-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="text-red-500 shrink-0" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-red-400 uppercase">Emergency Protocol</h4>
                    <p className="text-xs text-red-200/80 mt-1">If patient reports chest pain, override AI and call 911 immediately.</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};