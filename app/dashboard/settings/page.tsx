'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { updateUserProfile } from '@/lib/supabase-api';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface UserProfile {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  provider: string;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 폼 상태
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.error('프로필 로드 실패:', error);
        setError('프로필을 불러올 수 없습니다.');
        return;
      }

      const userProfile: UserProfile = {
        userId: data.user_id,
        username: data.username || '',
        email: data.email || user.email || '',
        displayName: data.display_name || '',
        provider: data.provider || 'email',
        createdAt: new Date(data.created_at).toLocaleDateString('ko-KR'),
      };

      setProfile(userProfile);
      setDisplayName(userProfile.displayName);
      setEmail(userProfile.email);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!displayName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      const updated = await updateUserProfile({
        displayName: displayName.trim(),
        email: email.trim(),
      });

      if (updated) {
        setSuccess('프로필이 업데이트되었습니다.');
        await loadUserProfile();
      } else {
        setError('프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      setError('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const { error } = await logout();
    if (error) {
      setError('로그아웃에 실패했습니다.');
      return;
    }
    router.push('/login');
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>프로필을 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          뒤로가기
        </button>
        <h1 className={styles.title}>내 정보</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>계정 정보</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>로그인 아이디</span>
              <span className={styles.infoValue}>{profile.userId}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>가입일</span>
              <span className={styles.infoValue}>{profile.createdAt}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>로그인 방법</span>
              <span className={styles.infoValue}>
                {profile.provider === 'google' ? 'Google' : '이메일'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className={styles.section}>
          <h2 className={styles.sectionTitle}>프로필 수정</h2>

          <div className={styles.formGroup}>
            <label className={styles.label}>이름 (닉네임)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              placeholder="홍길동"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="email@example.com"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? '저장 중...' : '변경사항 저장'}
          </button>
        </form>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>계정 관리</h2>
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
