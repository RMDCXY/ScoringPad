// DOM 元素
const themeToggle = document.getElementById('theme-toggle');
const searchToggle = document.getElementById('search-toggle');
const moreToggle = document.getElementById('more-toggle');
const classToggle = document.getElementById('class-toggle');
const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');
const leaderboardPage = document.getElementById('leaderboard-page');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const autoLoginCheckbox = document.getElementById('auto-login');
const loginBtn = document.getElementById('login-btn');
const addStudentBtn = document.getElementById('add-student-btn');
const batchAddBtn = document.getElementById('batch-add-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const backBtn = document.getElementById('back-btn');
const screenshotBtn = document.getElementById('screenshot-btn');
const studentsList = document.getElementById('students-list');
const rankedList = document.getElementById('ranked-list');
const closeNoticeBtn = document.getElementById('close-notice');
const fileInput = document.getElementById('file-input');


// ========== 配置加载 ==========
let config = {
  login: true,
  username: 'admin',
  password: '1q2w3e4r',
  notice: true
};

// ========== 班级管理 ==========
let classes = null; // will be loaded from storage
let currentClass = null; // 当前选中班级

function loadClasses() {
  const data = localStorage.getItem('classes');
  if (data) {
    try {
      const arr = JSON.parse(data);
      if (Array.isArray(arr) && arr.length > 0) {
        classes = arr;
        return classes;
      }
    } catch (e) {
      // fallthrough
    }
  }
  classes = ['班级1'];
  saveClasses();
  return classes;
}

function saveClasses() {
  localStorage.setItem('classes', JSON.stringify(classes));
}

function addClass(name) {
  if (!name) return false;
  name = name.trim();
  if (!name) return false;
  if (classes.includes(name)) return false;
  classes.push(name);
  saveClasses();
  return true;
}

function renameClass(oldName, newName) {
  newName = (newName || '').trim();
  if (!newName || classes.includes(newName)) return false;
  const idx = classes.indexOf(oldName);
  if (idx === -1) return false;
  // move students data if exists
  const oldKey = `students_${oldName}`;
  const newKey = `students_${newName}`;
  const oldData = localStorage.getItem(oldKey);
  // if newKey exists, we will overwrite it
  if (oldData !== null) {
    localStorage.setItem(newKey, oldData);
    localStorage.removeItem(oldKey);
  }
  classes[idx] = newName;
  saveClasses();
  // update currentClass if needed
  if (currentClass === oldName) {
    currentClass = newName;
    localStorage.setItem('currentClass', currentClass);
  }
  return true;
}

function deleteClassByName(name) {
  const idx = classes.indexOf(name);
  if (idx === -1) return false;
  // remove students for this class
  localStorage.removeItem(`students_${name}`);
  classes.splice(idx, 1);
  if (classes.length === 0) {
    classes = ['班级1'];
  }
  saveClasses();
  // adjust currentClass
  if (currentClass === name) {
    currentClass = classes[0];
    localStorage.setItem('currentClass', currentClass);
  }
  return true;
}

// 读取 scoringpad.json 配置
async function loadConfig() {
  try {
    const res = await fetch('scoringpad.json?_=' + Date.now());
    if (res.ok) {
      const json = await res.json();
      config = Object.assign(config, json);
    }
  } catch (e) {
    // 读取失败则用默认配置
    console.warn('配置文件读取失败，使用默认配置', e);
  }
}

// ========== 主题管理 ==========
function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeToggle.textContent = isDark ? '🌙' : '☀️';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeIcon();
}

function getPreferredTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
}

if (searchToggle) {
  searchToggle.addEventListener('click', openSearch);
}

// 更多按钮事件绑定
if (moreToggle) {
  moreToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMoreMenu();
  });
}

// 班级按钮事件绑定
if (classToggle) {
  classToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    openClassMenu();
  });
}

// 初始化主题
setTheme(getPreferredTheme());

// ========== 页面切换 ==========
function showLoginPage() {
  loginPage.classList.remove('hidden');
  dashboardPage.classList.add('hidden');
  leaderboardPage.classList.add('hidden');
}

