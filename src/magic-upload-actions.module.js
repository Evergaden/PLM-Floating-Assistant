  function handleMagicUploadPanelAction(event, actionTarget, action) {
    if (action === 'magic-upload-pick') {
      const input = ensurePanel().querySelector('.pfh-magic-upload-file');
      if (input) input.click();
      return true;
    }
    if (action === 'magic-upload-mode') {
      const nextMagicMode = actionTarget.getAttribute('data-magic-mode');
      state.magicUploadMode = nextMagicMode === 'effect' || nextMagicMode === 'toy-label' ? nextMagicMode : 'package';
      if (!renderMagicUploadModeContent(ensurePanel())) renderShell();
      return true;
    }
    if (action === 'magic-toy-label-add') {
      addMagicToyLabelTasks(state.magicToyLabelInput);
      return true;
    }
    if (action === 'magic-toy-label-start') {
      startMagicToyLabelQueue();
      return true;
    }
    if (action === 'magic-toy-label-pause') {
      state.magicToyLabelRunning = false;
      state.magicToyLabelStatus = '队列已暂停';
      saveMagicToyLabelQueue(state.magicToyLabelQueue);
      refreshMagicToyLabelPage();
      return true;
    }
    if (action === 'magic-toy-label-remove') {
      removeMagicToyLabelTask(actionTarget.getAttribute('data-magic-toy-label-id') || '');
      return true;
    }
    if (action === 'magic-toy-label-retry') {
      retryMagicToyLabelTask(actionTarget.getAttribute('data-magic-toy-label-id') || '');
      return true;
    }
    if (action === 'magic-toy-label-clear') {
      clearMagicToyLabelQueue();
      return true;
    }
    if (action === 'magic-toy-label-history-toggle') {
      state.magicToyLabelHistoryOpen = !state.magicToyLabelHistoryOpen;
      refreshMagicToyLabelPage();
      return true;
    }
    if (action === 'magic-toy-label-history-close') {
      if (actionTarget.classList && actionTarget.classList.contains('pfh-magic-history-modal') && event.target !== actionTarget) return true;
      state.magicToyLabelHistoryOpen = false;
      refreshMagicToyLabelPage();
      return true;
    }
    if (action === 'magic-toy-label-history-retry') {
      retryMagicToyLabelHistory(actionTarget.getAttribute('data-magic-toy-label-history-id') || '');
      return true;
    }
    if (action === 'magic-effect-start') {
      startMagicEffectQueueInline();
      return true;
    }
    if (action === 'magic-effect-pause') {
      state.uploadMode = 'toy-effect';
      pauseUploadQueue();
      return true;
    }
    if (action === 'magic-upload-replace') {
      state.magicUploadReplaceId = actionTarget.getAttribute('data-magic-id') || '';
      const input = ensurePanel().querySelector('.pfh-magic-upload-file');
      if (input) input.click();
      return true;
    }
    if (action === 'magic-upload-toggle-task') {
      toggleMagicUploadTask(actionTarget.getAttribute('data-magic-id') || '');
      return true;
    }
    if (action === 'magic-upload-file-up' || action === 'magic-upload-file-down') {
      moveMagicUploadFile(actionTarget.getAttribute('data-magic-id') || '', actionTarget.getAttribute('data-magic-file-index') || '', action === 'magic-upload-file-up' ? -1 : 1);
      return true;
    }
    if (action === 'magic-upload-history-toggle') {
      state.magicUploadHistoryOpen = !state.magicUploadHistoryOpen;
      renderShell();
      return true;
    }
    if (action === 'magic-upload-history-close') {
      if (actionTarget.classList && actionTarget.classList.contains('pfh-magic-history-modal') && event.target !== actionTarget) return true;
      state.magicUploadHistoryOpen = false;
      renderShell();
      return true;
    }
    if (action === 'magic-effect-history-toggle') {
      state.magicEffectHistoryOpen = !state.magicEffectHistoryOpen;
      renderShell();
      return true;
    }
    if (action === 'magic-effect-history-close') {
      if (actionTarget.classList && actionTarget.classList.contains('pfh-magic-history-modal') && event.target !== actionTarget) return true;
      state.magicEffectHistoryOpen = false;
      renderShell();
      return true;
    }
    if (action === 'magic-upload-history-retry') {
      retryMagicUploadHistory(actionTarget.getAttribute('data-magic-history-id') || '');
      return true;
    }
    if (action === 'magic-upload-start') {
      startMagicUploadQueue();
      return true;
    }
    if (action === 'magic-upload-pause') {
      state.magicUploadRunning = false;
      saveMagicUploadQueue(state.magicUploadQueue);
      renderShell();
      return true;
    }
    if (action === 'magic-upload-remove') {
      removeMagicUploadTask(actionTarget.getAttribute('data-magic-id') || '');
      return true;
    }
    if (action === 'magic-upload-clear') {
      clearMagicUploadQueue();
      return true;
    }
    if (action === 'magic-effect-clear') {
      clearMagicEffectQueue();
      return true;
    }
    if (action === 'magic-upload-retry') {
      retryMagicUploadTask(actionTarget.getAttribute('data-magic-id') || '');
      return true;
    }
    if (action === 'magic-upload-save-task') {
      saveMagicUploadTaskEdits(actionTarget.getAttribute('data-magic-id') || '');
      return true;
    }
    if (action === 'home-magic-upload') {
      if (!state.magicUploadAccessEnabled) {
        showToast(state.magicUploadAccessLoading ? '正在准备功能' : '魔法上传暂未开放，敬请期待');
        scheduleMagicUploadAccessRefresh(0);
        return true;
      }
      state.view = 'magicUpload';
      state.uploadReturnView = '';
      state.magicUploadMode = state.magicUploadMode === 'effect' || state.magicUploadMode === 'toy-label' ? state.magicUploadMode : 'package';
      expandPanel();
      renderShell();
      return true;
    }
    return false;
  }
