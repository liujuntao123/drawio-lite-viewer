/**
 * Lightweight iframe embed protocol for the deployed draw.io lite page.
 *
 * This script is intentionally independent from the minified app bundle. It
 * registers through Draw.loadPlugin when the editor is ready and keeps the
 * public host protocol small and stable.
 */
(function()
{
	var PROTOCOL = 'drawio-lite';
	var READY_RETRY_MS = 50;

	function parseQuery(search)
	{
		var result = {};
		var query = (search || '').replace(/^\?/, '').split('&');

		for (var i = 0; i < query.length; i++)
		{
			if (query[i].length > 0)
			{
				var idx = query[i].indexOf('=');
				var key = idx >= 0 ? query[i].substring(0, idx) : query[i];
				var value = idx >= 0 ? query[i].substring(idx + 1) : '1';
				result[decodeURIComponent(key)] = decodeURIComponent(value);
			}
		}

		return result;
	}

	function parseMessage(data)
	{
		if (data == null)
		{
			return null;
		}
		else if (typeof data == 'object')
		{
			return data;
		}
		else if (typeof data == 'string')
		{
			try
			{
				var parsed = JSON.parse(data);
				return (parsed != null && typeof parsed == 'object') ? parsed : null;
			}
			catch (e)
			{
				return null;
			}
		}

		return null;
	}

	function createEvent(eventName, message, payload)
	{
		var result = {
			event: eventName,
			protocol: PROTOCOL
		};

		if (message != null)
		{
			if (message.id != null)
			{
				result.id = message.id;
			}

			result.message = message;
		}

		if (payload != null)
		{
			for (var key in payload)
			{
				if (Object.prototype.hasOwnProperty.call(payload, key))
				{
					result[key] = payload[key];
				}
			}
		}

		return result;
	}

	function createController(ui, options)
	{
		options = options || {};

		var win = options.window || window;
		var target = options.target || win.opener || win.parent;
		var targetOrigin = options.targetOrigin || '*';
		var serializeXml = options.serializeXml || function(node)
		{
			return mxUtils.getXml(node);
		};
		var parseXml = options.parseXml || function(xml)
		{
			return mxUtils.parseXml(xml).documentElement;
		};
		var query = options.query || parseQuery(win.location && win.location.search);
		var lastXml = null;

		function getXml()
		{
			if (typeof ui.getFileData == 'function')
			{
				return ui.getFileData(true);
			}

			return serializeXml(ui.editor.getGraphXml());
		}

		function post(eventName, message, payload)
		{
			if (target != null && typeof target.postMessage == 'function')
			{
				target.postMessage(JSON.stringify(createEvent(eventName, message, payload)), targetOrigin);
			}
		}

		function postError(message, error)
		{
			post('error', message, {
				error: error != null && error.message != null ? error.message : String(error)
			});
		}

		function setReadOnly(readOnly)
		{
			var enabled = !readOnly;

			if (typeof ui.setGraphEnabled == 'function')
			{
				ui.setGraphEnabled(enabled);
			}
			else if (ui.editor != null && ui.editor.graph != null)
			{
				ui.editor.graph.setEnabled(enabled);
			}
		}

		function loadXml(xml)
		{
			if (ui.spinner != null && typeof ui.spinner.stop == 'function')
			{
				ui.spinner.stop();
			}

			if (typeof ui.setFileData == 'function')
			{
				ui.setFileData(xml || '');
			}
			else
			{
				ui.editor.setGraphXml(parseXml(xml || ui.emptyDiagramXml || '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'));
			}

			ui.editor.modified = false;
			
			if (query.readOnly != '1')
			{
				setReadOnly(false);
			}
			
			lastXml = getXml();
		}

		function exportXml(message, format)
		{
			post('export', message, {
				format: format || 'xml',
				xml: getXml()
			});
		}

		function createFilename(message, extension)
		{
			var name = message != null && message.filename != null ?
				String(message.filename) : 'diagram-' + new Date().getTime() + '.' + extension;

			if (name.substring(name.length - extension.length - 1).toLowerCase() != '.' + extension)
			{
				name += '.' + extension;
			}

			return name;
		}

		function triggerDownload(href, filename, revoke)
		{
			var link = win.document.createElement('a');
			link.href = href;
			link.download = filename;
			win.document.body.appendChild(link);
			link.click();
			win.document.body.removeChild(link);

			if (revoke)
			{
				win.setTimeout(function()
				{
					win.URL.revokeObjectURL(href);
				}, 100);
			}
		}

		function downloadText(data, mime, filename)
		{
			var blob = new Blob([data], {type: mime});
			var href = win.URL.createObjectURL(blob);
			triggerDownload(href, filename, true);
		}

		function downloadSource(message)
		{
			var filename = createFilename(message, 'drawio');
			downloadText(getXml(), 'application/xml', filename);
			post('download', message, {format: 'drawio', filename: filename});
		}

		function downloadSvg(message)
		{
			var graph = ui.editor.graph;
			var background = message.background != null ? message.background : graph.background;
			var svg = graph.getSvg(background, message.scale, message.border);
			var filename = createFilename(message, 'svg');
			downloadText(serializeXml(svg), 'image/svg+xml', filename);
			post('download', message, {format: 'svg', filename: filename});
		}

		function downloadPng(message)
		{
			var filename = createFilename(message, 'png');
			var done = function(canvas)
			{
				triggerDownload(canvas.toDataURL('image/png'), filename, false);
				post('download', message, {format: 'png', filename: filename});
			};
			var error = function(err)
			{
				postError(message, err);
			};

			if (ui.editor != null && typeof ui.editor.exportToCanvas == 'function')
			{
				ui.editor.exportToCanvas(done, null, null, null, error, null, true,
					message.scale || 1, message.transparent === true, false, null, null,
					message.border || 0);
			}
			else if (ui.exportToCanvas != null && typeof ui.exportToCanvas == 'function')
			{
				ui.exportToCanvas(done, null, null, null, error, null, true,
					message.scale || 1, message.transparent === true, false, null, null,
					message.border || 0);
			}
			else
			{
				postError(message, 'PNG export is not available in this embed');
			}
		}

		function exportPng(message)
		{
			var done = function(canvas)
			{
				post('export', message, {
					format: 'png',
					xml: getXml(),
					data: canvas.toDataURL('image/png')
				});
			};
			var error = function(err)
			{
				postError(message, err);
			};

			if (ui.editor != null && typeof ui.editor.exportToCanvas == 'function')
			{
				ui.editor.exportToCanvas(done, null, null, null, error, null, true,
					message.scale || 1, message.transparent === true, false, null, null,
					message.border || 0);
			}
			else if (ui.exportToCanvas != null && typeof ui.exportToCanvas == 'function')
			{
				ui.exportToCanvas(done, null, null, null, error, null, true,
					message.scale || 1, message.transparent === true, false, null, null,
					message.border || 0);
			}
			else
			{
				postError(message, 'PNG export is not available in this embed');
			}
		}

		function handleCommand(message)
		{
			switch (message.action)
			{
				case 'load':
					loadXml(message.xml);
					post('load', message, {xml: getXml()});
					break;
				case 'getXml':
				case 'export':
					if (message.format == null || message.format == 'xml')
					{
						exportXml(message, 'xml');
					}
					else if (message.format == 'svg' || message.format == 'xmlsvg')
					{
						exportSvg(message);
					}
					else if (message.format == 'png')
					{
						exportPng(message);
					}
					else
					{
						postError(message, 'Unsupported lite export format: ' + message.format);
					}
					break;
				case 'exportAs':
					message.format = message.format || 'xml';
					handleCommand({action: 'export', id: message.id, format: message.format,
						asText: message.asText, message: message});
					break;
				case 'downloadSource':
					invokeAction('exportXml');
					post('menuAction', message, {action: 'exportXml'});
					break;
				case 'downloadSvg':
					invokeAction('exportSvg');
					post('menuAction', message, {action: 'exportSvg'});
					break;
				case 'downloadPng':
					invokeAction('exportPng');
					post('menuAction', message, {action: 'exportPng'});
					break;
				case 'save':
					post('save', message, {xml: getXml()});
					ui.editor.modified = false;
					break;
				case 'setReadOnly':
					setReadOnly(message.readOnly == null ? true : !!message.readOnly);
					post('readOnly', message, {readOnly: message.readOnly == null ? true : !!message.readOnly});
					break;
				case 'undo':
				case 'redo':
				case 'fit':
				case 'zoomIn':
				case 'zoomOut':
					invokeAction(message.action == 'fit' ? 'fitWindow' : message.action);
					post(message.action, message);
					break;
				case 'zoom':
					setZoom(message.scale);
					post('zoom', message, {scale: ui.editor.graph.view.scale});
					break;
				case 'clear':
					loadXml(ui.emptyDiagramXml || '');
					post('clear', message, {xml: getXml()});
					break;
				default:
					postError(message, 'Unknown lite embed action: ' + message.action);
					break;
			}
		}

		function invokeAction(name)
		{
			if (ui.actions != null)
			{
				var action = ui.actions.get(name);

				if (action != null)
				{
					action.funct();
				}
			}
		}

		function setZoom(scale)
		{
			scale = parseFloat(scale);

			if (!isNaN(scale) && scale > 0)
			{
				ui.editor.graph.zoomTo(scale);
			}
		}

		function exportSvg(message)
		{
			var graph = ui.editor.graph;
			var background = message.background != null ? message.background : graph.background;
			var svg = graph.getSvg(background, message.scale, message.border);
			post('export', message, {
				format: message.format || 'svg',
				xml: getXml(),
				data: message.asText ? serializeXml(svg) : 'data:image/svg+xml,' + encodeURIComponent(serializeXml(svg))
			});
		}

		function handleMessage(evt)
		{
			var message = parseMessage(evt.data);

			if (message == null || message.protocol != PROTOCOL && message.lite !== true)
			{
				return;
			}
			
			if (typeof evt.stopImmediatePropagation == 'function')
			{
				evt.stopImmediatePropagation();
			}

			try
			{
				handleCommand(message);
			}
			catch (e)
			{
				postError(message, e);
			}
		}

		function installAutosave()
		{
			if (ui.editor == null || ui.editor.graph == null || ui.editor.graph.model == null ||
				typeof ui.editor.graph.model.addListener != 'function')
			{
				return;
			}

			lastXml = getXml();
			ui.editor.graph.model.addListener('change', function()
			{
				var xml = getXml();

				if (xml != lastXml)
				{
					lastXml = xml;
					post('change', null, {
						xml: xml,
						modified: !!ui.editor.modified
					});
				}
			});
		}

		if (query.readOnly == '1')
		{
			setReadOnly(true);
		}

		if (query.autosave == '1')
		{
			installAutosave();
		}

		post('ready', null, {
			actions: ['load', 'getXml', 'save', 'export', 'exportAs', 'setReadOnly',
				'downloadSource', 'downloadSvg', 'downloadPng', 'undo', 'redo', 'fit',
				'zoom', 'clear']
		});

		return {
			handleMessage: handleMessage,
			handleCommand: handleCommand,
			post: post,
			getXml: getXml
		};
	}

	function register()
	{
		var query = parseQuery(window.location && window.location.search);
		var isEmbedded = window.parent != null && window.parent != window;

		if (query.embed != '1' && query.lite != '1' && !isEmbedded && window.opener == null)
		{
			return;
		}

		if (window.App != null && typeof window.App.main == 'function' &&
			window.App.main._drawioLiteWrapped !== true)
		{
			var appMain = window.App.main;
			
			window.App.main = function(callback, createUi)
			{
				return appMain.call(this, function(ui)
				{
					install(ui);
					
					if (callback != null)
					{
						callback(ui);
					}
				}, createUi);
			};
			
			window.App.main._drawioLiteWrapped = true;
		}

		if (window.Draw != null && typeof window.Draw.loadPlugin == 'function')
		{
			window.Draw.loadPlugin(install);
		}
		else
		{
			window.setTimeout(register, READY_RETRY_MS);
		}
	}
	
	function install(ui)
	{
		if (window.DrawioLiteEmbedController == null)
		{
			window.DrawioLiteEmbedController = createController(ui);
			window.addEventListener('message', window.DrawioLiteEmbedController.handleMessage, true);
		}
	}

	window.DrawioLiteEmbed = {
		parseQuery: parseQuery,
		parseMessage: parseMessage,
		createEvent: createEvent,
		createController: createController,
		register: register
	};

	register();
})();
