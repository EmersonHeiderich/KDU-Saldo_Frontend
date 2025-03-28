// src/pages/Products/components/ProductMatrix.tsx

import React from 'react';
import styles from '../Products.module.css';
// Import the specific API interfaces from the service
import { ApiProductMatrix, ApiMatrixCell, getStatusClass } from '../../../services/productService';

interface ProductMatrixProps {
  data: ApiProductMatrix | null; // Expect the backend structure directly
  onCellClick: (colorCode: string, size: string) => void;
}

const ProductMatrixComponent: React.FC<ProductMatrixProps> = ({ data, onCellClick }) => {
  // --- GUARD CLAUSES ---
  if (!data) {
    console.log("ProductMatrixComponent: No data received.");
    // Render nothing or a placeholder if no data
    return null; // Or return a message like <p>No matrix data available.</p>
  }

  // Access properties directly using snake_case as defined in ApiProductMatrix
  const { colors, sizes, values } = data;

  // More robust checks
  if (!Array.isArray(colors) || !Array.isArray(sizes) || typeof values !== 'object' || values === null) {
     console.error("ProductMatrixComponent: Invalid data structure received.", data);
     return <div className={styles.errorState}><p>Erro ao carregar a estrutura da matriz.</p></div>;
  }

  if (colors.length === 0 || sizes.length === 0) {
      console.log("ProductMatrixComponent: No colors or sizes found.");
      // Optionally return a message if needed, or let the table render empty
      // return <div className={styles.noData}><p>Não há cores ou tamanhos definidos.</p></div>;
  }
  // --- END GUARD CLAUSES ---

  return (
    <div className={styles.matrixContainer}>
      <table className={styles.matrixTable}>
        <thead>
          <tr>
            <th className={styles.colorHeader}>Cor / Tamanho</th>
            {sizes.map(size => (
              <th key={`header-${size}`}>{size}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {colors.map(color => {
            const { code, name } = color;

            // Handle cases where code might be missing (though unlikely based on backend)
            if (!code) {
                console.warn("Skipping color row due to missing code:", color);
                return null;
            }

            const colorValues = values[code]; // Access values for this specific color code

            return (
              <tr key={`row-${code}`}>
                <td className={styles.colorCell}>{name || code}</td> {/* Use name, fallback to code */}
                {sizes.map(size => {
                  // Use optional chaining for potentially missing size entry
                  const cellData: ApiMatrixCell | null | undefined = colorValues?.[size];
                  const key = `cell-${code}-${size}`;

                  if (cellData) {
                    const { value, status, product_code } = cellData;
                    const statusClass = getStatusClass(status);

                    return (
                      <td
                        key={key}
                        className={`${styles.balanceCell} ${styles[statusClass] || ''}`}
                        onClick={() => onCellClick(code, size)} // Pass code and size
                        title={`Cód. SKU: ${product_code ?? 'N/A'}`}
                      >
                        {value ?? 0} {/* Display 0 if value is null/undefined */}
                      </td>
                    );
                  } else {
                    // Render an empty/placeholder cell if no data exists
                    return (
                      <td
                        key={key}
                        className={styles.emptyCell}
                        // Optionally add onClick for empty cells if needed
                        // onClick={() => console.log(`Clicked empty cell: ${code} / ${size}`)}
                      >
                        -
                      </td>
                    );
                  }
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductMatrixComponent;