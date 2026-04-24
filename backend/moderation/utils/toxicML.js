import axios from "axios";

export const checkToxicML = async (text) => {
  try {
    console.log("✅ Toxic ml model called");
    const res = await axios.post(
      "https://router.huggingface.co/hf-inference/models/unitary/unbiased-toxic-roberta",
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
        timeout: 15000,
      },
    );

    const predictions = res.data[0];

    const toxicity =
      predictions.find((p) => p.label === "toxicity")?.score || 0;

    return toxicity > 0.7;
  } catch {
    return false;
  }
};
