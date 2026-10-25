# Solar EPC Project Baseline Scheduling & Gantt Chart Web Application

A complete, high-performance web application designed for solar EPC planning engineers, project controls managers, and scheduling specialists. Built with React, TypeScript, Tailwind CSS, Vite, and ExcelJS.

## 🌟 Key Features

- **Pre-Execution Baseline Scheduling**: Formulate realistic pre-execution baseline schedules dynamically based on user-entered capacity, location, technology, and scope.
- **Dynamic Work Breakdown Structure (WBS)**:
  - 1.0 Project Development & Approvals
  - 2.0 Land & Site Preparation
  - 3.0 Engineering & Design
  - 4.0 Procurement
  - 5.0 Civil Construction
  - 6.0 Electrical Installation
  - 7.0 Testing & Commissioning
  - 8.0 Project Handover
- **Interactive Gantt Chart**:
  - Aligned row-by-row with the WBS table.
  - Direct display of WBS names and activity IDs/names beside corresponding bars.
  - Interactive drag-to-shift and edge-resize for durations.
  - Real SVG dependency connectors (elbow arrows) connecting predecessor finish to successor start.
  - Milestone diamonds for key project milestones (COD, Grid Sync).
  - Critical Path Method (CPM) calculation (Early Start, Early Finish, Late Start, Late Finish, Total Float).
  - Baseline comparison ghost bars.
- **Cascading Location Selector**:
  - Supports all 28 Indian States and 8 Union Territories with verified districts dataset.
  - Global support (USA, UAE, Saudi Arabia, Australia, Germany).
- **Properties Sidebar**:
  - Contextual inspector for selected WBS or Activity with General, Predecessors, Resources, and Notes tabs.
  - Sub-activities manager.
- **High-Quality 7-Sheet Excel Export (.xlsx)**:
  1. `Project Dashboard` (Executive Summary, Project Specs & KPIs)
  2. `WBS` (Work Breakdown Hierarchy)
  3. `Activity Register` (Float, Critical Path, Predecessors)
  4. `Gantt Chart` (Cell-based visual timeline with matching phase colors)
  5. `Dependencies & CPM` (ES, EF, LS, LF, Float)
  6. `Baseline Comparison` (Start, Finish, Duration Variances)
  7. `Assumptions & Validation` (Planning rules, Feasibility checks)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Build Tool**: Vite
- **Calculations**: Custom CPM Forward/Backward Pass Scheduling Engine with Work Calendar Logic
- **Excel Generation**: ExcelJS & FileSaver

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

## 📄 License
MIT License
