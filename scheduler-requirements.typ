#set document(title: "Altar Server Rota System Requirements", author: "St. John Henry Newman Server Guild")
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
  #text(size: 16pt)[Requirements and Domain Model]
  #v(0.35in)
  #text(size: 12pt)[St. John Henry Newman Server Guild]
  #v(0.1in)
  #text(size: 10pt)[Draft]
]

#pagebreak()

= Purpose

The system will allow adult users and Administrators to create, manage, and view altar server rotas for Masses and other liturgical services.

The system will distinguish between adult login accounts and schedulable server profiles. All login accounts belong to adults. Minor servers do not log in directly; they are managed by a single adult account.

= Glossary

User Account:: An adult login identity. A User Account may manage the adult's own server profile, may manage zero or more minor server profiles, and may have Administrator privileges.

Server Profile:: A schedulable person who may be assigned to serve at a Service. A Server Profile may represent an adult or a minor.

Adult Server Profile:: A Server Profile for an adult. It may be linked to the adult's own User Account.

Minor Server Profile:: A Server Profile for a minor. A Minor Server Profile has no direct login and is managed by exactly one adult User Account.

Managing Adult:: The adult User Account responsible for managing a Minor Server Profile.

Service:: A scheduled liturgical event, such as a Mass, Vespers, Benediction, or another parish liturgy.

Rota:: A persisted schedule over a date range. A Rota contains Services, Position Requirements, Position Slots, Assignments, Volunteer Requests, publication state, and replacement history.

Position Requirement:: A required liturgical role and count for a Service, such as two Acolytes or four Torchbearers.

Position Slot:: One fillable slot created from a Position Requirement, such as Acolyte 1, Acolyte 2, Torchbearer 1, or Torchbearer 2.

Assignment:: A Server Profile placed into a Position Slot for a Service.

Role:: A type of service a Server Profile may be qualified to perform.

Role Qualification:: A record that a Server Profile is approved to serve a Role.

Volunteer Request:: A request submitted by an adult User Account for a Server Profile to fill an open Position Slot.

Administrator:: An adult User Account with privileges to create Services, edit Rotas, approve Volunteer Requests, assign or remove Server Profiles, and manage Role Qualifications.

= Domain Model

== Account and Profile Relationships

#req("DM-001")[All login accounts shall belong to adults.]

#req("DM-002")[A User Account shall represent an adult who can log in to the system.]

#req("DM-003")[A Server Profile shall represent a person who can be scheduled to serve.]

#req("DM-004")[A User Account may be linked to zero or one Adult Server Profile for that same adult.]

#req("DM-005")[A User Account may manage zero or more Minor Server Profiles.]

#req("DM-006")[A Minor Server Profile shall have exactly one Managing Adult.]

#req("DM-007")[A Minor Server Profile shall not have login credentials.]

#req("DM-008")[A User Account shall not manage Minor Server Profiles for unrelated minors.]

#req("DM-009")[Assignments and Volunteer Requests shall be made for Server Profiles, not directly for User Accounts.]

#req("DM-010")[Date of birth shall be recorded for every Server Profile.]

#req("DM-011")[Only a parent or guardian User Account shall create a Minor Server Profile.]

#req("DM-012")[The User Account that creates a Minor Server Profile shall become the Managing Adult for that Minor Server Profile.]

== Suggested Data Entities

User Account:
- account id
- login name
- hashed password
- first name
- middle name
- last name
- email address
- phone number 1
- phone number 2
- Administrator flag

Server Profile:
- server profile id
- first name
- middle name
- last name
- date of birth
- adult or minor status
- linked User Account, if an adult profile with a login
- Managing Adult User Account, if a minor profile
- availability
- active or inactive status

Role:
- role id
- name
- abbreviation
- description

Role Qualification:
- server profile
- role
- granted by User Account
- granted time
- notes

Rota:
- rota id
- name
- start date
- end date
- state
- created by User Account
- published by User Account
- replaced by Rota, if applicable

Rota states:
- draft
- generated
- under review
- published
- archived
- cancelled
- replaced

