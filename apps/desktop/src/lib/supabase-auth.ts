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

    // Instrumentación diagnóstica (Paso 2)
    console.log('=== [STOCKPRO DIAGNOSTIC LOG] ===');
    console.log('AUTH UID:', data.user.id);
    const { data: rpcResult, error: rpcError } = await supabase.rpc('auth_negocio_id');
    console.log('NEGOCIO_ID resuelto por RPC:', rpcResult, rpcError);
    
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
    let { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        negocio:negocios(*)
      `)
      .eq('id', authUserId)
      .maybeSingle();

    if (!data && !error) {
      // Intento alternativo en caso de esquema con columna auth_user_id
      const retry = await supabase
        .from('usuarios')
        .select(`
          *,
          negocio:negocios(*)
        `)
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      if (retry.data) {
        data = retry.data;
      }
    }

    console.log('FILA usuarios:', data, error);

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

export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase no configurado' };
  }

  try {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'https://clon-treinta-desktop.vercel.app';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al enviar correo de restablecimiento' };
  }
}

export async function updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase no configurado' };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar contraseña' };
  }
}
