# App Structure

This React prototype is split to make a later Spring Boot + Thymeleaf migration easier.

- `App.tsx`: login state and current page selection only.
- `layout/`: shell UI such as sidebar, header, and page switching.
- `pages/`: one file per screen. These are the closest match to future Thymeleaf templates.
- `components/`: reusable UI fragments shared by multiple pages. These can become Thymeleaf fragments later.
- `constants/`: UI-facing option lists such as channels and message purposes.
- `domain.ts`: mock data, derived rows, formatters, and statistics helpers. These should move to controllers, services, DTOs, or view models during the Spring Boot migration.
- `types.ts`: shared frontend data shapes. These can guide Java DTO/request/response classes later.
