#set document(title: "Altar Server Rota System Technical Design", author: "St. John Henry Newman Server Guild")
#set page(paper: "us-letter", margin: 1in)
#set text(font: "Libertinus Serif", size: 11pt)
#set heading(numbering: "1.")

#let req(id, body) = block[
  #strong[#id.] #body
]

#align(center)[
  #v(0.75in)
  #image("CoatOfArms.png", width: 30%)
  #v(0.45in)
  #text(size: 24pt, weight: "bold")[Altar Server Rota System]
  #v(0.15in)
  #text(size: 16pt)[Technical Design Document]
  #v(0.35in)
  #text(size: 12pt)[Node.js + TypeScript + PostgreSQL]
  #v(0.1in)
  #text(size: 10pt)[Draft]
]

#pagebreak()

= Purpose

This document defines the recommended technical architecture for the Altar Server Rota System. It supports the functional requirements in `Administrator-requirements.typ` and codifies the selected implementation stack:

- Node.js runtime
- TypeScript application code
- Next.js web application with React
- PostgreSQL database
- Docker Compose development and deployment baseline
- TypeScript scheduling engine

The existing Lua scheduler is treated as a prototype for scheduling concepts and test data. The production application should implement the scheduling engine in TypeScript so that it shares the same domain model, validation rules, and database access layer as the web application.

= Architectural Decision

#req("ADR-001")[The system shall be implemented primarily in TypeScript running on Node.js.]

#req("ADR-002")[The web application shall use Next.js with React and the Next.js App Router.]

#req("ADR-003")[PostgreSQL shall be the system of record.]

#req("ADR-004")[The scheduling engine shall be implemented as a TypeScript domain module, not as database stored procedures.]

#req("ADR-005")[The application shall use server-side authorization checks for every operation that creates, changes, or deletes rota data.]

#req("ADR-006")[The application shall expose a responsive web interface for desktop, tablet, and mobile browsers.]

#req("ADR-007")[The baseline runtime architecture shall use Docker Compose with separate application and database containers.]

== Rationale

Next.js gives the project a single TypeScript codebase for the user interface, server-side rendering, form handling, API routes, and deployment. PostgreSQL is preferred over a NoSQL database because the core domain is relational: adult accounts manage server profiles, server profiles hold qualifications, services contain positions, and positions receive assignments and volunteer requests.

PostgreSQL constraints should enforce critical invariants where practical, while application services enforce workflow rules and domain-specific authorization.

= System Context

The system will be used by:

- Adult users with login accounts
- Managing adults who manage minor server profiles
- Administrators with rota-management privileges

The system will provide:

- Calendar and rota views
- Account and server profile management
- Service and position management
- Volunteer request submission
- Administrator approval workflows
- Generated rota proposals
- Assignment and decline tracking
- Audit/change records

= Technology Stack

#req("TST-001")[The frontend shall be built with React components in a Next.js application.]

#req("TST-002")[The backend shall run on Node.js and be written in TypeScript.]

#req("TST-003")[The database shall be PostgreSQL.]

#req("TST-004")[The application shall use a TypeScript-safe database access layer.]

#req("TST-005")[The project shall use Prisma for database access and migrations.]

#req("TST-006")[The project shall use database migrations for all schema changes.]

#req("TST-007")[The project shall use automated tests for domain logic, scheduling rules, and permission checks.]

Recommended default choices:

- Next.js App Router
- React Server Components where appropriate
- TypeScript strict mode
- PostgreSQL
- Prisma for schema migrations and database access
- Auth.js for authentication
- Zod or similar schema validation for form/API input
- Vitest for unit tests
- Playwright for browser workflow tests

#req("TST-008")[The project shall use Prisma as the primary database access layer and migration tool.]

#req("TST-009")[The project shall use Auth.js for authentication.]

= Logical Architecture

The application should be organized into the following modules:

accounts:: Adult login accounts, Administrator flag, authentication identity, and profile ownership.

server-profiles:: Adult and minor schedulable people, including the relationship between a minor and the Managing Adult.

roles:: Liturgical roles and role qualifications.

services:: Liturgical services such as Mass, Vespers, Benediction, or other parish liturgies.

positions:: Required slots within a service.

rotas:: Calendar-facing collections of services and assignments over a date range.

assignments:: Server profile placements into service positions.

