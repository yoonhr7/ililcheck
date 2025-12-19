import { supabase } from "./supabase";
import { Database } from "./database.types";

// 권한 레벨
export type UserRole = "master" | "manager" | "user";

interface UserInfoDisplay {
  id: string;
  userId: string;
  username: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  lastLoginAt: string;
  provider: string;
  role?: UserRole;
}

/**
 * 모든 사용자 정보 가져오기 (관리자 전용)
 */
export async function fetchAllUsers(): Promise<UserInfoDisplay[]> {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("사용자 목록 조회 실패:", error);
      return [];
    }

    return (users || []).map((user: any) => ({
      id: user.user_id,
      userId: user.username || "-",
      username: user.display_name || "-",
      email: user.email || null,
      displayName: user.display_name || null,
      createdAt: user.created_at
        ? new Date(user.created_at).toLocaleString("ko-KR")
        : "-",
      lastLoginAt: user.last_login_at
        ? new Date(user.last_login_at).toLocaleString("ko-KR")
        : "-",
      provider: user.provider || "unknown",
    }));
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error);
    return [];
  }
}

/**
 * 사용자의 역할 가져오기
 */
export async function getUserRole(id: string): Promise<UserRole> {
  try {
    // users 테이블에서 role 확인
    const { data: user, error } = await supabase
      .from("users")
      .select("role, email")
      .eq("user_id", id)
      .single<Database["public"]["Tables"]["users"]["Row"]>();

    if (error || !user) {
      return "user";
    }

    // Master 계정 확인 (환경변수)
    const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL;
    if (masterEmail && user.email === masterEmail) {
      return "master";
    }

    return (user.role as UserRole) || "user";
  } catch (error) {
    console.error("사용자 역할 확인 실패:", error);
    return "user";
  }
}

/**
 * 관리자 권한 확인 (Master 또는 Manager)
 */
export async function checkAdminStatus(id: string): Promise<boolean> {
  const role = await getUserRole(id);
  return role === "master" || role === "manager";
}

/**
 * Manager 권한 부여 (Master만 가능)
 */
export async function grantManagerRole(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("users")
      .update({ role: "manager" as const })
      .eq("user_id", id);

    if (error) {
      console.error("Manager 권한 부여 실패:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Manager 권한 부여 실패:", error);
    return false;
  }
}

/**
 * 권한 제거 (일반 사용자로 변경)
 */
export async function revokeAdminRole(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("users")
      .update({ role: "user" as const })
      .eq("user_id", id);

    if (error) {
      console.error("권한 제거 실패:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("권한 제거 실패:", error);
    return false;
  }
}

/**
 * 레거시 함수 호환성 유지
 */
export async function grantAdminAccess(id: string): Promise<boolean> {
  return grantManagerRole(id);
}

export async function revokeAdminAccess(id: string): Promise<boolean> {
  return revokeAdminRole(id);
}

export async function isUserAdmin(id: string): Promise<boolean> {
  return checkAdminStatus(id);
}

/**
 * 사용자 삭제 (Master만 가능)
 */
export async function deleteUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // users 테이블에서 삭제 (CASCADE로 auth.users도 삭제됨)
    const { error } = await supabase.from("users").delete().eq("user_id", id);

    if (error) {
      console.error("사용자 삭제 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("사용자 삭제 실패:", error);
    return { success: false, error: error.message };
  }
}
