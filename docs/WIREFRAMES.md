# GymGaze Screen Specifications & Wireframes

## Layout Conventions
- **Mobile (320px)**: Single column, full-width cards
- **Tablet (768px)**: 2-column grid, sidebar navigation
- **Desktop (1024px+)**: Multi-column layouts, data-dense views
- **Admin**: Dark theme, sidebar navigation, compact spacing
- **Partner**: Dark theme, top navigation, generous spacing

---

## 1. Admin Dashboard

### Desktop Layout (1440px)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] GymGaze Admin                    [Search] [User]   │
├────┬───────────────────────────────────────────────────────┤
│Nav │ Dashboard                                      [⚙️]   │
│    ├───────────────────────────────────────────────────────┤
│    │ [Net Revenue MTD        ] [Active Venues   ]         │
│    │ [R123,456              ] [42              ]         │
│    │ ▲ +12%                   ▲ +3              ]         │
│    │                                                       │
│    │ [Active Campaigns      ] [Total Networks  ]         │
│    │ [156                   ] [8                ]         │
│    │ ▲ +23%                   → 0                 ]         │
│    ├───────────────────────────────────────────────────────┤
│    │ Recent Activity                           [View All] │
│    │ ┌───────────────────────────────────────────────────┐ │
│    │ │ Time  │ Venue          │ Action      │ User     │ │
│    │ ├───────────────────────────────────────────────────┤ │
│    │ │ 2:30  │ Edge Randburg  │ Photo upload│ S. Molefe│ │
│    │ │ 1:15  │ Virgin CT      │ Revenue upd │ J. Smith │ │
│    │ │ 0:45  │ Planet JHB     │ Campaign add│ A. Jones │ │
│    │ └───────────────────────────────────────────────────┘ │
└────┴───────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────┐
│ [Menu] Dashboard        │
├─────────────────────────┤
│ Net Revenue MTD         │
│ R123,456 ▲ +12%         │
├─────────────────────────┤
│ Active Venues: 42       │
│ Active Campaigns: 156   │
│ Total Networks: 8       │
├─────────────────────────┤
│ Recent Activity         │
│ S. Molefe - Edge Randb. │
│ Photo upload • 2h ago   │
│ ─────────────────────── │
│ J. Smith - Virgin CT    │
│ Revenue update • 1h ago │
└─────────────────────────┘
```

### Components
- **Stat Cards**: Gradient background, large numbers, trend indicators
- **Activity Feed**: Time, venue, action, user columns
- **Quick Actions**: Revenue entry, venue approval shortcuts

---

## 2. Gym Networks List

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Networks                                      [+ Add New]  │
├─────────────────────────────────────────────────────────────┤
│ ┌───┬──────────────┬──────┬──────┬────────┬─────────────┐ │
│ │ # │ Network Name │Venues│Status│ Revenue│ Last Updated│ │
│ ├───┼──────────────┼──────┼──────┼────────┼─────────────┤ │
│ │ 1 │ Edge Gyms     │ 12   │Active│ R45,890│ 2 hours ago │ │
│ │ 2 │ Virgin Active │ 8    │Active│ R67,340│ 1 day ago   │ │
│ │ 3 │ Planet Fitnes│ 15   │Active│ R89,120│ 3 hours ago │ │
│ │ 4 │ Curves        │ 6    │Active│ R23,450│ 1 week ago  │ │
│ └───┴──────────────┴──────┴──────┴────────┴─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Components
- **Data Table**: Sortable columns, status badges, action dropdown
- **Search/Filter**: Network name, status, venue count range
- **Bulk Actions**: Activate/deactivate multiple networks

---

## 3. Single Network Page

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Edge Gyms                                        [Back]    │
│ Network Overview                                           │
├─────────────────────────────────────────────────────────────┤
│ [Network Revenue MTD ] [Active Venues ] [Total Screens]   │
│ [R45,890            ] [12          ] [156          ]      │
│ ▲ +8%                ▲ +1           ▲ +5             │
├─────────────────────────────────────────────────────────────┤
│ Venues                                      [+ Add Venue]  │
│ ┌───┬─────────────┬──────────┬──────┬─────────┬─────────┐ │
│ │ # │ Venue Name  │ Location │Screens│ Revenue │ Status  │ │
│ ├───┼─────────────┼──────────┼──────┼─────────┼─────────┤ │
│ │ 1 │ Randburg    │ JHB      │ 12    │ R12,450 │Active  │ │
│ │ 2 │ Sandton     │ JHB      │ 18    │ R18,230 │Active  │ │
│ │ 3 │ Fourways    │ JHB      │ 8     │ R8,900  │Pending │ │
│ └───┴─────────────┴──────────┴──────┴─────────┴─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Components
- **Network Stats**: Revenue, venues, screens with trend indicators
- **Venues Table**: List of all venues in network with key metrics
- **Quick Actions**: Add venue, edit network details

---

## 4. Venue Profile

### Desktop Layout (Tabs)
```
┌─────────────────────────────────────────────────────────────┐
│ Edge Randburg                                    [Back]    │
│ [Details] [Photos] [Screens] [Revenue] [Contract]         │
├─────────────────────────────────────────────────────────────┤
│ Venue Details                                      [Edit]  │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Name: Edge Randburg                                 │ │
│ │ Address: 123 Republic Rd, Randburg, 2194           │ │
│ │ Manager: Sarah Molefe                               │ │
│ │ Phone: 082-555-1234                                 │ │
│ │ Email: sarah@edgegym.co.za                          │ │
│ │ Membership: 2,847 active members                     │ │
│ │ Operating Hours: 05:00-22:00 Mon-Sun                │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                           │
│ Venue Statistics                                          │
│ [Revenue MTD: R12,450] [Screens: 12] [Members: 2,847]   │
│ [Revenue YTD: R145,890] [Cameras: 24] [Peak Hrs: 18-20]  │
│                                                           │
│ Recent Photos                                [View All]   │
│ [img] [img] [img] [img] [img] [img]                     │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────┐
│ Edge Randburg           │
│ [Menu] [Edit]           │
├─────────────────────────┤
│ Revenue MTD             │
│ R12,450                │
│ Screens: 12 | Members:  │
│ 2,847                  │
├─────────────────────────┤
│ Manager: S. Molefe     │
│ Phone: 082-555-1234    │
│ Hours: 5AM-10PM Daily  │
├─────────────────────────┤
│ Recent Photos           │
│ [img] [img] [img]     │
└─────────────────────────┘
```

---

## 5. Add/Edit Venue Form

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Add New Venue                                    [Cancel]  │
├─────────────────────────────────────────────────────────────┤
│ Basic Information                                          │
│ Venue Name: [Edge Randburg                    *required*]  │
│ Network:    [Edge Gyms         ▼]                        │
│ Address:    [123 Republic Rd                 *required*]  │
│ City:       [Randburg                        *required*]  │
│ Province:   [Gauteng          ▼]                          │
│ Postal Code: [2194                           *required*]  │
│                                                           │
│ Contact Details                                            │
│ Manager:    [Sarah Molefe                     *required*]  │
│ Phone:      [082-555-1234                    *required*]  │
│ Email:      [sarah@edgegym.co.za             *required*]  │
│                                                           │
│ Venue Specifications                                       │
│ Members:    [2847                            *required*]  │
│ Operating Hours: [05:00-22:00                *required*]  │
│ Gym Size:   [1500-3000 sqm    ▼]                        │
│                                                           │
│ [Save Venue]                    [Save & Add Another]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Screen Inventory

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Screens - Edge Randburg                          [Back]    │
│ [Add Screen] [Bulk Import] [Export]                       │
├─────────────────────────────────────────────────────────────┤
│ ┌───┬────────────┬─────────┬─────────┬──────┬────────────┐ │
│ │ # │ Screen ID  │ Location│ Size    │Status│ Last Check │ │
│ ├───┼────────────┼─────────┼─────────┼──────┼────────────┤ │
│ │ 1 │ ED-RB-001  │ Entrance│ 55"     │Online│ 2 min ago  │ │
│ │ 2 │ ED-RB-002  │ Cardio  │ 49"     │Online│ 5 min ago  │ │
│ │ 3 │ ED-RB-003  │ Weights │ 43"     │Offline│1 hour ago │ │
│ │ 4 │ ED-RB-004  │ Studio  │ 55"     │Online│ 1 min ago  │ │
│ └───┴────────────┴─────────┴─────────┴──────┴────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Campaign Log

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Campaigns                                        [Back]    │
│ [+ New Campaign] [Bulk Actions]                          │
├─────────────────────────────────────────────────────────────┤
│ ┌───┬──────────────┬────────────┬──────────┬──────┬─────┐ │
│ │ # │ Campaign Name│Venues      │Duration  │Budget│Status│ │
│ ├───┼──────────────┼────────────┼──────────┼──────┼─────┤ │
│ │ 1 │ Summer Sale  │ 12         │30 days   │R150k │Active│ │
│ │ 2 │ New Year Fit │ 8          │60 days   │R200k │Active│ │
│ │ 3 │ Spring Promo │ 6          │45 days   │R100k │Ended│ │
│ │ 4 │ Winter Warmup│ 15         │90 days   │R300k │Draft ││
│ └───┴──────────────┴────────────┴──────────┴──────┴─────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Revenue Entry

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Revenue Entry - March 2024                     [Back]    │
│ Network: Edge Gyms                             [Export]    │
├─────────────────────────────────────────────────────────────┤
│ ┌───┬──────────────┬────────────┬────────────┬───────────┐ │
│ │ # │ Venue        │ Fixed Rent │ Commission │ Total     │ │
│ ├───┼──────────────┼────────────┼────────────┼───────────┤ │
│ │ 1 │ Randburg     │ R5,000    │ [R7,450]   │ R12,450   │ │
│ │ 2 │ Sandton      │ R5,000    │ [R13,230]  │ R18,230   │ │
│ │ 3 │ Fourways     │ R5,000    │ [R3,900]   │ R8,900    │ │
│ │ 4 │ Rosebank     │ R5,000    │ [R9,670]   │ R14,670   │ │
│ └───┴──────────────┴────────────┴────────────┴───────────┘ │
│                                                           │
│ [Save Revenue]                    [Export to Excel]       │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Photo Approval

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Photo Approval - Pending (24)                   [Back]    │
│ [Approve Selected] [Reject Selected] [Select All]         │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│ │[img_thumb]│[img_thumb]│[img_thumb]│[img_thumb]│[img_thumb]│  │
│ │ Edge Randb│ Virgin CT │ Planet JH│ Edge Sand│ Curves DB│  │
│ │ Mar 2024 │ Mar 2024 │ Mar 2024 │ Mar 2024 │ Mar 2024 │  │
│ │ [✓] [✗]  │ [✓] [✗]  │ [✓] [✗]  │ [✓] [✗]  │ [✓] [✗]  │  │
│ │──────────┼──────────┼──────────┼──────────┼──────────│  │
│ │[img_thumb]│[img_thumb]│[img_thumb]│[img_thumb]│[img_thumb]│  │
│ │ Edge Rose │ Virgin PE │ Planet PT│ Edge Benn│ Curves CT│  │
│ │ Mar 2024 │ Mar 2024 │ Mar 2024 │ Mar 2024 │ Mar 2024 │  │
│ │ [✓] [✗]  │ [✓] [✗]  │ [✓] [✗]  │ [✓] [✗]  │ [✓] [✗]  │  │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Owner Dashboard (Partner Portal)

### Desktop Layout (Partner Portal example: Edge Gyms)
```
┌─────────────────────────────────────────────────────────────┐
│ [Edge Gyms Logo] Partner Portal              [Profile]     │
├─────────────────────────────────────────────────────────────┤
│ Welcome back, Sarah                                         │
│ [Total Revenue YTD   ] [This Month     ] [Trend          ]  │
│ [R234,567            ] [R34,560        ] [↗ 12% vs last mo]│
├─────────────────────────────────────────────────────────────┤
│ Your Venues                                   [View All]   │
│ ┌───┬──────────────┬──────────┬──────────┬──────────────┐ │
│ │ # │ Venue        │ This Month│ YTD      │ Last Month  │ │
│ ├───┼──────────────┼──────────┼──────────┼──────────────┤ │
│ │ 1 │ Randburg     │ R12,450  │ R145,890 │ R11,230     │ │
│ │ 2 │ Sandton      │ R18,230  │ R201,450 │ R17,110     │ │
│ │ 3 │ Fourways     │ R3,900   │ R67,230  │ R4,120      │ │
│ └───┴──────────────┴──────────┴──────────┴──────────────┘ │
│                                                           │
│ Monthly Revenue Trend                              [View]  │
│ [Chart: Jan - Dec with revenue line]                       │
│                                                           │
│ Quick Actions                                             │
│ [Download Report] [Update Details] [Contact Support]      │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────┐
│ [Menu] Edge Gyms        │
├─────────────────────────┤
│ Welcome Sarah!          │
│ Total Revenue YTD       │
│ R234,567 ▲ +12%         │
├─────────────────────────┤
│ This Month              │
│ R34,560                 │
├─────────────────────────┤
│ Your Venues            │
│ Randburg: R12,450       │
│ Sandton: R18,230        │
│ Fourways: R3,900        │
├─────────────────────────┤
│ [Download Report]       │
│ [Update Details]        │
│ [Contact Support]       │
└─────────────────────────┘
```

---

## 11. Single Venue View (Owner)

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Edge Randburg                                [Back]        │
│ ┌──────────────┬──────────────────────────────────────────┐ │
│ │              │ Revenue This Month: R12,450              │ │
│ │ [Venue Photo]│ YTD: R145,890                             │ │
│ │              │ Screens: 12 active                        │ │
│ └──────────────┴──────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Monthly Revenue Trend                             [Export]   │
│ [Chart: Monthly revenue bars]                              │
│                                                           │
│ Photo Gallery                                 [View All]   │
│ [img] [img] [img] [img] [img] [img]                      │
│                                                           │
│ Venue Details                                             │
│ Address: 123 Republic Rd, Randburg                        │
│ Manager: Sarah Molefe (082-555-1234)                      │
│ Operating Hours: 05:00-22:00 Daily                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Manager Dashboard

### Mobile-First Design
```
┌─────────────────────────┐
│ [Menu] Edge Randburg    │
│ Hi Thabo!               │
├─────────────────────────┤
│ TO-DO LIST              │
│ ⚠️ Upload March photos   │
│ 💡 Update member count   │
│ 📧 Review hours update   │
├─────────────────────────┤
│ QUICK STATS             │
│ Active: 2,847 members   │
│ Peak: 18:00-20:00       │
│ Photos: 6 approved      │
├─────────────────────────┤
│ RECENT PHOTOS          │
│ [img] [img] [img]      │
├─────────────────────────┤
│ [📷 Upload Photos]      │
│ [✏️ Update Venue]       │
│ [📊 View Revenue]       │
└─────────────────────────┘
```

---

## 13. Manager Photo Upload

### Mobile-First Design
```
┌─────────────────────────┐
│ [Back] Upload Photos    │
├─────────────────────────┤
│ SELECT MONTH             │
│ [March 2024 ▼]          │
├─────────────────────────┤
│ 📱 TAKE PHOTO           │
│ OR                      │
│ 📤 CHOOSE FROM GALLERY  │
│ ┌─────────────────────┐ │
│ │    📷 📸 📱         │ │
│ │   Drop photos here  │ │
│ │   or click to browse│ │
│ └─────────────────────┘ │
│ Selected: 6 photos      │
│ ┌────┬────┬────┬────┐   │
│ │img │img │img │img │   │
│ ├────┼────┼────┼────┤   │
│ │img │img │    │    │   │
│ └────┴────┴────┴────┘   │
│ [UPLOAD SELECTED]       │
│ [CLEAR ALL]             │
└─────────────────────────┘
```

---

## 14. Manager Venue Update Form

### Mobile-First Design
```
┌─────────────────────────┐
│ [Back] Update Venue     │
├─────────────────────────┤
│ MEMBERSHIP               │
│ Active Members: [2847]  │
│ Last Month: [2756]      │
│ New This Month: [91]    │
│                         │
│ OPERATING HOURS          │
│ Mon-Fri: [05:00-22:00]  │
│ Sat-Sun: [06:00-20:00]  │
│                         │
│ FACILITY UPDATES         │
│ New Equipment Added:     │
│ [✓] Rowing Machines     │
│ [✓] Free Weights Area   │
│ [ ] Swimming Pool       │
│                         │
│ NOTES                    │
│ [Facility updates...    │
│ Additional comments]     │
│                         │
│ [SUBMIT UPDATES]        │
│ [SAVE DRAFT]            │
└─────────────────────────┘
```

---

## 15. Login Page (Shared)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                      [GymGaze Logo]                         │
│                  Partner & Admin Portal                     │
├─────────────────────────────────────────────────────────────┤
│                     Welcome Back                           │
│                                                             │
│ Email: [______________________]                            │
│ Password: [___________________] 👁️                         │
│                                                             │
│ [✓] Remember me for 30 days                                │
│                                                             │
│              [Login to Dashboard]                           │
│                                                             │
│        [Forgot Password?] [Contact Support]                │
└─────────────────────────────────────────────────────────────┘
```

