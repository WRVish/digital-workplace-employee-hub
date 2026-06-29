import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';
import {
  AppRole,
  EmployeeMaster,
  IncidentRequest,
  LeaveRequest,
  CompanyHoliday,
  CompanyEvent,
  ExpenseClaim,
  TravelRequest,
  InventoryMaster,
  InventoryAssignment
} from './types';

// Mock Data (Fallback if list not configured)
const MOCK_ROLES: AppRole[] = [{ Title: "ROLE-01", RoleID: "ROLE-01", Role: "System Admin" }];
const MOCK_LEAVES: LeaveRequest[] = [];
const MOCK_INCIDENTS: IncidentRequest[] = [];
const MOCK_EXPENSES: ExpenseClaim[] = [];
const MOCK_TRAVEL: TravelRequest[] = [];
const MOCK_EMPLOYEES: EmployeeMaster[] = [{ Title: "Vishnu Admin", EmployeeID: "E001", Email: "info@vishpowerlabs.com", Department: "IT", JobTitle: "System Admin", Status: "Active" }];

const mapSPItem = (item: any) => {
  if (!item) return item;
  const mapped: any = { ...item };
  // Standardize ID
  if (mapped.Id && !mapped.ID) mapped.ID = mapped.Id;
  return mapped;
};

export class DataService {
  private static _spHttpClient: SPHttpClient;
  private static _siteUrl: string;
  private static _userEmail: string;
  private static _lists: Record<string, string>;
  private static _isSiteAdmin: boolean = false;

  public static init(spHttpClient: SPHttpClient, siteUrl: string, userEmail: string, lists: Record<string, string>, isSiteAdmin: boolean = false) {
    this._spHttpClient = spHttpClient;
    this._siteUrl = siteUrl;
    this._userEmail = userEmail;
    this._lists = lists;
    this._isSiteAdmin = isSiteAdmin;
  }

  private static async _getListItems(listKey: string, filter?: string): Promise<any[]> {
    const listId = this._lists[listKey];
    if (!listId) return []; // Fallback if not configured
    
    let url = `${this._siteUrl}/_api/web/lists(guid'${listId}')/items?$top=5000`;
    if (filter) {
      url += `&$filter=${filter}`;
    }

    const response: SPHttpClientResponse = await this._spHttpClient.get(url, SPHttpClient.configurations.v1);
    if (!response.ok) {
      console.error(`Error fetching from ${listKey}:`, await response.text());
      return [];
    }
    const data = await response.json();
    return data.value ? data.value.map(mapSPItem) : [];
  }

  private static _listEntityTypes: Record<string, string> = {};

  private static async _getListItemEntityType(listKey: string): Promise<string | null> {
    if (this._listEntityTypes[listKey]) return this._listEntityTypes[listKey];
    const listId = this._lists[listKey];
    if (!listId) return null;
    try {
      const url = `${this._siteUrl}/_api/web/lists(guid'${listId}')?$select=ListItemEntityTypeFullName`;
      const response = await this._spHttpClient.get(url, SPHttpClient.configurations.v1);
      if (response.ok) {
        const data = await response.json();
        if (data?.ListItemEntityTypeFullName) {
          this._listEntityTypes[listKey] = data.ListItemEntityTypeFullName;
          return data.ListItemEntityTypeFullName;
        }
      }
    } catch (e) {
      console.warn("Could not fetch entity type for " + listKey, e);
    }
    return null;
  }

