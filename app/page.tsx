// src/app/page.js
import React from 'react';
import { LoanCalculator } from '../components/LoanCalculator.js';

export default function Home() {
  return (
    <div className="container">
      <LoanCalculator />
    </div>
  );
}
