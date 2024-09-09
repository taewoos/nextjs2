import { useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';

export default function Home() {
  const [activityName, setActivityName] = useState('');
  const [region, setRegion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    // 환경 변수를 사용하여 API URL 설정
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    try {
      const result = await axios.post(`${apiUrl}/activities/`, {
        activity_name: activityName,
        region: region
      });
      setResponse(result.data);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <h1>Activity Finder</h1>
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="Enter activity name"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Enter region (optional)"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleSearch} disabled={loading} className={styles.button}>
          {loading ? 'Loading...' : 'Find Activity'}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {response && (
        <div className={styles.results}>
          <h2>Results:</h2>
          <pre className={styles.pre}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
