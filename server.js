const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));

app.use(express.json());

// API key is now safe - stored in Render environment variables
const API_KEY = process.env.GEMINI_API_KEY;

app.get("/", (req, res) => {
    res.json({ status: "Smart Navio AI Server is Running!" });
});

app.post("/chat", async (req, res) => {

    try {

        if (!req.body.message) {
            return res.json({ reply: "No message received." });
        }

        if (!API_KEY) {
            return res.json({ reply: "API key not configured." });
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: req.body.message
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const reply =
            response.data.candidates[0].content.parts[0].text;

        res.json({ reply: reply });

    } catch (error) {

        console.log("=== GEMINI ERROR ===");
        console.log("Status:", error.response?.status);
        console.log("Message:", JSON.stringify(error.response?.data));

        const errorMsg =
            error.response?.data?.error?.message || error.message;

        res.json({
            reply: "Error: " + errorMsg
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Smart Navio AI Server Running on port " + PORT);
});