function showDashboardPage() {
  loginPage.classList.add('hidden');
  dashboardPage.classList.remove('hidden');
  leaderboardPage.classList.add('hidden');
  renderStudents();
  // 根据配置设置大标题
  if (config.title) {
    // dashboard-page h1
    const dashTitle = dashboardPage.querySelector('h1');
    if (dashTitle) {
      dashTitle.textContent = `欢迎使用${config.title}！`;
    }
    // login-page h2
    const loginTitle = loginPage.querySelector('h2');
    if (loginTitle) {
      loginTitle.textContent = config.title;
    }
  }
  // 根据配置显示/隐藏 notice-box，并设置内容
  const noticeBox = document.getElementById('notice-box');
  if (noticeBox) {
    noticeBox.style.display = config.notice ? '' : 'none';
    if (typeof config.notice === 'string') {
      // 支持自定义内容
      // 保留关闭按钮
      const closeBtn = noticeBox.querySelector('.close-btn');
      noticeBox.innerHTML = '';
      if (closeBtn) noticeBox.appendChild(closeBtn);
      // 插入自定义内容
      const content = document.createElement('div');
      content.innerHTML = config.notice;
      noticeBox.appendChild(content);
    }
  }
}

function showLeaderboardPage() {
  loginPage.classList.add('hidden');
  dashboardPage.classList.add('hidden');
  leaderboardPage.classList.remove('hidden');
  renderLeaderboard();
}

// ========== 搜索功能 ==========
let _searchBarEl = null;

function openSearch() {
  // 如果已存在，聚焦并返回
  if (_searchBarEl) {
    const inp = document.getElementById('global-search');
    if (inp) inp.focus();
    return;
  }

  // 让其它三个按钮渐隐（更多、班级、主题），并把 search-toggle 移动到主题按钮位置
  if (moreToggle) moreToggle.classList.add('btn-hidden');
  if (classToggle) classToggle.classList.add('btn-hidden');
  if (themeToggle) themeToggle.classList.add('btn-hidden');
  if (searchToggle) {
    // 把搜索按钮移动到主题位置
    searchToggle.classList.add('moved');
    // 标记页面处于搜索打开状态，供 CSS 调整 search-bar 右侧间距（避开按钮）
    document.body.classList.add('search-opened');
    // 将搜索按钮的点击行为切换为关闭
    try { searchToggle.removeEventListener('click', openSearch); } catch (e) {}
    searchToggle.addEventListener('click', closeSearch);
    // 视觉上变为关闭图标
    searchToggle.dataset.prev = searchToggle.innerText;
    searchToggle.innerText = '❌';
  }

  // 创建搜索条（初始不可见/透明，通过 CSS 动画淡入）
  const bar = document.createElement('div');
  bar.id = 'search-bar';
  // 先设置为不可见样式，稍后加入可见类触发过渡

  const input = document.createElement('input');
  input.id = 'global-search';
  input.className = 'search-input';
  input.placeholder = '搜索学生姓名...';
  input.autocomplete = 'off';

  // 不再在搜索栏内创建独立的关闭按钮，搜索按钮会 morph 为关闭并承担关闭功能
  bar.appendChild(input);
  document.body.appendChild(bar);
  _searchBarEl = bar;

  // 事件
  input.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });
  // 触发过渡（延迟一帧）
  requestAnimationFrame(() => {
    _searchBarEl.classList.add('visible');
    setTimeout(() => input.focus(), 160);
  });
}

function closeSearch() {
  // 隐藏搜索栏的淡出动画
  if (_searchBarEl) {
    _searchBarEl.classList.remove('visible');
    // 等待过渡结束后移除 DOM
    setTimeout(() => {
      if (_searchBarEl) {
        _searchBarEl.remove();
        _searchBarEl = null;
      }
    }, 260);
  }

  // 恢复右上角按钮状态（反向动画）
  if (moreToggle) moreToggle.classList.remove('btn-hidden');
  if (classToggle) classToggle.classList.remove('btn-hidden');
  if (themeToggle) themeToggle.classList.remove('btn-hidden');
  if (searchToggle) {
    searchToggle.classList.remove('moved');
    document.body.classList.remove('search-opened');
    // 恢复搜索按钮的点击行为
    try { searchToggle.removeEventListener('click', closeSearch); } catch (e) {}
    searchToggle.addEventListener('click', openSearch);
    // 恢复图标
    if (searchToggle.dataset && searchToggle.dataset.prev) {
      searchToggle.innerText = searchToggle.dataset.prev;
      delete searchToggle.dataset.prev;
    } else {
      searchToggle.innerText = '🔍';
    }
  }

  // 恢复内容渲染
  if (!dashboardPage.classList.contains('hidden')) renderStudents();
  if (!leaderboardPage.classList.contains('hidden')) renderLeaderboard();
}

function performSearch(query) {
  const q = (query || '').trim();
  if (!dashboardPage.classList.contains('hidden')) {
    renderStudents(q);
  } else if (!leaderboardPage.classList.contains('hidden')) {
    renderLeaderboard(q);
  }
}

