
# ♻️ Trashure: Turn Trash Into Treasure

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Poppins&size=28&duration=3000&pause=800&color=16A34A&center=true&vCenter=true&width=700&lines=AI-Powered+Circular+Economy+Platform;Turning+Waste+Into+Resources;Trash+Still+Has+Value+%F0%9F%8C%B1" alt="Trashure Animated Title"/>
</p>

<p align="center">
  <svg width="700" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">

```
<defs>
  <linearGradient id="green" x1="0" x2="1">
    <stop offset="0%" stop-color="#22c55e"/>
    <stop offset="100%" stop-color="#15803d"/>
  </linearGradient>

  <filter id="glow">
    <feGaussianBlur stdDeviation="4"/>
  </filter>
</defs>

<!-- Background -->
<rect width="700" height="220" rx="30" fill="#f0fdf4"/>

<!-- Animated Earth -->
<circle cx="350" cy="110" r="65" fill="#dcfce7"/>

<circle cx="350" cy="110" r="50"
        fill="none"
        stroke="url(#green)"
        stroke-width="8"
        stroke-dasharray="90 20">
  <animateTransform
    attributeName="transform"
    type="rotate"
    from="0 350 110"
    to="360 350 110"
    dur="8s"
    repeatCount="indefinite"/>
</circle>

<!-- Trash Bin -->
<g transform="translate(310 70)">
  <rect x="15" y="25" width="50" height="65" rx="8" fill="#16a34a"/>
  <rect x="8" y="18" width="65" height="8" rx="4" fill="#166534"/>
  <line x1="28" y1="40" x2="28" y2="75" stroke="white" stroke-width="4"/>
  <line x1="50" y1="40" x2="50" y2="75" stroke="white" stroke-width="4"/>
</g>

<!-- Leaves -->
<path d="M250 120 C210 70 160 90 190 140 C220 160 250 120 250 120"
      fill="#22c55e">
  <animate attributeName="opacity"
           values="0.4;1;0.4"
           dur="3s"
           repeatCount="indefinite"/>
</path>

<path d="M450 120 C490 70 540 90 510 140 C480 160 450 120 450 120"
      fill="#22c55e">
  <animate attributeName="opacity"
           values="1;0.4;1"
           dur="3s"
           repeatCount="indefinite"/>
</path>

<!-- Floating particles -->
<circle cx="150" cy="60" r="5" fill="#86efac">
  <animate attributeName="cy"
           values="60;35;60"
           dur="3s"
           repeatCount="indefinite"/>
</circle>

<circle cx="560" cy="70" r="5" fill="#86efac">
  <animate attributeName="cy"
           values="70;40;70"
           dur="4s"
           repeatCount="indefinite"/>
</circle>
```

  </svg>
</p>

<p align="center">
  <b>AI-powered material intelligence platform that discovers the hidden value of discarded materials.</b>
</p>

<p align="center">
Instead of asking:
<br/>
<b>"Where should I throw this?"</b>
<br/><br/>
Trashure asks:
<br/>
<b>"What can this material become?"</b>
</p>

<p align="center">
<img src="https://img.shields.io/badge/AI-Circular%20Economy-16a34a?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js"/>
<img src="https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase"/>
<img src="https://img.shields.io/badge/OpenAI-Vision%20API-412991?style=for-the-badge&logo=openai"/>
</p>

---

## 🌱 About Trashure

Trashure transforms waste management from a disposal system into a **circular recovery ecosystem**.

The platform uses AI vision technology to identify discarded materials and connect them with the highest-value pathway:

♻️ **Recycle**
🌱 **Reuse**
💰 **Sell**
🤝 **Donate**

Trashure does not simply identify trash.

It discovers what the material can become.


------------------------------------------------------------------------

## 🌍 Vision

Traditional waste systems ask:

> "Where should I throw this?"

Trashure asks:

> "What can this material become?"

Trashure transforms discarded materials into opportunities by connecting
residents, schools, communities, recyclers, junkshops, and LGUs through
an intelligent recovery ecosystem.

------------------------------------------------------------------------

# ✨ Core Concept

Trashure is not only a recycling application.

