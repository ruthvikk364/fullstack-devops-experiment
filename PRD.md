# PRD: AI-Powered Fitness & Personal Coach Platform

**Version:** 1.0
**Date:** 2026-03-13
**Status:** Draft

---

## 1. Product Overview

### 1.1 Vision
An AI-powered fitness and personal coaching platform that provides personalized workout plans, nutrition guidance, progress tracking, and real-time coaching — all driven by Claude AI with function calling (tool use), RAG (Retrieval-Augmented Generation), and external API integrations.

### 1.2 Problem Statement
- Generic fitness apps offer one-size-fits-all workout plans that don't adapt to individual goals, injuries, or progress.
- Users lack access to affordable personal trainers who can provide 24/7 guidance.
- Nutrition tracking is tedious and disconnected from workout planning.
- Wearable data (heart rate, sleep, steps) exists but isn't intelligently integrated into coaching decisions.

### 1.3 Solution
An AI coach that:
- Understands your body, goals, injuries, and preferences through conversational onboarding
- Generates and adapts workout/nutrition plans using structured tool calls
- Retrieves evidence-based exercise and nutrition data via RAG
- Integrates with wearables and external APIs for real-time context
- Learns and improves recommendations over time based on user feedback and progress

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                     │
│  Chat UI │ Dashboard │ Workout Logger │ Progress Charts  │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐      ┌──────────▼──────────┐
│  NestJS Backend │      │  FastAPI Backend     │
│  (API Gateway)  │      │  (AI/ML Engine)      │
│                 │      │                      │
│ • Auth/Users    │      │ • Claude AI Agent    │
│ • CRUD APIs     │      │ • Function Tools     │
│ • WebSocket     │      │ • RAG Pipeline       │
│ • Session Mgmt  │      │ • Embeddings         │
│ • Notifications │      │ • External API Calls │
└───────┬─────────┘      └──────────┬───────────┘
        │                           │
        └─────────┬─────────────────┘
                  │
    ┌─────────────┼──────────────┐
    │             │              │