// ========== 更多菜单功能 ==========
let _moreMenuEl = null;

function createMoreMenu() {
  if (_moreMenuEl) return _moreMenuEl;
  const menu = document.createElement('div');
  menu.id = 'more-menu';
  // 添加学生 / 批量添加 / 导入 / 导出（与页面原按钮功能一致，移入更多菜单）
  const addItem = document.createElement('div');
  addItem.className = 'more-item';
  addItem.innerText = '🧑 添加学生';
  addItem.addEventListener('click', (e) => { e.stopPropagation(); addStudentUI(); closeMoreMenu(); });

  const batchItem = document.createElement('div');
  batchItem.className = 'more-item';
  batchItem.innerText = '➕ 批量添加学生';
  batchItem.addEventListener('click', (e) => { e.stopPropagation(); batchAddUI(); closeMoreMenu(); });

  const importItem = document.createElement('div');
  importItem.className = 'more-item';
  importItem.innerText = '📁 导入CSV';
  importItem.addEventListener('click', (e) => { e.stopPropagation(); importCsvAction(); closeMoreMenu(); });

  const exportItem = document.createElement('div');
  exportItem.className = 'more-item';
  exportItem.innerText = '📄 导出CSV';
  exportItem.addEventListener('click', (e) => { e.stopPropagation(); exportCsvAction(); closeMoreMenu(); });

  const randomItem = document.createElement('div');
  randomItem.className = 'more-item';
  randomItem.innerText = '🎲 随机抽选';
  randomItem.addEventListener('click', (e) => { e.stopPropagation(); randomPickUI(); closeMoreMenu(); });

  // 原有的清空/清零/关于项
  const clearItem = document.createElement('div');
  clearItem.className = 'more-item';
  clearItem.innerText = '🗑️ 清空数据';
  clearItem.addEventListener('click', (e) => {
    e.stopPropagation();
    handleClearData();
  });

  const zeroItem = document.createElement('div');
  zeroItem.className = 'more-item';
  zeroItem.innerText = ' ↻ 一键清零';
  zeroItem.addEventListener('click', (e) => {
    e.stopPropagation();
    handleResetAllScores();
  });

  const aboutItem = document.createElement('div');
  aboutItem.className = 'more-item';
  aboutItem.innerText = 'ⓘ 关于';
  aboutItem.addEventListener('click', (e) => {
    e.stopPropagation();
    handleAbout();
  });

  menu.appendChild(addItem);
  menu.appendChild(batchItem);
  menu.appendChild(importItem);
  menu.appendChild(exportItem);
  menu.appendChild(randomItem);
  menu.appendChild(clearItem);
  menu.appendChild(zeroItem);
  menu.appendChild(aboutItem);
  document.body.appendChild(menu);
  _moreMenuEl = menu;
  return menu;
}

function toggleMoreMenu() {
  // 打开更多菜单时自动关闭班级菜单，避免重叠
  if (_classMenuEl) {
    closeClassMenu();
  }
  if (_moreMenuEl) {
    closeMoreMenu();
    return;
  }
  const menu = createMoreMenu();
  // 保证位置靠近更多按钮（样式也已设置），并监听外部点击关闭
  setTimeout(() => document.addEventListener('click', _docClickCloseMore), 0);
}

function closeMoreMenu() {
  if (_moreMenuEl) {
    _moreMenuEl.classList.add('menu-fade-out');
    setTimeout(() => {
      if (_moreMenuEl) {
        _moreMenuEl.remove();
        _moreMenuEl = null;
      }
      document.removeEventListener('click', _docClickCloseMore);
    }, 150);
  }
}

function _docClickCloseMore(ev) {
  if (!_moreMenuEl) return;
  const target = ev.target;
  if (moreToggle && (moreToggle === target || moreToggle.contains(target))) return;
  if (_moreMenuEl.contains(target)) return;
  closeMoreMenu();
}

// ========== 班级菜单 ==========
let _classMenuEl = null;

