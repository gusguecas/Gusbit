# 🚀 GusBit Financial Tracker - Cloudflare Pages Deployment Guide

## 📋 Manual Deployment Instructions

Since the API token needs additional permissions, here's how to deploy manually:

### 🔧 Option 1: GitHub Integration (Recommended)

1. **Go to Cloudflare Dashboard:**
   - Visit: https://dash.cloudflare.com
   - Navigate to "Workers & Pages" → "Create Application"

2. **Connect to GitHub:**
   - Choose "Pages" → "Connect to Git"
   - Select GitHub → Authorize Cloudflare
   - Choose repository: `gusguecas/Gusbit`

3. **Configure Build Settings:**
   ```
   Project name: gusbit-financial-tracker
   Production branch: main
   Build command: npm run build
   Build output directory: dist
   Root directory: (leave blank)
   ```

4. **Environment Variables:**
   - No environment variables needed for basic deployment
   - D1 database will be configured separately

5. **Deploy:**
   - Click "Save and Deploy"
   - First deployment will take 2-3 minutes

### 🗄️ Option 2: CLI Deployment (If Token Permissions Fixed)

```bash
# Create project
npx wrangler pages project create gusbit-financial-tracker \
  --production-branch main \
  --compatibility-date 2024-01-01

# Deploy
npm run build
npx wrangler pages deploy dist --project-name gusbit-financial-tracker
```

### 🔑 Required Token Permissions for CLI

If using CLI deployment, the API token needs:
- ✅ `Cloudflare Pages:Edit`
- ✅ `Account:Read`
- ✅ `Zone:Read`
- ✅ `D1:Edit` (for database)

## 🗄️ Database Setup

### After deployment, configure D1 database:

1. **Create D1 Database:**
   ```bash
   npx wrangler d1 create gusbit-production
   ```

2. **Update wrangler.jsonc:**
   Replace `database_id` with the actual ID from step 1

3. **Apply Migrations:**
   ```bash
   npx wrangler d1 migrations apply gusbit-production
   ```

4. **Redeploy with Database:**
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name gusbit-financial-tracker
   ```

## 🔐 Login System

- **Default Password:** `asset123`
- **Login URL:** `https://gusbit-financial-tracker.pages.dev/login`
- **Change Password:** Update in D1 database `config` table

## 🎯 Expected URLs

After successful deployment:
- **Production:** `https://gusbit-financial-tracker.pages.dev`
- **Login:** `https://gusbit-financial-tracker.pages.dev/login`
- **API:** `https://gusbit-financial-tracker.pages.dev/api/*`

## ✅ Features Included

- 🔐 Authentication system with password protection
- 📊 Real-time portfolio tracking
- 📈 Unique charts per asset (fixed identical charts issue)
- 🔍 Exploration mode for external asset data
- 📰 Markets hub with news and indicators
- 🪙 Crypto hub with CoinGecko integration
- 📝 Watchlist with intelligent alerts
- 📱 Responsive executive design

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Ensure Node.js compatibility in Cloudflare Pages settings
   - Check build command: `npm run build`
   - Verify output directory: `dist`

2. **Database Errors:**
   - Ensure D1 database is created and configured
   - Check migrations are applied
   - Verify binding name matches `wrangler.jsonc`

3. **Authentication Issues:**
   - Default password is `asset123`
   - Check if `config` table exists in database
   - Verify cookies are enabled in browser

## 📞 Support

All code is available at: https://github.com/gusguecas/Gusbit
Current working version: https://3000-ihkrodwx4nqmux0qp0er9-6532622b.e2b.dev

---
**Deployment Ready! 🚀**