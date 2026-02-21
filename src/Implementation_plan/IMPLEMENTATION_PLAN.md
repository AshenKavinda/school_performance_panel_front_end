# School Performance Panel — Frontend Implementation Plan

> **AI CODING AGENT INSTRUCTIONS**
> This document is the single source of truth for frontend implementation. It contains:
> - All API endpoint definitions with exact request/response field names, types, required flags, and validation constraints (sourced directly from the OpenAPI/Swagger spec)
> - Role-based page and dashboard specifications
> - Phase-by-phase task checklists
> - Service layer function signatures
> - Component architecture
>
> **Do NOT cross-reference the swagger file** — all schema information needed is embedded in the Schema Reference section below.
> **Auth:** All protected endpoints require `Authorization: Bearer <token>` header. Token is stored in memory/localStorage after login.
> **Base URL:** Configurable via `VITE_API_BASE_URL` env variable, default `http://localhost:5000`.

---

## Global Enum Reference

| Enum Name | Values |
|---|---|
| `applicationType` | `SUBJECT_BASE`, `MODULE_BASE`, `BOTH` |
| `classType` | `SUBJECT_BASE`, `MODULE_BASE` |
| `termTest` | `FIRST_TERM`, `SECOND_TERM`, `FINAL_TERM` |
| `dayOfWeek` | `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY` |
| `timeSlotName` | `SEVEN`, `EIGHT` |
| `role` | `ADMIN`, `APPLICATION_ADMIN`, `OPERATOR`, `TEACHER`, `STUDENT`, `MANAGER`, `GUEST` |

---

## Role Identification

From the `UserDto` schema, there are **7 roles**:

| Role | Dashboard Route | Description |
|---|---|---|
| `ADMIN` | `/admin/dashboard` | Platform-level super admin |
| `APPLICATION_ADMIN` | `/app-admin/dashboard` | School organization owner (subscribes to platform) |
| `MANAGER` | `/manager/dashboard` | Operational manager under ApplicationAdmin |
| `OPERATOR` | `/operator/dashboard` | School data operator under ApplicationAdmin |
| `TEACHER` | `/teacher/dashboard` | Subject teacher |
| `STUDENT` | `/student/dashboard` | Enrolled student |
| `GUEST` | `/` | Public / unauthenticated visitor |

---

## Dashboards & Pages Per Role

---

### 1. ADMIN — Platform Super Admin Dashboard

> Manages the entire platform: school accounts, packages, payments.

| Page | Functionality |
|---|---|
| **Overview** | Stats: total schools, active subscriptions, total revenue |
| **Application Admins** | List all, view details, enable/disable (`PATCH /enable`, `/disable`) |
| **Admin Accounts** | CRUD admins (`/api/admins`) |
| **Package Management** | CRUD subscription packages (`/api/packages`) |
| **Payments & Subscriptions** | View all payments, subscription statuses per school (`/api/payments`) |
| **User Management** | View/manage all system users (`/api/users`) |

---

### 2. APPLICATION_ADMIN — School Admin Dashboard

> Owner of a school. Configures grading, manages managers & operators, tracks subscription.

| Page | Functionality |
|---|---|
| **Overview** | School summary: operators, managers, subscription status |
| **Subscription** | View active plan, expiry, days remaining (`/api/payments/my-subscription`, `/check-my-subscription`) |
| **Manager Management** | CRUD managers (`/api/managers`) |
| **Operator Management** | CRUD operators (`/api/operators`) |
| **GPA Grading Config** | CRUD GPA grade bands (grade, minMark, maxMark, gradePoint) (`/api/gpa-gradings`) |
| **Subject Grading Config** | CRUD subject grade labels (grade, minMark, maxMark) (`/api/subject-gradings`) |
| **Profile** | View/update own ApplicationAdmin profile (NIC, applicationType: `SUBJECT_BASE` / `MODULE_BASE` / `BOTH`) |

---

### 3. MANAGER — Manager Dashboard

> Read-oriented. Oversees school operations without direct data entry.

| Page | Functionality |
|---|---|
| **Overview** | Summary of students, teachers, classes, operators |
| **Operators View** | View operators under their ApplicationAdmin |
| **Teachers View** | Browse all teachers, their assignments |
| **Students View** | Browse all students, enrollments |
| **Classes & Sections View** | Browse clusters, sections, classes |
| **Profile** | View own Manager profile |

---

### 4. OPERATOR — Operator Dashboard

> The most feature-heavy role. Manages all school academic data.

| Page | Functionality |
|---|---|
| **Overview** | Quick stats: clusters, sections, classes, teachers, students |
| **Cluster Management** | CRUD clusters (`/api/clusters`) |
| **Section Management** | CRUD sections per cluster (`/api/sections`) |
| **Class Management** | CRUD classes per section (type: `SUBJECT_BASE` / `MODULE_BASE`) (`/api/classes`) |
| **Subject Management** | CRUD subjects (name, creditValue) (`/api/subjects`) |
| **Module Management** | CRUD modules (name, subjectId, sectionId, weight) — for `MODULE_BASE` (`/api/modules`) |
| **Teacher Management** | Create teachers with credentials, update, delete (`/api/teachers`) |
| **Student Management** | Add students via globalStudentCode, update/delete (`/api/students`) |
| **Class Enrollments** | Bulk enroll students to classes, add/remove individual students |
| **Subject Enrollments** | Enroll common subjects to class, enroll elective subjects to specific students |
| **Teacher Assignments** | Assign teachers to subjects, sections, or subject-section combos (bulk) |
| **Time Slot Management** | CRUD time slots (`/api/TimeSlots`) |
| **Timetable Management** | Create/edit/bulk-create timetable entries, conflict checker, view by class/day/week (`/api/timetables`) |
| **Profile** | View own Operator profile |

---

### 5. TEACHER — Teacher Dashboard

> Enters marks and views personal schedule and assignments.

| Page | Functionality |
|---|---|
| **Overview** | My assigned subjects, sections, upcoming classes |
| **My Timetable** | Weekly schedule view (Mon–Fri by time slot) (`/api/timetables/teacher/{teacherId}/week`) |
| **My Assignments** | View all assigned subjects + sections (`/api/enrollments/teacher/{teacherId}/assignments`) |
| **Class Students** | View students enrolled per class (`/api/enrollments/class/{classId}/students`) |
| **Mark Entry** | Select a class → system reads `classType` and renders the appropriate entry mode only: **`SUBJECT_BASE`** → Subject Exam Marks (class → subject → term → bulk marks per student); **`MODULE_BASE`** → Module Exam Marks (class → subject → module → bulk marks per student). The other mode is never shown for a given class. |
| **Profile** | View/update own Teacher profile |

---

### 6. STUDENT — Student Dashboard

> Views personal academic data: enrollments, marks, timetable.

| Page | Functionality |
|---|---|
| **Overview** | My classes, enrolled subjects, recent marks summary |
| **My Profile** | Global student info (name, DOB, phone) + school-specific (indexNumber, address) |
| **My Enrollments** | Classes enrolled, subjects per class (common + elective), modules if applicable |
| **My Marks** | Marks view is driven by the enrolled class's `classType`: **`SUBJECT_BASE`** class → shows subject exam marks table per term (`FIRST_TERM` / `SECOND_TERM` / `FINAL_TERM`) with letter grade; **`MODULE_BASE`** class → shows module exam marks table per subject/module with grade. Each class only ever shows the mark type that matches its type — no mixing. |
| **My Timetable** | Weekly class schedule (`/api/timetables/student/{studentId}/class/{classId}/week`) |

---

### 7. GUEST — Guest View

| Page | Functionality |
|---|---|
| **Landing / Home** | Public informational view, login/register prompts |
| **Register** | Student self-registration (`/api/auth/register/student`), ApplicationAdmin registration (`/api/auth/register/application-admin`) |

---

## Complete Schema Reference

> All field types: `string`, `uuid` (string formatted), `int`, `float`, `double`, `bool`, `datetime` (ISO 8601), `timespan` (HH:MM:SS). Fields marked **required** will cause a 400 if missing. Optional fields may be omitted or sent as `null`.

---

### Auth Schemas

#### `POST /api/auth/login` — Request: `LoginDto`
| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | yes | |
| `password` | string | yes | |

#### `POST /api/auth/login` — Response: `LoginResponseDto`
| Field | Type | Notes |
|---|---|---|
| `token` | string | JWT access token — add as `Authorization: Bearer <token>` |
| `refreshToken` | string | Store for silent renewal |
| `user.id` | uuid | |
| `user.username` | string | |
| `user.email` | string | |
| `user.role` | string (enum `role`) | Use to redirect to correct dashboard |

#### `POST /api/auth/refresh-token` — Request: `RefreshTokenDto`
| Field | Type | Required |
|---|---|---|
| `refreshToken` | string | yes |

Response shape same as `LoginResponseDto`.