function openClassMenu() {
  closeMoreMenu();
  closeSearch();
  if (_classMenuEl) {
    closeClassMenu();
    return;
  }
  const menu = document.createElement('div');
  menu.id = 'class-menu';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'class-menu-title';
  titleDiv.innerText = '请选择班级';
  menu.appendChild(titleDiv);

  // Ensure classes is loaded
  if (!classes) loadClasses();

  classes.forEach(cls => {
    const item = document.createElement('div');
    item.className = 'class-item';
    if (cls === currentClass) item.classList.add('class-item-active');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'class-name';
    nameSpan.innerText = cls;
    nameSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      selectClass(cls);
    });

    const actions = document.createElement('span');
    actions.className = 'class-actions';

    const renameBtn = document.createElement('button');
    renameBtn.className = 'class-action-btn rename-btn';
    renameBtn.title = '重命名班级';
    renameBtn.innerText = '🖊';
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newName = prompt(`✏ 请输入班级新名称：`, cls);
      if (!newName) return;
      if (newName.trim() === cls) return;
      const ok = renameClass(cls, newName);
      if (!ok) {
        alert('❌ 重命名失败（可能名称为空或已存在）');
        return;
      }
      // 重渲染菜单
      closeClassMenu();
      openClassMenu();
      // 提示用户重命名成功
      alert(`✔ 成功将【${cls}】重命名为【${newName.trim()}】`);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'class-action-btn delete-class-btn';
    delBtn.title = '删除班级';
    delBtn.innerText = '🗑️';
    // 如果只有一个班级，则禁用删除按钮（不可点击且灰色），避免用户删除唯一班级
    if (classes && classes.length <= 1) {
      delBtn.classList.add('disabled');
      delBtn.setAttribute('disabled', 'disabled');
      delBtn.title = '无法删除唯一班级';
    } else {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteClassUI(cls);
      });
    }

    actions.appendChild(renameBtn);
    actions.appendChild(delBtn);

    item.appendChild(nameSpan);
    item.appendChild(actions);
    menu.appendChild(item);
  });

  // 创建班级按钮
  const createDiv = document.createElement('div');
  createDiv.className = 'class-item class-create';
  createDiv.innerText = '➕ 创建班级';
  createDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    const name = prompt('➕ 请输入新班级名称：');
    if (!name) return;
    const ok = addClass(name);
    if (!ok) {
      alert('❌ 创建失败（名称为空或已存在）');
      return;
    }
    // 切换到新班级
    currentClass = name.trim();
    localStorage.setItem('currentClass', currentClass);
    closeClassMenu();
    if (!dashboardPage.classList.contains('hidden')) renderStudents();
    if (!leaderboardPage.classList.contains('hidden')) renderLeaderboard();
    // 提示用户创建成功
    alert(`✔ 成功添加班级【${currentClass}】`);
  });
  menu.appendChild(createDiv);

  document.body.appendChild(menu);
  _classMenuEl = menu;
  setTimeout(() => document.addEventListener('click', _docClickCloseClass), 0);
}

function closeClassMenu() {
  if (_classMenuEl) {
    _classMenuEl.classList.add('menu-fade-out');
    setTimeout(() => {
      if (_classMenuEl) {
        _classMenuEl.remove();
        _classMenuEl = null;
      }
      document.removeEventListener('click', _docClickCloseClass);
    }, 150);
  }
}

function _docClickCloseClass(ev) {
  if (!_classMenuEl) return;
  const target = ev.target;
  if (_classMenuEl.contains(target)) return;
  closeClassMenu();
}

function selectClass(cls) {
  if (currentClass !== cls) {
    currentClass = cls;
    localStorage.setItem('currentClass', cls);
    closeClassMenu();
    if (!dashboardPage.classList.contains('hidden')) renderStudents();
    if (!leaderboardPage.classList.contains('hidden')) renderLeaderboard();
  } else {
    closeClassMenu();
  }
}

function handleAbout() {
  closeMoreMenu();
  const aboutText = config['about-info'] || config.about || 'Scoring Pad - 本地计分管理系统。';
  alert(aboutText);
}

function generateConfirmCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function handleClearData() {
  closeMoreMenu();
  const ok = confirm('⚠确认清除所有班级的所有学生记分数据吗？清除之后将无法恢复！');
  if (!ok) return;

  const code = generateConfirmCode();
  const input = prompt(`⌨请完整重复输入【${code}】以确认删除`);
  if (input === null) return; // 取消
  if (input !== code) {
    alert('❌输入内容不匹配，请重新操作！');
    return;
  }

  const finalOk = confirm('☢最后一次确认！确定要完全清除学生数据吗？清除后将永远不能恢复，永远！数据无价，谨慎操作！\nⓘ 建议您清除前使用导出CSV功能进行备份，避免出现不必要的损失。');
  if (!finalOk) return;

  // 执行：彻底删除所有班级及其学生数据（并移除班级列表与当前班级选择）
  // 1) 删除所有以 students_ 开头的键
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('students_')) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));

    // 2) 删除 classes 与 currentClass（以及 autoLogin）等会话数据
    localStorage.removeItem('classes');
    localStorage.removeItem('currentClass');
    localStorage.removeItem('autoLogin');

    // 3) 为保持当前会话可用，重置内存中的 classes/currentClass 为默认值（但不立即持久化）
    classes = ['班级1'];
    currentClass = classes[0];

    // 刷新视图
    if (!dashboardPage.classList.contains('hidden')) renderStudents();
    if (!leaderboardPage.classList.contains('hidden')) renderLeaderboard();

    alert('✔ 已彻底删除所有班级及其学生数据。');
  } catch (e) {
    console.error('清除全部数据失败：', e);
    alert('❌ 清除异常失败。');
  }
}