volunteer-requests:: Requests submitted by adult accounts for eligible server profiles.

scheduling-engine:: Generation of proposed assignments from services, position slots, qualifications, availability, and existing assignments.

audit-log:: Change records for user actions and Administrator actions.

= Deployment Architecture

The initial deployment shall use a simple two-container Docker Compose architecture:

1. `app`: Next.js web application running on Node.js
2. `db`: PostgreSQL database with persistent storage

The application and database shall be separate containers because the application is disposable and the database is stateful. The database container shall use a named Docker volume for PostgreSQL data.

The first implementation may run scheduling generation synchronously in the application container if generation is fast enough. If generation becomes slow or needs retries, the system may add a separate worker container later.

#req("DEP-001")[The project shall include a Dockerfile for the application container.]

#req("DEP-002")[The project shall include a Docker Compose file defining `app` and `db` services.]

#req("DEP-003")[The `app` service shall run the Next.js application.]

#req("DEP-004")[The `db` service shall run PostgreSQL.]

#req("DEP-005")[The `db` service shall store PostgreSQL data in a named Docker volume.]

#req("DEP-006")[The `app` service shall connect to PostgreSQL through Docker Compose service networking.]

#req("DEP-007")[Database connection settings shall be provided through environment variables.]

#req("DEP-008")[The project shall include an example environment file documenting required configuration values.]

#req("DEP-009")[The application container shall not store persistent application data on its writable filesystem.]

#req("DEP-010")[A separate worker container may be added later using the same application image with a different start command.]

== Optional Cloud Deployment

Docker Compose is the baseline for local development and may be sufficient for a small self-hosted deployment. Cloud deployment is optional and should not change the application architecture.

For cloud production deployments, the recommended shape is:

1. containerized `app` service
2. managed PostgreSQL database
3. managed configuration and secrets
4. provider-managed logs and backups

In cloud production, PostgreSQL should usually be provided by a managed database service rather than by a PostgreSQL container. The application should continue to connect through the same environment-based database configuration used locally.

AWS reference option:

- app runtime: AWS App Runner or ECS Fargate
- database: Amazon RDS for PostgreSQL
- secrets/configuration: AWS Secrets Manager or Systems Manager Parameter Store
- logs: Amazon CloudWatch
- TLS/domain: managed by App Runner or by an Application Load Balancer with ACM

Azure reference option:

- app runtime: Azure Container Apps or Azure App Service for Containers
- database: Azure Database for PostgreSQL Flexible Server
- secrets/configuration: Azure Key Vault or managed application settings
- logs: Azure Monitor and Log Analytics
- TLS/domain: managed by the selected Azure app hosting service, Front Door, or Application Gateway

#req("CLD-001")[Cloud deployment shall be optional.]

#req("CLD-002")[Cloud deployment shall not require a different application architecture.]

#req("CLD-003")[The same application container image should be usable in Docker Compose, AWS, Azure, or another container runtime.]

#req("CLD-004")[For cloud production deployment, the application should use managed PostgreSQL rather than running PostgreSQL in an application-managed container.]

#req("CLD-005")[Cloud deployments shall provide database connection settings through environment variables or the provider's managed configuration mechanism.]

#req("CLD-006")[Cloud deployments should use the provider's managed secrets service for sensitive values.]

#req("CLD-007")[Cloud deployments should use provider-managed logging.]

#req("CLD-008")[Cloud deployments should rely on managed database backup and restore features.]

= Data Model

The following tables are recommended as the first relational model. Names are descriptive rather than final.

== user_accounts

- id
- login_name
- password_hash
- first_name
- middle_name
- last_name
- email
- phone_primary
- phone_secondary
- is_administrator
- created_at
- updated_at
- disabled_at

Constraints:

- `login_name` unique
- `email` unique, if email is required for login or password reset
- all User Accounts represent adults
- authentication identities are managed through Auth.js

If local credentials are not enabled, password storage should be handled entirely by Auth.js and provider configuration rather than by the application domain model.

== auth_accounts_and_sessions

Auth.js shall provide the authentication account/session tables or equivalent persistence model required by the selected Auth.js adapter.

The application domain shall not treat external identity provider accounts as Server Profiles. External authentication proves the adult user's login identity; application tables still control Administrator privileges, managed Minor Server Profiles, Role Qualifications, Assignments, and Volunteer Requests.

== server_profiles

