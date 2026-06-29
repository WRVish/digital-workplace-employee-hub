import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { StatCard, CardHeader, Pill, Button, Icons, Modal, FormGroup, Input, Select } from '../components/UIElements';
import { ExpenseClaim } from '../types';

const getFinanceStatusType = (status: string) => {
  if (status === 'Paid') return 'resolved';
  if (status === 'Processing') return 'processing';
  return 'pending';
};

export const MyExpenses: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ Title: '', Category: 'Travel', Amount: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    DataService.getExpenseClaims(userEmail, []).then(res => {
      setExpenses(res);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [userEmail]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await DataService.createExpenseClaim({
        Title: formData.Title,
        Category: formData.Category,
        Amount: Number.parseFloat(formData.Amount) || 0,
        ManagerApproval: 'Pending',
        FinanceStatus: 'Pending'
      });
      setIsOpen(false);
      setFormData({ Title: '', Category: 'Travel', Amount: '' });
      loadData();
    } catch (e: any) {
      alert("Failed to submit expense: " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  const totalClaimed = expenses.reduce((acc, curr) => acc + (curr.Amount || 0), 0);
  const pendingCount = expenses.filter(e => e.ManagerApproval !== 'Approved' || e.FinanceStatus !== 'Paid').length;

  return (
    <div className="eh-page active">
      <div className="eh-page-hd">
        <div className="eh-page-hd-l">
          <h1>My Expenses</h1>
          <p>Submit and track your expense claims.</p>
        </div>
        <Button variant="primary" icon={<Icons.Plus />} onClick={() => setIsOpen(true)}>Submit Expense</Button>
      </div>

      <div className="eh-grid eh-g3 mb14">
        <StatCard type="expense" value={`$${totalClaimed}`} label="Total Claimed" />
        <StatCard type="incident" value={pendingCount} label="Pending Processing" subType="down" />
        <StatCard type="leave" value="0" label="Rejected Claims" />
      </div>

      <div className="eh-card">
        <CardHeader title="Claim History" dotColor="var(--c-expense)" />
        {expenses.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No expenses found.</div> : (
        <table className="dt">
          <thead>
            <tr><th>Claim ID</th><th>Description</th><th>Amount</th><th>Manager</th><th>Finance</th></tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.ClaimID || exp.ID || crypto.randomUUID()}>
                <td><span className="mono">{exp.ClaimID}</span></td>
                <td className="fw6">{exp.Title}</td>
                <td>${exp.Amount}</td>
                <td><Pill type={exp.ManagerApproval === 'Approved' ? 'approved' : 'pending'} text={exp.ManagerApproval || 'Pending'} /></td>
                <td><Pill type={getFinanceStatusType(exp.FinanceStatus || '')} text={exp.FinanceStatus || 'Pending'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Submit Expense">
        <FormGroup label="Description">
          <Input value={formData.Title} onChange={e => setFormData({...formData, Title: e.target.value})} placeholder="E.g. Client Dinner" />
        </FormGroup>
        <FormGroup label="Category">
          <Select value={formData.Category} onChange={e => setFormData({...formData, Category: e.target.value})}>
            <option>Travel</option>
            <option>Meals</option>
            <option>Supplies</option>
            <option>Other</option>
          </Select>
        </FormGroup>
        <FormGroup label="Amount ($)">
          <Input type="number" step="0.01" value={formData.Amount} onChange={e => setFormData({...formData, Amount: e.target.value})} placeholder="0.00" />
        </FormGroup>
        <div className="modal-actions">
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>{submitting ? 'Submitting...' : 'Submit Claim'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export const ExpenseManagement: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    // Admin load data
    DataService.getExpenseClaims(userEmail, ['Finance Admin', 'Manager']).then(res => {
      setExpenses(res);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [userEmail]);

  const handleAction = async (id: string, actionField: string, status: string) => {
    setSubmitting(true);
    try {
      await DataService.updateExpenseClaim(id, { [actionField]: status });
      loadData();
    } catch (e: any) {
      alert(`Failed to update expense: ` + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  const totalPending = expenses.filter(e => e.ManagerApproval === 'Pending' || e.FinanceStatus === 'Processing').reduce((acc, curr) => acc + (curr.Amount || 0), 0);

  const renderActionButtons = (exp: ExpenseClaim) => {
    if (exp.ManagerApproval === 'Pending') {
      return (
        <>
          <Button variant="success" size="sm" onClick={() => handleAction(exp.ID?.toString() || '', 'ManagerApproval', 'Approved')} disabled={submitting}>Mgr Approve</Button>
          <Button variant="danger" size="sm" onClick={() => handleAction(exp.ID?.toString() || '', 'ManagerApproval', 'Rejected')} disabled={submitting}>Mgr Reject</Button>
        </>
      );
    }
    if (exp.ManagerApproval === 'Approved' && exp.FinanceStatus !== 'Paid') {
      return <Button variant="primary" size="sm" onClick={() => handleAction(exp.ID?.toString() || '', 'FinanceStatus', 'Paid')} disabled={submitting}>Mark Paid</Button>;
    }
    return null;
  };

  return (
    <div className="eh-page active">
      <div className="eh-page-hd">
        <div className="eh-page-hd-l">
          <h1>Expense Management</h1>
          <p>Review, approve, and process employee expense claims.</p>
        </div>
      </div>

      <div className="eh-grid eh-g3 mb14">
        <StatCard type="expense" value={`$${totalPending}`} label="Pending Value" subValue="Action required" />
        <StatCard type="employee" value={expenses.length} label="Total Claims" />
      </div>

      <div className="eh-card">
        <CardHeader title="Team Claims" dotColor="var(--brand-600)" />
        {expenses.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No expenses found.</div> : (
        <table className="dt">
          <thead>
            <tr><th>Claim ID</th><th>Description</th><th>Amount</th><th>Manager</th><th>Finance</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.ClaimID || exp.ID || crypto.randomUUID()}>
                <td><span className="mono">{exp.ClaimID}</span></td>
                <td className="fw6">{exp.Title}</td>
                <td>${exp.Amount}</td>
                <td><Pill type={exp.ManagerApproval === 'Approved' ? 'approved' : 'pending'} text={exp.ManagerApproval || 'Pending'} /></td>
                <td><Pill type={getFinanceStatusType(exp.FinanceStatus || '')} text={exp.FinanceStatus || 'Pending'} /></td>
                <td>
                  <div className="flex gap4">
                    {renderActionButtons(exp)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};
