# Reciprocity

A Tampermonkey/Violentmonkey userscript that analyzes Instagram following/follower relationships, identifies non-reciprocal follows, and provides bulk action tools — all running in your browser.

![Version](https://img.shields.io/badge/version-5.3-000?style=flat-square)

---

## Features

**Analysis**
- Scan any public Instagram account (including your own)
- 7 scan modes: Non-Followers, Mutuals, Fans, Following, Followers, New Unfollowers, Deactivated
- Per-account enrichment: follower/following counts and spam ratio detection
- Historical snapshot comparisons (time-machine diffing)

**Actions**
- **Background queue** — Unfollow, Remove Follower, or Defriend (unfollow + remove + delete chat) with rate-limit protection
- **DM actions** — Delete DM threads or Full Erase (unsend all your messages + delete thread) with real-time progress
- Whitelist to protect specific accounts from bulk actions
- CSV export of filtered results

**Interface**
- Minimal dark UI with system font stack
- Live progress bar and scan log
- Real-time visible progress for DM operations
- Settings panel, filter controls, paginated results

---

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox)

2. [Click here to install](userscript.js) — or copy the raw URL and add it manually in your userscript manager.

3. Navigate to `https://www.instagram.com/` and look for the IU panel overlay.

---

## How to Use

### 1. Start screen
Enter any public Instagram username and choose a scan mode.

- **Non-Followers** — People you follow who don't follow back
- **Mutuals** — Accounts where both sides follow each other
- **Fans** — People who follow you but you don't follow back
- **Following** — Everyone you currently follow
- **Followers** — Everyone who follows you
- **New Unfollowers** — Accounts that unfollowed since your last snapshot
- **Deactivated** — Following accounts that no longer exist (probes each one)

### 2. Results
After scanning, you'll see metrics, a profile card, and a paginated results table.

**Filters** (sidebar):
- Verified accounts
- Private accounts
- Default avatars
- High spam ratio (>5000 following, <50 followers)

**Enrichment** — Click "Enrich stats" in the sidebar to fetch follower/following counts for each account. Enriched data persists across scans via IndexedDB.

### 3. Actions

#### Selection
Use checkboxes or Select all / Clear to choose accounts, then apply an action.

#### Queue actions (background, rate-limited)
| Action | What it does |
|---|---|
| **Unfollow** | Unfollows selected accounts via background queue |
| **Remove** | Removes selected accounts from your followers |
| **Defriend** | Unfollows + removes follower + optionally deletes chat |

All queue actions respect a 150-action-per-day limit. The queue processes one action at a time with configurable delays and persists across page refreshes.

#### DM actions (immediate, real-time progress)
| Action | What it does |
|---|---|
| **Delete chats** | Hides the DM thread from your inbox via Instagram's GraphQL mutation |
| **🔥 Full Erase** | Unsend all your messages in the thread + delete/hide the thread from your inbox |

Both show a live progress bar with current account, progress percentage, and count.

### 4. Snapshots & Comparisons
The **Snapshots** tab (in the main content area) shows saved scan snapshots. Select any two to diff them — see which accounts were gained, lost, or remained between scans.

### 5. Settings
Accessible from the header. Configure:

- **Search delay** — pause between API fetches during scan (default 1000ms)
- **Unfollow delay** — pause between queue actions (default 4000ms)
- **Snapshot retention** — days to keep historical snapshots (default 30)
- **Compare view max** — max users shown per section in snapshot comparison (default 200)
- **Queue list max** — max pending tasks shown in queue panel (default 20)
- **Activity log max** — max entries in queue activity log (default 100, persisted to localStorage)
- **Enable queue** — toggle background processing on/off
- **Auto-whitelist verified** — automatically protect verified accounts
- **Auto-whitelist private** — automatically protect private accounts
- **Delete chat on defriend** — when enabled, defriend also deletes the DM thread

---

## Privacy

- **No data leaves your browser.** All analysis runs locally via IndexedDB and localStorage.
- API calls go directly to Instagram's own endpoints (same as the official web app).
- No tracking, no analytics, no third-party servers.

---

## Technical Notes

- Uses Instagram's internally-for-mobile REST API (`/api/v1/`) and GraphQL (`/api/graphql`) endpoints
- Tokens are extracted from the page HTML on load (`fb_dtsg`, `lsd`, etc.)
- GraphQL responses use Instagram's anti-CSRF `for (;;);` prefix — the script strips it before parsing
- DM deletion uses the same `IGDInboxInfoDeleteThreadDialogOffMsysMutation` mutation as the official UI
- Unsending messages calls `/api/v1/direct_v2/threads/{id}/items/{id}/delete/` with session credentials
- Queue tasks persist in localStorage and survive page refreshes

---

## Changelog

### v5.0
- Complete UI/rebuild — minimal dark design with system fonts
- Replaced CSS colors with monochrome ink palette (white-on-dark)
- New scan modes: Recent Unfollowers, Deactivated detection
- GraphQL-based DM thread deletion (replaces broken REST `/hide/` endpoint)
- Fixed `for (;;);` anti-CSRF prefix handling in GraphQL responses
- Robust token extraction with multi-strategy fallback (cookie → HTML → `__INITIAL_STATE__` → script tags)
- Expanded inbox scan for thread lookup (up to 20 pages / 400 threads)
- Real-time visible progress indicators for DM actions
- Reorganized Actions panel into labeled groups (Selection, Queue actions, DM actions)
- Queue system with rate-limit guardian, persistent state, and collapsible panel
- Snapshot comparison (diff two historical snapshots)
- Settings panel, CSV export, desktop notifications
- IndexedDB persistence for snapshots and enriched data

### v4.1
- CSP fix for Google Fonts blocked by Instagram
- Username input re-render fix
- Snapshot selection click handler improvements
- Browser notification support
- Configurable snapshot retention

### v4.0
- Deep enrichment queue with per-account stats
- Snapshot type indicators and scan mode fallbacks
- Usability and error-handling improvements

---

## Disclaimer

This script is for educational purposes. Using automated tools on Instagram may violate their Terms of Service. Use at your own risk. The author is not responsible for any account actions taken, including but not limited to rate-limiting, temporary blocks, or permanent suspension.

---

<p align="center"><sub>Made with ☕ by <a href="https://github.com/therayyanawaz">therayyanawaz</a></sub></p>
