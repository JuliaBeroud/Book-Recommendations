import express from "express"
import mysql from "mysql2"
import cors from "cors"

const app = express()
app.use(cors())

const db = mysql.createConnection({
    host:"127.0.0.1",
    user:"root",
    password:"Sebobonono11!",
    port: 3306,
    database:"test"
})

app.use(express.json())

app.get("/", (req, res)=>{
    res.json("this is the backend")
})

app.get("/books", (req, res) => {
  const q = "SELECT * FROM Books";
  db.query(q, (err, data) => {
    if (err) {
      console.error("MySQL error:", err);
      return res.status(500).json(err);
    }
    return res.json(data);
  });
});


app.post("/books", (req, res) => {
    console.log(req.body)
  const q = "INSERT INTO Books (`title`, `desc`, `price`, `cover`) VALUES (?, ?, ?, ?)";
  const values = [req.body.title, req.body.desc, req.body.price, req.body.cover];

  db.query(q, values, (err, data) => {
    if (err) return res.json(err);
    return res.json("Book has been created successfully");
  });
});

app.delete("/books/:id", (req,res)=>{
    const bookId = req.params.id;
    const q = "DELETE FROM books WHERE id = ?"

    db.query(q,[bookId], (err,data)=>{
        if (err) return res.json(err);
        return res.json("Book has been deleted successfully");
    })
})

app.put("/books/:id", (req,res)=>{
    const bookId = req.params.id;
    const q = "UPDATE books SET `title` = ?, `desc` = ?, `price` = ?, `cover` = ? WHERE id = ?";

    const values = [req.body.title, req.body.desc, req.body.price, req.body.cover];

    db.query(q,[...values,bookId], (err,data)=>{
        if (err) return res.json(err);
        return res.json("Book has been updated successfully");
    })
})


app.listen(8800, ()=>{
    console.log("Connected to backend")
})