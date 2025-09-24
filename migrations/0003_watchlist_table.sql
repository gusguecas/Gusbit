-- Tabla de watchlist (seguimiento de activos con alertas)
-- Esta migración agrega la funcionalidad de watchlist que faltaba
-- SIN modificar código existente
CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_symbol TEXT NOT NULL,
  name TEXT,
  category TEXT NOT NULL CHECK (category IN ('stocks', 'etfs', 'crypto', 'fiat')),
  notes TEXT,
  target_price REAL, -- Precio objetivo para alertas
  alert_percent REAL, -- Porcentaje de cambio para alertas
  active_alerts BOOLEAN DEFAULT FALSE, -- Si las alertas están activas
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_symbol) REFERENCES assets(symbol)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_watchlist_added_at ON watchlist(added_at);
CREATE INDEX IF NOT EXISTS idx_watchlist_active_alerts ON watchlist(active_alerts);

-- Asegurarse de que los activos existen en la tabla assets PRIMERO
INSERT OR IGNORE INTO assets (symbol, name, category, api_source, api_id, current_price, price_updated_at) VALUES
('AAPL', 'Apple Inc.', 'stocks', 'alphavantage', 'AAPL', 175.85, '2025-09-23T23:15:02.730Z'),
('BTC', 'Bitcoin', 'crypto', 'coingecko', 'bitcoin', 43250.00, '2025-09-23T23:15:02.730Z'),
('SPY', 'SPDR S&P 500 ETF Trust', 'etfs', 'alphavantage', 'SPY', 442.15, '2025-09-23T23:15:02.730Z'),
('TSLA', 'Tesla, Inc.', 'stocks', 'alphavantage', 'TSLA', 248.50, '2025-09-23T23:15:02.730Z'),
('ETH', 'Ethereum', 'crypto', 'coingecko', 'ethereum', 2650.75, '2025-09-23T23:15:02.730Z');

-- Insertar datos de ejemplo para que el watchlist funcione inmediatamente
-- Estos son los mismos datos que aparecían simulados
INSERT OR IGNORE INTO watchlist (asset_symbol, name, category, notes, target_price, active_alerts, alert_percent, added_at) VALUES
('AAPL', 'Apple Inc.', 'stocks', 'Esperando resultados Q4 para posible entrada', 180.00, TRUE, 5.0, '2025-09-16T23:15:02.730Z'),
('BTC', 'Bitcoin', 'crypto', 'Análisis técnico sugiere soporte en 42k', 45000.00, TRUE, 3.0, '2025-09-20T23:15:02.730Z'),
('SPY', 'SPDR S&P 500 ETF Trust', 'etfs', 'ETF para diversificación del portfolio', 450.00, FALSE, NULL, '2025-09-09T23:15:02.730Z'),
('TSLA', 'Tesla, Inc.', 'stocks', 'Objetivo alcanzado - evaluar venta parcial', 240.00, TRUE, 2.0, '2025-09-18T23:15:02.730Z'),
('ETH', 'Ethereum', 'crypto', 'Esperando upgrade de red para impulso', 2800.00, TRUE, 4.0, '2025-09-21T23:15:02.730Z');