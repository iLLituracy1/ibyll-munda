// MISSIONS.JS
// Complete event-based mission system that directly replaces the old file

// Create the mission system namespace using immediately-invoked function
window.MissionSystem = (function() {
  // Private state
  let _missionTemplates = {};
  let _currentMission = null;
  let _missionStage = 0;
  let _missionInProgress = false;
  let _missionHistory = [];
  let _missionCooldowns = {};
  let _dialogueStage = 0;
  
  // Private helper functions
  const _logDebug = function(message, data) {
    console.log(`[MissionSystem] ${message}`, data || '');
  };
  
  // Generate a unique mission ID
  const _generateMissionId = function() {
    return 'mission_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  };
  
  // Mission completion handler
  const _completeMission = function(success, rewards) {
    if (!_currentMission) {
      console.warn("No active mission to complete");
      return;
    }
    
    _logDebug('Completing mission:', { mission: _currentMission.title, success });
    
    // Record mission completion in history
    _missionHistory.push({
      id: _currentMission.id,
      title: _currentMission.title,
      type: _currentMission.type,
      success: success,
      completedOn: window.gameState.day
    });
    
    // Limit history size
    if (_missionHistory.length > 20) {
      _missionHistory.shift();
    }
    
    // Distribute rewards if successful
    if (success && rewards) {
      _applyMissionRewards(rewards);
    }
    
    // Apply cooldown
    _missionCooldowns[_currentMission.type] = {
      until: window.gameState.day + (_currentMission.cooldown || 2)
    };
    
    // Reset mission state
    window.gameState.inMission = false;
    window.gameState.currentMission = null;
    window.gameState.missionStage = 0;
    
    _currentMission = null;
    _missionStage = 0;
    _missionInProgress = false;
    _dialogueStage = 0;
    
    // Update UI
    if (window.UI) {
      window.UI.updateStatusBars();
      window.UI.updateActionButtons();
    }
    
    // Update achievement progress
    if (success) {
      window.updateAchievementProgress('mission_master');
    }
  };
  
  // Apply mission rewards
  const _applyMissionRewards = function(rewards) {
    if (!rewards) return;
    
    let rewardText = "You receive:";
    
    // Award experience
    if (rewards.experience) {
      const expGain = rewards.experience;
      window.gameState.experience += expGain;
      rewardText += `\n- ${expGain} experience`;
      
      // Check for level up
      window.checkLevelUp();
    }
    
    // Award taelors (currency)
    if (rewards.taelors) {
      const taelors = rewards.taelors;
      window.player.taelors = (window.player.taelors || 0) + taelors;
      rewardText += `\n- ${taelors} taelors`;
    }
    
    // Award items
    if (rewards.items && rewards.items.length > 0) {
      for (const item of rewards.items) {
        // Check if item should be awarded based on chance
        if (item.chance && Math.random() > item.chance) continue;
        
        // Add item to inventory
        if (!window.player.inventory) {
          window.player.inventory = [];
        }
        window.player.inventory.push({
          name: item.name,
          effect: item.effect || "No special effects",
          value: item.value || 0
        });
        
        rewardText += `\n- ${item.name}`;
      }
    }
    
    // Award relationship changes
    if (rewards.relationships) {
      for (const [npcId, change] of Object.entries(rewards.relationships)) {
        if (!window.player.relationships) {
          window.player.relationships = {};
        }
        if (!window.player.relationships[npcId]) {
          // Use correct name for each NPC ID
          let npcName = npcId;
          if (npcId === "commander") npcName = "Taal'Veyar Thelian";
          else if (npcId === "sergeant") npcName = "Sen'Vaorin Darius";
          else if (npcId === "quartermaster") npcName = "Quartermaster Cealdain";
          
          window.player.relationships[npcId] = { name: npcName, disposition: 0 };
        }
        const currentRelationship = window.player.relationships[npcId];
        if (currentRelationship) {
          const newDisposition = Math.min(100, Math.max(-100, currentRelationship.disposition + change));
          currentRelationship.disposition = newDisposition;
          
          if (change > 0) {
            rewardText += `\n- Improved relationship with ${currentRelationship.name}`;
          } else if (change < 0) {
            rewardText += `\n- Worsened relationship with ${currentRelationship.name}`;
          }
        }
      }
    }
    
    // Show rewards to player
    if (window.setNarrative) {
      addToNarrative(rewardText);
    }
  };
  
  // Generate a mission from a template
  const _generateMission = function(type) {
    // Get the mission template
    const template = _missionTemplates[type];
    if (!template) {
      console.error("Unknown mission type:", type);
      return null;
    }
    
    // Check cooldown
    if (_missionCooldowns[type] && window.gameState.day < _missionCooldowns[type].until) {
      return null;
    }
    
    // Create a new mission instance
    const mission = {
      id: _generateMissionId(),
      type: type,
      title: template.title,
      description: template.description,
      difficulty: template.difficulty,
      stages: template.stages.map(stage => ({ ...stage })), // Deep copy stages
      rewards: { ...template.rewards }, // Copy rewards
      cooldown: template.cooldown || 2
    };
    
    return mission;
  };
  
  // Process the current mission stage
  const _processMissionStage = function() {
    if (!_currentMission || _missionStage >= _currentMission.stages.length) {
      console.warn("No active mission stage to process");
      return;
    }
    
    const stage = _currentMission.stages[_missionStage];
    _logDebug('Processing mission stage:', { stage: _missionStage, type: stage.type });
    
    // Process stage based on type
    switch(stage.type) {
      case 'text':
        _processTextStage(stage);
        break;
      case 'choice':
        _processChoiceStage(stage);
        break;
      case 'combat':
        _processCombatStage(stage);
        break;
      case 'skill_check':
        _processSkillCheckStage(stage);
        break;
      case 'dialogue':
        _processDialogueStage(stage);
        break;
      default:
        console.warn("Unknown mission stage type:", stage.type);
    }
  };
  
  // Process a text stage
  const _processTextStage = function(stage) {
    setNarrative(stage.text);
    
    // Check for continue button
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      const continueBtn = document.createElement('button');
      continueBtn.className = 'action-btn';
      continueBtn.textContent = 'Continue';
      continueBtn.onclick = function() {
        _advanceMissionStage();
      };
      
      actionsContainer.appendChild(continueBtn);
    }
  };
  
  // Process a choice stage
  const _processChoiceStage = function(stage) {
    setNarrative(stage.text);
    
    // Create choice buttons
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      stage.choices.forEach((choice, index) => {
        const choiceBtn = document.createElement('button');
        choiceBtn.className = 'action-btn';
        choiceBtn.textContent = choice.text;
        
        // Check if choice is locked by skill or attribute requirements
        let isLocked = false;
        let lockReason = '';
        
        if (choice.requires) {
          for (const [requirement, value] of Object.entries(choice.requires)) {
            if (requirement === 'phy' || requirement === 'men') {
              // Attribute check
              const playerValue = window.player[requirement] || 0;
              if (playerValue < value) {
                isLocked = true;
                lockReason = `Requires ${requirement === 'phy' ? 'Physical' : 'Mental'} ${value}`;
                break;
              }
            } else if (requirement.startsWith('skills.')) {
              // Skill check
              const skillName = requirement.split('.')[1];
              const playerSkills = window.player.skills || {};
              const playerValue = playerSkills[skillName] || 0;
              if (playerValue < value) {
                isLocked = true;
                lockReason = `Requires ${skillName} ${value}`;
                break;
              }
            }
          }
        }
        
        if (isLocked) {
          choiceBtn.disabled = true;
          choiceBtn.classList.add('disabled');
          choiceBtn.title = lockReason;
          choiceBtn.textContent += ` (${lockReason})`;
        } else {
          choiceBtn.onclick = function() {
            // Process choice outcome
            if (choice.outcome) {
              if (choice.outcome.text) {
                addToNarrative("\n\n" + choice.outcome.text);
              }
              
              if (choice.outcome.goto !== undefined) {
                // Jump to a specific stage
                _missionStage = choice.outcome.goto - 1; // -1 because we'll advance stage after
              }
              
              if (choice.outcome.rewards) {
                _applyMissionRewards(choice.outcome.rewards);
              }
              
              if (choice.outcome.damage) {
                // Apply damage to player
                const currentHealth = window.gameState.health;
                const damage = choice.outcome.damage;
                window.gameState.health = Math.max(1, currentHealth - damage);
                showNotification(`You took ${damage} damage!`, 'damage');
                updateStatusBars();
              }
              
              // Handle special outcomes
              if (choice.outcome.success === true) {
                setTimeout(() => {
                  _completeMission(true, _currentMission.rewards);
                }, 2000);
                return;
              } else if (choice.outcome.success === false) {
                setTimeout(() => {
                  _completeMission(false);
                }, 2000);
                return;
              }
            }
            
            // Advance to next stage
            _advanceMissionStage();
          };
        }
        
        actionsContainer.appendChild(choiceBtn);
      });
    }
  };
  
  // Process a combat stage
  const _processCombatStage = function(stage) {
    setNarrative(stage.text);
    
    // Create initiate combat button
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      const combatBtn = document.createElement('button');
      combatBtn.className = 'action-btn';
      combatBtn.textContent = 'Engage';
      combatBtn.onclick = function() {
        // Set mission combat flag
        window.gameState.inMissionCombat = true;
        
        // Start combat using the appropriate system
        window.startCombat(stage.enemy, stage.environment || null);
        
        // Save original endCombatWithResult function
        if (typeof window.originalEndCombatFunction !== 'function') {
          window.originalEndCombatFunction = window.endCombatWithResult;
          
          // Override endCombatWithResult to handle mission continuation
          window.endCombatWithResult = function(result) {
            // Call original function
            if (typeof window.originalEndCombatFunction === 'function') {
              window.originalEndCombatFunction(result);
            }
            
            // Continue mission after a short delay
            if (window.gameState.inMissionCombat) {
              window.gameState.inMissionCombat = false;
              
              setTimeout(() => {
                window.MissionSystem.continueMissionAfterCombat(result);
              }, 1000);
            }
          };
        }
      };
      
      actionsContainer.appendChild(combatBtn);
    }
  };
  
  // Handle combat result
  const _handleCombatResult = function(result, stage) {
    _logDebug('Handling combat result:', result);
    
    // Process based on result
    if (result === 'victory') {
      if (stage.success) {
        setNarrative(stage.success);
      } else {
        setNarrative("You've emerged victorious from the battle!");
      }
      
      // Advance mission after a short delay
      setTimeout(() => {
        _advanceMissionStage();
      }, 2000);
    } else {
      if (stage.failure) {
        setNarrative(stage.failure);
      } else {
        setNarrative("You've been defeated in battle, but manage to escape with your life.");
      }
      
      // Failed mission
      setTimeout(() => {
        _completeMission(false);
      }, 2000);
    }
  };
  
  // Process a skill check stage
  const _processSkillCheckStage = function(stage) {
    setNarrative(stage.text);
    
    // Create attempt check button
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      const attemptBtn = document.createElement('button');
      attemptBtn.className = 'action-btn';
      attemptBtn.textContent = `Attempt ${stage.skill.charAt(0).toUpperCase() + stage.skill.slice(1)} Check`;
      attemptBtn.onclick = function() {
        _performSkillCheck(stage);
      };
      
      actionsContainer.appendChild(attemptBtn);
    }
  };
  
  // Perform a skill check
  const _performSkillCheck = function(stage) {
    let playerSkill = 0;
    
    // Handle different skill path formats
    if (stage.skill.includes('.')) {
      // Handle paths like "skills.melee"
      const parts = stage.skill.split('.');
      let current = window.player;
      for (const part of parts) {
        current = current[part] || 0;
      }
      playerSkill = current;
    } else if (stage.skill === 'phy' || stage.skill === 'men') {
      // Handle attributes directly
      playerSkill = window.player[stage.skill] || 0;
    } else {
      // Default to skills object
      playerSkill = (window.player.skills || {})[stage.skill] || 0;
    }
    
    // Calculate success chance
    let successChance = playerSkill * 10 + 20; // Base 20% + 10% per skill point
    
    // Apply difficulty modifier
    const difficulty = stage.difficulty || 5;
    successChance -= difficulty * 5;
    
    // Clamp to reasonable range
    successChance = Math.min(95, Math.max(5, successChance));
    
    // Roll for success
    const roll = Math.random() * 100;
    const success = roll <= successChance;
    
    // Show result
    addToNarrative(`\n\nYou attempt to use your ${stage.skill} skill...`);
    
    setTimeout(() => {
      if (success) {
        addToNarrative(`\n\nSuccess! ${stage.success}`);
        
        // Apply rewards if any
        if (stage.rewards) {
          _applyMissionRewards(stage.rewards);
        }
        
        // Advance to next stage after a delay
        setTimeout(() => {
          _advanceMissionStage();
        }, 2000);
      } else {
        addToNarrative(`\n\nFailure. ${stage.failure}`);
        
        if (stage.failureOutcome === 'continue') {
          // Continue to next stage despite failure
          setTimeout(() => {
            _advanceMissionStage();
          }, 2000);
        } else {
          // End mission in failure
          setTimeout(() => {
            _completeMission(false);
          }, 2000);
        }
      }
    }, 1500);
  };
  
  // Process a dialogue stage
  const _processDialogueStage = function(stage) {
    if (!stage.dialogue || stage.dialogue.length === 0) {
      console.warn("Empty dialogue in mission stage");
      _advanceMissionStage();
      return;
    }
    
    // Check if we've gone through all dialogue
    if (_dialogueStage >= stage.dialogue.length) {
      _dialogueStage = 0;
      _advanceMissionStage();
      return;
    }
    
    const dialogue = stage.dialogue[_dialogueStage];
    
    // Set or add to narrative based on dialogue index
    if (_dialogueStage === 0) {
      setNarrative(`${dialogue.speaker}: "${dialogue.text}"`);
    } else {
      addToNarrative(`\n\n${dialogue.speaker}: "${dialogue.text}"`);
    }
    
    // Create continue button
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      const continueBtn = document.createElement('button');
      continueBtn.className = 'action-btn';
      continueBtn.textContent = 'Continue';
      continueBtn.onclick = function() {
        _dialogueStage++;
        _processDialogueStage(stage);
      };
      
      actionsContainer.appendChild(continueBtn);
    }
  };
  
  // Advance to the next mission stage
  const _advanceMissionStage = function() {
    _missionStage++;
    _dialogueStage = 0;
    
    // Check if we've reached the end of the mission
    if (_missionStage >= _currentMission.stages.length) {
      // Mission completed successfully
      _completeMission(true, _currentMission.rewards);
    } else {
      // Process the next stage
      _processMissionStage();
    }
  };

  // Discovery chance calculations for gambling and brawling
  const _calculateDiscoveryChance = function(facility) {
    // Default discovery chance for most origins
    let chance = 0.15; // 15% chance
    
    // If player is from Lunarine, they automatically know
    if (window.player.origin === 'Lunarine') {
      return 1.0; // 100% chance
    }
    
    // Adjust based on skills
    const survivalSkill = (window.player.skills || {}).survival || 0;
    const tacticsSkill = (window.player.skills || {}).tactics || 0;
    
    // Survival helps find places, tactics helps understand their significance
    chance += (survivalSkill * 0.01) + (tacticsSkill * 0.01); // Up to 10% more chance combined if skills are 5 each
    
    return chance;
  };

  // Public API
  return {
    // Initialize the mission system
    init: function() {
      console.log("Initializing mission system...");
      
      // Ensure compatibility with main.js
      if (!window.missionSystem) {
        window.missionSystem = {
          availableMissions: []
        };
      } else if (!window.missionSystem.availableMissions) {
        window.missionSystem.availableMissions = [];
      }
      
      // Register mission templates
      this.registerMissionTemplates();
      
      // Setup data from game state if available
      const currentMissionData = window.gameState.currentMission;
      const missionStage = window.gameState.missionStage;
      const inMission = window.gameState.inMission;
      
      if (inMission && currentMissionData) {
        _currentMission = currentMissionData;
        _missionStage = missionStage || 0;
        _missionInProgress = true;
      }
      
      // Check for facility discovery rolls on first load
      if (!window.gameState.facilitiesRolled) {
        // Roll for gambling tent discovery
        const gamblingChance = _calculateDiscoveryChance('gambling');
        window.gameState.discoveredGamblingTent = Math.random() < gamblingChance;
        
        // Roll for brawler pits discovery
        const brawlerChance = _calculateDiscoveryChance('brawler');
        window.gameState.discoveredBrawlerPits = Math.random() < brawlerChance;
        
        // Mark as rolled so we don't re-roll
        window.gameState.facilitiesRolled = true;
        
        console.log("Facilities discovery rolled:", {
          gambling: window.gameState.discoveredGamblingTent,
          brawler: window.gameState.discoveredBrawlerPits
        });
      }
      
      console.log("Mission system initialized!");
    },
    
    // Get available missions from an NPC
    getAvailableMissionsFrom: function(npcId) {
      const missions = [];
      
      // Filter missions by NPC
      for (const [type, template] of Object.entries(_missionTemplates)) {
        if (template.giver === npcId) {
          // Check cooldown
          if (_missionCooldowns[type] && window.gameState.day < _missionCooldowns[type].until) {
            continue;
          }
          
          missions.push({
            type: type,
            title: template.title,
            description: template.description,
            difficulty: template.difficulty
          });
        }
      }
      
      return missions;
    },
    
    // Check if player can get missions from an NPC
    canGetMissionsFrom: function(npcId) {
      // Check if any missions are available from this NPC
      for (const template of Object.values(_missionTemplates)) {
        if (template.giver === npcId) {
          // Check if mission is on cooldown
          if (_missionCooldowns[template.type] && window.gameState.day < _missionCooldowns[template.type].until) {
            continue;
          }
          
          // Check requirements if any
          if (template.requires) {
            let meetsRequirements = true;
            
            for (const [requirement, value] of Object.entries(template.requires)) {
              if (requirement === 'level') {
                // Check player level
                if (window.gameState.level < value) {
                  meetsRequirements = false;
                  break;
                }
              } else if (requirement === 'reputation') {
                // Check NPC relationship
                const relationship = (window.player.relationships || {})[npcId];
                if (!relationship || relationship.disposition < value) {
                  meetsRequirements = false;
                  break;
                }
              } else {
                // Check other attribute or skill
                let playerValue = 0;
                if (requirement.includes('.')) {
                  // Handle paths like "skills.melee"
                  const parts = requirement.split('.');
                  let current = window.player;
                  for (const part of parts) {
                    current = current[part] || 0;
                  }
                  playerValue = current;
                } else {
                  // Direct property on player
                  playerValue = window.player[requirement] || 0;
                }
                
                if (playerValue < value) {
                  meetsRequirements = false;
                  break;
                }
              }
            }
            
            if (!meetsRequirements) {
              continue;
            }
          }
          
          // If we got here, at least one mission is available
          return true;
        }
      }
      
      return false;
    },
    
    // Start a mission
    startMission: function(type) {
      if (_missionInProgress) {
        console.warn("Cannot start a new mission while one is in progress");
        return false;
      }
      
      // Generate the mission
      const mission = _generateMission(type);
      if (!mission) {
        console.warn("Failed to generate mission of type:", type);
        return false;
      }
      
      // Set mission state
      _currentMission = mission;
      _missionStage = 0;
      _missionInProgress = true;
      _dialogueStage = 0;
      
      // Update game state
      window.gameState.inMission = true;
      window.gameState.currentMission = mission;
      window.gameState.missionStage = 0;
      
      // Start the mission
      _processMissionStage();
      
      return true;
    },
    
    // Register mission templates
    registerMissionTemplates: function() {
      // Register standard mission templates
      _missionTemplates = {
        // Patrol mission
        'patrol': {
          title: "Border Patrol",
          description: "Patrol the border area to ensure no enemy forces are approaching.",
          difficulty: "Easy",
          giver: "sergeant",
          cooldown: 2,
          stages: [
            {
              type: "text",
              text: "Sen'Vaorin Darius hands you a map of the border region. 'We need eyes on the northeast sector. Reports indicate Arrasi movement in that area. Scout it out and report back.'"
            },
            {
              type: "choice",
              text: "You make your way to the northeast sector. The terrain is rocky and visibility is limited. How do you want to proceed?",
              choices: [
                {
                  text: "Take the high ground for better visibility",
                  outcome: {
                    text: "You climb to a vantage point, giving you an excellent view of the surrounding area."
                  }
                },
                {
                  text: "Move stealthily through the underbrush",
                  requires: { "skills.survival": 2 },
                  outcome: {
                    text: "Using your survival skills, you move silently through the underbrush, keeping out of sight."
                  }
                },
                {
                  text: "Patrol the main trail quickly",
                  outcome: {
                    text: "You move at a quick pace down the main trail, covering ground efficiently but making yourself more visible."
                  }
                }
              ]
            },
            {
              type: "text",
              text: "As you patrol the area, you notice signs of recent activity - broken branches, footprints, and disturbed vegetation."
            },
            {
              type: "skill_check",
              text: "There are tracks in the soft ground. Can you determine who left them?",
              skill: "survival",
              difficulty: 4,
              success: "You examine the tracks carefully. These were definitely made by Arrasi scouts - probably a group of three or four that passed through early this morning.",
              failure: "You can tell someone passed through here, but can't determine who or when.",
              failureOutcome: "continue"
            },
            {
              type: "combat",
              text: "As you continue your patrol, you spot movement ahead. Suddenly, an Arrasi scout emerges from behind a rock, weapon drawn!",
              enemy: "arrasi_scout",
              success: "With the scout defeated, you can now return to camp with your report.",
              failure: "You're forced to retreat. The mission is a failure."
            },
            {
              type: "text",
              text: "You return to camp with valuable intelligence about Arrasi movements in the northeast sector."
            }
          ],
          rewards: {
            experience: 50,
            taelors: 25
          }
        },
        
        // Reconnaissance mission
        'recon': {
          title: "Reconnaissance Mission",
          description: "Gather intelligence on enemy positions beyond the river.",
          difficulty: "Medium",
          giver: "commander",
          requires: { "level": 2 },
          cooldown: 3,
          stages: [
            {
              type: "dialogue",
              dialogue: [
                {
                  speaker: "Taal'Veyar Thelian",
                  text: "We need accurate information about Arrasi troop movements beyond the eastern ridge."
                },
                {
                  speaker: "Taal'Veyar Thelian",
                  text: "This is strictly a reconnaissance mission. Avoid engagement if possible."
                },
                {
                  speaker: "You",
                  text: "How close should I get to their positions?"
                },
                {
                  speaker: "Taal'Veyar Thelian",
                  text: "Close enough to count their numbers and identify their equipment, but don't risk detection."
                }
              ]
            },
            {
              type: "text",
              text: "You travel eastward through the dense forest, keeping alert for any signs of enemy patrols."
            },
            {
              type: "choice",
              text: "You reach the river that marks the approach to Arrasi territory. How will you cross?",
              choices: [
                {
                  text: "Use the old bridge to the north",
                  outcome: {
                    text: "You take the bridge, which saves time but might be watched."
                  }
                },
                {
                  text: "Wade across at a shallow point",
                  requires: { "phy": 3 },
                  outcome: {
                    text: "Using your physical strength, you fight the current and make it across the river safely.",
                    rewards: { experience: 10 }
                  }
                },
                {
                  text: "Find a hidden crossing point",
                  requires: { "skills.survival": 3 },
                  outcome: {
                    text: "Your survival skills help you locate a perfect crossing point concealed by overhanging trees.",
                    rewards: { experience: 15 }
                  }
                }
              ]
            },
            {
              type: "skill_check",
              text: "You need to move through Arrasi-controlled territory without being detected.",
              skill: "survival",
              difficulty: 6,
              success: "You navigate carefully through the enemy territory, using natural cover and moving silently.",
              failure: "As you move through the area, you accidentally alert an Arrasi patrol!",
              failureOutcome: "continue"
            },
            {
              type: "choice",
              text: "An Arrasi patrol is headed your way! What do you do?",
              choices: [
                {
                  text: "Hide and let them pass",
                  requires: { "skills.survival": 4 },
                  outcome: {
                    text: "You find perfect concealment and remain perfectly still as the patrol passes just a few feet away from you.",
                    goto: 6
                  }
                },
                {
                  text: "Create a distraction",
                  requires: { "skills.tactics": 3 },
                  outcome: {
                    text: "You throw a rock to create noise away from your position. The patrol investigates the sound, allowing you to slip away.",
                    goto: 6
                  }
                },
                {
                  text: "Prepare for combat",
                  outcome: {
                    text: "You ready your weapon as the patrol spots you."
                  }
                }
              ]
            },
            {
              type: "combat",
              text: "The Arrasi patrol has spotted you! You'll need to fight your way out.",
              enemy: "arrasi_warrior",
              success: "You defeat the patrol, but now you need to complete your mission quickly before reinforcements arrive.",
              failure: "You're overwhelmed by the Arrasi patrol and barely escape with your life."
            },
            {
              type: "text",
              text: "You reach a vantage point overlooking the Arrasi camp. From here, you can observe their forces without being detected."
            },
            {
              type: "skill_check",
              text: "You need to accurately assess the Arrasi forces from your observation point.",
              skill: "tactics",
              difficulty: 5,
              success: "You carefully count their numbers, identify their weapons, and note the positions of their officers. This is valuable intelligence.",
              failure: "You gather some basic information, but can't make detailed observations about their forces.",
              failureOutcome: "continue"
            },
            {
              type: "text",
              text: "With your mission complete, you carefully make your way back to camp to report your findings."
            }
          ],
          rewards: {
            experience: 75,
            taelors: 40,
            items: [
              { name: "Tactical Map", chance: 0.8, value: 30 }
            ],
            relationships: {
              "commander": 5
            }
          }
        },
        
        // Supply mission for Quartermaster
        'supplies': {
          title: "Supply Procurement",
          description: "Secure vital supplies for the Kasvaari camp.",
          difficulty: "Easy",
          giver: "quartermaster",
          cooldown: 2,
          stages: [
            {
              type: "dialogue",
              dialogue: [
                {
                  speaker: "Quartermaster Cealdain",
                  text: "Our medical supplies are running low. We need you to gather some medicinal herbs from the eastern forest."
                },
                {
                  speaker: "You",
                  text: "What exactly am I looking for?"
                },
                {
                  speaker: "Quartermaster Cealdain",
                  text: "Redleaf and bitterroot. Both grow near the streams. Be careful though, the area might have Arrasi patrols."
                }
              ]
            },
            {
              type: "text",
              text: "You make your way to the eastern forest. The area is lush and vibrant, with the sound of flowing water in the distance."
            },
            {
              type: "skill_check",
              text: "You need to find the medicinal herbs. Can you identify them among the forest vegetation?",
              skill: "survival",
              difficulty: 3,
              success: "You easily spot clusters of redleaf growing near the stream banks, and discover patches of bitterroot under the shade of large trees.",
              failure: "You spend a long time searching but struggle to distinguish the medicinal herbs from other similar-looking plants.",
              failureOutcome: "continue"
            },
            {
              type: "choice",
              text: "While gathering herbs, you hear voices nearby. It sounds like an Arrasi patrol.",
              choices: [
                {
                  text: "Hide and wait for them to pass",
                  outcome: {
                    text: "You quickly hide behind thick vegetation and remain still as the patrol passes by, unaware of your presence."
                  }
                },
                {
                  text: "Climb a tree for better observation",
                  requires: { "phy": 2 },
                  outcome: {
                    text: "You climb a tall tree and observe the patrol from above. They're just a small scouting group, and they soon leave the area.",
                    rewards: { experience: 10 }
                  }
                },
                {
                  text: "Retreat to another area",
                  outcome: {
                    text: "You quietly move to another part of the forest to continue gathering herbs, avoiding potential conflict."
                  }
                }
              ]
            },
            {
              type: "text",
              text: "After collecting a substantial amount of medicinal herbs, you begin your return journey to the Kasvaari camp."
            },
            {
              type: "text",
              text: "You deliver the herbs to Quartermaster Cealdain, who immediately begins processing them for the medical supplies."
            }
          ],
          rewards: {
            experience: 40,
            taelors: 20,
            relationships: {
              "quartermaster": 5
            }
          }
        }
      };
    },
    
    // Update mission cooldowns (called at day change)
    updateCooldowns: function() {
      // Nothing to do if no cooldowns
      if (Object.keys(_missionCooldowns).length === 0) return;
      
      const currentDay = window.gameState.day;
      
      // Remove expired cooldowns
      for (const [missionType, cooldown] of Object.entries(_missionCooldowns)) {
        if (currentDay >= cooldown.until) {
          delete _missionCooldowns[missionType];
        }
      }
    },
    
    // Continue mission after combat (for backward compatibility)
    continueMissionAfterCombat: function(result) {
      if (!_missionInProgress || !_currentMission) {
        console.warn("No active mission to continue after combat");
        return;
      }
      
      // Get the current stage
      const stage = _currentMission.stages[_missionStage];
      if (stage.type !== 'combat') {
        console.warn("Current mission stage is not combat");
        return;
      }
      
      // Handle the combat result
      _handleCombatResult(result, stage);
    },
    
    // Generate available missions for compatibility with main.js
    generateAvailableMissions: function() {
      console.log("Generating available missions");
      
      // Make sure missionSystem is set up for backward compatibility
      if (!window.missionSystem) {
        window.missionSystem = {};
      }
      
      // Ensure the array exists
      window.missionSystem.availableMissions = window.missionSystem.availableMissions || [];
      
      // This function is called by the old code - we can just make sure templates are registered
      this.registerMissionTemplates();
      
      return true;
    },
    
    // Getters for external access
    getCurrentMission: function() {
      return _currentMission;
    },
    
    getMissionHistory: function() {
      return _missionHistory;
    },
    
    getMissionCooldowns: function() {
      return _missionCooldowns;
    }
  };
})();

