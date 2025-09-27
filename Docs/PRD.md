# Selletive: B2B Services & Software Discovery Platform

## TL;DR

Selletive is a B2B discovery platform designed to help businesses find and compare top software and service providers, with a primary focus on Advertising, Marketing, Creative, Development, and IT categories. The platform introduces status-driven promotion tiers to help businesses stand out, starting with a focus on the Brazilian market and expanding globally. Selletive empowers business owners to claim, verify, and promote their listings, while buyers benefit from transparent, high-quality information and reviews. New features include a "Signal" project-posting and matching system, auto-generated SEO category pages, and a robust business profile data model. **SEO optimization is a major requirement throughout the platform** to ensure maximum organic visibility and growth.

---

## Technical Architecture & Implementation

### Tech Stack

**Frontend**
- Next.js 15.4 with App Router
- React 18 with TypeScript
- Tailwind 4 CSS + Shadcn/ui components
**Backend & Database**
- Supabase (PostgreSQL)
- Supabase Auth for authentication
- Supabase Realtime for live updates
- Supabase Storage for file uploads

**Payment & External Services**
- Stripe for payment processing
- Resend for email notifications
- Google Analytics, Posthog & Search Console
- Vercel for deployment

**Development Tools**
- ESLint + Prettier for code quality
- Playwright for E2E testing

### Database Schema

#### Core Tables

**users**
```sql
id: uuid (primary key)
email: text (unique)
full_name: text
avatar_url: text
created_at: timestamp
updated_at: timestamp
email_verified: boolean
preferred_language: text (default: 'en')
```

**businesses**
```sql
id: uuid (primary key)
name: text
slug: text (unique)
description: text
website: text
phone: text
email: text
address: jsonb
logo_url: text
cover_image_url: text (nullable) -- Only Highlight/Spotlight tiers
employee_count: integer (nullable)
works_remotely: boolean (default: false)
founded_year: integer (nullable)
business_languages: text[] (nullable) -- ["Portuguese", "English", "Spanish"]
contact_enabled: boolean (default: false) -- Only Highlight/Spotlight tiers
tier: text (default: 'unclaimed', enum: ['unclaimed', 'claimed', 'verified', 'highlight', 'spotlight'])
verification_status: text (default: 'pending', enum: ['pending', 'verified', 'rejected'])
domain_rating: integer
created_at: timestamp
updated_at: timestamp
```

**business_users** (Ownership & Team Management)
```sql
id: uuid (primary key)
business_id: uuid (foreign key to businesses.id)
user_id: uuid (foreign key to users.id)
role: text (enum: ['owner', 'admin', 'editor', 'viewer'])
is_primary_owner: boolean (default: false)
invited_by: uuid (foreign key to users.id, nullable)
invited_at: timestamp
joined_at: timestamp
status: text (default: 'active', enum: ['active', 'pending', 'suspended'])
created_at: timestamp
updated_at: timestamp
```

**business_categories**
```sql
id: uuid (primary key)
business_id: uuid (foreign key to businesses.id)
category_id: uuid (foreign key to categories.id)
is_primary: boolean
created_at: timestamp
```

**categories**
```sql
id: uuid (primary key)
name: text
slug: text (unique)
description: text
parent_id: uuid (foreign key to categories.id, nullable)
icon: text
created_at: timestamp
updated_at: timestamp
```

**category_aliases**
```sql
id: uuid (primary key)
category_id: uuid (foreign key to categories.id)
alias_slug: text (unique)
alias_name: text
is_primary: boolean (default: false)
created_at: timestamp
```

**locations**
```sql
id: uuid (primary key)
name: text
slug: text (unique)
type: text (enum: ['city', 'state', 'country'])
parent_id: uuid (foreign key to locations.id, nullable)
coordinates: point
created_at: timestamp
```

**business_locations**
```sql
id: uuid (primary key)
business_id: uuid (foreign key to businesses.id)
location_id: uuid (foreign key to locations.id)
is_primary: boolean
created_at: timestamp
```

**reviews**
```sql
id: uuid (primary key)
business_id: uuid (foreign key to businesses.id)
user_id: uuid (foreign key to users.id, nullable) -- Nullable for anonymous reviews
reviewer_name: text
reviewer_email: text
rating: integer (1-5)
title: text
content: text
status: text (default: 'pending', enum: ['pending', 'approved', 'rejected'])
is_verified: boolean (default: false) -- Verified if user_id exists
created_at: timestamp
updated_at: timestamp
```

**review_responses** (Business Owner Responses)
```sql
id: uuid (primary key)
review_id: uuid (foreign key to reviews.id)
user_id: uuid (foreign key to users.id) -- Must be business owner/admin
response_text: text
status: text (default: 'active', enum: ['active', 'hidden'])
created_at: timestamp
updated_at: timestamp
```

**subscriptions**
```sql
id: uuid (primary key)
business_id: uuid (foreign key to businesses.id)
stripe_subscription_id: text
stripe_customer_id: text
tier: text (enum: ['highlight', 'spotlight'])
status: text (enum: ['active', 'canceled', 'past_due'])
current_period_start: timestamp
current_period_end: timestamp
canceled_at: timestamp
created_at: timestamp
updated_at: timestamp
```

**verification_badges**
```sql
id: uuid (primary key)
business_id: uuid (foreign key to businesses.id)
badge_code: text (unique)
verification_url: text
is_verified: boolean
verified_at: timestamp
last_checked: timestamp
created_at: timestamp
```

**signals** (Future Feature - Post MVP)
```sql
id: uuid (primary key)
sender_business_id: uuid (foreign key to businesses.id)
title: text
description: text
category_id: uuid (foreign key to categories.id)
location_id: uuid (foreign key to locations.id)
budget_range: text
timeline: text
contact_preference: text
status: text (default: 'open', enum: ['open', 'in_progress', 'closed'])
created_at: timestamp
updated_at: timestamp
```

**Note**: Signals feature will be developed after MVP launch to focus on core business claiming and discovery functionality first.

**business_services** (Highlight/Spotlight Only) — IMPLEMENTED
```sql
id: uuid (primary key)
business_id: uuid (foreign key to businesses.id)
title: text -- User-defined service title
description: text -- User-defined service description
price_range: text (nullable) -- "Under $1K", "$1K-$5K", "$5K-$10K", "$10K+"
delivery_time: text (nullable) -- "1-2 weeks", "1 month", "2-3 months", "Custom"
is_featured: boolean (default: false) -- Featured service
display_order: integer (default: 0)
created_at: timestamp
updated_at: timestamp
```

**business_awards** (Highlight/Spotlight Only) — IMPLEMENTED
```sql
id: uuid (primary key)
business_id: uuid (foreign key to businesses.id)
title: text -- User-defined award title
issuer: text -- Award issuer organization
year: integer -- Award year
description: text (nullable) -- Award description
certificate_url: text (nullable) -- Certificate image/document
is_featured: boolean (default: false) -- Featured award
display_order: integer (default: 0)
created_at: timestamp
updated_at: timestamp
```

**business_cases** (Highlight/Spotlight Only) — IMPLEMENTED
```sql
id: uuid (primary key)
business_id: uuid (foreign key to businesses.id)
title: text -- User-defined case study title
client_name: text (nullable) -- Client name (can be anonymized)
industry: text (nullable) -- Client industry
project_type: text (nullable) -- Type of project
description: text -- Project description
challenge: text (nullable) -- Project challenge
solution: text (nullable) -- Solution provided
results: text (nullable) -- Project results
duration: text (nullable) -- Project duration
budget_range: text (nullable) -- Project budget
images: text[] (nullable) -- Case study images
is_featured: boolean (default: false) -- Featured case study
display_order: integer (default: 0)
created_at: timestamp
updated_at: timestamp
```

---

#### Ownership & Permission System

**Business Ownership Model:**
- **Primary Owner**: One user per business (first claimer)
- **Team Members**: Multiple users with different roles
- **Role-Based Access**: Owner > Admin > Editor > Viewer
- **Invitation System**: Owners can invite team members

**Review System:**
- **Anonymous Reviews**: No user_id required
- **Verified Reviews**: Linked to user accounts
- **Owner Responses**: Business owners can respond to reviews
- **Moderation**: Admin approval for all reviews

**Tier-Based Business Profile Features:**

**All Tiers:**
- Basic business information (name, description, website, phone, email)
- Logo upload
- Employee count, remote work status, founded year
- Business languages
- View all reviews

**Verified and above:**
- Reply and manage reviews
- Displayed on website category pages

**Highlight & Spotlight Only:**
- Display on top of category pages
- Cover image upload
- Services management (unlimited)
- Awards showcase (unlimited)
- Case studies (unlimited)
- Featured content prioritization
- Contact form enabled (Future Feature)

**Permission Matrix:**
```typescript
type BusinessTier = 'unclaimed' | 'claimed' | 'verified' | 'highlight' | 'spotlight';

const tierPermissions = {
  unclaimed: ['view_basic'],
  claimed: ['view_basic', 'edit_basic'],
  verified: ['view_basic', 'edit_basic', 'view_verified_badge'],
  highlight: ['view_basic', 'edit_basic', 'view_verified_badge', 'edit_premium_content'],
  spotlight: ['view_basic', 'edit_basic', 'view_verified_badge', 'edit_premium_content', 'priority_placement']
};

// Check if business can edit premium content
const canEditPremiumContent = (business: Business): boolean => {
  return ['highlight', 'spotlight'].includes(business.tier);
};
```

