
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());

app.use(express.json());

const API_KEY =
"AIzaSyCWTVEUKyuuJ7BHNWP68YufOBx-B6A8t_E";

app.post("/chat", async (req, res) => {

    try{

        const response =
        await axios.post(

            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,

            {

                contents:[

                    {

                        parts:[

                            {

                                text:req.body.message

                            }

                        ]

                    }

                ]

            },

            {

                headers:{

                    "Content-Type":
                    "application/json"

                }

            }

        );

        const reply =
        response.data
        .candidates[0]
        .content.parts[0]
        .text;

        res.json({

            reply:reply

        });

    }

    catch(error){

        console.log(error.response?.data || error.message);

        res.json({

            reply:
            "Gemini API Error"

        });

    }

});

app.listen(3000, ()=>{

    console.log(
    "Gemini AI Server Running"
    );

});

setInterval(()=>{},1000);

