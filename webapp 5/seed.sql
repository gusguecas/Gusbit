-- Configuración inicial
INSERT OR IGNORE INTO config (key, value) VALUES 
  ('app_password', 'asset123'), -- Contraseña por defecto (cambiarla después)
  ('last_snapshot_date', ''),
  ('app_initialized', 'true');

-- Exchanges predefinidos para el dropdown
INSERT OR IGNORE INTO config (key, value) VALUES 
  ('exchanges', 'Bitso,Binance,Etoro,Lbank,Metamask,Bybit,Dexscreener,Ledger');

-- Activos de ejemplo más comunes (se agregarán más dinámicamente)
INSERT OR IGNORE INTO assets (symbol, name, category, subcategory, api_source, api_id) VALUES 
  -- Criptos principales
  ('BTC', 'Bitcoin', 'crypto', 'major', 'coingecko', 'bitcoin'),
  ('ETH', 'Ethereum', 'crypto', 'major', 'coingecko', 'ethereum'),
  ('USDT', 'Tether', 'crypto', 'stablecoin', 'coingecko', 'tether'),
  ('BNB', 'Binance Coin', 'crypto', 'exchange', 'coingecko', 'binancecoin'),
  ('ADA', 'Cardano', 'crypto', 'altcoin', 'coingecko', 'cardano'),
  ('SOL', 'Solana', 'crypto', 'altcoin', 'coingecko', 'solana'),
  
  -- Acciones tech principales
  ('AAPL', 'Apple Inc.', 'stocks', 'technology', 'alphavantage', 'AAPL'),
  ('MSFT', 'Microsoft Corporation', 'stocks', 'technology', 'alphavantage', 'MSFT'),
  ('GOOGL', 'Alphabet Inc.', 'stocks', 'technology', 'alphavantage', 'GOOGL'),
  ('TSLA', 'Tesla Inc.', 'stocks', 'technology', 'alphavantage', 'TSLA'),
  ('NVDA', 'NVIDIA Corporation', 'stocks', 'technology', 'alphavantage', 'NVDA'),
  
  -- ETFs populares
  ('SPY', 'SPDR S&P 500 ETF', 'etfs', 'index', 'alphavantage', 'SPY'),
  ('QQQ', 'Invesco QQQ Trust', 'etfs', 'technology', 'alphavantage', 'QQQ'),
  ('VTI', 'Vanguard Total Stock Market ETF', 'etfs', 'index', 'alphavantage', 'VTI'),
  
  -- Fiat
  ('USD', 'US Dollar', 'fiat', 'currency', 'manual', 'USD');

-- Transacciones de ejemplo (opcional - puedes borrar estas líneas)
INSERT OR IGNORE INTO transactions (type, asset_symbol, exchange, quantity, price_per_unit, total_amount, fees, transaction_date, notes) VALUES 
  ('buy', 'BTC', 'Binance', 0.5, 45000.00, 22500.00, 50.00, '2025-07-21 10:30:00', 'Compra inicial Bitcoin'),
  ('buy', 'ETH', 'Binance', 2.0, 3000.00, 6000.00, 20.00, '2025-07-22 15:45:00', 'Compra Ethereum'),
  ('buy', 'AAPL', 'Etoro', 10, 150.00, 1500.00, 5.00, '2025-07-23 09:15:00', 'Compra Apple'),
  ('buy', 'SPY', 'Etoro', 5, 400.00, 2000.00, 10.00, '2025-07-25 14:20:00', 'ETF S&P 500');

-- Inicializar holdings basado en transacciones de ejemplo
INSERT OR IGNORE INTO holdings (asset_symbol, quantity, avg_purchase_price, total_invested) VALUES 
  ('BTC', 0.5, 45000.00, 22500.00),
  ('ETH', 2.0, 3000.00, 6000.00),
  ('AAPL', 10, 150.00, 1500.00),
  ('SPY', 5, 400.00, 2000.00);