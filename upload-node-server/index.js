const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const crypto = require('crypto');

const PORT = 8000;
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get("/test", (req, res) => {
  console.log({ req });
  res.send("Olá mundo!");
});

const mergeChunks = async (fileName, totalChunks) => {
  const chunkDir = __dirname + "/chunks";
  const mergedFilePath = __dirname + "/merged_files";

  if (!fs.existsSync(mergedFilePath)) {
    fs.mkdirSync(mergedFilePath);
  }

  const writeStream = fs.createWriteStream(`${mergedFilePath}/${fileName}`);
  for (let i = 0; i < totalChunks; i++) {
    const chunkFilePath = `${chunkDir}/${fileName}.part_${i}`;
    const chunkBuffer = await fs.promises.readFile(chunkFilePath);
    writeStream.write(chunkBuffer);
    fs.unlinkSync(chunkFilePath); // Delete the individual chunk file after merging
  }

  writeStream.end();
  console.log("Partes unidas com sucesso!");
};

app.post("/upload", upload.single("file"), async (req, res) => {

  console.log("Hit");
  const chunk = req.file.buffer;
  const chunkNumber = Number(req.body.chunkNumber); // Sent from the client
  const totalChunks = Number(req.body.totalChunks); // Sent from the client
  
  const fileName = req.body.originalname;

  const chunkDir = __dirname + "/chunks"; // Directory to save chunks

  if (!fs.existsSync(chunkDir)) {
    fs.mkdirSync(chunkDir);
  }

  const chunkFilePath = `${chunkDir}/${fileName}.part_${chunkNumber}`;

  try {
    await fs.promises.writeFile(chunkFilePath, chunk);
    console.log(`Parte ${chunkNumber + 1}/${totalChunks} salva`);

    if (chunkNumber === totalChunks - 1) {
      // If this is the last chunk, merge all chunks into a single file
      await mergeChunks(fileName, totalChunks);
      console.log("Arquivo completo enviado com sucesso!");
    }

    res.status(200).json({ message: "Parte recebida com sucesso" });
  } catch (error) {
    console.error("Erro ao receber parte:", error);
    res.status(500).json({ error: "Erro ao receber parte" });
  }
});

app.listen(PORT, () => {
  console.log(`App escutando a porta ${PORT}`);
});