**RLS Policies for Tier-Gated Content:**
```sql
-- Cover image access
CREATE POLICY "Only highlight/spotlight can edit cover image" ON businesses
  FOR UPDATE USING (
    tier IN ('highlight', 'spotlight') AND
    id IN (
      SELECT business_id FROM business_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Services management
CREATE POLICY "Only highlight/spotlight can manage services" ON business_services
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE tier IN ('highlight', 'spotlight') AND
      id IN (
        SELECT business_id FROM business_users 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );
```

**Business Profile Enhancement Strategy:**
- **Free Tiers**: Basic information only
- **Paid Tiers**: Rich content showcase
- **Content Management**: Easy-to-use forms
- **SEO Benefits**: More content = better rankings
- **Conversion Driver**: Premium features incentivize upgrades

---

**Role-Based Permission Matrix:**
```typescript
type BusinessRole = 'owner' | 'admin' | 'editor' | 'viewer';

const rolePermissions = {
  owner: ['all'], // Full access
  admin: ['edit_business', 'manage_reviews', 'manage_team', 'view_analytics'],
  editor: ['edit_business', 'manage_reviews', 'view_analytics'],
  viewer: ['view_analytics']
};

// Permission check function
const canUserAction = (user: User, business: Business, action: string): boolean => {
  const businessUser = business.users.find(bu => bu.user_id === user.id);
  if (!businessUser) return false;
  
  return rolePermissions[businessUser.role].includes(action) || 
         rolePermissions[businessUser.role].includes('all');
};
```

**Contact Form System (Future Feature - Post MVP)**

**Note**: Contact form functionality will be developed after MVP launch. For MVP, businesses will use their existing contact methods (email, phone, website).

**Future Contact Form Features:**
- **Lead Capture**: Visitors can contact businesses directly
- **Form Fields**: Name, email, phone, message, project details
- **Email Notifications**: Business owners receive contact requests
- **Dashboard Management**: View and respond to leads
- **Analytics**: Track contact form conversions

**Future Contact Form Implementation:**
```typescript
// Contact form submission (Future Implementation)
const submitContactForm = async (businessId: string, formData: ContactFormData) => {
  const business = await getBusinessById(businessId);
  
  // Check if contact form is enabled
  if (!business.contact_enabled) {
    throw new Error('Contact form not available for this business');
  }
  
  // Create contact request
  const contactRequest = await createContactRequest({
    business_id: businessId,
    sender_name: formData.name,
    sender_email: formData.email,
    sender_phone: formData.phone,
    message: formData.message,
    project_details: formData.projectDetails,
    status: 'new'
  });
  
  // Send notification to business owners
  await notifyBusinessOwners(businessId, contactRequest);
  
  return contactRequest;
};
```

**Future Contact Requests Table:**
```sql
CREATE TABLE contact_requests (
  id: uuid (primary key)
  business_id: uuid (foreign key to businesses.id)
  sender_name: text
  sender_email: text
  sender_phone: text (nullable)
  message: text
  project_details: jsonb (nullable) -- Project requirements, budget, timeline
  status: text (default: 'new', enum: ['new', 'contacted', 'qualified', 'closed'])
  responded_by: uuid (foreign key to users.id, nullable)
  responded_at: timestamp (nullable)
  notes: text (nullable) -- Internal notes
  created_at: timestamp
  updated_at: timestamp
);
```

---

---

#### Tables Options

##### Services Categories Taxonomy

**Hierarchical Category System with Auto-Assignment**

**Business Selection Rules:**
- Users select **1-3 specific service categories** (lowest level)
- Parent categories are **automatically assigned**
- Primary category determines main business focus
- Secondary categories allow service diversity

**URL Strategy:**
- **Primary URLs**: Flat structure (`/azure-consulting`)
- **Hierarchical URLs**: Redirect to flat URLs (`/it-services/cloud-consulting/azure-consulting` → `/azure-consulting`)
- **SEO Benefits**: Clean URLs + complete category context

**Example Business Assignment:**
```
Business selects: "Azure Consulting", "WordPress Development", "UI Design"

Auto-assigned hierarchy:
├── IT Services
│   ├── Cloud Consulting
│   │   └── Azure Consulting (Primary)
│   └── Web Development
│       └── WordPress Development (Secondary)
└── Creative & Visual
    └── User Experience (UX/UI)
        └── UI Design (Secondary)

URLs generated:
- /azure-consulting (Primary page)
- /wordpress-development (Secondary page)
- /ui-design (Secondary page)
```

**Database Schema Implementation:**

```sql
-- Hierarchical categories table
CREATE TABLE categories (
  id: uuid (primary key)
  name: text                    -- "Azure Consulting"
  slug: text (unique)           -- "azure-consulting"
  description: text
  parent_id: uuid (nullable)    -- Foreign key to parent category
  level: integer (1-3)          -- 1=main, 2=sub, 3=specific
  icon: text
  is_active: boolean (default: true)
  created_at: timestamp
  updated_at: timestamp
);

-- Business category assignments
CREATE TABLE business_categories (
  id: uuid (primary key)
  business_id: uuid (foreign key to businesses.id)
  category_id: uuid (foreign key to categories.id)
  is_primary: boolean (default: false)
  display_order: integer (1-3)
  created_at: timestamp
);

-- Category aliases for SEO
CREATE TABLE category_aliases (
  id: uuid (primary key)
  category_id: uuid (foreign key to categories.id)
  alias_slug: text (unique)    -- "cloud-services", "microsoft-azure"
  alias_name: text             -- "Cloud Services", "Microsoft Azure"
  created_at: timestamp
);
```

**Technical Implementation:**

```typescript
// Auto-assign parent categories
const assignParentCategories = async (selectedCategoryIds: string[]) => {
  const categories = await getCategoriesByIds(selectedCategoryIds);
  const allCategories = [];
  
  for (const category of categories) {
    // Add the selected category
    allCategories.push(category);
    
    // Auto-assign parent categories
    let parent = await getCategoryParent(category.parent_id);
    while (parent) {
      allCategories.push(parent);
      parent = await getCategoryParent(parent.parent_id);
    }
  }
  
  return allCategories;
};

// URL generation with redirects
const generateCategoryUrls = (category: Category) => {
  const flatUrl = `/${category.slug}`;
  const hierarchicalUrl = buildHierarchicalUrl(category);
  
  return {
    primary: flatUrl,
    redirects: [hierarchicalUrl],
    aliases: category.aliases.map(alias => `/${alias.slug}`)
  };
};
```

**Advertising & Marketing**
* **Advertising**
    * 360° Advertising
    * Advertising
    * Advertising Campaign
    * Advertising Production
    * Creative
    * Full-Service
* **Branding**
    * Brand Activation
    * Branding
    * Brand Strategy
    * Employer Branding
    * Rebranding
* **Marketing**
    * Affiliate Marketing
    * B2B Marketing
    * Blockchain Marketing
    * Luxury Marketing
    * Marketing
    * Sports Marketing

***

**Creative & Visual**
* **Design**
    * Brochure Design
    * Design
    * Illustration
    * Logo Design
    * Merchandising
    * Print Design
* **Photography**
    * Event Photography
    * Fashion Photography
    * Food Photography
    * Photo Editing
    * Photography
    * Product Photography
* **User Experience (UX/UI)**
    * Interface Testing
    * Usability Testing
    * User Experience (UX/UI)
    * User Testing
    * UX Design
    * UX optimization

***

**Development & Product**
* **Ecommerce**
    * Dropshipping
    * Ecommerce
    * eCommerce Consulting
    * eCommerce Development
    * E-Commerce Hosting
    * Shopify Development
* **Web Design**
    * Front End Development
    * Landing Page Design
    * Web Design
    * Web Hosting Management
    * Website Revamping
* **Web Development**
    * IoT Development
    * Programming
    * Prototype Development
    * Web Development
    * Webflow Development
    * Wordpress Development

***

**IT Services**
* **Blockchain Development**
    * Blockchain Consulting
    * Blockchain Development
    * Ethereum
    * Initial Coin Offering Consulting
    * Smart Contract Development
    * Web3 Development
* **Cloud Consulting**
    * AWS Consulting
    * Azure Consulting
    * Cloud Consulting
    * Cloud Security
    * Cloud Storage
    * SaaS Strategy Consulting
* **Cyber Security**
    * Account Takeover Prevention (ATO)
    * Auth0 IAM Solution
    * Cyber Security
    * Data Protection
    * Digital Forensics
    * Penetration Testing

**Financial & Professeional Services**
(To complete later)


---

##### Software Categories Taxonomy
(To complete later)

---

### API Endpoints & Data Flow

#### Public API Routes

**GET /api/businesses**
- Query parameters: category, location, tier, verified, search, page, limit
- Returns: Paginated list of businesses with filters
- SEO: Generates proper meta tags and structured data

**GET /api/businesses/[slug]**
- Returns: Single business profile with reviews and analytics
- SEO: Full schema markup, meta tags, canonical URL

**GET /api/categories**
- Returns: All categories with hierarchy
- SEO: Category listing with proper H1/H2 structure

**GET /api/categories/[slug]**
- Returns: Category details with business listings
- SEO: Category page with location-based content

