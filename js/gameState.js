// GAME STATE MODULE
// Centralized state management with observer pattern for state changes

// GameState constructor
window.GameState = {
  // State data
  data: {
    // Time and day tracking
    time: 480, // Start at 8:00 AM (in minutes)
    day: 1,
    
    // Character progression 
    experience: 0,
    level: 1,
    skillPoints: 0,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    morale: 75, // 0-100 scale
    
    // Quest & Story Tracking
    mainQuest: { stage: 0, completed: false },
    sideQuests: [],
    discoveredLocations: ["Kasvaari Camp"],
    
    // Environmental conditions
    weather: "clear", // clear, rainy, foggy, etc.
    campMorale: 70, // 0-100 scale
    
    // Flags for special events
    arrivalProcessed: false,
    firstBriefingCompleted: false,
    trainingProgress: 0,
    dailyTrainingCount: 0,
    inStoryEncounter: false,
    
    // Action tracking
    dailyPatrolDone: false,
    dailyScoutDone: false,
    
    // Battle system
    inBattle: false,
    currentEnemy: null,
    
    // Enhanced combat system properties
    combatPhase: "neutral", // neutral, preparation, execution, reaction
    combatDistance: 2, // 0-close, 1-medium, 2-far
    combatStance: "neutral", // neutral, aggressive, defensive, evasive
    enemyStance: "neutral",
    initiativeOrder: [],
    currentInitiative: 0,
    playerQueuedAction: null,
    enemyQueuedAction: null,
    counterAttackAvailable: false,
    playerMomentum: 0, // -5 to 5, affects damage and success chances
    enemyMomentum: 0,
    consecutiveHits: 0,
    perfectParries: 0,
    dodgeCount: 0,
    playerStaggered: false,
    playerInjuries: [],
    terrain: "normal", // normal, rocky, slippery, confined
    originalWeather: null, // store original weather during combat
    allowInterrupts: true,
    staminaPerAction: {
      attack: 5,
      defend: 3,
      dodge: 4,
      advance: 3,
      retreat: 3,
      aim: 2,
      special: 7
    },
    actionWindUpTime: {
      quickAttack: 1,
      attack: 2,
      heavyAttack: 4,
      defend: 1,
      dodge: 1,
      advance: 1,
      retreat: 2,
      aim: 3,
      special: 3,
      feint: 2
    },
    actionRecoveryTime: {
      quickAttack: 1,
      attack: 2,
      heavyAttack: 3,
      defend: 1,
      dodge: 2,
      advance: 1,
      retreat: 1,
      aim: 2, 
      special: 3,
      feint: 1
    },
    
    // Mission system flags
    inMission: false,
    currentMission: null,
    missionStage: 0,
    inMissionCombat: false,
    
    // Achievement tracking
    combatVictoryAchieved: false,
    
    // Discovered locations
    discoveredBrawlerPits: false,
    discoveredGamblingTent: false
  },
  
  // Observer pattern implementation
  observers: [],
  
  // Function to register an observer (callback function)
  subscribe: function(callback) {
    this.observers.push(callback);
    return this.observers.length - 1; // Return index for unsubscribing
  },
  
  // Function to unsubscribe an observer
  unsubscribe: function(index) {
    this.observers.splice(index, 1);
  },
  
  // Notify all observers of state change
  notify: function(property, value, oldValue) {
    for (let callback of this.observers) {
      callback(property, value, oldValue);
    }
  },
  
  // Get a property value
  get: function(property) {
    // Use property path to get nested values
    return this.getNestedProperty(this.data, property);
  },
  
  // Set a property value with notification
  set: function(property, value) {
    // Get the old value first
    const oldValue = this.get(property);
    
    // Set the new value
    this.setNestedProperty(this.data, property, value);
    
    // Notify observers if value changed
    if (oldValue !== value) {
      this.notify(property, value, oldValue);
    }
    
    return value;
  },
  
  // Helper to get a nested property using a path string (e.g., "combat.playerMomentum")
  getNestedProperty: function(obj, path) {
    if (!path) return obj;
    
    const parts = path.split('.');
    let value = obj;
    
    for (let part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }
    
    return value;
  },
  
  // Helper to set a nested property using a path string
  setNestedProperty: function(obj, path, value) {
    if (!path) return;
    
    const parts = path.split('.');
    const lastKey = parts.pop();
    let current = obj;
    
    for (let part of parts) {
      if (!(part in current)) current[part] = {};
      current = current[part];
    }
    
    current[lastKey] = value;
  },
  
  // Initialize game state function
  init: function() {
    console.log("Initializing game state...");
    
    // Set additional game state values
    this.set('trainingProgress', 0);
    this.set('dailyTrainingCount', 0);
    this.set('combatPhase', 'neutral');
    this.set('combatDistance', 2);
    this.set('combatStance', 'neutral');
    
    // Set activity discovery flags based on origin
    if (window.player && window.player.origin === 'Lunarine') {
      this.set('discoveredBrawlerPits', true);
      this.set('discoveredGamblingTent', true);
    } else {
      this.set('discoveredBrawlerPits', false);
      this.set('discoveredGamblingTent', false);
    }
    
    // Add initial quests - one training quest and one random quest
    if (window.createQuest) {
      const trainingQuest = window.createQuest("training");
      const questTypes = ["patrol", "scout"];
      const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
      const randomQuest = window.createQuest(randomType);
      
      this.set('sideQuests', [trainingQuest, randomQuest]);
      
      console.log("Initial quests created:", this.get('sideQuests'));
    }
  },
  
  // Function to check for level up
  checkLevelUp: function() {
    // Experience required for next level = current level * 100
    const requiredExp = this.get('level') * 100;
    
    if (this.get('experience') >= requiredExp) {
      // Level up!
      const newLevel = this.get('level') + 1;
      this.set('level', newLevel);
      this.set('experience', this.get('experience') - requiredExp);
      this.set('skillPoints', this.get('skillPoints') + 1);
      
      // Increase max health and stamina
      this.set('maxHealth', this.get('maxHealth') + 10);
      this.set('maxStamina', this.get('maxStamina') + 5);
      
      // Restore health and stamina
      this.set('health', this.get('maxHealth'));
      this.set('stamina', this.get('maxStamina'));
      
      // Update UI
      if (window.UI) {
        window.UI.updateStatusBars();
      }
      
      // Show notification
      if (window.UI) {
        window.UI.showNotification(`Level up! You are now level ${newLevel}!`, 'level-up');
      }
      
      // Check for veteran achievement
      if (newLevel >= 5) {
        window.updateAchievementProgress('veteran');
      }
      
      // Check if there are more levels to gain
      this.checkLevelUp();
    }
  },
  
  // Update achievement progress
  updateAchievementProgress: function(achievementId, amount = 1) {
    if (!window.achievements) return;
    
    const achievement = window.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    // Update progress if it's a progress-based achievement
    if ('progress' in achievement) {
      achievement.progress += amount;
      
      // Check if achievement is complete
      if (achievement.progress >= achievement.target) {
        this.showAchievement(achievementId);
      }
    }
  },
  
  // Show achievement
  showAchievement: function(achievementId) {
    if (!window.achievements) return;
    
    const achievement = window.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    // Mark achievement as unlocked
    achievement.unlocked = true;
    
    // Display achievement notification
    if (window.UI) {
      window.UI.showAchievement(achievementId);
    }
  }
};

