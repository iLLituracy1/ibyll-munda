// Ensure required systems exist
window.missionSystem = window.missionSystem || {};


// ENHANCED UI SYSTEM
// Functions to manage the modernized UI and transitions

// UI State Management
window.uiState = {
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
};

// Initialize the modern UI system
window.initModernUI = function() {
  console.log("Initializing modern UI system...");
  
  // Convert existing panels to new format
  convertPanelsToModernFormat();
  
  // Create a panel overlay for modal panels
  createPanelOverlay();
  
  // Enhance the narrative container for improved scrolling
  enhanceNarrativeContainer();
  
  // Replace old transition methods
  replaceTransitionMethods();
  
  // Initialize responsive UI adjustments
  initResponsiveUI();
  
  console.log("Modern UI system initialized!");
};

// Create panel overlay for modals
function createPanelOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'panel-overlay';
  overlay.id = 'panelOverlay';
  document.body.appendChild(overlay);
  
  // Click on overlay to close active panel
  overlay.addEventListener('click', () => {
    closeActivePanel();
  });
}

// Convert existing panels to modern format
function convertPanelsToModernFormat() {
  // Convert profile panel
  convertToModernPanel('profile', 'Your Profile');
  
  // Convert inventory panel
  convertToModernPanel('inventory', 'Inventory');
  
  // Convert quest log panel
  convertToModernPanel('questLog', 'Quest Log');
}

// Convert a panel to the modern format
function convertToModernPanel(panelId, title) {
  const oldPanel = document.getElementById(panelId);
  if (!oldPanel) return;
  
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
  closeBtn.addEventListener('click', function() {
    closePanel(panelId);
  });
}

// Enhance narrative container
function enhanceNarrativeContainer() {
  const narrative = document.getElementById('narrative');
  if (!narrative) return;
  
  // Create a container for the narrative if it doesn't exist
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
    narrative.scrollTop = narrative.scrollHeight;
    scrollIndicator.style.display = 'none';
  };
  narrativeContainer.appendChild(scrollIndicator);
  
  // Monitor scroll position
  narrative.addEventListener('scroll', function() {
    const isNearBottom = narrative.scrollHeight - narrative.scrollTop - narrative.clientHeight < 50;
    if (isNearBottom) {
      scrollIndicator.style.display = 'none';
    }
  });
}

// Replace old transition methods with modern ones
function replaceTransitionMethods() {
  // Enhanced version of setNarrative
  const originalSetNarrative = window.setNarrative;
  window.setNarrative = function(text) {
    // Don't update narrative if it's locked
    if (window.uiState.narrativeLock) {
      console.log("Narrative is locked, not updating main narrative");
      return;
    }
    
    // Save previous narrative text
    window.uiState.previousNarrative = document.getElementById('narrative').innerHTML;
    
    // Call original function
    originalSetNarrative(text);
    
    // Check if scroll indicator should be shown
    checkNarrativeScroll();
  };
  
  // Enhanced version of addToNarrative
  const originalAddToNarrative = window.addToNarrative;
  window.addToNarrative = function(text) {
    // Don't update narrative if it's locked
    if (window.uiState.narrativeLock) {
      console.log("Narrative is locked, not updating main narrative");
      return;
    }
    
    // Call original function
    originalAddToNarrative(text);
    
    // Check if scroll indicator should be shown
    checkNarrativeScroll();
  };
  
  // Enhanced panel open/close methods
  window.openPanel = function(panelId) {
    closeActivePanel(); // Close any other open panel
    
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    // Update UI state
    window.uiState.activePanel = panelId;
    window.uiState.visibleElements[panelId] = true;
    
    // Show the panel and overlay
    panel.classList.add('active');
    document.getElementById('panelOverlay').classList.add('active');
    
    // Update content if needed (for dynamic panels)
    updatePanelContent(panelId);
  };
  
  window.closePanel = function(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    // Update UI state
    if (window.uiState.activePanel === panelId) {
      window.uiState.activePanel = null;
    }
    window.uiState.visibleElements[panelId] = false;
    
    // Hide the panel and overlay
    panel.classList.remove('active');
    document.getElementById('panelOverlay').classList.remove('active');
  };
  
  // Handle action button handler enhancements
  const originalHandleAction = window.handleAction;
  window.handleAction = function(action) {
    // Handle panel actions with new system
    if (action === 'profile') {
      window.openPanel('profile');
      return;
    } else if (action === 'inventory') {
      window.openPanel('inventory');
      return;
    } else if (action === 'questLog') {
      window.openPanel('questLog');
      return;
    }
    
    // Call original function for other actions
    originalHandleAction(action);
  };
}

// Update panel content for dynamic panels
function updatePanelContent(panelId) {
  // Handle specific panel updates
  if (panelId === 'profile') {
    window.updateProfileContent();
  } else if (panelId === 'inventory') {
    window.updateInventoryContent();
  } else if (panelId === 'questLog') {
    window.updateQuestLogContent();
  }
}

// Update profile panel content
window.updateProfileContent = function() {
  const profileContent = document.querySelector('#profile .panel-content');
  if (!profileContent) return;
  
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
};

