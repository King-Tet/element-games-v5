// src/app/t/calculator/page.tsx
'use client'; // This is an interactive component

import React, { useState } from 'react';
import styles from './CalculatorPage.module.css';

const CalculatorPage: React.FC = () => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState<boolean>(false);

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplayValue('0.');
      setWaitingForSecondOperand(false);
      return;
    }
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const clearDisplay = () => {
    setDisplayValue('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (operator && waitingForSecondOperand) {
      setOperator(nextOperator);
      return;
    }

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = performCalculation();
      setDisplayValue(String(result));
      setFirstOperand(result);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  const performCalculation = (): number => {
    if (firstOperand === null || operator === null) return parseFloat(displayValue);

    const secondOperand = parseFloat(displayValue);
    switch (operator) {
      case '+': return firstOperand + secondOperand;
      case '-': return firstOperand - secondOperand;
      case '*': return firstOperand * secondOperand;
      case '/': return secondOperand === 0 ? NaN : firstOperand / secondOperand; // Handle division by zero
      default: return secondOperand;
    }
  };

  const handleEquals = () => {
    if (operator === null || firstOperand === null) return; // Nothing to calculate

    const result = performCalculation();
     if (isNaN(result)) {
        setDisplayValue('Error');
     } else {
        // Format result nicely if needed (e.g., limit decimal places)
        setDisplayValue(String(Number(result.toFixed(10)))); // Avoid floating point issues, limit precision
     }
    setFirstOperand(null); // Reset for next calculation chain
    setOperator(null);
    setWaitingForSecondOperand(true); // Allow starting new number after '='
  };

  return (
    <div className={styles.calculatorContainer}>
      <h1>Calculator</h1>
      <div className={styles.display}>{displayValue}</div>
      <div className={styles.keypad}>
        {/* Row 1 */}
        <button onClick={clearDisplay} className={styles.clear}>AC</button>
        <button onClick={() => handleOperator('/')} className={styles.operator}>÷</button>
        <button onClick={() => handleOperator('*')} className={styles.operator}>×</button>
        <button onClick={() => handleOperator('-')} className={styles.operator}>−</button>

         {/* Row 2 */}
         <button onClick={() => inputDigit('7')}>7</button>
         <button onClick={() => inputDigit('8')}>8</button>
         <button onClick={() => inputDigit('9')}>9</button>
         <button onClick={() => handleOperator('+')} className={styles.operator} style={{gridRow: 'span 2'}}>+</button> {/* Taller '+' button */}

        {/* Row 3 */}
        <button onClick={() => inputDigit('4')}>4</button>
        <button onClick={() => inputDigit('5')}>5</button>
        <button onClick={() => inputDigit('6')}>6</button>
        {/* '+' takes this spot */}

        {/* Row 4 */}
        <button onClick={() => inputDigit('1')}>1</button>
        <button onClick={() => inputDigit('2')}>2</button>
        <button onClick={() => inputDigit('3')}>3</button>
        <button onClick={handleEquals} className={styles.equals} style={{gridRow: 'span 2'}}>=</button> {/* Taller '=' button */}

        {/* Row 5 */}
         <button onClick={() => inputDigit('0')} style={{gridColumn: 'span 2'}}>0</button> {/* Wider '0' button */}
        <button onClick={inputDecimal}>.</button>
        {/* '=' takes this spot */}
      </div>
    </div>
  );
};

export default CalculatorPage;