// Global player state with getters and setters
window.Player = {
  data: {
    origin: null,
    career: null,
    name: "",
    phy: 0,
    men: 0,
    skills: {
      melee: 0,
      marksmanship: 0,
      survival: 0,
      command: 0,
      discipline: 0,
      tactics: 0,
      organization: 0,
      arcana: 0
    },
    inventory: [],
    taelors: 25,
    relationships: {},
    events: []
  },
  
  // Get a player property
  get: function(property) {
    return window.GameState.getNestedProperty(this.data, property);
  },
  
  // Set a player property
  set: function(property, value) {
    const oldValue = this.get(property);
    window.GameState.setNestedProperty(this.data, property, value);
    
    // Notify for significant player changes
    if (oldValue !== value) {
      // You could add player-specific observers here
    }
    
    return value;
  },
  
  // Add an item to inventory
  addItem: function(item) {
    if (!this.data.inventory) {
      this.data.inventory = [];
    }
    
    this.data.inventory.push(item);
    return this.data.inventory.length - 1; // Return index of added item
  },
  
  // Remove item from inventory by index
  removeItem: function(index) {
    if (!this.data.inventory || index < 0 || index >= this.data.inventory.length) {
      return null;
    }
    
    const removed = this.data.inventory.splice(index, 1)[0];
    return removed;
  }
};

// Original compatibility layer to ensure existing code still works
// This will let us transition gradually to the new structured system
window.gameState = window.GameState.data;
window.player = window.Player.data;

// Initialize game state function - for backward compatibility
window.initializeGameState = function() {
  window.GameState.init();
};

// Backward compatibility for checking level up
window.checkLevelUp = function() {
  window.GameState.checkLevelUp();
};

// Backward compatibility for achievement updates
window.updateAchievementProgress = function(achievementId, amount = 1) {
  window.GameState.updateAchievementProgress(achievementId, amount);
};

// Backward compatibility for showing achievements
window.showAchievement = function(achievementId) {
  window.GameState.showAchievement(achievementId);
};

// Backward compatibility for time and day updates
window.updateTimeAndDay = function(minutesToAdd) {
  // Use UI function if available, otherwise fall back to direct state updates
  if (window.UI && typeof window.UI.updateTimeAndDay === 'function') {
    window.UI.updateTimeAndDay(minutesToAdd);
  } else {
    // Add time
    window.gameState.time += minutesToAdd;
    
    // Check for day change
    while (window.gameState.time >= 1440) {
      window.gameState.time -= 1440;
      window.gameState.day++;
      
      // Reset daily flags
      window.gameState.dailyTrainingCount = 0;
      window.gameState.dailyPatrolDone = false;
      window.gameState.dailyScoutDone = false;
    }
  }
};

// Backward compatibility for time of day
window.getTimeOfDay = function() {
  // Use UI function if available
  if (window.UI && typeof window.UI.getTimeOfDay === 'function') {
    return window.UI.getTimeOfDay();
  } else {
    const hours = Math.floor(window.gameState.time / 60);
    
    if (hours >= 5 && hours < 8) return 'dawn';
    if (hours >= 8 && hours < 18) return 'day';
    if (hours >= 18 && hours < 21) return 'evening';
    return 'night';
  }
};
