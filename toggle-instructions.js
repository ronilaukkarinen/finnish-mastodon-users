// When DOM is ready
addEventListener('DOMContentLoaded', (event) => {

  // Show instructions toggle
  const showInstructions = document.getElementById('show-instructions');
  const instructions = document.getElementById('instructions');

  showInstructions.addEventListener('click', (event) => {
    const isExpanded = showInstructions.getAttribute('aria-expanded') === 'true' || false;

    // Hidden attribute toggle
    instructions.hidden = !instructions.hidden;

    showInstructions.setAttribute('aria-expanded', !isExpanded);
    instructions.setAttribute('aria-hidden', isExpanded);
  });

  // Update aria-busy for user-count in Vanilla JS
  const userCount = document.getElementById('user-count');
  userCount.setAttribute('aria-busy', 'true');

  // Update aria-busy for user-list in Vanilla JS
  const userList = document.getElementById('user-list');
  userList.setAttribute('aria-busy', 'true');

});
