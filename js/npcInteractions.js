// NPC INTERACTION SYSTEM
// Functions for interacting with NPCs and receiving missions

// NPC dialog templates
window.npcDialogs = {
  commander: {
    greeting: function() {
      const disposition = window.player.relationships.commander.disposition;
      
      if (disposition >= 60) {
        return `"Ah, ${window.player.name}. Your reputation precedes you. What can I do for my most reliable officer?"`;
      } else if (disposition >= 30) {
        return `"Good to see you, ${window.player.name}. What brings you to my tent today?"`;
      } else if (disposition >= 0) {
        return `"Soldier. State your business."`;
      } else {
        return `"Make it quick, I have more important matters to attend to."`;
      }
    },
    missionIntro: "I have several operations that require attention. Are you interested in taking on a mission?",
    missionAvailable: "These are the current operations requiring attention:",
    noMissionsAvailable: "There are no missions available for you at this time. Check back tomorrow.",
    missionAccepted: "Excellent. I expect this mission to be completed successfully. Dismissed.",
    missionRejected: "Very well. I'll find someone else for the task.",
    farewell: function() {
      const disposition = window.player.relationships.commander.disposition;
      
      if (disposition >= 30) {
        return "Carry on, soldier. Glory to the Empire.";
      } else {
        return "Dismissed.";
      }
    }
  },
  
  sergeant: {
    greeting: function() {
      const disposition = window.player.relationships.sergeant.disposition;
      const dayTime = window.getTimeOfDay();
      let greeting = "";
      
      if (dayTime === "dawn" || dayTime === "day") {
        greeting = "Up and at 'em! ";
      } else if (dayTime === "evening") {
        greeting = "Still on your feet? Good! ";
      } else {
        greeting = "Working the night shift, eh? ";
      }
      
      if (disposition >= 60) {
        return `"${greeting}Good to see one of my best. What do you need, ${window.player.name}?"`;
      } else if (disposition >= 30) {
        return `"${greeting}What can I do for you, soldier?"`;
      } else if (disposition >= 0) {
        return `"${greeting}State your business."`;
      } else {
        return `"${greeting}Make it quick."`;
      }
    },
    missionIntro: "I've got some tasks that need handling. Interested in proving yourself?",
    missionAvailable: "Here's what needs doing:",
    noMissionsAvailable: "Nothing for you right now. Come back later when I've got something.",
    missionAccepted: "Good. Don't make me regret choosing you for this.",
    missionRejected: "Your loss. I'll find someone with more spine.",
    farewell: function() {
      const disposition = window.player.relationships.sergeant.disposition;
      
      if (disposition >= 30) {
        return "Watch yourself out there. I expect you back in one piece.";
      } else {
        return "Don't slack off, soldier.";
      }
    }
  },
  
  quartermaster: {
    greeting: function() {
      const disposition = window.player.relationships.quartermaster.disposition;
      
      if (disposition >= 60) {
        return `"Well, if it isn't my favorite customer! What can I get for you today, ${window.player.name}?"`;
      } else if (disposition >= 30) {
        return `"Welcome to my humble domain of supplies and necessities. How can I help?"`;
      } else if (disposition >= 0) {
        return `"Yes? What supplies do you need?"`;
      } else {
        return `"State your requisition and move along."`;
      }
    },
    missionIntro: "Supply lines are stretched thin. I could use someone reliable for a special task.",
    missionAvailable: "I've got these urgent supply matters:",
    noMissionsAvailable: "Everything's accounted for at the moment. Check back when supplies run low again.",
    missionAccepted: "Excellent! The supplies are crucial for our operations. Don't disappoint me.",
    missionRejected: "Fine, but don't come asking for special treatment with your rations later.",
    farewell: function() {
      const disposition = window.player.relationships.quartermaster.disposition;
      
      if (disposition >= 30) {
        return "Safe travels. Remember, take care of your equipment, and it'll take care of you.";
      } else {
        return "Next in line, please.";
      }
    }
  }
};

// Create NPC dialog interface
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
  
  // Show dialog
  npcDialog.style.display = 'block';
}

// Show mission details
function showMissionDetails(mission, npcId) {
  const npc = window.npcDialogs[npcId];
  const npcDialog = document.getElementById('npcDialog');
  
  if (!npcDialog) return;
  
  // Clear previous content
  npcDialog.innerHTML = '';
  
  // Create header with NPC name
  const dialogHeader = document.createElement('div');
  dialogHeader.className = 'npc-dialog-header';
  
  const avatar = document.createElement('div');
  avatar.className = 'npc-avatar';
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
  name.textContent = window.player.relationships[npcId].name;
  
  dialogHeader.appendChild(avatar);
  dialogHeader.appendChild(name);
  npcDialog.appendChild(dialogHeader);
  
  // Create mission details
  const missionDetails = document.createElement('div');
  missionDetails.className = 'mission-details';
  
  // Mission title and description
  missionDetails.innerHTML = `
    <h3>${mission.title}</h3>
    <div class="mission-difficulty">Difficulty: ${'⭐'.repeat(mission.difficulty)}</div>
    <p>${mission.description}</p>
    <div class="mission-rewards">
      <h4>Rewards:</h4>
      <ul>
        <li>Experience: +${mission.rewards.experience}</li>
        <li>Taelors: +${mission.rewards.taelors}</li>
      </ul>
    </div>
  `;
  
  // Add skill improvement potential
  if (mission.rewards.skillImprovements) {
    let skillsText = '<h4>Potential Skill Improvements:</h4><ul>';
    for (const [skill, improvement] of Object.entries(mission.rewards.skillImprovements)) {
      skillsText += `<li>${skill.charAt(0).toUpperCase() + skill.slice(1)}: +${improvement.min.toFixed(2)} to +${improvement.max.toFixed(2)}</li>`;
    }
    skillsText += '</ul>';
    missionDetails.innerHTML += skillsText;
  }
  
  npcDialog.appendChild(missionDetails);
  
  // Create buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'mission-buttons';
  
  // Accept mission button
  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'action-btn';
  acceptBtn.textContent = 'Accept Mission';
  acceptBtn.onclick = function() {
    acceptMission(mission.id, npcId);
  };
  
  // Back button
  const backBtn = document.createElement('button');
  backBtn.className = 'action-btn';
  backBtn.textContent = 'Back';
  backBtn.onclick = function() {
    window.createNPCDialog(npcId);
  };
  
  buttonContainer.appendChild(acceptBtn);
  buttonContainer.appendChild(backBtn);
  npcDialog.appendChild(buttonContainer);
}

