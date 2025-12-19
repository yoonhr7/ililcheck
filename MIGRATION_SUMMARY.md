# Firebase → Supabase 마이그레이션 완료

## 개요
프로젝트를 Firebase (Firestore + Auth)에서 Supabase (PostgreSQL + Auth)로 성공적으로 마이그레이션했습니다.

## 변경된 파일들

### 1. 새로 생성된 파일

#### 데이터베이스 관련
- `supabase/migrations/001_initial_schema.sql` - 전체 데이터베이스 스키마
- `lib/supabase.ts` - Supabase 클라이언트 설정
- `lib/database.types.ts` - TypeScript 타입 정의
- `lib/supabase-api.ts` - Supabase API 함수 구현

#### 인증 관련
- `app/auth/callback/route.ts` - OAuth 콜백 핸들러

#### 문서
- `supabase/README.md` - 마이그레이션 가이드
- `MIGRATION_SUMMARY.md` - 이 파일

### 2. 수정된 파일

#### API 레이어
- `lib/api.ts`
  - Firebase imports → Supabase imports로 변경
  - 모든 API 함수가 Supabase API를 호출하도록 수정
  - TaskGroup 관련 함수 deprecated 처리
  - `updateAllProjectStats()` deprecated (자동 트리거로 대체)

#### 인증
- `lib/auth.ts`
  - Firebase Auth → Supabase Auth로 완전히 교체
  - `signUpWithEmail()` - Supabase Auth 사용
  - `signInWithEmail()` - Supabase Auth 사용
  - `signInWithGoogle()` - OAuth 사용 (리다이렉션 방식)
  - `logout()` - Supabase Auth 사용
  - `getCurrentUser()` - 새로 추가

- `contexts/AuthContext.tsx`
  - Firebase User → Supabase User로 변경
  - `onAuthStateChanged` → `onAuthStateChange` 사용
  - 세션 기반 인증으로 변경

#### 환경설정
- `.env.example`
  - Firebase 관련 환경변수 제거
  - Supabase 환경변수만 유지

## 주요 변경사항

### 1. 데이터베이스 아키텍처

**이전 (Firebase Firestore - NoSQL):**
```
users/{userId}
  └─ projects/{projectId}
      └─ tasks/{taskId}
          └─ todos/{todoId}
```

**현재 (Supabase PostgreSQL - SQL):**
```sql
user_profiles (users 테이블)
projects (user_id FK)
tasks (user_id FK, project_id FK)
todos (user_id FK, task_id FK)
issues (user_id FK, project_id FK)
```

### 2. 보안 (Row Level Security)

모든 테이블에 RLS 정책 적용:
- 사용자는 자신의 데이터만 접근 가능
- `auth.uid()` 함수로 현재 사용자 확인
- INSERT, SELECT, UPDATE, DELETE 모두 보호

### 3. 자동화

**데이터베이스 트리거:**
1. `updated_at` 자동 업데이트
2. 프로젝트 통계 자동 계산 (completed_tasks, total_tasks, etc.)

**이전 방식:**
```typescript
// Firebase에서는 수동으로 통계 업데이트 필요
await updateProjectStats(projectId);
```

**현재 방식:**
```sql
-- 데이터베이스 트리거가 자동으로 처리
-- 코드에서 별도 처리 불필요
```

### 4. 타입 안정성

완전한 타입 안정성 확보:
- 데이터베이스 스키마 → TypeScript 타입 자동 생성
- API 함수의 모든 파라미터와 리턴 타입 정의
- 컴파일 타임에 타입 오류 감지

### 5. Deprecated 기능

**TaskGroup:**
- Supabase 마이그레이션과 함께 제거
- Task를 Project 아래에서 직접 관리
- 더 단순한 데이터 구조

## API 함수 변경사항

### 변경 없이 사용 가능한 함수
모든 API 함수의 시그니처는 동일하게 유지됩니다:

```typescript
// 프로젝트
fetchProjects(): Promise<Project[]>
createProject(project: Omit<Project, 'id'>): Promise<Project | null>
updateProject(projectId: string, updates: Partial<Project>): Promise<boolean>
deleteProject(projectId: string): Promise<boolean>

// 작업
fetchTasksByProject(projectId: string): Promise<Task[]>
createTask(task: Omit<Task, 'id'>): Promise<string | null>
updateTask(taskId: string, updates: Partial<Task>): Promise<boolean>
deleteTask(taskId: string): Promise<boolean>

// 할일
createTodo(todo: Omit<Todo, 'id'>): Promise<string | null>
updateTodo(todoId: string, updates: Partial<Todo>): Promise<boolean>
deleteTodo(todoId: string): Promise<boolean>
fetchTodayTodos(): Promise<Todo[]>
fetchAllTodos(): Promise<Todo[]>

// 이슈
fetchIssuesByProject(projectId: string): Promise<Issue[]>
createIssue(issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null>
updateIssue(issueId: string, updates: Partial<Issue>): Promise<boolean>
deleteIssue(issueId: string): Promise<boolean>
```

