# Notification System Design & Priority Logic

## Overview
The Notification System is designed to efficiently triage, filter, and display high-value telemetry and system events. This document outlines the core logic that powers the **Priority Inbox**.

## Priority Logic Implementation

The system processes incoming events and surfaces the most critical notifications using a multi-tier sorting algorithm. The logic evaluates each notification using an explicitly defined weighting hierarchy.

### 1. Primary Sorting Weights (Descending)
The priority algorithm compares two notifications (A and B) using the following sequential criteria:

1. **Placement Weight:** This is the highest priority metric. A higher placement integer will immediately take precedence over a lower one, regardless of other fields.
2. **Result Weight:** If Placement values are identical, the algorithm evaluates the Result metric. A higher Result score outranks a lower one.
3. **Event Weight:** If both Placement and Result are tied, the Event metric acts as the final tiebreaker in the primary weight category.

### 2. Secondary Sorting (Recency)
* **Timestamp Field:** If two notifications share the exact same weights across Placement, Result, and Event, the system defaults to chronological sorting. 
* The `Timestamp` is evaluated to ensure the most recent notification appears higher in the queue.

### Example Scenario
- **Notification A:** Placement: 5, Result: 10, Event: 2
- **Notification B:** Placement: 4, Result: 99, Event: 100

*Result:* **Notification A** ranks higher because its Placement value (5) is greater than B's (4), even though B has higher values for Result and Event.

## UI Implementation
The application uses **Material UI** to present this data across two main views:
- **Priority Inbox:** Surfaces the Top N (10, 15, or 20) notifications based solely on the logic outlined above.
- **All Notifications:** Displays the complete, unfiltered chronological feed for auditing purposes.

## Telemetry Integration
The frontend strictly logs all user interactions (e.g., tab switching, filtering, API states) through the dedicated `logging-middleware`. Local console logging is explicitly prohibited to ensure all telemetry flows through the standardized pipeline.
