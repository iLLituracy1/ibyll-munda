// Enhanced Combat System
// Featuring layered timing, advanced reactions, environmental factors and deeper tactics

// === COMBAT STATE TRACKING ===
// These properties will be added to gameState
const combatStateTemplate = {
  inBattle: false,
  currentEnemy: null,
  combatPhase: "neutral", // neutral, preparation, execution, reaction
  combatTimer: 0, // Used for tick-based timing
  ticksPerTurn: 10, // Each turn is broken into ticks for more granular timing
  currentTick: 0,
  initiativeOrder: [], // array of combatants in initiative order
  currentInitiative: 0, // index of current actor in initiativeOrder
  actionQueue: [], // queued actions with execution timers
  combatDistance: 2, // 0-close, 1-medium, 2-far
  combatStance: "neutral", // neutral, aggressive, defensive, evasive
  enemyStance: "neutral",
  staminaPerAction: {
    attack: 5,
    defend: 3,
    dodge: 4,
    advance: 3,
    retreat: 3,
    aim: 2,
    special: 7
  },
  // Action timing properties
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
  // Combat momentum tracking
  playerMomentum: 0, // -5 to 5, affects damage and success chances
  enemyMomentum: 0,
  // Environmental factors
  terrain: "normal", // normal, rocky, slippery, etc.
  weather: "clear", // clear, rain, fog, wind, heat
  // Injury tracking
  playerInjuries: [],
  enemyInjuries: [],
  // Combat stats
  consecutiveHits: 0,
  perfectParries: 0,
  dodgeCount: 0,
  // Special state flags
  allowInterrupts: true,
  playerStaggered: false,
  enemyStaggered: false,
  feintInProgress: false
};

// === ENEMY TEMPLATES WITH IMPROVED BEHAVIOR ===
window.createEnemy = function(enemyType) {
  const enemies = {
    "arrasi_scout": {
      name: "Arrasi Scout",
      health: 35,
      maxHealth: 35,
      attack: 4,
      defense: 2,
      initiative: 8,
      description: "A lightly armored scout from the Arrasi tribes. Fast and precise.",
      tactics: ["Quick Strike", "Retreat", "Aimed Shot"],
      preferredDistance: 1, // prefers medium range
      style: "evasive",
      personality: "cautious",
      morale: 80, // 0-100
      stamina: 70,
      maxStamina: 70,
      momentum: 0,
      staggerThreshold: 3, // How many consecutive hits before staggered
      abilities: {
        "quick_shot": {
          name: "Quick Shot",
          damage: 3,
          windUp: 1,
          recovery: 1,
          stamina: 3,
          minRange: 1,
          description: "A rapid shot aimed with minimal preparation."
        },
        "aimed_shot": {
          name: "Aimed Shot",
          damage: 6,
          windUp: 3,
          recovery: 2,
          stamina: 5,
          minRange: 1,
          description: "A carefully aimed shot with greater damage potential."
        },
        "retreat": {
          name: "Tactical Retreat",
          effect: "distance+1",
          windUp: 1,
          recovery: 1,
          stamina: 3,
          description: "Quickly increases distance from opponent."
        },
        "feint": {
          name: "Deceptive Draw",
          effect: "feint",
          windUp: 2,
          recovery: 1,
          stamina: 4,
          description: "Pretends to draw an arrow, hoping to bait a reaction."
        }
      },
      behavior: function(state) {
        // Scout AI with personality
        const options = [];
        
        // Check if staggered (reduce options if so)
        if (this.staggered) {
          return ["retreat"]; // Always try to retreat if staggered
        }
        
        // If low on stamina, be more conservative
        if (this.stamina < this.maxStamina * 0.3) {
          options.push("retreat");
          return options;
        }
        
        // Check morale state
        if (this.morale < 40) {
          // Low morale, likely to flee
          options.push("retreat");
          if (Math.random() < 0.7) {
            return ["retreat"]; // 70% chance to just retreat when scared
          }
        }
        
        // If at preferred range and has initiative advantage
        if (state.combatDistance === this.preferredDistance) {
          if (state.playerStance === "aggressive" && this.personality === "cautious") {
            // If player is aggressive and enemy is cautious, consider a feint
            options.push("feint");
          }
          
          // Good position for aimed shot
          if (this.stamina > 20 && state.terrain !== "windy") { // Wind affects aim
            options.push("aimed_shot");
          } else {
            options.push("quick_shot");
          }
        }
        // If too close, try to retreat - consider tactical factors
        else if (state.combatDistance < this.preferredDistance) {
          if (this.health < this.maxHealth * 0.5 || this.stamina < this.maxStamina * 0.4) {
            options.push("retreat"); // Retreat if wounded or tired
          }
          else if (state.playerStance === "aggressive" && state.playerMomentum > 1) {
            options.push("retreat"); // Retreat if player has momentum and is aggressive
          }
          else if (Math.random() < 0.6) {
            options.push("retreat"); // 60% chance to try to maintain preferred range
          }
          else {
            // Sometimes choose to stand ground and fight even at close range
            options.push("quick_shot");
          }
        }
        // Otherwise do a quick attack
        else if (state.combatDistance > this.preferredDistance) {
          options.push("quick_shot");
        }
        
        // Randomly select from valid options
        return options[Math.floor(Math.random() * options.length)];
      }
    },
    "arrasi_warrior": {
      name: "Arrasi Warrior",
      health: 50,
      maxHealth: 50,
      attack: 6,
      defense: 3,
      initiative: 5,
      description: "A hardened tribal warrior wielding a curved blade and buckler.",
      tactics: ["Heavy Slash", "Shield Block", "War Cry"],
      preferredDistance: 0, // prefers close combat
      style: "aggressive",
      personality: "fearless",
      morale: 90,
      stamina: 80,
      maxStamina: 80,
      momentum: 0,
      staggerThreshold: 4,
      abilities: {
        "shield_bash": {
          name: "Shield Bash",
          damage: 3,
          windUp: 2,
          recovery: 2,
          stamina: 4,
          maxRange: 0,
          effect: "stun",
          description: "A stunning blow with the shield that momentarily dazes opponents."
        },
        "heavy_slash": {
          name: "Heavy Slash",
          damage: 8,
          windUp: 4,
          recovery: 3,
          stamina: 6,
          maxRange: 0,
          description: "A powerful overhead strike that deals significant damage."
        },
        "war_cry": {
          name: "War Cry",
          effect: "intimidate",
          windUp: 1,
          recovery: 1,
          stamina: 3,
          description: "A terrifying battle cry that may lower opponent morale."
        },
        "advance": {
          name: "Charge",
          effect: "distance-1",
          windUp: 2,
          recovery: 1,
          stamina: 4,
          description: "A determined advance to close the distance."
        },
        "feint_slash": {
          name: "Feint Slash",
          effect: "feint",
          windUp: 2,
          recovery: 1,
          stamina: 3,
          maxRange: 0,
          description: "Begins a heavy slash but stops halfway, trying to bait a reaction."
        }
      },
      behavior: function(state) {
        // Warrior AI with personality
        const options = [];
        
        // Check if staggered (reduce options if so)
        if (this.staggered) {
          return ["shield_bash"]; // Try to stun opponent to recover
        }
        
        // If low on stamina, be more conservative
        if (this.stamina < this.maxStamina * 0.3) {
          if (state.combatDistance === 0) {
            options.push("shield_bash"); // Defensive option
          } else {
            options.push("advance"); // Try to close and end the fight
          }
          return options;
        }
        
        // Check morale state - fearless so less likely to retreat
        if (this.morale < 30) { // Only consider fleeing at very low morale
          if (Math.random() < 0.3) {
            options.push("retreat");
          }
        }
        
        // If not at close range, always try to advance
        if (state.combatDistance > 0) {
          options.push("advance");
          return ["advance"]; // Prioritize closing the gap
        }
        
        // At close range - tactical decisions
        if (state.combatDistance === 0) {
          // If player is in defensive stance, consider feint
          if (state.playerStance === "defensive" && state.terrain !== "slippery") {
            options.push("feint_slash");
          }
          
          // Intimidate if player morale is already low
          if (state.morale < 50) {
            options.push("war_cry");
          }
          
          // Heavy attack if we have momentum or player is staggered
          if (this.momentum > 2 || state.playerStaggered) {
            options.push("heavy_slash");
          } 
          // Shield bash if player is aggressive
          else if (state.playerStance === "aggressive") {
            options.push("shield_bash");
          }
          // Otherwise mix of options
          else {
            options.push("shield_bash");
            options.push("heavy_slash");
            if (Math.random() < 0.2) options.push("war_cry");
          }
        }
        
        return options[Math.floor(Math.random() * options.length)];
      }
    },
    "imperial_deserter": {
      name: "Imperial Deserter",
      health: 40,
      maxHealth: 40,
      attack: 5,
      defense: 3,
      initiative: 6,
      description: "A former soldier who abandoned their post. Desperate and dangerous.",
      tactics: ["Standard Attack", "Desperate Lunge", "Defensive Stance"],
      preferredDistance: 1, // prefers medium range but adapts
      style: "adaptive",
      personality: "desperate",
      morale: 60, // Lower starting morale
      stamina: 75,
      maxStamina: 75,
      momentum: 0,
      staggerThreshold: 3,
      abilities: {
        "standard_attack": {
          name: "Standard Attack",
          damage: 5,
          windUp: 2,
          recovery: 2,
          stamina: 4,
          maxRange: 1,
          description: "A disciplined strike using imperial training."
        },
        "desperate_lunge": {
          name: "Desperate Lunge",
          damage: 7,
          windUp: 2,
          recovery: 3,
          stamina: 6,
          effect: "distance-1",
          maxRange: 1,
          description: "A reckless attack that closes distance but leaves openings."
        },
        "defensive_stance": {
          name: "Defensive Stance",
          effect: "defend+2",
          windUp: 1,
          recovery: 2,
          stamina: 3,
          description: "A guarded position that improves defensive capabilities."
        },
        "surrender": {
          name: "Surrender",
          effect: "surrender",
          windUp: 1,
          recovery: 0,
          stamina: 0,
          description: "Throws down weapons and begs for mercy."
        }
      },
      behavior: function(state) {
        // Deserter AI - more adaptive and desperate
        const options = [];
        
        // Check for surrender conditions
        if (this.health < this.maxHealth * 0.2 && this.morale < 30) {
          // Very low health and morale - might surrender
          if (Math.random() < 0.6) {
            return ["surrender"];
          }
        }
        
        // Check if staggered
        if (this.staggered) {
          return ["defensive_stance"]; // Try to recover with defense
        }
        
        // If low on stamina, be more conservative
        if (this.stamina < this.maxStamina * 0.3) {
          options.push("defensive_stance");
          return options;
        }
        
        // Desperate behavior - more aggressive when wounded
        if (this.health < this.maxHealth * 0.5 && this.morale > 40) {
          options.push("desperate_lunge"); // Fight harder when backed into a corner
          if (state.combatDistance > 0) {
            return ["desperate_lunge"]; // Prioritize desperate attack when hurt
          }
        }
        
        // Adapt to player's health
        if (state.playerHealth < state.playerMaxHealth * 0.4) {
          // Player is wounded, press the advantage
          if (state.combatDistance > 0) {
            options.push("desperate_lunge");
          } else {
            options.push("standard_attack");
          }
        } 
        // Deserter is wounded, be defensive
        else if (this.health < this.maxHealth * 0.5) {
          options.push("defensive_stance");
        }
        // Otherwise mix it up
        else {
          options.push("standard_attack");
          if (state.combatDistance > 0) options.push("desperate_lunge");
          if (Math.random() < 0.3) options.push("defensive_stance");
        }
        
        // Environmental adaptations
        if (state.terrain === "slippery" && options.includes("desperate_lunge")) {
          // Remove risky moves on slippery terrain
          options = options.filter(o => o !== "desperate_lunge");
          options.push("standard_attack");
        }
        
        return options[Math.floor(Math.random() * options.length)];
      }
    },
    "wild_beast": {
      name: "Wild Beast",
      health: 45,
      maxHealth: 45,
      attack: 7,
      defense: 1,
      initiative: 7,
      description: "A large predator native to these lands, driven to attack by hunger.",
      tactics: ["Claw Swipe", "Pounce", "Intimidating Roar"],
      preferredDistance: 0, // prefers close range
      style: "aggressive",
      personality: "predatory",
      morale: 70,
      stamina: 90,
      maxStamina: 90,
      momentum: 0,
      staggerThreshold: 5, // Hard to stagger
      abilities: {
        "claw_swipe": {
          name: "Claw Swipe",
          damage: 6,
          windUp: 2,
          recovery: 1,
          stamina: 4,
          maxRange: 0,
          description: "A vicious slash with sharp claws."
        },
        "pounce": {
          name: "Pounce",
          damage: 8,
          windUp: 2,
          recovery: 3,
          stamina: 6,
          effect: "distance-2",
          maxRange: 2,
          description: "A leaping attack that closes distance quickly."
        },
        "roar": {
          name: "Intimidating Roar",
          effect: "morale-10",
          windUp: 1,
          recovery: 1,
          stamina: 3,
          description: "A terrifying roar that can shake even seasoned warriors."
        },
        "feral_frenzy": {
          name: "Feral Frenzy",
          damage: 10,
          windUp: 3,
          recovery: 4,
          stamina: 10,
          maxRange: 0,
          description: "A series of rapid, savage attacks that can cause bleeding."
        }
      },
      behavior: function(state) {
        // Beast AI - more instinctual and predatory
        const options = [];
        
        // Check if staggered
        if (this.staggered) {
          options.push("roar"); // Try to intimidate when hurt
          return options;
        }
        
        // If very low on health, may flee (even predators retreat when severely injured)
        if (this.health < this.maxHealth * 0.2) {
          if (Math.random() < 0.4) {
            options.push("retreat");
            return options;
          }
        }
        
        // If player is wounded, go for the kill with frenzy
        if (state.playerHealth < state.playerMaxHealth * 0.3 && state.combatDistance === 0) {
          options.push("feral_frenzy");
          return options; // Bloodlust takes over
        }
        
        // If at range, always try to pounce
        if (state.combatDistance > 0) {
          options.push("pounce");
          return options;
        }
        
        // At close range, mostly use claw attacks
        if (state.combatDistance === 0) {
          // Use feral frenzy if we have momentum
          if (this.momentum >= 3) {
            options.push("feral_frenzy");
          } else {
            options.push("claw_swipe");
            // Occasionally roar
            if (Math.random() < 0.2) {
              options.push("roar");
            }
          }
        }
        
        return options[Math.floor(Math.random() * options.length)];
      }
    }
  };
  
  // Set enemy max health to ensure proper calculations
  const enemy = enemies[enemyType] || enemies.arrasi_scout;
  enemy.maxHealth = enemy.health;
  enemy.maxStamina = enemy.stamina;
  enemy.momentum = 0;
  enemy.staggered = false;
  enemy.injuries = [];
  
  return enemy;
};

// === COMBAT TERRAIN AND WEATHER ===
// Define effects of terrain and weather on combat
const environmentalEffects = {
  terrain: {
    "normal": {
      description: "Stable ground with no special effects.",
      effects: {}
    },
    "rocky": {
      description: "Uneven terrain with loose stones makes footing uncertain.",
      effects: {
        rangedBonus: 0.1, // Bonus to ranged attacks from high ground
        heavyAttackPenalty: 0.1 // Penalty to heavy attacks requiring stability
      }
    },
    "slippery": {
      description: "Wet or icy ground makes footwork treacherous.",
      effects: {
        movementFailChance: 0.2, // Chance for movement actions to fail
        dodgePenalty: 0.15, // Harder to dodge on slippery ground
        heavyAttackPenalty: 0.2 // Big penalty to heavy attacks
      }
    },
    "confined": {
      description: "Limited space restricts movement and favors close combat.",
      effects: {
        maxDistance: 1, // Can't move beyond medium range
        dodgePenalty: 0.1, // Harder to dodge in confined spaces
        meleeBonus: 0.1 // Bonus to melee attacks
      }
    }
  },
  weather: {
    "clear": {
      description: "Clear weather with good visibility.",
      effects: {}
    },
    "rain": {
      description: "Steady rainfall reduces visibility and makes black powder weapons unreliable.",
      effects: {
        matchlockFailChance: 0.3, // Chance for black powder weapons to misfire
        visionPenalty: 0.1, // Reduced chance to spot telegraphed moves
        slipperyTerrain: true // May convert terrain to slippery
      }
    },
    "fog": {
      description: "Dense fog severely limits visibility.",
      effects: {
        rangedPenalty: 0.2, // Penalty to ranged attacks
        visionPenalty: 0.25, // Significant penalty to spotting telegraphed moves
        initiativeReduction: 1 // Reduces initiative for all combatants
      }
    },
    "wind": {
      description: "Strong winds affect ranged attacks and make it difficult to hear.",
      effects: {
        rangedPenalty: 0.15, // Penalty to ranged attacks
        reactionPenalty: 0.1 // Harder to react due to noise and distraction
      }
    },
    "heat": {
      description: "Sweltering heat drains stamina more quickly.",
      effects: {
        staminaPenaltyMultiplier: 1.5, // Actions cost more stamina
        recoveryPenalty: 0.2 // Slower stamina recovery
      }
    }
  }
};