**GET /api/[category]/[location-slug]**
- Returns: Category-location specific business listings
- SEO: pSEO page with "Best [Category] in [Location]" format
- **Location slug formats**:
  - Country: `/api/digital-marketing/brazil-br`
  - State: `/api/digital-marketing/sao-paulo-sp-br`
  - City: `/api/digital-marketing/sao-paulo-sp-br`
- Supports multiple location levels for comprehensive SEO coverage

**GET /api/search**
- Query parameters: q, category, location, tier, verified
- Returns: Search results with relevance scoring
- SEO: Search results page with proper meta tags

#### Protected API Routes

**POST /api/businesses/claim**
- Body: { business_id, email, terms_accepted }
- Returns: Claim status and verification email sent

**POST /api/businesses/[id]/verify**
- Body: { badge_code }
- Returns: Verification status and requirements

**POST /api/subscriptions/create**
- Body: { tier, payment_method_id }
- Returns: Subscription status and payment confirmation

**GET /api/dashboard/analytics**
- Returns: Business performance metrics
- Authentication: Required

**POST /api/reviews**
- Body: { business_id, rating, title, content, reviewer_name, reviewer_email }
- Returns: Review submission status

#### Admin API Routes

**GET /api/admin/businesses**
- Returns: All businesses with moderation status
- Authentication: Super admin required

**PUT /api/admin/businesses/[id]/moderate**
- Body: { action, reason }
- Returns: Moderation result

**GET /api/admin/analytics**
- Returns: Platform-wide metrics
- Authentication: Super admin required

---

### Multi-Level Location Handling

#### Location Slug Structure

**Location slugs follow this pattern**: `[name]-[code]-[country-code]`

**Examples:**
- **Country**: `brazil-br`, `united-states-us`
- **State**: `sao-paulo-sp-br`, `california-ca-us`
- **City**: `sao-paulo-sp-br`, `san-francisco-ca-us`

#### Simple Location System

**Location Selection Strategy:**
- **User selects**: Any city from dropdown
- **Auto-assigned**: State and country automatically
- **URL Generation**: Creates all three location levels

**URL Structure:**
```
/category/country                    → "Best Marketing Agencies in Brazil"
/category/country-state             → "Best Marketing Agencies in São Paulo State"  
/category/country-state-city        → "Best Marketing Agencies in São Paulo City"
```

**Example URLs:**
```
/marketing-agencies/brazil
/marketing-agencies/brazil-sao-paulo
/marketing-agencies/brazil-sao-paulo-sao-paulo
```

#### Database Location Structure

```sql
-- Simple locations table
CREATE TABLE locations (
  id: uuid (primary key)
  name: text                    -- "São Paulo"
  slug: text (unique)           -- "brazil-sao-paulo-sao-paulo"
  type: text                    -- 'city', 'state', 'country'
  parent_id: uuid (nullable)    -- Foreign key to parent location
  country_code: text            -- "br"
  state_code: text              -- "sp" (nullable for countries)
  coordinates: point            -- Latitude/longitude
  created_at: timestamp
  updated_at: timestamp
);

-- Location hierarchy examples
INSERT INTO locations VALUES
('loc-1', 'Brazil', 'brazil', 'country', NULL, 'br', NULL, NULL),
('loc-2', 'São Paulo', 'brazil-sao-paulo', 'state', 'loc-1', 'br', 'sp', NULL),
('loc-3', 'São Paulo', 'brazil-sao-paulo-sao-paulo', 'city', 'loc-2', 'br', 'sp', point(-23.5505, -46.6333));
```

#### Location Data Source

**Recommended Approach:**
- **Primary**: Use external city database (GeoNames, REST Countries API)
- **Fallback**: Manual entry for missing locations
- **Update**: Periodic sync with external data

**External Data Sources:**
```typescript
// GeoNames API for cities
const getCitiesByCountry = async (countryCode: string) => {
  const response = await fetch(`http://api.geonames.org/searchJSON?country=${countryCode}&featureClass=P&maxRows=1000&username=demo`);
  return response.json();
};

