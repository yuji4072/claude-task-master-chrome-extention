# TaskTab for GitHub

TaskTab is a Chrome extension that displays repository-specific tasks from a `.task.json` file directly on the GitHub repository page.

## Features

- **In-Page Tasks:** Adds a "Tasks" tab to the GitHub repository navigation.
- **Dynamic Loading:** Fetches tasks from a `.task.json` file in the root of the repository's main branch.
- **Filtering & Sorting:** Easily filter tasks by status or priority, and sort them by ID or priority.
- **Configurable:** Set cache duration from the extension's popup settings.
- **Performant:** Uses virtual scrolling to handle large task lists smoothly.

## Installation

1.  Download the latest release from the [Releases](https://github.com/your-username/your-repo/releases) page.
2.  Unzip the downloaded file.
3.  Open Chrome and navigate to `chrome://extensions`.
4.  Enable "Developer mode" in the top right corner.
5.  Click "Load unpacked" and select the unzipped `dist` directory.

## Usage

1.  Navigate to a GitHub repository.
2.  If the repository contains a `.task.json` file in its main branch, a "Tasks" tab will appear in the navigation bar.
3.  Click the "Tasks" tab to view the task list.
4.  Use the filter and sort controls at the top of the list to manage your view.

## `.task.json` format

The extension expects a `.task.json` file with a specific format. Here is an example:

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Setup project structure",
      "description": "Initialize the project with a proper folder structure.",
      "priority": "high",
      "status": "done",
      "dependencies": []
    },
    {
      "id": 2,
      "title": "Implement core feature",
      "description": "Build the main feature of the application.",
      "priority": "medium",
      "status": "pending",
      "dependencies": [1]
    }
  ]
} 