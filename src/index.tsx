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
// PLACEHOLDER ROUTES (to be implemented)
// ============================================

app.get('/transactions', (c) => {
  return c.html('<h1>Sección de Transacciones - En desarrollo</h1>')
})

app.get('/wallet', (c) => {
  return c.html('<h1>Sección Wallet - En desarrollo</h1>')
})

app.get('/prices', (c) => {
  return c.html('<h1>Precios en Vivo - En desarrollo</h1>')
})

export default app