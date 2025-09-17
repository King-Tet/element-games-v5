function createUnityInstance(e, t, n) {
    function r(e, n) {
        if (!r.aborted && t.showBanner)
            return "error" == n && (r.aborted = !0),
            t.showBanner(e, n);
        switch (n) {
        case "error":
            console.error(e);
            break;
        case "warning":
            console.warn(e);
            break;
        default:
            console.log(e)
        }
    }
    function o(e) {
        var t = e.reason || e.error
          , n = t ? t.toString() : e.message || e.reason || ""
          , r = t && t.stack ? t.stack.toString() : "";
        (n += "\n" + (r = r.startsWith(n) ? r.substring(n.length) : r).trim()) && s.stackTraceRegExp && s.stackTraceRegExp.test(n) && S(n, e.filename || t && (t.fileName || t.sourceURL) || "", e.lineno || t && (t.lineNumber || t.line) || 0)
    }
    function a(e, t, n) {
        var r = e[t];
        void 0 !== r && r || (console.warn('Config option "' + t + '" is missing or empty. Falling back to default value: "' + n + '". Consider updating your WebGL template to include the missing config option.'),
        e[t] = n)
    }
    n = n || function() {}
    ;
    var i, s = {
        canvas: e,
        webglContextAttributes: {
            preserveDrawingBuffer: !1,
            powerPreference: 0
        },
        cacheControl: function(e) {
            return e == s.dataUrl || e.match(/\.bundle/) ? "must-revalidate" : "no-store"
        },
        streamingAssetsUrl: "StreamingAssets",
        downloadProgress: {},
        deinitializers: [],
        intervals: {},
        setInterval: function(e, t) {
            return e = window.setInterval(e, t),
            this.intervals[e] = !0,
            e
        },
        clearInterval: function(e) {
            delete this.intervals[e],
            window.clearInterval(e)
        },
        preRun: [],
        postRun: [],
        print: function(e) {
            console.log(e)
        },
        printErr: function(e) {
            console.error(e),
            "string" == typeof e && -1 != e.indexOf("wasm streaming compile failed") && (-1 != e.toLowerCase().indexOf("mime") ? r('HTTP Response Header "Content-Type" configured incorrectly on the server for file ' + s.codeUrl + ' , should be "application/wasm". Startup time performance will suffer.', "warning") : r('WebAssembly streaming compilation failed! This can happen for example if "Content-Encoding" HTTP header is incorrectly enabled on the server for file ' + s.codeUrl + ", but the file is not pre-compressed on disk (or vice versa). Check the Network tab in browser Devtools to debug server header configuration.", "warning"))
        },
        locateFile: function(e) {
            return e
        },
        disabledCanvasEvents: ["contextmenu", "dragstart"]
    };
    for (i in a(t, "companyName", "Unity"),
    a(t, "productName", "WebGL Player"),
    a(t, "productVersion", "1.0"),
    t)
        s[i] = t[i];
    s.streamingAssetsUrl = new URL(s.streamingAssetsUrl,document.URL).href;
    var l = s.disabledCanvasEvents.slice();
    function c(e) {
        e.preventDefault()
    }
    l.forEach(function(t) {
        e.addEventListener(t, c)
    }),
    window.addEventListener("error", o),
    window.addEventListener("unhandledrejection", o);
    var d = ""
      , u = "";
    function f(t) {
        document.webkitCurrentFullScreenElement === e ? e.style.width && (d = e.style.width,
        u = e.style.height,
        e.style.width = "100%",
        e.style.height = "100%") : d && (e.style.width = d,
        e.style.height = u,
        u = d = "")
    }
    document.addEventListener("webkitfullscreenchange", f),
    s.deinitializers.push(function() {
        for (var t in s.disableAccessToMediaDevices(),
        l.forEach(function(t) {
            e.removeEventListener(t, c)
        }),
        window.removeEventListener("error", o),
        window.removeEventListener("unhandledrejection", o),
        document.removeEventListener("webkitfullscreenchange", f),
        s.intervals)
            window.clearInterval(t);
        s.intervals = {}
    }),
    s.QuitCleanup = function() {
        for (var e = 0; e < s.deinitializers.length; e++)
            s.deinitializers[e]();
        s.deinitializers = [],
        "function" == typeof s.onQuit && s.onQuit()
    }
    ;
    var h, $, _, m, b, p, g, v, w, y = {
        Module: s,
        SetFullscreen: function() {
            if (s.SetFullscreen)
                return s.SetFullscreen.apply(s, arguments);
            s.print("Failed to set Fullscreen mode: Player not loaded yet.")
        },
        SendMessage: function() {
            if (s.SendMessage)
                return s.SendMessage.apply(s, arguments);
            s.print("Failed to execute SendMessage: Player not loaded yet.")
        },
        Quit: function() {
            return new Promise(function(e, t) {
                s.shouldQuit = !0,
                s.onQuit = e
            }
            )
        },
        GetMemoryInfo: function() {
            var e = s._getMemInfo();
            return {
                totalWASMHeapSize: s.HEAPU32[e >> 2],
                usedWASMHeapSize: s.HEAPU32[1 + (e >> 2)],
                totalJSHeapSize: s.HEAPF64[1 + (e >> 3)],
                usedJSHeapSize: s.HEAPF64[2 + (e >> 3)]
            }
        }
    };
    function k(e, t, n) {
        -1 == e.indexOf("fullscreen error") && (s.startupErrorHandler ? s.startupErrorHandler(e, t, n) : s.errorHandler && s.errorHandler(e, t, n) || (console.log("Invoking error handler due to\n" + e),
        "function" == typeof dump && dump("Invoking error handler due to\n" + e),
        k.didShowErrorMessage || (-1 != (e = "An error occurred running the Unity content on this page. See your browser JavaScript console for more info. The error was:\n" + e).indexOf("DISABLE_EXCEPTION_CATCHING") ? e = "An exception has occurred, but exception handling has been disabled in this build. If you are the developer of this content, enable exceptions in your project WebGL player settings to be able to catch the exception or see the stack trace." : -1 != e.indexOf("Cannot enlarge memory arrays") ? e = "Out of memory. If you are the developer of this content, try allocating more memory to your WebGL build in the WebGL player settings." : -1 == e.indexOf("Invalid array buffer length") && -1 == e.indexOf("Invalid typed array length") && -1 == e.indexOf("out of memory") && -1 == e.indexOf("could not allocate memory") || (e = "The browser could not allocate enough memory for the WebGL content. If you are the developer of this content, try allocating less memory to your WebGL build in the WebGL player settings."),
        alert(e),
        k.didShowErrorMessage = !0)))
    }
    function x(e, t) {
        var n = "(wasm-function\\[)(\\d+)(\\])"
          , r = RegExp(n);
        return e.replace(RegExp(n, "g"), function(e) {
            return (e = e.match(r))[1] + (t[e[2]] ? t[e[2]] + "@" : "") + e[2] + e[3]
        })
    }
    function S(e, t, n) {
        s.symbols ? k(x(e, s.symbols), t, n) : s.symbolsUrl ? T("symbolsUrl").then(function(r) {
            for (var o = "", a = 0; a < r.length; a++)
                o += String.fromCharCode(r[a]);
            s.symbols = JSON.parse(o),
            k(x(e, s.symbols), t, n)
        }).catch(function(r) {
            k(e, t, n)
        }) : k(e, t, n)
    }
    function C(e, t) {
        if ("symbolsUrl" != e) {
            var r = s.downloadProgress[e]
              , o = (r = r || (s.downloadProgress[e] = {
                started: !1,
                finished: !1,
                lengthComputable: !1,
                total: 0,
                loaded: 0
            }),
            "object" != typeof t || "progress" != t.type && "load" != t.type || (r.started || (r.started = !0,
            r.lengthComputable = t.lengthComputable),
            r.total = t.total,
            r.loaded = t.loaded,
            "load" == t.type && (r.finished = !0)),
            0)
              , a = 0
              , i = 0
              , l = 0
              , c = 0;
            for (e in s.downloadProgress) {
                if (!(r = s.downloadProgress[e]).started)
                    return;
                i++,
                r.lengthComputable ? (o += r.loaded,
                a += r.total,
                l++) : r.finished || c++
            }
            n(.9 * (i ? (i - c - (a ? l * (a - o) / a : 0)) / i : 0))
        }
    }
    function E() {
        var e = this;
        this.isConnected = this.connect().then(function() {
            return e.cleanUpCache()
        }),
        this.isConnected.catch(function(e) {
            e = "Error when initializing cache: " + e,
            console.log("[UnityCache] " + e)
        })
    }
    function D(e) {
        console.log("[UnityCache] " + e)
    }
    function B(e) {
        return B.link = B.link || document.createElement("a"),
        B.link.href = e,
        B.link.href
    }
    s.SystemInfo = function() {
        var e, t, n, r, o = navigator.userAgent + " ", a = [["Firefox", "Firefox"], ["OPR", "Opera"], ["Edg", "Edge"], ["SamsungBrowser", "Samsung Browser"], ["Trident", "Internet Explorer"], ["MSIE", "Internet Explorer"], ["Chrome", "Chrome"], ["CriOS", "Chrome on iOS Safari"], ["FxiOS", "Firefox on iOS Safari"], ["Safari", "Safari"], ];
        function i(e, t, n) {
            return (e = RegExp(e, "i").exec(t)) && e[n]
        }
        for (var s = 0; s < a.length; ++s)
            if (t = i(a[s][0] + "[/ ](.*?)[ \\)]", o, 1)) {
                e = a[s][1];
                break
            }
        "Safari" == e && (t = i("Version/(.*?) ", o, 1)),
        "Internet Explorer" == e && (t = i("rv:(.*?)\\)? ", o, 1) || t);
        for (var l = [["Windows (.*?)[;)]", "Windows"], ["Android ([0-9_.]+)", "Android"], ["iPhone OS ([0-9_.]+)", "iPhoneOS"], ["iPad.*? OS ([0-9_.]+)", "iPadOS"], ["FreeBSD( )", "FreeBSD"], ["OpenBSD( )", "OpenBSD"], ["Linux|X11()", "Linux"], ["Mac OS X ([0-9_\\.]+)", "MacOS"], ["bot|google|baidu|bing|msn|teoma|slurp|yandex", "Search Bot"], ], c = 0; c < l.length; ++c)
            if (u = i(l[c][0], o, 1)) {
                n = l[c][1],
                u = u.replace(/_/g, ".");
                break
            }
        var d, u = {
            "NT 5.0": "2000",
            "NT 5.1": "XP",
            "NT 5.2": "Server 2003",
            "NT 6.0": "Vista",
            "NT 6.1": "7",
            "NT 6.2": "8",
            "NT 6.3": "8.1",
            "NT 10.0": "10"
        }[u] || u, f = ((f = document.createElement("canvas")) && (d = (h = f.getContext("webgl2")) ? 2 : 0,
        h || (h = f && f.getContext("webgl")) && (d = 1),
        h && (r = h.getExtension("WEBGL_debug_renderer_info") && h.getParameter(37446) || h.getParameter(7937))),
        "undefined" != typeof SharedArrayBuffer), h = "object" == typeof WebAssembly && "function" == typeof WebAssembly.compile;
        return {
            width: screen.width,
            height: screen.height,
            userAgent: o.trim(),
            browser: e || "Unknown browser",
            browserVersion: t || "Unknown version",
            mobile: /Mobile|Android|iP(ad|hone)/.test(navigator.appVersion),
            os: n || "Unknown OS",
            osVersion: u || "Unknown OS Version",
            gpu: r || "Unknown GPU",
            language: navigator.userLanguage || navigator.language,
            hasWebGL: d,
            hasCursorLock: !!document.body.requestPointerLock,
            hasFullscreen: !!document.body.requestFullscreen || !!document.body.webkitRequestFullscreen,
            hasThreads: f,
            hasWasm: h,
            hasWasmThreads: !1
        }
    }(),
    s.abortHandler = function(e) {
        return S(e, "", 0),
        !0
    }
    ,
    Error.stackTraceLimit = Math.max(Error.stackTraceLimit || 0, 50),
    s.readBodyWithProgress = function(e, t, n) {
        var r = e.body ? e.body.getReader() : void 0
          , o = void 0 !== e.headers.get("Content-Length")
          , a = function(e, t) {
            if (!t)
                return 0;
            var t = e.headers.get("Content-Encoding")
              , n = parseInt(e.headers.get("Content-Length"));
            switch (t) {
            case "br":
                return Math.round(5 * n);
            case "gzip":
                return Math.round(4 * n);
            default:
                return n
            }
        }(e, o)
          , i = new Uint8Array(a)
          , s = []
          , l = 0
          , c = 0;
        return o || console.warn("[UnityCache] Response is served without Content-Length header. Please reconfigure server to include valid Content-Length for better download performance."),
        (function d() {
            return void 0 === r ? e.arrayBuffer().then(function(r) {
                var a = new Uint8Array(r);
                return t({
                    type: "progress",
                    response: e,
                    total: r.length,
                    loaded: 0,
                    lengthComputable: o,
                    chunk: n ? a : null
                }),
                a
            }) : r.read().then(function(r) {
                if (r.done) {
                    if (l === a)
                        return i;
                    if (l < a)
                        return i.slice(0, l);
                    for (var u = new Uint8Array(l), f = (u.set(i, 0),
                    c), h = 0; h < s.length; ++h)
                        u.set(s[h], f),
                        f += s[h].length;
                    return u
                }
                return l + r.value.length <= i.length ? (i.set(r.value, l),
                c = l + r.value.length) : s.push(r.value),
                t({
                    type: "progress",
                    response: e,
                    total: Math.max(a, l += r.value.length),
                    loaded: l,
                    lengthComputable: o,
                    chunk: n ? r.value : null
                }),
                d()
            })
        }
        )().then(function(n) {
            return t({
                type: "load",
                response: e,
                total: n.length,
                loaded: n.length,
                lengthComputable: o,
                chunk: null
            }),
            e.parsedBody = n,
            e
        })
    }
    ,
    s.fetchWithProgress = function(e, t) {
        var n = function() {};
        return t && t.onProgress && (n = t.onProgress),
        fetch(e, t).then(function(e) {
            return s.readBodyWithProgress(e, n, t.enableStreamingDownload)
        })
    }
    ,
    s.UnityCache = (h = {
        name: "UnityCache",
        version: 4
    },
    $ = {
        name: "RequestMetaDataStore",
        version: 1
    },
    _ = "RequestStore",
    m = "WebAssembly",
    b = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
    p = null,
    E.getInstance = function() {
        return p = p || new E
    }
    ,
    E.destroyInstance = function() {
        return p ? p.close().then(function() {
            p = null
        }) : Promise.resolve()
    }
    ,
    E.prototype.clearCache = function() {
        var e = this;
        return this.isConnected.then(function() {
            return e.execute($.name, "clear", [])
        }).then(function() {
            return e.cache.keys()
        }).then(function t(n) {
            var r;
            return 0 === n.length ? Promise.resolve() : (r = n.pop(),
            e.cache.delete(r).then(function() {
                return t(n)
            }))
        })
    }
    ,
    E.UnityCacheDatabase = h,
    E.RequestMetaDataStore = $,
    E.MaximumCacheSize = 1073741824,
    E.prototype.loadRequest = function(e) {
        var t = this;
        return t.isConnected.then(function() {
            return Promise.all([t.cache.match(e), t.loadRequestMetaData(e)])
        }).then(function(e) {
            if (void 0 !== e[0] && void 0 !== e[1])
                return {
                    response: e[0],
                    metaData: e[1]
                }
        })
    }
    ,
    E.prototype.loadRequestMetaData = function(e) {
        return e = "string" == typeof e ? e : e.url,
        this.execute($.name, "get", [e])
    }
    ,
    E.prototype.updateRequestMetaData = function(e) {
        return this.execute($.name, "put", [e])
    }
    ,
    E.prototype.storeRequest = function(e, t) {
        var n = this;
        return n.isConnected.then(function() {
            return n.cache.put(e, t)
        })
    }
    ,
    E.prototype.close = function() {
        return this.isConnected.then((function() {
            this.database && (this.database.close(),
            this.database = null),
            this.cache && (this.cache = null)
        }
        ).bind(this))
    }
    ,
    E.prototype.connect = function() {
        var e = this;
        return void 0 === b ? Promise.reject(Error("Could not connect to cache: IndexedDB is not supported.")) : void 0 === window.caches ? Promise.reject(Error("Could not connect to cache: Cache API is not supported.")) : new Promise(function(t, n) {
            try {
                function r() {
                    e.openDBTimeout && (clearTimeout(e.openDBTimeout),
                    e.openDBTimeout = null)
                }
                e.openDBTimeout = setTimeout(function() {
                    void 0 === e.database && n(Error("Could not connect to cache: Database timeout."))
                }, 2e4);
                var o = b.open(h.name, h.version);
                o.onupgradeneeded = e.upgradeDatabase.bind(e),
                o.onsuccess = function(n) {
                    r(),
                    e.database = n.target.result,
                    t()
                }
                ,
                o.onerror = function(t) {
                    r(),
                    e.database = null,
                    n(Error("Could not connect to database."))
                }
            } catch (a) {
                r(),
                e.database = null,
                e.cache = null,
                n(Error("Could not connect to cache: Could not connect to database."))
            }
        }
        ).then(function() {
            var e = h.name + "_" + s.companyName + "_" + s.productName;
            return caches.open(e)
        }).then(function(t) {
            e.cache = t
        })
    }
    ,
    E.prototype.upgradeDatabase = function(e) {
        var t, e = e.target.result;
        e.objectStoreNames.contains($.name) || (t = e.createObjectStore($.name, {
            keyPath: "url"
        }),
        ["accessedAt", "updatedAt"].forEach(function(e) {
            t.createIndex(e, e)
        })),
        e.objectStoreNames.contains(_) && e.deleteObjectStore(_),
        e.objectStoreNames.contains(m) && e.deleteObjectStore(m)
    }
    ,
    E.prototype.execute = function(e, t, n) {
        return this.isConnected.then((function() {
            return new Promise((function(r, o) {
                try {
                    var a, i, s;
                    null === this.database ? o(Error("indexedDB access denied")) : (a = -1 != ["put", "delete", "clear"].indexOf(t) ? "readwrite" : "readonly",
                    i = this.database.transaction([e], a).objectStore(e),
                    "openKeyCursor" == t && (i = i.index(n[0]),
                    n = n.slice(1)),
                    (s = i[t].apply(i, n)).onsuccess = function(e) {
                        r(e.target.result)
                    }
                    ,
                    s.onerror = function(e) {
                        o(e)
                    }
                    )
                } catch (l) {
                    o(l)
                }
            }
            ).bind(this))
        }
        ).bind(this))
    }
    ,
    E.prototype.getMetaDataEntries = function() {
        var e = this
          , t = 0
          , n = [];
        return new Promise(function(r, o) {
            var a = e.database.transaction([$.name], "readonly").objectStore($.name).openCursor();
            a.onsuccess = function(e) {
                (e = e.target.result) ? (t += e.value.size,
                n.push(e.value),
                e.continue()) : r({
                    metaDataEntries: n,
                    cacheSize: t
                })
            }
            ,
            a.onerror = function(e) {
                o(e)
            }
        }
        )
    }
    ,
    E.prototype.cleanUpCache = function() {
        var e = this;
        return this.getMetaDataEntries().then(function(t) {
            for (var n = t.metaDataEntries, r = t.cacheSize, o = [], a = [], i = 0; i < n.length; ++i)
                n[i].version == s.productVersion ? a.push(n[i]) : (o.push(n[i]),
                r -= n[i].size);
            for (a.sort(function(e, t) {
                return e.accessedAt - t.accessedAt
            }),
            i = 0; i < a.length && !(r < E.MaximumCacheSize); ++i)
                o.push(a[i]),
                r -= a[i].size;
            return function t() {
                var n;
                return 0 === o.length ? Promise.resolve() : (n = o.pop(),
                e.cache.delete(n.url).then(function(t) {
                    var r;
                    if (t)
                        return r = n.url,
                        new Promise(function(t, n) {
                            var o = e.database.transaction([$.name], "readwrite");
                            o.objectStore($.name).delete(r),
                            o.oncomplete = t,
                            o.onerror = n
                        }
                        )
                }).then(t))
            }()
        })
    }
    ,
    E),
    s.cachedFetch = (g = s.UnityCache,
    v = s.fetchWithProgress,
    w = s.readBodyWithProgress,
    function(e, t) {
        var n, r, o = g.getInstance(), a = B("string" == typeof e ? e : e.url), i = {
            enabled: (n = a,
            (!(r = t) || !r.method || "GET" === r.method) && (!r || -1 != ["must-revalidate", "immutable"].indexOf(r.control)) && !!n.match("^https?://"))
        };
        function s(e, t) {
            return fetch(e, t).then(function(n) {
                var r;
                return !i.enabled || i.revalidated ? n : 304 === n.status ? (i.revalidated = !0,
                o.updateRequestMetaData(i.metaData).then(function() {
                    D("'" + i.metaData.url + "' successfully revalidated and served from the indexedDB cache")
                }).catch(function(e) {
                    D("'" + i.metaData.url + "' successfully revalidated but not stored in the indexedDB cache due to the error: " + e)
                }),
                w(i.response, t.onProgress, t.enableStreamingDownload)) : 200 == n.status ? (i.response = n,
                i.metaData.updatedAt = i.metaData.accessedAt,
                i.revalidated = !0,
                r = n.clone(),
                w(n, t.onProgress, t.enableStreamingDownload).then(function(t) {
                    return i.metaData.size = t.parsedBody.length,
                    Promise.all([o.storeRequest(e, r), o.updateRequestMetaData(i.metaData)]).then(function() {
                        D("'" + a + "' successfully downloaded and stored in the indexedDB cache")
                    }).catch(function(e) {
                        D("'" + a + "' successfully downloaded but not stored in the indexedDB cache due to the error: " + e)
                    }),
                    t
                })) : (D("'" + a + "' request failed with status: " + n.status + " " + n.statusText),
                w(n, t.onProgress, t.enableStreamingDownload))
            })
        }
        return t && (i.control = t.control,
        i.companyName = t.companyName,
        i.productName = t.productName,
        i.productVersion = t.productVersion),
        i.revalidated = !1,
        i.metaData = {
            url: a,
            accessedAt: Date.now(),
            version: i.productVersion
        },
        i.response = null,
        i.enabled ? o.loadRequest(a).then(function(n) {
            var r, l, c;
            return n ? (r = n.response,
            l = n.metaData,
            i.response = r,
            i.metaData.size = l.size,
            i.metaData.updatedAt = l.updatedAt,
            "immutable" == i.control ? (i.revalidated = !0,
            o.updateRequestMetaData(l).then(function() {
                D("'" + i.metaData.url + "' served from the indexedDB cache without revalidation")
            }),
            w(r, t.onProgress, t.enableStreamingDownload)) : (n = a,
            (c = window.location.href.match(/^[a-z]+:\/\/[^\/]+/)) && !n.lastIndexOf(c[0], 0) || !r.headers.get("Last-Modified") && !r.headers.get("ETag") ? (n = (t = t || {}).headers || {},
            t.headers = n,
            r.headers.get("Last-Modified") ? (n["If-Modified-Since"] = r.headers.get("Last-Modified"),
            n["Cache-Control"] = "no-cache") : r.headers.get("ETag") && (n["If-None-Match"] = r.headers.get("ETag"),
            n["Cache-Control"] = "no-cache"),
            s(e, t)) : fetch(a, {
                method: "HEAD"
            }).then(function(n) {
                return i.revalidated = ["Last-Modified", "ETag"].every(function(e) {
                    return !r.headers.get(e) || r.headers.get(e) == n.headers.get(e)
                }),
                i.revalidated ? (o.updateRequestMetaData(l).then(function() {
                    D("'" + i.metaData.url + "' successfully revalidated and served from the indexedDB cache")
                }),
                w(i.response, t.onProgress, t.enableStreamingDownload)) : s(e, t)
            }))) : s(e, t)
        }).catch(function(n) {
            return D("Failed to load '" + i.metaData.url + "' from indexedDB cache due to the error: " + n),
            v(e, t)
        }) : v(e, t)
    }
    );
    var U = {
        gzip: {
            require: function(e) {
                var t, n = {
                    "inflate.js": function(e, t, n) {
                        "use strict";
                        var r = e("./zlib/inflate")
                          , o = e("./utils/common")
                          , a = e("./utils/strings")
                          , i = e("./zlib/constants")
                          , s = e("./zlib/messages")
                          , l = e("./zlib/zstream")
                          , c = e("./zlib/gzheader")
                          , d = Object.prototype.toString;
                        function u(e) {
                            if (!(this instanceof u))
                                return new u(e);
                            this.options = o.assign({
                                chunkSize: 16384,
                                windowBits: 0,
                                to: ""
                            }, e || {});
                            var t = this.options;
                            if (t.raw && 0 <= t.windowBits && t.windowBits < 16 && (t.windowBits = -t.windowBits,
                            0 === t.windowBits && (t.windowBits = -15)),
                            !(0 <= t.windowBits && t.windowBits < 16) || e && e.windowBits || (t.windowBits += 32),
                            15 < t.windowBits && t.windowBits < 48 && 0 == (15 & t.windowBits) && (t.windowBits |= 15),
                            this.err = 0,
                            this.msg = "",
                            this.ended = !1,
                            this.chunks = [],
                            this.strm = new l,
                            this.strm.avail_out = 0,
                            (e = r.inflateInit2(this.strm, t.windowBits)) !== i.Z_OK)
                                throw Error(s[e]);
                            this.header = new c,
                            r.inflateGetHeader(this.strm, this.header)
                        }
                        function f(e, t) {
                            if ((t = new u(t)).push(e, !0),
                            t.err)
                                throw t.msg || s[t.err];
                            return t.result
                        }
                        u.prototype.push = function(e, t) {
                            var n, s, l, c, u, f = this.strm, h = this.options.chunkSize, $ = this.options.dictionary, _ = !1;
                            if (this.ended)
                                return !1;
                            s = t === ~~t ? t : !0 === t ? i.Z_FINISH : i.Z_NO_FLUSH,
                            "string" == typeof e ? f.input = a.binstring2buf(e) : "[object ArrayBuffer]" === d.call(e) ? f.input = new Uint8Array(e) : f.input = e,
                            f.next_in = 0,
                            f.avail_in = f.input.length;
                            do
                                if (0 === f.avail_out && (f.output = new o.Buf8(h),
                                f.next_out = 0,
                                f.avail_out = h),
                                (n = r.inflate(f, i.Z_NO_FLUSH)) === i.Z_NEED_DICT && $ && (u = "string" == typeof $ ? a.string2buf($) : "[object ArrayBuffer]" === d.call($) ? new Uint8Array($) : $,
                                n = r.inflateSetDictionary(this.strm, u)),
                                n === i.Z_BUF_ERROR && !0 === _ && (n = i.Z_OK,
                                _ = !1),
                                n !== i.Z_STREAM_END && n !== i.Z_OK)
                                    return this.onEnd(n),
                                    this.ended = !0,
                                    !1;
                            while (f.next_out && (0 === f.avail_out || n === i.Z_STREAM_END || 0 === f.avail_in && (s === i.Z_FINISH || s === i.Z_SYNC_FLUSH)) && ("string" === this.options.to ? (u = a.utf8border(f.output, f.next_out),
                            l = f.next_out - u,
                            c = a.buf2string(f.output, u),
                            f.next_out = l,
                            f.avail_out = h - l,
                            l && o.arraySet(f.output, f.output, u, l, 0),
                            this.onData(c)) : this.onData(o.shrinkBuf(f.output, f.next_out))),
                            0 === f.avail_in && 0 === f.avail_out && (_ = !0),
                            (0 < f.avail_in || 0 === f.avail_out) && n !== i.Z_STREAM_END);
                            return (s = n === i.Z_STREAM_END ? i.Z_FINISH : s) === i.Z_FINISH ? (n = r.inflateEnd(this.strm),
                            this.onEnd(n),
                            this.ended = !0,
                            n === i.Z_OK) : s !== i.Z_SYNC_FLUSH || (this.onEnd(i.Z_OK),
                            f.avail_out = 0,
                            !0)
                        }
                        ,
                        u.prototype.onData = function(e) {
                            this.chunks.push(e)
                        }
                        ,
                        u.prototype.onEnd = function(e) {
                            e === i.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)),
                            this.chunks = [],
                            this.err = e,
                            this.msg = this.strm.msg
                        }
                        ,
                        n.Inflate = u,
                        n.inflate = f,
                        n.inflateRaw = function(e, t) {
                            return (t = t || {}).raw = !0,
                            f(e, t)
                        }
                        ,
                        n.ungzip = f
                    },
                    "utils/common.js": function(e, t, n) {
                        "use strict";
                        var r = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array
                          , o = (n.assign = function(e) {
                            for (var t = Array.prototype.slice.call(arguments, 1); t.length; ) {
                                var n = t.shift();
                                if (n) {
                                    if ("object" != typeof n)
                                        throw TypeError(n + "must be non-object");
                                    for (var r in n)
                                        n.hasOwnProperty(r) && (e[r] = n[r])
                                }
                            }
                            return e
                        }
                        ,
                        n.shrinkBuf = function(e, t) {
                            if (e.length !== t) {
                                if (e.subarray)
                                    return e.subarray(0, t);
                                e.length = t
                            }
                            return e
                        }
                        ,
                        {
                            arraySet: function(e, t, n, r, o) {
                                if (t.subarray && e.subarray)
                                    e.set(t.subarray(n, n + r), o);
                                else
                                    for (var a = 0; a < r; a++)
                                        e[o + a] = t[n + a]
                            },
                            flattenChunks: function(e) {
                                for (var t, n, r, o = 0, a = 0, i = e.length; a < i; a++)
                                    o += e[a].length;
                                for (r = new Uint8Array(o),
                                a = t = 0,
                                i = e.length; a < i; a++)
                                    n = e[a],
                                    r.set(n, t),
                                    t += n.length;
                                return r
                            }
                        })
                          , a = {
                            arraySet: function(e, t, n, r, o) {
                                for (var a = 0; a < r; a++)
                                    e[o + a] = t[n + a]
                            },
                            flattenChunks: function(e) {
                                return [].concat.apply([], e)
                            }
                        };
                        n.setTyped = function(e) {
                            e ? (n.Buf8 = Uint8Array,
                            n.Buf16 = Uint16Array,
                            n.Buf32 = Int32Array,
                            n.assign(n, o)) : (n.Buf8 = Array,
                            n.Buf16 = Array,
                            n.Buf32 = Array,
                            n.assign(n, a))
                        }
                        ,
                        n.setTyped(r)
                    },
                    "utils/strings.js": function(e, t, n) {
                        "use strict";
                        var r = e("./common")
                          , o = !0
                          , a = !0;
                        try {
                            String.fromCharCode.apply(null, [0])
                        } catch (i) {
                            o = !1
                        }
                        try {
                            String.fromCharCode.apply(null, new Uint8Array(1))
                        } catch (s) {
                            a = !1
                        }
                        for (var l = new r.Buf8(256), c = 0; c < 256; c++)
                            l[c] = 252 <= c ? 6 : 248 <= c ? 5 : 240 <= c ? 4 : 224 <= c ? 3 : 192 <= c ? 2 : 1;
                        function d(e, t) {
                            if (t < 65537 && (e.subarray && a || !e.subarray && o))
                                return String.fromCharCode.apply(null, r.shrinkBuf(e, t));
                            for (var n = "", i = 0; i < t; i++)
                                n += String.fromCharCode(e[i]);
                            return n
                        }
                        l[254] = l[254] = 1,
                        n.string2buf = function(e) {
                            for (var t, n, o, a, i = e.length, s = 0, l = 0; l < i; l++)
                                55296 == (64512 & (n = e.charCodeAt(l))) && l + 1 < i && 56320 == (64512 & (o = e.charCodeAt(l + 1))) && (n = 65536 + (n - 55296 << 10) + (o - 56320),
                                l++),
                                s += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4;
                            for (t = new r.Buf8(s),
                            l = a = 0; a < s; l++)
                                55296 == (64512 & (n = e.charCodeAt(l))) && l + 1 < i && 56320 == (64512 & (o = e.charCodeAt(l + 1))) && (n = 65536 + (n - 55296 << 10) + (o - 56320),
                                l++),
                                n < 128 ? t[a++] = n : (n < 2048 ? t[a++] = 192 | n >>> 6 : (n < 65536 ? t[a++] = 224 | n >>> 12 : (t[a++] = 240 | n >>> 18,
                                t[a++] = 128 | n >>> 12 & 63),
                                t[a++] = 128 | n >>> 6 & 63),
                                t[a++] = 128 | 63 & n);
                            return t
                        }
                        ,
                        n.buf2binstring = function(e) {
                            return d(e, e.length)
                        }
                        ,
                        n.binstring2buf = function(e) {
                            for (var t = new r.Buf8(e.length), n = 0, o = t.length; n < o; n++)
                                t[n] = e.charCodeAt(n);
                            return t
                        }
                        ,
                        n.buf2string = function(e, t) {
                            for (var n, r, o = t || e.length, a = Array(2 * o), i = 0, s = 0; s < o; )
                                if ((n = e[s++]) < 128)
                                    a[i++] = n;
                                else if (4 < (r = l[n]))
                                    a[i++] = 65533,
                                    s += r - 1;
                                else {
                                    for (n &= 2 === r ? 31 : 3 === r ? 15 : 7; 1 < r && s < o; )
                                        n = n << 6 | 63 & e[s++],
                                        r--;
                                    1 < r ? a[i++] = 65533 : n < 65536 ? a[i++] = n : (n -= 65536,
                                    a[i++] = 55296 | n >> 10 & 1023,
                                    a[i++] = 56320 | 1023 & n)
                                }
                            return d(a, i)
                        }
                        ,
                        n.utf8border = function(e, t) {
                            for (var n = (t = (t = t || e.length) > e.length ? e.length : t) - 1; 0 <= n && 128 == (192 & e[n]); )
                                n--;
                            return !(n < 0) && 0 !== n && n + l[e[n]] > t ? n : t
                        }
                    },
                    "zlib/inflate.js": function(e, t, n) {
                        "use strict";
                        var r = e("../utils/common")
                          , o = e("./adler32")
                          , a = e("./crc32")
                          , i = e("./inffast")
                          , s = e("./inftrees");
                        function l(e) {
                            return (e >>> 24 & 255) + (e >>> 8 & 65280) + ((65280 & e) << 8) + ((255 & e) << 24)
                        }
                        function c() {
                            this.mode = 0,
                            this.last = !1,
                            this.wrap = 0,
                            this.havedict = !1,
                            this.flags = 0,
                            this.dmax = 0,
                            this.check = 0,
                            this.total = 0,
                            this.head = null,
                            this.wbits = 0,
                            this.wsize = 0,
                            this.whave = 0,
                            this.wnext = 0,
                            this.window = null,
                            this.hold = 0,
                            this.bits = 0,
                            this.length = 0,
                            this.offset = 0,
                            this.extra = 0,
                            this.lencode = null,
                            this.distcode = null,
                            this.lenbits = 0,
                            this.distbits = 0,
                            this.ncode = 0,
                            this.nlen = 0,
                            this.ndist = 0,
                            this.have = 0,
                            this.next = null,
                            this.lens = new r.Buf16(320),
                            this.work = new r.Buf16(288),
                            this.lendyn = null,
                            this.distdyn = null,
                            this.sane = 0,
                            this.back = 0,
                            this.was = 0
                        }
                        function d(e) {
                            var t;
                            return e && e.state ? (t = e.state,
                            e.total_in = e.total_out = t.total = 0,
                            e.msg = "",
                            t.wrap && (e.adler = 1 & t.wrap),
                            t.mode = 1,
                            t.last = 0,
                            t.havedict = 0,
                            t.dmax = 32768,
                            t.head = null,
                            t.hold = 0,
                            t.bits = 0,
                            t.lencode = t.lendyn = new r.Buf32(852),
                            t.distcode = t.distdyn = new r.Buf32(592),
                            t.sane = 1,
                            t.back = -1,
                            0) : -2
                        }
                        function u(e) {
                            var t;
                            return e && e.state ? ((t = e.state).wsize = 0,
                            t.whave = 0,
                            t.wnext = 0,
                            d(e)) : -2
                        }
                        function f(e, t) {
                            var n, r;
                            return !e || !e.state || (r = e.state,
                            t < 0 ? (n = 0,
                            t = -t) : (n = 1 + (t >> 4),
                            t < 48 && (t &= 15)),
                            t && (t < 8 || 15 < t)) ? -2 : (null !== r.window && r.wbits !== t && (r.window = null),
                            r.wrap = n,
                            r.wbits = t,
                            u(e))
                        }
                        function h(e, t) {
                            var n;
                            return e ? (n = new c,
                            (e.state = n).window = null,
                            0 !== (n = f(e, t)) && (e.state = null),
                            n) : -2
                        }
                        var $, _, m = !0;
                        function b(e, t, n, o) {
                            var a;
                            return null === (e = e.state).window && (e.wsize = 1 << e.wbits,
                            e.wnext = 0,
                            e.whave = 0,
                            e.window = new r.Buf8(e.wsize)),
                            o >= e.wsize ? (r.arraySet(e.window, t, n - e.wsize, e.wsize, 0),
                            e.wnext = 0,
                            e.whave = e.wsize) : (o < (a = e.wsize - e.wnext) && (a = o),
                            r.arraySet(e.window, t, n - o, a, e.wnext),
                            (o -= a) ? (r.arraySet(e.window, t, n - o, o, 0),
                            e.wnext = o,
                            e.whave = e.wsize) : (e.wnext += a,
                            e.wnext === e.wsize && (e.wnext = 0),
                            e.whave < e.wsize && (e.whave += a))),
                            0
                        }
                        n.inflateReset = u,
                        n.inflateReset2 = f,
                        n.inflateResetKeep = d,
                        n.inflateInit = function(e) {
                            return h(e, 15)
                        }
                        ,
                        n.inflateInit2 = h,
                        n.inflate = function(e, t) {
                            var n, c, d, u, f, h, p, g, v, w, y, k, x, S, C, E, D, B, U, T, R, I, z, O, L = 0, N = new r.Buf8(4), P = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
                            if (!e || !e.state || !e.output || !e.input && 0 !== e.avail_in)
                                return -2;
                            12 === (n = e.state).mode && (n.mode = 13),
                            f = e.next_out,
                            d = e.output,
                            p = e.avail_out,
                            u = e.next_in,
                            c = e.input,
                            h = e.avail_in,
                            g = n.hold,
                            v = n.bits,
                            w = h,
                            y = p,
                            I = 0;
                            e: for (; ; )
                                switch (n.mode) {
                                case 1:
                                    if (0 === n.wrap)
                                        n.mode = 13;
                                    else {
                                        for (; v < 16; ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        if (2 & n.wrap && 35615 === g)
                                            N[n.check = 0] = 255 & g,
                                            N[1] = g >>> 8 & 255,
                                            n.check = a(n.check, N, 2, 0),
                                            v = g = 0,
                                            n.mode = 2;
                                        else if (n.flags = 0,
                                        n.head && (n.head.done = !1),
                                        !(1 & n.wrap) || (((255 & g) << 8) + (g >> 8)) % 31)
                                            e.msg = "incorrect header check",
                                            n.mode = 30;
                                        else if (8 != (15 & g))
                                            e.msg = "unknown compression method",
                                            n.mode = 30;
                                        else {
                                            if (v -= 4,
                                            R = 8 + (15 & (g >>>= 4)),
                                            0 === n.wbits)
                                                n.wbits = R;
                                            else if (R > n.wbits) {
                                                e.msg = "invalid window size",
                                                n.mode = 30;
                                                break
                                            }
                                            n.dmax = 1 << R,
                                            e.adler = n.check = 1,
                                            n.mode = 512 & g ? 10 : 12,
                                            v = g = 0
                                        }
                                    }
                                    break;
                                case 2:
                                    for (; v < 16; ) {
                                        if (0 === h)
                                            break e;
                                        h--,
                                        g += c[u++] << v,
                                        v += 8
                                    }
                                    if (n.flags = g,
                                    8 != (255 & n.flags)) {
                                        e.msg = "unknown compression method",
                                        n.mode = 30;
                                        break
                                    }
                                    if (57344 & n.flags) {
                                        e.msg = "unknown header flags set",
                                        n.mode = 30;
                                        break
                                    }
                                    n.head && (n.head.text = g >> 8 & 1),
                                    512 & n.flags && (N[0] = 255 & g,
                                    N[1] = g >>> 8 & 255,
                                    n.check = a(n.check, N, 2, 0)),
                                    v = g = 0,
                                    n.mode = 3;
                                case 3:
                                    for (; v < 32; ) {
                                        if (0 === h)
                                            break e;
                                        h--,
                                        g += c[u++] << v,
                                        v += 8
                                    }
                                    n.head && (n.head.time = g),
                                    512 & n.flags && (N[0] = 255 & g,
                                    N[1] = g >>> 8 & 255,
                                    N[2] = g >>> 16 & 255,
                                    N[3] = g >>> 24 & 255,
                                    n.check = a(n.check, N, 4, 0)),
                                    v = g = 0,
                                    n.mode = 4;
                                case 4:
                                    for (; v < 16; ) {
                                        if (0 === h)
                                            break e;
                                        h--,
                                        g += c[u++] << v,
                                        v += 8
                                    }
                                    n.head && (n.head.xflags = 255 & g,
                                    n.head.os = g >> 8),
                                    512 & n.flags && (N[0] = 255 & g,
                                    N[1] = g >>> 8 & 255,
                                    n.check = a(n.check, N, 2, 0)),
                                    v = g = 0,
                                    n.mode = 5;
                                case 5:
                                    if (1024 & n.flags) {
                                        for (; v < 16; ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        n.length = g,
                                        n.head && (n.head.extra_len = g),
                                        512 & n.flags && (N[0] = 255 & g,
                                        N[1] = g >>> 8 & 255,
                                        n.check = a(n.check, N, 2, 0)),
                                        v = g = 0
                                    } else
                                        n.head && (n.head.extra = null);
                                    n.mode = 6;
                                case 6:
                                    if (1024 & n.flags && ((k = h < (k = n.length) ? h : k) && (n.head && (R = n.head.extra_len - n.length,
                                    n.head.extra || (n.head.extra = Array(n.head.extra_len)),
                                    r.arraySet(n.head.extra, c, u, k, R)),
                                    512 & n.flags && (n.check = a(n.check, c, k, u)),
                                    h -= k,
                                    u += k,
                                    n.length -= k),
                                    n.length))
                                        break e;
                                    n.length = 0,
                                    n.mode = 7;
                                case 7:
                                    if (2048 & n.flags) {
                                        if (0 === h)
                                            break e;
                                        for (k = 0; R = c[u + k++],
                                        n.head && R && n.length < 65536 && (n.head.name += String.fromCharCode(R)),
                                        R && k < h; )
                                            ;
                                        if (512 & n.flags && (n.check = a(n.check, c, k, u)),
                                        h -= k,
                                        u += k,
                                        R)
                                            break e
                                    } else
                                        n.head && (n.head.name = null);
                                    n.length = 0,
                                    n.mode = 8;
                                case 8:
                                    if (4096 & n.flags) {
                                        if (0 === h)
                                            break e;
                                        for (k = 0; R = c[u + k++],
                                        n.head && R && n.length < 65536 && (n.head.comment += String.fromCharCode(R)),
                                        R && k < h; )
                                            ;
                                        if (512 & n.flags && (n.check = a(n.check, c, k, u)),
                                        h -= k,
                                        u += k,
                                        R)
                                            break e
                                    } else
                                        n.head && (n.head.comment = null);
                                    n.mode = 9;
                                case 9:
                                    if (512 & n.flags) {
                                        for (; v < 16; ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        if (g !== (65535 & n.check)) {
                                            e.msg = "header crc mismatch",
                                            n.mode = 30;
                                            break
                                        }
                                        v = g = 0
                                    }
                                    n.head && (n.head.hcrc = n.flags >> 9 & 1,
                                    n.head.done = !0),
                                    e.adler = n.check = 0,
                                    n.mode = 12;
                                    break;
                                case 10:
                                    for (; v < 32; ) {
                                        if (0 === h)
                                            break e;
                                        h--,
                                        g += c[u++] << v,
                                        v += 8
                                    }
                                    e.adler = n.check = l(g),
                                    v = g = 0,
                                    n.mode = 11;
                                case 11:
                                    if (0 === n.havedict)
                                        return e.next_out = f,
                                        e.avail_out = p,
                                        e.next_in = u,
                                        e.avail_in = h,
                                        n.hold = g,
                                        n.bits = v,
                                        2;
                                    e.adler = n.check = 1,
                                    n.mode = 12;
                                case 12:
                                    if (5 === t || 6 === t)
                                        break e;
                                case 13:
                                    if (n.last)
                                        g >>>= 7 & v,
                                        v -= 7 & v,
                                        n.mode = 27;
                                    else {
                                        for (; v < 3; ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        switch (n.last = 1 & g,
                                        --v,
                                        3 & (g >>>= 1)) {
                                        case 0:
                                            n.mode = 14;
                                            break;
                                        case 1:
                                            var A, A = F = void 0, F = n;
                                            if (m) {
                                                for ($ = new r.Buf32(512),
                                                _ = new r.Buf32(32),
                                                A = 0; A < 144; )
                                                    F.lens[A++] = 8;
                                                for (; A < 256; )
                                                    F.lens[A++] = 9;
                                                for (; A < 280; )
                                                    F.lens[A++] = 7;
                                                for (; A < 288; )
                                                    F.lens[A++] = 8;
                                                for (s(1, F.lens, 0, 288, $, 0, F.work, {
                                                    bits: 9
                                                }),
                                                A = 0; A < 32; )
                                                    F.lens[A++] = 5;
                                                s(2, F.lens, 0, 32, _, 0, F.work, {
                                                    bits: 5
                                                }),
                                                m = !1
                                            }
                                            if (F.lencode = $,
                                            F.lenbits = 9,
                                            F.distcode = _,
                                            F.distbits = 5,
                                            n.mode = 20,
                                            6 !== t)
                                                break;
                                            g >>>= 2,
                                            v -= 2;
                                            break e;
                                        case 2:
                                            n.mode = 17;
                                            break;
                                        case 3:
                                            e.msg = "invalid block type",
                                            n.mode = 30
                                        }
                                        g >>>= 2,
                                        v -= 2
                                    }
                                    break;
                                case 14:
                                    for (g >>>= 7 & v,
                                    v -= 7 & v; v < 32; ) {
                                        if (0 === h)
                                            break e;
                                        h--,
                                        g += c[u++] << v,
                                        v += 8
                                    }
                                    if ((65535 & g) != (g >>> 16 ^ 65535)) {
                                        e.msg = "invalid stored block lengths",
                                        n.mode = 30;
                                        break
                                    }
                                    if (n.length = 65535 & g,
                                    v = g = 0,
                                    n.mode = 15,
                                    6 === t)
                                        break e;
                                case 15:
                                    n.mode = 16;
                                case 16:
                                    if (k = n.length) {
                                        if (0 === (k = p < (k = h < k ? h : k) ? p : k))
                                            break e;
                                        r.arraySet(d, c, u, k, f),
                                        h -= k,
                                        u += k,
                                        p -= k,
                                        f += k,
                                        n.length -= k
                                    } else
                                        n.mode = 12;
                                    break;
                                case 17:
                                    for (; v < 14; ) {
                                        if (0 === h)
                                            break e;
                                        h--,
                                        g += c[u++] << v,
                                        v += 8
                                    }
                                    if (n.nlen = 257 + (31 & g),
                                    g >>>= 5,
                                    v -= 5,
                                    n.ndist = 1 + (31 & g),
                                    g >>>= 5,
                                    v -= 5,
                                    n.ncode = 4 + (15 & g),
                                    g >>>= 4,
                                    v -= 4,
                                    286 < n.nlen || 30 < n.ndist) {
                                        e.msg = "too many length or distance symbols",
                                        n.mode = 30;
                                        break
                                    }
                                    n.have = 0,
                                    n.mode = 18;
                                case 18:
                                    for (; n.have < n.ncode; ) {
                                        for (; v < 3; ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        n.lens[P[n.have++]] = 7 & g,
                                        g >>>= 3,
                                        v -= 3
                                    }
                                    for (; n.have < 19; )
                                        n.lens[P[n.have++]] = 0;
                                    if (n.lencode = n.lendyn,
                                    n.lenbits = 7,
                                    z = {
                                        bits: n.lenbits
                                    },
                                    I = s(0, n.lens, 0, 19, n.lencode, 0, n.work, z),
                                    n.lenbits = z.bits,
                                    I) {
                                        e.msg = "invalid code lengths set",
                                        n.mode = 30;
                                        break
                                    }
                                    n.have = 0,
                                    n.mode = 19;
                                case 19:
                                    for (; n.have < n.nlen + n.ndist; ) {
                                        for (; E = (L = n.lencode[g & (1 << n.lenbits) - 1]) >>> 16 & 255,
                                        D = 65535 & L,
                                        !((C = L >>> 24) <= v); ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        if (D < 16)
                                            g >>>= C,
                                            v -= C,
                                            n.lens[n.have++] = D;
                                        else {
                                            if (16 === D) {
                                                for (O = C + 2; v < O; ) {
                                                    if (0 === h)
                                                        break e;
                                                    h--,
                                                    g += c[u++] << v,
                                                    v += 8
                                                }
                                                if (g >>>= C,
                                                v -= C,
                                                0 === n.have) {
                                                    e.msg = "invalid bit length repeat",
                                                    n.mode = 30;
                                                    break
                                                }
                                                R = n.lens[n.have - 1],
                                                k = 3 + (3 & g),
                                                g >>>= 2,
                                                v -= 2
                                            } else if (17 === D) {
                                                for (O = C + 3; v < O; ) {
                                                    if (0 === h)
                                                        break e;
                                                    h--,
                                                    g += c[u++] << v,
                                                    v += 8
                                                }
                                                R = 0,
                                                k = 3 + (7 & (g >>>= C)),
                                                g >>>= 3,
                                                v = v - C - 3
                                            } else {
                                                for (O = C + 7; v < O; ) {
                                                    if (0 === h)
                                                        break e;
                                                    h--,
                                                    g += c[u++] << v,
                                                    v += 8
                                                }
                                                R = 0,
                                                k = 11 + (127 & (g >>>= C)),
                                                g >>>= 7,
                                                v = v - C - 7
                                            }
                                            if (n.have + k > n.nlen + n.ndist) {
                                                e.msg = "invalid bit length repeat",
                                                n.mode = 30;
                                                break
                                            }
                                            for (; k--; )
                                                n.lens[n.have++] = R
                                        }
                                    }
                                    if (30 === n.mode)
                                        break;
                                    if (0 === n.lens[256]) {
                                        e.msg = "invalid code -- missing end-of-block",
                                        n.mode = 30;
                                        break
                                    }
                                    if (n.lenbits = 9,
                                    z = {
                                        bits: n.lenbits
                                    },
                                    I = s(1, n.lens, 0, n.nlen, n.lencode, 0, n.work, z),
                                    n.lenbits = z.bits,
                                    I) {
                                        e.msg = "invalid literal/lengths set",
                                        n.mode = 30;
                                        break
                                    }
                                    if (n.distbits = 6,
                                    n.distcode = n.distdyn,
                                    z = {
                                        bits: n.distbits
                                    },
                                    I = s(2, n.lens, n.nlen, n.ndist, n.distcode, 0, n.work, z),
                                    n.distbits = z.bits,
                                    I) {
                                        e.msg = "invalid distances set",
                                        n.mode = 30;
                                        break
                                    }
                                    if (n.mode = 20,
                                    6 === t)
                                        break e;
                                case 20:
                                    n.mode = 21;
                                case 21:
                                    if (6 <= h && 258 <= p) {
                                        e.next_out = f,
                                        e.avail_out = p,
                                        e.next_in = u,
                                        e.avail_in = h,
                                        n.hold = g,
                                        n.bits = v,
                                        i(e, y),
                                        f = e.next_out,
                                        d = e.output,
                                        p = e.avail_out,
                                        u = e.next_in,
                                        c = e.input,
                                        h = e.avail_in,
                                        g = n.hold,
                                        v = n.bits,
                                        12 === n.mode && (n.back = -1);
                                        break
                                    }
                                    for (n.back = 0; E = (L = n.lencode[g & (1 << n.lenbits) - 1]) >>> 16 & 255,
                                    D = 65535 & L,
                                    !((C = L >>> 24) <= v); ) {
                                        if (0 === h)
                                            break e;
                                        h--,
                                        g += c[u++] << v,
                                        v += 8
                                    }
                                    if (E && 0 == (240 & E)) {
                                        for (B = C,
                                        U = E,
                                        T = D; E = (L = n.lencode[T + ((g & (1 << B + U) - 1) >> B)]) >>> 16 & 255,
                                        D = 65535 & L,
                                        !(B + (C = L >>> 24) <= v); ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        g >>>= B,
                                        v -= B,
                                        n.back += B
                                    }
                                    if (g >>>= C,
                                    v -= C,
                                    n.back += C,
                                    n.length = D,
                                    0 === E) {
                                        n.mode = 26;
                                        break
                                    }
                                    if (32 & E) {
                                        n.back = -1,
                                        n.mode = 12;
                                        break
                                    }
                                    if (64 & E) {
                                        e.msg = "invalid literal/length code",
                                        n.mode = 30;
                                        break
                                    }
                                    n.extra = 15 & E,
                                    n.mode = 22;
                                case 22:
                                    if (n.extra) {
                                        for (O = n.extra; v < O; ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        n.length += g & (1 << n.extra) - 1,
                                        g >>>= n.extra,
                                        v -= n.extra,
                                        n.back += n.extra
                                    }
                                    n.was = n.length,
                                    n.mode = 23;
                                case 23:
                                    for (; E = (L = n.distcode[g & (1 << n.distbits) - 1]) >>> 16 & 255,
                                    D = 65535 & L,
                                    !((C = L >>> 24) <= v); ) {
                                        if (0 === h)
                                            break e;
                                        h--,
                                        g += c[u++] << v,
                                        v += 8
                                    }
                                    if (0 == (240 & E)) {
                                        for (B = C,
                                        U = E,
                                        T = D; E = (L = n.distcode[T + ((g & (1 << B + U) - 1) >> B)]) >>> 16 & 255,
                                        D = 65535 & L,
                                        !(B + (C = L >>> 24) <= v); ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        g >>>= B,
                                        v -= B,
                                        n.back += B
                                    }
                                    if (g >>>= C,
                                    v -= C,
                                    n.back += C,
                                    64 & E) {
                                        e.msg = "invalid distance code",
                                        n.mode = 30;
                                        break
                                    }
                                    n.offset = D,
                                    n.extra = 15 & E,
                                    n.mode = 24;
                                case 24:
                                    if (n.extra) {
                                        for (O = n.extra; v < O; ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        n.offset += g & (1 << n.extra) - 1,
                                        g >>>= n.extra,
                                        v -= n.extra,
                                        n.back += n.extra
                                    }
                                    if (n.offset > n.dmax) {
                                        e.msg = "invalid distance too far back",
                                        n.mode = 30;
                                        break
                                    }
                                    n.mode = 25;
                                case 25:
                                    if (0 === p)
                                        break e;
                                    if (n.offset > (k = y - p)) {
                                        if ((k = n.offset - k) > n.whave && n.sane) {
                                            e.msg = "invalid distance too far back",
                                            n.mode = 30;
                                            break
                                        }
                                        x = k > n.wnext ? (k -= n.wnext,
                                        n.wsize - k) : n.wnext - k,
                                        k > n.length && (k = n.length),
                                        S = n.window
                                    } else
                                        S = d,
                                        x = f - n.offset,
                                        k = n.length;
                                    for (p -= k = p < k ? p : k,
                                    n.length -= k; d[f++] = S[x++],
                                    --k; )
                                        ;
                                    0 === n.length && (n.mode = 21);
                                    break;
                                case 26:
                                    if (0 === p)
                                        break e;
                                    d[f++] = n.length,
                                    p--,
                                    n.mode = 21;
                                    break;
                                case 27:
                                    if (n.wrap) {
                                        for (; v < 32; ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g |= c[u++] << v,
                                            v += 8
                                        }
                                        if (y -= p,
                                        e.total_out += y,
                                        n.total += y,
                                        y && (e.adler = n.check = (n.flags ? a : o)(n.check, d, y, f - y)),
                                        y = p,
                                        (n.flags ? g : l(g)) !== n.check) {
                                            e.msg = "incorrect data check",
                                            n.mode = 30;
                                            break
                                        }
                                        v = g = 0
                                    }
                                    n.mode = 28;
                                case 28:
                                    if (n.wrap && n.flags) {
                                        for (; v < 32; ) {
                                            if (0 === h)
                                                break e;
                                            h--,
                                            g += c[u++] << v,
                                            v += 8
                                        }
                                        if (g !== (4294967295 & n.total)) {
                                            e.msg = "incorrect length check",
                                            n.mode = 30;
                                            break
                                        }
                                        v = g = 0
                                    }
                                    n.mode = 29;
                                case 29:
                                    I = 1;
                                    break e;
                                case 30:
                                    I = -3;
                                    break e;
                                case 31:
                                    return -4;
                                default:
                                    return -2
                                }
                            return e.next_out = f,
                            e.avail_out = p,
                            e.next_in = u,
                            e.avail_in = h,
                            n.hold = g,
                            n.bits = v,
                            (n.wsize || y !== e.avail_out && n.mode < 30 && (n.mode < 27 || 4 !== t)) && b(e, e.output, e.next_out, y - e.avail_out) ? (n.mode = 31,
                            -4) : (w -= e.avail_in,
                            y -= e.avail_out,
                            e.total_in += w,
                            e.total_out += y,
                            n.total += y,
                            n.wrap && y && (e.adler = n.check = (n.flags ? a : o)(n.check, d, y, e.next_out - y)),
                            e.data_type = n.bits + (n.last ? 64 : 0) + (12 === n.mode ? 128 : 0) + (20 === n.mode || 15 === n.mode ? 256 : 0),
                            (0 == w && 0 === y || 4 === t) && 0 === I ? -5 : I)
                        }
                        ,
                        n.inflateEnd = function(e) {
                            var t;
                            return e && e.state ? ((t = e.state).window && (t.window = null),
                            e.state = null,
                            0) : -2
                        }
                        ,
                        n.inflateGetHeader = function(e, t) {
                            return e && e.state && 0 != (2 & (e = e.state).wrap) ? ((e.head = t).done = !1,
                            0) : -2
                        }
                        ,
                        n.inflateSetDictionary = function(e, t) {
                            var n, r = t.length;
                            return e && e.state && (0 === (n = e.state).wrap || 11 === n.mode) ? 11 === n.mode && o(1, t, r, 0) !== n.check ? -3 : b(e, t, r, r) ? (n.mode = 31,
                            -4) : (n.havedict = 1,
                            0) : -2
                        }
                        ,
                        n.inflateInfo = "pako inflate (from Nodeca project)"
                    },
                    "zlib/constants.js": function(e, t, n) {
                        "use strict";
                        t.exports = {
                            Z_NO_FLUSH: 0,
                            Z_PARTIAL_FLUSH: 1,
                            Z_SYNC_FLUSH: 2,
                            Z_FULL_FLUSH: 3,
                            Z_FINISH: 4,
                            Z_BLOCK: 5,
                            Z_TREES: 6,
                            Z_OK: 0,
                            Z_STREAM_END: 1,
                            Z_NEED_DICT: 2,
                            Z_ERRNO: -1,
                            Z_STREAM_ERROR: -2,
                            Z_DATA_ERROR: -3,
                            Z_BUF_ERROR: -5,
                            Z_NO_COMPRESSION: 0,
                            Z_BEST_SPEED: 1,
                            Z_BEST_COMPRESSION: 9,
                            Z_DEFAULT_COMPRESSION: -1,
                            Z_FILTERED: 1,
                            Z_HUFFMAN_ONLY: 2,
                            Z_RLE: 3,
                            Z_FIXED: 4,
                            Z_DEFAULT_STRATEGY: 0,
                            Z_BINARY: 0,
                            Z_TEXT: 1,
                            Z_UNKNOWN: 2,
                            Z_DEFLATED: 8
                        }
                    },
                    "zlib/messages.js": function(e, t, n) {
                        "use strict";
                        t.exports = {
                            2: "need dictionary",
                            1: "stream end",
                            0: "",
                            "-1": "file error",
                            "-2": "stream error",
                            "-3": "data error",
                            "-4": "insufficient memory",
                            "-5": "buffer error",
                            "-6": "incompatible version"
                        }
                    },
                    "zlib/zstream.js": function(e, t, n) {
                        "use strict";
                        t.exports = function() {
                            this.input = null,
                            this.next_in = 0,
                            this.avail_in = 0,
                            this.total_in = 0,
                            this.output = null,
                            this.next_out = 0,
                            this.avail_out = 0,
                            this.total_out = 0,
                            this.msg = "",
                            this.state = null,
                            this.data_type = 2,
                            this.adler = 0
                        }
                    },
                    "zlib/gzheader.js": function(e, t, n) {
                        "use strict";
                        t.exports = function() {
                            this.text = 0,
                            this.time = 0,
                            this.xflags = 0,
                            this.os = 0,
                            this.extra = null,
                            this.extra_len = 0,
                            this.name = "",
                            this.comment = "",
                            this.hcrc = 0,
                            this.done = !1
                        }
                    },
                    "zlib/adler32.js": function(e, t, n) {
                        "use strict";
                        t.exports = function(e, t, n, r) {
                            for (var o = 65535 & e | 0, a = e >>> 16 & 65535 | 0, i = 0; 0 !== n; ) {
                                for (n -= i = 2e3 < n ? 2e3 : n; a = a + (o = o + t[r++] | 0) | 0,
                                --i; )
                                    ;
                                o %= 65521,
                                a %= 65521
                            }
                            return o | a << 16 | 0
                        }
                    },
                    "zlib/crc32.js": function(e, t, n) {
                        "use strict";
                        var r = function() {
                            for (var e = [], t = 0; t < 256; t++) {
                                for (var n = t, r = 0; r < 8; r++)
                                    n = 1 & n ? 3988292384 ^ n >>> 1 : n >>> 1;
                                e[t] = n
                            }
                            return e
                        }();
                        t.exports = function(e, t, n, o) {
                            var a = r
                              , i = o + n;
                            e ^= -1;
                            for (var s = o; s < i; s++)
                                e = e >>> 8 ^ a[255 & (e ^ t[s])];
                            return -1 ^ e
                        }
                    },
                    "zlib/inffast.js": function(e, t, n) {
                        "use strict";
                        t.exports = function(e, t) {
                            var n, r, o, a, i, s, l = e.state, c = e.next_in, d = e.input, u = c + (e.avail_in - 5), f = e.next_out, h = e.output, $ = f - (t - e.avail_out), _ = f + (e.avail_out - 257), m = l.dmax, b = l.wsize, p = l.whave, g = l.wnext, v = l.window, w = l.hold, y = l.bits, k = l.lencode, x = l.distcode, S = (1 << l.lenbits) - 1, C = (1 << l.distbits) - 1;
                            e: do
                                for (y < 15 && (w += d[c++] << y,
                                y += 8,
                                w += d[c++] << y,
                                y += 8),
                                n = k[w & S]; ; ) {
                                    if (w >>>= r = n >>> 24,
                                    y -= r,
                                    0 == (r = n >>> 16 & 255))
                                        h[f++] = 65535 & n;
                                    else {
                                        if (!(16 & r)) {
                                            if (0 == (64 & r)) {
                                                n = k[(65535 & n) + (w & (1 << r) - 1)];
                                                continue
                                            }
                                            if (32 & r) {
                                                l.mode = 12;
                                                break e
                                            }
                                            e.msg = "invalid literal/length code",
                                            l.mode = 30;
                                            break e
                                        }
                                        for (o = 65535 & n,
                                        (r &= 15) && (y < r && (w += d[c++] << y,
                                        y += 8),
                                        o += w & (1 << r) - 1,
                                        w >>>= r,
                                        y -= r),
                                        y < 15 && (w += d[c++] << y,
                                        y += 8,
                                        w += d[c++] << y,
                                        y += 8),
                                        n = x[w & C]; ; ) {
                                            if (w >>>= r = n >>> 24,
                                            y -= r,
                                            !(16 & (r = n >>> 16 & 255))) {
                                                if (0 == (64 & r)) {
                                                    n = x[(65535 & n) + (w & (1 << r) - 1)];
                                                    continue
                                                }
                                                e.msg = "invalid distance code",
                                                l.mode = 30;
                                                break e
                                            }
                                            if (a = 65535 & n,
                                            y < (r &= 15) && (w += d[c++] << y,
                                            (y += 8) < r && (w += d[c++] << y,
                                            y += 8)),
                                            m < (a += w & (1 << r) - 1)) {
                                                e.msg = "invalid distance too far back",
                                                l.mode = 30;
                                                break e
                                            }
                                            if (w >>>= r,
                                            y -= r,
                                            (r = f - $) < a) {
                                                if (p < (r = a - r) && l.sane) {
                                                    e.msg = "invalid distance too far back",
                                                    l.mode = 30;
                                                    break e
                                                }
                                                if (s = v,
                                                (i = 0) === g) {
                                                    if (i += b - r,
                                                    r < o) {
                                                        for (o -= r; h[f++] = v[i++],
                                                        --r; )
                                                            ;
                                                        i = f - a,
                                                        s = h
                                                    }
                                                } else if (g < r) {
                                                    if (i += b + g - r,
                                                    (r -= g) < o) {
                                                        for (o -= r; h[f++] = v[i++],
                                                        --r; )
                                                            ;
                                                        if (i = 0,
                                                        g < o) {
                                                            for (o -= r = g; h[f++] = v[i++],
                                                            --r; )
                                                                ;
                                                            i = f - a,
                                                            s = h
                                                        }
                                                    }
                                                } else if (i += g - r,
                                                r < o) {
                                                    for (o -= r; h[f++] = v[i++],
                                                    --r; )
                                                        ;
                                                    i = f - a,
                                                    s = h
                                                }
                                                for (; 2 < o; )
                                                    h[f++] = s[i++],
                                                    h[f++] = s[i++],
                                                    h[f++] = s[i++],
                                                    o -= 3;
                                                o && (h[f++] = s[i++],
                                                1 < o && (h[f++] = s[i++]))
                                            } else {
                                                for (i = f - a; h[f++] = h[i++],
                                                h[f++] = h[i++],
                                                h[f++] = h[i++],
                                                2 < (o -= 3); )
                                                    ;
                                                o && (h[f++] = h[i++],
                                                1 < o && (h[f++] = h[i++]))
                                            }
                                            break
                                        }
                                    }
                                    break
                                }
                            while (c < u && f < _);
                            w &= (1 << (y -= (o = y >> 3) << 3)) - 1,
                            e.next_in = c -= o,
                            e.next_out = f,
                            e.avail_in = c < u ? u - c + 5 : 5 - (c - u),
                            e.avail_out = f < _ ? _ - f + 257 : 257 - (f - _),
                            l.hold = w,
                            l.bits = y
                        }
                    },
                    "zlib/inftrees.js": function(e, t, n) {
                        "use strict";
                        var r = e("../utils/common")
                          , o = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]
                          , a = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78]
                          , i = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0]
                          , s = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
                        t.exports = function(e, t, n, l, c, d, u, f) {
                            for (var h, $, _, m, b, p, g, v, w, y = f.bits, k = 0, x = 0, S = 0, C = 0, E = 0, D = 0, B = 0, U = 0, T = 0, R = 0, I = null, z = 0, O = new r.Buf16(16), L = new r.Buf16(16), N = null, P = 0, k = 0; k <= 15; k++)
                                O[k] = 0;
                            for (x = 0; x < l; x++)
                                O[t[n + x]]++;
                            for (E = y,
                            C = 15; 1 <= C && 0 === O[C]; C--)
                                ;
                            if (C < E && (E = C),
                            0 === C)
                                c[d++] = 20971520,
                                c[d++] = 20971520,
                                f.bits = 1;
                            else {
                                for (S = 1; S < C && 0 === O[S]; S++)
                                    ;
                                for (E < S && (E = S),
                                k = U = 1; k <= 15; k++)
                                    if ((U = (U <<= 1) - O[k]) < 0)
                                        return -1;
                                if (0 < U && (0 === e || 1 !== C))
                                    return -1;
                                for (L[1] = 0,
                                k = 1; k < 15; k++)
                                    L[k + 1] = L[k] + O[k];
                                for (x = 0; x < l; x++)
                                    0 !== t[n + x] && (u[L[t[n + x]]++] = x);
                                if (p = 0 === e ? (I = N = u,
                                19) : 1 === e ? (I = o,
                                z -= 257,
                                N = a,
                                P -= 257,
                                256) : (I = i,
                                N = s,
                                -1),
                                k = S,
                                b = d,
                                B = x = R = 0,
                                _ = -1,
                                m = (T = 1 << (D = E)) - 1,
                                1 === e && 852 < T || 2 === e && 592 < T)
                                    return 1;
                                for (; ; ) {
                                    for (w = u[x] < p ? (v = 0,
                                    u[x]) : u[x] > p ? (v = N[P + u[x]],
                                    I[z + u[x]]) : (v = 96,
                                    0),
                                    h = 1 << (g = k - B),
                                    S = $ = 1 << D; c[b + (R >> B) + ($ -= h)] = g << 24 | v << 16 | w | 0,
                                    0 !== $; )
                                        ;
                                    for (h = 1 << k - 1; R & h; )
                                        h >>= 1;
                                    if (R = 0 !== h ? (R & h - 1) + h : 0,
                                    x++,
                                    0 == --O[k]) {
                                        if (k === C)
                                            break;
                                        k = t[n + u[x]]
                                    }
                                    if (E < k && (R & m) !== _) {
                                        for (b += S,
                                        U = 1 << (D = k - (B = 0 === B ? E : B)); D + B < C && !((U -= O[D + B]) <= 0); )
                                            D++,
                                            U <<= 1;
                                        if (T += 1 << D,
                                        1 === e && 852 < T || 2 === e && 592 < T)
                                            return 1;
                                        c[_ = R & m] = E << 24 | D << 16 | b - d | 0
                                    }
                                }
                                0 !== R && (c[b + R] = k - B << 24 | 4194304),
                                f.bits = E
                            }
                            return 0
                        }
                    }
                };
                for (t in n)
                    n[t].folder = t.substring(0, t.lastIndexOf("/") + 1);
                var r = function(e) {
                    var t = [];
                    return (e = e.split("/").every(function(e) {
                        return ".." == e ? t.pop() : "." == e || "" == e || t.push(e)
                    }) ? t.join("/") : null) ? n[e] || n[e + ".js"] || n[e + "/index.js"] : null
                }
                  , o = function(e, t) {
                    return e ? r(e.folder + "node_modules/" + t) || o(e.parent, t) : null
                };
                return function e(t, n) {
                    var a = n.match(/^\//) ? null : t ? n.match(/^\.\.?\//) ? r(t.folder + n) : o(t, n) : r(n);
                    if (a)
                        return a.exports || (a.parent = t,
                        a(e.bind(null, a), a, a.exports = {})),
                        a.exports;
                    throw "module not found: " + n
                }(null, e)
            },
            decompress: function(e) {
                this.exports || (this.exports = this.require("inflate.js"));
                try {
                    return this.exports.inflate(e)
                } catch (t) {}
            },
            hasUnityMarker: function(e) {
                var t = 10
                  , n = "UnityWeb Compressed Content (gzip)";
                if (t > e.length || 31 != e[0] || 139 != e[1])
                    return !1;
                var r = e[3];
                if (4 & r && (t + 2 > e.length || (t += 2 + e[t] + (e[t + 1] << 8)) > e.length))
                    return !1;
                if (8 & r) {
                    for (; t < e.length && e[t]; )
                        t++;
                    if (t + 1 > e.length)
                        return !1;
                    t++
                }
                return 16 & r && String.fromCharCode.apply(null, e.subarray(t, t + n.length + 1)) == n + "\0"
            }
        }
    };
    function T(e) {
        C(e);
        var t = s.cacheControl(s[e])
          , n = s.companyName && s.productName ? s.cachedFetch : s.fetchWithProgress
          , o = s[e]
          , o = /file:\/\//.exec(o) ? "same-origin" : void 0;
        return n(s[e], {
            method: "GET",
            companyName: s.companyName,
            productName: s.productName,
            productVersion: s.productVersion,
            control: t,
            mode: o,
            onProgress: function(t) {
                C(e, t)
            }
        }).then(function(t) {
            var n, r;
            return n = t.parsedBody,
            r = s[e],
            new Promise(function(e, t) {
                try {
                    for (var o in U) {
                        var a, i, s;
                        if (U[o].hasUnityMarker(n))
                            return r && console.log('You can reduce startup time if you configure your web server to add "Content-Encoding: ' + o + '" response header when serving "' + r + '" file.'),
                            (a = U[o]).worker || (i = URL.createObjectURL(new Blob(["this.require = ", a.require.toString(), "; this.decompress = ", a.decompress.toString(), "; this.onmessage = ", (function(e) {
                                e = {
                                    id: e.data.id,
                                    decompressed: this.decompress(e.data.compressed)
                                },
                                postMessage(e, e.decompressed ? [e.decompressed.buffer] : [])
                            }
                            ).toString(), "; postMessage({ ready: true });", ],{
                                type: "application/javascript"
                            })),
                            a.worker = new Worker(i),
                            a.worker.onmessage = function(e) {
                                e.data.ready ? URL.revokeObjectURL(i) : (this.callbacks[e.data.id](e.data.decompressed),
                                delete this.callbacks[e.data.id])
                            }
                            ,
                            a.worker.callbacks = {},
                            a.worker.nextCallbackId = 0),
                            s = a.worker.nextCallbackId++,
                            a.worker.callbacks[s] = e,
                            void a.worker.postMessage({
                                id: s,
                                compressed: n
                            }, [n.buffer])
                    }
                    e(n)
                } catch (l) {
                    t(l)
                }
            }
            )
        }).catch(function(t) {
            var n = "Failed to download file " + s[e];
            "file:" == location.protocol ? r(n + ". Loading web pages via a file:// URL without a web server is not supported by this browser. Please use a local development web server to host Unity content, or use the Unity Build and Run option.", "error") : console.error(n)
        })
    }
    return new Promise(function(e, t) {
        var o, a;
        s.SystemInfo.hasWebGL ? 1 == s.SystemInfo.hasWebGL ? (o = 'Your browser does not support graphics API "WebGL 2" which is required for this content.',
        "Safari" == s.SystemInfo.browser && 15 > parseInt(s.SystemInfo.browserVersion) && (s.SystemInfo.mobile || 1 < navigator.maxTouchPoints ? o += "\nUpgrade to iOS 15 or later." : o += "\nUpgrade to Safari 15 or later."),
        t(o)) : s.SystemInfo.hasWasm ? (s.startupErrorHandler = t,
        n(0),
        s.postRun.push(function() {
            n(1),
            delete s.startupErrorHandler,
            e(y)
        }),
        Promise.all([T("frameworkUrl").then(function(e) {
            var t = URL.createObjectURL(new Blob([e],{
                type: "application/javascript"
            }));
            return new Promise(function(e, n) {
                var o = document.createElement("script");
                o.src = t,
                o.onload = function() {
                    if ("undefined" == typeof unityFramework || !unityFramework) {
                        var n, a = [["br", "br"], ["gz", "gzip"], ];
                        for (n in a) {
                            var i, l = a[n];
                            if (s.frameworkUrl.endsWith("." + l[0]))
                                return i = "Unable to parse " + s.frameworkUrl + "!",
                                "file:" == location.protocol ? void r(i + " Loading pre-compressed (brotli or gzip) content via a file:// URL without a web server is not supported by this browser. Please use a local development web server to host compressed Unity content, or use the Unity Build and Run option.", "error") : (i += ' This can happen if build compression was enabled but web server hosting the content was misconfigured to not serve the file with HTTP Response Header "Content-Encoding: ' + l[1] + '" present. Check browser Console and Devtools Network tab to debug.',
                                "br" == l[0] && "http:" == location.protocol && (l = -1 != ["localhost", "127.0.0.1"].indexOf(location.hostname) ? "" : "Migrate your server to use HTTPS.",
                                i = /Firefox/.test(navigator.userAgent) ? "Unable to parse " + s.frameworkUrl + '!<br>If using custom web server, verify that web server is sending .br files with HTTP Response Header "Content-Encoding: br". Brotli compression may not be supported in Firefox over HTTP connections. ' + l + ' See <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1670675">https://bugzilla.mozilla.org/show_bug.cgi?id=1670675</a> for more information.' : "Unable to parse " + s.frameworkUrl + '!<br>If using custom web server, verify that web server is sending .br files with HTTP Response Header "Content-Encoding: br". Brotli compression may not be supported over HTTP connections. Migrate your server to use HTTPS.'),
                                void r(i, "error"))
                        }
                        r("Unable to parse " + s.frameworkUrl + "! The file is corrupt, or compression was misconfigured? (check Content-Encoding HTTP Response Header on web server)", "error")
                    }
                    var c = unityFramework;
                    unityFramework = null,
                    o.onload = null,
                    URL.revokeObjectURL(t),
                    e(c)
                }
                ,
                o.onerror = function(e) {
                    r("Unable to load file " + s.frameworkUrl + "! Check that the file exists on the remote server. (also check browser Console and Devtools Network tab to debug)", "error")
                }
                ,
                document.body.appendChild(o),
                s.deinitializers.push(function() {
                    document.body.removeChild(o)
                })
            }
            )
        }), T("codeUrl"), ]).then(function(e) {
            s.wasmBinary = e[1],
            e[0](s)
        }),
        a = T("dataUrl"),
        s.preRun.push(function() {
            s.addRunDependency("dataUrl"),
            a.then(function(e) {
                var t = new DataView(e.buffer,e.byteOffset,e.byteLength)
                  , n = 0
                  , r = "UnityWebData1.0\0";
                if (!String.fromCharCode.apply(null, e.subarray(n, n + r.length)) == r)
                    throw "unknown data format";
                var o = t.getUint32(n += r.length, !0);
                for (n += 4; n < o; ) {
                    var a = t.getUint32(n, !0)
                      , i = (n += 4,
                    t.getUint32(n, !0))
                      , l = (n += 4,
                    t.getUint32(n, !0))
                      , c = (n += 4,
                    String.fromCharCode.apply(null, e.subarray(n, n + l)));
                    n += l;
                    for (var d = 0, u = c.indexOf("/", d) + 1; 0 < u; d = u,
                    u = c.indexOf("/", d) + 1)
                        s.FS_createPath(c.substring(0, d), c.substring(d, u - 1), !0, !0);
                    s.FS_createDataFile(c, null, e.subarray(a, a + i), !0, !0, !0)
                }
                s.removeRunDependency("dataUrl")
            })
        })) : t("Your browser does not support WebAssembly.") : t("Your browser does not support WebGL.")
    }
    )
}