It is a **material intelligence and circular recovery platform**.

The system helps users:

-   🔎 Identify waste materials
-   💎 Understand hidden material value
-   🌱 Discover reuse opportunities
-   💰 Sell recoverable materials
-   🤝 Donate useful materials
-   ♻️ Connect with recycling pathways

------------------------------------------------------------------------

# 🏗 System Architecture

                     USER
                       |
                       |
                Upload Waste Image
                       |
                       |
              Next.js 15 Frontend
                       |
                       |
                 API Route
                       |
                       |
              OpenAI Vision API
                       |
                       |
            Material Classification
                       |
                       |
              Supabase PostgreSQL
                       |
                       |
         Circular Recommendation Engine
                       |
                       |
                 User Results
                       |
                       |
           Anonymous Waste Analytics
                       |
                       |
                LGU Dashboard

------------------------------------------------------------------------

# 🛠 Technology Stack

## Frontend

-   Next.js 15
-   TypeScript
-   Tailwind CSS
-   Shadcn UI
-   Lucide Icons

## Backend

-   Next.js App Router
-   Server Actions
-   API Routes

## Database

-   Supabase
-   PostgreSQL
-   Supabase Storage
-   Supabase Auth

## Artificial Intelligence

-   OpenAI Vision API

Used for:

-   Image recognition
-   Material classification
-   Circular recommendation generation

## Deployment

-   Vercel

------------------------------------------------------------------------

# 👥 User Roles

## 🏠 Resident

Capabilities:

-   Create account
-   Upload waste images
-   Receive AI analysis
-   View circular recommendations
-   Track environmental contribution

------------------------------------------------------------------------

## 🏫 School / Community Partner

Capabilities:

-   Receive donated materials
-   Create material requests
-   Support sustainability projects

Examples:

-   Eco-art projects
-   School gardening materials
-   Community activities

------------------------------------------------------------------------

## ♻️ Recycler / Junkshop Partner

Capabilities:

-   Register accepted materials
-   Provide estimated material value
-   Receive recycling opportunities

------------------------------------------------------------------------

## 🏛 LGU Administrator

Capabilities:

-   View waste analytics
-   Monitor barangay participation
-   Generate sustainability reports
-   Track recovery performance

------------------------------------------------------------------------

# 🗄 Database Design

## users

Stores user accounts.

Fields:

    id
    name
    email
    role
    barangay
    created_at

------------------------------------------------------------------------

## materials

Stores circular economy knowledge.

Fields:

    id
    material_name
    category
    recyclable
    reuse_options
    selling_information
    donation_options
    recycling_process

Example:

    Material:
    PET Plastic

    Reuse:
    - Plant container
    - Eco projects

    Sell:
    ₱20/kg

    Recycle:
    Plastic recovery facility

------------------------------------------------------------------------

## scans

Stores AI analysis results.

Fields:

    id
    user_id
    image_url
    detected_object
    material_type
    confidence_score
    recommended_action
    barangay
    created_at

------------------------------------------------------------------------

## impact_logs

Used for LGU analytics.

Fields:

    id
    material_type
    action_taken
    estimated_weight
    location
    created_at

------------------------------------------------------------------------

# 🤖 AI Vision Workflow

## Step 1: Upload

User uploads:

    plastic_bottle.jpg

Image is stored:

    Supabase Storage

    trashure-images/

    └── scans/
        └── plastic001.jpg

------------------------------------------------------------------------

## Step 2: AI Analysis

Trashure sends:

    Image
    +
    Circular Economy System Prompt

to OpenAI Vision API.

------------------------------------------------------------------------

## AI Prompt

    You are Trashure AI,
    a circular economy material intelligence assistant.

    Analyze the uploaded waste image.

    Identify:
    1. Object
    2. Material type
    3. Recyclability
    4. Reuse possibilities
    5. Selling opportunities
    6. Donation opportunities
    7. Recycling instructions

    Prioritize resource recovery.

    Return JSON only.

------------------------------------------------------------------------

# Example AI Response

