import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name: string;
      company?: string;
      email: string;
      phone?: string;
      interest?: string;
      budget_range?: string;
      message?: string;
    };

    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("media_kit_enquiries")
      .insert({
        name: body.name,
        company: body.company ?? null,
        email: body.email,
        phone: body.phone ?? null,
        interest: body.interest ?? null,
        budget_range: body.budget_range ?? null,
        message: body.message ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