#### `POST /api/auth/register/student` — Request: `RegisterStudentDto`
| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | string | yes | |
| `email` | string | yes | |
| `password` | string | yes | |
| `firstName` | string | yes | |
| `lastName` | string | yes | |
| `phone` | string | no | |
| `dateOfBirth` | datetime | yes | ISO 8601 |

#### `POST /api/auth/register/application-admin` — Request: `RegisterApplicationAdminDto`
| Field | Type | Required |
|---|---|---|
| `username` | string | yes |
| `email` | string | yes |
| `password` | string | yes |
| `schoolName` | string | no |

#### `POST /api/auth/verify-email` — Request: `VerifyEmailDto`
| Field | Type | Required |
|---|---|---|
| `email` | string | yes |
| `otp` | string | yes |

#### `POST /api/auth/forgot-password` — Request: `ForgotPasswordDto`
| Field | Type | Required |
|---|---|---|
| `email` | string | yes |

#### `POST /api/auth/reset-password` — Request: `ResetPasswordDto`
| Field | Type | Required |
|---|---|---|
| `email` | string | yes |
| `otp` | string | yes |
| `newPassword` | string | yes |

---

### User Schemas

#### `UserDto` (response from `/api/users/{id}`)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `username` | string | |
| `email` | string | |
| `phoneNumber` | string\|null | |
| `role` | enum `role` | |
| `isActive` | bool | |
| `isVerified` | bool | |
| `createdAt` | datetime | |
| `updatedAt` | datetime\|null | |
| `isDeleted` | bool | |

#### `PUT /api/users/{id}` — Request: `UpdateUserDto`
| Field | Type | Required |
|---|---|---|
| `username` | string | no |
| `email` | string | no |
| `role` | enum `role` | no |
| `phoneNumber` | string | no |

---

### Admin Schemas

#### `AdminDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `userId` | uuid | |
| `nic` | string\|null | |
| `employeeNumber` | string\|null | |
| `username` | string\|null | |
| `email` | string\|null | |
| `phoneNumber` | string\|null | |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |
| `updatedBy` | uuid\|null | |
| `updatedByUsername` | string\|null | |
| `createdAt` | datetime | |
| `updatedAt` | datetime\|null | |
| `isDeleted` | bool | |
| `deletedAt` | datetime\|null | |

#### `POST /api/admins` — Request: `CreateAdminWithCredentialsDto`
| Field | Type | Required |
|---|---|---|
| `username` | string | yes |
| `email` | string | yes |
| `password` | string | yes |
| `nic` | string | no |
| `employeeNumber` | string | no |

#### `PUT /api/admins/{id}` — Request: `UpdateAdminDto`
| Field | Type | Required |
|---|---|---|
| `nic` | string | no |
| `employeeNumber` | string | no |

---

### ApplicationAdmin Schemas

#### `ApplicationAdminDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `userId` | uuid | |
| `nic` | string\|null | |
| `applicationType` | enum `applicationType` | `SUBJECT_BASE` \| `MODULE_BASE` \| `BOTH` |
| `username` | string\|null | |
| `email` | string\|null | |
| `isActive` | bool | Controlled by ADMIN via enable/disable |
| `createdAt` | datetime | |
| `updatedAt` | datetime\|null | |
| `isDeleted` | bool | |
| `deletedAt` | datetime\|null | |

#### `PUT /api/application-admins/{id}` — Request: `UpdateApplicationAdminDto`
| Field | Type | Required |
|---|---|---|
| `nic` | string | no |
| `applicationType` | enum `applicationType` | no |

Enable: `PATCH /api/application-admins/{id}/enable` (no body)
Disable: `PATCH /api/application-admins/{id}/disable` (no body)

---

### Manager Schemas

#### `ManagerDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `userId` | uuid | |
| `nic` | string\|null | |
| `username` | string\|null | |
| `email` | string\|null | |
| `phoneNumber` | string\|null | |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |
| `createdAt` | datetime | |
| `updatedAt` | datetime\|null | |
| `isDeleted` | bool | |
| `deletedAt` | datetime\|null | |

#### `POST /api/managers` — Request: `CreateManagerWithCredentialsDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `username` | string | **yes** | minLength: 1 |
| `email` | string | **yes** | minLength: 1, format: email |
| `password` | string | **yes** | minLength: 1 |
| `nic` | string | no | |
| `phoneNumber` | string | no | |

#### `PUT /api/managers/{id}` — Request: `UpdateManagerDto`
| Field | Type | Required |
|---|---|---|
| `nic` | string | no |

Extra endpoints:
- `GET /api/managers/by-user/{userId}` — resolve manager from logged-in user's userId
- `GET /api/managers/by-application-admin/{applicationAdminId}` — list managers under an ApplicationAdmin

---

### Operator Schemas

#### `OperatorDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `userId` | uuid | |
| `nic` | string\|null | |
| `username` | string\|null | |
| `email` | string\|null | |
| `phoneNumber` | string\|null | |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |
| `createdAt` | datetime | |
| `updatedAt` | datetime\|null | |
| `isDeleted` | bool | |

#### `POST /api/operators` — Request: `CreateOperatorWithCredentialsDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `username` | string | **yes** | minLength: 1 |
| `email` | string | **yes** | minLength: 1, format: email |
| `password` | string | **yes** | minLength: 1 |
| `nic` | string | no | |
| `phoneNumber` | string | no | |

#### `PUT /api/operators/{id}` — Request: `UpdateOperatorDto`
| Field | Type | Required |
|---|---|---|
| `nic` | string | no |

Extra endpoints:
- `GET /api/operators/by-user/{userId}`
- `GET /api/operators/by-application-admin/{applicationAdminId}`

---

### Teacher Schemas

#### `TeacherDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `userId` | uuid | |
| `nic` | string\|null | |
| `teacherId` | string\|null | Employee/staff ID string |
| `username` | string\|null | |
| `email` | string\|null | |
| `phoneNumber` | string\|null | |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |
| `createdAt` | datetime | |
| `updatedAt` | datetime\|null | |
| `isDeleted` | bool | |

#### `POST /api/teachers` — Request: `CreateTeacherWithCredentialsDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `username` | string | **yes** | minLength: 1 |
| `email` | string | **yes** | minLength: 1, format: email |
| `password` | string | **yes** | minLength: 1 |
| `nic` | string | no | |
| `teacherId` | string | no | |
| `phoneNumber` | string | no | |

#### `PUT /api/teachers/{id}` — Request: `UpdateTeacherDto`
| Field | Type | Required |
|---|---|---|
| `nic` | string | no |
| `teacherId` | string | no |

Extra endpoints:
- `GET /api/teachers/by-user/{userId}`
- `GET /api/teachers/by-operator/{operatorId}`

---

### StudentGlobal & Student Schemas

> **Architecture note:** A student has two records:
> - `StudentGlobal` — global identity created at self-registration (name, email, DOB). One per person across all schools.
> - `Student` — school-specific record created by Operator linking to a StudentGlobal via `globalStudentCode`. Has `indexNumber` and `address` per school.

#### `StudentGlobalDto` (response from `/api/student-globals/*`)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `userId` | uuid | |
| `globalStudentCode` | string | Unique cross-school code |
| `firstName` | string\|null | |
| `lastName` | string\|null | |
| `email` | string\|null | |
| `phone` | string\|null | |
| `dateOfBirth` | datetime | |
| `username` | string\|null | |
| `createdAt` | datetime | |
| `updatedAt` | datetime\|null | |
| `isDeleted` | bool | |

#### `PUT /api/student-globals/{id}` — Request: `UpdateStudentGlobalDto`
| Field | Type | Required |
|---|---|---|
| `firstName` | string | no |
| `lastName` | string | no |
| `phone` | string | no |
| `dateOfBirth` | datetime | no |

Extra endpoints:
- `GET /api/student-globals/by-user/{userId}` — used on Student login to get their global profile
- `GET /api/student-globals/by-code/{globalStudentCode}` — public lookup endpoint (GUEST use)
- `GET /api/student-globals/by-email/{email}`

#### `StudentDto` (response from `/api/students/*`)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | School-scoped student ID |
| `studentGlobalId` | uuid | FK to StudentGlobal |
| `globalStudentCode` | string\|null | Denormalized |
| `indexNumber` | string\|null | School-assigned index |
| `address` | string\|null | |
| `firstName` | string\|null | Denormalized from global |
| `lastName` | string\|null | Denormalized from global |
| `email` | string\|null | Denormalized from global |
| `phone` | string\|null | Denormalized from global |
| `dateOfBirth` | datetime\|null | Denormalized from global |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |
| `createdAt` | datetime | |
| `isDeleted` | bool | |

#### `POST /api/students` — Request: `CreateStudentDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `globalStudentCode` | string | **yes** | minLength: 1 — must match an existing StudentGlobal |
| `indexNumber` | string | no | |
| `address` | string | no | |

#### `PUT /api/students/{id}` — Request: `UpdateStudentDto`
| Field | Type | Required |
|---|---|---|
| `indexNumber` | string | no |
| `address` | string | no |

