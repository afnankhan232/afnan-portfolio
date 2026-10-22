# afnankhan232.github.io

Custom Portfolio

## Admin workspace

The admin page uses Supabase Auth and row-level security; it does not store login passwords in this repository.

1. Create a Supabase project and create the admin account in **Authentication → Users**. Disable public sign-ups.
2. Confirm that account's UUID is `515b81c9-421d-479b-8fdb-407761b5f384`. The admin UUID is already configured in `admin-config.js` and the SQL policies; update both if Supabase shows a different value. Run `admin-schema.sql` in the Supabase SQL Editor. If you ran an earlier version, rerunning this one safely adds the resume-content column and enables Realtime updates for the settings table.
3. Set `supabaseUrl` and the project's public `anon` key in `admin-config.js`. Never put a `service_role` key or password in this file.
4. Add the deployed site origin to Supabase Auth's allowed URLs.
5. Click **Afnan Khan** in the homepage header, solve the arithmetic check, then sign in at the admin page using the provisioned account's email and password. Manage public project destinations there.

The arithmetic check is only a navigation gate, not authentication. Its passed state persists until the admin signs out; Supabase Auth and the row-level policies protect admin writes. The admin workspace edits project titles, descriptions, technology tags and links, plus resume profile, skills, and five experience milestones. The same milestones feed the filterable `experience.html` career waterfall. Open Projects, Resume, and Experience pages subscribe to database changes and update without a manual refresh. The PDF file itself is unchanged. The other project cards remain unlinked until real destinations are entered in the admin workspace. The public site reads content from `portfolio_settings`; reads are public, while writes are restricted to the configured admin UUID.