Service:
- service id
- rota
- date and time
- service type
- title or description
- liturgical color, if tracked
- template used, if generated from a template

Position Requirement:
- position requirement id
- service
- role
- abbreviation
- display order
- required count

Position Slot:
- position slot id
- position requirement
- service
- role
- abbreviation
- display order
- slot number
- state

Position Slot states:
- open
- requested
- assigned
- declined
- cancelled

Assignment:
- assignment id
- service
- position slot
- server profile
- assigned by User Account
- assigned time
- state

Volunteer Request:
- request id
- service
- position slot
- server profile being volunteered
- submitted by User Account
- submitted time
- state

= Calendar and Rota Management

#req("CAL-001")[The system shall show a calendar in day, week, and month views.]

#req("CAL-002")[The system shall allow an Administrator to click on a day and create a Service.]

#req("CAL-003")[A Service shall contain the Position Slots that need to be filled.]

#req("CAL-004")[Default Position Requirements and Position Slots for a Service shall be created from a service template file.]

#req("CAL-005")[A service template shall contain the names of the Position Requirements to fill, their abbreviations, and the number of servers required for each Position Requirement.]

#req("CAL-006")[The Administrator shall be able to select a Server Profile from a list for each Position Slot.]

#req("CAL-007")[After the Rota is published, the calendar shall display each Position Slot abbreviation and the assigned Server Profile's display name.]

#req("CAL-008")[The system shall create individual Position Slots from each Position Requirement.]

#req("CAL-009")[If a Position Requirement requires more than one server, the system shall create one Position Slot for each required server.]

#req("CAL-010")[The system shall support Rota states of draft, generated, under review, published, archived, cancelled, and replaced.]

#req("CAL-011")[Adult users shall only see published Rotas unless they are Administrators.]

#req("CAL-012")[Administrators shall be able to review a generated Rota before publishing it.]

#req("CAL-013")[Administrators shall be able to publish a Rota after review.]

#req("CAL-014")[Administrators shall be able to replace an existing Rota with a new Rota while preserving replacement history.]

= User Access

#req("USR-001")[Members of the server guild with adult User Accounts shall be able to log into the system and view the calendar.]

#req("USR-002")[Adult User Accounts shall be able to view Rotas.]

#req("USR-003")[A User Account shall be able to manage its linked Adult Server Profile, if one exists.]

#req("USR-004")[A User Account shall be able to manage each Minor Server Profile for which it is the Managing Adult.]

#req("USR-005")[A minor shall not log into the system directly.]

#req("USR-006")[The system shall have a secure login.]

== Recommended Initial Self-Service Policy

The following recommendations define the intended first user-facing workflow.
They are recorded here for review before implementation:

- Adults enroll through an Administrator-issued invitation; open self-registration is not part of the first release.
- An adult User Account manages its own linked Adult Server Profile and every Minor Server Profile for which it is the Managing Adult.
- Users manage availability and may decline an Assignment or request an open Position Slot. They do not directly create, alter, or replace Assignments.
- A Volunteer Request, including a substitution request, requires Administrator approval before it becomes an Assignment.
- Availability should begin with recurring weekly rules and date-specific exceptions. An optional explanatory note is for Administrator use and is not displayed to other users.

= Account Invitations and Enrollment

#req("INV-001")[An Administrator shall be able to invite an adult to enroll in the system.]

#req("INV-002")[The invitation workflow shall send an email containing a secure enrollment link.]

#req("INV-003")[Each enrollment link shall use a secure token stored by the system.]

#req("INV-004")[An enrollment token shall be single-use.]

#req("INV-005")[An enrollment token shall expire after a configured period.]

#req("INV-006")[A valid enrollment token shall allow the invited adult to create a User Account.]

#req("INV-007")[An Administrator shall be able to cancel a pending invitation.]

#req("INV-008")[The system shall record who created, used, expired, or cancelled an invitation.]

= Minor Maturation

#req("MAT-001")[The system shall identify Minor Server Profiles that are at least 18 years old using the required date of birth.]

#req("MAT-002")[An Administrator shall be able to start a maturation workflow for a Minor Server Profile that has become an adult.]

