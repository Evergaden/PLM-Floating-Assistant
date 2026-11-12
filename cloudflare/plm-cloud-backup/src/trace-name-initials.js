import pinyinLibrary from '../../../src/vendor/pinyin-pro-3.29.4.js';

export function nameInitials(value) {
  if (typeof value !== 'string') return null;
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!name || Array.from(name).length > 80) return null;
  const parts = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[\p{Script=Han}]+|[A-Za-z]+/gu) || [];
  const initials = parts.map((part) => /\p{Script=Han}/u.test(part)
    ? pinyinLibrary.pinyin(part, { pattern: 'first', toneType: 'none', type: 'array', surname: 'head', nonZh: 'removed' }).join('')
    : part[0]).join('').toUpperCase().replace(/[^A-Z]/g, '');
  return initials ? { name, initials } : null;
}
