<#
.SYNOPSIS
    Asset Management - SharePoint List Provisioning and Data Import

.DESCRIPTION
    Creates all 6 SharePoint lists for the Asset Management Power App,
    provisions columns with correct types, and bulk-imports test data.
    Uses UseWebLogin for authentication. Safe to re-run - existing items
    are skipped to avoid duplicates.

.NOTES
    Requires : PnP.PowerShell v1.12.0
    Install  : Install-Module PnP.PowerShell -RequiredVersion 1.12.0 -Scope CurrentUser -Force -AllowClobber
    Auth     : Uses UseWebLogin (browser pop-up)
    Author   : Vishnu WR - wrvishnu.com
    Version  : 1.1
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptVersion = "1.1"

# ============================================================
# USERS — update these to match your tenant UPNs
# ============================================================
$U_SuperAdmin = "vishnu@vishpowerlabs.com"
$U_ITAdmin    = "HelpdeskRead@vishpowerlabs.com"
$U_ReadOnly   = "Helpdesk1@vishpowerlabs.com"
$U_User1      = "user1@vishpowerlabs.com"
$U_User2      = "user2@vishpowerlabs.com"
$U_User3      = "user3@vishpowerlabs.com"
$U_User4      = "user4@vishpowerlabs.com"
$U_User5      = "user5@vishpowerlabs.com"

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
    param([string]$Url)
    Write-Banner "Pre-flight Checks"
    $pass = $true

    Write-Step "PowerShell version"
    if ($PSVersionTable.PSVersion.Major -ge 5) {
        Write-OK "PowerShell $($PSVersionTable.PSVersion)"
    } else {
        Write-Fail "PowerShell 5.1 or higher required"
        $pass = $false
    }

    Write-Step "PnP.PowerShell module"
    $mod = Get-Module -ListAvailable -Name "PnP.PowerShell" |
           Sort-Object Version -Descending | Select-Object -First 1
    if ($null -ne $mod) {
        Write-OK "PnP.PowerShell v$($mod.Version) found"
    } else {
        Write-Fail "PnP.PowerShell not found. Run: Install-Module PnP.PowerShell -RequiredVersion 1.12.0 -Scope CurrentUser -Force -AllowClobber"
        $pass = $false
    }

    Write-Step "Site URL format"
    if ($Url -match "^https://[a-zA-Z0-9\-]+\.sharepoint\.com/") {
        Write-OK "URL format valid"
    } else {
        Write-Fail "URL does not look like a SharePoint Online URL: $Url"
        $pass = $false
    }

    Write-Step "Network connectivity"
    try {
        $uri  = [System.Uri]$Url
        $req  = [System.Net.WebRequest]::Create("$($uri.Scheme)://$($uri.Host)")
        $req.Method  = "HEAD"
        $req.Timeout = 10000
        $resp = $req.GetResponse()
        $resp.Close()
        Write-OK "Host reachable: $($uri.Host)"
    } catch {
        Write-Warn "Could not reach host - may be VPN or proxy. Continuing anyway."
    }

    Write-Step "Execution policy"
    $policy = Get-ExecutionPolicy
    if ($policy -in @("Unrestricted","RemoteSigned","Bypass")) {
        Write-OK "Execution policy: $policy"
    } else {
        Write-Warn "Execution policy is '$policy'. Fix: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser"
    }

    return $pass
}

