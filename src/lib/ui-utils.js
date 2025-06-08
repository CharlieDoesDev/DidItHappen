// This file contains utility functions for the VFX gallery application

/**
 * Creates and returns an FOV indicator element
 * @param {HTMLElement} parent - The parent element to append the indicator to
 * @param {number} initialFov - The initial FOV value to display
 * @returns {HTMLElement} The created FOV indicator element
 */
export function createFovIndicator(parent, initialFov) {
  if (initialFov === undefined) {
    console.error(
      "FOV not defined in config, please add it to sceneconfig.json"
    );
    initialFov = 75; // Only as a fallback to prevent UI errors
  }

  const fovIndicator = document.createElement("div");
  fovIndicator.id = "fov-indicator";
  fovIndicator.style.cssText =
    "position:absolute;right:10px;top:10px;z-index:10;font-size:0.9rem;color:white;background:rgba(0,0,0,0.5);padding:5px 10px;border-radius:4px;";
  fovIndicator.textContent = `FOV: ${initialFov}°`;
  parent.appendChild(fovIndicator);
  return fovIndicator;
}

/**
 * Creates and returns a height indicator element
 * @param {HTMLElement} parent - The parent element to append the indicator to
 * @param {number} initialHeight - The initial height value to display
 * @returns {HTMLElement} The created height indicator element
 */
export function createHeightIndicator(parent, initialHeight) {
  if (initialHeight === undefined) {
    console.error(
      "Height not defined in config, please add it to sceneconfig.json"
    );
    initialHeight = 3; // Only as a fallback to prevent UI errors
  }

  const heightIndicator = document.createElement("div");
  heightIndicator.id = "height-indicator";
  heightIndicator.style.cssText =
    "position:absolute;right:10px;top:40px;z-index:10;font-size:0.9rem;color:white;background:rgba(0,0,0,0.5);padding:5px 10px;border-radius:4px;";
  heightIndicator.textContent = `Height: ${initialHeight}`;
  parent.appendChild(heightIndicator);
  return heightIndicator;
}

/**
 * Updates the height indicator with a new value
 * @param {HTMLElement} indicator - The height indicator element
 * @param {number} height - The new height value to display
 */
export function updateHeightIndicator(indicator, height) {
  if (indicator) {
    indicator.textContent = `Height: ${height.toFixed(1)}`;
  }
}
