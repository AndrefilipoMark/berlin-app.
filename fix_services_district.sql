-- Додати колонку district до таблиці services, якщо її немає
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'district'
    ) THEN
        ALTER TABLE services ADD COLUMN district VARCHAR(100);
        CREATE INDEX IF NOT EXISTS idx_services_district ON services(district);
        RAISE NOTICE 'Колонка district додана до таблиці services';
    ELSE
        RAISE NOTICE 'Колонка district вже існує в таблиці services';
    END IF;
END $$;
