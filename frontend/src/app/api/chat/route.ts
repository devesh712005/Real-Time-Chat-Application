export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    const models = [
      "gemini-2.5-flash",
      "gemini-2.0-flash", // fallback
    ];

    for (let model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: lastMessage }],
                },
              ],
            }),
          },
        );

        const data = await response.json();

        if (!data.error) {
          const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
          return new Response(reply);
        }

        // If 503 or 429 → try next model
        console.log(`Model ${model} failed:`, data.error);
      } catch (err) {
        console.log(`Error with ${model}`, err);
      }
    }

    return new Response("⚠️ All AI models busy. Try again later.");
  } catch (error) {
    console.error("Final Error:", error);
    return new Response("Error", { status: 500 });
  }
}
