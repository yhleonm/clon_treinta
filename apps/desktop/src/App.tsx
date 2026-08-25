import React, { useState, useEffect } from 'react';
import { Sidebar, TabView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PosPage } from './pages/PosPage';
import { BalancePage } from './pages/BalancePage';
import { InventoryPage } from './pages/InventoryPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CreditPage } from './pages/CreditPage';
import { ContactsPage } from './pages/ContactsPage';
import { EmployeesPage } from './pages/EmployeesPage';
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
    if (!isAdmin && ['balance', 'expenses', 'credit', 'contacts', 'employees'].includes(currentTab)) {
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
          {currentTab === 'balance' && isAdmin && (
            <BalancePage
              onOpenCashModal={() => setIsCashModalOpen(true)}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
            />
          )}
          {currentTab === 'inventory' && <InventoryPage />}
          {currentTab === 'expenses' && isAdmin && (
            <ExpensesPage onOpenExpenseModal={() => setIsExpenseModalOpen(true)} />
          )}
          {currentTab === 'credit' && isAdmin && <CreditPage />}
          {currentTab === 'contacts' && isAdmin && <ContactsPage />}
          {currentTab === 'employees' && isAdmin && <EmployeesPage />}
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
