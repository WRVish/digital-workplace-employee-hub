<#
.SYNOPSIS
    Intranet App - SharePoint List Provisioning and Data Import

.DESCRIPTION
    Creates all 10 SharePoint lists for the Intranet App,
    provisions columns with correct types, handles Lookups,
    and bulk-imports test data. Safe to re-run.

.NOTES
    Requires : PnP.PowerShell v1.12.0 or higher
    Auth     : Uses UseWebLogin (browser pop-up)
    Author   : Generated Architecture Script
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ============================================================
# USERS — update these to match your tenant UPNs
# ============================================================
$U_SuperAdmin = "info@vishpowerlabs.com"
$U_ITAdmin    = "anu@vishpowerlabs.com"
$U_ReadOnly   = "demo@vishpowerlabs.com"
$U_User1      = "demo2@devtenant0424.onmicrosoft.com"
$U_User2      = "samiksha@devtenant0424.onmicrosoft.com"
$U_User3      = "spadmin@devtenant0424.onmicrosoft.com"
$U_User4      = "tenantadmin@devtenant0424.onmicrosoft.com"
$U_User5      = "pradeep@vishpowerlabs.com"

# ============================================================
# OUTPUT HELPERS
# ============================================================
function Write-Banner {
    param([string]$Text)
    $line = "=" * 60
    Write-Host ""
    Write-Host $line        -ForegroundColor Cyan
    Write-Host "  $Text"    -ForegroundColor Cyan
    Write-Host $line        -ForegroundColor Cyan
}
function Write-Step { param([string]$t); Write-Host "  >> $t"        -ForegroundColor White  }
function Write-OK   { param([string]$t); Write-Host "     [OK]   $t" -ForegroundColor Green  }
function Write-Warn { param([string]$t); Write-Host "     [WARN] $t" -ForegroundColor Yellow }
function Write-Fail { param([string]$t); Write-Host "     [FAIL] $t" -ForegroundColor Red    }

# ============================================================
# PRE-FLIGHT CHECKS
# ============================================================
function Invoke-PreflightChecks {
    Write-Banner "Pre-flight Checks"
    $pass = $true

    $mod = Get-Module -ListAvailable -Name "PnP.PowerShell" | Sort-Object Version -Descending | Select-Object -First 1
    if ($null -ne $mod) {
        Write-OK "PnP.PowerShell v$($mod.Version) found"
    } else {
        Write-Fail "PnP.PowerShell not found. Please install it."
        $pass = $false
    }
    return $pass
}