- id
- first_name
- middle_name
- last_name
- date_of_birth
- profile_type: adult or minor
- linked_user_account_id, nullable
- managing_user_account_id, nullable
- is_active
- created_at
- updated_at

Constraints:

- adult profiles may have a linked User Account
- minor profiles shall have exactly one Managing Adult
- minor profiles shall not have a linked login account
- adult profiles shall not have a Managing Adult unless a future requirement explicitly allows assisted management
- `date_of_birth` is required for every Server Profile

Date of birth is mandatory so the system can identify Minor Server Profiles eligible for maturation.

== roles

- id
- code
- name
- description
- display_order
- is_active

Constraints:

- `code` unique
- `name` unique

== role_qualifications

- id
- server_profile_id
- role_id
- granted_by_user_account_id
- granted_at
- notes
- revoked_at

Constraints:

- only one active qualification per server profile and role

== availability_rules

- id
- server_profile_id
- day_of_week
- available_from_time
- available_until_time
- is_available
- created_at
- updated_at

Recurring availability rules define the normal weekly availability pattern used when generating the main schedule.

== availability_overrides

- id
- server_profile_id
- starts_at
- ends_at
- is_available
- reason
- created_by_user_account_id
- created_at
- updated_at

Availability overrides define date-specific exceptions to the recurring availability rules. Examples include vacations, illness, school events, travel, or a one-time ability to serve a special liturgy.
The `reason` field is optional and is visible to Administrators, not to unrelated adult users or other households.

== service_templates

- id
- name
- description
- default_service_type
- is_active

== service_template_position_requirements

- id
- service_template_id
- role_id
- abbreviation
- required_count
- display_order

== rotas

- id
- name
- starts_on
- ends_on
- state
- created_by_user_account_id
- published_by_user_account_id
- published_at
- replaced_by_rota_id
- created_at
- updated_at
- cancelled_at

Recommended states:

- draft
- generated
- under_review
- published
- archived
- cancelled
- replaced

== services

- id
- rota_id
- service_type
- title
- starts_at
- ends_at
- liturgical_color
- service_template_id
- created_by_user_account_id
- created_at
- updated_at
- cancelled_at

== position_requirements

- id
- service_id
- role_id
- abbreviation
- display_order
- required_count

== position_slots

- id
- position_requirement_id
- service_id
- role_id
- abbreviation
- display_order
- slot_number
- state

Recommended states:

- open
- requested
- assigned
- declined
- cancelled

== assignments

- id
- service_id
- position_slot_id
- server_profile_id
- assigned_by_user_account_id
- assigned_at
- declined_by_user_account_id
- declined_at
- cancelled_by_user_account_id
- cancelled_at
- state

== volunteer_requests

- id
- service_id
- position_slot_id
- server_profile_id
- submitted_by_user_account_id
- submitted_at
- reviewed_by_user_account_id
- reviewed_at
- state

Recommended states:

- pending
- accepted
- rejected
- cancelled

== enrollment_invitations

- id
- email
- token_hash
- invitation_type
- target_server_profile_id, nullable
- invited_by_user_account_id
- used_by_user_account_id, nullable
- expires_at
- used_at
- cancelled_at
- created_at

Recommended invitation types:

- new_adult_account
- minor_maturation

Constraints:

- invitation tokens shall be single-use
- only a token hash shall be stored
- expired or cancelled tokens shall not allow account creation

== notification_preferences

- id
- user_account_id
- channel
- event_type
- enabled
- created_at
- updated_at

== notification_events

- id
- event_type
- channel
- recipient_user_account_id
- server_profile_id, nullable
- rota_id, nullable
- assignment_id, nullable
- volunteer_request_id, nullable
- state
- provider_message_id
- created_at
- sent_at
- failed_at
- error_summary

== audit_events

- id
- actor_user_account_id
- actor_was_administrator
- entity_type
- entity_id
- action
- summary
- occurred_at
- metadata_json

= Authorization Rules

#req("AUT-001")[Only adult User Accounts shall authenticate.]

#req("AUT-002")[A User Account may edit its own account contact details.]

#req("AUT-003")[A User Account may edit Server Profiles that it manages.]

#req("AUT-004")[A Managing Adult may submit Volunteer Requests for the Minor Server Profiles it manages.]

#req("AUT-005")[A Managing Adult may decline Assignments for the Minor Server Profiles it manages.]

