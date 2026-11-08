# Frontend module migration

The existing frontend remains a vanilla JavaScript application. The original
`index.html` currently contains the kitchen game data, mutable game state,
culinary chemistry, item transformations, audio effects, canvas rendering,
DOM rendering, event handlers, keyboard shortcuts, focus behavior, and NVDA
live-region announcements. Authentication, admin, and community persistence
already live in separate modules under `js/`.

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

`index.html` remains the markup owner; it should eventually load one ES-module
entry point and contain no inline application script. Module APIs are imported
explicitly and are not copied wholesale onto `window`.

## Migration status and sequence

1. Extract pure item mechanics and add Node built-in tests (`food-items.js`).
2. Move the actual catalog literals from the legacy script into `js/data/`, then
   update kitchen UI consumers to import those definitions and remove the
   duplicate inline arrays.
3. Extract the remainder of culinary chemistry and test its scoring, title,
   sensory, and batch behavior against the current implementation.
4. Move game state and game operations behind explicit core/cooking imports.
5. Extract audio, accessibility/focus, rendering, and keyboard event binding;
   preserve DOM IDs and existing focus/announcement timing throughout.
6. Replace the inline script with the module entry point only after all legacy
   responsibilities have explicit imports and regression coverage.

The first extraction is intentionally small and reviewable. The data module is
an interim seam; complete migration must preserve the full existing catalog
without omissions before switching application consumers to it.

## Accessibility invariants

Keep the existing tablist Arrow/Home/End behavior, focus restoration when dialogs
close, keyboard shortcuts, live-region IDs/roles, announcement priorities, and
announcement timing. Avoid replacing rendered controls in a way that drops
focus. Validate screen-reader behavior with NVDA and mobile VoiceOver/TalkBack
when browser testing is available.

## Tests

Run the pure business-logic test with Node.js:

```sh
node --test tests/food-items.test.mjs
```
