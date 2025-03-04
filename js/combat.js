// COMBAT SYSTEM MODULE
// Implements an event-based approach to combat mechanics

// Create the combat system namespace
window.CombatSystem = (function() {
  // Private state
  let _inBattle = false;
  let _currentEnemy = null;
  let _originalEndCombatFunction = null;
  let _missionCombatCallback = null;
  
  // Internal event system
  const _events = {};
  
  // List of all combat-related UI elements to ensure proper cleanup
  const _combatUIElements = [
    'distanceContainer',
    'stanceContainer',
    'environmentContainer',
    'momentumContainer',
    'combatActions',
    'combatLog',
    'staminaContainer' // Added staminaContainer to the cleanup list
  ];
  
  // Private methods
  const _resetCombatState = function() {
    // Reset all combat-related state
    window.GameState.set('inBattle', false);
    window.GameState.set('currentEnemy', null);
    window.GameState.set('combatPhase', 'neutral');
    window.GameState.set('combatDistance', 2);
    window.GameState.set('combatStance', 'neutral');
    window.GameState.set('enemyStance', 'neutral');
    window.GameState.set('initiativeOrder', []);
    window.GameState.set('currentInitiative', 0);
    window.GameState.set('playerQueuedAction', null);
    window.GameState.set('enemyQueuedAction', null);
    window.GameState.set('counterAttackAvailable', false);
    window.GameState.set('playerMomentum', 0);
    window.GameState.set('enemyMomentum', 0);
    window.GameState.set('consecutiveHits', 0);
    window.GameState.set('perfectParries', 0);
    window.GameState.set('dodgeCount', 0);
    window.GameState.set('playerStaggered', false);
    window.GameState.set('playerInjuries', []);
    
    // If we saved the original weather during combat, restore it
    if (window.GameState.get('originalWeather')) {
      window.GameState.set('weather', window.GameState.get('originalWeather'));
      window.GameState.set('originalWeather', null);
    }
    
    // Reset mission combat state if needed
    if (window.GameState.get('inMissionCombat')) {
      window.GameState.set('inMissionCombat', false);
    }
    
    _inBattle = false;
    _currentEnemy = null;
  };

  // Public API
  const api = {
    // Initialize the combat system
    init: function() {
      console.log("Initializing enhanced combat system...");
      
      // Subscribe to state changes that affect combat
      window.GameState.subscribe(function(property, value, oldValue) {
        if (property === 'combatDistance') {
          if (window.UI && window.UI.combat) {
            window.UI.combat.updateDistanceIndicator();
          }
        } else if (property === 'combatStance' || property === 'enemyStance') {
          if (window.UI && window.UI.combat) {
            window.UI.combat.updateStanceIndicator();
          }
        } else if (property === 'playerMomentum' || property === 'enemyMomentum') {
          if (window.UI && window.UI.combat) {
            window.UI.combat.updateMomentumIndicator();
          }
        }
      });
      
      console.log("Combat system initialized with mission continuation enhancements!");
    },
    
    // Event system methods
    on: function(event, callback) {
      if (!_events[event]) {
        _events[event] = [];
      }
      _events[event].push(callback);
      return _events[event].length - 1; // Return index for potential removal
    },
    
    off: function(event, index) {
      if (!_events[event] || index === undefined) return;
      _events[event].splice(index, 1);
    },
    
    trigger: function(event, data) {
      if (!_events[event]) return;
      
      for (let callback of _events[event]) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      }
    },
    
    // Core combat methods
    startCombat: function(enemyType, environment = null) {
      // Make sure we're not already in combat
      if (_inBattle) {
        console.warn("Attempted to start combat while already in battle");
        return;
      }
      
      console.log("Starting combat with enemy:", enemyType);
      
      // Clean up any previous combat state
      this.cleanupCombatUI();
      
      // Get enemy from database
      const enemy = this.getEnemyByType(enemyType);
      if (!enemy) {
        console.error("Enemy type not found:", enemyType);
        return;
      }
      
      // Setup combat environment
      if (!environment) {
        environment = this.generateCombatEnvironment();
      }
      
      // Save original weather
      window.GameState.set('originalWeather', window.GameState.get('weather'));
      
      // Set initial combat state
      _inBattle = true;
      _currentEnemy = enemy;
      window.GameState.set('inBattle', true);
      window.GameState.set('currentEnemy', enemy);
      window.GameState.set('combatPhase', 'preparation');
      window.GameState.set('combatDistance', 2); // Start at far distance
      window.GameState.set('combatStance', 'neutral');
      window.GameState.set('enemyStance', 'neutral');
      window.GameState.set('playerMomentum', 0);
      window.GameState.set('enemyMomentum', 0);
      
      // Determine initiative
      this.rollInitiative();
      
      // Log start of combat
      console.log("Starting combat with", enemy.name, "in", environment.terrain, "terrain,", environment.weather, "weather");
      
      // Setup the UI
      if (window.UI && window.UI.combat) {
        window.UI.combat.setup(enemy, environment);
      }
      
      // Update available combat actions
      this.updateCombatActions();
      
      // Trigger combat start event
      this.trigger('combatStart', { enemy, environment });
    },
    
    // Enhanced endCombat function (FIX APPLIED HERE)
    endCombat: function(result) {
      // Ensure we're in combat
      if (!_inBattle) {
        console.warn("Attempted to end combat when not in battle");
        return;
      }
      
      console.log("Enhanced endCombat called with:", result);
      
      // Special handling for mission combat
      const inMissionCombat = window.GameState.get('inMissionCombat');
      
      // Clean up the combat UI elements immediately
      this.cleanupCombatUI();
      
      // Handle the result
      try {
        switch(result) {
          case 'victory':
            this.handleVictory();
            break;
          case 'defeat':
            this.handleDefeat();
            break;
          case 'retreat':
            this.handleRetreat();
            break;
          default:
            console.warn("Unknown combat result:", result);
        }
      } catch (error) {
        console.error("Error handling combat result:", error);
      }
      
      // Trigger the combat end event
      this.trigger('combatEnd', { result, enemy: _currentEnemy });
      
      // Reset the combat state
      _resetCombatState();
      
      // Always ensure these key UI elements are restored
      const narrativeContainer = document.getElementById('narrative-container');
      const statusBars = document.querySelector('.status-bars');
      const actionsContainer = document.getElementById('actions');
      
      if (narrativeContainer) narrativeContainer.style.display = 'block';
      if (statusBars) statusBars.style.display = 'flex';
      if (actionsContainer) actionsContainer.style.display = 'flex';
      
      // Double check mission state for consistency
      if (inMissionCombat) {
        // If we were in mission combat, we need to manually call the continuation function
        console.log("Mission combat detected, triggering continuation");
        
        setTimeout(function() {
          // Attempt to continue the mission
          if (window.MissionSystem && typeof window.MissionSystem.continueMissionAfterCombat === 'function') {
            try {
              console.log("Calling mission continuation with result:", result);
              window.MissionSystem.continueMissionAfterCombat(result);
            } catch (error) {
              console.error("Error continuing mission after combat:", error);
              
              // If continuation fails, trigger emergency cleanup
              if (typeof window.fixMissionCombatState === 'function') {
                window.fixMissionCombatState();
              }
            }
          } else if (_missionCombatCallback) {
            // Try the stored callback
            try {
              console.log("Calling stored mission combat callback");
              _missionCombatCallback(result);
              _missionCombatCallback = null;
            } catch (error) {
              console.error("Error in mission combat callback:", error);
            }
          } else {
            console.warn("No mission continuation function found!");
            
            // Reset mission combat flag at minimum
            window.GameState.set('inMissionCombat', false);
          }
        }, 100);
      }
      
      // Ensure action buttons are visible and updated
      setTimeout(function() {
        if (actionsContainer) {
          actionsContainer.style.display = 'flex';
          
          // Force update action buttons if needed
          if (actionsContainer.children.length === 0) {
            console.log("No action buttons found, forcing update");
            
            if (window.UI && typeof window.UI.updateActionButtons === 'function') {
              window.UI.updateActionButtons();
            } else if (typeof window.updateActionButtons === 'function') {
              window.updateActionButtons();
            }
          }
        }
      }, 300);
      
      // Update UI after ending combat
      if (window.UI) {
        window.UI.updateStatusBars();
        window.UI.updateActionButtons();
      }
    },
    
    // Enhanced cleanup combat UI (FIX APPLIED HERE)
    cleanupCombatUI: function() {
      console.log("Enhanced cleanupCombatUI called");
      
      // First clean up the combat containers
      const combatContainers = [
        'distanceContainer', 'stanceContainer', 'environmentContainer',
        'momentumContainer', 'combatActions', 'combatLog', 'staminaContainer'
      ];
      
      // Remove all combat UI elements
      combatContainers.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          console.log(`Removing combat element: ${id}`);
          element.remove();
        }
      });
      
      // Hide combat interface
      const combatInterface = document.getElementById('combatInterface');
      if (combatInterface) {
        combatInterface.classList.add('hidden');
        combatInterface.classList.remove('combat-fullscreen');
      }
      
      // Restore other UI elements
      const elementsToRestore = [
        { id: 'narrative-container', style: 'block' },
        { selector: '.status-bars', style: 'flex' },
        { id: 'location', style: 'block' },
        { id: 'timeDisplay', style: 'block' },
        { id: 'dayDisplay', style: 'block' },
        { id: 'dayNightIndicator', style: 'block' },
        { id: 'actions', style: 'flex' }
      ];
      
      elementsToRestore.forEach(item => {
        const element = item.id 
          ? document.getElementById(item.id) 
          : document.querySelector(item.selector);
          
        if (element) {
          element.style.display = item.style;
        }
      });
    },
    
    handleVictory: function() {
      // Add experience
      const expGain = _currentEnemy.expValue || 25;
      window.GameState.set('experience', window.GameState.get('experience') + expGain);
      
      // Check for level up
      window.GameState.checkLevelUp();
      
      // Award loot
      if (_currentEnemy.loot) {
        this.handleLoot(_currentEnemy.loot);
      }
      
      // Add to narrative
      if (window.UI) {
        window.UI.setNarrative(`You have defeated the ${_currentEnemy.name}! You gain ${expGain} experience.`);
      }
      
      // Check for first victory achievement
      if (!window.GameState.get('combatVictoryAchieved')) {
        window.GameState.set('combatVictoryAchieved', true);
        window.GameState.updateAchievementProgress('first_blood');
      }
      
      // Update various achievement counters
      window.GameState.updateAchievementProgress('combat_mastery');
      
      if (_currentEnemy.type && _currentEnemy.type === 'arrasi') {
        window.GameState.updateAchievementProgress('arrasi_hunter');
      }
    },
    
    handleDefeat: function() {
      // Handle player defeat (non-fatal)
      const healthReduction = Math.floor(window.GameState.get('maxHealth') * 0.5);
      const staminaReduction = Math.floor(window.GameState.get('maxStamina') * 0.5);
      
      // Set health and stamina to reduced values
      window.GameState.set('health', Math.max(1, window.GameState.get('maxHealth') - healthReduction));
      window.GameState.set('stamina', Math.max(0, window.GameState.get('maxStamina') - staminaReduction));
      
      // Add to narrative
      if (window.UI) {
        window.UI.setNarrative(`You have been defeated by the ${_currentEnemy.name} and wake up later, injured and exhausted.`);
      }
      
      // Add time (unconscious for 2 hours)
      window.updateTimeAndDay(120);
      
      // Reduce morale
      window.GameState.set('morale', Math.max(0, window.GameState.get('morale') - 10));
    },
    
    handleRetreat: function() {
      // Handle player retreat
      // Lose some stamina from running
      const staminaLoss = Math.floor(window.GameState.get('maxStamina') * 0.3);
      window.GameState.set('stamina', Math.max(0, window.GameState.get('stamina') - staminaLoss));
      
      // Add to narrative
      if (window.UI) {
        window.UI.setNarrative(`You have retreated from the ${_currentEnemy.name}, escaping mostly unharmed but exhausted from running.`);
      }
      
      // Add some time (30 minutes of running/recovery)
      window.updateTimeAndDay(30);
    },
    
    handleLoot: function(loot) {
      if (!loot) return;
      
      let lootText = "You search the defeated enemy and find:";
      
      // Handle various loot types
      if (loot.taelors) {
        const taelorAmount = typeof loot.taelors === 'number' ? loot.taelors : Math.floor(Math.random() * (loot.taelors.max - loot.taelors.min + 1)) + loot.taelors.min;
        window.Player.set('taelors', window.Player.get('taelors') + taelorAmount);
        lootText += `\n- ${taelorAmount} taelors`;
      }
      
      if (loot.items && loot.items.length > 0) {
        for (const item of loot.items) {
          // Check if item should be added based on chance
          if (item.chance && Math.random() > item.chance) continue;
          
          // Add item to inventory
          window.Player.addItem({
            name: item.name,
            effect: item.effect || "No special effects",
            value: item.value || 0
          });
          
          lootText += `\n- ${item.name}`;
        }
      }
      
      // Add loot narrative
      if (window.UI) {
        window.UI.addToNarrative(lootText);
      }
    },
    
    rollInitiative: function() {
      // Calculate player's initiative score
      const player = 'player';
      const enemy = 'enemy';
      
      const playerInitiativeBase = 10;
      const playerSkillBonus = (window.Player.get('skills.tactics') || 0) * 0.5;
      const playerAttributeBonus = (window.Player.get('men') || 0) * 0.3;
      const playerInitRoll = Math.floor(Math.random() * 6) + 1;
      
      const playerInit = playerInitiativeBase + playerSkillBonus + playerAttributeBonus + playerInitRoll;
      
      // Calculate enemy initiative
      const enemyInit = _currentEnemy.initiative + Math.floor(Math.random() * 6) + 1;
      
      // Determine order
      const initiativeOrder = playerInit >= enemyInit ? [player, enemy] : [enemy, player];
      
      window.GameState.set('initiativeOrder', initiativeOrder);
      window.GameState.set('currentInitiative', 0);
      
      return initiativeOrder;
    },
    
    updateCombatActions: function() {
      // Get the combat actions container
      const actionsContainer = document.getElementById('combatActions');
      if (!actionsContainer) {
        console.warn("Combat actions container not found");
        return;
      }
      
      // Clear previous actions
      actionsContainer.innerHTML = '';
      
      // Get current combat state
      const distance = window.GameState.get('combatDistance');
      const playerStance = window.GameState.get('combatStance');
      const playerStamina = window.GameState.get('stamina');
      
      // Basic actions always available
      this.addCombatAction('advance', 'Advance', actionsContainer);
      this.addCombatAction('retreat', 'Retreat', actionsContainer);
      
      // Actions based on distance
      if (distance === 0) { // Close range
        this.addCombatAction('attack', 'Attack', actionsContainer);
        this.addCombatAction('grapple', 'Grapple', actionsContainer);
        this.addCombatAction('defend', 'Defend', actionsContainer);
        this.addCombatAction('dodge', 'Dodge', actionsContainer);
      } else if (distance === 1) { // Medium range
        this.addCombatAction('attack', 'Attack', actionsContainer);
        this.addCombatAction('defend', 'Defend', actionsContainer);
        this.addCombatAction('dodge', 'Dodge', actionsContainer);
        
        // If player has ranged weapon
        if (this.playerHasRangedWeapon()) {
          this.addCombatAction('aim', 'Aim', actionsContainer);
          this.addCombatAction('shoot', 'Shoot', actionsContainer);
        }
      } else { // Far range
        // Only ranged options at far range
        if (this.playerHasRangedWeapon()) {
          this.addCombatAction('aim', 'Aim', actionsContainer);
          this.addCombatAction('shoot', 'Shoot', actionsContainer);
        }
        
        // Can observe enemy
        this.addCombatAction('observe', 'Observe', actionsContainer);
      }
      
      // Stance change options
      if (playerStance !== 'aggressive') {
        this.addCombatAction('stance_aggressive', 'Aggressive Stance', actionsContainer);
      }
      
      if (playerStance !== 'defensive') {
        this.addCombatAction('stance_defensive', 'Defensive Stance', actionsContainer);
      }
      
      if (playerStance !== 'evasive') {
        this.addCombatAction('stance_evasive', 'Evasive Stance', actionsContainer);
      }
      
      if (playerStance !== 'neutral') {
        this.addCombatAction('stance_neutral', 'Neutral Stance', actionsContainer);
      }
      
      // Special actions based on player skills
      if (playerStamina >= 10 && window.Player.get('skills.tactics') >= 2) {
        this.addCombatAction('feint', 'Feint', actionsContainer);
      }
      
      // Add rest action to recover stamina
      this.addCombatAction('rest_combat', '💤 Rest', actionsContainer);
      
      // Retreat from battle option
      this.addCombatAction('retreat_combat', 'Retreat from Battle', actionsContainer);
    },
    
    addCombatAction: function(action, label, container) {
      if (!container) {
        console.warn("Container not provided when adding combat action");
        return;
      }
      
      // Check if action should be disabled based on stamina
      let disabled = false;
      const staminaCost = window.GameState.get('staminaPerAction')[action] || 0;
      
      if (staminaCost > window.GameState.get('stamina')) {
        disabled = true;
      }
      
      const btn = document.createElement('button');
      btn.className = 'action-btn' + (disabled ? ' stamina-disabled' : '');
      btn.textContent = label;
      
      // Add stamina cost indicator if applicable
      if (staminaCost > 0) {
        const costSpan = document.createElement('span');
        costSpan.className = 'stamina-cost';
        costSpan.textContent = `-${staminaCost}`;
        btn.appendChild(costSpan);
      }
      
      btn.setAttribute('data-action', action);
      
      if (!disabled) {
        btn.onclick = () => this.handleCombatAction(action);
      } else {
        // Show tooltip explaining why button is disabled
        btn.title = `Not enough stamina (Requires ${staminaCost})`;
      }
      
      container.appendChild(btn);
    },
    
    // Combat Action Handlers
    handleCombatAction: function(action) {
      console.log("Player chose combat action:", action);
      
      // Special handling for rest_combat
      if (action === 'rest_combat') {
        this.performCombatRest();
        return;
      }
      
      // Get the current combat state
      const staminaCost = window.GameState.get('staminaPerAction')[action] || 0;
      
      // Deduct stamina if applicable
      if (staminaCost > 0) {
        window.GameState.set('stamina', window.GameState.get('stamina') - staminaCost);
        this.updateStaminaDisplay();
      }
      
      // Handle stance changes separately
      if (action.startsWith('stance_')) {
        const stance = action.replace('stance_', '');
        window.GameState.set('combatStance', stance);
        
        const combatLog = document.getElementById('combatLog');
        if (combatLog) {
          combatLog.innerHTML += `<p>You switch to a ${stance} stance.</p>`;
          combatLog.scrollTop = combatLog.scrollHeight;
        }
        
        // Update available actions after stance change
        this.updateCombatActions();
        return;
      }
      
      // Handle retreat from combat separately
      if (action === 'retreat_combat') {
        this.attemptRetreat();
        return;
      }
      
      // Process normal combat actions
      switch(action) {
        case 'attack':
          this.performAttack();
          break;
        case 'defend':
          this.performDefend();
          break;
        case 'dodge':
          this.performDodge();
          break;
        case 'advance':
          this.performAdvance();
          break;
        case 'retreat':
          this.performRetreat();
          break;
        case 'aim':
          this.performAim();
          break;
        case 'shoot':
          this.performShoot();
          break;
        case 'grapple':
          this.performGrapple();
          break;
        case 'observe':
          this.performObserve();
          break;
        case 'feint':
          this.performFeint();
          break;
        default:
          console.warn("Unknown combat action:", action);
      }
      
      // Update UI and process enemy turn
      this.updateCombatActions();
      this.processEnemyTurn();
    },
    
    // New function to handle combat rest
    performCombatRest: function() {
      // Gain stamina
      const staminaGain = 15;
      window.GameState.set('stamina', Math.min(
        window.GameState.get('maxStamina'),
        window.GameState.get('stamina') + staminaGain
      ));
      
      // Update stamina display
      this.updateStaminaDisplay();
      
      // Add to combat log
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You take a moment to catch your breath, regaining ${staminaGain} stamina.</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Process enemy turn after rest
      setTimeout(() => {
        this.processEnemyTurn();
      }, 1000);
    },
    
    // Update stamina display in combat
    updateStaminaDisplay: function() {
      const playerStaminaValue = document.getElementById('playerCombatStaminaValue');
      if (playerStaminaValue) {
        const stamina = window.GameState.get('stamina');
        playerStaminaValue.textContent = Math.round(stamina);
        
        // Change color based on stamina level
        if (stamina < 10) {
          playerStaminaValue.className = 'stamina-low';
        } else if (stamina < 20) {
          playerStaminaValue.className = 'stamina-medium';
        } else {
          playerStaminaValue.className = 'stamina-high';
        }
      }
    },
    
    // Add stamina indicator to combat UI
    addStaminaIndicator: function() {
      // Check if it already exists to avoid duplicates
      if (document.getElementById('staminaContainer')) {
        return;
      }
      
      const combatInterface = document.getElementById('combatInterface');
      if (!combatInterface) {
        console.warn("Combat interface not found when adding stamina indicator");
        return;
      }
      
      // Find a good location - after momentum or before actions
      const insertBeforeElement = document.getElementById('combatActions');
      
      const staminaContainer = document.createElement('div');
      staminaContainer.id = 'staminaContainer';
      staminaContainer.style.width = '100%';
      staminaContainer.style.display = 'flex';
      staminaContainer.style.justifyContent = 'space-between';
      staminaContainer.style.alignItems = 'center';
      staminaContainer.style.margin = '10px 0';
      
      // Player stamina
      const playerStaminaDiv = document.createElement('div');
      playerStaminaDiv.style.width = '45%';
      
      const playerStaminaLabel = document.createElement('div');
      playerStaminaLabel.textContent = 'Your Stamina:';
      
      const playerStaminaValue = document.createElement('div');
      playerStaminaValue.id = 'playerCombatStaminaValue';
      playerStaminaValue.className = 'stamina-high';
      playerStaminaValue.textContent = window.GameState.get('stamina');
      
      playerStaminaDiv.appendChild(playerStaminaLabel);
      playerStaminaDiv.appendChild(playerStaminaValue);
      
      // Stamina regen indicator
      const staminaRegenDiv = document.createElement('div');
      staminaRegenDiv.style.width = '45%';
      staminaRegenDiv.style.textAlign = 'right';
      
      const staminaRegenLabel = document.createElement('div');
      staminaRegenLabel.textContent = 'Regen Per Turn:';
      
      const staminaRegenValue = document.createElement('div');
      staminaRegenValue.id = 'staminaRegenValue';
      staminaRegenValue.style.fontWeight = 'bold';
      staminaRegenValue.textContent = '+3';
      
      staminaRegenDiv.appendChild(staminaRegenLabel);
      staminaRegenDiv.appendChild(staminaRegenValue);
      
      staminaContainer.appendChild(playerStaminaDiv);
      staminaContainer.appendChild(staminaRegenDiv);
      
      // Insert before combat actions
      if (insertBeforeElement) {
        combatInterface.insertBefore(staminaContainer, insertBeforeElement);
      } else {
        combatInterface.appendChild(staminaContainer);
      }
      
      // Update stamina display
      this.updateStaminaDisplay();
    },
    
    // Enhanced version of attemptRetreat
    attemptRetreat: function() {
      console.log("Player attempting retreat from combat");
      
      // Calculate retreat success chance
      const playerDexterity = (window.Player.get('phy') || 0) * 0.5;
      const enemySpeed = _currentEnemy.speed || 5;
      const distanceBonus = window.GameState.get('combatDistance') * 15;
      const staminaPenalty = Math.max(0, (window.GameState.get('maxStamina') - window.GameState.get('stamina')) / 10);
      
      let retreatChance = 50 + playerDexterity - enemySpeed + distanceBonus - staminaPenalty;
      
      // Evasive stance helps with retreat
      if (window.GameState.get('combatStance') === 'evasive') {
        retreatChance += 20;
      }
      
      // Clamp chance between 5% and 95%
      retreatChance = Math.min(95, Math.max(5, retreatChance));
      
      // Roll for retreat success
      const roll = Math.random() * 100;
      
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You attempt to retreat from combat...</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Add a slight delay before showing the result
      setTimeout(() => {
        if (roll <= retreatChance) {
          // Success
          if (combatLog) {
            combatLog.innerHTML += `<p>Success! You manage to escape from the ${_currentEnemy.name}.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // Wait a moment before ending combat
          setTimeout(() => {
            this.endCombat('retreat');
          }, 1500);
        } else {
          // Failure
          if (combatLog) {
            combatLog.innerHTML += `<p>Failed! The ${_currentEnemy.name} prevents your escape.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // Enemy gets a free attack opportunity
          setTimeout(() => {
            this.processEnemyAttack("opportunity");
            this.updateCombatActions();
          }, 1000);
        }
      }, 1000);
    },
    
    performAttack: function() {
      // Get combat state
      const playerStance = window.GameState.get('combatStance');
      const enemyStance = window.GameState.get('enemyStance');
      const playerSkill = window.Player.get('skills.melee') || 0;
      const enemyDefense = _currentEnemy.defense || 5;
      const playerMomentum = window.GameState.get('playerMomentum');
      
      // Calculate hit chance
      let hitChance = 60 + playerSkill * 3 - enemyDefense * 2 + playerMomentum * 5;
      
      // Adjust based on stances
      if (playerStance === 'aggressive') {
        hitChance += 15;
      } else if (playerStance === 'defensive') {
        hitChance -= 5;
      }
      
      if (enemyStance === 'defensive') {
        hitChance -= 15;
      } else if (enemyStance === 'evasive') {
        hitChance -= 20;
      }
      
      // Clamp hit chance
      hitChance = Math.min(95, Math.max(5, hitChance));
      
      // Roll for hit
      const roll = Math.random() * 100;
      
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You attack the ${_currentEnemy.name}...</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      setTimeout(() => {
        if (roll <= hitChance) {
          // Hit success
          this.resolveSuccessfulAttack();
        } else {
          // Miss
          if (combatLog) {
            combatLog.innerHTML += `<p>Miss! Your attack fails to connect.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // Lose momentum after miss
          window.GameState.set('playerMomentum', Math.max(-5, window.GameState.get('playerMomentum') - 1));
          window.GameState.set('consecutiveHits', 0);
        }
      }, 1000);
    },
    
    resolveSuccessfulAttack: function() {
      // Calculate damage
      const playerSkill = window.Player.get('skills.melee') || 0;
      const playerStrength = window.Player.get('phy') || 0;
      const baseDamage = 3 + playerSkill * 0.5 + playerStrength * 0.7;
      const momentum = window.GameState.get('playerMomentum');
      const momentumBonus = momentum > 0 ? momentum : 0;
      
      let damage = baseDamage + momentumBonus;
      
      // Aggressive stance increases damage
      if (window.GameState.get('combatStance') === 'aggressive') {
        damage *= 1.3;
      }
      
      // Enemy defensive stance reduces damage
      if (window.GameState.get('enemyStance') === 'defensive') {
        damage *= 0.7;
      }
      
      // Critical hit chance
      const critChance = 5 + playerSkill * 0.5 + (window.GameState.get('consecutiveHits') * 3);
      const critRoll = Math.random() * 100;
      
      let isCritical = false;
      if (critRoll <= critChance) {
        isCritical = true;
        damage *= 1.5;
      }
      
      // Apply final damage
      damage = Math.round(damage);
      _currentEnemy.health -= damage;
      
      // Update enemy health display
      const enemyHealthDisplay = document.getElementById('enemyHealthDisplay');
      const enemyCombatHealth = document.getElementById('enemyCombatHealth');
      
      if (enemyHealthDisplay) {
        enemyHealthDisplay.textContent = `${Math.max(0, _currentEnemy.health)} HP`;
      }
      
      if (enemyCombatHealth) {
        const healthPercent = Math.max(0, (_currentEnemy.health / _currentEnemy.maxHealth) * 100);
        enemyCombatHealth.style.width = `${healthPercent}%`;
      }
      
      // Update combat log
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        if (isCritical) {
          combatLog.innerHTML += `<p><span class="critical-hit">Critical hit!</span> You land a powerful blow on the ${_currentEnemy.name} for ${damage} damage!</p>`;
        } else {
          combatLog.innerHTML += `<p>Hit! You strike the ${_currentEnemy.name} for ${damage} damage.</p>`;
        }
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Update momentum and consecutive hits
      window.GameState.set('playerMomentum', Math.min(5, window.GameState.get('playerMomentum') + 1));
      window.GameState.set('enemyMomentum', Math.max(-5, window.GameState.get('enemyMomentum') - 1));
      window.GameState.set('consecutiveHits', window.GameState.get('consecutiveHits') + 1);
      
      // Check for enemy defeat
      if (_currentEnemy.health <= 0) {
        setTimeout(() => {
          if (combatLog) {
            combatLog.innerHTML += `<p>Victory! You have defeated the ${_currentEnemy.name}!</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // End combat with victory
          setTimeout(() => {
            this.endCombat('victory');
          }, 1500);
        }, 1000);
      }
    },
    
    performDefend: function() {
      // Set player to defensive stance
      window.GameState.set('combatStance', 'defensive');
      
      // Gain a small defensive bonus
      window.GameState.set('playerDefenseBonus', (window.GameState.get('playerDefenseBonus') || 0) + 2);
      
      // Log the action
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You take a defensive position, preparing to block or counter attacks.</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Slightly recover stamina
      const staminaGain = 2 + (window.Player.get('skills.discipline') || 0) * 0.5;
      window.GameState.set('stamina', Math.min(
        window.GameState.get('maxStamina'),
        window.GameState.get('stamina') + staminaGain
      ));
      
      // Update stamina display
      this.updateStaminaDisplay();
    },
    
    performDodge: function() {
      // Set player to evasive stance
      window.GameState.set('combatStance', 'evasive');
      
      // Gain an evasion bonus
      window.GameState.set('playerEvasionBonus', (window.GameState.get('playerEvasionBonus') || 0) + 3);
      
      // Log the action
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You focus on evasive movements, making yourself harder to hit.</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Increment dodge count for achievements
      window.GameState.set('dodgeCount', window.GameState.get('dodgeCount') + 1);
    },
    
    performAdvance: function() {
      // Check current distance
      const currentDistance = window.GameState.get('combatDistance');
      
      if (currentDistance > 0) {
        // Reduce distance
        window.GameState.set('combatDistance', currentDistance - 1);
        
        // Log the action
        const combatLog = document.getElementById('combatLog');
        if (combatLog) {
          const newDistance = this.getDistanceText(currentDistance - 1);
          combatLog.innerHTML += `<p>You advance toward the ${_currentEnemy.name}, closing to ${newDistance} range.</p>`;
          combatLog.scrollTop = combatLog.scrollHeight;
        }
        
        // Gain momentum if advancing aggressively
        if (window.GameState.get('combatStance') === 'aggressive') {
          window.GameState.set('playerMomentum', Math.min(5, window.GameState.get('playerMomentum') + 1));
        }
      } else {
        // Already at closest range
        const combatLog = document.getElementById('combatLog');
        if (combatLog) {
          combatLog.innerHTML += `<p>You are already at close range with the ${_currentEnemy.name}.</p>`;
          combatLog.scrollTop = combatLog.scrollHeight;
        }
      }
    },
    
    performRetreat: function() {
      // Check current distance
      const currentDistance = window.GameState.get('combatDistance');
      
      if (currentDistance < 2) {
        // Increase distance
        window.GameState.set('combatDistance', currentDistance + 1);
        
        // Log the action
        const combatLog = document.getElementById('combatLog');
        if (combatLog) {
          const newDistance = this.getDistanceText(currentDistance + 1);
          combatLog.innerHTML += `<p>You retreat from the ${_currentEnemy.name}, moving to ${newDistance} range.</p>`;
          combatLog.scrollTop = combatLog.scrollHeight;
        }
        
        // Potentially lose momentum when retreating
        if (window.GameState.get('combatStance') !== 'evasive') {
          window.GameState.set('playerMomentum', Math.max(-5, window.GameState.get('playerMomentum') - 1));
        }
      } else {
        // Already at furthest range
        const combatLog = document.getElementById('combatLog');
        if (combatLog) {
          combatLog.innerHTML += `<p>You are already at far range from the ${_currentEnemy.name}.</p>`;
          combatLog.scrollTop = combatLog.scrollHeight;
        }
      }
    },
    
    getDistanceText: function(distance) {
      switch(distance) {
        case 0: return "close";
        case 1: return "medium";
        case 2: return "far";
        default: return "unknown";
      }
    },
    
    processEnemyTurn: function() {
      // Check if enemy is already defeated
      if (_currentEnemy.health <= 0) return;
      
      // Regenerate some stamina per turn
      const staminaRegen = 3;
      window.GameState.set('stamina', Math.min(
        window.GameState.get('maxStamina'), 
        window.GameState.get('stamina') + staminaRegen
      ));
      
      // Update stamina display
      this.updateStaminaDisplay();
      
      // Wait a moment before processing enemy action
      setTimeout(() => {
        const combatLog = document.getElementById('combatLog');
        if (combatLog) {
          combatLog.innerHTML += `<p>The ${_currentEnemy.name} prepares to act...</p>`;
          combatLog.scrollTop = combatLog.scrollHeight;
        }
        
        // Determine enemy action based on AI
        const enemyAction = this.determineEnemyAction();
        
        // Process the enemy action
        setTimeout(() => {
          this.processEnemyAction(enemyAction);
        }, 1000);
      }, 1500);
    },
    
    determineEnemyAction: function() {
      // Simple enemy AI
      const distance = window.GameState.get('combatDistance');
      const playerHealth = window.GameState.get('health');
      const playerMaxHealth = window.GameState.get('maxHealth');
      const enemyHealth = _currentEnemy.health;
      const enemyMaxHealth = _currentEnemy.maxHealth;
      
      // Calculate health percentages
      const playerHealthPercent = playerHealth / playerMaxHealth * 100;
      const enemyHealthPercent = enemyHealth / enemyMaxHealth * 100;
      
      // Enemy stance strategies
      if (enemyHealthPercent < 30 && window.GameState.get('enemyStance') !== 'defensive') {
        // Enemy is badly hurt, go defensive
        return 'stance_defensive';
      }
      
      if (playerHealthPercent < 30 && window.GameState.get('enemyStance') !== 'aggressive') {
        // Player is badly hurt, press the advantage
        return 'stance_aggressive';
      }
      
      // Distance strategies
      if (distance === 2) {
        // Enemy is at far distance
        if (_currentEnemy.hasRanged) {
          // If enemy has ranged weapons, use them
          return Math.random() < 0.5 ? 'shoot' : 'aim';
        } else {
          // Otherwise, try to close distance
          return 'advance';
        }
      } else if (distance === 1) {
        // Enemy is at medium distance
        if (_currentEnemy.preferredRange === 'close') {
          return 'advance';
        } else if (_currentEnemy.preferredRange === 'far' && _currentEnemy.hasRanged) {
          return 'retreat';
        } else {
          // Mix of attack and position changes
          const r = Math.random();
          if (r < 0.4) return 'attack';
          if (r < 0.6) return 'advance';
          if (r < 0.8) return 'retreat';
          return 'defend';
        }
      } else {
        // Enemy is at close distance
        if (_currentEnemy.preferredRange === 'far') {
          return 'retreat';
        } else {
          // Mostly attack at close range
          const r = Math.random();
          if (r < 0.7) return 'attack';
          if (r < 0.85) return 'defend';
          return 'dodge';
        }
      }
    },
    
    processEnemyAction: function(action) {
      // Get combat log
      const combatLog = document.getElementById('combatLog');
      
      // Handle stance changes separately
      if (action.startsWith('stance_')) {
        const stance = action.replace('stance_', '');
        window.GameState.set('enemyStance', stance);
        
        if (combatLog) {
          combatLog.innerHTML += `<p>The ${_currentEnemy.name} switches to a ${stance} stance.</p>`;
          combatLog.scrollTop = combatLog.scrollHeight;
        }
        
        return;
      }
      
      // Process normal actions
      switch(action) {
        case 'attack':
          this.processEnemyAttack();
          break;
        case 'defend':
          if (combatLog) {
            combatLog.innerHTML += `<p>The ${_currentEnemy.name} takes a defensive position.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          window.GameState.set('enemyStance', 'defensive');
          break;
        case 'dodge':
          if (combatLog) {
            combatLog.innerHTML += `<p>The ${_currentEnemy.name} becomes more evasive.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          window.GameState.set('enemyStance', 'evasive');
          break;
        case 'advance':
          const currentDistance = window.GameState.get('combatDistance');
          if (currentDistance > 0) {
            window.GameState.set('combatDistance', currentDistance - 1);
            
            if (combatLog) {
              const newDistance = this.getDistanceText(currentDistance - 1);
              combatLog.innerHTML += `<p>The ${_currentEnemy.name} advances toward you, closing to ${newDistance} range.</p>`;
              combatLog.scrollTop = combatLog.scrollHeight;
            }
            
            // Gain momentum if advancing aggressively
            if (window.GameState.get('enemyStance') === 'aggressive') {
              window.GameState.set('enemyMomentum', Math.min(5, window.GameState.get('enemyMomentum') + 1));
            }
          } else {
            if (combatLog) {
              combatLog.innerHTML += `<p>The ${_currentEnemy.name} is already at close range with you.</p>`;
              combatLog.scrollTop = combatLog.scrollHeight;
            }
          }
          break;
        case 'retreat':
          const distanceCurrent = window.GameState.get('combatDistance');
          if (distanceCurrent < 2) {
            window.GameState.set('combatDistance', distanceCurrent + 1);
            
            if (combatLog) {
              const newDistance = this.getDistanceText(distanceCurrent + 1);
              combatLog.innerHTML += `<p>The ${_currentEnemy.name} retreats from you, moving to ${newDistance} range.</p>`;
              combatLog.scrollTop = combatLog.scrollHeight;
            }
          } else {
            if (combatLog) {
              combatLog.innerHTML += `<p>The ${_currentEnemy.name} is already at far range from you.</p>`;
              combatLog.scrollTop = combatLog.scrollHeight;
            }
          }
          break;
        default:
          if (combatLog) {
            combatLog.innerHTML += `<p>The ${_currentEnemy.name} observes you carefully.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
      }
      
      // Update combat UI after enemy action
      this.updateCombatActions();
    },
    
    processEnemyAttack: function(type = "normal") {
      // Get combat state
      const playerStance = window.GameState.get('combatStance');
      const enemyStance = window.GameState.get('enemyStance');
      const enemySkill = _currentEnemy.skill || 5;
      const playerDefense = (window.Player.get('skills.melee') || 0) * 0.5;
      const playerEvasion = (window.Player.get('phy') || 0) * 0.3;
      const enemyMomentum = window.GameState.get('enemyMomentum');
      
      // Calculate hit chance
      let hitChance = 60 + enemySkill * 3 - playerDefense * 2 - playerEvasion + enemyMomentum * 5;
      
      // Adjust based on stances
      if (enemyStance === 'aggressive') {
        hitChance += 15;
      } else if (enemyStance === 'defensive') {
        hitChance -= 5;
      }
      
      if (playerStance === 'defensive') {
        hitChance -= 15;
      } else if (playerStance === 'evasive') {
        hitChance -= 20;
      }
      
      // Add bonus for opportunity attacks
      if (type === "opportunity") {
        hitChance += 10;
      }
      
      // Apply player defense bonus if any
      if (window.GameState.get('playerDefenseBonus')) {
        hitChance -= window.GameState.get('playerDefenseBonus');
        window.GameState.set('playerDefenseBonus', 0); // Reset bonus after use
      }
      
      // Apply player evasion bonus if any
      if (window.GameState.get('playerEvasionBonus')) {
        hitChance -= window.GameState.get('playerEvasionBonus');
        window.GameState.set('playerEvasionBonus', 0); // Reset bonus after use
      }
      
      // Clamp hit chance
      hitChance = Math.min(95, Math.max(5, hitChance));
      
      // Roll for hit
      const roll = Math.random() * 100;
      
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        if (type === "opportunity") {
          combatLog.innerHTML += `<p>The ${_currentEnemy.name} takes advantage of your failed retreat with an attack...</p>`;
        } else {
          combatLog.innerHTML += `<p>The ${_currentEnemy.name} attacks you...</p>`;
        }
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      setTimeout(() => {
        if (roll <= hitChance) {
          // Hit success
          this.resolveEnemySuccessfulAttack();
        } else {
          // Miss
          if (combatLog) {
            combatLog.innerHTML += `<p>Miss! The ${_currentEnemy.name}'s attack fails to connect.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // Enemy loses momentum after miss
          window.GameState.set('enemyMomentum', Math.max(-5, window.GameState.get('enemyMomentum') - 1));
          
          // Player gains a small momentum boost from successful dodge/block
          window.GameState.set('playerMomentum', Math.min(5, window.GameState.get('playerMomentum') + 0.5));
        }
      }, 1000);
    },
    
    resolveEnemySuccessfulAttack: function() {
      // Calculate damage
      const enemySkill = _currentEnemy.skill || 5;
      const enemyStrength = _currentEnemy.strength || 5;
      const baseDamage = 3 + enemySkill * 0.3 + enemyStrength * 0.5;
      const momentum = window.GameState.get('enemyMomentum');
      const momentumBonus = momentum > 0 ? momentum : 0;
      
      let damage = baseDamage + momentumBonus;
      
      // Aggressive stance increases damage
      if (window.GameState.get('enemyStance') === 'aggressive') {
        damage *= 1.3;
      }
      
      // Player defensive stance reduces damage
      if (window.GameState.get('combatStance') === 'defensive') {
        damage *= 0.7;
      }
      
      // Critical hit chance
      const critChance = 5 + _currentEnemy.skill * 0.3;
      const critRoll = Math.random() * 100;
      
      let isCritical = false;
      if (critRoll <= critChance) {
        isCritical = true;
        damage *= 1.5;
      }
      
      // Apply final damage
      damage = Math.round(damage);
      window.GameState.set('health', Math.max(0, window.GameState.get('health') - damage));
      
      // Update player health display
      const playerHealthDisplay = document.getElementById('playerHealthDisplay');
      const playerCombatHealth = document.getElementById('playerCombatHealth');
      
      if (playerHealthDisplay) {
        playerHealthDisplay.textContent = `${Math.max(0, window.GameState.get('health'))} HP`;
      }
      
      if (playerCombatHealth) {
        const healthPercent = Math.max(0, (window.GameState.get('health') / window.GameState.get('maxHealth')) * 100);
        playerCombatHealth.style.width = `${healthPercent}%`;
      }
      
      // Update combat log
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        if (isCritical) {
          combatLog.innerHTML += `<p><span class="critical-hit">Critical hit!</span> The ${_currentEnemy.name} lands a powerful blow on you for ${damage} damage!</p>`;
        } else {
          combatLog.innerHTML += `<p>Hit! The ${_currentEnemy.name} strikes you for ${damage} damage.</p>`;
        }
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Update momentum
      window.GameState.set('enemyMomentum', Math.min(5, window.GameState.get('enemyMomentum') + 1));
      window.GameState.set('playerMomentum', Math.max(-5, window.GameState.get('playerMomentum') - 1));
      
      // Check for player defeat
      if (window.GameState.get('health') <= 0) {
        setTimeout(() => {
          if (combatLog) {
            combatLog.innerHTML += `<p>Defeat! You have been overwhelmed by the ${_currentEnemy.name}!</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // End combat with defeat
          setTimeout(() => {
            this.endCombat('defeat');
          }, 1500);
        }, 1000);
      }
    },
    
    // Helper function to check if player has ranged weapon
    playerHasRangedWeapon: function() {
      // In a real implementation, this would check the player's inventory for a ranged weapon
      // For now, just return true if player has marksmanship skill
      return (window.Player.get('skills.marksmanship') || 0) > 0;
    },
    
    // Other action implementations for ranged combat, etc.
    performAim: function() {
      // Log the action
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You carefully aim at the ${_currentEnemy.name}, increasing your next shot's accuracy.</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Add an aim bonus
      window.GameState.set('aimBonus', (window.GameState.get('aimBonus') || 0) + 20);
    },
    
    performShoot: function() {
      // Get combat state
      const playerSkill = window.Player.get('skills.marksmanship') || 0;
      const enemyStance = window.GameState.get('enemyStance');
      const distance = window.GameState.get('combatDistance');
      
      // Calculate hit chance
      let hitChance = 50 + playerSkill * 3;
      
      // Distance affects accuracy
      if (distance === 1) { // Medium range
        hitChance += 10;
      } else if (distance === 0) { // Close range
        hitChance -= 10; // Harder to use ranged weapons at close range
      }
      
      // Enemy evasive stance makes them harder to hit
      if (enemyStance === 'evasive') {
        hitChance -= 15;
      }
      
      // Apply aim bonus if any
      if (window.GameState.get('aimBonus')) {
        hitChance += window.GameState.get('aimBonus');
        window.GameState.set('aimBonus', 0); // Reset bonus after use
      }
      
      // Clamp hit chance
      hitChance = Math.min(95, Math.max(5, hitChance));
      
      // Roll for hit
      const roll = Math.random() * 100;
      
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You shoot at the ${_currentEnemy.name}...</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      setTimeout(() => {
        if (roll <= hitChance) {
          // Calculate damage
          const baseDamage = 5 + playerSkill * 0.8;
          let damage = baseDamage;
          
          // Critical hit chance
          const critChance = 5 + playerSkill * 0.5;
          const critRoll = Math.random() * 100;
          
          let isCritical = false;
          if (critRoll <= critChance) {
            isCritical = true;
            damage *= 1.5;
          }
          
          // Apply final damage
          damage = Math.round(damage);
          _currentEnemy.health -= damage;
          
          // Update enemy health display
          const enemyHealthDisplay = document.getElementById('enemyHealthDisplay');
          const enemyCombatHealth = document.getElementById('enemyCombatHealth');
          
          if (enemyHealthDisplay) {
            enemyHealthDisplay.textContent = `${Math.max(0, _currentEnemy.health)} HP`;
          }
          
          if (enemyCombatHealth) {
            const healthPercent = Math.max(0, (_currentEnemy.health / _currentEnemy.maxHealth) * 100);
            enemyCombatHealth.style.width = `${healthPercent}%`;
          }
          
          // Update combat log
          if (combatLog) {
            if (isCritical) {
              combatLog.innerHTML += `<p><span class="critical-hit">Critical hit!</span> Your shot strikes a vital area for ${damage} damage!</p>`;
            } else {
              combatLog.innerHTML += `<p>Hit! Your shot strikes the ${_currentEnemy.name} for ${damage} damage.</p>`;
            }
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // Check for enemy defeat
          if (_currentEnemy.health <= 0) {
            setTimeout(() => {
              if (combatLog) {
                combatLog.innerHTML += `<p>Victory! You have defeated the ${_currentEnemy.name}!</p>`;
                combatLog.scrollTop = combatLog.scrollHeight;
              }
              
              // End combat with victory
              setTimeout(() => {
                this.endCombat('victory');
              }, 1500);
            }, 1000);
          }
        } else {
          // Miss
          if (combatLog) {
            combatLog.innerHTML += `<p>Miss! Your shot fails to hit the target.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
        }
      }, 1000);
    },
    
    performGrapple: function() {
      // Get combat state
      const playerPhysical = window.Player.get('phy') || 0;
      const enemyStrength = _currentEnemy.strength || 5;
      
      // Calculate success chance
      let successChance = 50 + playerPhysical * 4 - enemyStrength * 3;
      
      // Enemy evasive stance makes them harder to grapple
      if (window.GameState.get('enemyStance') === 'evasive') {
        successChance -= 20;
      }
      
      // Clamp success chance
      successChance = Math.min(90, Math.max(10, successChance));
      
      // Roll for success
      const roll = Math.random() * 100;
      
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You attempt to grapple the ${_currentEnemy.name}...</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      setTimeout(() => {
        if (roll <= successChance) {
          // Success
          if (combatLog) {
            combatLog.innerHTML += `<p>Success! You've grappled the ${_currentEnemy.name}, limiting their movement.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // Apply grapple effects
          window.GameState.set('enemyGrappled', true);
          window.GameState.set('playerMomentum', Math.min(5, window.GameState.get('playerMomentum') + 2));
          window.GameState.set('enemyMomentum', Math.max(-5, window.GameState.get('enemyMomentum') - 2));
          
          // Deal some damage
          const damage = Math.round(2 + playerPhysical * 0.3);
          _currentEnemy.health -= damage;
          
          // Update enemy health display
          const enemyHealthDisplay = document.getElementById('enemyHealthDisplay');
          const enemyCombatHealth = document.getElementById('enemyCombatHealth');
          
          if (enemyHealthDisplay) {
            enemyHealthDisplay.textContent = `${Math.max(0, _currentEnemy.health)} HP`;
          }
          
          if (enemyCombatHealth) {
            const healthPercent = Math.max(0, (_currentEnemy.health / _currentEnemy.maxHealth) * 100);
            enemyCombatHealth.style.width = `${healthPercent}%`;
          }
          
          if (combatLog) {
            combatLog.innerHTML += `<p>The grapple inflicts ${damage} damage to the ${_currentEnemy.name}.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
        } else {
          // Failure
          if (combatLog) {
            combatLog.innerHTML += `<p>Failed! The ${_currentEnemy.name} breaks free from your grapple attempt.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // Lose momentum after failed grapple
          window.GameState.set('playerMomentum', Math.max(-5, window.GameState.get('playerMomentum') - 1));
        }
      }, 1000);
    },
    
    performObserve: function() {
      // Log the action
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You observe the ${_currentEnemy.name}, studying their movements and tactics.</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Generate some insights about the enemy
      setTimeout(() => {
        if (combatLog) {
          combatLog.innerHTML += `<p>You notice that the ${_currentEnemy.name} seems ${
            _currentEnemy.strength > 7 ? 'exceptionally strong' : 
            _currentEnemy.strength > 5 ? 'physically strong' : 'relatively weak'
          } and ${
            _currentEnemy.skill > 7 ? 'highly skilled' : 
            _currentEnemy.skill > 5 ? 'competent' : 'somewhat inexperienced'
          }.</p>`;
          
          if (_currentEnemy.preferredRange) {
            combatLog.innerHTML += `<p>They appear to prefer fighting at ${_currentEnemy.preferredRange} range.</p>`;
          }
          
          if (_currentEnemy.weakness) {
            combatLog.innerHTML += `<p>You spot a potential weakness: ${_currentEnemy.weakness}</p>`;
          }
          
          combatLog.scrollTop = combatLog.scrollHeight;
        }
        
        // Gain a small tactical advantage
        window.GameState.set('tacticalAdvantage', true);
        window.GameState.set('playerMomentum', Math.min(5, window.GameState.get('playerMomentum') + 1));
      }, 1000);
    },
    
    performFeint: function() {
      // Log the action
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You perform a feint, attempting to trick the ${_currentEnemy.name}.</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Calculate success chance based on player skills
      const tacticsSkill = window.Player.get('skills.tactics') || 0;
      const enemySkill = _currentEnemy.skill || 5;
      
      let successChance = 50 + tacticsSkill * 5 - enemySkill * 2;
      
      // Clamp success chance
      successChance = Math.min(90, Math.max(10, successChance));
      
      // Roll for success
      const roll = Math.random() * 100;
      
      setTimeout(() => {
        if (roll <= successChance) {
          // Success
          if (combatLog) {
            combatLog.innerHTML += `<p>Your feint works! The ${_currentEnemy.name} falls for your ruse, leaving them vulnerable.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // Apply feint effects
          window.GameState.set('enemyFeinted', true);
          window.GameState.set('playerMomentum', Math.min(5, window.GameState.get('playerMomentum') + 2));
          window.GameState.set('enemyMomentum', Math.max(-5, window.GameState.get('enemyMomentum') - 2));
          
          // Setup guaranteed hit for next action
          window.GameState.set('guaranteedHit', true);
        } else {
          // Failure
          if (combatLog) {
            combatLog.innerHTML += `<p>Your feint fails! The ${_currentEnemy.name} doesn't fall for your deception.</p>`;
            combatLog.scrollTop = combatLog.scrollHeight;
          }
          
          // Lose momentum after failed feint
          window.GameState.set('playerMomentum', Math.max(-5, window.GameState.get('playerMomentum') - 1));
        }
      }, 1000);
    },
    
    // Environment and enemy generation
    generateCombatEnvironment: function() {
      // Use current weather if available
      const currentWeather = window.GameState.get('weather') || 'clear';
      
      // Generate terrain based on location
      const terrainOptions = ['flat', 'rocky', 'muddy', 'confined', 'elevated'];
      const terrain = terrainOptions[Math.floor(Math.random() * terrainOptions.length)];
      
      return {
        terrain: terrain,
        weather: currentWeather
      };
    },
    
    getEnemyByType: function(enemyType) {
      // This should be replaced with a proper enemy database lookup
      const enemies = {
        'arrasi_scout': {
          name: 'Arrasi Scout',
          description: 'A lightly armored scout of the Arrasi, wielding a curved blade and bow.',
          type: 'arrasi',
          health: 35,
          maxHealth: 35,
          skill: 7,
          strength: 5,
          defense: 5,
          speed: 8,
          initiative: 12,
          hasRanged: true,
          preferredRange: 'medium',
          expValue: 35,
          loot: {
            taelors: { min: 5, max: 15 },
            items: [
              { name: 'Arrasi Curved Blade', chance: 0.2, value: 25 },
              { name: 'Light Rations', chance: 0.6, value: 5 }
            ]
          },
          weakness: 'Prefers to fight at range, vulnerable in close combat.'
        },
        'arrasi_warrior': {
          name: 'Arrasi Warrior',
          description: 'A battle-hardened warrior of the Arrasi, wielding a heavy war axe.',
          type: 'arrasi',
          health: 50,
          maxHealth: 50,
          skill: 8,
          strength: 8,
          defense: 7,
          speed: 6,
          initiative: 10,
          hasRanged: false,
          preferredRange: 'close',
          expValue: 50,
          loot: {
            taelors: { min: 10, max: 25 },
            items: [
              { name: 'Arrasi War Axe', chance: 0.15, value: 40 },
              { name: 'Arrasi Helmet', chance: 0.3, value: 30 }
            ]
          },
          weakness: 'Slow to change tactics, vulnerable to feints.'
        },
        'wolf': {
          name: 'Forest Wolf',
          description: 'A large, hungry wolf with matted gray fur and sharp teeth.',
          type: 'beast',
          health: 30,
          maxHealth: 30,
          skill: 6,
          strength: 7,
          defense: 4,
          speed: 9,
          initiative: 13,
          hasRanged: false,
          preferredRange: 'close',
          expValue: 30,
          loot: {
            items: [
              { name: 'Wolf Pelt', chance: 0.8, value: 15 },
              { name: 'Sharp Tooth', chance: 0.5, value: 5 }
            ]
          },
          weakness: 'Predictable attack patterns, vulnerable after lunging.'
        }
      };
      
      // Clone enemy to avoid modifying the template
      const enemy = enemies[enemyType];
      if (enemy) {
        return JSON.parse(JSON.stringify(enemy));
      }
      
      return null;
    },
    
    // Override handler - used for backward compatibility
    setOriginalEndCombatFunction: function(originalFunction) {
      _originalEndCombatFunction = originalFunction;
    },
    
    // Enhanced mission combat integration
    startMissionCombat: function(enemyType, environment, callbackOnCompletion) {
      console.log("Starting mission combat with enemy:", enemyType);
      
      // Set mission combat flag
      window.GameState.set('inMissionCombat', true);
      
      // Save callback for mission continuation
      if (callbackOnCompletion) {
        _missionCombatCallback = callbackOnCompletion;
      }
      
      // Start the combat
      this.startCombat(enemyType, environment);
    },
    
    // Enhanced setup function that adds stamina indicator
    setupCombatUI: function(enemy, environment) {
      console.log("Setting up enhanced combat UI...");
      
      // Setup basic combat UI first
      const combatInterface = document.getElementById('combatInterface');
      if (combatInterface) {
        combatInterface.classList.remove('hidden');
      }
      
      // Setup enemy display
      const enemyName = document.getElementById('enemyName');
      const enemyHealthDisplay = document.getElementById('enemyHealthDisplay');
      const enemyCombatHealth = document.getElementById('enemyCombatHealth');
      
      if (enemyName) enemyName.textContent = enemy.name;
      if (enemyHealthDisplay) enemyHealthDisplay.textContent = `${enemy.health} HP`;
      if (enemyCombatHealth) enemyCombatHealth.style.width = `100%`;
      
      // Add stamina indicator
      setTimeout(() => {
        this.addStaminaIndicator();
      }, 100);
      
      console.log("Combat UI setup complete with stamina enhancements");
    }
  };
  
  return api;
})();

// Initialize the combat system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  window.CombatSystem.init();
});

