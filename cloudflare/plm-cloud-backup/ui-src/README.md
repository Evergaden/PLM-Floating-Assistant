# PLM UI source

This directory is the only editable source for the hosted PLM stylesheet.
Files under `static/assets/v15/ui-*.css` are immutable build artifacts and must
never be edited directly.

## Structure

- `legacy.css` is the frozen migration baseline. It may shrink, but new rules
  must not be added to it.
- `compat/` contains named, documented bridges that temporarily need legacy
  specificity or `!important`. Typography is now owned by the canonical
  modules; new component rules must not be added to a compatibility bridge.
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
7. Ask the user to update the installed userscript and complete the logged-in
   browser verification; keep that verification pending until they do.

The build rejects `!important` and `final cascade` in canonical modules. It
also prevents the existing totals for `!important`, duplicate selectors, and
conflicting selectors from increasing. Exact debt baselines are enforced, so
every reduction must tighten the matching source and aggregate budgets in the
same change. Source byte baselines normalize CRLF to LF before comparison.
Budgets should only move downward as legacy modules are migrated.

Typography has two permitted tiers: ordinary content, controls, labels, and
numbers use 400; only structural titles may use 700. Numeric weights outside
those tiers and heavy `font` shorthand are rejected during the build.

A duplicate selector is counted only when it repeats the same property. This
allows layout and typography to live in separate migration sources without
hiding genuine cascade conflicts.

The build also requires `supersededImportantDeclarations` to remain zero. A
legacy `!important` declaration is superseded when the same selector and
at-rule context assign the same property again later; only the final effective
declaration may remain.