┌───▼───┐  ┌─────▼─────┐  ┌────▼────┐
│PostgreSQL│ │ Vector DB │  │  Redis  │
│(Users,   │ │(Qdrant/   │  │(Cache,  │
│ Plans,   │ │ Pinecone) │  │ Session)│
│ Logs)    │ │           │  │         │
└──────────┘ └───────────┘  └─────────┘
```

### 2.1 Service Responsibilities

| Service | Role | Tech |
|---------|------|------|
| **Frontend** | Chat interface, dashboards, workout logging, progress visualization | Next.js, TailwindCSS, Chart.js |
| **NestJS Backend** | API gateway, auth, user management, CRUD, WebSocket for real-time chat | NestJS, TypeORM, Passport.js |
| **FastAPI Backend** | AI engine — Claude tool use orchestration, RAG pipeline, embeddings, external API integrations | FastAPI, Anthropic SDK, LangChain |
| **PostgreSQL** | Relational data — users, workout plans, exercise logs, nutrition logs, goals | PostgreSQL 16 |
| **Vector DB** | Embedding storage for RAG — exercise database, nutrition database, research papers | Qdrant (self-hosted) or Pinecone |
| **Redis** | Caching, session management, rate limiting, conversation history buffer | Redis 7 |

---

## 3. Function Tools (Claude Tool Use)

These are the **structured tools** that the Claude AI agent can invoke during a conversation. Each tool is a function with defined input/output schemas that Claude calls to perform actions.

### 3.1 Workout Tools

| Tool Name | Description | Input Parameters | Output |
|-----------|-------------|------------------|--------|
| `generate_workout_plan` | Creates a personalized workout plan based on user profile and goals | `goal`, `fitness_level`, `available_days`, `equipment`, `duration_weeks`, `injuries` | Structured workout plan (JSON) with exercises, sets, reps, rest periods |
| `modify_workout` | Adjusts an existing workout based on feedback | `workout_id`, `modification_type` (harder/easier/substitute), `reason`, `target_muscle_group` | Modified workout plan |
| `log_workout` | Records a completed workout session | `workout_id`, `exercises_completed[]`, `actual_sets`, `actual_reps`, `actual_weight`, `rpe`, `notes` | Confirmation + progress update |
| `get_exercise_alternatives` | Suggests substitute exercises (e.g., for injuries or equipment limitations) | `exercise_name`, `reason` (injury/equipment/preference), `target_muscle_group` | List of alternative exercises with instructions |
| `calculate_training_volume` | Computes weekly volume per muscle group | `user_id`, `date_range` | Volume metrics per muscle group |
| `generate_deload_week` | Creates a recovery/deload week plan | `user_id`, `current_program_id`, `fatigue_indicators` | Deload workout plan |

### 3.2 Nutrition Tools

| Tool Name | Description | Input Parameters | Output |
|-----------|-------------|------------------|--------|
| `generate_meal_plan` | Creates a daily/weekly meal plan aligned with fitness goals | `calorie_target`, `macro_split`, `dietary_restrictions`, `cuisine_preferences`, `meal_count` | Structured meal plan with recipes |
| `log_meal` | Records food intake | `meal_type` (breakfast/lunch/dinner/snack), `food_items[]`, `quantities[]`, `timestamp` | Nutrition summary (calories, macros) |
| `calculate_daily_nutrition` | Summarizes nutrition for a given day | `user_id`, `date` | Calories, protein, carbs, fat, micronutrients |
| `lookup_food_nutrition` | Looks up nutritional info for a food item | `food_name`, `quantity`, `unit` | Detailed nutritional breakdown |
| `adjust_calorie_target` | Recalculates calorie targets based on progress | `user_id`, `current_weight`, `goal_weight`, `activity_level`, `timeline` | New calorie/macro targets |
| `suggest_supplements` | Recommends supplements based on goals and deficiencies | `user_id`, `goals`, `current_diet_analysis`, `blood_work_data` | Supplement recommendations with dosages |

### 3.3 Progress & Analytics Tools

| Tool Name | Description | Input Parameters | Output |
|-----------|-------------|------------------|--------|
| `get_progress_summary` | Retrieves user progress over time | `user_id`, `metric_type` (weight/strength/body_comp), `date_range` | Progress data with trend analysis |
| `predict_progress` | Projects future progress based on current trajectory | `user_id`, `goal`, `current_metrics` | Predicted timeline and milestones |
| `analyze_workout_consistency` | Evaluates adherence to the plan | `user_id`, `date_range` | Consistency score, missed workouts, patterns |
| `generate_progress_report` | Creates a comprehensive weekly/monthly report | `user_id`, `report_type` (weekly/monthly), `date_range` | Formatted report with charts data |
| `compare_performance` | Compares performance across time periods | `user_id`, `exercise_name`, `period_1`, `period_2` | Performance delta analysis |

### 3.4 User Profile Tools

| Tool Name | Description | Input Parameters | Output |
|-----------|-------------|------------------|--------|
| `update_user_profile` | Updates user fitness profile | `user_id`, `field`, `value` (weight, height, goals, injuries, etc.) | Updated profile confirmation |
| `assess_fitness_level` | Evaluates current fitness level through questionnaire | `user_id`, `assessment_responses[]` | Fitness level classification + baseline metrics |
| `set_goal` | Creates or updates a fitness goal | `user_id`, `goal_type` (weight_loss/muscle_gain/endurance/strength), `target`, `deadline` | Goal confirmation with plan outline |
| `log_body_measurement` | Records body measurements | `user_id`, `measurement_type`, `value`, `date` | Measurement logged + trend |

### 3.5 Scheduling & Reminder Tools

| Tool Name | Description | Input Parameters | Output |
|-----------|-------------|------------------|--------|
| `schedule_workout` | Schedules a workout session | `user_id`, `workout_id`, `date`, `time`, `reminder_before` | Calendar event created |
| `get_today_plan` | Retrieves today's workout and meal plan | `user_id` | Today's full plan |
| `send_motivation` | Sends a motivational message/tip based on context | `user_id`, `context` (missed_workout/plateau/milestone) | Personalized message |

---

## 4. RAG (Retrieval-Augmented Generation) System

### 4.1 What is RAG in This Context?

RAG allows the AI coach to retrieve **factual, evidence-based fitness and nutrition information** from curated knowledge bases before generating responses. Instead of relying solely on the LLM's training data (which can hallucinate or be outdated), RAG grounds responses in verified sources.

### 4.2 RAG Knowledge Bases

| Knowledge Base | Content | Source | Update Frequency |
|----------------|---------|--------|------------------|
| **Exercise Database** | 1,500+ exercises with instructions, muscle groups, difficulty, video links, common mistakes | ExRx.net, ACE, NSCA certified sources | Monthly |
| **Nutrition Database** | Food items, macros, micros, glycemic index, allergens | USDA FoodData Central, Open Food Facts | Weekly |
| **Training Science** | Periodization principles, progressive overload, recovery science, hypertrophy research | PubMed abstracts, NSCA/ACSM position papers | Quarterly |
| **Injury & Rehab** | Common injuries, contraindicated exercises, modification protocols, rehab progressions | Physical therapy guidelines, sports medicine literature | Quarterly |
| **Supplement Evidence** | Supplement efficacy data, dosages, interactions, evidence grades | Examine.com data, systematic reviews | Quarterly |
| **Recipe Database** | Healthy recipes with macros, prep time, difficulty, dietary tags | Curated recipe collection | Ongoing |

### 4.3 RAG Pipeline Architecture

```
User Query: "What's a good substitute for barbell squats? I have a knee injury"
                │
                ▼
