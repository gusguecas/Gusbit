-- Migración para corregir datos hardcodeados incorrectos en watchlist
-- Elimina los datos con precios incorrectos y permite que la API actualice con precios reales

-- Eliminar datos hardcodeados incorrectos de assets
DELETE FROM assets WHERE symbol IN ('AAPL', 'BTC', 'SPY', 'TSLA', 'ETH') AND current_price IN (175.85, 43250.00, 442.15, 248.50, 2650.75);

-- Eliminar datos hardcodeados incorrectos de watchlist
DELETE FROM watchlist WHERE asset_symbol = 'BTC' AND target_price = 45000.00;

-- Insertar solo los símbolos necesarios sin precios hardcodeados (precios se actualizarán vía API)
INSERT OR IGNORE INTO assets (symbol, name, category, api_source, api_id, current_price, price_updated_at) VALUES
('AAPL', 'Apple Inc.', 'stocks', 'alphavantage', 'AAPL', NULL, NULL),
('BTC', 'Bitcoin', 'crypto', 'coingecko', 'bitcoin', NULL, NULL),
('SPY', 'SPDR S&P 500 ETF Trust', 'etfs', 'alphavantage', 'SPY', NULL, NULL),
('TSLA', 'Tesla, Inc.', 'stocks', 'alphavantage', 'TSLA', NULL, NULL),
('ETH', 'Ethereum', 'crypto', 'coingecko', 'ethereum', NULL, NULL);

-- Insertar watchlist items con precios objetivo más realistas
INSERT OR IGNORE INTO watchlist (asset_symbol, name, category, notes, target_price, active_alerts, alert_percent, added_at) VALUES
('AAPL', 'Apple Inc.', 'stocks', 'Esperando resultados Q4 para posible entrada', 180.00, TRUE, 5.0, datetime('now')),
('BTC', 'Bitcoin', 'crypto', 'Análisis técnico - seguimiento de tendencia alcista', 115000.00, TRUE, 3.0, datetime('now')),
('SPY', 'SPDR S&P 500 ETF Trust', 'etfs', 'ETF para diversificación del portfolio', 450.00, FALSE, NULL, datetime('now')),
('TSLA', 'Tesla, Inc.', 'stocks', 'Objetivo alcanzado - evaluar venta parcial', 240.00, TRUE, 2.0, datetime('now')),
('ETH', 'Ethereum', 'crypto', 'Esperando upgrade de red para impulso', 4000.00, TRUE, 4.0, datetime('now'));