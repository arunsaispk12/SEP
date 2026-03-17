# SEP Core Functions & Workflow (Updated)

SEP is a specialized platform designed to plan, manage, and monitor schedules and progress updates in real-time for Service Engineers and other key stakeholders.

## ✅ Implemented Core Features

### 1. User Roles & Authentication
*   **Roles Supported:** Admin, Manager, Service Engineer, Executive, Client (Hospital). [Status: Implemented]
*   **Approval Workflow:** Signups for Engineers and Executives require manual approval by an Admin or Manager before access is granted. [Status: Implemented]
*   **Profile Management:** Each user has a tailored profile page.
    *   **Engineer Profile:** Includes mandatory "Laser Details" (Laser Type, Serial Number, Tracker status). [Status: Implemented]

### 2. Case Management System
*   **Integrated Calendar:** Day, Weekly, and Monthly views for tracking assignments.
*   **Case Lifecycle:**
    *   Advanced Statuses: Assigned, Travelling, Reached Centre, In Progress, Waiting for Installation, Installation Done, Uninstallation Done, Completed. [Status: Implemented]
    *   **Case Completion Form:** Automatically triggers when a case is marked "Completed" to capture clinical data:
        *   Embryologist Name, Date, Notes.
        *   Dynamic Patient Details (Name, Age, Test type, Embryo count). [Status: Implemented]
*   **Permission Control:** Only the Admin or the assigned Service Engineer can update case statuses. Managers and Executives have view-only access. [Status: Implemented]

### 3. Workflow Intelligence & Constraints
*   **Location Constraint:** Prevents an engineer from being assigned to multiple cities on the same calendar day. [Status: Implemented]
*   **Conflict Warnings:**
    *   ⚠️ Warning for overlapping case schedules.
    *   ⚠️ Warning for assigning cases during an engineer's approved leave period. [Status: Implemented]
*   **Leave Management:** System for engineers to apply for leave and managers to approve/reject.

### 4. Specialized Data Modules
*   **Client Management:** Dedicated module for managing IVF Hospitals and Fertility Centres as entities.
    *   **Privacy:** "Disclose" option for Executives to manage client visibility. [Status: Implemented]
*   **Location Management:** Centralized control for service regions (Bangalore, Hyderabad, Chennai, Coimbatore, Mumbai, etc.). [Status: Implemented]

---

## 🛠️ Roadmap & Pending Features

### High Priority
1.  **Data Persistence:** Finalize Supabase mapping for the new Client and Patient data models.
2.  **Data Export:** Implement PDF/CSV generation for Case and Patient reports.
3.  **Transit Automation:** Trigger "Travelling" status automatically when an engineer is dispatched to a new location.

### Future Scaling
1.  **Client Dashboard:** Direct access for Hospitals to raise service requests.
2.  **Image Repository:** Full implementation of equipment image uploads for Laser Details.
