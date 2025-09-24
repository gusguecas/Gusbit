# 🚀 GusBit Financial Tracker

## 📊 Sistema Completo de Seguimiento de Inversiones

**GusBit** es una plataforma avanzada para el tracking de inversiones en tiempo real que incluye acciones, ETFs y criptomonedas con análisis técnico profesional y alertas inteligentes.

## ✨ Características Principales

### 🎯 **Funcionalidades Core**
- **Dashboard Ejecutivo** - Vista panorámica de todo tu portafolio
- **Watchlist Operativo** - Seguimiento activo con alertas personalizadas  
- **Markets Hub** - Noticias financieras, indicadores y trending assets
- **Crypto Hub** - Centro especializado en criptomonedas
- **Modo Exploración** - Análisis de activos sin necesidad de poseerlos

### 📈 **Características Técnicas**
- **Precios en Tiempo Real** - Conectado a APIs externas (CoinGecko, Yahoo Finance)
- **Gráficas Históricas** - Timeframes: 1D, 1W, 1M, 1Y con datos únicos por activo
- **Alertas Inteligentes** - Notificaciones cuando se alcanzan objetivos
- **Base de Datos D1** - Persistencia completa de datos
- **Arquitectura Edge** - Desplegado en Cloudflare Workers/Pages

## 🔗 URLs de Acceso

### 🌐 **Aplicación Principal**
- **Dashboard:** `/` - Vista general del sistema
- **Watchlist:** `/watchlist` - Control de inversiones con alertas
- **Markets:** `/prices` - Hub de mercados y noticias
- **Crypto Hub:** `/crypto` - Centro de criptomonedas
- **Portfolio:** `/wallet` - Gestión completa de portafolio

### 🔍 **Modo Exploración (Nuevo)**
- **Explorar BTC:** `/explore/BTC?category=crypto`
- **Explorar AAPL:** `/explore/AAPL?category=stocks`
- **Explorar TSLA:** `/explore/TSLA?category=stocks`
- **API Histórica:** `/api/historical/:symbol?timeframe=1D&category=crypto`

## 🏗️ Arquitectura Técnica

### **Frontend**
- **Framework:** Hono + TypeScript para edge computing
- **Styling:** TailwindCSS con diseño ejecutivo dark theme
- **Charts:** Chart.js para gráficas interactivas
- **Icons:** FontAwesome 6.4.0

### **Backend & APIs**
- **Runtime:** Cloudflare Workers (edge-first)
- **Database:** Cloudflare D1 SQLite
- **External APIs:** 
  - CoinGecko (criptomonedas reales)
  - Yahoo Finance (acciones estimadas)
  - Alternative.me (Fear & Greed Index)

### **Deployment**
- **Platform:** Cloudflare Pages
- **CDN:** Global edge distribution
- **Build:** Vite + Wrangler CLI

## 📊 Modelos de Datos

### **Holdings (Portafolio)**
```sql
CREATE TABLE watchlist (
  id INTEGER PRIMARY KEY,
  asset_symbol TEXT UNIQUE NOT NULL,
  name TEXT,
  category TEXT NOT NULL,
  target_price REAL,
  notes TEXT,
  active_alerts BOOLEAN DEFAULT FALSE,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE assets (
  symbol TEXT PRIMARY KEY,
  name TEXT,
  current_price REAL,
  price_change_24h REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
TABLE holdings (
  id INTEGER PRIMARY KEY,
  asset_symbol TEXT NOT NULL,
  quantity REAL NOT NULL,
  average_price REAL NOT NULL,
  current_value REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