┌──────────────────────────┐
│  1. QUERY PROCESSING     │
│  • Extract intent         │
│  • Identify entities      │
│    (barbell squat, knee)  │
│  • Generate embedding     │
└───────────┬──────────────┘
            ▼
┌──────────────────────────┐
│  2. RETRIEVAL            │
│  • Search Exercise DB     │
│    → squat variations     │
│  • Search Injury DB       │
│    → knee-safe exercises  │
│  • Hybrid search:         │
│    semantic + keyword     │
│  • Re-rank top-k results  │
└───────────┬──────────────┘
            ▼
┌──────────────────────────┐
│  3. AUGMENTATION         │
│  • Inject retrieved docs  │
│    into Claude's context  │
│  • Add user profile       │
│    (injury details, etc.) │
│  • Apply safety filters   │
└───────────┬──────────────┘
            ▼
┌──────────────────────────┐
│  4. GENERATION           │
│  • Claude generates       │
│    response grounded in   │
│    retrieved evidence     │
│  • May call tools like    │
│    get_exercise_alts()    │
│  • Cites sources          │
└──────────────────────────┘
```

### 4.4 Embedding & Indexing Strategy

- **Embedding Model:** `voyage-3` or `text-embedding-3-large` (OpenAI)
- **Chunking:** 512 tokens with 50-token overlap
- **Metadata:** Each chunk tagged with `category`, `muscle_group`, `difficulty`, `equipment`, `source`, `last_updated`
- **Vector Store:** Qdrant (self-hosted in Docker) or Pinecone (managed)
- **Hybrid Search:** Combine dense vector similarity with BM25 sparse retrieval for best results
- **Re-ranking:** Cross-encoder re-ranker on top-20 results → return top-5

---

## 5. External API Integrations (Tools with External APIs)

These tools make real-time calls to third-party APIs to enrich the AI coach with live data.

### 5.1 Wearable & Health Data APIs

| API | Purpose | Data Points | Integration Method |
|-----|---------|-------------|-------------------|
| **Google Fit API** | Activity and health metrics | Steps, heart rate, sleep, calories burned, workouts | OAuth2, REST API |
| **Apple HealthKit** (via backend sync) | iOS health data | Same as above + HRV, VO2 max estimates | HealthKit → backend sync |
| **Fitbit Web API** | Wearable data | Heart rate zones, sleep stages, active minutes, SpO2 | OAuth2, REST API |
| **Garmin Connect API** | Advanced training metrics | Training load, recovery time, VO2 max, body battery | OAuth2, REST API |
| **Whoop API** | Recovery and strain | Strain score, recovery score, HRV, sleep performance | OAuth2, REST API |

**Tool:** `sync_wearable_data`
```json
{
  "name": "sync_wearable_data",
  "description": "Fetches latest health/activity data from user's connected wearable",
  "input_schema": {
    "user_id": "string",
    "provider": "google_fit | fitbit | garmin | whoop",
    "data_types": ["steps", "heart_rate", "sleep", "calories", "hrv"],
    "date_range": { "start": "date", "end": "date" }
  },
  "output": "Structured health metrics for the requested period"
}
```

### 5.2 Nutrition APIs

| API | Purpose | Use Case |
|-----|---------|----------|
| **USDA FoodData Central API** | Comprehensive food nutrition data | When user logs food → look up exact macro/micronutrient data |
| **Edamam Nutrition API** | Recipe analysis, food database | Analyze custom recipes, parse natural language food descriptions |
| **Open Food Facts API** | Barcode-based food lookup | Scan packaged food barcode → instant nutrition info |
| **Spoonacular API** | Recipe search and meal planning | Find recipes matching macro targets and dietary restrictions |

**Tool:** `search_food_database`
```json
{
  "name": "search_food_database",
  "description": "Searches external nutrition databases for food item details",
  "input_schema": {
    "query": "string (e.g., 'grilled chicken breast 200g')",
    "barcode": "string (optional, for packaged foods)",
    "provider": "usda | edamam | open_food_facts"
  },
  "output": "Detailed nutritional information per serving"
}
```

### 5.3 Exercise & Content APIs

| API | Purpose | Use Case |
|-----|---------|----------|
| **YouTube Data API** | Exercise demonstration videos | Fetch tutorial videos for exercises in workout plans |
| **ExerciseDB API** (via RapidAPI) | Exercise database with GIFs | Provide visual exercise demonstrations |
| **Wger API** | Open-source exercise database | Backup exercise data source |

**Tool:** `get_exercise_demo`
```json
{
  "name": "get_exercise_demo",
  "description": "Fetches exercise demonstration video/GIF from external sources",
  "input_schema": {
    "exercise_name": "string",
    "format": "video | gif | image"
  },
  "output": "URL to exercise demonstration media"
}
```

### 5.4 Weather & Location APIs

| API | Purpose | Use Case |
|-----|---------|----------|
| **OpenWeatherMap API** | Current weather data | Suggest indoor vs outdoor workouts based on weather |
| **Google Maps/Places API** | Nearby gym/park finder | Recommend workout locations when traveling |

**Tool:** `check_weather_for_workout`
```json
{
  "name": "check_weather_for_workout",
  "description": "Checks weather to recommend indoor vs outdoor workout",
  "input_schema": {
    "location": "string or lat/lng",
    "workout_time": "datetime"
  },
  "output": "Weather conditions + indoor/outdoor recommendation"
}
```

### 5.5 Communication APIs

| API | Purpose | Use Case |
|-----|---------|----------|
| **Twilio / SendGrid** | SMS and email notifications | Workout reminders, weekly reports, motivational messages |
| **Firebase Cloud Messaging** | Push notifications | Real-time workout reminders on mobile |
| **Google Calendar API** | Calendar integration | Sync workout schedule to user's calendar |

---

## 6. Data Models

### 6.1 Core Entities (PostgreSQL)

```
User
├── id (UUID, PK)
├── email
├── password_hash
├── name
├── date_of_birth
├── gender
├── height_cm
├── current_weight_kg
├── goal_weight_kg
├── fitness_level (beginner/intermediate/advanced)
├── primary_goal (weight_loss/muscle_gain/endurance/strength/general_health)
├── injuries[] (JSON)
├── dietary_restrictions[] (JSON)
├── connected_wearables[] (JSON)
├── created_at
└── updated_at

