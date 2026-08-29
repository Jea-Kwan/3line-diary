# 세줄일기

사진 한 장과 세 줄로 하루를 남기는 PWA. 모든 기록은 기기 안(IndexedDB)에만 저장되고 서버로 나가지 않습니다.

## 화면

| 탭 | 하는 일 |
| --- | --- |
| 오늘 | 오늘 날짜의 일기를 쓰고 고친다 |
| 달력 | 월 단위로 기록한 날을 한눈에 보고, 지난 날짜를 눌러 채워 넣는다 |
| 목록 | 최신순 목록에서 썸네일과 첫 줄을 본다 |
| 책만들기 | 원하는 날짜를 골라 인쇄하거나 PDF로 저장한다 |
| 백업 | 사진까지 담은 JSON 파일로 내보내고, 다시 가져온다 |

## 개발

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest, 59개
npm run build    # 타입 검사 + dist/ 빌드
```

`npm run dev`는 `host: true`라 같은 Wi-Fi의 폰에서 `http://<PC의 IP>:5173`으로도 열립니다.
다만 홈 화면 설치(PWA)는 HTTPS에서만 되므로, 실제로 폰에 설치하려면 아래처럼 배포해야 합니다.

## 폰에 설치하기

### 1단계 — 웹에 올리기

빌드 결과인 `dist/` 폴더만 있으면 되는 정적 사이트입니다. 셋 중 하나를 고르세요.

**A. Netlify Drop — 가장 빠름 (계정만 있으면 1분)**

1. `npm run build`
2. <https://app.netlify.com/drop> 접속
3. `dist` 폴더를 브라우저 창에 끌어다 놓기
4. `https://무작위이름.netlify.app` 주소가 바로 나옵니다

다음부터는 같은 사이트의 *Deploys* 화면에 `dist`를 다시 끌어다 놓으면 갱신됩니다.

**B. GitHub Pages — 커밋하면 자동 배포 (권장)**

이 저장소에는 이미 워크플로([.github/workflows/deploy.yml](.github/workflows/deploy.yml))가 들어 있습니다.

```bash
gh repo create 3line-diary --private --source=. --push
```

그다음 GitHub 저장소에서 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꾸면 끝입니다.
이후 `main`에 push할 때마다 테스트를 돌리고 빌드해서 `https://<아이디>.github.io/3line-diary/`에 올립니다.

> 비공개 저장소의 Pages는 유료 플랜에서만 됩니다. 무료 계정이면 `--private` 대신 `--public`을 쓰세요.

**C. Vercel**

```bash
npx vercel --prod
```

프레임워크는 Vite, 출력 폴더는 `dist`로 잡으면 됩니다.

### 2단계 — 홈 화면에 추가

배포된 주소(`https://...`)를 폰에서 열고:

- **아이폰 (Safari)**: 아래 공유 버튼 → **홈 화면에 추가** → 추가
  - 크롬이 아니라 반드시 **Safari**로 열어야 합니다.
- **안드로이드 (Chrome)**: 오른쪽 위 ⋮ → **앱 설치** 또는 **홈 화면에 추가**

추가하면 주소창 없는 앱처럼 열리고, 비행기 모드에서도 켜집니다. 사진 추가를 누르면 카메라가 바로 열립니다.

## 알아둘 점

- **일기는 그 브라우저 안에만 있습니다.** 폰을 바꾸거나 브라우저 데이터를 지우면 사라집니다. 가끔 **백업 → 백업 파일 내려받기**로 파일을 받아 두세요. 새 기기에서는 **백업 파일 불러오기**로 그대로 복원됩니다.
- 아이폰에서 홈 화면 앱과 Safari는 저장 공간을 공유하지 않습니다. 설치한 다음에는 홈 화면 아이콘으로만 쓰세요.
- 사진은 긴 변 1200px, JPEG 품질 0.8로 줄여 저장합니다.
- `base: './'`로 빌드하므로 도메인 루트든 `/저장소이름/` 하위 경로든 그대로 동작합니다.

## 구조

```
src/
  components/   PhotoPicker, LineInputs, NavBar
  db/           IndexedDB 저장소 (날짜가 키)
  pages/        Today, Calendar, List, EntryEdit, BookExport, Backup
  utils/        date, calendar, image, backup
  test/         테스트 환경 준비(setup)
```
