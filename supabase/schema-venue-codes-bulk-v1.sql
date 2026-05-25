-- Bulk-set brand_code, metro_code, venue_code for all Edge Fitness venues
-- Run in Supabase SQL Editor

UPDATE venues SET brand_code = 'EF', metro_code = 'BCM', venue_code = 'BEA' WHERE id = 'c6a74116-55c6-463e-920d-0151f220952a'; -- Beacon Bay, East London
UPDATE venues SET brand_code = 'EF', metro_code = 'BCM', venue_code = 'GON' WHERE id = 'e67e2e0b-be47-49a2-bc90-af3749ced9c8'; -- Gonubie, East London
UPDATE venues SET brand_code = 'EF', metro_code = 'BCM', venue_code = 'QUI' WHERE id = '54b05c9e-2c05-462e-89fc-dba232e600e8'; -- Quigney, East London
UPDATE venues SET brand_code = 'EF', metro_code = 'NMB', venue_code = 'GRA' WHERE id = '9fe62d28-0368-45ed-a2cf-7e27d5997f5b'; -- Greenacres, Gqeberha
UPDATE venues SET brand_code = 'EF', metro_code = 'NMB', venue_code = 'LTG' WHERE id = '3159a095-96c3-450b-963b-c2096daf5313'; -- Linton Grange, Gqeberha
UPDATE venues SET brand_code = 'EF', metro_code = 'NMB', venue_code = 'WLK' WHERE id = '3790e0c6-956c-4044-b4aa-5361bf0d50c2'; -- Walker Drive, Gqeberha
UPDATE venues SET brand_code = 'EF', metro_code = 'NMB', venue_code = 'WAL' WHERE id = '585044f6-5089-41fd-85b7-4e60b5ad1c59'; -- Walmer, Gqeberha
UPDATE venues SET brand_code = 'EF', metro_code = 'SAR', venue_code = 'JBA' WHERE id = '25665d4f-edef-4283-a145-5707702313fd'; -- Jeffreys Bay
UPDATE venues SET brand_code = 'EF', metro_code = 'PTA', venue_code = 'SUN' WHERE id = 'c10b87cb-344f-49b5-9f2a-6ccc6387f40e'; -- Sunnyside, Pretoria
UPDATE venues SET brand_code = 'EF', metro_code = 'JHB', venue_code = 'RIV' WHERE id = '4542aa6c-bd85-42eb-83e5-4629089dbfa1'; -- Rivonia, Sandton
UPDATE venues SET brand_code = 'EF', metro_code = 'JHB', venue_code = 'SPR' WHERE id = '7d20e4fe-5963-4716-8428-8f9c9aee7b7b'; -- Spruitview, Vosloorus
UPDATE venues SET brand_code = 'EF', metro_code = 'CPT', venue_code = 'KLF' WHERE id = '84e2779b-e986-43df-aea3-8a0408472e07'; -- Kloof, Cape Town
UPDATE venues SET brand_code = 'EF', metro_code = 'CPT', venue_code = 'STR' WHERE id = 'c96775ca-43e0-448d-8d15-4848869d1e16'; -- Strand, Cape Town
UPDATE venues SET brand_code = 'EF', metro_code = 'OVB', venue_code = 'GBW' WHERE id = 'f95fd035-331f-4eb1-8a06-956bf4d4e81c'; -- Grabouw
