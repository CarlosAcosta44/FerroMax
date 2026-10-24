import { supabase } from '@/infrastructure/db/supabaseClient';
import { IAuthRepository, SignUpDTO, SignInDTO, AuthSession } from '@/domain/repositories/IAuthRepository';
import { UserProfile, UserRole } from '@/domain/entities/UserProfile';

export class SupabaseAuthRepository implements IAuthRepository {
  async signUp(dto: SignUpDTO): Promise<{ user: any; profile: UserProfile }> {
    const { email, password, fullName, phone } = dto;
    // Every new user account always defaults to 'cliente'
    const role: UserRole = 'cliente';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
          role: 'cliente',
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('Este correo electrónico ya está registrado. Intenta iniciar sesión.');
      }
      throw new Error(error.message || 'Error al crear la cuenta en FerroMax');
    }

    if (!data.user) {
      throw new Error('No se pudo completar el registro.');
    }

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || email,
      fullName: fullName,
      phone: phone || '',
      role: 'cliente',
      createdAt: data.user.created_at,
    };

    // Ensure public.profiles table has the record as 'cliente'
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email || email,
        full_name: fullName,
        phone: phone || '',
        role: 'cliente',
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Note: Profile table upsert skipped or managed by DB trigger:', e);
    }

    return { user: data.user, profile };
  }

  async signIn(dto: SignInDTO): Promise<{ user: any; profile: UserProfile }> {
    const { email, password } = dto;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Por favor confirma tu correo electrónico antes de ingresar.');
      }
      throw new Error(error.message || 'Error al iniciar sesión.');
    }

    if (!data.user) {
      throw new Error('No se encontró información del usuario.');
    }

    const profile = await this.getProfile(data.user.id, data.user);
    return { user: data.user, profile };
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  }

  async getCurrentSession(): Promise<AuthSession> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        return { user: null, profile: null };
      }

      const profile = await this.getProfile(session.user.id, session.user);
      return {
        user: {
          id: session.user.id,
          email: session.user.email || '',
        },
        profile,
      };
    } catch (err) {
      console.error('Error getting current session:', err);
      return { user: null, profile: null };
    }
  }

  async getProfile(userId: string, userAuthObject?: any): Promise<UserProfile> {
    try {
      // Primary source of truth: public.profiles managed in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name || '',
          phone: data.phone || '',
          role: (data.role as UserRole) === 'admin' ? 'admin' : 'cliente',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Profiles table query error, falling back to auth metadata:', e);
    }

    // Fallback if table is not yet migrated
    let role: UserRole = 'cliente';
    let fullName = 'Usuario FerroMax';
    let phone = '';
    let email = '';

    if (userAuthObject) {
      email = userAuthObject.email || '';
      fullName = userAuthObject.user_metadata?.full_name || email.split('@')[0];
      phone = userAuthObject.user_metadata?.phone || '';
      if (userAuthObject.user_metadata?.role === 'admin') {
        role = 'admin';
      }
    }

    return {
      id: userId,
      email,
      fullName,
      phone,
      role,
    };
  }
}