// Accept mission function
function acceptMission(missionId, npcId) {
  const npc = window.npcDialogs[npcId];
  const npcDialog = document.getElementById('npcDialog');
  
  if (!npcDialog) return;
  
  // Show acceptance dialog
  npcDialog.innerHTML = '';
  
  // Create header with NPC name
  const dialogHeader = document.createElement('div');
  dialogHeader.className = 'npc-dialog-header';
  
  const avatar = document.createElement('div');
  avatar.className = 'npc-avatar';
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
  name.textContent = window.player.relationships[npcId].name;
  
  dialogHeader.appendChild(avatar);
  dialogHeader.appendChild(name);
  npcDialog.appendChild(dialogHeader);
  
  // Create content
  const dialogContent = document.createElement('div');
  dialogContent.className = 'npc-dialog-content';
  dialogContent.innerHTML = `<p>${npc.missionAccepted}</p>`;
  npcDialog.appendChild(dialogContent);
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'action-btn';
  closeBtn.textContent = 'Begin Mission';
  closeBtn.onclick = function() {
    closeNPCDialog(npcId);
    startAcceptedMission(missionId);
  };
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'mission-buttons';
  buttonContainer.appendChild(closeBtn);
  npcDialog.appendChild(buttonContainer);
}

// Start the accepted mission
function startAcceptedMission(missionId) {
  // Start the mission using the mission system
  window.missionSystem.startMission(missionId);
}

// Close NPC dialog
function closeNPCDialog(npcId) {
  const npc = window.npcDialogs[npcId];
  const npcDialog = document.getElementById('npcDialog');
  
  if (!npcDialog) return;
  
  // Add farewell message to narrative
  window.addToNarrative(`${window.player.relationships[npcId].name}: "${npc.farewell()}"`);
  
  // Hide and remove dialog
  npcDialog.style.display = 'none';
  document.body.removeChild(npcDialog);
}

// Add NPC interaction to the action handler
const originalHandleAction = window.handleAction;
window.handleAction = function(action) {
  // Check if this is an NPC interaction
  if (action === 'talk_commander') {
    window.createNPCDialog('commander');
    return;
  } else if (action === 'talk_sergeant') {
    window.createNPCDialog('sergeant');
    return;
  } else if (action === 'talk_quartermaster') {
    window.createNPCDialog('quartermaster');
    return;
  }
  
  // Otherwise, use the original handler
  originalHandleAction(action);
};

// Update action buttons to include NPC interactions
const originalUpdateActionButtons = window.updateActionButtons;
window.updateActionButtons = function() {
  originalUpdateActionButtons();
  
  // Only add NPC interactions if not in battle or mission
  if (!window.gameState.inBattle && !window.gameState.inMission) {
    const actionsContainer = document.getElementById('actions');
    
    // Add NPC interaction buttons
    if (window.missionSystem.canGetMissionsFrom('commander')) {
      window.addActionButton('Talk to Commander', 'talk_commander', actionsContainer);
    }
    
    if (window.missionSystem.canGetMissionsFrom('sergeant')) {
      window.addActionButton('Talk to Sergeant', 'talk_sergeant', actionsContainer);
    }
    
    if (window.missionSystem.canGetMissionsFrom('quartermaster')) {
      window.addActionButton('Talk to Quartermaster', 'talk_quartermaster', actionsContainer);
    }
  }
};

// Extend quest log to include mission history
const originalHandleAction_questLog = window.handleAction;
window.handleAction = function(action) {
  if (action === 'questLog') {
    // Update quest log before showing
    const questList = document.getElementById('questList');
    
    // Add mission history to quest log (after regular quests)
    if (window.missionSystem.missionHistory.length > 0) {
      questList.innerHTML += `<h3>Mission History</h3>`;
      
      window.missionSystem.missionHistory.forEach((mission, index) => {
        questList.innerHTML += `
          <div class="mission-log-entry">
            <div class="mission-log-title">${mission.title}</div>
            <div class="mission-log-status ${mission.success ? 'completed' : 'failed'}">
              ${mission.success ? 'Completed' : 'Failed'} on Day ${mission.completedOn}
            </div>
          </div>
        `;
      });
    }
  }
  
  // Call the original function
  originalHandleAction_questLog(action);
};
