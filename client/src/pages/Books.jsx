import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8800";
const toCoverSrc = (cover) =>
  !cover ? "" : cover.startsWith("http") ? cover : `${API_BASE}${cover}`;

const Books = () => {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        const res = await axios.get(`${API_BASE}/books`);
        setBooks(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchAllBooks();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/books/${id}`);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <h1>Julia's Book Recommendations</h1>
      <div className="books">
        {books.map((book) => (
          <div className="book" key={book.id}>
            {book.cover && (
              <img
                src={toCoverSrc(book.cover)}
                alt={`${book.title} cover`}
                style={{
                  width: 160,
                  height: 220,
                  objectFit: "cover",
                  borderRadius: 6,
                  display: "block",
                }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <h2>{book.title}</h2>
            <p>{book.desc}</p>
            <span>{book.price}</span>
            <button className="delete" onClick={() => handleDelete(book.id)}>
              Delete
            </button>
            <button className="update">
              <Link to={`/update/${book.id}`}>Update</Link>
            </button>
          </div>
        ))}
      </div>
      <button className="newBook">
        <Link to="/add">Add a new book</Link>
      </button>
    </div>
  );
};

export default Books;
