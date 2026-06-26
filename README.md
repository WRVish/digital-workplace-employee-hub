<div align="center">
  <h1>🚀 Digital Workplace Intranet (Power Apps Code App)</h1>
  <p><b>A modern, enterprise-grade Employee Portal & Intranet Hub built on Microsoft Power Platform (Code Apps), React, TypeScript, and SharePoint Online.</b></p>
</div>

---

## 🌟 Overview

The **Digital Workplace Intranet** is a comprehensive, centralized employee portal designed to streamline internal operations. Built as a **Power Apps Code App**, it brings the speed and modern UI of a React SPA (Single Page Application) natively into the Microsoft 365 ecosystem. 

This repository serves as a boilerplate and fully functional reference architecture for building advanced Code Apps that utilize **SharePoint Online (SPO)** as a backend data source, while maintaining strict, app-managed Role-Based Access Control (RBAC).

**Keywords (SEO & GEO):**
*Power Apps Code App, Power Platform, Microsoft 365 Intranet, SharePoint Online (SPO) Portal, React JS, TypeScript, Vite, SPFx Alternative, Enterprise Portal, Employee Hub, HR Management, Leave Request App, IT Incident Management, Expense Claims, Travel Requests, Asset Management, Microsoft Entra ID. Deployed globally for teams in USA, UK, India, Singapore, and remote workforces.*

---

## ✨ Features

This intranet application includes 8 fully integrated modules out-of-the-box:

1. **🧑‍💼 Employee Management**: Central directory and profile management.
2. **🎫 Incident & Service Requests**: IT & HR helpdesk ticketing system.
3. **🏖️ Leave Management**: Request time off, check balances, and manager approvals.
4. **📅 Company Holidays**: Global and regional holiday calendar tracking.
5. **🎉 Company Events**: Virtual and in-person corporate event scheduling.
6. **💰 Expense Claims**: Submit expenses for manager and finance processing.
7. **✈️ Travel Requests**: Pre-approval workflows for corporate travel.
8. **💻 Asset & Inventory Management**: IT asset assignment and lifecycle tracking.

**Key Technical Features:**
- **Custom RBAC**: Roles (Employee, HR Admin, IT Admin, Finance, Manager, System Admin) are managed directly via a SharePoint List, bypassing the delay of Entra ID directory syncs.
- **Dynamic Theming**: Built-in support for Light/Dark mode and dynamic color schemes (Ocean Blue, Emerald, Royal, Midnight) saved via user preferences.
- **Zero Linting Errors**: Codebase adheres to strict SonarLint and TypeScript standards for cognitive complexity and web accessibility (WCAG).

---

## 🛠️ Toolchain

This project leverages a modern web development toolchain combined with the Power Platform ecosystem:
- **Frontend Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **UI Icons**: [Lucide React](https://lucide.dev/)
- **Microsoft SDK**: `@microsoft/power-apps` (Enables native Code App integration)
- **Backend Data Storage**: Microsoft SharePoint Online (SPO) Lists
- **Automation (Optional)**: Power Automate (for email notifications/flows)

---

## 💳 Licensing Requirements

> [!IMPORTANT]
> **Power Apps Premium License Required**
> Because this application is built using the **Power Apps Code App** architecture, it utilizes premium capabilities. 
> - The **developer/maker** creating the app requires a Premium License.
> - **Every end-user** who accesses this application in your tenant must also be assigned a **Power Apps Premium License** (Per User or Per App plan).

---

## 📋 List Requirements & Setup

The backend of this application relies on a specific relational SharePoint List schema (10 lists total). You can provision these lists in your tenant using one of two methods:

### Method 1: Automated PowerShell Script (Recommended)
We have provided a fully automated provisioning script (`Deploy-IntranetApp.ps1`) utilizing PnP PowerShell.
1. Install PnP PowerShell: `Install-Module -Name PnP.PowerShell`
2. Open PowerShell and run the script:
   ```powershell
   ./Deploy-IntranetApp.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/YourIntranetSite"
   ```
3. The script will automatically create all lists, define column types, configure lookups, and optionally inject dummy test data.

### Method 2: Manual / CSV Import
If you prefer not to use PowerShell, you can manually create the lists using the schema references provided in the `SPO-Schema/` folder.
1. Navigate to your SharePoint Site -> Site Contents -> **New List**.
2. Select **Create from CSV**.
3. Upload the respective CSV files located in the `SPO-Schema/` directory to generate the lists and base columns.
4. *Note: You will need to manually configure the `Lookup` and `Person/Group` columns afterward, as CSV imports default to Single Line of Text.*

---

## 🚀 Deployment: Using this Repo in Your Own Tenant

If you have forked or cloned this repository and wish to deploy it to your own Microsoft 365 tenant, you must make the following configuration changes:

1. **Update PowerShell Script Users**: 
   Before running `Deploy-IntranetApp.ps1`, open the script and update the `$U_SuperAdmin`, `$U_ITAdmin`, and `$U_UserX` variables at the top of the file to match valid **UPNs (Email Addresses)** that exist in your specific Entra ID directory.
2. **Update App Configuration & Connection References**:
   Check the `digital-workplace-app/power.config.json` file. Ensure that any environment-specific endpoints, connector IDs, or workspace references align with your Dataverse environment.
   - When importing the solution into your own environment, you will be prompted to map the **Connection References** (e.g., SharePoint connector) to a valid connection authenticated with appropriate permissions in your tenant. Failure to do so will result in data fetching errors.
3. **Run the App Locally**:
   ```bash
   cd digital-workplace-app
   npm install
   npx power-apps run
   ```
4. **Deploy to Power Platform**:
   Use the Power Platform CLI to pack and deploy your Code App to your environment.
   ```bash
   npx power-apps pack
   pac pcf push
   ```
   *(Note: Adjust deployment commands based on the latest Code App CLI guidelines).*

---

## ❓ Frequently Asked Questions (FAQ)

**Q: Do I need to sync Microsoft Entra ID groups for app roles?**
A: No. The application employs an app-managed Role-Based Access Control (RBAC) model. Roles are assigned immediately by managing the `AppRoles` SharePoint List, entirely skipping Entra ID sync delays.

**Q: I imported the Code App but I cannot see any data. What's wrong?**
A: This usually happens for two reasons:
1. Your **Connection Reference** for SharePoint was not mapped properly during import or the identity lacks permission to access the lists.
2. The SharePoint List names or Site URLs hardcoded in `dataService.ts` or environment variables do not perfectly match the ones you provisioned.

**Q: Can I customize the theme or color scheme to match my company's branding?**
A: Yes! The app includes dynamic CSS variables. You can easily add new themes or modify the existing "Ocean Blue", "Emerald", "Royal", or "Midnight" color tokens directly in `index.css`.

**Q: Does this app work on mobile devices?**
A: Yes. The frontend is built using React and is fully responsive for tablets and mobile devices, including a collapsible sidebar and touch-friendly UI elements.

---

<div align="center">
  <i>Designed for modern digital workplaces. Built with ❤️ for the Power Platform community.</i>
</div>