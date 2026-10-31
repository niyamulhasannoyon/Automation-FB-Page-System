import { NextRequest, NextResponse } from "next/server";
import { AppStorage } from "@/lib/storage";
import { findMatchingRule } from "@/lib/utils";
import {
  parseOrderMessage,
  parseStockOrPriceInquiry,
  formatOrderConfirmationReply,
} from "@/lib/order-engine";
import { generateAiReply } from "@/lib/ai-reply";

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
    const eventId = `sim_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const customerDisplayName = senderName || "রাফি আহমেদ (Tester)";

    // 1. Layer 1: Auto Order Extraction
    const orderData = await parseOrderMessage(pageId, userText, customerDisplayName);
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
        status: "confirmed", // Automatically confirmed in database per prompt
        source: "messenger_auto",
        notes: `Simulated inbox order: "${userText.slice(0, 60)}"`,
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

      // Log event
      await AppStorage.logAutomationEvent({
        pageId,
        eventId,
        eventType: "order",
        senderId: psid,
        senderName: orderData.customerName,
        inputMessage: userText,
        replyMessage: reply,
        handledBy: "Layer 1: Auto Order Extractor (Simulator)",
        status: "success",
      });

      return NextResponse.json({
        reply,
        layer: "order_extracted",
        layerName: "Layer 1: Auto-Order Extractor",
        layerDescription:
          "Detected valid BD phone number, delivery address & matched product. Order confirmed in database & stock decremented!",
        orderCreated: newOrder,
        matchedProduct: orderData.product,
      });
    }

    // 2. Layer 2: Real-Time Stock & Price Inquiry
    const stockCheck = await parseStockOrPriceInquiry(pageId, userText);
    if (stockCheck.isInquiry && stockCheck.replyText) {
      await AppStorage.logAutomationEvent({
        pageId,
        eventId,
        eventType: "stock_inquiry",
        senderId: psid,
        senderName: customerDisplayName,
        inputMessage: userText,
        replyMessage: stockCheck.replyText,
        handledBy: "Layer 2: Real-Time Stock & Price Checker (Simulator)",
        status: "success",
      });

      return NextResponse.json({
        reply: stockCheck.replyText,
        layer: "stock_price_inquiry",
        layerName: "Layer 2: Real-Time Stock & Price Checker",
        layerDescription:
          "Queried live product catalog to verify current price & stock availability.",
        matchedProduct: stockCheck.product,
      });
    }

    // 3. Automation Rules Check
    const matchedRule = findMatchingRule(userText, page.rules);
    if (matchedRule && matchedRule.inboxReply && matchedRule.inboxReply.trim()) {
      const reply = matchedRule.inboxReply.trim();

      await AppStorage.logAutomationEvent({
        pageId,
        eventId,
        eventType: "message",
        senderId: psid,
        senderName: customerDisplayName,
        inputMessage: userText,
        replyMessage: reply,
        handledBy: `Keyword Rule (${matchedRule.keyword})`,
        status: "success",
      });

      return NextResponse.json({
        reply,
        layer: "automation_rule",
        layerName: "Custom Keyword Automation Rule",
        layerDescription: `Matched configured keyword: "${matchedRule.keyword}" (${matchedRule.matchType})`,
      });
    }

    // 4. Layer 3: AI Smart Reply Fallback
    const aiResult = await generateAiReply(
      pageId,
      userText,
      page.pageName
    );
    if (aiResult.reply && aiResult.reply.trim().length > 0) {
      const reply = aiResult.reply.trim();

      await AppStorage.logAutomationEvent({
        pageId,
        eventId,
        eventType: "ai_reply",
        senderId: psid,
        senderName: customerDisplayName,
        inputMessage: userText,
        replyMessage: reply,
        handledBy: `Layer 3: AI Smart Reply (${aiResult.source})`,
        status: "success",
      });

      return NextResponse.json({
        reply,
        layer: "ai_salesman",
        layerName:
          aiResult.source === "gemini_2.5_flash"
            ? "Layer 3: Google Gemini 2.5 Flash"
            : "Layer 3: Smart Bengali AI Contextual Engine",
        layerDescription:
          "Generated smart, polite Bengali sales response referencing product catalog and store policies.",
      });
    }

    // 5. Default Fallback
    const fallback =
      page.defaultInboxReply ||
      "ধন্যবাদ আপনার মেসেজের জন্য! আমাদের প্রতিনিধি খুব শীঘ্রই যোগাযোগ করবেন।";

    await AppStorage.logAutomationEvent({
      pageId,
      eventId,
      eventType: "message",
      senderId: psid,
      senderName: customerDisplayName,
      inputMessage: userText,
      replyMessage: fallback,
      handledBy: "Default Page Greeting",
      status: "success",
    });

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
