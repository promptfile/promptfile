## Build

To build all apps and packages, run the following command:

```bash
npm ci
npm run build
```

## Develop

You'll usually want to develop the extension.

Modify any files in the repo then launch `Run Extension` from Run/Debug (shortcut: `F5`). It'll automatically build everything necessary to run the extension, don't worry about running watchers in any of the other packages. No need to `npm link` either, all of your changes should show up each time you re-run the extension.

See individual package READMEs for further instructions.

## Test

```bash
npm run test
```

Alternatively, you can run `npm run test:watch` in several of the packages (`glasslib`, `glassc`) to run a fast test loop over most of the language features and code-gen logic.
