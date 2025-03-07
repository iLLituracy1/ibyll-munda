// UI FUNCTIONS MODULE
// Functions related to UI updates and rendering

// Update status bars function
window.updateStatusBars = function() {
  // Update health bar
  const healthBar = document.getElementById('healthBar');
  const healthText = document.getElementById('healthText');
  if (healthBar && healthText) {
    healthBar.style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
    healthText.textContent = `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
  }
  
  // Update stamina bar
  const staminaBar = document.getElementById('staminaBar');
  const staminaText = document.getElementById('staminaText');
  if (staminaBar && staminaText) {
    staminaBar.style.width = `${(window.gameState.stamina / window.gameState.maxStamina) * 100}%`;
    staminaText.textContent = `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
  }
  
  // Update morale bar
  const moraleBar = document.getElementById('moraleBar');
  const moraleText = document.getElementById('moraleText');
  if (moraleBar && moraleText) {
    moraleBar.style.width = `${window.gameState.morale}%`;
    moraleText.textContent = `${Math.round(window.gameState.morale)}/100`;
  }
};

// Function to update time and day display
window.updateTimeAndDay = function(minutesToAdd) {
  // Add time
  window.gameTime += minutesToAdd;
  
  // Check for day change
  while (window.gameTime >= 1440) { // 24 hours * 60 minutes
    window.gameTime -= 1440;
    window.gameDay++;

    if (window.gameDay >= 3 && !window.gameState.campaignIntroduced && !window.gameState.currentCampaign) {
      window.gameState.campaignIntroduced = true;
      console.log("Day 3+ reached, triggering campaign introduction");
      window.showCampaignIntroduction();
    }
    
    // Reset daily flags
    window.gameState.dailyTrainingCount = 0;
    window.gameState.dailyPatrolDone = false;
    window.gameState.dailyScoutDone = false;
  }
  
  // Format time for display
  const hours = Math.floor(window.gameTime / 60);
  const minutes = window.gameTime % 60;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for display
  
  document.getElementById('timeDisplay').textContent = `Time: ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  document.getElementById('dayDisplay').textContent = `Day ${window.gameDay}`;
  
  // Update day/night indicator
  const timeOfDay = window.getTimeOfDay();
  document.getElementById('dayNightIndicator').className = 'day-night-indicator time-' + timeOfDay;
  
  // Update action buttons based on time
  window.updateActionButtons();
};

// Function to get time of day
window.getTimeOfDay = function() {
  const hours = Math.floor(window.gameTime / 60);
  
  if (hours >= 5 && hours < 8) return 'dawn';
  if (hours >= 8 && hours < 18) return 'day';
  if (hours >= 18 && hours < 21) return 'evening';
  return 'night';
};

// Update time and day display function
window.updateTimeAndDay = function(minutesToAdd) {
  // Use TimeManager to advance time
  const newTime = window.TimeManager.advanceTime(minutesToAdd);
  
  // Update time display
  document.getElementById('timeDisplay').textContent = `Time: ${newTime.hour12}`;
  document.getElementById('dayDisplay').textContent = `${newTime.monthName} ${newTime.day}, Year ${newTime.year}`;
  
  // Update day/night indicator
  const timeIndicator = document.getElementById('dayNightIndicator');
  timeIndicator.className = `day-night-indicator time-${window.getTimeOfDay()}`;
  
  // Update action buttons and other time-dependent systems
  window.updateActionButtons();
  
  // Check for campaign introduction if needed
  if (newTime.day >= 3 && !window.gameState.campaignIntroduced && !window.gameState.currentCampaign) {
    window.gameState.campaignIntroduced = true;
    window.showCampaignIntroduction();
  }
  
  return newTime;
};

// Function to get time of day
window.getTimeOfDay = function() {
  const hour = window.TimeManager.getCurrentTime().hourOfDay;
  
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 18) return 'day';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
};

// Update action buttons function
window.updateActionButtons = function() {
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';

  // Don't show regular actions during combat
  if (window.gameState.inBattle) {
    return;
  }

  // Add inventory button
  window.addActionButton('Inventory', 'inventory', actionsContainer);

  // Add equipment button
  window.addActionButton('Equipment', 'equipment', actionsContainer);

  // Add other action buttons
  window.addActionButton('Scout Area', 'scout', actionsContainer);
  window.addActionButton('Make Camp', 'camp', actionsContainer);
  window.addActionButton('Patrol Area', 'patrol', actionsContainer);

  // Check for special commander report state
  if (window.gameState.awaitingCommanderReport) {
    // Create special button for campaign introduction
    const reportButton = document.createElement('button');
    reportButton.className = 'action-btn';
    reportButton.id = 'report-to-commander';
    reportButton.textContent = 'Report to Commander';
    
    reportButton.onclick = function() {
      // Clear the special state
      window.gameState.awaitingCommanderReport = false;
      
      // Show campaign briefing
      window.setNarrative(`
        <p>You enter the command tent to find Commander Valarius bent over maps of the western territories. He looks up as you enter, acknowledging you with a curt nod.</p>
        <p>"We've received orders from high command," he says, gesturing to the map. "The Empire is pushing west, into Arrasi territory. Your unit will be deployed to secure the borderlands."</p>
        <p>The commander outlines the strategic importance of the peninsula and the resources it would bring to the Empire. You can tell this is a major campaign, not just a border skirmish.</p>
        <p>"Prepare yourself," Valarius concludes. "Report back here tomorrow for your specific mission assignments. This campaign will test everything you've learned so far."</p>
      `);
      
      // Check if campaign initialization function exists
      if (typeof window.initiateCampaign === 'function') {
        window.initiateCampaign('arrasi_campaign');
      } else {
        console.error("Campaign system not loaded: window.initiateCampaign is not a function");
        // Fallback: create a simple campaign object
        window.gameState.currentCampaign = {
          id: 'c' + Date.now().toString(36),
          type: 'arrasi_campaign',
          name: "Arrasi Peninsula Campaign",
          description: "Push west into Arrasi territory to secure the peninsula.",
          currentStage: 1,
          completedMissions: [],
          state: "active"
        };
        window.gameState.mainQuest.stage = 1;
        window.addToNarrative("<p>Campaign initialized. Report back tomorrow for mission assignments.</p>");
      }
      
      // Update action buttons without the special button
      window.updateActionButtons();
    };
    
    actionsContainer.appendChild(reportButton);
    return; // Exit early so no other buttons are added
  }
  
  const timeOfDay = window.getTimeOfDay();
  const hours = Math.floor(window.gameTime / 60);
  
  // Standard actions available in camp
  if (!window.gameState.inBattle && !window.gameState.inMission) {
    // Training available during the day
    if (timeOfDay === 'day' || timeOfDay === 'dawn') {
      window.addActionButton('Train', 'train', actionsContainer);
    }
    
    // Rest always available
    window.addActionButton('Rest', 'rest', actionsContainer);
    
    // Patrol available during day and evening
    if (timeOfDay === 'day' || timeOfDay === 'evening') {
      window.addActionButton('Patrol', 'patrol', actionsContainer);
    }
    
    // Mess hall available during meal times
    if ((hours >= 7 && hours <= 9) || (hours >= 12 && hours <= 14) || (hours >= 18 && hours <= 20)) {
      window.addActionButton('Mess Hall', 'mess', actionsContainer);
    }
    
    // Guard duty available all times
    window.addActionButton('Guard Duty', 'guard', actionsContainer);

    // Mission button if in a campaign
    if (window.gameState.currentCampaign && !window.gameState.inMission) {
      window.addActionButton('Campaign Missions', 'show_missions', actionsContainer);
    }
    
    // Gambling and Brawler Pits visibility logic
    if (timeOfDay === 'evening' || timeOfDay === 'night') {
      // Only show if player has discovered it or has the right background
      if (window.gameState.discoveredGamblingTent) {
        window.addActionButton('Gambling Tent', 'gambling', actionsContainer);
      }
      
      if (window.gameState.discoveredBrawlerPits) {
        window.addActionButton('Brawler Pits', 'brawler_pits', actionsContainer);
      }
    }
    
    // Add more actions based on game progression
    if (window.gameState.mainQuest.stage >= 1) {
      // Add more mission options as the game progresses
    }
  }
  
  // Menu buttons - always available
  window.addActionButton('Profile', 'profile', actionsContainer);
  window.addActionButton('Quest Log', 'questLog', actionsContainer);
};

// Function to add action button
window.addActionButton = function(label, action, container) {
  const btn = document.createElement('button');
  btn.className = 'action-btn';
  btn.textContent = label;
  btn.setAttribute('data-action', action);
  btn.onclick = function() {
    window.handleAction(action);
  };
  container.appendChild(btn);
};

// Function to handle profile panel display
window.handleProfile = function() {
  // Update profile text before showing
  const profileDiv = document.getElementById('profileText');
  
  // Calculate skill caps based on attributes
  const meleeCap = Math.floor(window.player.phy / 1.5);
  const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
  const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
  const commandCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
  const mentalSkillCap = Math.floor(window.player.men / 1.5);
  
  profileDiv.innerHTML = `
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
  profileDiv.innerHTML += `<p><strong>Relationships:</strong></p><ul>`;
  for (const id in window.player.relationships) {
    const relationship = window.player.relationships[id];
    let dispositionText = "Neutral";
    if (relationship.disposition >= 30) dispositionText = "Friendly";
    if (relationship.disposition >= 60) dispositionText = "Trusted Ally";
    if (relationship.disposition <= -30) dispositionText = "Distrustful";
    if (relationship.disposition <= -60) dispositionText = "Hostile";
    
    profileDiv.innerHTML += `<li>${relationship.name}: ${dispositionText} (${relationship.disposition})</li>`;
  }
  profileDiv.innerHTML += `</ul>`;
  
  document.getElementById('profile').classList.remove('hidden');
};