// Update inventory panel content
window.updateInventoryContent = function() {
  const inventoryContent = document.querySelector('#inventory .panel-content');
  if (!inventoryContent) return;
  
  inventoryContent.innerHTML = `<div class="inventory-coins">${window.player.taelors} Taelors</div>`;
  
  if (window.player.inventory.length === 0) {
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
};

// Update quest log panel content
window.updateQuestLogContent = function() {
  const questContent = document.querySelector('#questLog .panel-content');
  if (!questContent) return;
  
  questContent.innerHTML = '';
  
  // Add main quest
  questContent.innerHTML += `
    <div class="quest-item">
      <div class="quest-title">Main Quest: The Campaign</div>
      <div>Progress: Stage ${window.gameState.mainQuest.stage}/5</div>
    </div>
  `;
  
  // Add side quests
  if (window.gameState.sideQuests.length === 0) {
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
  if (window.missionSystem && window.missionSystem.missionHistory.length > 0) {
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
};

// Close the currently active panel
function closeActivePanel() {
  if (window.uiState.activePanel) {
    window.closePanel(window.uiState.activePanel);
  }
}

// Check if narrative scroll indicator should be shown
function checkNarrativeScroll() {
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
}

// Mission Interface Enhancements
// Improve the createMissionInterface function for better UI
// Mission Interface Enhancements
// Improve the createMissionInterface function for better UI
// Save original function if it exists
const originalCreateMissionInterface = window.missionSystem.createMissionInterface;

window.missionSystem.createMissionInterface = function(stage) {
  // Lock narrative updates during mission
  window.uiState.narrativeLock = true;

  // Hide regular action buttons
  document.getElementById('actions').style.display = 'none';
  
  // Create mission interface if it doesn't exist
  let missionInterface = document.getElementById('missionInterface');
  if (!missionInterface) {
    missionInterface = document.createElement('div');
    missionInterface.id = 'missionInterface';
    missionInterface.className = 'mission-interface';
    document.getElementById('gameContainer').appendChild(missionInterface);
  }
  
  // Make sure mission interface is visible
  missionInterface.style.display = 'block';
  window.uiState.visibleElements.missionInterface = true;
  
  // Clear previous content
  missionInterface.innerHTML = '';
  
  // Create mission header
  const missionHeader = document.createElement('div');
  missionHeader.className = 'mission-header';
  missionHeader.innerHTML = `<h3>${this.activeMission.title} - Stage ${this.currentStage + 1}</h3>`;
  missionInterface.appendChild(missionHeader);
  
  // Create narrative container
  const narrativeContainer = document.createElement('div');
  narrativeContainer.className = 'mission-narrative';
  narrativeContainer.innerHTML = `<p>${stage.narrative}</p>`;
  missionInterface.appendChild(narrativeContainer);
  
  // Create choices container
  const choicesContainer = document.createElement('div');
  choicesContainer.className = 'mission-choices';
  
  // Add choices with proper styling based on action type
  stage.choices.forEach((choice, index) => {
    const choiceBtn = document.createElement('button');
    choiceBtn.className = `mission-choice-btn ${choice.action || ''}`;
    choiceBtn.textContent = choice.text;
    choiceBtn.setAttribute('data-choice-index', index);
    choiceBtn.onclick = () => this.handleMissionChoice(index);
    choicesContainer.appendChild(choiceBtn);
  });

  
  missionInterface.appendChild(choicesContainer);
};

// Enhance mission completion UI
window.missionSystem.returnToCamp = function(success) {
  // Create a smooth transition back to camp
  const missionInterface = document.getElementById('missionInterface');
  if (missionInterface) {
    // Add fade out animation
    missionInterface.style.animation = 'slideOut 0.4s ease-in forwards';
    
    // After animation completes, remove mission interface
    setTimeout(() => {
      missionInterface.style.display = 'none';
      window.uiState.visibleElements.missionInterface = false;
      
      // Unlock narrative for updates
      window.uiState.narrativeLock = false;
      
      // Show regular action buttons
      document.getElementById('actions').style.display = 'flex';
      
      // If mission was successful, give rewards
      if (success && this.lastMissionCompleted) {
        this.giveRewards(this.lastMissionCompleted);
      }
      
      // Reset last mission completed
      this.lastMissionCompleted = null;
      
      // Update UI
      window.updateActionButtons();
      window.setNarrative("You have returned to camp. The familiar sights and sounds of the Kasvaari Camp greet you as you make your report.");
    }, 400); // Match the animation duration
  }
};

// Enhanced NPC dialog system
window.createNPCDialog = function(npcId) {
  const npc = window.npcDialogs[npcId];
  const relationship = window.player.relationships[npcId];
  
  if (!npc || !relationship) {
    console.error("NPC not found:", npcId);
    return;
  }
  
  // Create the dialog element if it doesn't exist
  let npcDialog = document.getElementById('npcDialog');
  if (!npcDialog) {
    npcDialog = document.createElement('div');
    npcDialog.id = 'npcDialog';
    npcDialog.className = 'npc-dialog';
    document.body.appendChild(npcDialog);
  }
  
  // Update UI state
  window.uiState.visibleElements.npcDialog = true;
  
  // Clear previous content
  npcDialog.innerHTML = '';
  
  // Create header with NPC name
  const dialogHeader = document.createElement('div');
  dialogHeader.className = 'npc-dialog-header';
  
  const avatar = document.createElement('div');
  avatar.className = 'npc-avatar';
  
  // Use different icons for different NPCs
  switch(npcId) {
    case 'commander':
      avatar.innerHTML = '⚔️';
      break;
    case 'sergeant':
      avatar.innerHTML = '🎖️';
      break;
    case 'quartermaster':
      avatar.innerHTML = '📦';
      break;
    default:
      avatar.innerHTML = '👤';
  }
  
  const name = document.createElement('div');
  name.className = 'npc-name';
  name.textContent = relationship.name;
  
  dialogHeader.appendChild(avatar);
  dialogHeader.appendChild(name);
  npcDialog.appendChild(dialogHeader);
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function() {
    closeNPCDialog(npcId);
  };
  dialogHeader.appendChild(closeBtn);
  
  // Create dialog content
  const dialogContent = document.createElement('div');
  dialogContent.className = 'npc-dialog-content';
  
  // Display greeting
  dialogContent.innerHTML = `<p>${npc.greeting()}</p><p>${npc.missionIntro}</p>`;
  npcDialog.appendChild(dialogContent);
  
  // Check if missions are available
  if (window.missionSystem.canGetMissionsFrom(npcId)) {
    // Get missions from this NPC
    const missions = window.missionSystem.getMissionsFromNPC(npcId);
    
    dialogContent.innerHTML += `<p>${npc.missionAvailable}</p>`;
    
    // Create mission list
    const missionList = document.createElement('div');
    missionList.className = 'mission-list';
    
    missions.forEach(mission => {
      const missionCard = document.createElement('div');
      missionCard.className = `mission-card difficulty-${mission.difficulty}`;
      
      missionCard.innerHTML = `
        <div class="mission-title">${mission.title}</div>
        <div class="mission-difficulty">
          Difficulty: ${'⭐'.repeat(mission.difficulty)}
        </div>
        <div class="mission-description">${mission.description}</div>
      `;
      
      // Add click handler
      missionCard.onclick = function() {
        showMissionDetails(mission, npcId);
      };
      
      missionList.appendChild(missionCard);
    });
    
    npcDialog.appendChild(missionList);
  } else {
    // No missions available
    dialogContent.innerHTML += `<p>${npc.noMissionsAvailable}</p>`;
  }
  
  // Create dialog options
  const dialogOptions = document.createElement('div');
  dialogOptions.className = 'npc-dialog-options';
  
  // Add farewell button
  const farewellBtn = document.createElement('button');
  farewellBtn.className = 'action-btn';
  farewellBtn.textContent = 'Leave';
  farewellBtn.onclick = function() {
    closeNPCDialog(npcId);
  };
  
  dialogOptions.appendChild(farewellBtn);
  npcDialog.appendChild(dialogOptions);
  
  // Show dialog with animation
  npcDialog.style.display = 'block';
  
  // Create overlay for NPC dialog
  document.getElementById('panelOverlay').classList.add('active');
};

// Responsive UI adjustments
function initResponsiveUI() {
  // Adjust UI based on screen size
  function adjustUI() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
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
}

// Initialize the modern UI when document is ready
document.addEventListener('DOMContentLoaded', function() {
  window.initModernUI();
});

// In modernUI.js, modify or add this function
function setupCombatUI(enemy, environment) {
  cleanupCombatUI();
  
  // Hide the regular game containers
  document.getElementById('narrative-container').style.display = 'none';
  document.querySelector('.status-bars').style.display = 'none';
  document.getElementById('location').style.display = 'none';
  document.getElementById('timeDisplay').style.display = 'none';
  document.getElementById('dayDisplay').style.display = 'none';
  document.getElementById('dayNightIndicator').style.display = 'none';
  
  // Setup combat interface
  document.getElementById('enemyName').textContent = enemy.name;
  document.getElementById('enemyHealthDisplay').textContent = `${enemy.health} HP`;
  document.getElementById('playerHealthDisplay').textContent = `${Math.round(window.gameState.health)} HP`;
  
  // Update health bars
  document.getElementById('enemyCombatHealth').style.width = '100%';
  document.getElementById('playerCombatHealth').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
  
  // Show full-screen combat interface
  document.getElementById('combatInterface').classList.remove('hidden');
  document.getElementById('combatInterface').classList.add('combat-fullscreen');
  
  // Add distance/position indicator
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

const originalEndCombatWithResult = window.endCombatWithResult;
window.endCombatWithResult = function(result) {
  // Clean up the combat UI elements first
  if (document.getElementById('narrative-container')) {
    document.getElementById('narrative-container').style.display = 'block';
  }
  document.querySelector('.status-bars').style.display = 'flex';
  
  // Remove fullscreen class from combat interface
  const combatInterface = document.getElementById('combatInterface');
  if (combatInterface) {
    combatInterface.classList.remove('combat-fullscreen');
  }
  
  // Call the original function
  originalEndCombatWithResult(result);
};