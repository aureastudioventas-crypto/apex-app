import fs from 'node:fs';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
const scheme = 'apex';
const host = 'auth-callback';

if (!fs.existsSync(manifestPath)) throw new Error(`Android manifest not found: ${manifestPath}`);

let manifest = fs.readFileSync(manifestPath, 'utf8');
if (manifest.includes(`android:scheme="${scheme}"`) && manifest.includes(`android:host="${host}"`)) {
  console.log('APEX auth deep link already configured.');
  process.exit(0);
}

const activityPattern = /(<activity\b[^>]*android:name="\.MainActivity"[^>]*>)/;
if (!activityPattern.test(manifest)) throw new Error('MainActivity declaration not found in AndroidManifest.xml');

const intentFilter = `\n            <!-- APEX Supabase Auth deep link -->\n            <intent-filter>\n                <action android:name="android.intent.action.VIEW" />\n                <category android:name="android.intent.category.DEFAULT" />\n                <category android:name="android.intent.category.BROWSABLE" />\n                <data android:scheme="${scheme}" android:host="${host}" />\n            </intent-filter>`;

manifest = manifest.replace(activityPattern, `$1${intentFilter}`);
fs.writeFileSync(manifestPath, manifest);
console.log(`Configured ${scheme}://${host}/ deep link in ${manifestPath}`);