// Enhanced global combat functions
window.startCombat = function(enemyType, environment) {
  console.log("Enhanced global startCombat called with:", enemyType);
  window.CombatSystem.startCombat(enemyType, environment);
};

window.endCombatWithResult = function(result) {
  console.log("Enhanced global endCombatWithResult called with:", result);
  
  try {
    // Call CombatSystem.endCombat if available
    if (window.CombatSystem && typeof window.CombatSystem.endCombat === 'function') {
      window.CombatSystem.endCombat(result);
    } else {
      // Legacy fallback
      console.warn("CombatSystem not available, using fallback combat end handling");
      
      // Handle based on result type
      if (result === 'victory') {
        // Add victory handling
        setNarrative("You have defeated your opponent!");
      } else if (result === 'defeat') {
        // Handle player defeat
        setNarrative("You have been defeated, but managed to escape with your life.");
        
        // Reduce health and stamina
        const healthReduction = Math.floor(window.gameState.maxHealth * 0.5);
        const staminaReduction = Math.floor(window.gameState.maxStamina * 0.5);
        window.gameState.health = Math.max(1, window.gameState.health - healthReduction);
        window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaReduction);
        
        // Add time (unconscious for 2 hours)
        window.updateTimeAndDay(120);
      } else if (result === 'retreat') {
        // Handle player retreat
        setNarrative("You've managed to retreat from combat and return to safety, though you're exhausted from running.");
        
        // Reduce stamina from running
        const staminaLoss = Math.floor(window.gameState.maxStamina * 0.3);
        window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaLoss);
        
        // Add some time (30 minutes of running/recovery)
        window.updateTimeAndDay(30);
      }
      
      // Clear combat state
      window.gameState.inBattle = false;
      window.gameState.currentEnemy = null;
      
      // Try to clean up combat UI
      if (typeof window.cleanupCombatUI === 'function') {
        window.cleanupCombatUI();
      }
      
      // Update UI
      if (typeof updateStatusBars === 'function') {
        updateStatusBars();
      }
      
      // Update action buttons
      if (typeof updateActionButtons === 'function') {
        updateActionButtons();
      }
    }
  } catch (error) {
    console.error("Error in endCombatWithResult:", error);
    
    // Emergency recovery if everything else fails
    window.emergencyCombatRecovery();
  }
};

