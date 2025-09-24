# GusBit Portfolio - Guía Completa de Respaldo y Despliegue

## 📦 Respaldo Completo Creado

**Fecha del Respaldo**: 20 de Septiembre, 2025
**URL de Descarga**: https://page.gensparksite.com/project_backups/tooluse_zwcsDqtRSROMaMPJDrmDjg.tar.gz
**Tamaño**: 625 KB
**Contenido**: Aplicación completa con código fuente, base de datos y configuración

## 🎯 ¿Qué incluye este respaldo?

### ✅ **Código Fuente Completo**:
- **Framework**: Hono.js para Cloudflare Workers/Pages
- **Frontend**: HTML + TailwindCSS + JavaScript vanilla
- **Backend**: API REST completa con autenticación
- **Base de datos**: Cloudflare D1 (SQLite) con esquema completo

### ✅ **Funcionalidades Implementadas**:
- 🔐 **Sistema de autenticación** completo
- 💰 **Gestión de wallet** con múltiples activos
- 📊 **Dashboard analítico** con gráficas interactivas
- 💱 **Sistema de transacciones** (compra, venta, trades)
- 📈 **Gráficas de rendimiento** por categorías
- 🎯 **Páginas de detalle de activos** con historial completo
- 📋 **Exportación a CSV** de todos los datos
- 🔍 **Búsqueda de precios en vivo**
- ⭐ **Watchlist** para seguimiento de activos

### ✅ **Base de Datos Incluida**:
- **Tablas**: users, assets, holdings, transactions, daily_snapshots, watchlist
- **Datos de prueba**: Usuarios, activos y transacciones de ejemplo
- **Esquema completo**: Todas las migraciones y estructura

## 🚀 Cómo Restaurar el Proyecto

### **Opción 1: Restauración Local**

```bash
# 1. Descargar el respaldo
wget https://page.gensparksite.com/project_backups/tooluse_zwcsDqtRSROMaMPJDrmDjg.tar.gz

# 2. Extraer en tu directorio home
cd ~
tar -xzf gusbit_portfolio_complete.tar.gz

# 3. Navegar al proyecto
cd webapp

# 4. Instalar dependencias
npm install

# 5. Configurar base de datos local
npm run db:migrate:local
npm run db:seed

# 6. Iniciar desarrollo local
npm run dev:sandbox
```

### **Opción 2: Despliegue a Cloudflare Pages**

```bash
# 1. Después de restaurar localmente (pasos 1-4 de arriba)

# 2. Configurar Cloudflare API
# Ve a https://dash.cloudflare.com/profile/api-tokens
# Crear token con permisos: Cloudflare Pages, D1, Workers

# 3. Configurar wrangler
npx wrangler login
# O configurar token manualmente:
export CLOUDFLARE_API_TOKEN=tu_token_aqui

# 4. Crear base de datos D1 en producción
npx wrangler d1 create gusbit-production

# 5. Actualizar wrangler.jsonc con el database_id
# Copiar el ID del comando anterior

# 6. Migrar base de datos a producción
npx wrangler d1 migrations apply gusbit-production

# 7. Crear proyecto de Pages
npx wrangler pages project create gusbit-portfolio --production-branch main

# 8. Desplegar a producción
npm run build
npx wrangler pages deploy dist --project-name gusbit-portfolio
```

## ⚙️ Configuración Requerida

### **Variables de Entorno** (.dev.vars para desarrollo):
```bash
# Crear archivo .dev.vars
echo "DATABASE_URL=local_sqlite_db" > .dev.vars
echo "JWT_SECRET=tu_clave_secreta_muy_larga" >> .dev.vars
```

### **Para Producción** (Cloudflare Secrets):
```bash
# Configurar secretos en producción
npx wrangler pages secret put JWT_SECRET --project-name gusbit-portfolio
# Introducir: una clave secreta larga y segura

# Si usas APIs externas (opcional):
npx wrangler pages secret put ALPHAVANTAGE_API_KEY --project-name gusbit-portfolio
npx wrangler pages secret put FINNHUB_API_KEY --project-name gusbit-portfolio
```

## 📁 Estructura del Proyecto

```
webapp/
├── src/
│   └── index.tsx           # Aplicación principal Hono
├── public/
│   └── static/
│       ├── styles.css      # Estilos personalizados
│       └── app.js          # JavaScript del frontend
├── migrations/
│   ├── 0001_initial_schema.sql    # Esquema inicial
│   ├── 0002_add_daily_snapshots.sql
│   └── 0003_add_watchlist.sql
├── seed.sql                # Datos de prueba
├── wrangler.jsonc         # Configuración Cloudflare
├── package.json           # Dependencias y scripts
├── ecosystem.config.cjs   # Configuración PM2
└── README.md              # Documentación del proyecto
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Vite dev server
npm run dev:sandbox      # Wrangler Pages dev (sandbox)
npm run build           # Construir para producción

# Base de datos
npm run db:migrate:local   # Migrar DB local
npm run db:migrate:prod    # Migrar DB producción
npm run db:seed           # Insertar datos de prueba
npm run db:reset          # Reset completo de DB local

# Despliegue
npm run deploy           # Desplegar a Cloudflare Pages
npm run preview          # Preview local del build

# Utilidades
npm run git:init         # Inicializar git
npm run git:commit       # Commit rápido
```

## 🔒 Usuarios de Prueba Incluidos

```
Admin:
- Email: admin@gusbit.com
- Password: admin123
- Acceso: Completo

Usuario Demo:
- Email: demo@gusbit.com  
- Password: demo123
- Acceso: Usuario estándar
```

## 💾 Base de Datos Pre-poblada

El respaldo incluye datos de ejemplo:
- **5 usuarios** de prueba
- **20+ activos** (Bitcoin, Ethereum, Apple, Tesla, etc.)
- **50+ transacciones** de ejemplo
- **Historial diario** desde julio 2025
- **Holdings** con valores actuales

## 🌐 URLs de Producción Ejemplo

Después del despliegue tendrás URLs como:
- **Producción**: https://gusbit-portfolio.pages.dev
- **Preview**: https://main.gusbit-portfolio.pages.dev

## 🆘 Resolución de Problemas

### **Error: "Database not found"**
```bash
# Verificar configuración D1
npx wrangler d1 list

# Recrear base de datos
npx wrangler d1 create gusbit-production
npm run db:migrate:prod
```

### **Error: "Authentication failed"**
```bash
# Reconfigurar Cloudflare
npx wrangler logout
npx wrangler login
```

### **Error: "Build failed"**
```bash
# Limpiar y reinstalar
rm -rf node_modules dist .wrangler
npm install
npm run build
```

## 📞 Soporte y Contacto

Este proyecto fue desarrollado como un sistema completo de gestión de portafolio financiero con:
- ✅ **Arquitectura moderna** (Hono + Cloudflare)
- ✅ **Funcionalidades completas** (CRUD, auth, analytics)
- ✅ **Diseño responsive** y profesional
- ✅ **Base de datos robusta** con relaciones
- ✅ **Despliegue automático** a la nube

**Fecha de creación**: Septiembre 2025
**Tecnologías**: Hono.js, Cloudflare Pages, D1 Database, TailwindCSS
**Licencia**: Proyecto personal

---

## 🎯 Próximos Pasos Recomendados

1. **Restaurar localmente** para desarrollo
2. **Configurar Cloudflare** para producción
3. **Personalizar datos** (usuarios, activos)
4. **Configurar dominio personalizado** (opcional)
5. **Añadir APIs de precios reales** (opcional)

¡Tu aplicación GusBit está lista para producción! 🚀