export interface NavItem {
  s?: string; // Section header
  id?: string;
  l?: string; // Label
  ic?: string; // Icon key
  col?: string; // Color
  b?: string; // Badge
}

export const navConfig: Record<string, NavItem[]> = {
  sysadmin:[
    {s:'Workspace'},{id:'dashboard',l:'Dashboard',ic:'dash',col:'var(--brand-600)'},
    {s:'My Space'},
    {id:'myprofile',l:'My Profile',ic:'user',col:'var(--c-employee)'},
    {id:'myleave',l:'My Leave',ic:'cal',col:'var(--c-leave)'},
    {id:'mytickets',l:'My Tickets',ic:'warn',col:'var(--c-incident)'},
    {id:'myexpenses',l:'My Expenses',ic:'card',col:'var(--c-expense)'},
    {id:'mytravel',l:'My Travel',ic:'plane',col:'var(--c-travel)'},

    {s:'Admin — People'},
    {id:'employees',l:'User Management',ic:'people',col:'var(--c-employee)'},
    {id:'leaves',l:'Leave Admin',ic:'cal',col:'var(--c-leave)'},
    {s:'Admin — Operations'},
    {id:'incidents',l:'Incident Mgmt',ic:'warn',col:'var(--c-incident)'},
    {id:'expenses',l:'Expense Admin',ic:'card',col:'var(--c-expense)'},
    {id:'travels',l:'Travel Admin',ic:'plane',col:'var(--c-travel)'},
    {id:'assets',l:'Asset Mgmt',ic:'screen',col:'var(--c-asset)'},
    {id:'events',l:'Events',ic:'clock',col:'var(--c-events)'},
    {s:'System'}
  ],
  itadmin:[
    {s:'Workspace'},{id:'dashboard',l:'Dashboard',ic:'dash',col:'var(--brand-600)'},
    {s:'My Space'},
    {id:'myprofile',l:'My Profile',ic:'user',col:'var(--c-employee)'},
    {id:'myleave',l:'My Leave',ic:'cal',col:'var(--c-leave)'},
    {id:'mytickets',l:'My Tickets',ic:'warn',col:'var(--c-incident)'},
    {id:'myexpenses',l:'My Expenses',ic:'card',col:'var(--c-expense)'},
    {id:'mytravel',l:'My Travel',ic:'plane',col:'var(--c-travel)'},

    {s:'IT Admin'},
    {id:'incidents',l:'Incident Mgmt',ic:'warn',col:'var(--c-incident)'},
    {id:'assets',l:'Asset Mgmt',ic:'screen',col:'var(--c-asset)'},
    {id:'events',l:'Events',ic:'clock',col:'var(--c-events)'}
  ],
  hradmin:[
    {s:'Workspace'},{id:'dashboard',l:'Dashboard',ic:'dash',col:'var(--brand-600)'},
    {s:'My Space'},
    {id:'myprofile',l:'My Profile',ic:'user',col:'var(--c-employee)'},
    {id:'myleave',l:'My Leave',ic:'cal',col:'var(--c-leave)'},
    {id:'mytickets',l:'My Tickets',ic:'warn',col:'var(--c-incident)'},
    {id:'myexpenses',l:'My Expenses',ic:'card',col:'var(--c-expense)'},
    {id:'mytravel',l:'My Travel',ic:'plane',col:'var(--c-travel)'},
    {s:'HR Admin'},
    {id:'employees',l:'User Management',ic:'people',col:'var(--c-employee)'},
    {id:'leaves',l:'Leave Admin',ic:'cal',col:'var(--c-leave)'},
    {id:'incidents',l:'HR Tickets',ic:'warn',col:'var(--c-incident)'},
    {id:'events',l:'Events & Holidays',ic:'clock',col:'var(--c-events)'}
  ],
  finance:[
    {s:'Workspace'},{id:'dashboard',l:'Dashboard',ic:'dash',col:'var(--brand-600)'},
    {s:'My Space'},
    {id:'myprofile',l:'My Profile',ic:'user',col:'var(--c-employee)'},
    {id:'myleave',l:'My Leave',ic:'cal',col:'var(--c-leave)'},
    {id:'mytickets',l:'My Tickets',ic:'warn',col:'var(--c-incident)'},
    {id:'myexpenses',l:'My Expenses',ic:'card',col:'var(--c-expense)'},
    {id:'mytravel',l:'My Travel',ic:'plane',col:'var(--c-travel)'},
    {s:'Finance Admin'},
    {id:'expenses',l:'Expense Admin',ic:'card',col:'var(--c-expense)'},
    {id:'travels',l:'Travel Admin',ic:'plane',col:'var(--c-travel)'},
    {id:'events',l:'Events',ic:'clock',col:'var(--c-events)'}
  ],
  manager:[
    {s:'Workspace'},{id:'dashboard',l:'Dashboard',ic:'dash',col:'var(--brand-600)'},
    {s:'My Space'},
    {id:'myprofile',l:'My Profile',ic:'user',col:'var(--c-employee)'},
    {id:'myleave',l:'My Leave',ic:'cal',col:'var(--c-leave)'},
    {id:'mytickets',l:'My Tickets',ic:'warn',col:'var(--c-incident)'},
    {id:'myexpenses',l:'My Expenses',ic:'card',col:'var(--c-expense)'},
    {id:'mytravel',l:'My Travel',ic:'plane',col:'var(--c-travel)'},

    {s:'Team Management'},
    {id:'leaves',l:'Team Leave',ic:'cal',col:'var(--c-leave)'},
    {id:'expenses',l:'Team Expenses',ic:'card',col:'var(--c-expense)'},
    {id:'travels',l:'Team Travel',ic:'plane',col:'var(--c-travel)'},
    {id:'events',l:'Events',ic:'clock',col:'var(--c-events)'}
  ],
  employee:[
    {s:'Workspace'},{id:'dashboard',l:'Dashboard',ic:'dash',col:'var(--brand-600)'},
    {s:'My Space'},
    {id:'myprofile',l:'My Profile',ic:'user',col:'var(--c-employee)'},
    {id:'myleave',l:'My Leave',ic:'cal',col:'var(--c-leave)'},
    {id:'mytickets',l:'My Tickets',ic:'warn',col:'var(--c-incident)'},
    {id:'myexpenses',l:'My Expenses',ic:'card',col:'var(--c-expense)'},
    {id:'mytravel',l:'My Travel',ic:'plane',col:'var(--c-travel)'},

    {id:'events',l:'Events',ic:'clock',col:'var(--c-events)'}
  ]
};
