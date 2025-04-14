'use client';

import React, { useEffect, useState } from 'react';

export const LoanCalculator = () => {
  const [jsonInput, setJsonInput] = useState(`{
    "products": [
      {
        "type": "pdl",
        "min_amount": 20000,
        "max_amount": 100000,
        "terms": [
          {
            "value": 14,
            "is_default": true,
            "interest_rate": 0.00104,
            "insurance_rate": null
          },
          {
            "value": 21,
            "interest_rate": 0.00104,
            "insurance_rate": 0.125
          }
        ]
      },
      {
        "type": "pdl",
        "min_amount": 105000,
        "max_amount": 150000,
        "terms": [
          {
            "value": 21,
            "interest_rate": 0.00104,
            "insurance_rate": 0.125
          }
        ]
      },
      {
        "type": "installment",
        "min_amount": 300000,
        "max_amount": 500000,
        "terms": [
          {
            "value": 3,
            "is_default": true,
            "interest_rate": 0.37,
            "insurance_rate": 0.2
          },
          {
            "value": 6,
            "interest_rate": 0.37,
            "insurance_rate": 0.2
          }
        ]
      },
      {
        "type": "installment",
        "min_amount": 550000,
        "max_amount": 1000000,
        "terms": [
          {
            "value": 6,
            "is_default": true,
            "interest_rate": 0.37,
            "insurance_rate": 0.2
          },
          {
            "value": 12,
            "interest_rate": 0.37,
            "insurance_rate": 0.2
          }
        ]
      },
      {
        "type": "installment",
        "min_amount": 1050000,
        "max_amount": 1500000,
        "terms": [
          {
            "value": 12,
            "interest_rate": 0.37,
            "insurance_rate": 0.2
          }
        ]
      }
    ],
    "default_amount": 100000
  }`);

  const [productConfig, setProductConfig] = useState([]);
  const [loanAmount, setLoanAmount] = useState(0);
  const [availableTerms, setAvailableTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [currentType, setCurrentType] = useState('pdl');
  const [validSteps, setValidSteps] = useState([]);
  const [calculatedValue, setCalculatedValue] = useState(null);
  const [principalValue, setPrincipalValue] = useState(null);
  const [insuranceAmount, setInsuranceAmount] = useState(null);
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);
  const [iban, setIban] = useState('');


  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setProductConfig(parsed.products);
      setLoanAmount(parsed.default_amount);

      const steps = parsed.products.flatMap(p => {
        const step = p.type === 'installment' ? 50000 : 5000;
        const values = [];
        for (let i = p.min_amount; i <= p.max_amount; i += step) {
          values.push(i);
        }
        return values;
      });

      setValidSteps([...new Set(steps)].sort((a, b) => a - b));
    } catch (err) {
      console.error('Некорректный JSON');
    }
  }, [jsonInput]);

  useEffect(() => {
    const product = productConfig.find(
      p => loanAmount >= p.min_amount && loanAmount <= p.max_amount
    );

    if (!product) {
      setAvailableTerms([]);
      setSelectedTerm(null);
      setCurrentType('');
      setCalculatedValue(null);
      setPrincipalValue(null);
      setInsuranceAmount(null);
      return;
    }

    const terms = product.terms || [];
    setAvailableTerms(terms);
    setCurrentType(product.type);

    const termValues = terms.map(t => t.value);
    const defaultTerm = terms.find(t => t.is_default)?.value || terms[0].value;

	if (!termValues.includes(selectedTerm) || selectedTerm !== defaultTerm) {
	  setSelectedTerm(defaultTerm);
	}


  }, [loanAmount, productConfig]);