function handleDeleteClassUI(cls) {
  // 删除单个班级（含其学生数据），使用同样的多步骤确认
  closeClassMenu();
  const ok = confirm(`⚠ 确定要删除班级【${cls}】及其所有学生数据吗？此操作不可逆！`);
  if (!ok) return;
  const code = generateConfirmCode();
  const input = prompt(`⌨请完整重复输入【${code}】以确认删除班级【${cls}】`);
  if (input === null) return;
  if (input !== code) {
    alert('❌ 输入不匹配，操作已取消');
    return;
  }
  const finalOk = confirm('☢ 最后一次确认：确定要永久删除该班级吗？该操作无法恢复！');
  if (!finalOk) return;
  const okDel = deleteClassByName(cls);
  if (!okDel) {
    alert('❌ 删除失败');
    return;
  }
  alert('✔ 班级已删除');
}

function handleResetAllScores() {
  closeMoreMenu();
  const ok = confirm('⚠ 确定要清零该班级所有学生记分吗？该操作会将所有学生的分数清除为0，但学生姓名仍然会保留。清零后将无法恢复！');
  if (!ok) return;

  const finalOk = confirm('☢ 最后一次确认！确定要清零所有学生记分吗？清除后将永远不能恢复，永远！数据无价，谨慎操作！\nⓘ 建议您清除前使用导出CSV功能进行备份，避免出现不必要的损失。');
  if (!finalOk) return;

  const students = loadStudents();
  students.forEach(s => { s.score = 0; });
  saveStudents(students);
  if (!dashboardPage.classList.contains('hidden')) renderStudents();
  if (!leaderboardPage.classList.contains('hidden')) renderLeaderboard();
  alert('✔ 清除完成！');
}

