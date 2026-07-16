import "server-only";

import { GoogleGenAI } from "@google/genai";


export interface MaterialOption {
  id: string;
  material_name: string;
  category: string;
}


export type PrimaryAction =
  | "reuse"
  | "donate"
  | "sell"
  | "recycle"
  | "special_handling"
  | "dispose";


export type ItemCondition =
  | "clean"
  | "dirty"
  | "damaged"
  | "mixed"
  | "unknown";


export interface AlternativeAction {
  action: PrimaryAction;
  title: string;
  description: string;
}


export interface GeminiScanResult {
  detected_object: string;
  object_description: string;
  matched_material_id: string;
  material_name: string;
  material_category: string;
  condition: ItemCondition;
  confidence_score: number;
  primary_action: PrimaryAction;
  action_title: string;
  action_description: string;
  preparation_steps: string[];
  alternative_actions: AlternativeAction[];
  hazardous: boolean;
  hazard_notes: string;
  needs_user_confirmation: boolean;
  confirmation_question: string;
}


export interface NormalizedGeminiScanResult
  extends GeminiScanResult {
  matched_material: MaterialOption | null;
}


export interface ResidentImageAnalysis {
  result: NormalizedGeminiScanResult;
  model: string;
  usage: unknown;
}


const primaryActions: PrimaryAction[] = [
  "reuse",
  "donate",
  "sell",
  "recycle",
  "special_handling",
  "dispose",
];


const itemConditions: ItemCondition[] = [
  "clean",
  "dirty",
  "damaged",
  "mixed",
  "unknown",
];


const scanResponseJsonSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    detected_object: {
      type: "string",
      description:
        "Common name of the single primary discarded item.",
    },

    object_description: {
      type: "string",
      description:
        "Short visual description including visible condition and mixed parts.",
    },

    matched_material_id: {
      type: "string",
      description:
        "One exact UUID from the supplied catalog, or an empty string when no reliable catalog match exists.",
    },

    material_name: {
      type: "string",
    },

    material_category: {
      type: "string",
    },

    condition: {
      type: "string",
      enum: [
        "clean",
        "dirty",
        "damaged",
        "mixed",
        "unknown",
      ],
    },

    confidence_score: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "A cautious material-classification confidence signal from 0 to 1.",
    },

    primary_action: {
      type: "string",
      enum: [
        "reuse",
        "donate",
        "sell",
        "recycle",
        "special_handling",
        "dispose",
      ],
    },

    action_title: {
      type: "string",
    },

    action_description: {
      type: "string",
    },

    preparation_steps: {
      type: "array",
      maxItems: 6,
      items: {
        type: "string",
      },
    },

    alternative_actions: {
      type: "array",
      maxItems: 3,

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          action: {
            type: "string",
            enum: [
              "reuse",
              "donate",
              "sell",
              "recycle",
              "special_handling",
              "dispose",
            ],
          },

          title: {
            type: "string",
          },

          description: {
            type: "string",
          },
        },

        required: [
          "action",
          "title",
          "description",
        ],
      },
    },

    hazardous: {
      type: "boolean",
    },

    hazard_notes: {
      type: "string",
    },

    needs_user_confirmation: {
      type: "boolean",
    },

    confirmation_question: {
      type: "string",
    },
  },

  required: [
    "detected_object",
    "object_description",
    "matched_material_id",
    "material_name",
    "material_category",
    "condition",
    "confidence_score",
    "primary_action",
    "action_title",
    "action_description",
    "preparation_steps",
    "alternative_actions",
    "hazardous",
    "hazard_notes",
    "needs_user_confirmation",
    "confirmation_question",
  ],
} as const;


function requireGeminiKey() {
  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured.",
    );
  }

  return apiKey;
}


function cleanString(
  value: unknown,
  fallback = "",
) {
  return typeof value === "string"
    ? value.trim()
    : fallback;
}


function clampConfidence(
  value: unknown,
) {
  const parsed =
    Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, parsed),
  );
}


function isPrimaryAction(
  value: unknown,
): value is PrimaryAction {
  return primaryActions.includes(
    value as PrimaryAction,
  );
}


function isItemCondition(
  value: unknown,
): value is ItemCondition {
  return itemConditions.includes(
    value as ItemCondition,
  );
}


function normalizePreparationSteps(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}


function normalizeAlternativeActions(
  value: unknown,
): AlternativeAction[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      (
        item,
      ): AlternativeAction | null => {
        if (
          typeof item !== "object" ||
          item === null
        ) {
          return null;
        }

        const record =
          item as Record<
            string,
            unknown
          >;

        if (
          !isPrimaryAction(
            record.action,
          )
        ) {
          return null;
        }

        return {
          action:
            record.action,

          title:
            cleanString(
              record.title,
              "Alternative option",
            ),

          description:
            cleanString(
              record.description,
            ),
        };
      },
    )
    .filter(
      (
        item,
      ): item is AlternativeAction =>
        item !== null,
    )
    .slice(0, 3);
}


function buildMaterialCatalog(
  materials: MaterialOption[],
) {
  return materials
    .slice(0, 200)
    .map(
      (material) =>
        [
          material.id,
          material.material_name,
          material.category,
        ].join(" | "),
    )
    .join("\n");
}