// Function to determine the terrain and weather effects for combat
function determineEnvironmentalFactors() {
  // Base the terrain and weather on current game conditions or random chance
  let terrain = "normal";
  let weather = window.gameState.weather || "clear";
  
  // 40% chance for special terrain based on location
  if (Math.random() < 0.4) {
    const terrainOptions = ["normal", "rocky", "slippery", "confined"];
    terrain = terrainOptions[Math.floor(Math.random() * terrainOptions.length)];
  }
  
  // If game already has weather, use it, otherwise randomize for combat
  if (weather === "clear" && Math.random() < 0.3) {
    const weatherOptions = ["clear", "rain", "fog", "wind", "heat"];
    weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
  }
  
  // Special case: if weather is rainy and terrain is normal, 50% chance to make it slippery
  if (weather === "rain" && terrain === "normal" && Math.random() < 0.5) {
    terrain = "slippery";
  }
  
  return { terrain, weather };
}

// Function to apply environmental effects to an action
function applyEnvironmentalEffects(action, actor, environment) {
  const terrainEffects = environmentalEffects.terrain[environment.terrain].effects;
  const weatherEffects = environmentalEffects.weather[environment.weather].effects;
  
  // Clone the action to avoid modifying the original
  const modifiedAction = { ...action };
  
  // Apply terrain effects
  if (terrainEffects.rangedBonus && action.minRange > 0) {
    modifiedAction.damage = action.damage * (1 + terrainEffects.rangedBonus);
  }
  
  if (terrainEffects.heavyAttackPenalty && action.name.includes("Heavy")) {
    modifiedAction.damage = action.damage * (1 - terrainEffects.heavyAttackPenalty);
    modifiedAction.windUp = action.windUp + 1; // Slower on difficult terrain
  }
  
  if (terrainEffects.movementFailChance && (action.type === 'advance' || action.type === 'retreat')) {
    modifiedAction.failChance = terrainEffects.movementFailChance;
  }
  
  // Apply weather effects
  if (weatherEffects.matchlockFailChance && action.name.includes("Shot")) {
    modifiedAction.failChance = (modifiedAction.failChance || 0) + weatherEffects.matchlockFailChance;
  }
  
  if (weatherEffects.rangedPenalty && action.minRange > 0) {
    modifiedAction.damage = action.damage * (1 - weatherEffects.rangedPenalty);
  }
  
  if (weatherEffects.staminaPenaltyMultiplier) {
    modifiedAction.stamina = action.stamina * weatherEffects.staminaPenaltyMultiplier;
  }
  
  return modifiedAction;
}

// === INJURY SYSTEM ===
// Define potential injuries and their effects
const injuryTypes = {
  "bleeding": {
    name: "Bleeding",
    description: "Taking damage over time until treated",
    duration: 3, // Turns
    damagePerTurn: 2,
    effect: "healthOverTime"
  },
  "fractured_arm": {
    name: "Fractured Arm",
    description: "Reduces attack damage",
    duration: 5,
    damagePenalty: 0.3,
    effect: "attackPenalty"
  },
  "twisted_ankle": {
    name: "Twisted Ankle",
    description: "Movement actions cost more and are slower",
    duration: 4,
    movementPenalty: 0.5,
    effect: "movementPenalty"
  },
  "concussion": {
    name: "Concussion",
    description: "Reduced reactions and initiative",
    duration: 3,
    reactionPenalty: 0.3,
    initiativePenalty: 2,
    effect: "mentalPenalty"
  }
};

// Function to apply an injury
function applyInjury(target, injuryType) {
  const injury = { ...injuryTypes[injuryType], remainingDuration: injuryTypes[injuryType].duration };
  
  if (target === "player") {
    window.gameState.playerInjuries.push(injury);
    document.getElementById('combatLog').innerHTML += `<p>You suffer a ${injury.name}! ${injury.description}.</p>`;
  } else if (target === "enemy") {
    const enemy = window.gameState.currentEnemy;
    enemy.injuries = enemy.injuries || [];
    enemy.injuries.push(injury);
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} suffers a ${injury.name}!</p>`;
  }
}

// Function to check for injury chance based on attack type and damage
function checkForInjury(attack, damage, targetHealth) {
  // Higher chance for injuries with heavy attacks or when target is already wounded
  let injuryChance = 0.05; // Base 5% chance
  
  if (attack.name.includes("Heavy") || attack.name.includes("Frenzy")) {
    injuryChance += 0.1;
  }
  
  if (targetHealth < targetHealth / 3) {
    injuryChance += 0.15; // More likely when target is badly hurt
  }
  
  if (damage > 8) {
    injuryChance += 0.1; // Big hits more likely to cause injuries
  }
  
  // Determine injury type based on attack
  if (Math.random() < injuryChance) {
    let possibleInjuries = [];
    
    if (attack.name.includes("Slash") || attack.name.includes("Claw") || attack.name.includes("Frenzy")) {
      possibleInjuries.push("bleeding");
    }
    
    if (attack.name.includes("Bash") || attack.name.includes("Heavy")) {
      possibleInjuries.push("fractured_arm", "concussion");
    }
    
    if (attack.name.includes("Sweep") || attack.name.includes("Trip")) {
      possibleInjuries.push("twisted_ankle");
    }
    
    // Default if no specific matches
    if (possibleInjuries.length === 0) {
      possibleInjuries = ["bleeding", "fractured_arm", "twisted_ankle", "concussion"];
    }
    
    return possibleInjuries[Math.floor(Math.random() * possibleInjuries.length)];
  }
  
  return null;
}

// Function to process active injuries each turn
function processInjuries() {
  // Process player injuries
  window.gameState.playerInjuries.forEach((injury, index) => {
    // Apply effect
    if (injury.effect === "healthOverTime") {
      window.gameState.health = Math.max(1, window.gameState.health - injury.damagePerTurn);
      document.getElementById('combatLog').innerHTML += `<p>You take ${injury.damagePerTurn} damage from ${injury.name}.</p>`;
    }
    
    // Reduce duration
    injury.remainingDuration--;
    
    // Remove if expired
    if (injury.remainingDuration <= 0) {
      window.gameState.playerInjuries.splice(index, 1);
      document.getElementById('combatLog').innerHTML += `<p>Your ${injury.name} has healed.</p>`;
    }
  });
  
  // Process enemy injuries
  const enemy = window.gameState.currentEnemy;
  if (enemy && enemy.injuries) {
    enemy.injuries.forEach((injury, index) => {
      // Apply effect
      if (injury.effect === "healthOverTime") {
        enemy.health = Math.max(0, enemy.health - injury.damagePerTurn);
        document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} takes ${injury.damagePerTurn} damage from ${injury.name}.</p>`;
      }
      
      // Reduce duration
      injury.remainingDuration--;
      
      // Remove if expired
      if (injury.remainingDuration <= 0) {
        enemy.injuries.splice(index, 1);
        document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name}'s ${injury.name} has healed.</p>`;
      }
    });
  }
}

// === COMBAT FLOW FUNCTIONS ===

// Initialize combat with the new system
function startDynamicCombat(enemyType) {
  // Create enemy
  const enemy = window.createEnemy(enemyType);
  if (!enemy) {
    console.error("Failed to create enemy of type: " + enemyType);
    return;
  }
  
  // Determine environmental factors
  const environment = determineEnvironmentalFactors();
  
  // Store enemy and environment in game state
  window.gameState.currentEnemy = enemy;
  window.gameState.inBattle = true;
  window.gameState.combatPhase = "initiative";
  window.gameState.combatDistance = 2; // Start at far distance
  window.gameState.combatStance = "neutral";
  window.gameState.enemyStance = enemy.style || "neutral";
  window.gameState.actionQueue = [];
  window.gameState.playerMomentum = 0;
  window.gameState.enemyMomentum = 0;
  window.gameState.playerInjuries = [];
  window.gameState.playerStaggered = false;
  window.gameState.terrain = environment.terrain;
  window.gameState.weather = environment.weather;
  window.gameState.consecutiveHits = 0;
  window.gameState.currentTick = 0;
  
  // Calculate initiative
  calculateInitiative(enemy);
  
  // Setup combat UI with phase-based display
  setupCombatUI(enemy, environment);
  
  // Begin the combat round
  startCombatRound();
}

// Calculate initiative for combat
function calculateInitiative(enemy) {
  // Base initiative values
  let playerInit = 5 + (window.player.skills.tactics || 0) + (Math.random() * 3);
  let enemyInit = enemy.initiative + (Math.random() * 3);
  
  // Apply weather effects (fog reduces initiative)
  if (window.gameState.weather === "fog") {
    playerInit -= environmentalEffects.weather.fog.effects.initiativeReduction;
    enemyInit -= environmentalEffects.weather.fog.effects.initiativeReduction;
  }
  
  // Apply injury effects
  window.gameState.playerInjuries.forEach(injury => {
    if (injury.initiativePenalty) {
      playerInit -= injury.initiativePenalty;
    }
  });
  
  enemy.injuries.forEach(injury => {
    if (injury.initiativePenalty) {
      enemyInit -= injury.initiativePenalty;
    }
  });
  
  // Set initiative order
  if (playerInit >= enemyInit) {
    window.gameState.initiativeOrder = ["player", "enemy"];
    window.gameState.initiativeValues = {player: playerInit, enemy: enemyInit};
  } else {
    window.gameState.initiativeOrder = ["enemy", "player"];
    window.gameState.initiativeValues = {player: playerInit, enemy: enemyInit};
  }
  
  window.gameState.currentInitiative = 0;
}

// Setup the combat UI for the new phased system
function setupCombatUI(enemy, environment) {
  cleanupCombatUI();
  document.getElementById('enemyName').textContent = enemy.name;
  document.getElementById('enemyHealthDisplay').textContent = `${enemy.health} HP`;
  document.getElementById('playerHealthDisplay').textContent = `${Math.round(window.gameState.health)} HP`;
  
  // Update health bars
  document.getElementById('enemyCombatHealth').style.width = '100%';
  document.getElementById('playerCombatHealth').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
  
  // Show combat interface
  document.getElementById('combatInterface').classList.remove('hidden');
  
  // Add the new distance/position indicator
  addDistanceIndicator();
  
  // Add stance indicator
  addStanceIndicator();
  
  // Add environment indicator
  addEnvironmentIndicator(environment);
  
  // Add momentum indicator
  addMomentumIndicator();
  
  // Populate initial combat actions based on phase
  updateCombatActions();
  
  // Set combat log
  document.getElementById('combatLog').innerHTML = `<p>You are engaged in combat with a ${enemy.name}. ${enemy.description}</p>`;
  document.getElementById('combatLog').innerHTML += `<p>Combat begins at ${getDistanceText(window.gameState.combatDistance)} range on ${environment.terrain} terrain in ${environment.weather} weather.</p>`;
  document.getElementById('combatLog').innerHTML += `<p>Initiative order: ${window.gameState.initiativeOrder[0]} first, then ${window.gameState.initiativeOrder[1]}.</p>`;
  
  // Disable regular action buttons during combat
  document.getElementById('actions').style.display = 'none';
}

// Add environment indicator to UI
function addEnvironmentIndicator(environment) {
  // First, remove any existing environment container to prevent duplication
  const existingContainer = document.getElementById('environmentContainer');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  const combatHeader = document.getElementById('combatHeader');
  const stanceContainer = document.getElementById('stanceContainer');
  
  const environmentContainer = document.createElement('div');
  environmentContainer.id = 'environmentContainer';
  environmentContainer.style.width = '100%';
  environmentContainer.style.display = 'flex';
  environmentContainer.style.justifyContent = 'space-between';
  environmentContainer.style.alignItems = 'center';
  environmentContainer.style.margin = '10px 0';
  
  // Terrain indicator
  const terrainDiv = document.createElement('div');
  terrainDiv.style.width = '45%';
  
  const terrainLabel = document.createElement('div');
  terrainLabel.textContent = 'Terrain:';
  
  const terrainValue = document.createElement('div');
  terrainValue.id = 'terrainValue';
  terrainValue.style.fontWeight = 'bold';
  terrainValue.textContent = capitalizeFirstLetter(environment.terrain);
  
  terrainDiv.appendChild(terrainLabel);
  terrainDiv.appendChild(terrainValue);
  
  // Weather indicator
  const weatherDiv = document.createElement('div');
  weatherDiv.style.width = '45%';
  weatherDiv.style.textAlign = 'right';
  
  const weatherLabel = document.createElement('div');
  weatherLabel.textContent = 'Weather:';
  
  const weatherValue = document.createElement('div');
  weatherValue.id = 'weatherValue';
  weatherValue.style.fontWeight = 'bold';
  weatherValue.textContent = capitalizeFirstLetter(environment.weather);
  
  weatherDiv.appendChild(weatherLabel);
  weatherDiv.appendChild(weatherValue);
  
  environmentContainer.appendChild(terrainDiv);
  environmentContainer.appendChild(weatherDiv);
  
  // Insert after stance container if it exists, otherwise after combat header
  if (stanceContainer) {
    stanceContainer.parentNode.insertBefore(environmentContainer, stanceContainer.nextSibling);
  } else if (combatHeader) {
    combatHeader.parentNode.insertBefore(environmentContainer, combatHeader.nextSibling);
  }
}

// Add momentum indicator
function addMomentumIndicator() {
  // First, remove any existing momentum container to prevent duplication
  const existingContainer = document.getElementById('momentumContainer');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  const environmentContainer = document.getElementById('environmentContainer');
  
  const momentumContainer = document.createElement('div');
  momentumContainer.id = 'momentumContainer';
  momentumContainer.style.width = '100%';
  momentumContainer.style.display = 'flex';
  momentumContainer.style.justifyContent = 'space-between';
  momentumContainer.style.alignItems = 'center';
  momentumContainer.style.margin = '10px 0';
  
  // Player momentum
  const playerMomentumDiv = document.createElement('div');
  playerMomentumDiv.style.width = '45%';
  
  const playerMomentumLabel = document.createElement('div');
  playerMomentumLabel.textContent = 'Your Momentum:';
  
  const playerMomentumValue = document.createElement('div');
  playerMomentumValue.id = 'playerMomentumValue';
  playerMomentumValue.style.fontWeight = 'bold';
  playerMomentumValue.textContent = window.gameState.playerMomentum;
  
  playerMomentumDiv.appendChild(playerMomentumLabel);
  playerMomentumDiv.appendChild(playerMomentumValue);
  
  // Enemy momentum
  const enemyMomentumDiv = document.createElement('div');
  enemyMomentumDiv.style.width = '45%';
  enemyMomentumDiv.style.textAlign = 'right';
  
  const enemyMomentumLabel = document.createElement('div');
  enemyMomentumLabel.textContent = 'Enemy Momentum:';
  
  const enemyMomentumValue = document.createElement('div');
  enemyMomentumValue.id = 'enemyMomentumValue';
  enemyMomentumValue.style.fontWeight = 'bold';
  enemyMomentumValue.textContent = window.gameState.enemyMomentum;
  
  enemyMomentumDiv.appendChild(enemyMomentumLabel);
  enemyMomentumDiv.appendChild(enemyMomentumValue);
  
  momentumContainer.appendChild(playerMomentumDiv);
  momentumContainer.appendChild(enemyMomentumDiv);
  
  // Insert after environment container if it exists
  if (environmentContainer) {
    environmentContainer.parentNode.insertBefore(momentumContainer, environmentContainer.nextSibling);
  } else {
    // If environment container doesn't exist, add it after the distance container
    const distanceContainer = document.getElementById('distanceContainer');
    if (distanceContainer) {
      distanceContainer.parentNode.insertBefore(momentumContainer, distanceContainer.nextSibling);
    }
  }
  
  // Update momentum values
  updateMomentumIndicator();
}

