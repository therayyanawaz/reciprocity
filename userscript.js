// ==UserScript==
// @name         Instagram Unfollowers
// @namespace    https://instagram.com/
// @version      5.1
// @description  Analyze Instagram following/follower relationships and identify non-reciprocal follows
// @author       therayyanawaz
// @match        https://www.instagram.com/*
// @grant        none
// ==/UserScript==

/**
 * Instagram Unfollowers v5 — Pure minimal dark rebuild.
 * Full UI/render rewrite. API + IndexedDB + Queue contracts preserved
 * so existing user data (whitelist, settings, snapshots, queue) survives.
 */

(function () {
  'use strict';

  // ============================================================
  // 1. STYLES  — pure minimal dark, single ink accent, no color
  // ============================================================
  const styles = `
    :root {
      --iu-void:    #000000;
      --iu-bg:      #0a0a0a;
      --iu-bg-2:    #101010;
      --iu-bg-3:    #171717;
      --iu-bg-4:    #1f1f1f;

      --iu-line:    rgba(255,255,255,0.06);
      --iu-line-2:  rgba(255,255,255,0.10);
      --iu-line-3:  rgba(255,255,255,0.20);

      --iu-ink:     #f5f5f5;
      --iu-ink-2:   #d4d4d4;
      --iu-ink-3:   #8a8a8a;
      --iu-ink-4:   #5a5a5a;
      --iu-ink-5:   #3a3a3a;

      --iu-accent:  #f5f5f5;
      --iu-accent-ink: #0a0a0a;

      --iu-good:    #a3a3a3;
      --iu-warn:    #a3a3a3;
      --iu-bad:     #d4d4d4;

      --iu-r:       6px;
      --iu-r-lg:    10px;

      --iu-font:    'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      --iu-mono:    'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace;

      --iu-ease:    cubic-bezier(0.2, 0, 0, 1);
    }

    .iu-panel, .iu-panel *, .iu-toast, .iu-toast * {
      box-sizing: border-box;
      font-family: var(--iu-font);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-feature-settings: 'calt','kern','liga','ss03';
    }

    .iu-panel {
      position: fixed; inset: 0;
      z-index: 2147483000;
      background: var(--iu-bg);
      color: var(--iu-ink);
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .iu-app {
      position: relative;
      display: flex; flex-direction: column;
      flex: 1; min-height: 0;
    }

    @keyframes iu-fade  { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    @keyframes iu-spin  { to { transform: rotate(360deg); } }
    @keyframes iu-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
    @media (prefers-reduced-motion: reduce) {
      .iu-panel, .iu-panel *, .iu-toast { animation: none !important; transition: none !important; }
    }

    /* ---------- Header (inline hairline bar) ---------- */
    .iu-header {
      position: relative;
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 28px;
      border-bottom: 1px solid var(--iu-line);
      background: var(--iu-bg);
      gap: 24px;
      flex-wrap: wrap;
    }
    .iu-brand {
      display: flex; align-items: center; gap: 12px;
      min-width: 0;
    }
    .iu-brand-mark {
      width: 24px; height: 24px;
      display: grid; place-items: center;
      background: var(--iu-ink);
      color: var(--iu-accent-ink);
      border-radius: 4px;
      font-family: var(--iu-mono);
      font-weight: 500; font-size: 11px;
      letter-spacing: 0;
    }
    .iu-brand-name {
      font-family: var(--iu-font);
      font-weight: 600; font-size: 13px;
      letter-spacing: -0.01em;
      color: var(--iu-ink);
    }
    .iu-brand-sub {
      font-family: var(--iu-mono);
      font-size: 10px;
      color: var(--iu-ink-3);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .iu-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    /* progress bar — thin line pinned to header bottom */
    .iu-progress {
      position: absolute; left: 0; right: 0; bottom: -1px;
      height: 1px;
      background: transparent;
      overflow: hidden;
    }
    .iu-progress-fill {
      height: 100%;
      background: var(--iu-ink);
      transition: width 240ms var(--iu-ease);
    }
    .iu-progress-meta {
      font-family: var(--iu-mono);
      font-size: 10px;
      color: var(--iu-ink-3);
      letter-spacing: 0.06em;
      display: flex; align-items: center; gap: 12px;
    }
    .iu-progress-meta .iu-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--iu-ink);
      animation: iu-pulse 1.4s var(--iu-ease) infinite;
    }

    /* ---------- Inputs ---------- */
    .iu-input {
      appearance: none;
      background: var(--iu-bg-2);
      color: var(--iu-ink);
      border: 1px solid var(--iu-line);
      border-radius: var(--iu-r);
      padding: 8px 12px;
      font-family: var(--iu-font);
      font-size: 13px;
      outline: none;
      transition: border-color 160ms var(--iu-ease), background 160ms var(--iu-ease);
      min-width: 200px;
    }
    .iu-input::placeholder { color: var(--iu-ink-4); }
    .iu-input:hover  { border-color: var(--iu-line-2); }
    .iu-input:focus  { border-color: var(--iu-line-3); background: var(--iu-bg-3); }

    /* ---------- Buttons ---------- */
    .iu-btn {
      appearance: none;
      display: inline-flex; align-items: center; justify-content: center;
      gap: 8px;
      padding: 7px 12px;
      font-family: var(--iu-font);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: -0.005em;
      border-radius: var(--iu-r);
      border: 1px solid var(--iu-line);
      background: var(--iu-bg-2);
      color: var(--iu-ink-2);
      cursor: pointer;
      transition: color 160ms var(--iu-ease), background 160ms var(--iu-ease), border-color 160ms var(--iu-ease);
    }
    .iu-btn:hover  { color: var(--iu-ink); background: var(--iu-bg-3); border-color: var(--iu-line-2); }
    .iu-btn:active { transform: translateY(0.5px); }
    .iu-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .iu-btn-primary {
      background: var(--iu-ink);
      color: var(--iu-accent-ink);
      border-color: var(--iu-ink);
      font-weight: 600;
    }
    .iu-btn-primary:hover { background: #ffffff; color: #000000; }
    .iu-btn-ghost { background: transparent; border-color: transparent; color: var(--iu-ink-3); }
    .iu-btn-ghost:hover { background: var(--iu-bg-2); color: var(--iu-ink); }
    .iu-btn-danger { color: var(--iu-ink); border-color: var(--iu-line-2); }
    .iu-btn-danger:hover { background: var(--iu-bg-3); border-color: var(--iu-line-3); }
    .iu-btn-sm { padding: 5px 9px; font-size: 11px; }

    /* ---------- Content canvas ---------- */
    .iu-content {
      position: relative;
      flex: 1;
      overflow: auto;
      padding: 32px 28px 64px;
      display: flex; flex-direction: column;
      gap: 32px;
      animation: iu-fade 220ms var(--iu-ease);
    }

    /* ---------- Metric strip ---------- */
    .iu-metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      border: 1px solid var(--iu-line);
      border-radius: var(--iu-r-lg);
      overflow: hidden;
    }
    @media (max-width: 900px) { .iu-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .iu-metric {
      padding: 18px 20px;
      display: flex; flex-direction: column; gap: 8px;
      border-right: 1px solid var(--iu-line);
      background: var(--iu-bg);
    }
    .iu-metric:last-child { border-right: 0; }
    @media (max-width: 900px) {
      .iu-metric { border-right: 0; border-bottom: 1px solid var(--iu-line); }
    }
    .iu-metric-label {
      font-family: var(--iu-mono);
      font-size: 10px; font-weight: 400;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--iu-ink-3);
    }
    .iu-metric-value {
      font-family: var(--iu-font);
      font-weight: 600;
      font-size: 28px;
      letter-spacing: -0.03em;
      color: var(--iu-ink);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    /* ---------- Sections ---------- */
    .iu-section-title {
      display: flex; align-items: center; gap: 10px;
      font-family: var(--iu-font);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--iu-ink-3);
    }
    .iu-section-title::after {
      content: ''; flex: 1; height: 1px; background: var(--iu-line);
    }

    /* ---------- Start screen ---------- */
    .iu-start {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 40px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .iu-hero {
      display: flex; flex-direction: column;
      gap: 20px;
      padding: 48px 0 8px;
    }
    .iu-hero-eyebrow {
      font-family: var(--iu-mono);
      font-size: 11px;
      color: var(--iu-ink-3);
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .iu-hero-title {
      font-family: var(--iu-font);
      font-weight: 600;
      font-size: clamp(36px, 5vw, 56px);
      letter-spacing: -0.035em;
      line-height: 1.02;
      color: var(--iu-ink);
      margin: 0;
      max-width: 22ch;
    }
    .iu-hero-sub {
      font-family: var(--iu-font);
      font-size: 15px;
      color: var(--iu-ink-3);
      max-width: 60ch;
      line-height: 1.55;
    }
    .iu-target-bar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: stretch;
      background: var(--iu-bg-2);
      border: 1px solid var(--iu-line);
      border-radius: var(--iu-r-lg);
      padding: 6px;
    }
    .iu-target-bar .iu-input {
      border: 0; background: transparent;
      min-width: 0; width: 100%;
      padding: 12px 14px;
      font-size: 14px;
    }
    .iu-target-bar .iu-input:focus { background: transparent; box-shadow: none; }
    .iu-target-bar .iu-btn-primary {
      padding: 0 20px;
      font-size: 13px;
    }

    /* ---------- Mode grid ---------- */
    .iu-modes {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    @media (max-width: 900px) { .iu-modes { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .iu-modes { grid-template-columns: 1fr; } }
    .iu-mode {
      position: relative;
      text-align: left;
      background: var(--iu-bg-2);
      border: 1px solid var(--iu-line);
      border-radius: var(--iu-r-lg);
      padding: 18px;
      cursor: pointer;
      color: var(--iu-ink);
      display: flex; flex-direction: column; gap: 6px;
      transition: border-color 160ms var(--iu-ease), background 160ms var(--iu-ease);
    }
    .iu-mode:hover { border-color: var(--iu-line-2); background: var(--iu-bg-3); }
    .iu-mode.active {
      border-color: var(--iu-line-3);
      background: var(--iu-bg-3);
    }
    .iu-mode.active::before {
      content: ''; position: absolute; top: 14px; right: 14px;
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--iu-ink);
    }
    .iu-mode-key {
      font-family: var(--iu-mono);
      font-size: 10px;
      color: var(--iu-ink-4);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .iu-mode-label {
      font-family: var(--iu-font);
      font-weight: 600;
      font-size: 15px;
      letter-spacing: -0.015em;
      color: var(--iu-ink);
    }
    .iu-mode-desc {
      font-family: var(--iu-font);
      font-size: 12px;
      color: var(--iu-ink-3);
      line-height: 1.45;
    }

    /* ---------- Steps list ---------- */
    .iu-steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      padding: 24px 0 8px;
      border-top: 1px solid var(--iu-line);
    }
    @media (max-width: 900px) { .iu-steps { grid-template-columns: 1fr; } }
    .iu-step {
      display: flex; flex-direction: column; gap: 8px;
    }
    .iu-step-num {
      font-family: var(--iu-mono);
      font-size: 11px;
      color: var(--iu-ink-4);
      letter-spacing: 0.08em;
    }
    .iu-step-title {
      font-family: var(--iu-font);
      font-weight: 600;
      font-size: 13px;
      color: var(--iu-ink);
    }
    .iu-step-body {
      font-family: var(--iu-font);
      font-size: 12px;
      color: var(--iu-ink-3);
      line-height: 1.5;
    }

    /* ---------- Scan layout (sidebar + main) ---------- */
    .iu-scan {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 1000px) { .iu-scan { grid-template-columns: 1fr; } }
    .iu-sidebar {
      display: flex; flex-direction: column;
      gap: 20px;
      position: sticky;
      top: 0;
    }
    @media (max-width: 1000px) { .iu-sidebar { position: static; } }
    .iu-panel-block {
      background: var(--iu-bg-2);
      border: 1px solid var(--iu-line);
      border-radius: var(--iu-r-lg);
      padding: 16px 18px;
      display: flex; flex-direction: column;
      gap: 12px;
    }
    .iu-panel-block h3 {
      margin: 0;
      font-family: var(--iu-mono);
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--iu-ink-3);
      font-weight: 500;
    }
    .iu-filter-row {
      display: flex; align-items: center; justify-content: space-between;
      font-size: 13px;
      color: var(--iu-ink-2);
      padding: 4px 0;
    }
    .iu-filter-row label { display: flex; align-items: center; gap: 8px; cursor: pointer; }

    /* ---------- Tabs ---------- */
    .iu-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--iu-line);
    }
    .iu-tab {
      padding: 10px 14px;
      font-family: var(--iu-font);
      font-size: 13px;
      font-weight: 500;
      color: var(--iu-ink-3);
      background: transparent;
      border: 0;
      border-bottom: 1px solid transparent;
      cursor: pointer;
      margin-bottom: -1px;
      transition: color 160ms var(--iu-ease), border-color 160ms var(--iu-ease);
    }
    .iu-tab:hover { color: var(--iu-ink); }
    .iu-tab.active {
      color: var(--iu-ink);
      border-bottom-color: var(--iu-ink);
    }

    /* ---------- Table ---------- */
    .iu-table {
      display: flex; flex-direction: column;
      border: 1px solid var(--iu-line);
      border-radius: var(--iu-r-lg);
      overflow: hidden;
      background: var(--iu-bg);
    }
    .iu-table-head {
      display: flex; align-items: center;
      padding: 10px 16px;
      font-family: var(--iu-mono);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--iu-ink-3);
      background: var(--iu-bg-2);
      border-bottom: 1px solid var(--iu-line);
    }
    .iu-row {
      display: flex; align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--iu-line);
      font-size: 13px;
      color: var(--iu-ink-2);
      transition: background 120ms var(--iu-ease);
    }
    .iu-row:last-child { border-bottom: 0; }
    .iu-row:hover { background: var(--iu-bg-2); }
    .iu-row .iu-col-user { flex: 1; display: flex; align-items: center; gap: 12px; min-width: 0; }
    .iu-row .iu-col-badges { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; padding-right: 12px; }
    .iu-row .iu-col-ratio { flex: 0 0 90px; text-align: right; font-family: var(--iu-mono); font-size: 12px; color: var(--iu-ink-3); }
    .iu-row .iu-col-actions { flex: 0 0 auto; display: flex; gap: 4px; }
    .iu-row .iu-col-check { flex: 0 0 32px; display: flex; justify-content: center; }
    .iu-username {
      font-family: var(--iu-font);
      font-weight: 500;
      color: var(--iu-ink);
      letter-spacing: -0.005em;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 260px;
    }
    .iu-username:hover { text-decoration: underline; }
    .iu-fullname {
      color: var(--iu-ink-3);
      font-size: 12px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 220px;
    }
    .iu-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: var(--iu-bg-3);
      border: 1px solid var(--iu-line);
      flex-shrink: 0;
      overflow: hidden;
    }
    .iu-avatar img { width: 100%; height: 100%; object-fit: cover; }

    /* ---------- Badges ---------- */
    .iu-badge {
      display: inline-flex; align-items: center;
      padding: 2px 6px;
      font-family: var(--iu-mono);
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: var(--iu-ink-2);
      border: 1px solid var(--iu-line-2);
      border-radius: 4px;
      background: transparent;
    }
    .iu-badge-strong { color: var(--iu-ink); border-color: var(--iu-line-3); }

    /* ---------- Checkbox ---------- */
    .iu-check {
      appearance: none;
      width: 14px; height: 14px;
      border-radius: 3px;
      border: 1px solid var(--iu-line-3);
      background: var(--iu-bg-2);
      cursor: pointer;
      display: inline-grid; place-items: center;
      transition: background 120ms var(--iu-ease), border-color 120ms var(--iu-ease);
    }
    .iu-check:hover { border-color: var(--iu-ink-3); }
    .iu-check:checked { background: var(--iu-ink); border-color: var(--iu-ink); }
    .iu-check:checked::after {
      content: '';
      width: 3px; height: 6px;
      border: solid var(--iu-accent-ink);
      border-width: 0 1.5px 1.5px 0;
      transform: rotate(45deg) translate(-0.5px, -0.5px);
    }

    /* ---------- Pagination ---------- */
    .iu-pager {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 4px;
      font-family: var(--iu-mono);
      font-size: 11px;
      color: var(--iu-ink-3);
      letter-spacing: 0.06em;
    }

    /* ---------- Scan log ---------- */
    .iu-log {
      max-height: 180px; overflow: auto;
      font-family: var(--iu-mono);
      font-size: 11px;
      color: var(--iu-ink-3);
      line-height: 1.55;
      display: flex; flex-direction: column-reverse;
    }
    .iu-log-line { padding: 1px 0; }
    .iu-log-line::before { content: '› '; color: var(--iu-ink-5); }

    /* ---------- Empty state ---------- */
    .iu-empty {
      padding: 48px 24px;
      text-align: center;
      color: var(--iu-ink-3);
      font-size: 13px;
      background: var(--iu-bg-2);
      border: 1px dashed var(--iu-line-2);
      border-radius: var(--iu-r-lg);
    }
    .iu-empty strong { color: var(--iu-ink); font-weight: 600; font-size: 14px; display: block; margin-bottom: 6px; }

    /* ---------- Profile card ---------- */
    .iu-profile {
      display: flex; align-items: center; gap: 16px;
      padding: 20px;
      background: var(--iu-bg-2);
      border: 1px solid var(--iu-line);
      border-radius: var(--iu-r-lg);
    }
    .iu-profile .iu-avatar { width: 56px; height: 56px; }
    .iu-profile-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .iu-profile-name { font-size: 16px; font-weight: 600; color: var(--iu-ink); letter-spacing: -0.015em; }
    .iu-profile-sub  { font-size: 12px; color: var(--iu-ink-3); font-family: var(--iu-mono); letter-spacing: 0.04em; }

    /* ---------- Modal ---------- */
    .iu-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 2147483200;
      display: grid; place-items: center;
      padding: 24px;
    }
    .iu-modal {
      width: min(520px, 100%);
      background: var(--iu-bg);
      border: 1px solid var(--iu-line-2);
      border-radius: var(--iu-r-lg);
      display: flex; flex-direction: column;
      max-height: 90vh;
      animation: iu-fade 200ms var(--iu-ease);
    }
    .iu-modal-head {
      padding: 20px 24px;
      border-bottom: 1px solid var(--iu-line);
      display: flex; align-items: center; justify-content: space-between;
    }
    .iu-modal-title { font-size: 14px; font-weight: 600; color: var(--iu-ink); letter-spacing: -0.01em; }
    .iu-modal-body {
      padding: 20px 24px;
      overflow: auto;
      display: flex; flex-direction: column;
      gap: 16px;
    }
    .iu-modal-foot {
      padding: 16px 24px;
      border-top: 1px solid var(--iu-line);
      display: flex; justify-content: flex-end; gap: 8px;
    }
    .iu-field {
      display: flex; flex-direction: column; gap: 6px;
    }
    .iu-field label {
      font-family: var(--iu-mono);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--iu-ink-3);
    }
    .iu-field-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--iu-line);
      font-size: 13px;
      color: var(--iu-ink-2);
    }
    .iu-field-row:last-child { border-bottom: 0; }

    /* ---------- Toast ---------- */
    .iu-toast {
      position: fixed;
      bottom: 24px; right: 24px;
      z-index: 2147483600;
      padding: 12px 16px;
      background: var(--iu-bg-3);
      border: 1px solid var(--iu-line-2);
      border-radius: var(--iu-r);
      color: var(--iu-ink);
      font-family: var(--iu-font);
      font-size: 13px;
      max-width: 360px;
      animation: iu-fade 220ms var(--iu-ease);
      display: flex; align-items: center; gap: 10px;
    }
    .iu-toast::before {
      content: ''; width: 6px; height: 6px; border-radius: 50%;
      background: var(--iu-ink);
      flex-shrink: 0;
    }
    .iu-toast-error::before { background: #ffffff; }

    /* ---------- Queue panel ---------- */
    .iu-queue {
      position: fixed;
      bottom: 24px; left: 24px;
      z-index: 2147483400;
      background: var(--iu-bg-3);
      border: 1px solid var(--iu-line-2);
      border-radius: var(--iu-r);
      color: var(--iu-ink-2);
      font-family: var(--iu-mono);
      font-size: 11px;
      letter-spacing: 0.04em;
      min-width: 220px;
      max-width: 380px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.6);
      overflow: hidden;
    }
    .iu-queue-head {
      padding: 10px 12px;
      display: flex; align-items: center; gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .iu-queue-head:hover { background: rgba(255,255,255,0.03); }
    .iu-queue-title { color: var(--iu-ink); font-weight: 500; }
    .iu-queue-cur {
      color: var(--iu-ink-3);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      flex: 1; min-width: 0;
    }
    .iu-queue-chev { color: var(--iu-ink-3); margin-left: auto; }
    .iu-queue-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--iu-ink-3);
      display: inline-block;
    }
    .iu-queue-paused { background: #ff9a3d !important; }
    .iu-queue-spin {
      width: 8px; height: 8px;
      border: 1.5px solid var(--iu-line-3);
      border-top-color: var(--iu-ink);
      border-radius: 50%;
      animation: iu-spin 900ms linear infinite;
    }
    .iu-queue-body {
      border-top: 1px solid var(--iu-line-2);
      padding: 10px 12px 12px;
      max-height: 60vh;
      overflow-y: auto;
    }
    .iu-queue-row {
      display: flex; justify-content: space-between; gap: 12px;
      padding: 4px 0;
      font-size: 10.5px;
    }
    .iu-queue-k { color: var(--iu-ink-3); text-transform: uppercase; letter-spacing: 0.08em; }
    .iu-queue-v { color: var(--iu-ink); text-align: right; }
    .iu-queue-sec { margin-top: 12px; }
    .iu-queue-sec-t {
      color: var(--iu-ink-3);
      text-transform: uppercase; letter-spacing: 0.1em;
      font-size: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--iu-line-2);
      margin-bottom: 6px;
    }
    .iu-queue-list { display: flex; flex-direction: column; }
    .iu-queue-item {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 0;
      border-bottom: 1px dashed var(--iu-line-2);
      font-size: 11px;
    }
    .iu-queue-item:last-child { border-bottom: none; }
    .iu-queue-idx { color: var(--iu-ink-3); width: 22px; }
    .iu-queue-act {
      color: var(--iu-ink-2);
      text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.08em;
      padding: 1px 5px; border: 1px solid var(--iu-line-2); border-radius: 3px;
    }
    .iu-queue-u { color: var(--iu-ink); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .iu-queue-x {
      background: transparent; border: none; color: var(--iu-ink-3);
      cursor: pointer; font-size: 14px; padding: 0 4px;
    }
    .iu-queue-x:hover { color: var(--iu-ink); }
    .iu-queue-more { color: var(--iu-ink-3); font-size: 10px; padding-top: 4px; text-align: center; }
    .iu-queue-log { display: flex; flex-direction: column; gap: 3px; }
    .iu-queue-lline {
      display: flex; gap: 8px; font-size: 10.5px;
      color: var(--iu-ink-2);
    }
    .iu-queue-time { color: var(--iu-ink-3); flex-shrink: 0; }
    .iu-ql-ok  { color: #7ee2b8; }
    .iu-ql-fail{ color: #ff8a8a; }
    .iu-ql-run { color: var(--iu-ink); }
    .iu-ql-error { color: #ff6a6a; }
    .iu-queue-ctrls {
      display: flex; gap: 6px; margin-top: 12px;
      padding-top: 10px; border-top: 1px solid var(--iu-line-2);
    }
    .iu-queue-btn {
      flex: 1;
      background: transparent;
      border: 1px solid var(--iu-line-2);
      color: var(--iu-ink);
      padding: 6px 10px;
      font-family: var(--iu-mono); font-size: 10.5px;
      letter-spacing: 0.08em; text-transform: uppercase;
      cursor: pointer; border-radius: 4px;
    }
    .iu-queue-btn:hover { background: rgba(255,255,255,0.05); }


    /* ---------- Loading ---------- */
    .iu-load {
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 96px 24px;
      color: var(--iu-ink-3);
      font-family: var(--iu-mono);
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .iu-load-spin {
      width: 20px; height: 20px;
      border: 2px solid var(--iu-line-2);
      border-top-color: var(--iu-ink);
      border-radius: 50%;
      animation: iu-spin 800ms linear infinite;
    }

    /* ---------- Compare view ---------- */
    .iu-snap-list { display: flex; flex-direction: column; gap: 6px; }
    .iu-snap-item {
      display: grid;
      grid-template-columns: 20px auto 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--iu-bg-2);
      border: 1px solid var(--iu-line);
      border-radius: var(--iu-r);
      cursor: pointer;
      transition: border-color 160ms var(--iu-ease);
    }
    .iu-snap-item:hover { border-color: var(--iu-line-2); }
    .iu-snap-item.selected { border-color: var(--iu-line-3); background: var(--iu-bg-3); }
    .iu-snap-type {
      font-family: var(--iu-mono);
      font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--iu-ink-3);
    }
    .iu-snap-time { font-size: 12px; color: var(--iu-ink-2); }
    .iu-snap-count { font-family: var(--iu-mono); font-size: 11px; color: var(--iu-ink-3); }

    /* ---------- Utilities ---------- */
    .iu-mono { font-family: var(--iu-mono); }
    .iu-muted { color: var(--iu-ink-3); }
    .iu-panel a { color: var(--iu-ink); text-decoration: none; border-bottom: 1px solid var(--iu-line-2); }
    .iu-panel a:hover { border-bottom-color: var(--iu-ink); }
    .iu-panel ::selection { background: var(--iu-ink); color: var(--iu-accent-ink); }

    /* ---------- Scroll ---------- */
    .iu-panel ::-webkit-scrollbar { width: 8px; height: 8px; }
    .iu-panel ::-webkit-scrollbar-track { background: transparent; }
    .iu-panel ::-webkit-scrollbar-thumb { background: var(--iu-line-2); border-radius: 4px; }
    .iu-panel ::-webkit-scrollbar-thumb:hover { background: var(--iu-line-3); }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ============================================================
  // 2. CONFIG
  // ============================================================
  const CONFIG = {
    STORAGE_KEY:  'iu_whitelist_v3',
    SETTINGS_KEY: 'iu_settings_v3',
    QUEUE_KEY:    'iu_task_queue_v3',
    LIMITS_KEY:   'iu_action_limits_v3',
    USERS_PER_PAGE: 50,
    MAX_ACTIONS_24H: 150,
    DB_NAME: 'IU_Analytics_DB',
    DB_VERSION: 2,
    RENDER_THROTTLE_MS: 300,
    DEFAULT_SETTINGS: {
      searchDelay: 1000,
      unfollowDelay: 4000,
      autoWhitelistVerified: false,
      autoWhitelistPrivate: false,
      enableQueue: true,
      snapshotRetentionDays: 30,
      deleteChatOnDefriend: true
    }
  };

  // ============================================================
  // 3. UTILS
  // ============================================================
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const getRetentionMs = () => (state.settings.snapshotRetentionDays || 30) * 86400000;
  const getCookie = name => {
    const parts = `; ${document.cookie}`.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : null;
  };
  const randomDelay = (base, v = 0.3) =>
    Math.floor(Math.random() * (base * 2 * v) + base * (1 - v));
  const parseUsernameFromURL = () => {
    const m = window.location.pathname.match(/^\/([a-zA-Z0-9._]+)/);
    if (m && m[1] && !['explore','reels','stories','direct','accounts'].includes(m[1].toLowerCase())) return m[1];
    return null;
  };
  const isValidUsername = u => /^[a-zA-Z0-9._]{1,30}$/.test(u);
  const isDefaultAvatar = url =>
    url && (url.includes('44884218_345707102882519_2446069589734326272_n.jpg') || url.includes('default'));
  const fmtNum = n => (n == null ? '—' : new Intl.NumberFormat().format(n));
  const fmtTime = ts => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const Storage = {
    get: (k, d = null) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    remove: k => localStorage.removeItem(k)
  };

  const downloadCSV = users => {
    const headers = ['Username','Full Name','User ID','Profile URL','Verified','Private','Followers','Following','Ratio'];
    const rows = users.map(u => {
      const has = u.enriched;
      const ratio = has && u.following_count > 0 ? (u.follower_count / u.following_count).toFixed(2) : 'N/A';
      return [
        u.username, `"${u.full_name || ''}"`, u.id, `https://instagram.com/${u.username}`,
        u.is_verified, u.is_private,
        has ? (u.follower_count || 0) : 'N/A',
        has ? (u.following_count || 0) : 'N/A',
        ratio
      ].join(',');
    });
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `iu_export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendDesktopNotification = (title, body) => {
    if (!state._notificationsGranted) return;
    try { new Notification(title, { body }); } catch (_) {}
  };
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') { state._notificationsGranted = true; return; }
    if (Notification.permission !== 'denied') {
      const r = await Notification.requestPermission();
      state._notificationsGranted = r === 'granted';
    }
  };

  const el = (tag, attrs = {}, children = []) => {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'className') e.className = v;
      else if (k.startsWith('on')) e[k.toLowerCase()] = v;
      else if (k === 'style' && typeof v === 'string') e.style.cssText = v;
      else if (k === 'html') e.innerHTML = v;
      else e[k] = v;
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null || c === false) return;
      if (typeof c === 'string' || typeof c === 'number') e.appendChild(document.createTextNode(String(c)));
      else e.appendChild(c);
    });
    return e;
  };

  // ============================================================
  // 4. INDEXEDDB  (verbatim contract)
  // ============================================================
  const IDB = {
    db: null,
    extractError(e) {
      if (e && e.target && e.target.error) return new Error('DB error: ' + e.target.error.message);
      if (e && e.message) return e;
      return new Error(String(e || 'Unknown DB error'));
    },
    async init() {
      const open = version => new Promise((res, rej) => {
        const req = indexedDB.open(CONFIG.DB_NAME, version);
        req.onupgradeneeded = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('snapshots')) {
            const s = db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
            s.createIndex('userId', 'userId', { unique: false });
            s.createIndex('timestamp', 'timestamp', { unique: false });
          }
          if (!db.objectStoreNames.contains('enriched')) {
            db.createObjectStore('enriched', { keyPath: 'id' });
          }
        };
        req.onsuccess = e => { this.db = e.target.result; res(); };
        req.onerror = e => rej(this.extractError(e));
      });
      try { await open(CONFIG.DB_VERSION); }
      catch (err) {
        const m = (err && err.message ? err.message : String(err)).match(/existing version \((\d+)\)/);
        if (m) { CONFIG.DB_VERSION = Math.max(CONFIG.DB_VERSION, parseInt(m[1], 10)); await open(CONFIG.DB_VERSION); }
        else throw err;
      }
    },
    async saveSnapshot(userId, type, users) {
      if (!this.db) await this.init();
      return new Promise((res, rej) => {
        const tx = this.db.transaction('snapshots', 'readwrite');
        tx.objectStore('snapshots').add({
          userId, type, timestamp: Date.now(), count: users.length,
          data: users.map(u => ({ id: u.id, username: u.username, profile_pic_url: u.profile_pic_url }))
        });
        tx.oncomplete = () => res();
        tx.onerror = e => rej(this.extractError(e));
      });
    },
    async getSnapshots(userId) {
      if (!this.db) await this.init();
      return new Promise((res, rej) => {
        const req = this.db.transaction('snapshots', 'readonly').objectStore('snapshots').index('userId').getAll(userId);
        req.onsuccess = e => res(e.target.result.sort((a,b) => b.timestamp - a.timestamp));
        req.onerror = e => rej(this.extractError(e));
      });
    },
    async deleteSnapshotsOlderThan(cutoff) {
      if (!this.db) await this.init();
      return new Promise((res, rej) => {
        const tx = this.db.transaction('snapshots', 'readwrite');
        const store = tx.objectStore('snapshots');
        const range = IDBKeyRange.upperBound(cutoff);
        const req = store.index('timestamp').openCursor(range);
        let deleted = 0;
        req.onsuccess = e => {
          const c = e.target.result;
          if (c) { store.delete(c.primaryKey); deleted++; c.continue(); }
          else res(deleted);
        };
        req.onerror = e => rej(this.extractError(e));
      });
    },
    async getLatestSnapshot(userId, type) {
      const snaps = await this.getSnapshots(userId);
      const exact = snaps.find(s => s.type === type);
      return exact || (snaps[0] || null);
    },
    async saveEnriched(userId, data) {
      if (!this.db) await this.init();
      return new Promise((res, rej) => {
        const tx = this.db.transaction('enriched', 'readwrite');
        tx.objectStore('enriched').put({ id: userId, ...data, enrichedAt: Date.now() });
        tx.oncomplete = () => res();
        tx.onerror = e => rej(this.extractError(e));
      });
    },
    async getEnriched(userId) {
      if (!this.db) await this.init();
      return new Promise((res, rej) => {
        const req = this.db.transaction('enriched', 'readonly').objectStore('enriched').get(userId);
        req.onsuccess = e => res(e.target.result || null);
        req.onerror = e => rej(this.extractError(e));
      });
    },
    async getAllEnrichedForScan(userId, userList) {
      const en = await this.getEnriched(userId);
      if (!en || !en.users) return {};
      const map = {};
      userList.forEach(u => { if (en.users[u.id]) map[u.id] = en.users[u.id]; });
      return map;
    }
  };

  // ============================================================
  // 5. API  (verbatim endpoints — contract preserved)
  // ============================================================
  const API = {
    userId: getCookie('ds_user_id'),
    csrf:   getCookie('csrftoken'),
    uuid:   null,

    // GraphQL tokens (extracted from page during init)
    fbDtsg: null,
    lsd: null,
    jazoest: null,
    dyn: null,
    s: null,
    hs: null,
    rev: null,
    spinR: null,
    spinB: null,
    spinT: null,
    hsi: null,
    csr: null,
    hsdp: null,
    hblp: null,
    sjsp: null,
    cometReq: '7',
    crn: 'comet.igweb.PolarisDirectInboxRoute',
    ccg: 'GOOD',
    dpr: '1',
    a: '1',
    user: '0',
    reqCounter: 1,

    extractUUID() {
      // 1) Try cookie variants
      let u = getCookie('ig_did') || getCookie('igdid') || getCookie('IG_DID');
      if (u) return u;
      // 2) Scrub HTML for ig_did
      const html = document.documentElement.innerHTML;
      const igm = html.match(/"ig_did"\s*:\s*"([^"]+)"/i);
      if (igm && igm[1]) return igm[1];
      // 3) Fallback: client_session_id from HTML
      const csm = html.match(/"client_session_id"\s*:\s*"([^"]+)"/i);
      if (csm && csm[1]) return csm[1];
      // 4) Last resort — generate a UUID-shaped string
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    },

    initTokens() {
      this.uuid = this.extractUUID();
      const html = document.documentElement.innerHTML;
      const m = (p) => { const r = html.match(p); return r && r[1]; };

      // Try multiple approaches for fb_dtsg
      this.fbDtsg = m(/name="fb_dtsg"\s+value="([^"]+)"/i)
        || m(/"fb_dtsg"\s*:\s*"([^"]+)"/i)
        || m(/fb_dtsg["']?\s*[:=]\s*["']([^"']+)/i)
        || null;

      // Try multiple approaches for lsd
      this.lsd = m(/"lsd"\s*:\s*"([^"]+)"/i)
        || m(/["']lsd["']\s*[:=]\s*["']([^"']+)/i)
        || null;

      // jazoest
      const jm = m(/name="jazoest"\s+value="([^"]+)"/i) || m(/"jazoest"\s*:\s*"([^"]+)"/i) || m(/jazoest["']?\s*[:=]\s*["']([^"']+)/i);
      if (jm) this.jazoest = jm;
      else if (this.userId) this.jazoest = '2' + String(this.userId).split('').map(c => c.charCodeAt(0)).join('');

      // Dynamic fields (relaxed patterns)
      this.dyn   = m(/["']__dyn["']\s*[:=]\s*["']([^"']+)/i) || m(/"__dyn"\s*:\s*"([^"]+)"/i);
      this.s     = m(/["']__s["']\s*[:=]\s*["']([^"']+)/i)   || m(/"__s"\s*:\s*"([^"]+)"/i);
      this.hs    = m(/["']__hs["']\s*[:=]\s*["']([^"']+)/i)  || m(/"__hs"\s*:\s*"([^"]+)"/i);
      this.rev   = m(/["']__rev["']\s*[:=]\s*["']([^"']+)/i) || m(/"__rev"\s*:\s*"([^"]+)"/i);
      this.hsi   = m(/["']__hsi["']\s*[:=]\s*["']([^"']+)/i) || m(/"__hsi"\s*:\s*"([^"]+)"/i);
      this.csr   = m(/["']__csr["']\s*[:=]\s*["']([^"']+)/i) || m(/"__csr"\s*:\s*"([^"]+)"/i);
      this.spinR = m(/["']__spin_r["']\s*[:=]\s*["']?([^"',}\]\s]+)/i) || m(/"__spin_r"\s*:\s*"?(\d+)"?/i);
      this.spinB = m(/["']__spin_b["']\s*[:=]\s*["']([^"']+)/i) || m(/"__spin_b"\s*:\s*"([^"]+)"/i);
      this.spinT = m(/["']__spin_t["']\s*[:=]\s*["']?([^"',}\]\s]+)/i) || m(/"__spin_t"\s*:\s*"?(\d+)"?/i);
      this.hsdp  = m(/["']__hsdp["']\s*[:=]\s*["']([^"']+)/i) || m(/"__hsdp"\s*:\s*"([^"]+)"/i);
      this.hblp  = m(/["']__hblp["']\s*[:=]\s*["']([^"']+)/i) || m(/"__hblp"\s*:\s*"([^"]+)"/i);
      this.sjsp  = m(/["']__sjsp["']\s*[:=]\s*["']([^"']+)/i) || m(/"__sjsp"\s*:\s*"([^"]+)"/i);

      this.dpr   = String(window.devicePixelRatio || 1);

      // Extra fallback: try to find tokens in the __NEXT_DATA__ or similar globals
      if (!this.fbDtsg || !this.lsd) {
        const scripts = document.querySelectorAll('script[type="text\/javascript"]');
        for (const sc of scripts) {
          const t = sc.textContent || '';
          if (t.includes('fb_dtsg') && !this.fbDtsg) {
            const fm = t.match(/fb_dtsg["']?\s*[:=]\s*["']([^"']+)/i);
            if (fm) this.fbDtsg = fm[1];
          }
          if (t.includes('lsd') && !this.lsd) {
            const lm = t.match(/["']lsd["']\s*[:=]\s*["']([^"']+)/i);
            if (lm) this.lsd = lm[1];
          }
          if (this.fbDtsg && this.lsd) break;
        }
      }

      // Last resort fallbacks
      if (!this.fbDtsg) {
        // Try localStorage or __INITIAL_STATE__
        try {
          const is = window.__INITIAL_STATE__ || JSON.parse(localStorage.getItem('i'));
          if (is && is.fb_dtsg) this.fbDtsg = is.fb_dtsg;
        } catch {}
      }

      console.log('[IU] initTokens: uuid=' + (this.uuid ? this.uuid.slice(0, 8) + '…' : 'NONE') + ' fbDtsg=' + !!this.fbDtsg + ' lsd=' + !!this.lsd);
    },

    isLoggedIn() { return !!this.userId && !!this.csrf; },
    isOwnAccount(targetUserId) { return this.userId === targetUserId; },

    async getUserByUsername(username) {
      const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
      let res;
      try {
        res = await fetch(url, {
          headers: {
            'x-ig-app-id': '936619743392459',
            'x-asbd-id': '129477',
            'x-requested-with': 'XMLHttpRequest',
            'x-csrftoken': this.csrf
          },
          credentials: 'include'
        });
      } catch (e) {
        throw new Error('Network blocked — disable ad blocker / VPN / tracking protection on instagram.com and retry.');
      }
      if (!res.ok) throw new Error(res.status === 404 ? 'User not found' : res.status === 401 || res.status === 403 ? 'Not logged in or session expired — refresh instagram.com and log in.' : `HTTP ${res.status}`);

      const data = await res.json();
      if (!data.data || !data.data.user) throw new Error('User not found');
      const u = data.data.user;
      return {
        id: u.id, username: u.username, full_name: u.full_name,
        profile_pic_url: u.profile_pic_url, is_private: u.is_private,
        is_verified: u.is_verified,
        follower_count: u.edge_followed_by?.count || 0,
        following_count: u.edge_follow?.count || 0
      };
    },

    async _fetchFriendshipList(userId, kind, cursor = null) {
      // Instagram deprecated the old graphql query_hash endpoints (they now 401/403).
      // Use the v1 friendships endpoint and normalize into the legacy {edges,page_info} shape.
      const params = new URLSearchParams({ count: '50' });
      if (cursor) params.set('max_id', cursor);
      const url = `https://www.instagram.com/api/v1/friendships/${userId}/${kind}/?${params.toString()}`;
      let res;
      try {
        res = await fetch(url, {
          headers: {
            'x-ig-app-id': '936619743392459',
            'x-asbd-id': '129477',
            'x-requested-with': 'XMLHttpRequest',
            'x-csrftoken': this.csrf
          },
          credentials: 'include'
        });
      } catch (e) {
        throw new Error('Network blocked — disable ad blocker / VPN on instagram.com and retry.');
      }
      if (!res.ok) throw new Error(res.status === 429 ? 'Rate limited — wait a few minutes.' : res.status === 401 || res.status === 403 ? 'Session expired — refresh instagram.com.' : `HTTP ${res.status}`);
      const data = await res.json();
      if (data.status && data.status !== 'ok') throw new Error(data.message || 'Instagram API error');

      const users = data.users || [];
      const nodes = users.map(u => ({
        id: String(u.pk || u.pk_id || u.id),
        username: u.username,
        full_name: u.full_name || '',
        profile_pic_url: u.profile_pic_url,
        is_private: !!u.is_private,
        is_verified: !!u.is_verified
      }));
      return {
        edges: nodes.map(n => ({ node: n })),
        page_info: {
          has_next_page: !!data.next_max_id,
          end_cursor: data.next_max_id || null
        }
      };
    },

    async getFollowing(userId, cursor = null) {
      return this._fetchFriendshipList(userId, 'following', cursor);
    },

    async getFollowers(userId, cursor = null) {
      return this._fetchFriendshipList(userId, 'followers', cursor);
    },

    async unfollow(userId) {
      const attempts = [
        { url: `https://www.instagram.com/api/v1/friendships/destroy/${userId}/`, v1: true },
        { url: `https://www.instagram.com/web/friendships/${userId}/unfollow/`, v1: false }
      ];
      for (const a of attempts) {
        try {
          const res = await fetch(a.url, {
            method: 'POST',
            headers: a.v1
              ? { 'content-type': 'application/x-www-form-urlencoded', 'x-csrftoken': this.csrf, 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest' }
              : { 'content-type': 'application/x-www-form-urlencoded', 'x-csrftoken': this.csrf },
            credentials: 'include'
          });
          if (res.ok) return true;
        } catch {}
      }
      return false;
    },

    async removeFollower(userId) {
      const attempts = [
        `https://www.instagram.com/api/v1/friendships/remove_follower/${userId}/`,
        `https://i.instagram.com/api/v1/friendships/remove_follower/${userId}/`,
        `https://www.instagram.com/web/friendships/${userId}/remove_follower/`
      ];
      for (const url of attempts) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-csrftoken': this.csrf, 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest' },
            credentials: 'include'
          });
          if (res.ok) {
            const txt = await res.text().catch(() => '');
            if (!txt || !/login|error/i.test(txt.slice(0, 200))) return true;
          }
        } catch {}
      }
      return false;
    },

    async getThreadInfoForUser(userId) {
      // 1) Primary: get_by_participants
      try {
        console.log('[IU] getThreadInfoForUser primary lookup for', userId);
        const res = await fetch(`https://www.instagram.com/api/v1/direct_v2/threads/get_by_participants/?recipient_users=[${userId}]`, {
          headers: {
            'x-ig-app-id': '936619743392459',
            'x-requested-with': 'XMLHttpRequest',
            'x-csrftoken': this.csrf,
            'x-asbd-id': '129477'
          },
          credentials: 'include'
        });
        console.log('[IU] getThreadInfoForUser primary status', res.status);
        if (res.ok) {
          const data = await res.json();
          const thread = data?.thread;
          if (thread) {
            const info = { threadId: thread.thread_id, threadFbid: thread.thread_v2_id || thread.thread_id };
            console.log('[IU] getThreadInfoForUser found via primary', info);
            return info;
          }
        }
      } catch (e) {
        console.warn('[IU] getThreadInfoForUser primary failed', e);
      }

      // 2) Fallback: scan inbox pages (up to 20 pages = 400 threads)
      try {
        let cursor = '';
        for (let page = 0; page < 20; page++) {
          const url = `https://www.instagram.com/api/v1/direct_v2/inbox/?visual_message_return_type=unseen&thread_message_limit=1&persistentBadging=true&limit=20&folder=0${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
          console.log('[IU] getThreadInfoForUser inbox page', page + 1);
          const res = await fetch(url, {
            headers: {
              'x-ig-app-id': '936619743392459',
              'x-requested-with': 'XMLHttpRequest',
              'x-csrftoken': this.csrf
            },
            credentials: 'include'
          });
          console.log('[IU] getThreadInfoForUser inbox status', res.status);
          if (!res.ok) {
            console.warn('[IU] getThreadInfoForUser inbox failed at page', page + 1, res.status);
            return null;
          }
          const data = await res.json();
          const threads = data?.inbox?.threads || [];
          // Match by pk, user_id, or any user field containing the target userId
          const t = threads.find(t =>
            t.users && t.users.some(u =>
              String(u.pk) === String(userId) ||
              String(u.id) === String(userId) ||
              String(u.user_id) === String(userId)
            )
          );
          if (t) {
            const info = { threadId: t.thread_id, threadFbid: t.thread_v2_id || t.thread_id };
            console.log('[IU] getThreadInfoForUser found via inbox', info);
            return info;
          }
          if (!data?.inbox?.has_older) {
            console.log('[IU] getThreadInfoForUser no more inbox pages');
            return null;
          }
          cursor = data.inbox.oldest_cursor || '';
          if (!cursor) return null;
        }
        console.warn('[IU] getThreadInfoForUser reached max 20 inbox pages without finding', userId);
      } catch (e) {
        console.error('[IU] getThreadInfoForUser inbox failed', e);
      }

      console.warn('[IU] getThreadInfoForUser no thread for', userId);
      return null;
    },

    async deleteChatByUserIdGraphQL(userId) {
      try {
        console.log('[IU] deleteChatByUserIdGraphQL for', userId);
        const info = await this.getThreadInfoForUser(userId);
        if (!info || !info.threadFbid) {
          console.warn('[IU] deleteChatByUserIdGraphQL no thread for', userId);
          return false;
        }
        console.log('[IU] deleteChatByUserIdGraphQL threadFbid', info.threadFbid);

        const body = new URLSearchParams();
        body.set('av', this.userId);
        body.set('__d', 'www');
        body.set('__user', this.user);
        body.set('__a', this.a);
        body.set('__req', String(this.reqCounter++));
        body.set('__hs', this.hs || '');
        body.set('dpr', this.dpr);
        body.set('__ccg', this.ccg);
        body.set('__rev', this.rev || '');
        body.set('__s', this.s || '');
        body.set('__hsi', this.hsi || '');
        body.set('__dyn', this.dyn || '');
        body.set('__csr', this.csr || '');
        body.set('__hsdp', this.hsdp || '');
        body.set('__hblp', this.hblp || '');
        body.set('__sjsp', this.sjsp || '');
        body.set('__comet_req', this.cometReq);
        body.set('fb_dtsg', this.fbDtsg || '');
        body.set('jazoest', this.jazoest || '');
        body.set('lsd', this.lsd || '');
        body.set('__spin_r', this.spinR || '');
        body.set('__spin_b', this.spinB || '');
        body.set('__spin_t', this.spinT || '');
        body.set('__crn', this.crn);
        body.set('fb_api_caller_class', 'RelayModern');
        body.set('fb_api_req_friendly_name', 'IGDInboxInfoDeleteThreadDialogOffMsysMutation');
        body.set('server_timestamps', 'true');
        body.set('variables', JSON.stringify({ thread_fbid: info.threadFbid, should_move_future_requests_to_spam: false }));
        body.set('doc_id', '35352443081068612');

        const res = await fetch('https://www.instagram.com/api/graphql', {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-csrftoken': this.csrf,
            'x-fb-friendly-name': 'IGDInboxInfoDeleteThreadDialogOffMsysMutation',
            'x-fb-lsd': this.lsd || '',
            'x-ig-app-id': '936619743392459',
            'x-asbd-id': '359341',
            'x-requested-with': 'XMLHttpRequest'
          },
          body: body.toString(),
          credentials: 'include'
        });
        console.log('[IU] deleteChatByUserIdGraphQL status', res.status);
        if (!res.ok) return false;
        const text = await res.text();
        // Strip the "for (;;);" anti-CSRF prefix that Instagram prepends to GraphQL responses
        const jsonText = text.replace(/^for\s*\(\s*;\s*;\s*\)\s*;/, '');
        let data;
        try {
          data = JSON.parse(jsonText);
        } catch (e) {
          console.error('[IU] deleteChatByUserIdGraphQL JSON parse error', e, jsonText.slice(0, 200));
          return false;
        }
        if (data.errors) {
          console.warn('[IU] deleteChatByUserIdGraphQL errors', data.errors);
          return false;
        }
        console.log('[IU] deleteChatByUserIdGraphQL success', info.threadFbid);
        return true;
      } catch (e) {
        console.error('[IU] deleteChatByUserIdGraphQL error', e);
        return false;
      }
    },

    async deleteChatByUserId(userId) {
      try {
        console.log('[IU] deleteChatByUserId for', userId);
        const graphqlOk = await this.deleteChatByUserIdGraphQL(userId);
        if (graphqlOk) {
          console.log('[IU] deleteChatByUserId success via GraphQL', userId);
          return true;
        }
        console.warn('[IU] deleteChatByUserId GraphQL failed for', userId);
        return false;
      } catch (e) {
        console.error('[IU] deleteChatByUserId unexpected error', e);
        return false;
      }
    },

    async getThreadMessages(threadId, maxMessages = 1000) {
      try {
        const all = [];
        let cursor = null;
        while (all.length < maxMessages) {
          const url = `https://www.instagram.com/api/v1/direct_v2/threads/${threadId}/?cursor=${cursor || ''}&limit=50`;
          console.log('[IU] getThreadMessages', url);
          const res = await fetch(url, {
            headers: { 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest', 'x-csrftoken': this.csrf },
            credentials: 'include'
          });
          console.log('[IU] getThreadMessages status', res.status);
          if (!res.ok) break;
          const data = await res.json();
          const items = data?.thread?.items || [];
          if (!items.length) break;
          const mine = items.filter(it => String(it.user_id) === String(this.userId));
          all.push(...mine);
          if (!data.thread?.has_older) break;
          cursor = data.thread.oldest_cursor;
          if (!cursor) break;
          await sleep(500);
        }
        console.log('[IU] getThreadMessages got', all.length, 'items');
        return all;
      } catch (e) {
        console.error('[IU] getThreadMessages error', e);
        return [];
      }
    },

    async unsendMessage(threadId, itemId) {
      try {
        const url = `https://www.instagram.com/api/v1/direct_v2/threads/${threadId}/items/${itemId}/delete/`;
        const body = new URLSearchParams({
          _csrftoken: this.csrf,
          _uuid: this.uuid
        }).toString();
        console.log('[IU] unsendMessage POST', url);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-csrftoken': this.csrf, 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest' },
          body,
          credentials: 'include'
        });
        console.log('[IU] unsendMessage status', res.status);
        return res.ok;
      } catch (e) {
        console.error('[IU] unsendMessage error', e);
        return false;
      }
    },

    async unsendAllMessagesWithUser(userId, maxMessages = 1000) {
      try {
        console.log('[IU] unsendAllMessagesWithUser for', userId);
        const info = await this.getThreadInfoForUser(userId);
        if (!info || !info.threadId) {
          console.warn('[IU] unsendAllMessagesWithUser no thread', userId);
          return { unsent: 0, total: 0 };
        }
        const threadId = info.threadId;
        const items = await this.getThreadMessages(threadId, maxMessages);
        if (!items.length) {
          console.log('[IU] unsendAllMessagesWithUser no messages to unsend');
          return { unsent: 0, total: 0 };
        }
        let unsent = 0;
        for (const it of items) {
          const ok = await this.unsendMessage(threadId, it.item_id);
          if (ok) unsent++;
          await sleep(randomDelay(1000));
        }
        console.log('[IU] unsendAllMessagesWithUser unsent', unsent, 'of', items.length);
        const hid = await this.deleteChatByUserId(userId);
        console.log('[IU] unsendAllMessagesWithUser hide result', hid);
        return { unsent, total: items.length, hid };
      } catch (e) {
        console.error('[IU] unsendAllMessagesWithUser error', e);
        return { unsent: 0, total: 0, hid: false };
      }
    }

  };

  // ============================================================
  // 6. LIMIT GUARDIAN
  // ============================================================
  const LimitGuardian = {
    check() {
      const a = Storage.get(CONFIG.LIMITS_KEY, []);
      const valid = a.filter(t => Date.now() - t < 86400000);
      Storage.set(CONFIG.LIMITS_KEY, valid);
      return valid.length < CONFIG.MAX_ACTIONS_24H;
    },
    record() {
      const a = Storage.get(CONFIG.LIMITS_KEY, []);
      a.push(Date.now());
      Storage.set(CONFIG.LIMITS_KEY, a);
    },
    count() {
      return Storage.get(CONFIG.LIMITS_KEY, []).filter(t => Date.now() - t < 86400000).length;
    }
  };

  // ============================================================
  // 7. QUEUE MANAGER
  // ============================================================
  const QueueManager = {
    interval: null,
    _running: false,
    start() {
      if (this.interval) clearInterval(this.interval);
      this.interval = setInterval(() => this.tick(), 30000);
      setTimeout(() => this.tick(), 500);
    },
    async tick() {
      if (this._running) return;
      if (!state.settings.enableQueue) return;
      const q = Storage.get(CONFIG.QUEUE_KEY, []);
      const my = q.filter(t => t.ownerId === API.userId);
      if (my.length === 0) { state.queueCurrent = null; return; }
      const task = my[0];
      if (!LimitGuardian.check()) {
        sendDesktopNotification('Action Queue', 'Queue paused: 24h action limit reached.');
        state.settings.enableQueue = false;
        Storage.set(CONFIG.SETTINGS_KEY, state.settings);
        showToast('Queue auto-paused: action limit reached', 'error');
        queueLog('Auto-paused: 24h limit reached', 'error');
        renderApp();
        return;
      }
      this._running = true;
      state.queueCurrent = { ...task, startedAt: Date.now(), status: 'running' };
      queueLog(`▶ ${task.action} @${task.username}`, 'run');
      renderApp();
      try {
        let ok = false;
        if (task.action === 'unfollow') ok = await API.unfollow(task.targetId);
        else if (task.action === 'remove') ok = await API.removeFollower(task.targetId);
        else if (task.action === 'defriend') {
          const uf = await API.unfollow(task.targetId);
          queueLog(`  unfollow @${task.username}: ${uf ? 'ok' : 'fail'}`, uf ? 'ok' : 'fail');
          await sleep(1500);
          const rm = await API.removeFollower(task.targetId);
          queueLog(`  remove @${task.username}: ${rm ? 'ok' : 'fail'}`, rm ? 'ok' : 'fail');
          let dc = true;
          if (state.settings.deleteChatOnDefriend) {
            await sleep(1500);
            dc = await API.deleteChatByUserId(task.targetId);
            queueLog(`  chat @${task.username}: ${dc ? 'deleted' : 'none'}`, dc ? 'ok' : 'info');
          } else {
            queueLog(`  chat @${task.username}: skipped (setting off)`, 'info');
          }
          ok = uf && rm;
          console.log(`[IU] defriend @${task.username}: unfollow=${uf} remove=${rm} chat=${dc}`);
          if (!rm) showToast(`Remove-follower failed for @${task.username}`, 'warn');
          if (state.settings.deleteChatOnDefriend && !dc) showToast(`No chat found for @${task.username}`, 'info');
        }
        if (!ok && task.action !== 'defriend') showToast(`${task.action} failed for @${task.username}`, 'error');
        queueLog(`${ok ? '✓' : '✗'} ${task.action} @${task.username}`, ok ? 'ok' : 'fail');
        LimitGuardian.record();
        const q2 = Storage.get(CONFIG.QUEUE_KEY, []);
        const newQ = q2.filter(t => !(t.targetId === task.targetId && t.action === task.action));
        Storage.set(CONFIG.QUEUE_KEY, newQ);
        state.queueCurrent = null;
        if (newQ.filter(t => t.ownerId === API.userId).length === 0) {
          sendDesktopNotification('Action Queue', 'All queued actions completed.');
          queueLog('Queue empty — all done', 'ok');
        }
        renderApp();
        await sleep(randomDelay(state.settings.unfollowDelay));
      } catch (e) {
        console.error('Queue task failed', e);
        queueLog(`✗ ${task.action} @${task.username}: ${e.message || 'error'}`, 'fail');
        state.queueCurrent = null;
        renderApp();
      } finally {
        this._running = false;
        // chain to next task immediately if more remain
        const remaining = Storage.get(CONFIG.QUEUE_KEY, []).filter(t => t.ownerId === API.userId);
        if (remaining.length > 0 && state.settings.enableQueue) {
          setTimeout(() => this.tick(), 300);
        }
      }
    },
    add(targets, action = 'unfollow') {
      const q = Storage.get(CONFIG.QUEUE_KEY, []);
      let added = 0;
      targets.forEach(t => {
        if (!q.some(x => x.targetId === t.id && x.action === action)) {
          q.push({ targetId: t.id, username: t.username, action, ownerId: API.userId, timestamp: Date.now() });
          added++;
        }
      });
      Storage.set(CONFIG.QUEUE_KEY, q);
      queueLog(`+ queued ${added} × ${action}`, 'info');
      showToast(`Added ${added} to background queue`, 'success');
      renderApp();
      // kick immediately
      setTimeout(() => this.tick(), 200);
    },
    clear() {
      const q = Storage.get(CONFIG.QUEUE_KEY, []);
      Storage.set(CONFIG.QUEUE_KEY, q.filter(t => t.ownerId !== API.userId));
      queueLog('Queue cleared', 'info');
      renderApp();
    },
    count() {
      return Storage.get(CONFIG.QUEUE_KEY, []).filter(t => t.ownerId === API.userId).length;
    },
    list() {
      return Storage.get(CONFIG.QUEUE_KEY, []).filter(t => t.ownerId === API.userId);
    },
    remove(targetId, action) {
      const q = Storage.get(CONFIG.QUEUE_KEY, []);
      Storage.set(CONFIG.QUEUE_KEY, q.filter(t => !(t.targetId === targetId && t.action === action && t.ownerId === API.userId)));
      queueLog(`− removed ${action} for target`, 'info');
      renderApp();
    },
    runNow() { this.tick(); }
  };



  // ============================================================
  // 8. ENRICHMENT
  // ============================================================
  async function startEnrichment() {
    if (state.enriching || state.results.length === 0) return;
    state.enrichQueue = state.results.filter(u => !u.enriched).map(u => u.id);
    state.enrichDone = 0;
    state.enrichTotal = state.enrichQueue.length;
    state.enriching = true;
    renderApp();
    showToast(`Enriching ${state.enrichTotal} users...`, 'info');
    enricherLoop();
  }
  async function enricherLoop() {
    while (state.enrichQueue.length > 0) {
      if (!state.enriching) break;
      const uid = state.enrichQueue.shift();
      const u = state.results.find(x => x.id === uid);
      if (u && !u.enriched) {
        try {
          const d = await API.getUserByUsername(u.username);
          u.follower_count = d.follower_count;
          u.following_count = d.following_count;
          u.enriched = true;
          const ex = await IDB.getEnriched(state.targetUser.id) || { users: {} };
          ex.users[u.id] = { follower_count: d.follower_count, following_count: d.following_count };
          await IDB.saveEnriched(state.targetUser.id, { users: ex.users });
        } catch { /* skip */ }
      }
      state.enrichDone++;
      renderApp();
      await sleep(randomDelay(3000));
    }
    state.enriching = false;
    renderApp();
    showToast(`Enrichment complete: ${state.enrichDone} users`, 'success');
  }
  async function cleanupOldSnapshots() {
    const deleted = await IDB.deleteSnapshotsOlderThan(Date.now() - getRetentionMs());
    if (deleted > 0) console.log(`[Retention] Cleaned ${deleted} old snapshot(s)`);
    return deleted;
  }
  async function mergeEnrichedData() {
    const all = [...state.following, ...state.followers];
    if (all.length === 0) return;
    const map = await IDB.getAllEnrichedForScan(state.targetUser.id, all);
    all.forEach(u => {
      if (map[u.id]) {
        u.follower_count = map[u.id].follower_count;
        u.following_count = map[u.id].following_count;
        u.enriched = true;
      }
    });
  }

  // ============================================================
  // 9. STATE
  // ============================================================
  let _lastRenderTime = 0;
  let state = {
    status: 'initial',                              // 'initial' | 'loading' | 'scanning' | 'error'
    targetUsername: parseUsernameFromURL() || '',
    targetUser: null,
    following: [], followers: [], results: [], selected: [],
    whitelist: Storage.get(CONFIG.STORAGE_KEY, []),
    tab: 'main',                                    // 'main' | 'whitelist' | 'dashboard'
    search: '',
    page: 1,
    pct: 0,
    scanStartTime: null,
    totalCount: 0,
    scanHistory: [],
    settings: { ...CONFIG.DEFAULT_SETTINGS, ...Storage.get(CONFIG.SETTINGS_KEY, {}) },

    _notificationsGranted: false,
    showSettings: false,
    toast: null,
    error: null,
    filter: { verified: true, private: true, noAvatar: false, highSpam: false },
    scanMode: 'non_followers',
    snapshots: [], snapshotSelection: [], compareResult: null,
    enriching: false, enrichQueue: [], enrichDone: 0, enrichTotal: 0,
    scanPhase: '',
    queueCurrent: null, queueLog: [], queueOpen: false,
    actionProgress: null   // { label, current, done, total } | null
  };

  function queueLog(msg, type = 'info') {
    state.queueLog.unshift({ msg, type, ts: Date.now() });
    if (state.queueLog.length > 60) state.queueLog.length = 60;
  }


  // ============================================================
  // 10. HELPERS
  // ============================================================
  const MODES = [
    { id: 'non_followers',     label: 'Non-Followers',      desc: "People you follow who don't follow you back." },
    { id: 'mutuals',           label: 'Mutuals',            desc: 'Accounts you both follow each other.' },
    { id: 'fans',              label: 'Fans',               desc: "People who follow you but you don't follow back." },
    { id: 'following',         label: 'Following',          desc: 'Everyone you currently follow.' },
    { id: 'followers',         label: 'Followers',          desc: 'Everyone who currently follows you.' },
    { id: 'recent_unfollowers',label: 'New Unfollowers',    desc: 'Accounts that unfollowed since last snapshot.' },
    { id: 'deactivated',       label: 'Deactivated',        desc: 'Following accounts that no longer exist.' }
  ];

  function addScanLog(msg) {
    state.scanHistory.push({ msg, time: Date.now() });
    if (state.scanHistory.length > 100) state.scanHistory.shift();
  }
  function formatETA(ms) {
    if (ms <= 0 || !isFinite(ms)) return '';
    if (ms < 60000) return Math.ceil(ms / 1000) + 's';
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }
  function computeETA() {
    if (!state.scanStartTime || state.pct <= 1) return null;
    const el = Date.now() - state.scanStartTime;
    return formatETA((el / state.pct) * (100 - state.pct));
  }
  function updateScanProgress() {
    const app = document.querySelector('.iu-app');
    if (!app) return;
    const fill = app.querySelector('.iu-progress-fill');
    if (fill) fill.style.width = Math.round(state.pct || 0) + '%';
    const meta = app.querySelector('.iu-progress-meta');
    if (meta) {
      const eta = computeETA();
      const phaseEl = meta.querySelector('[data-phase]');
      const etaEl = meta.querySelector('[data-eta]');
      const pctEl = meta.querySelector('[data-pct]');
      if (phaseEl) phaseEl.textContent = state.scanPhase || 'Working';
      if (etaEl) etaEl.textContent = eta ? `ETA ${eta}` : '';
      if (pctEl) pctEl.textContent = Math.round(state.pct || 0) + '%';
    }
  }
  function getFilteredUsers() {
    return state.results.filter(u => {
      const wl = state.whitelist.some(w => w.id === u.id);
      if (state.tab === 'whitelist' && !wl) return false;
      if (state.tab === 'main' && wl) return false;
      if (state.search && !u.username.toLowerCase().includes(state.search.toLowerCase())) return false;
      if (!state.filter.verified && u.is_verified) return false;
      if (!state.filter.private && u.is_private) return false;
      const spam = u.following_count > 5000 && u.follower_count < 50;
      if (state.filter.highSpam && !spam) return false;
      if (state.filter.noAvatar && !isDefaultAvatar(u.profile_pic_url)) return false;
      return true;
    }).sort((a, b) => a.username.localeCompare(b.username));
  }
  function getPageUsers(users) {
    return users.slice((state.page - 1) * CONFIG.USERS_PER_PAGE, state.page * CONFIG.USERS_PER_PAGE);
  }
  function computeResults(mode, following, followers, oldSnap) {
    if (mode === 'following') return [...following];
    if (mode === 'followers') return [...followers];
    if (mode === 'non_followers') { const fids = new Set(followers.map(f => String(f.id))); return following.filter(f => !fids.has(String(f.id))); }
    if (mode === 'mutuals')       { const fids = new Set(followers.map(f => String(f.id))); return following.filter(f =>  fids.has(String(f.id))); }
    if (mode === 'fans')          { const gids = new Set(following.map(f => String(f.id))); return followers.filter(f => !gids.has(String(f.id))); }
    if (mode === 'recent_unfollowers' && oldSnap) { const cur = new Set(followers.map(f => String(f.id))); return (oldSnap.data || []).filter(u => !cur.has(u.id)); }
    if (mode === 'deactivated'         && oldSnap) { const cur = new Set(following.map(f => String(f.id))); return (oldSnap.data || []).filter(u => !cur.has(u.id)); }
    return [];
  }
  function toggleWhitelist(user) {
    const has = state.whitelist.some(u => u.id === user.id);
    state.whitelist = has ? state.whitelist.filter(u => u.id !== user.id) : [...state.whitelist, user];
    Storage.set(CONFIG.STORAGE_KEY, state.whitelist);
    renderApp();
  }
  function showToast(msg, type = 'info') {
    state.toast = { msg, type };
    renderApp();
    setTimeout(() => { state.toast = null; renderApp(); }, 5000);
  }
  function saveSettings(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.settings = {
      searchDelay: +fd.get('searchDelay') || 1000,
      unfollowDelay: +fd.get('unfollowDelay') || 4000,
      snapshotRetentionDays: +fd.get('snapshotRetentionDays') || 30,
      enableQueue: fd.get('enableQueue') === 'on',
      autoWhitelistVerified: fd.get('autoWhitelistVerified') === 'on',
      autoWhitelistPrivate: fd.get('autoWhitelistPrivate') === 'on',
      deleteChatOnDefriend: fd.get('deleteChatOnDefriend') === 'on'
    };
    Storage.set(CONFIG.SETTINGS_KEY, state.settings);
    state.showSettings = false;
    showToast('Settings saved', 'success');
  }
  async function loadSnapshots() {
    if (!state.targetUser) return;
    try {
      state.snapshots = await IDB.getSnapshots(state.targetUser.id);
      state.snapshotSelection = [];
      state.compareResult = null;
    } catch { /* silent */ }
    renderApp();
  }
  function compareSnapshots(a, b) {
    const ua = a.data || [], ub = b.data || [];
    const ida = new Set(ua.map(u => u.id)), idb = new Set(ub.map(u => u.id));
    return { new: ub.filter(u => !ida.has(u.id)), removed: ua.filter(u => !idb.has(u.id)), common: ub.filter(u => ida.has(u.id)) };
  }
  function toggleSnapshotSelection(id) {
    const i = state.snapshotSelection.indexOf(id);
    if (i >= 0) state.snapshotSelection.splice(i, 1);
    else {
      if (state.snapshotSelection.length >= 2) state.snapshotSelection.shift();
      state.snapshotSelection.push(id);
    }
    state.compareResult = null;
    renderApp();
  }
  function runComparison() {
    if (state.snapshotSelection.length !== 2) return;
    const [ia, ib] = state.snapshotSelection;
    const a = state.snapshots.find(s => s.id === ia);
    const b = state.snapshots.find(s => s.id === ib);
    if (!a || !b) return;
    state.compareResult = { snapA: a, snapB: b, result: compareSnapshots(a, b) };
    renderApp();
  }

  // ============================================================
  // 11. SCAN ORCHESTRATOR
  // ============================================================
  async function loadTargetProfile() {
    if (!isValidUsername(state.targetUsername)) {
      showToast('Enter a valid username', 'error');
      return;
    }
    state.status = 'loading';
    renderApp();
    try {
      state.targetUser = await API.getUserByUsername(state.targetUsername);
      await runScan();
    } catch (err) {
      state.status = 'error';
      state.error = err?.message || String(err);
      renderApp();
    }
  }

  async function runScan() {
    state.status = 'scanning';
    state.results = []; state.following = []; state.followers = [];
    state.pct = 0;
    state.totalCount = state.targetUser.following_count + state.targetUser.follower_count;
    state.scanStartTime = Date.now();
    state.scanHistory = [];
    state.scanPhase = 'Starting';
    addScanLog(`Scan started: ${state.scanMode.replace(/_/g,' ')}`);
    renderApp();

    try {
      if (state.scanMode === 'recent_unfollowers' || state.scanMode === 'deactivated') {
        const need = state.scanMode === 'deactivated' ? 'following' : 'followers';
        state.scanPhase = 'Loading snapshot';
        addScanLog(`Checking ${need} snapshot...`);
        const snap = await IDB.getLatestSnapshot(state.targetUser.id, need);
        if (!snap) {
          state.status = 'error';
          state.error = 'No snapshots found. Run a full scan first to establish a baseline.';
          renderApp();
          return;
        }
        if (snap.type !== need) showToast(`Using fallback snapshot type: ${snap.type}`, 'warning');
        state._oldSnap = snap;
        addScanLog(`Loaded snapshot from ${new Date(snap.timestamp).toLocaleDateString()}`);
      }

      const needG = ['following','non_followers','mutuals','fans','deactivated'].includes(state.scanMode);
      const needF = ['followers','non_followers','mutuals','fans','recent_unfollowers'].includes(state.scanMode);
      if (needG) await fetchList('following');
      if (needF) await fetchList('followers');

      if (state.scanMode === 'deactivated') {
        const missing = computeResults(state.scanMode, state.following, null, state._oldSnap);
        state.results = [];
        for (let i = 0; i < missing.length; i++) {
          try { await API.getUserByUsername(missing[i].username); }
          catch (err) {
            const m = err?.message || '';
            if (m.includes('not found') || m.includes('404')) state.results.push({ ...missing[i], __deactivated: true });
          }
          state.pct = Math.floor(60 + ((i + 1) / missing.length) * 35);
          updateScanProgress();
          if (i < missing.length - 1) await sleep(randomDelay(2000));
        }
      } else {
        state.results = computeResults(state.scanMode, state.following, state.followers, state._oldSnap);
      }

      await mergeEnrichedData();
      delete state._oldSnap;

      // auto-whitelist
      const auto = state.results.filter(u =>
        (state.settings.autoWhitelistVerified && u.is_verified) ||
        (state.settings.autoWhitelistPrivate && u.is_private)
      ).filter(u => !state.whitelist.some(w => w.id === u.id));
      if (auto.length) {
        state.whitelist = [...state.whitelist, ...auto];
        Storage.set(CONFIG.STORAGE_KEY, state.whitelist);
      }

      state.pct = 100;
      state.scanPhase = 'Saving';
      if (needG && state.following.length) { await IDB.saveSnapshot(state.targetUser.id, 'following', state.following); addScanLog(`Saved following snapshot (${state.following.length})`); }
      if (needF && state.followers.length) { await IDB.saveSnapshot(state.targetUser.id, 'followers', state.followers); addScanLog(`Saved followers snapshot (${state.followers.length})`); }
      if (!['recent_unfollowers','deactivated','following','followers'].includes(state.scanMode)) {
        await IDB.saveSnapshot(state.targetUser.id, state.scanMode, state.results);
        addScanLog(`Saved ${state.scanMode} snapshot`);
      }

      state.scanPhase = '';
      addScanLog(`Scan complete: ${state.results.length} accounts`);
      renderApp();
      const label = MODES.find(m => m.id === state.scanMode)?.label || state.scanMode;
      showToast(`${label} — ${state.results.length} results`, 'success');
      sendDesktopNotification('Scan complete', `${label}: ${state.results.length} accounts.`);
    } catch (e) {
      showToast('Scan failed: ' + (e?.message || 'Unknown error'), 'error');
      state.status = 'error';
      state.error = e?.message || String(e);
      renderApp();
    }
  }

  async function fetchList(kind) {
    const isG = kind === 'following';
    const method = isG ? 'getFollowing' : 'getFollowers';
    state.scanPhase = isG ? 'Fetching following' : 'Fetching followers';
    addScanLog(state.scanPhase + '...');
    const combos = isG
      ? ['followers','non_followers','mutuals','fans','recent_unfollowers']
      : ['following','non_followers','mutuals','fans','deactivated'];
    const isCombo = combos.includes(state.scanMode);
    let cursor = null, hasNext = true;
    const bucket = isG ? state.following : state.followers;
    while (hasNext && state.status === 'scanning') {
      const data = await API[method](state.targetUser.id, cursor);
      data.edges.forEach(e => bucket.push(e.node));
      hasNext = data.page_info.has_next_page;
      cursor = data.page_info.end_cursor;
      const total = isCombo ? (state.totalCount || 1) : ((isG ? state.targetUser.following_count : state.targetUser.follower_count) || 1);
      const fetched = isCombo ? (state.following.length + state.followers.length) : bucket.length;
      state.pct = Math.floor((fetched / total) * 100);
      if (state.scanMode === 'deactivated') state.pct = Math.min(state.pct, 60);
      updateScanProgress();
      await sleep(randomDelay(state.settings.searchDelay));
    }
    addScanLog(`Fetched ${bucket.length} ${kind}`);
  }

  function stopScan() {
    state.status = 'initial';
    state.pct = 0;
    state.scanPhase = '';
    showToast('Scan stopped', 'info');
    renderApp();
  }

  // ============================================================
  // 12. RENDERERS
  // ============================================================
  function renderApp() {
    const app = document.querySelector('.iu-app');
    if (!app) return;
    const now = Date.now();
    if (state.status === 'scanning' && now - _lastRenderTime < CONFIG.RENDER_THROTTLE_MS) return;
    _lastRenderTime = now;

    const scroller = app.querySelector('.iu-content');
    const prevScroll = scroller ? scroller.scrollTop : 0;
    const prevWinScroll = window.scrollY;
    const activeEl = document.activeElement;
    const activeSel = activeEl && activeEl.closest && activeEl.closest('.iu-app')
      ? (activeEl.name ? `[name="${activeEl.name}"]` : activeEl.id ? `#${activeEl.id}` : null)
      : null;
    const selStart = activeEl && 'selectionStart' in activeEl ? activeEl.selectionStart : null;
    const selEnd = activeEl && 'selectionEnd' in activeEl ? activeEl.selectionEnd : null;

    app.innerHTML = '';
    app.appendChild(renderHeader());
    const body = el('div', { className: 'iu-content' });
    if      (state.status === 'initial') body.appendChild(renderStart());
    else if (state.status === 'loading') body.appendChild(renderLoading('Loading profile'));
    else if (state.status === 'error')   body.appendChild(renderError());
    else                                 body.appendChild(renderScan());
    app.appendChild(body);

    if (state.toast) app.appendChild(renderToast(state.toast));
    if (state.showSettings) app.appendChild(renderSettings());
    const qc = QueueManager.count();
    if (qc > 0) app.appendChild(renderQueueBadge(qc));

    // Restore scroll + focus so re-renders don't jump the page.
    requestAnimationFrame(() => {
      const newScroller = app.querySelector('.iu-content');
      if (newScroller) newScroller.scrollTop = prevScroll;
      window.scrollTo(0, prevWinScroll);
      if (activeSel) {
        const target = app.querySelector(activeSel);
        if (target) {
          try { target.focus({ preventScroll: true }); } catch { target.focus(); }
          if (selStart != null && 'setSelectionRange' in target) {
            try { target.setSelectionRange(selStart, selEnd); } catch {}
          }
        }
      }
    });
  }

  function renderHeader() {
    const scanning = state.status === 'scanning';
    const has = state.status === 'scanning' || state.status === 'loading';
    return el('header', { className: 'iu-header' }, [
      el('div', { className: 'iu-brand' }, [
        el('div', { className: 'iu-brand-mark' }, ['IU']),
        el('div', { style: 'display:flex; flex-direction:column; gap:2px;' }, [
          el('div', { className: 'iu-brand-name' }, ['Instagram Unfollowers']),
          el('div', { className: 'iu-brand-sub' }, [
            has && state.targetUser ? `@${state.targetUser.username}` : 'v5.0'
          ])
        ])
      ]),
      scanning ? el('div', { className: 'iu-progress-meta' }, [
        el('div', { className: 'iu-dot' }),
        el('span', { 'data-phase': '' }, [state.scanPhase || 'Working']),
        el('span', { 'data-eta': '' }, [computeETA() ? `ETA ${computeETA()}` : '']),
        el('span', { 'data-pct': '' }, [Math.round(state.pct) + '%'])
      ]) : null,
      el('div', { className: 'iu-header-actions' }, [
        state.status === 'scanning' && el('input', {
          className: 'iu-input',
          type: 'search',
          placeholder: 'Search results',
          value: state.search,
          oninput: e => { state.search = e.target.value; state.page = 1; renderApp(); }
        }),
        scanning && el('button', { className: 'iu-btn iu-btn-danger', onclick: stopScan }, ['Stop']),
        state.results.length > 0 && el('button', { className: 'iu-btn', onclick: () => downloadCSV(getFilteredUsers()) }, ['Export CSV']),
        el('button', { className: 'iu-btn iu-btn-ghost', onclick: () => { state.showSettings = true; renderApp(); } }, ['Settings'])
      ]),
      has ? el('div', { className: 'iu-progress' }, [
        el('div', { className: 'iu-progress-fill', style: `width:${Math.round(state.pct)}%;` })
      ]) : null
    ]);
  }

  // ---------- Start screen ----------
  function renderStart() {
    const wrap = el('div', { className: 'iu-start' });

    wrap.appendChild(el('div', { className: 'iu-hero' }, [
      el('div', { className: 'iu-hero-eyebrow' }, ['v5.0  ·  Read-only analysis']),
      el('h1', { className: 'iu-hero-title' }, ['See who follows you back, and who doesn\u2019t.']),
      el('p', { className: 'iu-hero-sub' }, ['Analyze any public Instagram account. Detect non-followers, mutuals, fans, and disappearances over time. Everything runs in your browser — no data leaves this page.']),
      el('div', { className: 'iu-target-bar' }, [
        el('input', {
          className: 'iu-input',
          type: 'text',
          placeholder: 'instagram username',
          value: state.targetUsername,
          onkeydown: e => { if (e.key === 'Enter') loadTargetProfile(); },
          oninput: e => { state.targetUsername = e.target.value.trim().replace(/^@/, ''); }
        }),
        el('button', { className: 'iu-btn iu-btn-primary', onclick: loadTargetProfile }, ['Run analysis'])
      ])
    ]));

    wrap.appendChild(el('div', {}, [
      el('div', { className: 'iu-section-title', style: 'margin-bottom: 16px;' }, ['Scan Mode']),
      el('div', { className: 'iu-modes' }, MODES.map((m, i) => el('button', {
        className: 'iu-mode' + (state.scanMode === m.id ? ' active' : ''),
        onclick: () => { state.scanMode = m.id; renderApp(); }
      }, [
        el('div', { className: 'iu-mode-key' }, [String(i + 1).padStart(2, '0')]),
        el('div', { className: 'iu-mode-label' }, [m.label]),
        el('div', { className: 'iu-mode-desc' }, [m.desc])
      ])))
    ]));

    wrap.appendChild(el('div', { className: 'iu-steps' }, [
      el('div', { className: 'iu-step' }, [
        el('div', { className: 'iu-step-num' }, ['01']),
        el('div', { className: 'iu-step-title' }, ['Choose a target']),
        el('div', { className: 'iu-step-body' }, ['Enter any public Instagram handle. You can analyze your own account or a public one.'])
      ]),
      el('div', { className: 'iu-step' }, [
        el('div', { className: 'iu-step-num' }, ['02']),
        el('div', { className: 'iu-step-title' }, ['Pick a mode']),
        el('div', { className: 'iu-step-body' }, ['Non-followers, mutuals, fans, or time-machine modes that compare against your saved snapshots.'])
      ]),
      el('div', { className: 'iu-step' }, [
        el('div', { className: 'iu-step-num' }, ['03']),
        el('div', { className: 'iu-step-title' }, ['Run and enrich']),
        el('div', { className: 'iu-step-body' }, ['Filter, whitelist, queue actions, or enrich results with per-account stats for spam-ratio detection.'])
      ])
    ]));

    return wrap;
  }

  // ---------- Loading / error ----------
  function renderLoading(msg) {
    return el('div', { className: 'iu-load' }, [ el('div', { className: 'iu-load-spin' }), el('div', {}, [msg || 'Loading']) ]);
  }
  function renderError() {
    return el('div', { className: 'iu-empty', style: 'max-width: 560px; margin: 96px auto;' }, [
      el('strong', {}, ['Something went wrong']),
      el('div', {}, [state.error || 'Unknown error']),
      el('div', { style: 'margin-top: 20px;' }, [
        el('button', { className: 'iu-btn', onclick: () => { state.status = 'initial'; state.error = null; renderApp(); } }, ['Back'])
      ])
    ]);
  }

  // ---------- Scan / results screen ----------
  function renderScan() {
    const wrap = el('div', { style: 'display: flex; flex-direction: column; gap: 24px;' });

    wrap.appendChild(renderMetrics());

    if (state.targetUser) wrap.appendChild(renderProfile());

    wrap.appendChild(el('div', { className: 'iu-scan' }, [
      renderSidebar(),
      renderMain()
    ]));

    return wrap;
  }

  function renderMetrics() {
    const filtered = getFilteredUsers();
    const spam = state.results.filter(u => u.following_count > 5000 && u.follower_count < 50).length;
    return el('div', { className: 'iu-metrics' }, [
      metric('Followers',  fmtNum(state.targetUser?.follower_count)),
      metric('Following',  fmtNum(state.targetUser?.following_count)),
      metric('Found',      fmtNum(state.results.length)),
      metric('Filtered',   fmtNum(filtered.length)),
      metric('Enriched',   `${state.enrichDone}/${state.enrichTotal || state.results.length}`)
    ]);
  }
  function metric(label, value) {
    return el('div', { className: 'iu-metric' }, [
      el('div', { className: 'iu-metric-label' }, [label]),
      el('div', { className: 'iu-metric-value' }, [String(value)])
    ]);
  }

  function renderProfile() {
    const u = state.targetUser;
    return el('div', { className: 'iu-profile' }, [
      el('div', { className: 'iu-avatar' }, [el('img', { src: u.profile_pic_url, alt: '' })]),
      el('div', { className: 'iu-profile-meta' }, [
        el('div', { className: 'iu-profile-name' }, [u.full_name || u.username]),
        el('div', { className: 'iu-profile-sub' }, [`@${u.username}  ·  ${fmtNum(u.follower_count)} followers  ·  ${fmtNum(u.following_count)} following`])
      ])
    ]);
  }

  function renderSidebar() {
    const sb = el('aside', { className: 'iu-sidebar' });

    // Filters
    const filters = [
      ['verified', 'Verified accounts'],
      ['private',  'Private accounts'],
      ['noAvatar', 'Default avatars'],
      ['highSpam', 'High spam ratio']
    ];
    sb.appendChild(el('div', { className: 'iu-panel-block' }, [
      el('h3', {}, ['Filters']),
      ...filters.map(([k, l]) => el('div', { className: 'iu-filter-row' }, [
        el('label', {}, [
          el('input', {
            type: 'checkbox', className: 'iu-check',
            checked: state.filter[k],
            onchange: e => { state.filter[k] = e.target.checked; state.page = 1; renderApp(); }
          }),
          l
        ])
      ]))
    ]));

    // Enrichment
    sb.appendChild(el('div', { className: 'iu-panel-block' }, [
      el('h3', {}, ['Enrichment']),
      el('div', { className: 'iu-mono', style: 'font-size:11px; color:var(--iu-ink-3);' },
        [state.enriching ? `Running: ${state.enrichDone} / ${state.enrichTotal}` : `${state.results.filter(u => u.enriched).length} of ${state.results.length} enriched`]
      ),
      el('button', {
        className: 'iu-btn iu-btn-sm',
        onclick: () => state.enriching ? (state.enriching = false, renderApp()) : startEnrichment(),
        disabled: state.results.length === 0
      }, [state.enriching ? 'Stop enrichment' : 'Enrich stats'])
    ]));

    // Selection / actions
    const filtered = getFilteredUsers();
    const selCount = state.selected.length;
    sb.appendChild(el('div', { className: 'iu-panel-block' }, [
      el('h3', {}, ['Actions']),
      el('div', { className: 'iu-mono', style: 'font-size:11px; color:var(--iu-ink-3);' },
        [`${selCount} selected  ·  ${LimitGuardian.count()}/${CONFIG.MAX_ACTIONS_24H} today`]),

      // ---- Selection ----
      el('div', { className: 'iu-mono', style: 'font-size:9px; color:var(--iu-ink-4); letter-spacing:0.1em; text-transform:uppercase; margin-top:4px;' }, ['Selection']),
      el('div', { style: 'display:flex; flex-wrap:wrap; gap:6px;' }, [
        el('button', { className: 'iu-btn iu-btn-sm', onclick: () => { state.selected = filtered.map(u => u.id); renderApp(); } }, ['Select all']),
        el('button', { className: 'iu-btn iu-btn-sm', onclick: () => { state.selected = []; renderApp(); } }, ['Clear']),
      ]),

      // ---- Queue actions ----
      el('div', { style: 'height:1px; background:var(--iu-line); margin:10px 0;' }),
      el('div', { className: 'iu-mono', style: 'font-size:9px; color:var(--iu-ink-4); letter-spacing:0.1em; text-transform:uppercase;' }, ['Queue actions']),
      el('div', { style: 'display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;' }, [
        ...['unfollow','remove','defriend'].map(action => el('button', {
          className: 'iu-btn iu-btn-sm',
          disabled: selCount === 0 || !API.isOwnAccount(state.targetUser?.id) || state.actionProgress !== null,
          title: action === 'unfollow' ? 'Unfollow selected accounts via background queue'
               : action === 'remove'   ? 'Remove selected accounts from your followers via background queue'
               : 'Unfollow + remove follower + delete chat via background queue',
          onclick: () => {
            const targets = state.results.filter(u => state.selected.includes(u.id));
            if (!targets.length) return;
            const label = action === 'defriend' ? 'defriend (unfollow + remove + delete chat)' : action;
            if (!confirm(`Queue ${targets.length} account(s) to ${label}?`)) return;
            QueueManager.add(targets, action);
            showToast(`Queued ${targets.length} for ${action}`, 'info');
          }
        }, [action === 'unfollow' ? 'Unfollow'
          : action === 'remove'   ? 'Remove'
          : 'Defriend']))
      ]),

      // ---- DM actions ----
      el('div', { style: 'height:1px; background:var(--iu-line); margin:10px 0;' }),
      el('div', { className: 'iu-mono', style: 'font-size:9px; color:var(--iu-ink-4); letter-spacing:0.1em; text-transform:uppercase;' }, ['DM actions']),
      el('div', { style: 'display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;' }, [
        el('button', {
          className: 'iu-btn iu-btn-sm',
          disabled: selCount === 0 || state.actionProgress !== null,
          title: 'Delete DM threads with selected accounts',
          onclick: async () => {
            const targets = state.results.filter(u => state.selected.includes(u.id));
            if (!targets.length) return;
            if (!confirm(`Delete inbox chats with ${targets.length} account(s)?`)) return;
            let ok = 0, fail = 0;
            state.actionProgress = { label: 'Deleting chats', current: '', done: 0, total: targets.length };
            renderApp();
            for (const u of targets) {
              try {
                state.actionProgress.current = `@${u.username}`;
                state.actionProgress.done = ok + fail + 1;
                renderApp();
                await API.deleteChatByUserId(u.id); ok++;
              } catch { fail++; }
              await sleep(randomDelay(1500));
            }
            state.actionProgress = null;
            showToast(`Chats deleted: ${ok}${fail ? ` · failed ${fail}` : ''}`, fail ? 'warn' : 'success');
            renderApp();
          }
        }, ['Delete chats']),
        el('button', {
          className: 'iu-btn iu-btn-sm iu-btn-danger',
          disabled: selCount === 0 || state.actionProgress !== null,
          title: 'Unsend all your messages and delete the chat thread (irreversible)',
          onclick: async () => {
            const targets = state.results.filter(u => state.selected.includes(u.id));
            if (!targets.length) return;
            if (!confirm(`FULL ERASE ${targets.length} chat(s)? This will unsend all your messages and delete the thread. This cannot be undone.`)) return;
            let totalUnsent = 0, totalMsgs = 0, totalHid = 0, fails = 0;
            state.actionProgress = { label: 'Full erase', current: '', done: 0, total: targets.length };
            renderApp();
            for (const u of targets) {
              try {
                state.actionProgress.current = `@${u.username}`;
                state.actionProgress.done = Math.min(targets.indexOf(u) + 1, targets.length);
                renderApp();
                const res = await API.unsendAllMessagesWithUser(u.id);
                totalUnsent += (res.unsent || 0);
                totalMsgs += (res.total || 0);
                if (res.hid) totalHid++;
              } catch (e) {
                console.error('[IU] full erase failed for', u.username, e);
                fails++;
              }
              await sleep(randomDelay(2000));
            }
            state.actionProgress = null;
            const msg = `Full erase complete: ${totalUnsent}/${totalMsgs} msgs unsent, ${totalHid}/${targets.length} hidden` + (fails ? ` · failures: ${fails}` : '');
            showToast(msg, fails ? 'warn' : 'success');
            renderApp();
          }
        }, ['🔥 Full Erase'])
      ]),

      QueueManager.count() > 0 && el('button', {
        className: 'iu-btn iu-btn-sm iu-btn-ghost',
        onclick: () => { QueueManager.clear(); showToast('Queue cleared', 'info'); }
      }, ['Clear queue'])
    ]));

    // ---------- Action progress ----------
    if (state.actionProgress) {
      const ap = state.actionProgress;
      sb.appendChild(el('div', { className: 'iu-panel-block', style: 'border-color: var(--iu-line-3);' }, [
        el('div', { style: 'display:flex; align-items:center; gap:8px;' }, [
          el('div', { className: 'iu-queue-spin', style: 'width:10px; height:10px;' }),
          el('span', { style: 'font-size:12px; font-weight:600; color:var(--iu-ink);' }, [ap.label])
        ]),
        ap.current && el('div', { className: 'iu-mono', style: 'font-size:11px; color:var(--iu-ink-2);' }, [`Processing ${ap.current}`]),
        el('div', { style: 'margin-top:4px; display:flex; align-items:center; gap:10px;' }, [
          el('div', {
            style: 'flex:1; height:4px; background:var(--iu-bg-4); border-radius:2px; overflow:hidden;'
          }, [
            el('div', {
              style: `width:${Math.round((ap.done / ap.total) * 100)}%; height:100%; background:var(--iu-ink); border-radius:2px; transition:width 200ms var(--iu-ease);`
            })
          ]),
          el('span', { className: 'iu-mono', style: 'font-size:10px; color:var(--iu-ink-3); flex-shrink:0;' }, [`${ap.done}/${ap.total}`])
        ])
      ]));
    }

    // Scan log
    if (state.scanHistory.length > 0) {
      sb.appendChild(el('div', { className: 'iu-panel-block' }, [
        el('h3', {}, ['Scan log']),
        el('div', { className: 'iu-log' },
          state.scanHistory.slice().reverse().map(h => el('div', { className: 'iu-log-line' }, [h.msg])))
      ]));
    }

    return sb;
  }

  function renderMain() {
    const tabs = [
      { id: 'main',      label: 'Results' },
      { id: 'whitelist', label: `Whitelist (${state.whitelist.length})` },
      { id: 'dashboard', label: 'Snapshots' }
    ];

    return el('main', {}, [
      el('div', { className: 'iu-tabs' }, tabs.map(t => el('button', {
        className: 'iu-tab' + (state.tab === t.id ? ' active' : ''),
        onclick: () => { state.tab = t.id; state.page = 1; if (t.id === 'dashboard') loadSnapshots(); else renderApp(); }
      }, [t.label]))),

      el('div', { style: 'margin-top: 20px;' }, [
        state.tab === 'dashboard' ? renderDashboard() : renderTable()
      ])
    ]);
  }

  function renderTable() {
    const filtered = getFilteredUsers();
    if (filtered.length === 0) {
      return el('div', { className: 'iu-empty' }, [
        el('strong', {}, [state.tab === 'whitelist' ? 'No whitelisted accounts yet' : 'No results']),
        state.tab === 'whitelist'
          ? 'Whitelist accounts from the results tab to keep them safe from bulk actions.'
          : (state.results.length === 0 ? 'Run a scan to see results here.' : 'No accounts match your current filters.')
      ]);
    }
    const pageUsers = getPageUsers(filtered);
    const totalPages = Math.max(1, Math.ceil(filtered.length / CONFIG.USERS_PER_PAGE));

    return el('div', {}, [
      el('div', { className: 'iu-table' }, [
        el('div', { className: 'iu-table-head' }, [
          el('div', { style: 'flex:1;' }, ['Account']),
          el('div', { style: 'flex:0 0 auto; padding-right:12px;' }, ['Flags']),
          el('div', { style: 'flex:0 0 90px; text-align:right;' }, ['Ratio']),
          el('div', { style: 'flex:0 0 auto;' }, ['Actions']),
          el('div', { style: 'flex:0 0 32px; text-align:center;' }, ['Sel'])
        ]),
        ...pageUsers.map(renderUserRow)
      ]),
      el('div', { className: 'iu-pager' }, [
        el('div', {}, [`Page ${state.page} / ${totalPages}  ·  ${filtered.length} accounts`]),
        el('div', { style: 'display:flex; gap:6px;' }, [
          el('button', {
            className: 'iu-btn iu-btn-sm',
            disabled: state.page <= 1,
            onclick: () => { state.page--; renderApp(); }
          }, ['\u2190 Prev']),
          el('button', {
            className: 'iu-btn iu-btn-sm',
            disabled: state.page >= totalPages,
            onclick: () => { state.page++; renderApp(); }
          }, ['Next \u2192'])
        ])
      ])
    ]);
  }

  function renderUserRow(u) {
    const wl = state.whitelist.some(w => w.id === u.id);
    const spam = u.following_count > 5000 && u.follower_count < 50;
    const ratio = u.enriched && u.following_count > 0 ? (u.follower_count / u.following_count).toFixed(2) : '—';
    return el('div', { className: 'iu-row' }, [
      el('div', { className: 'iu-col-user' }, [
        el('div', { className: 'iu-avatar' }, [el('img', { src: u.profile_pic_url, alt: '' })]),
        el('div', { style: 'display:flex; flex-direction:column; min-width:0; gap:2px;' }, [
          el('a', {
            className: 'iu-username',
            href: `https://instagram.com/${u.username}`,
            target: '_blank',
            rel: 'noopener'
          }, [`@${u.username}`]),
          u.full_name && el('div', { className: 'iu-fullname' }, [u.full_name])
        ])
      ]),
      el('div', { className: 'iu-col-badges' }, [
        u.is_verified && el('span', { className: 'iu-badge iu-badge-strong' }, ['V']),
        u.is_private  && el('span', { className: 'iu-badge' }, ['P']),
        spam          && el('span', { className: 'iu-badge iu-badge-strong' }, ['SPAM']),
        u.__deactivated && el('span', { className: 'iu-badge iu-badge-strong' }, ['OFF']),
        isDefaultAvatar(u.profile_pic_url) && el('span', { className: 'iu-badge' }, ['GHOST'])
      ]),
      el('div', { className: 'iu-col-ratio' }, [ratio]),
      el('div', { className: 'iu-col-actions' }, [
        el('button', {
          className: 'iu-btn iu-btn-sm iu-btn-ghost',
          onclick: () => toggleWhitelist(u)
        }, [wl ? 'Unlist' : 'Whitelist'])
      ]),
      el('div', { className: 'iu-col-check' }, [
        el('input', {
          type: 'checkbox', className: 'iu-check',
          checked: state.selected.includes(u.id),
          onchange: e => {
            if (e.target.checked) state.selected.push(u.id);
            else state.selected = state.selected.filter(id => id !== u.id);
            renderApp();
          }
        })
      ])
    ]);
  }

  // ---------- Snapshot dashboard ----------
  function renderDashboard() {
    if (state.snapshots.length === 0) {
      return el('div', { className: 'iu-empty' }, [
        el('strong', {}, ['No snapshots yet']),
        'Run a full scan to create your first snapshot. Snapshots enable time-machine modes and compare views.'
      ]);
    }
    const items = state.snapshots.map(s => el('div', {
      className: 'iu-snap-item' + (state.snapshotSelection.includes(s.id) ? ' selected' : ''),
      onclick: () => toggleSnapshotSelection(s.id)
    }, [
      el('input', {
        type: 'checkbox', className: 'iu-check',
        checked: state.snapshotSelection.includes(s.id),
        onclick: e => e.stopPropagation()
      }),
      el('div', { className: 'iu-snap-type' }, [s.type]),
      el('div', { className: 'iu-snap-time' }, [fmtTime(s.timestamp)]),
      el('div', { className: 'iu-snap-count' }, [fmtNum(s.count)])
    ]));

    const wrap = el('div', { style: 'display:flex; flex-direction:column; gap:20px;' }, [
      el('div', { className: 'iu-panel-block' }, [
        el('h3', {}, [`Snapshots  ·  ${state.snapshots.length}`]),
        el('div', { className: 'iu-snap-list' }, items),
        el('div', { style: 'display:flex; gap:8px;' }, [
          el('button', {
            className: 'iu-btn iu-btn-sm',
            disabled: state.snapshotSelection.length !== 2,
            onclick: runComparison
          }, ['Compare selected']),
          state.compareResult && el('button', {
            className: 'iu-btn iu-btn-sm iu-btn-ghost',
            onclick: () => { state.compareResult = null; state.snapshotSelection = []; renderApp(); }
          }, ['Clear'])
        ])
      ])
    ]);

    if (state.compareResult) wrap.appendChild(renderCompare());
    return wrap;
  }

  function renderCompare() {
    const { snapA, snapB, result } = state.compareResult;
    const section = (title, users) => el('div', { className: 'iu-panel-block' }, [
      el('h3', {}, [`${title}  ·  ${users.length}`]),
      users.length === 0
        ? el('div', { className: 'iu-mono', style: 'color:var(--iu-ink-4); font-size:11px;' }, ['—'])
        : el('div', { style: 'max-height:280px; overflow:auto; display:flex; flex-direction:column; gap:4px;' },
            users.slice(0, 200).map(u => el('div', {
              style: 'display:flex; align-items:center; gap:10px; padding:6px 4px; border-bottom:1px solid var(--iu-line);'
            }, [
              el('div', { className: 'iu-avatar', style: 'width:22px; height:22px;' }, [el('img', { src: u.profile_pic_url, alt: '' })]),
              el('a', { className: 'iu-username', href: `https://instagram.com/${u.username}`, target: '_blank' }, [`@${u.username}`])
            ]))
          )
    ]);
    return el('div', { style: 'display:flex; flex-direction:column; gap:16px;' }, [
      el('div', { className: 'iu-mono iu-muted', style: 'font-size:11px;' },
        [`${snapA.type} @ ${fmtTime(snapA.timestamp)}  →  ${snapB.type} @ ${fmtTime(snapB.timestamp)}`]),
      el('div', { style: 'display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;' }, [
        section('New',     result.new),
        section('Removed', result.removed),
        section('Common',  result.common)
      ])
    ]);
  }

  // ---------- Settings modal ----------
  function renderSettings() {
    const s = state.settings;
    return el('div', { className: 'iu-overlay', onclick: e => { if (e.target.classList.contains('iu-overlay')) { state.showSettings = false; renderApp(); } } }, [
      el('div', { className: 'iu-modal' }, [
        el('div', { className: 'iu-modal-head' }, [
          el('div', { className: 'iu-modal-title' }, ['Settings']),
          el('button', { className: 'iu-btn iu-btn-ghost iu-btn-sm', onclick: () => { state.showSettings = false; renderApp(); } }, ['Close'])
        ]),
        el('form', { onsubmit: saveSettings }, [
          el('div', { className: 'iu-modal-body' }, [
            el('div', { className: 'iu-field' }, [
              el('label', {}, ['Search delay (ms)']),
              el('input', { className: 'iu-input', type: 'number', name: 'searchDelay', value: s.searchDelay, min: 100, step: 100 })
            ]),
            el('div', { className: 'iu-field' }, [
              el('label', {}, ['Unfollow delay (ms)']),
              el('input', { className: 'iu-input', type: 'number', name: 'unfollowDelay', value: s.unfollowDelay, min: 1000, step: 500 })
            ]),
            el('div', { className: 'iu-field' }, [
              el('label', {}, ['Snapshot retention (days)']),
              el('input', { className: 'iu-input', type: 'number', name: 'snapshotRetentionDays', value: s.snapshotRetentionDays, min: 1, max: 365 })
            ]),
            el('div', {}, [
              boolRow('Enable background queue', 'enableQueue', s.enableQueue),
              boolRow('Auto-whitelist verified accounts', 'autoWhitelistVerified', s.autoWhitelistVerified),
              boolRow('Auto-whitelist private accounts', 'autoWhitelistPrivate', s.autoWhitelistPrivate),
              boolRow('Delete chat on defriend', 'deleteChatOnDefriend', s.deleteChatOnDefriend)
            ])
          ]),
          el('div', { className: 'iu-modal-foot' }, [
            el('button', { type: 'button', className: 'iu-btn', onclick: () => { state.showSettings = false; renderApp(); } }, ['Cancel']),
            el('button', { type: 'submit', className: 'iu-btn iu-btn-primary' }, ['Save'])
          ])
        ])
      ])
    ]);
  }
  function boolRow(label, name, checked) {
    return el('label', { className: 'iu-field-row' }, [
      el('span', {}, [label]),
      el('input', { type: 'checkbox', className: 'iu-check', name, checked })
    ]);
  }

  // ---------- Toast & queue ----------
  function renderToast(t) {
    return el('div', { className: 'iu-toast ' + (t.type === 'error' ? 'iu-toast-error' : '') }, [ el('div', {}, [t.msg]) ]);
  }
  function renderQueueBadge(count) {
    const paused = !state.settings.enableQueue;
    const cur = state.queueCurrent;
    const list = QueueManager.list();
    const open = state.queueOpen;

    const header = el('div', {
      className: 'iu-queue-head',
      onclick: () => { state.queueOpen = !state.queueOpen; renderApp(); }
    }, [
      paused ? el('span', { className: 'iu-queue-dot iu-queue-paused' }, []) :
        (cur ? el('div', { className: 'iu-queue-spin' }, []) : el('span', { className: 'iu-queue-dot' }, [])),
      el('span', { className: 'iu-queue-title' }, [`Queue · ${count}`]),
      cur && el('span', { className: 'iu-queue-cur' }, [`${cur.action} @${cur.username}`]),
      el('span', { className: 'iu-queue-chev' }, [open ? '▾' : '▸'])
    ]);

    if (!open) return el('div', { className: 'iu-queue' }, [header]);

    const body = el('div', { className: 'iu-queue-body' }, [
      // Status row
      el('div', { className: 'iu-queue-row' }, [
        el('span', { className: 'iu-queue-k' }, ['Status']),
        el('span', { className: 'iu-queue-v' }, [paused ? 'Paused' : (cur ? 'Running' : 'Idle · next in ≤30s')])
      ]),
      cur && el('div', { className: 'iu-queue-row' }, [
        el('span', { className: 'iu-queue-k' }, ['Now']),
        el('span', { className: 'iu-queue-v' }, [`${cur.action} → @${cur.username}`])
      ]),
      el('div', { className: 'iu-queue-row' }, [
        el('span', { className: 'iu-queue-k' }, ['Pending']),
        el('span', { className: 'iu-queue-v' }, [`${Math.max(count - (cur ? 1 : 0), 0)} tasks`])
      ]),
      // Pending list
      list.length > 0 && el('div', { className: 'iu-queue-sec' }, [
        el('div', { className: 'iu-queue-sec-t' }, ['Pending']),
        el('div', { className: 'iu-queue-list' },
          list.slice(0, 20).map((t, i) => el('div', { className: 'iu-queue-item' }, [
            el('span', { className: 'iu-queue-idx' }, [String(i + 1).padStart(2, '0')]),
            el('span', { className: 'iu-queue-act' }, [t.action]),
            el('span', { className: 'iu-queue-u' }, [`@${t.username}`]),
            el('button', {
              className: 'iu-queue-x',
              title: 'Remove',
              onclick: (e) => { e.stopPropagation(); QueueManager.remove(t.targetId, t.action); }
            }, ['×'])
          ]))
        ),
        list.length > 20 && el('div', { className: 'iu-queue-more' }, [`+ ${list.length - 20} more`])
      ]),
      // Activity log
      state.queueLog.length > 0 && el('div', { className: 'iu-queue-sec' }, [
        el('div', { className: 'iu-queue-sec-t' }, ['Activity']),
        el('div', { className: 'iu-queue-log' },
          state.queueLog.slice(0, 20).map(l => el('div', { className: 'iu-queue-lline iu-ql-' + l.type }, [
            el('span', { className: 'iu-queue-time' }, [new Date(l.ts).toLocaleTimeString([], { hour12: false })]),
            el('span', {}, [l.msg])
          ]))
        )
      ]),
      // Controls
      el('div', { className: 'iu-queue-ctrls' }, [
        el('button', {
          className: 'iu-queue-btn',
          onclick: () => {
            state.settings.enableQueue = !state.settings.enableQueue;
            Storage.set(CONFIG.SETTINGS_KEY, state.settings);
            queueLog(state.settings.enableQueue ? 'Resumed' : 'Paused', 'info');
            renderApp();
          }
        }, [paused ? 'Resume' : 'Pause']),
        count > 0 && !cur && el('button', {
          className: 'iu-queue-btn',
          onclick: () => { if (!state.settings.enableQueue) { state.settings.enableQueue = true; Storage.set(CONFIG.SETTINGS_KEY, state.settings); } QueueManager.runNow(); }
        }, ['Run now']),
        count > 0 && el('button', {
          className: 'iu-queue-btn',
          onclick: () => { if (confirm('Clear all queued tasks?')) { QueueManager.clear(); showToast('Queue cleared', 'info'); } }
        }, ['Clear all'])
      ])
    ]);

    return el('div', { className: 'iu-queue iu-queue-open' }, [header, body]);
  }


  // ============================================================
  // 13. INIT
  // ============================================================
  async function init() {
    try {
      if (!API.isLoggedIn()) {
        alert('Please log into Instagram first, then reload.');
        return;
      }
      document.body.innerHTML = '';
      document.body.style.cssText = 'margin: 0; padding: 0; background: #000;';
      document.title = 'IU · Instagram Unfollowers';

      const panel = el('div', { className: 'iu-panel' }, [ el('div', { className: 'iu-app' }) ]);
      try { API.initTokens(); }                        catch (e) { console.warn('[IU] initTokens failed:', e); }
      document.body.appendChild(panel);

      try { await IDB.init(); }                        catch (e) { console.error('IDB init failed:', e); }
      try { await cleanupOldSnapshots(); }             catch (e) { console.error('Cleanup failed:', e); }
      try { await requestNotificationPermission(); }   catch (e) { console.error('Notifications failed:', e); }
      try { QueueManager.start(); }                    catch (e) { console.error('Queue start failed:', e); }

      if (!API.uuid) {
        console.warn('[IU] Missing ig_did cookie — DM actions might fail.');
        setTimeout(() => showToast('Warning: Missing ig_did (UUID). DM actions like delete chat may fail.', 'warn'), 1000);
      }
      try { renderApp(); }
      catch (e) {
        panel.querySelector('.iu-app').innerHTML =
          `<div style="padding:24px; color:#f5f5f5; font-family: -apple-system, sans-serif;">
             <h2 style="margin:0 0 12px 0; font-size:15px;">Render error</h2>
             <pre style="white-space:pre-wrap; font-size:12px; color:#8a8a8a;">${(e.stack || e.message || String(e)).replace(/</g,'&lt;')}</pre>
           </div>`;
      }
    } catch (err) {
      console.error('Fatal init error:', err);
    }
  }

  if (location.hostname === 'www.instagram.com') init();
  else alert('Run on instagram.com');

})();
