async function loadButtons() {
  const res = await fetch('/api/buttons');
  const groups = await res.json();
  const container = document.getElementById('buttons');
  container.innerHTML = '';
  groups.forEach(groupObj => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'button-group-title-new';
    groupDiv.textContent = groupObj.group;
    container.appendChild(groupDiv);
    const itemsWrap = document.createElement('div');
    itemsWrap.className = 'button-group-items-wrap';
    groupObj.items.forEach(btn => {
      const btnDiv = document.createElement('div');
      btnDiv.className = 'button-group-item-new';
      const handle = document.createElement('span');
      handle.className = 'handle-fake';
      handle.innerHTML = '';
      handle.style.cursor = 'default';
      handle.style.pointerEvents = 'none';
      btnDiv.appendChild(handle);
      const a = document.createElement('a');
      
      // URL 처리: 빈 문자열이면 비활성화, 로컬 경로면 file:// 추가
      let processedLink = (btn.link || '').trim();
      if (processedLink) {
        // 로컬 드라이브 경로 감지 (C:\, D:\ 등)
        if (/^[A-Za-z]:[\\/]/.test(processedLink)) {
          processedLink = 'file:///' + processedLink.replace(/\\/g, '/');
        }
        a.href = processedLink;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      } else {
        // URL이 비어있으면 클릭 비활성화
        a.href = 'javascript:void(0)';
        a.style.cursor = 'default';
        a.style.opacity = '0.6';
        a.onclick = (e) => { e.preventDefault(); return false; };
      }
      
      a.textContent = btn.name;
      btnDiv.appendChild(a);
      itemsWrap.appendChild(btnDiv);
    });
    container.appendChild(itemsWrap);
  });
}

let lastFocusedGroupIndex = 0;