#req("AUT-006")[A User Account may not submit a Volunteer Request for a Server Profile it does not manage, unless acting as an Administrator.]

#req("AUT-007")[An Administrator may create Rotas, create Services, create Position Requirements, create Position Slots, assign Server Profiles, approve Volunteer Requests, publish Rotas, and remove Assignments.]

#req("AUT-008")[An Administrator may add Role Qualifications to Minor Server Profiles.]

#req("AUT-009")[Every write operation shall be authorized on the server, independent of any client-side UI restrictions.]

#req("AUT-010")[The system shall use Auth.js for authentication.]

#req("AUT-011")[The system shall support OAuth 2.0 or OpenID Connect authentication providers through Auth.js.]

#req("AUT-012")[The system may support local credentials through Auth.js if local username and password accounts are required.]

#req("AUT-013")[An Administrator may invite adults to create User Accounts.]

#req("AUT-014")[An Administrator may start the maturation workflow for a Minor Server Profile that has become an adult.]

#req("AUT-015")[Only a parent or guardian User Account may create a Minor Server Profile.]

#req("AUT-016")[The User Account that creates a Minor Server Profile shall be recorded as the Managing Adult.]

#req("AUT-017")[An Administrator shall not create Minor Server Profiles unless the Administrator is creating the profile as the parent or guardian Managing Adult.]

== Recommended Initial Self-Service Policy

The first user-facing release should apply the following workflow rules:

1. Adult accounts are created through an Administrator-issued, single-use enrollment invitation. Open self-registration is excluded.
2. A User Account may act only for its linked Adult Server Profile and its managed Minor Server Profiles.
3. A user may create or amend availability, decline an Assignment, and submit a Volunteer Request for an eligible profile it manages.
4. A user may not directly create, move, replace, or remove an Assignment.
5. A decline leaves the Position Slot in `declined` state for Administrator review; it does not silently become an ordinary `open` slot.
6. Every Volunteer Request and substitution request remains pending until an Administrator accepts or rejects it.

This preserves a reliable published rota while allowing adults and guardians to report real availability and participate in filling vacancies.

= Scheduling Engine

The scheduling engine should be a pure TypeScript domain service where possible. It should accept inputs, produce a proposed rota, and avoid direct database writes until the Administrator accepts the proposal.

Inputs:

- date range
- Rota
- service templates or selected Services
- active Server Profiles
- Role Qualifications
- recurring availability rules
- date-specific availability overrides
- existing Services
- existing Assignments
- existing Volunteer Requests

Outputs:

- proposed Assignments
- unfilled Position Slots
- warnings
- fairness notes, if available

#req("SEN-001")[The scheduling engine shall only propose Server Profiles that are qualified for the Position Slot's Role unless the Administrator explicitly allows exceptions.]

#req("SEN-002")[The scheduling engine shall only propose Server Profiles that are available for the Service time.]

#req("SEN-003")[The scheduling engine shall avoid assigning the same Server Profile more than once within the same Service.]

#req("SEN-004")[The scheduling engine shall avoid assigning the same Server Profile to overlapping Services.]

#req("SEN-005")[The scheduling engine should distribute Assignments fairly across qualified and available Server Profiles.]

#req("SEN-006")[The scheduling engine shall report unfilled Position Slots.]

#req("SEN-007")[The scheduling engine shall not persist generated Assignments until the Administrator accepts the generated Rota.]

#req("SEN-008")[The scheduling engine shall use recurring availability rules to create the main generated schedule.]

#req("SEN-009")[The scheduling engine shall apply date-specific availability overrides after recurring availability rules.]

#req("SEN-010")[The scheduling engine shall generate individual Position Slots from Position Requirements.]

#req("SEN-011")[The scheduling engine should report household conflicts and assignment-count imbalances.]

= Web Frontend

The frontend should be a practical scheduling interface rather than a marketing-style site.

Primary views:

- Calendar day view
- Calendar week view
- Calendar month view
- Household assignments view
- Service detail view
- Rota generation screen
- Rota review and publish screen
- Server profile management
- Role qualification management
- Volunteer request review
- Account invitation screen
- Minor maturation screen
- Notification preference screen
- Account management
- Audit/change record view for Administrators

#req("WEB-001")[The calendar shall be usable on desktop and mobile browsers.]

