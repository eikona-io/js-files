// Function to block specified paths
function blockPaths(pathsToBlock) {
  // Convert paths to RegExp objects for flexible matching
  const blockedPatterns = pathsToBlock.map(path => new RegExp(`^${path}(\\?|$)`));

  // Function to check if the current path is blocked
  function isPathBlocked() {
    const currentPath = window.location.pathname;
    return blockedPatterns.some(pattern => pattern.test(currentPath));
  }

  // Function to block the page
  function blockPage() {
    if (isPathBlocked()) {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'path-block-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.color = 'white';
      overlay.style.fontSize = '24px';
      overlay.textContent = 'This page is currently blocked.';

      // Append overlay to body
      document.body.appendChild(overlay);

      // Prevent scrolling
      document.body.style.overflow = 'hidden';
    }
  }

  // Function to unblock a specific page
  function unblockPage(path) {
    if (window.location.pathname === path) {
      const overlay = document.getElementById('path-block-overlay');
      if (overlay) {
        overlay.remove();
        document.body.style.overflow = '';
      }
    }
  }

  // Initial check and block
  if (isPathBlocked()) {
    blockPage();
  }

  // Attach unblock function to window object
  window.unblockSignal = unblockPage;
}

// Usage example:
// blockPaths(['/blocked-path', '/another-blocked-path']);
// To unblock a specific page:
// window.unblockSignal('/blocked-path');

