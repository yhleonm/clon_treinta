import React, { useState } from 'react';
import { Sidebar, TabView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PosPage } from './pages/PosPage';
import { BalancePage } from './pages/BalancePage';
import { InventoryPage } from './pages/InventoryPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CreditPage } from './pages/CreditPage';
import { ContactsPage } from './pages/ContactsPage';
import { CashRegisterModal } from './components/caja/CashRegisterModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabView>('pos');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 antialiased">
      {/* Navigation Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenCashModal={() => setIsCashModalOpen(true)}
          onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        />

        {/* Dynamic View Rendering */}
        <main className="flex-1 flex overflow-hidden">
          {currentTab === 'pos' && (
            <PosPage onOpenExpenseModal={() => setIsExpenseModalOpen(true)} />
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
          {currentTab === 'credit' && <CreditPage />}
          {currentTab === 'contacts' && <ContactsPage />}
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
