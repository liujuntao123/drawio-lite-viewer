import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDrawioUrl,
  createDrawioBridge,
  createRequestId,
  isAllowedOrigin,
  resolveLocale,
  parseDrawioMessage
} from '../package-src/core/index.js';

test('buildDrawioUrl joins asset base and encodes supported options', () => {
  const url = buildDrawioUrl({
    assetBase: '/vendor/drawio/',
    mode: 'edit',
    lang: 'zh',
    config: { css: '.geToolbar { display: none; }' },
    urlParams: {
      dark: true,
      sketch: 0,
      title: '流程 图'
    }
  });

  assert.equal(
    url,
    '/vendor/drawio/index.html?embed=1&proto=json&spin=1&ui=atlas&mode=edit&lang=zh&configure=1&dark=1&sketch=0&title=%E6%B5%81%E7%A8%8B%20%E5%9B%BE'
  );
});

test('buildDrawioUrl rejects missing assetBase', () => {
  assert.throws(
    () => buildDrawioUrl({ assetBase: '' }),
    /assetBase is required/
  );
});

test('parseDrawioMessage handles JSON strings and plain XML payloads', () => {
  assert.deepEqual(
    parseDrawioMessage('{"event":"save","xml":"<mxfile />"}'),
    { event: 'save', xml: '<mxfile />' }
  );

  assert.deepEqual(
    parseDrawioMessage('<mxfile><diagram /></mxfile>'),
    { event: 'xml', xml: '<mxfile><diagram /></mxfile>', raw: '<mxfile><diagram /></mxfile>' }
  );

  assert.equal(parseDrawioMessage('not json'), null);
});

test('isAllowedOrigin supports wildcard, strings, arrays, and URL objects', () => {
  assert.equal(isAllowedOrigin('https://app.example.com', '*'), true);
  assert.equal(isAllowedOrigin('https://app.example.com', 'https://app.example.com'), true);
  assert.equal(isAllowedOrigin('https://evil.example.com', 'https://app.example.com'), false);
  assert.equal(
    isAllowedOrigin('https://cdn.example.com', ['https://app.example.com', 'https://cdn.example.com']),
    true
  );
  assert.equal(isAllowedOrigin('https://app.example.com', new URL('https://app.example.com/drawio/')), true);
});

test('createRequestId produces stable prefixes with incrementing suffixes', () => {
  assert.equal(createRequestId('drawio'), 'drawio-1');
  assert.equal(createRequestId('drawio'), 'drawio-2');
  assert.equal(createRequestId(), 'drawio-3');
});

test('resolveLocale returns built-in Chinese and English messages with overrides', () => {
  assert.deepEqual(
    resolveLocale({
      locale: 'zh',
      messages: {
        zh: {
          loading: '正在打开图表'
        }
      }
    }),
    {
      locale: 'zh',
      lang: 'zh',
      messages: {
        loading: '正在打开图表',
        error: '图表加载失败',
        ready: '编辑器已就绪'
      }
    }
  );

  assert.deepEqual(
    resolveLocale({ locale: 'en' }),
    {
      locale: 'en',
      lang: 'en',
      messages: {
        loading: 'Loading diagram',
        error: 'Diagram failed to load',
        ready: 'Editor ready'
      }
    }
  );
});

test('bridge exportAs posts explicit export command with format and options', async () => {
  const posted = [];
  const frame = {
    contentWindow: {
      postMessage(message, origin) {
        posted.push({ message: JSON.parse(message), origin });
      }
    }
  };

  const bridge = createDrawioBridge({
    frame,
    targetOrigin: 'https://drawio.example.com',
    timeoutMs: 50
  });

  const promise = bridge.exportAs('png', {
    transparent: true,
    scale: 2,
    border: 8
  });

  assert.equal(posted.length, 1);
  assert.equal(posted[0].origin, 'https://drawio.example.com');
  assert.equal(posted[0].message.action, 'export');
  assert.equal(posted[0].message.format, 'png');
  assert.equal(posted[0].message.transparent, true);
  assert.equal(posted[0].message.scale, 2);
  assert.equal(posted[0].message.border, 8);

  bridge.handleMessage({
    origin: 'https://drawio.example.com',
    data: JSON.stringify({
      event: 'export',
      id: posted[0].message.id,
      format: 'png',
      data: 'data:image/png;base64,abc'
    })
  });

  assert.deepEqual(await promise, {
    event: 'export',
    id: posted[0].message.id,
    format: 'png',
    data: 'data:image/png;base64,abc'
  });
});
