// CONSOLIDATED UI SYSTEM
// Combines both ui.js and modernUI.js into a more organized structure

// UI State Management
window.UI = {
  // UI state tracking
  state: {
    activePanel: null,
    previousNarrative: "",
    inTransition: false,
    narrativeLock: false, // Used to prevent narrative being overwritten during certain states
    
    // Keep track of UI element visibility
    visibleElements: {
      combatInterface: false,
      profile: false,
      inventory: false,
      questLog: false,
      missionInterface: false,
      npcDialog: false
    }
  },
  
  // Core UI functions
  init: function() {
    console.log("Initializing UI system...");
    
    // Convert existing panels to new format
    this.convertPanelsToModernFormat();
    
    // Create a panel overlay for modal panels
    this.createPanelOverlay();
    
    // Enhance the narrative container for improved scrolling
    this.enhanceNarrativeContainer();
    
    // Initialize responsive UI adjustments
    this.initResponsiveUI();
    
    console.log("UI system initialized!");
  },
  
  // Update status bars function
  updateStatusBars: function() {
    const healthBar = document.getElementById('healthBar');
    const healthValue = document.getElementById('healthValue');
    const staminaBar = document.getElementById('staminaBar');
    const staminaValue = document.getElementById('staminaValue');
    const moraleBar = document.getElementById('moraleBar');
    const moraleValue = document.getElementById('moraleValue');
    
    if (!healthBar || !healthValue || !staminaBar || !staminaValue || !moraleBar || !moraleValue) {
      console.warn("Status bar elements not found when updating status bars");
      return;
    }
    
    // Update health bar
    healthBar.style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
    healthValue.textContent = `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
    
    // Update stamina bar
    staminaBar.style.width = `${(window.gameState.stamina / window.gameState.maxStamina) * 100}%`;
    staminaValue.textContent = `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
    
    // Update morale bar
    moraleBar.style.width = `${window.gameState.morale}%`;
    moraleValue.textContent = `${Math.round(window.gameState.morale)}/100`;
  },
  
  // Function to update time and day display
  updateTimeAndDay: function(minutesToAdd) {
    // Add time
    window.gameState.time += minutesToAdd;
    
    // Check for day change
    while (window.gameState.time >= 1440) { // 24 hours * 60 minutes
      window.gameState.time -= 1440;
      window.gameState.day++;
      
      // Reset daily flags
      window.gameState.dailyTrainingCount = 0;
      window.gameState.dailyPatrolDone = false;
      window.gameState.dailyScoutDone = false;
      
      // Update mission cooldowns if mission system exists
      if (window.missionSystem && typeof window.missionSystem.updateCooldowns === 'function') {
        window.missionSystem.updateCooldowns();
      }
    }
    
    // Format time for display
    const hours = Math.floor(window.gameState.time / 60);
    const minutes = window.gameState.time % 60;
    const ampm = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for display
    
    const timeDisplay = document.getElementById('timeDisplay');
    const dayDisplay = document.getElementById('dayDisplay');
    const dayNightIndicator = document.getElementById('dayNightIndicator');
    
    if (timeDisplay) {
      timeDisplay.textContent = `Time: ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    if (dayDisplay) {
      dayDisplay.textContent = `Day ${window.gameState.day}`;
    }
    
    // Update day/night indicator
    if (dayNightIndicator) {
      const timeOfDay = this.getTimeOfDay();
      dayNightIndicator.className = 'day-night-indicator time-' + timeOfDay;
    }
    
    // Update action buttons based on time
    this.updateActionButtons();
  },
  
  // Function to get time of day
  getTimeOfDay: function() {
    const hours = Math.floor(window.gameState.time / 60);
    
    if (hours >= 5 && hours < 8) return 'dawn';
    if (hours >= 8 && hours < 18) return 'day';
    if (hours >= 18 && hours < 21) return 'evening';
    return 'night';
  },
  
  // Function to update action buttons
  updateActionButtons: function() {
    // Update action buttons based on time of day, location, etc.
    const actionsContainer = document.getElementById('actions');
    if (!actionsContainer) {
      console.warn("Actions container not found when updating action buttons");
      return;
    }
    
    actionsContainer.innerHTML = '';
    
    const timeOfDay = this.getTimeOfDay();
    const hours = Math.floor(window.gameState.time / 60);
    
    // Standard actions available in camp
    if (!window.gameState.inBattle && !window.gameState.inMission) {
      // Training available during the day
      if (timeOfDay === 'day' || timeOfDay === 'dawn') {
        this.addActionButton('Train', 'train', actionsContainer);
      }
      
      // Rest always available
      this.addActionButton('Rest', 'rest', actionsContainer);
      
      // Patrol available during day and evening
      if (timeOfDay === 'day' || timeOfDay === 'evening') {
        this.addActionButton('Patrol', 'patrol', actionsContainer);
      }
      
      // Mess hall available during meal times
      if ((hours >= 7 && hours <= 9) || (hours >= 12 && hours <= 14) || (hours >= 18 && hours <= 20)) {
        this.addActionButton('Mess Hall', 'mess', actionsContainer);
      }
      
      // Guard duty available all times
      this.addActionButton('Guard Duty', 'guard', actionsContainer);
      
      // Gambling and Brawler Pits visibility logic
      if (timeOfDay === 'evening' || timeOfDay === 'night') {
        // Only show if player has discovered it or has the right background
        if (window.gameState.discoveredGamblingTent) {
          this.addActionButton('Gambling Tent', 'gambling', actionsContainer);
        }
        
        if (window.gameState.discoveredBrawlerPits) {
          this.addActionButton('Brawler Pits', 'brawler_pits', actionsContainer);
        }
      }
      
      // Add mission-related NPC interactions if mission system exists
      if (window.missionSystem && typeof window.missionSystem.canGetMissionsFrom === 'function') {
        if (window.missionSystem.canGetMissionsFrom('commander')) {
          this.addActionButton('Talk to Commander', 'talk_commander', actionsContainer);
        }
        
        if (window.missionSystem.canGetMissionsFrom('sergeant')) {
          this.addActionButton('Talk to Sergeant', 'talk_sergeant', actionsContainer);
        }
        
        if (window.missionSystem.canGetMissionsFrom('quartermaster')) {
          this.addActionButton('Talk to Quartermaster', 'talk_quartermaster', actionsContainer);
        }
      }
      
      // Add more actions based on game progression
      if (window.gameState.mainQuest.stage >= 1) {
        // Add more mission options as the game progresses
      }
    }
    
    // Menu buttons - always available
    this.addActionButton('Profile', 'profile', actionsContainer);
    this.addActionButton('Inventory', 'inventory', actionsContainer);
    this.addActionButton('Quest Log', 'questLog', actionsContainer);
  },
  
  // Function to add action button
  addActionButton: function(label, action, container) {
    if (!container) {
      console.warn("Container not provided when adding action button for", action);
      return;
    }
    
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.textContent = label;
    btn.setAttribute('data-action', action);
    btn.onclick = function() {
      window.ActionSystem.handleAction(action);
    };
    container.appendChild(btn);
  },
  
  // Function to set narrative text with improved scrolling
  setNarrative: function(text) {
    // Don't update narrative if it's locked
    if (this.state.narrativeLock) {
      console.log("Narrative is locked, not updating main narrative");
      return;
    }
    
    // Replace the narrative with new text
    const narrativeDiv = document.getElementById('narrative');
    if (!narrativeDiv) {
      console.warn("Narrative div not found when setting narrative");
      return;
    }
    
    // Save previous narrative text
    this.state.previousNarrative = narrativeDiv.innerHTML;
    
    narrativeDiv.innerHTML = `<p>${text}</p>`;
    
    // Ensure scroll to top
    requestAnimationFrame(() => {
      narrativeDiv.scrollTop = 0;
    });
    
    // Check if scroll indicator should be shown
    this.checkNarrativeScroll();
  },
  
  // Function to add to narrative text with improved auto-scrolling
  addToNarrative: function(text) {
    // Don't update narrative if it's locked
    if (this.state.narrativeLock) {
      console.log("Narrative is locked, not adding to narrative");
      return;
    }
    
    // Append to existing narrative
    const narrativeDiv = document.getElementById('narrative');
    if (!narrativeDiv) {
      console.warn("Narrative div not found when adding to narrative");
      return;
    }
    
    narrativeDiv.innerHTML += `<p>${text}</p>`;
    
    // Ensure scroll to bottom with requestAnimationFrame
    requestAnimationFrame(() => {
      narrativeDiv.scrollTop = narrativeDiv.scrollHeight;
    });
    
    // Check if scroll indicator should be shown
    this.checkNarrativeScroll();
  },
  
  // Show notification function
  showNotification: function(text, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
      console.warn("Notification element not found");
      return;
    }
    
    notification.textContent = text;
    notification.className = `notification ${type} show`;
    
    // Set timeout to hide notification
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  },
  
  // Show achievement notification function
  showAchievement: function(achievementId) {
    const achievement = window.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    // Mark achievement as unlocked
    achievement.unlocked = true;
    
    // Create achievement notification
    const notificationElement = document.createElement('div');
    notificationElement.className = 'achievement-notification';
    
    notificationElement.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-content">
        <div class="achievement-title">Achievement Unlocked</div>
        <div class="achievement-name">${achievement.title}</div>
        <div class="achievement-description">${achievement.description}</div>
      </div>
    `;
    
    document.body.appendChild(notificationElement);
    
    // Remove after animation completes
    setTimeout(() => {
      if (notificationElement.parentNode) {
        document.body.removeChild(notificationElement);
      }
    }, 5000);
  },
  
  // Check if narrative scroll indicator should be shown
  checkNarrativeScroll: function() {
    const narrative = document.getElementById('narrative');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (!narrative || !scrollIndicator) return;
    
    // Show indicator if content is scrollable and not at bottom
    const isScrollable = narrative.scrollHeight > narrative.clientHeight;
    const isNotAtBottom = narrative.scrollHeight - narrative.scrollTop - narrative.clientHeight > 50;
    
    if (isScrollable && isNotAtBottom) {
      scrollIndicator.style.display = 'block';
    } else {
      scrollIndicator.style.display = 'none';
    }
  },
  
  // Panel Management
  openPanel: function(panelId) {
    this.closeActivePanel(); // Close any other open panel
    
    const panel = document.getElementById(panelId);
    if (!panel) {
      console.warn("Panel not found:", panelId);
      return;
    }
    
    // Update UI state
    this.state.activePanel = panelId;
    this.state.visibleElements[panelId] = true;
    
    // Show the panel and overlay
    panel.classList.add('active');
    
    const overlay = document.getElementById('panelOverlay');
    if (overlay) {
      overlay.classList.add('active');
    }
    
    // Update content if needed (for dynamic panels)
    this.updatePanelContent(panelId);
  },
  
  closePanel: function(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) {
      console.warn("Panel not found when closing:", panelId);
      return;
    }
    
    // Update UI state
    if (this.state.activePanel === panelId) {
      this.state.activePanel = null;
    }
    this.state.visibleElements[panelId] = false;
    
    // Hide the panel and overlay
    panel.classList.remove('active');
    
    const overlay = document.getElementById('panelOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  },
  
  // Close the currently active panel
  closeActivePanel: function() {
    if (this.state.activePanel) {
      this.closePanel(this.state.activePanel);
    }
  },
  
  // Update panel content for dynamic panels
  updatePanelContent: function(panelId) {
    // Handle specific panel updates
    if (panelId === 'profile') {
      this.updateProfileContent();
    } else if (panelId === 'inventory') {
      this.updateInventoryContent();
    } else if (panelId === 'questLog') {
      this.updateQuestLogContent();
    }
  },
  
  // Update profile panel content
  updateProfileContent: function() {
    const profileContent = document.querySelector('#profile .panel-content');
    if (!profileContent) {
      console.warn("Profile content element not found");
      return;
    }
    
    // Calculate skill caps based on attributes
    const meleeCap = Math.floor(window.player.phy / 1.5);
    const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
    const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
    const commandCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
    const mentalSkillCap = Math.floor(window.player.men / 1.5);
    
    profileContent.innerHTML = `
      <p><strong>Name:</strong> ${window.player.name}</p>
      <p><strong>Heritage:</strong> ${window.player.origin}</p>
      <p><strong>Career:</strong> ${window.player.career.title}</p>
      <p><strong>Level:</strong> ${window.gameState.level}</p>
      <p><strong>Experience:</strong> ${window.gameState.experience}/${window.gameState.level * 100}</p>
      <p><strong>Skill Points:</strong> ${window.gameState.skillPoints}</p>
      <p><strong>Physical (PHY):</strong> ${window.player.phy.toFixed(2)} / 15</p>
      <p><strong>Mental (MEN):</strong> ${window.player.men.toFixed(2)} / 15</p>
      <p><strong>Skills:</strong> (Capped by attributes)</p>
      <ul>
        <li>Melee Combat: ${window.player.skills.melee.toFixed(2)} / ${meleeCap} (PHY based)</li>
        <li>Marksmanship: ${window.player.skills.marksmanship.toFixed(2)} / ${marksmanshipCap} (PHY+MEN based)</li>
        <li>Survival: ${window.player.skills.survival.toFixed(2)} / ${survivalCap} (PHY+MEN based)</li>
        <li>Command: ${window.player.skills.command.toFixed(2)} / ${commandCap} (MEN+some PHY based)</li>
        <li>Discipline: ${window.player.skills.discipline.toFixed(2)} / ${mentalSkillCap} (MEN based)</li>
        <li>Tactics: ${window.player.skills.tactics.toFixed(2)} / ${mentalSkillCap} (MEN based)</li>
        <li>Organization: ${window.player.skills.organization.toFixed(2)} / ${mentalSkillCap} (MEN based)</li>
        <li>Arcana: ${window.player.skills.arcana.toFixed(2)} / ${mentalSkillCap} (MEN based)</li>
      </ul>
    `;
    
    // Add relationships
    profileContent.innerHTML += `<p><strong>Relationships:</strong></p><ul>`;
    for (const id in window.player.relationships) {
      const relationship = window.player.relationships[id];
      let dispositionText = "Neutral";
      if (relationship.disposition >= 30) dispositionText = "Friendly";
      if (relationship.disposition >= 60) dispositionText = "Trusted Ally";
      if (relationship.disposition <= -30) dispositionText = "Distrustful";
      if (relationship.disposition <= -60) dispositionText = "Hostile";
      
      profileContent.innerHTML += `<li>${relationship.name}: ${dispositionText} (${relationship.disposition})</li>`;
    }
    profileContent.innerHTML += `</ul>`;
  },
  
  // Update inventory panel content
  updateInventoryContent: function() {
    const inventoryContent = document.querySelector('#inventory .panel-content');
    if (!inventoryContent) {
      console.warn("Inventory content element not found");
      return;
    }
    
    inventoryContent.innerHTML = `<div class="inventory-coins">${window.player.taelors} Taelors</div>`;
    
    if (!window.player.inventory || window.player.inventory.length === 0) {
      inventoryContent.innerHTML += `<p>Your inventory is empty.</p>`;
    } else {
      window.player.inventory.forEach((item, index) => {
        inventoryContent.innerHTML += `
          <div class="inventory-item">
            <div>
              <div class="inventory-item-name">${item.name}</div>
              <div>${item.effect}</div>
            </div>
            <div>${item.value} taelors</div>
          </div>
        `;
      });
    }
  },
  
  // Update quest log panel content
  updateQuestLogContent: function() {
    const questContent = document.querySelector('#questLog .panel-content');
    if (!questContent) {
      console.warn("Quest log content element not found");
      return;
    }
    
    questContent.innerHTML = '';
    
    // Add main quest
    questContent.innerHTML += `
      <div class="quest-item">
        <div class="quest-title">Main Quest: The Campaign</div>
        <div>Progress: Stage ${window.gameState.mainQuest.stage}/5</div>
      </div>
    `;
    
    // Add side quests
    if (!window.gameState.sideQuests || window.gameState.sideQuests.length === 0) {
      questContent.innerHTML += `<p>No active side quests.</p>`;
    } else {
      window.gameState.sideQuests.forEach(quest => {
        questContent.innerHTML += `
          <div class="quest-item">
            <div class="quest-title">${quest.title}</div>
            <div>${quest.description}</div>
            <div>Objectives:</div>
            <ul>
        `;
        
        quest.objectives.forEach(objective => {
          const className = objective.completed ? 'quest-objective-complete' : '';
          questContent.innerHTML += `
            <li class="quest-objective ${className}">
              ${objective.text}: ${objective.count}/${objective.target}
            </li>
          `;
        });
        
        questContent.innerHTML += `</ul></div>`;
      });
    }
    
    // Add mission history if available
    if (window.missionSystem && window.missionSystem.missionHistory && window.missionSystem.missionHistory.length > 0) {
      questContent.innerHTML += `<h3>Mission History</h3>`;
      
      window.missionSystem.missionHistory.forEach((mission, index) => {
        questContent.innerHTML += `
          <div class="mission-log-entry">
            <div class="mission-log-title">${mission.title}</div>
            <div class="mission-log-status ${mission.success ? 'completed' : 'failed'}">
              ${mission.success ? 'Completed' : 'Failed'} on Day ${mission.completedOn}
            </div>
          </div>
        `;
      });
    }
  },
  
  // Update profile if it's currently visible
  updateProfileIfVisible: function() {
    const profilePanel = document.getElementById('profile');
    if (profilePanel && !profilePanel.classList.contains('hidden') && profilePanel.classList.contains('active')) {
      // Profile is visible, update it
      this.updateProfileContent();
    }
  },
  
  // Modern UI setup functions
  createPanelOverlay: function() {
    // Check if overlay already exists
    if (document.getElementById('panelOverlay')) {
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    overlay.id = 'panelOverlay';
    document.body.appendChild(overlay);
    
    // Click on overlay to close active panel
    overlay.addEventListener('click', () => {
      this.closeActivePanel();
    });
  },
  
  convertPanelsToModernFormat: function() {
    // Convert profile panel
    this.convertToModernPanel('profile', 'Your Profile');
    
    // Convert inventory panel
    this.convertToModernPanel('inventory', 'Inventory');
    
    // Convert quest log panel
    this.convertToModernPanel('questLog', 'Quest Log');
  },
  
  convertToModernPanel: function(panelId, title) {
    const oldPanel = document.getElementById(panelId);
    if (!oldPanel) {
      console.warn("Panel not found when converting:", panelId);
      return;
    }
    
    // Save the original content
    const originalContent = oldPanel.innerHTML;
    
    // Update the panel structure
    oldPanel.className = 'game-panel';
    oldPanel.innerHTML = `
      <h3>${title}</h3>
      <button class="panel-close" data-panel="${panelId}">&times;</button>
      <div class="panel-content">${originalContent}</div>
    `;
    
    // Remove old close buttons
    const oldCloseButtons = oldPanel.querySelectorAll('.profile-close, .inventory-close, .quest-log-close');
    oldCloseButtons.forEach(btn => btn.remove());
    
    // Add event listener to the new close button
    const closeBtn = oldPanel.querySelector('.panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closePanel(panelId);
      });
    }
  },
  
  enhanceNarrativeContainer: function() {
    const narrative = document.getElementById('narrative');
    if (!narrative) {
      console.warn("Narrative element not found when enhancing container");
      return;
    }
    
    // Check if it's already in a container
    if (narrative.parentNode.id === 'narrative-container') {
      return;
    }
    
    // Create a container for the narrative
    const parent = narrative.parentNode;
    const narrativeContainer = document.createElement('div');
    narrativeContainer.id = 'narrative-container';
    parent.insertBefore(narrativeContainer, narrative);
    narrativeContainer.appendChild(narrative);
    
    // Add scroll indicator
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-indicator';
    scrollIndicator.textContent = '↓ New content below ↓';
    scrollIndicator.style.display = 'none';
    scrollIndicator.onclick = function() {
      if (narrative) {
        narrative.scrollTop = narrative.scrollHeight;
        scrollIndicator.style.display = 'none';
      }
    };
    narrativeContainer.appendChild(scrollIndicator);
    
    // Monitor scroll position
    narrative.addEventListener('scroll', function() {
      if (!narrative) return;
      const isNearBottom = narrative.scrollHeight - narrative.scrollTop - narrative.clientHeight < 50;
      if (isNearBottom) {
        scrollIndicator.style.display = 'none';
      }
    });
  },
  
  initResponsiveUI: function() {
    // Adjust UI based on screen size
    function adjustUI() {
      const windowWidth = window.innerWidth;
      
      if (windowWidth < 768) {
        // Mobile/small screen adjustments
        document.body.classList.add('small-screen');
      } else {
        document.body.classList.remove('small-screen');
      }
    }
    
    // Initial adjustment
    adjustUI();
    
    // Listen for window resize
    window.addEventListener('resize', adjustUI);
  },
  
  // Combat UI Functions
  combat: {
    // Setup combat UI
    setup: function(enemy, environment) {
      // First clean up any previous combat UI
      this.cleanup();
      
      // Hide the regular game containers for fullscreen combat
      const narrativeContainer = document.getElementById('narrative-container');
      const statusBars = document.querySelector('.status-bars');
      const location = document.getElementById('location');
      const timeDisplay = document.getElementById('timeDisplay');
      const dayDisplay = document.getElementById('dayDisplay');
      const dayNightIndicator = document.getElementById('dayNightIndicator');
      
      if (narrativeContainer) narrativeContainer.style.display = 'none';
      if (statusBars) statusBars.style.display = 'none';
      if (location) location.style.display = 'none';
      if (timeDisplay) timeDisplay.style.display = 'none';
      if (dayDisplay) dayDisplay.style.display = 'none';
      if (dayNightIndicator) dayNightIndicator.style.display = 'none';
      
      // Setup combat interface elements
      const enemyNameElement = document.getElementById('enemyName');
      const enemyHealthDisplay = document.getElementById('enemyHealthDisplay');
      const playerHealthDisplay = document.getElementById('playerHealthDisplay');
      const enemyCombatHealth = document.getElementById('enemyCombatHealth');
      const playerCombatHealth = document.getElementById('playerCombatHealth');
      const combatInterface = document.getElementById('combatInterface');
      const combatLog = document.getElementById('combatLog');
      const actions = document.getElementById('actions');
      
      // Update enemy and player info with null checks
      if (enemyNameElement) enemyNameElement.textContent = enemy.name;
      if (enemyHealthDisplay) enemyHealthDisplay.textContent = `${enemy.health} HP`;
      if (playerHealthDisplay) playerHealthDisplay.textContent = `${Math.round(window.gameState.health)} HP`;
      
      // Update health bars
      if (enemyCombatHealth) enemyCombatHealth.style.width = '100%';
      if (playerCombatHealth) playerCombatHealth.style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
      
      // Show combat interface
      if (combatInterface) {
        combatInterface.classList.remove('hidden');
        combatInterface.classList.add('combat-fullscreen');
      }
      
      // Add combat indicators
      this.addDistanceIndicator();
      this.addStanceIndicator();
      this.addEnvironmentIndicator(environment);
      this.addMomentumIndicator();
      
      // Set combat log
      if (combatLog) {
        combatLog.innerHTML = `<p>You are engaged in combat with a ${enemy.name}. ${enemy.description}</p>`;
        combatLog.innerHTML += `<p>Combat begins at ${this.getDistanceText(window.gameState.combatDistance)} range on ${environment.terrain} terrain in ${environment.weather} weather.</p>`;
        combatLog.innerHTML += `<p>Initiative order: ${window.gameState.initiativeOrder[0]} first, then ${window.gameState.initiativeOrder[1]}.</p>`;
      }
      
      // Disable regular action buttons during combat
      if (actions) actions.style.display = 'none';
      
      // Update combat actions
      window.CombatSystem.updateCombatActions();
    },
    
    // Clean up the combat UI
    cleanup: function() {
      // Remove combat indicators
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
      
      // Restore UI elements hidden during combat
      const narrativeContainer = document.getElementById('narrative-container');
      const statusBars = document.querySelector('.status-bars');
      const location = document.getElementById('location');
      const timeDisplay = document.getElementById('timeDisplay');
      const dayDisplay = document.getElementById('dayDisplay');
      const dayNightIndicator = document.getElementById('dayNightIndicator');
      const combatInterface = document.getElementById('combatInterface');
      const actions = document.getElementById('actions');
      
      if (narrativeContainer) narrativeContainer.style.display = 'block';
      if (statusBars) statusBars.style.display = 'flex';
      if (location) location.style.display = 'block';
      if (timeDisplay) timeDisplay.style.display = 'block';
      if (dayDisplay) dayDisplay.style.display = 'block';
      if (dayNightIndicator) dayNightIndicator.style.display = 'block';
      
      // Hide combat interface and remove fullscreen class
      if (combatInterface) {
        combatInterface.classList.add('hidden');
        combatInterface.classList.remove('combat-fullscreen');
      }
      
      // Restore action buttons
      if (actions) actions.style.display = 'flex';
    },
    
    // Add distance indicator to combat UI
    addDistanceIndicator: function() {
      // First, remove any existing distance container to prevent duplication
      const existingContainer = document.getElementById('distanceContainer');
      if (existingContainer) {
        existingContainer.remove();
      }
    
      const combatHeader = document.getElementById('combatHeader');
      if (!combatHeader) {
        console.warn("Combat header not found when adding distance indicator");
        return;
      }
      
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
      positionToken.style.left = `${(window.gameState.combatDistance / 2) * 100}%`; // Set based on current distance
      positionToken.style.transform = 'translateX(-50%)';
      positionToken.style.transition = 'left 0.5s ease';
      distanceIndicator.appendChild(positionToken);
      
      distanceContainer.appendChild(distanceLabel);
      distanceContainer.appendChild(distanceIndicator);
      
      // Insert after combat header
      combatHeader.parentNode.insertBefore(distanceContainer, combatHeader.nextSibling);
      
      // Update position token
      this.updateDistanceIndicator();
    },
    
    // Add stance indicator to combat UI
    addStanceIndicator: function() {
      // First, remove any existing stance container to prevent duplication
      const existingContainer = document.getElementById('stanceContainer');
      if (existingContainer) {
        existingContainer.remove();
      }
      
      const distanceContainer = document.getElementById('distanceContainer');
      if (!distanceContainer) {
        console.warn("Distance container not found when adding stance indicator");
        return;
      }
      
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
      playerStanceValue.textContent = this.capitalizeFirstLetter(window.gameState.combatStance);
      
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
      enemyStanceValue.textContent = this.capitalizeFirstLetter(window.gameState.enemyStance);
      
      enemyStanceDiv.appendChild(enemyStanceLabel);
      enemyStanceDiv.appendChild(enemyStanceValue);
      
      stanceContainer.appendChild(playerStanceDiv);
      stanceContainer.appendChild(enemyStanceDiv);
      
      // Insert after distance container
      distanceContainer.parentNode.insertBefore(stanceContainer, distanceContainer.nextSibling);
      
      // Update stance indicators
      this.updateStanceIndicator();
    },
    
    // Add environment indicator to UI
    addEnvironmentIndicator: function(environment) {
      // First, remove any existing environment container to prevent duplication
      const existingContainer = document.getElementById('environmentContainer');
      if (existingContainer) {
        existingContainer.remove();
      }
      
      const combatHeader = document.getElementById('combatHeader');
      const stanceContainer = document.getElementById('stanceContainer');
      
      if (!combatHeader && !stanceContainer) {
        console.warn("Neither combat header nor stance container found when adding environment indicator");
        return;
      }
      
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
      terrainValue.textContent = this.capitalizeFirstLetter(environment.terrain);
      
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
      weatherValue.textContent = this.capitalizeFirstLetter(environment.weather);
      
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
    },
    
    // Add momentum indicator
    addMomentumIndicator: function() {
      // First, remove any existing momentum container to prevent duplication
      const existingContainer = document.getElementById('momentumContainer');
      if (existingContainer) {
        existingContainer.remove();
      }
      
      const environmentContainer = document.getElementById('environmentContainer');
      if (!environmentContainer) {
        console.warn("Environment container not found when adding momentum indicator");
        return;
      }
      
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
      
      // Insert after environment container
      environmentContainer.parentNode.insertBefore(momentumContainer, environmentContainer.nextSibling);
      
      // Update momentum values
      this.updateMomentumIndicator();
    },
    
    // Update distance indicator
    updateDistanceIndicator: function() {
      const positionToken = document.getElementById('positionToken');
      if (positionToken) {
        // Calculate position percentage based on distance
        // 0 = close = 0%, 1 = medium = 50%, 2 = far = 100%
        const percentage = (window.gameState.combatDistance / 2) * 100;
        positionToken.style.left = `${percentage}%`;
      }
    },
    
    // Update stance indicator
    updateStanceIndicator: function() {
      const playerStanceValue = document.getElementById('playerStanceValue');
      const enemyStanceValue = document.getElementById('enemyStanceValue');
      
      if (playerStanceValue) {
        playerStanceValue.textContent = this.capitalizeFirstLetter(window.gameState.combatStance);
        
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
        enemyStanceValue.textContent = this.capitalizeFirstLetter(window.gameState.enemyStance);
        
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
    },
    
    // Update the momentum indicator
    updateMomentumIndicator: function() {
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
    },
    
    // Add combat button to UI
    addCombatButton: function(action, label, container) {
      if (!container) {
        console.warn("Container not provided when adding combat button");
        return;
      }
      
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.textContent = label;
      btn.setAttribute('data-action', action);
      btn.onclick = function() {
        window.CombatSystem.handleCombatAction(action);
      };
      container.appendChild(btn);
    },
    
    // Get text description of distance
    getDistanceText: function(distance) {
      switch(distance) {
        case 0: return "close";
        case 1: return "medium";
        case 2: return "far";
        default: return "unknown";
      }
    },
    
    // Helper function to capitalize first letter
    capitalizeFirstLetter: function(string) {
      if (!string) return "";
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }
};


// Initialize mission system compat layer early during page load
document.addEventListener('DOMContentLoaded', function() {
  // Ensure mission system is initialized
  if (!window.missionSystem || !window.missionSystem.availableMissions) {
    console.log("Initializing mission system compatibility layer");
    
    if (!window.missionSystem) {
      window.missionSystem = {
        availableMissions: [],
        missionHistory: [],
        currentMission: null,
        missionCooldowns: {}
      };
    }
    
    // Ensure crucial properties exist
    if (!window.missionSystem.availableMissions) window.missionSystem.availableMissions = [];
    if (!window.missionSystem.missionHistory) window.missionSystem.missionHistory = [];
    if (!window.missionSystem.missionCooldowns) window.missionSystem.missionCooldowns = {};
  }
});// Initialize UI system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  window.UI.init();
});

// Backward compatibility layer for functions that were moved from global scope
window.updateStatusBars = function() {
  if (window.UI && typeof window.UI.updateStatusBars === 'function') {
    window.UI.updateStatusBars();
  } else {
    console.warn("UI system not initialized yet, can't update status bars");
  }
};

window.updateTimeAndDay = function(minutesToAdd) {
  if (window.UI && typeof window.UI.updateTimeAndDay === 'function') {
    window.UI.updateTimeAndDay(minutesToAdd);
  } else {
    console.warn("UI system not initialized yet, can't update time and day");
  }
};

window.setNarrative = function(text) {
  if (window.UI && typeof window.UI.setNarrative === 'function') {
    window.UI.setNarrative(text);
  } else {
    console.warn("UI system not initialized yet, can't set narrative");
  }
};

window.addToNarrative = function(text) {
  if (window.UI && typeof window.UI.addToNarrative === 'function') {
    window.UI.addToNarrative(text);
  } else {
    console.warn("UI system not initialized yet, can't add to narrative");
  }
};

window.showNotification = function(text, type) {
  if (window.UI && typeof window.UI.showNotification === 'function') {
    window.UI.showNotification(text, type);
  } else {
    console.warn("UI system not initialized yet, can't show notification");
  }
};

// Add updateActionButtons compatibility with override support
window.originalUpdateActionButtons = function() {
  if (window.UI && typeof window.UI.updateActionButtons === 'function') {
    window.UI.updateActionButtons();
  } else {
    console.warn("UI system not initialized yet, can't update action buttons");
  }
};

window.updateActionButtons = window.originalUpdateActionButtons;

// Add backward compatibility for action handling
if (!window.ActionSystem) {
  window.ActionSystem = { 
    handleAction: function(action) {
      console.log("ActionSystem not fully initialized, using compatibility layer for action:", action);
      if (typeof window.handleAction === 'function') {
        window.handleAction(action);
      } else {
        console.warn("No action handler available for:", action);
      }
    }
  };
}

// Backward compatibility for old action handler
window.handleAction = function(action) {
  if (window.ActionSystem && typeof window.ActionSystem.handleAction === 'function') {
    window.ActionSystem.handleAction(action);
  } else {
    console.warn("ActionSystem not initialized, can't handle action:", action);
  }
};

// Add backward compatibility for mission system
if (!window.missionSystem) {
  window.missionSystem = {
    // Common properties that might be accessed
    availableMissions: [],
    missionHistory: [],
    currentMission: null,
    missionCooldowns: {},
    
    canGetMissionsFrom: function(npcId) {
      if (window.MissionSystem) {
        return window.MissionSystem.canGetMissionsFrom(npcId);
      }
      return true; // Always show NPCs if mission system isn't available
    },
    getAvailableMissionsFrom: function(npcId) {
      if (window.MissionSystem) {
        return window.MissionSystem.getAvailableMissionsFrom(npcId);
      }
      return [];
    },
    startMission: function(type) {
      if (window.MissionSystem) {
        return window.MissionSystem.startMission(type);
      }
      return false;
    },
    // Add missing generateAvailableMissions function for compatibility
    generateAvailableMissions: function() {
      console.log("Generating available missions");
      if (window.MissionSystem) {
        window.MissionSystem.registerMissionTemplates();
        // Make sure to initialize our internal array for compatibility
        this.availableMissions = [];
        return true;
      }
      this.availableMissions = []; // Ensure we always have an array
      return false;
    },
    updateCooldowns: function() {
      if (window.MissionSystem) {
        window.MissionSystem.updateCooldowns();
      }
    },
    getMissionCooldowns: function() {
      if (window.MissionSystem) {
        return window.MissionSystem.getMissionCooldowns();
      }
      return this.missionCooldowns;
    },
    getCurrentMission: function() {
      if (window.MissionSystem) {
        return window.MissionSystem.getCurrentMission();
      }
      return this.currentMission;
    },
    getMissionHistory: function() {
      if (window.MissionSystem) {
        return window.MissionSystem.getMissionHistory();
      }
      return this.missionHistory;
    }
  };
}

// Helper function to check if a button already exists
window.buttonExists = function(action, container) {
  if (!container) return false;
  
  // Check all existing buttons for this action
  const existingButtons = container.querySelectorAll(`[data-action="${action}"]`);
  return existingButtons.length > 0;
};

// Enhanced version of UI.addActionButton that prevents duplicates
const originalAddActionButton = window.UI.addActionButton;
window.UI.addActionButton = function(label, action, container) {
  // Check if button already exists
  if (window.buttonExists(action, container)) {
    console.log(`Button for action '${action}' already exists, not adding duplicate`);
    return;
  }
  
  // Call original function
  originalAddActionButton(label, action, container);
};

// Override updateActionButtons in ui.js to fix duplicate buttons
const originalUIUpdateActionButtons = window.UI.updateActionButtons;
window.UI.updateActionButtons = function() {
  const actionsContainer = document.getElementById('actions');
  if (!actionsContainer) {
    console.warn("Actions container not found when updating action buttons");
    return;
  }
  
  // Clear existing buttons
  actionsContainer.innerHTML = '';
  
  // Now call the original function
  originalUIUpdateActionButtons();
};

// Replace the direct NPC button handling to use canGetMissionsFrom correctly
const getMissionsFromNPC = function(npcId) {
  if (window.MissionSystem && typeof window.MissionSystem.getAvailableMissionsFrom === 'function') {
    return window.MissionSystem.getAvailableMissionsFrom(npcId);
  } else if (window.missionSystem && typeof window.missionSystem.getAvailableMissionsFrom === 'function') {
    return window.missionSystem.getAvailableMissionsFrom(npcId);
  }
  return [];
};

// This ensures backwards compatibility with both API styles
window.missionSystem.getMissionsFromNPC = getMissionsFromNPC;