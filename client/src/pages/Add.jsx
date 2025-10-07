import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Add = () => {
  const navigate = useNavigate();

  // form state 
  const [book, setBook] = useState({
    title: "",
    desc: "",
    price: "",
    cover: "",
  });

  // upload UI state
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // text/number inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBook((prev) => ({ ...prev, [name]: value }));
  };

  // when user picks a file
  async function handleFilePicked(file) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      // send file to backend upload route
      const form = new FormData();
      form.append("image", file);

      const r = await fetch("http://localhost:8800/uploads", {
        method: "POST",
        body: form,
      });

      if (!r.ok) throw new Error("Upload failed");
      const { imageUrl } = await r.json();

      // save URL in the form state
      setBook((b) => ({ ...b, cover: imageUrl }));
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  // submit the book to existing /books endpoint
  const handleClick = async (e) => {
    e.preventDefault();
    if (uploading) return alert("Please wait for the image to finish uploading.");

    try {
      await axios.post("http://localhost:8800/books", {
        ...book,
        // ensure price is a number
        price: book.price === "" ? null : Number(book.price),
      });
      navigate("/");
    } catch (err) {
      console.log(err);
      alert("Failed to save book");
    }
  };

  return (
    <div className="form">
      <h1>Add New Book</h1>

      <input
        type="text"
        placeholder="title"
        onChange={handleChange}
        name="title"
        value={book.title}
        required
      />

      <input
        type="text"
        placeholder="desc"
        onChange={handleChange}
        name="desc"
        value={book.desc}
      />

      <input
        type="number"
        placeholder="price"
        onChange={handleChange}
        name="price"
        value={book.price}
      />

      {/* Cover button triggers hidden file input */}
      <button type="button" onClick={() => fileInputRef.current?.click()}>
        Cover
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFilePicked(e.target.files?.[0] || null)}
      />

      {/* preview + URL display */}
      {uploading && <div>Uploading…</div>}
      {preview && (
        <div style={{ marginTop: 8 }}>
          <img src={preview} alt="preview" style={{ maxWidth: 160 }} />
        </div>
      )}
      {book.cover && (
        <small style={{ display: "block", marginTop: 6 }}>
          Saved cover URL: {book.cover}
        </small>
      )}

      <button className="formButton" onClick={handleClick} style={{ marginTop: 12 }}>
        Add
      </button>
    </div>
  );
};

export default Add;