WorkoutPlan
├── id (UUID, PK)
├── user_id (FK → User)
├── name
├── goal
├── duration_weeks
├── days_per_week
├── difficulty_level
├── is_active (boolean)
├── created_at
└── updated_at

WorkoutDay
├── id (UUID, PK)
├── plan_id (FK → WorkoutPlan)
├── day_of_week
├── focus (push/pull/legs/upper/lower/full_body/cardio/rest)
└── order

PlannedExercise
├── id (UUID, PK)
├── workout_day_id (FK → WorkoutDay)
├── exercise_name
├── sets
├── reps_min
├── reps_max
├── rest_seconds
├── rpe_target
├── notes
└── order

WorkoutLog
├── id (UUID, PK)
├── user_id (FK → User)
├── workout_day_id (FK → WorkoutDay)
├── started_at
├── completed_at
├── overall_rpe
├── notes
└── mood (1-5)

ExerciseLog
├── id (UUID, PK)
├── workout_log_id (FK → WorkoutLog)
├── exercise_name
├── set_number
├── reps
├── weight_kg
├── rpe
└── notes

MealPlan
├── id (UUID, PK)
├── user_id (FK → User)
├── date
├── calorie_target
├── protein_target_g
├── carbs_target_g
├── fat_target_g
└── is_active

MealLog
├── id (UUID, PK)
├── user_id (FK → User)
├── meal_type (breakfast/lunch/dinner/snack)
├── food_items (JSON)
├── total_calories
├── total_protein_g
├── total_carbs_g
├── total_fat_g
├── timestamp
└── photo_url

