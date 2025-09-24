-- Datos de prueba con estructura exacta de las tablas

-- Assets
INSERT OR REPLACE INTO assets (symbol, name, category, created_at) VALUES 
  ('BTC', 'Bitcoin', 'crypto', datetime('now')),
  ('ETH', 'Ethereum', 'crypto', datetime('now')),
  ('AAPL', 'Apple Inc', 'stocks', datetime('now'));

-- Transactions (estructura correcta)
INSERT OR REPLACE INTO transactions (asset_symbol, type, exchange, quantity, price_per_unit, total_amount, transaction_date, created_at) VALUES
  ('BTC', 'buy', 'Binance', 0.5, 60000.00, 30000.00, '2024-09-15 10:00:00', datetime('now')),
  ('ETH', 'buy', 'Binance', 5.0, 2400.00, 12000.00, '2024-09-16 11:00:00', datetime('now')),
  ('AAPL', 'buy', 'NYSE', 10.0, 150.00, 1500.00, '2024-09-17 12:00:00', datetime('now'));

-- Holdings (estructura correcta)
INSERT OR REPLACE INTO holdings (asset_symbol, quantity, avg_purchase_price, total_invested, current_value, unrealized_pnl, last_updated) VALUES
  ('BTC', 0.5, 60000.00, 30000.00, 57857.76, 27857.76, datetime('now')),
  ('ETH', 5.0, 2400.00, 12000.00, 12100.00, 100.00, datetime('now')),
  ('AAPL', 10.0, 150.00, 1500.00, 1550.00, 50.00, datetime('now'));

-- Daily Snapshots - EL DATO CRÍTICO (Sep 20 con ETH correcto)
INSERT OR REPLACE INTO daily_snapshots (asset_symbol, snapshot_date, quantity, price_per_unit, total_value, created_at) VALUES
  -- September 20, 2024 - ETH DEBE MOSTRAR 2420.00 NO 115715.52
  ('ETH', '2024-09-20 21:00:00', 5.0, 2420.00, 12100.00, datetime('now')),
  ('BTC', '2024-09-20 21:00:00', 0.5, 115715.52, 57857.76, datetime('now')),
  ('AAPL', '2024-09-20 21:00:00', 10.0, 155.00, 1550.00, datetime('now')),
  
  -- September 21, 2024 
  ('ETH', '2024-09-21 21:00:00', 5.0, 2420.00, 12100.00, datetime('now')),
  ('BTC', '2024-09-21 21:00:00', 0.5, 115715.52, 57857.76, datetime('now')),
  ('AAPL', '2024-09-21 21:00:00', 10.0, 155.00, 1550.00, datetime('now'));

-- Price History
INSERT OR REPLACE INTO price_history (asset_symbol, date, price, created_at) VALUES
  ('BTC', '2024-09-20', 115715.52, datetime('now')),
  ('BTC', '2024-09-21', 115715.52, datetime('now')),
  ('ETH', '2024-09-20', 2420.00, datetime('now')),
  ('ETH', '2024-09-21', 2420.00, datetime('now')),
  ('AAPL', '2024-09-20', 155.00, datetime('now')),
  ('AAPL', '2024-09-21', 155.00, datetime('now'));