# ============================================================
# LIST PROVISIONING
# ============================================================
function New-AssetList {
    param(
        [string]$ListName,
        [array] $Cols
    )
    Write-Step "Provisioning list: $ListName"

    $existing = Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue
    if ($null -eq $existing) {
        if ($PSCmdlet.ShouldProcess($ListName, "Create SharePoint list")) {
            New-PnPList -Title $ListName -Template GenericList -OnQuickLaunch:$false | Out-Null
            Write-OK "List created: $ListName"
        }
    } else {
        Write-Warn "List already exists (columns will be checked): $ListName"
    }

    foreach ($col in $Cols) {
        $ec = Get-PnPField -List $ListName -Identity $col.Name -ErrorAction SilentlyContinue
        if ($null -ne $ec) { continue }
        try {
            if ($col.Type -eq "Choice") {
                $choices = ($col.Choices | ForEach-Object { "<CHOICE>$_</CHOICE>" }) -join ""
                $xml = "<Field Type='Choice' Name='$($col.Name)' DisplayName='$($col.Name)'" +
                       " Required='$(if($col.Required){"TRUE"}else{"FALSE"})'>" +
                       "<Default>$($col.Default)</Default>" +
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
            } elseif ($col.Type -eq "URL" -or $col.Type -eq "Hyperlink") {
                Add-PnPField -List $ListName -DisplayName $col.Name -InternalName $col.Name -Type URL -Required:$col.Required | Out-Null
            } else {
                Add-PnPField -List $ListName -DisplayName $col.Name -InternalName $col.Name -Type Text -Required:$col.Required | Out-Null
            }
            Write-OK "  Column added: $($col.Name)"
        } catch {
            Write-Warn "  Column issue ($($col.Name)): $($_.Exception.Message)"
        }
    }
}

# ============================================================
# VIEW UPDATE FUNCTION
# Updates the default All Items view to show all list columns
# ============================================================
function Update-DefaultView {
    param(
        [string]$ListName,
        [string[]]$Fields
    )
    Write-Step "Updating default view: $ListName"
    try {
        $view = Get-PnPView -List $ListName -Identity "All Items" -ErrorAction SilentlyContinue
        if ($null -eq $view) {
            $view = Get-PnPView -List $ListName | Select-Object -First 1
        }
        if ($null -ne $view) {
            Set-PnPView -List $ListName -Identity $view.Title -Fields $Fields | Out-Null
            Write-OK "  View updated: $($view.Title) -> $($Fields.Count) columns"
        } else {
            Write-Warn "  No view found for $ListName"
        }
    } catch {
        Write-Warn "  View update issue ($ListName): $($_.Exception.Message)"
    }
}

# ============================================================
# IMPORT FUNCTION
# ============================================================
function Import-AssetItems {
    param([string]$ListName, [array]$Items)

    Write-Step "Importing $($Items.Count) items -> $ListName"
    $added=0; $skipped=0; $failed=0; $i=0
    $total = $Items.Count

    $existing = @()
    try {
        $existing = Get-PnPListItem -List $ListName -PageSize 500 -Fields "Title" |
                    ForEach-Object { $_.FieldValues["Title"] }
    } catch { }

    foreach ($item in $Items) {
        $i++
        $pct   = [int](($i / $total) * 100)
        $short = if ($item.Title.Length -gt 55) { $item.Title.Substring(0,55) + "..." } else { $item.Title }
        Write-Progress -Activity "Importing $ListName" -Status "$i/$total - $short" -PercentComplete $pct

        if ($existing -contains $item.Title) { $skipped++; continue }

        if ($PSCmdlet.ShouldProcess($item.Title, "Add to $ListName")) {
            try {
                $values = @{}
                foreach ($prop in $item.PSObject.Properties) {
                    if ($prop.Name -eq "Title") { continue }
                    # Ignore ID, LinkTitle, or bracketed metadata fields
                    if ($prop.Name -eq "ID" -or $prop.Name -eq "LinkTitle" -or $prop.Name -like "*{*}*") { continue }
                    
                    $val = $prop.Value
                    if ($null -ne $val -and $val -ne "") {
                        # Map contoso placeholder emails to configured tenant UPNs
                        if ($EmailMap.ContainsKey($val)) {
                            $val = $EmailMap[$val]
                        }
                        $values[$prop.Name] = $val
                    }
                }
                Add-PnPListItem -List $ListName -Values (@{ Title = $item.Title } + $values) | Out-Null
                Write-Host "     Inserted: $short" -ForegroundColor Green
                $added++
            } catch {
                $short2 = if ($item.Title.Length -gt 40) { $item.Title.Substring(0,40) } else { $item.Title }
                Write-Fail "FAILED: $short2 -> $($_.Exception.Message)"
                $failed++
            }
        }
    }

    Write-Progress -Activity "Importing $ListName" -Completed
    Write-OK "Done: Added=$added  Skipped=$skipped  Failed=$failed"
    return @{ Added=$added; Skipped=$skipped; Failed=$failed }
}

