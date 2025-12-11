import React from 'react';
import { LayoutDashboard, MessageSquare, Users, FileText, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  activeView: ViewState;
  onChangeView: (view: ViewState) => void;
  isLoggedIn: boolean; // True if either Patient or Admin is logged in
  isAdmin: boolean;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView, isLoggedIn, isAdmin, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Intake Chat', icon: MessageSquare },
  ];

  // Only show staff management to authenticated Admins
  if (isAdmin) {
    menuItems.push({ id: 'staff', label: 'Medical Staff', icon: Users });
  }

  // Show patient records only when logged in as a Patient
  if (isLoggedIn && !isAdmin) {
     menuItems.push({ id: 'patients', label: 'My Records', icon: FileText });
  }

  // Path to logo (static asset relative to index.html)
  const logoPath = "assets/images/logo.png";

  return (
    <div className="sidebar-container w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0 transition-all duration-300 print:hidden border-r border-slate-800">
      {/* Logo Area */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-900/50">
        <img 
          src={logoPath} 
          alt="CareFront AI" 
          className="w-10 h-10 object-contain"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.style.display = 'none'; 
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {/* Fallback Icon if image is missing */}
        <ShieldCheck size={32} className="text-teal-500 hidden" />
        
        <div className="flex flex-col">
           <span className="font-bold text-white text-lg leading-tight tracking-tight">CareFront AI</span>
           <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Intake System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-3 space-y-2">
        <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
        
        {menuItems.map((item) => {
          const isActive = activeView === item.id || (activeView === 'generating' && item.id === 'chat') || (activeView === 'report' && item.id === 'chat');
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-900/50">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors text-sm text-slate-400 hover:text-slate-200">
          <Settings size={18} />
          <span>Settings</span>
        </button>
        
        {isLoggedIn ? (
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        ) : (
          <button 
             onClick={() => onChangeView('login')}
             className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-all text-sm font-medium shadow-sm border border-slate-700"
          >
            <ShieldCheck size={18} />
            <span>Secure Login</span>
          </button>
        )}
      </div>

      {/* User Mini Profile */}
      <div className="p-4 bg-black/20">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner ${isAdmin ? 'bg-blue-600' : (isLoggedIn ? 'bg-teal-600' : 'bg-slate-700')}`}>
            {isAdmin ? 'AD' : (isLoggedIn ? 'PT' : 'GS')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">
              {isAdmin ? 'Administrator' : (isLoggedIn ? 'Patient' : 'Guest User')}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-slate-500 truncate">System Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};