Extra endpoints:
- `GET /api/students/by-student-global/{studentGlobalId}`
- `GET /api/students/by-operator/{operatorId}`

---

### Cluster, Section, Class Schemas

#### `ClusterDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | string\|null | |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |

#### `POST /api/clusters` — Request: `CreateClusterDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | **yes** | minLength: 1 |

#### `PUT /api/clusters/{id}` — Request: `UpdateClusterDto`
| Field | Type | Required |
|---|---|---|
| `name` | string | no |

Extra: `GET /api/clusters/by-operator/{operatorId}`

#### `SectionDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | string\|null | |
| `clusterId` | uuid | |
| `clusterName` | string\|null | |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |

#### `POST /api/sections` — Request: `CreateSectionDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | **yes** | minLength: 1 |
| `clusterId` | uuid | **yes** | |

#### `PUT /api/sections/{id}` — Request: `UpdateSectionDto`
| Field | Type | Required |
|---|---|---|
| `name` | string | no |
| `clusterId` | uuid | no |

Extra: `GET /api/sections/by-cluster/{clusterId}`, `GET /api/sections/by-operator/{operatorId}`

#### `ClassDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | string\|null | |
| `sectionId` | uuid | |
| `sectionName` | string\|null | |
| `clusterId` | uuid\|null | |
| `clusterName` | string\|null | |
| `academicYear` | string\|null | e.g. `"2025"` |
| `classType` | enum `classType` | `SUBJECT_BASE` or `MODULE_BASE` — **drives all mark entry logic** |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |
| `createdAt` | datetime | |
| `isDeleted` | bool | |

#### `POST /api/classes` — Request: `CreateClassDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | **yes** | minLength: 1 |
| `sectionId` | uuid | **yes** | |
| `academicYear` | string | **yes** | minLength: 1 |
| `classType` | enum `classType` | **yes** | `SUBJECT_BASE` or `MODULE_BASE` |

#### `PUT /api/classes/{id}` — Request: `UpdateClassDto`
| Field | Type | Required |
|---|---|---|
| `name` | string | no |
| `sectionId` | uuid | no |
| `academicYear` | string | no |
| `classType` | enum `classType` | no |

Extra: `GET /api/classes/by-section/{sectionId}`, `GET /api/classes/by-operator/{operatorId}`, `GET /api/classes/by-academic-year/{academicYear}`

---

### Subject & Module Schemas

#### `SubjectDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | string\|null | |
| `creditValue` | int | 1–10 |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |

#### `POST /api/subjects` — Request: `CreateSubjectDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | **yes** | minLength: 1 |
| `creditValue` | int | **yes** | min: 1, max: 10 |

#### `PUT /api/subjects/{id}` — Request: `UpdateSubjectDto`
| Field | Type | Required |
|---|---|---|
| `name` | string | no |
| `creditValue` | int | no |

Extra: `GET /api/subjects/by-operator/{operatorId}`

#### `ModuleDto` (response) — Only relevant for `MODULE_BASE` classes
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | string\|null | |
| `subjectId` | uuid | Parent subject |
| `sectionId` | uuid | Scoped to a section |
| `moduleWeight` | int | 1–100. Weights across modules for a subject should sum to 100 |
| `subjectName` | string\|null | |
| `sectionName` | string\|null | |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |

#### `POST /api/modules` — Request: `CreateModuleDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | **yes** | minLength: 1 |
| `subjectId` | uuid | **yes** | |
| `sectionId` | uuid | **yes** | |
| `moduleWeight` | int | **yes** | min: 1, max: 100 |

#### `PUT /api/modules/{id}` — Request: `UpdateModuleDto`
| Field | Type | Required |
|---|---|---|
| `name` | string | no |
| `subjectId` | uuid | no |
| `sectionId` | uuid | no |
| `moduleWeight` | int | no |

Extra: `GET /api/modules/by-operator/{operatorId}`, `GET /api/modules/by-section/{sectionId}/subject/{subjectId}`

---

### Grading Schemas

#### `GPAGradingDto` (response) — Used for `MODULE_BASE` grade calculation
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `grade` | string | e.g. `"A"`, `"B+"` |
| `minMark` | float | Lower bound (inclusive) |
| `maxMark` | float | Upper bound (inclusive) |
| `gradePoint` | float | GPA value for this grade band (e.g. `4.0`) |
| `createdBy` | uuid\|null | ApplicationAdmin who created it |
| `createdByUsername` | string\|null | |
| `createdAt` | datetime | |

#### `POST /api/gpa-gradings` — Request: `CreateGPAGradingDto`
| Field | Type | Required |
|---|---|---|
| `grade` | string | yes |
| `minMark` | float | yes |
| `maxMark` | float | yes |
| `gradePoint` | float | yes |

#### `PUT /api/gpa-gradings/{id}` — Request: `UpdateGPAGradingDto`
Same fields as Create, all optional.

Extra: `GET /api/gpa-gradings/my-gradings` (returns gradings created by authenticated ApplicationAdmin)

#### `SubjectGradingDto` (response) — Used for `SUBJECT_BASE` grade display
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `grade` | string | e.g. `"A"`, `"B"` |
| `minMark` | float | |
| `maxMark` | float | |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |
| `createdAt` | datetime | |

#### `POST /api/subject-gradings` — Request: `CreateSubjectGradingDto`
| Field | Type | Required |
|---|---|---|
| `grade` | string | yes |
| `minMark` | float | yes |
| `maxMark` | float | yes |

Extra: `GET /api/subject-gradings/my-gradings`

---

### Enrollment Schemas

#### Bulk Enroll Students to Class
`POST /api/enrollments/class/bulk` — Request: `BulkEnrollClassDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `classId` | uuid | **yes** | |
| `studentIds` | uuid[] | **yes** | minItems: 1 |

Response: `EnrollmentResultDto` → `{ successCount, failureCount, totalAttempted, successMessages[], errorMessages[], hasErrors }`

#### Single Student Enroll/Remove
- `POST /api/enrollments/class/{classId}/student/{studentId}` — enroll one student
- `DELETE /api/enrollments/class/{classId}/student/{studentId}` — remove one student

#### Get Students in Class
`GET /api/enrollments/class/{classId}/students` — Response: `ClassStudentsResponseDto`
```
{ classId, className, sectionName, academicYear, classType,
  students: [{ studentId, studentName, indexNumber }] }
```

#### Enroll Common Subjects to Class
`POST /api/enrollments/subjects/class-common` — Request: `EnrollClassCommonSubjectsDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `classId` | uuid | **yes** | |
| `subjectIds` | uuid[] | **yes** | minItems: 1 |

Response: `EnrollmentResultDto`

#### Enroll Elective Subject to Specific Students
`POST /api/enrollments/subjects/elective` — Request: `EnrollElectiveSubjectDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `classId` | uuid | **yes** | |
| `subjectId` | uuid | **yes** | |
| `studentIds` | uuid[] | **yes** | minItems: 1 |

#### Remove Student from Subject
`DELETE /api/enrollments/subject/{subjectId}/section/{sectionId}/student/{studentId}`

#### Get Student's Full Enrollment
`GET /api/enrollments/student/{studentId}` — Response: `StudentEnrollmentDetailsDto`
```
{ studentId, studentName, indexNumber,
  enrolledClasses: [{ classId, className, sectionName, sectionId,
    academicYear, classType, enrolledSubjects: [{ subjectId, subjectName, creditValue, enrolledAt }] }] }
```

#### Get Student's Curriculum in a Class
`GET /api/enrollments/class/{classId}/student/{studentId}/curriculum` — Response: `StudentClassCurriculumResponseDto`
```
{ studentId, studentName, indexNumber, classId, className, sectionId,
  sectionName, academicYear, classType,
  enrolledSubjects: [{ subjectId, subjectName, creditValue, enrolledAt }],
  subjectsWithModules: [{ subjectId, subjectName, creditValue,
    modules: [{ moduleId, moduleName, moduleWeight }] }] }
```

#### Assign Teacher to Subject
- `POST /api/enrollments/teacher-subject` — Body: `{ teacherId, subjectId }`
- `POST /api/enrollments/teacher-subject/bulk` — Body: `{ teacherId, subjectIds: uuid[] }`
- `DELETE /api/enrollments/teacher-subject/{teacherId}/{subjectId}`

#### Assign Teacher to Section
- `POST /api/enrollments/teacher-section` — Body: `{ teacherId, sectionId }`
- `POST /api/enrollments/teacher-section/bulk` — Body: `{ teacherId, sectionIds: uuid[] }`
- `DELETE /api/enrollments/teacher-section/{teacherId}/{sectionId}`

#### Assign Teachers to Subject + Sections (combined)
`POST /api/enrollments/assign-teachers-to-subject-sections`
Body: `AssignTeachersToSubjectSectionsDto`
| Field | Type | Notes |
|---|---|---|
| `subjectId` | uuid | |
| `sectionIds` | uuid[] | |
| `teacherIds` | uuid[] | |

#### Get Teacher's Assignments
`GET /api/enrollments/teacher/{teacherId}/assignments` — Response: `TeacherAssignmentsDto`
```
{ teacherId, teacherName, teacherUsername, teacherIdNumber,
  assignedSubjects: [{ subjectId, subjectName, creditValue, assignedAt }],
  assignedSections: [{ sectionId, sectionName, assignedAt }] }
