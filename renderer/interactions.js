/* ═══════════════════════════════════════════════════════════
   Mojo Carrot Pet — Interaction System
   Ties together: pet engine, speech bubbles, idle behaviors,
   context menu, edge hiding
   ═══════════════════════════════════════════════════════════ */

class InteractionManager {
  constructor() {
    // ─── State Tracking ───────────────────────────────────
    this.lastInteractionTime = Date.now();
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastDragX = 0;
    this.lastDragY = 0;

    // Click tracking
    this.clickCount = 0;
    this.clickTimer = null;

    // Hover tracking
    this.isHovering = false;
    this.lastHoverTrigger = 0;

    // Idle behavior tracking
    this.idleCheckInterval = null;
    this.idleBehaviorTimeout = null;
    this.wanderTimeout = null;
    this.wanderAnimFrame = null;
    this.currentIdleBehavior = null;  // 'typing' | 'daydream' | 'sleeping'
    this.mousePassthroughIgnored = null;

    // Sleep effect elements
    this.sleepEffect = document.getElementById('sleep-effect');

    // ─── Setup ────────────────────────────────────────────
    this._bindEvents();
    this._startIdleChecker();
    this._startWanderTimer();

    // Handle non-looping animation endings
    pet.onAnimationEnd = (animName) => {
      this._onAnimationEnd(animName);
    };

    console.log('[Interactions] Initialized — 卜卜已上线！🥕');
  }

  // ═══════════════════════════════════════════════════════
  // Event Binding
  // ═══════════════════════════════════════════════════════

