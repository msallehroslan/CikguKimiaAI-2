# Security Specification - Cikgu Kimia

## Data Invariants
1. A user can only access their own profile and memory.
2. A chat message must belong to the authenticated user.
3. Timestamps must be server-validated.
4. User IDs in documents must match the authenticated user.
5. All IDs must be valid strings and not excessively long.

## The "Dirty Dozen" Payloads

### P1: Identity Spoofing (User Profile)
Attempt to create a user profile for a different UID.
```json
{
  "uid": "victim_uid",
  "email": "attacker@evil.com",
  "weakTopics": []
}
```
**Outcome**: `PERMISSION_DENIED`

### P2: State Corruption (Immutable ID)
Attempt to change the `uid` of an existing user profile during update.
```json
{
  "uid": "new_uid",
  "email": "attacker@evil.com"
}
```
**Outcome**: `PERMISSION_DENIED`

### P3: Resource Poisoning (Giant ID)
Attempt to use a document ID containing 10,000 characters.
**Outcome**: `PERMISSION_DENIED` (via `isValidId`)

### P4: Value Poisoning (Invalid Type)
Setting `weakTopics` to a boolean instead of an array.
```json
{
  "weakTopics": true
}
```
**Outcome**: `PERMISSION_DENIED` (via `isValidUser`)

### P5: Field Injection (Shadow Update)
Adding an `isAdmin` field to the user profile profile which isn't in the schema.
```json
{
  "isAdmin": true,
  "weakTopics": ["Redox"]
}
```
**Outcome**: `PERMISSION_DENIED` (via `affectedKeys().hasOnly()`)

### P6: Timestamp Spoofing (User)
Providing a client-side timestamp for `updatedAt` during creation.
```json
{
  "updatedAt": "1990-01-01T00:00:00Z"
}
```
**Outcome**: `PERMISSION_DENIED`

### P7: Orphaned Chat
Attempt to write a chat message with a `userId` that doesn't match the path or auth UID.
```json
{
  "userId": "other_user",
  "role": "user",
  "text": "hack",
  "timestamp": "request.time"
}
```
**Outcome**: `PERMISSION_DENIED`

### P8: Multi-User Scrape (Global List)
Attempt to list all users' history.
**Path**: `/users/{any}/history`
**Outcome**: `PERMISSION_DENIED`

### P9: Role Escalation
Attempt to set `role` to something other than `user` or `model`.
```json
{
  "role": "admin"
}
```
**Outcome**: `PERMISSION_DENIED`

### P10: PII Leak (Unauthorized Read)
Try to read another user's profile.
**Path**: `/users/victim_id`
**Outcome**: `PERMISSION_DENIED`

### P11: DOS Write (Massive Content)
Attempt to send a chat message with 1MB of text.
**Outcome**: `PERMISSION_DENIED` (via `.size()` limits)

### P12: Empty Chat
Attempt to save a chat message with an empty or missing `text` field.
**Outcome**: `PERMISSION_DENIED`