// Update the momentum indicator
function updateMomentumIndicator() {
  const playerMomentumValue = document.getElementById('playerMomentumValue');
  const enemyMomentumValue = document.getElementById('enemyMomentumValue');
  
  if (playerMomentumValue && enemyMomentumValue) {
    playerMomentumValue.textContent = window.gameState.playerMomentum;
    enemyMomentumValue.textContent = window.gameState.enemyMomentum;
    
    // Update colors based on momentum value
    if (window.gameState.playerMomentum > 0) {
      playerMomentumValue.style.color = '#4bff91'; // Green for positive momentum
    } else if (window.gameState.playerMomentum < 0) {
      playerMomentumValue.style.color = '#ff4b4b'; // Red for negative momentum
    } else {
      playerMomentumValue.style.color = '#e0e0e0'; // Default for neutral
    }
    
    if (window.gameState.enemyMomentum > 0) {
      enemyMomentumValue.style.color = '#ff4b4b'; // Red for enemy's positive momentum (bad for player)
    } else if (window.gameState.enemyMomentum < 0) {
      enemyMomentumValue.style.color = '#4bff91'; // Green for enemy's negative momentum (good for player)
    } else {
      enemyMomentumValue.style.color = '#e0e0e0'; // Default for neutral
    }
  }
}

// Add distance indicator to combat UI
function addDistanceIndicator() {
  // First, remove any existing distance container to prevent duplication
  const existingContainer = document.getElementById('distanceContainer');
  if (existingContainer) {
    existingContainer.remove();
  }

  const combatHeader = document.getElementById('combatHeader');
  
  const distanceContainer = document.createElement('div');
  distanceContainer.id = 'distanceContainer';
  distanceContainer.style.width = '100%';
  distanceContainer.style.display = 'flex';
  distanceContainer.style.justifyContent = 'space-between';
  distanceContainer.style.alignItems = 'center';
  distanceContainer.style.margin = '10px 0';
  
  const distanceLabel = document.createElement('div');
  distanceLabel.textContent = 'Combat Distance:';
  distanceLabel.style.marginRight = '10px';
  
  const distanceIndicator = document.createElement('div');
  distanceIndicator.id = 'distanceIndicator';
  distanceIndicator.style.flex = '1';
  distanceIndicator.style.height = '20px';
  distanceIndicator.style.background = '#333';
  distanceIndicator.style.borderRadius = '4px';
  distanceIndicator.style.position = 'relative';
  
  // Add distance markers
  const markerLabels = ['Close', 'Medium', 'Far'];
  for (let i = 0; i < 3; i++) {
    const marker = document.createElement('div');
    marker.style.position = 'absolute';
    marker.style.top = '-20px';
    marker.style.left = `${i * 50}%`;
    marker.style.transform = 'translateX(-50%)';
    marker.style.fontSize = '0.8em';
    marker.textContent = markerLabels[i];
    distanceIndicator.appendChild(marker);
  }
  
  // Add position token
  const positionToken = document.createElement('div');
  positionToken.id = 'positionToken';
  positionToken.style.position = 'absolute';
  positionToken.style.width = '24px';
  positionToken.style.height = '24px';
  positionToken.style.borderRadius = '50%';
  positionToken.style.background = '#4b6bff';
  positionToken.style.top = '-2px';
  positionToken.style.left = `${(2 / 2) * 100}%`; // Start at far distance (2)
  positionToken.style.transform = 'translateX(-50%)';
  positionToken.style.transition = 'left 0.5s ease';
  distanceIndicator.appendChild(positionToken);
  
  distanceContainer.appendChild(distanceLabel);
  distanceContainer.appendChild(distanceIndicator);
  
  // Insert after combat header
  if (combatHeader) {
    combatHeader.parentNode.insertBefore(distanceContainer, combatHeader.nextSibling);
  } else {
    // Fallback if combat header is not found
    console.error("Combat header not found when adding distance indicator");
    const combatInterface = document.getElementById('combatInterface');
    if (combatInterface) {
      combatInterface.appendChild(distanceContainer);
    }
  }
  
  // Update position token
  updateDistanceIndicator();
}

// Add stance indicator to combat UI
function addStanceIndicator() {
  // First, remove any existing stance container to prevent duplication
  const existingContainer = document.getElementById('stanceContainer');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  const distanceContainer = document.getElementById('distanceContainer');
  
  const stanceContainer = document.createElement('div');
  stanceContainer.id = 'stanceContainer';
  stanceContainer.style.width = '100%';
  stanceContainer.style.display = 'flex';
  stanceContainer.style.justifyContent = 'space-between';
  stanceContainer.style.alignItems = 'center';
  stanceContainer.style.margin = '10px 0';
  
  // Player stance
  const playerStanceDiv = document.createElement('div');
  playerStanceDiv.style.width = '45%';
  
  const playerStanceLabel = document.createElement('div');
  playerStanceLabel.textContent = 'Your Stance:';
  
  const playerStanceValue = document.createElement('div');
  playerStanceValue.id = 'playerStanceValue';
  playerStanceValue.style.fontWeight = 'bold';
  playerStanceValue.style.color = '#4b6bff';
  playerStanceValue.textContent = capitalizeFirstLetter(window.gameState.combatStance);
  
  playerStanceDiv.appendChild(playerStanceLabel);
  playerStanceDiv.appendChild(playerStanceValue);
  
  // Enemy stance
  const enemyStanceDiv = document.createElement('div');
  enemyStanceDiv.style.width = '45%';
  enemyStanceDiv.style.textAlign = 'right';
  
  const enemyStanceLabel = document.createElement('div');
  enemyStanceLabel.textContent = 'Enemy Stance:';
  
  const enemyStanceValue = document.createElement('div');
  enemyStanceValue.id = 'enemyStanceValue';
  enemyStanceValue.style.fontWeight = 'bold';
  enemyStanceValue.style.color = '#ff4b4b';
  enemyStanceValue.textContent = capitalizeFirstLetter(window.gameState.enemyStance);
  
  enemyStanceDiv.appendChild(enemyStanceLabel);
  enemyStanceDiv.appendChild(enemyStanceValue);
  
  stanceContainer.appendChild(playerStanceDiv);
  stanceContainer.appendChild(enemyStanceDiv);
  
  // Insert after distance container
  if (distanceContainer) {
    distanceContainer.parentNode.insertBefore(stanceContainer, distanceContainer.nextSibling);
  } else {
    // If distance container doesn't exist yet, add it after the combat header
    const combatHeader = document.getElementById('combatHeader');
    if (combatHeader) {
      combatHeader.parentNode.insertBefore(stanceContainer, combatHeader.nextSibling);
    }
  }
  
  // Update stance indicators
  updateStanceIndicator();
}

function updateDistanceIndicator() {
  const positionToken = document.getElementById('positionToken');
  if (positionToken) {
    // Calculate position percentage based on distance
    // 0 = close = 0%, 1 = medium = 50%, 2 = far = 100%
    const percentage = (window.gameState.combatDistance / 2) * 100;
    positionToken.style.left = `${percentage}%`;
  }
}

function updateStanceIndicator() {
  const playerStanceValue = document.getElementById('playerStanceValue');
  const enemyStanceValue = document.getElementById('enemyStanceValue');
  
  if (playerStanceValue) {
    playerStanceValue.textContent = capitalizeFirstLetter(window.gameState.combatStance);
    
    // Update colors based on stance
    if (window.gameState.combatStance === 'aggressive') {
      playerStanceValue.style.color = '#ff4b4b'; // Red
    } else if (window.gameState.combatStance === 'defensive') {
      playerStanceValue.style.color = '#4bbfff'; // Blue
    } else if (window.gameState.combatStance === 'evasive') {
      playerStanceValue.style.color = '#4bff91'; // Green
    } else {
      playerStanceValue.style.color = '#4b6bff'; // Default
    }
  }
  
  if (enemyStanceValue) {
    enemyStanceValue.textContent = capitalizeFirstLetter(window.gameState.enemyStance);
    
    // Update colors based on stance
    if (window.gameState.enemyStance === 'aggressive') {
      enemyStanceValue.style.color = '#ff4b4b'; // Red
    } else if (window.gameState.enemyStance === 'defensive') {
      enemyStanceValue.style.color = '#4bbfff'; // Blue
    } else if (window.gameState.enemyStance === 'evasive') {
      enemyStanceValue.style.color = '#4bff91'; // Green
    } else {
      enemyStanceValue.style.color = '#ff4b4b'; // Default
    }
  }
}

// Clean up combat UI when combat ends
function cleanupCombatUI() {
  // Remove all combat indicators to prevent duplication on next combat
  const containersToRemove = [
    'distanceContainer',
    'stanceContainer',
    'environmentContainer',
    'momentumContainer'
  ];
  
  containersToRemove.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.remove();
    }
  });
}


