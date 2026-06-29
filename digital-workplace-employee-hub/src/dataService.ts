import { getContext } from '@microsoft/power-apps/app';
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

import { EmployeeMasterService } from './generated/services/EmployeeMasterService';
import { IncidentRequestsService } from './generated/services/IncidentRequestsService';
import { LeaveRequestsService } from './generated/services/LeaveRequestsService';
import { CompanyHolidaysService } from './generated/services/CompanyHolidaysService';
import { CompanyEventsService } from './generated/services/CompanyEventsService';
import { ExpenseClaimsService } from './generated/services/ExpenseClaimsService';
import { TravelRequestsService } from './generated/services/TravelRequestsService';
import { InventoryMasterService } from './generated/services/InventoryMasterService';
import { InventoryAssignmentService } from './generated/services/InventoryAssignmentService';
import { UserPreferencesService } from './generated/services/UserPreferencesService';

// Mock Data (Fallback)
const MOCK_ROLES: AppRole[] = [
  { Title: "ROLE-01", RoleID: "ROLE-01", Role: "System Admin" }
];

const MOCK_LEAVES: LeaveRequest[] = [
  { Title: "Annual Leave", LeaveID: "LV-001", LeaveType: "Annual", ApprovalStatus: "Approved" } as any,
  { Title: "Sick Leave", LeaveID: "LV-002", LeaveType: "Sick", ApprovalStatus: "Pending" } as any
];

const MOCK_INCIDENTS: IncidentRequest[] = [
  { Title: "Laptop issue", TicketID: "INC-001", Status: "In Progress" } as any,
  { Title: "Software request", TicketID: "INC-002", Status: "Resolved" } as any
];

const MOCK_EXPENSES: ExpenseClaim[] = [
  { Title: "Travel to HQ", ClaimID: "EXP-001", Amount: 450, ManagerApproval: "Approved", FinanceStatus: "Processing" } as any,
  { Title: "Team Lunch", ClaimID: "EXP-002", Amount: 85.5, ManagerApproval: "Pending", FinanceStatus: "Pending" } as any
];

const MOCK_TRAVEL: TravelRequest[] = [
  { Title: "London Trip", TravelID: "TRV-001", Destination: "London HQ", EstimatedCost: 1200, ApprovalStatus: "Approved" } as any
];

const MOCK_EMPLOYEES: EmployeeMaster[] = [
  { Title: "Vishnu Admin", EmployeeID: "E001", Email: "info@vishpowerlabs.com", Department: "IT", JobTitle: "System Admin", Status: "Active" }
];

const mapSPItem = (item: any) => {
  if (!item) return item;
  const mapped: any = { ...item };
  for (const key of Object.keys(mapped)) {
    const val = mapped[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if ('Value' in val) {
        mapped[key] = val.Value;
      }
    }
  }
  return mapped;
};

const extractRecords = (res: any) => {
  if (res?.error) {
    console.error("API Error:", res.error);
    throw new Error(res.error.message || "API Error");
  }
  if (!res) return [];
  // Power Apps Connector APIs return { success: true, data: [...] } instead of records
  const records = res.records || res.value || res.data || (Array.isArray(res) ? res : []);
  
  // Debug log to global window so it can be inspected
  if (globalThis.window !== undefined) {
    (globalThis as any).lastSPData = (globalThis as any).lastSPData || [];
    (globalThis as any).lastSPData.push(records);
  }
  
  return Array.isArray(records) ? records.map(mapSPItem) : [];
};

