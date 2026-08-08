const express = require("express");

const app = express();

const PORT = 5000;

app.get("/api/test", (req, res) => {
    res.json({
        message: "TaskFlow backend is working!"
    });
});

app.listen(PORT, () => {
    console.log(`TaskFlow server is running on port ${PORT}`);
});