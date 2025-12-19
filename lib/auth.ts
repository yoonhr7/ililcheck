import { supabase } from './supabase';
import { createUserProfile } from './supabase-api';
import type { User } from '@supabase/supabase-js';

/**
 * 아이디/비밀번호로 회원가입
 */
export async function signUpWithEmail(userId: string, email: string, password: string, username: string) {
  try {
    // 실제 이메일로 회원가입
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          user_id: userId,
          username: username,
          display_name: username,
        }
      }
    });

    if (signUpError) {
      console.error('회원가입 에러:', signUpError);
      throw signUpError;
    }

    if (!data.user) {
      console.error('회원가입 데이터:', data);
      throw new Error('회원가입에 실패했습니다.');
    }

    // 사용자 프로필 생성
    try {
      await createUserProfile({
        userId: data.user.id,
        username: userId,
        email: email || undefined,
        displayName: username,
        provider: 'email',
      });
    } catch (profileError: any) {
      console.error('프로필 생성 실패:', profileError);
      // Auth user is created but profile failed - still return success
      // User can login and profile will be created on next attempt
    }

    return { user: data.user, error: null };
  } catch (error: any) {
    let errorMessage = error.message;
    if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
      errorMessage = '이미 사용 중인 아이디입니다.';
    }
    return { user: null, error: errorMessage };
  }
}

/**
 * 이메일/비밀번호로 로그인
 * @param emailOrUserId - 이메일 주소 또는 userId
 */
export async function signInWithEmail(emailOrUserId: string, password: string) {
  try {
    // userId로 로그인하려는 경우, users 테이블에서 이메일을 조회
    let loginEmail = emailOrUserId;

    // @가 없으면 userId로 간주하고 이메일 조회
    if (!emailOrUserId.includes('@')) {
      const { data: profiles, error: profileError } = await supabase
        .from('users')
        .select('email')
        .eq('username', emailOrUserId)
        .single();

      if (profileError || !profiles) {
        throw new Error('존재하지 않는 아이디입니다.');
      }

      loginEmail = (profiles as any).email;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });

    if (signInError) {
      throw signInError;
    }

    if (!data.user) {
      throw new Error('로그인에 실패했습니다.');
    }

    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('로그인 실패:', error.message);
    let errorMessage = error.message;
    if (error.message?.includes('Invalid login credentials')) {
      errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
    }
    return { user: null, error: errorMessage };
  }
}

/**
 * 로그아웃
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Google 로그인
 */
export async function signInWithGoogle() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    return { user: null, error: null };
  } catch (error: any) {
    console.error('Google 로그인 실패:', error.message);
    return { user: null, error: error.message };
  }
}

/**
 * 인증 상태 변경 감지
 */
export function onAuthChange(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}

/**
 * 현재 사용자 가져오기
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
