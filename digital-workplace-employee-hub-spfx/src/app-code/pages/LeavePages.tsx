import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { StatCard, CardHeader, Pill, Button, Icons, Modal, FormGroup, Input, Select, Textarea } from '../components/UIElements';
import { LeaveRequest } from '../types';

const getLeaveStatus = (status: string) => { 
  if (status === 'Approved') return 'approved'; 
  if (status === 'Rejected') return 'rejected'; 
  return 'pending'; 
};

export const MyLeave: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [formData, setFormData] = useState({ Title: '', LeaveType: 'Annual', StartDate: '', EndDate: '', Reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    DataService.getLeaveRequests(userEmail, []).then(res => {
      setLeaves(res);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [userEmail]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const start = new Date(formData.StartDate);
      const end = new Date(formData.EndDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

      await DataService.createLeaveRequest({
        Title: formData.Title || `${formData.LeaveType} Leave Request`,
        LeaveType: formData.LeaveType,
        StartDate: start.toISOString(),
        EndDate: end.toISOString(),
        TotalDays: days,
        Reason: formData.Reason,
        ApprovalStatus: 'Pending'
      });
      setIsRaiseOpen(false);
      setFormData({ Title: '', LeaveType: 'Annual', StartDate: '', EndDate: '', Reason: '' });
      loadData();
    } catch (e: any) {
      alert("Failed to apply for leave: " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;


  const pendingCount = leaves.filter(l => l.ApprovalStatus === 'Pending').length;
  const annualTaken = leaves.filter(l => l.LeaveType === 'Annual' && l.ApprovalStatus !== 'Rejected').reduce((acc, curr) => acc + (curr.TotalDays || 1), 0);
  const sickTaken = leaves.filter(l => l.LeaveType === 'Sick' && l.ApprovalStatus !== 'Rejected').reduce((acc, curr) => acc + (curr.TotalDays || 1), 0);
  
  const annualLeft = Math.max(0, 14 - annualTaken);
  const sickLeft = Math.max(0, 14 - sickTaken);

  return (
    <div className="eh-page active">
      <div className="eh-page-hd">
        <div className="eh-page-hd-l">
          <h1>My Leave</h1>
          <p>Track your leave balances and request time off.</p>
        </div>
        <Button variant="primary" icon={<Icons.Plus />} onClick={() => setIsRaiseOpen(true)}>Apply Leave</Button>
      </div>

      <div className="eh-grid eh-g3 mb14">
        <StatCard type="leave" value={annualLeft} label="Annual Leave Left" subValue="14 total days" />
        <StatCard type="asset" value={sickLeft} label="Sick Leave Left" subValue="14 total days" />
        <StatCard type="incident" value={pendingCount} label="Pending Requests" subValue="Awaiting manager" />
      </div>

      <div className="eh-card">
        <CardHeader title="My Leave History" dotColor="var(--c-leave)" />
        {leaves.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No leave requests found.</div> : (
        <table className="dt">
          <thead>
            <tr><th>Leave ID</th><th>Type</th><th>Start Date</th><th>End Date</th><th>Days</th><th>Status</th></tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.LeaveID || l.ID || crypto.randomUUID()}>
                <td><span className="mono">{l.LeaveID}</span></td>
                <td className="fw6">{l.LeaveType} Leave</td>
                <td>{l.StartDate ? new Date(l.StartDate).toLocaleDateString() : 'N/A'}</td>
                <td>{l.EndDate ? new Date(l.EndDate).toLocaleDateString() : 'N/A'}</td>
                <td>{l.TotalDays || 1}</td>
                <td><Pill type={getLeaveStatus(l.ApprovalStatus || '')} text={l.ApprovalStatus || 'Pending'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <Modal isOpen={isRaiseOpen} onClose={() => setIsRaiseOpen(false)} title="Apply for Leave">
        <FormGroup label="Leave Type">
          <Select value={formData.LeaveType} onChange={e => setFormData({...formData, LeaveType: e.target.value})}>
            <option>Annual</option>
            <option>Sick</option>
            <option>Unpaid</option>
            <option>Maternity</option>
          </Select>
        </FormGroup>
        <div className="eh-grid eh-g2" style={{ gap: '16px' }}>
          <FormGroup label="Start Date">
            <Input type="date" value={formData.StartDate} onChange={e => setFormData({...formData, StartDate: e.target.value})} />
          </FormGroup>
          <FormGroup label="End Date">
            <Input type="date" value={formData.EndDate} onChange={e => setFormData({...formData, EndDate: e.target.value})} />
          </FormGroup>
        </div>
        <FormGroup label="Reason (Optional)">
          <Textarea value={formData.Reason} onChange={e => setFormData({...formData, Reason: e.target.value})} placeholder="Going on vacation..." />
        </FormGroup>
        <div className="modal-actions">
          <Button onClick={() => setIsRaiseOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export const LeaveManagement: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New states for Leave Types and Balances
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string>('');
  const [employeeBalances, setEmployeeBalances] = useState<any[]>([]);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({ Title: '', DefaultBalance: 14 });

  const loadData = () => {
    Promise.all([
      DataService.getLeaveRequests(userEmail, ['HR Admin', 'Manager']),
      DataService.getLeaveTypes(),
      DataService.getEmployees()
    ]).then(([resLeaves, resTypes, resEmps]) => {
      setLeaves(resLeaves);
      setLeaveTypes(resTypes);
      setEmployees(resEmps);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [userEmail]);

  useEffect(() => {
    if (selectedEmployeeEmail) {
      DataService.getLeaveBalances(selectedEmployeeEmail).then(bals => setEmployeeBalances(bals));
    } else {
      setEmployeeBalances([]);
    }
  }, [selectedEmployeeEmail]);

  const handleAction = async (id: string, status: string) => {
    setSubmitting(true);
    try {
      await DataService.updateLeaveRequest(id, { ApprovalStatus: status });
      loadData();
    } catch (e: any) {
      alert(`Failed to ${status.toLowerCase()} leave: ` + e.message);
    }
    setSubmitting(false);
  };

  const handleAddLeaveType = async () => {
    setSubmitting(true);
    try {
      await DataService.createLeaveType(newLeaveType.Title, newLeaveType.DefaultBalance);
      setNewLeaveType({ Title: '', DefaultBalance: 14 });
      setIsTypeModalOpen(false);
      loadData();
    } catch (e: any) {
      alert("Failed to add leave type: " + e.message);
    }
    setSubmitting(false);
  };

  const handleBalanceChange = (typeTitle: string, newBal: number) => {
    setEmployeeBalances(prev => prev.map(b => b.LeaveType === typeTitle ? { ...b, Balance: newBal } : b));
  };

  const saveBalance = async (typeTitle: string, newBal: number) => {
    await DataService.updateLeaveBalance(selectedEmployeeEmail, typeTitle, newBal);
    alert('Balance updated successfully');
  };

  if (loading) return <div>Loading...</div>;

  const pendingCount = leaves.filter(l => l.ApprovalStatus === 'Pending').length;
  const approvedCount = leaves.filter(l => l.ApprovalStatus === 'Approved').length;
  
  const filteredEmployees = employees.filter(e => e.Title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.Email?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="eh-page active">
      <div className="eh-page-hd">
        <div className="eh-page-hd-l">
          <h1>Leave Management</h1>
          <p>Manage leave types, employee balances, and approve requests.</p>
        </div>
      </div>

      <div className="eh-grid eh-g3 mb14">
        <StatCard type="leave" value={pendingCount} label="Pending Approvals" subValue="Action required" />
        <StatCard type="employee" value={approvedCount} label="Total Approved" />
        <StatCard type="events" value={leaveTypes.length} label="Leave Types Configured" />
      </div>

      <div className="eh-card mb14">
        <CardHeader title="Employee Leave Balances" dotColor="var(--c-employee)" />
        <div style={{ marginBottom: '16px' }}>
          <FormGroup label="Search Employee">
             <Input 
                placeholder="Type name or email..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
             />
             {searchQuery && !selectedEmployeeEmail && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto', marginTop: '4px' }}>
                   {filteredEmployees.map(e => (
                      <div 
                         key={e.Email} 
                         className="emp-search-result"
                         role="button"
                         tabIndex={0}
                         onClick={() => { setSelectedEmployeeEmail(e.Email); setSearchQuery(e.Title); }}
                         onKeyDown={(k) => { if (k.key === 'Enter' || k.key === ' ') { setSelectedEmployeeEmail(e.Email); setSearchQuery(e.Title); } }}
                      >
                         <div className="emp-name">{e.Title}</div><strong> ({e.Email})</strong>
                      </div>
                   ))}
                   {filteredEmployees.length === 0 && <div style={{ padding: '8px' }}>No employees found.</div>}
                </div>
             )}
          </FormGroup>
          {selectedEmployeeEmail && (
            <Button variant="outline" size="sm" onClick={() => { setSelectedEmployeeEmail(''); setSearchQuery(''); }}>Clear Selection</Button>
          )}
        </div>
        
        {selectedEmployeeEmail && employeeBalances.length > 0 && (
          <table className="dt">
            <thead>
              <tr><th>Leave Type</th><th>Remaining Balance</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {employeeBalances.map(b => (
                <tr key={b.LeaveType}>
                  <td className="fw6">{b.LeaveType}</td>
                  <td>
                    <Input 
                      type="number" 
                      value={b.Balance} 
                      onChange={(e) => handleBalanceChange(b.LeaveType, Number.parseInt(e.target.value, 10) || 0)}
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <Button variant="primary" size="sm" onClick={() => saveBalance(b.LeaveType, b.Balance)}>Save</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="eh-grid eh-g2 mb14">
        <div className="eh-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <CardHeader title="Leave Types" dotColor="var(--c-leave)" />
            <Button variant="outline" size="sm" icon={<Icons.Plus />} onClick={() => setIsTypeModalOpen(true)}>Add Type</Button>
          </div>
          <table className="dt">
            <thead>
              <tr><th>Type</th><th>Default Quota (Days)</th></tr>
            </thead>
            <tbody>
              {leaveTypes.map(lt => (
                <tr key={lt.Title}>
                  <td className="fw6">{lt.Title}</td>
                  <td>{lt.DefaultBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="eh-card">
          <CardHeader title="Pending Leave Requests" dotColor="var(--brand-600)" />
          {leaves.filter(l => l.ApprovalStatus === 'Pending').length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No pending requests.</div> : (
          <table className="dt">
            <thead>
              <tr><th>Leave ID</th><th>Type</th><th>Days</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {leaves.filter(l => l.ApprovalStatus === 'Pending').map((l) => (
                <tr key={l.LeaveID || l.ID || crypto.randomUUID()}>
                  <td><span className="mono">{l.LeaveID}</span></td>
                  <td>{l.LeaveType}</td>
                  <td>{l.TotalDays || 1}</td>
                  <td>
                    <div className="flex gap4">
                      <Button variant="success" size="sm" onClick={() => handleAction(l.ID?.toString() || '', 'Approved')} disabled={submitting}>Approve</Button>
                      <Button variant="danger" size="sm" onClick={() => handleAction(l.ID?.toString() || '', 'Rejected')} disabled={submitting}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} title="Add Leave Type">
        <FormGroup label="Leave Type Name">
          <Input value={newLeaveType.Title} onChange={e => setNewLeaveType({...newLeaveType, Title: e.target.value})} placeholder="e.g. Bereavement" />
        </FormGroup>
        <FormGroup label="Default Annual Quota (Days)">
          <Input type="number" value={newLeaveType.DefaultBalance} onChange={e => setNewLeaveType({...newLeaveType, DefaultBalance: Number.parseInt(e.target.value, 10) || 0})} />
        </FormGroup>
        <div className="modal-actions">
          <Button onClick={() => setIsTypeModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddLeaveType}>{submitting ? 'Saving...' : 'Add Type'}</Button>
        </div>
      </Modal>

    </div>
  );
};
