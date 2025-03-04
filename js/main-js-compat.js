// MAIN.JS COMPATIBILITY SCRIPT
// Direct fix for main.js initialization

// IMPORTANT: Create global objects immediately to prevent null errors
window.missionSystem = window.missionSystem || {};
window.missionSystem.availableMissions = window.missionSystem.availableMissions || [];
window.missionSystem.missionHistory = window.missionSystem.missionHistory || [];
window.missionSystem.missionCooldowns = window.missionSystem.missionCooldowns || {};
window.missionSystem.currentMission = window.missionSystem.currentMission || null;

// Add essential functions if they don't exist
window.missionSystem.generateAvailableMissions = window.missionSystem.generateAvailableMissions || function() {
  console.log("Default generateAvailableMissions called");
  // Ensure the array exists
  window.missionSystem.availableMissions = window.missionSystem.availableMissions || [];
  return true;
};

// Force generate missions if needed
if (Array.isArray(window.missionSystem.availableMissions) && 
    window.missionSystem.availableMissions.length === 0) {
  console.log("Forcing generation of available missions");
  try {
    window.missionSystem.generateAvailableMissions();
  } catch (e) {
    console.error("Error in generateAvailableMissions:", e);
  }
}

// Log status for debugging
console.log("Mission system compatibility initialized:");
console.log("- availableMissions:", 
  Array.isArray(window.missionSystem.availableMissions) ? 
  "Array[" + window.missionSystem.availableMissions.length + "]" : 
  window.missionSystem.availableMissions);


  // Add this to your main-js-compat.js file

// Fix missing generateAvailableMissions function
if (!window.missionSystem.generateAvailableMissions) {
  console.log("Adding missing generateAvailableMissions function");
  
  window.missionSystem.generateAvailableMissions = function() {
    console.log("Generating available missions for compatibility");
    
    // Ensure the array exists
    window.missionSystem.availableMissions = window.missionSystem.availableMissions || [];
    
    // Try to use MissionSystem's templates if available
    if (window.MissionSystem && typeof window.MissionSystem.registerMissionTemplates === 'function') {
      try {
        window.MissionSystem.registerMissionTemplates();
      } catch (e) {
        console.error("Error registering mission templates:", e);
      }
    }
    
    // Return success
    return true;
  };
}

// Ensure missionSystem has the minimum required objects
window.missionSystem.availableMissions = window.missionSystem.availableMissions || [];
window.missionSystem.missionHistory = window.missionSystem.missionHistory || [];
window.missionSystem.missionCooldowns = window.missionSystem.missionCooldowns || {};
window.missionSystem.currentMission = window.missionSystem.currentMission || null;

// Add compatibility function for getMissionsFromNPC if missing
if (!window.missionSystem.getMissionsFromNPC) {
  window.missionSystem.getMissionsFromNPC = function(npcId) {
    // Try to use getAvailableMissionsFrom if it exists
    if (typeof window.missionSystem.getAvailableMissionsFrom === 'function') {
      return window.missionSystem.getAvailableMissionsFrom(npcId);
    } else if (window.MissionSystem && typeof window.MissionSystem.getAvailableMissionsFrom === 'function') {
      return window.MissionSystem.getAvailableMissionsFrom(npcId);
    }
    
    // Otherwise return empty array
    return [];
  };
}

// Add compatibility function for canGetMissionsFrom if missing
if (!window.missionSystem.canGetMissionsFrom) {
  window.missionSystem.canGetMissionsFrom = function(npcId) {
    // Try to use MissionSystem's function if available
    if (window.MissionSystem && typeof window.MissionSystem.canGetMissionsFrom === 'function') {
      return window.MissionSystem.canGetMissionsFrom(npcId);
    }
    
    // Default to true for compatibility
    return true;
  };
}

// Add startMission if missing
if (!window.missionSystem.startMission) {
  window.missionSystem.startMission = function(missionType) {
    console.log("Compatibility startMission called for:", missionType);
    
    // Try to use MissionSystem's function if available
    if (window.MissionSystem && typeof window.MissionSystem.startMission === 'function') {
      return window.MissionSystem.startMission(missionType);
    }
    
    // Log error and return false if can't start
    console.error("Cannot start mission, no implementation available");
    return false;
  };
}

// Log completion of compatibility setup
console.log("Mission system compatibility layer fully initialized:");
console.log("- availableMissions:", 
  Array.isArray(window.missionSystem.availableMissions) ? 
  "Array[" + window.missionSystem.availableMissions.length + "]" : 
  window.missionSystem.availableMissions);

  // Enhanced getMissionsFromNPC function that ensures mission data has all required properties
