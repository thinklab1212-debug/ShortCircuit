import React from 'react';
import { FileText, Users, Package, Settings, PlusCircle, LogOut, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'invoices' | 'create' | 'customers' | 'products' | 'settings';
  setActiveTab: (tab: 'invoices' | 'create' | 'customers' | 'products' | 'settings') => void;
  invoiceCount?: number;
  authUser?: { email: string; name?: string; role?: string } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  invoiceCount = 0,
  authUser,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('invoices')}>
            <img
              src="/logo.png"
              alt="ShortCircuit Logo"
              className="h-9 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">ShortCircuit</span>
                <span className="bg-blue-100 text-blue-900 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Billing
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Smart Invoicing & GST Software</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-blue-50 text-blue-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Invoices</span>
              {invoiceCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs bg-slate-200 text-slate-700 rounded-full font-semibold">
                  {invoiceCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'bg-blue-50 text-blue-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-blue-50 text-blue-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Catalog & Kits</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            {/* Primary Action */}
            <button
              onClick={() => setActiveTab('create')}
              className="ml-2 flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white px-3.5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Invoice</span>
            </button>

            {/* User Profile Badge & Logout */}
            {authUser && (
              <div className="ml-3 pl-3 border-l border-slate-200 flex items-center space-x-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {authUser.name || 'Admin'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                    {authUser.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
