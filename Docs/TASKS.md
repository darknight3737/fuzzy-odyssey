# Selletive Development Tasks

## Project Overview
Building a B2B discovery platform with status-driven promotion tiers, focusing on Brazilian market with SEO optimization throughout. Following Makerkit boilerplate architecture with Next.js 15, Supabase, and TypeScript.

**Reference**: PRD.md - Technical Architecture & Implementation, Milestones & Sequencing

---

# [V] Phase 1: Foundation & Database Setup

## [V] Database Schema Implementation
**Reference**: PRD.md - Database Schema (lines 34-261)

### [V] Existing Makerkit Tables (Already Available)
**Reference**: apps/web/supabase/migrations/20221215192558_schema.sql

#### [V] Core Makerkit Tables
- **accounts**: User accounts (personal and team)
- **accounts_memberships**: Team membership management
- **roles**: Role definitions (owner, admin, editor, viewer)
- **role_permissions**: Permission system
- **invitations**: Team invitation system
- **subscriptions**: Subscription management with Stripe integration
- **subscription_items**: Subscription line items
- **billing_customers**: Billing customer management
- **orders**: Order management
- **order_items**: Order line items
- **notifications**: Notification system
- **config**: Feature flags and configuration

### [V] Selletive-Specific Tables (To Create)
#### [V] Businesses Table  
- Create businesses table with tier system
- Add verification status and domain rating fields
- Implement tier-based feature gating (cover_image_url, contact_enabled)
- Link to existing accounts table via account_id
- Create RLS policies for public viewing and owner editing

#### [V] Business Categories Table
- Create business_categories junction table
- Link businesses to categories with is_primary flag
- Create RLS policies for public viewing

#### [V] Categories Table
- Create hierarchical categories table
- Add parent_id for category hierarchy
- Implement level field (1-3) for category depth
- Create category_aliases table for SEO URL variations

#### [V] Locations Table
- Create locations table with hierarchical structure
- Add country_code, state_code for Brazilian focus
- Implement coordinates field for mapping
- Create business_locations junction table

#### [V] Reviews System
- Create reviews table with anonymous/verified options
- Add review_responses table for business owner replies
- Implement status field for moderation (pending, approved, rejected)
- Create RLS policies for public viewing and owner management

#### [V] Verification System
- Create verification_badges table
- Add badge_code and verification_url fields
- Implement automated verification tracking
- Create RLS policies for badge management

### [V] Premium Content Tables (Highlight/Spotlight Only)
#### [V] Business Services Table
- Create business_services table for paid tier features
- Add price_range and delivery_time fields
- Implement featured service prioritization
- Create RLS policies for tier-gated access

#### [V] Business Awards Table
- Create business_awards table for achievements showcase
- Add certificate_url for document uploads
- Implement featured award prioritization
- Create RLS policies for tier-gated access

#### [V] Business Cases Table
- Create business_cases table for case studies
- Add images array for case study visuals
- Implement featured case prioritization
- Create RLS policies for tier-gated access

---

# [ ] Phase 2: Authentication & User Management

## [ ] Existing Makerkit Auth System (Already Available)
**Reference**: apps/web/supabase/migrations/20221215192558_schema.sql

### [ ] Authentication Features
- Supabase Auth integration with email/password
- Email verification flow
- Password reset functionality
- User registration and management
- Team account creation and management

### [ ] Authorization System
- Role-based permission system (owner, admin, editor, viewer)
- Account membership management
- Team invitation system
- Permission checking utilities

### [ ] Selletive-Specific Auth Extensions
#### [ ] Business Association
- Link user accounts to business profiles
- Implement business ownership validation
- Add business team member management
- Create business-specific permission checks

#### [ ] User Context Providers
- Extend existing user workspace context for business features
- Add business-specific workspace context
- Implement business permission checking utilities
- Create business team management context

---

# Phase 3: Core Business Management

