
const translations = {
  ar: {
    brand: "مولّد العناوين العربية",
    browser: "يعمل داخل المتصفح",
    kicker: "الذكاء الاصطناعي × الصحافة العربية",
    heroTitle: 'حوّل المقالات إلى <span>عناوين إخبارية</span>',
    heroText: "أدخل نص الخبر، واختر نموذج التعلم العميق، واحصل على عنوان عربي موجز يلخص أهم ما ورد في المقال.",
    workspaceEyebrow: "مساحة العمل",
    workspaceTitle: "أنشئ عنوانك الأول",
    stepInput: "إدخال المقال",
    articleLabel: "نص المقال",
    articleHint: "الصق محتوى الخبر الذي تريد تلخيصه في عنوان.",
    sample: "جرّب مقالًا تجريبيًا",
    modelLabel: "نموذج التوليد",
    generate: "توليد العنوان",
    privacy: "سيتم تشغيل النماذج محليًا داخل المتصفح بعد ربط ملفات ONNX.",
    resultLabel: "النتيجة",
    resultHint: "سيظهر العنوان المُولّد هنا.",
    waiting: "في انتظار المقال",
    emptyTitle: "عنوانك القادم يبدأ من هنا",
    emptyText: "أدخل مقالًا في المساحة المقابلة، ثم اضغط على «توليد العنوان» لبدء التجربة.",
    modelNotice: "الواجهة جاهزة. لم يتم توصيل ملفات ONNX بعد، لذلك لن يتم عرض توقعات تجريبية على أنها نتائج حقيقية.",
    evaluationEyebrow: "تقييم النماذج",
    evaluationTitle: "مؤشرات الأداء",
    fromNotebook: "نتائج الاختبار من Notebook",
    lowerBetter: "كلما انخفضت القيمة كان أفضل",
    higherBetter: "كلما ارتفعت القيمة كان أفضل",
    metricsNote: "هذه النتائج هي نتائج الـ baseline الحالية على مجموعة الاختبار، وليست ضمانًا لجودة العناوين المولّدة.",
    footer: "مشروع تعلم عميق · SimpleRNN & LSTM",
    sampleArticle: "أعلنت مجموعة من شركات التكنولوجيا عن ارتفاع استثماراتها في تطوير تقنيات الذكاء الاصطناعي، مع زيادة الطلب على مراكز البيانات والخدمات السحابية. وأوضحت تقارير اقتصادية أن المنافسة بين الشركات الكبرى أصبحت أكثر حدة، في ظل سعي المؤسسات إلى تحسين الكفاءة وخفض التكاليف. ويتوقع محللون استمرار نمو القطاع خلال الفترة المقبلة مع توسع استخدام التطبيقات الذكية في مختلف المجالات.",
    emptyInput: "من فضلك أدخل نص المقال أولًا.",
    tooShort: "المقال قصير جدًا. أدخل نصًا أطول للحصول على تجربة مناسبة.",
    notConnected: "ملفات نماذج ONNX لم يتم تجهيزها وربطها بعد. الواجهة تعمل، لكن التوليد الحقيقي سيكون متاحًا بعد تصدير النماذج وربطها.",
    sampleLoaded: "تم إدراج مقال تجريبي."
  },

  en: {
    brand: "Arabic Headline Generator",
    browser: "Runs in your browser",
    kicker: "ARTIFICIAL INTELLIGENCE × ARABIC JOURNALISM",
    heroTitle: 'Turn articles into <span>news headlines</span>',
    heroText: "Paste a news article, choose a deep learning model, and generate a concise Arabic headline.",
    workspaceEyebrow: "WORKSPACE",
    workspaceTitle: "Create your first headline",
    stepInput: "ARTICLE INPUT",
    articleLabel: "Article text",
    articleHint: "Paste the news article you want to summarize.",
    sample: "Try a sample article",
    modelLabel: "Generation model",
    generate: "Generate headline",
    privacy: "Models will run locally in your browser after ONNX files are connected.",
    resultLabel: "Result",
    resultHint: "Your generated headline will appear here.",
    waiting: "Waiting for article",
    emptyTitle: "Your next headline starts here",
    emptyText: "Enter an article and click Generate headline to start.",
    modelNotice: "The interface is ready. ONNX models are not connected yet, so demo predictions will not be presented as real results.",
    evaluationEyebrow: "MODEL EVALUATION",
    evaluationTitle: "Performance metrics",
    fromNotebook: "Test results from notebook",
    lowerBetter: "Lower is better",
    higherBetter: "Higher is better",
    metricsNote: "These are the current baseline results on the test set and do not guarantee headline generation quality.",
    footer: "Deep Learning Project · SimpleRNN & LSTM",
    sampleArticle: "A group of technology companies announced increased investments in artificial intelligence technologies, driven by growing demand for data centers and cloud services. Economic reports indicate that competition among major companies has intensified as organizations seek to improve efficiency and reduce costs. Analysts expect the sector to continue growing as intelligent applications expand across industries.",
    emptyInput: "Please enter an article first.",
    tooShort: "The article is too short. Please enter more text.",
    notConnected: "ONNX model files have not been exported and connected yet. The interface is ready, but real generation requires model export and integration.",
    sampleLoaded: "Sample article inserted."
  }
};

const $ = (selector) => document.querySelector(selector);

const articleInput = $("#articleInput");
const charCount = $("#charCount");
const toast = $("#toast");

let currentLanguage = "ar";
let toastTimer;


function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


function updateCharCount() {
  const count = articleInput.value.length;

  charCount.textContent =
    `${count.toLocaleString(currentLanguage === "ar" ? "ar-EG" : "en-US")} / 12,000`;
}


function setLanguage(language) {
  currentLanguage = language;

  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (translations[language][key]) {
      element.innerHTML = translations[language][key];
    }
  });

  articleInput.placeholder =
    language === "ar"
      ? articleInput.dataset.placeholderAr
      : articleInput.dataset.placeholderEn;

  $("#languageBtn").textContent =
    language === "ar" ? "EN" : "ع";

  updateCharCount();
}


// Character counter
articleInput.addEventListener("input", updateCharCount);


// Sample article
$("#sampleBtn").addEventListener("click", () => {

  articleInput.value = translations[currentLanguage].sampleArticle;

  updateCharCount();

  articleInput.focus();

  showToast(translations[currentLanguage].sampleLoaded);

});


// Language switch
$("#languageBtn").addEventListener("click", () => {

  const nextLanguage =
    currentLanguage === "ar" ? "en" : "ar";

  setLanguage(nextLanguage);

});


// Dark / Light mode
$("#themeBtn").addEventListener("click", () => {

  const isDark =
    document.documentElement.dataset.theme !== "dark";

  document.documentElement.dataset.theme =
    isDark ? "dark" : "light";

  $("#themeBtn").textContent =
    isDark ? "☾" : "☼";

});


// Generate headline
$("#generateBtn").addEventListener("click", () => {

  const article = articleInput.value.trim();

  if (!article) {
    showToast(translations[currentLanguage].emptyInput);
    articleInput.focus();
    return;
  }

  if (article.split(/\s+/).length < 15) {
    showToast(translations[currentLanguage].tooShort);
    return;
  }

  /*
    ONNX integration will be implemented in the next stage.

    We intentionally do not generate fake headlines.
    The selected model is available through:

    $("#modelSelect").value

    Possible values:
    - lstm
    - rnn
    - both
  */

  showToast(translations[currentLanguage].notConnected);

});


// Initial setup
updateCharCount();
