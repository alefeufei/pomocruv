// PomoCruv - JS do Timer e Tarefas

// State
let timeLeft = 25 * 60;
let timerId = null;
let currentMode = 'focus';
let isRunning = false;
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let activeTaskId = localStorage.getItem('activeTaskId') || null;
let settings = JSON.parse(localStorage.getItem('settings')) || {
  focus: 25,
  short: 5,
  long: 15,
  sound: true
};

// DOM Elements
const app = document.getElementById('app');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const mainBtn = document.getElementById('main-btn');
const resetBtn = document.getElementById('reset-btn');
const modeButtons = document.querySelectorAll('.mode-btn');
const body = document.body;
const taskList = document.getElementById('task-list');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const closeTaskModal = document.getElementById('close-task-modal');
const newTaskInput = document.getElementById('new-task-input');
const saveTaskBtn = document.getElementById('save-task');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const soundToggle = document.getElementById('sound-toggle');

// Task Modal elements
const estAmountInput = document.getElementById('est-amount');
const estUpBtn = document.getElementById('est-up');
const estDownBtn = document.getElementById('est-down');
const closeTaskModalAlt = document.getElementById('close-task-modal-alt');

// Inputs
const focusInput = document.getElementById('focus-time');
const shortInput = document.getElementById('short-time');
const longInput = document.getElementById('long-time');

// Initialize
function init() {
  updateDisplay();
  renderTasks();
  loadSettings();
  setupEventListeners();
}

function setupEventListeners() {
  mainBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchMode(btn.dataset.mode);
    });
  });

  // Task Modal
  addTaskBtn.addEventListener('click', () => {
    taskModal.classList.remove('hidden');
    newTaskInput.focus();
  });

  closeTaskModal.addEventListener('click', () => {
    taskModal.classList.add('hidden');
    newTaskInput.value = '';
  });

  saveTaskBtn.addEventListener('click', () => {
    const taskName = newTaskInput.value.trim();
    const est = parseInt(estAmountInput.value) || 1;
    if (taskName) {
      addTask(taskName, est);
      taskModal.classList.add('hidden');
      newTaskInput.value = '';
      estAmountInput.value = '1';
    }
  });

  estUpBtn.addEventListener('click', () => {
    estAmountInput.value = parseInt(estAmountInput.value) + 1;
  });

  estDownBtn.addEventListener('click', () => {
    const val = parseInt(estAmountInput.value);
    if (val > 1) estAmountInput.value = val - 1;
  });

  closeTaskModalAlt.addEventListener('click', () => {
    taskModal.classList.add('hidden');
    newTaskInput.value = '';
    estAmountInput.value = '1';
  });

  newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveTaskBtn.click();
    }
  });

  // Settings
  settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  closeSettings.addEventListener('click', () => {
    saveSettings();
    settingsModal.classList.add('hidden');
  });

  soundToggle.addEventListener('click', () => {
    settings.sound = !settings.sound;
    soundToggle.classList.toggle('on', settings.sound);
  });

  // Modals closing on background click
  window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      saveSettings();
      settingsModal.classList.add('hidden');
    }
    if (e.target === taskModal) {
      taskModal.classList.add('hidden');
      newTaskInput.value = '';
    }
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !taskModal.classList.contains('hidden') === false && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      toggleTimer();
    }
  });
}

function updateDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  minutesDisplay.textContent = String(mins).padStart(2, '0');
  secondsDisplay.textContent = String(secs).padStart(2, '0');
  document.title = `${minutesDisplay.textContent}:${secondsDisplay.textContent} - PomoCruv`;
}

function toggleTimer() {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (isRunning) return;
  
  if (timeLeft <= 0) {
    timeLeft = settings[currentMode] * 60;
    updateDisplay();
  }

  isRunning = true;
  app.classList.add('timer-running');
  mainBtn.textContent = 'PAUSAR';
  mainBtn.classList.add('active');

  timerId = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerId);
      timerFinished();
    }
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  app.classList.remove('timer-running');
  clearInterval(timerId);
  mainBtn.textContent = 'CONTINUAR';
  mainBtn.classList.remove('active');
}

