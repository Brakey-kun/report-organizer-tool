# Report Organizer

## The Problem

When dealing with multiple documents (such as DOCX or PDF files) that need to be merged to form a comprehensive report, a common challenge is organizing these documents chronologically. Opening each file individually just to check its date, determine its contents, and figure out its correct order is a tedious and time-consuming process that disrupts workflow. Furthermore, assembling the final report often requires inserting blank pages for printing, deleting redundant pages, and adding new documents on the fly. 

## The Solution

Report Organizer is a tool designed to solve this exact problem. It provides an intuitive 3-step interface to preview, sort, organize, and edit your documents without the need to open them in external applications. 

## Features

- **3-Step Guided Workflow**: A clean progress bar guides you through Organizing, Reviewing, and Exporting your report.
- **Document Preview**: Instantly view the contents of PDF and DOCX files.
- **Date Organization**: Automatically or manually sort your files chronologically.
- **Global Viewer (Review Step)**: 
  - Preview the fully merged report in a virtualized, scrollable canvas.
  - Insert blank pages dynamically for double-sided printing fixes.
  - Insert new PDF/DOCX files directly in-between existing pages.
  - Mark individual pages for deletion with a clear visual overlay.
- **Export Options**: Export the final merged PDF (with options to strip hyperlinks/annotations) or export a ZIP archive of the original files.
- **Offline Capability**: Process and manage your files locally without requiring an internet connection.
- **Desktop Application**: Built with Electron for a native, fast, and responsive desktop experience.

## Technology Stack

- Frontend: React, Vite, Tailwind CSS
- Desktop Framework: Electron
- Document Processing: PDF.js, pdf-lib, Mammoth
- Interactions: dnd-kit

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd report-organizer-webtool
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the Vite development server for the web interface:
```bash
npm run dev
```

To start the Electron application in development mode:
```bash
npm run electron:dev
```

### Build and Package

To build the web application for production:
```bash
npm run build
```

To build and package the Electron executable for your specific platform:

**Windows**:
```bash
npm run electron:build
```
This generates an installer (`.exe`) in the `release/` directory.

**macOS**:
```bash
npm run electron:build
```
This generates a Disk Image (`.dmg`) in the `release/` directory.

**Linux**:
```bash
npm run electron:build
```
This generates an AppImage (`.AppImage`) in the `release/` directory.

### Automated Releases via GitHub Actions

This repository includes a GitHub Actions workflow that automates the building and releasing of the app for all major platforms (Windows, macOS, Linux). 

To trigger a new release:
1. Push your code changes to GitHub.
2. Create and push a new Git tag starting with `v` (for example, `v1.0.0` or `v1.1.0`):
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. Navigate to the **Actions** tab in your GitHub repository to monitor the build. Once complete, a new Release will be drafted automatically with the Windows `.exe`, macOS `.dmg`, and Linux `.AppImage` files attached.

## License

This project is open-source and available under the MIT License.