export class DataService {
  public static async getCurrentUserEmail(): Promise<string> {
    try {
      if (globalThis.window.location.hostname === 'localhost' || globalThis.window.location.hostname === '127.0.0.1') {
        throw new Error("Local development detected, bypassing getContext");
      }
      const context = await Promise.race([
        getContext(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for Power Apps context")), 2000))
      ]) as any;
      return context.user?.email || context.user?.userPrincipalName || "info@vishpowerlabs.com";
    } catch (error) {
      console.warn("Could not fetch user context, using fallback for dev", error);
      return "info@vishpowerlabs.com";
    }
  }

  public static async getUserRoles(email: string): Promise<AppRole[]> {
    try {
      // Fetch from EmployeeMaster since Role is now a multi-select choice column there
      const res = await EmployeeMasterService.getAll();
      const records = extractRecords(res);
      const target = email.toLowerCase();
      
      const userRecord = records.find((r: any) => {
        if (typeof r.UserAccount === 'string') {
           return r.UserAccount.toLowerCase().includes(target);
        }
        const u = r.UserAccount || {};
        return (u.Email || '').toLowerCase() === target || 
               (u.Claims || '').toLowerCase().includes(target) || 
               (r['UserAccount#Claims'] || '').toLowerCase().includes(target) ||
               (r.Email || '').toLowerCase() === target ||
               JSON.stringify(u).toLowerCase().includes(target);
      });

      if (userRecord) {
        let roles: string[] = [];
        if (Array.isArray(userRecord.Role)) {
          roles = userRecord.Role.map((r: any) => r.Value || r);
        } else if (userRecord.Role) {
          roles = [userRecord.Role];
        } else if (userRecord.JobTitle) {
          roles = userRecord.JobTitle.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        return roles.map(roleName => ({
          Title: roleName,
          RoleID: roleName,
          Role: roleName as any
        }));
      }

      return [];
    } catch (e) {
      console.error(e);
      return MOCK_ROLES;
    }
  }

  public static async getEmployees(): Promise<EmployeeMaster[]> {
    try {
      const res = await EmployeeMasterService.getAll();
      return extractRecords(res) as EmployeeMaster[];
    } catch (e) {
      console.error(e);
      return MOCK_EMPLOYEES;
    }
  }

  public static async createEmployee(record: any): Promise<void> {
    if (!record.EmployeeID) record.EmployeeID = `E${(window.crypto.getRandomValues(new Uint32Array(1))[0] % 1000).toString().padStart(3, '0')}`;
    const res = await EmployeeMasterService.create(record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async updateEmployee(id: string, record: any): Promise<void> {
    const res = await EmployeeMasterService.update(id, record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async getUserPreferences(email: string): Promise<any> {
    try {
      if (!email) return null;
      const res = await UserPreferencesService.getAll();
      const records = extractRecords(res);
      const userPref = records.find(r => 
        (r.Email && r.Email.toLowerCase() === email.toLowerCase()) || 
        (r.Title && r.Title.toLowerCase().includes(email.split('@')[0].toLowerCase()))
      );
      return userPref || null;
    } catch (error) {
      console.warn("UserPreferences API failed, using default", error);
      return null;
    }
  }

  public static async saveUserPreferences(id: string | null, email: string, theme: string, colorScheme: string): Promise<boolean> {
    try {
      if (id) {
        await UserPreferencesService.update(id, {
          Theme: { Value: theme } as any,
          ColorScheme: { Value: colorScheme } as any
        });
      } else {
        await UserPreferencesService.create({
          Title: `Pref-${email.split('@')[0]}`,
          Email: email,
          Theme: { Value: theme } as any,
          ColorScheme: { Value: colorScheme } as any
        });
      }
      return true;
    } catch (error) {
      console.error("Failed to save user preferences", error);
      return false;
    }
  }

  public static async getIncidentRequests(userEmail: string, roles: string[]): Promise<IncidentRequest[]> {
    try {
      const res = await IncidentRequestsService.getAll();
      const records = extractRecords(res) as IncidentRequest[];
      if (roles.includes('IT Admin') || roles.includes('System Admin')) return records;
      return records.filter(r => {
        const reqBy = (r.RequestedBy?.Title || '').toString().toLowerCase();
        const author = r.Author || {};
        const authorEmail = (author.Email || author.Claims || '').toLowerCase();
        
        const target = userEmail.toLowerCase();
        // Match exact email, or just the prefix (since local dev mock emails might differ slightly from SP Claims)
        const targetPrefix = target.split('@')[0];
        
        return reqBy.includes(targetPrefix) || authorEmail.includes(targetPrefix);
      });
    } catch (e) {
      console.error(e);
      return MOCK_INCIDENTS;
    }
  }

  public static async createIncidentRequest(record: any): Promise<void> {
    // Generate a quick TicketID if not provided
    if (!record.TicketID) record.TicketID = `TKT-${(window.crypto.getRandomValues(new Uint32Array(1))[0] % 10000).toString().padStart(4, '0')}`;
    
    const res = await IncidentRequestsService.create(record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async updateIncidentRequest(id: string, record: any): Promise<void> {
    const res = await IncidentRequestsService.update(id, record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async getLeaveRequests(userEmail: string, roles: string[]): Promise<LeaveRequest[]> {
    try {
      const res = await LeaveRequestsService.getAll();
      const records = extractRecords(res) as LeaveRequest[];
      if (roles.includes('HR Admin') || roles.includes('System Admin')) return records;
      return records.filter(r => {
        const empBy = (r.Employee?.Title || '').toString().toLowerCase();
        const author = r.Author || {};
        const authorEmail = (author.Email || author.Claims || '').toLowerCase();
        
        const targetPrefix = userEmail.split('@')[0].toLowerCase();
        return empBy.includes(targetPrefix) || authorEmail.includes(targetPrefix);
      });
    } catch (e) {
      console.error(e);
      return MOCK_LEAVES;
    }
  }

  public static async createLeaveRequest(record: any): Promise<void> {
    if (!record.LeaveID) record.LeaveID = `LV-${(window.crypto.getRandomValues(new Uint32Array(1))[0] % 10000).toString().padStart(4, '0')}`;
    const res = await LeaveRequestsService.create(record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async updateLeaveRequest(id: string, record: any): Promise<void> {
    const res = await LeaveRequestsService.update(id, record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async getHolidays(): Promise<CompanyHoliday[]> {
    try {
      const res = await CompanyHolidaysService.getAll();
      return extractRecords(res) as CompanyHoliday[];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public static async getEvents(): Promise<CompanyEvent[]> {
    try {
      const res = await CompanyEventsService.getAll();
      return extractRecords(res) as CompanyEvent[];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public static async getExpenseClaims(_userEmail: string, _roles: string[]): Promise<ExpenseClaim[]> {
    try {
      const res = await ExpenseClaimsService.getAll();
      return extractRecords(res) as ExpenseClaim[];
    } catch (e) {
      console.error(e);
      return MOCK_EXPENSES;
    }
  }

  public static async createExpenseClaim(record: any): Promise<void> {
    if (!record.ClaimID) record.ClaimID = `EXP-${(window.crypto.getRandomValues(new Uint32Array(1))[0] % 10000).toString().padStart(4, '0')}`;
    const res = await ExpenseClaimsService.create(record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async updateExpenseClaim(id: string, record: any): Promise<void> {
    const res = await ExpenseClaimsService.update(id, record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async getTravelRequests(_userEmail: string, _roles: string[]): Promise<TravelRequest[]> {
    try {
      const res = await TravelRequestsService.getAll();
      return extractRecords(res) as TravelRequest[];
    } catch (e) {
      console.error(e);
      return MOCK_TRAVEL;
    }
  }

  public static async createTravelRequest(record: any): Promise<void> {
    if (!record.TravelID) record.TravelID = `TRV-${(window.crypto.getRandomValues(new Uint32Array(1))[0] % 10000).toString().padStart(4, '0')}`;
    const res = await TravelRequestsService.create(record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async updateTravelRequest(id: string, record: any): Promise<void> {
    const res = await TravelRequestsService.update(id, record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async getInventory(): Promise<InventoryMaster[]> {
    try {
      const res = await InventoryMasterService.getAll();
      return extractRecords(res) as InventoryMaster[];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public static async getInventoryAssignments(_userEmail: string, _roles: string[]): Promise<InventoryAssignment[]> {
    try {
      const res = await InventoryAssignmentService.getAll();
      const records = extractRecords(res) as InventoryAssignment[];
      // Map the user name out of the AssignedTo Person column
      return records.map(r => ({
        ...r,
        AssignedToUser: r.AssignedTo?.Title || r.AssignedTo?.DisplayName || (r.AssignedTo as any)?.Value || ''
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public static async createInventoryAssignment(record: any): Promise<void> {
    if (!record.Title) record.Title = `ASG-${(window.crypto.getRandomValues(new Uint32Array(1))[0] % 10000).toString().padStart(4, '0')}`;
    const res = await InventoryAssignmentService.create(record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async updateInventoryItem(id: string, record: any): Promise<void> {
    const res = await InventoryMasterService.update(id, record);
    if (res.error) throw new Error(res.error.message);
  }

  public static async deleteInventoryItem(id: string): Promise<void> {
    await InventoryMasterService.delete(id);
  }

  public static async createInventoryItem(record: any): Promise<void> {
    const res = await InventoryMasterService.create(record);
    if (res.error) throw new Error(res.error.message);
  }

  // Resolve user to their Power Apps / SharePoint ID (or use email as fallback if PowerApps connector handles it)
  public static async getUserIdByEmail(email: string): Promise<string | number | null> {
    // In Dataverse/Power Apps, the person column might accept the email string directly or a User record ID.
    // For simplicity, we can return the email to be used in the People Picker lookup column.
    // If it's a SharePoint backend, the connector often handles claims or email via the Value property.
    return email; 
  }
}

