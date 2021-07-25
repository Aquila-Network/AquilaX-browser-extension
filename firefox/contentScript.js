browser.storage.sync.get('axapi')
	.then(item => {
		localStorage.setItem("axapi", item.axapi.host);
	})