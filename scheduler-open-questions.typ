#set document(title: "Altar Server Rota System Open Questions", author: "St. John Henry Newman Server Guild")
#set page(paper: "us-letter", margin: 1in)
#set text(font: "Libertinus Serif", size: 11pt)
#set heading(numbering: "1.")

#align(center)[
  #v(0.75in)
  #image("CoatOfArms.png", width: 30%)
  #v(0.45in)
  #text(size: 24pt, weight: "bold")[Altar Server Rota System]
  #v(0.15in)
  #text(size: 16pt)[Open Questions and Policy Decisions]
  #v(0.35in)
  #text(size: 12pt)[St. John Henry Newman Server Guild]
  #v(0.1in)
  #text(size: 10pt)[Draft]
]

#pagebreak()

= Resolved Since Last Review

The following decisions have been made and are now reflected in the requirements and technical design:

- Only a parent or guardian User Account may create a Minor Server Profile.
- The User Account that creates a Minor Server Profile becomes the Managing Adult.
- Date of birth is mandatory for every Server Profile.
- The system will use date of birth to identify Minor Server Profiles eligible for maturation.
- Notification opt-out and reminder timing remain TBD.
- Public rota visibility remains TBD.
- Initial Auth.js provider selection remains TBD.
- The proposed first user-facing workflow is invitation-only enrollment, a household view, availability management, Assignment declines, and Administrator-approved Volunteer Requests. It remains subject to parish approval.

= Product and Policy TBDs

== Privacy and Safeguarding

- What name format should be shown for minors on normal authenticated rota views?
- What name format should be shown for minors on any public or read-only rota view?
- Should minor names ever be visible to adults who are not Administrators and are not the Managing Adult?
- Which users may see adult contact information?
- Which users may see minor profile details?
- Which users may see parent or guardian contact information?
- Should Administrators be able to export contact information?
- What consent must be recorded before a Minor Server Profile is created?
- Should consent be renewed periodically?
- How long should inactive minor profiles and contact details be retained?
- Who may view audit records involving minors?

== Public Rota Visibility

- Should a public rota exist at all?
- If public rota access exists, should it require a shared link, parish login, or no authentication?
- Should public rota views show full names, first name and last initial, initials, or role counts only?
- Should public rota views include service times and locations?
- Should public rota views include unfilled slots?
- Should public rota links expire?

== Notifications

- Which notification events are mandatory?
- Which notification events may users opt out of?
- Should assignment reminders be mandatory for parents or optional?
- What default reminder timing should be used?
- Should reminders be sent once or multiple times?
- Should Administrators receive notification failure alerts?
- Should email replies be monitored, ignored, or routed to an Administrator address?

== Authentication Providers

- Which Auth.js provider should be enabled first?
- Should local username/password accounts be supported?
- Should Google login be supported?
- Should Microsoft or Entra ID login be supported?
- Should email magic-link login be supported?
- Should users be allowed to link multiple external providers to the same User Account?

== Minor Profile Creation

- What confirmation should a parent or guardian provide when creating a Minor Server Profile?
- Should an Administrator review or approve newly created Minor Server Profiles before they can be scheduled?
- Should newly created Minor Server Profiles default to inactive until an Administrator adds Role Qualifications?
- Can a parent or guardian edit a minor's name and date of birth after creation, or does that require Administrator help?

== Maturation

- Should the system automatically notify Administrators when a minor turns 18?
- Should the Managing Adult be notified before maturation is started?
- What happens if the former minor does not accept the maturation invitation?
- Should a matured adult retain the same availability settings?
- Should a matured adult retain all Role Qualifications automatically?

== Rota Publication

- Should publishing a Rota always send notifications?
- Can an Administrator make silent changes to a published Rota?
- Should changes to a published Rota create a visible revision history?
- Should replacement of a published Rota require confirmation from a second Administrator?

== Substitutions

- Recommended first-release policy: when an Assignment is declined, keep the Position Slot in a visible `declined` state pending Administrator review; do not automatically change it to an ordinary open slot.
- Should the original assigned Server Profile remain visible as declined?
- Recommended first-release policy: Administrators approve every Volunteer Request and substitution; users do not self-assign or replace an Assignment.
- Can a parent volunteer one managed minor as a substitute for another managed minor's declined Assignment?

== User Self-Service Scope

- Recommended first-release policy: adult accounts are invitation-only; open self-registration is excluded.
- Recommended first-release policy: a household view shows the adult's own linked Server Profile and Minor Server Profiles that adult manages.
- Recommended first-release policy: a user may edit recurring availability and date-specific availability overrides for profiles it manages.
- Recommended first-release policy: availability notes are optional and visible only to Administrators.
- Should a user be able to edit basic profile information, or should names and dates of birth require Administrator assistance after enrollment?

== Service Templates and Liturgical Data

- Which service templates should ship with the first release?
- Should templates distinguish clergy/sacred ministers from altar server positions?
- Should Celebrant, Deacon, and Subdeacon be represented in this system or excluded from server scheduling?
- When should `calendarium-romanum` integration be introduced?
- Should liturgical color be manually entered until calendar integration exists?

== Scheduling Fairness

- What date range should fairness calculations use?
- Should some Roles count more heavily than others?
- Should last-minute substitutions affect fairness calculations?
- Should the scheduling engine prefer training progression for newer servers?
- Should household balancing be a hard rule, a warning, or ignored unless services overlap?

== Deployment and Operations

- Who will operate the first production deployment?
- Should the first deployment target a VPS with Docker Compose, as currently recommended?
- What backup frequency is required?
- Who receives backup or application failure alerts?
- What is the expected recovery process if the VPS or database fails?

= Technical TBDs

- Choose the initial Auth.js provider or providers.
- Decide whether local credentials are enabled.
- Decide whether notification delivery uses SMTP directly or an email provider API.
- Decide whether PDF generation is server-rendered HTML, Typst, or another library.
- Decide whether `.ics` export is a downloadable file, a private subscription URL, or both.
- Decide whether Rota generation remains synchronous in the first release or uses a background worker.
- Decide exact Prisma schema constraints for one active Assignment per Position Slot.
- Decide exact transaction boundaries for publishing and replacing Rotas.
- Decide how token expiration cleanup is performed.
- Decide whether audit events store before/after snapshots or summaries only.

= Suggested Next Decisions

The highest-value next decisions are:

1. Approve or amend the proposed self-service and substitution policies above.
2. Public rota visibility rules.
3. Minor name and contact visibility rules.
4. Initial Auth.js provider.
5. Reminder timing and opt-out rules.
