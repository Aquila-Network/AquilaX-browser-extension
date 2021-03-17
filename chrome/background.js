chrome.runtime.onInstalled.addListener(function(details) {
    if(details.reason == "install"){
        //handle a first install
        chrome.tabs.create({ url: "https://aquila.network" });
    }else if(details.reason == "update"){
        //handle an update
        chrome.tabs.create({ url: "https://aquila.network" });
    }

    chrome.storage.sync.set({axapi: { "host": "http://localhost:5000/"}});
});

chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
                schemes: ['https']
            },
        })],
        actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
});