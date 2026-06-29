# Digital Workplace Employee Hub

Welcome to the Digital Workplace Employee Hub project repository! This repository contains the source code for a comprehensive, modern employee portal designed to centralize and streamline core workplace activities. 

## Project Overview

This repository is split into two primary applications, both aimed at providing a seamless, robust, and beautiful experience for employees to manage their daily work-life:

1. **Power Apps Code App** (`/digital-workplace-employee-hub/`)
2. **SharePoint Framework (SPFx) Web Part** (`/digital-workplace-employee-hub-spfx/`)

Both applications share a common design language, emphasizing modern aesthetics (glassmorphism, clean typography, responsive grids) and dark mode support, but are tailored for different deployment environments within the Microsoft 365 ecosystem.

---

### 1. Power Apps Code App
**Location:** `/digital-workplace-employee-hub/`

This is a standalone web application originally designed to be embedded within a Power App or used as a standard React SPA. It leverages modern React, Vite, and custom CSS to deliver a highly interactive experience.

**Key Highlights:**
- **Technology:** React, TypeScript, Vite, Vanilla CSS.
- **Purpose:** Standalone portal or embeddable SPA for Employee Services.
- **Features:** User Management, Leave Administration, Asset Management, Expense & Travel Management, Ticketing.

[Read the full Power App documentation here](./digital-workplace-employee-hub/README.md)

---

### 2. SPFx Web Part
**Location:** `/digital-workplace-employee-hub-spfx/`

This is a native SharePoint Framework (SPFx) Web Part designed to run directly inside modern SharePoint pages. It provides the same rich feature set as the standalone app but is deeply integrated into the SharePoint ecosystem, utilizing SharePoint lists for data storage and the SPHttpClient for API interactions.

**Key Highlights:**
- **Technology:** React, TypeScript, SPFx toolchain (Gulp, Webpack), Vanilla CSS.
- **Purpose:** Intranet web part for native SharePoint integration.
- **Features:** Role-based access control, Leave Management, Asset Management, Real-time SharePoint List integration.

[Read the full SPFx documentation here](./digital-workplace-employee-hub-spfx/README.md)

---

## Shared Architecture & Design

Both applications adhere to a unified design philosophy:
- **CSS Variables:** Extensive use of CSS custom properties for theming (Light/Dark mode) and easy color palette customization.
- **Component Reusability:** Core UI elements (Buttons, Inputs, Modals, Cards, Avatars) are designed from scratch for maximum flexibility without heavy third-party UI library bloat.
- **Role-based Rendering:** Both apps dynamically render navigation and pages based on user roles (e.g., HR Admin, IT Admin, Manager, Employee).

## Getting Started

To get started with either application, navigate to their respective directories and follow the setup instructions in their README files.

- [Power Apps Code App Setup](./digital-workplace-employee-hub/README.md#getting-started)
- [SPFx Web Part Setup](./digital-workplace-employee-hub-spfx/README.md#getting-started)