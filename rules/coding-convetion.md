# Coding Convention for NestJS Backend Project
## Introduction
This document outlines the coding conventions for the NestJS backend project. These guidelines ensure consistency, readability, and maintainability across the codebase. All developers must adhere to these rules.

## General Principles
- Language: Use TypeScript exclusively.
- Code Style: Follow Airbnb TypeScript style guide with modifications for NestJS.
- Formatting: Use Prettier for automatic formatting. Configure with ```.prettierrc```:

```
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100
}
```
- Linting: Use ESLint with ```@typescript-eslint``` plugin. Configure in ```.eslintrc.js``` to enforce rules like no unused vars, consistent imports.

## Naming Conventions
- Variables/Functions: CamelCase (e.g., getBlogPost).
- Classes/Interfaces: PascalCase (e.g., BlogService).
- Constants: UPPER_SNAKE_CASE (e.g., DEFAULT_STATUS = 'draft').
- Files: Kebab-case for files (e.g., blog.service.ts), except for modules like blog.module.ts.
- DTOs/Entities: End with .dto.ts or .entity.ts (e.g., create-blog.dto.ts).

## Code Organization
- Imports: Group imports: First built-in Node modules, then external libs, then internal modules. Use absolute imports if configured (e.g., via tsconfig.json paths).
- Comments: Use JSDoc for functions/classes. Avoid inline comments unless explaining complex logic.
- Error Handling: Use NestJS built-in exceptions (e.g., NotFoundException). Centralize in global filters.

## Best Practices
- Functions: Keep functions small (<20 lines). Use async/await over promises.
- Types: Always use explicit types/interfaces. Avoid any.
- Logging: Use Winston for logging, integrated with CloudWatch.
- Testing: Write unit tests for services/controllers using Jest. Aim for >80% coverage.

## Enforcement
- Run npm run lint before commits.
- Use Git hooks (Husky) for pre-commit linting/formatting.