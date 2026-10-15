# Shared fixtures

Inputs, expected positive matches, and negative matches shared by Python and
TypeScript tests. Fixtures describe behavior rather than require both
implementations to produce identical regex strings.

`real-world/positives.csv` and `real-world/negatives.csv` contain the shared,
deduplicated dataset with anonymized domains, each with one `URL` column.
Generate patterns only from positives and check the disjoint negatives.
For path extraction, derive paths from both files and exclude any negative
paths also present among positive paths, since different URLs may collapse
to the same path. Preserve trailing slashes and percent encoding; drop queries
and fragments and use `/` for URLs without a path.
