export const nativeUrl = 'https://mcp.businesscentral.dynamics.com';
// Verified against the live protected-resource metadata, not the REST API audience.
export const nativeScope = `${nativeUrl}/.default`;

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const required = (name: string) => {
    const value = env[name]?.trim();
    if (!value || /[\r\n]/.test(value)) throw new Error(`Missing or invalid ${name}`);
    return value;
  };
  const guid = (name: string) => {
    const value = required(name);
    if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
      throw new Error(`Invalid GUID: ${name}`);
    }
    return value.toLowerCase();
  };
  const toolMode = env.BC_TOOL_MODE?.trim() || 'static';
  if (toolMode !== 'static' && toolMode !== 'dynamic') throw new Error('BC_TOOL_MODE must be static or dynamic');
  const tenantId = guid('BC_TENANT_ID');
  const publicUrl = new URL(required('BRIDGE_PUBLIC_URL'));
  if (publicUrl.protocol !== 'https:' || publicUrl.username || publicUrl.password ||
      publicUrl.search || publicUrl.hash || publicUrl.pathname !== '/') {
    throw new Error('BRIDGE_PUBLIC_URL must be an HTTPS origin');
  }
  return {
    tenantId, toolMode,
    clientId: guid('BRIDGE_CLIENT_ID'),
    callerClientId: guid('COWORK_CLIENT_ID'),
    clientSecret: required('BRIDGE_CLIENT_SECRET'),
    environment: required('BC_ENVIRONMENT_NAME'),
    company: required('BC_COMPANY'),
    configuration: required('BC_CONFIGURATION_NAME'),
    publicUrl: publicUrl.origin,
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    tokenUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  };
}
export type Config = ReturnType<typeof readConfig>;

export function encodeHeader(value: string) {
  if (/[\r\n]/.test(value)) throw new Error('Invalid header value');
  return /[^\x20-\x7e]/.test(value)
    ? `=?base64?${Buffer.from(value, 'utf8').toString('base64')}?=` : value;
}

export function nativeHeaders(config: Config) {
  return {
    TenantId: config.tenantId,
    EnvironmentName: config.environment,
    Company: encodeHeader(config.company),
    ConfigurationName: encodeHeader(config.configuration)
  };
}