# ============================================================
# LIST SCHEMAS
# ============================================================

$Cols_AppAdmins = @(
    @{ Name="UserEmail";    Type="Text";    Required=$true;  Default=""; Choices=@() }
    @{ Name="DisplayName";  Type="Text";    Required=$false; Default=""; Choices=@() }
    @{ Name="Role";         Type="Choice";  Required=$true;  Default="IT Admin"
       Choices=@("IT Admin","Super Admin","Read-Only Admin") }
    @{ Name="IsActive";     Type="Boolean"; Required=$false; Default=""; Choices=@() }
    @{ Name="Department";   Type="Text";    Required=$false; Default=""; Choices=@() }
)

$Cols_AssetCatalogue = @(
    @{ Name="Category";     Type="Choice";  Required=$true;  Default="Laptop"
       Choices=@("Laptop","Desktop","Monitor","Keyboard","Mouse","Headset","Docking Station","Mobile Phone","Tablet","Other") }
    @{ Name="Description";  Type="Note";    Required=$false; Default=""; Choices=@() }
    @{ Name="StockQty";     Type="Number";  Required=$true;  Default=""; Choices=@() }
    @{ Name="Status";       Type="Choice";  Required=$true;  Default="Active"
       Choices=@("Active","Out of Stock","Retired") }
    @{ Name="ImageURL";     Type="URL";     Required=$false; Default=""; Choices=@() }
    @{ Name="AvgLifeYears"; Type="Number";  Required=$false; Default=""; Choices=@() }
    @{ Name="UnitCost";     Type="Currency";Required=$false; Default=""; Choices=@() }
)

$Cols_AssetRequests = @(
    @{ Name="RequestedBy";      Type="User";     Required=$false; Default=""; Choices=@() }
    @{ Name="RequestedByEmail"; Type="Text";     Required=$true;  Default=""; Choices=@() }
    @{ Name="AssetType";        Type="Text";     Required=$true;  Default=""; Choices=@() }
    @{ Name="AssetCategory";    Type="Choice";   Required=$false; Default="Laptop"
       Choices=@("Laptop","Desktop","Monitor","Keyboard","Mouse","Headset","Docking Station","Mobile Phone","Tablet","Other") }
    @{ Name="Quantity";         Type="Number";   Required=$true;  Default=""; Choices=@() }
    @{ Name="Justification";    Type="Note";     Required=$true;  Default=""; Choices=@() }
    @{ Name="Urgency";          Type="Choice";   Required=$true;  Default="Medium"
       Choices=@("Low","Medium","High","Critical") }
    @{ Name="Status";           Type="Choice";   Required=$true;  Default="Pending"
       Choices=@("Pending","Approved","Denied","Cancelled") }
    @{ Name="ApprovedBy";       Type="User";     Required=$false; Default=""; Choices=@() }
    @{ Name="ApprovedByEmail";  Type="Text";     Required=$false; Default=""; Choices=@() }
    @{ Name="ITNotes";          Type="Note";     Required=$false; Default=""; Choices=@() }
    @{ Name="NeededByDate";     Type="DateTime"; Required=$false; Default=""; Choices=@() }
    @{ Name="ExpectedDelivery"; Type="DateTime"; Required=$false; Default=""; Choices=@() }
    @{ Name="SubmittedDate";    Type="DateTime"; Required=$true;  Default=""; Choices=@() }
    @{ Name="DelegatedTo";      Type="Text";     Required=$false; Default=""; Choices=@() }
)

