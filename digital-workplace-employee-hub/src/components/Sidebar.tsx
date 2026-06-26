import React from 'react';
import { navConfig } from '../config/nav';
import { Icons } from './Icons';

interface SidebarProps {
  roles: string[];
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (pageId: string) => void;
  userInitials: string;
  userName: string;
  userEmail: string;
  rolePillClass: string;
  rolePillText: string;
  avatarGradient: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  roles,
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  userInitials,
  userName,
  userEmail,
  rolePillClass,
  rolePillText,
  avatarGradient
}) => {
  const combinedItems: any[] = [];
  const seenIds = new Set();
  
  const orderedRoles = ['employee', 'manager', 'hradmin', 'itadmin', 'finance', 'sysadmin'].filter(r => roles.includes(r));
  if (orderedRoles.length === 0) orderedRoles.push('employee');

  orderedRoles.forEach(r => {
    const roleItems = navConfig[r] || [];
    roleItems.forEach(item => {
      if (item.id) {
         if (!seenIds.has(item.id)) {
           combinedItems.push(item);
           seenIds.add(item.id);
         }
      } else if (item.s) {
         if (!seenIds.has(`sec-${item.s}`)) {
           combinedItems.push(item);
           seenIds.add(`sec-${item.s}`);
         }
      }
    });
  });
  
  const items = combinedItems;

  return (
    <>
      <button className={`sb-ov ${isOpen ? 'open' : ''}`} id="sbOv" onClick={onClose} aria-label="Close Sidebar" style={{ border: 'none', background: 'transparent' }}></button>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-hd">
          <div className="logo-mark">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M10 4v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="10" cy="10" r="8" stroke="#fff" strokeWidth="1.5" strokeOpacity=".4" />
            </svg>
          </div>
          <span className="logo-txt">Work<span>Hub</span></span>
        </div>
        <div className="sidebar-user">
          <div className="avatar av-lg" id="sbAv" style={{ background: avatarGradient }}>{userInitials}</div>
          <div className="user-info">
            <div className="uname" id="sbName">{userName}</div>
            <div className="uemail" id="sbEmail">{userEmail}</div>
            <div className={`role-pill ${rolePillClass}`} id="sbPill">{rolePillText}</div>
          </div>
        </div>
        <nav className="nav-scroll" id="navScroll">
          {items.map((item) => {
            if (item.s) {
              return <div key={`sec-${item.s}`} className="nav-label">{item.s}</div>;
            }
            const isActive = currentPage === item.id;
            const IconComp = Icons[item.ic as keyof typeof Icons];
            return (
              <button 
                key={item.id} 
                className={`nav-item ${isActive ? 'active' : ''}`} 
                onClick={() => { onNavigate(item.id || ''); onClose(); }}
                style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left' }}
              >
                <div className="nav-ico" style={{ color: item.col }}>
                  {IconComp && <IconComp />}
                </div>
                <div className="nav-dot" style={{ background: item.col }}></div>
                <span className="nav-txt">{item.l}</span>
                {item.b && <span className="nav-badge">{item.b}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
