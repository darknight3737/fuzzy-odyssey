# Location System - Lazy Loading Implementation

## Overview

This implementation enables **all cities/states/countries globally** without requiring them to be pre-seeded in the database. Locations are created **on-demand** when businesses are assigned to them.

## How It Works

### 1. **Slug Parsing** (`utils.ts`)

Location slugs follow PRD pattern: `[name]-[code]-[country-code]`

- **Country**: `brazil-br`
- **State**: `sao-paulo-sp-br`
- **City**: `san-francisco-ca-us`

The `parseLocationSlug()` function extracts location information from any valid slug format, allowing URLs to work even if the location doesn't exist in the database yet.

### 2. **Lazy Location Creation** (`server.ts`)

When a URL like `/marketing-agencies/tokyo-jp` is accessed:

1. **Parse the slug** → Extract: `{ name: "Tokyo", type: "city", countryCode: "jp" }`
2. **Check if location exists** in database
3. **If not exists** → Automatically create:
   - Country (if needed): `japan-jp`
   - State (if provided): `tokyo-13-jp`
   - City: `tokyo-13-jp`
4. **Query businesses** for that location
5. **Display page** with businesses (even if empty - good for SEO)

### 3. **Benefits**

✅ **No database seeding required** - Locations created automatically  
✅ **Global coverage** - Any valid location slug works immediately  
✅ **SEO-friendly** - Pages exist even with 0 businesses  
✅ **Follows PRD structure** - Maintains slug pattern from PRD  
✅ **Minimal storage** - Only stores locations actually used  

## Usage Examples

### URL Examples (All Work Automatically)

```
/marketing-agencies/brazil                    → Country level
/marketing-agencies/brazil-sao-paulo         → State level  
/marketing-agencies/brazil-sao-paulo-sao-paulo → City level
/marketing-agencies/tokyo-jp                 → City in Japan (works!)
/marketing-agencies/london-gb                 → City in UK (works!)
```

### In Code

```typescript
import { parseLocationSlug } from '~/lib/locations/utils';
import { getOrCreateLocationBySlug } from '~/lib/locations/server';

// Parse any location slug
const parsed = parseLocationSlug('sao-paulo-sp-br');
// Returns: { name: "Sao Paulo", type: "state", countryCode: "br", stateCode: "sp" }

// Get or create location (lazy loading)
const location = await getOrCreateLocationBySlug('sao-paulo-sp-br');
// Creates location in DB if doesn't exist, returns existing if found
```

## ISR (Incremental Static Regeneration)

**Current Status**: Dynamic route (no ISR yet)

**Future Enhancement**: Add `generateStaticParams()` to pre-generate popular location pages. However, with lazy loading, ISR is less critical since pages generate on-demand efficiently.

## Business Assignment Flow

When a business is assigned a location:

1. User selects: "São Paulo, SP, Brazil"
2. System generates slug: `sao-paulo-sp-br`
3. Calls `getOrCreateLocationBySlug('sao-paulo-sp-br')`
4. Location is created in DB (with parent country/state)
5. Business linked via `business_locations` table
6. URL `/category/sao-paulo-sp-br` now shows the business

## Location Slug Format

### Country
```
brazil-br
united-states-us
```

### State/Province
```
sao-paulo-sp-br
california-ca-us
```

### City
```
sao-paulo-sp-br  (if same name as state)
san-francisco-ca-us  (different name)
```

## Notes

- **Accent handling**: Slugs are normalized (removes accents)
- **Multi-word locations**: Hyphenated (e.g., "united-states-us")
- **Case insensitive**: Slugs are always lowercase
- **Validation**: Invalid slugs return 404 (not created)