// Function to update profile if it's currently visible
window.updateProfileIfVisible = function() {
  if (!document.getElementById('profile').classList.contains('hidden')) {
    // Profile is visible, update it
    window.handleProfile();
  }
};

// Function to set narrative text
window.setNarrative = function(text) {
  // Replace the narrative with new text instead of appending
  const narrativeDiv = document.getElementById('narrative');
  narrativeDiv.innerHTML = `<p>${text}</p>`;
  narrativeDiv.scrollTop = 0; // Scroll to top
};

// Function to add to narrative text
window.addToNarrative = function(text) {
  // Append to existing narrative
  const narrativeDiv = document.getElementById('narrative');
  narrativeDiv.innerHTML += `<p>${text}</p>`;
  narrativeDiv.scrollTop = narrativeDiv.scrollHeight; // Scroll to bottom
};

// Show notification function
window.showNotification = function(text, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = text;
  notification.className = `notification ${type} show`;
  
  // Set timeout to hide notification
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
};

// Show achievement notification function
window.showAchievement = function(achievementId) {
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
    document.body.removeChild(notificationElement);
  }, 5000);
};

window.showCampaignIntroduction = function() {
  console.log("Showing campaign introduction");
  
  // Add narrative about being summoned to commander's tent
  window.addToNarrative(`
    <p>A messenger arrives at your quarters, bearing the seal of Commander Valarius. "Your presence is requested at the command tent immediately," they state formally before departing.</p>
    <p>This could be the deployment you've been waiting for...</p>
  `);
  
  // Add special flag to game state
  window.gameState.awaitingCommanderReport = true;
  
  // Force update of action buttons to show the special button
  window.updateActionButtons();
};

