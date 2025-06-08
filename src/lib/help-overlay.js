/**
 * Creates and returns a help overlay element that shows keyboard shortcuts
 * @param {HTMLElement} parent - The parent element to append the help overlay to
 * @returns {HTMLElement} The created help overlay element
 */
export function createHelpOverlay(parent) {
  const helpBtn = document.createElement("button");
  helpBtn.textContent = "?";
  helpBtn.style.cssText =
    "position:absolute;right:10px;bottom:10px;z-index:20;font-size:1.2rem;background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;";
  parent.appendChild(helpBtn);

  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:30;display:none;flex-direction:column;justify-content:center;align-items:center;color:white;font-family:Arial,sans-serif;";

  const content = document.createElement("div");
  content.style.cssText = "max-width:600px;padding:20px;";
  content.innerHTML = `
    <h2 style="text-align:center;margin-bottom:20px;">Keyboard Controls</h2>
    <table style="border-collapse:collapse;width:100%;">
      <tr>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">Arrow Left/Right</td>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">Change particle effect</td>
      </tr>
      <tr>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">Mouse Wheel</td>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">Zoom in/out (change distance)</td>
      </tr>      <tr>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">Right Mouse + Drag</td>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">Rotate camera</td>
      </tr>
      <tr>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">Shift + Arrow Up/Down</td>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">Adjust camera height</td>
      </tr>
      <tr>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">+ / - Keys</td>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.2);">Adjust field of view (FOV)</td>
      </tr>
    </table>
    <p style="margin-top:20px;text-align:center;">Click anywhere to close</p>
  `;
  overlay.appendChild(content);
  parent.appendChild(overlay);

  helpBtn.addEventListener("click", () => {
    overlay.style.display = "flex";
  });

  overlay.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  return overlay;
}
