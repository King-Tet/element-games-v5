( () => {
    "use strict";
    var e, t, a, n, s, i, o, r = "background: #495d14; color: #88ad25; font-size: medium; padding: 1px 8px; border-radius: 4px;";
    !function(e) {
        e.Hello = "hello",
        e.ModulesInitialized = "modules-initialized"
    }(e || (e = {})),
    function(e) {
        e.Start = "start",
        e.Success = "success"
    }(t || (t = {})),
    (a || (a = {})).Hello = "hello",
    function(e) {
        e.Start = "start",
        e.Success = "success"
    }(n || (n = {})),
    function(e) {
        e.Global = "global",
        e.Adv = "adv",
        e.EventTracker = "event-tracker",
        e.Auth = "auth",
        e.GameEvents = "game-events"
    }(s || (s = {})),
    function(e) {
        e.MelonWebApp = "melon-web-app",
        e.MelonWebGameApp = "melon-web-game-app"
    }(i || (i = {}));
    var c, l, d, u, h, p = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            e.type === t.Success && this.data.onSuccess(),
            this.handleDestroy()
        }
        ,
        e
    }(), y = function() {
        function e(e) {
            this.communicator = e
        }
        return e.prototype.start = function(e) {
            var t = this
              , a = Date.now();
            return this.cycle = new p(e,function() {
                return t.handleDestroyCycle()
            }
            ),
            this.intervalId = setInterval(function() {
                t.sentHelloMessage(a)
            }, 500),
            this.timeoutId = setTimeout(function() {
                e.onTimeout(),
                t.handleDestroyCycle()
            }, 36e5),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            switch (e.type) {
            case t.Start:
                this.handleReceiveStart(e);
                break;
            case t.Success:
                this.cycle && this.cycle.parseMessage(e)
            }
        }
        ,
        e.prototype.handleReceiveStart = function(e) {
            this.communicator.postMessage({
                module: s.Global,
                event: a.Hello,
                type: n.Success,
                data: {
                    id: e.data.id
                }
            })
        }
        ,
        e.prototype.sentHelloMessage = function(e) {
            this.communicator.postMessage({
                module: s.Global,
                event: a.Hello,
                type: n.Start,
                data: {
                    id: e
                }
            })
        }
        ,
        e.prototype.handleDestroyCycle = function() {
            delete this.cycle,
            this.intervalId && clearInterval(this.intervalId),
            this.timeoutId && clearTimeout(this.timeoutId)
        }
        ,
        e
    }(), f = function() {
        function t(e) {
            var t = this;
            this.communicator = e,
            this.isConnectedToParent = new Promise(function(e, a) {
                t.setIsConnectedToParent = e
            }
            ),
            this.isParentModulesInitialized = new Promise(function(e) {
                t.setIsParentModulesInitialized = e
            }
            ),
            this.helloManager = new y(this.communicator),
            this.helloManager.start({
                onSuccess: function() {
                    return t.setIsConnectedToParent(!0)
                },
                onTimeout: function() {
                    t.setIsConnectedToParent(!1),
                    t.setIsParentModulesInitialized(!1)
                }
            })
        }
        return t.prototype.parseMessage = function(t) {
            switch (t.event) {
            case e.Hello:
                this.helloManager.parseMessage(t);
                break;
            case e.ModulesInitialized:
                this.setIsParentModulesInitialized(!0)
            }
        }
        ,
        t
    }();
    !function(e) {
        e.InitialData = "initial-data",
        e.ShowRewardedVideo = "show-rewarded-video",
        e.ShowFullscreenAdv = "show-fullscreen-adv"
    }(c || (c = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.ShowRewardedVideo = "show-rewarded-video",
        e.ShowFullscreenAdv = "show-fullscreen-adv"
    }(l || (l = {})),
    function(e) {
        e.ShowRewardedVideo = "show-rewarded-video",
        e.ShowFullscreenAdv = "show-fullscreen-adv"
    }(d || (d = {})),
    function(e) {
        e.Opened = "opened",
        e.Closed = "closed",
        e.Error = "error",
        e.Empty = "empty"
    }(u || (u = {})),
    function(e) {
        e.Opened = "opened",
        e.Closed = "closed",
        e.Rewarded = "rewarded",
        e.Error = "error",
        e.Empty = "empty"
    }(h || (h = {}));
    var v, g, m, w, M, b = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            switch (e.type) {
            case h.Opened:
                this.handleShowRewardedVideoOpened();
                break;
            case h.Closed:
                this.handleShowRewardedVideoClosed();
                break;
            case h.Empty:
                this.handleShowRewardedVideoEmpty();
                break;
            case h.Error:
                this.handleShowRewardedVideoError(e);
                break;
            case h.Rewarded:
                this.handleShowRewardedVideoRewarded(e)
            }
        }
        ,
        e.prototype.handleShowRewardedVideoOpened = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onOpen) && this.data.callbacks.onOpen()
        }
        ,
        e.prototype.handleShowRewardedVideoClosed = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onClose) && this.data.callbacks.onClose(),
            this.handleDestroy()
        }
        ,
        e.prototype.handleShowRewardedVideoEmpty = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onEmpty) && this.data.callbacks.onEmpty(),
            this.handleDestroy()
        }
        ,
        e.prototype.handleShowRewardedVideoError = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onError) && this.data.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
        ,
        e.prototype.handleShowRewardedVideoRewarded = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onRewarded) && this.data.callbacks.onRewarded(e.data.isRewarded)
        }
        ,
        e
    }(), k = function() {
        function e(e) {
            this.communicator = e,
            this.rewardedVideoCycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.rewardedVideoCycles.set(a, new b(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.Adv,
                event: l.ShowRewardedVideo,
                type: d.ShowRewardedVideo,
                data: {
                    id: a
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.rewardedVideoCycles.has(e.data.id) && this.rewardedVideoCycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.rewardedVideoCycles.delete(e)
        }
        ,
        e
    }(), $ = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            switch (e.type) {
            case u.Opened:
                this.handleShowRewardedVideoOpened();
                break;
            case u.Closed:
                this.handleShowRewardedVideoClosed();
                break;
            case u.Empty:
                this.handleShowRewardedVideoEmpty();
                break;
            case u.Error:
                this.handleShowRewardedVideoError(e)
            }
        }
        ,
        e.prototype.handleShowRewardedVideoOpened = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onOpen) && this.data.callbacks.onOpen()
        }
        ,
        e.prototype.handleShowRewardedVideoClosed = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onClose) && this.data.callbacks.onClose(),
            this.handleDestroy()
        }
        ,
        e.prototype.handleShowRewardedVideoEmpty = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onEmpty) && this.data.callbacks.onEmpty(),
            this.handleDestroy()
        }
        ,
        e.prototype.handleShowRewardedVideoError = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onError) && this.data.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
        ,
        e
    }(), D = function() {
        function e(e) {
            this.communicator = e,
            this.fullscreenAdvCycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.fullscreenAdvCycles.set(a, new $(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.Adv,
                event: l.ShowFullscreenAdv,
                type: d.ShowFullscreenAdv,
                data: {
                    id: a
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.fullscreenAdvCycles.has(e.data.id) && this.fullscreenAdvCycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.fullscreenAdvCycles.delete(e)
        }
        ,
        e
    }(), S = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            this.handleReceivedMessage(e)
        }
        ,
        e.prototype.handleReceivedMessage = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onReceived) && this.data.callbacks.onReceived(e.data.result),
            this.handleDestroy()
        }
        ,
        e
    }(), E = function() {
        function e(e) {
            this.communicator = e,
            this.cycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.cycles.set(a, new S(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.Adv,
                event: l.RequestInitialData,
                data: {
                    id: a
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.cycles.delete(e)
        }
        ,
        e
    }(), R = function() {
        function e(e) {
            this.communicator = e,
            this.rewardedVideoManager = new k(this.communicator),
            this.fullscreenAdvManager = new D(this.communicator),
            this.initializeAdvManager = new E(this.communicator)
        }
        return e.prototype.initialize = function() {
            return this.initializeAdvData()
        }
        ,
        e.prototype.isAdvAvailable = function() {
            var e;
            return !!(null === (e = this.initialData) || void 0 === e ? void 0 : e.isAdvAvailable)
        }
        ,
        e.prototype.showRewardedVideo = function(e) {
            this.rewardedVideoManager.addNew(e)
        }
        ,
        e.prototype.showFullscreenAdv = function(e) {
            this.fullscreenAdvManager.addNew(e)
        }
        ,
        e.prototype.parseMessage = function(e) {
            switch (e.event) {
            case c.ShowRewardedVideo:
                this.rewardedVideoManager.parseMessage(e);
                break;
            case c.ShowFullscreenAdv:
                this.fullscreenAdvManager.parseMessage(e);
                break;
            case c.InitialData:
                this.initializeAdvManager.parseMessage(e)
            }
        }
        ,
        e.prototype.handleReceivedInitialData = function(e) {
            this.initialData = e
        }
        ,
        e.prototype.initializeAdvData = function() {
            var e = this;
            return new Promise(function(t) {
                e.initializeAdvManager.addNew({
                    callbacks: {
                        onReceived: function(a) {
                            e.handleReceivedInitialData(a),
                            t(!0)
                        }
                    }
                })
            }
            )
        }
        ,
        e
    }(), C = function() {
        return (C = Object.assign || function(e) {
            for (var t, a = 1, n = arguments.length; a < n; a++)
                for (var s in t = arguments[a])
                    Object.prototype.hasOwnProperty.call(t, s) && (e[s] = t[s]);
            return e
        }
        ).apply(this, arguments)
    }, I = [window.location.origin], z = function() {
        function e(e) {
            this.parseMessage = e
        }
        return e.prototype.initialize = function() {
            window.parent || this.logMessage(["Warning! Parent container is not found", console.warn]),
            this.messageListener = this.onReceiveMessage.bind(this),
            window.addEventListener("message", this.messageListener)
        }
        ,
        e.prototype.destroy = function() {
            this.messageListener && (window.removeEventListener("message", this.messageListener),
            delete this.messageListener)
        }
        ,
        e.prototype.postMessage = function(e) {
            window.parent ? (this.logMessage(["Post message to parent", e]),
            window.parent.postMessage(C(C({}, e), {
                source: i.MelonWebGameApp
            }), "*")) : this.logMessage(["Can not post message: parent window object is not found"], console.error)
        }
        ,
        e.prototype.onReceiveMessage = function(e) {
            (I.includes(e.origin) || e.origin.includes("localhost")) && e.data.source === i.MelonWebApp && (this.logMessage(["Received message", e.data]),
            this.parseMessage(e.data))
        }
        ,
        e.prototype.logMessage = function(e, t) {
            void 0 === t && (t = console.log),
            t.apply(void 0, function(e, t, a) {
                if (a || 2 === arguments.length)
                    for (var n, s = 0, i = t.length; s < i; s++)
                        !n && s in t || (n || (n = Array.prototype.slice.call(t, 0, s)),
                        n[s] = t[s]);
                return e.concat(n || Array.prototype.slice.call(t))
            }(["%cMelWebSdk C", r], e, !1))
        }
        ,
        e
    }();
    !function(e) {
        e.AppsFlyer = "apps-flyer",
        e.GoogleTag = "google-tag"
    }(v || (v = {})),
    function(e) {
        e.InitialData = "initial-data",
        e.SetCustomerUserId = "set-customer-user-id",
        e.SetEvent = "set-event"
    }(g || (g = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.SetCustomerUserId = "set-customer-user-id",
        e.SetEvent = "set-event"
    }(m || (m = {})),
    function(e) {
        e.Success = "opened",
        e.Error = "error"
    }(w || (w = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(M || (M = {}));
    var A, V, T, G, _ = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            switch (e.type) {
            case w.Success:
                this.handleSuccess();
                break;
            case w.Error:
                this.handleError(e)
            }
        }
        ,
        e.prototype.handleSuccess = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onSuccess) && this.data.callbacks.onSuccess(),
            this.handleDestroy()
        }
        ,
        e.prototype.handleError = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onError) && this.data.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
        ,
        e
    }(), N = function() {
        function e(e) {
            this.communicator = e,
            this.cycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.cycles.set(a, new _(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.EventTracker,
                submodule: v.AppsFlyer,
                event: m.SetCustomerUserId,
                data: {
                    id: a,
                    userId: e.userId
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.cycles.delete(e)
        }
        ,
        e
    }(), q = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            switch (e.type) {
            case M.Success:
                this.handleSuccess();
                break;
            case M.Error:
                this.handleError(e)
            }
        }
        ,
        e.prototype.handleSuccess = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onSuccess) && this.data.callbacks.onSuccess(),
            this.handleDestroy()
        }
        ,
        e.prototype.handleError = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onError) && this.data.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
        ,
        e
    }(), U = function() {
        function e(e) {
            this.communicator = e,
            this.cycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.cycles.set(a, new q(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.EventTracker,
                submodule: v.AppsFlyer,
                event: m.SetEvent,
                data: {
                    id: a,
                    data: {
                        eventName: e.eventName,
                        eventValue: e.eventValue,
                        eventKey: e.eventKey
                    }
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.cycles.delete(e)
        }
        ,
        e
    }(), F = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            this.handleReceivedMessage(e)
        }
        ,
        e.prototype.handleReceivedMessage = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onReceived) && this.data.callbacks.onReceived(e.data.result),
            this.handleDestroy()
        }
        ,
        e
    }(), P = function() {
        function e(e) {
            this.communicator = e,
            this.cycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.cycles.set(a, new F(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.EventTracker,
                submodule: v.AppsFlyer,
                event: m.RequestInitialData,
                data: {
                    id: a
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.cycles.delete(e)
        }
        ,
        e
    }(), O = function() {
        function e(e) {
            this.communicator = e,
            this.setCustomerUserIdManager = new N(this.communicator),
            this.setEventManager = new U(this.communicator),
            this.initializeManager = new P(this.communicator)
        }
        return e.prototype.initialize = function() {
            return this.initializeData()
        }
        ,
        e.prototype.isAvailable = function() {
            var e;
            return !!(null === (e = this.initialData) || void 0 === e ? void 0 : e.isAvailable)
        }
        ,
        e.prototype.setCustomerUserId = function(e) {
            this.setCustomerUserIdManager.addNew(e)
        }
        ,
        e.prototype.setEvent = function(e) {
            this.setEventManager.addNew(e)
        }
        ,
        e.prototype.parseMessage = function(e) {
            switch (e.event) {
            case g.InitialData:
                this.initializeManager.parseMessage(e);
                break;
            case g.SetCustomerUserId:
                this.setCustomerUserIdManager.parseMessage(e);
                break;
            case g.SetEvent:
                this.setEventManager.parseMessage(e)
            }
        }
        ,
        e.prototype.handleReceivedInitialData = function(e) {
            this.initialData = e
        }
        ,
        e.prototype.initializeData = function() {
            var e = this;
            return new Promise(function(t) {
                e.initializeManager.addNew({
                    callbacks: {
                        onReceived: function(a) {
                            e.handleReceivedInitialData(a),
                            t(!0)
                        }
                    }
                })
            }
            )
        }
        ,
        e
    }();
    !function(e) {
        e.InitialData = "initial-data",
        e.SetCustomerUserId = "set-customer-user-id",
        e.SetEvent = "set-event"
    }(A || (A = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.SetCustomerUserId = "set-customer-user-id",
        e.SetEvent = "set-event"
    }(V || (V = {})),
    function(e) {
        e.Success = "opened",
        e.Error = "error"
    }(T || (T = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(G || (G = {}));
    var x, L, W, H = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            switch (e.type) {
            case T.Success:
                this.handleSuccess();
                break;
            case T.Error:
                this.handleError(e)
            }
        }
        ,
        e.prototype.handleSuccess = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onSuccess) && this.data.callbacks.onSuccess(),
            this.handleDestroy()
        }
        ,
        e.prototype.handleError = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onError) && this.data.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
        ,
        e
    }(), K = function() {
        function e(e) {
            this.communicator = e,
            this.cycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.cycles.set(a, new H(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.EventTracker,
                submodule: v.GoogleTag,
                event: V.SetCustomerUserId,
                data: {
                    id: a,
                    userId: e.userId
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.cycles.delete(e)
        }
        ,
        e
    }(), j = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            switch (e.type) {
            case G.Success:
                this.handleSuccess();
                break;
            case G.Error:
                this.handleError(e)
            }
        }
        ,
        e.prototype.handleSuccess = function() {
            var e;
            (null === (e = this.data.callbacks) || void 0 === e ? void 0 : e.onSuccess) && this.data.callbacks.onSuccess(),
            this.handleDestroy()
        }
        ,
        e.prototype.handleError = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onError) && this.data.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
        ,
        e
    }(), B = function() {
        function e(e) {
            this.communicator = e,
            this.cycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.cycles.set(a, new j(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.EventTracker,
                submodule: v.GoogleTag,
                event: V.SetEvent,
                data: {
                    id: a,
                    eventParameters: e.eventParameters
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.cycles.delete(e)
        }
        ,
        e
    }(), J = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            this.handleReceivedMessage(e)
        }
        ,
        e.prototype.handleReceivedMessage = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onReceived) && this.data.callbacks.onReceived(e.data.result),
            this.handleDestroy()
        }
        ,
        e
    }(), Q = function() {
        function e(e) {
            this.communicator = e,
            this.cycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.cycles.set(a, new J(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.EventTracker,
                submodule: v.GoogleTag,
                event: V.RequestInitialData,
                data: {
                    id: a
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.cycles.delete(e)
        }
        ,
        e
    }(), X = function() {
        function e(e) {
            this.communicator = e,
            this.setCustomerUserIdManager = new K(this.communicator),
            this.setEventManager = new B(this.communicator),
            this.initializeManager = new Q(this.communicator)
        }
        return e.prototype.initialize = function() {
            return this.initializeData()
        }
        ,
        e.prototype.isAvailable = function() {
            var e;
            return !!(null === (e = this.initialData) || void 0 === e ? void 0 : e.isAvailable)
        }
        ,
        e.prototype.setCustomerUserId = function(e) {
            this.setCustomerUserIdManager.addNew(e)
        }
        ,
        e.prototype.setEvent = function(e) {
            this.setEventManager.addNew(e)
        }
        ,
        e.prototype.parseMessage = function(e) {
            switch (e.event) {
            case A.InitialData:
                this.initializeManager.parseMessage(e);
                break;
            case A.SetCustomerUserId:
                this.setCustomerUserIdManager.parseMessage(e);
                break;
            case A.SetEvent:
                this.setEventManager.parseMessage(e);
                break;
            default:
                console.error("Unknown event", e.event)
            }
        }
        ,
        e.prototype.handleReceivedInitialData = function(e) {
            this.initialData = e
        }
        ,
        e.prototype.initializeData = function() {
            var e = this;
            return new Promise(function(t) {
                e.initializeManager.addNew({
                    callbacks: {
                        onReceived: function(a) {
                            e.handleReceivedInitialData(a),
                            t(!0)
                        }
                    }
                })
            }
            )
        }
        ,
        e
    }(), Y = function() {
        function e(e) {
            this.communicator = e,
            this.appsFlyer = new O(this.communicator),
            this.googleTag = new X(this.communicator)
        }
        return e.prototype.initialize = function() {
            return Promise.allSettled([this.appsFlyer.initialize(), this.googleTag.initialize()]).then(function(e) {
                return e.every(function(e) {
                    return "fulfilled" === e.status && e.status
                })
            })
        }
        ,
        e.prototype.parseMessage = function(e) {
            switch (e.submodule) {
            case v.AppsFlyer:
                this.appsFlyer.parseMessage(e);
                break;
            case v.GoogleTag:
                this.googleTag.parseMessage(e)
            }
        }
        ,
        e
    }();
    !function(e) {
        e.InitialData = "initial-data",
        e.RequestGoogleToken = "request-google-token"
    }(x || (x = {})),
    function(e) {
        e.RequestInitialData = "request-initial-data",
        e.RequestGoogleToken = "request-google-token"
    }(L || (L = {})),
    function(e) {
        e.Success = "success",
        e.Error = "error"
    }(W || (W = {}));
    var Z, ee, et, ea = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            switch (e.type) {
            case W.Success:
                this.handleSuccess(e);
                break;
            case W.Error:
                this.handleError(e)
            }
        }
        ,
        e.prototype.handleSuccess = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onSuccess) && this.data.callbacks.onSuccess(e.data.token),
            this.handleDestroy()
        }
        ,
        e.prototype.handleError = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onError) && this.data.callbacks.onError(e.data.error),
            this.handleDestroy()
        }
        ,
        e
    }(), en = function() {
        function e(e) {
            this.communicator = e,
            this.cycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.cycles.set(a, new ea(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.Auth,
                event: L.RequestGoogleToken,
                data: {
                    id: a
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.cycles.delete(e)
        }
        ,
        e
    }(), es = function() {
        function e(e, t) {
            this.data = e,
            this.handleDestroy = t
        }
        return e.prototype.parseMessage = function(e) {
            this.handleReceivedMessage(e)
        }
        ,
        e.prototype.handleReceivedMessage = function(e) {
            var t;
            (null === (t = this.data.callbacks) || void 0 === t ? void 0 : t.onReceived) && this.data.callbacks.onReceived(e.data.result),
            this.handleDestroy()
        }
        ,
        e
    }(), ei = function() {
        function e(e) {
            this.communicator = e,
            this.cycles = new Map
        }
        return e.prototype.addNew = function(e) {
            var t = this
              , a = Date.now();
            return this.cycles.set(a, new es(e,function() {
                return t.handleDestroyCycle(a)
            }
            )),
            this.communicator.postMessage({
                module: s.Auth,
                event: L.RequestInitialData,
                data: {
                    id: a
                }
            }),
            a
        }
        ,
        e.prototype.parseMessage = function(e) {
            this.cycles.has(e.data.id) && this.cycles.get(e.data.id).parseMessage(e)
        }
        ,
        e.prototype.handleDestroyCycle = function(e) {
            this.cycles.delete(e)
        }
        ,
        e
    }(), eo = function() {
        function e(e) {
            this.communicator = e,
            this.requestGoogleTokenManager = new en(this.communicator),
            this.initializeManager = new ei(this.communicator)
        }
        return e.prototype.initialize = function() {
            return this.initializeData()
        }
        ,
        e.prototype.isGoogleAvailable = function() {
            var e;
            return !!(null === (e = this.initialData) || void 0 === e ? void 0 : e.isGoogleAvailable)
        }
        ,
        e.prototype.requestGoogleToken = function(e) {
            this.requestGoogleTokenManager.addNew(e)
        }
        ,
        e.prototype.parseMessage = function(e) {
            switch (e.event) {
            case x.InitialData:
                this.initializeManager.parseMessage(e);
                break;
            case x.RequestGoogleToken:
                this.requestGoogleTokenManager.parseMessage(e)
            }
        }
        ,
        e.prototype.handleReceivedInitialData = function(e) {
            this.initialData = e
        }
        ,
        e.prototype.initializeData = function() {
            var e = this;
            return new Promise(function(t) {
                e.initializeManager.addNew({
                    callbacks: {
                        onReceived: function(a) {
                            e.handleReceivedInitialData(a),
                            t(!0)
                        }
                    }
                })
            }
            )
        }
        ,
        e
    }();
    (Z || (Z = {})).GameStep = "game-step",
    function(e) {
        e.LoadStarted = "load-started",
        e.Ready = "ready"
    }(ee || (ee = {}));
    var er = function() {
        function e(e) {
            this.communicator = e
        }
        return e.prototype.sendGameStep = function(e, t) {
            var a = "string" == typeof t ? parseInt(t) : t;
            this.communicator.postMessage({
                module: s.GameEvents,
                event: Z.GameStep,
                data: {
                    id: Date.now(),
                    step: e,
                    timestamp: a
                }
            })
        }
        ,
        e
    }()
      , ec = function() {
        function e() {
            this.communicator = new z(this.parseMessage.bind(this)),
            this.communicator.initialize(),
            this.global = new f(this.communicator),
            this.adv = new R(this.communicator),
            this.eventTracker = new Y(this.communicator),
            this.auth = new eo(this.communicator),
            this.gameEvents = new er(this.communicator)
        }
        return e.prototype.communicationEstablished = function() {
            var e, t, a, n;
            return e = this,
            t = void 0,
            n = function() {
                var e = this;
                return function(e, t) {
                    var a, n, s, i = {
                        label: 0,
                        sent: function() {
                            if (1 & s[0])
                                throw s[1];
                            return s[1]
                        },
                        trys: [],
                        ops: []
                    }, o = Object.create(("function" == typeof Iterator ? Iterator : Object).prototype);
                    return o.next = r(0),
                    o.throw = r(1),
                    o.return = r(2),
                    "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                        return this
                    }
                    ),
                    o;
                    function r(r) {
                        return function(c) {
                            return function(r) {
                                if (a)
                                    throw TypeError("Generator is already executing.");
                                for (; o && (o = 0,
                                r[0] && (i = 0)),
                                i; )
                                    try {
                                        if (a = 1,
                                        n && (s = 2 & r[0] ? n.return : r[0] ? n.throw || ((s = n.return) && s.call(n),
                                        0) : n.next) && !(s = s.call(n, r[1])).done)
                                            return s;
                                        switch (n = 0,
                                        s && (r = [2 & r[0], s.value]),
                                        r[0]) {
                                        case 0:
                                        case 1:
                                            s = r;
                                            break;
                                        case 4:
                                            return i.label++,
                                            {
                                                value: r[1],
                                                done: !1
                                            };
                                        case 5:
                                            i.label++,
                                            n = r[1],
                                            r = [0];
                                            continue;
                                        case 7:
                                            r = i.ops.pop(),
                                            i.trys.pop();
                                            continue;
                                        default:
                                            if (!((s = (s = i.trys).length > 0 && s[s.length - 1]) || 6 !== r[0] && 2 !== r[0])) {
                                                i = 0;
                                                continue
                                            }
                                            if (3 === r[0] && (!s || r[1] > s[0] && r[1] < s[3])) {
                                                i.label = r[1];
                                                break
                                            }
                                            if (6 === r[0] && i.label < s[1]) {
                                                i.label = s[1],
                                                s = r;
                                                break
                                            }
                                            if (s && i.label < s[2]) {
                                                i.label = s[2],
                                                i.ops.push(r);
                                                break
                                            }
                                            s[2] && i.ops.pop(),
                                            i.trys.pop();
                                            continue
                                        }
                                        r = t.call(e, i)
                                    } catch (c) {
                                        r = [6, c],
                                        n = 0
                                    } finally {
                                        a = s = 0
                                    }
                                if (5 & r[0])
                                    throw r[1];
                                return {
                                    value: r[0] ? r[1] : void 0,
                                    done: !0
                                }
                            }([r, c])
                        }
                    }
                }(this, function(t) {
                    switch (t.label) {
                    case 0:
                        return [4, Promise.all([this.global.isConnectedToParent.then(function(t) {
                            return t || e.logMessage(["could not connect to parent"]),
                            t
                        }), this.global.isParentModulesInitialized.then(function(t) {
                            return t || e.logMessage(["parent modules was not initialized"]),
                            t
                        }), ]), ];
                    case 1:
                        return t.sent().every(Boolean) ? [2, this.initializeModules().then(function() {
                            return !0
                        }), ] : [2, !1]
                    }
                })
            }
            ,
            new (a = void 0,
            a = Promise)(function(s, i) {
                function o(e) {
                    try {
                        c(n.next(e))
                    } catch (t) {
                        i(t)
                    }
                }
                function r(e) {
                    try {
                        c(n.throw(e))
                    } catch (t) {
                        i(t)
                    }
                }
                function c(e) {
                    var t;
                    e.done ? s(e.value) : ((t = e.value)instanceof a ? t : new a(function(e) {
                        e(t)
                    }
                    )).then(o, r)
                }
                c((n = n.apply(e, t || [])).next())
            }
            )
        }
        ,
        e.prototype.initialize = function() {
            this.logMessage(["initialize"])
        }
        ,
        e.prototype.destroy = function() {
            this.logMessage(["destroy"]),
            this.communicator.destroy()
        }
        ,
        e.prototype.parseMessage = function(e) {
            switch (e.module) {
            case s.Global:
                this.global.parseMessage(e);
                break;
            case s.Adv:
                this.adv.parseMessage(e);
                break;
            case s.EventTracker:
                this.eventTracker.parseMessage(e);
                break;
            case s.Auth:
                this.auth.parseMessage(e)
            }
        }
        ,
        e.prototype.initializeModules = function() {
            return this.logMessage(["initialize modules"]),
            Promise.allSettled([this.adv.initialize(), this.eventTracker.initialize(), this.auth.initialize()])
        }
        ,
        e.prototype.logMessage = function(e, t) {
            void 0 === t && (t = console.log),
            t.apply(void 0, function(e, t, a) {
                if (a || 2 === arguments.length)
                    for (var n, s = 0, i = t.length; s < i; s++)
                        !n && s in t || (n || (n = Array.prototype.slice.call(t, 0, s)),
                        n[s] = t[s]);
                return e.concat(n || Array.prototype.slice.call(t))
            }(["%cMelWebSdk", r], e, !1))
        }
        ,
        e
    }();
    if (console.log("%cgame-sdk-script", r, "started"),
    window.parent) {
        var el = new ec;
        console.log("%cgame-sdk-script", r, "check initialization"),
        el.communicationEstablished().then(function(e) {
            e ? (console.log("%cgame-sdk-script", r, "assign window"),
            Object.assign(window, {
                MelWebSdk: el
            })) : console.log("%cgame-sdk-script", r, "loading failed")
        }).catch(function() {
            console.log("%cgame-sdk-script", r, "loading failed")
        })
    } else
        console.log("%cgame-sdk-script", r, "failed: no parent found")
}
)();
