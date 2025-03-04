// MISSION SYSTEM MODULE
// Functions for generating, tracking, and progressing through missions

// Mission templates with narrative content, choices, and outcomes
window.missionTemplates = {
  // COMBAT MISSIONS
  "border_patrol": {
    title: "Border Patrol",
    giver: "sergeant",
    description: "The sergeant needs someone to lead a border patrol along the western edge of our camp's influence. There have been reports of Arrasi activity in the area.",
    difficulty: 1,
    requiredLevel: 1,
    stages: [
      {
        narrative: "The western border is marked by a series of low hills and shallow ravines—perfect for ambushes. Your patrol group consists of four other soldiers, all looking to you for guidance.",
        choices: [
          { text: "Take the high road, maintaining visibility", action: "tactical", result: "You lead the patrol along ridgelines, maintaining good visibility of the surroundings. It's slower going, but you spot movement in a valley below." },
          { text: "Move quickly through the ravines", action: "aggressive", result: "You make good time through the ravines, but the enclosed space makes everyone nervous. Suddenly, you hear movement ahead." }
        ]
      },
      {
        narrative: "You detect signs of recent activity—disturbed earth, broken branches, and what appears to be tracks leading west.",
        choices: [
          { text: "Follow the tracks cautiously", action: "tactical", combatChance: 0.3, result: "You follow the tracks carefully, moving from cover to cover. Your caution pays off when you spot an Arrasi scout before he notices you." },
          { text: "Set up an ambush position", action: "tactical", combatChance: 0.5, result: "You position your patrol in good cover and wait. After some time, two Arrasi scouts walk into your trap." },
          { text: "Pursue aggressively", action: "aggressive", combatChance: 0.8, result: "You pursue the tracks quickly, eager to catch up. Your speed brings you right into an Arrasi patrol." }
        ]
      },
      {
        narrative: "With the immediate situation handled, you need to decide how to complete your patrol.",
        choices: [
          { text: "Complete the full patrol route", action: "tactical", result: "You complete the full patrol route, gathering valuable intelligence about the surrounding area. The sergeant will be pleased with your thoroughness." },
          { text: "Return to camp with your findings", action: "conservative", result: "You decide that the information you've gathered is significant enough to warrant an immediate return to camp. Better to report what you know than risk further engagement." }
        ],
        completion: true
      }
    ],
    rewards: {
      experience: 75,
      taelors: 25,
      skillImprovements: {
        tactics: { min: 0.12, max: 0.24 },
        command: { min: 0.08, max: 0.15 }
      },
      relationshipChanges: {
        sergeant: { min: 5, max: 10 }
      }
    },
    enemies: ["arrasi_scout", "arrasi_warrior"],
    cooldown: 3 // Days before this mission is available again
  },
  
  "supply_recovery": {
    title: "Supply Recovery",
    giver: "quartermaster",
    description: "A supply caravan was ambushed a day's march from camp. The quartermaster needs someone to recover what supplies remain and assess the situation.",
    difficulty: 2,
    requiredLevel: 2,
    stages: [
      {
        narrative: "The ambush site is a grim scene—overturned wagons, scattered supplies, and signs of a fierce but brief battle. There are no survivors, but valuable supplies remain.",
        choices: [
          { text: "Search the area thoroughly", action: "tactical", result: "Your careful search reveals tracks leading east—likely the attackers. You also find a hidden cache of supplies the attackers missed." },
          { text: "Gather supplies quickly and prepare defenses", action: "conservative", result: "You focus on recovering the supplies, working quickly in case the attackers return. Your efficiency means you're ready when you hear movement in the nearby woods." }
        ]
      },
      {
        narrative: "As your group works to salvage what supplies you can, you notice movement at the edge of the clearing.",
        choices: [
          { text: "Set up an ambush", action: "aggressive", combatChance: 0.7, result: "You quickly position your soldiers in cover and wait. When the Arrasi raiders return to check the site, they walk right into your trap." },
          { text: "Continue recovery while maintaining lookouts", action: "tactical", combatChance: 0.4, result: "You post lookouts while continuing the recovery operation. When raiders approach, your lookouts give you enough warning to prepare." },
          { text: "Withdraw with what you've gathered", action: "conservative", combatChance: 0.2, result: "You decide not to risk an engagement and begin a withdrawal with the supplies you've gathered. As you leave, you hear distant voices—you've narrowly avoided a returning raiding party." }
        ]
      },
      {
        narrative: "With supplies recovered and the immediate threat addressed, you must decide how to return to camp.",
        choices: [
          { text: "Take the direct route back", action: "aggressive", combatChance: 0.3, result: "You take the most direct route back to camp, moving as quickly as possible with the recovered supplies. Your speed is an advantage, but you encounter a small enemy patrol along the way." },
          { text: "Use a longer but safer route", action: "conservative", result: "You choose a longer route that avoids likely enemy positions. It takes more time, but you return to camp without further incident." }
        ],
        completion: true
      }
    ],
    rewards: {
      experience: 100,
      taelors: 35,
      skillImprovements: {
        tactics: { min: 0.15, max: 0.25 },
        survival: { min: 0.1, max: 0.2 }
      },
      relationshipChanges: {
        quartermaster: { min: 8, max: 15 }
      },
      items: [
        { chance: 0.6, item: { name: "Military Rations", type: "consumable", value: 15, effect: "Restores 25 stamina" } },
        { chance: 0.4, item: { name: "Medicinal Kit", type: "consumable", value: 25, effect: "Heals 30 health" } }
      ]
    },
    enemies: ["arrasi_warrior", "imperial_deserter"],
    cooldown: 4
  },
  
  // DIPLOMATIC MISSIONS
  "village_negotiation": {
    title: "Village Negotiation",
    giver: "commander",
    description: "A nearby village has been reluctant to supply our camp. The commander wants you to negotiate for their cooperation without causing further tension.",
    difficulty: 2,
    requiredLevel: 2,
    stages: [
      {
        narrative: "The village of Taldeth sits on the edge of a fertile valley. As you approach, you see farmers watching you warily from their fields. The village elder waits at the gate, his expression guarded.",
        choices: [
          { text: "Approach formally with military protocol", action: "disciplined", result: "Your formal approach signals respect for procedure. The elder acknowledges your discipline but seems unmoved by the display of imperial protocol." },
          { text: "Approach casually, with minimal armed escort", action: "diplomatic", result: "You approach with a small escort, weapons sheathed. The elder relaxes slightly at this sign of peaceful intent." }
        ]
      },
      {
        narrative: "The elder explains their reluctance: 'Your soldiers took more than agreed upon last month, and two of our young women were harassed. Why should we supply those who don't respect us?'",
        choices: [
          { text: "Promise imperial justice for any wrongdoing", action: "disciplined", result: "You assure the elder that such behavior is unacceptable and promise that any soldiers found guilty will face imperial justice. He seems doubtful but appreciates your stance." },
          { text: "Apologize and offer additional payment", action: "diplomatic", result: "You offer a sincere apology and additional payment from your own funds as a gesture of goodwill. The elder is surprised by your sincerity and the conversation takes a more positive turn." },
          { text: "Remind them of their duty to the Empire", action: "aggressive", result: "You remind the elder that all subjects have duties to the Empire. His expression hardens, and negotiations become more difficult." }
        ]
      },
      {
        narrative: "As discussions continue, a commotion erupts at the edge of the village. Several imperial soldiers from another unit have arrived and are demanding immediate supplies.",
        choices: [
          { text: "Assert your authority over the soldiers", action: "disciplined", result: "You quickly intercede, asserting your authority and ordering the soldiers to stand down. Your decisive action impresses both the soldiers and the villagers." },
          { text: "Ask the elder to trust you to handle this", action: "diplomatic", result: "You ask the elder for a moment and approach the soldiers alone. Through a combination of persuasion and firmness, you convince them to leave. The elder watches approvingly." },
          { text: "Join forces with the soldiers to strengthen your position", action: "aggressive", combatChance: 0.3, result: "You join the soldiers, thinking a united front will strengthen your negotiating position. Instead, tensions escalate rapidly, and the situation nearly turns violent before you can regain control." }
        ],
        completion: true
      }
    ],
    rewards: {
      experience: 90,
      taelors: 30,
      skillImprovements: {
        tactics: { min: 0.1, max: 0.2 },
        command: { min: 0.15, max: 0.3 }
      },
      relationshipChanges: {
        commander: { min: 8, max: 15 }
      }
    },
    cooldown: 5
  },
  
  // INTELLIGENCE MISSIONS
  "scout_arrasi_positions": {
    title: "Scout Arrasi Positions",
    giver: "commander",
    description: "Intelligence suggests Arrasi forces are establishing new positions west of our camp. The commander needs accurate information on their numbers and disposition.",
    difficulty: 3,
    requiredLevel: 3,
    stages: [
      {
        narrative: "You lead a small scouting party toward the suspected Arrasi positions. The terrain is challenging—dense forests give way to rocky outcroppings with limited visibility.",
        choices: [
          { text: "Split your group to cover more ground", action: "tactical", result: "You divide your scouts to cover more territory. It's risky, but efficient. Your team discovers multiple small Arrasi camps rather than one large concentration." },
          { text: "Keep the group together and move methodically", action: "conservative", result: "You keep your scouts together, moving carefully from position to position. Progress is slower, but you maintain good security." }
        ]
      },
      {
        narrative: "You discover an Arrasi encampment larger than expected. From your vantage point, you can see warriors gathering and what appears to be a war council in progress.",
        choices: [
          { text: "Get closer to gather detailed intelligence", action: "aggressive", combatChance: 0.7, result: "You risk moving closer to gather more detailed intelligence. The information is valuable, but an Arrasi sentry spots movement and raises the alarm." },
          { text: "Observe from a distance", action: "tactical", combatChance: 0.2, result: "You observe patiently from a distance, gathering what information you can without risking detection. You note troop numbers, weapons, and patterns of movement." },
          { text: "Send one scout closer while others provide cover", action: "tactical", combatChance: 0.4, result: "You send your most stealthy scout closer while the rest of the team provides overwatch. The scout returns with valuable details, but your position is compromised shortly after." }
        ]
      },
      {
        narrative: "With vital intelligence gathered, you need to return to camp. However, you've noticed increased Arrasi patrols in the area.",
        choices: [
          { text: "Take a direct but dangerous route back", action: "aggressive", combatChance: 0.5, result: "You opt for speed over caution, taking the most direct route back to camp. Your haste brings you into contact with an Arrasi patrol." },
          { text: "Use diversionary tactics to ensure safe return", action: "tactical", combatChance: 0.3, result: "You create false trails and minor distractions to draw attention away from your actual route. The tactic works, though you briefly engage a small enemy group." },
          { text: "Travel only at night, taking maximum precautions", action: "conservative", result: "You move only under cover of darkness, using every precaution. The return journey takes longer, but you avoid detection completely." }
        ],
        completion: true
      }
    ],
    rewards: {
      experience: 120,
      taelors: 40,
      skillImprovements: {
        tactics: { min: 0.18, max: 0.3 },
        survival: { min: 0.15, max: 0.25 }
      },
      relationshipChanges: {
        commander: { min: 10, max: 20 }
      }
    },
    enemies: ["arrasi_scout", "arrasi_warrior"],
    cooldown: 6
  }
};