// Initialize the mission system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Create missionSystem object immediately if it doesn't exist
  window.missionSystem = window.missionSystem || {};
  window.missionSystem.availableMissions = window.missionSystem.availableMissions || [];
  
  // Generate missions for compatibility
  if (window.MissionSystem && typeof window.MissionSystem.generateAvailableMissions === 'function') {
    window.MissionSystem.generateAvailableMissions();
  }
  
  // Initialize the system
  window.MissionSystem.init();
});

// Enhanced Training Button Implementation
window.handleTrain = function() {
  // Check time of day - can only train during day and dawn
  const timeOfDay = window.getTimeOfDay();
  if (timeOfDay !== 'day' && timeOfDay !== 'dawn') {
    showNotification("It's too late to train. Come back tomorrow during daylight hours.", 'warning');
    return;
  }
  
  // Check daily training limit
  if (window.gameState.dailyTrainingCount >= 3) {
    showNotification("You've already trained enough today. Your muscles need rest.", 'warning');
    return;
  }
  
  // Check stamina
  if (window.gameState.stamina < 25) {
    showNotification("You're too exhausted to train effectively. Rest first.", 'warning');
    return;
  }
  
  // Choose training type
  const trainingOptions = document.createElement('div');
  trainingOptions.className = 'training-options';
  
  // Get current attributes and their limits
  const currentPhy = Number(window.player.phy);
  const currentMen = Number(window.player.men);
  const phyCap = 15;
  const menCap = 15;
  
  // Create enhanced physical training option
  const phyOption = document.createElement('button');
  phyOption.className = 'action-btn';
  phyOption.innerHTML = `💪 Physical Training <span class="attribute-display">(PHY: ${currentPhy.toFixed(2)}/${phyCap})</span>`;
  
  if (currentPhy >= phyCap) {
    phyOption.disabled = true;
    phyOption.title = "You've reached the maximum physical attribute level.";
    phyOption.classList.add('disabled');
  }
  
  phyOption.onclick = function() {
    handleAttributeTraining('phy', 25, phyCap);
  };
  
  // Create enhanced mental training option
  const menOption = document.createElement('button');
  menOption.className = 'action-btn';
  menOption.innerHTML = `🧠 Mental Training <span class="attribute-display">(MEN: ${currentMen.toFixed(2)}/${menCap})</span>`;
  
  if (currentMen >= menCap) {
    menOption.disabled = true;
    menOption.title = "You've reached the maximum mental attribute level.";
    menOption.classList.add('disabled');
  }
  
  menOption.onclick = function() {
    handleAttributeTraining('men', 20, menCap);
  };
  
  // Create enhanced skills training option
  const skillsOption = document.createElement('button');
  skillsOption.className = 'action-btn';
  skillsOption.innerHTML = `🎯 Skills Training <span class="skills-note">Improve combat & survival skills</span>`;
  skillsOption.onclick = function() {
    handleSkillsTraining();
  };
  
  // Cancel button
  const cancelOption = document.createElement('button');
  cancelOption.className = 'action-btn cancel-btn';
  cancelOption.textContent = 'Cancel';
  cancelOption.onclick = function() {
    setNarrative("You decide not to train right now.");
    
    // Restore regular action buttons
    updateActionButtons();
  };
  
  // Add options to container
  trainingOptions.appendChild(phyOption);
  trainingOptions.appendChild(menOption);
  trainingOptions.appendChild(skillsOption);
  trainingOptions.appendChild(cancelOption);
  
  // Replace action buttons with training options
  const actionsContainer = document.getElementById('actions');
  if (actionsContainer) {
    actionsContainer.innerHTML = '';
    actionsContainer.appendChild(trainingOptions);
  }
  
  // Update narrative
  setNarrative("What type of training would you like to focus on?");
};

