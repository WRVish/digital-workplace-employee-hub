export type ApprovalState = "Pending" | "Approved" | "Rejected";

export interface AppRole {
  Title: string;
  RoleID: string;
  UserAccount?: any; // Represents User field
  Role: "HR Admin" | "IT Admin" | "Finance Admin" | "Manager" | "System Admin";
}

export interface EmployeeMaster {
  Title: string;
  EmployeeID: string;
  UserAccount?: any;
  Email: string;
  Department?: "IT" | "HR" | "Finance" | "Sales" | "Operations";
  JobTitle?: string;
  ManagerAccount?: any;
  Location?: "HQ" | "Remote" | "Branch";
  JoiningDate?: string; // DateTime
  EmploymentType?: "Full-Time" | "Part-Time" | "Contract";
  Status: "Active" | "Inactive";
  CreatedByHR?: any;
}

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface IncidentRequest {
  ID?: number;
  Author?: any;
  Title: string;
  TicketID: string;
  RequestType: "Incident" | "Service Request";
  Category: "IT" | "HR" | "Admin";
  RequestedBy?: EmployeeMaster; // Lookup
  Description?: string;
  Priority: "Low" | "Medium" | "High";
  AssignedTeam?: "IT Support" | "HR Ops" | "Facilities";
  AssignedToAccount?: any;
  Status: "New" | "In Progress" | "Resolved" | "Closed";
  Resolution?: string;
  ClosedDate?: string; // DateTime
}

export interface LeaveRequest {
  ID?: number;
  Author?: any;
  Title: string;
  LeaveID: string;
  Employee?: EmployeeMaster; // Lookup
  LeaveType: "Annual" | "Sick" | "Unpaid" | "Maternity";
  StartDate: string; // DateTime
  EndDate: string; // DateTime
  TotalDays: number;
  Reason?: string;
  ApproverAccount?: any;
  ApprovalStatus: ApprovalState;
}

export interface CompanyHoliday {
  ID?: number;
  Title: string;
  HolidayName: string;
  Date: string; // DateTime
  Location?: "All" | "HQ" | "Branch";
  Country?: "Global" | "USA" | "UK" | "India";
}

export interface CompanyEvent {
  ID?: number;
  Title: string;
  EventName: string;
  Date: string; // DateTime
  Location?: string;
  OrganizerAccount?: any;
  Status: "Upcoming" | "Completed" | "Cancelled";
  Image?: string; // URL
}

export interface ExpenseClaim {
  ID?: number;
  Author?: any;
  Title: string;
  ClaimID: string;
  Employee?: EmployeeMaster; // Lookup
  Category: "Travel" | "Meals" | "Supplies" | "Other";
  Amount: number;
  ManagerApproval: ApprovalState;
  FinanceStatus: "Pending" | "Processing" | "Paid";
}

export interface TravelRequest {
  ID?: number;
  Author?: any;
  Title: string;
  TravelID: string;
  Employee?: EmployeeMaster; // Lookup
  Destination: string;
  StartDate: string; // DateTime
  EndDate: string; // DateTime
  EstimatedCost?: number;
  ApprovalStatus: ApprovalState;
}

export interface InventoryMaster {
  Title: string;
  AssetID: string;
  AssetName: string;
  Category: "Laptop" | "Desktop" | "Mobile" | "Peripherals";
  SerialNumber?: string;
  PurchaseDate?: string; // DateTime
  WarrantyDate?: string; // DateTime
  Status: "Available" | "Assigned" | "Retired" | "Repair";
  Location?: "HQ" | "Remote" | "Branch";
}

export interface InventoryAssignment {
  Title: string;
  Asset?: InventoryMaster; // Lookup
  Employee?: EmployeeMaster; // Lookup
  AssignedDate: string; // DateTime
  ReturnedDate?: string; // DateTime
  AssignedByAccount?: any;
  Status: "Active" | "Returned" | "Lost";
}
