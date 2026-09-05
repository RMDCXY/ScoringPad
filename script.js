// DOM 元素
const themeToggle = document.getElementById('theme-toggle');
const searchToggle = document.getElementById('search-toggle');
const moreToggle = document.getElementById('more-toggle');
const classToggle = document.getElementById('class-toggle');
const dashboardPage = document.getElementById('dashboard-page');
const leaderboardPage = document.getElementById('leaderboard-page');
const randomPickPage = document.getElementById('random-pick-page');
const addStudentBtn = document.getElementById('add-student-btn');
const batchAddBtn = document.getElementById('batch-add-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const backBtn = document.getElementById('back-btn');
const randomPickBackBtn = document.getElementById('random-pick-back-btn');
const screenshotBtn = document.getElementById('screenshot-btn');
const studentsList = document.getElementById('students-list');
const rankedList = document.getElementById('ranked-list');
const pickCountOutput = document.getElementById('pick-count');
const pickCountDecrease = document.getElementById('pick-count-decrease');
const pickCountIncrease = document.getElementById('pick-count-increase');
const advancedPick = document.getElementById('advanced-pick');
const pickStudentList = document.getElementById('pick-student-list');
const startRandomPick = document.getElementById('start-random-pick');
const randomPickResult = document.getElementById('random-pick-result');
const randomPickResultText = document.getElementById('random-pick-result-text');
const closeNoticeBtn = document.getElementById('close-notice');
const dismissNoticeBtn = document.getElementById('dismiss-notice');
const fileInput = document.getElementById('file-input');

const noticeCookieName = 'scoringpad_notice_dismissed';

const aboutInfo = '本项目基于ScoringPad构建。ScoringPad,Score anytime,score more！\nGithub repo:https://github.com/RMDCXY/ScoringPad \n本项目使用vibe coding实现。\n当前ScoringPad版本：1.';

function hasDismissedNotice() {
  return document.cookie.split('; ').some(cookie => cookie.startsWith(`${noticeCookieName}=`));
}

function hideNotice() {
  const notice = document.getElementById('notice-box');
  if (notice) notice.style.display = 'none';
}

if (hasDismissedNotice()) hideNotice();

let isTwoColumnLayout = false;
let _layoutDisabledByWidth = false; // 当窗口过窄时，更多菜单中的排列选项被禁用
let _prevLayoutBeforeForce = null; // 记录被强制前的排列方式，以便恢复


// 仅为表情符号应用 Fluent Emoji，普通文字继续使用页面默认字体
const emojiPattern = /(\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*|\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3)/gu;

function markEmojis(root) {
  if (!(root instanceof Node)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && node.parentElement.closest('script, style, .emoji')) continue;
    if (emojiPattern.test(node.nodeValue)) textNodes.push(node);
    emojiPattern.lastIndex = 0;
  }

  textNodes.forEach(textNode => {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    emojiPattern.lastIndex = 0;
    let match;
    while ((match = emojiPattern.exec(textNode.nodeValue))) {
      fragment.appendChild(document.createTextNode(textNode.nodeValue.slice(lastIndex, match.index)));
      const emoji = document.createElement('span');
      emoji.className = 'emoji';
      emoji.textContent = match[0];
      fragment.appendChild(emoji);
      lastIndex = match.index + match[0].length;
    }
    fragment.appendChild(document.createTextNode(textNode.nodeValue.slice(lastIndex)));
    if (textNode.parentNode) textNode.parentNode.replaceChild(fragment, textNode);
  });
}

markEmojis(document.body);
new MutationObserver(records => {
  records.forEach(record => {
    record.addedNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.parentElement) markEmojis(node.parentElement);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        markEmojis(node);
      }
    });
  });
}).observe(document.body, { childList: true, subtree: true });

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
let randomPickFlashTimer = null;
let confettiTimer = null;
let randomPickInProgress = false;

function setRandomPickBusy(isBusy) {
  randomPickInProgress = isBusy;
  if (!startRandomPick) return;
  startRandomPick.disabled = isBusy;
  startRandomPick.setAttribute('aria-disabled', String(isBusy));
  startRandomPick.classList.toggle('is-picking', isBusy);
}

function clearRandomPickEffects() {
  if (randomPickFlashTimer) {
    clearInterval(randomPickFlashTimer);
    randomPickFlashTimer = null;
  }
  if (confettiTimer) {
    clearTimeout(confettiTimer);
    confettiTimer = null;
  }
  document.querySelectorAll('.random-pick-confetti').forEach(element => element.remove());
  setRandomPickBusy(false);
}

function showDashboardPage() {
  clearRandomPickEffects();
  dashboardPage.classList.remove('hidden');
  leaderboardPage.classList.add('hidden');
  randomPickPage.classList.add('hidden');
  renderStudents();
}