#req("WEB-002")[Administrators shall be able to create or edit Services from the calendar.]

#req("WEB-003")[Adult users shall be able to view Assignments for themselves and managed Minor Server Profiles.]

#req("WEB-004")[Adult users shall be able to submit Volunteer Requests for eligible managed Server Profiles.]

#req("WEB-005")[Administrators shall have a clear review interface for pending Volunteer Requests.]

#req("WEB-006")[Administrators shall be warned before replacing existing Services, Position Slots, Assignments, or Volunteer Requests during generated Rota acceptance.]

#req("WEB-007")[Administrators shall be able to invite adults to enroll from the web interface.]

#req("WEB-008")[Administrators shall be able to start the minor maturation workflow from a Server Profile.]

#req("WEB-009")[Adult users shall have a household view of all Assignments for themselves and managed Minor Server Profiles.]

#req("WEB-010")[Administrators shall have a Rota review screen showing unfilled slots, warnings, conflicts, and assignment-count balance before publication.]

#req("WEB-011")[The system should provide printable and PDF Rota output.]

#req("WEB-012")[The system should provide iCalendar export for User Accounts.]

#req("WEB-013")[The first user self-service screen shall be a household view showing published Assignments for the adult and managed Minor Server Profiles.]

#req("WEB-014")[The household view shall provide availability management, Assignment decline, and Volunteer Request actions only for profiles managed by the signed-in User Account.]

= API and Server Actions

The application may use Next.js server actions, route handlers, or a service-layer API. Regardless of transport, the domain operations should be explicit.

Recommended operations:

- createService
- updateService
- cancelService
- createRota
- updateRota
- publishRota
- replaceRota
- createPositionRequirement
- updatePositionRequirement
- createPositionSlot
- updatePositionSlot
- submitVolunteerRequest
- reviewVolunteerRequest
- createAssignment
- declineAssignment
- removeAssignment
- generateRotaProposal
- acceptGeneratedRota
- addRoleQualification
- revokeRoleQualification
- createEnrollmentInvitation
- acceptEnrollmentInvitation
- cancelEnrollmentInvitation
- startMinorMaturation
- completeMinorMaturation
- createAvailabilityOverride
- createRecurringAvailabilityRule
- declineAssignment
- updateNotificationPreferences
- writeAuditEvent

Each operation should:

1. validate input
2. authorize the actor
3. load required domain records
4. enforce domain rules
5. persist changes in a transaction
6. write audit events
7. return a typed result

= Enrollment and Maturation Workflows

Enrollment and maturation links shall be implemented as invitation records with secure random tokens. The database shall store only token hashes. Raw tokens shall appear only in the emailed link.

New-adult enrollment:

1. An Administrator creates an invitation for an adult email address.
2. The system stores a hashed single-use token with an expiry time.
3. The system emails the invitation link.
4. The invited adult opens the link and creates a User Account.
5. The system marks the token as used.

Minor maturation:

1. An Administrator starts maturation for a Minor Server Profile.
2. The system creates a maturation invitation for the former minor's email address.
3. The former minor accepts the invitation and creates a User Account.
4. The system converts the Minor Server Profile to an Adult Server Profile.
5. The system links the new User Account to the converted Adult Server Profile.
6. The system removes Managing Adult control from the converted profile.
7. Historical Assignments, Volunteer Requests, Role Qualifications, and audit records remain attached to the same Server Profile.

#req("ENR-001")[Enrollment and maturation tokens shall be securely random and single-use.]

#req("ENR-002")[The database shall store invitation token hashes, not raw invitation tokens.]

#req("ENR-003")[Enrollment and maturation tokens shall expire.]

#req("ENR-004")[Accepting a maturation invitation shall convert the Minor Server Profile to an Adult Server Profile.]

#req("ENR-005")[Accepting a maturation invitation shall link the new User Account to the converted Adult Server Profile.]

#req("ENR-006")[Accepting a maturation invitation shall remove the previous Managing Adult relationship.]

= Realtime Updates

The first implementation may refresh calendar data on a timer, as stated in the product requirements.

If timer-based refresh becomes inadequate, the system should add server-sent events or WebSockets for live rota updates.

Recommended starting point:

- poll visible calendar ranges every 30 to 60 seconds
- refresh immediately after local write operations
- add realtime subscriptions later if needed

= Notifications

