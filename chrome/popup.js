let hostInput = document.getElementById("hostInput");
let indexPage = document.getElementById("indexPage");
let apiError = document.getElementById("apiError");

window.onload = function() {
    chrome.storage.sync.get("axapi", function(data) {
        hostInput.value = data.axapi.host;
    });
};

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

indexPage.onclick = function() {
    // update api url
    chrome.storage.sync.set({axapi: { "host": hostInput.value, "isURL": validURL(hostInput.value) }});

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
