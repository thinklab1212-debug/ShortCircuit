import React from 'react';
import { ArrowRight, Receipt, Zap, PackageCheck, FileSpreadsheet, Sparkles } from 'lucide-react';

interface WelcomePageProps {
  onStartBilling: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStartBilling }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-[Inter,sans-serif] selection:bg-blue-600 selection:text-white">
      {/* Top Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[-60px] right-1/4 w-[450px] h-[450px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  ShortCircuit
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  Billing Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Enterprise GST Tax Invoicing System</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onStartBilling}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Start Billing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-blue-400 mb-8 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Fast, Compliant & Connected GST Invoicing</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            Smart Invoicing Built for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
              ShortCircuit
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-10">
            Generate pixel-perfect tax invoices with automated GST calculations, live MongoDB catalog sync, custom project kit breakdowns, and instant PDF downloads.
          </p>

          {/* Big CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onStartBilling}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-extrabold text-base rounded-2xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer border border-blue-400/30"
            >
              <span>Start Billing</span>
              <ArrowRight className="w-5 h-5 text-blue-200" />
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-700/80 transition group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">Auto Backward GST</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter gross inclusive prices directly from the store. Backwards tax rates and base taxable values are auto-computed instantly.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-700/80 transition group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">Project Kit Breakdown</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bill assembled robotics and IoT project kits with custom component and unit breakdowns neatly formatted on the bill PDF.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-700/80 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">Pixel-Perfect Tax Invoices</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compliant commercial GST invoices with supplier/buyer details, manual HSN codes, bank info, terms, and authorized company stamp.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} ShortCircuit Instruments. All rights reserved. Registered Tax Invoicing System.</p>
      </footer>
    </div>
  );
};