---

## 16. Partner Logo System

### Logo-Only Branding
```

Partner Portal branding is logo-only. No color customization.
The platform is always dark + lime (#D4FF4F) regardless of partner.

Partner Configuration (Runtime):
┌─────────────────────┬───────────────────────────┐
│ Variable            │ Example Value             │
├─────────────────────┼───────────────────────────┤
│ --partner-logo-url  │ url('/edge-gyms-logo.svg')│
│ --partner-font      │ 'Inter', sans-serif       │
└─────────────────────┴───────────────────────────┘

Component Rules:
- Header: Always dark (#0A0A0A), partner logo displayed
- Primary buttons: Always lime (#D4FF4F), black text
- Accents: Always #D4FF4F — no partner color override
- Logo: --partner-logo-url injection (logo only)

Logo Detection Logic:
1. Check subdomain/URL for partner identifier
2. Fetch partner logo URL from API
3. Inject logo into header
4. Platform theme remains dark + lime
5. Cache logo URL for offline use

Fallback Strategy:
- Missing logo: Show GymGaze default logo
- API failure: Use cached logo or default
- Offline mode: Use cached logo
```

---

## Component Specification Summary

### Grid Systems
- **Admin**: 12-column grid, 24px gutters
- **Partner**: 10-column grid, 32px gutters
- **Mobile**: Single column, 16px margins

