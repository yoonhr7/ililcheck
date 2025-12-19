-- anon 사용자(로그인하지 않은 사용자)가 username으로 email 조회할 수 있도록 허용
-- 이미 존재하는 정책이면 먼저 삭제
DROP POLICY IF EXISTS "Enable username lookup for anon" ON public.users;

-- anon 사용자도 users 테이블 읽기 가능
CREATE POLICY "Enable username lookup for anon"
  ON public.users
  FOR SELECT
  TO anon
  USING (true);

-- 확인: 모든 정책 조회
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';
