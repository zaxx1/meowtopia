const cron = require("node-cron");
const express = require("express");
const { configDotenv } = require("dotenv");
const { validateToken } = require("./func/CheckValidToken");
const { buyPlant } = require("./func/buyPlant");
const { farmPlant } = require("./func/farmPlant");
const { claimMission } = require("./func/ClaimMission");
const { upgradeAnimal } = require("./func/upgrade");
const fs = require("fs");
const readline = require("readline");
const path = require("path");

configDotenv();

const configPath = path.join(__dirname, "configs", "config.json");

// Helper functions
const readConfig = () => {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ tokens: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
};

const writeConfig = (data) => {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
};

const addToken = (name, token) => {
  const config = readConfig();
  config.tokens.push({ name, token });
  writeConfig(config);
};

const removeToken = (name) => {
  const config = readConfig();
  config.tokens = config.tokens.filter((t) => t.name !== name);
  writeConfig(config);
};

const listTokens = () => {
  const config = readConfig();
  if (config.tokens.length === 0) {
    console.log("Tidak ada token yang tersedia.");
    return [];
  }
  config.tokens.forEach((t, index) => {
    console.log(`${index + 1}. ${t.name}`);
  });
  return config.tokens;
};

// Interactive Menu
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const showMenu = () => {
  console.log("1. Jalankan bot");
  console.log("2. Tambah token");
  console.log("3. Hapus token");
  rl.question("Pilih opsi: ", (choice) => {
    switch (choice) {
      case "1":
        // Start the bot
        console.log("Jalankan bot...");
        startBot();
        break;
      case "2":
        rl.question("Masukkan nama token baru: ", (name) => {
          rl.question("Masukkan token: ", (token) => {
            addToken(name, token);
            console.log("Token berhasil ditambahkan.");
            showMenu();
          });
        });
        break;
      case "3":
        const tokens = listTokens();
        if (tokens.length > 0) {
          rl.question("Pilih nomor token yang ingin dihapus: ", (number) => {
            const index = parseInt(number, 10) - 1;
            if (index >= 0 && index < tokens.length) {
              const tokenToRemove = tokens[index];
              removeToken(tokenToRemove.name);
              console.log("Token berhasil dihapus.");
            } else {
              console.log("Nomor token tidak valid.");
            }
            showMenu();
          });
        } else {
          showMenu();
        }
        break;
      default:
        console.log("Opsi tidak valid.");
        showMenu();
        break;
    }
  });
};

// Start the server
const port = process.env.PORT || 103;
const app = express();

app.get("/", (req, res) => {
  res.send("API cron job server is running");
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  showMenu(); // Show the menu when the server starts
});

const startBot = () => {
  farmPlant();
  cron.schedule("*/12 * * * *", farmPlant);
  cron.schedule("0 * * * *", claimMission);
  cron.schedule("0 * * * *", upgradeAnimal);
};
