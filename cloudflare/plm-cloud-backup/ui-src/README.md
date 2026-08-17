# PLM UI source

This directory is the only editable source for the hosted PLM stylesheet.
Files under `static/assets/v15/ui-*.css` are immutable build artifacts and must
never be edited directly.

## Structure

- `legacy.css` is the frozen migration baseline. It may shrink, but new rules
  must not be added to it.
- `compat/` contains named, documented bridges that temporarily need legacy
  specificity or `!important`.
- `modules/` contains canonical component and page styles. New development
  happens here.
- `release.json` defines source order, the release version, and non-growth
  budgets for known cascade debt.

## Release workflow

1. Move the complete rule set for one component out of `legacy.css`.
2. Implement its authoritative form in `modules/<component>.css`.
3. Run `npm run ui:build`.
4. Run `npm run ui:check` and the userscript syntax checks.
5. Update `UI_ASSET_VERSION` and both userscript versions together.
6. Run `npm run assets:manifest -- <data-version>`.
7. Verify the affected states in the logged-in browser before deployment.

The build rejects `!important` and `final cascade` in canonical modules. It
also prevents the existing totals for `!important`, duplicate selectors, and
conflicting selectors from increasing. Budgets should only move downward as
legacy modules are migrated.
