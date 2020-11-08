function backgroundSetup(id: number) {
  console.log('loading state for tab', id);
  (<any>window).chrome.storage.local.get(`${id}`, function (data: any) {
    if (id && data[id] && data[id].isActive) {
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
  }
});
