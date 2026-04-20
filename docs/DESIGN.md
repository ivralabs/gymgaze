# GymGaze Design System

## Brand Identity
**Energy. Power. Results.**

GymGaze is built for the fitness industry — where performance matters and aesthetics drive engagement. Our visual language mirrors the gym experience: bold, confident, and purpose-driven.

## Color Palette

### Primary Colors
```
Primary Orange: #FF6B35 (Energy, Action)
Dark Charcoal: #1A1A1A (Power, Authority)
Pure White: #FFFFFF (Clean, Premium)
```

### Admin Dashboard (Dark Theme)
```
Background: #0F0F0F
Surface: #1E1E1E
Surface Elevated: #2A2A2A
Border: #333333
Text Primary: #FFFFFF
Text Secondary: #B3B3B3
Text Muted: #666666
Accent: #FF6B35
Success: #10B981
Warning: #F59E0B
Error: #EF4444
Info: #3B82F6
```

### Partner Portal (Light Theme)
```
Background: #F9FAFB
Surface: #FFFFFF
Surface Elevated: #FFFFFF
Border: #E5E7EB
Text Primary: #111827
Text Secondary: #6B7280
Text Muted: #9CA3AF
Primary: #FF6B35
Success: #059669
Warning: #D97706
Error: #DC2626
Info: #2563EB
```

### White-Label Colors
```
--brand-primary: [DYNAMIC]
--brand-primary-dark: [DYNAMIC]
--brand-primary-light: [DYNAMIC]
--brand-logo-url: [DYNAMIC]
```

## Typography

### Font Families
```
Headings: Inter Tight (Google Fonts)
Weight: 600-700
Style: Modern, Geometric, Bold

Body: Inter (Google Fonts)
Weight: 400-500
Style: Clean, Readable, Professional

Monospace: JetBrains Mono
Use: Revenue numbers, campaigns, dates
```

### Type Scale
```
Display: 48px/56px - Inter Tight 700
H1: 36px/44px - Inter Tight 700
H2: 30px/38px - Inter Tight 600
H3: 24px/32px - Inter Tight 600
H4: 20px/28px - Inter Tight 600
H5: 18px/24px - Inter Tight 600
Body Large: 16px/24px - Inter 500
Body: 14px/20px - Inter 400
Body Small: 12px/16px - Inter 400
Caption: 10px/12px - Inter 400
```

### Typography Hierarchy
- **Admin**: Inter Tight for all headings, Inter for body
- **Partner Portal**: Same fonts, but larger body text for accessibility
- **Mobile**: Increased line height (+2px), minimum 16px body text

## Spacing System

### Base Unit: 4px
```
0: 0px
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
7: 28px
8: 32px
10: 40px
12: 48px
16: 64px
20: 80px
24: 96px
32: 128px
```

### Grid System
```
Mobile: 4px grid, 16px margins
Tablet: 8px grid, 24px margins
Desktop: 8px grid, 32px margins
Max width: 1440px (admin), 1280px (partner)
```

## Components

### Buttons

#### Primary Button
```
Background: #FF6B35
Text: #FFFFFF
Border: transparent
Padding: 12px 24px
Border-radius: 8px
Font: Inter 500, 14px
Hover: #E55A2B
Active: #CC4F21
Disabled: #666666
```

#### Secondary Button
```
Background: transparent
Text: #FF6B35
Border: 1px solid #FF6B35
Padding: 12px 24px
Border-radius: 8px
Font: Inter 500, 14px
Hover: rgba(255, 107, 53, 0.1)
Active: rgba(255, 107, 53, 0.2)
```

#### Destructive Button
```
Background: #EF4444
Text: #FFFFFF
Border: transparent
Padding: 12px 24px
Border-radius: 8px
Font: Inter 500, 14px
```

### Cards
```
Background: #1E1E1E (admin) / #FFFFFF (partner)
Border: 1px solid #333333 (admin) / #E5E7EB (partner)
Border-radius: 12px
Padding: 24px
Shadow: 0 1px 3px rgba(0,0,0,0.1) (partner only)
Hover: shadow-lg (partner only)
```

### Stat Tiles
```
Background: Gradient overlay brand color
Text: #FFFFFF
Padding: 20px
Border-radius: 12px
Large number: Inter Tight 700, 32px
Label: Inter 500, 14px, uppercase
Sublabel: Inter 400, 12px
```

### Tables
```
Header background: #2A2A2A (admin) / #F9FAFB (partner)
Header text: #FFFFFF (admin) / #374151 (partner)
Row background: #1E1E1E (admin) / #FFFFFF (partner)
Border: 1px solid #333333 (admin) / #E5E7EB (partner)
Padding: 16px
Hover: #2A2A2A (admin) / #F9FAFB (partner)
Selected: rgba(255, 107, 53, 0.2)
```

### Forms
```
Label: Inter 500, 14px, #B3B3B3 (admin) / #374151 (partner)
Input background: #0F0F0F (admin) / #FFFFFF (partner)
Input border: 1px solid #333333 (admin) / #D1D5DB (partner)
Input border-radius: 8px
Input padding: 12px 16px
Input focus: 2px solid #FF6B35
Placeholder: #666666 (admin) / #9CA3AF (partner)
Error: 2px solid #EF4444, text #EF4444
Disabled: opacity 0.5
```

