# M.A.M.A AI Models - Complete Summary

All AI models and business logic calculators are now implemented in the `/models` directory.

## 📁 Model Files

| File | Model | Status |
|------|-------|--------|
| `f1_maker_ranking.py` | Maker Ranking (F1) | ✅ Ready (heuristic) |
| `f2_fair_pay_estimator.py` | Fair Pay Estimator (F2) | ✅ Ready (formula-based) |
| `f3_vision_quality_check.py` | Vision Quality Check (F3) | ✅ Ready (CLIP framework) |
| `f4_workflow_scheduling.py` | Workflow Scheduling (F4) | ✅ Ready (CSP/greedy) |
| `time_calculator.py` | Time Estimator | ✅ Ready (heuristic) |
| `business_logic.py` | Earnings, Recommendations, Ratings | ✅ Ready (rule-based) |

## 🎯 Model Quick Reference

### F1: Maker Ranking
- **Type:** Gradient Boosting Regressor
- **Input:** Job requirements + Manufacturer profile
- **Output:** Ranking score (0-1), explanations, estimated completion time
- **Complexity:** Medium
- **Status:** Uses heuristic until trained

### F2: Fair Pay Estimator
- **Type:** Formula + Optional ML refinement
- **Input:** Material, quantity, hours, tolerance, deadline
- **Output:** Suggested pay, range, cost breakdown
- **Complexity:** Low-Medium
- **Status:** Formula-based (works now), can train ML later

### F3: Vision Quality Check
- **Type:** CLIP (Vision-Language Model) + Anomaly Detection
- **Input:** STL file, evidence photos/videos
- **Output:** QC score (0-1), status (pass/review/fail), similarity, notes
- **Complexity:** High
- **Status:** Framework ready, needs CLIP installation for full functionality

### F4: Workflow Scheduling
- **Type:** Constraint Satisfaction + Greedy Algorithm
- **Input:** Tasks, devices, availability windows
- **Output:** Optimized schedule, profit, utilization metrics
- **Complexity:** Medium
- **Status:** Fully functional (heuristic optimizer)

### Time Calculator
- **Type:** Rule-based formulas per device type
- **Input:** STL specs, material, quantity, device type
- **Output:** Estimated hours (setup + per-unit + total)
- **Complexity:** Low
- **Status:** Fully functional

### Business Logic
- **Earnings Calculator:** Simple aggregation
- **Next Project Recommender:** Rule-based scoring
- **Rating Aggregator:** Statistical aggregation + Bayesian averaging
- **Status:** All functional

## 📊 Architecture Summary

See `models/MODEL_ARCHITECTURES.md` for detailed architecture descriptions including:
- Model internals and feature engineering
- Training procedures
- Evaluation metrics
- Future enhancements

## 🚀 Next Steps

1. **Run SQL migrations** in Supabase (if not done): `RUN_THIS_IN_SUPABASE.sql`
2. **Integrate models into API routes** (Next.js `/api/ai/*` endpoints)
3. **Collect training data** (historical jobs, ratings, images)
4. **Train models** using historical data (call `model.train()` methods)
5. **Deploy models** (save trained models, serve via API)

## 📝 Notes

- All models have **fallback heuristic implementations** that work immediately
- Models can be **trained later** when historical data is available
- F3 (Vision) requires ML dependencies (CLIP) - commented out in requirements for now
- Models use **scikit-learn** (lightweight) except F3 which uses **CLIP/PyTorch**

