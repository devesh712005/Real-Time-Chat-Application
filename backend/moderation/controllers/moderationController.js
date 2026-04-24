import { checkToxic, checkSpam, extractURL } from "../utils/filter.js";
import { checkLinkSafety } from "../utils/linkSafety.js";
import { checkScamML } from "../utils/scamML.js";
import { checkToxicML } from "../utils/toxicML.js";
export const analyzeMessage = async (req, res) => {
  try {
    const { text } = req.body;
    let warning = null;

    if (!text) {
      return res.status(400).json({ message: "Text required" });
    }

    // 🔴 1. Regex Toxic (HIGH PRIORITY)
    if (checkToxic(text)) {
      return res.json({
        action: "BLOCK",
        target: "SENDER",
        reason: "toxic-regex",
        message: "You cannot send inappropriate content",
        strike: true,
      });
    }
    const wordCount = text.trim().split(/\s+/).length;

    if (wordCount >= 2) {
      const toxic = await checkToxicML(text);
      console.log("⚠️ Toxic ML model runs... ", toxic);
      if (toxic) {
        return res.json({
          action: "BLOCK",
          target: "SENDER",
          reason: "ml-toxic",
          message: "You cannot send inappropriate content",
          strike: true,
        });
      }
    }

    // ⚠️ FINAL WARNING RESPONSE
    if (warning) {
      return res.json({
        action: "ALLOW_WITH_WARNING",
        target: "RECEIVER",
        reason: "warning",
        message: warning,
        strike: false,
      });
    }
    // 🔗 2. URL
    const url = extractURL(text);
    if (url) {
      const isMalicious = await checkLinkSafety(url);
      console.log("Google link check...", isMalicious);
      if (isMalicious === "malicious") {
        return res.json({
          action: "ALLOW_WITH_WARNING",
          target: "RECEIVER",
          reason: "malicious-link",
          message: "⚠️ This link may be unsafe",
          strike: false,
        });
      }
      // 🔥 ADD THIS (VERY IMPORTANT
    }
    // 🟡 3. Spam Regex
    const isSpam = checkSpam(text);
    if (isSpam) {
      return res.json({
        action: "ALLOW_WITH_WARNING",
        target: "RECEIVER",
        reason: "malicious-link",
        message: "⚠️ This message may be suspicious",
        strike: false,
      });
    }
    // 🟠 4. Scam ML
    const scamResult = await checkScamML(text);
    console.log("⚠️ Scam ML model run...", scamResult.label);
    if (scamResult.label === "scam") {
      return res.json({
        action: "ALLOW_WITH_WARNING",
        target: "RECEIVER",
        reason: "malicious-link",
        message: "⚠️ This message may be unsafe",
        strike: false,
      });
    }
    // 🔵 5. Toxic ML (RUN ALWAYS except very small text)

    // ✅ CLEAN
    return res.json({
      action: "ALLOW",
      target: null,
      reason: "clean",
      message: null,
      strike: false,
    });
  } catch (err) {
    console.error(err);
    return res.json({ action: "ALLOW" });
  }
};
