# Riverbend form emails: one-time setup (about 10 minutes)

This replaces the FormSubmit emails with a clean Riverbend-branded email sent from your own Gmail. No ads. It also saves logos to Google Drive and logs every lead in a Google Sheet.

Do all of this while signed in to **riverbendwebco@gmail.com**.

1. Go to **script.new** in your browser. A blank Google Apps Script project opens.
2. Click "Untitled project" at the top and rename it **Riverbend Forms**.
3. Delete everything in the code box, then paste in the full contents of `Code.gs` from this folder. Press **Ctrl+S** (Cmd+S on Mac) to save.
4. In the function dropdown at the top (next to "Debug"), pick **sendTestEmail**, then click **Run**.
   - Google will ask for permission. Click **Review permissions**, choose riverbendwebco@gmail.com.
   - You'll see "Google hasn't verified this app". That's normal for your own script. Click **Advanced**, then **Go to Riverbend Forms (unsafe)**, then **Allow**.
   - Check your inbox: you should get a sample "New lead: Donut Brothers (test)" email. A "Riverbend Leads" folder and sheet also appear in your Google Drive.
5. Click the blue **Deploy** button (top right), then **New deployment**.
   - Click the gear next to "Select type" and choose **Web app**.
   - Description: `Riverbend forms`
   - Execute as: **Me (riverbendwebco@gmail.com)**
   - Who has access: **Anyone**
   - Click **Deploy**.
6. Copy the **Web app URL** (it starts with `https://script.google.com/macros/s/` and ends with `/exec`) and send it to Claude. Claude puts it in the site, and the new emails go live.

## If you edit Code.gs later
Click **Deploy**, then **Manage deployments**, then the pencil icon. Set Version to **New version** and click **Deploy**. The URL stays the same.

## Permissions it uses
- Send email as you (to send the lead emails to you)
- Google Drive (to save logos and signatures in the "Riverbend Leads" folder)
- Google Sheets (to log leads in the "Riverbend Leads" sheet)

It only ever emails riverbendwebco@gmail.com. It never emails customers.
