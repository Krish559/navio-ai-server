
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const admin = require("firebase-admin");


const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));

app.use(express.json());

const API_KEY = process.env.GROQ_API_KEY;
const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const SYSTEM_PROMPT = `
You are Smart Navio AI Assistant.

Answer only Smart Navio, AI, sensors, GPS, Bluetooth,
TensorFlow Lite, accessibility and navigation questions.

Keep replies short (2–5 lines) unless the user asks for details.

For unrelated topics reply:
"Please ask only about the Smart Navio Stick project and smart navigation technologies 😊"

Developer:
KRISH.S (23S025)

Guide:
Dr. C. Veeramani

Team:
KRISH.S and Hariharan AC
`;
const chatHistories = {};
let freePool = 400000;
let premiumPool = 100000;

async function loadPools() {

    const doc = await db
        .collection("pools")
        .doc("main")
        .get();

    if (doc.exists) {

        const data = doc.data();

        freePool = data.freePool;
        premiumPool = data.premiumPool;

        console.log("Pools loaded from Firestore");
        console.log("Free Pool:", freePool);
        console.log("Premium Pool:", premiumPool);
    }
}

async function checkDailyReset() {

    const today =
        new Date().toISOString().split("T")[0];

    const doc = await db
        .collection("pools")
        .doc("main")
        .get();

    const data = doc.data();

    if (data.lastReset !== today) {

        freePool = 400000;
        premiumPool = 100000;

       await db
    .collection("pools")
    .doc("main")
    .set({
        freePool,
        premiumPool,
        lastReset: today
    }, { merge: true });

        console.log("Daily pools reset");
    }
}

const FREE_STOP_LIMIT = 50000;
const PREMIUM_STOP_LIMIT = 10000;

app.get("/", (req, res) => {
    res.json({
        status: "Smart Navio AI Server is Running!"
    });
});

app.post("/chat", async (req, res) => {

    try {
        await checkDailyReset();
        const userType = req.body.userType || "free";

        if (
    userType === "free" &&
    freePool <= FREE_STOP_LIMIT
) {
    return res.json({
        reply:
        "🚫 Free AI Unavailable Today\n\nDaily free quota reached."
    });
}

if (
    userType === "premium" &&
    premiumPool <= PREMIUM_STOP_LIMIT
) {
    return res.json({
        reply:
        "🚫 Premium AI Unavailable Today\n\nPremium quota reached."
    });
}

        if (!req.body.message) {
            return res.json({
                reply: "No message received."
            });
        }

        if (!API_KEY) {
            return res.json({
                reply: "API key not configured."
            });
        }

        const sessionId =
            req.body.sessionId || "default";

        if (!chatHistories[sessionId]) {
            chatHistories[sessionId] = [];
        }

        chatHistories[sessionId].push({
            role: "user",
            content: req.body.message
        });

        if (chatHistories[sessionId].length > 4) {
    chatHistories[sessionId] =
        chatHistories[sessionId].slice(-4);
}

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT
                    },
                    ...chatHistories[sessionId]
                ],
                temperature: 0.6,
                max_tokens: 200
            },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const reply =
            response.data.choices[0].message.content;

        const TOKENS_PER_CHAT = 200;

if(userType === "free"){

    freePool -= TOKENS_PER_CHAT;

}else{

    premiumPool -= TOKENS_PER_CHAT;

}
        await db
    .collection("pools")
    .doc("main")
    .update({
        freePool,
        premiumPool,
        lastReset: new Date().toISOString().split("T")[0]
    });
       
        console.log("Free Pool:", freePool);
console.log("Premium Pool:", premiumPool);

        chatHistories[sessionId].push({
            role: "assistant",
            content: reply
        });

        res.json({ reply: reply });

    } catch (error) {

        console.log("===== GROQ ERROR =====");
        console.log("Status:", error.response?.status);
        console.log("Message:", JSON.stringify(error.response?.data));

        const errorMsg =
            error.response?.data?.error?.message ||
            error.message;

        res.json({
            reply: "Error: " + errorMsg
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {

    await loadPools();

    console.log("=================================");
    console.log(" Smart Navio AI Server Running ");
    console.log(" Port:", PORT);
    console.log("=================================");
});
