'use strict';
// function backgroundSetup() {
//   console.log('running content script');
//   const query = { active: true, currentWindow: true };
//   (<any>window).chrome.tabs.query(query, (tabs: any[]) => {
//     console.log('loading tabs in setup');
//     const selectedTab = tabs[0];
//     console.log('loading state for tab', selectedTab.id);
//     (<any>window).chrome.storage.sync.get([`${selectedTab.id}`], function (data: any) {
//       if (data[selectedTab.id] && data[selectedTab.id].isActive) {
//         (<any>window).chrome.tabs.executeScript(selectedTab.id, {
//           file: `hello.js`
//         })
//       } else {
//         console.log('we should not run :(');
//       }
//     });
//   });
// }
window.chrome.runtime.sendMessage({ type: "pageload" });
