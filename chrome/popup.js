let hostInput = document.getElementById("hostInput");
let indexPage = document.getElementById("indexPage");
let apiError = document.getElementById("apiError");

window.onload = function() {
    chrome.storage.sync.get("axapi", function(data) {
        hostInput.value = data.axapi.host;
    });
};

indexPage.onclick = function() {
    apiError.innerHTML = "Opps.. Something went wrong!"
};
