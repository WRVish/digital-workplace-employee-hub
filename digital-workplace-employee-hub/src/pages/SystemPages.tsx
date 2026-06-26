import React, { useEffect, useState } from 'react';
import { DataService } from '../dataService';
import { StatCard, CardHeader, Button, Icons } from '../components/UIElements';
import { InventoryMaster } from '../types';

export const RoleManager: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getUserRoles('dummy').then(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>Role Manager</h1>
          <p>Control access permissions across the application.</p>
        </div>
        <Button variant="primary" icon={<Icons.Shield />}>Create Role</Button>
      </div>

      <div className="card mb14">
        <CardHeader title="Permission Matrix" dotColor="var(--brand-600)" />
        <div style={{ overflowX: 'auto' }}>
          <table className="perm-table">
            <thead>
              <tr>
                <th>Module</th><th>Sys Admin</th><th>HR Admin</th><th>IT Admin</th><th>Finance</th><th>Manager</th><th>Employee</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Employee Data</td>
                <td className="chk">●</td><td className="chk">●</td><td className="cross">○</td><td className="cross">○</td><td className="chk">●</td><td className="cross">○</td>
              </tr>
              <tr>
                <td>Leave Approvals</td>
                <td className="chk">●</td><td className="chk">●</td><td className="cross">○</td><td className="cross">○</td><td className="chk">●</td><td className="cross">○</td>
              </tr>
              <tr>
                <td>IT Assets</td>
                <td className="chk">●</td><td className="cross">○</td><td className="chk">●</td><td className="cross">○</td><td className="cross">○</td><td className="cross">○</td>
              </tr>
              <tr>
                <td>Expense Processing</td>
                <td className="chk">●</td><td className="cross">○</td><td className="cross">○</td><td className="chk">●</td><td className="chk">●</td><td className="cross">○</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <CardHeader title="Assigned Roles" dotColor="var(--brand-400)" />
        <table className="dt">
          <thead>
            <tr><th>Role ID</th><th>Role Name</th><th>Description</th><th>Users</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="mono">ROLE-01</span></td>
              <td className="fw6">System Admin</td>
              <td>Full access to all modules and settings</td>
              <td>1</td>
              <td><Button variant="outline" size="sm">Manage</Button></td>
            </tr>
            <tr>
              <td><span className="mono">ROLE-02</span></td>
              <td className="fw6">HR Admin</td>
              <td>Access to employee and leave data</td>
              <td>1</td>
              <td><Button variant="outline" size="sm">Manage</Button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<InventoryMaster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getInventory().then(res => {
      setAssets(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page active">
      <div className="page-hd">
        <div className="page-hd-l">
          <h1>Asset Management</h1>
          <p>Track hardware and software inventory.</p>
        </div>
        <Button variant="primary" icon={<Icons.Plus />}>Add Asset</Button>
      </div>

      <div className="grid g3 mb14">
        <StatCard type="asset" value={assets.length || "12"} label="Total Assets" />
        <StatCard type="asset" value="8" label="Assigned" />
        <StatCard type="incident" value="1" label="Needs Repair" subType="down" />
      </div>

      <div className="ast-grid">
        <div className="ast-card">
          <div className="ast-ico"><Icons.Screen /></div>
          <div className="ast-name">Dell XPS 15</div>
          <div className="ast-id">AST-1001</div>
          <div className="ast-meta">
            <span>Hardware</span>
            <span className="pill p-assigned">Assigned</span>
          </div>
        </div>
        <div className="ast-card">
          <div className="ast-ico"><Icons.Screen /></div>
          <div className="ast-name">iPhone 15 Pro</div>
          <div className="ast-id">AST-2001</div>
          <div className="ast-meta">
            <span>Hardware</span>
            <span className="pill p-active">Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};
