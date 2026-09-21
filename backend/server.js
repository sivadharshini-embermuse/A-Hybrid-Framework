const express = require("express");
const cors = require("cors");
const analysisRoutes = require("./routes/analysisRoutes");
const mlRoutes = require("./routes/mlRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/analysis", analysisRoutes);



app.use(
  "/api/ml",
  mlRoutes
);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});