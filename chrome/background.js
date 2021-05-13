chrome.runtime.onInstalled.addListener(function(details) {
    if(details.reason == "install"){
        //handle a first install
        chrome.tabs.create({ url: "https://x.aquila.network/next" });
    }else if(details.reason == "update"){
        //handle an update
        chrome.tabs.create({ url: "https://x.aquila.network/next" });
    }

    chrome.storage.sync.set({axapi: { "host": "http://localhost:5000", "isURL": true }});
});

// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener((text) => {
    // Encode user input for special characters , / ? : @ & = + $ #
    chrome.storage.sync.get("axapi", function(data) {
        var newURL = "https://x.aquila.network/" + "?q=" + encodeURIComponent(text);
        if (data.axapi.isURL) {
            newURL = data.axapi.host + "?q=" + encodeURIComponent(text);
        }
        chrome.tabs.update({ url: newURL });
    });
});

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        chrome.storage.sync.get("axapi", function(data) {
            if (data.axapi.isURL) {
                sendResponse({
                    message: "No API key",
                    success: false
                });
            } else {
                sendResponse({
                    key: data.axapi.host,
                    message: "Found API key",
                    success: true
                });
            }
        });
});

chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
                schemes: ['http', 'https']
            },
        })],
        actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
});