// services/moderationClient.ts
import axios from "axios";

export const analyzeMessage = async (text: string) => {
  try {
    console.log("📤 Sending to moderation:", text); // 🔥 NEW

    const res = await axios.post(
      "http://localhost:5003/api/v1/moderation/analyze",
      { text },
    );

    console.log("📥 Moderation response:", res.data); // existing

    // 🔥 EXTRA CHECK (VERY IMPORTANT)
    if (!res.data.action) {
      console.log("❌ Invalid response from moderation service");
    }

    return res.data;
  } catch (err: any) {
    console.log("❌ Moderation service error:", err.message);

    return {
      action: "ALLOW",
      target: null,
      reason: "fallback",
      message: null,
      strike: false,
    };
  }
};
