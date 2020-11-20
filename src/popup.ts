type State = {
  intervalDuration: number;
  lastRefresh: string | null;
  visibleContent: 'overview' | 'action';
  actions: Action[];
  isActive: boolean;
}

type Action = {
  selector: string;
  type: string;
  stopCondition: string;
}

const state: State = {
  intervalDuration: 30,
  lastRefresh: null,
  isActive: false,
  visibleContent: 'overview',
  actions: []
};

function handleError() {
  console.error('something went wrong!');
}

function renderAction(action: Action, targetNode: HTMLElement) {
  const elm = document.createElement('li');
  elm.className = 'action-element';
  const selectorElm = document.createElement('span');
  selectorElm.className = 'highlight';
  selectorElm.textContent = action.selector;
  const removeBtn = document.createElement('img');
  removeBtn.src = 'images/times-circle-regular.svg';
  removeBtn.className = 'remove-icon';
  removeBtn.addEventListener('click', () => {
    state.actions = state.actions.filter(x => x.selector !== action.selector);
    renderState();
  });

  let stopLabel = 'stop on success.';
  if (action.stopCondition === 'never') {
    stopLabel = 'continue.'
  } else if (action.stopCondition === 'failure') {
    stopLabel = 'stop on failure.'
  }

  let actionLabel = action.type;
  if (action.type === 'clickAlert') actionLabel = 'alert & click'

  const content = `find ${selectorElm.outerHTML} then <span class='highlight'>${actionLabel}</span> and <span class='highlight'>${stopLabel}</span>`;
  
  elm.innerHTML = content;
  elm.appendChild(removeBtn);
  targetNode.appendChild(elm);
}

function renderState () {
  console.log('rendering state for', state);
  const overview = document.getElementById('overview');
  const actionView = document.getElementById('action')
  const btnRowOverview = document.getElementById('btn-row-overview');
  const btnRowActionView = document.getElementById('btn-row-add-action');
  const btnRowActive = document.getElementById('btn-row-active');
  const actionPlaceholder = document.getElementById('action-placeholder');
  const actionList = document.getElementById('action-list');
  const refreshCountdown = document.getElementById('refresh-countdown');
  const intervalElm = document.getElementById('interval-input') as HTMLInputElement;
  const timer = document.getElementById('timer');

  if (
    !overview ||
    !actionView ||
    !btnRowActionView ||
    !btnRowOverview ||
    !actionList||
    !actionPlaceholder ||
    !refreshCountdown ||
    !btnRowActive ||
    !intervalElm ||
    !timer
  ) {
    handleError();
    return;
  }

  if (state.visibleContent === 'overview') {
    overview.style.display = 'block';
    btnRowOverview.style.display = 'flex';
    actionView.style.display = 'none';
    btnRowActionView.style.display = 'none';
  } else if (state.visibleContent === 'action') {
    overview.style.display = 'none';
    btnRowOverview.style.display = 'none';
    actionView.style.display = 'block';
    btnRowActionView.style.display = 'flex';
  }

  actionList.innerHTML = '';

  if (state.actions.length > 0) {
    actionPlaceholder.style.display = 'none';
    state.actions.forEach(action => {
      renderAction(action, actionList);
    })
  } else {
    actionPlaceholder.style.display = 'flex';
  }

  if (state.isActive) {
    refreshCountdown.style.display = 'flex';
    btnRowActive.style.display = 'flex';
    btnRowOverview.style.display = 'none';
    btnRowActionView.style.display = 'none';
    intervalElm.disabled = true;
  } else {
    btnRowActive.style.display = 'none';
    refreshCountdown.style.display = 'none';
    intervalElm.disabled = false;
  }

  intervalElm.value = `${state.intervalDuration}`;

  const query = { active: true, currentWindow: true };
  (<any>window).chrome.tabs.query(query, (tabs: any[]) => {
    const newState = {} as any;
    newState[tabs[0].id] = state;
    console.log(`saving the active state for tab id ${tabs[0].id}`, newState);
    (<any>window).chrome.storage.local.set(newState);
  });
}

function toggleActionViewHandler () {
  state.visibleContent = 'action';
  renderState();
}

