# Habit Tracker (Netlify / browser-local)

Static version of Habit Tracker that stores all data in your browser via `localStorage`. No server or database required.

Compatible CSV export/import with the Flask version (6-column format including color and sort order; older 4-column files still import).

## Try it locally

1. Open `index.html` in your browser (double-click, or drag into a browser window).
2. Or serve the folder with any static file server, for example:
   ```bash
   npx --yes serve .
   ```

Your habits are saved in this browser only. Clearing site data will wipe them — use **Export** for backups.

## Deploy to Netlify

### From this GitHub repo

1. Push the repo to GitHub (includes the `netlify/` folder).
2. In [Netlify](https://app.netlify.com): **Add new site → Import an existing project**.
3. Connect the repo.
4. Build settings:
   - **Base directory:** `netlify`
   - **Build command:** leave empty
   - **Publish directory:** `.` (or leave as default once base is `netlify`)
5. Deploy.

Alternatively, leave base directory empty and set **Publish directory** to `netlify`.

### Drag-and-drop

Zip the contents of this `netlify/` folder (not the parent repo) and drop it on Netlify’s **Deploy manually** page.

## Notes

- Data does not sync across devices or browsers automatically — use Export/Import CSV.
- The Flask/Render app in the repo root is separate and unchanged.
