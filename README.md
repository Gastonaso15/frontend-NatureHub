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

## Cómo correr el proyecto

Necesitás tener instalado Node.js (v18 o superior).

Primero instalá las dependencias:

```bash
npm install
```

Después levantás el servidor de desarrollo:

```bash
npm start
```

Abrís el navegador en `http://localhost:4200`

## Cómo compilar para producción

```bash
npm run build
```

Los archivos quedan en la carpeta `dist/`.

## Estructura del proyecto

```
src/
  app/
    core/
      guards/       # auth guard (rutas protegidas)
      services/     # AuthService, WikiService
    features/
      auth/         # login y registro
      home/         # página principal
      wiki/         # detalle y creación de artículos
    shared/
      components/   # navbar, footer
      models/       # interfaces TypeScript
```

## Usuarios de prueba

Mientras no esté conectado el backend, hay usuarios mock para probar:

| Email | Rol | Contraseña |
|-------|-----|------------|
| admin@naturehub.com | administrador | cualquiera (6+ chars) |
| moderador@naturehub.com | moderador | cualquiera (6+ chars) |
| usuario@naturehub.com | usuario | cualquiera (6+ chars) |

## Backend

El frontend está pensado para conectarse a una API REST en PHP. Los servicios `AuthService` y `WikiService` actualmente usan datos mock, pero están estructurados para reemplazarlos por llamadas HTTP cuando el backend esté listo.