function addActionHandler () {
  const selectorInputElm =  document.getElementById('css-selector-input') as HTMLInputElement;
  const typeDropdown = document.getElementById('action-type-select') as HTMLSelectElement;
  const stopDropdown = document.getElementById('action-stop-select') as HTMLInputElement;

  if (!selectorInputElm || !typeDropdown || !stopDropdown) {
    handleError()
    return;
  }

  const selector = selectorInputElm.value.trim();
  if (!selector || selector.length === 0) {
    return;
  }

  const newAction: Action = {
    selector,
    type: typeDropdown.value,
    stopCondition: stopDropdown.value
  }

  state.actions = [...state.actions, newAction];
  selectorInputElm.value = '';
  state.visibleContent = 'overview';
  renderState();
}

function cancelAddActionHandler () {
  state.visibleContent = 'overview';
  renderState();
}

function installEventListeners () {
  const addActionButton = document.getElementById('add-action-btn');
  const toggleActionView = document.getElementById('toggle-action-view-btn');
  const cancelAddActionButton = document.getElementById('cancel-add-action-btn');
  const intervalElm = document.getElementById('interval-input') as HTMLInputElement;
  const runButton = document.getElementById('run-btn');
  const stopButton = document.getElementById('stop-btn');

  if (!addActionButton || !toggleActionView || !cancelAddActionButton || !runButton || !stopButton) {
    handleError();
    return;
  }

  toggleActionView.addEventListener('click', toggleActionViewHandler);
  runButton.addEventListener('click', handleRun);
  addActionButton.addEventListener('click', addActionHandler);
  cancelAddActionButton.addEventListener('click', cancelAddActionHandler);
  intervalElm.addEventListener('blur', handleIntervalChange);
  stopButton.addEventListener('click', handleStop);
}

function getDifferenceInSeconds () {
  const end = new Date(state.lastRefresh || '').getTime() + state.intervalDuration;
  const start = new Date().getTime();
  const diff = start - end;
  const diffInSeconds = state.intervalDuration - Math.floor(diff / 1000 % 60);
  console.log(diffInSeconds);
  if (diffInSeconds < 0) {
    return '0';
  } else {
    return diffInSeconds.toString();
  }
}

function startTimer() {
  const timer = document.getElementById('timer');

  if (!timer) {
    handleError();
    return;
  }

  const diff = getDifferenceInSeconds();
  timer.innerText = diff;

  const interval = window.setInterval(() => {
    const query = { active: true, currentWindow: true };
    (<any>window).chrome.tabs.query(query, (tabs: any[]) => {
      const selectedTab = tabs[0];
      (<any>window).chrome.storage.local.get([`${selectedTab.id}`], function (data: any) {
        state.lastRefresh = data[selectedTab.id].lastRefresh;
        if (!data[selectedTab.id].isActive) {
          window.clearInterval(interval);
          state.isActive = false;
          renderState();
        }
      });
    });
    const diff = getDifferenceInSeconds();
    timer.innerText = diff;
  }, 1000)
}

function handleRun () {
  const intervalElm = document.getElementById('interval-input') as HTMLInputElement;
  if (!intervalElm) {
    handleError()
    return;
  }

  const query = { active: true, currentWindow: true };
  (<any>window).chrome.tabs.query(query, (tabs: any[]) => {
    const selectedTab = tabs[0];
    state.isActive = true;
    console.log('updating the active tab id', state);
    const now = new Date();
    state.lastRefresh = now.toISOString();
    startTimer();
    renderState();
    (<any>window).chrome.tabs.executeScript(selectedTab.id,  {
      file: `reload.js`
    })
  });
}

function handleIntervalChange (e: any) {
  if (e.target && e.target.value) {
    console.log('handle change', e.target.value);
    state.intervalDuration = parseInt(e.target.value);
    renderState();
  }
}

function handleStop () { 
  state.isActive = false;
  renderState();
}

function setup () {
  console.log('running setup');
  installEventListeners();
  const query = { active: true, currentWindow: true };
  (<any>window).chrome.tabs.query(query, (tabs: any[]) => {
    console.log('loading tabs in setup');
    const selectedTab = tabs[0];
    console.log('loading state for tab', selectedTab.id);
    (<any>window).chrome.storage.local.get([`${selectedTab.id}`], function (data: any) {
      console.log(data);
      Object.assign(state, data[selectedTab.id]);
      if (state.isActive) {
        startTimer();
      }
      renderState();
    });
  });
}

setup();
