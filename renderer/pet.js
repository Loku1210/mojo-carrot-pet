/* ═══════════════════════════════════════════════════════════
   Mojo Carrot Pet — Core Pet Engine (State Machine + Animation)
   ═══════════════════════════════════════════════════════════ */

class MojoCarrotPet {
  constructor() {
    this.canvas = document.getElementById('pet-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Set canvas size (internal resolution stays the same)
    this.canvas.width = PET_CONFIG.canvasWidth;
    this.canvas.height = PET_CONFIG.canvasHeight;

    // Apply initial display scaling
    this.applyScale(PET_SETTINGS.scale);

    // State
    this.currentState = 'idle';
    this.previousState = null;
    this.currentAnimation = 'idle';
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.lastTimestamp = 0;

    // Frame images cache
    this.frameImages = {};
    this.framesLoaded = false;

    // Callbacks
    this.onStateChange = null;
    this.onAnimationEnd = null;

    // Load all frames then start
    this._loadAllFrames().then(() => {
      this.framesLoaded = true;
      console.log('[Pet] All frames loaded, starting animation loop');
      this._startLoop();
    });
  }

  // ─── Scaling ─────────────────────────────────────────────

  applyScale(scale) {
    PET_SETTINGS.scale = Math.max(PET_CONFIG.minScale, Math.min(PET_CONFIG.maxScale, scale));
    const displayW = Math.round(PET_CONFIG.canvasWidth * PET_SETTINGS.scale);
    const displayH = Math.round(PET_CONFIG.canvasHeight * PET_SETTINGS.scale);
    this.canvas.style.width = displayW + 'px';
    this.canvas.style.height = displayH + 'px';

    // Notify main process to resize window
    this._resizeWindow();
  }

  applyOpacity(opacity) {
    PET_SETTINGS.opacity = Math.max(0.2, Math.min(1.0, opacity));
    this.canvas.style.opacity = PET_SETTINGS.opacity;
  }

  getDisplaySize() {
    return {
      width: Math.round(PET_CONFIG.canvasWidth * PET_SETTINGS.scale),
      height: Math.round(PET_CONFIG.canvasHeight * PET_SETTINGS.scale)
    };
  }

  _resizeWindow() {
    const { width, height } = this.getDisplaySize();
    // Pet is at top-left, shifted down by 50px and right by 10px. Padding goes RIGHT (for context menu) and BELOW.
    // Enforce minimum size so the context menu (170px wide, ~350px tall) always fits.
    const windowW = Math.max(width + 230, 420);
    const windowH = Math.max(height + 150, 420);
    if (window.petAPI && window.petAPI.resizeWindow) {
      window.petAPI.resizeWindow(windowW, windowH);
    }
  }

  // ─── Frame Loading ───────────────────────────────────────

  async _loadAllFrames() {
    const promises = [];

    for (const [name, config] of Object.entries(PET_CONFIG.animations)) {
      this.frameImages[name] = [];

      for (let i = 0; i < config.count; i++) {
        const img = new Image();
        const paddedIndex = String(i).padStart(2, '0');
        img.src = `../assets/frames/${config.folder}/${paddedIndex}.png`;

        const promise = new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = () => {
            console.warn(`[Pet] Failed to load: ${img.src}`);
            resolve();
          };
        });

        this.frameImages[name].push(img);
        promises.push(promise);
      }
    }

    await Promise.all(promises);
    console.log(`[Pet] Loaded ${promises.length} frames across ${Object.keys(PET_CONFIG.animations).length} animations`);
  }

  // ─── State Machine ──────────────────────────────────────

  setState(newState) {
    if (newState === this.currentState) return;

    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = newState;

    // Determine animation to play
    const animName = PET_CONFIG.stateAnimations[newState] || 'idle';
    this._playAnimation(animName);

    console.log(`[Pet] State: ${oldState} → ${newState} (anim: ${animName})`);

    if (this.onStateChange) {
      this.onStateChange(newState, oldState);
    }
  }

  getState() {
    return this.currentState;
  }

  // ─── Animation Control ──────────────────────────────────

  _playAnimation(animName) {
    if (!PET_CONFIG.animations[animName]) {
      console.warn(`[Pet] Unknown animation: ${animName}`);
      return;
    }
    this.currentAnimation = animName;
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  playAnimationOverride(animName) {
    this._playAnimation(animName);
  }

  setDirectionalAnimation(direction) {
    const animName = direction === 'left' ? 'running-left' : 'running-right';
    if (this.currentAnimation !== animName) {
      this.currentAnimation = animName;
      this.currentFrame = 0;
      this.frameTimer = 0;
    }
  }

  // ─── FPS Control ────────────────────────────────────────

  _getCurrentFPS() {
    // Check state-specific FPS override
    const fpsKey = PET_CONFIG.stateFPS[this.currentState];
    if (fpsKey && PET_CONFIG[fpsKey] !== undefined) {
      return PET_CONFIG[fpsKey];
    }
    return PET_CONFIG.defaultFPS;
  }

  // ─── Animation Loop ─────────────────────────────────────

  _startLoop() {
    const loop = (timestamp) => {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const delta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      this._update(delta);
      this._render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  _update(delta) {
    if (!this.framesLoaded) return;

    if (this.currentState === 'sleeping') {
      // Force the 2nd frame of idle (closed eyes)
      this.currentAnimation = 'idle';
      this.currentFrame = 1;
      return; // Do not advance frame timer
    }

    const fps = this._getCurrentFPS();
    const frameDuration = 1000 / fps;

    this.frameTimer += delta;

    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;

      const animConfig = PET_CONFIG.animations[this.currentAnimation];
      if (!animConfig) return;

      this.currentFrame++;

      if (this.currentFrame >= animConfig.count) {
        if (animConfig.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = animConfig.count - 1;
          if (this.onAnimationEnd) {
            this.onAnimationEnd(this.currentAnimation);
          }
        }
      }
    }
  }

  _render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const frames = this.frameImages[this.currentAnimation];
    if (!frames || !frames[this.currentFrame]) return;

    const img = frames[this.currentFrame];
    if (img.complete && img.naturalWidth > 0) {
      this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Global instance
const pet = new MojoCarrotPet();
