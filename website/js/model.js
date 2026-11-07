
/* =========================================
   Arabic News Headline Generator
   ONNX Runtime Web Integration
========================================= */

(() => {
  "use strict";

  // =========================================
  // 1. Configuration
  // =========================================

  const CONFIG_URL = "../config/config.json";
  const VOCAB_URL = "../config/vocab.json";

  const MODEL_PATHS = {
    rnn: {
      encoder: "../models/simple_rnn/encoder.onnx",
      decoder: "../models/simple_rnn/decoder.onnx"
    },
    lstm: {
      encoder: "../models/lstm/encoder.onnx",
      decoder: "../models/lstm/decoder.onnx"
    }
  };

  let config = null;
  let tokenToId = {};
  let idToToken = {};

  const sessions = {};

  let isGenerating = false;

  const $ = (selector) => document.querySelector(selector);

  // =========================================
  // 2. Configure ONNX Runtime
  // =========================================

  function configureONNX() {
    if (!window.ort) {
      throw new Error("ONNX Runtime Web did not load.");
    }

    // Compatibility mode
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    ort.env.wasm.simd = false;

    console.log("ONNX Runtime configured:", {
      numThreads: ort.env.wasm.numThreads,
      proxy: ort.env.wasm.proxy,
      simd: ort.env.wasm.simd
    });
  }

  // =========================================
  // 3. Load JSON
  // =========================================

  async function loadJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Could not load ${url}: HTTP ${response.status}`
      );
    }

    return response.json();
  }

  async function loadConfiguration() {
    if (config) return;

    const [configData, vocabData] = await Promise.all([
      loadJSON(CONFIG_URL),
      loadJSON(VOCAB_URL)
    ]);

    config = configData;

    tokenToId = vocabData.token_to_id;
    idToToken = vocabData.id_to_token;

    if (!tokenToId || !idToToken) {
      throw new Error("Invalid vocabulary JSON structure.");
    }

    console.log(
      "Vocabulary loaded:",
      Object.keys(tokenToId).length
    );

    console.log("Configuration loaded:", config);
  }

  // =========================================
  // 4. Load ONNX Models
  // =========================================

  async function loadModel(modelName) {
    if (sessions[modelName]) {
      return sessions[modelName];
    }

    configureONNX();

    await loadConfiguration();

    const paths = MODEL_PATHS[modelName];

    if (!paths) {
      throw new Error("Unknown model: " + modelName);
    }

    console.log(`Loading ${modelName}...`);

    // Load encoder first
    const encoder = await ort.InferenceSession.create(
      paths.encoder,
      {
        executionProviders: ["wasm"]
      }
    );

    console.log(`${modelName} encoder loaded.`);

    // Then load decoder
    const decoder = await ort.InferenceSession.create(
      paths.decoder,
      {
        executionProviders: ["wasm"]
      }
    );

    console.log(`${modelName} decoder loaded.`);

    sessions[modelName] = {
      encoder,
      decoder
    };

    console.log(`${modelName} loaded successfully.`);

    return sessions[modelName];
  }

  // =========================================
  // 5. Arabic Preprocessing
  // =========================================

  function preprocessArabic(text) {
    let result = String(text);

    // Remove HTML tags
    result = result.replace(/<[^>]*>/g, " ");

    // Decode common HTML entities
    const entities = {
      "&nbsp;": " ",
      "&amp;": "&",
      "&quot;": '"',
      "&apos;": "'",
      "&#39;": "'",
      "&lt;": "<",
      "&gt;": ">"
    };

    result = result.replace(
      /&nbsp;|&amp;|&quot;|&apos;|&#39;|&lt;|&gt;/gi,
      match => entities[match.toLowerCase()] || match
    );

    // Remove URLs
    result = result.replace(
      /https?:\/\/\S+|www\.\S+/gi,
      " "
    );

    // Remove Arabic diacritics
    result = result.replace(
      /[\u064B-\u065F\u0670]/g,
      ""
    );

    // Remove Tatweel
    result = result.replace(/\u0640/g, "");

    // Normalize Arabic letters
    result = result.replace(/[أإآٱ]/g, "ا");
    result = result.replace(/ى/g, "ي");

    // Normalize whitespace
    result = result.replace(/\s+/g, " ").trim();

    return result;
  }

  // =========================================
  // 6. Word-Level Tokenization
  // =========================================

  function tokenize(text) {
    return (
      text.match(
        /[\p{L}\p{N}]+|[^\p{L}\p{N}\s_]/gu
      ) || []
    );
  }

  // =========================================
  // 7. Encode Article
  // =========================================

  function encodeArticle(article) {
    const cleanText = preprocessArabic(article);

    const tokens = tokenize(cleanText);

    const maxLength = Number(
      config.max_article_length || 80
    );

    // Keep the first MAX_ARTICLE_LENGTH tokens
    const selectedTokens = tokens.slice(0, maxLength);

    const ids = selectedTokens.map(token => {
      return Number(
        tokenToId[token] ?? config.unk_id
      );
    });

    // No padding:
    // The exported ONNX encoder accepts input_ids only.

    return {
      ids,
      length: ids.length,
      tokenCount: tokens.length,
      usedTokens: selectedTokens.length
    };
  }

  // =========================================
  // 8. Tensor Helpers
  // =========================================

  function int64Tensor(values, dimensions) {
    const data = BigInt64Array.from(
      values,
      value => BigInt(value)
    );

    return new ort.Tensor(
      "int64",
      data,
      dimensions
    );
  }

  // =========================================
  // 9. Greedy Decoding
  // =========================================

  function argmax(values) {
    let bestIndex = 0;
    let bestValue = -Infinity;

    for (let i = 0; i < values.length; i++) {
      if (values[i] > bestValue) {
        bestValue = values[i];
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  // =========================================
  // 10. Generate Headline
  // =========================================

  async function generateWithModel(article, modelName) {
    const { encoder, decoder } = await loadModel(modelName);

    const encoded = encodeArticle(article);

    if (encoded.length === 0) {
      throw new Error(
        "The article contains no usable tokens."
      );
    }

    console.log(
      `${modelName}: Encoding ${encoded.length} tokens.`
    );

    // Actual input length, without padding
    const inputTensor = int64Tensor(
      encoded.ids,
      [1, encoded.length]
    );

    // Encoder accepts input_ids only
    const encoderOutputs = await encoder.run({
      input_ids: inputTensor
    });

    let hidden = encoderOutputs.hidden;
    let cell = encoderOutputs.cell || null;

    let currentToken = Number(config.sos_id);

    const generatedIds = [];

    const maxTitleLength = Number(
      config.max_title_length || 20
    );

    // Autoregressive generation
    for (
      let step = 0;
      step < maxTitleLength;
      step++
    ) {
      const tokenTensor = int64Tensor(
        [currentToken],
        [1, 1]
      );

      let decoderOutputs;

      if (modelName === "rnn") {
        decoderOutputs = await decoder.run({
          token_ids: tokenTensor,
          hidden
        });

        hidden = decoderOutputs.next_hidden;

      } else {
        decoderOutputs = await decoder.run({
          token_ids: tokenTensor,
          hidden,
          cell
        });

        hidden = decoderOutputs.next_hidden;
        cell = decoderOutputs.next_cell;
      }

      const logits = decoderOutputs.logits.data;

      const nextToken = argmax(logits);

      // Stop at EOS
      if (nextToken === Number(config.eos_id)) {
        break;
      }

      // Ignore special tokens
      if (
        nextToken !== Number(config.pad_id) &&
        nextToken !== Number(config.sos_id)
      ) {
        generatedIds.push(nextToken);
      }

      currentToken = nextToken;
    }

    const words = generatedIds
      .map(id => idToToken[String(id)])
      .filter(word => {
        return (
          word &&
          word !== "<UNK>" &&
          word !== "<PAD>" &&
          word !== "<SOS>" &&
          word !== "<EOS>"
        );
      });

    return {
      model: modelName,
      headline: formatArabicHeadline(words),
      generatedTokens: generatedIds.length,
      inputTokens: encoded.tokenCount,
      usedInputTokens: encoded.usedTokens
    };
  }

  // =========================================
  // 11. Format Arabic Headline
  // =========================================

  function formatArabicHeadline(words) {
    let text = words.join(" ");

    // Remove spaces before punctuation
    text = text.replace(
      /\s+([،؛؟!,.])/g,
      "$1"
    );

    // Normalize repeated spaces
    text = text.replace(/\s+/g, " ").trim();

    return text;
  }

  // =========================================
  // 12. Toast Notifications
  // =========================================

  function showToast(message) {
    const toast = $("#toast");

    if (!toast) {
      alert(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }

  // =========================================
  // 13. Loading State
  // =========================================

  function setLoading(loading) {
    const button = $("#generateBtn");

    if (!button) return;

    button.disabled = loading;

    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = "جاري توليد العنوان...";
    } else {
      button.textContent =
        button.dataset.originalText || "Generate Headline";
    }
  }

  // =========================================
  // 14. Render Results
  // =========================================

  function renderResults(results) {
    const emptyState = $("#emptyState");
    const resultsArea = $("#resultsArea");

    if (!resultsArea) {
      throw new Error(
        "Results container was not found."
      );
    }

    if (emptyState) {
      emptyState.classList.add("hidden");
    }

    resultsArea.classList.remove("hidden");

    resultsArea.innerHTML = results.map(result => {
      const modelLabel =
        result.model === "rnn"
          ? "SimpleRNN"
          : "LSTM";

      return `
        <article class="result-card">
          <div class="result-card-header">
            <strong>${modelLabel}</strong>
            <span>Generated Headline</span>
          </div>

          <h3
            class="generated-headline"
            dir="rtl"
          ></h3>

          <div class="result-meta">
            <span>Input tokens: ${result.inputTokens}</span>
            <span>Used tokens: ${result.usedInputTokens}</span>
            <span>Generated tokens: ${result.generatedTokens}</span>
          </div>
        </article>
      `;
    }).join("");

    const headlineElements = resultsArea.querySelectorAll(
      ".generated-headline"
    );

    headlineElements.forEach((element, index) => {
      element.textContent =
        results[index].headline ||
        "لم يتمكن النموذج من توليد عنوان.";
    });
  }

  // =========================================
  // 15. Generate Button Handler
  // =========================================

  async function handleGenerate(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (isGenerating) return;

    const articleInput = $("#articleInput");
    const modelSelect = $("#modelSelect");

    if (!articleInput || !modelSelect) {
      showToast("Some website elements are missing.");
      return;
    }

    const article = articleInput.value.trim();

    if (!article) {
      showToast("من فضلك أدخل المقال أولاً.");
      return;
    }

    const wordCount = article
      .split(/\s+/)
      .filter(Boolean)
      .length;

    if (wordCount < 15) {
      showToast(
        "المقال قصير جدًا. أدخل 15 كلمة على الأقل."
      );
      return;
    }

    const selectedModel = modelSelect.value;

    if (
      !["rnn", "lstm", "both"].includes(selectedModel)
    ) {
      showToast("اختيار الموديل غير صحيح.");
      return;
    }

    isGenerating = true;
    setLoading(true);

    try {
      const results = [];

      if (selectedModel === "both") {
        // Run models sequentially instead of Promise.all
        console.log("Generating with SimpleRNN...");

        results.push(
          await generateWithModel(article, "rnn")
        );

        console.log("Generating with LSTM...");

        results.push(
          await generateWithModel(article, "lstm")
        );

      } else {
        results.push(
          await generateWithModel(article, selectedModel)
        );
      }

      renderResults(results);

      const notice = $("#modelNotice");

      if (notice) {
        notice.classList.remove("hidden");

        notice.textContent =
          "تم توليد العناوين باستخدام الموديلات المدربة. النتائج تحتاج إلى مراجعة بشرية.";
      }

      console.log("Generation completed:", results);

    } catch (error) {
      console.error("Generation error:", error);

      showToast(
        "حدث خطأ أثناء تشغيل النموذج: " +
        error.message
      );

    } finally {
      isGenerating = false;
      setLoading(false);
    }
  }

  // =========================================
  // 16. Generate Button Event
  // =========================================

  document.addEventListener(
    "click",
    event => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const button = target.closest("#generateBtn");

      if (!button) return;

      handleGenerate(event);
    },
    true
  );

  // =========================================
  // 17. Initial Status
  // =========================================

  window.addEventListener("load", () => {
    console.log(
      "ONNX integration script loaded."
    );

    try {
      configureONNX();
    } catch (error) {
      console.error(error);
      showToast(error.message);
    }
  });

})();
