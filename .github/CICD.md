# CI/CD

## Обзор

| Workflow | Триггер | Назначение |
|----------|---------|------------|
| `ci.yml` | push/PR в `main` | Lint, typecheck, тесты, сборка либы, example (Android + iOS) |
| `test-rn-versions.yml` | push/PR в `main` | Сборка example на RN 0.80, 0.82, 0.83 |
| `publish.yml` | push тега `v*` | Публикация в npm |

## Секреты (Settings → Secrets and variables → Actions)

Для **publish.yml** нужен:
- **NPM_TOKEN** — токен npm (read-only для проверки или publish для публикации)
  1. npmjs.com → Account → Access Tokens
  2. Generate New Token (Automation)
  3. Добавить в репо как NPM_TOKEN

## Релиз

```sh
yarn release
```

1. release-it обновляет версию, создаёт changelog, коммит, тег (v1.2.3)
2. Push тега запускает publish.yml → публикация в npm
3. release-it создаёт GitHub Release

## Branch protection (рекомендуется)

Settings → Branches → Add rule для `main`:
- Require status checks: `lint`, `test`, `build-library`, `build-android`, `build-ios`
- Require branches to be up to date before merging
