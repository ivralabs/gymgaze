# GymGaze Product Requirements Document

## Problem Statement

GymGaze operates a growing network of advertising screens in gym locations across South Africa, starting with 14 Edge Gym locations. Currently, the business relies on manual processes, spreadsheets, and ad-hoc communication to manage:

- Gym partnerships and contracts
- Screen inventory across multiple locations
- Campaign placement and tracking
- Revenue calculation and reporting
- Photo collection and venue verification

This manual approach creates operational inefficiencies, lacks visibility for gym partners, and limits scalability as the network expands to new gym chains and locations.

## Goals

### Primary Goals
1. **Centralize Operations**: Create a single platform to manage all gym partnerships, venues, screens, campaigns, and revenue
2. **Enable Partner Self-Service**: Provide gym owners and managers with visibility into their network performance and revenue
3. **Streamline Photo Workflow**: Automate monthly photo collection and approval process
4. **Improve Revenue Tracking**: Enable accurate monthly revenue calculation and reporting per gym
5. **Support Scale**: Build foundation for rapid expansion to new gym chains and locations

### Secondary Goals
6. **Reduce Manual Work**: Minimize repetitive administrative tasks
7. **Improve Communication**: Provide structured channels for gym partner communication
8. **Enable Data-Driven Decisions**: Collect and present data for business optimization
9. **Build Partner Trust**: Increase transparency and professionalism in partnerships

## User Personas

### 1. GymGaze Admin (Internal)
- **Role**: Operations manager at GymGaze headquarters
- **Goals**: Efficiently manage gym network, track revenue, ensure smooth operations
- **Frustrations**: Disorganized data across spreadsheets, manual processes, lack of visibility
- **Tech Comfort**: High - comfortable with admin interfaces and data entry
- **Frequency**: Daily use, multiple hours per day

### 2. Gym Owner (External Partner)
- **Role**: Owns multiple gym locations in a network
- **Goals**: Monitor network performance, track revenue, ensure operational compliance
- **Frustrations**: Lack of transparency, delayed reporting, manual communication
- **Tech Comfort**: Moderate - uses business software but prefers simplicity
- **Frequency**: Weekly check-ins, monthly deep reviews

### 3. Gym Manager (External Partner)
- **Role**: Manages individual gym location day-to-day operations
- **Goals**: Keep venue information current, complete monthly requirements
- **Frustrations**: Forgotten tasks, unclear requirements, manual processes
- **Tech Comfort**: Basic - uses smartphone apps, prefers mobile-first experience
- **Frequency**: Monthly for photo uploads, occasional for updates

## Feature Requirements

### Admin Side Features

#### 1. Gym Network Management
**Description**: Create and manage gym brands/networks in the system
**Acceptance Criteria**:
- [ ] Admin can add new gym brands with name, logo, contact information
- [ ] Admin can edit existing gym brand details
- [ ] Admin can deactivate/archive gym brands
- [ ] System prevents duplicate brand names
- [ ] Each brand has unique identifier and metadata

#### 2. Venue Management
**Description**: Add and manage individual gym locations under brands
**Acceptance Criteria**:
- [ ] Admin can add venues under specific gym brands
- [ ] Venue profile includes: location (address, city, region), operating hours, active members count
- [ ] Admin can edit all venue information
- [ ] Admin can change venue status (active, inactive, coming soon)
- [ ] Admin can archive venues
- [ ] Bulk venue operations supported (status changes, data export)

#### 3. Screen Inventory Management
**Description**: Manage advertising screens at each venue
**Acceptance Criteria**:
- [ ] Admin can add multiple screens per venue
- [ ] Screen details: count, size (inches), resolution, orientation (portrait/landscape)
- [ ] Admin can edit screen specifications
- [ ] Admin can mark screens as active/inactive
- [ ] Screen history tracking (when added, removed, specifications changed)

#### 4. Contract Management
**Description**: Store and manage venue contracts
**Acceptance Criteria**:
- [ ] Admin can upload PDF contracts per venue
- [ ] Contract metadata: start date, end date, monthly rental amount, revenue share percentage
- [ ] Admin can update contract terms
- [ ] System alerts for contracts expiring within 30 days
- [ ] Contract history maintained
- [ ] Admin can download uploaded contracts

