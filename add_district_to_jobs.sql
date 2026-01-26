-- Додати колонку district до таблиці jobs
-- Це дозволить коректно відображати статистику по районах на головній сторінці

-- Перевіряємо, чи колонка вже існує
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'district'
    ) THEN
        ALTER TABLE jobs ADD COLUMN district VARCHAR(100);
        CREATE INDEX IF NOT EXISTS idx_jobs_district ON jobs(district);
        RAISE NOTICE 'Колонка district додана до таблиці jobs';
    ELSE
        RAISE NOTICE 'Колонка district вже існує в таблиці jobs';
    END IF;
END $$;