// Gambling Tent Implementation
window.handleGambling = function() {
  // Check time of day - only available in evening and night
  const timeOfDay = window.getTimeOfDay();
  if (timeOfDay !== 'evening' && timeOfDay !== 'night') {
    showNotification("The gambling tent is not open during the day.", 'warning');
    return;
  }
  
  // Check if player has discovered the gambling tent
  if (!window.gameState.discoveredGamblingTent) {
    showNotification("You don't know where the gambling tent is located.", 'warning');
    return;
  }
  
  // Show gambling options
  showGamblingOptions();
};

// Show gambling options
function showGamblingOptions() {
  setNarrative("You enter a dimly lit tent on the outskirts of camp. Inside, soldiers gather around makeshift tables, trying their luck at games of chance. The air is thick with excitement and tension.");
  
  const actionsContainer = document.getElementById('actions');
  if (!actionsContainer) return;
  
  actionsContainer.innerHTML = '';
  
  // Add gambling options
  addActionButton('🃏 Card Game - Higher Card Wins', 'play_cards', actionsContainer);
  addActionButton('🎲 Dice Game - Lucky Sevens', 'play_dice', actionsContainer);
  
  // Add back button
  addActionButton('← Return to Camp', 'back_from_gambling', actionsContainer);
}

// Process gambling action
window.handleAction = window.handleAction || function() {};
const originalHandleAction = window.handleAction;
window.handleAction = function(action) {
  // Handle special gambling and brawling actions
  if (action === 'play_cards' || action === 'play_dice') {
    showGamblingGame(action);
    return;
  } else if (action === 'back_from_gambling') {
    setNarrative("You leave the gambling tent and return to the main camp area.");
    updateActionButtons();
    return;
  } else if (action === 'back_from_brawler') {
    setNarrative("You leave the brawler pits and return to the main camp area.");
    updateActionButtons();
    return;
  } else if (action === 'novice_match' || action === 'standard_match' || action === 'veteran_match') {
    handleBrawl(action);
    return;
  }
  
  // For all other actions, use the original handler
  originalHandleAction(action);
};

