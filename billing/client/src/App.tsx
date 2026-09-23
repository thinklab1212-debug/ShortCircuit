import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { InvoicesPage } from './pages/InvoicesPage';
import { CreateInvoicePage } from './pages/CreateInvoicePage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { SettingsPage } from './pages/SettingsPage';
import { IInvoice, API_BASE } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'create' | 'customers' | 'products' | 'settings'>('invoices');
  const [invoiceCount, setInvoiceCount] = useState(0);

  const handleInvoiceCreated = (invoice: IInvoice, downloadNow?: boolean) => {
    if (downloadNow && invoice._id) {
      // Trigger download
      window.open(`${API_BASE}/invoices/${invoice._id}/pdf`, '_blank');
    }
    setActiveTab('invoices');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-[Inter,sans-serif]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        invoiceCount={invoiceCount}
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
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        ShortCircuit &bull; Dedicated Billing & Invoicing Software &bull; 2026
      </footer>
    </div>
  );
};

export default App;