// ========== 数据存储 ==========
function loadStudents() {
  const key = `students_${currentClass}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveStudents(students) {
  const key = `students_${currentClass}`;
  localStorage.setItem(key, JSON.stringify(students));
}

// ========== 渲染 ==========
function renderStudents(filter) {
  const all = loadStudents();
  const q = filter ? filter.toLowerCase() : '';
  const list = all
    .map((s, i) => ({ s, i }))
    .filter(item => (q ? item.s.name.toLowerCase().includes(q) : true));

  studentsList.innerHTML = '';

  list.forEach(({ s: student, i: originalIndex }) => {
    const div = document.createElement('div');
    div.className = 'student-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'student-name';
    nameSpan.textContent = student.name;

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'student-score';
    scoreSpan.textContent = student.score;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'student-actions';

    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.title = '加分';
    addBtn.onclick = () => handleAddScore(originalIndex);

    const minusBtn = document.createElement('button');
    minusBtn.className = 'minus-btn';
    minusBtn.title = '扣分';
    minusBtn.onclick = () => handleMinusScore(originalIndex);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-btn';
    resetBtn.title = '清零';
    resetBtn.onclick = () => handleResetScore(originalIndex);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = '删除学生';
    deleteBtn.onclick = () => handleDeleteStudent(originalIndex);

    actionsDiv.appendChild(addBtn);
    actionsDiv.appendChild(minusBtn);
    actionsDiv.appendChild(resetBtn);
    actionsDiv.appendChild(deleteBtn);

    div.appendChild(nameSpan);
    div.appendChild(scoreSpan);
    div.appendChild(actionsDiv);

    studentsList.appendChild(div);
  });
}

function renderLeaderboard() {
  const all = loadStudents();
  const q = arguments.length > 0 && arguments[0] ? String(arguments[0]).toLowerCase() : '';

  // 包含原始索引以便稳定排序和可能的扩展
  const mapped = all.map((s, i) => ({ s, i }));
  // 按分数降序排序（稳定）
  const sorted = mapped.sort((a, b) => b.s.score - a.s.score);
  const filtered = q ? sorted.filter(item => item.s.name.toLowerCase().includes(q)) : sorted;

  rankedList.innerHTML = '';

  filtered.forEach((item, idx) => {
    const student = item.s;
    const div = document.createElement('div');
    div.className = 'rank-item';

    const rankSpan = document.createElement('span');
    rankSpan.className = 'rank';
    rankSpan.textContent = (idx + 1) + '.';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'rank-name';
    nameSpan.textContent = student.name;

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'rank-score';
    scoreSpan.textContent = student.score;

    div.appendChild(rankSpan);
    div.appendChild(nameSpan);
    div.appendChild(scoreSpan);
    rankedList.appendChild(div);
  });
}

// ========== 功能 ==========
// 将页面操作抽成可复用函数，菜单和（若存在）原按钮都会调用
function addStudentUI() {
  const name = prompt('👦请输入学生姓名：');
  if (name && name.trim()) {
    const students = loadStudents();
    students.push({ name: name.trim(), score: 0 });
    saveStudents(students);
    renderStudents();
  }
}

function batchAddUI() {
  const input = prompt('🏫 请输入所有需要批量添加的学生姓名，可用中文逗号“，”、顿号“、”或英文逗号“,”分隔：');
  if (!input) return;
  const names = input.split(/[,，、]/).map(n => n.trim()).filter(n => n !== '');
  if (names.length === 0) {
    alert('❌ 未检测到有效姓名。');
    return;
  }
  const students = loadStudents();
  names.forEach(name => students.push({ name, score: 0 }));
  saveStudents(students);
  renderStudents();
  alert(`✔ 成功添加 ${names.length} 名学生！`);
}

// ========== 随机抽选功能 ==========
function randomPickUI() {
  // 确保班级和学生已加载
  if (!classes) loadClasses();
  const students = loadStudents();
  if (!students || students.length === 0) {
    alert('❌ 当前班级没有学生，无法抽选！');
    return;
  }

  const input = prompt('🎲 请输入抽选人数', '1');
  if (input === null) return; // 用户取消
  const n = parseInt((input || '').trim(), 10);
  if (isNaN(n) || n <= 0) {
    alert('❌ 请输入有效的整数抽选人数！');
    return;
  }
  if (n > students.length) {
    alert('❌ 抽选人数大于班级人数，无法抽选！');
    return;
  }

  // 随机不重复抽取 n 个学生
  const names = students.map(s => s.name);
  const picked = [];
  const used = new Set();
  while (picked.length < n) {
    const idx = Math.floor(Math.random() * names.length);
    if (used.has(idx)) continue;
    used.add(idx);
    picked.push(names[idx]);
  }

  createRandomModal(picked);
}

function createRandomModal(pickedNames) {
  // 创建模态窗口容器
  const modal = document.createElement('div');
  modal.id = 'random-modal';

  // 顶部 10px 可拖动区域（绝对位置）
  const dragBar = document.createElement('div');
  dragBar.className = 'random-modal-dragbar';
  modal.appendChild(dragBar);

  // 头部：标题 + 关闭按钮（标题居中，关闭按钮在右上角）
  const header = document.createElement('div');
  header.className = 'random-modal-header';

  const title = document.createElement('div');
  title.className = 'random-modal-title';
  title.textContent = '🎲 抽选结果';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'random-modal-close';
  closeBtn.type = 'button';
  closeBtn.innerText = '❌';
  closeBtn.title = '关闭';
  closeBtn.addEventListener('click', () => {
    // 移除并清理监听器
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    // 移除全局拖拽监听（如果存在）
    window.removeEventListener('pointermove', _rmPointerMove);
    window.removeEventListener('pointerup', _rmPointerUp);
    // 移除键盘关闭监听
    try { window.removeEventListener('keydown', _onKey); } catch (e) {}
  });

  header.appendChild(title);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // 内容区域，展示姓名（每个姓名一行，大标题样式）
  const body = document.createElement('div');
  body.className = 'random-modal-body';
  if (Array.isArray(pickedNames)) {
    pickedNames.forEach(name => {
      const h = document.createElement('h1');
      h.textContent = name;
      body.appendChild(h);
    });
  } else {
    const h = document.createElement('h1');
    h.textContent = String(pickedNames || '');
    body.appendChild(h);
  }
  modal.appendChild(body);

  // 添加到文档并居中
  document.body.appendChild(modal);

  // 拖拽实现（使用 dragBar 做为抓取区域）
  let dragging = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;

  function _onPointerDown(e) {
    e.preventDefault();
    dragging = true;
    const rect = modal.getBoundingClientRect();
    // 如果 modal 使用 transform 居中，先把当前位置转换为 left/top 绝对坐标
    if (modal.style.transform && modal.style.transform.indexOf('translate') !== -1) {
      modal.style.left = rect.left + 'px';
      modal.style.top = rect.top + 'px';
      modal.style.transform = 'none';
    }
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseFloat(modal.style.left || rect.left);
    startTop = parseFloat(modal.style.top || rect.top);
    // 绑定全局 move/up，以便在移动到窗口外部也能持续拖拽
    window.addEventListener('pointermove', _rmPointerMove);
    window.addEventListener('pointerup', _rmPointerUp);
  }

  function _rmPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    modal.style.left = (startLeft + dx) + 'px';
    modal.style.top = (startTop + dy) + 'px';
  }

  function _rmPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    try { window.removeEventListener('pointermove', _rmPointerMove); } catch (e) {}
    try { window.removeEventListener('pointerup', _rmPointerUp); } catch (e) {}
  }

  // 将函数引用暴露以便关闭时移除
  window._rmPointerMove = _rmPointerMove;
  window._rmPointerUp = _rmPointerUp;

  dragBar.addEventListener('pointerdown', _onPointerDown);

  // 可访问性：按 Esc 关闭
  function _onKey(e) {
    if (e.key === 'Escape') {
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      window.removeEventListener('pointermove', _rmPointerMove);
      window.removeEventListener('pointerup', _rmPointerUp);
      window.removeEventListener('keydown', _onKey);
    }
  }
  window.addEventListener('keydown', _onKey);
}

function exportCsvAction() {
  const students = loadStudents();
  if (students.length === 0) {
    alert('❌ 没有学生数据可导出！');
    return;
  }

  let csvContent = '姓名,分数\n';
  csvContent += students.map(s => `"${s.name}",${s.score}`).join('\n');

  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  // 导出文件名：当前班级名 + 班级数据（不包含额外符号）
  const safeName = (currentClass || '班级').replace(/[\\/:*?"<>|]/g, '_');
  a.download = `${safeName}班级数据.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importCsvAction() {
  // 利用页面的隐藏 file input
  if (fileInput) fileInput.click();
}

// 如果页面上仍存在原按钮，保留兼容性绑定
if (addStudentBtn) addStudentBtn.addEventListener('click', addStudentUI);
if (batchAddBtn) batchAddBtn.addEventListener('click', batchAddUI);
if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCsvAction);
if (importCsvBtn) importCsvBtn.addEventListener('click', importCsvAction);

