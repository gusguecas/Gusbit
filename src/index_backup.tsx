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
  
  // Skip auth for login page and API login endpoint
  if (url.pathname === '/login' || url.pathname === '/api/auth/login') {
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
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-900 to-purple-900 min-h-screen flex items-center justify-center">
        <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <div class="text-center mb-8">
                <div class="text-4xl font-black text-blue-600 mb-4 bg-blue-100 rounded-lg p-4 inline-block">GB</div>
                <h1 class="text-3xl font-bold text-gray-800">GusBit</h1>
                <p class="text-gray-600 mt-2">Track Stocks, ETFs & Crypto</p>
            </div>
            
            <form id="loginForm" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña de Acceso</label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="password" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ingresa tu contraseña"
                            required
                        >
                        <i class="fas fa-lock absolute right-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    Acceder
                </button>
                
                <div id="error-message" class="text-red-600 text-sm text-center hidden"></div>
            </form>
        </div>
        
        <script>
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
        sameSite: 'Strict',
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
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="min-h-screen">
        <link href="/static/styles.css" rel="stylesheet">
        
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-6 py-6">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-8">
                        <div class="flex items-center space-x-4">
                            <h1 class="text-2xl font-bold text-white flex items-center">
                                <span class="text-3xl font-black mr-3 bg-white text-blue-600 px-2 py-1 rounded-lg">GB</span>
                                GusBit
                            </h1>
                            <p class="text-white text-sm opacity-75 hidden lg:block">Track Stocks, ETFs & Crypto</p>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="nav-link active">
                                <i class="fas fa-tachometer-alt mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="nav-link">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="nav-link">
                                <i class="fas fa-wallet mr-2"></i>
                                Wallet
                            </a>
                            <a href="/prices" class="nav-link">
                                <i class="fas fa-search-dollar mr-2"></i>
                                Precios en Vivo
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="nav-link hover:bg-red-500">
                        <i class="fas fa-sign-out-alt mr-2"></i>
                        Salir
                    </button>
                </div>
            </div>
        </nav>

        <div class="content-wrapper max-w-7xl mx-auto">

        <!-- Main Content -->
        <div class="px-8 py-8">
            <!-- Header -->
            <div class="mb-8 animate-fadeInUp">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Dashboard Principal</h2>
                <p class="text-gray-600">Resumen de tu cartera de inversiones</p>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 animate-slideInLeft">
                <div class="asset-card">
                    <div class="p-8">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Invertido</p>
                                <p id="total-invested" class="text-3xl font-bold text-gray-800">$0.00</p>
                            </div>
                            <div class="bg-blue-100 p-4 rounded-full">
                                <i class="fas fa-dollar-sign text-2xl text-blue-600"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="asset-card">
                    <div class="p-8">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Valor Actual</p>
                                <p id="current-value" class="text-3xl font-bold text-gray-800">$0.00</p>
                            </div>
                            <div class="bg-green-100 p-4 rounded-full">
                                <i class="fas fa-chart-line text-2xl text-green-600"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="asset-card">
                    <div class="p-8">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">PnL Total</p>
                                <p id="total-pnl" class="text-3xl font-bold">$0.00</p>
                            </div>
                            <div id="pnl-icon" class="bg-gray-100 p-4 rounded-full">
                                <i class="fas fa-balance-scale text-2xl text-gray-600"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <!-- Diversification Chart -->
                <div class="asset-card animate-fadeInUp">
                    <div class="p-8">
                        <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                            <div class="bg-blue-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-pie-chart text-blue-600"></i>
                            </div>
                            Diversificación de Portfolio
                        </h2>
                        <div class="flex justify-center">
                            <canvas id="diversificationChart" width="400" height="400"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class="asset-card animate-fadeInUp">
                    <div class="p-8">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-xl font-bold text-gray-800 flex items-center">
                                <div class="bg-blue-100 p-2 rounded-lg mr-3">
                                    <i class="fas fa-history text-blue-600"></i>
                                </div>
                                Últimos Movimientos
                            </h2>
                            <a href="/transactions" class="btn-modern-primary text-sm px-4 py-2">
                                Ver todos <i class="fas fa-arrow-right ml-2"></i>
                            </a>
                        </div>
                        <div id="recent-transactions" class="overflow-x-auto">
                            <!-- Transactions will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>

        <script>
            // Global variables
            let diversificationChart = null;

            // Load dashboard data
            async function loadDashboard() {
                try {
                    // Load portfolio summary
                    const summaryResponse = await axios.get('/api/portfolio/summary');
                    const summary = summaryResponse.data;

                    // Update KPIs
                    document.getElementById('total-invested').textContent = 
                        '$' + summary.totalInvested.toLocaleString('en-US', {minimumFractionDigits: 2});
                    document.getElementById('current-value').textContent = 
                        '$' + summary.currentValue.toLocaleString('en-US', {minimumFractionDigits: 2});
                    
                    const pnlElement = document.getElementById('total-pnl');
                    const pnlIconElement = document.getElementById('pnl-icon');
                    pnlElement.textContent = '$' + summary.totalPnL.toLocaleString('en-US', {minimumFractionDigits: 2});
                    
                    // Update PnL color
                    if (summary.totalPnL > 0) {
                        pnlElement.className = 'text-2xl font-bold text-green-600';
                        pnlIconElement.className = 'bg-green-100 p-3 rounded-full';
                        pnlIconElement.innerHTML = '<i class="fas fa-arrow-up text-green-600"></i>';
                    } else if (summary.totalPnL < 0) {
                        pnlElement.className = 'text-2xl font-bold text-red-600';
                        pnlIconElement.className = 'bg-red-100 p-3 rounded-full';
                        pnlIconElement.innerHTML = '<i class="fas fa-arrow-down text-red-600"></i>';
                    }

                    // Load diversification data
                    const diversificationResponse = await axios.get('/api/portfolio/diversification');
                    const diversification = diversificationResponse.data;
                    
                    updateDiversificationChart(diversification);

                    // Load recent transactions
                    const transactionsResponse = await axios.get('/api/transactions/recent');
                    const transactions = transactionsResponse.data;
                    
                    displayRecentTransactions(transactions);

                } catch (error) {
                    console.error('Error loading dashboard:', error);
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

            // Display recent transactions
            function displayRecentTransactions(transactions) {
                const container = document.getElementById('recent-transactions');
                
                if (transactions.length === 0) {
                    container.innerHTML = '<div class="text-center py-8"><i class="fas fa-receipt text-4xl text-gray-300 mb-4"></i><p class="text-gray-500">No hay transacciones recientes</p></div>';
                    return;
                }

                const tableHTML = \`
                    <table class="table-modern w-full">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Activo</th>
                                <th>Cantidad</th>
                                <th>Precio</th>
                                <th>Total</th>
                                <th>Exchange</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${transactions.map(tx => \`
                                <tr>
                                    <td class="text-gray-600 font-medium">
                                        \${new Date(tx.transaction_date).toLocaleDateString('es-ES')}
                                    </td>
                                    <td>
                                        <span class="transaction-badge \${
                                            tx.type === 'buy' ? 'badge-buy' : 
                                            tx.type === 'sell' ? 'badge-sell' : 
                                            'badge-trade'
                                        }">
                                            <i class="fas \${
                                                tx.type === 'buy' ? 'fa-arrow-up' : 
                                                tx.type === 'sell' ? 'fa-arrow-down' : 
                                                'fa-exchange-alt'
                                            } mr-1"></i>
                                            \${tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venta' : 'Trade'}
                                        </span>
                                    </td>
                                    <td class="font-semibold text-gray-800">\${tx.asset_symbol}</td>
                                    <td class="text-gray-600">\${parseFloat(tx.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}</td>
                                    <td class="text-gray-600 font-medium">$\${parseFloat(tx.price_per_unit).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    <td class="text-gray-800 font-semibold">$\${parseFloat(tx.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    <td class="text-gray-500">\${tx.exchange}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
                
                container.innerHTML = tableHTML;
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
            document.addEventListener('DOMContentLoaded', loadDashboard);
        </script>
    </body>
    </html>
  `)
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
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
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
                            <a href="/" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                            </a>
                            <a href="/transactions" class="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">
                                <i class="fas fa-exchange-alt mr-1"></i>Transacciones
                            </a>
                            <a href="/wallet" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-wallet mr-1"></i>Wallet
                            </a>
                            <a href="/prices" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-search-dollar mr-1"></i>Precios en Vivo
                            </a>
                            <a href="/watchlist" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-star mr-1"></i>Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="text-gray-600 hover:text-red-600">
                        <i class="fas fa-sign-out-alt mr-1"></i>Salir
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-8">
            <!-- Add Transaction Form -->
            <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 class="text-xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-plus-circle mr-2 text-blue-600"></i>
                    Registrar Nueva Transacción
                </h2>
                
                <form id="transactionForm" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Tipo de Transacción -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Transacción</label>
                        <select id="transactionType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <option value="">Seleccionar tipo</option>
                            <option value="buy">💰 Compra (Fiat → Activo)</option>
                            <option value="sell">💵 Venta (Activo → Fiat)</option>
                            <option value="trade">🔄 Trade (Activo ↔ Activo)</option>
                        </select>
                    </div>

                    <!-- Exchange -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Exchange</label>
                        <select id="exchange" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
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
                        <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Activo</label>
                        <div class="relative">
                            <input 
                                type="text" 
                                id="assetSearch" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
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
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-arrow-right mr-1 text-red-500"></i>
                                    Activo que VENDES
                                </label>
                                <div class="relative">
                                    <input 
                                        type="text" 
                                        id="assetFromSearch" 
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10"
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
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-arrow-left mr-1 text-green-500"></i>
                                    Activo que RECIBES
                                </label>
                                <div class="relative">
                                    <input 
                                        type="text" 
                                        id="assetToSearch" 
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
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
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Cantidad que VENDES
                                </label>
                                <input 
                                    type="number" 
                                    id="quantityFrom" 
                                    step="0.00000001" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="0.00"
                                >
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Cantidad que RECIBES
                                </label>
                                <input 
                                    type="number" 
                                    id="quantityTo" 
                                    step="0.00000001" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="0.00"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Cantidad (Buy/Sell only) -->
                    <div id="quantitySection">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                        <input 
                            type="number" 
                            id="quantity" 
                            step="0.00000001" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                        >
                    </div>

                    <!-- Precio por Unidad (Buy/Sell only) -->
                    <div id="priceSection">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Precio por Unidad (USD)</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-gray-500">$</span>
                            <input 
                                type="number" 
                                id="pricePerUnit" 
                                step="0.01" 
                                class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                            >
                            <button type="button" onclick="fetchCurrentPrice()" class="absolute right-2 top-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                                <i class="fas fa-sync-alt mr-1"></i>Precio Actual
                            </button>
                        </div>
                    </div>

                    <!-- Total Amount (Auto-calculated, Buy/Sell only) -->
                    <div id="totalSection">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Total</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-gray-500">$</span>
                            <input 
                                type="text" 
                                id="totalAmount" 
                                class="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                                placeholder="0.00"
                                readonly
                            >
                        </div>
                    </div>

                    <!-- Fees -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Comisiones (USD)</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-gray-500">$</span>
                            <input 
                                type="number" 
                                id="fees" 
                                step="0.01" 
                                class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                                value="0"
                            >
                        </div>
                    </div>

                    <!-- Fecha y Hora -->
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora</label>
                        <input 
                            type="datetime-local" 
                            id="transactionDate" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                    </div>

                    <!-- Notas -->
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Notas (Opcional)</label>
                        <textarea 
                            id="notes" 
                            rows="3" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Información adicional sobre la transacción..."
                        ></textarea>
                    </div>

                    <!-- Submit Button -->
                    <div class="lg:col-span-2 flex justify-end space-x-4">
                        <button type="button" onclick="resetForm()" class="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
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
                        <span class="ml-2 text-gray-600">Cargando transacciones...</span>
                    </div>
                </div>
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
                    <div class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" 
                         onclick="\${selectFunction}('\${asset.symbol}', '\${asset.name}', '\${asset.category}', '\${asset.api_source}', '\${asset.api_id}')">
                        <div class="flex justify-between items-center">
                            <div>
                                <span class="font-medium text-gray-800">\${asset.symbol}</span>
                                <span class="text-gray-600 ml-2">\${asset.name}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
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
                if (!selectedAssetData) {
                    alert('Primero selecciona un activo');
                    return;
                }

                try {
                    const response = await axios.get(\`/api/assets/price/\${selectedAssetData.symbol}?source=\${selectedAssetData.api_source}&api_id=\${selectedAssetData.api_id}\`);
                    const { price } = response.data;
                    
                    if (price > 0) {
                        document.getElementById('pricePerUnit').value = price.toFixed(8);
                        calculateTotal();
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
                
                document.getElementById('totalAmount').value = total.toFixed(2);
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
            async function loadTransactions() {
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
                        <thead class="bg-gray-50">
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
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 text-sm text-gray-600">
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
                                    <td class="px-4 py-3 text-sm text-gray-600">\${tx.exchange}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">\${parseFloat(tx.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">$\${parseFloat(tx.price_per_unit).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">$\${parseFloat(tx.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    <td class="px-4 py-3">
                                        <button onclick="deleteTransaction(\${tx.id})" class="text-red-600 hover:text-red-800 text-sm">
                                            <i class="fas fa-trash"></i>
                                        </button>
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

            // Show all transactions (placeholder)
            function showAllTransactions() {
                alert('Función para ver todas las transacciones - En desarrollo');
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
    
    // Generate daily snapshots from July 21, 2025 to yesterday (not including today)
    const startDate = new Date('2025-07-21')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1) // Stop at yesterday, not today
    const msPerDay = 24 * 60 * 60 * 1000
    
    let snapshotsCreated = 0
    
    for (let d = new Date(startDate); d <= yesterday; d.setDate(d.getDate() + 1)) {
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
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let totalSnapshotsCreated = 0
    let totalSnapshotsSkipped = 0
    const results = []
    
    console.log(`🔄 Generating historical snapshots for ${allAssets.results.length} assets from July 21 to ${yesterday.toISOString().split('T')[0]}`)
    
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
      
      // Generate snapshot for each day from July 21 to yesterday
      for (let d = new Date(startDate); d <= yesterday; d.setDate(d.getDate() + 1)) {
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
// DUPLICATE ASSET PAGE ROUTE - COMMENTED OUT 
// ============================================
// This route is duplicated below and has been removed to prevent conflicts
/*
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
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen">
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
                            <a href="/" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                            </a>
                            <a href="/transactions" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-exchange-alt mr-1"></i>Transacciones
                            </a>
                            <a href="/wallet" class="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">
                                <i class="fas fa-wallet mr-1"></i>Wallet
                            </a>
                            <a href="/prices" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-search-dollar mr-1"></i>Precios en Vivo
                            </a>
                            <a href="/watchlist" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-star mr-1"></i>Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="text-gray-600 hover:text-red-600">
                        <i class="fas fa-sign-out-alt mr-1"></i>Salir
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-8">
            <!-- Loading State -->
            <div id="loadingState" class="flex items-center justify-center py-12">
                <i class="fas fa-spinner fa-spin text-blue-600 text-3xl mr-3"></i>
                <span class="text-gray-600 text-lg">Cargando información de ${symbol}...</span>
            </div>

            <!-- Asset Content (Hidden initially) -->
            <div id="assetContent" class="hidden">
                <!-- Header -->
                <div class="flex justify-between items-start mb-8">
                    <div class="flex items-center">
                        <button onclick="goBackToWallet()" class="mr-4 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <i class="fas fa-arrow-left text-xl"></i>
                        </button>
                        <div>
                            <div class="flex items-center">
                                <h2 id="assetSymbol" class="text-4xl font-bold text-gray-800 mr-4"></h2>
                                <span id="assetCategory" class="px-3 py-1 text-sm font-medium rounded-full"></span>
                            </div>
                            <p id="assetName" class="text-xl text-gray-600 mt-2"></p>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="updateAssetPrice()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-sync-alt mr-2"></i>Actualizar Precio
                        </button>
                        <a href="/transactions" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Nueva Transacción
                        </a>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Cantidad Total</p>
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
                                <p class="text-sm text-gray-600">Precio Actual</p>
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
                                <p class="text-sm text-gray-600">Valor Total</p>
                                <p id="totalValue" class="text-2xl font-bold text-gray-800">$0.00</p>
                            </div>
                            <div class="bg-purple-100 p-3 rounded-full">
                                <i class="fas fa-calculator text-purple-600"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">PnL Total</p>
                                <p id="totalPnL" class="text-2xl font-bold">$0.00</p>
                            </div>
                            <div id="pnlIcon" class="bg-gray-100 p-3 rounded-full">
                                <i class="fas fa-balance-scale text-gray-600"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Time Period Selector -->
                <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div class="flex flex-wrap items-center justify-between">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 lg:mb-0">
                            <i class="fas fa-clock mr-2 text-purple-600"></i>
                            Período de Análisis
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="changePeriod('1D')" id="period-1D" class="period-btn px-3 py-2 text-sm font-medium rounded-lg border transition-colors">
                                1 Día
                            </button>
                            <button onclick="changePeriod('1W')" id="period-1W" class="period-btn px-3 py-2 text-sm font-medium rounded-lg border transition-colors">
                                1 Semana
                            </button>
                            <button onclick="changePeriod('1M')" id="period-1M" class="period-btn active px-3 py-2 text-sm font-medium rounded-lg border transition-colors">
                                1 Mes
                            </button>
                            <button onclick="changePeriod('3M')" id="period-3M" class="period-btn px-3 py-2 text-sm font-medium rounded-lg border transition-colors">
                                3 Meses
                            </button>
                            <button onclick="changePeriod('6M')" id="period-6M" class="period-btn px-3 py-2 text-sm font-medium rounded-lg border transition-colors">
                                6 Meses
                            </button>
                            <button onclick="changePeriod('1Y')" id="period-1Y" class="period-btn px-3 py-2 text-sm font-medium rounded-lg border transition-colors">
                                1 Año
                            </button>
                            <button onclick="changePeriod('ALL')" id="period-ALL" class="period-btn px-3 py-2 text-sm font-medium rounded-lg border transition-colors">
                                Todo
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <!-- Price vs Time Chart -->
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-gray-800">
                                <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                                Precio vs Tiempo
                            </h3>
                            <div class="text-sm text-gray-600">
                                <span id="priceChartPeriod">Último mes</span>
                            </div>
                        </div>
                        <div class="relative" style="height: 400px;">
                            <canvas id="priceChart"></canvas>
                        </div>
                    </div>

                    <!-- Value vs Time Chart -->
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-gray-800">
                                <i class="fas fa-chart-area mr-2 text-green-600"></i>
                                Valor en USD vs Tiempo
                            </h3>
                            <div class="text-sm text-gray-600">
                                <span id="valueChartPeriod">Último mes</span>
                            </div>
                        </div>
                        <div class="relative" style="height: 400px;">
                            <canvas id="valueChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Daily History Table -->
                <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold text-gray-800">
                            <i class="fas fa-clock mr-2 text-purple-600"></i>
                            Historial Diario (9:00 PM Mazatlán) - Desde 21 Julio 2025
                        </h3>
                        <div class="text-sm text-gray-600">
                            Zona horaria: UTC-7 (Mazatlán)
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Día</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio (9 PM)</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cambio Diario</th>
                                </tr>
                            </thead>
                            <tbody id="dailyHistoryTable" class="divide-y divide-gray-200">
                                <!-- Daily history will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Transaction History -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-history mr-2 text-orange-600"></i>
                        Historial de Transacciones
                    </h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exchange</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                                </tr>
                            </thead>
                            <tbody id="transactionHistoryTable" class="divide-y divide-gray-200">
                                <!-- Transactions will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Global variables
            const assetSymbol = '${symbol}';
            let assetData = null;
            let priceChart = null;
            let valueChart = null;
            let currentPeriod = '1M';
            let allSnapshots = [];

            // Initialize page
            document.addEventListener('DOMContentLoaded', function() {
                loadAssetData();
            });

            // Load all asset data
            async function loadAssetData() {
                try {
                    const response = await axios.get(\`/api/wallet/asset/\${assetSymbol}\`);
                    assetData = response.data;
                    
                    displayAssetInfo();
                    createCharts();
                    displayDailyHistory();
                    displayTransactionHistory();
                    
                    // Show content and hide loading
                    document.getElementById('loadingState').classList.add('hidden');
                    document.getElementById('assetContent').classList.remove('hidden');
                    
                } catch (error) {
                    console.error('Error loading asset data:', error);
                    document.getElementById('loadingState').innerHTML = \`
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-red-600 text-3xl mb-4"></i>
                            <p class="text-gray-600 text-lg">Error cargando información del activo</p>
                            <button onclick="goBackToWallet()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Volver al Wallet
                            </button>
                        </div>
                    \`;
                }
            }

            // Display asset basic information
            function displayAssetInfo() {
                const { holding } = assetData;
                
                document.getElementById('assetSymbol').textContent = holding.asset_symbol;
                document.getElementById('assetName').textContent = holding.name;
                
                // Category styling
                const categoryClass = holding.category === 'crypto' ? 'bg-orange-100 text-orange-800' :
                                     holding.category === 'stocks' ? 'bg-blue-100 text-blue-800' :
                                     'bg-purple-100 text-purple-800';
                const categoryText = holding.category === 'crypto' ? 'Criptomoneda' :
                                    holding.category === 'stocks' ? 'Acción' : 'ETF';
                
                const categoryElement = document.getElementById('assetCategory');
                categoryElement.className = \`px-3 py-1 text-sm font-medium rounded-full \${categoryClass}\`;
                categoryElement.textContent = categoryText;
                
                // Update KPIs
                document.getElementById('totalQuantity').textContent = 
                    parseFloat(holding.quantity).toLocaleString('en-US', {maximumFractionDigits: 8});
                
                document.getElementById('currentPrice').textContent = 
                    '$' + parseFloat(holding.current_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2});
                
                document.getElementById('totalValue').textContent = 
                    '$' + parseFloat(holding.current_value).toLocaleString('en-US', {minimumFractionDigits: 2});
                
                // PnL with colors
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

            // Create price and value charts
            function createCharts() {
                const { daily_snapshots, holding } = assetData;
                
                if (!daily_snapshots || daily_snapshots.length === 0) {
                    return;
                }

                // Store all snapshots for filtering
                allSnapshots = daily_snapshots;
                
                // Create charts with initial period (1M)
                updateChartsWithPeriod(currentPeriod);
            }

            // Update charts based on selected period
            function updateChartsWithPeriod(period) {
                const { holding } = assetData;
                
                if (!allSnapshots || allSnapshots.length === 0) {
                    return;
                }

                // Filter data based on period
                const filteredSnapshots = filterSnapshotsByPeriod(allSnapshots, period);
                
                if (filteredSnapshots.length === 0) {
                    return;
                }

                // Calculate historical quantities for accurate value chart
                const { transactions } = assetData;
                const historicalQuantities = calculateHistoricalQuantities(transactions, filteredSnapshots);

                // Process data for charts
                const dates = filteredSnapshots.map(s => s.snapshot_date);
                const prices = filteredSnapshots.map(s => parseFloat(s.price_per_unit));
                const values = filteredSnapshots.map(s => {
                    const price = parseFloat(s.price_per_unit);
                    const quantity = historicalQuantities[s.snapshot_date] || 0;
                    return price * quantity;
                });

                // Update period labels
                const periodLabels = {
                    '1D': 'Último día',
                    '1W': 'Última semana',
                    '1M': 'Último mes',
                    '3M': 'Últimos 3 meses',
                    '6M': 'Últimos 6 meses',
                    '1Y': 'Último año',
                    'ALL': 'Todo el período'
                };
                
                document.getElementById('priceChartPeriod').textContent = periodLabels[period];
                document.getElementById('valueChartPeriod').textContent = periodLabels[period];

                // Destroy existing charts
                if (priceChart) {
                    priceChart.destroy();
                }
                if (valueChart) {
                    valueChart.destroy();
                }

                // Get time unit for the period
                const timeUnit = getTimeUnitForPeriod(period);
                const displayFormat = getDisplayFormatForPeriod(period);

                // Create price chart
                const priceCtx = document.getElementById('priceChart').getContext('2d');
                priceChart = new Chart(priceCtx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [{
                            label: \`Precio de \${holding.asset_symbol}\`,
                            data: prices,
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.1,
                            pointRadius: period === '1D' ? 3 : (period === '1W' ? 2 : 1),
                            pointHoverRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: timeUnit,
                                    displayFormats: displayFormat
                                },
                                title: {
                                    display: true,
                                    text: 'Fecha'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Precio (USD)'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString('en-US', {minimumFractionDigits: 2});
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return \`Precio: $\${context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2})}\`;
                                    },
                                    title: function(context) {
                                        const date = new Date(context[0].parsed.x);
                                        return date.toLocaleDateString('es-ES', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    }
                                }
                            },
                            legend: {
                                display: false
                            }
                        }
                    }
                });

                // Create value chart
                const valueCtx = document.getElementById('valueChart').getContext('2d');
                valueChart = new Chart(valueCtx, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [{
                            label: \`Valor en USD\`,
                            data: values,
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.1,
                            pointRadius: period === '1D' ? 3 : (period === '1W' ? 2 : 1),
                            pointHoverRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: timeUnit,
                                    displayFormats: displayFormat
                                },
                                title: {
                                    display: true,
                                    text: 'Fecha'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Valor Total (USD)'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString('en-US', {minimumFractionDigits: 2});
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return \`Valor: $\${context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2})}\`;
                                    },
                                    title: function(context) {
                                        const date = new Date(context[0].parsed.x);
                                        return date.toLocaleDateString('es-ES', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    }
                                }
                            },
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }

            // Filter snapshots by time period
            function filterSnapshotsByPeriod(snapshots, period) {
                if (period === 'ALL') {
                    return snapshots;
                }

                const now = new Date();
                let startDate = new Date();

                switch (period) {
                    case '1D':
                        startDate.setDate(now.getDate() - 1);
                        break;
                    case '1W':
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case '1M':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                    case '3M':
                        startDate.setMonth(now.getMonth() - 3);
                        break;
                    case '6M':
                        startDate.setMonth(now.getMonth() - 6);
                        break;
                    case '1Y':
                        startDate.setFullYear(now.getFullYear() - 1);
                        break;
                    default:
                        return snapshots;
                }

                return snapshots.filter(snapshot => {
                    const snapshotDate = new Date(snapshot.snapshot_date);
                    return snapshotDate >= startDate;
                });
            }

            // Get appropriate time unit for chart based on period
            function getTimeUnitForPeriod(period) {
                switch (period) {
                    case '1D':
                        return 'hour';
                    case '1W':
                        return 'day';
                    case '1M':
                        return 'day';
                    case '3M':
                        return 'week';
                    case '6M':
                        return 'week';
                    case '1Y':
                        return 'month';
                    case 'ALL':
                        return 'month';
                    default:
                        return 'day';
                }
            }

            // Get display format for chart based on period
            function getDisplayFormatForPeriod(period) {
                switch (period) {
                    case '1D':
                        return {
                            hour: 'HH:mm',
                            day: 'MMM dd HH:mm'
                        };
                    case '1W':
                        return {
                            day: 'MMM dd',
                            week: 'MMM dd'
                        };
                    case '1M':
                        return {
                            day: 'MMM dd',
                            week: 'MMM dd'
                        };
                    case '3M':
                    case '6M':
                        return {
                            week: 'MMM dd',
                            month: 'MMM yyyy'
                        };
                    case '1Y':
                    case 'ALL':
                        return {
                            month: 'MMM yyyy',
                            year: 'yyyy'
                        };
                    default:
                        return {
                            day: 'MMM dd'
                        };
                }
            }

            // Change period and update charts
            function changePeriod(period) {
                currentPeriod = period;
                
                // Update button states
                document.querySelectorAll('.period-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.getElementById(\`period-\${period}\`).classList.add('active');
                
                // Update charts
                updateChartsWithPeriod(period);
            }

            // Display daily history table
            function displayDailyHistory() {
                const { daily_snapshots, holding } = assetData;
                const tableBody = document.getElementById('dailyHistoryTable');
                
                if (!daily_snapshots || daily_snapshots.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No hay datos históricos disponibles</td></tr>';
                    return;
                }

                // Calculate historical quantity for each date based on transactions
                const { transactions } = assetData;
                const historicalQuantities = calculateHistoricalQuantities(transactions, daily_snapshots);

                const rows = daily_snapshots.map((snapshot, index) => {
                    const date = new Date(snapshot.snapshot_date);
                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                    const formattedDate = date.toLocaleDateString('es-ES');
                    const price = parseFloat(snapshot.price_per_unit);
                    
                    // Use historical quantity for that specific date
                    const quantity = historicalQuantities[snapshot.snapshot_date] || 0;
                    const totalValue = price * quantity;
                    
                    // Calculate daily change
                    let dailyChange = 0;
                    let changeClass = 'text-gray-600';
                    let changeIcon = '';
                    
                    if (index > 0) {
                        const prevPrice = parseFloat(daily_snapshots[index - 1].price_per_unit);
                        const prevValue = prevPrice * quantity;
                        dailyChange = totalValue - prevValue;
                        
                        if (dailyChange > 0) {
                            changeClass = 'text-green-600';
                            changeIcon = '<i class="fas fa-arrow-up mr-1"></i>';
                        } else if (dailyChange < 0) {
                            changeClass = 'text-red-600';
                            changeIcon = '<i class="fas fa-arrow-down mr-1"></i>';
                        }
                    }

                    return \`
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 text-sm font-medium text-gray-800">\${formattedDate}</td>
                            <td class="px-6 py-4 text-sm text-gray-600 capitalize">\${dayName}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">\${quantity.toLocaleString('en-US', {maximumFractionDigits: 8})}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">$\${price.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td class="px-6 py-4 text-sm font-medium text-gray-800">$\${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td class="px-6 py-4 text-sm \${changeClass}">
                                \${changeIcon}
                                \${Math.abs(dailyChange).toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </td>
                        </tr>
                    \`;
                }).reverse().join(''); // Reverse to show most recent first

                tableBody.innerHTML = rows;
            }

            // Display transaction history
            function displayTransactionHistory() {
                const { transactions } = assetData;
                const tableBody = document.getElementById('transactionHistoryTable');
                
                if (!transactions || transactions.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">No hay transacciones registradas</td></tr>';
                    return;
                }

                const rows = transactions.map(tx => \`
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm text-gray-600">
                            \${new Date(tx.transaction_date).toLocaleString('es-ES')}
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
                        <td class="px-6 py-4 text-sm text-gray-600">
                            \${parseFloat(tx.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">
                            \${tx.price_per_unit > 0 ? '$' + parseFloat(tx.price_per_unit).toLocaleString('en-US', {minimumFractionDigits: 2}) : 'N/A'}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">
                            \${tx.total_amount > 0 ? '$' + parseFloat(tx.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2}) : 'N/A'}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">\${tx.exchange}</td>
                        <td class="px-6 py-4 text-sm text-gray-500">\${tx.notes || '-'}</td>
                    </tr>
                \`).join('');

                tableBody.innerHTML = rows;
            }

            // Calculate historical quantities for each date
            function calculateHistoricalQuantities(transactions, snapshots) {
                const quantities = {};
                
                // Sort transactions by date
                const sortedTransactions = [...transactions].sort((a, b) => 
                    new Date(a.transaction_date) - new Date(b.transaction_date)
                );
                
                // For each snapshot date, calculate quantity up to that date
                snapshots.forEach(snapshot => {
                    const snapshotDate = new Date(snapshot.snapshot_date);
                    let totalQuantity = 0;
                    
                    // Sum all transactions up to this date
                    sortedTransactions.forEach(tx => {
                        const txDate = new Date(tx.transaction_date);
                        
                        // Only include transactions up to the snapshot date
                        if (txDate <= snapshotDate) {
                            switch (tx.type) {
                                case 'buy':
                                case 'trade_in':
                                    totalQuantity += parseFloat(tx.quantity);
                                    break;
                                case 'sell':
                                case 'trade_out':
                                    totalQuantity -= parseFloat(tx.quantity);
                                    break;
                            }
                        }
                    });
                    
                    quantities[snapshot.snapshot_date] = Math.max(0, totalQuantity);
                });
                
                return quantities;
            }

            // Update asset price
            async function updateAssetPrice() {
                try {
                    // Implementation for updating single asset price
                    alert('Función de actualización de precio individual - En desarrollo');
                } catch (error) {
                    console.error('Error updating asset price:', error);
                    alert('Error actualizando precio');
                }
            }

            // Go back to wallet
            function goBackToWallet() {
                window.location.href = '/wallet';
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
// WALLET PAGE
// ============================================

app.get('/wallet', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GusBit - Mi Wallet</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="min-h-screen">
        <!-- Navigation -->
        <nav class="nav-modern">
            <div class="max-w-7xl mx-auto px-6 py-6">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-8">
                        <div class="flex items-center space-x-4">
                            <h1 class="text-2xl font-bold text-white flex items-center">
                                <span class="text-3xl font-black mr-3 bg-white text-blue-600 px-2 py-1 rounded-lg">GB</span>
                                GusBit
                            </h1>
                            <p class="text-white text-sm opacity-75 hidden lg:block">Track Stocks, ETFs & Crypto</p>
                        </div>
                        <nav class="hidden md:flex space-x-2">
                            <a href="/" class="nav-link">
                                <i class="fas fa-tachometer-alt mr-2"></i>
                                Dashboard
                            </a>
                            <a href="/transactions" class="nav-link">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                Transacciones
                            </a>
                            <a href="/wallet" class="nav-link active">
                                <i class="fas fa-wallet mr-2"></i>
                                Wallet
                            </a>
                            <a href="/prices" class="nav-link">
                                <i class="fas fa-search-dollar mr-2"></i>
                                Precios en Vivo
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="nav-link hover:bg-red-500">
                        <i class="fas fa-sign-out-alt mr-2"></i>
                        Salir
                    </button>
                </div>
            </div>
        </nav>

        <div class="content-wrapper max-w-7xl mx-auto">
        <!-- Main Content -->
        <div class="px-8 py-8">
            <!-- Header -->
            <div class="mb-8 animate-fadeInUp">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Mi Wallet</h2>
                <p class="text-gray-600">Gestiona tus activos e inversiones</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end items-center mb-8 animate-slideInLeft">
                <div class="flex space-x-4">
                    <button onclick="updateAllPrices()" class="btn-modern-success">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Actualizar Precios
                    </button>
                    <a href="/transactions" class="btn-modern-primary">
                        <i class="fas fa-plus mr-2"></i>
                        Nueva Transacción
                    </a>
                </div>
            </div>

            <!-- Category Filters -->
            <div class="asset-card mb-8 animate-fadeInUp">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Filtrar por Categoría</h3>
                    <div class="flex flex-wrap gap-3">
                        <button onclick="filterByCategory('all')" id="filter-all" class="category-filter active">
                            <i class="fas fa-globe mr-2"></i>
                            Todos los Activos
                        </button>
                        <button onclick="filterByCategory('crypto')" id="filter-crypto" class="category-filter">
                            <i class="fab fa-bitcoin mr-2"></i>
                            Criptomonedas
                        </button>
                        <button onclick="filterByCategory('stocks')" id="filter-stocks" class="category-filter">
                            <i class="fas fa-chart-bar mr-2"></i>
                            Acciones
                        </button>
                        <button onclick="filterByCategory('etfs')" id="filter-etfs" class="category-filter">
                            <i class="fas fa-layer-group mr-2"></i>
                            ETFs
                        </button>
                    </div>
                </div>
            </div>

            <!-- Holdings Grid -->
            <div id="holdingsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Holdings cards will be loaded here -->
                <div class="col-span-full flex items-center justify-center py-12">
                    <i class="fas fa-spinner fa-spin text-blue-600 text-3xl mr-3"></i>
                    <span class="text-gray-600 text-lg">Cargando activos...</span>
                </div>
            </div>

            <!-- Empty State -->
            <div id="emptyState" class="hidden bg-white rounded-xl shadow-sm p-12 text-center">
                <i class="fas fa-wallet text-gray-300 text-6xl mb-4"></i>
                <h3 class="text-xl font-medium text-gray-600 mb-2">No tienes activos en esta categoría</h3>
                <p class="text-gray-500 mb-6">Comienza registrando tu primera transacción</p>
                <a href="/transactions" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i class="fas fa-plus mr-2"></i>
                    Registrar Transacción
                </a>
            </div>
        </div>



        <script>
            // Global variables
            let currentCategory = 'all';
            let allHoldings = [];

            // Initialize page
            document.addEventListener('DOMContentLoaded', function() {
                loadHoldings();
            });

            // Load holdings based on category
            async function loadHoldings(category = 'all') {
                try {
                    showLoadingState();
                    
                    const response = await axios.get(\`/api/wallet/holdings?category=\${category}\`);
                    const { holdings } = response.data;
                    
                    allHoldings = holdings;
                    displayHoldings(holdings);
                    
                } catch (error) {
                    console.error('Error loading holdings:', error);
                    showErrorState();
                }
            }

            // Display holdings as cards
            function displayHoldings(holdings) {
                const container = document.getElementById('holdingsContainer');
                const emptyState = document.getElementById('emptyState');
                
                if (holdings.length === 0) {
                    container.classList.add('hidden');
                    emptyState.classList.remove('hidden');
                    return;
                }

                container.classList.remove('hidden');
                emptyState.classList.add('hidden');

                const cardsHTML = holdings.map(holding => {
                    const pnlColor = holding.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600';
                    const pnlIcon = holding.unrealized_pnl >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                    const pnlBg = holding.unrealized_pnl >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
                    
                    const categoryIcon = holding.category === 'crypto' ? 'fab fa-bitcoin' :
                                        holding.category === 'stocks' ? 'fas fa-chart-line' :
                                        holding.category === 'etfs' ? 'fas fa-layer-group' : 'fas fa-coins';
                    
                    const categoryColor = holding.category === 'crypto' ? 'bg-orange-100 text-orange-800' :
                                         holding.category === 'stocks' ? 'bg-blue-100 text-blue-800' :
                                         holding.category === 'etfs' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';

                    return \`
                        <div class="asset-card \${holding.category} animate-fadeInUp" 
                             onclick="openAssetDetail('\${holding.asset_symbol}')"
                             style="animation-delay: 0.1s;">
                            <!-- Card Header -->
                            <div class="asset-card-header">
                                <div class="flex justify-between items-start">
                                    <div class="flex items-center">
                                        <div class="bg-blue-100 p-3 rounded-full mr-4">
                                            <i class="\${categoryIcon} text-xl text-blue-600"></i>
                                        </div>
                                        <div>
                                            <h3 class="asset-symbol">\${holding.asset_symbol}</h3>
                                            <p class="asset-name">\${holding.name}</p>
                                        </div>
                                    </div>
                                    <span class="transaction-badge \${
                                        holding.category === 'crypto' ? 'badge-buy' :
                                        holding.category === 'stocks' ? 'badge-sell' :
                                        'badge-trade'
                                    }">
                                        \${holding.category === 'crypto' ? 'Crypto' :
                                          holding.category === 'stocks' ? 'Acción' :
                                          holding.category === 'etfs' ? 'ETF' : 'Otro'}
                                    </span>
                                </div>
                            </div>

                            <!-- Card Body -->
                            <div class="p-6">
                                <!-- Holdings Info -->
                                <div class="grid grid-cols-2 gap-6 mb-6">
                                    <div class="text-center">
                                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cantidad</p>
                                        <p class="text-xl font-bold text-gray-800">
                                            \${parseFloat(holding.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}
                                        </p>
                                    </div>
                                    <div class="text-center">
                                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Precio Actual</p>
                                        <p class="text-xl font-bold text-gray-800">
                                            $\${parseFloat(holding.current_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                </div>

                                <!-- Investment Summary -->
                                <div class="grid grid-cols-2 gap-6 mb-6">
                                    <div class="text-center">
                                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Invertido</p>
                                        <p class="text-lg font-semibold text-gray-700">
                                            $\${parseFloat(holding.total_invested).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                    <div class="text-center">
                                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Valor Actual</p>
                                        <p class="text-lg font-bold text-gray-800">
                                            $\${parseFloat(holding.current_value).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                </div>

                                <!-- PnL Display -->
                                <div class="\${holding.unrealized_pnl >= 0 ? 'pnl-positive' : 'pnl-negative'} mb-4">
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <p class="text-xs font-semibold mb-2">Ganancia/Pérdida</p>
                                            <p class="text-xl font-bold flex items-center">
                                                <span class="\${holding.unrealized_pnl >= 0 ? 'pnl-icon-positive' : 'pnl-icon-negative'} mr-3">
                                                    <i class="fas \${pnlIcon}"></i>
                                                </span>
                                                $\${Math.abs(holding.unrealized_pnl).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                            </p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-xs font-semibold mb-2">Porcentaje</p>
                                            <p class="font-bold \${pnlColor}">
                                                \${Math.abs(holding.pnl_percentage || 0).toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Last Update -->
                                <div class="mt-4 text-xs text-gray-500 text-center">
                                    Actualizado: \${new Date(holding.price_updated_at || holding.last_updated).toLocaleString('es-ES')}
                                </div>
                                
                                <!-- Delete Asset Button -->
                                <div class="mt-4 pt-4 border-t border-gray-100">
                                    <button 
                                        onclick="confirmDeleteAsset('\${holding.asset_symbol}', '\${holding.name}'); event.stopPropagation();"
                                        class="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors duration-200 flex items-center justify-center"
                                        title="Eliminar este activo y todos sus datos"
                                    >
                                        <i class="fas fa-trash-alt mr-2"></i>
                                        Eliminar Activo
                                    </button>
                                </div>
                            </div>
                        </div>
                    \`;
                }).join('');

                container.innerHTML = cardsHTML;
            }

            // Filter holdings by category
            function filterByCategory(category) {
                currentCategory = category;
                
                // Update filter buttons
                document.querySelectorAll('.category-filter').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.getElementById(\`filter-\${category}\`).classList.add('active');
                
                // Load filtered holdings
                loadHoldings(category);
            }

            // Update all asset prices
            async function updateAllPrices() {
                try {
                    const btn = event.target;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Actualizando...';
                    btn.disabled = true;
                    
                    const response = await axios.post('/api/wallet/update-prices');
                    
                    if (response.data.success) {
                        alert(response.data.message);
                        // Reload current view
                        loadHoldings(currentCategory);
                    } else {
                        alert('Error actualizando precios');
                    }
                    
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                } catch (error) {
                    console.error('Error updating prices:', error);
                    alert('Error actualizando precios');
                    
                    const btn = event.target;
                    btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Actualizar Precios';
                    btn.disabled = false;
                }
            }

            // Open asset detail page
            function openAssetDetail(symbol) {
                // Navigate to dedicated asset page
                window.location.href = \`/asset/\${symbol}\`;
            }



            // Show loading state
            function showLoadingState() {
                const container = document.getElementById('holdingsContainer');
                container.innerHTML = \`
                    <div class="col-span-full flex items-center justify-center py-12">
                        <i class="fas fa-spinner fa-spin text-blue-600 text-3xl mr-3"></i>
                        <span class="text-gray-600 text-lg">Cargando activos...</span>
                    </div>
                \`;
            }

            // Show error state
            function showErrorState() {
                const container = document.getElementById('holdingsContainer');
                container.innerHTML = \`
                    <div class="col-span-full flex items-center justify-center py-12">
                        <i class="fas fa-exclamation-triangle text-red-600 text-3xl mr-3"></i>
                        <span class="text-gray-600 text-lg">Error cargando activos</span>
                    </div>
                \`;
            }

            // Delete Asset Functions
            function confirmDeleteAsset(symbol, name) {
                const message = \`¿Estás seguro de que deseas eliminar el activo "\${name}" (\${symbol})?
                
⚠️ ADVERTENCIA: Esta acción eliminará permanentemente:
• Todas las transacciones de este activo
• Todos los registros históricos (snapshots diarios)  
• Los datos de holdings actuales
• Toda la información relacionada

Esta acción NO se puede deshacer.

¿Continuar con la eliminación?\`;

                if (confirm(message)) {
                    deleteAsset(symbol, name);
                }
            }

            async function deleteAsset(symbol, name) {
                try {
                    const response = await axios.delete(\`/api/wallet/asset/\${symbol}\`);
                    
                    if (response.data.success) {
                        // Show success message
                        alert(\`✅ El activo "\${name}" ha sido eliminado exitosamente.\n\nDatos eliminados:\n• \${response.data.transactions_deleted || 0} transacciones\n• \${response.data.snapshots_deleted || 0} snapshots históricos\n• 1 holding eliminado\`);
                        
                        // Reload the holdings to reflect changes
                        loadHoldings(currentCategory);
                    } else {
                        alert('❌ Error eliminando el activo: ' + (response.data.error || 'Error desconocido'));
                    }
                } catch (error) {
                    console.error('Error deleting asset:', error);
                    alert('❌ Error eliminando el activo. Por favor intenta de nuevo.');
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

        <style>
            .category-filter {
                @apply bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors;
            }
            
            .category-filter.active {
                @apply bg-blue-600 text-white hover:bg-blue-700;
            }

            .category-filter:hover {
                @apply transform scale-105;
            }
        </style>
    </body>
    </html>
  `)
}*/

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
    <body class="bg-gray-50 min-h-screen">
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
                            <a href="/" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                            </a>
                            <a href="/transactions" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-exchange-alt mr-1"></i>Transacciones
                            </a>
                            <a href="/wallet" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-wallet mr-1"></i>Wallet
                            </a>
                            <a href="/prices" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-search-dollar mr-1"></i>Precios en Vivo
                            </a>
                            <a href="/watchlist" class="text-gray-600 hover:text-blue-600 font-medium pb-1">
                                <i class="fas fa-star mr-1"></i>Watchlist
                            </a>
                        </nav>
                    </div>
                    <button onclick="logout()" class="text-gray-600 hover:text-red-600">
                        <i class="fas fa-sign-out-alt mr-1"></i>Salir
                    </button>
                </div>
            </div>
        </nav>

        <!-- Loading State -->
        <div id="loadingState" class="max-w-7xl mx-auto px-6 py-16">
            <div class="flex items-center justify-center">
                <i class="fas fa-spinner fa-spin text-blue-600 text-3xl mr-4"></i>
                <span class="text-gray-600 text-xl">Cargando información de ${symbol}...</span>
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
                        <p class="text-gray-600 text-lg" id="assetName">Cargando...</p>
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
                            <p class="text-sm text-gray-600">Cantidad Total</p>
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
                            <p class="text-sm text-gray-600">Precio Actual</p>
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
                            <p class="text-sm text-gray-600">Valor Total</p>
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
                            <p class="text-sm text-gray-600">PnL Total</p>
                            <p id="totalPnL" class="text-2xl font-bold">$0.00</p>
                        </div>
                        <div id="pnlIcon" class="bg-gray-100 p-3 rounded-full">
                            <i class="fas fa-balance-scale text-gray-600"></i>
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
                        <select id="monthFilter" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Todos los meses</option>
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
                        <thead class="bg-gray-50">
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

            <!-- Transaction History -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-6">
                    <i class="fas fa-history mr-2 text-blue-600"></i>
                    Historial de Transacciones
                </h3>
                <div class="overflow-x-auto" id="transactionHistory">
                    <!-- Transactions will be loaded here -->
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
                
                if (!snapshots.length) {
                    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No hay datos históricos disponibles</td></tr>';
                    return;
                }

                // Sort by date descending
                const sortedSnapshots = [...snapshots].sort((a, b) => new Date(b.snapshot_date) - new Date(a.snapshot_date));

                const rowsHTML = sortedSnapshots.map((snapshot, index) => {
                    const prevSnapshot = sortedSnapshots[index + 1];
                    let changePercent = 0;
                    let changeClass = 'text-gray-600';
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
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 text-sm font-medium text-gray-800">
                                \${new Date(snapshot.snapshot_date).toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600">
                                \${parseFloat(snapshot.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600">
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
            }

            // Filter daily history by month
            function filterDailyHistory() {
                const selectedMonth = document.getElementById('monthFilter').value;
                
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
                        <thead class="bg-gray-50">
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
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 text-sm text-gray-600">
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
                                    <td class="px-6 py-4 text-sm text-gray-600">
                                        \${parseFloat(tx.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-600">
                                        \${tx.price_per_unit > 0 ? '$' + parseFloat(tx.price_per_unit).toLocaleString('en-US', {minimumFractionDigits: 2}) : 'N/A'}
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-600">
                                        \${tx.total_amount > 0 ? '$' + parseFloat(tx.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2}) : 'N/A'}
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-600">\${tx.exchange}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;
                
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
                            <h4 class="text-sm text-gray-600 mb-1">Precio Actual</h4>
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
        <title>GusBit - Precios en Vivo</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body class="bg-gradient-to-br from-blue-900 to-purple-900 min-h-screen">
        <!-- Navigation -->
        <nav class="bg-gradient-to-r from-blue-600 to-blue-800 shadow-xl">
            <div class="max-w-7xl mx-auto px-6 py-6">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-8">
                        <div class="flex items-center space-x-4">
                            <div class="flex flex-col items-start">
                                <div class="text-2xl font-bold text-white" style="font-family: 'Times New Roman', serif; letter-spacing: 0.05em;">GB</div>
                                <h1 class="text-xl font-bold text-white -mt-1" style="font-family: 'Times New Roman', serif;">GusBit</h1>
                            </div>
                            <p class="text-white text-xs opacity-75 hidden lg:block uppercase tracking-wider font-medium">TRACK STOCKS, ETFS & CRYPTO</p>
                        </div>
                        <nav class="flex space-x-8">
                            <a href="/" class="nav-link">
                                <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                            </a>
                            <a href="/transactions" class="nav-link">
                                <i class="fas fa-exchange-alt mr-2"></i>Transacciones
                            </a>
                            <a href="/wallet" class="nav-link">
                                <i class="fas fa-wallet mr-2"></i>Wallet
                            </a>
                            <a href="/prices" class="nav-link active">
                                <i class="fas fa-search-dollar mr-2"></i>Precios en Vivo
                            </a>
                            <a href="/watchlist" class="nav-link">
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
                    Buscador de Activos en Tiempo Real
                </h2>
                
                <div class="max-w-3xl mx-auto">
                    <div class="relative">
                        <input 
                            type="text" 
                            id="liveSearch" 
                            class="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all duration-200 pr-16"
                            placeholder="Busca cualquier activo: AAPL, Bitcoin, TSLA, SPY..."
                            autocomplete="off"
                        >
                        <button id="searchBtn" class="absolute right-3 top-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <div class="text-center mt-4 text-gray-600">
                        <p><i class="fas fa-info-circle mr-2"></i>Información directa desde CoinGecko y Yahoo Finance</p>
                    </div>
                </div>
            </div>

            <!-- Asset Results Section -->
            <div id="assetResults" class="hidden">
                <div class="glass-card p-8">
                    <div id="assetInfo"></div>
                </div>
            </div>

            <!-- Watchlist Section -->
            <div class="glass-card p-8">
                <h2 class="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-6 flex items-center">
                    <i class="fas fa-star mr-3 text-yellow-500"></i>
                    Mi Watchlist
                    <span id="watchlistCount" class="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">0</span>
                </h2>
                
                <div id="watchlistContainer">
                    <div id="watchlistLoading" class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-blue-600 text-2xl mb-2"></i>
                        <p class="text-gray-600">Cargando watchlist...</p>
                    </div>
                    
                    <div id="watchlistEmpty" class="hidden text-center py-12 text-gray-500">
                        <i class="fas fa-eye-slash text-4xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">Tu watchlist está vacía</h3>
                        <p>Busca activos arriba y agrégalos a tu lista de seguimiento</p>
                    </div>
                    
                    <div id="watchlistItems" class="space-y-4"></div>
                </div>
            </div>

            <!-- Popular Assets Section -->
            <div class="glass-card p-8">
                <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6 flex items-center">
                    <i class="fas fa-fire mr-3 text-orange-500"></i>
                    Activos Populares
                </h2>
                
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <button onclick="goToAsset('AAPL', 'Apple Inc.', 'stocks')" class="asset-quick-btn">
                        <i class="fab fa-apple text-2xl mb-2"></i>
                        <div class="text-sm font-bold">AAPL</div>
                        <div class="text-xs text-gray-600">Apple Inc.</div>
                    </button>
                    
                    <button onclick="goToAsset('BTC', 'Bitcoin', 'crypto')" class="asset-quick-btn">
                        <i class="fab fa-bitcoin text-2xl mb-2 text-orange-500"></i>
                        <div class="text-sm font-bold">BTC</div>
                        <div class="text-xs text-gray-600">Bitcoin</div>
                    </button>
                    
                    <button onclick="goToAsset('TSLA', 'Tesla Inc.', 'stocks')" class="asset-quick-btn">
                        <i class="fas fa-car text-2xl mb-2"></i>
                        <div class="text-sm font-bold">TSLA</div>
                        <div class="text-xs text-gray-600">Tesla Inc.</div>
                    </button>
                    
                    <button onclick="goToAsset('ETH', 'Ethereum', 'crypto')" class="asset-quick-btn">
                        <i class="fab fa-ethereum text-2xl mb-2"></i>
                        <div class="text-sm font-bold">ETH</div>
                        <div class="text-xs text-gray-600">Ethereum</div>
                    </button>
                    
                    <button onclick="goToAsset('IBIT', 'iShares Bitcoin Trust ETF', 'etfs')" class="asset-quick-btn">
                        <i class="fas fa-chart-line text-2xl mb-2"></i>
                        <div class="text-sm font-bold">IBIT</div>
                        <div class="text-xs text-gray-600">Bitcoin ETF</div>
                    </button>
                    
                    <button onclick="goToAsset('SPY', 'SPDR S&P 500 ETF', 'etfs')" class="asset-quick-btn">
                        <i class="fas fa-chart-area text-2xl mb-2"></i>
                        <div class="text-sm font-bold">SPY</div>
                        <div class="text-xs text-gray-600">S&P 500 ETF</div>
                    </button>
                </div>
            </div>
        </div>

        <script>
            let searchTimeout;
            let charts = {};

            // Initialize page
            document.addEventListener('DOMContentLoaded', function() {
                setupSearch();
                loadWatchlist();
            });

            // Setup search functionality
            function setupSearch() {
                const searchInput = document.getElementById('liveSearch');
                const searchBtn = document.getElementById('searchBtn');
                
                searchInput.addEventListener('input', handleLiveSearch);
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        performSearch(this.value.trim());
                    }
                });
                
                searchBtn.addEventListener('click', function() {
                    performSearch(searchInput.value.trim());
                });
            }

            // Handle live search with debouncing
            function handleLiveSearch(e) {
                const query = e.target.value.trim();
                
                clearTimeout(searchTimeout);
                
                if (query.length < 2) {
                    hideAssetResults();
                    return;
                }
                
                searchTimeout = setTimeout(() => performSearch(query), 500);
            }

            // Perform asset search
            async function performSearch(query) {
                if (!query) return;
                
                try {
                    showSearchLoading();
                    
                    const response = await axios.get(\`/api/assets/live-search?q=\${encodeURIComponent(query)}\`);
                    const { asset, price_data, chart_data } = response.data;
                    
                    displayAssetResults(asset, price_data, chart_data);
                } catch (error) {
                    console.error('Search error:', error);
                    showSearchError(error.response?.data?.error || 'Error al buscar el activo');
                }
            }

            // Show search loading state
            function showSearchLoading() {
                const resultsSection = document.getElementById('assetResults');
                const assetInfo = document.getElementById('assetInfo');
                
                assetInfo.innerHTML = \`
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-blue-600 text-3xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">Buscando activo...</h3>
                        <p class="text-gray-600">Obteniendo datos en tiempo real</p>
                    </div>
                \`;
                
                resultsSection.classList.remove('hidden');
            }

            // Display asset results
            function displayAssetResults(asset, priceData, chartData) {
                const resultsSection = document.getElementById('assetResults');
                const assetInfo = document.getElementById('assetInfo');
                
                const changeClass = priceData.change >= 0 ? 'text-green-600' : 'text-red-600';
                const changeIcon = priceData.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                
                assetInfo.innerHTML = \`
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800">\${asset.symbol}</h3>
                            <p class="text-lg text-gray-600">\${asset.name}</p>
                            <span class="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
                                \${asset.category.toUpperCase()}
                            </span>
                        </div>
                        <button id="addToWatchlistBtn" onclick="addToWatchlist('\${asset.symbol}', '\${asset.name}', '\${asset.category}')" 
                                class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center">
                            <i class="fas fa-star mr-2"></i>Agregar a Watchlist
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="bg-white p-6 rounded-lg border-l-4 border-blue-500">
                            <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Precio Actual</h4>
                            <div class="text-2xl font-bold text-gray-900">$\${priceData.current_price.toLocaleString()}</div>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg border-l-4 \${priceData.change >= 0 ? 'border-green-500' : 'border-red-500'}">
                            <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Cambio 24h</h4>
                            <div class="flex items-center">
                                <i class="fas \${changeIcon} \${changeClass} mr-2"></i>
                                <span class="text-2xl font-bold \${changeClass}">$\${Math.abs(priceData.change).toFixed(2)}</span>
                                <span class="text-lg \${changeClass} ml-2">(\${priceData.change_percentage.toFixed(2)}%)</span>
                            </div>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg border-l-4 border-purple-500">
                            <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Volumen 24h</h4>
                            <div class="text-2xl font-bold text-gray-900">$\${priceData.volume.toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                            Gráfica de Precio (7 días)
                        </h4>
                        <canvas id="priceChart" width="400" height="200"></canvas>
                    </div>
                \`;
                
                resultsSection.classList.remove('hidden');
                
                // Create chart
                setTimeout(() => createPriceChart(chartData), 100);
            }

            // Create price chart
            function createPriceChart(chartData) {
                const ctx = document.getElementById('priceChart').getContext('2d');
                
                // Destroy existing chart if it exists
                if (charts.priceChart) {
                    charts.priceChart.destroy();
                }
                
                const labels = chartData.map(d => new Date(d.timestamp).toLocaleDateString());
                const prices = chartData.map(d => d.price);
                
                charts.priceChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Precio',
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
                        scales: {
                            y: {
                                beginAtZero: false,
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString();
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return 'Precio: $' + context.parsed.y.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Show search error
            function showSearchError(message) {
                const assetInfo = document.getElementById('assetInfo');
                
                assetInfo.innerHTML = \`
                    <div class="text-center py-8">
                        <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2 text-red-600">Error en la búsqueda</h3>
                        <p class="text-gray-600">\${message}</p>
                        <button onclick="document.getElementById('liveSearch').value = ''; hideAssetResults();" 
                                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            Intentar de nuevo
                        </button>
                    </div>
                \`;
            }

            // Hide asset results
            function hideAssetResults() {
                document.getElementById('assetResults').classList.add('hidden');
            }

            // Add to watchlist
            async function addToWatchlist(symbol, name, category) {
                const button = document.getElementById('addToWatchlistBtn');
                const originalContent = button.innerHTML;
                
                try {
                    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Agregando...';
                    button.disabled = true;
                    
                    const response = await axios.post('/api/watchlist', {
                        symbol: symbol,
                        name: name,
                        category: category,
                        notes: '',
                        target_price: null
                    });
                    
                    if (response.data.success) {
                        button.innerHTML = '<i class="fas fa-check mr-2"></i>¡Agregado!';
                        button.className = button.className.replace('bg-green-600 hover:bg-green-700', 'bg-blue-600');
                        
                        showNotification('Activo agregado al watchlist', 'success');
                        
                        // Reload watchlist
                        setTimeout(() => {
                            loadWatchlist();
                            button.innerHTML = '<i class="fas fa-eye mr-2"></i>Ver en Watchlist';
                            button.onclick = () => scrollToWatchlist();
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Error adding to watchlist:', error);
                    
                    const errorMsg = error.response?.status === 409 ? 
                        'Este activo ya está en tu watchlist' : 
                        'Error al agregar al watchlist';
                    
                    showNotification(errorMsg, 'error');
                    
                    button.innerHTML = originalContent;
                    button.disabled = false;
                }
            }

            // Load watchlist
            async function loadWatchlist() {
                try {
                    const response = await axios.get('/api/watchlist');
                    const watchlist = response.data.watchlist || [];
                    
                    displayWatchlist(watchlist);
                } catch (error) {
                    console.error('Error loading watchlist:', error);
                    showWatchlistError();
                }
            }

            // Display watchlist
            function displayWatchlist(watchlist) {
                const container = document.getElementById('watchlistContainer');
                const loading = document.getElementById('watchlistLoading');
                const empty = document.getElementById('watchlistEmpty');
                const items = document.getElementById('watchlistItems');
                const count = document.getElementById('watchlistCount');
                
                loading.classList.add('hidden');
                
                count.textContent = watchlist.length;
                
                if (watchlist.length === 0) {
                    empty.classList.remove('hidden');
                    items.classList.add('hidden');
                    return;
                }
                
                empty.classList.add('hidden');
                items.classList.remove('hidden');
                
                items.innerHTML = watchlist.map(asset => \`
                    <div class="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex items-center space-x-4">
                                <div class="text-3xl">\${getAssetIcon(asset.symbol, asset.category)}</div>
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800">\${asset.symbol}</h3>
                                    <p class="text-gray-600">\${asset.name}</p>
                                    <span class="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mt-1">
                                        \${asset.category.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-bold text-gray-900">$\${asset.current_price ? asset.current_price.toLocaleString() : '---'}</div>
                                <div class="text-sm text-gray-500">Último precio</div>
                                <button onclick="removeFromWatchlist(\${asset.id})" 
                                        class="mt-2 text-red-500 hover:text-red-700 transition-colors duration-200">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <canvas id="watchlistChart\${asset.id}" width="300" height="100"></canvas>
                        </div>
                    </div>
                \`).join('');
                
                // Create mini charts for each asset
                watchlist.forEach(asset => {
                    setTimeout(() => createMiniChart(asset), 100);
                });
            }

            // Create mini chart for watchlist item
            function createMiniChart(asset) {
                const canvasId = \`watchlistChart\${asset.id}\`;
                const canvas = document.getElementById(canvasId);
                
                if (!canvas) return;
                
                const ctx = canvas.getContext('2d');
                
                // Generate sample data for demo
                const sampleData = Array.from({length: 7}, (_, i) => {
                    const basePrice = asset.current_price || 100;
                    const variation = (Math.random() - 0.5) * 0.1; // 10% variation
                    return basePrice * (1 + variation);
                });
                
                const labels = ['', '', '', '', '', '', ''];
                
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: sampleData,
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { display: false },
                            y: { display: false }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        }
                    }
                });
            }

            // Remove from watchlist
            async function removeFromWatchlist(id) {
                if (!confirm('¿Eliminar este activo de tu watchlist?')) return;
                
                try {
                    await axios.delete(\`/api/watchlist/\${id}\`);
                    showNotification('Activo eliminado del watchlist', 'success');
                    loadWatchlist();
                } catch (error) {
                    console.error('Error removing from watchlist:', error);
                    showNotification('Error al eliminar del watchlist', 'error');
                }
            }

            // Show watchlist error
            function showWatchlistError() {
                const items = document.getElementById('watchlistItems');
                items.innerHTML = \`
                    <div class="text-center py-8 text-red-500">
                        <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">Error al cargar watchlist</h3>
                        <button onclick="loadWatchlist()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            Reintentar
                        </button>
                    </div>
                \`;
            }

            // Scroll to watchlist
            function scrollToWatchlist() {
                document.getElementById('watchlistContainer').scrollIntoView({ 
                    behavior: 'smooth' 
                });
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
                
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            document.body.removeChild(notification);
                        }
                    }, 300);
                }, 4000);
            }



            // Get asset icon
            function getAssetIcon(symbol, category) {
                const iconMap = {
                    'AAPL': '<i class="fab fa-apple"></i>',
                    'BTC': '<i class="fab fa-bitcoin text-orange-500"></i>',
                    'ETH': '<i class="fab fa-ethereum"></i>',
                    'TSLA': '<i class="fas fa-car"></i>',
                    'MSFT': '<i class="fab fa-microsoft text-blue-600"></i>',
                    'GOOGL': '<i class="fab fa-google"></i>',
                    'AMZN': '<i class="fab fa-amazon"></i>',
                    'META': '<i class="fab fa-facebook"></i>',
                };
                
                if (iconMap[symbol]) return iconMap[symbol];
                
                switch(category) {
                    case 'crypto': return '<i class="fab fa-bitcoin"></i>';
                    case 'stocks': return '<i class="fas fa-building"></i>';
                    case 'etfs': return '<i class="fas fa-chart-line"></i>';
                    default: return '<i class="fas fa-coins"></i>';
                }
            }

            // Get category badge CSS class
            function getCategoryBadgeClass(category) {
                switch(category) {
                    case 'crypto': return 'asset-badge-crypto';
                    case 'stocks': return 'asset-badge-stocks';  
                    case 'etfs': return 'asset-badge-etfs';
                    default: return 'bg-gray-200 text-gray-700';
                }
            }

            // Navigate to individual asset page
            function goToAsset(symbol, name, category, apiSource = 'alphavantage', apiId = null) {
                const params = new URLSearchParams({
                    name: name,
                    category: category,
                    source: apiSource || 'alphavantage',
                    from: 'prices'
                });
                
                if (apiId) params.append('api_id', apiId);
                
                window.location.href = \`/asset/\${encodeURIComponent(symbol)}?\${params.toString()}\`;
            }

            // Hide price search results
            function hidePriceSearchResults() {
                document.getElementById('priceSearchResults').classList.add('hidden');
            }

            // Logout function
            function logout() {
                if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    document.cookie = 'asset_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    window.location.href = '/login';
                }
            }
        </script>

        <style>
            .asset-quick-btn {
                @apply bg-white rounded-xl p-4 shadow-md border-2 border-gray-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center;
            }
        </style>
    </body>
    </html>
  `)
})

// ==============================================
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
    <body class="bg-gray-50 min-h-screen">
        <!-- Navigation -->
        <nav class="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
            <div class="max-w-7xl mx-auto px-6 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-8">
                        <h1 class="text-2xl font-bold text-white" style="font-family: 'Times New Roman', serif;">GusBit</h1>
                        <div class="hidden md:flex space-x-6">
                            <a href="/" class="nav-link"><i class="fas fa-chart-pie mr-2"></i>Dashboard</a>
                            <a href="/transactions" class="nav-link"><i class="fas fa-exchange-alt mr-2"></i>Transacciones</a>
                            <a href="/wallet" class="nav-link"><i class="fas fa-wallet mr-2"></i>Wallet</a>
                            <a href="/prices" class="nav-link"><i class="fas fa-chart-line mr-2"></i>Live Prices</a>
                            <a href="/watchlist" class="nav-link active"><i class="fas fa-star mr-2"></i>Watchlist</a>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button onclick="logout()" class="nav-link">
                            <i class="fas fa-sign-out-alt mr-2"></i>Salir
                        </button>
                    </div>
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
                        <p class="text-gray-600">Sigue el rendimiento de tus activos favoritos y recibe alertas cuando alcancen tus precios objetivo.</p>
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
                    <p class="text-gray-600">Cargando watchlist...</p>
                </div>
            </div>

            <!-- Empty State -->
            <div id="emptyState" class="hidden glass-card p-12 text-center">
                <i class="fas fa-star text-6xl text-gray-400 mb-6"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-3">Tu watchlist está vacío</h3>
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
                                <p class="text-sm font-medium text-gray-600">Total Activos</p>
                                <p class="text-2xl font-bold text-blue-600" id="totalAssets">0</p>
                            </div>
                            <i class="fas fa-list text-2xl text-blue-500"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Por Encima del Objetivo</p>
                                <p class="text-2xl font-bold text-green-600" id="aboveTarget">0</p>
                            </div>
                            <i class="fas fa-arrow-up text-2xl text-green-500"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Por Debajo del Objetivo</p>
                                <p class="text-2xl font-bold text-red-600" id="belowTarget">0</p>
                            </div>
                            <i class="fas fa-arrow-down text-2xl text-red-500"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Sin Objetivo</p>
                                <p class="text-2xl font-bold text-gray-600" id="noTarget">0</p>
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
                            <select id="categoryFilter" class="form-select">
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
                            <thead class="bg-gray-50">
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
                        <input type="number" id="editTargetPrice" class="form-input" step="0.01" placeholder="Ej: 150.00">
                    </div>
                    <div class="mb-6">
                        <label class="form-label">Notas</label>
                        <textarea id="editNotes" class="form-input" rows="3" placeholder="Notas opcionales..."></textarea>
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
                    <tr class="hover:bg-gray-50">
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
                const color = isPositive ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600';
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