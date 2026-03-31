import { useState } from "react";

export default function Composer() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [attachedMarket, setAttachedMarket] = useState(null);

  function handlePost() {
    if (!text.trim() && !image && !attachedMarket) return;

    console.log("POST:", { text, image, attachedMarket });

    setText("");
    setImage(null);
    setAttachedMarket(null);
  }

  return (
    <div className="section">
      <div className="user-post-row">
        <div className="avatar">JD</div>

        <div className="field">
          <textarea
            placeholder="Write something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>

      {attachedMarket && (
        <div className="attached-market-preview">
          <div className="attached-market-content">
            {attachedMarket.title}
          </div>
          <button
            className="detach-btn"
            onClick={() => setAttachedMarket(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="save-row">
        <div className="composer-btns">
          <button
            className="btn-attach"
            onClick={() => setAttachedMarket({ title: "Example Market" })}
          >
            Attach Market
          </button>

          <div className="btn-upload">
            <label htmlFor="file-upload">Images</label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <button className="btn-post" onClick={handlePost}>
          Post
        </button>
      </div>
    </div>
  );
}
