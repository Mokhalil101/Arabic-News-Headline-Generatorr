# Arabic News Headline Generator

An AI-powered web application that generates Arabic news headlines from full Arabic news articles using Deep Learning Sequence-to-Sequence models.

The project implements and compares two architectures:

- **SimpleRNN Encoder–Decoder**
- **LSTM Encoder–Decoder**

The trained models are exported to ONNX and integrated into a browser-based application using ONNX Runtime Web. The application runs entirely on the client side without requiring a backend server.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Dataset](#dataset)
- [Data Preprocessing](#data-preprocessing)
- [Model Architecture](#model-architecture)
- [Training Configuration](#training-configuration)
- [Evaluation Results](#evaluation-results)
- [Web Application](#web-application)
- [Project Structure](#project-structure)
- [Installation and Local Setup](#installation-and-local-setup)
- [GitHub Pages Deployment](#github-pages-deployment)
- [Current Limitations](#current-limitations)
- [Future Improvements](#future-improvements)

---

## Project Overview

News articles are often long and contain more information than readers need at first glance. A headline summarizes the main topic and helps readers quickly understand the content.

This project aims to develop an Arabic headline generation system that automatically produces a short headline from a given Arabic news article.

The project follows a Sequence-to-Sequence learning approach, where:

- The **Encoder** reads and processes the input article.
- The **Decoder** generates the headline token by token.
- The generated headline is displayed in an interactive web interface.

The main objective is to compare the performance of SimpleRNN and LSTM architectures on Arabic news headline generation.

---

## Features

### Deep Learning

- SimpleRNN Encoder–Decoder model.
- LSTM Encoder–Decoder model.
- Word-level tokenization.
- Arabic text normalization.
- Teacher Forcing during training.
- Autoregressive headline generation.

### Web Application

- Arabic Right-to-Left (RTL) interface.
- SimpleRNN model selection.
- LSTM model selection.
- Compare Both option.
- Real-time headline generation in the browser.
- Model evaluation metrics dashboard.
- Light and dark themes.
- Arabic and English interface support.

### Deployment

- ONNX model export.
- ONNX Runtime Web integration.
- Client-side inference.
- GitHub Pages hosting.
- No backend server required.

---

## Project Architecture

The application consists of three main components:

**1. Training Environment**

Google Colab is used for:

- Dataset preparation.
- Arabic text preprocessing.
- Vocabulary construction.
- Model training.
- Model evaluation.
- ONNX export.

**2. Model Storage**

The exported ONNX models and vocabulary configuration are stored as static project files.

**3. Web Application**

The browser loads the configuration, vocabulary, and ONNX models, then performs inference locally.

```text
              Arabic News Article
                       |
                       v
              Text Preprocessing
                       |
                       v
                Tokenization
                       |
                       v
                Vocabulary
                       |
                       v
                Encoder Model
                       |
                       v
                Hidden State
                       |
                       v
                Decoder Model
                       |
                       v
              Generated Headline
                       |
                       v
                 Web Interface
```

---

## Dataset

The project uses the **AraFinNews** dataset.

Dataset source:

[Hugging Face – drelhaj/AraFinNews](https://huggingface.co/datasets/drelhaj/AraFinNews)

### Dataset Columns

| Column | Description |
|---|---|
| `article` | Full Arabic news article |
| `title` | Original news headline |

### Dataset Sampling

The project uses reproducible, non-overlapping subsets.

| Split | Number of Samples | Random Seed |
|---|---:|---:|
| Training | 5,000 | 42 |
| Validation | 1,000 | 43 |
| Testing | 1,000 | 44 |
| **Total** | **7,000** | — |

Missing values, duplicate article-title pairs, and cross-split duplicates were handled before sampling.

---

## Data Preprocessing

Arabic text requires normalization before tokenization.

The following preprocessing operations were applied:

1. Remove HTML tags.
2. Remove URLs.
3. Remove Arabic diacritics.
4. Remove Tatweel characters.
5. Normalize Alef variations:
   - أ → ا
   - إ → ا
   - آ → ا
   - ٱ → ا
6. Normalize Alef Maksura:
   - ى → ي
7. Remove extra whitespace.

### Important Decisions

- Arabic stopwords were not removed.
- Stemming was not applied.
- The letter `ة` was preserved.
- Word-level tokenization was used.

These decisions help preserve the original meaning and grammatical structure of Arabic headlines.

---

## Vocabulary and Sequence Preparation

The vocabulary was built using training data only.

| Parameter | Value |
|---|---:|
| Maximum vocabulary size | 30,000 |
| Minimum token frequency | 2 |
| Maximum article length | 80 tokens |
| Maximum headline length | 20 tokens |

### Special Tokens

| Token | ID | Purpose |
|---|---:|---|
| PAD | 0 | Padding |
| UNK | 1 | Unknown words |
| SOS | 2 | Start of sequence |
| EOS | 3 | End of sequence |

### Decoder Preparation

Teacher Forcing was used during training.

The decoder input and target are shifted by one token:

```text
Decoder Input:
<SOS> word1 word2 word3

Decoder Target:
word1 word2 word3 <EOS>
```

---

## Model Architecture

Two Encoder–Decoder architectures were implemented using PyTorch.

### 1. SimpleRNN Encoder–Decoder

The SimpleRNN architecture processes the input article sequentially and passes its final hidden state to the decoder.

### 2. LSTM Encoder–Decoder

The LSTM architecture uses hidden and cell states to maintain information throughout the sequence.

### Shared Model Configuration

| Parameter | Value |
|---|---:|
| Embedding Dimension | 256 |
| Hidden Dimension | 256 |
| Vocabulary Size | 30,000 |
| Optimizer | Adam |
| Learning Rate | 0.001 |
| Batch Size | 64 |
| Maximum Epochs | 30 |
| Gradient Clipping | 1.0 |
| Early Stopping Patience | 5 |
| Loss Function | Cross Entropy Loss |

Padding tokens are ignored during loss calculation.

---

## Evaluation Results

The models were evaluated using the held-out test set.

### Test Metrics

| Metric | SimpleRNN | LSTM |
|---|---:|---:|
| Test Loss | 5.5877 | 5.5301 |
| BLEU-1 | 0.0173 | 0.0386 |
| ROUGE-L | 0.0247 | 0.0389 |

### Initial Observations

- LSTM achieved a slightly lower test loss.
- LSTM achieved higher BLEU-1 and ROUGE-L scores.
- Both models currently show weak headline generation quality.
- Repetitive and generic predictions were observed during testing.

**Important:** These are initial experimental results, not evidence of production-ready headline generation. Further model debugging and optimization are required.

---

## Web Application

The web application provides an interface for generating headlines using the trained models.

### Model Selection

Users can select:

- **SimpleRNN:** Generate a headline using the SimpleRNN model.
- **LSTM:** Generate a headline using the LSTM model.
- **Compare Both:** Generate headlines using both models sequentially.

### Browser Inference

The application uses:

- HTML5
- CSS3
- JavaScript
- ONNX Runtime Web

The ONNX models are loaded directly into the browser.

No Python server or backend API is required for inference.

---

## Project Structure

```text
Arabic-News-Headline-Generator/
│
├── notebook/
│   └── Arabic_News_Headline_Generator.ipynb
│
├── models/
│   ├── simple_rnn/
│   │   ├── encoder.onnx
│   │   └── decoder.onnx
│   │
│   └── lstm/
│       ├── encoder.onnx
│       └── decoder.onnx
│
├── config/
│   ├── vocab.json
│   └── config.json
│
├── website/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   │
│   └── js/
│       └── model.js
│
├── documentation/
│   └── README.md
│
└── README.md
```

---

## Installation and Local Setup

### Requirements

- A modern web browser.
- Python installed (for running a local static server).
- ONNX Runtime Web loaded through the application.
- All project files available locally.

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Arabic-News-Headline-Generator.git
```

### Step 2: Open the Project

```bash
cd Arabic-News-Headline-Generator
```

### Step 3: Start a Local Server

Do not open `index.html` directly using `file://`.

The application uses `fetch()` to load JSON and ONNX files, so it should run through an HTTP server.

From the project root, run:

```bash
python -m http.server 8000
```

### Step 4: Open the Website

Visit:

```text
http://localhost:8000/website/
```

The browser should load the configuration, vocabulary, and ONNX models.

---

## GitHub Pages Deployment

This project can be deployed using GitHub Pages.

### Step 1: Push the Project

Upload the complete project structure to a GitHub repository.

### Step 2: Configure GitHub Pages

1. Open the repository.
2. Navigate to **Settings**.
3. Select **Pages**.
4. Choose **Deploy from a branch**.
5. Select the `main` branch.
6. Select the `/ (root)` folder.
7. Click **Save**.

### Step 3: Open the Website

The website URL will follow this format:

```text
https://YOUR_USERNAME.github.io/Arabic-News-Headline-Generator/website/
```

### Deployment Notes

- Keep the `config`, `models`, and `website` folders in their expected locations.
- Preserve the relative paths used by `model.js`.
- Make sure all ONNX files are successfully uploaded.
- GitHub has a 100 MB per-file limit for regular Git repositories.
- Large model files may require Git LFS or another hosting solution.
- GitHub Pages supports static hosting only.

---

## Current Limitations

The current implementation has several limitations:

1. Both models have low BLEU-1 and ROUGE-L scores.
2. Repetitive headline generation has been observed.
3. Greedy decoding may produce generic or repetitive predictions.
4. Article sequences are truncated to 80 tokens.
5. The browser implementation currently uses the exported ONNX encoder and decoder interfaces.
6. Browser performance depends on the user's device and available memory.

These limitations are part of the current experimental version and should be considered when interpreting generated headlines.

---

## Future Improvements

Planned improvements include:

- Debugging and improving the LSTM and SimpleRNN generation behavior.
- Experimenting with Beam Search decoding.
- Investigating repetition reduction techniques.
- Increasing training data size.
- Experimenting with attention mechanisms.
- Testing additional sequence-to-sequence architectures.
- Improving evaluation with additional metrics.
- Optimizing ONNX inference performance.
- Improving the user interface and prediction visualization.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| Python | Data processing and model training |
| Google Colab | Training environment |
| PyTorch | Deep Learning |
| Hugging Face Datasets | Dataset loading |
| NumPy | Numerical operations |
| ONNX | Model interoperability |
| ONNX Runtime Web | Browser inference |
| HTML | Web structure |
| CSS | Web styling |
| JavaScript | Frontend logic |
| GitHub Pages | Website deployment |

---

## Project Status

**Current Status: Experimental Prototype**

- [x] Dataset preparation
- [x] Arabic preprocessing
- [x] Vocabulary construction
- [x] SimpleRNN implementation
- [x] LSTM implementation
- [x] Model training
- [x] Model evaluation
- [x] ONNX export
- [x] ONNX browser integration
- [x] Initial web interface
- [ ] Improve headline generation quality
- [ ] Complete deployment testing
- [ ] Final documentation and project validation

---

## Acknowledgment

This project uses the AraFinNews dataset available through Hugging Face.

Special thanks to the open-source Python, PyTorch, Hugging Face, and ONNX communities for providing the tools and resources used in this project.

---

**Arabic News Headline Generator**

*Transforming Arabic news articles into concise headlines using Deep Learning.*
