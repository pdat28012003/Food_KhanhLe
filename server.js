const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodapp";

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Item = mongoose.model("Item", itemSchema);

app.use(express.json());

// API get all items
app.get("/api/items", async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.json(items);
});

// API create item
app.post("/api/items", async (req, res) => {
  const { name, price } = req.body;
  if (!name) return res.status(400).json({ error: "Tên món ăn bắt buộc" });
  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice < 0)
    return res
      .status(400)
      .json({ error: "Giá bán phải là số hợp lệ và >= 0" });
  const item = new Item({ name: name.trim(), price: numericPrice });
  await item.save();
  res.status(201).json(item);
});

// API delete item
app.delete("/api/items/:id", async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Serve HTML
app.get("/", (req, res) => {
  res.send(`
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Danh sách món ăn</title>
<style>
body { font-family: sans-serif; margin: 20px; }
input, button { padding: 5px; margin: 5px; }
table { border-collapse: collapse; width: 100%; margin-top: 10px; }
th, td { border: 1px solid #ccc; padding: 5px; }
</style>
</head>
<body>
<h1>Danh sách món ăn</h1>
<input id="name" placeholder="Tên món ăn" />
<input id="price" type="number" placeholder="Giá bán" />
<button onclick="addItem()">Thêm món</button>
<table>
<thead><tr><th>#</th><th>Tên món</th><th>Giá bán</th><th></th></tr></thead>
<tbody id="list"></tbody>
</table>
<h3>Tổng tiền: <span id="total">0</span> VND</h3>
<script>
async function loadItems(){
  const res = await fetch('/api/items');
  const items = await res.json();
  const list = document.getElementById('list');
  list.innerHTML = '';
  let total = 0;
  items.forEach((it, i) => {
    total += it.price;
    list.innerHTML += '<tr><td>'+(i+1)+'</td><td>'+it.name+'</td><td>'+it.price+'</td><td><button onclick="delItem(\\''+it._id+'\\')">Xóa</button></td></tr>';
  });
  document.getElementById('total').innerText = total;
}
async function addItem(){
  const name = document.getElementById('name').value;
  const price = document.getElementById('price').value;
  await fetch('/api/items', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, price})});
  loadItems();
}
async function delItem(id){
  await fetch('/api/items/'+id, {method:'DELETE'});
  loadItems();
}
loadItems();
</script>
</body>
</html>
`);
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
