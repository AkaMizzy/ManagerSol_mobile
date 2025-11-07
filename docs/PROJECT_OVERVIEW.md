## ManagerSol Mobile (Expo) — Project Overview


### Routing and Navigation
- File-based routing under `app/` with `expo-router`.
- Entry layout: `app/_layout.tsx`
  - Provides: `GestureHandlerRootView`, `SafeAreaProvider`, `AuthProvider`, theme provider (dark/light), `AuthWrapper`, and a `Stack` with screens: `(auth)`, `(tabs)`, `+not-found`.
- Auth gate: `app/index.tsx`
  - Redirects to `/(tabs)` when authenticated or to `/(auth)/login` when not; shows `LoadingScreen` while loading.
- Auth group: `app/(auth)/_layout.tsx` defines a `Stack` with hidden headers and white background for `login` and `Register`.
- Tabs group: `app/(tabs)/_layout.tsx` defines a `Tabs` navigator. The tab bar is hidden (`display: 'none'`); routes include `manifolder`, `declaration`, `audit`, `echantillon`, `inventaire`, and `parametre`.

### Authentication
- Context: `contexts/AuthContext.tsx`
  - Persists `token` and `user` in `AsyncStorage` keys `auth_token` and `auth_user`.
  - Initializes auth state on mount; sets axios auth header via `setAuthToken`.
  - Exposes: `login`, `register`, `signInWithGoogle`, `logout`, `updateUser`, `completePostLoginLoading`.
  - Login endpoint: `POST /auth/login` (accepts roles `user` or `admin` for app access).
  - Register endpoints: `POST /auth/register/detailed` (multipart) or `POST /auth/register/simple`.
- UI: `app/(auth)/login.tsx`, `app/(auth)/Register.tsx` (and `Oldregister.tsx`).
- Wrapper: `components/AuthWrapper.tsx` used in root layout.

### API Configuration
- `app/config/api.ts` defines `API_CONFIG.BASE_URL`.
  - Current value: `https://back.muntadaa.online` (alternative commented local/dev URL present).
- Services use a shared API client (`services/api.ts`) and feature-specific service modules.

### Services (`services/`)
- `api.ts`: shared HTTP client and auth token setter.
- Feature services:
  - `aiService.ts`, `calendarService.ts`, `companyService.ts`, `declarationService.ts`, `inventaireService.ts`, `manifolderService.ts`, `projectService.ts`, `qualiphotoService.ts`, `userService.ts`.

### Types (`types/`)
- Domain models: `company.ts`, `declaration.ts`, `manifolder.ts`, `user.ts`.

### Constants (`constants/`)
- `Calendar.ts`, `Colors.ts`, `Icons.ts` (includes `ICONS_ASSETS` map used for preloading icons in the root layout).


### Components (`components/`)
- Navigation/UI: `AppHeader.tsx`, `CustomTabBar.tsx`, `ThemedText.tsx`, `ThemedView.tsx`, `ExternalLink.tsx`, `HapticTab.tsx`, `HelloWave.tsx`, `ui/*`.
- Auth/UI: `AuthWrapper.tsx`, `ForgotPasswordModal.tsx`, `CustomAlert.tsx`, `LoadingScreen.tsx`.
- Domain UI: Manifolder/Declaration/QualiPhoto/Inventory/Projects/Zones etc.:
  - Creation/Editing: `CreateManifolderModal.tsx`, `CreateDeclarationModal.tsx`, `CreateInventaireModal.tsx`, `CreateProjectModal.tsx`, `CompanyEditModal.tsx`, `CreateUserModal.tsx`, `UpdateUserComp.tsx`, `QualiPhotoEditModal.tsx`, `QualiPhotoFilterModal.tsx`.
  - Viewing/Details: `ManifoldDetails.tsx`, `DeclarationCard.tsx`, `DeclarationDetailsModal.tsx`, `ProjectDetailModal.tsx`, `UserDetailModal.tsx`, `ZoneDetailModal.tsx`, `ZoneInventaireViewer.tsx`, `ZoneList.tsx`.
  - Media/Inputs: `PhotoCard.tsx`, `PhotoActions.tsx`, `ImageCarousel.tsx`, `SignatureField.tsx`, `SignatureFieldQualiphoto.tsx`, `FileUploader.tsx`, `MapSelector.tsx`, `PictureAnnotator.tsx`.
  - Workflows/Utilities: `QuestionAccordion.tsx`, `ManifolderQuestions.tsx`, `AnswersPreviewModal.tsx`, `AnsweredQuestionsCounter.tsx`, `CalendarComp.tsx`, `CalendarStrip.tsx`, `CreateCalendarEventModal.tsx`, `DayEventsModal.tsx`, `EventDetailsModal.tsx`, `FloatingActionButton.tsx`, `TaskCard.tsx`, `ComparisonModal.tsx`, `PreviewModal.tsx`.
  - Misc screens: `ComingSoonScreen.tsx`, `ConstructionLoadingScreen.tsx`, `RecentQualiphotos.tsx`, `ChatModal.tsx`, `ParallaxScrollView.tsx`.

### Screens (`app/(tabs)/*`)
- Implemented tab routes: `manifolder.tsx`, `declaration.tsx`, `audit.tsx`, `echantillon.tsx`, `inventaire.tsx`, `parametre.tsx`, plus other screens: `company.tsx`, `users.tsx`, `projects.tsx`, `planning.tsx`, `profile.tsx`, `tasks.tsx`, `qualiphoto.tsx`, `index.tsx`, and `change-password.tsx`.

### Assets (`assets/`)
- Fonts: `fonts/SpaceMono-Regular.ttf`
- Images: `images/*`, icons in `icons/*` (PNG/GIF). Android resources exist under `android/app/src/main/res`.

### Scripts and Utilities (`scripts/`)
- `reset-project.js`: helper to reset the starter app structure.

### Docs (`docs/`)
- Feature documentation present, including: `AUTH_README.md`, `LOGIN_UI_README.md`, `DECLARATION_FRONTEND_README.md`, `INVENTAIRE_FEATURE_IMPLEMENTATION.md`, `MANIFOLDER_DETAIL_IMPLEMENTATION.md`, `MANIFOLDER_DECLARATION_LINKING.md`, `PDF_Generation_System_Documentation.md`, `PREVIEW_MECHANISM_IMPLEMENTATION.md`, `TABBAR_README.md`, `PROJECT_SUMMARY.md`, `qualiphoto.md`, `TODAYS_WORK_SUMMARY.md`, `voice-to-text-transcription.md`.

### Android Project (`android/`)
- Native Android project is present (Gradle config, keystores, resources). Android build outputs are included under `android/app/build`.

### Entry Points
- `package.json` — name, entry, dependencies, scripts.
- `app/_layout.tsx` — providers, theme, and router `Stack` registration.
- `app/index.tsx` — auth-based redirect to tabs vs login.
- `app/(auth)/_layout.tsx` — auth stack routes.
- `app/(tabs)/_layout.tsx` — tabs stack with hidden tab bar.

### Environment and Base URL
- API base configuration lives in `app/config/api.ts` as `API_CONFIG.BASE_URL` (currently `https://back.muntadaa.online`).

### Notes
- The tab bar is explicitly hidden; navigation across tab screens is handled programmatically or via custom UI.
- Dark mode is supported via `useColorScheme` and `@react-navigation/native` themes.


