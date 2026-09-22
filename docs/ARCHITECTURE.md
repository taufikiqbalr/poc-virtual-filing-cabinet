# Virtual Filing Cabinet PoC Architecture

## Concept

Virtual Filing Cabinet models the OSS document repository like a real filing cabinet with named slots.

```text
Biro Jasa Virtual
      |
      v
Fuzzy KBLI Search
      |
      v
Selected KBLI
      |
      v
Requirement Registry
(persyaratan_register_deduplicated)
      |
      v
Virtual Cabinet
  |-- requirement groups
  |-- fillable slots
  |    |-- form
  |    |-- document upload
  |    |-- payment evidence
  |    |-- declaration
  |    '-- photo
  |
  |-- async advisor / notification
  |-- progress dashboard
  '-- credentials compartment
        |-- NIB (simulation)
        '-- permit credential (simulation)
```

## Source-to-slot mapping

The uploaded workbook is the canonical data source for requirement text used in this PoC.

Source columns:

- Kode Sektor
- Kode Persyaratan
- Persyaratan
- KBLI Terkait
- Level

The client filters rows by the selected KBLI. Rows that have descendants such as `A02201 -> A02201.a -> A02201.a.i` are rendered as grouped drawers. Leaf rows are rendered as fillable slots.

## Input type inference

The source workbook does not contain an input-control type. Therefore the PoC derives one from the requirement wording:

- payment / PNBP / retribusi -> Payment Evidence
- photo wording -> Photo
- declaration / commitment wording -> Declaration
- document / letter / proposal / certificate / proof / plan wording -> Document Upload
- otherwise -> Form Input

This is a UI heuristic for the PoC, not a regulatory classification.

## Async simulation

After every required leaf slot is complete, the browser simulates an asynchronous process:

```text
FILLING
  -> VALIDATING
  -> ORCHESTRATING
  -> ISSUING
  -> COMPLETE
```

The completion stage adds demo credentials to the Credentials compartment. These are explicitly labelled as simulations and are not valid OSS documents.

## Persistence

User progress is stored in browser `localStorage` per KBLI for demo continuity.

Uploaded file binary content is not persisted. The PoC stores only file metadata such as file name and size.

## Production evolution

A production implementation should replace browser persistence with authenticated server-side storage, object storage for uploaded files, malware scanning, document metadata/versioning, RBAC, audit logs, workflow/event integration, verifiable credential issuance, and authoritative KBLI/master-data services.
