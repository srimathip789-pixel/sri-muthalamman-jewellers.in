# 🚨 Site Recovery & Backup Guide
**Sri Muthalamman Jewellers**

This guide explains how to protect your website code and restore it if the site is ever "destroyed" or broken.

## 1. How to create a Backup (Standard Procedure)
The best way to protect your site is to create regular backups of the source code.
1. Open your terminal in the project folder.
2. Run the following command:
   ```bash
   npm run backup
   ```
3. A new folder named `backups/` will be created.
4. Inside, you will find a zipped file like: `Sri_Muthalamman_Jewellers_Backup_2026-02-25.zip`.
5. **Important:** Move this `.zip` file to your Google Drive or an external pendrive for safety.

## 2. Emergency Recovery (Site is "Distorted" or Broken)
If you made a change and the site looks bad or doesn't load, use these two methods:

### Method A: Vercel Instant Rollback (Fastest)
Vercel keeps a history of every single deployment.
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click on your project **"sm-jewels-madurai-final"**.
3. Go to the **"Deployments"** tab.
4. Find a version from yesterday (or the last time it was working).
5. Click the three dots `...` and select **"Rollback"**.
6. The site will revert to that version in 30 seconds.

### Method B: Git Restore
If you accidentally deleted files in your local folder:
1. Run this command to revert all local changes to the last successful commit:
   ```bash
   git checkout .
   ```

### Method C: Restore from ZIP Backup
1. Delete the broken files in your web folder.
2. Find your latest `.zip` file in the `backups/` folder.
3. Extract (Unzip) the content back into your main project folder.
4. Re-deploy the fixed version:
   ```bash
   npx vercel --prod
   ```

## 3. Contact for Support
If the entire site is down and you cannot log in to Vercel, please provide your **Github Repository URL** to your developer to perform a full system reconstruction.
