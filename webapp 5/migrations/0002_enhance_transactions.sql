-- Mejoras a la tabla de transacciones para capturar información completa de compras
-- Agregamos campos para: hora exacta, lugar/tienda/broker específico, y mejor información de compra

-- Agregar nueva columna para lugar específico de compra (más detallado que exchange)
ALTER TABLE transactions ADD COLUMN purchase_location TEXT;

-- Agregar columna para hora exacta (separada de la fecha)
ALTER TABLE transactions ADD COLUMN purchase_time TEXT; -- formato HH:MM:SS

-- Agregar columna para información adicional de la compra
ALTER TABLE transactions ADD COLUMN purchase_method TEXT; -- 'online', 'app', 'presencial', etc.

-- Agregar columna para referencia/número de transacción
ALTER TABLE transactions ADD COLUMN transaction_reference TEXT;

-- Agregar columna para moneda de la transacción
ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'USD';

-- Comentario explicativo para el campo notes (ya existe)
-- El campo 'notes' debe usarse para información adicional como:
-- - Condiciones especiales de la compra
-- - Promociones aplicadas
-- - Número de confirmación
-- - Cualquier detalle relevante

-- Índices para mejorar búsquedas por ubicación y método de compra
CREATE INDEX IF NOT EXISTS idx_transactions_purchase_location ON transactions(purchase_location);
CREATE INDEX IF NOT EXISTS idx_transactions_purchase_method ON transactions(purchase_method);
CREATE INDEX IF NOT EXISTS idx_transactions_currency ON transactions(currency);

-- Actualizar transacciones existentes con valores por defecto
UPDATE transactions 
SET 
    purchase_location = COALESCE(exchange, 'No especificado'),
    purchase_time = '00:00:00',
    purchase_method = 'online',
    currency = 'USD'
WHERE purchase_location IS NULL;