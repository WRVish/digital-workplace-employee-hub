import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { StatCard, CardHeader, Pill, Button, Icons, Modal, FormGroup, Input } from '../components/UIElements';
import { TravelRequest } from '../types';

const getTravelStatus = (status: string) => { 
  if (status === 'Approved') return 'approved'; 
  if (status === 'Rejected') return 'rejected'; 
  return 'pending'; 
};

export const MyTravel: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [travels, setTravels] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ Title: '', Destination: '', StartDate: '', EndDate: '', EstimatedCost: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    DataService.getTravelRequests(userEmail, []).then(res => {
      setTravels(res);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [userEmail]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const start = new Date(formData.StartDate);
      const end = new Date(formData.EndDate);
      await DataService.createTravelRequest({
        Title: formData.Title || `Travel to ${formData.Destination}`,
        Destination: formData.Destination,
        StartDate: start.toISOString(),
        EndDate: end.toISOString(),
        EstimatedCost: Number.parseFloat(formData.EstimatedCost) || 0,
        ApprovalStatus: 'Pending'
      });
      setIsOpen(false);
      setFormData({ Title: '', Destination: '', StartDate: '', EndDate: '', EstimatedCost: '' });
      loadData();
    } catch (e: any) {
      alert("Failed to submit travel request: " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>My Travel</h1>
          <p>Request and track business travel.</p>
        </div>
        <Button variant="primary" icon={<Icons.Plus />} onClick={() => setIsOpen(true)}>Travel Request</Button>
      </div>

      <div className="grid g3 mb14">
        <StatCard type="travel" value={travels.length} label="Total Trips" />
        <StatCard type="expense" value={`$${travels.reduce((a, b) => a + (b.EstimatedCost || 0), 0)}`} label="Est. Total Cost" />
      </div>

      <div className="card">
        <CardHeader title="Travel History" dotColor="var(--c-travel)" />
        {travels.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No travel requests found.</div> : (
        <div className="dt-wrap">
        <table className="dt">
          <thead>
            <tr><th>Travel ID</th><th>Destination</th><th>Dates</th><th>Est. Cost</th><th>Status</th></tr>
          </thead>
          <tbody>
            {travels.map((trv) => (
              <tr key={`${trv.TravelID || trv.ID || crypto.randomUUID()}`}>
                <td><span className="mono">{trv.TravelID}</span></td>
                <td className="fw6">{trv.Destination}</td>
                <td>{trv.StartDate ? new Date(trv.StartDate).toLocaleDateString() : 'N/A'} - {trv.EndDate ? new Date(trv.EndDate).toLocaleDateString() : 'N/A'}</td>
                <td>${trv.EstimatedCost}</td>
                <td><Pill type={getTravelStatus(trv.ApprovalStatus || '')} text={trv.ApprovalStatus || 'Pending'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Travel Request">
        <FormGroup label="Destination">
          <Input value={formData.Destination} onChange={e => setFormData({...formData, Destination: e.target.value})} placeholder="E.g. London HQ" />
        </FormGroup>
        <div className="grid g2" style={{ gap: '16px' }}>
          <FormGroup label="Start Date">
            <Input type="date" value={formData.StartDate} onChange={e => setFormData({...formData, StartDate: e.target.value})} />
          </FormGroup>
          <FormGroup label="End Date">
            <Input type="date" value={formData.EndDate} onChange={e => setFormData({...formData, EndDate: e.target.value})} />
          </FormGroup>
        </div>
        <FormGroup label="Estimated Cost ($)">
          <Input type="number" step="0.01" value={formData.EstimatedCost} onChange={e => setFormData({...formData, EstimatedCost: e.target.value})} placeholder="0.00" />
        </FormGroup>
        <div className="modal-actions">
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export const TravelManagement: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [travels, setTravels] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    DataService.getTravelRequests(userEmail, ['Finance Admin', 'Manager']).then(res => {
      setTravels(res);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [userEmail]);

  const handleAction = async (id: string, status: string) => {
    setSubmitting(true);
    try {
      await DataService.updateTravelRequest(id, { ApprovalStatus: status });
      loadData();
    } catch (e: any) {
      alert(`Failed to ${status.toLowerCase()} travel request: ` + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>Travel Management</h1>
          <p>Review and approve employee travel requests.</p>
        </div>
      </div>

      <div className="grid g3 mb14">
        <StatCard type="travel" value={travels.filter(t => t.ApprovalStatus === 'Pending').length} label="Pending Requests" />
        <StatCard type="expense" value={`$${travels.filter(t => t.ApprovalStatus === 'Pending').reduce((a, b) => a + (b.EstimatedCost || 0), 0)}`} label="Pending Est. Cost" />
      </div>

      <div className="card">
        <CardHeader title="Team Travel Requests" dotColor="var(--brand-600)" />
        {travels.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No travel requests found.</div> : (
        <div className="dt-wrap">
        <table className="dt">
          <thead>
            <tr><th>Travel ID</th><th>Destination</th><th>Cost</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {travels.map((trv) => (
              <tr key={`${trv.TravelID || trv.ID || crypto.randomUUID()}`}>
                <td><span className="mono">{trv.TravelID}</span></td>
                <td className="fw6">{trv.Destination}</td>
                <td>${trv.EstimatedCost}</td>
                <td><Pill type={getTravelStatus(trv.ApprovalStatus || '')} text={trv.ApprovalStatus || 'Pending'} /></td>
                <td>
                  <div className="flex gap4">
                    {trv.ApprovalStatus === 'Pending' && (
                      <>
                        <Button variant="success" size="sm" onClick={() => handleAction(trv.ID?.toString() || '', 'Approved')} disabled={submitting}>Approve</Button>
                        <Button variant="danger" size="sm" onClick={() => handleAction(trv.ID?.toString() || '', 'Rejected')} disabled={submitting}>Reject</Button>
                      </>
                    )}
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
