# 최악고르기 월드컵

토너먼트 형식으로 "최악의 사람"을 가려내는 웹 월드컵입니다. 등록된 후보 수에 따라 가장 가까운 2의 거듭제곱 토너먼트로 자동 구성되며, 부족한 자리는 부전승으로 채워 모든 후보가 빠짐없이 출전합니다.

- 웹 + 모바일 반응형
- admin 비밀번호로 후보 추가 / 수정 / 삭제 (브라우저 쿠키 기반, 사용자별 격리)
- Upstash Redis(Vercel Marketplace)에 영구 저장 — 토너먼트 누적 순위 공유
- 로컬 개발 시 Redis가 없으면 `data/*.json` 파일로 fallback

## 로컬에서 실행

```bash
npm install
cp .env.example .env.local   # ADMIN_PASSWORD 를 원하는 값으로 수정
npm run dev
```

- 메인: <http://localhost:3000>
- 관리자: <http://localhost:3000/admin>

로컬 환경에서 Redis 환경변수가 비어 있으면 `data/local.json`, `data/scores.json`에 저장됩니다.

## Vercel 배포

1. 저장소를 GitHub에 push.
2. Vercel 대시보드 → **New Project** → 저장소 import.
3. 프로젝트 → **Storage** 탭 → **Marketplace**에서 **Upstash Redis** 통합 추가 후 프로젝트에 연결.
   - `KV_REST_API_URL`, `KV_REST_API_TOKEN` (또는 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) 가 자동 주입됩니다.
4. 프로젝트 → **Settings** → **Environment Variables**에서 `ADMIN_PASSWORD` 추가.
5. **Deploy** (또는 통합을 나중에 추가했다면 반드시 **Redeploy**) — 환경변수는 시작 시점에만 반영됩니다.

### "데이터 추가에 실패" 에러가 보일 때

- 프로젝트의 **Settings → Environment Variables** 에 다음 중 하나의 쌍이 모두 등록되어 있는지 확인:
  - `KV_REST_API_URL` + `KV_REST_API_TOKEN`
  - 또는 `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- 통합을 추가한 뒤 **반드시 Redeploy** (다시 배포) 해야 런타임에 반영됩니다.
- Vercel 서버리스 파일시스템은 read-only라 Redis가 연결되지 않으면 의도적으로 에러를 던집니다. 이때 관리자 화면에 정확한 원인이 메시지로 표시됩니다.

## 관리자 권한 동작 방식

- 관리자 로그인은 **각 브라우저의 httpOnly 쿠키**로 관리됩니다.
- 쿠키는 올바른 비밀번호를 입력한 사용자의 브라우저에만 발급됩니다.
- 다른 사용자가 같은 사이트에 접속해도 자기 브라우저에 쿠키가 없으므로 CRUD API는 401을 반환합니다.
- 즉 비밀번호를 모르는 사람은 절대 관리자 권한을 가질 수 없습니다.

## 폴더 구조

```
app/
  page.tsx                 # 메인 (시작 화면)
  play/                    # 토너먼트 진행
  admin/                   # 관리자 (로그인 + CRUD)
  api/
    items/route.ts         # 후보 CRUD
    scores/route.ts        # 결과 제출 + 누적 순위 조회
    admin/login/route.ts   # 비밀번호 로그인/로그아웃
lib/
  storage.ts               # Upstash Redis / 로컬 파일 추상화
  tournament.ts            # 강 계산, 부전승, 셔플
  auth.ts                  # 쿠키 기반 admin 세션
```