$Cols_AssetAssignments = @(
    @{ Name="AssetName";        Type="Text";     Required=$true;  Default=""; Choices=@() }
    @{ Name="AssetCategory";    Type="Choice";   Required=$false; Default="Laptop"
       Choices=@("Laptop","Desktop","Monitor","Keyboard","Mouse","Headset","Docking Station","Mobile Phone","Tablet","Other") }
    @{ Name="AssignedTo";       Type="User";     Required=$false; Default=""; Choices=@() }
    @{ Name="AssignedToEmail";  Type="Text";     Required=$true;  Default=""; Choices=@() }
    @{ Name="SerialNumber";     Type="Text";     Required=$false; Default=""; Choices=@() }
    @{ Name="AssetTag";         Type="Text";     Required=$false; Default=""; Choices=@() }
    @{ Name="AssignedDate";     Type="DateTime"; Required=$true;  Default=""; Choices=@() }
    @{ Name="Status";           Type="Choice";   Required=$true;  Default="Active"
       Choices=@("Active","Returned","Lost","Damaged") }
    @{ Name="WarrantyExpiry";   Type="DateTime"; Required=$false; Default=""; Choices=@() }
    @{ Name="SourceRequestID";  Type="Text";     Required=$false; Default=""; Choices=@() }
    @{ Name="LastAttestedDate"; Type="DateTime"; Required=$false; Default=""; Choices=@() }
    @{ Name="AttestedThisCycle";Type="Boolean";  Required=$false; Default=""; Choices=@() }
    @{ Name="Notes";            Type="Note";     Required=$false; Default=""; Choices=@() }
)

$Cols_Attestations = @(
    @{ Name="AssignmentID";  Type="Text";     Required=$true;  Default=""; Choices=@() }
    @{ Name="AttestBy";      Type="User";     Required=$false; Default=""; Choices=@() }
    @{ Name="AttestByEmail"; Type="Text";     Required=$true;  Default=""; Choices=@() }
    @{ Name="AttestDate";    Type="DateTime"; Required=$true;  Default=""; Choices=@() }
    @{ Name="Confirmed";     Type="Boolean";  Required=$false; Default=""; Choices=@() }
    @{ Name="Condition";     Type="Choice";   Required=$true;  Default="Good"
       Choices=@("Good","Minor Wear","Damaged","Missing","Lost") }
    @{ Name="Comments";      Type="Note";     Required=$false; Default=""; Choices=@() }
    @{ Name="CycleYear";     Type="Text";     Required=$true;  Default=""; Choices=@() }
    @{ Name="ITReviewed";    Type="Boolean";  Required=$false; Default=""; Choices=@() }
    @{ Name="ITComment";     Type="Note";     Required=$false; Default=""; Choices=@() }
)

$Cols_Notifications = @(
    @{ Name="Recipient";      Type="User";     Required=$false; Default=""; Choices=@() }
    @{ Name="RecipientEmail"; Type="Text";     Required=$true;  Default=""; Choices=@() }
    @{ Name="Message";        Type="Note";     Required=$true;  Default=""; Choices=@() }
    @{ Name="NotifType";      Type="Choice";   Required=$true;  Default="Request"
       Choices=@("Request","Assignment","Attestation","Announcement") }
    @{ Name="IsRead";         Type="Boolean";  Required=$false; Default=""; Choices=@() }
    @{ Name="CreatedDate";    Type="DateTime"; Required=$true;  Default=""; Choices=@() }
    @{ Name="RelatedItemID";  Type="Text";     Required=$false; Default=""; Choices=@() }
)

$Cols_UserSettings = @(
    @{ Name="Theme";          Type="Text";     Required=$true;  Default="azure"; Choices=@() }
    @{ Name="Mode";           Type="Text";     Required=$true;  Default="light"; Choices=@() }
    @{ Name="UserEmail";      Type="Text";     Required=$true;  Default=""; Choices=@() }
)

# ============================================================
# HELPER — Parse CSV files (skipping schema definition line)
# ============================================================
function Get-CsvData {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) {
        Write-Warn "CSV file not found: $FilePath"
        return @()
    }
    $lines = Get-Content $FilePath
    if ($lines.Count -le 1) {
        return @()
    }
    if ($lines[0] -like "ListSchema=*") {
        # Skip the first line and parse the rest
        $csvContent = $lines[1..($lines.Count - 1)] -join "`n"
        $data = ConvertFrom-Csv -InputObject $csvContent
    } else {
        $data = Import-Csv -Path $FilePath
    }
    return [array]$data
}