// Get text description of distance
function getDistanceText(distance) {
  switch(distance) {
    case 0: return "close";
    case 1: return "medium";
    case 2: return "far";
    default: return "unknown";
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Start the combat round - determine who acts first
function startCombatRound() {
  // Process any active injuries
  processInjuries();
  
  // Check for stagger recovery
  if (window.gameState.playerStaggered) {
    // 50% chance to recover from stagger each round
    if (Math.random() < 0.5) {
      window.gameState.playerStaggered = false;
      document.getElementById('combatLog').innerHTML += `<p>You recover from your staggered state.</p>`;
    }
  }
  
  if (window.gameState.currentEnemy.staggered) {
    // 50% chance to recover from stagger each round
    if (Math.random() < 0.5) {
      window.gameState.currentEnemy.staggered = false;
      document.getElementById('combatLog').innerHTML += `<p>The ${window.gameState.currentEnemy.name} recovers from their staggered state.</p>`;
    }
  }
  
  window.gameState.combatPhase = "decision";
  
  // Get the current actor
  const currentActor = window.gameState.initiativeOrder[window.gameState.currentInitiative];
  
  if (currentActor === "player") {
    // Player's turn - show available actions
    updateCombatActions();
    
    // Notify of staggered state if applicable
    if (window.gameState.playerStaggered) {
      document.getElementById('combatLog').innerHTML += `<p>Your turn. You are staggered, limiting your options.</p>`;
    } else {
      document.getElementById('combatLog').innerHTML += `<p>Your turn. Select an action.</p>`;
    }
  } else {
    // Enemy's turn - execute AI behavior
    executeEnemyTurn();
  }
}

// Update available combat actions based on phase and distance
function updateCombatActions() {
  const combatActions = document.getElementById('combatActions');
  combatActions.innerHTML = '';

  const originalStartCombatRound = window.startCombatRound;
window.startCombatRound = function() {
  // Process any active buffs
  processEnemyBuffs();
  
  // Call the original function
  originalStartCombatRound();
};
  
  // In decision phase - show available actions based on distance and career
  if (window.gameState.combatPhase === "decision") {
    // If player is staggered, limited options
    if (window.gameState.playerStaggered) {
      addCombatButton('recover', 'Recover from Stagger', combatActions);
      addCombatButton('defensive_position', 'Defensive Position', combatActions);
      return;
    }
    
    // Common actions available at all distances
    if (window.gameState.combatDistance > 0) {
      addCombatButton('advance', 'Advance', combatActions);
    }
    
    if (window.gameState.combatDistance < 2) {
      addCombatButton('retreat', 'Retreat', combatActions);
    }
    
    // Distance-specific actions
    if (window.gameState.combatDistance === 0) { // Close range
      addCombatButton('quick_attack', 'Quick Strike', combatActions);
      addCombatButton('heavy_attack', 'Heavy Attack', combatActions);
      
      // Stance-triggered abilities
      if (window.gameState.combatStance === 'aggressive') {
        addCombatButton('flurry', 'Flurry of Blows', combatActions);
      }
      
      if (window.gameState.combatStance === 'defensive') {
        addCombatButton('shield_bash', 'Shield Bash', combatActions);
      }
      
      // Momentum-based abilities
      if (window.gameState.playerMomentum >= 3) {
        addCombatButton('finishing_blow', 'Finishing Blow', combatActions);
      }
      
      // Feint option
      addCombatButton('feint', 'Feint Attack', combatActions);
      
      // Career-specific melee abilities
      if (window.player.career && window.player.career.title) {
        if (window.player.career.title.includes('Berserker')) {
          addCombatButton('rage', 'Berserker Rage', combatActions);
        } else if (window.player.career.title.includes('Regular') || window.player.career.title.includes('Squire')) {
          addCombatButton('shield_block', 'Shield Block', combatActions);
        }
      }
    } else if (window.gameState.combatDistance === 1) { // Medium range
      // Most careers can do basic attacks at medium range
      addCombatButton('attack', 'Attack', combatActions);
      
      // Ranged options
      if (window.player.skills.marksmanship > 0) {
        addCombatButton('aimed_shot', 'Aimed Shot', combatActions);
        
        // High ground bonus for ranged on rocky terrain
        if (window.gameState.terrain === "rocky") {
          addCombatButton('high_ground_shot', 'High Ground Shot', combatActions);
        }
      }
      
      // Stance-triggered abilities
      if (window.gameState.combatStance === 'aggressive') {
        addCombatButton('lunge', 'Aggressive Lunge', combatActions);
      }
      
      // Feint option
      addCombatButton('feint_ranged', 'Feint Shot', combatActions);
    } else if (window.gameState.combatDistance === 2) { // Far range
      // Only ranged options at far range
      if (window.player.skills.marksmanship > 0) {
        addCombatButton('quick_shot', 'Quick Shot', combatActions);
        addCombatButton('aimed_shot', 'Aimed Shot', combatActions);
        
        // Weather considerations
        if (window.gameState.weather !== "rain" && window.gameState.weather !== "fog") {
          addCombatButton('sniper_shot', 'Sniper Shot', combatActions);
        }
      }
      
      // Geister abilities work at any range
      if (window.player.career && window.player.career.title && window.player.career.title.includes('Geister')) {
        addCombatButton('banish', 'Spectral Banishment', combatActions);
      }
    }
    
    // Treatment option if injured
    if (window.gameState.playerInjuries.length > 0 && window.player.skills.survival > 1) {
      addCombatButton('treat_wound', 'Treat Wound', combatActions);
    }
    
    // Stance changes available at any distance
    addCombatButton('stance_aggressive', 'Aggressive Stance', combatActions);
    addCombatButton('stance_defensive', 'Defensive Stance', combatActions);
    addCombatButton('stance_evasive', 'Evasive Stance', combatActions);
    
    // Retreat from battle entirely
    addCombatButton('flee', 'Flee Battle', combatActions);
  }
  // In preparation phase - show commit or cancel
  else if (window.gameState.combatPhase === "preparation") {
    addCombatButton('commit', 'Commit to Action', combatActions);
    addCombatButton('cancel', 'Cancel Action', combatActions);
  }
  // In reaction phase - show reactions if available
else if (window.gameState.combatPhase === "reaction") {
  const enemyAction = window.gameState.enemyQueuedAction;
  
  // If only bracing is allowed, just show that option
  if (window.gameState.onlyBracingAllowed) {
    addCombatButton('brace', 'Brace for Impact', combatActions);
    return;
  }
  
  // Available reactions depend on the enemy's action and player's skills
  if (enemyAction && enemyAction.type) {
    if (enemyAction.type.includes('attack') || enemyAction.type === 'quick_shot') {
      addCombatButton('dodge', 'Dodge', combatActions);

      if (enemyAction.type === "retreat" || enemyAction.effect === "distance+1") {
        // Show pursuit options when enemy is retreating
        addCombatButton('pursue', 'Pursue Enemy', combatActions);
        addCombatButton('hold_position', 'Hold Position', combatActions);
        return; // Exit early after showing these specific buttons
      }
      
      // Only show parry at close range and if player has sufficient skills
      if (window.gameState.combatDistance === 0 && window.player.skills.melee > 3) {
        addCombatButton('parry', 'Parry', combatActions);
        
        // Perfect parry option with high skill
        if (window.player.skills.melee > 6) {
          addCombatButton('perfect_parry', 'Perfect Parry (Risky)', combatActions);
        }
      }
      
      // Show block if player is in defensive stance
      if (window.gameState.combatStance === 'defensive') {
        addCombatButton('block', 'Block', combatActions);
      }
    }
    
    // Can also just brace for impact
    addCombatButton('brace', 'Brace for Impact', combatActions);
    
    // Terrain and stance specific reactions
    if (window.gameState.combatStance === 'evasive' && window.gameState.terrain !== 'slippery') {
      addCombatButton('sidestep', 'Sidestep', combatActions);
    }
  }
}
}

// Execute enemy turn using AI behavior
function executeEnemyTurn() {
  const enemy = window.gameState.currentEnemy;
  
  // If enemy is staggered, limited options
  if (enemy.staggered) {
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} is staggered and trying to recover.</p>`;
    
    // 70% chance to use turn to recover
    if (Math.random() < 0.7) {
      enemy.staggered = false;
      document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} recovers from being staggered.</p>`;
      advanceCombatTurn();
      return;
    }
    // 30% chance they'll still try to act while staggered (but limited options)
  }
  
  // Recover some stamina each turn
  enemy.stamina = Math.min(enemy.maxStamina, enemy.stamina + 10);
  
  // Get the battlefield state for AI decision making
  const battleState = {
    combatDistance: window.gameState.combatDistance,
    playerHealth: window.gameState.health,
    playerMaxHealth: window.gameState.maxHealth,
    playerStance: window.gameState.combatStance,
    playerMomentum: window.gameState.playerMomentum,
    terrain: window.gameState.terrain,
    weather: window.gameState.weather,
    morale: enemy.morale,
    enemyHealth: enemy.health,
    enemyMaxHealth: enemy.maxHealth,
    enemyMomentum: window.gameState.enemyMomentum,
    playerStaggered: window.gameState.playerStaggered
  };
  
  // Use the enemy's behavior function to decide action
  const chosenAction = enemy.behavior(battleState);
  
  // Get the details for the chosen ability
  let actionDetails = enemy.abilities[chosenAction];
  
  if (!actionDetails) {
    console.error(`Enemy ability not found: ${chosenAction}`);
    advanceCombatTurn(); // Skip turn on error
    return;
  }
  
  // Apply environmental effects to the action
  actionDetails = applyEnvironmentalEffects(actionDetails, enemy, {
    terrain: window.gameState.terrain,
    weather: window.gameState.weather
  });
  
  // Handle special surrender action
  if (chosenAction === "surrender") {
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} throws down their weapons! "Please, I surrender! Spare me!"</p>`;
    
    // End combat with special surrender result
    endCombatWithResult({
      battleOver: true,
      victory: true,
      surrender: true,
      narrative: `The ${enemy.name} has surrendered to you.`
    });
    return;
  }
  
  // Check if action fails due to environmental conditions
  if (actionDetails.failChance && Math.random() < actionDetails.failChance) {
    if (chosenAction.includes("shot") || chosenAction.includes("aim")) {
      document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} attempts to use ${actionDetails.name}, but their weapon misfires in the ${window.gameState.weather}!</p>`;
    } else if (chosenAction === "advance" || chosenAction === "retreat") {
      document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} tries to ${chosenAction}, but slips on the ${window.gameState.terrain} terrain!</p>`;
    } else {
      document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} fails to execute ${actionDetails.name} due to the conditions.</p>`;
    }
    
    // Reduce enemy momentum for failure
    window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
    updateMomentumIndicator();
    
    // Still consume the enemy's turn
    advanceCombatTurn();
    return;
  }
  
  // Check if enemy has enough stamina
  if (enemy.stamina < actionDetails.stamina) {
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} is too exhausted to use ${actionDetails.name} and must rest.</p>`;
    
    // Enemy recovers additional stamina
    enemy.stamina = Math.min(enemy.maxStamina, enemy.stamina + 15);
    
    // Reduce enemy momentum for failed action
    window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
    updateMomentumIndicator();
    
    // Still consume turn
    advanceCombatTurn();
    return;
  }
  
  // Handle feint specially
  if (chosenAction.includes("feint")) {
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} begins a motion that looks like ${actionDetails.name}...</p>`;
    
    // Consume stamina for the feint
    enemy.stamina -= actionDetails.stamina;
    
    // Set up a delayed reveal of the feint
    setTimeout(() => {
      document.getElementById('combatLog').innerHTML += `<p>It was a feint! The ${enemy.name} was trying to trick you into reacting.</p>`;
      
      // Determine if feint was successful based on player stance and skills
      const feintSuccessChance = 0.6 - (window.player.skills.tactics * 0.1);
      
      if (window.gameState.combatStance === 'defensive' && Math.random() < feintSuccessChance) {
        // Feint succeeded - player wasted energy or is vulnerable
        document.getElementById('combatLog').innerHTML += `<p>You fell for the feint and are momentarily exposed!</p>`;
        
        // Reduce player stamina and momentum
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 10);
        window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 2);
        
        // Increase enemy momentum
        window.gameState.enemyMomentum = Math.min(5, window.gameState.enemyMomentum + 1);
        updateMomentumIndicator();
      } else {
        document.getElementById('combatLog').innerHTML += `<p>You maintained your composure and didn't fall for the trick.</p>`;
      }
      
      advanceCombatTurn();
    }, 1500); // Delay to create suspense
    
    return;
  }
  
  // Log the enemy's intention - telegraphing the move
  document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} prepares to use ${actionDetails.name}. (Wind-up: ${actionDetails.windUp} seconds)</p>`;
  
  // Reduce enemy stamina
  enemy.stamina -= actionDetails.stamina;
  
  // Queue the enemy action
  window.gameState.enemyQueuedAction = {
    type: chosenAction,
    name: actionDetails.name,
    damage: actionDetails.damage,
    effect: actionDetails.effect,
    windUp: actionDetails.windUp,
    recovery: actionDetails.recovery,
    executionTime: actionDetails.windUp,
    maxRange: actionDetails.maxRange || 2,
    minRange: actionDetails.minRange || 0
  };
  
  // Determine if player can react based on skills and stance
  const canReact = canReactToEnemyAction(window.gameState.enemyQueuedAction);
  
  // Switch to reaction phase if player can react
  if (canReact) {
    window.gameState.combatPhase = "reaction";
    document.getElementById('combatLog').innerHTML += `<p>You have a chance to react!</p>`;
    updateCombatActions(); // Show reaction options
  } else {
    // No reaction possible, directly execute the enemy action after a short delay for telegraphing
    setTimeout(() => {
      executeQueuedEnemyAction();
    }, actionDetails.windUp * 500); // Faster for gameplay, multiply by 1000 for real seconds
  }
}

// Check if player can react to enemy action with improved calculation
// Check if player can react to enemy action with improved calculation
function canReactToEnemyAction(enemyAction) {
  // Non-damaging abilities like roars should only allow bracing
  if (enemyAction.effect === 'intimidate' || 
      enemyAction.effect === 'morale-10' ||
      enemyAction.effect === 'war_cry') {
    
    // Set a flag to indicate only bracing is allowed
    window.gameState.onlyBracingAllowed = true;
    return true; // Allow reaction phase but limit reactions in UI
  } else {
    // Reset the flag for normal attacks
    window.gameState.onlyBracingAllowed = false;
  }
  
  // Base chance factors
  const tacticsFactor = (window.player.skills.tactics || 0) * 0.1;
  const stanceFactor = window.gameState.combatStance === 'evasive' ? 0.2 : 0;
  
  // Action speed factor - slower actions are easier to react to
  const speedFactor = (enemyAction.windUp - 1) * 0.15;
  
  // Momentum factor - player with positive momentum has better reactions
  const momentumFactor = window.gameState.playerMomentum > 0 ? window.gameState.playerMomentum * 0.05 : 0;
  
  // Environmental factors
  let environmentalPenalty = 0;
  
  // Weather penalties
  if (window.gameState.weather === 'fog') {
    environmentalPenalty += environmentalEffects.weather.fog.effects.visionPenalty;
  } else if (window.gameState.weather === 'rain') {
    environmentalPenalty += environmentalEffects.weather.rain.effects.visionPenalty;
  } else if (window.gameState.weather === 'wind') {
    environmentalPenalty += environmentalEffects.weather.wind.effects.reactionPenalty;
  }
  
  // Injury penalties
  window.gameState.playerInjuries.forEach(injury => {
    if (injury.reactionPenalty) {
      environmentalPenalty += injury.reactionPenalty;
    }
  });
  
  // Staggered players can't react
  if (window.gameState.playerStaggered) {
    return false;
  }
  
  // Calculate final reaction chance
  const baseChance = 0.4; // 40% base chance
  const reactionChance = baseChance + tacticsFactor + stanceFactor + speedFactor + momentumFactor - environmentalPenalty;
  
  // Console log for debugging
  console.log(`Reaction calculation: Base ${baseChance} + Tactics ${tacticsFactor} + Stance ${stanceFactor} + Speed ${speedFactor} + Momentum ${momentumFactor} - Environment ${environmentalPenalty} = ${reactionChance}`);
  
  // Roll for reaction
  return Math.random() < reactionChance;
}

// Execute queued enemy action with enhanced effects
function executeQueuedEnemyAction() {
  const action = window.gameState.enemyQueuedAction;
  const enemy = window.gameState.currentEnemy;
  
  if (!action) {
    console.error("No enemy action queued");
    advanceCombatTurn();
    return;
  }
  
  let result = {
    playerDamage: 0,
    effectApplied: null,
    success: true,
    message: ""
  };
  
  // Check if the action is valid at current distance
  if ((action.minRange !== undefined && action.minRange > window.gameState.combatDistance) || 
      (action.maxRange !== undefined && action.maxRange < window.gameState.combatDistance)) {
    result.success = false;
    result.message = `The ${enemy.name}'s ${action.name} misses due to incorrect range.`;
  } 
  else {
    // Process the action based on its type
    if (action.damage) {
      // Calculate base damage
      let damage = action.damage;
      
      // Apply stance modifiers
      if (window.gameState.enemyStance === 'aggressive') {
        damage *= 1.2;
      } else if (window.gameState.combatStance === 'defensive') {
        damage *= 0.8;
      }

      // Apply attack buff if any
      if (enemy.attackBuff && enemy.attackBuff > 0) {
        damage += enemy.attackBuff;
        console.log(`Enemy attack buffed by ${enemy.attackBuff}. New damage: ${damage}`);
      }
      
      // Apply momentum modifiers
      if (window.gameState.enemyMomentum > 0) {
        damage *= (1 + (window.gameState.enemyMomentum * 0.1));
      } else if (window.gameState.enemyMomentum < 0) {
        damage *= (1 + (window.gameState.enemyMomentum * 0.05));
      }
      
      // Apply player defense
      damage = Math.max(1, Math.round(damage - (window.player.phy * 0.2)));
      
      // Apply injury effects
      window.gameState.playerInjuries.forEach(injury => {
        if (injury.name === "Fractured Arm" && action.type && action.type.includes("block")) {
          // Blocking with a fractured arm is less effective
          damage = Math.round(damage * (1 + injury.damagePenalty));
        }
      });
      
      result.playerDamage = damage;
      result.message = `The ${enemy.name} hits you with ${action.name}, dealing ${damage} damage.`;
      
      // Update consecutive hits for enemy
      window.gameState.consecutiveHits++;
      
      // Check if player gets staggered
      if (window.gameState.consecutiveHits >= 3) {
        window.gameState.playerStaggered = true;
        result.message += ` You are staggered by the repeated hits!`;
        window.gameState.consecutiveHits = 0; // Reset counter
      }
      
      // Check for injuries
      const injury = checkForInjury(action, damage, window.gameState.health);
      if (injury) {
        applyInjury("player", injury);
      }
      
      // Update momentum
      window.gameState.enemyMomentum = Math.min(5, window.gameState.enemyMomentum + 1);
      window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 1);
      updateMomentumIndicator();
    }
    
    // Apply any effects
    if (action.effect) {
      result.effectApplied = action.effect;
      
      if (action.effect.startsWith('distance')) {
        const distanceChange = parseInt(action.effect.slice(-1));
        const sign = action.effect.charAt(action.effect.length - 2);
        
        if (sign === '+') {
          window.gameState.combatDistance = Math.min(2, window.gameState.combatDistance + distanceChange);
          result.message += ` The ${enemy.name} increases distance.`;
        } else if (sign === '-') {
          window.gameState.combatDistance = Math.max(0, window.gameState.combatDistance - distanceChange);
          result.message += ` The ${enemy.name} closes in.`;
        }
        
        updateDistanceIndicator();
      }
      else if (action.effect === 'stun') {
        result.message += ` You are momentarily stunned.`;
        window.gameState.playerStaggered = true;
      }
      else if (action.effect === 'intimidate' || action.effect === 'morale-10') {
        // Handle intimidation effects (like roars)
        const moraleReduction = Math.floor(Math.random() * 10) + 5; // 5-15 morale reduction
        window.gameState.morale = Math.max(0, window.gameState.morale - moraleReduction);
        result.message = `The ${enemy.name} uses ${action.name}. The intimidating display lowers your morale by ${moraleReduction}.`;
        
        // Add buff for the enemy
        applyEnemyBuff({
          name: "Intimidated",
          stat: "attack",
          bonus: 2,
          duration: 2,
          description: "Intimidation boosts attack"
        });
        
        result.message += ` The display seems to empower their attacks!`;
      }
      else if (action.effect === 'defend+2' || action.effect === 'defensive') {
        // Defensive abilities
        result.message = `The ${enemy.name} uses ${action.name}, adopting a defensive stance.`;
        
        // Apply defense buff
        applyEnemyBuff({
          name: "Defensive Stance",
          stat: "defense",
          bonus: 2,
          duration: 3,
          description: "Improved defenses"
        });
      }
      else if (action.effect === 'buff' || action.effect === 'selfbuff') {
        // Generic buff abilities
        result.message = `The ${enemy.name} uses ${action.name}, preparing for their next move.`;
        
        // Apply generic buff
        applyEnemyBuff({
          name: action.name,
          stat: "attack",
          bonus: 2,
          duration: 2,
          description: "Enhanced combat ability"
        });
      }
    }
  }
  
  // Apply damage to player
  if (result.playerDamage > 0) {
    window.gameState.health = Math.max(0, window.gameState.health - result.playerDamage);
  }
  
  // Update combat log
  document.getElementById('combatLog').innerHTML += `<p>${result.message}</p>`;
  
  // Update health displays
  document.getElementById('playerHealthDisplay').textContent = `${Math.max(0, Math.round(window.gameState.health))} HP`;
  document.getElementById('playerCombatHealth').style.width = `${Math.max(0, (window.gameState.health / window.gameState.maxHealth) * 100)}%`;
  
  // Check for battle end
  if (window.gameState.health <= 0) {
    endCombatWithResult({
      battleOver: true,
      victory: false,
      narrative: `You have been defeated by the ${enemy.name}.`
    });
    return;
  }
  
  // Clear the queued action
  window.gameState.enemyQueuedAction = null;
  
  // Enemy enters recovery phase
  const recoveryTime = action.recovery * 500; // Convert to milliseconds but faster than real time
  document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} recovers from using ${action.name}.</p>`;
  
  // Allow interrupts during recovery
  if (window.gameState.allowInterrupts && action.recovery > 1 && window.player.skills.tactics > 2) {
    document.getElementById('combatLog').innerHTML += `<p>You spot an opening during their recovery!</p>`;
    
    // Add interrupt option
    const combatActions = document.getElementById('combatActions');
    combatActions.innerHTML = '';
    addCombatButton('interrupt', 'Exploit Opening', combatActions);
    
    // Set a timeout to advance turn if player doesn't interrupt
    window.interruptTimeout = setTimeout(() => {
      // Clear interrupt opportunity and advance turn
      if (window.gameState.inBattle) { // Check if still in battle
        document.getElementById('combatLog').innerHTML += `<p>The opportunity passes.</p>`;
        advanceCombatTurn();
      }
    }, recoveryTime);
    
    return;
  }
  
  // Use timeout to simulate recovery time
  setTimeout(() => {
    if (window.gameState.inBattle) { // Check if still in battle
      advanceCombatTurn();
    }
  }, recoveryTime);
}
  

// 2. Buff system for enemies
function applyEnemyBuff(buff) {
  const enemy = window.gameState.currentEnemy;
  
  // Initialize buffs array if it doesn't exist
  enemy.activeBuffs = enemy.activeBuffs || [];
  
  // Add the new buff
  enemy.activeBuffs.push({
    name: buff.name,
    stat: buff.stat,
    bonus: buff.bonus,
    duration: buff.duration,
    description: buff.description
  });
  
  // Apply the buff effect
  if (buff.stat === "attack") {
    enemy.attackBuff = (enemy.attackBuff || 0) + buff.bonus;
  } else if (buff.stat === "defense") {
    enemy.defenseBuff = (enemy.defenseBuff || 0) + buff.bonus;
  }
  
  // Log the buff application
  document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} gains ${buff.name}! ${buff.description}.</p>`;
}


// 3. Process enemy buffs each turn
function processEnemyBuffs() {
  const enemy = window.gameState.currentEnemy;
  
  // If no buffs, skip processing
  if (!enemy.activeBuffs || enemy.activeBuffs.length === 0) {
    return;
  }
  
  // Process each active buff
  for (let i = enemy.activeBuffs.length - 1; i >= 0; i--) {
    const buff = enemy.activeBuffs[i];
    
    // Reduce duration
    buff.duration--;
    
    // If expired, remove the buff
    if (buff.duration <= 0) {
      // Remove the stat bonus
      if (buff.stat === "attack") {
        enemy.attackBuff -= buff.bonus;
      } else if (buff.stat === "defense") {
        enemy.defenseBuff -= buff.bonus;
      }
      
      // Log the buff expiration
      document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name}'s ${buff.name} has worn off.</p>`;
      
      // Remove from active buffs
      enemy.activeBuffs.splice(i, 1);
    }
  }
}


