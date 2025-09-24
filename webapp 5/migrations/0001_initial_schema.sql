-- Tabla de configuración (incluye contraseña para autenticación)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de activos (catálogo de todos los activos disponibles)
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('stocks', 'etfs', 'crypto', 'fiat')),
  subcategory TEXT,
  exchange TEXT,
  api_source TEXT, -- 'coingecko', 'alphavantage', 'yahoo'
  api_id TEXT, -- ID específico de la API
  current_price REAL DEFAULT 0,
  price_updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transacciones (compras, ventas, intercambios)
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'trade_in', 'trade_out')),
  asset_symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  quantity REAL NOT NULL,
  price_per_unit REAL NOT NULL,
  total_amount REAL NOT NULL, -- quantity * price_per_unit
  fees REAL DEFAULT 0,
  notes TEXT,
  transaction_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_symbol) REFERENCES assets(symbol)
);

-- Tabla de holdings actuales (calculado desde transacciones)
CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_symbol TEXT UNIQUE NOT NULL,
  quantity REAL NOT NULL,
  avg_purchase_price REAL NOT NULL, -- precio promedio de compra
  total_invested REAL NOT NULL, -- cantidad total invertida
  current_value REAL DEFAULT 0, -- valor actual (quantity * current_price)
  unrealized_pnl REAL DEFAULT 0, -- ganancia/pérdida no realizada
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_symbol) REFERENCES assets(symbol)
);

-- Tabla de snapshots diarios (registros automáticos a las 9pm)
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_symbol TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  quantity REAL NOT NULL,
  price_per_unit REAL NOT NULL,
  total_value REAL NOT NULL, -- quantity * price_per_unit
  unrealized_pnl REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_symbol) REFERENCES assets(symbol),
  UNIQUE(asset_symbol, snapshot_date)
);

-- Tabla de precios históricos (cache para gráficas)
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_symbol TEXT NOT NULL,
  price REAL NOT NULL,
  timestamp DATETIME NOT NULL,
  source TEXT NOT NULL, -- 'coingecko', 'alphavantage', etc.
  FOREIGN KEY (asset_symbol) REFERENCES assets(symbol),
  UNIQUE(asset_symbol, timestamp, source)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_transactions_asset ON transactions(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON daily_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_asset_date ON daily_snapshots(asset_symbol, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_price_history_asset ON price_history(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);