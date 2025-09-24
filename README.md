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
CREATE TABLE holdings (
  id INTEGER PRIMARY KEY,
  asset_symbol TEXT NOT NULL,
  quantity REAL NOT NULL,
  average_price REAL NOT NULL,
  current_value REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Watchlist (Seguimiento)**
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
```

### **Assets (Precios)**
```sql
CREATE TABLE assets (
  symbol TEXT PRIMARY KEY,
  name TEXT,
  current_price REAL,
  price_change_24h REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Funcionalidades Recientes Implementadas

### ✅ **Fixes Críticos (Septiembre 2024)**
1. **BTC Price Fix** - Corregido precio de $45K hardcoded a ~$112K real
2. **Exploration Mode** - Nueva página para activos no poseídos
3. **Unique Charts** - Cada activo muestra gráfica específica (no idénticas)
4. **CoinGecko Integration** - Datos reales para criptomonedas principales
5. **Markets Restoration** - Formato original con noticias e indicadores

### 🎯 **Modo Exploración**
- **Propósito:** Ver información de activos sin agregarlos al portafolio
- **Datos:** APIs externas + gráficas históricas reales
- **Timeframes:** 1D, 1W, 1M, 1Y con datos únicos por activo
- **Acciones:** Agregar a watchlist, configurar alertas

## 🛠️ Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos local
npm run db:migrate:local
npm run db:seed

# 3. Build del proyecto
npm run build

# 4. Ejecutar en desarrollo
npm run dev:sandbox  # Para sandbox (PM2)
npm run dev          # Para desarrollo local (Vite)

# 5. Testing
npm run test         # curl http://localhost:3000
```

## ☁️ Deployment

### **Cloudflare Pages**
```bash
# Build y deploy
npm run build
npx wrangler pages deploy dist --project-name gusbit-financial-tracker

# Con database
npx wrangler d1 migrations apply webapp-production
```

### **GitHub Integration**
```bash
# Setup GitHub (primer uso)
setup_github_environment

# Push cambios
git add .
git commit -m "Update description"
git push origin main
```

## 📱 Guía de Usuario

### 🎯 **Para Watchlist**
1. Agregar activos que quieres monitorear (no necesitas poseerlos)
2. Configurar precios objetivo y alertas
3. Hacer clic en "Analizar" para ver datos externos completos
4. El sistema te llevará al modo exploración (no al portafolio)

### 📊 **Para Portfolio**
1. Agregar transacciones de compra/venta
2. Ver rendimiento en tiempo real
3. Análisis de ganancias/pérdidas
4. Histórico completo de movimientos

### 📰 **Para Markets**
1. Noticias financieras actualizadas
2. Indicadores económicos (S&P 500, VIX, DXY, BTC)
3. Trending assets y recomendaciones
4. Fear & Greed Index

## 🔐 Configuración y Seguridad

- **API Keys:** Almacenadas como secretos de Cloudflare
- **Database:** Encriptada en Cloudflare D1
- **CORS:** Configurado para dominios específicos
- **Rate Limiting:** Implementado en endpoints críticos

## 📈 Status del Proyecto

- ✅ **Core Features:** Completamente funcionales
- ✅ **Real-time Prices:** APIs conectadas
- ✅ **Charts & Analytics:** Implementadas con datos únicos
- ✅ **Cloud Ready:** Preparado para Cloudflare Pages
- 🔄 **Continuous Updates:** APIs de mercado en tiempo real

## 👨‍💻 Información Técnica

- **Autor:** Sistema desarrollado para tracking financiero profesional
- **Version:** 2.0.0 (Major Update - Sept 2024)
- **Tech Stack:** Hono + Cloudflare + D1 + Chart.js + TailwindCSS
- **Performance:** Edge computing para latencia mínima global
- **Escalabilidad:** Arquitectura serverless autoscalable

---

## 🆘 Soporte y Updates

El sistema está diseñado para ser auto-mantenible con updates automáticos de precios. Para modificaciones o nuevas features, el código está completamente documentado y modularizado.

**¡Listo para deployment en la nube! 🚀**