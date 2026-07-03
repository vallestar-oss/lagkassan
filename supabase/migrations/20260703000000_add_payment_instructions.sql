-- =============================================================================
-- Add payment_instructions to collections
--
-- Organizers can write free-text instructions such as
-- "Swisha 850 kr till 070-xxx xx xx och skriv spelarens namn."
-- that are displayed on the public payment page.
--
-- Nullable with no default: existing collections are unaffected.
-- No RLS change needed — the column sits on `collections`, which already
-- has a public active-slug read policy covering this field.
-- =============================================================================

alter table collections
  add column if not exists payment_instructions text;
