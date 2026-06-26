import React, { useState, useEffect } from 'react';
import { CardHeader, Avatar, Button } from '../components/UIElements';
import { DataService } from '../dataService';

interface MyProfileProps {
  userEmail: string;
  userName: string;
  userInitials: string;
  rolePillText: string;
  avatarGradient: string;
}

export const MyProfile: React.FC<MyProfileProps> = ({ userEmail, userName, userInitials, rolePillText, avatarGradient }) => {
  const [theme, setTheme] = useState('Light');
  const [colorScheme, setColorScheme] = useState('Ocean Blue');
  const [prefId, setPrefId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      const prefs = await DataService.getUserPreferences(userEmail);
      if (prefs) {
        setPrefId(prefs.ID ? String(prefs.ID) : null);
        setTheme(typeof prefs.Theme === 'object' ? prefs.Theme.Value : prefs.Theme || 'Light');
        setColorScheme(typeof prefs.ColorScheme === 'object' ? prefs.ColorScheme.Value : prefs.ColorScheme || 'Ocean Blue');
      }
    };
    loadPrefs();
  }, [userEmail]);

  const handleSavePreferences = async () => {
    setSaving(true);
    await DataService.saveUserPreferences(prefId, userEmail, theme, colorScheme);
    
    // Update live DOM classes
    const htmlClassList = document.documentElement.classList;
    
    // Convert DOMTokenList to array to safely iterate and remove
    const classesToRemove = Array.from(htmlClassList).filter(c => c.startsWith('theme-') || c.startsWith('scheme-'));
    classesToRemove.forEach(c => htmlClassList.remove(c));

    if (theme === 'Dark') htmlClassList.add('theme-dark');
    if (colorScheme && colorScheme !== 'Ocean Blue') {
      const schemeClass = 'scheme-' + colorScheme.toLowerCase().replace(/ /g, '-');
      htmlClassList.add(schemeClass);
    }
    
    setSaving(false);
  };

  const lightSchemes = [
    { name: 'Ocean Blue', bg: '#3B6AE8' },
    { name: 'Teal Breeze', bg: '#0D9488' },
    { name: 'Royal Purple', bg: '#9333EA' },
    { name: 'Ruby Red', bg: '#DC2626' },
    { name: 'Sunset Orange', bg: '#EA580C' },
    { name: 'Forest Green', bg: '#16A34A' },
  ];
  
  const darkSchemes = [
    { name: 'Cyber Neon', bg: '#00CED1' },
    { name: 'Midnight Navy', bg: '#023E8A' },
    { name: 'Steel Blue', bg: '#2D6DA9' },
    { name: 'Royal Purple', bg: '#9333EA' },
    { name: 'Ocean Blue', bg: '#3B6AE8' },
  ];

  const currentSchemes = theme === 'Dark' ? darkSchemes : lightSchemes;

  return (
    <div className="page active" id="page-myprofile">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>My Profile</h1>
          <p>Your personal information and work details.</p>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="sh">
            <h2><span className="sdot" style={{ background: 'var(--c-employee)' }}></span>Personal Details</h2>
            <button className="btn btn-outline btn-sm">Edit</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <Avatar initials={userInitials} gradient={avatarGradient} size="lg" className="profile-av" style={{ width: '58px', height: '58px', fontSize: '1.1rem' }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{userName}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>{rolePillText}</div>
            </div>
          </div>
          <table className="dt">
            <tbody>
              <tr><th scope="row" className="tm ts">Employee ID</th><td className="fw6">E001</td></tr>
              <tr><th scope="row" className="tm ts">Email</th><td>{userEmail}</td></tr>
              <tr><th scope="row" className="tm ts">Department</th><td>IT</td></tr>
              <tr><th scope="row" className="tm ts">Job Title</th><td>{rolePillText}</td></tr>
              <tr><th scope="row" className="tm ts">Location</th><td>HQ · Singapore</td></tr>
              <tr><th scope="row" className="tm ts">Employment Type</th><td>Full-Time</td></tr>
              <tr><th scope="row" className="tm ts">Joining Date</th><td>Jan 1, 2020</td></tr>
              <tr><th scope="row" className="tm ts">Status</th><td><span className="pill p-active">Active</span></td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card">
            <CardHeader title="Leave Summary" dotColor="var(--c-leave)" />
            <div className="lb-wrap"><div className="lb-row"><span className="lb-name">Annual</span><span className="lb-count">8/14 days</span></div><div className="lb-track"><div className="lb-fill" style={{ width: '57%', background: 'var(--c-leave)' }}></div></div></div>
            <div className="lb-wrap"><div className="lb-row"><span className="lb-name">Sick</span><span className="lb-count">10/14 days</span></div><div className="lb-track"><div className="lb-fill" style={{ width: '71%', background: 'var(--c-asset)' }}></div></div></div>
            <div className="lb-wrap"><div className="lb-row"><span className="lb-name">Unpaid</span><span className="lb-count">0/5 days</span></div><div className="lb-track"><div className="lb-fill" style={{ width: '0%', background: 'var(--text-3)' }}></div></div></div>
          </div>

          <div className="card">
            <CardHeader title="Appearance Preferences" dotColor="var(--brand-600)" />
            
            <div className="form-group">
              <div style={{ fontWeight: 600, fontSize: '.78rem', color: 'var(--text-2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.03em' }}>Theme</div>
              <div className="theme-picker">
                <button 
                  className={`theme-btn ${theme === 'Light' ? 'active' : ''}`}
                  onClick={() => setTheme('Light')}
                >
                  <span style={{ fontSize: '1.2rem' }}>☀️</span> Light
                </button>
                <button 
                  className={`theme-btn ${theme === 'Dark' ? 'active' : ''}`}
                  onClick={() => setTheme('Dark')}
                >
                  <span style={{ fontSize: '1.2rem' }}>🌙</span> Dark
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '.78rem', color: 'var(--text-2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.03em' }}>Color Scheme <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '0.75rem', marginLeft: '6px', textTransform: 'none' }}>{colorScheme}</span></div>
              <div className="scheme-grid">
                {currentSchemes.map(scheme => (
                  <button 
                    key={scheme.name}
                    className={`scheme-swatch ${colorScheme === scheme.name ? 'active' : ''}`}
                    style={{ background: scheme.bg }}
                    onClick={() => setColorScheme(scheme.name)}
                    title={scheme.name}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={handleSavePreferences} disabled={saving}>{saving ? 'Saving...' : 'Save Preferences'}</Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