# ============================================================
# PLACEHOLDER EMAIL MAP
# Maps contoso.com placeholder emails in CSV files to actual tenant UPNs
# ============================================================
$EmailMap = @{
    "itadmin@contoso.com"      = $U_SuperAdmin
    "helpdesk@contoso.com"     = $U_ITAdmin
    "itreports@contoso.com"    = $U_ReadOnly
    "john.smith@contoso.com"   = $U_User1
    "sarah.tan@contoso.com"    = $U_User2
    "mike.lee@contoso.com"     = $U_User3
    "robert.green@contoso.com" = $U_User4
    "emily.brown@contoso.com"  = $U_User5
}

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Load data dynamically from CSV files in the same directory
$Data_AppAdmins        = Get-CsvData (Join-Path $PSScriptRoot "AppAdmins.csv")
$Data_AssetCatalogue   = Get-CsvData (Join-Path $PSScriptRoot "AssetCatalogue.csv")
$Data_AssetRequests    = Get-CsvData (Join-Path $PSScriptRoot "AssetRequests.csv")
$Data_AssetAssignments  = Get-CsvData (Join-Path $PSScriptRoot "AssetAssignments.csv")
$Data_Attestations     = Get-CsvData (Join-Path $PSScriptRoot "Attestations.csv")
$Data_Notifications    = Get-CsvData (Join-Path $PSScriptRoot "Notifications.csv")
$Data_UserSettings     = Get-CsvData (Join-Path $PSScriptRoot "UserSettings.csv")

# ============================================================
# MAIN EXECUTION
# ============================================================

Write-Banner "Asset Management — List Provisioning v$ScriptVersion"
Write-Host "  Site    : $SiteUrl"  -ForegroundColor White
Write-Host "  WhatIf  : $($WhatIfPreference)" -ForegroundColor White
Write-Host "  Started : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

# ---------- Pre-flight ----------
$preflightOk = Invoke-PreflightChecks -Url $SiteUrl
if (-not $preflightOk) {
    Write-Host ""
    Write-Fail "One or more pre-flight checks failed. Fix the issues above and re-run."
    exit 1
}

Write-Host ""
Write-Host "  Pre-flight passed. Proceeding with deployment..." -ForegroundColor Green

# ---------- Connect ----------
Write-Banner "Connecting to SharePoint"
try {
    Connect-PnPOnline -Url $SiteUrl -UseWebLogin
    Write-OK "Connected to: $SiteUrl"
    try {
        $siteInfo = Get-PnPSite -Includes Title
        Write-OK "Site title  : $($siteInfo.Title)"
    } catch {
        Write-OK "Connected successfully (site title unavailable)"
    }
} catch {
    Write-Fail "Connection failed: $($_.Exception.Message)"
    exit 1
}

# ---------- Provision Lists ----------
Write-Banner "Provisioning Lists"

try { New-AssetList -ListName "AppAdmins"       -Cols $Cols_AppAdmins        } catch { Write-Fail "AppAdmins: $_"        }
try { New-AssetList -ListName "AssetCatalogue"   -Cols $Cols_AssetCatalogue   } catch { Write-Fail "AssetCatalogue: $_"   }
try { New-AssetList -ListName "AssetRequests"    -Cols $Cols_AssetRequests    } catch { Write-Fail "AssetRequests: $_"    }
try { New-AssetList -ListName "AssetAssignments" -Cols $Cols_AssetAssignments } catch { Write-Fail "AssetAssignments: $_" }
try { New-AssetList -ListName "Attestations"     -Cols $Cols_Attestations     } catch { Write-Fail "Attestations: $_"     }
try { New-AssetList -ListName "Notifications"    -Cols $Cols_Notifications    } catch { Write-Fail "Notifications: $_"    }
try { New-AssetList -ListName "UserSettings"     -Cols $Cols_UserSettings     } catch { Write-Fail "UserSettings: $_"     }

# ---------- Update Default Views ----------
Write-Banner "Updating Default Views"

Update-DefaultView -ListName "AppAdmins" -Fields @(
    "Title","UserEmail","DisplayName","Role","IsActive","Department"
)

Update-DefaultView -ListName "AssetCatalogue" -Fields @(
    "Title","Category","Description","StockQty","Status","ImageURL","AvgLifeYears","UnitCost"
)