## [ ] Business Profile System
**Reference**: PRD.md - Business Page Database Fields (lines 1433-1569)

### [ ] Business CRUD Operations
- Create business profile creation/editing
- Implement business information validation
- Add logo and image upload functionality
- Create business slug generation

### [ ] Business Claiming Workflow
**Reference**: PRD.md - Business Claiming Workflow (lines 1972-2003)
- Create business claiming form
- Implement email domain verification
- Add claiming status management
- Create onboarding wizard for new owners

### [ ] Business Verification System
**Reference**: PRD.md - Business Verification Workflow (lines 2005-2040)
- Create badge generator with HTML/SVG/PNG options
- Implement automated badge verification crawler
- Add verification checklist validation
- Create verification status management

### [ ] Tier Management System
- Implement tier upgrade/downgrade flows
- Create tier-based feature gating
- Add premium content management (services, awards, cases)
- Implement tier-specific UI components

---

# Phase 4: Category & Location System

## [ ] Category Management
**Reference**: PRD.md - Services Categories Taxonomy (lines 439-545)

### [ ] Category Hierarchy Implementation
- Create category tree structure
- Implement auto-assignment of parent categories
- Add category aliases for SEO
- Create category selection interface

### [ ] Category Data Population
- Populate main categories (Advertising & Marketing, Creative & Visual, etc.)
- Add subcategories and specific services
- Implement category icons and descriptions
- Create category aliases for SEO optimization

## [ ] Location System
**Reference**: PRD.md - Multi-Level Location Handling (lines 727-866)

### [ ] Location Data Setup
- Populate Brazilian cities, states, and countries
- Implement location hierarchy (city → state → country)
- Add coordinates for mapping functionality
- Create location slug generation

### [ ] Location Selection UX
- Create location dropdown with search
- Implement city selection with auto-assignment
- Add location hierarchy display
- Create location-based filtering

---

# Phase 5: Public Pages & SEO

## [ ] Homepage Implementation
**Reference**: PRD.md - Site Structure (lines 1891-1967)

### [ ] Homepage Components
- Create hero section with search functionality
- Add featured categories display
- Implement top verified providers showcase
- Create "How it works" section

### [ ] SEO Foundation
**Reference**: PRD.md - SEO Requirements (lines 2234-2282)
- Implement meta tag management system
- Add structured data (JSON-LD) for businesses
- Create canonical URL management
- Implement proper heading hierarchy

## [ ] Category Pages
### [ ] Category Listing Pages
- Create category overview pages
- Implement category-specific business listings
- Add category descriptions and content
- Create category navigation

### [ ] Location-Based Category Pages (pSEO)
**Reference**: PRD.md - Location-Based Category Pages (lines 1905-1910)
- Create dynamic category-location pages
- Implement "Best [Category] in [Location]" format
- Add location-specific business filtering
- Create breadcrumb navigation

### [ ] SEO Optimization for Category Pages
- Implement unique meta titles and descriptions
- Add location-specific structured data
- Create internal linking structure
- Implement ISR for performance

## [ ] Business Profile Pages
### [ ] Public Business Profiles
- Create comprehensive business profile display
- Add reviews and testimonials section
- Implement contact information display
- Create verification badges and tier indicators

### [ ] SEO for Business Profiles
- Implement LocalBusiness schema markup
- Add unique meta descriptions per business
- Create service-specific H2 sections
- Implement canonical URLs

---

# Phase 6: Search & Discovery

## [ ] Search Functionality
**Reference**: PRD.md - Discovery & Search (lines 2170-2178)

### [ ] Search Implementation
- Create search API endpoints
- Implement search result ranking
- Add search filters (category, location, tier)
- Create search result pagination

### [ ] Advanced Filtering
- Implement category filtering
- Add location-based filtering
- Create tier and verification status filters
- Add sorting options (relevance, tier, rating)

### [ ] Search Results Page
- Create search results display
- Implement filter sidebar
- Add result sorting controls
- Create pagination component