#### 5. Campaign Management
**Description**: Track advertising campaigns running in venues
**Acceptance Criteria**:
- [ ] Admin can create campaign records: brand name, dates, venues, amount charged
- [ ] Admin can assign campaigns to multiple venues
- [ ] Campaign history per venue maintained
- [ ] Admin can search/filter campaigns by date, brand, venue
- [ ] Campaign performance metrics tracked

#### 6. Revenue Management
**Description**: Enter and track monthly revenue per venue
**Acceptance Criteria**:
- [ ] Admin can enter monthly revenue: fixed rental amount and ad revenue share
- [ ] Revenue entry per venue per month
- [ ] Admin can edit revenue entries
- [ ] System calculates total revenue per venue and across network
- [ ] Revenue history maintained with audit trail
- [ ] Admin can export revenue reports

#### 7. Photo Approval Workflow
**Description**: Manage monthly venue photos from gym managers
**Acceptance Criteria**:
- [ ] System shows pending photo uploads from managers
- [ ] Admin can view uploaded photos
- [ ] Admin can approve or reject photos with comments
- [ ] Approved photos become part of venue profile
- [ ] Rejected photos require manager to re-upload
- [ ] Photo approval history maintained

#### 8. Notification System
**Description**: Automated notifications and reminders
**Acceptance Criteria**:
- [ ] System sends monthly reminder to managers for photo uploads
- [ ] System alerts admin about contracts expiring within 30 days
- [ ] System alerts admin about venues without recent photos
- [ ] Email notifications sent to relevant parties
- [ ] Notification history and delivery status tracked

#### 9. Reporting
**Description**: Generate reports for gym owners and internal use
**Acceptance Criteria**:
- [ ] Admin can generate monthly reports per gym owner
- [ ] Reports include: venue list, revenue breakdown, campaign summary, photo status
- [ ] Reports available as PDF download and on-screen summary
- [ ] Admin can generate network-wide performance reports
- [ ] Custom date range reporting supported

### Gym Partner Portal Features

#### 10. White Label Branding
**Description**: Custom branding per gym network
**Acceptance Criteria**:
- [ ] Each gym brand sees their own logo and brand colors
- [ ] Brand colors applied to UI elements (header, buttons, accents)
- [ ] Branding consistent across all portal pages
- [ ] Admin can upload/change branding for each network
- [ ] Default fallback branding if none specified

#### 11. Gym Owner Dashboard
**Description**: Overview of gym network performance
**Acceptance Criteria**:
- [ ] Owner sees all their gyms in single dashboard view
- [ ] Dashboard shows total network revenue (current month and YTD)
- [ ] Individual gym cards show: name, status, monthly revenue, last photo date
- [ ] Quick stats: total gyms, active gyms, total screens
- [ ] Dashboard accessible on mobile and desktop
- [ ] Revenue data respects viewing permissions

#### 12. Revenue Visibility
**Description**: Detailed revenue breakdown and trends
**Acceptance Criteria**:
- [ ] Owner can view monthly revenue per gym (rental + revenue share)
- [ ] Historical revenue trend charts (6-month view)
- [ ] Revenue breakdown by venue
- [ ] Year-to-date revenue summary
- [ ] Owner can download revenue reports
- [ ] Revenue data updated monthly after admin entry

#### 13. Gym Manager View
**Description**: Venue-specific management tools
**Acceptance Criteria**:
- [ ] Manager sees only their assigned gym
- [ ] Manager can upload monthly photos (multiple photos supported)
- [ ] Manager can update venue information: operating hours, members count, foot traffic
- [ ] Manager receives notifications/reminders via email
- [ ] Mobile-optimized photo upload experience
- [ ] Upload confirmation and status shown

#### 14. User Management & Permissions
**Description**: Control access for different partner roles
**Acceptance Criteria**:
- [ ] Admin can create user accounts for gym owners and managers
- [ ] Role-based access control (owner vs manager permissions)
- [ ] Owners can view all gyms in their network
- [ ] Managers can only access their assigned gym
- [ ] Password reset functionality
- [ ] Account activation/deactivation by admin

## Data Model Overview

### Core Entities
1. **GymBrand** - Network/chain level (Edge Gyms)
2. **Venue** - Individual gym locations
3. **Screen** - Individual screens at venues
4. **Contract** - Venue agreements
5. **Campaign** - Advertising campaigns
6. **Revenue** - Monthly revenue entries
7. **Photo** - Venue photos
8. **User** - System users (admin, owner, manager)

