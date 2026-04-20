# GymGaze User Stories

## Admin User Stories

### Gym Management
**As an admin, I want to add new gym brands to the system so that I can manage multiple gym networks.**
- Given I have admin access
- When I click "Add Gym Brand"
- Then I can enter brand name, logo, and contact information
- And the brand appears in my gym network list

**As an admin, I want to add individual gym venues under brands so that I can track each location separately.**
- Given I have selected a gym brand
- When I click "Add Venue"
- Then I can enter location details, operating hours, and member count
- And the venue appears under the selected brand

**As an admin, I want to update venue information so that I can keep gym profiles current.**
- Given I have selected a venue
- When I edit venue details
- Then I can update address, hours, members, and status
- And the changes are saved with timestamp

### Screen Management
**As an admin, I want to add screens to venues so that I can track advertising inventory.**
- Given I have selected a venue
- When I click "Add Screen"
- Then I can specify size, resolution, and orientation
- And the screen count updates for that venue

**As an admin, I want to update screen specifications so that I can maintain accurate inventory.**
- Given I have selected a screen
- When I edit screen details
- Then I can change size, resolution, or orientation
- And the inventory record is updated

### Contract Management
**As an admin, I want to upload venue contracts so that I can store legal agreements securely.**
- Given I have selected a venue
- When I click "Upload Contract"
- Then I can select and upload PDF documents
- And the contract is stored with metadata

**As an admin, I want to set contract terms so that I can calculate revenue accurately.**
- Given I have uploaded a contract
- When I enter rental amount and revenue share percentage
- Then the system uses these values for monthly calculations
- And I receive alerts about upcoming renewals

### Revenue Management
**As an admin, I want to enter monthly venue revenue so that I can track business performance.**
- Given I have selected a venue and month
- When I enter rental payment and revenue share
- Then the system calculates total venue earnings
- And the data appears in partner reports

**As an admin, I want to review revenue history so that I can analyze trends.**
- Given I have selected a date range
- When I view revenue reports
- Then I see breakdown by venue and month
- And I can export data for analysis

### Campaign Management
**As an admin, I want to log advertising campaigns so that I can track which brands advertised where.**
- Given a new campaign starts
- When I create campaign record with brand, dates, and venues
- Then the campaign appears in venue history
- And I can track campaign performance

**As an admin, I want to assign campaigns to multiple venues so that I can manage network-wide bookings.**
- Given I have created a campaign
- When I select multiple venues
- Then the campaign is linked to all selected locations
- And each venue shows campaign in their history

### Photo Management
**As an admin, I want to review uploaded venue photos so that I can ensure quality compliance.**
- Given managers have uploaded photos
- When I access photo approval queue
- Then I see all pending photos with upload details
- And I can approve or reject each photo

**As an admin, I want to provide feedback on rejected photos so that managers know what to fix.**
- Given I have reviewed a photo
- When I reject it with comments
- Then the manager receives notification
- And can re-upload corrected photos

**As an admin, I want to view approved venue photos so that I can verify current conditions.**
- Given I have selected a venue
- When I access photo gallery
- Then I see all approved photos by month
- And can download for records

### Reporting
**As an admin, I want to generate monthly reports for gym owners so that they receive transparent updates.**
- Given month-end has passed
- When I generate owner reports
- Then each owner receives venue summary, revenue breakdown, and photo status
- And reports are available as PDFs

**As an admin, I want to track network performance so that I can optimize operations.**
- Given I need business insights
- When I access performance dashboard
- Then I see key metrics across all venues
- And can identify trends and opportunities

## Gym Owner Stories

### Dashboard Access
**As a gym owner, I want to access my branded portal so that I can view my network performance.**
- Given I have login credentials
- When I access partner portal
- Then I see my gym brand logo and colors
- And land on my network dashboard

**As a gym owner, I want to see all my gyms in one view so that I can monitor my entire network.**
- Given I have multiple gym locations
- When I access dashboard
- Then I see summary cards for each venue
- With key metrics and status indicators

### Revenue Visibility
**As a gym owner, I want to view monthly revenue so that I can track my earnings.**
- Given revenue has been entered by admin
- When I access revenue section
- Then I see monthly breakdown by venue
- Including rental and revenue share amounts