#req("MAT-003")[The maturation workflow shall require an email address for the former minor.]

#req("MAT-004")[The maturation workflow shall send the former minor a secure invitation link to create an adult User Account.]

#req("MAT-005")[When the invitation is accepted, the system shall convert the Minor Server Profile to an Adult Server Profile.]

#req("MAT-006")[When the invitation is accepted, the new User Account shall be linked to the converted Adult Server Profile.]

#req("MAT-007")[After maturation, the previous Managing Adult shall no longer manage the converted Adult Server Profile.]

#req("MAT-008")[The maturation workflow shall preserve historical Assignments, Volunteer Requests, Role Qualifications, and audit records.]

#req("MAT-009")[The system shall record the Administrator who started the maturation workflow and the time the conversion was completed.]

= Volunteer Requests and Declines

#req("VOL-001")[If an adult Server Profile is scheduled for an Assignment, the linked User Account may decline that Assignment.]

#req("VOL-002")[If a Minor Server Profile is scheduled for an Assignment, only the Managing Adult may decline that Assignment on behalf of the minor.]

#req("VOL-003")[If an adult User Account sees an open Position Slot, the User Account may submit a Volunteer Request for an eligible Server Profile it manages.]

#req("VOL-004")[A User Account may submit a Volunteer Request for its own Adult Server Profile, if one exists.]

#req("VOL-005")[A Managing Adult may submit a Volunteer Request for any Minor Server Profile it manages.]

#req("VOL-006")[A User Account shall not submit a Volunteer Request for a Server Profile it does not manage, unless acting as an Administrator under Administrator privileges.]

#req("VOL-007")[Each Volunteer Request shall record both the Server Profile being volunteered and the User Account that submitted the request.]

#req("VOL-008")[Each declined Assignment shall record both the assigned Server Profile and the User Account that declined the Assignment.]

#req("VOL-009")[A Volunteer Request shall not become an Assignment until it is accepted by an Administrator.]

#req("VOL-010")[If an Assignment is declined, the Position Slot shall remain in the declined state pending Administrator review. The Administrator may reopen it for substitution, cancel it, or make another Assignment.]

#req("VOL-011")[The system should support substitution requests for declined Assignments.]

= Roles and Qualifications

#req("ROL-001")[There shall be a list of Roles.]

#req("ROL-002")[Each Role shall have a name, an abbreviation, and a description.]

#req("ROL-003")[Server Profiles may be qualified for Roles.]

#req("ROL-004")[Each Server Profile shall have a list of Role Qualifications.]

#req("ROL-005")[A User Account may only submit a Volunteer Request for a Position Slot if the Server Profile is qualified for the Position Slot's Role.]

#req("ROL-006")[An Administrator may assign any Server Profile to any Position Slot.]

#req("ROL-007")[If an Administrator assigns a Server Profile to a Position Slot for which the Server Profile is not qualified, the system shall warn the Administrator before saving the Assignment.]

#req("ROL-008")[An Administrator may add Role Qualifications to a Minor Server Profile.]

#req("ROL-009")[An Administrator should be able to remove Role Qualifications from a Server Profile to correct mistakes or reflect changed training status.]

#req("ROL-010")[Role Qualifications should support optional training or qualification notes.]

= Administrator Privileges

#req("ADM-001")[An Administrator shall be an adult User Account.]

#req("ADM-002")[An Administrator shall be able to create Services.]

#req("ADM-003")[An Administrator shall be able to edit Rotas.]

#req("ADM-004")[An Administrator shall be able to assign Server Profiles to Position Slots.]

#req("ADM-005")[An Administrator shall be able to remove Server Profiles from Assignments, whether the Assignment was created by an Administrator or accepted from a Volunteer Request.]

#req("ADM-006")[An Administrator shall be able to accept a Volunteer Request submitted for a Position Slot.]

#req("ADM-007")[An Administrator shall be able to delete a Rota from the system.]

= Rota Status and Visibility

#req("STA-001")[The system shall track Position Slot states as open, requested, assigned, declined, or cancelled.]

