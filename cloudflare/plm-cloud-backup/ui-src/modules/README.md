# Canonical UI modules

New UI rules belong here, grouped by page or component. A canonical module:

- must not use `!important`;
- must not repeat a selector already owned by another canonical module;
- must consume theme and typography custom properties instead of hard-coded
  visual tokens where a semantic token exists;
- must include responsive states beside the component that owns them;
- must replace, not override, the corresponding rules in `legacy.css`.

`typography.css` owns the shared weight tokens and the inheriting 400 baseline.
Components select a semantic token; they must not introduce another global
font-weight reset.

During migration, delete a complete component rule set from `legacy.css` and
add its single authoritative implementation here in the same change. Rules
that still need to beat legacy specificity belong temporarily in `compat/`.