// Mission states and active mission tracking
window.missionSystem = {
  availableMissions: [],
  activeMission: null,
  currentStage: 0,
  missionResult: null,
  missionHistory: [],
  lastMissionCompleted: null,
  
  // Days until missions become available again after completion
  missionCooldowns: {},
  
  // Mission generation and selection
  generateAvailableMissions: function() {
    this.availableMissions = [];
    
    // Check which missions should be available based on level, cooldowns, etc.
    for (const [missionId, mission] of Object.entries(window.missionTemplates)) {
      // Skip if player level is too low
      if (window.gameState.level < mission.requiredLevel) {
        continue;
      }
      
      // Skip if mission is on cooldown
      if (this.missionCooldowns[missionId] && this.missionCooldowns[missionId] > 0) {
        continue;
      }
      
      // Skip if prerequisites not met (could be extended)
      // ... additional checks here
      
      // Add to available missions
      this.availableMissions.push({
        id: missionId,
        ...mission
      });
    }
    
    // Sort by difficulty
    this.availableMissions.sort((a, b) => a.difficulty - b.difficulty);
    
    return this.availableMissions;
  },
  
  // Start a mission
  startMission: function(missionId) {
    const mission = window.missionTemplates[missionId];
    if (!mission) {
      console.error("Mission not found:", missionId);
      return false;
    }
    
    // Set active mission
    this.activeMission = {
      id: missionId,
      ...mission,
      startTime: window.gameTime,
      startDay: window.gameDay,
      playerChoices: []
    };
    
    // Reset stage counter
    this.currentStage = 0;
    
    // Set game state for mission
    window.gameState.inMission = true;
    window.gameState.missionStage = 0;
    window.gameState.currentMission = missionId;
    
    // Display first stage
    this.displayMissionStage();
    
    return true;
  },
  
  // Display current mission stage
  displayMissionStage: function() {
    if (!this.activeMission) {
      console.error("No active mission");
      return;
    }
    
    const stage = this.activeMission.stages[this.currentStage];
    if (!stage) {
      console.error("Invalid mission stage:", this.currentStage);
      return;
    }
    
    // Create mission interface
    this.createMissionInterface(stage);
  },
  
  // Create UI for mission stage
  createMissionInterface: function(stage) {
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
    
    // Add choices
    stage.choices.forEach((choice, index) => {
      const choiceBtn = document.createElement('button');
      choiceBtn.className = 'mission-choice-btn';
      choiceBtn.textContent = choice.text;
      choiceBtn.setAttribute('data-choice-index', index);
      choiceBtn.onclick = () => this.handleMissionChoice(index);
      choicesContainer.appendChild(choiceBtn);
    });
    
    missionInterface.appendChild(choicesContainer);
    
    // Show the mission interface
    missionInterface.style.display = 'block';
    
    // Update narrative to include mission context
    window.setNarrative(`Mission: ${this.activeMission.title}\n\n${stage.narrative}`);
  },
  
  // Handle player's choice in mission
  handleMissionChoice: function(choiceIndex) {
    const stage = this.activeMission.stages[this.currentStage];
    const choice = stage.choices[choiceIndex];
    
    // Record player's choice
    this.activeMission.playerChoices.push({
      stage: this.currentStage,
      choice: choiceIndex,
      action: choice.action
    });
    
    // Display result
    window.addToNarrative(choice.result);
    
    // Consume resources based on choice action type
    this.consumeResources(choice.action);
    
    // Check for combat
    if (choice.combatChance && Math.random() < choice.combatChance) {
      // Initiate combat based on mission's enemy types
      this.initiateMissionCombat();
      return;
    }
    
    // Check if this stage completes the mission
    if (stage.completion) {
      // Complete mission after a short delay
      setTimeout(() => {
        this.completeMission(true);
      }, 2000);
      return;
    }
    
    // Move to next stage after a short delay
    setTimeout(() => {
      this.currentStage++;
      this.displayMissionStage();
    }, 2000);
  },
  
  // Consume resources based on action type
  consumeResources: function(actionType) {
    // Consume time based on action (30-60 minutes per choice)
    const timeSpent = 30 + Math.floor(Math.random() * 30);
    window.updateTimeAndDay(timeSpent);
    
    // Consume stamina based on action type
    let staminaCost = 5; // Base stamina cost
    switch(actionType) {
      case 'aggressive':
        staminaCost = 15;
        break;
      case 'tactical':
        staminaCost = 10;
        break;
      case 'conservative':
        staminaCost = 5;
        break;
      case 'disciplined':
        staminaCost = 8;
        break;
      case 'diplomatic':
        staminaCost = 5;
        break;
    }
    
    // Apply stamina cost
    window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaCost);
    
    // Update morale based on action
    let moraleDelta = 0;
    if (actionType === 'aggressive' && Math.random() < 0.3) {
      moraleDelta = Math.random() < 0.5 ? 5 : -5; // Risky: could go either way
    } else if (actionType === 'tactical' && Math.random() < 0.2) {
      moraleDelta = 3; // Small boost for good planning
    }
    
    // Apply morale change
    if (moraleDelta !== 0) {
      window.gameState.morale = Math.max(0, Math.min(100, window.gameState.morale + moraleDelta));
      if (moraleDelta > 0) {
        window.showNotification(`Your tactical approach boosts morale! +${moraleDelta} Morale`, 'success');
      } else if (moraleDelta < 0) {
        window.showNotification(`The risky approach costs morale. ${moraleDelta} Morale`, 'warning');
      }
    }
    
    // Update UI
    window.updateStatusBars();
  },
  
  // Initiate combat during mission
  initiateMissionCombat: function() {
    // Select enemy type from mission's enemy list
    const enemyTypes = this.activeMission.enemies || ["arrasi_scout"];
    const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    // Set mission combat flag
    window.gameState.inMissionCombat = true;
    
    // Add mission context to narrative
    window.addToNarrative("You must engage the enemy!");
    
    // Hide mission interface before combat starts
    const missionInterface = document.getElementById('missionInterface');
    if (missionInterface) {
      missionInterface.style.display = 'none';
    }
    
    // Store current mission state for when combat ends
    window.gameState.missionStateBefore = {
      interface: document.getElementById('missionInterface')?.innerHTML || null,
      narrative: document.getElementById('narrative')?.innerHTML || null
    };
    
    // Start combat encounter
    window.startCombat(randomEnemyType);
    
    // Combat result will be handled by the combatSystem endCombat function
    // which checks for window.gameState.inMissionCombat
  },
  
  // Continue mission after combat
  continueMissionAfterCombat: function(combatResult) {
    // Reset mission combat flag
    window.gameState.inMissionCombat = false;
    
    // Restore mission interface if it exists
    const missionInterface = document.getElementById('missionInterface');
    if (missionInterface) {
      missionInterface.style.display = 'block';
    }
    
    // Add narrative based on combat outcome
    if (combatResult.victory) {
      window.setNarrative("With the threat eliminated, you continue your mission.");
      // Add combat details to narrative
      window.addToNarrative(`You defeated the ${combatResult.enemyName || "enemy"} and can now proceed with your mission.`);
    } else if (combatResult.retreatSuccess) {
      window.setNarrative("Having escaped the immediate danger, you cautiously resume your mission.");
      window.addToNarrative("Though you didn't defeat your opponent, you managed to escape and can continue with your objectives.");
    } else {
      // Player was defeated - mission failed
      window.setNarrative("Your defeat forces you to abort the mission and return to camp.");
      window.addToNarrative("Beaten and bruised, you make your way back to report your failure.");
      this.completeMission(false);
      return;
    }
    
    // Ensure narrative scrolls to bottom
    const narrativeDiv = document.getElementById('narrative');
    if (narrativeDiv) {
      setTimeout(() => {
        narrativeDiv.scrollTop = narrativeDiv.scrollHeight;
      }, 100);
    }
    
    // Check if this was the final stage
    const currentStage = this.activeMission.stages[this.currentStage];
    if (currentStage && currentStage.completion) {
      this.completeMission(true);
      return;
    }
    
    // Move to next stage
    this.currentStage++;
    this.displayMissionStage();
  },
  
  // Complete mission and give rewards
  completeMission: function(success) {
    if (!this.activeMission) {
      console.error("No active mission to complete");
      return;
    }
    
    // Calculate mission duration
    const durationDays = window.gameDay - this.activeMission.startDay;
    const durationHours = Math.floor((window.gameTime - this.activeMission.startTime) / 60);
    
    // Store result
    this.missionResult = {
      missionId: this.activeMission.id,
      title: this.activeMission.title,
      success: success,
      playerChoices: this.activeMission.playerChoices,
      duration: { days: durationDays, hours: durationHours },
      completedOn: window.gameDay
    };
    
    // Add to history
    this.missionHistory.push(this.missionResult);
    
    // Set cooldown for this mission
    this.missionCooldowns[this.activeMission.id] = this.activeMission.cooldown || 5;
    
    // Save reference to completed mission for rewards
    this.lastMissionCompleted = this.activeMission;
    
    // Update narrative with outcome
    if (success) {
      window.setNarrative(`Mission Complete: ${this.activeMission.title}\n\nYou have successfully completed the mission. Return to camp to report your findings and receive your rewards.`);
      
      // Show return to camp button
      this.showMissionCompletionInterface(true);
    } else {
      window.setNarrative(`Mission Failed: ${this.activeMission.title}\n\nThe mission was unsuccessful. Return to camp to report what happened.`);
      
      // Show return to camp button
      this.showMissionCompletionInterface(false);
    }
    
    // Reset active mission
    this.activeMission = null;
    this.currentStage = 0;
    
    // Reset game state
    window.gameState.inMission = false;
    window.gameState.missionStage = 0;
    window.gameState.currentMission = null;
  },
  
  // Show mission completion interface
  showMissionCompletionInterface: function(success) {
    // Hide regular action buttons
    document.getElementById('actions').style.display = 'none';
    
    // Get mission interface
    let missionInterface = document.getElementById('missionInterface');
    if (!missionInterface) {
      missionInterface = document.createElement('div');
      missionInterface.id = 'missionInterface';
      missionInterface.className = 'mission-interface';
      document.getElementById('gameContainer').appendChild(missionInterface);
    }
    
    // Clear previous content
    missionInterface.innerHTML = '';
    
    // Create completion header
    const completionHeader = document.createElement('div');
    completionHeader.className = 'mission-header';
    completionHeader.innerHTML = `<h3>${success ? 'Mission Complete' : 'Mission Failed'}</h3>`;
    missionInterface.appendChild(completionHeader);
    
    // Create narrative container
    const narrativeContainer = document.createElement('div');
    narrativeContainer.className = 'mission-narrative';
    narrativeContainer.innerHTML = `<p>${success ? 'You have successfully completed the mission.' : 'The mission was unsuccessful.'}</p>`;
    missionInterface.appendChild(narrativeContainer);
    
    // Create return button
    const returnBtn = document.createElement('button');
    returnBtn.className = 'action-btn';
    returnBtn.textContent = 'Return to Camp';
    returnBtn.onclick = () => this.returnToCamp(success);
    missionInterface.appendChild(returnBtn);
    
    // Show the mission interface
    missionInterface.style.display = 'block';
  },
  
  // Return to camp and process rewards
  returnToCamp: function(success) {
    // Remove mission interface
    const missionInterface = document.getElementById('missionInterface');
    if (missionInterface) {
      missionInterface.style.display = 'none';
    }
    
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
  },
  
  // Give rewards based on mission
  giveRewards: function(mission) {
    const rewards = mission.rewards;
    
    // XP reward
    if (rewards.experience) {
      window.gameState.experience += rewards.experience;
      window.showNotification(`Mission Reward: +${rewards.experience} XP`, 'success');
      window.addToNarrative(`You gain ${rewards.experience} experience for completing the mission.`);
    }
    
    // Taelor reward
    if (rewards.taelors) {
      window.player.taelors += rewards.taelors;
      window.showNotification(`Mission Reward: +${rewards.taelors} taelors`, 'success');
      window.addToNarrative(`You receive ${rewards.taelors} taelors as payment for your service.`);
    }
    
    // Skill improvements
    if (rewards.skillImprovements) {
      for (const [skill, improvement] of Object.entries(rewards.skillImprovements)) {
        // Calculate random improvement within range
        const amount = Math.random() * (improvement.max - improvement.min) + improvement.min;
        const roundedAmount = Math.round(amount * 100) / 100; // Round to 2 decimal places
        
        // Apply skill improvement if skill exists
        if (window.player.skills[skill] !== undefined) {
          // Calculate skill cap based on attributes
          let skillCap = 10; // Default cap
          
          if (skill === 'melee') {
            skillCap = Math.floor(window.player.phy / 1.5);
          } else if (skill === 'marksmanship' || skill === 'survival') {
            skillCap = Math.floor((window.player.phy + window.player.men) / 3);
          } else if (skill === 'command') {
            skillCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
          } else {
            // All other mental skills
            skillCap = Math.floor(window.player.men / 1.5);
          }
          
          // Apply improvement up to cap
          const oldValue = window.player.skills[skill];
          window.player.skills[skill] = Math.min(skillCap, oldValue + roundedAmount);
          
          // Calculate actual improvement (might be less if cap was reached)
          const actualImprovement = Math.round((window.player.skills[skill] - oldValue) * 100) / 100;
          
          if (actualImprovement > 0) {
            window.showNotification(`Skill improved: ${skill} +${actualImprovement.toFixed(2)}`, 'success');
            window.addToNarrative(`Your ${skill} skill has improved by ${actualImprovement.toFixed(2)} through the challenges you faced.`);
          }
        }
      }
    }
    
    // Relationship changes
    if (rewards.relationshipChanges) {
      for (const [characterId, change] of Object.entries(rewards.relationshipChanges)) {
        // Calculate random change within range
        const amount = Math.floor(Math.random() * (change.max - change.min + 1)) + change.min;
        
        // Apply relationship change if character exists
        if (window.player.relationships[characterId]) {
          window.player.relationships[characterId].disposition += amount;
          window.player.relationships[characterId].interactions += 1;
          
          window.addToNarrative(`Your relationship with ${window.player.relationships[characterId].name} has improved.`);
        }
      }
    }
    
    // Item rewards
    if (rewards.items) {
      rewards.items.forEach(itemReward => {
        // Check item chance
        if (Math.random() < itemReward.chance && window.player.inventory.length < 20) {
          window.player.inventory.push(itemReward.item);
          window.showNotification(`Reward: ${itemReward.item.name}`, 'success');
          window.addToNarrative(`You receive ${itemReward.item.name} as a reward.`);
        }
      });
    }
    
    // Check for level up
    window.checkLevelUp();
  },
  
  // Update mission cooldowns each day
  updateCooldowns: function() {
    for (const missionId in this.missionCooldowns) {
      if (this.missionCooldowns[missionId] > 0) {
        this.missionCooldowns[missionId]--;
      }
    }
  },
  
  // Check if player can speak to an NPC about missions
  canGetMissionsFrom: function(npcId) {
    // Generate available missions first
    this.generateAvailableMissions();
    
    // Check if there are missions available from this NPC
    return this.availableMissions.some(mission => mission.giver === npcId);
  },
  
  // Get missions from a specific NPC
  getMissionsFromNPC: function(npcId) {
    return this.availableMissions.filter(mission => mission.giver === npcId);
  }
};