// Show gambling game interface
function showGamblingGame(action) {
  const actionsContainer = document.getElementById('actions');
  if (!actionsContainer) return;
  
  actionsContainer.innerHTML = '';
  
  // Create game interface elements
  const gameTitle = document.createElement('h3');
  
  const bettingContainer = document.createElement('div');
  bettingContainer.className = 'betting-container';
  bettingContainer.innerHTML = `
    <div class="betting-label">Your taelors: ${window.player.taelors}</div>
    <div class="betting-input-group">
      <label for="betAmount">Bet amount:</label>
      <input type="number" id="betAmount" min="1" max="${window.player.taelors}" value="5">
    </div>
  `;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  
  const confirmButton = document.createElement('button');
  confirmButton.className = 'action-btn confirm-btn';
  confirmButton.textContent = 'Place Bet';
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'action-btn cancel-btn';
  cancelButton.textContent = 'Cancel';
  
  buttonContainer.appendChild(confirmButton);
  buttonContainer.appendChild(cancelButton);
  
  // Update based on game type
  if (action === 'play_cards') {
    gameTitle.textContent = 'Card Game - Higher Card Wins';
    setNarrative("You approach a table where soldiers are playing a simple card game. Each player draws a card from the deck, and the highest card wins. Aces are high, and ties result in a draw with bets returned.");
  } else if (action === 'play_dice') {
    gameTitle.textContent = 'Dice Game - Lucky Sevens';
    setNarrative("The dice game is simple but popular. Each player rolls two dice, aiming for a sum of seven. If you roll a seven, you win double your bet. If you roll a sum of 2 or 12, you lose everything. Any other number means you lose your bet.");
  }
  
  // Add to DOM
  actionsContainer.appendChild(gameTitle);
  actionsContainer.appendChild(bettingContainer);
  actionsContainer.appendChild(buttonContainer);
  
  // Add event listeners
  confirmButton.addEventListener('click', function() {
    const betInput = document.getElementById('betAmount');
    if (!betInput) return;
    
    const betAmount = parseInt(betInput.value);
    
    // Check if bet is valid
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > window.player.taelors) {
      showNotification("Please enter a valid bet amount.", 'warning');
      return;
    }
    
    // Process the bet
    processGambling(action, betAmount);
  });
  
  cancelButton.addEventListener('click', function() {
    // Return to gambling options
    showGamblingOptions();
  });
}

