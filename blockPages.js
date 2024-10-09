// Function to block specified paths
function blockPaths(pathsToBlock, enableLogging = false) {
  const log = enableLogging ? console.log : () => {};
  log('Initializing blockPaths with:', pathsToBlock);
  // Convert paths to RegExp objects for flexible matching
  const blockedPatterns = pathsToBlock.map(path => new RegExp(`^${path}(\\?|$)`));

  // Function to check if the current path is blocked
  function isPathBlocked() {
    const currentPath = window.location.pathname;
    const isBlocked = blockedPatterns.some(pattern => pattern.test(currentPath));
    log(`Checking if path "${currentPath}" is blocked:`, isBlocked);
    return isBlocked;
  }

  // Function to block the page
  function blockPage() {
    if (isPathBlocked()) {
      log('Blocking page...');
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'path-block-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'white';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.color = 'white';
      overlay.style.fontSize = '24px';

      // Append overlay to body
      document.body.appendChild(overlay);
      log('Overlay appended to body');

      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      log('Scrolling disabled');
    }
  }

  // Function to unblock a specific page
  function unblockPage(path) {
    log(`Attempting to unblock path: ${path}`);
    if (window.location.pathname === path) {
      const overlay = document.getElementById('path-block-overlay');
      if (overlay) {
        overlay.remove();
        document.body.style.overflow = '';
        log(`Path ${path} unblocked successfully`);
      } else {
        log(`No overlay found for path ${path}`);
      }
    } else {
      log(`Current path does not match ${path}, unblock not performed`);
    }
  }

  // Initial check and block
  if (isPathBlocked()) {
    log('Initial check: page is blocked');
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockPage);
    } else {
        blockPage();
    }
  } else {
    log('Initial check: page is not blocked');
  }

  // Attach unblock function to window object
  window.unblockSignal = unblockPage;
  log('Unblock function attached to window.unblockSignal');
}

// Usage example:
// blockPaths(['/blocked-path', '/another-blocked-path'], true); // With logging enabled
// blockPaths(['/blocked-path', '/another-blocked-path']); // Without logging
// To unblock a specific page:
// window.unblockSignal('/blocked-path');
