## Automa - Alpha version
##### Automatic npm package version increate and changelog handling

### Just install with
```
yarn add automa
```
OR
```
npm install --save automa
```

Every time you commit something or merge something to the master branch, the version number in the package.json file
will increase (0.0.1 -> 0.0.2, only patch number is supported with this version).

CHANGELOG.md file will be updated too, based on commits messages.

### NOTES
- Only project with set remote repository are supported
- Master branch upstream has to be configured before Automa can run smoothly
- If you are already using Husky together with `post-commit` and `post-merge` hooks, be careful because they are going 
to be replaced by Automa