#req("STA-002")[Until an Administrator accepts a Volunteer Request, the requested Position Slot shall be displayed in a different color.]

#req("STA-003")[The Calendar shall refresh from the database on a timer.]

#req("STA-004")[All users with the page open should be able to see Rota updates as soon as the system has them available.]

#req("STA-005")[The system shall support a household view showing all Assignments for the adult User Account and managed Minor Server Profiles.]

#req("STA-006")[The system should support a read-only public rota view with configurable name display rules.]

= Generated Rotas

#req("GEN-001")[The system shall have an advanced feature for Administrators to generate daily, weekly, or monthly Rotas.]

#req("GEN-002")[The Administrator shall have a separate screen that shows a blank calendar in daily, weekly, or monthly view.]

#req("GEN-003")[The Administrator shall be able to generate a calendar full of Services and Position Slots.]

#req("GEN-004")[The Administrator shall be able to select the date or date range for the generated Rota.]

#req("GEN-005")[Once a date or date range is selected, the Administrator shall be able to review, accept, and publish the generated Rota.]

#req("GEN-006")[The system shall check if any of the days in the range already have Rotas, Services, Position Slots, Assignments, or Volunteer Requests.]

#req("GEN-007")[If there are no existing Rotas, Services, Position Slots, Assignments, or Volunteer Requests for any of the dates in the new Rota, then the generated Rota shall be accepted by the system.]

#req("GEN-008")[If there are existing Rotas, Services, Position Slots, Assignments, or Volunteer Requests in the range, the system shall warn the Administrator.]

#req("GEN-009")[The system may allow the Administrator to override the warning, delete the existing generated items, and write the new Rota.]

= Scheduling Rules

#req("RUL-001")[The generated Rota should use each Server Profile's Role Qualifications.]

#req("RUL-002")[The generated Rota should use each Server Profile's availability.]

#req("RUL-003")[The generated Rota should avoid assigning a Server Profile to more than one Position Slot in the same Service.]

#req("RUL-004")[The generated Rota should avoid assigning a Server Profile to overlapping Services.]

#req("RUL-005")[The generated Rota should attempt to distribute Assignments fairly across qualified and available Server Profiles.]

#req("RUL-006")[The generated Rota should identify Position Slots that could not be filled.]

#req("RUL-007")[The generated Rota should identify assignment-count imbalances across the selected date range.]

#req("RUL-008")[The generated Rota should warn about household conflicts when multiple Server Profiles managed by the same User Account are assigned to overlapping Services.]

#req("RUL-009")[The generated Rota should warn when a Server Profile has been assigned unusually often compared with other qualified and available Server Profiles.]

= Availability

#req("AVL-001")[The system shall support recurring weekly availability for each Server Profile.]

#req("AVL-002")[The system shall use recurring weekly availability when generating the main Rota.]

#req("AVL-003")[The system shall support date-specific availability overrides.]

#req("AVL-004")[Availability overrides may mark a Server Profile as unavailable for a date range.]

#req("AVL-005")[Availability overrides may mark a Server Profile as available for a specific Service or date range outside normal recurring availability.]

#req("AVL-006")[Managing Adults shall be able to manage availability for Minor Server Profiles they manage.]

#req("AVL-007")[Adult User Accounts shall be able to manage availability for their linked Adult Server Profile.]

= Notifications

#req("NOT-001")[The system shall support email notifications in the first release.]

#req("NOT-002")[The system shall notify adult User Accounts when Assignments are created for Server Profiles they manage.]

#req("NOT-003")[The system shall notify adult User Accounts when Volunteer Requests for Server Profiles they manage are accepted or rejected.]

#req("NOT-004")[The system shall send notifications for Minor Server Profiles to the Managing Adult.]

#req("NOT-005")[The notification design shall allow additional notification channels later.]

#req("NOT-006")[The system should support configurable reminder emails before Assignments.]

#req("NOT-007")[Adult User Accounts should be able to configure notification preferences where parish policy allows.]

= Exports and Printing

#req("EXP-001")[The system should support printable Rota output for sacristy or Administrator use.]

