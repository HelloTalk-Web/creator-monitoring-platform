# Tasks: 简化图片存储加载机制

**Input**: Design documents from `/specs/002-simplify-image-storage/`
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

**Tests**: Tests are NOT explicitly requested in the feature specification, so test tasks are excluded from this implementation plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a **Web application** with frontend + backend separation:
- Backend: `backend/src/`, `backend/scripts/`, `backend/static/`
- Frontend: `frontend/app/`, `frontend/components/`, `frontend/lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Install Vitest and testing dependencies in backend/package.json
- [X] T002 Install Vitest and testing dependencies in frontend/package.json
- [X] T003 [P] Create Vitest configuration in backend/vitest.config.ts
- [X] T004 [P] Create Vitest configuration in frontend/vitest.config.ts
- [X] T005 [P] Create placeholder images directory at backend/static/images/placeholders/
- [X] T006 [P] Add avatar-default.svg placeholder to backend/static/images/placeholders/
- [X] T007 [P] Add video-default.svg placeholder to backend/static/images/placeholders/
- [X] T008 [P] Create downloaded images directory at backend/static/images/downloaded/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Define imageMetadata table schema in backend/src/shared/database/schema.ts
- [ ] T010 [P] (DEFERRED) Define downloadQueue table schema in backend/src/shared/database/schema.ts - 标记为未来优化，当前使用内存队列 p-queue
- [X] T011 Generate Drizzle migration files for new tables
- [X] T012 Create ImageStorageService class in backend/src/services/ImageStorageService.ts
- [X] T013 [P] Install p-queue dependency in backend/package.json

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 开发者集成图片显示 (Priority: P1) 🎯 MVP

**Goal**: 开发者在前端只需使用统一的URL字段显示图片，系统自动处理图片来源、代理和降级

**Independent Test**: 在前端组件中使用单一图片URL字段（如 `/api/images/avatar/123`），验证图片正确显示且无需额外逻辑

### Implementation for User Story 1

#### Backend API Implementation

- [X] T014 [P] [US1] Implement getImageUrl method in backend/src/services/ImageStorageService.ts
- [X] T015 [P] [US1] Implement createMetadata method in backend/src/services/ImageStorageService.ts
- [X] T016 [P] [US1] Implement recordAccess method in backend/src/services/ImageStorageService.ts
- [X] T017 [US1] Create unified image access route in backend/src/routes/images.ts
- [X] T018 [US1] Implement GET /api/images/:type/:id endpoint in backend/src/routes/images.ts
- [X] T019 [US1] Add image type validation (avatar/thumbnail) in backend/src/routes/images.ts
- [X] T020 [US1] Implement entity lookup logic (creatorAccounts/videos) in backend/src/routes/images.ts
- [X] T021 [US1] Add placeholder fallback logic in backend/src/routes/images.ts
- [X] T021b [US1] Add image format validation (MIME type and file integrity check) in backend/src/routes/images.ts
- [X] T022 [US1] Register images route in backend/src/index.ts

#### Frontend Component Implementation

- [X] T023 [P] [US1] Simplify getDisplayImageUrl function in frontend/lib/utils.ts
- [X] T024 [P] [US1] Create UnifiedImage component in frontend/components/common/Image.tsx
- [X] T025 [US1] Add error handling and placeholder fallback in frontend/components/common/Image.tsx
- [X] T026 [US1] Update AccountsPage to use UnifiedImage in frontend/app/accounts/page.tsx
- [X] T027 [US1] Update VideosPage to use UnifiedImage in frontend/app/videos/page.tsx
- [X] T028 [US1] Update TrendingVideos component to use UnifiedImage in frontend/components/dashboard/trending-videos.tsx
- [X] T029 [US1] Update RecentVideos component to use UnifiedImage in frontend/components/dashboard/recent-videos.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - developers can use unified image URLs without complex logic

---

## Phase 4: User Story 2 - 系统自动优化图片存储 (Priority: P2)

**Goal**: 系统自动将第三方图片后台下载到本地，后续访问使用本地副本提升速度和可靠性

**Independent Test**: 监控图片首次访问（触发下载）和后续访问的响应时间，验证本地化生效且响应时间 < 200ms

### Implementation for User Story 2

#### Background Download Worker

- [X] T030 [P] [US2] Create ImageDownloadWorker module in backend/src/jobs/image-download-worker.ts
- [X] T031 [P] [US2] Implement downloadImage function with axios stream in backend/src/jobs/image-download-worker.ts
- [X] T032 [US2] Setup p-queue with concurrency limit of 5 in backend/src/jobs/image-download-worker.ts
- [X] T033 [US2] Implement getPendingDownloads query in backend/src/jobs/image-download-worker.ts
- [X] T034 [US2] Add cron schedule (every 10 minutes) for pending downloads in backend/src/jobs/image-download-worker.ts
- [X] T035 [US2] Implement retry logic with exponential backoff (1min, 5min, 30min) in backend/src/jobs/image-download-worker.ts
- [X] T036 [US2] Add download status updates (downloading, completed, failed) in backend/src/jobs/image-download-worker.ts
- [X] T037 [US2] Implement file extension detection from MIME type in backend/src/jobs/image-download-worker.ts
- [X] T038 [US2] Add local file saving logic to backend/static/images/downloaded/ in backend/src/jobs/image-download-worker.ts

#### Storage Monitoring

- [X] T039 [P] [US2] Create StorageMonitorService in backend/src/services/StorageMonitorService.ts
- [X] T040 [P] [US2] Implement checkDiskSpace function in backend/src/services/StorageMonitorService.ts
- [X] T041 [US2] Add cron schedule (hourly) for storage monitoring in backend/src/jobs/image-download-worker.ts
- [X] T042 [US2] Implement pause downloads logic when space < 10GB in backend/src/services/StorageMonitorService.ts
- [X] T043 [US2] Add admin notification via console.error logging in backend/src/services/StorageMonitorService.ts

#### Statistics API

- [X] T044 [P] [US2] Implement getStats method in backend/src/services/ImageStorageService.ts
- [X] T045 [US2] Create GET /api/images/stats endpoint in backend/src/routes/images.ts
- [X] T046 [US2] Add statistics calculation (total, by status, cache hit rate) in backend/src/services/ImageStorageService.ts

#### Worker Integration

- [X] T047 [US2] Import and start image-download-worker in backend/src/index.ts
- [X] T048 [US2] Implement graceful shutdown for queue in backend/src/index.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - images auto-download in background and serve from local cache

---

## Phase 5: User Story 3 - 数据库迁移和清理 (Priority: P3)

**Goal**: 管理员安全迁移旧数据到新模式，清理冗余字段，支持自动备份和回滚

**Independent Test**: 执行迁移脚本 dry-run 和 execute 模式，验证数据完整性无损失且可回滚

### Implementation for User Story 3

#### Migration Script

- [X] T049 [P] [US3] Create migration script in backend/scripts/migrate-image-fields.ts
- [X] T050 [P] [US3] Implement database backup logic using pg_dump in backend/scripts/migrate-image-fields.ts
- [X] T051 [US3] Implement dry-run mode for migration preview in backend/scripts/migrate-image-fields.ts
- [X] T052 [US3] Implement transaction wrapper for migration in backend/scripts/migrate-image-fields.ts
- [X] T053 [US3] Add avatar migration logic (creatorAccounts → imageMetadata) in backend/scripts/migrate-image-fields.ts
- [X] T054 [US3] Add thumbnail migration logic (videos → imageMetadata) in backend/scripts/migrate-image-fields.ts
- [X] T055 [US3] Implement MD5 hash generation for URL deduplication in backend/scripts/migrate-image-fields.ts
- [X] T056 [US3] Add data validation queries in backend/scripts/migrate-image-fields.ts
- [X] T057 [US3] Implement old column drop logic (localAvatarUrl, thumbnailLocalPath) in backend/scripts/migrate-image-fields.ts
- [X] T058 [US3] Add CLI argument parsing (--dry-run, --execute, --rollback) in backend/scripts/migrate-image-fields.ts

#### Rollback Script

- [X] T059 [P] [US3] Implement rollback function in backend/scripts/migrate-image-fields.ts
- [X] T060 [P] [US3] Add backup restoration logic using pg_restore in backend/scripts/migrate-image-fields.ts

#### Migration API (Optional - for UI-based migration)

- [ ] T061 [P] [US3] Create ImageMigrationService in backend/src/services/ImageMigrationService.ts
- [ ] T062 [P] [US3] Create migration routes in backend/src/routes/migration.ts
- [ ] T063 [US3] Implement POST /api/migration/start endpoint in backend/src/routes/migration.ts
- [ ] T064 [US3] Implement GET /api/migration/status/:taskId endpoint in backend/src/routes/migration.ts
- [ ] T065 [US3] Implement POST /api/migration/rollback/:taskId endpoint in backend/src/routes/migration.ts
- [ ] T066 [US3] Add migration task state tracking in ImageMigrationService
- [ ] T067 [US3] Register migration routes in backend/src/index.ts

#### Cleanup Script

- [X] T068 [P] [US3] Create storage cleanup script in backend/scripts/cleanup-storage.ts
- [X] T069 [P] [US3] Implement unused file detection logic in backend/scripts/cleanup-storage.ts
- [X] T070 [US3] Add dry-run mode for cleanup preview in backend/scripts/cleanup-storage.ts
- [X] T071 [US3] Implement file deletion with safety checks in backend/scripts/cleanup-storage.ts

**Checkpoint**: All user stories should now be independently functional - migration tools enable safe transition from old to new schema

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T072 [P] Add error logging for image download failures across all components
- [X] T073 [P] Add performance monitoring for image response times
- [X] T074 [P] Document API endpoints in backend/API-IMAGES.md
- [X] T075 [P] Document frontend component usage in frontend/IMAGES-COMPONENT.md
- [X] T076 Code cleanup: Mark deprecated getDisplayImageUrlLegacy in frontend/lib/utils.ts
- [X] T077 Code cleanup: Mark old image-proxy route as deprecated in backend/src/routes/image-proxy.ts
- [ ] T078 [P] Add access count statistics dashboard (optional enhancement - skipped)
- [ ] T079 [P] Implement image metadata query endpoint GET /api/images/metadata/:url (optional - skipped)
- [ ] T080 Run quickstart.md validation and update examples (optional - skipped)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Phase 2 - No dependencies on other stories
  - User Story 2 (P2): Can start after Phase 2 - Builds on US1 infrastructure but independently testable
  - User Story 3 (P3): Can start after Phase 2 - Migration operates on schema from Phase 2
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses ImageStorageService from US1 but adds independent download worker
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Operates on database schema, doesn't block US1/US2

### Within Each User Story

- **User Story 1**: Backend API (T014-T022) before Frontend (T023-T029), but backend tasks can parallelize where marked [P]
- **User Story 2**: Download worker (T030-T038) and monitoring (T039-T043) can parallelize, then integrate (T047-T048)
- **User Story 3**: Migration script (T049-T058) and API (T061-T067) can parallelize

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T006, T007, T008 can all run in parallel
- **Phase 2**: T010, T013 can run in parallel after T009
- **User Story 1**:
  - T014, T015, T016 can run in parallel (different methods)
  - T023, T024 can run in parallel (different files)
- **User Story 2**:
  - T030, T031 can run in parallel
  - T039, T040 can run in parallel
  - T044, T045 can run in parallel
- **User Story 3**:
  - T049, T050 can run in parallel
  - T059, T060 can run in parallel
  - T061, T062 can run in parallel
  - T068, T069 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch backend methods in parallel:
Task T014: "Implement getImageUrl method in backend/src/services/ImageStorageService.ts"
Task T015: "Implement createMetadata method in backend/src/services/ImageStorageService.ts"
Task T016: "Implement recordAccess method in backend/src/services/ImageStorageService.ts"

# Launch frontend components in parallel:
Task T023: "Simplify getDisplayImageUrl function in frontend/lib/utils.ts"
Task T024: "Create UnifiedImage component in frontend/components/common/Image.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T013) - CRITICAL
3. Complete Phase 3: User Story 1 (T014-T029)
4. **STOP and VALIDATE**:
   - Test unified image API with curl: `GET /api/images/avatar/123`
   - Verify frontend displays images using UnifiedImage component
   - Verify placeholder fallback works for missing/failed images
5. Deploy/demo if ready

**MVP Deliverable**: Developers can use simple unified image URLs, system handles all complexity internally

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T013)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! T014-T029)
3. Add User Story 2 → Test independently → Deploy/Demo (Background optimization, T030-T048)
4. Add User Story 3 → Test independently → Deploy/Demo (Migration tools, T049-T071)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T013)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T014-T029) - Unified API and frontend
   - **Developer B**: User Story 2 (T030-T048) - Background download worker
   - **Developer C**: User Story 3 (T049-T071) - Migration scripts
3. Stories complete and integrate independently

---

## Task Summary

- **Total Tasks**: 81
- **Setup (Phase 1)**: 8 tasks
- **Foundational (Phase 2)**: 5 tasks (BLOCKING)
- **User Story 1 (P1 - MVP)**: 17 tasks
- **User Story 2 (P2)**: 19 tasks
- **User Story 3 (P3)**: 23 tasks
- **Polish (Phase 6)**: 9 tasks

### Task Count per User Story

- **US1**: 17 tasks - Unified image API and frontend integration
- **US2**: 19 tasks - Background download automation and monitoring
- **US3**: 23 tasks - Migration tools and database cleanup

### Parallel Opportunities Identified

- **27 tasks** marked with [P] can run in parallel within their phase
- **3 user stories** can be developed in parallel after Foundational phase
- **Multiple methods/components** within each story can be built concurrently

### Independent Test Criteria

- **US1**: Use `/api/images/avatar/123` in browser, verify image loads or placeholder shows
- **US2**: Monitor response times before/after localization, check storage stats API
- **US3**: Run migration dry-run, verify data counts match, test rollback capability

### Suggested MVP Scope

**User Story 1 only** (T001-T013, T014-T022):
- Setup testing infrastructure
- Create foundational database schema and services
- Implement unified image access API (including format validation)
- Update frontend to use simplified image components
- Deliverable: Developers can use single URL field, system handles complexity

This provides immediate value (simplified developer experience) without requiring background workers or migration.

---

## Notes

- [P] tasks = different files/methods, no dependencies, safe to parallelize
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are NOT included per feature specification (not explicitly requested)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