The first release should support email notifications. The notification design should remain open to additional notification channels later, such as SMS, push notifications, or parish-specific integrations.

Notifications should be implemented behind a provider interface so that the application can change providers without rewriting domain workflows.

Recommended initial channels:

- email for first release
- SMS as a later optional channel
- other notification providers as future extensions

Recommended notification events:

- Assignment created
- Assignment declined
- Assignment reminder
- Volunteer Request submitted
- Volunteer Request accepted
- Volunteer Request rejected
- Rota published or updated
- Enrollment invitation
- Maturation invitation

Assignment-decline notifications should identify the affected profile and be sent to Administrators for review. A declined slot must not be advertised as an ordinary open slot until an Administrator has chosen to reopen it.

#req("NOT-001")[The first release shall support email notifications.]

#req("NOT-002")[Notification delivery shall be implemented behind an internal notification provider interface.]

#req("NOT-003")[The notification design shall allow additional channels, including SMS, without changing core rota workflows.]

#req("NOT-004")[Notification events shall identify the affected Server Profile and the adult User Account receiving the notification.]

#req("NOT-005")[Notifications for Minor Server Profiles shall be sent to the Managing Adult, not to the minor.]

#req("NOT-006")[The system should support configurable reminder emails before Assignments.]

#req("NOT-007")[The system shall send enrollment and maturation invitation emails through the notification provider interface.]

= Migration From Existing Lua Prototype

The existing Lua files contain reusable concepts:

- `role_definitions.lua` maps to the `roles` table
- `mass_definitions.lua` maps to `service_templates` and `service_template_position_requirements`
- `servers.lua` maps partly to `server_profiles`, `role_qualifications`, and availability
- `assignServersToMass` maps to the first TypeScript scheduling engine

The Lua code should not be used as the production runtime unless a later architectural decision reverses this document.

Migration steps:

1. Normalize role codes and names.
2. Convert Mass definitions into service templates.
3. Convert server records into Server Profiles.
4. Convert server role arrays into Role Qualifications.
5. Convert day-based availability into the first availability model.
6. Port the scheduling algorithm into TypeScript.
7. Add tests that compare known Lua-style inputs against expected TypeScript Administrator outputs.

= Testing Requirements

#req("TST-010")[The scheduling engine shall have unit tests for qualification matching, availability matching, duplicate prevention, overlap prevention, and unfilled Position Slot reporting.]

#req("TST-011")[Authorization tests shall verify that User Accounts cannot manage unrelated Server Profiles.]

#req("TST-012")[Authorization tests shall verify that Minor Server Profiles cannot authenticate.]

#req("TST-013")[Authorization tests shall verify that only the Managing Adult can submit or decline on behalf of a Minor Server Profile.]

#req("TST-014")[Administrator workflow tests shall verify Service creation, Assignment creation, Volunteer Request approval, and generated Rota acceptance.]

#req("TST-015")[Database migration tests should run in continuous integration.]

#req("TST-016")[Enrollment invitation and minor maturation workflows shall have authorization and token-use tests.]

= Non-Functional Requirements

#req("NFR-001")[The system shall preserve data integrity through database constraints and transactional writes.]

#req("NFR-002")[The system should render calendar views quickly for ordinary parish rota sizes.]

#req("NFR-003")[The system should support multiple years of historical rota data.]

#req("NFR-004")[The system shall keep application configuration outside source code.]

#req("NFR-005")[The system shall support database backup and restore procedures.]

#req("NFR-006")[The system shall produce useful server-side logs for failed authorization, failed validation, and Administrator actions.]

= Resolved Technical Decisions

Database access layer:: The system shall use Prisma for database access and migrations.

Authentication:: The system shall use Auth.js. OAuth 2.0 and OpenID Connect providers are supported through Auth.js. Local credentials may be added if required.

Notifications:: The first release shall support email notifications and shall keep the notification design open to additional providers and channels.

Availability:: The system shall use recurring weekly availability for normal schedule generation and date-specific overrides for exceptions.

Liturgical calendar data:: The first release shall not import liturgical calendar data from `calendarium-romanum`. The system should be designed so that liturgical calendar integration can be added later.

Deployment target:: The recommended first deployment target is a VPS using Docker Compose with `app` and `db` services. Docker Compose remains the local development baseline. Managed cloud deployment on AWS or Azure remains an optional future path.