# ============================================================
# LIST PROVISIONING
# ============================================================
function New-IntranetList {
    param(
        [string]$ListName,
        [array] $Cols
    )
    Write-Step "Provisioning list: $ListName"

    $existing = Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue
    if ($null -eq $existing) {
        New-PnPList -Title $ListName -Template GenericList -OnQuickLaunch:$false | Out-Null
        Write-OK "List created: $ListName"
    } else {
        Write-Warn "List already exists: $ListName"
    }

    foreach ($col in $Cols) {
        $ec = Get-PnPField -List $ListName -Identity $col.Name -ErrorAction SilentlyContinue
        if ($null -ne $ec) { continue }
        try {
            if ($col.Type -eq "Choice") {
                $choices = ($col.Choices | ForEach-Object { "<CHOICE>$_</CHOICE>" }) -join ""
                $xml = "<Field Type='Choice' Name='$($col.Name)' DisplayName='$($col.Name)'" +
                       " Required='$(if($col.Required){"TRUE"}else{"FALSE"})'>" +
                       "<CHOICES>$choices</CHOICES></Field>"
                Add-PnPFieldFromXml -List $ListName -FieldXml $xml | Out-Null
            } elseif ($col.Type -eq "Note") {
                Add-PnPField -List $ListName -DisplayName $col.Name -InternalName $col.Name -Type Note -Required:$col.Required | Out-Null
            } elseif ($col.Type -eq "DateTime") {
                Add-PnPField -List $ListName -DisplayName $col.Name -InternalName $col.Name -Type DateTime -Required:$col.Required | Out-Null
            } elseif ($col.Type -eq "Number") {
                Add-PnPField -List $ListName -DisplayName $col.Name -InternalName $col.Name -Type Number -Required:$col.Required | Out-Null
            } elseif ($col.Type -eq "Boolean") {
                Add-PnPField -List $ListName -DisplayName $col.Name -InternalName $col.Name -Type Boolean -Required:$col.Required | Out-Null
            } elseif ($col.Type -eq "Currency") {
                Add-PnPField -List $ListName -DisplayName $col.Name -InternalName $col.Name -Type Currency -Required:$col.Required | Out-Null
            } elseif ($col.Type -eq "User") {
                $xml = "<Field Type='User' Name='$($col.Name)' DisplayName='$($col.Name)'" +
                       " Required='$(if($col.Required){"TRUE"}else{"FALSE"})'" +
                       " UserSelectionMode='PeopleOnly' UserSelectionScope='0'/>"
                Add-PnPFieldFromXml -List $ListName -FieldXml $xml | Out-Null
            } elseif ($col.Type -eq "URL" -or $col.Type -eq "Image") {
                Add-PnPField -List $ListName -DisplayName $col.Name -InternalName $col.Name -Type URL -Required:$col.Required | Out-Null
            } elseif ($col.Type -eq "Lookup") {
                $targetList = Get-PnPList -Identity $col.LookupList
                $xml = "<Field Type='Lookup' Name='$($col.Name)' DisplayName='$($col.Name)' List='{$($targetList.Id)}' ShowField='$($col.LookupField)' />"
                Add-PnPFieldFromXml -List $ListName -FieldXml $xml | Out-Null
            } else {
                Add-PnPField -List $ListName -DisplayName $col.Name -InternalName $col.Name -Type Text -Required:$col.Required | Out-Null
            }
            Write-OK "  Column added: $($col.Name) [$($col.Type)]"
        } catch {
            Write-Warn "  Column issue ($($col.Name)): $($_.Exception.Message)"
        }
    }
}

function Update-DefaultView {
    param([string]$ListName, [string[]]$Fields)
    try {
        $view = Get-PnPView -List $ListName -Identity "All Items" -ErrorAction SilentlyContinue
        if ($null -eq $view) { $view = Get-PnPView -List $ListName | Select-Object -First 1 }
        if ($null -ne $view) { Set-PnPView -List $ListName -Identity $view.Title -Fields $Fields | Out-Null }
    } catch { }
}

# ============================================================
# IMPORT FUNCTION
# ============================================================
function Import-DataItems {
    param([string]$ListName, [array]$Items, [hashtable]$LookupMap = @{})

    Write-Step "Importing $($Items.Count) items -> $ListName"
    $added=0; $skipped=0; $failed=0

    $existing = @()
    try {
        $existing = Get-PnPListItem -List $ListName -PageSize 500 -Fields "Title" | ForEach-Object { $_.FieldValues["Title"] }
    } catch { }

    foreach ($item in $Items) {
        if ($existing -contains $item.Title) { $skipped++; continue }

        try {
            $values = @{}
            foreach ($prop in $item.PSObject.Properties) {
                if ($prop.Name -eq "Title") { continue }
                $val = $prop.Value
                if ($null -ne $val -and $val -ne "") {
                    # If this column is a lookup, resolve the ID from the map
                    if ($LookupMap.ContainsKey($prop.Name) -and $LookupMap[$prop.Name].ContainsKey($val)) {
                        $values[$prop.Name] = $LookupMap[$prop.Name][$val]
                    } else {
                        $values[$prop.Name] = $val
                    }
                }
            }
            Add-PnPListItem -List $ListName -Values (@{ Title = $item.Title } + $values) | Out-Null
            $added++
        } catch {
            Write-Fail "FAILED: $($item.Title) -> $($_.Exception.Message)"
            $failed++
        }
    }
    Write-OK "Done: Added=$added  Skipped=$skipped  Failed=$failed"
}

