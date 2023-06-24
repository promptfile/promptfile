# release checklist

- `npm run build` in the root of the project. Don't publish without the build succeeding!
- `cd packages/glasslib`, update the @glass-lang/glasslib package.json version, then `npm publish`
- `cd apps/vscode-glass`, run `./update-yarnlock.sh`
- `npx changeset` in the root of the repo

(push changes to GitHub, and accept the changesets bot pull request, then pull the code)

- `git tag vx.x.x` (where `x.x.x.` matches the version update made by the changeset bot)
- `git push origin vx.x.x`
