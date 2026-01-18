# M.A.M.A AI Model Architectures

This document describes the architecture and implementation approach for each AI model in the M.A.M.A platform.

---

## F1: Maker Ranking Model (Manufacturer Recommendation)

**Model Type:** Gradient Boosting Regressor (XGBoost-style)

**Architecture:**
- **Base Model:** GradientBoostingRegressor (scikit-learn)
- **Features:** 9 engineered features
- **Output:** Ranking score 0-1 (higher = better match)

**Feature Engineering:**
1. `equipment_match_score` (0-1): How well manufacturer's devices match job requirements
2. `tolerance_match` (0-1): Tier alignment (1.0 = exact, 0.5 = adjacent, 0.0 = mismatch)
3. `average_rating_normalized` (0-1): Historical rating normalized to 0-1
4. `completion_rate` (0-1): Proportion of completed jobs (with smoothing)
5. `capacity_score` (0-1): Current capacity/availability
6. `material_match` (0-1): Fraction of required materials available
7. `distance_factor` (0-1): Geographic proximity (decays with distance)
8. `reputation_factor` (0-1): Log-scale reputation (prevents large manufacturers from dominating)
9. `deadline_feasibility` (0-1): Can manufacturer meet deadline given capacity

**Training:**
- Uses historical job assignments and outcomes
- Target: Composite score based on job success (on-time completion, quality, client satisfaction)
- Hyperparameters: `n_estimators=100`, `max_depth=5`, `learning_rate=0.1`

**Output:**
- Rank scores for all manufacturers (0-1)
- Top 3 factors explaining the score
- Estimated completion time

**Complexity:** **Medium** - Standard gradient boosting, well-understood architecture

---

## F2: Fair Pay Estimator (Pricing Calculator)

**Model Type:** Gradient Boosting Regressor + Heuristic Formula Hybrid

**Architecture:**
- **Primary:** Heuristic formula-based calculation
- **Refinement:** GradientBoostingRegressor for fine-tuning

**Base Formula:**
```
suggested_pay = (material_cost + labor_cost + overhead) * (1 + margin) * urgency_multiplier

Where:
- material_cost = material_cost_per_unit * quantity
- labor_cost = estimated_hours * hourly_rate * complexity_multiplier
- overhead = labor_cost * 0.15 (15%)
- margin = 0.20 (20% profit margin)
- urgency_multiplier = 1.0 to 1.5 (based on deadline)
```

**ML Refinement:**
- Model learns to adjust base calculation based on market data
- Features: material_cost, quantity, hours, urgency, complexity, material_type
- Output: Refined pay estimate (blended 70% model, 30% heuristic)

**Training Data:**
- Historical job pay amounts (actual payments)
- Features: job specs, market rates, outcomes

**Output:**
- Suggested pay amount
- Range (suggested_pay ± 15%)
- Breakdown: materials, labor, overhead, margin, urgency

**Complexity:** **Low-Medium** - Formula-based with optional ML refinement

---

## F3: Vision Quality Check (3D Part Quality Control)

**Model Type:** CLIP (Contrastive Language-Image Pre-training) + Custom Anomaly Detection

**Architecture:**

### Primary Model: CLIP-based Visual Similarity

**CLIP (OpenAI) Architecture:**
- **Vision Encoder:** Vision Transformer (ViT-B/32) - 12 layers, 12 attention heads, 768-dim embeddings
- **Text Encoder:** Transformer - 12 layers, 12 attention heads, 512-dim embeddings
- **Embedding Dimension:** 512
- **Pre-trained on:** 400M image-text pairs from internet

**Pipeline:**

1. **STL Preprocessing:**
   - Load STL with `trimesh`
   - Generate renderings from 4+ angles (top, front, side, isometric)
   - Resolution: 512x512 or 224x224
   - Store as reference images

2. **Evidence Image Preprocessing:**
   - Resize to 224x224 (CLIP input size)
   - Normalize: `(pixel - mean) / std`
   - Optional: Background removal, lighting correction

3. **Embedding Extraction:**
   - Pass reference images through CLIP vision encoder → embeddings (512-dim)
   - Pass evidence images through CLIP vision encoder → embeddings (512-dim)

4. **Similarity Calculation:**
   ```python
   similarity = cosine_similarity(reference_embedding, evidence_embedding)
   normalized_similarity = (similarity + 1.0) / 2.0  # [-1, 1] → [0, 1]
   ```

### Secondary Model: Anomaly Detection

**Option A: Autoencoder**
- **Encoder:** Conv2D layers → bottleneck (128-dim)
- **Decoder:** Transposed Conv2D → reconstructed image
- **Loss:** MSE between input and reconstruction
- **Anomaly Score:** Reconstruction error (high error = anomaly)

**Option B: Pre-trained Defect Detection (YOLO/Faster R-CNN)**
- **Model:** YOLOv8 or Faster R-CNN trained on manufacturing defects
- **Defect Types:** Cracks, warping, layer lines, surface defects, dimensional issues
- **Output:** Bounding boxes + confidence scores for detected defects