# ============================================================
# SCHEMAS
# ============================================================

$Cols_AppRoles = @(
    @{ Name="RoleID"; Type="Text"; Required=$true }
    @{ Name="UserAccount"; Type="User"; Required=$false }
    @{ Name="Role"; Type="Choice"; Choices=@("HR Admin","IT Admin","Finance Admin","Manager","System Admin"); Required=$true }
)

$Cols_EmployeeMaster = @(
    @{ Name="EmployeeID"; Type="Text"; Required=$true }
    @{ Name="UserAccount"; Type="User"; Required=$false }
    @{ Name="Email"; Type="Text"; Required=$true }
    @{ Name="Department"; Type="Choice"; Choices=@("IT","HR","Finance","Sales","Operations"); Required=$false }
    @{ Name="JobTitle"; Type="Text"; Required=$false }
    @{ Name="ManagerAccount"; Type="User"; Required=$false }
    @{ Name="Location"; Type="Choice"; Choices=@("HQ","Remote","Branch"); Required=$false }
    @{ Name="JoiningDate"; Type="DateTime"; Required=$false }
    @{ Name="EmploymentType"; Type="Choice"; Choices=@("Full-Time","Part-Time","Contract"); Required=$false }
    @{ Name="Status"; Type="Choice"; Choices=@("Active","Inactive"); Required=$true }
    @{ Name="CreatedByHR"; Type="User"; Required=$false }
)

$Cols_IncidentRequests = @(
    @{ Name="TicketID"; Type="Text"; Required=$true }
    @{ Name="RequestType"; Type="Choice"; Choices=@("Incident","Service Request"); Required=$true }
    @{ Name="Category"; Type="Choice"; Choices=@("IT","HR","Admin"); Required=$true }
    @{ Name="RequestedBy"; Type="Lookup"; LookupList="EmployeeMaster"; LookupField="Title"; Required=$false }
    @{ Name="Description"; Type="Note"; Required=$false }
    @{ Name="Priority"; Type="Choice"; Choices=@("Low","Medium","High"); Required=$true }
    @{ Name="AssignedTeam"; Type="Choice"; Choices=@("IT Support","HR Ops","Facilities"); Required=$false }
    @{ Name="AssignedToAccount"; Type="User"; Required=$false }
    @{ Name="Status"; Type="Choice"; Choices=@("New","In Progress","Resolved","Closed"); Required=$true }
    @{ Name="Resolution"; Type="Note"; Required=$false }
    @{ Name="ClosedDate"; Type="DateTime"; Required=$false }
)

$Cols_LeaveRequests = @(
    @{ Name="LeaveID"; Type="Text"; Required=$true }
    @{ Name="Employee"; Type="Lookup"; LookupList="EmployeeMaster"; LookupField="Title"; Required=$false }
    @{ Name="LeaveType"; Type="Choice"; Choices=@("Annual","Sick","Unpaid","Maternity"); Required=$true }
    @{ Name="StartDate"; Type="DateTime"; Required=$true }
    @{ Name="EndDate"; Type="DateTime"; Required=$true }
    @{ Name="TotalDays"; Type="Number"; Required=$true }
    @{ Name="Reason"; Type="Note"; Required=$false }
    @{ Name="ApproverAccount"; Type="User"; Required=$false }
    @{ Name="ApprovalStatus"; Type="Choice"; Choices=@("Pending","Approved","Rejected"); Required=$true }
)

$Cols_CompanyHolidays = @(
    @{ Name="HolidayName"; Type="Text"; Required=$true }
    @{ Name="Date"; Type="DateTime"; Required=$true }
    @{ Name="Location"; Type="Choice"; Choices=@("All","HQ","Branch"); Required=$false }
    @{ Name="Country"; Type="Choice"; Choices=@("Global","USA","UK","India"); Required=$false }
)

