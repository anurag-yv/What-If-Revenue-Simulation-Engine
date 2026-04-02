 What-If Revenue Simulation Engine

A full-stack simulation tool that predicts Q3 revenue using historical sales data (Q1 & Q2) and allows “what-if” analysis on key levers like conversion rate, deal size, and sales cycle. Built as part of the SkyGeni Full Stack Internship Assignment.

...............................................................................................................................................................

#Overview

This project helps answer:

* What happens if conversion improves by 10%?
* How does reducing sales cycle impact revenue?
* What if average deal size increases?

Instead of dashboards, it simulates **future Q3 revenue** using real pipeline data.

................................................................................................................................................................

# How it works

* **Q1 & Q2 (Jan–Jun 2025):** used to compute baseline metrics
* **Q3 (Jul–Sep 2025):** open deals used for simulation

Baseline metrics:

* Conversion Rate = Closed Won / (Closed Won + Closed Lost)
* Avg Deal Size = avg(deal_value of Closed Won deals)
* Sales Cycle = avg(closed_date − created_date)

Fallbacks:

* Conversion → 0.5 | Deal Size → 15000 | Sales Cycle → 30 days

Simulation:

* Expected revenue → `deal_value × conversion_rate × size_multiplier`
* Expected close → `created_date + base_sales_cycle + cycle_change`
* Revenue is mapped into **13 weekly buckets** and shown as **cumulative revenue**

................................................................................................................................................................


#API

GET `/api/metrics` → baseline metrics

POST `/api/simulate`

```json
{
  "conversionChange": 10,
  "dealSizeChange": 15,
  "salesCycleChange": -5
}
```

Returns baseline vs scenario revenue, impact (₹ & %), and drivers.

................................................................................................................................................................


#Frontend

React + Chart.js UI with sliders:

* Conversion: -30% → +30%
* Deal Size: -30% → +30%
* Sales Cycle: -15 → +15 days

Behavior:

* Auto simulation (600ms debounce)
* Manual run option
* Real-time insights + last updated time

................................................................................................................................................................

# Visualization

* Single line chart (as required)
* Baseline vs Scenario
* Weeks (W1–W13) vs Revenue (₹)
* Cumulative trend

................................................................................................................................................................

# Project Structure

```
backend/
  server.ts
  package.json
  data/
    deals.csv

frontend/
  App.tsx
  package.json

README.md
```

................................................................................................................................................................

# Run locally

```bash
git clone https://github.com/anurag-yv/What-If-Revenue-Simulation-Engine.git
cd What-If-Revenue-Simulation-Engine
```

Backend:

```bash
cd backend
npm install
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

................................................................................................................................................................

# Assumptions & Inferences

* Only Q1–Q2 closed deals define baseline
* Q3 deals are open pipeline (no closed_date)
* Same conversion applies across deals
* Sales cycle change is linear
* Revenue is distributed weekly and shown cumulatively

Insights:

* Conversion rate has the strongest impact on revenue
* Deal size increases scale revenue linearly
* Shorter sales cycle shifts revenue earlier
* Combined changes create compounding effects

................................................................................................................................................................

#Author

Anurag Yadav
