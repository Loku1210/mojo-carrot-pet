/* ═══════════════════════════════════════════════════════════
   Mojo Carrot Pet — Configuration
   ═══════════════════════════════════════════════════════════ */

const PET_CONFIG = {
  // ─── Display ──────────────────────────────────────────────
  canvasWidth: 192,
  canvasHeight: 208,
  displayScale: 0.75,       // Default display scale (75% = 144x156 px)
  minScale: 0.4,            // Minimum scale (40%)
  maxScale: 1.5,            // Maximum scale (150%)
  scaleStep: 0.1,           // Scale increment for menu
  opacity: 1.0,             // Default opacity

  // ─── Animation FPS ────────────────────────────────────────
  defaultFPS: 6,            // Normal animation speed
  idleFPS: 1.5,             // Slow breathing idle — 更加慢
  sleepFPS: 1,              // Very slow sleep
  typingFPS: 5,             // Typing speed
  daydreamFPS: 3,           // Slow daydream

  // ─── Idle Timers (milliseconds) ───────────────────────────
  typingDelay: 30000,       // 30 seconds idle → typing
  typingDuration: [12000, 20000],

  daydreamDelay: 60000,     // 60 seconds idle → daydream
  daydreamDuration: [15000, 25000],

  sleepDelay: 100000,       // 100 seconds idle → sleep

  // ─── Wander Behavior ─────────────────────────────────────
  wanderInterval: [25000, 50000],
  wanderChance: 0.35,
  wanderDistance: [40, 120],
  wanderSpeed: 1.5,

  // ─── Edge Hiding ─────────────────────────────────────────
  edgeHideThreshold: 15,    // px from screen edge to trigger hiding (更近才触发)
  edgeHideAmount: 0.85,     // Hide 85% of the pet behind edge (只露一点点)

  // ─── Click Detection ─────────────────────────────────────
  multiClickWindow: 800,
  multiClickThreshold: 3,

  // ─── Bubble ───────────────────────────────────────────────
  bubbleDuration: 3000,
  hoverCooldown: 2000,
  bubbleOffsetY: 6,         // px above the pet canvas

  // ─── Animation Frames Map ─────────────────────────────────
  animations: {
    idle:           { folder: 'idle',          count: 6, loop: true  },
    'running-right':{ folder: 'running-right', count: 8, loop: true  },
    'running-left': { folder: 'running-left',  count: 8, loop: true  },
    waving:         { folder: 'waving',        count: 4, loop: true  },
    jumping:        { folder: 'jumping',       count: 5, loop: false },
    failed:         { folder: 'failed',        count: 8, loop: false },
    waiting:        { folder: 'waiting',       count: 6, loop: true  },
    running:        { folder: 'running',       count: 6, loop: true  },
    review:         { folder: 'review',        count: 6, loop: true  }
  },

  // ─── State → Animation Mapping ────────────────────────────
  stateAnimations: {
    idle:       'idle',
    hover_talk: 'waving',
    clicked:    'jumping',
    dragging:   'running-right',
    sleeping:   'idle',     // 使用 idle 的第 2 帧作为睡觉闭眼
    typing:     'running',
    daydream:   'review',
    wander:     'running-right',
    wakeup:     'jumping'
  },

  // ─── State → FPS Override ─────────────────────────────────
  stateFPS: {
    idle:       'idleFPS',
    sleeping:   'sleepFPS',
    typing:     'typingFPS',
    daydream:   'daydreamFPS'
  },

  // ─── Messages ─────────────────────────────────────────────
  messages: {
    hover: [
      "嗨！我是卜卜",
      "我们是！五月天！",
      "胡萝卜能量补充中",
      "今天也一起加油",
      "在桌角陪你一会儿",
      "要记得伸个懒腰",
      "Mojo Carrot here"
    ],
    click: [
      "嘿嘿~",
      "今天！不要惹我！！",
      "好痒！",
      "轻一点嘛",
      "又戳我！🥕"
    ],
    multiClick: [
      "别戳了！痒痒！",
      "你是不是太闲了 😤",
      "告诉你！在今天！不要惹我！！！",
      "再戳我要告诉阿信咯",
      "救命！有人在疯狂戳我！"
    ],
    drag: [
      "起飞咯！",
      "慢一点慢一点",
      "要把我放在哪里？",
      "这个视角很新鲜",
      "搬家进行中"
    ],
    daydream: [
      "...",
      "脑袋在飘云朵💭",
      "在想什么呢...",
      "嗯？没有在打瞌睡！",
      "只是短暂放空",
      "胡萝卜也会发呆"
    ],
    typing: [
      "忙碌中...",
      "让我想想...",
      "⌨️ 哒哒哒",
      "在写代码呢！",
      "进度条快跑起来",
      "别打扰，我在写待办！"
    ],
    sleep: [
      "Zzz...",
      "💤",
      "梦里有一大片菜园..."
    ],
    wakeup: [
      "啊！我没有在睡觉！",
      "我醒了我醒了！",
      "打扰我做美梦了！",
      "再赖床三秒"
    ],
    wander: [
      "溜达溜达~",
      "散步时间！",
      "巡视一下桌面领地"
    ]
  }
};

// ─── Runtime Settings (mutable) ────────────────────────────
const PET_SETTINGS = {
  scale: PET_CONFIG.displayScale,
  opacity: PET_CONFIG.opacity,
  alwaysOnTop: true,
  edgeHideEnabled: true,
  isHiddenAtEdge: false,
  hiddenSide: null  // 'left' or 'right'
};

async function loadPersistentConfig() {
  if (!window.petAPI) return;

  try {
    const settings = await window.petAPI.loadSettings();
    if (settings) {
      PET_SETTINGS.scale = clampSetting(settings.scale, PET_CONFIG.minScale, PET_CONFIG.maxScale, PET_SETTINGS.scale);
      PET_SETTINGS.opacity = clampSetting(settings.opacity, 0.2, 1, PET_SETTINGS.opacity);
      PET_SETTINGS.alwaysOnTop = Boolean(settings.alwaysOnTop);
      PET_SETTINGS.edgeHideEnabled = Boolean(settings.edgeHideEnabled);
    }
  } catch (error) {
    console.warn('[Config] Failed to load settings:', error);
  }

  try {
    await window.petAPI.saveDefaultMessages(PET_CONFIG.messages);
    const userMessages = await window.petAPI.loadUserMessages();
    mergeUserMessages(userMessages);
  } catch (error) {
    console.warn('[Config] Failed to load user messages:', error);
  }
}

function savePetSettings() {
  if (!window.petAPI || !window.petAPI.saveSettings) return Promise.resolve(null);

  return window.petAPI.saveSettings({
    scale: PET_SETTINGS.scale,
    opacity: PET_SETTINGS.opacity,
    alwaysOnTop: PET_SETTINGS.alwaysOnTop,
    edgeHideEnabled: PET_SETTINGS.edgeHideEnabled
  }).catch((error) => {
    console.warn('[Config] Failed to save settings:', error);
    return null;
  });
}

function mergeUserMessages(userMessages) {
  if (!userMessages || typeof userMessages !== 'object' || Array.isArray(userMessages)) return;

  Object.entries(userMessages).forEach(([category, messages]) => {
    if (!Array.isArray(messages)) return;
    const cleanMessages = messages
      .filter((message) => typeof message === 'string')
      .map((message) => message.trim())
      .filter(Boolean);

    if (cleanMessages.length > 0) {
      PET_CONFIG.messages[category] = cleanMessages;
    }
  });
}

function clampSetting(value, min, max, fallback) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}