BodyMeasurement
├── id (UUID, PK)
├── user_id (FK → User)
├── date
├── weight_kg
├── body_fat_percentage
├── chest_cm
├── waist_cm
├── hips_cm
├── bicep_cm
└── thigh_cm

Goal
├── id (UUID, PK)
├── user_id (FK → User)
├── type
├── target_value
├── current_value
├── deadline
├── status (active/achieved/abandoned)
├── created_at
└── updated_at

ConversationHistory
├── id (UUID, PK)
├── user_id (FK → User)
├── role (user/assistant)
├── content (text)
├── tool_calls (JSON, nullable)
├── tool_results (JSON, nullable)
├── tokens_used
└── timestamp

WearableSync
├── id (UUID, PK)
├── user_id (FK → User)
├── provider
├── data_type
├── data (JSON)
├── synced_at
└── date
```

---

## 7. API Endpoints

### 7.1 NestJS Backend (API Gateway)

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/refresh
  POST   /api/auth/logout

Users
  GET    /api/users/me
  PATCH  /api/users/me
  POST   /api/users/me/onboarding
  GET    /api/users/me/dashboard

Workouts
  GET    /api/workouts/plans
  GET    /api/workouts/plans/:id
  POST   /api/workouts/plans
  PATCH  /api/workouts/plans/:id
  DELETE /api/workouts/plans/:id
  POST   /api/workouts/log
  GET    /api/workouts/logs?date_range=...
  GET    /api/workouts/today

Nutrition
  GET    /api/nutrition/meal-plans
  POST   /api/nutrition/meal-plans
  POST   /api/nutrition/log-meal
  GET    /api/nutrition/daily-summary?date=...
  GET    /api/nutrition/food-search?q=...

Progress
  GET    /api/progress/summary?type=...&range=...
  POST   /api/progress/body-measurement
  GET    /api/progress/body-measurements
  GET    /api/progress/charts/:metric

Goals
  GET    /api/goals
  POST   /api/goals
  PATCH  /api/goals/:id
  DELETE /api/goals/:id

Wearables
  POST   /api/wearables/connect/:provider
  DELETE /api/wearables/disconnect/:provider
  POST   /api/wearables/sync
  GET    /api/wearables/data?type=...&range=...
```

### 7.2 FastAPI Backend (AI Engine)

```
Chat / AI Coach
  POST   /api/ai/chat              → Main conversational endpoint (streams response)
  GET    /api/ai/conversations      → List user conversations
  GET    /api/ai/conversations/:id  → Get conversation history
  DELETE /api/ai/conversations/:id  → Delete conversation

Tool Execution (internal, called by AI agent)
  POST   /api/ai/tools/execute      → Execute a tool call from Claude

RAG
  POST   /api/rag/ingest            → Ingest documents into vector store
  POST   /api/rag/search            → Search vector store (for debugging/admin)
  GET    /api/rag/sources            → List indexed sources
  DELETE /api/rag/sources/:id       → Remove a source

Embeddings
  POST   /api/embeddings/generate   → Generate embeddings for text

Health
  GET    /api/health                → Health check
```

---

## 8. User Flows

### 8.1 Onboarding Flow
1. User signs up → basic profile (name, email, password)
2. Conversational onboarding with AI coach:
   - "What are your fitness goals?"
   - "Do you have any injuries or limitations?"
   - "What equipment do you have access to?"
   - "How many days per week can you train?"
   - "Any dietary restrictions?"
3. AI calls `assess_fitness_level` tool → classifies user
4. AI calls `generate_workout_plan` tool → creates first plan
5. AI calls `generate_meal_plan` tool → creates nutrition plan
6. AI calls `set_goal` tool → establishes measurable goals
7. User is taken to dashboard with their plan

### 8.2 Daily Workout Flow
1. User opens app → AI greets with `get_today_plan` tool
2. User starts workout → real-time logging
3. User can ask mid-workout: "This is too heavy" → AI calls `modify_workout`
4. User completes workout → `log_workout` tool records it
5. AI provides post-workout summary + encouragement
6. If wearable connected → `sync_wearable_data` for heart rate analysis

### 8.3 Nutrition Tracking Flow
1. User says "I had a chicken salad for lunch"
2. AI parses → calls `search_food_database` (Edamam API)
3. Calculates macros → calls `log_meal`
4. Shows daily progress toward targets
5. Suggests dinner options to hit remaining macros → `generate_meal_plan`

