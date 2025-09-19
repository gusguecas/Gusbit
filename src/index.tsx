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
        
        SUM(CASE WHEN type IN ('buy', 'trade_in') THEN total_amount + fees ELSE 0 END) -
        SUM(CASE WHEN type IN ('sell', 'trade_out') THEN total_amount - fees ELSE 0 END) as net_invested
      FROM transactions 
      WHERE asset_symbol = ?
    `).bind(assetSymbol).first()

    const netQuantity = stats?.net_quantity || 0
    const netInvested = stats?.net_invested || 0
    const avgPrice = netQuantity > 0 ? netInvested / netQuantity : 0

    // Get current price
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
                            <option value="buy">Compra</option>
                            <option value="sell">Venta</option>
                            <option value="trade_in">Trade Entrada (Recibido)</option>
                            <option value="trade_out">Trade Salida (Enviado)</option>
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

                    <!-- Asset Search -->
                    <div class="lg:col-span-2">
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

                    <!-- Cantidad -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                        <input 
                            type="number" 
                            id="quantity" 
                            step="0.00000001" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                        >
                    </div>

                    <!-- Precio por Unidad -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Precio por Unidad (USD)</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-gray-500">$</span>
                            <input 
                                type="number" 
                                id="pricePerUnit" 
                                step="0.01" 
                                class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                                required
                            >
                            <button type="button" onclick="fetchCurrentPrice()" class="absolute right-2 top-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                                <i class="fas fa-sync-alt mr-1"></i>Precio Actual
                            </button>
                        </div>
                    </div>

                    <!-- Total Amount (Auto-calculated) -->
                    <div>
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
            let searchTimeout = null;

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
                // Asset search
                document.getElementById('assetSearch').addEventListener('input', handleAssetSearch);
                
                // Auto-calculate total
                document.getElementById('quantity').addEventListener('input', calculateTotal);
                document.getElementById('pricePerUnit').addEventListener('input', calculateTotal);
                
                // Form submission
                document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);
                
                // Click outside to close search results
                document.addEventListener('click', function(e) {
                    if (!e.target.closest('#assetSearch') && !e.target.closest('#searchResults')) {
                        hideSearchResults();
                    }
                });
            }

            // Handle asset search with debouncing
            function handleAssetSearch(e) {
                const query = e.target.value.trim();
                
                clearTimeout(searchTimeout);
                
                if (query.length < 2) {
                    hideSearchResults();
                    return;
                }
                
                searchTimeout = setTimeout(() => searchAssets(query), 300);
            }

            // Search assets from API
            async function searchAssets(query) {
                try {
                    showSearchLoading();
                    
                    const response = await axios.get(\`/api/assets/search?q=\${encodeURIComponent(query)}\`);
                    const { results } = response.data;
                    
                    displaySearchResults(results);
                } catch (error) {
                    console.error('Asset search error:', error);
                    hideSearchResults();
                }
            }

            // Display search results
            function displaySearchResults(results) {
                const resultsContainer = document.getElementById('searchResults');
                
                if (results.length === 0) {
                    resultsContainer.innerHTML = '<div class="p-4 text-gray-500 text-center">No se encontraron activos</div>';
                    resultsContainer.classList.remove('hidden');
                    return;
                }

                const html = results.map(asset => \`
                    <div class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" 
                         onclick="selectAsset('\${asset.symbol}', '\${asset.name}', '\${asset.category}', '\${asset.api_source}', '\${asset.api_id}')">
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

            // Clear selected asset
            function clearSelectedAsset() {
                selectedAssetData = null;
                document.getElementById('selectedAsset').classList.add('hidden');
                document.getElementById('assetSearch').value = '';
                document.getElementById('pricePerUnit').value = '';
                calculateTotal();
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
                
                if (!selectedAssetData) {
                    alert('Debes seleccionar un activo');
                    return;
                }

                const formData = {
                    type: document.getElementById('transactionType').value,
                    asset_symbol: selectedAssetData.symbol,
                    asset_name: selectedAssetData.name,
                    category: selectedAssetData.category,
                    api_source: selectedAssetData.api_source,
                    api_id: selectedAssetData.api_id,
                    exchange: document.getElementById('exchange').value,
                    quantity: parseFloat(document.getElementById('quantity').value),
                    price_per_unit: parseFloat(document.getElementById('pricePerUnit').value),
                    fees: parseFloat(document.getElementById('fees').value) || 0,
                    notes: document.getElementById('notes').value,
                    transaction_date: document.getElementById('transactionDate').value
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

            // Reset form
            function resetForm() {
                document.getElementById('transactionForm').reset();
                clearSelectedAsset();
                
                // Reset date to now
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                document.getElementById('transactionDate').value = now.toISOString().slice(0, 16);
                
                document.getElementById('fees').value = '0';
                calculateTotal();
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
                                            'bg-blue-100 text-blue-800'
                                        }">
                                            \${tx.type === 'buy' ? 'Compra' : 
                                              tx.type === 'sell' ? 'Venta' : 
                                              tx.type === 'trade_in' ? 'Trade In' : 'Trade Out'}
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
            function showSearchLoading() {
                document.getElementById('searchResults').innerHTML = 
                    '<div class="p-4 text-center"><i class="fas fa-spinner fa-spin text-blue-600"></i> Buscando...</div>';
                document.getElementById('searchResults').classList.remove('hidden');
            }

            // Hide search results
            function hideSearchResults() {
                document.getElementById('searchResults').classList.add('hidden');
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

app.get('/wallet', (c) => {
  return c.html('<h1>Sección Wallet - En desarrollo</h1>')
})

app.get('/prices', (c) => {
  return c.html('<h1>Precios en Vivo - En desarrollo</h1>')
})

export default app