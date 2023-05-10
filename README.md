# glass

## What's inside?

This repo includes the following packages/apps:

### Apps and Packages

- `vscode-glass`: a VS Code extension
- `docs`: a [Next.js](https://nextjs.org/) app
- `glassc`: the Glass compiler library
- `ui`: a stub React component library shared by web applications
- `eslint-config-custom`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Build

To build all apps and packages, run the following command:

```
npm run build
```

### Develop

To develop the extension, simply modify any files in the repo, then use `Run Extension` (shortcut: `F5`) to launch the debugger. It'll automatically build everything necessary to run the extension, don't worry about running watchers.

See individual package READMEs for further instructions.
