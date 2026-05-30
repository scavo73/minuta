# Minuta

> Notas, tareas e ideas organizadas en un solo espacio.

![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![API REST](https://img.shields.io/badge/API-REST-10B981?style=for-the-badge)
![JWT Auth](https://img.shields.io/badge/Auth-JWT-F59E0B?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![SecureStore](https://img.shields.io/badge/SecureStore-Expo-4630EB?style=for-the-badge)
![Vercel Backend](https://img.shields.io/badge/Backend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

Minuta es una app móvil de productividad personal construida con Expo y React Native. Centraliza notas, tareas, ideas y carpetas en una experiencia rápida, organizada y conectada a un backend propio con autenticación segura.

## Preview

> Capturas pendientes. Añadir las imágenes en `docs/screenshots/` respetando estos nombres.

| Home | Nueva nota | Tareas |
| --- | --- | --- |
| ![Home](./docs/screenshots/home.png) | ![Nueva nota](./docs/screenshots/new-note.png) | ![Tareas](./docs/screenshots/tasks.png) |

| Ideas | Archivados | Cuenta / Login |
| --- | --- | --- |
| ![Ideas](./docs/screenshots/ideas.png) | ![Archivados](./docs/screenshots/archived.png) | ![Cuenta / Login](./docs/screenshots/account-login.png) |

## Que Hace La App

Minuta permite crear y gestionar contenido personal con sincronizacion real contra una API desplegada en Vercel. La app permite:

- Crear notas.
- Crear tareas y checklists.
- Crear ideas con color y tags.
- Organizar contenido por carpetas.
- Archivar y desarchivar elementos.
- Buscar y filtrar contenido.
- Crear cuenta e iniciar sesion.
- Sincronizar datos reales con una API propia desplegada en Vercel.
- Guardar el token de sesion con `expo-secure-store`.

## Features

- Notas, ideas y tareas en una misma app.
- Carpetas para organizar contenido.
- Archivado de notas, tareas, ideas y carpetas.
- Pull to refresh para actualizar datos.
- Login y registro de usuarios.
- Logout seguro.
- Token JWT guardado con `expo-secure-store`.
- Consumo de backend REST propio.
- Soporte preparado para tema claro y oscuro mediante `useColorScheme`.

## Stack Tecnico

| Area | Tecnologia |
| --- | --- |
| App movil | Expo, React Native, TypeScript |
| Navegacion | Expo Router |
| Estado global | Zustand |
| Seguridad local | `expo-secure-store` |
| API | REST propia |
| Backend | Next.js desplegado en Vercel |
| Base de datos | PostgreSQL / Neon en backend |

## Arquitectura

```text
app/         Rutas y pantallas con Expo Router
components/  Componentes de UI reutilizables
store/       Estado global y stores de dominio
lib/         Cliente API, storage seguro y helpers
constants/   Theme, colores, espaciados y utilidades visuales
types/       Modelos y tipos compartidos
```

## Variables De Entorno

La app usa una variable publica de Expo para apuntar al backend:

```env
EXPO_PUBLIC_API_URL=https://minuta-api.vercel.app/api
```

Crea un archivo `.env` a partir de `.env.example` antes de iniciar la app.

## Instalacion

```bash
npm install
cp .env.example .env
npx expo install
npx expo start -c
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
npx expo start -c
```

## Uso

1. Abre la app con Expo Go o un emulador.
2. Crea una cuenta o inicia sesion.
3. Crea notas, tareas o ideas.
4. Organiza el contenido en carpetas.
5. Archiva elementos cuando ya no los necesites en la vista principal.
6. Cierra sesion desde la cuenta para borrar el token local y limpiar los datos visibles.

## Backend

La app consume el backend REST en:

```text
https://minuta-api.vercel.app/api
```

Repositorio backend: <https://github.com/tu-usuario/minuta-api>

## Seguridad

- El token JWT no se guarda en `AsyncStorage`.
- El token de sesion se guarda con `expo-secure-store`.
- Las peticiones protegidas usan el header `Authorization: Bearer <token>`.
- Al cerrar sesion se borra el token local y se limpian los datos visibles de la sesion.

## Scripts Utiles

| Comando | Descripcion |
| --- | --- |
| `npm run start` | Inicia Expo con la configuracion del proyecto. |
| `npm run android` | Abre la app en Android. |
| `npm run ios` | Abre la app en iOS. |
| `npm run web` | Abre la app en web. |
| `npx expo start -c` | Inicia Expo limpiando cache. |
| `npx expo-doctor` | Revisa problemas comunes de configuracion Expo. |

> No hay script `lint` configurado actualmente en `package.json`.

## Roadmap

- Firebase Auth y perfiles de usuario.
- Firestore para perfil extendido.
- Subida de imagenes con Expo ImagePicker.
- AWS S3 para assets.
- Mejoras de busqueda y filtros.
- Notificaciones.

## Estado Del Proyecto

Minuta es un proyecto academico y en desarrollo. La base funcional ya integra autenticacion, sincronizacion con backend, almacenamiento seguro de token y gestion de contenido personal; las siguientes iteraciones estan enfocadas en pulir experiencia, busqueda, media y perfiles.

