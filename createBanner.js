function createBanner(divElement, options = {}) {
  const {
    shape = 'right-diagonal', // Options: 'right-diagonal', 'left-diagonal', 'top-circle', 'bottom-circle'
    text = '',
    textColor = '#ffffff',
    shapeColor = 'rgba(0, 0, 0, 0.5)'
  } = options;

  // Ensure the div has relative positioning
  divElement.style.position = 'relative';
  divElement.style.overflow = 'hidden';

  // Create the shape overlay
  const shapeOverlay = document.createElement('div');
  shapeOverlay.style.position = 'absolute';
  shapeOverlay.style.top = '0';
  shapeOverlay.style.left = '0';
  shapeOverlay.style.width = '100%';
  shapeOverlay.style.height = '100%';
  shapeOverlay.style.backgroundColor = shapeColor;

  // Set the clip-path based on the selected shape
  switch (shape) {
    case 'right-diagonal':
      shapeOverlay.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%)';
      break;
    case 'left-diagonal':
      shapeOverlay.style.clipPath = 'polygon(0% 0%, 0% 100%, 100% 100%)';
      break;
    case 'top-circle':
      shapeOverlay.style.clipPath = 'ellipse(50% 50% at 50% 0%)';
      break;
    case 'bottom-circle':
      shapeOverlay.style.clipPath = 'ellipse(50% 50% at 50% 100%)';
      break;
    default:
      // No clipping for default shape
      break;
  }

  // Create the text element
  const textElement = document.createElement('div');
  textElement.innerText = text;
  textElement.style.position = 'absolute';
  textElement.style.top = '0';
  textElement.style.left = '0';
  textElement.style.width = '100%';
  textElement.style.height = '100%';
  textElement.style.display = 'flex';
  textElement.style.justifyContent = 'center';
  textElement.style.alignItems = 'center';
  textElement.style.color = textColor;
  textElement.style.pointerEvents = 'none';

  // Append the shape overlay and text element to the div
  divElement.appendChild(shapeOverlay);
  divElement.appendChild(textElement);
}
