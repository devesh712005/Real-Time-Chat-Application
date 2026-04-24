import axios from "axios";

export const checkScamML = async (text) => {
  try {
    console.log("✅ Scam ML model called...");

    const res = await axios.post(
      "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
      {
        inputs: text,
        parameters: {
          candidate_labels: ["scam", "normal"],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
      },
    );

    const data = res.data;

    // ✅ HANDLE ARRAY FORMAT (most common)
    if (Array.isArray(data)) {
      const scamObj = data.find((item) => item.label === "scam");

      if (!scamObj) return { label: "normal", score: 0 };

      return {
        label: scamObj.score > 0.7 ? "scam" : "normal",
        score: scamObj.score,
      };
    }

    // ✅ HANDLE labels/scores FORMAT (fallback)
    if (data.labels && data.scores) {
      const scamIndex = data.labels.indexOf("scam");

      if (scamIndex === -1) return { label: "normal", score: 0 };

      const scamScore = data.scores[scamIndex];

      return {
        label: scamScore > 0.7 ? "scam" : "normal",
        score: scamScore,
      };
    }

    return { label: "normal", score: 0 };
  } catch (err) {
    console.log("❌ Scam ML error:", err.message);
    return { label: "normal", score: 0 };
  }
};
