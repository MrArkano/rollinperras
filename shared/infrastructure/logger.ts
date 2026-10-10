type LogLevel = 'info' | 'warn' | 'error'
type LogContext = Readonly<Record<string, unknown>>

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { value: String(error) }
}

function write(level: LogLevel, event: string, context?: LogContext): void {
  const entry = JSON.stringify({ level, event, time: new Date().toISOString(), ...context })
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.info(entry)
}

/** Logger estructurado (JSON por línea). Nunca registra secretos ni payloads completos. */
export const logger = {
  info: (event: string, context?: LogContext) => write('info', event, context),
  warn: (event: string, context?: LogContext) => write('warn', event, context),
  error: (event: string, error: unknown, context?: LogContext) =>
    write('error', event, { ...context, error: serializeError(error) }),
}