### 8.4 Progress Check-in Flow
1. Weekly: AI proactively sends check-in (via notification)
2. User logs weight → `log_body_measurement`
3. AI calls `get_progress_summary` → analyzes trends
4. AI calls `predict_progress` → projects timeline
5. If plateau detected → AI adjusts plan (`modify_workout`, `adjust_calorie_target`)

---

## 9. Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16, React 19, TailwindCSS 4 | SSR, great DX, existing setup |
| API Gateway | NestJS 11 | TypeScript, modular architecture, WebSocket support |
| AI Engine | FastAPI (Python) | Best ecosystem for AI/ML, Anthropic SDK, LangChain |
| AI Model | Claude (via Anthropic API) | Superior tool use, long context, safety |
| Database | PostgreSQL 16 | Relational data, JSONB for flexible fields |
| Vector DB | Qdrant | Open-source, self-hosted, good performance |
| Cache | Redis 7 | Session management, rate limiting, conversation buffer |
| Auth | JWT + Passport.js | Industry standard, stateless |
| Containerization | Docker + Docker Compose | Already in place, easy local dev |
| CI/CD | GitHub Actions | Standard, free for public repos |
| Monitoring | Prometheus + Grafana | Observability for all services |

---

## 10. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- [ ] Set up PostgreSQL + Redis in docker-compose
- [ ] User auth (register/login/JWT) in NestJS
- [ ] User profile CRUD in NestJS
- [ ] Basic Claude chat endpoint in FastAPI (no tools yet)
- [ ] Chat UI in Next.js (streaming responses)
- [ ] Conversational onboarding flow

### Phase 2: Core Tools (Weeks 4-6)
- [ ] Implement workout tools (`generate_workout_plan`, `log_workout`, `modify_workout`)
- [ ] Implement nutrition tools (`generate_meal_plan`, `log_meal`, `calculate_daily_nutrition`)
- [ ] Implement profile tools (`update_user_profile`, `set_goal`)
- [ ] Connect tools to Claude via function calling
- [ ] Workout logging UI
- [ ] Nutrition logging UI

### Phase 3: RAG System (Weeks 7-8)
- [ ] Set up Qdrant in docker-compose
- [ ] Build ingestion pipeline for exercise database
- [ ] Build ingestion pipeline for nutrition database
- [ ] Implement hybrid search (semantic + keyword)
- [ ] Integrate RAG into Claude's context
- [ ] Test and tune retrieval quality

### Phase 4: External APIs (Weeks 9-10)
- [ ] Google Fit / Fitbit integration
- [ ] USDA / Edamam nutrition API integration
- [ ] Exercise demo API integration (ExerciseDB)
- [ ] Weather API for outdoor workout suggestions
- [ ] Google Calendar sync

### Phase 5: Analytics & Intelligence (Weeks 11-12)
- [ ] Progress tracking tools (`get_progress_summary`, `predict_progress`)
- [ ] Dashboard with charts (weight, strength, consistency)
- [ ] Weekly automated check-ins
- [ ] Smart plan adjustments based on progress
- [ ] Notification system (email/push)

### Phase 6: Polish & Deploy (Weeks 13-14)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment (AWS/GCP)
- [ ] CI/CD pipeline
- [ ] Monitoring & alerting setup

---

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response time (AI chat) | < 3s to first token (streaming) |
| Response time (CRUD APIs) | < 200ms p95 |
| Availability | 99.5% uptime |
| Concurrent users | 1,000 initially |
| Data retention | User data retained until account deletion |
| Security | OWASP Top 10 compliance, encrypted at rest + in transit |
| GDPR | User data export + deletion on request |
| Rate limiting | 60 AI requests/hour per user |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| AI gives dangerous fitness/medical advice | Disclaimer system, injury-aware guardrails, RAG grounding in certified sources |
| API costs (Claude) escalate | Conversation caching, shorter contexts, tiered usage limits |
| Wearable API changes/deprecation | Abstraction layer, multiple provider support |
| RAG retrieval quality is poor | Hybrid search, re-ranking, continuous evaluation, manual curation |
| User data privacy concerns | End-to-end encryption, GDPR compliance, transparent data usage policy |

---

## 13. Success Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| User retention (30-day) | > 40% |
| Weekly active users | > 500 |
| Workouts logged per user per week | > 3 |
| Meal logs per user per day | > 2 |
| AI coach satisfaction rating | > 4.2/5 |
| Goal completion rate | > 25% |
