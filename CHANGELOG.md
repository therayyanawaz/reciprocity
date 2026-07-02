# Changelog

All notable changes to Instagram Unfollowers.

---

## [5.1] — 2026-07-02

### Added
- **Visible in-page progress indicators** for DM actions (Delete chats, Full Erase) — real-time progress bar, current username, action label, and count displayed in the sidebar
- **Multi-strategy token extraction** (`extractUUID()`) — tries multiple cookie names, HTML scraping, and generates a valid-format fallback UUID as last resort
- **Relaxed regex patterns** for `initTokens()` — handles single quotes, no quotes, and alternate key formats; falls back to scanning all `<script>` tags, `__INITIAL_STATE__`, and localStorage
- **Expanded inbox scan** — increased from 5 to 20 pages (400 threads max) for DM thread lookup
- **Broadened user ID matching** — checks `u.pk`, `u.id`, and `u.user_id` fields in thread participant lookup
- **CHANGELOG.md** — this file

### Fixed
- **Critical: `API.initTokens()` was never called** — defined at line 1119 but not invoked from `init()`. All tokens (`uuid`, `fbDtsg`, `lsd`, `jazoest`) stayed `null`, causing the GraphQL delete-chat mutation to silently fail
- **GraphQL response parsing** — Instagram's `/api/graphql` wraps responses in `for (;;);` (anti-CSRF). Changed from `res.json()` to `res.text()` + regex prefix strip + `JSON.parse`
- **Removed broken REST `/hide/` fallback** — `/direct_v2/threads/{id}/hide/` was returning 404 and CORS errors. `deleteChatByUserId` now uses GraphQL exclusively
- **Stray `n` character** — cleaned up a `sed` artifact causing `Uncaught SyntaxError: Unexpected token 'if'`
- **Removed blocked Google Fonts `@import`** — Instagram's CSP was blocking `fonts.googleapis.com`; now falls back to native system fonts

### Changed
- **Actions panel reorganized** — split into three labeled groups with hairline separators: **Selection** (Select all, Clear), **Queue actions** (Unfollow, Remove, Defriend), **DM actions** (Delete chats, Full Erase)
- **Buttons disabled during DM operations** — queue buttons and DM action buttons are disabled while `actionProgress` is running to prevent concurrent operations

---

## [5.0] — 2026-06-?? (initial v5 release)

### Added
- Complete UI/rebuild with minimal dark design and system font stack
- 7 scan modes: Non-Followers, Mutuals, Fans, Following, Followers, New Unfollowers, Deactivated
- Per-account enrichment with follower/following counts and spam ratio detection
- Historical snapshot comparisons (time-machine diffing)
- Background action queue with rate-limit guardian (150 actions/day)
- Defriend action: unfollow + remove follower + optional delete chat
- GraphQL-based DM thread deletion (`IGDInboxInfoDeleteThreadDialogOffMsysMutation`)
- Full Erase: unsend all your messages + delete thread
- Whitelist system with auto-whitelist for verified/private accounts
- CSV export of filtered results
- Settings panel with configurable delays and retention
- Desktop notifications via browser Notification API
- IndexedDB persistence for snapshots and enriched data
- Collapsible queue panel with live log

### Fixed
- Legacy GraphQL query hash endpoints (deprecated by Instagram, returning 401/403) replaced with `friendships/` v1 REST API
- Username input re-render preserving scroll position and focus
- Snapshot selection click handler

---

## [4.1] — 2026-??

- CSP fix for Google Fonts blocked by Instagram
- Configurable snapshot retention days
- Browser notification support

## [4.0] — 2026-??

- Deep enrichment queue with per-account stats
- Snapshot type indicators and scan mode fallbacks

## [3.0] — 2026-??

- Queue system, dashboard snapshots, CSV export
- Spam detection and Discord webhooks

## [2.0] — 2026-??

- Snapshot-based history tracking
- Action rate limits and smart filters

## [1.0] — 2026-??

- Initial release: basic unfollower detection
