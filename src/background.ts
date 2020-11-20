function backgroundSetup(id: number) {
  console.log('loading state for tab', id);
  (<any>window).chrome.storage.local.get(`${id}`, function (data: any) {
    if (id && data[id] && data[id].isActive) {
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
  } else if (request.type === 'refresh') {
    const id = sender.tab.id;
    console.log('refreshing from background script for tab', sender.tab.id);
      (<any>window).chrome.storage.local.get(`${id}`, function (data: any) {
      if (id && data[id] && data[id].isActive) {
        window.setTimeout(() => {
          (<any>window).chrome.tabs.reload(sender.tab.id, { bypassCache: true });
        }, data[id].intervalDuration * 1000);
      }
  });
  }
});