window.cleanupCombatUI = function() {
  console.log("Enhanced global cleanupCombatUI called");
  
  if (window.CombatSystem && typeof window.CombatSystem.cleanupCombatUI === 'function') {
    window.CombatSystem.cleanupCombatUI();
  } else {
    // Fallback cleanup implementation
    const combatContainers = [
      'distanceContainer', 'stanceContainer', 'environmentContainer',
      'momentumContainer', 'combatActions', 'combatLog', 'staminaContainer'
    ];
    
    combatContainers.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
    
    // Hide combat interface
    const combatInterface = document.getElementById('combatInterface');
    if (combatInterface) {
      combatInterface.classList.add('hidden');
      combatInterface.classList.remove('combat-fullscreen');
    }
    
    // Restore other UI elements
    const elementsToRestore = [
      { id: 'narrative-container', style: 'block' },
      { selector: '.status-bars', style: 'flex' },
      { id: 'location', style: 'block' },
      { id: 'timeDisplay', style: 'block' },
      { id: 'dayDisplay', style: 'block' },
      { id: 'dayNightIndicator', style: 'block' },
      { id: 'actions', style: 'flex' }
    ];
    
    elementsToRestore.forEach(item => {
      const element = item.id 
        ? document.getElementById(item.id) 
        : document.querySelector(item.selector);
        
      if (element) {
        element.style.display = item.style;
      }
    });
  }
};

