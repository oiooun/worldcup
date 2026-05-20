<<<<<<< HEAD
# 최악고르기 월드컵

토너먼트 형식으로 "최악의 사람"을 가려내는 웹 월드컵입니다. 등록된 후보 수에 따라 8강 / 16강 / 32강 등 가장 가까운 2의 거듭제곱으로 자동 구성됩니다.

- 웹 + 모바일 반응형
- admin 비밀번호로 후보 추가 / 수정 / 삭제
- Vercel KV(Upstash Redis)에 영구 저장 (없으면 로컬 JSON 파일로 fallback)

## 로컬에서 실행

```bash
npm install
cp .env.example .env.local   # ADMIN_PASSWORD 를 원하는 값으로 수정
npm run dev
```

- 메인: <http://localhost:3000>
- 관리자: <http://localhost:3000/admin>

로컬 환경에서 KV 환경변수가 비어 있으면 `data/local.json`에 저장됩니다.

## Vercel 배포

1. 이 디렉토리를 GitHub 등 Git 저장소에 push.
2. Vercel 대시보드에서 **New Project** → 저장소 import.
3. 프로젝트 설정 → **Storage** 탭 → Marketplace에서 **Upstash Redis** (구 Vercel KV) 통합 추가.
   - 환경변수 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 등이 자동 주입됩니다.
4. 프로젝트 설정 → **Environment Variables**:
   - `ADMIN_PASSWORD` = 원하는 관리자 비밀번호
5. Deploy.

## 폴더 구조

```
app/
  page.tsx                 # 메인 (강 선택)
  play/                    # 토너먼트 진행
  admin/                   # 관리자 (로그인 + CRUD)
  api/
    items/route.ts         # GET/POST/PUT/DELETE 후보
    admin/login/route.ts   # 비밀번호 로그인/로그아웃
lib/
  storage.ts               # KV/로컬 파일 추상화
  tournament.ts            # 강 계산, 셔플
  auth.ts                  # 쿠키 기반 admin 세션
```
=======
# worldcup
>>>>>>> 91b6156a93c0acfa1baa7538a6753e8f4480820d
