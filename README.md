# Report Organizer

## The Problem

When dealing with multiple documents (such as DOCX or PDF files) that need to be merged to form a comprehensive report, a common challenge is organizing these documents chronologically. Opening each file individually just to check its date, determine its contents, and figure out its correct order is a tedious and time-consuming process that disrupts workflow.

## The Solution

Report Organizer is a tool designed to solve this exact problem. It provides an intuitive interface to preview, sort, and organize your documents without the need to open them in external applications. By displaying the contents and metadata directly in the tool, you can quickly identify each document, organize them by date, and seamlessly prepare your files for merging into a final report.

## Features

- Document Preview: Instantly view the contents of PDF and DOCX files within the application.
- Date Organization: Automatically or manually sort your files chronologically to build a structured report.
- Drag and Drop Interface: Easily reorder documents to fit your specific needs.
- Offline Capability: Process and manage your files locally without requiring an internet connection.
- Desktop Application: Built with Electron for a native, fast, and responsive desktop experience.

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

To build and package the Electron executable for your specific platform (Windows, macOS, or Linux):
```bash
npm run electron:build
```

## License

This project is open-source and available under the MIT License.