$Cols_CompanyEvents = @(
    @{ Name="EventName"; Type="Text"; Required=$true }
    @{ Name="Date"; Type="DateTime"; Required=$true }
    @{ Name="Location"; Type="Text"; Required=$false }
    @{ Name="OrganizerAccount"; Type="User"; Required=$false }
    @{ Name="Status"; Type="Choice"; Choices=@("Upcoming","Completed","Cancelled"); Required=$true }
    @{ Name="Image"; Type="URL"; Required=$false }
)

$Cols_ExpenseClaims = @(
    @{ Name="ClaimID"; Type="Text"; Required=$true }
    @{ Name="Employee"; Type="Lookup"; LookupList="EmployeeMaster"; LookupField="Title"; Required=$false }
    @{ Name="Category"; Type="Choice"; Choices=@("Travel","Meals","Supplies","Other"); Required=$true }
    @{ Name="Amount"; Type="Currency"; Required=$true }
    @{ Name="ManagerApproval"; Type="Choice"; Choices=@("Pending","Approved","Rejected"); Required=$true }
    @{ Name="FinanceStatus"; Type="Choice"; Choices=@("Pending","Processing","Paid"); Required=$true }
)

$Cols_TravelRequests = @(
    @{ Name="TravelID"; Type="Text"; Required=$true }
    @{ Name="Employee"; Type="Lookup"; LookupList="EmployeeMaster"; LookupField="Title"; Required=$false }
    @{ Name="Destination"; Type="Text"; Required=$true }
    @{ Name="StartDate"; Type="DateTime"; Required=$true }
    @{ Name="EndDate"; Type="DateTime"; Required=$true }
    @{ Name="EstimatedCost"; Type="Currency"; Required=$false }
    @{ Name="ApprovalStatus"; Type="Choice"; Choices=@("Pending","Approved","Rejected"); Required=$true }
)

$Cols_InventoryMaster = @(
    @{ Name="AssetID"; Type="Text"; Required=$true }
    @{ Name="AssetName"; Type="Text"; Required=$true }
    @{ Name="Category"; Type="Choice"; Choices=@("Laptop","Desktop","Mobile","Peripherals"); Required=$true }
    @{ Name="SerialNumber"; Type="Text"; Required=$false }
    @{ Name="PurchaseDate"; Type="DateTime"; Required=$false }
    @{ Name="WarrantyDate"; Type="DateTime"; Required=$false }
    @{ Name="Status"; Type="Choice"; Choices=@("Available","Assigned","Retired","Repair"); Required=$true }
    @{ Name="Location"; Type="Choice"; Choices=@("HQ","Remote","Branch"); Required=$false }
)

$Cols_InventoryAssignment = @(
    @{ Name="Asset"; Type="Lookup"; LookupList="InventoryMaster"; LookupField="Title"; Required=$false }
    @{ Name="Employee"; Type="Lookup"; LookupList="EmployeeMaster"; LookupField="Title"; Required=$false }
    @{ Name="AssignedDate"; Type="DateTime"; Required=$true }
    @{ Name="ReturnedDate"; Type="DateTime"; Required=$false }
    @{ Name="AssignedByAccount"; Type="User"; Required=$false }
    @{ Name="Status"; Type="Choice"; Choices=@("Active","Returned","Lost"); Required=$true }
)

# ============================================================
# TEST DATA
# ============================================================
$Data_AppRoles = @(
    [PSCustomObject]@{ Title="ROLE-01"; RoleID="ROLE-01"; UserAccount=$U_SuperAdmin; Role="System Admin" }
    [PSCustomObject]@{ Title="ROLE-02"; RoleID="ROLE-02"; UserAccount=$U_ITAdmin; Role="IT Admin" }
    [PSCustomObject]@{ Title="ROLE-03"; RoleID="ROLE-03"; UserAccount=$U_User1; Role="HR Admin" }
    [PSCustomObject]@{ Title="ROLE-04"; RoleID="ROLE-04"; UserAccount=$U_User2; Role="Finance Admin" }
    [PSCustomObject]@{ Title="ROLE-05"; RoleID="ROLE-05"; UserAccount=$U_User3; Role="Manager" }
)

