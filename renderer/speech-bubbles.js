/* ═══════════════════════════════════════════════════════════
   Mojo Carrot Pet — Speech Bubble System
   ═══════════════════════════════════════════════════════════ */

class SpeechBubbleManager {
  constructor() {
    this.bubbleEl = document.getElementById('speech-bubble');
    this.textEl = document.getElementById('bubble-text');
    this.hideTimeout = null;
    this.isShowing = false;
    this.lastMessageIndex = {};
  }

  /**
   * Show a speech bubble with a random message from the given category
   */
  showRandom(category, duration) {
    const messages = PET_CONFIG.messages[category];
    if (!messages || messages.length === 0) return;

    let index;
    const lastIdx = this.lastMessageIndex[category];
    if (messages.length > 1) {
      do {
        index = Math.floor(Math.random() * messages.length);
      } while (index === lastIdx);
    } else {
      index = 0;
    }

    this.lastMessageIndex[category] = index;
    this.show(messages[index], duration);
  }

  /**
   * Show a specific message, positioned just above the pet canvas
   */
  show(text, duration) {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.textEl.textContent = text;

    // Position bubble just above the pet canvas
    this._positionBelowPet();

    this.bubbleEl.classList.remove('hidden');
    void this.bubbleEl.offsetWidth;
    this.bubbleEl.classList.add('visible');
    this.isShowing = true;

    const displayTime = duration || PET_CONFIG.bubbleDuration;
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, displayTime);
  }

  /**
   * Position the bubble just below the canvas element
   * (Pet is anchored to top-left of window, so bubble goes below it)
   */
  _positionBelowPet() {
    const canvas = document.getElementById('pet-canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const gap = PET_CONFIG.bubbleOffsetY || 6;

    // Show first to measure width
    this.bubbleEl.style.visibility = 'hidden';
    this.bubbleEl.style.display = 'block';
    const bubbleWidth = this.bubbleEl.offsetWidth;
    this.bubbleEl.style.visibility = '';

    // Center over canvas, but clamp so it never goes past left edge
    let left = canvasRect.left + canvasRect.width / 2 - bubbleWidth / 2;
    left = Math.max(5, left);

    this.bubbleEl.style.bottom = 'auto';
    this.bubbleEl.style.top = (canvasRect.bottom + gap) + 'px';
    this.bubbleEl.style.left = left + 'px';
    this.bubbleEl.style.transform = 'none';
  }

  hide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.bubbleEl.classList.remove('visible');
    this.bubbleEl.classList.add('hidden');
    this.isShowing = false;
  }

  isVisible() {
    return this.isShowing;
  }
}

// Global instance
const speechBubble = new SpeechBubbleManager();
