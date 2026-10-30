# Commit Standards

This project adopts the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard (semantic commits). It keeps the history readable and makes it easier to track changes across the repository. For standardizing your work, always refer to this `COMMITS.md` file.

## Format

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

- Write the description in English, in the imperative mood, in lowercase, and without a period at the end.
- Keep the first line under 72 characters.
- The scope is optional, but highly recommended.

## Types

| Type       | When to use                                                      |
| ---------- | ---------------------------------------------------------------- |
| `feat`     | A new feature                                                    |
| `fix`      | A bug fix                                                        |
| `docs`     | Documentation only changes                                       |
| `style`    | Formatting changes that do not affect logic (spaces, semicolons) |
| `refactor` | A code change that neither fixes a bug nor adds a feature        |
| `perf`     | A code change that improves performance                          |
| `test`     | Adding missing tests or adjusting existing ones                  |
| `build`    | Changes affecting the build system or dependencies               |
| `ci`       | Changes to CI pipelines and workflows (e.g., GitHub Actions)     |
| `chore`    | Maintenance tasks that don't modify production code              |
| `revert`   | Reverts a previous commit                                        |

## Suggested Scopes

| Scope       | Area                                   |
| ----------- | -------------------------------------- |
| `frontend`  | Frontend application                   |
| `backend`   | Backend API                            |
| `artifacts` | Personas, requirements, value propositions |
| `docs`      | Project documentation                  |
| `repo`      | Repository configuration (`.gitignore`, templates) |

For specific screens or modules, use finer scopes, such as `feat(frontend/auth)` or `fix(backend/users)`.

## Examples

```text
feat(frontend): add user listing screen
fix(backend): fix email validation on user registration
docs(artifacts): update functional requirements
refactor(frontend): extract profile card component
build(backend): update framework to version 3.4
chore(repo): add language rules to .gitignore
ci: add linting workflow for the frontend
```

## Breaking Changes

Add a `!` after the type/scope and describe the impact in the footer with `BREAKING CHANGE:`.

```text
feat(backend)!: change API response format for users

BREAKING CHANGE: the `value` field now returns an object with `amount` and `currency`.
```

## Referencing Tasks

Use the footer to link issues or tickets:

```text
fix(frontend): fix crash when opening the map

Closes #12
```

## Best Practices

- A commit should represent a single logical change.
- Avoid commits that mix frontend and backend code; separate them into distinct commits.
- Do not use generic messages like `adjustments`, `update`, or `fix`.
- Use the commit body to explain the **why**, not the **how**.