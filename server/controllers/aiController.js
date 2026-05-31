/** @file AI insight generation endpoint for submitted assessment results. */
// server/controllers/aiController.js

/**
 * AI Controller
 * -------------
 *   POST /api/ai/insights
 *
 * Calls OpenAI gpt-4o-mini with the user's assessment score profile
 * and returns personalised feedback + resource recommendations.
 *
 * Auth: protect middleware (carer must own the assessment)
 */

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Assessment = require("../models/Assessment");
const categoryCache = require("../utils/categoryCache");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/**
 * @desc    Generate AI insights for a submitted assessment
 * @route   POST /api/ai/insights
 * @access  Private (carer)
 *
 * Body: { assessmentId: string }
 */
const generateInsights = asyncHandler(async (req, res) => {
  const { assessmentId } = req.body;

  if (!assessmentId) {
    throw new ApiError(400, "assessmentId is required");
  }

  // Load assessment — must belong to this user
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  if (assessment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not your assessment");
  }
  if (assessment.status !== "submitted") {
    throw new ApiError(400, "Insights only available for submitted assessments");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new ApiError(500, "AI service is not configured");
  }

  // Build readable score profile for the prompt
  const allCategories = await categoryCache.getAllCategoriesIncludingArchived();
  const categoryMap = Object.fromEntries(allCategories.map((c) => [c.key, c.label]));

  const scores = assessment.categoryScores
    ? Object.entries(Object.fromEntries(assessment.categoryScores))
        .filter(([, score]) => score != null)
        .sort(([, a], [, b]) => b - a)
        .map(([key, score]) => ({
          domain: categoryMap[key] || key,
          score: score.toFixed(2),
          tier:
            score >= 4.0 ? "Strength"
            : score >= 3.0 ? "Growth"
            : "Support",
        }))
    : [];

  const topDomains     = scores.filter((s) => s.tier === "Strength").map((s) => s.domain);
  const growthDomains  = scores.filter((s) => s.tier === "Growth").map((s) => s.domain);
  const supportDomains = scores.filter((s) => s.tier === "Support").map((s) => s.domain);

  const prompt = `You are a supportive caregiving capability advisor for CareAble, an Australian platform that helps informal carers (family members and unpaid carers) understand and develop their skills.

A carer has just completed a self-assessment. Here is their result:

Overall Score: ${assessment.overallScore?.toFixed(2)} / 5.00
Overall Level: ${assessment.level}

Domain scores (1–5 scale):
${scores.map((s) => `- ${s.domain}: ${s.score} (${s.tier})`).join("\n")}

Strength areas (≥ 4.0): ${topDomains.length > 0 ? topDomains.join(", ") : "None yet"}
Growth areas (3.0–3.9): ${growthDomains.length > 0 ? growthDomains.join(", ") : "None"}
Support areas (< 3.0): ${supportDomains.length > 0 ? supportDomains.join(", ") : "None"}

Respond with ONLY a valid JSON object in this exact format (no markdown, no code blocks, no extra text):
{
  "summary": "2–3 warm, specific sentences acknowledging their overall result. Mention their level and 1–2 specific domain names.",
  "strengths": "1–2 sentences celebrating their top scoring domains and what that says about them as a carer.",
  "growth": "1–2 sentences focusing on growth or support areas with an encouraging, constructive tone. Be specific about which domains.",
  "resources": [
    {
      "organisation": "The real Australian organisation that runs this resource (e.g. Carers Australia, Carer Gateway, TAFE NSW, Dementia Australia)",
      "program": "The specific program, course, service, or topic to look up (e.g. 'Counselling Service', 'Certificate III in Individual Support', 'Respite Care Planning')",
      "description": "Two sentences. First: what the program is. Second: why it specifically suits this carer's weakest domains.",
      "type": "Course | Counselling | Helpline | Program | Community | Guide | Tool"
    }
  ],
  "nextStep": "One clear, specific, actionable sentence they can do this week to build on their results."
}

Rules:
- All resources must be real, currently active Australian organisations and programs that genuinely exist
- DO NOT include URLs anywhere — the frontend will handle search links
- Pick organisations from this list (these are real and currently active):
  Carers Australia, Carer Gateway, NDIS, My Aged Care, Beyond Blue, Headspace, Lifeline, Dementia Australia, Carers NSW, Carers Victoria, TAFE NSW, Open Colleges, Hireup, Mable, Mental Health Australia, Black Dog Institute, Relationships Australia, ReachOut, Suicide Call Back Service, 13YARN
- The "program" field must name a real, specific offering (a known course code, named program, helpline, or topic) — not a generic phrase
- Tailor each resource to one of the carer's weakest domains specifically — mention which domain it addresses in the description
- Variety: pick 3 different types where possible (e.g. one Course, one Counselling, one Community)
- Tone: warm, professional, encouraging — never clinical or patronising
- Do not mention CareAble or the assessment platform by name`;

  // Call OpenAI gpt-4o-mini
  const openaiRes = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a caregiving capability advisor. Always respond with valid JSON only — no markdown, no code fences, no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  });

  if (!openaiRes.ok) {
    const errBody = await openaiRes.text();
    console.error("[AI] OpenAI error:", openaiRes.status, errBody);

    if (openaiRes.status === 429) {
      throw new ApiError(429, "AI service is currently over quota. Please try again later.");
    }
    if (openaiRes.status === 401) {
      throw new ApiError(500, "AI service authentication failed. Check the API key.");
    }
    throw new ApiError(502, "AI service returned an error. Please try again.");
  }

  const openaiData = await openaiRes.json();

  // Extract content from OpenAI response shape:
  // { choices: [{ message: { content: "..." } }] }
  const rawText = openaiData?.choices?.[0]?.message?.content;

  if (!rawText) {
    console.error("[AI] Unexpected OpenAI response shape:", JSON.stringify(openaiData));
    throw new ApiError(502, "AI service returned an unexpected response. Please try again.");
  }

  // response_format: json_object guarantees valid JSON from OpenAI
  // but we still wrap in try/catch defensively
  let insights;
  try {
    insights = JSON.parse(rawText);
  } catch {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    try {
      insights = JSON.parse(cleaned);
    } catch {
      console.error("[AI] Could not parse OpenAI response:", rawText);
      throw new ApiError(502, "AI response could not be parsed. Please try again.");
    }
  }

  res.status(200).json({
    success: true,
    data: { insights },
  });
});

module.exports = { generateInsights };