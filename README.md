# promptfile (`.prompt`)

![main](https://github.com/glass-platform/promptfile/actions/workflows/main.yml/badge.svg)

_**ALERT: PROMPTFILE IS IN ALPHA AND IS SUBJECT TO CHANGE.**_

Getting started? Head to [promptfile.org](https://promptfile.org) for all of our documentation.

Want some examples? Check out the [examples](https://github.com/glass-platform/promptfile/tree/main/apps/demo/examples).

[Download the VSCode extension](http://vscode.glass) to quickly run and iterate on Promptfile files.

If you are using Promptfile, have questions, or want to stay up to date, feel free to join our [Discord](https://discord.com/invite/H64PFP2DCc).

## Apps and Packages

This project uses npm workspaces and [Turborepo](https://turbo.build/).

### `apps/`

- `vscode-prompt`: VS Code extension for Promptfile
- `promptfile.org`: a Next.js/Nextra app serving [promptfile.org](https://promptfile.org/)
- `demo`: examples of using Promptfile, some of these are in active development and may not currently work

### `packages/`

- `glasslib`: `.prompt` client library (runtime for executing Promptfile compiler generated code)
- `language-server`: LSP server providing Promptfile intellisense
- `rig`: a React app for the VS Code Promptfile playground webview
- `ui`: a React component library shared by web applications
- `util`: random utilities shared by packages/apps
- `eslint-config-custom`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

## Development

```bash
npm ci
npm run build
```

Usually you'll want to launch the VSCode extension in development mode. Use the `Run Extension` launch configuration (`F5` keybinding). This will automatically run the build step if necessary.

### Tests

To run all tests:

```bash
npm run test
```

### Watch mode

Several packages contain tests that can be run in watch mode: `packages/glasslib`, `packages/util`

```bash
cd $package
npm run test:watch
```

For `packages/glasslib` only, the `test:watch` mode requires you also build in watch mode:

```bash
cd packages/glasslib
npm run dev
```

## License

MIT © [Glass Platform](https://platform.glass)
