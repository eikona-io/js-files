function createBanner(divElement, options = {}) {
  const {
    shape = 'right-diagonal',
    text = '',
    textColor = '#ffffff',
    shapeColor = '#000000',
    textSize = '4rem',
    textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)',
    diagonalAngle = 33.33
  } = options;

  divElement.style.position = 'relative';
  divElement.style.overflow = 'hidden';

  const shapeOverlay = document.createElement('div');
  shapeOverlay.style.position = 'absolute';
  shapeOverlay.style.top = '0';
  shapeOverlay.style.left = '0';
  shapeOverlay.style.width = '100%';
  shapeOverlay.style.height = '100%';
  shapeOverlay.style.backgroundColor = shapeColor;
  shapeOverlay.style.display = 'flex';
  shapeOverlay.style.alignItems = 'center';
  shapeOverlay.style.justifyContent = 'center';

  let clipPath;
  let textContainerStyle = {};
  switch (shape) {
    case 'right-diagonal':
      clipPath = `polygon(75% 0%, 100% 0%, 100% 100%, 55% 100%)`;
      textContainerStyle = { right: '0', width: '30%', height: '100%' };
      break;
    case 'left-diagonal':
      clipPath = `polygon(0% 0%, 66.67% 0%, 33.33% 100%, 0% 100%)`;
      textContainerStyle = { left: '0', width: '33.33%', height: '100%' };
      break;
    case 'top-circle':
      clipPath = 'ellipse(50% 16.67% at 50% 0%)';
      textContainerStyle = { top: '0', left: '25%', width: '50%', height: '16.67%' };
      break;
    case 'bottom-circle':
      clipPath = 'ellipse(50% 16.67% at 50% 100%)';
      textContainerStyle = { bottom: '0', left: '25%', width: '50%', height: '16.67%' };
      break;
    default:
      clipPath = '';
  }
  shapeOverlay.style.clipPath = clipPath;

  const textContainer = document.createElement('div');
  Object.assign(textContainer.style, {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...textContainerStyle
  });

  const textElement = document.createElement('div');
  textElement.innerText = text;
  Object.assign(textElement.style, {
    color: textColor,
    fontSize: textSize,
    fontWeight: 'bold',
    textShadow: textShadow,
    pointerEvents: 'none',
    textAlign: 'center',
    width: '100%',
    wordWrap: 'break-word',
    overflowWrap: 'break-word'
  });

  textContainer.appendChild(textElement);
  shapeOverlay.appendChild(textContainer);
  divElement.appendChild(shapeOverlay);
}
