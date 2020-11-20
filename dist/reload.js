"use strict";
console.log('running reload script!!');
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function handleInterval(id) {
    window.chrome.storage.local.get(`${id}`, async function (data) {
        const state = data[id];
        console.log(state);
        if (!state || !state.intervalDuration || !state.isActive)
            return;
        console.log('starting main script with reload duration of', state.intervalDuration);
        let shouldStop = false;
        await sleep(100);
        for (const action of state.actions) {
            const d = new Date();
            console.log(`loop iteration ${d.toISOString()}`);
            const results = document.querySelectorAll(action.selector);
            if (results.length === 0) {
                console.log('no results found!');
                if (action.stopCondition === 'failure') {
                    shouldStop = true;
                }
            }
            else {
                console.log(results);
                if (action.stopCondition === 'success') {
                    shouldStop = true;
                }
                const activeNode = results.item(0);
                if (action.type === 'click' || action.type === 'clickAlert') {
                    activeNode.click();
                }
                if (action.type === 'clickAlert' || action.type === 'alert') {
                    window.chrome.runtime.sendMessage({ type: "notification", url: window.location.host });
                }
            }
            await sleep(100);
        }
        window.chrome.storage.local.get(`${id}`, (data) => {
            const state = data[id];
            if (!state || !state.intervalDuration || !state.isActive)
                return;
            state.isActive = !shouldStop;
            const newState = {};
            newState[id] = state;
            window.chrome.storage.local.set(newState);
            if (!shouldStop) {
                window.setTimeout(() => {
                    window.location.reload();
                }, state.intervalDuration * 500);
            }
        });
    });
}
window.chrome.runtime.sendMessage({ type: "id" }, (tabId) => {
    console.log('My tabId is', tabId);
    if (tabId)
        handleInterval(tabId);
});
