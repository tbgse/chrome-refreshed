console.log('running reload script!!');

function handleInterval(id: number) {
  (<any>window).chrome.storage.local.get(`${id}`, function (data: any) {
    const state = data[id];
    console.log(state);
    if (!state || !state.intervalDuration || !state.isActive) return;

    console.log('starting main script with reload duration of', state.intervalDuration);
    window.setTimeout(() => {
      for (const action of state.actions) {
        const results = document.querySelectorAll(action.selector);
        if (results.length === 0) {
          console.log('no results found!');
        } else {
          const activeNode = results.item(0);
          if (action.type === 'click') {
            console.log('trying to click on element');
            console.log(activeNode);
            activeNode.click();
          }
        }
      }
      (<any>window).chrome.storage.local.get(`${id}`, (data: any) => {
        const state = data[id];
        if (!state || !state.intervalDuration || !state.isActive) return;

        const now = new Date();
        state.lastRefresh = now.toISOString();
        const newState = {} as any;
        newState[id] = state;
        (<any>window).chrome.storage.local.set(newState);
        window.location.reload();
      });
    }, state.intervalDuration * 1000);
  });
}

(<any>window).chrome.runtime.sendMessage({ type: "id" }, (tabId: number) => {
  console.log('My tabId is', tabId);
  if (tabId) handleInterval(tabId);
});
