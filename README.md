# Pokemon Champions Assistant

포켓몬 챔피언스 배틀을 위한 전략 도우미 웹앱입니다.

## 주요 기능

- **파티 구성** — 6슬롯 로스터에 포켓몬 추가, 닉네임 / 특성 / 지닌도구 / 노력치 / 성격 / 기술 커스터마이징
- **조합 추천** — 상대 파티를 입력하면 타입 커버리지 · 역할 분담 · 속도를 고려한 최적 출전 조합 추천
- **내 조합 직접 선택** — 추천 없이 파티에서 직접 3 / 4마리를 골라 배틀로 이동
- **배틀 화면** — 상성 분석표, 상대 포켓몬 출전 선택, 대처 추천
- **전적 기록** — 승 / 패 / 무 + 메모 저장, 내 파티 · 출전 포켓몬 시각화
- **싱글 / 더블 모드** — 3마리(싱글) · 4마리(더블) 자동 적용

## 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| 프론트엔드 | Vue 3, Vite, Pinia, Vue Router, Tailwind CSS |
| 백엔드 | Node.js, Express |
| 데이터베이스 | MongoDB (Mongoose) |
| 인증 | JWT |
| 배포 | Vercel |

## 로컬 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 에 MONGODB_URI, JWT_SECRET 등 입력

# 개발 서버 실행 (Vite + Express 동시)
npm run dev
```

프론트엔드: `http://localhost:5173`  
API 서버: `http://localhost:3001`

## 환경 변수

| 변수명 | 설명 |
|--------|------|
| `MONGODB_URI` | MongoDB Atlas 연결 문자열 |
| `JWT_SECRET` | JWT 서명 비밀키 |
| `ANTHROPIC_API_KEY` | Claude API 키 (조합 추천용) |
| `VITE_API_BASE` | 프론트에서 사용할 API 경로 prefix (기본: `/api`) |

## 디렉토리 구조

```
├── api/          # Vercel 서버리스 함수 (라우트별 분리)
├── lib/          # DB 연결, 모델, 미들웨어 공통 모듈
├── src/
│   ├── components/   # 재사용 컴포넌트
│   ├── stores/       # Pinia 스토어
│   ├── views/        # 페이지 뷰
│   └── utils/        # 타입 상성 계산, 조합 추천 로직
├── scripts/      # 포켓몬 데이터 수집 스크립트
└── public/       # 정적 파일 (ads.txt 등)
```