```

#### Get Eligible Teachers
`GET /api/enrollments/eligible-teachers?subjectId=&sectionId=` — Returns `EligibleTeachersDto`
`GET /api/enrollments/teacher/{teacherId}/eligible` — Returns bool

---

### Subject Exam Mark Schemas (SUBJECT_BASE classes only)

#### `SubjectExamMarkDto` (response)
| Field | Type | Notes |
|---|---|---|
| `studentId` | uuid | |
| `classId` | uuid | |
| `subjectId` | uuid | |
| `termTest` | enum `termTest` | `FIRST_TERM` \| `SECOND_TERM` \| `FINAL_TERM` |
| `mark` | int | 0–100 |
| `studentName` | string\|null | |
| `indexNumber` | string\|null | |
| `className` | string\|null | |
| `subjectName` | string\|null | |

#### `POST /api/subject-exam-marks/bulk` — Request: `CreateSubjectExamMarkBulkDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `subjectId` | uuid | **yes** | |
| `classId` | uuid | **yes** | |
| `termTest` | enum `termTest` | **yes** | |
| `marks` | StudentMarkDto[] | **yes** | minItems: 1 |

`StudentMarkDto` items:
| Field | Type | Required | Validation |
|---|---|---|---|
| `studentId` | uuid | **yes** | |
| `mark` | int | **yes** | min: 0, max: 100 |

Response: `BulkMarkResponseDto` → `{ success, message, totalProcessed, created, updated, failed, errors[] }`

#### `PUT /api/subject-exam-marks/mark/{studentId}/{classId}/{subjectId}/{termTest}` — Request: `UpdateSubjectExamMarkDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `mark` | int | **yes** | min: 0, max: 100 |

Other endpoints:
- `GET /api/subject-exam-marks/by-student/{studentId}`
- `GET /api/subject-exam-marks/by-class/{classId}`
- `GET /api/subject-exam-marks/by-class/{classId}/by-subject/{subjectId}/by-term/{termTest}`
- `DELETE /api/subject-exam-marks/mark/{studentId}/{classId}/{subjectId}/{termTest}`

---

### Module Exam Mark Schemas (MODULE_BASE classes only)

#### `ModuleExamMarkDto` (response)
| Field | Type | Notes |
|---|---|---|
| `studentId` | uuid | |
| `moduleId` | uuid | |
| `mark` | int | 0–100 |
| `studentName` | string\|null | |
| `indexNumber` | string\|null | |
| `moduleName` | string\|null | |
| `subjectName` | string\|null | |

#### `POST /api/module-exam-marks/bulk` — Request: `CreateModuleExamMarkBulkDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `subjectId` | uuid | **yes** | |
| `classId` | uuid | **yes** | |
| `moduleId` | uuid | **yes** | |
| `marks` | StudentMarkDto[] | **yes** | minItems: 1 |

`StudentMarkDto` items: `{ studentId: uuid (required), mark: int (required, 0–100) }`

#### `PUT /api/module-exam-marks/mark/{studentId}/{moduleId}` — Request: `UpdateModuleExamMarkDto`
| Field | Type | Required | Validation |
|---|---|---|---|
| `mark` | int | **yes** | min: 0, max: 100 |

Other endpoints:
- `GET /api/module-exam-marks/by-student/{studentId}`
- `GET /api/module-exam-marks/by-module/{moduleId}`
- `DELETE /api/module-exam-marks/mark/{studentId}/{moduleId}`

---

### TimeSlot Schemas

#### `TimeSlotDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | enum (`SEVEN` \| `EIGHT`) | Period identifier |
| `startTime` | timespan | Format: `HH:MM:SS` |
| `endTime` | timespan | Format: `HH:MM:SS` |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |
| `createdAt` | datetime | |
| `isDeleted` | bool | |

#### `POST /api/TimeSlots` — Request: `CreateTimeSlotDto`
| Field | Type | Required |
|---|---|---|
| `name` | enum (`SEVEN` \| `EIGHT`) | yes |
| `startTime` | timespan | yes |
| `endTime` | timespan | yes |

#### `PUT /api/TimeSlots/{id}` — Request: `UpdateTimeSlotDto`
All fields optional: `name`, `startTime`, `endTime`.

Extra: `GET /api/TimeSlots/by-admin/{createdBy}`

---

### Timetable Schemas

#### `TimetableDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `classId` | uuid | |
| `className` | string\|null | |
| `sectionName` | string\|null | |
| `academicYear` | string\|null | |
| `subjectId` | uuid | |
| `subjectName` | string\|null | |
| `subjectCreditValue` | int | |
| `teacherId` | uuid | |
| `teacherName` | string\|null | |
| `teacherUsername` | string\|null | |
| `teacherIdNumber` | string\|null | |
| `timeSlotId` | uuid | |
| `startTime` | timespan | |
| `endTime` | timespan | |
| `timeSlotName` | string\|null | `SEVEN` or `EIGHT` |
| `dayOfWeek` | enum `dayOfWeek` | |
| `dayOfWeekDisplay` | string\|null | Human-readable day |

#### `POST /api/timetables` — Request: `CreateTimetableDto`
| Field | Type | Required |
|---|---|---|
| `classId` | uuid | yes |
| `subjectId` | uuid | yes |
| `teacherId` | uuid | yes |
| `timeSlotId` | uuid | yes |
| `dayOfWeek` | enum `dayOfWeek` | yes |

#### `PUT /api/timetables/{id}` — Request: `UpdateTimetableDto`
All fields optional: `classId`, `subjectId`, `teacherId`, `timeSlotId`, `dayOfWeek`.

#### `POST /api/timetables/bulk` — Request: `BulkCreateTimetableDto`
`{ timetables: CreateTimetableDto[] }`
Response: `BulkCreateResultDto` → `{ totalAttempted, successCount, failureCount, successfulEntries[], errors[] }`

#### `POST /api/timetables/check-conflicts` — Response: `ConflictCheckDto`
`{ hasConflict, conflictType, message, conflictingEntry: TimetableDto }`

#### Weekly Schedule Endpoints
- `GET /api/timetables/class/{classId}/week` → `ClassWeeklyScheduleDto`
  ```
  { classId, className, sectionName, academicYear,
    weekSchedule: { MONDAY: [...], TUESDAY: [...], WEDNESDAY: [...], THURSDAY: [...], FRIDAY: [...] } }
  ```
  Each entry: `{ timetableId, subjectName, teacherName, startTime, endTime, timeSlotName }`
- `GET /api/timetables/teacher/{teacherId}/week` → Array of `TeacherDailyScheduleDto`
  Each: `{ teacherId, teacherName, day, dayDisplay, classes: [{ timetableId, className, subjectName, startTime, endTime, timeSlotName }] }`
- `GET /api/timetables/student/{studentId}/class/{classId}/week` → Same as class week schedule but student-scoped
- `GET /api/timetables/teacher/{teacherId}/available` — availability check
- `GET /api/timetables/class/{classId}/available` — availability check

---

### Package & Payment Schemas

#### `PackageDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `labal` | string\|null | Package display name (note: API field is spelled `labal`) |
| `discription` | string\|null | Description (note: API field is spelled `discription`) |
| `periodInMonths` | int | Subscription duration |
| `price` | double | |
| `createdBy` | uuid\|null | |
| `createdByUsername` | string\|null | |
| `createdAt` | datetime | |
| `isDeleted` | bool | |

#### `POST /api/packages` — Request: `CreatePackageDto`
| Field | Type | Required |
|---|---|---|
| `labal` | string | yes |
| `discription` | string | yes |
| `periodInMonths` | int | yes |
| `price` | double | yes |

> ⚠️ Use field names `labal` and `discription` exactly as spelled — these are the API field names.

#### `PUT /api/packages/{id}` — Request: `UpdatePackageDto`
Optional: `labal`, `discription`, `periodInMonths`, `price`.

#### `PaymentDto` (response)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `applicationAdminId` | uuid | |
| `packageId` | uuid | |
| `amount` | double | At time of payment |
| `paymentDate` | datetime | |
| `expiryDate` | datetime | |
| `isActive` | bool | |
| `daysRemaining` | int | |
| `applicationAdminUsername` | string\|null | |
| `applicationAdminEmail` | string\|null | |
| `packageLabal` | string\|null | |
| `packageDiscription` | string\|null | |
| `packagePeriodInMonths` | int | |
| `packagePrice` | double | |
| `transactionId` | string\|null | |
| `paymentMethod` | string\|null | |
| `paymentStatus` | string\|null | |
| `receiptUrl` | string\|null | |
| `paidAt` | datetime\|null | |
| `currency` | string\|null | |
| `customerEmail` | string\|null | |
| `refundId` | string\|null | |
| `refundedAt` | datetime\|null | |
| `refundAmount` | double\|null | |

