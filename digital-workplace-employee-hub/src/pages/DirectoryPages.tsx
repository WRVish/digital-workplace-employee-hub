import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { StatCard, CardHeader, Pill, Avatar, Button, Icons, Modal, FormGroup, Input, Select } from '../components/UIElements';
import { EmployeeMaster } from '../types';

export const EmployeeDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeMaster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getEmployees().then(res => {
      setEmployees(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>Employee Directory</h1>
          <p>Find and connect with colleagues across the organisation.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" icon={<Icons.Search />}>Search Directory</Button>
        </div>
      </div>

      <div className="emp-grid">
        {employees.map((emp) => (
          <div className="emp-card" key={emp.EmployeeID || emp.Email || crypto.randomUUID()}>
            <Avatar initials={emp.Title?.charAt(0) || 'U'} gradient="linear-gradient(135deg, var(--c-employee), var(--brand-600))" size="lg" className="emp-av" />
            <div className="emp-name">{emp.Title}</div>
            <div className="emp-role">{emp.JobTitle}</div>
            <div className="emp-role" style={{ marginTop: '5px' }}><a href={`mailto:${emp.Email}`} style={{ color: 'var(--brand-600)', textDecoration: 'none' }}>{emp.Email}</a></div>
          </div>
        ))}
        {/* Fill with a dummy if needed, based on UI-reference */}
        <div className="emp-card">
          <Avatar initials="PR" gradient="linear-gradient(135deg, #F97316, #EF4444)" size="lg" className="emp-av" />
          <div className="emp-name">Pradeep</div>
          <div className="emp-role">Employee</div>
        </div>
      </div>
    </div>
  );
};

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<{ Title: string, Email: string, Role: string[], Status: string }>({ 
    Title: '', Email: '', Role: [], Status: 'Active' 
  });
  const [editId, setEditId] = useState<string | null>(null);

  const ROLE_OPTIONS = ['HR Admin', 'IT Admin', 'Finance Admin', 'Manager', 'System Admin'];

  const loadData = () => {
    DataService.getEmployees().then(res => {
      setEmployees(res);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleAddSubmit = async () => {
    if (!formData.Email) {
      alert("Email is required.");
      return;
    }
    
    // Check if employee already exists by Email
    const emailLower = formData.Email.toLowerCase().trim();
    const exists = employees.some(e => e.Email?.toLowerCase().trim() === emailLower);
    if (exists) {
      alert(`An employee with the email ${formData.Email} already exists in the system.`);
      return;
    }

    setSubmitting(true);
    try {
      await DataService.createEmployee({
        Title: formData.Title || formData.Email.split('@')[0],
        Email: formData.Email,
        UserAccount: formData.Email ? { Claims: `i:0#.f|membership|${formData.Email}` } : null,
        JobTitle: formData.Role.join(', '),
        Status: formData.Status
      });
      setIsAddOpen(false);
      setFormData({ Title: '', Email: '', Role: [], Status: 'Active' });
      loadData();
    } catch (e: any) {
      alert("Failed to add employee: " + e.message);
    }
    setSubmitting(false);
  };

  const openEdit = (emp: any) => {
    setEditId(emp.ID?.toString() || '');
    
    let existingRoles: string[] = [];
    if (Array.isArray(emp.Role)) {
      existingRoles = emp.Role.map((r: any) => r.Value || r);
    } else if (emp.Role) {
      existingRoles = [emp.Role];
    } else if (emp.JobTitle) {
      existingRoles = emp.JobTitle.split(',').map((s: string) => s.trim());
    }

    setFormData({ 
      Title: emp.Title || '', 
      Email: emp.Email || '', 
      Role: existingRoles, 
      Status: emp.Status || 'Active' 
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editId) return;
    setSubmitting(true);
    try {
      await DataService.updateEmployee(editId, {
        JobTitle: formData.Role.join(', '),
        Status: formData.Status
      });
      setIsEditOpen(false);
      loadData();
    } catch (e: any) {
      alert("Failed to update employee: " + e.message);
    }
    setSubmitting(false);
  };

  const handleRoleToggle = (role: string, isChecked: boolean) => {
    setFormData(prev => {
      if (isChecked) return { ...prev, Role: [...prev.Role, role] };
      return { ...prev, Role: prev.Role.filter(x => x !== role) };
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>Employee Management</h1>
          <p>Manage employee records, roles, and status.</p>
        </div>
        <Button variant="primary" icon={<Icons.Plus />} onClick={() => setIsAddOpen(true)}>Add Employee</Button>
      </div>

      <div className="grid g3 mb14">
        <StatCard type="employee" value={employees.length} label="Total Employees" />
        <StatCard type="employee" value={employees.filter(e => e.Status === 'Active').length} label="Active Employees" />
      </div>

      <div className="card">
        <CardHeader title="All Employees" dotColor="var(--brand-600)" />
        {employees.length === 0 ? <div style={{padding: '20px', color: 'var(--text-3)'}}>No employees found.</div> : (
        <div className="dt-wrap">
        <table className="dt">
          <thead>
            <tr><th>Emp ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {employees.map((emp: any) => {
              let displayRole = emp.JobTitle;
              if (Array.isArray(emp.Role)) {
                displayRole = emp.Role.map((r: any) => r.Value || r).join(', ');
              } else if (emp.Role) {
                displayRole = emp.Role;
              }
              return (
              <tr key={emp.EmployeeID || emp.Email || crypto.randomUUID()}>
                <td><span className="mono">{emp.EmployeeID}</span></td>
                <td className="fw6">{emp.Title}</td>
                <td>{emp.Email}</td>
                <td>{displayRole}</td>
                <td><Pill type={emp.Status === 'Active' ? 'active' : 'pending'} text={emp.Status || 'Active'} /></td>
                <td><Button variant="outline" size="sm" onClick={() => openEdit(emp)}>Edit</Button></td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        )}
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Employee">
        <FormGroup label="Email (AAD User Principal Name)">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} placeholder="user@domain.com" />
            <Button variant="outline" onClick={() => {
              if (!formData.Email) return;
              const prefix = formData.Email.split('@')[0];
              const resolvedName = prefix.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
              setFormData(prev => ({...prev, Title: resolvedName}));
            }}>Check</Button>
          </div>
        </FormGroup>
        <FormGroup label="Name">
          <Input value={formData.Title} onChange={e => setFormData({...formData, Title: e.target.value})} placeholder="E.g. John Doe" />
        </FormGroup>
        <FormGroup label="Roles">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ROLE_OPTIONS.map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 8px', background: 'var(--bg-2)', borderRadius: '4px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.Role.includes(r)} onChange={(e) => handleRoleToggle(r, e.target.checked)} />
                {r}
              </label>
            ))}
          </div>
        </FormGroup>
        <FormGroup label="Status">
          <Select value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value})}>
            <option>Active</option>
            <option>Inactive</option>
          </Select>
        </FormGroup>
        <div className="modal-actions">
          <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddSubmit}>{submitting ? 'Adding...' : 'Add Employee'}</Button>
        </div>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Employee">
        <FormGroup label="Name">
          <Input value={formData.Title} disabled />
        </FormGroup>
        <FormGroup label="Email">
          <Input value={formData.Email} disabled />
        </FormGroup>
        <FormGroup label="Roles">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ROLE_OPTIONS.map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 8px', background: 'var(--bg-2)', borderRadius: '4px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.Role.includes(r)} onChange={(e) => handleRoleToggle(r, e.target.checked)} />
                {r}
              </label>
            ))}
          </div>
        </FormGroup>
        <FormGroup label="Status">
          <Select value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value})}>
            <option>Active</option>
            <option>Inactive</option>
          </Select>
        </FormGroup>
        <div className="modal-actions">
          <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEditSubmit}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </Modal>
    </div>
  );
};
