import { describe, expect, it } from 'vitest';

import { toTouchCase } from './touch-label';

describe('toTouchCase', () => {
  it('Title Case por default (baja el resto, sube la inicial de cada palabra)', () => {
    expect(toTouchCase('TOUCH HERE', false)).toBe('Touch Here');
    expect(toTouchCase('touch here', false)).toBe('Touch Here');
    expect(toTouchCase('ToUcH hErE', false)).toBe('Touch Here');
  });

  it('preserva los \\n del layout de 2 líneas', () => {
    expect(toTouchCase('TOUCH\nHERE', false)).toBe('Touch\nHere');
  });

  it('uppercase=true → MAYÚSCULAS', () => {
    expect(toTouchCase('Touch Here', true)).toBe('TOUCH HERE');
    expect(toTouchCase('touch\nhere', true)).toBe('TOUCH\nHERE');
  });

  it('palabras sueltas y vacío', () => {
    expect(toTouchCase('start', false)).toBe('Start');
    expect(toTouchCase('', false)).toBe('');
  });
});