#### `POST /api/payments` — Request: `CreatePaymentDto`
| Field | Type | Required |
|---|---|---|
| `applicationAdminId` | uuid | yes |
| `packageId` | uuid | yes |

#### `SubscriptionStatusDto` (response from `/api/payments/my-subscription`)
| Field | Type | Notes |
|---|---|---|
| `hasActiveSubscription` | bool | |
| `expiryDate` | datetime\|null | |
| `daysRemaining` | int\|null | |
| `packagePeriod` | string\|null | |
| `message` | string\|null | |
| `activePayment` | PaymentDto\|null | Full payment details |

Other endpoints:
- `GET /api/payments/application-admin/{applicationAdminId}` — all payments for a school
- `GET /api/payments/subscription-status/{applicationAdminId}` → `SubscriptionStatusDto`
- `GET /api/payments/has-active-subscription/{applicationAdminId}` → bool
- `GET /api/payments/check-my-subscription` — for authenticated ApplicationAdmin

---

## Implementation Plan — Phase by Phase

---

### Phase 1 — Foundation & Authentication

**Goal:** Get auth working end-to-end with role-based routing.

- [ ] Setup Vite + React project, configure `react-router-dom` v6
- [ ] Create `axios` instance with base URL, JWT Bearer interceptor, and auto refresh-token logic (`/api/auth/refresh-token`)
- [ ] `authService.js` — login, logout, register (student & application admin), forgot-password, reset-password, verify-email
- [ ] `AuthContext` — store `user` (id, username, email, role), token, loading state
- [ ] `ProtectedRoute` — role-based route guards
- [ ] Pages: `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `VerifyEmail`
- [ ] Role-based redirect after login (route to respective dashboard by role)

**API Endpoints Used:**
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
- `POST /api/auth/register/student`
- `POST /api/auth/register/application-admin`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

---

### Phase 2 — Shared Layout & UI System

**Goal:** Build the shell that all dashboards sit inside.

- [ ] Role-aware `AppLayout` — sidebar + topbar + content area
- [ ] Sidebar with nav links filtered per role
- [ ] Common components: `DataTable`, `Modal`, `ConfirmDialog`, `FormInput`, `Badge`, `StatusTag`, `LoadingSpinner`, `Pagination`, `Notifications/Toast`
- [ ] API service files: `managementService.js`, `enrollmentService.js`, `marksService.js`, `timetableService.js`, `gradingService.js`, `paymentService.js`
- [ ] Error boundary + 404 / Unauthorized pages

---

### Phase 3 — ADMIN Dashboard

**Target Role:** `ADMIN`

- [ ] Overview stats cards (total app admins, packages, payments, revenue)
- [ ] Application Admins list page — enable/disable toggle, view detail
- [ ] Platform Admin Accounts CRUD page
- [ ] Package Management CRUD (label, description, period, price)
- [ ] Payments list — filterable by school, status, date range
- [ ] User Management — list all users, update role/status

**API Endpoints Used:**
- `GET/POST /api/admins`
- `GET/PUT/DELETE /api/admins/{id}`
- `GET /api/application-admins`
- `GET /api/application-admins/{id}`
- `PUT /api/application-admins/{id}`
- `PATCH /api/application-admins/{id}/enable`
- `PATCH /api/application-admins/{id}/disable`
- `GET/POST /api/packages`
- `GET/PUT/DELETE /api/packages/{id}`
- `GET/POST /api/payments`
- `GET /api/payments/{id}`
- `GET /api/users`
- `GET/PUT/DELETE /api/users/{id}`

---

### Phase 4 — APPLICATION_ADMIN Dashboard

**Target Role:** `APPLICATION_ADMIN`

- [ ] Overview page with subscription status widget (days remaining, expiry)
- [ ] Subscription page — active payment details, package info
- [ ] Manager Management — CRUD (username, email, password, NIC, phone)
- [ ] Operator Management — CRUD (username, email, password, NIC, phone)
- [ ] GPA Grading Config — CRUD grade bands (A, B, C... → minMark, maxMark, gradePoint)
- [ ] Subject Grading Config — CRUD subject grade labels (grade → minMark, maxMark)
- [ ] Profile page — view/edit NIC, applicationType

**API Endpoints Used:**
- `GET /api/payments/my-subscription`
- `GET /api/payments/check-my-subscription`
- `GET/POST /api/managers`
- `GET/PUT/DELETE /api/managers/{id}`
- `GET/POST /api/operators`
- `GET/PUT/DELETE /api/operators/{id}`
- `GET/POST /api/gpa-gradings`
- `GET/PUT/DELETE /api/gpa-gradings/{id}`
- `GET /api/gpa-gradings/my-gradings`
- `GET/POST /api/subject-gradings`
- `GET/PUT/DELETE /api/subject-gradings/{id}`
- `GET /api/subject-gradings/my-gradings`
- `GET /api/application-admins/by-user/{userId}`
- `PUT /api/application-admins/{id}`

---

### Phase 5 — OPERATOR Dashboard

**Target Role:** `OPERATOR`

- [ ] Cluster list + CRUD modal
- [ ] Section list per cluster + CRUD
- [ ] Class list per section + CRUD (name, academicYear, classType: `SUBJECT_BASE` | `MODULE_BASE`)
  - `SUBJECT_BASE`: uses Subject Exam Marks for assessments; no module structure
  - `MODULE_BASE`: uses Module Exam Marks for assessments; requires modules to be defined per subject
- [ ] Subject list + CRUD (name, creditValue 1–10)
- [ ] Module list + CRUD (name, subject, section, weight 1–100) — required for `MODULE_BASE` classes only
- [ ] Teacher Management — create with credentials, update NIC/teacherId, CRUD
- [ ] Student Management — add by globalStudentCode + indexNumber, CRUD
- [ ] **Enrollment Hub:**
  - Bulk enroll students to class
  - Enroll class to common subjects (multi-select)
  - Enroll elective subjects to specific students
  - Assign teacher to subject / section / subject-sections (bulk)
  - Remove enrollments
- [ ] **Time Slot Management** — CRUD (SEVEN / EIGHT period names, start/end times)
- [ ] **Timetable Builder:**
  - Create entries (class + subject + teacher + timeslot + day)
  - Bulk create
  - Conflict checker
  - Weekly view per class
  - Edit / delete entries
- [ ] Profile page

**API Endpoints Used:**
- `GET/POST /api/clusters`, `GET/PUT/DELETE /api/clusters/{id}`
- `GET/POST /api/sections`, `GET/PUT/DELETE /api/sections/{id}`
- `GET/POST /api/classes`, `GET/PUT/DELETE /api/classes/{id}`
- `GET/POST /api/subjects`, `GET/PUT/DELETE /api/subjects/{id}`
- `GET/POST /api/modules`, `GET/PUT/DELETE /api/modules/{id}`
- `GET/POST /api/teachers`, `GET/PUT/DELETE /api/teachers/{id}`
- `GET/POST /api/students`, `GET/PUT/DELETE /api/students/{id}`
- `POST /api/enrollments/class/bulk`
- `POST/DELETE /api/enrollments/class/{classId}/student/{studentId}`
- `GET /api/enrollments/class/{classId}/students`
- `POST /api/enrollments/subjects/class-common`
- `POST /api/enrollments/subjects/elective`
- `POST /api/enrollments/teacher-subject`
- `POST /api/enrollments/teacher-subject/bulk`
- `POST /api/enrollments/teacher-section`
- `POST /api/enrollments/teacher-section/bulk`
- `POST /api/enrollments/assign-teachers-to-subject-sections`
- `GET/POST /api/TimeSlots`, `GET/PUT/DELETE /api/TimeSlots/{id}`
- `GET/POST /api/timetables`, `GET/PUT/DELETE /api/timetables/{id}`
- `POST /api/timetables/bulk`
- `POST /api/timetables/check-conflicts`
- `GET /api/timetables/class/{classId}/week`

---

### Phase 6 — TEACHER Dashboard

**Target Role:** `TEACHER`

- [ ] Overview — assigned subjects, sections, today's classes
- [ ] Weekly timetable view (grid: Mon–Fri × time slots)
- [ ] My Assignments page — subject list + section list
- [ ] Class Students view — select class, see enrolled students
- [ ] **Mark Entry (Class-Type Aware)** — teacher selects a class; the UI reads the class's `classType` and conditionally renders:
  - `SUBJECT_BASE` class → **Subject Marks Entry only**: select subject → select term (`FIRST_TERM` / `SECOND_TERM` / `FINAL_TERM`) → enter marks per student (0–100) → bulk submit
  - `MODULE_BASE` class → **Module Marks Entry only**: select subject → select module → enter marks per student (0–100) → bulk submit
  - The non-applicable entry mode is completely hidden; a teacher never sees both options for the same class
- [ ] Update/delete individual marks (entry mode remains consistent with the class's type)
- [ ] Profile page

**API Endpoints Used:**
- `GET /api/timetables/teacher/{teacherId}/week`
- `GET /api/timetables/teacher/{teacherId}/day/{day}`
- `GET /api/enrollments/teacher/{teacherId}/assignments`
- `GET /api/enrollments/teacher/{teacherId}/subjects`
- `GET /api/enrollments/teacher/{teacherId}/sections`
- `GET /api/enrollments/class/{classId}/students`
- `POST /api/subject-exam-marks/bulk`
- `GET /api/subject-exam-marks/by-student/{studentId}`
- `PUT /api/subject-exam-marks/mark/{studentId}/{classId}/{subjectId}/{termTest}`
- `DELETE /api/subject-exam-marks/mark/{studentId}/{classId}/{subjectId}/{termTest}`
- `POST /api/module-exam-marks/bulk`
- `PUT /api/module-exam-marks/mark/{studentId}/{moduleId}`
- `DELETE /api/module-exam-marks/mark/{studentId}/{moduleId}`
- `GET /api/teachers/by-user/{userId}`

---

### Phase 7 — STUDENT Dashboard

**Target Role:** `STUDENT`

- [ ] Overview — enrolled classes, subject count, latest marks
- [ ] Profile page — global info (name, DOB, phone) + school info (indexNumber, address)
- [ ] Enrollments page — class cards → subject list (common + elective) → modules per subject
- [ ] **Marks page (Class-Type Aware):** — for each enrolled class, the UI checks `classType` and displays only the relevant marks view:
  - `SUBJECT_BASE` class → Subject marks table: subject × term (`FIRST_TERM` / `SECOND_TERM` / `FINAL_TERM`) with letter grade derived from subject grading config
  - `MODULE_BASE` class → Module marks table: subject → module → mark with grade derived from GPA grading config
  - Module marks are never shown under a `SUBJECT_BASE` class and subject term marks are never shown under a `MODULE_BASE` class
- [ ] Weekly timetable view per enrolled class

**API Endpoints Used:**
- `GET /api/student-globals/by-user/{userId}`
- `PUT /api/student-globals/{id}`
- `GET /api/enrollments/student/{studentId}`
- `GET /api/enrollments/student/{studentId}/subjects`
- `GET /api/enrollments/class/{classId}/student/{studentId}/curriculum`
- `GET /api/subject-exam-marks/by-student/{studentId}`
- `GET /api/module-exam-marks/by-student/{studentId}`
- `GET /api/timetables/student/{studentId}/class/{classId}/week`
- `GET /api/subject-gradings/my-gradings`
- `GET /api/gpa-gradings/my-gradings`

---

### Phase 8 — MANAGER Dashboard

**Target Role:** `MANAGER`

- [ ] Overview — aggregate stats (operators, teachers, students, classes)
- [ ] Browse Operators (read-only)
- [ ] Browse Teachers — name, assignments summary
- [ ] Browse Students — name, index, enrollments summary
- [ ] Browse Classes / Sections / Clusters (read-only)
- [ ] Profile page

**API Endpoints Used:**
- `GET /api/operators/by-application-admin/{applicationAdminId}`
- `GET /api/teachers/by-operator/{operatorId}`
- `GET /api/students/by-operator/{operatorId}`
- `GET /api/clusters/by-operator/{operatorId}`
- `GET /api/sections/by-cluster/{clusterId}`
- `GET /api/classes/by-section/{sectionId}`
- `GET /api/managers/by-user/{userId}`

---

### Phase 9 — GUEST & Public Pages

**Target Role:** `GUEST` / unauthenticated

- [ ] Public landing page (school system intro)
- [ ] Visible: Register as Student / Register as School (ApplicationAdmin)
- [ ] **Student Academic Lookup (by Global Student Code):**
  - Public search page where a guest enters a `globalStudentCode`
  - Resolves the student via `GET /api/student-globals/by-code/{globalStudentCode}`
  - Displays read-only academic profile for that student:
    - Basic info: name, global student code
    - Enrolled classes and subjects (`GET /api/enrollments/student/{studentId}`)
    - Marks — respecting `classType` of each class:
      - `SUBJECT_BASE` class → subject exam marks per term (`GET /api/subject-exam-marks/by-student/{studentId}`) with letter grade from subject grading config
      - `MODULE_BASE` class → module exam marks (`GET /api/module-exam-marks/by-student/{studentId}`) with grade from GPA grading config
  - No login required; purely read-only view
  - Show a "Student not found" message if the code does not resolve

---

### Phase 10 — Polish & Cross-Cutting Concerns

- [ ] Global toast notifications for API success/error responses
- [ ] Form validation (required fields, min/max constraints from DTOs)
- [ ] Loading skeletons for data tables
- [ ] Responsive layout (mobile-friendly sidebar collapse)
- [ ] Token expiry handling — auto-logout or silent refresh
- [ ] Role-based subscription guard on ApplicationAdmin routes (check `/api/payments/check-my-subscription`)
- [ ] Analytics charts (marks distributions, GPA trends) where data supports it
- [ ] E2E testing for auth + critical flows
- [ ] Environment variables for API base URL

---

## Architecture

```
src/
├── assets/
├── components/
│   ├── common/
│   │   ├── DataTable.jsx         # sortable, paginated table
│   │   ├── Modal.jsx             # generic modal wrapper
│   │   ├── ConfirmDialog.jsx     # delete confirmation
│   │   ├── FormInput.jsx         # controlled input with validation
│   │   ├── Badge.jsx             # status/role badge
│   │   ├── StatusTag.jsx         # active/inactive tag
│   │   ├── LoadingSpinner.jsx
│   │   ├── Pagination.jsx
│   │   ├── Toast.jsx             # global notification
│   │   ├── WeeklyCalendar.jsx    # Mon–Fri × timeslot grid for timetable
│   │   └── MarksTable.jsx        # generic marks entry/display table
│   ├── layout/
│   │   ├── AppLayout.jsx         # sidebar + topbar shell
│   │   ├── Sidebar.jsx           # role-filtered nav links
│   │   └── Topbar.jsx            # user info + logout
│   └── auth/
│       ├── Login.jsx
│       ├── Register.jsx
│       ├── ForgotPassword.jsx
│       ├── ResetPassword.jsx
│       └── VerifyEmail.jsx
├── context/
│   └── AuthContext.jsx           # user, token, login(), logout(), refreshToken()
├── hooks/
│   ├── useAuth.js                # consumes AuthContext
│   └── useClassType.js           # helper: resolves classType for a given classId
├── pages/
│   ├── admin/
│   │   ├── AdminOverview.jsx
│   │   ├── AdminList.jsx
│   │   ├── AppAdminList.jsx
│   │   ├── PackageList.jsx
│   │   ├── PaymentList.jsx
│   │   └── UserList.jsx
│   ├── application-admin/
│   │   ├── AppAdminOverview.jsx
│   │   ├── Subscription.jsx
│   │   ├── ManagerList.jsx
│   │   ├── OperatorList.jsx
│   │   ├── GPAGradingConfig.jsx
│   │   ├── SubjectGradingConfig.jsx
│   │   └── AppAdminProfile.jsx
│   ├── operator/
│   │   ├── OperatorOverview.jsx
│   │   ├── ClusterList.jsx
│   │   ├── SectionList.jsx
│   │   ├── ClassList.jsx
│   │   ├── SubjectList.jsx
│   │   ├── ModuleList.jsx
│   │   ├── TeacherList.jsx
│   │   ├── StudentList.jsx
│   │   ├── EnrollmentHub.jsx
│   │   ├── TimeSlotList.jsx
│   │   ├── TimetableBuilder.jsx
│   │   └── OperatorProfile.jsx
│   ├── teacher/
│   │   ├── TeacherOverview.jsx
│   │   ├── TeacherTimetable.jsx
│   │   ├── MyAssignments.jsx
│   │   ├── ClassStudents.jsx
│   │   ├── MarkEntry.jsx         # class-type-aware — shows subject OR module form
│   │   └── TeacherProfile.jsx
│   ├── student/
│   │   ├── StudentOverview.jsx
│   │   ├── StudentProfile.jsx
│   │   ├── MyEnrollments.jsx
│   │   ├── MyMarks.jsx           # class-type-aware — shows subject OR module marks
│   │   └── StudentTimetable.jsx
│   ├── manager/
│   │   ├── ManagerOverview.jsx
│   │   ├── ViewOperators.jsx
│   │   ├── ViewTeachers.jsx
│   │   ├── ViewStudents.jsx
│   │   ├── ViewClasses.jsx
│   │   └── ManagerProfile.jsx
│   └── public/
│       ├── LandingPage.jsx
│       └── StudentLookup.jsx     # guest: search by globalStudentCode
├── services/
│   ├── authService.js
│   ├── userService.js
│   ├── adminService.js
│   ├── applicationAdminService.js
│   ├── managerService.js
│   ├── operatorService.js
│   ├── teacherService.js
│   ├── studentService.js
│   ├── clusterService.js
│   ├── sectionService.js
│   ├── classService.js
│   ├── subjectService.js
│   ├── moduleService.js
│   ├── enrollmentService.js
│   ├── subjectMarksService.js
│   ├── moduleMarksService.js
│   ├── gradingService.js
│   ├── timeSlotService.js
│   ├── timetableService.js
│   └── paymentService.js
└── utils/
    ├── axiosInstance.js          # axios with Bearer interceptor + refresh logic
    ├── roleHelpers.js            # getRoleRedirectPath(role)
    └── gradeHelpers.js           # getSubjectGrade(mark, gradingList), getGPAGrade(mark, gpaList)