function showLeaderboardPage() {
  clearRandomPickEffects();
  dashboardPage.classList.add('hidden');
  leaderboardPage.classList.remove('hidden');
  randomPickPage.classList.add('hidden');
  renderLeaderboard();
}

function showRandomPickPage() {
  clearRandomPickEffects();
  dashboardPage.classList.add('hidden');
  leaderboardPage.classList.add('hidden');
  randomPickPage.classList.remove('hidden');
  renderPickStudents();
  updatePickCount();
  randomPickResult.classList.add('hidden');
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
  if (!randomPickPage.classList.contains('hidden')) renderPickStudents();
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

  const layoutItem = document.createElement('div');
  layoutItem.className = 'more-item';
  layoutItem.id = 'more-layout-item';
  layoutItem.innerText = '🔍 排列方式';
  if (_layoutDisabledByWidth) {
    layoutItem.classList.add('disabled');
  } else {
    layoutItem.addEventListener('click', (e) => { e.stopPropagation(); toggleStudentLayout(); });
  }

  const randomItem = document.createElement('div');
  randomItem.className = 'more-item';
  randomItem.innerText = '🎲 随机抽选';
  randomItem.addEventListener('click', (e) => { e.stopPropagation(); showRandomPickPage(); closeMoreMenu(); });

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
  zeroItem.innerText = '↻ 一键清零';
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
  menu.appendChild(layoutItem);
  menu.appendChild(randomItem);
  menu.appendChild(clearItem);
  menu.appendChild(zeroItem);
  menu.appendChild(aboutItem);
  document.body.appendChild(menu);
  _moreMenuEl = menu;
  return menu;
}

function updateLayoutOptionByWidth() {
  const narrow = window.innerWidth < 600;
  if (narrow) {
    if (!_layoutDisabledByWidth) {
      _layoutDisabledByWidth = true;
      _prevLayoutBeforeForce = isTwoColumnLayout;
      if (isTwoColumnLayout) {
        isTwoColumnLayout = false;
        renderStudents();
      }
      // 如果菜单已经存在，禁用对应项（并移除事件）
      const li = document.querySelector('#more-menu .more-item#more-layout-item');
      if (li) {
        const clone = li.cloneNode(true);
        clone.classList.add('disabled');
        li.parentNode.replaceChild(clone, li);
      }
    }
  } else {
    if (_layoutDisabledByWidth) {
      _layoutDisabledByWidth = false;
      if (_prevLayoutBeforeForce !== null) {
        isTwoColumnLayout = _prevLayoutBeforeForce;
        _prevLayoutBeforeForce = null;
        renderStudents();
      }
      // 如果菜单存在，恢复对应项的点击行为
      const li = document.querySelector('#more-menu .more-item#more-layout-item');
      if (li) {
        const clone = li.cloneNode(true);
        clone.id = 'more-layout-item';
        clone.classList.remove('disabled');
        clone.addEventListener('click', (e) => { e.stopPropagation(); toggleStudentLayout(); });
        li.parentNode.replaceChild(clone, li);
      }
    }
  }
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
    if (!randomPickPage.classList.contains('hidden')) renderPickStudents();
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
    if (!randomPickPage.classList.contains('hidden')) renderPickStudents();
  } else {
    closeClassMenu();
  }
}

function handleAbout() {
  closeMoreMenu();
  alert(aboutInfo);
}
function loadLayoutMode() {
  const mode = localStorage.getItem('studentLayoutMode');
  isTwoColumnLayout = mode === 'two';
}

function saveLayoutMode() {
  localStorage.setItem('studentLayoutMode', isTwoColumnLayout ? 'two' : 'single');
}

function updateStudentListLayout() {
  if (!studentsList) return;
  // 更新 student-list 的两列/单列类（不再包含针对手机端的特殊处理）
  studentsList.classList.toggle('two-column-layout', isTwoColumnLayout);
}

function updateStudentListCompactMode() {
  if (!studentsList) return;
  // 紧凑模式仅在实际启用了两列布局时考虑
  if (!studentsList.classList.contains('two-column-layout')) {
    studentsList.classList.remove('compact-two-column');
    return;
  }
  // 使用真实列宽计算（考虑 gap），避免容器内 padding/滚动导致误判
  const rect = studentsList.getBoundingClientRect();
  const style = window.getComputedStyle(studentsList);
  // 解析 gap（grid column gap），若不存在则回退到 12px
  let gap = parseFloat(style.columnGap || style.gap || '12');
  if (isNaN(gap)) gap = 12;
  const available = Math.max(0, rect.width - gap);
  const colWidth = available / 2;
  // 如果每列宽度小于阈值则启用紧凑模式；阈值设为 110px（更保守）
  const compact = colWidth < 110;
  studentsList.classList.toggle('compact-two-column', compact);
}