window.missionSystem.getMissionsFromNPC = function(npcId) {
  let missions = [];
  
  // Try to use getAvailableMissionsFrom if it exists
  if (typeof window.missionSystem.getAvailableMissionsFrom === 'function') {
    missions = window.missionSystem.getAvailableMissionsFrom(npcId) || [];
  } else if (window.MissionSystem && typeof window.MissionSystem.getAvailableMissionsFrom === 'function') {
    missions = window.MissionSystem.getAvailableMissionsFrom(npcId) || [];
  }
  
  // Ensure each mission has required properties
  missions = missions.map(mission => {
    // Ensure basic properties
    mission.id = mission.id || mission.type || ("mission_" + Math.floor(Math.random() * 10000));
    mission.title = mission.title || "Untitled Mission";
    mission.description = mission.description || "No description available.";
    mission.difficulty = mission.difficulty || 1;
    
    // Ensure rewards object exists with default values
    mission.rewards = mission.rewards || {};
    mission.rewards.experience = mission.rewards.experience || 25;
    mission.rewards.taelors = mission.rewards.taelors || 10;
    mission.rewards.items = mission.rewards.items || [];
    
    return mission;
  });
  
  return missions;
};

// Create a minimal mission system if needed
if (!window.missionSystem.startMission || typeof window.missionSystem.startMission !== 'function') {
  window.missionSystem.startMission = function(missionId) {
    console.log("Starting mission:", missionId);
    
    // Try to use MissionSystem if available
    if (window.MissionSystem && typeof window.MissionSystem.startMission === 'function') {
      return window.MissionSystem.startMission(missionId);
    }
    
    // Simple fallback implementation
    window.gameState.inMission = true;
    window.addToNarrative("You have accepted a new mission. However, the mission system functionality is limited.");
    
    // Create a simple UI for the player to end the mission
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      const completeMissionBtn = document.createElement('button');
      completeMissionBtn.className = 'action-btn';
      completeMissionBtn.textContent = "Complete Mission";
      completeMissionBtn.onclick = function() {
        window.gameState.inMission = false;
        window.addToNarrative("Mission completed!");
        window.updateActionButtons();
        
        // Give small reward
        window.gameState.experience = (window.gameState.experience || 0) + 25;
        window.player.taelors = (window.player.taelors || 0) + 10;
        
        // Check for level up
        if (typeof window.checkLevelUp === 'function') {
          window.checkLevelUp();
        }
      };
      actionsContainer.appendChild(completeMissionBtn);
    }
    
    return true;
  };
}

// Defensive wrapper for accepting missions
window.acceptMissionSafely = function(missionId, npcId) {
  console.log("Safely accepting mission:", missionId, "from NPC:", npcId);
  
  try {
    // Close any open dialogs first
    const npcDialog = document.getElementById('npcDialog');
    if (npcDialog && npcDialog.parentNode) {
      npcDialog.parentNode.removeChild(npcDialog);
    }
    
    // Start the mission
    if (window.missionSystem && typeof window.missionSystem.startMission === 'function') {
      window.missionSystem.startMission(missionId);
    } else if (window.MissionSystem && typeof window.MissionSystem.startMission === 'function') {
      window.MissionSystem.startMission(missionId);
    } else {
      console.error("No mission system implementation found");
      window.addToNarrative("Mission accepted, but could not be started due to a technical issue.");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error accepting mission:", error);
    
    // Recovery - make sure we're not stuck in a bad state
    window.gameState.inMission = false;
    window.updateActionButtons();
    window.addToNarrative("There was a problem starting the mission. Please try again later.");
    
    return false;
  }
};

// Add immediate emergency check for mission UI
(function emergencyMissionUICheck() {
  // Check if we need to recover from a bad mission state right now
  if (window.gameState.inMission) {
    const actionsContainer = document.getElementById('actions');
    if (!actionsContainer || actionsContainer.children.length === 0) {
      console.log("EMERGENCY: Detected mission with no UI, adding recovery button");
      
      if (actionsContainer) {
        actionsContainer.style.display = 'flex';
        
        // Add an emergency button to exit mission
        const emergencyButton = document.createElement('button');
        emergencyButton.className = 'action-btn';
        emergencyButton.style.backgroundColor = '#ff4b4b';
        emergencyButton.style.color = 'white';
        emergencyButton.textContent = '🛟 EXIT MISSION';
        emergencyButton.onclick = function() {
          window.gameState.inMission = false;
          window.gameState.currentMission = null;
          window.updateActionButtons();
          window.addToNarrative("You have returned to camp.");
        };
        actionsContainer.appendChild(emergencyButton);
      }
    }
  }
})();

// Override acceptMission with safer version
if (typeof acceptMission === 'function') {
  const originalAcceptMission = acceptMission;
  window.acceptMission = function(missionId, npcId) {
    console.log("Safe wrapper for acceptMission called");
    
    try {
      if (typeof originalAcceptMission === 'function') {
        originalAcceptMission(missionId, npcId);
      } else {
        window.acceptMissionSafely(missionId, npcId);
      }
    } catch (error) {
      console.error("Error in acceptMission:", error);
      window.acceptMissionSafely(missionId, npcId);
    }
  };
} else {
  window.acceptMission = window.acceptMissionSafely;
}