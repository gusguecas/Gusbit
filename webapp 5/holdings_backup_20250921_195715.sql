
 ⛅️ wrangler 4.38.0
───────────────────
🌀 Executing on local database webapp-production (placeholder-will-be-replaced-when-deploying) from .wrangler/state/v3/d1:
🌀 To execute on your remote database, add a --remote flag to your wrangler command.
🚣 1 command executed successfully.
[
  {
    "results": [
      {
        "'INSERT INTO holdings VALUES(' || id || ',''' || asset_symbol || ''',' || quantity || ',' || avg_purchase_price || ',' || total_invested || ',' || current_value || ',' || unrealized_pnl || ',''' || last_updated || ''');'": "INSERT INTO holdings VALUES(1,'BTC',0.78,50694.87,39542.0,50700.0,11158.0,'2025-09-21 19:29:10');"
      },
      {
        "'INSERT INTO holdings VALUES(' || id || ',''' || asset_symbol || ''',' || quantity || ',' || avg_purchase_price || ',' || total_invested || ',' || current_value || ',' || unrealized_pnl || ',''' || last_updated || ''');'": "INSERT INTO holdings VALUES(2,'ETH',2.0,3000.0,6000.0,0.0,0.0,'2025-09-21 19:26:36');"
      },
      {
        "'INSERT INTO holdings VALUES(' || id || ',''' || asset_symbol || ''',' || quantity || ',' || avg_purchase_price || ',' || total_invested || ',' || current_value || ',' || unrealized_pnl || ',''' || last_updated || ''');'": "INSERT INTO holdings VALUES(5,'SUI',1000.0,1.5,1500.0,2500.0,1000.0,'2025-09-21 19:28:42');"
      }
    ],
    "success": true,
    "meta": {
      "duration": 1
    }
  }
]
