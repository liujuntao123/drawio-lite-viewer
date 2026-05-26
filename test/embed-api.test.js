const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadEmbedApi() {
  const context = {
    window: {
      location: { search: '?embed=1&proto=json&lite=1&autosave=1' },
      parent: {
        postMessage() {}
      },
      opener: null,
      addEventListener() {},
      removeEventListener() {},
      setTimeout,
      clearTimeout,
      Draw: {
        loadPlugin() {}
      }
    },
    document: {},
    console,
    setTimeout,
    clearTimeout
  };

  context.window.window = context.window;
  context.window.JSON = JSON;
  context.window.Math = Math;
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '../js/embed-api.js'), 'utf8');
  vm.runInContext(source, context);

  return context.window.DrawioLiteEmbed;
}

test('parseMessage accepts JSON strings and object messages', () => {
  const api = loadEmbedApi();

  assert.deepEqual(plain(api.parseMessage('{"action":"getXml","id":"a1"}')), {
    action: 'getXml',
    id: 'a1'
  });

  assert.deepEqual(plain(api.parseMessage({ action: 'fit', id: 'a2' })), {
    action: 'fit',
    id: 'a2'
  });

  assert.equal(api.parseMessage('not json'), null);
});

test('createEvent includes protocol, event, id, message, and payload', () => {
  const api = loadEmbedApi();

  assert.deepEqual(
    plain(api.createEvent('save', { id: 's1', action: 'save' }, { xml: '<mxfile />' })),
    {
      event: 'save',
      protocol: 'drawio-lite',
      id: 's1',
      message: { id: 's1', action: 'save' },
      xml: '<mxfile />'
    }
  );
});

test('controller handles getXml, save, and setReadOnly commands', () => {
  const api = loadEmbedApi();
  const sent = [];
  const graph = {
    enabled: true,
    setEnabled(value) {
      this.enabled = value;
    },
    model: {
      listeners: [],
      addListener(name, fn) {
        this.listeners.push({ name, fn });
      }
    }
  };
  const ui = {
    editor: {
      modified: false,
      graph,
      getGraphXml() {
        return { xml: '<mxGraphModel />' };
      }
    },
    getFileData() {
      return '<mxfile />';
    },
    setGraphEnabled(value) {
      graph.setEnabled(value);
    }
  };
  const controller = api.createController(ui, {
    target: {
      postMessage(message) {
        sent.push(JSON.parse(message));
      }
    },
    serializeXml(node) {
      return node.xml;
    }
  });

  controller.handleMessage({
    source: {},
    origin: 'https://host.example',
    data: JSON.stringify({ protocol: 'drawio-lite', action: 'getXml', id: 'g1' })
  });
  controller.handleMessage({
    source: {},
    origin: 'https://host.example',
    data: JSON.stringify({ protocol: 'drawio-lite', action: 'save', id: 's1' })
  });
  controller.handleMessage({
    source: {},
    origin: 'https://host.example',
    data: JSON.stringify({ protocol: 'drawio-lite', action: 'setReadOnly', id: 'r1', readOnly: true })
  });

  const commandEvents = sent.filter((event) => event.event !== 'ready');
  assert.equal(commandEvents[0].event, 'export');
  assert.equal(commandEvents[0].format, 'xml');
  assert.equal(commandEvents[0].xml, '<mxfile />');
  assert.equal(commandEvents[1].event, 'save');
  assert.equal(commandEvents[1].xml, '<mxfile />');
  assert.equal(commandEvents[2].event, 'readOnly');
  assert.equal(commandEvents[2].readOnly, true);
  assert.equal(graph.enabled, false);
});