// Handle action button clicks
window.handleAction = function(action) {
  if (!action) {
    console.error('No action specified');
    return;
  }

  // Handle special actions first
  switch(action) {
    case 'inventory':
      const inventoryPanel = document.getElementById('inventory');
      if (inventoryPanel) {
        inventoryPanel.classList.remove('hidden');
        if (typeof window.displayInventory === 'function') {
          window.displayInventory();
        }
      }
      break;

    case 'equipment':
      const equipmentPanel = document.getElementById('equipment');
      if (equipmentPanel) {
        equipmentPanel.classList.remove('hidden');
        if (typeof window.updateEquipmentDisplay === 'function') {
          window.updateEquipmentDisplay();
        }
      }
      break;

    case 'scout':
      if (typeof window.handleScout === 'function') {
        window.handleScout();
      }
      break;

    case 'camp':
      if (typeof window.handleCamp === 'function') {
        window.handleCamp();
      }
      break;

    case 'patrol':
      if (typeof window.handlePatrol === 'function') {
        window.handlePatrol();
      }
      break;

    default:
      // For all other actions, try to find a handler function
      const handlerName = `handle${action.charAt(0).toUpperCase() + action.slice(1)}`;
      if (typeof window[handlerName] === 'function') {
        window[handlerName]();
      } else {
        console.warn(`No handler found for action: ${action}`);
      }
      break;
  }
};

// Add event listeners for panel close buttons
document.addEventListener('DOMContentLoaded', function() {
  // Close buttons for panels
  const closeButtons = document.querySelectorAll('.close-btn');
  if (closeButtons) {
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const panel = this.closest('.game-panel');
        if (panel) {
          panel.classList.add('hidden');
        }
      });
    });
  }

  // Initialize other UI elements if needed
  const gameContainer = document.getElementById('gameContainer');
  if (gameContainer) {
    gameContainer.classList.remove('hidden');
  }
});
  
  
  
