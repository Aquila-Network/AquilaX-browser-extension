(function() {
    const apiUrl = 'https://x.aquila.network/api/index';
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

    const getStoreageData = (key) => {
        const result = browser.storage.sync.get(key);
        return result;
    }

    const setStorageData = (key, data) => {
        const dataToStore  = {}
        dataToStore[key] = data;
        const result = browser.storage.sync.set(dataToStore);
        return result;
    }

    const getCurrentTab = async () => {
        const tab = await browser.tabs.query({currentWindow: true, active: true})
        return tab[0];
    }
    

    const init = () => {
        const settingsForm = document.querySelector('#settings_form');
        const indexForm = document.querySelector('#index_form');
        const editSettingsLink = document.querySelector('#edit_settings_link')
        const cancelEditSettingsBtn = document.querySelector('#cancel_settings_btn');
        const indexSubmitBtn = document.querySelector('#index_submit_btn');
        const messageBox = document.querySelector('#message_box');
        const indexFormHostOrApi = document.querySelector('#index_form_host_or_api');
        const settingsFormHostOrApi = document.querySelector('#settings_form_host_or_api');
        const updateSettingsBtn = document.querySelector('#update_settings_btn');
        let hostOrApi = '';
    
        getStoreageData("axapi").then( data => {
            if(data.axapi) {
                hostOrApi = data.axapi.host;
                settingsFormHostOrApi.value = hostOrApi;
                indexFormHostOrApi.value = hostOrApi;
            }
        });

        // register events
        cancelEditSettingsBtn.addEventListener('click', () => {
            settingsForm.classList.add('hide');
            indexForm.classList.remove('hide');
        });

        editSettingsLink.addEventListener('click', () => {
            settingsForm.classList.remove('hide');
            indexForm.classList.add('hide');
        });

        updateSettingsBtn.addEventListener('click', async () => {
            const apiOrHost = settingsFormHostOrApi.value;
            const data = {
                isURL: isValidUrl(apiOrHost),
                host: apiOrHost
            }
            let result;
            await setStorageData('axapi', data);
            indexFormHostOrApi.value = apiOrHost;
            status.message = 'Settings updated';
            showMessage();
            settingsForm.classList.add('hide');
            indexForm.classList.remove('hide');
        });

        indexSubmitBtn.addEventListener('click', async () => {
            indexSubmitBtn.disabled = true;
            status.loading = true;
            status.message = '';
            status.isError = false;
            showMessage();
            let result;
            let reqUrl = apiUrl;
            try {
                const axApiData = await getStoreageData('axapi');
                reqUrl = isValidUrl(axApiData.axapi.host)? `${axApiData.axapi.host}/api/index` : reqUrl;
                const tab = await getCurrentTab();
                const dataFromPage = await browser.tabs.executeScript(tab.id, {
                    code: '(() => ({ html: `<html>${document.documentElement.innerHTML}</html>`, url: document.location.href }))();'
                });
                result = dataFromPage[0];
                if(!isValidUrl(axApiData.axapi.host)) {
                    result.key = axApiData.axapi.host;
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