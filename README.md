# What-If Revenue Simulation Engine

A full-stack tool to simulate **Q3 revenue** using Q1 & Q2 sales data, with real-time “what-if” controls for conversion rate, deal size, and sales cycle.

Built for the **SkyGeni Full Stack Internship Assignment**.

---

## Overview
This project focuses on **revenue forecasting** rather than historical dashboards. Users can adjust key variables (conversion rate, average deal size, and sales cycle) in real-time and instantly see the impact on projected Q3 revenue.

---

## How It Works

### Data Split
- Q1 & Q2 data → Used to calculate baseline metrics  
- Q3 data → Treated as open pipeline for simulation  

### Baseline Metrics Calculated
- Conversion Rate = Closed Won / (Closed Won + Closed Lost)  
- Avg Deal Size = Average deal_value of Closed Won deals  
- Sales Cycle = Average days from created_date to closed_date  

### Fallback Values (if no data)
- Conversion Rate → 50%  
- Avg Deal Size → ₹15,000  
- Sales Cycle → 30 days  

### Simulation Logic
- Projected Revenue = deal_value × adjusted conversion × size multiplier  
- Projected Close Date = created_date + adjusted sales cycle  
- Results distributed across **13 weekly buckets (cumulative)**  

---

## API Endpoints

| Method | Endpoint        | Description                       |
|--------|----------------|-----------------------------------|
| GET    | /api/metrics   | Returns baseline metrics          |
| POST   | /api/simulate  | Runs simulation with user changes |

### POST /api/simulate Request Example
```json
{
  "conversionChange": 10,
  "dealSizeChange": 15,
  "salesCycleChange": -5
}
```

### Response Includes
- Baseline vs Simulated Revenue  
- Total Impact (₹ and %)  
- Key drivers of change  

---

## Features
- Real-time sliders with debounced auto-simulation  
- Manual "Run Simulation" option  
- Interactive cumulative revenue chart  
- Live comparison between baseline and scenario  
- Clean insights panel  
- Fully responsive design  

---

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Chart.js  
- **Backend:** Node.js + Express + TypeScript  
- **Visualization:** Chart.js  

---

## Project Structure
```
What-If-Revenue-Simulation-Engine/
├── backend/
├── frontend/
├── screenshots/
├── video/
└── README.md
```

---

## How to Run Locally

### Clone Repository
```bash
git clone https://github.com/anurag-yv/What-If-Revenue-Simulation-Engine.git
cd What-If-Revenue-Simulation-Engine
```

### Backend
```bash
cd backend
npm install
npm run build
npm start
```

### Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## Demo
Watch Demo Video: https://www.loom.com/share/c6e4b7c81c804455a217c61519e54d07

---

## Screenshots
<img src="./screenshots/controls.png" alt="Controls">
<img src="./screenshots/chart.png" alt="Chart">
<img src="./screenshots/insights.png" alt="Insights">
<img src="./screenshots/full-preview.png" alt="Full Preview">

---

## Assumptions
- Q1–Q2 data is used only for baseline calculation  
- Q3 contains the open pipeline deals  
- Conversion rate is applied uniformly  
- Sales cycle adjustment is linear  
- Revenue is shown as cumulative across weeks  

---

## Key Takeaways
- Conversion rate has the highest impact on revenue  
- Deal size directly scales total revenue  
- Shorter sales cycle brings revenue earlier  
- Combined changes create amplified results  

---

## Author
**Anurag Yadav**  
LinkedIn: https://linkedin.com/in/anurag-yv  
GitHub: https://github.com/anurag-yv  

⭐ If you liked this project, consider starring the repo!