``` json
{
 "object":"Plastic Bottle",
 "material":"PET Plastic",
 "category":"Plastic",
 "confidence":95,
 "recyclable":true,
 "reuse":[
   "Plant holder",
   "Storage container"
 ],
 "sell":{
   "estimated_value":"₱20/kg"
 },
 "donate":[
   "School projects"
 ],
 "recycle_instruction":
 "Clean bottle and bring to recycling collection point"
}
```

------------------------------------------------------------------------

# 🌱 Recommendation Engine

Trashure combines:

    AI Detection

    +

    Material Database

    +

    Partner Network

    =

    Circular Recommendation

------------------------------------------------------------------------

# 📱 User Experience

Example:

A resident scans a plastic bottle.

Trashure responds:

    Detected:

    PET Plastic Bottle

    Confidence:

    95%

Available actions:

## 🌱 REUSE

Create:

-   Plant holders
-   Storage containers
-   Eco projects

## 💰 SELL

Estimated value:

    ₱20/kg

## 🤝 DONATE

Possible partners:

-   Schools
-   Community projects

## ♻️ RECYCLE

Instruction:

Clean, separate, and bring to recovery facilities.

------------------------------------------------------------------------

# 🤝 Partner Network (Core Platform Value)

The AI scanner creates engagement.

The partner network creates impact.

Trashure connects users with:

## Nearby Junkshops

Answers:

-   Who accepts this material?
-   Current buying value?
-   Required condition?

## Schools and Communities

Answers:

-   Who needs donations?
-   What materials are requested?

## Collection Points

Answers:

-   Where can materials be delivered?
-   What schedule is available?

------------------------------------------------------------------------

# 📊 LGU Dashboard

Provides anonymous waste intelligence.

Metrics:

-   Waste materials detected
-   Barangay participation
-   Recovery volume
-   Recycling trends
-   Community contribution

Example:

    Plastic recovery increased by
    community participation.

    +35% recovery rate

------------------------------------------------------------------------

# 📂 Project Structure

    trashure/

    app/

    ├── page.tsx
    ├── scan/
    │   └── page.tsx
    ├── result/
    │   └── page.tsx
    ├── dashboard/
    │   └── page.tsx

    ├── api/
    │   └── analyze/
    │       └── route.ts


    components/

    ├── ui/

    ├── scanner/
    │   ├── UploadBox.tsx
    │   └── AIResult.tsx

    ├── dashboard/
    │   ├── StatsCard.tsx
    │   └── Charts.tsx


    lib/

    ├── supabase.ts
    ├── openai.ts
    └── aiPrompt.ts

------------------------------------------------------------------------

# 🚀 Development Roadmap

## Day 1

Setup:

-   Next.js
-   Supabase
-   Authentication
-   Database

## Day 2

Build:

-   Landing page
-   Dashboard
-   User interface

## Day 3

AI Integration:

-   Image upload
-   Vision API
-   JSON processing

## Day 4

Recommendation Engine:

-   Material database
-   Circular actions

## Day 5

LGU Dashboard:

-   Charts
-   Analytics
-   Reports

## Day 6

Testing:

Materials:

-   Plastic bottles
-   Tin cans
-   Cardboard
-   Glass
-   Electronics

## Day 7

Presentation:

Prepare:

-   Demo flow
-   Pitch
-   Impact story

------------------------------------------------------------------------

# 🔐 Development Principles

Trashure follows:

✅ TypeScript-first development\
✅ Reusable components\
✅ Clean architecture\
✅ Privacy protection\
✅ Anonymous waste analytics\
✅ Graceful AI error handling\
✅ LGU-ready design

------------------------------------------------------------------------

# 🎯 Final Demo Story

A resident finds a plastic bottle.

They scan it.

Trashure responds:

> "This is PET Plastic. It still has value."

The platform recommends:

🌱 Reuse\
💰 Sell\
🤝 Donate\
♻️ Recycle

Meanwhile, the LGU dashboard learns:

> "Community participation increased material recovery."

Trashure transforms waste management from disposal into recovery.

------------------------------------------------------------------------

# 🌏 Mission

**Trashure turns discarded materials into community resources by
connecting AI, people, and circular economy systems.**

♻️ Less waste.\
🌱 More value.\
🤝 Stronger communities.
