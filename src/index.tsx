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
        <title>Asset Tracker - Login</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-900 to-purple-900 min-h-screen flex items-center justify-center">
        <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <div class="text-center mb-8">
                <i class="fas fa-chart-line text-4xl text-blue-600 mb-4"></i>
                <h1 class="text-3xl font-bold text-gray-800">Asset Tracker</h1>
                <p class="text-gray-600 mt-2">Seguimiento de Inversiones</p>
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
        <title>Asset Tracker - Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                            Asset Tracker
                        </h1>
                        <nav class="flex space-x-6">
                            <a href="/" class="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">
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
            <!-- KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Total Invertido</p>
                            <p id="total-invested" class="text-2xl font-bold text-gray-800">$0.00</p>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-full">
                            <i class="fas fa-dollar-sign text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Valor Actual</p>
                            <p id="current-value" class="text-2xl font-bold text-gray-800">$0.00</p>
                        </div>
                        <div class="bg-green-100 p-3 rounded-full">
                            <i class="fas fa-chart-line text-green-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">PnL Total</p>
                            <p id="total-pnl" class="text-2xl font-bold">$0.00</p>
                        </div>
                        <div id="pnl-icon" class="bg-gray-100 p-3 rounded-full">
                            <i class="fas fa-balance-scale text-gray-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Diversification Chart -->
            <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-pie-chart mr-2 text-blue-600"></i>
                    Diversificación de Portfolio
                </h2>
                <div class="flex justify-center">
                    <canvas id="diversificationChart" width="400" height="400"></canvas>
                </div>
            </div>

            <!-- Recent Transactions -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-history mr-2 text-blue-600"></i>
                        Últimos Movimientos (3 días)
                    </h2>
                    <a href="/transactions" class="text-blue-600 hover:text-blue-700 font-medium">
                        Ver todos <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                </div>
                <div id="recent-transactions" class="overflow-x-auto">
                    <!-- Transactions will be loaded here -->
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
                    container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay transacciones recientes</p>';
                    return;
                }

                const tableHTML = \`
                    <table class="min-w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Exchange</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            \${transactions.map(tx => \`
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 text-sm text-gray-600">
                                        \${new Date(tx.transaction_date).toLocaleDateString('es-ES')}
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full \${
                                            tx.type === 'buy' ? 'bg-green-100 text-green-800' : 
                                            tx.type === 'sell' ? 'bg-red-100 text-red-800' : 
                                            'bg-blue-100 text-blue-800'
                                        }">
                                            \${tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venta' : 'Trade'}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-sm font-medium text-gray-800">\${tx.asset_symbol}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">\${tx.quantity}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">$\${tx.price_per_unit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">$\${tx.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">\${tx.exchange}</td>
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

    const results = []

    // Search cryptocurrencies from CoinGecko
    try {
      const cryptoResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`)
      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json()
        
        // Add top crypto results
        const cryptoResults = cryptoData.coins.slice(0, 10).map(coin => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          category: 'crypto',
          api_source: 'coingecko',
          api_id: coin.id,
          current_price: 0 // Will be fetched separately
        }))
        results.push(...cryptoResults)
      }
    } catch (error) {
      console.log('CoinGecko search error:', error)
    }

    // Search stocks from Alpha Vantage (simplified keyword search)
    try {
      const stockSymbols = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC',
        'SPY', 'QQQ', 'VTI', 'VOO', 'IVV', 'VEA', 'IEMG', 'VWO', 'AGG', 'BND'
      ]
      
      const matchingStocks = stockSymbols
        .filter(symbol => symbol.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map(symbol => ({
          symbol: symbol,
          name: symbol, // Will be enhanced with real names later
          category: symbol.includes('ETF') || ['SPY', 'QQQ', 'VTI', 'VOO', 'IVV'].includes(symbol) ? 'etfs' : 'stocks',
          api_source: 'alphavantage',
          api_id: symbol,
          current_price: 0
        }))
      
      results.push(...matchingStocks)
    } catch (error) {
      console.log('Stock search error:', error)
    }

    return c.json({ results: results.slice(0, 15) })
  } catch (error) {
    return c.json({ error: 'Error searching assets' }, 500)
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
        <title>Asset Tracker - Transacciones</title>
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
                            Asset Tracker
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
    
    // Generate daily snapshots from July 21, 2025 to today
    const startDate = new Date('2025-07-21')
    const today = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    
    let snapshotsCreated = 0
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
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
    
    // Get daily snapshots from July 21, 2025
    const dailySnapshots = await c.env.DB.prepare(`
      SELECT * FROM daily_snapshots 
      WHERE asset_symbol = ? AND snapshot_date >= '2025-07-21'
      ORDER BY snapshot_date ASC
    `).bind(symbol).all()
    
    return c.json({
      holding,
      transactions: transactions.results,
      price_history: priceHistory.results,
      daily_snapshots: dailySnapshots.results
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
        <title>Asset Tracker - Mi Wallet</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
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
                            Asset Tracker
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
            <!-- Header with Actions -->
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-wallet mr-3 text-blue-600"></i>
                        Mi Wallet
                    </h2>
                    <p class="text-gray-600 mt-2">Gestiona y monitorea todos tus activos financieros</p>
                </div>
                <div class="flex space-x-3">
                    <button onclick="updateAllPrices()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Actualizar Precios
                    </button>
                    <a href="/transactions" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>
                        Nueva Transacción
                    </a>
                </div>
            </div>

            <!-- Category Filters -->
            <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
                <div class="flex flex-wrap gap-3">
                    <button onclick="filterByCategory('all')" id="filter-all" class="category-filter active px-4 py-2 rounded-full text-sm font-medium">
                        <i class="fas fa-globe mr-2"></i>
                        Todos los Activos
                    </button>
                    <button onclick="filterByCategory('crypto')" id="filter-crypto" class="category-filter px-4 py-2 rounded-full text-sm font-medium">
                        <i class="fab fa-bitcoin mr-2"></i>
                        Criptomonedas
                    </button>
                    <button onclick="filterByCategory('stocks')" id="filter-stocks" class="category-filter px-4 py-2 rounded-full text-sm font-medium">
                        <i class="fas fa-chart-bar mr-2"></i>
                        Acciones
                    </button>
                    <button onclick="filterByCategory('etfs')" id="filter-etfs" class="category-filter px-4 py-2 rounded-full text-sm font-medium">
                        <i class="fas fa-layer-group mr-2"></i>
                        ETFs
                    </button>
                </div>
            </div>

            <!-- Holdings Grid -->
            <div id="holdingsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                             onclick="openAssetDetail('\${holding.asset_symbol}')">
                            <!-- Card Header -->
                            <div class="p-6 border-b border-gray-100">
                                <div class="flex justify-between items-start">
                                    <div class="flex items-center">
                                        <i class="\${categoryIcon} text-2xl text-gray-600 mr-3"></i>
                                        <div>
                                            <h3 class="text-lg font-bold text-gray-800">\${holding.asset_symbol}</h3>
                                            <p class="text-sm text-gray-600">\${holding.name}</p>
                                        </div>
                                    </div>
                                    <span class="px-2 py-1 text-xs font-medium rounded-full \${categoryColor}">
                                        \${holding.category === 'crypto' ? 'Crypto' :
                                          holding.category === 'stocks' ? 'Acción' :
                                          holding.category === 'etfs' ? 'ETF' : 'Otro'}
                                    </span>
                                </div>
                            </div>

                            <!-- Card Body -->
                            <div class="p-6">
                                <!-- Holdings Info -->
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Cantidad</p>
                                        <p class="text-lg font-semibold text-gray-800">
                                            \${parseFloat(holding.quantity).toLocaleString('en-US', {maximumFractionDigits: 8})}
                                        </p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Precio Actual</p>
                                        <p class="text-lg font-semibold text-gray-800">
                                            $\${parseFloat(holding.current_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                </div>

                                <!-- Investment Summary -->
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Invertido</p>
                                        <p class="text-sm text-gray-700">
                                            $\${parseFloat(holding.total_invested).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500 uppercase tracking-wide">Valor Actual</p>
                                        <p class="text-sm font-medium text-gray-800">
                                            $\${parseFloat(holding.current_value).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                </div>

                                <!-- PnL Display -->
                                <div class="border rounded-lg p-3 \${pnlBg}">
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <p class="text-xs text-gray-600 mb-1">Ganancia/Pérdida</p>
                                            <p class="font-bold \${pnlColor}">
                                                <i class="fas \${pnlIcon} mr-1"></i>
                                                $\${Math.abs(holding.unrealized_pnl).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                            </p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-xs text-gray-600 mb-1">Porcentaje</p>
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

            /* Modal overlay */
            #assetModal {
                backdrop-filter: blur(4px);
            }
        </style>
    </body>
    </html>
  `)
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
        <title>Asset Tracker - ${symbol}</title>
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
                            Asset Tracker
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
                    const response = await axios.get(\`/api/wallet/asset/\${assetSymbol}\`);
                    const { holding, transactions, daily_snapshots } = response.data;
                    
                    assetData = holding;
                    dailySnapshots = daily_snapshots;
                    
                    // Update UI
                    updateAssetHeader(holding);
                    updateSummaryCards(holding);
                    
                    // Load charts if we have snapshots
                    if (daily_snapshots.length > 0) {
                        renderPriceChart(daily_snapshots);
                        renderValueChart(daily_snapshots);
                        renderDailyHistory(daily_snapshots);
                    } else {
                        showNoSnapshotsMessage();
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
                
                document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2').innerHTML = message;
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

app.get('/prices', (c) => {
  return c.html('<h1>Precios en Vivo - En desarrollo</h1>')
})

export default app