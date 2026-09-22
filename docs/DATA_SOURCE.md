# Data Source

The PoC is generated from the uploaded workbook:

`persyaratan_register_deduplicated.xlsx`

Workbook summary used by this repository:

- Requirement rows: **1855**
- Unique KBLI codes referenced: **485**
- Sector codes: **A through V**
- Requirement hierarchy: **Level 1, 2, and 3** where present

The derived runtime data is committed at:

`apps/web/data/requirements.json`

## Important boundary

The workbook contains requirement codes, requirement wording, related KBLI codes, sector, and level. It does **not** contain a dedicated field describing whether a requirement must be fulfilled by form input, document upload, payment proof, declaration, or photo.

Those UI control types are inferred heuristically for this PoC and are marked as such in the application.
