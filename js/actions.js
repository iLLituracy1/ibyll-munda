// PLAYER ACTIONS MODULE
// Functions related to player actions and activities

// Master function to handle all action button clicks
window.handleAction = function(action) {
  console.log('Action handled:', action);
  
  // Show panels like inventory, profile, etc.
  if (action === 'profile') {
    window.handleProfile();
    return;
  } else if (action === 'inventory') {
    // Update inventory before showing
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = `<div class="inventory-coins">${window.player.taelors} Taelors</div>`;
    
    if (window.player.inventory.length === 0) {
      inventoryList.innerHTML += `<p>Your inventory is empty.</p>`;
    } else {
      window.player.inventory.forEach((item, index) => {
        inventoryList.innerHTML += `
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
    
    document.getElementById('inventory').classList.remove('hidden');
    return;
  } else if (action === 'questLog') {
    // Update quest log before showing
    const questList = document.getElementById('questList');
    questList.innerHTML = '';
    
    // Add main quest
    questList.innerHTML += `
      <div class="quest-item">
        <div class="quest-title">Main Quest: The Campaign</div>
        <div>Progress: Stage ${window.gameState.mainQuest.stage}/5</div>
      </div>
    `;
    
    // Add side quests
    if (window.gameState.sideQuests.length === 0) {
      questList.innerHTML += `<p>No active side quests.</p>`;
    } else {
      window.gameState.sideQuests.forEach(quest => {
        questList.innerHTML += `
          <div class="quest-item">
            <div class="quest-title">${quest.title}</div>
            <div>${quest.description}</div>
            <div>Objectives:</div>
            <ul>
        `;
        
        quest.objectives.forEach(objective => {
          const className = objective.completed ? 'quest-objective-complete' : '';
          questList.innerHTML += `
            <li class="quest-objective ${className}">
              ${objective.text}: ${objective.count}/${objective.target}
            </li>
          `;
        });
        
        questList.innerHTML += `</ul></div>`;
      });
    }
    
    document.getElementById('questLog').classList.remove('hidden');
    return;
  }
  
  // Show training submenu
  if (action === 'train') {
    window.showTrainingOptions();
    return;
  }
  
  // Show gambling submenu
  if (action === 'gambling') {
    window.showGamblingOptions();
    return;
  }
  
  // Show brawler pits submenu
  if (action === 'brawler_pits') {
    window.showBrawlerPitOptions();
    return;
  }
  
  // Handle specific training types
  if (action === 'physical_training' || action === 'mental_training' || 
      action === 'melee_drill' || action === 'ranged_drill' || action === 'squad_exercises') {
    window.handleTraining(action);
    return;
  }
  
  // Handle specific gambling activities
  if (action === 'play_cards' || action === 'play_dice') {
    window.handleGambling(action);
    return;
  }
  
  // Handle specific brawler pit activities
  if (action === 'novice_match' || action === 'standard_match' || action === 'veteran_match') {
    window.handleBrawl(action);
    return;
  }
  
  // Handle going back from submenus
  if (action === 'back_from_training' || action === 'back_from_gambling' || action === 'back_from_brawler') {
    // Show main action buttons again
    window.updateActionButtons();
    return;
  }
  
  // Game actions that advance time
  if (action === 'rest') {
    // Rest action
    const timeOfDay = window.getTimeOfDay();
    let restIndex = 0;
    
    if (timeOfDay === 'day') {
      restIndex = Math.floor(Math.random() * 2); // First two rest narratives
    } else if (timeOfDay === 'evening') {
      restIndex = 2 + Math.floor(Math.random() * 2); // Middle two rest narratives
    } else {
      restIndex = 4 + Math.floor(Math.random() * 2); // Last two rest narratives
    }
    
    const restText = window.narrativeElements.rest[restIndex];
    window.setNarrative(restText); // Use setNarrative instead of addToNarrative
    
    // Recovery depends on time of day
    let healthRecovery = 5;
    let staminaRecovery = 15;
    
    if (timeOfDay === 'night') {
      healthRecovery = 25;
      staminaRecovery = 40;
    } else if (timeOfDay === 'evening') {
      healthRecovery = 10;
      staminaRecovery = 25;
    }
    
    // Update game state
    window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + healthRecovery);
    window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + staminaRecovery);
    
    // Update UI
    window.updateStatusBars();
    window.updateProfileIfVisible();
    
    // Time passed depends on time of day
    let timePassed = 120; // Default for daytime rest
    if (timeOfDay === 'night') {
      timePassed = 480; // 8 hours for night rest
    } else if (timeOfDay === 'evening') {
      timePassed = 120; // 2 hours for evening rest
    }
    
    window.updateTimeAndDay(timePassed);
    
    // Show notification
    window.showNotification(`Rested and recovered ${healthRecovery} health and ${staminaRecovery} stamina`, 'success');
    
  } else if (action === 'patrol') {
    // Check if already patrolled today
    if (window.gameState.dailyPatrolDone) {
      window.showNotification("You've already completed your patrol duty for today.", 'warning');
      return;
    }
    
    // Check if player has enough stamina
    if (window.gameState.stamina < 25) {
      window.showNotification("You're too exhausted to patrol effectively. Rest first.", 'warning');
      return;
    }
    
    // Patrol action
    const patrolText = window.narrativeElements.patrol[Math.floor(Math.random() * window.narrativeElements.patrol.length)];
    window.setNarrative(patrolText); // Use setNarrative instead of addToNarrative
    
    // Update game state
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 25);
    window.gameState.dailyPatrolDone = true;
    window.gameState.experience += 10;
    
    // Improve relationship with a random officer
    const officers = ["commander", "sergeant"];
    const randomOfficer = officers[Math.floor(Math.random() * officers.length)];
    window.player.relationships[randomOfficer].disposition += 3;
    window.player.relationships[randomOfficer].interactions += 1;
    
    // Check for quest progress
    window.updateQuestProgress("patrol");
    
    // Small chance to improve survival skill
    const survivalImprovement = parseFloat((Math.random() * 0.03 + 0.02).toFixed(2));
    const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
    
    if (Math.random() < 0.3 && window.player.skills.survival < survivalCap) {
      window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + survivalImprovement);
      window.showNotification(`Your survival skills improved by ${survivalImprovement}`, 'success');
    }
    
    // Chance to discover brawler pits
    if (!window.gameState.discoveredBrawlerPits && Math.random() < 0.10) {
      window.gameState.discoveredBrawlerPits = true;
      window.addToNarrative("During your patrol, you overhear whispers about underground fighting pits where soldiers test their mettle and bet on matches. Such activities aren't officially sanctioned, but they seem to be an open secret in the camp.");
      window.showNotification("Discovered: Brawler Pits! New activity unlocked at night.", 'success');
      
      // Update achievement progress for discovering new locations
      window.updateAchievementProgress('scout_master', 1);
    }
    
    // Update UI
    window.updateStatusBars();
    window.updateProfileIfVisible();
    
    // Check for combat encounter
    window.checkForCombatEncounters('patrol');
    
    // Update UI if not in combat
    if (!window.gameState.inBattle) {
      window.updateTimeAndDay(120); // 2 hours
      
      // Show notification
      window.showNotification("Patrol complete! +10 XP", 'success');
    }
  } else if (action === 'mess') {
    // Mess hall action
    const messText = window.narrativeElements.mess[Math.floor(Math.random() * window.narrativeElements.mess.length)];
    window.setNarrative(messText); // Use setNarrative instead of addToNarrative
    
    // Update game state
    window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + 25);
    window.gameState.morale = Math.min(100, window.gameState.morale + 5);
    
    // Chance to discover gambling tent during mess
    if (!window.gameState.discoveredGamblingTent && Math.random() < 0.10) {
      window.gameState.discoveredGamblingTent = true;
      window.addToNarrative("As you finish your meal, you notice a group of soldiers huddled in the corner of the mess tent. The clink of coins and hushed exclamations draw your attention. One of them notices your interest and nods toward a larger tent near the edge of camp. \"Games start after dusk,\" he mutters. \"Bring your taelors if you're feeling lucky.\"");
      window.showNotification("Discovered: Gambling Tent! New activity unlocked at night.", 'success');
      
      // Update achievement progress for discovering new locations
      window.updateAchievementProgress('scout_master', 1);
    }
    
    // Small chance to improve organization skill
    const organizationImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
    const mentalSkillCap = Math.floor(window.player.men / 1.5);
    
    if (Math.random() < 0.15 && window.player.skills.organization < mentalSkillCap) {
      window.player.skills.organization = Math.min(mentalSkillCap, window.player.skills.organization + organizationImprovement);
      window.showNotification(`Your organization skills improved by ${organizationImprovement}`, 'success');
    }
    
    // Update UI
    window.updateStatusBars();
    window.updateProfileIfVisible();
    window.updateTimeAndDay(45); // 45 minutes
    
    // Show notification
    window.showNotification("Meal complete! Recovered stamina and morale", 'success');
    
  } else if (action === 'guard') {
    // Check if player has enough stamina
    if (window.gameState.stamina < 20) {
      window.showNotification("You're too exhausted for guard duty. Rest first.", 'warning');
      return;
    }
    
    // Guard duty action
    const guardText = window.narrativeElements.guard[Math.floor(Math.random() * window.narrativeElements.guard.length)];
    window.setNarrative(guardText); // Use setNarrative instead of addToNarrative
    
    // Update game state
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 20);
    window.gameState.experience += 8;
    
    // Chance to improve discipline or tactics skill
    const skillImprovement = parseFloat((Math.random() * 0.04 + 0.06).toFixed(2));
    const mentalSkillCap = Math.floor(window.player.men / 1.5);
    
    if (Math.random() < 0.3) {
      if (Math.random() < 0.5 && window.player.skills.discipline < mentalSkillCap) {
        window.player.skills.discipline = Math.min(mentalSkillCap, window.player.skills.discipline + skillImprovement);
        window.showNotification(`Your discipline improved by ${skillImprovement}.`, 'success');
      } else if (window.player.skills.tactics < mentalSkillCap) {
        window.player.skills.tactics = Math.min(mentalSkillCap, window.player.skills.tactics + skillImprovement);
        window.showNotification(`Your tactical thinking improved by ${skillImprovement}.`, 'success');
      }
    }
    
    // Update UI
    window.updateStatusBars();
    window.updateProfileIfVisible();
    window.updateTimeAndDay(180); // 3 hours
    
    // Show notification
    window.showNotification("Guard duty complete! +8 XP", 'success');
  }
  
  // Check for level up after actions
  window.checkLevelUp();
};

// Function to show training options
window.showTrainingOptions = function() {
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';
  
  // Add training options
  window.addActionButton('🏋️ Physical Training', 'physical_training', actionsContainer);
  window.addActionButton('🧠 Mental Training', 'mental_training', actionsContainer);
  window.addActionButton('⚔️ Melee Weapons Drill', 'melee_drill', actionsContainer);
  window.addActionButton('🏹 Ranged Weapons Drill', 'ranged_drill', actionsContainer);
  window.addActionButton('👥 Squad Exercises', 'squad_exercises', actionsContainer);
  
  // Add back button
  window.addActionButton('← Back', 'back_from_training', actionsContainer);
};

// Function to handle training with fixed attribute increases
window.handleTraining = function(trainingType) {
  // Check if player has enough stamina
  if (window.gameState.stamina < 20) {
    window.showNotification("You're too exhausted to train effectively. Rest first.", 'warning');
    window.updateActionButtons(); // Go back to main actions
    return;
  }
  
  // Check if player has reached daily training limit
  if (window.gameState.dailyTrainingCount >= 3) {
    window.showNotification("You've trained enough for today. Try again tomorrow.", 'warning');
    window.updateActionButtons(); // Go back to main actions
    return;
  }
  
  // Get appropriate training text and stat improvements based on type
  let trainingText = "";
  let experienceGain = 5;
  let staminaLoss = 20;
  let skillImprovements = [];
  
  // Calculate random improvement values
  const smallImprovement = Number(Math.random() * 0.03 + 0.02); // 0.02 to 0.05
  const mediumImprovement = Number(Math.random() * 0.05 + 0.05); // 0.05 to 0.10
  const largeImprovement = Number(Math.random() * 0.05 + 0.1);  // 0.10 to 0.15
  
  console.log("DETAILED PLAYER STATE BEFORE:", {
    phy: window.player.phy,
    men: window.player.men,
    skills: window.player.skills
  });
  
  // Fix PHY and MEN to ensure they're numbers in case they were converted to strings
  window.player.phy = Number(window.player.phy);
  window.player.men = Number(window.player.men);
  
  switch(trainingType) {
    case 'physical_training':
      trainingText = "You push through exhausting physical drills, your muscles burning with the effort. The harsh regimen builds your endurance and strength.";
      
      // Always improve physical attribute - GUARANTEED increase
      // Use Math.ceil to fix the fractional values correctly and give a slightly higher upper limit
      const maxPhy = window.player.men > 0 ? Math.min(15, Math.ceil(window.player.men / 0.6)) : 15;
      
      if (window.player.phy < maxPhy) {
        // Get the current PHY as a number (force conversion to be safe)
        const oldPhy = Number(window.player.phy);
        
        // Ensure improvement is a number
        const phyImprovement = Number(smallImprovement);
        
        // Calculate the new value, ensuring it's a number
        const newPhy = Number(oldPhy) + Number(phyImprovement);
        
        // Store the new value
        window.player.phy = Math.min(maxPhy, newPhy);
        
        // Round to 2 decimal places using Math.round
        window.player.phy = Math.round(window.player.phy * 100) / 100;
        
        // Calculate actual improvement for display
        const actualImprovement = Math.round((window.player.phy - oldPhy) * 100) / 100;
        
        console.log("PHY TRAINING CALCULATION:", {
          oldPhy,
          phyImprovement,
          calculatedNewPhy: newPhy,
          cappedNewPhy: Math.min(maxPhy, newPhy),
          roundedFinalPhy: window.player.phy,
          actualImprovement
        });
        
        skillImprovements.push(`Physical (PHY) +${actualImprovement.toFixed(2)}`);
      } else {
        skillImprovements.push("PHY at max for your MEN level");
      }
      
      // Chance to improve melee skill
      if (Math.random() < 0.4) {
        // Calculate skill cap based on PHY
        const meleeCap = Math.floor(window.player.phy / 1.5);
        
        if (window.player.skills.melee < meleeCap) {
          const oldMelee = Number(window.player.skills.melee);
          window.player.skills.melee = Math.min(meleeCap, Number(oldMelee) + Number(smallImprovement));
          window.player.skills.melee = Math.round(window.player.skills.melee * 100) / 100;
          
          const actualImprovement = Math.round((window.player.skills.melee - oldMelee) * 100) / 100;
          skillImprovements.push(`Melee Combat +${actualImprovement.toFixed(2)}`);
        }
      }
      break;
      
    case 'mental_training':
      trainingText = "Hours of tactical studies and mental exercises sharpen your mind. The instructors push you to think quickly and clearly under pressure.";
      
      // Always improve mental attribute - GUARANTEED increase
      // Use Math.ceil to fix the fractional values correctly and give a slightly higher upper limit
      const maxMen = window.player.phy > 0 ? Math.min(15, Math.ceil(window.player.phy / 0.6)) : 15;
      
      if (window.player.men < maxMen) {
        // Get current MEN as a number
        const oldMen = Number(window.player.men);
        
        // Ensure improvement is a number
        const menImprovement = Number(smallImprovement);
        
        // Calculate the new value, ensuring it's a number
        const newMen = Number(oldMen) + Number(menImprovement);
        
        // Store the new value, capped if needed
        window.player.men = Math.min(maxMen, newMen);
        
        // Round to 2 decimal places using Math.round
        window.player.men = Math.round(window.player.men * 100) / 100;
        
        // Calculate actual improvement for display
        const actualImprovement = Math.round((window.player.men - oldMen) * 100) / 100;
        
        console.log("MEN TRAINING CALCULATION:", {
          oldMen,
          menImprovement,
          calculatedNewMen: newMen,
          cappedNewMen: Math.min(maxMen, newMen),
          roundedFinalMen: window.player.men,
          actualImprovement
        });
        
        skillImprovements.push(`Mental (MEN) +${actualImprovement.toFixed(2)}`);
      } else {
        skillImprovements.push("MEN at max for your PHY level");
      }
      
      // Chance to improve tactics and discipline
      const mentalSkillCap = Math.floor(window.player.men / 1.5);
      
      if (Math.random() < 0.5 && window.player.skills.tactics < mentalSkillCap) {
        const oldTactics = Number(window.player.skills.tactics);
        window.player.skills.tactics = Math.min(mentalSkillCap, Number(oldTactics) + Number(smallImprovement));
        window.player.skills.tactics = Math.round(window.player.skills.tactics * 100) / 100;
        
        const actualImprovement = Math.round((window.player.skills.tactics - oldTactics) * 100) / 100;
        skillImprovements.push(`Tactics +${actualImprovement.toFixed(2)}`);
      } else if (window.player.skills.discipline < mentalSkillCap) {
        const oldDiscipline = Number(window.player.skills.discipline);
        window.player.skills.discipline = Math.min(mentalSkillCap, Number(oldDiscipline) + Number(smallImprovement));
        window.player.skills.discipline = Math.round(window.player.skills.discipline * 100) / 100;
        
        const actualImprovement = Math.round((window.player.skills.discipline - oldDiscipline) * 100) / 100;
        skillImprovements.push(`Discipline +${actualImprovement.toFixed(2)}`);
      }
      break;
      
    case 'melee_drill':
      trainingText = "You practice combat forms with wooden weapons, perfecting your strikes and blocks. The drill sergeants correct your stance and technique.";
      
      // Improve melee skill
      const meleeCap = Math.floor(window.player.phy / 1.5);
      if (window.player.skills.melee < meleeCap) {
        const oldMelee = Number(window.player.skills.melee);
        window.player.skills.melee = Math.min(meleeCap, Number(oldMelee) + Number(mediumImprovement));
        window.player.skills.melee = Math.round(window.player.skills.melee * 100) / 100;
        
        const actualImprovement = Math.round((window.player.skills.melee - oldMelee) * 100) / 100;
        skillImprovements.push(`Melee Combat +${actualImprovement.toFixed(2)}`);
      } else {
        skillImprovements.push("Melee at max for your PHY level");
      }
      
      // Small chance for PHY improvement
      if (Math.random() < 0.4) {
        const maxPhy = window.player.men > 0 ? Math.min(15, Math.ceil(window.player.men / 0.6)) : 15;
        if (window.player.phy < maxPhy) {
          const tinyImprovement = Number(Math.random() * 0.02 + 0.01); // 0.01 to 0.03
          const oldPhy = Number(window.player.phy);
          window.player.phy = Math.min(maxPhy, Number(oldPhy) + Number(tinyImprovement));
          window.player.phy = Math.round(window.player.phy * 100) / 100;
          
          const actualImprovement = Math.round((window.player.phy - oldPhy) * 100) / 100;
          
          console.log("PHY IMPROVEMENT FROM MELEE:", {
            oldPhy,
            tinyImprovement,
            newPhy: window.player.phy,
            actualImprovement
          });
          
          skillImprovements.push(`Physical (PHY) +${actualImprovement.toFixed(2)}`);
        }
      }
      break;
      
    case 'ranged_drill':
      trainingText = "At the shooting range, you practice your aim with various ranged weapons. The steady rhythm of draw, aim, and release becomes ingrained in your muscle memory.";
      
      // Marksmanship depends on both PHY and MEN
      const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
      
      if (window.player.skills.marksmanship < marksmanshipCap) {
        const oldMarksmanship = Number(window.player.skills.marksmanship);
        window.player.skills.marksmanship = Math.min(marksmanshipCap, Number(oldMarksmanship) + Number(mediumImprovement));
        window.player.skills.marksmanship = Math.round(window.player.skills.marksmanship * 100) / 100;
        
        const actualImprovement = Math.round((window.player.skills.marksmanship - oldMarksmanship) * 100) / 100;
        skillImprovements.push(`Marksmanship +${actualImprovement.toFixed(2)}`);
      } else {
        skillImprovements.push("Marksmanship at max for your attributes");
      }
      
      // Small chances for tiny improvements to PHY and MEN
      if (Math.random() < 0.3) {
        const maxPhy = window.player.men > 0 ? Math.min(15, Math.ceil(window.player.men / 0.6)) : 15;
        if (window.player.phy < maxPhy) {
          const tinyImprovement = Number(Math.random() * 0.015 + 0.005); // 0.005 to 0.02
          const oldPhy = Number(window.player.phy);
          window.player.phy = Math.min(maxPhy, Number(oldPhy) + Number(tinyImprovement));
          window.player.phy = Math.round(window.player.phy * 100) / 100;
          
          const actualImprovement = Math.round((window.player.phy - oldPhy) * 100) / 100;
          if (actualImprovement > 0) {
            skillImprovements.push(`Physical (PHY) +${actualImprovement.toFixed(2)}`);
          }
        }
      }
      
      if (Math.random() < 0.3) {
        const maxMen = window.player.phy > 0 ? Math.min(15, Math.ceil(window.player.phy / 0.6)) : 15;
        if (window.player.men < maxMen) {
          const tinyImprovement = Number(Math.random() * 0.015 + 0.005); // 0.005 to 0.02
          const oldMen = Number(window.player.men);
          window.player.men = Math.min(maxMen, Number(oldMen) + Number(tinyImprovement));
          window.player.men = Math.round(window.player.men * 100) / 100;
          
          const actualImprovement = Math.round((window.player.men - oldMen) * 100) / 100;
          if (actualImprovement > 0) {
            skillImprovements.push(`Mental (MEN) +${actualImprovement.toFixed(2)}`);
          }
        }
      }
      break;
      
    case 'squad_exercises':
      trainingText = "Your unit runs drills as a coordinated team, learning to move and fight as one. The emphasis is on communication and trust between comrades.";
      
      // Always improve command (90% chance) and discipline (75% chance)
      const commandCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
      const disciplineCap = Math.floor(window.player.men / 1.5);
      
      // Command improvement (higher chance)
      if (Math.random() < 0.9 && window.player.skills.command < commandCap) {
        const oldCommand = Number(window.player.skills.command);
        window.player.skills.command = Math.min(commandCap, Number(oldCommand) + Number(mediumImprovement));
        window.player.skills.command = Math.round(window.player.skills.command * 100) / 100;
        
        const actualImprovement = Math.round((window.player.skills.command - oldCommand) * 100) / 100;
        skillImprovements.push(`Command +${actualImprovement.toFixed(2)}`);
        
        console.log("Command improved:", {
          oldCommand,
          newCommand: window.player.skills.command,
          improvement: mediumImprovement,
          actualImprovement
        });
      } else {
        skillImprovements.push("Command skill check failed or at max");
      }
      
      // Discipline improvement (separate roll)
      if (Math.random() < 0.75 && window.player.skills.discipline < disciplineCap) {
        const oldDiscipline = Number(window.player.skills.discipline);
        window.player.skills.discipline = Math.min(disciplineCap, Number(oldDiscipline) + Number(smallImprovement));
        window.player.skills.discipline = Math.round(window.player.skills.discipline * 100) / 100;
        
        const actualImprovement = Math.round((window.player.skills.discipline - oldDiscipline) * 100) / 100;
        skillImprovements.push(`Discipline +${actualImprovement.toFixed(2)}`);
      }
      
      experienceGain = 7; // Extra XP for team exercises
      break;
  }
  
  console.log("DETAILED PLAYER STATE AFTER:", {
    phy: window.player.phy,
    men: window.player.men,
    skills: window.player.skills
  });
  
  // Set the narrative
  window.setNarrative(trainingText);
  
  // Update game state
  window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaLoss);
  window.gameState.trainingProgress += 1;
  window.gameState.dailyTrainingCount += 1;
  window.gameState.experience += experienceGain;
  
  // Show skill improvement notifications if applicable
  if (skillImprovements.length > 0) {
    skillImprovements.forEach(improvement => {
      window.showNotification(improvement, 'success');
    });
  }
  
  // Update profile if it's open
  window.updateProfileIfVisible();
  
  // Check for quest progress
  window.updateQuestProgress("training");
  
  // Update UI
  window.updateStatusBars();
  window.updateTimeAndDay(60); // 1 hour for training
  
  // Show notification
  window.showNotification(`Training complete! +${experienceGain} XP`, 'success');
  
  // Check for achievements
  window.updateAchievementProgress('disciplined', 1);
  
  // Go back to main actions
  window.updateActionButtons();
};

// GAMBLING SUBMENU AND ACTIVITIES
// Function to show gambling options like the training submenu
window.showGamblingOptions = function() {
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';
  
  // Add gambling options
  window.addActionButton('🎴 Play Cards (5-15 taelors)', 'play_cards', actionsContainer);
  window.addActionButton('🎲 Play Dice (10-30 taelors)', 'play_dice', actionsContainer);
  
  // Add back button
  window.addActionButton('← Back', 'back_from_gambling', actionsContainer);
};

// Function to handle gambling activities with betting
window.handleGambling = function(action) {
  // Set up betting UI
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';
  
  // Add title based on game type
  const gameTitle = document.createElement('h3');
  gameTitle.style.textAlign = 'center';
  gameTitle.style.margin = '10px 0';
  
  // Create betting input container
  const bettingContainer = document.createElement('div');
  bettingContainer.style.display = 'flex';
  bettingContainer.style.justifyContent = 'center';
  bettingContainer.style.alignItems = 'center';
  bettingContainer.style.margin = '15px 0';
  
  // Create input for bet amount
  const betInput = document.createElement('input');
  betInput.type = 'number';
  betInput.min = 1;
  betInput.max = window.player.taelors;
  betInput.value = Math.min(10, window.player.taelors);
  betInput.style.width = '80px';
  betInput.style.padding = '5px';
  betInput.style.marginRight = '10px';
  betInput.style.background = '#333';
  betInput.style.color = '#e0e0e0';
  betInput.style.border = '1px solid #444';
  betInput.style.borderRadius = '4px';
  
  // Create label for input
  const betLabel = document.createElement('label');
  betLabel.textContent = 'Your bet: ';
  betLabel.style.marginRight = '5px';
  
  // Create taelors display
  const taelorsDisplay = document.createElement('span');
  taelorsDisplay.textContent = `Available: ${window.player.taelors} taelors`;
  taelorsDisplay.style.marginLeft = '10px';
  
  // Add elements to container
  bettingContainer.appendChild(betLabel);
  bettingContainer.appendChild(betInput);
  bettingContainer.appendChild(taelorsDisplay);
  
  // Create buttons for betting
  const confirmButton = document.createElement('button');
  confirmButton.className = 'action-btn';
  confirmButton.textContent = 'Confirm Bet';
  confirmButton.style.margin = '0 5px';
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'action-btn';
  cancelButton.textContent = 'Cancel';
  cancelButton.style.margin = '0 5px';
  
  // Container for buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.margin = '10px 0';
  
  buttonContainer.appendChild(confirmButton);
  buttonContainer.appendChild(cancelButton);
  
  // Update based on game type
  if (action === 'play_cards') {
    gameTitle.textContent = 'Card Game - Higher Card Wins';
    window.setNarrative("You approach a table where soldiers are playing a simple card game. Each player draws a card from the deck, and the highest card wins. Aces are high, and ties result in a draw with bets returned.");
  } else if (action === 'play_dice') {
    gameTitle.textContent = 'Dice Game - Lucky Sevens';
    window.setNarrative("The dice game is simple but popular. Each player rolls two dice, aiming for a sum of seven. If you roll a seven, you win double your bet. If you roll a sum of 2 or 12, you lose everything. Any other number means you lose your bet.");
  }
  
  // Add to DOM
  actionsContainer.appendChild(gameTitle);
  actionsContainer.appendChild(bettingContainer);
  actionsContainer.appendChild(buttonContainer);
  
  // Add event listeners
  confirmButton.addEventListener('click', function() {
    const betAmount = parseInt(betInput.value);
    
    // Check if bet is valid
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > window.player.taelors) {
      window.showNotification("Please enter a valid bet amount.", 'warning');
      return;
    }
    
    // Process the bet
    window.processGambling(action, betAmount);
  });
  
  cancelButton.addEventListener('click', function() {
    // Return to gambling options
    window.showGamblingOptions();
  });
};

// Function to process gambling outcome
window.processGambling = function(gameType, betAmount) {
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
      window.showNotification(`You won ${winnings} taelors!`, 'success');
    } else if (playerCard < opponentCard) {
      // Lose
      outcome = `You draw a ${cardNames[playerCard]} while your opponent draws a ${cardNames[opponentCard]}. You lose your bet of ${betAmount} taelors.`;
      window.showNotification(`You lost ${betAmount} taelors!`, 'warning');
    } else {
      // Tie
      winnings = betAmount; // Return the bet
      outcome = `You both draw a ${cardNames[playerCard]}. It's a tie! Your bet is returned.`;
      window.showNotification(`It's a tie! Bet returned.`, 'info');
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
      window.showNotification(`Lucky Seven! You won ${winnings} taelors!`, 'success');
    } else if (diceSum === 2 || diceSum === 12) {
      // Lose everything
      outcome = `You roll a ${dice1} and a ${dice2}, summing to ${diceSum}. Snake eyes! You lose your bet of ${betAmount} taelors.`;
      window.showNotification(`Unlucky roll! You lost ${betAmount} taelors!`, 'warning');
    } else {
      // Lose bet
      outcome = `You roll a ${dice1} and a ${dice2}, summing to ${diceSum}. Not a seven! You lose your bet of ${betAmount} taelors.`;
      window.showNotification(`No luck! You lost ${betAmount} taelors!`, 'warning');
    }
  }
  
  // Add winnings if any
  window.player.taelors += winnings;
  
  // Update narrative
  window.addToNarrative(outcome);
  
  // Update morale (small boost even if lost)
  window.gameState.morale = Math.min(100, window.gameState.morale + 3);
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
  window.updateTimeAndDay(45); // 45 minutes for gambling
  
  // Return to gambling options after a short delay
  setTimeout(function() {
    window.showGamblingOptions();
  }, 1500);
};

// BRAWLER PITS SUBMENU AND ACTIVITIES
// Function to show brawler pit options
window.showBrawlerPitOptions = function() {
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';
  
  // Add brawler pit options with buy-in amounts
  window.addActionButton('👊 Novice Match (10 taelors buy-in)', 'novice_match', actionsContainer);
  window.addActionButton('⚔️ Standard Match (25 taelors buy-in)', 'standard_match', actionsContainer);
  window.addActionButton('🔥 Veteran Match (50 taelors buy-in)', 'veteran_match', actionsContainer);
  
  // Add back button
  window.addActionButton('← Back', 'back_from_brawler', actionsContainer);
};

// Function to handle brawler pit activities
window.handleBrawl = function(action) {
  // Check stamina requirement
  if (window.gameState.stamina < 30) {
    window.showNotification("You're too exhausted to fight in the pits. Rest first.", 'warning');
    window.showBrawlerPitOptions();
    return;
  }
  
  // Determine buy-in amount
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
    window.showNotification(`You don't have enough taelors for the ${matchType} match buy-in.`, 'warning');
    window.showBrawlerPitOptions();
    return;
  }
  
  // Deduct buy-in
  window.player.taelors -= buyIn;
  
  // Get brawler pit narrative
  const brawlerText = window.narrativeElements.brawlerPits[Math.floor(Math.random() * window.narrativeElements.brawlerPits.length)];
  window.setNarrative(brawlerText);
  window.addToNarrative(`You put down ${buyIn} taelors for the ${matchType} match. The crowd grows quiet as you step into the ring, facing your opponent.`);
  
  // Determine outcome - adjust difficulty based on match type
  const skillFactor = window.player.skills.melee * 0.1 + window.player.phy * 0.15;
  const baseChance = 0.6 + skillFactor; // Base 60% chance of winning plus skill bonus
  const winChance = Math.max(0.1, Math.min(0.9, baseChance - difficultyMod)); // Min 10%, max 90%
  
  const roll = Math.random();
  let outcome = "";
  
  if (roll > winChance + 0.2) {
    // Lose the fight
    const staminaLoss = Math.floor(Math.random() * 15) + 10;
    const healthLoss = Math.floor(Math.random() * 10) + 5;
    window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaLoss);
    window.gameState.health = Math.max(1, window.gameState.health - healthLoss);
    outcome = `You put up a good fight but ultimately lost the match. You take ${healthLoss} damage and lose ${staminaLoss} stamina, but gain respect for your courage.`;
    window.showNotification(`Lost the fight! -${healthLoss} health`, 'warning');
    
    // Still gain some experience for trying
    window.gameState.experience += 15;
  } else if (roll > winChance - 0.2) {
    // Win a regular match
    const staminaLoss = Math.floor(Math.random() * 10) + 10;
    const healthLoss = Math.floor(Math.random() * 7) + 3;
    // Winnings scale with difficulty
    const taelorsWon = Math.floor(buyIn * (1.5 + difficultyMod * 2));
    
    window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaLoss);
    window.gameState.health = Math.max(1, window.gameState.health - healthLoss);
    window.player.taelors += taelorsWon;
    
    outcome = `You win the match after a tough fight! You take ${healthLoss} damage and lose ${staminaLoss} stamina, but earn ${taelorsWon} taelors and the respect of your fellow soldiers.`;
    window.showNotification(`Won the fight! +${taelorsWon} taelors`, 'success');
    
    window.gameState.experience += 25;
    
    // Improve physical attribute (small chance)
    if (Math.random() < 0.2) {
      const maxPhy = window.player.men > 0 ? Math.min(15, Math.ceil(window.player.men / 0.6)) : 15;
      if (window.player.phy < maxPhy) {
        const phyImprovement = Number(Math.random() * 0.03 + 0.02);
        const oldPhy = Number(window.player.phy);
        window.player.phy = Math.min(maxPhy, oldPhy + phyImprovement);
        window.player.phy = Math.round(window.player.phy * 100) / 100;
        
        const actualImprovement = Math.round((window.player.phy - oldPhy) * 100) / 100;
        if (actualImprovement > 0) {
          window.showNotification(`Physical (PHY) +${actualImprovement.toFixed(2)}`, 'success');
        }
      }
    }
    
    // Improve melee skill
    const meleeCap = Math.floor(window.player.phy / 1.5);
    if (window.player.skills.melee < meleeCap) {
      const meleeImprovement = parseFloat((Math.random() * 0.05 + 0.05).toFixed(2));
      const oldMelee = Number(window.player.skills.melee);
      window.player.skills.melee = Math.min(meleeCap, oldMelee + meleeImprovement);
      window.player.skills.melee = Math.round(window.player.skills.melee * 100) / 100;
      
      const actualImprovement = Math.round((window.player.skills.melee - oldMelee) * 100) / 100;
      if (actualImprovement > 0) {
        window.showNotification(`Melee Combat +${actualImprovement.toFixed(2)}`, 'success');
      }
    }
  } else {
    // Spectacular victory
    const staminaLoss = Math.floor(Math.random() * 10) + 5;
    const healthLoss = Math.floor(Math.random() * 5) + 1;
    // Winnings scale with difficulty
    const taelorsWon = Math.floor(buyIn * (2 + difficultyMod * 3));
    
    window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaLoss);
    window.gameState.health = Math.max(1, window.gameState.health - healthLoss);
    window.player.taelors += taelorsWon;
    
    outcome = `You deliver a spectacular performance, defeating your opponent with skill and precision! The crowd goes wild. You take minimal damage (${healthLoss}), lose ${staminaLoss} stamina, and earn a hefty prize of ${taelorsWon} taelors.`;
    window.showNotification(`Spectacular victory! +${taelorsWon} taelors`, 'success');
    
    window.gameState.experience += 35;
    
    // Guaranteed physical attribute improvement
    const maxPhy = window.player.men > 0 ? Math.min(15, Math.ceil(window.player.men / 0.6)) : 15;
    if (window.player.phy < maxPhy) {
      const phyImprovement = Number(Math.random() * 0.05 + 0.05);
      const oldPhy = Number(window.player.phy);
      window.player.phy = Math.min(maxPhy, oldPhy + phyImprovement);
      window.player.phy = Math.round(window.player.phy * 100) / 100;
      
      const actualImprovement = Math.round((window.player.phy - oldPhy) * 100) / 100;
      if (actualImprovement > 0) {
        window.showNotification(`Physical (PHY) +${actualImprovement.toFixed(2)}`, 'success');
      }
    }
    
    // Guaranteed melee skill improvement
    const meleeCap = Math.floor(window.player.phy / 1.5);
    if (window.player.skills.melee < meleeCap) {
      const meleeImprovement = parseFloat((Math.random() * 0.1 + 0.1).toFixed(2));
      const oldMelee = Number(window.player.skills.melee);
      window.player.skills.melee = Math.min(meleeCap, oldMelee + meleeImprovement);
      window.player.skills.melee = Math.round(window.player.skills.melee * 100) / 100;
      
      const actualImprovement = Math.round((window.player.skills.melee - oldMelee) * 100) / 100;
      if (actualImprovement > 0) {
        window.showNotification(`Melee Combat +${actualImprovement.toFixed(2)}`, 'success');
      }
    }
    
    // Increase morale significantly
    window.gameState.morale = Math.min(100, window.gameState.morale + 15);
  }
  
  window.addToNarrative(outcome);
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
  window.updateTimeAndDay(120); // 2 hours
  
  // Return to brawler pit options after a short delay
  setTimeout(function() {
    window.showBrawlerPitOptions();
  }, 1500);
};