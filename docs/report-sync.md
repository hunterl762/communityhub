# In-game report synchronization

In-game reports previously went only to `fivem_reports`; the website review queue reads `reports`. Migration `024_report_sync.sql` links the two through the unique nullable `reports.fivem_report_id` column and imports historical in-game reports. Original records, IDs, reporter, timestamps, status and assignment are preserved. Existing web reports remain unchanged. The migration also adds the website's dismissed status to the game table.

## Deployment

Back up the database. Pause report submissions while applying migration 024 after migration 023, then deploy the updated backend and restart the website. The script is HeidiSQL/MariaDB 10.4 compatible and can be re-run; it only imports game records that do not have a linked website record. Update the resource's `html/report-tab.js` so its staff review dropdown includes dismissed.

## Behavior

`POST /api/fivem/report` validates subject, details, category and the configured enabled server. It accepts linked active users or unlinked players, retaining the prior unlinked-report behavior. The game server supplies identity and coordinates. Postal is calculated from server-received coordinates using the configured postal dataset; client-supplied postal codes are ignored.

The API inserts the original game record and its website review record in one transaction. It returns `report_id` (game ID) and `website_report_id` (website queue ID) only after both writes commit. A failure leaves neither record committed; the existing NUI retains form text when the API reports failure.

Staff see imported/new reports under **Admin Center → Report Reviews**. The subject, original details, server name and postal are included in the escaped report description. Dashboard totals and pending-review counts use the linked website records automatically.

Website status updates write both records atomically, including review resolution notes on the website. In-game staff updates also write both records. The game report list uses the linked website status as its authoritative status. Existing game administrator permissions and server-bound review restrictions remain intact. Internal website comments and resolution notes are not copied into game payloads.

## Verification

Set `$env:REPORT_TEST_PORT='33319'` to a disposable MariaDB server and run `node tests/report-sync.cjs`. The test creates and drops its own isolated database and exercises migration replay/backfill, API submission to the website review route, two-way status changes, permissions, server isolation, derived postal data and rollback after a failed second write. Run the existing navigation/template and FiveM API/NUI regression tests as well.

If reports still do not appear, check that the website process was restarted after deploying the code and that migration 024 ran in its configured database. A game report's returned website ID identifies its website review entry; the two tables have separate ID sequences. A schema error on the report API now points specifically to migration 024.
