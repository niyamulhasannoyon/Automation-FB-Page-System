import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let pageId = searchParams.get("pageId");

    if (!pageId) {
      const pages = await AppStorage.getAllPages();
      pageId = pages[0]?.pageId || "10928491829384";
    }

    const products = await AppStorage.getProducts(pageId);
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("[API Products GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve products." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pageId, name, price, stock, sku, keywords, imageUrl } = body;

    if (!pageId || !name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Fields 'pageId', 'name', 'price', and 'stock' are required." },
        { status: 400 }
      );
    }

    const parsedKeywords = Array.isArray(keywords)
      ? keywords
      : typeof keywords === "string"
      ? keywords.split(",").map((k: string) => k.trim())
      : [name.toLowerCase()];

    const product = await AppStorage.createProduct({
      pageId,
      name,
      price: Number(price),
      stock: Number(stock),
      sku: sku || "",
      keywords: parsedKeywords,
      imageUrl: imageUrl || "",
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[API Products POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product 'id' is required." },
        { status: 400 }
      );
    }

    if (updates.keywords && typeof updates.keywords === "string") {
      updates.keywords = updates.keywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean);
    }

    const updated = await AppStorage.updateProduct(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product: updated }, { status: 200 });
  } catch (error) {
    console.error("[API Products PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Query parameter 'id' is required." },
        { status: 400 }
      );
    }

    const deleted = await AppStorage.deleteProduct(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Product not found or already deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API Products DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
