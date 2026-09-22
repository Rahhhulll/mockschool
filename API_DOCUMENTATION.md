# MockSchool API Documentation

Base URL:

```text
http://localhost:3000
```

Use placeholders only:

```text
<JWT_TOKEN>
<USER_ID>
<MENTOR_ID>
<SLOT_ID>
<BOOKING_ID>
```

Authenticated requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

JSON requests use:

```http
Content-Type: application/json
```

## Authentication

| Method | Endpoint | Role | Purpose | Success |
|---|---|---|---|---|
| POST | `/api/auth/register` | None | Register a student or mentor | 201 |
| POST | `/api/auth/login` | None | Login and receive a JWT | 200 |
| GET | `/api/auth/profile` | Any authenticated user | Read JWT profile claims | 200 |
| GET | `/api/auth/admin` | admin | Verify admin access | 200 |
| GET | `/api/auth/mentor` | mentor | Verify mentor access | 200 |

### Register

```json
{
  "name": "Student One",
  "email": "student@example.com",
  "password": "secret123",
  "role": "student"
}
```

`role` may be `student` or `mentor`. `admin` cannot be self-assigned.

Errors: `400` validation, `403` admin self-assignment, `409` duplicate email.

### Login

```json
{
  "email": "student@example.com",
  "password": "secret123"
}
```

Returns a JWT and user summary. Passwords are never returned.

Errors: `400` missing fields, `401` invalid credentials.

## Users

All user-management endpoints require `authMiddleware` and `admin`.

| Method | Endpoint | Purpose | Success | Errors |
|---|---|---|---:|---|
| GET | `/api/users` | List users | 200 | 401, 403, 500 |
| GET | `/api/users/<USER_ID>` | Get a user | 200 | 400, 401, 403, 404 |
| DELETE | `/api/users/<USER_ID>` | Delete a safe, unreferenced user | 200 | 400, 401, 403, 404, 409 |

Passwords are excluded. Deletion is refused with `409` when mentor, booking, or feedback records reference the user.

## Mentors

| Method | Endpoint | Role | Purpose | Success |
|---|---|---|---|---:|
| POST | `/api/mentors` | mentor | Create own mentor profile | 201 |
| GET | `/api/mentors` | None | List verified mentors | 200 |
| GET | `/api/mentors/<MENTOR_ID>` | None | Get a mentor | 200 |
| PUT | `/api/mentors/<MENTOR_ID>` | mentor | Update own mentor profile | 200 |
| PATCH | `/api/mentors/<MENTOR_ID>/verify` | admin | Verify or unverify a mentor | 200 |
| GET | `/api/admin/mentors` | admin | List all mentor profiles | 200 |
| GET | `/api/admin/mentors?verified=true` | admin | List verified profiles | 200 |
| GET | `/api/admin/mentors?verified=false` | admin | List unverified profiles | 200 |

Create/update body:

```json
{
  "expertise": ["JavaScript", "MongoDB"],
  "experience": 5,
  "bio": "Backend mentor",
  "hourlyRate": 750
}
```

`expertise` must be a non-empty string array. `experience` must be non-negative. `hourlyRate` must be positive.

Verify body:

```json
{
  "isVerified": true
}
```

Errors: `400` invalid body or ID, `401`, `403`, `404`, `409` duplicate profile, `500`.

## Slots

| Method | Endpoint | Role | Purpose | Success |
|---|---|---|---|---:|
| POST | `/api/slots` | mentor | Create own slot | 201 |
| GET | `/api/slots` | None | List available slots | 200 |
| GET | `/api/slots/my-slots` | mentor | List own slots | 200 |
| PUT | `/api/slots/<SLOT_ID>` | mentor | Update own unbooked slot | 200 |
| DELETE | `/api/slots/<SLOT_ID>` | mentor | Delete own unbooked slot | 200 |

Create/update body:

```json
{
  "date": "2099-01-10",
  "startTime": "10:00",
  "endTime": "11:00"
}
```

Dates use `YYYY-MM-DD`; times use `HH:mm`. Dates/times cannot be in the past and `endTime` must be after `startTime`. Same-mentor overlapping slots return `409`.

Errors: `400` invalid input or ID, `401`, `403`, `404` ownership/booked conflict, `409` overlap, `500`.

## Bookings

