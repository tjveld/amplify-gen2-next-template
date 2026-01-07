
"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [books, setBooks] = useState<Array<Schema["Book"]["type"]>>([]);

  useEffect(() => {
    // Live list with real-time updates (same pattern as your Todo example)
    const sub = client.models.Book.observeQuery().subscribe({
      next: ({ items }) => setBooks([...items]),
      error: (err) => console.error("observeQuery(Book) error:", err),
    });

    return () => sub.unsubscribe();
  }, []);

  async function createBook() {
    // Required fields in your schema: id, title, author
    const title = window.prompt("Book title (required)")?.trim();
    if (!title) return;

    const author = window.prompt("Author (required)")?.trim();
    if (!author) return;

    const isbn = window.prompt("ISBN (optional)")?.trim() || undefined;
    const genresRaw = window.prompt('Genres (optional, comma-separated e.g. "Fiction, Fantasy")')?.trim();
    const genres = genresRaw ? genresRaw.split(",").map((g) => g.trim()).filter(Boolean) : undefined;
    const description = window.prompt("Description (optional)")?.trim() || undefined;
    const coverUrl = window.prompt("Cover URL (optional)")?.trim() || undefined;
    const availableRaw = window.prompt('Available? (optional: "yes"/"no")')?.toLowerCase().trim();
    const available = availableRaw === "yes" ? true : availableRaw === "no" ? false : undefined;
    const ratingRaw = window.prompt("Rating (optional, e.g. 8.5)")?.trim();
    const rating = ratingRaw ? Number(ratingRaw) : undefined;

    // Since your schema requires an explicit id:
    const id = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      await client.models.Book.create({
        id,
        title,
        author,
        isbn,
        genres,
        description,
        coverUrl,
        available,
        rating,
      });
    } catch (err) {
      console.error("Create Book failed:", err);
      alert("Failed to create book. See console for details.");
    }
  }
  return (
    <main>
      <h1>📚 LocalBooks Library</h1>
      <button onClick={createBook}>Add Book</button>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>Title</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>Author</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>ISBN</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>Genres</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>Rating</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>Available</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td style={{ padding: "8px" }}>{book.title}</td>
              <td style={{ padding: "8px" }}>{book.author}</td>
              <td style={{ padding: "8px" }}>{book.isbn || "-"}</td>
              <td style={{ padding: "8px" }}>
                {book.genres && book.genres.length > 0 ? book.genres.join(", ") : "-"}
              </td>
              <td style={{ padding: "8px" }}>
                {typeof book.rating === "number" ? book.rating : "-"}
              </td>
              <td style={{ padding: "8px" }}>
                {typeof book.available === "boolean"
                  ? book.available
                    ? "Available"
                    : "Unavailable"
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}