```

---

## Service Layer Specification

> Each service function calls the corresponding API endpoint. All use `axiosInstance`. Functions return the `data` property of the Axios response.

### `authService.js`
```js
login({ email, password })                         // POST /api/auth/login
logout()                                           // POST /api/auth/logout
refreshToken({ refreshToken })                     // POST /api/auth/refresh-token
registerStudent({ username, email, password, firstName, lastName, phone, dateOfBirth })
                                                   // POST /api/auth/register/student
registerApplicationAdmin({ username, email, password, schoolName })
                                                   // POST /api/auth/register/application-admin
verifyEmail({ email, otp })                        // POST /api/auth/verify-email
forgotPassword({ email })                          // POST /api/auth/forgot-password
resetPassword({ email, otp, newPassword })         // POST /api/auth/reset-password
```

### `adminService.js`
```js
getAll()                                           // GET /api/admins
create({ username, email, password, nic, employeeNumber })
                                                   // POST /api/admins
getById(id)                                        // GET /api/admins/{id}
update(id, { nic, employeeNumber })                // PUT /api/admins/{id}
remove(id)                                         // DELETE /api/admins/{id}
getByUser(userId)                                  // GET /api/admins/by-user/{userId}
```

### `applicationAdminService.js`
```js
getAll()                                           // GET /api/application-admins
getById(id)                                        // GET /api/application-admins/{id}
getByUser(userId)                                  // GET /api/application-admins/by-user/{userId}
update(id, { nic, applicationType })               // PUT /api/application-admins/{id}
enable(id)                                         // PATCH /api/application-admins/{id}/enable
disable(id)                                        // PATCH /api/application-admins/{id}/disable
```

### `managerService.js`
```js
getAll()                                           // GET /api/managers
create({ username, email, password, nic, phoneNumber })
                                                   // POST /api/managers
