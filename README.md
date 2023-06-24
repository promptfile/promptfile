# PromptFile (`.prompt`)

![main](https://github.com/glass-platform/promptfile/actions/workflows/main.yml/badge.svg)

_**ALERT: PROMPTFILE IS IN ALPHA AND IS SUBJECT TO CHANGE.**_

PromptFile is a Markdown-like templating syntax and playground designed to write and iterate on prompts easier and faster. PromptFile is entirely open-source and free-to-use.

Build and prototype your prompts where you and your projects live: VSCode.

The simple, human-readable syntax of a `.prompt` file makes it easy to understand and debug. To test your prompt, execute a single command and view the results of your request in the VSCode Playground.

Once your prompt is ready, call a function to load in your prompt in the language of your choice, a seamless and unobtrusive integration of PromptFile into your project.

1. Read our documentation at [promptfile.org](https://promptfile.org)
2. Check out some examples in our [examples repository](https://github.com/glass-platform/promptfile/tree/main/apps/demo/examples).
3. [Download the VSCode extension](http://vscode.glass) to quickly run and iterate on a PromptFile.
4. If you are using PromptFile, have questions, or want to stay up to date, feel free to join our [Discord](https://discord.com/invite/H64PFP2DCc).
5. If you are interested in contributing, would love to have you contribute. Feel free to read more about how to [contribute](/CONTRIBUTING.md).


## Apps and Packages

This project uses npm workspaces and [Turborepo](https://turbo.build/).

### `apps/`

- `vscode-glass`: VS Code extension for Promptfile
- `promptfile.org`: a Next.js/Nextra app serving [promptfile.org](https://promptfile.org/)
- `demo`: examples of using Promptfile

### `packages/`

- `glasslib`: `.prompt` client library, including CLI
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

## License

MIT © [Glass Platform](https://platform.glass)
