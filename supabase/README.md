# Supabase 데이터베이스 설정 가이드

## 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com) 에서 새 프로젝트 생성
2. 프로젝트 설정에서 아래 정보 확인:
   - Project URL
   - anon/public API key

## 2. 환경변수 설정

`.env.local` 파일에 다음 내용 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. 데이터베이스 마이그레이션 실행

### 방법 1: Supabase Dashboard 사용 (권장)

1. Supabase Dashboard → SQL Editor 이동
2. `migrations/001_initial_schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기 후 실행

### 방법 2: Supabase CLI 사용

```bash
# Supabase CLI 설치
npm install -g supabase

# Supabase 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

## 4. 테이블 구조

### user_profiles
- 사용자 프로필 정보
- Firebase Auth UID와 연동

### projects
- 프로젝트 정보
- 개인/업무 카테고리 구분
- 진행률, 남은 일수 자동 계산

### tasks
- 프로젝트별 작업 관리
- 상태: todo, in_progress, completed, on_hold
- 진행률 추적

### todos
- 작업별 할일 관리
- 상태: todo, in_progress, completed, on_hold, postponed
- 날짜별 추적

### issues
- 프로젝트 이슈 관리
- 우선순위: low, medium, high, critical
- 상태 추적

## 5. Row Level Security (RLS)

모든 테이블에 RLS가 활성화되어 있습니다:
- 사용자는 자신의 데이터만 조회/수정/삭제 가능
- `auth.uid()`를 통한 인증 확인

## 6. 자동 트리거

### updated_at 자동 업데이트
모든 테이블의 `updated_at` 컬럼이 UPDATE 시 자동으로 현재 시간으로 업데이트됩니다.

### 프로젝트 통계 자동 계산
- 작업(tasks) 생성/수정/삭제 시 프로젝트의 `total_tasks`, `completed_tasks` 자동 업데이트
- 할일(todos) 생성/수정/삭제 시 프로젝트의 `total_todos`, `completed_todos` 자동 업데이트

## 7. 인덱스

성능 최적화를 위한 인덱스:
- `user_id` 컬럼 (모든 테이블)
- `project_id`, `task_id` 등 외래키 컬럼
- `status`, `category` 등 필터링에 자주 사용되는 컬럼

## 8. 완료된 마이그레이션 항목

✅ 데이터베이스 스키마 생성 (`migrations/001_initial_schema.sql`)
✅ Supabase 클라이언트 설정 (`lib/supabase.ts`)
✅ 데이터베이스 타입 정의 (`lib/database.types.ts`)
✅ Supabase API 함수 구현 (`lib/supabase-api.ts`)
✅ API 래퍼 레이어 업데이트 (`lib/api.ts`)
✅ 인증 컨텍스트 마이그레이션 (`contexts/AuthContext.tsx`)
✅ 인증 함수 마이그레이션 (`lib/auth.ts`)
✅ 아이디 기반 로그인 구현 (userId@ililcheck.internal 형식)
✅ 환경변수 설정 업데이트 (`.env.example`)

## 9. 인증 방식

**아이디/비밀번호 로그인:**
- 사용자가 입력한 아이디를 `userId@ililcheck.internal` 형식으로 변환
- Supabase Auth에 내부 이메일로 저장
- 실제 이메일은 user_profiles 테이블과 메타데이터에 저장
- Google OAuth는 사용하지 않음

## 10. 애플리케이션 테스트

마이그레이션 완료 후 다음 기능들을 테스트:

1. **회원가입/로그인**
   - 이메일/비밀번호 회원가입
   - 이메일/비밀번호 로그인
   - Google OAuth 로그인
   - 로그아웃

2. **프로젝트 관리**
   - 프로젝트 생성
   - 프로젝트 목록 조회
   - 프로젝트 수정
   - 프로젝트 삭제

3. **작업 관리**
   - 작업 생성
   - 작업 목록 조회
   - 작업 진행률 업데이트
   - 작업 삭제

4. **할일 관리**
   - 할일 생성
   - 할일 상태 변경
   - 할일 삭제

5. **이슈 관리**
   - 이슈 생성
   - 이슈 목록 조회
   - 이슈 수정
   - 이슈 삭제

## 11. 주의사항

⚠️ **Firebase에서 Supabase로 데이터 마이그레이션이 필요한 경우:**
- Firebase Firestore의 기존 데이터를 Supabase PostgreSQL로 이전해야 합니다.
- 별도의 마이그레이션 스크립트가 필요할 수 있습니다.

⚠️ **TaskGroup 기능 deprecated:**
- Supabase 마이그레이션과 함께 TaskGroup 기능이 제거되었습니다.
- 이제 Task는 Project 아래에서 직접 관리됩니다.

⚠️ **프로젝트 통계 자동 업데이트:**
- Firebase에서는 수동으로 통계를 업데이트했지만, Supabase에서는 데이터베이스 트리거를 통해 자동으로 업데이트됩니다.
- `updateAllProjectStats()` 함수는 더 이상 필요하지 않습니다.
