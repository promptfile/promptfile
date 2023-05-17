# Glass for VSCode

[![GitHub Actions](https://github.com/foundation-ui/glass/workflows/main/badge.svg)](https://github.com/foundation-ui/glass/actions/workflows/main.yml)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/foundation.vscode-glass)](https://marketplace.visualstudio.com/items?itemName=foundation.vscode-glass)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/foundation.vscode-glass)](https://marketplace.visualstudio.com/items?itemName=foundation.vscode-glass)

This repository contains the code to provide language support for [Glass](https://www.glass-lang.com).

## Warning: Glass is in alpha

Minor version releases before 1.0.0 may contain breaking changes.

We’ll keep track of updates and migration instructions here.

## 0.7.1 -> 0.8.0

### New npm package

- `npm install --save @glass-lang/glasslib` into your project, not `@glass-lang/glassc`

### New syntax

- Interpolation variables now look like TypeScript template string interplations: `${}`.
  The exception to this is When setting JSX attribute expressions, like in `<User name={variable} />`.
  The upshot is that you no longer have to escape orginary mustaches; `{ whatever }` will be treated
  as a regular string. This makes it easier to write things like JSON or TypeScript interfaces into your prompt.
- Declaring interpolation arguments is is still optional, but you will no longer use Markdown frontmatter to specify them.
  Instead, declare a `<Args myArg="anyTypeYouLike" />` at the top of your file.
  otherwise be inferred
- Glass blocks now support `if` statements, like the following:

```glass
<System>
You are a helpful assistant.
</System>

<User if={someCondition}>
conditional block
</User>
```

- Use `if` statements on text with `<Text>` nodes, like this:

```glass
<System>
You are a helpful assistant.
</System>

<User>
always included
<Text if={someCondition}>
conditionally included
</Text>
</User>
```

- New blocks: `<For>`, `<Code>`, and `<Block>`:

```glass
<Code>
const messages = [
  { role: 'user', content: 'name an ice cream' },
  { role: "assistant", content: 'Vanilla' },
  { role: 'user', content: 'name a fruit' }
]
</Code>

<For each={messages} item="m">

<Block role={m.role}>
${m.content}
</Block>

</For>
```

- If you do not want to use the Chat API / blocks, you must wrap your prompt with `<Prompt>`.
  In the previous version, we allowed you to have files which declared no blocks at all, and the whole file was interpreted
  to be the prompt. We plan to support this again soon.

### Extension updates

- improved syntax highlighting
- more completions & diagnostics for Glass files
- code folding for blocks
- webview Playground

## 0.4.0 -> 0.7.1

### New npm package

- `npm install --save @glass-lang/glassc` into your project;
  the transpiler output depends on it

### New output format

- The `Glass: transpile all` command will now output to a single file,
  called `glass.ts`/`glass.js`
- Configure where code gets generated via the `glass.outputDirectory`
  configuration option (default: `${workspaceFolder}/src`)
- The `Glass: transpile current file` command will copy to the clipboard
  instead of creating a file
- The transpiler is now whitespace sensitive; your prompt should have exactly
  the same whitespace you see in the Glass file

### New syntax

- Interpolation variables now use single mustache (`{}`) syntax, think of
  them just like other code expressions. Before they used double mustache
  (`{{}}`) syntax, which was needlessly different from other code expressions.
  We are still playing with this, apologies in advance for whiplash.
- Declaring interpolation arguments in frontmatter is optional; args will
  otherwise be inferred
- Glass documents may now include blocks, which look like this:

```glass
<System>
You are a helpful assistant.
</System>

all text in the interstitial space between blocks/tags is treated as a comment
no // or {/* */} required

<User>
This is an example user input.

{
  // Using a code expression.
  function () {
    return "hello"
  }
}
</User>

<Assistant>
Roger that.
</Assistant>

<User>
{interpolationVariable}
</User>
```

- Instead of a `(args) => string` function, documents with blocks produce a
  `(args) => { role: 'system' | 'user' | 'assistant': content: string }[]`
  function, which you may use for the `messages` field to the ChatGPT API
- Code expressions (e.g. `{"hello".substring(0, 3)}` or
  `{ function() { return "hello" } }`) work as before, except those declared
  in the interstitial space between blocks will be ignored as comments
- Imports work as before; relative paths will be re-written to work correctly
  if you output to a different folder than the one containing your Glass
  files
- You may still have a Glass file which contains no blocks; if so, the
  transpiled function will be `(args) => string` as before

### Extension updates

- improved syntax highlighting, with support for block syntax
- completions & diagnostics for Glass files
- code folding for blocks
- comment entire blocks via select + `Cmd + /`

### Removed features

- OpenAI client generation
- Test spec generation

## License

[MIT][] © [Foundation][glass]

[`@glass-lang/monaco`]: https://github.com/foundation-ui/vscode-glass/tree/main/packages/monaco
[`@glass-lang/language-server`]: https://github.com/foundation-ui/vscode-glass/tree/main/packages/language-server
[`@glass-lang/language-service`]: https://github.com/foundation-ui/vscode-glass/tree/main/packages/language-service
[`vscode-glass`]: https://github.com/foundation-ui/vscode-glass/tree/main/packages/vscode-glass
[glass]: https://foundation-ui.com
[language server protocol]: https://microsoft.github.io/language-server-protocol/
[monaco editor]: https://microsoft.github.io/monaco-editor/
[mit]: http://opensource.org/licenses/MIT
[visual studio code]: https://code.visualstudio.com/
