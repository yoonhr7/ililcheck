"use client";

import { useAuth } from "@/contexts/AuthContext";
import { checkAdminStatus } from "@/lib/admin";
import { logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { LogOut, MessageCircleHeart, MoreVertical, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./MainHeader.module.css";

export default function MainHeader() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState<string>("사용자");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        console.log('Current user:', user.email);
        console.log('Master email from env:', process.env.NEXT_PUBLIC_MASTER_EMAIL);

        // 관리자 권한 확인
        const adminStatus = await checkAdminStatus(user.id);
        console.log('Admin status:', adminStatus);
        setIsAdmin(adminStatus);

        // users 테이블에서 displayName 가져오기
        const { data, error } = await supabase
          .from('users')
          .select('display_name, username, role, email')
          .eq('user_id', user.id)
          .single();

        console.log('User data from DB:', data);

        if (data && !error) {
          setDisplayName(data.display_name || data.username || user.email?.split('@')[0] || "사용자");
        } else {
          // users 테이블에 없으면 user_metadata에서 가져오기
          setDisplayName(
            user.user_metadata?.display_name ||
            user.user_metadata?.username ||
            user.email?.split('@')[0] ||
            "사용자"
          );
        }
      }
    };
    loadUserData();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>ililcheck</h1>
      </div>

      <div className={styles.right}>
        <span className={styles.welcome}>
          <b>{displayName}</b> 님 환영합니다 <MessageCircleHeart className={styles.icon}/>
        </span>

        <div className={styles.menuContainer} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={styles.moreButton}
          >
            <MoreVertical className={styles.icon} />
          </button>

          {isMenuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownItem}>
                <span className={styles.emailLabel}>이메일</span>
                <span className={styles.emailValue}>
                  {user?.email || "없음"}
                </span>
              </div>

              <div className={styles.divider} />

              {isAdmin && (
                <Link
                  href="/admin"
                  className={styles.dropdownLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className={styles.dropdownIcon} />
                  관리자 페이지
                </Link>
              )}

              <Link
                href="/dashboard/settings"
                className={styles.dropdownLink}
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className={styles.dropdownIcon} />내 정보 수정
              </Link>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut className={styles.icon} />
          </button>
      </div>
    </header>
  );
}