if (fileInput) {
  fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      alert('❌ 该CSV文件不是ScoringPad导出，无法导入。或该文件损坏。');
      return;
    }

    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const match = line.match(/^"([^"]*)",(.+)$/);
      if (match) {
        const name = match[1];
        const score = parseFloat(match[2]);
        if (!isNaN(score) && name) {
          students.push({ name, score });
        }
      } else {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const score = parseFloat(parts[1]);
          if (!isNaN(score) && name) {
            students.push({ name, score });
          }
        }
      }
    }

    if (students.length === 0) {
      alert('❌ 未解析到有效学生数据！');
      return;
    }

    saveStudents(students);
    renderStudents();
    alert(`✔ 成功导入 ${students.length} 名学生！`);
  };
  reader.readAsText(file, 'utf-8');
  e.target.value = '';
  });
}

// ========== 操作 ==========
function handleAddScore(index) {
  const students = loadStudents();
  const scoreStr = prompt(`➕ 为【${students[index].name}】加分，请输入加分值：`);
  if (scoreStr === null) return;
  const score = parseFloat(scoreStr);
  if (!isNaN(score)) {
    students[index].score += score;
    saveStudents(students);
    renderStudents();
  } else {
    alert('❌ 请输入有效的数字！');
  }
}

function handleMinusScore(index) {
  const students = loadStudents();
  const scoreStr = prompt(`➖ 为【${students[index].name}】扣分，请输入扣分值：`);
  if (scoreStr === null) return;
  const score = parseFloat(scoreStr);
  if (!isNaN(score)) {
    students[index].score -= score;
    saveStudents(students);
    renderStudents();
  } else {
    alert('❌ 请输入有效的数字！');
  }
}

function handleResetScore(index) {
  if (confirm('⚠ 确定要将该学生的分数清零吗？')) {
    const students = loadStudents();
    students[index].score = 0;
    saveStudents(students);
    renderStudents();
  }
}

function handleDeleteStudent(index) {
  if (confirm('⚠ 确定要删除该学生及其所有记录吗？')) {
    const students = loadStudents();
    students.splice(index, 1);
    saveStudents(students);
    renderStudents();
  }
}

