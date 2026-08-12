
## 1. Executive Summary

LC Monitor is a secure, cloud-based internal Employee Time & Attendance Tracking System for AIIDA.

The system supports:

* Authentication
* Attendance logging
* Break tracking
* Reporting
* Role-based access
* Shift scheduling
* Leave requests
* Basic HR workflows
* IP-based WFH/Site classification
* Audit logging
* Basic analytics

---

## 2. User Roles

### 2.1 Employee

* Login
* Dashboard
* Clock In / Clock Out
* Break Start / Break End
* Personal attendance history
* CSV export
* Employee Notes
* View assigned shift
* Submit leave requests
* View attendance policies

### 2.2 Manager

* All employee capabilities
* Team attendance view
* Filters:

  * Date range
  * Employee
  * Department
* CSV export
* Manager Comments
* Department-level reporting
* Approve/reject leave requests

### 2.3 Administrator

* Full system access
* Employee management
* Department management
* System configuration
* Attendance logs
* Audit logs
* Reporting
* Policy management
* Shift scheduling
* Leave management
* Basic analytics
* Trusted office IP configuration

---

## 3. Authentication & Security

* Email + password authentication
* JWT session management
* Optional MFA
* Role-Based Access Control (RBAC)
* HTTPS enforcement
* Input validation
* Rate limiting
* Secure password hashing
* Audit logging
* Secure session handling

---

# 4. Functional Modules

## 4.1 Employee Dashboard

* Current attendance status
* Clock In
* Clock Out
* Break Start
* Break End
* Daily summary
* Weekly overview
* Attendance history
* CSV export
* Employee Notes
* Assigned shift
* Leave request submission
* Attendance policy viewing
* Display:

  * `Logged in from: WFH`
  * `Logged in from: Site`

---

## 4.2 Manager Dashboard

* Team attendance overview
* Employee status indicators
* Date-range filtering
* Employee filtering
* Department filtering
* CSV export
* Manager Comments
* Department-level reporting
* IP address visibility
* WFH/Site classification
* Leave request management

---

## 4.3 Admin Dashboard

* Employee management
* Department management
* System configuration
* Attendance logs
* Audit logs
* Reporting
* Shift Scheduling
* Leave Requests
* Basic Analytics
* Policy Display/Management
* Trusted office IP range management

---

# 5. Attendance Logic

## 5.1 Core Attendance Flow

### Clock In

* Create attendance record
* Record timestamp
* Capture IP address
* Determine WFH/Site classification
* Check assigned shift
* Calculate late flag

### Break Start

* Create break segment
* Record timestamp
* Capture IP address
* Record WFH/Site classification

### Break End

* Close break segment
* Calculate break duration
* Record timestamp
* Capture IP address
* Record WFH/Site classification

### Clock Out

* Close attendance record
* Record timestamp
* Capture IP address
* Calculate total break duration
* Calculate total working hours
* Determine early flag

### Total Hours

`Total Hours = (Clock Out − Clock In) − Total Break Duration`

Additional detection:

* Missing clock-out
* Late arrival
* Early departure
* Active break
* Unclosed attendance record

---

# 6. IP Address & WFH/Site Classification

For every login and time-related action:

* Login
* Clock In
* Clock Out
* Break Start
* Break End

The system must:

1. Capture IP address
2. Store IP address
3. Determine login/action location type
4. Display the classification where appropriate

### Classification

Admin defines trusted office IP ranges.

* IP matches trusted range → **Site**
* IP does not match → **WFH**

### Display

**Employee Dashboard**

> Logged in from: Site/WFH

**Manager Dashboard**

* Employee
* IP address
* Classification
* Action timestamp

**Reports**

* IP address
* WFH/Site classification

**Audit Logs**

* IP address
* Classification
* Action

---

# 7. Shift Scheduling

Administrators can:

* Create shifts
* Assign shifts to employees
* Modify shifts
* View assigned shifts

Employees can:

* View assigned shift
* See scheduled start/end times

Attendance logic uses the assigned shift to calculate:

* Late arrival
* Early departure

---

# 8. Leave Requests

### Employee

* Submit leave request
* Select date
* Enter reason
* View request status

### Manager

* View team leave requests
* Approve request
* Reject request
* Add relevant comments if required

### Statuses

* Pending
* Approved
* Rejected

---

# 9. Notifications

Email notifications for:

* Missed clock-out
* Leave approval
* Leave rejection
* Daily attendance summary

---

# 10. Department-Level Reporting

Managers and administrators can generate reports based on department.

Reports can include:

* Employee
* Date
* Clock-in time
* Clock-out time
* Total hours
* Break duration
* Late status
* Early status
* IP address
* WFH/Site classification
* Notes/comments

Reports should support CSV export.

---

# 11. Basic Analytics

Dashboard analytics should include:

* Total hours worked
* Average working hours
* Average break duration
* Late arrivals count
* Early departures count
* Attendance count
* WFH vs Site attendance
* Leave statistics

---

# 12. Employee Notes

Employees can optionally add notes to attendance entries.

Example:

> "Worked from client location."

Notes should be associated with the relevant attendance record.

---

# 13. Manager Comments

Managers can add comments/annotations to attendance records.

Comments should include:

* Manager
* Comment
* Timestamp
* Related attendance record

---

# 14. Policy Display

Administrators can:

* Create attendance policies
* Upload/manage policy content
* Update policies

Employees can:

* View current policies
* Access policies from their dashboard

---

# 15. Dark Mode

* Light/Dark mode toggle
* User preference stored in the system
* Preference persists across sessions

---

# 16. Database Schema

### Users

* id
* name
* email
* password_hash
* role
* department_id
* status
* created_at
* updated_at

### Departments

* id
* name
* created_at

### Attendance

* id
* user_id
* clock_in_time
* clock_out_time
* total_hours
* late_flag
* early_flag
* ip_address
* login_type
* employee_note
* manager_comment
* created_at
* updated_at

### Breaks

* id
* attendance_id
* break_start
* break_end
* break_duration

### Shifts

* id
* user_id
* shift_start
* shift_end

### Leave Requests

* id
* user_id
* date
* reason
* status

### Policies

* id
* title
* content
* created_at

### Audit Logs

* id
* admin_user_id
* action
* metadata
* timestamp

---

# 17. UI/UX Requirements

* Clean modern corporate interface
* Responsive design
* Mobile-friendly
* LC Monitor logo on login page
* LC Monitor logo in application header
* Clear role-based dashboards
* Simple attendance controls
* Status indicators
* Tables with filtering/sorting
* CSV export controls
* Dark mode
* Consistent navigation and layout

---

## 18. Core System Workflow

**Login → Authentication → Role-Based Dashboard**

### Employee

**Dashboard → Clock In → Breaks → Clock Out → Attendance Record → History/Reports**

### Manager

**Dashboard → Team Attendance → Filters → Review Records → Comments → Reports → Leave Approval**

### Administrator

**Admin Dashboard → Users/Departments/Shifts/Policies → Attendance & Audit Logs → Reports → Analytics → System Configuration**
