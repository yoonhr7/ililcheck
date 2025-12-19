# Supabase 설정 가이드

## 1. 환경변수 설정

### 로컬 개발 환경
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Supabase Dashboard에서 값 가져오기:**
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. Settings → API 메뉴로 이동
4. **Project URL** 복사 → `NEXT_PUBLIC_SUPABASE_URL`에 붙여넣기
5. **Project API keys** → `anon` `public` 키 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 붙여넣기

## 2. Vercel 배포 설정

Vercel에 배포할 때 환경변수를 설정해야 합니다.

### Vercel Dashboard에서 설정
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. Settings → Environment Variables 이동
4. 다음 환경변수 추가:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
```

⚠️ **주의:**
- Production, Preview, Development 모두 체크
- 추가 후 반드시 **재배포** 필요

### Vercel CLI로 설정
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 값 입력 후 Enter

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# 값 입력 후 Enter
```

## 3. Supabase Auth 설정

### 이메일 확인 비활성화 (개발용)
개발 중에는 이메일 확인을 건너뛸 수 있습니다:

1. Supabase Dashboard → Authentication → Settings
2. **Email Auth** 섹션에서
3. "Enable email confirmations" 체크 해제

⚠️ **프로덕션에서는 반드시 활성화하세요!**

### Site URL 설정
1. Supabase Dashboard → Authentication → URL Configuration
2. **Site URL** 설정:
   - 로컬: `http://localhost:3000`
   - 프로덕션: `https://your-domain.com`
3. **Redirect URLs** 추가:
   - `http://localhost:3000/**`
   - `https://your-domain.com/**`

## 4. 데이터베이스 설정 확인

### RLS (Row Level Security) 확인
모든 테이블에 RLS가 활성화되어 있는지 확인:

```sql
-- Supabase SQL Editor에서 실행
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

모든 테이블의 `rowsecurity`가 `t` (true)여야 합니다.

### 정책 확인
```sql
-- 모든 정책 확인
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

각 테이블에 SELECT, INSERT, UPDATE, DELETE 정책이 있어야 합니다.

## 5. 보안 주의사항

### ⚠️ 절대 커밋하지 말 것
- `.env.local` 파일
- `SUPABASE_SERVICE_ROLE_KEY` (anon key가 아닌 service_role key)

### ✅ 안전하게 사용 가능
- `NEXT_PUBLIC_SUPABASE_URL` - 공개 가능
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 공개 가능 (RLS로 보호됨)

### 🔒 절대 노출 금지
- `SUPABASE_SERVICE_ROLE_KEY` - 서버 사이드에서만 사용
- 데이터베이스 직접 연결 정보

## 6. 로컬 테스트

### 환경변수 확인
```bash
# .env.local 파일이 있는지 확인
ls -la .env.local

# 내용 확인 (비밀번호 가려짐)
cat .env.local
```

### 개발 서버 실행
```bash
npm run dev
```

### 연결 테스트
브라우저 콘솔에서:

```javascript
// Supabase 클라이언트 연결 확인
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data);
console.log('Error:', error);
```

## 7. 배포 체크리스트

배포 전 확인사항:

- [ ] `.env.local` 파일 생성 및 환경변수 설정
- [ ] Vercel 환경변수 설정 완료
- [ ] Supabase 데이터베이스 마이그레이션 실행 완료
- [ ] RLS 정책 활성화 확인
- [ ] Site URL 설정 확인
- [ ] 로컬에서 회원가입/로그인 테스트 성공
- [ ] 로컬에서 프로젝트 CRUD 테스트 성공
- [ ] `.gitignore`에 `.env.local` 포함 확인

## 8. 트러블슈팅

### "Invalid API key" 오류
- 환경변수가 올바르게 설정되었는지 확인
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버 재시작 (환경변수 변경 시 필요)

### "User not authenticated" 오류
- 로그인이 되어 있는지 확인
- RLS 정책이 올바르게 설정되었는지 확인
- Supabase Dashboard에서 직접 쿼리 테스트

### "Email rate limit exceeded" 오류
- Supabase 무료 플랜은 시간당 이메일 발송 제한 있음
- 개발 중에는 이메일 확인 비활성화 권장

### Vercel 배포 후 작동 안 함
- Vercel 환경변수가 올바르게 설정되었는지 확인
- 환경변수 추가/수정 후 재배포했는지 확인
- Vercel 로그에서 에러 확인

## 9. 유용한 링크

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase 문서](https://supabase.com/docs)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

## 10. 추가 설정 (선택사항)

### 이메일 템플릿 커스터마이징
Supabase Dashboard → Authentication → Email Templates

### 비밀번호 정책 설정
Supabase Dashboard → Authentication → Settings → Password Policy

### Rate Limiting 설정
Supabase Dashboard → Authentication → Settings → Rate Limits
