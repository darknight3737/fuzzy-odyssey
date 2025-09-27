# Selletive Supabase Setup Guide

## ✅ **Separate Supabase Instance Configured Successfully!**

Your Selletive project now has its own dedicated Supabase instance running on separate ports to avoid conflicts with your other project.

## 🔧 **Configuration Changes Made:**

### **1. Supabase Configuration (`apps/web/supabase/config.toml`)**
- **Project ID**: Changed to `selletive-fuzzy-odyssey`
- **API Port**: `54331` (instead of 54321)
- **Database Port**: `54332` (instead of 54322)
- **Studio Port**: `54333` (instead of 54323)
- **Email Ports**: `54334-54336` (instead of 54324-54326)
- **Analytics Port**: `54337` (instead of 54327)

### **2. Environment Variables Updated (`apps/web/.env.development`)**
- **Supabase URL**: `http://127.0.0.1:54331`
- **Email Port**: `54335`

## 🌐 **Access Points:**

| Service | URL | Description |
|---------|-----|-------------|
| **Selletive App** | http://localhost:3000 | Your Next.js application |
| **Supabase Studio** | http://127.0.0.1:54333 | Database management interface |
| **Supabase API** | http://127.0.0.1:54331 | API endpoints |
| **Email Testing** | http://127.0.0.1:54334 | Email testing interface |

## 🚀 **Next Steps:**

1. **Update Application Settings** - Edit `apps/web/.env`:
   ```bash
   NEXT_PUBLIC_PRODUCT_NAME=Selletive
   NEXT_PUBLIC_SITE_TITLE="Selletive - B2B Services & Software Discovery Platform"
   NEXT_PUBLIC_SITE_DESCRIPTION="Find and compare top B2B service providers and software solutions..."
   ```

2. **Start Development Server**:
   ```bash
   cd apps/web
   pnpm dev
   ```

3. **Access Supabase Studio**: http://127.0.0.1:54333

## 🔒 **Security Notes:**

- This is a **separate instance** from your other project
- No conflicts with existing Supabase instances
- All data is isolated to this project
- Uses the same JWT keys for development (safe for local development)

## 📋 **Commands:**

```bash
# Start Supabase
pnpm supabase:start

# Stop Supabase
pnpm supabase:stop

# Check status
pnpm supabase:status

# Reset database
pnpm supabase:reset
```

## ✅ **Verification:**

- ✅ Supabase running on port 54331
- ✅ Studio accessible on port 54333
- ✅ Environment variables updated
- ✅ No conflicts with other projects
- ✅ Billing configuration ready for Highlight/Spotlight tiers

Your Selletive project is now ready for development with its own dedicated Supabase instance!