**As a gym owner, I want to see revenue trends so that I can understand business performance.**
- Given I have historical revenue data
- When I view trends chart
- Then I see 6-month revenue progression
- And can identify patterns and growth

**As a gym owner, I want to download revenue reports so that I can share with stakeholders.**
- Given I need financial documentation
- When I click download report
- Then I receive PDF with venue breakdowns
- And year-to-date summary

### Network Management
**As a gym owner, I want to view venue details so that I can verify information accuracy.**
- Given venue data exists
- When I access individual gym profiles
- Then I see location, hours, members, and photos
- And can identify outdated information

## Gym Manager Stories

### Photo Upload
**As a gym manager, I want to upload monthly venue photos so that I fulfill my contract requirements.**
- Given it's a new month
- When I receive upload reminder
- Then I can take photos with my phone
- And upload directly through mobile portal

**As a gym manager, I want to upload multiple photos so that I capture different areas of the venue.**
- Given I need to show venue condition
- When I access photo upload
- Then I can select multiple images
- And add captions for context

**As a gym manager, I want to see my upload history so that I can track what I've submitted.**
- Given I have uploaded photos previously
- When I access photo history
- Then I see all my uploads by month
- And their approval status

### Venue Updates
**As a gym manager, I want to update venue information so that owners see current details.**
- Given venue details have changed
- When I edit my gym profile
- Then I can update hours, member count, and traffic
- And changes are saved with timestamp

**As a gym manager, I want to update operating hours so that advertising schedules align with gym times.**
- Given our hours have changed
- When I modify operating hours
- Then the system updates for campaign scheduling
- And admin sees the changes

### Notifications
**As a gym manager, I want to receive upload reminders so that I don't miss monthly deadlines.**
- Given monthly deadline approaches
- When reminder is triggered
- Then I receive email notification
- With direct link to upload portal

**As a gym manager, I want feedback on rejected photos so that I know what to correct.**
- Given my photos were rejected
- When admin provides feedback
- Then I receive specific comments
- And can re-upload improved photos

## Cross-Role Stories

### User Authentication
**As any user, I want secure login so that my data remains protected.**
- Given I have valid credentials
- When I enter username and password
- Then I access my appropriate dashboard
- Based on my role permissions

**As any user, I want password reset so that I can recover access if forgotten.**
- Given I can't remember my password
- When I click reset password
- Then I receive reset link via email
- And can set new password

### Mobile Experience
**As any user, I want mobile-friendly interface so that I can access on any device.**
- Given I'm using smartphone or tablet
- When I access the platform
- Then interface adapts to screen size
- And maintains full functionality

**As a manager specifically, I want mobile-optimized photo upload so that I can easily submit photos.**
- Given I'm using mobile device
- When I access photo upload
- Then camera integration works smoothly
- And upload progress is visible

### Data Export
**As any partner user, I want to export my data so that I can use it externally.**
- Given I need data for other systems
- When I click export
- Then I receive CSV/PDF files
- With my permitted data only

## Acceptance Criteria Template

Each user story should include:
- **Given** - The initial context or state
- **When** - The action taken by the user
- **Then** - The expected outcome or result

## Priority Indicators

**High Priority** (Must have for MVP):
- All admin management functions
- Basic partner portal with revenue view
- Photo upload and approval workflow
- User authentication and roles

**Medium Priority** (Should have):
- Mobile optimization
- Advanced reporting
- Notification system
- Data export capabilities

**Low Priority** (Nice to have):
- Advanced analytics
- Custom integrations
- Multi-language support
- Advanced mobile app features

## Implementation Notes

1. **Security First**: All features must respect role-based permissions
2. **Mobile consideration**: Manager stories prioritize mobile experience
3. **Simplicity focus**: Partner portal should be intuitive and minimal
4. **Data validation**: All inputs need appropriate validation and error handling
5. **Audit trails**: Critical actions should be logged for accountability

## Success Criteria

User stories are considered complete when:
- All acceptance criteria are met
- Role-based permissions work correctly
- Mobile experience is functional
- Data integrity is maintained
- User feedback is positive during testing