package app.web.convertinghub.official;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class SafDocumentScanner {

    private static final String TAG = "SafDocumentScanner";

    public static class DocumentItem {
        public String id;
        public String uri;
        public String name;
        public String mimeType;
        public String extension;
        public long size;
        public long lastModified;
        public String relativePath;

        public JSONObject toJsonObject() {
            try {
                JSONObject json = new JSONObject();
                json.put("id", id);
                json.put("uri", uri);
                json.put("name", name);
                json.put("mimeType", mimeType);
                json.put("extension", extension);
                json.put("size", size);
                json.put("lastModified", lastModified);
                json.put("relativePath", relativePath);
                return json;
            } catch (Exception e) {
                return new JSONObject();
            }
        }
    }

    public static List<DocumentItem> scanTree(Context context, Uri treeUri) {
        List<DocumentItem> results = new ArrayList<>();
        if (treeUri == null || context == null) return results;

        try {
            ContentResolver resolver = context.getContentResolver();
            String treeDocumentId = DocumentsContract.getTreeDocumentId(treeUri);
            Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, treeDocumentId);

            traverseDirectory(resolver, treeUri, childrenUri, "", results);
        } catch (Exception e) {
            Log.e(TAG, "Failed scanning SAF tree URI: " + treeUri, e);
        }

        return results;
    }

    private static void traverseDirectory(
            ContentResolver resolver,
            Uri treeUri,
            Uri parentChildrenUri,
            String currentPath,
            List<DocumentItem> results
    ) {
        String[] projection = new String[]{
                DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                DocumentsContract.Document.COLUMN_MIME_TYPE,
                DocumentsContract.Document.COLUMN_SIZE,
                DocumentsContract.Document.COLUMN_LAST_MODIFIED
        };

        try (Cursor cursor = resolver.query(parentChildrenUri, projection, null, null, null)) {
            if (cursor == null) return;

            while (cursor.moveToNext()) {
                String docId = cursor.getString(0);
                String displayName = cursor.getString(1);
                String mimeType = cursor.getString(2);
                long size = cursor.isNull(3) ? 0 : cursor.getLong(3);
                long lastModified = cursor.isNull(4) ? 0 : cursor.getLong(4);

                if (displayName == null) continue;

                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mimeType)) {
                    Uri subDirChildrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, docId);
                    traverseDirectory(resolver, treeUri, subDirChildrenUri, currentPath + "/" + displayName, results);
                } else {
                    String ext = getFileExtension(displayName);
                    if (isSupportedFormat(ext, mimeType)) {
                        Uri docUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, docId);
                        
                        DocumentItem item = new DocumentItem();
                        item.id = docUri.toString();
                        item.uri = docUri.toString();
                        item.name = displayName;
                        item.mimeType = mimeType != null ? mimeType : getMimeFromExtension(ext);
                        item.extension = ext;
                        item.size = size;
                        item.lastModified = lastModified;
                        item.relativePath = currentPath + "/" + displayName;

                        results.add(item);
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error traversing directory: " + parentChildrenUri, e);
        }
    }

    public static String getFileExtension(String filename) {
        if (filename == null) return "";
        int dotIdx = filename.lastIndexOf('.');
        return dotIdx >= 0 ? filename.substring(dotIdx + 1).toLowerCase() : "";
    }

    public static boolean isSupportedFormat(String ext, String mimeType) {
        if (ext.equals("pdf") || ext.equals("doc") || ext.equals("docx") ||
            ext.equals("xls") || ext.equals("xlsx") || ext.equals("csv") ||
            ext.equals("ppt") || ext.equals("pptx") || ext.equals("txt") ||
            ext.equals("jpg") || ext.equals("jpeg") || ext.equals("png") || ext.equals("webp")) {
            return true;
        }
        if (mimeType != null) {
            return mimeType.contains("pdf") || mimeType.contains("word") ||
                   mimeType.contains("excel") || mimeType.contains("powerpoint") ||
                   mimeType.contains("spreadsheet") || mimeType.contains("presentation") ||
                   mimeType.contains("text") || mimeType.contains("image");
        }
        return false;
    }

    public static String getMimeFromExtension(String ext) {
        switch (ext) {
            case "pdf": return "application/pdf";
            case "doc": return "application/msword";
            case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls": return "application/vnd.ms-excel";
            case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "csv": return "text/csv";
            case "ppt": return "application/vnd.ms-powerpoint";
            case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "txt": return "text/plain";
            case "jpg": case "jpeg": return "image/jpeg";
            case "png": return "image/png";
            case "webp": return "image/webp";
            default: return "application/octet-stream";
        }
    }

    public static JSONArray toJsonArray(List<DocumentItem> items) {
        JSONArray arr = new JSONArray();
        for (DocumentItem item : items) {
            arr.put(item.toJsonObject());
        }
        return arr;
    }
}
