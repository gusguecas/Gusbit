# GusBit - Financial Tracking Application

## Project Overview
- **Name**: GusBit Financial Tracker
- **Goal**: Complete financial tracking application for stocks, ETFs, and cryptocurrency
- **Features**: Asset tracking, portfolio management, live prices search, watchlist, and transaction management

## URLs
- **Development**: https://3000-i3a0u0ap8gmfj3qeuldt7-6532622b.e2b.dev
- **Login**: https://3000-i3a0u0ap8gmfj3qeuldt7-6532622b.e2b.dev/login (Password: asset123)
- **GitHub**: [To be configured]

## Recently Completed Features ✅
- **✅ Live Prices Section Reconstruction**: Completely rebuilt with simplified approach
- **✅ Asset Search**: Simple search interface using CoinGecko and Yahoo Finance APIs
- **✅ Watchlist Integration**: Direct integration to add searched assets to watchlist
- **✅ Clean UI**: Glass card design with GusBit branding (Times New Roman typography)
- **✅ API Integration**: Working `/api/assets/search` endpoint with multi-source results
- **✅ Authentication**: Secure session-based authentication system
- **✅ Watchlist Deletion Fix**: Fixed JavaScript syntax error preventing asset removal from watchlist
- **✅ Wallet Page Fix**: Resolved duplicate route conflict that prevented /wallet from working
- **✅ Transactions Design Fix**: Updated transactions page to use modern gradient design consistent with other pages
- **✅ Daily Snapshots Display Fix**: **MAJOR BUG RESOLVED** - Fixed missing daily snapshots in asset detail pages
  - Issue: Snapshots from recent dates (Sept 18, 2025) not appearing in "Historial Diario" table
  - Root Cause: JavaScript date parsing with timezone offset causing -1 day shift
  - Solution: Modified date parsing to `new Date(snapshot.snapshot_date + 'T00:00:00')` for local time
  - Impact: Users now see complete daily snapshot history including most recent 9 PM Mazatlán snapshots
- **✅ Dashboard Enhancement**: **NEW FEATURE** - Completely redesigned dashboard with modern KPI layout
  - Added: Portfolio evolution chart showing total USD value over time (7D, 30D, 90D views)
  - Added: Clean KPI cards for Portfolio Value, Total Invested, and Total Gain/Loss
  - Added: Organized assets list section with current values and performance indicators
  - Maintained: Existing pie chart for portfolio diversification
  - Enhanced: Better visual hierarchy and modern glass card design
- **✅ Header Standardization**: All sections now have consistent modern navigation
  - Unified GusBit branding with GB logo and professional tagline
  - Complete navigation menu across all pages (Dashboard, Transacciones, Portfolio, Importar, Markets, Watchlist)
  - Active page highlighting and consistent styling
- **✅ CSV Import System**: Full-featured import functionality for historical data
  - Dedicated /import page with drag-and-drop file upload
  - Smart data replacement (clears daily snapshots, preserves transactions)
  - CSV format validation and detailed error reporting
  - Import statistics and status monitoring

## Current Functional Entry URIs

### Main Application Routes
- `GET /` - **ENHANCED: Dashboard** (requires auth) - New KPI layout with portfolio evolution chart
- `GET /login` - Login page
- `GET /transactions` - Transaction management (requires auth)
- `GET /wallet` - Wallet/Portfolio view (requires auth)
- `GET /prices` - **Live Prices Search** (requires auth) - Markets section
- `GET /watchlist` - Watchlist management (requires auth)
- `GET /import` - **NEW: CSV Import** (requires auth) - Historical data import functionality

### API Endpoints
**Authentication & Core**
- `POST /api/auth/login` - Authentication (body: `{"password": "asset123"}`)
- `GET /api/assets/search?q=SYMBOL` - Search assets (BTC, AAPL, etc.)

**Portfolio & Dashboard (NEW)**
- `GET /api/portfolio/summary` - Portfolio KPI summary (total invested, current value, PnL)
- `GET /api/portfolio/evolution` - Portfolio value evolution over time for charts
- `GET /api/portfolio/diversification` - Asset category distribution for pie chart
- `GET /api/portfolio/assets` - Organized list of portfolio assets with performance

**Watchlist & Transactions**
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add asset to watchlist
- `PUT /api/watchlist/:id` - Update watchlist item
- `DELETE /api/watchlist/:symbol` - Remove from watchlist (by asset symbol)
- `GET /api/transactions` - Get transactions
- `GET /api/transactions/recent` - Recent transactions for dashboard
- `POST /api/transactions` - Add transaction

**CSV Import & Historical Data**
- `POST /api/import/csv` - **NEW**: Import CSV file and replace daily snapshots (preserves transactions)
- `GET /api/import/status` - **NEW**: Get import statistics and current historical data status

## Data Architecture
- **Data Models**: 
  - Users, Assets, Watchlist, Transactions, Config
  - Asset categories: stocks, crypto, etfs
  - API sources: alphavantage, coingecko, yahoo
