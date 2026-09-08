[English](SECURITY.md) · [Castellano](SECURITY.es.md)

# Seguridad

## Alcance mantenido

Este repositorio es una implementación de referencia. Las correcciones de seguridad se aplican a `main`; no se garantiza mantenimiento a largo plazo de paquetes antiguos de demostración. Valida tu despliegue antes de usar datos de negocio.

### Puente al MCP estándar

El puente nativo valida tokens delegados v2 para un tenant, audiencia de API y cliente OAuth fijos, exige `access_as_user` e intercambia la identidad del usuario mediante OBO. Admite solo lectura. La configuración de Business Central y los permisos del usuario constituyen el límite de autorización. Un health check correcto no confirma la conexión con BC.

## Configuración y datos

- Guarda secretos y tokens en los almacenes del despliegue o de la plataforma; nunca en Git ni en ZIPs.
- Excluye los `.env` completados y los `*.local.json` del control de versiones. Comparte solo ejemplos genéricos.
- Tenant IDs y app IDs son identificadores, no secretos de autenticación, pero la configuración de despliegues reales debe quedar en local.
- Prueba con datos ficticios de sandbox. No adjuntes exportaciones de clientes, capturas con datos de negocio ni logs completos de peticiones y respuestas en issues.
- Renueva las credenciales antes de su caducidad. Si un secreto real entró en Git, revócalo o rótalo; eliminar el archivo actual no basta.
- Usa un app ID propio para cada línea de instalación. Reutilízalo solo al actualizar expresamente esa aplicación.

## Notificación

No publiques credenciales ni detalles de vulnerabilidades en issues. Utiliza la [notificación privada de GitHub](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide/security/advisories/new) cuando esté habilitada. Si no está disponible, contacta mediante un canal privado enlazado desde el [perfil del mantenedor](https://github.com/javiarmesto) antes de compartir detalles. Incluye versión/commit afectado, pasos de reproducción e impacto; oculta tokens y datos de negocio. Activar la notificación privada forma parte de la preparación de la publicación.
