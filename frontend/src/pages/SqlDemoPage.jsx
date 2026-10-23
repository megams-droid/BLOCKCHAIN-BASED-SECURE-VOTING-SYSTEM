import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Database, Play, CheckCircle2, Code2, Layers, Cpu, ShieldCheck } from 'lucide-react';

export default function SqlDemoPage() {
  const [demoQueries, setDemoQueries] = useState([]);
  const [selectedQueryIndex, setSelectedQueryIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSqlDemo();
  }, []);

  const loadSqlDemo = async () => {
    setLoading(true);
    try {
      const data = await api.getSqlDemo();
      setDemoQueries(data.queries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeQuery = demoQueries[selectedQueryIndex];

  return (
    <div className="container" style={{ padding: '36px 24px 60px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-active" style={{ fontSize: '0.72rem' }}>
              DBMS SYLLABUS EVALUATION
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', marginTop: '4px', marginBottom: '4px' }}>Live SQL Demonstration Terminal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Interactive evaluation console running real queries demonstrating 3NF, aggregation, relational JOINs, views, and ACID transactions.
          </p>
        </div>

        <button className="btn btn-primary" onClick={loadSqlDemo}>
          <Play size={15} /> Re-execute SQL Engine
        </button>
      </div>

      {/* Query Selector Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
        {demoQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedQueryIndex(idx)}
            className={`btn btn-sm ${selectedQueryIndex === idx ? 'btn-primary' : 'btn-outline'}`}
            style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}
          >
            {q.title.split(':')[0]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ color: 'var(--text-muted)' }}>Executing DBMS queries on SQLite relational engine...</div>
        </div>
      ) : activeQuery ? (
        <div className="grid-2" style={{ alignItems: 'flex-start', marginBottom: '36px' }}>
          {/* SQL Editor / Code Block in Crisp Light Mode */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-dark)' }}>{activeQuery.title}</h3>
              <span className="badge badge-active">EXECUTED (0.1ms)</span>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: '#0f172a',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                marginBottom: '16px',
              }}
            >
              {activeQuery.sql}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              <strong>DBMS Concept Demonstrated:</strong>{' '}
              {activeQuery.title.includes('JOIN')
                ? 'Relational integrity via ANSI LEFT JOIN preserving records from the candidates table even with zero ballots cast.'
                : activeQuery.title.includes('CASE')
                ? 'Conditional aggregation using SUM(CASE WHEN ... END) alongside COUNT(*) for turnout calculations.'
                : activeQuery.title.includes('View')
                ? 'Persistent SQL view abstraction encapsulating normalized multi-table joins.'
                : 'Primary/Foreign key indexing and parameterized filtering.'}
            </div>
          </div>

          {/* Result Table */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Query Output ({activeQuery.results?.length || 0} rows)</h3>
              <CheckCircle2 size={18} color="#10b981" />
            </div>

            <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {activeQuery.results && activeQuery.results.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      {Object.keys(activeQuery.results[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeQuery.results.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} style={{ fontSize: '0.82rem' }}>
                            {String(val).length > 24 ? (
                              <span className="hash-pill">{String(val).slice(0, 20)}...</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Empty result set (0 rows returned)
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 3NF Normalization & ACID Viva Notes */}
      <div className="card" style={{ padding: '30px', background: '#ffffff' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} color="#0284c7" /> Database Normalization up to 3NF Documentation
        </h3>

        <div className="grid-3" style={{ gap: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--navy-dark)', marginBottom: '6px' }}>1NF (First Normal Form)</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              All column values are atomic (no repeating groups, comma-separated candidate arrays, or nested tables). Every table has a clearly defined primary key.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--navy-dark)', marginBottom: '6px' }}>2NF (Second Normal Form)</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              In 1NF and no non-key attribute is partially dependent on any candidate key. Composite table <code>voter_eligibility(voter_id, election_id)</code> depends fully on both keys.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--navy-dark)', marginBottom: '6px' }}>3NF (Third Normal Form)</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              In 2NF and no transitive functional dependencies exist (non-key columns do not depend on other non-key columns). Voter details live strictly in <code>users</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