---

# Phase 7: Review System

## [ ] Review Management
**Reference**: PRD.md - Review System (lines 272-276)

### [ ] Review Submission
- Create review submission form
- Implement anonymous and verified reviews
- Add review validation and moderation
- Create review status management

### [ ] Review Display
- Create review listing components
- Implement review rating display
- Add review response system for business owners
- Create review moderation interface

### [ ] Review Analytics
- Implement review aggregation
- Add rating calculations
- Create review analytics for business owners
- Implement review performance metrics

---

# Phase 8: Payment Integration

## [ ] Existing Makerkit Payment System (Already Available)
**Reference**: apps/web/supabase/migrations/20221215192558_schema.sql

### [ ] Payment Infrastructure
- Stripe payment gateway integration
- Subscription management system
- Billing customer management
- Order and order items tracking
- Payment status management

### [ ] Selletive-Specific Payment Extensions
#### [ ] Tier-Specific Subscriptions
- Configure Highlight tier ($19/mo) in Stripe
- Configure Spotlight tier ($129/mo) in Stripe
- Link subscription tiers to business features
- Implement tier upgrade/downgrade flows

#### [ ] Business Subscription Management
- Create business-specific subscription handling
- Link subscriptions to business accounts
- Implement tier-based feature gating
- Add subscription analytics for businesses

### [ ] Tier Purchase Workflows
**Reference**: PRD.md - Spotlight Tier Purchase Workflow (lines 2042-2088)
- Create Highlight tier purchase flow ($19/mo)
- Implement Spotlight tier purchase flow ($129/mo)
- Add tier upgrade/downgrade functionality
- Create payment success/failure handling

---

# Phase 9: Dashboard System

## [ ] User Dashboard
**Reference**: PRD.md - User Dashboard Pages (lines 1930-1958)

### [ ] Dashboard Home
- Create dashboard overview page
- Add profile status display
- Implement recent activity feed
- Create quick access navigation

### [ ] Profile Management
- Create business profile editor
- Implement service management
- Add image upload functionality
- Create profile completion tracking

### [ ] Promotion Dashboard
- Create tier status display
- Implement upgrade/downgrade interface
- Add badge generator interface
- Create verification progress tracking

### [ ] Analytics Dashboard
- Create profile views analytics
- Implement engagement metrics
- Add lead generation tracking
- Create performance insights

### [ ] Reviews Management
- Create review response interface
- Implement review request tools
- Add review analytics
- Create review moderation tools

### [ ] Billing Management
- Create subscription management interface
- Implement payment history display
- Add invoice download functionality
- Create billing settings

---

# Phase 10: Admin System

## [ ] Admin Dashboard
**Reference**: PRD.md - Admin Pages (lines 1960-1966)

### [ ] Admin Authentication
- Implement super admin authentication
- Create admin role verification
- Add admin access controls
- Create admin session management

### [ ] User Management
- Create user listing and management
- Implement user role assignment
- Add user suspension/activation
- Create user analytics

### [ ] Business Management
- Create business listing management
- Implement business verification override
- Add business tier management
- Create business analytics

### [ ] Review Moderation
- Create review moderation interface
- Implement review approval/rejection
- Add review quality monitoring
- Create moderation analytics

### [ ] Platform Analytics
- Create platform-wide metrics
- Implement growth tracking
- Add revenue analytics
- Create performance monitoring

---

# Phase 11: Internationalization

## [ ] Multi-Language Support
**Reference**: PRD.md - Localization & Internationalization (lines 2210-2216)

### [ ] Language Setup
- Configure i18n system for English/Portuguese
- Create translation files structure
- Implement language switching
- Add language-specific routing

### [ ] Content Translation
- Translate all static content
- Implement dynamic content translation
- Add business profile translation
- Create category/location translation

### [ ] SEO for Multiple Languages
- Implement hreflang tags
- Create language-specific URLs
- Add localized meta content
- Implement language-specific sitemaps

