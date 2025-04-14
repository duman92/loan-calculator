// src/app/page.js
import React from 'react';
import { LoanCalculator } from './components/ui/LoanCalculator';

export default function Home() {
  return (
    <div className="container">
      <LoanCalculator />
    </div>
  );
}