  _bindEvents() {
    const canvas = pet.canvas;

    window.addEventListener('mousemove', (e) => this._updateMousePassthrough(e), true);
    window.addEventListener('mouseleave', () => this._setMousePassthrough(true));

    // Mouse enter/leave (hover)
    canvas.addEventListener('mouseenter', (e) => this._onMouseEnter(e));
    canvas.addEventListener('mouseleave', (e) => this._onMouseLeave(e));

    // Click
    canvas.addEventListener('click', (e) => this._onClick(e));

    // Right-click context menu
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._recordInteraction();
      // If sleeping, wake up first
      if (pet.getState() === 'sleeping') {
        this._wakeUp();
      }
      contextMenu.open(); // Position handled inside open() now
    });

    // Also allow right-click on body for when menu is open
    document.body.addEventListener('contextmenu', (e) => {
      if (e.target === canvas) return; // handled above
      e.preventDefault();
    });

    // Drag: mousedown on canvas starts native drag
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this._onDragStart(e);  // Left button only
    });

    // Drag: mouseup on window ends native drag
    window.addEventListener('mouseup', (e) => this._onDragEnd(e));

    // Listen for drag-move from main process (native cursor tracking)
    if (window.petAPI && window.petAPI.onDragMove) {
      window.petAPI.onDragMove((dx, dy) => {
        if (!this.isDragging) return;
        if (Math.abs(dx) > 1) {
          pet.setDirectionalAnimation(dx < 0 ? 'left' : 'right');
        }
      });
    }
  }

  _updateMousePassthrough(e = null) {
    if (this.isDragging) {
      this._setMousePassthrough(false);
      return;
    }

    const point = e ? { x: e.clientX, y: e.clientY } : this._getLastKnownMousePoint();
    const overMenu = point && contextMenu.isOpen && this._pointInsideElement(point, contextMenu.menuEl);
    const overPet = point && this._isPetPixelVisible(point);

    this._setMousePassthrough(!(overMenu || overPet));
  }

  _setMousePassthrough(ignore) {
    if (!window.petAPI || !window.petAPI.setIgnoreMouse) return;
    if (this.mousePassthroughIgnored === ignore) return;

    this.mousePassthroughIgnored = ignore;
    window.petAPI.setIgnoreMouse(ignore, ignore ? { forward: true } : undefined);
  }

  _getLastKnownMousePoint() {
    if (typeof window.__lastPetMouseX !== 'number' || typeof window.__lastPetMouseY !== 'number') return null;
    return { x: window.__lastPetMouseX, y: window.__lastPetMouseY };
  }

  _pointInsideElement(point, element) {
    if (!element || element.classList.contains('hidden')) return false;
    const rect = element.getBoundingClientRect();
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  }

  _isPetPixelVisible(point) {
    const canvas = pet.canvas;
    const rect = canvas.getBoundingClientRect();

    if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) {
      return false;
    }

    const canvasX = Math.floor((point.x - rect.left) * (canvas.width / rect.width));
    const canvasY = Math.floor((point.y - rect.top) * (canvas.height / rect.height));

    try {
      return pet.ctx.getImageData(canvasX, canvasY, 1, 1).data[3] > 10;
    } catch {
      return true;
    }
  }

  // ═══════════════════════════════════════════════════════
  // Hover Interaction
  // ═══════════════════════════════════════════════════════

  _onMouseEnter(e) {
    this.isHovering = true;
    this._recordInteraction();

    const now = Date.now();
    if (now - this.lastHoverTrigger < PET_CONFIG.hoverCooldown) return;

    const state = pet.getState();
    if (state === 'dragging' || state === 'clicked' || state === 'wakeup') return;

    // If sleeping, wake up
    if (state === 'sleeping') {
      this._wakeUp();
      return;
    }

    // If edge-hidden, pull out
    if (PET_SETTINGS.isHiddenAtEdge) {
      this._pullFromEdge();
      return;
    }

    this.lastHoverTrigger = now;
    pet.setState('hover_talk');
    speechBubble.showRandom('hover');
  }

  _onMouseLeave(e) {
    this.isHovering = false;
    const state = pet.getState();
    if (state === 'hover_talk') {
      pet.setState('idle');
    }
  }

  // ═══════════════════════════════════════════════════════
  // Click Interaction
  // ═══════════════════════════════════════════════════════

  _onClick(e) {
    if (this.isDragging) return;
    this._recordInteraction();

    const state = pet.getState();

    if (state === 'sleeping') {
      this._wakeUp();
      return;
    }

    // If in any idle behavior, interrupt it
    if (state === 'typing' || state === 'daydream') {
      pet.setState('idle');
    }

    // Multi-click detection
    this.clickCount++;

    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
    }

    if (this.clickCount >= PET_CONFIG.multiClickThreshold) {
      this.clickCount = 0;
      pet.setState('clicked');
      speechBubble.showRandom('multiClick');
      return;
    }

    this.clickTimer = setTimeout(() => {
      this.clickCount = 0;
    }, PET_CONFIG.multiClickWindow);

    pet.setState('clicked');
    speechBubble.showRandom('click');
  }

  // ═══════════════════════════════════════════════════════
  // Drag Interaction (Native — main process tracks cursor)
  // ═══════════════════════════════════════════════════════

  _onDragStart(e) {
    // Don't start drag if context menu is open
    if (contextMenu.isOpen) return;

    this.isDragging = true;
    this._setMousePassthrough(false);
    this._recordInteraction();

    const state = pet.getState();
    if (state === 'sleeping') {
      this._wakeUp();
    }

    // Pull from edge if hidden
    if (PET_SETTINGS.isHiddenAtEdge) {
      PET_SETTINGS.isHiddenAtEdge = false;
      PET_SETTINGS.hiddenSide = null;
    }

    pet.setState('dragging');

    if (Math.random() < 0.3) {
      speechBubble.showRandom('drag');
    }

    // Tell main process to start native cursor tracking
    if (window.petAPI) {
      window.petAPI.dragStart();
    }

    e.preventDefault();
  }

  _onDragEnd(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this._recordInteraction();

    // Tell main process to stop cursor tracking
    if (window.petAPI) {
      window.petAPI.dragEnd();
    }

    if (pet.getState() === 'dragging') {
      pet.setState('idle');
    }

    this._updateMousePassthrough(e);

    // Trigger edge hide ONLY when dropped near edge
    this._checkEdgeHide();
  }

  // ═══════════════════════════════════════════════════════
  // Animation End Handler
  // ═══════════════════════════════════════════════════════

  _onAnimationEnd(animName) {
    const state = pet.getState();
    if (state === 'clicked' || state === 'wakeup') {
      pet.setState('idle');
    }
  }

  // ═══════════════════════════════════════════════════════
  // Idle Behavior System
  // ═══════════════════════════════════════════════════════

  _recordInteraction() {
    this.lastInteractionTime = Date.now();
    this.currentIdleBehavior = null;

    if (this.idleBehaviorTimeout) {
      clearTimeout(this.idleBehaviorTimeout);
      this.idleBehaviorTimeout = null;
    }

    this._hideSleepEffect();
  }

  _startIdleChecker() {
    this.idleCheckInterval = setInterval(() => {
      this._checkIdleBehavior();
    }, 3000);  // Check every 3 seconds for responsiveness
  }

  _checkIdleBehavior() {
    const state = pet.getState();
    const idleTime = Date.now() - this.lastInteractionTime;

    // Only trigger transitions from idle state
    if (state !== 'idle') return;

    // Prioritize longer idle states
    if (idleTime >= PET_CONFIG.sleepDelay) {
      this._enterSleep();
    } else if (idleTime >= PET_CONFIG.daydreamDelay && this.currentIdleBehavior !== 'daydream') {
      this._enterDaydream();
    } else if (idleTime >= PET_CONFIG.typingDelay && this.currentIdleBehavior !== 'typing') {
      this._enterTyping();
    }
  }

  // ─── Typing State ──────────────────────────────────────

  _enterTyping() {
    this.currentIdleBehavior = 'typing';
    pet.setState('typing');
    speechBubble.showRandom('typing', 4000);

    const duration = this._randomBetween(
      PET_CONFIG.typingDuration[0],
      PET_CONFIG.typingDuration[1]
    );

    this.idleBehaviorTimeout = setTimeout(() => {
      if (pet.getState() === 'typing') {
        pet.setState('idle');
        // Don't clear currentIdleBehavior so we don't re-enter typing
      }
    }, duration);
  }

  // ─── Daydream State ────────────────────────────────────

  _enterDaydream() {
    this.currentIdleBehavior = 'daydream';
    pet.setState('daydream');
    speechBubble.showRandom('daydream', 5000);

    const duration = this._randomBetween(
      PET_CONFIG.daydreamDuration[0],
      PET_CONFIG.daydreamDuration[1]
    );

    this.idleBehaviorTimeout = setTimeout(() => {
      if (pet.getState() === 'daydream') {
        pet.setState('idle');
      }
    }, duration);
  }

  // ─── Sleep State ───────────────────────────────────────

  _enterSleep() {
    this.currentIdleBehavior = 'sleeping';
    pet.setState('sleeping');
    speechBubble.showRandom('sleep', 5000);
    this._showSleepEffect();
  }

  _wakeUp() {
    this._recordInteraction();
    this._hideSleepEffect();
    pet.setState('wakeup');
    speechBubble.showRandom('wakeup');
  }

  _showSleepEffect() {
    // Position Zzz to the right of canvas
    const canvas = pet.canvas;
    const rect = canvas.getBoundingClientRect();
    this.sleepEffect.style.top = rect.top + 'px';
    this.sleepEffect.style.left = (rect.right + 5) + 'px';
    this.sleepEffect.style.right = 'auto';

    this.sleepEffect.classList.remove('hidden');
    this.sleepEffect.classList.add('visible');
  }

  _hideSleepEffect() {
    this.sleepEffect.classList.remove('visible');
    this.sleepEffect.classList.add('hidden');
  }

  // ═══════════════════════════════════════════════════════════
  // Edge Hiding (Triggered on Drag End, 4 sides)
  // ═══════════════════════════════════════════════════════════

  async _checkEdgeHide() {
    if (!PET_SETTINGS.edgeHideEnabled) return;
    if (PET_SETTINGS.isHiddenAtEdge) return;
    if (!window.petAPI) return;

    const [pos, screen] = await Promise.all([
      window.petAPI.getWindowPosition(),
      window.petAPI.getScreenSize()
    ]);

    // Calculate pet's exact visual bounds on the screen
    const rect = pet.canvas.getBoundingClientRect();
    const petVisualX = pos.x + rect.left;
    const petVisualY = pos.y + rect.top;
    const petVisualW = rect.width;
    const petVisualH = rect.height;

    const threshold = PET_CONFIG.edgeHideThreshold;

    if (petVisualX - screen.x <= threshold) {
      this._hideAtEdge('left', pos, rect, screen);
    } else if (petVisualX + petVisualW >= screen.x + screen.width - threshold) {
      this._hideAtEdge('right', pos, rect, screen);
    } else if (petVisualY - screen.y <= threshold) {
      this._hideAtEdge('top', pos, rect, screen);
    } else if (petVisualY + petVisualH >= screen.y + screen.height - threshold) {
      this._hideAtEdge('bottom', pos, rect, screen);
    }
  }

  _hideAtEdge(side, pos, rect, screen) {
    PET_SETTINGS.isHiddenAtEdge = true;
    PET_SETTINGS.hiddenSide = side;

    const hideW = Math.round(rect.width * PET_CONFIG.edgeHideAmount);
    const hideH = Math.round(rect.height * PET_CONFIG.edgeHideAmount);

    let dx = 0, dy = 0;
    const petVisualX = pos.x + rect.left;
    const petVisualY = pos.y + rect.top;

    if (side === 'left') {
      dx = (screen.x - hideW) - petVisualX;
    } else if (side === 'right') {
      dx = (screen.x + screen.width - rect.width + hideW) - petVisualX;
    } else if (side === 'top') {
      dy = (screen.y - hideH) - petVisualY;
    } else if (side === 'bottom') {
      dy = (screen.y + screen.height - rect.height + hideH) - petVisualY;
    }

    window.petAPI.moveWindow(dx, dy);
    speechBubble.hide();
  }

  async _pullFromEdge() {
    if (!PET_SETTINGS.isHiddenAtEdge) return;

    const side = PET_SETTINGS.hiddenSide;
    PET_SETTINGS.isHiddenAtEdge = false;
    PET_SETTINGS.hiddenSide = null;

    const [pos, screen] = await Promise.all([
      window.petAPI.getWindowPosition(),
      window.petAPI.getScreenSize()
    ]);

    const rect = pet.canvas.getBoundingClientRect();
    const petVisualX = pos.x + rect.left;
    const petVisualY = pos.y + rect.top;

    let dx = 0, dy = 0;
    // Pull out to 10px from edge
    if (side === 'left') {
      dx = (screen.x + 10) - petVisualX;
    } else if (side === 'right') {
      dx = (screen.x + screen.width - rect.width - 10) - petVisualX;
    } else if (side === 'top') {
      dy = (screen.y + 10) - petVisualY;
    } else if (side === 'bottom') {
      dy = (screen.y + screen.height - rect.height - 10) - petVisualY;
    }

    window.petAPI.moveWindow(dx, dy);
  }

  // ═══════════════════════════════════════════════════════════
  // Wander Behavior
  // ═══════════════════════════════════════════════════════════

  _startWanderTimer() {
    this._scheduleNextWander();
  }

  _scheduleNextWander() {
    const delay = this._randomBetween(
      PET_CONFIG.wanderInterval[0],
      PET_CONFIG.wanderInterval[1]
    );

    this.wanderTimeout = setTimeout(() => {
      this._tryWander();
      this._scheduleNextWander();
    }, delay);
  }

  async _tryWander() {
    if (pet.getState() !== 'idle') return;
    if (Math.random() > PET_CONFIG.wanderChance) return;
    if (PET_SETTINGS.isHiddenAtEdge) return;
    if (!window.petAPI) return;

    const [pos, screen] = await Promise.all([
      window.petAPI.getWindowPosition(),
      window.petAPI.getScreenSize()
    ]);

    const rect = pet.canvas.getBoundingClientRect();
    const petVisualX = pos.x + rect.left;

    const direction = Math.random() < 0.5 ? 'left' : 'right';
    const distance = this._randomBetween(
      PET_CONFIG.wanderDistance[0],
      PET_CONFIG.wanderDistance[1]
    );

    const targetVisualX = direction === 'left'
      ? Math.max(screen.x + 10, petVisualX - distance)
      : Math.min(screen.x + screen.width - rect.width - 10, petVisualX + distance);

    const actualDistance = Math.abs(targetVisualX - petVisualX);
    if (actualDistance < 10) return;

    pet.setState('wander');
    pet.setDirectionalAnimation(direction);

    if (Math.random() < 0.3) {
      speechBubble.showRandom('wander');
    }

    const pixelsPerFrame = PET_CONFIG.wanderSpeed;
    const totalFrames = Math.ceil(actualDistance / pixelsPerFrame);
    let frame = 0;

    const wanderStep = () => {
      if (frame >= totalFrames || pet.getState() !== 'wander') {
        if (pet.getState() === 'wander') {
          pet.setState('idle');
        }
        return;
      }

      const moveX = direction === 'left' ? -pixelsPerFrame : pixelsPerFrame;
      window.petAPI.moveWindow(moveX, 0);
      frame++;

      this.wanderAnimFrame = requestAnimationFrame(wanderStep);
    };

    this.wanderAnimFrame = requestAnimationFrame(wanderStep);
  }

  // ═══════════════════════════════════════════════════════
  // Utilities
  // ═══════════════════════════════════════════════════════

  _randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// ═══════════════════════════════════════════════════════════
// Initialize when DOM is ready
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  await loadPersistentConfig();
  pet.applyScale(PET_SETTINGS.scale);
  pet.applyOpacity(PET_SETTINGS.opacity);

  setTimeout(() => {
    const interactions = new InteractionManager();
    window.__petInteractionManager = interactions;
    console.log('[App] 卜卜已上线！🥕');
  }, 100);
});

window.addEventListener('mousemove', (e) => {
  window.__lastPetMouseX = e.clientX;
  window.__lastPetMouseY = e.clientY;
}, true);
