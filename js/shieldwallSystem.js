// shieldwallSystem.js - Enhanced formation-based combat system for large-scale battles
// Incorporates visual indicators, improved timing, and balanced combat flow

// Main shieldwall system object - contains all state and methods
window.shieldwallSystem = {
  // System state
  initialized: false,
  state: {
    active: false,
    battlePhase: "preparation", // preparation, skirmish, engagement, main, breaking, resolution
    timePassed: 0, // Time elapsed in battle (seconds)
    enemyName: "Arrasi Forces", // Name of enemy force
    
    // Formation state
    unitStrength: {
      current: 75,
      max: 75,
      casualties: 0
    },
    
    // Cohesion represents formation integrity (0-100)
    cohesion: {
      current: 85,
      status: "holding firm" // holding firm, wavering, breaking
    },
    
    // Momentum shows which side is winning (-100 to 100, positive = player advantage)
    momentum: {
      value: 0,
      advantage: "none" // enemy, none, player
    },
    
    // Current orders from commander
    currentOrder: "hold the line", // hold the line, advance, shift, reform, rotate
    
    // Player positioning
    position: {
      rank: "front", // front, middle, rear
      file: "center" // left, center, right
    },
    
    // Player stance and shield
    playerStance: "balanced", // balanced, aggressive, defensive
    shieldPosition: "center", // high, center, low
    
    // Track events and threats
    currentThreat: null,
    reactionTimeRemaining: 0, // Time to react to current threat
    reactionNeeded: false,
    reactionSuccess: false,
    lastThreatType: null, // Track last threat to avoid repetition
    threatCooldown: 0, // Cooldown between threats
    
    // Battle log for narrative
    battleLog: [],
    
    // Callback for when battle ends
    onBattleEnd: null
  },
  
  // Enhanced threat definitions with visual indicators and longer reaction times
  threatTypes: {
    projectiles: {
      emoji: "🏹", // Bow and arrow
      color: "#FFD700", // Gold
      description: "A volley of arrows darkens the sky, arcing toward your position!",
      target: "formation",
      bestReaction: "brace",
      bestShieldPosition: "high",
      timeToReact: 5, 
      criticalThreat: false
    },
    charge: {
      emoji: "⚔️", // Crossed swords
      color: "#FF4500", // OrangeRed
      description: "Enemy warriors charge toward your section of the line!",
      target: "player",
      bestReaction: "brace",
      bestShieldPosition: "center",
      timeToReact: 6,
      criticalThreat: false
    },
    gap: {
      emoji: "⚠️", // Warning sign
      color: "#FF6347", // Tomato
      description: "A gap is forming in the line as soldiers to your left fall!",
      target: "formation",
      bestReaction: "step to gap",
      bestShieldPosition: "center",
      timeToReact: 5, 
      criticalThreat: false
    },
    flanking: {
      emoji: "↪️", // Right arrow curving up
      color: "#9370DB", // MediumPurple
      description: "Enemy soldiers are attempting to flank your unit!",
      target: "formation",
      bestReaction: "adjust position",
      bestShieldPosition: "center",
      timeToReact: 5, 
      criticalThreat: false
    },
    spears: {
      emoji: "🔱", // Trident
      color: "#4682B4", // SteelBlue
      description: "Enemy spearmen thrust forward toward your shield!",
      target: "player",
      bestReaction: "brace",
      bestShieldPosition: "low",
      timeToReact: 4, // Still relatively quick but more reasonable
      criticalThreat: true
    },
    officer: {
      emoji: "👑", // Crown
      color: "#DC143C", // Crimson
      description: "An enemy officer is issuing a rallying cry to his troops!",
      target: "formation",
      bestReaction: "attack",
      bestShieldPosition: "center",
      timeToReact: 12, // Extended from 4s to 12s
      criticalThreat: false
    },
    breakthrough: {
      emoji: "💥", // Collision
      color: "#B22222", // FireBrick
      description: "Enemy soldiers have broken through nearby! Immediate action required!",
      target: "player",
      bestReaction: "attack",
      bestShieldPosition: "center",
      timeToReact: 5, // One of the few threats that needs quick reaction
      criticalThreat: true
    },
    cavalry: {
      emoji: "🐎", // Horse
      color: "#8B4513", // SaddleBrown
      description: "Enemy cavalry charges toward your formation, thundering hooves shaking the ground!",
      target: "formation",
      bestReaction: "brace",
      bestShieldPosition: "low",
      timeToReact: 7,
      criticalThreat: true
    },
    swords: {
      emoji: "🗡️", // Dagger (using this instead of ⚔️ which is already used for charge)
      color: "#4682B4", // Steel Blue
      description: "A Druskari elite swings his greatsword at your head!",
      target: "player",
      bestReaction: "brace", // Using brace since "block" isn't currently implemented
      bestShieldPosition: "high",
      timeToReact: 3,
      criticalThreat: true // Changed to true since it's a fast, dangerous attack
    }
  },
  
  // Initialize the system
  initialize: function() {
    console.log("Shieldwall system initializing...");
    
    // Flag to prevent multiple initialization
    this.initialized = true;
    
    // Add styles if they don't exist
    if (!document.getElementById('shieldwall-styles')) {
      this.addShieldwallStyles();
    }
    
    // Add enhanced styles for visual feedback
    this.addEnhancedStyles();
    
    // Initialize shieldwall outcome queue
    if (!window.shieldwallOutcomeQueue) {
      window.shieldwallOutcomeQueue = [];
    }
    
    console.log("Shieldwall system initialized");
    return true;
  },
  
  // Start a shieldwall battle
  initiateBattle: function(config = {}) {
    console.log("Initiating shieldwall battle with config:", config);
    
    // Reset state for new battle
    this.resetState();
    
    // Apply configuration
    if (config) {
      // Apply top-level properties
      for (const key in config) {
        if (typeof config[key] !== 'object' || config[key] === null) {
          this.state[key] = config[key];
        }
      }
      
      // Apply nested objects carefully to avoid undefined properties
      if (config.unitStrength) {
        this.state.unitStrength = {
          ...this.state.unitStrength,
          ...config.unitStrength
        };
      }
      
      if (config.cohesion) {
        this.state.cohesion = {
          ...this.state.cohesion,
          ...config.cohesion
        };
      }
      
      if (config.momentum) {
        this.state.momentum = {
          ...this.state.momentum,
          ...config.momentum
        };
      }
      
      if (config.position) {
        this.state.position = {
          ...this.state.position,
          ...config.position
        };
      }
    }
    
    this.state.active = true;
    
    // Set default values if not provided
    if (!this.state.unitStrength.current) this.state.unitStrength.current = 81;
    if (!this.state.unitStrength.max) this.state.unitStrength.max = 81;
    if (!this.state.cohesion.current) this.state.cohesion.current = 85;
    
    // Calculate advantage based on momentum
    this.updateMomentumAdvantage();
    
    // Render the interface
    this.renderBattleInterface();
    
    // Start with an introduction message
    const enemyName = this.state.enemyName || "Enemy forces";
    this.addBattleMessage(`The ${enemyName} advance in formation across the field. Your unit forms a shieldwall in response, weapons at the ready.`);
    
    const order = this.state.currentOrder || "hold the line";
    this.addBattleMessage(`Your commander calls out: "${order.toUpperCase()}!" The soldiers around you brace themselves, shields locked.`);
    
    // Sync player stats with main game
    this.syncPlayerStats();
    
    // Start the battle loop
    this.battleLoop();
    
    console.log("Shieldwall battle initiated");
  },
  
  // Reset state for a new battle
  resetState: function() {
    this.state = {
      active: false,
      battlePhase: "preparation",
      timePassed: 0,
      enemyName: "Arrasi Forces",
      
      unitStrength: {
        current: 75,
        max: 75,
        casualties: 0
      },
      
      cohesion: {
        current: 85,
        status: "holding firm"
      },
      
      momentum: {
        value: 0,
        advantage: "none"
      },
      
      currentOrder: "hold the line",
      
      position: {
        rank: "front",
        file: "center"
      },
      
      playerStance: "balanced",
      shieldPosition: "center",
      
      currentThreat: null,
      reactionTimeRemaining: 0,
      reactionNeeded: false,
      reactionSuccess: false,
      lastThreatType: null,
      threatCooldown: 0,
      
      battleLog: [],
      
      onBattleEnd: null
    };
  },
  
  // Sync player stats with the main game state
  syncPlayerStats: function() {
    if (window.gameState) {
      // Create a reference to player stats for easier updates
      this.playerStats = {
        health: window.gameState.health || 100,
        maxHealth: window.gameState.maxHealth || 100,
        stamina: window.gameState.stamina || 100,
        maxStamina: window.gameState.maxStamina || 100,
        morale: window.gameState.morale || 75
      };
      
      console.log("Synced player stats:", this.playerStats);
    } else {
      // Fallback values if gameState isn't available
      this.playerStats = {
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        morale: 75
      };
      
      console.warn("gameState not found, using default stats");
    }
  },
  
  // Update player stats from main game state (called periodically)
  updatePlayerStats: function() {
    if (window.gameState) {
      this.playerStats.health = window.gameState.health || this.playerStats.health;
      this.playerStats.maxHealth = window.gameState.maxHealth || this.playerStats.maxHealth;
      this.playerStats.stamina = window.gameState.stamina || this.playerStats.stamina;
      this.playerStats.maxStamina = window.gameState.maxStamina || this.playerStats.maxStamina;
      this.playerStats.morale = window.gameState.morale || this.playerStats.morale;
    }
  },
  
  // Main battle loop
  battleLoop: function() {
    if (!this.state.active) return;
    
    // Update battle time
    this.state.timePassed += 1;
    
    // Update player stats periodically
    if (this.state.timePassed % 5 === 0) {
      this.updatePlayerStats();
    }
    
    // Update UI
    this.updateBattleInterface();
    
    // ADD THESE LINES:
    // Update formation display
    this.updateFormationDisplay();
    
    // Add battle effects periodically
    if (this.state.timePassed % 10 === 0 || 
        (this.state.currentThreat && !this.state.reactionNeeded)) {
      this.addBattleEffects();
    }
    
    // Handle threat cooldown if active
    if (this.state.threatCooldown > 0) {
      this.state.threatCooldown -= 0.1;
    }
    
    // Update reaction timer if active
    if (this.state.reactionNeeded) {
      this.state.reactionTimeRemaining -= 0.1;
      
      // Update timer display
      const label = document.querySelector('.reaction-container .control-label');
      if (label && label.querySelector('.threat-timer')) {
        label.querySelector('.threat-timer').textContent = `(${Math.ceil(this.state.reactionTimeRemaining)}s)`;
      }
      
      // Out of time to react
      if (this.state.reactionTimeRemaining <= 0) {
        this.handleReactionTimeout();
      }
    }
    
    // Generate threat if no current threat, no reaction needed, and no cooldown
    if (!this.state.currentThreat && !this.state.reactionNeeded && (!this.state.threatCooldown || this.state.threatCooldown <= 0)) {
      // Adjust threat chance based on battle phase
      let threatChance = 0.07; // Lower base chance for more pacing (7% per second)
      
      if (this.state.battlePhase === "main" || this.state.battlePhase === "breaking") {
        threatChance = 0.1; // 10% chance in intense phases
      }
      
      if (Math.random() < threatChance) {
        this.generateThreat();
      }
    }
    
    // Check for battle phase transitions
    this.checkPhaseTransition();
    
    // Check for battle end conditions
    if (this.checkBattleEndConditions()) {
      return; // Battle has ended
    }
    
    // Continue battle loop
    setTimeout(() => this.battleLoop(), 100); // 10 updates per second
  },
  
  // Generate a new threat that requires player reaction
  generateThreat: function() {
    // Get all threat types as an array
    const threatsList = Object.entries(this.threatTypes).map(([type, threat]) => {
      return { type, ...threat };
    });
    
    // Filter threats based on battle phase
    const availableThreats = threatsList.filter(threat => {
      if (this.state.battlePhase === "skirmish" && ["projectiles"].includes(threat.type)) return true;
      if (this.state.battlePhase === "engagement" && ["charge", "projectiles", "spears", "cavalry", "swords"].includes(threat.type)) return true;
      if (this.state.battlePhase === "main") return true; // All threats possible in main phase
      if (this.state.battlePhase === "breaking" && ["gap", "flanking", "charge", "breakthrough", "cavalry", "swords"].includes(threat.type)) return true;
      return false;
    });
    
    // If no applicable threats, don't generate one
    if (availableThreats.length === 0) return;
    
    // Avoid repeating the same threat type twice in a row
    const filteredThreats = this.state.lastThreatType ? 
      availableThreats.filter(t => t.type !== this.state.lastThreatType) : 
      availableThreats;
    
    // If we filtered out all threats, use the original list
    const threatsToUse = filteredThreats.length > 0 ? filteredThreats : availableThreats;
    
    // Select a random threat from the filtered list
    const threat = threatsToUse[Math.floor(Math.random() * threatsToUse.length)];
    
    // Store the last threat type to avoid repetition
    this.state.lastThreatType = threat.type;
    
    // Set the current threat
    this.state.currentThreat = threat;
    this.state.reactionNeeded = true;
    this.state.reactionTimeRemaining = threat.timeToReact;
    
    // Get emoji for threat (fallback to ⚠️ if none defined)
    const emoji = threat.emoji || "⚠️";
    
    // Show the threat in the battle log with emoji
    this.addBattleMessage(`${emoji} ${threat.description}`);
    
    // Flash the battle log to draw attention
    this.flashBattleLog();
    
    // Show reaction options with enhanced visual cues
    this.updateReactionOptions();
    
    console.log("Generated threat:", threat);
  },
  
  // Flash the battle log to draw attention to new threats
  flashBattleLog: function() {
    const battleLog = document.getElementById('shieldwallLog');
    if (!battleLog) return;
    
    // Add flash class
    battleLog.classList.add('battle-log-flash');
    
    // Remove after animation completes
    setTimeout(() => {
      battleLog.classList.remove('battle-log-flash');
    }, 1000);
  },
  
  // Handle player reaction to threat
  handleReaction: function(reactionType) {
    if (!this.state.reactionNeeded || !this.state.currentThreat) {
      console.error("No reaction needed or no current threat");
      return;
    }
    
    const threat = this.state.currentThreat;
    console.log(`Player reacted with ${reactionType} to ${threat.type}`);
    
    // Check if player reaction was correct
    const correctReaction = threat.bestReaction === reactionType;
    const correctShieldPosition = threat.bestShieldPosition === this.state.shieldPosition;
    
    // Calculate success based on reaction and shield position
    let successChance = 0.25; // Base 25% chance
    
    if (correctReaction) successChance += 0.4; // +40% for correct reaction
    if (correctShieldPosition) successChance += 0.25; // +25% for correct shield position
    
    // Modify based on player stance
    if (this.state.playerStance === "aggressive" && reactionType === "attack") {
      successChance += 0.1; // Aggressive stance helps with attacks
    } else if (this.state.playerStance === "defensive" && reactionType === "brace") {
      successChance += 0.1; // Defensive stance helps with bracing
    }
    
    // Modify based on player skills (if available in game state)
    if (window.player && window.player.skills) {
      // Discipline helps with all reactions
      successChance += (window.player.skills.discipline || 0) * 0.01; // +1% per discipline point
      
      // Specific skills help with specific reactions
      if (reactionType === "attack" && window.player.skills.melee) {
        successChance += window.player.skills.melee * 0.01; // +1% per melee skill point
      }
      
      if (reactionType === "step to gap" && window.player.skills.tactics) {
        successChance += window.player.skills.tactics * 0.01; // +1% per tactics skill point
      }
    }
    
    // Cap success chance
    successChance = Math.min(0.95, Math.max(0.05, successChance));
    
    // Roll for success
    const success = Math.random() < successChance;
    this.state.reactionSuccess = success;
    
    // Generate response narrative based on success or failure
    let responseMessage = "";
    
    if (success) {
      // Handle successful reactions
      switch (reactionType) {
        case "brace":
          if (threat.type === "projectiles") {
            responseMessage = "You raise your shield high, angling it perfectly to deflect the incoming arrows. The deadly rain hammers against your shield, but you stand firm.";
          } else if (threat.type === "charge") {
            responseMessage = "You plant your feet and brace your shield firmly as the enemy charges. The impact is jarring, but your stance holds and you push back against the attacker.";
          } else if (threat.type === "spears") {
            responseMessage = "You angle your shield downward, deflecting the thrusting spears. The spearheads scrape harmlessly off your shield's surface.";
          } else if (threat.type === "cavalry") {
            responseMessage = "You brace in proper formation with your comrades as the cavalry thunders closer. The wall of shields and spears forces the riders to veer away at the last moment.";
          } else if (threat.type === "swords") {
            responseMessage = "You raise your shield just in time to block the Druskari elite's greatsword. The blade crashes against your shield with tremendous force, but your stance holds firm.";
          } else {
            responseMessage = `You brace firmly, your shield positioned perfectly against the ${threat.type}. Your section of the line holds strong!`;
          }
          break;
        case "step to gap":
          responseMessage = "You quickly step into the gap forming in your line, shield raised to protect both yourself and your exposed flank. Your swift action prevents the enemy from exploiting the weakness!";
          break;
        case "adjust position":
          responseMessage = "Reading the enemy movement, you shift your position and signal to your comrades. The unit adjusts formation just in time to counter the flanking maneuver!";
          break;
        case "attack":
          if (threat.type === "officer") {
            responseMessage = "You spot an opening and lunge forward, striking at the enemy officer. Your attack disrupts his leadership, throwing the enemy advance into momentary confusion!";
          } else {
            responseMessage = "You find the perfect opening and strike with precision, catching an enemy soldier off-guard! Your counterattack drives them back, giving your line breathing room.";
          }
          break;
        case "shield cover":
          responseMessage = "You extend your shield to cover not just yourself but also your comrade's exposed flank. Together, you form an impenetrable barrier against the incoming threat.";
          break;
        default:
          responseMessage = "Your quick reaction succeeds!";
      }
      
      // Update cohesion and momentum
      const cohesionBonus = correctReaction && correctShieldPosition ? 7 : 5;
      this.adjustCohesion(cohesionBonus);
      this.adjustMomentum(+10);
      
      // Boost stamina loss but at a much lower rate than damage
      if (this.playerStats) {
        const staminaLoss = Math.floor(Math.random() * 3) + 2; // 2-4 stamina loss
        this.playerStats.stamina = Math.max(1, this.playerStats.stamina - staminaLoss);
        
        // Sync with main game state
        if (window.gameState) {
          window.gameState.stamina = this.playerStats.stamina;
        }
      }
    } else {
      // Handle failed reactions
      switch (reactionType) {
        case "brace":
          if (threat.type === "projectiles") {
            responseMessage = "Your shield position is too low, leaving you exposed to the arrow volley. Several shafts find gaps in your defense, striking nearby soldiers and grazing your shoulder.";
          } else if (threat.type === "charge") {
            responseMessage = "Your footing slips as you attempt to brace, leaving you vulnerable to the enemy charge. The impact knocks you back into your comrades, disrupting your unit's line.";
          } else if (threat.type === "spears") {
            responseMessage = "You fail to angle your shield correctly, allowing an enemy spear to slip past your guard. The thrust catches you painfully along the arm.";
          } else if (threat.type === "cavalry") {
            responseMessage = "You fail to set your shield firmly as the cavalry approaches. A rider breaks through, scattering soldiers and forcing your formation to bend backward.";
          } else if (threat.type === "swords") {
            responseMessage = "You raise your shield too slowly, and the Druskari elite's greatsword slips past your defense. The blade strikes a glancing blow to your shoulder, sending a jolt of pain through your arm.";
          } else {
            responseMessage = `Your bracing is too late or poorly positioned. The ${threat.type} breaks through your defense, causing your section to falter!`;
          }
          break;
        case "step to gap":
          responseMessage = "You attempt to fill the gap but misjudge the timing. You stumble against a fellow soldier, creating further confusion. The gap widens as enemy soldiers press the advantage!";
          break;
        case "adjust position":
          responseMessage = "Your adjustment is too slow and poorly communicated to your comrades. The enemy exploits the confusion, driving a wedge into your formation!";
          break;
        case "attack":
          responseMessage = "Your attack is poorly timed and overextended. An enemy soldier parries your strike and counters, forcing you back into the line!";
          break;
        case "shield cover":
          responseMessage = "You try to extend your shield to protect your comrade but leave yourself exposed. The enemy targets your vulnerability, striking before you can recover your position.";
          break;
        default:
          responseMessage = "Your reaction fails!";
      }
      
      // Update cohesion and momentum negatively
      this.adjustCohesion(-10);
      this.adjustMomentum(-15);
      
      // If it's a personal attack, reduce health
      if (threat.target === "player" && this.playerStats) {
        const damageTaken = Math.floor(Math.random() * 6) + 3; // 3-8 damage (reduced from previous)
        this.playerStats.health = Math.max(1, this.playerStats.health - damageTaken);
        
        // Sync with main game state
        if (window.gameState) {
          window.gameState.health = this.playerStats.health;
        }
        
        responseMessage += ` You take ${damageTaken} damage in the process!`;
        
        // Update main game UI health if possible
        if (typeof window.updateStatusBars === 'function') {
          window.updateStatusBars();
        }
      }
      
      // Lose stamina on failed reactions
      if (this.playerStats) {
        const staminaLoss = Math.floor(Math.random() * 5) + 3; // 3-7 stamina loss
        this.playerStats.stamina = Math.max(1, this.playerStats.stamina - staminaLoss);
        
        // Sync with main game state
        if (window.gameState) {
          window.gameState.stamina = this.playerStats.stamina;
        }
      }
      
      // Unit may take casualties on failed reactions
      if (Math.random() < 0.3) { 
        const casualtiesLost = Math.floor(Math.random() * 3) + 1; // 1-3 casualties
        this.state.unitStrength.current = Math.max(1, this.state.unitStrength.current - casualtiesLost);
        this.state.unitStrength.casualties += casualtiesLost;
        responseMessage += ` Your unit loses ${casualtiesLost} ${casualtiesLost === 1 ? 'soldier' : 'soldiers'} in the chaos!`;
      }
    }
    
    // Add response to battle log
    this.addBattleMessage(responseMessage);
    
    // Clear current threat and reaction needed
    this.state.currentThreat = null;
    this.state.reactionNeeded = false;
    this.state.reactionTimeRemaining = 0;
    
    // Apply cooldown before next threat
    this.state.threatCooldown = Math.random() * 3 + 2; // 2-5 second cooldown
    
    // Update UI
    this.updateBattleInterface();
    this.clearReactionOptions();
  },
  
  // Handle reaction timeout (player didn't react in time)
  handleReactionTimeout: function() {
    // Safety check to ensure we have a threat
    if (!this.state.currentThreat) return;
    
    const threat = this.state.currentThreat;
    
    // Get emoji for threat (fallback to ⚠️ if none defined)
    const emoji = threat.emoji || "⚠️";
    
    // Generate timeout message with emoji
    let timeoutMessage = `${emoji} You hesitate, failing to react in time to the ${threat.type || "threat"}!`;
    
    // Consequences for inaction but less severe than before
    this.adjustCohesion(-12);
    this.adjustMomentum(-15);
    
    // Unit takes some casualties
    const casualtiesLost = Math.floor(Math.random() * 5) + 2;
    this.state.unitStrength.current = Math.max(1, this.state.unitStrength.current - casualtiesLost);
    this.state.unitStrength.casualties += casualtiesLost;
    timeoutMessage += ` Your unit loses ${casualtiesLost} soldiers as the formation buckles!`;
    
    // Damage to player
    if ((threat.target === "player" || Math.random() < 0.3) && this.playerStats) {
      const damageTaken = Math.floor(Math.random() * 10) + 5; // 5-14 damage (reduced from 10-24)
      this.playerStats.health = Math.max(1, this.playerStats.health - damageTaken);
      
      // Sync with main game state
      if (window.gameState) {
        window.gameState.health = this.playerStats.health;
      }
      
      timeoutMessage += ` You take ${damageTaken} damage from the enemy!`;
      
      // Update main game UI health if possible
      if (typeof window.updateStatusBars === 'function') {
        window.updateStatusBars();
      }
    }
    
    // Add response to battle log with red highlight
    this.addBattleMessage(`<span style="color: #FF6347;">${timeoutMessage}</span>`);
    
    // Clear current threat and reaction needed
    this.state.currentThreat = null;
    this.state.reactionNeeded = false;
    this.state.reactionTimeRemaining = 0;
    
    // Apply cooldown before next threat
    this.state.threatCooldown = Math.random() * 2 + 1; // 1-3 second cooldown
    
    // Update UI
    this.updateBattleInterface();
    this.clearReactionOptions();
  },
  
  // Change shield position
  changeShieldPosition: function(position) {
    if (!position || typeof position !== 'string') {
      console.error("Invalid shield position:", position);
      return;
    }
    
    // Validate position
    if (!['high', 'center', 'low'].includes(position.toLowerCase())) {
      console.error("Invalid shield position:", position);
      return;
    }
    
    this.state.shieldPosition = position.toLowerCase();
    
    // Add narrative
    let message = "";
    switch (position.toLowerCase()) {
      case "high":
        message = "You raise your shield high, providing better protection against airborne threats.";
        break;
      case "center":
        message = "You adjust your shield to center position, providing balanced protection.";
        break;
      case "low":
        message = "You lower your shield, better protecting against low attacks and charges.";
        break;
      default:
        message = "You adjust your shield position.";
    }
    
    this.addBattleMessage(message);
    
    // Update UI
    this.updateBattleInterface();
    
    // ADD THIS LINE:
    // Update player marker to reflect stance
    this.updatePlayerPositionMarker();
  },
  
  // Change stance
  changeStance: function(stance) {
    if (!stance || typeof stance !== 'string') {
      console.error("Invalid stance:", stance);
      return;
    }
    
    // Validate stance
    if (!['aggressive', 'balanced', 'defensive'].includes(stance.toLowerCase())) {
      console.error("Invalid stance:", stance);
      return;
    }
    
    this.state.playerStance = stance.toLowerCase();
    
    // Add narrative
    let message = "";
    switch (stance.toLowerCase()) {
      case "aggressive":
        message = "You adopt an aggressive stance, ready to strike at opportunities.";
        break;
      case "balanced":
        message = "You maintain a balanced stance, ready to adapt to changing situations.";
        break;
      case "defensive":
        message = "You take a defensive stance, focusing on survival and protection.";
        break;
      default:
        message = "You adjust your combat stance.";
    }
    
    this.addBattleMessage(message);
    
    // Update UI
    this.updateBattleInterface();
    
    
    // Update player marker to reflect stance
    this.updatePlayerPositionMarker();
  },
  
  // Adjust formation cohesion
  adjustCohesion: function(amount) {
    this.state.cohesion.current = Math.max(0, Math.min(100, this.state.cohesion.current + amount));
    
    // Update cohesion status
    if (this.state.cohesion.current >= 60) {
      this.state.cohesion.status = "holding firm";
    } else if (this.state.cohesion.current >= 30) {
      this.state.cohesion.status = "wavering";
    } else {
      this.state.cohesion.status = "breaking";
    }
    
    // Cohesion affects momentum
    if (amount < 0) {
      this.adjustMomentum(amount / 2); // Losing cohesion affects momentum
    }
    
    console.log(`Cohesion adjusted by ${amount} to ${this.state.cohesion.current} (${this.state.cohesion.status})`);
  },
  
  // Adjust battle momentum
  adjustMomentum: function(amount) {
    this.state.momentum.value = Math.max(-100, Math.min(100, this.state.momentum.value + amount));
    this.updateMomentumAdvantage();
    
    console.log(`Momentum adjusted by ${amount} to ${this.state.momentum.value} (${this.state.momentum.advantage})`);
  },
  
  // Update momentum advantage based on value
  updateMomentumAdvantage: function() {
    if (this.state.momentum.value > 20) {
      this.state.momentum.advantage = "Paanic Forces";
    } else if (this.state.momentum.value < -20) {
      this.state.momentum.advantage = "Enemy Forces";
    } else {
      this.state.momentum.advantage = "Even";
    }
  },
  
  // Check for phase transitions
  checkPhaseTransition: function() {
    // Phase transitions based on time, cohesion and momentum
    switch (this.state.battlePhase) {
      case "preparation":
        if (this.state.timePassed > 30) {
          this.changeBattlePhase("skirmish");
        }
        break;
        
      case "skirmish":
        if (this.state.timePassed > 90) {
          this.changeBattlePhase("engagement");
        }
        break;
        
      case "engagement":
        if (this.state.timePassed > 180 || Math.abs(this.state.momentum.value) > 70) {
          this.changeBattlePhase("main");
        }
        break;
        
      case "main":
        if (this.state.cohesion.current < 30 || this.state.momentum.value < -60 || this.state.momentum.value > 60) {
          this.changeBattlePhase("breaking");
        }
        break;
        
      case "breaking":
        if (this.state.cohesion.current < 10 || this.state.momentum.value < -75 || this.state.momentum.value > 75) {
          this.changeBattlePhase("resolution");
        }
        break;
    }
  },
  
  // Change battle phase
  changeBattlePhase: function(newPhase) {
    if (!newPhase || typeof newPhase !== 'string') {
      console.error("Invalid battle phase:", newPhase);
      return;
    }
    
    const oldPhase = this.state.battlePhase;
    this.state.battlePhase = newPhase.toLowerCase();
    
    // Add phase transition narrative
    let transitionMessage = "";
    
    switch (newPhase.toLowerCase()) {
      case "skirmish":
        transitionMessage = "The battle begins with skirmishers exchanging missiles. Arrows and javelins fill the air!";
        break;
      case "engagement":
        transitionMessage = "The skirmishers fall back as the main lines advance toward each other. Prepare for contact!";
        break;
      case "main":
        transitionMessage = "The battle lines clash with the crash of shields and weapons! The main battle phase begins!";
        break;
      case "breaking":
        if (this.state.momentum.value > 40) {
          transitionMessage = "The enemy line begins to waver and break under your unit's pressure!";
        } else {
          transitionMessage = "Your line is struggling to maintain formation as the enemy presses hard!";
        }
        break;
      case "resolution":
        if (this.state.momentum.value > 40) {
          transitionMessage = "The enemy breaks and runs! Your forces pursue the routing enemies!";
        } else {
          transitionMessage = "Your commander orders a retreat! Fall back in formation to avoid being cut down!";
        }
        break;
      default:
        transitionMessage = `Battle phase changes to ${newPhase}.`;
    }
    
    this.addBattleMessage(transitionMessage);
    console.log(`Battle phase changed: ${oldPhase} -> ${newPhase}`);
    
    // Update UI
    this.updateBattleInterface();
  },
  
  // Check if battle has reached an end condition
  checkBattleEndConditions: function() {
    // Battle ends with victory when in resolution phase with positive momentum
    if (this.state.battlePhase === "resolution" && this.state.momentum.value > 0) {
      this.endBattle("victory");
      return true;
    }
    
    // Battle ends with defeat when in resolution phase with negative momentum
    if (this.state.battlePhase === "resolution" && this.state.momentum.value <= 0) {
      this.endBattle("defeat");
      return true;
    }
    
    // Battle ends with defeat if unit strength is critically low
    if (this.state.unitStrength.current <= this.state.unitStrength.max * 0.25) { // 25% instead of 20%
      this.endBattle("defeat");
      return true;
    }
    
    // Battle also ends if player's health reaches critical levels
    if (this.playerStats && this.playerStats.health <= 30) { // 30 instead of 20
      this.endBattle("withdrawal");
      return true;
    }
    
    return false;
  },
  
  // End the battle and handle outcome
  endBattle: function(outcome) {
    this.state.active = false;
    
    // Generate end of battle narrative
    let endMessage = "";
    let outcomeTitle = "";
    
    switch (outcome) {
      case "victory":
        outcomeTitle = "VICTORY!";
        endMessage = `Victory! The ${this.state.enemyName} break and flee the field. Your unit has held the line and emerged victorious!`;
        break;
      case "defeat":
        outcomeTitle = "DEFEAT";
        endMessage = `Defeat! Your unit breaks under the pressure from the ${this.state.enemyName}. The shieldwall has collapsed and the battle is lost.`;
        break;
      case "withdrawal":
        outcomeTitle = "WITHDRAWN";
        endMessage = "You're wounded and pulled back from the front line by your comrades. The battle continues without you.";
        break;
      default:
        outcomeTitle = "BATTLE ENDED";
        endMessage = "The battle ends.";
    }
    
    this.addBattleMessage(endMessage);
    this.updateBattleInterface();
    
    console.log(`Battle ended with ${outcome}`);
    
    // Show battle results screen
    this.showBattleResultsScreen(outcome, outcomeTitle, endMessage);
    
    // Call the battle end callback if provided
    if (typeof this.state.onBattleEnd === 'function') {
      try {
        // Make sure shieldwallOutcomeQueue exists
        if (!window.shieldwallOutcomeQueue) {
          window.shieldwallOutcomeQueue = [];
        }
        
        // Find the active quest
        const activeQuest = window.quests?.find(q => q.status === window.QUEST_STATUS.ACTIVE);
        
        // Store the outcome for when we return to the quest
        if (activeQuest) {
          window.shieldwallOutcomeQueue.push({
            questId: activeQuest.id,
            stageId: activeQuest.stages[activeQuest.currentStageIndex]?.id || 'unknown',
            outcome: outcome
          });
        }
        
        // Call the original callback
        setTimeout(() => {
          this.state.onBattleEnd(outcome);
        }, 2000);
      } catch (error) {
        console.error("Error in battle end callback:", error);
        
        // Fallback: process outcome ourselves
        this.processBattleEndFallback(outcome);
      }
    } else {
      // No callback defined, process outcome ourselves
      this.processBattleEndFallback(outcome);
    }
  },
  
  // Fallback battle end processing
  processBattleEndFallback: function(outcome) {
    // Find the active quest
    const activeQuest = window.quests?.find(q => q.status === window.QUEST_STATUS.ACTIVE);
    
    // Process outcome if we have an active quest and resumeQuestAfterShieldwall function
    if (activeQuest && typeof window.resumeQuestAfterShieldwall === 'function') {
      setTimeout(() => {
        window.resumeQuestAfterShieldwall(activeQuest, outcome);
      }, 2000);
    }
  },
  
  // Show a button to complete the battle
  showBattleEndButton: function(outcome) {
    const actionsContainer = document.getElementById('shieldwallActions');
    if (!actionsContainer) return;
    
    actionsContainer.innerHTML = '';
    
    const completeButton = document.createElement('button');
    completeButton.className = 'shieldwall-btn large-btn';
    completeButton.textContent = 'Complete Battle';
    completeButton.onclick = () => {
      this.hideBattleInterface();
      
      // Return to quest if we're in quest mode
      if (window.gameState && window.gameState.inQuestSequence && window.quests) {
        // Find the active quest
        const activeQuest = window.quests.find(q => q.status === window.QUEST_STATUS.ACTIVE);
        if (activeQuest && window.resumeQuestAfterShieldwall) {
          window.resumeQuestAfterShieldwall(activeQuest, outcome);
        } else {
          // Fallback: return to main game
          window.updateActionButtons();
        }
      } else {
        // Otherwise return to main game
        if (typeof window.updateActionButtons === 'function') {
          window.updateActionButtons();
        }
      }
    };
    
    actionsContainer.appendChild(completeButton);
  },
  
  // Add message to battle log
  addBattleMessage: function(message) {
    if (!message) return;
    
    // Add to battle log array
    this.state.battleLog.push(message);
    
    // Update UI if log element exists
    const battleLog = document.getElementById('shieldwallLog');
    if (battleLog) {
      const messageElement = document.createElement('p');
      messageElement.innerHTML = message;
      battleLog.appendChild(messageElement);
      battleLog.scrollTop = battleLog.scrollHeight;
    }
  },
  
  // Start visual timer animation
  startReactionTimer: function(duration) {
    // Find or create timer element
    let timerBar = document.getElementById('reaction-timer-bar');
    if (!timerBar) {
      timerBar = document.createElement('div');
      timerBar.id = 'reaction-timer-bar';
      timerBar.className = 'reaction-timer-bar';
      
      const reactionContainer = document.getElementById('reactionContainer');
      if (reactionContainer) {
        reactionContainer.appendChild(timerBar);
      }
    }
    
    // Reset animation
    timerBar.style.animation = 'none';
    // Trigger reflow
    void timerBar.offsetWidth;
    // Restart animation with proper duration
    timerBar.style.animation = `reaction-timer ${duration}s linear forwards`;
  },
  
  // Render the battle interface
  renderBattleInterface: function() {
    // Create modal container if needed
    let modalContainer = document.querySelector('.shieldwall-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.className = 'shieldwall-modal';
      document.body.appendChild(modalContainer);
      
      // Create the interface HTML structure
      modalContainer.innerHTML = `
        <div id="shieldwallInterface" class="shieldwall-interface">
          <h2 class="battle-title">BATTLE OF NESIAN FRONTIER</h2>
          
          <div class="formation-overview">
            <div class="formation-label">FORMATION OVERVIEW:</div>
            <div class="enemy-line">
              Enemy Line
              <div class="formation-units enemy-units">
                ${this.renderFormationUnits('r', 75)}
              </div>
              <div class="spacing-line"></div>
            </div>
            
            <div class="player-line">
              <div class="formation-units player-units">
                ${this.renderFormationUnits('b', 81)}
              </div>
              
              <div id="gapIndicator" class="gap-indicator">
                <span class="gap-label">Gap forming in line</span>
                <div class="arrow-down"></div>
              </div>
              
              <div id="playerPosition" class="player-position-marker">X</div>
            </div>
          </div>
          
          <div class="battle-status-panel">
            <div class="battle-phase">
              <div class="status-label">BATTLE PHASE:</div>
              <div id="battlePhaseDisplay" class="status-value">MAIN BATTLE</div>
              <div id="battleTimeDisplay" class="time-display">Time Elapsed: 00:14:32</div>
            </div>
            
            <div class="unit-status">
              <div class="status-label">Unit Strength:</div>
              <div id="unitStrengthDisplay" class="status-value">34/40</div>
              <div class="strength-bar-container">
                <div id="unitStrengthBar" class="strength-bar"></div>
              </div>
            </div>
            
            <div class="momentum-indicator">
              <div class="status-label">MOMENTUM:</div>
              <div class="momentum-bar-container">
                <div id="momentumBarNegative" class="momentum-bar negative"></div>
                <div id="momentumBarPositive" class="momentum-bar positive"></div>
              </div>
              <div id="momentumAdvantage" class="advantage-indicator">[Advantage: Paanic Forces]</div>
            </div>
            
            <div class="order-display">
              <div class="status-label">CURRENT ORDER:</div>
              <div id="currentOrderDisplay" class="order-value">HOLD THE LINE</div>
              <div class="order-progress-bar"></div>
            </div>
          </div>
          
          <div class="battle-log-container">
            <div id="shieldwallLog" class="shieldwall-log"></div>
          </div>
          
          <div class="battle-controls">
            <div class="player-stance">
              <div class="control-label">YOUR STANCE</div>
              <div id="stanceDisplay" class="stance-display balanced">
                Balanced<br>Stance
              </div>
              <div class="stance-buttons">
                <button class="shieldwall-btn stance-btn" onclick="window.shieldwallSystem.changeStance('aggressive')">Aggressive</button>
                <button class="shieldwall-btn stance-btn" onclick="window.shieldwallSystem.changeStance('balanced')">Balanced</button>
                <button class="shieldwall-btn stance-btn" onclick="window.shieldwallSystem.changeStance('defensive')">Defensive</button>
              </div>
            </div>
            
            <div id="reactionContainer" class="reaction-container">
              <div class="control-label">REACTION OPTIONS (5s)</div>
              <div id="reactionOptions" class="reaction-options">
                <!-- Will be dynamically populated -->
              </div>
            </div>
            
            <div class="shield-position">
              <div class="control-label">SHIELD POSITION:</div>
              <div class="shield-buttons">
                <button id="highShield" class="shieldwall-btn shield-btn" onclick="window.shieldwallSystem.changeShieldPosition('high')">HIGH</button>
                <button id="centerShield" class="shieldwall-btn shield-btn active" onclick="window.shieldwallSystem.changeShieldPosition('center')">CENTER</button>
                <button id="lowShield" class="shieldwall-btn shield-btn" onclick="window.shieldwallSystem.changeShieldPosition('low')">LOW</button>
              </div>
            </div>
          </div>
          
          <div class="unit-status-bars">
            <div class="status-bar-item">
              <div class="status-label">UNIT COHESION: <span id="cohesionValue">68%</span></div>
              <div class="status-label-small">[HOLDING FIRM]</div>
              <div class="unit-bar-container">
                <div id="cohesionBar" class="unit-bar cohesion-bar"></div>
              </div>
            </div>
            
            <div class="status-bar-item">
              <div class="status-label">HEALTH: <span id="shieldwallHealthValue">87/100</span></div>
              <div class="unit-bar-container">
                <div id="shieldwallHealthBar" class="unit-bar health-bar"></div>
              </div>
            </div>
            
            <div class="status-bar-item">
              <div class="status-label">STAMINA: <span id="shieldwallStaminaValue">71/100</span></div>
              <div class="unit-bar-container">
                <div id="shieldwallStaminaBar" class="unit-bar stamina-bar"></div>
              </div>
            </div>
            
            <div class="status-bar-item">
              <div class="status-label">MORALE: <span id="shieldwallMoraleValue">84/100</span></div>
              <div class="unit-bar-container">
                <div id="shieldwallMoraleBar" class="unit-bar morale-bar"></div>
              </div>
            </div>
          </div>
          
          <div id="shieldwallActions" class="shieldwall-actions">
            <button class="shieldwall-btn action-btn" onclick="window.shieldwallSystem.adjustPosition('left')">ADJUST LEFT</button>
            <button class="shieldwall-btn action-btn" onclick="window.shieldwallSystem.adjustPosition('right')">ADJUST RIGHT</button>
            <button class="shieldwall-btn action-btn" onclick="window.shieldwallSystem.generateThreat()">TEST THREAT</button>
            <button class="shieldwall-btn action-btn" onclick="window.shieldwallSystem.endBattle('victory')">END BATTLE</button>
          </div>
        </div>
      `;
    }
    
    // Show the interface
    modalContainer.style.display = 'flex';
    
    // Update initial UI elements
    this.updateBattleInterface();
    
    // Show / hide gap indicator
    const gapIndicator = document.getElementById('gapIndicator');
    if (gapIndicator) {
      gapIndicator.style.display = 'none'; // Hide initially
    }
    
    // Clear reaction options
    this.clearReactionOptions();
  },
  
  // Render formation units
  renderFormationUnits: function(type, count) {
    if (!type || typeof type !== 'string' || !count || count <= 0) {
      return '';
    }
    
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `<div class="unit-marker ${type}">${type.toUpperCase()}</div>`;
    }
    return html;
  },
  
  // Update the battle interface
  updateBattleInterface: function() {
    try {
      // Update battle title
      const battleTitle = document.querySelector('.battle-title');
      if (battleTitle) {
        battleTitle.textContent = `BATTLE OF NESIAN FRONTIER`;
      }
      
      // Update unit strength display
      const unitStrengthDisplay = document.getElementById('unitStrengthDisplay');
      if (unitStrengthDisplay) {
        unitStrengthDisplay.textContent = `${this.state.unitStrength.current}/${this.state.unitStrength.max}`;
      }
      
      // Update unit strength bar
      const unitStrengthBar = document.getElementById('unitStrengthBar');
      if (unitStrengthBar) {
        const strengthPercentage = (this.state.unitStrength.current / this.state.unitStrength.max) * 100;
        unitStrengthBar.style.width = `${strengthPercentage}%`;
        
        // Change color based on percentage
        if (strengthPercentage < 30) {
          unitStrengthBar.style.backgroundColor = '#ff5f6d';
        } else if (strengthPercentage < 60) {
          unitStrengthBar.style.backgroundColor = '#ffc371';
        } else {
          unitStrengthBar.style.backgroundColor = '#a8e063';
        }
      }
      
      // Update momentum display
      const momentumBarPositive = document.getElementById('momentumBarPositive');
      const momentumBarNegative = document.getElementById('momentumBarNegative');
      const momentumAdvantage = document.getElementById('momentumAdvantage');
      
      if (momentumBarPositive && momentumBarNegative && momentumAdvantage) {
        if (this.state.momentum.value >= 0) {
          momentumBarPositive.style.width = `${this.state.momentum.value}%`;
          momentumBarNegative.style.width = '0%';
        } else {
          momentumBarPositive.style.width = '0%';
          momentumBarNegative.style.width = `${-this.state.momentum.value}%`;
        }
        
        momentumAdvantage.textContent = `[Advantage: ${this.state.momentum.advantage}]`;
      }
      
      // Update battle phase display
      const battlePhaseDisplay = document.getElementById('battlePhaseDisplay');
      if (battlePhaseDisplay && this.state.battlePhase) {
        const phase = this.state.battlePhase.toUpperCase();
        battlePhaseDisplay.textContent = phase;
      }
      
      // Update battle time display
      const battleTimeDisplay = document.getElementById('battleTimeDisplay');
      if (battleTimeDisplay) {
        const minutes = Math.floor(this.state.timePassed / 60);
        const seconds = Math.floor(this.state.timePassed % 60);
        battleTimeDisplay.textContent = `Time Elapsed: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // Update order display
      const currentOrderDisplay = document.getElementById('currentOrderDisplay');
      if (currentOrderDisplay && this.state.currentOrder) {
        currentOrderDisplay.textContent = this.state.currentOrder.toUpperCase();
      }
      
      // Update stance display
      const stanceDisplay = document.getElementById('stanceDisplay');
      if (stanceDisplay && this.state.playerStance) {
        // First convert to proper case
        const stance = this.state.playerStance.charAt(0).toUpperCase() + this.state.playerStance.slice(1).toLowerCase();
        
        // Update class and text content
        stanceDisplay.className = `stance-display ${this.state.playerStance.toLowerCase()}`;
        stanceDisplay.innerHTML = `${stance}<br>Stance`;
      }
      
      // Update shield position buttons
      ['high', 'center', 'low'].forEach(pos => {
        const button = document.getElementById(`${pos}Shield`);
        if (button) {
          if (this.state.shieldPosition === pos) {
            button.classList.add('active');
          } else {
            button.classList.remove('active');
          }
        }
      });
      
      // Update cohesion display
      const cohesionValue = document.getElementById('cohesionValue');
      const cohesionBar = document.getElementById('cohesionBar');
      
      if (cohesionValue && cohesionBar) {
        cohesionValue.textContent = `${Math.round(this.state.cohesion.current)}%`;
        cohesionBar.style.width = `${this.state.cohesion.current}%`;
        
        // Update cohesion status text
        const cohesionStatusLabel = document.querySelector('.status-label-small');
        if (cohesionStatusLabel && this.state.cohesion.status) {
          cohesionStatusLabel.textContent = `[${this.state.cohesion.status.toUpperCase()}]`;
        }
        
        // Change color based on status
        if (this.state.cohesion.status === "breaking") {
          cohesionBar.style.backgroundColor = '#ff5f6d';
        } else if (this.state.cohesion.status === "wavering") {
          cohesionBar.style.backgroundColor = '#ffc371';
        } else {
          cohesionBar.style.backgroundColor = '#a8e063';
        }
      }
      
      // Update player stats from main game
      this.updatePlayerStatusBars();
      
      // Update reaction timer if active
      if (this.state.reactionNeeded) {
        const reactionContainer = document.getElementById('reactionContainer');
        if (reactionContainer) {
          const label = reactionContainer.querySelector('.control-label');
          if (label) {
            label.textContent = `REACTION OPTIONS (${Math.max(0, Math.ceil(this.state.reactionTimeRemaining))}s)`;
          }
        }
      }
    } catch (error) {
      console.error("Error updating battle interface:", error);
    }
  },
  
  // Update player status bars from stored playerStats
  updatePlayerStatusBars: function() {
    if (!this.playerStats) return;
    
    // Update health display
    const healthValue = document.getElementById('shieldwallHealthValue');
    const healthBar = document.getElementById('shieldwallHealthBar');
    if (healthValue && healthBar) {
      healthValue.textContent = `${Math.round(this.playerStats.health)}/${this.playerStats.maxHealth}`;
      healthBar.style.width = `${(this.playerStats.health / this.playerStats.maxHealth) * 100}%`;
    }
    
    // Update stamina display
    const staminaValue = document.getElementById('shieldwallStaminaValue');
    const staminaBar = document.getElementById('shieldwallStaminaBar');
    if (staminaValue && staminaBar) {
      staminaValue.textContent = `${Math.round(this.playerStats.stamina)}/${this.playerStats.maxStamina}`;
      staminaBar.style.width = `${(this.playerStats.stamina / this.playerStats.maxStamina) * 100}%`;
    }
    
    // Update morale display
    const moraleValue = document.getElementById('shieldwallMoraleValue');
    const moraleBar = document.getElementById('shieldwallMoraleBar');
    if (moraleValue && moraleBar) {
      moraleValue.textContent = `${Math.round(this.playerStats.morale)}/100`;
      moraleBar.style.width = `${this.playerStats.morale}%`;
    }
  },
  
  // Hide the battle interface
  hideBattleInterface: function() {
    const modalContainer = document.querySelector('.shieldwall-modal');
    if (modalContainer) {
      modalContainer.style.display = 'none';
    }
  },
  
  // Update reaction options based on current threat
  updateReactionOptions: function() {
    const reactionOptions = document.getElementById('reactionOptions');
    if (!reactionOptions) return;
    
    // Customize available reactions based on threat
    const threat = this.state.currentThreat;
    if (!threat) return;
    
    // Show the reaction container
    const reactionContainer = document.getElementById('reactionContainer');
    if (reactionContainer) {
      reactionContainer.style.display = 'block';
      
      // Add attention-grabbing animation for critical threats
      if (threat.criticalThreat) {
        reactionContainer.classList.add('critical-threat');
      } else {
        reactionContainer.classList.remove('critical-threat');
      }
    }
    
    // Get threat color (default to red if not specified)
    const threatColor = threat.color || "#FF0000";
    
    // Update the label to show time remaining and threat type with visual indicator
    const label = reactionContainer.querySelector('.control-label');
    if (label) {
      // Get emoji for threat (fallback to ⚠️ if none defined)
      const emoji = threat.emoji || "⚠️";
      
      // Update label with emoji, colored text, and timer
      label.innerHTML = `<span class="threat-emoji">${emoji}</span> REACT NOW! <span class="threat-timer">(${Math.ceil(threat.timeToReact)}s)</span>`;
      
      // Set color style
      label.style.color = threatColor;
    }
    
    // Make the reaction container more visible
    reactionContainer.style.borderColor = threatColor;
    reactionContainer.style.boxShadow = `0 0 10px ${threatColor}`;
    
    // Clear previous options
    reactionOptions.innerHTML = '';
    
    // Add appropriate reaction buttons
    let availableReactions = [];
    
    switch (threat.type) {
      case "projectiles":
        availableReactions = ["brace", "shield cover"];
        break;
      case "charge":
        availableReactions = ["brace", "attack"];
        break;
      case "gap":
        availableReactions = ["step to gap", "brace"];
        break;
      case "flanking":
        availableReactions = ["adjust position", "brace"];
        break;
      case "spears":
        availableReactions = ["brace", "shield cover"];
        break;
      case "officer":
        availableReactions = ["attack", "adjust position"];
        break;
      case "breakthrough":
        availableReactions = ["attack", "brace"];
        break;
      case "cavalry":
        availableReactions = ["brace", "attack"]; // Added for cavalry
        break;
      case "swords":
        availableReactions = ["brace", "shield cover"]; // Added for swords
        break;
      default:
        availableReactions = ["brace", "shield cover", "step to gap", "attack"];
    }
    
    // Create buttons for each reaction
    availableReactions.forEach(reaction => {
      const button = document.createElement('button');
      button.className = 'shieldwall-btn reaction-btn';
      
      // Highlight the best reaction for the threat
      if (reaction === threat.bestReaction) {
        button.classList.add('suggested-reaction');
      }
      
      button.textContent = reaction.toUpperCase();
      button.onclick = () => this.handleReaction(reaction);
      reactionOptions.appendChild(button);
    });
    
    // Start the timer animation
    this.startReactionTimer(threat.timeToReact);
  },
  
  // Clear reaction options
  clearReactionOptions: function() {
    const reactionContainer = document.getElementById('reactionContainer');
    if (reactionContainer) {
      reactionContainer.style.display = 'none';
      reactionContainer.classList.remove('critical-threat');
      reactionContainer.style.borderColor = '';
      reactionContainer.style.boxShadow = '';
    }
  },
  
  // Position adjustment function (left/right)
  adjustPosition: function(direction) {
    if (!direction || typeof direction !== 'string') {
      console.error("Invalid position adjustment direction:", direction);
      return;
    }
    
    // Validate direction
    direction = direction.toLowerCase();
    if (direction !== 'left' && direction !== 'right') {
      console.error("Invalid position adjustment direction:", direction);
      return;
    }
    
    // Update position
    if (direction === 'left') {
      if (this.state.position.file === 'center') {
        this.state.position.file = 'left';
        this.addBattleMessage("You adjust your position to the left side of the formation.");
      } else if (this.state.position.file === 'right') {
        this.state.position.file = 'center';
        this.addBattleMessage("You adjust your position toward the center of the formation.");
      } else {
        this.addBattleMessage("You're already at the left edge of the formation.");
      }
    } else { // right
      if (this.state.position.file === 'center') {
        this.state.position.file = 'right';
        this.addBattleMessage("You adjust your position to the right side of the formation.");
      } else if (this.state.position.file === 'left') {
        this.state.position.file = 'center';
        this.addBattleMessage("You adjust your position toward the center of the formation.");
      } else {
        this.addBattleMessage("You're already at the right edge of the formation.");
      }
    }
    
    // Update UI
    this.updateBattleInterface();
    
    // ADD THIS LINE:
    // Update player position marker
    this.updatePlayerPositionMarker();
  },
  
  // Add CSS styles for shieldwall system
  addShieldwallStyles: function() {
    const styleElement = document.createElement('style');
    styleElement.id = 'shieldwall-styles';
    styleElement.textContent = `
      /* Shieldwall System Styles */
      .shieldwall-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      .shieldwall-interface {
        width: 95%;
        max-width: 1200px;
        height: 95vh;
        max-height: 900px;
        background: #1a1a1a;
        border: 2px solid #444;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
        display: grid;
        grid-template-rows: auto auto 1fr auto auto;
        grid-template-columns: 1fr 300px;
        grid-template-areas:
          "title title"
          "formation status"
          "log log"
          "controls controls"
          "unit-status unit-status"
          "actions actions";
        gap: 15px;
        color: #e0e0e0;
        overflow: hidden;
      }
      
      .battle-title {
        grid-area: title;
        text-align: center;
        margin: 0 0 10px 0;
        color: #c9aa71;
        font-size: 1.4em;
      }
      
      /* Formation overview */
      .formation-overview {
        grid-area: formation;
        background: #1e293b;
        padding: 15px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .formation-label {
        font-weight: bold;
        margin-bottom: 5px;
        color: #aaa;
        font-size: 0.85em;
      }
      
      .enemy-line, .player-line {
        margin: 10px 0;
        position: relative;
      }
      
      .formation-units {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        justify-content: center;
      }
      
      .unit-marker {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7em;
        font-weight: bold;
        color: white;
      }
      
      .unit-marker.r {
        background-color: #8E0E00;
      }
      
      .unit-marker.b {
        background-color: #4682B4;
      }
      
      .spacing-line {
        border-top: 1px dotted #666;
        margin: 10px 0;
      }
      
      .gap-indicator {
        position: absolute;
        top: -10px;
        left: 40%;
        color: #ff5f6d;
        font-size: 0.8em;
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: blink 1s infinite;
      }
      
      .arrow-down {
        width: 0; 
        height: 0; 
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid #ff5f6d;
      }
      
      .player-position-marker {
        position: absolute;
        bottom: -10px;
        left: 50%;
        font-weight: bold;
        color: #c9aa71;
      }
      
      /* Battle status panel */
      .battle-status-panel {
        grid-area: status;
        background: #1e293b;
        padding: 15px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .battle-phase {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .status-label {
        font-weight: bold;
        color: #888;
        font-size: 0.8em;
      }
      
      .status-label-small {
        font-size: 0.7em;
        color: #aaa;
      }
      
      .status-value {
        font-weight: bold;
        color: #c9aa71;
        font-size: 1.1em;
      }
      
      .time-display {
        font-size: 0.8em;
        color: #aaa;
      }
      
      .strength-bar-container, .momentum-bar-container {
        width: 100%;
        height: 10px;
        background: #333;
        border-radius: 5px;
        overflow: hidden;
        margin-top: 5px;
      }
      
      .strength-bar {
        height: 100%;
        width: 85%;
        background-color: #a8e063;
        border-radius: 5px;
      }
      
      .momentum-bar-container {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
      }
      
      .momentum-bar {
        height: 100%;
        width: 0%;
        transition: width 0.3s ease-out;
      }
      
      .momentum-bar.positive {
        background-color: #a8e063;
        margin-left: 50%;
      }
      
      .momentum-bar.negative {
        background-color: #ff5f6d;
        margin-right: 50%;
      }
      
      .advantage-indicator {
        text-align: center;
        font-size: 0.8em;
        color: #aaa;
        margin-top: 5px;
      }
      
      .order-display {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .order-value {
        font-weight: bold;
        color: #c9aa71;
        font-size: 1.1em;
        text-align: center;
      }
      
      .order-progress-bar {
        width: 100%;
        height: 5px;
        background: #a8e063;
        border-radius: 5px;
        margin-top: 5px;
      }
      
      /* Battle log */
      .battle-log-container {
        grid-area: log;
        width: 100%;
        max-height: 200px;
      }
      
      .shieldwall-log {
        height: 100%;
        overflow-y: auto;
        padding: 10px;
        background: #1e293b;
        border-radius: 8px;
        font-size: 0.9em;
        line-height: 1.4;
      }
      
      .shieldwall-log p {
        margin: 5px 0;
        padding-left: 10px;
        border-left: 2px solid #444;
      }
      
      /* Battle controls */
      .battle-controls {
        grid-area: controls;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 15px;
      }
      
      .player-stance, .reaction-container, .shield-position {
        background: #1e293b;
        padding: 10px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .control-label {
        font-weight: bold;
        color: #888;
        font-size: 0.8em;
        text-align: center;
      }
      
      .stance-display {
        text-align: center;
        padding: 10px;
        border-radius: 5px;
        font-weight: bold;
        margin: 0 auto;
        width: 80%;
      }
      
      .stance-display.balanced {
        background: rgba(160, 160, 255, 0.2);
        color: #a0a0ff;
      }
      
      .stance-display.aggressive {
        background: rgba(255, 95, 109, 0.2);
        color: #ff5f6d;
      }
      
      .stance-display.defensive {
        background: rgba(168, 224, 99, 0.2);
        color: #a8e063;
      }
      
      .stance-buttons, .reaction-options, .shield-buttons {
        display: flex;
        justify-content: center;
        gap: 5px;
        flex-wrap: wrap;
      }
      
      .shieldwall-btn {
        background: #2a2a2a;
        color: #e0e0e0;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 0.85em;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .shieldwall-btn:hover {
        background: #3a3a3a;
        transform: translateY(-2px);
      }
      
      .shieldwall-btn:active {
        transform: translateY(1px);
      }
      
      .shieldwall-btn.active {
        background: #3a3a3a;
        border: 1px solid #c9aa71;
      }
      
      .stance-btn {
        flex: 1;
      }
      
      .shield-btn {
        flex: 1;
      }
      
      .reaction-btn {
        margin: 5px;
        min-width: 100px;
      }
      
      /* Unit status bars */
      .unit-status-bars {
        grid-area: unit-status;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        background: #1e293b;
        padding: 10px;
        border-radius: 8px;
      }
      
      .status-bar-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .unit-bar-container {
        width: 100%;
        height: 10px;
        background: #333;
        border-radius: 5px;
        overflow: hidden;
      }
      
      .unit-bar {
        height: 100%;
        width: 85%;
        border-radius: 5px;
        transition: width 0.3s ease-out;
      }
      
      .cohesion-bar {
        background-color: #a8e063;
      }
      
      .health-bar {
        background-color: #ff5f6d;
      }
      
      .stamina-bar {
        background-color: #a8e063;
      }
      
      .morale-bar {
        background-color: #4776E6;
      }
      
      /* Actions section */
      .shieldwall-actions {
        grid-area: actions;
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 10px;
      }
      
      .action-btn {
        font-size: 0.9em;
        padding: 10px 15px;
      }
      
      .large-btn {
        font-size: 1.1em;
        padding: 12px 24px;
        background: #2a623d;
      }
      
      /* Animations */
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      /* Responsive adjustments */
      @media (max-width: 1000px) {
        .battle-controls {
          grid-template-columns: 1fr 1fr;
        }
        
        .unit-status-bars {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (max-width: 768px) {
        .shieldwall-interface {
          grid-template-columns: 1fr;
          grid-template-areas:
            "title"
            "formation"
            "status"
            "log"
            "controls"
            "unit-status"
            "actions";
        }
        
        .battle-controls {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    document.head.appendChild(styleElement);
  },
  
  // Add CSS for enhanced visual elements
  addEnhancedStyles: function() {
    // Check if we already added the styles
    if (document.getElementById('shieldwall-enhanced-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'shieldwall-enhanced-styles';
    styleElement.textContent = `
      /* Enhanced shieldwall styles for better threat visualization */
      
      /* Battle log flash effect */
      @keyframes battle-log-flash {
        0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
      }
      
      .battle-log-flash {
        animation: battle-log-flash 1s forwards;
      }
      
      /* Enhanced reaction container */
      .reaction-container {
        position: relative;
        transition: all 0.3s ease;
        overflow: hidden;
      }
      
      .reaction-container.critical-threat {
        animation: critical-threat-pulse 1s infinite;
      }
      
      @keyframes critical-threat-pulse {
        0% { background-color: rgba(178, 34, 34, 0.1); }
        50% { background-color: rgba(178, 34, 34, 0.3); }
        100% { background-color: rgba(178, 34, 34, 0.1); }
      }
      
      /* Threat emoji styling */
      .threat-emoji {
        font-size: 1.5em;
        margin-right: 5px;
        vertical-align: middle;
      }
      
      /* Threat timer styling */
      .threat-timer {
        font-weight: bold;
        animation: timer-pulse 1s infinite;
      }
      
      @keyframes timer-pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      /* Reaction timer bar */
      .reaction-timer-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background-color: #FF6347; /* Tomato */
        transform-origin: left;
      }
      
      @keyframes reaction-timer {
        0% { transform: scaleX(1); background-color: #4CAF50; }
        50% { background-color: #FFC107; }
        75% { background-color: #FF9800; }
        100% { transform: scaleX(0); background-color: #F44336; }
      }
      
      /* Suggested reaction button styling */
      .suggested-reaction {
        border: 2px solid #FFD700 !important; /* Gold */
        background-color: rgba(255, 215, 0, 0.2) !important;
        position: relative;
      }
      
      .suggested-reaction::after {
        content: '✓';
        position: absolute;
        top: 2px;
        right: 5px;
        color: #FFD700;
        font-weight: bold;
        font-size: 0.8em;
      }

      /* Formation units dynamics */
      .formation-units {
        transition: all 0.5s ease;
        position: relative;
      }

      .formation-breaking {
        animation: formation-breaking 2s infinite;
      }

      @keyframes formation-breaking {
        0% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        50% { transform: translateX(5px); }
        75% { transform: translateX(-5px); }
        100% { transform: translateX(0); }
      }

      .unit-marker {
        transition: all 0.3s ease;
      }

      /* Enhanced gap indicator */
      .gap-indicator {
        transition: left 0.5s ease;
      }

      .critical-gap {
        animation: critical-gap 1s infinite;
      }

      @keyframes critical-gap {
        0% { transform: scale(1); color: #ff5f6d; }
        50% { transform: scale(1.2); color: #ff0000; }
        100% { transform: scale(1); color: #ff5f6d; }
      }

      /* Enhanced player position marker */
      .player-position-marker {
        transition: left 0.3s ease;
        font-size: 1.2em;
        background-color: rgba(25, 25, 112, 0.6);
        padding: 2px 5px;
        border-radius: 50%;
        font-weight: bold;
      }

      .player-position-marker.aggressive-stance {
        color: #ff5f6d;
        background-color: rgba(139, 0, 0, 0.6);
      }

      .player-position-marker.defensive-stance {
        color: #a8e063;
        background-color: rgba(34, 139, 34, 0.6);
      }

      /* Battle effects */
      .battle-effect {
        position: absolute;
        z-index: 10;
        pointer-events: none;
      }

      .arrow-effect {
        width: 15px;
        height: 2px;
        background-color: #333;
        position: absolute;
        animation: arrow-fall 1s forwards;
      }

      .arrow-effect:before {
        content: '';
        position: absolute;
        top: -3px;
        right: 0;
        border-left: 5px solid #333;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
      }

      @keyframes arrow-fall {
        0% { transform: translateY(-20px) rotate(110deg); opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(100px) rotate(110deg); opacity: 0; }
      }

      .charge-effect {
        width: 100%;
        height: 30px;
        background: linear-gradient(90deg, transparent, rgba(255, 69, 0, 0.4), transparent);
        top: 40%;
        animation: charge-effect 1.5s forwards;
      }

      @keyframes charge-effect {
        0% { transform: translateY(-50px); opacity: 0; }
        20% { opacity: 0.7; }
        80% { opacity: 0.7; }
        100% { transform: translateY(50px); opacity: 0; }
      }

      .flanking-effect {
        width: 40px;
        height: 40px;
        top: 50%;
        background: radial-gradient(circle, rgba(255, 69, 0, 0.6) 0%, transparent 70%);
        animation: flanking-effect 2s forwards;
      }

      @keyframes flanking-effect {
        0% { transform: translateY(-30px) scale(0.5); opacity: 0; }
        20% { opacity: 0.8; }
        80% { opacity: 0.8; transform: scale(1.2); }
        100% { transform: translateY(30px) scale(0.8); opacity: 0; }
      }

      .breakthrough-effect {
        width: 30px;
        height: 60px;
        background: radial-gradient(ellipse, rgba(255, 0, 0, 0.6) 0%, transparent 70%);
        top: 30%;
        animation: breakthrough-effect 2s forwards;
      }

      @keyframes breakthrough-effect {
        0% { transform: scale(0.5); opacity: 0; }
        20% { opacity: 0.8; }
        50% { transform: scale(1.5); }
        100% { transform: translateY(70px) scale(0.8); opacity: 0; }
      }

      .breaking-effect {
        width: 100%;
        height: 40px;
        background: linear-gradient(180deg, transparent, rgba(255, 0, 0, 0.3), transparent);
        animation: breaking-effect 2.5s forwards;
      }

      .breaking-effect.enemy-breaking {
        top: 20%;
      }

      .breaking-effect.player-breaking {
        top: 60%;
      }

      @keyframes breaking-effect {
        0% { opacity: 0; }
        20% { opacity: 0.7; }
        80% { opacity: 0.7; }
        100% { opacity: 0; }
      }
      
      /* Cavalry Effect - NEW */
      .cavalry-effect {
        width: 50px;
        height: 25px;
        position: absolute;
        background-color: #8B4513;
        border-radius: 40% 10% 10% 40%;
        animation: cavalry-charge 3s forwards;
        transform-origin: center;
      }
      
      .cavalry-effect:before {
        content: '';
        position: absolute;
        width: 10px;
        height: 10px;
        top: -5px;
        left: 5px;
        background-color: #8B4513;
        border-radius: 50%;
      }
      
      @keyframes cavalry-charge {
        0% { transform: translateX(-100px) scale(0.7); opacity: 0.7; }
        40% { transform: translateX(0) scale(1); opacity: 1; }
        100% { transform: translateX(200px) scale(1.2); opacity: 0; }
      }
      
      /* Sword Effect - NEW */
      .sword-effect {
        width: 30px;
        height: 5px;
        background-color: #4682B4;
        position: absolute;
        top: 60%;
        transform-origin: right center;
        animation: sword-swing 1s forwards;
      }
      
      .sword-effect:before {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #4682B4;
        right: -2px;
        top: -1.5px;
      }
      
      @keyframes sword-swing {
        0% { transform: rotate(-45deg) translateX(0); opacity: 0; }
        20% { opacity: 1; }
        50% { transform: rotate(0deg) translateX(0); }
        100% { transform: rotate(45deg) translateX(10px); opacity: 0; }
      }
    `;
    
    document.head.appendChild(styleElement);
  },
  
  // Show battle results screen
  showBattleResultsScreen: function(outcome, title, message) {
    // Create container for results screen if it doesn't exist
    let resultsScreen = document.getElementById('shieldwallResults');
    if (resultsScreen) {
      resultsScreen.remove(); // Remove existing results screen
    }
    
    resultsScreen = document.createElement('div');
    resultsScreen.id = 'shieldwallResults';
    resultsScreen.className = 'shieldwall-results ' + outcome;
    
    // Unit stats
    const unitStrength = {
      start: this.state.unitStrength.max,
      end: this.state.unitStrength.current,
      casualties: this.state.unitStrength.casualties
    };
    
    // Create content
    resultsScreen.innerHTML = `
      <div class="results-content">
        <h2 class="results-title">${title}</h2>
        <div class="results-message">${message}</div>
        
        <div class="results-stats">
          <div class="stats-row">
            <div class="stat-label">Initial Strength:</div>
            <div class="stat-value">${unitStrength.start} soldiers</div>
          </div>
          <div class="stats-row">
            <div class="stat-label">Remaining Strength:</div>
            <div class="stat-value">${unitStrength.end} soldiers</div>
          </div>
          <div class="stats-row">
            <div class="stat-label">Casualties:</div>
            <div class="stat-value">${unitStrength.casualties} soldiers</div>
          </div>
          <div class="stats-row">
            <div class="stat-label">Battle Duration:</div>
            <div class="stat-value">${Math.floor(this.state.timePassed / 60)}m ${this.state.timePassed % 60}s</div>
          </div>
        </div>
        
        <button id="completeBattleBtn" class="complete-battle-btn">
          CONTINUE
        </button>
      </div>
    `;
    
    // Add to the battle interface
    const battleInterface = document.getElementById('shieldwallInterface');
    if (battleInterface) {
      battleInterface.appendChild(resultsScreen);
      
      // Add button event listener
      document.getElementById('completeBattleBtn').addEventListener('click', () => {
        // Hide battle interface
        this.hideBattleInterface();
        
        // Return to quest or main game as appropriate
        if (window.gameState && window.gameState.inQuestSequence && window.quests) {
          // Find active quest
          const activeQuest = window.quests.find(q => q.status === window.QUEST_STATUS.ACTIVE);
          if (activeQuest && window.resumeQuestAfterShieldwall) {
            window.resumeQuestAfterShieldwall(activeQuest, outcome);
          } else {
            // Fallback: return to main game
            window.updateActionButtons();
          }
        } else {
          // Return to main game
          if (typeof window.updateActionButtons === 'function') {
            window.updateActionButtons();
          }
        }
      });
      
      // Add pulse animation to button
      this.pulseButton('completeBattleBtn');
    }
    
    // Add CSS for results screen if not already added
    this.addResultsScreenStyles();
  },
  
  // Add styles for results screen
  addResultsScreenStyles: function() {
    if (document.getElementById('shieldwall-results-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'shieldwall-results-styles';
    styleElement.textContent = `
      .shieldwall-results {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        animation: fade-in 0.5s forwards;
      }
      
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .results-content {
        background-color: #1a1a1a;
        border: 3px solid #c9aa71;
        border-radius: 10px;
        padding: 30px;
        max-width: 600px;
        width: 80%;
        text-align: center;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
      }
      
      .shieldwall-results.victory .results-content {
        border-color: #a8e063;
      }
      
      .shieldwall-results.defeat .results-content {
        border-color: #ff5f6d;
      }
      
      .results-title {
        color: #c9aa71;
        font-size: 2.5em;
        margin: 0 0 20px 0;
        text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      }
      
      .shieldwall-results.victory .results-title {
        color: #a8e063;
      }
      
      .shieldwall-results.defeat .results-title {
        color: #ff5f6d;
      }
      
      .results-message {
        color: #e0e0e0;
        font-size: 1.2em;
        margin-bottom: 30px;
        line-height: 1.4;
      }
      
      .results-stats {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
        text-align: left;
      }
      
      .stats-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      
      .stats-row:last-child {
        margin-bottom: 0;
      }
      
      .stat-label {
        color: #888;
        font-weight: bold;
      }
      
      .stat-value {
        color: #e0e0e0;
        font-weight: bold;
      }
      
      .complete-battle-btn {
        background-color: #3a3a3a;
        color: #ffffff;
        border: none;
        padding: 15px 40px;
        font-size: 1.3em;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
      }
      
      .complete-battle-btn:hover {
        background-color: #4a4a4a;
        transform: translateY(-3px);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
      }
      
      .complete-battle-btn:active {
        transform: translateY(1px);
      }
      
      .shieldwall-results.victory .complete-battle-btn {
        background-color: #2a623d;
      }
      
      .shieldwall-results.victory .complete-battle-btn:hover {
        background-color: #3a724d;
      }
      
      .shieldwall-results.defeat .complete-battle-btn {
        background-color: #6d2a2a;
      }
      
      .shieldwall-results.defeat .complete-battle-btn:hover {
        background-color: #7d3a3a;
      }
      
      @keyframes button-pulse {
        0% { transform: scale(1); box-shadow: 0 0 15px rgba(0, 0, 0, 0.5); }
        50% { transform: scale(1.05); box-shadow: 0 0 25px rgba(255, 255, 255, 0.2); }
        100% { transform: scale(1); box-shadow: 0 0 15px rgba(0, 0, 0, 0.5); }
      }
      
      .button-pulse {
        animation: button-pulse 1.5s infinite;
      }
    `;
    
    document.head.appendChild(styleElement);
  },
  
  // Button pulse animation to draw attention
  pulseButton: function(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('button-pulse');
    }
  },
  
  // Update the formation units based on casualties and battle state
  updateFormationDisplay: function() {
    // Update enemy formation based on momentum and casualties
    const enemyUnitsContainer = document.querySelector('.enemy-units');
    if (enemyUnitsContainer) {
      const enemyInitialStrength = Math.floor(this.state.unitStrength.max * 1.2); // Assume enemy starts with ~20% more
      const enemyCurrentStrength = this.calculateEnemyStrength();
      
      // Clear and rebuild enemy formation
      enemyUnitsContainer.innerHTML = this.renderFormationUnits('r', enemyCurrentStrength);
      
      // Add visual indicators for breaking enemy formation when momentum is high
      if (this.state.momentum.value > 60) {
        enemyUnitsContainer.classList.add('formation-breaking');
      } else {
        enemyUnitsContainer.classList.remove('formation-breaking');
      }
    }
    
    // Update player formation based on current unit strength
    const playerUnitsContainer = document.querySelector('.player-units');
    if (playerUnitsContainer) {
      // Clear and rebuild player formation
      playerUnitsContainer.innerHTML = this.renderFormationUnits('b', this.state.unitStrength.current);
      
      // Add visual indicators for breaking player formation when cohesion is low
      if (this.state.cohesion.current < 30) {
        playerUnitsContainer.classList.add('formation-breaking');
      } else {
        playerUnitsContainer.classList.remove('formation-breaking');
      }
    }
    
    // Update player position marker
    this.updatePlayerPositionMarker();
    
    // Update gap indicator
    this.updateGapIndicator();
  },
  
  // Calculate current enemy strength based on battle progress and momentum
  calculateEnemyStrength: function() {
    const enemyInitialStrength = Math.floor(this.state.unitStrength.max * 1.2);
    
    // Calculate losses based on momentum (higher momentum = more enemy casualties)
    const momentumFactor = (this.state.momentum.value + 100) / 200; // Convert -100 to 100 scale to 0-1 scale
    const casualtyPercentage = momentumFactor * 0.6; // At max momentum, enemy could lose up to 60% strength
    
    // Also factor in battle phase
    let phaseMultiplier = 1.0;
    switch (this.state.battlePhase) {
      case "skirmish": phaseMultiplier = 0.1; break; // Few casualties in skirmish
      case "engagement": phaseMultiplier = 0.4; break; // Some casualties in engagement
      case "main": phaseMultiplier = 0.8; break; // Many casualties in main phase
      case "breaking": phaseMultiplier = 1.0; break; // Most casualties in breaking phase
      case "resolution": phaseMultiplier = 1.0; break; // Most casualties in resolution
      default: phaseMultiplier = 0.5;
    }
    
    // Calculate adjusted casualties
    const adjustedCasualties = Math.floor(enemyInitialStrength * casualtyPercentage * phaseMultiplier);
    
    // Ensure we don't go below 1 enemy
    return Math.max(1, enemyInitialStrength - adjustedCasualties);
  },
  
  // Update player position marker
  updatePlayerPositionMarker: function() {
    const playerMarker = document.getElementById('playerPosition');
    if (!playerMarker) return;
    
    // Adjust position based on player's file position
    let leftPosition = 50; // Default center position
    
    if (this.state.position.file === 'left') {
      leftPosition = 20;
    } else if (this.state.position.file === 'right') {
      leftPosition = 80;
    }
    
    playerMarker.style.left = `${leftPosition}%`;
    
    // Add a visual indicator of the player's stance
    let markerClass = '';
    switch (this.state.playerStance) {
      case 'aggressive': markerClass = 'aggressive-stance'; break;
      case 'defensive': markerClass = 'defensive-stance'; break;
      default: markerClass = '';
    }
    
    // Update classes
    playerMarker.className = 'player-position-marker';
    if (markerClass) {
      playerMarker.classList.add(markerClass);
    }
  },
  
  // Update gap indicator
  updateGapIndicator: function() {
    const gapIndicator = document.getElementById('gapIndicator');
    if (!gapIndicator) return;
    
    // Show gap indicator when cohesion is low or specific threats occurred
    const showGap = this.state.cohesion.current < 40 || 
                   (this.state.lastThreatType === 'gap' && !this.state.reactionSuccess);
    
    if (showGap) {
      gapIndicator.style.display = 'flex';
      
      // Position the gap based on recent threats or randomness
      let gapPosition = 40; // Default position
      
      if (this.state.lastThreatType === 'flanking') {
        gapPosition = 80; // Gap on the flank
      } else if (this.state.reactionSuccess === false) {
        // Position gap away from player when reaction failed
        gapPosition = this.state.position.file === 'left' ? 60 : 20;
      } else {
        // Some randomness in gap position
        gapPosition = 20 + Math.floor(Math.random() * 60);
      }
      
      gapIndicator.style.left = `${gapPosition}%`;
      
      // Critical gap indicator when cohesion is very low
      if (this.state.cohesion.current < 20) {
        gapIndicator.classList.add('critical-gap');
      } else {
        gapIndicator.classList.remove('critical-gap');
      }
    } else {
      gapIndicator.style.display = 'none';
    }
  },
  
  // Add battle-specific visual effects to the formation display
  addBattleEffects: function() {
    const formationOverview = document.querySelector('.formation-overview');
    if (!formationOverview) return;
    
    // Clear previous battle effects
    const existingEffects = formationOverview.querySelectorAll('.battle-effect');
    existingEffects.forEach(effect => effect.remove());
    
    // Add effects based on battle phase
    switch (this.state.battlePhase) {
      case "skirmish":
        // Add arrow effects during skirmish
        this.addArrowEffects(formationOverview);
        break;
      case "engagement":
        // Add charge effects during engagement
        this.addChargeEffect(formationOverview);
        break;
      case "breaking":
        // Add breaking effects
        this.addBreakingEffect(formationOverview);
        break;
    }
    
    // Add effects based on current threat
    if (this.state.currentThreat) {
      switch (this.state.currentThreat.type) {
        case "projectiles":
          this.addArrowEffects(formationOverview);
          break;
        case "flanking":
          this.addFlankingEffect(formationOverview);
          break;
        case "breakthrough":
          this.addBreakthroughEffect(formationOverview);
          break;
        case "cavalry":
          this.addCavalryEffect(formationOverview);
          break;
        case "swords":
          this.addSwordEffect(formationOverview);
          break;
      }
    }
  },
  
  // Add arrow volley effects
  addArrowEffects: function(container) {
    // Create 8-12 arrows at random positions
    const arrowCount = 8 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < arrowCount; i++) {
      const arrow = document.createElement('div');
      arrow.className = 'battle-effect arrow-effect';
      
      // Random position
      arrow.style.left = `${10 + Math.random() * 80}%`;
      arrow.style.top = `${20 + Math.random() * 20}%`;
      
      // Random rotation
      const rotation = 100 + Math.random() * 30;
      arrow.style.transform = `rotate(${rotation}deg)`;
      
      container.appendChild(arrow);
      
      // Remove after animation completes
      setTimeout(() => {
        arrow.remove();
      }, 1000 + Math.random() * 500);
    }
  },
  
  // Add charge effect
  addChargeEffect: function(container) {
    const charge = document.createElement('div');
    charge.className = 'battle-effect charge-effect';
    
    container.appendChild(charge);
    
    // Remove after animation completes
    setTimeout(() => {
      charge.remove();
    }, 1500);
  },
  
  // Add flanking effect
  addFlankingEffect: function(container) {
    const flank = document.createElement('div');
    flank.className = 'battle-effect flanking-effect';
    
    // Position on right or left flank
    const onRight = Math.random() > 0.5;
    flank.style.left = onRight ? '80%' : '10%';
    
    container.appendChild(flank);
    
    // Remove after animation completes
    setTimeout(() => {
      flank.remove();
    }, 2000);
  },
  
  // Add breakthrough effect
  addBreakthroughEffect: function(container) {
    const breakthrough = document.createElement('div');
    breakthrough.className = 'battle-effect breakthrough-effect';
    
    // Random position along the line
    breakthrough.style.left = `${20 + Math.random() * 60}%`;
    
    container.appendChild(breakthrough);
    
    // Remove after animation completes
    setTimeout(() => {
      breakthrough.remove();
    }, 2000);
  },
  
  // Add breaking effect
  addBreakingEffect: function(container) {
    // Determine which side is breaking based on momentum
    const playerBreaking = this.state.momentum.value < -30;
    
    const breaking = document.createElement('div');
    breaking.className = 'battle-effect breaking-effect';
    
    if (playerBreaking) {
      breaking.classList.add('player-breaking');
    } else {
      breaking.classList.add('enemy-breaking');
    }
    
    container.appendChild(breaking);
    
    // Remove after animation completes
    setTimeout(() => {
      breaking.remove();
    }, 2500);
  },
  
  // Add cavalry charge effect
  addCavalryEffect: function(container) {
    // Create multiple cavalry units charging
    for (let i = 0; i < 3; i++) {
      const cavalry = document.createElement('div');
      cavalry.className = 'battle-effect cavalry-effect';
      
      // Stagger the horsemen
      cavalry.style.left = `${30 + (i * 15)}%`;
      cavalry.style.top = `${15 + (i * 5)}%`;
      cavalry.style.animationDelay = `${i * 0.2}s`;
      
      container.appendChild(cavalry);
      
      // Remove after animation completes
      setTimeout(() => {
        cavalry.remove();
      }, 3000);
    }
  },
  
  // Add sword effect
  addSwordEffect: function(container) {
    const sword = document.createElement('div');
    sword.className = 'battle-effect sword-effect';
    
    // Position near the player
    const playerMarker = document.getElementById('playerPosition');
    if (playerMarker) {
      const rect = playerMarker.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeLeft = (rect.left - containerRect.left) / containerRect.width * 100;
      sword.style.left = `${relativeLeft}%`;
    } else {
      sword.style.left = '50%';
    }
    
    container.appendChild(sword);
    
    // Remove after animation completes
    setTimeout(() => {
      sword.remove();
    }, 1000);
  }
};

// Function to start a shieldwall battle from a quest
window.startShieldwallBattle = function(config) {
  console.log("Starting shieldwall battle with config:", config);
  
  // Make sure shieldwallOutcomeQueue exists
  if (!window.shieldwallOutcomeQueue) {
    window.shieldwallOutcomeQueue = [];
  }
  
  // Find the active quest
  const activeQuest = window.quests?.find(q => q.status === window.QUEST_STATUS.ACTIVE);
  
  // Make sure the system is initialized
  if (!window.shieldwallSystem.initialized) {
    window.shieldwallSystem.initialize();
  }
  
  // Store original callback
  const originalCallback = config.onBattleEnd;
  
  // Replace with safe callback
  config.onBattleEnd = function(outcome) {
    console.log(`Battle ended with outcome: ${outcome}`);
    
    try {
      // Make sure queue exists
      if (!window.shieldwallOutcomeQueue) {
        window.shieldwallOutcomeQueue = [];
      }
      
      // Safely push outcome if we have a valid quest
      if (activeQuest && activeQuest.id) {
        window.shieldwallOutcomeQueue.push({
          questId: activeQuest.id,
          stageId: activeQuest.stages[activeQuest.currentStageIndex]?.id || 'unknown',
          outcome: outcome
        });
        
        console.log("Successfully stored battle outcome in queue");
      }
      
      // Process the outcome immediately if possible
      if (activeQuest && typeof window.resumeQuestAfterShieldwall === 'function') {
        window.resumeQuestAfterShieldwall(activeQuest, outcome);
      }
      
      // Call original callback if it exists
      if (typeof originalCallback === 'function') {
        originalCallback(outcome);
      }
    } catch (error) {
      console.error("Error in battle end callback:", error);
    }
  };
  
  // Start the shieldwall battle
  window.shieldwallSystem.initiateBattle(config);
};

// Helper function to resume a quest after a shieldwall battle
window.resumeQuestAfterShieldwall = function(quest, outcome) {
  console.log(`Resuming quest after shieldwall battle with outcome: ${outcome}`);
  
  // Find the current stage
  if (!quest || !quest.stages || !quest.currentStageIndex) {
    console.error("Invalid quest object:", quest);
    return;
  }
  
  const currentStage = quest.stages[quest.currentStageIndex];
  const nextStage = currentStage.nextStage;
  
  // Different handling based on outcome
  if (outcome === "victory") {
    // Add success narrative and progress quest
    window.addToNarrative("Your unit has successfully held the line against the enemy forces. The battle is won!");
    
    // Progress to next stage if specified
    if (nextStage) {
      window.progressQuest(quest.id, currentStage.action);
    }
  } else {
    // Fail quest on defeat
    window.addToNarrative("Your unit has been overwhelmed by the enemy forces. The battle is lost.");
    window.failQuest(quest.id);
  }
};

// Initialize the shieldwall system when the page loads
document.addEventListener('DOMContentLoaded', function() {
  window.shieldwallSystem.initialize();
});

// Enhanced handleReturnToCamp function to integrate better with the reward system
window.handleReturnToCamp = function(quest) {
  // Track performance data for conditional rewards
  if (!quest.userData) quest.userData = {};
  
  // Get battle cohesion from shieldwall system if available
  if (window.shieldwallSystem && window.shieldwallSystem.state) {
    quest.userData.formationCohesion = window.shieldwallSystem.state.cohesion.current;
  }
  
  // Set narrative for the quest conclusion
  window.setNarrative(`
    <p>Your Spear Host returns to camp victorious, bearing captured supplies and valuable intelligence. The elimination of the Arrasi outpost represents a significant blow to enemy operations in the region.</p>
    
    <p>Later that evening, the Vayren calls for you. "Report to the Sarkein's tent," he orders. "Apparently, he wants to hear about the scouting mission from someone who was there."</p>
    
    <p>When you arrive at the command tent, Sarkein Reval is studying the captured maps. He acknowledges your salute with a nod.</p>
    
    <p>"Your Squad performed well today," he says. "The intelligence your unit recovered will help us plan our next moves in this sector."</p>
    
    <p>The Sarkein gestures to a collection of items laid out on a corner of the table - spoils from the raid allocated to your unit.</p>
    
    <p>"These are yours by right of conquest," he continues. "The officer's blade is particularly fine - Arrasi steel, but with a balance superior to their typical work. Take it with my compliments."</p>
    
    <p>He studies the maps thoughtfully. "Tell your Vayren that I'll be looking to his unit for future operations. The Empire needs soldiers who can think and act decisively."</p>
    
    <p>As you leave the Sarkein's tent with your share of the spoils, there's a new respect in the eyes of your fellow soldiers. Your Squad's actions today have made a difference, and your reputation within the Kasvaari has grown.</p>
  `);
  
  // Create a continue button that will trigger rewards and quest completion
  const actionsContainer = document.getElementById('questActions');
  if (actionsContainer) {
    actionsContainer.innerHTML = '';
    
    const continueButton = document.createElement('button');
    continueButton.className = 'quest-action-btn';
    continueButton.textContent = 'Collect Rewards';
    continueButton.onclick = function() {
      // Complete the quest, which will trigger our enhanced reward system
      window.completeQuest(quest.id);
    };
    
    actionsContainer.appendChild(continueButton);
  } else {
    // If actions container isn't available, complete quest directly
    setTimeout(() => {
      window.completeQuest(quest.id);
    }, 2000);
  }
};