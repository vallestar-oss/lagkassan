-- Add optional group/team label to collections.
-- Allows organizers to tag a collection with a sub-group name such as
-- "Pojkar 2012", "Flickor 2014", or "Seniorlaget" without requiring a
-- full organization hierarchy. Nullable so existing collections are unaffected.

alter table collections
  add column if not exists group_label text null;
