// MAIN ENTRY POINT
// This is the main entry point that initializes the game and sets up event listeners

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Game initializing...");

  if (window.missionSystem) {
    window.missionSystem.generateAvailableMissions();
    console.log("Mission system initialized with", window.missionSystem.availableMissions.length, "available missions");
  }

  // Set up event listeners for character creation buttons
  document.getElementById('paanic-button').addEventListener('click', function() {
    window.selectOrigin('Paanic');
  });
  
  document.getElementById('nesian-button').addEventListener('click', function() {
    window.selectOrigin('Nesian');
  });
  
  document.getElementById('lunarine-button').addEventListener('click', function() {
    window.selectOrigin('Lunarine');
  });
  
  document.getElementById('wyrdman-button').addEventListener('click', function() {
    window.selectOrigin('Wyrdman');
  });
  
  document.getElementById('back-to-intro-button').addEventListener('click', window.backToIntro);
  document.getElementById('back-to-origin-button').addEventListener('click', window.backToOrigin);
  document.getElementById('confirm-name-button').addEventListener('click', window.setName);
  document.getElementById('back-to-name-button').addEventListener('click', window.backToName);
  document.getElementById('confirm-character-button').addEventListener('click', window.confirmCharacter);
  document.getElementById('continue-to-empire-button').addEventListener('click', window.showEmpireUpdate);
  document.getElementById('start-adventure-button').addEventListener('click', window.startAdventure);
  
  // Add event listeners for panel close buttons
  document.querySelector('.profile-close').addEventListener('click', function() {
    document.getElementById('profile').classList.add('hidden');
  });
  
  document.querySelector('.inventory-close').addEventListener('click', function() {
    document.getElementById('inventory').classList.add('hidden');
  });
  
  document.querySelector('.quest-log-close').addEventListener('click', function() {
    document.getElementById('questLog').classList.add('hidden');
  });
  
  console.log("Game initialized and ready to play!");
});