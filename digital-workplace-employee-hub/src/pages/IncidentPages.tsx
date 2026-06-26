import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { StatCard, CardHeader, Pill, PriorityPill, Button, Icons, Modal, FormGroup, Input, Select, Textarea } from '../components/UIElements';
import { IncidentRequest } from '../types';

export const MyTickets: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [incidents, setIncidents] = useState<IncidentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [formData, setFormData] = useState({ Title: '', Category: 'IT', Priority: 'Medium', Description: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    DataService.getIncidentRequests(userEmail, []).then(res => {
      setIncidents(res);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [userEmail]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await DataService.createIncidentRequest({
        Title: formData.Title,
        Category: formData.Category,
        Priority: formData.Priority,
        Description: formData.Description,
        Status: 'New',
        RequestType: 'Support'
      });
      setIsRaiseOpen(false);
      setFormData({ Title: '', Category: 'IT', Priority: 'Medium', Description: '' });
      loadData();
    } catch (e: any) {
      alert("Failed to raise ticket: " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>My Tickets</h1>
          <p>Track your IT and HR service requests.</p>
        </div>
        <Button variant="primary" icon={<Icons.Plus />} onClick={() => setIsRaiseOpen(true)}>Raise Ticket</Button>
      </div>

      <div className="grid g3 mb14">
        <StatCard type="incident" value={incidents.filter(i => i.Status !== 'Resolved').length} label="Open Tickets" />
        <StatCard type="employee" value={incidents.filter(i => i.Status === 'Resolved').length} label="Resolved Tickets" />
      </div>

      <div className="card">
        <CardHeader title="Ticket History" dotColor="var(--c-incident)" />
        {incidents.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No tickets found.</div> : (
        <table className="dt">
          <thead>
            <tr><th>Ticket ID</th><th>Category</th><th>Title</th><th>Priority</th><th>Status</th></tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.TicketID || inc.ID || Math.random().toString()}>
                <td><span className="mono">{inc.TicketID}</span></td>
                <td>{inc.Category || 'IT'}</td>
                <td className="fw6">{inc.Title}</td>
                <td><PriorityPill priority={inc.Priority || 'Medium'} /></td>
                <td><Pill type={inc.Status === 'Resolved' ? 'resolved' : 'inprog'} text={inc.Status || 'In Progress'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <Modal isOpen={isRaiseOpen} onClose={() => setIsRaiseOpen(false)} title="Raise New Ticket">
        <FormGroup label="Title">
          <Input value={formData.Title} onChange={e => setFormData({...formData, Title: e.target.value})} placeholder="E.g. Laptop won't turn on" />
        </FormGroup>
        <FormGroup label="Category">
          <Select value={formData.Category} onChange={e => setFormData({...formData, Category: e.target.value})}>
            <option>IT</option>
            <option>HR</option>
            <option>Facilities</option>
          </Select>
        </FormGroup>
        <FormGroup label="Priority">
          <Select value={formData.Priority} onChange={e => setFormData({...formData, Priority: e.target.value})}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </Select>
        </FormGroup>
        <FormGroup label="Description">
          <Textarea value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} placeholder="Describe the issue..." />
        </FormGroup>
        <div className="modal-actions">
          <Button onClick={() => setIsRaiseOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export const IncidentManagement: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [incidents, setIncidents] = useState<IncidentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<IncidentRequest | null>(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    DataService.getIncidentRequests(userEmail, ['IT Admin']).then(res => {
      setIncidents(res);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [userEmail]);

  const handleManage = (ticket: IncidentRequest) => {
    setActiveTicket(ticket);
    setStatus(ticket.Status || 'In Progress');
    setIsManageOpen(true);
  };

  const handleUpdate = async () => {
    if (!activeTicket) return;
    setSubmitting(true);
    try {
      await DataService.updateIncidentRequest(activeTicket.ID?.toString() || '', {
        Status: status
      });
      setIsManageOpen(false);
      loadData();
    } catch (e: any) {
      alert("Failed to update ticket: " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>Incident Management</h1>
          <p>Manage and resolve organizational service requests.</p>
        </div>
      </div>

      <div className="grid g3 mb14">
        <StatCard type="incident" value={incidents.filter(i => i.Status !== 'Resolved').length} label="Total Open Tickets" />
        <StatCard type="incident" value={incidents.filter(i => i.Priority === 'High' && i.Status !== 'Resolved').length} label="High Priority" subType="down" />
        <StatCard type="employee" value={incidents.filter(i => i.Status === 'Resolved').length} label="Resolved Tickets" />
      </div>

      <div className="card">
        <CardHeader title="All Tickets" dotColor="var(--brand-600)" />
        {incidents.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No tickets found.</div> : (
        <table className="dt">
          <thead>
            <tr><th>Ticket ID</th><th>Title</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.TicketID || inc.ID || Math.random().toString()}>
                <td><span className="mono">{inc.TicketID}</span></td>
                <td className="fw6">{inc.Title}</td>
                <td><PriorityPill priority={inc.Priority || 'Medium'} /></td>
                <td><Pill type={inc.Status === 'Resolved' ? 'resolved' : 'inprog'} text={inc.Status || 'In Progress'} /></td>
                <td><Button variant="outline" size="sm" onClick={() => handleManage(inc)}>Manage</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <Modal isOpen={isManageOpen} onClose={() => setIsManageOpen(false)} title="Manage Ticket">
        {activeTicket && (
          <>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-card)', borderRadius: '6px' }}>
              <strong>{activeTicket.TicketID}</strong> - {activeTicket.Title}
              <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-3)' }}>{activeTicket.Description}</div>
            </div>
            
            <FormGroup label="Update Status">
              <Select value={status} onChange={e => setStatus(e.target.value)}>
                <option>New</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Closed</option>
              </Select>
            </FormGroup>

            <div className="modal-actions">
              <Button onClick={() => setIsManageOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleUpdate}>{submitting ? 'Updating...' : 'Save Changes'}</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
