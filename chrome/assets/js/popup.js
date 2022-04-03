(function() {
    const axHost = 'https://x.aquila.network/api/index';
    const status = {
        loading: false,
        isError: false,
        message: ''
    };
    const isValidUrl = str => (new RegExp('^(https?:\\/\\/)?'+ // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))|'+ // OR ip (v4) address
                'localhost'+ // OR localhost
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                '(\\#[-a-z\\d_]*)?$','i')).test(str); // fragment locator

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

    const getCurrentTab = async () => {
        const queryOptions = { active: true, currentWindow: true};
        const [tab] = await chrome.tabs.query(queryOptions);
        return tab;
    }
    

    const init = () => {
        const settingsForm = document.querySelector('#settings_form');
        const infoArea = document.querySelector('#info_area');
        const editSettingsLink = document.querySelector('#edit_settings_link')
        const cancelEditSettingsBtn = document.querySelector('#cancel_settings_btn');
        const indexSubmitBtn = document.querySelector('#index_submit_btn');
        const messageBox = document.querySelector('#message_box');
        const infoAreaHostValue = document.querySelector("#info_area_host_value");
        const settingsFormApiKey = document.querySelector("#settings_form_api_key");
        const settingsFormHost = document.querySelector("#settings_form_host");
        const updateSettingsBtn = document.querySelector('#update_settings_btn');
    
        getChromeStoreageData("axapi").then( data => {
            settingsFormHost.value = data.axapi.host || axHost;
            settingsFormApiKey.value = data.axapi.apiKey || '';
            infoAreaHostValue.textContent = data.axapi.host || axHost;
        });

        // register events
        cancelEditSettingsBtn.addEventListener('click', () => {
            settingsForm.classList.add('hide');
            infoArea.classList.remove('hide');
        });

        editSettingsLink.addEventListener('click', () => {
            settingsForm.classList.remove('hide');
            infoArea.classList.add('hide');
        });

        updateSettingsBtn.addEventListener('click', () => {
            const host = settingsFormHost.value || '';
            const apiKey = settingsFormApiKey.value || '';
            const data = {
                host: host,
                apiKey: apiKey
            }
            chrome.storage.sync.set({axapi: data});
            infoAreaHostValue.textContent = host;
            status.message = 'Settings updated';
            showMessage();
            settingsForm.classList.add('hide');
            infoArea.classList.remove('hide');
        });

        indexSubmitBtn.addEventListener('click', async () => {
            indexSubmitBtn.disabled = true;
            status.loading = true;
            status.message = '';
            status.isError = false;
            showMessage();
            let result;
            let reqUrl = axHost;
            try {
                const axApiData = await getChromeStoreageData('axapi');
                reqUrl = axApiData.axapi.host || axHost;
                const tab = await getCurrentTab();
                const dataFromPage = await chrome.scripting.executeScript({
                    target: { tabId: tab.id},
                    function: () =>  ({ html: `<html>${document.documentElement.innerHTML}</html>`, url: document.location.href })
                });
                result = dataFromPage[0].result;
                if(axApiData.axapi.apiKey) {
                    result.key = axApiData.axapi.apiKey;
                }
            }catch(e) {
                indexSubmitBtn.disabled = false;
                status.loading = false;
                status.message = 'Something went wrong';
                status.isError = true;
                showMessage();
                return;
            }
            try {
                const response = await fetch(reqUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(result)
                });
                const responseData = await response.json();
                if(responseData.success === true) {
                    indexSubmitBtn.disabled = false;
                    status.loading = false;
                    status.message = 'Indexed Successfully';
                    status.isError = false;
                    showMessage();
                }
            }catch(e) {
                indexSubmitBtn.disabled = false;
                status.loading = false;
                status.message = e.message;
                status.isError = true;
                showMessage();
                return;
            }
            
        });

        const showMessage = () => {
            const { message, loading, isError } = status;
            if(isError) {
                messageBox.classList
                    .add('message-box--danger');
                messageBox.classList
                    .remove('message-box--success');
                messageBox.classList
                    .remove('message-box--primary');
            }else if(!isError && loading) {
                messageBox.classList
                    .add('message-box--primary');
                    messageBox.classList
                    .remove('message-box--success');
                    messageBox.classList
                    .remove('message-box--danger');
            }else {
                messageBox.classList
                    .add('message-box--success');
                    messageBox.classList
                    .remove('message-box--danger');
                    messageBox.classList
                    .remove('message-box--primary');
            }
            if(message) {
                messageBox.innerHTML = `<p>${message}</p>`;
                messageBox.classList.remove('hide');
            }else if(loading) {
                messageBox.innerHTML = `<p>Loading...</p>`;
                messageBox.classList.remove('hide');
            }else {
                messageBox.classList.add('hide');
            }
            if(!loading) {
                setTimeout(() => {
                    messageBox.innerHTML = '';
                    messageBox.classList.add('hide');
                }, 5000);
            }
        }
    }

    window.onload = function(){
        init();
    }
})();