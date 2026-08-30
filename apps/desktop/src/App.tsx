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
import { SettingsModal } from './components/settings/SettingsModal';
import { useAppStore } from './store/useAppStore';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { fetchUsuarioProfile } from './lib/supabase-auth';

export function App() {
  const { isAuthenticated, usuarioActual, syncWithSupabase, negocio } = useAppStore();
  const [currentTab, setCurrentTab] = useState<TabView>('pos');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const isAdmin = usuarioActual?.rol === 'administrador' || usuarioActual?.rol === 'propietario';

  // 1. Session check on initial mount
  useEffect(() => {
    async function bootstrapSync() {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchUsuarioProfile(session.user.id);
          if (profile.success && profile.data) {
            useAppStore.setState({
              isAuthenticated: true,
              negocio: profile.data.negocio,
              usuarioActual: profile.data.usuario,
            });
            await syncWithSupabase();
          }
        }
      } catch (err) {
        console.error('[App Bootstrap] Sync error:', err);
      }
    }

    bootstrapSync();

    const { data: authListener } = supabase?.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        useAppStore.setState({ isAuthenticated: false });
      }
    }) || { data: { subscription: null } };

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 2. Realtime listener for cross-device updates (Mobile <-> Desktop)
  useEffect(() => {
    let channel: any = null;
    if (isSupabaseConfigured && supabase && isAuthenticated && negocio?.id && negocio.id !== 'neg-triunfo-01') {
      channel = supabase
        .channel(`stockpro-sync-${negocio.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', filter: `negocio_id=eq.${negocio.id}` },
          () => {
            console.log('[Realtime] Change detected from another client, syncing...');
            syncWithSupabase();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [negocio?.id, isAuthenticated]);

  // If role changes to vendedor and current tab is restricted, redirect to pos
  useEffect(() => {
    if (!isAdmin && ['balance', 'expenses', 'credit', 'employees', 'invoicing', 'stats'].includes(currentTab)) {
      setCurrentTab('pos');
    }
  }, [isAdmin, currentTab]);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 antialiased">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

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

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}

export default App;