// REST Countries API for countries/states
const getCountries = async () => {
  const response = await fetch('https://restcountries.com/v3.1/all');
  return response.json();
};
```

#### Location Selection UX

**Simple Dropdown with Search:**
```typescript
// Location selector component
const LocationSelector = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  
  const cities = useMemo(() => 
    allCities.filter(city => 
      city.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm]
  );
  
  return (
    <Combobox>
      <ComboboxInput 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for your city..."
      />
      <ComboboxOptions>
        {cities.map(city => (
          <ComboboxOption key={city.id} value={city}>
            {city.name}, {city.state}, {city.country}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
};
```

#### Auto-Assignment Logic

```typescript
// Auto-assign parent locations
const assignLocationHierarchy = async (cityId: string) => {
  const city = await getLocationById(cityId);
  const state = await getLocationById(city.parent_id);
  const country = await getLocationById(state.parent_id);
  
  return {
    city: city,
    state: state,
    country: country,
    allLevels: [city, state, country]
  };
};

// Generate all URL paths for a business
const generateLocationUrls = (locationHierarchy: LocationHierarchy) => {
  const { city, state, country } = locationHierarchy;
  
  return {
    country: `/${category}/${country.slug}`,
    state: `/${category}/${state.slug}`,
    city: `/${category}/${city.slug}`
  };
};
```

#### Category Aliases Implementation

**Category aliases allow multiple URLs to serve identical content:**

```sql
-- Category aliases table
CREATE TABLE category_aliases (
  id: uuid (primary key)
  category_id: uuid (foreign key to categories.id)
  alias_slug: text (unique)           -- "ads-agencies", "marketing-agencies"
  alias_name: text                    -- "Ads Agencies", "Marketing Agencies"
  is_primary: boolean (default: false)
  created_at: timestamp
);

-- Example aliases for Digital Marketing
INSERT INTO category_aliases VALUES
('alias-1', 'cat-digital-marketing', 'ads-agencies', 'Ads Agencies', false),
('alias-2', 'cat-digital-marketing', 'marketing-agencies', 'Marketing Agencies', false),
('alias-3', 'cat-digital-marketing', 'online-marketing', 'Online Marketing', false);
```

**URL Structure with Aliases:**
```
/marketing-agencies/brazil                    → Primary category page
/marketing-agencies/brazil-sao-paulo         → State level page
/marketing-agencies/brazil-sao-paulo-sao-paulo → City level page

/ads-agencies/brazil                          → Alias page (same content)
/ads-agencies/brazil-sao-paulo               → Alias state page
/ads-agencies/brazil-sao-paulo-sao-paulo     → Alias city page
```

**Technical Implementation:**
```typescript
// Dynamic route handler: /[category]/[location]/page.tsx
export async function generateStaticParams() {
  const categories = await getCategoriesWithAliases();
  const locations = await getLocations();
  
  const params = [];
  
  for (const category of categories) {
    for (const location of locations) {
      // Generate params for primary category
      params.push({
        category: category.slug,
        location: location.slug
      });
      
      // Generate params for each alias
      for (const alias of category.aliases) {
        params.push({
          category: alias.slug,
          location: location.slug
        });
      }
    }
  }
  
  return params;
}

// Page component handles both primary and alias routes
export default async function CategoryLocationPage({ params }) {
  const { category, location } = params;
  
  // Resolve alias to primary category
  const primaryCategory = await resolveCategoryFromAlias(category);
  const locationData = await getLocationBySlug(location);
  
  // Generate page content
  const pageData = await generateCategoryLocationPage(primaryCategory, locationData);
  
  return <CategoryLocationTemplate {...pageData} />;
}
```

#### Business Location Assignment

```typescript
type BusinessLocation = {
  business_id: string;
  location_id: string;
  is_primary: boolean;
  location_level: 'city' | 'state' | 'country';
};

// A business can be associated with multiple location levels
const businessLocations = [
  { business_id: 'business-1', location_id: 'sao-paulo-city', is_primary: true, location_level: 'city' },
  { business_id: 'business-1', location_id: 'sao-paulo-state', is_primary: false, location_level: 'state' },
  { business_id: 'business-1', location_id: 'brazil-country', is_primary: false, location_level: 'country' }
];
```

#### SEO Implementation

**Each location page gets unique content:**

```typescript
// /digital-marketing/sao-paulo-sp-br
const generateLocationPage = (category: string, location: Location) => {
  const title = `Best ${category} Companies in ${location.name}`;
  const description = `Find top ${category} providers in ${location.name}, ${location.state || location.country}. Verified reviews, ratings, and contact information.`;
  
  return {
    title,
    description,
    h1: title,
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: category, url: `/${category}` },
      { name: location.name, url: `/${category}/${location.slug}` }
    ]
  };
};
```

#### Performance Optimization Strategy

**Resource Management for Dynamic Pages:**

```typescript
// Next.js ISR Configuration
export const revalidate = 3600; // Revalidate every hour

// Database optimization
const getBusinessesByCategoryLocation = async (categoryId: string, locationId: string) => {
  return await supabase
    .from('businesses')
    .select(`
      *,
      business_categories!inner(category_id),
      business_locations!inner(location_id),
      reviews(rating)
    `)
    .eq('business_categories.category_id', categoryId)
    .eq('business_locations.location_id', locationId)
    .eq('tier', 'verified', { foreignTable: 'businesses' })
    .order('tier', { ascending: false })
    .limit(50);
};

// Caching strategy
const cacheKey = `category-location-${categoryId}-${locationId}`;
const cachedData = await redis.get(cacheKey);

if (!cachedData) {
  const data = await getBusinessesByCategoryLocation(categoryId, locationId);
  await redis.setex(cacheKey, 3600, JSON.stringify(data)); // Cache for 1 hour
  return data;
}

return JSON.parse(cachedData);
```

**Estimated Page Count:**
- Categories: ~20 main categories
- Aliases per category: ~3-5 aliases
- Locations: ~50 Brazilian cities/states/countries
- **Total pages**: ~20 × 4 × 50 = **4,000 pages**
- **With ISR**: Only generates pages when accessed
- **Memory usage**: Minimal (cached data only)

#### URL Generation Examples

**Brazilian Market Focus:**
```
/marketing-agencies/brazil
/marketing-agencies/brazil-sao-paulo
/marketing-agencies/brazil-sao-paulo-sao-paulo
/marketing-agencies/brazil-rio-de-janeiro
/marketing-agencies/brazil-rio-de-janeiro-rio-de-janeiro
/marketing-agencies/brazil-minas-gerais
/marketing-agencies/brazil-minas-gerais-belo-horizonte
```

**Future International Expansion:**
```
/marketing-agencies/united-states
/marketing-agencies/united-states-california
/marketing-agencies/united-states-california-san-francisco
/marketing-agencies/united-states-new-york
/marketing-agencies/united-states-new-york-manhattan
```

**Complete URL Matrix:**
- **Categories**: ~20 main categories
- **Aliases**: ~3-5 per category = ~80 total category variations
- **Locations**: ~50 Brazilian locations × 3 levels = ~150 location variations
- **Total URLs**: ~80 × 150 = **12,000 URLs**
- **With ISR**: Only generates when accessed
- **Memory**: Minimal (cached data only)

---

### Component Architecture

#### Page Components

**Public Pages**
```
app/
├── page.tsx (Homepage)
├── categories/
│   ├── page.tsx (Category listing)
│   └── [slug]/
│       └── page.tsx (Category page)
├── [category]/
│   ├── page.tsx (Category overview - all locations)
│   └── [location-slug]/
│       └── page.tsx (Category-location page)
├── company/
│   └── [slug]/
│       └── page.tsx (Business profile)
├── search/
│   └── page.tsx (Search results)
└── static/
    ├── about/
    ├── pricing/
    ├── terms/
    └── privacy/
```

**Dashboard Pages**
```
app/dashboard/
├── page.tsx (Dashboard home)
├── profile/
│   └── page.tsx (Profile management)
├── promote/
│   └── page.tsx (Promotion tiers)
├── analytics/
│   └── page.tsx (Analytics dashboard)
├── reviews/
│   └── page.tsx (Reviews management)
└── billing/
    └── page.tsx (Billing management)
```

#### Reusable Components

**Layout Components**
```
components/
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Navigation.tsx
│   └── Sidebar.tsx
├── ui/ (Shadcn components)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── ...
└── forms/
    ├── BusinessClaimForm.tsx
    ├── ReviewForm.tsx
    └── SubscriptionForm.tsx
```

**Business Components**
```
components/business/
├── BusinessCard.tsx
├── BusinessProfile.tsx
├── BusinessList.tsx
├── CategoryFilter.tsx
├── LocationFilter.tsx
└── TierBadge.tsx
```

**Dashboard Components**
```
components/dashboard/
├── DashboardStats.tsx
├── ProfileEditor.tsx
├── TierUpgrade.tsx
├── AnalyticsChart.tsx
└── ReviewManager.tsx
```

### State Management

#### Server State (React Query)
```typescript
// Business data
const { data: businesses, isLoading } = useQuery({
  queryKey: ['businesses', filters],
  queryFn: () => fetchBusinesses(filters)
});

// User profile
const { data: profile, mutate: updateProfile } = useMutation({
  mutationFn: updateBusinessProfile,
  onSuccess: () => queryClient.invalidateQueries(['profile'])
});
```

#### Client State (React useState)
```typescript
// Form state
const [formData, setFormData] = useState({
  name: '',
  description: '',
  website: ''
});

// UI state
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### Global State (Context)
```typescript
// Authentication context
const AuthContext = createContext<{
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}>({});

// Language context
const LanguageContext = createContext<{
  language: 'en' | 'pt';
  setLanguage: (lang: 'en' | 'pt') => void;
}>({});
```

### Authentication & Authorization

#### Authentication Flow
1. **Sign Up**: Email/password with email verification
2. **Sign In**: Email/password with JWT tokens
3. **Password Reset**: Email-based reset flow
4. **Social Login**: Google OAuth (future)

#### Authorization Levels
```typescript
// User roles
type UserRole = 'anonymous' | 'user' | 'business_owner' | 'admin';

// Permission checks
const canEditBusiness = (user: User, business: Business) => {
  return user.id === business.claimed_by || user.role === 'admin';
};

const canAccessDashboard = (user: User) => {
  return user.role !== 'anonymous';
};
```

#### RLS Policies
```sql
-- Businesses table
CREATE POLICY "Users can view all businesses" ON businesses
  FOR SELECT USING (true);

CREATE POLICY "Business owners can edit their business" ON businesses
  FOR UPDATE USING (auth.uid() = claimed_by);

-- Reviews table
CREATE POLICY "Users can view approved reviews" ON reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Business owners can view their reviews" ON reviews
  FOR SELECT USING (business_id IN (
    SELECT id FROM businesses WHERE claimed_by = auth.uid()
  ));
```

### Error Handling & Validation

#### Form Validation (Zod)
```typescript
const businessSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  website: z.string().url('Must be a valid URL'),
  email: z.string().email('Must be a valid email'),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postal_code: z.string()
  })
});
```

#### Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### API Error Handling
```typescript
const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        redirect('/login');
        break;
      case 403:
        showToast('You do not have permission to perform this action', 'error');
        break;
      case 404:
        notFound();
        break;
      default:
        showToast('Something went wrong. Please try again.', 'error');
    }
  }
};
```

### Testing Strategy

#### Unit Tests
```typescript
// Component testing
describe('BusinessCard', () => {
  it('renders business information correctly', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText(mockBusiness.name)).toBeInTheDocument();
    expect(screen.getByText(mockBusiness.description)).toBeInTheDocument();
  });

  it('shows verification badge for verified businesses', () => {
    render(<BusinessCard business={verifiedBusiness} />);
    expect(screen.getByTestId('verification-badge')).toBeInTheDocument();
  });
});

// Utility function testing
describe('formatPhoneNumber', () => {
  it('formats Brazilian phone numbers correctly', () => {
    expect(formatPhoneNumber('11987654321')).toBe('+55 (11) 98765-4321');
  });
});
```

#### Integration Tests
```typescript
// API endpoint testing
describe('/api/businesses/claim', () => {
  it('allows business claiming with valid email domain', async () => {
    const response = await request(app)
      .post('/api/businesses/claim')
      .send({
        business_id: 'valid-uuid',
        email: 'owner@business.com',
        terms_accepted: true
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('pending_verification');
  });
});
```

#### E2E Tests (Playwright)
```typescript
// Business claiming flow
test('business owner can claim their business', async ({ page }) => {
  await page.goto('/company/test-business');
  await page.click('[data-testid="claim-business"]');
  await page.fill('[data-testid="email-input"]', 'owner@testbusiness.com');
  await page.check('[data-testid="terms-checkbox"]');
  await page.click('[data-testid="submit-claim"]');
  
  await expect(page.locator('[data-testid="verification-sent"]')).toBeVisible();
});
```

### Deployment & Environment

#### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
RESEND_API_KEY=your_resend_api_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

#### Build & Deploy
```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:e2e": "playwright test",
    "db:generate": "supabase gen types typescript --local > types/database.ts",
    "db:migrate": "supabase migration up --include-all",
    "db:reset": "supabase db reset"
  }
}
```

#### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

#### Supabase Setup
```bash
# Initialize Supabase
supabase init
supabase start

# Create migrations
supabase migration new create_businesses_table
supabase migration new create_categories_table
supabase migration new create_reviews_table

# Apply migrations
supabase migration up --include-all

# Generate types
supabase gen types typescript --local > types/database.ts
```

---

## Business Page Database Fields

### Core Business Information
```typescript
type Business = {
  // Basic Information
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  website: string;
  phone: string;
  email: string;
  
  // Visual Assets
  logo_url: string;
  cover_image_url: string;
  gallery_images: string[];
  
  // Location & Contact
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Business Details
  founded_year?: number;
  employee_count?: string;
  annual_revenue?: string;
  languages: string[];
  timezone: string;
  
  // Services & Specialties
  services: string[];
  industries: string[];
  technologies: string[];
  certifications: string[];
  
  // Status & Verification
  tier: 'unclaimed' | 'claimed' | 'verified' | 'highlight' | 'spotlight';
  verification_status: 'pending' | 'verified' | 'rejected';
  claimed_by?: string;
  claimed_at?: Date;
  verified_at?: Date;
  
  // SEO & Analytics
  meta_title: string;
  meta_description: string;
  keywords: string[];
  canonical_url: string;
  page_views: number;
  contact_clicks: number;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
};
```

### Business Relationships
```typescript
type BusinessCategory = {
  id: string;
  business_id: string;
  category_id: string;
  is_primary: boolean;
  created_at: Date;
};

type BusinessLocation = {
  id: string;
  business_id: string;
  location_id: string;
  is_primary: boolean;
  created_at: Date;
};

type BusinessReview = {
  id: string;
  business_id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
};
```

### SEO Schema Markup
```typescript
type BusinessSchema = {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  name: string;
  description: string;
  url: string;
  telephone: string;
  email: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
    postalCode: string;
  };
  geo: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
  review?: Array<{
    "@type": "Review";
    author: { "@type": "Person"; name: string };
    reviewRating: { "@type": "Rating"; ratingValue: number };
    reviewBody: string;
  }>;
  serviceArea?: {
    "@type": "GeoCircle";
    geoMidpoint: { "@type": "GeoCoordinates"; latitude: number; longitude: number };
    geoRadius: string;
  };
};
```

---

## Category List

### Main Categories

* **Advertising & Marketing**
  - Digital Marketing
  - Content Marketing
  - Social Media Marketing
  - Email Marketing
  - PPC & SEM
  - SEO Services
  - Influencer Marketing
  - Brand Strategy
  - Market Research
  - PR & Communications

* **Creative & Visual**
  - Graphic Design
  - Web Design
  - UI/UX Design
  - Logo Design
  - Brand Identity
  - Print Design
  - Illustration
  - Photography
  - Video Production
  - Animation

* **Development & Product**
  - Web Development
  - Mobile App Development
  - Software Development
  - E-commerce Development
  - API Development
  - Database Design
  - DevOps Services
  - Quality Assurance
  - Technical Consulting
  - Product Management

* **IT Services**
  - IT Consulting
  - Network Management
  - Cloud Services
  - Data Backup & Recovery
  - IT Support
  - System Administration
  - Security Services
  - Hardware Solutions
  - Software Installation
  - IT Training

* **Business Consulting**
  - Strategy Consulting
  - Operations Consulting
  - Financial Consulting
  - HR Consulting
  - Change Management
  - Process Improvement
  - Business Planning
  - Market Entry
  - Growth Strategy
  - Risk Management

* **HR & Recruitment**
  - Executive Search
  - Technical Recruitment
  - HR Consulting
  - Payroll Services
  - Benefits Administration
  - Training & Development
  - Performance Management
  - HR Technology
  - Compliance Services
  - Employee Relations

* **Finance & Accounting**
  - Bookkeeping
  - Tax Preparation
  - Financial Planning
  - Audit Services
  - CFO Services
  - Investment Advisory
  - Insurance Services
  - Financial Analysis
  - Budgeting
  - Cash Flow Management

* **Legal Services**
  - Corporate Law
  - Employment Law
  - Intellectual Property
  - Contract Law
  - Tax Law
  - Real Estate Law
  - Litigation
  - Compliance
  - Data Privacy
  - International Law

* **Customer Support**
  - Help Desk Services
  - Live Chat Support
  - Email Support
  - Phone Support
  - Social Media Support
  - Technical Support
  - Customer Success
  - Support Automation
  - Knowledge Base
  - Training & Onboarding

* **Logistics & Supply Chain**
  - Freight Forwarding
  - Warehousing
  - Inventory Management
  - Transportation
  - Customs Clearance
  - Supply Chain Consulting
  - Last Mile Delivery
  - Cold Chain Logistics
  - E-commerce Fulfillment
  - Reverse Logistics

* **Software (SaaS, On-Premise, Custom)**
  - CRM Software
  - ERP Systems
  - Project Management
  - Accounting Software
  - Marketing Automation
  - HR Software
  - E-commerce Platforms
  - Analytics Tools
  - Communication Tools
  - Security Software

* **Data & Analytics**
  - Business Intelligence
  - Data Analytics
  - Data Visualization
  - Predictive Analytics
  - Data Engineering
  - Data Science
  - Machine Learning
  - Statistical Analysis
  - Market Research
  - Performance Metrics

* **Cybersecurity**
  - Security Audits
  - Penetration Testing
  - Incident Response
  - Security Consulting
  - Compliance Services
  - Threat Intelligence
  - Security Training
  - Vulnerability Assessment
  - Identity Management
  - Data Protection

* **Training & Education**
  - Corporate Training
  - Technical Training
  - Leadership Development
  - Sales Training
  - Customer Service Training
  - Compliance Training
  - E-learning Development
  - Workshop Facilitation
  - Certification Programs
  - Skills Assessment

* **Event & PR Services**
  - Event Planning
  - Conference Management
  - Trade Show Services
  - PR Campaigns
  - Media Relations
  - Crisis Communication
  - Content Creation
  - Social Media Management
  - Influencer Outreach
  - Brand Activation

* **Real Estate & Facility Management**
  - Property Management
  - Facility Maintenance
  - Space Planning
  - Construction Management
  - Property Development
  - Real Estate Investment
  - Facility Consulting
  - Sustainability Services
  - Security Services
  - Cleaning Services

* **Engineering & Architecture**
  - Civil Engineering
  - Mechanical Engineering
  - Electrical Engineering
  - Architectural Design
  - Structural Engineering
  - Industrial Design
  - CAD Services
  - 3D Modeling
  - Prototyping
  - Technical Drawing

* **Environmental & Sustainability**
  - Environmental Consulting
  - Sustainability Strategy
  - Energy Efficiency
  - Waste Management
  - Carbon Footprinting
  - Green Building
  - Environmental Compliance
  - Renewable Energy
  - Life Cycle Assessment
  - Corporate Social Responsibility

### Category Hierarchy Structure

```typescript
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id?: string;
  icon: string;
  level: number;
  children?: Category[];
  business_count: number;
  created_at: Date;
  updated_at: Date;
};
```

### Location Categories

**Brazilian Cities (Primary Focus)**
- São Paulo (SP)
- Rio de Janeiro (RJ)
- Belo Horizonte (MG)
- Brasília (DF)
- Salvador (BA)
- Fortaleza (CE)
- Curitiba (PR)
- Recife (PE)
- Porto Alegre (RS)
- Goiânia (GO)

**Brazilian States**
- São Paulo
- Rio de Janeiro
- Minas Gerais
- Bahia
- Ceará
- Paraná
- Pernambuco
- Rio Grande do Sul
- Goiás
- Santa Catarina

**International Expansion (Future)**
- United States
- United Kingdom
- Canada
- Australia
- Germany
- France
- Spain
- Mexico
- Argentina
- Chile

---

## Goals

### Business Goals

* Achieve 1,000+ claimed business listings within the first 6 months.

* Reach 10,000 monthly unique visitors by the end of year one.

* Convert at least 5% of listed businesses to paid Highlight or Spotlight tiers within 12 months.

* Establish Selletive as the go-to B2B discovery platform in Brazil, with plans for global expansion.

* Build a scalable, status-driven platform that attracts high-quality service providers.

* **Achieve top 3 rankings for key B2B service discovery keywords in Brazilian search results.**

### User Goals

* Enable business owners to easily claim, verify, and promote their company profiles.

* Help buyers quickly discover, compare, and contact top service and software providers.

* Provide transparent, trustworthy information through verified badges and user reviews.

* Offer a seamless, intuitive experience inspired by leading platforms like Sortlist.

* Support both English and Portuguese for accessibility in the Brazilian and global markets.

* Allow businesses to post project needs ("signals") and receive tailored responses from relevant providers.

### Non-Goals

* Selletive will not provide direct project management or contract negotiation tools.

* The platform will not offer in-depth custom consulting or matchmaking services at launch.

* No support for consumer (B2C) product listings; focus remains strictly on B2B.

---

## Site Structure & Information Architecture

### Public Pages
* **Homepage** (`/`)
  - Hero section with search functionality
  - Featured categories
  - Top verified providers
  - How it works section

* **Category Pages** (`/categories/[category-slug]`)
  - Auto-generated SEO pages (e.g., `/categories/digital-marketing`)
  - Provider listings filtered by category
  - Category-specific content and descriptions

* **Location-Based Category Pages** (`/[category]/[location-slug]`)
  - Auto-generated pSEO pages for multiple location levels
  - **Country level**: `/digital-marketing/brazil-br` (e.g., "Best Digital Marketing in Brazil")
  - **State level**: `/digital-marketing/sao-paulo-sp-br` (e.g., "Best Digital Marketing in São Paulo")
  - **City level**: `/digital-marketing/sao-paulo-sp-br` (e.g., "Best Digital Marketing in São Paulo")
  - Location-specific provider listings with proper hierarchy

* **Company Profile Pages** (`/company/[company-slug]`)
  - Public business profiles
  - Reviews and testimonials
  - Contact information and services
  - Verification badges and tier status

* **Search Results** (`/search`)
  - Filtered provider listings
  - Advanced search and filter options

* **Static Pages**
  - About Us (`/about`)
  - How It Works (`/how-it-works`)
  - Pricing (`/pricing`)
  - Terms of Service (`/terms`)
  - Privacy Policy (`/privacy`)
  - Contact (`/contact`)

### User Dashboard Pages (Authenticated)
* **Dashboard Home** (`/dashboard`)
  - Overview of profile status
  - Recent activity and notifications
  - Quick access to key features

* **Profile Management** (`/dashboard/profile`)
  - Edit business information
  - Manage services and specialties
  - Upload logos and images

* **Promotion & Verification** (`/dashboard/promote`)
  - View current tier status
  - Upgrade/downgrade options
  - Badge generator and verification tools

* **Analytics** (`/dashboard/analytics`)
  - Profile views and engagement metrics
  - Lead generation tracking
  - Performance insights

* **Reviews Management** (`/dashboard/reviews`)
  - View and respond to reviews
  - Review request tools

* **Billing** (`/dashboard/billing`)
  - Subscription management
  - Payment history
  - Invoice downloads

### Admin Pages (Super Admin Only)
* **Admin Dashboard** (`/admin`)
* **User Management** (`/admin/users`)
* **Business Listings** (`/admin/businesses`)
* **Review Moderation** (`/admin/reviews`)
* **Analytics & Reports** (`/admin/analytics`)
* **Content Management** (`/admin/content`)

---

## Workflows

### Business Claiming Workflow

**Objective**: Allow business owners to claim their company profile via email domain verification.

**Steps**:
1. User visits homepage or discovers their business profile via search/browse
2. User clicks "Claim This Business" button on business profile page
3. User is redirected to `/claim/[business-id]` page
4. System checks if business is already claimed:
   - If claimed: Display "Already claimed" message with contact option
   - If unclaimed: Proceed to claiming form
5. User fills out claiming form:
   - Enter email address
   - Confirm they represent the business
   - Accept terms and conditions
6. User clicks "Claim Business" button
7. System validates email domain against business website domain:
   - If domains match: Proceed to step 8
   - If domains don't match: Show error message and alternative verification options
8. System sends verification email to user's address
9. User receives email and clicks verification link
10. User is redirected to `/dashboard/setup` to complete profile setup
11. User completes onboarding wizard:
    - Verify business information
    - Add/edit contact details
    - Upload logo and images
    - Set business description and services
12. User clicks "Complete Setup" button
13. Business status changes to "Claimed"
14. User is redirected to dashboard with success message

**UI Elements**: Claim button, form fields (email, checkbox), verification email template, setup wizard, success/error messages

### Business Verification Workflow

**Objective**: Allow claimed businesses to achieve verified status by adding a Selletive badge to their website.

**Steps**:
1. User navigates to `/dashboard/promote` from their dashboard
2. User views promotion tiers and clicks "Get Verified" under Verified tier
3. System displays verification requirements checklist:
   - Add Selletive badge to website
   - Website must offer services/products
   - Domain Rating > 0
   - Business information complete
4. User clicks "Generate Badge" button
5. System generates unique verification badge with tracking code
6. User sees badge options:
   - HTML embed code (copy to clipboard)
   - PNG download
   - SVG download
7. User copies HTML code or downloads badge file
8. User adds badge to their website (external action)
9. User returns to verification page and clicks "Check Badge" button
10. System runs automated crawler to verify badge presence:
    - Crawls business website
    - Checks for badge HTML with correct attributes
    - Validates link points back to Selletive profile
11. If verification successful:
    - Business status upgrades to "Verified"
    - Green checkmark appears next to business name
    - Profile gains enhanced visibility in search results
    - User sees success message and updated dashboard
12. If verification fails:
    - User sees error message with specific issues found
    - User can retry after fixing issues
    - Support contact option provided

**UI Elements**: Promotion tier cards, badge generator, code/file download buttons, verification checklist, crawler status indicator, success/error messages

### Spotlight Tier Purchase Workflow

**Objective**: Allow verified businesses to upgrade to Spotlight tier for maximum visibility.

**Steps**:
1. User navigates to `/dashboard/promote` from their dashboard
2. User views promotion tiers and clicks "Upgrade to Spotlight" ($129/mo)
3. System checks if user meets Spotlight requirements:
   - Must be Claimed tier or higher
   - Complete business profile required
4. If requirements met, user is redirected to `/checkout/spotlight`
5. User reviews Spotlight benefits and pricing:
   - Top placement in search results
   - Premium badge and highlighting
   - Advanced analytics
   - Priority customer support
6. User clicks "Continue to Payment" button
7. Payment form loads with pre-filled business information:
   - Billing address from profile
   - Business name and contact details
8. User enters payment information:
   - Credit card number, expiry, CVV
   - Billing address confirmation
   - Payment method selection (card/PayPal/bank transfer)
9. User reviews order summary:
   - Spotlight tier: $129/month
   - Next billing date
   - Auto-renewal notice
10. User checks "I accept terms and conditions" checkbox
11. User clicks "Complete Purchase" button
12. System processes payment via payment gateway:
    - Validates payment details
    - Charges initial payment
    - Sets up recurring subscription
13. If payment successful:
    - Business tier immediately upgrades to Spotlight
    - Profile gains premium visual indicators
    - Search ranking boost takes effect
    - User redirected to `/dashboard/success` with confirmation
    - Receipt email sent automatically
14. If payment fails:
    - User sees error message with specific issue
    - User can retry with different payment method
    - Support contact option provided
15. User returns to dashboard and sees updated Spotlight status

**UI Elements**: Tier comparison cards, checkout form, payment fields, order summary, loading states, success/error messages, receipt display

---

## User Stories

### Personas

**Business Owner**

* As a business owner, I want to claim my company profile, so that I can manage my public information.

* As a business owner, I want to verify my business by adding a badge to my website, so that I can gain a verified status and more visibility.

* As a business owner, I want to upgrade my listing to Highlight or Spotlight, so that I can attract more leads.

* As a business owner, I want to see analytics on my listing's performance, so that I can measure ROI.

* As a business owner, I want to respond to reviews and testimonials, so that I can engage with my audience.

* As a business owner, I want to send a signal (project brief) when I need to hire a service provider, so that Selletive can match me with the most relevant companies and facilitate contact.

**End User (Buyer/Researcher)**

* As a buyer, I want to search and filter providers by category, location, and status, so that I can find the best fit for my needs.

* As a buyer, I want to read verified reviews and testimonials, so that I can make informed decisions.

* As a buyer, I want to contact providers directly from their profile, so that I can start a conversation quickly.

* As a buyer, I want to see which providers are verified or featured, so that I can trust their credibility.

* As a buyer, I want to browse category pages like "Best [Category] in [City]" to quickly find top providers in my area.

**Platform Admin**

* As an admin, I want to review and manage new business claims, so that only legitimate businesses are listed.

* As an admin, I want to manage promotion tiers and payments, so that the platform's monetization is seamless.

* As an admin, I want to monitor badge verification and listing quality, so that the platform maintains high standards.

* As an admin, I want to manage localization and translations, so that the platform is accessible in multiple languages.

* As an admin, I want to monitor and moderate signals and messaging to ensure quality and prevent abuse.

---

## Functional Requirements

### 1. Listing Management (Priority: High)

* **Business Claiming:** Allow business owners to claim their company profile via email domain verification (If user email address' domain is equal to any of the company domains in the database, he will be able to claim it to his account under the email address with the same domain). If a business is already claimed, notify both the existing and new claimant (for MVP a toast message is sufficient).

* **Profile Editing:** Enable editing of business information, services, and contact details (for verified and above).

* **Review & Testimonial Management:** Allow businesses to view and respond to reviews (for verified and above).

* **Analytics Dashboard:** Provide basic analytics on profile views and engagement (for highlight and above).

* **SEO Requirements:** All business profiles must include proper meta titles, descriptions, structured data (JSON-LD), H1 tags, canonical URLs, and optimized URL slugs.

### 2. Promotion Tiers & Verification (Priority: High)

* **Promotion Tier Selection:** Display and explain Claimed, Verified, Highlight, and Spotlight tiers.

* **Badge Generator:** Generate HTML embed code and PNG/SVG badge downloads for verification.

* **Automated Badge Verification:** Bot crawler checks for badge presence and correct link attributes.

* **Verification Checklist:** Enforce requirements (badge, website offers, product promise, DR > 0).

* **Upgrade/Downgrade Flow:** Allow businesses to change tiers at any time.

* **SEO Requirements:** Tier pages must be optimized with proper heading structure, meta descriptions, and internal linking.

### 3. Payment & Monetization (Priority: High)

* **Payment Integration:** Support payments for Highlight ($19/mo) and Spotlight ($129/mo) via major payment gateways.

* **Subscription Management:** Handle recurring billing, cancellations, and refunds.

### 4. Discovery & Search (Priority: High)

* **Category Browsing:** Users can browse by service/software categories.

* **Advanced Filtering:** Filter by location, tier, verified status, and other attributes.

* **Profile Pages:** Rich, SEO-optimized business profiles with reviews, badges, and contact options.

* **SEO Requirements:** Search and category pages must include optimized title tags, meta descriptions, breadcrumb navigation, and faceted search URL structure for SEO.

### 5. Signal Feature (Priority: Low - Post MVP)

**Note**: Signal feature will be developed after MVP launch to focus on core business claiming and discovery functionality first.

* **Signal Creation:** Allow users from claimed (or higher) businesses to create and submit a "signal" (project brief) describing their goals, context, and requirements for hiring a service provider.

* **Signal Matching:** Selletive matches and distributes signals to the most relevant companies based on fit (category, location, services, etc.).

* **Provider Notification:** Recipient companies are notified via email, dashboard, and/or in-app messaging.

* **Contact Options:** Providers can contact the signal sender via email, phone, or a simple in-app messaging system.

* **Signal Management:** Users can view, edit, or close their signals; providers can track and respond to received signals.

* **Eligibility:** Only users from claimed (or higher) businesses can send signals.

### 6. Category Pages & pSEO (Priority: High)

* **Auto-Generated Category Pages:** Platform automatically generates SEO-optimized pages for queries such as "Best [BUSINESS CATEGORY] in [CITY]" and "Best [BUSINESS CATEGORY] in [COUNTRY]".

* **Category Aliases:** Each category supports multiple aliases (e.g., "Digital Marketing" = "Ads Agencies", "Marketing Agencies", "Online Marketing") to capture different search terms while serving identical content.

* **Dynamic Content:** Pages are populated based on real-time data (listings, reviews, ratings, etc.).

* **Category Navigation:** Users can easily browse and discover providers by category, subcategory, and location.

* **SEO Optimization:** Each page includes unique meta titles, descriptions, structured data, proper H1/H2 hierarchy, canonical URLs, and internal linking structure for maximum search visibility.

* **Performance Optimization:** Uses Next.js ISR (Incremental Static Regeneration) to cache pages for optimal performance while maintaining fresh content.

### 7. Localization & Internationalization (Priority: Medium)

* **Multi-language UI:** Support English and Portuguese, with easy expansion to other languages.

* **Content Translation:** Translate all static and dynamic content.

* **SEO Requirements:** Implement proper hreflang tags, language-specific URLs, and localized meta content.

### 8. Admin Tools (Priority: Low)

* **User & Listing Moderation:** Approve, reject, or edit listings and reviews.

* **Analytics & Reporting:** Track platform usage, payments, and growth metrics.

* **Signal Moderation:** Monitor and moderate signals and messaging for quality and compliance.

### 9. Other Features (Priority: Low)

* **Email Notifications:** Notify users of verification status, reviews, promotions, and signal activity.

* **API Access:** (Future) Allow integration with third-party tools.

---

## SEO Requirements & Technical Implementation

### Core SEO Requirements (All Pages)

* **Meta Tags**: Unique, keyword-optimized title tags (50-60 characters) and meta descriptions (150-160 characters)
* **Heading Structure**: Proper H1-H6 hierarchy with target keywords
* **URL Structure**: Clean, descriptive URLs with hyphens and relevant keywords
* **Canonical URLs**: Prevent duplicate content issues
* **Schema Markup**: JSON-LD structured data for businesses, reviews, and services
* **Internal Linking**: Strategic linking between related pages and categories
* **Image Optimization**: Alt text, descriptive filenames, and proper sizing
* **Page Speed**: Core Web Vitals optimization (<2s loading time)
* **Mobile Responsiveness**: Mobile-first design and functionality

### Page-Specific SEO Requirements

**Homepage**
- H1: "Find the Best [Primary Service Categories] in Brazil"
- Schema: Organization, WebSite, BreadcrumbList
- Meta description highlighting main value proposition

**Category Pages**
- H1: "Best [Category Name] Companies in [Location]"
- Schema: ItemList, LocalBusiness for each provider
- Breadcrumb navigation
- Related category suggestions

**Business Profile Pages**
- H1: Company name + location
- Schema: LocalBusiness, Service, Review, AggregateRating
- Unique meta descriptions for each business
- Service-specific H2 sections

**Location-Category Pages (pSEO)**
- H1: "Top [Number] [Category] in [City/Country]"
- Location-specific content and statistics
- Schema: ItemList with local businesses
- City/region-specific keywords

### Technical SEO Implementation

* **Sitemap Generation**: Automatic XML sitemaps for all page types
* **Robots.txt**: Proper crawl directives and sitemap location
* **Server-Side Rendering**: Ensure content is crawlable by search engines
* **404 Handling**: Custom 404 pages with navigation options
* **Redirect Management**: 301 redirects for URL changes
* **Analytics Integration**: Google Analytics, Search Console setup
* **Performance Monitoring**: Core Web Vitals tracking and optimization

---

## Category List

### Main Categories

* **Advertising & Marketing**
  - Digital Marketing
  - Content Marketing
  - Social Media Marketing
  - Email Marketing
  - PPC & SEM
  - SEO Services
  - Influencer Marketing
  - Brand Strategy
  - Market Research
  - PR & Communications

* **Creative & Visual**
  - Graphic Design
  - Web Design
  - UI/UX Design
  - Logo Design
  - Brand Identity
  - Print Design
  - Illustration
  - Photography
  - Video Production
  - Animation

* **Development & Product**
  - Web Development
  - Mobile App Development
  - Software Development
  - E-commerce Development
  - API Development
  - Database Design
  - DevOps Services
  - Quality Assurance
  - Technical Consulting
  - Product Management

* **IT Services**
  - IT Consulting
  - Network Management
  - Cloud Services
  - Data Backup & Recovery
  - IT Support
  - System Administration
  - Security Services
  - Hardware Solutions
  - Software Installation
  - IT Training

* **Business Consulting**
  - Strategy Consulting
  - Operations Consulting
  - Financial Consulting
  - HR Consulting
  - Change Management
  - Process Improvement
  - Business Planning
  - Market Entry
  - Growth Strategy
  - Risk Management

* **HR & Recruitment**
  - Executive Search
  - Technical Recruitment
  - HR Consulting
  - Payroll Services
  - Benefits Administration
  - Training & Development
  - Performance Management
  - HR Technology
  - Compliance Services
  - Employee Relations

* **Finance & Accounting**
  - Bookkeeping
  - Tax Preparation
  - Financial Planning
  - Audit Services
  - CFO Services
  - Investment Advisory
  - Insurance Services
  - Financial Analysis
  - Budgeting
  - Cash Flow Management

* **Legal Services**
  - Corporate Law
  - Employment Law
  - Intellectual Property
  - Contract Law
  - Tax Law
  - Real Estate Law
  - Litigation
  - Compliance
  - Data Privacy
  - International Law

* **Customer Support**
  - Help Desk Services
  - Live Chat Support
  - Email Support
  - Phone Support
  - Social Media Support
  - Technical Support
  - Customer Success
  - Support Automation
  - Knowledge Base
  - Training & Onboarding

* **Logistics & Supply Chain**
  - Freight Forwarding
  - Warehousing
  - Inventory Management
  - Transportation
  - Customs Clearance
  - Supply Chain Consulting
  - Last Mile Delivery
  - Cold Chain Logistics
  - E-commerce Fulfillment
  - Reverse Logistics

* **Software (SaaS, On-Premise, Custom)**
  - CRM Software
  - ERP Systems
  - Project Management
  - Accounting Software
  - Marketing Automation
  - HR Software
  - E-commerce Platforms
  - Analytics Tools
  - Communication Tools
  - Security Software

* **Data & Analytics**
  - Business Intelligence
  - Data Analytics
  - Data Visualization
  - Predictive Analytics
  - Data Engineering
  - Data Science
  - Machine Learning
  - Statistical Analysis
  - Market Research
  - Performance Metrics

* **Cybersecurity**
  - Security Audits
  - Penetration Testing
  - Incident Response
  - Security Consulting
  - Compliance Services
  - Threat Intelligence
  - Security Training
  - Vulnerability Assessment
  - Identity Management
  - Data Protection

* **Training & Education**
  - Corporate Training
  - Technical Training
  - Leadership Development
  - Sales Training
  - Customer Service Training
  - Compliance Training
  - E-learning Development
  - Workshop Facilitation
  - Certification Programs
  - Skills Assessment

* **Event & PR Services**
  - Event Planning
  - Conference Management
  - Trade Show Services
  - PR Campaigns
  - Media Relations
  - Crisis Communication
  - Content Creation
  - Social Media Management
  - Influencer Outreach
  - Brand Activation

* **Real Estate & Facility Management**
  - Property Management
  - Facility Maintenance
  - Space Planning
  - Construction Management
  - Property Development
  - Real Estate Investment
  - Facility Consulting
  - Sustainability Services
  - Security Services
  - Cleaning Services

* **Engineering & Architecture**
  - Civil Engineering
  - Mechanical Engineering
  - Electrical Engineering
  - Architectural Design
  - Structural Engineering
  - Industrial Design
  - CAD Services
  - 3D Modeling
  - Prototyping
  - Technical Drawing

* **Environmental & Sustainability**
  - Environmental Consulting
  - Sustainability Strategy
  - Energy Efficiency
  - Waste Management
  - Carbon Footprinting
  - Green Building
  - Environmental Compliance
  - Renewable Energy
  - Life Cycle Assessment
  - Corporate Social Responsibility

### Category Hierarchy Structure

```typescript
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id?: string;
  icon: string;
  level: number;
  children?: Category[];
  business_count: number;
  created_at: Date;
  updated_at: Date;
};
```

### Location Categories

**Brazilian Cities (Primary Focus)**
- São Paulo (SP)
- Rio de Janeiro (RJ)
- Belo Horizonte (MG)
- Brasília (DF)
- Salvador (BA)
- Fortaleza (CE)
- Curitiba (PR)
- Recife (PE)
- Porto Alegre (RS)
- Goiânia (GO)

**Brazilian States**
- São Paulo
- Rio de Janeiro
- Minas Gerais
- Bahia
- Ceará
- Paraná
- Pernambuco
- Rio Grande do Sul
- Goiás
- Santa Catarina

**International Expansion (Future)**
- United States
- United Kingdom
- Canada
- Australia
- Germany
- France
- Spain
- Mexico
- Argentina
- Chile

---

## User Experience

### Entry Point & First-Time User Experience

* Users discover Selletive via search, referral, or direct marketing (focus on Brazil).

* Landing page features clear value proposition, category navigation, and search bar.

* First-time business owners are prompted to claim their business via email domain verification.

* Onboarding wizard guides users through profile setup, verification, and promotion options.

* Buyers can immediately browse and filter providers without registration.

* **All pages are optimized for SEO with proper meta tags, structured data, and content hierarchy.**

### Core Experience

1. **Homepage & Search**

  * Clean, Sortlist-inspired UI with prominent search and filter options.

  * Responsive design for desktop and mobile.

  * SEO-optimized with schema markup and keyword-targeted content.

2. **Category & pSEO Pages**

  * Users can browse auto-generated category/location pages (e.g., "Best Digital Marketing Agencies in São Paulo").

  * Each page is SEO-optimized with unique titles, descriptions, and structured data.

3. **Provider Listings**

  * Providers are sorted by relevance, tier, and verification status.

  * Filters for location, category, and tier.

  * SEO-friendly URLs and pagination.

4. **Business Profile**

  * Rich profile with business info, badges, reviews, and contact options.

  * Verified and promoted providers are visually highlighted.

  * Full schema markup implementation for local businesses.

5. **Promotion & Verification**

  * "Promote" tab in dashboard shows all tiers and benefits.

  * User selects tier, completes payment (if applicable), and completes checklist.

  * Upon success, listing is upgraded and gains enhanced visibility.

6. **Signal Feature Flow** (Future - Not MVP)

  * User from a claimed (or higher) business navigates to "Send a Signal".

  * Fills out a project brief (goals, context, requirements, budget, timeline, etc.).

  * Selletive matches and distributes the signal to relevant providers.

  * Providers receive notification and can respond via email, phone, or in-app message.

  * User manages incoming responses and can close the signal when the need is met.

7. **Ongoing Engagement**

  * Business owners can view analytics, respond to reviews, and manage their listing.

  * Buyers can leave reviews, contact providers, and share profiles.

### Advanced Features & Edge Cases

* Power users can upgrade/downgrade tiers at any time.

* If badge is removed or invalid, verification is revoked and user is notified.

* If payment fails, user is prompted to retry or contact support.

* Admins can manually override verification or promotion status if needed.

* Signal spam or abuse is monitored and managed by admin tools (future feature).

### UI/UX Highlights

* Sortlist-inspired, clean, and modern design.

* High color contrast and accessible font sizes.

* Fully responsive for mobile and desktop.

* Clear visual hierarchy for tiers and badges.

* Multilingual support with easy language switching.

* Error messages and tooltips for all critical actions.

* SEO-optimized structure with proper heading hierarchy and internal navigation.

---

## Signal Feature: User Stories, Flow, and Requirements (Future - Not MVP)

### User Stories

* As a business owner, I want to send a signal (project brief) to the platform, so that I can receive proposals from relevant providers.

* As a provider, I want to receive signals that match my services and location, so that I can reach out to potential clients.

* As a business owner, I want to manage my sent signals and track provider responses.

* As an admin, I want to monitor signals for quality and prevent spam.

### Functional Requirements

* Only users from claimed (or higher) businesses can send signals.

* Signal form includes: project title, description, goals, context, category, subcategory, location, budget, timeline, preferred contact method.

* Matching algorithm distributes signals to relevant providers based on fit (category, location, services, etc.).

* Providers are notified via email, dashboard, and/or in-app messaging.

* Providers can respond via email, phone, or in-app message.

* Signal sender can view and manage responses, close the signal, or mark as filled.

* Admin moderation for abuse prevention.

### UX Flow

1. User logs in and navigates to "Send a Signal".

2. Completes the signal form with project details.

3. Submits the signal; confirmation and estimated response time are shown.

4. Selletive matches and distributes the signal to relevant providers.

5. Providers receive notification and can respond via preferred method.

6. User receives and manages responses in dashboard or via email.

7. User can close the signal or mark as filled at any time.

---

## Narrative

In Brazil's fast-growing B2B landscape, business owners struggle to stand out and buyers are overwhelmed by choice. Ana, a marketing agency owner in São Paulo, wants her company to be discovered by more clients but finds existing directories cluttered and untrustworthy. She discovers Selletive through a Google search for "best marketing agencies São Paulo" - a search where Selletive's SEO-optimized category pages rank prominently. She can claim her business profile for free, verify her status by adding a badge to her website, and choose to promote her listing for even greater visibility. When Ana needs to hire a web development partner, she uses the "Send a Signal" feature to post her project brief. Selletive matches her signal to the most relevant providers, who reach out to her directly. The process is simple: Ana claims her profile, follows the onboarding steps, and quickly earns a verified badge. She decides to upgrade to the Highlight tier, instantly boosting her agency's placement in search results. Meanwhile, buyers searching for marketing services see Ana's verified and highlighted profile at the top, complete with authentic reviews and direct contact options. Selletive's status-driven approach not only helps Ana attract more leads but also builds trust with buyers, creating a win-win for both sides. As Selletive grows, it becomes the go-to platform for B2B discovery in Brazil, setting a new standard for transparency and quality in the market, powered by strong organic search presence through comprehensive SEO optimization.

---

## Success Metrics

### User-Centric Metrics

* Number of claimed and verified business profiles (tracked monthly).

* Average time to verification and promotion upgrade.

* User satisfaction (measured via NPS and feedback surveys).

* Engagement rates: profile views, review submissions, contact clicks, signals sent/received.

### Business Metrics

* Monthly recurring revenue from Highlight and Spotlight tiers.

* Conversion rate from free to paid tiers.

* Market share in Brazilian B2B directory space (tracked via competitive analysis).

* Growth in unique monthly visitors.

* **Organic search traffic and keyword rankings for target terms.**

### Technical Metrics

* Platform uptime (target: 99.9%+).

* Average page load time (<2 seconds).

* Error rate for badge verification and payment flows (<1%).

* Signal delivery and response rates.

* **Core Web Vitals performance scores.**

* **SEO performance: organic traffic, keyword rankings, crawl errors.**

### Tracking Plan

* Business claim initiated/completed

* Badge generated/downloaded

* Verification success/failure

* Promotion tier upgrade/downgrade

* Payment success/failure

* Profile view and contact click

* Review submitted/responded

* Language switch event

* Signal sent/received/responded (future)

* **SEO events: organic search clicks, keyword ranking changes, page indexing status**

---

## Technical Considerations

### Technical Needs

* Modular front-end (responsive, multilingual UI).

* Back-end for user management, listings, reviews, signals, and analytics.

* Payment gateway integration for paid tiers.

* Automated bot/crawler for badge verification.

* Admin dashboard for moderation and analytics.

* In-app messaging system for signal responses (future).

* **SEO-optimized architecture with server-side rendering, proper meta tag management, and structured data implementation.**

### Integration Points

* Payment processors (Stripe, PayPal, or local alternatives).

* Email service for notifications.

* Analytics tools (Google Analytics, Search Console, custom event tracking).

* **SEO tools integration for monitoring rankings and performance.**

### Data Storage & Privacy

* Secure storage of user and business data.

* GDPR/LGPD compliance for user privacy (especially for Brazil).

* Encrypted payment and authentication flows.

* Data retention and deletion policies.

### Scalability & Performance

* Designed for rapid growth in Brazil, with ability to scale globally.

* Efficient search and filtering for large numbers of listings.

* Caching and CDN for fast content delivery.

* Automated generation and updating of category/pSEO pages.

* **Performance optimization for Core Web Vitals and SEO rankings.**

### Potential Challenges

* Ensuring accurate and secure badge verification.

* Preventing fraudulent claims, reviews, and signal spam.

* Handling multi-language content and localization.

* Managing payments and subscription edge cases.

* Delivering relevant signal matches at scale (future).

* **Maintaining SEO performance while scaling content and features.**

---

## Milestones & Sequencing

### Project Estimate

* Medium: 2–4 weeks for MVP launch.

### Team Size & Composition

* Extra-small: 1 person who does everything (Product, Engineering, Design, Admin).

### Suggested Phases

**Phase 1: MVP Development (2 weeks)**

* Key Deliverables: Core listing management, business claiming, basic search/browse, Claimed/Verified tiers, badge generator, automated verification, English/Portuguese UI, **comprehensive SEO optimization for all pages**.

* Dependencies: Payment gateway setup, email service.

**Phase 2: Monetization & Promotion Tiers (1 week)**

* Key Deliverables: Highlight/Spotlight tiers, payment integration, subscription management, analytics dashboard.

* Dependencies: Phase 1 completion.

**Phase 3: Discovery & Growth (1 week)**

* Key Deliverables: Advanced filtering, SEO optimization, review/testimonial system, admin tools, marketing site, auto-generated category/pSEO pages, **search console integration and SEO monitoring**.

* Dependencies: Phase 2 completion.

**Phase 4: Polish & Launch (1 week)**

* Key Deliverables: UI/UX refinements, accessibility checks, error handling, localization QA, launch campaign, **final SEO audit and optimization**.

* Dependencies: All previous phases.

**Future Phase: Advanced Features (Post MVP)**

* **Signal Feature**: Signal creation, matching algorithm, provider notifications, messaging system, admin moderation tools.

* **Contact Form System**: Lead capture, email notifications, dashboard management, analytics tracking.

* **Dependencies**: All MVP phases completed, platform proven, and core metrics achieved.

---