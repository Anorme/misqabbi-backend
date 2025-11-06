import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Renders an HTML view template by reading the file and replacing placeholders
 * @param {string} viewName - Name of the view file (without .html extension)
 * @param {Object} data - Data object to replace placeholders in template
 * @returns {string} Rendered HTML string
 * @throws {Error} If view file doesn't exist or if unreplaced placeholders are found
 */
export function renderView(viewName, data = {}) {
  const viewPath = path.join(__dirname, "..", "views", `${viewName}.html`);

  if (!fs.existsSync(viewPath)) {
    throw new Error(`View template not found: ${viewName}.html`);
  }

  let html = fs.readFileSync(viewPath, "utf-8");

  // Replace placeholders in the format {{KEY}} with values from data object
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = data[key];
    html = html.replace(new RegExp(placeholder, "g"), value);
  });

  // Validate that all placeholders were replaced
  const remainingPlaceholders = html.match(/\{\{[A-Z_]+\}\}/g);
  if (remainingPlaceholders) {
    throw new Error(
      `Unreplaced placeholders found in template: ${remainingPlaceholders.join(", ")}`
    );
  }

  return html;
}
