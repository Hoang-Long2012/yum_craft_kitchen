# Frontend module migration

The frontend remains a vanilla JavaScript application. The catalog definitions
now live in `js/data/`, pure item construction/texture/ice helpers live in
`js/cooking/food-items.js`, culinary descriptions and scoring live in
`js/cooking/culinary-chemistry.js`, and mutable gameplay state lives in
`js/core/state.js`. `js/app.js` is now the external application entry point. It still coordinates
item transformations, audio effects, canvas and DOM rendering, event handlers,
keyboard shortcuts, focus behavior, and NVDA live-region announcements. Authentication, admin, and community persistence already live
in separate modules under `js/`.

## Target boundaries

- `js/data/`: ingredient, spice, station, customer, and garnish definitions.
- `js/core/`: game state and screen/navigation transitions.
- `js/cooking/`: item transformations, culinary chemistry, serving and review
  calculations. Pure functions should accept data and return values without
  querying the DOM.
- `js/ui/`: rendering, DOM event binding, screen-specific controllers, and
  canvas presentation.
- `js/audio/`: sound effects and audio settings integration.
- `js/accessibility/`: live announcements and explicit focus-management helpers.
- `js/*-service.js`: existing backend/persistence boundaries, retained.

`index.html` remains the markup owner, contains no inline application script,
and loads the external ES-module entry point. The main-menu controller is still
loaded separately for now. Module APIs are imported explicitly wherever the
migration has reached; legacy global compatibility is not yet fully removed.

## Migration status and sequence

1. Extract pure item mechanics and add Node built-in tests (`food-items.js`).
2. Move the complete character, fridge-category, ingredient, station, spice,
   garnish, and flavor-dimension catalogs into `js/data/`; import them from the
   application module and cover their counts and identifiers with Node tests.
3. Move mutable gameplay state into `js/core/state.js` and import the shared
   state object from the application module.
4. Extract audio, accessibility/focus, rendering, and keyboard event binding;
   preserve DOM IDs and existing focus/announcement timing throughout.
5. Replace remaining global compatibility hooks with explicit module imports,
   then split the transitional `js/app.js` coordinator into focused UI and core
   modules as each boundary gains regression coverage.

The catalog migration preserves the original array literals. The application
entry point has been moved out of `index.html`; subsequent work will continue
splitting its remaining orchestration into focused cooking, UI, audio, and
accessibility modules.

## Accessibility invariants

Keep the existing tablist Arrow/Home/End behavior, focus restoration when dialogs
close, keyboard shortcuts, live-region IDs/roles, announcement priorities, and
announcement timing. Avoid replacing rendered controls in a way that drops
focus. Validate screen-reader behavior with NVDA and mobile VoiceOver/TalkBack
when browser testing is available.

## Tests

Run the pure business-logic test with Node.js:

```sh
node --test tests/food-items.test.mjs tests/catalog-data.test.mjs tests/culinary-chemistry.test.mjs
```
