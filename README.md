# 🌳 Fractal Forest Drawing App
Fractal Forest Drawing App is an interactive, web-based drawing tool that lets you create beautiful, complex scenes using fractal algorithms and other generative techniques. From recursive trees and Barnsley ferns to Koch snowflakes and Perlin noise vines, you can design your own digital ecosystem right in your browser.

-----
## Tutorials Link
- https://iluvdata.org/drawgem/tutorials/
-----
## Live Demo Link
- https://jsale.github.io/fractal_drawing_v2/
 ![alt text](https://www.iluvdata.org/drawgem/images/Screenshot1sm.png)

-----
## ✨ Features

  * **Multiple Drawing Modes**: Create with Tree, Fern, Path, Snowflake, Flower, Vine, Clouds, and an Eraser tool.
  * **Deep Customization**: Fine-tune dozens of parameters for shape, size, angle, randomness, and more.
  * **Advanced Color Control**: Use a dynamic color palette, apply beautiful presets, and edit the color and transparency of individual tree branch levels.
  * **Full History System**: Enjoy unlimited Undo/Redo and a visual playback feature to re-watch your creative process.
  * **💾 Session Management**: Save your entire drawing session, including all objects and the complete history, to a `.json` file. Load it back any time to continue your work.
  * **🎨 Multiple Export Options**: Save your finished artwork as a high-quality **PNG**, a layered PNG (background/foreground), or a scalable **SVG** vector file for professional use.
  * **Dynamic Animation**: Add a gentle, customizable wind animation to bring your trees to life.
  * **Responsive Design**: Controls are hidden on smaller screens, accessible with button to open/close panels.


-----

## 🚀 How to Use
1.  **Select a Mode**: Choose a drawing tool from the **Shape** tab's "Mode" dropdown.
2.  **Adjust Parameters**: Use the sliders in the **Shape** tab to control how your object will look.
3.  **Draw on the Canvas**: Click once to stamp an object, or click and drag to draw continuously.
4.  **Customize Colors**: Switch to the **Color** tab to change the global color palette or apply one of the many built-in themes from the **Presets** tab.
5.  **Save Your Work**:
      * Use the buttons in the **History** tab to **Export Session** if you want to save your progress to work on later.
      * Use the buttons in the **Shape** tab to **Save PNG** or **Export SVG** when your masterpiece is complete.

-----

## Precautions
1.  **Export Session Crashing**: It is easy to generate huge files if you draw many trees with a high branch level, and often these files are simply too large for the browser to handle and simply crashes. We don't have a fix for that yet, but we're working on it.
2.  **Order of Object Creation Impacts Session Size**: Each time an object is drawn, a snapshot of the scene is saved to the History list for playback or export. If you draw many trees with many branches first, then these will be saved with every object drawn after it. Therefore, try to draw simpler objects in the scene first, such as the sun/moon, clouds, mountains, ferns, and paths. The other objects can consume considerable memory.

-----

## 🛠️ Controls Overview

### Shape Tab

This is your main control center for selecting a drawing tool and adjusting its properties. Each mode has a unique set of parameters.

  * **Tree**: Control recursion levels, length, angle, width, and randomness.
  * **Fern**: Set the number of points and overall size for the classic Barnsley fern.
  * **Path/Eraser**: Control the stroke width.
  * **Other Modes**: Each generative shape like Snowflake, Flower, and Vine has its own iterative and aesthetic controls.

### Color Tab

Manage all color-related properties here.

  * **Branch/Palette Colors**: The color pickers dynamically update based on the number of "Branch levels" set in the Shape tab. These colors are used for Trees and as a palette for other modes.
  * **Object Alpha**: Set a global transparency for newly drawn objects.
  * **Editing Levels**: In **Tree** mode, click on any branch on the canvas to select its "level." You can then edit the color and alpha for that specific level on all trees, or just the selected one.
  * **Background Color**: Set the background color for the entire scene.

### Presets Tab

Quickly apply a professionally designed color palette to your scene. Selecting a preset will instantly update the colors in your **Color** tab.

### History Tab

Track your creative process and manage your session data.

  * **Undo/Redo**: Step backward or forward through your actions.
  * **Playback**: Watch a replay of your entire drawing process from the beginning.
  * **Export Session**: Saves the entire state of your application—including the full undo/redo history—into a single `.json` file.
  * **Load Session**: Load a previously exported `.json` file to restore your session exactly where you left off.

-----

## ⌨️ Keyboard Shortcuts

  * **Undo**: `Ctrl/Cmd + Z`
  * **Redo**: `Ctrl/Cmd + Y`

-----

## 💻 Technology Stack

  * **HTML5 Canvas** for 2D rendering.
  * **Vanilla JavaScript (ES6+)** for all application logic.
  * **CSS** for styling and layout.
  * **ChatGPT and Gemini** for incredibly valuable help, but of course I taught them everything they know about fractal drawing apps. :-)
