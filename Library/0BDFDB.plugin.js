/**
 * @name BDFDB
 * @authorId 278543574059057154
 * @invite Jx3TjNS
 * @donate https://www.paypal.me/MircoWittrien
 * @patreon https://www.patreon.com/MircoWittrien
 * @website https://github.com/mwittrien/BetterDiscordAddons/tree/master/Library
 * @source https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Library/0BDFDB.plugin.js
 * @updateUrl https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Library/0BDFDB.plugin.js
 */

module.exports = (_ => {
	const isBeta = !(window.BdApi && !Array.isArray(BdApi.settings));
	
	const config = {
		"info": {
			"name": "BDFDB",
			"author": "DevilBro",
			"version": "1.1.2",
			"description": "Give other plugins utility functions"
		},
		"rawUrl": "https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js",
		"changeLog": {
			"fixed": {
				"BD Beta": "Fixed some issues with the BD Beta"
			}
		}
	};
	
	const DiscordObjects = {};
	const LibraryRequires = {};
	const LibraryModules = {};
	const InternalComponents = {NativeSubComponents: {}, LibraryComponents: {}};
	const Cache = {data: {}, modules: {}};
	
	var libraryInstance;
	var settings = {}, changeLogs = {};
	
	if (window.BDFDB_Global && window.BDFDB_Global.PluginUtils && typeof window.BDFDB_Global.PluginUtils.cleanUp == "function") {
		window.BDFDB_Global.PluginUtils.cleanUp(window.BDFDB_Global);
	}
	
	const BDFDB = {
		started: true
	};
	for (let key in config) key == "info" ? Object.assign(BDFDB, config[key]) : (BDFDB[key] = config[key]);
	
	const InternalBDFDB = Object.assign({}, BDFDB, {
		patchPriority: 0,
		defaults: {
			settings: {
				showToasts:				{value:true,	description:"Show Plugin start and stop Toasts"},
				showSupportBadges:		{value:true,	description:"Show little Badges for Users who support my Patreon"}
			}
		},
	});
	
	const PluginStores = {
		loaded: {},
		delayedLoad: [],
		delayedStart: [],
		updateTimeout: [],
		patchQueues: {}
	};
	const Plugin = function(config) {
		return class Plugin {
			getName() {return config.info.name;}
			getAuthor() {return config.info.author;}
			getVersion() {return config.info.version;}
			getDescription() {return config.info.description;}
			load() {
				this.loaded = true;
				if (window.BDFDB_Global.loading) {
					if (!PluginStores.delayedLoad.includes(this)) PluginStores.delayedLoad.push(this);
				}
				else {
					Object.assign(this, config.info, BDFDB.ObjectUtils.exclude(config, "info"));
					BDFDB.TimeUtils.suppress(_ => {
						PluginStores.loaded[config.info.name] = this;
						BDFDB.PluginUtils.load(this);
						if (typeof this.onLoad == "function") this.onLoad();
					}, "Failed to load plugin!", config.info.name)();
				}
			}
			start() {
				if (!this.loaded) this.load();
				if (window.BDFDB_Global.loading) {
					if (!PluginStores.delayedStart.includes(this)) PluginStores.delayedStart.push(this);
				}
				else {
					if (this.started) return;
					this.started = true;
					BDFDB.TimeUtils.suppress(_ => {
						BDFDB.PluginUtils.init(this);
						if (typeof this.onStart == "function") this.onStart();
					}, "Failed to start plugin!", config.info.name)();
					delete this.stopping;
				}
			}
			stop() {
				if (this.stopping) return;
				this.stopping = true;
				BDFDB.TimeUtils.timeout(_ => {delete this.stopping;});
				
				BDFDB.TimeUtils.suppress(_ => {
					if (typeof this.onStop == "function") this.onStop();
					BDFDB.PluginUtils.clear(this);
				}, "Failed to stop plugin!", config.info.name)();

				delete this.started;
			}
		};
	};

	BDFDB.LogUtils = {};
	BDFDB.LogUtils.log = function (string, name) {
		console.log(`%c[${typeof name == "string" && name || "BDFDB"}]`, "color: #3a71c1; font-weight: 700;", (typeof string == "string" && string || "").trim());
	};
	BDFDB.LogUtils.warn = function (string, name) {
		console.warn(`%c[${typeof name == "string" && name || "BDFDB"}]`, "color: #3a71c1; font-weight: 700;", (typeof string == "string" && string || "").trim());
	};
	BDFDB.LogUtils.error = function (string, name) {
		console.error(`%c[${typeof name == "string" && name || "BDFDB"}]`, "color: #3a71c1; font-weight: 700;", "Fatal Error: " + (typeof string == "string" && string || "").trim());
	};

	BDFDB.TimeUtils = {};
	BDFDB.TimeUtils.interval = function (callback, delay, ...args) {
		if (typeof callback != "function" || typeof delay != "number" || delay < 1) return;
		else {
			let count = 0, interval = setInterval(_ => {BDFDB.TimeUtils.suppress(callback, "Interval")(...[interval, count++, args].flat());}, delay);
			return interval;
		}
	};
	BDFDB.TimeUtils.timeout = function (callback, delay, ...args) {
		delay = parseFloat(delay);
		if (typeof callback != "function") return;
		else if (isNaN(delay) || typeof delay != "number" || delay < 1) {
			let immediate = setImmediate(_ => {BDFDB.TimeUtils.suppress(callback, "Immediate")(...[immediate, args].flat());});
			return immediate;
		}
		else {
			let timeout = setTimeout(_ => {BDFDB.TimeUtils.suppress(callback, "Timeout")(...[timeout, args].flat());}, delay);
			return timeout;
		}
	};
	BDFDB.TimeUtils.clear = function (...timeObjects) {
		for (let t of timeObjects.flat(10).filter(n => n)) {
			if (typeof t == "number") {
				clearInterval(t);
				clearTimeout(t);
			}
			else if (typeof t == "object") clearImmediate(t);
		}
	};
	BDFDB.TimeUtils.suppress = function (callback, string, name) {return function (...args) {
		try {return callback(...args);}
		catch (err) {BDFDB.LogUtils.error((typeof string == "string" && string || "") + " " + err, name);}
	}};

	BDFDB.LogUtils.log("Loading library.");

	BDFDB.sameProto = function (a, b) {
		if (a != null && typeof a == "object") return a.constructor && a.constructor.prototype && typeof a.constructor.prototype.isPrototypeOf == "function" && a.constructor.prototype.isPrototypeOf(b);
		else return typeof a == typeof b;
	};
	BDFDB.equals = function (mainA, mainB, sorted) {
		let i = -1;
		if (sorted === undefined || typeof sorted !== "boolean") sorted = false;
		return equal(mainA, mainB);
		function equal(a, b) {
			i++;
			let result = true;
			if (i > 1000) result = null;
			else {
				if (typeof a !== typeof b) result = false;
				else if (typeof a === "function") result = a.toString() == b.toString();
				else if (typeof a === "undefined") result = true;
				else if (typeof a === "symbol") result = true;
				else if (typeof a === "boolean") result = a == b;
				else if (typeof a === "string") result = a == b;
				else if (typeof a === "number") {
					if (isNaN(a) || isNaN(b)) result = isNaN(a) == isNaN(b);
					else result = a == b;
				}
				else if (!a && !b) result = true;
				else if (!a || !b) result = false;
				else if (typeof a === "object") {
					let keysA = Object.getOwnPropertyNames(a);
					let keysB = Object.getOwnPropertyNames(b);
					if (keysA.length !== keysB.length) result = false;
					else for (let j = 0; result === true && j < keysA.length; j++) {
						if (sorted) result = equal(a[keysA[j]], b[keysB[j]]);
						else result = equal(a[keysA[j]], b[keysA[j]]);
					}
				}
			}
			i--;
			return result;
		}
	};

	BDFDB.ObjectUtils = {};
	BDFDB.ObjectUtils.is = function (obj) {
		return obj && Object.prototype.isPrototypeOf(obj) && !Array.prototype.isPrototypeOf(obj);
	};
	BDFDB.ObjectUtils.get = function (nodeOrObj, valuePath) {
		if (!nodeOrObj || !valuePath) return null;
		let obj = Node.prototype.isPrototypeOf(nodeOrObj) ? BDFDB.ReactUtils.getInstance(nodeOrObj) : nodeOrObj;
		if (!BDFDB.ObjectUtils.is(obj)) return null;
		let found = obj, values = valuePath.split(".").filter(n => n);
		for (value of values) {
			if (!found) return null;
			found = found[value];
		}
		return found;
	};
	BDFDB.ObjectUtils.extract = function (obj, ...keys) {
		let newObj = {};
		if (BDFDB.ObjectUtils.is(obj)) for (let key of keys.flat(10).filter(n => n)) if (obj[key]) newObj[key] = obj[key];
		return newObj;
	};
	BDFDB.ObjectUtils.exclude = function (obj, ...keys) {
		let newObj = Object.assign({}, obj);
		BDFDB.ObjectUtils.delete(newObj, ...keys)
		return newObj;
	};
	BDFDB.ObjectUtils.delete = function (obj, ...keys) {
		if (BDFDB.ObjectUtils.is(obj)) for (let key of keys.flat(10).filter(n => n)) delete obj[key];
	};
	BDFDB.ObjectUtils.sort = function (obj, sort, except) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = {};
		if (sort === undefined || !sort) for (let key of Object.keys(obj).sort()) newObj[key] = obj[key];
		else {
			let values = [];
			for (let key in obj) values.push(obj[key]);
			values = BDFDB.ArrayUtils.keySort(values, sort, except);
			for (let value of values) for (let key in obj) if (BDFDB.equals(value, obj[key])) {
				newObj[key] = value;
				break;
			}
		}
		return newObj;
	};
	BDFDB.ObjectUtils.reverse = function (obj, sort) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = {};
		for (let key of (sort === undefined || !sort) ? Object.keys(obj).reverse() : Object.keys(obj).sort().reverse()) newObj[key] = obj[key];
		return newObj;
	};
	BDFDB.ObjectUtils.filter = function (obj, filter, byKey = false) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		if (typeof filter != "function") return obj;
		return Object.keys(obj).filter(key => filter(byKey ? key : obj[key])).reduce((newObj, key) => (newObj[key] = obj[key], newObj), {});
	};
	BDFDB.ObjectUtils.push = function (obj, value) {
		if (BDFDB.ObjectUtils.is(obj)) obj[Object.keys(obj).length] = value;
	};
	BDFDB.ObjectUtils.pop = function (obj, value) {
		if (BDFDB.ObjectUtils.is(obj)) {
			let keys = Object.keys(obj);
			if (!keys.length) return;
			let value = obj[keys[keys.length-1]];
			delete obj[keys[keys.length-1]];
			return value;
		}
	};
	BDFDB.ObjectUtils.map = function (obj, mapfunc) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		if (typeof mapfunc != "string" && typeof mapfunc != "function") return obj;
		let newObj = {};
		for (let key in obj) if (BDFDB.ObjectUtils.is(obj[key])) newObj[key] = typeof mapfunc == "string" ? obj[key][mapfunc] : mapfunc(obj[key], key);
		return newObj;
	};
	BDFDB.ObjectUtils.toArray = function (obj) {
		if (!BDFDB.ObjectUtils.is(obj)) return [];
		return Object.entries(obj).map(n => n[1]);
	};
	BDFDB.ObjectUtils.deepAssign = function (obj, ...objs) {
		if (!objs.length) return obj;
		let nextObj = objs.shift();
		if (BDFDB.ObjectUtils.is(obj) && BDFDB.ObjectUtils.is(nextObj)) {
			for (let key in nextObj) {
				if (BDFDB.ObjectUtils.is(nextObj[key])) {
					if (!obj[key]) Object.assign(obj, {[key]:{}});
					BDFDB.ObjectUtils.deepAssign(obj[key], nextObj[key]);
				}
				else Object.assign(obj, {[key]:nextObj[key]});
			}
		}
		return BDFDB.ObjectUtils.deepAssign(obj, ...objs);
	};
	BDFDB.ObjectUtils.isEmpty = function (obj) {
		return !BDFDB.ObjectUtils.is(obj) || Object.getOwnPropertyNames(obj).length == 0;
	};

	BDFDB.ArrayUtils = {};
	BDFDB.ArrayUtils.is = function (array) {
		return array && Array.isArray(array);
	};
	BDFDB.ArrayUtils.sum = function (array) {
		return Array.isArray(array) ? array.reduce((total, num) => total + Math.round(num), 0) : 0;
	};
	BDFDB.ArrayUtils.keySort = function (array, key, except) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		if (key == null) return array;
		if (except === undefined) except = null;
		return array.sort((x, y) => {
			let xValue = x[key], yValue = y[key];
			if (xValue !== except) return xValue < yValue ? -1 : xValue > yValue ? 1 : 0;
		});
	};
	BDFDB.ArrayUtils.numSort = function (array) {
		return array.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
	};
	BDFDB.ArrayUtils.includes = function (array, ...values) {
		if (!BDFDB.ArrayUtils.is(array)) return null;
		if (!array.length) return false;
		let all = values.pop();
		if (typeof all != "boolean") {
			values.push(all);
			all = true;
		}
		if (!values.length) return false;
		let contained = undefined;
		for (let v of values) {
			if (contained === undefined) contained = all;
			if (all && !array.includes(v)) contained = false;
			if (!all && array.includes(v)) contained = true;
		}
		return contained;
	};
	BDFDB.ArrayUtils.remove = function (array, value, all = false) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		if (!array.includes(value)) return array;
		if (!all) array.splice(array.indexOf(value), 1);
		else while (array.indexOf(value) > -1) array.splice(array.indexOf(value), 1);
		return array;
	};
	BDFDB.ArrayUtils.getAllIndexes = function (array, value) {
		if (!BDFDB.ArrayUtils.is(array) && typeof array != "string") return [];
		var indexes = [], index = -1;
		while ((index = array.indexOf(value, index + 1)) !== -1) indexes.push(index);
		return indexes;
	};
	BDFDB.ArrayUtils.removeCopies = function (array) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		return [...new Set(array)];
	};

	BDFDB.BDUtils = {};
	BDFDB.BDUtils.getPluginsFolder = function () {
		if (window.BdApi && BdApi.Plugins.folder && typeof BdApi.Plugins.folder == "string") return BdApi.Plugins.folder;
		else if (LibraryRequires.process.env.injDir) return LibraryRequires.path.resolve(LibraryRequires.process.env.injDir, "plugins/");
		else switch (LibraryRequires.process.platform) {
			case "win32":
				return LibraryRequires.path.resolve(LibraryRequires.process.env.appdata, "BetterDiscord/plugins/");
			case "darwin":
				return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, "Library/Preferences/BetterDiscord/plugins/");
			default:
				if (LibraryRequires.process.env.XDG_CONFIG_HOME) return LibraryRequires.path.resolve(LibraryRequires.process.env.XDG_CONFIG_HOME, "BetterDiscord/plugins/");
				else return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, ".config/BetterDiscord/plugins/");
			}
	};
	BDFDB.BDUtils.getThemesFolder = function () {
		if (window.BdApi && BdApi.Themes.folder && typeof BdApi.Themes.folder == "string") return BdApi.Themes.folder;
		else if (LibraryRequires.process.env.injDir) return LibraryRequires.path.resolve(LibraryRequires.process.env.injDir, "plugins/");
		else switch (LibraryRequires.process.platform) {
			case "win32": 
				return LibraryRequires.path.resolve(LibraryRequires.process.env.appdata, "BetterDiscord/themes/");
			case "darwin": 
				return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, "Library/Preferences/BetterDiscord/themes/");
			default:
				if (LibraryRequires.process.env.XDG_CONFIG_HOME) return LibraryRequires.path.resolve(LibraryRequires.process.env.XDG_CONFIG_HOME, "BetterDiscord/themes/");
				else return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, ".config/BetterDiscord/themes/");
			}
	};
	BDFDB.BDUtils.isPluginEnabled = function (pluginName) {
		if (!window.BdApi) return null;
		else if (BdApi.Plugins && typeof BdApi.Plugins.isEnabled == "function") return BdApi.Plugins.isEnabled(pluginName);
		else if (typeof BdApi.isPluginEnabled == "function") return BdApi.isPluginEnabled(pluginName);
	};
	BDFDB.BDUtils.reloadPlugin = function (pluginName) {
		if (!window.BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.reload == "function") BdApi.Plugins.reload(pluginName);
		else if (window.pluginModule) window.pluginModule.reloadPlugin(pluginName);
	};
	BDFDB.BDUtils.enablePlugin = function (pluginName) {
		if (!window.BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.enable == "function") BdApi.Plugins.enable(pluginName);
		else if (window.pluginModule) window.pluginModule.startPlugin(pluginName);
	};
	BDFDB.BDUtils.disablePlugin = function (pluginName) {
		if (!window.BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.disable == "function") BdApi.Plugins.disable(pluginName);
		else if (window.pluginModule) window.pluginModule.stopPlugin(pluginName);
	};
	BDFDB.BDUtils.getPlugin = function (pluginName, hasToBeEnabled = false, overHead = false) {
		if (window.BdApi && !hasToBeEnabled || BDFDB.BDUtils.isPluginEnabled(pluginName)) {	
			if (BdApi.Plugins.get && typeof BdApi.Plugins.get == "function") {
				let plugin = BdApi.Plugins.get(pluginName);
				if (overHead) return plugin ? {filename: LibraryRequires.fs.existsSync(LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), `${pluginName}.plugin.js`)) ? `${pluginName}.plugin.js` : null, id: pluginName, name: pluginName, plugin: plugin} : null;
				else return plugin;
			}
			else if (window.bdplugins) overHead ? window.bdplugins[pluginName] : (window.bdplugins[pluginName] || {}).plugin;
		}
		return null;
	};
	BDFDB.BDUtils.isThemeEnabled = function (themeName) {
		if (!window.BdApi) return null;
		else if (BdApi.Themes && typeof BdApi.Themes.isEnabled == "function") return BdApi.Themes.isEnabled(themeName);
		else if (typeof BdApi.isThemeEnabled == "function") return BdApi.isThemeEnabled(themeName);
	};
	BDFDB.BDUtils.enableTheme = function (themeName) {
		if (!window.BdApi) return;
		else if (BdApi.Themes && typeof BdApi.Themes.enable == "function") BdApi.Themes.enable(themeName);
		else if (window.themeModule) window.themeModule.enableTheme(themeName);
	};
	BDFDB.BDUtils.disableTheme = function (themeName) {
		if (!window.BdApi) return;
		else if (BdApi.Themes && typeof BdApi.Themes.disable == "function") BdApi.Themes.disable(themeName);
		else if (window.themeModule) window.themeModule.disableTheme(themeName);
	};
	BDFDB.BDUtils.getTheme = function (themeName, hasToBeEnabled = false) {
		if (window.BdApi && !hasToBeEnabled || BDFDB.BDUtils.isThemeEnabled(themeName)) {
			if (BdApi.Themes && typeof BdApi.Themes.get == "function") return BdApi.Themes.get(themeName);
			else if (window.bdthemes) window.bdthemes[themeName];
		}
		return null;
	};
	BDFDB.BDUtils.settingsIds = !isBeta ? {
		automaticLoading: "fork-ps-5",
		coloredText: "bda-gs-7",
		normalizedClasses: "fork-ps-4",
		showToasts: "fork-ps-2"
	} : {
		automaticLoading: "settings.addons.autoReload",
		coloredText: "settings.appearance.coloredText",
		normalizedClasses: "settings.general.classNormalizer",
		showToasts: "settings.general.showToasts"
	};
	BDFDB.BDUtils.toggleSettings = function (key, state) {
		if (window.BdApi && typeof key == "string") {
			let path = key.split(".");
			let currentState = BDFDB.BDUtils.getSettings(key);
			if (state === true) {
				if (currentState === false) BdApi.enableSetting(...path);
			}
			else if (state === false) {
				if (currentState === true) BdApi.disableSetting(...path);
			}
			else if (currentState === true || currentState === false) BDFDB.BDUtils.toggleSettings(key, !currentState);
		}
	};
	BDFDB.BDUtils.getSettings = function (key) {
		if (!window.BdApi) return {};
		if (typeof key == "string") return BdApi.isSettingEnabled(...key.split("."));
		else return oldSettings ? BDFDB.ReactUtils.getValue(BdApi.getBDData("settings"), `${BDFDB.DiscordUtils.getBuilt()}.settings`) : BdApi.settings.map(n => n.settings.map(m => m.settings.map(l => ({id: [n.id, m.id, l.id].join("."), value:l.value})))).flat(10).reduce((newObj, setting) => (newObj[setting.id] = setting.value, newObj), {});
	};
	
	
	BDFDB.PluginUtils = {};
	BDFDB.PluginUtils.buildPlugin = function (config) {
		return [Plugin(config), BDFDB];
	};
	BDFDB.PluginUtils.load = function (plugin) {
		if (!PluginStores.updateTimeout.includes(plugin.name)) {
			PluginStores.updateTimeout.push(plugin.name);
			let url = plugin.rawUrl ||`https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;

			if (!BDFDB.ObjectUtils.is(window.PluginUpdates) || !BDFDB.ObjectUtils.is(window.PluginUpdates.plugins)) window.PluginUpdates = {plugins: {}};
			window.PluginUpdates.plugins[url] = {name: plugin.name, raw: url, version: plugin.version};
			
			BDFDB.PluginUtils.checkUpdate(plugin.name, url);
			
			if (window.PluginUpdates.interval === undefined) window.PluginUpdates.interval = BDFDB.TimeUtils.interval(_ => {
				BDFDB.PluginUtils.checkAllUpdates();
			}, 1000*60*60*2);
			
			BDFDB.TimeUtils.timeout(_ => {BDFDB.ArrayUtils.remove(PluginStores.updateTimeout, plugin.name, true);}, 30000);
		}
	};
	BDFDB.PluginUtils.init = function (plugin) {
		BDFDB.PluginUtils.load(plugin);
		
		let startMsg = BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_started", "v" + plugin.version);
		BDFDB.LogUtils.log(startMsg, plugin.name);
		if (settings.showToasts && !BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts)) BDFDB.NotificationUtils.toast(`${plugin.name} ${startMsg}`, {nopointer: true});
		
		if (plugin.css) BDFDB.DOMUtils.appendLocalStyle(plugin.name, plugin.css);
		
		InternalBDFDB.patchPlugin(plugin);
		InternalBDFDB.addSpecialListeners(plugin);

		BDFDB.PluginUtils.translate(plugin);

		BDFDB.PluginUtils.checkChangeLog(plugin);
	};
	BDFDB.PluginUtils.clear = function (plugin) {
		let stopMsg = BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_stopped", "v" + plugin.version);
		BDFDB.LogUtils.log(stopMsg, plugin.name);
		if (settings.showToasts && !BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts)) BDFDB.NotificationUtils.toast(`${plugin.name} ${stopMsg}`, {nopointer: true});

		let url = plugin.rawUrl ||`https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;

		BDFDB.PluginUtils.cleanUp(plugin);
		
		for (let type in PluginStores.patchQueues) BDFDB.ArrayUtils.remove(PluginStores.patchQueues[type].query, plugin, true);
		
		for (let modal of document.querySelectorAll(`.${plugin.name}-modal, .${plugin.name.toLowerCase()}-modal, .${plugin.name}-settingsmodal, .${plugin.name.toLowerCase()}-settingsmodal`)) {
			let closeButton = modal.querySelector(BDFDB.dotCN.modalclose);
			if (closeButton) closeButton.click();
		}
		
		delete Cache.data[plugin.name]
		if (BDFDB.ObjectUtils.is(window.PluginUpdates) && BDFDB.ObjectUtils.is(window.PluginUpdates.plugins)) delete window.PluginUpdates.plugins[url];
	};
	BDFDB.PluginUtils.translate = function (plugin) {
		plugin.labels = {};
		if (typeof plugin.setLabelsByLanguage === "function" || typeof plugin.changeLanguageStrings === "function") {
			if (LibraryModules.LanguageStore.chosenLocale) translate();
			else BDFDB.TimeUtils.interval(interval => {
				if (LibraryModules.LanguageStore.chosenLocale) {
					BDFDB.TimeUtils.clear(interval);
					translate();
				}
			}, 100);
			function translate() {
				let language = BDFDB.LanguageUtils.getLanguage();
				if (typeof plugin.setLabelsByLanguage === "function") plugin.labels = plugin.setLabelsByLanguage(language.id);
				if (typeof plugin.changeLanguageStrings === "function") plugin.changeLanguageStrings();
				BDFDB.LogUtils.log(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_translated", language.ownlang), plugin.name);
			}
		}
	};
	BDFDB.PluginUtils.cleanUp = function (plugin) {
		BDFDB.TimeUtils.suppress(_ => {
			if (!BDFDB.ObjectUtils.is(plugin)) return;
			if (plugin == BDFDB) {
				delete window.BDFDB_Global.loaded;
				BDFDB.TimeUtils.interval((interval, count) => {
					if (count > 60 || window.BDFDB_Global.loaded) BDFDB.TimeUtils.clear(interval);
					if (window.BDFDB_Global.loaded) for (let pluginName in BDFDB_Global.ObjectUtils.sort(PluginStores.loaded)) BDFDB.TimeUtils.timeout(_ => {
						if (PluginStores.loaded[pluginName].started) BDFDB.BDUtils.reloadPlugin(pluginName);
					});
				}, 1000);
			}
			if (BDFDB.DOMUtils) BDFDB.DOMUtils.removeLocalStyle(plugin.name);
			if (BDFDB.ListenerUtils) BDFDB.ListenerUtils.remove(plugin);
			if (BDFDB.StoreChangeUtils) BDFDB.StoreChangeUtils.remove(plugin);
			if (BDFDB.ObserverUtils) BDFDB.ObserverUtils.disconnect(plugin);
			if (BDFDB.PatchUtils) BDFDB.PatchUtils.unpatch(plugin);
			if (BDFDB.WindowUtils) {
				BDFDB.WindowUtils.closeAll(plugin);
				BDFDB.WindowUtils.removeListener(plugin);
			}
		}, "Failed to clean up plugin!", plugin.name)();
	};
	BDFDB.PluginUtils.checkUpdate = function (pluginName, url) {
		if (pluginName && url && window.PluginUpdates.plugins[url]) return new Promise(callback => {
			LibraryRequires.request(url, (error, response, body) => {
				if (error || !window.PluginUpdates.plugins[url]) return callback(null);
				let newName = (body.match(/"name"\s*:\s*"([^"]+)"/) || [])[1] || pluginName;
				let newVersion = body.match(/['"][0-9]+\.[0-9]+\.[0-9]+['"]/i);
				if (!newVersion) return callback(null);
				if (pluginName == newName && BDFDB.NumberUtils.getVersionDifference(newVersion[0], window.PluginUpdates.plugins[url].version) > 0.2) {
					BDFDB.NotificationUtils.toast(`${pluginName} will be force updated, because your version is heavily outdated.`, {
						type: "warn",
						nopointer: true
					});
					BDFDB.PluginUtils.downloadUpdate(pluginName, url);
					return callback(2);
				}
				else if (BDFDB.NumberUtils.compareVersions(newVersion[0], window.PluginUpdates.plugins[url].version)) {
					window.PluginUpdates.plugins[url].outdated = true;
					BDFDB.PluginUtils.showUpdateNotice(pluginName, url);
					return callback(1);
				}
				else {
					BDFDB.PluginUtils.removeUpdateNotice(pluginName);
					return callback(0);
				}
			});
		});
		return new Promise(callback => {callback(null);});
	};
	BDFDB.PluginUtils.checkAllUpdates = function () {
		return new Promise(callback => {
			let finished = 0, amount = 0;
			for (let url in window.PluginUpdates.plugins) {
				let plugin = window.PluginUpdates.plugins[url];
				if (plugin) BDFDB.PluginUtils.checkUpdate(plugin.name, plugin.raw).then(state => {
					finished++;
					if (state == 1) amount++;
					if (finished >= Object.keys(window.PluginUpdates.plugins).length) callback(amount);
				});
			}
		});
	};
	BDFDB.PluginUtils.showUpdateNotice = function (pluginName, url) {
		if (!pluginName || !url) return;
		let updateNotice = document.querySelector("#pluginNotice");
		if (!updateNotice) {
			let vanishObserver = new MutationObserver(changes => {
				if (!document.contains(updateNotice)) {
					if (updateNotice.querySelector("#outdatedPlugins span")) {
						let layers = document.querySelector(BDFDB.dotCN.layers) || document.querySelector(BDFDB.dotCN.appmount);
						if (layers) layers.parentElement.insertBefore(updateNotice, layers);
					}
					else vanishObserver.disconnect();
				}
				else if (document.contains(updateNotice) && !updateNotice.querySelector("#outdatedPlugins span," + BDFDB.dotCN.noticebutton)) vanishObserver.disconnect();
			});
			vanishObserver.observe(document.body, {childList:true, subtree:true});
			updateNotice = BDFDB.NotificationUtils.notice(`${BDFDB.LanguageUtils.LibraryStrings.update_notice_update}&nbsp;&nbsp;&nbsp;&nbsp;<strong id="outdatedPlugins"></strong>`, {
				id:"pluginNotice",
				type:"info",
				html:true,
				btn:!BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.automaticLoading) ? BDFDB.LanguageUtils.LanguageStrings.ERRORS_RELOAD : "",
				customicon:`<svg height="100%" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="100%" version="1.1" viewBox="0 0 2000 2000"><metadata /><defs><filter id="shadow1"><feDropShadow dx="20" dy="0" stdDeviation="20" flood-color="rgba(0,0,0,0.35)"/></filter><filter id="shadow2"><feDropShadow dx="15" dy="0" stdDeviation="20" flood-color="rgba(255,255,255,0.15)"/></filter><filter id="shadow3"><feDropShadow dx="10" dy="0" stdDeviation="20" flood-color="rgba(0,0,0,0.35)"/></filter></defs><g><path style="filter: url(#shadow3)" d="M1195.44+135.442L1195.44+135.442L997.6+136.442C1024.2+149.742+1170.34+163.542+1193.64+179.742C1264.34+228.842+1319.74+291.242+1358.24+365.042C1398.14+441.642+1419.74+530.642+1422.54+629.642L1422.54+630.842L1422.54+632.042C1422.54+773.142+1422.54+1228.14+1422.54+1369.14L1422.54+1370.34L1422.54+1371.54C1419.84+1470.54+1398.24+1559.54+1358.24+1636.14C1319.74+1709.94+1264.44+1772.34+1193.64+1821.44C1171.04+1837.14+1025.7+1850.54+1000+1863.54L1193.54+1864.54C1539.74+1866.44+1864.54+1693.34+1864.54+1296.64L1864.54+716.942C1866.44+312.442+1541.64+135.442+1195.44+135.442Z" fill="#171717" opacity="1"/><path style="filter: url(#shadow2)" d="M1695.54+631.442C1685.84+278.042+1409.34+135.442+1052.94+135.442L361.74+136.442L803.74+490.442L1060.74+490.442C1335.24+490.442+1335.24+835.342+1060.74+835.342L1060.74+1164.84C1150.22+1164.84+1210.53+1201.48+1241.68+1250.87C1306.07+1353+1245.76+1509.64+1060.74+1509.64L361.74+1863.54L1052.94+1864.54C1409.24+1864.54+1685.74+1721.94+1695.54+1368.54C1695.54+1205.94+1651.04+1084.44+1572.64+999.942C1651.04+915.542+1695.54+794.042+1695.54+631.442Z" fill="#3E82E5" opacity="1"/><path style="filter: url(#shadow1)" d="M1469.25+631.442C1459.55+278.042+1183.05+135.442+826.65+135.442L135.45+135.442L135.45+1004C135.45+1004+135.427+1255.21+355.626+1255.21C575.825+1255.21+575.848+1004+575.848+1004L577.45+490.442L834.45+490.442C1108.95+490.442+1108.95+835.342+834.45+835.342L664.65+835.342L664.65+1164.84L834.45+1164.84C923.932+1164.84+984.244+1201.48+1015.39+1250.87C1079.78+1353+1019.47+1509.64+834.45+1509.64L135.45+1509.64L135.45+1864.54L826.65+1864.54C1182.95+1864.54+1459.45+1721.94+1469.25+1368.54C1469.25+1205.94+1424.75+1084.44+1346.35+999.942C1424.75+915.542+1469.25+794.042+1469.25+631.442Z" fill="#FFFFFF" opacity="1"/></g></svg>`,
				onClose: _ => {vanishObserver.disconnect();}
			});
			updateNotice.style.setProperty("z-index", "100000", "important");
			updateNotice.style.setProperty("display", "block", "important");
			updateNotice.style.setProperty("visibility", "visible", "important");
			updateNotice.style.setProperty("opacity", "1", "important");
			let reloadButton = updateNotice.querySelector(BDFDB.dotCN.noticebutton);
			if (reloadButton) {
				BDFDB.DOMUtils.toggle(reloadButton, true);
				reloadButton.addEventListener("click", _ => {
					LibraryRequires.electron.remote.getCurrentWindow().reload();
				});
				reloadButton.addEventListener("mouseenter", _ => {
					if (window.PluginUpdates.downloaded) BDFDB.TooltipUtils.create(reloadButton, window.PluginUpdates.downloaded.join(", "), {type:"bottom", selector:"update-notice-tooltip", style: "max-width: 420px"});
				});
			}
		}
		if (updateNotice) {
			let updateNoticeList = updateNotice.querySelector("#outdatedPlugins");
			if (updateNoticeList && !updateNoticeList.querySelector(`#${pluginName}-notice`)) {
				if (updateNoticeList.querySelector("span")) updateNoticeList.appendChild(BDFDB.DOMUtils.create(`<span class="separator">, </span>`));
				let updateEntry = BDFDB.DOMUtils.create(`<span id="${pluginName}-notice">${pluginName}</span>`);
				updateEntry.addEventListener("click", _ => {
					if (!updateEntry.wasClicked) {
						updateEntry.wasClicked = true;
						BDFDB.PluginUtils.downloadUpdate(pluginName, url);
					}
				});
				updateNoticeList.appendChild(updateEntry);
				if (!updateNoticeList.hasTooltip) {
					updateNoticeList.hasTooltip = true;
					updateNotice.tooltip = BDFDB.TooltipUtils.create(updateNoticeList, BDFDB.LanguageUtils.LibraryStrings.update_notice_click, {
						type: "bottom",
						zIndex: 100001,
						delay: 500,
						onHide: _ => {updateNoticeList.hasTooltip = false;}
					});
				}
			}
		}
	};
	BDFDB.PluginUtils.removeUpdateNotice = function (pluginName, updateNotice = document.querySelector("#pluginNotice")) {
		if (!pluginName || !updateNotice) return;
		let updateNoticeList = updateNotice.querySelector("#outdatedPlugins");
		if (updateNoticeList) {
			let noticeEntry = updateNoticeList.querySelector(`#${pluginName}-notice`);
			if (noticeEntry) {
				let nextSibling = noticeEntry.nextSibling;
				let prevSibling = noticeEntry.prevSibling;
				if (nextSibling && BDFDB.DOMUtils.containsClass(nextSibling, "separator")) nextSibling.remove();
				else if (prevSibling && BDFDB.DOMUtils.containsClass(prevSibling, "separator")) prevSibling.remove();
				noticeEntry.remove();
			}
			if (!updateNoticeList.querySelector("span")) {
				let reloadButton = updateNotice.querySelector(BDFDB.dotCN.noticebutton);
				if (reloadButton) {
					updateNotice.querySelector(".notice-message").innerText = BDFDB.LanguageUtils.LibraryStrings.update_notice_reload;
					BDFDB.DOMUtils.toggle(reloadButton, false);
				}
				else updateNotice.querySelector(BDFDB.dotCN.noticedismiss).click();
			}
		}
	};
	BDFDB.PluginUtils.downloadUpdate = function (pluginName, url) {
		if (pluginName && url) LibraryRequires.request(url, (error, response, body) => {
			if (error) {
				let updateNotice = document.querySelector("#pluginNotice");
				if (updateNotice) BDFDB.PluginUtils.removeUpdateNotice(pluginName, updateNotice);
				BDFDB.LogUtils.warn("Unable to get update for " + pluginName);
			}
			else {
				let wasEnabled = BDFDB.BDUtils.isPluginEnabled(pluginName);
				let newName = (body.match(/"name"\s*:\s*"([^"]+)"/) || [])[1] || pluginName;
				let newVersion = body.match(/['"][0-9]+\.[0-9]+\.[0-9]+['"]/i).toString().replace(/['"]/g, "");
				let oldVersion = window.PluginUpdates.plugins[url].version;
				let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
				let newFileName = newName == "BDFDB" ? "0BDFDB" : newName;
				LibraryRequires.fs.writeFile(LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), newFileName + ".plugin.js"), body, _ => {
					if (fileName != newFileName) {
						url = url.replace(new RegExp(fileName, "g"), newFileName);
						LibraryRequires.fs.unlink(LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".plugin.js"), _ => {});
						let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
						LibraryRequires.fs.exists(configPath, exists => {
							if (exists) LibraryRequires.fs.rename(configPath, LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), newFileName + ".config.json"), _ => {});
						});
						BDFDB.TimeUtils.timeout(_ => {if (wasEnabled && !BDFDB.BDUtils.isPluginEnabled(newName)) BDFDB.BDUtils.enablePlugin(newName);}, 3000);
					}
					BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_updated", pluginName, "v" + oldVersion, newName, "v" + newVersion), {nopointer:true, selector:"plugin-updated-toast"});
					let updateNotice = document.querySelector("#pluginNotice");
					if (updateNotice) {
						if (updateNotice.querySelector(BDFDB.dotCN.noticebutton)) {
							window.PluginUpdates.plugins[url].version = newVersion;
							if (!window.PluginUpdates.downloaded) window.PluginUpdates.downloaded = [];
							if (!window.PluginUpdates.downloaded.includes(pluginName)) window.PluginUpdates.downloaded.push(pluginName);
						}
						BDFDB.PluginUtils.removeUpdateNotice(pluginName, updateNotice);
					}
				});
			}
		});
	};
	BDFDB.PluginUtils.checkChangeLog = function (plugin) {
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.changeLog)) return;
		// REMOVE 14.11.2020
		let changeLog = BDFDB.DataUtils.load(plugin, "changeLog");
		if (changeLog && changeLog.version) {
			BDFDB.DataUtils.remove(plugin, "changelog");
			BDFDB.DataUtils.remove(plugin, "changeLog");
			changeLogs[plugin.name] = changeLog.version;
		}
		if (!changeLogs[plugin.name] || BDFDB.NumberUtils.compareVersions(plugin.version, changeLogs[plugin.name])) {
			changeLogs[plugin.name] = plugin.version;
			BDFDB.DataUtils.save(changeLogs, BDFDB, "changeLogs");
			BDFDB.PluginUtils.openChangeLog(plugin);
		}
	};
	BDFDB.PluginUtils.openChangeLog = function (plugin) {
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.changeLog)) return;
		let changeLogHTML = "", headers = {
			added: "New Features",
			fixed: "Bug Fixes",
			improved: "Improvements",
			progress: "Progress"
		};
		for (let type in plugin.changeLog) {
			type = type.toLowerCase();
			let className = BDFDB.disCN["changelog" + type];
			if (className) {
				changeLogHTML += `<h1 class="${className} ${BDFDB.disCN.margintop20}"${changeLogHTML.indexOf("<h1") == -1 ? `style="margin-top: 0px !important;"` : ""}>${headers[type]}</h1><ul>`;
				for (let key in plugin.changeLog[type]) changeLogHTML += `<li><strong>${key}</strong>${plugin.changeLog[type][key] ? (": " + plugin.changeLog[type][key] + ".") : ""}</li>`;
				changeLogHTML += `</ul>`
			}
		}
		if (changeLogHTML) BDFDB.ModalUtils.open(plugin, {
			header: `${plugin.name} ${BDFDB.LanguageUtils.LanguageStrings.CHANGE_LOG}`,
			subheader: `Version ${plugin.version}`,
			className: BDFDB.disCN.modalchangelogmodal,
			contentClassName: BDFDB.disCNS.changelogcontainer + BDFDB.disCN.modalminicontent,
			footerDirection: InternalComponents.LibraryComponents.Flex.Direction.HORIZONTAL,
			children: BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(changeLogHTML)),
			footerChildren: (plugin == BDFDB || plugin == libraryInstance || PluginStores.loaded[plugin.name] && PluginStores.loaded[plugin.name] == plugin && plugin.author == "DevilBro") && BDFDB.ReactUtils.createElement("div", {
				className: BDFDB.disCN.changelogfooter,
				children: [
					{href: "https://www.paypal.me/MircoWittrien", name: "PayPal", icon: "PAYPAL"},
					{href: "https://www.patreon.com/MircoWittrien", name: "Patreon", icon: "PATREON"}
				].map(data => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Anchor, {
					className: BDFDB.disCN.changelogsociallink,
					href: data.href,
					children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
						text: data.name,
						children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
							name: InternalComponents.LibraryComponents.SvgIcon.Names[data.icon],
							width: 16,
							height: 16
						})
					})
				})).concat(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
					size: InternalComponents.LibraryComponents.TextElement.Sizes.SIZE_12,
					children: BDFDB.LanguageUtils.LibraryStrings.donate_message
				}))
			})
		});
	};
	BDFDB.PluginUtils.addLoadingIcon = function (icon) {
		if (!Node.prototype.isPrototypeOf(icon)) return;
		let app = document.querySelector(BDFDB.dotCN.app);
		if (!app) return;
		BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.loadingicon);
		let loadingIconWrapper = document.querySelector(BDFDB.dotCN.app + ">" + BDFDB.dotCN.loadingiconwrapper)
		if (!loadingIconWrapper) {
			loadingIconWrapper = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCN.loadingiconwrapper}"></div>`);
			app.appendChild(loadingIconWrapper);
			let killObserver = new MutationObserver(changes => {if (!loadingIconWrapper.firstElementChild) BDFDB.DOMUtils.remove(loadingIconWrapper);});
			killObserver.observe(loadingIconWrapper, {childList:true});
		}
		loadingIconWrapper.appendChild(icon);
	};
	BDFDB.PluginUtils.createSettingsPanel = function (plugin, children) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || !children || (!BDFDB.ReactUtils.isValidElement(children) && !BDFDB.ArrayUtils.is(children))) return;
		let settingsPanel = BDFDB.DOMUtils.create(`<div class="${plugin.name}-settings ${BDFDB.disCN.settingspanel}"></div>`);
		BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsPanel, {
			key: `${plugin.name}-settingsPanel`,
			plugin: plugin,
			title: !isBeta && plugin.name,
			children: children
		}), settingsPanel);
		return settingsPanel;
	};
	BDFDB.PluginUtils.refreshSettingsPanel = function (plugin, settingsPanel, ...args) {
		if (!BDFDB.ObjectUtils.is(plugin) || typeof plugin.getSettingsPanel != "function" || !Node.prototype.isPrototypeOf(settingsPanel) || !settingsPanel.parentElement) return;
		settingsPanel.parentElement.appendChild(plugin.getSettingsPanel(...args));
		settingsPanel.remove();
	};
	InternalBDFDB.addSpecialListeners = function (plugin) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (BDFDB.ObjectUtils.is(plugin)) {
			if (typeof plugin.onSwitch === "function") {
				let spacer = document.querySelector(`${BDFDB.dotCN.guildswrapper} ~ * > ${BDFDB.dotCN.chatspacer}`);
				if (spacer) {
					let noChannelObserver = new MutationObserver(changes => {changes.forEach(change => {
						if (change.target && BDFDB.DOMUtils.containsClass(change.target, BDFDB.disCN.nochannel)) plugin.onSwitch();
					});});
					BDFDB.ObserverUtils.connect(plugin, spacer.querySelector(BDFDB.dotCNC.chat + BDFDB.dotCN.nochannel), {name:"switchFixNoChannelObserver", instance:noChannelObserver}, {attributes: true});
					let spacerObserver = new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(node => {
						if (BDFDB.DOMUtils.containsClass(node, BDFDB.disCN.chat, BDFDB.disCN.nochannel, false)) {
							BDFDB.ObserverUtils.connect(plugin, node, {name:"switchFixNoChannelObserver", instance:noChannelObserver}, {attributes: true});
						}
					});}});});
					BDFDB.ObserverUtils.connect(plugin, spacer, {name:"switchFixSpacerObserver", instance:spacerObserver}, {childList: true});
				}
			}
			InternalBDFDB.addContextListeners(plugin);
		}
	};

	window.BDFDB_Global = Object.assign({
		started: true,
		loading: true,
		PluginUtils: {
			buildPlugin: BDFDB.PluginUtils.buildPlugin,
			cleanUp: BDFDB.PluginUtils.cleanUp
		}
	}, config, window.BDFDB_Global);

	
	const loadLibrary = tryAgain => {
		require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/_res/BDFDB.raw.css", (error, response, body) => {
			if ((error || !body) && tryAgain) return BDFDB.TimeUtils.timeout(_ => {loadLibrary();}, 10000);
			const css = body;
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/_res/BDFDB.data.json", BDFDB.TimeUtils.suppress((error2, response2, body2) => {
				if ((error2 || !body2) && tryAgain) return BDFDB.TimeUtils.timeout(_ => {loadLibrary();}, 10000);
				const InternalData = JSON.parse(body2);
			
				BDFDB.ObserverUtils = {};
				BDFDB.ObserverUtils.connect = function (plugin, eleOrSelec, observer, config = {childList: true}) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !eleOrSelec || !observer) return;
					if (BDFDB.ObjectUtils.isEmpty(plugin.observers)) plugin.observers = {};
					if (!BDFDB.ArrayUtils.is(plugin.observers[observer.name])) plugin.observers[observer.name] = [];
					if (!observer.multi) for (let subinstance of plugin.observers[observer.name]) subinstance.disconnect();
					if (observer.instance) plugin.observers[observer.name].push(observer.instance);
					let instance = plugin.observers[observer.name][plugin.observers[observer.name].length - 1];
					if (instance) {
						let node = Node.prototype.isPrototypeOf(eleOrSelec) ? eleOrSelec : typeof eleOrSelec === "string" ? document.querySelector(eleOrSelec) : null;
						if (node) instance.observe(node, config);
					}
				};
				BDFDB.ObserverUtils.disconnect = function (plugin, observer) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (BDFDB.ObjectUtils.is(plugin) && !BDFDB.ObjectUtils.isEmpty(plugin.observers)) {
						let observername = typeof observer == "string" ? observer : (BDFDB.ObjectUtils.is(observer) ? observer.name : null);
						if (!observername) {
							for (let observer in plugin.observers) for (let instance of plugin.observers[observer]) instance.disconnect();
							delete plugin.observers;
						}
						else if (!BDFDB.ArrayUtils.is(plugin.observers[observername])) {
							for (let instance of plugin.observers[observername]) instance.disconnect();
							delete plugin.observers[observername];
						}
					}
				};

				BDFDB.StoreChangeUtils = {};
				BDFDB.StoreChangeUtils.add = function (plugin, store, callback) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(store) || typeof store.addChangeListener != "function" ||  typeof callback != "function") return;
					BDFDB.StoreChangeUtils.remove(plugin, store, callback);
					if (!BDFDB.ArrayUtils.is(plugin.changeListeners)) plugin.changeListeners = [];
					plugin.changeListeners.push({store, callback});
					store.addChangeListener(callback);
				};
				BDFDB.StoreChangeUtils.remove = function (plugin, store, callback) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.changeListeners)) return;
					if (!store) {
						while (plugin.changeListeners.length) {
							let listener = plugin.changeListeners.pop();
							listener.store.removeChangeListener(listener.callback);
						}
					}
					else if (BDFDB.ObjectUtils.is(store) && typeof store.addChangeListener == "function") {
						if (!callback) {
							for (let listener of plugin.changeListeners) {
								let removedListeners = [];
								if (listener.store == store) {
									listener.store.removeChangeListener(listener.callback);
									removedListeners.push(listener);
								}
								if (removedListeners.length) plugin.changeListeners = plugin.changeListeners.filter(listener => !removedListeners.includes(listener));
							}
						}
						else if (typeof callback == "function") {
							store.removeChangeListener(callback);
							plugin.changeListeners = plugin.changeListeners.filter(listener => listener.store == store && listener.callback == callback);
						}
					}
				};

				var pressedKeys = [], mousePosition;
				BDFDB.ListenerUtils = {};
				BDFDB.ListenerUtils.isPressed = function (key) {
					return pressedKeys.includes(key);
				};
				BDFDB.ListenerUtils.getPosition = function (key) {
					return mousePosition;
				};
				BDFDB.ListenerUtils.add = function (plugin, ele, actions, selectorOrCallback, callbackOrNothing) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || (!Node.prototype.isPrototypeOf(ele) && ele !== window) || !actions) return;
					let callbackIs4th = typeof selectorOrCallback == "function";
					let selector = callbackIs4th ? undefined : selectorOrCallback;
					let callback = callbackIs4th ? selectorOrCallback : callbackOrNothing;
					if (typeof callback != "function") return;
					BDFDB.ListenerUtils.remove(plugin, ele, actions, selector);
					for (let action of actions.split(" ")) {
						action = action.split(".");
						let eventName = action.shift().toLowerCase();
						if (!eventName) return;
						let origEventName = eventName;
						eventName = eventName == "mouseenter" || eventName == "mouseleave" ? "mouseover" : eventName;
						let namespace = (action.join(".") || "") + plugin.name;
						if (!BDFDB.ArrayUtils.is(plugin.eventListeners)) plugin.eventListeners = [];
						let eventCallback = null;
						if (selector) {
							if (origEventName == "mouseenter" || origEventName == "mouseleave") {
								eventCallback = e => {
									for (let child of e.path) if (typeof child.matches == "function" && child.matches(selector) && !child[namespace + "BDFDB" + origEventName]) {
										child[namespace + "BDFDB" + origEventName] = true;
										if (origEventName == "mouseenter") callback(BDFDB.ListenerUtils.copyEvent(e, child));
										let mouseout = e2 => {
											if (e2.target.contains(child) || e2.target == child || !child.contains(e2.target)) {
												if (origEventName == "mouseleave") callback(BDFDB.ListenerUtils.copyEvent(e, child));
												delete child[namespace + "BDFDB" + origEventName];
												document.removeEventListener("mouseout", mouseout);
											}
										};
										document.addEventListener("mouseout", mouseout);
										break;
									}
								};
							}
							else {
								eventCallback = e => {
									for (let child of e.path) if (typeof child.matches == "function" && child.matches(selector)) {
										callback(BDFDB.ListenerUtils.copyEvent(e, child));
										break;
									}
								};
							}
						}
						else eventCallback = e => {callback(BDFDB.ListenerUtils.copyEvent(e, ele));};

						plugin.eventListeners.push({ele, eventName, origEventName, namespace, selector, eventCallback});
						ele.addEventListener(eventName, eventCallback, true);
					}
				};
				BDFDB.ListenerUtils.remove = function (plugin, ele, actions = "", selector) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.eventListeners)) return;
					if (!ele) {
						while (plugin.eventListeners.length) {
							let listener = plugin.eventListeners.pop();
							listener.ele.removeEventListener(listener.eventName, listener.eventCallback, true);
						}
					}
					else if (Node.prototype.isPrototypeOf(ele) || ele === window) {
						for (let action of actions.split(" ")) {
							action = action.split(".");
							let eventName = action.shift().toLowerCase();
							let namespace = (action.join(".") || "") + plugin.name;
							for (let listener of plugin.eventListeners) {
								let removedListeners = [];
								if (listener.ele == ele && (!eventName || listener.origEventName == eventName) && listener.namespace == namespace && (selector === undefined || listener.selector == selector)) {
									listener.ele.removeEventListener(listener.eventName, listener.eventCallback, true);
									removedListeners.push(listener);
								}
								if (removedListeners.length) plugin.eventListeners = plugin.eventListeners.filter(listener => !removedListeners.includes(listener));
							}
						}
					}
				};
				BDFDB.ListenerUtils.multiAdd = function (node, actions, callback) {
					if (!Node.prototype.isPrototypeOf(node) || !actions || typeof callback != "function") return;
					for (let action of actions.trim().split(" ").filter(n => n)) node.addEventListener(action, callback, true);
				};
				BDFDB.ListenerUtils.multiRemove = function (node, actions, callback) {
					if (!Node.prototype.isPrototypeOf(node) || !actions || typeof callback != "function") return;
					for (let action of actions.trim().split(" ").filter(n => n)) node.removeEventListener(action, callback, true);
				};
				BDFDB.ListenerUtils.addToChildren = function (node, actions, selector, callback) {
					if (!Node.prototype.isPrototypeOf(node) || !actions || !selector || !selector.trim() || typeof callback != "function") return;
					for (let action of actions.trim().split(" ").filter(n => n)) {
						let eventCallback = callback;
						if (action == "mouseenter" || action == "mouseleave") eventCallback = e => {if (e.target.matches(selector)) callback(e);};
						node.querySelectorAll(selector.trim()).forEach(child => {child.addEventListener(action, eventCallback, true);});
					}
				};
				BDFDB.ListenerUtils.copyEvent = function (e, ele) {
					if (!e || !e.constructor || !e.type) return e;
					let eCopy = new e.constructor(e.type, e);
					Object.defineProperty(eCopy, "originalEvent", {value: e});
					Object.defineProperty(eCopy, "which", {value: e.which});
					Object.defineProperty(eCopy, "keyCode", {value: e.keyCode});
					Object.defineProperty(eCopy, "path", {value: e.path});
					Object.defineProperty(eCopy, "relatedTarget", {value: e.relatedTarget});
					Object.defineProperty(eCopy, "srcElement", {value: e.srcElement});
					Object.defineProperty(eCopy, "target", {value: e.target});
					Object.defineProperty(eCopy, "toElement", {value: e.toElement});
					if (ele) Object.defineProperty(eCopy, "currentTarget", {value: ele});
					return eCopy;
				};
				BDFDB.ListenerUtils.stopEvent = function (e) {
					if (BDFDB.ObjectUtils.is(e)) {
						if (typeof e.preventDefault == "function") e.preventDefault();
						if (typeof e.stopPropagation == "function") e.stopPropagation();
						if (typeof e.stopImmediatePropagation == "function") e.stopImmediatePropagation();
						if (BDFDB.ObjectUtils.is(e.originalEvent)) {
							if (typeof e.originalEvent.preventDefault == "function") e.originalEvent.preventDefault();
							if (typeof e.originalEvent.stopPropagation == "function") e.originalEvent.stopPropagation();
							if (typeof e.originalEvent.stopImmediatePropagation == "function") e.originalEvent.stopImmediatePropagation();
						}
					}
				};
			
				var NotificationBars = [], DesktopNotificationQueue = {queue:[], running:false};
				BDFDB.NotificationUtils = {};
				BDFDB.NotificationUtils.toast = function (text, options = {}) {
					let toasts = document.querySelector(".toasts, .bd-toasts");
					if (!toasts) {
						let channels = document.querySelector(BDFDB.dotCN.channels + " + div");
						let channelRects = channels ? BDFDB.DOMUtils.getRects(channels) : null;
						let members = channels ? channels.querySelector(BDFDB.dotCN.memberswrap) : null;
						let left = channelRects ? channelRects.left : 310;
						let width = channelRects ? (members ? channelRects.width - BDFDB.DOMUtils.getRects(members).width : channelRects.width) : window.outerWidth - 0;
						let form = channels ? channels.querySelector("form") : null;
						let bottom = form ? BDFDB.DOMUtils.getRects(form).height : 80;
						toasts = BDFDB.DOMUtils.create(`<div class="toasts bd-toasts" style="width:${width}px; left:${left}px; bottom:${bottom}px;"></div>`);
						(document.querySelector(BDFDB.dotCN.app) || document.body).appendChild(toasts);
					}
					const {type = "", icon = true, timeout = 3000, html = false, selector = "", nopointer = false, color = ""} = options;
					let toast = BDFDB.DOMUtils.create(`<div class="toast bd-toast">${html === true ? text : BDFDB.StringUtils.htmlEscape(text)}</div>`);
					if (type) {
						BDFDB.DOMUtils.addClass(toast, "toast-" + type);
						if (icon) BDFDB.DOMUtils.addClass(toast, "icon");
					}
					else if (color) {
						let rgbColor = BDFDB.ColorUtils.convert(color, "RGB");
						if (rgbColor) {
							toast.style.setProperty("background-color", rgbColor);
							BDFDB.DOMUtils.addClass(toast, "toast-custom");
						}
					}
					BDFDB.DOMUtils.addClass(toast, selector);
					toasts.appendChild(toast);
					toast.close = _ => {
						if (document.contains(toast)) {
							BDFDB.DOMUtils.addClass(toast, "closing");
							toast.style.setProperty("pointer-events", "none", "important");
							BDFDB.TimeUtils.timeout(_ => {
								toast.remove();
								if (!toasts.querySelectorAll(".toast, .bd-toast").length) toasts.remove();
							}, 3000);
						}
					};
					if (nopointer) toast.style.setProperty("pointer-events", "none", "important");
					else toast.addEventListener("click", toast.close);
					BDFDB.TimeUtils.timeout(_ => {toast.close();}, timeout > 0 ? timeout : 600000);
					return toast;
				};
				BDFDB.NotificationUtils.desktop = function (parsedcontent, parsedoptions = {}) {
					const queue = _ => {
						DesktopNotificationQueue.queue.push({parsedcontent, parsedoptions});
						runqueue();
					};
					const runqueue = _ => {
						if (!DesktopNotificationQueue.running) {
							let notification = DesktopNotificationQueue.queue.shift();
							if (notification) notify(notification.parsedcontent, notification.parsedoptions);
						}
					};
					const notify = (content, options) => {
						DesktopNotificationQueue.running = true;
						let muted = options.silent;
						options.silent = options.silent || options.sound ? true : false;
						let notification = new Notification(content, options);
						let audio = new Audio();
						let timeout = BDFDB.TimeUtils.timeout(_ => {close();}, options.timeout ? options.timeout : 3000);
						if (typeof options.click == "function") notification.onclick = _ => {
							BDFDB.TimeUtils.clear(timeout);
							close();
							options.click();
						};
						if (!muted && options.sound) {
							audio.src = options.sound;
							audio.play();
						}
						const close = _ => {
							audio.pause();
							notification.close();
							DesktopNotificationQueue.running = false;
							BDFDB.TimeUtils.timeout(_ => {runqueue();}, 1000);
						};
					};
					if (!("Notification" in window)) {}
					else if (Notification.permission === "granted") queue();
					else if (Notification.permission !== "denied") Notification.requestPermission(function (response) {if (response === "granted") queue();});
				};
				BDFDB.NotificationUtils.notice = function (text, options = {}) {
					if (!text) return;
					let layers = document.querySelector(BDFDB.dotCN.layers) || document.querySelector(BDFDB.dotCN.appmount);
					if (!layers) return;
					let id = BDFDB.NumberUtils.generateId(NotificationBars);
					let notice = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCNS.notice + BDFDB.disCN.noticewrapper}" notice-id="${id}"><div class="${BDFDB.disCN.noticedismiss}" style="width: 36px !important; height: 36px !important; position: absolute !important; top: 0 !important; right: 0 !important; left: unset !important;"></div><span class="notice-message"></span></div>`);
					layers.parentElement.insertBefore(notice, layers);
					let noticeMessage = notice.querySelector(".notice-message");
					if (options.platform) for (let platform of options.platform.split(" ")) if (DiscordClasses["noticeicon" + platform]) {
						let icon = BDFDB.DOMUtils.create(`<i class="${BDFDB.disCN["noticeicon" + platform]}"></i>`);
						BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.noticeplatformicon);
						BDFDB.DOMUtils.removeClass(icon, BDFDB.disCN.noticeicon);
						notice.insertBefore(icon, noticeMessage);
					}
					if (options.customicon) {
						let iconinner = BDFDB.DOMUtils.create(options.customicon)
						let icon = BDFDB.DOMUtils.create(`<i></i>`);
						if (iconinner.tagName == "span" && !iconinner.firstElementChild) icon.style.setProperty("background", `url(${options.customicon}) center/cover no-repeat`);
						else icon.appendChild(iconinner);
						BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.noticeplatformicon);
						BDFDB.DOMUtils.removeClass(icon, BDFDB.disCN.noticeicon);
						notice.insertBefore(icon, noticeMessage);
					}
					if (options.btn || options.button) notice.appendChild(BDFDB.DOMUtils.create(`<button class="${BDFDB.disCN.noticebutton}">${options.btn || options.button}</button>`));
					if (options.id) notice.id = options.id.split(" ").join("");
					if (options.selector) BDFDB.DOMUtils.addClass(notice, options.selector);
					if (options.css) BDFDB.DOMUtils.appendLocalStyle("BDFDBcustomNotificationBar" + id, options.css);
					if (options.style) notice.style = options.style;
					if (options.html === true) noticeMessage.innerHTML = text;
					else {
						let link = document.createElement("a");
						let newText = [];
						for (let word of text.split(" ")) {
							let encodedWord = BDFDB.StringUtils.htmlEscape(word);
							link.href = word;
							newText.push(link.host && link.host !== window.location.host ? `<label class="${BDFDB.disCN.noticetextlink}">${encodedWord}</label>` : encodedWord);
						}
						noticeMessage.innerHTML = newText.join(" ");
					}
					let type = null;
					if (options.type && !document.querySelector(BDFDB.dotCNS.chatbase + BDFDB.dotCN.noticestreamer)) {
						if (type = BDFDB.disCN["notice" + options.type]) BDFDB.DOMUtils.addClass(notice, type);
						if (options.type == "premium") {
							let noticeButton = notice.querySelector(BDFDB.dotCN.noticebutton);
							if (noticeButton) BDFDB.DOMUtils.addClass(noticeButton, BDFDB.disCN.noticepremiumaction);
							BDFDB.DOMUtils.addClass(noticeMessage, BDFDB.disCN.noticepremiumtext);
							notice.insertBefore(BDFDB.DOMUtils.create(`<i class="${BDFDB.disCN.noticepremiumlogo}"></i>`), noticeMessage);
						}
					}
					if (!type) {
						let comp = BDFDB.ColorUtils.convert(options.color, "RGBCOMP");
						if (comp) {
							let fontColor = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? "#000" : "#FFF";
							let backgroundcolor = BDFDB.ColorUtils.convert(comp, "HEX");
							let filter = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? "brightness(0%)" : "brightness(100%)";
							BDFDB.DOMUtils.appendLocalStyle("BDFDBcustomNotificationBarColorCorrection" + id, `${BDFDB.dotCN.noticewrapper}[notice-id="${id}"]{background-color:${backgroundcolor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] .notice-message {color:${fontColor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticebutton} {color:${fontColor} !important;border-color:${BDFDB.ColorUtils.setAlpha(fontColor, 0.25, "RGBA")} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticebutton}:hover {color:${backgroundcolor} !important;background-color:${fontColor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticedismiss} {filter:${filter} !important;}`);
						}
						else BDFDB.DOMUtils.addClass(notice, BDFDB.disCN.noticedefault);
					}
					notice.style.setProperty("height", "36px", "important");
					notice.style.setProperty("min-width", "70vw", "important");
					notice.style.setProperty("left", "unset", "important");
					notice.style.setProperty("right", "unset", "important");
					let sideMargin = ((BDFDB.DOMUtils.getWidth(document.body.firstElementChild) - BDFDB.DOMUtils.getWidth(notice))/2);
					notice.style.setProperty("left", `${sideMargin}px`, "important");
					notice.style.setProperty("right", `${sideMargin}px`, "important");
					notice.style.setProperty("min-width", "unset", "important");
					notice.style.setProperty("width", "unset", "important");
					notice.style.setProperty("max-width", `calc(100vw - ${sideMargin*2}px)`, "important");
					notice.querySelector(BDFDB.dotCN.noticedismiss).addEventListener("click", _ => {
						notice.style.setProperty("overflow", "hidden", "important");
						notice.style.setProperty("height", "0px", "important");
						if (notice.tooltip && typeof notice.tooltip.removeTooltip == "function") notice.tooltip.removeTooltip();
						BDFDB.TimeUtils.timeout(_ => {
							if (typeof options.onClose == "function") options.onClose();
							BDFDB.ArrayUtils.remove(NotificationBars, id);
							BDFDB.DOMUtils.removeLocalStyle("BDFDBcustomNotificationBar" + id);
							BDFDB.DOMUtils.removeLocalStyle("BDFDBcustomNotificationBarColorCorrection" + id);
							BDFDB.DOMUtils.remove(notice);
						}, 500);
					});
					return notice;
				};
				BDFDB.NotificationUtils.alert = function (header, body) {
					if (typeof header == "string" && typeof header == "string" && window.BdApi && typeof BdApi.alert == "function") BdApi.alert(header, body);
				};

				var Tooltips = [];
				BDFDB.TooltipUtils = {};
				BDFDB.TooltipUtils.create = function (anker, text, options = {}) {
					let itemLayerContainer = document.querySelector(BDFDB.dotCN.appmount +  " > " + BDFDB.dotCN.itemlayercontainer);
					if (!itemLayerContainer || !Node.prototype.isPrototypeOf(anker) || !document.contains(anker)) return null;
					text = typeof text == "function" ? text() : text;
					if (typeof text != "string" && !BDFDB.ReactUtils.isValidElement(text) && !BDFDB.ObjectUtils.is(options.guild)) return null;
					let id = BDFDB.NumberUtils.generateId(Tooltips);
					let zIndexed = typeof options.zIndex == "number";
					let itemLayer = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCNS.itemlayer + BDFDB.disCN.itemlayerdisabledpointerevents}"><div class="${BDFDB.disCN.tooltip}" tooltip-id="${id}"><div class="${BDFDB.disCN.tooltippointer}"></div><div class="${BDFDB.disCN.tooltipcontent}"></div></div></div>`);
					if (zIndexed) {
						let itemLayerContainerClone = itemLayerContainer.cloneNode();
						itemLayerContainerClone.style.setProperty("z-index", options.zIndex || 1002, "important");
						itemLayerContainer.parentElement.insertBefore(itemLayerContainerClone, itemLayerContainer.nextElementSibling);
						itemLayerContainer = itemLayerContainerClone;
					}
					itemLayerContainer.appendChild(itemLayer);
					
					let tooltip = itemLayer.firstElementChild;
					let tooltipContent = itemLayer.querySelector(BDFDB.dotCN.tooltipcontent);
					let tooltipPointer = itemLayer.querySelector(BDFDB.dotCN.tooltippointer);
					
					if (options.id) tooltip.id = options.id.split(" ").join("");
					
					if (typeof options.type != "string" || !BDFDB.disCN["tooltip" + options.type.toLowerCase()]) options.type = "top";
					let type = options.type.toLowerCase();
					BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN["tooltip" + type], options.className, options.selector);
					
					let fontColorIsGradient = false, customBackgroundColor = false, style = "";
					if (options.style) style += options.style;
					if (options.fontColor) {
						fontColorIsGradient = BDFDB.ObjectUtils.is(options.fontColor);
						if (!fontColorIsGradient) style = (style ? (style + " ") : "") + `color: ${BDFDB.ColorUtils.convert(options.fontColor, "RGBA")} !important;`
					}
					if (options.backgroundColor) {
						customBackgroundColor = true;
						let backgroundColorIsGradient = BDFDB.ObjectUtils.is(options.backgroundColor);
						let backgroundColor = !backgroundColorIsGradient ? BDFDB.ColorUtils.convert(options.backgroundColor, "RGBA") : BDFDB.ColorUtils.createGradient(options.backgroundColor);
						style = (style ? (style + " ") : "") + `background: ${backgroundColor} !important; border-color: ${backgroundColorIsGradient ? BDFDB.ColorUtils.convert(options.backgroundColor[type == "left" ? 100 : 0], "RGBA") : backgroundColor} !important;`;
					}
					if (style) tooltip.style = style;
					if (zIndexed) {
						itemLayer.style.setProperty("z-index", options.zIndex || 1002, "important");
						tooltip.style.setProperty("z-index", options.zIndex || 1002, "important");
						tooltipContent.style.setProperty("z-index", options.zIndex || 1002, "important");
					}
					if (typeof options.width == "number" && options.width > 196) {
						tooltip.style.setProperty("width", `${options.width}px`, "important");
						tooltip.style.setProperty("max-width", `${options.width}px`, "important");
					}
					if (typeof options.maxWidth == "number" && options.maxWidth > 196) {
						tooltip.style.setProperty("max-width", `${options.maxWidth}px`, "important");
					}
					if (customBackgroundColor) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltipcustom);
					else if (options.color && BDFDB.disCN["tooltip" + options.color.toLowerCase()]) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN["tooltip" + options.color.toLowerCase()]);
					else BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltipblack);
					
					if (options.list || BDFDB.ObjectUtils.is(options.guild)) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltiplistitem);

					let mouseLeave = _ => {itemLayer.removeTooltip();};
					if (!options.perssist) anker.addEventListener("mouseleave", mouseLeave);
					
					let observer = new MutationObserver(changes => changes.forEach(change => {
						let nodes = Array.from(change.removedNodes);
						if (nodes.indexOf(itemLayer) > -1 || nodes.indexOf(anker) > -1 || nodes.some(n => n.contains(anker))) {
							BDFDB.ArrayUtils.remove(Tooltips, id);
							observer.disconnect();
							itemLayer.removeTooltip();
							anker.removeEventListener("mouseleave", mouseLeave);
							if (typeof options.onHide == "function") options.onHide(itemLayer, anker);
						}
					}));
					observer.observe(document.body, {subtree:true, childList:true});
					
					(tooltip.setText = itemLayer.setText = newText => {
						if (BDFDB.ObjectUtils.is(options.guild)) {
							let streamOwnerIds = LibraryModules.StreamUtils.getAllApplicationStreams().filter(app => app.guildId === options.guild.id).map(app => app.ownerId) || [];
							let streamOwners = streamOwnerIds.map(ownerId => LibraryModules.UserStore.getUser(ownerId)).filter(n => n);
							let connectedUsers = Object.keys(LibraryModules.VoiceUtils.getVoiceStates(options.guild.id)).map(userId => !streamOwnerIds.includes(userId) && BDFDB.LibraryModules.UserStore.getUser(userId)).filter(n => n);
							let tooltipText = options.guild.toString();
							if (fontColorIsGradient) tooltipText = `<span style="pointer-events: none; -webkit-background-clip: text !important; color: transparent !important; background-image: ${BDFDB.ColorUtils.createGradient(options.fontColor)} !important;">${BDFDB.StringUtils.htmlEscape(tooltipText)}</span>`;
							BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(BDFDB.ReactUtils.Fragment, {
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltiprow, BDFDB.disCN.tooltiprowguildname),
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Badge, {
												guild: options.guild,
												size: LibraryModules.StringUtils.cssValueToNumber(DiscordClassModules.TooltipGuild.iconSize),
												className: BDFDB.disCN.tooltiprowicon
											}),
											BDFDB.ReactUtils.createElement("span", {
												className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltipguildnametext, (connectedUsers.length || streamOwners.length) && BDFDB.disCN.tooltipguildnametextlimitedsize),
												children: fontColorIsGradient || options.html ? BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(tooltipText)) : tooltipText
											}),
										]
									}),
									newText && BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltiprow, BDFDB.disCN.tooltiprowextra),
										children: newText
									}),
									connectedUsers.length && BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.tooltiprow,
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
												name: InternalComponents.LibraryComponents.SvgIcon.Names.SPEAKER,
												className: BDFDB.disCN.tooltipactivityicon
											}),
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.UserSummaryItem, {
												users: connectedUsers,
												max: 6
											})
										]
									}),
									streamOwners.length && BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.tooltiprow,
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
												name: InternalComponents.LibraryComponents.SvgIcon.Names.STREAM,
												className: BDFDB.disCN.tooltipactivityicon
											}),
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.UserSummaryItem, {
												users: streamOwners,
												max: 6
											})
										]
									})
								].filter(n => n)
							}), tooltipContent);
						}
						else {
							if (fontColorIsGradient) tooltipContent.innerHTML = `<span style="pointer-events: none; -webkit-background-clip: text !important; color: transparent !important; background-image: ${BDFDB.ColorUtils.createGradient(options.fontColor)} !important;">${BDFDB.StringUtils.htmlEscape(newText)}</span>`;
							else if (options.html === true) tooltipContent.innerHTML = newText;
							else tooltipContent.innerText = newText;
						}
					})(text);
					(tooltip.removeTooltip = itemLayer.removeTooltip = _ => {
						BDFDB.DOMUtils.remove(itemLayer);
						if (zIndexed) BDFDB.DOMUtils.remove(itemLayerContainer);
					});
					(tooltip.update = itemLayer.update = newText => {
						if (newText) tooltip.setText(newText);
						let left, top;
						const tRects = BDFDB.DOMUtils.getRects(anker);
						const iRects = BDFDB.DOMUtils.getRects(itemLayer);
						const aRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.appmount));
						const positionOffsets = {height: 10, width: 10};
						const offset = typeof options.offset == "number" ? options.offset : 0;
						switch (type) {
							case "top":
								top = tRects.top - iRects.height - positionOffsets.height + 2 - offset;
								left = tRects.left + (tRects.width - iRects.width) / 2;
								break;
							case "bottom":
								top = tRects.top + tRects.height + positionOffsets.height - 2 + offset;
								left = tRects.left + (tRects.width - iRects.width) / 2;
								break;
							case "left":
								top = tRects.top + (tRects.height - iRects.height) / 2;
								left = tRects.left - iRects.width - positionOffsets.width + 2 - offset;
								break;
							case "right":
								top = tRects.top + (tRects.height - iRects.height) / 2;
								left = tRects.left + tRects.width + positionOffsets.width - 2 + offset;
								break;
							}
							
						itemLayer.style.setProperty("top", `${top}px`, "important");
						itemLayer.style.setProperty("left", `${left}px`, "important");
						
						tooltipPointer.style.removeProperty("margin-left");
						tooltipPointer.style.removeProperty("margin-top");
						if (type == "top" || type == "bottom") {
							if (left < 0) {
								itemLayer.style.setProperty("left", "5px", "important");
								tooltipPointer.style.setProperty("margin-left", `${left - 10}px`, "important");
							}
							else {
								const rightMargin = aRects.width - (left + iRects.width);
								if (rightMargin < 0) {
									itemLayer.style.setProperty("left", `${aRects.width - iRects.width - 5}px`, "important");
									tooltipPointer.style.setProperty("margin-left", `${-1*rightMargin}px`, "important");
								}
							}
						}
						else if (type == "left" || type == "right") {
							if (top < 0) {
								const bRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.titlebar));
								const barCorrection = (bRects.width || 0) >= Math.round(75 * window.outerWidth / aRects.width) ? (bRects.height + 5) : 0;
								itemLayer.style.setProperty("top", `${5 + barCorrection}px`, "important");
								tooltipPointer.style.setProperty("margin-top", `${top - 10 - barCorrection}px`, "important");
							}
							else {
								const bottomMargin = aRects.height - (top + iRects.height);
								if (bottomMargin < 0) {
									itemLayer.style.setProperty("top", `${aRects.height - iRects.height - 5}px`, "important");
									tooltipPointer.style.setProperty("margin-top", `${-1*bottomMargin}px`, "important");
								}
							}
						}
					})();
					
					if (options.delay) {
						BDFDB.DOMUtils.toggle(itemLayer);
						BDFDB.TimeUtils.timeout(_ => {
							BDFDB.DOMUtils.toggle(itemLayer);
							if (typeof options.onShow == "function") options.onShow(itemLayer, anker);
						}, options.delay);
					}
					else {
						if (typeof options.onShow == "function") options.onShow(itemLayer, anker);
					}
					return itemLayer;
				};
				
				InternalBDFDB.findModule = function (type, cachestring, filter, getExport) {
					if (!BDFDB.ObjectUtils.is(Cache.modules[type])) Cache.modules[type] = {module:{}, export:{}};
					if (getExport && Cache.modules[type].export[cachestring]) return Cache.modules[type].export[cachestring];
					else if (!getExport && Cache.modules[type].module[cachestring]) return Cache.modules[type].module[cachestring];
					else {
						let m = BDFDB.ModuleUtils.find(filter, getExport);
						if (m) {
							if (getExport) Cache.modules[type].export[cachestring] = m;
							else Cache.modules[type].module[cachestring] = m;
							return m;
						}
						else BDFDB.LogUtils.warn(`${cachestring} [${type}] not found in WebModules`);
					}
				};
				InternalBDFDB.getWebModuleReq = function () {
					if (!InternalBDFDB.getWebModuleReq.req) {
						const id = "BDFDB-WebModules";
						const req = window.webpackJsonp.push([[], {[id]: (module, exports, req) => module.exports = req}, [[id]]]);
						delete req.m[id];
						delete req.c[id];
						InternalBDFDB.getWebModuleReq.req = req;
					}
					return InternalBDFDB.getWebModuleReq.req;
				};
				BDFDB.ModuleUtils = {};
				BDFDB.ModuleUtils.find = function (filter, getExport) {
					getExport = typeof getExport != "boolean" ? true : getExport;
					let req = InternalBDFDB.getWebModuleReq();
					for (let i in req.c) if (req.c.hasOwnProperty(i)) {
						let m = req.c[i].exports;
						if (m && (typeof m == "object" || typeof m == "function") && filter(m)) return getExport ? m : req.c[i];
						if (m && m.__esModule) {
							for (let j in m) if (m[j] && (typeof m[j] == "object" || typeof m[j] == "function") && filter(m[j])) return getExport ? m[j] : req.c[i];
							if (m.default && (typeof m.default == "object" || typeof m.default == "function")) for (let j in m.default) if (m.default[j] && (typeof m.default[j] == "object" || typeof m.default[j] == "function") && filter(m.default[j])) return getExport ? m.default[j] : req.c[i];
						}
					}
					for (let i in req.m) if (req.m.hasOwnProperty(i)) {
						let m = req.m[i];
						if (m && typeof m == "function" && filter(m)) {
							if (req.c[i]) return getExport ? req.c[i].exports : req.c[i];
							else {
								let resolved = {};
								req.m[i](resolved, null, req);
								return getExport ? resolved.exports : resolved;
							}
						}
					}
				};
				BDFDB.ModuleUtils.findByProperties = function (...properties) {
					properties = properties.flat(10);
					let getExport = properties.pop();
					if (typeof getExport != "boolean") {
						properties.push(getExport);
						getExport = true;
					}
					return InternalBDFDB.findModule("prop", JSON.stringify(properties), m => properties.every(prop => m[prop] !== undefined), getExport);
				};
				BDFDB.ModuleUtils.findByName = function (name, getExport) {
					return InternalBDFDB.findModule("name", JSON.stringify(name), m => m.displayName === name || m.render && m.render.displayName === name, typeof getExport != "boolean" ? true : getExport);
				};
				BDFDB.ModuleUtils.findByString = function (...strings) {
					strings = strings.flat(10);
					let getExport = strings.pop();
					if (typeof getExport != "boolean") {
						strings.push(getExport);
						getExport = true;
					}
					return InternalBDFDB.findModule("string", JSON.stringify(strings), m => strings.every(string => typeof m == "function" && (m.toString().indexOf(string) > -1 || typeof m.__originalMethod == "function" && m.__originalMethod.toString().indexOf(string) > -1 || typeof m.__originalFunction == "function" && m.__originalFunction.toString().indexOf(string) > -1) || BDFDB.ObjectUtils.is(m) && typeof m.type == "function" && m.type.toString().indexOf(string) > -1), getExport);
				};
				BDFDB.ModuleUtils.findByPrototypes = function (...protoProps) {
					protoProps = protoProps.flat(10);
					let getExport = protoProps.pop();
					if (typeof getExport != "boolean") {
						protoProps.push(getExport);
						getExport = true;
					}
					return InternalBDFDB.findModule("proto", JSON.stringify(protoProps), m => m.prototype && protoProps.every(prop => m.prototype[prop] !== undefined), getExport);
				};
				
				InternalBDFDB.forceInitiateProcess = function (pluginDataObjs, instance, type) {
					pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
					if (pluginDataObjs.length && instance && type) {
						let forceRender = false;
						for (let pluginData of pluginDataObjs) {
							let plugin = pluginData.plugin == BDFDB && InternalBDFDB || pluginData.plugin, methodNames = [];
							for (let patchType in plugin.patchedModules) {
								if (plugin.patchedModules[patchType][type]) methodNames.push(plugin.patchedModules[patchType][type]);
							}
							methodNames = BDFDB.ArrayUtils.removeCopies(methodNames).flat(10).filter(n => n);
							if (methodNames.includes("componentDidMount")) InternalBDFDB.initiateProcess(plugin, type, {
								instance: instance,
								methodname: "componentDidMount",
								patchtypes: pluginData.patchTypes[type]
							});
							if (methodNames.includes("render")) forceRender = true;
							else if (!forceRender && methodNames.includes("componentDidUpdate")) InternalBDFDB.initiateProcess(plugin, type, {
								instance: instance,
								methodname: "componentDidUpdate",
								patchtypes: pluginData.patchTypes[type]
							});
						}
						if (forceRender) BDFDB.ReactUtils.forceUpdate(instance);
					}
				};
				InternalBDFDB.initiateProcess = function (plugin, type, e) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (BDFDB.ObjectUtils.is(plugin) && !plugin.stopping && e.instance) {
						type = LibraryModules.StringUtils.upperCaseFirstChar(type.split(" _ _ ")[1] || type).replace(/[^A-z0-9]|_/g, "");
						if (typeof plugin[`process${type}`] == "function") {
							if (typeof e.methodname == "string" && (e.methodname.indexOf("componentDid") == 0 || e.methodname.indexOf("componentWill") == 0)) {
								e.node = BDFDB.ReactUtils.findDOMNode(e.instance);
								if (e.node) return plugin[`process${type}`](e);
								else BDFDB.TimeUtils.timeout(_ => {
									e.node = BDFDB.ReactUtils.findDOMNode(e.instance);
									if (e.node) return plugin[`process${type}`](e);
								});
							}
							else if (e.returnvalue || e.patchtypes.includes("before")) return plugin[`process${type}`](e);
						}
					}
				};
				InternalBDFDB.patchObserverData = {observer:null, data:{}};
				InternalBDFDB.patchPlugin = function (plugin) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.patchedModules)) return;
					BDFDB.PatchUtils.unpatch(plugin);
					let patchedModules = {};
					for (let patchType in plugin.patchedModules) for (let type in plugin.patchedModules[patchType]) {
						if (!patchedModules[type]) patchedModules[type] = {};
						patchedModules[type][patchType] = plugin.patchedModules[patchType][type];
					}
					for (let type in patchedModules) {
						let pluginData = {plugin: plugin, patchTypes: patchedModules[type]};
						let unmappedType = type.split(" _ _ ")[1] || type;
						
						let config = {
							classNames: [InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].class].flat(10).filter(n => DiscordClasses[n]),
							stringFind: InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].strings,
							propertyFind: InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].props,
							specialFilter: InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].special && InternalBDFDB.createFilter(InternalData.ModuleUtilsConfig.Finder[unmappedType].special),
							memoComponent: InternalData.ModuleUtilsConfig.MemoComponent.includes(unmappedType),
							forceObserve: InternalData.ModuleUtilsConfig.ForceObserve.includes(unmappedType),
							nonRender: BDFDB.ObjectUtils.toArray(pluginData.patchTypes).flat(10).filter(n => n && !InternalData.ModuleUtilsConfig.InstanceFunctions.includes(n)).length > 0,
							mapped: InternalData.ModuleUtilsConfig.PatchMap[type]
						};
						config.ignoreCheck = !!(config.codeFind || config.propertyFind || config.specialFilter || config.nonRender || config.memoComponent);
						config.nonPrototype = InternalData.ModuleUtilsConfig.NonPrototype.includes(unmappedType) || !!(config.codeFind || config.propertyFind || config.nonRender);
						
						let component = InternalData.ModuleUtilsConfig.LoadedInComponents[type] && BDFDB.ObjectUtils.get(InternalComponents, InternalData.ModuleUtilsConfig.LoadedInComponents[type]);
						if (component) InternalBDFDB.patchInstance(pluginData, config.nonRender ? (BDFDB.ModuleUtils.find(m => m == component, false) || {}).exports : component, type, config);
						else {
							let mappedType = config.mapped ? config.mapped + " _ _ " + type : type;
							let name = mappedType.split(" _ _ ")[0];
							if (config.mapped) {
								for (let patchType in plugin.patchedModules) if (plugin.patchedModules[patchType][type]) {
									plugin.patchedModules[patchType][mappedType] = plugin.patchedModules[patchType][type];
									delete plugin.patchedModules[patchType][type];
								}
							}
							if (config.classNames.length) InternalBDFDB.checkForInstance(pluginData, mappedType, config);
							else if (config.stringFind) {
								let exports = (BDFDB.ModuleUtils.findByString(config.stringFind, false) || {}).exports;
								InternalBDFDB.patchInstance(pluginData, exports && config.memoComponent ? exports.default : exports, mappedType, config);
							}
							else if (config.propertyFind) {
								let exports = (BDFDB.ModuleUtils.findByProperties(config.propertyFind, false) || {}).exports;
								InternalBDFDB.patchInstance(pluginData, exports && config.memoComponent ? exports.default : exports, mappedType, config);
							}
							else if (config.nonRender) {
								let exports = (BDFDB.ModuleUtils.findByName(name, false) || {}).exports;
								InternalBDFDB.patchInstance(pluginData, exports && config.memoComponent ? exports.default : exports, mappedType, config);
							}
							else InternalBDFDB.patchInstance(pluginData, BDFDB.ModuleUtils.findByName(name), mappedType, config);
						}
					}
				};
				InternalBDFDB.patchInstance = function (pluginDataObjs, instance, type, config) {
					pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
					if (pluginDataObjs.length && instance) {
						let name = type.split(" _ _ ")[0];
						instance = instance._reactInternalFiber && instance._reactInternalFiber.type ? instance._reactInternalFiber.type : instance;
						instance = config.ignoreCheck || BDFDB.ReactUtils.isCorrectInstance(instance, name) || InternalData.ModuleUtilsConfig.LoadedInComponents[type] ? instance : (BDFDB.ReactUtils.findConstructor(instance, name) || BDFDB.ReactUtils.findConstructor(instance, name, {up:true}));
						if (instance) {
							instance = instance._reactInternalFiber && instance._reactInternalFiber.type ? instance._reactInternalFiber.type : instance;
							let toBePatched = config.nonPrototype ? instance : instance.prototype;
							for (let pluginData of pluginDataObjs) for (let patchType in pluginData.patchTypes) {
								let patchMethods = {};
								patchMethods[patchType] = e => {
									return InternalBDFDB.initiateProcess(pluginData.plugin, type, {
										instance: e.thisObject && window != e.thisObject ? e.thisObject : {props:e.methodArguments[0]},
										returnvalue: e.returnValue,
										methodname: e.originalMethodName,
										patchtypes: [patchType]
									});
								};
								BDFDB.PatchUtils.patch(pluginData.plugin, toBePatched, pluginData.patchTypes[patchType], patchMethods);
							}
						}
					}
				};
				InternalBDFDB.createFilter = function (config) {
					return ins => ins && config.every(prop => {
						let value = BDFDB.ObjectUtils.get(ins, prop.path);
						return value && (!prop.value || [prop.value].flat(10).filter(n => typeof n == "string").some(n => value.toUpperCase().indexOf(n.toUpperCase()) == 0));
					}) && ins.return.type;
				};
				InternalBDFDB.checkEle = function (pluginDataObjs, ele, type, config) {
					pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
					let unmappedType = type.split(" _ _ ")[1] || type;
					let ins = BDFDB.ReactUtils.getInstance(ele);
					if (typeof config.specialFilter == "function") {
						let component = config.specialFilter(ins);
						if (component) {
							if (config.nonRender) {
								let exports = (BDFDB.ModuleUtils.find(m => m == component, false) || {}).exports;
								InternalBDFDB.patchInstance(pluginDataObjs, exports && config.memoComponent ? exports.default : exports, type, config);
							}
							else InternalBDFDB.patchInstance(pluginDataObjs, component, type, config);
							BDFDB.PatchUtils.forceAllUpdates(pluginDataObjs.map(n => n.plugin), type);
							return true;
						}
					}
					else if (InternalBDFDB.isCorrectPatchInstance(ins, type)) {
						InternalBDFDB.patchInstance(pluginDataObjs, ins, type, config);
						BDFDB.PatchUtils.forceAllUpdates(pluginDataObjs.map(n => n.plugin), type);
						return true;
					}
					return false;
				};
				InternalBDFDB.checkForInstance = function (pluginData, type, config) {
					const app = document.querySelector(BDFDB.dotCN.app), bdSettings = document.querySelector("#bd-settingspane-container .scroller");
					let instanceFound = false;
					if (!config.forceObserve) {
						if (app) {
							let appIns = BDFDB.ReactUtils.findConstructor(app, type, {unlimited:true}) || BDFDB.ReactUtils.findConstructor(app, type, {unlimited:true, up:true});
							if (appIns && (instanceFound = true)) InternalBDFDB.patchInstance(pluginData, appIns, type, config);
						}
						if (!instanceFound && bdSettings) {
							let bdSettingsIns = BDFDB.ReactUtils.findConstructor(bdSettings, type, {unlimited:true});
							if (bdSettingsIns && (instanceFound = true)) InternalBDFDB.patchInstance(pluginData, bdSettingsIns, type, config);
						}
					}
					if (!instanceFound) {
						let elementFound = false, classes = config.classNames.map(n => BDFDB.disCN[n]), selector = config.classNames.map(n => BDFDB.dotCN[n]).join(", ");
						for (let ele of document.querySelectorAll(selector)) {
							elementFound = InternalBDFDB.checkEle(pluginData, ele, type, config);
							if (elementFound) break;
						}
						if (!elementFound) {
							if (!InternalBDFDB.patchObserverData.observer) {
								let appMount = document.querySelector(BDFDB.dotCN.appmount);
								if (appMount) {
									InternalBDFDB.patchObserverData.observer = new MutationObserver(cs => {cs.forEach(c => {c.addedNodes.forEach(n => {
										if (!n || !n.tagName) return;
										for (let type in InternalBDFDB.patchObserverData.data) if (!InternalBDFDB.patchObserverData.data[type].found) {
											let ele = null;
											if ((ele = BDFDB.DOMUtils.containsClass(n, ...InternalBDFDB.patchObserverData.data[type].classes) ? n : n.querySelector(InternalBDFDB.patchObserverData.data[type].selector)) != null) {
												InternalBDFDB.patchObserverData.data[type].found = InternalBDFDB.checkEle(InternalBDFDB.patchObserverData.data[type].plugins, ele, type, InternalBDFDB.patchObserverData.data[type].config);
												if (InternalBDFDB.patchObserverData.data[type].found) {
													delete InternalBDFDB.patchObserverData.data[type];
													if (BDFDB.ObjectUtils.isEmpty(InternalBDFDB.patchObserverData.data)) {
														InternalBDFDB.patchObserverData.observer.disconnect();
														InternalBDFDB.patchObserverData.observer = null;
													}
												}
											}
										}
									});});});
									InternalBDFDB.patchObserverData.observer.observe(appMount, {childList:true, subtree:true});
								}
							}
							if (!InternalBDFDB.patchObserverData.data[type]) InternalBDFDB.patchObserverData.data[type] = {selector, classes, found:false, config, plugins:[]};
							InternalBDFDB.patchObserverData.data[type].plugins.push(pluginData);
						}
					}
				};
				
				InternalBDFDB.isCorrectPatchInstance = function (instance, name) {
					if (!instance) return false;
					instance = instance._reactInternalFiber && instance._reactInternalFiber.type ? instance._reactInternalFiber.type : instance;
					instance = BDFDB.ReactUtils.isCorrectInstance(instance, name) ? instance : (BDFDB.ReactUtils.findConstructor(instance, name) || BDFDB.ReactUtils.findConstructor(instance, name, {up:true}));
					return !!instance;
				};
				
				BDFDB.PatchUtils = {};
				BDFDB.PatchUtils.isPatched = function (plugin, module, methodName) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!plugin || !BDFDB.ObjectUtils.is(module) || !module.BDFDB_patches || !methodName) return false;
					const pluginId = (typeof plugin === "string" ? plugin : plugin.name).toLowerCase();
					return pluginId && module[methodName] && module[methodName].__is_BDFDB_patched && module.BDFDB_patches[methodName] && BDFDB.ObjectUtils.toArray(module.BDFDB_patches[methodName]).some(patchObj => BDFDB.ObjectUtils.toArray(patchObj).some(priorityObj => Object.keys(priorityObj).includes(pluginId)));
				};
				BDFDB.PatchUtils.patch = function (plugin, module, methodNames, patchMethods, config = {}) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!plugin || !BDFDB.ObjectUtils.is(module) || !methodNames || !BDFDB.ObjectUtils.is(patchMethods)) return null;
					patchMethods = BDFDB.ObjectUtils.filter(patchMethods, type => InternalData.ModuleUtilsConfig.PatchTypes.includes(type), true);
					if (BDFDB.ObjectUtils.isEmpty(patchMethods)) return null;
					const pluginName = typeof plugin === "string" ? plugin : plugin.name;
					const pluginId = pluginName.toLowerCase();
					const patchPriority = BDFDB.ObjectUtils.is(plugin) && !isNaN(plugin.patchPriority) ? (plugin.patchPriority < 0 ? 0 : (plugin.patchPriority > 10 ? 10 : Math.round(plugin.patchPriority))) : 5;
					if (!BDFDB.ObjectUtils.is(module.BDFDB_patches)) module.BDFDB_patches = {};
					methodNames = [methodNames].flat(10).filter(n => n);
					let cancel = _ => {BDFDB.PatchUtils.unpatch(plugin, module, methodNames);};
					for (let methodName of methodNames) if (module[methodName] == null || typeof module[methodName] == "function") {
						if (!module.BDFDB_patches[methodName] || config.force && (!module[methodName] || !module[methodName].__is_BDFDB_patched)) {
							if (!module.BDFDB_patches[methodName]) {
								module.BDFDB_patches[methodName] = {};
								for (let type of InternalData.ModuleUtilsConfig.PatchTypes) module.BDFDB_patches[methodName][type] = {};
							}
							if (!module[methodName]) module[methodName] = (_ => {});
							const originalMethod = module[methodName];
							module.BDFDB_patches[methodName].originalMethod = originalMethod;
							module[methodName] = function () {
								let callInstead = false, stopCall = false;
								const data = {
									thisObject: this,
									methodArguments: arguments,
									originalMethod: originalMethod,
									originalMethodName: methodName,
									callOriginalMethod: _ => {if (!stopCall) data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments)},
									callOriginalMethodAfterwards: _ => {callInstead = true;},
									stopOriginalMethodCall: _ => {stopCall = true;}
								};
								if (module.BDFDB_patches && module.BDFDB_patches[methodName]) {
									for (let priority in module.BDFDB_patches[methodName].before) for (let id in BDFDB.ObjectUtils.sort(module.BDFDB_patches[methodName].before[priority])) {
										BDFDB.TimeUtils.suppress(module.BDFDB_patches[methodName].before[priority][id], `"before" callback of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`, module.BDFDB_patches[methodName].before[priority][id].pluginName)(data);
									}
									
									if (!module.BDFDB_patches || !module.BDFDB_patches[methodName]) return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
									let hasInsteadPatches = BDFDB.ObjectUtils.toArray(module.BDFDB_patches[methodName].instead).some(priorityObj => !BDFDB.ObjectUtils.isEmpty(priorityObj));
									if (hasInsteadPatches) for (let priority in module.BDFDB_patches[methodName].instead) for (let id in BDFDB.ObjectUtils.sort(module.BDFDB_patches[methodName].instead[priority])) {
										let tempReturn = BDFDB.TimeUtils.suppress(module.BDFDB_patches[methodName].instead[priority][id], `"instead" callback of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`, module.BDFDB_patches[methodName].instead[priority][id].pluginName)(data);
										if (tempReturn !== undefined) data.returnValue = tempReturn;
									}
									if ((!hasInsteadPatches || callInstead) && !stopCall) BDFDB.TimeUtils.suppress(data.callOriginalMethod, `originalMethod of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`)();
									
									if (!module.BDFDB_patches || !module.BDFDB_patches[methodName]) return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
									for (let priority in module.BDFDB_patches[methodName].after) for (let id in BDFDB.ObjectUtils.sort(module.BDFDB_patches[methodName].after[priority])) {
										let tempReturn = BDFDB.TimeUtils.suppress(module.BDFDB_patches[methodName].after[priority][id], `"after" callback of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`, module.BDFDB_patches[methodName].after[priority][id].pluginName)(data);
										if (tempReturn !== undefined) data.returnValue = tempReturn;
									}
								}
								else BDFDB.TimeUtils.suppress(data.callOriginalMethod, `originalMethod of ${methodName} in ${module.constructor ? module.constructor.displayName || module.constructor.name : "module"}`)();
								callInstead = false, stopCall = false;
								return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
							};
							for (let key of Object.keys(originalMethod)) module[methodName][key] = originalMethod[key];
							if (!module[methodName].__originalFunction) {
								let realOriginalMethod = originalMethod.__originalMethod || originalMethod.__originalFunction || originalMethod;
								if (typeof realOriginalMethod == "function") {
									module[methodName].__originalFunction = realOriginalMethod;
									module[methodName].toString = _ => realOriginalMethod.toString();
								}
							}
							module[methodName].__is_BDFDB_patched = true;
						}
						for (let type in patchMethods) if (typeof patchMethods[type] == "function") {
							if (!BDFDB.ObjectUtils.is(module.BDFDB_patches[methodName][type][patchPriority])) module.BDFDB_patches[methodName][type][patchPriority] = {};
							module.BDFDB_patches[methodName][type][patchPriority][pluginId] = (...args) => {
								if (config.once || !plugin.started) cancel();
								return patchMethods[type](...args);
							};
							module.BDFDB_patches[methodName][type][patchPriority][pluginId].pluginName = pluginName;
						}
					}
					if (BDFDB.ObjectUtils.is(plugin) && !config.once && !config.noCache) {
						if (!BDFDB.ArrayUtils.is(plugin.patchCancels)) plugin.patchCancels = [];
						plugin.patchCancels.push(cancel);
					}
					return cancel;
				};
				BDFDB.PatchUtils.unpatch = function (plugin, module, methodNames) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!module && !methodNames) {
						if (BDFDB.ObjectUtils.is(plugin) && BDFDB.ArrayUtils.is(plugin.patchCancels)) while (plugin.patchCancels.length) (plugin.patchCancels.pop())();
					}
					else {
						if (!BDFDB.ObjectUtils.is(module) || !module.BDFDB_patches) return;
						const pluginId = !plugin ? null : (typeof plugin === "string" ? plugin : plugin.name).toLowerCase();
						if (methodNames) {
							for (let methodName of [methodNames].flat(10).filter(n => n)) if (module[methodName] && module.BDFDB_patches[methodName]) unpatch(methodName, pluginId);
						}
						else for (let patchedMethod of module.BDFDB_patches) unpatch(patchedMethod, pluginId);
					}
					function unpatch (funcName, pluginId) {
						for (let type of InternalData.ModuleUtilsConfig.PatchTypes) {
							if (pluginId) for (let priority in module.BDFDB_patches[funcName][type]) {
								delete module.BDFDB_patches[funcName][type][priority][pluginId];
								if (BDFDB.ObjectUtils.isEmpty(module.BDFDB_patches[funcName][type][priority])) delete module.BDFDB_patches[funcName][type][priority];
							}
							else delete module.BDFDB_patches[funcName][type];
						}
						if (BDFDB.ObjectUtils.isEmpty(BDFDB.ObjectUtils.filter(module.BDFDB_patches[funcName], key => InternalData.ModuleUtilsConfig.PatchTypes.includes(key) && !BDFDB.ObjectUtils.isEmpty(module.BDFDB_patches[funcName][key]), true))) {
							module[funcName] = module.BDFDB_patches[funcName].originalMethod;
							delete module.BDFDB_patches[funcName];
							if (BDFDB.ObjectUtils.isEmpty(module.BDFDB_patches)) delete module.BDFDB_patches;
						}
					}
				};
				BDFDB.PatchUtils.forceAllUpdates = function (plugins, selectedTypes) {
					plugins = [plugins].flat(10).map(n => n == BDFDB && InternalBDFDB || n).filter(n => BDFDB.ObjectUtils.is(n.patchedModules));
					if (plugins.length) {
						const app = document.querySelector(BDFDB.dotCN.app);
						const bdSettings = document.querySelector("#bd-settingspane-container > *");
						if (app) {
							selectedTypes = [selectedTypes].flat(10).filter(n => n).map(type => type && InternalData.ModuleUtilsConfig.PatchMap[type] ? InternalData.ModuleUtilsConfig.PatchMap[type] + " _ _ " + type : type);
							let updateData = {};
							for (let plugin of plugins) {
								updateData[plugin.name] = {
									filteredModules: [],
									specialModules: [],
									specialModuleTypes: [],
									patchTypes: {}
								};
								for (let patchType in plugin.patchedModules) for (let type in plugin.patchedModules[patchType]) {
									let methodNames = [plugin.patchedModules[patchType][type]].flat(10).filter(n => n);
									if (BDFDB.ArrayUtils.includes(methodNames, "componentDidMount", "componentDidUpdate", "render", false) && (!selectedTypes.length || selectedTypes.includes(type))) {
										let unmappedType = type.split(" _ _ ")[1] || type;
										let selector = [InternalData.ModuleUtilsConfig.Finder[unmappedType]].flat(10).filter(n => DiscordClasses[n]).map(n => BDFDB.dotCN[n]).join(", ");
										let specialFilter = InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].special && InternalBDFDB.createFilter(InternalData.ModuleUtilsConfig.Finder[unmappedType].special);
										if (selector && typeof specialFilter == "function") {
											for (let ele of document.querySelectorAll(selector)) {
												let constro = specialFilter(BDFDB.ReactUtils.getInstance(ele));
												if (constro) {
													updateData[plugin.name].specialModules.push([type, constro]);
													updateData[plugin.name].specialModuleTypes.push(type);
													break;
												}
											}
										}
										else updateData[plugin.name].filteredModules.push(type);
										let name = type.split(" _ _ ")[0];
										if (!updateData[plugin.name].patchTypes[name]) updateData[plugin.name].patchTypes[name] = [];
										updateData[plugin.name].patchTypes[name].push(patchType);
									}
								}
							}
							let updateDataArray = BDFDB.ObjectUtils.toArray(updateData);
							if (BDFDB.ArrayUtils.sum(updateDataArray.map(n => n.filteredModules.length + n.specialModules.length))) {
								try {
									let filteredModules = BDFDB.ArrayUtils.removeCopies(updateDataArray.map(n => n.filteredModules).flat(10));
									let specialModules = BDFDB.ArrayUtils.removeCopies(updateDataArray.map(n => n.specialModules).flat(10));
									const appInsDown = BDFDB.ReactUtils.findOwner(app, {name:filteredModules, type:specialModules, all:true, group:true, unlimited:true});
									const appInsUp = BDFDB.ReactUtils.findOwner(app, {name:filteredModules, type:specialModules, all:true, group:true, unlimited:true, up:true});
									for (let type in appInsDown) {
										let filteredPlugins = plugins.filter(n => updateData[n.name].filteredModules.includes(type) || updateData[n.name].specialModuleTypes.includes(type)).map(n => ({plugin:n, patchTypes:updateData[n.name].patchTypes}));
										for (let ins of appInsDown[type]) InternalBDFDB.forceInitiateProcess(filteredPlugins, ins, type);
									}
									for (let type in appInsUp) {
										let filteredPlugins = plugins.filter(n => updateData[n.name].filteredModules.includes(type) || updateData[n.name].specialModuleTypes.includes(type)).map(n => ({plugin:n, patchTypes:updateData[n.name].patchTypes}));
										for (let ins of appInsUp[type]) InternalBDFDB.forceInitiateProcess(filteredPlugins, ins, type);
									}
									if (bdSettings) {
										const bdSettingsIns = BDFDB.ReactUtils.findOwner(bdSettings, {name:filteredModules, type:specialModules, all:true, unlimited:true});
										if (bdSettingsIns.length) {
											const bdSettingsWrap = BDFDB.ReactUtils.findOwner(BDFDB.ReactUtils.getInstance(document.querySelector("#bd-settingspane-container > *")), {props:"onChange", up:true});
											if (bdSettingsWrap && bdSettingsWrap.props && typeof bdSettingsWrap.props.onChange == "function") bdSettingsWrap.props.onChange(bdSettingsWrap.props.type);
										}
									}
								}
								catch (err) {BDFDB.LogUtils.error("Could not force update components! " + err, plugins.map(n => n.name).join(", "));}
							}
						}
					}
				};

				BDFDB.DiscordConstants = BDFDB.ModuleUtils.findByProperties("Permissions", "ActivityTypes");
			
				for (let name in InternalData.DiscordObjects) {
					if (InternalData.DiscordObjects[name].props) DiscordObjects[name] = BDFDB.ModuleUtils.findByPrototypes(InternalData.DiscordObjects[name].props);
					else if (InternalData.DiscordObjects[name].protos) DiscordObjects[name] = BDFDB.ModuleUtils.find(m => m.prototype && InternalData.DiscordObjects[name].protos.every(proto => m.prototype[proto] && (!InternalData.DiscordObjects[name].array || Array.isArray(m.prototype[proto]))));
				}
				BDFDB.DiscordObjects = Object.assign({}, DiscordObjects);
				
				for (let name of InternalData.LibraryRequires) {
					try {LibraryRequires[name] = require(name);} catch (err) {}
				}
				BDFDB.LibraryRequires = Object.assign({}, LibraryRequires);
				
				for (let name in InternalData.LibraryModules) {
					if (InternalData.LibraryModules[name].props) {
						if (InternalData.LibraryModules[name].nonProps) LibraryModules[name] = BDFDB.ModuleUtils.find(m => InternalData.LibraryModules[name].props.every(prop => typeof m[prop] == "function") && InternalData.LibraryModules[name].nonProps.every(prop => typeof m[prop] != "function"));
						else LibraryModules[name] = BDFDB.ModuleUtils.findByProperties(InternalData.LibraryModules[name].props);
					}
				}
				if (LibraryModules.KeyCodeUtils) LibraryModules.KeyCodeUtils.getString = function (keyArray) {
					return LibraryModules.KeyCodeUtils.toString([keyArray].flat(10).filter(n => n).map(keycode => [BDFDB.DiscordConstants.KeyboardDeviceTypes.KEYBOARD_KEY, keycode, BDFDB.DiscordConstants.KeyboardEnvs.BROWSER]), true);
				};
				BDFDB.LibraryModules = Object.assign({}, LibraryModules);
				
				LibraryModules.React = BDFDB.ModuleUtils.findByProperties("createElement", "cloneElement");
				LibraryModules.ReactDOM = BDFDB.ModuleUtils.findByProperties("render", "findDOMNode");
				
				BDFDB.ReactUtils = Object.assign({}, LibraryModules.React, LibraryModules.ReactDOM);
				BDFDB.ReactUtils.childrenToArray = function (parent) {
					if (parent && parent.props && parent.props.children && !BDFDB.ArrayUtils.is(parent.props.children)) {
						var child = parent.props.children;
						parent.props.children = [];
						parent.props.children.push(child);
					}
					return parent.props.children;
				}
				BDFDB.ReactUtils.createElement = function (component, props = {}, errorWrap = false) {
					if (component && component.defaultProps) for (let key in component.defaultProps) if (props[key] == null) props[key] = component.defaultProps[key];
					try {
						let child = LibraryModules.React.createElement(component || "div", props) || null;
						if (errorWrap) return LibraryModules.React.createElement(InternalComponents.ErrorBoundary, {}, child) || null;
						else return child;
					}
					catch (err) {BDFDB.LogUtils.error("Could not create react element! " + err);}
					return null;
				};
				BDFDB.ReactUtils.objectToReact = function (obj) {
					if (!obj) return null;
					else if (typeof obj == "string") return obj;
					else if (BDFDB.ObjectUtils.is(obj)) return BDFDB.ReactUtils.createElement(obj.type || obj.props && obj.props.href && "a" || "div", !obj.props ?  {} : Object.assign({}, obj.props, {
						children: obj.props.children ? BDFDB.ReactUtils.objectToReact(obj.props.children) : null
					}));
					else if (BDFDB.ArrayUtils.is(obj)) return obj.map(n => BDFDB.ReactUtils.objectToReact(n));
					else return null;
				};
				BDFDB.ReactUtils.markdownParse = function (str) {
					if (!BDFDB.ReactUtils.markdownParse.parser || !BDFDB.ReactUtils.markdownParse.render) {
						BDFDB.ReactUtils.markdownParse.parser = LibraryModules.SimpleMarkdownParser.parserFor(LibraryModules.SimpleMarkdownParser.defaultRules);
						BDFDB.ReactUtils.markdownParse.render = LibraryModules.SimpleMarkdownParser.reactFor(LibraryModules.SimpleMarkdownParser.ruleOutput(LibraryModules.SimpleMarkdownParser.defaultRules, "react"));
					}
					return BDFDB.ReactUtils.markdownParse.render(BDFDB.ReactUtils.markdownParse.parser(str, {inline: true}));
				};
				BDFDB.ReactUtils.elementToReact = function (node, ref) {
					if (BDFDB.ReactUtils.isValidElement(node)) return node;
					else if (!Node.prototype.isPrototypeOf(node)) return null;
					else if (node.nodeType == Node.TEXT_NODE) return node.nodeValue;
					let attributes = {}, importantStyles = [];
					if (typeof ref == "function") attributes.ref = ref;
					for (let attr of node.attributes) attributes[attr.name] = attr.value;
					if (node.attributes.style) attributes.style = BDFDB.ObjectUtils.filter(node.style, n => node.style[n] && isNaN(parseInt(n)), true);
					attributes.children = [];
					if (node.style && node.style.cssText) for (let propStr of node.style.cssText.split(";")) if (propStr.endsWith("!important")) {
						let key = propStr.split(":")[0];
						let camelprop = key.replace(/-([a-z]?)/g, (m, g) => g.toUpperCase());
						if (attributes.style[camelprop] != null) importantStyles.push(key);
					}
					for (let child of node.childNodes) attributes.children.push(BDFDB.ReactUtils.elementToReact(child));
					attributes.className = BDFDB.DOMUtils.formatClassName(attributes.className, attributes.class);
					delete attributes.class;
					let reactEle = BDFDB.ReactUtils.createElement(node.tagName, attributes);
					BDFDB.ReactUtils.forceStyle(reactEle, importantStyles);
					return reactEle;
				};
				BDFDB.ReactUtils.forceStyle = function (reactEle, styles) {
					if (!BDFDB.ReactUtils.isValidElement(reactEle) || !BDFDB.ObjectUtils.is(reactEle.props.style) || !BDFDB.ArrayUtils.is(styles) || !styles.length) return null;
					let ref = reactEle.ref;
					reactEle.ref = instance => {
						if (typeof ref == "function") ref(instance);
						let node = BDFDB.ReactUtils.findDOMNode(instance);
						if (Node.prototype.isPrototypeOf(node)) for (let key of styles) {
							let propValue = reactEle.props.style[key.replace(/-([a-z]?)/g, (m, g) => g.toUpperCase())];
							if (propValue != null) node.style.setProperty(key, propValue, "important");
						}
					};
					return reactEle;
				};
				BDFDB.ReactUtils.findChild = function (nodeOrInstance, config) {
					if (!nodeOrInstance || !BDFDB.ObjectUtils.is(config) || !config.name && !config.key && !config.props && !config.filter) return config.all ? [] : null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance) && !BDFDB.ArrayUtils.is(instance)) return null;
					config.name = config.name && [config.name].flat().filter(n => n);
					config.key = config.key && [config.key].flat().filter(n => n);
					config.props = config.props && [config.props].flat().filter(n => n);
					config.filter = typeof config.filter == "function" && config.filter;
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					
					let foundChildren = [];
					let singleChild = getChild(instance);
					if (config.all) {
						for (let i in foundChildren) delete foundChildren[i].BDFDBreactSearch;
						return foundChildren;
					}
					else return singleChild;
					
					function getChild (children) {
						let result = null;
						if (!children || depth >= maxDepth || performance.now() - start >= maxTime) return result;
						if (!BDFDB.ArrayUtils.is(children)) {
							if (check(children)) {
								if (config.all === undefined || !config.all) result = children;
								else if (config.all) {
									if (!children.BDFDBreactSearch) {
										children.BDFDBreactSearch = true;
										foundChildren.push(children);
									}
								}
							}
							else if (children.props && children.props.children) {
								depth++;
								result = getChild(children.props.children);
								depth--;
							}
						}
						else {
							for (let child of children) if (child) {
								if (BDFDB.ArrayUtils.is(child)) result = getChild(child);
								else if (check(child)) {
									if (config.all === undefined || !config.all) result = child;
									else if (config.all) {
										if (!child.BDFDBreactSearch) {
											child.BDFDBreactSearch = true;
											foundChildren.push(child);
										}
									}
								}
								else if (child.props && child.props.children) {
									depth++;
									result = getChild(child.props.children);
									depth--;
								}
								if (result) break;
							}
						}
						return result;
					}
					function check (instance) {
						if (!instance) return false;
						let props = instance.stateNode ? instance.stateNode.props : instance.props;
						return instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name)) || config.key && config.key.some(key => instance.key == key) || props && config.props && config.props[config.someProps ? "some" : "every"](prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => propCheck(props, prop[0], checkValue)) : propCheck(props, prop[0], prop[1])) : props[prop] !== undefined) || config.filter && config.filter(instance);
					}
					function propCheck (props, key, value) {
						return key != null && props[key] != null && value != null && (key == "className" ? (" " + props[key] + " ").indexOf(" " + value + " ") > -1 : BDFDB.equals(props[key], value));
					}
				};
				BDFDB.ReactUtils.setChild = function (parent, stringOrChild) {
					if (!BDFDB.ReactUtils.isValidElement(parent) || (!BDFDB.ReactUtils.isValidElement(stringOrChild) && typeof stringOrChild != "string" && !BDFDB.ArrayUtils.is(stringOrChild))) return;
					let set = false;
					checkParent(parent);
					function checkParent(child) {
						if (set) return;
						if (!BDFDB.ArrayUtils.is(child)) checkChild(child);
						else for (let subChild of child) checkChild(subChild);
					}
					function checkChild(child) {
						if (!BDFDB.ReactUtils.isValidElement(child)) return;
						if (BDFDB.ReactUtils.isValidElement(child.props.children)) checkParent(child.props.children);
						else if (BDFDB.ArrayUtils.is(child.props.children)) {
							if (child.props.children.every(c => !c || typeof c == "string")) {
								set = true;
								child.props.children = [stringOrChild].flat(10);
							}
							else checkParent(child.props.children);
						}
						else {
							set = true;
							child.props.children = stringOrChild;
						}
					}
				};
				BDFDB.ReactUtils.findConstructor = function (nodeOrInstance, types, config = {}) {
					if (!BDFDB.ObjectUtils.is(config)) return null;
					if (!nodeOrInstance || !types) return config.all ? (config.group ? {} : []) : null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance)) return config.all ? (config.group ? {} : []) : null;
					types = types && [types].flat(10).filter(n => typeof n == "string");
					if (!types.length) return config.all ? (config.group ? {} : []) : null;;
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					let whitelist = config.up ? {return:true, sibling:true, default:true, _reactInternalFiber:true} : {child:true, sibling:true, default:true, _reactInternalFiber:true};
					
					let foundConstructors = config.group ? {} : [];
					let singleConstructor = getConstructor(instance);
					if (config.all) {
						for (let i in foundConstructors) {
							if (config.group) for (let j in foundConstructors[i]) delete foundConstructors[i][j].BDFDBreactSearch;
							else delete foundConstructors[i].BDFDBreactSearch;
						}
						return foundConstructors;
					}
					else return singleConstructor;

					function getConstructor (instance) {
						depth++;
						let result = undefined;
						if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
							if (instance.type && types.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name.split(" _ _ ")[0]))) {
								if (config.all === undefined || !config.all) result = instance.type;
								else if (config.all) {
									if (!instance.type.BDFDBreactSearch) {
										instance.type.BDFDBreactSearch = true;
										if (config.group) {
											if (instance.type && (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name)) {
												let group = config.name.find(name => (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type) == name.split(" _ _ ")[0]) || "Default";
												if (!BDFDB.ArrayUtils.is(foundConstructors[group])) foundConstructors[group] = [];
												foundConstructors[group].push(instance.stateNode);
											}
										}
										else foundConstructors.push(instance.type);
									}
								}
							}
							if (result === undefined) {
								let keys = Object.getOwnPropertyNames(instance);
								for (let i = 0; result === undefined && i < keys.length; i++) {
									let key = keys[i];
									if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] === "function")) result = getConstructor(instance[key]);
								}
							}
						}
						depth--;
						return result;
					}
				};
				BDFDB.ReactUtils.findDOMNode = function (instance) {
					if (Node.prototype.isPrototypeOf(instance)) return instance;
					if (!instance || !instance.updater || typeof instance.updater.isMounted !== "function" || !instance.updater.isMounted(instance)) return null;
					let node = LibraryModules.ReactDOM.findDOMNode(instance) || BDFDB.ObjectUtils.get(instance, "child.stateNode");
					return Node.prototype.isPrototypeOf(node) ? node : null;
				};
				BDFDB.ReactUtils.findOwner = function (nodeOrInstance, config) {
					if (!BDFDB.ObjectUtils.is(config)) return null;
					if (!nodeOrInstance || !config.name && !config.type && !config.key && !config.props && !config.filter) return config.all ? (config.group ? {} : []) : null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance)) return config.all ? (config.group ? {} : []) : null;
					config.name = config.name && [config.name].flat().filter(n => n);
					config.type = config.type && [config.type].flat().filter(n => n);
					config.key = config.key && [config.key].flat().filter(n => n);
					config.props = config.props && [config.props].flat().filter(n => n);
					config.filter = typeof config.filter == "function" && config.filter;
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					let whitelist = config.up ? {return:true, sibling:true, _reactInternalFiber:true} : {child:true, sibling:true, _reactInternalFiber:true};
					
					let foundInstances = config.group ? {} : [];
					let singleInstance = getOwner(instance);
					if (config.all) {
						for (let i in foundInstances) {
							if (config.group) for (let j in foundInstances[i]) delete foundInstances[i][j].BDFDBreactSearch;
							else delete foundInstances[i].BDFDBreactSearch;
						}
						return foundInstances;
					}
					else return singleInstance;

					function getOwner (instance) {
						depth++;
						let result = undefined;
						if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
							let props = instance.stateNode ? instance.stateNode.props : instance.props;
							if (instance.stateNode && !Node.prototype.isPrototypeOf(instance.stateNode) && (instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name.split(" _ _ ")[0])) || instance.type && config.type && config.type.some(type => BDFDB.ArrayUtils.is(type) ? instance.type === type[1] : instance.type === type) || instance.key && config.key && config.key.some(key => instance.key == key) || props && config.props && config.props.every(prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => BDFDB.equals(props[prop[0]], checkValue)) : BDFDB.equals(props[prop[0]], prop[1])) : props[prop] !== undefined)) || config.filter && config.filter(instance)) {
								if (config.all === undefined || !config.all) result = instance.stateNode;
								else if (config.all) {
									if (!instance.stateNode.BDFDBreactSearch) {
										instance.stateNode.BDFDBreactSearch = true;
										if (config.group) {
											if (config.name && instance.type && (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type)) {
												let group = config.name.find(name => (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type) == name.split(" _ _ ")[0]) || "Default";
												if (!BDFDB.ArrayUtils.is(foundInstances[group])) foundInstances[group] = [];
												foundInstances[group].push(instance.stateNode);
											}
											else if (config.type && instance.type) {
												let group = [config.type.find(t => BDFDB.ArrayUtils.is(t) && instance.type === t[1])].flat(10)[0] || "Default";
												if (!BDFDB.ArrayUtils.is(foundInstances[group])) foundInstances[group] = [];
												foundInstances[group].push(instance.stateNode);
											}
										}
										else foundInstances.push(instance.stateNode);
									}
								}
							}
							if (result === undefined) {
								let keys = Object.getOwnPropertyNames(instance);
								for (let i = 0; result === undefined && i < keys.length; i++) {
									let key = keys[i];
									if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] === "function")) result = getOwner(instance[key]);
								}
							}
						}
						depth--;
						return result;
					}
				};
				BDFDB.ReactUtils.findParent = function (nodeOrInstance, config) {
					if (!nodeOrInstance || !BDFDB.ObjectUtils.is(config) || !config.name && !config.key && !config.props && !config.filter) return [null, -1];
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance) && !BDFDB.ArrayUtils.is(instance) || instance.props && typeof instance.props.children == "function") return [null, -1];
					config.name = config.name && [config.name].flat().filter(n => n);
					config.key = config.key && [config.key].flat().filter(n => n);
					config.props = config.props && [config.props].flat().filter(n => n);
					config.filter = typeof config.filter == "function" && config.filter;
					let parent = firstArray = instance;
					while (!BDFDB.ArrayUtils.is(firstArray) && firstArray.props && firstArray.props.children) firstArray = firstArray.props.children;
					if (!BDFDB.ArrayUtils.is(firstArray)) {
						if (parent && parent.props) {
							parent.props.children = [parent.props.children];
							firstArray = parent.props.children;
						}
						else firstArray = [];
					}
					return getParent(instance);
					function getParent (children) {
						let result = [firstArray, -1];
						if (!children) return result;
						if (!BDFDB.ArrayUtils.is(children)) {
							if (check(children)) result = found(children);
							else if (children.props && children.props.children) {
								parent = children;
								result = getParent(children.props.children);
							}
						}
						else {
							for (let i = 0; result[1] == -1 && i < children.length; i++) if (children[i]) {
								if (BDFDB.ArrayUtils.is(children[i])) {
									parent = children;
									result = getParent(children[i]);
								}
								else if (check(children[i])) {
									parent = children;
									result = found(children[i]);
								}
								else if (children[i].props && children[i].props.children) {
									parent = children[i];
									result = getParent(children[i].props.children);
								}
							}
						}
						return result;
					}
					function found (child) {
						if (BDFDB.ArrayUtils.is(parent)) return [parent, parent.indexOf(child)];
						else {
							parent.props.children = [];
							parent.props.children.push(child);
							return [parent.props.children, 0];
						}
					}
					function check (instance) {
						if (!instance) return false;
						let props = instance.stateNode ? instance.stateNode.props : instance.props;
						return instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name)) || config.key && config.key.some(key => instance.key == key) || props && config.props && config.props[config.someProps ? "some" : "every"](prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => propCheck(props, prop[0], checkValue)) : propCheck(props, prop[0], prop[1])) : props[prop] !== undefined) || config.filter && config.filter(instance);
					}
					function propCheck (props, key, value) {
						return key != null && props[key] != null && value != null && (key == "className" ? (" " + props[key] + " ").indexOf(" " + value + " ") > -1 : BDFDB.equals(props[key], value));
					}
				};
				BDFDB.ReactUtils.findProps = function (nodeOrInstance, config) {
					if (!BDFDB.ObjectUtils.is(config)) return null;
					if (!nodeOrInstance || !config.name && !config.key) return null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance)) return null;
					config.name = config.name && [config.name].flat().filter(n => n);
					config.key = config.key && [config.key].flat().filter(n => n);
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					let whitelist = config.up ? {return:true, sibling:true, _reactInternalFiber:true} : {child:true, sibling:true, _reactInternalFiber:true};
					return findProps(instance);

					function findProps (instance) {
						depth++;
						let result = undefined;
						if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
							if (instance.memoizedProps && (instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name.split(" _ _ ")[0])) || config.key && config.key.some(key => instance.key == key))) result = instance.memoizedProps;
							if (result === undefined) {
								let keys = Object.getOwnPropertyNames(instance);
								for (let i = 0; result === undefined && i < keys.length; i++) {
									let key = keys[i];
									if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] === "function")) result = findProps(instance[key]);
								}
							}
						}
						depth--;
						return result;
					}
				};
				BDFDB.ReactUtils.findValue = function (nodeOrInstance, searchKey, config = {}) {
					if (!BDFDB.ObjectUtils.is(config)) return null;
					if (!nodeOrInstance || typeof searchKey != "string") return config.all ? [] : null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance)) return config.all ? [] : null;
					instance = instance._reactInternalFiber || instance;
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					let whitelist = {
						props: true,
						state: true,
						stateNode: true,
						updater: true,
						prototype: true,
						type: true,
						children: config.up ? false : true,
						memoizedProps: true,
						memoizedState: true,
						child: config.up ? false : true,
						return: config.up ? true : false,
						sibling: config.up ? false : true
					};
					let blacklist = {
						contextSection: true
					};
					if (BDFDB.ObjectUtils.is(config.whitelist)) Object.assign(whitelist, config.whiteList);
					if (BDFDB.ObjectUtils.is(config.blacklist)) Object.assign(blacklist, config.blacklist);
					let foundKeys = [];
					let singleKey = getKey(instance);
					if (config.all) return foundKeys;
					else return singleKey;
					function getKey(instance) {
						depth++;
						let result = undefined;
						if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
							let keys = Object.getOwnPropertyNames(instance);
							for (let i = 0; result === undefined && i < keys.length; i++) {
								let key = keys[i];
								if (key && !blacklist[key]) {
									let value = instance[key];
									if (searchKey === key && (config.value === undefined || BDFDB.equals(config.value, value))) {
										if (config.all === undefined || !config.all) result = value;
										else if (config.all) {
											if (config.noCopies === undefined || !config.noCopies) foundKeys.push(value);
											else if (config.noCopies) {
												let copy = false;
												for (let foundKey of foundKeys) if (BDFDB.equals(value, foundKey)) {
													copy = true;
													break;
												}
												if (!copy) foundKeys.push(value);
											}
										}
									}
									else if ((typeof value === "object" || typeof value === "function") && (whitelist[key] || key[0] == "." || !isNaN(key[0]))) result = getKey(value);
								}
							}
						}
						depth--;
						return result;
					}
				};
				BDFDB.ReactUtils.forceUpdate = function (...instances) {
					for (let ins of instances.flat(10).filter(n => n)) if (ins.updater && typeof ins.updater.isMounted == "function" && ins.updater.isMounted(ins)) ins.forceUpdate();
				};
				BDFDB.ReactUtils.getInstance = function (node) {
					if (!BDFDB.ObjectUtils.is(node)) return null;
					return node[Object.keys(node).find(key => key.startsWith("__reactInternalInstance"))];
				};
				BDFDB.ReactUtils.isCorrectInstance = function (instance, name) {
					return instance && ((instance.type && (instance.type.render && instance.type.render.displayName === name || instance.type.displayName === name || instance.type.name === name || instance.type === name)) || instance.render && (instance.render.displayName === name || instance.render.name === name) || instance.displayName == name || instance.name === name);
				};
				BDFDB.ReactUtils.render = function (component, node) {
					if (!BDFDB.ReactUtils.isValidElement(component) || !Node.prototype.isPrototypeOf(node)) return;
					try {
						LibraryModules.ReactDOM.render(component, node);
						let observer = new MutationObserver(changes => changes.forEach(change => {
							let nodes = Array.from(change.removedNodes);
							if (nodes.indexOf(node) > -1 || nodes.some(n => n.contains(node))) {
								observer.disconnect();
								BDFDB.ReactUtils.unmountComponentAtNode(node);
							}
						}));
						observer.observe(document.body, {subtree:true, childList:true});
					}
					catch (err) {BDFDB.LogUtils.error("Could not render react element! " + err);}
				};

				let MessageRerenderTimeout;
				BDFDB.MessageUtils = {};
				BDFDB.MessageUtils.rerenderAll = function (instant) {
					BDFDB.TimeUtils.clear(MessageRerenderTimeout);
					MessageRerenderTimeout = BDFDB.TimeUtils.timeout(_ => {
						let channel = BDFDB.LibraryModules.ChannelStore.getChannel(BDFDB.LibraryModules.LastChannelStore.getChannelId());
						if (channel) {
							if (BDFDB.DMUtils.isDMChannel(channel)) BDFDB.DMUtils.markAsRead(channel);
							else BDFDB.ChannelUtils.markAsRead(channel);
						}
						let LayerProviderIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.messageswrapper), {name:"LayerProvider", unlimited:true, up:true});
						let LayerProviderPrototype = BDFDB.ObjectUtils.get(LayerProviderIns, "_reactInternalFiber.type.prototype");
						if (LayerProviderIns && LayerProviderPrototype) {
							BDFDB.PatchUtils.patch(BDFDB, LayerProviderPrototype, "render", {after: e => {
								e.returnValue.props.children = [];
							}}, {once: true});
							BDFDB.ReactUtils.forceUpdate(LayerProviderIns);
						}
					}, instant ? 0 : 1000);
				};
				BDFDB.MessageUtils.openMenu = function (message, e = mousePosition, slim = false) {
					if (!message) return;
					let channel = LibraryModules.ChannelStore.getChannel(message.channel_id);
					if (channel) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
						return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName(slim ? "MessageSearchResultContextMenu" : "MessageContextMenu", false) || {exports:{}}).exports.default, Object.assign({}, e, {
							message: message,
							channel: channel
						}));
					});
				};
					
				BDFDB.UserUtils = {};
				BDFDB.UserUtils.is = function (user) {
					return user && user instanceof BDFDB.DiscordObjects.User;
				};
				var myDataUser = LibraryModules.CurrentUserStore && LibraryModules.CurrentUserStore.getCurrentUser();
				BDFDB.UserUtils.me = new Proxy(myDataUser || {}, {
					get: function (list, item) {
						return (myDataUser = LibraryModules.CurrentUserStore.getCurrentUser()) && myDataUser[item];
					}
				});
				BDFDB.UserUtils.getStatus = function (id = BDFDB.UserUtils.me.id) {
					id = typeof id == "number" ? id.toFixed() : id;
					let activity = BDFDB.UserUtils.getActivity(id);
					return activity && activity.type == BDFDB.DiscordConstants.ActivityTypes.STREAMING ? "streaming" : LibraryModules.StatusMetaUtils.getStatus(id);
				};
				BDFDB.UserUtils.getStatusColor = function (status) {
					status = typeof status == "string" ? status.toLowerCase() : null;
					switch (status) {
						case "online": return BDFDB.DiscordConstants.Colors.STATUS_GREEN;
						case "mobile": return BDFDB.DiscordConstants.Colors.STATUS_GREEN;
						case "idle": return BDFDB.DiscordConstants.Colors.STATUS_YELLOW;
						case "dnd": return BDFDB.DiscordConstants.Colors.STATUS_RED;
						case "playing": return BDFDB.DiscordConstants.Colors.BRAND;
						case "listening": return BDFDB.DiscordConstants.Colors.SPOTIFY;
						case "streaming": return BDFDB.DiscordConstants.Colors.TWITCH;
						default: return BDFDB.DiscordConstants.Colors.STATUS_GREY;
					}
				};
				BDFDB.UserUtils.getActivity = function (id = BDFDB.UserUtils.me.id) {
					for (let activity of LibraryModules.StatusMetaUtils.getActivities(id)) if (activity.type != BDFDB.DiscordConstants.ActivityTypes.CUSTOM_STATUS) return activity;
					return null;
				};
				BDFDB.UserUtils.getAvatar = function (id = BDFDB.UserUtils.me.id) {
					let user = LibraryModules.UserStore.getUser(typeof id == "number" ? id.toFixed() : id);
					if (!user) return window.location.origin + "/assets/322c936a8c8be1b803cd94861bdfa868.png";
					else return ((user.avatar ? "" : window.location.origin) + LibraryModules.IconUtils.getUserAvatarURL(user)).split("?")[0];
				};
				BDFDB.UserUtils.can = function (permission, id = BDFDB.UserUtils.me.id, channelId = LibraryModules.LastChannelStore.getChannelId()) {
					if (!BDFDB.DiscordConstants.Permissions[permission]) BDFDB.LogUtils.warn(permission + " not found in Permissions");
					else {
						let channel = LibraryModules.ChannelStore.getChannel(channelId);
						if (channel) return LibraryModules.PermissionRoleUtils.can(BDFDB.DiscordConstants.Permissions[permission], id, channel);
					}
					return false;
				};
				BDFDB.UserUtils.openMenu = function (id, guildId, e = mousePosition) {
					if (!id || !guildId) return;
					let user = LibraryModules.UserStore.getUser(id);
					if (user) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
						return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("GuildChannelUserContextMenu", false) || {exports:{}}).exports.default, Object.assign({}, e, {
							user: user,
							guildId: guildId
						}));
					});
				};

				let GuildsRerenderTimeout;
				BDFDB.GuildUtils = {};
				BDFDB.GuildUtils.is = function (guild) {
					if (!BDFDB.ObjectUtils.is(guild)) return false;
					let keys = Object.keys(guild);
					return guild instanceof BDFDB.DiscordObjects.Guild || Object.keys(new BDFDB.DiscordObjects.Guild({})).every(key => keys.indexOf(key) > -1);
				};
				BDFDB.GuildUtils.getIcon = function (id) {
					let guild = LibraryModules.GuildStore.getGuild(typeof id == "number" ? id.toFixed() : id);
					if (!guild || !guild.icon) return null;
					return LibraryModules.IconUtils.getGuildIconURL(guild).split("?")[0];
				};
				BDFDB.GuildUtils.getBanner = function (id) {
					let guild = LibraryModules.GuildStore.getGuild(typeof id == "number" ? id.toFixed() : id);
					if (!guild || !guild.banner) return null;
					return LibraryModules.IconUtils.getGuildBannerURL(guild).split("?")[0];
				};
				BDFDB.GuildUtils.getFolder = function (id) {
					return BDFDB.LibraryModules.FolderStore.guildFolders.filter(n => n.folderId).find(n => n.guildIds.includes(id));
				};
				BDFDB.GuildUtils.getId = function (div) {
					if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
					let guilddiv = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, div);
					if (!guilddiv) return;
					let iconWrap = guilddiv.querySelector(BDFDB.dotCN.guildiconwrapper);
					let id = iconWrap && iconWrap.href ? iconWrap.href.split("/").slice(-2)[0] : null;
					return id && !isNaN(parseInt(id)) ? id.toString() : null;
				};
				BDFDB.GuildUtils.getData = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					id = typeof id == "number" ? id.toFixed() : id;
					for (let info of BDFDB.GuildUtils.getAll()) if (info && info.id == id) return info;
					return null;
				};
				BDFDB.GuildUtils.getAll = function () {
					let found = [], objs = [];
					for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guilds), {name:["Guild","GuildIcon"], all:true, unlimited:true})) {
						if (ins.props && ins.props.guild) objs.push(Object.assign(new ins.props.guild.constructor(ins.props.guild), {div:ins.handleContextMenu && BDFDB.ReactUtils.findDOMNode(ins), instance:ins}));
					}
					for (let id of BDFDB.LibraryModules.FolderStore.getFlattenedGuildIds()) {
						let foundobj = null;
						for (let obj of objs) if (obj.id == id) {
							foundobj = obj
							break;
						}
						if (foundobj) found.push(foundobj);
						else {
							let guild = BDFDB.LibraryModules.GuildStore.getGuild(id);
							if (guild) found.push(Object.assign(new guild.constructor(guild), {div:null, instance:null}))
						}
					}
					return found;
				};
				BDFDB.GuildUtils.getUnread = function (servers) {
					let found = [];
					for (let eleOrInfoOrId of servers === undefined || !BDFDB.ArrayUtils.is(servers) ? BDFDB.GuildUtils.getAll() : servers) {
						if (!eleOrInfoOrId) return null;
						let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
						id = typeof id == "number" ? id.toFixed() : id;
						if (id && (LibraryModules.UnreadGuildUtils.hasUnread(id) || LibraryModules.UnreadGuildUtils.getMentionCount(id) > 0)) found.push(eleOrInfoOrId);
					}
					return found;
				};
				BDFDB.GuildUtils.getPinged = function (servers) {
					let found = [];
					for (let eleOrInfoOrId of servers === undefined || !BDFDB.ArrayUtils.is(servers) ? BDFDB.GuildUtils.getAll() : servers) {
						if (!eleOrInfoOrId) return null;
						let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
						id = typeof id == "number" ? id.toFixed() : id;
						if (id && LibraryModules.UnreadGuildUtils.getMentionCount(id) > 0) found.push(eleOrInfoOrId);
					}
					return found;
				};
				BDFDB.GuildUtils.getMuted = function (servers) {
					let found = [];
					for (let eleOrInfoOrId of servers === undefined || !BDFDB.ArrayUtils.is(servers) ? BDFDB.GuildUtils.getAll() : servers) {
						if (!eleOrInfoOrId) return null;
						let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
						id = typeof id == "number" ? id.toFixed() : id;
						if (id && LibraryModules.MutedUtils.isGuildOrCategoryOrChannelMuted(id)) found.push(eleOrInfoOrId);
					}
					return found;
				};
				BDFDB.GuildUtils.getSelected = function () {
					let info = LibraryModules.GuildStore.getGuild(LibraryModules.LastGuildStore.getGuildId());
					if (info) return BDFDB.GuildUtils.getData(info.id) || Object.assign(new info.constructor(info), {div:null, instance:null});
					else return null;
				};
				BDFDB.GuildUtils.openMenu = function (eleOrInfoOrId, e = mousePosition) {
					if (!eleOrInfoOrId) return;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					let guild = LibraryModules.GuildStore.getGuild(id);
					if (guild) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
						return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("GuildContextMenu", false) || {exports:{}}).exports.default, Object.assign({}, e, {
							guild: guild
						}));
					});
				};
				BDFDB.GuildUtils.markAsRead = function (guilds) {
					if (!guilds) return;
					let unreadChannels = [];
					for (let guild of [guilds].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						let id = Node.prototype.isPrototypeOf(guild) ? BDFDB.GuildUtils.getId(guild) : (guild && typeof guild == "object" ? guild.id : guild);
						let channels = id && LibraryModules.GuildChannelStore.getChannels(id);
						if (channels) for (let type in channels) if (BDFDB.ArrayUtils.is(channels[type])) for (let channelObj of channels[type]) unreadChannels.push(channelObj.channel.id);
					}
					if (unreadChannels.length) BDFDB.ChannelUtils.markAsRead(unreadChannels);
				};
				BDFDB.GuildUtils.rerenderAll = function (instant) {
					BDFDB.TimeUtils.clear(GuildsRerenderTimeout);
					GuildsRerenderTimeout = BDFDB.TimeUtils.timeout(_ => {
						let GuildsIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.app), {name:"Guilds", unlimited:true});
						let GuildsPrototype = BDFDB.ObjectUtils.get(GuildsIns, "_reactInternalFiber.type.prototype");
						if (GuildsIns && GuildsPrototype) {
							let injectPlaceholder = returnValue => {
								let [children, index] = BDFDB.ReactUtils.findParent(returnValue, {name: "ConnectedUnreadDMs"});
								if (index > -1) children.splice(index + 1, 0, BDFDB.ReactUtils.createElement("div", {}));
								BDFDB.ReactUtils.forceUpdate(GuildsIns);
							};
							BDFDB.PatchUtils.patch(BDFDB, GuildsPrototype, "render", {after: e => {
								if (typeof e.returnValue.props.children == "function") {
									let childrenRender = e.returnValue.props.children;
									e.returnValue.props.children = (...args) => {
										let children = childrenRender(...args);
										injectPlaceholder(children);
										return children;
									};
								}
								else injectPlaceholder(e.returnValue);
							}}, {once: true});
							BDFDB.ReactUtils.forceUpdate(GuildsIns);
						}
					}, instant ? 0 : 1000);
				};

				BDFDB.FolderUtils = {};
				BDFDB.FolderUtils.getId = function (div) {
					if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
					div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildfolderwrapper, div);
					if (!div) return;
					return BDFDB.ReactUtils.findValue(div, "folderId", {up:true});
				};
				BDFDB.FolderUtils.getDefaultName = function (folderId) {
					let folder = BDFDB.LibraryModules.FolderStore.getGuildFolderById(folderId);
					if (!folder) return "";
					let rest = 2 * BDFDB.DiscordConstants.MAX_GUILD_FOLDER_NAME_LENGTH;
					let names = [], allNames = folder.guildIds.map(guildId => (BDFDB.LibraryModules.GuildStore.getGuild(guildId) || {}).name).filter(n => n);
					for (let name of allNames) if (name.length < rest || names.length === 0) {
						names.push(name);
						rest -= name.length;
					}
					return names.join(", ") + (names.length < allNames.length ? ", ..." : "");
				};
				BDFDB.FolderUtils.getDiv = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let info = BDFDB.FolderUtils.getData(eleOrInfoOrId);
					return info ? info.div : null;
				};
				BDFDB.FolderUtils.getData = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.FolderUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					id = typeof id == "number" ? id.toFixed() : id;
					for (let info of BDFDB.FolderUtils.getAll()) if (info && info.folderId == id) return info;
					return null;
				};
				BDFDB.FolderUtils.getAll = function () {
					let found = [];
					for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guildswrapper), {name:"GuildFolder", all:true, unlimited:true})) {
						if (ins.props && ins.props.folderId) found.push(Object.assign({}, ins.props, {div:BDFDB.ReactUtils.findDOMNode(ins), instance:ins}));
					}
					return found;
				};

				let ChannelsRerenderTimeout;
				BDFDB.ChannelUtils = {};
				BDFDB.ChannelUtils.is = function (channel) {
					if (!BDFDB.ObjectUtils.is(channel)) return false;
					let keys = Object.keys(channel);
					return channel instanceof BDFDB.DiscordObjects.Channel || Object.keys(new BDFDB.DiscordObjects.Channel({})).every(key => keys.indexOf(key) > -1);
				};
				BDFDB.ChannelUtils.isTextChannel = function (channelOrId) {
					let channel = typeof channelOrId == "string" ? LibraryModules.ChannelStore.getChannel(channelOrId) : channelOrId;
					return BDFDB.ObjectUtils.is(channel) && (channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_TEXT || channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_STORE || channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_ANNOUNCEMENT);
				};
				BDFDB.ChannelUtils.getId = function (div) {
					if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
					div = BDFDB.DOMUtils.getParent(BDFDB.dotCNC.categorycontainerdefault + BDFDB.dotCNC.channelcontainerdefault + BDFDB.dotCN.dmchannel, div);
					if (!div) return;
					let info = BDFDB.ReactUtils.findValue(div, "channel");
					return info ? info.id.toString() : null;
				};
				BDFDB.ChannelUtils.getDiv = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let info = BDFDB.ChannelUtils.getData(eleOrInfoOrId);
					return info ? info.div : null;
				};
				BDFDB.ChannelUtils.getData = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.ChannelUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					id = typeof id == "number" ? id.toFixed() : id;
					for (let info of BDFDB.ChannelUtils.getAll()) if (info && info.id == id) return info;
					return null;
				};
				BDFDB.ChannelUtils.getName = function (id, addPrefix) {
					let channel = BDFDB.LibraryModules.ChannelStore.getChannel(id);
					if (!channel) return "";
					switch (channel.type) {
						case BDFDB.DiscordConstants.ChannelTypes.DM:
							let user = channel.recipients.map(BDFDB.LibraryModules.UserStore.getUser).filter(n => n)[0];
							return (addPrefix && "@" || "") + (user && user.toString() || "");
						case BDFDB.DiscordConstants.ChannelTypes.GROUP_DM:
							if (channel.name) return channel.name;
							let users = channel.recipients.map(BDFDB.LibraryModules.UserStore.getUser).filter(n => n);
							return users.length > 0 ? users.map(user => user.toString).join(", ") : BDFDB.LanguageUtils.LanguageStrings.UNNAMED;
						case BDFDB.DiscordConstants.ChannelTypes.GUILD_ANNOUNCEMENT:
						case BDFDB.DiscordConstants.ChannelTypes.GUILD_TEXT:
							return (addPrefix && "#" || "") + channel.name;
						default:
							return channel.name
					}
				};
				BDFDB.ChannelUtils.getAll = function () {
					let found = [];
					for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.channels), {name: ["ChannelCategoryItem", "ChannelItem", "PrivateChannel"], all:true, unlimited:true})) if (ins.props && !ins.props.ispin && ins.props.channel && ins._reactInternalFiber.return) {
						let div = BDFDB.ReactUtils.findDOMNode(ins);
						div = div && BDFDB.DOMUtils.containsClass(div.parentElement, BDFDB.disCN.categorycontainerdefault, BDFDB.disCN.channelcontainerdefault, false) ? div.parentElement : div;
						found.push(Object.assign(new ins.props.channel.constructor(ins.props.channel), {div, instance:ins}));
					}
					return found;
				};
				BDFDB.ChannelUtils.getSelected = function () {
					let info = LibraryModules.ChannelStore.getChannel(LibraryModules.LastChannelStore.getChannelId());
					if (info) return BDFDB.ChannelUtils.getData(info.id) || Object.assign(new info.constructor(info), {div:null, instance:null});
					else return null;
				};
				BDFDB.ChannelUtils.markAsRead = function (channels) {
					if (!channels) return;
					let unreadChannels = [];
					for (let channel of [channels].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						let id = Node.prototype.isPrototypeOf(channel) ? BDFDB.ChannelUtils.getId(channel) : (channel && typeof channel == "object" ? channel.id : channel);
						if (id && BDFDB.ChannelUtils.isTextChannel(id)) unreadChannels.push({
							channelId: id,
							messageId: LibraryModules.UnreadChannelUtils.lastMessageId(id)
						});
					}
					if (unreadChannels.length) LibraryModules.AckUtils.bulkAck(unreadChannels);
				};
				BDFDB.ChannelUtils.rerenderAll = function (instant) {
					BDFDB.TimeUtils.clear(ChannelsRerenderTimeout);
					ChannelsRerenderTimeout = BDFDB.TimeUtils.timeout(_ => {
						let ChannelsIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guildchannels), {name:"Channels", unlimited:true});
						let ChannelsPrototype = BDFDB.ObjectUtils.get(ChannelsIns, "_reactInternalFiber.type.prototype");
						if (ChannelsIns && ChannelsPrototype) {
							BDFDB.PatchUtils.patch(BDFDB, ChannelsPrototype, "render", {after: e => {
								e.returnValue.props.children = typeof e.returnValue.props.children == "function" ? (_ => {return null;}) : [];
								BDFDB.ReactUtils.forceUpdate(ChannelsIns);
							}}, {once: true});
							BDFDB.ReactUtils.forceUpdate(ChannelsIns);
						}
					}, instant ? 0 : 1000);
				};
				
				BDFDB.DMUtils = {};
				BDFDB.DMUtils.isDMChannel = function (channelOrId) {
					let channel = typeof channelOrId == "string" ? LibraryModules.ChannelStore.getChannel(channelOrId) : channelOrId;
					return BDFDB.ObjectUtils.is(channel) && (channel.type == BDFDB.DiscordConstants.ChannelTypes.DM || channel.type == BDFDB.DiscordConstants.ChannelTypes.GROUP_DM);
				};
				BDFDB.DMUtils.getIcon = function (id) {
					let channel = LibraryModules.ChannelStore.getChannel(id = typeof id == "number" ? id.toFixed() : id);
					if (!channel) return null;
					if (!channel.icon) return channel.type == 1 ? BDFDB.UserUtils.getAvatar(channel.recipients[0]) : (channel.type == 3 ? window.location.origin + LibraryModules.IconUtils.getChannelIconURL(channel).split("?")[0] : null);
					return LibraryModules.IconUtils.getChannelIconURL(channel).split("?")[0];
				};
				BDFDB.DMUtils.getId = function (div) {
					if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
					let dmdiv = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, div);
					if (!dmdiv) return;
					let iconWrap = dmdiv.querySelector(BDFDB.dotCN.guildiconwrapper);
					let id = iconWrap && iconWrap.href ? iconWrap.href.split("/").slice(-1)[0] : null;
					return id && !isNaN(parseInt(id)) ? id.toString() : null;
				};
				BDFDB.DMUtils.getDiv = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					if (Node.prototype.isPrototypeOf(eleOrInfoOrId)) {
						var div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, eleOrInfoOrId);
						return div ? div.parentElement : div;
					}
					else {
						let id = typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId;
						if (id) {
							var div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, document.querySelector(`${BDFDB.dotCNS.guilds + BDFDB.dotCN.dmpill + " + * " + BDFDB.dotCN.guildiconwrapper}[href*="/channels/@me/${id}"]`));
							return div && BDFDB? div.parentElement : div;
						}
					}
					return null;
				};
				BDFDB.DMUtils.getData = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.BDFDB.DMUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					id = typeof id == "number" ? id.toFixed() : id;
					for (let info of BDFDB.DMUtils.getAll()) if (info && info.id == id) return info;
					return null;
				};
				BDFDB.DMUtils.getAll = function () {
					let found = [];
					for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guilds), {name:"DirectMessage", all:true, unlimited:true})) {
						if (ins.props && ins.props.channel) found.push(Object.assign(new ins.props.channel.constructor(ins.props.channel), {div:BDFDB.ReactUtils.findDOMNode(ins), instance:ins}));
					}
					return found;
				};
				BDFDB.DMUtils.openMenu = function (eleOrInfoOrId, e = mousePosition) {
					if (!eleOrInfoOrId) return;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.ChannelUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					let channel = LibraryModules.ChannelStore.getChannel(id);
					if (channel) {
						if (channel.isMultiUserDM()) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
							return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("GroupDMContextMenu", false) || {exports:{}}).exports.default, Object.assign({}, e, {
								channel: channel,
								selected: channel.id == LibraryModules.LastChannelStore.getChannelId()
							}));
						});
						else LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
							return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("DMUserContextMenu", false) || {exports:{}}).exports.default, Object.assign({}, e, {
								user: LibraryModules.UserStore.getUser(channel.recipients[0]),
								channel: channel,
								selected: channel.id == LibraryModules.LastChannelStore.getChannelId()
							}));
						});
					}
				};
				BDFDB.DMUtils.markAsRead = function (dms) {
					if (!dms) return;
					let unreadChannels = [];
					for (let dm of [dms].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						let id = Node.prototype.isPrototypeOf(dm) ? BDFDB.BDFDB.DMUtils.getId(dm) : (dm && typeof dm == "object" ? dm.id : dm);
						if (id) unreadChannels.push(id);
					}
					for (let i in unreadChannels) BDFDB.TimeUtils.timeout(_ => {LibraryModules.AckUtils.ack(unreadChannels[i]);}, i * 1000);
				};

				InternalBDFDB.writeConfig = function (path, config) {
					try {LibraryRequires.fs.writeFileSync(path, JSON.stringify(config, null, "	"));}
					catch (err) {}
				};
				InternalBDFDB.readConfig = function (path) {
					try {return JSON.parse(LibraryRequires.fs.readFileSync(path));}
					catch (err) {return {};}
				};
				
				BDFDB.DataUtils = {};
				BDFDB.DataUtils.save = function (data, plugin, key, id) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					let pluginName = typeof plugin === "string" ? plugin : plugin.name;
					let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
					let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
					
					let config = Cache.data[pluginName] !== undefined ? Cache.data[pluginName] : (InternalBDFDB.readConfig(configPath) || {});
					
					if (key === undefined) config = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
					else {
						if (id === undefined) config[key] = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
						else {
							if (!BDFDB.ObjectUtils.is(config[key])) config[key] = {};
							config[key][id] = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
						}
					}
					
					let configIsObject = BDFDB.ObjectUtils.is(config);
					if (key !== undefined && configIsObject && BDFDB.ObjectUtils.is(config[key]) && BDFDB.ObjectUtils.isEmpty(config[key])) delete config[key];
					if (BDFDB.ObjectUtils.isEmpty(config)) {
						delete Cache.data[pluginName];
						if (LibraryRequires.fs.existsSync(configPath)) LibraryRequires.fs.unlinkSync(configPath);
					}
					else {
						if (configIsObject) config = BDFDB.ObjectUtils.sort(config);
						Cache.data[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
						InternalBDFDB.writeConfig(configPath, config);
					}
				};

				BDFDB.DataUtils.load = function (plugin, key, id) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					let pluginName = typeof plugin === "string" ? plugin : plugin.name;
					let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
					let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
					
					let config = Cache.data[pluginName] !== undefined ? Cache.data[pluginName] : (InternalBDFDB.readConfig(configPath) || {});
					let configIsObject = BDFDB.ObjectUtils.is(config);
					Cache.data[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
					
					if (key === undefined) return config;
					else {
						let keydata = configIsObject ? (BDFDB.ObjectUtils.is(config[key]) || config[key] == undefined ? BDFDB.ObjectUtils.deepAssign({}, config[key]) : config[key]) : null;
						if (id === undefined) return keydata;
						else return !BDFDB.ObjectUtils.is(keydata) || keydata[id] === undefined ? null : keydata[id];
					}
				};
				BDFDB.DataUtils.remove = function (plugin, key, id) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					let pluginName = typeof plugin === "string" ? plugin : plugin.name;
					let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
					let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
					
					let config = Cache.data[pluginName] !== undefined ? Cache.data[pluginName] : (InternalBDFDB.readConfig(configPath) || {});
					let configIsObject = BDFDB.ObjectUtils.is(config);
					
					if (key === undefined || !configIsObject) config = {};
					else {
						if (id === undefined) delete config[key];
						else if (BDFDB.ObjectUtils.is(config[key])) delete config[key][id];
					}
					
					if (BDFDB.ObjectUtils.is(config[key]) && BDFDB.ObjectUtils.isEmpty(config[key])) delete config[key];
					if (BDFDB.ObjectUtils.isEmpty(config)) {
						delete Cache.data[pluginName];
						if (LibraryRequires.fs.existsSync(configPath)) LibraryRequires.fs.unlinkSync(configPath);
					}
					else {
						if (configIsObject) config = BDFDB.ObjectUtils.sort(config);
						Cache.data[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
						InternalBDFDB.writeConfig(configPath, config);
					}
				};
				BDFDB.DataUtils.get = function (plugin, key, id) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					plugin = typeof plugin == "string" ? BDFDB.BDUtils.getPlugin(plugin) : plugin;
					if (!BDFDB.ObjectUtils.is(plugin)) return id === undefined ? {} : null;
					let defaults = plugin.defaults;
					if (!BDFDB.ObjectUtils.is(defaults) || !defaults[key]) return id === undefined ? {} : null;
					let oldC = BDFDB.DataUtils.load(plugin, key), newC = {}, update = false;
					for (let k in defaults[key]) {
						let isObj = BDFDB.ObjectUtils.is(defaults[key][k].value);
						if (oldC[k] == null || isObj && (!BDFDB.ObjectUtils.is(oldC[k]) || Object.keys(defaults[key][k].value).some(n => defaults[key][k].value[n] != null && !BDFDB.sameProto(defaults[key][k].value[n], oldC[k][n])))) {
							newC[k] = isObj ? BDFDB.ObjectUtils.deepAssign({}, defaults[key][k].value) : defaults[key][k].value;
							update = true;
						}
						else newC[k] = oldC[k];
					}
					if (update) BDFDB.DataUtils.save(newC, plugin, key);
					
					if (id === undefined) return newC;
					else return newC[id] === undefined ? null : newC[id];
				};
				
				BDFDB.ColorUtils = {};
				BDFDB.ColorUtils.convert = function (color, conv, type) {
					if (BDFDB.ObjectUtils.is(color)) {
						var newColor = {};
						for (let pos in color) newColor[pos] = BDFDB.ColorUtils.convert(color[pos], conv, type);
						return newColor;
					}
					else {
						conv = conv === undefined || !conv ? conv = "RGBCOMP" : conv.toUpperCase();
						type = type === undefined || !type || !["RGB", "RGBA", "RGBCOMP", "HSL", "HSLA", "HSLCOMP", "HEX", "HEXA", "INT"].includes(type.toUpperCase()) ? BDFDB.ColorUtils.getType(color) : type.toUpperCase();
						if (conv == "RGBCOMP") {
							switch (type) {
								case "RGBCOMP":
									if (color.length == 3) return processRGB(color);
									else if (color.length == 4) {
										let a = processA(color.pop());
										return processRGB(color).concat(a);
									}
									break;
								case "RGB":
									return processRGB(color.replace(/\s/g, "").slice(4, -1).split(","));
								case "RGBA":
									let comp = color.replace(/\s/g, "").slice(5, -1).split(",");
									let a = processA(comp.pop());
									return processRGB(comp).concat(a);
								case "HSLCOMP":
									if (color.length == 3) return BDFDB.ColorUtils.convert(`hsl(${processHSL(color).join(",")})`, "RGBCOMP");
									else if (color.length == 4) {
										let a = processA(color.pop());
										return BDFDB.ColorUtils.convert(`hsl(${processHSL(color).join(",")})`, "RGBCOMP").concat(a);
									}
									break;
								case "HSL":
									var hslcomp = processHSL(color.replace(/\s/g, "").slice(4, -1).split(","));
									var r, g, b, m, c, x, p, q;
									var h = hslcomp[0] / 360, l = parseInt(hslcomp[1]) / 100, s = parseInt(hslcomp[2]) / 100; m = Math.floor(h * 6); c = h * 6 - m; x = s * (1 - l); p = s * (1 - c * l); q = s * (1 - (1 - c) * l);
									switch (m % 6) {
										case 0: r = s, g = q, b = x; break;
										case 1: r = p, g = s, b = x; break;
										case 2: r = x, g = s, b = q; break;
										case 3: r = x, g = p, b = s; break;
										case 4: r = q, g = x, b = s; break;
										case 5: r = s, g = x, b = p; break;
									}
									return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
								case "HSLA":
									var hslcomp = color.replace(/\s/g, "").slice(5, -1).split(",");
									return BDFDB.ColorUtils.convert(`hsl(${hslcomp.slice(0, 3).join(",")})`, "RGBCOMP").concat(processA(hslcomp.pop()));
								case "HEX":
									var hex = /^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$|^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
									return [parseInt(hex[1] + hex[1] || hex[4], 16).toString(), parseInt(hex[2] + hex[2] || hex[5], 16).toString(), parseInt(hex[3] + hex[3] || hex[6], 16).toString()];
								case "HEXA":
									var hex = /^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$|^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
									return [parseInt(hex[1] + hex[1] || hex[5], 16).toString(), parseInt(hex[2] + hex[2] || hex[6], 16).toString(), parseInt(hex[3] + hex[3] || hex[7], 16).toString(), Math.floor(BDFDB.NumberUtils.mapRange([0, 255], [0, 100], parseInt(hex[4] + hex[4] || hex[8], 16).toString()))/100];
								case "INT":
									color = processINT(color);
									return [(color >> 16 & 255).toString(), (color >> 8 & 255).toString(), (color & 255).toString()];
								default:
									return null;
							}
						}
						else {
							if (conv && type && conv.indexOf("HSL") == 0 && type.indexOf("HSL") == 0) {
								if (type == "HSLCOMP") {
									switch (conv) {
										case "HSLCOMP":
											if (color.length == 3) return processHSL(color);
											else if (color.length == 4) {
												var a = processA(color.pop());
												return processHSL(color).concat(a);
											}
											break;
										case "HSL":
											return `hsl(${processHSL(color.slice(0, 3)).join(",")})`;
										case "HSLA":
											color = color.slice(0, 4);
											var a = color.length == 4 ? processA(color.pop()) : 1;
											return `hsla(${processHSL(color).concat(a).join(",")})`;
									}
								}
								else return BDFDB.ColorUtils.convert(color.replace(/\s/g, "").slice(color.toLowerCase().indexOf("hsla") == 0 ? 5 : 4, -1).split(","), conv, "HSLCOMP");
							}
							else {
								let rgbcomp = type == "RGBCOMP" ? color : BDFDB.ColorUtils.convert(color, "RGBCOMP", type);
								if (rgbcomp) switch (conv) {
									case "RGB":
										return `rgb(${processRGB(rgbcomp.slice(0, 3)).join(",")})`;
									case "RGBA":
										rgbcomp = rgbcomp.slice(0, 4);
										var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : 1;
										return `rgba(${processRGB(rgbcomp).concat(a).join(",")})`;
									case "HSLCOMP":
										var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : null;
										var hslcomp = processHSL(BDFDB.ColorUtils.convert(rgbcomp, "HSL").replace(/\s/g, "").split(","));
										return a != null ? hslcomp.concat(a) : hslcomp;
									case "HSL":
										var r = processC(rgbcomp[0]), g = processC(rgbcomp[1]), b = processC(rgbcomp[2]);
										var max = Math.max(r, g, b), min = Math.min(r, g, b), dif = max - min, h, l = max === 0 ? 0 : dif / max, s = max / 255;
										switch (max) {
											case min: h = 0; break;
											case r: h = g - b + dif * (g < b ? 6 : 0); h /= 6 * dif; break;
											case g: h = b - r + dif * 2; h /= 6 * dif; break;
											case b: h = r - g + dif * 4; h /= 6 * dif; break;
										}
										return `hsl(${processHSL([Math.round(h * 360), l * 100, s * 100]).join(",")})`;
									case "HSLA":
										var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : 1;
										return `hsla(${BDFDB.ColorUtils.convert(rgbcomp, "HSL").slice(4, -1).split(",").concat(a).join(",")})`;
									case "HEX":
										return ("#" + (0x1000000 + (rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16)).toString(16).slice(1)).toUpperCase();
									case "HEXA":
										return ("#" + (0x1000000 + (rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16)).toString(16).slice(1) + (0x100 + Math.round(BDFDB.NumberUtils.mapRange([0, 100], [0, 255], processA(rgbcomp[3]) * 100))).toString(16).slice(1)).toUpperCase();
									case "INT":
										return processINT(rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16);
									default:
										return null;
								}
							}
						}
					}
					return null;
					function processC(c) {if (c == null) {return 255;} else {c = parseInt(c.toString().replace(/[^0-9\-]/g, ""));return isNaN(c) || c > 255 ? 255 : c < 0 ? 0 : c;}};
					function processRGB(comp) {return comp.map(c => {return processC(c);});};
					function processA(a) {if (a == null) {return 1;} else {a = a.toString();a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));return isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;}};
					function processSL(sl) {if (sl == null) {return "100%";} else {sl = parseFloat(sl.toString().replace(/[^0-9\.\-]/g, ""));return (isNaN(sl) || sl > 100 ? 100 : sl < 0 ? 0 : sl) + "%";}};
					function processHSL(comp) {let h = parseFloat(comp.shift().toString().replace(/[^0-9\.\-]/g, ""));h = isNaN(h) || h > 360 ? 360 : h < 0 ? 0 : h;return [h].concat(comp.map(sl => {return processSL(sl);}));};
					function processINT(c) {if (c == null) {return 16777215;} else {c = parseInt(c.toString().replace(/[^0-9]/g, ""));return isNaN(c) || c > 16777215 ? 16777215 : c < 0 ? 0 : c;}};
				};
				BDFDB.ColorUtils.setAlpha = function (color, a, conv) {
					if (BDFDB.ObjectUtils.is(color)) {
						var newcolor = {};
						for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.setAlpha(color[pos], a, conv);
						return newcolor;
					}
					else {
						var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
						if (comp) {
							a = a.toString();
							a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));
							a = isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;
							comp[3] = a;
							conv = (conv || BDFDB.ColorUtils.getType(color)).toUpperCase();
							conv = conv == "RGB" || conv == "HSL" || conv == "HEX" ? conv + "A" : conv;
							return BDFDB.ColorUtils.convert(comp, conv);
						}
					}
					return null;
				};
				BDFDB.ColorUtils.getAlpha = function (color) {
					var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
					if (comp) {
						if (comp.length == 3) return 1;
						else if (comp.length == 4) {
							let a = comp[3].toString();
							a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));
							return isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;
						}
					}
					return null;
				};
				BDFDB.ColorUtils.change = function (color, value, conv) {
					value = parseFloat(value);
					if (color != null && typeof value == "number" && !isNaN(value)) {
						if (BDFDB.ObjectUtils.is(color)) {
							var newcolor = {};
							for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.change(color[pos], value, conv);
							return newcolor;
						}
						else {
							var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
							if (comp) {
								if (parseInt(value) !== value) {
									value = value.toString();
									value = (value.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(value.replace(/[^0-9\.\-]/g, ""));
									value = isNaN(value) ? 0 : value;
									return BDFDB.ColorUtils.convert([Math.round(comp[0] * (1 + value)), Math.round(comp[1] * (1 + value)), Math.round(comp[2] * (1 + value))], conv || BDFDB.ColorUtils.getType(color));
								}
								else return BDFDB.ColorUtils.convert([Math.round(comp[0] + value), Math.round(comp[1] + value), Math.round(comp[2] + value)], conv || BDFDB.ColorUtils.getType(color));
							}
						}
					}
					return null;
				};
				BDFDB.ColorUtils.invert = function (color, conv) {
					if (BDFDB.ObjectUtils.is(color)) {
						var newcolor = {};
						for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.invert(color[pos], conv);
						return newcolor;
					}
					else {
						var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
						if (comp) return BDFDB.ColorUtils.convert([255 - comp[0], 255 - comp[1], 255 - comp[2]], conv || BDFDB.ColorUtils.getType(color));
					}
					return null;
				};
				BDFDB.ColorUtils.compare = function (color1, color2) {
					if (color1 && color2) {
						color1 = BDFDB.ColorUtils.convert(color1, "RGBA");
						color2 = BDFDB.ColorUtils.convert(color2, "RGBA");
						if (color1 && color2) return BDFDB.equals(color1, color2);
					}
					return null;
				};
				BDFDB.ColorUtils.isBright = function (color, compare = 160) {
					color = BDFDB.ColorUtils.convert(color, "RGBCOMP");
					if (!color) return false;
					return parseInt(compare) < Math.sqrt(0.299 * color[0]**2 + 0.587 * color[1]**2 + 0.144 * color[2]**2);
				};
				BDFDB.ColorUtils.getType = function (color) {
					if (color != null) {
						if (typeof color === "object" && (color.length == 3 || color.length == 4)) {
							if (isRGB(color)) return "RGBCOMP";
							else if (isHSL(color)) return "HSLCOMP";
						}
						else if (typeof color === "string") {
							if (/^#[a-f\d]{3}$|^#[a-f\d]{6}$/i.test(color)) return "HEX";
							else if (/^#[a-f\d]{4}$|^#[a-f\d]{8}$/i.test(color)) return "HEXA";
							else {
								color = color.toUpperCase();
								var comp = color.replace(/[^0-9\.\-\,\%]/g, "").split(",");
								if (color.indexOf("RGB(") == 0 && comp.length == 3 && isRGB(comp)) return "RGB";
								else if (color.indexOf("RGBA(") == 0 && comp.length == 4 && isRGB(comp)) return "RGBA";
								else if (color.indexOf("HSL(") == 0 && comp.length == 3 && isHSL(comp)) return "HSL";
								else if (color.indexOf("HSLA(") == 0 && comp.length == 4 && isHSL(comp)) return "HSLA";
							}
						}
						else if (typeof color === "number" && parseInt(color) == color && color > -1 && color < 16777216) return "INT";
					}
					return null;
					function isRGB(comp) {return comp.slice(0, 3).every(rgb => rgb.toString().indexOf("%") == -1 && parseFloat(rgb) == parseInt(rgb));};
					function isHSL(comp) {return comp.slice(1, 3).every(hsl => hsl.toString().indexOf("%") == hsl.length - 1);};
				};
				BDFDB.ColorUtils.createGradient = function (colorObj, direction = "to right") {
					let gradientString = "linear-gradient(" + direction;
					for (let pos of Object.keys(colorObj).sort()) {
						let color = BDFDB.ColorUtils.convert(colorObj[pos], "RGBA");
						gradientString += color ? `, ${color} ${pos*100}%` : ''
					}
					return gradientString += ")";
				};
				BDFDB.ColorUtils.getSwatchColor = function (container, number) {
					if (!Node.prototype.isPrototypeOf(container)) return;
					let swatches = container.querySelector(`${BDFDB.dotCN.colorpickerswatches}[number="${number}"], ${BDFDB.dotCN.colorpickerswatch}[number="${number}"]`);
					if (!swatches) return null;
					return BDFDB.ColorUtils.convert(BDFDB.ReactUtils.findValue(BDFDB.ReactUtils.getInstance(swatches), "selectedColor", {up:true, blacklist:{"props":true}}));
				};

				BDFDB.DOMUtils = {};
				BDFDB.DOMUtils.getSelection = function () {
					let selection = document.getSelection();
					return selection && selection.anchorNode ? selection.getRangeAt(0).toString() : "";
				};
				BDFDB.DOMUtils.addClass = function (eles, ...classes) {
					if (!eles || !classes) return;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) add(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) add(e);
						else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) add(n);
					}
					function add(node) {
						if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.add(c);
					}
				};
				BDFDB.DOMUtils.removeClass = function (eles, ...classes) {
					if (!eles || !classes) return;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) remove(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) remove(e);
						else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) remove(n);
					}
					function remove(node) {
						if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.remove(c);
					}
				};
				BDFDB.DOMUtils.toggleClass = function (eles, ...classes) {
					if (!eles || !classes) return;
					var force = classes.pop();
					if (typeof force != "boolean") {
						classes.push(force);
						force = undefined;
					}
					if (!classes.length) return;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) toggle(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) toggle(e);
						else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) toggle(n);
					}
					function toggle(node) {
						if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.toggle(c, force);
					}
				};
				BDFDB.DOMUtils.containsClass = function (eles, ...classes) {
					if (!eles || !classes) return;
					let all = classes.pop();
					if (typeof all != "boolean") {
						classes.push(all);
						all = true;
					}
					if (!classes.length) return;
					let contained = undefined;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) contains(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) contains(e);
						else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) for (let n of document.querySelectorAll(c)) contains(n);
					}
					return contained;
					function contains(node) {
						if (node && node.classList) for (let cla of classes) if (typeof cla == "string") for (let c of cla.split(" ")) if (c) {
							if (contained === undefined) contained = all;
							if (all && !node.classList.contains(c)) contained = false;
							if (!all && node.classList.contains(c)) contained = true;
						}
					}
				};
				BDFDB.DOMUtils.replaceClass = function (eles, oldclass, newclass) {
					if (!eles || typeof oldclass != "string" || typeof newclass != "string") return;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) replace(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) replace(e);
						else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) replace(n);
					}
					function replace(node) {
						if (node && node.tagName && node.className) node.className = node.className.replace(new RegExp(oldclass, "g"), newclass).trim();
					}
				};
				BDFDB.DOMUtils.formatClassName = function (...classes) {
					return BDFDB.ArrayUtils.removeCopies(classes.flat(10).filter(n => n).join(" ").split(" ")).join(" ").trim();
				};
				BDFDB.DOMUtils.removeClassFromDOM = function (...classes) {
					for (let c of classes.flat(10).filter(n => n)) if (typeof c == "string") for (let a of c.split(",")) if (a && (a = a.replace(/\.|\s/g, ""))) BDFDB.DOMUtils.removeClass(document.querySelectorAll("." + a), a);
				};
				BDFDB.DOMUtils.show = function (...eles) {
					BDFDB.DOMUtils.toggle(...eles, true);
				};
				BDFDB.DOMUtils.hide = function (...eles) {
					BDFDB.DOMUtils.toggle(...eles, false);
				};
				BDFDB.DOMUtils.toggle = function (...eles) {
					if (!eles) return;
					let force = eles.pop();
					if (typeof force != "boolean") {
						eles.push(force);
						force = undefined;
					}
					if (!eles.length) return;
					for (let ele of eles.flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) toggle(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let node of ele) toggle(node);
						else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) for (let node of document.querySelectorAll(c)) toggle(node);
					}
					function toggle(node) {
						if (!node || !Node.prototype.isPrototypeOf(node)) return;
						let hidden = force === undefined ? !BDFDB.DOMUtils.isHidden(node) : !force;
						if (hidden) {
							let display = node.style.getPropertyValue("display");
							if (display && display != "none") node.BDFDBhideDisplayState = {
								display: display,
								important: (` ${node.style.cssText} `.split(` display: ${display}`)[1] || "").trim().indexOf("!important") == 0
							};
							node.style.setProperty("display", "none", "important");
						}
						else {
							if (node.BDFDBhideDisplayState) {
								node.style.setProperty("display", node.BDFDBhideDisplayState.display, node.BDFDBhideDisplayState.important ? "important" : "");
								delete node.BDFDBhideDisplayState;
							}
							else node.style.removeProperty("display");
						}
					}
				};
				BDFDB.DOMUtils.isHidden = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) return getComputedStyle(node, null).getPropertyValue("display") == "none";
				};
				BDFDB.DOMUtils.remove = function (...eles) {
					for (let ele of eles.flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) ele.remove();
						else if (NodeList.prototype.isPrototypeOf(ele)) {
							let nodes = Array.from(ele);
							while (nodes.length) nodes.shift().remove();
						}
						else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) {
							let nodes = Array.from(document.querySelectorAll(c));
							while (nodes.length) nodes.shift().remove();
						}
					}
				};
				BDFDB.DOMUtils.create = function (html) {
					if (typeof html != "string" || !html.trim()) return null;
					let template = document.createElement("template");
					try {template.innerHTML = html.replace(/(?<!pre)>[\t\r\n]+<(?!pre)/g, "><");}
					catch (err) {template.innerHTML = html.replace(/>[\t\r\n]+<(?!pre)/g, "><");}
					if (template.content.childNodes.length == 1) return template.content.firstElementChild || template.content.firstChild;
					else {
						let wrapper = document.createElement("span");
						let nodes = Array.from(template.content.childNodes);
						while (nodes.length) wrapper.appendChild(nodes.shift());
						return wrapper;
					}
				};
				BDFDB.DOMUtils.getParent = function (listOrSelector, node) {
					let parent = null;
					if (Node.prototype.isPrototypeOf(node) && listOrSelector) {
						let list = NodeList.prototype.isPrototypeOf(listOrSelector) ? listOrSelector : typeof listOrSelector == "string" ? document.querySelectorAll(listOrSelector) : null;
						if (list) for (let listNode of list) if (listNode.contains(node)) {
							parent = listNode;
							break;
						}
					}
					return parent;
				};
				BDFDB.DOMUtils.setText = function (node, stringOrNode) {
					if (!node || !Node.prototype.isPrototypeOf(node)) return;
					let textnode = node.nodeType == Node.TEXT_NODE ? node : null;
					if (!textnode) for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE || BDFDB.DOMUtils.containsClass(child, "BDFDB-textnode")) {
						textnode = child;
						break;
					}
					if (textnode) {
						if (Node.prototype.isPrototypeOf(stringOrNode) && stringOrNode.nodeType != Node.TEXT_NODE) {
							BDFDB.DOMUtils.addClass(stringOrNode, "BDFDB-textnode");
							node.replaceChild(stringOrNode, textnode);
						}
						else if (Node.prototype.isPrototypeOf(textnode) && textnode.nodeType != Node.TEXT_NODE) node.replaceChild(document.createTextNode(stringOrNode), textnode);
						else textnode.textContent = stringOrNode;
					}
					else node.appendChild(Node.prototype.isPrototypeOf(stringOrNode) ? stringOrNode : document.createTextNode(stringOrNode));
				};
				BDFDB.DOMUtils.getText = function (node) {
					if (!node || !Node.prototype.isPrototypeOf(node)) return;
					for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE) return child.textContent;
				};
				BDFDB.DOMUtils.getRects = function (node) {
					let rects = {};
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let hideNode = node;
						while (hideNode) {
							let hidden = BDFDB.DOMUtils.isHidden(hideNode);
							if (hidden) {
								BDFDB.DOMUtils.toggle(hideNode, true);
								hideNode.BDFDBgetRectsHidden = true;
							}
							hideNode = hideNode.parentElement;
						}
						rects = node.getBoundingClientRect();
						hideNode = node;
						while (hideNode) {
							if (hideNode.BDFDBgetRectsHidden) {
								BDFDB.DOMUtils.toggle(hideNode, false);
								delete hideNode.BDFDBgetRectsHidden;
							}
							hideNode = hideNode.parentElement;
						}
					}
					return rects;
				};
				BDFDB.DOMUtils.getHeight = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let rects = BDFDB.DOMUtils.getRects(node);
						let style = getComputedStyle(node);
						return rects.height + parseInt(style.marginTop) + parseInt(style.marginBottom);
					}
					return 0;
				};
				BDFDB.DOMUtils.getInnerHeight = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let rects = BDFDB.DOMUtils.getRects(node);
						let style = getComputedStyle(node);
						return rects.height - parseInt(style.paddingTop) - parseInt(style.paddingBottom);
					}
					return 0;
				};
				BDFDB.DOMUtils.getWidth = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let rects = BDFDB.DOMUtils.getRects(node);
						let style = getComputedStyle(node);
						return rects.width + parseInt(style.marginLeft) + parseInt(style.marginRight);
					}
					return 0;
				};
				BDFDB.DOMUtils.getInnerWidth = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let rects = BDFDB.DOMUtils.getRects(node);
						let style = getComputedStyle(node);
						return rects.width - parseInt(style.paddingLeft) - parseInt(style.paddingRight);
					}
					return 0;
				};
				BDFDB.DOMUtils.appendWebScript = function (url, container) {
					if (typeof url != "string") return;
					if (!container && !document.head.querySelector("bd-head bd-scripts")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-scripts></bd-scripts></bd-head>`));
					container = container || document.head.querySelector("bd-head bd-scripts") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.removeWebScript(url, container);
					let script = document.createElement("script");
					script.src = url;
					container.appendChild(script);
				};
				BDFDB.DOMUtils.removeWebScript = function (url, container) {
					if (typeof url != "string") return;
					container = container || document.head.querySelector("bd-head bd-scripts") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.remove(container.querySelectorAll(`script[src="${url}"]`));
				};
				BDFDB.DOMUtils.appendWebStyle = function (url, container) {
					if (typeof url != "string") return;
					if (!container && !document.head.querySelector("bd-head bd-styles")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-styles></bd-styles></bd-head>`));
					container = container || document.head.querySelector("bd-head bd-styles") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.removeWebStyle(url, container);
					container.appendChild(BDFDB.DOMUtils.create(`<link type="text/css" rel="Stylesheet" href="${url}"></link>`));
				};
				BDFDB.DOMUtils.removeWebStyle = function (url, container) {
					if (typeof url != "string") return;
					container = container || document.head.querySelector("bd-head bd-styles") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.remove(container.querySelectorAll(`link[href="${url}"]`));
				};
				BDFDB.DOMUtils.appendLocalStyle = function (id, css, container) {
					if (typeof id != "string" || typeof css != "string") return;
					if (!container && !document.head.querySelector("bd-head bd-styles")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-styles></bd-styles></bd-head>`));
					container = container || document.head.querySelector("bd-head bd-styles") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.removeLocalStyle(id, container);
					container.appendChild(BDFDB.DOMUtils.create(`<style id="${id}CSS">${css.replace(/\t|\r|\n/g,"")}</style>`));
				};
				BDFDB.DOMUtils.removeLocalStyle = function (id, container) {
					if (typeof id != "string") return;
					container = container || document.head.querySelector("bd-head bd-styles") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.remove(container.querySelectorAll(`style[id="${id}CSS"]`));
				};
				
				BDFDB.ModalUtils = {};
				BDFDB.ModalUtils.open = function (plugin, config) {
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(config)) return;
					let modal, modalInstance, modalProps, cancels = [], closeModal = _ => {
						if (BDFDB.ObjectUtils.is(modalProps) && typeof modalProps.onClose == "function") modalProps.onClose();
					};
					let headerChildren = [], contentChildren = [], footerChildren = [];
					if (typeof config.text == "string") {
						contentChildren.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
							children: config.text
						}));
					}
					if (config.children) {
						let tabBarItems = [];
						for (let child of [config.children].flat(10).filter(n => n)) if (LibraryModules.React.isValidElement(child)) {
							if (child.type == InternalComponents.LibraryComponents.ModalComponents.ModalTabContent) {
								if (!tabBarItems.length) child.props.open = true;
								else delete child.props.open;
								tabBarItems.push({value:child.props.tab});
							}
							contentChildren.push(child);
						}
						if (tabBarItems.length) headerChildren.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.disCN.tabbarcontainer,
							align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TabBar, {
									className: BDFDB.disCN.tabbar,
									itemClassName: BDFDB.disCN.tabbaritem,
									type: InternalComponents.LibraryComponents.TabBar.Types.TOP,
									items: tabBarItems,
									onItemSelect: (value, instance) => {
										let tabContentInstances = BDFDB.ReactUtils.findOwner(modal, {name:"BDFDB_ModalTabContent", all:true, unlimited:true});
										for (let ins of tabContentInstances) {
											if (ins.props.tab == value) ins.props.open = true;
											else delete ins.props.open;
										}
										BDFDB.ReactUtils.forceUpdate(tabContentInstances);
									}
								}),
								config.tabBarChildren
							].flat(10).filter(n => n)
						}));
					}
					if (BDFDB.ArrayUtils.is(config.buttons)) for (let button of config.buttons) {
						let contents = typeof button.contents == "string" && button.contents;
						if (contents) {
							let color = typeof button.color == "string" && InternalComponents.LibraryComponents.Button.Colors[button.color.toUpperCase()];
							let look = typeof button.look == "string" && InternalComponents.LibraryComponents.Button.Looks[button.look.toUpperCase()];
							let click = typeof button.click == "function" ? button.click : (typeof button.onClick == "function" ? button.onClick : _ => {});
							
							if (button.cancel) cancels.push(click);
							
							footerChildren.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Button, BDFDB.ObjectUtils.exclude(Object.assign({}, button, {
								look: look || (color ? InternalComponents.LibraryComponents.Button.Looks.FILLED : InternalComponents.LibraryComponents.Button.Looks.LINK),
								color: color || InternalComponents.LibraryComponents.Button.Colors.PRIMARY,
								onClick: _ => {
									if (button.close) closeModal();
									if (!(button.close && button.cancel)) click(modal, modalInstance);
								},
								children: contents
							}), "click", "close", "cancel", "contents")));
						}
					}
					contentChildren = contentChildren.concat(config.contentChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
					headerChildren = headerChildren.concat(config.headerChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
					footerChildren = footerChildren.concat(config.footerChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
					if (contentChildren.length) {
						if (typeof config.onClose != "function") config.onClose = _ => {};
						if (typeof config.onOpen != "function") config.onOpen = _ => {};
						
						let name = plugin.name || (typeof plugin.getName == "function" ? plugin.getName() : null);
						name = typeof name == "string" ? name : null;
						let oldTransitionState = 0;
						LibraryModules.ModalUtils.openModal(props => {
							modalProps = props;
							return BDFDB.ReactUtils.createElement(class BDFDB_Modal extends LibraryModules.React.Component {
								render () {
									return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalRoot, {
										className: BDFDB.DOMUtils.formatClassName(name && `${name}-modal`, BDFDB.disCN.modalwrapper, config.className),
										size: typeof config.size == "string" && InternalComponents.LibraryComponents.ModalComponents.ModalSize[config.size.toUpperCase()] || InternalComponents.LibraryComponents.ModalComponents.ModalSize.SMALL,
										transitionState: props.transitionState,
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalHeader, {
												className: BDFDB.DOMUtils.formatClassName(config.headerClassName, config.shade && BDFDB.disCN.modalheadershade, headerChildren.length && BDFDB.disCN.modalheaderhassibling),
												separator: config.headerSeparator || false,
												children: [
													BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
														children: [
															BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
																tag: InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H4,
																children: config.header
															}),
															BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
																size: InternalComponents.LibraryComponents.TextElement.Sizes.SIZE_12,
																children: typeof config.subheader == "string" || BDFDB.ReactUtils.isValidElement(config.subheader) ? config.subheader : (name || "")
															})
														]
													}),
													BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalCloseButton, {
														onClick: closeModal
													})
												]
											}),
											headerChildren.length ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
												grow: 0,
												shrink: 0,
												children: headerChildren
											}) : null,
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalContent, {
												className: config.contentClassName,
												scroller: config.scroller,
												direction: config.direction,
												content: config.content,
												children: contentChildren
											}),
											footerChildren.length ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalFooter, {
												className: config.footerClassName,
												direction: config.footerDirection,
												children: footerChildren
											}) : null
										]
									});
								}
								componentDidMount () {
									modalInstance = this;
									modal = BDFDB.ReactUtils.findDOMNode(this);
									modal = modal && modal.parentElement ? modal.parentElement.querySelector(BDFDB.dotCN.modalwrapper) : null;
									if (modal && props.transitionState == 1 && props.transitionState > oldTransitionState) config.onOpen(modal, this);
									oldTransitionState = props.transitionState;
								}
								componentWillUnmount () {
									if (modal && props.transitionState == 3) {
										for (let cancel of cancels) cancel(modal);
										config.onClose(modal, this);
									}
								}
							}, props, true);
						}, {
							onCloseRequest: closeModal
						});
					}
				};
				BDFDB.ModalUtils.confirm = function (plugin, text, callback) {
					if (!BDFDB.ObjectUtils.is(plugin) || typeof text != "string") return;
					BDFDB.ModalUtils.open(plugin, {text, header:"Are you sure?", className:BDFDB.disCN.modalconfirmmodal, scroller:false, buttons:[
						{contents: BDFDB.LanguageUtils.LanguageStrings.OKAY, close:true, color:"RED", click:typeof callback == "function" ? callback : _ => {}},
						{contents: BDFDB.LanguageUtils.LanguageStrings.CANCEL, close:true}
					]});
				};
			
				const RealMenuItems = BDFDB.ModuleUtils.findByProperties("MenuItem", "MenuGroup");
				BDFDB.ContextMenuUtils = {};
				BDFDB.ContextMenuUtils.open = function (plugin, e, children) {
					LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Menu, {
							navId: "bdfdb-context",
							onClose: BDFDB.LibraryModules.ContextMenuUtils.closeContextMenu,
							children: children
						}, true);
					});
				};
				BDFDB.ContextMenuUtils.close = function (nodeOrInstance) {
					if (!BDFDB.ObjectUtils.is(nodeOrInstance)) return;
					let instance = BDFDB.ReactUtils.findOwner(nodeOrInstance, {props:"closeContextMenu", up:true});
					if (BDFDB.ObjectUtils.is(instance) && instance.props && typeof instance.props.closeContextMenu == "function") instance.props.closeContextMenu();
					else BDFDB.LibraryModules.ContextMenuUtils.closeContextMenu();
				};
				BDFDB.ContextMenuUtils.createItem = function (component, props = {}) {
					if (!component) return null;
					else {
						if (props.persisting || BDFDB.ObjectUtils.is(props.popoutProps) || (typeof props.color == "string" && !DiscordClasses[`menu${props.color.toLowerCase()}`])) component = InternalComponents.MenuItem;
						if (BDFDB.ObjectUtils.toArray(RealMenuItems).some(c => c == component)) return BDFDB.ReactUtils.createElement(component, props);
						else return BDFDB.ReactUtils.createElement(RealMenuItems.MenuItem, {
							id: props.id,
							disabled: props.disabled,
							render: menuItemProps => {
								if (!props.state) props.state = BDFDB.ObjectUtils.extract(props, "checked", "value");
								return BDFDB.ReactUtils.createElement(InternalComponents.CustomMenuItemWrapper, {
									disabled: props.disabled,
									childProps: Object.assign({}, props, menuItemProps, {color: props.color}),
									children: component
								}, true);
							}
						});
					}
				};
				BDFDB.ContextMenuUtils.createItemId = function (...strings) {
					return strings.map(s => typeof s == "number" ? s.toString() : s).filter(s => typeof s == "string").map(s => s.toLowerCase().replace(/\s/, "-")).join("-");
				};
				BDFDB.ContextMenuUtils.findItem = function (returnvalue, config) {
					if (!returnvalue || !BDFDB.ObjectUtils.is(config) || !config.label && !config.id) return [null, -1];
					config.label = config.label && [config.label].flat().filter(n => n);
					config.id = config.id && [config.id].flat().filter(n => n);
					let contextMenu = BDFDB.ReactUtils.findChild(returnvalue, {props: "navId"});
					if (contextMenu) {
						for (let i in contextMenu.props.children) {
							if (contextMenu.props.children[i] && contextMenu.props.children[i].type == RealMenuItems.MenuGroup) {
								if (BDFDB.ArrayUtils.is(contextMenu.props.children[i].props.children)) {
									for (let j in contextMenu.props.children[i].props.children) if (check(contextMenu.props.children[i].props.children[j])) {
										if (config.group) return [contextMenu.props.children, parseInt(i)];
										else return [contextMenu.props.children[i].props.children, parseInt(j)];
									}
								}
								else if (contextMenu.props.children[i] && contextMenu.props.children[i].props) {
									if (check(contextMenu.props.children[i].props.children)) {
										if (config.group) return [contextMenu.props.children, parseInt(i)];
										else {
											contextMenu.props.children[i].props.children = [contextMenu.props.children[i].props.children];
											return [contextMenu.props.children[i].props.children, 0];
										}
									}
									else if (contextMenu.props.children[i].props.children && contextMenu.props.children[i].props.children.props && BDFDB.ArrayUtils.is(contextMenu.props.children[i].props.children.props.children)) {
										for (let j in contextMenu.props.children[i].props.children.props.children) if (check(contextMenu.props.children[i].props.children.props.children[j])) {
											if (config.group) return [contextMenu.props.children, parseInt(i)];
											else return [contextMenu.props.children[i].props.children.props.children, parseInt(j)];
										}
									}
								}
							}
							else if (check(contextMenu.props.children[i])) return [contextMenu.props.children, parseInt(i)];
						}
						return [contextMenu.props.children, -1];
					}
					return [null, -1];
					function check (child) {
						if (!child) return false;
						let props = child.stateNode ? child.stateNode.props : child.props;
						if (!props) return false;
						return config.id && config.id.some(key => props.id == key) || config.label && config.label.some(key => props.label == key);
					}
				};

				BDFDB.StringUtils = {};
				BDFDB.StringUtils.htmlEscape = function (string) {
					let ele = document.createElement("div");
					ele.innerText = string;
					return ele.innerHTML;
				};
				BDFDB.StringUtils.regEscape = function (string) {
					return typeof string == "string" && string.replace(/([\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}])/g, "\\$1");
				};
				BDFDB.StringUtils.insertNRST = function (string) {
					return typeof string == "string" && string.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\s/g, " ");
				};
				BDFDB.StringUtils.highlight = function (string, searchstring, prefix = `<span class="${BDFDB.disCN.highlight}">`, suffix = `</span>`) {
					if (typeof string != "string" || !searchstring || searchstring.length < 1) return string;
					let offset = 0, original = string;
					BDFDB.ArrayUtils.getAllIndexes(string.toUpperCase(), searchstring.toUpperCase()).forEach(index => {
						let d1 = offset * (prefix.length + suffix.length);
						index = index + d1;
						let d2 = index + searchstring.length;
						let d3 = [-1].concat(BDFDB.ArrayUtils.getAllIndexes(string.substring(0, index), "<"));
						let d4 = [-1].concat(BDFDB.ArrayUtils.getAllIndexes(string.substring(0, index), ">"));
						if (d3[d3.length - 1] > d4[d4.length - 1]) return;
						string = string.substring(0, index) + prefix + string.substring(index, d2) + suffix + string.substring(d2);
						offset++;
					});
					return string || original;
				};
				BDFDB.StringUtils.findMatchCaseless = function (match, string, any) {
					if (typeof match != "string" || typeof string != "string" || !match || !string) return "";
					match = BDFDB.StringUtils.regEscape(match);
					let exec = (new RegExp(any ? `([\\n\\r\\s]+${match})|(^${match})` : `([\\n\\r\\s]+${match}[\\n\\r\\s]+)|([\\n\\r\\s]+${match}$)|(^${match}[\\n\\r\\s]+)|(^${match}$)`, "i")).exec(string);
					return exec && typeof exec[0] == "string" && exec[0].replace(/[\n\r\s]/g, "") || "";
				};
				BDFDB.StringUtils.extractSelection = function (original, selection) {
					if (typeof original != "string") return "";
					if (typeof selection != "string") return original;
					let s = [], f = [], wrong = 0, canceled = false, done = false;
					for (let i of BDFDB.ArrayUtils.getAllIndexes(original, selection[0])) if (!done) {
						while (i <= original.length && !done) {
							let subSelection = selection.slice(s.filter(n => n != undefined).length);
							if (!subSelection && s.length - 20 <= selection.length) done = true;
							else for (let j in subSelection) if (!done && !canceled) {
								if (original[i] == subSelection[j]) {
									s[i] = subSelection[j];
									f[i] = subSelection[j];
									wrong = 0;
									if (i == original.length) done = true;
								}
								else {
									s[i] = null;
									f[i] = original[i];
									wrong++;
									if (wrong > 4) {
										s = [], f = [], wrong = 0, canceled = true;
										break;
									}
								}
								break;
							}
							canceled = false;
							i++;
						}
					}
					if (s.filter(n => n).length) {
						let reverseS = [].concat(s).reverse(), i = 0, j = 0;
						for (let k in s) {
							if (s[k] == null) i = parseInt(k) + 1;
							else break;
						}
						for (let k in reverseS) {
							if (reverseS[k] == null) j = parseInt(k) + 1;
							else break;
						}
						return f.slice(i, f.length - j).join("");
					}
					else return original;
				};
				
				BDFDB.SlateUtils = {};
				BDFDB.SlateUtils.isRichValue = function (richValue) {
					return BDFDB.ObjectUtils.is(richValue) && LibraryModules.SlateUtils.deserialize("").constructor.prototype.isPrototypeOf(richValue);
				};
				BDFDB.SlateUtils.copyRichValue = function (string, richValue) {
					let newRichValue = LibraryModules.SlateUtils.deserialize(string);
					if (BDFDB.SlateUtils.isRichValue(richValue) && richValue._map && richValue._map._root && BDFDB.ArrayUtils.is(richValue._map._root.entries)) {
						for (let i in richValue._map._root.entries) if (richValue._map._root.entries[i][0] == "selection") {
							newRichValue._map._root.entries[i] = richValue._map._root.entries[i];
							break;
						}
					}
					return newRichValue;
				};
				BDFDB.SlateUtils.hasOpenPlainTextCodeBlock = function (editor) {
					let richValue = BDFDB.ObjectUtils.get(editor, "props.richValue");
					if (!BDFDB.SlateUtils.isRichValue(richValue)) return false;
					let codeMatches = BDFDB.LibraryModules.SlateSelectionUtils.serializeSelection(richValue.document, {
						start: {
							key: richValue.document.getFirstText().key,
							offset: 0
						},
						end: richValue.selection.start
					}, "raw").match(/```/g);
					return codeMatches && codeMatches.length && codeMatches.length % 2 != 0;
				};
				BDFDB.SlateUtils.getCurrentWord = function (editor) {
					let richValue = BDFDB.ObjectUtils.get(editor, "props.richValue");
					if (!BDFDB.SlateUtils.isRichValue(richValue) || !richValue.selection.isCollapsed || BDFDB.SlateUtils.hasOpenPlainTextCodeBlock(editor) || richValue.document.text.trim().length == 0) return {word: null, isAtStart: false};
					if (editor.props.useSlate) {
						if (richValue.document.text.startsWith("/giphy ") || richValue.document.text.startsWith("/tenor ")) {
							let node = richValue.document.getNode(richValue.selection.start.key);
							if (node) return {
								word: node.text.substring(0, richValue.selection.start.offset),
								isAtStart: true
							}
						}
						let node = richValue.document.getNode(richValue.selection.start.key);
						if (node == null) return {
							word: null,
							isAtStart: false
						};
						let word = "", atStart = false;
						let offset = richValue.selection.start.offset;
						let block = richValue.document.getClosestBlock(node.key);
						while (true) {
							if (--offset < 0) {
								if ((node = block.getPreviousNode(node.key) == null)) {
									atStart = true;
									break;
								}
								if (node.object!== "text") break;
								offset = node.text.length - 1;
							}
							if (node.object !== "text") break;
							let prefix = node.text[offset];
							if (/(\t|\s)/.test(prefix)) break;
							word = prefix + word;
						}
						return {
							word: !word ? null : word,
							isAtStart: atStart && block.type == "line" && richValue.document.nodes.get(0) === block
						};
					}
					else {
						let textarea = BDFDB.ReactUtils.findDOMNode(editor.ref.current);
						if (!Node.prototype.isPrototypeOf(textarea) || textarea.tagName != "TEXTAREA" || !textarea.value.length || /\s/.test(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd))) return {
							word: null,
							isAtStart: true
						};
						else {
							if (textarea.selectionEnd == textarea.value.length) {
								let words = textarea.value.split(/\s/).reverse();
								return {
									word: !words[0] ? null : words[0],
									isAtStart: words.length > 1
								};
							}
							else {
								let chars = textarea.value.split(""), word = "", currentWord = "", isCurrentWord = false, isAtStart = true;
								for (let i in chars) {
									if (i == textarea.selectionStart) isCurrentWord = true;
									if (/\s/.test(chars[i])) {
										word = "";
										isAtStart = currentWord.length > 0 && isAtStart || false;
										isCurrentWord = false;
									}
									else {
										word += chars[i];
										if (isCurrentWord) currentWord = word;
									}
								}
								return {
									word: !currentWord ? null : currentWord,
									isAtStart: isAtStart
								};
							}
						}
					}
				};
				
				BDFDB.NumberUtils = {};
				BDFDB.NumberUtils.formatBytes = function (bytes, sigDigits) {
					bytes = parseInt(bytes);
					if (isNaN(bytes) || bytes < 0) return "0 Bytes";
					if (bytes == 1) return "1 Byte";
					let size = Math.floor(Math.log(bytes) / Math.log(1024));
					return parseFloat((bytes / Math.pow(1024, size)).toFixed(sigDigits < 1 ? 0 : sigDigits > 20 ? 20 : sigDigits || 2)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][size];
				};
				BDFDB.NumberUtils.mapRange = function (from, to, value) {
					if (parseFloat(value) < parseFloat(from[0])) return parseFloat(to[0]);
					else if (parseFloat(value) > parseFloat(from[1])) return parseFloat(to[1]);
					else return parseFloat(to[0]) + (parseFloat(value) - parseFloat(from[0])) * (parseFloat(to[1]) - parseFloat(to[0])) / (parseFloat(from[1]) - parseFloat(from[0]));
				};
				BDFDB.NumberUtils.generateId = function (array) {
					array = BDFDB.ArrayUtils.is(array) ? array : [];
					let id = Math.floor(Math.random() * 10000000000000000);
					if (array.includes(id)) return BDFDB.NumberUtils.generateId(array);
					else {
						array.push(id);
						return id;
					}
				};
				BDFDB.NumberUtils.compareVersions = function (newV, oldV) {
					if (!newV || !oldV) return true;
					newV = newV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
					oldV = oldV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
					let length = Math.max(newV.length, oldV.length);
					if (!length) return true;
					if (newV.length > oldV.length) {
						let tempArray = new Array(newV.length - oldV.length);
						for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
						oldV = tempArray.concat(oldV);
					}
					else if (newV.length < oldV.length) {
						let tempArray = new Array(oldV.length - newV.length);
						for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
						newV = tempArray.concat(newV);
					}
					for (let i = 0; i < length; i++) for (let iOutdated = false, j = 0; j <= i; j++) {
						if (j == i && newV[j] < oldV[j]) return false;
						if (j < i) iOutdated = newV[j] == oldV[j];
						if ((j == 0 || iOutdated) && j == i && newV[j] > oldV[j]) return true;
					}
					return false;
				};
				BDFDB.NumberUtils.getVersionDifference = function (newV, oldV) {
					if (!newV || !oldV) return false;
					newV = newV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
					oldV = oldV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
					let length = Math.max(newV.length, oldV.length);
					if (!length) return false;
					if (newV.length > oldV.length) {
						let tempArray = new Array(newV.length - oldV.length);
						for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
						oldV = tempArray.concat(oldV);
					}
					else if (newV.length < oldV.length) {
						let tempArray = new Array(oldV.length - newV.length);
						for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
						newV = tempArray.concat(newV);
					}
					let oldvValue = 0, newValue = 0;
					for (let i in oldV.reverse()) oldvValue += (oldV[i] * (10 ** i));
					for (let i in newV.reverse()) newValue += (newV[i] * (10 ** i));
					return (newValue - oldvValue) / (10 ** (length-1));
				};

				BDFDB.DiscordUtils = {};
				BDFDB.DiscordUtils.openLink = function (url, inbuilt, minimized) {
					if (!inbuilt) window.open(url, "_blank");
					else {
						let browserWindow = new LibraryRequires.electron.remote.BrowserWindow({
							frame: true,
							resizeable: true,
							show: true,
							darkTheme: BDFDB.DiscordUtils.getTheme() == BDFDB.disCN.themedark,
							webPreferences: {
								nodeIntegration: false,
								nodeIntegrationInWorker: false
							}
						});
						browserWindow.setMenu(null);
						browserWindow.loadURL(url);
						if (minimized) browserWindow.minimize(null);
					}
				};
				BDFDB.DiscordUtils.getFolder = function () {
					var built = BDFDB.DiscordUtils.getBuilt();
					built = "discord" + (built == "stable" ? "" : built);
					return LibraryRequires.path.resolve(LibraryRequires.electron.remote.app.getPath("appData"), built, BDFDB.DiscordUtils.getVersion());
				};
				BDFDB.DiscordUtils.getBuilt = function () {
					if (BDFDB.DiscordUtils.getBuilt.built) return BDFDB.DiscordUtils.getBuilt.built;
					else {
						var built = null;
						try {built = require(LibraryRequires.electron.remote.app.getAppPath() + "/build_info.json").releaseChannel.toLowerCase();} 
						catch (err) {
							try {built = require(LibraryRequires.electron.remote.app.getAppPath().replace("\app.asar", "") + "/build_info.json").releaseChannel.toLowerCase();} 
							catch (err) {
								var version = BDFDB.DiscordUtils.getVersion();
								if (version) {
									version = version.split(".");
									if (version.length == 3 && !isNaN(version = parseInt(version[2]))) built = version > 300 ? "stable" : da > 200 ? "canary" : "ptb";
									else built = "stable";
								}
								else built = "stable";
							}
						}
						BDFDB.DiscordUtils.getBuilt.built = built;
						return built;
					}
				};
				BDFDB.DiscordUtils.getVersion = function () {
					if (BDFDB.DiscordUtils.getBuilt.version) return BDFDB.DiscordUtils.getBuilt.version;
					else {
						let version = null;
						try {version = LibraryRequires.electron.remote.app.getVersion();}
						catch (err) {version = "";}
						BDFDB.DiscordUtils.getBuilt.version = version;
						return version;
					}
				};
				BDFDB.DiscordUtils.isDevModeEnabled = function () {
					return (LibraryModules.StoreChangeUtils.get("UserSettingsStore") || {}).developerMode;
				};
				BDFDB.DiscordUtils.getTheme = function () {
					return (LibraryModules.StoreChangeUtils.get("UserSettingsStore") || {}).theme != "dark" ? BDFDB.disCN.themelight : BDFDB.disCN.themedark;
				};
				BDFDB.DiscordUtils.getMode = function () {
					return (LibraryModules.StoreChangeUtils.get("UserSettingsStore") || {}).message_display_compact ? "compact" : "cozy";
				};
				BDFDB.DiscordUtils.getZoomFactor = function () {
					let aRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.appmount));
					let widthZoom = Math.round(100 * window.outerWidth / aRects.width);
					let heightZoom = Math.round(100 * window.outerHeight / aRects.height);
					return widthZoom < heightZoom ? widthZoom : heightZoom;
				};
				BDFDB.DiscordUtils.getFontScale = function () {
					return parseInt(document.firstElementChild.style.fontSize.replace("%", ""));
				};
				BDFDB.DiscordUtils.shake = function () {
					BDFDB.ReactUtils.getInstance(document.querySelector(BDFDB.dotCN.appold)).return.stateNode.shake();
				};

				BDFDB.WindowUtils = {};
				BDFDB.WindowUtils.open = function (plugin, url, options = {}) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !url) return;
					if (!BDFDB.ArrayUtils.is(plugin.browserWindows)) plugin.browserWindows = [];
					let config = Object.assign({
						show: false,
						webPreferences: {
							nodeIntegration: true,
							nodeIntegrationInWorker: true
						}
					}, options);
					let browserWindow = new LibraryRequires.electron.remote.BrowserWindow(BDFDB.ObjectUtils.exclude(config, "showOnReady", "onLoad"));
					
					if (!config.show && config.showOnReady) browserWindow.once("ready-to-show", browserWindow.show);
					if (config.devTools) browserWindow.openDevTools();
					if (typeof config.onLoad == "function") browserWindow.webContents.on("did-finish-load", (...args) => {config.onLoad(...args);});
					if (typeof config.onClose == "function") browserWindow.once("closed", (...args) => {config.onClose(...args);});
					
					if (typeof browserWindow.removeMenu == "function") browserWindow.removeMenu();
					else browserWindow.setMenu(null);
					browserWindow.loadURL(url);
					browserWindow.executeJavaScriptSafe = js => {if (!browserWindow.isDestroyed()) browserWindow.webContents.executeJavaScript(`(_ => {${js}})();`);};
					plugin.browserWindows.push(browserWindow);
					return browserWindow;
				};
				BDFDB.WindowUtils.close = function (browserWindow) {
					if (BDFDB.ObjectUtils.is(browserWindow) && !browserWindow.isDestroyed() && browserWindow.isClosable()) browserWindow.close();
				};
				BDFDB.WindowUtils.closeAll = function (plugin) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.browserWindows)) return;
					while (plugin.browserWindows.length) BDFDB.WindowUtils.close(plugin.browserWindows.pop());
				};
				BDFDB.WindowUtils.addListener = function (plugin, actions, callback) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !actions || typeof callback != "function") return;
					BDFDB.WindowUtils.removeListener(plugin, actions);
					for (let action of actions.split(" ")) {
						action = action.split(".");
						let eventName = action.shift();
						if (!eventName) return;
						let namespace = (action.join(".") || "") + plugin.name;
						if (!BDFDB.ArrayUtils.is(plugin.ipcListeners)) plugin.ipcListeners = [];

						plugin.ipcListeners.push({eventName, namespace, callback});
						LibraryRequires.electron.ipcRenderer.on(eventName, callback);
					}
				};
				BDFDB.WindowUtils.removeListener = function (plugin, actions = "") {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.ipcListeners)) return;
					if (actions) {
						for (let action of actions.split(" ")) {
							action = action.split(".");
							let eventName = action.shift();
							let namespace = (action.join(".") || "") + plugin.name;
							for (let listener of plugin.ipcListeners) {
								let removedListeners = [];
								if (listener.eventName == eventName && listener.namespace == namespace) {
									LibraryRequires.electron.ipcRenderer.off(listener.eventName, listener.callback);
									removedListeners.push(listener);
								}
								if (removedListeners.length) plugin.ipcListeners = plugin.ipcListeners.filter(listener => {return removedListeners.indexOf(listener) < 0;});
							}
						}
					}
					else {
						for (let listener of plugin.ipcListeners) LibraryRequires.electron.ipcRenderer.off(listener.eventName, listener.callback);
						plugin.ipcListeners = [];
					}
				};
				
				const DiscordClassModules = Object.assign({}, InternalData.CustomClassModules);
				for (let name in InternalData.DiscordClassModules) {
					if (InternalData.DiscordClassModules[name].length) DiscordClassModules[name] = BDFDB.ModuleUtils.find(m => InternalData.DiscordClassModules[name].props.every(prop => typeof m[prop] == "string") && (InternalData.DiscordClassModules[name].smaller ? Object.keys(m).length < InternalData.DiscordClassModules[name].length : Object.keys(m).length == InternalData.DiscordClassModules[name].length));
					else DiscordClassModules[name] = BDFDB.ModuleUtils.findByProperties(InternalData.DiscordClassModules[name].props);
				}
				BDFDB.DiscordClassModules = Object.assign({}, DiscordClassModules);
				
				const DiscordClasses = Object.assign({}, InternalData.DiscordClasses);
				BDFDB.DiscordClasses = Object.assign({}, DiscordClasses);
				InternalBDFDB.getDiscordClass = function (item, selector) {
					let className = fallbackClassName = DiscordClassModules.BDFDB.BDFDBundefined + "-" + InternalBDFDB.generateClassId();
					if (DiscordClasses[item] === undefined) {
						BDFDB.LogUtils.warn(item + " not found in DiscordClasses");
						return className;
					} 
					else if (!BDFDB.ArrayUtils.is(DiscordClasses[item]) || DiscordClasses[item].length != 2) {
						BDFDB.LogUtils.warn(item + " is not an Array of Length 2 in DiscordClasses");
						return className;
					}
					else if (DiscordClassModules[DiscordClasses[item][0]] === undefined) {
						BDFDB.LogUtils.warn(DiscordClasses[item][0] + " not found in DiscordClassModules");
						return className;
					}
					else if ([DiscordClasses[item][1]].flat().every(prop => DiscordClassModules[DiscordClasses[item][0]][prop] === undefined)) {
						BDFDB.LogUtils.warn(DiscordClasses[item][1] + " not found in " + DiscordClasses[item][0] + " in DiscordClassModules");
						return className;
					}
					else {
						for (let prop of [DiscordClasses[item][1]].flat()) {
							className = DiscordClassModules[DiscordClasses[item][0]][prop];
							if (className) break;
							else className = fallbackClassName;
						}
						if (selector) {
							className = className.split(" ").filter(n => n.indexOf("da-") != 0).join(selector ? "." : " ");
							className = className || fallbackClassName;
						}
						else {
							if (BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.normalizedClasses)) className = className.split(" ").filter(n => n.indexOf("da-") != 0).map(n => n.replace(/^([A-z0-9]+?)-([A-z0-9_-]{6})$/g, "$1-$2 da-$1")).join(" ");
						}
						return BDFDB.ArrayUtils.removeCopies(className.split(" ")).join(" ") || fallbackClassName;
					}
				};
				const generationChars = "0123456789ABCDEFGHIJKMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split("");
				InternalBDFDB.generateClassId = function () {
					let id = "";
					while (id.length < 6) id += generationChars[Math.floor(Math.random() * generationChars.length)];
					return id;
				};
				BDFDB.disCN = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return InternalBDFDB.getDiscordClass(item, false).replace("#", "");
					}
				});
				BDFDB.disCNS = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return InternalBDFDB.getDiscordClass(item, false).replace("#", "") + " ";
					}
				});
				BDFDB.disCNC = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return InternalBDFDB.getDiscordClass(item, false).replace("#", "") + ",";
					}
				});
				BDFDB.dotCN = new Proxy(DiscordClasses, {
					get: function (list, item) {
						let className = InternalBDFDB.getDiscordClass(item, true);
						return (className.indexOf("#") == 0 ? "" : ".") + className;
					}
				});
				BDFDB.dotCNS = new Proxy(DiscordClasses, {
					get: function (list, item) {
						let className = InternalBDFDB.getDiscordClass(item, true);
						return (className.indexOf("#") == 0 ? "" : ".") + className + " ";
					}
				});
				BDFDB.dotCNC = new Proxy(DiscordClasses, {
					get: function (list, item) {
						let className = InternalBDFDB.getDiscordClass(item, true);
						return (className.indexOf("#") == 0 ? "" : ".") + className + ",";
					}
				});
				BDFDB.notCN = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return `:not(.${InternalBDFDB.getDiscordClass(item, true).split(".")[0]})`;
					}
				});
				BDFDB.notCNS = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return `:not(.${InternalBDFDB.getDiscordClass(item, true).split(".")[0]}) `;
					}
				});
				BDFDB.notCNC = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return `:not(.${InternalBDFDB.getDiscordClass(item, true).split(".")[0]}),`;
					}
				});
			
				const LanguageStrings = LibraryModules.LanguageStore && LibraryModules.LanguageStore._proxyContext ? Object.assign({}, LibraryModules.LanguageStore._proxyContext.defaultMessages) : {};
				const LibraryStrings = Object.assign({}, InternalData.LibraryStrings);
				BDFDB.LanguageUtils = {};
				BDFDB.LanguageUtils.languages = Object.assign({}, InternalData.Languages);
				BDFDB.LanguageUtils.getLanguage = function () {
					let lang = LibraryModules.LanguageStore.chosenLocale || "en";
					if (lang == "en-GB" || lang == "en-US") lang = "en";
					let langIds = lang.split("-");
					let langId = langIds[0];
					let langId2 = langIds[1] || "";
					lang = langId2 && langId.toUpperCase() !== langId2.toUpperCase() ? langId + "-" + langId2 : langId;
					return BDFDB.LanguageUtils.languages[lang] || BDFDB.LanguageUtils.languages[langId] || BDFDB.LanguageUtils.languages["en"];
				};
				BDFDB.LanguageUtils.LanguageStrings = new Proxy(LanguageStrings, {
					get: function (list, item) {
						let stringObj = LibraryModules.LanguageStore.Messages[item];
						if (!stringObj) BDFDB.LogUtils.warn(item + " not found in BDFDB.LanguageUtils.LanguageStrings");
						else {
							if (stringObj && typeof stringObj == "object" && typeof stringObj.format == "function") return BDFDB.LanguageUtils.LanguageStringsFormat(item);
							else return stringObj;
						}
						return "";
					}
				});
				BDFDB.LanguageUtils.LanguageStringsCheck = new Proxy(LanguageStrings, {
					get: function (list, item) {
						return !!LibraryModules.LanguageStore.Messages[item];
					}
				});
				let parseLanguageStringObj = obj => {
					let string = "";
					if (typeof obj == "string") string += obj;
					else if (BDFDB.ObjectUtils.is(obj)) {
						if (obj.props) string += parseLanguageStringObj(obj.props);
						else if (obj.type) {
							let text = obj.content || obj.children && obj.children[0] && obj.children[0].toString() || "";
							if (text) {
								if (obj.type == "text" || obj.content) string = parseLanguageStringObj(text);
								else string += `<${obj.type}>${parseLanguageStringObj(text)}</${obj.type}>`;
							}
						}
					}
					else if (BDFDB.ArrayUtils.is(obj)) for (let ele of obj) string += parseLanguageStringObj(ele);
					return string;
				};
				BDFDB.LanguageUtils.LanguageStringsFormat = function (item, ...values) {
					if (item) {
						let stringObj = LibraryModules.LanguageStore.Messages[item];
						if (stringObj && typeof stringObj == "object" && typeof stringObj.format == "function") {
							let i = 0, returnvalue, formatVars = {};
							while (!returnvalue && i < 10) {
								i++;
								try {returnvalue = stringObj.format(formatVars, false);}
								catch (err) {
									returnvalue = null;
									let value = values.shift();
									formatVars[err.toString().split("for: ")[1]] = value != null ? (value === 0 ? "0" : value) : "undefined";
								}
							}
							if (returnvalue) return parseLanguageStringObj(returnvalue);
							else {
								BDFDB.LogUtils.warn(item + " failed to format string in BDFDB.LanguageUtils.LanguageStrings");
								return "";
							}
						}
						else return BDFDB.LanguageUtils.LanguageStrings[item];
					}
					else BDFDB.LogUtils.warn(item + " enter a valid key to format the string in BDFDB.LanguageUtils.LanguageStrings");
					return "";
				};
				BDFDB.LanguageUtils.LibraryStrings = new Proxy(LibraryStrings.default || {}, {
					get: function (list, item) {
						let languageId = BDFDB.LanguageUtils.getLanguage().id;
						if (LibraryStrings[languageId] && LibraryStrings[languageId][item]) return LibraryStrings[languageId][item];
						else if (LibraryStrings.default[item]) return LibraryStrings.default[item];
						else BDFDB.LogUtils.warn(item + " not found in BDFDB.LanguageUtils.LibraryStrings");
						return "";
					}
				});
				BDFDB.LanguageUtils.LibraryStringsCheck = new Proxy(LanguageStrings, {
					get: function (list, item) {
						return !!LibraryStrings.default[item];
					}
				});
				BDFDB.LanguageUtils.LibraryStringsFormat = function (item, ...values) {
					if (item && values.length) {
						let languageId = BDFDB.LanguageUtils.getLanguage().id, string = null;
						if (LibraryStrings[languageId] && LibraryStrings[languageId][item]) string = LibraryStrings[languageId][item];
						else if (LibraryStrings.default[item]) string = LibraryStrings.default[item];
						if (string) {
							for (let i = 0; i < values.length; i++) if (typeof values[i] == "string") string = string.replace(new RegExp(`{{var${i}}}`, "g"), values[i]);
							return string;
						}
						else BDFDB.LogUtils.warn(item + " not found in BDFDB.LanguageUtils.LibraryStrings");
					}
					else BDFDB.LogUtils.warn(item + " enter a valid key and at least one value to format the string in BDFDB.LanguageUtils.LibraryStrings");
					return "";
				};
				BDFDB.TimeUtils.interval(interval => {
					if (LibraryModules.LanguageStore.chosenLocale) {
						BDFDB.TimeUtils.clear(interval);
						let language = BDFDB.LanguageUtils.getLanguage();
						if (language) BDFDB.LanguageUtils.languages.$discord = Object.assign({}, language, {name: `Discord (${language.name})`});
					}
				}, 100);
				
				const reactInitialized = LibraryModules.React && LibraryModules.React.Component;
				InternalBDFDB.setDefaultProps = function (component, defaultProps) {
					if (BDFDB.ObjectUtils.is(component)) component.defaultProps = Object.assign({}, component.defaultProps, defaultProps);
				};
				let openedItem;
				InternalComponents.MenuItem = reactInitialized && class BDFDB_MenuItem extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {hovered: false};
					}
					componentWillUnmount() {
						if (openedItem == this.props.id) openedItem = null;
					}
					render() {
						let color = (typeof this.props.color == "string" ? this.props.color : InternalComponents.LibraryComponents.MenuItems.Colors.DEFAULT).toLowerCase();
						let isCustomColor = false;
						if (color) {
							if (DiscordClasses[`menu${color}`]) color = color;
							else if (BDFDB.ColorUtils.getType(color)) {
								isCustomColor = true;
								color = BDFDB.ColorUtils.convert(color, "RGBA");
							}
							else color = (InternalComponents.LibraryComponents.MenuItems.Colors.DEFAULT || "").toLowerCase();
						}
						let renderPopout, onClose, hasPopout = BDFDB.ObjectUtils.is(this.props.popoutProps);
						if (hasPopout) {
							renderPopout = instance => {
								openedItem = this.props.id;
								return typeof this.props.popoutProps.renderPopout == "function" && this.props.popoutProps.renderPopout(instance);
							};
							onClose = instance => {
								openedItem = null;
								typeof this.props.popoutProps.onClose == "function" && this.props.popoutProps.onClose(instance);
							};
						}
						let focused = !openedItem ? this.props.isFocused : openedItem == this.props.id;
						let themeDark = BDFDB.DiscordUtils.getTheme() == BDFDB.disCN.themedark;
						let item = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, Object.assign({
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.menuitem, BDFDB.disCN.menulabelcontainer, color && (isCustomColor ? BDFDB.disCN.menucolorcustom : BDFDB.disCN[`menu${color}`]), this.props.disabled && BDFDB.disCN.menudisabled, focused && BDFDB.disCN.menufocused),
							style: {
								color: isCustomColor ? ((focused || this.state.hovered) ? (BDFDB.ColorUtils.isBright(color) ? "#000000" : "#ffffff") : color) : (this.state.hovered ? "#ffffff" : null),
								background: isCustomColor && (focused || this.state.hovered) && color
							},
							onClick: this.props.disabled ? null : e => {
								if (!this.props.action) return false;
								!this.props.persisting && !hasPopout && this.props.onClose();
								this.props.action(e, this);
							},
							onMouseEnter: this.props.disabled ? null : e => {
								this.setState({hovered: true});
							},
							onMouseLeave: this.props.disabled ? null : e => {
								this.setState({hovered: false});
							},
							"aria-disabled": this.props.disabled,
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menulabel,
									children: [
										typeof this.props.label == "function" ? this.props.label(this) : this.props.label,
										this.props.subtext && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.menusubtext,
											children: typeof this.props.subtext == "function" ? this.props.subtext(this) : this.props.subtext
										})
									].filter(n => n)
								}),
								this.props.hint && BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menuhintcontainer,
									children: typeof this.props.hint == "function" ? this.props.hint(this) : this.props.hint
								}),
								this.props.icon && BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menuiconcontainer,
									children: BDFDB.ReactUtils.createElement(this.props.icon, {
										className: BDFDB.disCN.menuicon,
									})
								}),
								this.props.imageUrl && BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menuimagecontainer,
									children: BDFDB.ReactUtils.createElement("img", {
										className: BDFDB.disCN.menuimage,
										src: typeof this.props.imageUrl == "function" ? this.props.imageUrl(this) : this.props.imageUrl,
										alt: ""
									})
								})
							].filter(n => n)
						}, this.props.menuItemProps, {isFocused: focused}));
						return hasPopout ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutContainer, Object.assign({}, this.props.popoutProps, {
							children: item,
							renderPopout: renderPopout,
							onClose: onClose
						})) : item;
					}
				};
				InternalComponents.CustomMenuItemWrapper = reactInitialized && class BDFDB_CustomMenuItemWrapper extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {hovered: false};
					}
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							onMouseEnter: e => {
								this.setState({hovered: true});
							},
							onMouseLeave: e => {
								this.setState({hovered: false});
							},
							children: BDFDB.ReactUtils.createElement(this.props.children, Object.assign({}, this.props.childProps, {isFocused:this.state.hovered && !this.props.disabled}))
						});
					}
				};
				InternalComponents.ErrorBoundary = reactInitialized && class BDFDB_ErrorBoundary extends LibraryModules.React.PureComponent {
					constructor(props) {
						super(props);
						this.state = {hasError: false};
					}
					static getDerivedStateFromError(error) {
						return {hasError: true};
					}
					componentDidCatch(error, info) {
						BDFDB.LogUtils.error("Could not create react element! " + error);
					}
					render() {
						if (this.state.hasError) return LibraryModules.React.createElement("span", {
							style: {
								background: BDFDB.DiscordConstants && BDFDB.DiscordConstants.Colors && BDFDB.DiscordConstants.Colors.PRIMARY_DARK,
								borderRadius: 5,
								color: BDFDB.DiscordConstants && BDFDB.DiscordConstants.Colors && BDFDB.DiscordConstants.Colors.STATUS_RED,
								fontSize: 12,
								fontWeight: 600,
								padding: 6,
								textAlign: "center",
								verticalAlign: "center"
							},
							children: "React Component Error"
						});
						return this.props.children;
					}
				};
				
				for (let name in InternalData.NativeSubComponents) {
					if (InternalData.NativeSubComponents[name].name) {
						if (InternalData.NativeSubComponents[name].protos) InternalComponents.NativeSubComponents[name] = BDFDB.ModuleUtils.find(m => m && m.displayName == InternalData.NativeSubComponents[name].name && m.prototype && InternalData.NativeSubComponents[name].protos.every(proto => m.prototype[proto]));
						else InternalComponents.NativeSubComponents[name] = BDFDB.ModuleUtils.findByName(InternalData.NativeSubComponents[name].name);
					}
					else if (InternalData.NativeSubComponents[name].props) InternalComponents.NativeSubComponents[name] = BDFDB.ModuleUtils.findByProperties(InternalData.NativeSubComponents[name].props);
				}
				
				for (let name in InternalData.LibraryComponents) {
					let module;
					if (InternalData.LibraryComponents[name].name) module = BDFDB.ModuleUtils.findByName(InternalData.LibraryComponents[name].name);
					else if (InternalData.LibraryComponents[name].strings) module = BDFDB.ModuleUtils.findByString(InternalData.LibraryComponents[name].strings);
					else if (InternalData.LibraryComponents[name].props) module = BDFDB.ModuleUtils.findByProperties(InternalData.LibraryComponents[name].props);
					let child = name, parent = child.split(" "), components = InternalComponents.LibraryComponents;
					if (parent.length > 1) {
						child = parent[1], parent = parent[0];
						if (!InternalComponents.LibraryComponents[parent]) InternalComponents.LibraryComponents[parent] = {};
						components = InternalComponents.LibraryComponents[parent];
					}
					if (InternalData.LibraryComponents[name].value) module = (module || {})[InternalData.LibraryComponents[name].value];
					if (InternalData.LibraryComponents[name].assign) components[child] = Object.assign({}, module);
					else components[child] = module;
				}
				
				InternalComponents.LibraryComponents.AddonCard = reactInitialized && class BDFDB_AddonCard extends LibraryModules.React.Component {
					render() {
						if (!BDFDB.ObjectUtils.is(this.props.data)) return null;
						let controls = [].concat(this.props.controls).flat(10).filter(n => n);
						let links = [].concat(this.props.links).flat(10).filter(n => n);
						let buttons = [].concat(this.props.buttons).flat(10).filter(n => n);
						let meta = [
							!isBeta && " v",
							BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.disCN._repoversion,
								children: isBeta ? `v${this.props.data.version}` : this.props.data.version
							}),
							" by ",
							BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.disCN._repoauthor,
								children: this.props.data.author
							})
						].filter(n => n);
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._repoentry, this.props.className, BDFDB.disCN._repocard, BDFDB.disCN._reposettingsclosed, BDFDB.disCN._repocheckboxitem),
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN._repoheader,
									style: {overflow: "visible"},
									children: [
										isBeta && this.props.icon,
										BDFDB.ReactUtils.createElement("span", {
											className: BDFDB.disCN._repoheadertitle,
											children: [
												BDFDB.ReactUtils.createElement("span", {
													className: BDFDB.disCN._reponame,
													children: this.props.data.name
												}),
												isBeta ? BDFDB.ReactUtils.createElement("div", {
													className: BDFDB.disCN._repometa,
													children: meta
												}) : meta
											]
										}),
										controls.length && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN._repoheadercontrols,
											children: controls
										})
									]
								}),
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN._repodescriptionwrap,
									children: BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN._repodescription,
										children: this.props.data.description && BDFDB.ReactUtils.markdownParse(this.props.data.description)
									})
								}),
								(links.length || buttons.length) && BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN._repofooter,
									children: [
										links.length && BDFDB.ReactUtils.createElement("span", {
											className: BDFDB.disCN._repolinks,
											children: links.map((data, i) => {
												if (!BDFDB.ObjectUtils.is(data)) return;
												let link = BDFDB.ReactUtils.createElement("a", {
													className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._repolink, typeof data.label == "string" && BDFDB.disCN._repolink + "-" + data.label.toLowerCase().replace(/\s/g, "")),
													href: data.href,
													children: data.icon || data.label
												});
												if (!isBeta) return [
													i > 0 && " | ",
													link
												];
												else {
													let button = BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN._repocontrolsbutton,
														children: link,
														onClick: e => {
															if (typeof data.onClick == "function") {
																BDFDB.ListenerUtils.stopEvent(e);
																data.onClick();
															}
														}
													});
													return typeof data.label == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
														text: data.label,
														children: button
													}) : button;
												}
											}).flat(10).filter(n => n)
										}),
										buttons.length && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._repofootercontrols, isBeta && BDFDB.disCN._repocontrols),
											children: buttons
										})
									].flat(10).filter(n => n)
								})
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.BadgeAnimationContainer = reactInitialized && class BDFDB_BadgeAnimationContainer extends LibraryModules.React.Component {
					componentDidMount() {BDFDB.ReactUtils.forceUpdate(this);}
					componentWillAppear(e) {if (typeof e == "function") e();}
					componentWillEnter(e) {if (typeof e == "function") e();}
					componentWillLeave(e) {if (typeof e == "function") this.timeoutId = setTimeout(e, 300);}
					componentWillUnmount() {clearTimeout(this.timeoutId)}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.div, {
							className: this.props.className,
							style: this.props.animatedStyle,
							children: this.props.children
						});
					}
				};
				
				InternalComponents.LibraryComponents.Badges = Object.assign({}, BDFDB.ModuleUtils.findByProperties("IconBadge", "NumberBadge"));
				InternalComponents.LibraryComponents.Badges.IconBadge = reactInitialized && class BDFDB_IconBadge extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.badgeiconbadge, this.props.className),
							style: Object.assign({
								backgroundColor: this.props.disableColor ? null : (this.props.color || BDFDB.DiscordConstants.Colors.STATUS_RED)
							}, this.props.style),
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
								className: BDFDB.disCN.badgeicon,
								name: this.props.icon
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.BotTag = reactInitialized && class BDFDB_BotTag extends LibraryModules.React.Component {
					handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
					handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
					handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
					handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
					render() {
						return BDFDB.ReactUtils.createElement("span", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, this.props.invertColor ? BDFDB.disCN.bottaginvert : BDFDB.disCN.bottagregular, this.props.useRemSizes ? BDFDB.disCN.bottagrem : BDFDB.disCN.bottagpx),
							style: this.props.style,
							onClick: this.handleClick.bind(this),
							onContextMenu: this.handleContextMenu.bind(this),
							onMouseEnter: this.handleMouseEnter.bind(this),
							onMouseLeave: this.handleMouseLeave.bind(this),
							children: BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.disCN.bottagtext,
								children: this.props.tag || BDFDB.LanguageUtils.LanguageStrings.BOT_TAG_BOT
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.Button = reactInitialized && class BDFDB_Button extends LibraryModules.React.Component {
					handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
					handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
					handleMouseDown(e) {if (typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);}
					handleMouseUp(e) {if (typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);}
					handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
					handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
					render() {
						let processingAndListening = (this.props.disabled || this.props.submitting) && (null != this.props.onMouseEnter || null != this.props.onMouseLeave);
						let props = BDFDB.ObjectUtils.exclude(this.props, "look", "color", "hover", "size", "fullWidth", "grow", "disabled", "submitting", "type", "style", "wrapperClassName", "className", "innerClassName", "onClick", "onContextMenu", "onMouseDown", "onMouseUp", "onMouseEnter", "onMouseLeave", "children", "rel");
						let button = BDFDB.ReactUtils.createElement("button", Object.assign({}, !this.props.disabled && !this.props.submitting && props, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.button, this.props.look != null ? this.props.look : InternalComponents.LibraryComponents.Button.Looks.FILLED, this.props.color != null ? this.props.color : InternalComponents.LibraryComponents.Button.Colors.BRAND, this.props.hover, this.props.size != null ? this.props.size : InternalComponents.LibraryComponents.Button.Sizes.MEDIUM, processingAndListening && this.props.wrapperClassName, this.props.fullWidth && BDFDB.disCN.buttonfullwidth, (this.props.grow === undefined || this.props.grow) && BDFDB.disCN.buttongrow, this.props.hover && this.props.hover !== InternalComponents.LibraryComponents.Button.Hovers.DEFAULT && BDFDB.disCN.buttonhashover, this.props.submitting && BDFDB.disCN.buttonsubmitting),
							onClick: (this.props.disabled || this.props.submitting) ? e => {return e.preventDefault();} : this.handleClick.bind(this),
							onContextMenu: (this.props.disabled || this.props.submitting) ? e => {return e.preventDefault();} : this.handleContextMenu.bind(this),
							onMouseUp: !this.props.disabled && this.handleMouseDown.bind(this),
							onMouseDown: !this.props.disabled && this.handleMouseUp.bind(this),
							onMouseEnter: this.handleMouseEnter.bind(this),
							onMouseLeave: this.handleMouseLeave.bind(this),
							type: !this.props.type ? "button" : this.props.type,
							disabled: this.props.disabled,
							style: this.props.style,
							rel: this.props.rel,
							children: [
								this.props.submitting && !this.props.disabled ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Spinner, {
									type: InternalComponents.LibraryComponents.Spinner.Type.PULSING_ELLIPSIS,
									className: BDFDB.disCN.buttonspinner,
									itemClassName: BDFDB.disCN.buttonspinneritem
								}) : null,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.buttoncontents, this.props.innerClassName),
									children: this.props.children
								})
							]
						}));
						return !processingAndListening ? button : BDFDB.ReactUtils.createElement("span", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.buttondisabledwrapper, this.props.wrapperClassName, this.props.size != null ? this.props.size : InternalComponents.LibraryComponents.Button.Sizes.MEDIUM, this.props.fullWidth && BDFDB.disCN.buttonfullwidth, (this.props.grow === undefined || this.props.grow) && BDFDB.disCN.buttongrow),
							children: [
								button,
								BDFDB.ReactUtils.createElement("span", {
									onMouseEnter: this.handleMouseEnter.bind(this),
									onMouseLeave: this.handleMouseLeave.bind(this),
									className: BDFDB.disCN.buttondisabledoverlay
								})
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.Card = reactInitialized && class BDFDB_Card extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.hovercardwrapper, this.props.backdrop && BDFDB.disCN.hovercard, this.props.className),
							onMouseEnter: e => {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);},
							onMouseLeave: e => {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);},
							onClick: e => {if (typeof this.props.onClick == "function") this.props.onClick(e, this);},
							onContextMenu: e => {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);},
							children: [
								!this.props.noRemove ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.CardRemoveButton, {
									onClick: e => {
										if (typeof this.props.onRemove == "function") this.props.onRemove(e, this);
										BDFDB.ListenerUtils.stopEvent(e);
									}
								}) : null,
								typeof this.props.children == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
									className: BDFDB.disCN.hovercardinner,
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextScroller, {children: this.props.children})
								}) : this.props.children
							].flat(10).filter(n => n)
						}), "backdrop", "noRemove"));
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.Card, {backdrop:true, noRemove:false});
				
				InternalComponents.LibraryComponents.ChannelTextAreaButton = reactInitialized && class BDFDB_ChannelTextAreaButton extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Button, {
							look: InternalComponents.LibraryComponents.Button.Looks.BLANK,
							size: InternalComponents.LibraryComponents.Button.Sizes.NONE,
							"aria-label": this.props.label,
							tabIndex: this.props.tabIndex,
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textareabuttonwrapper, this.props.isActive && BDFDB.disCN.textareabuttonactive),
							innerClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textareabutton, this.props.className, this.props.pulse && BDFDB.disCN.textareaattachbuttonplus),
							onClick: this.props.onClick,
							onContextMenu: this.props.onContextMenu,
							onMouseEnter: this.props.onMouseEnter,
							onMouseLeave: this.props.onMouseLeave,
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
								name: this.props.iconName,
								iconSVG: this.props.iconSVG,
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textareaicon, this.props.iconClassName, this.props.pulse && BDFDB.disCN.textareaiconpulse),
								nativeClass: this.props.nativeClass
							})
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.ChannelTextAreaButton, {tabIndex:0});
				
				InternalComponents.LibraryComponents.CharCounter = reactInitialized && class BDFDB_CharCounter extends LibraryModules.React.Component {
					getCounterString() {
						let input = this.refElement || {}, string = "";
						if (BDFDB.DOMUtils.containsClass(this.refElement, BDFDB.disCN.textarea)) {
							let instance = BDFDB.ReactUtils.findOwner(input, {name:"ChannelEditorContainer", up:true});
							if (instance) string = instance.props.textValue;
							else string = input.value || input.textContent || "";
						}
						else string = input.value || input.textContent || "";
						let start = input.selectionStart || 0, end = input.selectionEnd || 0, selectlength = end - start, selection = BDFDB.DOMUtils.getSelection();
						let select = !selectlength && !selection ? 0 : (selectlength || selection.length);
						select = !select ? 0 : (select > string.length ? (end || start ? string.length - (string.length - end - start) : string.length) : select);
						let children = [
							typeof this.props.renderPrefix == "function" && this.props.renderPrefix(string.length),
							`${string.length}${!this.props.max ? "" : "/" + this.props.max}${!select ? "" : " (" + select + ")"}`,
							typeof this.props.renderSuffix == "function" && this.props.renderSuffix(string.length)
						].filter(n => n);
						if (typeof this.props.onChange == "function") this.props.onChange(this);
						return children.length == 1 ? children[0] : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
							children: children
						});
					}
					updateCounter() {
						if (!this.refElement) return;
						BDFDB.TimeUtils.clear(this.updateTimeout);
						this.updateTimeout = BDFDB.TimeUtils.timeout(this.forceUpdateCounter.bind(this), 100);
					}
					forceUpdateCounter() {
						if (!this.refElement) return;
						this.props.children = this.getCounterString();
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleSelection() {
						if (!this.refElement) return;
						let mousemove = _ => {
							BDFDB.TimeUtils.timeout(this.forceUpdateCounter.bind(this), 10);
						};
						let mouseup = _ => {
							document.removeEventListener("mousemove", mousemove);
							document.removeEventListener("mouseup", mouseup);
							if (this.refElement.selectionEnd - this.refElement.selectionStart) BDFDB.TimeUtils.timeout(_ => {
								document.addEventListener("click", click);
							});
						};
						let click = _ => {
							BDFDB.TimeUtils.timeout(this.forceUpdateCounter.bind(this), 100);
							document.removeEventListener("mousemove", mousemove);
							document.removeEventListener("mouseup", mouseup);
							document.removeEventListener("click", click);
						};
						document.addEventListener("mousemove", mousemove);
						document.addEventListener("mouseup", mouseup);
					}
					componentDidMount() {
						if (this.props.refClass) {
							let node = BDFDB.ReactUtils.findDOMNode(this);
							if (node && node.parentElement) {
								this.refElement = node.parentElement.querySelector(this.props.refClass);
								if (this.refElement) {
									if (!this._updateCounter) this._updateCounter = _ => {
										if (!document.contains(node)) BDFDB.ListenerUtils.multiRemove(this.refElement, "keydown click change", this._updateCounter);
										else this.updateCounter();
									};
									if (!this._handleSelection) this._handleSelection = _ => {
										if (!document.contains(node)) BDFDB.ListenerUtils.multiRemove(this.refElement, "mousedown", this._handleSelection);
										else this.handleSelection();
									};
									BDFDB.ListenerUtils.multiRemove(this.refElement, "mousedown", this._handleSelection);
									BDFDB.ListenerUtils.multiAdd(this.refElement, "mousedown", this._handleSelection);
									if (this.refElement.tagName == "INPUT" || this.refElement.tagName == "TEXTAREA") {
										BDFDB.ListenerUtils.multiRemove(this.refElement, "keydown click change", this._updateCounter);
										BDFDB.ListenerUtils.multiAdd(this.refElement, "keydown click change", this._updateCounter);
									}
									else {
										if (!this._mutationObserver) this._mutationObserver = new MutationObserver(changes => {
											if (!document.contains(node)) this._mutationObserver.disconnect();
											else this.updateCounter();
										});
										else this._mutationObserver.disconnect();
										this._mutationObserver.observe(this.refElement, {childList: true, subtree: true});
									}
									this.updateCounter();
								}
								else BDFDB.LogUtils.warn("could not find referenceElement for BDFDB_CharCounter");
							}
						}
						else BDFDB.LogUtils.warn("refClass can not be undefined for BDFDB_CharCounter");
					}
					render() {
						let string = this.getCounterString();
						BDFDB.TimeUtils.timeout(_ => {if (string != this.getCounterString()) BDFDB.ReactUtils.forceUpdate(this);});
						return BDFDB.ReactUtils.createElement("div", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.charcounter, this.props.className),
							children: string
						}), "parsing", "max", "refClass", "renderPrefix", "renderSuffix"));
					}
				};
				
				InternalComponents.LibraryComponents.Checkbox = reactInitialized && class BDFDB_Checkbox extends LibraryModules.React.Component {
					handleChange() {
						this.props.value = !this.props.value;
						if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Checkbox, Object.assign({}, this.props, {onChange: this.handleChange.bind(this)}));
					}
				};
				
				InternalComponents.LibraryComponents.Clickable = reactInitialized && class BDFDB_Clickable extends LibraryModules.React.Component {
					handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
					handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
					handleMouseDown(e) {if (typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);}
					handleMouseUp(e) {if (typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);}
					handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
					handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Clickable, Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, (this.props.className || "").toLowerCase().indexOf("disabled") == -1 && BDFDB.disCN.cursorpointer),
							onClick: this.handleClick.bind(this),
							onContextMenu: this.handleContextMenu.bind(this),
							onMouseUp: this.handleMouseDown.bind(this),
							onMouseDown: !this.props.disabled && this.handleMouseUp.bind(this),
							onMouseEnter: this.handleMouseEnter.bind(this),
							onMouseLeave: this.handleMouseLeave.bind(this)
						}));
					}
				};
				
				InternalComponents.LibraryComponents.CollapseContainer = reactInitialized && class BDFDB_CollapseContainer extends LibraryModules.React.Component {
					render() {
						if (!BDFDB.ObjectUtils.is(this.props.collapseStates)) this.props.collapseStates = {};
						this.props.collapsed = this.props.collapsed && (this.props.collapseStates[this.props.title] || this.props.collapseStates[this.props.title] == undefined);
						this.props.collapseStates[this.props.title] = this.props.collapsed;
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.collapsed && BDFDB.disCN.collapsecontainercollapsed, this.props.mini ? BDFDB.disCN.collapsecontainermini : BDFDB.disCN.collapsecontainer, this.props.className),
							id: this.props.id,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									className: BDFDB.disCN.collapsecontainerheader,
									align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
									onClick: e => {
										this.props.collapsed = !this.props.collapsed;
										this.props.collapseStates[this.props.title] = this.props.collapsed;
										if (typeof this.props.onClick == "function") this.props.onClick(this.props.collapsed, this);
										BDFDB.ReactUtils.forceUpdate(this);
									},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
										tag: InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H5,
										className: BDFDB.disCN.collapsecontainertitle,
										children: this.props.title
									})
								}),
								!this.props.collapsed ? BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.collapsecontainerinner,
									children: this.props.children
								}) : null
							]
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.CollapseContainer, {collapsed:true, mini:true});
				
				InternalComponents.LibraryComponents.ColorPicker = reactInitialized && class BDFDB_ColorPicker extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						if (!this.state) this.state = {};
						this.state.isGradient = props.gradient && props.color && BDFDB.ObjectUtils.is(props.color);
						this.state.gradientBarEnabled = this.state.isGradient;
						this.state.draggingAlphaCursor = false;
						this.state.draggingGradientCursor = false;
						this.state.selectedGradientCursor = 0;
					}
					handleColorChange(color) {
						let changed = false;
						if (color != null) {
							changed = !BDFDB.equals(this.state.isGradient ? this.props.color[this.state.selectedGradientCursor] : this.props.color, color);
							if (this.state.isGradient) this.props.color[this.state.selectedGradientCursor] = color;
							else this.props.color = color;
						}
						else changed = true;
						if (changed) {
							if (typeof this.props.onColorChange == "function") this.props.onColorChange(this.props.color);
							BDFDB.ReactUtils.forceUpdate(this);
						}
					}
					componentDidMount() {
						this.domElementRef = {current: BDFDB.DOMUtils.getParent(BDFDB.dotCN.itemlayer, BDFDB.ReactUtils.findDOMNode(this))};
						let popoutContainerInstance = BDFDB.ReactUtils.findOwner(this.domElementRef.current, {name:"BDFDB_PopoutContainer", up:true, unlimited:true});
						if (popoutContainerInstance) {
							let mousedown = event => {
								if (!this.domElementRef.current || !document.contains(this.domElementRef.current)) document.removeEventListener("mousedown", mousedown);
								else if (!this.domElementRef.current.contains(event.target)) {
									let mouseup = event => {
										if (!this.domElementRef.current || !document.contains(this.domElementRef.current)) {
											document.removeEventListener("mousedown", mousedown);
											document.removeEventListener("mouseup", mouseup);
										}
										else if (!this.domElementRef.current.contains(event.target)) {
											document.removeEventListener("mousedown", mousedown);
											document.removeEventListener("mouseup", mouseup);
											popoutContainerInstance.handleClick(event);
										}
									};
									document.addEventListener("mouseup", mouseup);
								}
							};
							document.addEventListener("mousedown", mousedown);
						}
					}
					render() {
						if (this.state.isGradient) this.props.color = Object.assign({}, this.props.color);
						
						let hslFormat = this.props.alpha ? "HSLA" : "HSL";
						let hexRegex = this.props.alpha ? /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i : /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
						
						let selectedColor = BDFDB.ColorUtils.convert(this.state.isGradient ? this.props.color[this.state.selectedGradientCursor] : this.props.color, hslFormat) || BDFDB.ColorUtils.convert("#000000FF", hslFormat);
						let currentGradient = (this.state.isGradient ? Object.entries(this.props.color, hslFormat) : [[0, selectedColor], [1, selectedColor]]);
						
						let [h, s, l] = BDFDB.ColorUtils.convert(selectedColor, "HSLCOMP");
						let a = BDFDB.ColorUtils.getAlpha(selectedColor);
						a = a == null ? 1 : a;
						
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutFocusLock, {
							className: BDFDB.disCNS.colorpickerwrapper + BDFDB.disCN.colorpicker,
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.colorpickerinner,
									children: [
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.colorpickersaturation,
											children: BDFDB.ReactUtils.createElement("div", {
												className: BDFDB.disCN.colorpickersaturationcolor,
												style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0, cursor: "crosshair", backgroundColor: BDFDB.ColorUtils.convert([h, "100%", "100%"], "RGB")},
												onClick: event => {
													let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickersaturationcolor, event.target));
													let newS = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 100], event.clientX) + "%";
													let newL = BDFDB.NumberUtils.mapRange([rects.top, rects.top + rects.height], [100, 0], event.clientY) + "%";
													this.handleColorChange(BDFDB.ColorUtils.convert([h, newS, newL, a], hslFormat));
												},
												onMouseDown: event => {
													let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickersaturationcolor, event.target));
													
													let mouseup = _ => {
														document.removeEventListener("mouseup", mouseup);
														document.removeEventListener("mousemove", mousemove);
													};
													let mousemove = event2 => {
														let newS = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 100], event2.clientX) + "%";
														let newL = BDFDB.NumberUtils.mapRange([rects.top, rects.top + rects.height], [100, 0], event2.clientY) + "%";
														this.handleColorChange(BDFDB.ColorUtils.convert([h, newS, newL, a], hslFormat));
													};
													document.addEventListener("mouseup", mouseup);
													document.addEventListener("mousemove", mousemove);
												},
												children: [
													BDFDB.ReactUtils.createElement("style", {
														children: `${BDFDB.dotCN.colorpickersaturationwhite} {background: -webkit-linear-gradient(to right, #fff, rgba(255,255,255,0));background: linear-gradient(to right, #fff, rgba(255,255,255,0));}${BDFDB.dotCN.colorpickersaturationblack} {background: -webkit-linear-gradient(to top, #000, rgba(0,0,0,0));background: linear-gradient(to top, #000, rgba(0,0,0,0));}`
													}),
													BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickersaturationwhite,
														style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
														children: [
															BDFDB.ReactUtils.createElement("div", {
																className: BDFDB.disCN.colorpickersaturationblack,
																style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0}
															}),
															BDFDB.ReactUtils.createElement("div", {
																className: BDFDB.disCN.colorpickersaturationcursor,
																style: {position: "absolute", cursor: "crosshair", left: s, top: `${BDFDB.NumberUtils.mapRange([0, 100], [100, 0], parseFloat(l))}%`},
																children: BDFDB.ReactUtils.createElement("div", {
																	style: {width: 4, height: 4, boxShadow: "rgb(255, 255, 255) 0px 0px 0px 1.5px, rgba(0, 0, 0, 0.3) 0px 0px 1px 1px inset, rgba(0, 0, 0, 0.4) 0px 0px 1px 2px", borderRadius: "50%", transform: "translate(-2px, -2px)"}
																})
															})
														]
													})
												]
											})
										}),
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.colorpickerhue,
											children: BDFDB.ReactUtils.createElement("div", {
												style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
												children: BDFDB.ReactUtils.createElement("div", {
													className: BDFDB.disCN.colorpickerhuehorizontal,
													style: {padding: "0px 2px", position: "relative", height: "100%"},
													onClick: event => {
														let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickerhuehorizontal, event.target));
														let newH = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 360], event.clientX);
														this.handleColorChange(BDFDB.ColorUtils.convert([newH, s, l, a], hslFormat));
													},
													onMouseDown: event => {
														let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickerhuehorizontal, event.target));
														
														let mouseup = _ => {
															document.removeEventListener("mouseup", mouseup);
															document.removeEventListener("mousemove", mousemove);
														};
														let mousemove = event2 => {
															let newH = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 360], event2.clientX);
															this.handleColorChange(BDFDB.ColorUtils.convert([newH, s, l, a], hslFormat));
														};
														document.addEventListener("mouseup", mouseup);
														document.addEventListener("mousemove", mousemove);
													},
													children: [
														BDFDB.ReactUtils.createElement("style", {
															children: `${BDFDB.dotCN.colorpickerhuehorizontal} {background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);background: -webkit-linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);}${BDFDB.dotCN.colorpickerhuevertical} {background: linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);background: -webkit-linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);}`
														}),
														BDFDB.ReactUtils.createElement("div", {
															className: BDFDB.disCN.colorpickerhuecursor,
															style: {position: "absolute", cursor: "ew-resize", left: `${BDFDB.NumberUtils.mapRange([0, 360], [0, 100], h)}%`},
															children: BDFDB.ReactUtils.createElement("div", {
																style: {marginTop: 1, width: 4, borderRadius: 1, height: 8, boxShadow: "rgba(0, 0, 0, 0.6) 0px 0px 2px", background: "rgb(255, 255, 255)", transform: "translateX(-2px)"}
															})
														})
													]
												})
											})
										}),
										this.props.alpha && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.colorpickeralpha,
											children: [
												BDFDB.ReactUtils.createElement("div", {
													style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
													children: BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickeralphacheckered,
														style: {padding: "0px 2px", position: "relative", height: "100%"}
													})
												}),
												BDFDB.ReactUtils.createElement("div", {
													style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
													children: BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickeralphahorizontal,
														style: {padding: "0px 2px", position: "relative", height: "100%", background: `linear-gradient(to right, ${BDFDB.ColorUtils.setAlpha([h, s, l], 0, "RGBA")}, ${BDFDB.ColorUtils.setAlpha([h, s, l], 1, "RGBA")}`},
														onClick: event => {
															let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickeralphahorizontal, event.target));
															let newA = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 1], event.clientX);
															this.handleColorChange(BDFDB.ColorUtils.setAlpha(selectedColor, newA, hslFormat));
														},
														onMouseDown: event => {
															let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickeralphahorizontal, event.target));
															
															let mouseup = _ => {
																document.removeEventListener("mouseup", mouseup);
																document.removeEventListener("mousemove", mousemove);
																this.state.draggingAlphaCursor = false;
																BDFDB.ReactUtils.forceUpdate(this);
															};
															let mousemove = event2 => {
																this.state.draggingAlphaCursor = true;
																let newA = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 1], event2.clientX);
																this.handleColorChange(BDFDB.ColorUtils.setAlpha(selectedColor, newA, hslFormat));
															};
															document.addEventListener("mouseup", mouseup);
															document.addEventListener("mousemove", mousemove);
														},
														children: BDFDB.ReactUtils.createElement("div", {
															className: BDFDB.disCN.colorpickeralphacursor,
															style: {position: "absolute", cursor: "ew-resize", left: `${a * 100}%`},
															children: [
																BDFDB.ReactUtils.createElement("div", {
																	style: {marginTop: 1, width: 4, borderRadius: 1, height: 8, boxShadow: "rgba(0, 0, 0, 0.6) 0px 0px 2px", background: "rgb(255, 255, 255)", transform: "translateX(-2px)"}
																}),
																this.state.draggingAlphaCursor && BDFDB.ReactUtils.createElement("span", {
																	className: BDFDB.disCN.sliderbubble,
																	style: {opacity: 1, visibility: "visible", left: 2},
																	children: `${Math.floor(a * 100)}%`
																})
															].filter(n => n)
														})
													})
												})
											]
										}),
										this.state.gradientBarEnabled && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.colorpickergradient,
											children: [
												BDFDB.ReactUtils.createElement("div", {
													style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
													children: BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickergradientcheckered,
														style: {padding: "0px 2px", position: "relative", height: "100%"}
													})
												}),
												BDFDB.ReactUtils.createElement("div", {
													style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
													children: BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickergradienthorizontal,
														style: {padding: "0px 2px", position: "relative", cursor: "copy", height: "100%", background: BDFDB.ColorUtils.createGradient(currentGradient.reduce((colorObj, posAndColor) => (colorObj[posAndColor[0]] = posAndColor[1], colorObj), {}))},
														onClick: event => {
															let rects = BDFDB.DOMUtils.getRects(event.target);
															let pos = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0.01, 0.99], event.clientX);
															if (Object.keys(this.props.color).indexOf(pos) == -1) {
																this.props.color[pos] = BDFDB.ColorUtils.convert("#000000FF", hslFormat);
																this.state.selectedGradientCursor = pos;
																this.handleColorChange();
															}
														},
														children: currentGradient.map(posAndColor => BDFDB.ReactUtils.createElement("div", {
															className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickergradientcursor, (posAndColor[0] == 0 || posAndColor[0] == 1) && BDFDB.disCNS.colorpickergradientcursoredge, this.state.selectedGradientCursor == posAndColor[0] && BDFDB.disCN.colorpickergradientcursorselected),
															style: {position: "absolute", cursor: "pointer", left: `${posAndColor[0] * 100}%`},
															onMouseDown: posAndColor[0] == 0 || posAndColor[0] == 1 ? _ => {} : event => {
																event = event.nativeEvent || event;
																let mousemove = event2 => {
																	if (Math.sqrt((event.pageX - event2.pageX)**2) > 10) {
																		document.removeEventListener("mousemove", mousemove);
																		document.removeEventListener("mouseup", mouseup);
																		
																		this.state.draggingGradientCursor = true;
																		let cursor = BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickergradientcursor, event.target);
																		let rects = BDFDB.DOMUtils.getRects(cursor.parentElement);
																		
																		let releasing = _ => {
																			document.removeEventListener("mousemove", dragging);
																			document.removeEventListener("mouseup", releasing);
																			BDFDB.TimeUtils.timeout(_ => {this.state.draggingGradientCursor = false;});
																		};
																		let dragging = event3 => {
																			let pos = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0.01, 0.99], event3.clientX);
																			if (Object.keys(this.props.color).indexOf(pos) == -1) {
																				delete this.props.color[posAndColor[0]];
																				posAndColor[0] = pos;
																				this.props.color[pos] = posAndColor[1];
																				this.state.selectedGradientCursor = pos;
																				this.handleColorChange();
																			}
																		};
																		document.addEventListener("mousemove", dragging);
																		document.addEventListener("mouseup", releasing);
																	}
																};
																let mouseup = _ => {
																	document.removeEventListener("mousemove", mousemove);
																	document.removeEventListener("mouseup", mouseup);
																};
																document.addEventListener("mousemove", mousemove);
																document.addEventListener("mouseup", mouseup);
															},
															onClick: event => {
																BDFDB.ListenerUtils.stopEvent(event);
																if (!this.state.draggingGradientCursor) {
																	this.state.selectedGradientCursor = posAndColor[0];
																	BDFDB.ReactUtils.forceUpdate(this);
																}
															},
															onContextMenu: posAndColor[0] == 0 || posAndColor[0] == 1 ? _ => {} : event => {
																BDFDB.ListenerUtils.stopEvent(event);
																delete this.props.color[posAndColor[0]];
																this.state.selectedGradientCursor = 0;
																this.handleColorChange();
															},
															children: BDFDB.ReactUtils.createElement("div", {
																style: {background: BDFDB.ColorUtils.convert(posAndColor[1], "RGBA")}
															})
														}))
													})
												})
											]
										})
									].filter(n => n)
								}),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextInput, {
									className: BDFDB.disCNS.colorpickerhexinput + BDFDB.disCN.margintop8,
									maxLength: this.props.alpha ? 9 : 7,
									valuePrefix: "#",
									value: BDFDB.ColorUtils.convert(selectedColor, this.props.alpha ? "HEXA" : "HEX"),
									autoFocus: true,
									onChange: value => {
										if (hexRegex.test(value)) this.handleColorChange(value);
									},
									inputChildren: this.props.gradient && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
										text: "Gradient",
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
											className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickergradientbutton, this.state.gradientBarEnabled && BDFDB.disCN.colorpickergradientbuttonenabled),
											children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
												nativeClass: true,
												width: 28,
												height: 28,
												name: InternalComponents.LibraryComponents.SvgIcon.Names.GRADIENT
											}),
											onClick: _ => {
												this.state.gradientBarEnabled = !this.state.gradientBarEnabled;
												if (this.state.gradientBarEnabled && !this.state.isGradient) this.props.color = {0: selectedColor, 1: selectedColor};
												else if (!this.state.gradientBarEnabled && this.state.isGradient) this.props.color = selectedColor;
												this.state.isGradient = this.props.color && BDFDB.ObjectUtils.is(this.props.color);
												this.handleColorChange();
											}
										})
									})
								}),
								BDFDB.ReactUtils.createElement("div", {
									className: "move-corners",
									children: [{top: 0, left: 0}, {top: 0, right: 0}, {bottom: 0, right: 0}, {bottom: 0, left: 0}].map(pos => BDFDB.ReactUtils.createElement("div", {
										className: "move-corner",
										onMouseDown: e => {
											if (!this.domElementRef.current) return;
											let rects = BDFDB.DOMUtils.getRects(this.domElementRef.current);
											let left = rects.left, top = rects.top;
											let oldX = e.pageX, oldY = e.pageY;
											let mouseup = _ => {
												document.removeEventListener("mouseup", mouseup);
												document.removeEventListener("mousemove", mousemove);
											};
											let mousemove = e2 => {
												left = left - (oldX - e2.pageX), top = top - (oldY - e2.pageY);
												oldX = e2.pageX, oldY = e2.pageY;
												this.domElementRef.current.style.setProperty("left", `${left}px`, "important");
												this.domElementRef.current.style.setProperty("top", `${top}px`, "important");
											};
											document.addEventListener("mouseup", mouseup);
											document.addEventListener("mousemove", mousemove);
										},
										style: Object.assign({}, pos, {width: 10, height: 10, cursor: "move", position: "absolute"})
									}))
								})
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.ColorSwatches = reactInitialized && class BDFDB_ColorSwatches extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						
						props.selectedColor = BDFDB.ObjectUtils.is(props.color) ? props.color : BDFDB.ColorUtils.convert(props.color, "RGBA");
						props.colors = (BDFDB.ArrayUtils.is(props.colors) ? props.colors : [null, 5433630, 3066993, 1752220, 3447003, 3429595, 8789737, 10181046, 15277667, 15286558, 15158332, 15105570, 15844367, 13094093, 7372936, 6513507, 16777215, 3910932, 2067276, 1146986, 2123412, 2111892, 7148717, 7419530, 11342935, 11345940, 10038562, 11027200, 12745742, 9936031, 6121581, 2894892]).map(c => BDFDB.ColorUtils.convert(c, "RGBA"));
						props.colorRows = props.colors.length ? [props.colors.slice(0, parseInt(props.colors.length/2)), props.colors.slice(parseInt(props.colors.length/2))] : [];
						props.customColor = props.selectedColor != null ? (props.colors.indexOf(props.selectedColor) > -1 ? null : props.selectedColor) : null;
						props.customSelected = !!props.customColor;
						props.pickerConfig = BDFDB.ObjectUtils.is(props.pickerConfig) ? props.pickerConfig : {gradient: true, alpha: true};
						this.state = props;
						
						var swatches = this;
						this.ColorSwatch = class BDFDB_ColorSwatch extends LibraryModules.React.Component {
							render() {
								let useWhite = !BDFDB.ColorUtils.isBright(this.props.color);
								let swatch = BDFDB.ReactUtils.createElement("button", {
									type: "button",
									className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickerswatch, this.props.isSingle && BDFDB.disCN.colorpickerswatchsingle, this.props.isDisabled && BDFDB.disCN.colorpickerswatchdisabled, this.props.isSelected && BDFDB.disCN.colorpickerswatchselected, this.props.isCustom && BDFDB.disCN.colorpickerswatchcustom, this.props.color == null && BDFDB.disCN.colorpickerswatchnocolor),
									number: this.props.number,
									disabled: this.props.isDisabled,
									onClick: _ => {
										if (!this.props.isSelected) {
											let color = this.props.isCustom && this.props.color == null ? "rgba(0, 0, 0, 1)" : this.props.color;
											if (typeof swatches.props.onColorChange == "function") swatches.props.onColorChange(BDFDB.ColorUtils.convert(color, "RGBA"));
											swatches.setState({
												selectedColor: color,
												customColor: this.props.isCustom ? color : swatches.state.customColor,
												customSelected: this.props.isCustom
											});
										}
									},
									style: Object.assign({}, this.props.style, {
										background: BDFDB.ObjectUtils.is(this.props.color) ? BDFDB.ColorUtils.createGradient(this.props.color) : BDFDB.ColorUtils.convert(this.props.color, "RGBA")
									}),
									children: [
										this.props.isCustom || this.props.isSingle ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.colorpickerswatchdropper,
											foreground: BDFDB.disCN.colorpickerswatchdropperfg,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.DROPPER,
											width: this.props.isCustom ? 14 : 10,
											height: this.props.isCustom ? 14 : 10,
											color: useWhite ? BDFDB.DiscordConstants.Colors.WHITE : BDFDB.DiscordConstants.Colors.BLACK
										}) : null,
										this.props.isSelected && !this.props.isSingle ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											name: InternalComponents.LibraryComponents.SvgIcon.Names.CHECKMARK,
											width: this.props.isCustom ? 32 : 16,
											height: this.props.isCustom ? 24 : 16,
											color: useWhite ? BDFDB.DiscordConstants.Colors.WHITE : BDFDB.DiscordConstants.Colors.BLACK
										}) : null
									]
								});
								if (this.props.isCustom || this.props.isSingle || this.props.color == null) swatch = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: this.props.isCustom || this.props.isSingle ? BDFDB.LanguageUtils.LanguageStrings.CUSTOM_COLOR : BDFDB.LanguageUtils.LanguageStrings.DEFAULT,
									tooltipConfig: {type: this.props.isSingle ? "top" : "bottom"},
									children: swatch
								});
								if (this.props.isCustom || this.props.isSingle) swatch = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutContainer, {
									children: swatch,
									wrap: false,
									popoutClassName: BDFDB.disCNS.colorpickerwrapper + BDFDB.disCN.colorpicker,
									animation: InternalComponents.LibraryComponents.PopoutContainer.Animation.TRANSLATE,
									position: InternalComponents.LibraryComponents.PopoutContainer.Positions.BOTTOM,
									align: InternalComponents.LibraryComponents.PopoutContainer.Align.CENTER,
									renderPopout: _ => {
										return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ColorPicker, Object.assign({
											color: this.props.color,
											onColorChange: color => {
												if (typeof swatches.props.onColorChange == "function") swatches.props.onColorChange(BDFDB.ColorUtils.convert(color, "RGBA"))
												this.props.color = color;
												swatches.setState({
													selectedColor: color,
													customColor: color,
													customSelected: true
												});
											}
										}, props.pickerConfig), true);
									}
								});
								return swatch;
							}
						}
					}
					renderRow(colors) {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.disCN.colorpickerrow,
							wrap: InternalComponents.LibraryComponents.Flex.Wrap.WRAP,
							children: colors.map(color => {
								return BDFDB.ReactUtils.createElement(this.ColorSwatch, {
									color: color,
									isCustom: false,
									isSelected: !this.state.customSelected && color === this.state.selectedColor,
									isDisabled: this.state.disabled
								})
							})
						});
					}
					render() {
						let customSwatch = BDFDB.ReactUtils.createElement(this.ColorSwatch, {
							number: !this.state.colors.length ? (this.props.number != null ? this.props.number : 0) : null,
							color: this.state.customColor,
							isSingle: !this.state.colors.length,
							isCustom: this.state.colors.length,
							isSelected: this.state.customSelected,
							isDisabled: this.state.disabled,
							style: {margin: 0}
						});
						return !this.state.colors.length ? BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.colorpickerswatchsinglewrapper,
							children: customSwatch
						}) : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickerswatches, this.state.disabled && BDFDB.disCN.colorpickerswatchesdisabled),
							number: this.props.number != null ? this.props.number : 0,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
									className: BDFDB.disCN.marginreset,
									shrink: 0,
									grow: 0,
									children: customSwatch
								}),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									direction: InternalComponents.LibraryComponents.Flex.Direction.VERTICAL,
									className: BDFDB.disCN.flexmarginreset,
									grow: 1,
									children: [
										this.renderRow(this.state.colorRows[0]),
										this.renderRow(this.state.colorRows[1])
									]
								}) 
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.EmojiPickerButton = reactInitialized && class BDFDB_EmojiPickerButton extends LibraryModules.React.Component {
					handleEmojiChange(emoji) {
						if (emoji != null) {
							this.props.emoji = emoji.id ? {
								id: emoji.id,
								name: emoji.name,
								animated: emoji.animated
							} : {
								id: null,
								name: emoji.optionallyDiverseSequence,
								animated: false
							};
							if (typeof this.props.onSelect == "function") this.props.onSelect(this.props.emoji, this);
							BDFDB.ReactUtils.forceUpdate(this);
						}
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutContainer, {
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.EmojiButton, {
								className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.emojiinputbutton),
								renderButtonContents: this.props.emoji ? _ => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Emoji, {
									className: BDFDB.disCN.emoji,
									emojiId: this.props.emoji.id,
									emojiName: this.props.emoji.name
								}) : null
							}),
							wrap: false,
							animation: InternalComponents.LibraryComponents.PopoutContainer.Animation.NONE,
							position: InternalComponents.LibraryComponents.PopoutContainer.Positions.TOP,
							align: InternalComponents.LibraryComponents.PopoutContainer.Align.LEFT,
							renderPopout: instance => {
								return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.EmojiPicker, {
									closePopout: instance.close,
									onSelectEmoji: this.handleEmojiChange.bind(this),
									allowManagedEmojis: this.props.allowManagedEmojis
								});
							}
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.EmojiPickerButton, {allowManagedEmojis:false});
				
				InternalComponents.LibraryComponents.FavButton = reactInitialized && class BDFDB_FavButton extends LibraryModules.React.Component {
					handleClick() {
						this.props.isFavorite = !this.props.isFavorite;
						if (typeof this.props.onClick == "function") this.props.onClick(this.props.isFavorite, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.favbuttoncontainer, this.props.className),
							children: BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.FavButton, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {onClick: this.handleClick.bind(this)}), "className"))
						});
					}
				};
				
				InternalComponents.LibraryComponents.FileButton = reactInitialized && class BDFDB_FileButton extends LibraryModules.React.Component {
					componentDidMount() {
						if (this.props.searchFolders) {
							let node = BDFDB.ReactUtils.findDOMNode(this);
							if (node && (node = node.querySelector("input[type='file']")) != null) {
								node.setAttribute("directory", "");
								node.setAttribute("webkitdirectory", "");
							}
						}
					}
					render() {
						let filter = this.props.filter && [this.props.filter].flat(10).filter(n => typeof n == "string") || [];
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Button, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							onClick: e => {e.currentTarget.querySelector("input").click();},
							children: [
								BDFDB.LanguageUtils.LibraryStrings.file_navigator_text,
								BDFDB.ReactUtils.createElement("input", {
									type: "file",
									accept: filter.length && (filter.join("/*,") + "/*"),
									style: {display: "none"},
									onChange: e => {
										let file = e.currentTarget.files[0];
										if (this.refInput && file && (!filter.length || filter.some(n => file.type.indexOf(n) == 0))) {
											this.refInput.props.value = this.props.searchFolders ? file.path.split(file.name).slice(0, -1).join(file.name) : `${this.props.mode == "url" ? "url('" : ""}${(this.props.useFilePath) ? file.path : `data:${file.type};base64,${BDFDB.LibraryRequires.fs.readFileSync(file.path).toString("base64")}`}${this.props.mode ? "')" : ""}`;
											BDFDB.ReactUtils.forceUpdate(this.refInput);
											this.refInput.handleChange(this.refInput.props.value);
										}
									}
								})
							]
						}), "filter", "mode", "useFilePath", "searchFolders"));
					}
				};
				
				InternalComponents.LibraryComponents.FormComponents.FormItem = reactInitialized && class BDFDB_FormItem extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: this.props.className,
							style: this.props.style,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									align: InternalComponents.LibraryComponents.Flex.Align.BASELINE,
									children: [
										this.props.title != null || this.props.error != null ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
											wrap: true,
											children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
												tag: this.props.tag || InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H5,
												disabled: this.props.disabled,
												required: this.props.required,
												error: this.props.error,
												className: this.props.titleClassName,
												children: this.props.title
											})
										}) : null
									].concat([this.props.titlechildren].flat(10)).filter(n => n)
								}),
							].concat(this.props.children)
						});
					}
				};
				
				InternalComponents.LibraryComponents.GuildComponents = Object.assign({}, InternalComponents.LibraryComponents.GuildComponents);
				
				InternalComponents.LibraryComponents.GuildComponents.Guild = reactInitialized && class BDFDB_Guild extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {hovered: false};
					}
					handleMouseEnter(e) {
						if (!this.props.sorting) this.setState({hovered: true});
						if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);
					}
					handleMouseLeave(e) {
						if (!this.props.sorting) this.setState({hovered: false});
						if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);
					}
					handleMouseDown(e) {
						if (!this.props.unavailable && this.props.guild && this.props.selectedChannelId) LibraryModules.DirectMessageUtils.preload(this.props.guild.id, this.props.selectedChannelId);
						if (e.button == 0 && typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);
					}
					handleMouseUp(e) {
						if (e.button == 0 && typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);
					}
					handleClick(e) {
						if (typeof this.props.onClick == "function") this.props.onClick(e, this);
					}
					handleContextMenu(e) {
						if (this.props.menu) BDFDB.GuildUtils.openMenu(this.props.guild, e);
						if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);
					}
					setRef(e) {
						if (typeof this.props.setRef == "function") this.props.setRef(this.props.guild.id, e)
					}
					componentDidMount() {
						let node = BDFDB.ReactUtils.findDOMNode(this);
						if (node) for (let child of node.querySelectorAll("a")) child.setAttribute("draggable", false);
					}
					render() {
						if (!this.props.guild) return null;
						let currentVoiceChannel = LibraryModules.ChannelStore.getChannel(LibraryModules.CurrentVoiceUtils.getChannelId());
						let hasVideo = currentVoiceChannel && LibraryModules.VoiceUtils.hasVideo(currentVoiceChannel);
						this.props.guildId = this.props.guild.id;
						this.props.selectedChannelId = LibraryModules.LastChannelStore.getChannelId(this.props.guild.id);
						this.props.selected = this.props.state ? LibraryModules.LastGuildStore.getGuildId() == this.props.guild.id : false;
						this.props.unread = this.props.state ? LibraryModules.UnreadGuildUtils.hasUnread(this.props.guild.id) : false;
						this.props.badge = this.props.state ? LibraryModules.UnreadGuildUtils.getMentionCount(this.props.guild.id) : 0;
						this.props.audio = this.props.state ? currentVoiceChannel && currentVoiceChannel.guild_id == this.props.guild.id && !hasVideo : false;
						this.props.video = this.props.state ? currentVoiceChannel && currentVoiceChannel.guild_id == this.props.guild.id && hasVideo : false;
						this.props.screenshare = this.props.state ? !!LibraryModules.StreamUtils.getAllApplicationStreams().filter(stream => stream.guildId == this.props.guild.id)[0] : false;
						this.props.isCurrentUserInThisGuildVoice = this.props.state ? LibraryModules.CurrentVoiceUtils.getGuildId() == this.props.guild.id : false;
						this.props.animatable = this.props.state ? LibraryModules.IconUtils.hasAnimatedGuildIcon(this.props.guild) : false;
						this.props.unavailable = this.props.state ? LibraryModules.GuildUnavailableStore.unavailableGuilds.includes(this.props.guild.id) : false;
						let isDraggedGuild = this.props.draggingGuildId === this.props.guild.id;
						let guild = isDraggedGuild ? BDFDB.ReactUtils.createElement("div", {
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Items.DragPlaceholder, {})
						}) : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.guildcontainer,
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.BlobMask, {
								selected: this.state.isDropHovering || this.props.selected || this.state.hovered,
								upperBadge: this.props.unavailable ? InternalComponents.LibraryComponents.GuildComponents.Items.renderUnavailableBadge() : InternalComponents.LibraryComponents.GuildComponents.Items.renderIconBadge(this.props.audio, this.props.video, this.props.screenshare, this.props.isCurrentUserInThisGuildVoice),
								lowerBadge: this.props.badge > 0 ? InternalComponents.LibraryComponents.GuildComponents.Items.renderMentionBadge(this.props.badge) : null,
								lowerBadgeWidth: InternalComponents.LibraryComponents.Badges.getBadgeWidthForValue(this.props.badge),
								children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.NavItem, {
									to: {
										pathname: BDFDB.DiscordConstants.Routes.CHANNEL(this.props.guild.id, this.props.selectedChannelId),
										state: {
											analyticsSource: {
												page: BDFDB.DiscordConstants.AnalyticsPages.GUILD_CHANNEL,
												section: BDFDB.DiscordConstants.AnalyticsSections.CHANNEL_LIST,
												object: BDFDB.DiscordConstants.AnalyticsObjects.CHANNEL
											}
										}
									},
									name: this.props.guild.name,
									onMouseEnter: this.handleMouseEnter.bind(this),
									onMouseLeave: this.handleMouseLeave.bind(this),
									onMouseDown: this.handleMouseDown.bind(this),
									onMouseUp: this.handleMouseUp.bind(this),
									onClick: this.handleClick.bind(this),
									onContextMenu: this.handleContextMenu.bind(this),
									icon: this.props.guild.getIconURL(this.state.hovered && this.props.animatable ? "gif" : "png"),
									selected: this.props.selected || this.state.hovered
								})
							})
						});
							
						if (this.props.draggable && typeof this.props.connectDragSource == "function") guild = this.props.connectDragSource(guild);
						
						let children = [
							this.props.list || this.props.pill ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Pill, {
								hovered: !isDraggedGuild && this.state.hovered,
								selected: !isDraggedGuild && this.props.selected,
								unread: !isDraggedGuild && this.props.unread,
								className: BDFDB.disCN.guildpill
							}) : null,
							!this.props.tooltip ? guild : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
								tooltipConfig: Object.assign({type: "right"}, this.props.tooltipConfig, {guild: this.props.list && this.props.guild}),
								children: guild
							})
						].filter(n => n);
						return this.props.list ? BDFDB.ReactUtils.createElement("div", {
							ref: null != this.props.setRef ? this.props.setRef : null,
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.guildouter, BDFDB.disCN._bdguild, this.props.unread && BDFDB.disCN._bdguildunread, this.props.selected && BDFDB.disCN._bdguildselected, this.props.unread && BDFDB.disCN._bdguildunread, this.props.audio && BDFDB.disCN._bdguildaudio, this.props.video && BDFDB.disCN._bdguildvideo),
							children: BDFDB.ReactUtils.createElement(BDFDB.ReactUtils.Fragment, {
								children: children
							})
						}) : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.guild, this.props.className),
							children: children
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.GuildComponents.Guild, {menu:true, tooltip:true, list:false, state:false, draggable:false, sorting:false});
				
				InternalComponents.LibraryComponents.GuildSummaryItem = reactInitialized && class BDFDB_GuildSummaryItem extends LibraryModules.React.Component {
					defaultRenderGuild(guild, isLast) {
						if (!guild) return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.guildsummaryemptyguild
						});
						let icon = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Icon, {
							className: BDFDB.disCN.guildsummaryicon,
							guild: guild,
							showTooltip: this.props.showTooltip,
							tooltipPosition: "top",
							size: InternalComponents.LibraryComponents.GuildComponents.Icon.Sizes.SMALLER
						});
						return this.props.switchOnClick ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
							className: BDFDB.disCN.guildsummaryclickableicon,
							onClick: _ => {LibraryModules.SelectChannelUtils.selectChannel(guild.id, LibraryModules.LastChannelStore.getChannelId(guild.id));},
							key: guild.id,
							tabIndex: -1,
							children: icon
						}) : icon;
					}
					renderGuilds() {
						let elements = [];
						let renderGuild = typeof this.props.renderGuild != "function" ? this.defaultRenderGuild : this.props.renderGuild;
						let loaded = 0, max = this.props.guilds.length === this.props.max ? this.props.guilds.length : this.props.max - 1;
						while (loaded < max && loaded < this.props.guilds.length) {
							let isLast = loaded === this.props.guilds.length - 1;
							let guild = renderGuild.apply(this, [this.props.guilds[loaded], isLast]);
							elements.push(BDFDB.ReactUtils.createElement("div", {
								className: isLast ? BDFDB.disCN.guildsummaryiconcontainer : BDFDB.disCN.guildsummaryiconcontainermasked,
								children: guild
							}));
							loaded++;
						}
						if (loaded < this.props.guilds.length) {
							let rest = Math.min(this.props.guilds.length - loaded, 99);
							elements.push(BDFDB.ReactUtils.createElement(LibraryModules.React.Fragment, {
								key: "more-guilds",
								children: this.props.renderMoreGuilds("+" + rest, rest, this.props.guilds.slice(loaded), this.props)
							}));
						}
						return elements;
					}
					renderIcon() {
						return this.props.renderIcon ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
							name: InternalComponents.LibraryComponents.SvgIcon.Names.WHATISTHIS,
							className: BDFDB.disCN.guildsummarysvgicon
						}) : null;
					}
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.guildsummarycontainer),
							ref: this.props._ref,
							children: [
								this.renderIcon.apply(this),
								this.renderGuilds.apply(this)
							].flat(10).filter(n => n)
						});
					}
				}
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.GuildSummaryItem, {max:10, renderMoreGuilds: (count, amount, restGuilds, props) => {
					let icon = BDFDB.ReactUtils.createElement("div", {className: BDFDB.disCN.guildsummarymoreguilds, children: count});
					return props.showTooltip ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
						text: restGuilds.map(guild => guild.name).join(", "),
						children: icon
					}) : icon;
				}, renderIcon:false});
				
				InternalComponents.LibraryComponents.KeybindRecorder = reactInitialized && class BDFDB_KeybindRecorder extends LibraryModules.React.Component {
					handleChange(arrays) {
						if (typeof this.props.onChange == "function") this.props.onChange(arrays.map(platformkey => LibraryModules.KeyEvents.codes[BDFDB.LibraryModules.KeyCodeUtils.codeToKey(platformkey)] || platformkey[1]), this);
					}
					handleReset() {
						this.props.defaultValue = [];
						let recorder = BDFDB.ReactUtils.findOwner(this, {name: "KeybindRecorder"});
						if (recorder) recorder.setState({codes: []});
						if (typeof this.props.onChange == "function") this.props.onChange([], this);
						if (typeof this.props.onReset == "function") this.props.onReset(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.disCN.hotkeywrapper,
							direction: InternalComponents.LibraryComponents.Flex.Direction.HORIZONTAL,
							align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.KeybindRecorder, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
									defaultValue: [this.props.defaultValue].flat(10).filter(n => n).map(keycode => [BDFDB.DiscordConstants.KeyboardDeviceTypes.KEYBOARD_KEY, keycode, BDFDB.DiscordConstants.KeyboardEnvs.BROWSER]),
									onChange: this.handleChange.bind(this)
								}), "reset", "onReset")),
								this.props.reset || this.props.onReset ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LanguageStrings.REMOVE_KEYBIND,
									tooltipConfig: {type: "top"},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.disCN.hotkeyresetbutton,
										onClick: this.handleReset.bind(this),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											iconSVG: `<svg height="20" width="20" viewBox="0 0 20 20"><path fill="currentColor" d="M 14.348 14.849 c -0.469 0.469 -1.229 0.469 -1.697 0 l -2.651 -3.030 -2.651 3.029 c -0.469 0.469 -1.229 0.469 -1.697 0 -0.469 -0.469 -0.469 -1.229 0 -1.697l2.758 -3.15 -2.759 -3.152 c -0.469 -0.469 -0.469 -1.228 0 -1.697 s 1.228 -0.469 1.697 0 l 2.652 3.031 2.651 -3.031 c 0.469 -0.469 1.228 -0.469 1.697 0 s 0.469 1.229 0 1.697l -2.758 3.152 2.758 3.15 c 0.469 0.469 0.469 1.229 0 1.698 z"></path></svg>`,
										})
									})
								}) : null
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.ListRow = reactInitialized && class BDFDB_ListRow extends LibraryModules.React.Component {
					render () {
						return BDFDB.ReactUtils.createElement("div", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.listrowwrapper, this.props.className, BDFDB.disCN.listrow),
							children: [
								this.props.prefix,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.listrowcontent,
									style: {flex: "1 1 auto"},
									children: [
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.listname, this.props.labelClassName),
											style: {flex: "1 1 auto"},
											children: this.props.label
										}),
										typeof this.props.note == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormText, {
											type: InternalComponents.LibraryComponents.FormComponents.FormText.Types.DESCRIPTION,
											children: this.props.note
										}) : null
									].filter(n => n)
								}),
								this.props.suffix
							].filter(n => n)
						}), "label", "note", "suffix", "prefix", "labelClassName"));
					}
				};
				
				InternalComponents.LibraryComponents.MemberRole = reactInitialized && class BDFDB_MemberRole extends LibraryModules.React.Component {
					handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
					handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
					render() {
						let color = BDFDB.ColorUtils.convert(this.props.role.colorString || BDFDB.DiscordConstants.Colors.PRIMARY_DARK_300, "RGB");
						return BDFDB.ReactUtils.createElement("li", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.userpopoutrole, this.props.className),
							style: {borderColor: BDFDB.ColorUtils.setAlpha(color, 0.6)},
							onClick: this.handleClick.bind(this),
							onContextMenu: this.handleContextMenu.bind(this),
							children: [
								!this.props.noCircle ? BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.userpopoutrolecircle,
									style: {backgroundColor: color}
								}) : null,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.userpopoutrolename,
									children: this.props.role.name
								})
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.MenuItems.MenuCheckboxItem = reactInitialized && class BDFDB_MenuCheckboxItem extends LibraryModules.React.Component {
					handleClick() {
						if (this.props.state) {
							this.props.state.checked = !this.props.state.checked;
							if (typeof this.props.action == "function") this.props.action(this.props.state.checked, this);
						}
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.MenuCheckboxItem, Object.assign({}, this.props, {
							checked: this.props.state && this.props.state.checked,
							action: this.handleClick.bind(this)
						}));
					}
				};
				
				InternalComponents.LibraryComponents.MenuItems.MenuHint = reactInitialized && class BDFDB_MenuHint extends LibraryModules.React.Component {
					render() {
						return !this.props.hint ? null : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.menuhint,
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextScroller, {
								children: this.props.hint
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.MenuItems.MenuIcon = reactInitialized && class BDFDB_MenuIcon extends LibraryModules.React.Component {
					render() {
						let isString = typeof this.props.icon == "string";
						return !this.props.icon ? null : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
							className: BDFDB.disCN.menuicon,
							nativeClass: true,
							iconSVG: isString ? this.props.icon : null,
							name: !isString ? this.props.icon : null
						});
					}
				};
				
				InternalComponents.LibraryComponents.MenuItems.MenuSliderItem = reactInitialized && class BDFDB_MenuSliderItem extends LibraryModules.React.Component {
					handleValueChange(value) {
						if (this.props.state) {
							this.props.state.value = Math.round(BDFDB.NumberUtils.mapRange([0, 100], [this.props.minValue, this.props.maxValue], value) * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
							if (typeof this.props.onValueChange == "function") this.props.onValueChange(this.props.state.value, this);
						}
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleValueRender(value) {
						let newValue = Math.round(BDFDB.NumberUtils.mapRange([0, 100], [this.props.minValue, this.props.maxValue], value) * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						if (typeof this.props.onValueRender == "function") {
							let tempReturn = this.props.onValueRender(newValue, this);
							if (tempReturn != undefined) newValue = tempReturn;
						}
						return newValue;
					}
					render() {
						let value = this.props.state && this.props.state.value || 0;
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.MenuControlItem, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							label: typeof this.props.renderLabel == "function" ? this.props.renderLabel(Math.round(value * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits)) : this.props.label,
							control: (menuItemProps, ref) => {
								return BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menuslidercontainer,
									children: BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Slider, Object.assign({}, menuItemProps, {
										ref: ref,
										className: BDFDB.disCN.menuslider,
										mini: true,
										initialValue: Math.round(BDFDB.NumberUtils.mapRange([this.props.minValue, this.props.maxValue], [0, 100], value) * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits),
										onValueChange: this.handleValueChange.bind(this),
										onValueRender: this.handleValueRender.bind(this)
									}))
								});
							}
						}), "digits", "renderLabel"));
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.MenuItems.MenuSliderItem, {minValue:0, maxValue:100, digits:0});
				
				InternalComponents.LibraryComponents.ModalComponents.ModalContent = reactInitialized && class BDFDB_ModalContent extends LibraryModules.React.Component {
					render() {
						return this.props.scroller ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Scrollers.Thin, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.modalcontent, this.props.className),
							ref: this.props.scrollerRef,
							children: this.props.children
						}) : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.DOMUtils.formatClassName(this.props.content && BDFDB.disCN.modalcontent, BDFDB.disCN.modalnoscroller, this.props.className),
							direction: this.props.direction || InternalComponents.LibraryComponents.Flex.Direction.VERTICAL,
							align: InternalComponents.LibraryComponents.Flex.Align.STRETCH,
							children: this.props.children
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.ModalComponents.ModalContent, {scroller:true, content:true});
				
				InternalComponents.LibraryComponents.ModalComponents.ModalTabContent = reactInitialized && class BDFDB_ModalTabContent extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.forceStyle(BDFDB.ReactUtils.createElement(this.props.scroller ? InternalComponents.LibraryComponents.Scrollers.Thin : "div", Object.assign(BDFDB.ObjectUtils.exclude(this.props, "scroller", "open", "render"), {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.modaltabcontent, this.props.open && BDFDB.disCN.modaltabcontentopen, this.props.className),
							style: Object.assign({}, this.props.style, {
								display: this.props.open ? null : "none"
							}),
							children: !this.props.open && !this.props.render ? null : this.props.children
						})), ["display"]);
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.ModalComponents.ModalTabContent, {tab:"unnamed", render:true});
				
				InternalComponents.LibraryComponents.ModalComponents.ModalFooter = reactInitialized && class BDFDB_ModalFooter extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.modalfooter),
							direction: this.props.direction || InternalComponents.LibraryComponents.Flex.Direction.HORIZONTAL_REVERSE,
							align: InternalComponents.LibraryComponents.Flex.Align.STRETCH,
							grow: 0,
							shrink: 0,
							children: this.props.children
						});
					}
				};
				
				InternalComponents.LibraryComponents.MultiInput = reactInitialized && class BDFDB_MultiInput extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {focused: false};
					}
					render() {
						if (this.props.children && this.props.children.props) this.props.children.props.className = BDFDB.DOMUtils.formatClassName(this.props.children.props.className, BDFDB.disCN.inputmultifield);
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.inputwrapper, BDFDB.disCN.inputmultiwrapper),
							children: BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.input, BDFDB.disCN.inputmulti, this.state.focused && BDFDB.disCN.inputfocused),
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.DOMUtils.formatClassName(this.props.innerClassName, BDFDB.disCN.inputwrapper, BDFDB.disCN.inputmultifirst),
										children: this.props.children
									}),
									BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextInput, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
										className: BDFDB.disCN.inputmultilast,
										inputClassName: BDFDB.disCN.inputmultifield,
										onFocus: e => {this.setState({focused: true})},
										onBlur: e => {this.setState({focused: false})}
									}), "children", "innerClassName"))
								]
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.ListInput = reactInitialized && class BDFDB_ListInput extends LibraryModules.React.Component {
					handleChange() {
						if (typeof this.props.onChange) this.props.onChange(this.props.items, this);
					}
					render() {
						if (!BDFDB.ArrayUtils.is(this.props.items)) this.props.items = [];
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.MultiInput, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.disCN.inputlist,
							innerClassName: BDFDB.disCN.inputlistitems,
							onKeyDown: e => {
								if (e.which == 13 && e.target.value && e.target.value.trim()) {
									let value = e.target.value.trim();
									this.props.value = "";
									if (!this.props.items.includes(value)) {
										this.props.items.push(value);
										BDFDB.ReactUtils.forceUpdate(this);
										this.handleChange.apply(this, []);
									}
								}
							},
							children: this.props.items.map(item => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Badges.TextBadge, {
								className: BDFDB.disCN.inputlistitem,
								color: BDFDB.DiscordConstants.Colors.BRAND,
								style: {borderRadius: "3px"},
								text: [
									item,
									BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
										className: BDFDB.disCN.inputlistdelete,
										name: InternalComponents.LibraryComponents.SvgIcon.Names.CLOSE,
										onClick: _ => {
											BDFDB.ArrayUtils.remove(this.props.items, item);
											BDFDB.ReactUtils.forceUpdate(this);
											this.handleChange.apply(this, []);
										}
									})
								]
							}))
						}), "items"));
					}
				};
				
				InternalComponents.LibraryComponents.PaginatedList = reactInitialized && class BDFDB_PaginatedList extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {
							offset: props.offset
						};
					}
					jump(offset) {
						if (offset > -1 && offset < Math.ceil(this.props.items.length/this.props.amount) && this.state.offset != offset) {
							this.state.offset = offset;
							if (typeof this.props.onJump == "function") this.props.onJump(offset, this);
							BDFDB.ReactUtils.forceUpdate(this);
						}
					}
					renderPagination() {
						let maxOffset = Math.ceil(this.props.items.length/this.props.amount) - 1;
						return this.props.items.length > this.props.amount && BDFDB.ReactUtils.createElement("nav", {
							className: BDFDB.disCN.paginationlistpagination,
							children: [
								this.props.first && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LibraryStrings.first,
									"aria-label": BDFDB.LanguageUtils.LibraryStrings.first,
									tooltipConfig: {zIndex: 3001},
									onClick: _ => {if (this.state.offset > 0) this.jump(0);},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.searchresultspaginationbutton, this.state.offset <= 0 && BDFDB.disCN.searchresultspaginationdisabled),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.LEFT_DOUBLE_CARET
										})
									})
								}),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LanguageStrings.PAGINATION_PREVIOUS,
									"aria-label": BDFDB.LanguageUtils.LanguageStrings.PAGINATION_PREVIOUS,
									tooltipConfig: {zIndex: 3001},
									onClick: _ => {
										if (this.state.offset > 0) this.jump(this.state.offset - 1);
									},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.searchresultspaginationbutton, this.state.offset <= 0 && BDFDB.disCN.searchresultspaginationdisabled),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.LEFT_CARET
										})
									})
								}),
								BDFDB.LanguageUtils.LanguageStringsFormat("PAGINATION_PAGE_OF", this.state.offset + 1, maxOffset + 1),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LanguageStrings.PAGINATION_NEXT,
									"aria-label": BDFDB.LanguageUtils.LanguageStrings.PAGINATION_NEXT,
									tooltipConfig: {zIndex: 3001},
									onClick: _ => {if (this.state.offset < maxOffset) this.jump(this.state.offset + 1);},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.searchresultspaginationbutton, this.state.offset >= maxOffset && BDFDB.disCN.searchresultspaginationdisabled),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.RIGHT_CARET
										})
									})
								}),
								this.props.last && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LibraryStrings.last,
									"aria-label": BDFDB.LanguageUtils.LibraryStrings.last,
									tooltipConfig: {zIndex: 3001},
									onClick: _ => {if (this.state.offset < maxOffset) this.jump(maxOffset);},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.searchresultspaginationbutton, this.state.offset >= maxOffset && BDFDB.disCN.searchresultspaginationdisabled),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.RIGHT_DOUBLE_CARET
										})
									})
								}),
								this.props.jump && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextInput, {
									key: "pagination-list-jumpinput",
									type: "number",
									size: InternalComponents.LibraryComponents.TextInput.Sizes.MINI,
									value: this.state.offset + 1,
									min: 1,
									max: maxOffset + 1,
									onKeyDown: (event, instance) => {if (event.which == 13) this.jump(isNaN(parseInt(instance.props.value)) ? -1 : instance.props.value - 1);}
								}),
								this.props.jump && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LanguageStrings.JUMP,
									"aria-label": BDFDB.LanguageUtils.LanguageStrings.JUMP,
									tooltipConfig: {zIndex: 3001},
									onClick: (event, instance) => {
										let jumpInput = BDFDB.ReactUtils.findOwner(instance._reactInternalFiber.return, {key:"pagination-list-jumpinput"});
										if (jumpInput) this.jump(isNaN(parseInt(jumpInput.props.value)) ? -1 : jumpInput.props.value - 1);
									},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.disCN.searchresultspaginationbutton,
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											style: {transform: "rotate(90deg"},
											name: InternalComponents.LibraryComponents.SvgIcon.Names.RIGHT_CARET
										})
									})
								})
							].filter(n => n)
						});
					}
					render() {
						let items = [], alphabet = {};
						if (BDFDB.ArrayUtils.is(this.props.items) && this.props.items.length) {
							if (!this.props.alphabetKey) items = this.props.items;
							else {
								let unsortedItems = [].concat(this.props.items);
								for (let key of ["0-9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]) {
									let numbers = key == "0-9", alphaItems = [];
									for (let item of unsortedItems) if (item && item[this.props.alphabetKey] && (numbers && !isNaN(parseInt(item[this.props.alphabetKey][0])) || item[this.props.alphabetKey].toUpperCase().indexOf(key) == 0)) alphaItems.push(item);
									for (let sortedItem of alphaItems) BDFDB.ArrayUtils.remove(unsortedItems, sortedItem);
									alphabet[key] = {items:BDFDB.ArrayUtils.keySort(alphaItems, this.props.alphabetKey), disabled:!alphaItems.length};
								}
								alphabet["?!"] = {items:BDFDB.ArrayUtils.keySort(unsortedItems, this.props.alphabetKey), disabled:!unsortedItems.length};
								for (let key in alphabet) items.push(alphabet[key].items);
								items = items.flat(10);
							}
						}
						return typeof this.props.renderItem != "function" || !items.length ? null : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Scrollers.Thin, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.paginationlist, this.props.mini, BDFDB.disCN.paginationlistmini),
							fade: this.props.fade,
							children: [
								this.renderPagination(),
								items.length > this.props.amount && this.props.alphabetKey && BDFDB.ReactUtils.createElement("nav", {
									className: BDFDB.disCN.paginationlistalphabet,
									children: Object.keys(alphabet).map(key => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.paginationlistalphabetchar, alphabet[key].disabled &&BDFDB.disCN.paginationlistalphabetchardisabled),
										onClick: _ => {if (!alphabet[key].disabled) this.jump(Math.floor(items.indexOf(alphabet[key].items[0])/this.props.amount));},
										children: key
									}))
								}),
								this.props.header,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.paginationlistcontent,
									children: items.slice(this.state.offset * this.props.amount, (this.state.offset + 1) * this.props.amount).map((data, i) => {return this.props.renderItem(data, i);}).flat(10).filter(n => n)
								}),
								this.props.copyToBottom && this.renderPagination()
							].flat(10).filter(n => n)
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.PaginatedList, {amount:50, offset:0, jump:true, first:true, last:true, copyToBottom:false, fade:true});
				
				InternalComponents.LibraryComponents.Popout = reactInitialized && class BDFDB_Popout extends LibraryModules.React.Component {
					componentWillUnmount() {
						delete this.props.containerInstance.popout;
						if (typeof this.props.onClose == "function") this.props.onClose(this.props.containerInstance, this);
					}
					render() {
						let pos = typeof this.props.position == "string" ? this.props.position.toLowerCase() : null;
						let positionClass = pos && DiscordClasses["popout" + pos] ? BDFDB.disCN["popout" + pos] : BDFDB.disCN.popouttop;
						let arrowClass = !this.props.arrow ? BDFDB.disCN.popoutnoarrow : (pos && pos.indexOf("top") > -1 && pos != "top" ? BDFDB.disCN.popoutarrowalignmenttop : BDFDB.disCN.popoutarrowalignmentmiddle);
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutFocusLock, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.popoutwrapper, BDFDB.disCN.popout, positionClass, this.props.invert && pos && pos != "bottom" && BDFDB.disCN.popoutinvert, arrowClass, !this.props.shadow && BDFDB.disCN.popoutnoshadow),
							id: this.props.id,
							onClick: e => {e.stopPropagation();},
							style: Object.assign({}, this.props.style, {
								position: this.props.isChild ? "relative" : "absolute"
							}),
							children: BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(this.props.className, this.props.themed && BDFDB.disCN.popoutthemedpopout),
								style: BDFDB.ObjectUtils.extract(this.props, "padding", "height", "maxHeight", "minHeight", "width", "maxWidth", "minWidth"),
								children: this.props.children
							})
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.Popout, {themed:true});
				
				InternalComponents.LibraryComponents.PopoutContainer = reactInitialized && class BDFDB_PopoutContainer extends LibraryModules.React.Component {
					handleRender(e) {
						let children = typeof this.props.renderPopout == "function" ? this.props.renderPopout(this) : null;
						return this.context.popout = !children ? null : (!this.props.wrap ? children : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Popout, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: this.props.popoutClassName,
							containerInstance: this,
							isChild: true,
							position: e.position,
							style: this.props.popoutStyle,
							onClose: typeof this.props.onClose == "function" ? this.props.onClose.bind(this) : _ => {},
							children: children
						}), "popoutStyle", "popoutClassName")));
					}
					componentDidMount() {
						let basePopout = BDFDB.ReactUtils.findOwner(this, {name:"BasePopout"});
						if (!basePopout || !basePopout.handleClick) return;
						basePopout.isBDFDBpopout = true;
						this.handleClick = e => {return basePopout.handleClick(BDFDB.ObjectUtils.is(e) ? e : (new MouseEvent({})));};
						this.close = basePopout.close;
						this.domElementRef = basePopout.domElementRef;
					}
					render() {
						let child = (BDFDB.ArrayUtils.is(this.props.children) ? this.props.children[0] : this.props.children) || BDFDB.ReactUtils.createElement("div", {style: {height: "100%", width: "100%"}});
						child.props.className = BDFDB.DOMUtils.formatClassName(child.props.className, this.props.className);
						let childClick = child.props.onClick, childContextMenu = child.props.onContextMenu;
						child.props.onClick = (e, childThis) => {
							if (!this.domElementRef.current || this.domElementRef.current.contains(e.target)) {
								if ((this.props.openOnClick || this.props.openOnClick === undefined) && typeof this.handleClick == "function") this.handleClick(e);
								if (typeof this.props.onClick == "function") this.props.onClick(e, this);
								if (typeof childClick == "function") childClick(e, childThis);
							}
							else e.stopPropagation();
						};
						child.props.onContextMenu = (e, childThis) => {
							if (!this.domElementRef.current || this.domElementRef.current.contains(e.target)) {
								if (this.props.openOnContextMenu && typeof this.handleClick == "function") this.handleClick(e);
								if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);
								if (typeof childContextMenu == "function") childContextMenu(e, childThis);
							}
							else e.stopPropagation();
						};
						return BDFDB.ReactUtils.createElement(LibraryModules.React.Fragment, {
							children: BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.PopoutContainer, Object.assign({}, this.props, {
								children: _ => {return child;},
								renderPopout: this.handleRender.bind(this)
							}))
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.PopoutContainer, {wrap:true});
				
				InternalComponents.LibraryComponents.QuickSelect = reactInitialized && class BDFDB_QuickSelect extends LibraryModules.React.Component {
					handleChange(option) {
						this.props.value = option;
						if (typeof this.props.onChange == "function") this.props.onChange(option.value || option.key, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let options = (BDFDB.ArrayUtils.is(this.props.options) ? this.props.options : [{}]).filter(n => n);
						let selectedOption = BDFDB.ObjectUtils.is(this.props.value) ? this.props.value : (options[0] || {});
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.quickselectwrapper),
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
								className: BDFDB.disCN.quickselect,
								align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.quickselectlabel,
										children: this.props.label
									}),
									BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
										align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
										className: BDFDB.disCN.quickselectclick,
										onClick: event => {
											LibraryModules.ContextMenuUtils.openContextMenu(event, _ => {
												return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Menu, {
													navId: "bdfdb-quickselect",
													onClose: BDFDB.LibraryModules.ContextMenuUtils.closeContextMenu,
													className: this.props.popoutClassName,
													children: BDFDB.ContextMenuUtils.createItem(InternalComponents.LibraryComponents.MenuItems.MenuGroup, {
														children: options.map((option, i) => {
															let selected = option.value && option.value === selectedOption.value || option.key && option.key === selectedOption.key;
															return BDFDB.ContextMenuUtils.createItem(InternalComponents.LibraryComponents.MenuItems.MenuItem, {
																label: option.label,
																id: BDFDB.ContextMenuUtils.createItemId("option", option.key || option.value || i),
																action: selected ? null : event2 => {
																	this.handleChange.bind(this)(option)
																}
															});
														})
													})
												});
											});
										},
										children: [
											BDFDB.ReactUtils.createElement("div", {
												className: BDFDB.disCN.quickselectvalue,
												children: typeof this.props.renderValue == "function" ? this.props.renderValue(this.props.value) : this.props.value.label
											}),
											BDFDB.ReactUtils.createElement("div", {
												className: BDFDB.disCN.quickselectarrow
											})
										]
									})
								]
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.RadioGroup = reactInitialized && class BDFDB_RadioGroup extends LibraryModules.React.Component {
					handleChange(value) {
						this.props.value = value.value;
						if (typeof this.props.onChange == "function") this.props.onChange(value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.RadioGroup, Object.assign({}, this.props, {
							onChange: this.handleChange.bind(this)
						}));
					}
				};
				
				InternalComponents.LibraryComponents.SearchBar = reactInitialized && class BDFDB_SearchBar extends LibraryModules.React.Component {
					handleChange(query) {
						this.props.query = query;
						if (typeof this.props.onChange == "function") this.props.onChange(query, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleClear() {
						this.props.query = "";
						if (this.props.changeOnClear && typeof this.props.onChange == "function") this.props.onChange("", this);
						if (typeof this.props.onClear == "function") this.props.onClear(this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let props = Object.assign({}, this.props, {
							onChange: this.handleChange.bind(this),
							onClear: this.handleClear.bind(this)
						});
						if (typeof props.query != "string") props.query = "";
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.SearchBar, props);
					}
				};
				
				let NativeSubSelectExport = (BDFDB.ModuleUtils.find(m => m == InternalComponents.NativeSubComponents.Select, false) || {exports: {}}).exports;
				InternalComponents.LibraryComponents.Select = reactInitialized && class BDFDB_Select extends LibraryModules.React.Component {
					handleChange(value) {
						this.props.value = value.value || value;
						if (typeof this.props.onChange == "function") this.props.onChange(value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let lightTheme = BDFDB.DiscordUtils.getTheme() == BDFDB.disCN.themelight;
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.disCN.selectwrapper,
							direction: InternalComponents.LibraryComponents.Flex.Direction.HORIZONTAL,
							align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
							children: BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Select, Object.assign({}, this.props, {
								lightThemeColorOverrides: NativeSubSelectExport[lightTheme ? "LIGHT_THEME_COLORS" : "DARK_THEME_COLORS"],
								darkThemeColorOverrides: NativeSubSelectExport[lightTheme ? "LIGHT_THEME_COLORS" : "DARK_THEME_COLORS"],
								onChange: this.handleChange.bind(this)
							}))
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsGuildList = reactInitialized && class BDFDB_SettingsGuildList extends LibraryModules.React.Component {
					render() {
						this.props.disabled = BDFDB.ArrayUtils.is(this.props.disabled) ? this.props.disabled : [];
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: this.props.className,
							wrap: InternalComponents.LibraryComponents.Flex.Wrap.WRAP,
							children: [this.props.includeDMs && {name:"Direct Messages", acronym:"DMs", id:BDFDB.DiscordConstants.ME, getIconURL: _ => {}}].concat(BDFDB.LibraryModules.FolderStore.getFlattenedGuilds()).filter(n => n).map(guild => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
								text: guild.name,
								children: BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.DOMUtils.formatClassName(this.props.guildClassName, BDFDB.disCN.settingsguild, this.props.disabled.includes(guild.id) && BDFDB.disCN.settingsguilddisabled),
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Icon, {
										guild: guild,
										size: this.props.size || InternalComponents.LibraryComponents.GuildComponents.Icon.Sizes.MEDIUM
									}),
									onClick: e => {
										let isDisabled = this.props.disabled.includes(guild.id);
										if (isDisabled) BDFDB.ArrayUtils.remove(this.props.disabled, guild.id, true);
										else this.props.disabled.push(guild.id);
										if (typeof this.props.onClick == "function") this.props.onClick(this.props.disabled, this);
										BDFDB.ReactUtils.forceUpdate(this);
									}
								})
							}))
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsPanel = reactInitialized && class BDFDB_SettingsPanel extends LibraryModules.React.Component {
					componentWillUnmount() {
						if (BDFDB.ObjectUtils.is(this.props.plugin) && typeof this.props.plugin.onSettingsClosed == "function") this.props.plugin.onSettingsClosed();
					}
					render() {
						let headerItems = [
							this.props.title && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
								className: BDFDB.disCN.settingspaneltitle,
								tag: InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H2,
								children: this.props.title
							}),
							this.props.controls && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
								className: BDFDB.disCN.settingspanelheadercontrols,
								align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
								grow: 0,
								children: this.props.controls
							})
						].flat(10).filter(n => n);
						
						let panelItems = [
							this.props.children
						].flat(10).filter(n => n);
						
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							direction: InternalComponents.LibraryComponents.Flex.Direction.VERTICAL,
							children: headerItems.length ? ([
								[
									BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
										className: BDFDB.disCN.settingspanelheader,
										align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
										children: headerItems
									}),
									panelItems.length && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormDivider, {
										className: BDFDB.disCNS.margintop4 + BDFDB.disCN.marginbottom8
									})
								],
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									className: BDFDB.disCN.settingspanelinner,
									direction: InternalComponents.LibraryComponents.Flex.Direction.VERTICAL,
									children: panelItems
								})
							].flat(10).filter(n => n)) : panelItems
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsPanelInner = reactInitialized && class BDFDB_SettingsPanelInner extends LibraryModules.React.Component {
					render() {
						return this.props.children ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: this.props.className,
							direction: InternalComponents.LibraryComponents.Flex.Direction.VERTICAL,
							children: [
								!this.props.first ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormDivider, {
									className: BDFDB.disCN.marginbottom8
								}) : null,
								typeof this.props.title == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
									className: BDFDB.disCN.marginbottom4,
									tag: InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H3,
									children: this.props.title
								}) : null,
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									className: BDFDB.disCN.settingspanellist,
									direction: InternalComponents.LibraryComponents.Flex.Direction.VERTICAL,
									children: this.props.children
								}),
								!this.props.last ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormDivider, {
									className: BDFDB.disCN.marginbottom20
								}) : null
							]
						}) : null;
					}
				};
				
				InternalComponents.LibraryComponents.SettingsItem = reactInitialized && class BDFDB_SettingsItem extends LibraryModules.React.Component {
					handleChange(value) {
						if (typeof this.props.onChange == "function") this.props.onChange(value, this);
					}
					render() {
						if (typeof this.props.type != "string" || !["BUTTON", "SELECT", "SLIDER", "SWITCH", "TEXTINPUT"].includes(this.props.type.toUpperCase())) return null;
						let childComponent = InternalComponents.LibraryComponents[this.props.type];
						if (!childComponent) return null;
						if (this.props.mini && childComponent.Sizes) this.props.size = childComponent.Sizes.MINI || childComponent.Sizes.MIN;
						let margin = this.props.margin != null ? this.props.margin : (this.props.mini ? 0 : 8);
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.settingsrow, BDFDB.disCN.settingsrowcontainer, this.props.disabled && BDFDB.disCN.settingsrowdisabled, margin != null && (BDFDB.DiscordClasses[`marginbottom${margin}`] && BDFDB.disCN[`marginbottom${margin}`] || margin == 0 && BDFDB.disCN.marginreset)),
							id: this.props.id,
							children: [
								this.props.dividerTop ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormDivider, {
									className: this.props.mini ? BDFDB.disCN.marginbottom4 : BDFDB.disCN.marginbottom8
								}) : null,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.settingsrowlabel,
									children: [
										this.props.label ? (this.props.tag ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
											className: BDFDB.DOMUtils.formatClassName(this.props.labelClassName, BDFDB.disCN.flexchild, BDFDB.disCN.marginreset),
											tag: this.props.tag,
											children: this.props.label
										}) : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsLabel, {
											className: BDFDB.DOMUtils.formatClassName(this.props.labelClassName, BDFDB.disCN.flexchild),
											mini: this.props.mini,
											label: this.props.label
										})) : null,
										this.props.labelchildren,
										BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
											className: BDFDB.disCNS.settingsrowcontrol + BDFDB.disCN.flexchild,
											grow: 0,
											shrink: this.props.basis ? 0 : 1,
											basis: this.props.basis,
											wrap: true,
											children: BDFDB.ReactUtils.createElement(childComponent, BDFDB.ObjectUtils.exclude(Object.assign(BDFDB.ObjectUtils.exclude(this.props, "className", "id", "type"), this.props.childProps, {
												onChange: this.handleChange.bind(this),
												onValueChange: this.handleChange.bind(this)
											}), "basis", "margin", "dividerBottom", "dividerTop", "label", "labelClassName", "labelchildren", "tag", "mini", "note", "childProps"))
										})
									].flat(10).filter(n => n)
								}),
								typeof this.props.note == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
									className: BDFDB.disCN.settingsrownote,
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormText, {
										disabled: this.props.disabled,
										type: InternalComponents.LibraryComponents.FormComponents.FormText.Types.DESCRIPTION,
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextScroller, {speed: 2, children: this.props.note})
									})
								}) : null,
								this.props.dividerBottom ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormDivider, {
									className: this.props.mini ? BDFDB.disCN.margintop4 : BDFDB.disCN.margintop8
								}) : null
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsLabel = reactInitialized && class BDFDB_SettingsLabel extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextScroller, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.settingsrowtitle, this.props.mini ? BDFDB.disCN.settingsrowtitlemini : BDFDB.disCN.settingsrowtitledefault, BDFDB.disCN.cursordefault),
							speed: 2,
							children: this.props.label
						});
					}	
				};
				
				InternalComponents.LibraryComponents.SettingsList = reactInitialized && class BDFDB_SettingsList extends LibraryModules.React.Component {
					componentDidMount() {
						let list = BDFDB.ReactUtils.findDOMNode(this);
						if (list && !this.props.maxWidth) {
							let headers = Array.from(list.querySelectorAll(BDFDB.dotCN.settingstableheader));
							headers.shift();
							if (BDFDB.DOMUtils.getRects(headers[0]).width == 0) BDFDB.TimeUtils.timeout(_ => {this.resizeList(list, headers);});
							else this.resizeList(list, headers);
						}
					}
					resizeList(list, headers) {
						let maxWidth = 0, biggestWidth = 0;
						if (!maxWidth) {
							for (let header of headers) {
								header.style = "";
								let width = BDFDB.DOMUtils.getRects(header).width;
								maxWidth = width > maxWidth ? width : maxWidth;
							}
							maxWidth += 4;
							biggestWidth = maxWidth;
						}
						if (headers.length * maxWidth > 300) {
							this.props.vertical = true;
							maxWidth = parseInt(290 / headers.length);
						}
						else if (maxWidth < 36) {
							maxWidth = 36;
							biggestWidth = maxWidth;
						}
						this.props.maxWidth = maxWidth;
						this.props.biggestWidth = biggestWidth;
						this.props.fullWidth = BDFDB.DOMUtils.getRects(list).width;
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						this.props.settings = BDFDB.ArrayUtils.is(this.props.settings) ? this.props.settings : [];
						this.props.renderLabel = typeof this.props.renderLabel == "function" ? this.props.renderLabel : data => data.label;
						this.props.data = (BDFDB.ArrayUtils.is(this.props.data) ? this.props.data : [{}]).filter(n => n);
						let labelWidth = this.props.maxWidth && this.props.fullWidth && (this.props.fullWidth - 20 - (this.props.maxWidth * this.props.settings.length));
						let configWidth = this.props.maxWidth && this.props.maxWidth * this.props.settings.length;
						let isHeaderClickable = typeof this.props.onHeaderClick == "function" || typeof this.props.onHeaderContextMenu == "function";
						let renderItem = data => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Card, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName([this.props.cardClassName, data.className].filter(n => n).join(" ").indexOf(BDFDB.disCN.card) == -1 && BDFDB.disCN.cardprimaryoutline, BDFDB.disCN.settingstablecard, this.props.cardClassName, data.className),
							cardId: data.key,
							backdrop: false,
							style: Object.assign({}, this.props.cardStyle, data.style),
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									className: BDFDB.disCN.settingstablecardlabel,
									align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
									grow: 0,
									shrink: 0,
									basis: labelWidth || "auto",
									style: {maxWidth: labelWidth || null},
									children: this.props.renderLabel(data)
								}),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									className: BDFDB.disCN.settingstablecardconfigs,
									justify: InternalComponents.LibraryComponents.Flex.Justify.AROUND,
									align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
									grow: 0,
									shrink: 0,
									basis: configWidth || "auto",
									style: {maxWidth: configWidth || null},
									children: this.props.settings.map(setting => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
										className: BDFDB.disCN.checkboxcontainer,
										grow: 0,
										shrink: 0,
										wrap: true,
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Checkbox, {
											disabled: data.disabled,
											cardId: data.key,
											settingId: setting,
											shape: InternalComponents.LibraryComponents.Checkbox.Shapes.ROUND,
											type: InternalComponents.LibraryComponents.Checkbox.Types.INVERTED,
											value: data[setting],
											onChange: this.props.onCheckboxChange
										})
									})).flat(10).filter(n => n)
								})
							]
						}), "title", "data", "settings", "renderLabel", "cardClassName", "cardStyle", "onCheckboxChange", "maxWidth", "fullWidth", "biggestWidth", "pagination"));
						let header = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.disCN.settingstableheaders,
							align: InternalComponents.LibraryComponents.Flex.Align.STRETCH,
							style: this.props.vertical && this.props.biggestWidth ? {
								marginTop: this.props.biggestWidth - 15 || 0
							} : {},
							children: [].concat(this.props.title || "", this.props.settings).map((setting, i) => BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(i == 0 ? BDFDB.disCN.settingstableheadername : BDFDB.disCN.settingstableheaderoption, i != 0 && this.props.vertical && BDFDB.disCN.settingstableheadervertical, BDFDB.disCN.colorbase, BDFDB.disCN.size10, isHeaderClickable && BDFDB.disCN.cursorpointer),
								onClick: _ => {if (typeof this.props.onHeaderClick == "function") this.props.onHeaderClick(setting, this);},
								onContextMenu: _ => {if (typeof this.props.onHeaderContextMenu == "function") this.props.onHeaderContextMenu(setting, this);},
								style: i != 0 && this.props.maxWidth ? {
									maxWidth: this.props.maxWidth,
									width: this.props.maxWidth,
									flex: `0 0 ${this.props.maxWidth}px`
								} : {},
								children: BDFDB.ReactUtils.createElement("span", {
									children: setting
								})
							}))
						});
						let usePagination = BDFDB.ObjectUtils.is(this.props.pagination);
						return !this.props.data.length ? null : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.settingstablelist, this.props.className),
							children: [
								!usePagination && header,
								!usePagination ? this.props.data.map(renderItem) : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PaginatedList, Object.assign({}, this.props.pagination, {
									header: header,
									items: this.props.data,
									renderItem: renderItem,
									onJump: (offset, instance) => {
										this.props.pagination.offset = offset;
										if (typeof this.props.pagination.onJump == "function") this.props.pagination.onJump(offset, this, instance);
									}
								}))
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsSaveItem = reactInitialized && class BDFDB_SettingsSaveItem extends LibraryModules.React.Component {
					saveSettings(value) {
						if (!BDFDB.ArrayUtils.is(this.props.keys) || !BDFDB.ObjectUtils.is(this.props.plugin)) return;
						let keys = this.props.keys.filter(n => n);
						let option = keys.shift();
						if (BDFDB.ObjectUtils.is(this.props.plugin) && option) {
							let data = BDFDB.DataUtils.load(this.props.plugin, option);
							let newData = "";
							for (let key of keys) newData += `{"${key}":`;
							value = value != null && value.value != null ? value.value : value;
							let isString = typeof value == "string";
							let marker = isString ? `"` : ``;
							newData += (marker + (isString ? value.replace(/\\/g, "\\\\") : value) + marker) + "}".repeat(keys.length);
							newData = JSON.parse(newData);
							BDFDB.DataUtils.save(BDFDB.ObjectUtils.is(newData) ? BDFDB.ObjectUtils.deepAssign({}, data, newData) : newData, this.props.plugin, option);
							this.props.plugin.SettingsUpdated = true;
						}
						if (typeof this.props.onChange == "function") this.props.onChange(value, this);
					}
					render() {
						if (typeof this.props.type != "string" || !["SELECT", "SLIDER", "SWITCH", "TEXTINPUT"].includes(this.props.type.toUpperCase())) return null;
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsItem, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							onChange: this.saveSettings.bind(this)
						}), "keys", "key", "plugin"));
					}
				};
				
				InternalComponents.LibraryComponents.SidebarList = reactInitialized && class BDFDB_SidebarList extends LibraryModules.React.Component {
					handleItemSelect(item) {
						this.props.selectedItem = item;
						if (typeof this.props.onItemSelect == "function") this.props.onItemSelect(item, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let items = (BDFDB.ArrayUtils.is(this.props.items) ? this.props.items : [{}]).filter(n => n);
						let selectedItem = this.props.selectedItem || (items[0] || {}).value;
						let selectedElements = (items.find(n => n.value == selectedItem) || {}).elements;
						let renderElement = typeof this.props.renderElement == "function" ? this.props.renderElement : (_ => {});
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.sidebarlist),
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Scrollers.Thin, {
									className: BDFDB.DOMUtils.formatClassName(this.props.sidebarClassName, BDFDB.disCN.sidebar),
									fade: true,
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TabBar, {
										itemClassName: this.props.itemClassName,
										type: InternalComponents.LibraryComponents.TabBar.Types.SIDE,
										items: items,
										selectedItem: selectedItem,
										renderItem: this.props.renderItem,
										onItemSelect: this.handleItemSelect.bind(this)
									})
								}),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Scrollers.Thin, {
									className: BDFDB.DOMUtils.formatClassName(this.props.contentClassName, BDFDB.disCN.sidebarcontent),
									fade: true,
									children: [selectedElements].flat(10).filter(n => n).map(data => renderElement(data))
								})
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.Slider = reactInitialized && class BDFDB_Slider extends LibraryModules.React.Component {
					handleMarkerRender(marker) {
						let newMarker = BDFDB.NumberUtils.mapRange([0, 100], this.props.edges, marker);
						if (typeof this.props.digits == "number") newMarker = Math.round(newMarker * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						return newMarker;
					}
					handleValueChange(value) {
						let newValue = BDFDB.NumberUtils.mapRange([0, 100], this.props.edges, value);
						if (typeof this.props.digits == "number") newValue = Math.round(newValue * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						this.props.defaultValue = this.props.value = newValue;
						if (typeof this.props.onValueChange == "function") this.props.onValueChange(newValue, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleValueRender(value) {
						let newValue = BDFDB.NumberUtils.mapRange([0, 100], this.props.edges, value);
						if (typeof this.props.digits == "number") newValue = Math.round(newValue * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						if (typeof this.props.onValueRender == "function") {
							let tempReturn = this.props.onValueRender(newValue, this);
							if (tempReturn != undefined) newValue = tempReturn;
						}
						return newValue;
					}
					render() {
						let value = this.props.value || this.props.defaultValue || 0;
						if (!BDFDB.ArrayUtils.is(this.props.edges) || this.props.edges.length != 2) this.props.edges = [this.props.min || this.props.minValue || 0, this.props.max || this.props.maxValue || 100];
						this.props.minValue = 0;
						this.props.maxValue = 100;
						let defaultValue = BDFDB.NumberUtils.mapRange(this.props.edges, [0, 100], value);
						if (typeof this.props.digits == "number") defaultValue = Math.round(defaultValue * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Slider, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							initialValue: defaultValue,
							markers: typeof this.props.markerAmount == "number" ? Array.from(Array(this.props.markerAmount).keys()).map((_, i) => i * (this.props.maxValue - this.props.minValue)/10) : undefined,
							onMarkerRender: this.handleMarkerRender.bind(this),
							onValueChange: this.handleValueChange.bind(this),
							onValueRender: this.handleValueRender.bind(this)
						}), "digits", "edges", "max", "min", "markerAmount"));
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.Slider, {hideBubble:false});
				
				InternalComponents.LibraryComponents.SvgIcon = reactInitialized && class BDFDB_Icon extends LibraryModules.React.Component {
					render() {
						if (BDFDB.ObjectUtils.is(this.props.name)) {
							if (this.props.className) this.props.nativeClass = true;
							this.props.iconSVG = this.props.name.icon;
							let props = Object.assign({
								width: 24,
								height: 24,
								color: "currentColor"
							}, this.props.name.defaultProps, this.props, {
								className: BDFDB.DOMUtils.formatClassName(typeof this.props.name.getClassName == "function" && this.props.name.getClassName(this.props), this.props.className)
							});
							for (let key in props) this.props.iconSVG = this.props.iconSVG.replace(new RegExp(`%%${key}`, "g"), props[key]);
						}
						if (this.props.iconSVG) {
							let icon = BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(this.props.iconSVG));
							if (BDFDB.ReactUtils.isValidElement(icon)) {
								icon.props.className = BDFDB.DOMUtils.formatClassName(!this.props.nativeClass && BDFDB.disCN.svgicon, icon.props.className, this.props.className);
								icon.props.style = Object.assign({}, icon.props.style, this.props.style);
								icon.props = Object.assign({}, BDFDB.ObjectUtils.extract(this.props, "onClick", "onContextMenu", "onMouseDown", "onMouseUp", "onMouseEnter", "onMouseLeave"), icon.props);
								return icon;
							}
						}
						return null;
					}
				};
				InternalComponents.LibraryComponents.SvgIcon.Names = {
					ARROW_DOWN: {
						defaultProps: {
							width: 18,
							height: 18
						},
						icon: `<svg name="ArrowDown" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 18 18"><path fill="%%color" d="M4 7l5 5 5-5H4z"></path></svg>`
					},
					ARROW_UP: {
						defaultProps: {
							width: 18,
							height: 18
						},
						icon: `<svg name="ArrowUp" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 18 18"><path fill="%%color" d="M4 11l5-5 5 5H4z"></path></svg>`
					},
					CHANGELOG: {
						icon: `<svg name="ChangeLog" fill="%%color" width="%%width" height="%%height" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"></path></svg>`
					},
					CHECKBOX: {
						defaultProps: {
							background: "",
							foreground: ""
						},
						icon: `<svg aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.37499 3H18.625C19.9197 3 21.0056 4.08803 21 5.375V18.625C21 19.936 19.9359 21 18.625 21H5.37499C4.06518 21 3 19.936 3 18.625V5.375C3 4.06519 4.06518 3 5.37499 3Z" class="%%background" fill="%%color"></path><path d="M9.58473 14.8636L6.04944 11.4051L4.50003 12.9978L9.58473 18L19.5 8.26174L17.9656 6.64795L9.58473 14.8636Z" class="%%foreground" fill="%%color"></path></svg>`
					},
					CHECKBOX_EMPTY: {
						defaultProps: {
							foreground: ""
						},
						icon: `<svg name="CheckBoxEmpty" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.625 3H5.375C4.06519 3 3 4.06519 3 5.375V18.625C3 19.936 4.06519 21 5.375 21H18.625C19.936 21 21 19.936 21 18.625V5.375C21.0057 4.08803 19.9197 3 18.625 3ZM19 19V5H4.99999V19H19Z" class="%%foreground" fill="%%color"></path></svg>`
					},
					CHECKMARK: {
						defaultProps: {
							width: 18,
							height: 18
						},
						icon: `<svg name="Checkmark" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 18 18"><g fill="none" fill-rule="evenodd"><polyline stroke="%%color" stroke-width="2" points="3.5 9.5 7 13 15 5"></polyline></g></svg>`
					},
					CLOSE: {
						defaultProps: {
							width: 12,
							height: 12
						},
						icon: `<svg name="Close" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 12 12"><g fill="none" fill-rule="evenodd" aria-hidden="true"><path d="M0 0h12v12H0"></path><path class="fill" fill="%%color" d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6"></path></g></svg>`
					},
					CLOSE_CIRCLE: {
						icon: `<svg name="CloseCircle" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 14 14"><path fill="%%color" d="M7.02799 0.333252C3.346 0.333252 0.361328 3.31792 0.361328 6.99992C0.361328 10.6819 3.346 13.6666 7.02799 13.6666C10.71 13.6666 13.6947 10.6819 13.6947 6.99992C13.6947 3.31792 10.7093 0.333252 7.02799 0.333252ZM10.166 9.19525L9.22333 10.1379L7.02799 7.94325L4.83266 10.1379L3.89 9.19525L6.08466 6.99992L3.88933 4.80459L4.832 3.86259L7.02733 6.05792L9.22266 3.86259L10.1653 4.80459L7.97066 6.99992L10.166 9.19525Z"></path></svg>`
					},
					COG: {
						defaultProps: {
							width: 20,
							height: 20
						},
						icon: `<svg name="Cog" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill="%%color" d="M19.738 10H22V14H19.739C19.498 14.931 19.1 15.798 18.565 16.564L20 18L18 20L16.565 18.564C15.797 19.099 14.932 19.498 14 19.738V22H10V19.738C9.069 19.498 8.203 19.099 7.436 18.564L6 20L4 18L5.436 16.564C4.901 15.799 4.502 14.932 4.262 14H2V10H4.262C4.502 9.068 4.9 8.202 5.436 7.436L4 6L6 4L7.436 5.436C8.202 4.9 9.068 4.502 10 4.262V2H14V4.261C14.932 4.502 15.797 4.9 16.565 5.435L18 3.999L20 5.999L18.564 7.436C19.099 8.202 19.498 9.069 19.738 10ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"></path></svg>`
					},
					CROWN: {
						icon: `<svg name="Crown" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.6572 5.42868C13.8879 5.29002 14.1806 5.30402 14.3973 5.46468C14.6133 5.62602 14.7119 5.90068 14.6473 6.16202L13.3139 11.4954C13.2393 11.7927 12.9726 12.0007 12.6666 12.0007H3.33325C3.02725 12.0007 2.76058 11.792 2.68592 11.4954L1.35258 6.16202C1.28792 5.90068 1.38658 5.62602 1.60258 5.46468C1.81992 5.30468 2.11192 5.29068 2.34325 5.42868L5.13192 7.10202L7.44592 3.63068C7.46173 3.60697 7.48377 3.5913 7.50588 3.57559C7.5192 3.56612 7.53255 3.55663 7.54458 3.54535L6.90258 2.90268C6.77325 2.77335 6.77325 2.56068 6.90258 2.43135L7.76458 1.56935C7.89392 1.44002 8.10658 1.44002 8.23592 1.56935L9.09792 2.43135C9.22725 2.56068 9.22725 2.77335 9.09792 2.90268L8.45592 3.54535C8.46794 3.55686 8.48154 3.56651 8.49516 3.57618C8.51703 3.5917 8.53897 3.60727 8.55458 3.63068L10.8686 7.10202L13.6572 5.42868ZM2.66667 12.6673H13.3333V14.0007H2.66667V12.6673Z" fill="%%color" aria-hidden="true"></path></svg>`
					},
					DOWNLOAD: {
						defaultProps: {
							foreground: ""
						},
						icon: `<svg name="Download" fill="%%color" aria-hidden="false" width="%%width" height="%%height" viewBox="-2 -2 28 28"><path class="%%foreground" fill-rule="evenodd" clip-rule="evenodd" d="M16.293 9.293L17.707 10.707L12 16.414L6.29297 10.707L7.70697 9.293L11 12.586V2H13V12.586L16.293 9.293ZM18 20V18H20V20C20 21.102 19.104 22 18 22H6C4.896 22 4 21.102 4 20V18H6V20H18Z" aria-hidden="true"></path></svg>`
					},
					DROPPER: {
						defaultProps: {
							width: 16,
							height: 16,
							foreground: ""
						},
						icon: `<svg width="%%width" height="%%height" viewBox="0 0 16 16"><g fill="none"><path d="M-4-4h24v24H-4z"></path><path class="%%foreground" fill="%%color" d="M14.994 1.006C13.858-.257 11.904-.3 10.72.89L8.637 2.975l-.696-.697-1.387 1.388 5.557 5.557 1.387-1.388-.697-.697 1.964-1.964c1.13-1.13 1.3-2.985.23-4.168zm-13.25 10.25c-.225.224-.408.48-.55.764L.02 14.37l1.39 1.39 2.35-1.174c.283-.14.54-.33.765-.55l4.808-4.808-2.776-2.776-4.813 4.803z"></path></g></svg>`
					},
					FOLDER: {
						icon: `<svg name="Folder" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill="%%color" d="M20 7H12L10.553 5.106C10.214 4.428 9.521 4 8.764 4H3C2.447 4 2 4.447 2 5V19C2 20.104 2.895 21 4 21H20C21.104 21 22 20.104 22 19V9C22 7.896 21.104 7 20 7Z"></path></svg>`
					},
					GITHUB: {
						icon: `<svg name="Github" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><g fill="%%color"><path d="m12 .5c-6.63 0-12 5.28-12 11.792 0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.56 4.801-1.548 8.236-5.97 8.236-11.173 0-6.512-5.373-11.792-12-11.792z"></path></g></svg>`
					},
					GRADIENT: {
						defaultProps: {
							width: 36,
							height: 36
						},
						icon: `<svg name="Gradient" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 36 36" fill="%%color" fill-rule="evenodd"><path d="M 5 0 h 26 c 0 0, 5 0, 5 5 v 26 c 0 0, 0 5, -5 5 h -26 c 0 0, -5 0, -5 -5 v -26 c 0 0, 0 -5, 5 -5 z M 4 4 h 20 v 28 h -20 v -28 z"></path><rect x="12" y="4" width="4" height="4"></rect><rect x="20" y="4" width="4" height="4"></rect><rect x="16" y="8" width="4" height="4"></rect><rect x="12" y="12" width="4" height="4"></rect><rect x="20" y="12" width="4" height="4"></rect><rect x="16" y="16" width="4" height="4"></rect><rect x="12" y="20" width="4" height="4"></rect><rect x="20" y="20" width="4" height="4"></rect><rect x="16" y="24" width="4" height="4"></rect><rect x="12" y="28" width="4" height="4"></rect><rect x="20" y="28" width="4" height="4"></rect></svg>`
					},
					LEFT_CARET: {
						icon: `<svg name="LeftCaret" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><polygon fill="%%color" fill-rule="nonzero" points="18.35 4.35 16 2 6 12 16 22 18.35 19.65 10.717 12"></polygon><polygon points="0 0 24 0 24 24 0 24"></polygon></g></svg>`
					},
					LEFT_DOUBLE_CARET: {
						icon: `<svg name="LeftDoubleCaret" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><polygon fill="%%color" fill-rule="nonzero" points="12.35 4.35 10 2 0 12 10 22 12.35 19.65 4.717 12"></polygon><polygon fill="%%color" fill-rule="nonzero" points="24.35 4.35 22 2 12 12 22 22 24.35 19.65 16.717 12"></polygon><polygon points="0 0 24 0 24 24 0 24"></polygon></g></svg>`
					},
					LOCK_CLOSED: {
						icon: `<svg name="LockClosed" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill="%%color" d="M17 11V7C17 4.243 14.756 2 12 2C9.242 2 7 4.243 7 7V11C5.897 11 5 11.896 5 13V20C5 21.103 5.897 22 7 22H17C18.103 22 19 21.103 19 20V13C19 11.896 18.103 11 17 11ZM12 18C11.172 18 10.5 17.328 10.5 16.5C10.5 15.672 11.172 15 12 15C12.828 15 13.5 15.672 13.5 16.5C13.5 17.328 12.828 18 12 18ZM15 11H9V7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V11Z"></path></svg>`
					},
					MENU_CARET: {
						getClassName: props => BDFDB.DOMUtils.formatClassName(BDFDB.disCN.menucaretarrow, props.open && BDFDB.disCN.menucaretopen),
						icon: `<svg name="MenuCaret" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd" aria-hidden="true"><path fill="%%color" d="M16.59 8.59004L12 13.17L7.41 8.59004L6 10L12 16L18 10L16.59 8.59004Z"></path></g></svg>`
					},
					MORE: {
						icon: `<svg name="More" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd" aria-hidden="true"><path fill="%%color" d="M7 12.001C7 10.8964 6.10457 10.001 5 10.001C3.89543 10.001 3 10.8964 3 12.001C3 13.1055 3.89543 14.001 5 14.001C6.10457 14.001 7 13.1055 7 12.001ZM14 12.001C14 10.8964 13.1046 10.001 12 10.001C10.8954 10.001 10 10.8964 10 12.001C10 13.1055 10.8954 14.001 12 14.001C13.1046 14.001 14 13.1055 14 12.001ZM19 10.001C20.1046 10.001 21 10.8964 21 12.001C21 13.1055 20.1046 14.001 19 14.001C17.8954 14.001 17 13.1055 17 12.001C17 10.8964 17.8954 10.001 19 10.001Z"></path></g></svg>`
					},
					NOVA_AT: {
						icon: `<svg name="Nova_At" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill="%%color" d="M12 2C6.486 2 2 6.486 2 12C2 17.515 6.486 22 12 22C14.039 22 15.993 21.398 17.652 20.259L16.521 18.611C15.195 19.519 13.633 20 12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12V12.782C20 14.17 19.402 15 18.4 15L18.398 15.018C18.338 15.005 18.273 15 18.209 15H18C17.437 15 16.6 14.182 16.6 13.631V12C16.6 9.464 14.537 7.4 12 7.4C9.463 7.4 7.4 9.463 7.4 12C7.4 14.537 9.463 16.6 12 16.6C13.234 16.6 14.35 16.106 15.177 15.313C15.826 16.269 16.93 17 18 17L18.002 16.981C18.064 16.994 18.129 17 18.195 17H18.4C20.552 17 22 15.306 22 12.782V12C22 6.486 17.514 2 12 2ZM12 14.599C10.566 14.599 9.4 13.433 9.4 11.999C9.4 10.565 10.566 9.399 12 9.399C13.434 9.399 14.6 10.565 14.6 11.999C14.6 13.433 13.434 14.599 12 14.599Z"></path></svg>`
					},
					NOVA_PIN: {
						icon: `<svg name="Nova_Pin" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill="%%color" d="M22 12L12.101 2.10101L10.686 3.51401L12.101 4.92901L7.15096 9.87801V9.88001L5.73596 8.46501L4.32196 9.88001L8.56496 14.122L2.90796 19.778L4.32196 21.192L9.97896 15.536L14.222 19.778L15.636 18.364L14.222 16.95L19.171 12H19.172L20.586 13.414L22 12Z"></path></svg>`
					},
					NOVA_TRASH: {
						icon: `<svg name="Nova_Trash" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill="%%color" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z"></path><path fill="%%color" d="M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z"></path></svg>`
					},
					PATREON: {
						icon: `<svg name="Patreon" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><g fill="%%color"><path d="m 0,0.5 h 4.219 v 23 H 0 Z"></path><path d="m 15.384,0.5 c -4.767,0 -8.644,3.873 -8.644,8.633 0,4.75 3.877,8.61 8.644,8.61 C 20.138,17.743 24,13.878 24,9.133 24,4.374 20.137,0.5 15.384,0.5 Z"></path></g></svg>`
					},
					PAYPAL: {
						icon: `<svg name="PayPal" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 32 32"><g fill="%%color" transform="matrix(0.96,0,0,0.96,-0.14,2)"><path d="M 25.772542,2.414 C 24.280605,0.724 21.580605,0 18.126542,0 H 8.1025423 c -0.706,0 -1.306,0.51 -1.418,1.2 L 2.5106048,27.462 c -0.082,0.518 0.322,0.986 0.85,0.986 h 6.188 l 1.5540002,-9.78 -0.048,0.308 c 0.11,-0.69 0.708,-1.2 1.414,-1.2 h 2.94 c 5.778,0 10.3,-2.328 11.622,-9.062 0.04,-0.2 0.102,-0.584 0.102,-0.584 0.375937,-2.492 -0.0021,-4.182 -1.360063,-5.716 z"></path><path d="m 30.199,10.906 c -1.436,6.63 -6.018,10.138 -13.29,10.138 H 14.273 L 12.305,33.5 h 4.276 c 0.618,0 1.144,-0.446 1.24,-1.052 l 0.05,-0.264 0.984,-6.182 0.064,-0.34 c 0.096,-0.606 0.622,-1.052 1.238,-1.052 h 0.782 c 5.054,0 9.01,-2.036 10.166,-7.926 0.464,-2.364 0.24,-4.346 -0.906,-5.778 z"></path></g></svg>`
					},
					PENCIL: {
						defaultProps: {
							width: 16,
							height: 16
						},
						icon: `<svg name="Pencil" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24"><path fill="%%color" d="M20.1039 9.58997L20.8239 8.87097C22.3929 7.30197 22.3929 4.74797 20.8239 3.17797C19.2549 1.60897 16.6999 1.60897 15.1309 3.17797L14.4119 3.89797L20.1039 9.58997ZM12.9966 5.30896L4.42847 13.8795L10.1214 19.5709L18.6896 11.0003L12.9966 5.30896ZM3.24398 21.968L8.39998 20.68L3.31998 15.6L2.03098 20.756C1.94598 21.096 2.04598 21.457 2.29398 21.705C2.54198 21.953 2.90298 22.052 3.24398 21.968Z"></path></svg>`
					},
					PIN: {
						defaultProps: {
							width: 16,
							height: 16
						},
						icon: `<svg name="Pin" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path fill="%%color" d="M19 3H5V5H7V12H5V14H11V22H13V14H19V12H17V5H19V3Z"></path></g></svg>`
					},
					RAW_TEXT: {
						icon: `<svg name="RawText" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 48 48"><path fill="%%color" d="M 2,2 h 28 v 8 h -6 v -2 h -4 v 28 h 4 v 6 h -16 v -6 h 4 v -28 h -4 v 2 h -6 Z"></path><path fill="%%color" d="M 24,16 h 22 v 7 h -5 v -2 h -3 v 16 h 3 v 5 h -12 v -5 h 3 v -16 h -3 v 2 h -5 Z"></path></svg>`
					},
					RIGHT_CARET: {
						icon: `<svg name="RightCaret" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><polygon fill="%%color" fill-rule="nonzero" points="8.47 2 6.12 4.35 13.753 12 6.12 19.65 8.47 22 18.47 12"></polygon><polygon points="0 0 24 0 24 24 0 24"></polygon></g></svg>`
					},
					RIGHT_DOUBLE_CARET: {
						icon: `<svg name="RightDoubleCaret" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><polygon fill="%%color" fill-rule="nonzero" points="2.47 2 0.12 4.35 7.753 12 0.12 19.65 2.47 22 12.47 12"></polygon><polygon fill="%%color" fill-rule="nonzero" points="14.47 2 12.12 4.35 19.753 12 12.12 19.65 14.47 22 24.47 12"></polygon><polygon points="0 0 24 0 24 24 0 24"></polygon></g></svg>`
					},
					SEARCH: {
						defaultProps: {
							width: 18,
							height: 18
						},
						icon: `<svg name="Search" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 18 18"><g fill="none" fill-rule="evenodd" aria-hidden="true"><path fill="%%color" d="M3.60091481,7.20297313 C3.60091481,5.20983419 5.20983419,3.60091481 7.20297313,3.60091481 C9.19611206,3.60091481 10.8050314,5.20983419 10.8050314,7.20297313 C10.8050314,9.19611206 9.19611206,10.8050314 7.20297313,10.8050314 C5.20983419,10.8050314 3.60091481,9.19611206 3.60091481,7.20297313 Z M12.0057176,10.8050314 L11.3733562,10.8050314 L11.1492281,10.5889079 C11.9336764,9.67638651 12.4059463,8.49170955 12.4059463,7.20297313 C12.4059463,4.32933105 10.0766152,2 7.20297313,2 C4.32933105,2 2,4.32933105 2,7.20297313 C2,10.0766152 4.32933105,12.4059463 7.20297313,12.4059463 C8.49170955,12.4059463 9.67638651,11.9336764 10.5889079,11.1492281 L10.8050314,11.3733562 L10.8050314,12.0057176 L14.8073185,16 L16,14.8073185 L12.2102538,11.0099776 L12.0057176,10.8050314 Z"></path></g></svg>`
					},
					SPEAKER: {
						icon: `<svg name="Speaker" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill="%%color" fill-rule="evenodd" clip-rule="evenodd" d="M11.383 3.07904C11.009 2.92504 10.579 3.01004 10.293 3.29604L6 8.00204H3C2.45 8.00204 2 8.45304 2 9.00204V15.002C2 15.552 2.45 16.002 3 16.002H6L10.293 20.71C10.579 20.996 11.009 21.082 11.383 20.927C11.757 20.772 12 20.407 12 20.002V4.00204C12 3.59904 11.757 3.23204 11.383 3.07904ZM14 5.00195V7.00195C16.757 7.00195 19 9.24595 19 12.002C19 14.759 16.757 17.002 14 17.002V19.002C17.86 19.002 21 15.863 21 12.002C21 8.14295 17.86 5.00195 14 5.00195ZM14 9.00195C15.654 9.00195 17 10.349 17 12.002C17 13.657 15.654 15.002 14 15.002V13.002C14.551 13.002 15 12.553 15 12.002C15 11.451 14.551 11.002 14 11.002V9.00195Z"></path></svg>`
					},
					STREAM: {
						icon: `<svg name="Stream" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill="%%color" fill-rule="evenodd" clip-rule="evenodd" d="M20 3V4L23 3V7L20 6V7C20 7.553 19.552 8 19 8H15C14.448 8 14 7.553 14 7V3C14 2.447 14.448 2 15 2H19C19.552 2 20 2.447 20 3ZM18 15V10H19H20V17C20 18.104 19.103 19 18 19H11V21H15V23H5V21H9V19H2C0.897 19 0 18.104 0 17V6C0 4.897 0.897 4 2 4H12V6H2V15H7H10H13H18Z"></path></svg>`
					},
					TRASH: {
						icon: `<svg name="Trash" aria-hidden="false" width="%%width" height="%%height" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"></path><path fill="%%color" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`
					},
				};
				
				const SwitchIconPaths = {
					a: {
						TOP: "M5.13231 6.72963L6.7233 5.13864L14.855 13.2704L13.264 14.8614L5.13231 6.72963Z",
						BOTTOM: "M13.2704 5.13864L14.8614 6.72963L6.72963 14.8614L5.13864 13.2704L13.2704 5.13864Z"
					},
					b: {
						TOP: "M6.56666 11.0013L6.56666 8.96683L13.5667 8.96683L13.5667 11.0013L6.56666 11.0013Z",
						BOTTOM: "M13.5582 8.96683L13.5582 11.0013L6.56192 11.0013L6.56192 8.96683L13.5582 8.96683Z"
					},
					c: {
						TOP: "M7.89561 14.8538L6.30462 13.2629L14.3099 5.25755L15.9009 6.84854L7.89561 14.8538Z",
						BOTTOM: "M4.08643 11.0903L5.67742 9.49929L9.4485 13.2704L7.85751 14.8614L4.08643 11.0903Z"
					}
				};
				const SwitchInner = function(props) {
					let reducedMotion = BDFDB.ReactUtils.useContext(LibraryModules.PreferencesContext.AccessibilityPreferencesContext).reducedMotion;
					let ref = BDFDB.ReactUtils.useRef(null);
					let state = BDFDB.ReactUtils.useState(false);
					let animation = InternalComponents.LibraryComponents.Animations.useSpring({
						config: {
							mass: 1,
							tension: 250
						},
						opacity: props.disabled ? .3 : 1,
						state: state[0] ? (props.value ? .7 : .3) : (props.value ? 1 : 0)
					});
					let fill = animation.state.to({
						output: [props.uncheckedColor, props.checkedColor]
					});
					let mini = props.size == InternalComponents.LibraryComponents.Switch.Sizes.MINI;
					
					return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.div, {
						className: BDFDB.DOMUtils.formatClassName(props.className, BDFDB.disCN.switch, mini && BDFDB.disCN.switchmini),
						onMouseDown: _ => {
							return !props.disabled && state[1](true);
						},
						onMouseUp: _ => {
							return state[1](false);
						},
						onMouseLeave: _ => {
							return state[1](false);
						},
						style: {
							opacity: animation.opacity,
							backgroundColor: animation.state.to({
								output: [props.uncheckedColor, props.checkedColor]
							})
						},
						tabIndex: -1,
						children: [
							BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.svg, {
								className: BDFDB.disCN.switchslider,
								viewBox: "0 0 28 20",
								preserveAspectRatio: "xMinYMid meet",
								style: {
									left: animation.state.to({
										range: [0, .3, .7, 1],
										output: mini ? [-1, 2, 6, 9] : [-3, 1, 8, 12]
									})
								},
								children: [
									BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.rect, {
										fill: "white",
										x: animation.state.to({
											range: [0, .3, .7, 1],
											output: [4, 0, 0, 4]
										}),
										y: animation.state.to({
											range: [0, .3, .7, 1],
											output: [0, 1, 1, 0]
										}),
										height: animation.state.to({
											range: [0, .3, .7, 1],
											output: [20, 18, 18, 20]
										}),
										width: animation.state.to({
											range: [0, .3, .7, 1],
											output: [20, 28, 28, 20]
										}),
										rx: "10"
									}),
									BDFDB.ReactUtils.createElement("svg", {
										viewBox: "0 0 20 20",
										fill: "none",
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.path, {
												fill: fill,
												d: animation.state.to({
													range: [0, .3, .7, 1],
													output: reducedMotion.enabled ? [SwitchIconPaths.a.TOP, SwitchIconPaths.a.TOP, SwitchIconPaths.c.TOP, SwitchIconPaths.c.TOP] : [SwitchIconPaths.a.TOP, SwitchIconPaths.b.TOP, SwitchIconPaths.b.TOP, SwitchIconPaths.c.TOP]
												})
											}),
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.path, {
												fill: fill,
												d: animation.state.to({
													range: [0, .3, .7, 1],
													output: reducedMotion.enabled ? [SwitchIconPaths.a.BOTTOM, SwitchIconPaths.a.BOTTOM, SwitchIconPaths.c.BOTTOM, SwitchIconPaths.c.BOTTOM] : [SwitchIconPaths.a.BOTTOM, SwitchIconPaths.b.BOTTOM, SwitchIconPaths.b.BOTTOM, SwitchIconPaths.c.BOTTOM]
												})
											})
										]
									})
								]
							}),
							BDFDB.ReactUtils.createElement("input", {
								id: props.id,
								type: "checkbox",
								ref: ref,
								className: BDFDB.DOMUtils.formatClassName(props.inputClassName, BDFDB.disCN.switchinner),
								tabIndex: props.disabled ? -1 : 0,
								onKeyDown: e => {
									if (!props.disabled && !e.repeat && (e.key == " " || e.key == "Enter")) state[1](true);
								},
								onKeyUp: e => {
									if (!props.disabled && !e.repeat) {
										state[1](false);
										if (e.key == "Enter" && ref.current) ref.current.click();
									}
								},
								onChange: e => {
									state[1](false);
									if (typeof props.onChange == "function") props.onChange(e.currentTarget.checked, e);
								},
								checked: props.value,
								disabled: props.disabled
							})
						]
					});
				};
				InternalComponents.LibraryComponents.Switch = reactInitialized && class BDFDB_Switch extends LibraryModules.React.Component {
					handleChange() {
						this.props.value = !this.props.value;
						if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(SwitchInner, Object.assign({}, this.props, {
							onChange: this.handleChange.bind(this)
						}));
					}
				};
				InternalComponents.LibraryComponents.Switch.Sizes = {
					DEFAULT: "default",
					MINI: "mini",
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.Switch, {
					size: InternalComponents.LibraryComponents.Switch.Sizes.DEFAULT,
					uncheckedColor: BDFDB.DiscordConstants.Colors.PRIMARY_DARK_400,
					checkedColor: BDFDB.DiscordConstants.Colors.BRAND
				});
				
				InternalComponents.LibraryComponents.TabBar = reactInitialized && class BDFDB_TabBar extends LibraryModules.React.Component {
					handleItemSelect(item) {
						this.props.selectedItem = item;
						if (typeof this.props.onItemSelect == "function") this.props.onItemSelect(item, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let items = (BDFDB.ArrayUtils.is(this.props.items) ? this.props.items : [{}]).filter(n => n);
						let selectedItem = this.props.selectedItem || (items[0] || {}).value;
						let renderItem = typeof this.props.renderItem == "function" ? this.props.renderItem : (data => data.label || data.value);
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.TabBar, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							selectedItem: selectedItem,
							onItemSelect: this.handleItemSelect.bind(this),
							children: items.map(data => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TabBar.Item, {
								className: BDFDB.DOMUtils.formatClassName(this.props.itemClassName, selectedItem == data.value && this.props.itemSelectedClassName),
								itemType: this.props.type,
								id: data.value,
								children: renderItem(data),
								"aria-label": data.label || data.value
							}))
						}), "itemClassName", "items", "renderItem"));
					}
				};
				
				InternalComponents.LibraryComponents.Table = reactInitialized && class BDFDB_Table extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Table, Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.table, this.props.className),
							headerCellClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tableheadercell, this.props.headerCellClassName),
							sortedHeaderCellClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tableheadercellsorted, this.props.sortedHeaderCellClassName),
							bodyCellClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tablebodycell, this.props.bodyCellClassName),
							onSort: (sortKey, sortDirection) => {
								this.props.sortDirection = this.props.sortKey != sortKey && sortDirection == InternalComponents.LibraryComponents.Table.SortDirection.ASCENDING && this.props.columns.filter(n => n.key == sortKey)[0].reverse ? InternalComponents.LibraryComponents.Table.SortDirection.DESCENDING : sortDirection;
								this.props.sortKey = sortKey;
								this.props.data = BDFDB.ArrayUtils.keySort(this.props.data, this.props.sortKey);
								if (this.props.sortDirection == InternalComponents.LibraryComponents.Table.SortDirection.DESCENDING) this.props.data.reverse();
								if (typeof this.props.onSort == "function") this.props.onSort(this.props.sortKey, this.props.sortDirection);
								BDFDB.ReactUtils.forceUpdate(this);
							}
						}));
					}
				};
				
				InternalComponents.LibraryComponents.TextArea = reactInitialized && class BDFDB_TextArea extends LibraryModules.React.Component {
					handleChange(e) {
						this.props.value = e;
						if (typeof this.props.onChange == "function") this.props.onChange(e, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleBlur(e) {if (typeof this.props.onBlur == "function") this.props.onBlur(e, this);}
					handleFocus(e) {if (typeof this.props.onFocus == "function") this.props.onFocus(e, this);}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.TextArea, Object.assign({}, this.props, {
							onChange: this.handleChange.bind(this),
							onBlur: this.handleBlur.bind(this),
							onFocus: this.handleFocus.bind(this)
						}));
					}
				};
				
				InternalComponents.LibraryComponents.TextGradientElement = reactInitialized && class BDFDB_TextGradientElement extends LibraryModules.React.Component {
					render() {
						if (this.props.gradient && this.props.children) return BDFDB.ReactUtils.createElement("span", {
							children: this.props.children,
							ref: instance => {
								let ele = BDFDB.ReactUtils.findDOMNode(instance);
								if (ele) {
									ele.style.setProperty("background-image", this.props.gradient, "important");
									ele.style.setProperty("color", "transparent", "important");
									ele.style.setProperty("-webkit-background-clip", "text", "important");
								}
							}
						});
						return this.props.children || null;
					}
				};
				
				InternalComponents.LibraryComponents.TextInput = reactInitialized && class BDFDB_TextInput extends LibraryModules.React.Component {
					handleChange(e) {
						let value = e = BDFDB.ObjectUtils.is(e) ? e.currentTarget.value : e;
						this.props.value = this.props.valuePrefix && !value.startsWith(this.props.valuePrefix) ? (this.props.valuePrefix + value) : value;
						if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleInput(e) {if (typeof this.props.onInput == "function") this.props.onInput(BDFDB.ObjectUtils.is(e) ? e.currentTarget.value : e, this);}
					handleKeyDown(e) {if (typeof this.props.onKeyDown == "function") this.props.onKeyDown(e, this);}
					handleBlur(e) {if (typeof this.props.onBlur == "function") this.props.onBlur(e, this);}
					handleFocus(e) {if (typeof this.props.onFocus == "function") this.props.onFocus(e, this);}
					handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
					handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
					handleNumberButton(ins, value) {
						BDFDB.TimeUtils.clear(ins.pressedTimeout);
						ins.pressedTimeout = BDFDB.TimeUtils.timeout(_ => {
							delete this.props.focused;
							BDFDB.ReactUtils.forceUpdate(this);
						}, 1000);
						this.props.focused = true;
						this.handleChange.bind(this)(value);
						this.handleInput.bind(this)(value);
					}
					componentDidMount() {
						if (this.props.type == "file") {
							let navigatorInstance = BDFDB.ReactUtils.findOwner(this, {name: "BDFDB_FileButton"});
							if (navigatorInstance) navigatorInstance.refInput = this;
						}
						let input = BDFDB.ReactUtils.findDOMNode(this);
						if (!input) return;
						input = input.querySelector("input") || input;
						if (input && !input.patched) {
							input.addEventListener("keydown", e => {
								this.handleKeyDown.bind(this)(e);
								e.stopImmediatePropagation();
							});
							input.patched = true;
						}
					}
					render() {
						let inputChildren = [
							BDFDB.ReactUtils.createElement("input", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
								className: BDFDB.DOMUtils.formatClassName(this.props.size && InternalComponents.LibraryComponents.TextInput.Sizes[this.props.size.toUpperCase()] && BDFDB.disCN["input" + this.props.size.toLowerCase()] || BDFDB.disCN.inputdefault, this.props.inputClassName, this.props.focused && BDFDB.disCN.inputfocused, this.props.error || this.props.errorMessage ? BDFDB.disCN.inputerror : (this.props.success && BDFDB.disCN.inputsuccess), this.props.disabled && BDFDB.disCN.inputdisabled, this.props.editable && BDFDB.disCN.inputeditable),
								type: this.props.type == "color" || this.props.type == "file" ? "text" : this.props.type,
								onChange: this.handleChange.bind(this),
								onInput: this.handleInput.bind(this),
								onKeyDown: this.handleKeyDown.bind(this),
								onBlur: this.handleBlur.bind(this),
								onFocus: this.handleFocus.bind(this),
								onMouseEnter: this.handleMouseEnter.bind(this),
								onMouseLeave: this.handleMouseLeave.bind(this),
								maxLength: this.props.type == "file" ? false : this.props.maxLength,
								style: this.props.width ? {width: `${this.props.width}px`} : {},
								ref: this.props.inputRef
							}), "errorMessage", "focused", "error", "success", "inputClassName", "inputChildren", "valuePrefix", "inputPrefix", "size", "editable", "inputRef", "style", "mode", "noAlpha", "filter", "useFilePath", "searchFolders")),
							this.props.inputChildren,
							this.props.type == "color" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
								wrap: true,
								children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ColorSwatches, {
									colors: [],
									color: this.props.value && this.props.mode == "comp" ? BDFDB.ColorUtils.convert(this.props.value.split(","), "RGB") : this.props.value,
									onColorChange: color => {
										this.handleChange(!color ? "" : (this.props.mode == "comp" ? BDFDB.ColorUtils.convert(color, "RGBCOMP").slice(0, 3).join(",") : (this.props.noAlpha ? BDFDB.ColorUtils.convert(color, "RGB") : color)));
									},
									pickerConfig: {gradient:false, alpha:this.props.mode != "comp" && !this.props.noAlpha}
								})
							}) : null,
							this.props.type == "file" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FileButton, {
								filter: this.props.filter,
								mode: this.props.mode,
								useFilePath: this.props.useFilePath,
								searchFolders: this.props.searchFolders
							}) : null
						].flat(10).filter(n => n);
						
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.inputwrapper, this.props.type == "number" && (this.props.size && InternalComponents.LibraryComponents.TextInput.Sizes[this.props.size.toUpperCase()] && BDFDB.disCN["inputnumberwrapper" + this.props.size.toLowerCase()] || BDFDB.disCN.inputnumberwrapperdefault), this.props.className),
							style: this.props.style,
							children: [
								this.props.inputPrefix ? BDFDB.ReactUtils.createElement("span", {
									className: BDFDB.disCN.inputprefix
								}) : null,
								this.props.type == "number" ? BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.inputnumberbuttons,
									children: [
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.inputnumberbuttonup,
											onClick: e => {
												let min = parseInt(this.props.min);
												let max = parseInt(this.props.max);
												let newV = parseInt(this.props.value) + 1 || min || 0;
												if (isNaN(max) || !isNaN(max) && newV <= max) this.handleNumberButton.bind(this)(e._targetInst, isNaN(min) || !isNaN(min) && newV >= min ? newV : min);
											}
										}),
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.inputnumberbuttondown,
											onClick: e => {
												let min = parseInt(this.props.min);
												let max = parseInt(this.props.max);
												let newV = parseInt(this.props.value) - 1 || min || 0;
												if (isNaN(min) || !isNaN(min) && newV >= min) this.handleNumberButton.bind(this)(e._targetInst, isNaN(max) || !isNaN(max) && newV <= max ? newV : max);
											}
										})
									]
								}) : null,
								inputChildren.length == 1 ? inputChildren[0] : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
									children: inputChildren.map((child, i) => i != 0 ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {shrink: 0, children: child}) : child)
								}),
								this.props.errorMessage ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
									className: BDFDB.disCN.carderror,
									size: InternalComponents.LibraryComponents.TextElement.Sizes.SIZE_12,
									color: InternalComponents.LibraryComponents.TextElement.Colors.STATUS_RED,
									children: this.props.errorMessage
								}) : null
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.TextScroller = reactInitialized && class BDFDB_TextScroller extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textscroller, this.props.className),
							style: Object.assign({}, this.props.style, {
								position: "relative",
								display: "block",
								overflow: "hidden"
							}),
							ref: instance => {
								let ele = BDFDB.ReactUtils.findDOMNode(instance);
								if (ele && ele.parentElement) {
									let maxWidth = BDFDB.DOMUtils.getInnerWidth(ele.parentElement);
									if (maxWidth > 50) ele.style.setProperty("max-width", `${maxWidth}px`);
									BDFDB.TimeUtils.timeout(_ => {
										if (document.contains(ele.parentElement)) BDFDB.ReactUtils.forceUpdate(this);
									}, 3000);
									let Animation = new LibraryModules.AnimationUtils.Value(0);
									Animation
										.interpolate({inputRange:[0, 1], outputRange:[0, (BDFDB.DOMUtils.getRects(ele.firstElementChild).width - BDFDB.DOMUtils.getRects(ele).width) * -1]})
										.addListener(v => {ele.firstElementChild.style.setProperty("left", `${v.value}px`, "important");});
									this.scroll = p => {
										let w = p + parseFloat(ele.firstElementChild.style.getPropertyValue("left")) / (BDFDB.DOMUtils.getRects(ele.firstElementChild).width - BDFDB.DOMUtils.getRects(ele).width);
										w = isNaN(w) || !isFinite(w) ? p : w;
										w *= BDFDB.DOMUtils.getRects(ele.firstElementChild).width / (BDFDB.DOMUtils.getRects(ele).width * 2);
										LibraryModules.AnimationUtils.parallel([LibraryModules.AnimationUtils.timing(Animation, {toValue:p, duration:Math.sqrt(w**2) * 4000 / (parseInt(this.props.speed) || 1)})]).start();
									}
								}
							},
							onClick: e => {
								if (typeof this.props.onClick == "function") this.props.onClick(e, this);
							},
							onMouseEnter: e => {
								if (BDFDB.DOMUtils.getRects(e.currentTarget).width < BDFDB.DOMUtils.getRects(e.currentTarget.firstElementChild).width) {
									this.scrolling = true;
									e.currentTarget.firstElementChild.style.setProperty("display", "block", "important");
									this.scroll(1);
								}
							},
							onMouseLeave: e => {
								if (this.scrolling) {
									delete this.scrolling;
									e.currentTarget.firstElementChild.style.setProperty("display", "inline", "important");
									this.scroll(0);
								}
							},
							children: BDFDB.ReactUtils.createElement("div", {
								style: {
									left: "0",
									position: "relative",
									display: "inline",
									whiteSpace: "nowrap"
								},
								children: this.props.children
							})
						});
					}
				};
				InternalComponents.LibraryComponents.TooltipContainer = reactInitialized && class BDFDB_TooltipContainer extends LibraryModules.React.Component {
					updateTooltip(text) {
						if (this.tooltip) this.tooltip.update(text);
					}
					render() {
						let child = (BDFDB.ArrayUtils.is(this.props.children) ? this.props.children[0] : this.props.children) || BDFDB.ReactUtils.createElement("div", {});
						child.props.className = BDFDB.DOMUtils.formatClassName(child.props.className, this.props.className);
						let childProps = Object.assign({}, child.props);
						let shown = false;
						child.props.onMouseEnter = (e, childThis) => {
							if (!shown && !e.currentTarget.BDFDBtooltipShown) {
								e.currentTarget.BDFDBtooltipShown = shown = true;
								this.tooltip = BDFDB.TooltipUtils.create(e.currentTarget, typeof this.props.text == "function" ? this.props.text(this) : this.props.text, Object.assign({
									delay: this.props.delay
								}, this.props.tooltipConfig, {
									onHide: (tooltip, anker) => {
										delete anker.BDFDBtooltipShown;
										shown = false;
										if (this.props.tooltipConfig && typeof this.props.tooltipConfig.onHide == "function") this.props.onHide(tooltip, anker);
									}
								}));
								if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);
								if (typeof childProps.onMouseEnter == "function") childProps.onMouseEnter(e, childThis);
							}
						};
						child.props.onMouseLeave = (e, childThis) => {
							if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);
							if (typeof childProps.onMouseLeave == "function") childProps.onMouseLeave(e, childThis);
						};
						child.props.onClick = (e, childThis) => {
							if (typeof this.props.onClick == "function") this.props.onClick(e, this);
							if (typeof childProps.onClick == "function") childProps.onClick(e, childThis);
						};
						child.props.onContextMenu = (e, childThis) => {
							if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);
							if (typeof childProps.onContextMenu == "function") childProps.onContextMenu(e, childThis);
						};
						return BDFDB.ReactUtils.createElement(LibraryModules.React.Fragment, {
							children: child
						});
					}
				};
				
				InternalComponents.LibraryComponents.UserPopoutContainer = reactInitialized && class BDFDB_UserPopoutContainer extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutContainer, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							wrap: false,
							renderPopout: instance => {
								return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.UserPopout, {
									userId: this.props.userId,
									guildId: this.props.guildId,
									channelId: this.props.channelId
								});
							}
						}), "userId", "guildId", "channelId"));
					}
				};
				
				for (let type in InternalComponents.NativeSubComponents) if (InternalComponents.LibraryComponents[type]) for (let key in InternalComponents.NativeSubComponents[type]) if (key != "displayName" && key != "name" && (typeof InternalComponents.NativeSubComponents[type][key] != "function" || key.charAt(0) == key.charAt(0).toUpperCase())) {
					if (key == "defaultProps") InternalComponents.LibraryComponents[type][key] = Object.assign({}, InternalComponents.LibraryComponents[type][key], InternalComponents.NativeSubComponents[type][key]);
					else InternalComponents.LibraryComponents[type][key] = InternalComponents.NativeSubComponents[type][key];
				}
				BDFDB.LibraryComponents = Object.assign({}, InternalComponents.LibraryComponents);
				
				InternalBDFDB.createCustomControl = function (data) {
					let controlButton = BDFDB.DOMUtils.create(`<${isBeta ? "button" : "div"} class="${BDFDB.DOMUtils.formatClassName(isBeta && BDFDB.disCN._repobutton, BDFDB.disCN._repocontrolsbutton)}"></${isBeta ? "button" : "div"}>`);
					BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
						className: !isBeta && BDFDB.disCN._repoicon,
						nativeClass: true,
						name: data.svgName,
						width: isBeta ? "20" : "24",
						height: isBeta ? "20" : "24"
					}), controlButton);
					controlButton.addEventListener("click", _ => {if (typeof data.onClick == "function") data.onClick();});
					if (data.tooltipText) controlButton.addEventListener("mouseenter", _ => {BDFDB.TooltipUtils.create(controlButton, data.tooltipText);});
					return controlButton;
				};
				InternalBDFDB.appendCustomControls = function (card) {
					let checkbox = card.querySelector(BDFDB.dotCN._reposwitch);
					if (!checkbox) return;
					let props = BDFDB.ObjectUtils.get(BDFDB.ReactUtils.getInstance(card), "return.stateNode.props");
					let plugin = props && props.addon && (props.addon.plugin || props.addon.instance);
					if (plugin && !props.hasCustomControls && (plugin == libraryInstance || plugin.name && plugin.name && PluginStores.loaded[plugin.name] && PluginStores.loaded[plugin.name] == plugin)) {
						props.hasCustomControls = true;
						let url = plugin.rawUrl ||`https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;
						let controls = [];
						let footerControls = card.querySelector("." + BDFDB.disCN._repofooter.split(" ")[0] + " " + BDFDB.dotCN._repocontrols);
						if (plugin.changeLog) controls.push(InternalBDFDB.createCustomControl({
							tooltipText: BDFDB.LanguageUtils.LanguageStrings.CHANGE_LOG,
							svgName: InternalComponents.LibraryComponents.SvgIcon.Names.CHANGELOG,
							onClick: _ => {BDFDB.PluginUtils.openChangeLog(plugin);}
						}));
						if (window.PluginUpdates && window.PluginUpdates.plugins && window.PluginUpdates.plugins[url] && window.PluginUpdates.plugins[url].outdated) controls.push(InternalBDFDB.createCustomControl({
							tooltipText: BDFDB.LanguageUtils.LanguageStrings.UPDATE_MANUALLY,
							svgName: InternalComponents.LibraryComponents.SvgIcon.Names.DOWNLOAD,
							onClick: _ => {BDFDB.PluginUtils.downloadUpdate(plugin.name, url);}
						}));
						if (footerControls) for (let control of controls) footerControls.insertBefore(control, footerControls.firstElementChild);
						else for (let control of controls) checkbox.parentElement.insertBefore(control, checkbox.parentElement.firstElementChild);
					}
				};
				const cardObserver = (new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(node => {
					if (BDFDB.DOMUtils.containsClass(node, BDFDB.disCN._repocard)) InternalBDFDB.appendCustomControls(node);
					if (node.nodeType != Node.TEXT_NODE) for (let child of node.querySelectorAll(BDFDB.dotCN._repocard)) InternalBDFDB.appendCustomControls(child);
				});}});}));
				BDFDB.ObserverUtils.connect(BDFDB, document.querySelector(`${BDFDB.dotCN.layer}[aria-label="${BDFDB.DiscordConstants.Layers.USER_SETTINGS}"]`), {name:"cardObserver", instance:cardObserver}, {childList: true, subtree:true});
				BDFDB.ObserverUtils.connect(BDFDB, BDFDB.dotCN.applayers, {name:"appLayerObserver", instance:(new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(node => {
					if (node.nodeType != Node.TEXT_NODE && node.getAttribute("aria-label") == BDFDB.DiscordConstants.Layers.USER_SETTINGS) BDFDB.ObserverUtils.connect(BDFDB, node, {name:"cardObserver", instance:cardObserver}, {childList: true, subtree:true});
				});}});}))}, {childList: true});
				for (let child of document.querySelectorAll(BDFDB.dotCN._repocard)) InternalBDFDB.appendCustomControls(child);

				const keyDownTimeouts = {};
				BDFDB.ListenerUtils.add(BDFDB, document, "keydown.BDFDBPressedKeys", e => {
					if (!pressedKeys.includes(e.which)) {
						BDFDB.TimeUtils.clear(keyDownTimeouts[e.which]);
						pressedKeys.push(e.which);
						keyDownTimeouts[e.which] = BDFDB.TimeUtils.timeout(_ => {
							BDFDB.ArrayUtils.remove(pressedKeys, e.which, true);
						}, 60000);
					}
				});
				BDFDB.ListenerUtils.add(BDFDB, document, "keyup.BDFDBPressedKeys", e => {
					BDFDB.TimeUtils.clear(keyDownTimeouts[e.which]);
					BDFDB.ArrayUtils.remove(pressedKeys, e.which, true);
				});
				BDFDB.ListenerUtils.add(BDFDB, document, "mousedown.BDFDBMousePosition", e => {
					mousePosition = e;
				});
				BDFDB.ListenerUtils.add(BDFDB, window, "focus.BDFDBPressedKeysReset", e => {
					pressedKeys = [];
				});
				
				InternalBDFDB.patchedModules = {
					before: {
						MessageContent: "type"
					},
					after: {
						DiscordTag: "default",
						Mention: "default",
						Message: "default",
						MessageHeader: "default",
						MemberListItem: ["componentDidMount", "componentDidUpdate"],
						PrivateChannel: ["componentDidMount", "componentDidUpdate"],
						UserPopout: ["componentDidMount", "componentDidUpdate"],
						UserProfile: ["componentDidMount", "componentDidUpdate"],
						V2C_ContentColumn: "render"
					}
				};
				
				InternalBDFDB.processV2CContentColumn = function (e) {
					if (window.PluginUpdates && window.PluginUpdates.plugins && typeof e.instance.props.title == "string" && e.instance.props.title.toUpperCase().indexOf("PLUGINS") == 0) {
						let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {key: "folder-button"});
						if (index > -1) children.splice(index + 1, 0, BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
							text: "Only checks for updates of plugins, which support the updatecheck. Rightclick for a list of supported plugins. (Listed ≠ Outdated)",
							tooltipConfig: {
								type: "bottom",
								maxWidth: 420
							},
							onContextMenu: (event, instance) => {
								instance.updateTooltip(BDFDB.ObjectUtils.toArray(window.PluginUpdates.plugins).map(p => p.name).filter(n => n).sort().join(", "));
							},
							children: BDFDB.ReactUtils.createElement("button", {
								className: `${BDFDB.disCNS._repobutton + BDFDB.disCN._repofolderbutton} bd-updatebtn`,
								onClick: _ => {
									let toast = BDFDB.NotificationUtils.toast("Plugin update check in progress", {type: "info", timeout: 0});
									BDFDB.PluginUtils.checkAllUpdates().then(outdated => {
										toast.close();
										if (outdated > 0) BDFDB.NotificationUtils.toast(`Plugin update check complete - ${outdated} outdated!`, {type: "error"});
										else BDFDB.NotificationUtils.toast(`Plugin update check complete`, {type: "success"});
									});
								},
								children: "Check for Updates"
							})
						}));
					}
				};
				
				let MessageHeaderExport = BDFDB.ModuleUtils.findByProperties("MessageTimestamp", false);
				if (MessageHeaderExport) InternalBDFDB.processMessage = function (e) {
					if (BDFDB.ObjectUtils.get(e, "instance.props.childrenHeader.type.type.name") && BDFDB.ObjectUtils.get(e, "instance.props.childrenHeader.props.message")) {
						e.instance.props.childrenHeader.type = MessageHeaderExport.exports.default;
					}
				};

				const BDFDB_Patrons = Object.assign({}, InternalData.BDFDB_Patrons);
				InternalBDFDB._processAvatarRender = function (user, avatar) {
					if (BDFDB.ReactUtils.isValidElement(avatar) && BDFDB.ObjectUtils.is(user) && (avatar.props.className || "").indexOf(BDFDB.disCN.bdfdbbadgeavatar) == -1) {
						avatar.props["user_by_BDFDB"] = user.id;
						let role = "", className = BDFDB.DOMUtils.formatClassName((avatar.props.className || "").replace(BDFDB.disCN.avatar, "")), addBadge = settings.showSupportBadges, customBadge = false;
						if (BDFDB_Patrons[user.id] && BDFDB_Patrons[user.id].active) {
							role = BDFDB_Patrons[user.id].t3 ? "BDFDB Patron Level 2" : "BDFDB Patron";
							customBadge = addBadge && BDFDB_Patrons[user.id].t3 && BDFDB_Patrons[user.id].custom;
							className = BDFDB.DOMUtils.formatClassName(className, addBadge && BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbsupporter, customBadge && BDFDB.disCN.bdfdbsupportercustom);
						}
						if (user.id == InternalData.myId) {
							addBadge = true;
							role = "Theme Developer";
							className = BDFDB.DOMUtils.formatClassName(className, BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbdev);
						}
						if (role) {
							delete avatar.props["user_by_BDFDB"];
							if (avatar.type == "img") avatar = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.AvatarComponents.default, Object.assign({}, avatar.props, {
								size: InternalComponents.LibraryComponents.AvatarComponents.Sizes.SIZE_40
							}));
							delete avatar.props.className;
							avatar = BDFDB.ReactUtils.createElement("div", {
								className: className,
								style: {borderRadius: 0, overflow: "visible"},
								"custombadge_id": customBadge ? user.id : null,
								"user_by_BDFDB": user.id,
								children: [avatar]
							});
							if (addBadge) avatar.props.children.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
								text: role,
								children: BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.bdfdbbadge
								})
							}));
							return avatar;
						}
					}
				};
				InternalBDFDB._processAvatarMount = function (user, avatar, wrapper) {
					if (Node.prototype.isPrototypeOf(avatar) && BDFDB.ObjectUtils.is(user) && (avatar.className || "").indexOf(BDFDB.disCN.bdfdbbadgeavatar) == -1) {
						if (wrapper) wrapper.setAttribute("user_by_BDFDB", user.id);
						avatar.setAttribute("user_by_BDFDB", user.id);
						let role = "", addBadge = settings.showSupportBadges, customBadge = false;
						if (BDFDB_Patrons[user.id] && BDFDB_Patrons[user.id].active) {
							role = BDFDB_Patrons[user.id].t3 ? "BDFDB Patron Level 2" : "BDFDB Patron";
							customBadge = addBadge && BDFDB_Patrons[user.id].t3 && BDFDB_Patrons[user.id].custom;
							avatar.className = BDFDB.DOMUtils.formatClassName(avatar.className, addBadge && BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbsupporter, customBadge && BDFDB.disCN.bdfdbsupportercustom);
						}
						else if (user.id == InternalData.myId) {
							addBadge = true;
							role = "Theme Developer";
							avatar.className = BDFDB.DOMUtils.formatClassName(avatar.className, addBadge && BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbdev);
						}
						if (role && !avatar.querySelector(BDFDB.dotCN.bdfdbbadge)) {
							if (addBadge) {
								if (customBadge) avatar.setAttribute("custombadge_id", user.id);
								let badge = document.createElement("div");
								badge.className = BDFDB.disCN.bdfdbbadge;
								badge.addEventListener("mouseenter", _ => {BDFDB.TooltipUtils.create(badge, role, {position: "top"});});
								avatar.style.setProperty("position", "relative");
								avatar.style.setProperty("overflow", "visible");
								avatar.style.setProperty("border-radius", 0);
								avatar.appendChild(badge);
							}
						}
					}
				};
				InternalBDFDB.processMessageHeader = function (e) {
					if (e.instance.props.message && e.instance.props.message.author) {
						let avatarWrapper = BDFDB.ObjectUtils.get(e, "returnvalue.props.children.0");
						if (avatarWrapper && avatarWrapper.props && typeof avatarWrapper.props.children == "function") {
							let renderChildren = avatarWrapper.props.children;
							avatarWrapper.props.children = (...args) => {
								let renderedChildren = renderChildren(...args);
								return InternalBDFDB._processAvatarRender(e.instance.props.message.author, renderedChildren) || renderedChildren;
							};
						}
						else if (avatarWrapper && avatarWrapper.type == "img") e.returnvalue.props.children[0] = InternalBDFDB._processAvatarRender(e.instance.props.message.author, avatarWrapper) || avatarWrapper;
					}
				};
				InternalBDFDB.processMemberListItem = function (e) {
					InternalBDFDB._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.avatarwrapper));
				};
				InternalBDFDB.processPrivateChannel = function (e) {
					InternalBDFDB._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.avatarwrapper));
				};
				InternalBDFDB.processUserPopout = function (e) {
					InternalBDFDB._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.userpopoutavatarwrapper), e.node);
				};
				InternalBDFDB.processUserProfile = function (e) {
					InternalBDFDB._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.avatarwrapper), e.node);
				};
				InternalBDFDB.processDiscordTag = function (e) {
					if (e.instance && e.instance.props && e.returnvalue && e.instance.props.user) e.returnvalue.props.user = e.instance.props.user;
				};
				InternalBDFDB.processMessageContent = function (e) {
					if (BDFDB.ArrayUtils.is(e.instance.props.content)) for (let ele of e.instance.props.content) InternalBDFDB._processMessageContentEle(ele, e.instance.props.message);
				};
				InternalBDFDB._processMessageContentEle = function (ele, message) {
					if (BDFDB.ReactUtils.isValidElement(ele)) {
						if (typeof ele.props.render == "function" && BDFDB.ObjectUtils.get(ele, "props.children.type.displayName") == "Mention") {
							let userId = BDFDB.ObjectUtils.get(ele.props.render(), "props.userId");
							if (userId && !ele.props.children.props.userId) ele.props.children.props.userId = userId;
							if (message && message.mentioned) ele.props.children.props.mentioned = true;
						}
						else if (BDFDB.ReactUtils.isValidElement(ele.props.children)) InternalBDFDB._processMessageContentEle(ele.props.children, message);
						else if (BDFDB.ArrayUtils.is(ele.props.children)) for (let child of ele.props.children) InternalBDFDB._processMessageContentEle(child, message);
					}
					else if (BDFDB.ArrayUtils.is(ele)) for (let child of ele) InternalBDFDB._processMessageContentEle(child, message);
				};
				InternalBDFDB.processMention = function (e) {
					delete e.returnvalue.props.userId;
				};
				
				const ContextMenuTypes = ["UserSettingsCog", "UserProfileActions", "User", "Developer", "Slate", "GuildFolder", "GroupDM", "SystemMessage", "Message", "Native", "Role", "Guild", "Channel"];
				const QueuedComponents = BDFDB.ArrayUtils.removeCopies([].concat(ContextMenuTypes.map(n => n + "ContextMenu"), ["GuildHeaderContextMenu", "MessageOptionContextMenu", "MessageOptionToolbar"]));	
				InternalBDFDB.addContextListeners = function (plugin) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					for (let type of QueuedComponents) if (typeof plugin[`on${type}`] === "function") {
						PluginStores.patchQueues[type].query.push(plugin);
						PluginStores.patchQueues[type].query = BDFDB.ArrayUtils.removeCopies(PluginStores.patchQueues[type].query);
						PluginStores.patchQueues[type].query.sort((x, y) => {return x.name < y.name ? -1 : x.name > y.name ? 1 : 0;});
						for (let module of PluginStores.patchQueues[type].modules) InternalBDFDB.patchContextMenuForPlugin(plugin, type, module);
					}
				};
				InternalBDFDB.patchContextMenuForPlugin = function (plugin, type, module) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (module && module.exports && module.exports.default) BDFDB.PatchUtils.patch(plugin, module.exports, "default", {after: e => {
						if (e.returnValue && typeof plugin[`on${type}`] === "function") plugin[`on${type}`]({instance:{props:e.methodArguments[0]}, returnvalue:e.returnValue, methodname:"default", type:module.exports.default.displayName});
					}});
				};
				InternalBDFDB.executeExtraPatchedPatches = function (type, e) {
					if (e.returnvalue && BDFDB.ObjectUtils.is(PluginStores.patchQueues[type]) && BDFDB.ArrayUtils.is(PluginStores.patchQueues[type].query)) {
						for (let plugin of PluginStores.patchQueues[type].query) if(typeof plugin[`on${type}`] === "function") plugin[`on${type}`](e);
					}
				};

				BDFDB.PluginUtils.load(BDFDB);
				changeLogs = BDFDB.DataUtils.load(BDFDB, "changeLogs");
				BDFDB.PluginUtils.checkChangeLog(BDFDB);
				
				InternalBDFDB.patchPlugin(BDFDB);
				
				for (let type of QueuedComponents) if (!PluginStores.patchQueues[type]) PluginStores.patchQueues[type] = {query:[], modules:[]};
				BDFDB.PatchUtils.patch(BDFDB, LibraryModules.ContextMenuUtils, "openContextMenu", {before: e => {
					let menu = e.methodArguments[1]();
					if (BDFDB.ObjectUtils.is(menu) && menu.type && menu.type.displayName) {
						for (let type of ContextMenuTypes) if (menu.type.displayName.indexOf(type) > -1) {
							let patchType = type + "ContextMenu";
							let module = BDFDB.ModuleUtils.find(m => m == menu.type, false);
							if (module && module.exports && module.exports.default && PluginStores.patchQueues[patchType]) {
								PluginStores.patchQueues[patchType].modules.push(module);
								PluginStores.patchQueues[patchType].modules = BDFDB.ArrayUtils.removeCopies(PluginStores.patchQueues[patchType].modules);
								for (let plugin of PluginStores.patchQueues[patchType].query) InternalBDFDB.patchContextMenuForPlugin(plugin, patchType, module);
							}
							break;
						}
					}
				}});
				
				BDFDB.PatchUtils.patch(BDFDB, BDFDB.ObjectUtils.get(BDFDB.ModuleUtils.findByString("renderReactions", "canAddNewReactions", "showMoreUtilities", false), "exports.default"), "type", {after: e => {
					if (document.querySelector(BDFDB.dotCN.emojipicker) || !BDFDB.ObjectUtils.toArray(PluginStores.loaded).filter(p => p.started).some(p => p.onMessageOptionContextMenu || p.onMessageOptionToolbar)) return;
					let toolbar = BDFDB.ReactUtils.findChild(e.returnValue, {filter: c => c && c.props && c.props.showMoreUtilities != undefined && c.props.showEmojiPicker != undefined && c.props.setPopout != undefined});
					if (toolbar) BDFDB.PatchUtils.patch(BDFDB, toolbar, "type", {after: e2 => {
						let menu = BDFDB.ReactUtils.findChild(e2.returnValue, {filter: c => c && c.props && typeof c.props.onRequestClose == "function" && c.props.onRequestClose.toString().indexOf("moreUtilities") > -1});
						InternalBDFDB.executeExtraPatchedPatches("MessageOptionToolbar", {instance:{props:e2.methodArguments[0]}, returnvalue:e2.returnValue, methodname:"default"});
						if (menu && typeof menu.props.renderPopout == "function") {
							let renderPopout = menu.props.renderPopout;
							menu.props.renderPopout = (...args) => {
								let renderedPopout = renderPopout(...args);
								BDFDB.PatchUtils.patch(BDFDB, renderedPopout, "type", {after: e3 => {
									InternalBDFDB.executeExtraPatchedPatches("MessageOptionContextMenu", {instance:{props:e3.methodArguments[0]}, returnvalue:e3.returnValue, methodname:"default"});
								}}, {noCache: true});
								return renderedPopout;
							}
						}
					}}, {once: true});
				}});
				
				BDFDB.PatchUtils.patch(BDFDB, BDFDB.ObjectUtils.get(BDFDB.ModuleUtils.findByString("guild-header-popout", false), "exports.default.prototype"), "render", {after: e => {
					BDFDB.PatchUtils.patch(BDFDB, e.returnValue.type, "type", {after: e2 => {
						InternalBDFDB.executeExtraPatchedPatches("GuildHeaderContextMenu", {instance:{props:e2.methodArguments[0]}, returnvalue:e2.returnValue, methodname:"type"});
					}}, {noCache: true});
				}});
				
				InternalBDFDB.onSettingsClosed = function () {
					if (InternalBDFDB.SettingsUpdated) {
						delete InternalBDFDB.SettingsUpdated;
						InternalBDFDB.forceUpdateAll();
					}
				};
				
				InternalBDFDB.forceUpdateAll = function () {
					if (LibraryRequires.path) settings = BDFDB.DataUtils.get(BDFDB, "settings");
					
					BDFDB.MessageUtils.rerenderAll();
					BDFDB.PatchUtils.forceAllUpdates(BDFDB);
				};
				
				InternalBDFDB.addSpecialListeners(BDFDB);
				
				if (InternalComponents.LibraryComponents.GuildComponents.BlobMask) {
					let newBadges = ["lowerLeftBadge", "upperLeftBadge"];
					BDFDB.PatchUtils.patch(BDFDB, InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype, "render", {
						before: e => {
							e.thisObject.props = Object.assign({}, InternalComponents.LibraryComponents.GuildComponents.BlobMask.defaultProps, e.thisObject.props);
							for (let type of newBadges) if (!e.thisObject.state[`${type}Mask`]) e.thisObject.state[`${type}Mask`] = new InternalComponents.LibraryComponents.Animations.Controller({spring: 0});
						},
						after: e => {
							let [children, index] = BDFDB.ReactUtils.findParent(e.returnValue, {name: "TransitionGroup"});
							if (index > -1) {
								children[index].props.children.push(!e.thisObject.props.lowerLeftBadge ? null : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.BadgeAnimationContainer, {
									className: BDFDB.disCN.guildlowerleftbadge,
									key: "lower-left-badge",
									animatedStyle: e.thisObject.getLowerLeftBadgeStyles(),
									children: e.thisObject.props.lowerLeftBadge
								}));
								children[index].props.children.push(!e.thisObject.props.upperLeftBadge ? null : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.BadgeAnimationContainer, {
									className: BDFDB.disCN.guildupperleftbadge,
									key: "upper-left-badge",
									animatedStyle: e.thisObject.getUpperLeftBadgeStyles(),
									children: e.thisObject.props.upperLeftBadge
								}));
							}
							[children, index] = BDFDB.ReactUtils.findParent(e.returnValue, {name: "mask"});
							if (index > -1) {
								children[index].props.children.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.rect, {
									x: -4,
									y: -4,
									width: e.thisObject.props.upperLeftBadgeWidth + 8,
									height: 24,
									rx: 12,
									ry: 12,
									transform: e.thisObject.getLeftBadgePositionInterpolation(e.thisObject.state.upperLeftBadgeMask, -1),
									fill: "black"
								}));
								children[index].props.children.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.rect, {
									x: -4,
									y: 28,
									width: e.thisObject.props.lowerLeftBadgeWidth + 8,
									height: 24,
									rx: 12,
									ry: 12,
									transform: e.thisObject.getLeftBadgePositionInterpolation(e.thisObject.state.lowerLeftBadgeMask),
									fill: "black"
								}));
							}
						}
					});
					BDFDB.PatchUtils.patch(BDFDB, InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype, "componentDidMount", {
						after: e => {
							for (let type of newBadges) e.thisObject.state[`${type}Mask`].update({
								spring: e.thisObject.props[type] != null ? 1 : 0,
								immediate: true
							}).start();
						}
					});
					BDFDB.PatchUtils.patch(BDFDB, InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype, "componentWillUnmount", {
						after: e => {
							for (let type of newBadges) if (e.thisObject.state[`${type}Mask`]) e.thisObject.state[`${type}Mask`].dispose();
						}
					});
					BDFDB.PatchUtils.patch(BDFDB, InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype, "componentDidUpdate", {
						after: e => {
							for (let type of newBadges) if (e.thisObject.props[type] != null && e.methodArguments[0][type] == null) {
								e.thisObject.state[`${type}Mask`].update({
									spring: 1,
									immediate: !document.hasFocus(),
									config: {friction: 30, tension: 900, mass: 1}
								}).start();
							}
							else if (e.thisObject.props[type] == null && e.methodArguments[0][type] != null) {
								e.thisObject.state[`${type}Mask`].update({
									spring: 0,
									immediate: !document.hasFocus(),
									config: {duration: 150, friction: 10, tension: 100, mass: 1}
								}).start();
							}
						}
					});
					InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype.getLeftBadgePositionInterpolation = function (e, t) {
						return void 0 === t && (t = 1), e.springs.spring.to([0, 1], [20, 0]).to(function (e) {
							return "translate(" + e * -1 + " " + e * t + ")";
						});
					};
					InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype.getLowerLeftBadgeStyles = function () {
						var e = this.state.lowerLeftBadgeMask.springs.spring;
						return {
							opacity: e.to([0, .5, 1], [0, 0, 1]),
							transform: e.to(function (e) {
								return "translate(" + -1 * (16 - 16 * e) + "px, " + (16 - 16 * e) + "px)";
							})
						};
					};
					InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype.getUpperLeftBadgeStyles = function () {
						var e = this.state.upperLeftBadgeMask.springs.spring;
						return {
							opacity: e.to([0, .5, 1], [0, 0, 1]),
							transform: e.to(function (e) {
								return "translate(" + -1 * (16 - 16 * e) + "px, " + -1 * (16 - 16 * e) + "px)";
							})
						};
					};
					let extraDefaultProps = {};
					for (let type of newBadges) extraDefaultProps[`${type}Width`] = 16;
					InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.GuildComponents.BlobMask, extraDefaultProps);
				}
				
				BDFDB.PatchUtils.patch(BDFDB, LibraryModules.GuildStore, "getGuild", {after: e => {
					if (e.returnValue && e.methodArguments[0] == InternalData.myGuildId) e.returnValue.banner = "https://mwittrien.github.io/BetterDiscordAddons/Library/_res/BDFDB.banner.png";
				}});

				BDFDB.PatchUtils.patch(BDFDB, LibraryModules.IconUtils, "getGuildBannerURL", {instead: e => {
					return e.methodArguments[0].id == InternalData.myGuildId ? e.methodArguments[0].banner : e.callOriginalMethod();
				}});
				
				InternalBDFDB.forceUpdateAll();
			
				const pluginQueue = window.BDFDB_Global && BDFDB.ArrayUtils.is(window.BDFDB_Global.pluginQueue) ? window.BDFDB_Global.pluginQueue : [];

				if (BDFDB.UserUtils.me.id == InternalData.myId) {
					for (let module in DiscordClassModules) if (!DiscordClassModules[module]) BDFDB.LogUtils.warn(module + " not initialized in DiscordClassModules");
					for (let obj in DiscordObjects) if (!DiscordObjects[obj]) BDFDB.LogUtils.warn(obj + " not initialized in DiscordObjects");
					for (let require in LibraryRequires) if (!LibraryRequires[require]) BDFDB.LogUtils.warn(require + " not initialized in LibraryRequires");
					for (let module in LibraryModules) if (!LibraryModules[module]) BDFDB.LogUtils.warn(module + " not initialized in LibraryModules");
					for (let component in InternalComponents.NativeSubComponents) if (!InternalComponents.NativeSubComponents[component]) BDFDB.LogUtils.warn(component + " not initialized in NativeSubComponents");
					for (let component in InternalComponents.LibraryComponents) if (!InternalComponents.LibraryComponents[component]) BDFDB.LogUtils.warn(component + " not initialized in LibraryComponents");

					BDFDB.DevUtils = {};
					BDFDB.DevUtils.generateClassId = InternalBDFDB.generateClassId;
					BDFDB.DevUtils.findByIndex = function (index) {
						return BDFDB.DevUtils.req.c[index];
					};
					BDFDB.DevUtils.findPropAny = function (...strings) {
						window.t = {"$filter":(prop => [...strings].flat(10).filter(n => typeof n == "string").every(string => prop.toLowerCase().indexOf(string.toLowerCase()) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object") for (let j in m) if (window.t.$filter(j)) window.t[j + "_" + i] = m;
							if (m && typeof m == "object" && typeof m.default == "object") for (let j in m.default) if (window.t.$filter(j)) window.t[j + "_default_" + i] = m.default;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.findPropFunc = function (...strings) {
						window.t = {"$filter":(prop => [...strings].flat(10).filter(n => typeof n == "string").every(string => prop.toLowerCase().indexOf(string.toLowerCase()) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object") for (let j in m) if (window.t.$filter(j) && typeof m[j] != "string") window.t[j + "_" + i] = m;
							if (m && typeof m == "object" && typeof m.default == "object") for (let j in m.default) if (window.t.$filter(j) && typeof m.default[j] != "string") window.t[j + "_default_" + i] = m.default;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.findPropStringLib = function (...strings) {
						window.t = {"$filter":(prop => [...strings].flat(10).filter(n => typeof n == "string").every(string => prop.toLowerCase().indexOf(string.toLowerCase()) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object") for (let j in m) if (window.t.$filter(j) && typeof m[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m[j])) window.t[j + "_" + i] = m;
							if (m && typeof m == "object" && typeof m.default == "object") for (let j in m.default) if (window.t.$filter(j) && typeof m.default[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m.default[j])) window.t[j + "_default_" + i] = m.default;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.findNameAny = function (...strings) {
						window.t = {"$filter":(modu => [...strings].flat(10).filter(n => typeof n == "string").some(string => typeof modu.displayName == "string" && modu.displayName.toLowerCase().indexOf(string.toLowerCase()) > -1 || modu.name == "string" && modu.name.toLowerCase().indexOf(string.toLowerCase()) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && (typeof m == "object" || typeof m == "function") && window.t.$filter(m)) window.t[(m.displayName || m.name) + "_" + i] = m;
							if (m && (typeof m == "object" || typeof m == "function") && m.default && (typeof m.default == "object" || typeof m.default == "function") && window.t.$filter(m.default)) window.t[(m.default.displayName || m.default.name) + "_" + i] = m.default;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.findCodeAny = function (...strings) {
						window.t = {"$filter":(m => [...strings].flat(10).filter(n => typeof n == "string").map(string => string.toLowerCase()).every(string => typeof m == "function" && (m.toString().toLowerCase().indexOf(string) > -1 || typeof m.__originalMethod == "function" && m.__originalMethod.toString().toLowerCase().indexOf(string) > -1 || typeof m.__originalFunction == "function" && m.__originalFunction.toString().toLowerCase().indexOf(string) > -1) || BDFDB.ObjectUtils.is(m) && typeof m.type == "function" && m.type.toString().toLowerCase().indexOf(string) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "function" && window.t.$filter(m)) window.t["module_" + i] = {string:m.toString(), func:m};
							if (m && m.__esModule) {
								for (let j in m) if (m[j] && typeof m[j] == "function" && window.t.$filter(m[j])) window.t[j + "_module_" + i] = {string:m[j].toString(), func:m[j], module:m};
								if (m.default && (typeof m.default == "object" || typeof m.default == "function")) for (let j in m.default) if (m.default[j] && typeof m.default[j] == "function" && window.t.$filter(m.default[j])) window.t[j + "_module_" + i + "_default"] = {string:m.default[j].toString(), func:m.default[j], module:m};
							}
						}
						for (let i in BDFDB.DevUtils.req.m) if (typeof BDFDB.DevUtils.req.m[i] == "function" && window.t.$filter(BDFDB.DevUtils.req.m[i])) window.t["funtion_" + i] = {string:BDFDB.DevUtils.req.m[i].toString(), func:BDFDB.DevUtils.req.m[i]};
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.getAllModules = function () {
						window.t = {};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object") window.t[i] = m;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.getAllStringLibs = function () {
						window.t = [];
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object" && !BDFDB.ArrayUtils.is(m) && Object.keys(m).length) {
								var string = true, stringlib = false;
								for (let j in m) {
									if (typeof m[j] != "string") string = false;
									if (typeof m[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m[j])) stringlib = true;
								}
								if (string && stringlib) window.t.push(m);
							}
							if (m && typeof m == "object" && m.default && typeof m.default == "object" && !BDFDB.ArrayUtils.is(m.default) && Object.keys(m.default).length) {
								var string = true, stringlib = false;
								for (let j in m.default) {
									if (typeof m.default[j] != "string") string = false;
									if (typeof m.default[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m.default[j])) stringlib = true;
								}
								if (string && stringlib) window.t.push(m.default);
							}
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.listen = function (strings) {
						strings = BDFDB.ArrayUtils.is(strings) ? strings : Array.from(arguments);
						BDFDB.DevUtils.listenStop();
						BDFDB.DevUtils.listen.p = BDFDB.PatchUtils.patch("WebpackSearch", BDFDB.ModuleUtils.findByProperties(strings), strings[0], {after: e => {
							console.log(e);
						}});
					};
					BDFDB.DevUtils.listenStop = function () {
						if (typeof BDFDB.DevUtils.listen.p == "function") BDFDB.DevUtils.listen.p();
					};
					BDFDB.DevUtils.req = InternalBDFDB.getWebModuleReq();
					
					window.BDFDB_Global = BDFDB;
				}
				else {
					window.BDFDB_Global = Object.assign({
						PluginUtils: {
							buildPlugin: BDFDB.PluginUtils.buildPlugin,
							cleanUp: BDFDB.PluginUtils.cleanUp
						}
					}, config);
					Object.freeze(BDFDB);
				}
				for (let obj in DiscordObjects) if (!DiscordObjects[obj]) {
					DiscordObjects[obj] = function () {};
					BDFDB.DiscordObjects[obj] = function () {};
				}
				for (let component in InternalComponents.NativeSubComponents) if (!InternalComponents.NativeSubComponents[component]) InternalComponents.NativeSubComponents[component] = "div";
				for (let component in InternalComponents.LibraryComponents) if (!InternalComponents.LibraryComponents[component]) {
					InternalComponents.LibraryComponents[component] = "div";
					BDFDB.LibraryComponents[component] = "div";
				}
				
				if (css) BDFDB.DOMUtils.appendLocalStyle("BDFDB", css.replace(/[\n\t\r]/g, "").replace(/\[REPLACE_CLASS_([A-z0-9_]+?)\]/g, function(a, b) {return BDFDB.dotCN[b];}));
				
				window.BDFDB_Global.loaded = true;
				delete window.BDFDB_Global.loading;
			
				BDFDB.LogUtils.log("Finished loading library.");
				
				while (PluginStores.delayedLoad.length) PluginStores.delayedLoad.shift().load();
				while (PluginStores.delayedStart.length) PluginStores.delayedStart.shift().start();
				while (pluginQueue.length) {
					let pluginName = pluginQueue.shift();
					if (pluginName) BDFDB.TimeUtils.timeout(_ => BDFDB.BDUtils.reloadPlugin(pluginName));
				}
			}, "Could not initiate library!", config.name));
		});
	};
	loadLibrary(true);
	
	return class BDFDB_Frame {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return config.info.description;}
		
		load () {
			libraryInstance = this;
			Object.assign(this, config.info, BDFDB.ObjectUtils.exclude(config, "info"));
			if (!BDFDB.BDUtils.isPluginEnabled(config.info.name)) BDFDB.BDUtils.enablePlugin(config.info.name);
		}
		start() {}
		stop() {
			if (!BDFDB.BDUtils.isPluginEnabled(config.info.name)) BDFDB.BDUtils.enablePlugin(config.info.name);
		}
		
		getSettingsPanel (collapseStates = {}) {
			let settingsPanel, settingsItems = [];
			let bdToastSetting = BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts);
			for (let key in settings) settingsItems.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsSaveItem, {
				type: "Switch",
				plugin: InternalBDFDB,
				disabled: key == "showToasts" && bdToastSetting,
				keys: ["settings", key],
				label: InternalBDFDB.defaults.settings[key].description,
				note: key == "showToasts" && bdToastSetting && "Disable BBDs general 'Show Toast' setting before disabling this",
				value: settings[key] || key == "showToasts" && bdToastSetting
			}));
			
			return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(BDFDB, settingsItems);
		}
	}
})();
/* //META{"name":" */