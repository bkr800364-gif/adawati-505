"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const pdfInput = document.getElementById("pdfInput");
  const uploadArea = document.getElementById("uploadArea");
  const fileList = document.getElementById("fileList");
  const emptyState = document.getElementById("emptyState");

  const fileCount = document.getElementById("fileCount");
  const summaryFiles = document.getElementById("summaryFiles");
  const summarySize = document.getElementById("summarySize");

  const outputName = document.getElementById("outputName");
  const clearButton = document.getElementById("clearButton");
  const mergeButton = document.getElementById("mergeButton");
  const mergeButtonText = document.getElementById("mergeButtonText");
  const statusMessage = document.getElementById("statusMessage");

  const currentYear = document.getElementById("currentYear");

  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  const MAX_TOTAL_SIZE = 250 * 1024 * 1024;
  const MAX_FILES = 30;

  let selectedFiles = [];
  let nextId = 1;
  let isMerging = false;

  currentYear.textContent = new Date().getFullYear();

  /* ---------- Messages ---------- */

  function showMessage(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";

    if (type) {
      statusMessage.classList.add(type);
    }
  }

  /* ---------- Formatting ---------- */

  function formatSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} بايت`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
  }

  function getTotalSize() {
    return selectedFiles.reduce((total, item) => total + item.file.size, 0);
  }

  /* ---------- Update counters ---------- */

  function updateSummary() {
    const count = selectedFiles.length;

    fileCount.textContent = `${count} ملفات`;
    summaryFiles.textContent = String(count);
    summarySize.textContent = formatSize(getTotalSize());

    emptyState.hidden = count > 0;
    fileList.hidden = count === 0;
  }

  /* ---------- Render files ---------- */

  function renderFiles() {
    fileList.replaceChildren();

    selectedFiles.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "file-item";

      const icon = document.createElement("div");
      icon.className = "pdf-icon";
      icon.textContent = "PDF";

      const details = document.createElement("div");
      details.className = "file-details";

      const name = document.createElement("div");
      name.className = "file-name";
      name.textContent = item.file.name;
      name.title = item.file.name;

      const meta = document.createElement("div");
      meta.className = "file-meta";
      meta.textContent = `الملف ${index + 1} · ${formatSize(item.file.size)}`;

      details.append(name, meta);

      const actions = document.createElement("div");
      actions.className = "file-actions";

      const upButton = document.createElement("button");
      upButton.type = "button";
      upButton.className = "order-button";
      upButton.textContent = "↑";
      upButton.title = "تحريك الملف للأعلى";
      upButton.setAttribute("aria-label", `تحريك ${item.file.name} للأعلى`);
      upButton.disabled = index === 0 || isMerging;

      upButton.addEventListener("click", () => {
        moveFile(index, -1);
      });

      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.className = "order-button";
      downButton.textContent = "↓";
      downButton.title = "تحريك الملف للأسفل";
      downButton.setAttribute("aria-label", `تحريك ${item.file.name} للأسفل`);
      downButton.disabled = index === selectedFiles.length - 1 || isMerging;

      downButton.addEventListener("click", () => {
        moveFile(index, 1);
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-button";
      removeButton.textContent = "×";
      removeButton.title = "حذف الملف";
      removeButton.setAttribute("aria-label", `حذف ${item.file.name}`);
      removeButton.disabled = isMerging;

      removeButton.addEventListener("click", () => {
        removeFile(item.id);
      });

      actions.append(upButton, downButton, removeButton);
      row.append(icon, details, actions);
      fileList.append(row);
    });

    updateSummary();
  }

  /* ---------- Add files ---------- */

  function addFiles(fileCollection) {
    if (isMerging) {
      return;
    }

    const incoming = Array.from(fileCollection);
    let added = 0;
    const errors = [];

    for (const file of incoming) {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        errors.push(`${file.name}: اختر ملف PDF فقط.`);
        continue;
      }

      if (file.size === 0) {
        errors.push(`${file.name}: الملف فارغ.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: يتجاوز الحد البالغ 100 ميجابايت.`);
        continue;
      }

      const duplicate = selectedFiles.some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified,
      );

      if (duplicate) {
        continue;
      }

      if (selectedFiles.length >= MAX_FILES) {
        errors.push(`الحد الأقصى هو ${MAX_FILES} ملفًا.`);
        break;
      }

      if (getTotalSize() + file.size > MAX_TOTAL_SIZE) {
        errors.push("تجاوزت الملفات الحد الإجمالي البالغ 250 ميجابايت.");
        break;
      }

      selectedFiles.push({
        id: nextId++,
        file,
      });

      added++;
    }

    renderFiles();
    pdfInput.value = "";

    if (errors.length > 0) {
      showMessage(errors.slice(0, 3).join(" "), "error");
    } else if (added > 0) {
      showMessage(
        "تمت إضافة الملفات. يمكنك تغيير ترتيبها قبل الدمج.",
        "success",
      );
    } else if (selectedFiles.length > 0) {
      showMessage("الملفات المحددة موجودة بالفعل في القائمة.");
    } else {
      showMessage("اختر ملفين PDF على الأقل للبدء.");
    }
  }

  pdfInput.addEventListener("change", (event) => {
    addFiles(event.target.files || []);
  });

  /* ---------- Drag and drop ---------- */

  uploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadArea.classList.add("dragging");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragging");
  });

  uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadArea.classList.remove("dragging");

    if (event.dataTransfer?.files) {
      addFiles(event.dataTransfer.files);
    }
  });

  /* ---------- Move file ---------- */

  function moveFile(index, direction) {
    if (isMerging) {
      return;
    }

    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= selectedFiles.length) {
      return;
    }

    const current = selectedFiles[index];

    selectedFiles[index] = selectedFiles[newIndex];
    selectedFiles[newIndex] = current;

    renderFiles();
    showMessage("تم تحديث ترتيب الملفات.");
  }

  /* ---------- Remove file ---------- */

  function removeFile(id) {
    if (isMerging) {
      return;
    }

    selectedFiles = selectedFiles.filter((item) => item.id !== id);

    renderFiles();
    showMessage(
      selectedFiles.length
        ? "تم حذف الملف من القائمة."
        : "اختر ملفين PDF على الأقل للبدء.",
    );
  }

  /* ---------- Clear all ---------- */

  clearButton.addEventListener("click", () => {
    if (isMerging) {
      return;
    }

    selectedFiles = [];
    renderFiles();
    showMessage("تم حذف جميع الملفات.");
  });

  /* ---------- Safe output filename ---------- */

  function getSafeFilename() {
    const name = (outputName.value || "merged-document")
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/[. ]+$/g, "")
      .slice(0, 80);

    return name || "merged-document";
  }

  /* ---------- Download merged PDF ---------- */

  function downloadPdf(bytes) {
    const blob = new Blob([bytes], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${getSafeFilename()}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // إبقاء الرابط متاحًا قليلًا حتى يبدأ المتصفح التنزيل.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /* ---------- Merge PDFs ---------- */

  mergeButton.addEventListener("click", async () => {
    if (isMerging) {
      return;
    }

    if (selectedFiles.length < 2) {
      showMessage("اختر ملفين PDF على الأقل لإتمام الدمج.", "error");
      pdfInput.click();
      return;
    }

    if (!window.PDFLib || !window.PDFLib.PDFDocument) {
      showMessage(
        "تعذر تحميل مكتبة دمج PDF. تأكد من اتصال الإنترنت، ثم حدّث الصفحة.",
        "error",
      );
      return;
    }

    isMerging = true;
    mergeButton.disabled = true;
    clearButton.disabled = true;
    pdfInput.disabled = true;
    outputName.disabled = true;
    mergeButtonText.textContent = "جارٍ دمج الملفات...";

    renderFiles();

    try {
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (let index = 0; index < selectedFiles.length; index++) {
        const item = selectedFiles[index];

        showMessage(
          `جارٍ معالجة الملف ${index + 1} من ${selectedFiles.length}: ${item.file.name}`,
        );

        const buffer = await item.file.arrayBuffer();

        let sourcePdf;

        try {
          sourcePdf = await PDFDocument.load(buffer, {
            ignoreEncryption: false,
          });
        } catch (error) {
          throw new Error(
            `تعذر فتح الملف "${item.file.name}". تأكد أنه PDF صالح وغير محمي بكلمة مرور.`,
          );
        }

        const pageIndices = sourcePdf.getPageIndices();

        if (pageIndices.length === 0) {
          throw new Error(`الملف "${item.file.name}" لا يحتوي على صفحات.`);
        }

        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });

        showMessage(`تم تجهيز ${index + 1} من ${selectedFiles.length} ملفات.`);
      }

      showMessage("اكتمل الدمج. جارٍ إنشاء الملف للتنزيل...");

      const pdfBytes = await mergedPdf.save({
        useObjectStreams: true,
      });

      downloadPdf(pdfBytes);

      showMessage(
        `نجح الدمج! تم جمع ${selectedFiles.length} ملفات في مستند PDF واحد.`,
        "success",
      );
    } catch (error) {
      console.error("PDF merge error:", error);

      showMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء دمج الملفات. جرّب ملفات PDF أخرى.",
        "error",
      );
    } finally {
      isMerging = false;
      mergeButton.disabled = false;
      clearButton.disabled = false;
      pdfInput.disabled = false;
      outputName.disabled = false;
      mergeButtonText.textContent = "دمج ملفات PDF";

      renderFiles();
    }
  });

  /* ---------- Initial state ---------- */

  renderFiles();
  showMessage("اختر ملفين PDF على الأقل للبدء.");
});