### Card Patterns
- **Stat Cards**: Gradient background, large numbers, trend arrows
- **Data Cards**: White background, subtle borders, action buttons
- **Photo Cards**: 16:9 aspect ratio, hover effects, selection states

### Navigation Patterns
- **Admin**: Fixed sidebar (240px), collapsed state (64px)
- **Partner**: Top navigation with horizontal tabs
- **Mobile**: Bottom tab bar (5 items max), hamburger menu

### Form Patterns
- **Admin**: Dark inputs, lime (#D4FF4F) focus states, compact spacing
- **Partner**: Dark inputs, lime (#D4FF4F) focus states, generous spacing
- **Mobile**: Full-width inputs, large touch targets, stacked layout

### Interactive States
- **Hover**: Subtle scale (1.02), shadow elevation
- **Active**: Color darken (10%), scale (0.98)
- **Focus**: 2px solid brand color outline
- **Loading**: Skeleton screens, pulsing animation
- **Error**: Red border (destructive confirmations only), error icon, error text
- **Success**: Green checkmark, brief animation

### Partner Branding Implementation
- Logo URL injection only (no color customization)
- Font: Inter/Inter Tight — fixed, not overridable
- Platform always dark + lime (#D4FF4F)
- Fallback to GymGaze default logo

### Responsive Strategy
- Mobile-first development
- Progressive enhancement
- Touch-optimized interactions
- Performance-first loading
- Offline-capable caching

This specification provides the complete blueprint for implementing GymGaze's 16 screens with consistent design patterns, responsive behavior, and a unified dark + lime visual identity.