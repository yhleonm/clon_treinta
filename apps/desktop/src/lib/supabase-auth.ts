import { supabase, isSupabaseConfigured } from './supabase';
import type { Usuario, Negocio } from '@treinta/shared';

export async function signUpNewBusiness(
  businessName: string,
  ownerName: string,
  email: string,
  password: string
): Promise<{ success: boolean; userId?: string; negocioId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: ownerName
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signUp');

    const userId = authData.user.id;

    // 2. Bootstrap negocio + usuario via SECURITY DEFINER RPC (bypasses RLS)
    const { data: bootstrapData, error: bootstrapError } = await supabase.rpc('bootstrap_negocio', {
      p_user_id: userId,
      p_nombre: businessName,
      p_owner_name: ownerName,
      p_email: email,
    });

    if (bootstrapError) throw bootstrapError;

    const negocioId = bootstrapData?.negocio_id;

    return { success: true, userId, negocioId };

  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error during sign up' };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from signIn');
    
    return { success: true, userId: data.user.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error during sign in' };
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error during sign out' };
  }
}

export async function getCurrentSession() {
  if (!supabase) {
    return null;
  }
  
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function fetchUsuarioProfile(
  authUserId: string
): Promise<{ success: boolean; data?: { usuario: Usuario; negocio: Negocio }; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        negocio:negocios(*)
      `)
      .eq('id', authUserId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Usuario not found');

    const usuarioData = { ...data };
    // Depending on whether Supabase returns an array for 1:1 join or a single object
    const negocioData = Array.isArray(data.negocio) ? data.negocio[0] : data.negocio;
    delete usuarioData.negocio;

    return { 
      success: true, 
      data: { 
        usuario: usuarioData as Usuario, 
        negocio: negocioData as Negocio 
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error fetching profile' };
  }
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  return supabase.auth.onAuthStateChange(callback);
}
