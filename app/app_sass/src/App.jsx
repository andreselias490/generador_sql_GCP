import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Importa los estilos

function App() {
  const [description, setDescription] = useState('');
  const [sqlCode, setSqlCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); 

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!description.trim()) {
      setError("Por favor, describe la base de datos.");
      return;
    }

    setLoading(true); 
    setError(''); 

    try {
      const response = await axios.post('http://34.70.186.125/generate-sql', {
        description: description,
      });

      if (response.data.sqlCode) {
        setSqlCode(response.data.sqlCode);
      } else {
        setSqlCode("Error: No se pudo generar el código SQL.");
      }
    } catch (error) {
      console.error("Error al hacer la solicitud:", error);
      setError("Error al comunicarse con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Generador de SQL</h1>
      </header>
      <main className="content">
        <form onSubmit={handleSubmit}>
          <label>
            Describe la base de datos:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="5"
              required
              aria-label="Descripción de la base de datos"
              placeholder="Ejemplo: Crear base de datos para gestionar un inventario..."
            />
          </label>
          <small className="note">
            Nota: Por favor, comienza tu descripción con "Crear base de datos".
          </small>
          <button type="submit" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Generar SQL'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {sqlCode && (
          <div className="output">
            <h2>SQL Generado:</h2>
            <pre>{sqlCode}</pre>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Generador de SQL &copy; 2024. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default App;
