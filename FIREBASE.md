# Firebase Setup

The website is public. Families and scholars do not need to sign in.

Teacher edit mode requires both:

- PIN `2213`
- Google sign-in as `davisg230@gmail.com` or `lvest1@crossroadsschoolskc.org`

Firestore Security Rules still enforce access, so hiding buttons is not the only protection.

## Firestore Data Structure

Editable card documents live in the public-read collection below:

```text
gameHubCards/{cardId}
```

Example card document:

```json
{
  "title": "Module 1",
  "description": "Math game placeholder for this module.",
  "icon": "+",
  "updatedAt": "<server timestamp>",
  "updatedBy": "davisg230@gmail.com"
}
```

Current card IDs use this pattern:

```text
CKLA Skills:unit-1
CKLA Skills:unit-2
Eureka Math:module-1
Eureka Math:module-2
```

Teacher edit logs live in this private teacher-only collection:

```text
gameHubTeacherLogs/{autoId}
```

Example log document:

```json
{
  "action": "update-card",
  "cardKey": "Eureka Math:module-1",
  "email": "davisg230@gmail.com",
  "timestamp": "<server timestamp>"
}
```

Private rosters live in this teacher-owned collection:

```text
gameHubScholars/{autoId}
```

Example scholar document:

```json
{
  "active": true,
  "createdAt": "<server timestamp>",
  "firstName": "Jordan",
  "firstNameKey": "jordan",
  "lastName": "Smith",
  "lastNameKey": "smith",
  "teacherEmail": "lvest1@crossroadsschoolskc.org",
  "updatedAt": "<server timestamp>"
}
```

Game results live in this collection:

```text
gameHubResultSubmissions/{autoId}
```

Independent scholar play submits a first-name-only unassigned result:

```json
{
  "mode": "individual-complete",
  "teacherEmail": "unassigned",
  "scholarFirstName": "Jordan",
  "scholarFirstNameKey": "jordan",
  "gameId": "ckla-unit-1-word-builder-blast",
  "completedAt": "<server timestamp>",
  "score": 13,
  "totalQuestions": 15,
  "attempts": 18,
  "missedQuestions": [
    {
      "questionIndex": 3,
      "word": "NECK",
      "incorrectSelections": ["nick"],
      "correctAnswer": "neck"
    }
  ]
}
```

Whole Class Mode saves only assigned misses to the teacher name used to start class mode:

```json
{
  "mode": "whole-class-miss",
  "teacherEmail": "davisg230@gmail.com",
  "scholarId": null,
  "scholarDisplayName": "JS",
  "gameId": "ckla-unit-1-word-builder-blast",
  "word": "NECK",
  "incorrectSelection": "nick",
  "correctAnswer": "neck",
  "completedAt": "<server timestamp>"
}
```

## Firestore Rules

Use the rules in `firestore.rules`. They allow:

- public read access only to `gameHubCards`
- create/update/delete access on `gameHubCards` only for authorized teacher accounts
- teacher-only create/read/delete access on `gameHubTeacherLogs`
- authorized teachers to read/list both private rosters, while only deleting scholars from their own roster
- public visitors to create tightly validated first-name-only game result submissions
- public visitors to create tightly validated Whole Class Mode misses with teacher email and typed initials only
- teachers to read their own results plus unassigned first-name submissions that can be privately matched to their roster
- teachers to save Whole Class Mode misses only for scholars in their own roster
- no access to any other collection