// Add combat button to UI
function addCombatButton(action, label, container) {
  const btn = document.createElement('button');
  btn.className = 'action-btn';
  btn.textContent = label;
  btn.setAttribute('data-action', action);
  btn.onclick = function() {
    dynamicCombatAction(action);
  };
  container.appendChild(btn);
}

// Handle player combat action
function dynamicCombatAction(action) {
  // Clear any pending interrupt timeout
  if (window.interruptTimeout) {
    clearTimeout(window.interruptTimeout);
    window.interruptTimeout = null;
  }
  
  // Get current combat phase
  const phase = window.gameState.combatPhase;
  
  // Handle interrupt specially
  if (action === 'interrupt') {
    handleInterrupt();
    return;
  }
  
  // Handle actions based on phase
  if (phase === "decision") {
    // In decision phase, actions either execute immediately or queue up
    handleDecisionPhaseAction(action);
  }
  else if (phase === "preparation") {
    // In preparation phase, commit or cancel the queued action
    handlePreparationPhaseAction(action);
  }
  else if (phase === "reaction") {
    // In reaction phase, react to enemy action
    handleReactionPhaseAction(action);
  }
}

// Handle interrupt opportunity
function handleInterrupt() {
  // Quick attack only - limited options for interrupts
  const quickAttack = getPlayerActionDetails('quick_attack');
  
  // Apply a bonus to interrupt attacks
  quickAttack.damage = Math.ceil(quickAttack.damage * 1.5); // 50% damage bonus
  
  // Execute a quick attack with bonus
  executePlayerAction('quick_attack', quickAttack);
  
  document.getElementById('combatLog').innerHTML += `<p>You exploit the opening with a swift counter-attack!</p>`;
  
  // Tactics skill improvement chance from successful interrupt
  const tacticsImprovement = parseFloat((Math.random() * 0.04 + 0.02).toFixed(2));
  const mentalSkillCap = Math.floor(window.player.men / 1.5);
  
  if (Math.random() < 0.4 && window.player.skills.tactics < mentalSkillCap) {
    window.player.skills.tactics = Math.min(mentalSkillCap, window.player.skills.tactics + tacticsImprovement);
    document.getElementById('combatLog').innerHTML += `<p>Skills improved: tactics +${tacticsImprovement}.</p>`;
  }
}

// Handle action selected during decision phase
function handleDecisionPhaseAction(action) {
  // Get action details based on type
  const actionDetails = getPlayerActionDetails(action);
  
  // Check if player is staggered (limited options)
  if (window.gameState.playerStaggered && !['recover', 'defensive_position'].includes(action)) {
    document.getElementById('combatLog').innerHTML += `<p>You're too staggered to perform that action right now.</p>`;
    return;
  }
  
  // Handle special recovery from stagger
  if (action === 'recover') {
    window.gameState.playerStaggered = false;
    document.getElementById('combatLog').innerHTML += `<p>You take a moment to recover from your staggered state.</p>`;
    advanceCombatTurn();
    return;
  }
  
  // Handle defensive position while staggered
  if (action === 'defensive_position') {
    window.gameState.combatStance = 'defensive';
    updateStanceIndicator();
    document.getElementById('combatLog').innerHTML += `<p>You adopt a defensive stance while recovering.</p>`;
    window.gameState.playerStaggered = false;
    advanceCombatTurn();
    return;
  }
  
  // Handle treatment of wounds
  if (action === 'treat_wound') {
    // Requires survival skill
    if (window.player.skills.survival < 1.5) {
      document.getElementById('combatLog').innerHTML += `<p>You lack the survival skills to treat wounds effectively in combat.</p>`;
      return;
    }
    
    // Remove one random injury
    if (window.gameState.playerInjuries.length > 0) {
      const injuryIndex = Math.floor(Math.random() * window.gameState.playerInjuries.length);
      const treated = window.gameState.playerInjuries.splice(injuryIndex, 1)[0];
      document.getElementById('combatLog').innerHTML += `<p>You quickly treat your ${treated.name}, preventing further effects.</p>`;
      
      // Costs stamina to treat wounds
      window.gameState.stamina = Math.max(0, window.gameState.stamina - 15);
      
      // Survival skill improvement chance
      const survivalImprovement = parseFloat((Math.random() * 0.03 + 0.02).toFixed(2));
      const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
      
      if (Math.random() < 0.3 && window.player.skills.survival < survivalCap) {
        window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + survivalImprovement);
        document.getElementById('combatLog').innerHTML += `<p>Skills improved: survival +${survivalImprovement}.</p>`;
      }
      
      advanceCombatTurn();
    }
    return;
  }
  
  // Handle stance changes (execute immediately)
  if (action.startsWith('stance_')) {
    const stance = action.split('_')[1];
    window.gameState.combatStance = stance;
    updateStanceIndicator();
    document.getElementById('combatLog').innerHTML += `<p>You adopt a ${stance} stance.</p>`;
    return;
  }
  
  // Handle flee attempt
  if (action === 'flee') {
    attemptToFlee();
    return;
  }
  
  // Check if player has enough stamina for action
  const staminaCost = window.gameState.staminaPerAction[action.split('_')[0]] || 5;
  if (window.gameState.stamina < staminaCost) {
    document.getElementById('combatLog').innerHTML += `<p>You're too exhausted to perform that action. Try resting or using a less demanding action.</p>`;
    return;
  }
  
  // For actions with wind-up time, move to preparation phase
  if (actionDetails && actionDetails.windUp > 1) {
    window.gameState.playerQueuedAction = {
      type: action,
      name: actionDetails.name,
      damage: actionDetails.damage,
      effect: actionDetails.effect,
      windUp: actionDetails.windUp,
      recovery: actionDetails.recovery,
      preparationTime: actionDetails.windUp - 1,
      maxRange: actionDetails.maxRange,
      minRange: actionDetails.minRange
    };
    
    // Move to preparation phase
    window.gameState.combatPhase = "preparation";
    document.getElementById('combatLog').innerHTML += `<p>You prepare to use ${actionDetails.name}. Wind-up: ${actionDetails.windUp} seconds. Commit when ready.</p>`;
    updateCombatActions();
    return;
  }
  
  // For feint actions, handle special feint logic
  if (action === 'feint' || action === 'feint_ranged') {
    handleFeint(action);
    return;
  }
  
  // For immediate actions, execute right away
  executePlayerAction(action, actionDetails);
}

// Handle feint actions
function handleFeint(action) {
  // Get base details of the feint
  const isRanged = action === 'feint_ranged';
  const feintDetails = {
    name: isRanged ? "Feint Shot" : "Feint Attack",
    damage: 0, // No direct damage
    windUp: 2,
    recovery: 1,
    effect: "feint",
    stamina: 4,
    maxRange: isRanged ? 1 : 0,
    minRange: isRanged ? 1 : 0
  };
  
  // Check if enemy is susceptible to feints
  const enemy = window.gameState.currentEnemy;
  let feintSuccessChance = 0.5; // Base 50% chance
  
  // Tactics skill improves feint success
  feintSuccessChance += (window.player.skills.tactics || 0) * 0.1;
  
  // Enemy personality affects feint effectiveness
  if (enemy.personality === 'cautious') {
    feintSuccessChance += 0.2; // Cautious enemies more likely to respect threats
  } else if (enemy.personality === 'predatory') {
    feintSuccessChance -= 0.1; // Predatory enemies less likely to be fooled
  }
  
  // Momentum affects success chance
  if (window.gameState.playerMomentum > 0) {
    feintSuccessChance += window.gameState.playerMomentum * 0.05;
  }
  
  // Execute the feint
  document.getElementById('combatLog').innerHTML += `<p>You perform a ${feintDetails.name}, trying to bait a reaction from your opponent.</p>`;
  
  // Use stamina for the feint
  window.gameState.stamina = Math.max(0, window.gameState.stamina - feintDetails.stamina);
  
  // Determine success
  if (Math.random() < feintSuccessChance) {
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} falls for your feint and commits to a defensive reaction!</p>`;
    
    // Successful feint grants advantages
    window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 2);
    window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
    updateMomentumIndicator();
    
    // Enemy loses some stamina from wasted movement
    enemy.stamina = Math.max(0, enemy.stamina - 8);
    
    // Chance to cause stagger with very successful feint
    if (Math.random() < 0.3 && window.gameState.playerMomentum > 2) {
      enemy.staggered = true;
      document.getElementById('combatLog').innerHTML += `<p>Your feint was so convincing that the ${enemy.name} is now staggered!</p>`;
    }
    
    // Tactics skill improvement chance
    const tacticsImprovement = parseFloat((Math.random() * 0.03 + 0.02).toFixed(2));
    const mentalSkillCap = Math.floor(window.player.men / 1.5);
    
    if (Math.random() < 0.4 && window.player.skills.tactics < mentalSkillCap) {
      window.player.skills.tactics = Math.min(mentalSkillCap, window.player.skills.tactics + tacticsImprovement);
      document.getElementById('combatLog').innerHTML += `<p>Skills improved: tactics +${tacticsImprovement}.</p>`;
    }
  } else {
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} sees through your feint and doesn't take the bait.</p>`;
    
    // Failed feint slightly reduces player momentum
    window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 1);
    updateMomentumIndicator();
  }
  
  // Advance the turn after a short delay for the feint animation
  setTimeout(() => {
    advanceCombatTurn();
  }, 1500);
}

// Handle action selected during preparation phase
function handlePreparationPhaseAction(action) {
  if (action === 'commit') {
    // Commit to the queued action
    if (window.gameState.playerQueuedAction) {
      const queuedAction = window.gameState.playerQueuedAction;
      
      // Check if action is still valid (e.g., distance constraints)
      if (isActionValid(queuedAction)) {
        // Check for interrupt by enemy during wind-up
        const enemy = window.gameState.currentEnemy;
        const interruptChance = 0.15 + (enemy.initiative * 0.02) - (window.player.skills.discipline * 0.03);
        
        if (queuedAction.windUp > 2 && enemy.stamina > 20 && !enemy.staggered && Math.random() < interruptChance) {
          // Enemy interrupts the player's wind-up
          document.getElementById('combatLog').innerHTML += `<p>As you wind up for your attack, the ${enemy.name} interrupts with a quick strike!</p>`;
          
          // Enemy gets a free attack
          const quickAttack = {
            name: "Opportunistic Strike",
            damage: Math.ceil(enemy.attack * 0.8), // Slightly weaker than normal
            effect: null
          };
          
          // Apply the attack
          const damage = Math.max(1, quickAttack.damage - (window.player.phy * 0.2));
          window.gameState.health -= damage;
          
          document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name}'s interrupting attack deals ${damage} damage!</p>`;
          
          // Update player health display
          document.getElementById('playerHealthDisplay').textContent = `${Math.max(0, Math.round(window.gameState.health))} HP`;
          document.getElementById('playerCombatHealth').style.width = `${Math.max(0, (window.gameState.health / window.gameState.maxHealth) * 100)}%`;
          
          // Consume some enemy stamina
          enemy.stamina = Math.max(0, enemy.stamina - 10);
          
          // Return to decision phase with action canceled
          window.gameState.playerQueuedAction = null;
          window.gameState.combatPhase = "decision";
          updateCombatActions();
          
          // Check for player defeat
          if (window.gameState.health <= 0) {
            endCombatWithResult({
              battleOver: true,
              victory: false,
              narrative: `You are defeated while preparing an attack!`
            });
          }
          
          return;
        }
        
        // Execute the action
        executePlayerAction(queuedAction.type, queuedAction);
      } else {
        document.getElementById('combatLog').innerHTML += `<p>The conditions for ${queuedAction.name} are no longer valid. Action canceled.</p>`;
        window.gameState.combatPhase = "decision";
        updateCombatActions();
      }
    }
  } 
  else if (action === 'cancel') {
    // Cancel the queued action
    document.getElementById('combatLog').innerHTML += `<p>You cancel your prepared action.</p>`;
    window.gameState.playerQueuedAction = null;
    window.gameState.combatPhase = "decision";
    updateCombatActions();
  }
}


function calculateEnemyAttackWithBuffs(action, enemy) {
  let damage = action.damage || 0;
  
  // Apply attack buff if any
  if (enemy.attackBuff && enemy.attackBuff > 0) {
    damage += enemy.attackBuff;
  }
  
  return damage;
}