### Badges
```
Active: #10B981 background, #FFFFFF text
Pending: #F59E0B background, #FFFFFF text
Inactive: #6B7280 background, #FFFFFF text
Rejected: #EF4444 background, #FFFFFF text
Border-radius: 6px
Padding: 4px 8px
Font: Inter 500, 10px, uppercase
```

### Icons
```
Library: Lucide React (lucide-react)
Size: 16px (small), 20px (default), 24px (large)
Color: inherit from text color
Stroke-width: 2px
```

### Photo Grid
```
Gap: 16px
Aspect ratio: 16:9 (landscape), 1:1 (square)
Border-radius: 8px
Hover: scale(1.02), shadow-lg
Selected: 3px solid #FF6B35
```

### Upload Zone
```
Background: rgba(255, 107, 53, 0.05)
Border: 2px dashed #FF6B35
Border-radius: 12px
Padding: 48px
Min-height: 200px
Drag over: background rgba(255, 107, 53, 0.1)
Icon: CloudUpload, 48px, #FF6B35
Text: Inter 500, 16px, #374151
```

## Layout Patterns

### Admin Dashboard
- **Structure**: Fixed sidebar (240px) + main content
- **Sidebar**: Dark, collapsed state available
- **Header**: 64px height, sticky
- **Content**: Responsive grid, max 12 columns
- **Spacing**: 24px between sections

### Partner Portal
- **Structure**: Top navigation + main content
- **Header**: 72px height, includes brand logo
- **Navigation**: Horizontal tabs for sections
- **Content**: Responsive grid, max 10 columns
- **Spacing**: 32px between sections

### Mobile Patterns
- **Navigation**: Bottom tab bar (5 items max)
- **Cards**: Full width, 16px margins
- **Buttons**: Full width primary actions
- **Forms**: Single column, large touch targets
- **Spacing**: Increased by 4px for touch

## White-Label System

### Dynamic Brand Injection
```css
:root {
  --brand-primary: #FF6B35;
  --brand-primary-dark: #E55A2B;
  --brand-primary-light: #FFE4D6;
  --brand-logo-url: url('/logo-default.svg');
}

.brand-primary { color: var(--brand-primary); }
.brand-bg-primary { background-color: var(--brand-primary); }
.brand-border-primary { border-color: var(--brand-primary); }
.brand-logo { background-image: var(--brand-logo-url); }
```

### Brand Override Logic
1. Load default theme on app start
2. Fetch brand config from API
3. Update CSS custom properties
4. Re-render components with new colors
5. Cache brand config for offline use

### Brand-Specific Components
- **Header**: Logo and primary color apply
- **Buttons**: Primary button uses brand color
- **Stat tiles**: Gradient overlay uses brand color
- **Links**: Brand color for primary actions
- **Accents**: Focus states, borders, highlights

### Fallback Strategy
- **No brand**: Use GymGaze default (#FF6B35)
- **Invalid brand**: Validate colors, fallback to default
- **Missing logo**: Show GymGaze logo
- **Offline**: Use cached brand config

## Accessibility

### Contrast Requirements
- **AA Compliance**: 4.5:1 for normal text, 3:1 for large text
- **Focus indicators**: 2px solid outline, #FF6B35
- **Interactive elements**: Minimum 44px touch target
- **Screen readers**: Semantic HTML, ARIA labels where needed

### Color Usage Guidelines
- **Never rely on color alone**: Always pair with icons/text
- **Error states**: Use color + icon + text
- **Success states**: Use color + icon + text
- **Interactive states**: Clear hover/focus/active differences

## Motion & Animation

### Transitions
```
Duration: 200ms for micro-interactions
Duration: 300ms for page transitions
Duration: 150ms for hover states
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### Animations
- **Loading**: Subtle pulse on skeleton screens
- **Success**: Brief checkmark animation
- **Upload**: Progress bar with smooth fill
- **Hover**: Scale and shadow transitions

## Responsive Breakpoints
```
Mobile: 320px - 767px
Tablet: 768px - 1023px
Desktop: 1024px - 1279px
Large: 1280px+
```

### Adaptive Patterns
- **Mobile-first**: Design for smallest screen first
- **Progressive enhancement**: Add features for larger screens
- **Touch optimization**: Larger targets on mobile
- **Performance**: Lazy load images, optimize assets

## Design Principles

1. **Energy First**: Every interaction should feel dynamic and purposeful
2. **Clarity Always**: Data-dense views must remain scannable and clear
3. **Confidence**: Bold typography and strong contrast inspire trust
4. **Flexibility**: White-label system adapts to any gym brand
5. **Performance**: Fast loading, smooth interactions, efficient data display

## Implementation Notes

### For Bolt
- Use CSS custom properties for theming
- Implement mobile-first media queries
- Use Inter and Inter Tight from Google Fonts
- Install Lucide React for all icons
- Set up CSS-in-JS or CSS modules for component isolation

### Component Structure
```
/components
  /atoms
    Button.jsx
    Badge.jsx
    Icon.jsx
  /molecules
    StatCard.jsx
    PhotoCard.jsx
    SearchBar.jsx
  /organisms
    DataTable.jsx
    PhotoGrid.jsx
    RevenueChart.jsx
  /templates
    AdminLayout.jsx
    PartnerLayout.jsx
```

### State Management
- **Theme**: CSS custom properties
- **Brand**: API-driven, localStorage cache
- **Layout**: React state for sidebar/sections
- **Data**: Fetch from API, optimistic updates