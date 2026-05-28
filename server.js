const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));

app.use(express.json());

const API_KEY = process.env.GROQ_API_KEY;

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
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: req.body.message
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const reply = response.data.choices[0].message.content;

        res.json({ reply: reply });

    } catch (error) {

        console.log("=== GROQ ERROR ===");
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