// Handle action selected during reaction phase
function handleReactionPhaseAction(action) {
  const enemyAction = window.gameState.enemyQueuedAction;
  
  if (!enemyAction) {
    console.error("No enemy action to react to");
    window.gameState.combatPhase = "decision";
    updateCombatActions();
    return;
  }

  if (action === 'pursue' || action === 'hold_position') {
    const enemy = window.gameState.currentEnemy;
    
    if (action === 'pursue') {
      // Calculate pursuit success chance based on attributes and skills
      const physicalFactor = window.player.phy * 0.4; // 40% weighting on physical
      const mentalFactor = window.player.men * 0.2; // 20% weighting on mental
      const meleeFactor = (window.player.skills.melee || 0) * 0.3; // 30% weighting on melee
      const tacticsFactor = (window.player.skills.tactics || 0) * 0.1; // 10% weighting on tactics
      
      // Calculate base success chance (scale to 0-1 range)
      const baseSuccessChance = (physicalFactor + mentalFactor + meleeFactor + tacticsFactor) / 10;
      
      // Apply factors like terrain and injuries
      let finalSuccessChance = baseSuccessChance;
      
      // Terrain affects pursuit chance
      if (window.gameState.terrain === 'slippery') {
        finalSuccessChance -= 0.2; // Harder to pursue on slippery ground
      } else if (window.gameState.terrain === 'rocky') {
        finalSuccessChance -= 0.1; // Slightly harder on rocky terrain
      }
      
      // Injuries affect pursuit
      window.gameState.playerInjuries.forEach(injury => {
        if (injury.name === "Twisted Ankle") {
          finalSuccessChance -= 0.3; // Much harder to pursue with a bad ankle
        }
      });
      
      // Stamina affects pursuit success
      if (window.gameState.stamina < window.gameState.maxStamina * 0.3) {
        finalSuccessChance -= 0.15; // Harder to pursue when tired
      }
      
      // Enemy factors 
      if (window.gameState.enemyStance === 'evasive') {
        finalSuccessChance -= 0.1; // Harder to catch evasive enemies
      }
      
      // Ensure the chance is within reasonable bounds
      finalSuccessChance = Math.max(0.1, Math.min(0.9, finalSuccessChance));
      
      // Roll for success
      const pursuitSuccess = Math.random() < finalSuccessChance;
      
      if (pursuitSuccess) {
        // Successful pursuit maintains distance and grants momentum
        document.getElementById('combatLog').innerHTML += `<p>You quickly pursue as the ${enemy.name} tries to retreat, maintaining combat distance!</p>`;
        
        // Cancel the enemy's retreat
        enemyAction.effect = null; // Nullify the distance change
        
        // Gain momentum for successful pursuit
        window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
        window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
        updateMomentumIndicator();
        
        // Use some stamina for the pursuit
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 10);
        
        // Skill improvement chance
        if (Math.random() < 0.3) {
          // Either melee or tactics could improve
          if (Math.random() < 0.7) {
            const meleeImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
            const meleeCap = Math.floor(window.player.phy / 1.5);
            
            if (window.player.skills.melee < meleeCap) {
              window.player.skills.melee = Math.min(meleeCap, window.player.skills.melee + meleeImprovement);
              document.getElementById('combatLog').innerHTML += `<p>Your pursuit tactics improved your melee combat skill (+${meleeImprovement}).</p>`;
            }
          } else {
            const tacticsImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
            const tacticsCap = Math.floor(window.player.men / 1.5);
            
            if (window.player.skills.tactics < tacticsCap) {
              window.player.skills.tactics = Math.min(tacticsCap, window.player.skills.tactics + tacticsImprovement);
              document.getElementById('combatLog').innerHTML += `<p>Your pursuit tactics improved your tactical thinking (+${tacticsImprovement}).</p>`;
            }
          }
        }
      } else {
        // Failed pursuit - enemy gets away
        document.getElementById('combatLog').innerHTML += `<p>You try to pursue the ${enemy.name}, but they manage to increase the distance between you.</p>`;
        
        // Use some stamina for the failed attempt
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 8);
      }
    } else if (action === 'hold_position') {
      // Player chooses not to pursue
      document.getElementById('combatLog').innerHTML += `<p>You hold your position as the ${enemy.name} retreats, increasing the distance between you.</p>`;
      
      // Slightly recover stamina for not exerting yourself
      window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + 5);
    }
    
    // Let the enemy action complete (may be nullified if pursuit was successful)
    executeQueuedEnemyAction();
    return;
  }
  
  let reactionSuccess = false;
  let reactionMessage = "";
  let counterAvailable = false;
  
  // Process different reaction types
  if (action === 'dodge') {
    // Dodge has higher chance of success with good skills and evasive stance
    let dodgeChance = 0.4 + (window.player.skills.survival || 0) * 0.1;
    
    // Apply stance bonus
    const stanceBonus = window.gameState.combatStance === 'evasive' ? 0.2 : 0;
    
    // Apply terrain penalty if slippery
    let terrainPenalty = 0;
    if (window.gameState.terrain === 'slippery') {
      terrainPenalty = environmentalEffects.terrain.slippery.effects.dodgePenalty;
    }
    
    // Apply injuries penalty
    let injuryPenalty = 0;
    window.gameState.playerInjuries.forEach(injury => {
      if (injury.name === "Twisted Ankle") {
        injuryPenalty += 0.2;
      }
    });
    
    // Apply momentum bonus
    let momentumBonus = 0;
    if (window.gameState.playerMomentum > 0) {
      momentumBonus = window.gameState.playerMomentum * 0.05;
    }
    
    // Final dodge chance calculation
    const finalDodgeChance = dodgeChance + stanceBonus + momentumBonus - terrainPenalty - injuryPenalty;
    
    // Log the calculation for debugging
    console.log(`Dodge chance: ${dodgeChance} + Stance ${stanceBonus} + Momentum ${momentumBonus} - Terrain ${terrainPenalty} - Injury ${injuryPenalty} = ${finalDodgeChance}`);
    
    reactionSuccess = Math.random() < finalDodgeChance;
    
    if (reactionSuccess) {
      // Successful dodge
      reactionMessage = `You successfully dodge the ${enemyAction.name}!`;
      
      // Use up some stamina for dodging
      window.gameState.stamina = Math.max(0, window.gameState.stamina - 10);
      
      // Increase dodge count and possibly momentum
      window.gameState.dodgeCount++;
      
      // Consecutive successful dodges build momentum
      if (window.gameState.dodgeCount >= 2) {
        window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
        window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
        updateMomentumIndicator();
      }
      
      // Evasive stance might enable a counter after dodge
      if (window.gameState.combatStance === 'evasive' && Math.random() < 0.4) {
        counterAvailable = true;
        reactionMessage += " Your evasive movement creates an opening for a counter!";
      }
    } else {
      // Failed dodge
      reactionMessage = `You attempt to dodge, but the ${enemyAction.name} still hits.`;
      
      // Still reduce damage slightly for trying
      enemyAction.damage = Math.max(1, Math.floor(enemyAction.damage * 0.8));
      
      // Reset dodge counter on failure
      window.gameState.dodgeCount = 0;
    }
  }
  else if (action === 'parry') {
    // Parry is harder but can set up counterattack
    let parryChance = 0.3 + (window.player.skills.melee || 0) * 0.1;
    
    // Apply stance and momentum modifiers
    if (window.gameState.combatStance === 'defensive') {
      parryChance += 0.1;
    }
    
    if (window.gameState.playerMomentum > 0) {
      parryChance += window.gameState.playerMomentum * 0.05;
    }
    
    // Apply injury penalties
    window.gameState.playerInjuries.forEach(injury => {
      if (injury.name === "Fractured Arm") {
        parryChance -= 0.15;
      }
    });
    
    reactionSuccess = Math.random() < parryChance;
    
    if (reactionSuccess) {
      reactionMessage = `You skillfully parry the ${enemyAction.name}!`;
      
      // Success creates a counterattack opportunity
      counterAvailable = true;
      window.gameState.counterAttackAvailable = true;
      
      // Successful parries boost momentum
      window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
      window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
      updateMomentumIndicator();
    } else {
      reactionMessage = `You fail to parry the ${enemyAction.name}.`;
      
      // Failed parry might result in worse damage if enemy has momentum
      if (window.gameState.enemyMomentum > 0) {
        enemyAction.damage = Math.ceil(enemyAction.damage * 1.1);
      }
    }
  }
  else if (action === 'perfect_parry') {
    // Perfect parry is high risk, high reward
    const basePerfectParryChance = 0.2 + (window.player.skills.melee || 0) * 0.05;
    
    // Momentum helps with timing
    let momentumBonus = 0;
    if (window.gameState.playerMomentum > 0) {
      momentumBonus = window.gameState.playerMomentum * 0.05;
    }
    
    // Final chance calculation
    const perfectParryChance = basePerfectParryChance + momentumBonus;
    
    // Perfect timing is hard to achieve
    if (Math.random() < perfectParryChance) {
      // Perfect parry succeeded!
      reactionMessage = `Perfect parry! You time the ${enemyAction.name} exactly right, deflecting it completely!`;
      reactionSuccess = true;
      
      // Guaranteed powerful counter
      counterAvailable = true;
      window.gameState.perfectParries++;
      
      // Strong momentum swing
      window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 2);
      window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 2);
      updateMomentumIndicator();
      
      // Chance to stagger enemy
      if (Math.random() < 0.5) {
        window.gameState.currentEnemy.staggered = true;
        reactionMessage += " The perfect deflection staggers your opponent!";
      }
    } else {
      // Failed perfect parry - worse than normal parry failure
      reactionMessage = `You attempt a perfect parry, but your timing is off! The ${enemyAction.name} hits you squarely.`;
      
      // Extra damage for failed perfect parry
      enemyAction.damage = Math.ceil(enemyAction.damage * 1.25);
      
      // Lose momentum for failed risky move
      window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 2);
      updateMomentumIndicator();
    }
  }
  else if (action === 'block') {
    // Block is reliable in defensive stance
    let blockChance = 0.6 + (window.player.skills.discipline || 0) * 0.1;
    
    // Huge bonus in defensive stance
    if (window.gameState.combatStance === 'defensive') {
      blockChance += 0.2;
    }
    
    // Injured arms affect blocking
    window.gameState.playerInjuries.forEach(injury => {
      if (injury.name === "Fractured Arm") {
        blockChance -= 0.15;
      }
    });
    
    reactionSuccess = Math.random() < blockChance;
    
    if (reactionSuccess) {
      // Damage reduction depends on skill and stance
      let damageReduction = 0.5; // Base 50% reduction
      
      if (window.gameState.combatStance === 'defensive') {
        damageReduction += 0.2; // 70% reduction in defensive stance
      }
      
      reactionMessage = `You block the ${enemyAction.name}, reducing its damage by ${Math.round(damageReduction * 100)}%.`;
      
      // Block significantly reduces damage
      enemyAction.damage = Math.max(1, Math.floor(enemyAction.damage * (1 - damageReduction)));
      
      // Defensive momentum
      if (window.gameState.combatStance === 'defensive') {
        window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
        updateMomentumIndicator();
      }
    } else {
      reactionMessage = `Your block fails to stop the ${enemyAction.name}.`;
      
      // Failed block still reduces damage slightly
      enemyAction.damage = Math.max(1, Math.floor(enemyAction.damage * 0.9));
    }
  }
  else if (action === 'sidestep') {
    // Sidestep is a graceful evasion with counter potential
    let sidestepChance = 0.3 + (window.player.skills.survival || 0) * 0.08;
    
    // Big bonus in evasive stance
    if (window.gameState.combatStance === 'evasive') {
      sidestepChance += 0.2;
    }
    
    // Terrain affects sidestep
    if (window.gameState.terrain === 'slippery') {
      sidestepChance -= 0.15;
    } else if (window.gameState.terrain === 'confined') {
      sidestepChance -= 0.1;
    }
    
    // Injured legs affect mobility
    window.gameState.playerInjuries.forEach(injury => {
      if (injury.name === "Twisted Ankle") {
        sidestepChance -= 0.2;
      }
    });
    
    reactionSuccess = Math.random() < sidestepChance;
    
    if (reactionSuccess) {
      reactionMessage = `You gracefully sidestep the ${enemyAction.name}, positioning yourself for a counter-attack!`;
      
      // Successful sidestep always enables counter
      counterAvailable = true;
      
      // Boost momentum
      window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
      updateMomentumIndicator();
    } else {
      reactionMessage = `You attempt to sidestep, but the ${enemyAction.name} catches you.`;
      
      // Reduce damage slightly
      enemyAction.damage = Math.max(1, Math.floor(enemyAction.damage * 0.85));
    }
  }
  else if (action === 'brace') {
    // Bracing always works to some extent
    reactionMessage = `You brace yourself against the ${enemyAction.name}.`;
    
    // Bracing reduces damage based on discipline and constitution
    let damageReduction = 0.2; // Base 20% reduction
    
    // Discipline skill helps with bracing
    if (window.player.skills.discipline > 1) {
      damageReduction += (window.player.skills.discipline * 0.05);
    }
    
    // Physical attribute contributes
    damageReduction += (window.player.phy * 0.02);
    
    // Cap damage reduction at 50%
    damageReduction = Math.min(0.5, damageReduction);
    
    enemyAction.damage = Math.max(1, Math.floor(enemyAction.damage * (1 - damageReduction)));
    reactionMessage += ` You reduce the damage by ${Math.round(damageReduction * 100)}%.`;
    
    reactionSuccess = true;
  }
  
  // Log the reaction result
  document.getElementById('combatLog').innerHTML += `<p>${reactionMessage}</p>`;
  
  // If reaction was completely successful (like a dodge), cancel the enemy action
  if (reactionSuccess && (action === 'dodge' || action === 'parry' || action === 'perfect_parry' || action === 'sidestep')) {
    window.gameState.enemyQueuedAction = null;
    window.gameState.combatPhase = "decision";
    
    // Reset consecutive hits since player successfully defended
    window.gameState.consecutiveHits = 0;
    
    // If counter is available, allow immediate counter attack
    if (counterAvailable) {
      handleCounterAttack(action === 'perfect_parry');
      return;
    }
    
    // Otherwise advance the combat turn
    advanceCombatTurn();
  } else {
    // If reaction was partial or failed, execute the enemy action
    executeQueuedEnemyAction();
  }
}

// Handle counter attack with improved options
function handleCounterAttack(isPerfectCounter = false) {
  // Create counter attack options container
  const combatActions = document.getElementById('combatActions');
  combatActions.innerHTML = '<h4>Counter Attack Opportunity!</h4>';
  
  // Basic counter attack
  addCombatButton('quick_counter', 'Quick Counter', combatActions);
  
  // Distance and stance-specific counters
  if (window.gameState.combatDistance === 0) {
    if (window.gameState.combatStance === 'aggressive') {
      addCombatButton('vicious_counter', 'Vicious Counter', combatActions);
    }
    
    if (window.player.skills.melee > 2) {
      addCombatButton('precise_counter', 'Precise Counter', combatActions);
    }
  } else if (window.player.skills.marksmanship > 0) {
    addCombatButton('snap_shot', 'Snap Shot', combatActions);
  }
  
  // Perfect counter options if from perfect parry
  if (isPerfectCounter) {
    addCombatButton('finishing_strike', 'Finishing Strike', combatActions);
  }
  
  // Skip counter button
  addCombatButton('skip_counter', 'Skip Counter', combatActions);
  
  // Set up counter action handler
  window.handleCounterAttackAction = function(counterType) {
    // Remove the handler to prevent multiple calls
    window.handleCounterAttackAction = null;
    
    // Execute the selected counter
    if (counterType === 'skip_counter') {
      document.getElementById('combatLog').innerHTML += `<p>You choose not to follow up with a counter attack.</p>`;
      advanceCombatTurn();
      return;
    }
    
    // Set up counter attack details
    let counterAttack = {
      type: counterType,
      name: 'Counter Attack',
      damage: 5 + (window.player.skills.melee || 0),
      stamina: 3,
      windUp: 1,
      recovery: 1,
      effect: null,
      maxRange: 0,
      minRange: 0
    };
    
    // Customize counter based on type
    if (counterType === 'quick_counter') {
      counterAttack.name = 'Quick Counter';
    } else if (counterType === 'vicious_counter') {
      counterAttack.name = 'Vicious Counter';
      counterAttack.damage = 8 + (window.player.skills.melee || 0);
      counterAttack.stamina = 5;
    } else if (counterType === 'precise_counter') {
      counterAttack.name = 'Precise Counter';
      counterAttack.damage = 6 + (window.player.skills.melee || 0);
      // Precise counter can cause bleeding
      counterAttack.effect = "bleeding_chance";
    } else if (counterType === 'snap_shot') {
      counterAttack.name = 'Snap Shot';
      counterAttack.damage = 4 + (window.player.skills.marksmanship || 0);
      counterAttack.minRange = 1;
      counterAttack.maxRange = 2;
    } else if (counterType === 'finishing_strike') {
      counterAttack.name = 'Finishing Strike';
      counterAttack.damage = 12 + (window.player.skills.melee || 0) + (window.gameState.playerMomentum || 0);
      counterAttack.stamina = 7;
      counterAttack.effect = "stagger_chance";
    }
    
    // Execute the counter attack
    const enemy = window.gameState.currentEnemy;
    
    document.getElementById('combatLog').innerHTML += `<p>You follow up with a ${counterAttack.name}!</p>`;
    
    // Use stamina for counter
    window.gameState.stamina = Math.max(0, window.gameState.stamina - counterAttack.stamina);
    
    // Calculate damage with modifiers
    let damage = counterAttack.damage;
    
    // Apply stance modifiers
    if (window.gameState.combatStance === 'aggressive') {
      damage = Math.floor(damage * 1.2);
    }
    
    // Apply momentum
    if (window.gameState.playerMomentum > 0) {
      damage = Math.floor(damage * (1 + (window.gameState.playerMomentum * 0.1)));
    }
    
    // Perfect counters get a damage boost
    if (isPerfectCounter) {
      damage = Math.floor(damage * 1.5);
    }
    
    // Apply enemy defense
    damage = Math.max(1, damage - (enemy.defense || 0));
    
    // Apply damage to enemy
    enemy.health -= damage;
    
    document.getElementById('combatLog').innerHTML += `<p>Your ${counterAttack.name} deals ${damage} damage!</p>`;
    
    // Handle special effects
    if (counterAttack.effect === "bleeding_chance" && Math.random() < 0.4) {
      applyInjury("enemy", "bleeding");
    } else if (counterAttack.effect === "stagger_chance" && Math.random() < 0.7) {
      enemy.staggered = true;
      document.getElementById('combatLog').innerHTML += `<p>Your powerful strike staggers the ${enemy.name}!</p>`;
    }
    
    // Update enemy health display
    document.getElementById('enemyHealthDisplay').textContent = `${Math.max(0, enemy.health)} HP`;
    document.getElementById('enemyCombatHealth').style.width = `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%`;
    
    // Build momentum for successful counter
    window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
    window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
    updateMomentumIndicator();
    
    // Check for enemy defeat
    if (enemy.health <= 0) {
      endCombatWithResult({
        battleOver: true,
        victory: true,
        narrative: `With a masterful ${counterAttack.name}, you defeat the ${enemy.name}!`
      });
      return;
    }
    
    // Clear counter attack flag
    window.gameState.counterAttackAvailable = false;
    
    // Advance combat turn
    advanceCombatTurn();
  };
  
  // Add event listeners to counter buttons
  const counterButtons = document.querySelectorAll('#combatActions .action-btn');
  counterButtons.forEach(btn => {
    const action = btn.getAttribute('data-action');
    btn.onclick = function() {
      if (window.handleCounterAttackAction) {
        window.handleCounterAttackAction(action);
      }
    };
  });
}

// Check if an action is valid given current combat state
function isActionValid(action) {
  // Check distance constraints
  if (action.minRange > window.gameState.combatDistance || action.maxRange < window.gameState.combatDistance) {
    return false;
  }
  
  // Check stamina requirements
  const staminaCost = window.gameState.staminaPerAction[action.type.split('_')[0]] || 0;
  if (window.gameState.stamina < staminaCost) {
    return false;
  }
  
  // Check terrain constraints
  if (window.gameState.terrain === 'confined' && window.gameState.combatDistance === 2 && 
      (action.type === 'advance' || action.effect === 'distance+1')) {
    return false; // Can't go beyond medium range in confined spaces
  }
  
  // Check injury constraints
  let valid = true;
  window.gameState.playerInjuries.forEach(injury => {
    if (injury.name === "Fractured Arm" && 
        (action.type.includes('attack') || action.type.includes('parry'))) {
      valid = false; // Hard to attack or parry with a broken arm
    }
    if (injury.name === "Twisted Ankle" && 
        (action.type === 'advance' || action.type === 'retreat')) {
      valid = false; // Hard to move with a bad ankle
    }
  });
  
  return valid;
}