$Data_EmployeeMaster = @(
    [PSCustomObject]@{ Title="E001"; EmployeeID="E001"; UserAccount=$U_SuperAdmin; Email=$U_SuperAdmin; Department="IT"; JobTitle="System Admin"; Location="HQ"; JoiningDate="2020-01-01"; EmploymentType="Full-Time"; Status="Active" }
    [PSCustomObject]@{ Title="E002"; EmployeeID="E002"; UserAccount=$U_ITAdmin; Email=$U_ITAdmin; Department="IT"; JobTitle="IT Admin"; Location="HQ"; JoiningDate="2021-06-01"; EmploymentType="Full-Time"; Status="Active" }
    [PSCustomObject]@{ Title="E003"; EmployeeID="E003"; UserAccount=$U_User1; Email=$U_User1; Department="HR"; JobTitle="HR Manager"; Location="Remote"; JoiningDate="2019-03-15"; EmploymentType="Full-Time"; Status="Active" }
    [PSCustomObject]@{ Title="E004"; EmployeeID="E004"; UserAccount=$U_User2; Email=$U_User2; Department="Finance"; JobTitle="Finance Admin"; Location="HQ"; JoiningDate="2022-11-10"; EmploymentType="Full-Time"; Status="Active" }
    [PSCustomObject]@{ Title="E005"; EmployeeID="E005"; UserAccount=$U_User3; Email=$U_User3; Department="Sales"; JobTitle="Sales Lead"; Location="Branch"; JoiningDate="2023-01-20"; EmploymentType="Full-Time"; Status="Active" }
)

$Data_IncidentRequests = @(
    [PSCustomObject]@{ Title="INC-001"; TicketID="INC-001"; RequestType="Incident"; Category="IT"; RequestedBy="E003"; Description="Laptop not turning on"; Priority="High"; AssignedTeam="IT Support"; AssignedToAccount=$U_ITAdmin; Status="In Progress" }
    [PSCustomObject]@{ Title="REQ-002"; TicketID="REQ-002"; RequestType="Service Request"; Category="HR"; RequestedBy="E004"; Description="Update banking details"; Priority="Medium"; AssignedTeam="HR Ops"; AssignedToAccount=$U_User1; Status="New" }
)

$Data_LeaveRequests = @(
    [PSCustomObject]@{ Title="LV-001"; LeaveID="LV-001"; Employee="E004"; LeaveType="Annual"; StartDate="2026-07-01"; EndDate="2026-07-05"; TotalDays=5; Reason="Summer Vacation"; ApproverAccount=$U_User3; ApprovalStatus="Approved" }
)

$Data_ExpenseClaims = @(
    [PSCustomObject]@{ Title="EXP-001"; ClaimID="EXP-001"; Employee="E005"; Category="Travel"; Amount=450.00; ManagerApproval="Approved"; FinanceStatus="Processing" }
)

$Data_TravelRequests = @(
    [PSCustomObject]@{ Title="TRV-001"; TravelID="TRV-001"; Employee="E005"; Destination="London HQ"; StartDate="2026-08-10"; EndDate="2026-08-15"; EstimatedCost=1200.00; ApprovalStatus="Approved" }
)

$Data_InventoryMaster = @(
    [PSCustomObject]@{ Title="AST-1001"; AssetID="AST-1001"; AssetName="Dell XPS 15"; Category="Laptop"; SerialNumber="SN12345"; PurchaseDate="2024-01-15"; Status="Assigned"; Location="HQ" }
    [PSCustomObject]@{ Title="AST-1002"; AssetID="AST-1002"; AssetName="MacBook Pro 14"; Category="Laptop"; SerialNumber="SN98765"; PurchaseDate="2025-03-10"; Status="Available"; Location="HQ" }
)

