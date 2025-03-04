// UI FUNCTIONS MODULE
// Functions related to UI updates and rendering

// Update status bars function
window.updateStatusBars = function() {
  // Update health bar
  document.getElementById('healthBar').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
  document.getElementById('healthValue').textContent = `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
  
  // Update stamina bar
  document.getElementById('staminaBar').style.width = `${(window.gameState.stamina / window.gameState.maxStamina) * 100}%`;
  document.getElementById('staminaValue').textContent = `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
  
  // Update morale bar
  document.getElementById('moraleBar').style.width = `${window.gameState.morale}%`;
  document.getElementById('moraleValue').textContent = `${Math.round(window.gameState.morale)}/100`;
};

// Function to update time and day display
window.updateTimeAndDay = function(minutesToAdd) {
  // Add time
  window.gameTime += minutesToAdd;
  
  // Check for day change
  while (window.gameTime >= 1440) { // 24 hours * 60 minutes
    window.gameTime -= 1440;
    window.gameDay++;
    
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

// Function to update action buttons
window.updateActionButtons = function() {
  // Update action buttons based on time of day, location, etc.
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';
  
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
  window.addActionButton('Inventory', 'inventory', actionsContainer);
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

// Function to set narrative text with improved scrolling
window.setNarrative = function(text) {
  // Replace the narrative with new text instead of appending
  const narrativeDiv = document.getElementById('narrative');
  narrativeDiv.innerHTML = `<p>${text}</p>`;
  
  // Ensure scroll to top
  requestAnimationFrame(() => {
    narrativeDiv.scrollTop = 0;
  });
};

// Function to add to narrative text
// Function to add to narrative text with improved auto-scrolling
window.addToNarrative = function(text) {
  // Append to existing narrative
  const narrativeDiv = document.getElementById('narrative');
  narrativeDiv.innerHTML += `<p>${text}</p>`;
  
  // Ensure scroll to bottom with requestAnimationFrame
  requestAnimationFrame(() => {
    narrativeDiv.scrollTop = narrativeDiv.scrollHeight;
  });
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

// Add scroll indicator when new content is below view
function addScrollIndicator() {
  const narrative = document.getElementById('narrative');
  if (!narrative) return;
  
  // Create indicator if it doesn't exist
  let indicator = document.getElementById('scroll-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'scroll-indicator';
    indicator.className = 'scroll-indicator';
    indicator.innerHTML = '↓ New content below ↓';
    indicator.style.display = 'none';
    indicator.style.position = 'absolute';
    indicator.style.bottom = '10px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.background = 'rgba(160, 160, 255, 0.8)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '15px';
    indicator.style.fontSize = '0.9em';
    indicator.style.cursor = 'pointer';
    indicator.style.zIndex = '10';
    indicator.style.transition = 'opacity 0.3s ease';
    
    // Click to scroll down
    indicator.addEventListener('click', () => {
      narrative.scrollTop = narrative.scrollHeight;
      indicator.style.display = 'none';
    });
    
    // Parent container needs position relative
    const container = narrative.parentElement;
    if (container.style.position !== 'relative') {
      container.style.position = 'relative';
    }
    
    container.appendChild(indicator);
  }
  
  // Monitor scroll position
  narrative.addEventListener('scroll', () => {
    // If we're near the bottom, hide the indicator
    const isNearBottom = narrative.scrollHeight - narrative.scrollTop - narrative.clientHeight < 50;
    
    if (isNearBottom) {
      indicator.style.display = 'none';
    }
  });
  
  // Enhance addToNarrative to show indicator when needed
  const enhancedAddToNarrative = window.addToNarrative;
  window.addToNarrative = function(text) {
    // Call the previous function
    enhancedAddToNarrative(text);
    
    // Check if we need to show the indicator
    const isScrolledDown = narrative.scrollHeight - narrative.scrollTop - narrative.clientHeight > 50;
    
    if (isScrolledDown) {
      indicator.style.display = 'block';
    }
  };
}

// Initialize the scroll indicator when document is ready
document.addEventListener('DOMContentLoaded', function() {
  addScrollIndicator();
});