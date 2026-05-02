# Campus Notification Platform - Full Stack Submission

## Candidate Information
- **Name:** Mukesh P 
- **Registration Number:** RA2311003020688
- **Email:** mp3955@srmist.edu.in
- 

---

## Project Overview
This repository contains a production-grade implementation of a Campus Notification Platform. The system is designed to handle high-priority telemetry alerts with a robust sorting algorithm and a modern, responsive frontend.

### Project Structure
- **/logging_middleware**: A reusable TypeScript package for cross-stack logging. It handles automatic authentication and structured logging to the evaluation service.
- **/notification_app_fe**: The main React (Vite) application.
  - **Modern UI**: Dark-mode Material UI dashboard with indigo/cyan aesthetics.
  - **Auto-Auth**: Seamlessly integrates with the logging middleware to handle bearer tokens.
  - **Priority Logic**: Custom algorithm for triaging notifications.
- **/notification_app_be**: Backend service components for notification processing.

---

## Technical Features

### 1. Priority Sorting Algorithm
Notifications are triaged based on a multi-tier weighted system:
1. **Primary Weight:** `Placement` (Descending)
2. **Secondary Weight:** `Result` (Descending)
3. **Tertiary Weight:** `Event` (Descending)
4. **Tie-Breaker:** `Timestamp` (Recency - Descending)

### 2. Telemetry Integration
- Zero `console.log` usage.
- Every system event (API start, state change, error, navigation) is logged via the `logging_middleware`.
- Supports full stack traceability (Stack: `frontend`).

### 3. Modern UI/UX
- **Dark Mode**: Premium glassmorphism-inspired design.
- **Micro-animations**: Fade transitions and interactive hover states.
- **Search & Filter**: Real-time multi-dimensional filtering.

---

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository.
2. Navigate to the frontend directory:
   ```bash
   cd notification_app_fe
   npm install
   ```

### Running Locally
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. Authenticate using your Evaluation Service credentials to access the live telemetry data.

-
