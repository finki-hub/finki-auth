import { describe, expect, it } from 'vitest';

import { Service, ServiceSchema } from '../lib/Service.js';
import { formatCookieHeader, parseCookieHeader } from '../utils.js';

describe('parseCookieHeader', () => {
  it('returns an empty array for an empty header', () => {
    expect(parseCookieHeader('')).toStrictEqual([]);
  });

  it('parses a single cookie', () => {
    expect(parseCookieHeader('key=value')).toStrictEqual([
      { key: 'key', value: 'value' },
    ]);
  });

  it('parses multiple cookies', () => {
    expect(parseCookieHeader('a=1; b=2; c=3')).toStrictEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
      { key: 'c', value: '3' },
    ]);
  });

  it('keeps "=" characters that appear inside a value', () => {
    expect(parseCookieHeader('token=ab=cd==')).toStrictEqual([
      { key: 'token', value: 'ab=cd==' },
    ]);
  });
});

describe('formatCookieHeader', () => {
  it('returns an empty string for no cookies', () => {
    expect(formatCookieHeader([])).toBe('');
  });

  it('joins cookies into a header string', () => {
    expect(
      formatCookieHeader([
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
      ]),
    ).toBe('a=1; b=2');
  });

  it('is the inverse of parseCookieHeader', () => {
    const header = 'sessionid=abc123; token=x=y==; theme=dark';

    expect(formatCookieHeader(parseCookieHeader(header))).toBe(header);
  });
});

describe('ServiceSchema', () => {
  it('accepts every Service enum value', () => {
    for (const service of Object.values(Service)) {
      expect(ServiceSchema.parse(service)).toBe(service);
    }
  });

  it('rejects unknown values', () => {
    expect(ServiceSchema.safeParse('not-a-service').success).toBeFalsy();
  });
});
