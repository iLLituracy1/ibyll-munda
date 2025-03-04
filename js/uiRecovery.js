// ROBUST UI RECOVERY SYSTEM
// This system ensures that players can never get stuck after combat

// Create a global namespace for UI recovery system
window.UIRecoverySystem = (function() {
  // Private variables
  let _recoveryButtonVisible = false;
  let _checkIntervalId = null;
  let _lastKnownGoodState = null;
  
  // Configuration
  const config = {
    checkInterval: 2000, // How often to check for UI issues (in ms)
    actionButtonsMinimum: 2, // Minimum expected number of action buttons
    recoveryButtonId: 'emergency-recovery-button',
    uiElementsToCheck: [ // Key UI elements that should be visible outside combat
      { selector: '#actions', display: 'flex' },
      { selector: '.status-bars', display: 'flex' },
      { selector: '#narrative-container', display: 'block' }
    ]
  };
  
  // Keep track of UI state at different points
  const saveUiState = function() {
    _lastKnownGoodState = {
      inBattle: window.gameState.inBattle,
      inMission: window.gameState.inMission,
      inMissionCombat: window.gameState.inMissionCombat,
      actionButtonCount: document.getElementById('actions')?.children.length || 0,
      timeRecorded: Date.now()
    };
    
    console.log("UI state saved:", _lastKnownGoodState);
  };

  // Detect if the UI is in a bad state
  const isUiBroken = function() {
    // Don't check during intentional combat or mission
    if (window.gameState.inBattle || 
        (window.gameState.inMission && window.gameState.currentMission)) {
      return false;
    }
    
    const actionsContainer = document.getElementById('actions');
    if (!actionsContainer) return true; // Actions container is missing
    
    // Check visibility
    const computedStyle = window.getComputedStyle(actionsContainer);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      return true;
    }
    
    // Check if there are enough action buttons
    if (actionsContainer.children.length < config.actionButtonsMinimum) {
      return true;
    }
    
    // Check if key UI elements are visible
    for (const element of config.uiElementsToCheck) {
      const el = document.querySelector(element.selector);
      if (!el || window.getComputedStyle(el).display === 'none') {
        return true;
      }
    }
    
    // Check for combat interface visibility when we're not in combat
    const combatInterface = document.getElementById('combatInterface');
    if (combatInterface && 
        !combatInterface.classList.contains('hidden') && 
        !window.gameState.inBattle) {
      return true;
    }
    
    return false;
  };

  // Add emergency recovery button if not already present
  const addRecoveryButton = function() {
    if (_recoveryButtonVisible) return;
    
    // Remove any existing button first
    removeRecoveryButton();
    
    const recoveryButton = document.createElement('button');
    recoveryButton.id = config.recoveryButtonId;
    recoveryButton.textContent = 'Emergency UI Recovery';
    
    // Style the button to make it very noticeable
    recoveryButton.style.position = 'fixed';
    recoveryButton.style.bottom = '20px';
    recoveryButton.style.right = '20px';
    recoveryButton.style.backgroundColor = '#ff4b4b';
    recoveryButton.style.color = 'white';
    recoveryButton.style.fontWeight = 'bold';
    recoveryButton.style.padding = '15px 20px';
    recoveryButton.style.border = 'none';
    recoveryButton.style.borderRadius = '5px';
    recoveryButton.style.zIndex = '9999';
    recoveryButton.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
    recoveryButton.style.cursor = 'pointer';
    
    // Add click event
    recoveryButton.onclick = function() {
      performFullRecovery();
    };
    
    document.body.appendChild(recoveryButton);
    _recoveryButtonVisible = true;
    
    console.log("Emergency recovery button added");
  };

  // Remove the recovery button
  const removeRecoveryButton = function() {
    const existingButton = document.getElementById(config.recoveryButtonId);
    if (existingButton) {
      existingButton.remove();
    }
    _recoveryButtonVisible = false;
  };

  // Full system recovery procedure
  const performFullRecovery = function() {
    console.log("Performing full UI recovery...");
    
    // 1. Reset critical game state flags
    window.gameState.inBattle = false;
    window.gameState.currentEnemy = null;
    window.gameState.inMission = false;
    window.gameState.currentMission = null;
    window.gameState.missionStage = 0;
    window.gameState.inMissionCombat = false;
    
    // 2. Clean up any combat UI
    if (typeof window.CombatSystem !== 'undefined' && 
        typeof window.CombatSystem.cleanupCombatUI === 'function') {
      try {
        window.CombatSystem.cleanupCombatUI();
      } catch (error) {
        console.error("Error during combat cleanup:", error);
      }
    }
    
    // 3. Ensure all key UI elements are visible
    for (const element of config.uiElementsToCheck) {
      const el = document.querySelector(element.selector);
      if (el) {
        el.style.display = element.display;
      }
    }
    
    // 4. Hide combat interface
    const combatInterface = document.getElementById('combatInterface');
    if (combatInterface) {
      combatInterface.classList.add('hidden');
      combatInterface.classList.remove('combat-fullscreen');
    }
    
    // 5. Force update action buttons
    try {
      if (window.UI && typeof window.UI.updateActionButtons === 'function') {
        window.UI.updateActionButtons();
      } else if (typeof window.updateActionButtons === 'function') {
        window.updateActionButtons();
      } else {
        // Last resort - manually add some basic buttons
        const actionsContainer = document.getElementById('actions');
        if (actionsContainer) {
          actionsContainer.innerHTML = '';
          
          // Add basic rest button
          const restButton = document.createElement('button');
          restButton.className = 'action-btn';
          restButton.textContent = 'Rest';
          restButton.setAttribute('data-action', 'rest');
          restButton.onclick = function() {
            if (window.ActionSystem) {
              window.ActionSystem.handleAction('rest');
            } else if (typeof window.handleRest === 'function') {
              window.handleRest();
            }
          };
          actionsContainer.appendChild(restButton);
          
          // Add Profile button
          const profileButton = document.createElement('button');
          profileButton.className = 'action-btn';
          profileButton.textContent = 'Profile';
          profileButton.setAttribute('data-action', 'profile');
          profileButton.onclick = function() {
            if (window.UI) {
              window.UI.openPanel('profile');
            } else {
              document.getElementById('profile').classList.remove('hidden');
            }
          };
          actionsContainer.appendChild(profileButton);
        }
      }
    } catch (error) {
      console.error("Error updating action buttons:", error);
    }
    
    // 6. Add recovery notification
    if (window.UI && typeof window.UI.showNotification === 'function') {
      window.UI.showNotification('UI has been recovered successfully', 'success');
    } else if (typeof window.showNotification === 'function') {
      window.showNotification('UI has been recovered successfully', 'success');
    }
    
    // 7. Remove emergency button now that recovery is complete
    removeRecoveryButton();
    
    console.log("UI recovery completed");
  };

  // Set up monitoring for UI issues
  const startMonitoring = function() {
    if (_checkIntervalId !== null) {
      // Already monitoring
      return;
    }
    
    console.log("Starting UI recovery monitoring");
    
    // Initial state save
    saveUiState();
    
    // Regular checks
    _checkIntervalId = setInterval(function() {
      if (isUiBroken()) {
        console.warn("Broken UI state detected!");
        addRecoveryButton();
      } else {
        // UI is good, save the state and remove recovery button if shown
        saveUiState();
        if (_recoveryButtonVisible) {
          removeRecoveryButton();
        }
      }
    }, config.checkInterval);
  };

  // Stop monitoring
  const stopMonitoring = function() {
    if (_checkIntervalId !== null) {
      clearInterval(_checkIntervalId);
      _checkIntervalId = null;
    }
  };
  
  // Enhanced combat exit hook
  const registerCombatExitHook = function() {
    // Store original combat exit function
    let originalEndCombatWithResult = window.endCombatWithResult;
    
    // Override with our enhanced version
    window.endCombatWithResult = function(result) {
      console.log("Enhanced endCombatWithResult called with:", result);
      
      // Call original function but catch any errors
      try {
        if (typeof originalEndCombatWithResult === 'function') {
          originalEndCombatWithResult(result);
        }
      } catch (error) {
        console.error("Error in original endCombatWithResult:", error);
      }
      
      // Always ensure these critical states are reset
      window.gameState.inBattle = false;
      window.gameState.currentEnemy = null;
      
      // Clean up combat UI regardless of what happened above
      setTimeout(function() {
        try {
          if (window.CombatSystem && typeof window.CombatSystem.cleanupCombatUI === 'function') {
            window.CombatSystem.cleanupCombatUI();
          }
        } catch (error) {
          console.error("Error cleaning up combat UI:", error);
        }
        
        // Small delay to wait for any animations or async operations
        setTimeout(function() {
          // Check if we're still broken after cleanup
          if (isUiBroken()) {
            console.warn("UI still broken after combat exit, forcing recovery");
            performFullRecovery();
          }
        }, 500);
      }, 100);
    };
    
    console.log("Combat exit hook registered");
  };
  
  // Register for combat start to capture a good state before combat
  const registerCombatStartHook = function() {
    // Store original combat start function
    let originalStartCombat = window.startCombat;
    
    // Override with our enhanced version
    window.startCombat = function(enemyType, environment) {
      // Save UI state before entering combat
      saveUiState();
      
      console.log("Enhanced startCombat called, saved pre-combat state");
      
      // Call original function
      if (typeof originalStartCombat === 'function') {
        originalStartCombat(enemyType, environment);
      }
    };
    
    console.log("Combat start hook registered");
  };

  // Public API
  return {
    // Initialize the recovery system
    init: function() {
      console.log("Initializing UI Recovery System...");
      
      // Register combat hooks
      registerCombatExitHook();
      registerCombatStartHook();
      
      // Start monitoring
      startMonitoring();
      
      // Add immediate check in case we're already in a broken state
      setTimeout(function() {
        if (isUiBroken()) {
          console.warn("Broken UI state detected during initialization!");
          addRecoveryButton();
        }
      }, 1000);
      
      console.log("UI Recovery System initialized!");
    },
    
    // Manually trigger recovery (can be called from console for testing)
    recover: function() {
      performFullRecovery();
    },
    
    // For debugging
    checkUiState: function() {
      return {
        isBroken: isUiBroken(),
        lastKnownGoodState: _lastKnownGoodState,
        currentState: {
          inBattle: window.gameState.inBattle,
          inMission: window.gameState.inMission,
          actionButtonCount: document.getElementById('actions')?.children.length || 0
        }
      };
    }
  };
})();

// Initialize the recovery system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for other systems to initialize first
  setTimeout(function() {
    window.UIRecoverySystem.init();
  }, 1000);
});