// Hook into game day changes to update mission cooldowns
const originalUpdateTimeAndDay = window.updateTimeAndDay;
window.updateTimeAndDay = function(minutesToAdd) {
  const oldDay = window.gameDay;
  originalUpdateTimeAndDay(minutesToAdd);
  
  // Check if day changed
  if (window.gameDay > oldDay) {
    // Update mission cooldowns
    window.missionSystem.updateCooldowns();
  }
};

// Add mission system to combat outcome handler
const originalEndCombatWithResult = window.endCombatWithResult;
window.endCombatWithResult = function(result) {
  // Check if this is mission combat
  if (window.gameState.inMissionCombat) {
    console.log("Ending mission combat with result:", result);
    
    // Add enemyName to result if available
    if (window.gameState.currentEnemy) {
      result.enemyName = window.gameState.currentEnemy.name;
    }
    
    // First end combat normally
    originalEndCombatWithResult(result);
    
    // Then continue the mission
    window.missionSystem.continueMissionAfterCombat(result);
  } else {
    // Regular combat ending
    originalEndCombatWithResult(result);
  }
};

// Debug the combat check for missions
window.missionSystem.initiateMissionCombat = function() {
  console.log("Initiating mission combat");
  
  // Select enemy type from mission's enemy list
  const enemyTypes = this.activeMission.enemies || ["arrasi_scout"];
  const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
  console.log("Selected enemy type:", randomEnemyType);
  
  // Set mission combat flag
  window.gameState.inMissionCombat = true;
  console.log("Set inMissionCombat flag to true");
  
  // Add mission context to narrative
  window.addToNarrative("You must engage the enemy!");
  
  // Hide mission interface before combat starts
  const missionInterface = document.getElementById('missionInterface');
  if (missionInterface) {
    missionInterface.style.display = 'none';
    console.log("Mission interface hidden");
  }
  
  // Store current mission state for when combat ends
  window.gameState.missionStateBefore = {
    interface: document.getElementById('missionInterface')?.innerHTML || null,
    narrative: document.getElementById('narrative')?.innerHTML || null
  };
  
  // Start combat encounter - with guaranteed combat this time
  window.startCombat(randomEnemyType);
  console.log("Combat started with enemy:", randomEnemyType);
  
  // Combat result will be handled by the combatSystem endCombat function
  // which checks for window.gameState.inMissionCombat
};