function resetTimer() {
  pauseTimer();
  timeLeft = settings[currentMode] * 60;
  updateDisplay();
  mainBtn.textContent = 'INICIAR';
}

function switchMode(mode) {
  pauseTimer();
  currentMode = mode;
  
  modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  body.className = `theme-${mode}`;
  timeLeft = settings[mode] * 60;
  updateDisplay();
  mainBtn.textContent = 'INICIAR';
}

function timerFinished() {
  isRunning = false;
  app.classList.remove('timer-running');
  mainBtn.textContent = 'RECOMEÇAR';
  mainBtn.classList.remove('active');
  
  if (settings.sound) {
    playNotification();
  }

  // Notificação nativa se permitida
  // Incrementar tarefa ativa se for Foco
  if (currentMode === 'focus' && activeTaskId) {
    const task = tasks.find(t => t.id == activeTaskId);
    if (task) {
      task.actPomodoros = (task.actPomodoros || 0) + 1;
      saveTasks();
      renderTasks();
    }
  }

  if (Notification.permission === "granted") {
    new Notification("Tempo esgotado!", {
      body: `${currentMode === 'focus' ? 'Foco encerrado' : 'Pausa encerrada'}. Bom trabalho!`,
      icon: "/vite.svg"
    });
  } else {
    alert(`${currentMode === 'focus' ? 'Sessão de foco' : 'Pausa'} finalizada!`);
  }
}

function playNotification() {
  const alarmSound = new Audio('https://cdn.freecodecamp.org/testable-projects-fcc/audio/BeepSound.wav');
  alarmSound.volume = 0.5;
  alarmSound.loop = true;
  alarmSound.play().catch(err => console.log('Erro ao tocar alarme:', err));
  
  // Para o alarme após 6 segundos
  setTimeout(() => {
    alarmSound.pause();
    alarmSound.currentTime = 0;
  }, 6000);
}

// Task Functions
function addTask(name, estPomodoros) {
  const task = { 
    id: Date.now(), 
    name, 
    completed: false,
    estPomodoros: estPomodoros,
    actPomodoros: 0
  };
  tasks.push(task);
  if (!activeTaskId) activeTaskId = task.id;
  saveTasks();
  renderTasks();
}

function selectTask(id) {
  activeTaskId = id;
  localStorage.setItem('activeTaskId', activeTaskId);
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  if (activeTaskId == id) {
    activeTaskId = tasks.length > 0 ? tasks[0].id : null;
    localStorage.setItem('activeTaskId', activeTaskId);
  }
  saveTasks();
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const div = document.createElement('div');
    const isActive = activeTaskId == task.id;
    div.className = `task-item ${task.completed ? 'completed' : ''} ${isActive ? 'active' : ''}`;
    div.innerHTML = `
      <i data-lucide="${task.completed ? 'check-circle-2' : 'circle'}" class="task-toggle"></i>
      <div class="task-text">
        <span>${task.name}</span>
        <span class="task-progress">${task.actPomodoros || 0} / ${task.estPomodoros || 1}</span>
      </div>
      <button class="delete-task icon-btn">
        <i data-lucide="trash-2"></i>
      </button>
    `;

    div.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-task') && !e.target.closest('.task-toggle')) {
        selectTask(task.id);
      }
    });

    div.querySelector('.task-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTask(task.id);
    });
    div.querySelector('.delete-task').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });
    
    taskList.appendChild(div);
  });
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Settings Functions
function loadSettings() {
  focusInput.value = settings.focus;
  shortInput.value = settings.short;
  longInput.value = settings.long;
  soundToggle.classList.toggle('on', settings.sound);
  
  timeLeft = settings.focus * 60;
  updateDisplay();

  // Pedir permissão para notificações
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function saveSettings() {
  settings.focus = parseInt(focusInput.value) || 25;
  settings.short = parseInt(shortInput.value) || 5;
  settings.long = parseInt(longInput.value) || 15;
  localStorage.setItem('settings', JSON.stringify(settings));
  
  if (!isRunning) {
    timeLeft = settings[currentMode] * 60;
    updateDisplay();
    mainBtn.textContent = 'INICIAR';
  }
}

init();