async function showModal() {
  const res = await fetch('/api/buttons');
  let data = await res.json();

  function attachGroupFocusHandlers(gidx, el) {
    el.onfocus = () => { lastFocusedGroupIndex = gidx; };
    el.onclick = () => { lastFocusedGroupIndex = gidx; };
    el.addEventListener('mousedown', e => { e.stopPropagation(); });
    el.style.pointerEvents = 'auto';
    el.style.cursor = 'text';
  }

  function bindValue(el, getter, setter) {
    const update = () => setter(el.value);
    el.addEventListener('input', update);
    el.addEventListener('change', update);
    el.addEventListener('blur', update);
    el.addEventListener('mousedown', e => { e.stopPropagation(); });
    el.addEventListener('click', () => { el.focus(); });
    el.setAttribute('autocomplete', 'off');
    el.style.pointerEvents = 'auto';
    el.style.cursor = 'text';
    el.value = getter() || '';
  }

  function renderTreeEdit() {
    const container = document.getElementById('edit-list');
    container.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'tree-edit-group-root';

    data.forEach((group, gidx) => {
      const groupLi = document.createElement('li');
      groupLi.className = 'tree-group-li';
      groupLi.setAttribute('data-gidx', gidx);

      const groupRow = document.createElement('div');
      groupRow.className = 'tree-group-row';
      const handle = document.createElement('span');
      handle.className = 'handle';
      handle.innerHTML = '☰';
      groupRow.appendChild(handle);

      const groupInput = document.createElement('input');
      groupInput.className = 'tree-group-input';
      bindValue(groupInput, () => group.group, v => { group.group = v; });
      attachGroupFocusHandlers(gidx, groupInput);
      groupRow.appendChild(groupInput);

      const gdel = document.createElement('button');
      gdel.className = 'tree-group-remove';
      gdel.textContent = '삭제';
      gdel.onclick = () => { data.splice(gidx, 1); renderTreeEdit(); setupAllSortables(); };
      groupRow.appendChild(gdel);

      groupLi.appendChild(groupRow);

      const childUl = document.createElement('ul');
      childUl.className = 'tree-item-root';

      group.items.forEach((btn, bidx) => {
        const itemLi = document.createElement('li');
        itemLi.className = 'tree-item-li';
        itemLi.setAttribute('data-bidx', bidx);
        itemLi.style.display = 'flex';
        itemLi.style.alignItems = 'center';

        const handle2 = document.createElement('span');
        handle2.className = 'handle';
        handle2.innerHTML = '☰';
        itemLi.appendChild(handle2);

        const iname = document.createElement('input');
        iname.className = 'tree-item-input';
        iname.placeholder = '이름';
        iname.style.flex = '0 1 220px';
        iname.style.maxWidth = '226px';
        iname.onfocus = () => { lastFocusedGroupIndex = gidx; };
        bindValue(iname, () => btn.name, v => { btn.name = v; });
        itemLi.appendChild(iname);

        const ilink = document.createElement('input');
        ilink.className = 'tree-item-link';
        ilink.placeholder = 'URL';
        ilink.style.flex = '1 1 390px';
        ilink.style.maxWidth = '490px';
        ilink.onfocus = () => { lastFocusedGroupIndex = gidx; };
        bindValue(ilink, () => btn.link, v => { btn.link = v; });
        itemLi.appendChild(ilink);

        const rmbtn = document.createElement('button');
        rmbtn.className = 'tree-item-remove';
        rmbtn.textContent = '삭제';
        rmbtn.style.marginLeft = 'auto';
        rmbtn.onclick = () => { data[gidx].items.splice(bidx, 1); renderTreeEdit(); setupAllSortables(); };
        itemLi.appendChild(rmbtn);

        childUl.appendChild(itemLi);
      });

      groupLi.appendChild(childUl);
      ul.appendChild(groupLi);
    });

    container.appendChild(ul);

    let addGroupBtn = document.getElementById('add-group-btn');
    if (!addGroupBtn) {
      addGroupBtn = document.createElement('button');
      addGroupBtn.id = 'add-group-btn';
      addGroupBtn.type = 'button';
      addGroupBtn.innerHTML = '<span class="plus">+</span> 그룹';
      addGroupBtn.className = 'tree-group-add';
      addGroupBtn.onclick = () => {
        data.push({ group: '새그룹', items: [] });
        lastFocusedGroupIndex = data.length - 1;
        renderTreeEdit(); setupAllSortables();
        setTimeout(() => {
          const newGroup = document.querySelectorAll('.tree-group-li')[lastFocusedGroupIndex];
          if (newGroup) {
            const input = newGroup.querySelector('.tree-group-input');
            if (input) {
              const editList = document.getElementById('edit-list');
              const groupTop = newGroup.offsetTop;
              const groupHeight = newGroup.offsetHeight;
              const listHeight = editList.clientHeight;
              editList.scrollTop = groupTop - (listHeight / 2) + (groupHeight / 2);
              setTimeout(() => {
                input.focus();
                input.select();
              }, 150);
            }
          }
        }, 100);
      };
      container.parentNode.insertBefore(addGroupBtn, container.nextSibling);
    }
    let addSiteBtn = document.getElementById('add-site-btn');
    if (!addSiteBtn) {
      addSiteBtn = document.createElement('button');
      addSiteBtn.id = 'add-site-btn';
      addSiteBtn.type = 'button';
      addSiteBtn.innerHTML = '<span class="plus">+</span> 사이트';
      addSiteBtn.className = 'tree-group-add';
      addSiteBtn.onclick = () => {
        if (!data.length) return;
        const target = data[Math.min(Math.max(lastFocusedGroupIndex, 0), data.length - 1)];
        target.items.push({ name: '', link: '' });
        renderTreeEdit(); setupAllSortables();
        setTimeout(() => {
          const targetGroup = document.querySelectorAll('.tree-group-li')[lastFocusedGroupIndex];
          if (targetGroup) {
            const itemRoot = targetGroup.querySelector('.tree-item-root');
            if (itemRoot) {
              const lastItem = itemRoot.lastElementChild;
              if (lastItem) {
                const nameInput = lastItem.querySelector('.tree-item-input');
                if (nameInput) {
                  const editList = document.getElementById('edit-list');
                  const itemTop = lastItem.offsetTop;
                  const itemHeight = lastItem.offsetHeight;
                  const listHeight = editList.clientHeight;
                  editList.scrollTop = itemTop - (listHeight / 2) + (itemHeight / 2);
                  setTimeout(() => {
                    nameInput.focus();
                    nameInput.select();
                  }, 150);
                }
              }
            }
          }
        }, 100);
      };
      container.parentNode.insertBefore(addSiteBtn, addGroupBtn.nextSibling);
    }

    document.querySelectorAll('.tree-item-add').forEach(el => el.style.display = 'none');
  }

  function setupAllSortables() {
    Sortable.create(document.querySelector('.tree-edit-group-root'), {
      handle: '.handle',
      animation: 160,
      filter: '.tree-group-input',
      onEnd: evt => {
        if (evt.oldIndex === evt.newIndex) return;
        const moved = data.splice(evt.oldIndex, 1)[0];
        data.splice(evt.newIndex, 0, moved);
        renderTreeEdit(); setupAllSortables();
      }
    });

    const allRoots = Array.from(document.querySelectorAll('.tree-item-root'));
    allRoots.forEach((ul, gidx) => {
      Sortable.create(ul, {
        handle: '.handle',
        animation: 140,
        group: 'button-shared',
        filter: '.tree-item-input, .tree-item-link',
        onEnd: evt => {
          const fromGIdx = gidx;
          const toGIdx = allRoots.indexOf(evt.to);
          if (!data[fromGIdx] || !data[toGIdx]) return;
          const moved = data[fromGIdx].items.splice(evt.oldIndex, 1)[0];
          data[toGIdx].items.splice(evt.newIndex, 0, moved);
          lastFocusedGroupIndex = toGIdx;
          renderTreeEdit(); setupAllSortables();
        }
      });
    });
  }

  function syncFromDom() {
    const groupNodes = document.querySelectorAll('.tree-group-li');
    data = Array.from(groupNodes).map((gNode) => {
      const name = gNode.querySelector('.tree-group-input')?.value || '';
      const itemNodes = gNode.querySelectorAll('.tree-item-li');
      const items = Array.from(itemNodes).map(n => {
        const nameInput = n.querySelector('.tree-item-input');
        const linkInput = n.querySelector('.tree-item-link');
        return { name: nameInput ? nameInput.value : '', link: linkInput ? linkInput.value : '' };
      });
      return { group: name, items };
    });
  }

  renderTreeEdit();
  setupAllSortables();

  document.getElementById('modal-save').onclick = async () => {
    syncFromDom();
    await fetch('/api/buttons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    document.getElementById('modal-bg').style.display = 'none';
    loadButtons();
    const addGroupBtn = document.getElementById('add-group-btn'); if (addGroupBtn) addGroupBtn.remove();
    const addSiteBtn = document.getElementById('add-site-btn'); if (addSiteBtn) addSiteBtn.remove();
  };
  document.getElementById('modal-cancel').onclick = () => {
    document.getElementById('modal-bg').style.display = 'none';
    const addGroupBtn = document.getElementById('add-group-btn'); if (addGroupBtn) addGroupBtn.remove();
    const addSiteBtn = document.getElementById('add-site-btn'); if (addSiteBtn) addSiteBtn.remove();
  };
  document.getElementById('modal-bg').style.display = 'flex';
}

document.getElementById('edit-btn').onclick = showModal;
window.onload = loadButtons;


// 모달 요소 가져오기
const modalBg = document.getElementById('modal-bg');
const modalCancelBtn = document.getElementById('modal-cancel');

// 공통으로 모달 닫는 함수
function closeModal() {
  if (modalBg) {
    modalBg.style.display = 'none';
  }
}

// ESC 키로 닫기
document.addEventListener('keydown', function (e) {
  // 키가 Escape인지 체크
  if (e.key === 'Escape' || e.key === 'Esc') {
    // 모달이 열려 있을 때만 닫기
    if (modalBg && modalBg.style.display !== 'none') {
      closeModal();
    }
  }
});