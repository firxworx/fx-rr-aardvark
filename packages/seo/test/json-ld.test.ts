import { describe, expect, it } from 'vitest'

import { serializeJsonLd } from '../src/json-ld'

describe('serializeJsonLd', () => {
  it('escapes characters that could end the script element', () => {
    const data = { '@type': 'Thing', name: '</script><script>alert(1)</script> & more' }
    const serialized = serializeJsonLd(data)

    expect(serialized).not.toMatch(/[<>&]/)
    expect(JSON.parse(serialized)).toEqual(data)
  })

  it('escapes line and paragraph separators', () => {
    const data = { name: 'a\u2028b\u2029c' }
    const serialized = serializeJsonLd(data)

    expect(serialized).toBe('{"name":"a\\u2028b\\u2029c"}')
    expect(JSON.parse(serialized)).toEqual(data)
  })
})
