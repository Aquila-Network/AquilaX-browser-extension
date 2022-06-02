const aquilaUrl = 'https://x.aquila.network';
const defaultHost = 'https://x.aquila.network';

async function showMessageInWebPage(msgObj, tabId) { 
    await chrome.scripting.executeScript({
        args: [msgObj],
        target: { tabId },
        function: (msgObj) => {
            if(!window.aquilaShowMessageTimeout) {
                window.aquilaShowMessageTimeout = null;
            }else if( window.aquilaShowMessageTimeout) {
                clearTimeout(window.aquilaShowMessageTimeout);
                window.aquilaShowMessageTimeout = null;
            }
            let msgThemeColor = "#0d6efd";
            if(msgObj.type === 'success' ) {
                msgThemeColor = "#198753";
            }else if(msgObj.type === 'error') {
                msgThemeColor = "#c62f3d";
            }
            // remove container div if exists
            if(document.getElementById("bookmark_msg_container")) {
                document.getElementById("bookmark_msg_container").remove();
            }
            debugger;
            const containerDiv = document.createElement("div");
            containerDiv.id = 'bookmark_msg_container';
            containerDiv.style.position = 'fixed';
            containerDiv.style.top = "10px";
            containerDiv.style.left = "50%";
            containerDiv.style.marginLeft = "-125px"
            containerDiv.style.border = "1px solid #ddd";
            containerDiv.style.width = "250px";
            containerDiv.style.background = "#fff";
            containerDiv.style.padding = "8px 5px";
            containerDiv.style.boxSizing = "border-box";
            containerDiv.style.borderRadius = "4px";
            containerDiv.style.fontFamily = "sans-serif";
            containerDiv.style.boxShadow = "0px 2px 4px 0px rgba(0,0,0,0.43)";
            containerDiv.style.zIndex = "2147483647";

            const h1Elm = document.createElement("h1");
            h1Elm.innerHTML = "Aquila Network";
            h1Elm.style.fontSize = "14px";
            h1Elm.style.color = "#424242";
            h1Elm.style.fontFamily = "sans-serif";
            h1Elm.style.textAlign = "center";
            h1Elm.style.margin = "0px 0px 5px 0px";
            h1Elm.style.border = "none";

            containerDiv.appendChild(h1Elm);

            const para = document.createElement("p");
            para.style.margin = "0px";
            para.style.fontSize = "12px";
            para.style.textAlign = "center";
            para.style.color = msgThemeColor;
            para.innerHTML = msgObj.message;

            containerDiv.appendChild(para);

            document.body.appendChild(containerDiv);

            // setTimeout(() => {
            //     document.getElementById("bookmark_msg_container").remove();
            //     clearTimeout(window.aquilaShowMessageTimeout)
            //     window.aquilaShowMessageTimeout = null;
            // }, 4000);
        }
    })

}

const getChromeStoreageData = (key) => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, (data) => {
            if(data) {
                resolve(data);
            }else {
                reject(chrome.runtime.lastError);
            }
        })
    })
}

chrome.runtime.onInstalled.addListener(function(details) {
    if(details.reason == "install"){
        //handle a first install
        chrome.tabs.create({ url: `${aquilaUrl}/next.html` });
    }else if(details.reason == "update"){
        //handle an update
        chrome.tabs.create({ url: `${aquilaUrl}/updates.html` });
    }
    chrome.storage.sync.set({axapi: { host: defaultHost, isURL: true }});
});

// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener((text) => {
    // Encode user input for special characters , / ? : @ & = + $ #
    chrome.storage.sync.get("axapi", function(data) {
        let newURL = `${aquilaUrl}/?q=${encodeURIComponent(text)}`;
        if (data.axapi.isURL) {
            newURL = `${data.axapi.host}?q=${encodeURIComponent(text)}`;
        }
        chrome.tabs.update({ url: newURL });
    });
});

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        chrome.storage.sync.get("axapi", function(data) {
            if (data.axapi.host && data.axapi.apiKey) {
                sendResponse({
                    apiKey: data.axapi.apiKey,
                    host: data.axapi.host,
                    message: "Found API key",
                    success: true
                });
            } else {
                sendResponse({
                    message: "No API key",
                    success: false
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

chrome.commands.onCommand.addListener(async (command, tab) => {
    debugger;
    if(command !== 'index-page') {
        return;;
    }

    // check user has a secret key
    let axApiData;
    try {
        axApiData = await getChromeStoreageData('axapi');
    }catch(e) {
        showMessageInWebPage({ message: "Failed to fetch Aquila Secret key", type: 'error'}, tab.id);
        return;
    }

    if(!axApiData.axapi.secretKey) {
        showMessageInWebPage({ message: "Indexing failed. Please update your secret key", type: 'error'}, tab.id);
        return;
    }

    // collect html and url from current page
    const pageData = await chrome.scripting.executeScript({
        target: { tabId: tab.id},
        function: () =>  ({ html: `<html>${document.documentElement.innerHTML}</html>`, url: document.location.href })
    });

    const apiData = pageData[0].result;
    apiData.key = axApiData.axapi.secretKey;

    await showMessageInWebPage({message: 'Indexing...'}, tab.id);
    // index the page
    try {
        const response = await fetch(`${axApiData.axapi.host}/api/index`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pageData[0].result)
        });
        const responseData = await response.json();
        if(responseData.success === true) {
            await showMessageInWebPage({message: 'Indexed successfully', type: 'success'}, tab.id);
        }
    }catch(e) {
        await showMessageInWebPage({message: 'Indexing failed', type: 'error'}, tab.id);
    }

});