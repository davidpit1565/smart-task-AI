import { describe, expect, it } from 'vitest';
import { parseDeepLink, shareTargetToTaskInput } from '@/core/deepLink';

describe('parseDeepLink', () => {
  it('parses a valid screen param', () => {
    expect(parseDeepLink('?screen=calendar')).toEqual({ screen: 'calendar' });
  });

  it('ignores an invalid screen value', () => {
    expect(parseDeepLink('?screen=nonsense')).toEqual({});
  });

  it('parses a task id', () => {
    expect(parseDeepLink('?task=abc-123')).toEqual({ taskId: 'abc-123' });
  });

  it('parses a share-target payload', () => {
    expect(parseDeepLink('?title=Hello&text=World&url=https://example.com')).toEqual({
      shareTarget: { title: 'Hello', text: 'World', url: 'https://example.com' },
    });
  });

  it('parses a share-target payload with only some fields present', () => {
    expect(parseDeepLink('?text=Just+text')).toEqual({ shareTarget: { title: '', text: 'Just text', url: '' } });
  });

  it('returns an empty action for an empty query string', () => {
    expect(parseDeepLink('')).toEqual({});
  });

  it('combines a screen and a share target in one URL', () => {
    expect(parseDeepLink('?screen=inbox&title=Buy+milk')).toEqual({
      screen: 'inbox',
      shareTarget: { title: 'Buy milk', text: '', url: '' },
    });
  });
});

describe('shareTargetToTaskInput', () => {
  it('uses the title when present', () => {
    expect(shareTargetToTaskInput({ title: 'Article title', text: 'some text', url: 'https://example.com' })).toEqual({
      title: 'Article title',
      description: 'some text\nhttps://example.com',
    });
  });

  it('falls back to text when there is no title', () => {
    expect(shareTargetToTaskInput({ title: '', text: 'Just some shared text', url: '' })).toEqual({
      title: 'Just some shared text',
      description: '',
    });
  });

  it('falls back to the url when there is no title or text', () => {
    expect(shareTargetToTaskInput({ title: '', text: '', url: 'https://example.com/article' })).toEqual({
      title: 'https://example.com/article',
      description: '',
    });
  });

  it('falls back to a generic label when everything is empty', () => {
    expect(shareTargetToTaskInput({ title: '', text: '', url: '' })).toEqual({ title: 'Shared item', description: '' });
  });

  it('does not duplicate the title into the description', () => {
    expect(shareTargetToTaskInput({ title: 'Same', text: 'Same', url: '' })).toEqual({ title: 'Same', description: '' });
  });
});
