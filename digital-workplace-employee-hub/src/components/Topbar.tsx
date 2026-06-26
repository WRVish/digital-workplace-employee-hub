import React from 'react';
import { Icons } from './Icons';

interface TopbarProps {
  pageTitle: string;
  onToggleSidebar: () => void;
  userInitials: string;
  avatarGradient: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  pageTitle,
  onToggleSidebar,
  userInitials,
  avatarGradient
}) => {
  return (
    <header className="topbar">
      <button className="hamburger" onClick={onToggleSidebar}>
        <Icons.Hamburger />
      </button>
      <div className="topbar-title" id="tbTitle">{pageTitle}</div>
      <div className="topbar-search">
        <Icons.Search />
        <input type="text" placeholder="Search…" />
      </div>
      <div className="topbar-actions">
        <button className="icon-btn">
          <Icons.Bell />
          <span className="notif-dot"></span>
        </button>
        <button className="icon-btn">
          <Icons.Gear />
        </button>
        <div 
          className="avatar av-lg" 
          id="tbAv" 
          style={{ background: avatarGradient, cursor: 'pointer', fontSize: '.8rem' }}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
};
