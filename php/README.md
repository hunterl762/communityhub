# CommunityHub PHP deployment to cPanel

This PHP application serves the CommunityHub CMS, LMS, dashboard and `/api/fivem` directly. It does not require Node.js. The existing Node application remains in the repository for rollback. Deploy the contents of the cPanel package, not the entire repository.

## Hosting requirements

PHP 8.2 or newer with PDO MySQL, cURL, OpenSSL, mbstring and fileinfo; Apache-compatible rewriting; MariaDB 10.4 or a compatible MySQL database; outbound HTTPS access to Discord; a valid HTTPS certificate; cPanel cron access. Composer dependencies are bundled in the ZIP, so Composer is not required on the host.

Use cPanel's [MultiPHP Manager](https://docs.cpanel.net/cpanel/software/multiphp-manager-for-cpanel/) to select the installed PHP version for the subdomain. Verify with your provider if the panel offers a different PHP selector.

## Upload and configuration

1. Back up the current database, uploaded documents and website. Keep the current Node deployment available until the PHP deployment passes the cutover checks.
2. Extract `communityhub-cpanel.zip` into a private directory such as `/home/CPANEL_USER/communityhub-php`.
3. Set the document root of `fivem-dashboard.kryndexabot.xyz` to `/home/CPANEL_USER/communityhub-php/public`. Only the **public** directory may be web-accessible. Keep `.env`, `src`, `vendor`, `bin` and `sql` outside the document root. If your provider fixes the document root, ask them to change it or relocate the public files and adjust the entry point's private application path; do not expose the entire application directory.
4. Create a cPanel database and database user with permissions for that database. Import a complete backup of your **existing CommunityHub database** through phpMyAdmin. This preserves users, roles, certifications, reports, API key hashes and other records. The package is an upgrade for the existing V3 schema, not a fresh empty database installer.
5. Run `sql/026_php_runtime.sql` in the imported database. This migration only creates the PHP session and rate-limit tables and is compatible with HeidiSQL/MariaDB 10.4. Your existing V3 schema must already include migrations through 025. Do not rerun unrelated migrations indiscriminately.
6. Copy `.env.example` to `.env` in the private application directory. Enter the cPanel-prefixed database name/user, database password and existing Discord client, guild and bot settings. Keep `.env` private, ideally mode 600. The required URLs are:
   - `BASE_URL=https://fivem-dashboard.kryndexabot.xyz`
   - `DISCORD_CALLBACK_URL=https://fivem-dashboard.kryndexabot.xyz/auth/discord/callback`
7. Add that exact callback URL in the existing Discord application's OAuth2 redirect list. Keep the old callback until rollback is no longer needed. The bot must remain in the community Discord with the permissions required by your role mappings. Members must sign in again because PHP sessions use a separate cookie.
8. Database-stored documents, logos and gallery images migrate with the database. Copy any legacy documents that still live on disk into private `storage/uploads`, or set `UPLOAD_DIR` to their private directory. Never place uploaded documents under `public`.
9. Run the private preflight checker with the host's selected PHP CLI, for example `/usr/local/bin/ea-php84 /home/CPANEL_USER/communityhub-php/bin/preflight.php`. PHP executable paths vary by provider; match the web version.
10. Add a cron job every minute using the same PHP CLI to run `/home/CPANEL_USER/communityhub-php/bin/cron.php`. This maintains offline periods, leave restoration, readiness alerts and session cleanup. Keep cron logs outside the public directory.

## FiveM cutover

Keep existing `Config.ApiKey` and `Config.ServerKey` values: importing the existing database preserves their authentication records. Change only the website base URL in the **server-only** resource configuration:

```lua
Config.ApiBase = "https://fivem-dashboard.kryndexabot.xyz/api/fivem"
```

The package includes the current resource. If upgrading it, back up and preserve your existing `config.lua` and `client/config.lua` values (API keys, server key, postal plugin and keybind settings). The updated HTTP helper includes the configured server key with reads and writes. Restart the resource after switching. Keep API keys out of the client configuration.

## Required cutover checks

- `/health` returns JSON and the public home, news, rules and people pages load over HTTPS.
- Discord sign-in returns to the new domain; the owner account keeps its role and avatar.
- Guests and Discord outsiders cannot access documents, training or calendar records. Reports, ticket conversations and detailed staff files remain private.
- Each FiveM server authenticates with its own key, sends heartbeats and game time, and loads linked profiles and tablet tabs.
- Clock in/out from the website and game shows the same duty session.
- Submit an in-game report with a reported player name; review it on the website and verify the updated status in game.
- Submit and reply to a support ticket from both interfaces. Verify another member cannot read it.
- Complete a test assessment; verify progress, a single certification award and configured completion automation. Do not use production training records for destructive testing.
- Check light/dark/system modes, mobile navigation and the existing duty HUD/postal configuration.
- Confirm cron succeeds and no application exceptions appear in the hosting error log.

Only after these checks should the old site stop accepting writes. Use one active database during cutover; letting two separate database copies accept writes creates divergent records. If reverting, point FiveM back to the original URL and reconcile any new PHP-side data before restoring a backup.

## Development and test limits

The conversion was checked with PHP 8.4 and a separate MariaDB 10.4 database. Local tests stub Discord guild membership only in the test server's `auto_prepend_file`; production never loads that test helper. Real Discord OAuth, the host's Apache configuration, TLS and an actual FiveM client require verification on the deployed host. Run PHP lint, HTTP integration tests and browser checks before changing deployment files.

### Reproducing the HTTP tests

Create a **separate, disposable** MariaDB database named `communityhub_php_test` and import a schema-only export of the current V3 database plus migration 026. The seed script truncates that test database; never configure it against production. Install the repository's Node test dependencies with its lockfile. Set `PHP_TEST_DB_PORT`, optionally `PHP_TEST_DB_USER`/`PHP_TEST_DB_PASSWORD`, and `PHP_TEST_FIXTURES` to a private absolute JSON path. Run `node php/tests/seed.cjs` from the repository.

Create a private PHP test environment file with `APP_ENV=testing`, the same disposable database connection, `BASE_URL=http://127.0.0.1:3021`, `DISCORD_GUILD_ID=test` and `DISCORD_BOT_TOKEN=test-only`. Point `COMMUNITYHUB_ENV` to it, then start:

```text
php -d auto_prepend_file=php/tests/prepend.php -S 127.0.0.1:3021 -t php/public php/router.php
node php/tests/integration.cjs
```

The preview and tests must run on loopback. Never configure `auto_prepend_file` on the production host. The cPanel package excludes the entire test directory and all test fixtures. The Lua transport regression test is `tests/fivem-http.lua`; other existing Node regression tests remain available for rollback compatibility.
