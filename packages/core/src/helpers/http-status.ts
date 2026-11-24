/**
 * Reason phrases for HTTP status codes in the IANA HTTP Status Code Registry
 * (RFC 9110 plus extensions such as RFC 6585, WebDAV, and RFC 8470) with `418` included by tradition.
 *
 * Obsolete and unused codes (`306`, `510`) and non-standard vendor codes are excluded.
 *
 * @see https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
 * @see https://www.rfc-editor.org/rfc/rfc9110#name-status-codes
 */
export const HTTP_REASON_PHRASES = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Content Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a Teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Content',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  511: 'Network Authentication Required',
} as const satisfies Readonly<Record<number, string>>

/**
 * HTTP status codes with a known reason phrase.
 */
export type HttpStatusCode = keyof typeof HTTP_REASON_PHRASES

/**
 * Type guard for status codes that have a known reason phrase in `HTTP_REASON_PHRASES`.
 */
export function isKnownHttpStatusCode(statusCode: number): statusCode is HttpStatusCode {
  return Object.hasOwn(HTTP_REASON_PHRASES, statusCode)
}

/**
 * Returns the reason phrase (e.g. `"Not Found"`) for the given HTTP status code.
 *
 * Never throws: returns `undefined` for unknown codes so it is safe to use in error handling code.
 * Known code literals (e.g. `getHttpReasonPhrase(404)`) are typed as returning `string`.
 */
export function getHttpReasonPhrase(statusCode: HttpStatusCode): string
export function getHttpReasonPhrase(statusCode: number): string | undefined
export function getHttpReasonPhrase(statusCode: number): string | undefined {
  return isKnownHttpStatusCode(statusCode) ? HTTP_REASON_PHRASES[statusCode] : undefined
}

/**
 * Returns `true` if the given Response status code is in the range of 400-599 inclusive.
 *
 * For the success range (200-299) use the built-in `response.ok`.
 */
export function isErrorResponse(response: Response): boolean {
  return response.status >= 400 && response.status < 600
}
