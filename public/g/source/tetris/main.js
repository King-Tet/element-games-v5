document.addEventListener('DOMContentLoaded', function() {
if (window.didLoad_main) return;
window.didLoad_main = true;
	
var isIFrame = window.frameElement && (window.frameElement.nodeName == "IFRAME");
if (false) {
	window.location.replace(window.location.protocol + "//" + window.location.hostname);
} else {
	var pageStartTimeMSEC = Date.now();
	var cbidg = "95E058F4F41717D2";
	var gameDiv = document.getElementById("GameDiv");
	var gameCanvas = document.getElementById("GameCanvas");	
	var gameAxDivContainer = document.getElementById("gameAxDivContainer");	
	var _isGameAreaAdActive = false;

	var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
		(navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && window.screen.width <= 1024);

	var isAFGHTML5EnabledOnMobile = true;
	var isAFGHTML5Enabled = isMobile ? isAFGHTML5EnabledOnMobile && true : true;
	
	//----------------------------------------------------------------

	if (isAFGHTML5Enabled) {
		window.axGAFGHTML_didOnReadyTimeout = false;
		onReadyElapsedTimeSEC = 0;
		var onReadyTimeoutInterval = setInterval(function () {
			onReadyElapsedTimeSEC++;
			var onReadyTimeoutLimitSEC = 5;
			var isReady;
			if (false) {
				isReady = ((onReadyElapsedTimeSEC > onReadyTimeoutLimitSEC))
			}
			else {
				isReady = ((onReadyElapsedTimeSEC > onReadyTimeoutLimitSEC) && window.mBPSApp)
			}
			if (isReady) {
				clearInterval(onReadyTimeoutInterval);
				_isGameAreaAdActive = true;
				axGAFGHTML5_onReadyTimeout();
			}
		}, 1000);
	
		window.adsbygoogle = window.adsbygoogle || [];
		var adBreak = adConfig = function (o) { adsbygoogle.push(o); }
		adConfig({
			preloadAdBreaks: 'on',
			onReady: () => {
				clearInterval(onReadyTimeoutInterval);
				if (!window.axGAFGHTML_didOnReadyTimeout) {
					showGameAreaAd('preroll');
				}
			}
		});
	}
	else {
		_isGameAreaAdActive = true;
		onGameAreaAdComplete();
	}

	//----------------------------------------------------------------
			
	if (false) {
		function UnityProgress(gameInstance, progress) {
			if (progress == 1) {
				removeLoadingDisplay();
			}
		}
		var UnityGameInstance = UnityLoader.instantiate("GameDiv", "%UNITY_WEBGL_BUILD_URL%", { onProgress: UnityProgress });
	}

	//----------------------------------------------------------------

	function openURL(pURL, pTargetNewWindow) { /* NOP */ }
	window.openURL = openURL;

	function getPageElapsedTimeMSEC() { return 0; }
	window.getPageElapsedTimeMSEC = getPageElapsedTimeMSEC;

	function TGREAIGRIMZPFHREXNXJUMGJNGRPCNDK() { return 0; }
	window.TGREAIGRIMZPFHREXNXJUMGJNGRPCNDK = TGREAIGRIMZPFHREXNXJUMGJNGRPCNDK;

	function PCDFCJSRUMBRFNRKJOJKWNSJNMNFONFLPFTKYSBKDT() { return 999999999; }
	window.PCDFCJSRUMBRFNRKJOJKWNSJNMNFONFLPFTKYSBKDT = PCDFCJSRUMBRFNRKJOJKWNSJNMNFONFLPFTKYSBKDT;

	function getCBID() { return cbidg; }
	window.getCBID = getCBID;

	function getGameDiv() { return gameDiv ? gameDiv : document.getElementById("GameDiv"); }
	window.getGameDiv = getGameDiv;

	function getGameCanvas() { return gameCanvas ? gameCanvas : document.getElementById("GameCanvas"); }
	window.getGameCanvas = getGameCanvas;

	function getCurrentYear() { return new Date().getFullYear(); }
	window.getCurrentYear = getCurrentYear;

	function gameLoadingSceneIsReady() { removeLoadingDisplay(); }
	window.gameLoadingSceneIsReady = gameLoadingSceneIsReady;

	function removeLoadingDisplay() {
		try {
			var loadingText = document.getElementById('loadingText');
			if (loadingText) { loadingText.parentNode.removeChild(loadingText); }
			var loadingDisplay = document.getElementById('loadingDisplay');
			if (loadingDisplay) { loadingDisplay.parentNode.removeChild(loadingDisplay); }
		} catch (e) { }
	}
	window.removeLoadingDisplay = removeLoadingDisplay;

	// ----------------------------------------------------------------

	function trackGUAEvent(category, action, opt_label, opt_value, opt_noninteraction) { /* NOP */ }
	window.trackGUAEvent = trackGUAEvent;
	
	if (true) {
		function trackGA4PageEvent(pEventName, pParameters) { trackGA4Event(pEventName, pParameters); }
		function trackGA4GameEvent(pEventName, pParameters) { trackGA4Event(pEventName, pParameters); }
	} else if (false) {
		function trackGA4PageEvent(pEventName, pParameters) { trackGA4Event(pEventName, JSON.parse(pParameters)); }
		function trackGA4GameEvent(pEventName, pParameters) { trackGA4Event(pEventName, JSON.parse(pParameters)); }
	}
	window.trackGA4PageEvent = trackGA4PageEvent;
	window.trackGA4GameEvent = trackGA4GameEvent;

	function trackGA4Event(pEventName, pParameters) {
		if (true) {
			try {
				var eventOrigin = 'tetris';
				pParameters['event_origin'] = eventOrigin;
				pParameters['event_url'] = window.location.href;
				gtag('event', pEventName, pParameters);
			} catch (e) {}
		}
	}
	window.trackGA4Event = trackGA4Event;

	// ----------------------------------------------------------------

	function setGameDivContainerIsVisible( pIsVisible ) {
		gameDiv.style.display = pIsVisible ? "flex" : "none";
	}
	window.setGameDivContainerIsVisible = setGameDivContainerIsVisible;
	
	function setGameAxDivContainerIsVisible( pIsVisible ) {
		if (gameAxDivContainer == null) { return; }
		gameAxDivContainer.style.display = pIsVisible ? "flex" : "none";
	}
	window.setGameAxDivContainerIsVisible = setGameAxDivContainerIsVisible;

	// ----------------------------------------------------------------

	var lastAdRefreshOnActionTimeSEC = Date.now() / 1000;
	var lastAdRefreshOnTimeIntervalTimeSEC = Date.now() / 1000;

	function refreshAds(pTrigger = 'GameStarted', pAdSlotIndex = -1) {
		if (!canRefreshAds(pTrigger)) { return; }

		try {
			if (pAdSlotIndex < 0)
			{
				window.parent.googletag.pubads().refresh();
			}
			else
			{
				// window.parent.googletag.pubads().refresh(FIXME);
			}
		} catch (e) {}

		switch (pTrigger)
		{
			case 'GameOverExited':
			case 'GamePaused': 
			case 'GameUnpaused': 
				lastAdRefreshOnActionTimeSEC = Date.now() / 1000;
				break;
			case 'TimeInterval':
				lastAdRefreshOnTimeIntervalTimeSEC = Date.now() / 1000;
				break;
		}	
	}
	window.refreshAds = refreshAds;

	function canRefreshAds(pTrigger = 'GameStarted')
	{
		switch (pTrigger)
		{
			case 'GameOverExited':
			case 'GamePaused': 
			case 'GameUnpaused': 
				if (((Date.now() / 1000) - lastAdRefreshOnActionTimeSEC) < 60) { return false; }
				break;
			case 'TimeInterval':
				if (((Date.now() / 1000) - lastAdRefreshOnTimeIntervalTimeSEC) < 60) { return false; }
				break;
		}
		switch (pTrigger)
		{
			case 'GameOverExited': return true;
			case 'GamePaused': return true;
			case 'GameUnpaused': return true;
			case 'TimeInterval': return false;
			default: return false;
		}
	}
	window.canRefreshAds = canRefreshAds;

	function isGameAreaAdEnabled() { return isAFGHTML5Enabled; }
	window.isGameAreaAdEnabled = isGameAreaAdEnabled;

	function isGameAreaAdActive() { return _isGameAreaAdActive; }
	window.isGameAreaAdActive = isGameAreaAdActive;

	function showGameAreaAd(pType = 'next') {
		if (isAFGHTML5Enabled) {
			try {
				switch (pType) {
					case 'preroll':
						_isGameAreaAdActive = true;
						adBreak({
							type: pType,
							name: 'AD_NAME',
							adBreakDone: axGAFGHTML5_axBreakDone
						});
						break;
					case 'next':
					default:
						_isGameAreaAdActive = true;
						adBreak({
							type: pType,
							name: 'AD_NAME',
							beforeAd: axGAFGHTML5_beforeAx,
							afterAd: axGAFGHTML5_afterAx,
							adBreakDone: axGAFGHTML5_axBreakDone
						});
						break;
					}
			} catch (e) {
				_isGameAreaAdActive = true;
				onGameAreaAdComplete();
			}
		}
		else {
			_isGameAreaAdActive = true;
			onGameAreaAdComplete();
		}
	}
	window.showGameAreaAd = showGameAreaAd;

	function onGameAreaAdComplete() {
		if ( !_isGameAreaAdActive ) { return; }

		// document.activeElement.blur( );
		
		while ( gameAxDivContainer && gameAxDivContainer.lastChild ) { gameAxDivContainer.removeChild(gameAxDivContainer.lastChild); }

		setGameDivContainerIsVisible( true );
		setGameAxDivContainerIsVisible( false );
		_isGameAreaAdActive = false;
		
		var onGameAreaAdCompleteInterval = setInterval(function () {
			try {
				if (true) {
					if (window.mBPSApp) {
						clearInterval(onGameAreaAdCompleteInterval);
						removeLoadingDisplay();
						window.mBPSApp.dispatchAppMessage(979287055);
					}
				} else if (false) {
					UnityGameInstance.SendMessage("BPSTUWPI", "dispatchMessage", "979287055");
					clearInterval(onGameAreaAdCompleteInterval);
				}  						 
			} catch (e) { }
		}, 100);
	}
	window.onGameAreaAdComplete = onGameAreaAdComplete;
	
	//----------------------------------------------------------------	
	//-- GAFGHTML5:

	function axGAFGHTML5_beforeAx() { }

	function axGAFGHTML5_afterAx() { }

	function axGAFGHTML5_axBreakDone(pPlacementInfo) {
		switch (pPlacementInfo.breakStatus) {
			case "timeout":
				trackGUAEvent("Game Page", "ads_google_h5", "system_timeout", 0, true);
				trackGA4PageEvent("ads_google_h5__system_timeout", {});
				break;

			case "dismissed":
				trackGUAEvent("Game Page", "ads_google_h5", "ad_skipped", 0, true);
				trackGA4PageEvent("ads_google_h5__ad_skipped", {});
				break;

			case "viewed":
				trackGUAEvent("Game Page", "ads_google_h5", "ad_complete", 0, true);
				trackGA4PageEvent("ads_google_h5__ad_complete", {});
				break;

			default:
				trackGUAEvent("Game Page", "ads_google_h5", "no_ad_delivered", 0, true);
				trackGA4PageEvent("ads_google_h5__no_ad_delivered", {});
				break;
		}
		onGameAreaAdComplete();
	}

	function axGAFGHTML5_onReadyTimeout() {
		trackGUAEvent("Game Page", "ads_google_h5", "system_timeout", 0, true);
		trackGA4PageEvent("ads_google_h5__system_timeout", {});
		axGAFGHTML_didOnReadyTimeout = true;
		onGameAreaAdComplete();
	}

	//----------------------------------------------------------------				

}	

});