| Method | Endpoint | Role | Purpose | Success |
|---|---|---|---|---:|
| POST | `/api/bookings` | student | Atomically book an available slot | 201 |
| GET | `/api/bookings/my-bookings` | student | List own bookings | 200 |
| GET | `/api/bookings/<BOOKING_ID>` | student | Get own booking | 200 |
| PATCH | `/api/bookings/<BOOKING_ID>/cancel` | student | Cancel own active booking | 200 |
| GET | `/api/bookings/mentor-bookings` | mentor | List bookings for own mentor profile | 200 |
| PATCH | `/api/bookings/<BOOKING_ID>/complete` | mentor | Complete own assigned booking | 200 |

Create body:

```json
{
  "slotId": "<SLOT_ID>"
}
```

Booking creation sets `paymentStatus` to `pending` and uses an atomic `isBooked: false` update. A second booking returns `409`.

Cancellation sets booking status to `cancelled` and makes the slot available. Completed bookings cannot be cancelled. Cancelled bookings cannot be completed.

Errors: `400` invalid ID or state, `401`, `403`, `404` ownership/not found, `409` unavailable slot, `500`.

## Feedback

| Method | Endpoint | Role | Purpose | Success |
|---|---|---|---|---:|
| POST | `/api/feedback` | student | Submit feedback for own completed booking | 201 |
| GET | `/api/feedback/<BOOKING_ID>` | student or mentor | Read feedback for an owned booking | 200 |

Create body:

```json
{
  "bookingId": "<BOOKING_ID>",
  "technicalRating": 5,
  "communicationRating": 4,
  "confidenceRating": 5,
  "strengths": "Clear explanations",
  "weaknesses": "More practice time would help",
  "overallFeedback": "Very useful session"
}
```

Ratings must be numbers from 1 through 5. The booking must belong to the student and be `completed`. Duplicate feedback returns `409`.

Student access is restricted by `booking.studentId`. Mentor access is restricted by the authenticated mentor profile and `booking.mentorId`.

Errors: `400` invalid ID/rating/state, `401`, `403` ownership denial, `404`, `409` duplicate feedback, `500`.

## Payments (dummy flow)

| Method | Endpoint | Role | Purpose | Success |
|---|---|---|---|---:|
| POST | `/api/payments/create-order` | student | Create a mock payment order | 201 |
| POST | `/api/payments/confirm` | student | Mark own confirmed booking paid | 200 |

Body for both:

```json
{
  "bookingId": "<BOOKING_ID>"
}
```

The amount comes from `Booking.amount`; clients cannot set `amount`, `paymentStatus`, or `paymentId`. The booking must belong to the authenticated student, have status `confirmed`, and not already be paid.

Errors: `400` invalid ID/state/already paid, `401`, `403`, `404` not found or not owned, `500`.

## Dashboards

| Method | Endpoint | Role | Purpose | Success |
|---|---|---|---|---:|
| GET | `/api/dashboard/student` | student | Own booking and feedback summary | 200 |
| GET | `/api/dashboard/mentor` | mentor | Own interviews, paid earnings, and ratings | 200 |

No body or query parameters are required. Data is always scoped from the JWT and resolved mentor profile.

## Admin

All `/api/admin/*` endpoints require `authMiddleware` and `admin`.

| Method | Endpoint | Purpose | Success |
|---|---|---|---:|
| GET | `/api/admin/dashboard` | Platform counts, payments, and feedback summary | 200 |
| GET | `/api/admin/users` | List users | 200 |
| GET | `/api/admin/users?role=student` | Filter users by role | 200 |
| GET | `/api/admin/users?search=rahul` | Search name/email | 200 |
| GET | `/api/admin/users/<USER_ID>` | Get user | 200 |
| DELETE | `/api/admin/users/<USER_ID>` | Safely delete unreferenced user | 200 |
| GET | `/api/admin/mentors` | List mentors | 200 |
| PATCH | `/api/admin/mentors/<MENTOR_ID>/verify` | Verify/unverify mentor | 200 |
| GET | `/api/admin/bookings` | List all bookings | 200 |
| GET | `/api/admin/bookings?status=completed` | Filter bookings | 200 |
| GET | `/api/admin/feedback` | List feedback and rating statistics | 200 |

Admin errors commonly include `400`, `401`, `403`, `404`, `409`, and `500`.

## Complaint status

No Complaint model, controller, or route currently exists. Complaint APIs are not documented or exposed. A future complaint model should be designed before adding `/api/admin/complaints`.

