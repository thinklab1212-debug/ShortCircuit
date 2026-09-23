import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { InvoicesPage } from './pages/InvoicesPage';
import { CreateInvoicePage } from './pages/CreateInvoicePage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { WelcomePage } from './pages/WelcomePage';
import { IInvoice, API_BASE, api } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'create' | 'customers' | 'products' | 'settings'>('invoices');
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [unauthView, setUnauthView] = useState<'welcome' | 'login'>('welcome');
  const [authUser, setAuthUser] = useState<{ email: string; name?: string; role?: string } | null>(() => {
    const saved = localStorage.getItem('shortcircuit_billing_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('shortcircuit_billing_token');
    if (!token) {
      setAuthUser(null);
      setCheckingAuth(false);
      return;
    }

    // Verify token with backend
    api.get('/auth/me')
      .then((res) => {
        if (res.data.user) {
          setAuthUser(res.data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem('shortcircuit_billing_token');
        localStorage.removeItem('shortcircuit_billing_user');
        setAuthUser(null);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('shortcircuit_billing_token');
    localStorage.removeItem('shortcircuit_billing_user');
    setAuthUser(null);
    setUnauthView('welcome');
  };

  const handleInvoiceCreated = (invoice: IInvoice, downloadNow?: boolean) => {
    if (downloadNow && invoice._id) {
      window.open(`${API_BASE}/invoices/${invoice._id}/pdf`, '_blank');
    }
    setActiveTab('invoices');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-300">Loading ShortCircuit Billing...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    if (unauthView === 'login') {
      return (
        <LoginPage
          onLoginSuccess={(user) => setAuthUser(user)}
          onBackToWelcome={() => setUnauthView('welcome')}
        />
      );
    }
    return <WelcomePage onStartBilling={() => setUnauthView('login')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-[Inter,sans-serif]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        invoiceCount={invoiceCount}
        authUser={authUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'invoices' && (
          <InvoicesPage onCreateClick={() => setActiveTab('create')} />
        )}
        {activeTab === 'create' && (
          <CreateInvoicePage
            onInvoiceCreated={handleInvoiceCreated}
            onCancel={() => setActiveTab('invoices')}
          />
        )}
        {activeTab === 'customers' && <CustomersPage />}
        {activeTab === 'products' && (
          <ProductsPage
            onBillProduct={(prod) => {
              // Preload into invoice creator
              localStorage.setItem('shortcircuit_quick_bill_item', JSON.stringify(prod));
              setActiveTab('create');
            }}
          />
        )}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        ShortCircuit &bull; Dedicated Billing & Invoicing Software &bull; 2026
      </footer>
    </div>
  );
};

export default App;
