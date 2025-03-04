// ACTION SYSTEM MODULE
// Handles all player actions outside of combat

// Create the action system namespace
window.ActionSystem = (function() {
  // Private helper functions
  const _logDebug = function(message, data) {
    console.log(`[ActionSystem] ${message}`, data || '');
  };
  
  // Central error handling with fallbacks
  const _safelyUpdateUI = function(updateFunction, fallbackMessage) {
    try {
      if (typeof updateFunction === 'function') {
        updateFunction();
      }
    } catch (error) {
      console.error(`[ActionSystem] UI Update Error: ${error.message}`);
      if (fallbackMessage && window.UI) {
        window.UI.showNotification(fallbackMessage, 'error');
      }
    }
  };
  
  // Action handler for rest function with improved error handling and stamina bug fix
  const _handleRest = function() {
    _logDebug('Starting rest action');
    
    // Get current time and calculate rest duration
    const currentTime = window.GameState.get('time');
    const currentHealth = Number(window.GameState.get('health'));
    const maxHealth = Number(window.GameState.get('maxHealth'));
    const currentStamina = Number(window.GameState.get('stamina'));
    const maxStamina = Number(window.GameState.get('maxStamina'));
    
    // Log values before rest for debugging
    _logDebug('Before rest - Stamina:', { current: currentStamina, max: maxStamina });
    _logDebug('Before rest - Health:', { current: currentHealth, max: maxHealth });
    
    let restHours;
    
    if (currentTime >= 1320 || currentTime < 360) {
      // Night rest (10PM-6AM) - rest until 6AM
      restHours = (360 - (currentTime % 1440) + 1440) % 1440 / 60;
    } else {
      // Day rest - 2 hours
      restHours = 2;
    }
    
    // Calculate health and stamina recovery
    const healthRecovery = Math.min(
      maxHealth - currentHealth,
      Math.floor(restHours * (maxHealth * 0.1))
    );
    
    const staminaRecovery = Math.min(
      maxStamina - currentStamina,
      Math.floor(restHours * (maxStamina * 0.15))
    );
    
    // Use explicit Number conversions to avoid string concatenation issues
    const newHealth = Math.min(maxHealth, Number(currentHealth) + Number(healthRecovery));
    const newStamina = Math.min(maxStamina, Number(currentStamina) + Number(staminaRecovery));
    
    // Set new values
    window.GameState.set('health', newHealth);
    window.GameState.set('stamina', newStamina);
    
    // Update time (in minutes)
    window.updateTimeAndDay(restHours * 60);
    
    // Log values after rest for debugging
    _logDebug('After rest - Stamina:', { 
      before: currentStamina, 
      recovery: staminaRecovery, 
      after: newStamina 
    });
    _logDebug('After rest - Health:', { 
      before: currentHealth, 
      recovery: healthRecovery, 
      after: newHealth 
    });
    
    // Verify that stamina didn't decrease
    if (newStamina < currentStamina) {
      console.error('Stamina decreased after rest! This should never happen.');
      // Force correct stamina value
      window.GameState.set('stamina', Math.max(currentStamina, newStamina));
    }
    
    // Update UI
    _safelyUpdateUI(() => {
      if (window.UI) {
        window.UI.updateStatusBars();
        
        const message = restHours >= 6 
          ? `You sleep for ${Math.floor(restHours)} hours and feel completely refreshed.` 
          : `You rest for ${Math.floor(restHours)} hours and recover some energy.`;
        
        window.UI.setNarrative(message);
        
        if (healthRecovery > 0 && staminaRecovery > 0) {
          window.UI.showNotification(`Recovered ${healthRecovery} health and ${staminaRecovery} stamina.`, 'health');
        } else if (healthRecovery > 0) {
          window.UI.showNotification(`Recovered ${healthRecovery} health.`, 'health');
        } else if (staminaRecovery > 0) {
          window.UI.showNotification(`Recovered ${staminaRecovery} stamina.`, 'health');
        }
      }
    }, 'You rest and recover some energy.');
  };
  
  // Improved training function with better attribute limit notifications
  const _handleTrain = function() {
    _logDebug('Starting training action');
    
    // Check time of day - can only train during day and dawn
    const timeOfDay = window.getTimeOfDay();
    if (timeOfDay !== 'day' && timeOfDay !== 'dawn') {
      if (window.UI) {
        window.UI.showNotification("It's too late to train. Come back tomorrow during daylight hours.", 'warning');
      }
      return;
    }
    
    // Check daily training limit
    const dailyTrainingCount = Number(window.GameState.get('dailyTrainingCount') || 0);
    if (dailyTrainingCount >= 3) {
      if (window.UI) {
        window.UI.showNotification("You've already trained enough today. Your muscles need rest.", 'warning');
      }
      return;
    }
    
    // Check stamina
    const currentStamina = Number(window.GameState.get('stamina'));
    if (currentStamina < 25) {
      if (window.UI) {
        window.UI.showNotification("You're too exhausted to train effectively. Rest first.", 'warning');
      }
      return;
    }
    
    // Choose training type
    const trainingOptions = document.createElement('div');
    trainingOptions.className = 'training-options';
    
    // Get current attributes and their limits
    const currentPhy = Number(window.Player.get('phy'));
    const currentMen = Number(window.Player.get('men'));
    const phyCap = 15;
    const menCap = 15;
    
    // Create physical training option with clear cap information
    const phyOption = document.createElement('button');
    phyOption.className = 'action-btn';
    phyOption.textContent = `Physical Training (PHY: ${currentPhy.toFixed(2)}/${phyCap})`;
    
    if (currentPhy >= phyCap) {
      phyOption.disabled = true;
      phyOption.title = "You've reached the maximum physical attribute level.";
      phyOption.classList.add('disabled');
    }
    
    phyOption.onclick = function() {
      _handleAttributeTraining('phy', 25, phyCap);
    };
    
    // Create mental training option with clear cap information
    const menOption = document.createElement('button');
    menOption.className = 'action-btn';
    menOption.textContent = `Mental Training (MEN: ${currentMen.toFixed(2)}/${menCap})`;
    
    if (currentMen >= menCap) {
      menOption.disabled = true;
      menOption.title = "You've reached the maximum mental attribute level.";
      menOption.classList.add('disabled');
    }
    
    menOption.onclick = function() {
      _handleAttributeTraining('men', 20, menCap);
    };
    
    // Create skills training option
    const skillsOption = document.createElement('button');
    skillsOption.className = 'action-btn';
    skillsOption.textContent = 'Skills Training';
    skillsOption.onclick = function() {
      _handleSkillsTraining();
    };
    
    // Cancel button
    const cancelOption = document.createElement('button');
    cancelOption.className = 'action-btn cancel-btn';
    cancelOption.textContent = 'Cancel';
    cancelOption.onclick = function() {
      if (window.UI) {
        window.UI.setNarrative("You decide not to train right now.");
        
        // Restore regular action buttons
        _safelyUpdateUI(() => {
          window.UI.updateActionButtons();
        });
      }
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
    if (window.UI) {
      window.UI.setNarrative("What type of training would you like to focus on?");
    }
  };
  
  // Handle attribute training with improved cap notifications
  const _handleAttributeTraining = function(attribute, staminaCost, cap) {
    _logDebug(`Starting ${attribute} training`);
    
    // Get current value
    const currentValue = Number(window.Player.get(attribute));
    _logDebug('Current attribute value:', currentValue);
    
    // Check if already at cap
    if (currentValue >= cap) {
      if (window.UI) {
        window.UI.showNotification(`Your ${attribute === 'phy' ? 'physical' : 'mental'} attributes have reached their maximum (${cap}).`, 'warning');
        window.UI.setNarrative(`You've reached the peak of your ${attribute === 'phy' ? 'physical' : 'mental'} capabilities. There's nothing more to gain from this type of training.`);
      }
      return;
    }
    
    // Deduct stamina
    const currentStamina = Number(window.GameState.get('stamina'));
    if (currentStamina < staminaCost) {
      if (window.UI) {
        window.UI.showNotification("You're too exhausted to train effectively.", 'warning');
      }
      return;
    }
    
    window.GameState.set('stamina', currentStamina - staminaCost);
    
    // Calculate training progress
    let baseGain = 0.2;
    
    // Diminishing returns as attribute gets higher
    const diminishingFactor = 1 - (currentValue / cap * 0.8);
    const gainWithDiminishing = baseGain * diminishingFactor;
    
    // Apply career bonuses if applicable
    let careerBonus = 1.0;
    if (window.Player.get('career')) {
      const career = window.Player.get('career');
      if (attribute === 'phy' && career.phyBonus) {
        careerBonus = career.phyBonus;
      } else if (attribute === 'men' && career.menBonus) {
        careerBonus = career.menBonus;
      }
    }
    
    // Calculate final gain
    const finalGain = gainWithDiminishing * careerBonus;
    
    // Apply gain, ensuring we don't exceed cap
    const newValue = Math.min(cap, currentValue + finalGain);
    window.Player.set(attribute, newValue);
    
    // Update daily training count
    window.GameState.set('dailyTrainingCount', Number(window.GameState.get('dailyTrainingCount')) + 1);
    
    // Add time (2 hours)
    window.updateTimeAndDay(120);
    
    // Check if we hit the cap after training
    const reachedCap = newValue >= cap;
    
    // Update UI with clear feedback about training results
    _safelyUpdateUI(() => {
      if (window.UI) {
        window.UI.updateStatusBars();
        window.UI.updateProfileIfVisible();
        
        // Clear training options and restore normal action buttons
        window.UI.updateActionButtons();
        
        // Set narrative based on training results
        if (attribute === 'phy') {
          window.UI.setNarrative(`You spend two hours in intense physical training, pushing your body to its limits. Your muscles ache, but you feel stronger.`);
        } else {
          window.UI.setNarrative(`You devote two hours to mental exercises, solving complex problems and memorization drills. Your mind feels sharper.`);
        }
        
        // Show detailed notification about progress
        const gainText = finalGain.toFixed(2);
        const attributeType = attribute === 'phy' ? 'Physical' : 'Mental';
        
        if (reachedCap) {
          window.UI.showNotification(`${attributeType} training complete. You've reached the maximum level (${cap})!`, 'achievement');
          window.UI.addToNarrative(`\n\nYou've reached the peak of your ${attribute === 'phy' ? 'physical' : 'mental'} potential. You can no longer improve in this area through regular training.`);
        } else {
          window.UI.showNotification(`${attributeType} attribute increased by ${gainText}`, 'success');
          
          // Show how close to cap they are
          const remainingToCapPercent = ((cap - newValue) / cap * 100).toFixed(0);
          if (remainingToCapPercent <= 20) {
            window.UI.addToNarrative(`\n\nYou're approaching the limits of what's possible through training alone. Only ${remainingToCapPercent}% more progress is possible.`);
          }
        }
      }
    });
    
    // Update achievements
    if (attribute === 'phy' && newValue >= 10) {
      window.GameState.updateAchievementProgress('physical_peak');
    } else if (attribute === 'men' && newValue >= 10) {
      window.GameState.updateAchievementProgress('mental_peak');
    }
  };
  
  // Handle skills training
  const _handleSkillsTraining = function() {
    _logDebug('Starting skills training');
    
    // Deduct stamina
    const staminaCost = 15;
    const currentStamina = Number(window.GameState.get('stamina'));
    if (currentStamina < staminaCost) {
      if (window.UI) {
        window.UI.showNotification("You're too exhausted to train effectively.", 'warning');
      }
      return;
    }
    
    window.GameState.set('stamina', currentStamina - staminaCost);
    
    // Show skill options
    const skillOptions = document.createElement('div');
    skillOptions.className = 'skill-options';
    
    // Get player attributes to calculate skill caps
    const phy = Number(window.Player.get('phy'));
    const men = Number(window.Player.get('men'));
    
    // Calculate skill caps based on attributes
    const meleeCap = Math.floor(phy / 1.5);
    const marksmanshipCap = Math.floor((phy + men) / 3);
    const survivalCap = Math.floor((phy + men) / 3);
    const commandCap = Math.floor((men * 0.8 + phy * 0.2) / 1.5);
    const mentalSkillCap = Math.floor(men / 1.5);
    
    // Create skill training options
    const createSkillOption = function(skillName, displayName, currentValue, cap) {
      const option = document.createElement('button');
      option.className = 'action-btn';
      option.textContent = `${displayName} (${currentValue.toFixed(2)}/${cap})`;
      
      if (currentValue >= cap) {
        option.disabled = true;
        option.title = `This skill is capped by your attributes. Increase your attributes to train further.`;
        option.classList.add('disabled');
      }
      
      option.onclick = function() {
        _trainSkill(skillName, cap);
      };
      
      return option;
    };
    
    // Add skill options
    skillOptions.appendChild(createSkillOption('melee', 'Melee Combat', window.Player.get('skills.melee') || 0, meleeCap));
    skillOptions.appendChild(createSkillOption('marksmanship', 'Marksmanship', window.Player.get('skills.marksmanship') || 0, marksmanshipCap));
    skillOptions.appendChild(createSkillOption('survival', 'Survival', window.Player.get('skills.survival') || 0, survivalCap));
    skillOptions.appendChild(createSkillOption('command', 'Command', window.Player.get('skills.command') || 0, commandCap));
    skillOptions.appendChild(createSkillOption('discipline', 'Discipline', window.Player.get('skills.discipline') || 0, mentalSkillCap));
    skillOptions.appendChild(createSkillOption('tactics', 'Tactics', window.Player.get('skills.tactics') || 0, mentalSkillCap));
    skillOptions.appendChild(createSkillOption('organization', 'Organization', window.Player.get('skills.organization') || 0, mentalSkillCap));
    
    // Cancel button
    const cancelOption = document.createElement('button');
    cancelOption.className = 'action-btn cancel-btn';
    cancelOption.textContent = 'Back';
    cancelOption.onclick = function() {
      _handleTrain(); // Go back to main training menu
    };
    
    skillOptions.appendChild(cancelOption);
    
    // Replace action buttons with skill options
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      actionsContainer.appendChild(skillOptions);
    }
    
    // Update narrative
    if (window.UI) {
      window.UI.setNarrative("Which skill would you like to train?");
    }
  };
  
  // Handle individual skill training
  const _trainSkill = function(skillName, cap) {
    // Get current skill value
    const currentValue = Number(window.Player.get(`skills.${skillName}`) || 0);
    
    // Check if already at cap
    if (currentValue >= cap) {
      if (window.UI) {
        window.UI.showNotification(`This skill is currently capped by your attributes at ${cap}.`, 'warning');
        window.UI.addToNarrative("\n\nYou'll need to improve your attributes before you can train this skill further.");
      }
      return;
    }
    
    // Calculate training progress
    let baseGain = 0.3;
    
    // Diminishing returns as skill gets higher
    const diminishingFactor = 1 - (currentValue / cap * 0.7);
    const gainWithDiminishing = baseGain * diminishingFactor;
    
    // Apply career bonuses if applicable
    let careerBonus = 1.0;
    if (window.Player.get('career') && window.Player.get('career').skillBonuses) {
      const skillBonuses = window.Player.get('career').skillBonuses;
      if (skillBonuses && skillBonuses[skillName]) {
        careerBonus = skillBonuses[skillName];
      }
    }
    
    // Calculate final gain
    const finalGain = gainWithDiminishing * careerBonus;
    
    // Apply gain, ensuring we don't exceed cap
    const newValue = Math.min(cap, currentValue + finalGain);
    window.Player.set(`skills.${skillName}`, newValue);
    
    // Update daily training count
    window.GameState.set('dailyTrainingCount', Number(window.GameState.get('dailyTrainingCount')) + 1);
    
    // Add time (1.5 hours)
    window.updateTimeAndDay(90);
    
    // Check if we hit the cap after training
    const reachedCap = newValue >= cap;
    
    // Get skill display name for messages
    const skillDisplayNames = {
      'melee': 'Melee Combat',
      'marksmanship': 'Marksmanship',
      'survival': 'Survival',
      'command': 'Command',
      'discipline': 'Discipline',
      'tactics': 'Tactics',
      'organization': 'Organization',
      'arcana': 'Arcana Knowledge'
    };
    
    const displayName = skillDisplayNames[skillName] || skillName;
    
    // Update UI
    _safelyUpdateUI(() => {
      if (window.UI) {
        window.UI.updateStatusBars();
        window.UI.updateProfileIfVisible();
        
        // Restore normal action buttons
        window.UI.updateActionButtons();
        
        // Set narrative based on skill
        window.UI.setNarrative(`You spend an hour and a half training your ${displayName.toLowerCase()} skill. `);
        
        switch(skillName) {
          case 'melee':
            window.UI.addToNarrative("You practice forms and strikes against a training dummy, working up a sweat as you perfect your technique.");
            break;
          case 'marksmanship':
            window.UI.addToNarrative("You carefully aim at targets of varying distances, practicing your breathing and steady hand.");
            break;
          case 'survival':
            window.UI.addToNarrative("You work on identifying edible plants, setting snares, and building shelters from limited materials.");
            break;
          case 'command':
            window.UI.addToNarrative("You study leadership texts and practice giving clear, authoritative orders in various scenarios.");
            break;
          case 'discipline':
            window.UI.addToNarrative("You focus on mental exercises to increase your focus, willpower, and emotional control.");
            break;
          case 'tactics':
            window.UI.addToNarrative("You analyze past battles and practice strategic scenarios on a sand table.");
            break;
          case 'organization':
            window.UI.addToNarrative("You practice efficient inventory management, logistics planning, and resource allocation.");
            break;
          case 'arcana':
            window.UI.addToNarrative("You study ancient texts and practice tracing complex arcane symbols and patterns.");
            break;
        }
        
        // Show detailed notification about progress
        const gainText = finalGain.toFixed(2);
        
        if (reachedCap) {
          window.UI.showNotification(`${displayName} skill is now at the attribute cap (${cap}).`, 'warning');
          window.UI.addToNarrative(`\n\nYou've reached the current limit of your ${displayName.toLowerCase()} skill. You'll need to increase your attributes to progress further.`);
        } else {
          window.UI.showNotification(`${displayName} skill increased by ${gainText}`, 'success');
          
          // Show how close to cap they are
          const remainingToCapPercent = ((cap - newValue) / cap * 100).toFixed(0);
          if (remainingToCapPercent <= 20) {
            window.UI.addToNarrative(`\n\nYou're approaching the limits of your current ability. You're only ${remainingToCapPercent}% away from what your attributes will allow.`);
          }
        }
      }
    });
    
    // Update achievements
    if (skillName === 'melee' && newValue >= 5) {
      window.GameState.updateAchievementProgress('combat_expert');
    } else if (skillName === 'tactics' && newValue >= 5) {
      window.GameState.updateAchievementProgress('strategic_mind');
    }
  };
  
  // Handle Mess Hall action
  const _handleMess = function() {
    _logDebug('Starting mess hall action');
    
    // Check time of day - can only visit mess hall during meal times
    const hours = Math.floor(window.GameState.get('time') / 60);
    const isMealTime = (hours >= 7 && hours <= 9) || (hours >= 12 && hours <= 14) || (hours >= 18 && hours <= 20);
    
    if (!isMealTime) {
      if (window.UI) {
        window.UI.showNotification("The mess hall is not serving food right now.", 'warning');
      }
      return;
    }
    
    // Add time (1 hour)
    window.updateTimeAndDay(60);
    
    // Stamina recovery
    const currentStamina = Number(window.GameState.get('stamina'));
    const maxStamina = Number(window.GameState.get('maxStamina'));
    const staminaGain = 10;
    window.GameState.set('stamina', Math.min(maxStamina, currentStamina + staminaGain));
    
    // Small morale boost
    const currentMorale = Number(window.GameState.get('morale'));
    window.GameState.set('morale', Math.min(100, currentMorale + 5));
    
    // Update UI
    _safelyUpdateUI(() => {
      if (window.UI) {
        window.UI.updateStatusBars();
        
        // Base narrative
        window.UI.setNarrative("You take your meal in the mess hall, sharing stories with your fellow soldiers. The food is simple but filling, and the camaraderie is good for morale.");
        
        window.UI.showNotification(`Recovered ${staminaGain} stamina.`, 'health');
      }
    });
  };
  
  // Handle Gambling Tent action
  const _handleGambling = function() {
    _logDebug('Starting gambling action');
    
    // Check time of day - only available in evening and night
    const timeOfDay = window.getTimeOfDay();
    if (timeOfDay !== 'evening' && timeOfDay !== 'night') {
      if (window.UI) {
        window.UI.showNotification("The gambling tent is not open during the day.", 'warning');
      }
      return;
    }
    
    // Check if player has discovered the gambling tent
    if (!window.GameState.get('discoveredGamblingTent')) {
      if (window.UI) {
        window.UI.showNotification("You don't know where the gambling tent is located.", 'warning');
      }
      return;
    }
    
    // Check if player has taelors
    const currentTaelors = Number(window.Player.get('taelors') || 0);
    if (currentTaelors < 5) {
      if (window.UI) {
        window.UI.showNotification("You need at least 5 taelors to join a game.", 'warning');
      }
      return;
    }
    
    // Add time (2 hours)
    window.updateTimeAndDay(120);
    
    // Gambling outcome
    const roll = Math.random();
    let outcome, taelorsChange;
    
    if (roll < 0.4) {
      // Win
      taelorsChange = 5 + Math.floor(Math.random() * 10);
      outcome = `You win ${taelorsChange} taelors!`;
      window.Player.set('taelors', currentTaelors + taelorsChange);
    } else if (roll < 0.9) {
      // Lose
      taelorsChange = -1 * (3 + Math.floor(Math.random() * 7));
      outcome = `You lose ${Math.abs(taelorsChange)} taelors.`;
      window.Player.set('taelors', Math.max(0, currentTaelors + taelorsChange));
    } else {
      // Big win
      taelorsChange = 15 + Math.floor(Math.random() * 15);
      outcome = `Jackpot! You win ${taelorsChange} taelors!`;
      window.Player.set('taelors', currentTaelors + taelorsChange);
    }
    
    // Update UI
    _safelyUpdateUI(() => {
      if (window.UI) {
        window.UI.updateStatusBars();
        
        // Base narrative
        window.UI.setNarrative("You spend some time in the gambling tent, playing dice games and cards with off-duty soldiers. The games are simple but exciting, with fortunes changing hands rapidly.");
        
        window.UI.addToNarrative(`\n\n${outcome}`);
        
        if (taelorsChange > 0) {
          window.UI.showNotification(`Won ${taelorsChange} taelors!`, 'success');
        } else {
          window.UI.showNotification(`Lost ${Math.abs(taelorsChange)} taelors`, 'warning');
        }
      }
    });
  };
  
  // Handle Brawler Pits action
  const _handleBrawlerPits = function() {
    _logDebug('Starting brawler pits action');
    
    // Check time of day - only available in evening and night
    const timeOfDay = window.getTimeOfDay();
    if (timeOfDay !== 'evening' && timeOfDay !== 'night') {
      if (window.UI) {
        window.UI.showNotification("The brawler pits are not active during the day.", 'warning');
      }
      return;
    }
    
    // Check if player has discovered the brawler pits
    if (!window.GameState.get('discoveredBrawlerPits')) {
      if (window.UI) {
        window.UI.showNotification("You don't know where the brawler pits are located.", 'warning');
      }
      return;
    }
    
    // Check stamina
    const currentStamina = Number(window.GameState.get('stamina'));
    if (currentStamina < 30) {
      if (window.UI) {
        window.UI.showNotification("You're too exhausted to fight in the pits. Rest first.", 'warning');
      }
      return;
    }
    
    // Show brawl options
    const brawlOptions = document.createElement('div');
    brawlOptions.className = 'brawl-options';
    
    // Participate option
    const participateOption = document.createElement('button');
    participateOption.className = 'action-btn';
    participateOption.textContent = "Participate in a Fight";
    participateOption.onclick = function() {
      _handleBrawlerParticipate();
    };
    
    // Watch option
    const watchOption = document.createElement('button');
    watchOption.className = 'action-btn';
    watchOption.textContent = "Watch the Fights";
    watchOption.onclick = function() {
      _handleBrawlerWatch();
    };
    
    // Return option
    const returnOption = document.createElement('button');
    returnOption.className = 'action-btn cancel-btn';
    returnOption.textContent = "Return to Camp";
    returnOption.onclick = function() {
      // Restore regular action buttons
      if (window.UI) {
        window.UI.setNarrative("You decide to leave the brawler pits for now.");
        window.UI.updateActionButtons();
      }
    };
    
    // Add options to container
    brawlOptions.appendChild(participateOption);
    brawlOptions.appendChild(watchOption);
    brawlOptions.appendChild(returnOption);
    
    // Replace action buttons with brawl options
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      actionsContainer.appendChild(brawlOptions);
    }
    
    // Update narrative
    if (window.UI) {
      window.UI.setNarrative("You arrive at the brawler pits, where soldiers test their strength and skill in organized fights. The crowd is lively, with betting and cheering all around. What would you like to do?");
    }
  };
  
  // Handle participating in a brawl
  const _handleBrawlerParticipate = function() {
    // Deduct stamina
    const currentStamina = Number(window.GameState.get('stamina'));
    window.GameState.set('stamina', currentStamina - 30);
    
    // Add time (2 hours)
    window.updateTimeAndDay(120);
    
    // Determine fight outcome based on skills
    const playerMelee = window.Player.get('skills.melee') || 0;
    const playerPhy = window.Player.get('phy') || 0;
    const opponentSkill = 3 + Math.floor(Math.random() * 5); // Random opponent skill 3-7
    
    const playerScore = playerMelee * 0.7 + playerPhy * 0.3 + Math.random() * 3;
    const opponentScore = opponentSkill + Math.random() * 3;
    
    let outcome, reward, expGain;
    const isVictory = playerScore > opponentScore;
    
    if (isVictory) {
      reward = 10 + Math.floor(Math.random() * 20);
      expGain = 25;
      window.Player.set('taelors', (window.Player.get('taelors') || 0) + reward);
      window.GameState.set('experience', window.GameState.get('experience') + expGain);
      
      // Slight health reduction from minor injuries
      const currentHealth = window.GameState.get('health');
      window.GameState.set('health', Math.max(currentHealth - 10, 1));
      
      outcome = `You emerged victorious! The crowd cheers as you defeat your opponent. You earn ${reward} taelors and gain ${expGain} experience.`;
    } else {
      expGain = 15;
      window.GameState.set('experience', window.GameState.get('experience') + expGain);
      
      // More health reduction from defeat
      const currentHealth = window.GameState.get('health');
      window.GameState.set('health', Math.max(currentHealth - 25, 1));
      
      outcome = `You fought well but were defeated. You gain ${expGain} experience from the fight.`;
    }
    
    // Skill improvement regardless of outcome
    const currentMelee = window.Player.get('skills.melee') || 0;
    const meleeCap = Math.floor(playerPhy / 1.5);
    const meleeGain = 0.2;
    window.Player.set('skills.melee', Math.min(meleeCap, currentMelee + meleeGain));
    
    // Update UI
    _safelyUpdateUI(() => {
      if (window.UI) {
        window.UI.updateStatusBars();
        window.UI.updateProfileIfVisible();
        
        // Restore regular action buttons
        window.UI.updateActionButtons();
        
        // Set narrative
        window.UI.setNarrative("You step into the pit as the crowd forms a circle around you. Your opponent is " + 
          (opponentSkill > 5 ? "a seasoned fighter with impressive technique." : "another soldier looking to prove themselves."));
        
        window.UI.addToNarrative(`\n\n${outcome}`);
        
        // Check for level up
        window.GameState.checkLevelUp();
      }
    });
  };
  
  // Handle watching the brawls
  const _handleBrawlerWatch = function() {
    // Add time (1 hour)
    window.updateTimeAndDay(60);
    
    // Small amount of experience from observing techniques
    const expGain = 5;
    window.GameState.set('experience', window.GameState.get('experience') + expGain);
    
    // Update UI
    _safelyUpdateUI(() => {
      if (window.UI) {
        window.UI.updateStatusBars();
        
        // Restore regular action buttons
        window.UI.updateActionButtons();
        
        // Set narrative
        window.UI.setNarrative("You spend an hour watching the fights, studying the techniques of the various combatants. It's entertaining and educational at the same time.");
        
        window.UI.showNotification(`Gained ${expGain} experience from observing fights.`, 'success');
        
        // Check for level up
        window.GameState.checkLevelUp();
      }
    });
  };
  
  // Handle talking to NPCs
  const _handleTalkNPC = function(npcId) {
    _logDebug('Starting NPC interaction with:', npcId);
    
    // Check if mission system is available
    if (!window.MissionSystem) {
      if (window.UI) {
        window.UI.showNotification("Mission system not initialized.", 'error');
      }
      return;
    }
    
    // Get available missions from this NPC
    const missions = window.MissionSystem.getAvailableMissionsFrom(npcId);
    
    // Display missions or conversation
    _safelyUpdateUI(() => {
      if (window.UI) {
        // Set narrative based on NPC
        let narrative = "";
        switch(npcId) {
          case 'commander':
            narrative = "Taal'Veyar Thelian, the Regimental Lord of the Kasvaari, looks up from the maps spread across the table. \"What can I do for you, soldier?\"";
            break;
          case 'sergeant':
            narrative = "Sen'Vaorin Darius, a senior line commander, nods as you approach. \"Need something?\"";
            break;
          case 'quartermaster':
            narrative = "Quartermaster Elana organizes supplies as you approach. \"Looking for something specific?\"";
            break;
          default:
            narrative = "You approach the officer. \"What can I help you with?\"";
        }
        
        window.UI.setNarrative(narrative);
        
        // Create mission options container
        const missionOptions = document.createElement('div');
        missionOptions.className = 'mission-options';
        
        // Add mission options
        if (missions.length > 0) {
          // Add available missions
          missions.forEach(mission => {
            const missionBtn = document.createElement('button');
            missionBtn.className = 'action-btn';
            missionBtn.textContent = `${mission.title} (${mission.difficulty})`;
            missionBtn.onclick = function() {
              window.MissionSystem.startMission(mission.type);
            };
            
            missionOptions.appendChild(missionBtn);
          });
        } else {
          // No missions available
          const noMissionText = document.createElement('p');
          noMissionText.textContent = "No missions available at this time.";
          noMissionText.style.padding = "10px";
          missionOptions.appendChild(noMissionText);
        }
        
        // Return option
        const returnBtn = document.createElement('button');
        returnBtn.className = 'action-btn cancel-btn';
        returnBtn.textContent = "End Conversation";
        returnBtn.onclick = function() {
          // Restore regular action buttons
          window.UI.setNarrative("You end the conversation and return to your duties.");
          window.UI.updateActionButtons();
        };
        
        missionOptions.appendChild(returnBtn);
        
        // Replace action buttons with mission options
        const actionsContainer = document.getElementById('actions');
        if (actionsContainer) {
          actionsContainer.innerHTML = '';
          actionsContainer.appendChild(missionOptions);
        }
      }
    });
  };
  
  // Handle guard duty action
  const _handleGuard = function() {
    _logDebug('Starting guard duty action');
    
    // Check stamina
    const currentStamina = Number(window.GameState.get('stamina'));
    if (currentStamina < 20) {
      if (window.UI) {
        window.UI.showNotification("You're too exhausted to stand guard effectively. Rest first.", 'warning');
      }
      return;
    }
    
    // Deduct stamina
    window.GameState.set('stamina', currentStamina - 20);
    
    // Add time (2 hours)
    window.updateTimeAndDay(120);
    
    // Update UI
    _safelyUpdateUI(() => {
      if (window.UI) {
        window.UI.updateStatusBars();
        
        // Base narrative
        window.UI.setNarrative("You take up your position at one of the camp's watchtowers. The hours pass slowly as you keep a vigilant eye on the surrounding area.");
        
        // Small experience gain
        const expGain = 10;
        window.GameState.set('experience', window.GameState.get('experience') + expGain);
        window.UI.showNotification(`You gained ${expGain} experience from guard duty.`, 'success');
        
        // Check for level up
        window.GameState.checkLevelUp();
        
        // Increase discipline skill slightly
        const currentDiscipline = Number(window.Player.get('skills.discipline') || 0);
        const men = Number(window.Player.get('men'));
        const disciplineCap = Math.floor(men / 1.5);
        
        // Apply small skill gain with cap check
        const disciplineGain = 0.1;
        window.Player.set('skills.discipline', Math.min(disciplineCap, currentDiscipline + disciplineGain));
      }
    });
  };
  
  // Handle patrol action
  const _handlePatrol = function() {
    _logDebug('Starting patrol action');
    
    // Check if already patrolled today
    if (window.GameState.get('dailyPatrolDone')) {
      if (window.UI) {
        window.UI.showNotification("You've already completed your patrol duties for today.", 'warning');
      }
      return;
    }
    
    // Check time of day - can only patrol during day and evening
    const timeOfDay = window.getTimeOfDay();
    if (timeOfDay !== 'day' && timeOfDay !== 'evening') {
      if (window.UI) {
        window.UI.showNotification("It's too dark to patrol effectively. Wait until daylight.", 'warning');
      }
      return;
    }
    
    // Check stamina
    const currentStamina = Number(window.GameState.get('stamina'));
    if (currentStamina < 30) {
      if (window.UI) {
        window.UI.showNotification("You're too exhausted to patrol effectively. Rest first.", 'warning');
      }
      return;
    }
    
    // Deduct stamina
    window.GameState.set('stamina', currentStamina - 30);
    
    // Mark patrol as done for the day
    window.GameState.set('dailyPatrolDone', true);
    
    // Add time (3 hours)
    window.updateTimeAndDay(180);
    
    // Generate patrol results
    const encounterRoll = Math.random();
    
    // Update UI
    _safelyUpdateUI(() => {
      if (window.UI) {
        window.UI.updateStatusBars();
        
        // Base narrative
        window.UI.setNarrative("You patrol the outer perimeter of the camp, keeping watch for any signs of enemy activity or other threats.");
        
        // Handle encounter based on roll
        if (encounterRoll < 0.15) {
          // Combat encounter
          window.UI.addToNarrative("\n\nAs you move through dense underbrush, you spot movement ahead. Suddenly, you're face to face with an enemy scout!");
          
          setTimeout(() => {
            window.startCombat('arrasi_scout');
          }, 2000);
        } else if (encounterRoll < 0.40) {
          // Resource discovery
          const resources = ["medicinal herbs", "wild berries", "fresh game tracks", "a small stream with clean water"];
          const resource = resources[Math.floor(Math.random() * resources.length)];
          
          window.UI.addToNarrative(`\n\nDuring your patrol, you discover ${resource}. This could be valuable information for the camp.`);
          
          // Add small experience gain
          const expGain = 15;
          window.GameState.set('experience', window.GameState.get('experience') + expGain);
          window.UI.showNotification(`You gained ${expGain} experience from your patrol.`, 'success');
          
          // Check for level up
          window.GameState.checkLevelUp();
        } else {
          // Uneventful patrol
          window.UI.addToNarrative("\n\nYour patrol is uneventful, but you remain vigilant throughout. The perimeter is secure for now.");
          
          // Add small experience gain
          const expGain = 10;
          window.GameState.set('experience', window.GameState.get('experience') + expGain);
          window.UI.showNotification(`You gained ${expGain} experience from your patrol.`, 'success');
          
          // Check for level up
          window.GameState.checkLevelUp();
        }
        
        // Update relevant skills
        const survivalGain = 0.1;
        const tacticsGain = 0.1;
        
        const currentSurvival = Number(window.Player.get('skills.survival') || 0);
        const currentTactics = Number(window.Player.get('skills.tactics') || 0);
        
        // Calculate caps
        const phy = Number(window.Player.get('phy'));
        const men = Number(window.Player.get('men'));
        const survivalCap = Math.floor((phy + men) / 3);
        const tacticsCap = Math.floor(men / 1.5);
        
        // Apply gains with cap check
        window.Player.set('skills.survival', Math.min(survivalCap, currentSurvival + survivalGain));
        window.Player.set('skills.tactics', Math.min(tacticsCap, currentTactics + tacticsGain));
        
        // Update achievement progress
        window.GameState.updateAchievementProgress('vigilant');
      }
    });
  };
  
  // Public API
  return {
    // Initialize the action system
    init: function() {
      console.log("Initializing action system...");
      
      // Any initialization code would go here
      
      console.log("Action system initialized!");
    },
    
    // Main action handler
    handleAction: function(action) {
      _logDebug('Handling action:', action);
      
      // Check if in battle
      if (window.GameState.get('inBattle')) {
        console.warn("Attempted to use normal action while in battle");
        return;
      }
      
      // Check if in mission
      if (window.GameState.get('inMission')) {
        console.warn("Attempted to use normal action while in mission");
        return;
      }
      
      // Handle different actions
      switch(action) {
        case 'rest':
          _handleRest();
          break;
        case 'train':
          _handleTrain();
          break;
        case 'patrol':
          _handlePatrol();
          break;
        case 'guard':
          _handleGuard();
          break;
        case 'mess':
          _handleMess();
          break;
        case 'gambling':
          _handleGambling();
          break;
        case 'brawler_pits':
          _handleBrawlerPits();
          break;
        case 'talk_commander':
          _handleTalkNPC('commander');
          break;
        case 'talk_sergeant':
          _handleTalkNPC('sergeant');
          break;
        case 'talk_quartermaster':
          _handleTalkNPC('quartermaster');
          break;
        case 'profile':
          if (window.UI) {
            window.UI.openPanel('profile');
          }
          break;
        case 'inventory':
          if (window.UI) {
            window.UI.openPanel('inventory');
          }
          break;
        case 'questLog':
          if (window.UI) {
            window.UI.openPanel('questLog');
          }
          break;
        default:
          console.warn("Unknown action:", action);
      }
    }
  };
})();

