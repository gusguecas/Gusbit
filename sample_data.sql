-- Insertar assets de ejemplo
INSERT OR REPLACE INTO assets (symbol, name, current_price, category, api_source, api_id) VALUES 
('BTC', 'Bitcoin', 67500.00, 'crypto', 'coingecko', 'bitcoin'),
('ETH', 'Ethereum', 3980.00, 'crypto', 'coingecko', 'ethereum'),
('AAPL', 'Apple Inc.', 175.85, 'stocks', 'yahoo', 'AAPL'),
('TSLA', 'Tesla Inc.', 248.50, 'stocks', 'yahoo', 'TSLA'),
('SPY', 'SPDR S&P 500 ETF', 442.15, 'etfs', 'yahoo', 'SPY'),
('QQQ', 'Invesco QQQ Trust', 375.20, 'etfs', 'yahoo', 'QQQ'),
('SOL', 'Solana', 145.80, 'crypto', 'coingecko', 'solana');

-- Insertar holdings de ejemplo
INSERT OR REPLACE INTO holdings (asset_symbol, quantity, average_price, current_value) VALUES 
('BTC', 0.5, 65000.00, 33750.00),
('ETH', 2.0, 3800.00, 7960.00),
('AAPL', 10.0, 170.00, 1758.50),
('TSLA', 5.0, 250.00, 1242.50),
('SPY', 15.0, 440.00, 6632.25),
('SOL', 50.0, 140.00, 7290.00);

-- Insertar transacciones de ejemplo
INSERT OR REPLACE INTO transactions (asset_symbol, transaction_type, quantity, price_per_unit, transaction_date, notes) VALUES 
('BTC', 'buy', 0.5, 65000.00, '2024-09-20 10:30:00', 'Compra inicial Bitcoin'),
('ETH', 'buy', 2.0, 3800.00, '2024-09-21 14:15:00', 'Compra Ethereum'),
('AAPL', 'buy', 10.0, 170.00, '2024-09-22 09:45:00', 'Compra acciones Apple'),
('TSLA', 'buy', 5.0, 250.00, '2024-09-22 16:20:00', 'Compra Tesla');

-- Crear snapshots para los últimos 30 días
INSERT OR REPLACE INTO daily_snapshots (snapshot_date, asset_symbol, quantity, price_per_unit, total_value) VALUES 
-- Septiembre 21, 2024
('2024-09-21', 'BTC', 0.5, 66500.00, 33250.00),
('2024-09-21', 'ETH', 2.0, 3850.00, 7700.00),
('2024-09-21', 'AAPL', 10.0, 172.00, 1720.00),
('2024-09-21', 'TSLA', 5.0, 245.00, 1225.00),
('2024-09-21', 'SPY', 15.0, 441.00, 6615.00),
('2024-09-21', 'SOL', 50.0, 142.00, 7100.00),

-- Septiembre 22, 2024
('2024-09-22', 'BTC', 0.5, 67000.00, 33500.00),
('2024-09-22', 'ETH', 2.0, 3900.00, 7800.00),
('2024-09-22', 'AAPL', 10.0, 174.00, 1740.00),
('2024-09-22', 'TSLA', 5.0, 247.00, 1235.00),
('2024-09-22', 'SPY', 15.0, 441.50, 6622.50),
('2024-09-22', 'SOL', 50.0, 144.00, 7200.00),

-- Septiembre 23, 2024 (hoy)
('2024-09-23', 'BTC', 0.5, 67500.00, 33750.00),
('2024-09-23', 'ETH', 2.0, 3980.00, 7960.00),
('2024-09-23', 'AAPL', 10.0, 175.85, 1758.50),
('2024-09-23', 'TSLA', 5.0, 248.50, 1242.50),
('2024-09-23', 'SPY', 15.0, 442.15, 6632.25),
('2024-09-23', 'SOL', 50.0, 145.80, 7290.00);