### Key Relationships
- GymBrand → has many → Venues
- Venue → has many → Screens
- Venue → has one → Contract
- Venue → has many → Campaigns
- Venue → has many → Revenue entries
- Venue → has many → Photos
- User → belongs to → Role (admin/owner/manager)
- Owner → manages many → Venues
- Manager → manages one → Venue

## Technical Requirements

### Performance
- Page load time < 2 seconds
- Photo upload completion < 30 seconds
- Search/filter operations < 1 second
- Support 100+ concurrent users
- Handle 1000+ venues with 5000+ screens

### Security
- Role-based access control (RBAC)
- Secure file upload and storage
- Data encryption in transit and at rest
- Regular security audits
- GDPR compliance for EU expansion

### Availability
- 99.9% uptime target
- Mobile-responsive design
- Cross-browser compatibility
- Offline capability for critical functions

### Scalability
- Horizontal scaling for web servers
- Database optimization for growth
- CDN for static assets and photos
- Efficient caching strategies

## Phased Rollout Plan

### Phase 1: MVP (Months 1-3)
**Core Admin Functions**
- Gym network and venue management
- Screen inventory tracking
- Basic campaign logging
- Manual revenue entry
- Contract document storage
- Photo upload and approval workflow
- Basic reporting

**Partner Portal MVP**
- Owner dashboard with revenue view
- Manager photo upload
- White-label branding
- Basic user management

### Phase 2: Enhanced Features (Months 4-6)
**Advanced Admin**
- Automated notifications and reminders
- Enhanced reporting with analytics
- Bulk operations and imports
- Integration APIs for external systems

**Enhanced Partner Experience**
- Mobile app for managers
- Advanced revenue analytics
- Communication hub
- Performance benchmarking

### Phase 3: Scale & Optimization (Months 7-12)
**Business Intelligence**
- Predictive analytics for revenue
- Automated optimization suggestions
- Advanced campaign tracking
- Market insights and trends

**Platform Expansion**
- Multi-language support
- Advanced white-labeling
- Franchise management tools
- International expansion support

## Success Metrics

### Business Metrics
- **Operational Efficiency**: Reduce admin time per venue by 50%
- **Partner Satisfaction**: Achieve 90%+ partner satisfaction score
- **Photo Compliance**: Achieve 95%+ monthly photo submission rate
- **Revenue Accuracy**: Eliminate revenue calculation errors
- **Network Growth**: Support 3x venue growth within 12 months

### Technical Metrics
- **System Uptime**: Maintain 99.9%+ availability
- **User Adoption**: 95%+ active partner portal usage
- **Response Time**: Maintain <2 second page loads
- **Data Quality**: Achieve 98%+ data completeness
- **Security**: Zero security breaches or data leaks

## Risks & Mitigation

### Technical Risks
**Risk**: System performance degradation with scale
**Mitigation**: Implement comprehensive monitoring, auto-scaling, and performance optimization

**Risk**: Data loss or corruption
**Mitigation**: Automated backups, disaster recovery plan, data validation

**Risk**: Security vulnerabilities
**Mitigation**: Regular security audits, penetration testing, security-first development

### Business Risks
**Risk**: Partner adoption resistance
**Mitigation**: Comprehensive onboarding, training materials, phased rollout with early adopters

**Risk**: Revenue model complexity
**Mitigation**: Simple initial implementation, clear documentation, dedicated support

**Risk**: Market competition
**Mitigation**: Focus on operational excellence, partner relationships, rapid feature development

### Operational Risks
**Risk**: Manual data entry errors
**Mitigation**: Data validation, audit trails, bulk import tools, automated checks

**Risk**: Photo quality compliance issues
**Mitigation**: Clear guidelines, approval workflow, manager training, quality templates

## What We're Building First

We are building the MVP web platform that establishes the foundational operational infrastructure for GymGaze's gym advertising business. This includes:

1. **Complete admin back-office** for GymGaze team to manage gym networks, venues, screens, campaigns, and revenue
2. **Partner portal** with white-label branding for gym owners and managers to access their data and fulfill monthly requirements
3. **Photo collection and approval workflow** to ensure venue compliance and quality
4. **Revenue tracking system** to calculate and report monthly earnings per gym
5. **Basic reporting capabilities** for both internal operations and partner transparency

This foundation will enable GymGaze to scale from 14 locations to hundreds while maintaining operational excellence and partner satisfaction.