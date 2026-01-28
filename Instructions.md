# Project Setup Instructions

This document outlines the steps to set up, install, and run the Vantage Logic application on a new system.

## 1. System Prerequisites

Before starting, ensure your system meets the following requirements:

* **Node.js**: Version **v18.0.0** or higher is required.
    * *Check version:* `node -v`
    * *Recommended:* v20 LTS or v22 LTS.
* **npm**: Installed automatically with Node.js.

## 2. Installation Guide

Follow these steps to get the application running locally:

1.  **Clone or Copy** the project files to your local machine.
2.  **Open a Terminal** and navigate to the project root directory:
    ```bash
    cd path/to/vantage-project
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
    * Open your browser and navigate to the URL shown (usually `http://localhost:5173`).

## 3. Tech Stack & Dependencies

This project relies on the following core technologies:

### Core Framework
* **React (v19)**: The frontend library for building the user interface.
* **Vite**: The build tool and development server for fast HMR (Hot Module Replacement).

### UI & Styling
* **Tailwind CSS (v4)**: Utility-first CSS framework for styling.
* **Lucide React**: Icon set used throughout the application.
* **Framer Motion**: Library for handling smooth animations (e.g., transitions, modals).
* **CLSX & Tailwind Merge**: Utilities for dynamic class name management.

### Data & Visualization
* **Recharts**: Composable charting library for React (used for the Analytics Dashboard).
* **SheetJS (xlsx)**: Parser for reading and writing Excel files directly in the browser.

## 4. Available Scripts

The following commands are defined in `package.json`:

* `npm run dev`: Starts the local development server.
* `npm run build`: Compiles the app for production (outputs to `dist/` folder).
* `npm run lint`: Runs ESLint to identify code quality issues.
* `npm run preview`: Preview the production build locally.

## 5. Troubleshooting

* **"command not found: vite"**: Ensure you have run `npm install` first.
* **Node Version Warning**: If you see warnings about unsupported engines, upgrade Node.js to the LTS version.