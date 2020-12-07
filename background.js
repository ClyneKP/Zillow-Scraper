/*!
 * Web Sniffer v0.0.0.2 (https://5ms.ru/sniffer/)
 * Copyright 2018, 5MS
 * Licensed under MIT (http://en.wikipedia.org/wiki/MIT_License)
 */


var tabExt = null,
	port = null;

chrome.browserAction.onClicked.addListener(function() {

	if (tabExt != null) {

		chrome.tabs.update(tabExt.id, {selected: true});
		chrome.windows.update(tabExt.windowId, {focused: true});

		return false;
	}

	chrome.browserAction.setBadgeText({text: "run"});
	chrome.browserAction.setTitle({title: "Open Web Sniffer"});

	chrome.tabs.create({url:chrome.extension.getURL("index.html")}, function(tab) {

		tabExt = tab;

		var onBeforeSendHeaders_callback = function(details) {

				 myRe = new RegExp('GetSearchPageState')
            	if (myRe.test(details.url) == true){
	                myOtherRe = new RegExp('70460277')
	                if (myOtherRe.test(details.url) != true){
	                console.log("SendHeaders")
	                console.log("We're in")

					port.postMessage({Type: 'SendHeaders', Details: details});
					return {};
					}
				}
		},
			onErrorOccurred_callback = function(details) {
				port.postMessage({Type: 'ErrorOccurred', Details: details});
				return {};
			},
			onUpdated_callback = function(tabId, changeInfo, tab) {

				if (changeInfo.status == "complete" && tab.id == tabExt.id) {
					port = chrome.tabs.connect(tab.id);
				}
			},
			onRemoved_callback = function(tabId) {

				if (tabId == tabExt.id) {

					tabExt = null;

					//chrome.tabs.remove(tabId);

					
					chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders_callback);
					chrome.webRequest.onErrorOccurred.removeListener(onErrorOccurred_callback);
					chrome.tabs.onUpdated.removeListener(onUpdated_callback);
					chrome.tabs.onRemoved.removeListener(onRemoved_callback);

					chrome.browserAction.setBadgeText({text: ""});
					chrome.browserAction.setTitle({title: "Start Web Sniffer"});
				}
			};

		chrome.tabs.onUpdated.addListener(onUpdated_callback);
		chrome.tabs.onRemoved.addListener(onRemoved_callback);


		chrome.webRequest.onBeforeSendHeaders.addListener(
			onBeforeSendHeaders_callback,
			{urls: ["<all_urls>"]},
			["blocking", "requestHeaders"]
		);


		chrome.webRequest.onErrorOccurred.addListener(
			onErrorOccurred_callback,
			{urls: ["<all_urls>"]}
		);

	});

	return {};
});

