"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const imageInput = document.getElementById("imageInput");
  const uploadArea = document.getElementById("uploadArea");
  const imageList = document.getElementById("imageList");
  const imageCount = document.getElementById("imageCount");
  const clearButton = document.getElementById("clearButton");

  const pdfName = document.getElementById("pdfName");
  const pageSize = document.getElementById("pageSize");
  const orientation = document.getElementById("orientation");

  const convertButton = document.getElementById("convertButton");
  const statusMessage = document.getElementById("statusMessage");
  const currentYear = document.getElementById("currentYear");

  let selectedImages = [];
  let nextImageId = 1;
  let isConverting = false;

  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const MAX_IMAGE_COUNT = 50;

  currentYear.textContent = new Date().getFullYear();

  /* ---------- Messages ---------- */

  function showMessage(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";

    if (type) {
      statusMessage.classList.add(type);
    }
  }

  /* ---------- Helpers ---------- */

  function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  }

  function updateImageCount() {
    if (selectedImages.length === 0) {
      imageCount.textContent = "لم يتم اختيار صور";
    } else if (selectedImages.length === 1) {
      imageCount.textContent = "صورة واحدة";
    } else {
      imageCount.textContent = `${selectedImages.length} صور مختارة`;
    }
  }

  /* ---------- Render previews ---------- */

  function renderImages() {
    imageList.replaceChildren();

    selectedImages.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "image-item";

      const image = document.createElement("img");
      image.className = "image-preview";
      image.src = item.previewUrl;
      image.alt = `معاينة الصورة ${index + 1}`;

      const info = document.createElement("div");
      info.className = "image-info";

      const number = document.createElement("span");
      number.className = "image-number";
      number.textContent = String(index + 1);

      const name = document.createElement("span");
      name.className = "image-name";
      name.textContent = item.file.name;
      name.title = `${item.file.name} — ${formatFileSize(item.file.size)}`;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-image";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `حذف الصورة ${item.file.name}`);

      removeButton.addEventListener("click", () => {
        removeImage(item.id);
      });

      info.append(number, name, removeButton);
      card.append(image, info);
      imageList.append(card);
    });

    updateImageCount();
  }

  /* ---------- Add images ---------- */

  function addImages(files) {
    if (isConverting) {
      return;
    }

    const incomingFiles = Array.from(files);
    let addedCount = 0;
    const errors = [];

    for (const file of incomingFiles) {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: الملف ليس صورة مدعومة.`);
        continue;
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        errors.push(`${file.name}: استخدم JPG أو PNG أو WebP.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: حجم الصورة أكبر من 20 ميجابايت.`);
        continue;
      }

      const duplicate = selectedImages.some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified,
      );

      if (duplicate) {
        continue;
      }

      if (selectedImages.length >= MAX_IMAGE_COUNT) {
        errors.push("يمكن اختيار 50 صورة كحد أقصى.");
        break;
      }

      const previewUrl = URL.createObjectURL(file);

      selectedImages.push({
        id: nextImageId++,
        file,
        previewUrl,
      });

      addedCount++;
    }

    renderImages();

    if (errors.length > 0) {
      showMessage(errors.slice(0, 3).join(" "), "error");
    } else if (addedCount > 0) {
      showMessage("تمت إضافة الصور بنجاح. يمكنك إنشاء ملف PDF.", "success");
    } else if (selectedImages.length > 0) {
      showMessage("الصور المختارة موجودة بالفعل في القائمة.");
    } else {
      showMessage("اختر صور JPG أو PNG أو WebP للبدء.");
    }

    imageInput.value = "";
  }

  imageInput.addEventListener("change", (event) => {
    addImages(event.target.files || []);
  });

  /* ---------- Upload area interactions ---------- */

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
      addImages(event.dataTransfer.files);
    }
  });

  /* ---------- Remove image ---------- */

  function removeImage(id) {
    if (isConverting) {
      return;
    }

    const item = selectedImages.find((image) => image.id === id);

    if (item) {
      URL.revokeObjectURL(item.previewUrl);
    }

    selectedImages = selectedImages.filter((image) => image.id !== id);

    renderImages();

    showMessage(
      selectedImages.length
        ? "تم حذف الصورة من القائمة."
        : "اختر صورة واحدة على الأقل للبدء.",
    );
  }

  /* ---------- Clear all ---------- */

  clearButton.addEventListener("click", () => {
    if (isConverting) {
      return;
    }

    selectedImages.forEach((item) => {
      URL.revokeObjectURL(item.previewUrl);
    });

    selectedImages = [];
    renderImages();

    showMessage("تم حذف جميع الصور.");
  });

  /* ---------- Load an image safely ---------- */

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);

        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error(`تعذرت قراءة الصورة: ${file.name}`));
          return;
        }

        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`تعذر فتح الصورة: ${file.name}`));
      };

      image.src = objectUrl;
    });
  }

  /* ---------- Convert image to JPEG data ---------- */

  async function imageToJpeg(file) {
    const image = await loadImage(file);

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("تعذر تجهيز الصورة للتحويل.");
    }

    // خلفية بيضاء للحفاظ على وضوح الصور ذات الشفافية.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.drawImage(image, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    canvas.width = 0;
    canvas.height = 0;

    return {
      dataUrl,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  }

  /* ---------- PDF page settings ---------- */

  function getPageDimensions(format, pageOrientation, imageWidth, imageHeight) {
    const formats = {
      a4: { width: 210, height: 297 },
      letter: { width: 215.9, height: 279.4 },
    };

    if (format === "fit") {
      // تحويل أبعاد الصورة من بكسل إلى مليمتر تقريبًا.
      const width = (imageWidth * 25.4) / 96;
      const height = (imageHeight * 25.4) / 96;

      return { width, height };
    }

    const dimensions = formats[format] || formats.a4;

    let width = dimensions.width;
    let height = dimensions.height;

    if (pageOrientation === "landscape") {
      [width, height] = [Math.max(width, height), Math.min(width, height)];
    } else if (pageOrientation === "portrait") {
      [width, height] = [Math.min(width, height), Math.max(width, height)];
    } else if (imageWidth > imageHeight) {
      [width, height] = [Math.max(width, height), Math.min(width, height)];
    } else {
      [width, height] = [Math.min(width, height), Math.max(width, height)];
    }

    return { width, height };
  }

  function drawImageOnPage(pdf, imageData, pageWidth, pageHeight, format) {
    const margin = format === "fit" ? 0 : 8;

    const availableWidth = Math.max(1, pageWidth - margin * 2);
    const availableHeight = Math.max(1, pageHeight - margin * 2);

    const scale = Math.min(
      availableWidth / imageData.width,
      availableHeight / imageData.height,
    );

    const renderedWidth = imageData.width * scale;
    const renderedHeight = imageData.height * scale;

    const x = (pageWidth - renderedWidth) / 2;
    const y = (pageHeight - renderedHeight) / 2;

    pdf.addImage(
      imageData.dataUrl,
      "JPEG",
      x,
      y,
      renderedWidth,
      renderedHeight,
      undefined,
      "FAST",
    );
  }

  /* ---------- Download PDF ---------- */

  function downloadPdf(pdf, name) {
    const safeName =
      (name || "my-images")
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
        .replace(/[. ]+$/g, "")
        .slice(0, 80) || "my-images";

    pdf.save(`${safeName}.pdf`);
  }

  /* ---------- Main conversion ---------- */

  convertButton.addEventListener("click", async () => {
    if (isConverting) {
      return;
    }

    if (selectedImages.length === 0) {
      showMessage("اختر صورة واحدة على الأقل قبل التحويل.", "error");
      imageInput.click();
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showMessage(
        "تعذر تحميل مكتبة PDF. تأكد من اتصال الإنترنت ثم أعد تحميل الصفحة.",
        "error",
      );
      return;
    }

    isConverting = true;
    convertButton.disabled = true;
    convertButton.querySelector("span:first-child").textContent =
      "جارٍ إنشاء الملف...";

    try {
      const { jsPDF } = window.jspdf;
      const format = pageSize.value;
      const selectedOrientation = orientation.value;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
        putOnlyUsedFonts: true,
      });

      for (let index = 0; index < selectedImages.length; index++) {
        const item = selectedImages[index];

        showMessage(
          `جارٍ تجهيز الصورة ${index + 1} من ${selectedImages.length}...`,
        );

        const imageData = await imageToJpeg(item.file);

        const dimensions = getPageDimensions(
          format,
          selectedOrientation,
          imageData.width,
          imageData.height,
        );

        const pageOrientation =
          dimensions.width > dimensions.height ? "landscape" : "portrait";

        if (index > 0) {
          pdf.addPage([dimensions.width, dimensions.height], pageOrientation);
        } else {
          pdf.deletePage(1);

          pdf.addPage([dimensions.width, dimensions.height], pageOrientation);
        }

        drawImageOnPage(
          pdf,
          imageData,
          dimensions.width,
          dimensions.height,
          format,
        );
      }

      showMessage("اكتمل التحويل. جارٍ تجهيز التنزيل...", "success");

      downloadPdf(pdf, pdfName.value);

      showMessage(
        `تم إنشاء ملف PDF بنجاح، ويحتوي على ${selectedImages.length} صفحة.`,
        "success",
      );
    } catch (error) {
      console.error("PDF conversion error:", error);

      showMessage(
        error instanceof Error
          ? `تعذر إنشاء الملف: ${error.message}`
          : "حدث خطأ غير متوقع أثناء إنشاء ملف PDF.",
        "error",
      );
    } finally {
      isConverting = false;
      convertButton.disabled = false;
      convertButton.querySelector("span:first-child").textContent =
        "إنشاء ملف PDF";
    }
  });

  /* ---------- Initial state ---------- */

  renderImages();
  showMessage("اختر صورة واحدة على الأقل للبدء.");
});