// ========== 截屏功能 ==========
if (screenshotBtn) {
  screenshotBtn.addEventListener('click', async () => {
  try {
    const element = document.getElementById('ranked-list');
    if (!element || element.children.length === 0) {
      alert('❌ 排行榜为空，无法截图！');
      return;
    }

    // 创建一个临时容器，包含标题和列表
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card-bg');
    container.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    container.style.fontFamily = 'Microsoft YaHei, sans-serif';
    container.style.fontSize = '18px';
    container.style.width = '600px';

    const title = document.createElement('h2');
    title.textContent = '🏆 排行榜';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    container.appendChild(title);
    container.appendChild(element.cloneNode(true));

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: null,
      useCORS: true
    });

    document.body.removeChild(container);

    const link = document.createElement('a');
    link.download = 'ScoringPadRankingScreenshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('截屏失败:', err);
    alert('❌ 截屏失败，请稍后重试。');
  }
  });
}

// ========== UI 交互 ==========
if (closeNoticeBtn) {
  closeNoticeBtn.addEventListener('click', () => {
    const nb = document.getElementById('notice-box');
    if (nb) nb.style.display = 'none';
  });
}

if (leaderboardBtn) leaderboardBtn.addEventListener('click', showLeaderboardPage);
if (backBtn) backBtn.addEventListener('click', showDashboardPage);

// ========== 登录 ==========
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username === config.username && password === config.password) {
    if (autoLoginCheckbox.checked) {
      localStorage.setItem('autoLogin', 'true');
    } else {
      localStorage.removeItem('autoLogin');
    }
    showDashboardPage();
  } else {
    alert('❌ 用户名或密码错误！');
  }
  });
}

// ========== 初始化 ==========
window.addEventListener('load', async () => {
  await loadConfig();
  // 恢复班级列表与选择
  loadClasses();
  const savedClass = localStorage.getItem('currentClass');
  if (savedClass && classes && classes.includes(savedClass)) {
    currentClass = savedClass;
  } else {
    // 默认第一个班级
    currentClass = classes && classes.length ? classes[0] : '班级1';
    localStorage.setItem('currentClass', currentClass);
  }
  // 将自定义标题应用到浏览器标签页
  if (config.title) {
    document.title = `欢迎使用${config.title}！`;
  }
  // 登录页面显示控制
  if (config.login) {
    // 支持自动登录
    const autoLogin = localStorage.getItem('autoLogin') === 'true';
    if (autoLogin) {
      showDashboardPage();
    } else {
      showLoginPage();
    }
  } else {
    // 不需要登录，直接进入管理页面
    showDashboardPage();
    loginPage.style.display = 'none';
  }
});

// ========== 自定义背景与模糊控制 ==========
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

async function checkAndApplyBackground() {
  const fileName = isMobileDevice() ? 'mob.png' : 'pc.png';
  try {
    // 尝试 HEAD 请求以检测文件是否存在
    const res = await fetch(fileName + '?_=' + Date.now(), { method: 'HEAD' });
    if (res.ok) {
      const url = fileName;
      document.body.style.backgroundImage = `url('${url}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center center';
      document.body.classList.add('has-custom-bg');

      // 载入图片并判断亮度，以便在颜色较暗时调整菜单/标题文字为浅色
      try {
        await (async () => {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url + '?_=' + Date.now();
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const w = 40;
                const h = Math.max(1, Math.round(img.height * (40 / img.width)));
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const data = ctx.getImageData(0, 0, w, h).data;
                let totalL = 0;
                let count = 0;
                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  // 相对亮度公式
                  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                  totalL += l;
                  count++;
                }
                const avgL = totalL / count; // 0-255
                // 如果平均亮度较低（阈值：80），则认为图片偏暗
                if (avgL < 80) {
                  document.body.classList.add('bg-is-dark');
                } else {
                  document.body.classList.remove('bg-is-dark');
                }
              } catch (e) {
                // 处理 canvas 跨域或其他错误，保守不设置 bg-is-dark
                console.warn('分析背景亮度失败：', e);
              }
              resolve();
            };
            img.onerror = () => resolve();
          });
        })();
      } catch (e) {
        console.warn('背景亮度检测异常：', e);
      }
      return;
    }
  } catch (e) {
    // 忽略错误
  }
  // 未找到自定义背景，移除样式与类
  document.body.style.backgroundImage = '';
  document.body.classList.remove('has-custom-bg');
  document.body.classList.remove('bg-is-dark');
}

// 检查背景并在窗口调整或方向改变时重新检查
window.addEventListener('load', checkAndApplyBackground);
window.addEventListener('resize', () => { setTimeout(checkAndApplyBackground, 200); });
window.addEventListener('orientationchange', () => { setTimeout(checkAndApplyBackground, 200); });