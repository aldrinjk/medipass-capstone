# App data ownership

Clinical source of truth: HAPI FHIR R4.

App DB core tables:
- app_user
- refresh_token
- sharing_preference
- emergency_pass
- emergency_pass_scope
- pass_access_log

Use UUID primary keys and UTC timestamps.