// Mission integration compatibility layer
window.setOriginalEndCombatFunction = function(originalFunction) {
  window.CombatSystem.setOriginalEndCombatFunction(originalFunction);
};

window.startMissionCombat = function(enemyType, environment, callbackOnCompletion) {
  console.log("Enhanced global startMissionCombat called with:", enemyType);
  if (window.CombatSystem && typeof window.CombatSystem.startMissionCombat === 'function') {
    window.CombatSystem.startMissionCombat(enemyType, environment, callbackOnCompletion);
  } else {
    // Fallback implementation
    window.GameState.set('inMissionCombat', true);
    window.startCombat(enemyType, environment);
  }
};

// Add a global emergency recovery function for combat-related issues
window.emergencyCombatRecovery = function() {
  console.log("Emergency combat recovery triggered");
  
  // Reset combat state
  window.gameState.inBattle = false;
  window.gameState.currentEnemy = null;
  
  // Clean up UI
  if (window.CombatSystem && typeof window.CombatSystem.cleanupCombatUI === 'function') {
    try {
      window.CombatSystem.cleanupCombatUI();
    } catch (error) {
      console.error("Error in combat cleanup:", error);
    }
  }
  
  // Handle mission combat state if needed
  if (window.gameState.inMissionCombat) {
    if (typeof window.fixMissionCombatState === 'function') {
      window.fixMissionCombatState();
    } else {
      // Basic mission state cleanup
      window.gameState.inMissionCombat = false;
      window.gameState.inMission = false;
      window.gameState.currentMission = null;
    }
  }
  
  // Force UI update
  if (window.UI && typeof window.UI.updateActionButtons === 'function') {
    window.UI.updateActionButtons();
  } else if (typeof window.updateActionButtons === 'function') {
    window.updateActionButtons();
  }
  
  // Show notification
  if (window.UI && typeof window.UI.showNotification === 'function') {
    window.UI.showNotification('Combat state has been fixed. You can continue playing.', 'success');
  }
};

