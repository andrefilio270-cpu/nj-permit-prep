// js/dialog.js — in-page confirmation dialog. Replaces window.confirm(), which hosted/embedded pages
// may block (it then returns false silently). Loaded by index.html after i18n.js; global Dialog.

const Dialog = {
  // Dialog.confirm('message') → Promise<boolean>
  confirm(msg) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'dialog-overlay';
      wrap.innerHTML =
        '<div class="dialog-box pop-in" role="alertdialog" aria-modal="true">' +
        '<p class="dialog-msg"></p>' +
        '<div class="dialog-btns">' +
        '<button class="btn ghost" data-v="0">' + I18N.t('cancel') + '</button>' +
        '<button class="btn primary" data-v="1">' + I18N.t('confirm_ok') + '</button>' +
        '</div></div>';
      wrap.querySelector('.dialog-msg').textContent = msg;
      const onKey = e => { if (e.key === 'Escape') done(false); };
      const done = v => { document.removeEventListener('keydown', onKey); wrap.remove(); resolve(v); };
      wrap.addEventListener('click', e => {
        const b = e.target.closest('[data-v]');
        if (b) done(b.getAttribute('data-v') === '1');
        else if (e.target === wrap) done(false);
      });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(wrap);
      wrap.querySelector('.btn.primary').focus();
    });
  }
};
