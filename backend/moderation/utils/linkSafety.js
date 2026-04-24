import axios from "axios";

export const checkLinkSafety = async (url) => {
  try {
    console.log("🔍 Checking URL with Google Safe Browsing:", url);
    const res = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_API_KEY}`,
      {
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      },
    );

    return res.data.matches ? "malicious" : "safe";
  } catch {
    return "safe";
  }
};