function buildPrompt({
  materials,
  userHint,
  location,
}: {
  materials: MaterialOption[];
  userHint: string;
  location: string;
}) {
  return `
You are the image-classification component of Trashure, a Philippine circular-economy application.

Analyze only the single primary discarded item shown in the image.

STRICT RULES:
1. Match the item only against the supplied material catalog.
2. matched_material_id must be one exact UUID from the catalog.
3. Return an empty matched_material_id when no reliable catalog match exists.
4. Never invent, modify, shorten, or approximate a UUID.
5. Set needs_user_confirmation to true when:
   - confidence_score is below 0.78;
   - the image is blurry, dark, obstructed, or ambiguous;
   - the item contains multiple important materials;
   - the item is dirty, contaminated, or damaged enough to affect classification;
   - no reliable catalog match exists.
6. confidence_score must be a cautious number from 0 to 1.
7. Mark batteries, electronic waste, chemicals, medical waste, sharp objects, pressurized containers, and other unsafe items as hazardous when appropriate.
8. For hazardous items, use special_handling as the primary action when suitable.
9. Never advise burning, open dumping, tasting, smelling chemicals, opening batteries, puncturing pressurized containers, or unsafe dismantling.
10. Keep recommendations practical for Philippine households.
11. Prefer safe reuse, donation, selling, and recycling before disposal when realistic.
12. preparation_steps must be short, safe, and directly relevant.
13. Do not identify people, addresses, documents, or unrelated private details in the image.

RESIDENT HINT:
${userHint || "No hint provided."}

RESIDENT LOCATION:
${location || "Location not provided."}

ALLOWED MATERIAL CATALOG:
UUID | MATERIAL NAME | CATEGORY
${buildMaterialCatalog(materials)}
`.trim();
}


function normalizeGeminiResult(
  raw: unknown,
  materials: MaterialOption[],
): NormalizedGeminiScanResult {
  if (
    typeof raw !== "object" ||
    raw === null
  ) {
    throw new Error(
      "Gemini returned an invalid scan result.",
    );
  }

  const record =
    raw as Record<
      string,
      unknown
    >;

  const requestedMaterialId =
    cleanString(
      record.matched_material_id,
    );

  const matchedMaterial =
    materials.find(
      (material) =>
        material.id ===
        requestedMaterialId,
    ) ??
    null;

  const confidence =
    clampConfidence(
      record.confidence_score,
    );

  const condition =
    isItemCondition(
      record.condition,
    )
      ? record.condition
      : "unknown";

  const primaryAction =
    isPrimaryAction(
      record.primary_action,
    )
      ? record.primary_action
      : "recycle";

  const requiresConfirmation =
    Boolean(
      record.needs_user_confirmation,
    ) ||
    !matchedMaterial ||
    confidence < 0.78 ||
    condition === "mixed" ||
    condition === "unknown";

  return {
    detected_object:
      cleanString(
        record.detected_object,
        "Unidentified item",
      ),

    object_description:
      cleanString(
        record.object_description,
        "The image requires resident review.",
      ),

    matched_material_id:
      matchedMaterial?.id ??
      "",

    material_name:
      matchedMaterial?.material_name ??
      cleanString(
        record.material_name,
        "Unmatched material",
      ),

    material_category:
      matchedMaterial?.category ??
      cleanString(
        record.material_category,
        "Other",
      ),

    condition,

    confidence_score:
      confidence,

    primary_action:
      primaryAction,

    action_title:
      cleanString(
        record.action_title,
        "Review the recommended next step",
      ),

    action_description:
      cleanString(
        record.action_description,
        "Confirm the material before selecting a recovery destination.",
      ),

    preparation_steps:
      normalizePreparationSteps(
        record.preparation_steps,
      ),

    alternative_actions:
      normalizeAlternativeActions(
        record.alternative_actions,
      ),

    hazardous:
      Boolean(
        record.hazardous,
      ),

    hazard_notes:
      cleanString(
        record.hazard_notes,
      ),

    needs_user_confirmation:
      requiresConfirmation,

    confirmation_question:
      cleanString(
        record.confirmation_question,
        "Does this material match the photographed item?",
      ),

    matched_material:
      matchedMaterial,
  };
}


export async function analyzeResidentImage({
  imageBuffer,
  mimeType,
  materials,
  userHint = "",
  location = "",
}: {
  imageBuffer: Buffer;
  mimeType: string;
  materials: MaterialOption[];
  userHint?: string;
  location?: string;
}): Promise<ResidentImageAnalysis> {
  if (imageBuffer.length === 0) {
    throw new Error(
      "The image is empty.",
    );
  }

  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(mimeType)
  ) {
    throw new Error(
      "Unsupported image type.",
    );
  }

  if (materials.length === 0) {
    throw new Error(
      "The materials catalog is empty.",
    );
  }

  const model =
    process.env.GEMINI_MODEL ??
    "gemini-3.1-flash-lite";

  const ai =
    new GoogleGenAI({
      apiKey:
        requireGeminiKey(),
    });

  const response =
    await ai.models.generateContent({
      model,

      contents: [
        {
          role:
            "user",

          parts: [
            {
              inlineData: {
                mimeType,

                data:
                  imageBuffer.toString(
                    "base64",
                  ),
              },
            },

            {
              text:
                buildPrompt({
                  materials,
                  userHint:
                    userHint
                      .trim()
                      .slice(
                        0,
                        300,
                      ),

                  location:
                    location
                      .trim()
                      .slice(
                        0,
                        300,
                      ),
                }),
            },
          ],
        },
      ],

      config: {
        temperature:
          0.1,

        maxOutputTokens:
          4096,

        responseMimeType:
          "application/json",

        responseJsonSchema:
          scanResponseJsonSchema,
      },
    });

  const responseText =
    response.text?.trim();

  if (!responseText) {
    throw new Error(
      "Gemini returned an empty response.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        responseText,
      );
  } catch {
    throw new Error(
      "Gemini returned malformed JSON.",
    );
  }

  return {
    result:
      normalizeGeminiResult(
        parsed,
        materials,
      ),

    model,

    usage:
      response.usageMetadata ??
      null,
  };
}
