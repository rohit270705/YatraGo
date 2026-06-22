-- check table schema
SELECT column_name, column_default, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'vehicles';
