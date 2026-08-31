/* ═══════════════════════════════════════════════════════════
   Mojo Carrot Pet — Context Menu (Right-click)
   macOS-style dropdown with pet settings
   ═══════════════════════════════════════════════════════════ */

class PetContextMenu {
  constructor() {
    this.menuEl = document.getElementById('context-menu');
    this.isOpen = false;

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.menuEl.contains(e.target)) {
        this.close();
      }
    });

    // Close when window loses focus (clicks on desktop outside the app)
    if (window.petAPI && window.petAPI.onWindowBlur) {
      window.petAPI.onWindowBlur(() => {
        if (this.isOpen) this.close();
      });
    }
  }

  /**
   * Open context menu to the right of the pet
   */
  open() {
    this.menuEl.innerHTML = this._buildMenuHTML();
    this.menuEl.classList.remove('hidden');
    this.isOpen = true;

    // Position to the right of the canvas
    const canvasRect = pet.canvas.getBoundingClientRect();
    const menuRect = this.menuEl.getBoundingClientRect();

    let left = canvasRect.right + 10;
    let top = canvasRect.top + 20;

    // Ensure it doesn't go off-screen
    const maxX = window.innerWidth - menuRect.width - 5;
    const maxY = window.innerHeight - menuRect.height - 5;

    if (left > maxX) {
      left = canvasRect.left - menuRect.width - 10; // Put on left side if no space on right
    }

    this.menuEl.style.left = Math.min(Math.max(5, left), maxX) + 'px';
    this.menuEl.style.top = Math.min(Math.max(5, top), maxY) + 'px';

    // Bind actions
    this._bindActions();

    if (window.__petInteractionManager) {
      window.__petInteractionManager._updateMousePassthrough();
    }
  }

  close() {
    this.menuEl.classList.add('hidden');
    this.isOpen = false;

    if (window.__petInteractionManager) {
      window.__petInteractionManager._updateMousePassthrough();
    }
  }

  // ─── Menu Structure ─────────────────────────────────────

  _buildMenuHTML() {
    const scale = Math.round(PET_SETTINGS.scale * 100);
    const opacity = Math.round(PET_SETTINGS.opacity * 100);

    return `
      <div class="ctx-item ctx-title">
        🥕 卜卜设置
      </div>
      <div class="ctx-separator"></div>

      <div class="ctx-item" data-action="poke">
        <span class="ctx-icon">👆</span> 戳一下
      </div>
      <div class="ctx-item" data-action="wave">
        <span class="ctx-icon">👋</span> 打招呼
      </div>

      <div class="ctx-separator"></div>

      <div class="ctx-item-slider">
        <div class="slider-header">
          <span><span class="ctx-icon">🔍</span> 大小</span>
          <span class="ctx-sublabel" id="scale-val">${scale}%</span>
        </div>
        <input type="range" id="scale-slider" min="40" max="150" value="${scale}">
      </div>

      <div class="ctx-item-slider">
        <div class="slider-header">
          <span><span class="ctx-icon">◻️</span> 透明度</span>
          <span class="ctx-sublabel" id="opacity-val">${opacity}%</span>
        </div>
        <input type="range" id="opacity-slider" min="20" max="100" value="${opacity}">
      </div>

      <div class="ctx-separator"></div>

      <div class="ctx-item" data-action="toggle-edge-hide">
        <span class="ctx-icon">${PET_SETTINGS.edgeHideEnabled ? '✅' : '⬜'}</span>
        边缘自动隐藏
      </div>

      <div class="ctx-item" data-action="toggle-always-on-top">
        <span class="ctx-icon">${PET_SETTINGS.alwaysOnTop ? '✅' : '⬜'}</span>
        窗口置顶
      </div>

      <div class="ctx-item" data-action="reset-position">
        <span class="ctx-icon">📍</span> 重置位置
      </div>

      <div class="ctx-item" data-action="open-config">
        <span class="ctx-icon">⚙️</span> 自定义对话
      </div>

      <div class="ctx-separator"></div>

      <div class="ctx-item" data-action="hide">
        <span class="ctx-icon">👻</span> 隐藏卜卜
        <span class="ctx-sublabel">托盘恢复</span>
      </div>
    `;
  }

  // ─── Action Handlers ────────────────────────────────────

  _bindActions() {
    // Buttons
    this.menuEl.querySelectorAll('[data-action]').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = item.getAttribute('data-action');
        this._handleAction(action);
        e.stopPropagation();
      });
    });

    // Scale Slider
    const scaleSlider = document.getElementById('scale-slider');
    const scaleVal = document.getElementById('scale-val');
    if (scaleSlider) {
      scaleSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        scaleVal.textContent = val + '%';
        pet.applyScale(val / 100);
        savePetSettings();
      });
    }

    // Opacity Slider
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityVal = document.getElementById('opacity-val');
    if (opacitySlider) {
      opacitySlider.addEventListener('input', (e) => {
        const val = e.target.value;
        opacityVal.textContent = val + '%';
        pet.applyOpacity(val / 100);
        savePetSettings();
      });
    }
  }

  _handleAction(action) {
    switch (action) {
      case 'poke':
        this.close();
        pet.setState('clicked');
        speechBubble.showRandom('click');
        break;

      case 'wave':
        this.close();
        pet.setState('hover_talk');
        speechBubble.showRandom('hover');
        setTimeout(() => {
          if (pet.getState() === 'hover_talk') pet.setState('idle');
        }, 3000);
        break;

      case 'toggle-edge-hide':
        PET_SETTINGS.edgeHideEnabled = !PET_SETTINGS.edgeHideEnabled;
        savePetSettings();
        this.menuEl.innerHTML = this._buildMenuHTML();
        this._bindActions();
        break;

      case 'toggle-always-on-top':
        PET_SETTINGS.alwaysOnTop = !PET_SETTINGS.alwaysOnTop;
        if (window.petAPI) window.petAPI.setAlwaysOnTop(PET_SETTINGS.alwaysOnTop);
        savePetSettings();
        this.menuEl.innerHTML = this._buildMenuHTML();
        this._bindActions();
        break;

      case 'reset-position':
        this.close();
        if (window.petAPI) window.petAPI.resetPosition();
        break;

      case 'open-config':
        this.close();
        if (window.petAPI) window.petAPI.openUserConfig();
        break;

      case 'hide':
        this.close();
        if (window.petAPI) window.petAPI.hideWindow();
        break;
    }
  }
}

// Global instance
const contextMenu = new PetContextMenu();
