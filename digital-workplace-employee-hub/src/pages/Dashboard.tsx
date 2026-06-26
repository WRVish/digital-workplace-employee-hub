import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { StatCard, CardHeader, Pill, Icons } from '../components/UIElements';
import { IncidentRequest, LeaveRequest, ExpenseClaim, } from '../types';

interface DashboardProps {
  userEmail: string;
  userName: string;
  isAdmin: boolean;
  isManager: boolean;
  onNavigate: (pageId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, userName, isAdmin, isManager: _isManager, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<IncidentRequest[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [incRes, levRes, expRes] = await Promise.all([
          DataService.getIncidentRequests(userEmail, []),
          DataService.getLeaveRequests(userEmail, []),
          DataService.getExpenseClaims(userEmail, [])
        ]);
        setIncidents(incRes);
        setLeaves(levRes);
        setExpenses(expRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userEmail]);

  if (loading) return <div>Loading dashboard...</div>;

  const activeIncidents = incidents.filter(i => i.Status !== 'Resolved').length;
  const pendingExpenses = expenses.filter(e => e.ManagerApproval === 'Pending').length;

  const annualTaken = leaves.filter(l => l.LeaveType === 'Annual' && l.ApprovalStatus !== 'Rejected').reduce((acc, curr) => acc + (curr.TotalDays || 1), 0);
  const sickTaken = leaves.filter(l => l.LeaveType === 'Sick' && l.ApprovalStatus !== 'Rejected').reduce((acc, curr) => acc + (curr.TotalDays || 1), 0);
  const annualLeft = Math.max(0, 14 - annualTaken);
  const sickLeft = Math.max(0, 14 - sickTaken);
  const totalLeft = annualLeft + sickLeft;

  return (
    <div className="page active" id="page-dashboard">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1 id="dashGreeting">Good morning, {userName.split(' ')[0]} 👋</h1>
          <p>Here's what's happening across your organisation today.</p>
        </div>
      </div>

      <div className="grid g4 mb14">
        <StatCard type="leave" value={totalLeft} label="Leave Days Left" subValue={`Annual: ${annualLeft} remaining`} />
        <StatCard type="incident" value={activeIncidents} label="My Open Tickets" subValue="Action required" subType="down" />
        <StatCard type="expense" value={`$${expenses.reduce((a,b)=>a+(b.Amount||0),0)}`} label="Expenses Pending" subValue={`${pendingExpenses} in review`} />
        <StatCard type="asset" value="2" label="Assigned Assets" subValue="Laptop + phone" />
      </div>

      {isAdmin && (
        <div id="adminStats">
          <div className="admin-banner">
            <div>
              <h2>Organisation Overview</h2>
              <p>Live snapshot of workforce activity across all modules.</p>
            </div>
            <div className="banner-stats">
              <div className="bstat"><div className="bstat-v">6</div><div className="bstat-l">Employees</div></div>
              <div className="bstat"><div className="bstat-v">3</div><div className="bstat-l">Open Tickets</div></div>
              <div className="bstat"><div className="bstat-v">2</div><div className="bstat-l">Pending Leave</div></div>
              <div className="bstat"><div className="bstat-v">$1.6K</div><div className="bstat-l">Claims MTD</div></div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb14">
        <CardHeader title="Quick Actions" dotColor="var(--brand-600)" />
        <div className="qa-wrap" id="qaWrap">
          <button className="qa" onClick={() => onNavigate('myleave')}><span className="dot" style={{ background: 'var(--c-leave)' }}></span>Apply Leave</button>
          <button className="qa" onClick={() => onNavigate('mytickets')}><span className="dot" style={{ background: 'var(--c-incident)' }}></span>Raise Ticket</button>
          <button className="qa" onClick={() => onNavigate('myexpenses')}><span className="dot" style={{ background: 'var(--c-expense)' }}></span>Submit Expense</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 300px', gap: '14px', marginBottom: '14px' }}>
        <div className="card">
          <CardHeader title="My Requests" dotColor="var(--c-leave)" linkText="View all" />
          <table className="dt">
            <thead>
              <tr><th>ID</th><th>Type</th><th>Status</th></tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.LeaveID || l.ID || Math.random().toString()}>
                  <td><span className="mono">{l.LeaveID}</span></td>
                  <td>{l.LeaveType} Leave</td>
                  <td><Pill type={l.ApprovalStatus === 'Approved' ? 'approved' : 'pending'} text={l.ApprovalStatus || 'Pending'} /></td>
                </tr>
              ))}
              {incidents.map((inc) => (
                <tr key={inc.TicketID || inc.ID || Math.random().toString()}>
                  <td><span className="mono">{inc.TicketID}</span></td>
                  <td>IT Ticket</td>
                  <td><Pill type={inc.Status === 'Resolved' ? 'resolved' : 'inprog'} text={inc.Status || 'In Progress'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <CardHeader title="Activity Feed" dotColor="var(--brand-400)" linkText="All" />
          <div className="act-list">
            <div className="act-item">
              <div className="act-ico" style={{ background: '#ECFDF5', color: 'var(--c-leave)' }}><Icons.Check /></div>
              <div>
                <div className="act-txt"><strong>Leave LV-001</strong> approved by Pradeep</div>
                <div className="act-time">2 hours ago</div>
              </div>
            </div>
            {/* More activities could go here */}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card">
            <CardHeader title="My Leave Balance" dotColor="var(--c-leave)" />
            <div className="lb-wrap"><div className="lb-row"><span className="lb-name">Annual</span><span className="lb-count">{annualLeft}/14 days</span></div><div className="lb-track"><div className="lb-fill" style={{ width: `${(annualLeft/14)*100}%`, background: 'var(--c-leave)' }}></div></div></div>
            <div className="lb-wrap"><div className="lb-row"><span className="lb-name">Sick</span><span className="lb-count">{sickLeft}/14 days</span></div><div className="lb-track"><div className="lb-fill" style={{ width: `${(sickLeft/14)*100}%`, background: 'var(--c-asset)' }}></div></div></div>
          </div>
        </div>
      </div>

    </div>
  );
};
