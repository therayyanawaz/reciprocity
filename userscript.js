// ==UserScript==
// @name         Instagram Unfollowers
// @namespace    https://instagram.com/
// @version      3.0
// @description  Analyze Instagram following/follower relationships and identify non-reciprocal follows
// @author       therayyanawaz
// @match        https://www.instagram.com/*
// @grant        none
// ==/UserScript==

/**
 * ============================================
 * Instagram Unfollowers v3.0
 * ============================================
 *
 * Analyzes any Instagram account's following/follower data.
 * Features: Queue-based actions, historical snapshots,
 * spam detection, CSV export, Discord webhook notifications,
 * action rate limits, and smart filters.
 */

(function () {
  'use strict';

  // ============================================
  // Inject Styles
  // ============================================
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    .iu-app {
      --color-bg-primary: #000000;
      --color-bg-secondary: #050505;
      --color-bg-tertiary: #0a0a0a;
      --color-bg-elevated: #111111;
      --color-bg-hover: #1a1a1a;

      --color-text-primary: #00ff41;
      --color-text-secondary: #00cc33;
      --color-text-muted: #338833;
      --color-text-highlight: #00ff66;

      --color-accent: #00ff41;
      --color-accent-hover: #33ff66;
      --color-accent-subtle: rgba(0, 255, 65, 0.08);
      --color-accent-glow: rgba(0, 255, 65, 0.4);
      --color-accent-secondary: #00cc33;

      --color-success: #00ff41;
      --color-warning: #ffcc00;
      --color-error: #ff3333;
      --color-info: #00ccff;

      --color-border: #003311;
      --color-border-hover: #00ff41;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.8);
      --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.9);

      --space-xs: 0.35rem;
      --space-sm: 0.625rem;
      --space-md: 1.125rem;
      --space-lg: 1.5rem;
      --space-xl: 1.75rem;

      --font-family: 'JetBrains Mono', monospace;
      --transition-fast: 100ms ease;
      --transition-base: 200ms ease;

      --radius-sm: 4px;
      --radius-md: 6px;
      --radius-lg: 8px;
      --radius-full: 9999px;

      font-family: var(--font-family);
      background: #000000;
      color: var(--color-text-primary);
      min-height: 100vh;
      box-sizing: border-box;
      font-size: 16px;
      line-height: 1.5;
    }

    .iu-app::before {
      content: '';
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px);
      pointer-events: none; z-index: 9999; opacity: 0.3;
    }

    .iu-app *, .iu-app *::before, .iu-app *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .iu-header {
      background: linear-gradient(180deg, rgba(13,13,13,0.95) 0%, rgba(0,0,0,0.95) 100%);
      backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border);
      margin-bottom: var(--space-xl); position: sticky; top: 0; z-index: 10; width: 100%;
    }

    .iu-header-inner { max-width: 1100px; margin: 0 auto; padding: var(--space-lg) var(--space-xl); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); }
    .iu-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: var(--color-accent); box-shadow: 0 0 10px var(--color-accent); opacity: 0.8; }
    .iu-brand { display: flex; align-items: center; gap: var(--space-md); }
    .iu-logo { width: 40px; height: 40px; border: 2px solid var(--color-accent); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; box-shadow: 0 0 15px var(--color-accent-glow); color: var(--color-accent); }
    .iu-title { font-size: 1rem; font-weight: 600; text-transform: uppercase; color: var(--color-accent); text-shadow: 0 0 10px var(--color-accent-glow); }
    .iu-subtitle { font-size: 0.7rem; color: var(--color-text-muted); }
    .iu-subtitle a { color: var(--color-accent); text-decoration: none; }
    .iu-subtitle a:hover { text-decoration: underline; text-shadow: 0 0 8px var(--color-accent-glow); }

    .iu-actions { display: flex; align-items: center; gap: var(--space-md); }
    .iu-btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-sm); padding: 0.5rem var(--space-lg); font-family: inherit; font-size: 0.8rem; font-weight: 500; border: 1px solid var(--color-accent); border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition-base); text-transform: uppercase; }
    .iu-btn-primary { background: transparent; color: var(--color-accent); box-shadow: 0 0 10px var(--color-accent-glow); }
    .iu-btn-primary:hover { background: var(--color-accent); color: #000; box-shadow: 0 0 20px var(--color-accent-glow); transform: translateY(-1px); }
    .iu-btn-secondary { background: transparent; color: var(--color-text-secondary); border-color: var(--color-border); }
    .iu-btn-secondary:hover { border-color: var(--color-accent); color: var(--color-accent); box-shadow: 0 0 10px var(--color-accent-glow); }
    .iu-btn-danger { background: transparent; color: var(--color-error); border-color: var(--color-error); }
    .iu-btn-danger:hover { background: var(--color-error); color: #fff; }
    .iu-btn-warning { background: transparent; color: var(--color-warning); border-color: var(--color-warning); }
    .iu-btn-warning:hover { background: var(--color-warning); color: #000; }
    .iu-btn-ghost { background: transparent; color: var(--color-text-secondary); border: none; }
    .iu-btn-ghost:hover { background: var(--color-bg-tertiary); color: var(--color-text-primary); }
    .iu-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

    .iu-input { padding: 0.75rem var(--space-lg); font-family: inherit; font-size: 0.9rem; background: #000; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-accent); min-width: 240px; }
    .iu-input:focus { outline: none; border-color: var(--color-accent); background: #050505; box-shadow: 0 0 15px var(--color-accent-glow); }
    .iu-input-lg { padding: 1rem var(--space-xl); font-size: 1.1rem; }

    .iu-start-screen { max-width: 750px; margin: 0 auto; padding: var(--space-xl); display: flex; flex-direction: column; gap: var(--space-lg); }
    .iu-start-icon { width: 60px; height: 60px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-accent); font-size: 1.5rem; box-shadow: 0 0 20px var(--color-accent-glow); margin-bottom: var(--space-md); }
    .iu-start-title { font-size: 1.5rem; font-weight: 600; color: var(--color-accent); text-transform: uppercase; text-shadow: 0 0 20px var(--color-accent-glow); }
    .iu-start-title::before { content: '> '; color: var(--color-text-muted); }
    .iu-start-desc { color: var(--color-text-secondary); font-size: 0.85rem; }
    .iu-start-btn { width: 120px; height: 120px; border-radius: 50%; font-size: 1rem; font-weight: 600; background: transparent; border: 2px solid var(--color-accent); color: var(--color-accent); cursor: pointer; transition: all var(--transition-base); box-shadow: 0 0 30px var(--color-accent-glow); text-transform: uppercase; margin: var(--space-xl) auto; display: block; }
    .iu-start-btn:hover:not(:disabled) { background: var(--color-accent); color: #000; transform: scale(1.05); }

    .iu-main-container { max-width: 1100px; margin: 0 auto; padding: 0 var(--space-xl); width: 100%; }
    .iu-layout { display: grid; grid-template-columns: 260px 1fr; gap: 48px; }
    @media (max-width: 768px) { .iu-layout { grid-template-columns: 1fr; } }

    .iu-sidebar { display: flex; flex-direction: column; gap: var(--space-lg); }
    .iu-section { background: #000; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-lg); transition: all var(--transition-base); }
    .iu-section:hover { border-color: var(--color-accent); box-shadow: 0 0 15px var(--color-accent-glow); }
    .iu-section-title { font-size: 0.75rem; font-weight: 600; color: var(--color-accent); text-transform: uppercase; margin-bottom: var(--space-lg); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--color-border); }
    .iu-section-title::before { content: '[ '; color: var(--color-text-muted); }
    .iu-section-title::after { content: ' ]'; color: var(--color-text-muted); }

    .iu-stats { display: flex; flex-direction: column; gap: var(--space-sm); }
    .iu-stat-row { display: flex; justify-content: space-between; font-size: 0.875rem; }
    .iu-stat-label { color: var(--color-text-secondary); }
    .iu-stat-value { color: var(--color-text-highlight); font-weight: 600; }

    .iu-filter-list { display: flex; flex-direction: column; gap: var(--space-sm); }
    .iu-filter-item { display: flex; align-items: flex-start; gap: var(--space-md); padding: var(--space-md); border-radius: var(--radius-sm); cursor: pointer; border: 1px solid var(--color-border); }
    .iu-filter-item:hover { border-color: var(--color-accent); box-shadow: 0 0 10px var(--color-accent-glow); }

    .iu-checkbox, .iu-radio { width: 18px; height: 18px; border: 1px solid var(--color-text-muted); appearance: none; cursor: pointer; background: transparent; position: relative; }
    .iu-checkbox { border-radius: 2px; }
    .iu-radio { border-radius: 50%; }
    .iu-checkbox:checked, .iu-radio:checked { border-color: var(--color-accent); }
    .iu-checkbox:checked::after { content: '\u2713'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--color-accent); font-size: 12px; }
    .iu-radio:checked::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: var(--color-accent); border-radius: 50%; }

    .iu-radio-content { flex: 1; }
    .iu-radio-label { font-weight: 500; font-size: 0.85rem; color: var(--color-accent); margin-bottom: 4px; text-transform: uppercase; }
    .iu-radio-desc { font-size: 0.75rem; color: var(--color-text-secondary); }

    .iu-tabs { display: flex; gap: var(--space-xs); padding: var(--space-sm); background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: var(--space-lg); overflow-x: auto; }
    .iu-tab { flex: 1; padding: 0.75rem var(--space-md); font-size: 0.875rem; font-weight: 600; text-align: center; border-radius: var(--radius-sm); cursor: pointer; color: var(--color-text-secondary); border: none; background: transparent; white-space: nowrap; }
    .iu-tab:hover { color: var(--color-text-primary); background: var(--color-bg-tertiary); }
    .iu-tab-active { background: linear-gradient(135deg, #fff 0%, #e6e6e6 100%); color: #000; box-shadow: 0 4px 15px var(--color-accent-glow); }

    .iu-user-list { display: flex; flex-direction: column; gap: var(--space-sm); }
    .iu-user-item { display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md); background: linear-gradient(135deg, var(--color-bg-secondary) 0%, rgba(13,13,13,0.6) 100%); border: 1px solid var(--color-border); border-radius: var(--radius-md); transition: all var(--transition-base); }
    .iu-user-item:hover { border-color: var(--color-border-hover); transform: translateX(4px); }

    .iu-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-border); }
    .iu-user-item:hover .iu-avatar { border-color: var(--color-accent); box-shadow: 0 0 15px var(--color-accent-glow); }

    .iu-user-info { flex: 1; min-width: 0; }
    .iu-username { font-weight: 600; color: var(--color-text-primary); text-decoration: none; }
    .iu-fullname { font-size: 0.875rem; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .iu-badges { display: flex; gap: var(--space-xs); }
    .iu-badge { padding: 3px 10px; font-size: 0.7rem; font-weight: 600; border-radius: var(--radius-full); border: 1px solid; text-transform: uppercase; }
    .iu-badge-verified { color: var(--color-info); border-color: var(--color-info); background: rgba(0,204,255,0.1); }
    .iu-badge-private { color: var(--color-warning); border-color: var(--color-warning); background: rgba(255,204,0,0.1); }
    .iu-badge-spam { color: var(--color-error); border-color: var(--color-error); background: rgba(255,51,51,0.1); }

    .iu-progress-container { display: flex; align-items: center; gap: var(--space-md); width: 100%; margin-top: var(--space-md); }
    .iu-progress { flex: 1; height: 6px; background: var(--color-bg-tertiary); border-radius: var(--radius-full); overflow: hidden; }
    .iu-progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%); box-shadow: 0 0 10px var(--color-accent-glow); transition: width 0.3s ease; }
    .iu-progress-pct { font-size: 0.75rem; font-weight: 600; color: var(--color-accent); min-width: 40px; text-align: right; }

    .iu-pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-md); padding: var(--space-md) 0; }
    .iu-page-info { font-size: 0.875rem; color: var(--color-text-muted); }

    .iu-toast { position: fixed; bottom: var(--space-xl); right: var(--space-xl); padding: var(--space-md) var(--space-lg); background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); display: flex; align-items: center; gap: var(--space-md); z-index: 10000; animation: iu-slide-in 0.2s ease; }
    .iu-toast-success { border-left: 3px solid var(--color-success); }
    .iu-toast-error { border-left: 3px solid var(--color-error); }
    .iu-toast-info { border-left: 3px solid var(--color-info); }
    .iu-toast-warning { border-left: 3px solid var(--color-warning); }
    @keyframes iu-slide-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .iu-empty { text-align: center; padding: var(--space-xl); color: var(--color-text-muted); }

    .iu-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10001; backdrop-filter: blur(4px); }
    .iu-modal { background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 100%; max-width: 500px; max-height: 80vh; overflow-y: auto; }
    .iu-modal-header { padding: var(--space-lg); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
    .iu-modal-title { font-size: 1.125rem; font-weight: 600; }
    .iu-modal-body { padding: var(--space-lg); }
    .iu-modal-footer { padding: var(--space-lg); border-top: 1px solid var(--color-border); display: flex; gap: var(--space-md); justify-content: flex-end; }

    .iu-form-group { margin-bottom: var(--space-lg); width: 100%; }
    .iu-form-label { display: block; font-size: 0.75rem; font-weight: 500; color: var(--color-accent); margin-bottom: var(--space-sm); text-transform: uppercase; }
    .iu-form-hint { font-size: 0.7rem; color: var(--color-text-muted); margin-top: var(--space-sm); font-style: italic; }

    .iu-warning { padding: var(--space-md) var(--space-lg); background: #000; border: 1px solid var(--color-border); border-radius: var(--radius-sm); width: 100%; margin-bottom: var(--space-md); }
    .iu-warning-title { font-size: 0.75rem; font-weight: 500; color: var(--color-warning); margin-bottom: var(--space-xs); text-transform: uppercase; }
    .iu-warning-text { font-size: 0.75rem; color: var(--color-text-secondary); }

    .iu-profile-card { display: flex; align-items: center; width: 100%; padding: var(--space-xl); background: linear-gradient(135deg, var(--color-bg-secondary) 0%, rgba(26,26,26,0.9) 100%); border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin-bottom: var(--space-xl); position: relative; overflow: hidden; }
    .iu-profile-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-secondary) 50%, var(--color-accent) 100%); }
    .iu-profile-avatar { flex: 0 0 auto; width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 3px solid var(--color-accent); box-shadow: 0 0 25px var(--color-accent-glow); margin-right: 24px; }
    .iu-profile-info { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
    .iu-profile-username { font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-xs); background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent-secondary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .iu-profile-name { color: var(--color-text-secondary); font-size: 0.8rem; }
    .iu-profile-stats { flex: 0 0 auto; display: flex; align-items: center; gap: var(--space-sm); margin-left: 40px; }
    .iu-profile-stat { text-align: center; padding: var(--space-xs) var(--space-sm); background: var(--color-bg-tertiary); border-radius: var(--radius-sm); border: 1px solid var(--color-border); min-width: 65px; }
    .iu-profile-stat-value { font-size: 1rem; font-weight: 700; color: var(--color-text-highlight); }
    .iu-profile-stat-label { font-size: 0.6rem; color: var(--color-text-secondary); text-transform: uppercase; margin-top: 2px; }

    .iu-bar-container { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .iu-bar-label { width: 100px; font-size: 0.75rem; color: var(--color-text-secondary); }
    .iu-bar-wrapper { flex: 1; height: 8px; background: var(--color-bg-tertiary); border-radius: 4px; overflow: hidden; }
    .iu-bar-fill { height: 100%; background: var(--color-accent); border-radius: 4px; }
    .iu-bar-fill.followers { background: var(--color-info); }
    .iu-bar-fill.following { background: var(--color-warning); }
    .iu-bar-value { width: 40px; text-align: right; font-size: 0.75rem; font-weight: bold; color: var(--color-accent); }

    .iu-queue-badge { position: fixed; top: 80px; right: 20px; background: var(--color-bg-elevated); border: 1px solid var(--color-accent); padding: 10px 15px; border-radius: 8px; z-index: 1000; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-glow); }
    .iu-queue-spinner { width: 12px; height: 12px; border: 2px solid transparent; border-top-color: var(--color-accent); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ============================================
  // Configuration
  // ============================================
  const CONFIG = {
    STORAGE_KEY: 'iu_whitelist_v3',
    SETTINGS_KEY: 'iu_settings_v3',
    QUEUE_KEY: 'iu_task_queue_v3',
    LIMITS_KEY: 'iu_action_limits_v3',
    USERS_PER_PAGE: 50,
    MAX_ACTIONS_24H: 150,
    DB_NAME: 'IU_Analytics_DB',
    DB_VERSION: 1,
    DEFAULT_SETTINGS: {
      searchDelay: 1000,
      unfollowDelay: 4000,
      autoWhitelistVerified: false,
      autoWhitelistPrivate: false,
      discordWebhookUrl: '',
      enableQueue: true
    }
  };

  // ============================================
  // Utilities
  // ============================================
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const getCookie = name => {
    const parts = `; ${document.cookie}`.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : null;
  };

  const randomDelay = async (base, v = 0.3) => {
    const delay = Math.floor(Math.random() * (base * 2 * v) + base * (1 - v));
    if (Math.random() > 0.5) {
      window.scrollBy({ top: Math.random() * 100 - 50, behavior: 'smooth' });
    }
    if (Math.random() > 0.7) {
      const event = new MouseEvent('mousemove', {
        view: window, bubbles: true, cancelable: true,
        clientX: Math.random() * window.innerWidth,
        clientY: Math.random() * window.innerHeight
      });
      document.dispatchEvent(event);
    }
    return delay;
  };

  const parseUsernameFromURL = () => {
    const match = window.location.pathname.match(/^\/([a-zA-Z0-9._]+)/);
    if (match && match[1] && !['explore', 'reels', 'stories', 'direct', 'accounts'].includes(match[1].toLowerCase())) {
      return match[1];
    }
    return null;
  };

  const isValidUsername = u => /^[a-zA-Z0-9._]{1,30}$/.test(u);

  const isDefaultAvatar = url =>
    url.includes('44884218_345707102882519_2446069589734326272_n.jpg') || url.includes('default');

  const Storage = {
    get: (k, d = null) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    remove: (k) => localStorage.removeItem(k)
  };

  const downloadCSV = (users) => {
    const headers = ['Username', 'Full Name', 'User ID', 'Profile URL', 'Is Verified', 'Is Private', 'Followers', 'Following', 'Ratio'];
    const rows = users.map(u => {
      const ratio = u.following_count > 0 ? (u.follower_count / u.following_count).toFixed(2) : 0;
      return [
        u.username, `"${u.full_name || ''}"`, u.id, `https://instagram.com/${u.username}`,
        u.is_verified, u.is_private, u.follower_count || 0, u.following_count || 0, ratio
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `iu_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fireDiscordWebhook = async (message, color = 65280) => {
    const url = state.settings.discordWebhookUrl;
    if (!url) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: 'InstaUnfollow Notification',
            description: message,
            color: color,
            timestamp: new Date().toISOString()
          }]
        })
      });
    } catch (e) { console.error('Discord webhook failed', e); }
  };

  // ============================================
  // IndexedDB Manager — Historical Snapshots
  // ============================================
  const IDB = {
    db: null,
    async init() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
        req.onupgradeneeded = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('snapshots')) {
            const store = db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = e => { this.db = e.target.result; resolve(); };
        req.onerror = e => reject(e);
      });
    },
    async saveSnapshot(userId, type, users) {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('snapshots', 'readwrite');
        tx.objectStore('snapshots').add({
          userId, type, timestamp: Date.now(), count: users.length,
          data: users.map(u => ({ id: u.id, username: u.username, profile_pic_url: u.profile_pic_url }))
        });
        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e);
      });
    },
    async getSnapshots(userId) {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
        const req = this.db.transaction('snapshots', 'readonly')
          .objectStore('snapshots').index('userId').getAll(userId);
        req.onsuccess = e => resolve(e.target.result.sort((a, b) => b.timestamp - a.timestamp));
        req.onerror = e => reject(e);
      });
    }
  };

  // ============================================
  // Instagram API
  // ============================================
  const API = {
    userId: getCookie('ds_user_id'),
    csrf: getCookie('csrftoken'),
    isLoggedIn() { return !!this.userId && !!this.csrf; },
    isOwnAccount(targetUserId) { return this.userId === targetUserId; },

    async getUserByUsername(username) {
      const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
      const res = await fetch(url, {
        headers: { 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest' },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(res.status === 404 ? 'User not found' : `HTTP ${res.status}`);
      const data = await res.json();
      if (!data.data || !data.data.user) throw new Error('User not found');
      const user = data.data.user;
      return {
        id: user.id, username: user.username, full_name: user.full_name,
        profile_pic_url: user.profile_pic_url, is_private: user.is_private,
        is_verified: user.is_verified, follower_count: user.edge_followed_by?.count || 0,
        following_count: user.edge_follow?.count || 0
      };
    },

    async getFollowing(userId, cursor = null) {
      const params = { id: userId, include_reel: 'true', fetch_mutual: 'false', first: '24' };
      if (cursor) params.after = cursor;
      const url = `https://www.instagram.com/graphql/query/?query_hash=3dec7e2c57367ef3da3d987d89f9dbc8&variables=${encodeURIComponent(JSON.stringify(params))}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(res.status === 429 ? 'Rate limited' : `HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'fail') throw new Error(data.message);
      return data.data.user.edge_follow;
    },

    async getFollowers(userId, cursor = null) {
      const params = { id: userId, include_reel: 'true', fetch_mutual: 'true', first: '24' };
      if (cursor) params.after = cursor;
      const url = `https://www.instagram.com/graphql/query/?query_hash=c76146de99bb02f6415203be841dd25a&variables=${encodeURIComponent(JSON.stringify(params))}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(res.status === 429 ? 'Rate limited' : `HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'fail') throw new Error(data.message);
      return data.data.user.edge_followed_by;
    },

    async unfollow(userId) {
      const res = await fetch(`https://www.instagram.com/web/friendships/${userId}/unfollow/`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-csrftoken': this.csrf },
        credentials: 'include'
      });
      return res.ok;
    },

    async removeFollower(userId) {
      const res = await fetch(`https://www.instagram.com/web/friendships/${userId}/remove_follower/`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-csrftoken': this.csrf },
        credentials: 'include'
      });
      return res.ok;
    }
  };

  // ============================================
  // Action Limit Guardian
  // ============================================
  const LimitGuardian = {
    check() {
      const actions = Storage.get(CONFIG.LIMITS_KEY, []);
      const valid = actions.filter(t => Date.now() - t < 86400000);
      Storage.set(CONFIG.LIMITS_KEY, valid);
      return valid.length < CONFIG.MAX_ACTIONS_24H;
    },
    record() {
      const actions = Storage.get(CONFIG.LIMITS_KEY, []);
      actions.push(Date.now());
      Storage.set(CONFIG.LIMITS_KEY, actions);
    },
    count() {
      return Storage.get(CONFIG.LIMITS_KEY, []).filter(t => Date.now() - t < 86400000).length;
    }
  };

  // ============================================
  // Queue Manager — Background Actions
  // ============================================
  const QueueManager = {
    interval: null,
    start() {
      if (this.interval) clearInterval(this.interval);
      this.interval = setInterval(async () => {
        if (!state.settings.enableQueue) return;
        const q = Storage.get(CONFIG.QUEUE_KEY, []);
        const myTasks = q.filter(t => t.ownerId === API.userId);
        if (myTasks.length === 0) return;
        const task = myTasks[0];
        if (!LimitGuardian.check()) {
          fireDiscordWebhook('Action queue paused: 24h limit reached.', 16711680);
          state.settings.enableQueue = false;
          Storage.set(CONFIG.SETTINGS_KEY, state.settings);
          showToast('Queue auto-paused: Action limit reached', 'error');
          renderApp();
          return;
        }
        const newQ = q.filter(t => t.targetId !== task.targetId);
        Storage.set(CONFIG.QUEUE_KEY, newQ);
        try {
          if (task.action === 'unfollow') await API.unfollow(task.targetId);
          else if (task.action === 'remove') await API.removeFollower(task.targetId);
          LimitGuardian.record();
          if (newQ.length === 0) fireDiscordWebhook('Action queue completed.');
          await sleep(await randomDelay(state.settings.unfollowDelay));
          renderApp();
        } catch (e) { console.error('Queue task failed', e); }
      }, 30000);
    },
    add(targets, action = 'unfollow') {
      const q = Storage.get(CONFIG.QUEUE_KEY, []);
      targets.forEach(t => {
        if (!q.some(x => x.targetId === t.id)) {
          q.push({ targetId: t.id, username: t.username, action, ownerId: API.userId, timestamp: Date.now() });
        }
      });
      Storage.set(CONFIG.QUEUE_KEY, q);
      showToast(`Added ${targets.length} to background queue`, 'success');
      renderApp();
    },
    clear() {
      const q = Storage.get(CONFIG.QUEUE_KEY, []);
      Storage.set(CONFIG.QUEUE_KEY, q.filter(t => t.ownerId !== API.userId));
      renderApp();
    }
  };

  // ============================================
  // State
  // ============================================
  let state = {
    status: 'initial',
    targetUsername: parseUsernameFromURL() || '',
    targetUser: null,
    following: [],
    followers: [],
    results: [],
    selected: [],
    whitelist: Storage.get(CONFIG.STORAGE_KEY, []),
    tab: 'non_whitelisted',
    search: '',
    page: 1,
    pct: 0,
    eta: null,
    scanStartTime: null,
    processedCount: 0,
    totalCount: 0,
    scanInterval: null,
    scanHistory: [],
    paused: false,
    settings: Storage.get(CONFIG.SETTINGS_KEY, CONFIG.DEFAULT_SETTINGS),
    showSettings: false,
    toast: null,
    error: null,
    filter: { verified: true, private: true, noAvatar: false, highSpam: false },
    scanMode: 'non_followers',
    snapshots: []
  };

  const loadSnapshots = async () => {
    if (state.targetUser) {
      state.snapshots = await IDB.getSnapshots(state.targetUser.id);
      renderApp();
    }
  };

  // ============================================
  // Render Helpers
  // ============================================
  const el = (tag, attrs = {}, children = []) => {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') e.className = v;
      else if (k.startsWith('on')) e[k.toLowerCase()] = v;
      else if (k === 'style' && typeof v === 'string') e.style.cssText = v;
      else e[k] = v;
    });
    children.forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  };

  // ============================================
  // UI Rendering
  // ============================================
  function renderApp() {
    const app = document.querySelector('.iu-app');
    if (!app) return;
    app.innerHTML = '';
    app.appendChild(renderHeader());

    switch (state.status) {
      case 'initial': app.appendChild(renderStartScreen()); break;
      case 'loading_profile': app.appendChild(renderLoadingScreen()); break;
      case 'scanning': app.appendChild(renderScanScreen()); break;
      case 'error': app.appendChild(renderErrorScreen()); break;
    }

    if (state.toast) app.appendChild(renderToast());
    if (state.showSettings) app.appendChild(renderSettingsModal());
    const badge = renderQueueBadge();
    if (badge) app.appendChild(badge);
  }

  function renderQueueBadge() {
    const q = Storage.get(CONFIG.QUEUE_KEY, []).filter(t => t.ownerId === API.userId);
    if (q.length === 0) return null;
    return el('div', { className: 'iu-queue-badge' }, [
      state.settings.enableQueue
        ? el('div', { className: 'iu-queue-spinner' })
        : el('div', { style: 'color: var(--color-error)' }, ['\u23F8']),
      el('span', { style: 'font-weight: 600; font-size: 0.85rem;' }, [`Queue: ${q.length}`])
    ]);
  }

  function renderHeader() {
    const header = el('header', { className: 'iu-header' }, [
      el('div', { className: 'iu-header-inner' }, [
        el('div', { className: 'iu-brand' }, [
          el('div', { className: 'iu-logo' }, ['>']),
          el('div', {}, [
            el('div', { className: 'iu-title' }, ['UNFOLLOWERS v3']),
            el('div', { className: 'iu-subtitle' }, ['Relationship Analysis Engine'])
          ])
        ]),
        el('div', { className: 'iu-actions' }, [
          state.status !== 'initial' && state.status !== 'error' && el('input', {
            className: 'iu-input', type: 'text', placeholder: 'Search...', value: state.search,
            onInput: e => { state.search = e.target.value; state.page = 1; renderApp(); }
          }),
          state.status === 'scanning' && el('button', {
            className: 'iu-btn iu-btn-secondary', onClick: () => downloadCSV(state.results)
          }, ['\uD83D\uDCBE Export CSV']),
          el('button', {
            className: 'iu-btn iu-btn-ghost', onClick: () => { state.showSettings = true; renderApp(); }
          }, ['\u2699\uFE0F Settings'])
        ].filter(Boolean))
      ])
    ]);

    if (state.status !== 'initial' && state.status !== 'error') {
      const pct = Math.round(state.pct || 0);
      header.querySelector('.iu-header-inner').appendChild(el('div', { className: 'iu-progress-container' }, [
        el('div', { className: 'iu-progress' }, [el('div', { className: 'iu-progress-fill', style: `width: ${pct}%` })]),
        el('span', { className: 'iu-progress-pct' }, [state.eta ? `${pct}% \u00B7 ETA: ${state.eta}` : `${pct}%`])
      ]));
    }
    return header;
  }

  function renderStartScreen() {
    return el('section', { className: 'iu-start-screen' }, [
      el('div', { style: 'text-align: center;' }, [
        el('div', { className: 'iu-start-icon', style: 'margin: 0 auto 1rem;' }, ['\u26A1']),
        el('h1', { className: 'iu-start-title' }, ['INITIALIZE TARGET'])
      ]),
      el('div', { className: 'iu-form-group' }, [
        el('label', { className: 'iu-form-label' }, ['target_username']),
        el('input', {
          className: 'iu-input iu-input-lg', style: 'width: 100%; text-align: center;', type: 'text',
          value: state.targetUsername,
          onInput: e => { state.targetUsername = e.target.value.replace(/[@\s]/g, ''); renderApp(); }
        })
      ]),
      el('div', { className: 'iu-section' }, [
        el('h3', { className: 'iu-section-title' }, ['SCAN MODE']),
        el('div', { className: 'iu-filter-list', style: 'flex-direction: row; justify-content: center; gap: 2rem;' }, [
          el('label', { className: 'iu-filter-item' }, [
            el('input', { type: 'radio', className: 'iu-radio', checked: state.scanMode === 'non_followers',
              onChange: () => { state.scanMode = 'non_followers'; renderApp(); } }),
            el('span', {}, ['Non-Followers'])
          ]),
          el('label', { className: 'iu-filter-item' }, [
            el('input', { type: 'radio', className: 'iu-radio', checked: state.scanMode === 'following',
              onChange: () => { state.scanMode = 'following'; renderApp(); } }),
            el('span', {}, ['Following'])
          ]),
          el('label', { className: 'iu-filter-item' }, [
            el('input', { type: 'radio', className: 'iu-radio', checked: state.scanMode === 'followers',
              onChange: () => { state.scanMode = 'followers'; renderApp(); } }),
            el('span', {}, ['Followers'])
          ])
        ])
      ]),
      el('div', { className: 'iu-warning' }, [
        el('div', { className: 'iu-warning-title' }, [
          API.isLoggedIn() ? 'Logged In' : 'Not Logged In'
        ]),
        el('div', { className: 'iu-warning-text' }, [
          API.isLoggedIn()
            ? 'You can scan public profiles and private accounts you follow.'
            : 'Log in to Instagram for best results.'
        ])
      ]),
      el('button', {
        className: 'iu-start-btn', onClick: loadTargetProfile,
        disabled: !isValidUsername(state.targetUsername)
      }, ['EXECUTE'])
    ]);
  }

  function renderLoadingScreen() {
    return el('section', { className: 'iu-start-screen', style: 'text-align:center' }, [
      el('div', { className: 'iu-start-icon', style: 'margin:0 auto 1rem;animation:pulse 2s infinite' }, ['\u23F3']),
      el('h1', { className: 'iu-start-title' }, ['Loading Profile...'])
    ]);
  }

  function renderErrorScreen() {
    return el('section', { className: 'iu-start-screen', style: 'text-align:center' }, [
      el('h1', { className: 'iu-start-title' }, ['Error']),
      el('p', { style: 'color:var(--color-error)' }, [state.error]),
      el('button', { className: 'iu-btn iu-btn-primary', onClick: () => { state.status = 'initial'; renderApp(); } }, ['\u2190 Back'])
    ]);
  }

  function renderScanScreen() {
    const users = getFilteredUsers();
    const pageUsers = getPageUsers(users);
    const maxPage = Math.max(1, Math.ceil(users.length / CONFIG.USERS_PER_PAGE));
    const isOwnAccount = state.targetUser && API.isOwnAccount(state.targetUser.id);

    return el('div', { className: 'iu-main-container' }, [
      state.targetUser ? el('div', { className: 'iu-profile-card' }, [
        el('img', { className: 'iu-profile-avatar', src: state.targetUser.profile_pic_url }),
        el('div', { className: 'iu-profile-info' }, [
          el('div', { className: 'iu-profile-username' }, [`@${state.targetUser.username}`]),
          el('div', { className: 'iu-profile-name' }, [state.targetUser.full_name])
        ]),
        el('div', { className: 'iu-profile-stats' }, [
          el('div', { className: 'iu-profile-stat' }, [
            el('div', { className: 'iu-profile-stat-value' }, [state.targetUser.following_count]),
            el('div', { className: 'iu-profile-stat-label' }, ['Following'])
          ]),
          el('div', { className: 'iu-profile-stat' }, [
            el('div', { className: 'iu-profile-stat-value' }, [state.targetUser.follower_count]),
            el('div', { className: 'iu-profile-stat-label' }, ['Followers'])
          ]),
          el('div', { className: 'iu-profile-stat' }, [
            el('div', { className: 'iu-profile-stat-value', style: 'color:var(--color-accent)' }, [state.results.length]),
            el('div', { className: 'iu-profile-stat-label' }, ['Scanned'])
          ])
        ])
      ]) : null,

      el('div', { className: 'iu-layout' }, [
        el('aside', { className: 'iu-sidebar' }, [
          el('div', { className: 'iu-section' }, [
            el('h3', { className: 'iu-section-title' }, ['Smart Filters']),
            el('div', { className: 'iu-filter-list' }, [
              renderFilter('verified', 'Verified Accounts', '\u2713'),
              renderFilter('private', 'Private Accounts', '\uD83D\uDD12'),
              renderFilter('noAvatar', 'Default Avatars', '\uD83D\uDC7B'),
              renderFilter('highSpam', 'High Spam Ratio', '\uD83E\uDD16')
            ])
          ]),
          el('div', { className: 'iu-section' }, [
            el('h3', { className: 'iu-section-title' }, ['Selection']),
            el('button', { className: 'iu-btn iu-btn-ghost', style: 'width:100%;margin-bottom:5px',
              onClick: () => { state.selected = [...getFilteredUsers()]; renderApp(); }
            }, ['Select All Filtered']),
            el('button', { className: 'iu-btn iu-btn-ghost', style: 'width:100%',
              onClick: () => { state.selected = []; renderApp(); }
            }, ['Deselect All'])
          ]),
          el('div', { className: 'iu-section' }, [
            el('h3', { className: 'iu-section-title' }, ['Queue Controls']),
            el('div', { style: 'font-size:0.75rem;margin-bottom:10px;color:var(--color-text-secondary)' },
              [`Actions 24h: ${LimitGuardian.count()}/${CONFIG.MAX_ACTIONS_24H}`]
            ),
            isOwnAccount && el('button', {
              className: 'iu-btn iu-btn-danger', style: 'width:100%;margin-bottom:5px',
              onClick: () => QueueManager.add(state.selected, 'unfollow'),
              disabled: state.selected.length === 0
            }, [`Queue Unfollow (${state.selected.length})`]),
            isOwnAccount && el('button', {
              className: 'iu-btn iu-btn-warning', style: 'width:100%;margin-bottom:5px',
              onClick: () => QueueManager.add(state.selected, 'remove'),
              disabled: state.selected.length === 0
            }, [`Queue Remove (${state.selected.length})`]),
            el('button', { className: 'iu-btn iu-btn-secondary', style: 'width:100%',
              onClick: () => QueueManager.clear()
            }, ['Clear My Queue'])
          ]),
          el('div', { className: 'iu-pagination' }, [
            el('button', { className: 'iu-btn iu-btn-ghost', disabled: state.page <= 1,
              onClick: () => { state.page--; renderApp(); }
            }, ['\u25C0']),
            el('span', { className: 'iu-page-info' }, [`${state.page} / ${maxPage}`]),
            el('button', { className: 'iu-btn iu-btn-ghost', disabled: state.page >= maxPage,
              onClick: () => { state.page++; renderApp(); }
            }, ['\u25B6'])
          ])
        ]),
        el('main', {}, [
          el('div', { className: 'iu-tabs' }, [
            el('button', {
              className: `iu-tab ${state.tab === 'non_whitelisted' ? 'iu-tab-active' : ''}`,
              onClick: () => { state.tab = 'non_whitelisted'; state.selected = []; state.page = 1; renderApp(); }
            }, ['Main List']),
            el('button', {
              className: `iu-tab ${state.tab === 'whitelisted' ? 'iu-tab-active' : ''}`,
              onClick: () => { state.tab = 'whitelisted'; state.selected = []; state.page = 1; renderApp(); }
            }, ['Whitelisted']),
            el('button', {
              className: `iu-tab ${state.tab === 'dashboard' ? 'iu-tab-active' : ''}`,
              onClick: () => { state.tab = 'dashboard'; loadSnapshots(); }
            }, ['Dashboard'])
          ]),
          state.tab === 'dashboard'
            ? renderDashboard()
            : el('div', { className: 'iu-user-list' },
                pageUsers.length === 0
                  ? [el('div', { className: 'iu-empty' }, ['No users found'])]
                  : pageUsers.map(renderUserItem)
              )
        ])
      ])
    ].filter(Boolean));
  }

  function renderDashboard() {
    if (state.snapshots.length === 0) {
      return el('div', { className: 'iu-empty' },
        ['No historical data yet. Complete a scan to generate snapshots.']
      );
    }
    return el('div', { className: 'iu-section' }, [
      el('h3', { className: 'iu-section-title' }, ['Historical Snapshots']),
      ...state.snapshots.map(s => {
        const d = new Date(s.timestamp);
        return el('div', { className: 'iu-user-item', style: 'margin-bottom:10px;display:block;' }, [
          el('div', { style: 'display:flex;justify-content:space-between;margin-bottom:10px;' }, [
            el('span', { style: 'color:var(--color-accent);font-weight:bold' }, [s.type.toUpperCase()]),
            el('span', { style: 'color:var(--color-text-muted);font-size:0.8rem' }, [d.toLocaleString()])
          ]),
          el('div', { className: 'iu-bar-container' }, [
            el('div', { className: 'iu-bar-label' }, ['Count']),
            el('div', { className: 'iu-bar-wrapper' }, [
              el('div', { className: 'iu-bar-fill', style: `width: ${Math.min(100, s.count / 10)}%` })
            ]),
            el('div', { className: 'iu-bar-value' }, [s.count])
          ])
        ]);
      })
    ]);
  }

  function renderFilter(key, label, icon) {
    return el('label', { className: 'iu-filter-item' }, [
      el('input', {
        type: 'checkbox', className: 'iu-checkbox', checked: state.filter[key],
        onChange: e => { state.filter[key] = e.target.checked; state.selected = []; state.page = 1; renderApp(); }
      }),
      el('span', {}, [`${icon} ${label}`])
    ]);
  }

  function renderUserItem(user) {
    const isSelected = state.selected.some(u => u.id === user.id);
    const isWhitelisted = state.whitelist.some(u => u.id === user.id);
    const ratio = user.following_count > 0 ? (user.follower_count / user.following_count) : 0;
    const isSpam = user.following_count > 5000 && user.follower_count < 50;
    const noAvatar = isDefaultAvatar(user.profile_pic_url);

    return el('label', { className: 'iu-user-item' }, [
      el('img', { className: 'iu-avatar', src: user.profile_pic_url }),
      el('div', { className: 'iu-user-info' }, [
        el('a', { className: 'iu-username', href: `https://instagram.com/${user.username}`,
          target: '_blank', onClick: e => e.stopPropagation()
        }, [user.username]),
        el('div', { className: 'iu-fullname' }, [user.full_name])
      ]),
      el('div', { className: 'iu-badges' }, [
        user.is_verified && el('span', { className: 'iu-badge iu-badge-verified' }, ['\u2713']),
        user.is_private && el('span', { className: 'iu-badge iu-badge-private' }, ['\uD83D\uDD12']),
        isSpam && el('span', { className: 'iu-badge iu-badge-spam' }, ['SPAM']),
        noAvatar && el('span', { className: 'iu-badge iu-badge-spam' }, ['GHOST'])
      ].filter(Boolean)),
      el('div', { style: 'font-size:0.7rem;color:var(--color-text-muted);min-width:60px;text-align:right;' },
        [`R: ${ratio.toFixed(2)}`]
      ),
      el('button', {
        className: 'iu-btn iu-btn-ghost', style: 'padding:0.25rem 0.5rem;',
        onClick: e => { e.preventDefault(); e.stopPropagation(); toggleWhitelist(user); }
      }, [isWhitelisted ? '\u2212' : '+']),
      el('input', {
        type: 'checkbox', className: 'iu-checkbox', checked: isSelected,
        onChange: e => {
          if (e.target.checked) state.selected.push(user);
          else state.selected = state.selected.filter(u => u.id !== user.id);
          renderApp();
        }
      })
    ]);
  }

  function renderToast() {
    return el('div', { className: `iu-toast iu-toast-${state.toast.type}` }, [
      el('span', {}, [state.toast.msg]),
      el('button', { className: 'iu-btn iu-btn-ghost', onClick: () => { state.toast = null; renderApp(); } }, ['\u2715'])
    ]);
  }

  function renderSettingsModal() {
    return el('div', {
      className: 'iu-modal-overlay',
      onClick: e => { if (e.target.classList.contains('iu-modal-overlay')) { state.showSettings = false; renderApp(); } }
    }, [
      el('div', { className: 'iu-modal' }, [
        el('div', { className: 'iu-modal-header' }, [
          el('h2', { className: 'iu-modal-title' }, ['Advanced Settings'])
        ]),
        el('form', { className: 'iu-modal-body', onSubmit: saveSettings }, [
          settingField('searchDelay', 'Search Delay (ms)', 500, 10000, 'number'),
          settingField('unfollowDelay', 'Unfollow Delay (ms)', 1000, 30000, 'number'),
          settingField('discordWebhookUrl', 'Discord Webhook URL', 0, 0, 'text'),
          el('label', { className: 'iu-filter-item' }, [
            el('input', { type: 'checkbox', name: 'enableQueue', className: 'iu-checkbox', checked: state.settings.enableQueue }),
            el('span', {}, ['Enable Background Queue'])
          ]),
          el('label', { className: 'iu-filter-item' }, [
            el('input', { type: 'checkbox', name: 'autoWhitelistVerified', className: 'iu-checkbox', checked: state.settings.autoWhitelistVerified }),
            el('span', {}, ['Auto-Whitelist Verified Accounts'])
          ]),
          el('label', { className: 'iu-filter-item' }, [
            el('input', { type: 'checkbox', name: 'autoWhitelistPrivate', className: 'iu-checkbox', checked: state.settings.autoWhitelistPrivate }),
            el('span', {}, ['Auto-Whitelist Private Accounts'])
          ]),
          el('div', { className: 'iu-modal-footer' }, [
            el('button', { type: 'submit', className: 'iu-btn iu-btn-primary' }, ['Save'])
          ])
        ])
      ])
    ]);
  }

  function settingField(key, label, min, max, type) {
    return el('div', { className: 'iu-form-group' }, [
      el('label', { className: 'iu-form-label' }, [label]),
      type === 'number'
        ? el('input', { type, className: 'iu-input', name: key, value: state.settings[key], min, max, style: 'width:100%;' })
        : el('input', { type, className: 'iu-input', name: key, value: state.settings[key], style: 'width:100%;' })
    ]);
  }

  // ============================================
  // Logic
  // ============================================
  function getFilteredUsers() {
    return state.results.filter(u => {
      const isWhitelisted = state.whitelist.some(w => w.id === u.id);
      if (state.tab === 'whitelisted' && !isWhitelisted) return false;
      if (state.tab === 'non_whitelisted' && isWhitelisted) return false;

      if (state.search && !u.username.toLowerCase().includes(state.search.toLowerCase())) return false;

      if (!state.filter.verified && u.is_verified) return false;
      if (!state.filter.private && u.is_private) return false;

      const isSpam = u.following_count > 5000 && u.follower_count < 50;
      if (state.filter.highSpam && !isSpam) return false;

      if (state.filter.noAvatar && !isDefaultAvatar(u.profile_pic_url)) return false;

      return true;
    }).sort((a, b) => a.username.localeCompare(b.username));
  }

  function getPageUsers(users) {
    return users.slice((state.page - 1) * CONFIG.USERS_PER_PAGE, state.page * CONFIG.USERS_PER_PAGE);
  }

  function toggleWhitelist(user) {
    const exists = state.whitelist.some(u => u.id === user.id);
    state.whitelist = exists ? state.whitelist.filter(u => u.id !== user.id) : [...state.whitelist, user];
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
      searchDelay: +fd.get('searchDelay'),
      unfollowDelay: +fd.get('unfollowDelay'),
      discordWebhookUrl: fd.get('discordWebhookUrl') || '',
      enableQueue: fd.get('enableQueue') === 'on',
      autoWhitelistVerified: fd.get('autoWhitelistVerified') === 'on',
      autoWhitelistPrivate: fd.get('autoWhitelistPrivate') === 'on'
    };
    Storage.set(CONFIG.SETTINGS_KEY, state.settings);
    state.showSettings = false;
    showToast('Settings saved', 'success');
  }

  async function loadTargetProfile() {
    state.status = 'loading_profile';
    renderApp();
    try {
      state.targetUser = await API.getUserByUsername(state.targetUsername);
      await startScan();
    } catch (err) {
      state.status = 'error';
      state.error = err.message;
      renderApp();
    }
  }

  async function startScan() {
    state.status = 'scanning';
    state.results = [];
    state.following = [];
    state.followers = [];
    state.pct = 0;
    state.totalCount = state.targetUser.following_count + state.targetUser.follower_count;
    renderApp();

    try {
      await fetchFollowingList(state.targetUser.id);
      await fetchFollowersList(state.targetUser.id);

      if (state.scanMode === 'following') state.results = state.following;
      else if (state.scanMode === 'followers') state.results = state.followers;
      else {
        const followerIds = new Set(state.followers.map(f => String(f.id)));
        state.results = state.following.filter(f => !followerIds.has(String(f.id)));
      }

      // Apply auto-whitelist rules (batched — single render + storage write)
      const toWhitelist = state.results.filter(u =>
        (state.settings.autoWhitelistVerified && u.is_verified) ||
        (state.settings.autoWhitelistPrivate && u.is_private)
      ).filter(u => !state.whitelist.some(w => w.id === u.id));
      if (toWhitelist.length > 0) {
        state.whitelist = [...state.whitelist, ...toWhitelist];
        Storage.set(CONFIG.STORAGE_KEY, state.whitelist);
      }

      state.pct = 100;
      await IDB.saveSnapshot(state.targetUser.id, state.scanMode, state.results);
      renderApp();
      showToast(`Scan complete! Found ${state.results.length}`, 'success');
      fireDiscordWebhook(`Scan complete for @${state.targetUser.username}. Found ${state.results.length} results.`);
    } catch (e) {
      showToast('Scan failed', 'error');
    }
  }

  async function fetchFollowingList(userId) {
    let cursor = null;
    let hasNext = true;
    while (hasNext) {
      const data = await API.getFollowing(userId, cursor);
      data.edges.forEach(e => state.following.push(e.node));
      hasNext = data.page_info.has_next_page;
      cursor = data.page_info.end_cursor;
      state.pct = Math.floor((state.following.length / state.totalCount) * 100);
      renderApp();
      await sleep(await randomDelay(state.settings.searchDelay));
    }
  }

  async function fetchFollowersList(userId) {
    let cursor = null;
    let hasNext = true;
    while (hasNext) {
      const data = await API.getFollowers(userId, cursor);
      data.edges.forEach(e => state.followers.push(e.node));
      hasNext = data.page_info.has_next_page;
      cursor = data.page_info.end_cursor;
      state.pct = Math.floor(((state.following.length + state.followers.length) / state.totalCount) * 100);
      renderApp();
      await sleep(await randomDelay(state.settings.searchDelay));
    }
  }

  // ============================================
  // Initialize
  // ============================================
  async function init() {
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin: 0; padding: 0; background: #000;';
    const app = el('div', { className: 'iu-app' });
    document.body.appendChild(app);
    await IDB.init();
    QueueManager.start();
    renderApp();
  }

  if (location.hostname === 'www.instagram.com') init();
  else alert('Run on instagram.com');

})();
