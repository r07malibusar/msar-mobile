# Walkthrough - Responding Times (`promised_time` & `stated_time`)

Full overview of code changes on branch `responding-times` implementing `response_time_mode` (`promised_time` vs `stated_time`), response time offsets, start/end timestamps, and Response/Log tab display logic based on `is_attending`.

---

## File-by-File Code Review

### 1. `src/types/calloutResponse.ts`
[calloutResponse.ts](file:///Users/daniel/IdeaProjects/msar-mobile/src/types/calloutResponse.ts)
* **Changes**:
  - Added optional `start_time?: string | null` and `end_time?: string | null` properties to the `calloutResponse` interface for sending payload variables in response mutations.

---

### 2. `src/types/operationalPeriod.ts`
[operationalPeriod.ts](file:///Users/daniel/IdeaProjects/msar-mobile/src/types/operationalPeriod.ts)
* **Changes**:
  - Added optional `start_time?: Date`, `end_time?: Date`, `signed_in_at?: Date`, `signed_out_at?: Date`, `created_at?: Date`, and `updated_at?: Date` properties to `opResponse`.

---

### 3. `src/types/logEntry.ts`
[logEntry.ts](file:///Users/daniel/IdeaProjects/msar-mobile/src/types/logEntry.ts)
* **Changes**:
  - Added optional `start_time?: Date` and `end_time?: Date` properties to `logEntry`.
  - Updated `logEntryFromRespsonse` to parse string dates into `Date` objects.

---

### 4. `src/types/callout.ts`
[callout.ts](file:///Users/daniel/IdeaProjects/msar-mobile/src/types/callout.ts)
* **Changes**:
  - Updated `calloutFromResponse` to convert response timestamps (`start_time`, `end_time`, `signed_in_at`, `signed_out_at`, `created_at`, `updated_at`) into `Date` objects on every operational period response item.

---

### 5. `src/remote/api.ts`
[api.ts](file:///Users/daniel/IdeaProjects/msar-mobile/src/remote/api.ts)
* **Changes**:
  - Updated `apiRespondToCallout(id, response, startTime, endTime)` to accept optional `startTime` and `endTime` parameters and include `start_time` and `end_time` in the `POST /api/callouts/{id}/respond/` request body.

---

### 6. `src/components/inputs/LargeButton.tsx`
[LargeButton.tsx](file:///Users/daniel/IdeaProjects/msar-mobile/src/components/inputs/LargeButton.tsx)
* **Changes**:
  - Added optional `onLongPress?: () => void` prop to `LargeButton` and passed it to the underlying `TouchableOpacity` to handle long-press gestures.

---

### 7. `src/components/modals/CalloutRespondModal.tsx`
[CalloutRespondModal.tsx](file:///Users/daniel/IdeaProjects/msar-mobile/src/components/modals/CalloutRespondModal.tsx)
* **Changes**:
  - Keys off `is_attending` from `useCalloutResponsesAvailableQuery()` data.
  - **`promised_time` Mode**:
    - **Short Press on Attending (`is_attending === true`)**: Sends `start_time: null` (no delay offset).
    - **Long Press on Attending (`is_attending === true`)**: Opens **Estimated Arrival** overlay (`+15 min`, `+30 min`, `+45 min`, `+1 hr`). Selecting an offset sends `start_time = now + offset`.
    - **Press on Non-Attending (`is_attending === false`)**: Sends `end_time = now`.
  - **`stated_time` Mode**:
    - Displays a Date & Time picker (defaults to current time).
    - **Press on Attending (`is_attending === true`)**: Sends `start_time = statedDateTime`.
    - **Press on Non-Attending (`is_attending === false`)**: Sends `end_time = statedDateTime`.

---

### 8. `src/components/fields/PersonnelField.tsx`
[PersonnelField.tsx](file:///Users/daniel/IdeaProjects/msar-mobile/src/components/fields/PersonnelField.tsx)
* **Changes**:
  - Uses `useCalloutResponsesAvailableMap()` to check `is_attending` for each response code.
  - **`promised_time` Mode**:
    - Displays `"Est. Arrival: hh:mm AM/PM"` **only** when `start_time` is set (long press delay offset). Short press (`start_time: null`) displays no badge.
  - **`stated_time` Mode**:
    - **Attending**: Displays `"Arrival: MM/DD hh:mm AM/PM"`.
    - **Non-Attending**: Displays `"Arrival: MM/DD hh:mm AM/PM - End: hh:mm AM/PM"` when both `start_time` and `end_time` are present.

---

### 9. `src/components/fields/log/LogResponseField.tsx`
[LogResponseField.tsx](file:///Users/daniel/IdeaProjects/msar-mobile/src/components/fields/log/LogResponseField.tsx)
* **Changes**:
  - Appends `(Arrival: hh:mm AM/PM)` or `(End Time: hh:mm AM/PM)` to log response entry text when `startTime` or `endTime` is present.

---

### 10. `src/components/callouts/CalloutPersonnelTab.tsx`
[CalloutPersonnelTab.tsx](file:///Users/daniel/IdeaProjects/msar-mobile/src/components/callouts/CalloutPersonnelTab.tsx)
* **Changes**:
  - Queries `response_time_mode` for the active callout's operation type from `useOperationTypesAvailableQuery()` and passes `responseTimeMode` to each `<PersonnelField ... />`.

---

### 11. `src/components/callouts/CalloutLogTab.tsx`
[CalloutLogTab.tsx](file:///Users/daniel/IdeaProjects/msar-mobile/src/components/callouts/CalloutLogTab.tsx)
* **Changes**:
  - Passes `startTime={item.start_time}` and `endTime={item.end_time}` to `<LogResponseField ... />`.

---

### 12. `src/app/(app)/view-callout.tsx`
[view-callout.tsx](file:///Users/daniel/IdeaProjects/msar-mobile/src/app/(app)/view-callout.tsx)
* **Changes**:
  - Queries `response_time_mode` for the active callout's operation type using `useOperationTypesAvailableQuery()`.
  - Passes `responseTimeMode` to `<CalloutRespondModal ... />`.
  - Includes `start_time` and `end_time` in `calloutResponseMutation`.

---

## Verification

* **TypeScript Compilation**: Executed `npm run ts:check` — 0 type errors.
* **Linter**: Executed `npm run lint` — 0 warnings/errors.