getById(id)                                        // GET /api/managers/{id}
update(id, { nic })                                // PUT /api/managers/{id}
remove(id)                                         // DELETE /api/managers/{id}
getByUser(userId)                                  // GET /api/managers/by-user/{userId}
getByApplicationAdmin(applicationAdminId)          // GET /api/managers/by-application-admin/{applicationAdminId}
```

### `operatorService.js`
```js
getAll()                                           // GET /api/operators
create({ username, email, password, nic, phoneNumber })
                                                   // POST /api/operators
getById(id)                                        // GET /api/operators/{id}
update(id, { nic })                                // PUT /api/operators/{id}
remove(id)                                         // DELETE /api/operators/{id}
getByUser(userId)                                  // GET /api/operators/by-user/{userId}
getByApplicationAdmin(applicationAdminId)          // GET /api/operators/by-application-admin/{applicationAdminId}
```

### `teacherService.js`
```js
getAll()                                           // GET /api/teachers
create({ username, email, password, nic, teacherId, phoneNumber })
                                                   // POST /api/teachers
getById(id)                                        // GET /api/teachers/{id}
update(id, { nic, teacherId })                     // PUT /api/teachers/{id}
remove(id)                                         // DELETE /api/teachers/{id}
getByUser(userId)                                  // GET /api/teachers/by-user/{userId}
getByOperator(operatorId)                          // GET /api/teachers/by-operator/{operatorId}
```

### `studentService.js`
```js
// StudentGlobal (global identity)
getGlobalByUser(userId)                            // GET /api/student-globals/by-user/{userId}
getGlobalByCode(globalStudentCode)                 // GET /api/student-globals/by-code/{globalStudentCode}
getGlobalById(id)                                  // GET /api/student-globals/{id}
updateGlobal(id, { firstName, lastName, phone, dateOfBirth })
                                                   // PUT /api/student-globals/{id}

// Student (school-scoped)
getAll()                                           // GET /api/students
create({ globalStudentCode, indexNumber, address })
                                                   // POST /api/students
getById(id)                                        // GET /api/students/{id}
update(id, { indexNumber, address })               // PUT /api/students/{id}
remove(id)                                         // DELETE /api/students/{id}
getByStudentGlobal(studentGlobalId)                // GET /api/students/by-student-global/{studentGlobalId}
getByOperator(operatorId)                          // GET /api/students/by-operator/{operatorId}
```

### `clusterService.js`
```js
getAll()                                           // GET /api/clusters
create({ name })                                   // POST /api/clusters
getById(id)                                        // GET /api/clusters/{id}
update(id, { name })                               // PUT /api/clusters/{id}
remove(id)                                         // DELETE /api/clusters/{id}
getByOperator(operatorId)                          // GET /api/clusters/by-operator/{operatorId}
```

### `sectionService.js`
```js
getAll()                                           // GET /api/sections
create({ name, clusterId })                        // POST /api/sections
getById(id)                                        // GET /api/sections/{id}
update(id, { name, clusterId })                    // PUT /api/sections/{id}
remove(id)                                         // DELETE /api/sections/{id}
getByCluster(clusterId)                            // GET /api/sections/by-cluster/{clusterId}
getByOperator(operatorId)                          // GET /api/sections/by-operator/{operatorId}
```

### `classService.js`
```js
getAll()                                           // GET /api/classes
create({ name, sectionId, academicYear, classType })
                                                   // POST /api/classes
getById(id)                                        // GET /api/classes/{id}
update(id, { name, sectionId, academicYear, classType })
                                                   // PUT /api/classes/{id}
remove(id)                                         // DELETE /api/classes/{id}
getBySection(sectionId)                            // GET /api/classes/by-section/{sectionId}
getByOperator(operatorId)                          // GET /api/classes/by-operator/{operatorId}
getByAcademicYear(academicYear)                    // GET /api/classes/by-academic-year/{academicYear}
```

### `subjectService.js`
```js
getAll()                                           // GET /api/subjects
create({ name, creditValue })                      // POST /api/subjects
getById(id)                                        // GET /api/subjects/{id}
update(id, { name, creditValue })                  // PUT /api/subjects/{id}
remove(id)                                         // DELETE /api/subjects/{id}
getByOperator(operatorId)                          // GET /api/subjects/by-operator/{operatorId}
```

### `moduleService.js`
```js
getAll()                                           // GET /api/modules
create({ name, subjectId, sectionId, moduleWeight })
                                                   // POST /api/modules
getById(id)                                        // GET /api/modules/{id}
update(id, { name, subjectId, sectionId, moduleWeight })
                                                   // PUT /api/modules/{id}
remove(id)                                         // DELETE /api/modules/{id}
getByOperator(operatorId)                          // GET /api/modules/by-operator/{operatorId}
getBySectionAndSubject(sectionId, subjectId)       // GET /api/modules/by-section/{sectionId}/subject/{subjectId}
```

### `enrollmentService.js`
```js
// Class enrollments
bulkEnrollClass({ classId, studentIds })           // POST /api/enrollments/class/bulk
enrollStudent(classId, studentId)                  // POST /api/enrollments/class/{classId}/student/{studentId}
unenrollStudent(classId, studentId)                // DELETE /api/enrollments/class/{classId}/student/{studentId}
getClassStudents(classId)                          // GET /api/enrollments/class/{classId}/students

// Subject enrollments
enrollCommonSubjects({ classId, subjectIds })      // POST /api/enrollments/subjects/class-common
enrollElectiveSubject({ classId, subjectId, studentIds })
                                                   // POST /api/enrollments/subjects/elective
unenrollSubjectStudent(subjectId, sectionId, studentId)
                                                   // DELETE /api/enrollments/subject/{subjectId}/section/{sectionId}/student/{studentId}

// Student enrollment views
getStudentEnrollments(studentId)                   // GET /api/enrollments/student/{studentId}
getStudentSubjects(studentId)                      // GET /api/enrollments/student/{studentId}/subjects
getStudentCurriculum(classId, studentId)           // GET /api/enrollments/class/{classId}/student/{studentId}/curriculum

// Teacher assignments
assignTeacherSubject({ teacherId, subjectId })     // POST /api/enrollments/teacher-subject
bulkAssignTeacherSubjects({ teacherId, subjectIds })
                                                   // POST /api/enrollments/teacher-subject/bulk