// Add a utility function to fix mission combat state
window.fixMissionCombatState = function() {
  console.log("Fixing mission combat state");
  
  // Reset mission-related flags
  window.gameState.inMissionCombat = false;
  
  // Check if we need to continue the mission
  if (window.gameState.inMission && window.MissionSystem) {
    if (typeof window.MissionSystem.continueMissionAfterCombat === 'function') {
      try {
        // Try to continue with victory as default
        window.MissionSystem.continueMissionAfterCombat('victory');
      } catch (err) {
        console.error("Error continuing mission:", err);
        
        // If continuation fails, reset mission state completely
        window.gameState.inMission = false;
        window.gameState.currentMission = null;
        window.gameState.missionStage = 0;
      }
    }
  } else {
    // If no mission system, just reset mission state
    window.gameState.inMission = false;
    window.gameState.currentMission = null;
    window.gameState.missionStage = 0;
  }
  
  // Update UI
  if (window.UI && typeof window.UI.updateActionButtons === 'function') {
    window.UI.updateActionButtons();
  } else if (typeof window.updateActionButtons === 'function') {
    window.updateActionButtons();
  }
};

// Quick fix for getting the game unstuck if needed
document.addEventListener('keydown', function(e) {
  // Special key combo: Ctrl+Shift+R to trigger emergency recovery
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    console.log("Emergency recovery triggered by keyboard shortcut");
    window.emergencyCombatRecovery();
    e.preventDefault();
  }
});

console.log("Enhanced Combat System loaded with mission continuation fixes");