---

# Phase 12: Performance & Optimization

## [ ] Performance Optimization
**Reference**: PRD.md - Technical Considerations (lines 2781-2844)

### [ ] Core Web Vitals
- Optimize page load times (<2s)
- Implement image optimization
- Add lazy loading for components
- Create performance monitoring

### [ ] Caching Strategy
- Implement ISR for category pages
- Add Redis caching for database queries
- Create CDN integration
- Implement browser caching

### [ ] Database Optimization
- Add database indexes for search
- Implement query optimization
- Create connection pooling
- Add database monitoring

---

# Phase 13: Testing & Quality Assurance

## [ ] Testing Implementation
**Reference**: PRD.md - Testing Strategy (lines 1307-1364)

### [ ] Unit Testing
- Create component unit tests
- Implement utility function tests
- Add business logic tests
- Create test coverage reporting

### [ ] Integration Testing
- Create API endpoint tests
- Implement database integration tests
- Add authentication flow tests
- Create payment integration tests

### [ ] E2E Testing
- Create business claiming flow tests
- Implement verification workflow tests
- Add payment flow tests
- Create admin workflow tests

---

# Phase 14: Deployment & Launch

## [ ] Production Setup
**Reference**: PRD.md - Deployment & Environment (lines 1366-1429)

### [ ] Environment Configuration
- Set up production environment variables
- Configure Supabase production instance
- Add Stripe production keys
- Create email service configuration

### [ ] Deployment Pipeline
- Set up Vercel deployment
- Create CI/CD pipeline
- Add automated testing
- Implement deployment monitoring

### [ ] Launch Preparation
- Create launch campaign materials
- Set up analytics tracking
- Add error monitoring
- Create user onboarding flow

---

# Phase 15: Post-MVP Features (Future)

## [ ] Signal Feature Implementation
**Reference**: PRD.md - Signal Feature (lines 2667-2710)

### [ ] Signal Creation System
- Create signal submission form
- Implement project brief validation
- Add signal categorization
- Create signal status management

### [ ] Signal Matching Algorithm
- Implement provider matching logic
- Add category-based filtering
- Create location-based matching
- Implement signal distribution

### [ ] Signal Management
- Create signal dashboard
- Implement response tracking
- Add signal closure functionality
- Create signal analytics

## [ ] Contact Form System
**Reference**: PRD.md - Contact Form System (lines 374-431)

### [ ] Contact Form Implementation
- Create contact form for Highlight/Spotlight tiers
- Implement lead capture functionality
- Add email notifications
- Create contact request management

### [ ] Lead Management Dashboard
- Create lead tracking interface
- Implement response management
- Add lead analytics
- Create lead conversion tracking

---

# Phase 16: Advanced Features & Scaling

## [ ] Advanced Analytics
- Implement advanced business analytics
- Add competitor analysis
- Create market insights
- Implement predictive analytics

## [ ] API Development
- Create public API endpoints
- Implement API authentication
- Add rate limiting
- Create API documentation

## [ ] Mobile Optimization
- Implement mobile-first design
- Add progressive web app features
- Create mobile-specific optimizations
- Implement offline functionality

## [ ] International Expansion
- Add support for additional countries
- Implement multi-currency support
- Create region-specific features
- Add international payment methods

---

# Development Notes

## [ ] Code Organization
- Follow Makerkit boilerplate structure
- Use TypeScript throughout
- Implement proper error handling
- Add comprehensive logging

## [ ] Security Considerations
- Implement RLS policies for all tables
- Add input validation and sanitization
- Create secure authentication flows
- Implement proper authorization checks

## [ ] SEO Best Practices
- Implement structured data throughout
- Create proper meta tag management
- Add sitemap generation
- Implement canonical URL management

## [ ] Performance Monitoring
- Add Core Web Vitals tracking
- Implement error monitoring
- Create performance analytics
- Add user experience monitoring

CRv24.7 - Bye
