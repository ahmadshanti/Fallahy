# من الأرض (From The Land) — 6-Minute Pitch Script

Hackathon submission. Times below assume you're hitting marks; if you fall behind,
cut from section 4, never from the demo (section 3).

---

## 1. Hook & Problem — 0:00 → 1:15 (1–2 slides)

**Opening line (the hook — say it out loud first, before anything on screen):**

> "البندورة بالسوق بـ 5 شيكل... وعند المزارع بـ 3 شيكل. مين عم ياخد الفرق؟"
>
> *"Tomatoes at the market cost 5 shekels. The same tomatoes at the farm cost 3.
> Who's taking the difference?"*

**Slide 1 — The problem (one visual, three numbers):**

- **40%** of every shekel a Palestinian family spends on produce goes to
  wholesalers, not the farmer who grew it.
- **2,300+** smallholder farmers in the West Bank sell below cost during peak
  harvest because they have no direct line to buyers.
- **0** Arabic-first apps connect them directly. WhatsApp is the closest thing,
  and it has no inventory, no pricing transparency, no trust signals.

**Why hasn't this been solved?**
- Existing food-delivery apps (Talabat, Careem) ignore farmers — they list
  restaurants and supermarkets only.
- Generic marketplaces (Souq, Amazon) are English-first and don't speak the
  local idiom (RTL, dialect, units like "طرد" and "ليتر").
- Farmers don't have tech literacy to manage a digital storefront. **That's the
  real moat — and we solved it with voice.**

