import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const MISSING_TABLE = "42P01";

/** Default outreach targets; inserted via the "Seed default targets" button. */
const SEED_PROGRAMS = [
  {
    name: "Amazon Associates",
    network: "Amazon (direct)",
    category: "all",
    commission: "~3-4% shoes/apparel",
    cookie_window: "24 hours",
    signup_url: "https://affiliate-program.amazon.com/",
    env_var: "NEXT_PUBLIC_AMAZON_TAG",
    notes:
      "Fastest to switch on — self-serve, wires every Amazon link on the site the moment the tag env var is set. Requires 3 qualifying sales in the first 180 days to stay approved.",
    priority: 1
  },
  {
    name: "Running Warehouse",
    network: "AvantLink",
    category: "shoes",
    commission: "~10% (verify on application)",
    cookie_window: "~30-60 days (verify)",
    signup_url: "https://www.avantlink.com/",
    env_var: "NEXT_PUBLIC_RUNNING_WAREHOUSE_LINK_PREFIX",
    notes:
      "Highest-value target: specialist running retailer, strong rates, carries most of the shoe database. Apply on AvantLink and search for the Running Warehouse merchant program.",
    priority: 2
  },
  {
    name: "The Feed",
    network: "Own program (verify network)",
    category: "fuel",
    commission: "~10% (verify)",
    cookie_window: "verify",
    signup_url: "https://thefeed.com/",
    env_var: "(new wrapper needed in lib/affiliate.ts)",
    notes:
      "Endurance-fuel specialist — ideal match for the Fuel Planner's gel list. Check their site footer for the current affiliate/ambassador route.",
    priority: 3
  },
  {
    name: "Fleet Feet",
    network: "Impact (verify)",
    category: "shoes",
    commission: "verify on application",
    cookie_window: "verify",
    signup_url: "https://www.fleetfeet.com/",
    env_var: "NEXT_PUBLIC_FLEET_FEET_LINK_PREFIX",
    notes: "Already linked from every shoe page; specialist credibility. Find the program via their site footer or Impact marketplace.",
    priority: 4
  },
  {
    name: "Dick's Sporting Goods",
    network: "Impact (verify)",
    category: "shoes",
    commission: "~2-5% (verify)",
    cookie_window: "verify",
    signup_url: "https://www.dickssportinggoods.com/",
    env_var: "NEXT_PUBLIC_DICKS_LINK_PREFIX",
    notes: "Broad inventory, lower rates. Already linked sitewide, so approval is pure upside.",
    priority: 5
  },
  {
    name: "REI",
    network: "AvantLink",
    category: "attire",
    commission: "~5%",
    cookie_window: "~15 days (verify)",
    signup_url: "https://www.avantlink.com/",
    env_var: "(new wrapper needed in lib/affiliate.ts)",
    notes: "Good fit for the attire guide once shoe programs are live. Same AvantLink account as Running Warehouse.",
    priority: 6
  },
  {
    name: "Holabird Sports",
    network: "AvantLink (verify)",
    category: "shoes",
    commission: "verify",
    cookie_window: "verify",
    signup_url: "https://www.holabirdsports.com/",
    env_var: "(new wrapper needed in lib/affiliate.ts)",
    notes: "Running specialist alternative if Running Warehouse declines or stalls.",
    priority: 7
  }
];

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.admin
    .from("affiliate_programs")
    .select("*")
    .order("priority")
    .order("created_at");

  if (error) {
    if (error.code === MISSING_TABLE) {
      return NextResponse.json({ setupRequired: true, programs: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ programs: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "seed") {
    const { data: existing, error: checkError } = await auth.admin
      .from("affiliate_programs")
      .select("name");
    if (checkError) {
      const status = checkError.code === MISSING_TABLE ? 409 : 500;
      return NextResponse.json({ error: checkError.message }, { status });
    }
    const have = new Set((existing ?? []).map((row) => row.name));
    const fresh = SEED_PROGRAMS.filter((program) => !have.has(program.name));
    if (fresh.length) {
      const { error } = await auth.admin.from("affiliate_programs").insert(fresh);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ seeded: fresh.length });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("affiliate_programs")
    .insert({
      name,
      network: (body.network as string) || null,
      category: (body.category as string) || "shoes",
      signup_url: (body.signup_url as string) || null,
      notes: (body.notes as string) || null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ program: data });
}

const EDITABLE_FIELDS = [
  "name",
  "network",
  "category",
  "status",
  "commission",
  "cookie_window",
  "signup_url",
  "contact",
  "env_var",
  "notes",
  "priority",
  "applied_at"
] as const;

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      patch[field] = body[field] === "" ? null : body[field];
    }
  }

  const { data, error } = await auth.admin
    .from("affiliate_programs")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ program: data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await auth.admin.from("affiliate_programs").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