#req("EXP-002")[The system should support PDF export of a Rota.]

#req("EXP-003")[The system should support calendar export through iCalendar or `.ics` files for User Accounts.]

= Service Template Management

#req("TPL-001")[Administrators shall be able to create and edit service templates.]

#req("TPL-002")[Service templates shall define default Position Requirements and display order.]

#req("TPL-003")[Service templates should support common liturgical service types such as Sung Mass, Solemn Mass, Requiem Mass, Benediction, and Vespers.]

= Change Record

#req("AUD-001")[The system shall have a record of changes.]

#req("AUD-002")[The record of changes shall contain the name of the User Account, the time of the change, and relevant information about the change.]

#req("AUD-003")[The record of changes shall note whether the User Account was acting as an Administrator.]

#req("AUD-004")[For actions performed on behalf of a Minor Server Profile, the record of changes shall identify both the Minor Server Profile and the Managing Adult User Account that performed the action.]

= Key Workflows

== Adult Volunteering for Self

1. The adult User Account logs in.
2. The User Account opens the Rota.
3. The User Account selects an open Position Slot.
4. The system confirms that the linked Adult Server Profile is qualified for the Position Slot's Role.
5. The system creates a Volunteer Request for the Adult Server Profile.
6. An Administrator accepts or rejects the Volunteer Request.

== Managing Adult Volunteering for a Minor

1. The Managing Adult logs in.
2. The Managing Adult opens the Rota.
3. The Managing Adult selects an open Position Slot.
4. The system asks which managed Minor Server Profile is being volunteered.
5. The system confirms that the selected Minor Server Profile is qualified for the Position Slot's Role.
6. The system creates a Volunteer Request for the Minor Server Profile and records the Managing Adult as the submitting User Account.
7. An Administrator accepts or rejects the Volunteer Request.

== Minor Assignment Decline

1. The Managing Adult logs in.
2. The Managing Adult opens the Rota.
3. The Managing Adult selects an Assignment for a Minor Server Profile managed by that account.
4. The Managing Adult declines the Assignment.
5. The system records the Minor Server Profile, the Managing Adult User Account, and the time of the decline.
6. The Position Slot remains declined until an Administrator reviews it and chooses the replacement path.

== Administrator Adding a Role to a Minor

1. The Administrator opens the Minor Server Profile.
2. The Administrator selects a Role to add.
3. The system adds the Role Qualification to the Minor Server Profile.
4. The system records the Administrator, the Minor Server Profile, the Role Qualification, and the time of the change.

== Administrator Inviting a New Adult

1. The Administrator enters the adult's email address.
2. The system creates a single-use enrollment token.
3. The system sends an enrollment email to the adult.
4. The adult opens the secure enrollment link.
5. The adult creates a User Account.
6. The system records the invitation as used.

== Minor Maturation

1. The Administrator opens a Minor Server Profile that has become an adult.
2. The Administrator enters the former minor's email address.
3. The system creates a single-use maturation invitation token.
4. The system sends the former minor an invitation to create an adult User Account.
5. The former minor accepts the invitation and creates a User Account.
6. The system converts the Minor Server Profile to an Adult Server Profile.
7. The system links the new User Account to the converted Adult Server Profile.
8. The previous Managing Adult no longer manages the converted profile.

== Rota Publication

1. The Administrator generates or manually creates a Rota.
2. The Rota remains in draft, generated, or under review state.
3. The Administrator reviews Services, Position Slots, Assignments, unfilled slots, and warnings.
4. The Administrator publishes the Rota.
5. Adult User Accounts can see the published Rota.
6. The system sends configured notifications.

= Remaining Gaps

- The system still needs final privacy and safeguarding rules for minor name display, contact visibility, consent, and data retention.
- The system still needs final notification opt-out and reminder timing rules.
- The system still needs final public rota visibility rules.
- The system still needs final Auth.js provider selection.
- The recommended first-release self-service workflow still needs formal parish approval: invitation-only enrollment, Administrator-approved volunteer requests, and Administrator review of every decline before a slot is reopened.