**Engagement beat (use this if the room is quiet):**
> "ارفعوا إيدكم: مين فيكم اشترى خضرة هاد الأسبوع؟ كم دفعت كيلو البندورة؟"
> ("Raise your hand: who bought vegetables this week? How much did you pay
> per kilo?") — let them shout numbers, then say:
> "كل واحد فيكم دفع ضعف اللي بياخده المزارع. هاد اللي بدنا نغيره."
> ("Each of you paid double what the farmer received. That's what we're changing.")

---

## 2. The Solution — 1:15 → 2:15 (1 slide)

**Slide 2 — Value proposition (no jargon, all impact):**

> **من الأرض** — an Arabic-first, voice-driven marketplace that connects
> Palestinian families directly to local farmers. Fresher produce, **40% cheaper**,
> 100% to the farmer.

**Three bullets, that's it:**
- For **buyers**: Live prices, nearby farmers on a map, AI assistant in Arabic,
  buy directly with no middleman markup.
- For **farmers**: Add a product by **speaking** ("ضيف بندورة بلدية كيلو بثلاث
  شيكل") — the AI fills the form. Smart alerts when prices drop or stock is low.
- A **unique** "Adopt a Tree" feature where a buyer sponsors a real olive or fig
  tree for a year and receives the full harvest — supports family farms that
  the marketplace alone can't.

**One-line that sticks:**
> "اللي يقدر يحكي عربي، يقدر يبيع. اللي عنده تيلفون، يقدر يشتري."
> *"If you can speak Arabic, you can sell. If you have a phone, you can buy."*

---

## 3. The Demo — 2:15 → 4:00 (live + screenshots backup)

**Persona: Um Ahmad, a mom in Ramallah, and Abu Yousef, a farmer in Jenin.**

Open Expo Go on the phone, already loaded. Use the dev-role picker for speed
(no OTP friction during demo).

### Beat 1 (15s) — Buyer home, the live price ticker
> "هاي أم أحمد. أول ما تفتح التطبيق، بتشوف أسعار اليوم مباشرة من السوق."

- Show the **scrolling price ticker** at the top (live data from Rwan's Python
  backend → Azure Maps + analytics).
- Point at the **green tile "تبنّى شجرة"** and the **gold tile "اقطف بنفسك"**.

### Beat 2 (20s) — AI chatbot
> "محتاجة مساعدة؟ بتضغط هون."

- Tap the **purple ✨ floating button** bottom-left.
- Ask in Arabic: "شو أفضل سعر للبندورة اليوم؟"
- Claude responds in Arabic, suggests farmers.

### Beat 3 (25s) — Map with Azure
> "بدها تشوف وين أقرب مزارع؟"

- Open the map tab.
- Markers + distance in km, small "Azure Maps" badge bottom-right proves it's
  live (not mocked).
- Tap a farmer → bottom sheet → "مراسلة" (message) button.

### Beat 4 (25s) — Adopt-a-tree with Replicate
> "وهاد اللي بنفتخر فيه — تبنّى شجرة وشوفها بكل موسم بالذكاء الاصطناعي."

- Back to home → tap **"تبنّى شجرة"** tile.
- Tap **"تصوّر"** on the olive tree.
- Select **"الصيف"** → Replicate generates a photoreal image of the tree in
  summer (5–10s wait — fill with: *"هاي مش صورة محفوظة. الذكاء الاصطناعي عم
  يولّدها الحين بناءً على وصف الشجرة والموسم."*).
- Switch to **"الشتاء"** → regenerate, different image.

### Beat 5 (30s) — Farmer side, voice input
> "وهاي الجزء اللي بصدمكم — كيف المزارع بضيف منتجاته بدون ما يكتب."

- Go back, dev-role picker → **"الدخول كمزارع"**.
- Open **"إضافة منتج"** from farmer dashboard.
- Tap the green **mic button** at the top.
- Speak: **"ضيف بندورة بلدية كيلو بثلاث شيكل مية وخمسين كيلو متوفر"**
- Watch the form auto-fill: name "بندورة بلدية", price 3, quantity 150.
- Tap "نشر المنتج".
- *"المزارع ما لزّم يكتب حرف. هاد بيخلي التطبيق فعلاً وصلي للقرى."*

### Beat 6 (10s) — Farmer dashboard with AI insights
> "ومين بيقول للمزارع كيف يبيع أحسن؟ الذكاء الاصطناعي."

- Show **"توقع اليوم بالذكاء الاصطناعي ₪X"** purple banner.
- Point at the AI smart alerts list ("سعر الخيار بالسوق نزل 12% — عدّل سعرك").

**If anything breaks during live demo:** switch to the prerecorded MP4 in your
laptop's Quick Look. Keep talking — the audience won't notice you swapped.

---

## 4. Technical Architecture — 4:00 → 5:00 (1 slide)

**Slide 4 — Block diagram (left to right):**

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────┐
│  Expo App   │──────│   Supabase       │──────│  PostgreSQL    │
│ (RN 0.81,   │      │ Auth + Realtime  │      │  + Row Level   │
│  SDK 54)    │      │ + Storage + RLS  │      │   Security     │
└──────┬──────┘      └──────────────────┘      └────────────────┘
       │
       │ HTTPS
       ▼
┌─────────────────────────────────────────────────────────────┐
│         Rwan's AI/Data Service (FastAPI on Render)          │
│  /api/ai/chat ──→ Anthropic Claude                          │
│  /api/voice/transcribe ──→ Azure Speech                     │
│  /api/voice/parse-product ──→ Claude (structured output)    │
│  /api/maps/nearby-farmers ──→ Azure Maps + Haversine        │
│  /api/analytics/* ──→ pandas + market price dataset         │
└─────────────────────────────────────────────────────────────┘
       │
       │ direct from app
       ▼
┌────────────────────────────────────────┐
│  Replicate (flux-schnell) — tree image │
│  generation for adopt-tree visualizer  │
└────────────────────────────────────────┘
```

**What we shipped (be specific, this is the engineering credibility moment):**

| Component | Status | Notes |
|---|---|---|
| Expo app, 50+ screens | ✅ Live | Buyer + farmer flows, RTL, expo-router v6 |
| Supabase backend | ✅ Live | Real DB with `users`, `farmers`, `products`, `orders`, `messages`, `trees`, `adopted_trees` |
| Python AI service | ✅ Deployed on Render | 9 endpoints, FastAPI, Swagger at `/docs` |
| Claude AI chatbot | ✅ Live | Floating button on buyer home + chat tab |
| Voice → product (farmer) | ✅ Live | Azure Speech + Claude structured parse |
| Replicate tree visualizer | ✅ Live | flux-schnell, 4–10s per image |
| Azure Maps nearby farmers | ✅ Live | Falls back to Haversine if Azure quota hits |
| Live price ticker | ✅ Live | Real-time analytics from Render service |
| Buyer↔farmer messaging | ✅ Live | Real-time via Supabase Realtime |
| Adopt-a-tree | ✅ Live | DB-backed in prod, local zustand in dev mode |

**Honest about what's mocked:**
- Payment is currently UI-only (no Stripe / fawateercom integration yet)
- The 4 hardcoded heritage trees in the visualizer are placeholders; real
  farmer-posted trees flow through the same screen once they upload them
- Buyer-side voice ordering (`voice/parse-order`) endpoint exists but UI isn't
  wired — we ran out of time

**What was hard:**
- Getting Arabic right end-to-end (RTL, dialect, fonts). We use Cairo for the
  display family and force `I18nManager.forceRTL(true)`.
- Polling Replicate without freezing the JS thread on slow connections —
  we set Replicate's `Prefer: wait=30` header so the first request usually
  returns the image inline instead of needing a polling loop.
- Making the AI features degrade gracefully — every endpoint has a Supabase
  or local fallback, so the app works even when Render is sleeping.

---

## 5. Future Scope & Viability — 5:00 → 5:30 (1 slide)

**Slide 5 — 3 bullets + a number:**

**Next sprint (1 week):**
- **Stripe + fawateercom** for in-app payments (currently UI-only).
- **Buyer voice ordering** — wire the `voice/parse-order` endpoint into the
  cart screen.
- **Price-trend charts** on product detail (`/api/analytics/price-trend` is
  ready, just no chart UI yet).

**Quarter 1:**
- **Logistics layer** — local delivery drivers, route optimization with the
  Azure Maps integration we already have.
- **WhatsApp business handoff** — the `transfer_to_whatsapp: true` flag in
  Claude's response is already there; we just need WhatsApp Business API
  approval to route the conversation.
- **Real-time inventory** — Supabase Realtime already wired for messages;
  extend to product `quantity_available` so buyers see stock change live.

**Market potential (the number):**
- **2.7M Palestinians** in the West Bank + Gaza
- **~600K households** buy fresh produce weekly (~$22/wk = $13M/wk market)
- At a 5% take rate as a marketplace fee, **$33M ARR potential** in the WB
  alone — before expanding to Jordan, Egypt, Morocco, or any other
  Arabic-speaking agricultural market.

**Closing line:**
> "اللي عم نبنيه مش بس تطبيق. عم نرجّع 40 قرش من كل شيكل، لإيد المزارع
> الفلسطيني. والذكاء الاصطناعي بخلي هاد ممكن — حتى للمزارع اللي ما بيكتب."
>
> *"What we're building isn't just an app. We're returning 40 cents of every
> shekel to the Palestinian farmer. AI is what makes that possible — even for
> the farmer who can't read or write."*

---

## Q&A prep — likely questions

**Q: How do you verify a farmer is real?**
A: Three signals: ID document upload during onboarding, geolocation match
against the farm address, and a community-verification flag from existing
verified farmers in the same village. Long-term, integration with PA
agricultural registry.

**Q: What about food safety / certification?**
A: Self-declared organic for now (with `is_organic` flag), plus a "verified
organic" badge that requires uploading an official certificate. Inspection
is out of scope for v1 but is a paid premium feature in the roadmap.

**Q: Why React Native instead of native?**
A: Two reasons — one codebase for iOS + Android lets a 4-person hackathon team
ship both platforms; and Expo SDK 54's instant OTA updates let us iterate
during onboarding without store reviews. We'd revisit native if we need
serious offline support.

**Q: How does your AI cost scale?**
A: Anthropic Claude calls cost ~$0.003 per chat message; Replicate flux-schnell
~$0.003 per generated image. At 10K daily active users with 3 AI interactions
each, that's $90/day or $33K/year — covered by a single basis point of GMV.
We also cache aggressively (price ticker on 5-min stale time, Replicate by
prompt+season).

**Q: What's stopping someone from screenshotting your generated tree image
and not paying?**
A: Nothing — and that's intentional. The visualizer is the **acquisition
hook**, not the product. The product is the annual yield contract. The image
just lets a city buyer emotionally connect with a tree they'll never visit.
Same as why Airbnb hosts post nice photos: it's marketing, not the asset.

---

## Pre-pitch checklist (do all of these 30 min before)

- [ ] `.env` has `EXPO_PUBLIC_REPLICATE_API_TOKEN` AND `EXPO_PUBLIC_AI_SERVICE_URL`
  pointing at your live Render URL
- [ ] Mac on phone hotspot, phone connected to same hotspot
- [ ] `npx expo start --clear --lan` running, QR scanned, app loaded on phone
- [ ] Render Python service warmed up (hit `/docs` once — free tier sleeps after 15min idle)
- [ ] Backup MP4 of the demo flow in Quick Look
- [ ] AirPlay/HDMI tested to projector
- [ ] Phone on silent, low-power mode OFF, brightness 100%
- [ ] Charger at the podium
