# Contrato de ejemplo del MCP personalizado

## Alcance permitido

Esta skill permite exclusivamente estas herramientas del contrato de ejemplo:

| Tool | Uso | Efecto esperado |
| --- | --- | --- |
| `get-customers` | Localizar clientes y revisar una primera señal de saldo | Solo lectura |
| `get-customer` | Confirmar identidad, datos básicos y saldo de un cliente | Solo lectura |

No invoques ninguna otra herramienta aunque el endpoint remoto la anuncie mediante `tools/list`.

## Limitación de evidencia

Un saldo positivo no demuestra que exista deuda vencida. Para clasificar **Actuar** hacen falta, como mínimo:

- documento pendiente;
- importe restante;
- fecha de vencimiento;
- días vencidos;
- ausencia de disputa y de promesa vigente.

Si esos datos no están disponibles, declara la limitación. No inventes facturas ni fechas y no transformes automáticamente el caso en una reclamación.

## Estado de seguridad

El paquete público requiere `OAuthPluginVault` y un servidor propio que autentique y autorice cada llamada. El generador no implementa la seguridad del servidor. Antes de usar datos reales, confirma el contrato y los permisos del endpoint desplegado.

## Contrato objetivo

Una posible ampliación futura, no implementada en esta skill, utilizaría:

- `list_collection_candidates`;
- `get_customer_collection_status`;
- posteriormente, y siempre con aprobación, `register_collection_intervention`.

Cualquier ampliación debe aplicar autenticación y autorización en el servidor. Las anotaciones no sustituyen estos controles.