function toggleStudentLayout() {
  isTwoColumnLayout = !isTwoColumnLayout;
  saveLayoutMode();
  closeMoreMenu();
  renderStudents();
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

    // 2) 删除 classes 与 currentClass 等会话数据
    localStorage.removeItem('classes');
    localStorage.removeItem('currentClass');

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
  // 布局与紧凑模式将在渲染完学生项后计算，以使用正确的容器尺寸

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

  // 渲染完成后再应用布局与紧凑判断，避免在空容器上误判
  updateStudentListLayout();
  updateStudentListCompactMode();
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
let pickCount = 1;

function getPickCandidates() {
  const students = loadStudents();
  if (!advancedPick.checked) return students;
  return students.filter((student, index) => {
    const checkbox = pickStudentList.querySelector(`input[data-student-index="${index}"]`);
    return checkbox && checkbox.checked;
  });
}

function updatePickCount() {
  const total = getPickCandidates().length || loadStudents().length;
  pickCount = Math.max(1, Math.min(pickCount, total || 1));
  pickCountOutput.textContent = pickCount;
  pickCountDecrease.disabled = pickCount <= 1;
  pickCountIncrease.disabled = pickCount >= total;
}

function renderPickStudents() {
  const students = loadStudents();
  pickStudentList.innerHTML = '';
  students.forEach((student, index) => {
    const label = document.createElement('label');
    label.className = 'pick-student-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.studentIndex = index;
    checkbox.addEventListener('change', updatePickCount);
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(student.name));
    pickStudentList.appendChild(label);
  });
  updatePickCount();
}

function pickRandomNames(candidates, count) {
  return candidates.slice().sort(() => Math.random() - 0.5).slice(0, count).map(student => student.name);
}

function showPickResult(names) {
  randomPickResultText.textContent = names.join('、');
}

function flashPickResult(names) {
  showPickResult(names);
}

function showConfetti() {
  clearRandomPickEffects();
  const colors = ['#2196F3', '#FFC107', '#4CAF50', '#e91e63', '#ff7043'];
  const container = document.createElement('div');
  container.className = 'random-pick-confetti';
  for (let index = 0; index < 80; index += 1) {
    const piece = document.createElement('span');
    piece.style.setProperty('--confetti-color', colors[index % colors.length]);
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${-(18 + Math.random() * 90)}px`;
    piece.style.setProperty('--confetti-duration', '12s');
    piece.style.setProperty('--confetti-drift', `${(Math.random() - 0.5) * 180}px`);
    piece.style.setProperty('--confetti-rotation', `${Math.random() * 720 - 360}deg`);
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  confettiTimer = setTimeout(() => {
    container.remove();
    confettiTimer = null;
  }, 12000);
}

function runRandomPick() {
  if (randomPickInProgress) return;
  const candidates = getPickCandidates();
  if (candidates.length === 0) {
    alert('❌ 没有可抽选的学生！');
    return;
  }
  if (pickCount > candidates.length) {
    alert('❌ 抽选人数不能大于可抽选学生数！');
    updatePickCount();
    return;
  }

  setRandomPickBusy(true);
  randomPickResult.classList.remove('hidden');
  randomPickResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  let flashCount = 0;
  randomPickFlashTimer = setInterval(() => {
    flashPickResult(pickRandomNames(candidates, pickCount));
    flashCount += 1;
    if (flashCount >= 20) {
      clearInterval(randomPickFlashTimer);
      randomPickFlashTimer = null;
      showPickResult(pickRandomNames(candidates, pickCount));
      setRandomPickBusy(false);
      showConfetti();
    }
  }, 150);
  showPickResult(pickRandomNames(candidates, pickCount));
}

if (pickCountDecrease) pickCountDecrease.addEventListener('click', () => { pickCount -= 1; updatePickCount(); });
if (pickCountIncrease) pickCountIncrease.addEventListener('click', () => { pickCount += 1; updatePickCount(); });
if (advancedPick) advancedPick.addEventListener('change', () => {
  pickStudentList.classList.toggle('hidden', !advancedPick.checked);
  updatePickCount();
});
if (startRandomPick) startRandomPick.addEventListener('click', runRandomPick);

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
    hideNotice();
  });
}

if (dismissNoticeBtn) {
  dismissNoticeBtn.addEventListener('click', () => {
    document.cookie = `${noticeCookieName}=1; max-age=31536000; path=/; SameSite=Lax`;
    hideNotice();
  });
}

if (leaderboardBtn) leaderboardBtn.addEventListener('click', showLeaderboardPage);
if (backBtn) backBtn.addEventListener('click', showDashboardPage);
if (randomPickBackBtn) randomPickBackBtn.addEventListener('click', showDashboardPage);

window.addEventListener('resize', () => {
  updateStudentListLayout();
  updateStudentListCompactMode();
  updateLayoutOptionByWidth();
});

// ========== 初始化 ==========
window.addEventListener('load', () => {
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
  // 读取布局设置
  loadLayoutMode();
  showDashboardPage();
  // 根据当前窗口宽度强制或恢复排列方式选项状态
  updateLayoutOptionByWidth();
});

