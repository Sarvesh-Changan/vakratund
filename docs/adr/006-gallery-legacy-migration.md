# ADR 006: Gallery legacy item conversion

- Status: Accepted
- Context: Legacy gallery entries stored a category label and a `MediaAsset` ID, but did not store interior/exterior classification or Cloudinary metadata directly. The new gallery model requires a category relation and a design type.
- Decision: Preserve each legacy item's title, ordering, publication state, Cloudinary public ID, URL, format, size, etag and dimensions. Place legacy rows under an `Existing Gallery` category. Since the old data cannot determine design, migrated rows receive `INTERIOR` as an explicitly provisional value; editors can correct it in the new Gallery Images tab. Missing legacy etags remain empty and are eligible for metadata sync. Stop the migration if a row has no media asset or if multiple rows would violate the new unique public ID constraint.
- Consequences: Existing media remains available for editing instead of being discarded. The migration uses PostgreSQL-specific partial-index SQL to enforce one category cover. The seed adds the standard gallery categories without attaching media.
