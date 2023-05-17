# glass

![main](https://github.com/foundation-ui/glass/actions/workflows/main.yml/badge.svg)

## Apps and Packages

- `vscode-glass`: VS Code extension for Glass
- `language-server`: LSP server providing Glass intellisense
- `rig`: a React app for the VS Code Glass playground webview
- `docs`: a Next.js app for [the Glass documentation](https://docs.glass/)
- `glassc`: the Glass compiler
- `glasslib`: Glass client library
- `ui`: a React component library shared by web applications
- `eslint-config-custom`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

Every package/app is using [TypeScript](https://www.typescriptlang.org/).

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

## License

MIT © [Foundation](https://foundation-ui.com)