// Execute a player action with enhanced effects
function executePlayerAction(actionType, actionDetails) {
  const enemy = window.gameState.currentEnemy;
  
  if (!enemy) {
    console.error("No enemy in combat");
    return;
  }
  
  // Default result structure
  let result = {
    enemyDamage: 0,
    effectApplied: null,
    success: true,
    message: "",
    skillImprovement: {}
  };
  
  // Set default action details if not provided
  if (!actionDetails) {
    actionDetails = getPlayerActionDetails(actionType);
  }
  
  // Apply environmental effects to the action
  actionDetails = applyEnvironmentalEffects(actionDetails, 'player', {
    terrain: window.gameState.terrain,
    weather: window.gameState.weather
  });
  
  // Check for environmental-based failure
  if (actionDetails.failChance && Math.random() < actionDetails.failChance) {
    if (actionType.includes("shot") || actionType.includes("aim")) {
      result.message = `Your weapon misfires in the ${window.gameState.weather}!`;
    } else if (actionType === "advance" || actionType === "retreat") {
      result.message = `You slip on the ${window.gameState.terrain} terrain!`;
      
      // Chance for injury when slipping
      if (window.gameState.terrain === "slippery" && Math.random() < 0.3) {
        applyInjury("player", "twisted_ankle");
      }
    } else {
      result.message = `Your ${actionDetails.name} fails due to the conditions.`;
    }
    
    // Reduce player momentum for failure
    window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 1);
    updateMomentumIndicator();
    
    // Update combat log
    document.getElementById('combatLog').innerHTML += `<p>${result.message}</p>`;
    
    // Still consume the player's turn and stamina cost
    const staminaCost = window.gameState.staminaPerAction[actionType.split('_')[0]] || 3;
    window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaCost);
    
    advanceCombatTurn();
    return;
  }
  
  // Process movement actions
  if (actionType === 'advance') {
    window.gameState.combatDistance = Math.max(0, window.gameState.combatDistance - 1);
    result.message = `You advance, closing the distance. You are now at ${getDistanceText(window.gameState.combatDistance)} range.`;
    updateDistanceIndicator();
    
    // Use up some stamina
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 5);
    
    // Gain momentum if closing to preferred distance
    if (window.gameState.combatDistance === 0 && window.gameState.combatStance === 'aggressive') {
      window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
      result.message += " Your aggressive approach builds momentum.";
      updateMomentumIndicator();
    }
  }
  else if (actionType === 'retreat') {
    window.gameState.combatDistance = Math.min(2, window.gameState.combatDistance + 1);
    result.message = `You retreat, increasing the distance. You are now at ${getDistanceText(window.gameState.combatDistance)} range.`;
    updateDistanceIndicator();
    
    // Use up some stamina
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 5);
    
    // Gain momentum if moving to preferred distance for ranged
    if (window.gameState.combatDistance > 0 && window.player.skills.marksmanship > 1) {
      window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
      result.message += " You position yourself better for ranged attacks.";
      updateMomentumIndicator();
    }
  }
  // Process attack actions
  else if (actionType.includes('attack') || actionType.includes('shot') || 
           actionType === 'rage' || actionType === 'banish' || 
           actionType.includes('finishing') || actionType.includes('flurry') ||
           actionType.includes('lunge')) {
    
    // Calculate base damage
    let damage = actionDetails.damage;
    
    // Apply stance modifiers
    if (window.gameState.combatStance === 'aggressive') {
      damage = Math.floor(damage * 1.2);
    } else if (window.gameState.combatStance === 'defensive') {
      damage = Math.floor(damage * 0.8);
    }
    
    // Apply momentum modifiers
    if (window.gameState.playerMomentum > 0) {
      damage = Math.floor(damage * (1 + (window.gameState.playerMomentum * 0.1)));
    } else if (window.gameState.playerMomentum < 0) {
      damage = Math.floor(damage * (1 + (window.gameState.playerMomentum * 0.05)));
    }
    
    // Apply enemy stance defense
    if (window.gameState.enemyStance === 'defensive') {
      damage = Math.floor(damage * 0.8);
    }
    
    // Apply environmental effects
    if (window.gameState.terrain === 'rocky' && actionType.includes('shot')) {
      // Bonus for ranged on high ground
      damage = Math.floor(damage * (1 + environmentalEffects.terrain.rocky.effects.rangedBonus));
    }
    
    // Injuries affect attack damage
    window.gameState.playerInjuries.forEach(injury => {
      if (injury.name === "Fractured Arm" && !actionType.includes('shot')) {
        damage = Math.floor(damage * (1 - injury.damagePenalty));
      }
    });
    
    // Apply enemy defense
    damage = Math.max(1, damage - (enemy.defense || 0));
    
    result.enemyDamage = damage;
    result.message = `You hit the ${enemy.name} with ${actionDetails.name}, dealing ${damage} damage.`;
    
    // Apply stamina cost
    const staminaCost = window.gameState.staminaPerAction[actionType.split('_')[0]] || 5;
    
    // Extra stamina cost in heat
    if (window.gameState.weather === 'heat') {
      window.gameState.stamina = Math.max(0, window.gameState.stamina - Math.ceil(staminaCost * environmentalEffects.weather.heat.effects.staminaPenaltyMultiplier));
    } else {
      window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaCost);
    }
    
    // Reset enemy consecutive hits
    window.gameState.consecutiveHits = 0;
    
    // Update player momentum
    window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
    window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
    updateMomentumIndicator();
    
    // Special effects for certain attacks
    if (actionType === 'finishing_blow' || actionType === 'finishing_strike') {
      // Chance to stagger enemy with finishing blow
      if (Math.random() < 0.6) {
        enemy.staggered = true;
        result.message += " The powerful blow staggers your opponent!";
      }
      
      // Reset momentum after using finishing move
      window.gameState.playerMomentum = 0;
      updateMomentumIndicator();
    }
    
    if (actionType === 'flurry') {
      // Flurry does multiple smaller hits
      const numHits = Math.floor(Math.random() * 2) + 2; // 2-3 hits
      let totalDamage = 0;
      
      for (let i = 1; i < numHits; i++) {
        const extraDamage = Math.max(1, Math.floor(damage * 0.4));
        totalDamage += extraDamage;
        result.message += ` Your flurry continues, dealing ${extraDamage} more damage!`;
      }
      
      result.enemyDamage += totalDamage;
      
      // Extra stamina cost for flurry
      window.gameState.stamina = Math.max(0, window.gameState.stamina - 5);
    }
    
    if (actionType === 'lunge') {
      // Lunge reduces distance
      window.gameState.combatDistance = Math.max(0, window.gameState.combatDistance - 1);
      result.message += ` Your lunge closes the distance to ${getDistanceText(window.gameState.combatDistance)} range.`;
      updateDistanceIndicator();
    }
    
    // Check for injury on enemy
    const injury = checkForInjury(actionDetails, damage, enemy.health);
    if (injury) {
      applyInjury("enemy", injury);
    }
    
    // Process skill improvements - different skills for different attack types
    if (actionType.includes('attack') || actionType === 'lunge') {
      // Melee skill improvement
      const meleeImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
      const meleeCap = Math.floor(window.player.phy / 1.5);
      
      if (Math.random() < 0.3 && window.player.skills.melee < meleeCap) {
        window.player.skills.melee = Math.min(meleeCap, window.player.skills.melee + meleeImprovement);
        result.skillImprovement.melee = meleeImprovement;
      }
    } 
    else if (actionType.includes('shot')) {
      // Marksmanship improvement
      const marksImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
      const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
      
      if (Math.random() < 0.3 && window.player.skills.marksmanship < marksmanshipCap) {
        window.player.skills.marksmanship = Math.min(marksmanshipCap, window.player.skills.marksmanship + marksImprovement);
        result.skillImprovement.marksmanship = marksImprovement;
      }
    }
    else if (actionType === 'rage') {
      // Self-damage for rage abilities
      const selfDamage = 3;
      window.gameState.health = Math.max(1, window.gameState.health - selfDamage);
      result.message += ` The exertion costs you ${selfDamage} health.`;
      
      // Physical attribute improvement chance
      const phyImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
      const maxPhy = window.player.men > 0 ? Math.min(15, Math.ceil(window.player.men / 0.6)) : 15;
      
      if (Math.random() < 0.2 && window.player.phy < maxPhy) {
        window.player.phy = Math.min(maxPhy, window.player.phy + phyImprovement);
        result.skillImprovement.phy = phyImprovement;
      }
    }
    else if (actionType === 'banish') {
      // Arcana improvement
      const arcanaImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
      const arcanaCap = Math.floor(window.player.men / 1.5);
      
      if (Math.random() < 0.3 && window.player.skills.arcana < arcanaCap) {
        window.player.skills.arcana = Math.min(arcanaCap, window.player.skills.arcana + arcanaImprovement);
        result.skillImprovement.arcana = arcanaImprovement;
      }
    }
  }
  else if (actionType === 'shield_block' || actionType === 'shield_bash') {
    // Shield abilities focus on defense and control
    if (actionType === 'shield_block') {
      result.message = `You raise your shield, improving your defensive stance.`;
      window.gameState.combatStance = 'defensive';
      updateStanceIndicator();
      
      // Shield block adds defensive momentum
      window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
      updateMomentumIndicator();
    } else {
      // Shield bash does damage and can stun
      let damage = 3 + Math.floor(window.player.skills.melee / 2);
      damage = Math.max(1, damage - (enemy.defense || 0));
      
      result.enemyDamage = damage;
      result.message = `You slam your shield into the ${enemy.name}, dealing ${damage} damage.`;
      
      // Chance to stun based on physical strength
      if (Math.random() < (0.3 + (window.player.phy * 0.02))) {
        enemy.staggered = true;
        result.message += " The impact staggers your opponent!";
      }
    }
    
    // Discipline skill improvement chance
    const disciplineImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
    const mentalSkillCap = Math.floor(window.player.men / 1.5);
    
    if (Math.random() < 0.3 && window.player.skills.discipline < mentalSkillCap) {
      window.player.skills.discipline = Math.min(mentalSkillCap, window.player.skills.discipline + disciplineImprovement);
      result.skillImprovement.discipline = disciplineImprovement;
    }
    
    // Stamina cost
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 5);
  }
  
  // Apply damage to enemy
  if (result.enemyDamage > 0) {
    enemy.health -= result.enemyDamage;
    
    // Check if enemy is staggered by accumulated damage
    if (!enemy.staggered && enemy.staggerThreshold && 
        (enemy.maxHealth - enemy.health) / enemy.maxHealth > 0.5) {
      // Higher chance of stagger as enemy gets more damaged
      if (Math.random() < 0.3) {
        enemy.staggered = true;
        result.message += " Your opponent appears staggered!";
      }
    }
  }
  
  // Update combat log
  document.getElementById('combatLog').innerHTML += `<p>${result.message}</p>`;
  
  // Show skill improvements if any
  if (Object.keys(result.skillImprovement).length > 0) {
    let skillText = "<p>Skills improved: ";
    for (const [skill, value] of Object.entries(result.skillImprovement)) {
      skillText += `${skill} +${value}, `;
    }
    skillText = skillText.slice(0, -2) + "</p>"; // Remove last comma and space
    document.getElementById('combatLog').innerHTML += skillText;
  }
  
  // Update health displays
  document.getElementById('enemyHealthDisplay').textContent = `${Math.max(0, enemy.health)} HP`;
  document.getElementById('enemyCombatHealth').style.width = `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%`;
  document.getElementById('playerHealthDisplay').textContent = `${Math.max(0, Math.round(window.gameState.health))} HP`;
  document.getElementById('playerCombatHealth').style.width = `${Math.max(0, (window.gameState.health / window.gameState.maxHealth) * 100)}%`;
  
  // Update status bars
  window.updateStatusBars();
  
  // Check for battle end
  if (enemy.health <= 0) {
    endCombatWithResult({
      battleOver: true,
      victory: true,
      narrative: `You have defeated the ${enemy.name}!`
    });
    return;
  }
  
  // Recovery period based on action recovery time
  const recoveryTime = (actionDetails.recovery || 1) * 500; // Convert to milliseconds
  
  // Show recovery message for slower actions
  if ((actionDetails.recovery || 1) > 1) {
    document.getElementById('combatLog').innerHTML += `<p>You recover from using ${actionDetails.name}.</p>`;
  }
  
  // Clear queued action if any
  window.gameState.playerQueuedAction = null;
  
  // Allow enemy to interrupt during long recovery
  if (window.gameState.allowInterrupts && (actionDetails.recovery || 1) > 2 && 
      enemy.stamina > 15 && !enemy.staggered && Math.random() < 0.3) {
    
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} sees an opening during your recovery!</p>`;
    
    // Enemy gets a quick attack
    const quickAttack = {
      name: "Opportunistic Strike",
      damage: Math.ceil(enemy.attack * 0.7),
      effect: null
    };
    
    // Apply the attack
    const damage = Math.max(1, quickAttack.damage - (window.player.phy * 0.2));
    window.gameState.health -= damage;
    
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name}'s interrupting attack deals ${damage} damage!</p>`;
    
    // Update player health display
    document.getElementById('playerHealthDisplay').textContent = `${Math.max(0, Math.round(window.gameState.health))} HP`;
    document.getElementById('playerCombatHealth').style.width = `${Math.max(0, (window.gameState.health / window.gameState.maxHealth) * 100)}%`;
    
    // Consume enemy stamina
    enemy.stamina = Math.max(0, enemy.stamina - 10);
    
    // Check for player defeat
    if (window.gameState.health <= 0) {
      endCombatWithResult({
        battleOver: true,
        victory: false,
        narrative: `You are defeated during your recovery!`
      });
      return;
    }
  }
  
  // Use timeout to simulate recovery time
  setTimeout(() => {
    if (window.gameState.inBattle) { // Check if still in battle
      advanceCombatTurn();
    }
  }, recoveryTime);
}

// Attempt to flee from combat
function attemptToFlee() {
  const enemy = window.gameState.currentEnemy;
  
  // Base flee chance depends on distance, survival skill, and enemy personality
  let fleeChance = 0.2 + (window.gameState.combatDistance * 0.2) + (window.player.skills.survival || 0) * 0.1;
  
  // Evasive stance improves flee chance
  if (window.gameState.combatStance === 'evasive') {
    fleeChance += 0.15;
  }
  
  // Enemy stance affects flee chance
  if (window.gameState.enemyStance === 'aggressive') {
    fleeChance -= 0.1;
  }
  
  // Enemy personality affects flee chance
  if (enemy.personality === 'predatory') {
    fleeChance -= 0.15; // Predators chase prey
  } else if (enemy.personality === 'cautious') {
    fleeChance += 0.1; // Cautious enemies may let you go
  }
  
  // Enemy morale affects flee chance
  if (enemy.morale < 40) {
    fleeChance += 0.15; // Demoralized enemies don't chase as hard
  }
  
  // Momentum affects flee chance
  if (window.gameState.playerMomentum > 0) {
    fleeChance += window.gameState.playerMomentum * 0.05;
  } else if (window.gameState.enemyMomentum > 0) {
    fleeChance -= window.gameState.enemyMomentum * 0.05;
  }
  
  // Injuries affect flee chance
  window.gameState.playerInjuries.forEach(injury => {
    if (injury.name === "Twisted Ankle") {
      fleeChance -= 0.2; // Hard to run with a bad ankle
    }
  });
  
  // Terrain affects flee chance
  if (window.gameState.terrain === 'confined') {
    fleeChance -= 0.15; // Harder to flee in confined spaces
  }
  
  // Attempt to flee
  const fleeSuccess = Math.random() < fleeChance;
  
  if (fleeSuccess) {
    // Successful flee
    document.getElementById('combatLog').innerHTML += `<p>You successfully disengage from combat and flee to safety!</p>`;
    
    // End combat with retreat result
    endCombatWithResult({
      battleOver: true,
      victory: false,
      retreatSuccess: true,
      narrative: `You managed to escape from the ${enemy.name}.`
    });
  } else {
    // Failed flee attempt
    document.getElementById('combatLog').innerHTML += `<p>Your attempt to flee fails! The ${enemy.name} blocks your escape.</p>`;
    
    // Enemy gets a free attack
    const freeAttack = {
      name: "Opportunity Attack",
      damage: Math.ceil(enemy.attack * 1.2),
    };
    
    // Apply the free attack
    const damage = Math.max(1, freeAttack.damage - (window.player.phy * 0.2));
    window.gameState.health -= damage;
    
    document.getElementById('combatLog').innerHTML += `<p>The ${enemy.name} strikes as you try to flee, dealing ${damage} damage!</p>`;
    
    // Update player health display
    document.getElementById('playerHealthDisplay').textContent = `${Math.max(0, Math.round(window.gameState.health))} HP`;
    document.getElementById('playerCombatHealth').style.width = `${Math.max(0, (window.gameState.health / window.gameState.maxHealth) * 100)}%`;
    
    // Reduce player momentum for failed flee
    window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 2);
    updateMomentumIndicator();
    
    // Injured while fleeing?
    if (Math.random() < 0.3) {
      applyInjury("player", "twisted_ankle");
    }
    
    // Check for player defeat
    if (window.gameState.health <= 0) {
      endCombatWithResult({
        battleOver: true,
        victory: false,
        narrative: `You are defeated while trying to flee from the ${enemy.name}.`
      });
      return;
    }
    
    // Continue combat - enemy's turn now
    advanceCombatTurn();
  }
}