Update-DefaultView -ListName "AssetRequests" -Fields @(
    "Title","RequestedBy","RequestedByEmail","AssetType","AssetCategory","Quantity",
    "Urgency","Status","ApprovedBy","ApprovedByEmail","ITNotes","SubmittedDate","ExpectedDelivery"
)

Update-DefaultView -ListName "AssetAssignments" -Fields @(
    "Title","AssetName","AssetCategory","AssignedTo","AssignedToEmail","SerialNumber",
    "AssetTag","AssignedDate","Status","WarrantyExpiry","SourceRequestID",
    "LastAttestedDate","AttestedThisCycle"
)

Update-DefaultView -ListName "Attestations" -Fields @(
    "Title","AssignmentID","AttestBy","AttestByEmail","AttestDate","Confirmed",
    "Condition","Comments","CycleYear","ITReviewed","ITComment"
)

Update-DefaultView -ListName "Notifications" -Fields @(
    "Title","Recipient","RecipientEmail","Message","NotifType","IsRead","CreatedDate","RelatedItemID"
)

Update-DefaultView -ListName "UserSettings" -Fields @(
    "Title","Theme","Mode","UserEmail"
)

# ---------- Import Data ----------
Write-Banner "Importing Test Data"

$totalAdded=0; $totalSkipped=0; $totalFailed=0

$importJobs = @(
    @{ List="AppAdmins";        Data=$Data_AppAdmins        }
    @{ List="AssetCatalogue";   Data=$Data_AssetCatalogue   }
    @{ List="AssetRequests";    Data=$Data_AssetRequests    }
    @{ List="AssetAssignments"; Data=$Data_AssetAssignments }
    @{ List="Attestations";     Data=$Data_Attestations     }
    @{ List="Notifications";    Data=$Data_Notifications    }
    @{ List="UserSettings";     Data=$Data_UserSettings     }
)

foreach ($job in $importJobs) {
    try {
        $result = Import-AssetItems -ListName $job.List -Items $job.Data
        $totalAdded   += $result.Added
        $totalSkipped += $result.Skipped
        $totalFailed  += $result.Failed
    } catch {
        Write-Fail "Import error for $($job.List): $($_.Exception.Message)"
    }
}

# ---------- Disconnect ----------
try { Disconnect-PnPOnline; Write-OK "Disconnected cleanly" } catch { }

# ---------- Summary ----------
Write-Banner "Deployment Summary"

foreach ($job in $importJobs) {
    Write-Host ("  {0,-25} {1} items" -f $job.List, $job.Data.Count) -ForegroundColor White
}

Write-Host ""
Write-Host "  Total added   : $totalAdded"   -ForegroundColor Green
Write-Host "  Total skipped : $totalSkipped" -ForegroundColor Yellow
Write-Host "  Total failed  : $totalFailed"  -ForegroundColor $(if($totalFailed -gt 0){"Red"}else{"Green"})
Write-Host ""
Write-Host "  Expected dashboard KPI values:" -ForegroundColor Cyan
Write-Host "    Total Assets        : 10" -ForegroundColor White
Write-Host "    Pending Requests    : 5  (REQ-002,004,005,006,008)" -ForegroundColor White
Write-Host "    Approved This Month : 2  (REQ-001,007 - June 2026)" -ForegroundColor White
Write-Host "    Overdue Attestation : 5  (ASGN-001,004,005,006,007)" -ForegroundColor White
Write-Host ""
Write-Host "  NOTE: Person columns (RequestedBy, ApprovedBy, AssignedTo," -ForegroundColor Yellow
Write-Host "  AttestBy) must be filled manually in each list after import." -ForegroundColor Yellow
Write-Host "  Open each list, Edit in grid view, click each Person cell." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open $SiteUrl and verify all 6 lists" -ForegroundColor White
Write-Host "  2. Fill Person columns manually in each list" -ForegroundColor White
Write-Host "  3. Power Apps: Data panel -> refresh all 6 lists" -ForegroundColor White
Write-Host "  4. Tree View -> App -> Run OnStart" -ForegroundColor White
Write-Host "  5. Press F5 and verify dashboard KPIs" -ForegroundColor White
Write-Host ""
Write-Host "  Finished at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""