removeTeacherSubject(teacherId, subjectId)         // DELETE /api/enrollments/teacher-subject/{teacherId}/{subjectId}
assignTeacherSection({ teacherId, sectionId })     // POST /api/enrollments/teacher-section
bulkAssignTeacherSections({ teacherId, sectionIds })
                                                   // POST /api/enrollments/teacher-section/bulk
removeTeacherSection(teacherId, sectionId)         // DELETE /api/enrollments/teacher-section/{teacherId}/{sectionId}
assignTeachersToSubjectSections({ subjectId, sectionIds, teacherIds })
                                                   // POST /api/enrollments/assign-teachers-to-subject-sections

// Teacher views
getTeacherAssignments(teacherId)                   // GET /api/enrollments/teacher/{teacherId}/assignments
getTeacherSubjects(teacherId)                      // GET /api/enrollments/teacher/{teacherId}/subjects
getTeacherSections(teacherId)                      // GET /api/enrollments/teacher/{teacherId}/sections
getEligibleTeachers(subjectId, sectionId)          // GET /api/enrollments/eligible-teachers
```

### `subjectMarksService.js`
```js
// Use only for SUBJECT_BASE classes
bulkSubmitMarks({ subjectId, classId, termTest, marks })
                                                   // POST /api/subject-exam-marks/bulk
                                                   // marks: [{ studentId, mark }]
getByStudent(studentId)                            // GET /api/subject-exam-marks/by-student/{studentId}
getByClass(classId)                                // GET /api/subject-exam-marks/by-class/{classId}
getByClassSubjectTerm(classId, subjectId, termTest)
                                                   // GET /api/subject-exam-marks/by-class/{classId}/by-subject/{subjectId}/by-term/{termTest}
getMark(studentId, classId, subjectId, termTest)   // GET /api/subject-exam-marks/mark/{studentId}/{classId}/{subjectId}/{termTest}
updateMark(studentId, classId, subjectId, termTest, { mark })
                                                   // PUT /api/subject-exam-marks/mark/{studentId}/{classId}/{subjectId}/{termTest}
deleteMark(studentId, classId, subjectId, termTest)
                                                   // DELETE /api/subject-exam-marks/mark/{studentId}/{classId}/{subjectId}/{termTest}
```

### `moduleMarksService.js`
```js
// Use only for MODULE_BASE classes
bulkSubmitMarks({ subjectId, classId, moduleId, marks })
                                                   // POST /api/module-exam-marks/bulk
                                                   // marks: [{ studentId, mark }]
getByStudent(studentId)                            // GET /api/module-exam-marks/by-student/{studentId}
getByModule(moduleId)                              // GET /api/module-exam-marks/by-module/{moduleId}
getMark(studentId, moduleId)                       // GET /api/module-exam-marks/mark/{studentId}/{moduleId}
updateMark(studentId, moduleId, { mark })          // PUT /api/module-exam-marks/mark/{studentId}/{moduleId}
deleteMark(studentId, moduleId)                    // DELETE /api/module-exam-marks/mark/{studentId}/{moduleId}
```

### `gradingService.js`
```js
// GPA Gradings (MODULE_BASE)
getAllGPA()                                        // GET /api/gpa-gradings
createGPA({ grade, minMark, maxMark, gradePoint }) // POST /api/gpa-gradings
getGPAById(id)                                     // GET /api/gpa-gradings/{id}
updateGPA(id, { grade, minMark, maxMark, gradePoint })
                                                   // PUT /api/gpa-gradings/{id}
deleteGPA(id)                                      // DELETE /api/gpa-gradings/{id}
getMyGPAGradings()                                 // GET /api/gpa-gradings/my-gradings

// Subject Gradings (SUBJECT_BASE)
getAllSubject()                                    // GET /api/subject-gradings
createSubject({ grade, minMark, maxMark })         // POST /api/subject-gradings
getSubjectById(id)                                 // GET /api/subject-gradings/{id}
updateSubject(id, { grade, minMark, maxMark })     // PUT /api/subject-gradings/{id}
deleteSubject(id)                                  // DELETE /api/subject-gradings/{id}
getMySubjectGradings()                             // GET /api/subject-gradings/my-gradings
```

### `timeSlotService.js`
```js
getAll()                                           // GET /api/TimeSlots
create({ name, startTime, endTime })               // POST /api/TimeSlots
getById(id)                                        // GET /api/TimeSlots/{id}
update(id, { name, startTime, endTime })           // PUT /api/TimeSlots/{id}
remove(id)                                         // DELETE /api/TimeSlots/{id}
getByAdmin(createdBy)                              // GET /api/TimeSlots/by-admin/{createdBy}
```

### `timetableService.js`
```js
getAll()                                           // GET /api/timetables
create({ classId, subjectId, teacherId, timeSlotId, dayOfWeek })
                                                   // POST /api/timetables
getById(id)                                        // GET /api/timetables/{id}
update(id, { classId, subjectId, teacherId, timeSlotId, dayOfWeek })
                                                   // PUT /api/timetables/{id}
remove(id)                                         // DELETE /api/timetables/{id}
bulkCreate({ timetables })                         // POST /api/timetables/bulk
checkConflicts(payload)                            // POST /api/timetables/check-conflicts
getClassWeekly(classId)                            // GET /api/timetables/class/{classId}/week
getClassByDay(classId, day)                        // GET /api/timetables/class/{classId}/day/{day}
getTeacherWeekly(teacherId)                        // GET /api/timetables/teacher/{teacherId}/week
getTeacherByDay(teacherId, day)                    // GET /api/timetables/teacher/{teacherId}/day/{day}
getStudentClassWeekly(studentId, classId)          // GET /api/timetables/student/{studentId}/class/{classId}/week
getTeacherAvailability(teacherId)                  // GET /api/timetables/teacher/{teacherId}/available
getClassAvailability(classId)                      // GET /api/timetables/class/{classId}/available
```

### `paymentService.js`
```js
getAll()                                           // GET /api/payments
create({ applicationAdminId, packageId })          // POST /api/payments
getById(id)                                        // GET /api/payments/{id}
getByApplicationAdmin(applicationAdminId)          // GET /api/payments/application-admin/{applicationAdminId}
getSubscriptionStatus(applicationAdminId)          // GET /api/payments/subscription-status/{applicationAdminId}
getMySubscription()                                // GET /api/payments/my-subscription
hasActiveSubscription(applicationAdminId)          // GET /api/payments/has-active-subscription/{applicationAdminId}
checkMySubscription()                              // GET /api/payments/check-my-subscription

// Packages
getAllPackages()                                   // GET /api/packages
createPackage({ labal, discription, periodInMonths, price })
                                                   // POST /api/packages
updatePackage(id, { labal, discription, periodInMonths, price })
                                                   // PUT /api/packages/{id}
deletePackage(id)                                  // DELETE /api/packages/{id}
```

### `utils/gradeHelpers.js`
```js
// Given a numeric mark and the grading list, return the letter grade string
getSubjectGrade(mark, subjectGradingList)
// subjectGradingList: SubjectGradingDto[] from GET /api/subject-gradings/my-gradings
// Returns: grade string (e.g. "A") or "N/A"

getGPAGrade(mark, gpaGradingList)
// gpaGradingList: GPAGradingDto[] from GET /api/gpa-gradings/my-gradings
// Returns: { grade: string, gradePoint: float } or null
```

### `utils/axiosInstance.js`
```js
// - Sets baseURL from import.meta.env.VITE_API_BASE_URL
// - Request interceptor: attach Authorization: Bearer <token> from localStorage/memory
// - Response interceptor: on 401, attempt POST /api/auth/refresh-token,
//   retry original request with new token; if refresh fails, call logout() and redirect to /login
```

---

## Key Data Model Relationships

```
ApplicationAdmin
 ├── has many Managers
 ├── has many Operators
 └── has Subscription (Payment → Package)

Operator
 ├── manages Clusters
 │    └── Sections
 │         └── Classes (SUBJECT_BASE | MODULE_BASE)
 ├── manages Subjects (+ Modules for MODULE_BASE)
 ├── manages Teachers
 └── manages Students

Class  ← classType drives ALL mark entry and mark display logic
 ├── [SUBJECT_BASE] → uses SubjectExamMarks (per term: FIRST/SECOND/FINAL)
 ├── [MODULE_BASE]  → uses ModuleExamMarks (per module)
 ├── enrolled Students
 ├── enrolled Subjects (common + elective per student)
 └── Timetable entries (Subject + Teacher + TimeSlot + Day)

Teacher
 ├── assigned to Subjects (via enrollment)
 ├── assigned to Sections (via enrollment)
 └── enters marks matching the classType of the target class

Student
 ├── has one StudentGlobal (global identity, globalStudentCode)
 ├── has many school-scoped Student records (one per operator/school)
 ├── enrolled in Classes
 └── has SubjectExamMarks OR ModuleExamMarks per class (never both)
```
