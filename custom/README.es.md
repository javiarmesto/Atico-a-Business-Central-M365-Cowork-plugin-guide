[English](README.md) · [Castellano](README.es.md) · [Repositorio](../README.es.md)

# Conectar Cowork con tu propio MCP de Business Central

Esta carpeta proporciona un paquete Microsoft 365 configurable. No incluye un servidor MCP personalizado, un despliegue del autor ni credenciales. Úsala si ya tienes un MCP para Business Central o como plantilla mientras lo desarrollas.

## 1. Preparar el servidor y la autenticación

Tu servidor debe exponer un endpoint MCP remoto HTTPS en `/mcp`, autenticar las llamadas y autorizar cada herramienta. Debe validar emisor, audiencia, caducidad y permisos del token según tu proveedor de identidad. Si accedes a BC de forma delegada, conserva la identidad del usuario; si utilizas identidad de aplicación, documenta y limita expresamente sus permisos.

La plantilla utiliza `OAuthPluginVault`. Crea un registro de cliente OAuth en [Teams Developer Portal](https://dev.teams.microsoft.com/) para **tu MCP personalizado**, con el client ID, secreto, scopes y endpoints de autorización y token que requiera tu servidor. Usa la redirect URI de Microsoft: `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect`. Sigue la [guía OAuth de Microsoft](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-authentication-oauth). Conserva el Auth config ID completo. Los secretos van en el almacén de la plataforma, nunca en el paquete.

La [guía nativa](../native/HOW-TO-BC-NATIVE-COWORK.md) muestra una integración delegada con Entra/OBO. Su audiencia y scopes corresponden a ese puente; no los copies en otro MCP sin adaptar su servidor.

## 2. Inicializar el paquete

Desde la raíz del repositorio, con Node.js 22+:

```powershell
node custom/scripts/init-plugin.mjs
```

Completa `custom/plugin.config.local.json`:

| Campo | Valor |
|---|---|
| `appId` | Conserva el ID generado. Usa el ID de una app M365 instalada solo si quieres actualizarla expresamente. |
| `version` | Versión de tu paquete; increméntala al actualizar una instalación. |
| `language` | `en` o `es`; selecciona las descripciones del catálogo y la skill opcional. |
| `example` | `none` de forma predeterminada; `collections` para incluir el ejemplo de sesiones. |
| `endpoint` | URL HTTPS `/mcp` de tu servidor personalizado. |
| `oauthReferenceId` | Auth config ID completo de Teams. |
| `name`, `description`, `developer` | Identidad de tu aplicación y URLs reales de tu web, privacidad y términos. |

La configuración está excluida de Git. El inicializador conserva el archivo y el ID si ya existen. El generador rechaza campos incompletos, campos no admitidos e intentos de añadir secretos o cambiar el mecanismo de autenticación. Nunca genera autenticación anónima.

## 3. Ajustar el contrato de herramientas

Edita `appPackage/tools/bc-custom-read.en.json` y `.es.json`. Deben compartir nombres y esquemas; traduce únicamente las descripciones. Las entradas incluidas `get-customers` y `get-customer` son **contratos de ejemplo de una implementación personalizada**, no nombres del MCP estándar de BC. Contrástalos con `tools/list` de tu servidor, incluidos tipos de entrada y límites.

El generador valida la estructura básica del catálogo, no su compatibilidad en vivo. Declarar menos herramientas en el paquete o marcarlas como lectura no limita el servidor. Aplica los permisos en el servidor y comprueba una llamada no autorizada antes de distribuir el paquete.

Si utilizas otra marca, sustituye el icono de color de 192 × 192 y el outline blanco/transparente de 32 × 32 en `appPackage/icons/`.

## 4. Generar e instalar

Instala una versión compatible de Microsoft 365 Agents Toolkit CLI; la guía de Cowork enlazada indica 1.1.12 o posterior:

```powershell
npm install -g @microsoft/m365agentstoolkit-cli
node custom/scripts/build-package.mjs
$manifestPath = ".\custom\build\appPackage\manifest.json"
$version = (Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json).version
$zipPath = Join-Path (Get-Location) "custom\build\bc-custom-v$version.zip"
atk package --manifest-file $manifestPath --output-package-file $zipPath --output-folder ".\custom\build\packaged"
atk auth login m365
atk install --file-path $zipPath --scope Personal
```

Puedes seleccionar otra configuración con `node custom/scripts/build-package.mjs --config custom/otra.local.json`. La salida queda en `custom/build/`, separada de `native/build/`.

En Cowork, activa el plugin, conecta su servidor MCP e inicia sesión con una cuenta autorizada. Empieza leyendo cinco clientes ficticios del sandbox. Comprueba la herramienta utilizada, la empresa y el resultado. Esta guía no incluye pruebas de escritura.

## Ejemplo opcional y actualizaciones

Selecciona `example: collections` solo para la [demostración de cobros](../examples/collections/README.es.md). El paquete predeterminado no contiene una skill específica de cobros.

Al actualizar una instalación, conserva su app ID expresamente, incrementa la versión del paquete y comprueba la configuración de autenticación del servidor.

[Seguridad](../SECURITY.es.md) · [Alternativa MCP nativo](../native/README.es.md)
