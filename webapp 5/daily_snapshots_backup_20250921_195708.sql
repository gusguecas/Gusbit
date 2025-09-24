
 ⛅️ wrangler 4.38.0
───────────────────
🌀 Executing on local database webapp-production (placeholder-will-be-replaced-when-deploying) from .wrangler/state/v3/d1:
🌀 To execute on your remote database, add a --remote flag to your wrangler command.
🚣 1 command executed successfully.
[
  {
    "results": [
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(1,'BTC','2025-07-21',0.5,45000.0,22500.0,0.0,'2025-07-21 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(2,'BTC','2025-07-22',0.5,45200.0,22600.0,100.0,'2025-07-22 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(3,'BTC','2025-07-23',0.5,44800.0,22400.0,-100.0,'2025-07-23 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(4,'BTC','2025-07-24',0.5,45500.0,22750.0,250.0,'2025-07-24 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(5,'BTC','2025-07-25',0.5,46200.0,23100.0,600.0,'2025-07-25 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(6,'BTC','2025-07-26',0.5,45800.0,22900.0,400.0,'2025-07-26 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(7,'BTC','2025-07-27',0.5,46500.0,23250.0,750.0,'2025-07-27 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(8,'BTC','2025-07-28',0.5,47200.0,23600.0,1100.0,'2025-07-28 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(9,'BTC','2025-07-29',0.5,47800.0,23900.0,1400.0,'2025-07-29 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(10,'BTC','2025-07-30',0.5,48500.0,24250.0,1750.0,'2025-07-30 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(11,'BTC','2025-07-31',0.5,49200.0,24600.0,2100.0,'2025-07-31 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(12,'BTC','2025-08-01',0.5,49800.0,24900.0,2400.0,'2025-08-01 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(13,'BTC','2025-08-02',0.5,50500.0,25250.0,2750.0,'2025-08-02 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(14,'BTC','2025-08-03',0.5,51200.0,25600.0,3100.0,'2025-08-03 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(15,'BTC','2025-08-04',0.5,52000.0,26000.0,3500.0,'2025-08-04 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(16,'BTC','2025-08-05',0.6,58000.0,34800.0,5300.0,'2025-08-05 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(17,'BTC','2025-08-06',0.6,58200.0,34920.0,5420.0,'2025-08-06 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(18,'BTC','2025-08-07',0.6,57800.0,34680.0,5180.0,'2025-08-07 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(19,'BTC','2025-08-08',0.6,58500.0,35100.0,5600.0,'2025-08-08 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(20,'BTC','2025-08-09',0.6,59200.0,35520.0,6020.0,'2025-08-09 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(21,'BTC','2025-08-10',0.6,59800.0,35880.0,6380.0,'2025-08-10 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(22,'BTC','2025-08-11',0.6,60500.0,36300.0,6800.0,'2025-08-11 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(23,'BTC','2025-08-12',0.6,61200.0,36720.0,7220.0,'2025-08-12 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(24,'BTC','2025-08-13',0.6,60800.0,36480.0,6980.0,'2025-08-13 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(25,'BTC','2025-08-14',0.6,61500.0,36900.0,7400.0,'2025-08-14 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(26,'BTC','2025-08-15',0.6,62200.0,37320.0,7820.0,'2025-08-15 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(27,'BTC','2025-08-16',0.6,61800.0,37080.0,7580.0,'2025-08-16 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(28,'BTC','2025-08-17',0.6,62500.0,37500.0,8000.0,'2025-08-17 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(29,'BTC','2025-08-18',0.6,63200.0,37920.0,8420.0,'2025-08-18 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(30,'BTC','2025-08-19',0.6,62800.0,37680.0,8180.0,'2025-08-19 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(31,'BTC','2025-08-20',0.75,62000.0,46500.0,8600.0,'2025-08-20 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(32,'BTC','2025-08-21',0.75,62300.0,46725.0,8825.0,'2025-08-21 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(33,'BTC','2025-08-22',0.75,63000.0,47250.0,9350.0,'2025-08-22 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(34,'BTC','2025-08-23',0.75,63800.0,47850.0,9950.0,'2025-08-23 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(35,'BTC','2025-08-24',0.75,64200.0,48150.0,10250.0,'2025-08-24 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(36,'BTC','2025-08-25',0.75,64800.0,48600.0,10700.0,'2025-08-25 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(37,'BTC','2025-08-26',0.75,65200.0,48900.0,11000.0,'2025-08-26 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(38,'BTC','2025-08-27',0.75,64900.0,48675.0,10775.0,'2025-08-27 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(39,'BTC','2025-08-28',0.75,65500.0,49125.0,11225.0,'2025-08-28 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(40,'BTC','2025-08-29',0.75,66200.0,49650.0,11750.0,'2025-08-29 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(41,'BTC','2025-08-30',0.75,65800.0,49350.0,11450.0,'2025-08-30 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(42,'BTC','2025-08-31',0.75,66500.0,49875.0,11975.0,'2025-08-31 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(43,'BTC','2025-09-01',0.75,66800.0,50100.0,12200.0,'2025-09-01 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(44,'BTC','2025-09-02',0.75,67200.0,50400.0,12500.0,'2025-09-02 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(45,'BTC','2025-09-03',0.75,66900.0,50175.0,12275.0,'2025-09-03 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(46,'BTC','2025-09-04',0.75,67500.0,50625.0,12725.0,'2025-09-04 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(47,'BTC','2025-09-05',0.75,67800.0,50850.0,12950.0,'2025-09-05 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(48,'BTC','2025-09-06',0.75,67200.0,50400.0,12500.0,'2025-09-06 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(49,'BTC','2025-09-07',0.75,66800.0,50100.0,12200.0,'2025-09-07 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(50,'BTC','2025-09-08',0.75,65500.0,49125.0,11225.0,'2025-09-08 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(51,'BTC','2025-09-09',0.75,65200.0,48900.0,11000.0,'2025-09-09 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(52,'BTC','2025-09-10',0.7,65000.0,45500.0,10364.0,'2025-09-10 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(53,'BTC','2025-09-11',0.7,64500.0,45150.0,10014.0,'2025-09-11 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(54,'BTC','2025-09-12',0.7,63800.0,44660.0,9524.0,'2025-09-12 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(55,'BTC','2025-09-13',0.7,63200.0,44240.0,9104.0,'2025-09-13 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(56,'BTC','2025-09-14',0.7,62800.0,43960.0,8824.0,'2025-09-14 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(57,'BTC','2025-09-15',0.7,63500.0,44450.0,9314.0,'2025-09-15 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(58,'BTC','2025-09-16',0.7,64200.0,44940.0,9804.0,'2025-09-16 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(59,'BTC','2025-09-17',0.7,63800.0,44660.0,9524.0,'2025-09-17 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(60,'BTC','2025-09-18',0.78,63000.0,49140.0,9598.0,'2025-09-18 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(61,'BTC','2025-09-19',0.78,63500.0,49530.0,9988.0,'2025-09-19 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(62,'BTC','2025-09-20',0.78,65000.0,50700.0,11158.0,'2025-09-20 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(63,'ETH','2025-07-21',2.0,3200.0,6400.0,400.0,'2025-07-21 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(64,'ETH','2025-07-22',2.0,3180.0,6360.0,360.0,'2025-07-22 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(65,'ETH','2025-07-23',2.0,3220.0,6440.0,440.0,'2025-07-23 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(66,'ETH','2025-07-24',2.0,3250.0,6500.0,500.0,'2025-07-24 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(67,'ETH','2025-07-25',2.0,3280.0,6560.0,560.0,'2025-07-25 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(68,'ETH','2025-07-26',2.0,3300.0,6600.0,600.0,'2025-07-26 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(69,'ETH','2025-07-27',2.0,3320.0,6640.0,640.0,'2025-07-27 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(70,'ETH','2025-07-28',2.0,3350.0,6700.0,700.0,'2025-07-28 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(71,'ETH','2025-07-29',2.0,3380.0,6760.0,760.0,'2025-07-29 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(72,'ETH','2025-07-30',2.0,3400.0,6800.0,800.0,'2025-07-30 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(73,'ETH','2025-07-31',2.0,3420.0,6840.0,840.0,'2025-07-31 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(74,'ETH','2025-08-01',2.0,3450.0,6900.0,900.0,'2025-08-01 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(75,'ETH','2025-08-02',2.0,3480.0,6960.0,960.0,'2025-08-02 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(76,'ETH','2025-08-03',2.0,3500.0,7000.0,1000.0,'2025-08-03 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(77,'ETH','2025-08-04',2.0,3520.0,7040.0,1040.0,'2025-08-04 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(78,'ETH','2025-08-05',2.0,3550.0,7100.0,1100.0,'2025-08-05 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(79,'ETH','2025-08-06',2.0,3580.0,7160.0,1160.0,'2025-08-06 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(80,'ETH','2025-08-07',2.0,3600.0,7200.0,1200.0,'2025-08-07 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(81,'ETH','2025-08-08',2.0,3620.0,7240.0,1240.0,'2025-08-08 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(82,'ETH','2025-08-09',2.0,3650.0,7300.0,1300.0,'2025-08-09 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(83,'ETH','2025-08-10',2.0,3680.0,7360.0,1360.0,'2025-08-10 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(84,'ETH','2025-08-11',2.0,3700.0,7400.0,1400.0,'2025-08-11 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(85,'ETH','2025-08-12',2.0,3720.0,7440.0,1440.0,'2025-08-12 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(86,'ETH','2025-08-13',2.0,3750.0,7500.0,1500.0,'2025-08-13 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(87,'ETH','2025-08-14',2.0,3780.0,7560.0,1560.0,'2025-08-14 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(88,'ETH','2025-08-15',2.0,3800.0,7600.0,1600.0,'2025-08-15 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(89,'ETH','2025-08-16',2.0,3820.0,7640.0,1640.0,'2025-08-16 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(90,'ETH','2025-08-17',2.0,3850.0,7700.0,1700.0,'2025-08-17 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(91,'ETH','2025-08-18',2.0,3880.0,7760.0,1760.0,'2025-08-18 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(92,'ETH','2025-08-19',2.0,3900.0,7800.0,1800.0,'2025-08-19 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(93,'ETH','2025-08-20',2.0,3920.0,7840.0,1840.0,'2025-08-20 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(94,'ETH','2025-08-21',2.0,3950.0,7900.0,1900.0,'2025-08-21 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(95,'ETH','2025-08-22',2.0,3980.0,7960.0,1960.0,'2025-08-22 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(96,'ETH','2025-08-23',2.0,4000.0,8000.0,2000.0,'2025-08-23 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(97,'ETH','2025-08-24',2.0,4020.0,8040.0,2040.0,'2025-08-24 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(98,'ETH','2025-08-25',2.0,4050.0,8100.0,2100.0,'2025-08-25 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(99,'ETH','2025-08-26',2.0,4080.0,8160.0,2160.0,'2025-08-26 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(100,'ETH','2025-08-27',2.0,4100.0,8200.0,2200.0,'2025-08-27 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(101,'ETH','2025-08-28',2.0,4120.0,8240.0,2240.0,'2025-08-28 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(102,'ETH','2025-08-29',2.0,4150.0,8300.0,2300.0,'2025-08-29 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(103,'ETH','2025-08-30',2.0,4180.0,8360.0,2360.0,'2025-08-30 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(104,'ETH','2025-08-31',2.0,4200.0,8400.0,2400.0,'2025-08-31 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(105,'ETH','2025-09-01',2.0,4220.0,8440.0,2440.0,'2025-09-01 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(106,'ETH','2025-09-02',2.0,4250.0,8500.0,2500.0,'2025-09-02 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(107,'ETH','2025-09-03',2.0,4280.0,8560.0,2560.0,'2025-09-03 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(108,'ETH','2025-09-04',2.0,4300.0,8600.0,2600.0,'2025-09-04 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(109,'ETH','2025-09-05',2.0,4320.0,8640.0,2640.0,'2025-09-05 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(110,'ETH','2025-09-06',2.0,4350.0,8700.0,2700.0,'2025-09-06 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(111,'ETH','2025-09-07',2.0,4380.0,8760.0,2760.0,'2025-09-07 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(112,'ETH','2025-09-08',2.0,4400.0,8800.0,2800.0,'2025-09-08 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(113,'ETH','2025-09-09',2.0,4420.0,8840.0,2840.0,'2025-09-09 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(114,'ETH','2025-09-10',2.0,4450.0,8900.0,2900.0,'2025-09-10 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(115,'ETH','2025-09-11',2.0,4480.0,8960.0,2960.0,'2025-09-11 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(116,'ETH','2025-09-12',2.0,4500.0,9000.0,3000.0,'2025-09-12 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(117,'ETH','2025-09-13',2.0,4520.0,9040.0,3040.0,'2025-09-13 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(118,'ETH','2025-09-14',2.0,4550.0,9100.0,3100.0,'2025-09-14 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(119,'ETH','2025-09-15',2.0,4580.0,9160.0,3160.0,'2025-09-15 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(120,'ETH','2025-09-16',2.0,4600.0,9200.0,3200.0,'2025-09-16 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(121,'ETH','2025-09-17',2.0,4620.0,9240.0,3240.0,'2025-09-17 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(122,'ETH','2025-09-18',2.0,4650.0,9300.0,3300.0,'2025-09-18 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(123,'ETH','2025-09-19',2.0,4680.0,9360.0,3360.0,'2025-09-19 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(124,'ETH','2025-09-20',2.0,4700.0,9400.0,3400.0,'2025-09-20 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(125,'SUI','2025-07-21',1000.0,1.45,1450.0,-50.0,'2025-07-21 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(126,'SUI','2025-07-22',1000.0,1.47,1470.0,-30.0,'2025-07-22 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(127,'SUI','2025-07-23',1000.0,1.44,1440.0,-60.0,'2025-07-23 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(128,'SUI','2025-07-24',1000.0,1.48,1480.0,-20.0,'2025-07-24 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(129,'SUI','2025-07-25',1000.0,1.52,1520.0,20.0,'2025-07-25 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(130,'SUI','2025-07-26',1000.0,1.49,1490.0,-10.0,'2025-07-26 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(131,'SUI','2025-07-27',1000.0,1.53,1530.0,30.0,'2025-07-27 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(132,'SUI','2025-07-28',1000.0,1.56,1560.0,60.0,'2025-07-28 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(133,'SUI','2025-07-29',1000.0,1.58,1580.0,80.0,'2025-07-29 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(134,'SUI','2025-07-30',1000.0,1.61,1610.0,110.0,'2025-07-30 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(135,'SUI','2025-07-31',1000.0,1.64,1640.0,140.0,'2025-07-31 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(136,'SUI','2025-08-01',1000.0,1.67,1670.0,170.0,'2025-08-01 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(137,'SUI','2025-08-02',1000.0,1.7,1700.0,200.0,'2025-08-02 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(138,'SUI','2025-08-03',1000.0,1.72,1720.0,220.0,'2025-08-03 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(139,'SUI','2025-08-04',1000.0,1.75,1750.0,250.0,'2025-08-04 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(140,'SUI','2025-08-05',1000.0,1.78,1780.0,280.0,'2025-08-05 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(141,'SUI','2025-08-06',1000.0,1.81,1810.0,310.0,'2025-08-06 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(142,'SUI','2025-08-07',1000.0,1.84,1840.0,340.0,'2025-08-07 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(143,'SUI','2025-08-08',1000.0,1.87,1870.0,370.0,'2025-08-08 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(144,'SUI','2025-08-09',1000.0,1.9,1900.0,400.0,'2025-08-09 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(145,'SUI','2025-08-10',1000.0,1.93,1930.0,430.0,'2025-08-10 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(146,'SUI','2025-08-11',1000.0,1.96,1960.0,460.0,'2025-08-11 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(147,'SUI','2025-08-12',1000.0,1.99,1990.0,490.0,'2025-08-12 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(148,'SUI','2025-08-13',1000.0,2.02,2020.0,520.0,'2025-08-13 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(149,'SUI','2025-08-14',1000.0,2.05,2050.0,550.0,'2025-08-14 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(150,'SUI','2025-08-15',1000.0,2.08,2080.0,580.0,'2025-08-15 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(151,'SUI','2025-08-16',1000.0,2.11,2110.0,610.0,'2025-08-16 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(152,'SUI','2025-08-17',1000.0,2.14,2140.0,640.0,'2025-08-17 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(153,'SUI','2025-08-18',1000.0,2.17,2170.0,670.0,'2025-08-18 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(154,'SUI','2025-08-19',1000.0,2.2,2200.0,700.0,'2025-08-19 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(155,'SUI','2025-08-20',1000.0,2.23,2230.0,730.0,'2025-08-20 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(156,'SUI','2025-08-21',1000.0,2.26,2260.0,760.0,'2025-08-21 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(157,'SUI','2025-08-22',1000.0,2.29,2290.0,790.0,'2025-08-22 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(158,'SUI','2025-08-23',1000.0,2.32,2320.0,820.0,'2025-08-23 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(159,'SUI','2025-08-24',1000.0,2.35,2350.0,850.0,'2025-08-24 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(160,'SUI','2025-08-25',1000.0,2.38,2380.0,880.0,'2025-08-25 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(161,'SUI','2025-08-26',1000.0,2.41,2410.0,910.0,'2025-08-26 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(162,'SUI','2025-08-27',1000.0,2.44,2440.0,940.0,'2025-08-27 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(163,'SUI','2025-08-28',1000.0,2.47,2470.0,970.0,'2025-08-28 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(164,'SUI','2025-08-29',1000.0,2.5,2500.0,1000.0,'2025-08-29 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(165,'SUI','2025-08-30',1000.0,2.48,2480.0,980.0,'2025-08-30 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(166,'SUI','2025-08-31',1000.0,2.51,2510.0,1010.0,'2025-08-31 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(167,'SUI','2025-09-01',1000.0,2.54,2540.0,1040.0,'2025-09-01 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(168,'SUI','2025-09-02',1000.0,2.47,2470.0,970.0,'2025-09-02 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(169,'SUI','2025-09-03',1000.0,2.43,2430.0,930.0,'2025-09-03 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(170,'SUI','2025-09-04',1000.0,2.39,2390.0,890.0,'2025-09-04 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(171,'SUI','2025-09-05',1000.0,2.35,2350.0,850.0,'2025-09-05 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(172,'SUI','2025-09-06',1000.0,2.31,2310.0,810.0,'2025-09-06 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(173,'SUI','2025-09-07',1000.0,2.28,2280.0,780.0,'2025-09-07 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(174,'SUI','2025-09-08',1000.0,2.24,2240.0,740.0,'2025-09-08 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(175,'SUI','2025-09-09',1000.0,2.32,2320.0,820.0,'2025-09-09 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(176,'SUI','2025-09-10',1000.0,2.36,2360.0,860.0,'2025-09-10 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(177,'SUI','2025-09-11',1000.0,2.4,2400.0,900.0,'2025-09-11 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(178,'SUI','2025-09-12',1000.0,2.44,2440.0,940.0,'2025-09-12 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(179,'SUI','2025-09-13',1000.0,2.48,2480.0,980.0,'2025-09-13 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(180,'SUI','2025-09-14',1000.0,2.52,2520.0,1020.0,'2025-09-14 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(181,'SUI','2025-09-15',1000.0,2.45,2450.0,950.0,'2025-09-15 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(182,'SUI','2025-09-16',1000.0,2.41,2410.0,910.0,'2025-09-16 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(183,'SUI','2025-09-17',1000.0,2.37,2370.0,870.0,'2025-09-17 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(184,'SUI','2025-09-18',1000.0,2.42,2420.0,920.0,'2025-09-18 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(185,'SUI','2025-09-19',1000.0,2.46,2460.0,960.0,'2025-09-19 21:00:00');"
      },
      {
        "'INSERT INTO daily_snapshots VALUES(' || id || ',''' || asset_symbol || ''',''' || snapshot_date || ''',' || quantity || ',' || price_per_unit || ',' || total_value || ',' || unrealized_pnl || ',''' || created_at || ''');'": "INSERT INTO daily_snapshots VALUES(186,'SUI','2025-09-20',1000.0,2.5,2500.0,1000.0,'2025-09-20 21:00:00');"
      }
    ],
    "success": true,
    "meta": {
      "duration": 11
    }
  }
]
