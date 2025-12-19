import { supabase } from './supabase';
import { createUserProfile, updateUserProfile } from './supabase-api';
import type { User } from '@supabase/supabase-js';

/**
 * userId를 내부 이메일 형식으로 변환
 * Supabase Auth는 이메일을 사용하므로 userId@ililcheck.internal 형식으로 저장
 */
function userIdToInternalEmail(userId: string): string {
  return `${userId}@ililcheck.internal`;
}

/**
 * 아이디/비밀번호로 회원가입
 */
export async function signUpWithEmail(userId: string, email: string, password: string, username: string) {
  try {
    // userId를 내부 이메일 형식으로 변환
    const internalEmail = userIdToInternalEmail(userId);

    // Supabase Auth로 회원가입
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: internalEmail,
      password: password,
      options: {
        data: {
          username: username,
          display_name: username,
          actual_email: email,
        }
      }
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!data.user) {
      throw new Error('회원가입에 실패했습니다.');
    }

    // 사용자 프로필 생성
    await createUserProfile({
      userId: data.user.id,
      username: userId,
      email: email || null,
      displayName: username,
      provider: 'email',
    });

    return { user: data.user, error: null };
  } catch (error: any) {
    let errorMessage = error.message;
    if (error.message?.includes('already registered')) {
      errorMessage = '이미 사용 중인 아이디입니다.';
    }
    return { user: null, error: errorMessage };
  }
}

/**
 * 아이디/비밀번호로 로그인
 */
export async function signInWithEmail(userId: string, password: string) {
  try {
    // userId를 내부 이메일 형식으로 변환
    const internalEmail = userIdToInternalEmail(userId);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: internalEmail,
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
 * 현재 사용자 가져오기
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
