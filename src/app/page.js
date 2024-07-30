'use client';

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [answer, setAnswer] = useState({
    명칭: '',
    탄소배출량: '',
    기술범위: '',
    유효시작: '',
    유효종료: '',
    유효지역: ''
  });

  const handleProductNameChange = (e) => {
    setProductName(e.target.value);
  };

  const handleQuantityChange = (e) => {
    setQuantity(e.target.value);
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: productName, quantity: Number(quantity) }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setAnswer({
        명칭: data.명칭 || 'N/A',
        탄소배출량: data.탄소배출량 || 'N/A',
        기술범위: data.기술범위 || 'N/A',
        유효시작: data.유효시작 || 'N/A',
        유효종료: data.유효종료 || 'N/A',
        유효지역: data.유효지역 || 'N/A'
      });
    } catch (error) {
      console.error('Fetch error:', error);
      setAnswer({
        명칭: 'An error occurred while fetching the answer.',
        탄소배출량: 'N/A',
        기술범위: 'N/A',
        유효시작: 'N/A',
        유효종료: 'N/A',
        유효지역: 'N/A'
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Carbonomy 2Tier</h1>
      </div>
      <div className={styles.content}>
        <form onSubmit={handleQuestionSubmit}>
          <input
            type="text"
            value={productName}
            onChange={handleProductNameChange}
            placeholder="Product Name"
            className={styles.input}
          />
          <input
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="Quantity"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>Submit</button>
        </form>
        {answer.명칭 && (
          <div className={styles.answer}>
            <h2>Answer:</h2>
            <p><strong>명칭:</strong> {answer.명칭}</p>
            <p><strong>탄소배출량:</strong> {answer.탄소배출량}</p>
            <p><strong>기술범위:</strong> {answer.기술범위}</p>
            <p><strong>유효시작:</strong> {answer.유효시작}</p>
            <p><strong>유효종료:</strong> {answer.유효종료}</p>
            <p><strong>유효지역:</strong> {answer.유효지역}</p>
          </div>
        )}
      </div>
    </div>
  );
}