// Initialize the action system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  window.ActionSystem.init();
});

// Backward compatibility layer for old code
window.handleAction = function(action) {
  window.ActionSystem.handleAction(action);
};

window.handleRest = function() {
  window.ActionSystem.handleAction('rest');
};

window.handleTrain = function() {
  window.ActionSystem.handleAction('train');
};

window.handlePatrol = function() {
  window.ActionSystem.handleAction('patrol');
};


// Enhanced ActionSystem handler with safety checks for common actions
(function enhanceActionSystemHandling() {
  // Add safeguards to the ActionSystem if it exists
  if (window.ActionSystem) {
    console.log("Enhancing ActionSystem with safety checks...");
    
    // Store the original handler
    const originalActionHandler = window.ActionSystem.handleAction;
    
    // Replace with enhanced version
    window.ActionSystem.handleAction = function(action) {
      console.log(`[ActionSystem Enhanced] Handling action: ${action}`);
      
      // These actions should always work regardless of game state
      const uiActions = ['profile', 'inventory', 'questLog'];
      
      // Force check game state consistency 
      if (window.gameState.inBattle && !window.gameState.currentEnemy) {
        console.warn("Inconsistent battle state detected - fixing");
        window.gameState.inBattle = false;
      }
      
      // Detect if we're in mission state but with no mission data
      if (window.gameState.inMission && !window.gameState.currentMission) {
        console.warn("Inconsistent mission state detected - fixing");
        window.gameState.inMission = false;
      }
      
      // Always allow UI actions
      if (uiActions.includes(action)) {
        console.log(`[ActionSystem] Allowing UI action: ${action}`);
        
        switch (action) {
          case 'profile':
            if (window.UI && window.UI.openPanel) {
              window.UI.openPanel('profile');
            } else {
              const profilePanel = document.getElementById('profile');
              if (profilePanel) {
                profilePanel.classList.remove('hidden');
              }
            }
            return;
            
          case 'inventory':
            if (window.UI && window.UI.openPanel) {
              window.UI.openPanel('inventory');
            } else {
              const inventoryPanel = document.getElementById('inventory');
              if (inventoryPanel) {
                inventoryPanel.classList.remove('hidden');
              }
            }
            return;
            
          case 'questLog':
            if (window.UI && window.UI.openPanel) {
              window.UI.openPanel('questLog');
            } else {
              const questPanel = document.getElementById('questLog');
              if (questPanel) {
                questPanel.classList.remove('hidden');
              }
            }
            return;
        }
      }
      
      // Check if we're being blocked by an inconsistent state
      if (window.gameState.inMission && 
          !window.gameState.inBattle && 
          action !== 'profile' && 
          action !== 'inventory' && 
          action !== 'questLog') {
        
        // Check if we're actually in a functional mission
        let missionActive = false;
        
        if (window.MissionSystem && window.MissionSystem.getCurrentMission) {
          missionActive = !!window.MissionSystem.getCurrentMission();
        } else if (window.missionSystem && window.missionSystem.activeMission) {
          missionActive = !!window.missionSystem.activeMission;
        } else if (window.gameState.currentMission) {
          missionActive = true;
        }
        
        // If there's no active mission but inMission is true, we're in a bad state
        if (!missionActive) {
          console.warn("Detected stale mission state - resetting to allow normal actions");
          window.gameState.inMission = false;
        }
      }
      
      // Now proceed with the normal action handler
      if (window.gameState.inBattle) {
        console.warn("Attempted to use normal action while in battle");
        return;
      }
      
      if (window.gameState.inMission && !uiActions.includes(action)) {
        console.warn("Attempted to use normal action while in mission");
        return;
      }
      
      // Call the original handler if all checks pass
      originalActionHandler(action);
    };
    
    console.log("ActionSystem enhancement complete");
  }
})();

