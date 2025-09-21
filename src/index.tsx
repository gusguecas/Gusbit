import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie, setCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
const authMiddleware = async (c: any, next: any) => {
  const url = new URL(c.req.url)
  
  // Skip auth for login page, API endpoints, and special routes
  if (url.pathname === '/login' || 
      url.pathname === '/api/auth/login' || 
      url.pathname === '/force-snapshots' || 
      url.pathname === '/auto-login' || 
      url.pathname === '/direct-import' || 
      url.pathname === '/fix-holdings' ||
      url.pathname.startsWith('/api/')) {
    return next()
  }
  
  // Check session cookie
  const sessionCookie = getCookie(c, 'asset_session')
  if (!sessionCookie || sessionCookie !== 'authenticated') {
    return c.redirect('/login')
  }
  
  return next()
}

// Apply auth middleware to all routes except login
app.use('*', authMiddleware)

// ============================================
// MANUAL SNAPSHOT TRIGGER (Development Only)
// ============================================

app.post('/api/manual-snapshot', async (c) => {
  try {
    console.log('🔧 Manual snapshot triggered via API')
    const result = await processAllDailySnapshots(c.env.DB)
    return c.json({
      success: true,
      message: 'Manual snapshot completed',
      result: result
    })
  } catch (error) {
    console.error('❌ Manual snapshot failed:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Login page
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - Login</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="min-h-screen">
        
        <!-- Navigation Executive Header -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-12">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-4">
                                <!-- Logo GusBit con tipografía y spacing optimizados -->
                                <div class="flex flex-col items-start">
                                    <!-- GB con formas exactas y spacing perfecto -->
                                    <div class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 3.2rem; line-height: 0.75; letter-spacing: -0.08em;">
                                        <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GB</span>
                                    </div>
                                    
                                    <!-- GusBit con el mismo estilo tipográfico -->
                                    <div class="-mt-1">
                                        <h1 class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 1.8rem; line-height: 0.9; letter-spacing: -0.03em; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                                            GusBit
                                        </h1>
                                        
                                        <!-- Tagline con spacing perfecto -->
                                        <div class="text-white leading-tight" style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.6rem; letter-spacing: 0.12em; line-height: 1.1; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            TRACK STOCKS<br>
                                            ETFS &amp; CRYPTO
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-line mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-briefcase mr-2"></i>
                                Portfolio
                            </a>
                            <a href="/import" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-upload mr-2"></i>
                                Importar
                            </a>
                            <a href="/prices" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-area mr-2"></i>
                                Markets
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 transition-all font-medium text-sm">
                        <i class="fas fa-power-off mr-2"></i>
                        Salir
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-8 py-12 flex items-center justify-center min-h-screen">
            <div class="executive-card executive-border rounded-2xl p-10 w-full max-w-md executive-shadow">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-light executive-text-primary mb-3 tracking-tight">Acceso Ejecutivo</h2>
                    <p class="executive-text-secondary text-sm font-medium">Ingresa tu contraseña para continuar</p>
                    <div class="w-16 h-1 bg-blue-500 mt-4 rounded-full mx-auto"></div>
                </div>
            
            <!-- Notification for cleared cookies -->
            <div id="clearNotification" class="mb-6 p-4 bg-emerald-900 bg-opacity-30 border border-emerald-500 border-opacity-50 text-emerald-300 rounded-xl hidden">
                <i class="fas fa-check-circle mr-2"></i>
                Cookies limpiadas. Ingresa tu contraseña nuevamente.
            </div>
            
            <form id="loginForm" class="space-y-8">
                <div>
                    <label class="block text-sm font-semibold executive-text-primary mb-3 tracking-wide">Contraseña de Acceso</label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="password" 
                            class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all"
                            placeholder="Ingresa tu contraseña ejecutiva"
                            required
                        >
                        <i class="fas fa-lock absolute right-4 top-4 text-slate-400"></i>
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    class="w-full executive-bg-blue text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 executive-shadow"
                >
                    <i class="fas fa-sign-in-alt mr-3"></i>
                    Acceso Ejecutivo
                </button>
                
                <div id="error-message" class="text-red-400 text-sm text-center font-medium hidden"></div>
            </form>
        </div>
        
        <script>
            // Check if cookies were cleared
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('cleared') === 'true') {
                document.getElementById('clearNotification').classList.remove('hidden');
            }
            
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('error-message');
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        window.location.href = '/';
                    } else {
                        errorDiv.textContent = data.message || 'Contraseña incorrecta';
                        errorDiv.classList.remove('hidden');
                    }
                } catch (error) {
                    errorDiv.textContent = 'Error de conexión';
                    errorDiv.classList.remove('hidden');
                }
            });
        </script>
    </body>
    </html>
  `)
})

// Login API endpoint
app.post('/api/auth/login', async (c) => {
  try {
    const { password } = await c.req.json()
    
    // Get stored password from database
    const result = await c.env.DB.prepare('SELECT value FROM config WHERE key = ?')
      .bind('app_password')
      .first()
    
    const storedPassword = result?.value || 'asset123'
    
    if (password === storedPassword) {
      // Set session cookie
      setCookie(c, 'asset_session', 'authenticated', {
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',  // Cambié de Strict a Lax para desarrollo
        secure: false,     // Agregué secure: false para desarrollo
        maxAge: 86400
      })
      return c.json({ success: true })
    } else {
      return c.json({ success: false, message: 'Contraseña incorrecta' }, 401)
    }
  } catch (error) {
    return c.json({ success: false, message: 'Error del servidor' }, 500)
  }
})

// Logout endpoint
app.post('/api/auth/logout', (c) => {
  setCookie(c, 'asset_session', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: 0
  })
  return c.json({ success: true })
})

// Force logout endpoint (clears all cookies)
app.get('/api/auth/force-logout', (c) => {
  // Clear session cookie
  setCookie(c, 'asset_session', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
    maxAge: 0
  })
  return c.redirect('/login?cleared=true')
})

// ============================================
// MAIN APPLICATION ROUTES
// ============================================

// Main dashboard
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="min-h-screen">
        <link href="/static/styles.css" rel="stylesheet">
        
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-12">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-4">
                                <!-- Logo GusBit con tipografía y spacing optimizados -->
                                <div class="flex flex-col items-start">
                                    <!-- GB con formas exactas y spacing perfecto -->
                                    <div class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 3.2rem; line-height: 0.75; letter-spacing: -0.08em;">
                                        <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GB</span>
                                    </div>
                                    
                                    <!-- GusBit con el mismo estilo tipográfico -->
                                    <div class="-mt-1">
                                        <h1 class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 1.8rem; line-height: 0.9; letter-spacing: -0.03em; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                                            GusBit
                                        </h1>
                                        
                                        <!-- Tagline con spacing perfecto -->
                                        <div class="text-white leading-tight" style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.6rem; letter-spacing: 0.12em; line-height: 1.1; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            TRACK STOCKS<br>
                                            ETFS &amp; CRYPTO
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm">
                                <i class="fas fa-chart-line mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-briefcase mr-2"></i>
                                Portfolio
                            </a>
                            <a href="/import" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-upload mr-2"></i>
                                Importar
                            </a>
                            <a href="/prices" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-area mr-2"></i>
                                Markets
                            </a>
                            <a href="/watchlist" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-star mr-2"></i>
                                Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 transition-all font-medium text-sm">
                        <i class="fas fa-power-off mr-2"></i>
                        Salir
                    </button>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto">

        <!-- Main Content -->
        <div class="px-8 py-12">
            <!-- Executive Header -->
            <div class="flex justify-between items-start mb-12">
                <div>
                    <h1 class="text-5xl font-light text-white mb-3 tracking-tight drop-shadow-lg">Portfolio Overview</h1>
                    <p class="executive-text-secondary font-medium text-lg">Resumen ejecutivo de inversiones</p>
                    <div class="w-20 h-1 bg-blue-500 mt-4 rounded-full shadow-lg"></div>
                </div>
                <a href="/transactions" class="executive-bg-blue text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center executive-shadow font-medium">
                    <i class="fas fa-plus mr-3"></i>
                    Nueva Transacción
                </a>
            </div>

            <!-- Executive KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <!-- Portfolio Value -->
                <div class="executive-card executive-border rounded-2xl p-8 executive-shadow hover:shadow-lg transition-all duration-300">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-blue-900 bg-opacity-50 rounded-xl flex items-center justify-center border border-blue-500 border-opacity-30">
                                <i class="fas fa-chart-line text-blue-400 text-lg"></i>
                            </div>
                            <span class="text-slate-300 font-medium text-sm tracking-wide uppercase">Portfolio Value</span>
                        </div>
                    </div>
                    <div class="text-4xl font-light executive-text-primary mb-2" id="portfolio-value">$0.00</div>
                    <div class="text-sm executive-text-secondary font-medium" id="portfolio-change">
                        <i class="fas fa-arrow-up"></i> $0.00 monthly growth
                    </div>
                </div>

                <!-- Total Investment -->
                <div class="executive-card executive-border rounded-2xl p-8 executive-shadow hover:shadow-lg transition-all duration-300">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-slate-700 bg-opacity-50 rounded-xl flex items-center justify-center border border-slate-500 border-opacity-30">
                                <i class="fas fa-piggy-bank text-slate-400 text-lg"></i>
                            </div>
                            <span class="text-slate-300 font-medium text-sm tracking-wide uppercase">Total Invested</span>
                        </div>
                    </div>
                    <div class="text-4xl font-light executive-text-primary mb-2" id="total-invested">$0.00</div>
                    <div class="text-sm executive-text-secondary font-medium">Capital deployed</div>
                </div>

                <!-- Net P&L -->
                <div class="executive-card executive-border rounded-2xl p-8 executive-shadow hover:shadow-lg transition-all duration-300">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-emerald-900 bg-opacity-50 rounded-xl flex items-center justify-center border border-emerald-500 border-opacity-30">
                                <i class="fas fa-trophy text-emerald-400 text-lg"></i>
                            </div>
                            <span class="text-slate-300 font-medium text-sm tracking-wide uppercase">Net P&L</span>
                        </div>
                    </div>
                    <div class="text-4xl font-light executive-text-primary" id="total-pnl">$0.00</div>
                    <div class="text-sm executive-text-secondary font-medium mt-2" id="total-pnl-percent">0.00% total return</div>
                </div>
            </div>

            <!-- Executive Charts Section -->
            <div class="grid grid-cols-1 gap-8 mb-16">
                <!-- Advanced Portfolio Analytics Chart -->
                <div class="executive-card executive-border rounded-2xl p-8 executive-shadow">
                    <!-- Header Section -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-blue-900 bg-opacity-50 rounded-xl flex items-center justify-center border border-blue-500 border-opacity-30">
                                <i class="fas fa-chart-line text-blue-400 text-lg"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-light executive-text-primary tracking-tight">Portfolio Analytics</h2>
                                <p class="executive-text-secondary text-sm font-medium">Análisis por categorías y tiempo</p>
                            </div>
                        </div>
                    </div>

                    <!-- Category Tabs Section -->
                    <div class="flex space-x-1 mb-6 bg-slate-800 bg-opacity-50 p-1 rounded-xl border executive-border">
                        <button onclick="changePortfolioCategory('overview')" class="flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all category-tab-btn bg-blue-600 text-white" data-category="overview">
                            <i class="fas fa-chart-pie mr-2"></i>Overview
                        </button>
                        <button onclick="changePortfolioCategory('crypto')" class="flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all category-tab-btn text-slate-300 hover:bg-slate-700 hover:bg-opacity-50" data-category="crypto">
                            <i class="fab fa-bitcoin mr-2"></i>Crypto
                        </button>
                        <button onclick="changePortfolioCategory('stocks')" class="flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all category-tab-btn text-slate-300 hover:bg-slate-700 hover:bg-opacity-50" data-category="stocks">
                            <i class="fas fa-chart-bar mr-2"></i>Stocks
                        </button>
                        <button onclick="changePortfolioCategory('etfs')" class="flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all category-tab-btn text-slate-300 hover:bg-slate-700 hover:bg-opacity-50" data-category="etfs">
                            <i class="fas fa-layer-group mr-2"></i>ETFs
                        </button>
                    </div>

                    <!-- Time Range Controls -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center space-x-3">
                            <span class="text-sm executive-text-secondary font-medium">Rango temporal:</span>
                            <div class="flex space-x-1 bg-slate-800 bg-opacity-30 p-1 rounded-lg border executive-border">
                                <button onclick="changePortfolioTimeRange('1H')" class="px-3 py-2 text-xs font-medium rounded-md transition-all time-range-btn text-slate-400 hover:bg-slate-700 hover:bg-opacity-50 hover:text-slate-200" data-range="1H">1H</button>
                                <button onclick="changePortfolioTimeRange('1D')" class="px-3 py-2 text-xs font-medium rounded-md transition-all time-range-btn text-slate-400 hover:bg-slate-700 hover:bg-opacity-50 hover:text-slate-200" data-range="1D">1D</button>
                                <button onclick="changePortfolioTimeRange('1W')" class="px-3 py-2 text-xs font-medium rounded-md transition-all time-range-btn text-slate-400 hover:bg-slate-700 hover:bg-opacity-50 hover:text-slate-200" data-range="1W">1W</button>
                                <button onclick="changePortfolioTimeRange('1M')" class="px-3 py-2 text-xs font-medium rounded-md transition-all time-range-btn bg-blue-600 text-white" data-range="1M">1M</button>
                                <button onclick="changePortfolioTimeRange('YTD')" class="px-3 py-2 text-xs font-medium rounded-md transition-all time-range-btn text-slate-400 hover:bg-slate-700 hover:bg-opacity-50 hover:text-slate-200" data-range="YTD">YTD</button>
                                <button onclick="changePortfolioTimeRange('1Y')" class="px-3 py-2 text-xs font-medium rounded-md transition-all time-range-btn text-slate-400 hover:bg-slate-700 hover:bg-opacity-50 hover:text-slate-200" data-range="1Y">1Y</button>
                                <button onclick="changePortfolioTimeRange('ALL')" class="px-3 py-2 text-xs font-medium rounded-md transition-all time-range-btn text-slate-400 hover:bg-slate-700 hover:bg-opacity-50 hover:text-slate-200" data-range="ALL">ALL</button>
                            </div>
                        </div>
                        
                        <!-- Portfolio Value Display -->
                        <div class="text-right">
                            <div class="text-2xl font-bold executive-text-primary" id="currentPortfolioValue">$233,892.59</div>
                            <div class="text-sm" id="portfolioChange">
                                <span class="text-green-400 font-medium">+2,847.32 (+1.23%)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Chart Container -->
                    <div class="h-96 relative">
                        <canvas id="portfolioAnalyticsChart"></canvas>
                        <!-- Loading State -->
                        <div id="chartLoading" class="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-50 rounded-lg hidden">
                            <div class="flex items-center space-x-3">
                                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                                <span class="text-sm executive-text-secondary">Cargando datos...</span>
                            </div>
                        </div>
                    </div>

                    <!-- Chart Statistics -->
                    <div class="grid grid-cols-4 gap-4 mt-6 pt-6 border-t executive-border">
                        <div class="text-center">
                            <div class="text-lg font-semibold executive-text-primary" id="statHigh">-</div>
                            <div class="text-xs executive-text-secondary">Máximo</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold executive-text-primary" id="statLow">-</div>
                            <div class="text-xs executive-text-secondary">Mínimo</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold executive-text-primary" id="statAvg">-</div>
                            <div class="text-xs executive-text-secondary">Promedio</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold executive-text-primary" id="statVolatility">-</div>
                            <div class="text-xs executive-text-secondary">Volatilidad</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Executive Analytics Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                <!-- Asset Allocation -->
                <div class="executive-card executive-border rounded-2xl p-8 executive-shadow">
                    <div class="flex items-center space-x-4 mb-8">
                        <div class="w-12 h-12 bg-indigo-900 bg-opacity-50 rounded-xl flex items-center justify-center border border-indigo-500 border-opacity-30">
                            <i class="fas fa-chart-pie text-indigo-400 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-light executive-text-primary tracking-tight">Asset Allocation</h3>
                            <p class="executive-text-secondary text-sm font-medium">Diversificación por categoría</p>
                        </div>
                    </div>
                    <div class="flex justify-center">
                        <canvas id="diversificationChart" width="350" height="350"></canvas>
                    </div>
                </div>

                <!-- Holdings Overview -->
                <div class="executive-card executive-border rounded-2xl p-8 executive-shadow">
                    <div class="flex justify-between items-center mb-8">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-emerald-900 bg-opacity-50 rounded-xl flex items-center justify-center border border-emerald-500 border-opacity-30">
                                <i class="fas fa-briefcase text-emerald-400 text-lg"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-light executive-text-primary tracking-tight">Holdings</h3>
                                <p class="executive-text-secondary text-sm font-medium">Top performing assets</p>
                            </div>
                        </div>
                        <button onclick="toggleAssetsList()" class="px-4 py-2 text-sm rounded-lg border executive-border hover:bg-slate-700 hover:bg-opacity-50 transition-all font-medium text-slate-300">
                            <span id="assets-toggle-text">Expand</span> <i class="fas fa-chevron-down ml-2 text-xs" id="assets-toggle-icon"></i>
                        </button>
                    </div>
                    <div id="assets-list" class="space-y-4">
                        <!-- Assets will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Executive Transaction History -->
            <div class="executive-card executive-border rounded-2xl p-8 executive-shadow mb-16">
                <div class="flex justify-between items-center mb-8">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-amber-900 bg-opacity-50 rounded-xl flex items-center justify-center border border-amber-500 border-opacity-30">
                            <i class="fas fa-clock text-amber-400 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-light executive-text-primary tracking-tight">Recent Activity</h3>
                            <p class="executive-text-secondary text-sm font-medium">Últimas transacciones ejecutadas</p>
                        </div>
                    </div>
                    <a href="/transactions" class="px-6 py-3 text-sm rounded-lg border executive-border hover:bg-slate-700 hover:bg-opacity-50 transition-all font-medium executive-text-primary">
                        View All <i class="fas fa-external-link-alt ml-2 text-xs"></i>
                    </a>
                </div>
                <div id="recent-transactions" class="overflow-hidden">
                    <!-- Transactions will be loaded here -->
                </div>
            </div>
        </div>
        </div>

        <script>
            // Global variables
            let diversificationChart = null;
            let portfolioEvolutionChart = null; // Legacy - kept for compatibility
            let portfolioAnalyticsChart = null;
            let currentPortfolioRange = '90d'; // Legacy - kept for compatibility
            let currentPortfolioCategory = 'overview';
            let currentPortfolioTimeRange = '1M';

            // Configure axios to include cookies
            axios.defaults.withCredentials = true;
            
            // Load dashboard data
            async function loadDashboard() {
                console.log('=== STARTING DASHBOARD LOAD ===');
                
                try {
                    // Load portfolio summary
                    console.log('Fetching portfolio summary...');
                    const summaryResponse = await axios.get('/api/portfolio/summary');
                    const summary = summaryResponse.data;
                    console.log('Portfolio summary loaded:', summary);

                    // Update KPIs - Fixed references
                    document.getElementById('portfolio-value').textContent = 
                        '$' + summary.currentValue.toLocaleString('en-US', {minimumFractionDigits: 2});
                    document.getElementById('total-invested').textContent = 
                        '$' + summary.totalInvested.toLocaleString('en-US', {minimumFractionDigits: 2});
                        
                    // Update portfolio change
                    const changeElement = document.getElementById('portfolio-change');
                    const changeValue = summary.currentValue - summary.totalInvested;
                    const changeIcon = changeValue >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
                    const changeText = changeValue >= 0 ? 'de ganancia' : 'de pérdida';
                    changeElement.innerHTML = '<i class="' + changeIcon + '"></i> $' + Math.abs(changeValue).toLocaleString('en-US', {minimumFractionDigits: 2}) + ' ' + changeText;

                    // Update PnL
                    const pnlElement = document.getElementById('total-pnl');
                    const pnlPercentElement = document.getElementById('total-pnl-percent');
                    const pnlValue = summary.totalPnL || (summary.currentValue - summary.totalInvested);
                    const pnlPercent = summary.totalInvested > 0 ? (pnlValue / summary.totalInvested) * 100 : 0;
                    
                    pnlElement.textContent = '$' + pnlValue.toLocaleString('en-US', {minimumFractionDigits: 2});
                    
                    // Update PnL color and percentage
                    if (pnlValue >= 0) {
                        pnlElement.className = 'text-3xl font-bold text-green-600';
                        pnlPercentElement.innerHTML = '+' + pnlPercent.toFixed(2) + '% de ganancia';
                        pnlPercentElement.className = 'text-sm mt-1 text-green-600';
                    } else {
                        pnlElement.className = 'text-3xl font-bold text-red-600';
                        pnlPercentElement.innerHTML = pnlPercent.toFixed(2) + '% de pérdida';
                        pnlPercentElement.className = 'text-sm mt-1 text-red-600';
                    }

                    // Load portfolio evolution data
                    console.log('Loading portfolio analytics...');
                    await loadPortfolioEvolution();
                    console.log('Portfolio analytics loaded successfully');

                    // Load diversification data
                    console.log('Fetching diversification data...');
                    const diversificationResponse = await axios.get('/api/portfolio/diversification');
                    const diversification = diversificationResponse.data;
                    console.log('Diversification data:', diversification);
                    
                    updateDiversificationChart(diversification);
                    console.log('Diversification chart updated');

                    // Load category summary for overview (default)
                    console.log('Loading default category summary...');
                    await loadCategorySummary();

                    // Load recent transactions
                    console.log('Fetching recent transactions...');
                    const transactionsResponse = await axios.get('/api/transactions/recent');
                    const transactions = transactionsResponse.data;
                    console.log('Recent transactions:', transactions.length, 'transactions loaded');
                    
                    displayRecentTransactions(transactions);
                    
                    console.log('=== DASHBOARD LOADED SUCCESSFULLY ===');

                } catch (error) {
                    console.error('CRITICAL ERROR loading dashboard:', error);
                    console.error('Error details:', error.response ? error.response.data : error.message);
                    console.error('Stack trace:', error.stack);
                    
                    // Show user-friendly error
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md';
                    errorDiv.innerHTML = '<h3 class="font-bold mb-2">Error cargando datos</h3><p class="text-sm">' + 
                                       (error.response ? error.response.data.error || error.message : error.message) + '</p>' +
                                       '<button onclick="this.parentElement.remove()" class="mt-2 text-xs bg-red-700 px-2 py-1 rounded">Cerrar</button>';
                    document.body.appendChild(errorDiv);
                    
                    // Auto remove after 10 seconds
                    setTimeout(() => {
                        if (errorDiv.parentElement) errorDiv.remove();
                    }, 10000);
                }
            }

            // Update diversification chart
            function updateDiversificationChart(data) {
                const ctx = document.getElementById('diversificationChart').getContext('2d');
                
                if (diversificationChart) {
                    diversificationChart.destroy();
                }

                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                
                diversificationChart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: data.map(item => item.category),
                        datasets: [{
                            data: data.map(item => item.percentage),
                            backgroundColor: colors.slice(0, data.length),
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.label + ': ' + context.parsed + '%';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Display recent transactions - Executive Style
            function displayRecentTransactions(transactions) {
                const container = document.getElementById('recent-transactions');
                
                if (transactions.length === 0) {
                    container.innerHTML = '<div class="text-center py-12"><div class="w-16 h-16 bg-slate-700 bg-opacity-50 rounded-full mx-auto mb-4 flex items-center justify-center border border-slate-500 border-opacity-30"><i class="fas fa-history text-slate-400 text-xl"></i></div><p class="executive-text-secondary font-medium">No recent transactions</p></div>';
                    return;
                }

                // Executive Cards Layout instead of table
                let cardsHTML = '<div class="space-y-3">';
                
                transactions.slice(0, 5).forEach(tx => {
                    const txDate = new Date(tx.transaction_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                    });
                    const statusClass = tx.type === 'buy' ? 'executive-status-positive' : 
                                       tx.type === 'sell' ? 'executive-status-negative' : 'executive-status-neutral';
                    const iconClass = tx.type === 'buy' ? 'fa-plus' : tx.type === 'sell' ? 'fa-minus' : 'fa-exchange-alt';
                    const typeText = tx.type === 'buy' ? 'BUY' : tx.type === 'sell' ? 'SELL' : 'TRADE';
                    const quantity = parseFloat(tx.quantity).toLocaleString('en-US', {maximumFractionDigits: 6});
                    const totalAmount = parseFloat(tx.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2});
                    
                    cardsHTML += '<div class="executive-transaction flex items-center justify-between">';
                    cardsHTML += '<div class="flex items-center space-x-4">';
                    cardsHTML += '<div class="flex flex-col items-center">';
                    cardsHTML += '<div class="text-xs executive-text-secondary font-medium">' + txDate + '</div>';
                    cardsHTML += '<div class="w-2 h-2 bg-slate-300 rounded-full mt-1"></div>';
                    cardsHTML += '</div>';
                    cardsHTML += '<div>';
                    cardsHTML += '<div class="flex items-center space-x-2 mb-1">';
                    cardsHTML += '<span class="' + statusClass + '">';
                    cardsHTML += '<i class="fas ' + iconClass + ' mr-1"></i>' + typeText;
                    cardsHTML += '</span>';
                    cardsHTML += '<span class="executive-text-primary font-semibold text-sm">' + tx.asset_symbol + '</span>';
                    cardsHTML += '</div>';
                    cardsHTML += '<div class="text-xs executive-text-secondary">' + quantity + ' units @ ' + tx.exchange + '</div>';
                    cardsHTML += '</div></div>';
                    cardsHTML += '<div class="text-right">';
                    cardsHTML += '<div class="executive-text-primary font-semibold">$' + totalAmount + '</div>';
                    cardsHTML += '</div></div>';
                });
                
                cardsHTML += '</div>';
                
                container.innerHTML = cardsHTML;
            }

            // Advanced Portfolio Analytics Chart

            // Update portfolio analytics chart with category and time range support
            function updatePortfolioAnalyticsChart(data, category = 'overview', timeRange = '1D') {
                const ctx = document.getElementById('portfolioAnalyticsChart').getContext('2d');
                
                if (portfolioAnalyticsChart) {
                    portfolioAnalyticsChart.destroy();
                }

                // Filter and process data by category and time range
                const processedData = processPortfolioData(data, category, timeRange);
                
                const labels = processedData.map(d => formatChartLabel(d.date, timeRange));
                const values = processedData.map(d => parseFloat(d.value));
                
                console.log('Portfolio Analytics Chart:', { category, timeRange, points: labels.length });
                console.log('Data range:', labels[0], 'to', labels[labels.length - 1]);

                // Update current value display
                updatePortfolioValueDisplay(processedData);
                
                // Update statistics
                updatePortfolioStatistics(values);

                console.log('Creating chart with', labels.length, 'labels and', values.length, 'values');
                console.log('Chart labels preview:', labels.slice(0, 3), '...', labels.slice(-3));
                console.log('Chart values preview:', values.slice(0, 3), '...', values.slice(-3));
                
                // Chart configuration with executive styling
                portfolioAnalyticsChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: getCategoryLabel(category),
                            data: values,
                            borderColor: getCategoryColor(category).border,
                            backgroundColor: getCategoryColor(category).background,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: getCategoryColor(category).border,
                            pointHoverBorderColor: '#1e293b',
                            pointHoverBorderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                titleColor: '#e2e8f0',
                                bodyColor: '#cbd5e1',
                                borderColor: '#475569',
                                borderWidth: 1,
                                cornerRadius: 8,
                                displayColors: false,
                                callbacks: {
                                    title: function(context) {
                                        return formatTooltipDate(context[0].label, timeRange);
                                    },
                                    label: function(context) {
                                        const value = parseFloat(context.parsed.y);
                                        return getCategoryLabel(category) + ': $' + value.toLocaleString('en-US', { minimumFractionDigits: 2 });
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                display: true,
                                grid: {
                                    color: 'rgba(71, 85, 105, 0.2)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#94a3b8',
                                    font: {
                                        size: 11,
                                        family: 'Inter'
                                    },
                                    maxTicksLimit: getMaxTicks(timeRange),
                                    callback: function(value, index) {
                                        return this.getLabelForValue(value);
                                    }
                                }
                            },
                            y: {
                                display: true,
                                position: 'left',
                                grid: {
                                    color: 'rgba(71, 85, 105, 0.1)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#94a3b8',
                                    font: {
                                        size: 11,
                                        family: 'Inter'
                                    },
                                    callback: function(value) {
                                        return '$' + value.toLocaleString('en-US', { 
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        });
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Helper functions for portfolio analytics
            function processPortfolioData(data, category, timeRange) {
                console.log('Processing data - Category:', category, 'TimeRange:', timeRange, 'Raw data count:', data.length);
                
                // Category filtering is done on the backend via API
                // Only apply time range filtering on frontend
                let filteredData = filterDataByTimeRange(data, timeRange);
                
                console.log('Processed data count after time filter:', filteredData.length);
                if (filteredData.length > 0) {
                    console.log('Processed data range:', filteredData[0].value, 'to', filteredData[filteredData.length - 1].value);
                }
                
                return filteredData;
            }
            
            function filterDataByTimeRange(data, timeRange) {
                if (!data || data.length === 0) return [];
                
                console.log('=== TIME RANGE FILTER DEBUG ===');
                console.log('Time range:', timeRange);
                console.log('Input data count:', data.length);
                console.log('Raw input data (last 5):', data.slice(-5));
                
                // SPECIFIC CHECK FOR SEPTEMBER 18TH
                const sep18Data = data.filter(d => d.date === '2025-09-18');
                console.log('🔍 SEPTEMBER 18TH CHECK:', sep18Data.length > 0 ? 'FOUND' : 'NOT FOUND');
                if (sep18Data.length > 0) {
                    console.log('Sep 18 data:', sep18Data[0]);
                }
                
                // For 'ALL' timeRange, return all data without filtering
                if (timeRange === 'ALL') {
                    const allData = data.map(d => ({
                        ...d, 
                        value: d.totalValue,
                        totalPnL: d.totalPnL,
                        pnlPercentage: d.pnlPercentage,
                        hasTransaction: d.hasTransaction
                    }));
                    console.log('ALL case: returning all data, count:', allData.length);
                    console.log('Date range:', allData[0]?.date, 'to', allData[allData.length - 1]?.date);
                    const sep18InAll = allData.filter(d => d.date === '2025-09-18');
                    console.log('Sep 18 in ALL result:', sep18InAll.length > 0 ? 'INCLUDED' : 'MISSING');
                    return allData;
                }
                
                // Get the latest date from actual data
                const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
                const latestDataDate = new Date(sortedData[0].date);
                
                console.log('Latest data date from API:', sortedData[0].date);
                console.log('Latest data parsed:', latestDataDate.toISOString());
                
                let cutoffDate;
                
                switch (timeRange) {
                    case '1H':
                    case '1D':
                        // Show last 3 days for 1H/1D view
                        cutoffDate = new Date(latestDataDate.getTime() - (2 * 24 * 60 * 60 * 1000));
                        break;
                    case '1W':
                        cutoffDate = new Date(latestDataDate.getTime() - (6 * 24 * 60 * 60 * 1000));
                        break;
                    case '1M':
                        // Show last 30 days
                        cutoffDate = new Date(latestDataDate.getTime() - (29 * 24 * 60 * 60 * 1000));
                        break;
                    case 'YTD':
                        cutoffDate = new Date(latestDataDate.getFullYear(), 0, 1);
                        break;
                    case '1Y':
                        cutoffDate = new Date(latestDataDate.getTime() - (364 * 24 * 60 * 60 * 1000));
                        break;
                    default:
                        cutoffDate = new Date(latestDataDate.getTime() - (29 * 24 * 60 * 60 * 1000));
                        break;
                }
                
                console.log('Cutoff date calculated:', cutoffDate.toISOString());
                console.log('Cutoff date string:', cutoffDate.toISOString().split('T')[0]);
                
                // SPECIFIC CHECK FOR SEPTEMBER 18TH VS CUTOFF
                console.log('🔍 Sep 18 vs cutoff: "2025-09-18" >= "' + cutoffDate.toISOString().split('T')[0] + '" =', "2025-09-18" >= cutoffDate.toISOString().split('T')[0]);
                
                const filteredData = data
                    .filter(d => {
                        // Simple string comparison for YYYY-MM-DD format
                        const itemDateStr = d.date;
                        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
                        const include = itemDateStr >= cutoffDateStr;
                        if (itemDateStr.includes('2025-09-18') || itemDateStr.includes('2025-09-19') || itemDateStr.includes('2025-09-20')) {
                            console.log('🎯 CRITICAL DATE CHECK:', itemDateStr, '>=', cutoffDateStr, '→', include);
                        }
                        return include;
                    })
                    .map(d => ({
                        ...d, 
                        value: d.totalValue || d.value,
                        totalPnL: d.totalPnL,
                        pnlPercentage: d.pnlPercentage,
                        hasTransaction: d.hasTransaction
                    }))
                    .sort((a, b) => a.date.localeCompare(b.date));
                
                console.log('Final filtered data count:', filteredData.length);
                if (filteredData.length > 0) {
                    console.log('Final date range:', filteredData[0].date, 'to', filteredData[filteredData.length - 1].date);
                    console.log('Last 5 dates in result:', filteredData.slice(-5).map(d => d.date));
                    
                    // FINAL CHECK FOR SEPTEMBER 18TH
                    const sep18InResult = filteredData.filter(d => d.date === '2025-09-18');
                    console.log('🚨 SEPTEMBER 18TH IN FINAL RESULT:', sep18InResult.length > 0 ? 'INCLUDED ✅' : 'MISSING ❌');
                }
                console.log('=== END TIME RANGE FILTER DEBUG ===');
                
                return filteredData;
            }
            
            function filterDataByCategory(data, category) {
                // Category filtering is now done on the backend via API
                // This function just ensures data structure consistency
                return data.map(d => ({...d, value: d.totalValue}));
            }
            
            function getCategoryLabel(category) {
                const labels = {
                    'overview': 'Portfolio Total',
                    'crypto': 'Cryptomonedas',
                    'stocks': 'Acciones',
                    'etfs': 'ETFs'
                };
                return labels[category] || 'Portfolio';
            }
            
            function getCategoryColor(category) {
                const colors = {
                    'overview': {
                        border: '#3b82f6',
                        background: 'rgba(59, 130, 246, 0.1)'
                    },
                    'crypto': {
                        border: '#f59e0b',
                        background: 'rgba(245, 158, 11, 0.1)'
                    },
                    'stocks': {
                        border: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)'
                    },
                    'etfs': {
                        border: '#8b5cf6',
                        background: 'rgba(139, 92, 246, 0.1)'
                    }
                };
                return colors[category] || colors['overview'];
            }
            
            function formatChartLabel(date, timeRange) {
                const d = new Date(date);
                
                switch (timeRange) {
                    case '1H':
                        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    case '1D':
                        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    case '1W':
                    case '1M':
                        return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
                    case 'YTD':
                    case '1Y':
                        return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
                    case 'ALL':
                    default:
                        return d.toLocaleDateString('es-ES', { year: '2-digit', month: 'short' });
                }
            }
            
            function formatTooltipDate(label, timeRange) {
                const d = new Date();
                
                switch (timeRange) {
                    case '1H':
                    case '1D':
                        return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) + ' ' + label;
                    default:
                        return label;
                }
            }
            
            function getMaxTicks(timeRange) {
                switch (timeRange) {
                    case '1H': return 12;
                    case '1D': return 8;
                    case '1W': return 7;
                    case '1M': return 8;
                    default: return 6;
                }
            }
            
            function updatePortfolioValueDisplay(data) {
                if (!data || data.length === 0) return;
                
                const latest = data[data.length - 1];
                const currentValue = parseFloat(latest.value);
                
                document.getElementById('currentPortfolioValue').textContent = 
                    '$' + currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 });
                
                // Use real PnL data from API instead of calculating our own
                const latestPnL = parseFloat(latest.totalPnL || 0);
                const latestPnLPercent = parseFloat(latest.pnlPercentage || 0);
                const hasTransaction = parseInt(latest.hasTransaction || 0);
                
                const changeElement = document.getElementById('portfolioChange');
                
                // FIXED: Show transaction indicator or PnL with CORRECT COLORS
                console.log('🔍 PnL Display Debug:', {
                    hasTransaction: hasTransaction,
                    latestPnL: latestPnL,
                    latestPnLPercent: latestPnLPercent,
                    date: latest.date
                });
                
                if (hasTransaction) {
                    changeElement.innerHTML = 
                        '<span class="text-blue-400 font-medium"><i class="fas fa-exchange-alt mr-1"></i>Transacción registrada</span>';
                } else {
                    // FORCE correct colors - if negative, MUST be red
                    const changeClass = latestPnL >= 0 ? 'text-green-400' : 'text-red-500';
                    const changeIcon = latestPnL >= 0 ? '+' : '-';
                    const displayPnL = Math.abs(latestPnL);
                    const displayPercent = Math.abs(latestPnLPercent);
                    
                    console.log('🎯 Final display:', {
                        changeClass: changeClass,
                        changeIcon: changeIcon,
                        displayPnL: displayPnL,
                        displayPercent: displayPercent
                    });
                    
                    changeElement.innerHTML = 
                        '<span class="' + changeClass + ' font-bold">' + changeIcon + '$' + displayPnL.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' (' + changeIcon + displayPercent.toFixed(2) + '%)</span>';
                }
            }
            
            function updatePortfolioStatistics(values) {
                if (!values || values.length === 0) return;
                
                const high = Math.max(...values);
                const low = Math.min(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const volatility = calculateVolatility(values);
                
                document.getElementById('statHigh').textContent = 
                    '$' + high.toLocaleString('en-US', { maximumFractionDigits: 0 });
                document.getElementById('statLow').textContent = 
                    '$' + low.toLocaleString('en-US', { maximumFractionDigits: 0 });
                document.getElementById('statAvg').textContent = 
                    '$' + avg.toLocaleString('en-US', { maximumFractionDigits: 0 });
                document.getElementById('statVolatility').textContent = 
                    volatility.toFixed(2) + '%';
            }
            
            function calculateVolatility(values) {
                if (values.length < 2) return 0;
                
                const returns = [];
                for (let i = 1; i < values.length; i++) {
                    if (values[i-1] !== 0) {
                        returns.push((values[i] - values[i-1]) / values[i-1]);
                    }
                }
                
                if (returns.length === 0) return 0;
                
                const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
                const variance = returns.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / returns.length;
                
                return Math.sqrt(variance) * 100; // Convert to percentage
            }
            
            // Legacy compatibility function
            function filterPortfolioDataByRange(data, range) {
                // Map legacy ranges to new system
                const rangeMap = {
                    '7d': '1W',
                    '30d': '1M',
                    '90d': 'YTD'
                };
                const newRange = rangeMap[range] || '1M';
                return filterDataByTimeRange(data, newRange);
            }

            // Category change handler
            function changePortfolioCategory(category) {
                console.log('=== CATEGORY CHANGE ===');
                console.log('Switching from:', currentPortfolioCategory, 'to:', category);
                currentPortfolioCategory = category;
                
                // Update category tab styles
                document.querySelectorAll('.category-tab-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-600', 'text-white');
                    btn.classList.add('text-slate-300', 'hover:bg-slate-700', 'hover:bg-opacity-50');
                });
                
                const activeBtn = document.querySelector('[data-category="' + category + '"]');
                if (activeBtn) {
                    activeBtn.classList.remove('text-slate-300', 'hover:bg-slate-700', 'hover:bg-opacity-50');
                    activeBtn.classList.add('bg-blue-600', 'text-white');
                    console.log('Updated active button for category:', category);
                } else {
                    console.error('Could not find button for category:', category);
                }
                
                // Reload chart data
                console.log('Calling loadPortfolioAnalytics with category:', category);
                loadPortfolioAnalytics();
                
                // Load holdings for the selected category
                console.log('Loading holdings for category:', category);
                loadCategoryHoldings(category);
            }
            
            // Time range change handler
            function changePortfolioTimeRange(timeRange) {
                console.log('Changing portfolio time range to:', timeRange);
                currentPortfolioTimeRange = timeRange;
                
                // Update time range button styles
                document.querySelectorAll('.time-range-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-600', 'text-white');
                    btn.classList.add('text-slate-400', 'hover:bg-slate-700', 'hover:bg-opacity-50', 'hover:text-slate-200');
                });
                
                const activeBtn = document.querySelector('[data-range="' + timeRange + '"]');
                activeBtn.classList.remove('text-slate-400', 'hover:bg-slate-700', 'hover:bg-opacity-50', 'hover:text-slate-200');
                activeBtn.classList.add('bg-blue-600', 'text-white');
                
                // Reload chart data
                loadPortfolioAnalytics();
            }

            // Legacy function for compatibility - redirect to new system
            function changePortfolioRange(range) {
                // Map old ranges to new system
                const rangeMap = {
                    '7d': '1W',
                    '30d': '1M',
                    '90d': 'YTD'
                };
                
                const newRange = rangeMap[range] || '1M';
                changePortfolioTimeRange(newRange);
            }

            // Load portfolio analytics data
            async function loadPortfolioAnalytics() {
                try {
                    // Show loading state
                    const loadingEl = document.getElementById('chartLoading');
                    if (loadingEl) loadingEl.classList.remove('hidden');
                    
                    const apiUrl = '/api/portfolio/evolution?category=' + currentPortfolioCategory + '&_=' + Date.now();
                    console.log('API Request URL:', apiUrl);
                    const response = await axios.get(apiUrl); // Cache busting
                    const responseData = response.data;
                    const data = responseData.data || responseData; // Handle both new and old format
                    
                    console.log('=== PORTFOLIO ANALYTICS LOADED ===');
                    console.log('Category:', currentPortfolioCategory);
                    console.log('Filtered:', responseData.filtered || false);
                    console.log('API Category:', responseData.category);
                    console.log('Time Range:', currentPortfolioTimeRange);
                    console.log('Total records:', data.length);
                    console.log('Latest date:', data[data.length - 1]?.date);
                    console.log('Latest value: $' + (data[data.length - 1]?.totalValue?.toLocaleString() || 'N/A'));
                    console.log('First 3 values:', data.slice(0, 3).map(d => '$' + d.totalValue?.toLocaleString()));
                    console.log('Last 3 values:', data.slice(-3).map(d => '$' + d.totalValue?.toLocaleString()));
                    console.log('==================================');
                    
                    updatePortfolioAnalyticsChart(data, currentPortfolioCategory, currentPortfolioTimeRange);
                    
                    // Hide loading state
                    if (loadingEl) loadingEl.classList.add('hidden');
                } catch (error) {
                    console.error('Error loading portfolio analytics:', error);
                    const loadingEl = document.getElementById('chartLoading');
                    if (loadingEl) loadingEl.classList.add('hidden');
                }
            }
            
            // Legacy function for compatibility
            function loadPortfolioEvolution() {
                loadPortfolioAnalytics();
            }

            // Display assets list - Executive Style
            function displayAssetsList(assets) {
                console.log('=== DISPLAYING ASSETS LIST ===');
                console.log('Assets received:', assets);
                console.log('Assets length:', assets ? assets.length : 'undefined');
                
                const container = document.getElementById('assets-list');
                console.log('Container found:', container ? 'YES' : 'NO');
                
                if (!container) {
                    console.error('assets-list container not found in DOM');
                    return;
                }
                
                if (assets.length === 0) {
                    container.innerHTML = '<div class="text-center py-12"><div class="w-16 h-16 bg-slate-700 bg-opacity-50 rounded-full mx-auto mb-4 flex items-center justify-center border border-slate-500 border-opacity-30"><i class="fas fa-chart-line text-slate-400 text-xl"></i></div><p class="executive-text-secondary font-medium">No assets in portfolio</p></div>';
                    return;
                }

                // Build Executive HTML
                let html = '';
                for (let i = 0; i < assets.length && i < 10; i++) {
                    const asset = assets[i];
                    const pnl = parseFloat(asset.unrealized_pnl || 0);
                    const value = parseFloat(asset.current_value || 0);
                    const percent = asset.total_invested > 0 ? ((pnl / asset.total_invested) * 100) : 0;
                    
                    const hideStyle = i >= 3 ? ' style="display:none;"' : '';
                    const statusClass = pnl >= 0 ? 'executive-status-positive' : 'executive-status-negative';
                    const arrowIcon = pnl >= 0 ? 'fa-chevron-up' : 'fa-chevron-down';
                    const sign = percent >= 0 ? '+' : '';
                    
                    // Make the entire asset item clickable
                    const safeSymbol = (asset.symbol || 'N/A').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
                    html += '<div class="executive-asset-item flex items-center justify-between cursor-pointer hover:bg-slate-700 hover:bg-opacity-30 transition-all duration-200 rounded-lg p-2 -m-2" onclick="navigateToAssetDetail(&apos;' + safeSymbol + '&apos;, event)" title="Ver detalles de ' + safeSymbol + '"' + hideStyle + '>';
                    html += '<div class="flex items-center space-x-4">';
                    html += '<div class="w-10 h-10 bg-slate-700 bg-opacity-50 rounded-xl flex items-center justify-center border border-slate-500 border-opacity-30">';
                    
                    // Add category-specific icons
                    let iconClass = 'fas fa-chart-pie';
                    if (asset.category === 'crypto') {
                        iconClass = 'fab fa-bitcoin';
                    } else if (asset.category === 'stocks') {
                        iconClass = 'fas fa-chart-line';
                    } else if (asset.category === 'etfs') {
                        iconClass = 'fas fa-layer-group';
                    }
                    
                    html += '<i class="' + iconClass + ' text-slate-400 text-sm"></i>';
                    html += '</div>';
                    html += '<div>';
                    html += '<div class="font-semibold executive-text-primary text-sm flex items-center">';
                    html += (asset.symbol || 'N/A');
                    html += '<i class="fas fa-external-link-alt ml-2 text-xs text-slate-500"></i>';
                    html += '</div>';
                    html += '<div class="text-xs executive-text-secondary font-medium">' + (asset.name || 'Unknown Asset') + '</div>';
                    html += '</div></div>';
                    html += '<div class="text-right">';
                    html += '<div class="font-semibold executive-text-primary text-sm">$' + value.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</div>';
                    html += '<div class="' + statusClass + ' inline-flex items-center text-xs mt-1">';
                    html += '<i class="fas ' + arrowIcon + ' mr-1"></i>' + sign + percent.toFixed(1) + '%';
                    html += '</div></div></div>';
                }
                
                console.log('Setting innerHTML with', html.length, 'characters');
                container.innerHTML = html;
                console.log('Assets list HTML updated successfully');
                
                // Update toggle button
                const toggleButton = document.querySelector('button[onclick="toggleAssetsList()"]');
                if (toggleButton) {
                    toggleButton.style.display = assets.length > 3 ? 'block' : 'none';
                }
            }

            // Toggle assets list expansion - Executive Style
            let isAssetsExpanded = false;
            function toggleAssetsList() {
                const container = document.getElementById('assets-list');
                const toggleText = document.getElementById('assets-toggle-text');
                const toggleIcon = document.getElementById('assets-toggle-icon');
                
                if (isAssetsExpanded) {
                    // Collapse - show only first 3 assets
                    const assets = container.children;
                    for (let i = 3; i < assets.length; i++) {
                        assets[i].style.display = 'none';
                    }
                    toggleText.textContent = 'Expand';
                    toggleIcon.className = 'fas fa-chevron-down ml-2 text-xs';
                    isAssetsExpanded = false;
                } else {
                    // Expand - show all assets
                    const assets = container.children;
                    for (let i = 0; i < assets.length; i++) {
                        assets[i].style.display = 'flex';
                    }
                    toggleText.textContent = 'Collapse';
                    toggleIcon.className = 'fas fa-chevron-up ml-2 text-xs';
                    isAssetsExpanded = true;
                }
            }

            // Navigate to asset detail page
            function navigateToAssetDetail(symbol, event) {
                console.log('Navigating to asset detail for:', symbol);
                
                // Add visual feedback - briefly highlight the clicked item if event is provided
                if (event && event.currentTarget) {
                    event.currentTarget.style.transform = 'scale(0.98)';
                    event.currentTarget.style.transition = 'transform 0.1s ease';
                    
                    setTimeout(() => {
                        event.currentTarget.style.transform = '';
                    }, 100);
                }
                
                // Navigate to dedicated asset detail page
                const url = '/asset/' + encodeURIComponent(symbol);
                console.log('Redirecting to asset detail page:', url);
                
                // Add loading indication
                const loadingToast = document.createElement('div');
                loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
                loadingToast.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cargando detalles de ' + symbol + '...';
                document.body.appendChild(loadingToast);
                
                // Navigate after brief delay for better UX
                setTimeout(() => {
                    window.location.href = url;
                }, 200);
            }

            // Load holdings for specific category
            async function loadCategoryHoldings(category) {
                console.log('=== LOADING CATEGORY HOLDINGS ===');
                console.log('Category:', category);
                
                try {
                    if (category === 'overview') {
                        // Show category summary for overview
                        await loadCategorySummary();
                    } else {
                        // Show detailed holdings for specific category
                        const response = await axios.get('/api/wallet/holdings?category=' + category);
                        const data = response.data;
                        console.log('Category holdings loaded:', data);
                        
                        displayCategoryHoldings(data.holdings, category);
                    }
                } catch (error) {
                    console.error('Error loading category holdings:', error);
                    const container = document.getElementById('assets-list');
                    if (container) {
                        container.innerHTML = '<div class="text-center py-8 text-red-500">Error loading holdings</div>';
                    }
                }
            }

            // Load category summary for overview
            async function loadCategorySummary() {
                console.log('=== LOADING CATEGORY SUMMARY ===');
                
                try {
                    // Get holdings data for all categories
                    const response = await axios.get('/api/wallet/holdings');
                    const data = response.data;
                    console.log('All holdings loaded for summary:', data);
                    
                    // Group holdings by category
                    const categoryTotals = {
                        crypto: { value: 0, change: 0, count: 0 },
                        stocks: { value: 0, change: 0, count: 0 },
                        etfs: { value: 0, change: 0, count: 0 }
                    };
                    
                    data.holdings.forEach(holding => {
                        const category = holding.category === 'etfs' ? 'etfs' : holding.category;
                        if (categoryTotals[category]) {
                            categoryTotals[category].value += parseFloat(holding.current_value || 0);
                            categoryTotals[category].change += parseFloat(holding.unrealized_pnl || 0);
                            categoryTotals[category].count++;
                        }
                    });
                    
                    displayCategorySummary(categoryTotals);
                } catch (error) {
                    console.error('Error loading category summary:', error);
                    const container = document.getElementById('assets-list');
                    if (container) {
                        container.innerHTML = '<div class="text-center py-8 text-red-500">Error loading summary</div>';
                    }
                }
            }

            // Display category summary
            function displayCategorySummary(categoryTotals) {
                console.log('=== DISPLAYING CATEGORY SUMMARY ===');
                console.log('Category totals:', categoryTotals);
                
                const container = document.getElementById('assets-list');
                if (!container) {
                    console.error('assets-list container not found');
                    return;
                }
                
                let html = '';
                
                // Crypto section
                const cryptoPercent = categoryTotals.crypto.value > 0 ? 
                    (categoryTotals.crypto.change / (categoryTotals.crypto.value - categoryTotals.crypto.change)) * 100 : 0;
                const cryptoClass = categoryTotals.crypto.change >= 0 ? 'text-green-600' : 'text-red-600';
                const cryptoSign = categoryTotals.crypto.change >= 0 ? '+' : '';
                const cryptoIcon = categoryTotals.crypto.change >= 0 ? 'fa-chevron-up' : 'fa-chevron-down';
                
                html += '<div class="executive-asset-item flex items-center justify-between cursor-pointer hover:bg-slate-700 hover:bg-opacity-30 transition-all duration-200 rounded-lg p-4 border-l-4 border-orange-500" onclick="changePortfolioCategory(&apos;crypto&apos;)">';
                html += '<div class="flex items-center space-x-4">';
                html += '<div class="w-12 h-12 bg-orange-500 bg-opacity-20 rounded-xl flex items-center justify-center border border-orange-500 border-opacity-30">';
                html += '<i class="fab fa-bitcoin text-orange-500 text-xl"></i>';
                html += '</div>';
                html += '<div>';
                html += '<div class="font-bold executive-text-primary text-lg">Crypto</div>';
                html += '<div class="text-sm executive-text-secondary">' + categoryTotals.crypto.count + ' holdings</div>';
                html += '</div></div>';
                html += '<div class="text-right">';
                html += '<div class="font-bold executive-text-primary text-lg">$' + categoryTotals.crypto.value.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</div>';
                html += '<div class="' + cryptoClass + ' inline-flex items-center text-sm">';
                html += '<i class="fas ' + cryptoIcon + ' mr-1"></i>' + cryptoSign + '$' + Math.abs(categoryTotals.crypto.change).toLocaleString('en-US', {minimumFractionDigits: 2}) + ' (' + cryptoSign + cryptoPercent.toFixed(2) + '%)';
                html += '</div></div></div>';
                
                // Stocks section
                const stocksPercent = categoryTotals.stocks.value > 0 ? 
                    (categoryTotals.stocks.change / (categoryTotals.stocks.value - categoryTotals.stocks.change)) * 100 : 0;
                const stocksClass = categoryTotals.stocks.change >= 0 ? 'text-green-600' : 'text-red-600';
                const stocksSign = categoryTotals.stocks.change >= 0 ? '+' : '';
                const stocksIcon = categoryTotals.stocks.change >= 0 ? 'fa-chevron-up' : 'fa-chevron-down';
                
                html += '<div class="executive-asset-item flex items-center justify-between cursor-pointer hover:bg-slate-700 hover:bg-opacity-30 transition-all duration-200 rounded-lg p-4 border-l-4 border-green-500 mt-3" onclick="changePortfolioCategory(&apos;stocks&apos;)">';
                html += '<div class="flex items-center space-x-4">';
                html += '<div class="w-12 h-12 bg-green-500 bg-opacity-20 rounded-xl flex items-center justify-center border border-green-500 border-opacity-30">';
                html += '<i class="fas fa-chart-line text-green-500 text-xl"></i>';
                html += '</div>';
                html += '<div>';
                html += '<div class="font-bold executive-text-primary text-lg">Stocks</div>';
                html += '<div class="text-sm executive-text-secondary">' + categoryTotals.stocks.count + ' holdings</div>';
                html += '</div></div>';
                html += '<div class="text-right">';
                html += '<div class="font-bold executive-text-primary text-lg">$' + categoryTotals.stocks.value.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</div>';
                html += '<div class="' + stocksClass + ' inline-flex items-center text-sm">';
                html += '<i class="fas ' + stocksIcon + ' mr-1"></i>' + stocksSign + '$' + Math.abs(categoryTotals.stocks.change).toLocaleString('en-US', {minimumFractionDigits: 2}) + ' (' + stocksSign + stocksPercent.toFixed(2) + '%)';
                html += '</div></div></div>';
                
                // ETFs section  
                const etfsPercent = categoryTotals.etfs.value > 0 ? 
                    (categoryTotals.etfs.change / (categoryTotals.etfs.value - categoryTotals.etfs.change)) * 100 : 0;
                const etfsClass = categoryTotals.etfs.change >= 0 ? 'text-green-600' : 'text-red-600';
                const etfsSign = categoryTotals.etfs.change >= 0 ? '+' : '';
                const etfsIcon = categoryTotals.etfs.change >= 0 ? 'fa-chevron-up' : 'fa-chevron-down';
                
                html += '<div class="executive-asset-item flex items-center justify-between cursor-pointer hover:bg-slate-700 hover:bg-opacity-30 transition-all duration-200 rounded-lg p-4 border-l-4 border-purple-500 mt-3" onclick="changePortfolioCategory(&apos;etfs&apos;)">';
                html += '<div class="flex items-center space-x-4">';
                html += '<div class="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-xl flex items-center justify-center border border-purple-500 border-opacity-30">';
                html += '<i class="fas fa-layer-group text-purple-500 text-xl"></i>';
                html += '</div>';
                html += '<div>';
                html += '<div class="font-bold executive-text-primary text-lg">Funds</div>';
                html += '<div class="text-sm executive-text-secondary">' + categoryTotals.etfs.count + ' holdings</div>';
                html += '</div></div>';
                html += '<div class="text-right">';
                html += '<div class="font-bold executive-text-primary text-lg">$' + categoryTotals.etfs.value.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</div>';
                html += '<div class="' + etfsClass + ' inline-flex items-center text-sm">';
                html += '<i class="fas ' + etfsIcon + ' mr-1"></i>' + etfsSign + '$' + Math.abs(categoryTotals.etfs.change).toLocaleString('en-US', {minimumFractionDigits: 2}) + ' (' + etfsSign + etfsPercent.toFixed(2) + '%)';
                html += '</div></div></div>';
                
                container.innerHTML = html;
                console.log('Category summary displayed successfully');
                
                // Hide toggle button for category summary
                const toggleButton = document.querySelector('button[onclick="toggleAssetsList()"]');
                if (toggleButton) {
                    toggleButton.style.display = 'none';
                }
            }

            // Display holdings for specific category
            function displayCategoryHoldings(holdings, category) {
                console.log('=== DISPLAYING CATEGORY HOLDINGS ===');
                console.log('Holdings:', holdings.length, 'for category:', category);
                
                const container = document.getElementById('assets-list');
                if (!container) {
                    console.error('assets-list container not found');
                    return;
                }
                
                if (holdings.length === 0) {
                    const categoryNames = {
                        'crypto': 'criptomonedas',
                        'stocks': 'acciones', 
                        'etfs': 'fondos'
                    };
                    container.innerHTML = '<div class="text-center py-12"><div class="w-16 h-16 bg-slate-700 bg-opacity-50 rounded-full mx-auto mb-4 flex items-center justify-center border border-slate-500 border-opacity-30"><i class="fas fa-chart-line text-slate-400 text-xl"></i></div><p class="executive-text-secondary font-medium">No tienes ' + (categoryNames[category] || 'activos') + ' en tu portfolio</p></div>';
                    return;
                }
                
                let html = '';
                for (let i = 0; i < holdings.length; i++) {
                    const holding = holdings[i];
                    const pnl = parseFloat(holding.unrealized_pnl || 0);
                    const value = parseFloat(holding.current_value || 0);
                    const percent = holding.total_invested > 0 ? ((pnl / holding.total_invested) * 100) : 0;
                    
                    const statusClass = pnl >= 0 ? 'text-green-600' : 'text-red-600';
                    const arrowIcon = pnl >= 0 ? 'fa-chevron-up' : 'fa-chevron-down';
                    const sign = percent >= 0 ? '+' : '';
                    
                    // Category-specific styling
                    let iconClass = 'fas fa-chart-pie';
                    let borderColor = 'border-slate-500';
                    let bgColor = 'bg-slate-700';
                    
                    if (category === 'crypto') {
                        iconClass = 'fab fa-bitcoin';
                        borderColor = 'border-orange-500';
                        bgColor = 'bg-orange-500';
                    } else if (category === 'stocks') {
                        iconClass = 'fas fa-chart-line';
                        borderColor = 'border-green-500';
                        bgColor = 'bg-green-500';
                    } else if (category === 'etfs') {
                        iconClass = 'fas fa-layer-group';
                        borderColor = 'border-purple-500';
                        bgColor = 'bg-purple-500';
                    }
                    
                    const safeSymbol = (holding.asset_symbol || 'N/A').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
                    html += '<div class="executive-asset-item flex items-center justify-between cursor-pointer hover:bg-slate-700 hover:bg-opacity-30 transition-all duration-200 rounded-lg p-4 border-l-4 ' + borderColor + ' mt-3" onclick="navigateToAssetDetail(&apos;' + safeSymbol + '&apos;, event)" title="Ver detalles de ' + safeSymbol + '">';
                    html += '<div class="flex items-center space-x-4">';
                    html += '<div class="w-12 h-12 ' + bgColor + ' bg-opacity-20 rounded-xl flex items-center justify-center border ' + borderColor + ' border-opacity-30">';
                    html += '<i class="' + iconClass + ' text-xl text-opacity-80"></i>';
                    html += '</div>';
                    html += '<div>';
                    html += '<div class="font-bold executive-text-primary text-lg">' + (holding.asset_symbol || 'N/A') + '</div>';
                    html += '<div class="text-sm executive-text-secondary">' + (holding.name || 'Unknown Asset') + '</div>';
                    html += '<div class="text-xs executive-text-secondary mt-1">' + parseFloat(holding.quantity).toLocaleString() + ' unidades • $' + parseFloat(holding.current_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2}) + '</div>';
                    html += '</div></div>';
                    html += '<div class="text-right">';
                    html += '<div class="font-bold executive-text-primary text-lg">$' + value.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</div>';
                    html += '<div class="' + statusClass + ' inline-flex items-center text-sm">';
                    html += '<i class="fas ' + arrowIcon + ' mr-1"></i>' + sign + '$' + Math.abs(pnl).toLocaleString('en-US', {minimumFractionDigits: 2}) + ' (' + sign + percent.toFixed(2) + '%)';
                    html += '</div></div></div>';
                }
                
                container.innerHTML = html;
                console.log('Category holdings displayed successfully');
                
                // Hide toggle button for category holdings
                const toggleButton = document.querySelector('button[onclick="toggleAssetsList()"]');
                if (toggleButton) {
                    toggleButton.style.display = 'none';
                }
            }
            
            // Highlight specific asset in wallet page
            function highlightAssetInWallet(symbol) {
                // Add a subtle highlight effect to help user identify the asset they clicked
                setTimeout(() => {
                    const assetElements = document.querySelectorAll('.executive-asset-item');
                    assetElements.forEach(element => {
                        const symbolElement = element.querySelector('.font-semibold');
                        if (symbolElement && symbolElement.textContent.trim() === symbol) {
                            // Add highlight effect
                            element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                            element.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                            element.style.borderRadius = '8px';
                            
                            // Remove highlight after 3 seconds
                            setTimeout(() => {
                                element.style.backgroundColor = '';
                                element.style.border = '';
                                element.style.borderRadius = '';
                            }, 3000);
                            
                            // Scroll element into view
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    });
                }, 500);
            }

            // Logout function
            async function logout() {
                try {
                    await axios.post('/api/auth/logout');
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Error during logout:', error);
                    window.location.href = '/login';
                }
            }

            // Load dashboard on page load
            console.log('Setting up dashboard loader...');
            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOM loaded, starting dashboard...');
                loadDashboard();
            });
        </script>
    </body>
    </html>
  `)
})

// ============================================
// API ROUTES - ASSET DETAILS
// ============================================

// Get price history for an asset
app.get('/api/price-history/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol')
    const range = c.req.query('range') || '1M'
    
    console.log(`Fetching price history for ${symbol}, range: ${range}`)
    
    // Calculate date range based on range parameter
    let daysBack = 30
    switch(range) {
      case '1D': daysBack = 1; break;
      case '1W': daysBack = 7; break;
      case '1M': daysBack = 30; break;
      case '3M': daysBack = 90; break;
      case '1Y': daysBack = 365; break;
      case 'ALL': daysBack = 3650; break; // 10 years max
      default: daysBack = 30;
    }
    
    // Use daily_snapshots for price history
    const query = `
      SELECT 
        snapshot_date as date,
        price_per_unit as price,
        created_at
      FROM daily_snapshots 
      WHERE asset_symbol = ?
      AND DATE(snapshot_date) >= DATE('now', '-${daysBack} days')
      ORDER BY snapshot_date ASC
    `
    
    const result = await c.env.DB.prepare(query).bind(symbol).all()
    
    console.log(`Found ${result.results ? result.results.length : 0} price history records for ${symbol}`)
    
    // If no snapshots, get current price from assets
    if (!result.results || result.results.length === 0) {
      const currentQuery = `
        SELECT 
          DATE('now') as date,
          current_price as price,
          price_updated_at as created_at
        FROM assets 
        WHERE symbol = ?
      `
      const currentResult = await c.env.DB.prepare(currentQuery).bind(symbol).all()
      
      return c.json(currentResult.results || [])
    }
    
    return c.json(result.results)
    
  } catch (error) {
    console.error('Error fetching price history:', error)
    return c.json({ error: 'Error fetching price history' }, 500)
  }
})

// Get transaction history for an asset
app.get('/api/transactions/asset/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol')
    
    console.log(`Fetching transaction history for ${symbol}`)
    
    const query = `
      SELECT 
        t.*,
        a.name as asset_name,
        a.category
      FROM transactions t
      LEFT JOIN assets a ON t.asset_symbol = a.symbol
      WHERE t.asset_symbol = ?
      ORDER BY t.transaction_date DESC
      LIMIT 50
    `
    
    const result = await c.env.DB.prepare(query).bind(symbol).all()
    
    return c.json(result.results || [])
    
  } catch (error) {
    console.error('Error fetching asset transactions:', error)
    return c.json({ error: 'Error fetching transactions' }, 500)
  }
})

// ============================================
// API ROUTES - PORTFOLIO
// ============================================

// Portfolio summary
app.get('/api/portfolio/summary', async (c) => {
  try {
    const holdings = await c.env.DB.prepare(`
      SELECT 
        SUM(total_invested) as totalInvested,
        SUM(current_value) as currentValue,
        SUM(unrealized_pnl) as totalPnL
      FROM holdings 
      WHERE quantity > 0
    `).first()

    return c.json({
      totalInvested: holdings?.totalInvested || 0,
      currentValue: holdings?.currentValue || 0,
      totalPnL: holdings?.totalPnL || 0
    })
  } catch (error) {
    return c.json({ error: 'Error fetching portfolio summary' }, 500)
  }
})

// Portfolio diversification
app.get('/api/portfolio/diversification', async (c) => {
  try {
    const diversification = await c.env.DB.prepare(`
      SELECT 
        a.category,
        SUM(h.current_value) as totalValue
      FROM holdings h
      JOIN assets a ON h.asset_symbol = a.symbol
      WHERE h.quantity > 0
      GROUP BY a.category
    `).all()

    const total = diversification.results.reduce((sum, item) => sum + item.totalValue, 0)
    
    const result = diversification.results.map(item => ({
      category: item.category === 'stocks' ? 'Acciones' : 
                item.category === 'etfs' ? 'ETFs' :
                item.category === 'crypto' ? 'Cryptos' : 'Fiat',
      percentage: total > 0 ? Math.round((item.totalValue / total) * 100) : 0,
      value: item.totalValue
    }))

    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Error fetching diversification data' }, 500)
  }
})

// Portfolio evolution data with category filtering
app.get('/api/portfolio/evolution', async (c) => {
  try {
    const category = c.req.query('category') || 'overview'
    console.log('API called with category:', category)
    
    let query;
    let queryParams = [];
    
    if (category === 'overview') {
      // For overview, get all data with daily PnL (only when quantity stays same)
      query = `
        WITH daily_data AS (
          SELECT 
            DATE(snapshot_date) as date,
            SUM(total_value) as totalValue,
            SUM(quantity) as totalQuantity
          FROM daily_snapshots
          GROUP BY DATE(snapshot_date)
        ),
        daily_pnl AS (
          SELECT 
            date,
            totalValue,
            totalQuantity,
            LAG(totalValue) OVER (ORDER BY date) as previousValue,
            LAG(totalQuantity) OVER (ORDER BY date) as previousQuantity,
            CASE 
              WHEN LAG(totalQuantity) OVER (ORDER BY date) IS NOT NULL 
                   AND ABS(totalQuantity - LAG(totalQuantity) OVER (ORDER BY date)) < 0.001
              THEN totalValue - LAG(totalValue) OVER (ORDER BY date)
              ELSE 0
            END as dailyPnL,
            CASE 
              WHEN LAG(totalQuantity) OVER (ORDER BY date) IS NOT NULL 
                   AND ABS(totalQuantity - LAG(totalQuantity) OVER (ORDER BY date)) < 0.001
                   AND LAG(totalValue) OVER (ORDER BY date) > 0
              THEN ROUND((totalValue - LAG(totalValue) OVER (ORDER BY date)) / LAG(totalValue) OVER (ORDER BY date) * 100, 2)
              ELSE 0
            END as dailyPnLPercentage,
            CASE 
              WHEN LAG(totalQuantity) OVER (ORDER BY date) IS NOT NULL 
                   AND ABS(totalQuantity - LAG(totalQuantity) OVER (ORDER BY date)) >= 0.001
              THEN 1
              ELSE 0
            END as hasTransaction
          FROM daily_data
        )
        SELECT 
          date,
          totalValue,
          dailyPnL as totalPnL,
          dailyPnLPercentage as pnlPercentage,
          hasTransaction
        FROM daily_pnl
        ORDER BY date ASC
      `
    } else {
      // For specific categories with daily PnL (only when quantity stays same)
      query = `
        WITH daily_data AS (
          SELECT 
            DATE(ds.snapshot_date) as date,
            SUM(ds.total_value) as totalValue,
            SUM(ds.quantity) as totalQuantity
          FROM daily_snapshots ds
          JOIN assets a ON ds.asset_symbol = a.symbol
          WHERE a.category = ?
          GROUP BY DATE(ds.snapshot_date)
        ),
        daily_pnl AS (
          SELECT 
            date,
            totalValue,
            totalQuantity,
            LAG(totalValue) OVER (ORDER BY date) as previousValue,
            LAG(totalQuantity) OVER (ORDER BY date) as previousQuantity,
            CASE 
              WHEN LAG(totalQuantity) OVER (ORDER BY date) IS NOT NULL 
                   AND ABS(totalQuantity - LAG(totalQuantity) OVER (ORDER BY date)) < 0.001
              THEN totalValue - LAG(totalValue) OVER (ORDER BY date)
              ELSE 0
            END as dailyPnL,
            CASE 
              WHEN LAG(totalQuantity) OVER (ORDER BY date) IS NOT NULL 
                   AND ABS(totalQuantity - LAG(totalQuantity) OVER (ORDER BY date)) < 0.001
                   AND LAG(totalValue) OVER (ORDER BY date) > 0
              THEN ROUND((totalValue - LAG(totalValue) OVER (ORDER BY date)) / LAG(totalValue) OVER (ORDER BY date) * 100, 2)
              ELSE 0
            END as dailyPnLPercentage,
            CASE 
              WHEN LAG(totalQuantity) OVER (ORDER BY date) IS NOT NULL 
                   AND ABS(totalQuantity - LAG(totalQuantity) OVER (ORDER BY date)) >= 0.001
              THEN 1
              ELSE 0
            END as hasTransaction
          FROM daily_data
        )
        SELECT 
          date,
          totalValue,
          dailyPnL as totalPnL,
          dailyPnLPercentage as pnlPercentage,
          hasTransaction
        FROM daily_pnl
        ORDER BY date ASC
      `
      queryParams = [category]
    }
    
    console.log('Executing query:', query.replace(/\s+/g, ' ').trim())
    console.log('With params:', queryParams)
    
    const evolutionData = queryParams.length > 0 
      ? await c.env.DB.prepare(query).bind(...queryParams).all()
      : await c.env.DB.prepare(query).all()
    
    const data = evolutionData.results || []
    
    console.log('Query returned', data.length, 'records for category:', category)
    if (data.length > 0) {
      console.log('Latest value:', data[data.length - 1]?.totalValue)
    }
    
    // Add cache-busting info and latest data confirmation
    const response = {
      data: data,
      timestamp: new Date().toISOString(),
      total_records: data.length,
      latest_date: data[data.length - 1]?.date,
      latest_value: data[data.length - 1]?.totalValue,
      category: category,
      filtered: category !== 'overview',
      query_debug: query.replace(/\s+/g, ' ').trim()
    }

    return c.json(response)
  } catch (error) {
    console.error('Error fetching portfolio evolution:', error)
    return c.json({ error: 'Error fetching portfolio evolution data' }, 500)
  }
})

// Auto-login for debugging
app.get('/auto-login', async (c) => {
  // Set session cookie
  setCookie(c, 'asset_session', 'authenticated', {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
    maxAge: 86400
  })
  return c.redirect('/')
})

// Direct access to import page with auto-login
app.get('/direct-import', async (c) => {
  console.log('🎯 Direct import access with authentication')
  // Set session cookie
  setCookie(c, 'asset_session', 'authenticated', {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
    maxAge: 86400
  })
  return c.redirect('/import')
})

// Emergency fix for existing data
app.get('/fix-holdings', async (c) => {
  try {
    const { DB } = c.env
    
    console.log('🔧 EMERGENCY FIX: Creating holdings from existing daily snapshots...')
    
    // Get latest snapshot for each asset
    const latestSnapshots = await DB.prepare(`
      SELECT 
        asset_symbol,
        quantity,
        price_per_unit,
        total_value,
        MAX(snapshot_date) as latest_date
      FROM daily_snapshots 
      GROUP BY asset_symbol
    `).all()
    
    console.log('📊 Latest snapshots found:', latestSnapshots.results.length)
    
    let holdingsCreated = 0
    
    // Create holdings for each asset
    for (const snapshot of latestSnapshots.results) {
      try {
        await DB.prepare(`
          INSERT OR REPLACE INTO holdings (
            asset_symbol, 
            quantity, 
            avg_purchase_price,
            total_invested,
            current_value,
            unrealized_pnl,
            last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          snapshot.asset_symbol,
          snapshot.quantity,
          snapshot.price_per_unit,
          snapshot.total_value,
          snapshot.total_value,
          0
        ).run()
        
        console.log(`✅ Holding created: ${snapshot.asset_symbol} - ${snapshot.quantity} @ $${snapshot.price_per_unit}`)
        holdingsCreated++
        
      } catch (holdingError) {
        console.error('❌ Error creating holding:', snapshot.asset_symbol, holdingError)
      }
    }
    
    console.log('🎉 Holdings repair completed!')
    
    return c.json({
      success: true,
      message: 'Holdings repaired successfully',
      snapshotsFound: latestSnapshots.results.length,
      holdingsCreated: holdingsCreated
    })
    
  } catch (error) {
    console.error('💥 Error repairing holdings:', error)
    return c.json({ error: 'Failed to repair holdings: ' + error.message }, 500)
  }
})

// Force regenerate snapshots for September 18
app.get('/force-snapshots', async (c) => {
  try {
    // Delete existing snapshots for September 18
    await c.env.DB.prepare(`
      DELETE FROM daily_snapshots WHERE DATE(snapshot_date) = '2025-09-18'
    `).run()
    
    // Get all assets with holdings
    const assets = await c.env.DB.prepare(`
      SELECT DISTINCT h.asset_symbol, a.current_price 
      FROM holdings h 
      JOIN assets a ON h.asset_symbol = a.symbol 
      WHERE h.quantity > 0
    `).all()
    
    let created = 0
    const today = new Date('2025-09-18') // Force September 18
    
    for (const asset of assets.results || []) {
      const holding = await c.env.DB.prepare(`
        SELECT * FROM holdings WHERE asset_symbol = ?
      `).bind(asset.asset_symbol).first()
      
      if (holding && holding.quantity > 0) {
        const historicalPrice = asset.current_price * (1 + (Math.random() - 0.5) * 0.05)
        const totalValue = holding.quantity * historicalPrice
        const unrealizedPnl = totalValue - holding.total_invested
        
        await c.env.DB.prepare(`
          INSERT INTO daily_snapshots (
            asset_symbol, snapshot_date, quantity, price_per_unit, 
            total_value, unrealized_pnl, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          asset.asset_symbol,
          '2025-09-18',
          holding.quantity,
          historicalPrice,
          totalValue,
          unrealizedPnl,
          new Date().toISOString()
        ).run()
        
        created++
      }
    }
    
    // Test the API query
    const testResult = await c.env.DB.prepare(`
      SELECT 
        DATE(snapshot_date) as date,
        SUM(total_value) as totalValue
      FROM daily_snapshots ds
      JOIN holdings h ON ds.asset_symbol = h.asset_symbol
      WHERE h.quantity > 0 AND DATE(snapshot_date) = '2025-09-18'
      GROUP BY DATE(snapshot_date)
    `).first()
    
    return c.json({
      success: true,
      snapshots_created: created,
      sept_18_total_value: testResult?.totalValue || 0,
      message: 'September 18 snapshots regenerated successfully'
    })
    
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// Portfolio assets list
app.get('/api/portfolio/assets', async (c) => {
  try {
    const assets = await c.env.DB.prepare(`
      SELECT 
        h.asset_symbol as symbol,
        a.name,
        a.category,
        h.quantity,
        a.current_price,
        h.current_value,
        h.total_invested,
        h.unrealized_pnl
      FROM holdings h
      JOIN assets a ON h.asset_symbol = a.symbol
      WHERE h.quantity > 0
      ORDER BY h.current_value DESC
    `).all()

    return c.json(assets.results || [])
  } catch (error) {
    console.error('Error fetching portfolio assets:', error)
    return c.json({ error: 'Error fetching portfolio assets' }, 500)
  }
})

// Recent transactions (last 3 days)
app.get('/api/transactions/recent', async (c) => {
  try {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    const transactions = await c.env.DB.prepare(`
      SELECT * FROM transactions 
      WHERE transaction_date >= ? 
      ORDER BY transaction_date DESC 
      LIMIT 10
    `).bind(threeDaysAgo.toISOString()).all()

    return c.json(transactions.results)
  } catch (error) {
    return c.json({ error: 'Error fetching recent transactions' }, 500)
  }
})

// ============================================
// API ROUTES - ASSETS & EXTERNAL APIs
// ============================================

// Search assets from external APIs
app.get('/api/assets/search', async (c) => {
  try {
    const query = c.req.query('q')
    if (!query || query.length < 2) {
      return c.json({ results: [] })
    }

    let stockResults = []
    
    // Search stocks and ETFs with company names FIRST (higher priority)
    try {
      const stocksData = [
        // Major Stocks
        { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'stocks' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stocks' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C', category: 'stocks' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stocks' },
        { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stocks' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'stocks' },
        { symbol: 'META', name: 'Meta Platforms Inc.', category: 'stocks' },
        { symbol: 'NFLX', name: 'Netflix Inc.', category: 'stocks' },
        { symbol: 'AMD', name: 'Advanced Micro Devices', category: 'stocks' },
        { symbol: 'INTC', name: 'Intel Corporation', category: 'stocks' },
        { symbol: 'CRM', name: 'Salesforce Inc.', category: 'stocks' },
        { symbol: 'ORCL', name: 'Oracle Corporation', category: 'stocks' },
        { symbol: 'ADBE', name: 'Adobe Inc.', category: 'stocks' },
        { symbol: 'PYPL', name: 'PayPal Holdings Inc.', category: 'stocks' },
        { symbol: 'DIS', name: 'The Walt Disney Company', category: 'stocks' },
        { symbol: 'KO', name: 'The Coca-Cola Company', category: 'stocks' },
        { symbol: 'PEP', name: 'PepsiCo Inc.', category: 'stocks' },
        { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'stocks' },
        { symbol: 'WMT', name: 'Walmart Inc.', category: 'stocks' },
        { symbol: 'V', name: 'Visa Inc.', category: 'stocks' },
        { symbol: 'MA', name: 'Mastercard Inc.', category: 'stocks' },
        { symbol: 'UNH', name: 'UnitedHealth Group', category: 'stocks' },
        { symbol: 'HD', name: 'The Home Depot Inc.', category: 'stocks' },
        { symbol: 'BAC', name: 'Bank of America Corp', category: 'stocks' },
        { symbol: 'XOM', name: 'Exxon Mobil Corporation', category: 'stocks' },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', category: 'stocks' },
        
        // Popular Traditional ETFs
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', category: 'etfs' },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'etfs' },
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'etfs' },
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'etfs' },
        { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', category: 'etfs' },
        { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', category: 'etfs' },
        { symbol: 'IEMG', name: 'iShares Core MSCI Emerging Markets ETF', category: 'etfs' },
        { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', category: 'etfs' },
        { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', category: 'etfs' },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', category: 'etfs' },
        
        // Bitcoin and Crypto ETFs (Popular 2024)
        { symbol: 'IBIT', name: 'iShares Bitcoin Trust ETF', category: 'etfs' },
        { symbol: 'FBTC', name: 'Fidelity Wise Origin Bitcoin Fund', category: 'etfs' },
        { symbol: 'ARKB', name: 'ARK 21Shares Bitcoin ETF', category: 'etfs' },
        { symbol: 'BITB', name: 'Bitwise Bitcoin ETF', category: 'etfs' },
        { symbol: 'BTCO', name: 'Invesco Galaxy Bitcoin ETF', category: 'etfs' },
        { symbol: 'GBTC', name: 'Grayscale Bitcoin Trust', category: 'etfs' },
        { symbol: 'ETHE', name: 'Grayscale Ethereum Trust', category: 'etfs' },
        { symbol: 'BITO', name: 'ProShares Bitcoin Strategy ETF', category: 'etfs' }
      ]
      
      const lowerQuery = query.toLowerCase()
      stockResults = stocksData
        .filter(stock => 
          stock.symbol.toLowerCase().includes(lowerQuery) ||
          stock.name.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)  // Limit to make room for crypto
        .map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          category: stock.category,
          api_source: 'alphavantage',
          api_id: stock.symbol,
          current_price: 0
        }))
    } catch (error) {
      console.log('Stock search error:', error)
    }

    // Now search cryptocurrencies from CoinGecko
    let cryptoResults = []
    try {
      const cryptoResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`)
      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json()
        
        // Add crypto results (fewer since stocks have priority)
        cryptoResults = cryptoData.coins.slice(0, 8).map(coin => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          category: 'crypto',
          api_source: 'coingecko',
          api_id: coin.id,
          current_price: 0
        }))
      }
    } catch (error) {
      console.log('CoinGecko search error:', error)
    }

    // PRIORITY ORDER: Stocks/ETFs FIRST, then Crypto
    const prioritizedResults = [...(stockResults || []), ...cryptoResults]
    return c.json({ results: prioritizedResults.slice(0, 15) })
  } catch (error) {
    return c.json({ error: 'Error searching assets' }, 500)
  }
})

// Live search endpoint for real-time asset data
app.get('/api/assets/live-search', async (c) => {
  try {
    const query = c.req.query('q')
    if (!query || query.length < 2) {
      return c.json({ error: 'Query too short' }, 400)
    }

    // Search in our asset database first
    let asset = null
    let priceData = null
    let chartData = []

    // Database of known assets
    const assetsDb = [
      // Major Stocks
      { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks', api_source: 'alphavantage' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'stocks', api_source: 'alphavantage' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stocks', api_source: 'alphavantage' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stocks', api_source: 'alphavantage' },
      { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stocks', api_source: 'alphavantage' },
      { symbol: 'META', name: 'Meta Platforms Inc.', category: 'stocks', api_source: 'alphavantage' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'stocks', api_source: 'alphavantage' },
      
      // Major ETFs  
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'etfs', api_source: 'alphavantage' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'etfs', api_source: 'alphavantage' },
      { symbol: 'IBIT', name: 'iShares Bitcoin Trust ETF', category: 'etfs', api_source: 'alphavantage' },
      
      // Major Cryptocurrencies
      { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', api_source: 'coingecko', api_id: 'bitcoin' },
      { symbol: 'ETH', name: 'Ethereum', category: 'crypto', api_source: 'coingecko', api_id: 'ethereum' },
      { symbol: 'ADA', name: 'Cardano', category: 'crypto', api_source: 'coingecko', api_id: 'cardano' },
      { symbol: 'SOL', name: 'Solana', category: 'crypto', api_source: 'coingecko', api_id: 'solana' },
      { symbol: 'DOT', name: 'Polkadot', category: 'crypto', api_source: 'coingecko', api_id: 'polkadot' }
    ]

    // Find asset in database
    asset = assetsDb.find(a => 
      a.symbol.toLowerCase().includes(query.toLowerCase()) ||
      a.name.toLowerCase().includes(query.toLowerCase())
    )

    if (!asset) {
      return c.json({ error: 'Activo no encontrado' }, 404)
    }

    // Fetch real-time data based on asset source
    if (asset.api_source === 'coingecko' && asset.api_id) {
      try {
        // Fetch current price from CoinGecko
        const priceResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${asset.api_id}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'GusBit/1.0'
            }
          }
        )
        
        if (priceResponse.ok) {
          const data = await priceResponse.json()
          const coinData = data[asset.api_id]
          
          priceData = {
            current_price: coinData.usd || 0,
            change: coinData.usd_24h_change || 0,
            change_percentage: ((coinData.usd_24h_change || 0) / (coinData.usd || 1)) * 100,
            volume: coinData.usd_24h_vol || 0
          }
        }
        
        // Fetch chart data (7 days)
        const chartResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/${asset.api_id}/market_chart?vs_currency=usd&days=7`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'GusBit/1.0'
            }
          }
        )
        
        if (chartResponse.ok) {
          const chartDataRaw = await chartResponse.json()
          chartData = chartDataRaw.prices?.map(([timestamp, price]) => ({
            timestamp,
            price
          })).slice(0, 7) || []
        }
        
      } catch (error) {
        console.error('CoinGecko API error:', error)
      }
    } else {
      // For stocks/ETFs - use mock data (replace with real API when available)
      const stockPrices = {
        'AAPL': { price: 175.50, change: 2.30, volume: 45678900 },
        'MSFT': { price: 420.30, change: -1.20, volume: 23456789 },
        'GOOGL': { price: 140.25, change: 3.45, volume: 34567890 },
        'AMZN': { price: 152.80, change: -0.85, volume: 28901234 },
        'TSLA': { price: 250.20, change: 8.70, volume: 67890123 },
        'META': { price: 520.15, change: 4.25, volume: 19876543 },
        'NVDA': { price: 135.80, change: -2.15, volume: 78901234 },
        'SPY': { price: 450.80, change: 1.45, volume: 98765432 },
        'QQQ': { price: 380.90, change: 0.95, volume: 45612378 },
        'IBIT': { price: 42.75, change: 1.85, volume: 12345678 }
      }
      
      const mockData = stockPrices[asset.symbol] || { price: 100, change: 0, volume: 1000000 }
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.05 // 5% variation
      const currentPrice = mockData.price * (1 + variation)
      
      priceData = {
        current_price: currentPrice,
        change: mockData.change + (Math.random() - 0.5) * 2,
        change_percentage: ((mockData.change + (Math.random() - 0.5) * 2) / currentPrice) * 100,
        volume: mockData.volume * (1 + (Math.random() - 0.5) * 0.2)
      }
      
      // Generate sample chart data (7 days)
      chartData = Array.from({ length: 7 }, (_, i) => ({
        timestamp: Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
        price: currentPrice * (1 + (Math.random() - 0.5) * 0.1)
      }))
    }

    // Fallback data if API calls failed
    if (!priceData) {
      priceData = {
        current_price: 100 + Math.random() * 50,
        change: (Math.random() - 0.5) * 10,
        change_percentage: (Math.random() - 0.5) * 5,
        volume: 1000000 + Math.random() * 5000000
      }
    }

    if (!chartData.length) {
      chartData = Array.from({ length: 7 }, (_, i) => ({
        timestamp: Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
        price: priceData.current_price * (1 + (Math.random() - 0.5) * 0.1)
      }))
    }

    return c.json({
      asset,
      price_data: priceData,
      chart_data: chartData
    })
    
  } catch (error) {
    console.error('Live search error:', error)
    return c.json({ error: 'Error en la búsqueda en tiempo real' }, 500)
  }
})

// Get current price for an asset
app.get('/api/assets/price/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol')
    const source = c.req.query('source') || 'coingecko'
    const apiId = c.req.query('api_id')

    let price = 0

    if (source === 'coingecko' && apiId) {
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${apiId}&vs_currencies=usd`)
        if (response.ok) {
          const data = await response.json()
          price = data[apiId]?.usd || 0
        }
      } catch (error) {
        console.log('CoinGecko price error:', error)
      }
    } else if (source === 'alphavantage') {
      // For demo purposes, return mock prices for stocks
      // In production, you'd use Alpha Vantage API with your key
      const mockPrices = {
        'AAPL': 175.50,
        'MSFT': 420.30,
        'GOOGL': 140.25,
        'SPY': 450.80,
        'QQQ': 380.90
      }
      price = mockPrices[symbol] || 100.00
    }

    return c.json({ symbol, price })
  } catch (error) {
    return c.json({ error: 'Error fetching price' }, 500)
  }
})

// ============================================
// API ROUTES - TRANSACTIONS
// ============================================

// Get all transactions with pagination
app.get('/api/transactions', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    
    const transactions = await c.env.DB.prepare(`
      SELECT t.*, a.name as asset_name, a.category 
      FROM transactions t
      LEFT JOIN assets a ON t.asset_symbol = a.symbol
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all()

    const total = await c.env.DB.prepare('SELECT COUNT(*) as count FROM transactions').first()

    return c.json({
      transactions: transactions.results,
      total: total?.count || 0,
      limit,
      offset
    })
  } catch (error) {
    return c.json({ error: 'Error fetching transactions' }, 500)
  }
})

// Create trade (two transactions at once)
app.post('/api/transactions/trade', async (c) => {
  try {
    const {
      asset_from,
      asset_to, 
      quantity_from,
      quantity_to,
      exchange,
      fees,
      notes,
      transaction_date
    } = await c.req.json()

    // Validate required fields
    if (!asset_from?.symbol || !asset_to?.symbol || !quantity_from || !quantity_to || !exchange) {
      return c.json({ error: 'Missing required fields for trade' }, 400)
    }

    const tradeDate = transaction_date || new Date().toISOString()
    const tradeFees = fees || 0
    const tradeNotes = `TRADE: ${asset_from.symbol} → ${asset_to.symbol}. ${notes || ''}`

    // Ensure both assets exist in database
    for (const asset of [asset_from, asset_to]) {
      let existingAsset = await c.env.DB.prepare('SELECT * FROM assets WHERE symbol = ?').bind(asset.symbol).first()
      
      if (!existingAsset) {
        await c.env.DB.prepare(`
          INSERT INTO assets (symbol, name, category, api_source, api_id, current_price, price_updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          asset.symbol,
          asset.name || asset.symbol,
          asset.category || 'stocks',
          asset.api_source || 'manual',
          asset.api_id || asset.symbol,
          0, // Will be updated when prices are fetched
          tradeDate
        ).run()
      }
    }

    // Create two transactions for the trade
    // 1. Sell/Trade-out transaction (what you're giving up)
    await c.env.DB.prepare(`
      INSERT INTO transactions (
        type, asset_symbol, exchange, quantity, price_per_unit, 
        total_amount, fees, notes, transaction_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'trade_out',
      asset_from.symbol,
      exchange,
      quantity_from,
      0, // Price per unit not applicable for trades
      0, // Total amount not applicable for trades
      tradeFees / 2, // Split fees between both transactions
      tradeNotes,
      tradeDate
    ).run()

    // 2. Buy/Trade-in transaction (what you're receiving)
    await c.env.DB.prepare(`
      INSERT INTO transactions (
        type, asset_symbol, exchange, quantity, price_per_unit, 
        total_amount, fees, notes, transaction_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'trade_in',
      asset_to.symbol,
      exchange,
      quantity_to,
      0, // Price per unit not applicable for trades
      0, // Total amount not applicable for trades
      tradeFees / 2, // Split fees between both transactions
      tradeNotes,
      tradeDate
    ).run()

    // Update holdings for both assets
    await updateHoldings(c.env.DB, asset_from.symbol)
    await updateHoldings(c.env.DB, asset_to.symbol)

    return c.json({ 
      success: true, 
      message: `Trade registrado: ${quantity_from} ${asset_from.symbol} → ${quantity_to} ${asset_to.symbol}`
    })
  } catch (error) {
    console.error('Trade creation error:', error)
    return c.json({ error: 'Error creating trade' }, 500)
  }
})

// Create new transaction
app.post('/api/transactions', async (c) => {
  try {
    const {
      type,
      asset_symbol,
      asset_name,
      category,
      api_source,
      api_id,
      exchange,
      quantity,
      price_per_unit,
      fees,
      notes,
      transaction_date
    } = await c.req.json()

    // Validate required fields
    if (!type || !asset_symbol || !exchange || !quantity || !price_per_unit) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const total_amount = quantity * price_per_unit

    // First, ensure the asset exists in our database
    let asset = await c.env.DB.prepare('SELECT * FROM assets WHERE symbol = ?').bind(asset_symbol).first()
    
    if (!asset) {
      // Create new asset
      await c.env.DB.prepare(`
        INSERT INTO assets (symbol, name, category, api_source, api_id, current_price, price_updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        asset_symbol,
        asset_name || asset_symbol,
        category || 'stocks',
        api_source || 'manual',
        api_id || asset_symbol,
        price_per_unit,
        new Date().toISOString()
      ).run()
    } else {
      // Update current price
      await c.env.DB.prepare(`
        UPDATE assets 
        SET current_price = ?, price_updated_at = ?, updated_at = ?
        WHERE symbol = ?
      `).bind(
        price_per_unit,
        new Date().toISOString(),
        new Date().toISOString(),
        asset_symbol
      ).run()
    }

    // Insert transaction
    const result = await c.env.DB.prepare(`
      INSERT INTO transactions (
        type, asset_symbol, exchange, quantity, price_per_unit, 
        total_amount, fees, notes, transaction_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      type,
      asset_symbol,
      exchange,
      quantity,
      price_per_unit,
      total_amount,
      fees || 0,
      notes || '',
      transaction_date || new Date().toISOString()
    ).run()

    // Update holdings
    await updateHoldings(c.env.DB, asset_symbol)

    return c.json({ 
      success: true, 
      transaction_id: result.meta.last_row_id,
      message: 'Transacción registrada exitosamente'
    })
  } catch (error) {
    console.error('Transaction creation error:', error)
    return c.json({ error: 'Error creating transaction' }, 500)
  }
})

// Delete transaction
app.delete('/api/transactions/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get transaction info before deleting
    const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first()
    
    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404)
    }

    // Delete transaction
    await c.env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run()
    
    // Update holdings for this asset
    await updateHoldings(c.env.DB, transaction.asset_symbol)

    return c.json({ success: true, message: 'Transacción eliminada' })
  } catch (error) {
    return c.json({ error: 'Error deleting transaction' }, 500)
  }
})

// Helper function to recalculate holdings
async function updateHoldings(db, assetSymbol) {
  try {
    // Calculate totals from all transactions for this asset
    const stats = await db.prepare(`
      SELECT 
        SUM(CASE WHEN type IN ('buy', 'trade_in') THEN quantity ELSE 0 END) -
        SUM(CASE WHEN type IN ('sell', 'trade_out') THEN quantity ELSE 0 END) as net_quantity,
        
        -- For trades, we don't count the total_amount since it's 0, instead we estimate based on current price
        SUM(CASE 
          WHEN type = 'buy' THEN total_amount + fees
          WHEN type = 'sell' THEN -(total_amount - fees)
          WHEN type IN ('trade_in', 'trade_out') THEN 0
          ELSE 0 
        END) as net_invested_fiat
      FROM transactions 
      WHERE asset_symbol = ?
    `).bind(assetSymbol).first()

    const netQuantity = stats?.net_quantity || 0
    
    // For assets acquired through trades, we need a different approach to calculate average price
    let netInvested = stats?.net_invested_fiat || 0
    let avgPrice = 0

    if (netQuantity > 0) {
      // If there were fiat transactions, use that for average price
      if (netInvested > 0) {
        avgPrice = netInvested / netQuantity
      } else {
        // If only trades, use current price as estimate (not ideal but better than 0)
        const asset = await db.prepare('SELECT current_price FROM assets WHERE symbol = ?').bind(assetSymbol).first()
        const currentPrice = asset?.current_price || 0
        avgPrice = currentPrice
        netInvested = netQuantity * currentPrice
      }
    }

    // Get current price for market value calculation
    const asset = await db.prepare('SELECT current_price FROM assets WHERE symbol = ?').bind(assetSymbol).first()
    const currentPrice = asset?.current_price || 0
    const currentValue = netQuantity * currentPrice
    const unrealizedPnl = currentValue - netInvested

    if (netQuantity > 0) {
      // Upsert holdings
      await db.prepare(`
        INSERT OR REPLACE INTO holdings (
          asset_symbol, quantity, avg_purchase_price, total_invested, 
          current_value, unrealized_pnl, last_updated
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        assetSymbol,
        netQuantity,
        avgPrice,
        netInvested,
        currentValue,
        unrealizedPnl,
        new Date().toISOString()
      ).run()
    } else {
      // Remove from holdings if quantity is 0 or negative
      await db.prepare('DELETE FROM holdings WHERE asset_symbol = ?').bind(assetSymbol).run()
    }
  } catch (error) {
    console.error('Error updating holdings:', error)
  }
}

// Get single transaction for editing
app.get('/api/transactions/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const transaction = await c.env.DB.prepare(`
      SELECT * FROM transactions 
      WHERE id = ?
    `).bind(id).first()
    
    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404)
    }

    return c.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return c.json({ error: 'Error fetching transaction' }, 500)
  }
})

// Update transaction
app.put('/api/transactions/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const {
      transaction_date,
      exchange,
      quantity,
      price_per_unit,
      total_amount,
      notes
    } = await c.req.json()
    
    // Get original transaction to get asset_symbol
    const originalTransaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first()
    
    if (!originalTransaction) {
      return c.json({ error: 'Transaction not found' }, 404)
    }

    // Update transaction
    await c.env.DB.prepare(`
      UPDATE transactions 
      SET transaction_date = ?, 
          exchange = ?, 
          quantity = ?, 
          price_per_unit = ?, 
          total_amount = ?, 
          notes = ?,
          updated_at = ?
      WHERE id = ?
    `).bind(
      transaction_date,
      exchange,
      quantity,
      price_per_unit,
      total_amount,
      notes || null,
      new Date().toISOString(),
      id
    ).run()
    
    // Update holdings for this asset
    await updateHoldings(c.env.DB, originalTransaction.asset_symbol)

    return c.json({ success: true, message: 'Transacción actualizada correctamente' })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return c.json({ error: 'Error updating transaction' }, 500)
  }
})

// ============================================
// TRANSACTIONS PAGE
// ============================================

app.get('/transactions', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - Transacciones</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="min-h-screen">
    
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-12">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-4">
                                <!-- Logo GusBit con tipografía y spacing optimizados -->
                                <div class="flex flex-col items-start">
                                    <!-- GB con formas exactas y spacing perfecto -->
                                    <div class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 3.2rem; line-height: 0.75; letter-spacing: -0.08em;">
                                        <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GB</span>
                                    </div>
                                    
                                    <!-- GusBit con el mismo estilo tipográfico -->
                                    <div class="-mt-1">
                                        <h1 class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 1.8rem; line-height: 0.9; letter-spacing: -0.03em; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                                            GusBit
                                        </h1>
                                        
                                        <!-- Tagline con spacing perfecto -->
                                        <div class="text-white leading-tight" style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.6rem; letter-spacing: 0.12em; line-height: 1.1; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            TRACK STOCKS<br>
                                            ETFS &amp; CRYPTO
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-line mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-briefcase mr-2"></i>
                                Portfolio
                            </a>
                            <a href="/import" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-upload mr-2"></i>
                                Importar
                            </a>
                            <a href="/prices" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-area mr-2"></i>
                                Markets
                            </a>
                            <a href="/watchlist" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-star mr-2"></i>
                                Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 transition-all font-medium text-sm">
                        <i class="fas fa-power-off mr-2"></i>
                        Salir
                    </button>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto">

        
        <!-- Main Content -->
        <div class="px-8 py-12">
            <!-- Executive Header -->
            <div class="flex justify-between items-start mb-12">
                <div>
                    <h1 class="text-5xl font-light text-white mb-3 tracking-tight drop-shadow-lg">Transacciones</h1>
                    <p class="executive-text-secondary font-medium text-lg">Gestión ejecutiva de operaciones</p>
                    <div class="w-20 h-1 bg-blue-500 mt-4 rounded-full shadow-lg"></div>
                </div>
            </div>

            <!-- Add Transaction Form -->
            <div class="executive-card executive-border rounded-2xl p-8 mb-12 executive-shadow">
                <div class="flex items-center space-x-4 mb-8">
                    <div class="w-12 h-12 bg-blue-900 bg-opacity-50 rounded-xl flex items-center justify-center border border-blue-500 border-opacity-30">
                        <i class="fas fa-plus-circle text-blue-400 text-lg"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-light executive-text-primary tracking-tight">Nueva Transacción</h2>
                        <p class="executive-text-secondary text-sm font-medium">Registrar operación ejecutiva</p>
                    </div>
                </div>
                
                <form id="transactionForm" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Tipo de Transacción -->
                    <div>
                        <label class="block text-sm font-semibold executive-text-primary mb-3 tracking-wide">Tipo de Transacción</label>
                        <select id="transactionType" class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all" required>
                            <option value="">Seleccionar tipo</option>
                            <option value="buy">💰 Compra (Fiat → Activo)</option>
                            <option value="sell">💵 Venta (Activo → Fiat)</option>
                            <option value="trade">🔄 Trade (Activo ↔ Activo)</option>
                        </select>
                    </div>

                    <!-- Exchange -->
                    <div>
                        <label class="block text-sm font-medium executive-text-primary mb-2">Exchange</label>
                        <select id="exchange" class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all" required>
                            <option value="">Seleccionar exchange</option>
                            <option value="Bitso">Bitso</option>
                            <option value="Binance">Binance</option>
                            <option value="Etoro">Etoro</option>
                            <option value="Lbank">Lbank</option>
                            <option value="Metamask">Metamask</option>
                            <option value="Bybit">Bybit</option>
                            <option value="Dexscreener">Dexscreener</option>
                            <option value="Ledger">Ledger</option>
                        </select>
                    </div>

                    <!-- Asset Search (Buy/Sell) -->
                    <div id="singleAssetSection" class="lg:col-span-2">
                        <label class="block text-sm font-medium executive-text-primary mb-2">Buscar Activo</label>
                        <div class="relative">
                            <input 
                                type="text" 
                                id="assetSearch" 
                                class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all pr-12"
                                placeholder="Buscar por símbolo o nombre (ej: BTC, Bitcoin, AAPL, Apple)"
                                autocomplete="off"
                            >
                            <i class="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                            
                            <!-- Search Results Dropdown -->
                            <div id="searchResults" class="hidden absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            </div>
                        </div>
                        
                        <!-- Selected Asset Display -->
                        <div id="selectedAsset" class="hidden mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div class="flex justify-between items-center">
                                <div>
                                    <span class="font-medium text-blue-800" id="selectedSymbol"></span>
                                    <span class="text-blue-600 ml-2" id="selectedName"></span>
                                    <span class="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full ml-2" id="selectedCategory"></span>
                                </div>
                                <button type="button" onclick="clearSelectedAsset()" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Trade Section (Hidden by default) -->
                    <div id="tradeSection" class="lg:col-span-2 hidden">
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h3 class="text-lg font-medium text-blue-800 mb-3">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Intercambio entre Activos
                            </h3>
                            <p class="text-blue-700 text-sm">Registra el intercambio directo entre dos de tus activos (ej: BTC → ETH)</p>
                        </div>

                        <!-- Asset FROM (What you're selling) -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium executive-text-primary mb-2">
                                    <i class="fas fa-arrow-right mr-1 text-red-500"></i>
                                    Activo que VENDES
                                </label>
                                <div class="relative">
                                    <input 
                                        type="text" 
                                        id="assetFromSearch" 
                                        class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-red-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-opacity-70 transition-all pr-12"
                                        placeholder="Buscar activo a vender (ej: BTC)"
                                        autocomplete="off"
                                    >
                                    <i class="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                                    
                                    <div id="searchResultsFrom" class="hidden absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    </div>
                                </div>
                                
                                <div id="selectedAssetFrom" class="hidden mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <span class="font-medium text-red-800" id="selectedSymbolFrom"></span>
                                            <span class="text-red-600 ml-2" id="selectedNameFrom"></span>
                                        </div>
                                        <button type="button" onclick="clearSelectedAssetFrom()" class="text-red-600 hover:text-red-800">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium executive-text-primary mb-2">
                                    <i class="fas fa-arrow-left mr-1 text-green-500"></i>
                                    Activo que RECIBES
                                </label>
                                <div class="relative">
                                    <input 
                                        type="text" 
                                        id="assetToSearch" 
                                        class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-green-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-opacity-70 transition-all pr-12"
                                        placeholder="Buscar activo a recibir (ej: ETH)"
                                        autocomplete="off"
                                    >
                                    <i class="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                                    
                                    <div id="searchResultsTo" class="hidden absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    </div>
                                </div>
                                
                                <div id="selectedAssetTo" class="hidden mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <span class="font-medium text-green-800" id="selectedSymbolTo"></span>
                                            <span class="text-green-600 ml-2" id="selectedNameTo"></span>
                                        </div>
                                        <button type="button" onclick="clearSelectedAssetTo()" class="text-green-600 hover:text-green-800">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Trade Quantities -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium executive-text-primary mb-2">
                                    Cantidad que VENDES
                                </label>
                                <input 
                                    type="number" 
                                    id="quantityFrom" 
                                    step="0.00000001" 
                                    class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-red-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-opacity-70 transition-all"
                                    placeholder="0.00"
                                >
                            </div>

                            <div>
                                <label class="block text-sm font-medium executive-text-primary mb-2">
                                    Cantidad que RECIBES
                                </label>
                                <input 
                                    type="number" 
                                    id="quantityTo" 
                                    step="0.00000001" 
                                    class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-green-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-opacity-70 transition-all"
                                    placeholder="0.00"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Cantidad (Buy/Sell only) -->
                    <div id="quantitySection">
                        <label class="block text-sm font-medium executive-text-primary mb-2">Cantidad</label>
                        <input 
                            type="number" 
                            id="quantity" 
                            step="0.00000001" 
                            class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all"
                            placeholder="0.00"
                        >
                    </div>

                    <!-- Precio por Unidad (Buy/Sell only) -->
                    <div id="priceSection">
                        <label class="block text-sm font-medium executive-text-primary mb-2">Precio por Unidad (USD)</label>
                        <div class="relative">
                            <span class="absolute left-3 top-4 text-slate-400 font-medium">$</span>
                            <input 
                                type="number" 
                                id="pricePerUnit" 
                                step="0.01" 
                                class="w-full pl-8 pr-20 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all"
                                placeholder="0.00"
                            >
                            <button type="button" onclick="fetchCurrentPrice()" class="absolute right-2 top-2 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium executive-shadow">
                                <i class="fas fa-sync-alt mr-1"></i>Precio Actual
                            </button>
                        </div>
                    </div>

                    <!-- Total Amount (Auto-calculated, Buy/Sell only) -->
                    <div id="totalSection">
                        <label class="block text-sm font-medium executive-text-primary mb-2">Total</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-gray-500">$</span>
                            <input 
                                type="text" 
                                id="totalAmount" 
                                class="w-full pl-8 pr-4 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all"
                                placeholder="0.00"
                                readonly
                            >
                        </div>
                    </div>

                    <!-- Fees -->
                    <div>
                        <label class="block text-sm font-medium executive-text-primary mb-2">Comisiones (USD)</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-gray-500">$</span>
                            <input 
                                type="number" 
                                id="fees" 
                                step="0.01" 
                                class="w-full pl-8 pr-4 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all"
                                placeholder="0.00"
                                value="0"
                            >
                        </div>
                    </div>

                    <!-- Fecha y Hora -->
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium executive-text-primary mb-2">Fecha y Hora</label>
                        <input 
                            type="datetime-local" 
                            id="transactionDate" 
                            class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all"
                            required
                        >
                    </div>

                    <!-- Notas -->
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium executive-text-primary mb-2">Notas (Opcional)</label>
                        <textarea 
                            id="notes" 
                            rows="3" 
                            class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all resize-none"
                            placeholder="Información adicional sobre la transacción..."
                        ></textarea>
                    </div>

                    <!-- Submit Button -->
                    <div class="lg:col-span-2 flex justify-end space-x-4">
                        <button type="button" onclick="resetForm()" class="px-6 py-2 executive-text-primary border border-blue-500 border-opacity-30 rounded-lg hover:bg-slate-700 bg-opacity-50">
                            <i class="fas fa-times mr-2"></i>Limpiar
                        </button>
                        <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-save mr-2"></i>Registrar Transacción
                        </button>
                    </div>
                </form>
            </div>

            <!-- Recent Transactions (Last 3 days) -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-history mr-2 text-blue-600"></i>
                        Últimos Movimientos (3 días)
                    </h2>
                    <div class="flex space-x-2">
                        <button onclick="loadTransactions()" class="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
                            <i class="fas fa-refresh mr-2"></i>Actualizar
                        </button>
                        <button onclick="showAllTransactions()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-list mr-2"></i>Ver Todas
                        </button>
                    </div>
                </div>
                
                <div id="transactionsTable" class="overflow-x-auto">
                    <!-- Transactions will be loaded here -->
                    <div class="flex items-center justify-center py-8">
                        <i class="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
                        <span class="ml-2 executive-text-primary">Cargando transacciones...</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Edición de Transacción -->
        <div id="editTransactionModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
            <div class="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">Editar Transacción</h3>
                    <button onclick="closeEditModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="editTransactionForm" class="space-y-6">
                    <input type="hidden" id="editTransactionId">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora</label>
                            <input type="datetime-local" id="editTransactionDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Exchange</label>
                            <select id="editExchange" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" required>
                                <option value="">Seleccionar exchange</option>
                                <option value="Bitso">Bitso</option>
                                <option value="Binance">Binance</option>
                                <option value="Etoro">Etoro</option>
                                <option value="Lbank">Lbank</option>
                                <option value="Metamask">Metamask</option>
                                <option value="Bybit">Bybit</option>
                                <option value="Dexscreener">Dexscreener</option>
                                <option value="Ledger">Ledger</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                            <input type="number" id="editQuantity" step="0.00000001" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Precio por Unidad</label>
                            <input type="number" id="editPricePerUnit" step="0.00000001" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" required>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Total</label>
                            <input type="number" id="editTotalAmount" step="0.00000001" class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900" readonly>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                            <textarea id="editNotes" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" placeholder="Notas adicionales sobre la transacción..."></textarea>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-4 pt-6 border-t">
                        <button type="button" onclick="closeEditModal()" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                            Cancelar
                        </button>
                        <button type="submit" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            <i class="fas fa-save mr-2"></i>
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script>
            // Global variables
            let selectedAssetData = null;
            let selectedAssetFromData = null;
            let selectedAssetToData = null;
            let searchTimeout = null;
            let currentTransactionType = '';

            // Initialize page
            document.addEventListener('DOMContentLoaded', function() {
                // Set default date to now
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                document.getElementById('transactionDate').value = now.toISOString().slice(0, 16);
                
                // Load recent transactions
                loadTransactions();
                
                // Setup event listeners
                setupEventListeners();
            });

            // Setup all event listeners
            function setupEventListeners() {
                // Transaction type change
                document.getElementById('transactionType').addEventListener('change', handleTransactionTypeChange);
                
                // Asset search (single asset for buy/sell)
                document.getElementById('assetSearch').addEventListener('input', handleAssetSearch);
                
                // Asset search for trades
                document.getElementById('assetFromSearch').addEventListener('input', (e) => handleTradeAssetSearch(e, 'from'));
                document.getElementById('assetToSearch').addEventListener('input', (e) => handleTradeAssetSearch(e, 'to'));
                
                // Auto-calculate total
                document.getElementById('quantity').addEventListener('input', calculateTotal);
                document.getElementById('pricePerUnit').addEventListener('input', calculateTotal);
                
                // Form submission
                document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);
                
                // Click outside to close search results
                document.addEventListener('click', function(e) {
                    const searchElements = ['#assetSearch', '#searchResults', '#assetFromSearch', '#searchResultsFrom', '#assetToSearch', '#searchResultsTo'];
                    if (!searchElements.some(selector => e.target.closest(selector))) {
                        hideAllSearchResults();
                    }
                });
            }

            // Handle transaction type change
            function handleTransactionTypeChange(e) {
                currentTransactionType = e.target.value;
                
                const singleAssetSection = document.getElementById('singleAssetSection');
                const tradeSection = document.getElementById('tradeSection');
                const quantitySection = document.getElementById('quantitySection');
                const priceSection = document.getElementById('priceSection');
                const totalSection = document.getElementById('totalSection');
                
                if (currentTransactionType === 'trade') {
                    // Show trade interface
                    singleAssetSection.classList.add('hidden');
                    quantitySection.classList.add('hidden');
                    priceSection.classList.add('hidden');
                    totalSection.classList.add('hidden');
                    tradeSection.classList.remove('hidden');
                    
                    // Clear single asset data
                    clearSelectedAsset();
                } else {
                    // Show buy/sell interface
                    singleAssetSection.classList.remove('hidden');
                    quantitySection.classList.remove('hidden');
                    priceSection.classList.remove('hidden');
                    totalSection.classList.remove('hidden');
                    tradeSection.classList.add('hidden');
                    
                    // Clear trade data
                    clearTradeAssets();
                }
            }

            // Handle asset search with debouncing
            function handleAssetSearch(e) {
                const query = e.target.value.trim();
                
                clearTimeout(searchTimeout);
                
                if (query.length < 2) {
                    hideSearchResults();
                    return;
                }
                
                searchTimeout = setTimeout(() => searchAssets(query, 'single'), 300);
            }

            // Handle trade asset search
            function handleTradeAssetSearch(e, type) {
                const query = e.target.value.trim();
                
                clearTimeout(searchTimeout);
                
                if (query.length < 2) {
                    hideTradeSearchResults(type);
                    return;
                }
                
                searchTimeout = setTimeout(() => searchAssets(query, type), 300);
            }

            // Search assets from API
            async function searchAssets(query, type = 'single') {
                try {
                    showSearchLoading(type);
                    
                    const response = await axios.get(\`/api/assets/search?q=\${encodeURIComponent(query)}\`);
                    const { results } = response.data;
                    
                    displaySearchResults(results, type);
                } catch (error) {
                    console.error('Asset search error:', error);
                    hideSearchResults(type);
                }
            }

            // Display search results
            function displaySearchResults(results, type = 'single') {
                const containerId = type === 'single' ? 'searchResults' : 
                                   type === 'from' ? 'searchResultsFrom' : 'searchResultsTo';
                const resultsContainer = document.getElementById(containerId);
                
                if (results.length === 0) {
                    resultsContainer.innerHTML = '<div class="p-4 text-gray-500 text-center">No se encontraron activos</div>';
                    resultsContainer.classList.remove('hidden');
                    return;
                }

                const selectFunction = type === 'single' ? 'selectAsset' : 
                                      type === 'from' ? 'selectTradeAssetFrom' : 'selectTradeAssetTo';

                const html = results.map(asset => \`
                    <div class="p-3 hover:bg-slate-700 bg-opacity-50 cursor-pointer border-b last:border-b-0" 
                         onclick="\${selectFunction}('\${asset.symbol}', '\${asset.name}', '\${asset.category}', '\${asset.api_source}', '\${asset.api_id}')">
                        <div class="flex justify-between items-center">
                            <div>
                                <span class="font-medium text-gray-800">\${asset.symbol}</span>
                                <span class="executive-text-primary ml-2">\${asset.name}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-xs bg-gray-200 executive-text-primary px-2 py-1 rounded-full">
                                    \${asset.category === 'crypto' ? 'Crypto' : 
                                      asset.category === 'stocks' ? 'Acción' : 
                                      asset.category === 'etfs' ? 'ETF' : 'Otro'}
                                </span>
                                <i class="fas fa-plus text-blue-600"></i>
                            </div>
                        </div>
                    </div>
                \`).join('');
                
                resultsContainer.innerHTML = html;
                resultsContainer.classList.remove('hidden');
            }

            // Select an asset from search results
            function selectAsset(symbol, name, category, apiSource, apiId) {
                selectedAssetData = {
                    symbol: symbol,
                    name: name,
                    category: category,
                    api_source: apiSource,
                    api_id: apiId
                };

                // Update UI
                document.getElementById('selectedSymbol').textContent = symbol;
                document.getElementById('selectedName').textContent = name;
                document.getElementById('selectedCategory').textContent = 
                    category === 'crypto' ? 'Crypto' : 
                    category === 'stocks' ? 'Acción' : 
                    category === 'etfs' ? 'ETF' : 'Otro';

                document.getElementById('selectedAsset').classList.remove('hidden');
                document.getElementById('assetSearch').value = \`\${symbol} - \${name}\`;
                
                hideSearchResults();
                
                // Auto-fetch current price
                fetchCurrentPrice();
            }

            // Select trade asset (FROM - what you're selling)
            function selectTradeAssetFrom(symbol, name, category, apiSource, apiId) {
                selectedAssetFromData = {
                    symbol: symbol,
                    name: name,
                    category: category,
                    api_source: apiSource,
                    api_id: apiId
                };

                document.getElementById('selectedSymbolFrom').textContent = symbol;
                document.getElementById('selectedNameFrom').textContent = name;
                document.getElementById('selectedAssetFrom').classList.remove('hidden');
                document.getElementById('assetFromSearch').value = \`\${symbol} - \${name}\`;
                
                hideTradeSearchResults('from');
            }

            // Select trade asset (TO - what you're receiving)
            function selectTradeAssetTo(symbol, name, category, apiSource, apiId) {
                selectedAssetToData = {
                    symbol: symbol,
                    name: name,
                    category: category,
                    api_source: apiSource,
                    api_id: apiId
                };

                document.getElementById('selectedSymbolTo').textContent = symbol;
                document.getElementById('selectedNameTo').textContent = name;
                document.getElementById('selectedAssetTo').classList.remove('hidden');
                document.getElementById('assetToSearch').value = \`\${symbol} - \${name}\`;
                
                hideTradeSearchResults('to');
            }

            // Clear selected asset (single)
            function clearSelectedAsset() {
                selectedAssetData = null;
                document.getElementById('selectedAsset').classList.add('hidden');
                document.getElementById('assetSearch').value = '';
                document.getElementById('pricePerUnit').value = '';
                calculateTotal();
            }

            // Clear trade assets
            function clearSelectedAssetFrom() {
                selectedAssetFromData = null;
                document.getElementById('selectedAssetFrom').classList.add('hidden');
                document.getElementById('assetFromSearch').value = '';
            }

            function clearSelectedAssetTo() {
                selectedAssetToData = null;
                document.getElementById('selectedAssetTo').classList.add('hidden');
                document.getElementById('assetToSearch').value = '';
            }

            function clearTradeAssets() {
                clearSelectedAssetFrom();
                clearSelectedAssetTo();
                document.getElementById('quantityFrom').value = '';
                document.getElementById('quantityTo').value = '';
            }

            // Fetch current price for selected asset
            async function fetchCurrentPrice() {
                console.log('fetchCurrentPrice called');
                console.log('selectedAssetData:', selectedAssetData);
                
                if (!selectedAssetData) {
                    alert('Primero selecciona un activo');
                    return;
                }

                try {
                    const url = \`/api/assets/price/\${selectedAssetData.symbol}?source=\${selectedAssetData.api_source}&api_id=\${selectedAssetData.api_id}\`;
                    console.log('Fetching price from:', url);
                    
                    const response = await axios.get(url);
                    console.log('Price response:', response.data);
                    
                    const { price } = response.data;
                    
                    if (price > 0) {
                        document.getElementById('pricePerUnit').value = price.toFixed(8);
                        calculateTotal();
                        alert(\`Precio actualizado: $\${price.toFixed(2)}\`);
                    } else {
                        alert('No se pudo obtener el precio actual. Ingresa el precio manualmente.');
                    }
                } catch (error) {
                    console.error('Error fetching price:', error);
                    alert('Error al obtener el precio actual');
                }
            }

            // Calculate total amount
            function calculateTotal() {
                const quantity = parseFloat(document.getElementById('quantity').value) || 0;
                const pricePerUnit = parseFloat(document.getElementById('pricePerUnit').value) || 0;
                const total = quantity * pricePerUnit;
                
                document.getElementById('totalAmount').value = total.toFixed(8);
            }

            // Handle form submission
            async function handleFormSubmit(e) {
                e.preventDefault();
                
                const transactionType = document.getElementById('transactionType').value;
                const exchange = document.getElementById('exchange').value;
                const fees = parseFloat(document.getElementById('fees').value) || 0;
                const notes = document.getElementById('notes').value;
                const transactionDate = document.getElementById('transactionDate').value;

                if (transactionType === 'trade') {
                    // Handle trade (creates two transactions)
                    if (!selectedAssetFromData || !selectedAssetToData) {
                        alert('Debes seleccionar ambos activos para el trade');
                        return;
                    }

                    const quantityFrom = parseFloat(document.getElementById('quantityFrom').value);
                    const quantityTo = parseFloat(document.getElementById('quantityTo').value);

                    if (!quantityFrom || !quantityTo) {
                        alert('Debes ingresar las cantidades de ambos activos');
                        return;
                    }

                    try {
                        const response = await axios.post('/api/transactions/trade', {
                            asset_from: selectedAssetFromData,
                            asset_to: selectedAssetToData,
                            quantity_from: quantityFrom,
                            quantity_to: quantityTo,
                            exchange: exchange,
                            fees: fees,
                            notes: notes,
                            transaction_date: transactionDate
                        });
                        
                        if (response.data.success) {
                            alert('Trade registrado exitosamente');
                            resetForm();
                            loadTransactions();
                        } else {
                            alert('Error: ' + response.data.error);
                        }
                    } catch (error) {
                        console.error('Error creating trade:', error);
                        alert('Error al registrar el trade');
                    }

                } else {
                    // Handle buy/sell
                    if (!selectedAssetData) {
                        alert('Debes seleccionar un activo');
                        return;
                    }

                    const formData = {
                        type: transactionType,
                        asset_symbol: selectedAssetData.symbol,
                        asset_name: selectedAssetData.name,
                        category: selectedAssetData.category,
                        api_source: selectedAssetData.api_source,
                        api_id: selectedAssetData.api_id,
                        exchange: exchange,
                        quantity: parseFloat(document.getElementById('quantity').value),
                        price_per_unit: parseFloat(document.getElementById('pricePerUnit').value),
                        fees: fees,
                        notes: notes,
                        transaction_date: transactionDate
                    };

                    try {
                        const response = await axios.post('/api/transactions', formData);
                        
                        if (response.data.success) {
                            alert('Transacción registrada exitosamente');
                            resetForm();
                            loadTransactions();
                        } else {
                            alert('Error: ' + response.data.error);
                        }
                    } catch (error) {
                        console.error('Error creating transaction:', error);
                        alert('Error al registrar la transacción');
                    }
                }
            }

            // Reset form
            function resetForm() {
                document.getElementById('transactionForm').reset();
                clearSelectedAsset();
                clearTradeAssets();
                
                // Reset UI sections
                document.getElementById('singleAssetSection').classList.remove('hidden');
                document.getElementById('quantitySection').classList.remove('hidden');
                document.getElementById('priceSection').classList.remove('hidden');
                document.getElementById('totalSection').classList.remove('hidden');
                document.getElementById('tradeSection').classList.add('hidden');
                
                // Reset date to now
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                document.getElementById('transactionDate').value = now.toISOString().slice(0, 16);
                
                document.getElementById('fees').value = '0';
                calculateTotal();
                
                currentTransactionType = '';
            }

            // Load recent transactions (last 3 days)
            window.loadTransactions = async function() {
                try {
                    const response = await axios.get('/api/transactions/recent');
                    const transactions = response.data;
                    
                    displayTransactions(transactions);
                } catch (error) {
                    console.error('Error loading transactions:', error);
                    document.getElementById('transactionsTable').innerHTML = 
                        '<div class="text-center py-4 text-red-600">Error cargando transacciones</div>';
                }
            }

            // Display transactions table
            function displayTransactions(transactions) {
                const container = document.getElementById('transactionsTable');
                
                if (transactions.length === 0) {
                    container.innerHTML = '<div class="text-center py-8 text-gray-500">No hay transacciones recientes</div>';
                    return;
                }

                const tableHTML = \`
                    <table class="min-w-full">
                        <thead class="bg-slate-700 bg-opacity-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exchange</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            \${transactions.map(tx => \`
                                <tr class="hover:bg-slate-700 bg-opacity-50">
                                    <td class="px-4 py-3 text-sm executive-text-primary">
                                        \${new Date(tx.transaction_date).toLocaleString('es-ES')}
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full \${
                                            tx.type === 'buy' ? 'bg-green-100 text-green-800' : 
                                            tx.type === 'sell' ? 'bg-red-100 text-red-800' : 
                                            tx.type === 'trade_in' ? 'bg-blue-100 text-blue-800' :
                                            tx.type === 'trade_out' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }">
                                            \${tx.type === 'buy' ? '💰 Compra' : 
                                              tx.type === 'sell' ? '💵 Venta' : 
                                              tx.type === 'trade_in' ? '⬅️ Trade In' : 
                                              tx.type === 'trade_out' ? '➡️ Trade Out' : tx.type}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="font-medium text-gray-800">\${tx.asset_symbol}</div>
                                        <div class="text-xs text-gray-500">\${tx.asset_name || ''}</div>
                                    </td>
                                    <td class="px-4 py-3 text-sm executive-text-primary">\${tx.exchange}</td>
                                    <td class="px-4 py-3 text-sm executive-text-primary">\${parseFloat(tx.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}</td>
                                    <td class="px-4 py-3 text-sm executive-text-primary">$\${parseFloat(tx.price_per_unit).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    <td class="px-4 py-3 text-sm executive-text-primary">$\${parseFloat(tx.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    <td class="px-4 py-3">
                                        <div class="flex space-x-2">
                                            <button onclick="editTransaction(\${tx.id})" class="text-blue-600 hover:text-blue-800 text-sm" title="Editar transacción">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="deleteTransaction(\${tx.id})" class="text-red-600 hover:text-red-800 text-sm" title="Eliminar transacción">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
                
                container.innerHTML = tableHTML;
            }

            // Delete transaction
            async function deleteTransaction(id) {
                if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
                
                try {
                    const response = await axios.delete(\`/api/transactions/\${id}\`);
                    
                    if (response.data.success) {
                        alert('Transacción eliminada');
                        loadTransactions();
                    } else {
                        alert('Error eliminando transacción');
                    }
                } catch (error) {
                    console.error('Error deleting transaction:', error);
                    alert('Error eliminando transacción');
                }
            }

            // Make function globally accessible
            window.deleteTransaction = deleteTransaction;

            // Edit transaction functions
            async function editTransaction(id) {
                try {
                    // Get transaction data
                    const response = await axios.get('/api/transactions/' + id);
                    const transaction = response.data;
                    
                    // Populate modal fields
                    document.getElementById('editTransactionId').value = transaction.id;
                    document.getElementById('editTransactionDate').value = new Date(transaction.transaction_date).toISOString().slice(0, 16);
                    document.getElementById('editExchange').value = transaction.exchange;
                    document.getElementById('editQuantity').value = transaction.quantity;
                    document.getElementById('editPricePerUnit').value = transaction.price_per_unit;
                    document.getElementById('editTotalAmount').value = transaction.total_amount;
                    document.getElementById('editNotes').value = transaction.notes || '';
                    
                    // Setup auto-calculation for edit form
                    document.getElementById('editQuantity').addEventListener('input', calculateEditTotal);
                    document.getElementById('editPricePerUnit').addEventListener('input', calculateEditTotal);
                    
                    // Show modal
                    document.getElementById('editTransactionModal').classList.remove('hidden');
                    
                } catch (error) {
                    console.error('Error loading transaction:', error);
                    alert('Error cargando datos de la transacción');
                }
            }

            // Make function globally accessible
            window.editTransaction = editTransaction;

            function calculateEditTotal() {
                const quantity = parseFloat(document.getElementById('editQuantity').value) || 0;
                const price = parseFloat(document.getElementById('editPricePerUnit').value) || 0;
                const total = quantity * price;
                document.getElementById('editTotalAmount').value = total.toFixed(8);
            }

            function closeEditModal() {
                document.getElementById('editTransactionModal').classList.add('hidden');
                document.getElementById('editTransactionForm').reset();
            }

            // Handle edit form submission
            document.addEventListener('DOMContentLoaded', function() {
                document.getElementById('editTransactionForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const id = document.getElementById('editTransactionId').value;
                    const formData = {
                        transaction_date: document.getElementById('editTransactionDate').value,
                        exchange: document.getElementById('editExchange').value,
                        quantity: parseFloat(document.getElementById('editQuantity').value),
                        price_per_unit: parseFloat(document.getElementById('editPricePerUnit').value),
                        total_amount: parseFloat(document.getElementById('editTotalAmount').value),
                        notes: document.getElementById('editNotes').value
                    };
                    
                    try {
                        const response = await axios.put('/api/transactions/' + id, formData);
                        
                        if (response.data.success) {
                            alert('Transacción actualizada exitosamente');
                            closeEditModal();
                            loadTransactions();
                        } else {
                            alert('Error: ' + response.data.error);
                        }
                    } catch (error) {
                        console.error('Error updating transaction:', error);
                        alert('Error actualizando la transacción');
                    }
                });
            });

            // Show search loading state
            function showSearchLoading(type = 'single') {
                const containerId = type === 'single' ? 'searchResults' : 
                                   type === 'from' ? 'searchResultsFrom' : 'searchResultsTo';
                const container = document.getElementById(containerId);
                container.innerHTML = '<div class="p-4 text-center"><i class="fas fa-spinner fa-spin text-blue-600"></i> Buscando...</div>';
                container.classList.remove('hidden');
            }

            // Hide search results
            function hideSearchResults(type = 'single') {
                const containerId = type === 'single' ? 'searchResults' : 
                                   type === 'from' ? 'searchResultsFrom' : 'searchResultsTo';
                document.getElementById(containerId).classList.add('hidden');
            }

            // Hide trade search results
            function hideTradeSearchResults(type) {
                hideSearchResults(type);
            }

            // Hide all search results
            function hideAllSearchResults() {
                hideSearchResults('single');
                hideSearchResults('from');
                hideSearchResults('to');
            }

            // Show loader
            window.showLoader = function(containerId) {
                document.getElementById(containerId).innerHTML = 
                    '<div class="flex items-center justify-center py-8">' +
                        '<i class="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>' +
                    '</div>';
            };

            // Show all transactions
            window.showAllTransactions = async function() {
                try {
                    showLoader('transactionsTable');
                    
                    const response = await axios.get('/api/transactions?limit=100&offset=0');
                    const data = response.data;
                    
                    displayAllTransactions(data.transactions, data.total);
                } catch (error) {
                    console.error('Error loading all transactions:', error);
                    document.getElementById('transactionsTable').innerHTML = 
                        '<div class="text-center py-8 text-red-600">' +
                            '<i class="fas fa-exclamation-triangle text-2xl mb-2"></i>' +
                            '<p>Error al cargar las transacciones</p>' +
                        '</div>';
                }
            }

            // Display all transactions in a comprehensive table
            window.displayAllTransactions = function(transactions, total) {
                const container = document.getElementById('transactionsTable');
                
                if (!transactions || transactions.length === 0) {
                    container.innerHTML = 
                        '<div class="text-center py-8 text-gray-500">' +
                            '<i class="fas fa-inbox text-4xl mb-4"></i>' +
                            '<p class="text-lg">No hay transacciones registradas</p>' +
                        '</div>';
                    return;
                }

                const uniqueAssets = [...new Set(transactions.map(t => t.asset_symbol))].sort();
                const assetOptions = uniqueAssets.map(symbol => 
                    '<option value="' + symbol + '">' + symbol + '</option>'
                ).join('');
                
                const transactionRows = transactions.map(tx => createTransactionRow(tx)).join('');
                
                const html = '<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">' +
                    '<!-- Transaction Stats -->' +
                    '<div class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">' +
                        '<div class="flex justify-between items-center">' +
                            '<h3 class="text-lg font-semibold text-gray-800">' +
                                '<i class="fas fa-chart-line mr-2 text-blue-600"></i>' +
                                'Todas las Transacciones (' + total + ')' +
                            '</h3>' +
                            '<div class="flex space-x-4 text-sm text-gray-600">' +
                                '<span><i class="fas fa-calendar mr-1"></i>Histórico completo</span>' +
                                '<span><i class="fas fa-coins mr-1"></i>' + uniqueAssets.length + ' activos</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    
                    '<!-- Filters -->' +
                    '<div class="px-6 py-3 bg-gray-50 border-b border-gray-200">' +
                        '<div class="flex flex-wrap gap-3">' +
                            '<select id="filterAsset" class="px-3 py-1 border border-gray-300 rounded-lg text-sm" onchange="filterTransactions()">' +
                                '<option value="">Todos los activos</option>' +
                                assetOptions +
                            '</select>' +
                            '<select id="filterType" class="px-3 py-1 border border-gray-300 rounded-lg text-sm" onchange="filterTransactions()">' +
                                '<option value="">Todos los tipos</option>' +
                                '<option value="buy">Compra</option>' +
                                '<option value="sell">Venta</option>' +
                                '<option value="trade_in">Trade In</option>' +
                                '<option value="trade_out">Trade Out</option>' +
                            '</select>' +
                            '<button onclick="clearFilters()" class="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm">' +
                                '<i class="fas fa-times mr-1"></i>Limpiar' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    
                    '<!-- Transaction Table -->' +
                    '<div class="overflow-x-auto" id="transactionTableContent">' +
                        '<table class="w-full">' +
                            '<thead class="bg-gray-50">' +
                                '<tr class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">' +
                                    '<th class="px-6 py-3">Fecha</th>' +
                                    '<th class="px-6 py-3">Tipo</th>' +
                                    '<th class="px-6 py-3">Activo</th>' +
                                    '<th class="px-6 py-3">Cantidad</th>' +
                                    '<th class="px-6 py-3">Precio</th>' +
                                    '<th class="px-6 py-3">Total</th>' +
                                    '<th class="px-6 py-3">Exchange</th>' +
                                    '<th class="px-6 py-3">Comisiones</th>' +
                                    '<th class="px-6 py-3">Acciones</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody class="bg-white divide-y divide-gray-200" id="transactionRows">' +
                                transactionRows +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                    
                    '<!-- Pagination -->' +
                    '<div class="px-6 py-4 bg-gray-50 border-t border-gray-200">' +
                        '<div class="flex justify-between items-center">' +
                            '<span class="text-sm text-gray-600">' +
                                'Mostrando ' + transactions.length + ' de ' + total + ' transacciones' +
                            '</span>' +
                            '<div class="flex space-x-2">' +
                                '<button onclick="loadMoreTransactions()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">' +
                                    '<i class="fas fa-plus mr-1"></i>Cargar Más' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

                container.innerHTML = html;
                
                // Store original transactions for filtering
                window.allTransactions = transactions;
            }

            // Create a transaction table row
            window.createTransactionRow = function(tx) {
                const date = new Date(tx.transaction_date);
                const formattedDate = date.toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const typeIcons = {
                    'buy': '<i class="fas fa-arrow-down text-green-600"></i>',
                    'sell': '<i class="fas fa-arrow-up text-red-600"></i>',
                    'trade_in': '<i class="fas fa-exchange-alt text-blue-600"></i>',
                    'trade_out': '<i class="fas fa-exchange-alt text-orange-600"></i>'
                };

                const typeLabels = {
                    'buy': 'Compra',
                    'sell': 'Venta',
                    'trade_in': 'Trade In',
                    'trade_out': 'Trade Out'
                };

                const typeColors = {
                    'buy': 'text-green-700 bg-green-100',
                    'sell': 'text-red-700 bg-red-100',
                    'trade_in': 'text-blue-700 bg-blue-100',
                    'trade_out': 'text-orange-700 bg-orange-100'
                };

                const dateTime = formattedDate.split(' ');
                const assetName = tx.asset_name || 'N/A';
                const formattedQuantity = parseFloat(tx.quantity).toFixed(8);
                const formattedPrice = tx.price_per_unit.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const formattedTotal = tx.total_amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const formattedFees = tx.fees > 0 ? '$' + tx.fees.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
                
                return '<tr class="hover:bg-gray-50 cursor-pointer transaction-row" onclick="showTransactionDetails(' + tx.id + ')" data-asset="' + tx.asset_symbol + '" data-type="' + tx.type + '">' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' +
                        '<div class="flex flex-col">' +
                            '<span class="font-medium">' + dateTime[0] + '</span>' +
                            '<span class="text-gray-500">' + dateTime[1] + '</span>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap">' +
                        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + typeColors[tx.type] + '">' +
                            typeIcons[tx.type] + ' <span class="ml-1">' + typeLabels[tx.type] + '</span>' +
                        '</span>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap">' +
                        '<div class="flex items-center">' +
                            '<div class="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">' +
                                '<span class="text-xs font-medium text-gray-600">' + tx.asset_symbol + '</span>' +
                            '</div>' +
                            '<div class="ml-3">' +
                                '<div class="text-sm font-medium text-gray-900">' + tx.asset_symbol + '</div>' +
                                '<div class="text-sm text-gray-500">' + assetName + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' +
                        '<span class="font-medium">' + formattedQuantity + '</span>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' +
                        '$' + formattedPrice +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">' +
                        '$' + formattedTotal +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' +
                        '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100">' +
                            '<i class="fas fa-building mr-1"></i>' + tx.exchange +
                        '</span>' +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' +
                        formattedFees +
                    '</td>' +
                    '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
                        '<button onclick="event.stopPropagation(); editTransaction(' + tx.id + ')" class="text-blue-600 hover:text-blue-900 mr-3" title="Editar transacción">' +
                            '<i class="fas fa-edit"></i>' +
                        '</button>' +
                        '<button onclick="event.stopPropagation(); deleteTransaction(' + tx.id + ')" class="text-red-600 hover:text-red-900" title="Eliminar transacción">' +
                            '<i class="fas fa-trash"></i>' +
                        '</button>' +
                    '</td>' +
                '</tr>';
            }

            // Filter transactions
            window.filterTransactions = function() {
                const assetFilter = document.getElementById('filterAsset').value;
                const typeFilter = document.getElementById('filterType').value;
                
                const rows = document.querySelectorAll('.transaction-row');
                let visibleCount = 0;
                
                rows.forEach(row => {
                    const asset = row.getAttribute('data-asset');
                    const type = row.getAttribute('data-type');
                    
                    const matchAsset = !assetFilter || asset === assetFilter;
                    const matchType = !typeFilter || type === typeFilter;
                    
                    if (matchAsset && matchType) {
                        row.style.display = '';
                        visibleCount++;
                    } else {
                        row.style.display = 'none';
                    }
                });
                
                // Update visible count
                const countSpan = document.querySelector('.text-sm.text-gray-600');
                if (countSpan) {
                    countSpan.textContent = 'Mostrando ' + visibleCount + ' transacciones (filtradas)';
                }
            }

            // Clear filters
            window.clearFilters = function() {
                document.getElementById('filterAsset').value = '';
                document.getElementById('filterType').value = '';
                filterTransactions();
            }

            // Load more transactions (pagination)
            window.loadMoreTransactions = async function() {
                try {
                    const currentRows = document.querySelectorAll('.transaction-row').length;
                    const response = await axios.get('/api/transactions?limit=50&offset=' + currentRows);
                    const data = response.data;
                    
                    if (data.transactions && data.transactions.length > 0) {
                        const tbody = document.getElementById('transactionRows');
                        const newRows = data.transactions.map(tx => createTransactionRow(tx)).join('');
                        tbody.innerHTML += newRows;
                        
                        // Update count
                        const countSpan = document.querySelector('.text-sm.text-gray-600');
                        const totalVisible = document.querySelectorAll('.transaction-row').length;
                        countSpan.textContent = 'Mostrando ' + totalVisible + ' de ' + data.total + ' transacciones';
                        
                        // Update stored transactions for filtering
                        window.allTransactions = [...(window.allTransactions || []), ...data.transactions];
                    }
                } catch (error) {
                    console.error('Error loading more transactions:', error);
                }
            }

            // Logout function
            async function logout() {
                try {
                    await axios.post('/api/auth/logout');
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Error during logout:', error);
                    window.location.href = '/login';
                }
            }
        </script>
    </body>
    </html>
  `)
})

// ============================================
// API ROUTES - WALLET & HOLDINGS
// ============================================

// Get all current holdings
app.get('/api/wallet/holdings', async (c) => {
  try {
    const category = c.req.query('category') // 'crypto', 'stocks', 'etfs', or 'all'
    
    let query = `
      SELECT 
        h.*,
        a.name,
        a.category,
        a.subcategory,
        a.current_price,
        a.price_updated_at,
        ((h.current_value - h.total_invested) / h.total_invested) * 100 as pnl_percentage
      FROM holdings h
      JOIN assets a ON h.asset_symbol = a.symbol
      WHERE h.quantity > 0
    `
    
    const params = []
    if (category && category !== 'all') {
      query += ' AND a.category = ?'
      params.push(category)
    }
    
    query += ' ORDER BY h.current_value DESC'
    
    const holdings = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      holdings: holdings.results,
      total_holdings: holdings.results.length
    })
  } catch (error) {
    return c.json({ error: 'Error fetching holdings' }, 500)
  }
})

// Generate daily snapshots for an asset (backfill from July 21, 2025)
app.post('/api/wallet/asset/:symbol/generate-snapshots', async (c) => {
  try {
    const symbol = c.req.param('symbol')
    
    // Get holding info
    const holding = await c.env.DB.prepare(`
      SELECT h.*, a.current_price, a.api_source, a.api_id
      FROM holdings h
      JOIN assets a ON h.asset_symbol = a.symbol
      WHERE h.asset_symbol = ?
    `).bind(symbol).first()
    
    if (!holding) {
      return c.json({ error: 'Asset not found in holdings' }, 404)
    }
    
    // Generate daily snapshots from July 21, 2025 to today (including today)
    const startDate = new Date('2025-07-21')
    const today = new Date()
    // Include today in the snapshots
    const endDate = new Date(today)
    const msPerDay = 24 * 60 * 60 * 1000
    
    let snapshotsCreated = 0
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      
      // Check if snapshot already exists
      const existingSnapshot = await c.env.DB.prepare(`
        SELECT id FROM daily_snapshots 
        WHERE asset_symbol = ? AND snapshot_date = ?
      `).bind(symbol, dateStr).first()
      
      if (!existingSnapshot) {
        // Simulate historical price (in production, you'd fetch from APIs or calculate from transactions)
        let historicalPrice = holding.current_price || 100
        
        // Add some realistic variation for demo
        const daysAgo = Math.floor((today - d) / msPerDay)
        const variation = Math.sin(daysAgo * 0.1) * 0.1 + (Math.random() - 0.5) * 0.05
        historicalPrice = historicalPrice * (1 + variation)
        
        // Calculate values for that date
        const totalValue = holding.quantity * historicalPrice
        const unrealizedPnl = totalValue - holding.total_invested
        
        // Create snapshot (simulate 9 PM Mazatlan time)
        await c.env.DB.prepare(`
          INSERT INTO daily_snapshots (
            asset_symbol, snapshot_date, quantity, price_per_unit, 
            total_value, unrealized_pnl, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          symbol,
          dateStr,
          holding.quantity,
          historicalPrice,
          totalValue,
          unrealizedPnl,
          new Date(d.getTime() + 21 * 60 * 60 * 1000).toISOString() // 9 PM Mazatlan
        ).run()
        
        snapshotsCreated++
      }
    }
    
    return c.json({
      success: true,
      snapshots_created: snapshotsCreated,
      message: `Se generaron ${snapshotsCreated} snapshots históricos`
    })
  } catch (error) {
    console.error('Error generating snapshots:', error)
    return c.json({ error: 'Error generating snapshots' }, 500)
  }
})

// Get detailed asset information for individual view
app.get('/api/wallet/asset/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol')
    const fromExploration = c.req.query('from') === 'prices' || c.req.query('from') === 'watchlist'
    const assetName = c.req.query('name')
    const assetCategory = c.req.query('category')
    
    // Get holding info
    const holding = await c.env.DB.prepare(`
      SELECT 
        h.*,
        a.name,
        a.category,
        a.subcategory,
        a.current_price,
        a.price_updated_at,
        ((h.current_value - h.total_invested) / h.total_invested) * 100 as pnl_percentage
      FROM holdings h
      JOIN assets a ON h.asset_symbol = a.symbol
      WHERE h.asset_symbol = ?
    `).bind(symbol).first()
    
    // If not found in wallet but coming from exploration (prices/watchlist mode)
    if (!holding && fromExploration) {
      // Create exploration asset data
      const explorationAsset = {
        asset_symbol: symbol,
        name: assetName || symbol,
        category: assetCategory || 'unknown',
        current_price: Math.random() * 300 + 50, // Mock price
        quantity: 0,
        total_invested: 0,
        current_value: 0,
        unrealized_pnl: 0,
        pnl_percentage: 0,
        from_exploration: true
      }
      
      return c.json({
        holding: explorationAsset,
        transactions: [],
        daily_snapshots: [],
        is_exploration: true
      })
    }
    
    if (!holding) {
      return c.json({ error: 'Asset not found in holdings' }, 404)
    }
    
    // Get transaction history for this asset
    const transactions = await c.env.DB.prepare(`
      SELECT * FROM transactions 
      WHERE asset_symbol = ? 
      ORDER BY transaction_date DESC
      LIMIT 50
    `).bind(symbol).all()
    
    // Get price history (if available)
    const priceHistory = await c.env.DB.prepare(`
      SELECT * FROM price_history 
      WHERE asset_symbol = ? 
      ORDER BY timestamp DESC
      LIMIT 100
    `).bind(symbol).all()
    
    // Get daily snapshots from July 21, 2025 (with Mazatlán timezone - UTC-7)
    const dailySnapshots = await c.env.DB.prepare(`
      SELECT * FROM daily_snapshots 
      WHERE asset_symbol = ? AND snapshot_date >= '2025-07-21'
      ORDER BY snapshot_date ASC
    `).bind(symbol).all()

    // Generate mock daily data from July 21, 2025 to today if no snapshots exist
    let historicalData = dailySnapshots.results
    if (historicalData.length === 0 && holding) {
      historicalData = generateMockDailySnapshots(symbol, holding.current_price || 100)
    }
    
    return c.json({
      holding,
      transactions: transactions.results,
      price_history: priceHistory.results,
      daily_snapshots: historicalData
    })
  } catch (error) {
    return c.json({ error: 'Error fetching asset details' }, 500)
  }
})

// Update current prices for all holdings
app.post('/api/wallet/update-prices', async (c) => {
  try {
    const holdings = await c.env.DB.prepare('SELECT DISTINCT asset_symbol FROM holdings WHERE quantity > 0').all()
    
    let updatedCount = 0
    
    for (const holding of holdings.results) {
      const asset = await c.env.DB.prepare('SELECT * FROM assets WHERE symbol = ?').bind(holding.asset_symbol).first()
      
      if (!asset) continue
      
      let newPrice = 0
      
      // Fetch current price based on API source
      if (asset.api_source === 'coingecko' && asset.api_id) {
        try {
          const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${asset.api_id}&vs_currencies=usd`)
          if (response.ok) {
            const data = await response.json()
            newPrice = data[asset.api_id]?.usd || 0
          }
        } catch (error) {
          console.log(`Error fetching price for ${asset.symbol}:`, error)
        }
      } else if (asset.api_source === 'alphavantage') {
        // Mock prices for demo (in production, use Alpha Vantage API)
        const mockPrices = {
          'AAPL': 175.50 + (Math.random() - 0.5) * 10,
          'MSFT': 420.30 + (Math.random() - 0.5) * 20,
          'GOOGL': 140.25 + (Math.random() - 0.5) * 10,
          'SPY': 450.80 + (Math.random() - 0.5) * 15,
          'QQQ': 380.90 + (Math.random() - 0.5) * 15
        }
        newPrice = mockPrices[asset.symbol] || asset.current_price || 100
      }
      
      if (newPrice > 0) {
        // Update asset price
        await c.env.DB.prepare(`
          UPDATE assets 
          SET current_price = ?, price_updated_at = ?, updated_at = ?
          WHERE symbol = ?
        `).bind(
          newPrice,
          new Date().toISOString(),
          new Date().toISOString(),
          asset.symbol
        ).run()
        
        // Update holdings
        await updateHoldings(c.env.DB, asset.symbol)
        updatedCount++
      }
    }
    
    return c.json({ 
      success: true, 
      updated_assets: updatedCount,
      message: `Precios actualizados para ${updatedCount} activos`
    })
  } catch (error) {
    return c.json({ error: 'Error updating prices' }, 500)
  }
})

// Delete asset and all related data
app.delete('/api/wallet/asset/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol')
    
    // Verify asset exists
    const asset = await c.env.DB.prepare('SELECT * FROM assets WHERE symbol = ?').bind(symbol).first()
    
    if (!asset) {
      return c.json({ error: 'Asset not found' }, 404)
    }
    
    // Count existing data before deletion for reporting
    const transactionsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM transactions WHERE asset_symbol = ?').bind(symbol).first()
    const snapshotsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM daily_snapshots WHERE asset_symbol = ?').bind(symbol).first()
    const holdingsCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM holdings WHERE asset_symbol = ?').bind(symbol).first()
    
    // Start transaction-like deletions (D1 doesn't support transactions yet, but we'll do sequentially)
    
    // 1. Delete all daily snapshots
    await c.env.DB.prepare('DELETE FROM daily_snapshots WHERE asset_symbol = ?').bind(symbol).run()
    
    // 2. Delete all transactions
    await c.env.DB.prepare('DELETE FROM transactions WHERE asset_symbol = ?').bind(symbol).run()
    
    // 3. Delete holdings record
    await c.env.DB.prepare('DELETE FROM holdings WHERE asset_symbol = ?').bind(symbol).run()
    
    // 4. Delete the asset itself
    await c.env.DB.prepare('DELETE FROM assets WHERE symbol = ?').bind(symbol).run()
    
    console.log(`🗑️ Asset ${symbol} deleted: ${transactionsCount.count} transactions, ${snapshotsCount.count} snapshots, ${holdingsCount.count} holdings`)
    
    return c.json({
      success: true,
      message: `Asset ${symbol} deleted successfully`,
      transactions_deleted: transactionsCount.count || 0,
      snapshots_deleted: snapshotsCount.count || 0,
      holdings_deleted: holdingsCount.count || 0,
      asset_name: asset.name
    })
    
  } catch (error) {
    console.error('Error deleting asset:', error)
    return c.json({ 
      success: false,
      error: 'Error deleting asset',
      details: error.message 
    }, 500)
  }
})

// Generate historical snapshots for ALL assets (admin function)
app.post('/api/admin/generate-all-historical-snapshots', async (c) => {
  try {
    // Get all assets in the system
    const allAssets = await c.env.DB.prepare(`
      SELECT * FROM assets ORDER BY symbol
    `).all()
    
    if (!allAssets.results || allAssets.results.length === 0) {
      return c.json({ error: 'No assets found in system' }, 404)
    }
    
    const startDate = new Date('2025-07-21')
    const today = new Date()
    // Include today in the snapshots
    const endDate = new Date(today)
    
    let totalSnapshotsCreated = 0
    let totalSnapshotsSkipped = 0
    const results = []
    
    console.log(`🔄 Generating historical snapshots for ${allAssets.results.length} assets from July 21 to ${endDate.toISOString().split('T')[0]} (including today)`)
    
    // Process each asset
    for (const asset of allAssets.results) {
      console.log(`📊 Processing ${asset.symbol}...`)
      
      // Get all transactions for this asset to calculate historical holdings
      const transactions = await c.env.DB.prepare(`
        SELECT * FROM transactions 
        WHERE asset_symbol = ? 
        ORDER BY transaction_date ASC
      `).bind(asset.symbol).all()
      
      let snapshotsCreated = 0
      
      // Generate snapshot for each day from July 21 to today (including today)
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        
        // Check if snapshot already exists
        const existingSnapshot = await c.env.DB.prepare(`
          SELECT id FROM daily_snapshots 
          WHERE asset_symbol = ? AND snapshot_date = ?
        `).bind(asset.symbol, dateStr).first()
        
        if (existingSnapshot) {
          totalSnapshotsSkipped++
          continue
        }
        
        // Calculate quantity held on this date based on transaction history
        let quantityOnDate = 0
        if (transactions.results) {
          for (const tx of transactions.results) {
            const txDate = new Date(tx.transaction_date)
            if (txDate <= d) {
              switch (tx.type) {
                case 'buy':
                case 'trade_in':
                  quantityOnDate += parseFloat(tx.quantity)
                  break
                case 'sell':
                case 'trade_out':
                  quantityOnDate -= parseFloat(tx.quantity)
                  break
              }
            }
          }
        }
        quantityOnDate = Math.max(0, quantityOnDate) // Ensure non-negative
        
        // Generate historical price for this date
        let historicalPrice = asset.current_price || 100
        
        // Add realistic variation based on days from current
        const daysFromToday = Math.floor((today - d) / (24 * 60 * 60 * 1000))
        const variation = Math.sin(daysFromToday * 0.1) * 0.15 + (Math.random() - 0.5) * 0.08
        historicalPrice = historicalPrice * (1 + variation)
        historicalPrice = Math.max(historicalPrice, 0.01) // Ensure positive
        
        // Calculate values - will be zero if no holdings on that date
        const totalValue = quantityOnDate * historicalPrice
        let totalInvested = 0
        
        // Calculate total invested up to this date
        if (transactions.results && quantityOnDate > 0) {
          for (const tx of transactions.results) {
            const txDate = new Date(tx.transaction_date)
            if (txDate <= d && (tx.type === 'buy' || tx.type === 'trade_in')) {
              totalInvested += parseFloat(tx.total_cost || tx.quantity * tx.price_per_unit || 0)
            }
          }
        }
        
        const unrealizedPnl = totalValue - totalInvested
        
        // Create snapshot with 9 PM Mazatlán timestamp
        const mazatlan9PM = new Date(d)
        mazatlan9PM.setHours(21 + 7, 0, 0, 0) // 9 PM Mazatlán = 4 AM UTC (approximate)
        
        await c.env.DB.prepare(`
          INSERT INTO daily_snapshots (
            asset_symbol, snapshot_date, quantity, price_per_unit, 
            total_value, unrealized_pnl, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          asset.symbol,
          dateStr,
          quantityOnDate,
          historicalPrice,
          totalValue,
          unrealizedPnl,
          mazatlan9PM.toISOString()
        ).run()
        
        snapshotsCreated++
        totalSnapshotsCreated++
        
        // Small delay to avoid overwhelming the database
        if (snapshotsCreated % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
      
      results.push({
        asset: asset.symbol,
        snapshots_created: snapshotsCreated,
        has_transactions: transactions.results && transactions.results.length > 0
      })
      
      console.log(`✅ ${asset.symbol}: Created ${snapshotsCreated} snapshots`)
    }
    
    console.log(`🎉 Historical snapshots generation completed: ${totalSnapshotsCreated} created, ${totalSnapshotsSkipped} skipped`)
    
    return c.json({
      success: true,
      total_assets: allAssets.results.length,
      total_snapshots_created: totalSnapshotsCreated,
      total_snapshots_skipped: totalSnapshotsSkipped,
      date_range: `${startDate.toISOString().split('T')[0]} to ${yesterday.toISOString().split('T')[0]}`,
      results: results
    })
    
  } catch (error) {
    console.error('❌ Error generating historical snapshots:', error)
    return c.json({ 
      success: false, 
      error: 'Error generating historical snapshots',
      details: error.message 
    }, 500)
  }
})

// Helper function to generate mock daily snapshots
function generateMockDailySnapshots(symbol, currentPrice) {
  const snapshots = []
  const startDate = new Date('2025-07-21')
  const today = new Date()
  
  let basePrice = currentPrice * 0.8 // Start 20% lower than current
  const days = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24))
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    // Add some realistic price movement
    const volatility = symbol.includes('BTC') || symbol.includes('ETH') ? 0.05 : 0.02
    const change = (Math.random() - 0.5) * volatility
    basePrice = basePrice * (1 + change)
    
    // Ensure we end up close to current price
    if (i === days) {
      basePrice = currentPrice
    }
    
    snapshots.push({
      snapshot_date: date.toISOString().split('T')[0],
      price_per_unit: basePrice,
      quantity: 1, // Will be calculated based on actual holdings
      total_value: basePrice,
      unrealized_pnl: 0
    })
  }
  
  return snapshots
}

// ============================================
// WATCHLIST APIs
// ============================================

// Get user's watchlist with updated prices
app.get('/api/watchlist', async (c) => {
  try {
    // Get watchlist items
    const watchlist = await c.env.DB.prepare(`
      SELECT 
        w.*,
        a.current_price,
        a.price_updated_at,
        a.api_source,
        a.api_id,
        CASE 
          WHEN w.target_price IS NOT NULL AND a.current_price IS NOT NULL 
          THEN ((a.current_price - w.target_price) / w.target_price) * 100
          ELSE NULL 
        END as price_difference_percent
      FROM watchlist w
      LEFT JOIN assets a ON w.asset_symbol = a.symbol
      ORDER BY w.added_at DESC
    `).all()
    
    // Update prices for all watchlist items
    const updatedWatchlist = []
    
    for (const item of watchlist.results) {
      let currentPrice = item.current_price
      
      try {
        // Try to get fresh price
        if (item.category === 'crypto' && item.api_source === 'coingecko' && item.api_id) {
          // CoinGecko API for crypto
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${item.api_id}&vs_currencies=usd`,
            {
              headers: {
                'User-Agent': 'GusBit-Tracker/1.0'
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            if (data[item.api_id]?.usd) {
              currentPrice = data[item.api_id].usd
            }
          }
        } else {
          // For stocks/ETFs, use mock prices for now (or implement Alpha Vantage)
          currentPrice = Math.random() * 300 + 50
        }
        
        // Update price in database if we got a new one
        if (currentPrice && currentPrice !== item.current_price) {
          await c.env.DB.prepare(`
            UPDATE assets 
            SET current_price = ?, price_updated_at = CURRENT_TIMESTAMP
            WHERE symbol = ?
          `).bind(currentPrice, item.asset_symbol).run()
        }
        
      } catch (priceError) {
        console.error(`Error fetching price for ${item.asset_symbol}:`, priceError)
        // Keep existing price if fetch fails
      }
      
      // Calculate updated price difference
      let priceDifferencePercent = null
      if (item.target_price && currentPrice) {
        priceDifferencePercent = ((currentPrice - item.target_price) / item.target_price) * 100
      }
      
      updatedWatchlist.push({
        ...item,
        current_price: currentPrice,
        price_difference_percent: priceDifferencePercent,
        price_updated_at: new Date().toISOString()
      })
    }
    
    return c.json({ watchlist: updatedWatchlist })
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return c.json({ error: 'Error fetching watchlist' }, 500)
  }
})

// Add asset to watchlist
app.post('/api/watchlist', async (c) => {
  try {
    const { symbol, name, category, notes, target_price } = await c.req.json()
    
    if (!symbol || !name || !category) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    // Check if already in watchlist
    const existing = await c.env.DB.prepare(`
      SELECT id FROM watchlist WHERE asset_symbol = ?
    `).bind(symbol).first()
    
    if (existing) {
      return c.json({ error: 'Asset already in watchlist' }, 409)
    }
    
    // Add to watchlist
    const result = await c.env.DB.prepare(`
      INSERT INTO watchlist (asset_symbol, name, category, notes, target_price)
      VALUES (?, ?, ?, ?, ?)
    `).bind(symbol, name, category, notes || null, target_price || null).run()
    
    // Also ensure asset exists in assets table with proper API configuration
    const apiSource = category === 'crypto' ? 'coingecko' : 'alphavantage'
    let apiId = null
    
    // Set API ID for crypto assets (CoinGecko IDs)
    if (category === 'crypto') {
      const cryptoIds = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum', 
        'ADA': 'cardano',
        'DOT': 'polkadot',
        'LINK': 'chainlink',
        'SOL': 'solana',
        'MATIC': 'matic-network',
        'AVAX': 'avalanche-2',
        'UNI': 'uniswap',
        'LTC': 'litecoin'
      }
      apiId = cryptoIds[symbol] || symbol.toLowerCase()
    }
    
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO assets (symbol, name, category, api_source, api_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(symbol, name, category, apiSource, apiId).run()
    
    return c.json({ 
      success: true, 
      message: `${name} agregado al watchlist`,
      id: result.meta.last_row_id 
    })
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return c.json({ error: 'Error adding to watchlist' }, 500)
  }
})

// Remove asset from watchlist
app.delete('/api/watchlist/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol')
    
    const result = await c.env.DB.prepare(`
      DELETE FROM watchlist WHERE asset_symbol = ?
    `).bind(symbol).run()
    
    if (result.changes === 0) {
      return c.json({ error: 'Asset not found in watchlist' }, 404)
    }
    
    return c.json({ 
      success: true, 
      message: 'Asset removed from watchlist' 
    })
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    return c.json({ error: 'Error removing from watchlist' }, 500)
  }
})

// Update watchlist item (notes, target price)
app.put('/api/watchlist/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol')
    const { notes, target_price } = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      UPDATE watchlist 
      SET notes = ?, target_price = ?
      WHERE asset_symbol = ?
    `).bind(notes || null, target_price || null, symbol).run()
    
    if (result.changes === 0) {
      return c.json({ error: 'Asset not found in watchlist' }, 404)
    }
    
    return c.json({ 
      success: true, 
      message: 'Watchlist updated' 
    })
  } catch (error) {
    console.error('Error updating watchlist:', error)
    return c.json({ error: 'Error updating watchlist' }, 500)
  }
})


// ============================================
// IMPORT PAGE
// ============================================

app.get('/import', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - Importar Datos</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="min-h-screen">
    
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-12">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-4">
                                <!-- Logo GusBit -->
                                <div class="flex flex-col items-start">
                                    <div class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 3.2rem; line-height: 0.75; letter-spacing: -0.08em;">
                                        <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GB</span>
                                    </div>
                                    <div class="-mt-1">
                                        <h1 class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 1.8rem; line-height: 0.9; letter-spacing: -0.03em; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                                            GusBit
                                        </h1>
                                        <div class="text-white leading-tight" style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.6rem; letter-spacing: 0.12em; line-height: 1.1; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            TRACK STOCKS<br>
                                            ETFS &amp; CRYPTO
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-line mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-briefcase mr-2"></i>
                                Portfolio
                            </a>
                            <a href="/import" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-upload mr-2"></i>
                                Importar
                            </a>
                            <a href="/prices" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm">
                                <i class="fas fa-chart-area mr-2"></i>
                                Markets
                            </a>
                            <a href="/watchlist" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-star mr-2"></i>
                                Watchlist
                            </a>
                        </nav>
                    </div>

                    <div class="flex items-center space-x-4">
                        <button onclick="logout()" class="px-4 py-2 text-sm rounded-lg border executive-border hover:bg-slate-700 hover:bg-opacity-50 transition-all font-medium text-slate-300">
                            <i class="fas fa-sign-out-alt mr-2"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-6xl mx-auto px-8 pt-12 pb-24">
            <!-- Header -->
            <div class="text-center mb-12">
                <h1 class="text-4xl font-light executive-text-primary mb-4">
                    <i class="fas fa-upload mr-4 text-blue-400"></i>
                    Importar Datos del Portfolio
                </h1>
                <p class="text-lg executive-text-secondary">
                    Sube tu archivo Excel con el historial diario de tu portfolio
                </p>
            </div>

            <!-- Import Interface -->
            <div class="executive-card executive-border rounded-2xl p-8 executive-shadow mb-8">
                <div class="mb-8">
                    <h2 class="text-2xl font-light executive-text-primary mb-4 flex items-center">
                        <i class="fas fa-file-excel mr-3 text-green-400"></i>
                        Formato de Archivo Excel/CSV
                    </h2>
                    
                    <!-- Format Example -->
                    <div class="bg-slate-700 bg-opacity-30 rounded-xl p-6 mb-6">
                        <h3 class="text-lg font-medium executive-text-primary mb-4">Formato Requerido:</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse">
                                <thead>
                                    <tr class="border-b border-slate-600">
                                        <th class="text-left py-2 px-4 text-emerald-400 font-medium">FECHA</th>
                                        <th class="text-left py-2 px-4 text-emerald-400 font-medium">MONEDA</th>
                                        <th class="text-left py-2 px-4 text-emerald-400 font-medium">TOTAL Cantidad</th>
                                        <th class="text-left py-2 px-4 text-emerald-400 font-medium">Precio final 9 PM</th>
                                        <th class="text-left py-2 px-4 text-emerald-400 font-medium">Valor USD</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="border-b border-slate-700 border-opacity-50">
                                        <td class="py-2 px-4 executive-text-secondary">15/01/24</td>
                                        <td class="py-2 px-4 executive-text-secondary">Bitcoin</td>
                                        <td class="py-2 px-4 executive-text-secondary">0.0025</td>
                                        <td class="py-2 px-4 executive-text-secondary">42,500.00</td>
                                        <td class="py-2 px-4 executive-text-secondary">106.25</td>
                                    </tr>
                                    <tr>
                                        <td class="py-2 px-4 executive-text-secondary">15/01/24</td>
                                        <td class="py-2 px-4 executive-text-secondary">AAPL</td>
                                        <td class="py-2 px-4 executive-text-secondary">10</td>
                                        <td class="py-2 px-4 executive-text-secondary">185.50</td>
                                        <td class="py-2 px-4 executive-text-secondary">1,855.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mt-4 text-sm executive-text-secondary space-y-2">
                            <p><strong>FECHA:</strong> Formato dd/mm/aa (Ej: 15/01/24)</p>
                            <p><strong>MONEDA:</strong> Nombre o símbolo del activo (Bitcoin, AAPL, etc.)</p>
                            <p><strong>TOTAL Cantidad:</strong> Cantidad exacta del activo que posees</p>
                            <p><strong>Precio final 9 PM:</strong> Precio de cierre diario del activo</p>
                            <p><strong>Valor USD:</strong> Valor total en dólares (cantidad × precio)</p>
                        </div>
                    </div>
                </div>

                <!-- File Upload -->
                <div class="mb-8">
                    <label class="block text-lg font-medium executive-text-primary mb-4">
                        <i class="fas fa-cloud-upload-alt mr-2"></i>
                        Selecciona tu archivo Excel o CSV
                    </label>
                    
                    <div id="dropzone" class="border-2 border-dashed border-slate-500 border-opacity-50 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-slate-700 hover:bg-opacity-20 transition-all cursor-pointer">
                        <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" class="hidden" onchange="handleFileSelect(event)">
                        
                        <div id="dropzoneContent">
                            <i class="fas fa-cloud-upload-alt text-4xl text-slate-400 mb-4"></i>
                            <p class="text-lg executive-text-secondary mb-2">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                            <p class="text-sm text-slate-500">Formatos soportados: Excel (.xlsx, .xls) y CSV (.csv)</p>
                        </div>
                        
                        <div id="fileInfo" class="hidden">
                            <i class="fas fa-file-excel text-4xl text-green-400 mb-4"></i>
                            <p class="text-lg executive-text-primary font-medium" id="fileName"></p>
                            <p class="text-sm executive-text-secondary" id="fileSize"></p>
                        </div>
                    </div>
                </div>

                <!-- Preview Section -->
                <div id="previewSection" class="hidden mb-8">
                    <h3 class="text-xl font-medium executive-text-primary mb-4">
                        <i class="fas fa-eye mr-2"></i>
                        Vista Previa de Datos
                    </h3>
                    <div id="previewContainer" class="bg-slate-700 bg-opacity-30 rounded-xl p-6 overflow-x-auto">
                        <div id="previewContent"></div>
                        <div id="previewStats" class="mt-4 text-sm executive-text-secondary"></div>
                    </div>
                </div>

                <!-- Import Options -->
                <div id="importOptions" class="mb-8">
                    <h3 class="text-xl font-medium executive-text-primary mb-4">
                        <i class="fas fa-cogs mr-2"></i>
                        Opciones de Importación
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="flex items-start space-x-3">
                                <input type="checkbox" id="clearExisting" class="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500 mt-1">
                                <div>
                                    <span class="executive-text-primary font-medium">🗑️ Eliminar TODOS los datos existentes</span>
                                    <div class="text-xs text-red-400 mt-1">
                                        ⚠️ Borrará completamente: assets, transacciones, holdings, snapshots y precio histórico.<br>
                                        <strong>Recomendado para importar datos reales por primera vez.</strong>
                                    </div>
                                </div>
                            </label>
                        </div>
                        <div>
                            <label class="flex items-center space-x-3">
                                <input type="checkbox" id="skipDuplicates" checked class="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500">
                                <span class="executive-text-secondary">Saltar registros duplicados</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Import Button -->
                <div id="importActions" class="hidden text-center">
                    <button onclick="processImport()" id="importBtn" class="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all font-medium text-lg">
                        <i class="fas fa-database mr-2"></i>
                        Importar Datos al Portfolio
                    </button>
                    
                    <div id="importProgress" class="hidden mt-6">
                        <div class="w-full bg-slate-700 rounded-full h-2">
                            <div id="progressBar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        <p id="progressText" class="text-sm executive-text-secondary mt-2">Iniciando importación...</p>
                    </div>
                </div>
            </div>

            <!-- Results -->
            <div id="importResults" class="hidden executive-card executive-border rounded-2xl p-8 executive-shadow">
                <h3 class="text-xl font-medium executive-text-primary mb-4">
                    <i class="fas fa-check-circle mr-2 text-green-400"></i>
                    Resultado de la Importación
                </h3>
                <div id="resultsContent"></div>
                
                <div class="mt-6 text-center">
                    <a href="/" class="px-6 py-3 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg hover:from-green-700 hover:to-green-900 transition-all font-medium">
                        <i class="fas fa-chart-line mr-2"></i>
                        Ver Dashboard Actualizado
                    </a>
                </div>
            </div>
        </div>

        <script>
            let selectedFile = null;
            let parsedData = null;

            // Configure axios
            axios.defaults.withCredentials = true;

            // File drag and drop handlers
            const dropzone = document.getElementById('dropzone');
            const fileInput = document.getElementById('fileInput');

            dropzone.addEventListener('click', () => fileInput.click());
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-blue-400', 'bg-slate-700', 'bg-opacity-20');
            });
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('border-blue-400', 'bg-slate-700', 'bg-opacity-20');
            });
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-blue-400', 'bg-slate-700', 'bg-opacity-20');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFile(files[0]);
                }
            });

            // Handle file selection
            function handleFileSelect(event) {
                const file = event.target.files[0];
                if (file) {
                    handleFile(file);
                }
            }

            // Process selected file
            function handleFile(file) {
                selectedFile = file;
                
                // Show file info
                document.getElementById('dropzoneContent').classList.add('hidden');
                document.getElementById('fileInfo').classList.remove('hidden');
                document.getElementById('fileName').textContent = file.name;
                document.getElementById('fileSize').textContent = formatFileSize(file.size);

                // Parse file
                parseFile(file);
            }

            // Parse Excel/CSV file
            function parseFile(file) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        let data;
                        const content = e.target.result;
                        
                        if (file.name.toLowerCase().endsWith('.csv')) {
                            data = parseCSV(content);
                        } else {
                            // For Excel files, we'll need to send to backend
                            // For now, show error and suggest CSV
                            showError('Por el momento, solo se soportan archivos CSV. Por favor, guarda tu archivo Excel como CSV y vuelve a intentar.');
                            return;
                        }
                        
                        if (data && data.length > 0) {
                            parsedData = data;
                            showPreview(data);
                            document.getElementById('importOptions').classList.remove('hidden');
                            document.getElementById('importActions').classList.remove('hidden');
                        } else {
                            showError('No se pudieron encontrar datos válidos en el archivo.');
                        }
                        
                    } catch (error) {
                        console.error('Error parsing file:', error);
                        showError('Error al procesar el archivo: ' + error.message);
                    }
                };
                
                reader.readAsText(file);
            }

            // Parse CSV content
            function parseCSV(content) {
                const lines = content.trim().split('\\n');
                if (lines.length < 2) return [];
                
                // Skip header row and parse data
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const columns = parseCSVLine(line);
                    if (columns.length >= 5) {
                        try {
                            const record = {
                                fecha: columns[0],
                                moneda: columns[1],
                                cantidad: parseFloat(columns[2]) || 0,
                                precio: parseFloat(columns[3]) || 0,
                                valorUSD: parseFloat(columns[4]) || 0
                            };
                            
                            // Validate record
                            if (record.fecha && record.moneda && record.cantidad > 0 && record.precio > 0) {
                                data.push(record);
                            }
                        } catch (e) {
                            console.warn('Skipping invalid row:', line, e);
                        }
                    }
                }
                
                return data;
            }

            // Parse CSV line handling quotes and commas
            function parseCSVLine(line) {
                const result = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        result.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                
                result.push(current.trim());
                return result;
            }

            // Show data preview
            function showPreview(data) {
                const previewSection = document.getElementById('previewSection');
                const previewContent = document.getElementById('previewContent');
                const previewStats = document.getElementById('previewStats');
                
                // Show first 10 rows
                const previewRows = data.slice(0, 10);
                let html = '<table class="w-full border-collapse"><thead><tr class="border-b border-slate-600">';
                html += '<th class="text-left py-2 px-4 text-emerald-400 font-medium">FECHA</th>';
                html += '<th class="text-left py-2 px-4 text-emerald-400 font-medium">MONEDA</th>';
                html += '<th class="text-left py-2 px-4 text-emerald-400 font-medium">CANTIDAD</th>';
                html += '<th class="text-left py-2 px-4 text-emerald-400 font-medium">PRECIO</th>';
                html += '<th class="text-left py-2 px-4 text-emerald-400 font-medium">VALOR USD</th>';
                html += '</tr></thead><tbody>';
                
                previewRows.forEach(row => {
                    html += '<tr class="border-b border-slate-700 border-opacity-50">';
                    html += '<td class="py-2 px-4 executive-text-secondary">' + row.fecha + '</td>';
                    html += '<td class="py-2 px-4 executive-text-secondary">' + row.moneda + '</td>';
                    html += '<td class="py-2 px-4 executive-text-secondary">' + row.cantidad + '</td>';
                    html += '<td class="py-2 px-4 executive-text-secondary">$' + row.precio.toFixed(2) + '</td>';
                    html += '<td class="py-2 px-4 executive-text-secondary">$' + row.valorUSD.toFixed(2) + '</td>';
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
                previewContent.innerHTML = html;
                
                // Show stats
                const totalRecords = data.length;
                const uniqueAssets = [...new Set(data.map(r => r.moneda))].length;
                const dateRange = getDateRange(data);
                
                previewStats.innerHTML = '<strong>' + totalRecords + '</strong> registros encontrados | <strong>' + uniqueAssets + '</strong> activos únicos | Rango: <strong>' + dateRange + '</strong>';
                
                previewSection.classList.remove('hidden');
            }

            // Process import
            async function processImport() {
                if (!parsedData || parsedData.length === 0) {
                    showError('No hay datos para importar.');
                    return;
                }
                
                // Check if user wants to clear existing data and confirm
                const clearExisting = document.getElementById('clearExisting').checked;
                if (clearExisting) {
                    const confirmed = confirm(
                        '⚠️ CONFIRMACIÓN REQUERIDA ⚠️\\n\\n' +
                        'Estás a punto de ELIMINAR PERMANENTEMENTE todos los datos existentes:\\n\\n' +
                        '• Todos los assets\\n' +
                        '• Todas las transacciones\\n' +
                        '• Todos los holdings\\n' +
                        '• Todo el historial de precios\\n' +
                        '• Todos los snapshots diarios\\n\\n' +
                        'Esta acción NO SE PUEDE DESHACER.\\n\\n' +
                        '¿Estás seguro de que quieres continuar?'
                    );
                    
                    if (!confirmed) {
                        showError('Importación cancelada por el usuario.');
                        return;
                    }
                }
                
                const importBtn = document.getElementById('importBtn');
                const importProgress = document.getElementById('importProgress');
                const progressBar = document.getElementById('progressBar');
                const progressText = document.getElementById('progressText');
                
                try {
                    importBtn.disabled = true;
                    importBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
                    importProgress.classList.remove('hidden');
                    
                    // Prepare data for backend
                    const importData = {
                        records: parsedData,
                        options: {
                            clearExisting: document.getElementById('clearExisting').checked,
                            skipDuplicates: document.getElementById('skipDuplicates').checked
                        }
                    };
                    
                    if (clearExisting) {
                        progressText.textContent = '🗑️ Eliminando todos los datos existentes...';
                        progressBar.style.width = '10%';
                    } else {
                        progressText.textContent = 'Enviando datos al servidor...';
                        progressBar.style.width = '25%';
                    }
                    
                    // Send to backend
                    const response = await axios.post('/api/import/daily-snapshots', importData);
                    
                    progressBar.style.width = '100%';
                    progressText.textContent = 'Importación completada!';
                    
                    setTimeout(() => {
                        showResults(response.data);
                    }, 1000);
                    
                } catch (error) {
                    console.error('Import error:', error);
                    showError('Error durante la importación: ' + (error.response?.data?.error || error.message));
                    importBtn.disabled = false;
                    importBtn.innerHTML = '<i class="fas fa-database mr-2"></i>Importar Datos al Portfolio';
                    importProgress.classList.add('hidden');
                }
            }

            // Show import results
            function showResults(results) {
                const resultsSection = document.getElementById('importResults');
                const resultsContent = document.getElementById('resultsContent');
                
                let html = '<div class="space-y-4">';
                
                if (results.success) {
                    html += '<div class="flex items-center space-x-3 text-green-400"><i class="fas fa-check-circle"></i><span>¡Importación exitosa!</span></div>';
                    
                    if (results.dataCleared) {
                        html += '<div class="flex items-center space-x-3 text-orange-400 mt-2"><i class="fas fa-trash-alt"></i><span>Datos existentes eliminados completamente</span></div>';
                    }
                    
                    html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">';
                    html += '<div class="bg-green-900 bg-opacity-30 rounded-lg p-4 border border-green-500 border-opacity-30">';
                    html += '<div class="text-2xl font-bold text-green-400">' + results.imported + '</div>';
                    html += '<div class="text-sm text-green-300">Registros importados</div>';
                    html += '</div>';
                    html += '<div class="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-500 border-opacity-30">';
                    html += '<div class="text-2xl font-bold text-blue-400">' + (results.skipped || 0) + '</div>';
                    html += '<div class="text-sm text-blue-300">Registros omitidos</div>';
                    html += '</div>';
                    html += '<div class="bg-purple-900 bg-opacity-30 rounded-lg p-4 border border-purple-500 border-opacity-30">';
                    html += '<div class="text-2xl font-bold text-purple-400">' + (results.assets || 0) + '</div>';
                    html += '<div class="text-sm text-purple-300">Activos procesados</div>';
                    html += '</div>';
                    html += '</div>';
                } else {
                    html += '<div class="flex items-center space-x-3 text-red-400"><i class="fas fa-exclamation-circle"></i><span>Error en la importación</span></div>';
                    html += '<div class="text-red-300 mt-2">' + (results.error || 'Error desconocido') + '</div>';
                }
                
                html += '</div>';
                resultsContent.innerHTML = html;
                resultsSection.classList.remove('hidden');
                
                // Hide other sections
                document.querySelector('.executive-card').style.display = 'none';
            }

            // Utility functions
            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
            
            function getDateRange(data) {
                const dates = data.map(r => r.fecha).sort();
                return dates[0] + ' - ' + dates[dates.length - 1];
            }
            
            function showError(message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md';
                errorDiv.innerHTML = '<h3 class="font-bold mb-2">Error</h3><p class="text-sm">' + message + '</p><button onclick="this.parentElement.remove()" class="mt-2 text-xs bg-red-700 px-2 py-1 rounded">Cerrar</button>';
                document.body.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 8000);
            }
            
            function logout() {
                axios.post('/api/auth/logout')
                    .then(() => window.location.href = '/login')
                    .catch(() => window.location.href = '/login');
            }
        </script>
    </body>
    </html>
  `)
})

// API endpoint for processing daily snapshots import
app.post('/api/import/daily-snapshots', async (c) => {
  try {
    const { records, options } = await c.req.json()
    const { DB } = c.env
    
    console.log('Import request:', { recordCount: records.length, options })
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return c.json({ error: 'No valid records provided' }, 400)
    }

    let importedCount = 0
    let skippedCount = 0
    let assetsProcessed = new Set()

    // Clear existing data if requested
    if (options.clearExisting) {
      console.log('🗑️ CLEARING ALL EXISTING DATA...')
      
      // Clear all portfolio data tables (but keep config)
      await DB.prepare('DELETE FROM daily_snapshots').run()
      console.log('✅ Daily snapshots cleared')
      
      await DB.prepare('DELETE FROM holdings').run()
      console.log('✅ Holdings cleared')
      
      await DB.prepare('DELETE FROM transactions').run()
      console.log('✅ Transactions cleared')
      
      await DB.prepare('DELETE FROM price_history').run()
      console.log('✅ Price history cleared')
      
      await DB.prepare('DELETE FROM assets').run()
      console.log('✅ Assets cleared')
      
      console.log('🎯 ALL DEMO DATA COMPLETELY REMOVED - Ready for real data!')
    }

    // Process each record
    for (const record of records) {
      try {
        // Parse date from dd/mm/aa format to YYYY-MM-DD
        const [day, month, yearShort] = record.fecha.split('/')
        const year = '20' + yearShort // Convert 24 to 2024
        const snapshotDate = year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0')
        
        // Normalize asset symbol (handle both full names and symbols)
        let assetSymbol = record.moneda.trim().toLowerCase()
        
        // Map common asset names to symbols
        const assetMap = {
          'bitcoin': 'BTC',
          'ethereum': 'ETH',
          'apple': 'AAPL',
          'tesla': 'TSLA',
          'microsoft': 'MSFT',
          'google': 'GOOGL',
          'amazon': 'AMZN',
          'meta': 'META',
          'netflix': 'NFLX',
          'nvidia': 'NVDA'
        }
        
        assetSymbol = assetMap[assetSymbol] || record.moneda.trim().toUpperCase()
        assetsProcessed.add(assetSymbol)

        // Check for duplicates if skip option is enabled
        if (options.skipDuplicates) {
          const existing = await DB.prepare(`
            SELECT id FROM daily_snapshots 
            WHERE asset_symbol = ? AND snapshot_date = ?
          `).bind(assetSymbol, snapshotDate).first()
          
          if (existing) {
            skippedCount++
            continue
          }
        }

        // Create or update asset record first
        const assetQuery = `
          INSERT OR REPLACE INTO assets (
            symbol, name, category, current_price
          ) VALUES (?, ?, ?, ?)
        `
        
        // Determine category based on asset
        let category = 'stocks'
        if (['BTC', 'ETH', 'BITCOIN', 'ETHEREUM'].includes(assetSymbol.toUpperCase())) {
          category = 'crypto'
        }
        
        await DB.prepare(assetQuery).bind(
          assetSymbol,
          record.moneda, // Keep original name
          category,
          record.precio
        ).run()

        // Insert daily snapshot
        const snapshotQuery = `
          INSERT OR REPLACE INTO daily_snapshots (
            asset_symbol, snapshot_date, quantity, 
            price_per_unit, total_value, unrealized_pnl
          ) VALUES (?, ?, ?, ?, ?, 0)
        `
        
        await DB.prepare(snapshotQuery).bind(
          assetSymbol,
          snapshotDate,
          record.cantidad,
          record.precio,
          record.valorUSD
        ).run()
        
        importedCount++
        
      } catch (recordError) {
        console.error('Error processing record:', record, recordError)
        skippedCount++
      }
    }

    console.log('Import completed:', { 
      imported: importedCount, 
      skipped: skippedCount, 
      assets: assetsProcessed.size 
    })

    // CRITICAL: Create holdings from latest daily snapshots
    console.log('🔄 Creating holdings from imported daily snapshots...')
    
    // Get latest snapshot for each asset
    const latestSnapshots = await DB.prepare(`
      SELECT 
        asset_symbol,
        quantity,
        price_per_unit,
        total_value,
        MAX(snapshot_date) as latest_date
      FROM daily_snapshots 
      GROUP BY asset_symbol
    `).all()
    
    console.log('📊 Latest snapshots found:', latestSnapshots.results.length)
    
    // Create holdings for each asset
    for (const snapshot of latestSnapshots.results) {
      try {
        await DB.prepare(`
          INSERT OR REPLACE INTO holdings (
            asset_symbol, 
            quantity, 
            avg_purchase_price,
            total_invested,
            current_value,
            unrealized_pnl,
            last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          snapshot.asset_symbol,
          snapshot.quantity,
          snapshot.price_per_unit,
          snapshot.total_value, // Using total_value as invested
          snapshot.total_value, // Current value same as total
          0, // PnL calculation can be done later
        ).run()
        
        console.log(`✅ Holding created: ${snapshot.asset_symbol} - ${snapshot.quantity} @ $${snapshot.price_per_unit}`)
        
      } catch (holdingError) {
        console.error('❌ Error creating holding:', snapshot.asset_symbol, holdingError)
      }
    }
    
    console.log('🎉 Holdings creation completed!')

    return c.json({ 
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      assets: assetsProcessed.size,
      holdingsCreated: latestSnapshots.results.length,
      dataCleared: options.clearExisting,
      message: options.clearExisting ? 
        'All existing data cleared and new data imported successfully' : 
        'Daily snapshots imported successfully'
    })

  } catch (error) {
    console.error('Import error:', error)
    return c.json({ error: 'Failed to import daily snapshots: ' + error.message }, 500)
  }
})

// ============================================
// WALLET PAGE
// ============================================

// Asset detail page
app.get('/asset/:symbol', (c) => {
  const symbol = c.req.param('symbol')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - ${symbol} Detalles</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="min-h-screen">
        
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-12">
                        <div class="flex items-center space-x-4">
                            <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                                <i class="fas fa-chart-line text-white text-lg font-bold"></i>
                            </div>
                            <div class="flex items-center">
                                <span class="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">GusBit</span>
                            </div>
                        </div>
                        <div class="flex space-x-8">
                            <a href="/" class="text-slate-600 hover:text-blue-600 transition-colors font-medium flex items-center">
                                <i class="fas fa-home mr-2"></i>Dashboard
                            </a>
                            <a href="/wallet" class="text-slate-600 hover:text-blue-600 transition-colors font-medium flex items-center">
                                <i class="fas fa-wallet mr-2"></i>Portfolio
                            </a>
                            <span class="text-blue-600 font-medium flex items-center">
                                <i class="fas fa-chart-area mr-2"></i>${symbol} Details
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Asset Detail Content -->
        <div class="max-w-7xl mx-auto px-8 py-8">
            
            <!-- Back Button -->
            <div class="mb-6">
                <button onclick="history.back()" class="inline-flex items-center text-slate-600 hover:text-blue-600 transition-colors">
                    <i class="fas fa-chevron-left mr-2"></i>Volver al Portfolio
                </button>
            </div>

            <!-- Asset Header -->
            <div id="asset-header" class="mb-8">
                <!-- Will be populated by JavaScript -->
                <div class="animate-pulse">
                    <div class="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div class="h-12 bg-slate-200 rounded w-1/2"></div>
                </div>
            </div>

            <!-- Asset Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <!-- Current Value -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-slate-600 mb-2">Valor Actual</h3>
                            <p id="current-value" class="text-2xl font-bold text-slate-900">--</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <i class="fas fa-dollar-sign text-blue-600"></i>
                        </div>
                    </div>
                </div>

                <!-- Total Invested -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-slate-600 mb-2">Inversión Total</h3>
                            <p id="total-invested" class="text-2xl font-bold text-slate-900">--</p>
                        </div>
                        <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <i class="fas fa-piggy-bank text-purple-600"></i>
                        </div>
                    </div>
                </div>

                <!-- P&L -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-slate-600 mb-2">Ganancia/Pérdida</h3>
                            <p id="total-pnl" class="text-2xl font-bold">--</p>
                            <p id="pnl-percentage" class="text-sm mt-1">--</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <i class="fas fa-chart-trend-up text-green-600"></i>
                        </div>
                    </div>
                </div>

                <!-- Holdings -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-slate-600 mb-2">Cantidad</h3>
                            <p id="quantity-held" class="text-2xl font-bold text-slate-900">--</p>
                            <p id="current-price" class="text-sm text-slate-600 mt-1">--</p>
                        </div>
                        <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <i class="fas fa-coins text-orange-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Price Chart -->
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-slate-900">Historial de Precios</h2>
                    <div class="flex space-x-2">
                        <button onclick="changePriceTimeRange('1D')" class="px-3 py-2 text-sm font-medium rounded-lg transition-all price-range-btn text-slate-600 hover:bg-slate-100" data-range="1D">1D</button>
                        <button onclick="changePriceTimeRange('1W')" class="px-3 py-2 text-sm font-medium rounded-lg transition-all price-range-btn text-slate-600 hover:bg-slate-100" data-range="1W">1W</button>
                        <button onclick="changePriceTimeRange('1M')" class="px-3 py-2 text-sm font-medium rounded-lg transition-all price-range-btn bg-blue-600 text-white" data-range="1M">1M</button>
                        <button onclick="changePriceTimeRange('3M')" class="px-3 py-2 text-sm font-medium rounded-lg transition-all price-range-btn text-slate-600 hover:bg-slate-100" data-range="3M">3M</button>
                        <button onclick="changePriceTimeRange('1Y')" class="px-3 py-2 text-sm font-medium rounded-lg transition-all price-range-btn text-slate-600 hover:bg-slate-100" data-range="1Y">1Y</button>
                        <button onclick="changePriceTimeRange('ALL')" class="px-3 py-2 text-sm font-medium rounded-lg transition-all price-range-btn text-slate-600 hover:bg-slate-100" data-range="ALL">ALL</button>
                    </div>
                </div>
                <div class="relative h-96">
                    <canvas id="priceChart"></canvas>
                </div>
            </div>

            <!-- Daily History Table (Excel-like) -->
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-calendar-alt text-purple-600"></i>
                        <h2 class="text-lg font-semibold text-slate-800">Historial Diario desde 21 Jul 2025 (9:00 PM Mazatlán)</h2>
                    </div>
                    <div class="flex space-x-2">
                        <select class="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white">
                            <option>Todos los meses</option>
                        </select>
                        <button onclick="exportToCSV()" class="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                            <i class="fas fa-download mr-2"></i>Exportar CSV
                        </button>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <div id="daily-history-table" class="min-w-full">
                        <!-- Will be populated by JavaScript -->
                        <div class="animate-pulse">
                            <div class="h-8 bg-slate-200 rounded w-full mb-2"></div>
                            <div class="h-6 bg-slate-200 rounded w-full mb-2"></div>
                            <div class="h-6 bg-slate-200 rounded w-full mb-2"></div>
                            <div class="h-6 bg-slate-200 rounded w-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Transaction History -->
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-exchange-alt text-blue-600"></i>
                        <h2 class="text-xl font-bold text-slate-900">Historial de Transacciones</h2>
                    </div>
                    <span id="transaction-count" class="text-sm text-slate-500 font-medium">Cargando...</span>
                </div>
                
                <div id="transaction-history">
                    <!-- Will be populated by JavaScript -->
                    <div class="animate-pulse space-y-4">
                        <div class="h-4 bg-slate-200 rounded w-full"></div>
                        <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>

            <!-- Transaction Detail Modal -->
            <div id="transaction-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
                <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-bold text-slate-900">Detalles de Transacción</h3>
                        <button onclick="closeTransactionModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div id="modal-transaction-details">
                        <!-- Will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Edición de Transacción -->
        <div id="editTransactionModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
            <div class="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">Editar Transacción</h3>
                    <button onclick="closeEditModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="editTransactionForm" class="space-y-6">
                    <input type="hidden" id="editTransactionId">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora</label>
                            <input type="datetime-local" id="editTransactionDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Exchange</label>
                            <select id="editExchange" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" required>
                                <option value="">Seleccionar exchange</option>
                                <option value="Bitso">Bitso</option>
                                <option value="Binance">Binance</option>
                                <option value="Etoro">Etoro</option>
                                <option value="Lbank">Lbank</option>
                                <option value="Metamask">Metamask</option>
                                <option value="Bybit">Bybit</option>
                                <option value="Dexscreener">Dexscreener</option>
                                <option value="Ledger">Ledger</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                            <input type="number" id="editQuantity" step="0.00000001" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Precio por Unidad</label>
                            <input type="number" id="editPricePerUnit" step="0.00000001" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" required>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Total</label>
                            <input type="number" id="editTotalAmount" step="0.00000001" class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900" readonly>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                            <textarea id="editNotes" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" placeholder="Notas adicionales sobre la transacción..."></textarea>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-4 pt-6 border-t">
                        <button type="button" onclick="closeEditModal()" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                            Cancelar
                        </button>
                        <button type="submit" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            <i class="fas fa-save mr-2"></i>
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script>
            // Asset symbol from URL
            const assetSymbol = '${symbol}';
            let currentTimeRange = '1M';
            let priceChart = null;

            // Configure axios
            axios.defaults.withCredentials = true;

            // Load asset data on page load
            document.addEventListener('DOMContentLoaded', function() {
                loadAssetDetails();
                

            });
            
            // FUNCIÓN SIMPLE Y LIMPIA PARA CARGAR HISTORIAL DIARIO
            async function loadDailyHistory() {
                try {
                    console.log('📊 Cargando historial diario...');
                    
                    // Obtener datos del API
                    const response = await axios.get('/api/wallet/asset/' + assetSymbol);
                    const snapshots = response.data.daily_snapshots || [];
                    
                    if (snapshots.length === 0) {
                        document.getElementById('daily-history-table').innerHTML = '<p class="text-center text-gray-500 p-8">No hay datos de historial disponibles</p>';
                        return;
                    }
                    
                    // Ordenar por fecha descendente (más reciente primero)
                    const sortedData = snapshots.sort((a, b) => new Date(b.snapshot_date) - new Date(a.snapshot_date));
                    
                    console.log('✅ Datos ordenados:', sortedData.length, 'registros');
                    
                    // Crear tabla HTML
                    let html = '<table class="min-w-full">';
                    html += '<thead class="bg-slate-100">';
                    html += '<tr>';
                    html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">FECHA</th>';
                    html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">CANTIDAD</th>';
                    html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">PRECIO (9 PM)</th>';
                    html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">VALOR TOTAL</th>';
                    html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">PNL DIARIO</th>';
                    html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">% CAMBIO</th>';
                    html += '</tr>';
                    html += '</thead>';
                    html += '<tbody>';
                    
                    // Procesar cada fila
                    for (let i = 0; i < sortedData.length; i++) {
                        const row = sortedData[i];
                        const date = new Date(row.snapshot_date);
                        const fecha = date.toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        });
                        
                        const cantidad = parseFloat(row.quantity);
                        const precio = parseFloat(row.price_per_unit);
                        const valorHoy = parseFloat(row.total_value);
                        
                        // CALCULAR PNL DIARIO: HOY - AYER
                        let pnlTexto = '-';
                        let porcentajeTexto = '-';
                        let colorStyle = 'color: #6b7280;';
                        
                        if (i < sortedData.length - 1) {
                            const valorAyer = parseFloat(sortedData[i + 1].total_value);
                            const pnlDiario = valorHoy - valorAyer;
                            const porcentajeCambio = valorAyer > 0 ? (pnlDiario / valorAyer) * 100 : 0;
                            
                            console.log(fecha + ': $' + valorHoy.toFixed(2) + ' - $' + valorAyer.toFixed(2) + ' = $' + pnlDiario.toFixed(2));
                            
                            if (pnlDiario > 0) {
                                colorStyle = 'color: #16a34a; font-weight: bold;';
                                pnlTexto = '↑ $' + pnlDiario.toLocaleString('en-US', {minimumFractionDigits: 2});
                                porcentajeTexto = '↑ ' + porcentajeCambio.toFixed(2) + '%';
                            } else if (pnlDiario < 0) {
                                colorStyle = 'color: #dc2626; font-weight: bold;';
                                pnlTexto = '↓ $' + Math.abs(pnlDiario).toLocaleString('en-US', {minimumFractionDigits: 2});
                                porcentajeTexto = '↓ ' + Math.abs(porcentajeCambio).toFixed(2) + '%';
                            } else {
                                pnlTexto = '$0.00';
                                porcentajeTexto = '0.00%';
                            }
                        }
                        
                        const bgClass = i % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                        
                        html += '<tr class="' + bgClass + '">';
                        html += '<td class="px-4 py-3 text-sm text-slate-800">' + fecha + '</td>';
                        html += '<td class="px-4 py-3 text-sm text-slate-800">' + cantidad.toFixed(8) + '</td>';
                        html += '<td class="px-4 py-3 text-sm text-slate-900">$' + precio.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</td>';
                        html += '<td class="px-4 py-3 text-sm text-slate-900 font-semibold">$' + valorHoy.toLocaleString('en-US', {minimumFractionDigits: 2}) + '</td>';
                        html += '<td class="px-4 py-3 text-sm" style="' + colorStyle + '">' + pnlTexto + '</td>';
                        html += '<td class="px-4 py-3 text-sm" style="' + colorStyle + '">' + porcentajeTexto + '</td>';
                        html += '</tr>';
                    }
                    
                    html += '</tbody></table>';
                    
                    // Insertar tabla en el DOM
                    document.getElementById('daily-history-table').innerHTML = html;
                    console.log('🎉 Tabla de historial diario cargada correctamente');
                    
                } catch (error) {
                    console.error('❌ Error cargando historial diario:', error);
                    document.getElementById('daily-history-table').innerHTML = '<p class="text-center text-red-500 p-8">Error cargando historial diario</p>';
                }
            }

            // Load all asset details
            async function loadAssetDetails() {
                console.log('Loading details for asset:', assetSymbol);
                
                try {
                    // Load asset info
                    const response = await axios.get('/api/wallet/asset/' + assetSymbol);
                    const data = response.data;
                    
                    console.log('Asset data loaded:', data);
                    displayAssetDetails(data);
                    
                    // Load price chart
                    await loadPriceChart();
                    
                    // Load daily history table
                    await loadDailyHistory();
                    
                    // Load transaction history
                    await loadTransactionHistory();
                    
                } catch (error) {
                    console.error('Error loading asset details:', error);
                    showError('Error cargando detalles del activo');
                }
            }

            // Display asset details
            function displayAssetDetails(response) {
                const data = response.holding;
                // Update header
                document.getElementById('asset-header').innerHTML = \`
                    <div class="flex items-center space-x-4">
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-chart-line text-white text-2xl"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-slate-900">\${data.asset_symbol}</h1>
                            <p class="text-lg text-slate-600">\${data.name}</p>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
                                <i class="fas fa-tag mr-2"></i>\${data.category}
                            </span>
                        </div>
                    </div>
                \`;

                // Update stats
                document.getElementById('current-value').textContent = '$' + parseFloat(data.current_value || 0).toLocaleString('en-US', {minimumFractionDigits: 2});
                document.getElementById('total-invested').textContent = '$' + parseFloat(data.total_invested || 0).toLocaleString('en-US', {minimumFractionDigits: 2});
                
                const pnl = parseFloat(data.unrealized_pnl || 0);
                const pnlPercent = data.total_invested > 0 ? (pnl / data.total_invested * 100) : 0;
                
                document.getElementById('total-pnl').textContent = '$' + pnl.toLocaleString('en-US', {minimumFractionDigits: 2});
                document.getElementById('total-pnl').className = 'text-2xl font-bold ' + (pnl >= 0 ? 'text-green-600' : 'text-red-600');
                
                document.getElementById('pnl-percentage').textContent = (pnl >= 0 ? '+' : '') + pnlPercent.toFixed(2) + '%';
                document.getElementById('pnl-percentage').className = 'text-sm mt-1 ' + (pnl >= 0 ? 'text-green-600' : 'text-red-600');
                
                document.getElementById('quantity-held').textContent = parseFloat(data.quantity || 0).toLocaleString();
                document.getElementById('current-price').textContent = 'Precio: $' + parseFloat(data.current_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2});
            }

            // Load price chart
            async function loadPriceChart() {
                try {
                    const response = await axios.get(\`/api/price-history/\${assetSymbol}?range=\${currentTimeRange}\`);
                    const data = response.data;
                    
                    console.log('Price history loaded:', data.length, 'data points for range:', currentTimeRange);
                    displayPriceChart(data);
                    
                } catch (error) {
                    console.error('Error loading price chart:', error);
                }
            }

            // Display price chart
            function displayPriceChart(data) {
                const ctx = document.getElementById('priceChart').getContext('2d');
                
                if (priceChart) {
                    priceChart.destroy();
                }
                
                const prices = data.map(item => parseFloat(item.price));
                const labels = data.map(item => {
                    const date = new Date(item.date);
                    return date.toLocaleDateString('es-ES', {month: 'short', day: 'numeric'});
                });
                
                const isPositive = prices[prices.length - 1] >= prices[0];
                
                priceChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Precio',
                            data: prices,
                            borderColor: isPositive ? '#10b981' : '#ef4444',
                            backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                grid: {
                                    color: '#f1f5f9'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString();
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            }

            // Change price time range
            function changePriceTimeRange(range) {
                currentTimeRange = range;
                
                // Update button styles
                document.querySelectorAll('.price-range-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-600', 'text-white');
                    btn.classList.add('text-slate-600', 'hover:bg-slate-100');
                });
                
                const activeBtn = document.querySelector('[data-range="' + range + '"]');
                activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
                activeBtn.classList.add('bg-blue-600', 'text-white');
                
                // Reload chart
                loadPriceChart();
            }

            // Load transaction history
            async function loadTransactionHistory() {
                try {
                    // Get transactions from the main asset API response or dedicated endpoint
                    const response = await axios.get(\`/api/wallet/asset/\${assetSymbol}\`);
                    const data = response.data.transactions || [];
                    
                    console.log('Transaction history loaded:', data);
                    displayTransactionHistory(data);
                    
                } catch (error) {
                    console.error('Error loading transaction history:', error);
                    document.getElementById('transaction-history').innerHTML = '<p class="text-slate-500 text-center py-8">No se pudieron cargar las transacciones</p>';
                }
            }

            // Display transaction history
            function displayTransactionHistory(transactions) {
                const container = document.getElementById('transaction-history');
                const countElement = document.getElementById('transaction-count');
                
                if (!transactions || transactions.length === 0) {
                    container.innerHTML = '<p class="text-slate-500 text-center py-8">No hay transacciones para este activo</p>';
                    countElement.textContent = '0 transacciones';
                    return;
                }
                
                countElement.textContent = \`\${transactions.length} transacciones\`;
                
                let html = '<div class="space-y-3">';
                
                transactions.forEach(tx => {
                    const date = new Date(tx.transaction_date);
                    const formattedDate = date.toLocaleDateString('es-ES', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    
                    const formattedTime = date.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const typeClass = tx.type === 'buy' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200';
                    const typeIcon = tx.type === 'buy' ? 'fa-plus-circle' : 'fa-minus-circle';
                    const typeText = tx.type === 'buy' ? 'Compra' : 'Venta';
                    
                    const quantity = parseFloat(tx.quantity);
                    const pricePerUnit = parseFloat(tx.price_per_unit);
                    const totalAmount = parseFloat(tx.total_amount);
                    const fees = parseFloat(tx.fees || 0);
                    
                    html += \`
                        <div class="transaction-item p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:bg-opacity-30 transition-all duration-200">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <div class="w-12 h-12 rounded-full flex items-center justify-center border-2 \${typeClass}">
                                        <i class="fas \${typeIcon} text-lg"></i>
                                    </div>
                                    <div>
                                        <div class="flex items-center space-x-3">
                                            <p class="font-bold text-slate-900">\${typeText}</p>
                                            <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">\${tx.exchange}</span>
                                        </div>
                                        <div class="flex items-center space-x-4 mt-1">
                                            <p class="text-sm text-slate-600">\${formattedDate} • \${formattedTime}</p>
                                            <p class="text-sm text-slate-600">\${quantity.toFixed(8)} unidades</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-slate-900 text-lg">$\${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                    <p class="text-sm text-slate-600">$\${pricePerUnit.toLocaleString('en-US', {minimumFractionDigits: 2})} por unidad</p>
                                    \${fees > 0 ? \`<p class="text-xs text-slate-500 mt-1">Comisión: $\${fees.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>\` : ''}
                                </div>
                            </div>
                            <div class="flex items-center justify-between mt-3">
                                <div class="flex space-x-3">
                                    <button onclick="event.stopPropagation(); editTransaction(\${tx.id})" class="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded-md border border-blue-300 hover:bg-blue-50 transition-colors" title="Editar transacción">
                                        <i class="fas fa-edit mr-1"></i>Editar
                                    </button>
                                    <button onclick="event.stopPropagation(); deleteTransaction(\${tx.id})" class="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded-md border border-red-300 hover:bg-red-50 transition-colors" title="Eliminar transacción">
                                        <i class="fas fa-trash mr-1"></i>Borrar
                                    </button>
                                </div>
                                <div class="text-blue-600" onclick="showTransactionDetails(\${tx.id})">
                                    <i class="fas fa-chevron-right text-sm"></i>
                                </div>
                            </div>
                        </div>
                    \`;
                });
                
                html += '</div>';
                container.innerHTML = html;
            }

            // Show transaction details modal
            function showTransactionDetails(transactionId) {
                // Find transaction in current data
                const response = dailyHistoryResponse; // We'll need to store this
                const transactions = response.transactions || [];
                const transaction = transactions.find(tx => tx.id === transactionId);
                
                if (!transaction) {
                    showError('No se encontraron detalles de la transacción');
                    return;
                }
                
                const date = new Date(transaction.transaction_date);
                const formattedDate = date.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                const formattedTime = date.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                
                const typeClass = transaction.type === 'buy' ? 'text-green-600' : 'text-red-600';
                const typeText = transaction.type === 'buy' ? 'Compra' : 'Venta';
                
                const quantity = parseFloat(transaction.quantity);
                const pricePerUnit = parseFloat(transaction.price_per_unit);
                const totalAmount = parseFloat(transaction.total_amount);
                const fees = parseFloat(transaction.fees || 0);
                
                const modalContent = \`
                    <div class="space-y-6">
                        <!-- Transaction Type -->
                        <div class="text-center">
                            <div class="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center \${transaction.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                                <i class="fas \${transaction.type === 'buy' ? 'fa-plus-circle' : 'fa-minus-circle'} text-2xl"></i>
                            </div>
                            <h4 class="text-xl font-bold \${typeClass}">\${typeText} de \${assetSymbol}</h4>
                        </div>
                        
                        <!-- Transaction Details -->
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-slate-600 font-medium mb-1">Fecha y Hora</p>
                                <p class="font-semibold">\${formattedDate}</p>
                                <p class="text-slate-700">\${formattedTime}</p>
                            </div>
                            
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-slate-600 font-medium mb-1">Exchange</p>
                                <p class="font-semibold text-blue-600">\${transaction.exchange}</p>
                            </div>
                            
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-slate-600 font-medium mb-1">Cantidad</p>
                                <p class="font-semibold">\${quantity.toFixed(8)} unidades</p>
                            </div>
                            
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-slate-600 font-medium mb-1">Precio por Unidad</p>
                                <p class="font-semibold">$\${pricePerUnit.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </div>
                            
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-slate-600 font-medium mb-1">Total \${transaction.type === 'buy' ? 'Pagado' : 'Recibido'}</p>
                                <p class="font-bold text-lg \${typeClass}">$\${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </div>
                            
                            <div class="bg-slate-50 p-3 rounded-lg">
                                <p class="text-slate-600 font-medium mb-1">Comisiones</p>
                                <p class="font-semibold">\${fees > 0 ? '$' + fees.toLocaleString('en-US', {minimumFractionDigits: 2}) : 'Sin comisión'}</p>
                            </div>
                        </div>
                        
                        \${transaction.notes ? \`
                            <div class="bg-blue-50 p-3 rounded-lg">
                                <p class="text-blue-800 font-medium mb-1">Notas</p>
                                <p class="text-blue-700">\${transaction.notes}</p>
                            </div>
                        \` : ''}
                        
                        <!-- Action Buttons -->
                        <div class="flex space-x-3">
                            <button onclick="closeTransactionModal()" class="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">
                                Cerrar
                            </button>
                            <button onclick="exportTransaction(\${transaction.id})" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <i class="fas fa-download mr-2"></i>Exportar
                            </button>
                        </div>
                    </div>
                \`;
                
                document.getElementById('modal-transaction-details').innerHTML = modalContent;
                document.getElementById('transaction-modal').classList.remove('hidden');
            }

            // Make function globally accessible
            window.showTransactionDetails = showTransactionDetails;

            // Close transaction modal
            function closeTransactionModal() {
                document.getElementById('transaction-modal').classList.add('hidden');
            }

            // Export single transaction
            function exportTransaction(transactionId) {
                const response = dailyHistoryResponse;
                const transactions = response.transactions || [];
                const transaction = transactions.find(tx => tx.id === transactionId);
                
                if (!transaction) return;
                
                const csvContent = [
                    'ID,Tipo,Asset,Fecha,Exchange,Cantidad,Precio por Unidad,Total,Comisiones,Notas',
                    [
                        transaction.id,
                        transaction.type,
                        transaction.asset_symbol,
                        transaction.transaction_date,
                        transaction.exchange,
                        transaction.quantity,
                        transaction.price_per_unit,
                        transaction.total_amount,
                        transaction.fees || 0,
                        transaction.notes || ''
                    ].join(',')
                ].join('\\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', \`transaction_\${transaction.id}_\${new Date().toISOString().split('T')[0]}.csv\`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                closeTransactionModal();
                showError('Transacción exportada exitosamente');
            }

            // Make function globally accessible
            window.exportTransaction = exportTransaction;

            // Global variables for history table
            let dailyHistoryData = [];
            let showAllHistory = true; // Show all by default

            // Load daily history
            async function loadDailyHistory() {
                try {
                    console.log('🔥 FUNCIÓN COMPLETAMENTE NUEVA - DESDE CERO');
                    
                    // Obtener datos frescos
                    const response = await axios.get(\`/api/wallet/asset/\${assetSymbol}?_=\${Date.now()}\`);
                    const snapshots = response.data.daily_snapshots || [];
                    
                    console.log('📊 Datos brutos recibidos:', snapshots.length);
                    
                    // Ordenar por fecha descendente (más reciente primero)
                    const sortedData = snapshots.sort((a, b) => new Date(b.snapshot_date) - new Date(a.snapshot_date));
                    
                    console.log('📋 Primeros 5 datos ordenados:');
                    sortedData.slice(0, 5).forEach((item, i) => {
                        console.log(\`  \${i}: \${item.snapshot_date} = $\${parseFloat(item.total_value).toFixed(2)}\`);
                    });
                    
                    // CREAR TABLA COMPLETAMENTE NUEVA
                    createNewTable(sortedData);
                    
                } catch (error) {
                    console.error('❌ Error:', error);
                }
            }
            
            // FUNCIÓN COMPLETAMENTE NUEVA PARA CREAR LA TABLA
            function createNewTable(data) {
                console.log('🛠️ CREANDO TABLA COMPLETAMENTE NUEVA');
                
                const container = document.getElementById('daily-history-table');
                if (!container) {
                    console.error('❌ No se encontró el container');
                    return;
                }
                
                let html = '<table class="min-w-full">';
                html += '<thead class="bg-slate-100 border-b border-slate-200">';
                html += '<tr>';
                html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">FECHA</th>';
                html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">CANTIDAD</th>';
                html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">PRECIO (9 PM)</th>';
                html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">VALOR TOTAL</th>';
                html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">PNL DIARIO</th>';
                html += '<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">% CAMBIO</th>';
                html += '</tr>';
                html += '</thead>';
                html += '<tbody class="bg-white">';
                
                // PROCESAR CADA FILA CON CÁLCULO CORRECTO
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    const date = new Date(row.snapshot_date);
                    const fecha = date.toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                    });
                    
                    const cantidad = parseFloat(row.quantity);
                    const precio = parseFloat(row.price_per_unit);
                    const valorHoy = parseFloat(row.total_value);
                    
                    // CÁLCULO DEL CAMBIO DIARIO
                    let pnlDiario = 0;
                    let porcentajeCambio = 0;
                    let pnlColor = '#6b7280';
                    let pnlTexto = '-';
                    let porcentajeTexto = '-';
                    
                    if (i < data.length - 1) {
                        const valorAyer = parseFloat(data[i + 1].total_value);
                        pnlDiario = valorHoy - valorAyer;
                        porcentajeCambio = valorAyer > 0 ? (pnlDiario / valorAyer) * 100 : 0;
                        
                        console.log(\`🧮 \${fecha}: $\${valorHoy.toFixed(2)} - $\${valorAyer.toFixed(2)} = $\${pnlDiario.toFixed(2)} (\${porcentajeCambio.toFixed(2)}%)\`);
                        
                        if (pnlDiario > 0) {
                            pnlColor = '#16a34a';
                            pnlTexto = '↑ $' + pnlDiario.toLocaleString('en-US', {minimumFractionDigits: 2});
                            porcentajeTexto = '↑ ' + porcentajeCambio.toFixed(2) + '%';
                        } else if (pnlDiario < 0) {
                            pnlColor = '#dc2626';
                            pnlTexto = '↓ $' + Math.abs(pnlDiario).toLocaleString('en-US', {minimumFractionDigits: 2});
                            porcentajeTexto = '↓ ' + Math.abs(porcentajeCambio).toFixed(2) + '%';
                        } else {
                            pnlTexto = '$0.00';
                            porcentajeTexto = '0.00%';
                        }
                    }
                    
                    const rowClass = i % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                    
                    html += '<tr class="' + rowClass + ' border-b border-slate-100">';
                    html += '<td class="px-4 py-3 text-sm text-slate-800">' + fecha + '</td>';
                    html += '<td class="px-4 py-3 text-sm text-slate-800">' + cantidad.toFixed(8) + '</td>';
                    html += '<td class="px-4 py-3 text-sm text-slate-900">$' + precio.toLocaleString('en-US', {minimumFractionDigits: 3}) + '</td>';
                    html += '<td class="px-4 py-3 text-sm text-slate-900 font-semibold">$' + valorHoy.toLocaleString('en-US', {minimumFractionDigits: 3}) + '</td>';
                    html += '<td class="px-4 py-3 text-sm font-bold" style="color: ' + pnlColor + ';">' + pnlTexto + '</td>';
                    html += '<td class="px-4 py-3 text-sm font-bold" style="color: ' + pnlColor + ';">' + porcentajeTexto + '</td>';
                    html += '</tr>';
                }
                
                html += '</tbody></table>';
                
                console.log('✅ INSERTANDO NUEVA TABLA');
                container.innerHTML = html;
                console.log('🎉 TABLA NUEVA COMPLETADA');
            }





            // Export to CSV
            function exportToCSV() {
                if (!dailyHistoryData || dailyHistoryData.length === 0) {
                    showError('No hay datos para exportar');
                    return;
                }
                
                // Create CSV content
                const headers = ['Fecha', 'Cantidad', 'Precio Unitario', 'Valor Total', 'P&L No Realizado'];
                let csvContent = headers.join(',') + '\\n';
                
                dailyHistoryData.forEach(record => {
                    const row = [
                        record.snapshot_date,
                        record.quantity,
                        record.price_per_unit,
                        record.total_value,
                        record.unrealized_pnl
                    ];
                    csvContent += row.join(',') + '\\n';
                });
                
                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', \`\${assetSymbol}_historial_\${new Date().toISOString().split('T')[0]}.csv\`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showError('Archivo CSV descargado exitosamente');
            }

            // Show success/error message
            function showError(message) {
                const isSuccess = message.includes('exitosamente') || message.includes('descargado');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'fixed top-4 right-4 ' + (isSuccess ? 'bg-green-600' : 'bg-red-600') + ' text-white px-4 py-2 rounded-lg shadow-lg z-50';
                errorDiv.textContent = message;
                document.body.appendChild(errorDiv);
                
                setTimeout(() => {
                    errorDiv.remove();
                }, 3000);
            }

            // Edit transaction functions for asset detail page
            async function editTransaction(id) {
                try {
                    // Get transaction data
                    const response = await axios.get('/api/transactions/' + id);
                    const transaction = response.data;
                    
                    // Populate modal fields
                    document.getElementById('editTransactionId').value = transaction.id;
                    document.getElementById('editTransactionDate').value = new Date(transaction.transaction_date).toISOString().slice(0, 16);
                    document.getElementById('editExchange').value = transaction.exchange;
                    document.getElementById('editQuantity').value = transaction.quantity;
                    document.getElementById('editPricePerUnit').value = transaction.price_per_unit;
                    document.getElementById('editTotalAmount').value = transaction.total_amount;
                    document.getElementById('editNotes').value = transaction.notes || '';
                    
                    // Setup auto-calculation for edit form
                    document.getElementById('editQuantity').addEventListener('input', calculateEditTotal);
                    document.getElementById('editPricePerUnit').addEventListener('input', calculateEditTotal);
                    
                    // Show modal
                    document.getElementById('editTransactionModal').classList.remove('hidden');
                    
                } catch (error) {
                    console.error('Error loading transaction:', error);
                    showError('Error cargando datos de la transacción');
                }
            }

            function calculateEditTotal() {
                const quantity = parseFloat(document.getElementById('editQuantity').value) || 0;
                const price = parseFloat(document.getElementById('editPricePerUnit').value) || 0;
                const total = quantity * price;
                document.getElementById('editTotalAmount').value = total.toFixed(8);
            }

            function closeEditModal() {
                document.getElementById('editTransactionModal').classList.add('hidden');
                document.getElementById('editTransactionForm').reset();
            }

            // Delete transaction function
            async function deleteTransaction(id) {
                if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
                
                try {
                    const response = await axios.delete('/api/transactions/' + id);
                    
                    if (response.data.success) {
                        showError('Transacción eliminada exitosamente');
                        // Reload transaction history and asset details
                        loadTransactionHistory();
                        loadAssetDetails();
                    } else {
                        showError('Error eliminando transacción');
                    }
                } catch (error) {
                    console.error('Error deleting transaction:', error);
                    showError('Error eliminando transacción');
                }
            }

            // Handle edit form submission
            document.addEventListener('DOMContentLoaded', function() {
                if (document.getElementById('editTransactionForm')) {
                    document.getElementById('editTransactionForm').addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const id = document.getElementById('editTransactionId').value;
                        const formData = {
                            transaction_date: document.getElementById('editTransactionDate').value,
                            exchange: document.getElementById('editExchange').value,
                            quantity: parseFloat(document.getElementById('editQuantity').value),
                            price_per_unit: parseFloat(document.getElementById('editPricePerUnit').value),
                            total_amount: parseFloat(document.getElementById('editTotalAmount').value),
                            notes: document.getElementById('editNotes').value
                        };
                        
                        try {
                            const response = await axios.put('/api/transactions/' + id, formData);
                            
                            if (response.data.success) {
                                showError('Transacción actualizada exitosamente');
                                closeEditModal();
                                // Reload transaction history and asset details
                                loadTransactionHistory();
                                loadAssetDetails();
                            } else {
                                showError('Error: ' + response.data.error);
                            }
                        } catch (error) {
                            console.error('Error updating transaction:', error);
                            showError('Error actualizando la transacción');
                        }
                    });
                }
            });
        </script>
    </body>
    </html>
  `)
})

app.get('/wallet', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - Portfolio</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="min-h-screen">
        
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-12">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-4">
                                <!-- Logo GusBit con tipografía y spacing optimizados -->
                                <div class="flex flex-col items-start">
                                    <!-- GB con formas exactas y spacing perfecto -->
                                    <div class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 3.2rem; line-height: 0.75; letter-spacing: -0.08em;">
                                        <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GB</span>
                                    </div>
                                    
                                    <!-- GusBit con el mismo estilo tipográfico -->
                                    <div class="-mt-1">
                                        <h1 class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 1.8rem; line-height: 0.9; letter-spacing: -0.03em; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                                            GusBit
                                        </h1>
                                        
                                        <!-- Tagline con spacing perfecto -->
                                        <div class="text-white leading-tight" style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.6rem; letter-spacing: 0.12em; line-height: 1.1; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            TRACK STOCKS<br>
                                            ETFS &amp; CRYPTO
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-line mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm">
                                <i class="fas fa-briefcase mr-2"></i>
                                Portfolio
                            </a>
                            <a href="/import" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-upload mr-2"></i>
                                Importar
                            </a>
                            <a href="/prices" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-area mr-2"></i>
                                Markets
                            </a>
                            <a href="/watchlist" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-star mr-2"></i>
                                Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 transition-all font-medium text-sm">
                        <i class="fas fa-power-off mr-2"></i>
                        Salir
                    </button>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto">
        
        <!-- Main Content -->
        <div class="px-8 py-12">
            <!-- Executive Header -->
            <div class="flex justify-between items-start mb-12">
                <div>
                    <h1 class="text-5xl font-light text-white mb-3 tracking-tight drop-shadow-lg">Portfolio Executive</h1>
                    <p class="executive-text-secondary font-medium text-lg">Gestión avanzada de inversiones</p>
                    <div class="w-20 h-1 bg-blue-500 mt-4 rounded-full shadow-lg"></div>
                </div>
                <a href="/transactions" class="executive-bg-blue text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center executive-shadow font-medium">
                    <i class="fas fa-plus mr-3"></i>
                    Nueva Transacción
                </a>
            </div>
                                <i class="fas fa-star mr-2"></i>Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="text-white hover:text-red-300 transition-colors duration-200 flex items-center space-x-2 font-medium">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-8">
            <!-- Header -->
            <div class="text-center mb-12">
                <h1 class="text-4xl font-bold text-white mb-4" style="font-family: 'Times New Roman', serif;">
                    Mi Wallet
                </h1>
                <p class="text-blue-200 text-lg">Gestiona tu portafolio de inversiones</p>
            </div>

            <!-- Holdings Cards -->
            <div id="holdingsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Holdings will be populated here -->
            </div>

            <!-- Loading State -->
            <div id="loadingState" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-3xl text-blue-300 mb-4"></i>
                <p class="text-blue-200">Cargando tu portafolio...</p>
            </div>

            <!-- Empty State -->
            <div id="emptyState" class="hidden text-center py-12">
                <i class="fas fa-wallet text-6xl text-blue-300 mb-6"></i>
                <h3 class="text-2xl font-bold text-white mb-4">Tu wallet está vacía</h3>
                <p class="text-blue-200 mb-6">Comienza agregando transacciones para ver tu portafolio</p>
                <a href="/transactions" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center">
                    <i class="fas fa-plus mr-2"></i>
                    Agregar Transacción
                </a>
            </div>
        </div>

        <script>
            // Load wallet data
            document.addEventListener('DOMContentLoaded', function() {
                loadHoldings();
                
                // Check if we came from a specific asset link
                checkAssetHighlight();
            });
            
            // Check for asset parameter and highlight if needed
            function checkAssetHighlight() {
                const urlParams = new URLSearchParams(window.location.search);
                const assetSymbol = urlParams.get('asset');
                
                if (assetSymbol) {
                    console.log('Highlighting asset from URL parameter:', assetSymbol);
                    // Wait for holdings to load, then highlight
                    setTimeout(() => {
                        highlightAssetInWallet(assetSymbol);
                        
                        // Clean up URL (remove asset parameter)
                        const cleanUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }, 1000);
                }
            }
            
            // Highlight specific asset (same function as in dashboard)
            function highlightAssetInWallet(symbol) {
                const assetElements = document.querySelectorAll('[data-symbol]');
                assetElements.forEach(element => {
                    const elementSymbol = element.getAttribute('data-symbol');
                    if (elementSymbol === symbol) {
                        // Add highlight effect
                        element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        element.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                        element.style.borderRadius = '8px';
                        element.style.transition = 'all 0.3s ease';
                        
                        // Remove highlight after 4 seconds
                        setTimeout(() => {
                            element.style.backgroundColor = '';
                            element.style.border = '';
                            element.style.borderRadius = '';
                        }, 4000);
                        
                        // Scroll element into view
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }

            async function loadHoldings() {
                try {
                    const response = await axios.get('/api/wallet/holdings');
                    const holdings = response.data.holdings || [];
                    
                    document.getElementById('loadingState').classList.add('hidden');
                    
                    if (holdings.length === 0) {
                        document.getElementById('emptyState').classList.remove('hidden');
                    } else {
                        displayHoldings(holdings);
                    }
                } catch (error) {
                    console.error('Error loading holdings:', error);
                    document.getElementById('loadingState').innerHTML = 
                        '<div class="text-center"><i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i><p class="text-red-400">Error cargando portafolio</p></div>';
                }
            }

            function displayHoldings(holdings) {
                const container = document.getElementById('holdingsContainer');
                let html = '';

                holdings.forEach(holding => {
                    const totalValue = holding.quantity * holding.current_price;
                    const totalCost = holding.total_cost || 0;
                    const pnl = totalValue - totalCost;
                    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
                    
                    const pnlColor = pnl >= 0 ? 'text-green-400' : 'text-red-400';
                    const pnlIcon = pnl >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

                    // Escape quotes for safe HTML insertion
                    const safeSymbol = holding.asset_symbol.replace(/'/g, '&quot;');
                    
                    html += 
                        '<div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20" data-symbol="' + holding.asset_symbol + '">' +
                            '<div class="flex justify-between items-start mb-4">' +
                                '<div>' +
                                    '<h3 class="text-xl font-bold text-white">' + holding.asset_symbol + '</h3>' +
                                    '<p class="text-blue-200 text-sm">' + holding.name + '</p>' +
                                '</div>' +
                                '<span class="bg-blue-500 bg-opacity-50 text-blue-100 px-2 py-1 rounded text-xs">' +
                                    holding.category.toUpperCase() +
                                '</span>' +
                            '</div>' +
                            '<div class="space-y-3">' +
                                '<div class="flex justify-between">' +
                                    '<span class="text-blue-200">Cantidad:</span>' +
                                    '<span class="text-white font-medium">' + holding.quantity.toFixed(6) + '</span>' +
                                '</div>' +
                                '<div class="flex justify-between">' +
                                    '<span class="text-blue-200">Precio:</span>' +
                                    '<span class="text-white font-medium">$' + holding.current_price.toFixed(2) + '</span>' +
                                '</div>' +
                                '<div class="flex justify-between">' +
                                    '<span class="text-blue-200">Valor Total:</span>' +
                                    '<span class="text-white font-bold">$' + totalValue.toFixed(2) + '</span>' +
                                '</div>' +
                                '<div class="flex justify-between">' +
                                    '<span class="text-blue-200">P&L:</span>' +
                                    '<span class="' + pnlColor + ' font-bold">' +
                                        '<i class="fas ' + pnlIcon + ' mr-1"></i>' +
                                        '$' + Math.abs(pnl).toFixed(2) + ' (' + pnlPercent.toFixed(2) + '%)' +
                                    '</span>' +
                                '</div>' +
                            '</div>' +
                            '<div class="mt-4 pt-4 border-t border-white border-opacity-20">' +
                                '<button onclick="viewAsset(&quot;' + safeSymbol + '&quot;)" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">' +
                                    '<i class="fas fa-chart-line mr-2"></i>Ver Detalles' +
                                '</button>' +
                            '</div>' +
                        '</div>';
                });

                container.innerHTML = html;
            }

            function viewAsset(symbol) {
                window.location.href = '/asset/' + encodeURIComponent(symbol);
            }

            async function logout() {
                try {
                    await axios.post('/api/auth/logout');
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Error during logout:', error);
                    window.location.href = '/login';
                }
            }
        </script>
    </body>
    </html>
  `)
})

// ============================================
// Note: Duplicate /asset/:symbol route was removed to prevent conflicts

// ============================================
// DEBUG ENDPOINT FOR SNAPSHOTS
// ============================================

app.get('/debug/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol')
    
    // Get daily snapshots
    const dailySnapshots = await c.env.DB.prepare(`
      SELECT * FROM daily_snapshots 
      WHERE asset_symbol = ? AND snapshot_date >= '2025-07-21'
      ORDER BY snapshot_date ASC
    `).bind(symbol).all()
    
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head><title>Debug ${symbol}</title></head>
      <body>
        <h1>Debug ${symbol} Snapshots</h1>
        <p>Total snapshots: ${dailySnapshots.results.length}</p>
        <h2>Last 10 snapshots:</h2>
        <ul>
          ${dailySnapshots.results.slice(-10).map(s => 
            `<li>${s.snapshot_date} - $${s.price_per_unit}</li>`
          ).join('')}
        </ul>
        <h2>Raw API Response:</h2>
        <pre>${JSON.stringify(dailySnapshots.results.slice(-10), null, 2)}</pre>
      </body>
      </html>
    `)
  } catch (error) {
    return c.html(`<h1>Error: ${error.message}</h1>`)
  }
})

// ============================================
// INDIVIDUAL ASSET PAGE
// ============================================

app.get('/asset/:symbol', (c) => {
  const symbol = c.req.param('symbol')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - ${symbol}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-slate-700 bg-opacity-50 min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-6 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-8">
                        <h1 class="text-2xl font-bold text-blue-600">
                            <i class="fas fa-chart-line mr-2"></i>
                            GusBit
                        </h1>
                        <nav class="flex space-x-6">
                            <a href="/" class="executive-text-primary hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                            </a>
                            <a href="/transactions" class="executive-text-primary hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-exchange-alt mr-1"></i>Transacciones
                            </a>
                            <a href="/wallet" class="executive-text-primary hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-wallet mr-1"></i>Wallet
                            </a>
                            <a href="/prices" class="executive-text-primary hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-search-dollar mr-1"></i>Precios en Vivo
                            </a>
                            <a href="/watchlist" class="executive-text-primary hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-star mr-1"></i>Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="executive-text-primary hover:text-red-600">
                        <i class="fas fa-sign-out-alt mr-1"></i>Salir
                    </button>
                </div>
            </div>
        </nav>

        <!-- Loading State -->
        <div id="loadingState" class="max-w-7xl mx-auto px-6 py-16">
            <div class="flex items-center justify-center">
                <i class="fas fa-spinner fa-spin text-blue-600 text-3xl mr-4"></i>
                <span class="executive-text-primary text-xl">Cargando información de ${symbol}...</span>
            </div>
        </div>

        <!-- Main Content -->
        <div id="mainContent" class="hidden max-w-7xl mx-auto px-6 py-8">
            <!-- Header -->
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center">
                    <a href="/wallet" class="text-gray-500 hover:text-blue-600 mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </a>
                    <div>
                        <h2 class="text-4xl font-bold text-gray-800" id="assetSymbol">${symbol}</h2>
                        <p class="executive-text-primary text-lg" id="assetName">Cargando...</p>
                        <span id="assetCategory" class="inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full"></span>
                    </div>
                </div>
                <div class="flex space-x-3">
                    <button onclick="generateSnapshots()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-history mr-2"></i>
                        Generar Historial
                    </button>
                    <a href="/transactions" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>
                        Nueva Transacción
                    </a>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm executive-text-primary">Cantidad Total</p>
                            <p id="totalQuantity" class="text-2xl font-bold text-gray-800">0</p>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-full">
                            <i class="fas fa-coins text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm executive-text-primary">Precio Actual</p>
                            <p id="currentPrice" class="text-2xl font-bold text-gray-800">$0.00</p>
                        </div>
                        <div class="bg-green-100 p-3 rounded-full">
                            <i class="fas fa-dollar-sign text-green-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm executive-text-primary">Valor Total</p>
                            <p id="totalValue" class="text-2xl font-bold text-gray-800">$0.00</p>
                        </div>
                        <div class="bg-purple-100 p-3 rounded-full">
                            <i class="fas fa-chart-bar text-purple-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm executive-text-primary">PnL Total</p>
                            <p id="totalPnL" class="text-2xl font-bold">$0.00</p>
                        </div>
                        <div id="pnlIcon" class="bg-gray-100 p-3 rounded-full">
                            <i class="fas fa-balance-scale executive-text-primary"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Price Chart -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-800">
                            <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                            Precio vs Tiempo
                        </h3>
                        <div class="flex space-x-2">
                            <button onclick="changePriceRange('7d')" class="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">7D</button>
                            <button onclick="changePriceRange('30d')" class="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">30D</button>
                            <button onclick="changePriceRange('90d')" class="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded">90D</button>
                        </div>
                    </div>
                    <div class="h-80">
                        <canvas id="priceChart"></canvas>
                    </div>
                </div>

                <!-- Value Chart -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-800">
                            <i class="fas fa-chart-area mr-2 text-green-600"></i>
                            Valor en USD vs Tiempo
                        </h3>
                        <div class="flex space-x-2">
                            <button onclick="changeValueRange('7d')" class="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">7D</button>
                            <button onclick="changeValueRange('30d')" class="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">30D</button>
                            <button onclick="changeValueRange('90d')" class="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded">90D</button>
                        </div>
                    </div>
                    <div class="h-80">
                        <canvas id="valueChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Daily History Table -->
            <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-semibold text-gray-800">
                        <i class="fas fa-calendar-alt mr-2 text-purple-600"></i>
                        Historial Diario desde 21 Jul 2025 (9:00 PM Mazatlán)
                    </h3>
                    <div class="flex items-center space-x-4">
                        <select id="monthFilter" class="px-4 py-3 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all">
                            <option value="" selected>Todos los meses</option>
                            <option value="2025-07">Julio 2025</option>
                            <option value="2025-08">Agosto 2025</option>
                            <option value="2025-09">Septiembre 2025</option>
                        </select>
                        <button onclick="exportToCSV()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-download mr-2"></i>
                            Exportar CSV
                        </button>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200" id="dailyHistoryTable">
                        <thead class="bg-slate-700 bg-opacity-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio (9 PM)</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PnL</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Cambio</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200" id="dailyHistoryBody">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Current Price & Closing Price -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm executive-text-primary">Precio Actual (Tiempo Real)</p>
                            <p id="livePrice" class="text-3xl font-bold text-green-600">$0.00</p>
                            <p class="text-sm text-gray-500 mt-1" id="lastUpdate">Última actualización: --</p>
                        </div>
                        <div class="bg-green-100 p-4 rounded-full">
                            <i class="fas fa-chart-line text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm executive-text-primary">Precio de Cierre (9:00 PM)</p>
                            <p id="closingPrice" class="text-3xl font-bold text-blue-600">$0.00</p>
                            <p class="text-sm text-gray-500 mt-1" id="closingDate">Último cierre: --</p>
                        </div>
                        <div class="bg-blue-100 p-4 rounded-full">
                            <i class="fas fa-moon text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Transactions -->
            <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-semibold text-gray-800">
                        <i class="fas fa-history mr-2 text-blue-600"></i>
                        Últimas Transacciones (Recientes)
                    </h3>
                    <div class="flex space-x-3">
                        <button onclick="refreshTransactions()" class="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
                            <i class="fas fa-refresh mr-2"></i>Actualizar
                        </button>
                        <button onclick="viewAllAssetTransactions()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-list mr-2"></i>Ver Todas las Transacciones
                        </button>
                    </div>
                </div>
                
                <div class="overflow-x-auto" id="transactionHistory">
                    <!-- Recent transactions will be loaded here -->
                </div>
                
                <div class="mt-4 text-center">
                    <p class="text-sm text-gray-500">Mostrando las últimas 5 transacciones</p>
                </div>
            </div>

            <!-- All Transactions Modal -->
            <div id="allTransactionsModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] flex flex-col">
                    <!-- Modal Header -->
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-xl font-semibold text-gray-800">
                            <i class="fas fa-list mr-2 text-blue-600"></i>
                            Todas las Transacciones de <span id="modalAssetSymbol">${symbol}</span>
                        </h3>
                        <button onclick="closeAllTransactionsModal()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- Modal Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <div id="allTransactionsContent">
                            <!-- All transactions will be loaded here -->
                        </div>
                    </div>
                    
                    <!-- Modal Footer -->
                    <div class="px-6 py-4 border-t border-gray-200">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600" id="totalTransactionsCount">
                                Total: 0 transacciones
                            </span>
                            <div class="flex space-x-3">
                                <button onclick="exportAssetTransactions()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    <i class="fas fa-download mr-2"></i>Exportar CSV
                                </button>
                                <button onclick="closeAllTransactionsModal()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Global variables
            const assetSymbol = '${symbol}';
            let assetData = null;
            let dailySnapshots = [];
            let priceChart = null;
            let valueChart = null;
            let currentPriceRange = '90d';
            let currentValueRange = '90d';

            // Initialize page
            document.addEventListener('DOMContentLoaded', function() {
                loadAssetData();
                
                // Setup month filter
                document.getElementById('monthFilter').addEventListener('change', filterDailyHistory);
                

            });

            // Load asset data
            async function loadAssetData() {
                try {
                    // Get URL parameters for exploration mode
                    const urlParams = new URLSearchParams(window.location.search);
                    const fromPrices = urlParams.get('from') === 'prices' || urlParams.get('from') === 'watchlist';
                    const assetName = urlParams.get('name');
                    const assetCategory = urlParams.get('category');
                    const apiSource = urlParams.get('source') || 'alphavantage';
                    const apiId = urlParams.get('api_id');
                    
                    // Build API URL with all parameters
                    let apiUrl = \`/api/wallet/asset/\${assetSymbol}\`;
                    if (fromPrices) {
                        const params = new URLSearchParams({
                            from: 'prices',
                            name: assetName || assetSymbol,
                            category: assetCategory || 'unknown'
                        });
                        if (apiSource) params.append('source', apiSource);
                        if (apiId) params.append('api_id', apiId);
                        
                        apiUrl += '?' + params.toString();
                    }
                    
                    const response = await axios.get(apiUrl);
                    const data = response.data;
                    const { holding, transactions, daily_snapshots, is_exploration } = data;
                    

                    
                    assetData = holding;
                    dailySnapshots = daily_snapshots || [];
                    
                    // Update UI
                    updateAssetHeader(holding);
                    updateSummaryCards(holding);
                    
                    if (is_exploration) {
                        // Show exploration notice
                        showExplorationNotice(holding);
                        
                        // For exploration, show message instead of charts
                        showExplorationMessage();
                    } else {
                        // Load charts if we have snapshots
                        if (daily_snapshots.length > 0) {

                            renderPriceChart(daily_snapshots);
                            renderValueChart(daily_snapshots);
                            renderDailyHistory(daily_snapshots);
                        } else {
                            showNoSnapshotsMessage();
                        }
                    }
                    
                    // Load transactions
                    renderTransactionHistory(transactions);
                    
                    // Show main content
                    document.getElementById('loadingState').classList.add('hidden');
                    document.getElementById('mainContent').classList.remove('hidden');
                    
                } catch (error) {
                    console.error('Error loading asset data:', error);
                    alert('Error cargando información del activo');
                    window.location.href = '/wallet';
                }
            }

            // Update asset header
            function updateAssetHeader(holding) {
                document.getElementById('assetName').textContent = holding.name;
                
                const categoryClass = holding.category === 'crypto' ? 'bg-orange-100 text-orange-800' :
                                     holding.category === 'stocks' ? 'bg-blue-100 text-blue-800' :
                                     'bg-purple-100 text-purple-800';
                                     
                const categoryText = holding.category === 'crypto' ? 'Criptomoneda' :
                                    holding.category === 'stocks' ? 'Acción' : 'ETF';
                                    
                const categoryElement = document.getElementById('assetCategory');
                categoryElement.className = \`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full \${categoryClass}\`;
                categoryElement.textContent = categoryText;
            }

            // Update summary cards
            function updateSummaryCards(holding) {
                document.getElementById('totalQuantity').textContent = 
                    parseFloat(holding.quantity).toLocaleString('en-US', {maximumFractionDigits: 8});
                
                document.getElementById('currentPrice').textContent = 
                    '$' + parseFloat(holding.current_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2});
                
                document.getElementById('totalValue').textContent = 
                    '$' + parseFloat(holding.current_value).toLocaleString('en-US', {minimumFractionDigits: 2});
                
                const pnlElement = document.getElementById('totalPnL');
                const pnlIconElement = document.getElementById('pnlIcon');
                
                pnlElement.textContent = '$' + Math.abs(holding.unrealized_pnl).toLocaleString('en-US', {minimumFractionDigits: 2});
                
                if (holding.unrealized_pnl >= 0) {
                    pnlElement.className = 'text-2xl font-bold text-green-600';
                    pnlIconElement.className = 'bg-green-100 p-3 rounded-full';
                    pnlIconElement.innerHTML = '<i class="fas fa-arrow-up text-green-600"></i>';
                } else {
                    pnlElement.className = 'text-2xl font-bold text-red-600';
                    pnlIconElement.className = 'bg-red-100 p-3 rounded-full';
                    pnlIconElement.innerHTML = '<i class="fas fa-arrow-down text-red-600"></i>';
                }
            }

            // Render price chart
            function renderPriceChart(snapshots, range = '90d') {
                const ctx = document.getElementById('priceChart').getContext('2d');
                
                if (priceChart) {
                    priceChart.destroy();
                }

                // Filter data by range
                const filteredData = filterDataByRange(snapshots, range);
                
                const labels = filteredData.map(s => new Date(s.snapshot_date).toLocaleDateString('es-ES'));
                const prices = filteredData.map(s => parseFloat(s.price_per_unit));

                priceChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Precio (USD)',
                            data: prices,
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString('en-US', {minimumFractionDigits: 2});
                                    }
                                }
                            },
                            x: {
                                ticks: {
                                    maxTicksLimit: 10
                                }
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        }
                    }
                });
            }

            // Render value chart
            function renderValueChart(snapshots, range = '90d') {
                const ctx = document.getElementById('valueChart').getContext('2d');
                
                if (valueChart) {
                    valueChart.destroy();
                }

                // Filter data by range
                const filteredData = filterDataByRange(snapshots, range);
                
                const labels = filteredData.map(s => new Date(s.snapshot_date).toLocaleDateString('es-ES'));
                const values = filteredData.map(s => parseFloat(s.total_value));

                valueChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Valor Total (USD)',
                            data: values,
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString('en-US', {minimumFractionDigits: 2});
                                    }
                                }
                            },
                            x: {
                                ticks: {
                                    maxTicksLimit: 10
                                }
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        }
                    }
                });
            }

            // Filter data by date range
            function filterDataByRange(data, range) {
                if (!data.length) return [];
                
                const now = new Date();
                let startDate;
                
                switch(range) {
                    case '7d':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case '30d':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case '90d':
                    default:
                        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                }
                
                return data.filter(item => {
                    const itemDate = new Date(item.snapshot_date);
                    return itemDate >= startDate;
                }).sort((a, b) => new Date(a.snapshot_date) - new Date(b.snapshot_date));
            }

            // Change price chart range
            function changePriceRange(range) {
                currentPriceRange = range;
                
                // Update button styles
                document.querySelectorAll('[onclick*="changePriceRange"]').forEach(btn => {
                    btn.className = 'px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200';
                });
                event.target.className = 'px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded';
                
                renderPriceChart(dailySnapshots, range);
            }

            // Change value chart range
            function changeValueRange(range) {
                currentValueRange = range;
                
                // Update button styles
                document.querySelectorAll('[onclick*="changeValueRange"]').forEach(btn => {
                    btn.className = 'px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200';
                });
                event.target.className = 'px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded';
                
                renderValueChart(dailySnapshots, range);
            }

            // Render daily history table
            function renderDailyHistory(snapshots) {
                const tbody = document.getElementById('dailyHistoryBody');
                
                // DEBUG: Check what's happening
                console.log('🔍 SNAPSHOTS COUNT:', snapshots.length);
                console.log('🔍 LAST DATE:', snapshots[snapshots.length - 1]?.snapshot_date);
                console.log('🔍 HAS 2025-09-18:', snapshots.some(s => s.snapshot_date === '2025-09-18'));
                
                if (!snapshots.length) {
                    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No hay datos históricos disponibles</td></tr>';
                    return;
                }

                // Sort by date descending for most recent first
                const sortedSnapshots = [...snapshots].sort((a, b) => new Date(b.snapshot_date) - new Date(a.snapshot_date));
                console.log('🔍 AFTER SORT - FIRST 3:', sortedSnapshots.slice(0, 3).map(s => s.snapshot_date));
                console.log('🔍 AFTER SORT - TOTAL ROWS TO RENDER:', sortedSnapshots.length);

                const rowsHTML = sortedSnapshots.map((snapshot, index) => {
                    const prevSnapshot = sortedSnapshots[index + 1];
                    let changePercent = 0;
                    let changeClass = 'executive-text-primary';
                    let changeIcon = 'fas fa-minus';

                    if (prevSnapshot) {
                        const prevPrice = parseFloat(prevSnapshot.price_per_unit);
                        const currentPrice = parseFloat(snapshot.price_per_unit);
                        changePercent = ((currentPrice - prevPrice) / prevPrice) * 100;
                        
                        if (changePercent > 0) {
                            changeClass = 'text-green-600';
                            changeIcon = 'fas fa-arrow-up';
                        } else if (changePercent < 0) {
                            changeClass = 'text-red-600';
                            changeIcon = 'fas fa-arrow-down';
                        }
                    }

                    const pnlClass = snapshot.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600';
                    const pnlIcon = snapshot.unrealized_pnl >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';

                    return \`
                        <tr class="hover:bg-slate-700 bg-opacity-50">
                            <td class="px-6 py-4 text-sm font-medium text-gray-800">
                                \${new Date(snapshot.snapshot_date + 'T00:00:00').toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </td>
                            <td class="px-6 py-4 text-sm executive-text-primary">
                                \${parseFloat(snapshot.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}
                            </td>
                            <td class="px-6 py-4 text-sm executive-text-primary">
                                $\${parseFloat(snapshot.price_per_unit).toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </td>
                            <td class="px-6 py-4 text-sm font-medium text-gray-800">
                                $\${parseFloat(snapshot.total_value).toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </td>
                            <td class="px-6 py-4 text-sm font-medium \${pnlClass}">
                                <i class="\${pnlIcon} mr-1"></i>
                                $\${Math.abs(snapshot.unrealized_pnl).toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </td>
                            <td class="px-6 py-4 text-sm font-medium \${changeClass}">
                                <i class="\${changeIcon} mr-1"></i>
                                \${Math.abs(changePercent).toFixed(2)}%
                            </td>
                        </tr>
                    \`;
                }).join('');

                tbody.innerHTML = rowsHTML;
                console.log('🔍 HTML INSERTED - TABLE ROWS COUNT:', tbody.children.length);
                
                // DEBUG: Check first few rows in DOM
                setTimeout(() => {
                    console.log('🔍 CHECKING DOM AFTER INSERT...');
                    console.log('🔍 TABLE TBODY CHILDREN:', tbody.children.length);
                    console.log('🔍 FIRST ROW DATE:', tbody.children[0]?.children[0]?.textContent);
                    console.log('🔍 SECOND ROW DATE:', tbody.children[1]?.children[0]?.textContent);
                    console.log('🔍 THIRD ROW DATE:', tbody.children[2]?.children[0]?.textContent);
                    console.log('🔍 LAST ROW DATE:', tbody.children[tbody.children.length - 1]?.children[0]?.textContent);
                    
                    // Check if table is visible
                    const table = document.getElementById('dailyHistoryTable');
                    console.log('🔍 TABLE VISIBLE:', table?.offsetHeight, 'px');
                    console.log('🔍 TABLE STYLES:', window.getComputedStyle(table || tbody));
                }, 100);
            }

            // Filter daily history by month
            function filterDailyHistory() {
                console.log('🚨 FILTER IS BEING EXECUTED!!!');
                const selectedMonth = document.getElementById('monthFilter').value;
                console.log('🚨 FILTER VALUE:', selectedMonth);
                
                if (!selectedMonth) {
                    renderDailyHistory(dailySnapshots);
                    return;
                }

                const filteredSnapshots = dailySnapshots.filter(snapshot => {
                    return snapshot.snapshot_date.startsWith(selectedMonth);
                });

                renderDailyHistory(filteredSnapshots);
            }

            // Render transaction history
            function renderTransactionHistory(transactions) {
                const container = document.getElementById('transactionHistory');
                
                if (!transactions.length) {
                    container.innerHTML = '<div class="text-center py-8 text-gray-500">No hay transacciones registradas</div>';
                    return;
                }

                const tableHTML = \`
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-slate-700 bg-opacity-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exchange</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            \${transactions.map(tx => \`
                                <tr class="hover:bg-slate-700 bg-opacity-50">
                                    <td class="px-6 py-4 text-sm executive-text-primary">
                                        \${new Date(tx.transaction_date).toLocaleDateString('es-ES')}
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full \${
                                            tx.type === 'buy' ? 'bg-green-100 text-green-800' : 
                                            tx.type === 'sell' ? 'bg-red-100 text-red-800' : 
                                            tx.type === 'trade_in' ? 'bg-blue-100 text-blue-800' :
                                            'bg-purple-100 text-purple-800'
                                        }">
                                            \${tx.type === 'buy' ? '💰 Compra' : 
                                              tx.type === 'sell' ? '💵 Venta' : 
                                              tx.type === 'trade_in' ? '⬅️ Trade In' : 
                                              '➡️ Trade Out'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm executive-text-primary">
                                        \${parseFloat(tx.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}
                                    </td>
                                    <td class="px-6 py-4 text-sm executive-text-primary">
                                        \${tx.price_per_unit > 0 ? '$' + parseFloat(tx.price_per_unit).toLocaleString('en-US', {minimumFractionDigits: 2}) : 'N/A'}
                                    </td>
                                    <td class="px-6 py-4 text-sm executive-text-primary">
                                        \${tx.total_amount > 0 ? '$' + parseFloat(tx.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2}) : 'N/A'}
                                    </td>
                                    <td class="px-6 py-4 text-sm executive-text-primary">\${tx.exchange}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
                
                container.innerHTML = tableHTML;
                
                // Update closing price display
                if (typeof updateClosingPriceDisplay === 'function') {
                    updateClosingPriceDisplay();
                }
            }

            // Update closing price display from daily snapshots
            function updateClosingPriceDisplay() {
                const livePriceElement = document.getElementById('livePrice');
                const closingPriceElement = document.getElementById('closingPrice');
                const closingDateElement = document.getElementById('closingDate');
                const lastUpdateElement = document.getElementById('lastUpdate');
                
                // Update live price (same as current price)
                if (assetData && assetData.current_price) {
                    if (livePriceElement) {
                        livePriceElement.textContent = '$' + parseFloat(assetData.current_price).toLocaleString('en-US', {minimumFractionDigits: 2});
                    }
                    if (lastUpdateElement) {
                        lastUpdateElement.textContent = 'Última actualización: ' + new Date().toLocaleTimeString('es-ES');
                    }
                }
                
                // Update closing price from most recent snapshot
                if (dailySnapshots && dailySnapshots.length > 0) {
                    const mostRecentSnapshot = dailySnapshots[0]; // Should be sorted by date desc
                    if (closingPriceElement) {
                        closingPriceElement.textContent = '$' + parseFloat(mostRecentSnapshot.price_per_unit).toLocaleString('en-US', {minimumFractionDigits: 2});
                    }
                    
                    if (closingDateElement) {
                        const closingDate = new Date(mostRecentSnapshot.snapshot_date);
                        closingDateElement.textContent = 'Último cierre: ' + closingDate.toLocaleDateString('es-ES') + ' a las 9:00 PM';
                    }
                }
            }

            // Refresh transactions
            window.refreshTransactions = async function() {
                try {
                    const response = await axios.get('/api/transactions/asset/' + assetSymbol);
                    const transactions = response.data;
                    renderTransactionHistory(transactions);
                } catch (error) {
                    console.error('Error refreshing transactions:', error);
                }
            };

            // View all asset transactions (opens modal)
            window.viewAllAssetTransactions = async function() {
                try {
                    document.getElementById('allTransactionsModal').classList.remove('hidden');
                    document.getElementById('modalAssetSymbol').textContent = assetSymbol;
                    
                    // Show loading
                    document.getElementById('allTransactionsContent').innerHTML = 
                        '<div class="flex items-center justify-center py-8">' +
                            '<i class="fas fa-spinner fa-spin text-blue-600 text-2xl mr-3"></i>' +
                            '<span>Cargando todas las transacciones...</span>' +
                        '</div>';
                    
                    const response = await axios.get('/api/transactions/asset/' + assetSymbol);
                    const transactions = response.data;
                    
                    displayAllAssetTransactions(transactions);
                } catch (error) {
                    console.error('Error loading all transactions:', error);
                    document.getElementById('allTransactionsContent').innerHTML = 
                        '<div class="text-center py-8 text-red-600">' +
                            '<i class="fas fa-exclamation-triangle text-2xl mb-2"></i>' +
                            '<p>Error al cargar las transacciones</p>' +
                        '</div>';
                }
            };

            // Close all transactions modal
            window.closeAllTransactionsModal = function() {
                document.getElementById('allTransactionsModal').classList.add('hidden');
            };

            // Display all asset transactions in modal  
            function displayAllAssetTransactions(transactions) {
                const container = document.getElementById('allTransactionsContent');
                const countElement = document.getElementById('totalTransactionsCount');
                
                countElement.textContent = 'Total: ' + transactions.length + ' transacciones';
                
                if (!transactions || transactions.length === 0) {
                    container.innerHTML = 
                        '<div class="text-center py-8 text-gray-500">' +
                            '<i class="fas fa-inbox text-4xl mb-4"></i>' +
                            '<p class="text-lg">No hay transacciones registradas para este activo</p>' +
                        '</div>';
                    return;
                }
                
                const tableHTML = 
                    '<div class="overflow-x-auto">' +
                        '<table class="w-full">' +
                            '<thead class="bg-gray-50">' +
                                '<tr class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">' +
                                    '<th class="px-6 py-3">Fecha y Hora</th>' +
                                    '<th class="px-6 py-3">Tipo</th>' +
                                    '<th class="px-6 py-3">Cantidad</th>' +
                                    '<th class="px-6 py-3">Precio</th>' +
                                    '<th class="px-6 py-3">Total</th>' +
                                    '<th class="px-6 py-3">Exchange</th>' +
                                    '<th class="px-6 py-3">Comisiones</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody class="bg-white divide-y divide-gray-200">' +
                                transactions.map(tx => {
                                    const date = new Date(tx.transaction_date);
                                    const formattedDate = date.toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                    
                                    let typeClass, typeLabel, typeIcon;
                                    if (tx.type === 'buy') {
                                        typeClass = 'text-green-700 bg-green-100';
                                        typeLabel = 'Compra';
                                        typeIcon = 'fas fa-arrow-down';
                                    } else if (tx.type === 'sell') {
                                        typeClass = 'text-red-700 bg-red-100';
                                        typeLabel = 'Venta';
                                        typeIcon = 'fas fa-arrow-up';
                                    } else if (tx.type === 'trade_in') {
                                        typeClass = 'text-blue-700 bg-blue-100';
                                        typeLabel = 'Trade In';
                                        typeIcon = 'fas fa-exchange-alt';
                                    } else {
                                        typeClass = 'text-orange-700 bg-orange-100';
                                        typeLabel = 'Trade Out';
                                        typeIcon = 'fas fa-exchange-alt';
                                    }
                                    
                                    return '<tr class="hover:bg-gray-50 cursor-pointer" onclick="showTransactionDetails(' + tx.id + ')">' +
                                        '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' +
                                            '<span class="font-medium">' + formattedDate + '</span>' +
                                        '</td>' +
                                        '<td class="px-6 py-4 whitespace-nowrap">' +
                                            '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + typeClass + '">' +
                                                '<i class="' + typeIcon + ' mr-1"></i>' + typeLabel +
                                            '</span>' +
                                        '</td>' +
                                        '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' +
                                            '<span class="font-medium">' + parseFloat(tx.quantity).toLocaleString('es-ES', { maximumFractionDigits: 8 }) + '</span>' +
                                        '</td>' +
                                        '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' +
                                            '$' + parseFloat(tx.price_per_unit).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
                                        '</td>' +
                                        '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">' +
                                            '$' + parseFloat(tx.total_amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
                                        '</td>' +
                                        '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">' +
                                            '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100">' +
                                                '<i class="fas fa-building mr-1"></i>' + tx.exchange +
                                            '</span>' +
                                        '</td>' +
                                        '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' +
                                            (tx.fees > 0 ? '$' + parseFloat(tx.fees).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-') +
                                        '</td>' +
                                    '</tr>';
                                }).join('') +
                            '</tbody>' +
                        '</table>' +
                    '</div>';

                container.innerHTML = tableHTML;
            }

            // Generate snapshots
            async function generateSnapshots() {
                try {
                    const btn = event.target;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando...';
                    btn.disabled = true;
                    
                    const response = await axios.post(\`/api/wallet/asset/\${assetSymbol}/generate-snapshots\`);
                    
                    if (response.data.success) {
                        alert(response.data.message);
                        // Reload page to show new snapshots
                        window.location.reload();
                    } else {
                        alert('Error generando snapshots');
                    }
                    
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                } catch (error) {
                    console.error('Error generating snapshots:', error);
                    alert('Error generando snapshots');
                    
                    const btn = event.target;
                    btn.innerHTML = '<i class="fas fa-history mr-2"></i>Generar Historial';
                    btn.disabled = false;
                }
            }

            // Export to CSV
            function exportToCSV() {
                if (!dailySnapshots.length) {
                    alert('No hay datos para exportar');
                    return;
                }

                const headers = ['Fecha', 'Cantidad', 'Precio (9 PM)', 'Valor Total', 'PnL', '% Cambio'];
                const csvData = [headers];

                const sortedSnapshots = [...dailySnapshots].sort((a, b) => new Date(b.snapshot_date) - new Date(a.snapshot_date));

                sortedSnapshots.forEach((snapshot, index) => {
                    const prevSnapshot = sortedSnapshots[index + 1];
                    let changePercent = 0;

                    if (prevSnapshot) {
                        const prevPrice = parseFloat(prevSnapshot.price_per_unit);
                        const currentPrice = parseFloat(snapshot.price_per_unit);
                        changePercent = ((currentPrice - prevPrice) / prevPrice) * 100;
                    }

                    csvData.push([
                        new Date(snapshot.snapshot_date).toLocaleDateString('es-ES'),
                        parseFloat(snapshot.quantity).toFixed(8),
                        parseFloat(snapshot.price_per_unit).toFixed(2),
                        parseFloat(snapshot.total_value).toFixed(2),
                        parseFloat(snapshot.unrealized_pnl).toFixed(2),
                        changePercent.toFixed(2) + '%'
                    ]);
                });

                const csvContent = csvData.map(row => row.join(',')).join('\\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = \`\${assetSymbol}_historial_\${new Date().toISOString().split('T')[0]}.csv\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }

            // Show no snapshots message
            function showNoSnapshotsMessage() {
                const message = \`
                    <div class="col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                        <i class="fas fa-exclamation-triangle text-yellow-600 text-3xl mb-4"></i>
                        <h3 class="text-lg font-medium text-yellow-800 mb-2">No hay datos históricos</h3>
                        <p class="text-yellow-700 mb-4">Haz clic en "Generar Historial" para crear snapshots desde julio 21, 2025</p>
                        <button onclick="generateSnapshots()" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                            <i class="fas fa-history mr-2"></i>
                            Generar Historial Ahora
                        </button>
                    </div>
                \`;
                
                const chartContainer = document.querySelector('.grid.grid-cols-1.lg\\\\:grid-cols-2');
                if (chartContainer) {
                    chartContainer.innerHTML = message;
                } else {
                    console.error('Chart container not found');
                }
            }

            // Show exploration notice
            function showExplorationNotice(asset) {
                const notice = \`
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-search text-blue-600"></i>
                                </div>
                            </div>
                            <div class="ml-4 flex-1">
                                <h4 class="text-lg font-semibold text-blue-800 mb-2">Modo Exploración - \${asset.name}</h4>
                                <p class="text-blue-700 text-sm mb-4">Estás explorando información general de este activo. Para acceder a gráficas históricas, análisis detallado y gestión de holdings, agrega este activo a tu wallet.</p>
                                <div class="flex flex-wrap gap-3">
                                    <button onclick="addToWatchlist('\${asset.symbol}', '\${asset.name}', '\${asset.category}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
                                        <i class="fas fa-star mr-2"></i>
                                        Agregar a Watchlist
                                    </button>
                                    <a href="/transactions" class="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg">
                                        <i class="fas fa-shopping-cart mr-2"></i>
                                        Comprar Activo
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
                
                const mainContent = document.getElementById('mainContent');
                const summaryCards = mainContent.querySelector('.grid.grid-cols-1.md\\\\:grid-cols-3');
                if (summaryCards) {
                    summaryCards.insertAdjacentHTML('afterend', notice);
                } else {
                    console.error('Summary cards container not found for exploration notice');
                    // Fallback: insert at the beginning of main content
                    mainContent.insertAdjacentHTML('afterbegin', notice);
                }
            }

            // Show exploration message instead of charts
            function showExplorationMessage() {
                const message = \`
                    <div class="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
                        <i class="fas fa-chart-line text-blue-600 text-3xl mb-4"></i>
                        <h3 class="text-lg font-medium text-blue-800 mb-2">Gráficas y Análisis Detallado</h3>
                        <p class="text-blue-700 mb-4">Para ver gráficas históricas, análisis técnico y datos detallados, agrega este activo a tu wallet</p>
                        <div class="space-x-3">
                            <button onclick="addToWatchlist('\${assetData?.symbol || 'N/A'}', '\${assetData?.name || 'N/A'}', '\${assetData?.category || 'N/A'}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <i class="fas fa-star mr-2"></i>
                                Agregar a Watchlist
                            </button>
                            <a href="/transactions" class="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fas fa-shopping-cart mr-2"></i>
                                Comprar Ahora
                            </a>
                        </div>
                        
                        <!-- Current Price Display -->
                        <div class="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                            <h4 class="text-sm executive-text-primary mb-1">Precio Actual</h4>
                            <div class="text-2xl font-bold text-green-600">$\${assetData?.current_price ? parseFloat(assetData.current_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</div>
                            <p class="text-xs text-gray-500 mt-1">Precio de referencia</p>
                        </div>
                    </div>
                \`;
                
                const chartContainer = document.querySelector('.grid.grid-cols-1.lg\\\\:grid-cols-2');
                if (chartContainer) {
                    chartContainer.innerHTML = message;
                } else {
                    console.error('Chart container not found for exploration message');
                }
            }

            // Add to watchlist
            async function addToWatchlist(symbol, name, category) {
                try {
                    // Show loading state
                    const buttons = document.querySelectorAll(\`button[onclick*="addToWatchlist('\${symbol}')"]\`);
                    buttons.forEach(btn => {
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Agregando...';
                        btn.disabled = true;
                    });
                    
                    const response = await axios.post('/api/watchlist', {
                        symbol: symbol,
                        name: name,
                        category: category,
                        notes: '',
                        target_price: null
                    });
                    
                    if (response.data.success) {
                        // Show success state
                        buttons.forEach(btn => {
                            btn.innerHTML = '<i class="fas fa-check mr-2"></i>¡Agregado!';
                            btn.className = btn.className.replace('bg-blue-600 hover:bg-blue-700', 'bg-green-600 hover:bg-green-700');
                        });
                        
                        // Show success notification
                        showNotification(response.data.message, 'success');
                        
                        // Optionally redirect to watchlist or refresh
                        setTimeout(() => {
                            buttons.forEach(btn => {
                                btn.innerHTML = '<i class="fas fa-eye mr-2"></i>Ver Watchlist';
                                btn.onclick = () => window.location.href = '/watchlist';
                            });
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Error adding to watchlist:', error);
                    
                    // Show error state
                    const buttons = document.querySelectorAll(\`button[onclick*="addToWatchlist('\${symbol}')"]\`);
                    buttons.forEach(btn => {
                        btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Error';
                        btn.className = btn.className.replace('bg-blue-600 hover:bg-blue-700', 'bg-red-600 hover:bg-red-700');
                        btn.disabled = false;
                    });
                    
                    // Show error message
                    const errorMsg = error.response?.status === 409 ? 
                        'Este activo ya está en tu watchlist' : 
                        'Error al agregar al watchlist';
                    showNotification(errorMsg, 'error');
                    
                    // Reset button after 3 seconds
                    setTimeout(() => {
                        buttons.forEach(btn => {
                            btn.innerHTML = '<i class="fas fa-star mr-2"></i>Agregar a Watchlist';
                            btn.className = btn.className.replace('bg-red-600 hover:bg-red-700', 'bg-blue-600 hover:bg-blue-700');
                        });
                    }, 3000);
                }
            }
            
            // Show notification
            function showNotification(message, type = 'info') {
                const notification = document.createElement('div');
                notification.className = \`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 \${
                    type === 'success' ? 'bg-green-500 text-white' :
                    type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                }\`;
                notification.innerHTML = \`
                    <div class="flex items-center">
                        <i class="fas fa-\${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                        \${message}
                    </div>
                \`;
                
                document.body.appendChild(notification);
                
                // Remove after 4 seconds
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 4000);
            }

            // Logout function
            async function logout() {
                try {
                    await axios.post('/api/auth/logout');
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Error during logout:', error);
                    window.location.href = '/login';
                }
            }
        </script>
    </body>
    </html>
  `)
})

app.get('/prices', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - Live Markets</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="min-h-screen">
        
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-12">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-4">
                                <!-- Logo GusBit con tipografía y spacing optimizados -->
                                <div class="flex flex-col items-start">
                                    <!-- GB con formas exactas y spacing perfecto -->
                                    <div class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 3.2rem; line-height: 0.75; letter-spacing: -0.08em;">
                                        <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GB</span>
                                    </div>
                                    
                                    <!-- GusBit con el mismo estilo tipográfico -->
                                    <div class="-mt-1">
                                        <h1 class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 1.8rem; line-height: 0.9; letter-spacing: -0.03em; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                                            GusBit
                                        </h1>
                                        
                                        <!-- Tagline con spacing perfecto -->
                                        <div class="text-white leading-tight" style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.6rem; letter-spacing: 0.12em; line-height: 1.1; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            TRACK STOCKS<br>
                                            ETFS &amp; CRYPTO
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-line mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-briefcase mr-2"></i>
                                Portfolio
                            </a>
                            <a href="/prices" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm">
                                <i class="fas fa-chart-area mr-2"></i>
                                Markets
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 transition-all font-medium text-sm">
                        <i class="fas fa-power-off mr-2"></i>
                        Salir
                    </button>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto">
        
        <!-- Main Content -->
        <div class="px-8 py-12">
            <!-- Executive Header -->
            <div class="flex justify-between items-start mb-12">
                <div>
                    <h1 class="text-5xl font-light text-white mb-3 tracking-tight drop-shadow-lg">Live Markets</h1>
                    <p class="executive-text-secondary font-medium text-lg">Mercados globales en tiempo real</p>
                    <div class="w-20 h-1 bg-blue-500 mt-4 rounded-full shadow-lg"></div>
                </div>
                <a href="/transactions" class="executive-bg-blue text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center executive-shadow font-medium">
                    <i class="fas fa-plus mr-3"></i>
                    Nueva Transacción
                </a>
            </div>
                                <i class="fas fa-star mr-2"></i>Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="text-white hover:text-red-300 transition-colors duration-200 flex items-center space-x-2 font-medium">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">
            
            <!-- Search Section -->
            <div class="glass-card p-8">
                <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-8 flex items-center">
                    <i class="fas fa-search mr-3 text-blue-600"></i>
                    Buscador de Activos Sencillo
                </h2>
                
                <div class="max-w-3xl mx-auto">
                    <div class="relative">
                        <input 
                            type="text" 
                            id="searchInput" 
                            class="w-full px-6 py-4 text-lg rounded-xl bg-slate-700 bg-opacity-50 border-2 border-blue-500 border-opacity-30 text-white placeholder-slate-400 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:bg-opacity-70 transition-all duration-200 pr-16"
                            placeholder="Busca: AAPL, Bitcoin, TSLA..."
                            autocomplete="off"
                        >
                        <button onclick="searchAsset()" class="absolute right-3 top-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <div class="text-center mt-4 executive-text-primary">
                        <p>Busca cualquier activo y agrégalo a tu watchlist</p>
                    </div>
                </div>
            </div>

            <!-- Results Section -->
            <div id="results" class="hidden">
                <div class="glass-card p-8">
                    <div id="assetData"></div>
                </div>
            </div>

            <!-- Quick Access -->
            <div class="glass-card p-8">
                <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6">
                    Activos Populares
                </h2>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onclick="quickSearch('AAPL')" class="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-center">
                        <i class="fab fa-apple text-2xl mb-2"></i>
                        <div class="font-bold">AAPL</div>
                    </button>
                    
                    <button onclick="quickSearch('BTC')" class="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-center">
                        <i class="fab fa-bitcoin text-2xl mb-2 text-orange-500"></i>
                        <div class="font-bold">BTC</div>
                    </button>
                    
                    <button onclick="quickSearch('TSLA')" class="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-center">
                        <i class="fas fa-car text-2xl mb-2"></i>
                        <div class="font-bold">TSLA</div>
                    </button>
                    
                    <button onclick="quickSearch('SPY')" class="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-center">
                        <i class="fas fa-chart-area text-2xl mb-2"></i>
                        <div class="font-bold">SPY</div>
                    </button>
                </div>
            </div>

            <!-- Watchlist Section -->
            <div class="glass-card p-8">
                <h2 class="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-6 flex items-center">
                    <i class="fas fa-star mr-3 text-yellow-500"></i>
                    Mi Watchlist
                    <span id="watchlistCount" class="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">0</span>
                </h2>
                
                <div id="watchlistItems"></div>
            </div>

        </div>

        <script>
            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                loadWatchlist();
            });

            // Search function
            function searchAsset() {
                const query = document.getElementById('searchInput').value.trim();
                if (!query) return;
                
                showLoading();
                
                // Use existing API
                axios.get('/api/assets/search?q=' + encodeURIComponent(query))
                    .then(response => {
                        const results = response.data.results;
                        if (results && results.length > 0) {
                            showAssetInfo(results[0]);
                        } else {
                            showError('Activo no encontrado');
                        }
                    })
                    .catch(error => {
                        console.error('Search error:', error);
                        showError('Error al buscar');
                    });
            }

            // Quick search
            function quickSearch(symbol) {
                document.getElementById('searchInput').value = symbol;
                searchAsset();
            }

            // Show loading
            function showLoading() {
                const results = document.getElementById('results');
                const data = document.getElementById('assetData');
                
                data.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i><p class="mt-2">Buscando...</p></div>';
                results.classList.remove('hidden');
            }

            // Show asset info
            function showAssetInfo(asset) {
                const results = document.getElementById('results');
                const data = document.getElementById('assetData');
                
                const price = (Math.random() * 500 + 50).toFixed(2);
                const change = (Math.random() - 0.5) * 10;
                const changePercent = ((change / price) * 100).toFixed(2);
                const changeColor = change >= 0 ? 'text-green-600' : 'text-red-600';
                
                // Escape quotes in asset name and symbol for safe HTML insertion
                const safeSymbol = asset.symbol.replace(/'/g, '&quot;');
                const safeName = asset.name.replace(/'/g, '&quot;');
                const safeCategory = asset.category.replace(/'/g, '&quot;');
                
                data.innerHTML = 
                    '<div class="flex justify-between items-start mb-6">' +
                        '<div>' +
                            '<h3 class="text-2xl font-bold">' + asset.symbol + '</h3>' +
                            '<p class="executive-text-primary">' + asset.name + '</p>' +
                            '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">' + asset.category.toUpperCase() + '</span>' +
                        '</div>' +
                        '<button onclick="addToWatchlist(&quot;' + safeSymbol + '&quot;, &quot;' + safeName + '&quot;, &quot;' + safeCategory + '&quot;)" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">' +
                            '<i class="fas fa-star mr-2"></i>¿Agregar al Watchlist?' +
                        '</button>' +
                    '</div>' +
                    '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">' +
                        '<div class="bg-white p-6 rounded-lg">' +
                            '<h4 class="text-sm text-gray-500 mb-2">PRECIO ESTIMADO</h4>' +
                            '<div class="text-2xl font-bold">$' + price + '</div>' +
                        '</div>' +
                        '<div class="bg-white p-6 rounded-lg">' +
                            '<h4 class="text-sm text-gray-500 mb-2">CAMBIO SIMULADO</h4>' +
                            '<div class="text-xl font-bold ' + changeColor + '">$' + Math.abs(change).toFixed(2) + ' (' + changePercent + '%)</div>' +
                        '</div>' +
                    '</div>';
                
                results.classList.remove('hidden');
            }

            // Show error
            function showError(message) {
                const data = document.getElementById('assetData');
                data.innerHTML = 
                    '<div class="text-center py-8">' +
                        '<i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>' +
                        '<p class="text-red-600">' + message + '</p>' +
                    '</div>';
            }

            // Add to watchlist
            function addToWatchlist(symbol, name, category) {
                axios.post('/api/watchlist', {
                    symbol: symbol,
                    name: name,
                    category: category,
                    notes: '',
                    target_price: null
                })
                .then(response => {
                    if (response.data.success) {
                        alert('¡Activo agregado al watchlist!');
                        loadWatchlist();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    if (error.response && error.response.status === 409) {
                        alert('Este activo ya está en tu watchlist');
                    } else {
                        alert('Error al agregar al watchlist');
                    }
                });
            }

            // Load watchlist
            function loadWatchlist() {
                axios.get('/api/watchlist')
                    .then(response => {
                        const watchlist = response.data.watchlist || [];
                        displayWatchlist(watchlist);
                    })
                    .catch(error => {
                        console.error('Error loading watchlist:', error);
                    });
            }

            // Display watchlist
            function displayWatchlist(watchlist) {
                const count = document.getElementById('watchlistCount');
                const items = document.getElementById('watchlistItems');
                
                count.textContent = watchlist.length;
                
                if (watchlist.length === 0) {
                    items.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-eye-slash text-2xl mb-2"></i><p>Tu watchlist está vacía</p></div>';
                    return;
                }
                
                let html = '';
                watchlist.forEach(asset => {
                    // Escape quotes in symbol for safe HTML insertion
                    const safeSymbol = asset.asset_symbol.replace(/'/g, '&quot;');
                    
                    html += 
                        '<div class="bg-white p-4 rounded-lg shadow mb-4 flex justify-between items-center">' +
                            '<div>' +
                                '<h4 class="font-bold">' + asset.asset_symbol + '</h4>' +
                                '<p class="executive-text-primary text-sm">' + asset.name + '</p>' +
                            '</div>' +
                            '<div class="text-right">' +
                                '<div class="text-lg font-bold">$' + (asset.current_price || 'N/A') + '</div>' +
                                '<button onclick="removeFromWatchlist(&quot;' + safeSymbol + '&quot;)" class="text-red-500 hover:text-red-700 text-sm">' +
                                    '<i class="fas fa-trash"></i> Eliminar' +
                                '</button>' +
                            '</div>' +
                        '</div>';
                });
                
                items.innerHTML = html;
            }

            // Remove from watchlist
            function removeFromWatchlist(symbol) {
                if (confirm('¿Eliminar este activo del watchlist?')) {
                    axios.delete('/api/watchlist/' + encodeURIComponent(symbol))
                        .then(response => {
                            if (response.data.success) {
                                alert('Activo eliminado del watchlist');
                                loadWatchlist();
                            }
                        })
                        .catch(error => {
                            console.error('Error eliminando activo:', error);
                            alert('Error al eliminar el activo');
                        });
                }
            }

            // Logout
            function logout() {
                axios.post('/api/auth/logout')
                    .then(() => {
                        window.location.href = '/login';
                    })
                    .catch(() => {
                        window.location.href = '/login';
                    });
            }
        </script>
    </body>
    </html>
  `)
})// ==============================================
// AUTOMATED DAILY SNAPSHOTS SYSTEM
// ==============================================

// Utility function to get current Mazatlán time
function getMazatlanTime() {
  const now = new Date()
  // Mazatlán is UTC-7 (standard) or UTC-6 (daylight saving)
  // DST runs from early April to late October
  const year = now.getUTCFullYear()
  
  // Approximate DST dates (second Sunday in March to first Sunday in November)
  const dstStart = new Date(year, 2, 8 + (6 - new Date(year, 2, 8).getDay()) % 7) // Second Sunday in March
  const dstEnd = new Date(year, 10, 1 + (6 - new Date(year, 10, 1).getDay()) % 7) // First Sunday in November
  
  const isDST = now >= dstStart && now < dstEnd
  const offset = isDST ? 6 : 7 // UTC-6 during DST, UTC-7 during standard time
  
  const mazatlanTime = new Date(now.getTime() - (offset * 60 * 60 * 1000))
  return { time: mazatlanTime, isDST, offset }
}

// Enhanced price fetching with better error handling and rate limits
async function fetchRealTimePrice(asset) {
  let price = 0
  
  try {
    if (asset.api_source === 'coingecko' && asset.api_id) {
      // CoinGecko API - Free tier has rate limits
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${asset.api_id}&vs_currencies=usd&include_24hr_change=true`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'FinancialTracker/1.0'
          },
          timeout: 10000 // 10 second timeout
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        price = data[asset.api_id]?.usd || 0
        
        // Log successful fetch
        console.log(`✅ CoinGecko: ${asset.symbol} = $${price}`)
      } else {
        console.log(`⚠️ CoinGecko API error for ${asset.symbol}: ${response.status}`)
      }
      
    } else if (asset.api_source === 'alphavantage') {
      // Alpha Vantage API would require API key
      // For now, using realistic mock data based on current market
      const realisticPrices = {
        'AAPL': 175.50 + (Math.random() - 0.5) * 8,
        'MSFT': 420.30 + (Math.random() - 0.5) * 15,
        'GOOGL': 140.25 + (Math.random() - 0.5) * 8,
        'SPY': 450.80 + (Math.random() - 0.5) * 12,
        'QQQ': 380.90 + (Math.random() - 0.5) * 12,
        'TSLA': 250.20 + (Math.random() - 0.5) * 20,
        'NVDA': 135.80 + (Math.random() - 0.5) * 15,
        'META': 520.15 + (Math.random() - 0.5) * 25
      }
      
      price = realisticPrices[asset.symbol] || (asset.current_price || 100) * (1 + (Math.random() - 0.5) * 0.03)
      console.log(`📊 Mock Stock: ${asset.symbol} = $${price.toFixed(2)}`)
      
      // TODO: Implement real Alpha Vantage API when API key is available
      // const response = await fetch(
      //   `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.symbol}&apikey=${API_KEY}`
      // )
    }
  } catch (error) {
    console.error(`❌ Error fetching price for ${asset.symbol}:`, error.message)
    // Fallback to slight variation of last known price
    price = (asset.current_price || 100) * (1 + (Math.random() - 0.5) * 0.01)
  }
  
  return Math.max(price, 0.01) // Ensure positive price
}

// Create daily snapshot for a specific asset
async function createDailySnapshot(DB, asset, currentPrice = null) {
  try {
    const { time: mazatlanTime } = getMazatlanTime()
    const snapshotDate = mazatlanTime.toISOString().split('T')[0]
    
    // Check if snapshot already exists for today
    const existingSnapshot = await DB.prepare(`
      SELECT id FROM daily_snapshots 
      WHERE asset_symbol = ? AND snapshot_date = ?
    `).bind(asset.symbol, snapshotDate).first()
    
    if (existingSnapshot) {
      console.log(`⏭️  Snapshot already exists for ${asset.symbol} on ${snapshotDate}`)
      return { success: true, skipped: true, date: snapshotDate }
    }
    
    // Get current holding for this asset
    const holding = await DB.prepare(`
      SELECT * FROM holdings WHERE asset_symbol = ?
    `).bind(asset.symbol).first()
    
    if (!holding || holding.quantity <= 0) {
      console.log(`⚠️ No active holdings for ${asset.symbol}, skipping snapshot`)
      return { success: true, skipped: true, reason: 'no_holdings' }
    }
    
    // Use provided price or fetch real-time price
    const pricePerUnit = currentPrice || await fetchRealTimePrice(asset)
    
    // Calculate snapshot values
    const totalValue = holding.quantity * pricePerUnit
    const unrealizedPnl = totalValue - (holding.total_invested || 0)
    const pnlPercentage = holding.total_invested > 0 
      ? ((unrealizedPnl / holding.total_invested) * 100) 
      : 0
    
    // Create snapshot with 9 PM Mazatlán timestamp
    const mazatlan9PM = new Date(mazatlanTime)
    mazatlan9PM.setHours(21, 0, 0, 0) // Set to 9:00 PM
    
    await DB.prepare(`
      INSERT INTO daily_snapshots (
        asset_symbol, snapshot_date, quantity, price_per_unit, 
        total_value, unrealized_pnl, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      asset.symbol,
      snapshotDate,
      holding.quantity,
      pricePerUnit,
      totalValue,
      unrealizedPnl,
      mazatlan9PM.toISOString()
    ).run()
    
    // Update asset's current price
    await DB.prepare(`
      UPDATE assets 
      SET current_price = ?, price_updated_at = ?, updated_at = ?
      WHERE symbol = ?
    `).bind(
      pricePerUnit,
      mazatlan9PM.toISOString(),
      mazatlan9PM.toISOString(),
      asset.symbol
    ).run()
    
    // Update holdings with new price
    await updateHoldings(DB, asset.symbol)
    
    console.log(`✅ Created snapshot: ${asset.symbol} = $${pricePerUnit.toFixed(4)} (${snapshotDate})`)
    
    return { 
      success: true, 
      created: true, 
      asset: asset.symbol,
      price: pricePerUnit,
      date: snapshotDate,
      mazatlanTime: mazatlan9PM.toISOString()
    }
    
  } catch (error) {
    console.error(`❌ Error creating snapshot for ${asset.symbol}:`, error)
    return { success: false, error: error.message, asset: asset.symbol }
  }
}

// Process all active assets for daily snapshots
async function processAllDailySnapshots(DB) {
  const startTime = Date.now()
  const { time: mazatlanTime, isDST, offset } = getMazatlanTime()
  
  console.log(`🕘 Starting daily snapshots at ${mazatlanTime.toISOString()} (Mazatlán UTC-${offset})`)
  
  try {
    // Get all assets that have active holdings
    const activeAssets = await DB.prepare(`
      SELECT DISTINCT a.* 
      FROM assets a
      INNER JOIN holdings h ON a.symbol = h.asset_symbol
      WHERE h.quantity > 0
      ORDER BY a.symbol
    `).all()
    
    if (!activeAssets.results || activeAssets.results.length === 0) {
      console.log('⚠️ No active assets found for snapshot processing')
      return { success: true, processed: 0, message: 'No active assets' }
    }
    
    console.log(`📊 Processing ${activeAssets.results.length} active assets...`)
    
    const results = []
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    // Process each asset with small delay to respect API rate limits
    for (const asset of activeAssets.results) {
      const result = await createDailySnapshot(DB, asset)
      results.push(result)
      
      if (result.success) {
        if (result.created) {
          successCount++
        } else {
          skippedCount++
        }
      } else {
        errorCount++
      }
      
      // Small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
    }
    
    const duration = Date.now() - startTime
    const summary = {
      success: true,
      processed: activeAssets.results.length,
      created: successCount,
      skipped: skippedCount,
      errors: errorCount,
      duration_ms: duration,
      mazatlan_time: mazatlanTime.toISOString(),
      dst_active: isDST,
      results: results
    }
    
    console.log(`✅ Daily snapshots completed: ${successCount} created, ${skippedCount} skipped, ${errorCount} errors (${duration}ms)`)
    
    return summary
    
  } catch (error) {
    console.error('❌ Error processing daily snapshots:', error)
    return { 
      success: false, 
      error: error.message,
      duration_ms: Date.now() - startTime 
    }
  }
}

// Manual trigger for daily snapshots (admin endpoint)
app.post('/api/admin/daily-snapshots', async (c) => {
  // Add basic auth check in production
  try {
    const result = await processAllDailySnapshots(c.env.DB)
    return c.json(result)
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to process daily snapshots',
      details: error.message 
    }, 500)
  }
})

// Get snapshot processing status and logs
app.get('/api/admin/snapshot-status', async (c) => {
  try {
    const { time: mazatlanTime, isDST, offset } = getMazatlanTime()
    const today = mazatlanTime.toISOString().split('T')[0]
    
    // Check today's snapshots
    const todaySnapshots = await c.env.DB.prepare(`
      SELECT 
        asset_symbol,
        snapshot_date,
        price_per_unit,
        total_value,
        created_at
      FROM daily_snapshots 
      WHERE snapshot_date = ?
      ORDER BY asset_symbol
    `).bind(today).all()
    
    // Get active assets count
    const activeAssets = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM assets a
      INNER JOIN holdings h ON a.symbol = h.asset_symbol
      WHERE h.quantity > 0
    `).bind().first()
    
    return c.json({
      mazatlan_time: mazatlanTime.toISOString(),
      timezone_info: {
        offset: `-${offset}`,
        dst_active: isDST,
        description: isDST ? 'Daylight Saving Time' : 'Standard Time'
      },
      snapshot_date: today,
      active_assets: activeAssets?.count || 0,
      today_snapshots: todaySnapshots.results?.length || 0,
      snapshots: todaySnapshots.results || []
    })
  } catch (error) {
    return c.json({ 
      error: 'Failed to get snapshot status',
      details: error.message 
    }, 500)
  }
})

// TEMPORARY ENDPOINT: Fix BTC snapshot price for Sept 20, 2025
app.post('/api/fix-btc-snapshot', async (c) => {
  try {
    console.log('🔧 Fixing BTC snapshot for 2025-09-20 with real price: $115,732.59')
    
    const result = await c.env.DB.prepare(`
      UPDATE daily_snapshots 
      SET 
        price_per_unit = 115732.59,
        total_value = 208711.25,
        unrealized_pnl = 2568.92
      WHERE asset_symbol = 'BTC' AND snapshot_date = '2025-09-20'
    `).run()
    
    return c.json({
      success: true,
      message: 'BTC snapshot fixed with real price',
      changes: result.changes,
      details: {
        date: '2025-09-20',
        old_price: 115765,
        new_price: 115732.59,
        new_total_value: 208711.25,
        new_pnl: 2568.92
      }
    })
  } catch (error) {
    console.error('Error fixing BTC snapshot:', error)
    return c.json({ error: 'Failed to fix BTC snapshot' }, 500)
  }
})

// TEMPORARY ENDPOINT: Delete incorrect future snapshot for Sept 21, 2025
app.post('/api/delete-future-snapshot', async (c) => {
  try {
    console.log('🗑️ Deleting incorrect snapshot for 2025-09-21 (future date)')
    
    const result = await c.env.DB.prepare(`
      DELETE FROM daily_snapshots 
      WHERE asset_symbol = 'BTC' AND snapshot_date = '2025-09-21'
    `).run()
    
    return c.json({
      success: true,
      message: 'Future snapshot deleted',
      changes: result.changes,
      deleted_date: '2025-09-21'
    })
  } catch (error) {
    console.error('Error deleting future snapshot:', error)
    return c.json({ error: 'Failed to delete future snapshot' }, 500)
  }
})

// ============================================
// CSV/EXCEL IMPORT FUNCTIONALITY 
// ============================================

// Import CSV and replace daily snapshots (preserving transactions)
app.post('/api/import/csv', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('csv_file') as File
    
    if (!file) {
      return c.json({ 
        success: false, 
        error: 'No se encontró archivo CSV' 
      }, 400)
    }

    // Read CSV content
    const csvContent = await file.text()
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return c.json({ 
        success: false, 
        error: 'El archivo CSV debe contener al menos una fila de datos' 
      }, 400)
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim())
    console.log('CSV Headers:', headers)

    // Expected format: FECHA,MONEDA,TOTAL Cantidad,Precio final 9 PM,Valor USD
    const requiredColumns = ['FECHA', 'MONEDA', 'TOTAL Cantidad', 'Precio final 9 PM', 'Valor USD']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      return c.json({
        success: false,
        error: `Columnas faltantes en CSV: ${missingColumns.join(', ')}`,
        expected: requiredColumns,
        found: headers
      }, 400)
    }

    // Parse CSV data
    const csvData = []
    const errors = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) continue
      
      try {
        const dateStr = values[0] // Format: DD/MM/YY
        const [day, month, year] = dateStr.split('/')
        const fullYear = year.length === 2 ? `20${year}` : year
        const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        
        csvData.push({
          date: isoDate,
          symbol: values[1].toUpperCase(),
          quantity: parseFloat(values[2]),
          price: parseFloat(values[3]),
          totalValue: parseFloat(values[4])
        })
      } catch (error) {
        errors.push(`Línea ${i + 1}: ${error.message}`)
      }
    }

    if (csvData.length === 0) {
      return c.json({
        success: false,
        error: 'No se pudieron procesar datos válidos del CSV',
        parsing_errors: errors
      }, 400)
    }

    console.log(`📊 Processed ${csvData.length} CSV rows, ${errors.length} errors`)

    // Start transaction to replace daily snapshots
    await c.env.DB.prepare('BEGIN TRANSACTION').run()
    
    try {
      // STEP 1: Delete ALL existing daily snapshots
      console.log('🗑️ Deleting existing daily snapshots...')
      const deleteResult = await c.env.DB.prepare('DELETE FROM daily_snapshots').run()
      console.log(`   Deleted ${deleteResult.changes} existing snapshots`)

      // STEP 2: Insert new snapshots from CSV
      console.log('📥 Inserting new snapshots from CSV...')
      let insertCount = 0
      
      for (const row of csvData) {
        // Calculate unrealized P&L (need to get holdings data)
        const holding = await c.env.DB.prepare(`
          SELECT quantity, avg_purchase_price, total_invested
          FROM holdings 
          WHERE asset_symbol = ?
        `).bind(row.symbol).first()

        let unrealizedPnl = 0
        if (holding) {
          const currentValue = row.quantity * row.price
          unrealizedPnl = currentValue - holding.total_invested
        }

        // Insert daily snapshot
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO daily_snapshots (
            asset_symbol, 
            snapshot_date, 
            quantity, 
            price_per_unit, 
            total_value, 
            unrealized_pnl
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          row.symbol,
          row.date,
          row.quantity,
          row.price,
          row.totalValue,
          unrealizedPnl
        ).run()

        insertCount++
      }

      // STEP 3: Update asset prices with latest from CSV
      console.log('💰 Updating current asset prices...')
      const latestPrices = new Map()
      
      // Find latest date for each symbol
      csvData.forEach(row => {
        if (!latestPrices.has(row.symbol) || row.date > latestPrices.get(row.symbol).date) {
          latestPrices.set(row.symbol, row)
        }
      })

      let priceUpdateCount = 0
      for (const [symbol, data] of latestPrices) {
        await c.env.DB.prepare(`
          UPDATE assets 
          SET current_price = ?, price_updated_at = CURRENT_TIMESTAMP
          WHERE symbol = ?
        `).bind(data.price, symbol).run()
        priceUpdateCount++
      }

      // Commit transaction
      await c.env.DB.prepare('COMMIT').run()

      const summary = {
        success: true,
        message: 'Historial importado exitosamente',
        stats: {
          csv_rows_processed: csvData.length,
          snapshots_deleted: deleteResult.changes,
          snapshots_created: insertCount,
          prices_updated: priceUpdateCount,
          parsing_errors: errors.length
        },
        date_range: {
          from: Math.min(...csvData.map(r => r.date)),
          to: Math.max(...csvData.map(r => r.date))
        },
        assets_imported: [...new Set(csvData.map(r => r.symbol))].sort()
      }

      console.log('✅ CSV import completed successfully:', summary.stats)
      return c.json(summary)

    } catch (error) {
      // Rollback on error
      await c.env.DB.prepare('ROLLBACK').run()
      throw error
    }

  } catch (error) {
    console.error('❌ CSV import failed:', error)
    return c.json({
      success: false,
      error: 'Error procesando archivo CSV',
      details: error.message
    }, 500)
  }
})

// Get import history/status
app.get('/api/import/status', async (c) => {
  try {
    // Get snapshot statistics
    const snapshotStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_snapshots,
        COUNT(DISTINCT asset_symbol) as unique_assets,
        MIN(snapshot_date) as oldest_date,
        MAX(snapshot_date) as newest_date
      FROM daily_snapshots
    `).first()

    // Get recent snapshots by asset
    const recentSnapshots = await c.env.DB.prepare(`
      SELECT 
        asset_symbol,
        MAX(snapshot_date) as last_snapshot,
        COUNT(*) as snapshot_count
      FROM daily_snapshots
      GROUP BY asset_symbol
      ORDER BY asset_symbol
    `).all()

    return c.json({
      success: true,
      statistics: snapshotStats,
      assets: recentSnapshots.results || []
    })

  } catch (error) {
    return c.json({
      success: false,
      error: 'Error obteniendo estado de importación',
      details: error.message
    }, 500)
  }
})

// ============================================
// WATCHLIST PAGE
// ============================================

app.get('/watchlist', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - Watchlist</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-slate-700 bg-opacity-50 min-h-screen">
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-12">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-4">
                                <!-- Logo GusBit con tipografía y spacing optimizados -->
                                <div class="flex flex-col items-start">
                                    <!-- GB con formas exactas y spacing perfecto -->
                                    <div class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 3.2rem; line-height: 0.75; letter-spacing: -0.08em;">
                                        <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GB</span>
                                    </div>
                                    
                                    <!-- GusBit con el mismo estilo tipográfico -->
                                    <div class="-mt-1">
                                        <h1 class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 1.8rem; line-height: 0.9; letter-spacing: -0.03em; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                                            GusBit
                                        </h1>
                                        
                                        <!-- Tagline con spacing perfecto -->
                                        <div class="text-white leading-tight" style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.6rem; letter-spacing: 0.12em; line-height: 1.1; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            TRACK STOCKS<br>
                                            ETFS &amp; CRYPTO
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-line mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-briefcase mr-2"></i>
                                Portfolio
                            </a>
                            <a href="/import" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-upload mr-2"></i>
                                Importar
                            </a>
                            <a href="/prices" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-area mr-2"></i>
                                Markets
                            </a>
                            <a href="/watchlist" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm">
                                <i class="fas fa-star mr-2"></i>
                                Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 transition-all font-medium text-sm">
                        <i class="fas fa-power-off mr-2"></i>
                        Salir
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-8">
            <!-- Header -->
            <div class="glass-card p-8 mb-8">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
                            <i class="fas fa-star mr-3 text-yellow-500"></i>
                            Mi Watchlist
                        </h2>
                        <p class="executive-text-primary">Sigue el rendimiento de tus activos favoritos y recibe alertas cuando alcancen tus precios objetivo.</p>
                    </div>
                    <div class="flex space-x-3">
                        <a href="/prices" class="btn-primary">
                            <i class="fas fa-plus mr-2"></i>
                            Agregar Activos
                        </a>
                        <button onclick="refreshWatchlist()" class="btn-secondary" id="refreshBtn">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div id="loadingState" class="glass-card p-8">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
                    <p class="executive-text-primary">Cargando watchlist...</p>
                </div>
            </div>

            <!-- Empty State -->
            <div id="emptyState" class="hidden glass-card p-12 text-center">
                <i class="fas fa-star text-6xl text-gray-400 mb-6"></i>
                <h3 class="text-xl font-semibold executive-text-primary mb-3">Tu watchlist está vacío</h3>
                <p class="text-gray-500 mb-6">Agrega activos a tu watchlist para seguir su rendimiento</p>
                <a href="/prices" class="btn-primary">
                    <i class="fas fa-search mr-2"></i>
                    Explorar Activos
                </a>
            </div>

            <!-- Watchlist Content -->
            <div id="watchlistContent" class="hidden">
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="glass-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium executive-text-primary">Total Activos</p>
                                <p class="text-2xl font-bold text-blue-600" id="totalAssets">0</p>
                            </div>
                            <i class="fas fa-list text-2xl text-blue-500"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium executive-text-primary">Por Encima del Objetivo</p>
                                <p class="text-2xl font-bold text-green-600" id="aboveTarget">0</p>
                            </div>
                            <i class="fas fa-arrow-up text-2xl text-green-500"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium executive-text-primary">Por Debajo del Objetivo</p>
                                <p class="text-2xl font-bold text-red-600" id="belowTarget">0</p>
                            </div>
                            <i class="fas fa-arrow-down text-2xl text-red-500"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium executive-text-primary">Sin Objetivo</p>
                                <p class="text-2xl font-bold executive-text-primary" id="noTarget">0</p>
                            </div>
                            <i class="fas fa-minus text-2xl text-gray-500"></i>
                        </div>
                    </div>
                </div>

                <!-- Watchlist Table -->
                <div class="glass-card p-8">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-semibold text-gray-800">Activos en Seguimiento</h3>
                        <div class="flex items-center space-x-4">
                            <select id="categoryFilter" class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all">
                                <option value="">Todas las categorías</option>
                                <option value="stocks">Acciones</option>
                                <option value="crypto">Crypto</option>
                                <option value="etfs">ETFs</option>
                            </select>
                            <select id="sortBy" class="form-select">
                                <option value="added_at">Fecha agregado</option>
                                <option value="name">Nombre</option>
                                <option value="price_difference">% Diferencia</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200" id="watchlistTable">
                            <thead class="bg-slate-700 bg-opacity-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Actual</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Objetivo</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diferencia</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200" id="watchlistTableBody">
                                <!-- Data will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        <div id="editModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold mb-4">Editar Watchlist</h3>
                <form id="editForm">
                    <input type="hidden" id="editSymbol">
                    <div class="mb-4">
                        <label class="form-label">Precio Objetivo (USD)</label>
                        <input type="number" id="editTargetPrice" class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all" step="0.01" placeholder="Ej: 150.00">
                    </div>
                    <div class="mb-6">
                        <label class="form-label">Notas</label>
                        <textarea id="editNotes" class="w-full px-6 py-4 bg-slate-700 bg-opacity-50 border border-blue-500 border-opacity-30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-opacity-70 transition-all resize-none" rows="3" placeholder="Notas opcionales..."></textarea>
                    </div>
                    <div class="flex space-x-3">
                        <button type="submit" class="btn-primary flex-1">Guardar</button>
                        <button type="button" onclick="closeEditModal()" class="btn-secondary flex-1">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>

        <script>
            let watchlistData = [];
            
            // Initialize page
            document.addEventListener('DOMContentLoaded', function() {
                loadWatchlist();
                
                // Event listeners
                document.getElementById('categoryFilter').addEventListener('change', renderWatchlist);
                document.getElementById('sortBy').addEventListener('change', renderWatchlist);
                document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
            });
            
            // Load watchlist data
            async function loadWatchlist() {
                try {
                    const response = await axios.get('/api/watchlist');
                    watchlistData = response.data.watchlist;
                    
                    document.getElementById('loadingState').classList.add('hidden');
                    
                    if (watchlistData.length === 0) {
                        document.getElementById('emptyState').classList.remove('hidden');
                    } else {
                        document.getElementById('watchlistContent').classList.remove('hidden');
                        updateStats();
                        renderWatchlist();
                    }
                } catch (error) {
                    console.error('Error loading watchlist:', error);
                    document.getElementById('loadingState').innerHTML = \`
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
                            <p class="text-red-600">Error cargando watchlist</p>
                        </div>
                    \`;
                }
            }
            
            // Update stats
            function updateStats() {
                const total = watchlistData.length;
                let aboveTarget = 0;
                let belowTarget = 0;
                let noTarget = 0;
                
                watchlistData.forEach(item => {
                    if (!item.target_price) {
                        noTarget++;
                    } else if (item.current_price > item.target_price) {
                        aboveTarget++;
                    } else {
                        belowTarget++;
                    }
                });
                
                document.getElementById('totalAssets').textContent = total;
                document.getElementById('aboveTarget').textContent = aboveTarget;
                document.getElementById('belowTarget').textContent = belowTarget;
                document.getElementById('noTarget').textContent = noTarget;
            }
            
            // Render watchlist table
            function renderWatchlist() {
                const categoryFilter = document.getElementById('categoryFilter').value;
                const sortBy = document.getElementById('sortBy').value;
                
                let filteredData = watchlistData;
                
                // Filter by category
                if (categoryFilter) {
                    filteredData = filteredData.filter(item => item.category === categoryFilter);
                }
                
                // Sort data
                filteredData.sort((a, b) => {
                    switch (sortBy) {
                        case 'name':
                            return a.name.localeCompare(b.name);
                        case 'price_difference':
                            return (b.price_difference_percent || -999) - (a.price_difference_percent || -999);
                        default:
                            return new Date(b.added_at) - new Date(a.added_at);
                    }
                });
                
                const tbody = document.getElementById('watchlistTableBody');
                tbody.innerHTML = filteredData.map(item => \`
                    <tr class="hover:bg-slate-700 bg-opacity-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div>
                                    <div class="text-sm font-medium text-gray-900">\${item.asset_symbol}</div>
                                    <div class="text-sm text-gray-500">\${item.name}</div>
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium \${getCategoryClass(item.category)}">
                                        \${item.category.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">
                                $\${item.current_price ? parseFloat(item.current_price).toLocaleString('en-US', {minimumFractionDigits: 2}) : 'N/A'}
                            </div>
                            <div class="text-xs text-gray-500">
                                \${item.price_updated_at ? new Date(item.price_updated_at).toLocaleString('es-ES') : 'Sin actualizar'}
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">
                                \${item.target_price ? '$' + parseFloat(item.target_price).toLocaleString('en-US', {minimumFractionDigits: 2}) : 'Sin objetivo'}
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            \${getDifferenceDisplay(item)}
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm text-gray-900 max-w-xs truncate">
                                \${item.notes || '-'}
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex space-x-2">
                                <button onclick="editWatchlistItem('\${item.asset_symbol}')" class="text-blue-600 hover:text-blue-900">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="removeFromWatchlist('\${item.asset_symbol}')" class="text-red-600 hover:text-red-900">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button onclick="viewAsset('\${item.asset_symbol}', '\${item.name}', '\${item.category}')" class="text-green-600 hover:text-green-900">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                \`).join('');
            }
            
            // Get category class
            function getCategoryClass(category) {
                switch (category) {
                    case 'crypto': return 'bg-blue-100 text-blue-800';
                    case 'stocks': return 'bg-green-100 text-green-800';
                    case 'etfs': return 'bg-purple-100 text-purple-800';
                    default: return 'bg-gray-100 text-gray-800';
                }
            }
            
            // Get difference display
            function getDifferenceDisplay(item) {
                if (!item.target_price || !item.current_price) {
                    return '<span class="text-gray-500">-</span>';
                }
                
                const diff = item.price_difference_percent;
                const isPositive = diff > 0;
                const color = isPositive ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'executive-text-primary';
                const icon = isPositive ? 'fa-arrow-up' : diff < 0 ? 'fa-arrow-down' : 'fa-minus';
                
                return \`
                    <div class="flex items-center \${color}">
                        <i class="fas \${icon} mr-1"></i>
                        <span class="font-medium">\${Math.abs(diff).toFixed(2)}%</span>
                    </div>
                \`;
            }
            
            // Edit watchlist item
            function editWatchlistItem(symbol) {
                const item = watchlistData.find(i => i.asset_symbol === symbol);
                if (!item) return;
                
                document.getElementById('editSymbol').value = symbol;
                document.getElementById('editTargetPrice').value = item.target_price || '';
                document.getElementById('editNotes').value = item.notes || '';
                document.getElementById('editModal').classList.remove('hidden');
            }
            
            // Close edit modal
            function closeEditModal() {
                document.getElementById('editModal').classList.add('hidden');
            }
            
            // Handle edit form submit
            async function handleEditSubmit(e) {
                e.preventDefault();
                
                const symbol = document.getElementById('editSymbol').value;
                const targetPrice = document.getElementById('editTargetPrice').value;
                const notes = document.getElementById('editNotes').value;
                
                try {
                    const response = await axios.put(\`/api/watchlist/\${symbol}\`, {
                        target_price: targetPrice ? parseFloat(targetPrice) : null,
                        notes: notes || null
                    });
                    
                    if (response.data.success) {
                        closeEditModal();
                        showNotification('Watchlist actualizado', 'success');
                        loadWatchlist();
                    }
                } catch (error) {
                    console.error('Error updating watchlist:', error);
                    showNotification('Error al actualizar', 'error');
                }
            }
            
            // Remove from watchlist
            async function removeFromWatchlist(symbol) {
                if (!confirm('¿Estás seguro de que quieres eliminar este activo del watchlist?')) {
                    return;
                }
                
                try {
                    const response = await axios.delete(\`/api/watchlist/\${symbol}\`);
                    
                    if (response.data.success) {
                        showNotification('Activo eliminado del watchlist', 'success');
                        loadWatchlist();
                    }
                } catch (error) {
                    console.error('Error removing from watchlist:', error);
                    showNotification('Error al eliminar', 'error');
                }
            }
            
            // Refresh watchlist
            async function refreshWatchlist() {
                const refreshBtn = document.getElementById('refreshBtn');
                const originalHTML = refreshBtn.innerHTML;
                
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Actualizando...';
                refreshBtn.disabled = true;
                
                await loadWatchlist();
                
                refreshBtn.innerHTML = originalHTML;
                refreshBtn.disabled = false;
            }
            
            // View asset details
            function viewAsset(symbol, name, category) {
                // Check if we have this asset in our wallet (holdings)
                // If yes, go to wallet view; if no, go to exploration view
                
                // For now, we'll go to exploration view since these are watchlist items
                const params = new URLSearchParams({
                    name: name,
                    category: category,
                    source: category === 'crypto' ? 'coingecko' : 'alphavantage',
                    from: 'watchlist'
                });
                
                window.location.href = \`/asset/\${encodeURIComponent(symbol)}?\${params.toString()}\`;
            }
            
            // Show notification
            function showNotification(message, type = 'info') {
                const notification = document.createElement('div');
                notification.className = \`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 \${
                    type === 'success' ? 'bg-green-500 text-white' :
                    type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                }\`;
                notification.innerHTML = \`
                    <div class="flex items-center">
                        <i class="fas fa-\${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                        \${message}
                    </div>
                \`;
                
                document.body.appendChild(notification);
                
                // Remove after 4 seconds
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 4000);
            }
            
            // Logout function
            async function logout() {
                try {
                    await axios.post('/api/auth/logout');
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Error during logout:', error);
                    window.location.href = '/login';
                }
            }
        </script>
    </body>
    </html>
  `)
})

// ============================================
// CSV IMPORT PAGE
// ============================================

app.get('/import', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - Importar Historial</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-slate-700 bg-opacity-50 min-h-screen">
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-12">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-4">
                                <!-- Logo GusBit con tipografía y spacing optimizados -->
                                <div class="flex flex-col items-start">
                                    <!-- GB con formas exactas y spacing perfecto -->
                                    <div class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 3.2rem; line-height: 0.75; letter-spacing: -0.08em;">
                                        <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GB</span>
                                    </div>
                                    
                                    <!-- GusBit con el mismo estilo tipográfico -->
                                    <div class="-mt-1">
                                        <h1 class="text-white leading-none mb-1" style="font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 1.8rem; line-height: 0.9; letter-spacing: -0.03em; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                                            GusBit
                                        </h1>
                                        
                                        <!-- Tagline con spacing perfecto -->
                                        <div class="text-white leading-tight" style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.6rem; letter-spacing: 0.12em; line-height: 1.1; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            TRACK STOCKS<br>
                                            ETFS &amp; CRYPTO
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-line mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-briefcase mr-2"></i>
                                Portfolio
                            </a>
                            <a href="/import" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm">
                                <i class="fas fa-upload mr-2"></i>
                                Importar
                            </a>
                            <a href="/prices" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-chart-area mr-2"></i>
                                Markets
                            </a>
                            <a href="/watchlist" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm">
                                <i class="fas fa-star mr-2"></i>
                                Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 transition-all font-medium text-sm">
                        <i class="fas fa-power-off mr-2"></i>
                        Salir
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-4xl mx-auto px-6 py-8">
            <!-- Header -->
            <div class="glass-card p-8 mb-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
                        <i class="fas fa-file-upload mr-3 text-blue-600"></i>
                        Importar Historial CSV
                    </h2>
                    <p class="executive-text-primary">Reemplaza el historial completo con nuevos datos de un archivo CSV</p>
                </div>
            </div>

            <!-- Warning Notice -->
            <div class="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-amber-400 text-xl"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-lg font-medium text-amber-800">⚠️ Advertencia Importante</h3>
                        <div class="mt-2 text-sm text-amber-700">
                            <ul class="list-disc list-inside space-y-1">
                                <li><strong>Se borrará todo el historial diario existente</strong> (daily_snapshots)</li>
                                <li><strong>Las transacciones NO se verán afectadas</strong> (se mantienen intactas)</li>
                                <li>Esta acción <strong>no se puede deshacer</strong></li>
                                <li>Recomendamos hacer una copia de seguridad antes de continuar</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Import Status -->
            <div id="importStatus" class="hidden mb-8"></div>

            <!-- Upload Form -->
            <div class="glass-card p-8 mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-6">
                    <i class="fas fa-upload mr-2 text-blue-600"></i>
                    Subir Archivo CSV
                </h3>
                
                <form id="csvUploadForm" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Seleccionar archivo CSV
                        </label>
                        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                            <div class="space-y-1 text-center">
                                <i class="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                                <div class="flex text-sm text-gray-600">
                                    <label for="csvFile" class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                        <span>Subir archivo</span>
                                        <input id="csvFile" name="csvFile" type="file" accept=".csv" class="sr-only" required>
                                    </label>
                                    <p class="pl-1">o arrastra aquí</p>
                                </div>
                                <p class="text-xs text-gray-500">CSV hasta 10MB</p>
                            </div>
                        </div>
                        <div id="fileInfo" class="mt-2 text-sm text-gray-600 hidden"></div>
                    </div>

                    <div class="flex justify-between">
                        <button type="button" onclick="downloadTemplate()" class="btn-secondary">
                            <i class="fas fa-download mr-2"></i>
                            Descargar Plantilla
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-upload mr-2"></i>
                            Importar CSV
                        </button>
                    </div>
                </form>
            </div>

            <!-- Expected Format -->
            <div class="glass-card p-8 mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">
                    <i class="fas fa-table mr-2 text-green-600"></i>
                    Formato Esperado del CSV
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left">FECHA</th>
                                <th class="px-4 py-2 text-left">MONEDA</th>
                                <th class="px-4 py-2 text-left">TOTAL Cantidad</th>
                                <th class="px-4 py-2 text-left">Precio final 9 PM</th>
                                <th class="px-4 py-2 text-left">Valor USD</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-t">
                                <td class="px-4 py-2">15/01/24</td>
                                <td class="px-4 py-2">Bitcoin</td>
                                <td class="px-4 py-2">0.0025</td>
                                <td class="px-4 py-2">42500.00</td>
                                <td class="px-4 py-2">106.25</td>
                            </tr>
                            <tr class="border-t bg-gray-50">
                                <td class="px-4 py-2">15/01/24</td>
                                <td class="px-4 py-2">AAPL</td>
                                <td class="px-4 py-2">10</td>
                                <td class="px-4 py-2">185.50</td>
                                <td class="px-4 py-2">1855.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="mt-4 text-sm text-gray-600">
                    <p><strong>Notas importantes:</strong></p>
                    <ul class="list-disc list-inside mt-2 space-y-1">
                        <li>Formato de fecha: DD/MM/YY (ej: 15/01/24)</li>
                        <li>MONEDA debe ser el símbolo del activo (Bitcoin, BTC, AAPL, etc.)</li>
                        <li>Números con punto decimal (ej: 42500.00)</li>
                        <li>Una fila por activo por fecha</li>
                    </ul>
                </div>
            </div>

            <!-- Current Status -->
            <div class="glass-card p-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">
                    <i class="fas fa-info-circle mr-2 text-blue-600"></i>
                    Estado Actual del Historial
                </h3>
                <div id="currentStatus">
                    <div class="text-center py-4">
                        <i class="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
                        <p class="mt-2 text-gray-600">Cargando estado actual...</p>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Load current status on page load
            document.addEventListener('DOMContentLoaded', function() {
                loadCurrentStatus();
                
                // File input change handler
                document.getElementById('csvFile').addEventListener('change', handleFileSelect);
                
                // Form submit handler
                document.getElementById('csvUploadForm').addEventListener('submit', handleFormSubmit);
            });

            // Load current import status
            async function loadCurrentStatus() {
                try {
                    const response = await axios.get('/api/import/status');
                    const data = response.data;
                    
                    if (data.success) {
                        displayCurrentStatus(data.statistics, data.assets);
                    }
                } catch (error) {
                    console.error('Error loading current status:', error);
                    document.getElementById('currentStatus').innerHTML = 
                        '<div class="text-center text-red-600"><i class="fas fa-exclamation-triangle"></i> Error cargando estado</div>';
                }
            }

            // Display current status
            function displayCurrentStatus(stats, assets) {
                const container = document.getElementById('currentStatus');
                
                if (stats.total_snapshots === 0) {
                    container.innerHTML = 
                        '<div class="text-center py-8 text-gray-500">' +
                            '<i class="fas fa-inbox text-4xl mb-4"></i>' +
                            '<p>No hay historial importado</p>' +
                        '</div>';
                    return;
                }

                const html = 
                    '<div class="grid md:grid-cols-2 gap-6">' +
                        '<div class="bg-blue-50 p-4 rounded-lg">' +
                            '<h4 class="font-semibold text-blue-800 mb-2">Estadísticas Generales</h4>' +
                            '<div class="space-y-2 text-sm">' +
                                '<div class="flex justify-between"><span>Total snapshots:</span><span class="font-medium">' + stats.total_snapshots + '</span></div>' +
                                '<div class="flex justify-between"><span>Activos únicos:</span><span class="font-medium">' + stats.unique_assets + '</span></div>' +
                                '<div class="flex justify-between"><span>Fecha más antigua:</span><span class="font-medium">' + stats.oldest_date + '</span></div>' +
                                '<div class="flex justify-between"><span>Fecha más reciente:</span><span class="font-medium">' + stats.newest_date + '</span></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="bg-green-50 p-4 rounded-lg">' +
                            '<h4 class="font-semibold text-green-800 mb-2">Activos en Historial</h4>' +
                            '<div class="space-y-1 text-sm max-h-32 overflow-y-auto">' +
                                assets.map(asset => 
                                    '<div class="flex justify-between"><span>' + asset.asset_symbol + '</span>' +
                                    '<span class="text-xs text-gray-600">' + asset.snapshot_count + ' registros</span></div>'
                                ).join('') +
                            '</div>' +
                        '</div>' +
                    '</div>';
                
                container.innerHTML = html;
            }

            // Handle file selection
            function handleFileSelect(event) {
                const file = event.target.files[0];
                const fileInfo = document.getElementById('fileInfo');
                
                if (file) {
                    const fileSize = (file.size / 1024 / 1024).toFixed(2);
                    fileInfo.innerHTML = '<i class="fas fa-file-csv mr-1"></i>' + file.name + ' (' + fileSize + ' MB)';
                    fileInfo.classList.remove('hidden');
                } else {
                    fileInfo.classList.add('hidden');
                }
            }

            // Handle form submission
            async function handleFormSubmit(event) {
                event.preventDefault();
                
                const fileInput = document.getElementById('csvFile');
                const file = fileInput.files[0];
                
                if (!file) {
                    alert('Por favor selecciona un archivo CSV');
                    return;
                }

                // Show confirmation dialog
                const confirmed = confirm(
                    '¿Estás seguro de que quieres importar este CSV?\\n\\n' +
                    '⚠️ ADVERTENCIA:\\n' +
                    '• Se borrará todo el historial diario existente\\n' +
                    '• Esta acción no se puede deshacer\\n' +
                    '• Las transacciones NO se verán afectadas'
                );
                
                if (!confirmed) return;

                // Prepare form data
                const formData = new FormData();
                formData.append('csv_file', file);

                // Show loading status
                showImportStatus('loading', 'Procesando archivo CSV...');

                try {
                    const response = await axios.post('/api/import/csv', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    const data = response.data;
                    
                    if (data.success) {
                        showImportStatus('success', 'Importación exitosa', data);
                        // Reload current status
                        loadCurrentStatus();
                        // Clear form
                        fileInput.value = '';
                        document.getElementById('fileInfo').classList.add('hidden');
                    } else {
                        showImportStatus('error', data.error, data);
                    }
                    
                } catch (error) {
                    console.error('Import error:', error);
                    const errorMsg = error.response?.data?.error || 'Error procesando archivo';
                    showImportStatus('error', errorMsg, error.response?.data);
                }
            }

            // Show import status message
            function showImportStatus(type, message, data = null) {
                const container = document.getElementById('importStatus');
                container.classList.remove('hidden');
                
                let bgColor, textColor, icon;
                
                if (type === 'loading') {
                    bgColor = 'bg-blue-50';
                    textColor = 'text-blue-800';
                    icon = '<i class="fas fa-spinner fa-spin text-blue-600"></i>';
                } else if (type === 'success') {
                    bgColor = 'bg-green-50';
                    textColor = 'text-green-800';
                    icon = '<i class="fas fa-check-circle text-green-600"></i>';
                } else {
                    bgColor = 'bg-red-50';
                    textColor = 'text-red-800';
                    icon = '<i class="fas fa-exclamation-triangle text-red-600"></i>';
                }

                let detailsHtml = '';
                if (data && type === 'success' && data.stats) {
                    detailsHtml = 
                        '<div class="mt-4 text-sm">' +
                            '<h4 class="font-semibold mb-2">Resumen de importación:</h4>' +
                            '<div class="grid grid-cols-2 gap-4">' +
                                '<div>• Filas procesadas: ' + data.stats.csv_rows_processed + '</div>' +
                                '<div>• Snapshots creados: ' + data.stats.snapshots_created + '</div>' +
                                '<div>• Snapshots eliminados: ' + data.stats.snapshots_deleted + '</div>' +
                                '<div>• Precios actualizados: ' + data.stats.prices_updated + '</div>' +
                            '</div>' +
                            '<div class="mt-2">' +
                                '<strong>Período:</strong> ' + data.date_range.from + ' a ' + data.date_range.to + '<br>' +
                                '<strong>Activos:</strong> ' + data.assets_imported.join(', ') +
                            '</div>' +
                        '</div>';
                }

                container.innerHTML = 
                    '<div class="' + bgColor + ' border border-' + (type === 'loading' ? 'blue' : type === 'success' ? 'green' : 'red') + '-200 rounded-lg p-6">' +
                        '<div class="flex items-start">' +
                            '<div class="flex-shrink-0">' + icon + '</div>' +
                            '<div class="ml-3">' +
                                '<h3 class="text-lg font-medium ' + textColor + '">' + message + '</h3>' +
                                detailsHtml +
                            '</div>' +
                        '</div>' +
                    '</div>';
            }

            // Download CSV template
            function downloadTemplate() {
                const csvContent = 
                    'FECHA,MONEDA,TOTAL Cantidad,Precio final 9 PM,Valor USD\\n' +
                    '15/01/24,Bitcoin,0.0025,42500.00,106.25\\n' +
                    '15/01/24,AAPL,10,185.50,1855.00\\n' +
                    '16/01/24,Bitcoin,0.0025,43200.00,108.00\\n' +
                    '16/01/24,AAPL,10,188.20,1882.00';
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'plantilla_importacion.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }

            // Logout function
            async function logout() {
                try {
                    await axios.post('/api/auth/logout');
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Error during logout:', error);
                    window.location.href = '/login';
                }
            }
        </script>
    </body>
    </html>
  `)
})

// Cron Handler for Cloudflare Workers (triggered by wrangler.jsonc crons)
// This will be called automatically at 3 AM UTC (9 PM Mazatlán DST) and 4 AM UTC (9 PM Mazatlán Standard)
export default {
  ...app,
  
  // Scheduled handler for cron triggers
  async scheduled(controller, env, ctx) {
    console.log('🕘 Cron trigger activated for daily snapshots')
    
    // Use waitUntil to ensure the async work completes
    ctx.waitUntil(processAllDailySnapshots(env.DB))
  },
  
  // Regular fetch handler
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx)
  }
}