  private static async _createListItem(listKey: string, payload: any): Promise<void> {
    const listId = this._lists[listKey];
    if (!listId) throw new Error(`List ${listKey} is not configured.`);

    const entityType = await this._getListItemEntityType(listKey);
    const finalPayload = { ...payload };
    if (entityType && !finalPayload['@odata.type']) {
      finalPayload['@odata.type'] = `#${entityType}`;
    }

    const options: ISPHttpClientOptions = {
      body: JSON.stringify(finalPayload)
    };

    const url = `${this._siteUrl}/_api/web/lists(guid'${listId}')/items`;
    const response: SPHttpClientResponse = await this._spHttpClient.post(url, SPHttpClient.configurations.v1, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error creating item in ${listKey}: ${errorText}`);
    }
  }

  private static async _updateListItem(listKey: string, id: string | number, payload: any): Promise<void> {
    const listId = this._lists[listKey];
    if (!listId) throw new Error(`List ${listKey} is not configured.`);

    const entityType = await this._getListItemEntityType(listKey);
    const finalPayload = { ...payload };
    if (entityType && !finalPayload['@odata.type']) {
      finalPayload['@odata.type'] = `#${entityType}`;
    }

    const options: ISPHttpClientOptions = {
      body: JSON.stringify(finalPayload),
      headers: {
        'X-HTTP-Method': 'MERGE',
        'IF-MATCH': '*'
      }
    };

    const url = `${this._siteUrl}/_api/web/lists(guid'${listId}')/items(${id})`;
    const response: SPHttpClientResponse = await this._spHttpClient.post(url, SPHttpClient.configurations.v1, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error updating item in ${listKey}: ${errorText}`);
    }
  }

  public static async getCurrentUserEmail(): Promise<string> {
    return this._userEmail || "info@vishpowerlabs.com";
  }

  public static async getUserIdByEmail(email: string): Promise<number | null> {
    try {
      const url = `${this._siteUrl}/_api/web/ensureuser`;
      const options: ISPHttpClientOptions = {
        body: JSON.stringify({ logonName: email })
      };
      const response: SPHttpClientResponse = await this._spHttpClient.post(url, SPHttpClient.configurations.v1, options);
      if (response.ok) {
        const data = await response.json();
        return data.Id;
      }
      return null;
    } catch (e) {
      console.error('Failed to resolve user ID:', e);
      return null;
    }
  }

  public static async getUserRoles(email: string): Promise<AppRole[]> {
    try {
      const records = await this._getListItems('employeeMaster');
      const target = email.toLowerCase();
      
      const userRecord = records.find((r: any) => {
        const u = r.UserAccount || r.Email || '';
        return u.toLowerCase().includes(target);
      });

      if (userRecord) {
        let roles: string[] = [];
        if (Array.isArray(userRecord.Role)) {
          roles = userRecord.Role.map((r: any) => r.Label || r);
        } else if (userRecord.Role) {
          roles = [userRecord.Role];
        } else if (userRecord.JobTitle) {
          roles = userRecord.JobTitle.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        
        if (this._isSiteAdmin && !roles.includes('System Admin')) {
          roles.push('System Admin');
        }

        return roles.map(roleName => ({
          Title: roleName,
          RoleID: roleName,
          Role: roleName as any
        }));
      }
      
      if (this._isSiteAdmin) {
        return [{ Title: 'System Admin', RoleID: 'System Admin', Role: 'System Admin' as any }];
      }
      return [];
    } catch (e) {
      console.error(e);
      if (this._isSiteAdmin) {
        return [{ Title: 'System Admin', RoleID: 'System Admin', Role: 'System Admin' as any }];
      }
      return MOCK_ROLES;
    }
  }

  public static async getEmployees(): Promise<EmployeeMaster[]> {
    return this._getListItems('employeeMaster') as Promise<EmployeeMaster[]>;
  }

  public static async createEmployee(record: any): Promise<void> {
    if (!record.EmployeeID) record.EmployeeID = `E${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    await this._createListItem('employeeMaster', record);
  }

  public static async updateEmployee(id: string, record: any): Promise<void> {
    await this._updateListItem('employeeMaster', id, record);
  }

  private static _prefFieldsMap: { theme: string, colorScheme: string } | null = null;

  private static async _getPrefFieldsMap(): Promise<{ theme: string, colorScheme: string }> {
    if (this._prefFieldsMap) return this._prefFieldsMap;
    const listId = this._lists['userPreferences'];
    let themeField = 'Theme';
    let colorSchemeField = 'ColorScheme';
    
    if (listId) {
      try {
        const url = `${this._siteUrl}/_api/web/lists(guid'${listId}')/fields?$select=Title,InternalName`;
        const response = await this._spHttpClient.get(url, SPHttpClient.configurations.v1);
        if (response.ok) {
          const data = await response.json();
          const fields = data.value || [];
          
          const tField = fields.find((f: any) => f.Title.toLowerCase() === 'theme' || f.InternalName.toLowerCase() === 'theme');
          if (tField) themeField = tField.InternalName;
          
          const csField = fields.find((f: any) => f.Title.toLowerCase().replaceAll(' ', '') === 'colorscheme' || f.InternalName.toLowerCase().replaceAll('_x0020_', '') === 'colorscheme');
          if (csField) colorSchemeField = csField.InternalName;
        }
      } catch (e) {
        console.warn("Failed to fetch field mappings", e);
      }
    }
    this._prefFieldsMap = { theme: themeField, colorScheme: colorSchemeField };
    return this._prefFieldsMap;
  }

  public static async getUserPreferences(email: string): Promise<any> {
    try {
      if (!email) return null;
      // Fetch all to avoid SharePoint column name/filter syntax issues
      const map = await this._getPrefFieldsMap();
      const records = await this._getListItems('userPreferences');
      const found = records.find((r: any) => (r.Email || '').toLowerCase() === email.toLowerCase() || (r.Title || '').toLowerCase().includes(email.split('@')[0].toLowerCase()));
      
      if (found) {
        // Map dynamic internal names back to what the UI expects
        found.Theme = found[map.theme];
        found.ColorScheme = found[map.colorScheme];
      }
      
      return found || null;
    } catch (error) {
      console.warn("UserPreferences API failed", error);
      return null;
    }
  }

  public static async saveUserPreferences(id: string | null, email: string, theme: string, colorScheme: string): Promise<boolean> {
    try {
      let existingId = null;
      const records = await this._getListItems('userPreferences');
      const existing = records.find((r: any) => (r.Email || '').toLowerCase() === email.toLowerCase() || (r.Title || '').toLowerCase().includes(email.split('@')[0].toLowerCase()));
      if (existing) {
        existingId = existing.ID || existing.Id;
      }

      const map = await this._getPrefFieldsMap();

      const payload: any = {
        Title: `Pref-${email.split('@')[0]}`,
        Email: email
      };
      payload[map.theme] = theme;
      payload[map.colorScheme] = colorScheme;
      
      if (existingId) {
        try {
          await this._updateListItem('userPreferences', existingId, payload);
        } catch (updateErr: any) {
          console.warn("Update failed, attempting create", updateErr);
          await this._createListItem('userPreferences', payload);
        }
      } else {
        await this._createListItem('userPreferences', payload);
      }
      return true;
    } catch (error: any) {
      console.error("Fatal Error saving preferences:", error);
      return false;
    }
  }

  public static async getIncidentRequests(userEmail: string, roles: string[]): Promise<IncidentRequest[]> {
    try {
      const records = await this._getListItems('incidentRequests');
      if (roles.includes('IT Admin') || roles.includes('System Admin')) return records;
      
      const targetPrefix = userEmail.split('@')[0].toLowerCase();
      return records.filter(r => {
        const reqBy = (r.RequestedBy || '').toString().toLowerCase();
        return reqBy.includes(targetPrefix);
      });
    } catch (e) {
      console.error(e);
      return MOCK_INCIDENTS;
    }
  }

  public static async createIncidentRequest(record: any): Promise<void> {
    if (!record.TicketID) record.TicketID = `TKT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    await this._createListItem('incidentRequests', record);
  }

  public static async updateIncidentRequest(id: string, record: any): Promise<void> {
    await this._updateListItem('incidentRequests', id, record);
  }

  public static async getLeaveRequests(userEmail: string, roles: string[]): Promise<LeaveRequest[]> {
    try {
      const records = await this._getListItems('leaveRequests');
      if (roles.includes('HR Admin') || roles.includes('System Admin')) return records;
      
      const targetPrefix = userEmail.split('@')[0].toLowerCase();
      return records.filter(r => {
        const empBy = (r.Employee || '').toString().toLowerCase();
        return empBy.includes(targetPrefix);
      });
    } catch (e) {
      console.error(e);
      return MOCK_LEAVES;
    }
  }

  public static async createLeaveRequest(record: any): Promise<void> {
    if (!record.LeaveID) record.LeaveID = `LV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    await this._createListItem('leaveRequests', record);
  }

  public static async updateLeaveRequest(id: string, record: any): Promise<void> {
    await this._updateListItem('leaveRequests', id, record);
  }

  public static async getHolidays(): Promise<CompanyHoliday[]> {
    return this._getListItems('companyHolidays') as Promise<CompanyHoliday[]>;
  }

  public static async getEvents(): Promise<CompanyEvent[]> {
    return this._getListItems('companyEvents') as Promise<CompanyEvent[]>;
  }

  public static async getExpenseClaims(_userEmail: string, _roles: string[]): Promise<ExpenseClaim[]> {
    return this._getListItems('expenseClaims') as Promise<ExpenseClaim[]>;
  }

  public static async createExpenseClaim(record: any): Promise<void> {
    if (!record.ClaimID) record.ClaimID = `EXP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    await this._createListItem('expenseClaims', record);
  }

  public static async updateExpenseClaim(id: string, record: any): Promise<void> {
    await this._updateListItem('expenseClaims', id, record);
  }

  public static async getTravelRequests(_userEmail: string, _roles: string[]): Promise<TravelRequest[]> {
    return this._getListItems('travelRequests') as Promise<TravelRequest[]>;
  }

  public static async createTravelRequest(record: any): Promise<void> {
    if (!record.TravelID) record.TravelID = `TRV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    await this._createListItem('travelRequests', record);
  }

  public static async updateTravelRequest(id: string, record: any): Promise<void> {
    await this._updateListItem('travelRequests', id, record);
  }

  public static async getInventory(): Promise<InventoryMaster[]> {
    return this._getListItems('inventoryMaster') as Promise<InventoryMaster[]>;
  }

  public static async getInventoryAssignments(_userEmail: string, _roles: string[]): Promise<InventoryAssignment[]> {
    const listId = this._lists['inventoryAssignments'];
    if (!listId) return [];
    
    // Use expand to fetch the Person column Title
    const url = `${this._siteUrl}/_api/web/lists(guid'${listId}')/items?$select=*,AssignedTo/Title&$expand=AssignedTo&$top=5000`;
    const response = await this._spHttpClient.get(url, SPHttpClient.configurations.v1);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.value ? data.value.map((item: any) => {
       const mapped = mapSPItem(item);
       mapped.AssignedToUser = mapped.AssignedTo?.Title || '';
       return mapped;
    }) : [];
  }

  public static async createInventoryAssignment(record: any): Promise<void> {
    if (!record.Title) record.Title = `ASG-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    await this._createListItem('inventoryAssignments', record);
  }

  // --- MOCK NEW ENDPOINTS FOR LEAVE ADMINISTRATION ---
  
  private static _mockLeaveTypes: any[] = [
    { ID: 1, Title: 'Annual', DefaultBalance: 14 },
    { ID: 2, Title: 'Sick', DefaultBalance: 14 },
    { ID: 3, Title: 'Maternity', DefaultBalance: 90 }
  ];
  
  private static _mockLeaveBalances: any[] = []; // format: { Email, LeaveType, Balance }

  public static async getLeaveTypes(): Promise<any[]> {
    return Promise.resolve([...this._mockLeaveTypes]);
  }

  public static async createLeaveType(title: string, defaultBalance: number): Promise<void> {
    this._mockLeaveTypes.push({
      ID: Math.floor(Math.random() * 10000),
      Title: title,
      DefaultBalance: defaultBalance
    });
    return Promise.resolve();
  }

  public static async getLeaveBalances(email: string): Promise<any[]> {
    const balances = this._mockLeaveBalances.filter(b => b.Email.toLowerCase() === email.toLowerCase());
    // If not found, populate with defaults
    if (balances.length === 0) {
      this._mockLeaveTypes.forEach(lt => {
        this._mockLeaveBalances.push({
          Email: email.toLowerCase(),
          LeaveType: lt.Title,
          Balance: lt.DefaultBalance
        });
      });
      return this._mockLeaveBalances.filter(b => b.Email.toLowerCase() === email.toLowerCase());
    }
    return balances;
  }

  public static async updateLeaveBalance(email: string, leaveType: string, newBalance: number): Promise<void> {
    const record = this._mockLeaveBalances.find(b => b.Email.toLowerCase() === email.toLowerCase() && b.LeaveType === leaveType);
    if (record) {
      record.Balance = newBalance;
    }
    return Promise.resolve();
  }

  // --- NEW CREATE METHODS FOR EVENTS AND INVENTORY ---

  public static async createEvent(record: any): Promise<void> {
    try {
      if (!this._siteUrl || this._siteUrl.includes('localhost')) {
         throw new Error("Localhost mock");
      }
      await this._createListItem('companyEvents', record);
    } catch (e) {
      console.warn("Mocking createEvent due to missing SP or local env");
      alert("Mock saving event (No SharePoint List found)");
    }
  }

  public static async createInventoryItem(record: any): Promise<void> {
    if (!record.AssetID) record.AssetID = `AST-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    try {
      if (!this._siteUrl || this._siteUrl.includes('localhost')) {
         throw new Error("Localhost mock");
      }
      await this._createListItem('inventoryMaster', record);
    } catch (e: any) {
      console.warn("Error creating inventory item:", e);
      if (e.message !== "Localhost mock") {
        alert("SharePoint Error: " + e.message);
      } else {
        alert("Mock saving asset (No SharePoint List found)");
      }
    }
  }

  public static async updateInventoryItem(id: string, record: any): Promise<void> {
    try {
      if (!this._siteUrl || this._siteUrl.includes('localhost')) {
         throw new Error("Localhost mock");
      }
      await this._updateListItem('inventoryMaster', id, record);
    } catch (e: any) {
      console.warn("Error updating inventory item:", e);
      if (e.message !== "Localhost mock") {
        alert("SharePoint Error: " + e.message);
        throw e; // re-throw so the UI component catches it
      } else {
        alert("Mock updating asset (No SharePoint List found)");
      }
    }
  }

  public static async deleteInventoryItem(id: string): Promise<void> {
    try {
      if (!this._siteUrl || this._siteUrl.includes('localhost')) {
         throw new Error("Localhost mock");
      }
      if (typeof (this as any)._deleteListItem === 'function') {
        await (this as any)._deleteListItem('inventoryMaster', id);
      } else {
        throw new Error("Delete method not implemented in base DataService");
      }
    } catch (e: any) {
      console.warn("Error deleting inventory item:", e);
      if (e.message !== "Localhost mock") {
        alert("SharePoint Error: " + e.message);
        throw e;
      } else {
        alert("Mock deleting asset (No SharePoint List found)");
      }
    }
  }
}