// Call this function to reset game state in emergency situations
window.resetGameStateEmergency = function() {
  console.log("EMERGENCY GAME STATE RESET");
  
  // Reset all major state flags
  window.gameState.inBattle = false;
  window.gameState.currentEnemy = null;
  window.gameState.inMission = false;
  window.gameState.currentMission = null;
  window.gameState.missionStage = 0;
  window.gameState.inMissionCombat = false;
  
  // Force action container visibility
  const actionsContainer = document.getElementById('actions');
  if (actionsContainer) {
    actionsContainer.style.display = 'flex';
    
    // Clear and restore buttons
    actionsContainer.innerHTML = '';
    if (window.UI && window.UI.updateActionButtons) {
      window.UI.updateActionButtons();
    } else if (window.updateActionButtons) {
      window.updateActionButtons();
    }
  }
  
  // Show success message
  if (window.UI && window.UI.showNotification) {
    window.UI.showNotification("Game state has been reset. You can continue playing.", "success");
  }
};

// Emergency button to fix the current stuck state
(function addEmergencyResetButton() {
  console.log("Checking if emergency reset button is needed...");
  
  // Only add if we're in a stuck state
  if (window.gameState.inMission || window.gameState.inBattle) {
    // Check for visible buttons
    const actionsContainer = document.getElementById('actions');
    const hasVisibleButtons = actionsContainer && 
                              actionsContainer.style.display !== 'none' && 
                              actionsContainer.children.length > 0;
    
    if (!hasVisibleButtons) {
      console.log("Adding emergency reset button");
      
      // Create the button
      const resetButton = document.createElement('button');
      resetButton.style.position = 'fixed';
      resetButton.style.bottom = '20px';
      resetButton.style.right = '20px';
      resetButton.style.zIndex = '9999';
      resetButton.style.padding = '10px 20px';
      resetButton.style.backgroundColor = '#ff4b4b';
      resetButton.style.color = 'white';
      resetButton.style.border = 'none';
      resetButton.style.borderRadius = '5px';
      resetButton.style.fontWeight = 'bold';
      resetButton.style.cursor = 'pointer';
      resetButton.textContent = '🚨 RESET GAME STATE';
      
      // Add click handler
      resetButton.onclick = function() {
        window.resetGameStateEmergency();
        // Remove the button after click
        document.body.removeChild(resetButton);
      };
      
      document.body.appendChild(resetButton);
    }
  }
})();