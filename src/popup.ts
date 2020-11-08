type State = {
  intervalDuration: number;
  lastRefresh: string | null;
  visibleContent: 'overview' | 'action';
  actions: Action[];
  isActive: boolean;
}

type Action = {
  selector: string;
  type: 'click' | 'alert';
  shouldStop: boolean;
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
  const content = `find ${selectorElm.outerHTML} and <span class='highlight'>click</span>`
  elm.innerHTML = content;
  elm.appendChild(removeBtn);
  targetNode.appendChild(elm);
}

function renderState () {
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
  if (!selectorInputElm) {
    handleError()
    return;
  }

  const selector = selectorInputElm.value.trim();
  if (!selector || selector.length === 0) {
    return;
  }

  const newAction: Action = {
    selector,
    type: 'click',
    shouldStop: true
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

  if (!addActionButton || !toggleActionView || !cancelAddActionButton || !runButton) {
    handleError();
    return;
  }

  toggleActionView.addEventListener('click', toggleActionViewHandler);
  runButton.addEventListener('click', handleRun);
  addActionButton.addEventListener('click', addActionHandler);
  cancelAddActionButton.addEventListener('click', cancelAddActionHandler);
  intervalElm.addEventListener('blur', handleIntervalChange);
}

function getDifferenceInSeconds () {
  const end = new Date(state.lastRefresh || '').getTime() + state.intervalDuration * 1000;
  const start = new Date().getTime();
  const diff = start - end;
  const diffInSeconds = Math.floor(diff / 1000 % 60);
  if (diffInSeconds > 0) {
    return '0';
  } else {
    return Math.abs(Math.floor(diff / 1000 % 60)).toString();
  }
}

function startTimer() {
  const timer = document.getElementById('timer');

  if (!timer) {
    handleError();
    return;
  }

  window.setInterval(() => {
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
      file: `hello.js`
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
