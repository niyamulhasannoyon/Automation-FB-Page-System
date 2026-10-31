import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { MetaGraphService } from "@/lib/meta-graph";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let pageId = searchParams.get("pageId");

    if (!pageId) {
      const pages = await AppStorage.getAllPages();
      pageId = pages[0]?.pageId || "10928491829384";
    }

    const orders = await AppStorage.getOrders(pageId);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("[API Orders GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve orders." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pageId,
      customerName,
      customerPhone,
      customerAddress,
      productName,
      productId,
      quantity,
      totalAmount,
      status,
      source,
      notes,
    } = body;

    if (
      !pageId ||
      !customerName ||
      !customerPhone ||
      !customerAddress ||
      !productName ||
      totalAmount === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Fields 'pageId', 'customerName', 'customerPhone', 'customerAddress', 'productName', and 'totalAmount' are required.",
        },
        { status: 400 }
      );
    }

    const order = await AppStorage.createOrder({
      pageId,
      customerName,
      customerPhone,
      customerAddress,
      productName,
      productId: productId || "",
      quantity: Number(quantity) || 1,
      totalAmount: Number(totalAmount),
      status: status || "pending",
      source: source || "manual",
      notes: notes || "",
    });

    // Optionally decrement stock if productId provided
    if (productId) {
      await AppStorage.decrementProductStock(productId, Number(quantity) || 1);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("[API Orders POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, notifyCustomer, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Order 'id' is required." },
        { status: 400 }
      );
    }

    const currentOrder = await AppStorage.getOrder(id);
    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const updated = await AppStorage.updateOrder(id, updates);

    // If status changed to 'confirmed' and notifyCustomer is true (or default)
    if (
      updates.status === "confirmed" &&
      notifyCustomer !== false &&
      currentOrder.customerPsid &&
      currentOrder.pageId
    ) {
      const page = await AppStorage.getPage(currentOrder.pageId);
      if (page && page.pageAccessToken) {
        const msg = `🎉 আপনার অর্ডারটি (${currentOrder.orderNumber}) কনফার্ম করা হয়েছে! আমাদের রাইডার ডেলিভারির জন্য রওনা হলে আপনাকে কল করা হবে। ধন্যবাদ আমাদের সাথে থাকার জন্য! 🚚`;
        if (page.pageAccessToken.startsWith("demo_")) {
          console.log(
            `[Order Notify Demo] Confirmation DM sent to PSID ${currentOrder.customerPsid} for order ${currentOrder.orderNumber}`
          );
        } else {
          MetaGraphService.sendDirectMessengerReply(
            page.pageId,
            currentOrder.customerPsid,
            msg,
            page.pageAccessToken
          ).catch((err) =>
            console.error(
              `[Order Notify] Failed to send Messenger confirmation for ${currentOrder.orderNumber}:`,
              err.message
            )
          );
        }
      }
    }

    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (error) {
    console.error("[API Orders PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update order." },
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

    const deleted = await AppStorage.deleteOrder(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Order not found or already deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API Orders DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete order." },
      { status: 500 }
    );
  }
}
