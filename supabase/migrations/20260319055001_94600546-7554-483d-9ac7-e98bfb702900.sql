
INSERT INTO public.currencies (code, name, symbol, exchange_rate_to_usd, is_active)
VALUES
  ('CDF', 'Franc congolais', 'FC', 2845.00, true),
  ('RWF', 'Franc rwandais', 'FRw', 1302.50, true),
  ('MAD', 'Dirham marocain', 'د.م.', 9.875, true),
  ('ZAR', 'Rand sud-africain', 'R', 18.25, true),
  ('TZS', 'Shilling tanzanien', 'TSh', 2575.00, true),
  ('EGP', 'Livre égyptienne', 'E£', 50.85, true),
  ('CNY', 'Yuan chinois', '¥', 7.24, true),
  ('BRL', 'Réal brésilien', 'R$', 5.05, true),
  ('SAR', 'Riyal saoudien', '﷼', 3.75, true),
  ('CAD', 'Dollar canadien', 'CA$', 1.36, true),
  ('GBP', 'Livre sterling', '£', 0.79, true),
  ('EUR', 'Euro', '€', 0.92, true),
  ('XOF', 'Franc CFA', 'CFA', 605.50, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  exchange_rate_to_usd = EXCLUDED.exchange_rate_to_usd,
  is_active = EXCLUDED.is_active;
