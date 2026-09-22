# Thunder Client Collection Blueprint

Collection name: **MockSchool API**

Environment:

```text
baseUrl = http://localhost:3000
adminToken = <JWT_TOKEN>
studentToken = <JWT_TOKEN>
mentorToken = <JWT_TOKEN>
studentBToken = <JWT_TOKEN>
mentorBToken = <JWT_TOKEN>
userId = <USER_ID>
mentorId = <MENTOR_ID>
slotId = <SLOT_ID>
bookingId = <BOOKING_ID>
```

For requests marked authenticated, add:

```http
Authorization: Bearer {{tokenVariable}}
```

## 01 Authentication

1. `POST {{baseUrl}}/api/auth/register` — body `{name,email,password,role}`
2. `POST {{baseUrl}}/api/auth/login` — body `{email,password}`
3. `GET {{baseUrl}}/api/auth/profile` — bearer `{{studentToken}}`
4. `GET {{baseUrl}}/api/auth/mentor` — bearer `{{mentorToken}}`
5. `GET {{baseUrl}}/api/auth/admin` — bearer `{{adminToken}}`

## 02 Users

1. `GET {{baseUrl}}/api/users` — bearer `{{adminToken}}`
2. `GET {{baseUrl}}/api/users/{{userId}}` — bearer `{{adminToken}}`
3. `DELETE {{baseUrl}}/api/users/{{userId}}` — bearer `{{adminToken}}`

## 03 Mentors

1. `POST {{baseUrl}}/api/mentors` — bearer `{{mentorToken}}`, body `{expertise,experience,bio,hourlyRate}`
2. `GET {{baseUrl}}/api/mentors`
3. `GET {{baseUrl}}/api/mentors/{{mentorId}}`
4. `PUT {{baseUrl}}/api/mentors/{{mentorId}}` — bearer `{{mentorToken}}`
5. `PATCH {{baseUrl}}/api/mentors/{{mentorId}}/verify` — bearer `{{adminToken}}`, body `{isVerified:true}`

## 04 Slots

1. `POST {{baseUrl}}/api/slots` — bearer `{{mentorToken}}`, body `{date,startTime,endTime}`
2. `GET {{baseUrl}}/api/slots`
3. `GET {{baseUrl}}/api/slots/my-slots` — bearer `{{mentorToken}}`
4. `PUT {{baseUrl}}/api/slots/{{slotId}}` — bearer `{{mentorToken}}`, body `{date,startTime,endTime}`
5. `DELETE {{baseUrl}}/api/slots/{{slotId}}` — bearer `{{mentorToken}}`

## 05 Bookings

1. `POST {{baseUrl}}/api/bookings` — bearer `{{studentToken}}`, body `{slotId}`
2. `GET {{baseUrl}}/api/bookings/my-bookings` — bearer `{{studentToken}}`
3. `GET {{baseUrl}}/api/bookings/{{bookingId}}` — bearer `{{studentToken}}`
4. `PATCH {{baseUrl}}/api/bookings/{{bookingId}}/cancel` — bearer `{{studentToken}}`
5. `GET {{baseUrl}}/api/bookings/mentor-bookings` — bearer `{{mentorToken}}`
6. `PATCH {{baseUrl}}/api/bookings/{{bookingId}}/complete` — bearer `{{mentorToken}}`

## 06 Feedback

1. `POST {{baseUrl}}/api/feedback` — bearer `{{studentToken}}`, body with `bookingId` and three ratings
2. `GET {{baseUrl}}/api/feedback/{{bookingId}}` — bearer `{{studentToken}}`
3. `GET {{baseUrl}}/api/feedback/{{bookingId}}` — bearer `{{mentorToken}}`

## 07 Payments

1. `POST {{baseUrl}}/api/payments/create-order` — bearer `{{studentToken}}`, body `{bookingId}`
2. `POST {{baseUrl}}/api/payments/confirm` — bearer `{{studentToken}}`, body `{bookingId}`

## 08 Dashboard

1. `GET {{baseUrl}}/api/dashboard/student` — bearer `{{studentToken}}`
2. `GET {{baseUrl}}/api/dashboard/mentor` — bearer `{{mentorToken}}`

## 09 Admin

1. `GET {{baseUrl}}/api/admin/dashboard` — bearer `{{adminToken}}`
2. `GET {{baseUrl}}/api/admin/users` — bearer `{{adminToken}}`
3. `GET {{baseUrl}}/api/admin/users?role=student` — bearer `{{adminToken}}`
4. `GET {{baseUrl}}/api/admin/users?search=rahul` — bearer `{{adminToken}}`
5. `GET {{baseUrl}}/api/admin/users/{{userId}}` — bearer `{{adminToken}}`
6. `DELETE {{baseUrl}}/api/admin/users/{{userId}}` — bearer `{{adminToken}}`
7. `GET {{baseUrl}}/api/admin/mentors` — bearer `{{adminToken}}`
8. `GET {{baseUrl}}/api/admin/mentors?verified=true` — bearer `{{adminToken}}`
9. `PATCH {{baseUrl}}/api/admin/mentors/{{mentorId}}/verify` — bearer `{{adminToken}}`, body `{isVerified:true}`
10. `GET {{baseUrl}}/api/admin/bookings` — bearer `{{adminToken}}`
11. `GET {{baseUrl}}/api/admin/bookings?status=completed` — bearer `{{adminToken}}`
12. `GET {{baseUrl}}/api/admin/feedback` — bearer `{{adminToken}}`

