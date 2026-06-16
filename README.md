# NatureHub — Frontend

Trabajo de laboratorio RIA 2026 — Universidad Tecnológica del Uruguay (CURE)

## Descripción

NatureHub es una wiki colaborativa sobre naturaleza. Los usuarios pueden registrarse, crear artículos sobre especies animales y enviarlos para revisión. Los moderadores aprueban o rechazan los artículos antes de que queden publicados.

## Integrantes

| Nombre | Cédula |
|--------|--------|
| Luca Crespi | 5.473.748-1 |
| Agustín Machado | 5.705.873-1 |
| Martin Marrero | 5.550.895-0 |
| Gastón Pérez | 5.014.089-4 |

## Tecnologías usadas

- **Angular 21** — framework principal (standalone components)
- **Bootstrap 5** — estilos y layout responsivo
- **SCSS** — personalización del tema de Bootstrap
- **TypeScript** — lenguaje base
- **SweetAlert2** — alertas y confirmaciones
- **HTML5 Canvas** — gráfico de artículos por sección
- **LocalStorage** — persistencia de sesión

---

## Requisitos previos

- Node.js v18 o superior
- El backend corriendo (ver README del backend)

---

## Cómo correr el proyecto

Primero instalá las dependencias:

```bash
npm install
```

Después levantás el servidor de desarrollo:

```bash
npm start
```

Abrís el navegador en `http://localhost:4200`

> **Importante:** el frontend se conecta a la API en `http://localhost/backend-NatureHub/src/index.php`. Asegurate de tener Apache y MySQL de XAMPP corriendo antes de usar la aplicación.

## Cómo compilar para producción

```bash
npm run build
```

Los archivos quedan en la carpeta `dist/`.

---

## Estructura del proyecto

```
src/
  app/
    core/
      guards/         # guardias de rutas (autenticación, roles)
      services/       # AutenticacionService, WikiService
    features/
      autenticacion/  # login y registro
      home/           # página principal
      perfil/         # perfil de usuario y edición
      wiki/           # creación y detalle de artículos
      administrador/  # gestión de roles (admin)
    shared/
      components/     # navbar, footer, sidebar
      models/         # interfaces TypeScript
```

## Backend

El frontend se conecta a la API REST en PHP ubicada en `http://localhost/backend-NatureHub/src/index.php`. Consultá el README del backend para el procedimiento completo de instalación con XAMPP.
