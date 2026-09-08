---
name: bc-collections-intervention
description: |
  Analiza y prioriza intervenciones de cobro combinando evidencia financiera de
  Business Central con contexto de Outlook y Teams. Usar cuando el usuario
  pregunte "a qué clientes debemos reclamar hoy", "prioriza los cobros",
  "revisa la deuda vencida", "prepara una intervención de cobro" o solicite
  probar los casos ficticios de Ático Cobros.
license: MIT
metadata:
  author: Javier Armesto
  version: "0.2.1"
---

# Intervención de cobros

## Objetivo

Responder de forma verificable:

> ¿En qué clientes debemos actuar hoy, por qué y cuál es la siguiente acción adecuada?

Business Central aporta la verdad financiera. Outlook y Teams aportan contexto operativo. La skill clasifica, explica y propone; no convierte una inferencia en un hecho ni ejecuta una acción visible sin aprobación.

## Modos

### Datos reales

Utiliza este modo únicamente cuando estén disponibles herramientas autorizadas de Business Central y Microsoft 365.

- Usa `get-customers` para localizar candidatos y obtener una primera señal de saldo.
- Usa `get-customer` para confirmar el cliente y su saldo individual.
- Trata estas dos herramientas como consultas. No invoques ninguna herramienta cuyo nombre empiece por `create-`, `add-`, `delete-` o `update-`.
- El contrato de ejemplo no proporciona facturas vencidas, días de vencimiento ni antigüedad de saldos. No clasifiques **Actuar** basándote únicamente en un saldo positivo.
- No simules llamadas ni datos.
- Si falta una fuente necesaria, indícalo y limita la conclusión.
- Cita en cada caso qué procede de Business Central y qué procede de Microsoft 365.

### Demostración incluida

Utiliza los casos de references/demo-cases.md solo cuando el usuario pida expresamente probar, simular o usar los casos ficticios incluidos.

Encabeza la respuesta con:

> Modo demostración — datos ficticios incluidos en el plugin.

Nunca presentes esos datos como procedentes de una consulta en vivo.

## Flujo

1. Determina la fecha de análisis, los umbrales y el máximo de clientes. Si no se indican, usa la fecha actual y limita la demostración a los tres casos incluidos.
2. Obtén o carga la evidencia financiera: cliente, facturas, importe pendiente, vencimiento, días vencidos y estado. En el modo conectado, comienza con `get-customers` y confirma cada cliente seleccionado mediante `get-customer`.
3. Busca señales posteriores relevantes en Microsoft 365:
   - promesa de pago vigente;
   - disputa o incidencia sobre la factura;
   - seguimiento previo;
   - ausencia de actividad relevante.
4. Aplica exactamente la política de references/decision-policy.md.
5. Presenta la salida según references/output-contract.md.
6. Separa hechos, inferencias e información ausente.
7. Solicita aprobación antes de crear un borrador, tarea, mensaje o registro.
8. En esta versión, detente después del checkpoint de aprobación. No ejecutes acciones.

## Reglas de fuentes

- **Business Central:** importes, documentos, estados, fechas y vencimientos.
- **Outlook/Teams:** compromisos, disputas, conversaciones y seguimiento.
- **Inferencia:** clasificación y recomendación razonada.

Si las fuentes se contradicen, clasifica **Escalar** y explica el conflicto.

## Guardarraíles

- No enviar correos automáticamente.
- No bloquear clientes.
- No cambiar límites de crédito.
- No registrar pagos.
- No contabilizar, modificar ni eliminar documentos.
- No afirmar que la ausencia de una búsqueda equivale a ausencia de comunicación.
- No ocultar incertidumbre.
- No exponer datos de otros clientes que no sean necesarios para justificar la recomendación.
- No utilizar tools no declarados en references/live-connector-contract.md, aunque el servidor remoto los anuncie.

## Aprobación

Después de mostrar el análisis, formula un checkpoint concreto:

> Propuesta preparada. ¿Apruebas crear los borradores indicados? No se enviará ningún correo.

No interpretes una petición de análisis como aprobación para actuar.

## Recursos

- references/decision-policy.md: reglas y precedencia de clasificación.
- references/demo-cases.md: datos ficticios para la prueba skills-only.
- references/output-contract.md: estructura obligatoria de la respuesta.
- references/live-connector-contract.md: tools permitidos y límites del conector personalizado.
