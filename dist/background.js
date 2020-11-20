"use strict";
function backgroundSetup(id) {
    console.log('loading state for tab', id);
    window.chrome.storage.local.get(`${id}`, function (data) {
        if (id && data[id] && data[id].isActive) {
            window.chrome.tabs.executeScript(id, {
                file: `reload.js`
            });
        }
        else {
            console.log('we should not run :(');
        }
    });
}
window.chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('request', request);
    if (request.type === 'pageload') {
        backgroundSetup(sender.tab.id);
    }
    else if (request.type === 'id') {
        console.log('sending a tab id with', sender.tab.id);
        sendResponse(sender.tab.id);
    }
    else if (request.type === 'notification') {
        const d = new Date();
        window.chrome.notifications.create(`found-${d.toISOString()}`, {
            type: 'basic',
            iconUrl: 'images/check-double-solid.svg',
            title: "Element Found!",
            message: `We found a result at ${request.url}`
        });
    }
});
