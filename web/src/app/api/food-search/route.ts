import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/* Food macro lookup: Nicole's cached library -> USDA FoodData Central -> AI
   estimate. Results are cached into `foods` so the library grows with use.
   Auth required (admin builds plans; clients log journal food). */

export interface FoodHit {
  id?: string;
  name: string;
  portion_label: string;
  portion_grams: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  source: "library" | "usda" | "ai";
  usda_fdc_id?: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

async function usdaSearch(q: string): Promise<FoodHit[]> {
  const key = process.env.USDA_FDC_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${key}&query=${encodeURIComponent(q)}&dataType=Foundation,SR%20Legacy&pageSize=6`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.foods ?? [])
      .map((f: { description: string; fdcId: number; foodNutrients: { nutrientNumber: string; value: number }[] }) => {
        const nut = (num: string) => f.foodNutrients.find((n) => n.nutrientNumber === num)?.value ?? 0;
        return {
          name: f.description.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()).slice(0, 80),
          portion_label: "100 g",
          portion_grams: 100,
          calories: round1(nut("208")),
          protein: round1(nut("203")),
          carbs: round1(nut("205")),
          fats: round1(nut("204")),
          source: "usda" as const,
          usda_fdc_id: String(f.fdcId),
        };
      })
      .filter((f: FoodHit) => f.calories > 0 || f.protein > 0);
  } catch {
    return [];
  }
}

async function aiEstimate(q: string): Promise<FoodHit | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Estimate nutrition for this food as eaten: "${q}". Reply with ONLY a JSON object: {"name": string (cleaned-up food name incl. portion), "portion_label": string (the portion, e.g. "1 cup" or "3 oz"), "portion_grams": number|null, "calories": number, "protein": number, "carbs": number, "fats": number}. Grams of macros, kcal for calories. Typical/average preparation. No other text.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return {
      name: String(parsed.name).slice(0, 80),
      portion_label: String(parsed.portion_label).slice(0, 40),
      portion_grams: parsed.portion_grams == null ? null : Number(parsed.portion_grams),
      calories: round1(Number(parsed.calories) || 0),
      protein: round1(Number(parsed.protein) || 0),
      carbs: round1(Number(parsed.carbs) || 0),
      fats: round1(Number(parsed.fats) || 0),
      source: "ai",
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  const deep = url.searchParams.get("deep") === "1"; // explicit "search wider" tap
  if (q.length < 2) return NextResponse.json({ hits: [] });

  const { data: own } = await supabase
    .from("foods")
    .select("id, name, portion_label, portion_grams, calories, protein, carbs, fats, source, usda_fdc_id")
    .ilike("name", `%${q}%`)
    .limit(8);
  const library: FoodHit[] = (own ?? []).map((f) => ({ ...f, source: "library" as const, usda_fdc_id: f.usda_fdc_id ?? undefined }));

  if (library.length >= 3 && !deep) return NextResponse.json({ hits: library });

  const usda = await usdaSearch(q);
  let hits: FoodHit[] = [...library, ...usda.filter((u) => !library.some((l) => l.usda_fdc_id === u.usda_fdc_id))];

  if (hits.length === 0 || (deep && hits.length < 2)) {
    const ai = await aiEstimate(q);
    if (ai) hits = [...hits, ai];
  }
  return NextResponse.json({ hits: hits.slice(0, 10) });
}

/* POST: cache a chosen non-library food into Nicole's foods table. */
export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = (await request.json()) as FoodHit;
  if (!body?.name) return NextResponse.json({ error: "Bad food" }, { status: 400 });
  const { data, error } = await supabase
    .from("foods")
    .insert({
      name: body.name,
      portion_label: body.portion_label ?? "",
      portion_grams: body.portion_grams,
      calories: body.calories ?? 0,
      protein: body.protein ?? 0,
      carbs: body.carbs ?? 0,
      fats: body.fats ?? 0,
      source: body.source === "usda" ? "usda" : body.source === "ai" ? "ai" : "manual",
      usda_fdc_id: body.usda_fdc_id ?? null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ ok: true }); // clients can't insert (RLS) — fine, cache is best-effort
  return NextResponse.json({ ok: true, id: data.id });
}
