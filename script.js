// =======================================================
// REQUIRED: set these two values from your Cloudinary account
// =======================================================
const CLOUD_NAME = "francistagbo";
const UPLOAD_PRESET = "wedding";

// Optional: tweak limits for guests
const MAX_FILES_PER_BATCH = 25;            // widget maxFiles
const MAX_FILE_SIZE_BYTES = 25 * 1000 * 10000; // 25 MB client-side limit

// =======================================================
// UI helpers
// =======================================================
const galleryEl = document.getElementById("gallery");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function updateCount() {
  const n = galleryEl.children.length;
  countEl.textContent = `${n} item${n === 1 ? "" : "s"}`;
}

function pickPreviewUrl(info) {
  // Some responses include thumbnail_url; if not, fall back to secure_url/url.
  return info.thumbnail_url || info.secure_url || info.url || "";
}

function renderCard(info) {
  const resourceType = info.resource_type || "image";
  const publicId = info.public_id || "(unknown public_id)";
  const format = info.format || "";
  const bytes = typeof info.bytes === "number" ? info.bytes : null;

  const openUrl = info.secure_url || info.url || "";
  const previewUrl = pickPreviewUrl(info);

  const card = document.createElement("article");
  card.className = "card";

  let preview;
  if (resourceType === "video") {
    preview = document.createElement("video");
    preview.className = "preview";
    preview.controls = true;
    preview.src = openUrl;
  } else {
    preview = document.createElement("img");
    preview.className = "preview";
    preview.alt = publicId;
    preview.loading = "lazy";
    preview.src = previewUrl || openUrl;
  }

  const meta = document.createElement("div");
  meta.className = "meta";

  const sizeText =
    bytes == null ? "" : ` · ${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  meta.innerHTML = `
    <div class="meta-title">${publicId}</div>
    <div class="meta-sub">${resourceType}${format ? ` · ${format}` : ""}${sizeText}</div>
    <div class="meta-actions">
      <button class="btn btn-small" type="button" data-copy="${encodeURIComponent(openUrl)}">Copy URL</button>
      <a class="btn btn-small btn-outline" href="${openUrl}" target="_blank" rel="noreferrer">Open</a>
    </div>
  `;

  card.appendChild(preview);
  card.appendChild(meta);
  return card;
}

galleryEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-copy]");
  if (!btn) return;

  const url = decodeURIComponent(btn.getAttribute("data-copy") || "");
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1200);
  } catch {
    window.prompt("Copy this URL:", url);
  }
});

// =======================================================
// Cloudinary Upload Widget init
// =======================================================
function initUploadWidget() {
  if (CLOUD_NAME === "YOUR_CLOUD_NAME" || UPLOAD_PRESET === "YOUR_UNSIGNED_UPLOAD_PRESET") {
    setStatus("Set CLOUD_NAME and UPLOAD_PRESET in the JavaScript panel, then Run.");
    return;
  }

  if (!window.cloudinary || typeof window.cloudinary.createUploadWidget !== "function") {
    setStatus("Cloudinary Upload Widget script not loaded. Re-run and ensure popups aren’t blocked.");
    return;
  }

  // Create the widget once; open it on button click.
  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,

      // Guest-friendly UX
      sources: ["local", "camera"],

      // Multiple uploads (Cloudinary supports this; you can cap maxFiles)
      multiple: true,
      maxFiles: MAX_FILES_PER_BATCH,

      // Accept images and videos; server-side restrictions should be enforced in the upload preset too
      resourceType: "auto",
      clientAllowedFormats: ["image", "video"],
      maxFileSize: MAX_FILE_SIZE_BYTES,

      // Optional UI behaviors
      showCompletedButton: true,
      showUploadMoreButton: true
    },
    (error, result) => {
      if (error) {
        console.error("Upload Widget error:", error);
        setStatus("Upload error. Check console for details.");
        return;
      }

      if (!result) return;

      // Cloudinary’s examples handle successful uploads via `result.event === "success"`
      if (result.event === "success" && result.info) {
        const card = renderCard(result.info);
        galleryEl.prepend(card);
        updateCount();
        setStatus("Upload complete. Thank you!");
      }

      if (result.event === "close") {
        // User closed the widget (no action needed)
      }
    }
  );

  document.getElementById("uploadBtn").addEventListener("click", () => {
    setStatus("Opening uploader...");
    widget.open();
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    galleryEl.innerHTML = "";
    updateCount();
    setStatus("Gallery cleared (this does not delete from Cloudinary).");
  });

  updateCount();
  setStatus("Ready. Click “Upload Wedding Photos / Videos”.");
}

window.addEventListener("load", initUploadWidget);
