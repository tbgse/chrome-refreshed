"use strict";
console.log('running reload script!!');
function handleInterval(id) {
    window.chrome.storage.local.get(`${id}`, function (data) {
        const state = data[id];
        console.log(state);
        if (!state || !state.intervalDuration || !state.isActive)
            return;
        console.log('starting main script with reload duration of', state.intervalDuration);
        window.setTimeout(() => {
            for (const action of state.actions) {
                const results = document.querySelectorAll(action.selector);
                if (results.length === 0) {
                    console.log('no results found!');
                }
                else {
                    const activeNode = results.item(0);
                    if (action.type === 'click') {
                        console.log('trying to click on element');
                        console.log(activeNode);
                        activeNode.click();
                    }
                }
            }
            window.chrome.storage.local.get(`${id}`, (data) => {
                const state = data[id];
                if (!state || !state.intervalDuration || !state.isActive)
                    return;
                const now = new Date();
                state.lastRefresh = now.toISOString();
                const newState = {};
                newState[id] = state;
                window.chrome.storage.local.set(newState);
                console.log('trying to create notification');
                window.chrome.runtime.sendMessage({ type: "notification", url: window.location.host });
                // window.location.reload();
            });
        }, state.intervalDuration * 1000);
    });
}
window.chrome.runtime.sendMessage({ type: "id" }, (tabId) => {
    console.log('My tabId is', tabId);
    if (tabId)
        handleInterval(tabId);
});
