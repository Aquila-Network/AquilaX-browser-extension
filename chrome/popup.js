let hostInput = document.getElementById("hostInput");
let indexPage = document.getElementById("indexPage");
let apiError = document.getElementById("apiError");

window.onload = function() {
    chrome.storage.sync.get("axapi", function(data) {
        hostInput.value = data.axapi.host;
    });
};

indexPage.onclick = function() {
    // update api url
    chrome.storage.sync.set({axapi: { "host": hostInput.value }});

    apiError.innerHTML = "Processing.."
    // get page html
    function getDOM() {
        //You can play with your DOM here or check URL against your regex
        return document.body.innerHTML;
    }
    // execute getDOM script in selected tab
    chrome.tabs.executeScript({
        code: '(' + getDOM + ')();'
    }, (results) => {
        chrome.tabs.getSelected(null,function(tab) {
            mkRequest(results[0], tab.url);
        });
    });
    
    apiError.innerHTML = "Indexing.."
    function mkRequest(bodyHTML, url) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", hostInput.value+"index", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            if (xhr.status === 200) {
                apiError.innerHTML = "Success."
            } else {
                apiError.innerHTML = "Opps.. Something went wrong!"
            }
        };
        xhr.send(JSON.stringify({
            "html": bodyHTML,
            "url": url
        }));
    }
};
