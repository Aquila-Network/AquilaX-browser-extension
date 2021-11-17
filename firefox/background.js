const aquilaUrl = 'https://x.aquila.network';
const defaultHost = 'http://localhost';

browser.runtime.onInstalled.addListener(function(details) {
    if(details.reason == "install"){
        //handle a first install
        browser.tabs.create({ url: `${aquilaUrl}/next.html` });
    }else if(details.reason == "update"){
        //handle an update
        browser.tabs.create({ url: `${aquilaUrl}/updates.html` });
    }
    browser.storage.sync.set({axapi: { host: defaultHost, isURL: true }});
});

// This event is fired with the user accepts the input in the omnibox.
browser.omnibox.onInputEntered.addListener((text) => {
    // Encode user input for special characters , / ? : @ & = + $ #
    browser.storage.sync.get("axapi", function(data) {
        let newURL = `${aquilaUrl}/?q=${encodeURIComponent(text)}`;
        if (data.axapi.isURL) {
            newURL = `${data.axapi.host}?q=${encodeURIComponent(text)}`;
        }
        browser.tabs.update({ url: newURL });
    });
});

browser.runtime.onMessageExternal.addListener(
    function(message, sender, sendResponse) {
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