- **Storage Services**: Cloudflare D1 SQLite database
- **Data Flow**: Frontend → Hono API → D1 Database → External APIs (CoinGecko, Alpha Vantage)

## User Guide
1. **Login**: Use password `asset123` to access the application
2. **Search Assets**: Navigate to "Precios en Vivo", enter symbol (BTC, AAPL, etc.)
3. **Add to Watchlist**: After searching, click "Agregar al Watchlist" to save assets
4. **View Watchlist**: See all tracked assets with current prices and performance
5. **Manage Portfolio**: Add transactions to track your actual investments

## Technical Implementation

### Enhanced Dashboard (New Implementation)
**Location**: `/` route in `/src/index.tsx` (lines 227-357)

**Key Features**:
- **KPI Cards**: Portfolio Value, Total Invested, Total Gain/Loss with percentages
- **Portfolio Evolution Chart**: Interactive line chart showing total USD value over time
- **Time Range Filters**: 7D, 30D, 90D views for portfolio evolution
- **Assets List**: Organized display of portfolio assets with performance indicators
- **Diversification Chart**: Maintained existing pie chart for category breakdown
- **Recent Transactions**: Latest portfolio movements and activities

**JavaScript Functions**:
```javascript
loadDashboard()                    // Main dashboard loader
updatePortfolioEvolutionChart()    // Render portfolio evolution chart
changePortfolioRange()             // Handle time range changes (7D/30D/90D)
displayAssetsList()                // Show organized assets with performance
updateDiversificationChart()       // Update pie chart for diversification
filterPortfolioDataByRange()       // Filter evolution data by time range
```

### Live Prices Section (Recently Rebuilt)
**Location**: `/prices` route in `/src/index.tsx` (lines 5047-5711)

**Key Features**:
- Simple search interface with single input field
- Real-time asset search with `/api/assets/search` endpoint
- Direct watchlist integration with add/remove functionality
- Responsive glass card design matching GusBit branding
- Support for stocks, ETFs, and cryptocurrency

**JavaScript Functions**:
```javascript
searchAsset()        // Main search function using axios
showAssetInfo()      // Display search results
addToWatchlist()     // Add asset to user's watchlist
quickSearch()        // Pre-filled search for common assets
loadWatchlist()      // Load and display current watchlist
```

**API Integration**:
- Uses existing `/api/assets/search` endpoint
- Results include: symbol, name, category, API source
- Integrates with CoinGecko and Alpha Vantage APIs
- Returns multiple matches ranked by relevance

## Deployment
- **Platform**: Cloudflare Pages + Workers
- **Status**: ✅ Active (Development)
- **Tech Stack**: Hono + TypeScript + TailwindCSS + Cloudflare D1
- **Build Command**: `npm run build`
- **Dev Command**: `npm run dev:sandbox` (with PM2)
- **Last Updated**: September 21, 2025 - Header Standardization & CSV Import

## Recently Completed Features ✅ (September 21, 2025)
- **✅ Header Estandarization**: Unified modern header design across all sections
  - All pages now use the same elegant GusBit logo with GB initials and tagline
  - Consistent navigation menu with proper active states
  - Modern nav-modern class styling throughout the application
  - Complete navigation includes: Dashboard, Transacciones, Portfolio, Importar, Markets, Watchlist
- **✅ CSV Import Functionality**: Complete system for importing historical data
  - New /import page with file upload interface
  - Automatic daily snapshots replacement (preserves transactions)
  - CSV format validation and error reporting
  - Import status and statistics display
  - Database migration for enhanced transaction fields

## Features Not Yet Implemented
- Real-time price updates (currently on-demand)
- Price alerts and notifications
- Advanced portfolio analytics (historical performance, Sharpe ratio, etc.)
- Mobile app version
- Portfolio benchmarking against market indices

## Recommended Next Steps
1. **User Testing**: Test the enhanced dashboard functionality thoroughly
2. **Real-time Updates**: Implement WebSocket for live price feeds in dashboard
3. **Enhanced Analytics**: Add advanced portfolio metrics (ROI, volatility, etc.)
4. **Mobile Optimization**: Improve responsive design for mobile devices
5. **Performance Optimization**: Implement caching for portfolio evolution data
6. **Production Deployment**: Deploy to Cloudflare Pages for production use

## Development Commands

### Local Development
```bash
npm install                    # Install dependencies
npm run build                  # Build for development
npm run dev:sandbox           # Start with PM2 (sandbox)
npm run dev                   # Start with Vite (local)
```

### Database Management
```bash
npm run db:migrate:local      # Apply migrations locally
npm run db:seed               # Seed test data
npm run db:reset              # Reset local database
```

### Deployment
```bash
npm run deploy                # Deploy to Cloudflare Pages
npm run cf-typegen           # Generate TypeScript types
```

### Server Management
```bash
pm2 list                     # List PM2 processes
pm2 logs webapp --nostream   # Check logs safely
pm2 restart webapp           # Restart server
```