// Process gambling outcome
function processGambling(gameType, betAmount) {
  // Deduct the bet amount
  window.player.taelors -= betAmount;
  
  let outcome = "";
  let winnings = 0;
  
  if (gameType === 'play_cards') {
    // Card game logic
    const playerCard = Math.floor(Math.random() * 13) + 1; // 1-13 (Ace to King)
    const opponentCard = Math.floor(Math.random() * 13) + 1;
    
    const cardNames = {
      1: "Ace", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 
      8: "8", 9: "9", 10: "10", 11: "Jack", 12: "Queen", 13: "King"
    };
    
    if (playerCard > opponentCard) {
      // Win
      winnings = betAmount * 2;
      outcome = `You draw a ${cardNames[playerCard]} while your opponent draws a ${cardNames[opponentCard]}. You win ${winnings} taelors!`;
      showNotification(`You won ${winnings} taelors!`, 'success');
    } else if (playerCard < opponentCard) {
      // Lose
      outcome = `You draw a ${cardNames[playerCard]} while your opponent draws a ${cardNames[opponentCard]}. You lose your bet of ${betAmount} taelors.`;
      showNotification(`You lost ${betAmount} taelors!`, 'warning');
    } else {
      // Tie
      winnings = betAmount; // Return the bet
      outcome = `You both draw a ${cardNames[playerCard]}. It's a tie! Your bet is returned.`;
      showNotification(`It's a tie! Bet returned.`, 'info');
    }
  } else if (gameType === 'play_dice') {
    // Dice game logic
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const diceSum = dice1 + dice2;
    
    if (diceSum === 7) {
      // Win
      winnings = betAmount * 2;
      outcome = `You roll a ${dice1} and a ${dice2}, summing to 7. A perfect roll! You win ${winnings} taelors!`;
      showNotification(`Lucky Seven! You won ${winnings} taelors!`, 'success');
    } else if (diceSum === 2 || diceSum === 12) {
      // Lose everything
      outcome = `You roll a ${dice1} and a ${dice2}, summing to ${diceSum}. Snake eyes! You lose your bet of ${betAmount} taelors.`;
      showNotification(`Unlucky roll! You lost ${betAmount} taelors!`, 'warning');
    } else {
      // Lose bet
      outcome = `You roll a ${dice1} and a ${dice2}, summing to ${diceSum}. Not a seven! You lose your bet of ${betAmount} taelors.`;
      showNotification(`No luck! You lost ${betAmount} taelors!`, 'warning');
    }
  }
  
  // Add winnings to player's taelors
  window.player.taelors += winnings;
  
  // Update narrative
  addToNarrative("\n\n" + outcome);
  
  // Return to gambling options after a short delay
  setTimeout(function() {
    showGamblingOptions();
  }, 2000);
}

