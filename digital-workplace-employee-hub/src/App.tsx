import { useEffect, useState } from 'react';
import { DataService } from './dataService';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { MyProfile } from './pages/MyProfile';
import { MyLeave, LeaveManagement } from './pages/LeavePages';
import { MyTickets, IncidentManagement } from './pages/IncidentPages';
import { MyExpenses, ExpenseManagement } from './pages/ExpensePages';
import { MyTravel, TravelManagement } from './pages/TravelPages';
import { EmployeeDirectory, EmployeeManagement } from './pages/DirectoryPages';
import { RoleManager, AssetManagement } from './pages/SystemPages';
import { Events } from './pages/Events';

// Dummy page fallback
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="page active">
    <div className="page-hd"><div className="page-hd-l"><h1>{title}</h1></div></div>
    <div className="card"><p>This page is under construction or not found.</p></div>
  </div>
);

function App() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');
  const [userInitials, setUserInitials] = useState<string>('U');
  const [roles, setRoles] = useState<string[]>(['employee']);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const applyUserPreferences = async (email: string) => {
      const prefs = await DataService.getUserPreferences(email);
      const htmlClassList = document.documentElement.classList;
      
      htmlClassList.forEach(cls => {
        if (cls.startsWith('theme-') || cls.startsWith('scheme-')) {
          htmlClassList.remove(cls);
        }
      });

      if (prefs) {
        const themeStr = typeof prefs.Theme === 'object' ? prefs.Theme.Value : prefs.Theme;
        const schemeStr = typeof prefs.ColorScheme === 'object' ? prefs.ColorScheme.Value : prefs.ColorScheme;
        if (themeStr === 'Dark') htmlClassList.add('theme-dark');
        if (schemeStr && schemeStr !== 'Ocean Blue') {
          htmlClassList.add('scheme-' + schemeStr.toLowerCase().replace(/ /g, '-'));
        }
      }
    };

    const fetchRoles = async (email: string) => {
      const userRoles = await DataService.getUserRoles(email);
      const roleNames = new Set(userRoles.map(r => r.Role));
      
      const roleKeys: string[] = ['employee'];
      if (roleNames.has('System Admin')) roleKeys.push('sysadmin');
      if (roleNames.has('IT Admin')) roleKeys.push('itadmin');
      if (roleNames.has('HR Admin')) roleKeys.push('hradmin');
      if (roleNames.has('Finance Admin')) roleKeys.push('finance');
      if (roleNames.has('Manager')) roleKeys.push('manager');
      
      setRoles(roleKeys);
    };

    const initApp = async () => {
      try {
        const email = await DataService.getCurrentUserEmail();
        setUserEmail(email);
        
        const namePart = email.split('@')[0];
        const userNameParts = namePart.split('.');
        setUserName(userNameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '));
        setUserInitials(userNameParts.map(p => p.charAt(0).toUpperCase()).join(''));

        await fetchRoles(email);
        await applyUserPreferences(email);
      } catch (error) {
        console.error("Error initializing app", error);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading Digital Workplace...</div>;
  }

  const getPrimaryRole = () => {
    if (roles.includes('sysadmin')) return 'sysadmin';
    if (roles.includes('itadmin')) return 'itadmin';
    if (roles.includes('hradmin')) return 'hradmin';
    if (roles.includes('finance')) return 'finance';
    if (roles.includes('manager')) return 'manager';
    return 'employee';
  };

  const getRolePillText = (roleKey: string) => {
    const map: Record<string, string> = {
      'sysadmin': 'System Admin',
      'itadmin': 'IT Admin',
      'hradmin': 'HR Admin',
      'finance': 'Finance Admin',
      'manager': 'Manager',
      'employee': 'Employee'
    };
    return map[roleKey] || 'Employee';
  };

  const primaryRole = getPrimaryRole();
  const rolePillClass = `rp-${primaryRole}`;
  const rolePillText = getRolePillText(primaryRole);
  const avatarGradient = 'linear-gradient(135deg, var(--brand-600), var(--brand-400))';

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userEmail={userEmail} userName={userName} isAdmin={roles.includes('sysadmin')} isManager={roles.includes('manager') || roles.includes('sysadmin')} onNavigate={setCurrentPage} />;
      case 'myprofile':
        return <MyProfile userEmail={userEmail} userName={userName} userInitials={userInitials} rolePillText={rolePillText} avatarGradient={avatarGradient} />;
      case 'myleave':
        return <MyLeave userEmail={userEmail} />;
      case 'mytickets':
        return <MyTickets userEmail={userEmail} />;
      case 'myexpenses':
        return <MyExpenses userEmail={userEmail} />;
      case 'mytravel':
        return <MyTravel userEmail={userEmail} />;
      case 'directory':
        return <EmployeeDirectory />;
      case 'employees':
        return <EmployeeManagement />;
      case 'leaves':
        return <LeaveManagement userEmail={userEmail} />;
      case 'incidents':
        return <IncidentManagement userEmail={userEmail} />;
      case 'expenses':
        return <ExpenseManagement userEmail={userEmail} />;
      case 'travels':
        return <TravelManagement userEmail={userEmail} />;
      case 'assets':
        return <AssetManagement />;
      case 'events':
        return <Events isAdmin={roles.includes('sysadmin') || roles.includes('hradmin') || roles.includes('itadmin')} />;
      case 'roles':
        return <RoleManager />;
      case 'system':
        return <PlaceholderPage title="System Health" />;
      default:
        return <PlaceholderPage title={currentPage} />;
    }
  };

  return (
    <>
      <Sidebar 
        roles={roles}
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userInitials={userInitials}
        userName={userName}
        userEmail={userEmail}
        rolePillClass={rolePillClass}
        rolePillText={rolePillText}
        avatarGradient={avatarGradient}
      />
      <Topbar 
        pageTitle={currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        userInitials={userInitials}
        avatarGradient={avatarGradient}
      />
      <main className="main">
        {renderPage()}
      </main>
      
      {/* Toast container */}
      <div id="toast" style={{ opacity: 0, transform: 'translateY(20px)' }}></div>
    </>
  );
}

export default App;
