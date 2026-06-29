import React from 'react';export const Icons = {
  Dash: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".9" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".7" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" fill="currentColor" opacity=".8" />
      <path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Cal: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Warn: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 3L2 17h16L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 11V8M10 14v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Card: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10.5" r="2" fill="currentColor" opacity=".7" />
      <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Plane: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M3 17l4-7 5 3 5-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  People: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="7" r="3" fill="currentColor" opacity=".7" />
      <path d="M1 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="6" r="2.5" fill="currentColor" opacity=".5" />
      <path d="M17 17c0-2.761-1.343-5-3-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Screen: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 17h6M10 14v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Gear: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 2a6 6 0 016 6v3l1.5 2.5H2.5L4 11V8a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 17a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: '13px', height: '13px', color: 'var(--text-4)', flexShrink: 0 }}>
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Hamburger: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};
