import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { findMatchingRule } from "@/lib/utils";
import {
  parseOrderMessage,
  parseStockOrPriceInquiry,
  formatOrderConfirmationReply,
} from "@/lib/order-parser";
import { generateAiSalesmanReply } from "@/lib/ai-salesman";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pageId, message, senderName, senderPsid } = body;

    if (!pageId || !message || !message.trim()) {
      return NextResponse.json(
        { error: "Fields 'pageId' and 'message' are required." },
        { status: 400 }
      );
    }

    const page = await AppStorage.getPage(pageId);
    if (!page) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    const userText = message.trim();
    const psid = senderPsid || `sim_${Date.now().toString().slice(-6)}`;

    // 1. Layer 1: Auto Order Extraction
    const orderData = await parseOrderMessage(pageId, userText, senderName);
    if (orderData && orderData.isValid) {
      const newOrder = await AppStorage.createOrder({
        pageId,
        customerPsid: psid,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        productName: orderData.productName,
        productId: orderData.product?._id || "",
        quantity: orderData.quantity,
        totalAmount: orderData.totalAmount,
        status: "pending",
        source: "messenger_auto",
        notes: `Simulated inbox order test: "${userText.slice(0, 60)}"`,
      });

      if (orderData.product?._id) {
        await AppStorage.decrementProductStock(
          orderData.product._id,
          orderData.quantity
        );
      }

      const reply = formatOrderConfirmationReply(
        orderData.customerName,
        newOrder.orderNumber,
        orderData.customerPhone,
        orderData.productName,
        orderData.totalAmount
      );

      return NextResponse.json({
        reply,
        layer: "order_extracted",
        layerName: "Layer 1: Auto-Order Extractor",
        layerDescription:
          "Detected valid BD phone number, delivery address & matched product. Order created in database & stock updated!",
        orderCreated: newOrder,
        matchedProduct: orderData.product,
      });
    }

    // 2. Layer 2: Real-Time Stock & Price Inquiry
    const stockCheck = await parseStockOrPriceInquiry(pageId, userText);
    if (stockCheck.isInquiry && stockCheck.replyText) {
      return NextResponse.json({
        reply: stockCheck.replyText,
        layer: "stock_price_inquiry",
        layerName: "Layer 2: Real-Time Stock & Price Checker",
        layerDescription:
          "Queried page product catalog to verify current price & live inventory availability.",
        matchedProduct: stockCheck.product,
      });
    }

    // 3. Automation Rules Check
    const matchedRule = findMatchingRule(userText, page.rules);
    if (matchedRule && matchedRule.inboxReply && matchedRule.inboxReply.trim()) {
      return NextResponse.json({
        reply: matchedRule.inboxReply.trim(),
        layer: "automation_rule",
        layerName: "Custom Keyword Automation Rule",
        layerDescription: `Matched configured keyword: "${matchedRule.keyword}" (${matchedRule.matchType})`,
      });
    }

    // 4. Layer 3: Gemini AI Smart Salesman Fallback
    const aiResult = await generateAiSalesmanReply(
      pageId,
      userText,
      page.pageName
    );
    if (aiResult.reply && aiResult.reply.trim().length > 0) {
      return NextResponse.json({
        reply: aiResult.reply.trim(),
        layer: "ai_salesman",
        layerName:
          aiResult.source === "gemini_api"
            ? "Layer 3: Google Gemini AI Smart Salesman"
            : "Layer 3: Smart Bengali AI Contextual Engine",
        layerDescription:
          "Generated smart, polite Bengali sales response referencing product catalog and store policies.",
      });
    }

    // 5. Default Fallback
    const fallback =
      page.defaultInboxReply ||
      "ধন্যবাদ আপনার মেসেজের জন্য! আমাদের প্রতিনিধি খুব শীঘ্রই যোগাযোগ করবেন।";

    return NextResponse.json({
      reply: fallback,
      layer: "default_fallback",
      layerName: "Default Page Greeting",
      layerDescription: "Sent default inbox fallback response.",
    });
  } catch (error) {
    console.error("[API Simulate POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to simulate message response." },
      { status: 500 }
    );
  }
}
