import { NextResponse } from "next/server";
import { getAllCategories, addCategory } from "../../lib/categories-store";

export async function GET() {
  const categories = getAllCategories();
  return NextResponse.json({ data: categories });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const category = addCategory({
      name: body.name,
      id: body.id,
      description: body.description,
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 500 }
    );
  }
}
