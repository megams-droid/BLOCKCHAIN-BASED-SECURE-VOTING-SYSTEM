import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Boxes,
  ShieldCheck,
  Search,
  ArrowDown,
  Calendar,
  Key,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function BlockchainExplorerPage({ elections, selectedElectionId, onNavigate }) {
  const [activeElectionId, setActiveElectionId] = useState(selectedElectionId || (elections[0]?.election_id || 1));
  const [blockchainData, setBlockchainData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeElectionId) {
      loadBlockchain(activeElectionId);
    }
  }, [activeElectionId]);

  const loadBlockchain = async (id) => {
    setLoading(true);
    try {
      const data = await api.getBlockchain(id);
      setBlockchainData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const blocks = blockchainData?.blocks || [];
  const filteredBlocks = blocks.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(b.block_index).includes(term) ||
      b.current_hash.toLowerCase().includes(term) ||
      b.previous_hash.toLowerCase().includes(term) ||
      b.transaction_hash.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container" style={{ padding: '36px 24px 60px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Blockchain Ledger Explorer</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Inspect every block, cryptographic pointer, and transaction digest in the immutable ledger.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={activeElectionId}
            onChange={(e) => setActiveElectionId(Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto', minWidth: '240px' }}
          >
            {elections.map((el) => (
              <option key={el.election_id} value={el.election_id}>
                {el.election_name}
              </option>
            ))}
          </select>

          <button className="btn btn-primary" onClick={() => onNavigate('verification')}>
            <ShieldCheck size={16} /> Audit & Verify Chain
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={18} color="var(--text-light)" />
          <input
            type="text"
            placeholder="Search blocks by block index, SHA-256 hash, or transaction digest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ color: 'var(--text-muted)' }}>Fetching blocks from relational ledger...</div>
        </div>
      ) : filteredBlocks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>No blocks matching your search</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredBlocks.map((block, idx) => {
            const isGenesis = block.block_index === 0;

            return (
              <React.Fragment key={block.block_id}>
                <div className="card" style={{ borderLeft: isGenesis ? '4px solid #0d9488' : '4px solid #0284c7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isGenesis ? '#ccfbf1' : '#e0f2fe',
                          color: isGenesis ? '#0d9488' : '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.9rem',
                        }}
                      >
                        #{block.block_index}
                      </span>
                      <strong style={{ fontSize: '1.1rem' }}>
                        {isGenesis ? 'Genesis Block (Chain Root)' : `Block #${block.block_index}`}
                      </strong>
                      {isGenesis && <span className="badge badge-active">GENESIS</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Calendar size={13} />
                      <span>{new Date(block.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Hashes Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-light)', marginBottom: '3px' }}>
                        CURRENT BLOCK HASH (SHA-256)
                      </div>
                      <div className="hash-pill" style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}>
                        {block.current_hash}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-light)', marginBottom: '3px' }}>
                        PREVIOUS BLOCK HASH (PARENT LINK)
                      </div>
                      <div className="hash-pill" style={{ color: '#475569' }}>
                        {block.previous_hash}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-light)', marginBottom: '3px' }}>
                        TRANSACTION / BALLOT DIGEST
                      </div>
                      <div className="hash-pill" style={{ background: '#f8fafc', color: '#0d9488' }}>
                        {block.transaction_hash}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chain Link Indicator to next block */}
                {idx < filteredBlocks.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '-10px 0' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        boxShadow: 'var(--shadow-sm)',
                        zIndex: 2,
                      }}
                    >
                      <ArrowDown size={16} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
