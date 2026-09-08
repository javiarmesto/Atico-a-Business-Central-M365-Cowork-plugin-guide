[English](README.md) · [Castellano](README.es.md)

<p><a href="../README.es.md"><img src="../assets/color.svg" width="64" height="64" alt="ático · Volver al repositorio"></a></p>

**OPEN ENGINEERING NOTEBOOK / CONEXIÓN 01**

# MCP estándar de Business Central para Copilot Cowork

[Inicio](../README.es.md) · [Guía completa](HOW-TO-BC-NATIVE-COWORK.md)

Complemento de Microsoft 365 Copilot Cowork con acceso delegado al MCP estándar de Business Central. El puente TypeScript se despliega en Railway e incorpora la autenticación y las cabeceras del destino.

## Guía de implementación

**[Cómo crear y desplegar el plugin, desde los prerrequisitos hasta la primera consulta](HOW-TO-BC-NATIVE-COWORK.md)**

La guía utiliza Dynamic Tool Mode y cubre:

- Preparación del repositorio y del entorno Business Central.
- Configuración de API y permisos de lectura en BC.
- Dos registros de aplicaciones en Microsoft Entra y autenticación delegada OBO.
- Despliegue del puente y variables de Railway.
- Registro OAuth en Teams Developer Portal.
- Identidad del plugin, generación del paquete e instalación personal en Cowork.
- Conexión, consultas y ampliación a otras API.

## Alcance

El puente admite consultas List sobre páginas API con parámetros de lectura. El modo dinámico expone cuatro herramientas: `bc_connection_check`, `bc_actions_search`, `bc_actions_describe` y `bc_actions_invoke`.

Business Central determina la disponibilidad de las acciones y aplica los permisos del usuario. El puente conserva las restricciones de lectura y no mantiene una lista de entidades por despliegue.

Configura expresamente `BC_TOOL_MODE=dynamic`: el modo predeterminado del código es `static`. En `plugin.config.local.json`, establece también `mode: dynamic`.

## Componentes

| Ruta | Contenido |
|---|---|
| `bridge/` | Servicio TypeScript, autenticación, consultas y validación de argumentos. |
| `appPackage/tools/bc-native-dynamic.json` | Catálogo MCP del complemento dinámico. |
| `scripts/init-plugin.mjs` | Crea la configuración local con un ID M365 propio y estable. |
| `scripts/build-package.mjs` | Generador del paquete M365 desde esa configuración. |
| `plugin.config.example.json` | Ejemplo genérico sin credenciales ni datos del despliegue. |
| `Dockerfile` | Construcción y arranque del servicio. |
| `.env.example` | Referencia de variables; sustituir el destino y seleccionar el modo. |

Cada instalación tiene una identidad de aplicación M365 propia, que se conserva en las actualizaciones.

## Arranque rápido

Después de configurar Entra, BC, Railway y el registro OAuth según la guía:

```powershell
node native/scripts/init-plugin.mjs
# Completa native/plugin.config.local.json con tu identidad, URLs y referencia OAuth.
node native/scripts/build-package.mjs
```

El paquete tiene identidad propia por organización; el generador utiliza únicamente la plantilla nativa. Conserva el mismo appId cuando actualices tu aplicación.

Para comprobar el generador y el puente:

```powershell
node --test native/scripts/test/package.test.mjs
npm ci --prefix native/bridge
npm test --prefix native/bridge
```
