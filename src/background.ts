function backgroundSetup(id: number) {
  console.log('loading state for tab', id);
  (<any>window).chrome.storage.local.get(`${id}`, function (data: any) {
    if (id && data[id] && data[id].isActive) {
      const state = data[id];
      const now = new Date();
      state.lastRefresh = now.toISOString();
      const newState = {} as any;
      newState[id] = state;
      (<any>window).chrome.storage.local.set(newState);
      console.log('tab is active, starting reload script');
      (<any>window).chrome.tabs.executeScript(id, {
        file: `reload.js`
      })
    } else {
      console.log('we should not run :(');
    }
  });
}

(<any>window).chrome.runtime.onMessage.addListener(function (request: any, sender: any, sendResponse: any) {
  console.log('request', request);
  if (request.type === 'pageload') {
    backgroundSetup(sender.tab.id)
  } else if (request.type === 'id') {
    console.log('sending a tab id with', sender.tab.id);
    sendResponse(sender.tab.id);
  } else if (request.type === 'notification') {
    const d = new Date();
    (<any>window).chrome.notifications.create(`found-${d.toISOString()}`, {
      type: 'basic', 
      iconUrl: 'images/check-double-solid.svg', 
      title: "Element Found!", 
      message: `We found a result at ${request.url}` 
    });
  }
});
