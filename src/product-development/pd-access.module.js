  function productDevelopmentFeatureForView(view) {
    return ({ review: 'development-review', copywriting: 'development-copywriting', ingredient: 'development-ingredient', ingredientFacts: 'development-ingredient' })[view] || '';
  }

  function productDevelopmentHasAccess(feature) {
    const access = state.productDevelopmentAccess;
    const name = findCurrentPlmUserName();
    return Boolean(name && access && access.name === name && access[feature] === true);
  }

  function productDevelopmentFeatureForAction(action, target) {
    if (action === 'product-development-task-tab') return productDevelopmentFeatureForView(target && target.getAttribute('data-product-development-tab'));
    if (/^product-development-review-/.test(action)) return 'development-review';
    if (/^product-development-(?:ingredient-|one-shot-ingredient-|one-shot-download-pdf)/.test(action) || /copywriting-(?:one-shot-run|ingredient-run)/.test(action)) return 'development-ingredient';
    if (/^product-development-(?:copywriting-|one-shot-download-copywriting|one-shot-name-)/.test(action)) return 'development-copywriting';
    return '';
  }

  function showProductDevelopmentPermissionDialog() {
    const existing = document.querySelector('.pfh-development-permission-dialog');
    if (existing) { existing.focus(); return; }
    const previousFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'pfh-development-permission-dialog';
    dialog.setAttribute('aria-labelledby', 'pfh-development-permission-title');
    dialog.innerHTML = '<img src="' + PRODUCT_DEVELOPMENT_PERMISSION_ART + '" alt="派蒙抬手提示" width="160" height="160"><strong id="pfh-development-permission-title">派蒙提示</strong><p>前面的区域，以后再来探索吧</p><form method="dialog"><button autofocus>知道啦</button></form>';
    dialog.addEventListener('close', () => { dialog.remove(); if (previousFocus && previousFocus.isConnected) previousFocus.focus(); }, { once: true });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
    document.body.appendChild(dialog);
    dialog.showModal();
  }
