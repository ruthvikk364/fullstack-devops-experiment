"use client";

const FAST_API = process.env.NEXT_PUBLIC_FASTAPI_API!;
const NEST_API = process.env.NEXT_PUBLIC_NEST_API!;

import { useEffect, useState } from "react";

export default function Home() {
  const [nestData, setNestData] = useState("");
  const [fastData, setFastData] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_NEST_API}`)
      .then(res => res.json())
      .then(data => setNestData(data.message));


    fetch(`${process.env.NEXT_PUBLIC_FASTAPI_API}/api`)
      .then(res => res.json())
      .then(data => setFastData(data.message));
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