useEffect(() => {
  const product = productConfig.find(
    p => loanAmount >= p.min_amount && loanAmount <= p.max_amount
  );
  if (!product || !selectedTerm) {
    setCalculatedValue(null);
    setPrincipalValue(null);
    setInsuranceAmount(null);
    return;
  }
  const termObj = product.terms.find(t => t.value === selectedTerm);
  if (!termObj) {
    setCalculatedValue(null);
    setPrincipalValue(null);
    setInsuranceAmount(null);
    return;
  }

  const interestRate = termObj.interest_rate;
  const insuranceRate = termObj.insurance_rate;
  const hasInsurance = insuranceRate !== null;

  // 👇 Добавлено только это
  setInsuranceEnabled(hasInsurance);

  const insurance = hasInsurance ? loanAmount * insuranceRate : 0;
  const principal = loanAmount + insurance;
  setPrincipalValue(principal);
  setInsuranceAmount(hasInsurance ? insurance : null);

  if (product.type === 'pdl') {
    const result = principal + principal * termObj.value * interestRate;
    setCalculatedValue(result);
  } else {
    const monthlyRate = interestRate / 12;
    const termMonths = termObj.value;
    const result = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
                   (Math.pow(1 + monthlyRate, termMonths) - 1);
    setCalculatedValue(result);
  }
}, [selectedTerm, loanAmount, productConfig]);


  const handleLoanChange = (e) => {
    const value = Number(e.target.value);
    const closest = validSteps.reduce((prev, curr) => (
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    ));
    setLoanAmount(closest);
  };

  const handleTermClick = (term) => {
    setSelectedTerm(term);
  };
  
	const handleInsuranceToggle = () => {
	  const newValue = !insuranceEnabled;
	  setInsuranceEnabled(newValue);

	  if (!newValue) {
		const validProducts = productConfig.filter(p =>
		  p.terms.some(t => t.insurance_rate === null)
		);

		if (validProducts.length > 0) {
		  const bestProduct = validProducts.reduce((a, b) =>
			b.max_amount > a.max_amount ? b : a
		  );
		  const nullInsuranceTerm = bestProduct.terms.find(t => t.insurance_rate === null);

		  if (nullInsuranceTerm) {
			setLoanAmount(bestProduct.max_amount);
			setSelectedTerm(nullInsuranceTerm.value);
		  }
		}
	  }
	};



  const minAmount = Math.min(...validSteps);
  const maxAmount = Math.max(...validSteps);
  const step = 1;

  return (
    <div className="page-wrapper">
      <div className="left-column">
        <label className="input-label">JSON-конфигурация продуктов</label>
        <textarea
          className="json-input"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
      </div>

      <div className="right-column">
        <div className="loan-calculator">
          <label className="input-label">Вы получите</label>
          <input
            type="text"
            value={`${loanAmount.toLocaleString()} ₸`}
            readOnly
            className="loan-input"
          />
          <div className="range-container">
            <input
              type="range"
              min={minAmount}
              max={maxAmount}
              step={step}
              value={loanAmount}
              onChange={handleLoanChange}
              className="range-slider"
            />
            <div className="range-labels">
              <span>от {new Intl.NumberFormat('ru-RU').format(minAmount)} ₸</span>
              <span>до {new Intl.NumberFormat('ru-RU').format(maxAmount)} ₸</span>
            </div>
          </div>

          <div className="term-row">
            <label className="input-label">Срок микрокредита</label>
            <div className="term-container">
				{availableTerms.length === 1 ? (
				  <div className="term-static">
					{availableTerms[0].value} {currentType === 'installment' ? 'мес' : 'дней'}
				  </div>
				) : (
				  availableTerms.map(term => (
					<div
					  key={term.value}
					  onClick={() => handleTermClick(term.value)}
					  className={`term-box ${selectedTerm === term.value ? 'active' : ''}`}
					>
					  {term.value} {currentType === 'installment' ? 'мес' : 'дней'}
					</div>
				  ))
				)}
            </div>
          </div>

          <div className="amount-result-row">
            <span className="input-label">Сумма микрокредита</span>
            <span className="amount-result-value">
              {principalValue !== null && `${Math.round(principalValue).toLocaleString()} ₸`}
            </span>
          </div>

          <div className="insurance-note" style={{ visibility: insuranceAmount ? 'visible' : 'hidden' }}>
            страховка {insuranceAmount ? Math.round(insuranceAmount).toLocaleString() : ''} ₸
          </div>

          <div className="amount-result-row">
            <span className="input-label">
              {currentType === 'installment' ? 'Ежемесячный платеж' : 'Сумма к оплате'}
            </span>
            <span className="amount-result-value">
              {calculatedValue !== null ? `${Math.round(calculatedValue).toLocaleString()} ₸` : '—'}
            </span>
          </div>
			  
<label className="checkbox-label">
  Страхование жизни
  <input
    type="checkbox"
    checked={insuranceEnabled}
    onChange={handleInsuranceToggle}
    disabled={
      availableTerms.find(t => t.value === selectedTerm)?.insurance_rate === null && !insuranceEnabled
    }
    style={{ marginLeft: '8px' }}
  />
</label>

{loanAmount > 500000 && (
  <div className="iban-input-row">
    <label className="input-label">Для продолжения введите IBAN</label>
    <input
      type="text"
      className="iban-input"
      placeholder="KZ..."
      value={iban}
      onChange={(e) => setIban(e.target.value)}
    />
  </div>
)}


<button
  className="submit-button"
  onClick={() => {}}
  disabled={loanAmount > 500000 && iban.trim() === ''}
>
  Продолжить
</button>

        </div>
      </div>
    </div>
  );
};