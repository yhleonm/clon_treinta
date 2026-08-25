import React, { useState, useEffect } from 'react';
import { Sidebar, TabView } from './components/layout/Sidebar';
import { PosPage } from './pages/PosPage';
import { BalancePage } from './pages/BalancePage';
import { InventoryPage } from './pages/InventoryPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CreditPage } from './pages/CreditPage';
import { ContactsPage } from './pages/ContactsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { InvoicingPage } from './pages/InvoicingPage';
import { StatsPage } from './pages/StatsPage';
import { QuotesPage } from './pages/QuotesPage';
import { OnlineStorePage } from './pages/OnlineStorePage';
import { AuthPage } from './pages/AuthPage';
import { CashRegisterModal } from './components/caja/CashRegisterModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { useAppStore } from './store/useAppStore';

export function App() {
  const { isAuthenticated, usuarioActual } = useAppStore();
  const [currentTab, setCurrentTab] = useState<TabView>('pos');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const isAdmin = usuarioActual?.rol === 'administrador' || usuarioActual?.rol === 'propietario';

  // If role changes to vendedor and current tab is restricted, redirect to pos
  useEffect(() => {
    if (!isAdmin && ['balance', 'expenses', 'credit', 'employees'].includes(currentTab)) {
      setCurrentTab('pos');
    }
  }, [isAdmin, currentTab]);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 antialiased">
      {/* Navigation Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Dynamic View Rendering */}
        <main className="flex-1 flex overflow-hidden">
          {currentTab === 'pos' && (
            <PosPage
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
              onOpenCashModal={() => setIsCashModalOpen(true)}
            />
          )}
          {currentTab === 'balance' && (
            <BalancePage
              onOpenCashModal={() => setIsCashModalOpen(true)}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
            />
          )}
          {currentTab === 'inventory' && <InventoryPage />}
          {currentTab === 'expenses' && (
            <ExpensesPage onOpenExpenseModal={() => setIsExpenseModalOpen(true)} />
          )}
          {currentTab === 'invoicing' && <InvoicingPage />}
          {currentTab === 'stats' && <StatsPage />}
          {currentTab === 'quotes' && <QuotesPage />}
          {currentTab === 'store' && <OnlineStorePage />}
          {currentTab === 'credit' && <CreditPage />}
          {currentTab === 'contacts' && <ContactsPage />}
          {currentTab === 'employees' && <EmployeesPage />}
        </main>
      </div>

      {/* Global Modals */}
      <CashRegisterModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
    </div>
  );
}

export default App;
