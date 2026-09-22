# MockSchool Final Backend Test Checklist

Run the requests from [THUNDER_CLIENT_COLLECTION.md](./THUNDER_CLIENT_COLLECTION.md) against a configured local database. Do not put real passwords, JWTs, connection strings, or payment credentials in documentation or exports.

## Authentication

- [ ] Register student — `201`
- [ ] Register mentor — `201`
- [ ] Login student — `200`
- [ ] Login mentor — `200`
- [ ] Login admin — `200`
- [ ] Invalid credentials — `401`
- [ ] Missing credentials — `400`
- [ ] Invalid JWT — `401`
- [ ] Missing JWT — `401`
- [ ] Attempt admin self-registration — `403`

## Users

- [ ] Admin gets all users — `200`, no password fields
- [ ] Admin gets user by ID — `200`
- [ ] Admin deletes an unreferenced user — `200`
- [ ] Student accesses admin user API — `403`
- [ ] Mentor accesses admin user API — `403`
- [ ] Invalid user ID — `400`
- [ ] Referenced user deletion — `409`, no orphan records

## Mentors

- [ ] Mentor creates own profile — `201`
- [ ] Public list returns verified mentors — `200`
- [ ] Get mentor by ID — `200`
- [ ] Mentor updates own profile — `200`
- [ ] Admin verifies/unverifies mentor — `200`
- [ ] Student attempts admin verification — `403`
- [ ] Mentor attempts another mentor's protected update — `404`
- [ ] Invalid mentor ID — `400`
- [ ] Duplicate mentor profile — `409`
- [ ] Invalid expertise/experience/hourlyRate — `400`

## Slots

- [ ] Mentor creates slot — `201`
- [ ] Student creates slot — `403`
- [ ] Get available slots — `200`
- [ ] Mentor gets own slots — `200`
- [ ] Mentor updates own unbooked slot — `200`
- [ ] Booked slot update — `404`, unchanged
- [ ] Mentor deletes own unbooked slot — `200`
- [ ] Booked slot delete — `404`, retained
- [ ] Other mentor updates slot — `404`, unchanged
- [ ] Other mentor deletes slot — `404`, retained
- [ ] Invalid slot ID — `400`
- [ ] Invalid date — `400`
- [ ] Invalid time — `400`
- [ ] End time before start — `400`
- [ ] Overlapping same-mentor slot — `409`
- [ ] Touching non-overlapping slot — `201`

## Bookings

- [ ] Student creates booking — `201`
- [ ] Second booking for same slot — `409`
- [ ] Student gets own bookings — `200`
- [ ] Student gets own booking by ID — `200`
- [ ] Student accesses another student's booking — `404`
- [ ] Student cancels active booking — `200`
- [ ] Cancelled booking cannot be completed — `400`
- [ ] Mentor gets own bookings — `200`
- [ ] Mentor completes own booking — `200`
- [ ] Mentor completes another mentor's booking — `404`
- [ ] Completed booking cannot be cancelled — `400`
- [ ] Invalid booking/slot ID — `400`

## Feedback

- [ ] Completed booking submits feedback — `201`
- [ ] Feedback before completion — `400`
- [ ] Duplicate feedback — `409`
- [ ] Student gets own feedback — `200`
- [ ] Student accesses another student's feedback — `403`
- [ ] Mentor gets own booking feedback — `200`
- [ ] Mentor accesses another mentor's feedback — `403`
- [ ] Unrelated user — `403`
- [ ] Invalid rating — `400`
- [ ] Invalid booking ID — `400`

## Payments

- [ ] Create dummy payment order — `201`
- [ ] Confirm dummy payment — `200`
- [ ] Confirmed booking becomes `paid`
- [ ] Already-paid booking — `400`
- [ ] Cancelled booking — `400`
- [ ] Another student's booking — `404`
- [ ] Invalid booking ID — `400`
- [ ] Client amount field is ignored
- [ ] Client paymentStatus/paymentId fields do not modify the booking
- [ ] Amount in mock order equals stored booking amount

## Dashboards

- [ ] Student dashboard — `200`
- [ ] Mentor dashboard — `200`
- [ ] Student accesses mentor dashboard — `403`
- [ ] Mentor accesses student dashboard — `403`
- [ ] Student dashboard excludes other students
- [ ] Mentor dashboard excludes other mentors
- [ ] Paid earnings include only completed paid bookings

## Admin

- [ ] Admin dashboard — `200`
- [ ] Admin mentor verification — `200`
- [ ] Admin user management — `200`
- [ ] Admin booking overview — `200`
- [ ] Admin feedback overview — `200`
- [ ] Student accesses admin API — `403`
- [ ] Mentor accesses admin API — `403`
- [ ] Unauthenticated admin API — `401`
- [ ] Admin filters users, bookings, and mentors
- [ ] Admin responses exclude passwords

## Security checklist

- [ ] Missing/invalid JWT always returns `401`
- [ ] Wrong role returns `403`
- [ ] Invalid IDs return `400`
- [ ] Missing resources return `404`
- [ ] Duplicate/conflicting operations return `409` where documented
- [ ] Invalid input returns `400`
- [ ] Unexpected errors return generic `500`
- [ ] No response contains passwords
- [ ] No response contains JWT secrets
- [ ] No response contains MongoDB URI or `.env` values
- [ ] No response contains stack traces or filesystem paths
- [ ] No real payment credentials are accepted or returned

