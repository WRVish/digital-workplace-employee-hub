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
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>My Leave</h1>
          <p>Track your leave balances and request time off.</p>
        </div>
        <Button variant="primary" icon={<Icons.Plus />} onClick={() => setIsRaiseOpen(true)}>Apply Leave</Button>
      </div>

      <div className="grid g3 mb14">
        <StatCard type="leave" value={annualLeft} label="Annual Leave Left" subValue="14 total days" />
        <StatCard type="asset" value={sickLeft} label="Sick Leave Left" subValue="14 total days" />
        <StatCard type="incident" value={pendingCount} label="Pending Requests" subValue="Awaiting manager" />
      </div>

      <div className="card">
        <CardHeader title="My Leave History" dotColor="var(--c-leave)" />
        {leaves.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No leave requests found.</div> : (
        <div className="dt-wrap">
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
        </div>
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
        <div className="grid g2" style={{ gap: '16px' }}>
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

  const loadData = () => {
    DataService.getLeaveRequests(userEmail, ['HR Admin', 'Manager']).then(res => {
      setLeaves(res);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [userEmail]);

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

  if (loading) return <div>Loading...</div>;


  const pendingCount = leaves.filter(l => l.ApprovalStatus === 'Pending').length;
  const approvedCount = leaves.filter(l => l.ApprovalStatus === 'Approved').length;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>Leave Management</h1>
          <p>Review and approve employee leave requests.</p>
        </div>
      </div>

      <div className="grid g3 mb14">
        <StatCard type="leave" value={pendingCount} label="Pending Approvals" subValue="Action required" />
        <StatCard type="employee" value={approvedCount} label="Total Approved" />
        <StatCard type="events" value="1" label="Upcoming Holidays" />
      </div>

      <div className="card">
        <CardHeader title="Leave Requests" dotColor="var(--brand-600)" />
        {leaves.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No leave requests found.</div> : (
        <div className="dt-wrap">
        <table className="dt">
          <thead>
            <tr><th>Leave ID</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.LeaveID || l.ID || crypto.randomUUID()}>
                <td><span className="mono">{l.LeaveID}</span></td>
                <td>{l.LeaveType} Leave</td>
                <td>{l.StartDate ? new Date(l.StartDate).toLocaleDateString() : 'N/A'} - {l.EndDate ? new Date(l.EndDate).toLocaleDateString() : 'N/A'}</td>
                <td>{l.TotalDays || 1}</td>
                <td><Pill type={getLeaveStatus(l.ApprovalStatus || '')} text={l.ApprovalStatus || 'Pending'} /></td>
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
        </div>
        )}
      </div>
    </div>
  );
};
