
 ⛅️ wrangler 4.38.0
───────────────────
🌀 Executing on local database webapp-production (placeholder-will-be-replaced-when-deploying) from .wrangler/state/v3/d1:
🌀 To execute on your remote database, add a --remote flag to your wrangler command.
🚣 1 command executed successfully.
[
  {
    "results": [
      {
        "'INSERT INTO transactions VALUES(' || id || ',''' || type || ''',''' || asset_symbol || ''',''' || exchange || ''',' || quantity || ',' || price_per_unit || ',' || total_amount || ',' || fees || ',''' || notes || ''',''' || transaction_date || ''',''' || created_at || ''',''' || updated_at || ''',null,null,null,null,''' || currency || ''');'": "INSERT INTO transactions VALUES(1,'buy','BTC','Binance',0.5,45000.0,22500.0,50.0,'Compra inicial Bitcoin','2025-07-21 10:30:00','2025-09-21 19:26:36','2025-09-21 19:26:36',null,null,null,null,'USD');"
      },
      {
        "'INSERT INTO transactions VALUES(' || id || ',''' || type || ''',''' || asset_symbol || ''',''' || exchange || ''',' || quantity || ',' || price_per_unit || ',' || total_amount || ',' || fees || ',''' || notes || ''',''' || transaction_date || ''',''' || created_at || ''',''' || updated_at || ''',null,null,null,null,''' || currency || ''');'": "INSERT INTO transactions VALUES(2,'buy','ETH','Binance',2.0,3000.0,6000.0,20.0,'Compra Ethereum','2025-07-22 15:45:00','2025-09-21 19:26:36','2025-09-21 19:26:36',null,null,null,null,'USD');"
      },
      {
        "'INSERT INTO transactions VALUES(' || id || ',''' || type || ''',''' || asset_symbol || ''',''' || exchange || ''',' || quantity || ',' || price_per_unit || ',' || total_amount || ',' || fees || ',''' || notes || ''',''' || transaction_date || ''',''' || created_at || ''',''' || updated_at || ''',null,null,null,null,''' || currency || ''');'": "INSERT INTO transactions VALUES(3,'buy','AAPL','Etoro',10.0,150.0,1500.0,5.0,'Compra Apple','2025-07-23 09:15:00','2025-09-21 19:26:36','2025-09-21 19:26:36',null,null,null,null,'USD');"
      },
      {
        "'INSERT INTO transactions VALUES(' || id || ',''' || type || ''',''' || asset_symbol || ''',''' || exchange || ''',' || quantity || ',' || price_per_unit || ',' || total_amount || ',' || fees || ',''' || notes || ''',''' || transaction_date || ''',''' || created_at || ''',''' || updated_at || ''',null,null,null,null,''' || currency || ''');'": "INSERT INTO transactions VALUES(4,'buy','SPY','Etoro',5.0,400.0,2000.0,10.0,'ETF S&P 500','2025-07-25 14:20:00','2025-09-21 19:26:36','2025-09-21 19:26:36',null,null,null,null,'USD');"
      },
      {
        "'INSERT INTO transactions VALUES(' || id || ',''' || type || ''',''' || asset_symbol || ''',''' || exchange || ''',' || quantity || ',' || price_per_unit || ',' || total_amount || ',' || fees || ',''' || notes || ''',''' || transaction_date || ''',''' || created_at || ''',''' || updated_at || ''',null,null,null,null,''' || currency || ''');'": "INSERT INTO transactions VALUES(5,'buy','SUI','Binance',1000.0,1.5,1500.0,15.0,'Compra inicial SUI','2025-08-15 14:20:00','2025-09-21 19:28:48','2025-09-21 19:28:48',null,null,null,null,'USD');"
      },
      {
        "'INSERT INTO transactions VALUES(' || id || ',''' || type || ''',''' || asset_symbol || ''',''' || exchange || ''',' || quantity || ',' || price_per_unit || ',' || total_amount || ',' || fees || ',''' || notes || ''',''' || transaction_date || ''',''' || created_at || ''',''' || updated_at || ''',null,null,null,null,''' || currency || ''');'": "INSERT INTO transactions VALUES(6,'buy','BTC','Binance',0.1,58000.0,5800.0,25.0,'Compra adicional BTC','2025-08-05 16:15:00','2025-09-21 19:28:57','2025-09-21 19:28:57',null,null,null,null,'USD');"
      },
      {
        "'INSERT INTO transactions VALUES(' || id || ',''' || type || ''',''' || asset_symbol || ''',''' || exchange || ''',' || quantity || ',' || price_per_unit || ',' || total_amount || ',' || fees || ',''' || notes || ''',''' || transaction_date || ''',''' || created_at || ''',''' || updated_at || ''',null,null,null,null,''' || currency || ''');'": "INSERT INTO transactions VALUES(7,'buy','BTC','Binance',0.15,62000.0,9300.0,40.0,'Aprovechando subida BTC','2025-08-20 11:30:00','2025-09-21 19:28:57','2025-09-21 19:28:57',null,null,null,null,'USD');"
      },
      {
        "'INSERT INTO transactions VALUES(' || id || ',''' || type || ''',''' || asset_symbol || ''',''' || exchange || ''',' || quantity || ',' || price_per_unit || ',' || total_amount || ',' || fees || ',''' || notes || ''',''' || transaction_date || ''',''' || created_at || ''',''' || updated_at || ''',null,null,null,null,''' || currency || ''');'": "INSERT INTO transactions VALUES(8,'sell','BTC','Binance',0.05,65000.0,3250.0,15.0,'Venta parcial para tomar ganancias','2025-09-10 09:45:00','2025-09-21 19:28:57','2025-09-21 19:28:57',null,null,null,null,'USD');"
      },
      {
        "'INSERT INTO transactions VALUES(' || id || ',''' || type || ''',''' || asset_symbol || ''',''' || exchange || ''',' || quantity || ',' || price_per_unit || ',' || total_amount || ',' || fees || ',''' || notes || ''',''' || transaction_date || ''',''' || created_at || ''',''' || updated_at || ''',null,null,null,null,''' || currency || ''');'": "INSERT INTO transactions VALUES(9,'buy','BTC','Binance',0.08,63000.0,5040.0,22.0,'Recompra después de corrección','2025-09-18 14:20:00','2025-09-21 19:28:57','2025-09-21 19:28:57',null,null,null,null,'USD');"
      }
    ],
    "success": true,
    "meta": {
      "duration": 1
    }
  }
]
