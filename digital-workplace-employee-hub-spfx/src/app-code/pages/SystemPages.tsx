import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { StatCard, CardHeader, Button, Icons, Modal, FormGroup, Input, Select } from '../components/UIElements';
import { InventoryMaster } from '../types';


export const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<InventoryMaster[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InventoryMaster | null>(null);
  const [formData, setFormData] = useState({ AssetName: '', Category: 'Laptop', Status: 'Available', AssignedTo: '' });
  
  // Assign state
  const [assignSearch, setAssignSearch] = useState('');
  const [assignSelectedUser, setAssignSelectedUser] = useState<any>(null);

  const loadData = () => {
    Promise.all([DataService.getInventory(), DataService.getEmployees(), DataService.getInventoryAssignments('', [])]).then(([resAssets, resEmps, resAssignments]) => {
      const mappedAssets = resAssets.map(a => {
        const activeAssignment = resAssignments.find(asg => asg.AssetId === a.ID && asg.Status === 'Active');
        let derivedStatus = a.Status;
        if (activeAssignment) {
          derivedStatus = 'Assigned';
        } else if (derivedStatus === 'Assigned') {
          derivedStatus = 'Available'; // Fallback if list says assigned but no record exists
        }
        return { ...a, Status: derivedStatus, AssignedToUser: activeAssignment ? activeAssignment.AssignedToUser : undefined };
      });
      setAssets(mappedAssets as any);
      setEmployees(resEmps);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const openAdd = () => {
    setFormData({ AssetName: '', Category: 'Laptop', Status: 'Available', AssignedTo: '' });
    setIsAddOpen(true);
  };

  const openEdit = (asset: any) => {
    setSelectedAsset(asset);
    setFormData({ AssetName: asset.AssetName || asset.Title, Category: asset.Category, Status: asset.Status, AssignedTo: asset.AssignedToUser || '' });
    setIsEditOpen(true);
  };

  const openView = (asset: InventoryMaster) => {
    setSelectedAsset(asset);
    setIsViewOpen(true);
  };

  const openAssign = (asset: InventoryMaster) => {
    setSelectedAsset(asset);
    setAssignSearch('');
    setAssignSelectedUser(null);
    setIsAssignOpen(true);
  };

  const handleAddSubmit = async () => {
    setSubmitting(true);
    try {
      await DataService.createInventoryItem({
        Title: formData.AssetName,
        AssetName: formData.AssetName,
        Category: formData.Category,
        Status: formData.Status
      });
      setIsAddOpen(false);
      loadData();
    } catch (e: any) {
      alert("Failed to add asset: " + e.message);
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async () => {
    if (!selectedAsset?.ID) return;
    setSubmitting(true);
    try {
      await DataService.updateInventoryItem(selectedAsset.ID.toString(), {
        Title: formData.AssetName,
        AssetName: formData.AssetName,
        Category: formData.Category,
        Status: formData.Status
      });
      
      if (formData.Status === 'Assigned' && formData.AssignedTo && selectedAsset.ID) {
         const userEmail = employees.find(e => e.Title === formData.AssignedTo)?.Email || formData.AssignedTo;
         const userId = await DataService.getUserIdByEmail(userEmail);
         if (userId) {
           await DataService.createInventoryAssignment({
              AssetId: selectedAsset.ID,
              AssignedToId: userId,
              AssignedDate: new Date().toISOString(),
              Status: 'Active'
           });
         } else {
           alert('Could not resolve assigned user to a SharePoint profile. Try again.');
         }
      }
      
      setIsEditOpen(false);
      loadData();
    } catch (e: any) {
      alert("Failed to update asset: " + e.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (asset: InventoryMaster) => {
    if (!asset.ID) return;
    if (!window.confirm(`Are you sure you want to delete ${asset.AssetName || asset.Title}?`)) return;
    try {
      await DataService.deleteInventoryItem(asset.ID.toString());
      loadData();
    } catch (e: any) {
      alert("Failed to delete asset: " + e.message);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedAsset?.ID || !assignSelectedUser) return;
    setSubmitting(true);
    try {
      // For assignment, we update the asset status
      await DataService.updateInventoryItem(selectedAsset.ID.toString(), {
        Status: 'Assigned'
      });
      const userId = await DataService.getUserIdByEmail(assignSelectedUser.Email || assignSelectedUser.Title);
      if (!userId) {
          alert('Could not resolve assigned user to a SharePoint profile. Try again.');
          setSubmitting(false);
          return;
      }

      // And create the assignment record
      await DataService.createInventoryAssignment({
        AssetId: selectedAsset.ID,
        AssignedToId: userId,
        AssignedDate: new Date().toISOString(),
        Status: 'Active'
      });
      setIsAssignOpen(false);
      loadData();
    } catch (e: any) {
      alert("Failed to assign asset: " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;
  
  const filteredEmployees = employees.filter(e => e.Title?.toLowerCase().includes(assignSearch.toLowerCase()) || e.Email?.toLowerCase().includes(assignSearch.toLowerCase()));

  return (
    <div className="eh-page active">
      <div className="eh-page-hd">
        <div className="eh-page-hd-l">
          <h1>Asset Management</h1>
          <p>Track hardware and software inventory, and manage assignments.</p>
        </div>
        <Button variant="primary" icon={<Icons.Plus />} onClick={openAdd}>Add Asset</Button>
      </div>

      <div className="eh-grid eh-g3 mb14">
        <StatCard type="asset" value={assets.length} label="Total Assets" />
        <StatCard type="asset" value={assets.filter(a => a.Status === 'Assigned').length} label="Assigned" />
        <StatCard type="incident" value={assets.filter(a => a.Status === 'Repair').length} label="Needs Repair" subType="down" />
      </div>

      <div className="ast-grid">
        {assets.map(a => (
          <div className="ast-card" key={a.AssetID || crypto.randomUUID()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="ast-ico"><Icons.Screen /></div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Button variant="outline" size="sm" onClick={() => openView(a)}>View</Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(a)}>Edit</Button>
              </div>
            </div>
            <div className="ast-name" style={{ marginTop: '12px' }}>{a.AssetName || a.Title}</div>
            <div className="ast-id">{a.AssetID}</div>
            <div className="ast-meta">
              <span>{a.Category}</span>
              <span className={`pill p-${a.Status?.toLowerCase()}`}>{a.Status}</span>
            </div>
            
            {a.Status === 'Assigned' && (a as any).AssignedToUser && (
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-2)' }}>
                Assigned to: <strong>{(a as any).AssignedToUser}</strong>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px', alignItems: 'center' }}>
              {a.Status === 'Available' ? (
                <Button variant="primary" size="sm" onClick={() => openAssign(a)}>Assign</Button>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>{a.Status}</span>
              )}
              <Button variant="danger" size="sm" onClick={() => handleDelete(a)}>Delete</Button>
            </div>
          </div>
        ))}
        {assets.length === 0 && (
          <div style={{ padding: '20px', color: 'var(--text-3)' }}>No assets found in inventory.</div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Asset">
        <FormGroup label="Asset Name">
          <Input value={formData.AssetName} onChange={e => setFormData({...formData, AssetName: e.target.value})} placeholder="e.g. MacBook Pro M3" />
        </FormGroup>
        <FormGroup label="Category">
          <Select value={formData.Category} onChange={e => setFormData({...formData, Category: e.target.value})}>
            <option>Laptop</option>
            <option>Desktop</option>
            <option>Mobile</option>
            <option>Peripherals</option>
          </Select>
        </FormGroup>
        <FormGroup label="Status">
          <Select value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value})}>
            <option>Available</option>
            <option>Assigned</option>
            <option>Repair</option>
            <option>Retired</option>
          </Select>
        </FormGroup>
        <div className="modal-actions">
          <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddSubmit}>{submitting ? 'Saving...' : 'Add Asset'}</Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Asset">
        <FormGroup label="Asset Name">
          <Input value={formData.AssetName} onChange={e => setFormData({...formData, AssetName: e.target.value})} />
        </FormGroup>
        <FormGroup label="Category">
          <Select value={formData.Category} onChange={e => setFormData({...formData, Category: e.target.value})}>
            <option>Laptop</option>
            <option>Desktop</option>
            <option>Mobile</option>
            <option>Peripherals</option>
          </Select>
        </FormGroup>
        <FormGroup label="Status">
          <Select value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value})}>
            <option>Available</option>
            <option>Assigned</option>
            <option>Repair</option>
            <option>Retired</option>
          </Select>
        </FormGroup>
        {formData.Status === 'Assigned' && (
          <FormGroup label="Assigned To (Search Employee)">
            <Input 
              value={formData.AssignedTo || ''} 
              onChange={e => setFormData({...formData, AssignedTo: e.target.value})} 
              placeholder="Type employee name..." 
            />
            {formData.AssignedTo && formData.AssignedTo.length > 1 && !employees.find(e => e.Title === formData.AssignedTo) && (
              <div style={{ border: '1px solid var(--border)', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto', marginTop: '4px' }}>
                 {employees.filter(e => e.Title.toLowerCase().includes(formData.AssignedTo.toLowerCase()) || e.Email.toLowerCase().includes(formData.AssignedTo.toLowerCase())).map(e => (
                    <div 
                      key={e.Email} 
                      className="emp-search-result"
                      role="button"
                      tabIndex={0}
                      onClick={() => setFormData({...formData, AssignedTo: e.Title})}
                      onKeyDown={(k) => { if (k.key === 'Enter' || k.key === ' ') { setFormData({...formData, AssignedTo: e.Title}); } }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}
                    >
                       <strong>{e.Title}</strong> ({e.Email})
                    </div>
                 ))}
              </div>
            )}
          </FormGroup>
        )}
        <div className="modal-actions">
          <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEditSubmit}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="View Asset">
        {selectedAsset && (
          <div>
            <div style={{ marginBottom: '16px' }}><strong>Asset ID:</strong> <span className="mono">{selectedAsset.AssetID}</span></div>
            <div style={{ marginBottom: '16px' }}><strong>Asset Name:</strong> {selectedAsset.AssetName || selectedAsset.Title}</div>
            <div style={{ marginBottom: '16px' }}><strong>Category:</strong> {selectedAsset.Category}</div>
            <div style={{ marginBottom: '16px' }}><strong>Status:</strong> <span className={`pill p-${selectedAsset.Status?.toLowerCase()}`}>{selectedAsset.Status}</span></div>
            {selectedAsset.Status === 'Assigned' && (selectedAsset as any).AssignedToUser && (
               <div style={{ marginBottom: '16px' }}><strong>Assigned To:</strong> {(selectedAsset as any).AssignedToUser}</div>
            )}
            {selectedAsset.SerialNumber && <div style={{ marginBottom: '16px' }}><strong>Serial Number:</strong> {selectedAsset.SerialNumber}</div>}
          </div>
        )}
        <div className="modal-actions">
          <Button variant="primary" onClick={() => setIsViewOpen(false)}>Close</Button>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Asset">
        {selectedAsset && (
          <div style={{ marginBottom: '16px' }}>
            Assigning <strong>{selectedAsset.AssetName || selectedAsset.Title}</strong> (<span className="mono">{selectedAsset.AssetID}</span>)
          </div>
        )}
        <FormGroup label="Search Employee">
           <Input 
              placeholder="Type name or email..." 
              value={assignSearch} 
              onChange={(e) => setAssignSearch(e.target.value)} 
           />
           {assignSearch && !assignSelectedUser && (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto', marginTop: '4px' }}>
                 {filteredEmployees.map(e => (
                    <div 
                      key={e.Email} 
                      className="emp-search-result"
                      role="button"
                      tabIndex={0}
                      onClick={() => { setAssignSelectedUser(e); setAssignSearch(e.Title); }}
                      onKeyDown={(k) => { if (k.key === 'Enter' || k.key === ' ') { setAssignSelectedUser(e); setAssignSearch(e.Title); } }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                    >
                       <strong>{e.Title}</strong> ({e.Email})
                    </div>
                 ))}
                 {filteredEmployees.length === 0 && <div style={{ padding: '8px' }}>No employees found.</div>}
              </div>
           )}
        </FormGroup>
        {assignSelectedUser && (
          <div style={{ marginBottom: '16px' }}>
            <Button variant="outline" size="sm" onClick={() => { setAssignSelectedUser(null); setAssignSearch(''); }}>Clear Selection</Button>
          </div>
        )}
        <div className="modal-actions">
          <Button onClick={() => setIsAssignOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAssignSubmit} disabled={!assignSelectedUser || submitting}>
            {submitting ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
