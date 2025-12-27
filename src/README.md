# Source Code Documentation

This directory contains the source code for the Math Explorer application.

## Directory Structure

### `src/`
- **`main.jsx`**: The entry point of the React application. Mounts the `App` component.
- **`App.jsx`**: The main application component. Handles global state, layout, and routing (if any).
- **`index.css`**: Global styles and Tailwind CSS imports.
- **`constants.js`**: Application constants, including localization (I18N) strings and default configurations.
- **`icons.js`**: Icon definitions, mapping logical names to Remix Icon classes or custom SVG paths (including pixel mode support).

### `src/assets/`
- **`fonts/`**: Custom fonts used in the application.
- **`svgs/`**: SVG assets, primarily used for pixel mode icons.

### `src/components/`
- **`Canvas.jsx`**: The main interactive canvas where nodes and links are rendered. Handles zooming, panning, and node interactions.
- **`MathNode.jsx`**: Renders individual nodes on the canvas, including their headers, bodies, and interactive math segments.
- **`Common.jsx`**: Reusable components like `InteractiveMath` (KaTeX wrapper) and `RichViewer` (Markdown/LaTeX renderer).
- **`ControlPanel.jsx`**: The bottom-left panel for controlling global settings like gravity, theme, and language.
- **`UIOverlay.jsx`**: Manages UI overlays that sit on top of the canvas.

#### `src/components/Panels/`
- **`Explorer.jsx`**: The left sidebar panel showing the list of active nodes on the canvas. Supports search and drag-and-drop reordering.
- **`LibraryPanel.jsx`**: The right sidebar panel for managing the node library (templates). Supports folders, tags, and drag-and-drop instantiation.
- **`SettingsPanel.jsx`**: A comprehensive settings panel (often integrated into ControlPanel or separate modal).
- **`Minimap.jsx`**: A small map showing the overall view of the canvas and current viewport.

#### `src/components/UI/`
- **`ContextMenu.jsx`**: A custom context menu component used for right-click actions on the canvas and nodes.
- **`Icon.jsx`**: A wrapper component for rendering icons (either font-based or SVG-based).
- **`ColorPalette.jsx`**: A color picker component.

#### `src/components/Modals/`
- **`ConfirmModal.jsx`**: A generic modal for confirming actions (e.g., delete).
- **`InputModal.jsx`**: A generic modal for text input (e.g., rename).
- **`NodeTemplateEditor.jsx`**: A complex modal for editing node templates in the library.

### `src/hooks/`
- **`useCanvasInteraction.js`**: Handles canvas events like panning, zooming, and background clicks.
- **`useGraphState.js`**: Manages the core graph data structure (nodes and links).
- **`useGraphActions.js`**: Encapsulates actions that modify the graph (add, delete, connect).
- **`useHistory.js`**: Implements undo/redo functionality.
- **`useMenuPosition.js`**: Helper hook for positioning context menus and tooltips within the viewport.
- **`usePanelResize.js`**: Helper hook for resizable side panels.
- **`useSimulation.js`**: Manages the D3 force simulation for node layout.

### `src/styles/`
- **`base.css`**: Basic resets and typography.
- **`components.css`**: Styles for UI components (buttons, inputs, etc.).
- **`layout.css`**: Layout-specific styles for panels and containers.
- **`nodes.css`**: Styles specific to node rendering and math cards.
- **`overrides.css`**: Overrides for third-party libraries (e.g., KaTeX).
- **`pixel-mode.css`**: Specific styles applied when "Pixel Mode" is enabled.

### `src/theme/`
- **`index.js`**: Theme definitions (colors, fonts) and utility functions for theming.

### `src/utils/`
- **`graphUtils.js`**: Utility functions for graph operations (e.g., finding paths, calculating layout).
