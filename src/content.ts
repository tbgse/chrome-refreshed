'use strict';

(<any>window).chrome.runtime.sendMessage({ type: "pageload" });