// Advance to the next actor in combat
function advanceCombatTurn() {
  // Move to the next actor in initiative order
  window.gameState.currentInitiative = (window.gameState.currentInitiative + 1) % window.gameState.initiativeOrder.length;
  
  // Reset phase to decision for the new actor
  window.gameState.combatPhase = "decision";
  
  // Recovery some stamina each turn
  window.gameState.stamina = Math.min(window.gameState.maxStamina, 
                                      window.gameState.stamina + 5);
  
  // Weather affects stamina recovery
  if (window.gameState.weather === 'heat') {
    const penalty = environmentalEffects.weather.heat.effects.recoveryPenalty;
    window.gameState.stamina = Math.min(window.gameState.maxStamina,
                                        window.gameState.stamina - (5 * penalty));
  }
  
  // Start the new actor's turn
  startCombatRound();
  
  // Reset combat interface
  document.getElementById('combatActions').innerHTML = '';
  updateCombatActions();
}

// End combat with result
function endCombatWithResult(result) {

   // Clean up the combat UI elements first
   cleanupCombatUI();

  // Hide combat interface
  document.getElementById('combatInterface').classList.add('hidden');
  
  // Re-enable action buttons
  document.getElementById('actions').style.display = 'flex';
  
  // Add outcome narrative
  if (result.victory) {
    // Special narrative for enemy surrender
    if (result.surrender) {
      window.setNarrative(`The ${window.gameState.currentEnemy.name} has surrendered to you! ${result.narrative}`);
      
      // Optional moral choice
      window.addToNarrative(`What will you do with your defeated opponent?`);
      
      // Create temporary choice buttons
      const actionsContainer = document.getElementById('actions');
      const originalActionsHTML = actionsContainer.innerHTML;
      
      actionsContainer.innerHTML = '';
      
      // Spare button
      const spareBtn = document.createElement('button');
      spareBtn.className = 'action-btn';
      spareBtn.textContent = 'Spare them';
      spareBtn.onclick = function() {
        window.addToNarrative('You decide to show mercy and let your opponent go.');
        window.gameState.morale += 10;
        window.showNotification('Your act of mercy raises your morale. +10 Morale', 'success');
        actionsContainer.innerHTML = originalActionsHTML;
      };
      actionsContainer.appendChild(spareBtn);
      
      // Take prisoner button
      const captureBtn = document.createElement('button');
      captureBtn.className = 'action-btn';
      captureBtn.textContent = 'Take them prisoner';
      captureBtn.onclick = function() {
        window.addToNarrative('You take your defeated opponent prisoner to be questioned later.');
        // Add quest item or special outcome
        actionsContainer.innerHTML = originalActionsHTML;
      };
      actionsContainer.appendChild(captureBtn);
      
      // Execute button
      const executeBtn = document.createElement('button');
      executeBtn.className = 'action-btn';
      executeBtn.textContent = 'Execute them';
      executeBtn.onclick = function() {
        window.addToNarrative('You coldly execute your defeated opponent. Their final expression is one of terror and betrayal.');
        window.gameState.morale -= 15;
        window.showNotification('Your brutal action lowers your morale. -15 Morale', 'warning');
        actionsContainer.innerHTML = originalActionsHTML;
      };
      actionsContainer.appendChild(executeBtn);
      
      // Do not process standard victory rewards yet
      return;
    }
    
    window.setNarrative(`You have defeated the ${window.gameState.currentEnemy.name}! ${result.narrative}`);
    
    // Update any combat-related quests
    window.gameState.sideQuests.forEach(quest => {
      if (quest.completed) return;
      
      quest.objectives.forEach(objective => {
        if (objective.completed) return;
        
        if (objective.text.toLowerCase().includes("defeat") || 
            objective.text.toLowerCase().includes("combat") || 
            objective.text.toLowerCase().includes("enemies")) {
          objective.count++;
          
          // Check if objective is completed
          if (objective.count >= objective.target) {
            objective.completed = true;
            window.showNotification(`Objective completed: ${objective.text}!`, 'success');
          } else {
            window.showNotification(`Objective progress: ${objective.count}/${objective.target}`, 'info');
          }
        }
      });
      
      // Check if quest is completed
      if (quest.objectives.every(obj => obj.completed)) {
        window.completeQuest(quest);
      }
    });
    
    // Calculate rewards based on combat performance
    let expReward = 20 + (window.gameState.level * 5);
    
    // Bonus XP for perfect parries
    expReward += (window.gameState.perfectParries * 5);
    
    // Bonus for finishing with high momentum
    if (window.gameState.playerMomentum > 3) {
      expReward += 10;
      window.addToNarrative(`Your masterful combat technique earns you bonus experience.`);
    }
    
    window.gameState.experience += expReward;
    window.addToNarrative(`You gain ${expReward} experience.`);
    
    // Chance for loot
    if (Math.random() < 0.4) {
      const loot = window.generateLoot(window.gameState.currentEnemy);
      if (window.player.inventory.length < 9) {
        window.player.inventory.push(loot);
        window.addToNarrative(`You find ${loot.name}.`);
      } else {
        window.addToNarrative(`You spotted ${loot.name} but couldn't carry it.`);
      }
    }
    
    // Unlock achievement if this is the first victory
    if (!window.gameState.combatVictoryAchieved) {
      window.gameState.combatVictoryAchieved = true;
      window.showAchievement("first_blood");
    }
    
    // Apply rewards
    window.checkLevelUp();
  } else if (result.retreatSuccess) {
    window.setNarrative(`You managed to escape from the ${window.gameState.currentEnemy.name}.`);
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 20);
    
    // Survival skill improvement chance from successful escape
    const survivalImprovement = parseFloat((Math.random() * 0.03 + 0.02).toFixed(2));
    const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
    
    if (Math.random() < 0.4 && window.player.skills.survival < survivalCap) {
      window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + survivalImprovement);
      window.addToNarrative(`Your successful escape improves your survival skills. (Survival +${survivalImprovement})`);
    }
  } else {
    window.setNarrative(`You were defeated by the ${window.gameState.currentEnemy.name}. You wake up later, having been dragged back to camp by a patrol. Your wounds have been treated, but you've lost some items and morale.`);
    
    // More severe consequences for defeat
    window.gameState.morale = Math.max(20, window.gameState.morale - 15);
    
    // Injuries persist after defeat
    if (window.gameState.playerInjuries.length === 0) {
      // Add a random injury if none exist
      const possibleInjuries = ["bleeding", "fractured_arm", "twisted_ankle", "concussion"];
      const randomInjury = possibleInjuries[Math.floor(Math.random() * possibleInjuries.length)];
      applyInjury("player", randomInjury);
      window.addToNarrative(`You've sustained a ${injuryTypes[randomInjury].name} that will take time to heal.`);
    } else {
      window.addToNarrative(`Your existing injuries were treated, but haven't fully healed.`);
    }
    
    // Lose a random item
    if (window.player.inventory.length > 0) {
      const lostIndex = Math.floor(Math.random() * window.player.inventory.length);
      const lostItem = window.player.inventory.splice(lostIndex, 1)[0];
      window.addToNarrative(`You lost your ${lostItem.name} in the struggle.`);
    }
    
    // Recover some health but lose a full day for recovery
    window.gameState.health = Math.ceil(window.gameState.maxHealth * 0.3);
    
    // Skip ahead a full day to represent recovery time
    window.updateTimeAndDay(24 * 60); // 24 hours (1 day) in minutes
  }
  
  // Reset battle state
  window.gameState.inBattle = false;
  window.gameState.currentEnemy = null;
  window.gameState.combatPhase = "neutral";
  window.gameState.initiativeOrder = [];
  window.gameState.currentInitiative = 0;
  window.gameState.actionQueue = [];
  window.gameState.playerQueuedAction = null;
  window.gameState.enemyQueuedAction = null;
  window.gameState.counterAttackAvailable = false;
  window.gameState.playerMomentum = 0;
  window.gameState.enemyMomentum = 0;
  window.gameState.consecutiveHits = 0;
  window.gameState.perfectParries = 0;
  window.gameState.dodgeCount = 0;
  window.gameState.playerStaggered = false;
  window.gameState.terrain = "normal";
  window.gameState.weather = window.gameState.originalWeather || "clear";
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
  window.updateActionButtons();
}

// Get details for a player action
function getPlayerActionDetails(actionType) {
  // Define action details - these could be moved to a more organized structure
  const actionDetails = {
    // Basic attacks
    'quick_attack': {
      name: "Quick Attack",
      damage: 3 + Math.floor(window.player.skills.melee || 0),
      windUp: 1,
      recovery: 1,
      minRange: 0,
      maxRange: 0
    },
    'attack': {
      name: "Attack",
      damage: 5 + Math.floor(window.player.skills.melee || 0),
      windUp: 2,
      recovery: 2,
      minRange: 0,
      maxRange: 1
    },
    'heavy_attack': {
      name: "Heavy Attack",
      damage: 8 + Math.floor(window.player.skills.melee * 1.5 || 0),
      windUp: 4,
      recovery: 3,
      minRange: 0,
      maxRange: 0
    },
    
    // Ranged attacks
    'quick_shot': {
      name: "Quick Shot",
      damage: 4 + Math.floor(window.player.skills.marksmanship || 0),
      windUp: 1,
      recovery: 1,
      minRange: 1,
      maxRange: 2
    },
    'aimed_shot': {
      name: "Aimed Shot",
      damage: 7 + Math.floor(window.player.skills.marksmanship * 1.5 || 0),
      windUp: 3,
      recovery: 2,
      minRange: 1,
      maxRange: 2
    },
    'sniper_shot': {
      name: "Sniper Shot",
      damage: 10 + Math.floor(window.player.skills.marksmanship * 2 || 0),
      windUp: 4,
      recovery: 3,
      minRange: 2,
      maxRange: 2
    },
    'high_ground_shot': {
      name: "High Ground Shot",
      damage: 8 + Math.floor(window.player.skills.marksmanship * 1.5 || 0),
      windUp: 2,
      recovery: 2,
      minRange: 1,
      maxRange: 2
    },
    
    // Special attacks
    'rage': {
      name: "Berserker Rage",
      damage: 10 + Math.floor(window.player.phy * 0.5),
      windUp: 2,
      recovery: 3,
      minRange: 0,
      maxRange: 0
    },
    'banish': {
      name: "Spectral Banishment",
      damage: 6 + Math.floor(window.player.skills.arcana * 2 || 0),
      windUp: 2,
      recovery: 2,
      minRange: 0,
      maxRange: 2
    },
    'finishing_blow': {
      name: "Finishing Blow",
      damage: 12 + Math.floor(window.player.skills.melee * 1.5 || 0) + window.gameState.playerMomentum,
      windUp: 3,
      recovery: 4,
      minRange: 0,
      maxRange: 0
    },
    'flurry': {
      name: "Flurry of Blows",
      damage: 4 + Math.floor(window.player.skills.melee * 0.8 || 0),
      windUp: 2,
      recovery: 3,
      minRange: 0,
      maxRange: 0
    },
    'lunge': {
      name: "Aggressive Lunge",
      damage: 6 + Math.floor(window.player.skills.melee || 0),
      windUp: 2,
      recovery: 2,
      minRange: 1,
      maxRange: 1,
      effect: "distance-1"
    },
    
    // Defensive abilities
    'shield_block': {
      name: "Shield Block",
      damage: 0,
      effect: "defend",
      windUp: 1,
      recovery: 1,
      minRange: 0,
      maxRange: 0
    },
    'shield_bash': {
      name: "Shield Bash",
      damage: 3 + Math.floor(window.player.skills.melee / 2),
      effect: "stun_chance",
      windUp: 2,
      recovery: 2,
      minRange: 0,
      maxRange: 0
    },
    
    // Movement actions
    'advance': {
      name: "Advance",
      effect: "distance-1",
      windUp: 1,
      recovery: 1,
      minRange: 0,
      maxRange: 2
    },
    'retreat': {
      name: "Retreat",
      effect: "distance+1",
      windUp: 1,
      recovery: 1,
      minRange: 0,
      maxRange: 2
    },
    
    // Feints
    'feint': {
      name: "Feint Attack",
      effect: "feint",
      windUp: 2,
      recovery: 1,
      minRange: 0,
      maxRange: 0
    },
    'feint_ranged': {
      name: "Feint Shot",
      effect: "feint",
      windUp: 2,
      recovery: 1,
      minRange: 1,
      maxRange: 1
    }
  };
  
  return actionDetails[actionType];
}

// Replace the old startCombat with our new system
window.startCombat = function(enemyType) {
  // Save original weather to restore after combat
  window.gameState.originalWeather = window.gameState.weather;
  
  // Start dynamic combat with enhanced features
  startDynamicCombat(enemyType);
};

// Handle for the old combatAction function
window.combatAction = function(action) {
  // Map old actions to new system
  const actionMap = {
    'attack': 'attack',
    'defend': 'stance_defensive',
    'rage': 'rage',
    'aimed_shot': 'aimed_shot',
    'banish': 'banish',
    'retreat': 'flee'
  };
  
  // Use the new system
  dynamicCombatAction(actionMap[action] || action);
};

// Function to check for combat encounters (preserved from original)
window.checkForCombatEncounters = function(action) {
  // Don't trigger combat if already in a story encounter or battle
  if (window.gameState.inStoryEncounter || window.gameState.inBattle || window.gameState.inMission) return;
  
  // Only certain actions have a chance for combat
  if (action === 'patrol' || action === 'scout') {
    // Base chance depends on action
    let combatChance = action === 'patrol' ? 0.25 : 0.33;
    
    // Adjust for day/night and weather
    const hours = Math.floor(window.gameTime / 60);
    if (hours < 6 || hours >= 20) {
      combatChance += 0.1; // More dangerous at night
    }
    
    if (window.gameState.weather === 'foggy') {
      combatChance += 0.05;
    }
    
    // Check for combat
    if (Math.random() < combatChance) {
      // Determine enemy type
      const enemyOptions = ['arrasi_scout', 'wild_beast'];
      if (action === 'patrol' && window.gameState.mainQuest.stage > 1) {
        enemyOptions.push('arrasi_warrior');
      }
      if (window.gameDay > 3) {
        enemyOptions.push('imperial_deserter');
      }
      
      const enemyType = enemyOptions[Math.floor(Math.random() * enemyOptions.length)];
      
      // Initiate combat
      window.startCombat(enemyType);
    }
  }
};

// Generate loot function (preserved from original)
window.generateLoot = function(enemy) {
  const lootTables = {
    arrasi_scout: [
      { name: "Arrasi Dagger", type: "weapon", value: 15, effect: "+1 melee damage" },
      { name: "Scout's Map Fragment", type: "quest_item", value: 5, effect: "Reveals part of surrounding area" },
      { name: "Medicinal Herbs", type: "consumable", value: 8, effect: "Heals 15 health" }
    ],
    arrasi_warrior: [
      { name: "Crystalline Amulet", type: "accessory", value: 25, effect: "+5% damage resistance" },
      { name: "Warrior's Blade", type: "weapon", value: 20, effect: "+2 melee damage" },
      { name: "Tribal Armor Fragment", type: "material", value: 12, effect: "Crafting material" }
    ],
    imperial_deserter: [
      { name: "Imperial Medallion", type: "accessory", value: 18, effect: "+1 to command skill" },
      { name: "Standard Issue Rations", type: "consumable", value: 5, effect: "Restores 10 stamina" },
      { name: "Stolen Military Plans", type: "quest_item", value: 30, effect: "Could be valuable to command" }
    ],
    wild_beast: [
      { name: "Beast Pelt", type: "material", value: 10, effect: "Crafting material" },
      { name: "Sharp Fang", type: "material", value: 8, effect: "Crafting material" },
      { name: "Fresh Meat", type: "consumable", value: 7, effect: "Restores 5 health and 10 stamina" }
    ]
  };
  
  // Select appropriate loot table
  const lootTable = lootTables[enemy.name.toLowerCase().replace(' ', '_')] || lootTables.arrasi_scout;
  
  // Randomly select an item
  return lootTable[Math.floor(Math.random() * lootTable.length)];
};

// Function to end mission combat (placeholder preserved from original)
window.endMissionCombat = function(result) {
  // Similar to endCombat but with mission-specific outcomes
  endCombatWithResult(result);
  window.gameState.inMissionCombat = false;
};