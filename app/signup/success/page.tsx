'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import styles from './page.module.css';

export default function SignupSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userInfo, setUserInfo] = useState<{ userId: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserInfo() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // users 테이블에서 사용자 정보 가져오기
        const { data, error } = await supabase
          .from('users')
          .select('username, display_name')
          .eq('user_id', user.id)
          .single<Database['public']['Tables']['users']['Row']>();

        if (error || !data) {
          console.error('사용자 정보 로드 실패:', error);
          // 정보가 없어도 기본 정보는 표시
          setUserInfo({
            userId: user.email?.split('@')[0] || 'user',
            username: user.email || 'Unknown'
          });
        } else {
          setUserInfo({
            userId: data.username,
            username: data.display_name || data.username
          });
        }
      } catch (error) {
        console.error('Error loading user info:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    loadUserInfo();
  }, [router]);

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  const handleDashboardRedirect = () => {
    router.push('/dashboard/today');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <svg className={styles.successIcon} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className={styles.title}>회원가입 완료!</h1>
        <p className={styles.subtitle}>환영합니다, {userInfo?.username}님</p>

        <div className={styles.infoBox}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>로그인 아이디</span>
            <span className={styles.infoValue}>{userInfo?.userId}</span>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleDashboardRedirect}
            className={styles.primaryButton}
          >
            대시보드로 이동
          </button>
          <button
            onClick={handleLoginRedirect}
            className={styles.secondaryButton}
          >
            로그인 화면으로
          </button>
        </div>

        <p className={styles.note}>
          회원가입이 완료되었습니다. 이제 로그인하여 서비스를 이용하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}
