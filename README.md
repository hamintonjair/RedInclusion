# Red de Inclusión - Quibdó

Sistema integral de gestión de información diseñado para la Secretaría de Inclusión y Cohesión Social de la Alcaldía de Quibdó. Esta aplicación permite administrar beneficiarios, actividades y visualizar datos territoriales en tiempo real, operando bajo un esquema multiplataforma.

---

## 📑 Tabla de Contenidos

- [Introducción](#introducción)
- [Características Principales](#características-principales)
- [Arquitectura y Stack Tecnológico](#arquitectura-y-stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración](#configuración)
- [Instalación y Desarrollo](#instalación-y-desarrollo)
- [Distribución Multiplataforma](#distribución-multiplataforma)
- [Solución de Problemas](#solución-de-problemas)
- [Licencia](#licencia)

---

## 🖥️ Introducción

La plataforma **Red de Inclusión** es la solución centralizada para la toma de decisiones basada en datos dentro de la Secretaría de Inclusión y Cohesión Social. Permite a los funcionarios gestionar el ciclo de vida de los beneficiarios y el impacto de los programas sociales directamente en el territorio.

## 🚀 Características Principales

- **Gestión de Beneficiarios:** Registro, seguimiento detallado y segmentación.
- **Visualización Cartográfica:** Mapa interactivo integrado que muestra barrios y comunas con filtros automáticos basados en la densidad de impacto.
- **Acceso Basado en Roles:** Sistema de autenticación seguro para funcionarios y administradores.
- **Arquitectura Responsiva:** Pantallas adaptadas para escritorio, tablets y dispositivos móviles.
- **Sincronización Offline (Capacitor/PWA):** Base de datos local embebida que permite el trabajo continuo sin conexión, con sincronización automática al recuperar red.
- **Instalación PWA:** Optimizada para ser instalada como aplicación de escritorio o móvil directamente desde el navegador.

## 🛠️ Arquitectura y Stack Tecnológico

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS.
- **Mapas:** Leaflet.
- **Persistencia/Auth:** Firebase (Firestore / Autenticación).
- **Integración App (PWA & Nativa):** 
    - **Capacitor:** Utilizado como motor para envolver la PWA y proporcionar capacidades nativas (acceso a hardware, notificaciones, persistencia robusta) en Android e iOS.

## 📂 Estructura del Proyecto

```text
├── src/
│   ├── components/  # Componentes reutilizables UI
│   ├── pages/       # Vistas de la aplicación
│   ├── lib/         # Lógica central (offlineSync, firestore, etc.)
│   ├── index.css    # Global styles (Tailwind)
│   └── main.tsx     # Punto de entrada
├── public/          # Assets (logo, etc.)
└── package.json
```

## ⚙️ Configuración

Para ejecutar el sistema, es necesario configurar las variables de entorno. Crea un archivo `.env` basado en `.env.example`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
...
```

## 🚀 Instalación y Desarrollo

1. **Clonar el repositorio.**
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

## 📱 Distribución Multiplataforma

### Web App / PWA
La aplicación está preparada para ser desplegada en plataformas como **Render** o Vercel. Una vez publicada, puede instalarse en cualquier dispositivo mediante la opción "Añadir a pantalla de inicio" en navegadores compatibles.

### Despliegue Nativo (Android/iOS)
Para empaquetar la aplicación como un ejecutable nativo:

```bash
# Generar los proyectos nativos
npx cap add android
npx cap add ios

# Sincronizar cambios (ejecutar tras cada build de web)
npx cap sync
```

## 🔧 Solución de Problemas

- **Problemas de Sincronización Offline:** Verifica que Firestore tenga habilitada la persistencia en el SDK.
- **Errores de Build:** Asegúrate de ejecutar `npm run build` antes de realizar `cap sync`.
- **Acceso a Mapas:** Asegúrate de que las credenciales de los proveedores de mapas (si aplica) sean válidas.

## 📄 Licencia

Propiedad de la Alcaldía de Quibdó - Sistema de Inclusión Social.
