import React from 'react';
import { Icons } from './Icons';
export { Icons };

export const StatCard: React.FC<{
  type: 'leave' | 'incident' | 'expense' | 'asset' | 'employee' | 'brand' | 'travel' | 'events';
  value: string | number;
  label: string;
  subValue?: string;
  subType?: 'up' | 'down' | 'neu';
}> = ({ type, value, label, subValue, subType = 'neu' }) => {
  const IconComp = Icons[type as keyof typeof Icons] || Icons.Dash;
  return (
    <div className={`sc ${type}`}>
      <div className={`si ${type}`}>
        <IconComp />
      </div>
      <div>
        <div className="sv">{value}</div>
        <div className="sl">{label}</div>
        {subValue && <div className={`sd ${subType}`}>{subValue}</div>}
      </div>
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  dotColor: string;
  linkText?: string;
  onLinkClick?: () => void;
  children?: React.ReactNode;
}> = ({ title, dotColor, linkText, onLinkClick, children }) => (
  <div className="sh">
    <h2>
      <span className="sdot" style={{ background: dotColor }}></span>
      {title}
    </h2>
    {linkText && <button className="sh-link" onClick={onLinkClick} style={{ border: 'none', background: 'none', padding: 0 }}>{linkText}</button>}
    {children}
  </div>
);

export const Pill: React.FC<{
  type: 'approved' | 'pending' | 'rejected' | 'inprog' | 'resolved' | 'new' | 'active' | 'assigned' | 'processing';
  text: string;
  className?: string;
}> = ({ type, text, className = '' }) => (
  <span className={`pill p-${type} ${className}`}>{text}</span>
);

export const PriorityPill: React.FC<{
  priority: 'High' | 'Medium' | 'Low';
}> = ({ priority }) => {
  const clsMap = { High: 'pr-high', Medium: 'pr-med', Low: 'pr-low' };
  const cls = clsMap[priority];
  return <span className={cls}>{priority}</span>;
};

export const Avatar: React.FC<{
  initials: string;
  gradient: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}> = ({ initials, gradient, size = 'md', className = '', style }) => {
  const sizeMap: Record<string, string> = { sm: 'av-sm', lg: 'av-lg', md: '' };
  const sizeClass = sizeMap[size] || '';
  return (
    <div className={`avatar ${sizeClass} ${className}`} style={{ background: gradient, ...style }}>
      {initials}
    </div>
  );
};

interface ButtonProps {
  variant?: 'primary' | 'outline' | 'success' | 'danger';
  size?: 'sm' | 'md';
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', onClick, children, icon, className = '', disabled }) => {
  const classes = ['btn', `btn-${variant}`, size === "sm" ? "btn-sm" : "", className].filter(Boolean).join(' ');
  return (
    <button className={classes} onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export const FormGroup: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input className="form-input" {...props} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select className="form-select" {...props} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea className="form-textarea" {...props} />
);