### Quality Score Calculation:

```
qc_score = (
    similarity_score * 0.5 +      # Visual match (50%)
    anomaly_score * 0.3 +          # Defect detection (30%)
    dimension_score * 0.1 +        # Dimension verification (10%)
    consistency_score * 0.1        # Consistency across photos (10%)
)
```

### Status Decision:

- **PASS:** qc_score >= threshold (0.85 high, 0.75 medium, 0.65 low tolerance)
- **FAIL:** qc_score < threshold (0.60 high, 0.50 medium, 0.40 low tolerance)
- **REVIEW:** Between thresholds (human review needed)

**Advanced Features:**
- Dimension verification: CV-based measurement with reference object
- Surface quality: Texture analysis (Gabor filters, LBP)
- Color matching: CIELAB color space comparison if material color specified

**Complexity:** **High** - Requires CLIP or custom CNN, computer vision expertise

---

## F4: Workflow Scheduling (Task Optimization)

**Model Type:** Constraint Satisfaction Problem (CSP) + Greedy Algorithm

**Architecture:**

### Optimization Approach:

**Algorithm:** Greedy Assignment + Local Search Refinement

**Objective Function:**
```
maximize: Σ(pay_amount * priority_weight * deadline_feasibility) - penalty(conflicts)
```

**Constraints:**
1. Device availability (no double-booking)
2. Device compatibility (task only on compatible devices)
3. Material availability (materials ready before task starts)
4. Deadline feasibility (task completes before deadline)
5. Capacity limits (maker can't exceed daily hours)

### Algorithm Steps:

1. **Priority Scoring:**
   ```
   priority_score = urgency * 0.4 + profit_factor * 0.4 + priority_field * 0.2
   urgency = 1.0 / (days_until_deadline + 1.0)
   ```

2. **Greedy Assignment:**
   - Sort tasks by priority_score (descending)
   - For each task:
     - Find compatible devices
     - Find available time slots
     - Assign to best slot (earliest + highest profit/hour)

3. **Refinement Pass:**
   - Detect underutilized devices
   - Swap tasks to balance load
   - Optimize for parallel execution

**Alternative (Advanced):**
- **OR-Tools (Linear Programming):** For optimal solutions with complex constraints
- **Genetic Algorithm:** For exploring solution space
- **Simulated Annealing:** For escaping local optima

**Complexity:** **Medium** - CSP/greedy algorithms, can be upgraded to LP/MIP later

---

## Business Logic Models (Non-ML)

### Earnings Calculator
- **Type:** Simple aggregation
- **Formula:** `total_earnings = Σ(pay_amount - material_costs)`
- **Complexity:** **Low** - Database queries + arithmetic

### Next Project Recommender
- **Type:** Rule-based scoring
- **Formula:**
  ```
  score = material_match * 0.4 + tolerance_match * 0.3 + pay_factor * 0.2 + urgency * 0.1
  ```
- **Complexity:** **Low** - Can upgrade to ML (collaborative filtering, matrix factorization) later

### Rating Aggregator
- **Type:** Statistical aggregation
- **Methods:** Mean, median, distribution, Bayesian average
- **Formula (Bayesian):**
  ```
  bayesian_rating = (prior_mean * prior_count + Σ(ratings)) / (prior_count + count(ratings))
  ```
- **Complexity:** **Low** - Statistics only

---

## Model Training & Deployment

### Training Pipeline:

1. **Data Collection:**
   - Historical job data (assignments, outcomes, pay)
   - Part images (good and defective)
   - Ratings and reviews

2. **Feature Engineering:**
   - Extract features from raw data
   - Normalize and encode categorical variables

3. **Model Training:**
   - Split: 80% train, 10% validation, 10% test
   - Cross-validation for hyperparameter tuning
   - Early stopping to prevent overfitting

4. **Evaluation:**
   - F1: Precision@K (top 3 recommendations)
   - F2: MAE/MSE for pay predictions
   - F3: Accuracy/ROC-AUC for pass/fail classification
   - F4: Schedule efficiency, profit maximization

5. **Deployment:**
   - Save models with `joblib` (scikit-learn) or `torch.save` (PyTorch)
   - Deploy as FastAPI endpoints
   - Version control with model registry

### Model Serving:

```python
# API endpoint structure
POST /api/ai/rank      # F1: Maker ranking
POST /api/ai/pay       # F2: Pay estimation
POST /api/ai/qc        # F3: Quality check
POST /api/ai/schedule  # F4: Workflow scheduling
```

---

## Future Enhancements

- **F1:** Add deep learning embeddings for equipment descriptions
- **F2:** Market rate prediction using time series models
- **F3:** Fine-tune CLIP on manufacturing-specific images, add 3D point cloud comparison
- **F4:** Upgrade to Mixed-Integer Programming (MIP) for optimal solutions