// Brawler Pits Implementation
window.handleBrawlerPits = function() {
  // Check time of day - only available in evening and night
  const timeOfDay = window.getTimeOfDay();
  if (timeOfDay !== 'evening' && timeOfDay !== 'night') {
    showNotification("The brawler pits are not active during the day.", 'warning');
    return;
  }
  
  // Check if player has discovered the brawler pits
  if (!window.gameState.discoveredBrawlerPits) {
    showNotification("You don't know where the brawler pits are located.", 'warning');
    return;
  }
  
  // Show brawler pit options
  showBrawlerPitOptions();
};

// Show brawler pit options
function showBrawlerPitOptions() {
  setNarrative("You approach the brawler pits on the edge of camp. A makeshift arena has been constructed, surrounded by cheering soldiers. The fights are brutal but organized, with clear rules and bets placed on the outcomes.");
  
  const actionsContainer = document.getElementById('actions');
  if (!actionsContainer) return;
  
  actionsContainer.innerHTML = '';
  
  // Add brawler pit options with buy-in amounts
  addActionButton('👊 Novice Match (10 taelors buy-in)', 'novice_match', actionsContainer);
  addActionButton('⚔️ Standard Match (25 taelors buy-in)', 'standard_match', actionsContainer);
  addActionButton('🔥 Veteran Match (50 taelors buy-in)', 'veteran_match', actionsContainer);
  
  // Add watch option
  addActionButton('👁️ Watch the Fights', 'watch_fights', actionsContainer);
  
  // Add back button
  addActionButton('← Return to Camp', 'back_from_brawler', actionsContainer);
}

