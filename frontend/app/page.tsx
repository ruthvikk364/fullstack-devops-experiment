"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [nestData, setNestData] = useState("");
  const [fastData, setFastData] = useState("");

  useEffect(() => {
    fetch("/api/nest")
      .then((res) => res.json())
      .then((data) => setNestData(data.message ?? ""));

    fetch("/api/fastapi")
      .then((res) => res.json())
      .then((data) => setFastData(data.message ?? ""));
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Full Stack DevOps Test</h1>
      <h2>NestJS Response:</h2>
      <p>{nestData}</p>
      <h2>FastAPI Response:</h2>
      <p>{fastData}</p>
    </div>
  );
}