### Deprecated 함수
```typescript
fetchTaskGroups() // 빈 배열 반환
createTaskGroup() // null 반환
updateAllProjectStats() // 아무것도 하지 않음 (트리거가 처리)
```

## 인증 변경사항

### 회원가입
```typescript
// 이전 (Firebase)
signUpWithEmail(userId, email, password, username)

// 현재 (Supabase)
signUpWithEmail(userId, email, password, username)
// 시그니처는 동일, userId를 userId@ililcheck.internal로 변환하여 저장
```

### 로그인
```typescript
// 이전 (Firebase)
signInWithEmail(userId, password) // userId 또는 이메일

// 현재 (Supabase)
signInWithEmail(userId, password) // userId를 내부 이메일로 변환
```

✅ **변경 없음:** 로그인 UI는 그대로 "아이디"를 사용합니다.

### Google OAuth
Google OAuth는 제거되었습니다. 아이디/비밀번호 로그인만 지원합니다.

## 마이그레이션 체크리스트

### 완료된 항목 ✅
- [x] 데이터베이스 스키마 생성
- [x] Supabase 클라이언트 설정
- [x] 타입 정의 생성
- [x] API 함수 구현
- [x] API 래퍼 레이어 업데이트
- [x] 인증 컨텍스트 마이그레이션
- [x] 인증 함수 마이그레이션 (아이디 기반)
- [x] 환경변수 업데이트
- [x] Google OAuth 제거

### 해야 할 작업 ⏳
- [ ] `.env.local` 파일에 Supabase 환경변수 설정
- [ ] Vercel 환경변수 설정 (배포 시)
- [ ] Supabase Dashboard에서 이메일 확인 비활성화 (개발용)
- [ ] 기존 Firebase 데이터를 Supabase로 이전 (필요한 경우)
- [ ] 전체 기능 테스트

## 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 테스트 가이드

마이그레이션 완료 후 다음 순서로 테스트하세요:

1. **인증 테스트**
   - 새 계정 회원가입
   - 로그인/로그아웃
   - Google OAuth (설정한 경우)

2. **프로젝트 테스트**
   - 프로젝트 생성
   - 프로젝트 목록 확인
   - 프로젝트 수정
   - 프로젝트 삭제

3. **작업/할일 테스트**
   - 작업 생성
   - 할일 추가
   - 진행률 업데이트
   - 상태 변경

4. **통계 자동 업데이트 테스트**
   - 작업 완료 시 프로젝트 통계가 자동으로 업데이트되는지 확인

## 주의사항

1. **기존 Firebase 데이터**
   - Firebase에 저장된 데이터는 자동으로 이전되지 않습니다
   - 필요한 경우 별도의 마이그레이션 스크립트 작성 필요

2. **로그인 방식 변경**
   - 이제 로그인 시 이메일만 사용 가능
   - userId 기반 로그인은 지원하지 않음

3. **OAuth 리다이렉션**
   - Google 로그인 시 페이지 리다이렉션 발생
   - `/auth/callback` 경로로 콜백 처리

4. **데이터베이스 직접 접근**
   - Supabase Dashboard에서 SQL 쿼리 직접 실행 가능
   - 데이터베이스를 직접 확인하고 디버깅 가능

## 롤백 계획

만약 문제가 발생하면:

1. `.env.local`에서 Firebase 환경변수로 되돌리기
2. `lib/api.ts`의 imports를 Firebase로 변경
3. `contexts/AuthContext.tsx`를 이전 버전으로 복원
4. `lib/auth.ts`를 이전 버전으로 복원

Git을 사용하는 경우:
```bash
git revert <commit-hash>
```

## 성능 개선

Supabase 마이그레이션으로 인한 성능 개선:

1. **인덱스 최적화**
   - 자주 쿼리되는 컬럼에 인덱스 추가
   - `user_id`, `project_id`, `task_id` 등

2. **자동 트리거**
   - 애플리케이션 코드에서 통계 계산 제거
   - 데이터베이스 레벨에서 자동 처리

3. **타입 안정성**
   - 런타임 오류 감소
   - 컴파일 타임에 오류 감지

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