// Handle brawler pit activities
function handleBrawl(action) {
  // Check stamina requirement
  if (window.gameState.stamina < 30) {
    showNotification("You're too exhausted to fight in the pits. Rest first.", 'warning');
    showBrawlerPitOptions();
    return;
  }
  
  // Determine buy-in amount and difficulty
  let buyIn = 0;
  let difficultyMod = 0;
  let matchType = "";
  
  if (action === 'novice_match') {
    buyIn = 10;
    difficultyMod = 0;
    matchType = "Novice";
  } else if (action === 'standard_match') {
    buyIn = 25;
    difficultyMod = 0.25;
    matchType = "Standard";
  } else if (action === 'veteran_match') {
    buyIn = 50;
    difficultyMod = 0.5;
    matchType = "Veteran";
  }
  
  // Check if player has enough taelors
  if (window.player.taelors < buyIn) {
    showNotification(`You don't have enough taelors for the ${matchType} match.`, 'warning');
    showBrawlerPitOptions();
    return;
  }
  
  // Deduct buy-in amount
  window.player.taelors -= buyIn;
  
  // Deduct stamina
  window.gameState.stamina -= 30;
  
  // Process the brawl
  processBrawl(matchType, buyIn, difficultyMod);
}

// Process brawl outcome
function processBrawl(matchType, buyIn, difficultyMod) {
  // Determine opponent based on match type
  let opponentName, opponentSkill, opponentStrength;
  
  if (matchType === "Novice") {
    opponentName = "Midan, a young recruit";
    opponentSkill = 2 + Math.random() * 2; // 2-4
    opponentStrength = 3 + Math.random() * 2; // 3-5
  } else if (matchType === "Standard") {
    opponentName = "Cavanath, a seasoned fighter";
    opponentSkill = 4 + Math.random() * 3; // 4-7
    opponentStrength = 5 + Math.random() * 3; // 5-8
  } else if (matchType === "Veteran") {
    opponentName = "Dralka the Scarred, camp champion";
    opponentSkill = 7 + Math.random() * 4; // 7-11
    opponentStrength = 8 + Math.random() * 4; // 8-12
  }
  
  // Show fight beginning
  setNarrative(`You step into the pit to face ${opponentName}. The crowd forms a circle around you, cheering and placing bets.`);
  
  // Calculate player's combat effectiveness
  const playerMelee = window.player.skills?.melee || 0;
  const playerStrength = window.player.phy || 0;
  
  // Apply difficulty modifier to opponent
  opponentSkill *= (1 + difficultyMod);
  opponentStrength *= (1 + difficultyMod);
  
  // Calculate success chance
  let baseChance = 50 + (playerMelee * 5) + (playerStrength * 3) - (opponentSkill * 5) - (opponentStrength * 2);
  baseChance = Math.min(90, Math.max(10, baseChance)); // Clamp between 10% and 90%
  
  // Roll for fight outcome
  const roll = Math.random() * 100;
  
  // Add a slight delay for suspense
  setTimeout(function() {
    addToNarrative("\n\nThe fight begins, both of you circling each other cautiously...");
    
    // Process based on match type and roll
    setTimeout(function() {
      let outcome, reward, expGain;
      
      if (roll <= baseChance) {
        // Victory
        if (matchType === "Novice") {
          reward = buyIn * 2;
          expGain = 15;
          outcome = `\n\nYou outmaneuver ${opponentName} with a quick series of strikes. After a brief exchange, your opponent yields. The crowd cheers as you're declared the winner!`;
        } else if (matchType === "Standard") {
          reward = buyIn * 2.5;
          expGain = 30;
          outcome = `\n\nThe fight with ${opponentName} is intense. After trading several hard blows, you find an opening and deliver a decisive strike. Your opponent falls to one knee and concedes the match.`;
        } else {
          reward = buyIn * 3;
          expGain = 50;
          outcome = `\n\nFacing ${opponentName} is a true test of skill. The champion is as fearsome as the stories say. But today, your determination prevails. After a grueling contest, you manage to overpower your opponent and claim a hard-earned victory.`;
        }
        
        // Award rewards
        window.player.taelors += reward;
        window.gameState.experience += expGain;
        
        // Show notifications
        showNotification(`You won ${reward} taelors!`, 'success');
        showNotification(`You gained ${expGain} experience!`, 'success');
        
        // Check for level up
        window.checkLevelUp();
        
      } else {
        // Defeat
        if (matchType === "Novice") {
          expGain = 5;
          outcome = `\n\nDespite your efforts, ${opponentName} proves to be more skilled than you anticipated. The young recruit catches you off guard with a quick maneuver, and you find yourself pinned down. You concede the match.`;
        } else if (matchType === "Standard") {
          expGain = 10;
          outcome = `\n\n${opponentName} lives up to their reputation. After a competitive start, your opponent finds an opening and lands a powerful blow that sends you staggering. You're unable to recover your footing and must yield.`;
        } else {
          expGain = 15;
          outcome = `\n\n${opponentName} shows why they're the camp champion. The veteran fighter reads your every move and counters with devastating precision. After a valiant effort, you're thoroughly outmatched and forced to concede.`;
        }
        
        // Award experience for trying
        window.gameState.experience += expGain;
        
        // Show notifications
        showNotification(`You lost the match and your buy-in of ${buyIn} taelors.`, 'warning');
        showNotification(`You gained ${expGain} experience from the fight.`, 'info');
        
        // Check for level up
        window.checkLevelUp();
      }
      
      // Apply skill gain regardless of outcome
      const meleeGain = 0.2 + (difficultyMod * 0.3); // More skill gain from harder fights
      const currentMelee = window.player.skills?.melee || 0;
      const meleeCap = Math.floor((window.player.phy || 0) / 1.5);
      
      if (!window.player.skills) window.player.skills = {};
      window.player.skills.melee = Math.min(meleeCap, currentMelee + meleeGain);
      
      // Apply health reduction (more for losses, less for wins)
      const healthLoss = roll <= baseChance ? 5 + (10 * difficultyMod) : 15 + (15 * difficultyMod);
      window.gameState.health = Math.max(1, window.gameState.health - healthLoss);
      
      // Update UI
      updateStatusBars();
      
      // Add outcome to narrative
      addToNarrative(outcome);
      
      // Return to brawler options after a delay
      setTimeout(function() {
        showBrawlerPitOptions();
      }, 3000);
    }, 1500);
  }, 1500);
}

