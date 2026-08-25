/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package app.web.convertinghub.official;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import org.json.JSONArray;
import java.net.URLEncoder;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    private static final String TAG = "ConvertingHubLauncher";
    private static final int REQUEST_CODE_SAF_TREE = 4040;
    private static final String PREFS_NAME = "convertinghub_saf_prefs";
    private static final String KEY_SAF_TREE_URIS = "saf_tree_uris";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;

        Uri dataUri = intent.getData();
        if (dataUri != null && ("request_saf".equals(dataUri.getHost()) || intent.hasExtra("request_saf_folder"))) {
            launchSafFolderPicker();
            return;
        }

        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action) || Intent.ACTION_SEND.equals(action)) {
            Uri fileUri = intent.getData();
            if (fileUri == null && Intent.ACTION_SEND.equals(action)) {
                fileUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
            }
            if (fileUri != null) {
                Log.d(TAG, "Received incoming intent URI: " + fileUri.toString());
            }
        }
    }

    public void launchSafFolderPicker() {
        try {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION |
                           Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
                           Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
            startActivityForResult(intent, REQUEST_CODE_SAF_TREE);
        } catch (Exception e) {
            Log.e(TAG, "Failed launching ACTION_OPEN_DOCUMENT_TREE", e);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_CODE_SAF_TREE && resultCode == RESULT_OK && data != null) {
            Uri treeUri = data.getData();
            if (treeUri != null) {
                try {
                    int takeFlags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    getContentResolver().takePersistableUriPermission(treeUri, takeFlags);

                    savePersistedTreeUri(treeUri.toString());

                    // Scan authorized folder asynchronously
                    new Thread(() -> {
                        List<SafDocumentScanner.DocumentItem> items = SafDocumentScanner.scanTree(this, treeUri);
                        JSONArray jsonArr = SafDocumentScanner.toJsonArray(items);
                        saveScannedMetadataCache(jsonArr.toString());
                    }).start();

                } catch (Exception e) {
                    Log.e(TAG, "Failed obtaining persistable URI permission", e);
                }
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    private void savePersistedTreeUri(String treeUriStr) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        Set<String> set = new HashSet<>(prefs.getStringSet(KEY_SAF_TREE_URIS, new HashSet<>()));
        set.add(treeUriStr);
        prefs.edit().putStringSet(KEY_SAF_TREE_URIS, set).apply();
    }

    private void saveScannedMetadataCache(String jsonStr) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        prefs.edit().putString("latest_scanned_docs_json", jsonStr).apply();
    }

    @Override
    protected Uri getLaunchingUrl() {
        Uri uri = super.getLaunchingUrl();
        Intent intent = getIntent();

        if (intent != null) {
            Uri dataUri = intent.getData();
            if (dataUri != null && ("request_saf".equals(dataUri.getHost()) || intent.hasExtra("request_saf_folder"))) {
                launchSafFolderPicker();
            }

            String action = intent.getAction();
            Uri fileUri = null;
            String mimeType = intent.getType();

            if (Intent.ACTION_VIEW.equals(action) && intent.getData() != null) {
                fileUri = intent.getData();
            } else if (Intent.ACTION_SEND.equals(action)) {
                fileUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
            }

            if (fileUri != null) {
                try {
                    String encodedUri = URLEncoder.encode(fileUri.toString(), "UTF-8");
                    String encodedMime = mimeType != null ? URLEncoder.encode(mimeType, "UTF-8") : "";

                    Uri.Builder builder = uri.buildUpon();
                    builder.appendQueryParameter("open_file_uri", encodedUri);
                    if (!encodedMime.isEmpty()) {
                        builder.appendQueryParameter("intent_mime", encodedMime);
                    }
                    uri = builder.build();
                } catch (Exception e) {
                    Log.w(TAG, "Failed encoding intent URI", e);
                }
            }
        }

        // Attach persisted SAF metadata indicator
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        Set<String> set = prefs.getStringSet(KEY_SAF_TREE_URIS, new HashSet<>());
        if (!set.isEmpty()) {
            Uri.Builder builder = uri.buildUpon();
            builder.appendQueryParameter("saf_active", "1");
            uri = builder.build();
        }

        return uri;
    }
}
