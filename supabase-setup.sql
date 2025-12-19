-- ============================================
-- Supabase 데이터베이스 설정
-- ============================================

-- 1. users 테이블 생성 (이미 있으면 건너뜀)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  display_name TEXT,
  provider TEXT DEFAULT 'email',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read all" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.users;

-- 4. 새로운 RLS 정책 생성
-- 인증된 사용자는 자신의 프로필을 생성할 수 있음
CREATE POLICY "Enable insert for authenticated users only"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 모든 인증된 사용자는 모든 프로필을 읽을 수 있음 (username 기반 로그인을 위해)
CREATE POLICY "Enable read access for all authenticated users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- 사용자는 자신의 프로필만 업데이트할 수 있음
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. anon 사용자도 username 조회 가능하도록 (로그인 전 username으로 email 조회)
CREATE POLICY "Enable username lookup for anon"
  ON public.users
  FOR SELECT
  TO anon
  USING (true);

-- 6. 트리거 함수: 새 auth.user 생성 시 자동으로 users 테이블에 기본 레코드 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, username, email, display_name, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. 확인 쿼리
-- SELECT * FROM public.users;
-- SELECT id, email, raw_user_meta_data FROM auth.users;