// Handle watch fights option
window.handleAction = function(action) {
  if (action === 'watch_fights') {
    // Add time (1 hour)
    window.updateTimeAndDay(60);
    
    // Small amount of experience from observing techniques
    const expGain = 5;
    window.gameState.experience += expGain;
    
    // Update UI
    updateStatusBars();
    
    // Set narrative
    setNarrative("You spend an hour watching the fights, studying the techniques of the various combatants. It's entertaining and educational at the same time. You notice how the more experienced fighters use feints and leverage to overcome stronger opponents.");
    
    // Give a small melee skill boost
    if (!window.player.skills) window.player.skills = {};
    const currentMelee = window.player.skills.melee || 0;
    const meleeCap = Math.floor((window.player.phy || 0) / 1.5);
    window.player.skills.melee = Math.min(meleeCap, currentMelee + 0.1);
    
    showNotification(`Gained ${expGain} experience from observing fights.`, 'success');
    
    // Check for level up
    window.checkLevelUp();
    
    // Return to options after a delay
    setTimeout(function() {
      showBrawlerPitOptions();
    }, 2000);
    return;
  }
  
  // Call original handler for other actions
  originalHandleAction(action);
};

// Backward compatibility functions
window.getMissionsByNPC = function(npcId) {
  if (window.MissionSystem && typeof window.MissionSystem.getAvailableMissionsFrom === 'function') {
    return window.MissionSystem.getAvailableMissionsFrom(npcId);
  }
  return [];
};

window.startMission = function(type) {
  if (window.MissionSystem && typeof window.MissionSystem.startMission === 'function') {
    return window.MissionSystem.startMission(type);
  }
  return false;
};

window.updateMissionCooldowns = function() {
  if (window.MissionSystem && typeof window.MissionSystem.updateCooldowns === 'function') {
    window.MissionSystem.updateCooldowns();
  }
};

window.continueMissionAfterCombat = function(result) {
  if (window.MissionSystem && typeof window.MissionSystem.continueMissionAfterCombat === 'function') {
    window.MissionSystem.continueMissionAfterCombat(result);
  }
};

// Add a helper function for adding action buttons (for code reuse)
function addActionButton(label, action, container) {
  if (!container) return;
  
  const btn = document.createElement('button');
  btn.className = 'action-btn';
  btn.textContent = label;
  btn.setAttribute('data-action', action);
  btn.onclick = function() {
    handleAction(action);
  };
  container.appendChild(btn);
}