$Data_InventoryAssignment = @(
    [PSCustomObject]@{ Title="ASG-001"; Asset="AST-1001"; Employee="E002"; AssignedDate="2024-02-01"; AssignedByAccount=$U_SuperAdmin; Status="Active" }
)

# ============================================================
# MAIN EXECUTION
# ============================================================
Write-Banner "Intranet App - List Provisioning"
if (-not (Invoke-PreflightChecks)) { exit 1 }

Write-Banner "Connecting to SharePoint"
Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId 9bc3ab49-b65d-410a-85ad-de819febfddc

# 1. Base Lists (No Lookups)
New-IntranetList -ListName "AppRoles"         -Cols $Cols_AppRoles
New-IntranetList -ListName "EmployeeMaster"   -Cols $Cols_EmployeeMaster
New-IntranetList -ListName "CompanyHolidays"  -Cols $Cols_CompanyHolidays
New-IntranetList -ListName "CompanyEvents"    -Cols $Cols_CompanyEvents
New-IntranetList -ListName "InventoryMaster"  -Cols $Cols_InventoryMaster

# 2. Dependent Lists (Lookups)
New-IntranetList -ListName "IncidentRequests" -Cols $Cols_IncidentRequests
New-IntranetList -ListName "LeaveRequests"    -Cols $Cols_LeaveRequests
New-IntranetList -ListName "ExpenseClaims"    -Cols $Cols_ExpenseClaims
New-IntranetList -ListName "TravelRequests"   -Cols $Cols_TravelRequests
New-IntranetList -ListName "InventoryAssignment" -Cols $Cols_InventoryAssignment

# Views
Update-DefaultView -ListName "AppRoles" -Fields @("Title","RoleID","UserAccount","Role")
Update-DefaultView -ListName "EmployeeMaster" -Fields @("Title","EmployeeID","UserAccount","Email","Department","JobTitle","Status")

# Base Data Import
Write-Banner "Importing Base Data"
Import-DataItems -ListName "AppRoles" -Items $Data_AppRoles
Import-DataItems -ListName "EmployeeMaster" -Items $Data_EmployeeMaster
Import-DataItems -ListName "InventoryMaster" -Items $Data_InventoryMaster

# Resolve Lookups
Write-Banner "Resolving Lookups for Dependent Data"
$EmployeeMap = @{}
Get-PnPListItem -List "EmployeeMaster" -Fields "ID","Title" | ForEach-Object { $EmployeeMap[$_.FieldValues["Title"]] = $_.Id }

$InventoryMap = @{}
Get-PnPListItem -List "InventoryMaster" -Fields "ID","Title" | ForEach-Object { $InventoryMap[$_.FieldValues["Title"]] = $_.Id }

$GlobalLookups = @{
    "RequestedBy" = $EmployeeMap
    "Employee"    = $EmployeeMap
    "Asset"       = $InventoryMap
}

# Dependent Data Import
Write-Banner "Importing Dependent Data"
Import-DataItems -ListName "IncidentRequests" -Items $Data_IncidentRequests -LookupMap $GlobalLookups
Import-DataItems -ListName "LeaveRequests"    -Items $Data_LeaveRequests -LookupMap $GlobalLookups
Import-DataItems -ListName "ExpenseClaims"    -Items $Data_ExpenseClaims -LookupMap $GlobalLookups
Import-DataItems -ListName "TravelRequests"   -Items $Data_TravelRequests -LookupMap $GlobalLookups
Import-DataItems -ListName "InventoryAssignment" -Items $Data_InventoryAssignment -LookupMap $GlobalLookups

Disconnect-PnPOnline
Write-Banner "Deployment Complete"


