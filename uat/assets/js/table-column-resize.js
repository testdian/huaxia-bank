/** 表格列宽左右拖拽（localStorage 持久化） */
window.TableColumnResize = {
  init(tableEl, storageKey) {
    if (!tableEl || tableEl.dataset.colResizeBound === '1') return;
    const ths = Array.from(tableEl.querySelectorAll('thead th'));
    if (!ths.length) return;
    tableEl.dataset.colResizeBound = '1';
    const key = storageKey || `col_widths_${(location.hash || '#/tasks').split('?')[0]}`;
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(key) || '{}');
    } catch { /* ignore */ }

    ths.forEach((th, index) => {
      if (th.classList.contains('col-no-resize') || th.classList.contains('col-select')) return;
      if (saved[index]) th.style.width = saved[index];
      th.classList.add('th-resizable');
      const grip = document.createElement('span');
      grip.className = 'col-resize-grip';
      grip.title = '拖动调整列宽';
      th.appendChild(grip);

      const onMove = (e) => {
        const rect = th.getBoundingClientRect();
        const next = Math.max(48, e.clientX - rect.left);
        th.style.width = `${next}px`;
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.classList.remove('col-resizing');
        const widths = {};
        ths.forEach((cell, i) => {
          if (cell.style.width) widths[i] = cell.style.width;
        });
        localStorage.setItem(key, JSON.stringify(widths));
      };

      grip.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.add('col-resizing');
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }
};
